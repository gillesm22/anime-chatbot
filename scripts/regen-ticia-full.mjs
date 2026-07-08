/**
 * Generate Ticia: gothic Morticia-inspired character — base + outfits + expressions.
 * Run: node scripts/regen-ticia-full.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "ticia");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, tan skin, dark skin, tanned, blonde hair, brown hair, (white hair:1.4), (silver hair:1.4), (grey hair:1.4), colorful clothes, bright colors, headshot, muscular, abs, toned, chibi, child, full body, feet, shoes, (realistic:1.3), (3d:1.3), red eyes, flat color, monochrome, arms crossed";

const TICIA_BASE = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, standing, pale white skin, porcelain skin, (jet black hair:1.5), (black hair:1.5), (long straight hair:1.3), hair past waist, (dark brown eyes:1.3), (red lips:1.3), (crimson lipstick:1.2), (form-fitting black dress:1.4), (gothic black dress:1.3), (black lace:1.2), (off-shoulder:1.2), low neckline, subtle cleavage, slender, thin waist, wide hips, large breasts, soft feminine body, smooth skin, (elegant composed pose:1.3), (hands clasped together in front:1.3), (fingers interlaced:1.2), slight mysterious smile, looking at viewer, warm lighting, soft shading, clean lineart, detailed anime face, big expressive eyes, pretty face, beautiful, dark nails, choker";

const TICIA_IDENTITY = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, standing, pale white skin, porcelain skin, (jet black hair:1.5), (black hair:1.5), (long straight hair:1.3), hair past waist, (dark brown eyes:1.3), (red lips:1.3), slender, thin waist, wide hips, large breasts, soft feminine body, smooth skin, elegant composed pose, slight mysterious smile, looking at viewer, warm lighting, soft shading, clean lineart, detailed anime face, big expressive eyes, pretty face, beautiful, dark nails, choker";

const SEED = 131313;

const OUTFITS = [
  { id: "body-casual", prompt: "oversized grey knit sweater, bare legs, black thigh-high socks, no pants, messy hair, relaxed", seed: 1 },
  { id: "body-formal", prompt: "long black velvet evening gown, long white satin gloves, silver diamond necklace, hair updo, deep neckline", seed: 2 },
  { id: "body-school", prompt: "white dress shirt, grey blazer, black and red plaid pleated skirt, black necktie, knee socks", seed: 3 },
  { id: "body-school-skimpy", prompt: "unbuttoned white shirt showing bra, very short plaid skirt, loose necktie, midriff visible, rebellious", seed: 4 },
  { id: "body-cheerleader", prompt: "purple and black cheerleader crop top, short purple pleated skirt, holding white pom poms, deadpan face", seed: 5 },
  { id: "body-cheer-extreme", prompt: "tiny black sports bra, very short purple skirt, bare stomach, bare midriff, cheerleader", seed: 6 },
  { id: "body-cheer-extreme-back", prompt: "cheerleader outfit from behind, looking back over shoulder, short skirt, back view", seed: 7 },
  { id: "body-maid", prompt: "black maid dress with white frilly apron, white lace headband, white lace cuffs, black stockings with garters", seed: 8 },
  { id: "body-vampire", prompt: "red and black corset, long black cape with red satin lining, high collar, gothic tiara, fangs visible", seed: 9 },
  { id: "body-nurse", prompt: "short white nurse dress, white nurse cap with red cross, black latex gloves, stethoscope around neck", seed: 10 },
  { id: "body-cow", prompt: "black and white cow print bikini top, cow print bikini bottom, cow horn headband, cowbell collar, bare midriff", seed: 11 },
  { id: "body-cowgirl", prompt: "wide black cowboy hat, brown leather vest, denim short shorts, large belt buckle, western boots", seed: 12 },
  { id: "body-demon", prompt: "large curved dark horns, tight black and red bodysuit, small bat wings on back, pointed tail, pentagram choker", seed: 13 },
  { id: "body-bikini-front", prompt: "black string bikini top, black bikini bottom, bare stomach, bare shoulders, lots of pale skin, swimsuit", seed: 14 },
  { id: "body-bikini-back", prompt: "from behind, looking back over shoulder, black string bikini, bare back, pale skin, hair flowing", seed: 15 },
];

const EXPRESSIONS = {
  "face-happy": "gentle warm smile, soft eyes, quiet happiness, rare genuine warmth",
  "face-thinking": "contemplative expression, eyes looking slightly up, pondering something dark and fascinating",
  "face-surprised": "slightly widened eyes, one eyebrow raised, composed surprise, intrigued",
  "face-sad": "beautiful melancholy, downcast eyes, slight frown, elegantly sorrowful",
  "face-smirk": "knowing smirk, one corner of mouth raised, dry amusement, classic Morticia look",
  "face-laugh": "low quiet laugh, eyes narrowed with amusement, amused by something morbid",
  "face-angry": "cold displeasure, icy stare, terrifyingly calm anger, narrowed eyes",
  "face-flustered": "rare loss of composure, slight blush on pale cheeks, averted gaze, caught off guard",
  "face-devoted": "dark consuming romantic intensity, deep loving gaze, possessive tenderness",
  "face-teasing": "playfully unsettling smile, raised eyebrow, mischievous dark humor",
  "face-sleepy": "languid half-closed eyes, peaceful nocturnal contentment, drowsy elegance",
  "face-excited": "widened eyes with fascination, slight parted lips, intellectually delighted by something macabre",
  "face-shy": "unexpected vulnerability, looking away slightly, rare softness beneath composure",
  "face-jealous": "possessive narrowed eyes, cold side glance, quietly dangerous jealousy",
  "face-crying": "tears on pale cheeks, devastatingly beautiful grief, emotional but composed",
};

function txt2img(positive, negative, w, h, seed) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "4": { class_type: "EmptyLatentImage", inputs: { width: w, height: h, batch_size: 1 } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `ticia-full-${Date.now()}` } },
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
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `ticia-full-${Date.now()}` } },
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
  console.log("=== Ticia Full Gen (body + 15 outfits + 15 expressions) ===\n");
  mkdirSync(SPRITES, { recursive: true });

  console.log("--- SKIPPING body-neutral (already approved) ---");

  const baseName = "ticia-full-base.png";
  copyFileSync(join(SPRITES, "body-neutral.png"), join(COMFY_INPUT, baseName));

  console.log("\n--- outfits (img2img, denoise 0.6, identity prompt) ---");
  for (const outfit of OUTFITS) {
    await gen(
      img2img(`${TICIA_IDENTITY}, ${outfit.prompt}`, NEG, baseName, 512, 768, SEED + outfit.seed, 0.7),
      join(SPRITES, `${outfit.id}.png`), outfit.id
    );
  }

  console.log("\n--- SKIPPING expressions (already good) ---");

  console.log("\n--- Removing backgrounds ---");
  const pyPath = "C:/Users/G$/AppData/Local/Programs/Python/Python313/python.exe";
  const sp = SPRITES.replace(/\\/g, "/");
  execSync(`"${pyPath}" -c "
from rembg import remove
from PIL import Image
import glob
for path in glob.glob('${sp}/*.png'):
    img = Image.open(path).convert('RGBA')
    out = remove(img, alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10, alpha_matting_erode_size=10)
    out.save(path)
    print(f'  bg removed: {path.split(chr(47))[-1]}')
"`, { stdio: "inherit" });

  console.log("\n=== Done! 31 Ticia images + bg removed. ===");
}

main().catch(console.error);
