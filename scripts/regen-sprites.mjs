/**
 * Regenerate Kurisu + Merrick sprites with consistent bodies.
 * Strategy: Generate body-neutral with a fixed seed, then use img2img
 * (low denoise) from that base to create expression variants.
 * This keeps body/pose/outfit identical across all expressions.
 *
 * Run: node scripts/regen-sprites.mjs
 */
import { writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES_DIR = join(__dirname, "..", "public", "sprites");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const BASE_NEGATIVE = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, duplicate, morbid, mutilated, extra limbs, poorly drawn face, mutation, bad proportions, reference sheet, multiple views, character sheet, turnaround, expression sheet, collage, grid, thumbnails, panels, borders, frames, props, furniture, pedestal, column, pillar, statue, chair, table, background objects, magic circle, halo, aura, glowing background, ornate frame, full body, feet, shoes, boots, legs below thigh";

// ── Kurisu Makise (Steins;Gate) ──
const KURISU_BASE = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, makise kurisu, steins gate, long chestnut hair, auburn hair, wavy hair, hair between eyes, blue eyes, violet eyes, white lab coat, white collared shirt, red necktie, slender, medium breasts, looking at viewer, soft shading, clean lineart";
const KURISU_SEED = 424242;

// ── Merrick Mayfair (Anne Rice) ──
const MERRICK_BASE = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, rich dark brown skin, ethereal glow, glowing skin, striking emerald green eyes, glowing green eyes, long flowing black hair, dark purple undertones in hair, purple highlights, hair past waist, elegant dark clothing, fitted black dress, dark corset, dark lace, gold and jade jewelry, jade pendant necklace, occult symbol necklace, gold earrings, tall statuesque graceful, large breasts, looking at viewer, vampire witch, dark gothic beauty, otherworldly beauty, supernatural, soft shading, clean lineart";
const MERRICK_SEED = 131313;

const EXPRESSIONS = {
  "face-happy":      "happy warm smile, bright eyes, genuine joy",
  "face-thinking":   "thoughtful expression, eyes looking slightly up, contemplative",
  "face-surprised":  "surprised expression, wide eyes, slightly open mouth",
  "face-sad":        "sad expression, downcast eyes, slight frown, melancholic",
  "face-smirk":      "confident smirk, one corner of mouth raised, knowing look",
  "face-laugh":      "laughing expression, eyes closed with joy, open mouth smile",
  "face-angry":      "angry expression, furrowed brows, intense glare, tight jaw",
  "face-flustered":  "flustered embarrassed expression, deep blush on cheeks, averted gaze",
  "face-devoted":    "deeply loving tender expression, warm soft gaze, gentle blush, adoring smile",
  "face-teasing":    "playful teasing expression, sly grin, one eyebrow raised, mischievous",
  "face-sleepy":     "drowsy sleepy expression, half-closed eyes, peaceful",
  "face-excited":    "excited enthusiastic expression, wide sparkling eyes, big bright grin",
  "face-shy":        "shy bashful expression, looking away, deep blush, hand near face",
  "face-jealous":    "jealous expression, narrowed eyes, side glance, slight pout",
  "face-crying":     "crying expression, tears streaming, scrunched eyebrows, emotional",
};

// ── txt2img workflow (for body-neutral) ──
function txt2imgWorkflow(positive, negative, width, height, seed) {
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "4": { class_type: "EmptyLatentImage", inputs: { width, height, batch_size: 1 } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `regen-${Date.now()}` } },
    },
  };
}

// ── img2img workflow (expression variants from base image) ──
function img2imgWorkflow(positive, negative, inputImage, width, height, seed, denoise = 0.45) {
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "8": { class_type: "LoadImage", inputs: { image: inputImage } },
      "9": { class_type: "VAEEncode", inputs: { pixels: ["8", 0], vae: ["1", 2] } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `regen-${Date.now()}` } },
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
      console.error("  ERROR in generation:", JSON.stringify(data[promptId].status));
      throw new Error("Generation failed");
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Timeout waiting for ${promptId}`);
}

async function downloadImage(filename, outputPath) {
  const res = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outputPath, buffer);
  return outputPath;
}

async function generate(workflow, outputPath, label) {
  console.log(`  Generating: ${label}...`);
  const { prompt_id } = await queuePrompt(workflow);
  console.log(`    Queued: ${prompt_id}`);
  const outputs = await waitForCompletion(prompt_id);
  const saveNode = Object.values(outputs).find((o) => o.images);
  if (!saveNode?.images?.[0]) throw new Error("No output image");
  await downloadImage(saveNode.images[0].filename, outputPath);
  console.log(`    Saved: ${outputPath}`);
}

async function generateCharacter(name, basePrompt, seed, dir) {
  mkdirSync(dir, { recursive: true });

  // Step 1: Generate body-neutral with fixed seed (txt2img)
  const neutralPath = join(dir, "body-neutral.png");
  console.log(`\n--- ${name}: body-neutral (txt2img, seed ${seed}) ---\n`);
  await generate(
    txt2imgWorkflow(basePrompt, BASE_NEGATIVE, 512, 768, seed),
    neutralPath,
    `${name}/body-neutral`
  );

  // Step 2: Copy body-neutral to ComfyUI input dir for img2img
  const inputFilename = `${name.toLowerCase()}-base.png`;
  const inputPath = join(COMFY_INPUT, inputFilename);
  copyFileSync(neutralPath, inputPath);
  console.log(`  Copied base to ComfyUI input: ${inputPath}`);

  // Step 3: Generate each expression via img2img from the neutral base
  // Using denoise 0.45 = keeps body/outfit intact, changes face expression
  console.log(`\n--- ${name}: expression variants (img2img, denoise 0.45) ---\n`);
  for (const [filename, exprPrompt] of Object.entries(EXPRESSIONS)) {
    const exprPath = join(dir, `${filename}.png`);
    await generate(
      img2imgWorkflow(
        `${basePrompt}, ${exprPrompt}`,
        BASE_NEGATIVE,
        inputFilename,
        512, 768,
        seed + Object.keys(EXPRESSIONS).indexOf(filename) + 1,
        0.45
      ),
      exprPath,
      `${name}/${filename}`
    );
  }
}

async function main() {
  console.log("=== Canon-Accurate Sprite Regen (img2img consistency) ===\n");

  try { await fetch(`${COMFY_URL}/system_stats`); }
  catch { console.error("ComfyUI not running!"); process.exit(1); }

  await generateCharacter("Kurisu", KURISU_BASE, KURISU_SEED, join(SPRITES_DIR, "kurisu"));
  await generateCharacter("Merrick", MERRICK_BASE, MERRICK_SEED, join(SPRITES_DIR, "merrick"));

  console.log("\n=== Done! 32 images generated (2 bases + 30 expressions). ===");
}

main().catch(console.error);
