/**
 * Regenerate Merrick v2: IllustriousXL MMMix v80, café au lait Creole vampire.
 * Same winning formula as Suzuka/Kurisu.
 *
 * Usage:
 *   node scripts/regen-merrick-v2.mjs                  → generates body-neutral
 *   node scripts/regen-merrick-v2.mjs face-happy        → generates one expression
 *   node scripts/regen-merrick-v2.mjs all-expressions   → generates all 15 expressions
 *
 * Outputs go to public/sprites/merrick-regen/ so originals are untouched.
 */
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const MERRICK_SEED = 55553;

const MERRICK_BASE = [
  "masterpiece, best quality, absurdres, highres, anime style",
  "visual novel sprite, game cg, transparent background, png",
  "(white background:1.4), (simple background:1.3), (no background:1.2), (solo:1.7), (1girl:1.7), (one person:1.5)",
  // Skin — café au lait, warm brown Creole
  "(dark brown skin:1.5), (brown skin:1.4), (warm skin tone:1.3), smooth skin",
  "(cowboy shot:1.5), (thighs visible:1.5), (show from head to mid-thigh:1.4), (knees visible:1.3), (mid-thigh crop:1.3), (head space:1.2), looking at viewer",
  // Hair — long flowing black hair past waist
  "(long black hair:1.5), (black hair:1.4), (very long hair:1.3), (hair past waist:1.3), (flowing hair:1.2)",
  "(straight hair:1.2), (silky hair:1.2)",
  // Face — striking emerald green eyes
  "(emerald green eyes:1.5), (green eyes:1.4), (bright green eyes:1.3)",
  "(dark eyelashes:1.2), (long eyelashes:1.2), (pretty face:1.2)",
  "pretty face, mature face, (elegant expression:1.2), (composed:1.1)",
  // Body — tall, statuesque, graceful
  "mature female, adult, (tall:1.2), (statuesque:1.2), (large breasts:1.2), slender waist",
  "(graceful body:1.2), smooth skin",
  // Outfit — Talamasca meeting: silk camisole, dark pants, understated elegance
  "(black silk camisole:1.4), (lace trim camisole:1.3), (spaghetti straps:1.2), (cleavage:1.2)",
  "(fitted black pants:1.3), (dark dress pants:1.2)",
  "(layered gold necklaces:1.3), (gold jewelry:1.3), (jade pendant:1.2)",
  "(gold hoop earrings:1.3)",
  // Pose — straight on, no tilt
  "(standing:1.4), (arms at sides:1.2), (confident stance:1.2), (both hands visible:1.3), (hands in frame:1.3), (relaxed hands:1.2)",
  // Style
  "(cel shading:1.2), (anime coloring:1.1), clean lineart, high detail skin, sharp focus, anime style",
].join(", ");

const BASE_NEGATIVE = [
  "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, (multiple girls:1.8), (2girls:1.8), (multiple characters:1.8), (split screen:1.5), (mirror:1.5), (reflection:1.5), (duo:1.5)",
  "signature, worst quality, ugly, duplicate, morbid, mutilated, extra limbs",
  "poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, thumbnails, panels, borders, frames",
  "props, furniture, background objects",
  "(blonde hair:1.4), (silver hair:1.4), (white hair:1.4), (pink hair:1.3), (red hair:1.3), (brown hair:1.3)",
  "(pale skin:1.4), (fair skin:1.4), (light skin:1.3)",
  "(blue eyes:1.4), (violet eyes:1.3), (red eyes:1.3)",
  "(muscular:1.4), (abs:1.4), (defined muscles:1.4)",
  "(sitting:1.4), (kneeling:1.4), (crouching:1.4), (leaning:1.3), (bending:1.3)",
  "(close-up:1.4), (portrait:1.4), (face close-up:1.4), (upper body only:1.3), (full body:1.3)",
  "(background:1.3), (grey background:1.3), (gradient background:1.3)",
  "full body, feet, shoes below frame",
  "child, loli, young",
  "(glasses:1.5), (headphones:1.4), (gloves:1.4), (fingerless gloves:1.4)",
  "(chibi:1.5), (doll:1.5), (mask:1.5), (plush:1.4), (toy:1.4), (extra head:1.5), (floating head:1.5)",
].join(", ");

// Full prompt with outfit swapped — same structure as MERRICK_BASE
function outfitPrompt(outfitTags) {
  return [
    "masterpiece, best quality, absurdres, highres, anime style",
    "visual novel sprite, game cg, transparent background, png",
    "(white background:1.4), (simple background:1.3), (no background:1.2), (solo:1.7), (1girl:1.7), (one person:1.5)",
    "(dark brown skin:1.7), (brown skin:1.6), (dark skin:1.5), (warm skin tone:1.3), smooth skin",
    "(cowboy shot:1.5), (thighs visible:1.5), (show from head to mid-thigh:1.4), (knees visible:1.3), (mid-thigh crop:1.3), (head space:1.2), looking at viewer",
    "(long black hair:1.6), (jet black hair:1.5), (black hair:1.5), (very long hair:1.3), (hair past waist:1.3), (flowing hair:1.2)",
    "(straight hair:1.2), (silky hair:1.2)",
    "(emerald green eyes:1.5), (green eyes:1.4), (bright green eyes:1.3)",
    "(dark eyelashes:1.2), (long eyelashes:1.2), (pretty face:1.2)",
    "pretty face, mature face, (elegant expression:1.2), (composed:1.1)",
    "mature female, adult, (tall:1.3), (statuesque:1.3), (large breasts:1.3), slender waist",
    "(curvy:1.2), (wide hips:1.2), (graceful body:1.2), smooth skin",
    outfitTags,
    "(layered gold necklaces:1.3), (gold jewelry:1.3), (jade pendant:1.2)",
    "(gold hoop earrings:1.3)",
    "(standing:1.4), (arms at sides:1.2), (confident stance:1.2), (both hands visible:1.3), (hands in frame:1.3), (relaxed hands:1.2)",
    "(cel shading:1.2), (anime coloring:1.1), clean lineart, high detail skin, sharp focus, anime style",
  ].join(", ");
}

const OUTFIT_NEGATIVE = BASE_NEGATIVE + ", (silk camisole:1.4), (camisole:1.3), (spaghetti straps:1.3), (teal:1.5), (turquoise:1.5), (green clothing:1.5), (cyan:1.5), (teal jacket:1.5), (male:1.8), (man:1.8), (boy:1.8), (wind:1.4), (windswept:1.4), (floating hair:1.4), (hair blowing:1.4)";

const OUTFITS = {
  "body-formal": "(all black outfit:1.5), (black jacket:1.4), (open front:1.2), (black silk camisole underneath:1.4), (lace trim:1.2), (cleavage:1.2), (black fitted pants:1.4), (black trousers:1.3), (all black clothing:1.4)",
  "body-school": "japanese school uniform, (white shirt:1.3), unbuttoned, cleavage, (very short plaid skirt:1.3), loose tie, thigh highs",
  "body-school-skimpy": "(open white shirt:1.3), (tied up shirt:1.3), (deep cleavage:1.4), (bikini top under shirt:1.3), (micro plaid skirt:1.5), (extremely short skirt:1.5), (barely covering:1.4), loose tie, (bare midriff:1.4), (bare stomach:1.3), (bare thighs:1.3), (thigh highs:1.3), (maximum skin:1.4), (extremely skimpy:1.4)",
  "body-nurse": "(sexy nurse outfit:1.4), (very short white nurse dress:1.3), (deep neckline:1.3), red cross, nurse cap, thigh highs, cleavage, bare shoulders",
  "body-nurse-plus": "(sexy nurse:1.4), (micro teal nurse bikini:1.5), (teal string bikini:1.4), (dark fabric:1.2), red cross on chest, nurse cap, (bare midriff:1.4), (bare stomach:1.4), (bare thighs:1.4), (maximum skin:1.5), (extremely skimpy:1.4), thigh highs",
  "body-cheerleader": "(sporty crop top:1.4), (white and teal crop top:1.3), bare midriff, (short pleated miniskirt:1.3), (white pleated skirt:1.3), thigh highs, (composed smirk:1.2), confident",
  "body-cheer-extreme": "(cheerleader:1.3), (tiny red sports bra:1.5), (micro red pleated skirt:1.5), (extremely short skirt:1.4), bare arms, bare shoulders, bare midriff, bare stomach, bare thighs, (maximum skin:1.5), (extremely skimpy:1.5), pom poms",
};

const EXPRESSIONS = {
  "face-happy":      "warm composed smile, bright eyes, genuine warmth, quiet delight",
  "face-thinking":   "thoughtful expression, eyes looking up, contemplative, finger on chin, intellectual",
  "face-surprised":  "wide eyes, slightly open mouth, eyebrows raised, rarely caught off guard",
  "face-sad":        "downcast eyes, slight frown, melancholic, quiet grief, centuries of memory",
  "face-smirk":      "knowing smirk, one corner raised, half-lidded eyes, sees right through you",
  "face-laugh":      "eyes closed with quiet joy, measured laugh, hand near mouth, genuinely amused",
  "face-angry":      "cool displeasure, narrowed eyes, tight jaw, composed fury, not rattled",
  "face-flustered":  "rare loss of composure, slight blush on dark skin, averted gaze, caught off guard",
  "face-devoted":    "deep unhurried love, warm soft gaze, gentle expression, tender small smile",
  "face-teasing":    "playful curiosity, sly grin, one eyebrow raised, elegant mischief",
  "face-sleepy":     "meditative stillness, half-closed eyes, peaceful, serene",
  "face-excited":    "intellectual delight, wide bright eyes, genuine interest, something fascinating",
  "face-shy":        "rare uncertainty, looking slightly away, quiet moment, not sure what to say",
  "face-jealous":    "possessive glance, narrowed eyes, side look, would rather not admit it",
  "face-crying":     "tears on dark skin, grief for something real, scrunched brows, rare vulnerability",
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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "merrick-v2" } },
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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "merrick-v2" } },
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
    console.log(`\n=== Merrick V2: body-neutral (txt2img, seed ${MERRICK_SEED}) ===\n`);
    await generate(
      txt2imgWorkflow(MERRICK_BASE, BASE_NEGATIVE, MERRICK_SEED),
      join(OUTPUT_DIR, "body-neutral.png"),
      "body-neutral"
    );
    const inputPath = join(COMFY_INPUT, "merrick-v2-base.png");
    copyFileSync(join(OUTPUT_DIR, "body-neutral.png"), inputPath);
    console.log(`\n  Base copied to ComfyUI input: ${inputPath}`);
    console.log("\n  Review: public/sprites/merrick-regen/body-neutral.png\n");

  } else if (arg === "all-expressions") {
    const basePath = join(OUTPUT_DIR, "body-neutral.png");
    if (!existsSync(basePath)) {
      console.error("No body-neutral.png found! Run without args first.");
      process.exit(1);
    }
    console.log("\n=== Merrick V2: all expressions (img2img, denoise 0.58) ===\n");
    let i = 1;
    for (const [filename, exprPrompt] of Object.entries(EXPRESSIONS)) {
      await generate(
        img2imgWorkflow(
          `${MERRICK_BASE}, ${exprPrompt}`,
          BASE_NEGATIVE,
          "merrick-v2-base.png",
          MERRICK_SEED + i,
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
    console.log(`\n=== Merrick V2: ${arg} (img2img, denoise 0.58) ===\n`);
    await generate(
      img2imgWorkflow(
        `${MERRICK_BASE}, ${EXPRESSIONS[arg]}`,
        BASE_NEGATIVE,
        "merrick-v2-base.png",
        MERRICK_SEED + i,
        0.58
      ),
      join(OUTPUT_DIR, `${arg}.png`),
      arg
    );
    console.log(`\n  Review: public/sprites/merrick-regen/${arg}.png\n`);

  } else if (OUTFITS[arg]) {
    console.log(`\n=== Merrick V2: ${arg} (txt2img, seed ${MERRICK_SEED + 100}) ===\n`);
    const outfitSeed = MERRICK_SEED;
    console.log(`\n=== Merrick V2: ${arg} (txt2img, seed ${outfitSeed}) ===\n`);
    await generate(
      txt2imgWorkflow(
        outfitPrompt(OUTFITS[arg]),
        OUTFIT_NEGATIVE,
        outfitSeed
      ),
      join(OUTPUT_DIR, `${arg}.png`),
      arg
    );
    console.log(`\n  Review: public/sprites/merrick-regen/${arg}.png\n`);

  } else {
    console.error(`Unknown arg: "${arg}"`);
    console.error("Valid: body-neutral, all-expressions, or one of:");
    console.error("  " + Object.keys(EXPRESSIONS).join(", ") + ", " + Object.keys(OUTFITS).join(", "));
    process.exit(1);
  }
}

main().catch(console.error);
