/**
 * Quick pose test for Suzuka — hand behind head
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMFY_URL = "http://localhost:8188";

const POSITIVE = [
  "solo, 1girl, one person",
  "white background, no background, simple background, png",
  "fair skin, soft skin",
  "teal eyes, (beautiful eyes:1.3), eye highlight, long eyelashes",
  "dark purple hair, high ponytail, side bangs",
  "dark eyeliner, pretty face, mature face",
  "mature female, adult, curvy, thick thighs, slender waist",
  "cowboy shot, upper legs, looking at viewer, standing, contrapposto",
  "cowgirl, tied plaid shirt, crop top, denim short shorts, cowboy hat, cowboy boots, choker",
  "masterpiece, best quality, highres, anime style, visual novel sprite, game cg, cel shading, clean lineart, sharp focus",
].join(", ");

const NEGATIVE = [
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

  const outDir = join(__dirname, "..", "public", "sprites", "nao-regen");
  mkdirSync(outDir, { recursive: true });
  const seed = 44458;
  const outputPath = join(outDir, `suzuka-pose-test-${seed}.png`);

  console.log(`\n=== Suzuka pose test: hand behind head @ seed ${seed} ===\n`);

  const { prompt_id } = await queuePrompt(txt2imgWorkflow(POSITIVE, NEGATIVE, seed, "suzuka-pose-test"));
  console.log(`  Queued: ${prompt_id}`);
  const outputs = await waitForCompletion(prompt_id);
  const saveNode = Object.values(outputs).find((o) => o.images);
  if (!saveNode?.images?.[0]) throw new Error("No output image");
  await downloadImage(saveNode.images[0].filename, outputPath);
  console.log(`  Saved: ${outputPath}\n`);
}

main().catch(console.error);
