#!/usr/bin/env node
/**
 * comfy-gen.mjs — parameterized ComfyUI sprite generator for HEXXII.
 *
 * One runner for all characters, expressions, and outfits. Write a small
 * JSON config per batch instead of creating another one-off scripts/*.mjs.
 *
 * Usage:
 *   node .claude/skills/gen-sprites/scripts/comfy-gen.mjs <config.json>
 *   node .claude/skills/gen-sprites/scripts/comfy-gen.mjs <config.json> --dry-run
 *
 * --dry-run prints each job's resolved prompts + settings without touching
 * ComfyUI. Always dry-run first to lint prompts before burning GPU time.
 *
 * Config shape:
 * {
 *   "prefix": "merrick-v3",                       // ComfyUI filename prefix
 *   "outputDir": "public/sprites/merrick-regen",  // relative to repo root or absolute
 *   "positive": ["(solo:1.5), 1girl, ...", "..."],// string or array (joined with ", ")
 *   "negative": ["low quality, ..."],
 *   "settings": { "steps": 40 },                  // optional overrides of locked formula
 *   "jobs": [
 *     { "name": "body-neutral", "mode": "txt2img", "seed": 55700,
 *       "copyToInput": "merrick-base.png" },      // copy result into ComfyUI input for later img2img
 *     { "name": "face-happy", "mode": "img2img", "input": "merrick-base.png",
 *       "seed": 55701, "denoise": 0.58,
 *       "appendPositive": "happy warm smile, bright eyes" },
 *     { "name": "body-school", "mode": "txt2img", "seed": 55700,
 *       "positive": ["...full prompt with outfit tags swapped..."] }
 *   ]
 * }
 *
 * Per-job fields: name (output file, no .png), mode, seed,
 *   positive | appendPositive, negative | appendNegative,
 *   input + denoise (img2img only; denoise defaults to 0.58),
 *   copyToInput (copy this job's output into the ComfyUI input dir under that name).
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, resolve } from "path";

const COMFY_URL = process.env.COMFY_URL || "http://localhost:8188";
const COMFY_INPUT =
  process.env.COMFY_INPUT ||
  "C:/Users/G$/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input";

// Locked V3 formula (docs/sprite-prompts.md). Override via config.settings
// only with a documented reason.
const LOCKED = {
  model: "illustriousxlMmmix_v80.safetensors",
  width: 832,
  height: 1216,
  sampler: "dpmpp_2m_sde",
  scheduler: "karras",
  steps: 40,
  cfg: 6.5,
};

const [, , configPath, ...flags] = process.argv;
const dryRun = flags.includes("--dry-run");
if (!configPath) {
  console.error("Usage: node comfy-gen.mjs <config.json> [--dry-run]");
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(configPath, "utf8"));
const settings = { ...LOCKED, ...(cfg.settings || {}) };
const outputDir = resolve(cfg.outputDir);
const joinTags = (t) => (Array.isArray(t) ? t.join(", ") : t || "");

// V3 lint: the only weighted tag allowed is (solo:1.5). Anything else is a
// standard violation that causes artifacts and concept bleed on IllustriousXL.
function lintWeights(prompt, label) {
  const weights = prompt.match(/\([^()]*:[\d.]+\)/g) || [];
  const bad = weights.filter((w) => w !== "(solo:1.5)");
  if (bad.length) {
    console.warn(`  WARNING [${label}]: V3 forbids weights except (solo:1.5). Found: ${bad.join(" ")}`);
  }
  return bad.length;
}

function resolveJob(job) {
  const positive = job.positive
    ? joinTags(job.positive)
    : [joinTags(cfg.positive), job.appendPositive].filter(Boolean).join(", ");
  const negative = [
    joinTags(job.negative ?? cfg.negative),
    job.appendNegative,
  ]
    .filter(Boolean)
    .join(", ");
  return { positive, negative };
}

function buildWorkflow(job, positive, negative) {
  const nodes = {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: settings.model } },
    "2": { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["1", 1] } },
    "3": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["1", 1] } },
    "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
    "7": {
      class_type: "SaveImage",
      inputs: { images: ["6", 0], filename_prefix: `${cfg.prefix || "gen"}-${job.name}` },
    },
  };
  const sampler = {
    seed: job.seed,
    steps: settings.steps,
    cfg: settings.cfg,
    sampler_name: settings.sampler,
    scheduler: settings.scheduler,
    model: ["1", 0],
    positive: ["2", 0],
    negative: ["3", 0],
  };
  if (job.mode === "img2img") {
    nodes["8"] = { class_type: "LoadImage", inputs: { image: job.input } };
    nodes["10"] = {
      class_type: "ImageScale",
      inputs: { image: ["8", 0], width: settings.width, height: settings.height, upscale_method: "lanczos", crop: "center" },
    };
    nodes["9"] = { class_type: "VAEEncode", inputs: { pixels: ["10", 0], vae: ["1", 2] } };
    nodes["5"] = {
      class_type: "KSampler",
      inputs: { ...sampler, denoise: job.denoise ?? 0.58, latent_image: ["9", 0] },
    };
  } else {
    nodes["4"] = {
      class_type: "EmptyLatentImage",
      inputs: { width: settings.width, height: settings.height, batch_size: 1 },
    };
    nodes["5"] = {
      class_type: "KSampler",
      inputs: { ...sampler, denoise: 1, latent_image: ["4", 0] },
    };
  }
  return { prompt: nodes };
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
      throw new Error("Generation failed: " + JSON.stringify(data[promptId].status));
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Timeout waiting for ${promptId}`);
}

async function downloadImage(filename, outputPath) {
  const res = await fetch(`${COMFY_URL}/view?filename=${encodeURIComponent(filename)}&type=output`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  writeFileSync(outputPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  if (!cfg.jobs?.length) {
    console.error("Config has no jobs.");
    process.exit(1);
  }

  let warnings = 0;
  console.log(`\n=== comfy-gen: ${cfg.prefix || "gen"} — ${cfg.jobs.length} job(s) ${dryRun ? "(DRY RUN)" : ""} ===`);
  console.log(`Settings: ${settings.model} ${settings.width}x${settings.height} ${settings.sampler}/${settings.scheduler} steps=${settings.steps} cfg=${settings.cfg}\n`);

  for (const job of cfg.jobs) {
    const { positive, negative } = resolveJob(job);
    warnings += lintWeights(positive, job.name);
    if (dryRun) {
      console.log(`--- ${job.name} [${job.mode}] seed=${job.seed}${job.mode === "img2img" ? ` denoise=${job.denoise ?? 0.58} input=${job.input}` : ""}`);
      console.log(`  positive: ${positive}`);
      console.log(`  negative: ${negative}\n`);
      continue;
    }
    mkdirSync(outputDir, { recursive: true });
    console.log(`Generating: ${job.name} [${job.mode}] seed=${job.seed}...`);
    const workflow = buildWorkflow(job, positive, negative);
    const { prompt_id } = await queuePrompt(workflow);
    const outputs = await waitForCompletion(prompt_id);
    const saveNode = Object.values(outputs).find((o) => o.images);
    if (!saveNode?.images?.[0]) throw new Error(`No output image for ${job.name}`);
    const outPath = join(outputDir, `${job.name}.png`);
    await downloadImage(saveNode.images[0].filename, outPath);
    console.log(`  Saved: ${outPath}`);
    if (job.copyToInput) {
      copyFileSync(outPath, join(COMFY_INPUT, job.copyToInput));
      console.log(`  Copied to ComfyUI input as: ${job.copyToInput}`);
    }
  }

  if (dryRun) {
    console.log(warnings ? `Dry run done — ${warnings} weight violation(s) above. Fix before generating.` : "Dry run done — prompts pass V3 lint.");
    return;
  }
  console.log("\n=== Done. ===\n");
}

if (!dryRun) {
  try {
    await fetch(`${COMFY_URL}/system_stats`);
  } catch {
    console.error(`ComfyUI is not running at ${COMFY_URL}. Start ComfyUI Desktop first (or set COMFY_URL).`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
