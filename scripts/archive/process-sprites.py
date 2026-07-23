import os, sys
from PIL import Image
from rembg import remove

TARGET_SIZE = (512, 768)

# Files to skip (reference/backup, not game assets)
SKIP = {"body-neutral-SACRED.png", "body-neutral-V2-SACRED.png", "body-demon-v1.png", "body-demon-backup.png", "body-bikini-back-orange.png"}

def process_dir(sprite_dir):
    pngs = [f for f in os.listdir(sprite_dir) if f.endswith('.png') and f not in SKIP]
    print(f"\n--- {os.path.basename(sprite_dir)}: {len(pngs)} files ---")
    
    for fname in sorted(pngs):
        path = os.path.join(sprite_dir, fname)
        img = Image.open(path)
        
        # Check if already has transparency (already processed)
        has_alpha = img.mode == 'RGBA' and img.size == TARGET_SIZE
        if has_alpha:
            print(f"  SKIP (already done): {fname}")
            continue
        
        print(f"  Processing: {fname} ({img.size} {img.mode})", end="", flush=True)
        
        # Convert to RGBA for rembg
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Remove background
        img_nobg = remove(img)
        
        # Resize to target
        img_resized = img_nobg.resize(TARGET_SIZE, Image.LANCZOS)
        
        # Save
        img_resized.save(path, 'PNG')
        print(f" -> {TARGET_SIZE} RGBA OK")
    
    # Remove skip files from production
    for skip_file in SKIP:
        skip_path = os.path.join(sprite_dir, skip_file)
        if os.path.exists(skip_path):
            os.remove(skip_path)
            print(f"  REMOVED: {skip_file}")

base = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "sprites")
process_dir(os.path.join(base, "marin"))
process_dir(os.path.join(base, "nao"))
print("\nDone!")
