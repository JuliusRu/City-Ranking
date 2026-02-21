import { cpSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const cesiumSource = resolve(root, "node_modules/cesium/Build/Cesium");
const cesiumDest = resolve(root, "public/cesium");

if (!existsSync(cesiumSource)) {
  console.error("Cesium Build directory not found. Run npm install first.");
  process.exit(1);
}

console.log("Copying Cesium assets to public/cesium...");

mkdirSync(cesiumDest, { recursive: true });

const folders = ["Workers", "Assets", "Widgets", "ThirdParty"];

for (const folder of folders) {
  const src = resolve(cesiumSource, folder);
  const dest = resolve(cesiumDest, folder);

  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
    console.log(`  Copied ${folder}`);
  } else {
    console.warn(`  Warning: ${folder} not found in Cesium build`);
  }
}

console.log("Cesium assets copied successfully.");
