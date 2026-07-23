/**
 * Merrick outfits via img2img at 0.75 denoise. Sexy like Arisu, no front cloth panel.
 * Run: node scripts/gen-merrick-outfits-v2.mjs
 */
import { writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "merrick");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, extra limbs, poorly drawn hands, mutation, bad proportions, pale skin, fair skin, light skin, hat, headwrap, long skirt, long dress, modest, covered up, front cloth panel, center cloth strip, loincloth, hanging cloth, dangling fabric, crotch cloth, pelvic cloth, waist cloth";
const CHAR = "dark skin, dark-skinned female, very dark brown skin, chocolate skin, striking emerald green eyes, long flowing black hair, hair past waist, large breasts, very sexy, seductive, heavy cleavage, revealing, showing skin, midriff, bare stomach, bare thighs";

const OUTFITS = [
  { id: "body-casual", prompt: `${CHAR}, off shoulder oversized sweater, no pants, bare legs, relaxed seductive`, seed: 101 },
  { id: "body-formal", prompt: `${CHAR}, elegant red evening gown, deep v neckline, thigh high slit, gold jewelry, backless`, seed: 102 },
  { id: "body-school", prompt: `${CHAR}, japanese school uniform, white shirt unbuttoned, cleavage, very short plaid skirt, loose tie, thigh highs`, seed: 103 },
  { id: "body-school-skimpy", prompt: `${CHAR}, micro school uniform, bikini top under open shirt, tiny skirt, bow tie, midriff visible`, seed: 104 },
  { id: "body-cheerleader", prompt: `${CHAR}, cheerleader crop top, bare midriff, very short pleated skirt, thigh highs, pom poms`, seed: 105 },
  { id: "body-cheer-extreme", prompt: `${CHAR}, sports bra only, micro skirt, athletic, toned midriff, cheerleader`, seed: 106 },
  { id: "body-cheer-extreme-back", prompt: `${CHAR}, from behind, looking back over shoulder, sports bra, micro skirt, back view`, seed: 107 },
  { id: "body-maid", prompt: `${CHAR}, gothic maid, strapless black corset top, white frilly mini skirt, maid headdress, white lace, white cuffs, thigh high stockings, garter belt`, seed: 108 },
  { id: "body-vampire", prompt: `${CHAR}, vampire queen, revealing black and red corset, deep cleavage, choker with gem, cape draped off shoulders, fangs, gothic sexy`, seed: 109 },
  { id: "body-nurse", prompt: `${CHAR}, sexy nurse, very short white dress, deep neckline, red cross, nurse cap, thigh highs, stethoscope`, seed: 110 },
  { id: "body-cow", prompt: `${CHAR}, cow print string bikini, cow horns headband, bell choker, playful pose`, seed: 111 },
  { id: "body-cowgirl", prompt: `${CHAR}, cowgirl, cowboy hat, tied plaid shirt showing midriff, denim micro shorts, bare legs`, seed: 112 },
  { id: "body-demon", prompt: `${CHAR}, succubus demon girl, small horns, revealing dark bodysuit, cutouts, bat wings, choker, seductive`, seed: 113 },
  { id: "body-bikini-front", prompt: `${CHAR}, gold string bikini, swimsuit front view, beach, confident sexy pose`, seed: 114 },
  { id: "body-bikini-back", prompt: `${CHAR}, from behind, looking back over shoulder, gold string bikini, back view, beach`, seed: 115 },
];

function img2img(positive, negative, inputImage, seed) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: `masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, cowboy shot, ${positive}, looking at viewer, warm lighting, soft shading, clean lineart`, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "8": { class_type: "LoadImage", inputs: { image: inputImage } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 30, cfg: 8.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 0.75, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `merrick-v2-${Date.now()}` } },
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
  console.log("=== Merrick Outfits v2 (img2img 0.75, sexy, no cloth panel) ===\n");

  copyFileSync(join(SPRITES, "body-neutral.png"), join(COMFY_INPUT, "merrick-outfit-base.png"));

  for (const outfit of OUTFITS) {
    console.log(`  Generating: ${outfit.id}...`);
    const { prompt_id } = await queue(img2img(outfit.prompt, NEG, "merrick-outfit-base.png", 888000 + outfit.seed));
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

  console.log("\n=== Done! 15 Merrick outfits v2 + bg removed. ===");
}

main().catch(console.error);
