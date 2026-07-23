/**
 * Copy the kept regen candidates into the true "regen-3" folder.
 * Reads the selection JSON exported from regen-gallery.html and copies each
 * kept image into regen-3/{character}/{file}.
 *
 * Run: node scripts/apply-regen-selection.mjs [path-to-selection.json]
 * Default JSON path: %USERPROFILE%/Downloads/regen-3-selection.json
 */
import { readFileSync, copyFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEST_ROOT = join(ROOT, "regen-3");
const SPICY_ROOT = join(ROOT, "merrick-spicy");

const jsonPath =
  process.argv[2] ||
  join(process.env.USERPROFILE || process.env.HOME || "", "Downloads", "regen-3-selection.json");

if (!existsSync(jsonPath)) {
  console.error(`Selection file not found: ${jsonPath}`);
  console.error("Export it from regen-gallery.html first, or pass the path as an argument.");
  process.exit(1);
}

const picks = JSON.parse(readFileSync(jsonPath, "utf8"));
if (!Array.isArray(picks) || picks.length === 0) {
  console.error("No picks in selection file.");
  process.exit(1);
}

// Clean rebuild: wipe regen-3/ so it only ever holds the current selection.
// Safe because originals stay in the *-regen source folders.
if (existsSync(DEST_ROOT)) rmSync(DEST_ROOT, { recursive: true, force: true });
if (existsSync(SPICY_ROOT)) rmSync(SPICY_ROOT, { recursive: true, force: true });

let copied = 0;
const missing = [];
const perChar = {};

for (const p of picks) {
  const from = join(ROOT, p.src);
  if (!existsSync(from)) { missing.push(p.src); continue; }
  // Merrick's spicy picks are a separate set kept OUTSIDE regen-3/ for another
  // time; only outfit variants belong in regen-3/merrick/.
  const merrickSpicy =
    p.character === "merrick" && /^merrick-v\d+-(coquette|ecchi|oil)/.test(p.file);
  const destDir = merrickSpicy ? SPICY_ROOT : join(DEST_ROOT, p.character);
  mkdirSync(destDir, { recursive: true });
  copyFileSync(from, join(destDir, p.file));
  copied++;
  perChar[p.character] = (perChar[p.character] || 0) + 1;
}

console.log(`Copied ${copied} images into ${DEST_ROOT}`);
for (const [c, n] of Object.entries(perChar)) console.log(`  ${c}: ${n}`);
if (missing.length) {
  console.log(`\n${missing.length} source(s) not found:`);
  missing.forEach((m) => console.log(`  ${m}`));
}
