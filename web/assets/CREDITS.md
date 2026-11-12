# Image credits

The `.png` pictures directly in `web/assets/images/` (and the converted copies in `img/`, `cutouts/`, `tex/`)
were **Generated with Google Gemini for this project** (REFCOLD India 2026 poster, GVPCE).
They are illustrations, not photographs of the real system. They are used **only in the home concept
scene** (and its batch animation), where every picture carries the label "Concept illustration (AI-generated)".
"How it works" and the component cards use **real photos** or code-made design drawings instead (list below).

| File | Kind | Used for |
|---|---|---|
| A10_interior_evaporator | A | photographic scene |
| A11_solar_canopy_closeup | A | photographic scene |
| A12_sensor_mast | A | photographic scene |
| A1_outside | A | photographic scene |
| A2_front | A | photographic scene |
| A3_exterior_side_condenser | A | photographic scene |
| A4_night | A | photographic scene |
| A5_monsoon | A | photographic scene |
| A6_door_worker | A | photographic scene |
| A7_doorway_from_inside | A | photographic scene |
| A8_interior_wide | A | photographic scene |
| A9_interior_pcm_wall | A | photographic scene |
| B11_gas_sensor | B | cut-out object (background removed) |
| B12_pcm_panel | B | cut-out object (background removed) |
| B13_condensing_unit | B | cut-out object (background removed) |
| B14_qr_tag_crate | B | cut-out object (background removed) |
| B1_crate_leafy | B | cut-out object (background removed) |
| B2_crate_grapes | B | cut-out object (background removed) |
| B3_milk_can | B | cut-out object (background removed) |
| B4_vaccine_box | B | cut-out object (background removed) |
| B5a_worker_side | B | cut-out object (background removed) |
| B5b_worker_back | B | cut-out object (background removed) |
| B6_sensor_box_TRH | B | cut-out object (background removed) |
| B7_temperature_probe | B | cut-out object (background removed) |
| B8_door_reed_switch | B | cut-out object (background removed) |
| B9_controller_box | B | cut-out object (background removed) |
| A2b_front_door_closed_nocurtain | A | photographic scene |
| A6b_door_worker_curtain | A | photographic scene |
| A9b_interior_finned_pcm_wall | A | photographic scene |
| A14_night_wax_cooling | A | photographic scene |
| B15_strip_curtain | B | object picture (white background kept) |
| B16_finned_panel_cutaway | B | object picture (white background kept) |
| B17_split_valve_manifold | B | object picture (white background kept) |

<!-- photos:start (made by tools/photos.py) -->
## Real photos (How it works + component cards)

These are **real photographs**. Photos from Wikimedia Commons show a *typical* product of that kind, not our unit, and are captioned "Example of a …". No manufacturer or shop photos, brand logos or watermarked images.

| Component | File | Author | Licence | Source |
|---|---|---|---|---|
| condensing unit (hermetic compressor + condenser) | `web/assets/photos/condensing_unit.jpg` | AnyNameWillExpire | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) – cropped | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Condensing_Unit.jpg) |
| thermostatic expansion valve (TXV) with its sensing bulb | `web/assets/photos/txv.jpg` | UL Ospala | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:VET_250px.jpg) |
| solar PV array on a farm | `web/assets/photos/pv.jpg` | Shailsh Telang | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Solar_PV_arrays_for_solar_water_pump.jpg) |
| small weather station (wind, temperature, humidity) | `web/assets/photos/weather_mast.jpg` | Globetrotter19 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Anemometer,_Solar_plant,_2025_Nagyv%C3%A1zsony.jpg) |
| waterproof temperature probe (DS18B20 type) | `web/assets/photos/temp_probe.jpg` | Leonardo Postay | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Sensor_DS18B20.jpg) |
| temperature + humidity sensor | `web/assets/photos/trh_sensor.jpg` | Suyash Dwivedi | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:AM2302_(DHT22)_digital_temperature_and_humidity_sensor_module.jpg) |
| magnetic reed door switch | `web/assets/photos/door_switch.jpg` | Georg Pik | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Alarm_sensor_IO_102-54_(Russia,_2021)_(1).jpg) |
| crate of grapes | `web/assets/photos/grapes_crate.jpg` | Gabriele Cantini | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Le_Torri_-_Harvested_Trebbiano_grapes_in_crates.jpg) |
| milk can | `web/assets/photos/milk_can.jpg` | Thesupermat | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Bidons_%C3%A0_lait.JPG) |

Design drawings (made in code, `web/js/drawings.js`): finned wax (PCM) panel.

Photos still wanted (put your own photo at this path, then run `python tools/photos.py`):

- `web/assets/images/real/condensing_unit.jpg` – condensing unit (hermetic compressor + condenser) (a free example photo is shown until then)
- `web/assets/images/real/txv.jpg` – thermostatic expansion valve (TXV) with its sensing bulb (a free example photo is shown until then)
- `web/assets/images/real/solenoid_valve.jpg` – liquid-line solenoid valve
- `web/assets/images/real/evaporator.jpg` – cold-room air evaporator (unit cooler)
- `web/assets/images/real/y_split.jpg` – copper Y-split in the liquid line
- `web/assets/images/real/wax_panel.jpg` – finned wax (PCM) panel (design drawing shown until then)
- `web/assets/images/real/solar_canopy.jpg` – solar PV array on a farm (a free example photo is shown until then)
- `web/assets/images/real/weather_mast.jpg` – small weather station (wind, temperature, humidity) (a free example photo is shown until then)
- `web/assets/images/real/strip_curtain.jpg` – PVC strip curtain in a cold-room door
- `web/assets/images/real/temp_probe.jpg` – waterproof temperature probe (DS18B20 type) (a free example photo is shown until then)
- `web/assets/images/real/trh_sensor.jpg` – temperature + humidity sensor (a free example photo is shown until then)
- `web/assets/images/real/door_switch.jpg` – magnetic reed door switch (a free example photo is shown until then)
- `web/assets/images/real/gas_sensor.jpg` – small gas sensor module
- `web/assets/images/real/grapes_crate.jpg` – crate of grapes (a free example photo is shown until then)
- `web/assets/images/real/greens_crate.jpg` – crate of leafy greens
- `web/assets/images/real/milk_can.jpg` – milk can (a free example photo is shown until then)
- `web/assets/images/real/vaccine_box.jpg` – vaccine cool box
<!-- photos:end -->

## Software

- three.js r160 (MIT licence) – `web/vendor/three/` – https://threejs.org
- Chart.js 4.4.4 (MIT licence) – `web/vendor/chartjs/` – https://www.chartjs.org
- qrcode-generator 1.4.4 (MIT licence) – `web/vendor/qrcode/`
- Weather data by Open-Meteo.com (CC BY 4.0); NASA POWER; ISHRAE 2014 design year (not redistributed).
- All 3D objects are built in code from simple shapes; no third-party 3D models are used.
- No brand logos are used. The small Gemini sparkle mark in the corner of each picture is
  Google's visible AI-image watermark and is left in place on purpose.
