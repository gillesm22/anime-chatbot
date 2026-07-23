/**
 * Fill arisu's outfit gaps: generate 3 seed variants for each wardrobe outfit
 * that has no chosen pick in regen-3 yet. Same proven config as test-arisu-v3.
 * Output -> public/sprites/arisu-regen/ (picked up by the gallery).
 *
 * Run: node scripts/gen-arisu-gaps.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "arisu-regen");
const COMFY_URL = "http://localhost:8188";

const SEEDS = [55901, 55902, 55903];

// Gap outfits only (no chosen pick in regen-3/arisu). Prompts from test-arisu-v3.
const OUTFITS = {
  "casual": "oversized off-shoulder sweater, bare legs, relaxed, cozy",
  "formal": "elegant black evening gown, thigh slit, pearl earrings, sophisticated",
  "nurse": "micro nurse bikini, white bikini top with red cross, white micro skirt, nurse cap, stethoscope, cleavage, bare midriff, bare shoulders, bare thighs, navel",
  "vampire": "vampire, black corset mini dress, bat wings, garter stockings, red ribbon accents, black choker with gem, small fangs",
  "cow": "cow print micro bikini, cow pattern, cow horns headband, golden bell choker, bare midriff, bare thighs",
  "cowgirl": "cowgirl, cowboy hat, tied plaid shirt, crop top, denim short shorts, cowboy boots, belt buckle",
};

function arisuPrompt(outfit) {
  return [
    "(solo:1.5), 1girl, one person",
    "white background, simple background, transparent background, png",
    "dark brown skin, smooth skin",
    "light pink hair, long hair, wavy hair",
    "brown eyes, long eyelashes",
    "pretty face, mature face",
    "mature female, adult, tall, large breasts, slender waist, curvy",
    "cowboy shot, looking at viewer, standing, hand on hip",
    outfit,
    "flower hair clip",
    "masterpiece, best quality, highres, anime style, visual novel sprite, game cg",
    "cel shading, clean lineart, sharp focus",
  ].join(", ");
}

const NEGATIVE = [
  "low quality, worst quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature",
  "multiple girls, 2girls, multiple characters, split screen, mirror, reflection, duo",
  "ugly, duplicate, extra limbs, poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, panels, borders, frames",
  "props, furniture, background objects",
  "shadow, cast shadow, drop shadow",
  "silver hair, white hair, red hair, brown hair, black hair",
  "pale skin, fair skin",
  "blue eyes, red eyes, green eyes, brown eyes",
  "close-up, portrait, full body",
  "sitting, kneeling",
  "background, grey background, gradient background, colored background, pink background, yellow background",
  "child, loli, young",
  "chibi, glasses, headphones",
  "male, man, boy",
].join(", ");

function txt2imgWorkflow(positive, negative, seed, prefix) {
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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: prefix } },
    },
  };
}

async function queuePrompt(workflow) {
  const res = await fetch(`${COMFY_URL}/prompt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workflow) });
  if (!res.ok) throw new Error(`Queue failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function waitForCompletion(promptId, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    const data = await res.json();
    if (data[promptId]?.outputs) return data[promptId].outputs;
    if (data[promptId]?.status?.status_str === "error") throw new Error("Generation failed");
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Timeout");
}

async function downloadImage(filename, outputPath) {
  const res = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  writeFileSync(outputPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  try { await fetch(`${COMFY_URL}/system_stats`); }
  catch { console.error("ComfyUI not running at " + COMFY_URL); process.exit(1); }

  const jobs = [];
  for (const outfitName of Object.keys(OUTFITS)) {
    for (const seed of SEEDS) jobs.push({ outfitName, seed });
  }
  console.log(`Generating ${jobs.length} images (${Object.keys(OUTFITS).length} outfits x ${SEEDS.length} seeds)\n`);

  let i = 0;
  for (const { outfitName, seed } of jobs) {
    i++;
    const positive = arisuPrompt(OUTFITS[outfitName]);
    const prefix = `arisu-v3-${outfitName}-${seed}`;
    const outputPath = join(OUTPUT_DIR, `${prefix}.png`);
    try {
      const { prompt_id } = await queuePrompt(txt2imgWorkflow(positive, NEGATIVE, seed, prefix));
      const outputs = await waitForCompletion(prompt_id);
      const saveNode = Object.values(outputs).find((o) => o.images);
      if (!saveNode?.images?.[0]) throw new Error("No output image");
      await downloadImage(saveNode.images[0].filename, outputPath);
      console.log(`[${i}/${jobs.length}] ${prefix}.png`);
    } catch (e) {
      console.error(`[${i}/${jobs.length}] ${prefix} FAILED: ${e.message}`);
    }
  }
  console.log("\nDone. Rebuild the gallery: node scripts/build-regen-gallery.mjs");
}

main().catch(console.error);
