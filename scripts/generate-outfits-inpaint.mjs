/**
 * Generate outfits using INPAINTING with clothes mask.
 * Only the masked (clothing) area gets regenerated - face/skin/hair stay untouched.
 * Run: node scripts/generate-outfits-inpaint.mjs
 */
import { writeFileSync, mkdirSync, renameSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES_DIR = join(__dirname, "..", "public", "sprites");
const COMFY_URL = "http://localhost:8188";

const BASE_NEGATIVE = "low quality, blurry, deformed, text, watermark, signature, worst quality, ugly";

// Base images and their clothes masks (already uploaded to ComfyUI input)
const CHARS = {
  arisu: { base: "arisu-base.png", mask: "arisu-clothes-mask.png" },
  marin: { base: "marin-base.png", mask: "marin-face-mask.png" },  // will invert if needed
  nao:   { base: "nao-base.png",   mask: "nao-face-mask.png" },
};

// Outfit prompts - focus ONLY on clothing since face won't change
const OUTFITS = {
  casual: {
    arisu: "thin cropped pink camisole tank top, very short white cotton shorts, bare midriff, relaxed",
    marin: "tiny crop band tee, lace bralette visible, very short denim cutoff shorts, bare midriff",
    nao: "loose off-shoulder black crop hoodie, sports bra underneath, very short dark shorts",
  },
  formal: {
    arisu: "elegant strapless pink and white evening gown, thigh-high slit, bare shoulders, flowers in hair",
    marin: "tight glamorous gold sequin mini dress, deep v-neckline, strappy heels, gold jewelry",
    nao: "dark purple form-fitting gothic cocktail dress, low back, fishnet stockings, choker",
  },
  school: {
    arisu: "japanese school uniform, white shirt slightly unbuttoned, short navy pleated mini skirt, thigh-high white stockings, pink ribbon tie",
    marin: "gyaru school uniform, shirt tied up showing midriff, very short pleated skirt, loose tie, thigh-high tan stockings",
    nao: "school uniform with unzipped hoodie, short dark plaid skirt, black thigh-high stockings, headphones",
  },
};

function makeInpaintWorkflow(baseImage, maskImage, positive, negative, filename) {
  const seed = Math.floor(Math.random() * 2147483647);
  return {
    prompt: {
      "1": {
        class_type: "CheckpointLoaderSimple",
        inputs: { ckpt_name: "anything-v5.safetensors" },
      },
      "2": {
        class_type: "CLIPTextEncode",
        inputs: { text: `masterpiece, best quality, anime style, ${positive}`, clip: ["1", 1] },
      },
      "3": {
        class_type: "CLIPTextEncode",
        inputs: { text: negative, clip: ["1", 1] },
      },
      "load_img": {
        class_type: "LoadImage",
        inputs: { image: baseImage },
      },
      "load_mask": {
        class_type: "LoadImage",
        inputs: { image: maskImage },
      },
      "set_mask": {
        class_type: "VAEEncodeForInpaint",
        inputs: {
          pixels: ["load_img", 0],
          vae: ["1", 2],
          mask: ["load_mask", 1],
          grow_mask_by: 8,
        },
      },
      "5": {
        class_type: "KSampler",
        inputs: {
          seed: seed,
          steps: 30,
          cfg: 7.5,
          sampler_name: "euler_ancestral",
          scheduler: "normal",
          denoise: 0.85,
          model: ["1", 0],
          positive: ["2", 0],
          negative: ["3", 0],
          latent_image: ["set_mask", 0],
        },
      },
      "6": {
        class_type: "VAEDecode",
        inputs: { samples: ["5", 0], vae: ["1", 2] },
      },
      "7": {
        class_type: "SaveImage",
        inputs: { images: ["6", 0], filename_prefix: filename },
      },
    },
  };
}

async function queuePrompt(workflow) {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workflow),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Queue failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function waitForCompletion(promptId, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    const data = await res.json();
    if (data[promptId] && data[promptId].outputs) return data[promptId].outputs;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timeout`);
}

async function downloadImage(filename, outputDir) {
  const res = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const outputPath = join(outputDir, filename.replace(/.*\//, ""));
  writeFileSync(outputPath, buffer);
  return outputPath;
}

async function generateOutfit(charId, outfitName, outfitPrompt) {
  const { base, mask } = CHARS[charId];
  const prefix = `${charId}-body-${outfitName}`;
  const dir = join(SPRITES_DIR, charId);
  mkdirSync(dir, { recursive: true });

  console.log(`  Generating: ${charId} ${outfitName} (inpaint, mask: ${mask})...`);

  try {
    const workflow = makeInpaintWorkflow(base, mask, outfitPrompt, BASE_NEGATIVE, prefix);
    const { prompt_id } = await queuePrompt(workflow);
    console.log(`  Queued: ${prompt_id}`);

    const outputs = await waitForCompletion(prompt_id);
    const saveNode = Object.values(outputs).find((o) => o.images);
    if (!saveNode || !saveNode.images[0]) throw new Error("No output");

    const imageName = saveNode.images[0].filename;
    const savedPath = await downloadImage(imageName, dir);
    const finalPath = join(dir, `body-${outfitName}.png`);
    try { renameSync(savedPath, finalPath); } catch {}
    console.log(`  Saved: ${finalPath}`);
  } catch (e) {
    console.error(`  FAILED: ${charId}/${outfitName}: ${e.message}`);
    // Fall back to img2img if inpainting fails
    console.log(`  Falling back to img2img...`);
    await generateImg2Img(charId, outfitName, outfitPrompt);
  }
}

async function generateImg2Img(charId, outfitName, outfitPrompt) {
  const { base } = CHARS[charId];
  const prefix = `${charId}-body-${outfitName}`;
  const dir = join(SPRITES_DIR, charId);
  const seed = Math.floor(Math.random() * 2147483647);

  const identity = {
    arisu: "1girl, long blonde wavy hair with pink highlights, violet eyes, dark tanned brown skin, dark skin",
    marin: "1girl, long black hair, amber eyes, tan skin, dark skin, gyaru, gold earrings",
    nao: "1girl, short light blue silver bob, teal eyes, pale skin, choker, skull hairpin",
  }[charId];

  const workflow = {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: `masterpiece, best quality, anime, visual novel sprite, transparent background, full body, ${identity}, ${outfitPrompt}`, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: BASE_NEGATIVE, clip: ["1", 1] } },
      "load_img": { class_type: "LoadImage", inputs: { image: base } },
      "encode_img": { class_type: "VAEEncode", inputs: { pixels: ["load_img", 0], vae: ["1", 2] } },
      "5": { class_type: "KSampler", inputs: { seed, steps: 30, cfg: 7, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 0.55, model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["encode_img", 0] } },
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: prefix } },
    },
  };

  const { prompt_id } = await queuePrompt(workflow);
  const outputs = await waitForCompletion(prompt_id);
  const saveNode = Object.values(outputs).find((o) => o.images);
  if (!saveNode || !saveNode.images[0]) throw new Error("No output");
  const imageName = saveNode.images[0].filename;
  const savedPath = await downloadImage(imageName, dir);
  const finalPath = join(dir, `body-${outfitName}.png`);
  try { renameSync(savedPath, finalPath); } catch {}
  console.log(`  Saved (img2img fallback): ${finalPath}`);
}

async function main() {
  console.log("=== Outfit Generation (Inpaint) ===\n");

  for (const [charId] of Object.entries(CHARS)) {
    console.log(`\n--- ${charId} ---\n`);
    for (const [outfitName, charOutfits] of Object.entries(OUTFITS)) {
      const prompt = charOutfits[charId];
      if (!prompt) continue;
      await generateOutfit(charId, outfitName, prompt);
    }
  }

  console.log("\n=== Done! ===");
}

main().catch(console.error);
