# ComfyUI Art Prompts for Anime Chatbot

Use VNCCS (Visual Novel Character Creation Suite) on RunComfy with Illustrious-based models.

## New Character Expressions to Generate

Each character needs these additional face expressions (same 512x896, transparent BG, same angle/identity as existing):

### Expressions Needed
- `face-devoted.png` - Deeply loving, warm eyes, gentle blush, tender smile
- `face-teasing.png` - Playful wink, tongue out slightly, mischievous
- `face-sleepy.png` - Half-closed eyes, gentle yawn or drowsy smile
- `face-excited.png` - Wide sparkling eyes, big grin, slight bounce energy
- `face-shy.png` - Looking away, deep blush, hand near face
- `face-jealous.png` - Side-eye, slight pout, arms crossed hint
- `face-crying.png` - Tears streaming, scrunched eyebrows, wobbly mouth

### Arisu Prompts
Base: `1girl, silver-pink wavy hair past waist, gentle violet eyes, fair porcelain skin, white blouse with pink ribbon, light cardigan, cherry blossom hairpin, soft lighting, anime style, high quality, transparent background`

- devoted: `+ deeply loving expression, warm gaze, tender smile, slight blush, sparkling eyes`
- teasing: `+ playful wink, tongue out, mischievous smile, tilted head`
- sleepy: `+ drowsy half-closed eyes, gentle yawn, peaceful expression`
- excited: `+ wide sparkling eyes, big happy grin, energetic`
- shy: `+ looking away bashfully, deep blush, hand covering mouth`
- jealous: `+ side-eye glance, slight pout, arms crossed`
- crying: `+ tears streaming, scrunched eyebrows, emotional`

### Marin Prompts
Base: `1girl, long voluminous blonde wavy hair, bright amber honey eyes, sun-kissed golden-brown tanned skin, gyaru makeup, confident smile, fitted crop top, gold hoop earrings, layered gold necklaces, anime style, high quality, transparent background`

- devoted: `+ deeply loving gaze, warm amber eyes, heart hands, blush through tan`
- teasing: `+ playful wink, tongue out, finger guns, gyaru pose`
- sleepy: `+ drowsy half-closed eyes, messy hair, cute yawn`
- excited: `+ sparkling wide eyes, huge grin, peace sign, energetic`
- shy: `+ rare shy moment, looking away, hands behind back, blush`
- jealous: `+ jealous pout, arms crossed, side-eye, competitive look`
- crying: `+ tears with smile, emotional, happy crying`

### Nao Prompts
Base: `1girl, medium messy dark navy bob with lavender highlights, sharp teal-blue eyes, pale fair skin, dark eyeliner, skull hairpin, oversized hoodie, choker with LED pendant, pastel purple headphones around neck, anime style, high quality, transparent background`

- devoted: `+ rare soft vulnerable look, gentle teal eyes, barely visible smile, slight blush`
- teasing: `+ evil smirk, half-closed eyes, finger on chin, plotting expression`
- sleepy: `+ headphones askew, eyes barely open, drowsy glitch aesthetic`
- excited: `+ rare wide-eyed excitement, slight grin, energized, pupils dilated`
- shy: `+ looking away sharply, pink tinge on pale cheeks, hoodie pulled up`
- jealous: `+ narrowed eyes, cold stare, arms crossed tightly, competitive`
- crying: `+ single tear, trying to hide it, looking away, vulnerable`

## New Outfits to Generate

### Per Character (full body, 512x896, transparent BG):
- `body-casual.png` - Casual home outfit (pajamas/loungewear)
- `body-formal.png` - Dressed up (dress/gown)
- `body-school.png` - School uniform (Japanese style)

### Arisu Outfits
- casual: `+ wearing soft pink pajama set, fluffy slippers, hair down, relaxed pose`
- formal: `+ elegant white and pink gown, hair up with flowers, graceful pose`
- school: `+ Japanese school uniform, sailor collar, pleated skirt, school bag`

### Marin Outfits
- casual: `+ oversized band tee as nightshirt, bare legs, messy bun, relaxed`
- formal: `+ glamorous gold mini dress, strappy heels, hair styled, confident pose`
- school: `+ customized school uniform, short skirt, loose tie, gyaru style`

### Nao Outfits
- casual: `+ oversized black hoodie, gaming headset, shorts, bare feet, slouching`
- formal: `+ dark purple gothic lolita dress, boots, dramatic eyeliner, cool pose`
- school: `+ school uniform with hoodie over it, headphones, pins on bag`

## Scene Backgrounds (1920x1080, for future use)

Generate these as standalone background images:
- `bg-sakura.png` - Cherry blossom garden, soft pink petals, gentle sunlight
- `bg-beach.png` - Tropical beach, golden hour, palm trees, turquoise water
- `bg-cyberpunk.png` - Neon-lit city alley at night, purple/teal glow, rain
- `bg-cafe.png` - Cozy anime cafe interior, warm lighting, wooden tables
- `bg-rooftop.png` - School rooftop at sunset, fence, sky gradient
- `bg-bedroom.png` - Anime bedroom at night, fairy lights, soft glow, cozy
- `bg-rain.png` - Rainy window view, city lights blurred, moody blue
- `bg-starfield.png` - Night sky with stars and milky way, dark gradient

Negative prompts for all: `low quality, blurry, deformed, extra fingers, bad anatomy, text, watermark, signature, worst quality`
