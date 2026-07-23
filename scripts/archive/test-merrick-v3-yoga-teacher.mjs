/**
 * Merrick V3: Yoga Instructor (15) + Teacher (15)
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

function scene(pose, outfit, bg) {
  return [...ID, "cowboy shot", pose, outfit, bg, ...QUALITY].join(", ");
}

const SCENES = {
  // ── YOGA INSTRUCTOR (15) ──
  "yoga-standing": scene(
    "standing, hand on hip, welcoming smile",
    "tight sports bra, yoga leggings, bare midriff, yoga mat rolled under arm, hair in ponytail",
    "yoga studio, wood floor, mirrors, natural light"),

  "yoga-stretch-arms": scene(
    "arms stretched above head, arching back",
    "sports bra, yoga leggings see-through from sweat, bare midriff, underboob peek, sweating",
    "yoga studio, warm lighting, plants"),

  "yoga-forward-bend": scene(
    "bending forward, touching toes, looking at viewer between legs",
    "tight shorts riding up, sports bra, bare midriff, bare thighs, flexible, sweaty",
    "yoga studio, mat on floor"),

  "yoga-warrior": scene(
    "warrior pose, lunging, arms spread wide, focused",
    "crop top, yoga shorts, bare midriff, toned stomach, sweating, determined expression",
    "yoga studio, sunset through windows"),

  "yoga-twist": scene(
    "seated twist, looking over shoulder, smirk",
    "sports bra strap falling off shoulder, tight leggings, bare midriff, sweaty skin glistening",
    "yoga studio, mat, peaceful"),

  "yoga-downdog": scene(
    "from behind, bent over hands on floor, looking back",
    "tight yoga shorts riding up, sports bra, bare back, bare thighs, panty line visible through leggings",
    "yoga studio, mirrors showing front"),

  "yoga-splits": scene(
    "standing split, one leg raised high, balanced",
    "high cut leotard, bare thigh completely exposed, flexible, athletic, confident",
    "yoga studio, barre, impressive flexibility"),

  "yoga-sweaty": scene(
    "standing, wiping forehead with arm, exhausted smile",
    "sports bra soaked with sweat, see-through from sweat, yoga pants pulled down to hips, bare stomach, glistening",
    "yoga studio, post workout, water bottle"),

  "yoga-cooldown": scene(
    "lying on back, knees up, relaxed breathing",
    "sports bra, yoga shorts, bare midriff rising and falling, sweaty skin, peaceful expression, eyes closed",
    "yoga studio, mat, dim lighting, savasana"),

  "yoga-mat-roll": scene(
    "bending over rolling up mat, cleavage hanging",
    "loose tank top, no bra, cleavage from bending, short shorts, bare thighs, casual",
    "yoga studio, class over, packing up"),

  "yoga-water": scene(
    "drinking water, water dripping down chin and chest",
    "sports bra, water spilling on chest, wet spot on bra, bare midriff, sweaty, refreshing",
    "yoga studio, post class, towel on shoulder"),

  "yoga-partner": scene(
    "standing, demonstrating pose, hands adjusting own body",
    "sheer white yoga top, no bra visible through sheer fabric, white leggings see-through, bare midriff",
    "yoga studio, instructing, professional but revealing"),

  "yoga-handstand": scene(
    "handstand against wall, upside down, shirt falling",
    "loose crop top falling toward face exposing stomach and underboob, yoga pants, inverted, athletic",
    "yoga studio, wall, impressive strength"),

  "yoga-meditation": scene(
    "sitting cross legged, eyes closed, serene",
    "sheer wrap top barely covering, meditation beads, yoga pants low waist, bare midriff, navel, peaceful",
    "zen garden, incense smoke, candles, spiritual"),

  "yoga-leaving": scene(
    "walking, looking back over shoulder, satisfied smile",
    "oversized hoodie unzipped, sports bra underneath, yoga pants, gym bag, messy ponytail, post workout glow",
    "studio exit, golden hour light, leaving class"),

  // ── TEACHER (15) ──
  "teacher-intro": scene(
    "standing at front, hand on hip, glasses, confident",
    "white blouse, tight pencil skirt, glasses, hair up in bun, stockings, heels, professional",
    "classroom, chalkboard behind, desk, books"),

  "teacher-writing": scene(
    "writing on chalkboard, arm raised, back partially turned",
    "white blouse stretched tight, pencil skirt riding up from reaching, stocking tops visible, heels",
    "classroom, chalkboard, chalk in hand"),

  "teacher-leaning": scene(
    "leaning on desk, arms supporting, looking at viewer over glasses",
    "blouse unbuttoned two buttons, cleavage visible, pencil skirt, glasses lowered, stern but inviting",
    "classroom desk, papers, apple on desk, ruler"),

  "teacher-sitting": scene(
    "sitting on desk edge, legs crossed, skirt hiked up",
    "blouse slightly open, pencil skirt riding high, stocking tops and garter visible, glasses, reading book",
    "classroom, desk, books stacked, evening light"),

  "teacher-detention": scene(
    "arms crossed under bust, pushing up, stern expression",
    "tight blouse straining at buttons, pencil skirt, glasses, ruler in hand, strict, intimidating",
    "empty classroom, after hours, single desk light"),

  "teacher-bending": scene(
    "bending over desk to point at paper, cleavage hanging",
    "blouse gaping open from bending, bra visible, skirt tight from behind, stockings, glasses sliding down nose",
    "classroom, student desk, papers, helping student"),

  "teacher-unbutton": scene(
    "unbuttoning top button, fanning self, hot expression",
    "blouse open showing bra underneath, pencil skirt, glasses, flushed, sweating slightly, end of long day",
    "classroom, windows, late afternoon heat"),

  "teacher-stockings": scene(
    "adjusting stocking, one foot on chair, skirt hiked",
    "blouse tucked in, pencil skirt pulled high, full garter belt and stocking top exposed, fixing wardrobe",
    "classroom, behind desk, private moment"),

  "teacher-hair-down": scene(
    "letting hair down from bun, shaking it loose, relieved",
    "blouse untucked, top buttons open, skirt loosened, glasses off in hand, after hours transformation",
    "classroom, end of day, sunset through windows"),

  "teacher-ruler": scene(
    "holding ruler, tapping palm, raised eyebrow, smirk",
    "tight white blouse, black lace bra visible through fabric, pencil skirt with slit, glasses, dominant energy",
    "classroom, desk, detention vibes"),

  "teacher-grading": scene(
    "leaning back in chair, red pen in mouth, thinking",
    "blouse open three buttons, lace bra peeking, skirt riding up, legs on desk, glasses, casual",
    "office, desk lamp, papers everywhere, late night grading"),

  "teacher-library": scene(
    "reaching for high shelf book, stretching up",
    "blouse lifting showing bare midriff, skirt riding up, stocking tops visible, on tiptoes, glasses",
    "library, bookshelves, ladder, dim lighting"),

  "teacher-conf": scene(
    "sitting, leaning forward, hands clasped, serious eyes",
    "blouse deep unbuttoned, heavy cleavage, pencil skirt, glasses, parent teacher conference energy",
    "office, desk between, nameplate, professional"),

  "teacher-afterhours": scene(
    "sitting on desk, blouse mostly open, relaxed",
    "blouse open showing black lace bra, skirt hiked to thighs, stockings, heels dangling off foot, glasses on desk",
    "empty classroom, night, desk lamp only, papers scattered"),

  "teacher-transform": scene(
    "standing, glasses off, hair down, blouse open, seductive smile",
    "blouse fully open showing lace lingerie underneath, pencil skirt unzipped, stockings, full transformation from strict to seductive",
    "classroom, chalkboard says class dismissed, dramatic"),
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
