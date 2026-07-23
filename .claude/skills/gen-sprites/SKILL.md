---
name: gen-sprites
description: Generate character sprite art for HEXXII via ComfyUI — base bodies, the 15 face expressions, outfit variants, seed hunts, and new-character art. Use this whenever the user wants to generate, regenerate, or experiment with sprite/character art, add an outfit or expression, run a seed hunt, or mentions ComfyUI, IllustriousXL, prompts, or any gen-*/regen-*/test-*.mjs script — even casual asks like "make Marin a nurse outfit" or "Arisu needs sprites". Encodes the locked V3 prompt formula and uses one parameterized runner instead of writing new one-off scripts.
---

# gen-sprites — ComfyUI Sprite Generation

## Read the source of truth first

Before writing any prompt, read `docs/sprite-prompts.md`. It is the locked
V3 standard: model settings, the tag-order template, per-character identity
tags, proven seeds, expression tags, and outfit examples. This SKILL.md
tells you the workflow; that doc holds the content. If the two ever
disagree, the doc wins (it carries the evolution log).

Note: the "Art Generation" section of CLAUDE.md describing anything-v5 at
800x1400 is the deprecated V1 system. Ignore it for generation work.

## Never write another one-off script

`scripts/` contains ~85 near-identical `.mjs` files from before this skill
existed. Do not add to them. Instead:

1. Write a small JSON config (batch of jobs).
2. Run the bundled runner:

```bash
node .claude/skills/gen-sprites/scripts/comfy-gen.mjs <config.json> --dry-run   # lint prompts first
node .claude/skills/gen-sprites/scripts/comfy-gen.mjs <config.json>             # generate
```

The runner hardcodes the locked formula (IllustriousXL MMMix v80, 832x1216,
dpmpp_2m_sde/karras, 40 steps, CFG 6.5), handles txt2img and img2img, waits
on the ComfyUI queue, downloads results into `outputDir`, and lints for
forbidden prompt weights. Its header comment documents the config shape.

Where to save configs:
- Throwaway experiments → the scratchpad directory.
- Reusable per-character batches (e.g. "regen all Kurisu expressions") →
  `scripts/sprite-configs/<character>-<purpose>.json`, committed so the
  batch is repeatable.

**Always `--dry-run` first.** It costs nothing and catches weight
violations and prompt assembly mistakes before burning GPU minutes
(each image takes ~1-3 min).

## V3 prompting rules (the ones people break)

Full rules in `docs/sprite-prompts.md`. The critical ones:

- **One weight in the whole prompt: `(solo:1.5)`.** Nothing else, positive
  or negative. IllustriousXL is danbooru-trained and responds to **tag
  order**, not emphasis syntax. Weights cause artifacts and concept bleed.
  If a tag isn't showing up, move it earlier — never weight it.
- **Tag order = priority.** Follow the 11-slot template in the doc:
  isolation guard → background → skin → hair → eyes → face → body →
  framing/pose → outfit → accessories → quality/style.
- **Every pose must be asymmetric** (`hand on hip`, `arms crossed`).
  Symmetric poses like `arms at sides` read as reference sheets and
  produce multi-view duplicates.
- **Casual clothing terms only.** `tank top`, `shorts`, `dress`. Lingerie
  and fashion-catalog words (`camisole`, `silk`, `lace trim`) trigger
  multi-model catalog outputs. 5-8 outfit tags max.
- **Anti-identity negatives per character**: wrong hair colors, wrong skin
  tone, wrong eye colors. Copy from the character's section in the doc.

## The generation process

1. **Base (txt2img seed hunt).** Body-neutral prompt, ~10 seeds in one
   config. If the character has a proven seed in the doc, start there.
2. **Lock the seed.** The user picks the winner — never pick for them.
   Present the batch and wait, or point them at
   `scripts/build-pick-gallery.mjs` for big batches.
3. **Expressions (img2img).** Base image → ComfyUI input (use the job's
   `copyToInput`), then 15 jobs at denoise 0.58, appending each expression
   tag line from the doc, seeds base+1 … base+15.
4. **Outfits (txt2img at the locked seed).** Swap only the outfit slot;
   identity, pose, and style tags stay identical. If an outfit drifts the
   identity, fall back to img2img from the base at denoise 0.72.
5. **If something fails: change ONE thing** (usually seed+1). Two failures
   on the same job → stop and ask the user rather than thrashing seeds.

Output always goes to `public/sprites/<character>-regen/` — never
overwrite `public/sprites/<character>/` directly; the live sprites only
change via the pick/apply step below.

## Preflight

The runner checks that ComfyUI answers at `localhost:8188` and exits with
a clear message if not. If it's down, ask the user to launch ComfyUI
Desktop — you cannot start it yourself.

## After generation

- Show the user the output files so they can judge them.
- Selection at scale: `scripts/build-pick-gallery.mjs` →
  user picks in `pick-gallery.html` → `scripts/apply-picks-add.mjs`.
- Before any sprite goes live: background removal
  (`remove_backgrounds.py`, rembg) and **face-expression canvas
  normalization** — every `face-*.png` must match `body-neutral.png`
  dimensions exactly, or the sprite visibly shifts size when the
  expression changes (this bug shipped twice; see commits 08eb53d,
  5e688e7).

## Keep the standard alive

When a seed gets locked, a new character is validated, or a formula
change survives testing, update `docs/sprite-prompts.md` (the character's
section and the Evolution Log) in the same session. The doc being current
is what makes this skill work next time.

For a **new character**: write V3 identity tags (skin/hair/eyes/face/body
slots, plain tags, no weights) plus anti-identity negatives, following the
Merrick section as the exemplar, then run the process above from step 1.
