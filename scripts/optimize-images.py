#!/usr/bin/env python3
"""Resize screenshots and re-encode them as WebP.

Sources live in src/assets/originals/ (kept in git as the source of truth).
Outputs land next to them in src/assets/ so the existing imports keep working
once the .tsx files switch their extension to .webp.

Requires: Pillow (pip) + cwebp (brew install webp). Re-run after replacing
any of the originals.
"""
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ORIGINALS = ROOT / "src" / "assets" / "originals"
OUT = ROOT / "src" / "assets"
CWEBP = shutil.which("cwebp") or "/opt/homebrew/bin/cwebp"
QUALITY = "82"

# target width in px = 2x the widest CSS display frame that uses this
# screenshot, capped at 720px (see docs/releases or the CLAUDE.md brief for
# where each width comes from).
SCREENSHOTS = {
    "screen-lockscreen.png": 480,   # Home.tsx step1, frame w-[240px]
    "screen-recording.png": 480,    # Home.tsx step2, frame w-[240px]
    "screen-detail.png": 480,       # Home.tsx step3, frame w-[240px]
    "screen-feed.png": 480,         # GoogleTimeline/FogOfWarMap, frame w-[240px]
    "screen-profile.png": 640,      # Features/Download, widest frame md:w-[320px]
}


def main() -> None:
    if not Path(CWEBP).exists():
        sys.exit(f"cwebp not found (looked at {CWEBP}); brew install webp")

    for name, target_width in SCREENSHOTS.items():
        src = ORIGINALS / name
        if not src.exists():
            print(f"skip {name}: not found in {ORIGINALS}")
            continue

        with Image.open(src) as im:
            im = im.convert("RGB")
            w, h = im.size
            target_height = round(target_width * h / w)
            resized = im.resize((target_width, target_height), Image.LANCZOS)

            tmp_png = OUT / f".tmp-{name}"
            resized.save(tmp_png, format="PNG")

        out_webp = OUT / (Path(name).stem + ".webp")
        subprocess.run(
            [CWEBP, "-q", QUALITY, str(tmp_png), "-o", str(out_webp)],
            check=True,
            capture_output=True,
        )
        tmp_png.unlink()

        before = src.stat().st_size
        after = out_webp.stat().st_size
        print(
            f"{name}: {before/1024:.0f} KB -> {out_webp.name} "
            f"{target_width}x{target_height} {after/1024:.0f} KB"
        )


if __name__ == "__main__":
    main()
