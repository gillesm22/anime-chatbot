/**
 * Generates minimal SVG-based placeholder sprites for development.
 * Run with: npx tsx scripts/generate-placeholders.ts
 *
 * Creates transparent PNGs aren't possible without a canvas library,
 * so we generate SVGs that the sprite engine can load during dev.
 * These will be replaced with real PNGs from VNCCS.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SPRITES_DIR = join(__dirname, "..", "public", "sprites");

const characters = [
  { id: "arisu", color: "#f472b6", label: "A" },
  { id: "marin", color: "#fb923c", label: "M" },
  { id: "nao", color: "#a78bfa", label: "N" },
];

const layers = {
  body: ["neutral", "arms-crossed", "leaning"],
  eyes: ["neutral", "happy", "surprised", "sad", "angry", "closed"],
  eyebrows: ["neutral", "raised", "furrowed", "sad"],
  mouth: ["closed", "smile", "talk-1", "talk-2", "surprised", "pout"],
};

function makeSVG(
  color: string,
  label: string,
  layerType: string,
  variant: string
): string {
  const isBody = layerType === "body";
  const width = 800;
  const height = isBody ? 1400 : 400;
  const yOffset = isBody ? 0 : 0;
  const text = `${label}: ${layerType}-${variant}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="10" y="${yOffset + 10}" width="${width - 20}" height="${height - 20}" rx="20" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="2"/>
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-size="24" font-family="sans-serif">${text}</text>
</svg>`;
}

for (const char of characters) {
  const dir = join(SPRITES_DIR, char.id);
  mkdirSync(dir, { recursive: true });

  for (const [layerType, variants] of Object.entries(layers)) {
    for (const variant of variants) {
      const filename = `${layerType}-${variant}.svg`;
      const svg = makeSVG(char.color, char.label, layerType, variant);
      writeFileSync(join(dir, filename), svg);
    }
  }
}

console.log("Placeholder sprites generated.");
