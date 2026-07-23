/**
 * Test: CLIPTextEncodeSDXL — split text_l (composition) from text_g (identity).
 * text_l gets the short solo/framing constraints (77 token max, most layout influence).
 * text_g gets the full identity prompt (longer context, detail-oriented).
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "sprites", "merrick-regen");
const COMFY_URL = "http://localhost:8188";

// CLIP-L: composition + identity essentials (must stay under ~77 tokens)
const POSITIVE_L = "solo, 1girl, one person, white background, simple background, transparent background, standing, cowboy shot, looking at viewer, anime style, visual novel sprite, dark brown skin, long black hair, hair past waist, emerald green eyes, black silk camisole, fitted black pants, gold necklace";

// CLIP-G: full identity + outfit + style
const POSITIVE_G = [
  "masterpiece, best quality, absurdres, highres, anime style",
  "visual novel sprite, game cg, transparent background, png",
  "white background, simple background, solo, 1girl, one person",
  "(dark brown skin:1.3), (brown skin:1.2), smooth skin",
  "(cowboy shot:1.5), (thighs visible:1.5), (show from head to mid-thigh:1.4), (head space:1.2), looking at viewer",
  "(long black hair:1.6), (hair past waist:1.3), straight hair",
  "(emerald green eyes:1.5), (long eyelashes:1.2)",
  "pretty face, mature face, (elegant expression:1.2)",
  "mature female, adult, (tall:1.2), (large breasts:1.2), slender waist, (curvy:1.2)",
  "(black silk camisole:1.4), (lace trim:1.2), (cleavage:1.2)",
  "(fitted black pants:1.3)",
  "gold necklace, jade pendant, gold hoop earrings",
  "(standing:1.4), (arms at sides:1.2), (both hands visible:1.3)",
  "cel shading, clean lineart, high detail skin, sharp focus",
].join(", ");

// Negative — same for both encoders (basic CLIPTextEncode for negative is fine)
const NEGATIVE = [
  "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark",
  "(multiple girls:1.8), (2girls:1.8), (multiple characters:1.8), (split screen:1.5), (mirror:1.5), (reflection:1.5), (duo:1.5)",
  "signature, worst quality, ugly, duplicate, extra limbs",
  "poorly drawn face, mutation, bad proportions",
  "reference sheet, multiple views, character sheet, expression sheet",
  "collage, grid, panels, borders, frames",
  "props, furniture, background objects",
  "(blonde hair:1.4), (silver hair:1.4), (white hair:1.4), (pink hair:1.3), (red hair:1.3)",
  "(pale skin:1.4), (fair skin:1.4)",
  "(blue eyes:1.4), (violet eyes:1.3), (red eyes:1.3)",
  "(close-up:1.4), (portrait:1.4), (full body:1.3)",
  "(sitting:1.4), (kneeling:1.4)",
  "(background:1.3), (grey background:1.3), (gradient background:1.3)",
  "child, loli, young",
  "(chibi:1.5), (glasses:1.5), (headphones:1.4)",
  "(male:1.8), (man:1.8), (boy:1.8)",
].join(", ");

function txt2imgWorkflow(positiveG, positiveL, negative, seed) {
  return {
    prompt: {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "illustriousxlMmmix_v80.safetensors" } },
      // SDXL dual encoder — split text_g and text_l
      "2": { class_type: "CLIPTextEncodeSDXL", inputs: {
        text_g: positiveG,
        text_l: positiveL,
        clip: ["1", 1],
        width: 832,
        height: 1216,
        crop_w: 0,
        crop_h: 0,
        target_width: 832,
        target_height: 1216,
      }},
      // Negative still uses basic encoder
      "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
      "4": { class_type: "EmptyLatentImage", inputs: { width: 832, height: 1216, batch_size: 1 } },
      "5": { class_type: "KSampler", inputs: {
        seed, steps: 40, cfg: 6.5, sampler_name: "dpmpp_2m_sde", scheduler: "karras", denoise: 1,
        model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0],
      }},
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: `merrick-sdxlclip-${seed}` } },
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

async function waitForCompletion(promptId, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${COMFY_URL}/history/${promptId}`);
    const data = await res.json();
    if (data[promptId]?.outputs) return data[promptId].outputs;
    if (data[promptId]?.status?.status_str === "error") {
      throw new Error("Generation failed: " + JSON.stringify(data[promptId].status));
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
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n=== MERRICK SDXL CLIP SPLIT TEST ===`);
  console.log(`text_l (${POSITIVE_L.length} chars): ${POSITIVE_L}`);
  console.log(`text_g (${POSITIVE_G.length} chars)`);
  console.log(`Resolution metadata: 832x1216\n`);

  const seeds = [55553, 55554, 55555, 55556, 55557, 55600, 55630, 55640, 55650, 55660];
  for (const s of seeds) {
    const workflow = txt2imgWorkflow(POSITIVE_G, POSITIVE_L, NEGATIVE, s);
    console.log(`Seed ${s} — queuing...`);
    const { prompt_id } = await queuePrompt(workflow);
    const outputs = await waitForCompletion(prompt_id);
    const saveNode = Object.values(outputs).find((o) => o.images);
    if (!saveNode?.images?.[0]) throw new Error("No output image");
    const outPath = join(OUTPUT_DIR, `sdxlclip-${s}.png`);
    await downloadImage(saveNode.images[0].filename, outPath);
    console.log(`  Saved: sdxlclip-${s}.png`);
  }
  console.log("\n=== Done. ===\n");
}

main().catch(console.error);
