"""Hash-chain ledger (blockchain-style) for batch records.

Each block holds one hour of cold-room conditions and is sealed with SHA-256:

    block_string = index | timestamp | batch_ids | summary | flag | prev_hash
    hash         = SHA-256(block_string)

Block n stores the hash of block n-1 (prev_hash). If anyone changes an old reading, that
block's hash changes, it no longer matches the prev_hash stored in the next block, and the
chain is broken from that block onward.

The exact same block_string is built in JavaScript (web/js/ledger.js) so a buyer's phone can
re-check the hashes itself.

Demo note: this is a LOCAL hash-chain. A real deployment would use a permissioned ledger
(e.g. Hyperledger Fabric) with farmer, transporter and buyer nodes.
"""
import copy
import hashlib

GENESIS_PREV = "0" * 64
SUMMARY_KEYS = ("T_min", "T_avg", "T_max", "RH_avg", "door_min", "pcm_pct")


def block_string(b):
    s = b["summary"]
    summ = ";".join(f"{k}={float(s[k]):.2f}" for k in SUMMARY_KEYS)
    return "|".join([str(b["index"]), b["timestamp"], ",".join(b["batch_ids"]), summ, b["flag"], b["prev_hash"]])


def block_hash(b):
    return hashlib.sha256(block_string(b).encode("utf-8")).hexdigest()


class Chain:
    def __init__(self):
        self.blocks = []
        self._original = {}          # index -> untampered copy (for the Reset button)

    def add(self, timestamp, batch_ids, summary, flag="OK"):
        prev = self.blocks[-1]["hash"] if self.blocks else GENESIS_PREV
        b = {"index": len(self.blocks), "timestamp": timestamp, "batch_ids": sorted(batch_ids),
             "summary": {k: round(float(summary[k]), 2) for k in SUMMARY_KEYS}, "flag": flag, "prev_hash": prev}
        b["hash"] = block_hash(b)
        self.blocks.append(b)
        return b

    def verify(self):
        """Status of every block: 'ok', 'data changed' (own hash wrong) or 'link broken'
        (prev_hash does not match the block before). Everything after the first problem is
        'untrusted'."""
        status, first_bad = [], None
        for i, b in enumerate(self.blocks):
            own_ok = block_hash(b) == b["hash"]
            link_ok = b["prev_hash"] == (self.blocks[i - 1]["hash"] if i else GENESIS_PREV)
            if first_bad is not None:
                st = "untrusted"
            elif not own_ok:
                st = "data changed"
            elif not link_ok:
                st = "link broken"
            else:
                st = "ok"
            if st != "ok" and first_bad is None:
                first_bad = i
            status.append(st)
        return {"valid": first_bad is None, "first_bad": first_bad, "status": status}

    def tamper(self, index, field="T_max", new_value=None):
        """Change one stored reading WITHOUT re-sealing (what a cheater would do)."""
        b = self.blocks[index]
        self._original.setdefault(index, copy.deepcopy(b))
        old = b["summary"][field]
        b["summary"][field] = round(float(new_value if new_value is not None else old - 3.0), 2)
        return {"index": index, "field": field, "old": old, "new": b["summary"][field]}

    def reset_tamper(self):
        for i, b in self._original.items():
            self.blocks[i] = b
        self._original.clear()

    def for_batch(self, batch_id):
        return [b for b in self.blocks if batch_id in b["batch_ids"]]
