/**
 * Merrick V3: Batch 2 — HxH cosplays, sports max, goth baddie, back shots
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

// Back shots need modified base
const BASE_BACK = [
  "(solo:1.5), 1girl, one person",
  "white background, simple background, transparent background, png",
  "dark brown skin, smooth skin",
  "long black hair, hair past waist, straight hair",
  "green eyes, long eyelashes",
  "pretty face, mature face",
  "mature female, adult, tall, large breasts, slender waist, curvy",
  "cowboy shot, from behind, looking back over shoulder",
];

function backOutfit(tags) {
  return [...BASE_BACK, tags, ...SUFFIX].join(", ");
}

const OUTFITS = {
  // ── HxH Cosplays ──
  "cos-hisoka-fem": outfit("hisoka cosplay, crop top with star and teardrop face paint, high waisted pants, playing card in hand, sly smile, hunter x hunter"),
  "cos-shizuku": outfit("shizuku cosplay, short black hair wig, glasses, dark turtleneck, long skirt, vacuum cleaner prop, calm expression, hunter x hunter"),

  // ── Max Exposure Sports ──
  "sports-volleyball": outfit("volleyball uniform, sports bikini top, very short spandex shorts, bare midriff, bare thighs, athletic, volleyball"),
  "sports-boxing": outfit("boxing, sports bra, boxing shorts, boxing gloves, bare midriff, bare stomach, athletic, sweat"),
  "sports-track": outfit("track runner, sprint crop top, micro running shorts, bare midriff, bare thighs, athletic, sweatband"),
  "sports-swim": outfit("competitive swimsuit, one piece swimsuit, high cut, bare thighs, swim cap, goggles on head, athletic"),

  // ── Goth Baddie ──
  "goth-v1": outfit("gothic, black corset top, leather pants, platform boots, heavy eyeliner, dark lipstick, choker with spikes, chain accessories"),
  "goth-v2": outfit("gothic, black mesh crop top, plaid mini skirt, ripped stockings, combat boots, dark makeup, cross necklace, edgy"),
  "goth-v3": outfit("gothic lolita, black and white frilly dress, bonnet, ribbon choker, platform shoes, elegant dark fashion"),
  "goth-plus": outfit("gothic, black string bikini top, leather micro skirt, fishnet stockings, spiked collar, dark lipstick, bare midriff, bare thighs, navel"),

  // ── Back Shots ──
  "back-default": backOutfit("black tank top, fitted black pants"),
  "back-bikini": backOutfit("string bikini, bare back, bare thighs"),
  "back-dress": backOutfit("backless black dress, bare back, elegant"),
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
    if (data[promptId]?.status?.status_str === "error") throw new Error("Failed: " + JSON.stringify(data[promptId].status));
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

  const seed = 55700;
  let count = 0;
  const total = Object.keys(OUTFITS).length;

  for (const [name, positive] of Object.entries(OUTFITS)) {
    count++;
    const prefix = `merrick-v3-${name}-${seed}`;
    console.log(`[${count}/${total}] ${name} — queuing...`);
    const workflow = txt2imgWorkflow(positive, NEGATIVE, seed, prefix);
    const { prompt_id } = await queuePrompt(workflow);
    const outputs = await waitForCompletion(prompt_id);
    const saveNode = Object.values(outputs).find((o) => o.images);
    if (!saveNode?.images?.[0]) throw new Error("No output image");
    await downloadImage(saveNode.images[0].filename, join(OUTPUT_DIR, `${prefix}.png`));
    console.log(`  Saved: ${prefix}`);
  }
  console.log(`\n=== Done. ${total} outfits generated. ===\n`);
}

main().catch(console.error);
