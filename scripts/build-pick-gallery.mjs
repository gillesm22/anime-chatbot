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
  .card.focused { border-color:#6b6bff; box-shadow:0 0 0 3px #6b6bff66; }
  .card.focused.picked { border-color:#35d07f; box-shadow:0 0 0 3px #35d07f66; }
  #lightbox { position:fixed; inset:0; z-index:100; background:#000d; display:none; align-items:center; justify-content:center; flex-direction:column; gap:10px; }
  #lightbox.open { display:flex; }
  #lightbox img { max-width:92vw; max-height:84vh; object-fit:contain; border-radius:8px; box-shadow:0 8px 40px #000; display:block; }
  #lightbox .lb-frame { position:relative; }
  #lightbox .lb-frame .pick { position:absolute; top:10px; left:10px; z-index:2; width:28px; height:28px; cursor:pointer; accent-color:#35d07f; }
  #lightbox .lb-caption { color:#dcdce6; font-size:13px; }
  #lightbox .lb-caption b { color:#fff; text-transform:capitalize; }
  #lightbox .lb-badge { display:inline-block; margin-left:10px; padding:1px 8px; border-radius:4px; font-size:11px; font-weight:700; background:#2a2a35; color:#9a9aa8; }
  #lightbox.picked .lb-badge { background:#35d07f; color:#06210f; }
  #lightbox .lb-hint { color:#7a7a88; font-size:11px; }
</style></head><body>
<header>
  <h1>${esc(charId)} — pick gap outfits</h1>
  <div class="meta">${outfitFilter.length} outfits · ${total} candidates · pick your favorite per outfit · arrow keys to move, Space/Enter to pick</div>
  <div class="toolbar"><span><span id="count">0</span> picked</span>
    <button class="primary" id="export">Export picks</button><button id="clear">Clear</button></div>
</header>
${sections}
<div id="lightbox">
  <div class="lb-frame">
    <input type="checkbox" id="lb-pick" class="pick" title="Pick this one">
    <img alt="">
  </div>
  <div class="lb-caption"></div>
  <div class="lb-hint">&larr; &rarr; browse &middot; Space or checkbox picks &middot; Esc closes</div>
</div>
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
// Keyboard navigation: arrows move focus, Space/Enter toggles the pick.
// Enter (or clicking an image) opens the lightbox; inside it, arrows flip
// through full-size images, Space picks, Esc closes.
let focusIdx = -1;
const lb = document.getElementById("lightbox");
const lbImg = lb.querySelector("img");
const lbCaption = lb.querySelector(".lb-caption");
function setFocus(i, scroll = true){
  if (!cards.length) return;
  i = Math.max(0, Math.min(cards.length - 1, i));
  if (focusIdx >= 0) cards[focusIdx].classList.remove("focused");
  focusIdx = i;
  cards[i].classList.add("focused");
  if (scroll) cards[i].scrollIntoView({ block: "center", behavior: "auto" });
}
function colsOf(card){
  const cols = getComputedStyle(card.parentElement).gridTemplateColumns.split(" ").length;
  return Math.max(1, cols);
}
function togglePick(i){
  const cb = cards[i].querySelector(".pick");
  cb.checked = !cb.checked;
  cb.dispatchEvent(new Event("change"));
}
const lbPick = document.getElementById("lb-pick");
function lbSync(){
  const card = cards[focusIdx];
  lbImg.src = card.dataset.src;
  lbCaption.innerHTML = "<b>" + card.dataset.outfit + "</b> &middot; " + card.dataset.file +
    ' <span class="lb-badge">KEEP</span>';
  const isPicked = card.classList.contains("picked");
  lb.classList.toggle("picked", isPicked);
  lbPick.checked = isPicked;
}
lbPick.addEventListener("change", () => { togglePick(focusIdx); lbSync(); });
function lbOpen(i){ setFocus(i, false); lb.classList.add("open"); lbSync(); }
function lbClose(){ lb.classList.remove("open"); cards[focusIdx].scrollIntoView({ block: "center", behavior: "auto" }); }
lb.addEventListener("click", (e) => { if (e.target === lb) lbClose(); });
document.addEventListener("keydown", (e) => {
  const keys = ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," ","Enter","Escape"];
  if (!keys.includes(e.key)) return;
  e.preventDefault();
  if (lb.classList.contains("open")) {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { setFocus(focusIdx - 1, false); lbSync(); }
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") { setFocus(focusIdx + 1, false); lbSync(); }
    else if (e.key === " ") { togglePick(focusIdx); lbSync(); }
    else if (e.key === "Escape" || e.key === "Enter") lbClose();
    return;
  }
  if (e.key === "Escape") return;
  if (focusIdx < 0) { setFocus(0); if (e.key === " " || e.key === "Enter") return; }
  if (e.key === "ArrowLeft") setFocus(focusIdx - 1);
  else if (e.key === "ArrowRight") setFocus(focusIdx + 1);
  else if (e.key === "ArrowUp") setFocus(focusIdx - colsOf(cards[focusIdx]));
  else if (e.key === "ArrowDown") setFocus(focusIdx + colsOf(cards[focusIdx]));
  else if (e.key === " ") togglePick(focusIdx);
  else if (e.key === "Enter") lbOpen(focusIdx);
});
cards.forEach((card, i) => {
  card.addEventListener("click", () => setFocus(i, false));
  const link = card.querySelector("a");
  link.addEventListener("click", (e) => { e.preventDefault(); lbOpen(i); });
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
