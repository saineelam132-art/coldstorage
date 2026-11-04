# Notes for the next phases (from Sai's Phase 2 feedback)

## Picture checklist (web/assets/images/)
Have (as files): A1_outside (= picture 2, corner view with condenser), A2_front, A4_night,
A5_monsoon, A6_door_worker.
Seen in chat but NOT received as files – please add them to the folder: A7 doorway from
inside, A8 inside room, A9 PCM wall, A10 evaporator.
Not received yet: A3 condenser close-up, A11 solar close-up, A12 sensor mast close-up,
all B (cut-outs) and all C (textures).
To regenerate:
- A7: the door must open OUTWARD (door leaf outside the room) with the hinge on the RIGHT
  as seen from inside (it is on the left as seen from outside in A2/A6).
- A1 (optional): day picture from the SAME camera angle as A4 night / A5 monsoon, so the
  day/night/monsoon cross-fade looks like the same photo changing light.


## Pictures still missing
- B10 differential pressure sensor (a drawn placeholder is shown in its panel).
- C1–C7 textures for the 3D model (code-drawn textures are used until then).

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
