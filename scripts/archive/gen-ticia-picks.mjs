/**
 * Generate 3 variants per Ticia outfit for picking.
 * Run: node scripts/gen-ticia-picks.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "ticia");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";
const OUT_BASE = join(__dirname, "..", "ticia-gen-runs", "16-pick-variants");

// Copy bases
const casualBase = "ticia-casual-ref.png";
const demonBase = "ticia-demon-ref.png";
const backBase = "ticia-back-ref.png";
const nurseBase = "ticia-nurse-ref.png";

copyFileSync(join(SPRITES, "body-casual.png"), join(COMFY_INPUT, casualBase));
copyFileSync(join(SPRITES, "body-demon.png"), join(COMFY_INPUT, demonBase));
copyFileSync(join(SPRITES, "body-cheer-extreme-back.png"), join(COMFY_INPUT, backBase));
copyFileSync(join(SPRITES, "body-nurse.png"), join(COMFY_INPUT, nurseBase));

const T = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, standing, pale white skin, porcelain skin, (jet black hair:1.5), (black hair:1.5), (long straight hair:1.3), hair past waist, (dark brown eyes:1.3), (red lips:1.3), slender, thin waist, wide hips, large breasts, soft feminine body, smooth skin, elegant composed pose, slight mysterious smile, looking at viewer, warm lighting, soft shading, clean lineart, detailed anime face, big expressive eyes, pretty face, beautiful, dark nails, choker, (perfect hands:1.3), (detailed fingers:1.2)";

const NEG_LIGHT = "low quality, blurry, deformed, (extra fingers:1.5), (bad hands:1.5), (mutated hands:1.4), (fused fingers:1.4), (too many fingers:1.4), bad anatomy, text, watermark, signature, worst quality, ugly, tan skin, dark skin, tanned, blonde hair, brown hair, (white hair:1.4), (silver hair:1.4), (grey hair:1.4), headshot, muscular, chibi, child, full body, feet, shoes, (realistic:1.3), (3d:1.3), red eyes, flat color, monochrome, (sweater:1.4), (knit:1.3)";

const NEG_DARK = "low quality, blurry, deformed, (extra fingers:1.5), (bad hands:1.5), (mutated hands:1.4), (fused fingers:1.4), (too many fingers:1.4), bad anatomy, text, watermark, signature, worst quality, ugly, tan skin, dark skin, tanned, blonde hair, brown hair, (white hair:1.4), (silver hair:1.4), (grey hair:1.4), headshot, muscular, chibi, child, full body, feet, shoes, (realistic:1.3), (3d:1.3), red eyes, flat color, monochrome, (horns:1.4), (wings:1.4), (tail:1.4), (bodysuit:1.3)";

const NEG_BACK = "low quality, blurry, deformed, (extra fingers:1.5), (bad hands:1.5), (mutated hands:1.4), (fused fingers:1.4), bad anatomy, text, watermark, signature, worst quality, ugly, tan skin, dark skin, tanned, blonde hair, brown hair, (white hair:1.4), (silver hair:1.4), headshot, muscular, chibi, child, full body, feet, shoes, (realistic:1.3), (3d:1.3), red eyes, front view, facing viewer, (cheerleader:1.2)";

const NEG_CASUAL = "low quality, blurry, deformed, (extra fingers:1.5), (bad hands:1.5), (mutated hands:1.4), (fused fingers:1.4), bad anatomy, text, watermark, signature, worst quality, ugly, tan skin, dark skin, tanned, blonde hair, brown hair, (white hair:1.4), (silver hair:1.4), headshot, muscular, chibi, child, full body, feet, shoes, (realistic:1.3), (3d:1.3), red eyes, (nurse:1.5), (nurse cap:1.4), (red cross:1.4), (medical:1.3), (white dress:1.3)";

const ALL = [
  { id: "cheerleader", base: casualBase, neg: NEG_LIGHT, prompt: "(purple and black cheerleader uniform:1.5), (purple crop top with black trim:1.4), (short purple pleated skirt:1.4), (white pom poms in hands:1.3), bare midriff, energetic" },
  { id: "cheer-extreme", base: casualBase, neg: NEG_LIGHT, prompt: "(tiny black sports bra:1.4), (very short purple cheerleader skirt:1.4), (bare stomach:1.3), (bare midriff:1.3), cheerleader, athletic" },
  { id: "cowgirl", base: casualBase, neg: NEG_LIGHT, prompt: "(wide black cowboy hat:1.5), (brown leather vest:1.4), (denim short shorts:1.4), (large western belt buckle:1.3), western" },
  { id: "nurse", base: casualBase, neg: NEG_LIGHT, prompt: "(short white nurse dress:1.5), (white nurse cap with red cross:1.4), (black latex gloves:1.3), stethoscope around neck" },
  { id: "cow", base: casualBase, neg: NEG_LIGHT, prompt: "(black and white cow print bikini top:1.5), (cow print bikini bottom:1.4), (cow horn headband:1.3), cowbell collar, bare midriff" },
  { id: "bikini-front", base: casualBase, neg: NEG_LIGHT, prompt: "(black string bikini top:1.5), (black bikini bottom:1.4), bare stomach, bare shoulders, lots of pale skin, swimsuit" },
  { id: "neutral", base: demonBase, neg: NEG_DARK, prompt: "(long fitted black dress:1.5), (gothic elegant black gown:1.4), (off-shoulder black dress:1.4), (form-fitting:1.4), (all black outfit:1.3), low neckline, subtle cleavage, black lace details, hands at sides" },
  { id: "formal", base: demonBase, neg: NEG_DARK, prompt: "(long black velvet evening gown:1.4), (long white satin gloves:1.3), (silver diamond necklace:1.2), hair updo, deep neckline, elegant" },
  { id: "vampire", base: demonBase, neg: NEG_DARK, prompt: "(red and black corset:1.4), (long black cape with red satin lining:1.3), (high collar:1.2), gothic tiara, (fangs visible:1.2), red jewelry" },
  { id: "demon", base: demonBase, neg: NEG_DARK, prompt: "(large curved dark horns:1.4), (tight black and red bodysuit:1.3), (small bat wings on back:1.2), pointed tail, pentagram choker" },
  { id: "maid", base: demonBase, neg: NEG_DARK, prompt: "(black maid dress:1.4), (white frilly apron:1.3), (white lace headband:1.2), white lace cuffs, (black stockings with garters:1.2)" },
  { id: "casual", base: nurseBase, neg: NEG_CASUAL, prompt: "(oversized cream knit sweater:1.5), (off-shoulder sweater:1.4), (cable knit:1.3), bare legs, (black thigh-high socks:1.3), no pants, relaxed messy hair" },
  { id: "cheer-extreme-back", base: backBase, neg: NEG_BACK, prompt: "(cheerleader outfit from behind:1.4), (looking back over shoulder:1.4), (short purple skirt:1.3), (black crop top:1.3), (back view:1.4), rear view" },
  { id: "bikini-back", base: backBase, neg: NEG_BACK, prompt: "(from behind:1.5), (looking back over shoulder:1.4), (black string bikini:1.4), (bare back:1.3), (pale skin:1.2), hair flowing, (back view:1.4), rear view, swimsuit" },
];

function img2img(positive, negative, inputImage, seed) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "8": { class_type: "LoadImage", inputs: { image: inputImage } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 30, cfg: 7, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 0.7, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "ticia-picks" } },
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
  console.log("=== Generating 3 variants per outfit (42 total) ===\n");

  const SEEDS = [4001, 7001, 11001]; // 3 different seeds per outfit
  let count = 0;
  const total = ALL.length * SEEDS.length;

  for (const outfit of ALL) {
    const dir = join(OUT_BASE, outfit.id);
    mkdirSync(dir, { recursive: true });

    for (let si = 0; si < SEEDS.length; si++) {
      count++;
      const seed = 131313 + SEEDS[si] + ALL.indexOf(outfit);
      const label = `v${si + 1}`;
      console.log(`[${count}/${total}] ${outfit.id} ${label} (seed ${seed})...`);
      const w = img2img(T + ", " + outfit.prompt, outfit.neg, outfit.base, seed);
      const { prompt_id } = await queue(w);
      const outputs = await waitFor(prompt_id);
      const img = Object.values(outputs).find(o => o.images);
      await dl(img.images[0].filename, join(dir, `${label}.png`));
    }
    console.log(`  ✓ ${outfit.id} done\n`);
  }
  console.log(`\n=== Done! ${count} images generated. ===`);
  console.log("Now run bg removal separately.");
}

main().catch(console.error);
