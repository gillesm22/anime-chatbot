/**
 * Merrick V3: Wet Office series — everything soaked, see-through, 15 unique scenes
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";

const ID = [
  "(solo:1.5), 1girl, one person",
  "dark brown skin, smooth skin, wet skin, water droplets",
  "long black hair, hair past waist, straight hair, wet hair",
  "green eyes, long eyelashes",
  "pretty face, mature face",
  "mature female, adult, tall, large breasts, slender waist, curvy",
];

const QUALITY = [
  "gold hoop earrings",
  "masterpiece, best quality, highres, anime style",
  "cel shading, clean lineart, sharp focus",
];

const WET_BASE = "tight white blouse completely soaked, see-through wet fabric, nipples visible through fabric, underwear visible through clothes, low rise black microskirt, wet clinging clothes";

function scene(pose, outfit, bg) {
  return [...ID, "cowboy shot", pose, outfit, bg, ...QUALITY].join(", ");
}

const SCENES = {
  "wetoffice-sprinkler": scene(
    "standing, arms out, laughing, drenched",
    `${WET_BASE}, fire sprinkler malfunction, water raining down, completely soaked head to toe, blouse transparent, dripping`,
    "office, water spraying from ceiling, papers flying, chaos"),

  "wetoffice-window-rain": scene(
    "leaning against window, melancholic, water streaks",
    `${WET_BASE}, came in from rain, puddle forming at feet, blouse clinging to every curve, skirt dripping, stockings wet`,
    "office, rain streaking window, grey sky, moody lighting"),

  "wetoffice-pipe-burst": scene(
    "shielding face with arm, water spraying, shocked",
    `${WET_BASE}, pipe burst spraying water, blouse plastered to body, completely see-through, skirt soaked clinging, water everywhere`,
    "office bathroom, burst pipe, water spraying, emergency"),

  "wetoffice-plant-water": scene(
    "looking down at self, annoyed, holding watering can",
    `${WET_BASE}, accidentally watered self, water down front of blouse, see-through chest, wet stomach showing through fabric`,
    "office, desk plants, watering can, self-inflicted"),

  "wetoffice-ice-bucket": scene(
    "gasping, ice water just dumped, nipples hard",
    `${WET_BASE}, ice cubes on skin, ice water challenge, blouse frozen see-through, goosebumps, cold, shocked expression`,
    "office break room, ice bucket, dare gone wrong"),

  "wetoffice-sink-splash": scene(
    "looking at viewer, water splash on front, smirking",
    `${WET_BASE}, kitchen sink splashed, water across chest and stomach, blouse wet patches see-through, casual about it`,
    "office kitchen, sink, water splash"),

  "wetoffice-bottle-pour": scene(
    "pouring water bottle over head, eyes closed, cooling down",
    `${WET_BASE}, water pouring from above, streaming down face and body, blouse drenched transparent, relief from heat`,
    "office, summer heat, no AC, desperate"),

  "wetoffice-caught-rain": scene(
    "walking in, wringing out hair, trail of water behind",
    `${WET_BASE}, just arrived from storm, everything soaked, blouse see-through showing bra and nipples, skirt dripping, barefoot holding wet heels`,
    "office entrance, wet floor sign, puddles, stormy outside"),

  "wetoffice-mop": scene(
    "mopping floor, bending, splashing self, frustrated",
    `${WET_BASE}, cleaning up water, splashed self while mopping, blouse soaked from splashback, bent over showing cleavage through wet fabric`,
    "office hallway, wet floor, mop and bucket"),

  "wetoffice-elevator-drip": scene(
    "standing in elevator, dripping, uncomfortable smile",
    `${WET_BASE}, soaking wet in small space, water dripping everywhere, blouse completely transparent, reflection in elevator mirror`,
    "elevator, small space, mirror walls, dripping puddle forming"),

  "wetoffice-ac-condensation": scene(
    "standing under AC vent, condensation dripping on her",
    `${WET_BASE}, AC dripping cold water on her, wet spots spreading on blouse, shivering, nipples visible from cold, arms crossed under bust`,
    "office, AC vent above, cold drops"),

  "wetoffice-presentation-spill": scene(
    "standing at front, water pitcher spilled down front, mortified",
    `${WET_BASE}, entire water pitcher soaked her front, blouse transparent from neckline to waist, still trying to present professionally`,
    "conference room, projection screen, audience POV, accident"),

  "wetoffice-car-splash": scene(
    "standing, just been splashed by car, dripping, angry expression",
    `${WET_BASE}, muddy water splash from passing car, blouse filthy and see-through, skirt clinging, wet stockings, furious`,
    "office building entrance, street puddle, rainy day"),

  "wetoffice-champagne": scene(
    "standing, champagne sprayed on her, laughing",
    `${WET_BASE}, champagne bottle popped spraying, bubbly soaking blouse see-through, sticky wet fabric clinging, celebrating`,
    "office celebration, desk decorations, party, end of quarter"),

  "wetoffice-drying": scene(
    "standing by hand dryer, blouse held open to dry, everything exposed",
    `${WET_BASE}, using bathroom hand dryer on soaked blouse, blouse pulled open to dry, bra and body fully visible, practical not sexy but very sexy`,
    "office bathroom, hand dryer, trying to salvage the situation"),
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
  console.log(`\n=== Done. ${total} wet office renders generated. ===\n`);
}

main().catch(console.error);
