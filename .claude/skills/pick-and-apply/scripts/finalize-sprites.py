"""
finalize-sprites.py — make generated sprite candidates game-ready.

Does, in order, for every PNG in a staging directory:
  1. Background removal (rembg) — skipped for images that already have
     real transparency (re-running rembg degrades edges).
  2. Face compositing — every face-*.png is alpha-composited onto the
     body-neutral base so the full sprite is always present and only the
     expression region differs. This is what prevents the size/position
     shift on expression swap (shipped as a bug twice: 08eb53d, 5e688e7).
  3. Canvas verification — every PNG must end up exactly the size of
     body-neutral.png. Hard fail if not.

Usage:
  python finalize-sprites.py <staging-dir> [--char <id>] [--check-only] [--promote]

  <staging-dir>   directory of PNGs to process (e.g. regen-3/merrick)
  --char <id>     character id; needed to locate the live body-neutral
                  when the staging dir has none, and for --promote
  --check-only    verify only (transparency + canvas sizes), change nothing
  --promote       after processing, copy results into public/sprites/<char>/
                  (requires --char; refuses if verification failed)

The body-neutral reference is resolved as: staging-dir/body-neutral.png if
present, else public/sprites/<char>/body-neutral.png. Faces are resized
(LANCZOS) to the reference canvas before compositing if they differ.
"""

import argparse
import os
import shutil
import sys

from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
SKIP = {"desktop.ini"}


def has_real_transparency(img: Image.Image) -> bool:
    if img.mode != "RGBA":
        return False
    alpha = img.getchannel("A")
    lo, hi = alpha.getextrema()
    return lo < 250


def remove_bg(img: Image.Image) -> Image.Image:
    from rembg import remove
    return remove(img.convert("RGBA"))


def fit_to_canvas(img: Image.Image, canvas: tuple) -> Image.Image:
    """Aspect-preserving resize onto the canvas, bottom-centered.

    Never stretches: scales to fit inside the canvas, then pads with
    transparency (sprites are bottom-anchored in the app, so content
    sits on the bottom edge). Distorting art with a non-uniform resize
    is worse than padding — a squashed character reads instantly.
    """
    if img.size == canvas:
        return img
    src_ar = img.width / img.height
    dst_ar = canvas[0] / canvas[1]
    if abs(src_ar - dst_ar) > 0.01:
        print(f"         note: aspect ratio differs ({src_ar:.2f} vs {dst_ar:.2f}) — fitting with transparent padding, review the result")
    scale = min(canvas[0] / img.width, canvas[1] / img.height)
    new_size = (max(1, round(img.width * scale)), max(1, round(img.height * scale)))
    scaled = img.resize(new_size, Image.LANCZOS)
    out = Image.new("RGBA", canvas, (0, 0, 0, 0))
    out.paste(scaled, ((canvas[0] - new_size[0]) // 2, canvas[1] - new_size[1]))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("staging_dir")
    ap.add_argument("--char", dest="char_id")
    ap.add_argument("--check-only", action="store_true")
    ap.add_argument("--promote", action="store_true")
    args = ap.parse_args()

    staging = os.path.abspath(args.staging_dir)
    if not os.path.isdir(staging):
        print(f"Not a directory: {staging}")
        return 1
    if args.promote and not args.char_id:
        print("--promote requires --char <id>")
        return 1

    pngs = sorted(
        f for f in os.listdir(staging)
        if f.lower().endswith(".png") and f not in SKIP
    )
    if not pngs:
        print(f"No PNGs in {staging}")
        return 1

    # Resolve the body-neutral canvas reference
    body_path = os.path.join(staging, "body-neutral.png")
    if not os.path.exists(body_path) and args.char_id:
        body_path = os.path.join(REPO, "public", "sprites", args.char_id, "body-neutral.png")
    if not os.path.exists(body_path):
        print("No body-neutral.png found in staging dir or live sprite dir — cannot establish the canvas reference. Pass --char or add body-neutral.png to staging.")
        return 1
    body = Image.open(body_path).convert("RGBA")
    canvas = body.size
    print(f"Canvas reference: {body_path} {canvas}")

    failures = []

    if not args.check_only:
        # Pass 1: background removal
        for f in pngs:
            path = os.path.join(staging, f)
            img = Image.open(path)
            if has_real_transparency(img):
                print(f"  [bg]   skip (transparent): {f}")
                continue
            try:
                remove_bg(img).save(path, "PNG")
                print(f"  [bg]   removed: {f}")
            except Exception as e:
                failures.append(f"{f}: rembg failed: {e}")
                print(f"  [bg]   FAIL: {f}: {e}")

        # Re-load body after possible bg removal
        body = Image.open(body_path).convert("RGBA")

        # Pass 2: composite faces onto body-neutral
        for f in pngs:
            if not f.startswith("face-"):
                continue
            path = os.path.join(staging, f)
            face = fit_to_canvas(Image.open(path).convert("RGBA"), canvas)
            merged = body.copy()
            merged.alpha_composite(face)
            merged.save(path, "PNG")
            print(f"  [face] composited onto body-neutral: {f}")

        # Pass 3: normalize body variant sizes
        for f in pngs:
            if f.startswith("face-") or f == "body-neutral.png":
                continue
            path = os.path.join(staging, f)
            img = Image.open(path).convert("RGBA")
            if img.size != canvas:
                fit_to_canvas(img, canvas).save(path, "PNG")
                print(f"  [size] fit {img.size} -> {canvas}: {f}")

    # Verification (always runs)
    print("\nVerification:")
    for f in pngs:
        img = Image.open(os.path.join(staging, f))
        size_ok = img.size == canvas
        alpha_ok = has_real_transparency(img.convert("RGBA"))
        status = []
        if not size_ok:
            status.append(f"size {img.size} != {canvas}")
        if not alpha_ok:
            status.append("no transparency")
        if status:
            failures.append(f"{f}: {'; '.join(status)}")
            print(f"  FAIL {f}: {'; '.join(status)}")
        else:
            print(f"  ok   {f}")

    if failures:
        print(f"\n{len(failures)} problem(s). NOT ready to go live.")
        return 1

    print("\nAll sprites pass: transparent, canvas-matched.")

    if args.promote:
        dest = os.path.join(REPO, "public", "sprites", args.char_id)
        os.makedirs(dest, exist_ok=True)
        for f in pngs:
            shutil.copyfile(os.path.join(staging, f), os.path.join(dest, f))
        print(f"Promoted {len(pngs)} file(s) to {dest}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
