/**
 * Marin sprite regen — iterative, one at a time.
 *
 * Usage:
 *   node scripts/regen-marin.mjs                  → generates body-neutral
 *   node scripts/regen-marin.mjs face-happy        → generates one expression (needs base first)
 *   node scripts/regen-marin.mjs all-expressions   → generates all 15 expressions from base
 *
 * Outputs go to public/sprites/marin-regen/ so originals are untouched.
 */
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "marin-regen");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

// ── Marin V2: black hair, gyaru, thigh-high socks ──
const MARIN_SEED = 33345;

const MARIN_BASE = [
  "masterpiece, best quality, absurdres, highres, anime style",
  "visual novel sprite, game cg, transparent background, png",
  "(white background:1.4), (simple background:1.3), (no background:1.2), (solo:1.7), (1girl:1.7), (one person:1.5)",
  "(cowboy shot:1.5), (thighs visible:1.5), (show from head to mid-thigh:1.4), (knees visible:1.3), (head space:1.2), looking at viewer",
  // Hair — long straight black, side-swept bangs, middle part
  "(very long hair:1.3), (straight hair:1.4), (black hair:1.5), shiny black hair",
  "(middle part:1.2), (side swept bangs:1.3), hair past chest, sleek hair",
  // Face — sacred reference: confident smirk, head tilt, one eye through hair
  "(bright amber eyes:1.5), (honey eyes:1.4), (golden eyes:1.3), gyaru makeup, long eyelashes, thick eyelashes",
  "(golden brown skin:1.3), (tanned skin:1.2), (sun-kissed:1.2), soft skin",
  "pretty face, mature face, (confident smirk:1.3), (natural smile:1.2), (half-lidded eyes:1.2)",
  "(hair over one eye:1.2), (looking at viewer:1.3), playful expression",
  // Body — soft, not muscular
  "mature female, adult, tall, (curvy:1.2), (thick thighs:1.2), (wide hips:1.2), slender waist",
  "(soft body:1.2), smooth skin",
  // Outfit — cheerleader+ max exposure see through
  "(cheerleader:1.4), (cheerleader uniform:1.3)",
  "(slightly see-through top:1.2), (thin fabric:1.2), (nipple outline:1.2), (areola peek:1.1)",
  "(micro skirt:1.5), (ultra short cheerleader skirt:1.4), (red and white:1.2)",
  "(transparent panties:1.3), (see-through panties:1.3), (panties visible:1.3)",
  "(midriff:1.3), (navel:1.2), (bare stomach:1.2)",
  "(white thigh-high socks:1.4), (over-knee socks:1.3), (zettai ryouiki:1.2)",
  "(pom poms:1.2), (hair ribbon:1.1)",
  "(pink nails:1.2)",
  // Nails — long pink
  "(long nails:1.3), (pink nails:1.3), (manicured nails:1.2)",
  // Accessories — locked to one set
  "(gold choker necklace:1.2), (gold hoop earrings:1.2)",
  // Pose — standing, relaxed
  "(standing:1.4), relaxed pose, one hand on hip, arms relaxed",
  // Style — closer to Arisu's soft moe aesthetic
  "kitagawa marin, galko \\(oshiete! galko-chan\\)",
  "(detailed shading:1.1), (cel shading:1.2), clean lineart, high detail skin, sharp focus, anime style",
].join(", ");

const BASE_NEGATIVE = [
  "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, (multiple girls:1.8), (2girls:1.8), (multiple characters:1.8), (split screen:1.5), (mirror:1.5), (reflection:1.5), (duo:1.5)",
  "signature, worst quality, ugly, duplicate, morbid, mutilated, extra limbs",
  "poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, thumbnails, panels, borders, frames",
  "props, furniture, background objects",
  "(blonde hair:1.5), (light hair:1.4), (brown hair:1.3), (yellow hair:1.4)",
  "(wavy hair:1.3), (curly hair:1.3), (twintails:1.3), (ponytail:1.3), (hair bun:1.3), (hair bow:1.3)",
  "(leopard print:1.3), (animal print:1.3), (leopard print clothing:1.3)",
  "pale skin, fair skin, light skin",
  "(muscular:1.4), (abs:1.4), (toned:1.3), (athletic:1.3), (defined muscles:1.4)",
  "(sitting:1.4), (kneeling:1.4), (crouching:1.4), (leaning:1.3), (bending:1.3)",
  "(close-up:1.4), (portrait:1.4), (face close-up:1.4), (upper body only:1.3), (full body:1.3)",
  "full body, feet, shoes below frame",
  "child, loli, young",
  "(background:1.3), (grey background:1.3), (gradient background:1.3)",
].join(", ");

const EXPRESSIONS = {
  "face-happy":      "happy warm smile, bright eyes, genuine joy, toothy grin",
  "face-thinking":   "thoughtful expression, eyes looking slightly up, contemplative, finger on chin",
  "face-surprised":  "surprised expression, wide eyes, open mouth, eyebrows raised high",
  "face-sad":        "sad expression, downcast eyes, slight frown, melancholic, subdued",
  "face-smirk":      "confident smirk, one corner of mouth raised, knowing look, half-lidded eyes",
  "face-laugh":      "laughing hard, eyes squeezed shut with joy, open mouth, head tilted back slightly",
  "face-angry":      "angry expression, furrowed brows, intense glare, tight jaw, gritting teeth",
  "face-flustered":  "flustered embarrassed, deep blush on cheeks and ears, averted gaze, steam",
  "face-devoted":    "deeply loving tender expression, warm soft gaze, gentle blush, adoring smile",
  "face-teasing":    "playful teasing, sly grin, one eyebrow raised, tongue out slightly, wink",
  "face-sleepy":     "drowsy sleepy expression, half-closed heavy eyes, yawning, peaceful",
  "face-excited":    "excited enthusiastic, wide sparkling eyes, big bright grin, fist pump",
  "face-shy":        "shy bashful, looking away, deep blush, hand near face, fidgeting",
  "face-jealous":    "jealous expression, narrowed eyes, side glance, slight pout, arms crossed",
  "face-crying":     "crying, tears streaming down cheeks, scrunched eyebrows, emotional, sniffling",
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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "marin-regen" } },
    },
  };
}

// ── img2img upscale/refine pass — takes an image and re-renders at higher res ──
function refineWorkflow(positive, negative, inputImage, seed, width = 768, height = 1152, denoise = 0.3, steps = 45) {
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "illustriousxlMmmix_v80.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "8": { class_type: "LoadImage", inputs: { image: inputImage } },
      "10": { class_type: "ImageScale", inputs: { image: ["8", 0], width, height, upscale_method: "lanczos", crop: "center" } },
      "9": { class_type: "VAEEncode", inputs: { pixels: ["10", 0], vae: ["1", 2] } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps, cfg: 7, sampler_name: "dpmpp_2m_sde", scheduler: "karras", denoise,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["9", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "marin-refine" } },
    },
  };
}

function img2imgWorkflow(positive, negative, inputImage, seed, denoise = 0.45) {
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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "marin-regen" } },
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

  // Check ComfyUI
  try { await fetch(`${COMFY_URL}/system_stats`); }
  catch { console.error("ComfyUI not running at " + COMFY_URL); process.exit(1); }

  if (arg === "body-neutral") {
    // Generate the base body
    console.log("\n=== Marin V2: body-neutral (txt2img, seed " + MARIN_SEED + ") ===\n");
    await generate(
      txt2imgWorkflow(MARIN_BASE, BASE_NEGATIVE, MARIN_SEED),
      join(OUTPUT_DIR, "body-neutral.png"),
      "body-neutral"
    );
    // Copy to ComfyUI input for future img2img
    const inputPath = join(COMFY_INPUT, "marin-regen-base.png");
    copyFileSync(join(OUTPUT_DIR, "body-neutral.png"), inputPath);
    console.log(`\n  Base copied to ComfyUI input: ${inputPath}`);
    console.log("\n  Review the image at: public/sprites/marin-regen/body-neutral.png");
    console.log("  If good, run: node scripts/regen-marin.mjs face-happy");
    console.log("  Or generate all: node scripts/regen-marin.mjs all-expressions\n");

  } else if (arg === "refine") {
    // Refine the sacred base at higher res with better sampler
    const basePath = join(OUTPUT_DIR, "body-neutral-SACRED.png");
    if (!existsSync(basePath)) {
      console.error("No body-neutral-SACRED.png found!");
      process.exit(1);
    }
    // Make sure sacred base is in ComfyUI input
    const inputFilename = "marin-sacred-base.png";
    copyFileSync(basePath, join(COMFY_INPUT, inputFilename));

    console.log("\n=== Marin V2: refine pass (img2img 768x1152, denoise 0.3, DPM++ 2M SDE Karras, 45 steps) ===\n");
    await generate(
      refineWorkflow(
        MARIN_BASE,
        BASE_NEGATIVE,
        inputFilename,
        MARIN_SEED + 100,
        832, 1216,
        0.45,
        50
      ),
      join(OUTPUT_DIR, "body-neutral.png"),
      "body-neutral (refined)"
    );
    // Update the ComfyUI input base for expressions
    copyFileSync(join(OUTPUT_DIR, "body-neutral.png"), join(COMFY_INPUT, "marin-regen-base.png"));
    console.log("\n  Refined base saved and copied to ComfyUI input.");
    console.log("  Review: public/sprites/marin-regen/body-neutral.png\n");

  } else if (arg === "all-expressions") {
    // Generate all expressions from the base
    const basePath = join(OUTPUT_DIR, "body-neutral.png");
    if (!existsSync(basePath)) {
      console.error("No body-neutral.png found! Run without args first.");
      process.exit(1);
    }
    console.log("\n=== Marin V2: all expressions (img2img, denoise 0.45) ===\n");
    let i = 1;
    for (const [filename, exprPrompt] of Object.entries(EXPRESSIONS)) {
      await generate(
        img2imgWorkflow(
          `${MARIN_BASE}, ${exprPrompt}`,
          BASE_NEGATIVE,
          "marin-regen-base.png",
          MARIN_SEED + i,
          0.58
        ),
        join(OUTPUT_DIR, `${filename}.png`),
        filename
      );
      i++;
    }
    console.log("\n=== Done! All 15 expressions generated. ===\n");

  } else if (EXPRESSIONS[arg]) {
    // Generate a single expression
    const basePath = join(OUTPUT_DIR, "body-neutral.png");
    if (!existsSync(basePath)) {
      console.error("No body-neutral.png found! Run without args first.");
      process.exit(1);
    }
    const i = Object.keys(EXPRESSIONS).indexOf(arg) + 1;
    console.log(`\n=== Marin V2: ${arg} (img2img, denoise 0.45) ===\n`);
    await generate(
      img2imgWorkflow(
        `${MARIN_BASE}, ${EXPRESSIONS[arg]}`,
        BASE_NEGATIVE,
        "marin-regen-base.png",
        MARIN_SEED + i,
        0.45
      ),
      join(OUTPUT_DIR, `${arg}.png`),
      arg
    );
    console.log(`\n  Review: public/sprites/marin-regen/${arg}.png\n`);

  } else {
    console.error(`Unknown arg: "${arg}"`);
    console.error("Valid: body-neutral, all-expressions, or one of:");
    console.error("  " + Object.keys(EXPRESSIONS).join(", "));
    process.exit(1);
  }
}

main().catch(console.error);
