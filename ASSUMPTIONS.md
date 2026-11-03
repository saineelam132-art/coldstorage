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
3. Door 0.8 m × 1.8 m (as asked). **3 openings per hour, 15 s each** is our guess for a
   normal hour; loading hours will be busier (Phase 2 makes this random). In LIVE mode the
   reed switch gives the real open time, so this guess is not used.
4. **D_f = 1.1** (as asked in the brief). Note: the ASHRAE Handbook often uses D_f ≈ 0.7–0.8
   for doors with a large temperature difference; 1.1 is the more conservative choice.
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
