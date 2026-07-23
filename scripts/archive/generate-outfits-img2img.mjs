/**
 * Generate outfits using img2img with the original character as reference.
 * Uses low denoise (0.45) to maintain face/body identity while changing clothes.
 * Run: node scripts/generate-outfits-img2img.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES_DIR = join(__dirname, "..", "public", "sprites");
const COMFY_URL = "http://localhost:8188";

const BASE_NEGATIVE = "low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality, ugly, different face, different person, different hair color, different eye color, grey background, frame, border, fully clothed, covered body, long sleeves, sweater, jacket";

// Base character descriptions for identity preservation
const CHAR_IDENTITY = {
  arisu: "1girl, long blonde wavy hair with pink highlights past waist, violet purple eyes, dark tanned brown skin, dark skin, gyaru tan, cherry blossom hairpin, gentle expression, anime style, visual novel sprite, transparent background, simple background, full body, standing, same character, consistent identity",
  marin: "1girl, long black hair, amber brown eyes, tan skin, dark skin, gyaru, gold hoop earrings, layered gold necklaces, confident smile, thick thighs, wide hips, curvy body, voluptuous, anime style, visual novel sprite, transparent background, simple background, full body, standing, same character, consistent identity",
  nao: "1girl, short light blue silver bob hair, teal blue eyes, pale white skin, choker, skull hairpin, cool expression, anime style, visual novel sprite, transparent background, simple background, full body, standing, same character, consistent identity",
};

// Outfit descriptions - focus on clothes only
const OUTFITS = {
  "school-skimpy": {
    arisu: "micro tiny white cropped school top barely covering chest, underboob visible, extremely short navy pleated micro mini skirt barely covering, bare dark skin showing almost everything, fully exposed stomach navel cleavage sideboob shoulders arms thighs hips, thigh-high white stockings garters, loose pink ribbon tie, school uniform theme, nearly naked, maximum skin exposed",
    marin: "tiny knotted white school shirt crop top, extremely short pleated micro skirt, bare tanned skin everywhere, bare stomach bare navel bare shoulders bare arms bare thighs bare cleavage, thigh-high tan stockings, loose school tie, gyaru school uniform theme, very revealing",
    nao: "tiny open white school shirt showing black bralette, extremely short dark plaid micro skirt, bare pale skin everywhere, bare stomach bare navel bare shoulders bare arms bare thighs, black thigh-high stockings, loose dark tie, school uniform theme, very revealing, choker",
  },
  cheerleader: {
    arisu: "tiny pink sports bra only, micro cheer skirt, bare dark skin everywhere, bare stomach bare navel bare shoulders bare arms bare legs bare cleavage, high ponytail ribbon, pom poms, almost naked cheerleader, very revealing",
    marin: "tiny orange bikini halter top, micro gold cheer skirt, bare tanned skin everywhere, bare stomach bare navel bare shoulders bare arms bare legs bare cleavage, high ponytail, pom poms, almost naked cheerleader, very revealing, confident",
    nao: "tiny purple sports bra only, micro black cheer skirt, bare pale skin everywhere, bare stomach bare navel bare shoulders bare arms bare legs, headphones, almost naked cheerleader, very revealing, reluctant embarrassed",
  },
  "cheer-extreme": {
    arisu: "micro string bikini top barely covering nipples, micro thong bikini bottom, pom poms, bare dark skin showing almost everything, fully exposed stomach navel deep cleavage thighs hips sideboob shoulders arms legs, high ponytail, nearly nude, maximum skin, extremely revealing, cheerleader theme",
    marin: "micro string bikini halter barely covering nipples, micro thong bikini bottom with gold chain, pom poms, bare tanned skin showing almost everything, fully exposed stomach navel deep cleavage thighs hips sideboob shoulders arms legs, curvy thick body, wide hips, high ponytail, nearly nude, maximum skin, extremely revealing, cheerleader theme",
    nao: "micro string triangle bikini barely covering, micro thong bottom, pom poms, bare pale skin showing almost everything, fully exposed stomach navel cleavage thighs hips sideboob shoulders arms legs, headphones, nearly nude, maximum skin, extremely revealing, reluctant embarrassed cheerleader",
  },
  casual: {
    arisu: "wearing a thin cropped pink camisole tank top, very short white cotton shorts, bare midriff showing, bare legs, hair loose and down, relaxed cozy bedroom pose, slight cleavage",
    marin: "wearing a tiny oversized crop band tee showing underboob, lace bralette visible, very short denim cutoff shorts, messy bun, bare tanned legs, bare feet, relaxed casual look, midriff",
    nao: "wearing a loose off-shoulder oversized black crop hoodie, sports bra visible underneath, very short dark shorts, thigh gap, bare pale legs, gaming headset, messy hair, slouching",
  },
  formal: {
    arisu: "wearing an elegant strapless pink and white evening gown with thigh-high slit, bare shoulders, hair up with flower accessories, graceful elegant pose, showing legs through slit",
    marin: "wearing a tight glamorous gold sequin mini dress, very short, deep v-neckline showing cleavage, strappy heels, hair styled up, gold jewelry, confident alluring pose",
    nao: "wearing a dark purple form-fitting gothic cocktail dress, low back, fishnet stockings, black choker, combat boots with heels, dark lipstick, cool seductive pose",
  },
  school: {
    arisu: "wearing japanese school uniform, white shirt slightly unbuttoned, short navy pleated mini skirt, thigh-high white stockings, loose pink ribbon tie, cute innocent pose",
    marin: "wearing customized gyaru school uniform, shirt tied up showing midriff, very short pleated skirt, loose tie, thigh-high tan stockings, gyaru accessories, confident pose",
    nao: "wearing school uniform with oversized unzipped hoodie, shirt slightly open, short dark plaid skirt, black thigh-high stockings, headphones around neck, cool rebellious pose",
  },
};

function makeImg2ImgWorkflow(baseImage, positive, negative, filename, denoise = 0.45) {
  const seed = Math.floor(Math.random() * 2147483647);
  return {
    prompt: {
      "1": {
        class_type: "CheckpointLoaderSimple",
        inputs: { ckpt_name: "anything-v5.safetensors" },
      },
      "2": {
        class_type: "CLIPTextEncode",
        inputs: { text: `masterpiece, best quality, absurdres, highres, ${positive}`, clip: ["1", 1] },
      },
      "3": {
        class_type: "CLIPTextEncode",
        inputs: { text: negative, clip: ["1", 1] },
      },
      "load_img": {
        class_type: "LoadImage",
        inputs: { image: baseImage },
      },
      "encode_img": {
        class_type: "VAEEncode",
        inputs: { pixels: ["load_img", 0], vae: ["1", 2] },
      },
      "5": {
        class_type: "KSampler",
        inputs: {
          seed: seed,
          steps: 30,
          cfg: 7,
          sampler_name: "euler_ancestral",
          scheduler: "normal",
          denoise: denoise,
          model: ["1", 0],
          positive: ["2", 0],
          negative: ["3", 0],
          latent_image: ["encode_img", 0],
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

async function waitForCompletion(promptId, timeoutMs = 180000) {
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
  const res = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const outputPath = join(outputDir, filename.replace(/.*\//, ""));
  writeFileSync(outputPath, buffer);
  return outputPath;
}

async function generateOutfit(charId, outfitName, outfitPrompt, baseImage) {
  const identity = CHAR_IDENTITY[charId];
  const positive = `${identity}, ${outfitPrompt}`;
  const prefix = `${charId}-body-${outfitName}`;

  console.log(`  Generating: ${charId} ${outfitName} (img2img from ${baseImage})...`);

  const denoise = (outfitName === "cheer-extreme") ? 0.88 : (outfitName === "school-skimpy" || outfitName === "cheerleader") ? 0.82 : 0.65;
  const workflow = makeImg2ImgWorkflow(baseImage, positive, BASE_NEGATIVE, prefix, denoise);
  const { prompt_id } = await queuePrompt(workflow);
  console.log(`  Queued: ${prompt_id}`);

  const outputs = await waitForCompletion(prompt_id);
  const saveNode = Object.values(outputs).find((o) => o.images);
  if (!saveNode || !saveNode.images[0]) throw new Error("No output image");

  const dir = join(SPRITES_DIR, charId);
  mkdirSync(dir, { recursive: true });
  const imageName = saveNode.images[0].filename;
  const savedPath = await downloadImage(imageName, dir);

  // Rename to proper name
  const finalPath = join(dir, `body-${outfitName}.png`);
  const { renameSync } = await import("fs");
  try { renameSync(savedPath, finalPath); } catch { /* already named correctly */ }

  console.log(`  Saved: ${finalPath}`);
}

async function main() {
  console.log("=== Outfit Generation (img2img) ===\n");

  const baseImages = {
    arisu: "arisu-base.png",
    marin: "marin-base.png",
    nao: "nao-base.png",
  };

  for (const [charId, baseImg] of Object.entries(baseImages)) {
    console.log(`\n--- ${charId} ---\n`);
    for (const [outfitName, charOutfits] of Object.entries(OUTFITS)) {
      const outfitPrompt = charOutfits[charId];
      if (!outfitPrompt) continue;
      try {
        await generateOutfit(charId, outfitName, outfitPrompt, baseImg);
      } catch (e) {
        console.error(`  FAILED: ${charId}/${outfitName}: ${e.message}`);
      }
    }
  }

  console.log("\n=== Done! ===");
}

main().catch(console.error);
