# Notes for the next phases (from Sai's Phase 2 feedback)

## Phase 3 – website
Sai will share two HTML demos made by a junior. Reuse their good ideas, but replace their
physics with our `engine/` and `twin/`:
- An **M / C / E / AI tag** on every number (Measured / Calculated / Estimated / AI-predicted).
- A **sensor table**: type, range, accuracy, location, protocol.
- An **infiltration-by-source table**.
- An **"Inject sensor fault"** button (drives `engine/physics_check.py`).
- **Two rooms side by side**: normal control vs smart (forecast) control.
- **Judge sliders** (What-If screen).

## Phase 4 – ESP32 + "small box test"
- ESP32 with 2–3 DS18B20 sensors in a thermocol box with PCM or gel packs, logging for 1–2 days.
- Build a small lumped model of that box (box U·A from thermocol k and thickness, gel/PCM
  latent + sensible heat, ambient from a sensor) and draw **model vs measured**, giving the
  % difference (e.g. RMSE and mean absolute error as % of the temperature swing).
