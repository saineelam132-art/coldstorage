"""Load the design values (config/design.json) and the crop table (data/crops.json).

Keys that start with "_" are notes for humans and are ignored by the code.
"""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "config" / "design.json"
CROPS_PATH = ROOT / "data" / "crops.json"


def _strip_notes(obj):
    """Remove keys beginning with '_' (they are comments)."""
    if isinstance(obj, dict):
        return {k: _strip_notes(v) for k, v in obj.items() if not k.startswith("_")}
    return obj


def load_config(path=CONFIG_PATH):
    with open(path, encoding="utf-8") as f:
        return _strip_notes(json.load(f))


def load_crops(path=CROPS_PATH):
    with open(path, encoding="utf-8") as f:
        return _strip_notes(json.load(f))


def with_overrides(cfg, overrides):
    """Return a copy of cfg with some values changed.

    overrides looks like {"pcm": {"mass_kg": 150}, "door": {"curtain_installed": False}}.
    Used by the What-If screen.
    """
    out = copy.deepcopy(cfg)
    for section, values in (overrides or {}).items():
        out.setdefault(section, {}).update(values)
    return out


def u_value(cfg):
    """Overall heat-transfer coefficient of the wall, U = k / thickness  [W/m2K]."""
    ch = cfg["chamber"]
    return ch["insulation_k_W_mK"] / ch["insulation_thickness_m"]
