/**
 * Move the tagged "other" picks out of the curated folders into a separate one.
 * Reads others-tag.json (exported from selection-gallery.html) and MOVES each
 * tagged image out of regen-3/... or merrick-spicy/ into the others folder,
 * preserving its source group as a subfolder.
 *
 * Run: node scripts/apply-others-tag.mjs [dest-folder] [path-to-others-tag.json]
 * Default dest: regen-others   Default JSON: %USERPROFILE%/Downloads/others-tag.json
 */
import { readFileSync, renameSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const destName = process.argv[2] || "regen-others";
const DEST_ROOT = join(ROOT, destName);
const jsonPath =
  process.argv[3] ||
  join(process.env.USERPROFILE || process.env.HOME || "", "Downloads", "others-tag.json");

if (!existsSync(jsonPath)) {
  console.error(`Tag file not found: ${jsonPath}`);
  console.error("Export it from selection-gallery.html first, or pass the path as an argument.");
  process.exit(1);
}

const tags = JSON.parse(readFileSync(jsonPath, "utf8"));
if (!Array.isArray(tags) || tags.length === 0) {
  console.error("No tagged items in file.");
  process.exit(1);
}

let moved = 0;
const missing = [];
const perGroup = {};

for (const t of tags) {
  const from = join(ROOT, t.src);
  if (!existsSync(from)) { missing.push(t.src); continue; }
  const destDir = join(DEST_ROOT, t.group);
  mkdirSync(destDir, { recursive: true });
  renameSync(from, join(destDir, t.file));
  moved++;
  perGroup[t.group] = (perGroup[t.group] || 0) + 1;
}

console.log(`Moved ${moved} tagged image(s) into ${DEST_ROOT}`);
for (const [g, n] of Object.entries(perGroup)) console.log(`  ${g}: ${n}`);
if (missing.length) {
  console.log(`\n${missing.length} source(s) not found (already moved?):`);
  missing.forEach((m) => console.log(`  ${m}`));
}
