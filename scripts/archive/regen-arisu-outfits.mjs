/**
 * Regenerate 3 broken Arisu outfits: bikini-front, bikini-back, demon
 * Uses img2img from body-neutral to keep consistency.
 * Run: node scripts/regen-arisu-outfits.mjs
 */
import { writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES_DIR = join(__dirname, "..", "public", "sprites", "arisu");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const BASE_NEGATIVE = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, missing limb, extra limbs, poorly drawn hands, mutation, bad proportions, background objects, magic circle, halo, aura, glowing background, smoke, fog, mist";

// Match Arisu's actual appearance from body-neutral
const ARISU_BASE = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, long wavy blonde hair, pink highlights, pink tips, hair past waist, violet purple eyes, dark brown skin, tanned skin, beautiful, looking at viewer, both arms visible, soft shading, clean lineart";

const OUTFITS = [
  {
    id: "body-bikini-front",
    prompt: `${ARISU_BASE}, pink bikini top, pink bikini bottom, string bikini, swimsuit, beach, cute pose, hands at sides, both arms visible`,
    seed: 550001,
    denoise: 0.55,
  },
  {
    id: "body-bikini-back",
    prompt: `${ARISU_BASE}, from behind, looking back over shoulder, pink bikini, string bikini back view, back turned, showing back, both arms visible`,
    seed: 550002,
    denoise: 0.6,
  },
  {
    id: "body-demon",
    prompt: `${ARISU_BASE}, demon girl costume, small black horns on head, dark purple bodysuit, fishnet details, choker, dark wings, succubus, both arms visible, arms at sides, cute demon`,
    seed: 550003,
    denoise: 0.55,
  },
];

function img2imgWorkflow(positive, negative, inputImage, width, height, seed, denoise) {
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "8": { class_type: "LoadImage", inputs: { image: inputImage } },
      "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `arisu-fix-${Date.now()}` } },
    },
  };
}

async function queuePrompt(workflow) {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workflow),
  });
  if (!res.ok) throw new Error(`Queue failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function waitForCompletion(promptId, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    const data = await res.json();
    if (data[promptId]?.outputs) return data[promptId].outputs;
    if (data[promptId]?.status?.status_str === "error") throw new Error("Generation failed");
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Timeout waiting for ${promptId}`);
}

async function downloadImage(filename, outputPath) {
  const res = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  writeFileSync(outputPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  console.log("=== Regenerating 3 Arisu outfits (bikini-front, bikini-back, demon) ===\n");

  // Copy body-neutral as the img2img base
  const inputFilename = "arisu-outfit-base.png";
  copyFileSync(join(SPRITES_DIR, "body-neutral.png"), join(COMFY_INPUT, inputFilename));
  console.log("Copied body-neutral.png to ComfyUI input\n");

  for (const outfit of OUTFITS) {
    console.log(`  Generating: ${outfit.id}...`);
    const workflow = img2imgWorkflow(outfit.prompt, BASE_NEGATIVE, inputFilename, 512, 768, outfit.seed, outfit.denoise);
    const { prompt_id } = await queuePrompt(workflow);
    console.log(`    Queued: ${prompt_id}`);
    const outputs = await waitForCompletion(prompt_id);
    const saveNode = Object.values(outputs).find((o) => o.images);
    if (!saveNode?.images?.[0]) throw new Error("No output image");
    const outputPath = join(SPRITES_DIR, `${outfit.id}.png`);
    await downloadImage(saveNode.images[0].filename, outputPath);
    console.log(`    Saved: ${outputPath}`);
  }

  // Remove backgrounds
  console.log("\n--- Removing backgrounds ---");
  const { execSync } = await import("child_process");
  execSync(`"C:/Users/G$/AppData/Local/Programs/Python/Python313/python.exe" -c "
from rembg import remove
from PIL import Image
for name in ['body-bikini-front.png', 'body-bikini-back.png', 'body-demon.png']:
    path = '${SPRITES_DIR.replace(/\\/g, "/")}/' + name
    img = Image.open(path)
    out = remove(img)
    out.save(path)
    print(f'  bg removed: {name}')
"`, { stdio: "inherit" });

  console.log("\n=== Done! 3 outfits regenerated + bg removed. ===");
}

main().catch(console.error);
