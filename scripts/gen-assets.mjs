// Generates the flat background images the landing page needs.
//
// Uses generateContent, not generateImages — the latter was retired and
// returns 404. If the default model name 404s too, run:
//     npm.cmd run models
// and set IMAGE_MODEL to something from the list it prints.

import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set.");
  console.error("  CMD        :  set GEMINI_API_KEY=your_key");
  console.error('  PowerShell :  $env:GEMINI_API_KEY="your_key"');
  process.exit(1);
}

const MODEL = process.env.IMAGE_MODEL || "gemini-2.5-flash-image";
const ai = new GoogleGenAI({ apiKey });
const DIR = "./assets";

const MANIFEST = [
  {
    file: "hero-bg.jpg", w: 2400, h: 1400, ar: "16:9",
    prompt:
      "A wide abstract gradient background image. Pale ice blue fading into " +
      "pure white, with faint diagonal light streaks running from lower left " +
      "to upper right. Extremely low contrast, evenly lit, so that dark text " +
      "placed on top stays fully readable. No objects, no people, no text."
  },
  {
    file: "about-visual.jpg", w: 1200, h: 900, ar: "4:3",
    prompt:
      "A flat vector illustration on a pure white background. Abstract " +
      "floating interface cards showing simple bar charts and circular " +
      "progress rings, loosely stacked with soft shadows. Sky blue and deep " +
      "navy only. Clean minimal software style. No people, no text, no numbers."
  },
  {
    file: "section-1.jpg", w: 800, h: 600, ar: "4:3",
    prompt:
      "An abstract geometric composition. Overlapping translucent squares " +
      "arranged on a grid, pale slate grey and soft cyan, cool even lighting. " +
      "Calm and orderly. No people, no text."
  },
  {
    file: "section-2.jpg", w: 800, h: 600, ar: "4:3",
    prompt:
      "An abstract composition of smooth flowing wave curves on a deep navy " +
      "background, highlighted in sky blue with one restrained pink accent. " +
      "Fluid and modern, clearly different from a grid of squares. " +
      "No people, no text."
  },
  {
    file: "section-3.jpg", w: 800, h: 600, ar: "4:3",
    prompt:
      "An abstract pattern of flat polygons scattered across a light slate " +
      "background, with subtle cyan gradients and generous empty space " +
      "between the shapes. Airy and sparse, clearly different from waves or " +
      "a grid. No people, no text."
  },
  {
    file: "og-image.jpg", w: 1200, h: 630, ar: "16:9",
    prompt:
      "A wide social share card. Solid deep navy background. A small cluster " +
      "of geometric cyan accent shapes in the bottom right corner only. The " +
      "entire left two thirds stays completely empty and flat navy. " +
      "No text, no letters, no logos, no people."
  }
];

function extractImage(res) {
  const parts = res?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    if (p?.inlineData?.data) return p.inlineData.data;
  }
  // Surface why nothing came back rather than failing blind
  const text = parts.map(p => p?.text).filter(Boolean).join(" ").slice(0, 200);
  const finish = res?.candidates?.[0]?.finishReason;
  throw new Error(
    `no image in response${finish ? ` (finishReason: ${finish})` : ""}` +
    (text ? ` — model said: ${text}` : "")
  );
}

async function call(asset, withImageConfig) {
  const req = {
    model: MODEL,
    contents: asset.prompt,
    config: { responseModalities: ["IMAGE"] }
  };
  if (withImageConfig) req.config.imageConfig = { aspectRatio: asset.ar };
  return ai.models.generateContent(req);
}

async function generate(asset) {
  let res;
  try {
    res = await call(asset, true);
  } catch (e) {
    // Older/newer SDKs disagree on imageConfig; retry without it.
    if (/imageConfig|aspectRatio|unknown|invalid/i.test(e.message)) {
      res = await call(asset, false);
    } else {
      throw e;
    }
  }

  const b64 = extractImage(res);
  const out = path.join(DIR, asset.file);

  await sharp(Buffer.from(b64, "base64"))
    .resize(asset.w, asset.h, { fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);

  const { size } = await fs.stat(out);
  console.log(`  ok  ${asset.file}  ${asset.w}x${asset.h}  ${(size / 1024).toFixed(0)} KB`);
}

await fs.mkdir(DIR, { recursive: true });
console.log(`model: ${MODEL}\n`);

const failed = [];
for (const asset of MANIFEST) {
  console.log(`generating ${asset.file} ...`);
  try {
    await generate(asset);
  } catch (e1) {
    const msg = String(e1.message || e1);
    if (/NOT_FOUND|is not found|404/i.test(msg)) {
      console.error(`\nModel "${MODEL}" is not available on this key.`);
      console.error("Run  npm.cmd run models  to see what is, then set IMAGE_MODEL.\n");
      process.exit(1);
    }
    console.log(`  retry (${msg.slice(0, 140)})`);
    try {
      await generate(asset);
    } catch (e2) {
      console.error(`  FAILED  ${asset.file}: ${String(e2.message || e2).slice(0, 200)}`);
      failed.push(asset.file);
    }
  }
}

console.log(
  failed.length
    ? `\ndone with ${failed.length} failure(s): ${failed.join(", ")}`
    : `\ndone, ${MANIFEST.length}/${MANIFEST.length} generated`
);
