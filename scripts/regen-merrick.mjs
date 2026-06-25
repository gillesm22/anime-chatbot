/**
 * Regenerate Merrick sprites only with accurate dark skin.
 * Run: node scripts/regen-merrick.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES_DIR = join(__dirname, "..", "public", "sprites");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const BASE_NEGATIVE = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, duplicate, morbid, mutilated, extra limbs, poorly drawn face, mutation, bad proportions, reference sheet, multiple views, character sheet, turnaround, expression sheet, collage, grid, thumbnails, panels, borders, frames, props, furniture, background objects, magic circle, halo, aura, glowing background, ornate frame, full body, feet, shoes, boots, legs below thigh, pale skin, fair skin, light skin, white skin";

const MERRICK_BASE = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, dark skin, dark-skinned female, very dark brown skin, chocolate skin, african american, creole woman, new orleans voodoo priestess, striking emerald green eyes, glowing green eyes, long flowing black hair, dark purple undertones in hair, hair past waist, white off-shoulder blouse, layered gold necklaces, jade pendant, gold hoop earrings, voodoo charms, occult jewelry, head wrap accent, tall statuesque graceful, large breasts, confident mysterious smile, looking at viewer, supernatural beauty, warm lighting, soft shading, clean lineart";
const MERRICK_SEED = 171717;

const EXPRESSIONS = {
  "face-happy":      "happy warm smile, bright eyes, genuine joy",
  "face-thinking":   "thoughtful expression, eyes looking slightly up, contemplative",
  "face-surprised":  "surprised expression, wide eyes, slightly open mouth",
  "face-sad":        "sad expression, downcast eyes, slight frown, melancholic",
  "face-smirk":      "confident smirk, one corner of mouth raised, knowing look",
  "face-laugh":      "laughing expression, eyes closed with joy, open mouth smile",
  "face-angry":      "angry expression, furrowed brows, intense glare, tight jaw",
  "face-flustered":  "flustered embarrassed expression, deep blush on cheeks, averted gaze",
  "face-devoted":    "deeply loving tender expression, warm soft gaze, gentle blush, adoring smile",
  "face-teasing":    "playful teasing expression, sly grin, one eyebrow raised, mischievous",
  "face-sleepy":     "drowsy sleepy expression, half-closed eyes, peaceful",
  "face-excited":    "excited enthusiastic expression, wide sparkling eyes, big bright grin",
  "face-shy":        "shy bashful expression, looking away, deep blush, hand near face",
  "face-jealous":    "jealous expression, narrowed eyes, side glance, slight pout",
  "face-crying":     "crying expression, tears streaming, scrunched eyebrows, emotional",
};

function txt2imgWorkflow(positive, negative, width, height, seed) {
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "4": { class_type: "EmptyLatentImage", inputs: { width, height, batch_size: 1 } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `merrick-${Date.now()}` } },
    },
  };
}

function img2imgWorkflow(positive, negative, inputImage, width, height, seed, denoise = 0.45) {
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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `merrick-${Date.now()}` } },
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

async function generate(workflow, outputPath, label) {
  console.log(`  Generating: ${label}...`);
  const { prompt_id } = await queuePrompt(workflow);
  const outputs = await waitForCompletion(prompt_id);
  const saveNode = Object.values(outputs).find((o) => o.images);
  if (!saveNode?.images?.[0]) throw new Error("No output image");
  await downloadImage(saveNode.images[0].filename, outputPath);
  console.log(`    Saved: ${outputPath}`);
}

async function main() {
  console.log("=== Regenerating Merrick (book-accurate dark skin) ===\n");

  const dir = join(SPRITES_DIR, "merrick");
  mkdirSync(dir, { recursive: true });

  // Step 1: body-neutral
  console.log("--- body-neutral (txt2img) ---");
  const neutralPath = join(dir, "body-neutral.png");
  await generate(txt2imgWorkflow(MERRICK_BASE, BASE_NEGATIVE, 512, 768, MERRICK_SEED), neutralPath, "body-neutral");

  // Step 2: Copy to ComfyUI input
  const inputFilename = "merrick-base.png";
  copyFileSync(neutralPath, join(COMFY_INPUT, inputFilename));

  // Step 3: Expressions via img2img
  console.log("\n--- expressions (img2img, denoise 0.45) ---");
  for (const [filename, exprPrompt] of Object.entries(EXPRESSIONS)) {
    await generate(
      img2imgWorkflow(`${MERRICK_BASE}, ${exprPrompt}`, BASE_NEGATIVE, inputFilename, 512, 768, MERRICK_SEED + Object.keys(EXPRESSIONS).indexOf(filename) + 1, 0.45),
      join(dir, `${filename}.png`),
      filename
    );
  }

  // Step 4: Remove backgrounds
  console.log("\n--- Removing backgrounds with rembg ---");
  const { execSync } = await import("child_process");
  execSync(`"C:/Users/G$/AppData/Local/Programs/Python/Python313/python.exe" -c "
from rembg import remove
from PIL import Image
import glob
for path in glob.glob('${dir.replace(/\\/g, "/")}/*.png'):
    img = Image.open(path)
    out = remove(img)
    out.save(path)
    print(f'  bg removed: {path.split(chr(47))[-1]}')
"`, { stdio: "inherit" });

  console.log("\n=== Done! 16 Merrick sprites regenerated with dark skin + bg removed. ===");
}

main().catch(console.error);
