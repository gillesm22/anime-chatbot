/**
 * Generate lab background + hero class avatars via ComfyUI API.
 * Run: node scripts/generate-extras.mjs
 * Requires ComfyUI running on localhost:8188
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
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `extras-${Date.now()}` } },
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

const BG_NEGATIVE = "low quality, blurry, text, watermark, signature, worst quality, people, person, character, figure, anime girl, anime boy";
const AVATAR_NEGATIVE = "low quality, blurry, deformed, text, watermark, signature, worst quality, ugly, bad anatomy, extra fingers, full body, legs, feet";

async function main() {
  console.log("=== Generating Lab Background + Hero Avatars ===\n");

  try { await fetch(`${COMFY_URL}/system_stats`); }
  catch { console.error("ComfyUI not running!"); process.exit(1); }

  // --- Lab Background ---
  console.log("\n--- Lab Background (Steins;Gate Future Gadget Lab) ---\n");
  await generate(
    "masterpiece, best quality, anime style, detailed background, no people, empty room, steins gate, future gadget laboratory, messy apartment lab, cluttered desk, CRT monitors, old computer screens, green text on monitors, microwave oven on shelf, tangled wires, cables, circuit boards, dim lighting, warm lamp light, blue monitor glow, cramped room, bookshelves, scientific equipment, oscilloscope, soldering iron, metal shelves, posters on wall, night time, cozy dark atmosphere, anime background art, makoto shinkai style lighting",
    BG_NEGATIVE,
    768, 512, 999999,
    join(PUBLIC_DIR, "backgrounds", "bg-lab.png"),
    "bg-lab (Future Gadget Lab)"
  );

  // --- Hero Avatars ---
  mkdirSync(join(PUBLIC_DIR, "sprites", "hero"), { recursive: true });

  const HEROES = [
    {
      id: "mage",
      prompt: "masterpiece, best quality, anime style, portrait, upper body, 1boy, mysterious arcane scholar, deep midnight-blue robes, silver runes on robes, glowing runes, crystalline pendant on chest, violet glowing eyes, flowing silver hair, magical aura, mana particles, calm authority, elegant, transparent background, png, simple background",
      seed: 770001,
    },
    {
      id: "rogue",
      prompt: "masterpiece, best quality, anime style, portrait, upper body, 1boy, shadow walker, charcoal-grey leather armor, dark hood half-shadowing face, sharp silver eyes, scanning gaze, faint scar on cheekbone, twin daggers at hips, lithe build, mysterious, transparent background, png, simple background",
      seed: 770002,
    },
    {
      id: "demon",
      prompt: "masterpiece, best quality, anime style, portrait, upper body, 1boy, dark sovereign, dark spiral horns from temples, molten gold burning eyes, black and violet flames on shoulders, ornate dark armor, glowing infernal sigils, hauntingly beautiful sharp features, regal commanding presence, transparent background, png, simple background",
      seed: 770003,
    },
    {
      id: "angel",
      prompt: "masterpiece, best quality, anime style, portrait, upper body, 1boy, light bearer, luminous translucent gold wings, hair like spun light, compassionate cerulean blue eyes, flowing white and gold garments, soft warm radiance, sacred presence, gentle expression, transparent background, png, simple background",
      seed: 770004,
    },
    {
      id: "beast",
      prompt: "masterpiece, best quality, anime style, portrait, upper body, 1boy, wild hunter, wolf ears through wild wind-swept hair, amber slit-pupiled eyes, lean muscular, weathered leather and fur clothing, claw-mark scars on forearms, feral untamed energy, predatory grace, transparent background, png, simple background",
      seed: 770005,
    },
  ];

  console.log("\n--- Hero Class Avatars ---\n");
  for (const hero of HEROES) {
    await generate(
      hero.prompt,
      AVATAR_NEGATIVE,
      512, 512, hero.seed,
      join(PUBLIC_DIR, "sprites", "hero", `${hero.id}.png`),
      `hero/${hero.id}`
    );
  }

  console.log("\n=== Done! 6 images generated (1 background + 5 hero avatars). ===");
}

main().catch(console.error);
