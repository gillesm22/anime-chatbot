/**
 * Suzuka/Nao sprite regen — iterative, one at a time.
 *
 * Usage:
 *   node scripts/regen-suzuka.mjs                  → generates body-neutral
 *   node scripts/regen-suzuka.mjs face-happy        → generates one expression
 *   node scripts/regen-suzuka.mjs all-expressions   → generates all 15 expressions from base
 *
 * Outputs go to public/sprites/nao-regen/ so originals are untouched.
 */
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "nao-regen");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

let SUZUKA_SEED = 44458;

const SUZUKA_BASE = [
  "masterpiece, best quality, absurdres, highres, anime style",
  "visual novel sprite, game cg, transparent background, png",
  "(white background:1.4), (simple background:1.3), (no background:1.2), (solo:1.7), (1girl:1.7), (one person:1.5)",
  "(pale skin:1.3), (fair skin:1.2), soft skin",
  "(cowboy shot:1.5), (thighs visible:1.5), (show from head to mid-thigh:1.4), (knees visible:1.3), (head space:1.2), looking at viewer",
  // Hair — dark purple/navy ponytail
  "(dark purple hair:1.5), (dark navy hair:1.3), (purple hair:1.4), (high ponytail:1.4), (long ponytail:1.3)",
  "(side bangs:1.2), (wispy bangs:1.2), (hair between eyes:1.1)",
  // Face — sharp teal eyes, edgy cute
  "(teal eyes:1.5), (blue-green eyes:1.4), (sharp eyes:1.3)",
  "(dark eyeliner:1.2), (long eyelashes:1.2), (pretty face:1.2)",
  "pretty face, mature face, (slight smirk:1.2), (natural expression:1.2)",
  // Body — curvy edgy girl
  "mature female, adult, (curvy:1.2), (thick thighs:1.2), (wide hips:1.2), slender waist",
  "(soft body:1.2), smooth skin",
  // Outfit — cowgirl
  "(cowgirl:1.4), (cowgirl outfit:1.3)",
  "(plaid shirt:1.3), (tied plaid shirt:1.3), (crop top:1.2), (midriff:1.2), (cleavage:1.2)",
  "(denim short shorts:1.3), (daisy dukes:1.3), (frayed:1.2)",
  "(cowboy boots:1.3), (brown boots:1.2)",
  "(cowboy hat:1.3), (black cowboy hat:1.2)",
  "(belt buckle:1.2), (leather belt:1.2)",
  "(black nail polish:1.2)",
  // Accessories
  "(choker:1.3), (pendant choker:1.2)",
  // Nails
  "(black nails:1.2), (dark nail polish:1.2)",
  // Pose
  "(standing:1.4), (hand on hip:1.2), (slight head tilt:1.1), casual stance",
  // Style
  "futaba sakura \\(persona 5\\)",
  "(cel shading:1.2), (anime coloring:1.1), clean lineart, high detail skin, sharp focus, anime style",
].join(", ");

const BASE_NEGATIVE = [
  "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, (multiple girls:1.8), (2girls:1.8), (multiple characters:1.8), (split screen:1.5), (mirror:1.5), (reflection:1.5), (duo:1.5)",
  "signature, worst quality, ugly, duplicate, morbid, mutilated, extra limbs",
  "poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, thumbnails, panels, borders, frames",
  "props, furniture, background objects",
  "(blonde hair:1.4), (silver hair:1.4), (white hair:1.4), (pink hair:1.3)",
  "(tanned skin:1.3), (dark skin:1.3)",
  "(muscular:1.4), (abs:1.4), (toned:1.3), (athletic:1.3), (defined muscles:1.4)",
  "(sitting:1.4), (kneeling:1.4), (crouching:1.4), (leaning:1.3), (bending:1.3)",
  "(close-up:1.4), (portrait:1.4), (face close-up:1.4), (upper body only:1.3), (full body:1.3)",
  "(background:1.3), (grey background:1.3), (gradient background:1.3)",
  "full body, feet, shoes below frame",
  "child, loli, young",
  "(glasses:1.4), (headphones:1.4), (gloves:1.4), (fingerless gloves:1.4)",
  "(chibi:1.5), (doll:1.5), (mask:1.5), (plush:1.4), (toy:1.4), (extra head:1.5), (floating head:1.5)",
].join(", ");

const EXPRESSIONS = {
  "face-happy":      "happy warm smile, bright eyes, genuine joy, rare genuine grin",
  "face-thinking":   "thoughtful expression, eyes looking slightly up, contemplative, finger on chin",
  "face-surprised":  "surprised expression, wide eyes, open mouth, eyebrows raised high, caught off guard",
  "face-sad":        "sad expression, downcast eyes, slight frown, melancholic, subdued, quiet pain",
  "face-smirk":      "confident smirk, one corner of mouth raised, knowing look, half-lidded eyes, found the angle",
  "face-laugh":      "laughing, eyes closed with joy, open mouth, head tilted, rare genuine laugh",
  "face-angry":      "angry expression, furrowed brows, intense glare, tight jaw, genuinely bothered",
  "face-flustered":  "flustered embarrassed, deep blush on cheeks, averted gaze, caught caring",
  "face-devoted":    "rare unguarded warmth, soft gaze, gentle blush, tender small smile",
  "face-teasing":    "playful teasing, sly grin, one eyebrow raised, prodding, mischievous",
  "face-sleepy":     "drowsy sleepy expression, half-closed heavy eyes, yawning, running low",
  "face-excited":    "excited, wide sparkling eyes, big grin, something grabbed her attention",
  "face-shy":        "shy bashful, looking away, deep blush, said something real and regretting it",
  "face-jealous":    "jealous expression, narrowed eyes, side glance, slight pout, possessive",
  "face-crying":     "crying, tears streaming, scrunched eyebrows, something broke through, rare",
};

// ── ComfyUI workflows ──

function txt2imgWorkflow(positive, negative, seed) {
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "illustriousxlMmmix_v80.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "4": { class_type: "EmptyLatentImage", inputs: { width: 832, height: 1216, batch_size: 1 } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps: 40, cfg: 6.5, sampler_name: "dpmpp_2m_sde", scheduler: "karras", denoise: 1,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "suzuka-regen" } },
    },
  };
}

function img2imgWorkflow(positive, negative, inputImage, seed, denoise = 0.58) {
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "illustriousxlMmmix_v80.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "8": { class_type: "LoadImage", inputs: { image: inputImage } },
      "10": { class_type: "ImageScale", inputs: { image: ["8", 0], width: 832, height: 1216, upscale_method: "lanczos", crop: "center" } },
      "9": { class_type: "VAEEncode", inputs: { pixels: ["10", 0], vae: ["1", 2] } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps: 40, cfg: 6.5, sampler_name: "dpmpp_2m_sde", scheduler: "karras", denoise,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "suzuka-regen" } },
    },
  };
}

// ── Helpers ──

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
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outputPath, buffer);
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

// ── Main ──

async function main() {
  const arg = process.argv[2] || "body-neutral";
  mkdirSync(OUTPUT_DIR, { recursive: true });

  try { await fetch(`${COMFY_URL}/system_stats`); }
  catch { console.error("ComfyUI not running at " + COMFY_URL); process.exit(1); }

  if (arg === "body-neutral") {
    console.log(`\n=== Suzuka V2: body-neutral (txt2img, seed ${SUZUKA_SEED}) ===\n`);
    await generate(
      txt2imgWorkflow(SUZUKA_BASE, BASE_NEGATIVE, SUZUKA_SEED),
      join(OUTPUT_DIR, "body-neutral.png"),
      "body-neutral"
    );
    const inputPath = join(COMFY_INPUT, "suzuka-regen-base.png");
    copyFileSync(join(OUTPUT_DIR, "body-neutral.png"), inputPath);
    console.log(`\n  Base copied to ComfyUI input: ${inputPath}`);
    console.log("\n  Review: public/sprites/nao-regen/body-neutral.png\n");

  } else if (arg === "all-expressions") {
    const basePath = join(OUTPUT_DIR, "body-neutral.png");
    if (!existsSync(basePath)) {
      console.error("No body-neutral.png found! Run without args first.");
      process.exit(1);
    }
    console.log("\n=== Suzuka V2: all expressions (img2img, denoise 0.58) ===\n");
    let i = 1;
    for (const [filename, exprPrompt] of Object.entries(EXPRESSIONS)) {
      await generate(
        img2imgWorkflow(
          `${SUZUKA_BASE}, ${exprPrompt}`,
          BASE_NEGATIVE,
          "suzuka-regen-base.png",
          SUZUKA_SEED + i,
          0.58
        ),
        join(OUTPUT_DIR, `${filename}.png`),
        filename
      );
      i++;
    }
    console.log("\n=== Done! All 15 expressions generated. ===\n");

  } else if (EXPRESSIONS[arg]) {
    const basePath = join(OUTPUT_DIR, "body-neutral.png");
    if (!existsSync(basePath)) {
      console.error("No body-neutral.png found! Run without args first.");
      process.exit(1);
    }
    const i = Object.keys(EXPRESSIONS).indexOf(arg) + 1;
    console.log(`\n=== Suzuka V2: ${arg} (img2img, denoise 0.58) ===\n`);
    await generate(
      img2imgWorkflow(
        `${SUZUKA_BASE}, ${EXPRESSIONS[arg]}`,
        BASE_NEGATIVE,
        "suzuka-regen-base.png",
        SUZUKA_SEED + i,
        0.58
      ),
      join(OUTPUT_DIR, `${arg}.png`),
      arg
    );
    console.log(`\n  Review: public/sprites/nao-regen/${arg}.png\n`);

  } else {
    console.error(`Unknown arg: "${arg}"`);
    console.error("Valid: body-neutral, all-expressions, or one of:");
    console.error("  " + Object.keys(EXPRESSIONS).join(", "));
    process.exit(1);
  }
}

main().catch(console.error);
