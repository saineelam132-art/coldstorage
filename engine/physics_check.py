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
