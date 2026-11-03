# ColdTrust Twin

Demo website and digital twin for the REFCOLD India 2026 poster
**"Blockchain-Secured Hybrid Solar–PCM Cold Storage with Natural-Refrigerant (R290) VCR System"**
(GVPCE, Visakhapatnam).

> Status: **Phase 1 (engine) done.** Phases 2–5 (digital twin, website, ESP32, polish) come next.

## Install (Windows, once)

1. Install Python 3.11, 3.12 or 3.13 from python.org (tick "Add Python to PATH").
2. Open a Command Prompt in this folder and run:

```
pip install -r requirements.txt
```

## Phase 1 – check the engine

Run all tests (should say `51 passed`):

```
python -m pytest -q
```

Print every formula with the numbers plugged in:

```
python -m engine.report
```

Try other conditions, e.g. 40 °C outside, 70 % RH, pomegranate:

```
python -m engine.report --tout 40 --rh 70 --crop pomegranate
```

Save the table for checking in Excel:

```
python -m engine.report --csv design_point.csv
```

## Where things are

| Folder / file | What it holds |
|---|---|
| `config/design.json` | **All** design values (room size, PCM mass, PV size …). Change numbers here. |
| `data/crops.json` | Crop table for shelf life (with the source of every value). |
| `engine/` | The physics: one small file per topic (loads, R290, PV, PCM, shelf life …). |
| `tests/` | Automatic checks of the engine. |
| `ASSUMPTIONS.md` | Every assumption, in plain English. |
