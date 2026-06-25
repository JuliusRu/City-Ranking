// Generates the browser tab icon set from the in-app Logo, into src/app/ where
// Next.js App Router auto-wires them:
//   icon.svg        → modern <link rel="icon"> (crisp at any size)
//   apple-icon.png  → iOS home-screen (180px, full-bleed opaque)
//   favicon.ico     → legacy browsers (16/32/48 multi-res)
// One-off utility. Requires sharp + ImageMagick (`magick`).
const sharp = require("sharp");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const SPARKLE =
  "M0,-4 C0.7,-0.7 0.7,-0.7 4,0 C0.7,0.7 0.7,0.7 0,4 C-0.7,0.7 -0.7,0.7 -4,0 C-0.7,-0.7 -0.7,-0.7 0,-4 Z";
const STAR_COUNT = 10;
const RING_RADIUS = 21;
const CENTER = 24;
const PAD = 12;

const stars = Array.from({ length: STAR_COUNT }, (_, i) => {
  const angle = (-90 + (360 / STAR_COUNT) * i) * (Math.PI / 180);
  return {
    x: +(CENTER + RING_RADIUS * Math.cos(angle)).toFixed(2),
    y: +(CENTER + RING_RADIUS * Math.sin(angle)).toFixed(2),
  };
});

const BG = "#1c1814";
const FG = "#5b9bb5";

// Bolder strokes + slightly bigger sparkles than the in-app mark so it stays
// legible when the tab renders it at 16–32px. `rounded`/`radius` controls the
// background corner: rounded for the tab, square+opaque for the iOS icon.
function buildSvg({ radius = 14, sizeAttr = "" } = {}) {
  const starPaths = stars
    .map((s) => `<path d="${SPARKLE}" transform="translate(${s.x} ${s.y}) scale(0.66)"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72"${sizeAttr}>
  <rect width="72" height="72" rx="${radius}" fill="${BG}"/>
  <g transform="translate(${PAD} ${PAD})">
    <g stroke="${FG}" stroke-width="2.1" stroke-linecap="round" fill="none">
      <circle cx="24" cy="24" r="12"/>
      <ellipse cx="24" cy="24" rx="12" ry="4.7"/>
      <path d="M24 12 C 16 18, 16 30, 24 36"/>
      <path d="M24 12 C 32 18, 32 30, 24 36"/>
    </g>
    <g fill="${FG}">${starPaths}</g>
  </g>
</svg>`;
}

const appDir = path.join(__dirname, "..", "src", "app");
const tmp = os.tmpdir();

async function main() {
  // 1. icon.svg — rounded corners, scalable, for the browser tab.
  fs.writeFileSync(path.join(appDir, "icon.svg"), buildSvg({ radius: 14 }) + "\n");
  console.log("wrote src/app/icon.svg");

  // 2. apple-icon.png — 180px, SQUARE + opaque (iOS applies its own mask, so a
  //    full-bleed dark square avoids transparent-corner artifacts).
  await sharp(Buffer.from(buildSvg({ radius: 0, sizeAttr: ' width="2048" height="2048"' })))
    .resize(180, 180)
    .png()
    .toFile(path.join(appDir, "apple-icon.png"));
  console.log("wrote src/app/apple-icon.png (180x180)");

  // 3. favicon.ico — render a crisp 256px PNG, then let ImageMagick pack the
  //    standard legacy sizes into the .ico.
  const png256 = path.join(tmp, "favicon-256.png");
  await sharp(Buffer.from(buildSvg({ radius: 14, sizeAttr: ' width="2048" height="2048"' })))
    .resize(256, 256)
    .png()
    .toFile(png256);
  execFileSync("magick", [
    png256,
    "-define",
    "icon:auto-resize=16,32,48",
    path.join(appDir, "favicon.ico"),
  ]);
  console.log("wrote src/app/favicon.ico (16/32/48)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
