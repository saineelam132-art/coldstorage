"""Turns the digital-twin year run into 'what every sensor reads now'.

The year simulation (twin/simulate.py) is run ONCE when the server starts (about 1 s).
For any simulated time t we look up the 5-minute step and add the extra values that come
straight from engine formulas (doorway air speed, stack pressure, heat entering now,
backup time). Nothing here is random or decorative.
"""
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

from engine import loads, psychro, pv, r290, shelf_life
from engine.pcm_slab import simulate_slab
from engine.config import load_config, load_crops
from engine.pcm import PCMBattery
from twin.simulate import daily_poa_kWh, door_seconds, simulate
from twin.weather import load_weather

ROOT = Path(__file__).resolve().parent.parent
SIM_LABEL = "Simulated – digital twin using real Visakhapatnam weather"
G = 9.81


def _strip(obj):
    if isinstance(obj, dict):
        return {k: _strip(v) for k, v in obj.items() if not k.startswith("_")}
    if isinstance(obj, list):
        return [_strip(v) for v in obj]
    return obj


def geometry(cfg):
    """Everything the 3D model needs, derived from design.json (metres)."""
    ch, pvc = cfg["chamber"], cfg["pv"]
    t = ch["insulation_thickness_m"]
    n_mod = math.ceil(pvc["rated_kWp"] * 1000 / pvc["module_W"] - 1e-9)
    rows = pvc["module_rows"]
    cols = math.ceil(n_mod / rows)
    return {
        "inner": [ch["width_m"], ch["height_m"], ch["length_m"]],          # x, y, z
        "wall_t": t,
        "outer": [ch["width_m"] + 2 * t, ch["height_m"] + 2 * t, ch["length_m"] + 2 * t],
        "door": [cfg["door"]["width_m"], cfg["door"]["height_m"]],
        "pv": {"modules": n_mod, "rows": rows, "cols": cols, "module_W": pvc["module_W"],
               "module_w": pvc["module_width_m"], "module_l": pvc["module_length_m"],
               "tilt_deg": pvc["tilt_deg"], "azimuth_deg": pvc["azimuth_deg"],
               "rated_kWp": pvc["rated_kWp"], "array_kWp": n_mod * pvc["module_W"] / 1000,
               "low_edge_above_roof_m": pvc["canopy_low_edge_above_roof_m"]},
        "pcm": {"mass_kg": cfg["pcm"]["mass_kg"], "area_m2": cfg["pcm"]["slab_area_m2"],
                "thickness_mm": 1000 * cfg["pcm"]["mass_kg"] / (cfg["pcm"]["density_kg_m3"] * cfg["pcm"]["slab_area_m2"])},
    }


class TwinState:
    def __init__(self, cfg=None):
        self.cfg = cfg or load_config()
        self.crops = load_crops()
        self.weather = load_weather(cfg=self.cfg)
        self.door = door_seconds(self.cfg, self.weather)
        self.summary, self.df = simulate(self.cfg, self.weather, door_secs=self.door)
        self.dt = float(self.cfg["simulation"]["dt_s"])
        self.n = len(self.df)
        self.t0 = self.df.index[0]
        self.year_s = self.n * self.dt
        dp = daily_poa_kWh(self.weather)
        dc = self.cfg["day_classes"]
        self.day_class = np.where(dp.values >= dc["sunny_min_kWh_m2"], "sunny",
                                  np.where(dp.values >= dc["cloudy_min_kWh_m2"], "cloudy", "rainy"))
        self.day_poa = dp.values
        self.sensors = _strip(json.loads((ROOT / "config" / "sensors.json").read_text(encoding="utf-8")))
        self.cols = {c: self.df[c].values for c in self.df.columns}
        # index of the most recent 5-min step with a door opening (for "this opening lasted Z s")
        idx = np.where(self.cols["door_s"] > 0, np.arange(self.n), -1)
        self.last_open = np.maximum.accumulate(idx)
        self._slab = None
        from server.ledger_service import LedgerService
        self.ledger = LedgerService(self)

    # --------------------------------------------------------------- helpers
    def index(self, t):
        return int((t % self.year_s) // self.dt)

    def time_of(self, t):
        return self.t0 + pd.Timedelta(seconds=float(t % self.year_s))

    def doorway(self, T_out, RH_out, T_in, rh_in, curtain, open_now):
        """Door physics at this instant (ASHRAE Gosney–Olama)."""
        door = self.cfg["door"]
        A, H = door["width_m"] * door["height_m"], door["height_m"]
        inf = loads.infiltration_load(self.cfg, T_out, RH_out, T_in, rh_in, D_t=1.0, curtain=curtain)
        rho_i, rho_o = inf["rho_in"], inf["rho_out"]
        if rho_i > rho_o:
            Vdot = 0.221 * A * math.sqrt(G * H * (1 - rho_o / rho_i)) * inf["F_m"]   # m3/s each way
            v_mean = Vdot / (A / 2)
        else:
            Vdot = v_mean = 0.0
        E = inf["E"]
        k = (1 - E) if open_now else 0.0
        return {
            "heat_if_open_kW": inf["Q_kW"],             # q * D_f * (1-E), door fully open
            "heat_now_kW": inf["Q_kW"] if open_now else 0.0,
            "heat_sensible_now_kW": inf["Q_sensible_kW"] if open_now else 0.0,
            "heat_latent_now_kW": inf["Q_latent_kW"] if open_now else 0.0,
            "v_door_top": v_mean * k, "v_door_mid": 0.0, "v_door_bot": v_mean * k,
            "v_door_if_open": v_mean * (1 - E),
            "dp_top": (rho_i - rho_o) * G * H / 2,
            "rho_in": rho_i, "rho_out": rho_o, "curtain": curtain, "E": E,
        }

    # ----------------------------------------------------------------- state
    def state(self, t, curtain=None):
        i = self.index(t)
        c = self.cols
        cfg = self.cfg
        when = self.time_of(t)
        curtain = cfg["door"]["curtain_installed"] if curtain is None else curtain

        door_s = float(c["door_s"][i])
        into_step = float(t % self.dt)
        open_now = door_s > 0 and into_step < door_s

        T_out, RH_out, T_room = float(c["T_out"][i]), float(c["RH_out"][i]), float(c["T_room"][i])
        self.ledger.advance(t)
        phys = self.ledger.physics(t)
        rh_in = cfg["setpoint"]["rh_room_pct"]
        door = self.doorway(T_out, RH_out, T_room, rh_in, curtain, open_now)

        Q = {k: float(c[k][i]) for k in ("Q_wall", "Q_door", "Q_int", "Q_resp", "Q_batch")}
        Q_total = sum(Q.values())
        holding = Q["Q_wall"] + Q["Q_door"] + Q["Q_int"] + Q["Q_resp"]
        b = PCMBattery(cfg)
        b.h = float(c["pcm_h"][i])
        backup = b.backup_hours(max(holding, 0.05))

        hour = when.hour + when.minute / 60 + when.second / 3600
        site = cfg["site"]
        elev, az = pv.sun_angles(when.dayofyear, hour, site["lat_deg"], site["lon_deg"], site["utc_offset_h"])
        day = min(int((t % self.year_s) // 86400), len(self.day_class) - 1)

        T_b = float(c["T_batch"][i])
        j = int(self.last_open[i])
        last_s = float(c["door_s"][j]) if j >= 0 else 0.0
        last_kJ = door["heat_if_open_kW"] * last_s                  # kW x s = kJ
        wall_kW = max(Q["Q_wall"], 1e-6)
        values = {
            "T_out": T_out, "RH_out": RH_out, "wind": float(c["wind"][i]), "poa": float(c["poa"][i]),
            "T_room": T_room, "RH_room": rh_in,
            "T_room_sensor": T_room + self.ledger.sensor_offset(t),
            "physics_residual_K": phys["residual_K"], "physics_status": phys["status"],
            "sensor_suspicious": phys["suspicious"], "fault_active": self.ledger.fault is not None, "T_pcm": float(c["T_pcm"][i]),
            "pcm_pct": float(c["pcm_pct"][i]), "T_batch": None if math.isnan(T_b) else T_b,
            "P_pv": float(c["P_pv"][i]), "P_comp": float(c["P_comp"][i]),
            "P_solar_used": float(c["P_solar_used"][i]), "P_grid": float(c["P_grid"][i]),
            "grid_on": bool(c["grid_on"][i]),
            "Q_cool": float(c["Q_coil_air"][i] + c["Q_coil_pcm"][i]),
            "Q_coil_air": float(c["Q_coil_air"][i]), "Q_coil_pcm": float(c["Q_coil_pcm"][i]),
            "comp_speed_pct": 100.0 * float(c["Q_coil_air"][i] + c["Q_coil_pcm"][i]) / cfg["refrigeration"]["design_capacity_kW"],
            "cop": float(c["cop"][i]),
            "Q_total": Q_total, **Q,
            "backup_h": None if math.isinf(backup) else backup,
            "door_open": open_now, "door_angle": 90.0 if open_now else 0.0,
            "door_s_this_5min": door_s,
            "last_open_s": last_s,
            "last_open_kJ": last_kJ,
            "last_open_wall_minutes": last_kJ / wall_kW / 60.0,
            "last_open_ago_min": (i - j) * self.dt / 60.0 if j >= 0 else None,
            "gas_ppm": None,
            **{k: v for k, v in door.items() if k not in ("rho_in", "rho_out")},
        }
        return {
            "t": float(t % self.year_s), "time": when.strftime("%Y-%m-%d %H:%M:%S"),
            "clock": when.strftime("%d %b %H:%M"), "label": SIM_LABEL, "source": "SIMULATED",
            "sun": {"elevation_deg": elev, "azimuth_deg": az},
            "day_class": str(self.day_class[day]), "day_poa_kWh_m2": float(self.day_poa[day]),
            "values": values,
            "ledger": {"length": len(self.ledger.chain.blocks), "valid": self.ledger.chain.verify()["valid"],
                       "batches": len(self.ledger.batches)},
        }

    # ------------------------------------------------------------ detail data
    def cycle(self, t):
        """Live R290 cycle at this moment (T_cond = T_out + 10 K) + saturation dome for the P-h chart."""
        T_out = float(self.cols["T_out"][self.index(t)])
        Q = max(0.3, float(self.cols["Q_coil_air"][self.index(t)] + self.cols["Q_coil_pcm"][self.index(t)]))
        c = r290.cycle_from_config(self.cfg, T_amb_C=T_out, Q_evap_kW=Q)
        dome = r290.saturation_dome()
        return {"cycle": c, "points": r290.cycle_polyline(c), "dome": dome,
                "design": r290.cycle_from_config(self.cfg)}

    def slab(self):
        """FTCS enthalpy-method melt of one wax slab in 8 C air (computed once, about 2 s)."""
        if self._slab is None:
            s = simulate_slab(self.cfg, hours=24, T_init_C=2.0, T_air_C=8.0, output_every_s=900)
            self._slab = {k: s[k] for k in ("hours", "liquid_fraction", "melt_front_mm", "thickness_mm",
                                            "r", "dt_s", "dx_mm", "nx")}
        return self._slab

    def crop(self, key, t, days):
        """Shelf life of a crop that has been in THIS room for `days` days up to time t,
        using the twin's real room-temperature history (Q10 model, engine/shelf_life.py)."""
        crop = self.crops[key]
        i1 = self.index(t)
        n = int(days * 86400 // self.dt)
        idx = np.arange(i1 - n, i1 + 1) % self.n
        T = self.cols["T_room"][idx].astype(float)
        a = shelf_life.assess(crop, list(T), self.dt / 3600.0)
        hourly = T[:: int(3600 // self.dt)]
        return {"crop": key, "label": crop["label"], "days_stored": days, "source": crop["source"],
                "T_opt": [crop["T_opt_low_C"], crop["T_opt_high_C"]], "chill_below_C": crop.get("chill_injury_below_C"),
                "SL_ref_days": crop["SL_ref_days"], "T_ref_C": crop["T_ref_C"], "Q10": crop["Q10"],
                "assess": a, "history_T": [round(float(x), 3) for x in hourly],
                "chill_now": shelf_life.chilling_warning_now(crop, float(T[-1]))}

    def series(self, quantity, t, hours=24.0, step_min=15):
        """History of one quantity (for the small graph in a sensor panel)."""
        if quantity not in self.cols:
            return {"quantity": quantity, "t": [], "v": []}
        i1 = self.index(t)
        k = int(step_min * 60 // self.dt)
        i0 = i1 - int(hours * 3600 // self.dt)
        idx = np.arange(i0, i1 + 1, k) % self.n
        vals = self.cols[quantity][idx].astype(float)
        times = [(self.t0 + pd.Timedelta(seconds=float(j * self.dt))).strftime("%H:%M") for j in idx]
        return {"quantity": quantity, "t": times,
                "v": [None if math.isnan(v) else round(v, 4) for v in vals]}

    def demo_days(self):
        """Interesting moments to jump to (computed, not hand-picked)."""
        d = self.df
        days = pd.Series(self.day_poa, index=range(len(self.day_poa)))
        sunny = int(days.idxmax())
        rainy = int(days.idxmin())
        tmax = d["T_out"].resample("D").max()
        hot = int((tmax.index[tmax.argmax()] - self.t0).days)
        grid = d["grid_on"].resample("D").sum()
        gridday = int((grid.index[grid.argmax()] - self.t0).days)
        mk = lambda day, h, why: {"t": day * 86400 + h * 3600, "why": why,
                                  "date": (self.t0 + pd.Timedelta(days=day)).strftime("%d %b")}
        return [mk(hot, 7, "Hottest day of 2025 – batch arrives at 8 am"),
                mk(sunny, 7, "Sunniest day – wax refreezes by noon"),
                mk(rainy, 7, "Dullest (rainy) day – wax carries the room"),
                mk(gridday, 0, "Day with the most grid backup")]
