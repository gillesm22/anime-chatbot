/**
 * Merrick V3: Oiled Yoga Instructor (15) + Seven Deadly Sins (7)
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

const ID_OILED = [
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

function oilScene(pose, outfit, bg) {
  return [...ID_OILED, "cowboy shot", pose, outfit, bg, ...QUALITY].join(", ");
}

function sinScene(pose, outfit, bg) {
  return [...ID, "cowboy shot", pose, outfit, bg, ...QUALITY].join(", ");
}

const SCENES = {
  // ── OILED YOGA (15) ──
  "oilyoga-warmup": oilScene(
    "standing, arms above head stretching, eyes closed",
    "sports bra, yoga shorts, oiled arms raised, glistening shoulders, oil dripping down sides, bare midriff",
    "yoga studio, morning sun, warm light catching oil"),

  "oilyoga-forward": oilScene(
    "bending forward, hands on floor, looking at viewer",
    "sports bra, tight shorts riding up, oiled back visible, glistening thighs, oil dripping down legs",
    "yoga studio, mat, mirrors"),

  "oilyoga-warrior": oilScene(
    "warrior pose, lunging deep, arms wide",
    "sports bra, yoga shorts, oiled stomach taut, glistening arms, sweat and oil mixing, fierce expression",
    "yoga studio, sunset through windows"),

  "oilyoga-twist": oilScene(
    "seated twist, looking over shoulder, smirk",
    "sports bra strap falling, oiled shoulder exposed, glistening back, oil pooling in collarbone",
    "yoga studio, mat, soft lighting"),

  "oilyoga-downdog": oilScene(
    "from behind, bent over hands on floor, arched back",
    "tight shorts riding up, oiled thighs glistening, oiled back, sports bra, panty line visible",
    "yoga studio, mirrors reflecting oiled body"),

  "oilyoga-cobra": oilScene(
    "lying on stomach, pushing up with arms, back arched, looking up",
    "sports bra, shorts, oiled back deeply arched, glistening spine, oil running down chest, cleavage",
    "yoga studio, mat, sensual stretch"),

  "oilyoga-splits": oilScene(
    "standing split, one leg raised high",
    "high cut leotard, oiled legs completely glistening, oil dripping from raised thigh, flexible, athletic",
    "yoga studio, barre, impressive"),

  "oilyoga-bridge": oilScene(
    "bridge pose, back arched up, stomach raised",
    "sports bra, shorts, oiled stomach raised and glistening, oil running down sides, navel, arched",
    "yoga studio, mat, dramatic"),

  "oilyoga-waterpour": oilScene(
    "pouring water over head, eyes closed, relief",
    "white sports bra see-through from water and oil, everything visible, shorts clinging, water and oil mixing, dripping",
    "yoga studio, post workout, drenched"),

  "oilyoga-towel": oilScene(
    "wiping neck with towel, head tilted, relaxed smile",
    "sports bra soaked, oiled chest glistening, towel on neck, shorts low on hips, oil and sweat everywhere",
    "yoga studio, post class, catching breath"),

  "oilyoga-pigeon": oilScene(
    "pigeon pose, one leg forward one back, leaning forward",
    "sports bra, shorts, oiled thighs spread in stretch, glistening inner thighs, deep stretch, focused",
    "yoga studio, mat, intimate pose"),

  "oilyoga-handstand": oilScene(
    "handstand, shirt falling toward face",
    "loose tank top falling exposing oiled stomach and underboob, shorts, oiled legs in air, inverted, oil dripping upward",
    "yoga studio, wall assist, gravity pulling oil"),

  "oilyoga-oilup": oilScene(
    "standing, rubbing oil on own arms, looking at viewer, slight smile",
    "sports bra, shorts, applying oil to body, oil bottle nearby, glistening where already applied, pre-workout ritual",
    "yoga studio, morning, preparation"),

  "oilyoga-savasana": oilScene(
    "lying on back, eyes closed, completely relaxed, breathing",
    "sports bra, shorts, fully oiled body glistening in dim light, peaceful expression, oil pooling on collarbones",
    "yoga studio, dim candles, savasana, end of class"),

  "oilyoga-leaving": oilScene(
    "walking away, looking back, satisfied smile",
    "oversized hoodie unzipped showing oiled sports bra underneath, yoga pants, oil still glistening on chest and neck, post workout glow",
    "studio exit, golden hour, leaving class"),

  // ── SEVEN DEADLY SINS (7) ──
  "sin-lust": sinScene(
    "looking at viewer, bedroom eyes, finger on lip",
    "red sheer lingerie, see-through, red silk draped, rose petals on skin, seductive, heart motif, bare everything under sheer fabric",
    "red velvet room, dim red lighting, candles, roses, sensual"),

  "sin-pride": sinScene(
    "standing tall, chin up, looking down at viewer, regal",
    "golden crown, white fur stole open showing gold bikini, gold body chain, scepter, mirror behind, narcissistic, luxurious",
    "throne room, gold everywhere, mirrors, marble, opulent"),

  "sin-greed": sinScene(
    "sitting, surrounded by wealth, smirk, counting money gesture",
    "gold chain bikini, diamond choker, money print fabric draped, gold rings, treasure pile, possessive, dripping in jewelry",
    "vault, gold bars, jewels scattered, money, rich"),

  "sin-wrath": sinScene(
    "standing, fists clenched, fierce expression, intense eyes",
    "torn black outfit, ripped fabric, chains wrapped around arms, fire aesthetic, red accents, battle damaged, fierce, scratches on skin",
    "flames behind, dark red sky, destruction, rage"),

  "sin-gluttony": sinScene(
    "standing, chocolate dripping from mouth, indulgent smile",
    "chocolate dripping on body, whipped cream on skin, strawberry in hand, cake smeared, dessert themed bikini, messy, indulgent, food on skin",
    "pastry kitchen, desserts everywhere, overindulgence"),

  "sin-sloth": sinScene(
    "slouching, half asleep, lazy smile, messy",
    "oversized shirt falling off both shoulders, no pants, panties visible, messy hair, pillow marks on skin, barely dressed, cozy lazy",
    "messy bedroom, unmade bed, afternoon sun through blinds, snacks scattered"),

  "sin-envy": sinScene(
    "standing, side-eye, jealous expression, arms crossed",
    "green themed outfit, emerald corset, snake motifs, green gem choker, poison aesthetic, green smoke, envious, toxic beauty",
    "dark green lighting, snake patterns, jealousy, mirrors showing other figures she envies"),
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
  console.log(`\n=== Done. ${total} renders generated. ===\n`);
}

main().catch(console.error);
