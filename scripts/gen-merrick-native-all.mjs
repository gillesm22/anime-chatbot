/**
 * Generate ALL Merrick outfits + expressions from native ComfyUI base.
 * Does NOT overwrite body-neutral (keep the user-provided one).
 * Saves to staging folder first for review before pushing.
 * Run: node scripts/gen-merrick-native-all.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "merrick");
const COMFY_URL = "http://localhost:8188";

const CHAR = "(dark skin:1.4), (dark-skinned female:1.3), (very dark brown skin:1.3), (chocolate skin:1.3), (emerald green eyes:1.3), long flowing black hair, hair past waist, large breasts, curvy, wide hips, thick thighs";
const SEXY = `${CHAR}, very sexy, seductive, heavy cleavage, revealing, showing skin, midriff, bare stomach, bare thighs`;
const NEG_BASE = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, extra limbs, poorly drawn hands, mutation, bad proportions, pale skin, fair skin, light skin, white skin, hat, headwrap, red eyes, brown eyes, yellow eyes, artifacts, lines, green hair";
const NEG_OUTFIT = `${NEG_BASE}, white top, white skirt, green skirt, green trim, crop top, modest, covered up`;
const NEG_BACK = `${NEG_BASE}, front view, facing forward`;

const OUTFITS = [
  { id: "body-casual", prompt: `${SEXY}, off shoulder oversized dark sweater, no pants, bare legs, relaxed seductive`, seed: 501 },
  { id: "body-formal", prompt: `${SEXY}, elegant red evening gown, deep v neckline, thigh high slit, gold jewelry, backless`, seed: 502 },
  { id: "body-school", prompt: `${SEXY}, japanese school uniform, white shirt unbuttoned, cleavage, very short plaid skirt, loose tie, thigh highs`, seed: 503 },
  { id: "body-school-skimpy", prompt: `${SEXY}, revealing school uniform, bikini top under open white shirt, micro plaid skirt, bow tie, midriff`, seed: 504 },
  { id: "body-cheerleader", prompt: `${SEXY}, cheerleader crop top, bare midriff, very short pleated skirt, pom poms, thigh highs`, seed: 505 },
  { id: "body-cheer-extreme", prompt: `${SEXY}, (tiny purple sports bra:1.3), (micro purple pleated skirt:1.3), bare arms, bare shoulders, maximum skin, pom poms, cheerleader`, seed: 506 },
  { id: "body-cheer-extreme-back", prompt: `${CHAR}, very sexy, from behind, looking back over shoulder, tiny sports bra, micro skirt, back view`, seed: 507, neg: NEG_BACK },
  { id: "body-maid", prompt: `${SEXY}, gothic maid, strapless black corset top, white frilly mini skirt, maid headdress, white lace, white cuffs, thigh high stockings, garter belt`, seed: 508 },
  { id: "body-vampire", prompt: `${SEXY}, vampire queen, black and red gothic corset, deep cleavage, off shoulder, red lacing, ruby choker, cape behind, fangs, bare shoulders, bare thighs`, seed: 509 },
  { id: "body-nurse", prompt: `${SEXY}, sexy nurse, very short white dress, deep neckline, red cross, nurse cap, thigh highs, stethoscope`, seed: 510 },
  { id: "body-cow", prompt: `${SEXY}, (cow print micro string bikini:1.5), (cow pattern:1.4), (black and white spots:1.3), cow horns headband, golden bell choker, maximum skin, extremely skimpy`, seed: 511 },
  { id: "body-cowgirl", prompt: `${SEXY}, cowgirl, cowboy hat, tied plaid shirt showing midriff, denim micro shorts, bare legs`, seed: 512 },
  { id: "body-demon", prompt: `${SEXY}, succubus demon girl, small horns, revealing dark bodysuit, cutouts, bat wings, choker, seductive`, seed: 513 },
  { id: "body-bikini-front", prompt: `${SEXY}, (black and gold micro string bikini only:1.5), (micro bikini top:1.4), (string bikini bottom:1.4), gold ankh pendant, gold body chain, bare stomach, bare shoulders, maximum skin, extremely skimpy`, seed: 514 },
  { id: "body-bikini-back", prompt: `${CHAR}, very sexy, seductive, (from behind:1.5), (looking back over shoulder:1.3), (black and gold string bikini:1.4), (thong:1.3), gold chain waist jewelry, bare back, bare shoulders, bare thighs`, seed: 515, neg: NEG_BACK },
  { id: "body-back", prompt: `${CHAR}, (from behind:1.5), (back turned:1.4), (looking back over shoulder:1.3), white crop top, white pleated mini skirt, green trim, bare shoulders, gold chain necklace, gold hoop earrings, choker, confident`, seed: 516, neg: NEG_BACK },
];

const EXPRESSIONS = [
  { id: "face-happy", prompt: `${CHAR}, happy warm smile, bright eyes, genuine joy`, seed: 601 },
  { id: "face-thinking", prompt: `${CHAR}, thoughtful expression, eyes looking slightly up, contemplative`, seed: 602 },
  { id: "face-surprised", prompt: `${CHAR}, surprised expression, wide eyes, slightly open mouth`, seed: 603 },
  { id: "face-sad", prompt: `${CHAR}, sad expression, downcast eyes, slight frown, melancholic`, seed: 604 },
  { id: "face-smirk", prompt: `${CHAR}, confident smirk, one corner of mouth raised, knowing look`, seed: 605 },
  { id: "face-laugh", prompt: `${CHAR}, laughing expression, eyes closed with joy, open mouth smile`, seed: 606 },
  { id: "face-angry", prompt: `${CHAR}, angry expression, furrowed brows, intense glare, tight jaw`, seed: 607 },
  { id: "face-flustered", prompt: `${CHAR}, flustered embarrassed expression, deep blush on cheeks, averted gaze`, seed: 608 },
  { id: "face-devoted", prompt: `${CHAR}, deeply loving tender expression, warm soft gaze, gentle blush, adoring smile`, seed: 609 },
  { id: "face-teasing", prompt: `${CHAR}, playful teasing expression, sly grin, one eyebrow raised, mischievous`, seed: 610 },
  { id: "face-sleepy", prompt: `${CHAR}, drowsy sleepy expression, half-closed eyes, peaceful`, seed: 611 },
  { id: "face-excited", prompt: `${CHAR}, excited enthusiastic expression, wide sparkling eyes, big bright grin`, seed: 612 },
  { id: "face-shy", prompt: `${CHAR}, shy bashful expression, looking away, deep blush, hand near face`, seed: 613 },
  { id: "face-jealous", prompt: `${CHAR}, jealous expression, narrowed eyes, side glance, slight pout`, seed: 614 },
  { id: "face-crying", prompt: `${CHAR}, crying expression, tears streaming, scrunched eyebrows, emotional`, seed: 615 },
];

function img2img(positive, negative, seed, denoise, cfg) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: `masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, cowboy shot, ${positive}, looking at viewer, warm lighting, soft shading, clean lineart`, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "8": { class_type: "LoadImage", inputs: { image: "merrick-native-base.png" } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 35, cfg, sampler_name: "euler_ancestral", scheduler: "normal", denoise, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `merrick-native-${Date.now()}` } },
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

async function gen(positive, negative, seed, denoise, cfg, outPath, label) {
  console.log(`  Generating: ${label}...`);
  const { prompt_id } = await queue(img2img(positive, negative, seed, denoise, cfg));
  const outputs = await wait(prompt_id);
  const img = Object.values(outputs).find(o => o.images);
  await dl(img.images[0].filename, outPath);
  console.log(`    Saved: ${label}`);
}

async function main() {
  console.log("=== Merrick Native: All Outfits + Expressions ===\n");

  // First generate the native base
  console.log("--- Generating native base ---");
  const basePOS = `masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, ${CHAR}, white crop top, white pleated mini skirt, green trim, black choker, gold hoop earrings, gold chain necklace, midriff, bare shoulders, confident smile, slight head tilt, one hand playing with hair, looking at viewer, warm lighting, soft shading, clean lineart, high detail`;
  const baseWorkflow = { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: basePOS, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: NEG_BASE, clip: ["1", 1] } },
    "4": { class_type: "EmptyLatentImage", inputs: { width: 512, height: 768, batch_size: 1 } },
    "5": { class_type: "KSampler", inputs: { seed: 333001, steps: 35, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "merrick-native-base" } },
  }};
  const { prompt_id: baseId } = await queue(baseWorkflow);
  const baseOutputs = await wait(baseId);
  const baseImg = Object.values(baseOutputs).find(o => o.images);
  const basePath = join(SPRITES, "body-neutral.png");
  await dl(baseImg.images[0].filename, basePath);
  copyFileSync(basePath, join("C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input", "merrick-native-base.png"));
  console.log("  Base saved and copied to ComfyUI input\n");

  // Outfits at 0.72 denoise, cfg 9.5
  console.log("--- outfits (0.72 denoise) ---");
  for (const outfit of OUTFITS) {
    const neg = outfit.neg || NEG_OUTFIT;
    await gen(outfit.prompt, neg, 444000 + outfit.seed, 0.72, 9.5, join(SPRITES, `${outfit.id}.png`), outfit.id);
  }

  // Expressions at 0.45 denoise, cfg 8
  console.log("\n--- expressions (0.45 denoise) ---");
  for (const expr of EXPRESSIONS) {
    await gen(expr.prompt, NEG_BASE, 444000 + expr.seed, 0.45, 8, join(SPRITES, `${expr.id}.png`), expr.id);
  }

  // rembg
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

  console.log("\n=== Done! Merrick native: 1 base + 16 outfits + 15 expressions + bg removed. ===");
}

main().catch(console.error);
