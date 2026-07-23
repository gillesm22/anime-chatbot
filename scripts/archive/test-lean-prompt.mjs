/**
 * Test: Lean prompt vs bloated prompt for Merrick.
 * Same seed (55553), same formula, trimmed tags.
 *
 * Usage: node scripts/test-lean-prompt.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";

const SEED = 55553;

// ── MEDIUM TRIM: cut synonyms, keep guards ──
const LEAN_POSITIVE = [
  // Global prefix
  "masterpiece, best quality, absurdres, highres, anime style",
  "visual novel sprite, game cg, transparent background, png",
  "(white background:1.4), (simple background:1.3), (no background:1.2), (solo:1.7), (1girl:1.7), (one person:1.5)",
  // Skin — 3 tags (was 4, dropped 'dark skin' synonym)
  "(dark brown skin:1.7), (brown skin:1.5), smooth skin",
  // Framing — 4 tags (was 6, kept the ones that define the crop)
  "(cowboy shot:1.5), (thighs visible:1.5), (show from head to mid-thigh:1.4), (head space:1.2), looking at viewer",
  // Hair — 3 tags (was 8)
  "(long black hair:1.6), (hair past waist:1.3), straight hair",
  // Eyes — 1 tag (was 3)
  "(emerald green eyes:1.5), (long eyelashes:1.2)",
  // Face — 3 tags (was 7)
  "pretty face, mature face, (elegant expression:1.2)",
  // Body — 5 tags (was 9)
  "mature female, adult, (tall:1.2), (large breasts:1.2), slender waist, (curvy:1.2)",
  // Outfit — maid
  "(gothic maid outfit:1.4), (strapless black corset top:1.2), (white frilly mini skirt:1.3), (maid headdress:1.2), (thigh high stockings:1.2)",
  // Accessories
  "(layered gold necklaces:1.3), (jade pendant:1.2), (gold hoop earrings:1.3)",
  // Pose — 3 tags (was 6)
  "(standing:1.4), (arms at sides:1.2), (both hands visible:1.3)",
  // Style — 4 tags (was 6)
  "cel shading, clean lineart, high detail skin, sharp focus",
].join(", ");

const LEAN_NEGATIVE = [
  "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark",
  "(multiple girls:1.8), (2girls:1.8), (multiple characters:1.8), (split screen:1.5), (mirror:1.5), (reflection:1.5), (duo:1.5)",
  "signature, worst quality, ugly, duplicate, extra limbs",
  "poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, panels, borders, frames",
  "props, furniture, background objects",
  // Anti-wrong identity
  "(blonde hair:1.4), (silver hair:1.4), (white hair:1.4), (pink hair:1.3), (red hair:1.3)",
  "(pale skin:1.4), (fair skin:1.4)",
  "(blue eyes:1.4), (violet eyes:1.3), (red eyes:1.3)",
  // Anti-wrong framing/pose
  "(close-up:1.4), (portrait:1.4), (full body:1.3)",
  "(sitting:1.4), (kneeling:1.4)",
  "(background:1.3), (grey background:1.3), (gradient background:1.3)",
  "child, loli, young",
  "(chibi:1.5), (glasses:1.5), (headphones:1.4)",
  "(male:1.8), (man:1.8), (boy:1.8)",
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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `merrick-trim-${seed}` } },
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

  console.log(`\n=== LEAN PROMPT TEST: Merrick (seed ${SEED}) ===`);
  console.log(`\nPositive (${LEAN_POSITIVE.length} chars):\n${LEAN_POSITIVE}\n`);
  console.log(`Negative (${LEAN_NEGATIVE.length} chars):\n${LEAN_NEGATIVE}\n`);

  // Seed hunt: 10 seeds in a fresh range
  const seeds = [55630, 55631, 55632, 55633, 55634, 55600, 55601, 55602, 55603, 55604];
  for (const s of seeds) {
    const workflow = txt2imgWorkflow(LEAN_POSITIVE, LEAN_NEGATIVE, s);
    console.log(`\nSeed ${s} — queuing...`);
    const { prompt_id } = await queuePrompt(workflow);
    const outputs = await waitForCompletion(prompt_id);
    const saveNode = Object.values(outputs).find((o) => o.images);
    if (!saveNode?.images?.[0]) throw new Error("No output image");
    const outPath = join(OUTPUT_DIR, `trim-test-${s}.png`);
    await downloadImage(saveNode.images[0].filename, outPath);
    console.log(`  Saved: lean-test-${s}.png`);
  }
  console.log("\n=== Done. Review all 5 in merrick-regen/ ===\n");
}

main().catch(console.error);
