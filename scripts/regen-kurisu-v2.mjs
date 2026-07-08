/**
 * Regenerate Kurisu v2: athletic build, tsundere expressions, Suzuka v2 formula.
 * Run: node scripts/regen-kurisu-v2.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "kurisu");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, missing hand, missing limb, extra limbs, poorly drawn hands, mutation, bad proportions, background objects, full body, feet, shoes, boots, legs below thigh";

const KURISU_BASE = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, makise kurisu, steins gate, (long chestnut auburn wavy hair:1.2), hair between eyes, (blue violet eyes:1.3), sharp eyes, white lab coat, white collared shirt, red necktie, black shorts, both hands visible, arms at sides, athletic body, toned, medium-large breasts, fit waist, slim waist, defined figure, looking at viewer, soft shading, clean lineart, warm lighting";
const SEED = 626262;

const EXPRESSIONS = {
  "face-happy": "happy warm smile, bright eyes, genuine joy, slight blush, caught off guard by own happiness",
  "face-thinking": "thoughtful expression, eyes looking up, contemplative, adjusting glasses, finger on glasses frame",
  "face-surprised": "wide eyes, slightly open mouth, glasses sliding down nose, caught off guard",
  "face-sad": "downcast eyes, slight frown, melancholic, looking away, hand gripping arm",
  "face-smirk": "confident smirk, one corner raised, knowing look, intellectual superiority, adjusting glasses",
  "face-laugh": "eyes closed with joy, open mouth laugh, hand near mouth, genuinely caught off guard",
  "face-angry": "furrowed brows, intense glare, tight jaw, arms crossed energy, sharp look",
  "face-flustered": "deep blush, averted gaze sharply, steam, hand up defensively, looking away hard",
  "face-devoted": "warm soft unguarded gaze, gentle blush, adoring smile, rare vulnerability, soft eyes",
  "face-teasing": "sly grin, one eyebrow raised, mischievous, leaning forward slightly, playful",
  "face-sleepy": "half-closed eyes, peaceful, head tilting, drowsy, glasses askew",
  "face-excited": "wide sparkling eyes, big bright grin, leaning forward, hands together, research excitement",
  "face-shy": "looking away, deep blush, biting lip, hand near face, regretting what she just said",
  "face-jealous": "narrowed eyes, sharp side glance, slight pout, competitive irritation",
  "face-crying": "tears streaming, scrunched eyebrows, emotional, trying to hide face, glasses fogging",
};

function txt2img(positive, negative, w, h, seed) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "4": { class_type: "EmptyLatentImage", inputs: { width: w, height: h, batch_size: 1 } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `kurisu-v2-${Date.now()}` } },
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
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `kurisu-v2-${Date.now()}` } },
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
  console.log("=== Kurisu v2 Full Regen (athletic build, tsundere expressions) ===\n");
  mkdirSync(SPRITES, { recursive: true });

  console.log("--- body-neutral (txt2img) ---");
  await gen(txt2img(KURISU_BASE, NEG, 512, 768, SEED), join(SPRITES, "body-neutral.png"), "body-neutral");

  const baseName = "kurisu-v2-base.png";
  copyFileSync(join(SPRITES, "body-neutral.png"), join(COMFY_INPUT, baseName));

  console.log("\n--- expressions (img2img, denoise 0.45) ---");
  for (const [filename, exprPrompt] of Object.entries(EXPRESSIONS)) {
    await gen(
      img2img(`${KURISU_BASE}, ${exprPrompt}`, NEG, baseName, 512, 768, SEED + Object.keys(EXPRESSIONS).indexOf(filename) + 100, 0.45),
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

  console.log("\n=== Done! 16 Kurisu v2 images (1 base + 15 expressions) + bg removed. ===");
}

main().catch(console.error);
