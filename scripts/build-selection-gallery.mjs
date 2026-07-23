/**
 * Review the CURRENT chosen selection and tag "others" for a separate folder.
 * Scans the curated folders (regen-3/* and merrick-spicy/) and writes
 * selection-gallery.html at the repo root. Tick a tile to tag it as "other";
 * Export downloads others-tag.json, then apply-others-tag.mjs moves them.
 *
 * Run: node scripts/build-selection-gallery.mjs
 */
import { readdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Curated source groups: { label, dir (relative to ROOT) }
const REGEN3 = join(ROOT, "regen-3");
const groups = [];
if (existsSync(REGEN3)) {
  for (const c of readdirSync(REGEN3, { withFileTypes: true })) {
    if (c.isDirectory()) groups.push({ label: c.name, rel: `regen-3/${c.name}` });
  }
}
if (existsSync(join(ROOT, "merrick-spicy"))) {
  groups.push({ label: "merrick-spicy", rel: "merrick-spicy" });
}

const data = groups
  .map((g) => {
    const files = readdirSync(join(ROOT, g.rel)).filter((f) => f.endsWith(".png")).sort();
    return { ...g, files };
  })
  .filter((g) => g.files.length > 0);

const total = data.reduce((s, g) => s + g.files.length, 0);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const nav = data
  .map((g) => `<a href="#${esc(g.label)}">${esc(g.label)} <span>${g.files.length}</span></a>`)
  .join("");

const sections = data
  .map((g) => {
    const cards = g.files
      .map((f) => {
        const src = `${g.rel}/${f}`;
        return `<div class="card" data-group="${esc(g.label)}" data-file="${esc(f)}" data-src="${src}">
  <input type="checkbox" class="pick" title="Tag as other">
  <a href="${src}" target="_blank" title="${esc(f)}"><img loading="lazy" src="${src}" alt="${esc(f)}"></a>
  <span class="seed">${esc(f.replace(/\.png$/, ""))}</span>
</div>`;
      })
      .join("\n");
    return `<section id="${esc(g.label)}">
  <h2>${esc(g.label)} <em>${g.files.length}</em></h2>
  <div class="grid">${cards}</div>
</section>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Selection review · tag others</title>
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
    border-radius: 999px; font-size: 12px; }
  nav a span { color: #7a7a88; margin-left: 4px; }
  nav a:hover { background: #33333f; }
  section { padding: 24px 20px 8px; border-top: 4px solid #1c1c26; }
  section > h2 { font-size: 22px; margin: 0 0 12px; position: sticky; top: 92px;
    background: #0e0e12; padding: 6px 0; z-index: 5; }
  section > h2 em { font-style: normal; color: #7a7a88; font-size: 13px; font-weight: 400; }
  .grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .card { position: relative; background: #1a1a22; border-radius: 6px; overflow: hidden;
    border: 2px solid #26263080; }
  .card img { width: 100%; aspect-ratio: 832 / 1216; object-fit: cover; display: block; background: #101015; }
  .card:hover { border-color: #6b6bff; }
  .card.tagged { border-color: #f0a030; }
  .card.tagged::after { content: "OTHER"; position: absolute; top: 6px; right: 6px;
    background: #f0a030; color: #2a1a00; font-size: 10px; font-weight: 700;
    padding: 1px 6px; border-radius: 4px; letter-spacing: .5px; }
  .card .pick { position: absolute; top: 6px; left: 6px; z-index: 2; width: 22px; height: 22px;
    cursor: pointer; accent-color: #f0a030; }
  .card .seed { position: absolute; bottom: 0; left: 0; right: 0; padding: 2px 6px; font-size: 10px;
    color: #dcdce6; background: linear-gradient(transparent, #000a); pointer-events: none;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 10px; }
  .toolbar button { background: #23232e; color: #e8e8ee; border: 1px solid #33333f;
    border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
  .toolbar button:hover { background: #33333f; }
  .toolbar button.primary { background: #8a5a12; border-color: #f0a030; color: #fff4e0; }
  .toolbar #count { font-weight: 600; color: #f0a030; }
</style>
</head>
<body>
<header>
  <h1>Selection review — tag "others"</h1>
  <div class="meta">${data.length} folders · ${total} chosen images · tick a tile to tag it for the others folder</div>
  <nav>${nav}</nav>
  <div class="toolbar">
    <span><span id="count">0</span> tagged as other</span>
    <button class="primary" id="export">Export others</button>
    <button id="clear">Clear tags</button>
  </div>
</header>
${sections}
<script>
const KEY = "selection-others-tags";
const saved = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
const cards = [...document.querySelectorAll(".card")];
const countEl = document.getElementById("count");
function persist() { localStorage.setItem(KEY, JSON.stringify([...saved])); countEl.textContent = saved.size; }
cards.forEach((card) => {
  const cb = card.querySelector(".pick");
  const src = card.dataset.src;
  if (saved.has(src)) { cb.checked = true; card.classList.add("tagged"); }
  cb.addEventListener("change", () => {
    if (cb.checked) { saved.add(src); card.classList.add("tagged"); }
    else { saved.delete(src); card.classList.remove("tagged"); }
    persist();
  });
});
persist();
document.getElementById("clear").addEventListener("click", () => {
  if (!confirm("Clear all " + saved.size + " tags?")) return;
  saved.clear();
  cards.forEach((c) => { c.querySelector(".pick").checked = false; c.classList.remove("tagged"); });
  persist();
});
document.getElementById("export").addEventListener("click", () => {
  const picks = cards.filter((c) => saved.has(c.dataset.src))
    .map((c) => ({ group: c.dataset.group, file: c.dataset.file, src: c.dataset.src }));
  const blob = new Blob([JSON.stringify(picks, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "others-tag.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
</script>
</body>
</html>
`;

const out = join(ROOT, "selection-gallery.html");
writeFileSync(out, html);
console.log(`Wrote ${out}`);
console.log(`${data.length} folders, ${total} chosen images:`);
for (const g of data) console.log(`  ${g.label}: ${g.files.length}`);
