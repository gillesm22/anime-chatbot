/**
 * Regenerate Kurisu v2: IllustriousXL MMMix v80, athletic build, tsundere expressions.
 * Same model/sampler/resolution as Suzuka's winning regen.
 *
 * Usage:
 *   node scripts/regen-kurisu-v2.mjs                  → generates body-neutral
 *   node scripts/regen-kurisu-v2.mjs face-happy        → generates one expression
 *   node scripts/regen-kurisu-v2.mjs all-expressions   → generates all 15 expressions from base
 *
 * Outputs go to public/sprites/kurisu-regen/ so originals are untouched.
 */
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "kurisu-regen");
const COMFY_URL = "http://localhost:8188";
const COMFY_INPUT = "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

const KURISU_SEED = 44466;

const KURISU_BASE = [
  "masterpiece, best quality, absurdres, highres, anime style",
  "visual novel sprite, game cg, transparent background, png",
  "(white background:1.4), (simple background:1.3), (no background:1.2), (solo:1.7), (1girl:1.7), (one person:1.5)",
  "(pale skin:1.3), (fair skin:1.2), soft skin",
  "(cowboy shot:1.5), (thighs visible:1.5), (show from head to mid-thigh:1.4), (knees visible:1.3), (mid-thigh crop:1.3), (head space:1.2), looking at viewer",
  // Hair — Kurisu's dark reddish-brown, long, slight wave
  "(dark red-brown hair:1.5), (reddish brown hair:1.4), (chestnut hair:1.3), (long hair:1.3), (hair between eyes:1.2)",
  "(hair past shoulders:1.3), (slight wavy hair:1.2)",
  // Face — Kurisu's violet/purple eyes
  "(dark violet eyes:1.5), (deep purple eyes:1.4), (sharp eyes:1.3)",
  "(dark eyelashes:1.2), (long eyelashes:1.2), (pretty face:1.2)",
  "pretty face, mature face, (slight frown:1.1), (serious expression:1.2)",
  // Body — athletic, toned, moderate curves
  "mature female, adult, (athletic:1.2), (toned:1.2), (medium-large breasts:1.2), slender waist",
  "(fit body:1.2), smooth skin",
  // Outfit — lab coat scientist
  "(white lab coat:1.4)",
  "(white collared shirt:1.3), (red necktie:1.3), (red tie:1.2)",
  "(black shorts:1.3), (short shorts:1.2)",
  "(brown boots:1.2)",
  // No glasses for Kurisu
  // Pose
  "(standing:1.4), (arms at sides:1.2), (confident stance:1.2), (both hands visible:1.3), (hands in frame:1.3), (open hands:1.2)",
  // Style — exact Suzuka formula
  "(cel shading:1.2), (anime coloring:1.1), clean lineart, high detail skin, sharp focus, anime style",
].join(", ");

// Exact copy of Suzuka's negative (minus glasses since Kurisu wears them)
const BASE_NEGATIVE = [
  "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, (multiple girls:1.8), (2girls:1.8), (multiple characters:1.8), (split screen:1.5), (mirror:1.5), (reflection:1.5), (duo:1.5)",
  "signature, worst quality, ugly, duplicate, morbid, mutilated, extra limbs",
  "poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, thumbnails, panels, borders, frames",
  "props, furniture, background objects",
  "(blonde hair:1.4), (silver hair:1.4), (white hair:1.4), (pink hair:1.3), (orange hair:1.4), (ginger hair:1.3), (blue eyes:1.3), (pink eyes:1.4), (magenta eyes:1.4), (red eyes:1.4)",
  "(tanned skin:1.3), (dark skin:1.3)",
  "(muscular:1.4), (abs:1.4), (defined muscles:1.4)",
  "(sitting:1.4), (kneeling:1.4), (crouching:1.4), (leaning:1.3), (bending:1.3)",
  "(close-up:1.4), (portrait:1.4), (face close-up:1.4), (upper body only:1.3), (full body:1.3)",
  "(background:1.3), (grey background:1.3), (gradient background:1.3)",
  "full body, feet, shoes below frame",
  "child, loli, young",
  "(headphones:1.4), (gloves:1.4), (fingerless gloves:1.4), (glasses:1.5), (sunglasses:1.4)",
  "(chibi:1.5), (doll:1.5), (mask:1.5), (plush:1.4), (toy:1.4), (extra head:1.5), (floating head:1.5)",
].join(", ");

// Full prompt with outfit swapped — same structure as KURISU_BASE
function outfitPrompt(outfitTags) {
  return [
    "masterpiece, best quality, absurdres, highres, anime style",
    "visual novel sprite, game cg, transparent background, png",
    "(white background:1.4), (simple background:1.3), (no background:1.2), (solo:1.7), (1girl:1.7), (one person:1.5)",
    "(pale skin:1.3), (fair skin:1.2), soft skin",
    "(cowboy shot:1.5), (thighs visible:1.5), (show from head to mid-thigh:1.4), (knees visible:1.3), (mid-thigh crop:1.3), (head space:1.2), looking at viewer",
    "(dark red-brown hair:1.5), (reddish brown hair:1.4), (chestnut hair:1.3), (long hair:1.3), (hair between eyes:1.2)",
    "(hair past shoulders:1.3), (slight wavy hair:1.2)",
    "(dark violet eyes:1.5), (deep purple eyes:1.4), (sharp eyes:1.3)",
    "(dark eyelashes:1.2), (long eyelashes:1.2), (pretty face:1.2)",
    "pretty face, mature face",
    "mature female, adult, (athletic:1.2), (toned:1.2), (medium-large breasts:1.2), slender waist",
    "(fit body:1.2), smooth skin",
    outfitTags,
    "(standing:1.4), (arms at sides:1.2), (confident stance:1.2), (both hands visible:1.3), (hands in frame:1.3), (open hands:1.2)",
    "(cel shading:1.2), (anime coloring:1.1), clean lineart, high detail skin, sharp focus, anime style",
  ].join(", ");
}

const OUTFIT_NEGATIVE = BASE_NEGATIVE + ", (white lab coat:1.5), (lab coat:1.4), (red necktie:1.4), (red tie:1.4)";

const OUTFITS = {
  "body-school": "japanese school uniform, (white shirt:1.3), unbuttoned, cleavage, (very short plaid skirt:1.3), loose tie, thigh highs",
  "body-school-skimpy": "revealing school uniform, (bikini top under open white shirt:1.3), (extremely short micro plaid skirt:1.5), (micro skirt:1.4), (barely covering:1.3), bow tie, midriff, bare stomach, bare thighs, maximum skin, extremely skimpy",
  "body-cheerleader": "(cheerleader uniform:1.4), (cheerleader:1.3), (red and white cheerleader crop top:1.3), bare midriff, (short pleated cheerleader skirt:1.3), pom poms, thigh highs, energetic",
  "body-cheer-extreme": "(string bikini top:1.5), (micro string bikini bottom:1.5), (tiny red fabric:1.4), cheerleader theme, pom poms, (almost naked:1.3), (barely covered:1.4), bare arms, bare shoulders, bare midriff, bare stomach, bare thighs, bare hips, (maximum skin:1.5), (extremely skimpy:1.5)",
  "body-nurse": "(sexy nurse outfit:1.4), (very short white nurse dress:1.3), (deep neckline:1.3), red cross, nurse cap, thigh highs, cleavage, bare shoulders",
  "body-casual": "off shoulder oversized sweater, no pants, bare legs, relaxed",
  "body-formal": "elegant black evening gown, (deep v neckline:1.3), thigh slit, pearl earrings, sophisticated",
  "body-maid": "gothic maid outfit, (strapless black corset top:1.2), white frilly mini skirt, maid headdress, thigh high stockings",
  "body-vampire": "(vampire:1.3), (black and red gothic corset:1.3), deep cleavage, choker with gem, cape behind, fangs, bare shoulders, bare thighs",
  "body-cow": "(cow print micro string bikini:1.5), (cow pattern:1.4), (black and white spots:1.3), cow horns headband, golden bell choker, maximum skin, extremely skimpy",
  "body-cowgirl": "(cowgirl:1.4), cowboy hat, (tied plaid shirt showing midriff:1.3), denim micro shorts, bare legs",
  "body-demon": "(succubus demon girl:1.3), small horns, (revealing dark bodysuit:1.3), cutouts, bat wings, choker, seductive",
  "body-bikini-front": "(red micro string bikini:1.5), (tiny bikini top:1.4), (string bikini bottom:1.4), bare stomach, bare shoulders, maximum skin, extremely skimpy",
  "body-bikini-back": "(from behind:1.5), (looking back over shoulder:1.3), (red string bikini:1.4), (thong:1.3), bare back, bare shoulders, bare thighs",
  "body-back": "(from behind:1.5), (back turned:1.4), (looking back over shoulder:1.3), white lab coat, red necktie, black shorts, confident",
};

const EXPRESSIONS = {
  "face-happy":      "happy warm smile, bright eyes, genuine joy, slight blush, caught off guard by own happiness",
  "face-thinking":   "thoughtful expression, eyes looking up, contemplative, adjusting glasses, finger on glasses frame",
  "face-surprised":  "wide eyes, slightly open mouth, glasses sliding down nose, caught off guard",
  "face-sad":        "downcast eyes, slight frown, melancholic, looking away, hand gripping arm",
  "face-smirk":      "confident smirk, one corner raised, knowing look, intellectual superiority, adjusting glasses",
  "face-laugh":      "eyes closed with joy, open mouth laugh, hand near mouth, genuinely caught off guard",
  "face-angry":      "furrowed brows, intense glare, tight jaw, arms crossed energy, sharp look",
  "face-flustered":  "deep blush, averted gaze sharply, steam, hand up defensively, looking away hard",
  "face-devoted":    "warm soft unguarded gaze, gentle blush, adoring smile, rare vulnerability, soft eyes",
  "face-teasing":    "sly grin, one eyebrow raised, mischievous, leaning forward slightly, playful",
  "face-sleepy":     "half-closed eyes, peaceful, head tilting, drowsy, glasses askew",
  "face-excited":    "wide sparkling eyes, big bright grin, leaning forward, hands together, research excitement",
  "face-shy":        "looking away, deep blush, biting lip, hand near face, regretting what she just said",
  "face-jealous":    "narrowed eyes, sharp side glance, slight pout, competitive irritation",
  "face-crying":     "tears streaming, scrunched eyebrows, emotional, trying to hide face, glasses fogging",
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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "kurisu-v2" } },
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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: "kurisu-v2" } },
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
    console.log(`\n=== Kurisu V2: body-neutral (txt2img, seed ${KURISU_SEED}) ===\n`);
    await generate(
      txt2imgWorkflow(KURISU_BASE, BASE_NEGATIVE, KURISU_SEED),
      join(OUTPUT_DIR, "body-neutral.png"),
      "body-neutral"
    );
    const inputPath = join(COMFY_INPUT, "kurisu-v2-base.png");
    copyFileSync(join(OUTPUT_DIR, "body-neutral.png"), inputPath);
    console.log(`\n  Base copied to ComfyUI input: ${inputPath}`);
    console.log("\n  Review: public/sprites/kurisu-regen/body-neutral.png\n");

  } else if (arg === "all-expressions") {
    const basePath = join(OUTPUT_DIR, "body-neutral.png");
    if (!existsSync(basePath)) {
      console.error("No body-neutral.png found! Run without args first.");
      process.exit(1);
    }
    console.log("\n=== Kurisu V2: all expressions (img2img, denoise 0.58) ===\n");
    let i = 1;
    for (const [filename, exprPrompt] of Object.entries(EXPRESSIONS)) {
      await generate(
        img2imgWorkflow(
          `${KURISU_BASE}, ${exprPrompt}`,
          BASE_NEGATIVE,
          "kurisu-v2-base.png",
          KURISU_SEED + i,
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
    console.log(`\n=== Kurisu V2: ${arg} (img2img, denoise 0.58) ===\n`);
    await generate(
      img2imgWorkflow(
        `${KURISU_BASE}, ${EXPRESSIONS[arg]}`,
        BASE_NEGATIVE,
        "kurisu-v2-base.png",
        KURISU_SEED + i,
        0.58
      ),
      join(OUTPUT_DIR, `${arg}.png`),
      arg
    );
    console.log(`\n  Review: public/sprites/kurisu-regen/${arg}.png\n`);

  } else if (OUTFITS[arg]) {
    const basePath = join(OUTPUT_DIR, "body-neutral.png");
    if (!existsSync(basePath)) {
      console.error("No body-neutral.png found! Run without args first.");
      process.exit(1);
    }
    const outfitDenoise = 0.72;
    console.log(`\n=== Kurisu V2: ${arg} (img2img, denoise ${outfitDenoise}) ===\n`);
    await generate(
      img2imgWorkflow(
        outfitPrompt(OUTFITS[arg]),
        OUTFIT_NEGATIVE,
        "kurisu-v2-base.png",
        KURISU_SEED + 100 + Object.keys(OUTFITS).indexOf(arg),
        outfitDenoise
      ),
      join(OUTPUT_DIR, `${arg}.png`),
      arg
    );
    console.log(`\n  Review: public/sprites/kurisu-regen/${arg}.png\n`);

  } else {
    console.error(`Unknown arg: "${arg}"`);
    console.error("Valid: body-neutral, all-expressions, or one of:");
    console.error("  " + Object.keys(EXPRESSIONS).join(", ") + ", " + Object.keys(OUTFITS).join(", "));
    process.exit(1);
  }
}

main().catch(console.error);
