/**
 * Merrick V3: Día de los Muertos series — deep cultural exploration
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";

const ID = [
  "(solo:1.5), 1girl, one person",
  "dark brown skin, smooth skin",
  "long black hair, hair past waist, straight hair",
  "green eyes, long eyelashes",
  "pretty face, mature face",
  "mature female, adult, tall, large breasts, slender waist, curvy",
];

const QUALITY = [
  "gold hoop earrings",
  "masterpiece, best quality, highres, anime style",
  "cel shading, clean lineart, sharp focus",
];

function scene(pose, outfit, extra) {
  return [...ID, "cowboy shot", pose, outfit, extra || "", ...QUALITY].join(", ");
}

const SCENES = {
  // ── Classic Catrina ──
  "dotd-catrina": scene("standing, elegant pose, hand on hip",
    "sugar skull face paint, black around eyes, flower nose, web pattern on forehead, red lips, marigold flower crown, off-shoulder black dress, lace veil, skeleton hand jewelry",
    "dia de los muertos, catrina"),

  "dotd-catrina-elegant": scene("standing, hands clasped in front, serene",
    "elaborate sugar skull makeup, diamond eye patterns, heart on chin, marigold and red rose flower crown, long elegant black gown, sheer lace sleeves, candle motifs",
    "dia de los muertos, la catrina, elegant"),

  // ── Floral / Ofrenda ──
  "dotd-marigold": scene("looking at viewer, gentle smile",
    "sugar skull face paint, marigold petals in hair, cempasuchil flower crown, marigold garlands draped on body, orange and gold dress, bare shoulders",
    "dia de los muertos, ofrenda, marigold"),

  "dotd-ofrenda": scene("looking at viewer, solemn beautiful expression",
    "half face sugar skull paint, candle motif on cheek, marigold behind ear, traditional embroidered blouse, colorful mexican embroidery, cross necklace, papel picado pattern on skirt",
    "dia de los muertos, altar"),

  // ── Modern / Sexy Catrina ──
  "dotd-modern": scene("hand on hip, confident smirk",
    "sugar skull face paint, roses around eyes, corset top, high slit skirt, skeleton print stockings, red and black, marigold in hair, modern catrina",
    "dia de los muertos, sexy catrina"),

  "dotd-bodysuit": scene("standing, both hands visible, seductive",
    "sugar skull face paint, black bodysuit with skeleton print, bone pattern on bodysuit, bare midriff cutout, flower crown, painted collar bones",
    "dia de los muertos, skeleton bodysuit"),

  "dotd-exposed": scene("looking at viewer, confident",
    "sugar skull face paint, skeleton body paint on torso, painted ribs on bare skin, marigold bikini top, long flowing skirt with slit, flowers in hair, painted spine",
    "dia de los muertos, body paint"),

  // ── Traditional Elements ──
  "dotd-folklorico": scene("standing, skirt held out slightly",
    "sugar skull face paint, traditional folklorico dress, wide colorful ruffled skirt, embroidered top, ribbons in hair, marigold crown, mexican folk dance dress",
    "dia de los muertos, folklorico"),

  "dotd-adelita": scene("standing, fierce expression, hand on hip",
    "sugar skull face paint, soldadera outfit, ammunition belt across chest, wide brimmed hat, braids with ribbons, off-shoulder peasant blouse, long skirt, revolutionary",
    "dia de los muertos, adelita, revolucion"),

  "dotd-bride": scene("standing, mysterious smile, veil flowing",
    "sugar skull bride makeup, black widow veil, white and black wedding dress, dead roses bouquet, skeleton hand gloves, tears painted on cheek, ghostly bride",
    "dia de los muertos, bride of death"),

  // ── Artistic / Surreal ──
  "dotd-half": scene("looking at viewer, split expression",
    "half face sugar skull paint half natural face, contrast living and dead, one eye decorated one natural, marigold on skull side, single tear on living side",
    "dia de los muertos, duality"),

  "dotd-neon": scene("looking at viewer, glowing aesthetic",
    "neon sugar skull face paint, glowing paint, UV reactive skull pattern, neon marigold crown, black crop top, neon skeleton lines on arms, blacklight",
    "dia de los muertos, neon, modern"),

  "dotd-gold": scene("standing, regal pose",
    "gold sugar skull face paint, gold leaf on face, metallic gold skull pattern, gold flower crown, black and gold dress, gold skeleton jewelry, luxurious",
    "dia de los muertos, gold catrina"),

  // ── Symbolic ──
  "dotd-monarch": scene("standing, butterflies around",
    "sugar skull face paint, monarch butterfly wings pattern on face, monarch butterflies in hair, orange and black dress, butterfly motifs, migration symbol",
    "dia de los muertos, mariposa monarca"),

  "dotd-copal": scene("standing, eyes half closed, peaceful",
    "sugar skull face paint, copal smoke wisps around, incense aesthetic, traditional huipil dress, cross necklace, rosary beads, serene spiritual expression",
    "dia de los muertos, spiritual, copal"),
};

const NEGATIVE = [
  "low quality, worst quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature",
  "multiple girls, 2girls, multiple characters, split screen, mirror, reflection, duo",
  "ugly, duplicate, extra limbs, poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, panels, borders, frames",
  "blonde hair, silver hair, white hair, pink hair, red hair",
  "pale skin, fair skin",
  "blue eyes, violet eyes, red eyes",
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

  const seed = 55700;
  let count = 0;
  const total = Object.keys(SCENES).length;

  for (const [name, positive] of Object.entries(SCENES)) {
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
  console.log(`\n=== Done. ${total} Día de los Muertos renders generated. ===\n`);
}

main().catch(console.error);
