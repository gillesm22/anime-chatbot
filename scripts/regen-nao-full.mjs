/**
 * Regenerate Nao: all 15 outfits + 15 expressions using cowgirl quality as reference.
 * The cowgirl has the best quality/style, so we use body-neutral as img2img base
 * with a prompt that matches the cowgirl's soft, cute art style.
 * Run: node scripts/regen-nao-full.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "nao");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, missing hand, missing limb, extra limbs, poorly drawn hands, mutation, bad proportions, background objects, full body, feet, shoes below ankle";

// Match the cowgirl's art quality: soft shading, cute face, blue-silver bob, teal eyes, blush
const NAO_BASE = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, short silver-blue bob hair, messy hair, teal blue eyes, bright blue eyes, pale fair skin, cute face, soft features, natural blush, choker, both hands visible, medium breasts, looking at viewer, soft shading, clean lineart, pastel coloring";
const SEED = 737373;

const OUTFITS = [
  { id: "body-casual", prompt: "oversized teal hoodie, comfortable, headphones around neck, relaxed pose", seed: 1 },
  { id: "body-formal", prompt: "elegant black cocktail dress, simple jewelry, sophisticated, sleek", seed: 2 },
  { id: "body-school", prompt: "japanese school uniform, white shirt, plaid skirt, loose tie, headphones", seed: 3 },
  { id: "body-school-skimpy", prompt: "revealing school uniform, very short skirt, unbuttoned shirt, loose tie", seed: 4 },
  { id: "body-cheerleader", prompt: "cheerleader outfit, white and blue crop top, pleated skirt, cute", seed: 5 },
  { id: "body-cheer-extreme", prompt: "micro cheerleader, sports bra, very short skirt, athletic, toned", seed: 6 },
  { id: "body-cheer-extreme-back", prompt: "micro cheerleader from behind, looking back over shoulder, short skirt", seed: 7 },
  { id: "body-maid", prompt: "french maid outfit, frilly apron, maid headband, thigh highs, cute", seed: 8 },
  { id: "body-vampire", prompt: "gothic vampire, black corset, cape, choker with cross, dark elegant", seed: 9 },
  { id: "body-nurse", prompt: "nurse uniform, white dress, nurse cap, stethoscope, caring expression", seed: 10 },
  { id: "body-cow", prompt: "cow print bikini, cow horns headband, bell choker, playful shy", seed: 11 },
  { id: "body-cowgirl", prompt: "cowgirl, cowboy hat, white tank top, denim short shorts, country cute", seed: 12 },
  { id: "body-demon", prompt: "demon girl, small purple horns, dark bodysuit, bat wings, cute succubus", seed: 13 },
  { id: "body-bikini-front", prompt: "blue bikini, string bikini, swimsuit, shy pose, beach", seed: 14 },
  { id: "body-bikini-back", prompt: "from behind, looking back over shoulder, blue bikini, back view", seed: 15 },
];

const EXPRESSIONS = {
  "face-happy": "happy warm smile, bright eyes, genuine joy, cute",
  "face-thinking": "thoughtful expression, eyes looking slightly up, contemplative",
  "face-surprised": "surprised expression, wide eyes, slightly open mouth",
  "face-sad": "sad expression, downcast eyes, slight frown, melancholic",
  "face-smirk": "confident smirk, one corner of mouth raised, knowing look",
  "face-laugh": "laughing expression, eyes closed with joy, open mouth smile",
  "face-angry": "angry expression, furrowed brows, intense glare, tight jaw",
  "face-flustered": "flustered embarrassed expression, deep blush on cheeks, averted gaze",
  "face-devoted": "deeply loving tender expression, warm soft gaze, gentle blush, adoring smile",
  "face-teasing": "playful teasing expression, sly grin, one eyebrow raised, mischievous",
  "face-sleepy": "drowsy sleepy expression, half-closed eyes, peaceful",
  "face-excited": "excited enthusiastic expression, wide sparkling eyes, big bright grin",
  "face-shy": "shy bashful expression, looking away, deep blush, hand near face",
  "face-jealous": "jealous expression, narrowed eyes, side glance, slight pout",
  "face-crying": "crying expression, tears streaming, scrunched eyebrows, emotional",
};

function txt2img(positive, negative, w, h, seed) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "4": { class_type: "EmptyLatentImage", inputs: { width: w, height: h, batch_size: 1 } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `nao-full-${Date.now()}` } },
  }};
}

function img2img(positive, negative, inputImage, w, h, seed, denoise) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "8": { class_type: "LoadImage", inputs: { image: inputImage } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `nao-full-${Date.now()}` } },
  }};
}

async function queue(workflow) {
  const res = await fetch(`${COMFY_URL}/prompt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workflow) });
  if (!res.ok) throw new Error(`Queue failed: ${res.status}`);
  return res.json();
}

async function wait(promptId) {
  while (true) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    const d = await res.json();
    if (d[promptId]?.outputs) return d[promptId].outputs;
    if (d[promptId]?.status?.status_str === "error") throw new Error("Failed");
    await new Promise(r => setTimeout(r, 3000));
  }
}

async function dl(filename, outPath) {
  const res = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`);
  writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

async function gen(workflow, outPath, label) {
  console.log(`  Generating: ${label}...`);
  const { prompt_id } = await queue(workflow);
  const outputs = await wait(prompt_id);
  const img = Object.values(outputs).find(o => o.images);
  await dl(img.images[0].filename, outPath);
  console.log(`    Saved: ${outPath}`);
}

async function main() {
  console.log("=== Nao Full Regen (body + 15 outfits + 15 expressions) ===\n");
  mkdirSync(SPRITES, { recursive: true });

  console.log("--- body-neutral (txt2img) ---");
  await gen(txt2img(NAO_BASE, NEG, 512, 768, SEED), join(SPRITES, "body-neutral.png"), "body-neutral");

  const baseName = "nao-full-base.png";
  copyFileSync(join(SPRITES, "body-neutral.png"), join(COMFY_INPUT, baseName));

  console.log("\n--- outfits (img2img, denoise 0.55) ---");
  for (const outfit of OUTFITS) {
    await gen(
      img2img(`${NAO_BASE}, ${outfit.prompt}`, NEG, baseName, 512, 768, SEED + outfit.seed, 0.55),
      join(SPRITES, `${outfit.id}.png`), outfit.id
    );
  }

  console.log("\n--- expressions (img2img, denoise 0.45) ---");
  for (const [filename, exprPrompt] of Object.entries(EXPRESSIONS)) {
    await gen(
      img2img(`${NAO_BASE}, ${exprPrompt}`, NEG, baseName, 512, 768, SEED + Object.keys(EXPRESSIONS).indexOf(filename) + 100, 0.45),
      join(SPRITES, `${filename}.png`), filename
    );
  }

  console.log("\n--- Removing backgrounds ---");
  const pyPath = "C:/Users/G$/AppData/Local/Programs/Python/Python313/python.exe";
  const sp = SPRITES.replace(/\\/g, "/");
  execSync(`"${pyPath}" -c "
from rembg import remove
from PIL import Image
import glob
for path in glob.glob('${sp}/*.png'):
    img = Image.open(path)
    out = remove(img)
    out.save(path)
    print(f'  bg removed: {path.split(chr(47))[-1]}')
"`, { stdio: "inherit" });

  console.log("\n=== Done! 31 Nao images + bg removed. ===");
}

main().catch(console.error);
