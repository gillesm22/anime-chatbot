# Kurisu Sprite Revamp Design

**Date:** 2026-07-07
**Goal:** Revamp Kurisu's sprite generation scripts to match Suzuka's v2 winning formula — higher CFG, variable denoise, weighted tags, anti-bleed negatives, and tsundere-flavored expression prompts.

## Model & Canvas

- **Checkpoint:** `anything-v5.safetensors`
- **Resolution:** 512x768
- **Sampler:** `euler_ancestral` / `normal` scheduler
- **Background removal:** `rembg` via Python 3.13

## Base (txt2img) — `regen-kurisu-v2.mjs`

- **Steps:** 30 | **CFG:** 7.5 | **Denoise:** 1.0 | **Seed:** 626262
- **Body type:** Athletic, toned, moderate curves — not hourglass like Suzuka, not flat like old Kurisu
- **Default outfit:** Iconic lab coat look (white lab coat, white collared shirt, red necktie, black shorts)
- **Weighted identity tags:** `(blue violet eyes:1.3)`, `(long chestnut auburn wavy hair:1.2)`

### Base Prompt

```
masterpiece, best quality, absurdres, highres, anime style, visual novel sprite, game cg,
transparent background, png, white background, simple background, solo, 1girl, upper body,
cowboy shot, makise kurisu, steins gate, (long chestnut auburn wavy hair:1.2), hair between eyes,
(blue violet eyes:1.3), sharp eyes, white lab coat, white collared shirt, red necktie, black shorts,
both hands visible, arms at sides, athletic body, toned, medium-large breasts, fit waist, slim waist,
defined figure, looking at viewer, soft shading, clean lineart, warm lighting
```

### Negative Prompt

```
low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature,
worst quality, ugly, missing arm, missing hand, missing limb, extra limbs, poorly drawn hands,
mutation, bad proportions, background objects, full body, feet, shoes, boots, legs below thigh
```

## Expressions (img2img)

- **Steps:** 30 | **CFG:** 7.5 | **Denoise:** 0.45
- Uses body-neutral as input image
- Tsundere-flavored prompts with character-specific body language

| Expression | Prompt |
|---|---|
| face-happy | happy warm smile, bright eyes, genuine joy, slight blush, caught off guard by own happiness |
| face-thinking | thoughtful expression, eyes looking up, contemplative, adjusting glasses, finger on glasses frame |
| face-surprised | wide eyes, slightly open mouth, glasses sliding down nose, caught off guard |
| face-sad | downcast eyes, slight frown, melancholic, looking away, hand gripping arm |
| face-smirk | confident smirk, one corner raised, knowing look, intellectual superiority, adjusting glasses |
| face-laugh | eyes closed with joy, open mouth laugh, hand near mouth, genuinely caught off guard |
| face-angry | furrowed brows, intense glare, tight jaw, arms crossed energy, sharp look |
| face-flustered | deep blush, averted gaze sharply, steam, hand up defensively, looking away hard |
| face-devoted | warm soft unguarded gaze, gentle blush, adoring smile, rare vulnerability, soft eyes |
| face-teasing | sly grin, one eyebrow raised, mischievous, leaning forward slightly, playful |
| face-sleepy | half-closed eyes, peaceful, head tilting, drowsy, glasses askew |
| face-excited | wide sparkling eyes, big bright grin, leaning forward, hands together, research excitement |
| face-shy | looking away, deep blush, biting lip, hand near face, regretting what she just said |
| face-jealous | narrowed eyes, sharp side glance, slight pout, competitive irritation |
| face-crying | tears streaming, scrunched eyebrows, emotional, trying to hide face, glasses fogging |

## Outfits v2 (img2img) — `gen-kurisu-outfits-v3.mjs`

### Generation Settings

- **Steps:** 35
- **Sampler:** `euler_ancestral` / `normal`
- **Variable denoise:** 0.72 standard, 0.74 back views, 0.80 cow/bikini-front
- **Variable CFG:** 9.5 standard, 10 cow/bikini-front

### Character Tags

```
CHAR = "(blue violet eyes:1.3), (long chestnut auburn wavy hair:1.2), hair between eyes, sharp eyes, athletic body, toned, medium-large breasts, fit waist, slim waist, defined figure"
SEXY = "${CHAR}, very sexy, seductive, heavy cleavage, revealing, showing skin, midriff, bare stomach, bare thighs"
```

### Anti-Bleed Negatives

Base negative plus: `(white lab coat:1.3), (red necktie:1.3), (white collared shirt:1.3), (black shorts:1.3)`

Back views additionally add: `(front view:1.4), (facing forward:1.4)`

### Outfit List (16 total)

| ID | Prompt (appended to SEXY base) |
|---|---|
| body-casual | off shoulder oversized sweater, no pants, bare legs, relaxed seductive |
| body-formal | elegant black evening gown, (deep v neckline:1.3), thigh slit, pearl earrings, sophisticated |
| body-school | japanese school uniform, white shirt unbuttoned, cleavage, (very short plaid skirt:1.2), loose tie, thigh highs |
| body-school-skimpy | revealing school uniform, (bikini top under open white shirt:1.3), micro plaid skirt, bow tie, midriff |
| body-cheerleader | cheerleader crop top, bare midriff, (very short pleated skirt:1.2), pom poms, thigh highs |
| body-cheer-extreme | (tiny red sports bra:1.3), (micro red pleated skirt:1.3), bare arms, bare shoulders, maximum skin, pom poms |
| body-cheer-extreme-back | from behind, looking back over shoulder, tiny sports bra, micro skirt, back view |
| body-maid | gothic maid outfit, (strapless black corset top:1.2), white frilly mini skirt, maid headdress, white lace, thigh high stockings, garter belt |
| body-vampire | vampire, (black and red gothic corset:1.2), deep cleavage, choker with gem, cape behind, fangs, bare shoulders, bare thighs |
| body-nurse | sexy nurse, (very short white dress:1.2), deep neckline, red cross, nurse cap, thigh highs |
| body-cow | (cow print micro string bikini:1.5), (cow pattern:1.4), (black and white spots:1.3), cow horns headband, golden bell choker, maximum skin, extremely skimpy |
| body-cowgirl | cowgirl, cowboy hat, (tied plaid shirt showing midriff:1.2), denim micro shorts, bare legs |
| body-demon | succubus demon girl, small horns, (revealing dark bodysuit:1.2), cutouts, bat wings, choker, seductive |
| body-bikini-front | (red micro string bikini only:1.5), (tiny bikini top:1.4), (string bikini bottom:1.4), bare stomach, bare shoulders, maximum skin, extremely skimpy |
| body-bikini-back | (from behind:1.5), (looking back over shoulder:1.3), (red string bikini:1.4), (thong:1.3), bare back, bare shoulders, bare thighs |
| body-back | (from behind:1.5), (back turned:1.4), (looking back over shoulder:1.3), white lab coat, red necktie, black shorts, confident |

## Output Files

- `scripts/regen-kurisu-v2.mjs` — txt2img base + img2img 15 expressions + rembg
- `scripts/gen-kurisu-outfits-v3.mjs` — img2img 16 outfits + rembg
- Sprites output to `public/sprites/kurisu/`

## Workflow

1. Run `regen-kurisu-v2.mjs` — generates body-neutral, then all 15 expressions
2. Visually inspect body-neutral. If good, proceed.
3. Run `gen-kurisu-outfits-v3.mjs` — generates 16 outfits from body-neutral
4. Both scripts auto-run rembg for background removal
