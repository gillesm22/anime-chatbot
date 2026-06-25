"""
Remove backgrounds from anime character sprite PNGs using rembg.
Falls back to PIL-based color replacement if rembg fails.
"""

import os
import glob
import sys
from PIL import Image, ImageFilter

SPRITE_BASE = r"C:\Users\G$\anime-chatbot\public\sprites"
CHARACTERS = ["arisu", "marin", "nao"]


def get_png_files():
    """Collect all PNG files from sprite directories."""
    files = []
    for char in CHARACTERS:
        char_dir = os.path.join(SPRITE_BASE, char)
        for f in sorted(glob.glob(os.path.join(char_dir, "*.png"))):
            # Skip desktop.ini and non-image files
            if os.path.basename(f).lower() == "desktop.ini":
                continue
            files.append(f)
    return files


def try_rembg(files):
    """Try using rembg for background removal."""
    try:
        from rembg import remove
        # Quick test
        test_img = Image.new("RGBA", (10, 10), (128, 128, 128, 255))
        remove(test_img)
        print("Using rembg for background removal.\n")
    except Exception as e:
        print(f"rembg not usable: {e}")
        return False

    for filepath in files:
        basename = os.path.basename(filepath)
        charname = os.path.basename(os.path.dirname(filepath))
        label = f"{charname}/{basename}"
        try:
            img = Image.open(filepath).convert("RGBA")
            result = remove(img)
            result.save(filepath, "PNG")
            print(f"  [OK] {label}")
        except Exception as e:
            print(f"  [FAIL] {label}: {e}")

    return True


def fallback_pil(files, tolerance=30):
    """PIL-based background removal by detecting dominant corner color."""
    print("Using PIL fallback for background removal.\n")

    for filepath in files:
        basename = os.path.basename(filepath)
        charname = os.path.basename(os.path.dirname(filepath))
        label = f"{charname}/{basename}"
        try:
            img = Image.open(filepath).convert("RGBA")
            w, h = img.size
            px = img.load()

            # Sample corners (10x10 patches) to find dominant bg color
            samples = []
            for cx, cy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
                for dx in range(-min(9, cx), min(10, w - cx)):
                    for dy in range(-min(9, cy), min(10, h - cy)):
                        r, g, b, a = px[cx + dx, cy + dy]
                        if a > 0:
                            samples.append((r, g, b))

            if not samples:
                print(f"  [SKIP] {label}: fully transparent already")
                continue

            # Average corner color = background color
            avg_r = sum(s[0] for s in samples) // len(samples)
            avg_g = sum(s[1] for s in samples) // len(samples)
            avg_b = sum(s[2] for s in samples) // len(samples)

            # Replace pixels close to bg color with transparent
            for y in range(h):
                for x in range(w):
                    r, g, b, a = px[x, y]
                    dist = ((r - avg_r) ** 2 + (g - avg_g) ** 2 + (b - avg_b) ** 2) ** 0.5
                    if dist < tolerance:
                        px[x, y] = (r, g, b, 0)
                    elif dist < tolerance * 1.5:
                        # Feather: partial transparency for edge pixels
                        fade = int(255 * (dist - tolerance) / (tolerance * 0.5))
                        px[x, y] = (r, g, b, min(a, fade))

            img.save(filepath, "PNG")
            print(f"  [OK] {label}")
        except Exception as e:
            print(f"  [FAIL] {label}: {e}")


def main():
    files = get_png_files()
    print(f"Found {len(files)} PNG sprite files to process:\n")
    for f in files:
        charname = os.path.basename(os.path.dirname(f))
        print(f"  {charname}/{os.path.basename(f)}")
    print()

    if not try_rembg(files):
        fallback_pil(files)

    print("\nDone!")


if __name__ == "__main__":
    main()
