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

## Shared data, tamper detection, check-out and space planning

Trust & Trade, the alert page and the home tiles share one saved database (Cloud Firestore on Firebase Hosting,
offline demo elsewhere) – see **docs/firebase_setup.md** for the console clicks and deploy commands.
* Owner page → **Demo: tamper a sensor** (room air, core, door, outside, humidity × freeze / offset / stop / edit an old
  reading). Every reading is checked automatically (`web/trust/detector.js`: Φ, missing readings, stuck values, humidity
  pair, outside vs weather, hash chain); an alert and a FLAG block are written by themselves; the home ROOM tile turns
  red and opens `alert.html?id=…` (reported vs physics, failed checks, Φ timeline, hash evidence, consequences, Mark reviewed).
* Farmer: expected take-out date, **Take out produce** (CHECKOUT block), **Book space for later**.
  Owner: Void (VOID block, history kept), **Space calendar** (30 days), reservations accept/reject, one-click
  "on <date> you can bring up to … kg" (WhatsApp text), **Demo: reset (admin)** for CH-DEMO only.
* Tests: tests/test_tamper.py (every action ≤ 30 min, normal days no alert), tests/test_shared_data.py (browser flow;
  live sync + security rules when the Firestore emulator runs).

## Money audit and Tomorrow's plan

* `python -m engine.economics` → `results/live/economics_2026.json` + page **money.html** ("Money: how we calculate", linked
  from the Live page): grid-only, diesel-only (2 kVA genset part-load curve), grid + diesel in cuts, and our room on the same
  weather and load; every formula with its numbers, editable inputs, payback with/without produce value and subsidy, a check
  section and the list of assumptions.
* `python -m twin.advisor` → `web/live/data/advisor.js`: **Tomorrow's plan** (and the day after, lower confidence) in the
  home page ☰ menu, a chip in the top strip and on the Live page Today/Tomorrow tabs. Rules: normal / low sun / storm
  (thunderstorm or heavy-rain code, gusts > 60 km/h, sun < 1 kWh/m², or ≥ 64.5 mm rain) with the link to IMD warnings.
Both run in the 3-hourly GitHub Action.

## Room & capacity, Reality check, best daily load

```
python -m engine.space            # space budget of the 8.8 m3 room -> results/live/space_budget.json, figures/final_11
python -m twin.stress_2026        # each loophole alone, then all together -> results/live/stress_2026.json
python -m twin.best_load_2026     # daily intake 100-350 kg x stay 1/3/7 days, PV / wax / fin sizing -> best_load_2026.json
python tools/make_reality_figures.py   # figures/final_12_energy_day, final_13_stress_cases, final_14_best_load
```

Control centre → **Room & capacity** and **Reality check**. The base case reproduces the published numbers exactly
(tests/test_reality.py). Every option is off unless a case switches it on (`real=` in twin/live_sim.py).
Assumptions are tagged E with their values in the JSON files.

## Calendar: jump to any moment of 2026

Bottom bar: **📅 date** opens a month calendar (1 Jan 2026 → today; tomorrow only as a *forecast*; grey = no data).
Dots: green = fully on solar + wax, orange = some grid use, grey = rainy/cloudy day. Point at a day for max outside °C,
sun kWh/m², grid hours and ₹ saved. Quick links inside: hottest day, hottest night, most grid use, a monsoon day.
The slider next to it sets the time (5-minute steps). The whole site jumps there and the clock keeps running at the
chosen speed; **● Now** returns to the real time. The moment is in the address, e.g. `index.html?t=2026-05-23T14:00`
(also `?judge=1&t=…` to open judge mode on a fixed day). Keyboard: arrows move days, PgUp/PgDn months, Enter picks,
Esc closes. Offline / Firebase / Vercel: days without saved 5-minute steps are rebuilt in the browser from the hourly
Live Year Run files (same twin run; the strip then says "5-min detail from hourly results").

## Trust & Trade (farmer → owner → transporter → buyer)

Open **🤝 Trust & Trade** in the top bar (or `trust.html`; works from the static folder and offline too).
Pick a role at the top. Everything is a demo: the ledger is kept in this browser; **Demo: reset** clears it.

* **Farmer** – check in (at most 150 kg in the room, never more than the free space; least-loaded of 6 bays).
  You get a slip ID `CT-YYMMDD-NNN`, the genesis block and a printable A6 slip with a QR
  `{slipId, bay, genesisHash, sig}`, sig = HMAC-SHA256. Freshness and price of your produce update live.
* **Cold-store owner** – move the twin clock (each 5 min = one READING block with the four nodes N1–N4),
  see the Φ gauge, the 24-h chart, alarms, the read-only ledger and the daily anchors.
  Demo buttons: *Edit an old reading* (chain breaks), *edit + re-hash* (daily anchor catches it),
  *Report fake readings from now on* (4.0 °C; hashes stay valid, Φ catches it).
* **Transporter** – verify the QR, sign the hand-over, add transit readings (typed, or the vehicle model),
  deliver. Shows the freshness lost per leg (farm, storage, transport).
* **Buyer** – runs 5 checks (signature, all hashes, no gaps, daily anchors, physics flags) and settles:
  intact → price by freshness; broken → payment FROZEN; physics flag → payment ON HOLD.

Signing key: the Python server reads it from the environment variable `KOOLKISAAN_HMAC_KEY`
(set it before `python run.py`; never put it in a file in the repository). The static/Vercel copy has no
server and uses a clearly labelled public demo key.

Re-make the node data and the Φ numbers (σ tuning, false flags, fake detection) after a design change:

```
python -m twin.trust_nodes
```

→ `web/trust/data/trust_data.js` and `data/trust/phi_2026_stats.json` (not in results/).
More: `docs/cloud_architecture.md` (AWS/Azure/GCP mapping), `docs/schemas/` (block and telemetry JSON
Schemas), `tools/mqtt_simulator.py` (sends the node data as MQTT messages, or prints them).

## Hosting the website (Firebase main, Vercel backup)

The public website is the `static_site/` folder (plain files, no Python). It is served from two places:

* **Firebase Hosting**, site `koolkisan` → https://koolkisan.web.app (settings in `firebase.json`,
  `"public": "static_site"`). Deploy by hand with the Firebase CLI (steps below).
* **Vercel** (backup) – unchanged; it redeploys by itself when the GitHub Action commits a new `static_site/`.

First time on a Windows laptop (needs Node.js LTS from nodejs.org), in a Command Prompt:

```
npm install -g firebase-tools
firebase login
cd <your folder>\coldstorage
git pull
firebase use --add
firebase hosting:sites:create koolkisan
firebase deploy --only hosting:koolkisan
```

`firebase use --add` asks which Firebase project to use (pick it, alias `default`); it writes `.firebaserc`.
`hosting:sites:create` is needed only once (it says so if the site already exists). After that, every update is:

```
git pull
firebase deploy --only hosting:koolkisan
```

Backend CORS: browsers on the hosted sites may call the Python server's `/api/...` only if their origin is in
`config/hosting.json` (`cors_origins`) or in the environment variable `KOOLKISAAN_CORS_ORIGINS`
(comma-separated, e.g. the Vercel URL). The hosted pages do not need the server: without it, Trust & Trade
uses the labelled demo key.

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
