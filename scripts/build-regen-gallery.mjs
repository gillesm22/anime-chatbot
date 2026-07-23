/**
 * Build a local HTML contact sheet of ALL regen outfit candidates.
 * Scans public/sprites/{char}-regen/ for seed-suffixed PNGs, groups them
 * by outfit, and writes regen-gallery.html at the repo root.
 *
 * Run: node scripts/build-regen-gallery.mjs
 * Then open regen-gallery.html in a browser.
 */
import { readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SPRITES = join(ROOT, "public", "sprites");

// A candidate is any PNG ending in -<3+ digits>.png (a seed).
const SEED_RE = /-(\d{3,})\.png$/;

const regenDirs = readdirSync(SPRITES, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.endsWith("-regen"))
  .map((d) => d.name)
  .sort();

const characters = [];

for (const dir of regenDirs) {
  const charId = dir.replace(/-regen$/, "");
  const files = readdirSync(join(SPRITES, dir)).filter((f) => SEED_RE.test(f));
  if (files.length === 0) continue;

  // Group by outfit = filename with the -<seed>.png stripped, and a leading
  // "{char}-v3-" / "{char}-" prefix removed for a clean label.
  const groups = new Map();
  for (const f of files) {
    const seed = f.match(SEED_RE)[1];
    let key = f.replace(SEED_RE, "");
    key = key
      .replace(new RegExp(`^${charId}-v\\d+-`), "")
      .replace(new RegExp(`^${charId}-`), "");
    if (!key) key = "(base)";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ file: f, seed });
  }

  const outfits = [...groups.entries()]
    .map(([label, imgs]) => ({
      label,
      imgs: imgs.sort((a, b) => Number(a.seed) - Number(b.seed)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  characters.push({ charId, dir, outfits, total: files.length });
}

const totalImgs = characters.reduce((s, c) => s + c.total, 0);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const nav = characters
  .map((c) => `<a href="#${c.charId}">${esc(c.charId)} <span>${c.total}</span></a>`)
  .join("");

const sections = characters
  .map((c) => {
    const outfitBlocks = c.outfits
      .map((o) => {
        const cards = o.imgs
          .map((im) => {
            const src = `public/sprites/${c.dir}/${im.file}`;
            return `<div class="card" data-char="${c.charId}" data-outfit="${esc(o.label)}" data-file="${esc(im.file)}" data-src="${src}">
  <input type="checkbox" class="pick" title="Keep this one">
  <a href="${src}" target="_blank" title="${esc(im.file)}"><img loading="lazy" src="${src}" alt="${esc(im.file)}"></a>
  <span class="seed">${esc(im.seed)}</span>
</div>`;
          })
          .join("\n");
        return `<div class="outfit">
  <h3>${esc(o.label)} <em>${o.imgs.length}</em></h3>
  <div class="grid">${cards}</div>
</div>`;
      })
      .join("\n");
    return `<section id="${c.charId}">
  <h2>${esc(c.charId)} <em>${c.outfits.length} outfits · ${c.total} candidates</em></h2>
  ${outfitBlocks}
</section>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Regen outfit candidates</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0e0e12; color: #e8e8ee;
    font: 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  header { position: sticky; top: 0; z-index: 10; background: #16161d;
    border-bottom: 1px solid #2a2a35; padding: 12px 20px; }
  header h1 { margin: 0 0 8px; font-size: 16px; font-weight: 600; }
  header .meta { color: #9a9aa8; font-size: 12px; margin-bottom: 10px; }
  nav { display: flex; flex-wrap: wrap; gap: 8px; }
  nav a { color: #cdd; text-decoration: none; background: #23232e; padding: 4px 10px;
    border-radius: 999px; font-size: 12px; text-transform: capitalize; }
  nav a span { color: #7a7a88; margin-left: 4px; }
  nav a:hover { background: #33333f; }
  section { padding: 24px 20px 8px; border-top: 4px solid #1c1c26; }
  section > h2 { text-transform: capitalize; font-size: 22px; margin: 0 0 4px;
    position: sticky; top: 92px; background: #0e0e12; padding: 6px 0; z-index: 5; }
  section > h2 em { font-style: normal; color: #7a7a88; font-size: 13px; font-weight: 400; }
  .outfit { margin: 14px 0 22px; }
  .outfit h3 { font-size: 14px; margin: 0 0 8px; color: #b7b7c6; text-transform: capitalize; }
  .outfit h3 em { font-style: normal; background: #2a2a35; color: #9a9aa8; border-radius: 4px;
    padding: 1px 6px; font-size: 11px; margin-left: 6px; }
  .grid { display: grid; gap: 8px;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .card { position: relative; background: #1a1a22; border-radius: 6px;
    overflow: hidden; border: 2px solid #26263080; }
  .card img { width: 100%; aspect-ratio: 832 / 1216; object-fit: cover; display: block;
    background: #101015; }
  .card:hover { border-color: #6b6bff; }
  .card.picked { border-color: #35d07f; }
  .card.picked::after { content: "KEEP"; position: absolute; top: 6px; right: 6px;
    background: #35d07f; color: #06210f; font-size: 10px; font-weight: 700;
    padding: 1px 6px; border-radius: 4px; letter-spacing: .5px; }
  .card .pick { position: absolute; top: 6px; left: 6px; z-index: 2; width: 22px; height: 22px;
    cursor: pointer; accent-color: #35d07f; }
  .card .seed { position: absolute; bottom: 0; left: 0; right: 0; padding: 2px 6px;
    font-size: 11px; color: #dcdce6; background: linear-gradient(transparent, #000a);
    pointer-events: none; }
  .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 10px; }
  .toolbar button { background: #23232e; color: #e8e8ee; border: 1px solid #33333f;
    border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
  .toolbar button:hover { background: #33333f; }
  .toolbar button.primary { background: #2b7a4b; border-color: #35d07f; color: #eafff2; }
  .toolbar #count { font-weight: 600; color: #35d07f; }
</style>
</head>
<body>
<header>
  <h1>Regen outfit candidates</h1>
  <div class="meta">${characters.length} characters · ${totalImgs} candidate images · click a tile for full size · tick the checkbox to keep</div>
  <nav>${nav}</nav>
  <div class="toolbar">
    <span><span id="count">0</span> kept</span>
    <button class="primary" id="export">Export selection</button>
    <button id="clear">Clear all</button>
  </div>
</header>
${sections}
<script>
const KEY = "regen-gallery-picks";
const saved = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
const cards = [...document.querySelectorAll(".card")];
const countEl = document.getElementById("count");

function persist() {
  localStorage.setItem(KEY, JSON.stringify([...saved]));
  countEl.textContent = saved.size;
}
function bind(card) {
  const cb = card.querySelector(".pick");
  const src = card.dataset.src;
  if (saved.has(src)) { cb.checked = true; card.classList.add("picked"); }
  cb.addEventListener("change", () => {
    if (cb.checked) { saved.add(src); card.classList.add("picked"); }
    else { saved.delete(src); card.classList.remove("picked"); }
    persist();
  });
}
cards.forEach(bind);
persist();

document.getElementById("clear").addEventListener("click", () => {
  if (!confirm("Clear all " + saved.size + " picks?")) return;
  saved.clear();
  cards.forEach((c) => { c.querySelector(".pick").checked = false; c.classList.remove("picked"); });
  persist();
});

document.getElementById("export").addEventListener("click", () => {
  const picks = cards
    .filter((c) => saved.has(c.dataset.src))
    .map((c) => ({ character: c.dataset.char, outfit: c.dataset.outfit, file: c.dataset.file, src: c.dataset.src }));
  const blob = new Blob([JSON.stringify(picks, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "regen-3-selection.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
</script>
</body>
</html>
`;

const out = join(ROOT, "regen-gallery.html");
writeFileSync(out, html);
// Also serve it via Next so remote push notifications can deep-link to it.
writeFileSync(join(ROOT, "public", "regen-gallery.html"), html);
console.log(`Wrote ${out} (+ public/regen-gallery.html)`);
console.log(`${characters.length} characters, ${totalImgs} candidates:`);
for (const c of characters) console.log(`  ${c.charId}: ${c.outfits.length} outfits, ${c.total} images`);
