// Copies MapLibre's web worker into public/ before every build and dev start.
//
// Since maplibre-gl 6 the worker is a separate file that MapLibre looks for next
// to its own bundle (new URL("./maplibre-gl-worker.mjs", import.meta.url)). The
// Next.js bundler does not follow that dynamic URL, so in a build the worker is
// missing and the globe stays empty ("Worker failed to load"). Serving it from
// public/ and pointing setWorkerUrl() at it (GlobeViewer.tsx) fixes that.
// The copy is generated, not committed (.gitignore), so it always matches the
// installed maplibre-gl version.
const fs = require("node:fs");
const path = require("node:path");

const src = require.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs");
const dest = path.join(__dirname, "..", "public", "maplibre-gl-worker.mjs");
fs.copyFileSync(src, dest);
console.log(`maplibre worker → public/maplibre-gl-worker.mjs`);
