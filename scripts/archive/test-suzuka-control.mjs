/**
 * Control test: Suzuka's exact original prompt + seed on anything-v5.
 * If she comes out clean solo, the duplicate problem is Merrick-specific.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "nao-regen");
const COMFY_URL = "http://localhost:8188";

// Exact Suzuka prompt from regen-suzuka-v2.mjs
const POSITIVE = "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, white background, simple background, solo, 1girl, upper body, cowboy shot, short silver-blue bob hair, messy bob cut, hair above shoulders, teal blue eyes, bright blue eyes, pale fair skin, cute round face, soft features, natural blush, rosy cheeks, black choker, stylish rectangular glasses, bayonetta glasses, narrow frame glasses, curvy body, wide hips, large breasts, fit waist, slim waist, hourglass figure, both hands visible, looking at viewer, crop top, midriff, cleavage, short shorts, revealing outfit, sexy, confident pose, soft pastel shading, clean lineart, gentle lighting";

const NEGATIVE = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, missing arm, missing hand, missing limb, extra limbs, poorly drawn hands, mutation, bad proportions, background objects, skinny, flat chest, fat, obese, belly, stomach fat, pregnant, long hair";

const SEED = 858585;

function txt2imgWorkflow(positive, negative, seed) {
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "4": { class_type: "EmptyLatentImage", inputs: { width: 512, height: 896, batch_size: 1 } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `suzuka-control-${seed}` } },
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

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n=== SUZUKA CONTROL TEST (anything-v5, seed ${SEED}) ===`);
  console.log(`Positive (${POSITIVE.length} chars)`);
  console.log(`Negative (${NEGATIVE.length} chars)\n`);

  const seeds = [SEED, SEED + 1, SEED + 2, SEED + 3, SEED + 4];
  for (const s of seeds) {
    const workflow = txt2imgWorkflow(POSITIVE, NEGATIVE, s);
    console.log(`Seed ${s} — queuing...`);
    const { prompt_id } = await queuePrompt(workflow);
    const outputs = await waitForCompletion(prompt_id);
    const saveNode = Object.values(outputs).find((o) => o.images);
    if (!saveNode?.images?.[0]) throw new Error("No output image");
    const outPath = join(OUTPUT_DIR, `suzuka-control-${s}.png`);
    await downloadImage(saveNode.images[0].filename, outPath);
    console.log(`  Saved: suzuka-control-${s}.png`);
  }
  console.log("\n=== Done. ===\n");
}

main().catch(console.error);
