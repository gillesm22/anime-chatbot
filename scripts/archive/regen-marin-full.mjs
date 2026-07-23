/**
 * Regenerate Marin: upper body framing to match Merrick quality + all outfits + 15 expressions.
 * Run: node scripts/regen-marin-full.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "marin");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, pale skin, fair skin, white skin, black hair, dark hair, brown hair, close-up, portrait, headshot, (muscular:1.5), (abs:1.5), (toned:1.5), (athletic:1.5), (six pack:1.5), (muscle definition:1.5), (muscle:1.5), (fit body:1.4), (navel line:1.3), (linea alba:1.3), bodybuilder, blue eyes, grey eyes, very dark skin, (chubby:1.3), (fat:1.3), (thick waist:1.3), (wide waist:1.3), feet, shoes";

const MARIN_BASE = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, (cowboy shot:1.2), (showing thighs:1.2), standing, (light tan skin:1.3), (sun-kissed:1.2), long voluminous wavy (blonde hair:1.4), bright (amber eyes:1.4), (honey golden eyes:1.3), gyaru, cute confident smile, (fitted white crop top:1.3), bare shoulders, bare midriff, (denim shorts:1.2), gold hoop earrings, gold necklace, choker, (very soft feminine body:1.5), (no muscle:1.4), (smooth belly:1.4), (thin waist:1.4), (narrow waist:1.3), (hourglass figure:1.3), (wide hips:1.3), (curvy:1.3), (large breasts:1.2), (thick thighs:1.3), (plump thighs:1.2), looking at viewer, warm lighting, soft shading, clean lineart, pretty face, cute";

// Outfit-only prompt: character identity WITHOUT default clothing, so outfits actually show
const MARIN_IDENTITY = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, (cowboy shot:1.2), (showing thighs:1.2), standing, (light tan skin:1.3), (sun-kissed:1.2), long voluminous wavy (blonde hair:1.4), bright (amber eyes:1.4), (honey golden eyes:1.3), gyaru, cute confident smile, gold hoop earrings, gold necklace, (very soft feminine body:1.5), (no muscle:1.4), (smooth belly:1.4), (thin waist:1.4), (hourglass figure:1.3), (wide hips:1.3), (curvy:1.3), (large breasts:1.2), (thick thighs:1.3), (plump thighs:1.2), looking at viewer, warm lighting, soft shading, clean lineart, pretty face, cute";

const SEED = 450453;

const OUTFITS = [
  { id: "body-casual", prompt: "casual clothes, oversized band tee, comfortable relaxed, denim shorts", seed: 1 },
  { id: "body-formal", prompt: "glamorous gold evening dress, sparkly, elegant, sophisticated", seed: 2 },
  { id: "body-school", prompt: "customized school uniform, loose tie, unbuttoned blazer, plaid skirt, gyaru style", seed: 3 },
  { id: "body-school-skimpy", prompt: "revealing school uniform, very short skirt, unbuttoned shirt, loose tie, midriff showing", seed: 4 },
  { id: "body-cheerleader", prompt: "cheerleader outfit, crop top, pleated skirt, energetic, pom poms", seed: 5 },
  { id: "body-cheer-extreme", prompt: "micro cheerleader outfit, sports bra, very short skirt, athletic", seed: 6 },
  { id: "body-cheer-extreme-back", prompt: "micro cheerleader outfit from behind, looking back over shoulder, short skirt", seed: 7 },
  { id: "body-maid", prompt: "french maid outfit, frilly apron, headband, thigh highs, cute", seed: 8 },
  { id: "body-vampire", prompt: "vampire costume, gothic dress, fangs, bat wings, sexy halloween", seed: 9 },
  { id: "body-nurse", prompt: "nurse uniform, white dress, red cross, nurse cap, playful", seed: 10 },
  { id: "body-cow", prompt: "cow print bikini, cow horns headband, bell choker, playful wink", seed: 11 },
  { id: "body-cowgirl", prompt: "cowgirl outfit, cowboy hat, denim shorts, plaid shirt tied at waist, boots", seed: 12 },
  { id: "body-demon", prompt: "demon girl, small horns, dark bodysuit, bat wings, succubus, seductive", seed: 13 },
  { id: "body-bikini-front", prompt: "orange string bikini, swimsuit, confident pose, beach vibes", seed: 14 },
  { id: "body-bikini-back", prompt: "from behind, looking back over shoulder, orange bikini, back view", seed: 15 },
];

const EXPRESSIONS = {
  "face-happy": "happy bright smile, sparkling eyes, genuine joy, toothy grin",
  "face-thinking": "thoughtful expression, eyes looking slightly up, finger on chin, contemplative",
  "face-surprised": "surprised expression, wide eyes, open mouth, shocked",
  "face-sad": "sad expression, downcast eyes, slight frown, trying to hold it together",
  "face-smirk": "sassy smirk, one corner of mouth raised, confident knowing look",
  "face-laugh": "laughing hard, eyes squeezed shut with joy, wide open mouth, head tilted",
  "face-angry": "angry expression, furrowed brows, intense glare, pouting",
  "face-flustered": "flustered embarrassed expression, deep blush on cheeks, averted gaze, hands up",
  "face-devoted": "deeply loving tender expression, warm soft gaze, gentle blush, adoring smile",
  "face-teasing": "playful teasing expression, tongue out slightly, winking, mischievous grin",
  "face-sleepy": "drowsy sleepy expression, half-closed eyes, yawning, peaceful",
  "face-excited": "super excited expression, wide sparkling eyes, huge bright grin, pumped up",
  "face-shy": "shy bashful expression, looking away, deep blush, hand near face, fidgeting",
  "face-jealous": "jealous expression, narrowed eyes, side glance, slight pout, arms crossed",
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
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `marin-full-${Date.now()}` } },
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
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `marin-full-${Date.now()}` } },
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
  console.log("=== Marin Full Regen (body + 15 outfits + 15 expressions) ===\n");
  mkdirSync(SPRITES, { recursive: true });

  console.log("--- body-neutral (txt2img) ---");
  await gen(txt2img(MARIN_BASE, NEG, 512, 896, SEED), join(SPRITES, "body-neutral.png"), "body-neutral");

  const baseName = "marin-full-base.png";
  copyFileSync(join(SPRITES, "body-neutral.png"), join(COMFY_INPUT, baseName));

  console.log("\n--- outfits (img2img, denoise 0.7) ---");
  for (const outfit of OUTFITS) {
    await gen(
      img2img(`${MARIN_IDENTITY}, ${outfit.prompt}`, NEG, baseName, 512, 896, SEED + outfit.seed, 0.7),
      join(SPRITES, `${outfit.id}.png`), outfit.id
    );
  }

  console.log("\n--- expressions (img2img, denoise 0.45) ---");
  for (const [filename, exprPrompt] of Object.entries(EXPRESSIONS)) {
    await gen(
      img2img(`${MARIN_BASE}, ${exprPrompt}`, NEG, baseName, 512, 896, SEED + Object.keys(EXPRESSIONS).indexOf(filename) + 100, 0.45),
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
    out = remove(img, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=10)
    out.save(path)
    print(f'  bg removed: {path.split(chr(47))[-1]}')
"`, { stdio: "inherit" });

  console.log("\n=== Done! 31 Marin images + bg removed. ===");
}

main().catch(console.error);
