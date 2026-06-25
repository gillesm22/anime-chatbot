/**
 * Regenerate Arisu body-back + re-run rembg on all 4 fixed outfits.
 * Run: node scripts/regen-arisu-back.mjs
 */
import { writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "arisu");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, missing limb, poorly drawn hands, mutation, bad proportions, background objects, orange hair, ginger hair, red hair";
const POS = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, from behind, looking back over shoulder, long wavy blonde hair, pink highlights, pink tips, hair past waist, violet purple eyes, dark brown skin, tanned skin, black sweater, white shorts, both arms visible, soft shading, clean lineart";

async function main() {
  console.log("=== Regenerating Arisu body-back ===\n");

  // Ensure base is in ComfyUI input
  copyFileSync(join(SPRITES, "body-neutral.png"), join(COMFY_INPUT, "arisu-outfit-base.png"));

  const workflow = {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: POS, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: NEG, clip: ["1", 1] } },
      "8": { class_type: "LoadImage", inputs: { image: "arisu-outfit-base.png" } },
      "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
      "5": { class_type: "KSampler", inputs: {
        seed: 550010, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 0.58,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "arisu-back-fix" } },
    },
  };

  console.log("  Generating body-back...");
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workflow),
  });
  const { prompt_id } = await res.json();

  // Wait for completion
  while (true) {
    const h = await fetch(`${COMFY_URL}/history/${prompt_id}`);
    const d = await h.json();
    if (d[prompt_id]?.outputs) {
      const img = Object.values(d[prompt_id].outputs).find((o) => o.images);
      const fname = img.images[0].filename;
      const dl = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(fname)}&type=output`);
      writeFileSync(join(SPRITES, "body-back.png"), Buffer.from(await dl.arrayBuffer()));
      console.log("    Saved body-back.png");
      break;
    }
    if (d[prompt_id]?.status?.status_str === "error") throw new Error("Generation failed");
    await new Promise((r) => setTimeout(r, 3000));
  }

  // Remove backgrounds on all 4 fixed files
  console.log("\n--- Removing backgrounds (4 files) ---");
  const pyPath = "C:/Users/G$/AppData/Local/Programs/Python/Python313/python.exe";
  const spritesPath = SPRITES.replace(/\\/g, "/");
  execSync(`"${pyPath}" -c "
from rembg import remove
from PIL import Image
for name in ['body-back.png', 'body-bikini-front.png', 'body-bikini-back.png', 'body-demon.png']:
    path = '${spritesPath}/' + name
    img = Image.open(path)
    out = remove(img)
    out.save(path)
    print(f'  bg removed: {name}')
"`, { stdio: "inherit" });

  console.log("\n=== Done! 4 Arisu outfits with clean backgrounds. ===");
}

main().catch(console.error);
