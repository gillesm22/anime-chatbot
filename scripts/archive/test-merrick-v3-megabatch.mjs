/**
 * Merrick V3: Mega batch — clown, witch, sally, gyaru, cosplays, bonus
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";

const BASE = [
  "(solo:1.5), 1girl, one person",
  "white background, simple background, transparent background, png",
  "dark brown skin, smooth skin",
  "long black hair, hair past waist, straight hair",
  "green eyes, long eyelashes",
  "pretty face, mature face",
  "mature female, adult, tall, large breasts, slender waist, curvy",
  "cowboy shot, looking at viewer, standing, hand on hip",
];

const SUFFIX = [
  "gold hoop earrings",
  "masterpiece, best quality, highres, anime style, visual novel sprite, game cg",
  "cel shading, clean lineart, sharp focus",
];

function outfit(tags) {
  return [...BASE, tags, ...SUFFIX].join(", ");
}

const OUTFITS = {
  // ── Clown ──
  "clown": outfit("jester outfit, colorful ruffled collar, jester hat with bells, face paint, playful smile, polka dot top, puffy shorts"),
  "clown-plus": outfit("string bikini, jester hat with bells, face paint, polka dot pattern, bare midriff, bare thighs, bare stomach, navel, cleavage, playful"),

  // ── Witch ──
  "witch": outfit("witch, black witch hat, black dress, cape, magic wand, crescent moon choker, mystical"),

  // ── Sally (Nightmare Before Christmas) ──
  "sally-v1": outfit("patchwork dress, stitched pattern, blue and red fabric patches, stitches on skin, ragdoll aesthetic, long dress"),
  "sally-v2": outfit("patchwork crop top, patchwork skirt, stitched pattern, blue and purple patches, stitches on arms, ragdoll style"),
  "sally-v3": outfit("tattered patchwork dress, exposed shoulders, mismatched fabric patches, stitch marks, gothic ragdoll, bare legs"),

  // ── Gyaru ──
  "gyaru-v1": outfit("kogal, loose socks, short plaid skirt, cropped cardigan, school bag charm, peace sign, trendy"),
  "gyaru-v2": outfit("hime gyaru, pink frilly dress, platform boots, big hair accessories, pearl necklace, princess style"),
  "gyaru-v3": outfit("ganguro, heavy tan makeup, white eyeliner, bright colored crop top, mini skirt, platform sandals, colorful bracelets"),

  // ── Cosplays — Waifus ──
  "cos-boa-hancock": outfit("boa hancock cosplay, long snake earrings, qipao dress, thigh slit, empress pose, one piece"),
  "cos-yoruichi": outfit("yoruichi cosplay, orange top, black pants, purple hair clip, athletic, bleach"),
  "cos-robin": outfit("nico robin cosplay, cowboy hat, leather jacket, sunglasses on head, one piece"),
  "cos-2b": outfit("2b cosplay, black blindfold, black gothic dress, white collar, thigh high boots, nier automata"),

  // ── Cosplays — Art / Different ──
  "cos-picasso": outfit("cubist body paint, geometric face paint, abstract color blocks on skin, avant garde, blue period inspired, artistic"),
  "cos-cleopatra": outfit("cleopatra, gold headdress, white linen wrap dress, gold arm bands, egyptian eyeliner, royal, cobra crown"),
  "cos-medusa": outfit("medusa, snake hair ornaments, scaled bodysuit, gold snake armband, slit pupils, mythological"),

  // ── Bonus 10 ──
  "bonus-kunoichi": outfit("kunoichi, short kimono, fishnet stockings, kunai holster, ninja headband, thigh wrap"),
  "bonus-racing": outfit("racing queen, tight bodysuit, sponsor logos, checkered flag pattern, knee high boots, sporty"),
  "bonus-jazz": outfit("jazz singer, sparkly black sequin dress, long gloves, microphone, smoky eyes, elegant"),
  "bonus-amazonian": outfit("amazonian warrior, leather chest wrap, leather skirt, arm bracers, spear, tribal jewelry, fierce"),
  "bonus-bunny": outfit("bunny girl, black bunny leotard, bunny ears headband, wrist cuffs, pantyhose, bow tie collar"),
  "bonus-pirate": outfit("pirate, tricorn hat, open white shirt, corset belt, cutlass, thigh high boots, adventurous"),
  "bonus-samurai": outfit("female samurai, kimono open shoulder, katana, red obi sash, hakama pants, warrior"),
  "bonus-cyberpunk": outfit("cyberpunk, neon visor, techwear crop jacket, holographic top, cargo pants, led accents, futuristic"),
  "bonus-flamenco": outfit("flamenco dancer, red ruffled dress, off shoulder, rose in hair, dramatic pose, spanish"),
  "bonus-catgirl": outfit("cat ears, cat tail, paw gloves, bell collar, crop top, short shorts, playful, neko"),
};

const NEGATIVE = [
  "low quality, worst quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature",
  "multiple girls, 2girls, multiple characters, split screen, mirror, reflection, duo",
  "ugly, duplicate, extra limbs, poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, panels, borders, frames",
  "props, furniture, background objects",
  "blonde hair, silver hair, white hair, pink hair, red hair",
  "pale skin, fair skin",
  "blue eyes, violet eyes, red eyes",
  "close-up, portrait, full body",
  "sitting, kneeling",
  "background, grey background, gradient background",
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
    if (data[promptId]?.status?.status_str === "error") throw new Error("Failed: " + JSON.stringify(data[promptId].status));
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

  const seed = 55700; // proven best seed
  let count = 0;
  const total = Object.keys(OUTFITS).length;

  for (const [name, positive] of Object.entries(OUTFITS)) {
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
  console.log(`\n=== Done. ${total} outfits generated. ===\n`);
}

main().catch(console.error);
