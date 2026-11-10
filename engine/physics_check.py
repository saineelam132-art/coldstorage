"""Physics check - catches a faulty or tampered SENSOR (not a tampered ledger).

The digital twin predicts what the room temperature SHOULD be from ambient temperature,
compressor power, door openings and PCM state. If the measured value and the prediction
disagree by more than `threshold_K` continuously for more than `persist_minutes`, we flag
the reading as "Sensor suspicious - check". The flag is written into the ledger block.

A short spike (e.g. door opened for 20 s) does not trigger the flag, because the
difference must PERSIST.
"""


class PhysicsCheck:
    def __init__(self, threshold_K=1.5, persist_minutes=15.0):
        self.threshold_K = threshold_K
        self.persist_s = persist_minutes * 60.0
        self._since = None           # time when the disagreement started
        self.flagged = False

    @classmethod
    def from_config(cls, cfg):
        pc = cfg["physics_check"]
        return cls(pc["threshold_K"], pc["persist_minutes"])

    def update(self, t_s, measured_C, predicted_C):
        residual = measured_C - predicted_C
        if abs(residual) > self.threshold_K:
            if self._since is None:
                self._since = t_s
            duration = t_s - self._since
            self.flagged = duration >= self.persist_s
        else:
            self._since = None
            duration = 0.0
            self.flagged = False
        return {
            "residual_K": residual,
            "out_of_band_minutes": duration / 60.0,
            "suspicious": self.flagged,
            "status": "Sensor suspicious - check" if self.flagged else "OK - matches physics",
        }


# =========================================================================================
# Physics consistency check v2: four residuals -> z-scores -> ONE number Φ (phi).
# Physical quantities are linked, so a faked temperature breaks the links with humidity,
# electricity and time.  Hash chain = data not changed later; Φ = is the data believable?
#
#  1 Moisture  : W = 0.622 e/(p - e),  e = RH/100 · e_s(T).  Air leaving the coil cannot hold more
#                water than the return air, nor more than saturation at the coil outlet:
#                r1 = W_s - min(W_r, W_sat(T_s));  plus RH <= 100 % and dew point <= T (else z1 = 10)
#  2 Energy    : Q_air = ρ V̇ [c_p (T_r - T_s) + h_fg (W_r - W_s)]   (V̇ = v · coil face area)
#                Q_ref = COP(T_out, T_evap) · (P_el - P_fan) - Q_wax_branch (EEV-B log)
#                r2 = (Q_air - Q_ref) / max(Q_ref, Q_floor)
#  3 Room heat : r3 = C_room ΔT_air/Δt - [UA (T_out - T_air) + Q_door + Q_produce + Q_int - Q_wax - Q_air]
#                (our room also has the wax fins Q_wax and fans/lights Q_int, so they are in the balance)
#  4 Core lag  : T_core,pred = T_core + (T_air - T_core)(1 - e^(-Δt/τ));  r4 = T_core,meas - T_core,pred
#                (skipped in the step a new batch is loaded – the probe is moved to the new crate)
#  Φ = sqrt( Σ w_k z_k² / Σ w_k ),  z_k = r_k / σ_k
#  Φ < 2 green · 2–3 watch · Φ >= 3 for 3 steps in a row (15 min) -> 'data does not match physics'
# =========================================================================================
import numpy as _np

RHO_AIR, CP_AIR, H_FG = 1.27, 1006.0, 2.50e6         # kg/m3, J/kgK, J/kg (air near 5 °C)


def e_s(T):
    T = _np.asarray(T, dtype=float)
    return 6.112 * _np.exp(17.62 * T / (243.12 + T))


def humidity_ratio(T, RH, p_hPa=1013.25):
    e = _np.asarray(RH, dtype=float) / 100.0 * e_s(T)
    return 0.622 * e / (_np.asarray(p_hPa, dtype=float) - e)


def dew_point(T, RH):
    T, RH = _np.asarray(T, dtype=float), _np.clip(_np.asarray(RH, dtype=float), 0.5, 200.0)
    g = _np.log(RH / 100.0) + 17.62 * T / (243.12 + T)
    return 243.12 * g / (17.62 - g)


def residuals(d, cfg):
    """d: dict of equal-length arrays (one value per 5-min step) as REPORTED by the four nodes, the energy
    meter and the controller log, plus scalars. Arrays: T_s, RH_s, v_s (N1 supply air), T_core (N2),
    Q_door_kW (N3), T_r, RH_r (N4), P_el_kW (meter), P_fan_kW, cop, Q_wax_branch_kW, Q_int_kW,
    G_wax_kW_K, T_pcm (controller), T_out, p_hPa (weather), load_event (0/1).
    Scalars: dt_s, m_kg, cp_kJ_kgK, tau_s, C_room_kJ_K, UA_kW_K, A_face_m2, r_ref_W_kg, Q10, T_ref_C.
    Returns r1 (kg/kg), r2 (W), r3 (W), r4 (K), 'coil_on' (r1, r2 only count while the coil fan runs)
    and helpers. Same maths as web/trust/trust_core.js."""
    t = cfg["trust"]["phi"]
    a = {k: _np.asarray(v, dtype=float) for k, v in d.items() if not isinstance(v, (int, float))}
    s = {k: float(v) for k, v in d.items() if isinstance(v, (int, float))}
    Ts, Tr, Tc = a["T_s"], a["T_r"], a["T_core"]
    # 1) moisture: supply air cannot hold more water than the return air, nor more than saturated
    Ws, Wr = humidity_ratio(Ts, a["RH_s"], a["p_hPa"]), humidity_ratio(Tr, a["RH_r"], a["p_hPa"])
    Wsat_s = humidity_ratio(Ts, 100.0, a["p_hPa"])
    r1 = Ws - _np.minimum(Wr, Wsat_s)
    impossible = (a["RH_s"] > 100.5) | (a["RH_r"] > 100.5)
    # 2) energy: cooling seen in the air (nodes) = cooling the meter says the compressor gave the room
    mdot = RHO_AIR * a["v_s"] * s["A_face_m2"]
    Q_air = mdot * (CP_AIR * (Tr - Ts) + H_FG * (Wr - Ws)) / 1000.0                       # kW
    Q_ref = a["cop"] * _np.maximum(a["P_el_kW"] - a["P_fan_kW"], 0.0) - a["Q_wax_branch_kW"]
    r2 = (Q_air - Q_ref) * 1000.0                                                          # W
    # 3) room heat balance: C dT/dt = walls + door + produce + inside loads - wax - coil
    Tr_p, Tc_p, Tp_p = _np.r_[Tr[0], Tr[:-1]], _np.r_[Tc[0], Tc[:-1]], _np.r_[a["T_pcm"][0], a["T_pcm"][:-1]]
    Q_resp = s["m_kg"] * s["r_ref_W_kg"] * s["Q10"] ** ((Tc_p - s["T_ref_C"]) / 10.0) / 1000.0
    Q_prod = Q_resp + s["m_kg"] * s["cp_kJ_kgK"] / s["tau_s"] * (Tc_p - Tr_p)
    Q_wax = a["G_wax_kW_K"] * (Tr_p - Tp_p)
    rhs = s["UA_kW_K"] * (a["T_out"] - Tr_p) + a["Q_door_kW"] + Q_prod + a["Q_int_kW"] - Q_wax - Q_air
    r3 = (s["C_room_kJ_K"] * (Tr - Tr_p) / s["dt_s"] - rhs) * 1000.0                      # W
    # 4) core lag: the produce core follows the air with the 4-h pull-down time constant
    pred = Tc_p + (Tr_p - Tc_p) * (1.0 - _np.exp(-s["dt_s"] / s["tau_s"]))
    r4 = Tc - pred
    ev = a["load_event"] > 0.5
    r3[ev] = 0.0
    r4[ev] = 0.0
    r1[0] = r2[0] = r3[0] = r4[0] = 0.0
    coil_on = (a["v_s"] > 0.1) | (a["P_el_kW"] > a["P_fan_kW"] + 0.02)
    return {"r1": r1, "r2": r2, "r3": r3, "r4": r4, "impossible": impossible, "coil_on": coil_on,
            "Q_air_kW": Q_air, "Q_ref_kW": Q_ref}


def trailing_mean(x, k):
    """Mean of the last k readings (fewer at the start). Same in trust_core.js."""
    x = _np.asarray(x, dtype=float)
    if k <= 1:
        return x
    c = _np.cumsum(_np.r_[0.0, x])
    i = _np.arange(1, len(x) + 1)
    lo = _np.maximum(i - k, 0)
    return (c[i] - c[lo]) / (i - lo)


def phi_from(res, sigma, weights=(1, 1, 1, 1), window=1):
    """Φ = sqrt(sum w z^2 / sum w) over the residuals that are active at that step (r1, r2 need the coil
    fan running). Each residual is first averaged over the last `window` readings (sensor noise down)."""
    r = [trailing_mean(res[k], window) for k in ("r1", "r2", "r3", "r4")]
    z = _np.vstack([r[0] / sigma["W_kg_kg"], r[1] / sigma["E_W"], r[2] / sigma["Q_W"], r[3] / sigma["core_K"]])
    z[0] = _np.where(res["impossible"], 10.0, z[0])
    w = _np.asarray(weights, dtype=float)[:, None] * _np.ones_like(z)
    on = _np.asarray(res["coil_on"], dtype=bool) | _np.asarray(res["impossible"], dtype=bool)
    w[0] = _np.where(on, w[0], 0.0)
    w[1] = _np.where(on, w[1], 0.0)
    return _np.sqrt((w * z ** 2).sum(0) / w.sum(0)), z


def phi_flags(phi, red_at=3.0, red_steps=3):
    """Indices where 'data does not match physics' is raised (Φ >= red_at for red_steps in a row),
    as [start, end] step windows."""
    out, run = [], 0
    for i, p in enumerate(phi):
        run = run + 1 if p >= red_at else 0
        if run == red_steps:
            out.append([i - red_steps + 1, i])
        elif run > red_steps:
            out[-1][1] = i
    return out
