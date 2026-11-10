# KoolKisaan

Demo website and digital twin for the REFCOLD India 2026 poster
**"Blockchain-Secured Hybrid Solar–PCM Cold Storage with Natural-Refrigerant (R290) VCR System"**
(GVPCE, Visakhapatnam).

> Status: **Phase 1 (engine) and Phase 2 (digital twin) done. Phase 3 (website) steps 1–5 of 6 done.**

## Install (Windows, once)

1. Install Python 3.11, 3.12 or 3.13 from python.org (tick "Add Python to PATH").
2. Open a Command Prompt in this folder and run:

```
pip install -r requirements.txt
```

## Phase 1 – check the engine

Run all tests (should say `111 passed`):

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
| `bom_final.csv` | Cost table for the **final design** (115 kg wax with aluminium fins, 1.8 kWp, drip tray, 40 Ah battery) – **all prices are guesses** (`python tools/make_bom.py`) |
| `bom_recommended.csv` | Cost table for the 2025 sizing-study design (kept for reference) |
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
- **Auto / Day / Night / Monsoon** – Auto follows the clock and the weather by itself. Day,
  Night and Monsoon **stay** until another button is clicked: the clock plays a real stretch of
  2026 of that kind in a loop (sunniest day 9 am–4 pm; 8 pm–5 am; rainiest day 9 am–4 pm), so the
  picture and every number belong to that mode.
- **☰ (top left)** opens the "Outside now" menu: date, IST clock and this hour's measured
  outside weather (air temperature, humidity, wind, solar irradiance, sky) from Open-Meteo.
- **Curtain** switches the strip curtain: the door heat changes at once.
- **Low graphics** for a slow laptop.
- **Enter the cold room ▸**: walks to the door, the door opens, and the
  warm-air-in / cold-air-out flow is drawn with the live "Heat entering now" value.
- **Inside** (pictures A8–A10): wax panels turn blue/clear with the live battery %, the
  evaporator fan spins with the compressor, click the evaporator (live R290 cycle + P–h chart),
  the wax panels (battery, backup, FTCS melt-front graph) or a crate (shelf life from the room's
  real temperature history, chilling warning).
- Press **F** to show the performance readout (frames per second). Below 30 fps, tick Low graphics.

New pictures: put them in `web/assets/images/` (names starting A, B or C) and run
(B pictures get their white background removed with `rembg`; install once with
`pip install "rembg[cpu]"` – it downloads its 176 MB model the first time, then works offline)

```
python tools/prepare_images.py
```

Hotspot positions (in % of each picture) are in `web/assets/hotspots.json` – edit by hand.

## Live Year Run (real 2026 weather, today, tomorrow)

Open **📅 Live 2026** in the top bar (or `live.html`). Tabs: Year so far, Calendar (click a
day for hour-by-hour graphs), Today, Tomorrow (a **prediction**: the Open-Meteo forecast run
through our physics twin), Design year (ISHRAE) vs 2026, Money, **Design choices** (the design
journey plain → baffle + fans → fins, the fin calculation, floor space, loading options, wax
size), Fixed inputs.

**Final design:** 115 kg wax (PCM) with 40 mm aluminium fins (23 mm gap, 1.7 m panels, no fan,
no baffle), 1.8 kWp PV, 1.5 kW R290 compressor, 150 kg produce loaded at 6 am, 12 V 40 Ah battery
for controller/sensors/IoT only. Studies and poster figures:

```
python -m twin.design_study_2026      (loading options, design journey, wax size, fin table, floor check)
python -m twin.fin_study_2026         (fins vs baffle + fans, options A/B/C)
python -m twin.live_run               (the 2026 run shown on the pages)
python tools/make_final_figures.py    (figures/final_*.png + .svg, 300 dpi; results_summary "Final design (2026)")
python tools/make_bom.py             (cost tables + payback ESTIMATE -> results/payback.json)
```

Phase 2 figures (`figures/01…14`) are labelled "How we chose the size (NASA POWER 2025 study)".
The presenter note for the 2-minute talk is `docs/PRESENTER_NOTE.md`.

Update it by hand (needs internet; otherwise it uses the last saved data):

```
python -m twin.live_run --fetch
```

**Every day at 06:00 IST** (GitHub often starts scheduled jobs late – on 5 and 6 Nov it ran at
about 12:35 IST) GitHub runs `.github/workflows/daily-live.yml`: it downloads the
weather, runs the twin, rebuilds `static_site/` and commits. To check it ran:
1. GitHub → your repository → **Actions** tab → "Daily Live Year Run": a green tick for today.
2. The commit list shows "Daily Live Year Run <date>".
3. The Live page shows "Weather last updated: <today, about 06:0x IST>".
To run it now: Actions → Daily Live Year Run → **Run workflow**.

Fixed inputs live in `config/design.json` → `live_run`. With `python run.py` they can be edited
on the "Fixed inputs" tab (the twin re-runs in about 15 s), and the server refreshes the weather
every hour while the laptop is online.

Weather data by Open-Meteo.com (CC BY 4.0). The ISHRAE design-year file is **not** stored in
git (its licence forbids sharing); it is downloaded where it is used and only our simulation
results are published.

## Home page, judge mode and the picture editor

* Header: the **KoolKisaan** logo, name and tagline "Cold from the sun, wax for the night, truth in the
  ledger." (logo file `web/public/koolkisaan-logo.png`, also the browser-tab icon).
* The home page opens on **today in Visakhapatnam** (IST); **● Now** (bottom right) brings the clock back
  to the present. **☰** opens the "Outside now" menu with the measured outside weather (tag **W**);
  calculated room values are in the data bar, the detail cards and Control centre → Sensors.
* It works **offline**: everything is on the laptop (no internet fonts or libraries). With no internet
  the menu says "Offline – using data from …".
* `?judge=1` (e.g. `http://localhost:8000/?judge=1`): full screen, big fonts, the demo plays slowly and
  loops; click on the picture to pause / resume.
* `?edit=1`: click on a picture and its x, y in % appears on screen and in the browser console – copy it
  into `web/assets/hotspots.json` to move a dot exactly onto its sensor.
* **Real photo:** put it in `web/assets/images/real/` and tell us the file name; it becomes the
  `"home_photo"` in `web/assets/scenes.json` with its own entry in `hotspots.json`.
* The GitHub Action runs **every 3 hours** (weather + twin + static site).

## How sure are we? (expected site error – not measured)

* `config/site_error_budget.json` holds the expected differences between Open-Meteo grid data and a
  sensor at our exact site, from published studies (temperature, dew point, humidity, sunlight, wind,
  pressure, PV energy), each with its source. **They are not our measurements.**
* On the website they appear as grey "expected at site: …" text and shaded bands, tag **W±**
  (☰ menu, weather sensor cards and graphs, "Outside" in the data bar). Wind is shown at **2 m**
  (FAO-56: 0.748 × the 10 m value); dew point is shown next to humidity.
* `python -m twin.uncertainty_2026` re-runs the twin with those errors (base, hot site, cool site,
  200 random sites, fixed seed) on the frozen study weather `data/uncertainty/weather_2026_study.csv`
  → `results/live/uncertainty_2026.json`; the base case reproduces `design_study_2026.json` exactly.
  Control centre → **How sure are we?** shows it; poster chart `figures/final_10_uncertainty.png`.

## At the stall

**Normal start:** double-click `start.bat`. It uses **Python 3.12** first (`py -3.12`, because
CoolProp needs 3.12) and falls back to `python` only if 3.12 is not found. If Python fails,
it opens the static backup by itself. Install the packages for 3.12 once with:

```
py -3.12 -m pip install -r requirements.txt
```

**Static backup (no Python at all):** open `static_site/index.html` in Chrome or Edge
(double-click). Everything works from saved files: photo view, demo, Control centre,
batches, QR, ledger, tamper, sensor fault. Limits: only the saved demo days (hottest,
sunniest, rainiest, most-grid days and their neighbours; the clock jumps between them), and
phones cannot open the QR buyer page (no server) – open it on the laptop.
After changing the design or the website, rebuild it:

```
sh tools/build_static_bundle.sh
```
```
python tools/export_static.py
```
(the first needs Node.js once; the result is saved in the repository).

**Guided tour:** press **▶ Start tour** (about 2 minutes, 13 steps). → / ← next / back,
Space pause, Esc stop.

**Control centre:** Calculations (every formula + heat by source), What-If sliders, Two rooms
(normal vs smart control, live), Year results (poster graphs), Sensors (type, range,
accuracy, location, protocol).

**Batches and ledger:** **+ New batch** → the worker walks in → batch card with QR code.
**⛓ Ledger** shows the hash-chain; *Tamper with an old reading* turns it red from that block;
*Inject sensor fault* makes the room sensor read +3 °C → flagged after 15 min and sealed.

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
| `web/` | The website (HTML/CSS/JS; Chart.js and the QR library saved locally in `web/vendor/`; logo and icons in `web/public/`). |
| `config/sensors.json` | Every sensor: type, range, accuracy, location, protocol, position, M/C/E/AI tag. |
| `tools/prepare_images.py` | Compresses pictures, removes white backgrounds, makes textures. |
| `static_site/` | The static backup (opens without Python). |
| `tests/` | Automatic checks of the engine, the twin and the server. |
| `ASSUMPTIONS.md` | Every assumption, in plain English. |
