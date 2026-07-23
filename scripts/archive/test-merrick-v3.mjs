/**
 * Merrick V3: Proper prompting — tag order over weights, minimal weights.
 * Only (solo:1.5) as a guard. Everything else plain danbooru tags, ordered by priority.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";

// Tag order = priority. Most important first. No weights except solo guard.
const POSITIVE = [
  // 1. Isolation + format (highest priority)
  "(solo:1.5), 1girl, one person",
  "white background, simple background, transparent background, png",
  // 2. Core identity
  "dark brown skin, smooth skin",
  "long black hair, hair past waist, straight hair",
  "green eyes, long eyelashes",
  "pretty face, mature face",
  // 3. Body
  "mature female, adult, tall, large breasts, slender waist, curvy",
  // 4. Framing + pose
  "cowboy shot, looking at viewer, standing, hand on hip",
  // 5. Outfit (swappable)
  "black tank top, fitted black pants",
  // 6. Accessories
  "gold hoop earrings, jade pendant necklace",
  // 7. Quality + style (end of prompt)
  "masterpiece, best quality, highres, anime style, visual novel sprite, game cg",
  "cel shading, clean lineart, sharp focus",
].join(", ");

const NEGATIVE = [
  "low quality, worst quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature",
  "multiple girls, 2girls, multiple characters, split screen, mirror, reflection, duo",
  "ugly, duplicate, extra limbs, poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, panels, borders, frames",
  "props, furniture, background objects",
  "blonde hair, silver hair, white hair, pink hair, red hair",
  "pale skin, fair skin",
  "blue eyes, violet eyes, red eyes",
  "close-up, portrait, full body",
  "sitting, kneeling",
  "background, grey background, gradient background",
  "child, loli, young",
  "chibi, glasses, headphones",
  "male, man, boy",
].join(", ");

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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `merrick-v3-${seed}` } },
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
  console.log(`\n=== MERRICK V3: ORDER-BASED PROMPTING ===`);
  console.log(`Positive (${POSITIVE.length} chars):\n${POSITIVE}\n`);

  const seeds = [55553, 55554, 55555, 55556, 55557, 55600, 55630, 55650, 55660, 55670];
  for (const s of seeds) {
    const workflow = txt2imgWorkflow(POSITIVE, NEGATIVE, s);
    console.log(`Seed ${s} — queuing...`);
    const { prompt_id } = await queuePrompt(workflow);
    const outputs = await waitForCompletion(prompt_id);
    const saveNode = Object.values(outputs).find((o) => o.images);
    if (!saveNode?.images?.[0]) throw new Error("No output image");
    const outPath = join(OUTPUT_DIR, `v3-${s}.png`);
    await downloadImage(saveNode.images[0].filename, outPath);
    console.log(`  Saved: v3-${s}.png`);
  }
  console.log("\n=== Done. ===\n");
}

main().catch(console.error);
