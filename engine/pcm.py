"""PCM "cold battery" - lumped (single-temperature) energy balance.

We track the specific enthalpy h of the wax [kJ/kg], measured from
"fully frozen solid exactly at the melting point T_m":

    h < 0          solid, colder than T_m      T = T_m + h / cp_solid
    0 <= h <= L    melting / freezing at T_m   liquid fraction = h / L
    h > L          liquid, warmer than T_m     T = T_m + (h - L) / cp_liquid

Battery %  = frozen fraction = 1 - liquid fraction   (as asked)

Cold energy still available (latent + sensible), measured up to the point
where the wax is all liquid and has warmed to T_used (8 C, top of the band):
    E_remaining = m * (h_used - h),   h_used = L + cp_liquid * (T_used - T_m)

Backup time left = E_remaining / current holding load.

Each time step:  h_new = h_old + Q_net * dt / m
(Q_net > 0 means heat flows INTO the wax and melts it.)
"""


class PCMBattery:
    def __init__(self, cfg, frozen_fraction=1.0, T_C=None):
        p = cfg["pcm"]
        self.m = p["mass_kg"]
        self.L = p["latent_kJ_kg"]
        self.cps = p["cp_solid_kJ_kgK"]
        self.cpl = p["cp_liquid_kJ_kgK"]
        self.Tm = p["T_melt_C"]
        self.T_used = p["T_fully_used_C"]
        self.h = 0.0
        self.set_state(frozen_fraction, T_C)
        self.heat_in_kJ = 0.0    # running totals for the energy-balance check
        self.heat_out_kJ = 0.0

    # ------------------------------------------------------------ state
    def set_state(self, frozen_fraction=1.0, T_C=None):
        if T_C is not None and T_C < self.Tm:
            self.h = self.cps * (T_C - self.Tm)
        elif T_C is not None and T_C > self.Tm:
            self.h = self.L + self.cpl * (T_C - self.Tm)
        else:
            self.h = self.L * (1.0 - frozen_fraction)

    @staticmethod
    def h_of_T(T_C, Tm, L, cps, cpl):
        if T_C <= Tm:
            return cps * (T_C - Tm)
        return L + cpl * (T_C - Tm)

    @property
    def temperature_C(self):
        if self.h < 0:
            return self.Tm + self.h / self.cps
        if self.h > self.L:
            return self.Tm + (self.h - self.L) / self.cpl
        return self.Tm

    @property
    def liquid_fraction(self):
        return min(1.0, max(0.0, self.h / self.L))

    @property
    def frozen_fraction(self):
        return 1.0 - self.liquid_fraction

    @property
    def battery_pct(self):
        return 100.0 * self.frozen_fraction

    @property
    def h_used(self):
        return self.L + self.cpl * (self.T_used - self.Tm)

    @property
    def energy_total_kJ(self):
        """Internal energy relative to the reference (frozen solid at T_m)."""
        return self.m * self.h

    @property
    def latent_remaining_kJ(self):
        return self.m * self.L * self.frozen_fraction

    @property
    def energy_remaining_kJ(self):
        return max(0.0, self.m * (self.h_used - self.h))

    @property
    def capacity_kJ(self):
        """Cold energy when fully frozen at T_m (latent + liquid sensible up to T_used)."""
        return self.m * self.h_used

    def backup_hours(self, holding_load_kW):
        if holding_load_kW <= 1e-9:
            return float("inf")
        return self.energy_remaining_kJ / holding_load_kW / 3600.0

    # ------------------------------------------------------------- step
    def step(self, Q_net_kW, dt_s):
        """Add Q_net (kW) for dt seconds. Positive = melts the wax."""
        dE = Q_net_kW * dt_s                     # kJ
        self.h += dE / self.m
        if dE >= 0:
            self.heat_in_kJ += dE
        else:
            self.heat_out_kJ += -dE
        return self.snapshot()

    def snapshot(self, holding_load_kW=None):
        s = {
            "T_C": self.temperature_C,
            "h_kJ_kg": self.h,
            "liquid_fraction": self.liquid_fraction,
            "battery_pct": self.battery_pct,
            "latent_remaining_kJ": self.latent_remaining_kJ,
            "energy_remaining_kJ": self.energy_remaining_kJ,
            "energy_remaining_kWh": self.energy_remaining_kJ / 3600.0,
        }
        if holding_load_kW is not None:
            s["backup_hours"] = self.backup_hours(holding_load_kW)
        return s
