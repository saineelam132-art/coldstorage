# Assumptions (plain English)

Every number the website shows comes from a formula in `engine/`. Where we had to
**choose** a value that is not in our design data, it is listed here, with the reason.
All design values live in `config/design.json` — change them there.

## Walls
1. **U = k / thickness = 0.022 / 0.100 = 0.22 W/m²K.** We ignore the thin air films on
   each side of the wall and the steel skins. Air films would lower U slightly (by ~3 %),
   so our wall load is a little on the safe (high) side.
2. Heat-transfer area = 25.6 m² for all 6 faces, as given. No extra allowance for
   thermal bridges (door frame, bolts). No solar heating of the outer wall (the room is
   assumed to be in shade). Both would add a little load — a known limitation.

## Door
3. Door 0.8 m × 1.8 m (as asked). For the single **design-point** calculation we use
   3 openings per hour, 15 s each. For the **year simulation** we use a farm-gate schedule
   (`door_schedule` in design.json): 6 openings/h in the loading hours 7–10 am and 4–7 pm,
   2/h in the middle of the day, 1/h around 6 am and 7–10 pm, 0.1/h at night (10 pm–6 am).
   That is about 54 openings a day. Each opening lasts a random 8–22 s. In LIVE mode the
   reed switch gives the real open time, so these guesses are not used.
4. **D_f = 1.1 is kept on purpose (safe side).** The ASHRAE Refrigeration Handbook often
   uses a doorway flow factor **D_f ≈ 0.7–0.8** for doors with a large temperature
   difference (the cold air does not fully develop its flow before the door closes). With
   0.8 instead of 1.1, the door load would be about 27 % smaller. We prefer to over-estimate.
5. **A strip curtain is installed by default (E = 0.85).** Without a curtain, the door load
   at 35 °C is about 0.58 kW — about seven times more. The What-If screen can switch it off.
6. Infiltration is split into **sensible** (cooling the air) and **latent** (removing its
   moisture) by evaluating the enthalpy difference in two steps:
   sensible = h(T_out, W_out) − h(T_in, W_out); latent = h(T_in, W_out) − h(T_in, W_in).
7. Room air is assumed to be at 90 % RH (typical for produce storage).
8. Air pressure is sea level (101 325 Pa) until real weather pressure is loaded in Phase 2.

## Product
9. Pull-down load uses the given 200 kg, 25 → 5 °C in 4 h, cp = 3.9 kJ/kg·K.
10. **Respiration heat** is taken from a table value at the crop's reference temperature
    (ASHRAE / USDA ranges, rounded) and scaled with the same Q10 as spoilage. It is small
    (≈ 4 W for 200 kg of tomato at 5 °C) and only matters for long storage.

## Fans and lights
11. Evaporator fan 40 W, LED light 10 W (on 10 % of the time, or whenever the door is open),
    controller + sensors 5 W. All this electricity ends up as heat inside the room.

## Refrigeration (R290)
12. Simple cycle: saturated vapour leaves the evaporator, saturated liquid leaves the
    condenser (**no superheat, no subcooling**), as in the corrected poster numbers.
    Superheat/subcooling can be switched on in the config.
13. Evaporating temperature fixed at −5 °C. **Live condensing temperature = ambient + 10 K.**
14. Isentropic efficiency 0.75 and motor/inverter efficiency 0.85 are taken as constant.
    A real inverter compressor's efficiency changes a little with speed — ignored.
15. Pressure drops in pipes and heat exchangers are ignored.

## Solar PV
16. NOCT = 45 °C (typical crystalline-silicon panel datasheet value).
17. Light on the tilted panel is calculated from the horizontal value with the Erbs
    diffuse split and the isotropic-sky model; ground reflectance 0.20.
18. Performance ratio 0.79 already includes inverter, wiring, dust and mismatch losses, so
    we only add the cell-temperature correction on top.

## PCM (wax battery)
19. **Latent heat 190 kJ/kg** — the datasheet range is 190–200 kJ/kg; we use the lower
    value so we never over-promise backup time.
20. The wax melts/freezes at **exactly 4 °C** (real paraffin melts over a range of 1–2 K).
21. "Battery %" = the fraction of wax that is frozen (as asked).
22. "Cold energy remaining" also counts sensible heat: from the wax's present state up to
    **all-liquid at 8 °C** (the top of the allowed band). Below 4 °C, the extra cold stored
    in the solid wax (cp = 1.8 kJ/kg·K) is counted too.
23. Backup time = cold energy remaining ÷ the **holding load** right now (no new produce).
    At 35 °C outside with the curtain, a full battery gives ≈ 21 hours.
24. Wax slabs cover 12 m² of wall → slab thickness = 115 / (800 × 12) ≈ 12 mm.
    Air-side heat-transfer coefficient 15 W/m²K (air moved by the evaporator fan).

## PCM slab model (FTCS)
25. One-dimensional: heat flows only through the thickness of the slab. The face against
    the insulated wall is treated as having no heat flow. Thermal conductivity is the same
    (0.2 W/m·K) for solid and liquid; natural convection inside the liquid wax is ignored
    (this is the usual simplification and is slightly conservative).
26. 24 grid cells across the slab, time step chosen so r = α·Δt/Δx² = 0.4 (must be ≤ 0.5).

## Shelf life
27. The Q10 model is a **simple, widely used estimate**. Reference shelf lives come from the
    USDA Agriculture Handbook 66 (2016); Q10 values are typical literature values (2–4)
    and are approximate. Each crop's source is written in `data/crops.json`.
28. "Remaining days" is given **at the crop's reference temperature**, and also "if kept at
    today's temperature".
29. The Q10 model says colder is always better, which is wrong for chilling-sensitive crops.
    So we add a separate **chilling-injury warning** (after 1 hour below the crop's limit).
    The model does not reduce the shelf life for chilling injury — it only warns.
30. Vaccines are shown as an illustration using the WHO VVM30 category; real vaccines must
    follow their own VVM label.

## Physics check (sensor anti-tamper)
31. A reading is flagged "Sensor suspicious" if it differs from the twin's prediction by more
    than **1.5 K for more than 15 minutes**. Short spikes (door opening) are ignored.

## Weather (Phase 2)
32. **Source:** NASA POWER hourly data for 2025. The POWER web API was blocked from the
    computer that built this project, so the data was taken from **NASA's official copy of
    the same POWER data on AWS Open Data** (`s3://nasa-power`): sunlight from CERES SYN1deg
    (1° grid cell 17.5 N, 83.5 E), temperature/humidity/wind/pressure from MERRA-2
    (0.5° × 0.625° cell 17.5 N, 83.125 E). The nearest grid cell is used, not interpolated.
    `python -m twin.fetch_weather` tries the API first, then AWS, then prints the steps to
    download it by hand. The file header records the source.
33. NASA hourly values are averages over the hour that **starts** at the UTC time stamp
    (checked: our sun-position code matches NASA's top-of-atmosphere sunlight with
    correlation 0.9994 only with this convention). We convert to IST (UTC + 5:30).
34. Converting to IST pushes the last 5 night hours of 31 Dec into 2026; we wrap those 5
    hours to the start of 1 Jan 2025 so we have 365 full days.
35. Inside the simulation the hourly values are interpolated linearly to 5-minute steps.
36. **2025 was a slightly dull year:** 4.82 kWh/m²/day against a 2001–2024 average of
    4.97–5.00 (May 2025 was 17 % below normal). The old report's 5.0–5.2 matches the long-term
    average. We design on 2025 (the real recent year), which is slightly on the safe side.
37. Sunny / cloudy / rainy days are classed by **daily irradiation on the tilted panel**:
    ≥ 5.0, 2.5–5.0, < 2.5 kWh/m². "Rainy" here means "very dull" — we do not use rain data.
    Seasons follow IMD: Winter Jan–Feb, Summer Mar–May, Monsoon Jun–Sep, Post-monsoon Oct–Dec.

## Digital twin room model (Phase 2)
38. The room is one "lumped" node: air (11 kJ/K) + inner structure, shelves and crates
    (60 kJ/K, guessed) + **600 kg of produce already stored** (3 days × 200 kg, 2 340 kJ/K).
    This stored produce is a big cold store by itself — it is why the room warms only
    slowly in a power cut.
39. A new 200 kg batch arrives **every day at 8 am at 25 °C**. It cools towards the room air
    with a heat-transfer rate chosen so that it gets 7/8 of the way in 4 h (the industry
    "seven-eighths cooling time"). After 24 h it joins the stock and an older batch of the
    same size leaves at room temperature.
40. The whole door load (sensible + latent) is added to the room as heat. In reality the
    latent part partly shows up as higher humidity instead — so our room temperature is
    slightly pessimistic.
41. Respiration heat uses the default crop in design.json (tomato) for all stored produce.
42. **Compressor:** inverter, can run from 30 % to 100 % of its maximum capacity. It runs on
    solar only if the panels give enough power for 30 % capacity. Efficiency is the
    Phase 1 R290 cycle with T_cond = T_amb + 10 K (seasonal COP ≈ 3, higher than the
    50 °C design-point 2.2 because Vizag is usually cooler than 40 °C).
43. **PCM charging:** the evaporator also has a coil inside the PCM slabs (−5 °C). Charging
    rate is limited by the compressor and by heat flow through half the slab thickness
    plus a coil resistance of 0.01 m²K/W. Charging stops when the wax is fully frozen and
    has cooled to 3 °C (to avoid over-cooling the room).
44. **PCM ↔ room air** heat flow uses the slab area (12 m²), the air-side coefficient
    (15 W/m²K) and half the slab thickness. A heavier PCM makes thicker slabs, which
    exchange heat a little more slowly.
45. **Controller (normal):** on solar, hold the room at 5 °C, then put all spare cooling into
    the PCM. With no sun the PCM cools the room on its own. The ATS switches to grid only when
    there is no sun **and** (PCM < 15 % **or** room > 7.5 °C), and stays on grid until the sun
    returns. On grid the compressor holds the room at 5 °C but does **not** recharge the PCM.
46. **"Grid backup hours"** = time the ATS is switched to grid. **"Day fully on solar + PCM"**
    = a day with no grid connection at all.
47. The small loads (evaporator fan, controller) need power at night; we assume a small DC
    battery charged by the panels supplies them. It is not modelled; their heat is counted.
48. **"Solar wasted"** = solar electricity available but not used by the compressor (the wax
    is already frozen and the room already cold). It could run other loads.
49. The grid is assumed to be available whenever the ATS asks for it, except in the
    power-cut study.
50. **Random door openings use a fixed seed (2026)**, so every run gives exactly the same
    numbers, and every case in the parametric study sees the same door openings.

## Forecast-based charging
51. Uses **tomorrow's real weather from the same file as a perfect forecast** (a real
    forecast would be less accurate, so the real saving would be somewhat smaller).
    If tomorrow is sunny (≥ 5 kWh/m² on the panel), the PCM may be run down to 5 % tonight
    before the ATS switches to grid. If tomorrow is cloudy/rainy, today's spare sun
    pre-cools the room and stock to 3 °C (still inside 2–8 °C).

## Power-cut night
52. The hottest evening of 2025 (9 June, 6 pm–6 am average) with the grid off from 6 pm to
    6 am. "Light room" = only 200 kg of produce stored instead of 600 kg.

## Choosing the recommended design
53. Rule: never leave 2–8 °C, grid backup ≤ 100 h/yr (about 2 h a week), then the
    **cheapest** using **indicative prices** in design.json: PCM ₹300/kg (encapsulated),
    PV ₹40 000/kWp (installed, no battery), compressor ₹20 000/kW. **These prices are guesses
    — replace them with real quotations.** `results/price_sensitivity.csv` shows the choice
    if prices change.

## Website (Phase 3)
54. In SIMULATED mode the twin has **one room-air node**, so the low / middle / high / evaporator
    room sensors all show the same value. Real sensors will differ (warm air rises).
55. The door is drawn **90° open** whenever the twin's door switch says "open". The twin knows
    how many seconds the door was open in each 5 minutes; the website puts that opening at the
    start of the 5 minutes.
56. **Doorway air speed and stack pressure** are **calculated (tag C)** from the same ASHRAE
    formula as the door load: V̇ = 0.221·A·√(gH(1 − ρ_out/ρ_in))·F_m in each direction,
    mean speed ≈ V̇/(A/2), reduced by (1 − E) with the curtain; Δp at the top of the door
    = (ρ_in − ρ_out)·g·H/2. When the real sensors are fitted they become measurements (M).
57. "Heat entering now" = the door load **while the door is open** (q·D_f·(1 − E)); the year
    simulation uses its time average (× D_t).
58. Sensor positions in `config/sensors.json` and the module size for drawing (8 × 225 W,
    0.87 × 1.30 m, two rows) are our layout choices, matched to the Gemini pictures.
59. The ethylene/gas sensor is **not simulated**: it shows "no sensor connected" until a real
    sensor sends data (Phase 4).

## What two key numbers mean
60. **Seasonal COP ≈ 3.0** = cooling delivered over the whole year ÷ compressor electricity
    over the whole year. It is the same kind of COP as the **2.2 design value** (electrical COP,
    including the 0.75 isentropic and 0.85 motor/inverter efficiencies). It is higher because
    2.2 is calculated at 50 °C condensing (40 °C outside), while in the real 2025 year the
    outside temperature, weighted by when the cooling is done, is about **28.8 °C**, so the
    condenser runs near 39 °C. A cooler condenser needs less compressor work.
61. **The energy-balance check (error ≈ 10⁻¹¹ %)** checks the model's **bookkeeping**: every kJ
    the code adds or removes is accounted for (heat in = heat out + change in stored heat).
    It does **not** show that the physics (U-value, door formula, wax behaviour) is right.
    That is what the **small-box test in Phase 4** does: a real box, real sensors, and the
    model's prediction compared with the measurement.
