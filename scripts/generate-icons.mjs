import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, "..", "public", "icons");
mkdirSync(dir, { recursive: true });

// Create simple SVG icons that work as PWA icons
function makeSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0d0d12"/>
  <circle cx="${size * 0.35}" cy="${size * 0.45}" r="${size * 0.08}" fill="#f472b6" opacity="0.8"/>
  <circle cx="${size * 0.5}" cy="${size * 0.45}" r="${size * 0.08}" fill="#fb923c" opacity="0.8"/>
  <circle cx="${size * 0.65}" cy="${size * 0.45}" r="${size * 0.08}" fill="#a78bfa" opacity="0.8"/>
  <text x="${size * 0.5}" y="${size * 0.72}" text-anchor="middle" fill="white" font-size="${size * 0.12}" font-family="sans-serif" font-weight="300">CHAT</text>
</svg>`;
}

writeFileSync(join(dir, "icon-192.svg"), makeSVG(192));
writeFileSync(join(dir, "icon-512.svg"), makeSVG(512));
console.log("Icons generated");
