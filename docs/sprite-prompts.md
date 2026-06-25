# Sprite Prompt Reference - Anime Chatbot V1

ComfyUI prompts for Illustrious-based SDXL model (danbooru tag format).
Canvas size: 800x1400px, transparent background, all layers.

---

## Global Settings

**Resolution:** 800x1400 (or generate at 1600x2800 and downscale)
**Sampler:** Euler a / DPM++ 2M Karras
**Steps:** 28-35
**CFG:** 6-7
**Model:** Illustrious XL (or NoobAI-XL, WAI-ANI-NSFW-PONYXL, etc.)

### Global Negative Prompt

Use this for ALL generations:

```
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit,
fewer digits, cropped, worst quality, low quality, normal quality,
jpeg artifacts, signature, watermark, username, blurry, artist name,
multiple views, reference sheet, multiple characters, 3d, realistic,
photorealistic, deformed, ugly, duplicate, morbid, mutilated,
extra limbs, mutation, poorly drawn face, poorly drawn hands,
extra fingers, fused fingers, long neck, background, colored background
```

### Global Style Tags (prepend to all prompts)

```
masterpiece, best quality, absurdres, highres, anime style,
visual novel sprite, game cg, transparent background, png,
simple background, full body, standing, solo, looking at viewer
```

---

## Character 1: Arisu

**Identity anchor tags** (include in every Arisu prompt):

```
1girl, solo, long hair, wavy hair, silver hair, pink hair,
silver-pink hair, hair past waist, violet eyes, gentle eyes,
fair skin, porcelain skin, slender build, elegant,
white blouse, pink ribbon, cardigan, light cardigan,
cherry blossom hair ornament, flower hairpin
```

**Style references:** emilia \(re:zero\), violet evergarden, kyoto animation style

### Body Layers

**body-neutral.png**
```
masterpiece, best quality, absurdres, highres, anime style,
visual novel sprite, game cg, transparent background, png,
simple background, full body, standing, solo, looking at viewer,
1girl, long hair, wavy hair, silver hair, pink hair, silver-pink hair,
hair past waist, violet eyes, gentle eyes, fair skin, porcelain skin,
slender build, elegant, white blouse, pink ribbon, cardigan,
light cardigan, cherry blossom hair ornament, flower hairpin,
standing, relaxed pose, arms at sides, soft expression,
emilia \(re:zero\), violet evergarden, kyoto animation style
```

**body-arms-crossed.png**
```
masterpiece, best quality, absurdres, highres, anime style,
visual novel sprite, game cg, transparent background, png,
simple background, full body, standing, solo, looking at viewer,
1girl, long hair, wavy hair, silver hair, pink hair, silver-pink hair,
hair past waist, violet eyes, gentle eyes, fair skin, porcelain skin,
slender build, elegant, white blouse, pink ribbon, cardigan,
light cardigan, cherry blossom hair ornament, flower hairpin,
standing, arms crossed, crossed arms, composed pose,
emilia \(re:zero\), violet evergarden, kyoto animation style
```

**body-leaning.png**
```
masterpiece, best quality, absurdres, highres, anime style,
visual novel sprite, game cg, transparent background, png,
simple background, full body, standing, solo, looking at viewer,
1girl, long hair, wavy hair, silver hair, pink hair, silver-pink hair,
hair past waist, violet eyes, gentle eyes, fair skin, porcelain skin,
slender build, elegant, white blouse, pink ribbon, cardigan,
light cardigan, cherry blossom hair ornament, flower hairpin,
leaning forward, leaning in, hands clasped, curious pose,
emilia \(re:zero\), violet evergarden, kyoto animation style
```

### Eyes Layers

Generate as face close-up crops at the correct position on the 800x1400 canvas, or use inpainting on the base body with only the eye region unmasked.

**eyes-neutral.png**
```
(close-up face crop), violet eyes, gentle eyes, looking at viewer,
neutral expression, calm eyes, relaxed gaze, soft look,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-happy.png**
```
(close-up face crop), violet eyes, gentle eyes, looking at viewer,
happy, smiling eyes, closed mouth, soft happy expression,
half-closed eyes, warm gaze, sparkling eyes,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-surprised.png**
```
(close-up face crop), violet eyes, wide eyes, looking at viewer,
surprised, shocked expression, wide-eyed, raised eyelids,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-sad.png**
```
(close-up face crop), violet eyes, looking down, sad eyes,
downcast eyes, melancholy, worried expression, glistening eyes,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-angry.png**
```
(close-up face crop), violet eyes, sharp eyes, looking at viewer,
angry, annoyed expression, narrowed eyes, stern gaze, furrowed,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-closed.png**
```
(close-up face crop), closed eyes, eyes closed, relaxed face,
peaceful expression, eyelashes visible, closed eyelids
```

### Eyebrows Layers

Use inpainting with only the eyebrow region unmasked.

**eyebrows-neutral.png**
```
(eyebrow detail), neutral eyebrows, relaxed brow, natural position
```

**eyebrows-raised.png**
```
(eyebrow detail), raised eyebrows, high eyebrows, surprised brow,
arched eyebrows
```

**eyebrows-furrowed.png**
```
(eyebrow detail), furrowed eyebrows, furrowed brow, concentrated,
knitted brows, thinking expression
```

**eyebrows-sad.png**
```
(eyebrow detail), sad eyebrows, upturned eyebrows, worried brow,
inner eyebrows raised, concerned expression
```

### Mouth Layers

Use inpainting with only the mouth region unmasked.

**mouth-closed.png**
```
(mouth detail), closed mouth, lips together, neutral mouth,
soft lips, gentle expression
```

**mouth-smile.png**
```
(mouth detail), smile, gentle smile, soft smile, happy mouth,
slight smile, warm smile, closed mouth smile
```

**mouth-talk-1.png**
```
(mouth detail), open mouth, slightly open mouth, parted lips,
talking, speaking, mid-speech, small opening
```

**mouth-talk-2.png**
```
(mouth detail), open mouth, wide open mouth, talking, speaking,
mid-speech, vowel shape, ah mouth
```

**mouth-surprised.png**
```
(mouth detail), open mouth, :o, surprised mouth, o-shaped mouth,
shocked expression, round mouth
```

**mouth-pout.png**
```
(mouth detail), pout, pouting, pursed lips, puffed cheeks,
dissatisfied mouth, cute pout
```

---

## Character 2: Marin

**Identity anchor tags** (include in every Marin prompt):

```
1girl, solo, long hair, voluminous hair, wavy hair, blonde hair,
bright blonde hair, amber eyes, honey eyes, tanned skin, dark skin,
gyaru, kogal, confident, toothy smile, athletic build, curvy,
crop top, midriff, off-shoulder top, bralette strap, short shorts,
thigh-high stockings, thighhighs, absolute territory,
gold earrings, hoop earrings, layered necklace, gold necklace,
long nails, decorated nails, nail art, platform sneakers
```

**Style references:** kitagawa marin, galko \(oshiete! galko-chan\)

### Body Layers

**body-neutral.png**
```
masterpiece, best quality, absurdres, highres, anime style,
visual novel sprite, game cg, transparent background, png,
simple background, full body, standing, solo, looking at viewer,
1girl, long hair, voluminous hair, wavy hair, blonde hair,
amber eyes, honey eyes, tanned skin, dark skin, gyaru, kogal,
confident, athletic build, curvy, crop top, midriff,
off-shoulder top, bralette strap, short shorts,
thigh-high stockings, thighhighs, absolute territory,
gold earrings, hoop earrings, layered necklace, gold necklace,
long nails, decorated nails, platform sneakers,
standing, relaxed pose, hand on hip, confident stance,
kitagawa marin, galko \(oshiete! galko-chan\)
```

**body-arms-crossed.png**
```
masterpiece, best quality, absurdres, highres, anime style,
visual novel sprite, game cg, transparent background, png,
simple background, full body, standing, solo, looking at viewer,
1girl, long hair, voluminous hair, wavy hair, blonde hair,
amber eyes, honey eyes, tanned skin, dark skin, gyaru, kogal,
confident, athletic build, curvy, crop top, midriff,
off-shoulder top, bralette strap, short shorts,
thigh-high stockings, thighhighs, absolute territory,
gold earrings, hoop earrings, layered necklace, gold necklace,
long nails, decorated nails, platform sneakers,
standing, arms crossed, crossed arms, smug pose,
kitagawa marin, galko \(oshiete! galko-chan\)
```

**body-leaning.png**
```
masterpiece, best quality, absurdres, highres, anime style,
visual novel sprite, game cg, transparent background, png,
simple background, full body, standing, solo, looking at viewer,
1girl, long hair, voluminous hair, wavy hair, blonde hair,
amber eyes, honey eyes, tanned skin, dark skin, gyaru, kogal,
confident, athletic build, curvy, crop top, midriff,
off-shoulder top, bralette strap, short shorts,
thigh-high stockings, thighhighs, absolute territory,
gold earrings, hoop earrings, layered necklace, gold necklace,
long nails, decorated nails, platform sneakers,
leaning forward, leaning in, excited pose, hands together,
kitagawa marin, galko \(oshiete! galko-chan\)
```

### Eyes Layers

**eyes-neutral.png**
```
(close-up face crop), amber eyes, honey eyes, gyaru makeup,
eye makeup, looking at viewer, neutral expression, confident gaze,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-happy.png**
```
(close-up face crop), amber eyes, honey eyes, gyaru makeup,
eye makeup, looking at viewer, happy, sparkling eyes, excited eyes,
>_<, grinning, joyful gaze, bright expression,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-surprised.png**
```
(close-up face crop), amber eyes, honey eyes, gyaru makeup,
eye makeup, looking at viewer, surprised, wide eyes, wide-eyed,
shocked, amazed expression,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-sad.png**
```
(close-up face crop), amber eyes, honey eyes, gyaru makeup,
eye makeup, looking down, sad eyes, teary eyes, worried,
downcast gaze, watery eyes,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-angry.png**
```
(close-up face crop), amber eyes, honey eyes, gyaru makeup,
eye makeup, looking at viewer, angry, sharp eyes, glaring,
annoyed, fierce gaze, intimidating,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-closed.png**
```
(close-up face crop), closed eyes, eyes closed, gyaru makeup,
eye makeup, happy closed eyes, eyelashes visible, relaxed
```

### Eyebrows Layers

**eyebrows-neutral.png**
```
(eyebrow detail), neutral eyebrows, relaxed brow, natural position,
thin eyebrows, groomed
```

**eyebrows-raised.png**
```
(eyebrow detail), raised eyebrows, high eyebrows, surprised brow,
arched eyebrows, excited expression
```

**eyebrows-furrowed.png**
```
(eyebrow detail), furrowed eyebrows, furrowed brow, determined,
knitted brows, focused
```

**eyebrows-sad.png**
```
(eyebrow detail), sad eyebrows, upturned eyebrows, worried brow,
inner eyebrows raised, upset expression
```

### Mouth Layers

**mouth-closed.png**
```
(mouth detail), closed mouth, lips together, confident expression,
lip gloss, glossy lips
```

**mouth-smile.png**
```
(mouth detail), grin, toothy smile, big smile, teeth showing,
open mouth smile, confident smile, bright smile, lip gloss
```

**mouth-talk-1.png**
```
(mouth detail), open mouth, slightly open mouth, parted lips,
talking, speaking, mid-speech, energetic, lip gloss
```

**mouth-talk-2.png**
```
(mouth detail), open mouth, wide open mouth, talking, speaking,
mid-speech, excited speech, vowel shape, lip gloss
```

**mouth-surprised.png**
```
(mouth detail), open mouth, :o, surprised mouth, shocked,
o-shaped mouth, amazed, wide open, lip gloss
```

**mouth-pout.png**
```
(mouth detail), pout, pouting, puffed cheeks, dissatisfied,
bratty pout, cute pout, lip gloss
```

---

## Character 3: Nao

**Identity anchor tags** (include in every Nao prompt):

```
1girl, solo, medium hair, messy hair, bob cut, dark blue hair,
navy hair, lavender highlights, colored inner hair, wispy bangs,
skull hair ornament, hairclip, teal eyes, blue-green eyes,
sharp eyes, dark eyeliner, long eyelashes, pale skin, fair skin,
pretty face, smirk, mischievous smile,
oversized t-shirt, band t-shirt, slightly cropped shirt,
dark plaid skirt, pleated skirt, mini skirt,
black thigh-high stockings, thighhighs, star pattern,
oversized hoodie, unzipped hoodie, sleeves past wrists,
choker, pendant, over-ear headphones, headphones around neck,
purple headphones, fingerless gloves, combat boots, ribbon laces,
pins on hoodie, cat pin, cute pins
```

**Style references:** futaba sakura \(persona 5\), misa amane, rem \(re:zero\)

### Body Layers

**body-neutral.png**
```
masterpiece, best quality, absurdres, highres, anime style,
visual novel sprite, game cg, transparent background, png,
simple background, full body, standing, solo, looking at viewer,
1girl, medium hair, messy hair, bob cut, dark blue hair, navy hair,
lavender highlights, colored inner hair, wispy bangs,
skull hair ornament, hairclip, teal eyes, blue-green eyes,
sharp eyes, dark eyeliner, long eyelashes, pale skin, fair skin,
pretty face, smirk,
oversized t-shirt, band t-shirt, slightly cropped shirt,
dark plaid skirt, pleated skirt, mini skirt,
black thigh-high stockings, thighhighs, star pattern,
oversized hoodie, unzipped hoodie, sleeves past wrists,
choker, pendant, over-ear headphones, headphones around neck,
purple headphones, fingerless gloves, combat boots, ribbon laces,
pins on hoodie, cat pin,
standing, relaxed pose, hands in pockets, slouched stance, cool pose,
futaba sakura \(persona 5\), rem \(re:zero\)
```

**body-arms-crossed.png**
```
masterpiece, best quality, absurdres, highres, anime style,
visual novel sprite, game cg, transparent background, png,
simple background, full body, standing, solo, looking at viewer,
1girl, medium hair, messy hair, bob cut, dark blue hair, navy hair,
lavender highlights, colored inner hair, wispy bangs,
skull hair ornament, hairclip, teal eyes, blue-green eyes,
sharp eyes, dark eyeliner, long eyelashes, pale skin, fair skin,
pretty face, smirk,
oversized t-shirt, band t-shirt, slightly cropped shirt,
dark plaid skirt, pleated skirt, mini skirt,
black thigh-high stockings, thighhighs, star pattern,
oversized hoodie, unzipped hoodie, sleeves past wrists,
choker, pendant, over-ear headphones, headphones around neck,
purple headphones, fingerless gloves, combat boots, ribbon laces,
pins on hoodie, cat pin,
standing, arms crossed, crossed arms, unimpressed pose, judging,
futaba sakura \(persona 5\), rem \(re:zero\)
```

**body-leaning.png**
```
masterpiece, best quality, absurdres, highres, anime style,
visual novel sprite, game cg, transparent background, png,
simple background, full body, standing, solo, looking at viewer,
1girl, medium hair, messy hair, bob cut, dark blue hair, navy hair,
lavender highlights, colored inner hair, wispy bangs,
skull hair ornament, hairclip, teal eyes, blue-green eyes,
sharp eyes, dark eyeliner, long eyelashes, pale skin, fair skin,
pretty face, smirk,
oversized t-shirt, band t-shirt, slightly cropped shirt,
dark plaid skirt, pleated skirt, mini skirt,
black thigh-high stockings, thighhighs, star pattern,
oversized hoodie, unzipped hoodie, sleeves past wrists,
choker, pendant, over-ear headphones, headphones around neck,
purple headphones, fingerless gloves, combat boots, ribbon laces,
pins on hoodie, cat pin,
leaning forward, leaning in, mischievous pose, playful,
futaba sakura \(persona 5\), rem \(re:zero\)
```

### Eyes Layers

**eyes-neutral.png**
```
(close-up face crop), teal eyes, blue-green eyes, sharp eyes,
dark eyeliner, long eyelashes, looking at viewer,
neutral expression, cool gaze, half-lidded, bored look,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-happy.png**
```
(close-up face crop), teal eyes, blue-green eyes, sharp eyes,
dark eyeliner, long eyelashes, looking at viewer,
happy, smug smile, satisfied eyes, mischievous gleam,
cat-like eyes, playful gaze,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-surprised.png**
```
(close-up face crop), teal eyes, blue-green eyes, sharp eyes,
dark eyeliner, long eyelashes, looking at viewer,
surprised, wide eyes, wide-eyed, caught off guard,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-sad.png**
```
(close-up face crop), teal eyes, blue-green eyes, sharp eyes,
dark eyeliner, long eyelashes, looking away,
sad eyes, downcast, melancholy, averted gaze, vulnerable,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-angry.png**
```
(close-up face crop), teal eyes, blue-green eyes, sharp eyes,
dark eyeliner, long eyelashes, looking at viewer,
angry, glaring, death stare, intense gaze, narrowed eyes,
detailed eyes, beautiful detailed eyes, eye reflection
```

**eyes-closed.png**
```
(close-up face crop), closed eyes, eyes closed, dark eyeliner,
long eyelashes, eyelashes visible, relaxed, peaceful
```

### Eyebrows Layers

**eyebrows-neutral.png**
```
(eyebrow detail), neutral eyebrows, relaxed brow, natural position,
slightly angled, cool expression
```

**eyebrows-raised.png**
```
(eyebrow detail), raised eyebrows, one eyebrow raised,
skeptical brow, arched eyebrow, questioning
```

**eyebrows-furrowed.png**
```
(eyebrow detail), furrowed eyebrows, furrowed brow, intense,
knitted brows, concentrating, hacker focus
```

**eyebrows-sad.png**
```
(eyebrow detail), sad eyebrows, upturned eyebrows, worried brow,
inner eyebrows raised, subtle concern
```

### Mouth Layers

**mouth-closed.png**
```
(mouth detail), closed mouth, lips together, neutral mouth,
slight smirk, poker face
```

**mouth-smile.png**
```
(mouth detail), smirk, mischievous smile, sly smile,
one-sided smile, knowing grin, closed mouth smile
```

**mouth-talk-1.png**
```
(mouth detail), open mouth, slightly open mouth, parted lips,
talking, speaking, mid-speech, dry delivery
```

**mouth-talk-2.png**
```
(mouth detail), open mouth, wide open mouth, talking, speaking,
mid-speech, vowel shape, animated speech
```

**mouth-surprised.png**
```
(mouth detail), open mouth, :o, surprised mouth, shocked,
o-shaped mouth, rare surprise
```

**mouth-pout.png**
```
(mouth detail), pout, pouting, tsundere pout, annoyed mouth,
grumpy, cute frustrated expression
```

---

## Workflow Notes

### Recommended Generation Order

1. **Body-neutral first** for each character. Lock down the look.
2. Use img2img or ControlNet reference to keep identity consistent across body poses.
3. For face layers (eyes, eyebrows, mouth), use **inpainting** on the neutral body:
   - Mask only the specific facial region
   - Generate variants
   - Export just the masked region as a transparent PNG layer
4. Alternatively, use a face-region ControlNet + regional prompting to generate face parts at consistent angles.

### Consistency Tips

- Use the same seed for all body variants of a character, varying only the pose tags.
- For face layers, keep the same seed and only change the expression/feature tags.
- If using IP-Adapter or reference image: feed the body-neutral as reference for all subsequent generations.
- LoRA: If you find a good character LoRA match, note the trigger word and weight here.

### Export Checklist

- [ ] All PNGs are transparent background (alpha channel)
- [ ] All layers share the same canvas size (800x1400)
- [ ] Face layers are positioned to align with the body layer
- [ ] No background bleed or artifacts at edges
- [ ] File names match the spec exactly (e.g., `eyes-happy.png`, not `eyes_happy.png`)

### Layer Alignment

If face layers don't align perfectly with the body, configure offsets in the sprite engine config:

```typescript
// Example offset config in character definition
sprites: {
  eyes: { offsetX: 0, offsetY: -2 },
  eyebrows: { offsetX: 0, offsetY: -4 },
  mouth: { offsetX: 1, offsetY: 0 },
}
```

### Asset Count Summary

| Character | Bodies | Eyes | Eyebrows | Mouths | Total |
|-----------|--------|------|----------|--------|-------|
| Arisu     | 3      | 6    | 4        | 6      | 19    |
| Marin     | 3      | 6    | 4        | 6      | 19    |
| Nao       | 3      | 6    | 4        | 6      | 19    |
| **Total** |        |      |          |        | **57** |
