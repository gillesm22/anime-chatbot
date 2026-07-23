/**
 * Merrick V3: Oiled Teacher ecchi series — 15 renders
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";

const ID = [
  "(solo:1.5), 1girl, one person",
  "dark brown skin, smooth skin, oiled skin, glistening, shiny skin, body oil",
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
  "oilteach-chalkboard": scene(
    "writing on chalkboard, arm raised, back turned, looking back over shoulder",
    "white blouse soaked see-through, no bra visible through wet fabric, pencil skirt riding up, stocking tops visible, oiled legs, sweating",
    "classroom, chalkboard, hot summer no AC"),

  "oilteach-desk-lean": scene(
    "leaning on desk, arms pushing breasts together, looking over glasses",
    "white blouse unbuttoned showing oiled cleavage, bra visible, pencil skirt hiked, glistening chest, oil dripping down neck, glasses",
    "classroom, desk, papers, after hours"),

  "oilteach-grading": scene(
    "leaning back in chair, fanning self with papers, exhausted",
    "blouse fully open, black lace bra exposed, oiled stomach visible, skirt unzipped, glistening skin, sweating, glasses on desk",
    "office, desk lamp, late night, papers scattered, summer heat"),

  "oilteach-water-spill": scene(
    "looking down surprised, water bottle spilled on chest",
    "white blouse completely see-through from water and oil, nipples visible through wet fabric, skirt, glistening, wet, dripping",
    "classroom, spilled water bottle, accident"),

  "oilteach-lotion": scene(
    "applying lotion to legs, one foot on chair, looking at viewer",
    "blouse open, bra only on top, pencil skirt hiked to waist showing panties and garters, oiling thighs, glistening legs",
    "classroom, behind desk, private moment, thinking no one watching"),

  "oilteach-stretch": scene(
    "stretching arms behind back, chest pushed forward, eyes closed",
    "blouse straining buttons popping, oiled cleavage, bra visible through gaps, skirt tight, glistening arms, relief stretch",
    "classroom, between classes, sunlight through window"),

  "oilteach-ruler": scene(
    "holding ruler against oiled thigh, stern smirk",
    "blouse tied under bust showing oiled midriff, micro skirt, stockings with garters, glistening stomach, ruler pressed against skin",
    "classroom, detention, desk lamp, after hours"),

  "oilteach-blackboard-press": scene(
    "pressed against chalkboard, chalk dust on oiled skin",
    "blouse pulled down off shoulders, bra exposed, chalk marks on oiled breasts, skirt hiked, oiled thighs, messy",
    "chalkboard, chalk dust mixing with oil on skin"),

  "oilteach-bookdrop": scene(
    "bending over to pick up dropped books, cleavage hanging",
    "blouse gaping wide open from bending, oiled breasts hanging, bra barely containing, skirt riding up from behind, panties visible, oiled thighs",
    "classroom, books scattered on floor"),

  "oilteach-sitting-spread": scene(
    "sitting on desk, legs slightly apart, leaning back on hands",
    "blouse open three buttons, oiled chest glistening, skirt pushed up showing stocking tops and garters, oiled thighs spread, confident",
    "desk, papers pushed aside, classroom"),

  "oilteach-hair": scene(
    "letting hair down, shaking it loose, oil mist",
    "blouse untucked and open, oiled bare stomach, lace bra, skirt loosened, glistening everything, hair sticking to oiled shoulders",
    "classroom, end of day, golden hour light catching oil"),

  "oilteach-mirror": scene(
    "looking in small mirror, fixing makeup, oil smeared",
    "blouse hanging open, oiled skin everywhere, bra and panties visible, skirt around ankles, glistening body, compact mirror in hand",
    "teacher bathroom, mirror, private"),

  "oilteach-pour": scene(
    "pouring water over self to cool down, head back",
    "white blouse completely transparent from water and oil, everything visible, skirt clinging, water running down oiled body, mouth open, relief",
    "classroom, summer heat, desperate to cool down"),

  "oilteach-apple": scene(
    "biting apple, juice mixing with oil on chin, playful",
    "blouse open showing oiled cleavage and bra, apple juice dripping on oiled chest, skirt hiked, sitting on desk edge, messy eating",
    "classroom, desk, teacher's apple"),

  "oilteach-afterclass": scene(
    "standing, blouse fully open, satisfied expression, hands on hips",
    "blouse open showing full oiled torso, lace bra, oiled stomach, skirt unzipped showing panty waistband, stockings, glistening head to toe, glasses in hand, completely let go",
    "empty classroom, chalkboard says see you tomorrow, lights dimming"),
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
  console.log(`\n=== Done. ${total} oiled teacher renders generated. ===\n`);
}

main().catch(console.error);
