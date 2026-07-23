/**
 * Quick style comparison: Merrick + Suzuka in V3 Kurisu-style prompting.
 * Same structure as test-kurisu-v3.mjs to test style consistency across cast.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMFY_URL = "http://localhost:8188";

const MERRICK_POSITIVE = [
  "solo, 1girl, one person",
  "white background, no background, simple background, png",
  "dark brown skin, smooth skin",
  "green eyes, (beautiful eyes:1.3), long eyelashes",
  "long black hair, hair past waist, straight hair",
  "pretty face, mature face",
  "mature female, adult, tall, large breasts, slender waist, curvy",
  "cowboy shot, looking at viewer, standing, hand on hip",
  "black tank top, fitted black pants",
  "gold hoop earrings, jade pendant necklace",
  "masterpiece, best quality, highres, anime style, visual novel sprite, game cg, cel shading, clean lineart, sharp focus",
].join(", ");

const MERRICK_NEGATIVE = [
  "low quality, worst quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature",
  "multiple girls, 2girls, multiple characters, split screen, mirror, reflection, duo",
  "ugly, duplicate, extra limbs, poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, panels, borders, frames",
  "props, furniture, background objects",
  "shadow, cast shadow, drop shadow",
  "blonde hair, silver hair, white hair, pink hair, red hair",
  "pale skin, fair skin",
  "blue eyes, violet eyes, red eyes",
  "close-up, portrait, full body",
  "sitting, kneeling",
  "background, grey background, gradient background, colored background, pink background, yellow background",
  "child, loli, young",
  "chibi, glasses, headphones",
  "male, man, boy",
].join(", ");

const SUZUKA_POSITIVE = [
  "solo, 1girl, one person",
  "white background, no background, simple background, png",
  "fair skin, soft skin",
  "teal eyes, (beautiful eyes:1.3), long eyelashes",
  "dark purple hair, high ponytail, side bangs",
  "dark eyeliner, pretty face, mature face",
  "mature female, adult, curvy, thick thighs, slender waist",
  "cowboy shot, looking at viewer, standing, hand on hip",
  "cowgirl, tied plaid shirt, crop top, denim short shorts, cowboy hat, cowboy boots, choker",
  "masterpiece, best quality, highres, anime style, visual novel sprite, game cg, cel shading, clean lineart, sharp focus",
].join(", ");

const SUZUKA_NEGATIVE = [
  "low quality, worst quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature",
  "multiple girls, 2girls, multiple characters, split screen, mirror, reflection, duo",
  "ugly, duplicate, extra limbs, poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, panels, borders, frames",
  "props, furniture, background objects",
  "shadow, cast shadow, drop shadow",
  "blonde hair, silver hair, white hair, pink hair, red hair, brown hair",
  "tanned skin, dark skin",
  "blue eyes, pink eyes, red eyes, brown eyes",
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
  try { await fetch(`${COMFY_URL}/system_stats`); }
  catch { console.error("ComfyUI not running at " + COMFY_URL); process.exit(1); }

  const chars = [
    { name: "merrick", positive: MERRICK_POSITIVE, negative: MERRICK_NEGATIVE, seed: 55700, dir: "merrick-regen" },
    { name: "suzuka", positive: SUZUKA_POSITIVE, negative: SUZUKA_NEGATIVE, seed: 44458, dir: "nao-regen" },
  ];

  for (const c of chars) {
    const outDir = join(__dirname, "..", "public", "sprites", c.dir);
    mkdirSync(outDir, { recursive: true });
    const prefix = `${c.name}-v3-style-test`;
    const outputPath = join(outDir, `${prefix}-${c.seed}.png`);

    console.log(`\n=== ${c.name} @ seed ${c.seed} ===`);
    console.log(`  ${c.positive}\n`);

    const { prompt_id } = await queuePrompt(txt2imgWorkflow(c.positive, c.negative, c.seed, prefix));
    console.log(`  Queued: ${prompt_id}`);
    const outputs = await waitForCompletion(prompt_id);
    const saveNode = Object.values(outputs).find((o) => o.images);
    if (!saveNode?.images?.[0]) throw new Error("No output image");
    await downloadImage(saveNode.images[0].filename, outputPath);
    console.log(`  Saved: ${outputPath}`);
  }

  console.log("\n=== Done! ===\n");
}

main().catch(console.error);
