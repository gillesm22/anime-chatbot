/**
 * Focused, additive picker for specific character + outfits.
 * Shows every candidate seed for the given outfits so you can compare and pick.
 * Applying (apply-picks-add.mjs) COPIES chosen images into regen-3/{char}
 * WITHOUT wiping — additive, so it never disturbs the rest of the curation.
 *
 * Run: node scripts/build-pick-gallery.mjs <charId> <outfit,outfit,...>
 * e.g. node scripts/build-pick-gallery.mjs arisu casual,formal,nurse,vampire,cow,cowgirl
 */
import { readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const charId = process.argv[2];
const outfitFilter = (process.argv[3] || "").split(",").map((s) => s.trim()).filter(Boolean);
if (!charId || outfitFilter.length === 0) {
  console.error("Usage: node scripts/build-pick-gallery.mjs <charId> <outfit,outfit,...>");
  process.exit(1);
}

const dir = `${charId}-regen`;
const SEED_RE = /-(\d{3,})\.png$/;
const files = readdirSync(join(ROOT, "public", "sprites", dir)).filter((f) => SEED_RE.test(f));

const groups = new Map(outfitFilter.map((o) => [o, []]));
for (const f of files) {
  const seed = f.match(SEED_RE)[1];
  let key = f.replace(SEED_RE, "").replace(new RegExp(`^${charId}-v\\d+-`), "").replace(new RegExp(`^${charId}-`), "");
  if (groups.has(key)) groups.get(key).push({ file: f, seed });
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const total = [...groups.values()].reduce((s, a) => s + a.length, 0);

const sections = outfitFilter
  .map((o) => {
    const imgs = (groups.get(o) || []).sort((a, b) => Number(a.seed) - Number(b.seed));
    const cards = imgs
      .map((im) => {
        const src = `public/sprites/${dir}/${im.file}`;
        return `<div class="card" data-char="${charId}" data-outfit="${esc(o)}" data-file="${esc(im.file)}" data-src="${src}">
  <input type="checkbox" class="pick" title="Pick this one">
  <a href="${src}" target="_blank" title="${esc(im.file)}"><img loading="lazy" src="${src}" alt="${esc(im.file)}"></a>
  <span class="seed">${esc(im.seed)}</span>
</div>`;
      })
      .join("\n");
    return `<section><h2>${esc(o)} <em>${imgs.length}</em></h2><div class="grid">${cards || '<p style="color:#888">no candidates</p>'}</div></section>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pick — ${esc(charId)} gaps</title>
<style>
  :root { color-scheme: dark; } * { box-sizing: border-box; }
  body { margin:0; background:#0e0e12; color:#e8e8ee; font:14px/1.4 system-ui,Segoe UI,Roboto,sans-serif; }
  header { position:sticky; top:0; z-index:10; background:#16161d; border-bottom:1px solid #2a2a35; padding:12px 20px; }
  header h1 { margin:0 0 8px; font-size:16px; text-transform:capitalize; }
  header .meta { color:#9a9aa8; font-size:12px; margin-bottom:10px; }
  .toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
  .toolbar button { background:#23232e; color:#e8e8ee; border:1px solid #33333f; border-radius:6px; padding:6px 12px; font-size:12px; cursor:pointer; }
  .toolbar button.primary { background:#2b7a4b; border-color:#35d07f; color:#eafff2; }
  .toolbar #count { font-weight:600; color:#35d07f; }
  section { padding:20px; border-top:4px solid #1c1c26; }
  section h2 { text-transform:capitalize; font-size:20px; margin:0 0 12px; }
  section h2 em { font-style:normal; color:#7a7a88; font-size:13px; }
  .grid { display:grid; gap:8px; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); }
  .card { position:relative; background:#1a1a22; border-radius:6px; overflow:hidden; border:2px solid #26263080; }
  .card img { width:100%; aspect-ratio:832/1216; object-fit:cover; display:block; background:#101015; }
  .card:hover { border-color:#6b6bff; }
  .card.picked { border-color:#35d07f; }
  .card.picked::after { content:"KEEP"; position:absolute; top:6px; right:6px; background:#35d07f; color:#06210f; font-size:10px; font-weight:700; padding:1px 6px; border-radius:4px; }
  .card .pick { position:absolute; top:6px; left:6px; z-index:2; width:22px; height:22px; cursor:pointer; accent-color:#35d07f; }
  .card .seed { position:absolute; bottom:0; left:0; right:0; padding:2px 6px; font-size:11px; color:#dcdce6; background:linear-gradient(transparent,#000a); pointer-events:none; }
</style></head><body>
<header>
  <h1>${esc(charId)} — pick gap outfits</h1>
  <div class="meta">${outfitFilter.length} outfits · ${total} candidates · pick your favorite per outfit</div>
  <div class="toolbar"><span><span id="count">0</span> picked</span>
    <button class="primary" id="export">Export picks</button><button id="clear">Clear</button></div>
</header>
${sections}
<script>
const KEY = "pick-gallery-${charId}";
const saved = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
const cards = [...document.querySelectorAll(".card")];
const countEl = document.getElementById("count");
function persist(){ localStorage.setItem(KEY, JSON.stringify([...saved])); countEl.textContent = saved.size; }
cards.forEach((card) => {
  const cb = card.querySelector(".pick"), src = card.dataset.src;
  if (saved.has(src)) { cb.checked = true; card.classList.add("picked"); }
  cb.addEventListener("change", () => {
    if (cb.checked) { saved.add(src); card.classList.add("picked"); }
    else { saved.delete(src); card.classList.remove("picked"); }
    persist();
  });
});
persist();
document.getElementById("clear").addEventListener("click", () => {
  if (!confirm("Clear " + saved.size + " picks?")) return;
  saved.clear(); cards.forEach((c) => { c.querySelector(".pick").checked=false; c.classList.remove("picked"); }); persist();
});
document.getElementById("export").addEventListener("click", () => {
  const picks = cards.filter((c) => saved.has(c.dataset.src))
    .map((c) => ({ character: c.dataset.char, outfit: c.dataset.outfit, file: c.dataset.file, src: c.dataset.src }));
  const blob = new Blob([JSON.stringify(picks, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "picks-add.json"; a.click(); URL.revokeObjectURL(a.href);
});
</script></body></html>`;

const out = join(ROOT, "pick-gallery.html");
writeFileSync(out, html);
console.log(`Wrote ${out} — ${charId}, ${total} candidates across ${outfitFilter.length} outfits`);
for (const o of outfitFilter) console.log(`  ${o}: ${(groups.get(o) || []).length}`);
