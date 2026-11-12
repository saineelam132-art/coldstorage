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
from twin.simulate import daily_poa_kWh

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


def wax_hx_info(tot):
    """What the pages show about the wax heat exchanger (finned panels): the calculation at 3 K."""
    w = tot.get("wax_hx") or {}
    c = w.get("calc_3K") or {}
    out = {k: w.get(k) for k in ("kind", "L_m", "A_m2", "load_W", "T_out_design_night_C", "dT_K")}
    out.update({k: c.get(k) for k in ("S_mm", "b_mm", "t_mm", "N_fins", "area_mult", "eta", "h", "h_bar_cohen", "h_van_de_pol",
                                      "UA_air", "UA", "Q_W", "al_kg")})
    if w.get("L_m") and w.get("A_m2"):
        from engine import fins as FINS
        p = FINS.plain(w["A_m2"], w["L_m"], w["R_wax_m2K_W"], 3.0)
        out["plain"] = {"h": p["h"], "UA": p["UA"], "Q_W": p["Q_W"]}
    return out


class TwinState:
    def __init__(self, cfg=None):
        self.cfg = cfg or load_config()
        self.crops = load_crops()
        # The main site replays the FINAL DESIGN on real 2026 weather (1 Jan 2026 -> end of tomorrow):
        # 115 kg wax, 1.8 kWp, finned wax panels (passive), 150 kg loaded at 6 am, sunlight corrected to NASA level.
        from twin.live_sim import simulate_live
        from twin.live_weather import load_actual
        W = load_actual()
        self.final_H, ftot, _, self.final_bt = simulate_live(W, "current", cfg=self.cfg, steps=True)
        S = ftot.pop("steps").rename(columns={"Q_air": "Q_coil_air", "Q_ch": "Q_coil_pcm"})
        S["grid_on"] = S["grid_on"] > 0.5
        S["P_comp"] = S["P_comp"]
        self.df = S
        self.final_totals = ftot
        hourly = S[["poa", "T_out"]].resample("h").mean()
        self.weather = pd.DataFrame({"time_ist": hourly.index, "poa": hourly["poa"].values, "T_out": hourly["T_out"].values})
        self.summary = self._summary(S, self.final_H, ftot)
        # the SAME room with PLAIN wax panels (no fins), for the two-rooms comparison
        H0, t0_, _, _ = simulate_live(W, "current", cfg=self.cfg, steps=True, hx={"kind": "plain"})
        S0 = t0_.pop("steps")
        self.plain_summary = self._summary(S0, H0, t0_)
        self.smart = {"T_room": S["T_room"].values, "pcm_pct": S["pcm_pct"].values, "grid_on": S["grid_on"].values}
        self.base = {"T_room": S0["T_room"].values, "pcm_pct": S0["pcm_pct"].values, "grid_on": (S0["grid_on"] > 0.5).values}
        self.dt = 300.0
        self.grid_h_cum = {"normal": np.cumsum(self.base["grid_on"]) * self.dt / 3600,
                           "smart": np.cumsum(self.smart["grid_on"]) * self.dt / 3600}
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
        # door seconds open earlier the same day (before this 5-min step), for "seconds open today"
        spd = int(86400 // self.dt)
        ds = self.cols["door_s"].astype(float)
        day_id = np.arange(self.n) // spd
        cum = pd.Series(ds).groupby(day_id).cumsum().values
        self.door_before = cum - ds
        self._slab = None
        from server.ledger_service import LedgerService
        self.ledger = LedgerService(self)

    def _summary(self, S, H, tot):
        """Year totals of a 5-minute run (only real hours, not the forecast)."""
        real = ~H["is_forecast"].values if "is_forecast" in H else np.ones(len(H), bool)
        Hr = H[real]
        days = Hr.time_ist.dt.date
        g = Hr.groupby(days).grid_on.sum()
        Sr = S.iloc[: real.sum() * 12]
        kWh = lambda c: float(Sr[c].sum() * 300 / 3600)
        hod = Hr.time_ist.dt.hour
        load_h = {(e["hour"] + j) % 24 for e in self.cfg["live_run"]["loading"] for j in range(3)}
        hot = (Hr.T_room > 8) | (Hr.T_room < 2)
        return {"hot_load_h_per_day": float((hot & hod.isin(load_h)).sum() / max(1, len(g))),
                "hot_other_h": float((hot & ~hod.isin(load_h)).sum()),
                "grid_hours": float(Hr.grid_on.sum()), "pct_days_full_solar_pcm": float(100 * (g == 0).mean()),
                "days": int(len(g)), "days_full_solar_pcm": int((g == 0).sum()),
                "load_wall_kWh": kWh("Q_wall"), "load_door_kWh": kWh("Q_door"), "load_door_latent_kWh": kWh("Q_door_lat"),
                "load_product_kWh": kWh("Q_batch"), "load_resp_kWh": kWh("Q_resp"), "load_internal_kWh": kWh("Q_int"),
                "fan_kWh": float(Sr["fan_W"].sum() * 300 / 3600 / 1000), "compressor_kWh_e": float(Hr.P_comp.sum()),
                "energy_balance_error_pct": tot["energy_balance_error_pct"], "produce_kg": tot["produce_kg"],
                "design": "Final design: 115 kg wax, 1.8 kWp, finned wax panels (no fan), 150 kg loaded at 6 am (2026 weather, conservative sun)"}

    # --------------------------------------------------------------- helpers
    def time_info(self):
        """Time base of the replay: t = seconds from t0 (IST); data end = t_end (end of tomorrow)."""
        return {"t0": self.t0.strftime("%Y-%m-%dT%H:%M:%S"), "t_end": float(self.year_s), "dt": self.dt}

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
        # the door swings open and shut in about 2 s each way (same rule in the static backup)
        angle = 90.0 * max(0.0, min(1.0, into_step / 2.0, (door_s - into_step) / 2.0)) if open_now else 0.0

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

        T_b = float(c["T_batch"][i]) if not math.isnan(float(c["T_batch"][i])) else float("nan")
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
            "fan_W": float(c["fan_W"][i]), "fan_speed_pct": 100.0 * float(c["fan_speed"][i]),
            "G_wax_W_K": float(c["G_wax"][i]), "Q_pcm_room": float(c["Q_pcm_room"][i]),
            "Q_total": Q_total, **Q,
            "backup_h": None if math.isinf(backup) else backup,
            "door_open": open_now, "door_angle": angle,
            "door_open_today_s": float(self.door_before[i]) + min(into_step, door_s),
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
            "compare": {
                "normal": {"T_room": float(self.base["T_room"][i]), "pcm_pct": float(self.base["pcm_pct"][i]),
                           "grid_on": bool(self.base["grid_on"][i]), "grid_h_so_far": float(self.grid_h_cum["normal"][i])},
                "smart": {"T_room": float(self.smart["T_room"][i]), "pcm_pct": float(self.smart["pcm_pct"][i]),
                          "grid_on": bool(self.smart["grid_on"][i]), "grid_h_so_far": float(self.grid_h_cum["smart"][i])},
                "year": {"normal_grid_h": self.plain_summary["grid_hours"], "smart_grid_h": self.summary["grid_hours"],
                         "normal_days_pct": self.plain_summary["pct_days_full_solar_pcm"],
                         "smart_days_pct": self.summary["pct_days_full_solar_pcm"],
                         "labels": ["Plain wax panels", "Finned wax panels (final design)"]}},
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

    def series(self, quantity, t, hours=24.0, step_min=15, day=False):
        """History of one quantity (for the small graph in a sensor panel).
        day=True: the whole calendar day of t (00:00-24:00) and 'mark' = the point at time t."""
        if quantity == "T_room_sensor":          # the room sensor reads the twin's room air (+ any injected fault)
            quantity = "T_room"
        if quantity not in self.cols:
            return {"quantity": quantity, "t": [], "v": []}
        i1 = self.index(t)
        k = int(step_min * 60 // self.dt)
        if day:
            spd = int(86400 // self.dt)
            d0 = (i1 // spd) * spd
            idx = np.arange(d0, min(d0 + spd, self.n), k)
            mark = int((i1 - d0) // k)
        else:
            i0 = i1 - int(hours * 3600 // self.dt)
            idx = np.arange(i0, i1 + 1, k) % self.n
            mark = len(idx) - 1
        vals = self.cols[quantity][idx].astype(float)
        times = [(self.t0 + pd.Timedelta(seconds=float(j * self.dt))).strftime("%H:%M") for j in idx]
        return {"quantity": quantity, "t": times, "mark": mark,
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
        h0 = max(0, self.cfg["live_run"]["loading"][0]["hour"] - 1)
        # hottest night: highest mean outside temperature from 19:00 to 06:00 (dated by its evening)
        T = d["T_out"]
        night = T[(T.index.hour >= 19) | (T.index.hour < 6)]
        nm = night.groupby((night.index - pd.Timedelta(hours=7)).normalize()).mean()
        nm = nm[(nm.index >= self.t0) & (nm.index + pd.Timedelta(hours=30) <= self.t0 + pd.Timedelta(seconds=self.year_s))]
        hot_night = int((nm.idxmax() - self.t0).days)
        # a monsoon day: the dullest day of July-August (peak monsoon) (else the dullest day of the run)
        dates = [self.t0 + pd.Timedelta(days=j) for j in range(len(self.day_poa))]
        mons = [j for j, x in enumerate(dates) if 7 <= x.month <= 8]
        monsoon = min(mons, key=lambda j: self.day_poa[j]) if mons else rainy
        out = [mk(hot, h0, "Hottest day of 2026 – 150 kg batch arrives at 6 am"),
               mk(sunny, h0, "Sunniest day – wax refreezes by noon"),
               mk(rainy, h0, "Dullest (rainy) day – wax carries the room"),
               mk(gridday, 0, "Day with the most grid backup"),
               mk(hot_night, 21, "Hottest night of 2026 – the wax holds the room"),
               mk(monsoon, 10, "A monsoon day – little sun, the wax carries the room")]
        for o, key in zip(out, ("hot_day", "sunny_day", "dull_day", "grid_day", "hot_night", "monsoon_day")):
            o["key"] = key
        return out
