# ColdTrust Twin

Demo website and digital twin for the REFCOLD India 2026 poster
**"Blockchain-Secured Hybrid Solar–PCM Cold Storage with Natural-Refrigerant (R290) VCR System"**
(GVPCE, Visakhapatnam).

> Status: **Phase 1 (engine) and Phase 2 (digital twin) done. Phase 3 (website) steps 1–3 of 6 done.**

## Install (Windows, once)

1. Install Python 3.11, 3.12 or 3.13 from python.org (tick "Add Python to PATH").
2. Open a Command Prompt in this folder and run:

```
pip install -r requirements.txt
```

## Phase 1 – check the engine

Run all tests (should say `76 passed`):

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
| `bom_recommended.csv` | Cost table for the recommended design – **all prices are guesses** (`python tools/make_bom.py`) |
| `power_cut_night.csv` | Room temperature on the power-cut night |
| `year_*_hourly.csv` | Hour-by-hour simulation results for the year |

## Phase 3 – the website (step 1: outside view)

Start it (no internet needed):

```
python run.py
```

The browser opens http://localhost:8000. Phones on the laptop's Wi-Fi hotspot can open the
address printed in the window.

- **Photo view** – the Gemini pictures with slow zoom, glowing dots on every sensor and part.
  Hover a dot for the live value, click it for the detail panel. ‹ › or the arrow keys move
  through the story; scrolling also works.
- **3D model** – true size from `config/design.json`; drag to turn, scroll to zoom,
  dimension lines on/off, click any glowing dot.
- **Day / Night / Monsoon** move the simulated clock to a real matching moment, so the
  picture and the numbers always agree.
- **Curtain** switches the strip curtain: the door heat changes at once.
- **Low graphics** for a slow laptop.
- **Enter the cold room ▸** (photo and 3D): walks to the door, the door opens, and the
  warm-air-in / cold-air-out flow is drawn with the live "Heat entering now" value.
- **Inside** (photo A8–A10 and 3D): wax panels turn blue/clear with the live battery %, the
  evaporator fan spins with the compressor, click the evaporator (live R290 cycle + P–h chart),
  the wax panels (battery, backup, FTCS melt-front graph) or a crate (shelf life from the room's
  real temperature history, chilling warning).
- Press **F** to show the performance readout (frames per second). Below 30 fps, tick Low graphics.

New pictures: put them in `web/assets/images/` (names starting A, B or C) and run

```
python tools/prepare_images.py
```

Hotspot positions (in % of each picture) are in `web/assets/hotspots.json` – edit by hand.

## Where things are

| Folder / file | What it holds |
|---|---|
| `config/design.json` | **All** design values (room size, PCM mass, PV size …). Change numbers here. |
| `data/crops.json` | Crop table for shelf life (with the source of every value). |
| `engine/` | The physics: one small file per topic (loads, R290, PV, PCM, shelf life …). |
| `twin/` | Digital twin: weather download/loading, year simulation, studies. |
| `data/weather_vizag_2025.csv` | Real NASA POWER hourly weather for 2025. |
| `results/`, `figures/` | Outputs of `twin.run_all` and `make_poster_figures.py`. |
| `server/` | FastAPI server: runs the twin and answers "what does every sensor read now". |
| `web/` | The website (HTML/CSS/JS, three.js saved locally in `web/vendor/`). |
| `config/sensors.json` | Every sensor: type, range, accuracy, location, protocol, position, M/C/E/AI tag. |
| `tools/prepare_images.py` | Compresses pictures, removes white backgrounds, makes textures. |
| `tests/` | Automatic checks of the engine, the twin and the server. |
| `ASSUMPTIONS.md` | Every assumption, in plain English. |
