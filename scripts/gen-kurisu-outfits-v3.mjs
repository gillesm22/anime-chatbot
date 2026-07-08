/**
 * Kurisu outfits v3: Suzuka v2 formula — high CFG, variable denoise, weighted prompts, anti-bleed.
 * Run: node scripts/gen-kurisu-outfits-v3.mjs
 */
import { writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "kurisu");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const CHAR = "(blue violet eyes:1.3), (long chestnut auburn wavy hair:1.2), hair between eyes, sharp eyes, athletic body, toned, medium-large breasts, fit waist, slim waist, defined figure";
const SEXY = `${CHAR}, very sexy, seductive, heavy cleavage, revealing, showing skin, midriff, bare stomach, bare thighs`;
const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, extra limbs, poorly drawn hands, mutation, bad proportions, (white lab coat:1.3), (red necktie:1.3), (white collared shirt:1.3), (black shorts:1.3), modest, covered up";

const OUTFITS = [
  { id: "body-casual", prompt: `${SEXY}, off shoulder oversized sweater, no pants, bare legs, relaxed seductive`, seed: 101 },
  { id: "body-formal", prompt: `${SEXY}, elegant black evening gown, (deep v neckline:1.3), thigh slit, pearl earrings, sophisticated`, seed: 102 },
  { id: "body-school", prompt: `${SEXY}, japanese school uniform, white shirt unbuttoned, cleavage, (very short plaid skirt:1.2), loose tie, thigh highs`, seed: 103 },
  { id: "body-school-skimpy", prompt: `${SEXY}, revealing school uniform, (bikini top under open white shirt:1.3), micro plaid skirt, bow tie, midriff`, seed: 104 },
  { id: "body-cheerleader", prompt: `${SEXY}, cheerleader crop top, bare midriff, (very short pleated skirt:1.2), pom poms, thigh highs`, seed: 105 },
  { id: "body-cheer-extreme", prompt: `${SEXY}, (tiny red sports bra:1.3), (micro red pleated skirt:1.3), bare arms, bare shoulders, maximum skin, pom poms`, seed: 106 },
  { id: "body-cheer-extreme-back", prompt: `${CHAR}, very sexy, from behind, looking back over shoulder, tiny sports bra, micro skirt, back view`, seed: 107 },
  { id: "body-maid", prompt: `${SEXY}, gothic maid outfit, (strapless black corset top:1.2), white frilly mini skirt, maid headdress, white lace, thigh high stockings, garter belt`, seed: 108 },
  { id: "body-vampire", prompt: `${SEXY}, vampire, (black and red gothic corset:1.2), deep cleavage, choker with gem, cape behind, fangs, bare shoulders, bare thighs`, seed: 109 },
  { id: "body-nurse", prompt: `${SEXY}, sexy nurse, (very short white dress:1.2), deep neckline, red cross, nurse cap, thigh highs`, seed: 110 },
  { id: "body-cow", prompt: `${SEXY}, (cow print micro string bikini:1.5), (cow pattern:1.4), (black and white spots:1.3), cow horns headband, golden bell choker, maximum skin, extremely skimpy`, seed: 111 },
  { id: "body-cowgirl", prompt: `${SEXY}, cowgirl, cowboy hat, (tied plaid shirt showing midriff:1.2), denim micro shorts, bare legs`, seed: 112 },
  { id: "body-demon", prompt: `${SEXY}, succubus demon girl, small horns, (revealing dark bodysuit:1.2), cutouts, bat wings, choker, seductive`, seed: 113 },
  { id: "body-bikini-front", prompt: `${SEXY}, (red micro string bikini only:1.5), (tiny bikini top:1.4), (string bikini bottom:1.4), bare stomach, bare shoulders, maximum skin, extremely skimpy`, seed: 114 },
  { id: "body-bikini-back", prompt: `${CHAR}, very sexy, seductive, (from behind:1.5), (looking back over shoulder:1.3), (red string bikini:1.4), (thong:1.3), bare back, bare shoulders, bare thighs`, seed: 115 },
  { id: "body-back", prompt: `${CHAR}, (from behind:1.5), (back turned:1.4), (looking back over shoulder:1.3), white lab coat, red necktie, black shorts, confident`, seed: 116 },
];

function img2img(positive, negative, seed, denoise, cfg) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: `masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, cowboy shot, ${positive}, looking at viewer, warm lighting, soft shading, clean lineart`, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "8": { class_type: "LoadImage", inputs: { image: "kurisu-v2-outfit-base.png" } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 35, cfg, sampler_name: "euler_ancestral", scheduler: "normal", denoise, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `kurisu-v3-${Date.now()}` } },
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
  console.log("=== Kurisu Outfits v3 (Suzuka formula: 35 steps, high CFG, variable denoise) ===\n");

  copyFileSync(join(SPRITES, "body-neutral.png"), join(COMFY_INPUT, "kurisu-v2-outfit-base.png"));

  for (const outfit of OUTFITS) {
    console.log(`  Generating: ${outfit.id}...`);
    const isBack = outfit.id.includes("back");
    const isExtreme = outfit.id === "body-cow" || outfit.id === "body-bikini-front";
    const neg = isBack ? NEG + ", (front view:1.4), (facing forward:1.4)" : NEG;
    const denoise = isExtreme ? 0.8 : isBack ? 0.74 : 0.72;
    const cfg = isExtreme ? 10 : 9.5;
    const { prompt_id } = await queue(img2img(outfit.prompt, neg, 626000 + outfit.seed, denoise, cfg));
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

  console.log("\n=== Done! 16 Kurisu outfits v3 + bg removed. ===");
}

main().catch(console.error);
