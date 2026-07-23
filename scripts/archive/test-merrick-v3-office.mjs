/**
 * Merrick V3: Office series — micro skirt, tight blouse, 15 renders
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

const BASE_OUTFIT = "tight white blouse, unbuttoned, open shirt, cleavage, bursting out, low rise black microskirt, barely covering, bare navel, panties peeking, bare thighs, thigh high stockings, high heels";

const SCENES = {
  "office-arrival": scene(
    "walking, confident stride, hair flowing",
    `${BASE_OUTFIT}, blazer over shoulder, briefcase, morning energy, cleavage`,
    "office lobby, glass doors, city morning light"),

  "office-elevator": scene(
    "standing, checking phone, slight smirk",
    `${BASE_OUTFIT}, blouse tight showing bra outline, skirt barely covering, stocking tops peeking`,
    "elevator, mirror walls, close space, reflection"),

  "office-desk": scene(
    "sitting at desk, leaning forward on elbows, looking at viewer",
    `${BASE_OUTFIT}, blouse gaping between buttons, cleavage, skirt hiked from sitting, stockings visible`,
    "corner office, city skyline through window, laptop, modern desk"),

  "office-copier": scene(
    "leaning on copier, waiting, bored expression",
    `${BASE_OUTFIT}, leaning back against machine, blouse tight across chest, skirt riding up from leaning`,
    "copy room, fluorescent light, papers, small room"),

  "office-presentation": scene(
    "standing, pointing at screen, professional but distracting",
    `${BASE_OUTFIT}, blouse straining from arm raised, underarm, skirt tight on hips, commanding presence`,
    "conference room, projector screen, boardroom table"),

  "office-bending-filing": scene(
    "bending over filing cabinet, looking back",
    `${BASE_OUTFIT}, skirt riding up from bending, panties almost visible, stocking tops exposed, blouse gaping, cleavage hanging`,
    "filing room, cabinet drawers open, papers"),

  "office-watercooler": scene(
    "drinking from cup, head tilted back, water dripping",
    `${BASE_OUTFIT}, water spilled on blouse, see-through wet fabric, nipples visible through fabric, underwear visible through clothes, wet clinging shirt`,
    "office kitchen, water cooler, break room"),

  "office-phonecall": scene(
    "on phone, leaning back in chair, legs on desk",
    `${BASE_OUTFIT}, skirt hiked showing full stocking tops and garters, blouse unbuttoned top two, relaxed, legs crossed on desk`,
    "office, desk, city view, afternoon"),

  "office-stretch": scene(
    "standing, stretching arms behind back, chest forward, eyes closed",
    `${BASE_OUTFIT}, buttons about to pop, blouse pulling apart, bra visible in gaps, micro skirt riding up, relief stretch`,
    "office, window, afternoon sun"),

  "office-lunch": scene(
    "sitting on desk edge, eating, casual, legs dangling",
    `${BASE_OUTFIT}, blouse untucked, top button open, skirt hiked from sitting, chopsticks, relaxed lunch break`,
    "office, desk, takeout containers, casual moment"),

  "office-meeting": scene(
    "sitting, legs crossed, pen to lips, thinking",
    `${BASE_OUTFIT}, skirt riding very high from crossed legs, stocking tops and garter fully visible, blouse tight, attentive`,
    "meeting room, long table, notepad, focused"),

  "office-afterhours": scene(
    "standing by window, looking at city, contemplative",
    `${BASE_OUTFIT}, blouse half unbuttoned showing bra, skirt unzipped slightly, heels off, stockinged feet, winding down`,
    "office, floor to ceiling windows, city lights at night, alone"),

  "office-jacket-off": scene(
    "removing blazer, rolling up sleeves, getting to work",
    `${BASE_OUTFIT}, blazer sliding off shoulders, blouse pulled tight from movement, cleavage, determined expression`,
    "office, desk, papers, busy day ahead"),

  "office-spill": scene(
    "looking down shocked, coffee spilled on blouse",
    `${BASE_OUTFIT}, coffee spilled on white blouse, see-through wet fabric, nipples visible through fabric, underwear visible through clothes, wet clinging shirt, flustered`,
    "office desk, coffee cup tipped, papers wet, accident"),

  "office-overtime": scene(
    "slumped at desk, exhausted but still working, messy hair",
    `${BASE_OUTFIT}, blouse fully unbuttoned showing lace bra, skirt unzipped, stockings with one garter unclipped, glasses on, papers everywhere, midnight`,
    "office, single desk lamp, city lights outside, empty building, late night"),
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
  "chibi",
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
  console.log(`\n=== Done. ${total} office renders generated. ===\n`);
}

main().catch(console.error);
