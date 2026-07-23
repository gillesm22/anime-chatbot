/**
 * Merrick V3: All remaining outfits (2 seeds each)
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";

const BASE = [
  "(solo:1.5), 1girl, one person",
  "white background, simple background, transparent background, png",
  "dark brown skin, smooth skin",
  "long black hair, hair past waist, straight hair",
  "green eyes, long eyelashes",
  "pretty face, mature face",
  "mature female, adult, tall, large breasts, slender waist, curvy",
  "cowboy shot, looking at viewer, standing, hand on hip",
];

const SUFFIX = [
  "gold hoop earrings",
  "masterpiece, best quality, highres, anime style, visual novel sprite, game cg",
  "cel shading, clean lineart, sharp focus",
];

function outfit(tags) {
  return [...BASE, tags, ...SUFFIX].join(", ");
}

const OUTFITS = {
  "casual": outfit("oversized off-shoulder sweater, bare legs, relaxed, cozy"),
  "formal": outfit("elegant black evening gown, thigh slit, pearl earrings, sophisticated"),
  "maid": outfit("french maid outfit, black dress, white frilly apron, maid headband, thigh high stockings"),
  "demon": outfit("succubus, small horns, dark bodysuit, cutouts, bat wings, choker, seductive"),
  "bikini-front": outfit("string bikini, swimsuit, bare midriff, bare thighs, bare stomach, navel, cleavage"),
  "bikini-back": outfit("from behind, looking back over shoulder, string bikini, bare back, bare thighs"),
};

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
    if (data[promptId]?.status?.status_str === "error") throw new Error("Failed");
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

  const seeds = [55630, 55700];
  for (const [name, positive] of Object.entries(OUTFITS)) {
    for (const s of seeds) {
      const prefix = `merrick-v3-${name}-${s}`;
      console.log(`${name} (seed ${s}) — queuing...`);
      const workflow = txt2imgWorkflow(positive, NEGATIVE, s, prefix);
      const { prompt_id } = await queuePrompt(workflow);
      const outputs = await waitForCompletion(prompt_id);
      const saveNode = Object.values(outputs).find((o) => o.images);
      if (!saveNode?.images?.[0]) throw new Error("No output image");
      await downloadImage(saveNode.images[0].filename, join(OUTPUT_DIR, `${prefix}.png`));
      console.log(`  Saved: ${prefix}`);
    }
  }
  console.log("\n=== Done. ===\n");
}

main().catch(console.error);
