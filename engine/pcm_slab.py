"""PCM wall slab - 1-D transient conduction with melting, enthalpy method, explicit FTCS.

The slab is mounted on the insulated wall. Its FRONT face touches the room air;
its BACK face touches the insulated wall (treated as adiabatic = no heat flow).

    room air  |  x=0 ............ x=thickness  | insulated wall
       h      |   wax cells 0, 1, 2 ... N-1    |   q = 0

Enthalpy method: each cell stores its volumetric enthalpy H (J/m3). The temperature
is found from H, so melting is handled automatically (while 0 < H < rho*L the cell
stays at T_m and is partly melted).

FTCS (Forward-Time, Centred-Space) update for an inside cell i:
    H_i(new) = H_i + dt/dx * [ k*(T_{i-1} - T_i)/dx  -  k*(T_i - T_{i+1})/dx ]
Front cell gets heat from air through 1/(1/h + dx/(2k)).

Stability (explicit scheme):   r = alpha * dt / dx^2  <= 0.5,   alpha = k / (rho * cp)
We use the largest alpha (solid or liquid) and pick dt so that r = r_target (default 0.4).
While a cell is melting its effective heat capacity is very large, which only makes the
scheme MORE stable, so the sensible-heat r is the worst case.
"""
import numpy as np


def stability_number(k, rho, cp_J_kgK, dt, dx):
    return k / (rho * cp_J_kgK) * dt / dx**2


def simulate_slab(cfg, hours=24.0, T_init_C=0.0, T_air_C=8.0, h_conv=None,
                  thickness_m=None, nx=24, r_target=0.4, output_every_s=600.0):
    """Run the slab model.

    T_air_C can be a number or a function f(t_seconds) -> deg C.
    Returns a dict with time series: hours, liquid_fraction, melt_front_mm, surface_T_C,
    heat_absorbed_kJ_m2, plus the numerics (dx, dt, r).
    """
    p = cfg["pcm"]
    k = p["k_W_mK"]
    rho = p["density_kg_m3"]
    cps = p["cp_solid_kJ_kgK"] * 1000.0
    cpl = p["cp_liquid_kJ_kgK"] * 1000.0
    Lv = rho * p["latent_kJ_kg"] * 1000.0          # J/m3
    Tm = p["T_melt_C"]
    h = p["air_side_h_W_m2K"] if h_conv is None else h_conv
    if thickness_m is None:
        thickness_m = p["mass_kg"] / (rho * p["slab_area_m2"])

    dx = thickness_m / nx
    alpha_max = k / (rho * min(cps, cpl))
    dt = r_target * dx**2 / alpha_max
    r = alpha_max * dt / dx**2
    if r > 0.5:
        raise ValueError(f"Unstable: r = {r:.3f} > 0.5")

    air = T_air_C if callable(T_air_C) else (lambda t, v=T_air_C: v)

    def T_of_H(H):
        T = np.full_like(H, Tm)
        solid = H < 0
        liquid = H > Lv
        T[solid] = Tm + H[solid] / (rho * cps)
        T[liquid] = Tm + (H[liquid] - Lv) / (rho * cpl)
        return T

    # initial enthalpy
    if T_init_C < Tm:
        H0 = rho * cps * (T_init_C - Tm)
    elif T_init_C > Tm:
        H0 = Lv + rho * cpl * (T_init_C - Tm)
    else:
        H0 = 0.0
    H = np.full(nx, H0, dtype=float)
    E_start = H.sum() * dx

    U_front = 1.0 / (1.0 / h + dx / (2.0 * k))   # air film + half cell
    n_steps = int(round(hours * 3600.0 / dt))
    out_every = max(1, int(round(output_every_s / dt)))

    out = {"hours": [], "liquid_fraction": [], "melt_front_mm": [],
           "surface_T_C": [], "air_T_C": [], "heat_absorbed_kJ_m2": []}
    q_in_total = 0.0   # J/m2 that entered from the air

    def record(step):
        t = step * dt
        lf = np.clip(H / Lv, 0.0, 1.0)
        T = T_of_H(H)
        out["hours"].append(t / 3600.0)
        out["liquid_fraction"].append(float(lf.mean()))
        out["melt_front_mm"].append(float(lf.sum() * dx * 1000.0))
        out["surface_T_C"].append(float(T[0]))
        out["air_T_C"].append(float(air(t)))
        out["heat_absorbed_kJ_m2"].append(q_in_total / 1000.0)

    record(0)
    for step in range(1, n_steps + 1):
        t = (step - 1) * dt
        T = T_of_H(H)
        flux = np.zeros(nx + 1)                       # flux[i] = heat into cell i from the left
        flux[0] = U_front * (air(t) - T[0])
        flux[1:nx] = k * (T[:-1] - T[1:]) / dx
        flux[nx] = 0.0                                # adiabatic back face
        H += dt / dx * (flux[:-1] - flux[1:])
        q_in_total += flux[0] * dt
        if step % out_every == 0:
            record(step)

    E_end = H.sum() * dx
    return {
        **out,
        "dx_mm": dx * 1000.0, "dt_s": dt, "r": r, "nx": nx,
        "thickness_mm": thickness_m * 1000.0,
        "alpha_m2_s": alpha_max, "U_front_W_m2K": U_front,
        "energy_balance_error_J_m2": (E_end - E_start) - q_in_total,
        "stability_formula": "r = alpha*dt/dx^2 <= 0.5",
    }
