# Presenter note – 2 minutes at the poster (REFCOLD India 2026, Pune)

All numbers: **simulated – digital twin on real 2026 Visakhapatnam weather (1 Jan – 5 Nov, Open-Meteo,
sunlight × 0.88 = conservative), final design.** Prices are guesses. Point at the screen while talking.

**0:00 – The problem (15 s)**
"Small farmers near Vizag lose fresh produce because there is no cold room nearby, or the grid
fails. We designed a 150 kg cold room that runs on the sun – and keeps cold at night without a battery."

**0:15 – The idea (25 s)** – *main site, outside view, then inside*
"1.8 kW of solar panels run an R290 (propane) compressor in the day. It cools the room AND freezes
115 kg of wax (PCM, melts at 4 °C). At night the compressor sleeps and the wax is the cold battery.
No battery for cooling – only a small 12 V 40 Ah battery for the controller and sensors."

**0:40 – How we improved it (30 s)** – *Live 2026 → Design choices, or figure final_00*
"Plain wax panels could not pass the heat fast enough: only 42 days a year on solar + wax.
A baffle with 5 fans fixed that – 294 days – but added moving parts and an 80 Ah battery.
Our final design uses **aluminium fins**: 4.3 times more surface, natural convection only, **zero
watts, nothing that moves**, and the battery is halved – 291 days, almost the same."

**1:10 – The results (30 s)** – *Live 2026 → Year so far*
"In 2026 so far: **290 of 309 days fully on solar + wax**, about 165 grid hours a year,
3.0 kWh of electricity a day. The room never left 2–8 °C except for about 1.6 hours each morning
while a fresh warm batch cools – and then only fresh produce is inside. That saves about
₹10,600 a year against a grid-only room, ₹26,500 against grid + diesel, and about
0.9–1.2 tonnes of CO₂. Rough payback (prices are guesses): about 5–6 years against a diesel-backed
room, 3 years with a 35 % subsidy."

**1:40 – Trust (15 s)** – *click Ledger, or scan a crate QR code*
"Every batch gets a QR code, and every hour the readings are sealed in a hash chain. If someone
changes one old reading, the chain turns red and the buyer's page shows 'Record changed'."

**1:55 – Close (5 s)**
"Phase 4: we build it and measure – especially how well the fins really work. Thank you!"

---
**If asked:**
- *Why not a battery?* The wax stores cold for about ₹300/kg; batteries for 1.5 kW of cooling all night
  would cost far more and wear out.
- *Are the fins proven?* Two published fin-array correlations; we use the lower one and ignore
  radiation. If the real fins are 25 % weaker the room still stays in 2–8 °C; grid hours rise and we
  can add the 2 optional 12 V fans (mounting points and cable are already in).
- *Payback against a grid-only room?* Long – about 18 years, 12 with the subsidy – because grid power is
  cheap when it is there. The case is strongest where the grid fails and people use diesel.
- *Water on the fins?* Yes – they are below the dew point. A sloped drip tray with a drain and trap.
- *Tomorrow?* The Live page runs the Open-Meteo forecast through the same physics – a PREDICTION, not AI.
- *Weather credit:* Weather data by Open-Meteo.com.
