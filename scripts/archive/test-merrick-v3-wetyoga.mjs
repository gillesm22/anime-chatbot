/**
 * Merrick V3: Wet Yoga series — soaked, see-through, 15 unique scenes (no duplicates from previous yoga)
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";

const ID = [
  "(solo:1.5), 1girl, one person",
  "dark brown skin, smooth skin, wet skin, water droplets, sweating",
  "long black hair, hair past waist, straight hair, wet hair clinging to body",
  "green eyes, long eyelashes",
  "pretty face, mature face",
  "mature female, adult, tall, large breasts, slender waist, curvy",
];

const QUALITY = [
  "gold hoop earrings",
  "masterpiece, best quality, highres, anime style",
  "cel shading, clean lineart, sharp focus",
];

const WET_YOGA = "white yoga top completely soaked, see-through wet fabric, nipples visible through fabric, underwear visible through clothes, wet yoga shorts clinging";

function scene(pose, outfit, bg) {
  return [...ID, "cowboy shot", pose, outfit, bg, ...QUALITY].join(", ");
}

const SCENES = {
  "wetyoga-rain-outdoor": scene(
    "standing, arms raised to sky, embracing rain, peaceful",
    `${WET_YOGA}, outdoor yoga in rain, white top transparent, everything visible, rain streaming down body, soaked through`,
    "rooftop yoga, rain pouring, city skyline, dramatic clouds"),

  "wetyoga-sprayed": scene(
    "flinching, laughing, water spraying from side",
    `${WET_YOGA}, hose water spraying her, soaked instantly, top plastered to chest, shorts clinging, water flying`,
    "outdoor garden yoga, someone sprayed the hose, summer"),

  "wetyoga-puddle-splash": scene(
    "mid-lunge, foot splashing puddle, water spraying up",
    `${WET_YOGA}, puddle splash soaking legs and bottom of top, wet from waist down, top getting wet from splash, dripping`,
    "outdoor yoga, after rain, puddles on ground"),

  "wetyoga-bottle-dump": scene(
    "dumping water bottle over head, eyes closed, mouth open, relief",
    `${WET_YOGA}, water cascading over face and body, top instantly transparent, water streaming between breasts, refreshing`,
    "hot yoga studio, extreme heat, desperate to cool down"),

  "wetyoga-tree-pose": scene(
    "tree pose, one foot on thigh, arms up, balanced, dripping",
    `${WET_YOGA}, completely drenched from rain, top see-through showing everything, water running down raised arms, droplets falling from elbows`,
    "outdoor deck, rain, zen garden, balanced in storm"),

  "wetyoga-cat-cow": scene(
    "on hands and knees, back arched down, looking up, wet hair hanging",
    `${WET_YOGA}, soaked top hanging from body, cleavage visible through wet fabric, shorts riding up, water dripping from stomach`,
    "yoga studio, mat soaked, sweat and water puddle"),

  "wetyoga-triangle": scene(
    "triangle pose, side stretch, one arm up one down",
    `${WET_YOGA}, wet top stretched tight across chest from pose, side of body exposed, shorts clinging, water running down side`,
    "outdoor yoga, morning dew, misty, wet grass"),

  "wetyoga-headstand-drip": scene(
    "headstand, legs up, water dripping down body from gravity",
    `${WET_YOGA}, inverted, wet top sliding toward face, stomach and underboob exposed, water running from feet down to chest, gravity pulling`,
    "yoga studio, mat, inverted drip"),

  "wetyoga-steam-room": scene(
    "standing, wiping forehead, steam everywhere, glistening",
    `${WET_YOGA}, steam room yoga, condensation on skin, top completely transparent from humidity, water beading on body, steamy`,
    "steam room, thick steam, glass door, humidity"),

  "wetyoga-fountain": scene(
    "sitting cross legged, fountain water splashing on her, serene despite being drenched",
    `${WET_YOGA}, fountain spray soaking her, water mist, top transparent, meditation despite being soaked, peaceful wet face`,
    "courtyard, stone fountain, water spray, outdoor meditation"),

  "wetyoga-squeeze-top": scene(
    "standing, wringing out soaked top, squeezing water out, looking at viewer",
    `${WET_YOGA}, pulling bottom of top up to wring, stomach and underboob exposed, water pouring from squeezed fabric, bare midriff`,
    "yoga studio, post rain class, wringing out"),

  "wetyoga-child-pose": scene(
    "child pose, forehead on mat, arms stretched forward, back rounded",
    `${WET_YOGA}, soaked top clinging to back showing spine, shorts riding up, wet hair pooling on mat, water on back`,
    "yoga studio, dim lighting, mat puddle, submissive pose"),

  "wetyoga-camel": scene(
    "camel pose, kneeling back bend, chest pushed up to ceiling",
    `${WET_YOGA}, deep backbend, wet top stretched tight over chest pushed skyward, nipples prominent through wet fabric, water dripping off arched body`,
    "yoga studio, dramatic backlight, arched silhouette"),

  "wetyoga-toweloff": scene(
    "standing, pulling wet top off over head mid-removal",
    `wet top halfway off over head, sports bra underneath soaked see-through, bare wet stomach, shorts low on hips, hair tangled in shirt`,
    "yoga studio, changing, had enough of wet clothes"),

  "wetyoga-poolside": scene(
    "standing at pool edge, just climbed out, dripping everywhere",
    `${WET_YOGA}, pool water streaming off body, top completely see-through plastered to skin, shorts transparent, water pouring from hair, glistening in sun`,
    "pool edge, tiles, bright sun, aqua yoga class over"),
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
  console.log(`\n=== Done. ${total} wet yoga renders generated. ===\n`);
}

main().catch(console.error);
