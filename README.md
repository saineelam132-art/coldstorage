# ColdTrust Twin

Demo website and digital twin for the REFCOLD India 2026 poster
**"Blockchain-Secured Hybrid Solar–PCM Cold Storage with Natural-Refrigerant (R290) VCR System"**
(GVPCE, Visakhapatnam).

> Status: **Phase 1 (engine) and Phase 2 (digital twin) done.** Phases 3–5 (website, ESP32, polish) come next.

## Install (Windows, once)

1. Install Python 3.11, 3.12 or 3.13 from python.org (tick "Add Python to PATH").
2. Open a Command Prompt in this folder and run:

```
pip install -r requirements.txt
```

## Phase 1 – check the engine

Run all tests (should say `65 passed`):

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

## Phase 2 – digital twin with real Visakhapatnam weather

The 2025 weather is already in `data/` — no internet needed. To download it again:

```
python -m twin.fetch_weather --year 2025
```

Run the full-year simulation, the 72-case parametric study and the comparisons
(about 30 seconds):

```
python -m twin.run_all
```

Make the poster graphs (300-dpi PNG + SVG in `figures/`):

```
python make_poster_figures.py
```

Main outputs in `results/`:

| File | What it is |
|---|---|
| `results_summary.csv` | **Every key number, its unit and the formula/method** — check this one |
| `recommendation.txt` | The recommended design and why |
| `parametric.csv` | All 72 cases (PCM × PV × compressor) |
| `comparisons.csv` | With/without PCM, curtain/no curtain, normal/forecast charging |
| `weather_monthly.csv`, `day_counts.csv` | Weather check and sunny/cloudy/rainy days |
| `power_cut_night.csv` | Room temperature on the power-cut night |
| `year_*_hourly.csv` | Hour-by-hour simulation results for the year |

## Where things are

| Folder / file | What it holds |
|---|---|
| `config/design.json` | **All** design values (room size, PCM mass, PV size …). Change numbers here. |
| `data/crops.json` | Crop table for shelf life (with the source of every value). |
| `engine/` | The physics: one small file per topic (loads, R290, PV, PCM, shelf life …). |
| `twin/` | Digital twin: weather download/loading, year simulation, studies. |
| `data/weather_vizag_2025.csv` | Real NASA POWER hourly weather for 2025. |
| `results/`, `figures/` | Outputs of `twin.run_all` and `make_poster_figures.py`. |
| `tests/` | Automatic checks of the engine and the twin. |
| `ASSUMPTIONS.md` | Every assumption, in plain English. |
