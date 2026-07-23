/**
 * Generate character art via ComfyUI API.
 * Run: node scripts/generate-art.mjs
 * Requires ComfyUI running on localhost:8188
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES_DIR = join(__dirname, "..", "public", "sprites");
const COMFY_URL = "http://localhost:8188";

const BASE_NEGATIVE = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, duplicate, morbid, mutilated, extra limbs, poorly drawn face, mutation, bad proportions";

// Character base prompts
const CHARS = {
  arisu: {
    base: "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, simple background, 1girl, long hair, wavy hair, silver-pink hair, hair past waist, violet eyes, gentle eyes, fair skin, porcelain skin, white blouse, pink ribbon, cardigan, cherry blossom hair ornament, kyoto animation style",
    faceBase: "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, simple background, upper body, portrait, 1girl, long hair, wavy hair, silver-pink hair, hair past waist, violet eyes, fair skin, porcelain skin, white blouse, pink ribbon, cardigan, cherry blossom hair ornament, kyoto animation style",
  },
  marin: {
    base: "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, simple background, 1girl, long voluminous blonde wavy hair, bright amber eyes, honey eyes, sun-kissed golden-brown tanned skin, dark skin, gyaru, gyaru makeup, confident smile, fitted crop top, gold hoop earrings, layered gold necklaces",
    faceBase: "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, simple background, upper body, portrait, 1girl, long voluminous blonde wavy hair, bright amber eyes, honey eyes, sun-kissed golden-brown tanned skin, dark skin, gyaru, gyaru makeup, gold hoop earrings, layered gold necklaces",
  },
  nao: {
    base: "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, simple background, 1girl, medium messy dark navy bob, lavender highlights, sharp teal-blue eyes, pale fair skin, dark eyeliner, skull hairpin, oversized hoodie, choker with LED pendant, pastel purple headphones around neck",
    faceBase: "masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg, transparent background, png, simple background, upper body, portrait, 1girl, medium messy dark navy bob, lavender highlights, sharp teal-blue eyes, pale fair skin, dark eyeliner, skull hairpin, oversized hoodie, choker, pastel purple headphones around neck",
  },
};

// New expressions to generate
const NEW_EXPRESSIONS = {
  "face-devoted": "deeply loving expression, warm tender gaze, gentle blush, soft tender smile, sparkling eyes, emotional warmth",
  "face-teasing": "playful wink, one eye closed, tongue out slightly, mischievous grin, tilted head, cheeky expression",
  "face-sleepy": "drowsy half-closed eyes, gentle yawn, peaceful sleepy expression, relaxed, soft smile",
  "face-excited": "wide sparkling eyes, big enthusiastic grin, energetic, bright expression, pupils dilated with excitement",
  "face-shy": "looking away bashfully, deep blush, hand near mouth, embarrassed, avoiding eye contact, cute shy expression",
  "face-jealous": "side-eye glance, slight pout, narrowed eyes, jealous expression, competitive look, arms crossed",
  "face-crying": "tears streaming down cheeks, scrunched eyebrows, wobbly mouth, emotional crying, glistening eyes",
};

// New outfits
const NEW_OUTFITS = {
  arisu: {
    "body-casual": "soft pink pajama set, fluffy slippers, hair down loose, relaxed cozy pose, full body, standing",
    "body-formal": "elegant white and pink ball gown, hair up with flowers, graceful pose, full body, standing",
    "body-school": "japanese school uniform, sailor collar, navy pleated skirt, school bag, full body, standing",
  },
  marin: {
    "body-casual": "oversized band tee as nightshirt, bare legs, messy bun, relaxed casual, full body, standing",
    "body-formal": "glamorous gold mini dress, strappy heels, hair styled up, confident pose, full body, standing",
    "body-school": "customized school uniform, short skirt, loose tie, gyaru style accessories, full body, standing",
  },
  nao: {
    "body-casual": "oversized black hoodie, gaming headset on, shorts, bare feet, slouching casual, full body, standing",
    "body-formal": "dark purple gothic lolita dress, combat boots, dramatic eyeliner, cool aloof pose, full body, standing",
    "body-school": "school uniform with hoodie layered over it, headphones around neck, pins on bag, full body, standing",
  },
};

// Scene backgrounds
const BACKGROUNDS = {
  "bg-sakura": "anime background, cherry blossom garden, soft pink petals falling, gentle sunlight filtering through trees, serene, no people, scenic, beautiful, high quality",
  "bg-beach": "anime background, tropical beach, golden hour sunset, palm trees silhouette, turquoise water, warm orange sky, no people, scenic, beautiful, high quality",
  "bg-cyberpunk": "anime background, neon-lit city alley at night, purple and teal neon glow, rain puddles reflecting lights, cyberpunk aesthetic, no people, atmospheric, high quality",
  "bg-cafe": "anime background, cozy cafe interior, warm lighting, wooden tables, coffee cups, bookshelves, plants, no people, inviting atmosphere, high quality",
  "bg-rooftop": "anime background, school rooftop at sunset, chain link fence, orange and purple sky gradient, city skyline in distance, no people, atmospheric, high quality",
  "bg-bedroom": "anime background, cozy bedroom at night, fairy lights on wall, soft lamp glow, bed with plushies, window showing night sky, no people, warm, high quality",
  "bg-rain": "anime background, rainy window view, city lights blurred through rain, moody blue atmosphere, raindrops on glass, no people, melancholic beautiful, high quality",
  "bg-starfield": "anime background, night sky with millions of stars, milky way visible, dark gradient horizon, grass field silhouette, no people, awe inspiring, high quality",
};

function makeWorkflow(positive, negative, filename, width = 512, height = 896, seed = null) {
  const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);
  return {
    prompt: {
      "1": {
        class_type: "CheckpointLoaderSimple",
        inputs: { ckpt_name: "anything-v5.safetensors" },
      },
      "2": {
        class_type: "CLIPTextEncode",
        inputs: { text: positive, clip: ["1", 1] },
      },
      "3": {
        class_type: "CLIPTextEncode",
        inputs: { text: negative, clip: ["1", 1] },
      },
      "4": {
        class_type: "EmptyLatentImage",
        inputs: { width, height, batch_size: 1 },
      },
      "5": {
        class_type: "KSampler",
        inputs: {
          seed: actualSeed,
          steps: 28,
          cfg: 7,
          sampler_name: "euler_ancestral",
          scheduler: "normal",
          denoise: 1,
          model: ["1", 0],
          positive: ["2", 0],
          negative: ["3", 0],
          latent_image: ["4", 0],
        },
      },
      "6": {
        class_type: "VAEDecode",
        inputs: { samples: ["5", 0], vae: ["1", 2] },
      },
      "7": {
        class_type: "SaveImage",
        inputs: { images: ["6", 0], filename_prefix: filename },
      },
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

async function waitForCompletion(promptId, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    const data = await res.json();
    if (data[promptId] && data[promptId].outputs) {
      return data[promptId].outputs;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timeout waiting for prompt ${promptId}`);
}

async function downloadImage(filename, outputDir) {
  // Get the image from ComfyUI output
  const res = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const outputPath = join(outputDir, filename.replace(/.*\//, ""));
  writeFileSync(outputPath, buffer);
  return outputPath;
}

async function generateImage(positive, negative, prefix, width, height, outputDir) {
  console.log(`  Generating: ${prefix}...`);
  const workflow = makeWorkflow(positive, negative, prefix, width, height);
  const { prompt_id } = await queuePrompt(workflow);
  console.log(`  Queued: ${prompt_id}`);

  const outputs = await waitForCompletion(prompt_id);

  // Find the saved image
  const saveNode = Object.values(outputs).find((o) => o.images);
  if (!saveNode || !saveNode.images[0]) throw new Error("No output image");

  const imageName = saveNode.images[0].filename;
  const savedPath = await downloadImage(imageName, outputDir);
  console.log(`  Saved: ${savedPath}`);
  return savedPath;
}

async function main() {
  console.log("=== Anime Chatbot Art Generator ===\n");

  // Check ComfyUI is running
  try {
    await fetch(`${COMFY_URL}/system_stats`);
  } catch {
    console.error("ComfyUI is not running on localhost:8188!");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const mode = args[0] || "expressions"; // expressions, outfits, backgrounds, all

  if (mode === "expressions" || mode === "all") {
    console.log("\n--- Generating New Expressions ---\n");
    for (const [charId, charConfig] of Object.entries(CHARS)) {
      const dir = join(SPRITES_DIR, charId);
      mkdirSync(dir, { recursive: true });

      for (const [exprName, exprPrompt] of Object.entries(NEW_EXPRESSIONS)) {
        const positive = `${charConfig.faceBase}, ${exprPrompt}`;
        try {
          await generateImage(positive, BASE_NEGATIVE, `${charId}-${exprName}`, 512, 896, dir);
        } catch (e) {
          console.error(`  FAILED: ${charId}/${exprName}: ${e.message}`);
        }
      }
    }
  }

  if (mode === "outfits" || mode === "all") {
    console.log("\n--- Generating New Outfits ---\n");
    for (const [charId, outfits] of Object.entries(NEW_OUTFITS)) {
      const dir = join(SPRITES_DIR, charId);
      mkdirSync(dir, { recursive: true });
      const charBase = CHARS[charId].base;

      for (const [outfitName, outfitPrompt] of Object.entries(outfits)) {
        // Remove the default outfit description from base and add new one
        const positive = `${charBase.split(",").slice(0, -5).join(",")}, ${outfitPrompt}`;
        try {
          await generateImage(positive, BASE_NEGATIVE, `${charId}-${outfitName}`, 512, 896, dir);
        } catch (e) {
          console.error(`  FAILED: ${charId}/${outfitName}: ${e.message}`);
        }
      }
    }
  }

  if (mode === "backgrounds" || mode === "all") {
    console.log("\n--- Generating Scene Backgrounds ---\n");
    const bgDir = join(SPRITES_DIR, "..", "backgrounds");
    mkdirSync(bgDir, { recursive: true });

    for (const [bgName, bgPrompt] of Object.entries(BACKGROUNDS)) {
      try {
        await generateImage(bgPrompt, BASE_NEGATIVE, bgName, 1920, 1080, bgDir);
      } catch (e) {
        console.error(`  FAILED: ${bgName}: ${e.message}`);
      }
    }
  }

  console.log("\n=== Done! ===");
}

main().catch(console.error);
