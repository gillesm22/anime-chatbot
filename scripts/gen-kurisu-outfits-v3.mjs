/**
 * Kurisu outfits v3: IllustriousXL MMMix v80, high CFG, variable denoise, weighted prompts, anti-bleed.
 * Same model/sampler/resolution as Suzuka's winning regen.
 * Run: node scripts/gen-kurisu-outfits-v3.mjs
 */
import { writeFileSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "kurisu-regen");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

// Exact identity match from the winning body-neutral
const CHAR = [
  "(pale skin:1.3), (fair skin:1.2), soft skin",
  "(dark red-brown hair:1.5), (reddish brown hair:1.4), (chestnut hair:1.3), (long hair:1.3), (hair between eyes:1.2)",
  "(hair past shoulders:1.3), (slight wavy hair:1.2)",
  "(dark violet eyes:1.5), (deep purple eyes:1.4), (sharp eyes:1.3)",
  "(dark eyelashes:1.2), (long eyelashes:1.2), (pretty face:1.2)",
  "pretty face, mature face",
  "mature female, adult, (athletic:1.2), (toned:1.2), (medium-large breasts:1.2), slender waist, (fit body:1.2), smooth skin",
].join(", ");

const SEXY = `${CHAR}, very sexy, seductive, (heavy cleavage:1.3), revealing, showing skin, (midriff:1.2), bare stomach, bare thighs`;

const BASE_NEGATIVE = [
  "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, (multiple girls:1.8), (2girls:1.8), (multiple characters:1.8), (split screen:1.5), (mirror:1.5), (reflection:1.5), (duo:1.5)",
  "signature, worst quality, ugly, duplicate, morbid, mutilated, extra limbs",
  "poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, thumbnails, panels, borders, frames",
  "props, furniture, background objects",
  "(white lab coat:1.6), (lab coat:1.5), (red necktie:1.5), (white collared shirt:1.5), (black shorts:1.5), (white coat:1.4)",
  "modest, covered up, cropped head, head out of frame",
  "(blonde hair:1.4), (silver hair:1.4), (white hair:1.4), (pink hair:1.3), (orange hair:1.4), (ginger hair:1.3), (blue eyes:1.3), (pink eyes:1.4), (magenta eyes:1.4), (red eyes:1.4)",
  "(tanned skin:1.3), (dark skin:1.3)",
  "(glasses:1.5), (sunglasses:1.4)",
  "child, loli, young",
  "(chibi:1.5), (doll:1.5), (mask:1.5), (plush:1.4), (toy:1.4), (extra head:1.5), (floating head:1.5)",
].join(", ");

const OUTFITS = [
  { id: "body-casual", prompt: `${SEXY}, off shoulder oversized sweater, no pants, bare legs, relaxed seductive`, seed: 101 },
  { id: "body-formal", prompt: `${SEXY}, elegant black evening gown, (deep v neckline:1.3), thigh slit, pearl earrings, sophisticated`, seed: 102 },
  { id: "body-school", prompt: `${SEXY}, japanese school uniform, white shirt unbuttoned, cleavage, (very short plaid skirt:1.2), loose tie, thigh highs`, seed: 303 },
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
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "illustriousxlMmmix_v80.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: `masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, (white background:1.4), (simple background:1.3), (solo:1.7), (1girl:1.7), (pale skin:1.3), (fair skin:1.2), (cowboy shot:1.5), (thighs visible:1.5), (show from head to mid-thigh:1.4), (head space:1.2), ${positive}, looking at viewer, (cel shading:1.2), (anime coloring:1.1), clean lineart, high detail skin, sharp focus, anime style`, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "8": { class_type: "LoadImage", inputs: { image: "kurisu-v2-outfit-base.png" } },
      "10": { class_type: "ImageScale", inputs: { image: ["8", 0], width: 832, height: 1216, upscale_method: "lanczos", crop: "center" } },
      "9": { class_type: "VAEEncode", inputs: { pixels: ["10", 0], vae: ["1", 2] } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps: 40, cfg, sampler_name: "dpmpp_2m_sde", scheduler: "karras", denoise,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `kurisu-v3-${Date.now()}` } },
    },
  };
}

async function queuePrompt(workflow) {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workflow),
  });
  if (!res.ok) throw new Error(`Queue failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function waitForCompletion(promptId, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    const data = await res.json();
    if (data[promptId]?.outputs) return data[promptId].outputs;
    if (data[promptId]?.status?.status_str === "error") {
      throw new Error("Generation failed: " + JSON.stringify(data[promptId].status));
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Timeout waiting for ${promptId}`);
}

async function downloadImage(filename, outputPath) {
  const res = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  writeFileSync(outputPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const arg = process.argv[2];
  console.log("=== Kurisu Outfits v3 (IllustriousXL MMMix v80, 832x1216, dpmpp_2m_sde/karras) ===\n");

  const basePath = join(SPRITES, "body-neutral.png");
  if (!existsSync(basePath)) {
    console.error("No body-neutral.png in kurisu-regen/! Run regen-kurisu-v2.mjs first.");
    process.exit(1);
  }

  try { await fetch(`${COMFY_URL}/system_stats`); }
  catch { console.error("ComfyUI not running at " + COMFY_URL); process.exit(1); }

  copyFileSync(basePath, join(COMFY_INPUT, "kurisu-v2-outfit-base.png"));

  const outfitsToGen = arg
    ? OUTFITS.filter(o => o.id === arg || o.id === `body-${arg}`)
    : OUTFITS;

  if (arg && outfitsToGen.length === 0) {
    console.error(`Unknown outfit: "${arg}". Valid: ${OUTFITS.map(o => o.id).join(", ")}`);
    process.exit(1);
  }

  for (const outfit of outfitsToGen) {
    console.log(`  Generating: ${outfit.id}...`);
    const isBack = outfit.id.includes("back");
    const isExtreme = outfit.id === "body-cow" || outfit.id === "body-bikini-front";
    const neg = isBack ? BASE_NEGATIVE + ", (front view:1.4), (facing forward:1.4)" : BASE_NEGATIVE;
    const denoise = isExtreme ? 0.72 : isBack ? 0.62 : 0.58;
    const cfg = isExtreme ? 10 : 9.5;
    const { prompt_id } = await queuePrompt(img2img(outfit.prompt, neg, 444000 + outfit.seed, denoise, cfg));
    const outputs = await waitForCompletion(prompt_id);
    const saveNode = Object.values(outputs).find((o) => o.images);
    if (!saveNode?.images?.[0]) throw new Error("No output image");
    await downloadImage(saveNode.images[0].filename, join(SPRITES, `${outfit.id}.png`));
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
