/**
 * Merrick V3: Wet Volleyball series — solo, max energy, 10 renders
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";

const ID = [
  "(solo:1.5), 1girl, one person",
  "dark brown skin, smooth skin, wet skin, sweating, glistening",
  "long black hair, hair past waist, straight hair, wet hair",
  "green eyes, long eyelashes",
  "pretty face, mature face",
  "mature female, adult, tall, large breasts, slender waist, curvy, athletic",
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
  "volley-spike": scene(
    "jumping, arm raised to spike, intense expression, mid-air",
    "white bikini top, red micro shorts, bare midriff, bare thighs, sweat flying, athletic, volleyball in air",
    "beach volleyball court, sand, blue sky, sun"),

  "volley-dive": scene(
    "diving sideways, reaching for ball, sand flying",
    "white bikini top, red micro shorts, sand on wet skin, bare midriff, bare thighs, athletic dive, determined",
    "beach volleyball court, sand spraying, action shot"),

  "volley-serve": scene(
    "serving, arm back, ball toss, focused eyes",
    "white bikini top, red micro shorts, bare midriff, arm muscles taut, sweat dripping, competitive",
    "beach volleyball court, net, sand, bright sun"),

  "volley-celebrate": scene(
    "fist pump, victory pose, huge grin, triumphant",
    "white bikini top soaked with sweat, red micro shorts, bare midriff, glistening, sand on thighs, celebrating win",
    "beach volleyball court, net behind, sunset"),

  "volley-waterpour": scene(
    "pouring water over head, eyes closed, cooling down",
    "white bikini top see-through from water, nipples visible through wet fabric, red micro shorts clinging, water streaming down body",
    "beach sideline, bench, towel, post match"),

  "volley-towel": scene(
    "wiping face with towel, looking at viewer, exhausted satisfied smile",
    "bikini top pulled aside slightly, towel around neck, shorts low on hips, sweaty glistening skin, sand stuck to wet thighs",
    "beach, sideline, sunset, cooling down"),

  "volley-stretch-pre": scene(
    "stretching leg, one foot up on bench, bending forward",
    "tight sports bikini top, micro shorts, bare midriff, stretching hamstring, cleavage from bending, pre-game warmup",
    "beach, morning light, net being set up"),

  "volley-sand-sit": scene(
    "sitting on sand, knees up, arms behind, leaning back",
    "bikini top, shorts pulled up from sitting, sand all over wet legs, relaxed, post-game, water bottle beside her",
    "beach, sunset, volleyball net silhouette behind"),

  "volley-net-lean": scene(
    "leaning on volleyball net, arms draped over, cocky smirk",
    "sweaty bikini top clinging, micro shorts, bare midriff, net pressing into chest, dominant energy, winner's attitude",
    "beach court, net, golden hour, sand"),

  "volley-shower": scene(
    "standing under outdoor beach shower, head back, water raining down",
    "white bikini completely see-through from shower, nipples visible, underwear visible, water cascading over entire body, sand washing off, eyes closed, relief",
    "beach shower post, wooden deck, ocean behind, rinse off"),
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
  console.log(`\n=== Done. ${total} volleyball renders generated. ===\n`);
}

main().catch(console.error);
