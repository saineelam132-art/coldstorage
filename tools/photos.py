"""Real photos for "How it works" and the component cards (no AI pictures there).

    python tools/photos.py            rebuild web/assets/photos.json + the photo list in web/assets/CREDITS.md
                                      (offline: uses the credits already saved)
    python tools/photos.py --fetch    also download the freely licensed Wikimedia Commons photos listed below
                                      (needs commons.wikimedia.org + upload.wikimedia.org)

Order of preference for every component:
  1. YOUR OWN photo in web/assets/images/real/<name> (see OWN below; .jpg, .jpeg, .png or .webp)
  2. a freely licensed Commons photo (CC0 / public domain / CC BY / CC BY-SA) – shown as
     "Example of a <component>" with "Photo: <author>, <licence>" underneath
  3. our own design drawing made in code (wax panel – it is our own design, no photo can exist)
  4. nothing (the card shows "Photo needed: …" so it is clear what is missing)
No manufacturer or shop photos, brand logos or watermarked images.
"""
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "web" / "assets"
OWN_DIR = ASSETS / "images" / "real"
DL_DIR = ASSETS / "photos"
OUT = ASSETS / "photos.json"
CREDITS = ASSETS / "CREDITS.md"
UA = {"User-Agent": "KoolKisaanDocs/1.0 (student project; photo credits kept in CREDITS.md)"}
FREE = ("cc0", "public domain", "cc by", "cc-by", "pd")

# key: (what it is, your own file name in web/assets/images/real/, Commons file or None, design drawing or None)
COMPONENTS = {
    "condensing_unit": ("condensing unit (hermetic compressor + condenser)", "condensing_unit.jpg", "File:Condensing Unit.jpg", None),
    "txv": ("thermostatic expansion valve (TXV) with its sensing bulb", "txv.jpg", "File:VET 250px.jpg", None),
    "solenoid_valve": ("liquid-line solenoid valve", "solenoid_valve.jpg", None, None),
    "evaporator": ("cold-room air evaporator (unit cooler)", "evaporator.jpg", None, None),
    "y_split": ("copper Y-split in the liquid line", "y_split.jpg", None, None),
    "wax_panel": ("finned wax (PCM) panel", "wax_panel.jpg", None, "wax_panel"),
    "pv": ("solar PV array on a farm", "solar_canopy.jpg", "File:Solar PV arrays for solar water pump.jpg", None),
    "weather_mast": ("small weather station (wind, temperature, humidity)", "weather_mast.jpg", "File:Anemometer, Solar plant, 2025 Nagyvázsony.jpg", None),
    "strip_curtain": ("PVC strip curtain in a cold-room door", "strip_curtain.jpg", None, None),
    "temp_probe": ("waterproof temperature probe (DS18B20 type)", "temp_probe.jpg", "File:Sensor DS18B20.jpg", None),
    "trh_sensor": ("temperature + humidity sensor", "trh_sensor.jpg", "File:AM2302 (DHT22) digital temperature and humidity sensor module.jpg", None),
    "door_switch": ("magnetic reed door switch", "door_switch.jpg", "File:Alarm sensor IO 102-54 (Russia, 2021) (1).jpg", None),
    "gas_sensor": ("small gas sensor module", "gas_sensor.jpg", None, None),
    "grapes_crate": ("crate of grapes", "grapes_crate.jpg", "File:Le Torri - Harvested Trebbiano grapes in crates.jpg", None),
    "greens_crate": ("crate of leafy greens", "greens_crate.jpg", None, None),
    "milk_can": ("milk can", "milk_can.jpg", "File:Bidons à lait.JPG", None),
    "vaccine_box": ("vaccine cool box", "vaccine_box.jpg", None, None),
}
# crop (left, top, right, bottom as fractions) - used only to leave a brand name out of the picture
CROP = {"condensing_unit": (0.0, 0.0, 0.80, 1.0)}
# which picture each card shows
USE = {
    "how": ["condensing_unit", "solenoid_valve", "txv", "y_split"],
    "parts": {"condenser": "condensing_unit", "evaporator": "evaporator", "pcm": "wax_panel", "fins": "wax_panel",
              "driptray": "wax_panel", "door": "strip_curtain", "solar": "pv", "split": "y_split", "crates": "grapes_crate",
              "crate_greens": "greens_crate", "crate_grapes": "grapes_crate", "milk": "milk_can", "vaccine": "vaccine_box"},
    "crops": {"grapes": "grapes_crate", "milk": "milk_can", "leafy_greens": "greens_crate", "vaccines": "vaccine_box"},
    "sensors": {"t_mid": "trh_sensor", "t_low": "temp_probe", "t_high": "temp_probe", "t_evap": "temp_probe", "t_prod": "temp_probe",
                "t_pcm": "temp_probe", "door_switch": "door_switch", "gas": "gas_sensor", "t_out": "weather_mast", "wind": "weather_mast",
                "rh_out": "weather_mast", "pv_power": "pv"},
}


def api(**p):
    p["format"] = "json"
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(p)
    for k in range(6):
        try:
            time.sleep(2)
            return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30))
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(10 * (k + 1))
    raise RuntimeError("Wikimedia rate limit - try again later")


def clean(s):
    return re.sub(r"\s+", " ", re.sub("<[^>]+>", "", s or "")).strip()


def fetch(key, title):
    r = api(action="query", titles=title, prop="imageinfo", iiprop="url|extmetadata|size|mime", iiurlwidth=960)
    pg = next(iter(r["query"]["pages"].values()))
    ii = pg["imageinfo"][0]
    m = ii.get("extmetadata", {})
    g = lambda k: clean(m.get(k, {}).get("value", ""))           # noqa: E731
    lic = g("LicenseShortName")
    if not any(f in lic.lower() for f in FREE):
        raise SystemExit(f"{title}: licence '{lic}' is not free enough - not used")
    url = ii["thumburl"].split("?")[0].replace("thumb.wikimedia.org", "upload.wikimedia.org")
    DL_DIR.mkdir(parents=True, exist_ok=True)
    raw = DL_DIR / f"{key}.download"
    for k in range(5):
        try:
            time.sleep(4)
            raw.write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read())
            break
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(20 * (k + 1))
    if not raw.exists():
        raise RuntimeError("Wikimedia rate limit on the download - try again later")
    from PIL import Image
    im = Image.open(raw).convert("RGB")
    cr = CROP.get(key)
    if cr:
        im = im.crop((round(cr[0] * im.width), round(cr[1] * im.height), round(cr[2] * im.width), round(cr[3] * im.height)))
    im.thumbnail((960, 960))
    dst = DL_DIR / f"{key}.jpg"
    im.save(dst, "JPEG", quality=80, optimize=True, progressive=True)
    raw.unlink()
    return {"file": f"assets/photos/{key}.jpg", "source": ii["descriptionurl"], "title": title[5:],
            "author": g("Artist") or "unknown", "licence": lic, "licence_url": g("LicenseUrl"), "w": im.width, "h": im.height,
            "edited": "cropped" if cr else ""}


def main(do_fetch=False):
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    commons = dict(old.get("commons", {}))
    for key, (what, own, title, drawing) in COMPONENTS.items():
        if not title:
            commons.pop(key, None)
            continue
        if do_fetch and (key not in commons or commons[key].get("title") != title[5:] or
                         bool(commons[key].get("edited")) != bool(CROP.get(key)) or not (ASSETS.parent / commons[key]["file"]).exists()):
            print("download", key, title)
            try:
                commons[key] = fetch(key, title)
            except RuntimeError as e:                     # rate limit: keep what we have, run again later
                print("  stopped:", e)
                do_fetch = False
                continue
            old["commons"] = commons                       # save progress after every photo
            OUT.write_text(json.dumps(old, indent=1, ensure_ascii=False), encoding="utf-8")
    photos, missing = {}, []
    for key, (what, own, title, drawing) in COMPONENTS.items():
        stem = Path(own).stem
        mine = next((p for ext in (".jpg", ".jpeg", ".png", ".webp") for p in [OWN_DIR / f"{stem}{ext}"] if p.exists()), None)
        if mine:
            photos[key] = {"kind": "own", "what": what, "file": f"assets/images/real/{mine.name}",
                           "caption": f"Our {what}", "credit": "Photo: KoolKisaan team"}
        elif key in commons:
            c = commons[key]
            photos[key] = {"kind": "commons", "what": what, "file": c["file"], "caption": f"Example of a {what}",
                           "credit": f"Photo: {c['author']}, {c['licence']}" + (" (cropped)" if c.get("edited") else ""), "source": c["source"], "licence_url": c.get("licence_url", ""),
                           "author": c["author"], "licence": c["licence"], "edited": c.get("edited", "")}
        elif drawing:
            photos[key] = {"kind": "drawing", "what": what, "drawing": drawing, "caption": f"Design drawing – {what}"}
        if not mine:
            missing.append({"key": key, "what": what, "expected_file": f"web/assets/images/real/{own}",
                            "has_free_photo": key in commons, "has_drawing": bool(drawing)})
    out = {"_about": "Made by tools/photos.py - edit that file, not this one. kind: own = your photo, commons = freely licensed "
                     "example photo, drawing = design drawing made in code.",
           "photos": photos, "use": USE, "commons": commons, "missing": missing}
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    credits(photos, missing)
    print(f"{OUT.relative_to(ROOT)}: {sum(p['kind'] == 'own' for p in photos.values())} own, "
          f"{sum(p['kind'] == 'commons' for p in photos.values())} free-licence, {sum(p['kind'] == 'drawing' for p in photos.values())} drawing; "
          f"{sum(1 for m in missing if not m['has_free_photo'] and not m['has_drawing'])} with no picture yet")
    return out


def credits(photos, missing):
    lines = ["<!-- photos:start (made by tools/photos.py) -->", "## Real photos (How it works + component cards)", "",
             "These are **real photographs**. Photos from Wikimedia Commons show a *typical* product of that kind, not our unit, "
             "and are captioned \"Example of a …\". No manufacturer or shop photos, brand logos or watermarked images.", "",
             "| Component | File | Author | Licence | Source |", "|---|---|---|---|---|"]
    for key, p in photos.items():
        if p["kind"] == "commons":
            lines.append(f"| {p['what']} | `web/{p['file']}` | {p['author']} | [{p['licence']}]({p.get('licence_url') or p['source']})"
                         f"{' – cropped' if p.get('edited') else ''} | [Wikimedia Commons]({p['source']}) |")
        elif p["kind"] == "own":
            lines.append(f"| {p['what']} | `web/{p['file']}` | KoolKisaan team | own photo | – |")
    lines += ["", "Design drawings (made in code, `web/js/drawings.js`): " +
              (", ".join(p["what"] for p in photos.values() if p["kind"] == "drawing") or "none") + ".", "",
              "Photos still wanted (put your own photo at this path, then run `python tools/photos.py`):", ""]
    lines += [f"- `{m['expected_file']}` – {m['what']}" + (" (a free example photo is shown until then)" if m["has_free_photo"] else
              " (design drawing shown until then)" if m["has_drawing"] else "") for m in missing]
    lines.append("<!-- photos:end -->")
    block = "\n".join(lines)
    txt = CREDITS.read_text(encoding="utf-8")
    if "<!-- photos:start" in txt:
        txt = re.sub(r"<!-- photos:start.*?<!-- photos:end -->", lambda _: block, txt, flags=re.S)
    else:
        txt = txt.replace("## Software", block + "\n\n## Software", 1)
    CREDITS.write_text(txt, encoding="utf-8")


if __name__ == "__main__":
    main(do_fetch="--fetch" in sys.argv)
