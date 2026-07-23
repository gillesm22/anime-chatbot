/**
 * Merrick V3: Oil + Onsen + Shibari + Fishnet series
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
  // ── OIL SERIES (15) ──
  "oil-pour-neck": scene("head tilted back, eyes closed", "bikini top, oiled skin, body oil pouring down neck, oil dripping on chest, glistening, shiny skin", "sensual"),
  "oil-arm-rub": scene("looking at viewer, rubbing arm", "sports bra, oiled skin, glistening arms, body oil, shiny skin, wet look", "massage"),
  "oil-thighs": scene("looking down, hands on thighs", "micro bikini bottom, oiled skin, oil on thighs, hands sliding down legs, glistening, shiny", "oiled up"),
  "oil-back": scene("from behind, looking back over shoulder", "string bikini, oiled skin, oiled back, glistening shoulders, shiny skin, oil dripping down spine", "back view"),
  "oil-full-glow": scene("standing, hand on hip, confident smirk", "string bikini, fully oiled skin, glistening all over, wet look hair, shiny skin, body oil", "glowing"),
  "oil-drip-chest": scene("looking at viewer, smirk", "bikini top, oil dripping between breasts, oiled cleavage, glistening skin, shiny", "seductive"),
  "oil-stomach": scene("arching back slightly, hand on stomach", "micro bikini, oiled stomach, oil on abs, glistening navel, shiny skin", "sensual"),
  "oil-legs": scene("one knee slightly bent, hand on knee", "micro bikini bottom, oiled legs, glistening thighs, shiny calves, body oil", "legs"),
  "oil-spill": scene("surprised expression, looking down", "white tank top, oil spilled on shirt, see-through from oil, oil running down body, wet shirt", "accident"),
  "oil-postglow": scene("relaxed smile, hair swept back", "nude colored bikini, fully glistening, wet look hair slicked back, dewy skin, total body oil", "afterglow"),
  "oil-pour-self": scene("pouring bottle over self, eyes half closed", "string bikini, oil bottle in hand, oil stream pouring, glistening skin, dripping", "pouring"),
  "oil-hands": scene("looking at viewer, oily hands raised", "bikini top, oiled hands, glistening fingers, oil dripping from palms, shiny arms", "messy"),
  "oil-wrestling": scene("athletic stance, confident", "black sports bikini, completely oiled, glistening muscles, shiny skin, athletic, competitive", "oil wrestling"),
  "oil-mirror": scene("looking at reflection, touching collarbone", "panties only, topless covering with arm, oiled skin, glistening, mirror, narcissistic", "admiring"),
  "oil-gold": scene("standing, regal pose", "gold micro bikini, golden oil, shimmering gold skin, metallic sheen, luxurious, goddess", "golden oil"),

  // ── ONSEN SERIES (10) ──
  "onsen-towel": scene("standing, holding small towel to chest", "small white towel barely covering, bare shoulders, bare thighs, steam, wet hair, hot spring", "onsen"),
  "onsen-entering": scene("stepping forward, one foot raised", "towel loosely wrapped, slipping, bare back, bare legs, steam rising, wet skin", "entering bath"),
  "onsen-hair-up": scene("arms up tying hair, looking at viewer", "towel around waist only, topless with steam covering, bare shoulders, wet skin, hair up", "getting ready"),
  "onsen-splash": scene("surprised, water splashing", "small towel, wet towel clinging, see-through wet fabric, bare thighs, water droplets", "splashed"),
  "onsen-relax": scene("leaning back, eyes half closed, content", "towel loosely draped, bare shoulders, bare collarbone, steam, wet hair down, relaxed", "soaking"),
  "onsen-back": scene("from behind, looking back over shoulder", "towel dropped to waist, bare back completely exposed, wet skin, steam, hair over one shoulder", "back"),
  "onsen-standing": scene("standing, wringing out hair", "towel slipping off, sideboob, bare thighs, wet skin dripping, steam, hair dripping", "standing up"),
  "onsen-peek": scene("peeking from behind rock, playful smile", "bare shoulders, steam, wet hair, hiding body behind towel, playful, hot spring", "peeking"),
  "onsen-cold": scene("shivering slightly, arms crossed over chest", "tiny towel, goosebumps, wet skin, nipples visible through wet towel, cold air, steam behind", "cold air"),
  "onsen-moonlight": scene("standing in open air, serene expression", "towel draped loosely, bare shoulders, wet skin, moonlight reflection, night onsen, ethereal", "moonlit"),

  // ── SHIBARI SERIES (6) ──
  "shibari-chest": scene("looking at viewer, composed", "red rope harness on chest, rope pattern between breasts, bare skin, black panties, artistic bondage", "shibari"),
  "shibari-full": scene("standing, elegant pose", "full body red rope pattern, intricate knots, bare skin visible between ropes, artistic, traditional", "kinbaku"),
  "shibari-back": scene("from behind, looking back", "red rope pattern on back, criss cross ropes, bare back, rope harness, artistic", "back shibari"),
  "shibari-arms": scene("arms behind back, defiant expression", "red rope binding arms behind back, rope on torso, bare shoulders, black underwear, composed", "arm tie"),
  "shibari-lingerie": scene("looking at viewer, confident", "red rope harness over black lingerie, rope between breasts, garter rope pattern on thighs, artistic", "rope lingerie"),
  "shibari-minimal": scene("standing, slight smirk", "single red rope across chest, minimal bondage, bare midriff, black bikini bottom, elegant", "minimal shibari"),

  // ── FISHNET SERIES (8) ──
  "fishnet-bodysuit": scene("standing, hand on hip, confident", "black fishnet bodysuit, full body fishnet, visible skin through mesh, black underwear underneath, sexy", "fishnet"),
  "fishnet-dress": scene("looking at viewer, elegant", "black fishnet mini dress, see-through mesh dress, bra and panties visible through fishnet, bare arms", "fishnet dress"),
  "fishnet-top": scene("standing, casual", "fishnet crop top, no bra underneath, nipples visible through mesh, denim shorts, bare midriff", "fishnet top"),
  "fishnet-stockings": scene("standing, one leg forward", "fishnet thigh high stockings, garter belt, micro skirt, crop top, bare midriff, thighs through mesh", "stockings"),
  "fishnet-white": scene("looking at viewer, playful", "white fishnet bodysuit, see-through white mesh, tanned skin visible through white net, white underwear", "white fishnet"),
  "fishnet-cutout": scene("hand on hip, confident smirk", "fishnet bodysuit with strategic cutouts, exposed cleavage, exposed midriff, exposed thighs, black mesh", "cutout"),
  "fishnet-layered": scene("standing, arms crossed under bust", "fishnet top under leather jacket, open jacket, fishnet visible, no bra, leather shorts", "layered"),
  "fishnet-neon": scene("standing, glowing aesthetic", "neon green fishnet bodysuit, see-through mesh, black underwear underneath, neon glow, cyberpunk", "neon fishnet"),
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
  console.log(`\n=== Done. ${total} renders generated. ===\n`);
}

main().catch(console.error);
