/**
 * Merrick V3: Ecchi batch 2 — 20 more scenes, different vibes
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
  // ── Sleepwear / Late Night ──
  "ecchi2-silk-robe": scene("standing, robe falling open", "silk robe untied, nothing underneath, sideboob, bare thighs, sleepy eyes, messy hair", "late night"),
  "ecchi2-nightgown": scene("standing, stretching arms up", "sheer white nightgown, see-through, panties visible through fabric, bare shoulders", "moonlight"),
  "ecchi2-blanket": scene("standing, holding blanket against chest", "wrapped in bedsheet only, bare shoulders, bare legs, clutching sheet to chest, just woke up", "morning"),
  "ecchi2-oversized-bf": scene("looking at viewer, playful", "boyfriend oversized shirt barely covering, no pants, shirt riding up, bare thighs, one shoulder exposed", "lazy morning"),

  // ── Summer / Heat ──
  "ecchi2-popsicle": scene("looking at viewer, licking lips", "white bikini top, denim cutoffs unbuttoned, bare midriff, sweating, popsicle drip on chest", "summer heat"),
  "ecchi2-hose": scene("standing, wet, laughing", "white sundress completely soaked, see-through clinging to body, no bra visible, bare legs", "garden hose"),
  "ecchi2-sunbathing": scene("standing, pulling down strap", "untied bikini top, tan lines, bare midriff, micro bikini bottom, oiled skin", "sunbathing"),
  "ecchi2-pool": scene("standing, wringing out hair", "micro bikini, wet skin, water dripping, bare midriff, bare thighs, glistening", "poolside"),

  // ── Domestic Accidents ──
  "ecchi2-spill": scene("looking down, surprised", "white tank top with water spilled on chest, see-through wet spot, no bra, shorts", "kitchen accident"),
  "ecchi2-caught": scene("surprised expression, covering with hands", "just removed shirt, topless covering breasts with arms, panties only, embarrassed blush", "walked in on"),
  "ecchi2-yoga": scene("bending forward, looking at viewer between legs", "sports bra, yoga pants pulled down showing waistband, bare midriff, flexible", "yoga"),
  "ecchi2-laundry": scene("reaching up to high shelf, on tiptoes", "crop top riding up showing underboob, panties peeking above shorts, bare stomach, stretching", "doing laundry"),

  // ── Getting Ready ──
  "ecchi2-lotion": scene("applying lotion to leg, looking at viewer", "matching bra and panties, bare midriff, bare thighs, oiled skin, sensual", "getting ready"),
  "ecchi2-hair-dry": scene("blow drying hair, eyes closed", "towel around waist only, topless with hair covering nipples, bare shoulders, relaxed", "after bath"),
  "ecchi2-lipstick": scene("applying lipstick, looking in mirror", "push up bra, garter belt, thigh highs, panties, bare midriff, getting dolled up", "vanity"),

  // ── Playful / Teasing ──
  "ecchi2-pillow": scene("holding pillow against chest, peeking over it", "oversized shirt lifted showing panties, bare thighs, playful shy expression, biting lip", "pillow"),
  "ecchi2-whipped-cream": scene("looking at viewer, finger on lips", "apron with nothing underneath, whipped cream on collarbone, bare shoulders, playful", "baking"),
  "ecchi2-selfie": scene("taking selfie pose, winking", "micro bikini, peace sign, tongue out slightly, bare midriff, bare thighs, flirty", "selfie"),
  "ecchi2-eating": scene("eating strawberry, juice dripping on chin", "loose tank top, no bra, strap falling, shorts riding up, casual messy eating", "snacking"),
  "ecchi2-ice": scene("holding ice cube to neck, eyes half closed", "unbuttoned shirt tied at waist, sweat, bare midriff, ice melting dripping down chest", "hot day"),
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
