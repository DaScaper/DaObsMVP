// Places your real app screenshot inside the generated bezel.
// Uses the shared geometry, so nothing is hardcoded twice.

import fs from "node:fs/promises";
import sharp from "sharp";
import { CANVAS, SCREEN, TILT_DEG } from "./geometry.mjs";

const BEZEL_PATH = "./assets/device-bezel.png";
const SHOT_PATH = "./assets/screens/today.png";
const OUT = "./assets/hero-device.png";

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

if (!await exists(BEZEL_PATH)) {
  console.error(`missing ${BEZEL_PATH} — run: npm run bezel`);
  process.exit(1);
}
if (!await exists(SHOT_PATH)) {
  console.error(`missing ${SHOT_PATH}`);
  console.error("Capture it manually — see the README section on screenshots.");
  process.exit(1);
}

// Warn loudly if the screenshot aspect is wrong; cover-crop would silently
// chop the top or bottom off the UI otherwise.
const shotMeta = await sharp(SHOT_PATH).metadata();
const wantRatio = SCREEN.w / SCREEN.h;
const gotRatio = shotMeta.width / shotMeta.height;
if (Math.abs(wantRatio - gotRatio) > 0.02) {
  console.warn(
    `warning: screenshot is ${shotMeta.width}x${shotMeta.height} ` +
    `(ratio ${gotRatio.toFixed(3)}), expected ratio ${wantRatio.toFixed(3)}. ` +
    `Recapture at 390x844 to avoid cropping.`
  );
}

// Rounded-corner mask so the screenshot follows the screen well
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SCREEN.w}" height="${SCREEN.h}">
     <rect width="${SCREEN.w}" height="${SCREEN.h}"
           rx="${SCREEN.radius}" ry="${SCREEN.radius}" fill="#fff"/>
   </svg>`
);

const screen = await sharp(SHOT_PATH)
  .resize(SCREEN.w, SCREEN.h, { fit: "cover", position: "top" })
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

// Two passes on purpose. sharp applies rotate() before composite() within a
// single pipeline no matter what order you call them in, which would tilt the
// frame while leaving the screenshot upright. Flatten to a buffer first.
const flat = await sharp(BEZEL_PATH)
  .composite([{ input: screen, top: SCREEN.y, left: SCREEN.x }])
  .png()
  .toBuffer();

await sharp(flat)
  .rotate(TILT_DEG, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .resize(CANVAS.w, CANVAS.h, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .png()
  .toFile(OUT);

console.log(`hero written  ${OUT}  ${CANVAS.w}x${CANVAS.h}  tilt ${TILT_DEG}deg`);
