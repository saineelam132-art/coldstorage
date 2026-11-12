"""Per-batch hash chain for Trust & Trade (farmer -> owner -> transporter -> buyer).

Block (canonical JSON = sorted keys, no spaces, numbers normalised as below):
    {"index", "ts" (ISO-8601 UTC), "slipId", "type": CHECKIN|READING|HANDOVER_OUT|TRANSIT|HANDOVER_IN|SALE,
     "actor": farmer|owner|transporter|buyer, "payload", "physics": {"phi", "flags"}, "prevHash", "hash"}
    hash = SHA256(index|ts|slipId|type|actor|canonical(payload)|canonical(physics)|prevHash)

canonical(physics) is ALSO sealed (one field more than the first brief) so a physics flag cannot be
deleted later without breaking the chain. The same rules are in web/trust/trust_core.js.
Slip QR = {slipId, bay, genesisHash, sig},  sig = HMAC-SHA256(server key, slipId|bay|genesisHash).
Daily anchor = SHA256(day | slipId:lastHash;... sorted) published once a day.
"""
import hashlib
import hmac
import json
import math
import os
import secrets

GENESIS_PREV = "0" * 64
TYPES = ("CHECKIN", "READING", "HANDOVER_OUT", "TRANSIT", "HANDOVER_IN", "SALE", "CHECKOUT", "VOID", "FLAG", "REVIEW")
ACTORS = ("farmer", "owner", "transporter", "buyer", "system")


def _norm(x):
    """Numbers: rounded to 4 decimals; whole numbers written as integers (same as JavaScript)."""
    if isinstance(x, bool) or x is None or isinstance(x, str):
        return x
    if isinstance(x, (int, float)):
        if isinstance(x, float) and not math.isfinite(x):
            return None
        v = round(float(x), 4)
        return int(v) if v.is_integer() else v
    if isinstance(x, dict):
        return {str(k): _norm(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [_norm(v) for v in x]
    return _norm(float(x))


def canonical(obj):
    return json.dumps(_norm(obj), sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def block_string(b):
    return "|".join([str(b["index"]), b["ts"], b["slipId"], b["type"], b["actor"], canonical(b["payload"]),
                     canonical(b.get("physics", {"phi": 0, "flags": []})), b["prevHash"]])


def block_hash(b):
    return hashlib.sha256(block_string(b).encode("utf-8")).hexdigest()


def server_key():
    """The signing key lives only on the server: environment variable KOOLKISAAN_HMAC_KEY.
    If it is not set, a random key is made for this run (slips then verify only until a restart)."""
    k = os.environ.get("KOOLKISAAN_HMAC_KEY")
    if not k:
        k = server_key.__dict__.setdefault("_random", secrets.token_hex(32))
    return k


def sign(slip_id, bay, genesis_hash, key=None):
    key = server_key() if key is None else key
    return hmac.new(key.encode(), f"{slip_id}|{bay}|{genesis_hash}".encode(), hashlib.sha256).hexdigest()


def verify_sig(qr, key=None):
    return hmac.compare_digest(sign(qr["slipId"], qr["bay"], qr["genesisHash"], key), qr["sig"])


class BatchChain:
    def __init__(self, slip_id):
        self.slip_id, self.blocks = slip_id, []

    def append(self, ts, typ, actor, payload, physics=None):
        assert typ in TYPES and actor in ACTORS
        prev = self.blocks[-1]["hash"] if self.blocks else GENESIS_PREV
        b = {"index": len(self.blocks), "ts": ts, "slipId": self.slip_id, "type": typ, "actor": actor,
             "payload": _norm(payload), "physics": _norm(physics or {"phi": 0, "flags": []}), "prevHash": prev}
        b["hash"] = block_hash(b)
        self.blocks.append(b)
        return b


def verify_chain(blocks, reading_interval_s=300):
    """Recompute every hash and link; check that READING blocks come every 5 min without gaps.
    Returns the first broken block and who held custody there."""
    from datetime import datetime
    first_bad, why = None, None
    for i, b in enumerate(blocks):
        if block_hash(b) != b["hash"]:
            first_bad, why = i, "data changed (hash does not match)"
            break
        if b["prevHash"] != (blocks[i - 1]["hash"] if i else GENESIS_PREV):
            first_bad, why = i, "link broken (prevHash does not match)"
            break
    gaps = []
    reads = [b for b in blocks if b["type"] == "READING"]
    for a, c in zip(reads, reads[1:]):
        dt = (datetime.fromisoformat(c["ts"].replace("Z", "+00:00")) - datetime.fromisoformat(a["ts"].replace("Z", "+00:00"))).total_seconds()
        if abs(dt - reading_interval_s) > 1:
            gaps.append({"after": a["index"], "seconds": dt})
    custody = None
    if first_bad is not None:
        holder = "farmer"
        for b in blocks[: first_bad + 1]:
            holder = {"CHECKIN": "owner", "READING": "owner", "HANDOVER_OUT": "transporter", "TRANSIT": "transporter",
                      "HANDOVER_IN": "buyer", "SALE": "buyer", "CHECKOUT": "owner", "VOID": "owner", "FLAG": "owner",
                      "REVIEW": "owner"}[b["type"]]
        custody = holder
    flags = [f for b in blocks for f in b.get("physics", {}).get("flags", [])]
    return {"valid": first_bad is None, "first_bad": first_bad, "why": why, "custody_at_break": custody,
            "gaps": gaps, "physics_flags": flags}


def day_heads(blocks):
    """Last hash of every day (UTC date of ts) for one batch."""
    heads = {}
    for b in blocks:
        heads[b["ts"][:10]] = b["hash"]
    return heads


def daily_anchor(day, heads_by_slip):
    """heads_by_slip: {slipId: last hash of that day}."""
    s = day + "|" + ";".join(f"{k}:{v}" for k, v in sorted(heads_by_slip.items()))
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def payment_status(ver):
    """Buyer rule: broken chain -> FROZEN (penalty mode); physics flags or missing readings -> ON_HOLD; else OK."""
    if not ver["valid"]:
        return "FROZEN"
    if ver["physics_flags"] or ver["gaps"]:
        return "ON_HOLD"
    return "OK"
