# Ticia Generation Runs — Settings Reference

## Best Results
- **Outfits (matching pose)**: Run 09 — img2img from casual base, denoise 0.7
- **Neutral (black dress)**: Run 11 v1 — img2img from vampire base, denoise 0.8
- **Original outfits**: Run 01 — img2img from old 512x768 base, denoise 0.7

---

## 01 — Original Outfits (from regen-ticia-full.mjs)
- **Model**: anything-v5.safetensors
- **Method**: img2img from 512x768 base → denoise 0.7
- **Sampler**: euler_ancestral | **Steps**: 30 | **CFG**: 7.5
- **Size**: 512x768 (upscaled after)
- **Notes**: These are the approved outfits currently in use. All share same pose/face from consistent base.

## 02 — School Regen (first attempt)
- **Model**: anything-v5.safetensors
- **Method**: img2img from maid base (824x1216) | **Denoise**: 0.65
- **Sampler**: euler_ancestral | **Steps**: 30 | **CFG**: 7.5
- **Result**: Maid outfit bled through heavily. Too low denoise.

## 03 — School v2 (higher denoise)
- **Model**: anything-v5.safetensors
- **Method**: img2img from neutral base (824x1216) | **Denoise**: 0.82
- **Sampler**: euler_ancestral | **Steps**: 35 | **CFG**: 7
- **Result**: Better but still some maid elements. Pose shifted.

## 04 — School Illustrious (wrong model approach)
- **Model**: illustriousxlMmmix_v80.safetensors
- **Method**: img2img from neutral base | **Denoise**: 0.82
- **Sampler**: euler_ancestral | **Steps**: 30 | **CFG**: 6
- **Result**: Heavy blue tint. Illustrious XL + img2img = bad color cast.

## 05 — School Fye Workflow (txt2img illustrious)
- **Model**: illustriousxlMmmix_v80.safetensors
- **Method**: txt2img | **Denoise**: 1.0
- **Sampler**: euler | **Steps**: 35 | **CFG**: 5.5
- **Size**: 824x1216
- **Result**: Good quality, no blue tint. But different style from anything-v5 outfits.

## 06 — Regen v3 (txt2img anything-v5)
- **Model**: anything-v5.safetensors
- **Method**: txt2img | **Denoise**: 1.0
- **Sampler**: euler | **Steps**: 35 | **CFG**: 5.5
- **Size**: 824x1216
- **Result**: Right style but completely different pose/angle — txt2img doesn't preserve pose.

## 07 — Matched v4 (low denoise maid base)
- **Model**: anything-v5.safetensors
- **Method**: img2img from maid | **Denoise**: 0.55–0.6
- **Sampler**: euler_ancestral | **Steps**: 30 | **CFG**: 7
- **Result**: Maid headband/apron still showing. Denoise too low to change outfit.

## 08 — Matched v5 (medium denoise maid base)
- **Model**: anything-v5.safetensors
- **Method**: img2img from maid | **Denoise**: 0.75
- **Sampler**: euler_ancestral | **Steps**: 30 | **CFG**: 7
- **Result**: Pose matches well. Neutral too revealing. School still has maid apron bleed.

## 09 — Matched v6 (casual base, sweet spot)
- **Model**: anything-v5.safetensors
- **Method**: img2img from casual | **Denoise**: 0.7
- **Sampler**: euler_ancestral | **Steps**: 30 | **CFG**: 7
- **Result**: School/school+ pose and angle match well. Neutral went white (light base bled color). Used for final school/school+.

## 10 — Neutral v7 (vampire base, first attempt)
- **Model**: anything-v5.safetensors
- **Method**: img2img from vampire | **Denoise**: 0.7
- **Sampler**: euler_ancestral | **Steps**: 30 | **CFG**: 7
- **Result**: Black dress but red floral corset pattern bled from vampire base.

## 11 — Neutral v8 (vampire base, higher denoise, 3 seeds)
- **Model**: anything-v5.safetensors
- **Method**: img2img from vampire | **Denoise**: 0.8
- **Sampler**: euler_ancestral | **Steps**: 30 | **CFG**: 7.5
- **Seeds**: 132214, 132215, 132216
- **Result**: v1 (seed 132214) chosen as final — clean black dress, Morticia vibe, matching pose.

---

## 12 — FINAL (currently in use, bg removed)
- **body-neutral.png**: From run 11 v1 (vampire base, denoise 0.8, seed 132214)
- **body-school.png**: From run 09 (casual base, denoise 0.7, seed 132015)
- **body-school-skimpy.png**: From run 09 (casual base, denoise 0.7, seed 132016)

---

## Key Learnings
- **img2img denoise 0.7** is the sweet spot for outfit changes with anything-v5
- **Base image choice matters**: dark bases for dark outfits, neutral bases for colored outfits
- **txt2img** produces different poses — only use for initial character creation
- **illustrious XL** has different color profile; use Fye workflow settings (euler, 35 steps, cfg 5.5) for best results
- **Negative prompts** must explicitly exclude the base outfit elements (maid, apron, etc.)
