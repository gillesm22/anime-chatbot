/**
 * Kurisu outfits via img2img at 0.72 denoise (consistent angle, sexy like Arisu).
 * Run: node scripts/gen-kurisu-outfits-v2.mjs
 */
import { writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "kurisu");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, extra limbs, poorly drawn hands, mutation, bad proportions, modest, covered up, flat chest";
const CHAR = "long chestnut auburn wavy hair, blue violet eyes, sexy, seductive";

const OUTFITS = [
  { id: "body-casual", prompt: `${CHAR}, cleavage, oversized hoodie falling off shoulder, bare shoulder, short shorts, relaxed seductive pose`, seed: 101 },
  { id: "body-formal", prompt: `${CHAR}, cleavage, elegant black evening gown, deep v neckline, thigh slit, jewelry, sophisticated sexy`, seed: 102 },
  { id: "body-school", prompt: `${CHAR}, japanese school uniform, white shirt slightly unbuttoned, cleavage, short plaid skirt, loose tie, thigh highs`, seed: 103 },
  { id: "body-school-skimpy", prompt: `${CHAR}, revealing school uniform, bikini top under open shirt, very short skirt, bow tie, cleavage, midriff`, seed: 104 },
  { id: "body-cheerleader", prompt: `${CHAR}, cleavage, revealing cheerleader outfit, crop top, midriff, very short pleated skirt, thigh highs`, seed: 105 },
  { id: "body-cheer-extreme", prompt: `${CHAR}, cleavage, micro cheerleader, sports bra, very short skirt, midriff, athletic sexy`, seed: 106 },
  { id: "body-cheer-extreme-back", prompt: `${CHAR}, from behind, looking back over shoulder, micro cheerleader, sports bra, very short skirt, back view`, seed: 107 },
  { id: "body-maid", prompt: `${CHAR}, cleavage, revealing french maid outfit, short black maid dress, white frilly apron, maid headband, thigh highs, garter belt`, seed: 108 },
  { id: "body-vampire", prompt: `${CHAR}, cleavage, gothic vampire dress, off shoulder, corset, choker, cape, fangs, dark elegant sexy`, seed: 109 },
  { id: "body-nurse", prompt: `${CHAR}, cleavage, sexy nurse uniform, short white dress, red cross, nurse cap, thigh highs`, seed: 110 },
  { id: "body-cow", prompt: `${CHAR}, cow print bikini, cow horns headband, bell choker, cleavage, midriff, playful`, seed: 111 },
  { id: "body-cowgirl", prompt: `${CHAR}, cleavage, cowgirl outfit, cowboy hat, tied up plaid shirt, midriff, denim short shorts`, seed: 112 },
  { id: "body-demon", prompt: `${CHAR}, cleavage, demon girl, small horns, revealing dark bodysuit, bat wings, choker, succubus sexy`, seed: 113 },
  { id: "body-bikini-front", prompt: `${CHAR}, string bikini, cleavage, swimsuit front view, beach, sexy pose`, seed: 114 },
  { id: "body-bikini-back", prompt: `${CHAR}, from behind, looking back over shoulder, string bikini, back view, beach`, seed: 115 },
];

function img2img(positive, negative, inputImage, seed) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: `masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, cowboy shot, ${positive}, looking at viewer, soft shading, clean lineart`, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "8": { class_type: "LoadImage", inputs: { image: inputImage } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 0.72, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0] } },
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

async function main() {
  console.log("=== Kurisu Outfits v2 (img2img 0.72, sexy, consistent angle) ===\n");

  copyFileSync(join(SPRITES, "body-neutral.png"), join(COMFY_INPUT, "kurisu-outfit-base.png"));

  for (const outfit of OUTFITS) {
    console.log(`  Generating: ${outfit.id}...`);
    const { prompt_id } = await queue(img2img(outfit.prompt, NEG, "kurisu-outfit-base.png", 999000 + outfit.seed));
    const outputs = await wait(prompt_id);
    const img = Object.values(outputs).find(o => o.images);
    await dl(img.images[0].filename, join(SPRITES, `${outfit.id}.png`));
    console.log(`    Saved: ${outfit.id}.png`);
  }

  console.log("\n--- Removing backgrounds ---");
  const pyPath = "C:/Users/G$/AppData/Local/Programs/Python/Python313/python.exe";
  const sp = SPRITES.replace(/\\/g, "/");
  execSync(`"${pyPath}" -c "
from rembg import remove
from PIL import Image
import glob
for path in glob.glob('${sp}/body-*.png'):
    if 'neutral' in path: continue
    img = Image.open(path)
    out = remove(img)
    out.save(path)
    print(f'  bg removed: {path.split(chr(47))[-1]}')
"`, { stdio: "inherit" });

  console.log("\n=== Done! 15 Kurisu outfits v2 + bg removed. ===");
}

main().catch(console.error);
