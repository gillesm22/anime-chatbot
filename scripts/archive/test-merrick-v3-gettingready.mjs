/**
 * Merrick V3: Getting Ready series — the full ritual, max appeal, with backgrounds
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

function scene(pose, outfit, bg) {
  return [...ID, "cowboy shot", pose, outfit, bg, ...QUALITY].join(", ");
}

const SCENES = {
  // ── Fresh out the shower ──
  "ready-shower": scene(
    "stepping out, wet hair dripping, relaxed expression",
    "towel wrapped loosely, bare shoulders, bare legs, wet skin, steam on skin, water droplets",
    "luxury bathroom, glass shower behind, marble tiles, warm lighting, steam"),

  "ready-hairdry": scene(
    "blow drying hair, eyes closed, peaceful",
    "towel around waist only, topless with hair covering, bare back visible, wet skin drying",
    "bathroom vanity, mirror, warm bulb lighting, hair products"),

  // ── Choosing the outfit ──
  "ready-closet": scene(
    "standing in front of closet, hand on chin, thinking",
    "matching bra and panties, bare midriff, bare thighs, holding dress on hanger in one hand",
    "walk-in closet, clothes hanging, shoe rack, full length mirror, warm lighting"),

  "ready-options": scene(
    "holding two dresses up, comparing, playful pout",
    "strapless bra, panties, bare midriff, bare thighs, holding black dress and red dress",
    "bedroom, dresses laid on bed, shoes on floor, getting ready mess"),

  "ready-trying-on": scene(
    "pulling dress up over hips, looking down",
    "black dress half on, dress bunched at waist, bra visible above, bare thighs below, struggling",
    "bedroom, full length mirror, soft evening light"),

  // ── Makeup ritual ──
  "ready-lipstick": scene(
    "applying red lipstick, looking in mirror, focused",
    "black lace bra, matching panties, sitting at vanity, bare midriff, bare thighs",
    "vanity table, round mirror with lights, makeup scattered, perfume bottles"),

  "ready-mascara": scene(
    "applying mascara, mouth slightly open, concentrated",
    "silk robe open, lingerie underneath visible, bare chest peeking, one eye done",
    "bathroom mirror, close warm lighting, makeup bag open"),

  "ready-perfume": scene(
    "spraying perfume on neck, eyes half closed, sensual",
    "black dress on but unzipped in back, bare back, holding perfume bottle, slight smile",
    "bedroom, evening light, candles, sophisticated"),

  // ── Hair styling ──
  "ready-curling": scene(
    "curling hair, arm raised, looking at mirror",
    "silk robe falling off one shoulder, bare shoulder, cleavage visible, bare thigh from robe slit",
    "vanity mirror, warm lighting, hair tools, evening prep"),

  "ready-updo": scene(
    "arms up pinning hair, arching slightly",
    "backless top, bare back completely exposed, hair pins in mouth, bare midriff, concentrated",
    "bathroom mirror, bobby pins scattered, elegant"),

  // ── Almost ready ──
  "ready-stockings": scene(
    "standing on one leg, pulling up stocking slowly",
    "black dress hiked up, garter belt visible, rolling thigh high stocking up leg, focused, sensual",
    "bedroom, sitting on bed edge, heels waiting on floor, evening light"),

  "ready-heels": scene(
    "bending to buckle heel strap, cleavage hanging",
    "tight black dress, deep neckline, cleavage from bending angle, one heel on one in hand",
    "entryway, full length mirror, clutch purse on table, about to leave"),

  "ready-jewelry": scene(
    "clasping necklace behind neck, looking in mirror",
    "strapless black dress, bare shoulders, bare collarbone, jade pendant being put on, elegant",
    "vanity mirror, jewelry box open, soft lighting, final touches"),

  // ── Final look ──
  "ready-final": scene(
    "standing, hand on hip, confident knowing smile",
    "stunning black dress, thigh slit, heels, jade pendant, red lips, hair done, full glam complete",
    "doorway, about to leave, warm interior light behind, keys in hand"),

  "ready-selfie": scene(
    "taking mirror selfie, slight smirk, phone in hand",
    "complete outfit, tight dress, heels, makeup done, hair perfect, confident, showing off",
    "full length mirror, bedroom behind, evening lighting, date night ready"),

  // ── Post-date return ──
  "ready-return": scene(
    "leaning against door, tired happy smile, heels in hand",
    "dress slightly disheveled, one strap falling, barefoot, messy hair, smudged lipstick, content",
    "apartment doorway, keys dangling, late night, warm hallway light"),

  "ready-undress": scene(
    "reaching behind to unzip, relieved expression",
    "dress unzipping, bare back emerging, kicking off one heel, hair let down, end of night",
    "bedroom, bed visible behind, dim lamp light, winding down"),
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
  console.log(`\n=== Done. ${total} getting ready renders generated. ===\n`);
}

main().catch(console.error);
