/**
 * Additive apply: COPY chosen picks into regen-3/{character}/ WITHOUT wiping.
 * Pairs with build-pick-gallery.mjs (picks-add.json). Never disturbs the rest
 * of the curated set — it only adds the newly chosen images.
 *
 * Run: node scripts/apply-picks-add.mjs [path-to-picks-add.json]
 * Default JSON: %USERPROFILE%/Downloads/picks-add.json
 */
import { readFileSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEST_ROOT = join(ROOT, "regen-3");

const jsonPath =
  process.argv[2] ||
  join(process.env.USERPROFILE || process.env.HOME || "", "Downloads", "picks-add.json");

if (!existsSync(jsonPath)) {
  console.error(`Picks file not found: ${jsonPath}`);
  process.exit(1);
}

const picks = JSON.parse(readFileSync(jsonPath, "utf8"));
if (!Array.isArray(picks) || picks.length === 0) { console.error("No picks."); process.exit(1); }

let copied = 0;
const perChar = {};
const missing = [];
for (const p of picks) {
  const from = join(ROOT, p.src);
  if (!existsSync(from)) { missing.push(p.src); continue; }
  const destDir = join(DEST_ROOT, p.character);
  mkdirSync(destDir, { recursive: true });
  copyFileSync(from, join(destDir, p.file));
  copied++;
  perChar[p.character] = (perChar[p.character] || 0) + 1;
}

console.log(`Added ${copied} image(s) into regen-3/ (no wipe)`);
for (const [c, n] of Object.entries(perChar)) console.log(`  ${c}: +${n}`);
if (missing.length) { console.log(`\n${missing.length} not found:`); missing.forEach((m) => console.log(`  ${m}`)); }
