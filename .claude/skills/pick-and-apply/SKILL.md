---
name: pick-and-apply
description: Take generated sprite candidates from picked winner to live in-game asset for HEXXII — selection gallery, applying picks, background removal (rembg), face-onto-body compositing, canvas verification, promotion to public/sprites/, and outfit wiring in the app code. Use this whenever the user wants to pick winners from a generation batch, apply picks, make a sprite "live"/"real"/"in the game", remove backgrounds, fix sprite size-shift or ghosting on expression change, or add a new outfit to the app UI — even casual asks like "the vampire one looks good, ship it" or "my picks are in Downloads".
---

# pick-and-apply — From Candidate to Live Sprite

Generated candidates (from the gen-sprites skill) are NOT game-ready.
Raw generations have white backgrounds, arbitrary canvas sizes, and
face images whose content bounds differ from the body — putting one
in the game untreated causes the sprite to visibly jump size when the
expression changes. That bug shipped twice (commits 08eb53d, 5e688e7).
This skill is the ordered pipeline that prevents it.

## The pipeline

### 1. Pick winners (user decides, never you)

For big batches, build the selection gallery:

```bash
node scripts/build-pick-gallery.mjs <charId> <outfit,outfit,...>
```

This writes `pick-gallery.html` at the repo root. The user opens it,
checks their favorites, and clicks **Export picks** — which downloads
`picks-add.json` to their Downloads folder. For small batches (a handful
of images), just show the user the files and ask which they want.

### 2. Apply picks into staging

```bash
node scripts/apply-picks-add.mjs [path-to-picks-add.json]
```

Defaults to `~/Downloads/picks-add.json`. Copies chosen images into
`regen-3/{character}/` — additive, never wipes existing curation.

### 3. Finalize (the step that keeps getting skipped — don't)

```bash
python .claude/skills/pick-and-apply/scripts/finalize-sprites.py <staging-dir> --char <id>
```

The bundled script does bg removal (rembg, skipping already-transparent
images), composites every `face-*.png` onto `body-neutral.png` so only
the expression region ever changes, resizes body variants to the
reference canvas, and hard-verifies every PNG matches the body-neutral
dimensions. Use `--check-only` to audit without modifying anything —
run that first when you're unsure what state files are in.

Rename files to their final names before or during this step:
`body-{outfit}.png`, `face-{expression}.png` (the app builds paths from
these exact patterns).

### 4. Promote to live

```bash
python .claude/skills/pick-and-apply/scripts/finalize-sprites.py <staging-dir> --char <id> --promote
```

Refuses to promote if verification fails. Live sprites live in
`public/sprites/{charId}/`. Never copy raw candidates there by hand.

### 5. Wire new outfits into the app (code changes)

Only needed when the outfit id is NEW (not for regens of existing ones):

- `src/components/OutfitSelector.tsx` — add the id to the `Outfit`
  union type (line ~6).
- `src/components/OutfitCarousel.tsx` — add `{ id, label }` to the
  `OUTFITS` array. The carousel derives the thumbnail path as
  `body-{id}.png`, so the id must match the filename exactly.
- Check `computeOutfits()` in `src/lib/affinity.ts` if the outfit
  should be affinity-gated rather than always available.
- Sanity-check the `/gallery` page picks it up (it enumerates sprites
  per character).

After wiring, run `npm test` and load the character in the dev app
(`npx next dev --webpack -p 3000`) to confirm the outfit shows in the
carousel and the expression swap doesn't shift the sprite.

## Rules that keep this safe

- **The user picks winners.** Present candidates; never choose for them.
- **Never promote a partial set after a body change.** Every live
  `face-*.png` is a composite over the OLD body — ship a new
  body-neutral with only some faces regenerated and the un-regenerated
  expressions flash the old art. New body ⇒ regenerate and finalize all
  15 faces against it first.
- **Two apply flows exist — one wipes.** `apply-picks-add.mjs` is
  additive (safe default). `apply-regen-selection.mjs` (paired with
  `build-regen-gallery.mjs`) WIPES `regen-3/` before copying — only for
  deliberate full re-curation, never for adding picks.
- **Never edit `public/sprites/{char}/` in place** — stage in
  `regen-3/{char}/` (or the `-regen` dir), finalize there, then promote.
- **rembg once.** Re-running background removal on an already-transparent
  image eats the lineart edges. The script guards this; don't bypass it.
- **Canvas truth is body-neutral.png** of the same character. If you're
  replacing the whole set, the new body-neutral defines the canvas; if
  you're adding faces/outfits to an existing set, the live body-neutral
  does.
- Google Drive syncs this repo — re-read files from disk before editing,
  and re-run `--check-only` after any gap in the session.

## Dependencies

Python with `Pillow` and `rembg` (both already used by the repo's
`remove_backgrounds.py`). If `rembg` import fails, tell the user rather
than silently falling back to color-keying — edge quality matters on
sprites.
