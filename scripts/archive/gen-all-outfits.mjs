/**
 * Generate outfit variations for Kurisu, Merrick, and Suzuka via txt2img.
 * Full generation (not img2img) for maximum outfit change.
 * Does NOT touch face-* expression files.
 * Run: node scripts/gen-all-outfits.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES_DIR = join(__dirname, "..", "public", "sprites");
const COMFY_URL = "http://localhost:8188";

const NEG = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, missing hand, extra limbs, poorly drawn hands, mutation, bad proportions, background objects";

// Character base descriptions (appearance only, no clothing)
const CHARS = {
  kurisu: {
    base: "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, cowboy shot, makise kurisu, long chestnut auburn wavy hair, hair between eyes, blue violet eyes, slender, medium breasts, looking at viewer, soft shading, clean lineart",
    seed: 626000,
  },
  merrick: {
    base: "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, cowboy shot, dark skin, dark-skinned female, very dark brown skin, chocolate skin, striking emerald green eyes, long flowing black hair, hair past waist, tall statuesque graceful, large breasts, confident mysterious smile, looking at viewer, warm lighting, soft shading, clean lineart",
    seed: 191000,
  },
  nao: {
    base: "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, cowboy shot, short silver-blue bob hair, messy bob cut, hair above shoulders, teal blue eyes, pale fair skin, cute round face, natural blush, rosy cheeks, stylish rectangular glasses, black choker, curvy body, wide hips, large breasts, fit waist, slim waist, hourglass figure, looking at viewer, soft pastel shading, clean lineart",
    seed: 858000,
  },
};

const OUTFITS = [
  { id: "body-casual", prompt: "casual outfit, oversized hoodie, comfortable clothes, relaxed pose" },
  { id: "body-formal", prompt: "elegant evening gown, formal dress, sophisticated, jewelry" },
  { id: "body-school", prompt: "japanese school uniform, sailor collar, navy pleated skirt, school bag" },
  { id: "body-school-skimpy", prompt: "revealing school uniform, very short skirt, unbuttoned white shirt, loose tie" },
  { id: "body-cheerleader", prompt: "cheerleader outfit, crop top, pleated skirt, pom poms, energetic pose" },
  { id: "body-cheer-extreme", prompt: "micro cheerleader, sports bra, very short skirt, athletic, toned" },
  { id: "body-cheer-extreme-back", prompt: "micro cheerleader from behind, looking back over shoulder, short skirt, back view" },
  { id: "body-maid", prompt: "french maid outfit, black dress, white frilly apron, maid headband, thigh highs, cute" },
  { id: "body-vampire", prompt: "vampire costume, gothic dress, cape, fangs, choker, dark elegant" },
  { id: "body-nurse", prompt: "nurse uniform, white dress, red cross, nurse cap, stethoscope" },
  { id: "body-cow", prompt: "cow print bikini, cow horns headband, bell choker, playful pose" },
  { id: "body-cowgirl", prompt: "cowgirl outfit, cowboy hat, white tank top, denim short shorts, country cute" },
  { id: "body-demon", prompt: "demon girl costume, small horns, dark bodysuit, bat wings, choker, succubus cute" },
  { id: "body-bikini-front", prompt: "bikini, string bikini front view, swimsuit, beach, cute pose" },
  { id: "body-bikini-back", prompt: "bikini from behind, looking back over shoulder, string bikini, back view" },
];

function txt2img(positive, negative, w, h, seed) {
  return { prompt: {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "4": { class_type: "EmptyLatentImage", inputs: { width: w, height: h, batch_size: 1 } },
    "5": { class_type: "KSampler", inputs: { seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `outfit-${Date.now()}` } },
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

async function gen(positive, seed, outPath, label) {
  console.log(`  Generating: ${label}...`);
  const { prompt_id } = await queue(txt2img(positive, NEG, 512, 768, seed));
  const outputs = await wait(prompt_id);
  const img = Object.values(outputs).find(o => o.images);
  await dl(img.images[0].filename, outPath);
  console.log(`    Saved: ${outPath}`);
}

async function main() {
  console.log("=== Generating Outfits for Kurisu, Merrick, Suzuka (txt2img) ===\n");

  try { await fetch(`${COMFY_URL}/system_stats`); }
  catch { console.error("ComfyUI not running!"); process.exit(1); }

  for (const [charId, char] of Object.entries(CHARS)) {
    const dir = join(SPRITES_DIR, charId);
    mkdirSync(dir, { recursive: true });
    console.log(`\n--- ${charId} (15 outfits) ---\n`);

    for (let i = 0; i < OUTFITS.length; i++) {
      const outfit = OUTFITS[i];
      const prompt = `${char.base}, ${outfit.prompt}`;
      await gen(prompt, char.seed + i + 1, join(dir, `${outfit.id}.png`), `${charId}/${outfit.id}`);
    }
  }

  // rembg on all outfit files
  console.log("\n--- Removing backgrounds ---");
  const pyPath = "C:/Users/G$/AppData/Local/Programs/Python/Python313/python.exe";
  for (const charId of Object.keys(CHARS)) {
    const sp = join(SPRITES_DIR, charId).replace(/\\/g, "/");
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
  }

  console.log("\n=== Done! 45 outfit images generated + bg removed. ===");
}

main().catch(console.error);
