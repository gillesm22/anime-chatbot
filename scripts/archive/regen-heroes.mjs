/**
 * Regenerate hero avatars only (skip lab background).
 * Run: node scripts/regen-heroes.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");
const COMFY_URL = "http://localhost:8188";

function txt2imgWorkflow(positive, negative, width, height, seed) {
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "anything-v5.safetensors" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "4": { class_type: "EmptyLatentImage", inputs: { width, height, batch_size: 1 } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps: 30, cfg: 7.5, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `hero-${Date.now()}` } },
    },
  };
}

async function queuePrompt(workflow) {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workflow),
  });
  if (!res.ok) throw new Error(`Queue failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function waitForCompletion(promptId, timeoutMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    const data = await res.json();
    if (data[promptId]?.outputs) return data[promptId].outputs;
    if (data[promptId]?.status?.status_str === "error") {
      console.error("  ERROR:", JSON.stringify(data[promptId].status));
      throw new Error("Generation failed");
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Timeout waiting for ${promptId}`);
}

async function downloadImage(filename, outputPath) {
  const res = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outputPath, buffer);
  return outputPath;
}

async function generate(positive, negative, width, height, seed, outputPath, label) {
  console.log(`  Generating: ${label}...`);
  const workflow = txt2imgWorkflow(positive, negative, width, height, seed);
  const { prompt_id } = await queuePrompt(workflow);
  console.log(`    Queued: ${prompt_id}`);
  const outputs = await waitForCompletion(prompt_id);
  const saveNode = Object.values(outputs).find((o) => o.images);
  if (!saveNode?.images?.[0]) throw new Error("No output image");
  await downloadImage(saveNode.images[0].filename, outputPath);
  console.log(`    Saved: ${outputPath}`);
}

const AVATAR_NEGATIVE = "low quality, blurry, deformed, text, watermark, signature, worst quality, ugly, bad anatomy, extra fingers, full body, legs, feet, feminine, girl, woman, pale skin, fair skin, light skin";

const HERO_BASE = "masterpiece, best quality, manhwa style, korean webtoon, portrait, upper body, 1boy, solo, handsome young man, sharp jawline, dark tanned skin, brown skin, golden tan, messy silver-white hair, undercut, crimson red eyes, intense gaze, sharp features, lean muscular, confident smirk, pretty boy, ikemen, bishounen, stylish, dark fantasy";

async function main() {
  console.log("=== Regenerating Hero Avatars (manhwa style) ===\n");

  try { await fetch(`${COMFY_URL}/system_stats`); }
  catch { console.error("ComfyUI not running!"); process.exit(1); }

  mkdirSync(join(PUBLIC_DIR, "sprites", "hero"), { recursive: true });

  const HEROES = [
    { id: "avatar", prompt: `${HERO_BASE}, long crimson red coat over dark armor, high collar, blood knight aesthetic, dark prince, broadsword hilt at shoulder, crimson aura, transparent background, png, simple background`, seed: 880000 },
    { id: "mage", prompt: `${HERO_BASE}, dark navy mage coat with silver trim, high collar, glowing arcane circles around hands, crystalline pendant, magical aura, purple energy, mysterious, transparent background, png, simple background`, seed: 880001 },
    { id: "rogue", prompt: `${HERO_BASE}, black leather jacket, dark tactical gear, hood down around neck, silver chain necklace, fingerless gloves, daggers at belt, scar across cheekbone, shadow aesthetic, transparent background, png, simple background`, seed: 880002 },
    { id: "demon", prompt: `${HERO_BASE}, dark spiral horns from temples, black and crimson ornate armor, glowing infernal sigils on skin, dark flames, demon king aesthetic, regal dark prince, molten gold markings, transparent background, png, simple background`, seed: 880003 },
    { id: "angel", prompt: `${HERO_BASE}, luminous white and gold armor, translucent golden wings, divine radiance, holy aura, warm light, celestial markings, flowing white cape, sacred warrior, transparent background, png, simple background`, seed: 880004 },
    { id: "beast", prompt: `${HERO_BASE}, wolf ears, wild wind-swept hair, amber slit-pupiled eyes, open black fur-lined leather coat, no shirt, tribal tattoos on chest, claw marks on arms, feral grin, predator aesthetic, transparent background, png, simple background`, seed: 880005 },
  ];

  for (const hero of HEROES) {
    await generate(hero.prompt, AVATAR_NEGATIVE, 512, 512, hero.seed, join(PUBLIC_DIR, "sprites", "hero", `${hero.id}.png`), `hero/${hero.id}`);
  }

  console.log("\n=== Done! 6 hero avatars regenerated. ===");
}

main().catch(console.error);
