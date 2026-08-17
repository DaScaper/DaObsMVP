// Prints an audit table for everything in ./assets and flags anything
// the landing page would render badly.

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SPEC = {
  "hero-bg.jpg": { w: 2400, h: 1400, alpha: false, maxKB: 500 },
  "about-visual.jpg": { w: 1200, h: 900, alpha: false, maxKB: 300 },
  "section-1.jpg": { w: 800, h: 600, alpha: false, maxKB: 250 },
  "section-2.jpg": { w: 800, h: 600, alpha: false, maxKB: 250 },
  "section-3.jpg": { w: 800, h: 600, alpha: false, maxKB: 250 },
  "og-image.jpg": { w: 1200, h: 630, alpha: false, maxKB: 300 },
  "device-bezel.png": { w: 1600, h: 1200, alpha: true, maxKB: 400 },
  "hero-device.png": { w: 1600, h: 1200, alpha: true, maxKB: 900 }
};

const SKIP = new Set(["screens", ".gitkeep"]);
const pad = (s, n) => String(s).padEnd(n);

let entries;
try {
  entries = await fs.readdir("./assets");
} catch {
  console.error("no ./assets directory — nothing to verify");
  process.exit(1);
}

console.log("\n" + pad("FILE", 20) + pad("SIZE", 14) + pad("KB", 9) + pad("ALPHA", 8) + "STATUS");
console.log("-".repeat(78));

let problems = 0;
const seen = new Set();

for (const name of entries.sort()) {
  if (SKIP.has(name)) continue;
  const p = path.join("./assets", name);
  const st = await fs.stat(p);
  if (st.isDirectory()) continue;

  seen.add(name);
  let meta;
  try {
    meta = await sharp(p).metadata();
  } catch {
    console.log(pad(name, 20) + pad("-", 14) + pad("-", 9) + pad("-", 8) + "NOT AN IMAGE");
    problems++;
    continue;
  }

  const kb = st.size / 1024;
  const spec = SPEC[name];
  const flags = [];

  if (spec) {
    if (meta.width !== spec.w || meta.height !== spec.h)
      flags.push(`expected ${spec.w}x${spec.h}`);
    if (spec.alpha && !meta.hasAlpha) flags.push("no alpha channel");
    if (kb > spec.maxKB) flags.push(`over ${spec.maxKB} KB`);
  } else {
    flags.push("not in manifest");
  }

  if (flags.length) problems++;
  console.log(
    pad(name, 20) +
    pad(`${meta.width}x${meta.height}`, 14) +
    pad(kb.toFixed(0), 9) +
    pad(meta.hasAlpha ? "yes" : "no", 8) +
    (flags.length ? "FLAG: " + flags.join("; ") : "ok")
  );
}

for (const name of Object.keys(SPEC)) {
  if (!seen.has(name)) {
    console.log(pad(name, 20) + pad("-", 14) + pad("-", 9) + pad("-", 8) + "MISSING");
    problems++;
  }
}

// Screenshot folder is checked separately — different spec
try {
  const shots = await fs.readdir("./assets/screens");
  console.log("\nscreens/");
  for (const s of shots.sort()) {
    const m = await sharp(path.join("./assets/screens", s)).metadata();
    const ratio = m.width / m.height;
    const okRatio = Math.abs(ratio - 390 / 844) < 0.02;
    console.log("  " + pad(s, 18) + pad(`${m.width}x${m.height}`, 14) +
      (okRatio ? "ok" : "FLAG: wrong aspect, recapture at 390x844"));
    if (!okRatio) problems++;
  }
} catch {
  console.log("\nscreens/  MISSING — capture app screenshots before running compose-hero");
  problems++;
}

console.log("-".repeat(78));
console.log(problems === 0 ? "all clear\n" : `${problems} problem(s) found\n`);
process.exit(problems === 0 ? 0 : 1);
