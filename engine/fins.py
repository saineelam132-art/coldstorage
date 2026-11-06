"""FINNED wax panels: thin vertical aluminium fins on the room-air side of the wax (PCM) panels,
no baffle, open at top and bottom. Air cooled by the fins falls down between them by itself.

Geometry (per panel face, fins vertical):
    L  = panel height (fin length along the flow)            [m]
    S  = clear gap between two fins                          [m]
    b  = fin depth (how far it sticks out from the panel)    [m]
    t  = fin thickness (1 mm aluminium)                      [m]
    pitch p = S + t;  number of fins N = W / p,  W = A / L  (A = wax face area, 12 m2)

Area multiplier (wetted area per m2 of plain panel):  (S + 2 b + t) / (S + t)

Natural convection h - two standard correlations, the LOWER one is used (conservative):
  1. Bar-Cohen & Rohsenow (1984), isothermal parallel plates (Elenbaas channel):
        Ra_S = g beta dT S^3 / (nu alpha),   El = Ra_S S / L
        Nu_S = [ 576 / El^2 + 2.873 / El^0.5 ]^-0.5,          h = Nu_S k / S
        best gap  S_opt = 2.714 L Ra_L^-1/4
  2. Van de Pol & Tierney (1973), U-channel fin arrays (fin depth b counts, open front):
        r = 2 b S / (2 b + S),  Ra* = g beta dT r^3 / (nu alpha) * r / L
        a = S / b,  psi = 24 (1 - 0.483 e^(-0.17/a)) /
                           {(1 + a/2) [1 + (1 - e^(-0.83 a)) (9.14 a^0.5 e^(-465 S) - 0.61)]}^3
        Nu_r = Ra*/psi { 1 - exp[ -psi (0.5 / Ra*)^(3/4) ] },   h = Nu_r k / r
Fin efficiency (straight fin, corrected length Lc = b + t/2):
        m = sqrt(2 h / (k_al t)),   eta = tanh(m Lc) / (m Lc)
Air-side conductance:   UA_air = h (A_base_exposed + eta A_fins)
In series with the wax (half the slab):  UA = 1 / (1/UA_air + R_wax / A)
Plain panel, no baffle, no fins: Churchill & Chu vertical plate.
Radiation from the room to the panels is ignored (conservative, as for the baffle channel).

Fan option (C): a 120 mm fan with a small hood at the top of the panels blows DOWN the fin channels
over a 'covered' width; there h = (h_nat^3 + h_forced^3)^(1/3) (mixed convection), h_forced from
the laminar developing-duct correlation (same as the baffle channel, Dh of the U-channel).
"""
import math

import numpy as np

from engine import fan as FAN

RHO, CP, K_AIR, NU, PR = FAN.RHO, FAN.CP, FAN.K_AIR, FAN.NU, FAN.PR
ALPHA = NU / PR
BETA, G = FAN.BETA, FAN.G
K_AL, RHO_AL = 200.0, 2700.0


def gbn(dT):
    return G * BETA * max(dT, 1e-4) / (NU * ALPHA)


def h_bar_cohen(S, L, dT):
    Ra_S = gbn(dT) * S ** 3
    El = Ra_S * S / L
    Nu = (576.0 / El ** 2 + 2.873 / El ** 0.5) ** -0.5
    return Nu * K_AIR / S


def h_van_de_pol(S, b, L, dT):
    r = 2 * b * S / (2 * b + S)
    Ra = gbn(dT) * r ** 3 * r / L
    a = S / b
    psi = 24 * (1 - 0.483 * math.exp(-0.17 / a)) / (
        (1 + a / 2) * (1 + (1 - math.exp(-0.83 * a)) * (9.14 * a ** 0.5 * math.exp(-465 * S) - 0.61))) ** 3
    Nu = Ra / psi * (1 - math.exp(-psi * (0.5 / Ra) ** 0.75))
    return Nu * K_AIR / r


def h_plate(L, dT):
    """Churchill & Chu, vertical plate (no fins, no baffle)."""
    Ra = gbn(dT) * L ** 3
    Nu = (0.825 + 0.387 * Ra ** (1 / 6) / (1 + (0.492 / PR) ** (9 / 16)) ** (8 / 27)) ** 2
    return Nu * K_AIR / L


def s_opt(L, dT):
    return 2.714 * L * (gbn(dT) * L ** 3) ** -0.25


def eta_fin(h, b, t):
    if b <= 0:
        return 1.0
    m = math.sqrt(2 * h / (K_AL * t))
    x = m * (b + t / 2)
    return math.tanh(x) / x


def array(A, L, S, b, t, R_wax, dT, h_override=None):
    """Conductance of the finned panels at room-wax difference dT (K). Returns a dict of the steps."""
    W = A / L
    p = S + t
    N = W / p
    h_bc, h_vp = h_bar_cohen(S, L, dT), h_van_de_pol(S, b, L, dT)
    h = min(h_bc, h_vp) if h_override is None else h_override
    eta = eta_fin(h, b, t)
    A_fin = N * (2 * b + t) * L                     # both faces + tip
    A_base = A - N * t * L                          # panel face between the fins
    UA_air = h * (A_base + eta * A_fin)
    UA = 1.0 / (1.0 / UA_air + R_wax / A)
    return {"S_mm": S * 1000, "b_mm": b * 1000, "t_mm": t * 1000, "N_fins": N, "area_mult": (A_base + A_fin) / A,
            "h_bar_cohen": h_bc, "h_van_de_pol": h_vp, "h": h, "eta": eta, "UA_air": UA_air, "UA": UA,
            "Q_W": UA * dT, "al_kg": N * b * t * L * RHO_AL}


def plain(A, L, R_wax, dT):
    h = h_plate(L, dT)
    UA = 1.0 / (1.0 / (h * A) + R_wax / A)
    return {"h": h, "UA_air": h * A, "UA": UA, "Q_W": UA * dT, "area_mult": 1.0, "eta": 1.0}


def best_spacing(A, L, b, t, R_wax, dT):
    gaps = np.arange(0.006, 0.0601, 0.001)
    rows = [array(A, L, S, b, t, R_wax, dT) for S in gaps]
    return max(rows, key=lambda r: r["UA"]), rows


def h_forced(v, S, b, L):
    Dh = 4 * S * b / (2 * b + S)
    Re = max(v, 1e-6) * Dh / NU
    Gz = Re * PR * Dh / L
    Nu = 4.86 + 0.0668 * Gz / (1.0 + 0.04 * Gz ** (2.0 / 3.0))
    return Nu * K_AIR / Dh


def conductance_tables(A, L, S, b, t, R_wax, fan=None, cover_m=1.0, n=51):
    """Tables for the simulator, same shape as engine.fan.conductance_tables:
    speeds, G_fan(speed) at dT = 3 K, dTs, G_nat(dT), v_max."""
    dTs = np.linspace(0, 15, 61)
    G_nat = np.array([array(A, L, S, b, t, R_wax, max(d, 1e-3))["UA"] for d in dTs])
    speeds = np.linspace(0, 1, n)
    if not fan:
        return speeds, np.full(n, float(G_nat[12])), dTs, G_nat, 0.0
    W = A / L
    covered = min(W, fan["count"] * cover_m)
    open_area = covered * S / (S + t) * b                 # flow area of the covered fin channels
    v_max = fan["total_flow_m3h"] / 3600 / open_area
    dT = 3.0
    h_n = min(h_bar_cohen(S, L, dT), h_van_de_pol(S, b, L, dT))
    G_fan = []
    for s in speeds:
        h_m = (h_n ** 3 + h_forced(max(s * v_max, 1e-3), S, b, L) ** 3) ** (1 / 3)
        part = array(covered * L, L, S, b, t, R_wax, dT, h_override=h_m)["UA"]
        rest = array((W - covered) * L, L, S, b, t, R_wax, dT)["UA"] if W > covered else 0.0
        G_fan.append(part + rest)
    return speeds, np.array(G_fan), dTs, G_nat, v_max
