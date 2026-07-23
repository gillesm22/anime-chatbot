/**
 * Generate Morticia default dress outfit for Ticia.
 * Illustrious Fye workflow: illustriousxlMmmix_v80, euler, 35 steps, CFG 5.5, denoise 0.7
 * Run: node scripts/gen-ticia-morticia.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "ticia");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";
const OUT_DIR = join(__dirname, "..", "ticia-gen-runs", "19-morticia-dress");

mkdirSync(OUT_DIR, { recursive: true });

// Use vampire base (dark outfit, best for gothic dress per settings reference)
const BASE_IMG = "ticia-vampire-ref.png";
copyFileSync(join(SPRITES, "body-vampire.png"), join(COMFY_INPUT, BASE_IMG));

const T = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, standing, pale white skin, porcelain skin, (jet black hair:1.5), (black hair:1.5), (long straight hair:1.3), hair past waist, (dark brown eyes:1.3), (red lips:1.3), slender, thin waist, wide hips, large breasts, soft feminine body, smooth skin, elegant composed pose, slight mysterious smile, looking at viewer, warm lighting, soft shading, clean lineart, detailed anime face, big expressive eyes, pretty face, beautiful, dark nails, choker, (perfect hands:1.3), (detailed fingers:1.2)";

const MORTICIA_PROMPT = "(tight black floor-length dress:1.6), (sleek black column dress:1.5), (fully clothed:1.5), (long tight sleeves:1.4), (skin tight black dress:1.5), (all black:1.4), (no white clothing:1.3), (v neckline:1.3), (morticia addams:1.4), gothic elegant, regal, dark beauty, hands at sides, (dark clothing only:1.3)";

const NEG = "low quality, blurry, deformed, (extra fingers:1.5), (bad hands:1.5), (mutated hands:1.4), (fused fingers:1.4), (too many fingers:1.4), bad anatomy, text, watermark, signature, worst quality, ugly, tan skin, dark skin, tanned, blonde hair, brown hair, (white hair:1.4), (silver hair:1.4), (grey hair:1.4), headshot, muscular, chibi, child, full body, feet, shoes, (realistic:1.3), (3d:1.3), red eyes, flat color, monochrome, (horns:1.4), (wings:1.4), (tail:1.4), (bikini:1.5), (lingerie:1.5), (nude:1.5), (naked:1.5), (bare chest:1.5), (exposed skin:1.4), (straps:1.3), (bondage:1.5), (harness:1.5), (revealing:1.4)";

function img2img(positive, negative, inputImage, seed) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "illustriousxlMmmix_v80.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "8": { class_type: "LoadImage", inputs: { image: inputImage } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 35, cfg: 5.5, sampler_name: "euler", scheduler: "normal", denoise: 0.8, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "ticia-morticia" } },
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
  const seed = 131313 + 5501;
  console.log(`Generating Morticia dress (seed ${seed})...`);
  const w = img2img(T + ", " + MORTICIA_PROMPT, NEG, BASE_IMG, seed);
  const { prompt_id } = await queue(w);
  const outputs = await waitFor(prompt_id);
  const img = Object.values(outputs).find(o => o.images);
  await dl(img.images[0].filename, join(OUT_DIR, `v1.png`));
  console.log("Done! Saved to ticia-gen-runs/19-morticia-dress/v1.png");
}

main().catch(console.error);
