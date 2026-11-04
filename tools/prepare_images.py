"""Prepare the Gemini pictures for the website (run once, offline).

    python tools/prepare_images.py

Reads   web/assets/images/   (originals; names start with A, B or C)
Writes  web/assets/img/      A-scenes as WebP, max 1920 px wide (+ a 960 px copy for "Low graphics")
        web/assets/cutouts/  B-objects with the white background REMOVED (transparent WebP)
        web/assets/tex/      C-textures as 1024 x 1024 WebP (power of two, good for the GPU)
        web/assets/manifest.json   list of what exists (the website uses it to skip missing pictures)
        web/assets/CREDITS.md

Background removal uses 'rembg' (pip install rembg onnxruntime). The first run downloads its
model (~170 MB) once; after that it works offline. If rembg is missing, a simple fallback
makes near-white pixels transparent (good enough for clean white backgrounds).
"""
import json
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "web" / "assets" / "images"
OUT_A = ROOT / "web" / "assets" / "img"
OUT_B = ROOT / "web" / "assets" / "cutouts"
OUT_C = ROOT / "web" / "assets" / "tex"
EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def fit_width(im, w):
    if im.width <= w:
        return im
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


_SESSION = None


def _clear_dark_ringed_holes(rgba, tol=22, dark=90):
    """Make white 'holes' transparent when a DARK object surrounds them (e.g. the middle of a
    coiled black cable). White areas on white objects are bordered by light grey, so they stay."""
    import numpy as np
    from scipy import ndimage
    a = np.asarray(rgba).copy()
    rgb = a[..., :3].astype(int)
    white = ((255 - rgb).max(axis=2) <= tol) & (a[..., 3] > 0)
    lab, n = ndimage.label(white)
    lum = rgb.mean(axis=2)
    for k in range(1, n + 1):
        comp = lab == k
        if comp.sum() < 400:
            continue
        ring = ndimage.binary_dilation(comp, iterations=3) & ~comp
        if lum[ring].mean() < dark:
            a[comp, 3] = 0
    return Image.fromarray(a)


def remove_white_bg(im):
    """Background removal: rembg (AI cut-out, keeps white objects and thin cables), then hole
    clean-up. Fallback without rembg: flood-fill the white from the picture edges."""
    global _SESSION
    try:
        from rembg import new_session, remove
        if _SESSION is None:
            _SESSION = new_session("u2net")
        cut = remove(im, session=_SESSION)
        try:
            cut = _clear_dark_ringed_holes(cut)
        except ImportError:
            pass
        return cut, "rembg u2net"
    except ImportError:
        import numpy as np
        from scipy import ndimage
        a = np.asarray(im.convert("RGB")).astype(int)
        lab, _ = ndimage.label((255 - a).max(axis=2) <= 18)
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        alpha = np.where(np.isin(lab, list(edge)), 0, 255).astype(np.uint8)
        out = im.convert("RGBA")
        out.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.8)))
        return out, "edge flood-fill fallback"


def main():
    for d in (OUT_A, OUT_B, OUT_C):
        d.mkdir(parents=True, exist_ok=True)
    man = {"A": {}, "B": {}, "C": {}}
    for f in sorted(SRC.iterdir()):
        if f.suffix.lower() not in EXTS:
            continue
        kind = f.name[0].upper()
        im = Image.open(f)
        if kind == "A":
            big = fit_width(im.convert("RGB"), 1920)
            big.save(OUT_A / f"{f.stem}.webp", "WEBP", quality=80, method=6)
            fit_width(big, 960).save(OUT_A / f"{f.stem}_960.webp", "WEBP", quality=78, method=6)
            man["A"][f.stem] = {"src": f"assets/img/{f.stem}.webp", "small": f"assets/img/{f.stem}_960.webp",
                                "w": big.width, "h": big.height}
        elif kind == "B":
            cut, how = remove_white_bg(fit_width(im.convert("RGB"), 1024))
            bbox = cut.getchannel("A").getbbox()
            if bbox:
                cut = cut.crop(bbox)
            cut.thumbnail((900, 900))
            cut.save(OUT_B / f"{f.stem}.webp", "WEBP", quality=85, method=6)
            man["B"][f.stem] = {"src": f"assets/cutouts/{f.stem}.webp", "w": cut.width, "h": cut.height,
                                "method": how}
        elif kind == "C":
            s = min(im.size)
            sq = im.convert("RGB").crop(((im.width - s) // 2, (im.height - s) // 2,
                                         (im.width + s) // 2, (im.height + s) // 2))
            sq.resize((1024, 1024), Image.LANCZOS).save(OUT_C / f"{f.stem}.webp", "WEBP", quality=80, method=6)
            man["C"][f.stem] = {"src": f"assets/tex/{f.stem}.webp"}
        else:
            continue
        print(f"  {kind}  {f.name}")
    # remove converted files whose original was renamed or deleted
    keep = {Path(v["src"]).stem for k in man for v in man[k].values()} | {Path(v["small"]).stem for v in man["A"].values()}
    for d in (OUT_A, OUT_B, OUT_C):
        for f in d.glob("*.webp"):
            if f.stem not in keep:
                f.unlink()
                print(f"  removed old {f.name}")
    (ROOT / "web" / "assets" / "manifest.json").write_text(json.dumps(man, indent=2))
    lines = ["# Image credits", "",
             "All pictures in `web/assets/images/` (and the converted copies in `img/`, `cutouts/`, `tex/`)",
             "were **Generated with Google Gemini for this project** (REFCOLD India 2026 poster, GVPCE).",
             "They are illustrations, not photographs of the real system.", "",
             "| File | Kind | Used for |", "|---|---|---|"]
    use = {"A": "photographic scene", "B": "cut-out object (background removed)", "C": "3D texture"}
    for k in "ABC":
        for name in man[k]:
            lines.append(f"| {name} | {k} | {use[k]} |")
    lines += ["", "## Software", "",
              "- three.js r160 (MIT licence) – `web/vendor/three/` – https://threejs.org",
              "- Chart.js 4.4.4 (MIT licence) – `web/vendor/chartjs/` – https://www.chartjs.org",
              "- qrcode-generator 1.4.4 (MIT licence) – `web/vendor/qrcode/`",
              "- Weather data by Open-Meteo.com (CC BY 4.0); NASA POWER; ISHRAE 2014 design year (not redistributed).",
              "- All 3D objects are built in code from simple shapes; no third-party 3D models are used.",
              "- No brand logos are used. The small Gemini sparkle mark in the corner of each picture is",
              "  Google's visible AI-image watermark and is left in place on purpose."]
    (ROOT / "web" / "assets" / "CREDITS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("manifest + CREDITS written")


if __name__ == "__main__":
    main()
