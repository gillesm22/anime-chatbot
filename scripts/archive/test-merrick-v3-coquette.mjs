/**
 * Merrick V3: Coquette series — soft feminine, ribbons, bows, lace, pink, max appeal
 * With background context for each scene
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
  // ── Bedroom Coquette ──
  "coquette-bedroom": scene(
    "sitting on bed edge, legs crossed, playful smile",
    "pink satin ribbon bra, matching pink ribbon panties, white bow choker, sheer pink robe open, lace trim, bare shoulders, bare thighs, pink nail polish",
    "soft pink bedroom, fairy lights, plush pillows, warm lighting, pastel aesthetic"),

  "coquette-mirror": scene(
    "looking at reflection, applying blush, coy expression",
    "white lace corset, pink ribbon lacing, tiny pink bow on chest, matching white lace panties, sheer white stockings, pink garter ribbons",
    "vanity mirror, soft lighting, perfume bottles, rose petals scattered"),

  // ── Lingerie Coquette ──
  "coquette-ribbon": scene(
    "standing, hand on hip, confident pout",
    "pink ribbon wrapped around body, ribbon bikini, bows on hips, ribbon choker with heart pendant, bare midriff, bare thighs, barely covered by ribbons only",
    "soft pink background, floating rose petals"),

  "coquette-babydoll": scene(
    "standing, playing with hair, innocent expression",
    "sheer pink babydoll nightgown, see-through fabric, matching panties visible underneath, tiny bows on straps, lace hem, bare shoulders",
    "bedroom, morning sunlight through curtains, soft glow"),

  "coquette-bustier": scene(
    "leaning forward slightly, cleavage, doe eyes",
    "white satin bustier with pink bows, push up, garter belt, pink thigh high stockings with bows, matching panties, lace details",
    "boudoir, chaise lounge, champagne glass, elegant"),

  // ── Going Out Coquette ──
  "coquette-minidress": scene(
    "standing, hand on hip, looking over shoulder",
    "pink satin mini dress, very short, spaghetti straps, deep neckline, bow on back, bare thighs, strappy heels, small pink purse",
    "city night, neon lights reflection, date night"),

  "coquette-cafe": scene(
    "sitting, legs crossed, coffee in hand, slight smile",
    "off-shoulder white blouse with pink bows, micro plaid skirt, white knee high socks, mary jane shoes, pearl bracelet, cherry lip gloss",
    "parisian cafe, outdoor seating, warm afternoon light"),

  "coquette-shopping": scene(
    "standing, shopping bags, happy expression",
    "cropped pink cardigan open over white lace bralette, pleated mini skirt, pink ribbon in hair, bare midriff, thigh gap",
    "boutique storefront, pink awning, city street"),

  // ── Max Coquette ──
  "coquette-allribbon": scene(
    "standing, arms slightly behind, pushing chest forward",
    "body wrapped entirely in pink and white ribbons, ribbon bikini barely covering, bows at each hip, bow choker, ribbon garters on thighs, maximum skin between ribbons",
    "soft pink studio, floating ribbons, dreamy"),

  "coquette-hearts": scene(
    "looking at viewer, finger on lip, innocent but knowing",
    "heart shaped pasties, pink micro thong, heart choker, heart garter, sheer pink wrap barely there, bare everything, hearts only covering essentials",
    "valentines aesthetic, hearts background, pink and red"),

  "coquette-ballerina": scene(
    "standing on tiptoes, graceful pose, arms up",
    "white ballet leotard high cut, pink tutu micro skirt, ballet slippers, ribbon laced up calves, sheer fabric, bare shoulders, bare thighs",
    "dance studio, mirror wall, ballet barre, soft natural light"),

  "coquette-bath": scene(
    "standing, wet, towel in hand not covering",
    "pink bow in wet hair, pink ribbon choker, bare skin, bubble bath suds barely covering, pink rose petals on skin, wet glistening, coy smile",
    "luxury bathroom, marble, candles, rose petal bath, steam"),
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
  console.log(`\n=== Done. ${total} coquette renders generated. ===\n`);
}

main().catch(console.error);
