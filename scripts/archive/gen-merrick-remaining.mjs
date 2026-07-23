/**
 * Generate remaining Merrick expressions (14) + outfits (14) from new cheerleader base.
 * Skips face-happy and body-vampire (already approved).
 * Run: node scripts/gen-merrick-remaining.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "merrick");
const COMFY_URL = "http://localhost:8188";

const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, extra limbs, poorly drawn hands, mutation, bad proportions, pale skin, fair skin, light skin, hat, headwrap, front cloth panel, center cloth strip, loincloth, hanging cloth, dangling fabric";
const CHAR_BASE = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, cowboy shot, dark skin, dark-skinned female, very dark brown skin, chocolate skin, striking emerald green eyes, long flowing black hair, hair past waist, large breasts";
const CHAR_SEXY = `${CHAR_BASE}, very sexy, seductive, heavy cleavage, revealing, showing skin, midriff, bare stomach, bare thighs`;

const EXPRESSIONS = [
  { id: "face-thinking", prompt: `${CHAR_BASE}, thoughtful expression, eyes looking slightly up, contemplative`, seed: 201 },
  { id: "face-surprised", prompt: `${CHAR_BASE}, surprised expression, wide eyes, slightly open mouth`, seed: 202 },
  { id: "face-sad", prompt: `${CHAR_BASE}, sad expression, downcast eyes, slight frown, melancholic`, seed: 203 },
  { id: "face-smirk", prompt: `${CHAR_BASE}, confident smirk, one corner of mouth raised, knowing look`, seed: 204 },
  { id: "face-laugh", prompt: `${CHAR_BASE}, laughing expression, eyes closed with joy, open mouth smile`, seed: 205 },
  { id: "face-angry", prompt: `${CHAR_BASE}, angry expression, furrowed brows, intense glare, tight jaw`, seed: 206 },
  { id: "face-flustered", prompt: `${CHAR_BASE}, flustered embarrassed expression, deep blush on cheeks, averted gaze`, seed: 207 },
  { id: "face-devoted", prompt: `${CHAR_BASE}, deeply loving tender expression, warm soft gaze, gentle blush, adoring smile`, seed: 208 },
  { id: "face-teasing", prompt: `${CHAR_BASE}, playful teasing expression, sly grin, one eyebrow raised, mischievous`, seed: 209 },
  { id: "face-sleepy", prompt: `${CHAR_BASE}, drowsy sleepy expression, half-closed eyes, peaceful`, seed: 210 },
  { id: "face-excited", prompt: `${CHAR_BASE}, excited enthusiastic expression, wide sparkling eyes, big bright grin`, seed: 211 },
  { id: "face-shy", prompt: `${CHAR_BASE}, shy bashful expression, looking away, deep blush, hand near face`, seed: 212 },
  { id: "face-jealous", prompt: `${CHAR_BASE}, jealous expression, narrowed eyes, side glance, slight pout`, seed: 213 },
  { id: "face-crying", prompt: `${CHAR_BASE}, crying expression, tears streaming, scrunched eyebrows, emotional`, seed: 214 },
];

const OUTFITS = [
  { id: "body-casual", prompt: `${CHAR_SEXY}, off shoulder oversized sweater, no pants, bare legs, relaxed seductive`, seed: 301 },
  { id: "body-formal", prompt: `${CHAR_SEXY}, elegant red evening gown, deep v neckline, thigh high slit, gold jewelry, backless`, seed: 302 },
  { id: "body-school", prompt: `${CHAR_SEXY}, japanese school uniform, white shirt unbuttoned, cleavage, very short plaid skirt, loose tie, thigh highs`, seed: 303 },
  { id: "body-school-skimpy", prompt: `${CHAR_SEXY}, micro school uniform, bikini top under open shirt, tiny skirt, bow tie, midriff visible`, seed: 304 },
  { id: "body-cheerleader", prompt: `${CHAR_SEXY}, cheerleader crop top, bare midriff, very short pleated skirt, thigh highs`, seed: 305 },
  { id: "body-cheer-extreme", prompt: `${CHAR_SEXY}, sports bra only, micro skirt, athletic, toned midriff`, seed: 306 },
  { id: "body-cheer-extreme-back", prompt: `${CHAR_SEXY}, from behind, looking back over shoulder, sports bra, micro skirt, back view`, seed: 307 },
  { id: "body-maid", prompt: `${CHAR_SEXY}, gothic maid, strapless black corset top, white frilly mini skirt, maid headdress, white lace, white cuffs, thigh high stockings, garter belt`, seed: 308 },
  { id: "body-nurse", prompt: `${CHAR_SEXY}, sexy nurse, very short white dress, deep neckline, red cross, nurse cap, thigh highs`, seed: 309 },
  { id: "body-cow", prompt: `${CHAR_SEXY}, cow print string bikini, cow horns headband, bell choker, playful pose`, seed: 310 },
  { id: "body-cowgirl", prompt: `${CHAR_SEXY}, cowgirl, cowboy hat, tied plaid shirt showing midriff, denim micro shorts, bare legs`, seed: 311 },
  { id: "body-demon", prompt: `${CHAR_SEXY}, succubus demon girl, small horns, revealing dark bodysuit, cutouts, bat wings, choker, seductive`, seed: 312 },
  { id: "body-bikini-front", prompt: `${CHAR_SEXY}, gold string bikini, swimsuit front view, beach, confident sexy pose`, seed: 313 },
  { id: "body-bikini-back", prompt: `${CHAR_SEXY}, from behind, looking back over shoulder, gold string bikini, back view, beach`, seed: 314 },
];

function img2img(positive, negative, inputImage, seed, denoise) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: `${positive}, looking at viewer, warm lighting, soft shading, clean lineart`, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "8": { class_type: "LoadImage", inputs: { image: inputImage } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 30, cfg: 8.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `merrick-final-${Date.now()}` } },
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

async function gen(pos, seed, denoise, outPath, label) {
  console.log(`  Generating: ${label}...`);
  const { prompt_id } = await queue(img2img(pos, NEG, "merrick-outfit-base.png", seed, denoise));
  const outputs = await wait(prompt_id);
  const img = Object.values(outputs).find(o => o.images);
  await dl(img.images[0].filename, outPath);
  console.log(`    Saved: ${label}`);
}

async function main() {
  console.log("=== Merrick Remaining (14 expressions + 14 outfits) ===\n");

  console.log("--- expressions (0.45 denoise) ---");
  for (const expr of EXPRESSIONS) {
    await gen(expr.prompt, 999000 + expr.seed, 0.45, join(SPRITES, `${expr.id}.png`), expr.id);
  }

  console.log("\n--- outfits (0.75 denoise) ---");
  for (const outfit of OUTFITS) {
    await gen(outfit.prompt, 888000 + outfit.seed, 0.75, join(SPRITES, `${outfit.id}.png`), outfit.id);
  }

  console.log("\n--- Removing backgrounds ---");
  const pyPath = "C:/Users/G$/AppData/Local/Programs/Python/Python313/python.exe";
  const sp = SPRITES.replace(/\\/g, "/");
  execSync(`"${pyPath}" -c "
from rembg import remove
from PIL import Image
import glob
for path in glob.glob('${sp}/*.png'):
    if 'neutral' in path: continue
    img = Image.open(path)
    out = remove(img)
    out.save(path)
    print(f'  bg removed: {path.split(chr(47))[-1]}')
"`, { stdio: "inherit" });

  console.log("\n=== Done! 28 Merrick images + bg removed. ===");
}

main().catch(console.error);
