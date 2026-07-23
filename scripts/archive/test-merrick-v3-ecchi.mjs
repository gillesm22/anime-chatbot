/**
 * Merrick V3: Ecchi apartment scenes — 20 renders, max exposure, suggestive poses
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
  // ── Towel / Bath ──
  "ecchi-towel-slip": scene("standing, holding towel, embarrassed", "white towel slipping, bare shoulders, bare thighs, wet skin, wet hair", "steam, after bath"),
  "ecchi-towel-back": scene("from behind, looking back over shoulder", "towel barely covering, bare back, bare legs, wet skin", "steam, after shower"),
  "ecchi-shower": scene("standing, arms up, stretching", "see-through wet white shirt, no bra, bare thighs, wet skin, dripping water", "shower"),

  // ── Bedroom ──
  "ecchi-morning": scene("stretching, arms above head, yawning", "oversized shirt riding up, no pants, panties visible, bare thighs, navel, sleepy", "morning light"),
  "ecchi-bedshirt": scene("looking at viewer, slight blush", "unbuttoned dress shirt, nothing underneath, sideboob, bare thighs, messy hair", "bedroom"),
  "ecchi-lingerie": scene("standing, hand on hip, confident", "black lace lingerie, see-through bra, thong, bare midriff, bare thighs, seductive smile", "bedroom"),
  "ecchi-negligee": scene("leaning forward, cleavage", "sheer negligee, see-through fabric, bare skin visible, no bra, panties visible", "bedroom"),

  // ── Kitchen / Living ──
  "ecchi-apron": scene("looking back over shoulder", "naked apron, bare back, bare thighs, sideboob, apron strings", "kitchen"),
  "ecchi-apron-front": scene("looking at viewer, playful smile", "naked apron, cleavage, bare shoulders, bare thighs, navel peek", "kitchen"),
  "ecchi-dropped": scene("bending forward, reaching down", "tank top, loose shorts falling down, panties visible, cleavage hanging, accidental", "living room"),

  // ── Wardrobe Malfunction ──
  "ecchi-changing": scene("caught off guard, covering chest with arm", "topless, panties only, embarrassed blush, one arm covering breasts, bare stomach", "changing"),
  "ecchi-zipper": scene("looking down, struggling with zipper", "dress stuck half unzipped, bra visible, dress sliding off shoulder, flustered", "getting dressed"),
  "ecchi-strap-slip": scene("looking at viewer, slight surprise", "tank top with strap falling off shoulder, no bra, sideboob, shorts riding up", "casual"),

  // ── Lounging ──
  "ecchi-couch": scene("sitting, legs crossed, leaning back", "oversized hoodie, no pants, bare thighs, hoodie riding up, navel, relaxed", "couch"),
  "ecchi-floor": scene("sitting on floor, knees up", "oversized shirt, panties visible between legs, bare thighs, casual, relaxed", "floor sitting"),
  "ecchi-stretching": scene("standing, arching back, stretching", "crop top riding up, underboob, short shorts, bare midriff, bare stomach, navel", "stretching"),

  // ── Provocative ──
  "ecchi-mirror": scene("looking at reflection, fixing hair", "matching underwear set, bra and panties, bare midriff, bare thighs, mirror", "getting ready"),
  "ecchi-stockings": scene("standing on one leg, putting on stocking", "garter belt, thigh high stockings, panties, bra, bare midriff", "getting dressed"),
  "ecchi-sweater": scene("looking at viewer, playful", "virgin killer sweater, backless, sideboob, bare back, bare thighs, no underwear hint", "teasing"),
  "ecchi-tshirt": scene("standing, wet from rain", "white t-shirt completely see-through, no bra visible through shirt, denim shorts, wet skin, wet hair", "caught in rain"),
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
  console.log(`\n=== Done. ${total} ecchi scenes generated. ===\n`);
}

main().catch(console.error);
