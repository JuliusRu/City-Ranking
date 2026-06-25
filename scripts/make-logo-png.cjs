// Renders the in-app Logo (src/components/layout/Logo.tsx) to a square PNG for
// the Google OAuth consent screen. Reuses the exact geometry so the raster
// matches the SVG mark 1:1. One-off utility.
const sharp = require("sharp");
const path = require("path");

const SPARKLE =
  "M0,-4 C0.7,-0.7 0.7,-0.7 4,0 C0.7,0.7 0.7,0.7 0,4 C-0.7,0.7 -0.7,0.7 -4,0 C-0.7,-0.7 -0.7,-0.7 0,-4 Z";
const STAR_COUNT = 10;
const RING_RADIUS = 22; // a touch further out than the in-app mark so the ring
const CENTER = 24;      // clearly clears the globe rim at large raster sizes

const stars = Array.from({ length: STAR_COUNT }, (_, i) => {
  const angle = (-90 + (360 / STAR_COUNT) * i) * (Math.PI / 180);
  return {
    x: +(CENTER + RING_RADIUS * Math.cos(angle)).toFixed(2),
    y: +(CENTER + RING_RADIUS * Math.sin(angle)).toFixed(2),
  };
});

const BG = "#1c1814"; // app dark background
const FG = "#5b9bb5"; // app sky-blue (dark-theme primary)

// 72x72 canvas = 48x48 art translated by (12,12) → ~25% padding on each side,
// so the wider sparkle ring (radius 22) still sits comfortably inside the frame.
const PAD = 12;
// Stars use raw art coords here because they're drawn inside the same
// translate(PAD) group as the globe below — adding PAD again would offset the
// ring from the globe (the bug in earlier versions).
const starPaths = stars
  .map(
    (s) => `<path d="${SPARKLE}" transform="translate(${s.x} ${s.y}) scale(0.6)"/>`
  )
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="2048" height="2048">
  <rect width="72" height="72" rx="14" fill="${BG}"/>
  <g transform="translate(${PAD} ${PAD})">
    <g stroke="${FG}" stroke-width="1.6" stroke-linecap="round" fill="none">
      <circle cx="24" cy="24" r="12"/>
      <ellipse cx="24" cy="24" rx="12" ry="4.7"/>
      <path d="M24 12 C 16 18, 16 30, 24 36"/>
      <path d="M24 12 C 32 18, 32 30, 24 36"/>
    </g>
    <g fill="${FG}">${starPaths}</g>
  </g>
</svg>`;

const out = path.join(__dirname, "..", "public", "app-logo.png");
// Supersample: the SVG is rasterised at 2048px (width/height above), then
// Lanczos-downscaled to 512 so the thin strokes render clean instead of
// aliasing at the target size.
sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile(out)
  .then((info) => console.log(`wrote ${out} (${info.width}x${info.height}, ${info.size} bytes)`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
