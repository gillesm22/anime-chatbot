/**
 * Marin outfits v2 - max exposure on spicy outfits.
 * Run: node scripts/gen-marin-outfits-v2.mjs
 */
import { writeFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES = join(__dirname, "..", "public", "sprites", "marin");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const CHAR = "long voluminous black wavy hair, hair past waist, bright amber eyes, honey eyes, sun-kissed golden-brown tanned skin, dark skin, gyaru, curvy body, wide hips, large breasts, thick thighs";
const SEXY = `${CHAR}, very sexy, seductive, (heavy cleavage:1.3), revealing, showing skin, midriff, bare stomach, bare thighs`;
const MAX = `${CHAR}, (maximum exposure:1.4), extremely sexy, seductive, (extreme cleavage:1.4), bare stomach, bare thighs, bare shoulders, maximum skin, extremely skimpy`;
const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, extra limbs, poorly drawn hands, mutation, bad proportions, hat, headwrap, red eyes, blue eyes, artifacts, lines, (white crop top:1.3), (white shorts:1.3), (white thigh highs:1.3), modest, covered up";

const OUTFITS = [
  { id: "body-casual", prompt: `${SEXY}, off shoulder oversized hoodie, no pants, bare legs, relaxed seductive`, seed: 101, d: 0.72 },
  { id: "body-formal", prompt: `${SEXY}, elegant gold evening gown, deep v neckline, thigh high slit, jewelry, backless`, seed: 102, d: 0.72 },
  { id: "body-school", prompt: `${SEXY}, japanese school uniform, white shirt unbuttoned, cleavage, very short plaid skirt, loose tie, thigh highs`, seed: 103, d: 0.72 },
  { id: "body-school-skimpy", prompt: `${MAX}, (revealing school uniform:1.3), (bikini top under open white shirt:1.4), (micro plaid skirt:1.4), loose tie, bare stomach, thigh highs`, seed: 104, d: 0.8 },
  { id: "body-cheerleader", prompt: `${SEXY}, cheerleader crop top, bare midriff, very short pleated skirt, pom poms, thigh highs`, seed: 105, d: 0.72 },
  { id: "body-cheer-extreme", prompt: `${MAX}, (tiny sports bra:1.4), (micro pleated skirt:1.4), bare arms, bare shoulders, pom poms, cheerleader`, seed: 106, d: 0.8 },
  { id: "body-cheer-extreme-back", prompt: `${CHAR}, very sexy, (from behind:1.5), (looking back over shoulder:1.3), tiny sports bra, micro skirt, back view`, seed: 107, d: 0.74 },
  { id: "body-maid", prompt: `${SEXY}, gothic maid outfit, strapless black corset top, white frilly mini skirt, maid headdress, white lace, white cuffs, thigh high stockings, garter belt`, seed: 108, d: 0.72 },
  { id: "body-vampire", prompt: `${MAX}, (vampire:1.3), (strapless black and red corset:1.3), (red lacing:1.2), ruby choker, bare shoulders, bare stomach, midriff, (black thong:1.3), bare thighs, thigh high boots, fangs, cape behind, dark gothic`, seed: 109, d: 0.8 },
  { id: "body-nurse", prompt: `${MAX}, (sexy nurse:1.3), (micro white nurse dress:1.3), deep neckline, red cross, nurse cap, thigh highs, stethoscope`, seed: 110, d: 0.8 },
  { id: "body-cow", prompt: `${MAX}, (cow print micro string bikini:1.5), (cow pattern:1.4), (black and white spots:1.3), cow horns headband, (golden bell choker:1.3)`, seed: 111, d: 0.8 },
  { id: "body-cowgirl", prompt: `${SEXY}, cowgirl, cowboy hat, tied plaid shirt showing midriff, denim micro shorts, bare legs`, seed: 112, d: 0.72 },
  { id: "body-demon", prompt: `${MAX}, (succubus demon girl:1.3), small horns, (revealing dark bodysuit:1.3), cutouts, bat wings, choker, seductive`, seed: 113, d: 0.8 },
  { id: "body-bikini-front", prompt: `${MAX}, (orange micro string bikini only:1.5), (tiny bikini top:1.4), (string bikini bottom:1.4), gold body chain`, seed: 114, d: 0.8 },
  { id: "body-bikini-back", prompt: `${CHAR}, (maximum exposure:1.4), extremely sexy, (from behind:1.5), (looking back over shoulder:1.3), (orange string bikini:1.4), (thong:1.3), bare back, bare shoulders, bare thighs`, seed: 115, d: 0.8 },
  { id: "body-back", prompt: `${CHAR}, (from behind:1.5), (back turned:1.4), (looking back over shoulder:1.3), white crop top, denim shorts, bare shoulders, confident`, seed: 116, d: 0.74 },
];

function img2img(positive, negative, seed, denoise, cfg) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: `masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, cowboy shot, ${positive}, looking at viewer, warm lighting, soft shading, clean lineart`, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "8": { class_type: "LoadImage", inputs: { image: "marin-outfit-base.png" } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 35, cfg, sampler_name: "euler_ancestral", scheduler: "normal", denoise, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `marin-v2-${Date.now()}` } },
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
  console.log("=== Marin Outfits v2 (max exposure on spicy) ===\n");

  copyFileSync(join(SPRITES, "body-neutral.png"), join(COMFY_INPUT, "marin-outfit-base.png"));

  for (const outfit of OUTFITS) {
    console.log(`  Generating: ${outfit.id}...`);
    const isBack = outfit.id.includes("back");
    const neg = isBack ? NEG + ", (front view:1.4), (facing forward:1.4)" : NEG;
    const cfg = outfit.d >= 0.8 ? 10 : 9.5;
    const { prompt_id } = await queue(img2img(outfit.prompt, neg, 333000 + outfit.seed, outfit.d, cfg));
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

  console.log("\n=== Done! 16 Marin outfits v2 + bg removed. ===");
}

main().catch(console.error);
