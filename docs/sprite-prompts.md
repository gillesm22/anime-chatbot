# Sprite Prompt Standard V3

ComfyUI prompts for IllustriousXL MMMix v80 (danbooru tag format).
Order-based prompting — tag position controls priority, not weights.
Validated on Merrick across 83+ renders at 80%+ solo rate.

---

## Formula (Locked)

| Setting | Value |
|---------|-------|
| Model | `illustriousxlMmmix_v80.safetensors` |
| Resolution | 832×1216 |
| Sampler | `dpmpp_2m_sde` |
| Scheduler | `karras` |
| Steps | 40 |
| CFG | 6.5 |
| Denoise | 1.0 (txt2img base), 0.58 (img2img expressions), 0.72 (img2img outfits) |

---

## Core Principle: Tag Order, Not Weights

IllustriousXL is trained on danbooru tags. It understands them natively.
Earlier tags get more attention. Later tags get diluted. Priority = position.

**DO NOT weight-stack.** The only weight in the entire prompt is `(solo:1.5)`.

---

## Prompt Template

### Positive — Tag Order (highest priority first)

```
1. Isolation guard     (solo:1.5), 1girl, one person
2. Background          white background, simple background, transparent background, png
3. Skin                [character skin tags]
4. Hair                [character hair tags]
5. Eyes                [character eye tags]
6. Face                [character face tags]
7. Body                [character body tags]
8. Framing + Pose      cowboy shot, looking at viewer, standing, [asymmetric pose]
9. Outfit              [swappable outfit tags]
10. Accessories        [plain tags, never weighted]
11. Quality + Style    masterpiece, best quality, highres, anime style, visual novel sprite, game cg, cel shading, clean lineart, sharp focus
```

### Negative — Standard (same for all characters)

```
low quality, worst quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature,
multiple girls, 2girls, multiple characters, split screen, mirror, reflection, duo,
ugly, duplicate, extra limbs, poorly drawn face, mutation, bad proportions,
reference sheet, multiple views, character sheet, expression sheet,
collage, grid, panels, borders, frames,
props, furniture, background objects,
[ANTI-WRONG-HAIR — per character],
[ANTI-WRONG-SKIN — per character],
[ANTI-WRONG-EYES — per character],
close-up, portrait, full body,
sitting, kneeling,
background, grey background, gradient background,
child, loli, young,
chibi, glasses, headphones,
male, man, boy
```

**Negative prompt: also no weights.** Plain tags only.

---

## Hard Rules

### Weights
- **ONE weight in the entire prompt:** `(solo:1.5)`. Nothing else.
- IllustriousXL responds to tag order, not emphasis syntax.
- Weights above 1.5 cause artifacts, color bleed, and coherence loss.
- Multiple weighted tags cause concepts to cross-contaminate (e.g. "emerald" bleeds green into clothing).
- If something isn't showing up, move the tag earlier in the prompt — don't add a weight.

### Outfit Naming
- **Use casual clothing terms.** `tank top`, `crop top`, `shorts`, `dress`.
- **Avoid lingerie/fashion terminology.** `camisole`, `silk`, `lace trim` trigger catalog associations → duplicate characters.
- Keep outfit descriptions simple and direct. 5-8 tags max.
- For max exposure outfits: lead with the exposure tags (`bare midriff, bare thighs, panties visible`) before the clothing descriptor.

### Pose
- **Every pose must be asymmetric.** `hand on hip`, `arms crossed`, `leaning forward`.
- **NEVER use:** `arms at sides`, `standing straight` — these are reference sheet poses that cause multi-view duplicates.

### Accessories
- **Plain tags only.** `gold hoop earrings` not `(gold hoop earrings:1.3)`.
- Weighted accessory tags trigger fashion shoot / multi-model associations.

### Anti-Identity Tags (Negative)
- Always include anti-wrong-skin for dark-skinned characters: `pale skin, fair skin`.
- Always include anti-wrong-hair and anti-wrong-eye color tags per character.
- No weights needed in negative prompt either.

### Generation Process
1. **Base (txt2img):** Seed hunt with body-neutral prompt. Lock the seed.
2. **Expressions (img2img):** Denoise 0.58, append expression tags to full base prompt, seed+1 through +15.
3. **Outfits (txt2img):** Locked seed, swap outfit tags only. Keep all identity + pose + style tags identical.
4. **If something fails:** Change ONE thing (usually seed+1). If still wrong after 2 tries, STOP and consult.

---

## Character: Merrick (Validated — V3)

**Proven seeds:** 55700 (best), 55630, 55600, 55660
**Script:** `scripts/test-merrick-v3.mjs`

### Full Positive (body-neutral)
```
(solo:1.5), 1girl, one person,
white background, simple background, transparent background, png,
dark brown skin, smooth skin,
long black hair, hair past waist, straight hair,
green eyes, long eyelashes,
pretty face, mature face,
mature female, adult, tall, large breasts, slender waist, curvy,
cowboy shot, looking at viewer, standing, hand on hip,
black tank top, fitted black pants,
gold hoop earrings, jade pendant necklace,
masterpiece, best quality, highres, anime style, visual novel sprite, game cg,
cel shading, clean lineart, sharp focus
```

### Anti-Identity Negatives
```
blonde hair, silver hair, white hair, pink hair, red hair,
pale skin, fair skin,
blue eyes, violet eyes, red eyes
```

### Expressions
```
face-happy:      happy warm smile, bright eyes, genuine warmth, quiet delight
face-thinking:   thoughtful expression, eyes looking up, contemplative, finger on chin
face-surprised:  wide eyes, slightly open mouth, eyebrows raised, rarely caught off guard
face-sad:        downcast eyes, slight frown, melancholic, quiet grief
face-smirk:      knowing smirk, one corner raised, half-lidded eyes, sees right through you
face-laugh:      eyes closed with quiet joy, measured laugh, hand near mouth
face-angry:      cool displeasure, narrowed eyes, tight jaw, composed fury
face-flustered:  rare loss of composure, slight blush on dark skin, averted gaze
face-devoted:    deep unhurried love, warm soft gaze, gentle expression, tender smile
face-teasing:    playful curiosity, sly grin, one eyebrow raised, elegant mischief
face-sleepy:     meditative stillness, half-closed eyes, peaceful, serene
face-excited:    intellectual delight, wide bright eyes, genuine interest
face-shy:        rare uncertainty, looking slightly away, quiet moment
face-jealous:    possessive glance, narrowed eyes, side look
face-crying:     tears on dark skin, grief, scrunched brows, rare vulnerability
```

### Outfit Examples (swap into position 9)

| Outfit | Tags |
|--------|------|
| Default | `black tank top, fitted black pants` |
| School | `japanese school uniform, white shirt, unbuttoned collar, plaid skirt, loose tie, thigh highs` |
| School+ | `open white shirt, front tie crop top, very short plaid micro skirt, bare midriff, bare thighs, thigh highs` |
| School max | `white crop top, open front, plaid string bikini bottom, panties visible, bare midriff, bare stomach, bare thighs, navel, cleavage, loose necktie, thigh highs` |
| Cheerleader | `cheerleader crop top, pleated miniskirt, bare midriff, thigh highs` |
| Cheer+ | `string bikini top, micro pleated skirt, pom poms, panties visible, bare midriff, bare stomach, bare thighs, bare hips, navel, cleavage, skimpy` |
| Cowgirl | `cowgirl, cowboy hat, tied plaid shirt, crop top, denim short shorts, cowboy boots, belt buckle` |
| Nurse | `nurse outfit, short white nurse dress, nurse cap, red cross, stethoscope, cleavage, bare shoulders` |
| Cow | `cow print micro bikini, cow pattern, cow horns headband, golden bell choker, bare midriff, bare thighs, maximum skin` |
| Vampire | `vampire, black corset mini dress, bat wings, garter stockings, red ribbon accents, black choker with gem, small fangs` |
| Maid | `french maid outfit, black dress, white frilly apron, maid headband, thigh high stockings` |
| Demon | `succubus, small horns, dark bodysuit, cutouts, bat wings, choker, seductive` |
| Casual | `oversized off-shoulder sweater, bare legs, relaxed, cozy` |
| Formal | `elegant black evening gown, thigh slit, pearl earrings, sophisticated` |
| Bikini front | `string bikini, swimsuit, bare midriff, bare thighs, bare stomach, navel, cleavage` |
| Bikini back | `from behind, looking back over shoulder, string bikini, bare back, bare thighs` |

---

## Character: Kurisu (Needs V3 Update)

**Winning seed:** 44466
**Script:** `scripts/regen-kurisu-v2.mjs` (still V2 weights — needs rewrite)

### Identity Tags (V3 style — no weights)
```
pale skin, soft skin,
dark red-brown hair, chestnut hair, long hair, hair between eyes,
dark violet eyes, sharp eyes,
long eyelashes, pretty face, mature face,
mature female, adult, athletic, medium-large breasts, slender waist
```

### Default Outfit
```
white lab coat, white collared shirt, red necktie, black shorts
```

### Anti-Identity Negatives
```
blonde hair, silver hair, white hair, pink hair, orange hair,
tanned skin, dark skin,
blue eyes, pink eyes, red eyes
```

---

## Character: Suzuka/Nao (Reference — Working)

**Winning seed:** 44458
**Script:** `scripts/regen-suzuka.mjs`

### Identity Tags
```
pale skin, soft skin,
dark purple hair, high ponytail, side bangs,
teal eyes, sharp eyes,
dark eyeliner, long eyelashes, pretty face, mature face,
mature female, adult, curvy, thick thighs, slender waist
```

### Default Outfit
```
cowgirl, tied plaid shirt, crop top, denim short shorts,
cowboy hat, cowboy boots, choker
```

---

## Character: Arisu (Validated — V3)

**Proven seeds:** 55710 (wardrobe batch), 55901-55903 (gap fills), 55905 (clown),
**55978 (locked default body, 2026-07-30 — "own hands together, hands in front" pose)**
**Configs:** `scripts/sprite-configs/arisu-clown.json` (exemplar for new outfits),
`scripts/sprite-configs/arisu-faces-55978.json` (expression batch vs the 55978 base)

Note: the identity below is what the entire live `arisu-regen` wardrobe was
actually generated and picked with — it supersedes the older
"silver-pink hair, violet eyes, pale skin" concept description.

### Identity Tags
```
dark brown skin, smooth skin,
light pink hair, long hair, wavy hair,
brown eyes, long eyelashes,
pretty face, mature face, detailed face, detailed eyes, sharp facial features,
mature female, adult, tall, large breasts, slender waist, curvy
```

The `detailed face, detailed eyes, sharp facial features` tags in the face
slot are the fix for soft/blurry features on img2img expression passes.
Put them in the face slot (early), never as a weight; a steps bump
(40→50) was tested and does nothing at the same seed/denoise.

### Expression Overrides (Arisu)

The shared expression lines (Merrick section) work for Arisu EXCEPT angry:
"cool displeasure, composed fury" is not danbooru vocabulary and reads
neutral on her. Use plain anger tags instead:
```
face-angry:  angry, glaring, furrowed brows, frown, v-shaped eyebrows, narrowed eyes
```

### Anti-Bleed Negatives (expression img2img)

Expression passes can bleed wardrobe concepts onto the face (fangs,
face-paint teardrops, smeared black eye makeup — vampire/clown leakage).
Verified fix (same-seed A/B on thinking/surprised, 2026-07-30): add to
the standard negative for all expression img2img jobs:
```
face paint, war paint, face markings, makeup streaks, black eye makeup, fangs, vampire, blood
```
Plus per-job `teardrop, tears, crying` on every expression EXCEPT
sad and crying (whose tears are legitimate).

### Face-Detail Pass (best-quality faces)

Even with detail tags, features at full-body scale are soft because the
face only gets ~340px. Validated fix (2026-07-30, happy/angry/flustered
vs base 55978):

1. Crop the head region from the finished 832x1216 render
   (Arisu @ 55978 pose: box `(248, 36, 588, 454)` = 340x418).
2. Upscale the crop to 832x1024 (Lanczos) → ComfyUI input.
3. img2img the crop at **denoise 0.45**, same seed, face-focused prompt:
   identity + face slots kept, body/pose slots replaced with
   `portrait, face focus, looking at viewer`, and drop `close-up, portrait`
   from the negative. Everything else per V3.
4. Downscale the result back to crop size and paste over the original
   with a 16px feathered (Gaussian) mask — no visible seam.

Helper script (prep/merge): session scratchpad `face-detail-pass.py`
pattern — crop box + feather are the only per-character tunables.

### Accessories
```
flower hair clip
```

### Anti-Identity Negatives
```
silver hair, white hair, red hair, brown hair, black hair,
pale skin, fair skin,
blue eyes, red eyes, green eyes
```

### Outfit Examples (swap into position 9)

| Outfit | Tags |
|--------|------|
| Clown (seed 55905) | `clown outfit, colorful ruffled collar, pom pom buttons, red clown nose, rainbow striped dress, white gloves` + negative: `face paint, white face makeup, creepy, scary clown, horror` |

Other outfits (casual, formal, nurse, vampire, cow, cowgirl, school,
cheerleader, maid, demon, bikini) reuse the Merrick outfit tag lines.

---

## Characters Remaining (Need V3 Prompts)

- **Marin** — tanned gyaru, blonde/black hair, amber eyes, dark skin
- **Ticia** — gothic contemplative, jet black hair, dark brown eyes, pale skin

Write identity tags following V3 rules: no weights, order-based priority, plain danbooru tags.

---

## Pose Reference

| Variant | Pose tags |
|---------|-----------|
| body-neutral | `standing, hand on hip` |
| body-arms-crossed | `standing, arms crossed` |
| body-leaning | `leaning forward, hands clasped` |
| back shots | `from behind, looking back over shoulder` |
| Expressions | Inherited from base (img2img) |
| Outfits | `standing, hand on hip` or `standing, casual stance` |

**Rule: No symmetrical neutral poses. Every pose must break symmetry.**

---

## Evolution Log

- **2026-07-30**: Arisu default body locked at seed 55978. Face-detail
  pass validated (head crop → 832x1024 img2img @ 0.45 → feathered blend):
  dramatically sharper features, no identity drift. `detailed face,
  detailed eyes, sharp facial features` added to Arisu's face slot.
  Steps 40→50 tested: no visible effect at same seed/denoise — steps is
  not a sharpness lever. Arisu angry override: plain danbooru anger tags
  (composed-fury phrasing reads neutral on her).

- **2026-07-23**: Arisu promoted to Validated V3 with her as-generated
  identity (dark skin / pink hair / brown eyes). Clown outfit locked at
  seed 55905, wired into app (`clown` outfit id).

- **V3** (2026-07-10): Order-based prompting. Stripped ALL weights except `(solo:1.5)`. 547 chars vs 1387. Validated on 83+ Merrick renders. Key insight: IllustriousXL responds to tag order, not weight syntax.
- **V2** (2026-07-09): Dialed-down weights. Discovered skin weight, outfit naming, and pose asymmetry rules. 80% solo rate.
- **V1** (deprecated): Layer-based system with anything-v5. Abandoned.
