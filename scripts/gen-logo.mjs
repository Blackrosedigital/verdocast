// Generate the Verdocast logo: a bold lime "V" mark on the dark brand square.
// Outputs an SVG (vector) + PNGs at a few sizes + app/icon.png (favicon).
//   node scripts/gen-logo.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const BG = "#0a0b0d";
const BORDER = "#2a2d33";
const ACCENT = "#e6ff3d";

// 512 canvas, rounded square, soft lime glow, bold rounded "V" (verdict tick).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="glow" cx="32%" cy="20%" r="85%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.18"/>
      <stop offset="60%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="${BG}"/>
  <rect width="512" height="512" rx="116" fill="url(#glow)"/>
  <rect x="6" y="6" width="500" height="500" rx="112" fill="none" stroke="${BORDER}" stroke-width="4"/>
  <path d="M150 150 L256 366 L362 150"
        fill="none" stroke="${ACCENT}" stroke-width="72"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "public", "logo.svg"), svg, "utf8");

const png = (size) => sharp(Buffer.from(svg)).resize(size, size).png();

await png(512).toFile(join(root, "public", "logo.png"));
await png(1024).toFile(join(root, "public", "logo-1024.png"));
await png(192).toFile(join(root, "public", "logo-192.png"));
await png(512).toFile(join(root, "app", "icon.png")); // site favicon / tab icon

console.log("Wrote public/logo.svg, logo.png (512), logo-1024.png, logo-192.png, app/icon.png");
