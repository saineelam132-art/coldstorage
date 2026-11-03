"""Batches + hash-chain ledger + sensor-fault demo, driven by the digital twin's clock.

Every simulated HOUR that passes becomes one ledger block:
    min / avg / max room temperature (as the SENSOR reads it), RH, minutes the door was open,
    wax battery %, which batches were in the room, and the physics-check flag.
If the clock jumps far ahead, only the last 24 hours are sealed (the gap is noted).
"""
import math
import socket

import numpy as np
import pandas as pd

from engine import shelf_life
from engine.ledger import Chain


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "127.0.0.1"


class LedgerService:
    def __init__(self, twin):
        self.tw = twin
        self.chain = Chain()
        self.batches = {}
        self.seq = 0
        self.last_hour = None
        self.fault = None                     # {"offset": K, "since": t}
        pc = twin.cfg["physics_check"]
        self.th, self.persist_s = pc["threshold_K"], pc["persist_minutes"] * 60.0
        self.gaps = []

    # ------------------------------------------------------------ sensor fault demo
    def sensor_offset(self, t):
        f = self.fault
        return f["offset"] if f and t >= f["since"] else 0.0

    def physics(self, t):
        """Measured (sensor) vs predicted (twin) room temperature."""
        off = self.sensor_offset(t)
        dur = (t - self.fault["since"]) if (self.fault and t >= self.fault["since"]) else 0.0
        suspicious = abs(off) > self.th and dur >= self.persist_s
        return {"residual_K": off, "out_of_band_min": dur / 60.0 if abs(off) > self.th else 0.0,
                "suspicious": suspicious,
                "status": "Sensor suspicious – check" if suspicious else
                          ("Disagrees with physics – watching" if abs(off) > self.th else "OK – matches physics")}

    def inject_fault(self, t, offset=3.0):
        self.fault = {"offset": float(offset), "since": float(t)}
        return self.fault

    def clear_fault(self):
        self.fault = None

    # ------------------------------------------------------------ batches
    def new_batch(self, t, farmer, crop, weight_kg):
        if crop not in self.tw.crops:
            raise ValueError(f"unknown crop {crop}")
        self.seq += 1
        when = self.tw.time_of(t)
        bid = f"CT-{when:%y%m%d}-{self.seq:03d}"
        b = {"id": bid, "farmer": farmer.strip()[:40] or "Farmer", "crop": crop,
             "crop_label": self.tw.crops[crop]["label"], "weight_kg": float(weight_kg),
             "entry_t": float(t), "entry_time": when.strftime("%Y-%m-%d %H:%M")}
        self.batches[bid] = b
        return b

    def seed(self, t):
        """A few example batches so the ledger is not empty when the demo starts."""
        for crop, days, farmer, kg in [("grapes", 5, "Ramu (Anakapalle)", 120), ("leafy_greens", 2, "Lakshmi (Sabbavaram)", 60),
                                       ("milk", 1, "Dairy co-op Pendurthi", 80)]:
            self.new_batch(t - days * 86400, farmer, crop, kg)
        self.last_hour = int(t // 3600) - 24
        self.advance(t)

    # ------------------------------------------------------------ ledger
    def _hour_summary(self, h):
        tw = self.tw
        i0, i1 = tw.index(h * 3600), tw.index(h * 3600) + int(3600 // tw.dt)
        idx = np.arange(i0, i1) % tw.n
        T = tw.cols["T_room"][idx].astype(float)
        offs = np.array([self.sensor_offset(h * 3600 + k * tw.dt) for k in range(len(idx))])
        Tm = T + offs
        # physics flag: sensor disagreed by more than the threshold for >= persist minutes in this hour
        bad_s = float(np.sum(np.abs(offs) > self.th)) * tw.dt
        since = self.fault["since"] if self.fault else None
        long_enough = since is not None and (h + 1) * 3600 - since >= self.persist_s
        flag = "Sensor suspicious – check" if (bad_s > 0 and long_enough) else "OK"
        return {"T_min": Tm.min(), "T_avg": Tm.mean(), "T_max": Tm.max(),
                "RH_avg": tw.cfg["setpoint"]["rh_room_pct"],
                "door_min": float(tw.cols["door_s"][idx].sum()) / 60.0,
                "pcm_pct": float(tw.cols["pcm_pct"][idx[-1]])}, flag

    def advance(self, t):
        h = int(t // 3600)
        if self.last_hour is None:
            self.seed(t)
            return
        if h < self.last_hour:                  # clock moved back: continue from here
            self.last_hour = h
            return
        start = self.last_hour
        if h - start > 24:
            self.gaps.append([start, h - 24])
            start = h - 24
        for hr in range(start, h):
            summ, flag = self._hour_summary(hr)
            ts = self.tw.time_of(hr * 3600).strftime("%Y-%m-%d %H:%M")
            present = [b["id"] for b in self.batches.values() if b["entry_t"] < (hr + 1) * 3600]
            self.chain.add(ts, present, summ, flag)
        self.last_hour = h

    def ledger(self, last=40):
        v = self.chain.verify()
        n = len(self.chain.blocks)
        lo = max(0, n - last)
        return {"blocks": self.chain.blocks[lo:], "status": v["status"][lo:], "valid": v["valid"],
                "first_bad": v["first_bad"], "length": n,
                "note": "Demo uses a local hash-chain. Real deployment: permissioned ledger (Hyperledger Fabric) "
                        "with farmer, transporter and buyer nodes."}

    def tamper(self):
        """Change T_max in an OLD block (about 6 blocks back) by -3 C, without re-sealing."""
        n = len(self.chain.blocks)
        if n < 3:
            return None
        i = max(0, n - 7)
        r = self.chain.tamper(i, "T_max")
        r["explain"] = (f"Block {i}'s T_max was changed from {r['old']} to {r['new']} °C. Its hash no longer matches "
                        f"the copy stored in block {i + 1}, so block {i} and every block after it are untrusted.")
        return r

    # ------------------------------------------------------------ buyer view
    def batch_view(self, bid, t):
        b = self.batches.get(bid)
        if not b:
            return None
        tw = self.tw
        crop = tw.crops[b["crop"]]
        days = max(1 / 24, (t - b["entry_t"]) / 86400)
        i1 = tw.index(t)
        n = int(days * 86400 // tw.dt)
        idx = np.arange(i1 - n, i1 + 1) % tw.n
        T = tw.cols["T_room"][idx].astype(float)
        a = shelf_life.assess(crop, list(T), tw.dt / 3600.0)
        step = max(1, len(T) // 120)
        return {"batch": b, "crop": {"label": crop["label"], "T_opt": [crop["T_opt_low_C"], crop["T_opt_high_C"]],
                                     "SL_ref_days": crop["SL_ref_days"], "T_ref_C": crop["T_ref_C"], "Q10": crop["Q10"],
                                     "source": crop["source"]},
                "days_stored": days, "assess": a, "history_T": [round(float(x), 2) for x in T[::step]],
                "blocks": self.chain.for_batch(bid), "chain_valid": self.chain.verify()["valid"],
                "now": tw.time_of(t).strftime("%Y-%m-%d %H:%M")}
