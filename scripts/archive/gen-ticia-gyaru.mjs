/**
 * Generate gyaru schoolgirl outfit for Ticia (3 variants to pick from).
 * Same settings as final-ticia-fits: anything-v5, img2img, euler_a, 30 steps, CFG 7, denoise 0.7
 * Run: node scripts/gen-ticia-gyaru.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "ticia");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";
const OUT_DIR = join(__dirname, "..", "ticia-gen-runs", "18-gyaru-schoolgirl");

mkdirSync(OUT_DIR, { recursive: true });

// Use casual base (light outfit, best for schoolgirl)
const BASE_IMG = "ticia-casual-ref.png";
copyFileSync(join(SPRITES, "body-casual.png"), join(COMFY_INPUT, BASE_IMG));

const T = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, standing, pale white skin, porcelain skin, (jet black hair:1.5), (black hair:1.5), (long straight hair:1.3), hair past waist, (dark brown eyes:1.3), (red lips:1.3), slender, thin waist, wide hips, large breasts, soft feminine body, smooth skin, elegant composed pose, slight mysterious smile, looking at viewer, warm lighting, soft shading, clean lineart, detailed anime face, big expressive eyes, pretty face, beautiful, dark nails, choker, (perfect hands:1.3), (detailed fingers:1.2)";

const GYARU_PROMPT = "(gyaru:1.4), (kogal:1.3), (tan skin:0.1), (short plaid skirt:1.5), (very short navy blue plaid miniskirt:1.4), (white cropped school blouse:1.4), (bare midriff:1.3), (loose socks:1.3), (unbuttoned collar:1.2), (red bow on chest:1.3), school bag charm accessories, (flashy hair accessories:1.2), (hair clips:1.2), trendy, playful pose, (hands at sides:1.2)";

const NEG = "low quality, blurry, deformed, (extra fingers:1.5), (bad hands:1.5), (mutated hands:1.4), (fused fingers:1.4), (too many fingers:1.4), bad anatomy, text, watermark, signature, worst quality, ugly, tan skin, dark skin, tanned, blonde hair, brown hair, (white hair:1.4), (silver hair:1.4), (grey hair:1.4), headshot, muscular, chibi, child, full body, feet, shoes, (realistic:1.3), (3d:1.3), red eyes, flat color, monochrome, (sweater:1.4), (knit:1.3)";

function img2img(positive, negative, inputImage, seed) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "illustriousxlMmmix_v80.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "8": { class_type: "LoadImage", inputs: { image: inputImage } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 35, cfg: 5.5, sampler_name: "euler", scheduler: "normal", denoise: 0.7, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "ticia-gyaru" } },
  }};
}

async function queue(w) {
  const r = await fetch(COMFY_URL + "/prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(w) });
  if (!r.ok) throw new Error("Queue failed: " + r.status);
  return r.json();
}

async function waitFor(pid) {
  while (true) {
    const r = await fetch(COMFY_URL + "/history/" + pid);
    const d = await r.json();
    if (d[pid]?.outputs) return d[pid].outputs;
    if (d[pid]?.status?.status_str === "error") throw new Error("Failed");
    await new Promise(r => setTimeout(r, 3000));
  }
}

async function dl(fn, op) {
  const r = await fetch(COMFY_URL + "/view?filename=" + encodeURIComponent(fn) + "&type=output");
  writeFileSync(op, Buffer.from(await r.arrayBuffer()));
}

async function main() {
  const seed = 131313 + 4001;
  console.log(`Generating gyaru schoolgirl (seed ${seed})...`);
  const w = img2img(T + ", " + GYARU_PROMPT, NEG, BASE_IMG, seed);
  const { prompt_id } = await queue(w);
  const outputs = await waitFor(prompt_id);
  const img = Object.values(outputs).find(o => o.images);
  await dl(img.images[0].filename, join(OUT_DIR, `v1.png`));
  console.log("Done! Saved to ticia-gen-runs/18-gyaru-schoolgirl/v1.png");
}

main().catch(console.error);
