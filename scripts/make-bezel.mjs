// Draws the phone frame with code instead of generating it with AI.
// Deterministic geometry means compose-hero.mjs can place the screenshot
// exactly, and the PNG has real alpha because we control every pixel.

import fs from "node:fs/promises";
import sharp from "sharp";
import { CANVAS, PHONE, SCREEN } from "./geometry.mjs";

const OUT = "./assets/device-bezel.png";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.w}" height="${CANVAS.h}">
  <defs>
    <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#1e293b"/>
      <stop offset="55%"  stop-color="${PHONE.frame}"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>

  <!-- frame. No SVG shadow: the renderer flattens feDropShadow into a hard
       duplicate. The landing page applies drop-shadow-2xl in CSS instead. -->
  <rect x="${PHONE.x}" y="${PHONE.y}" width="${PHONE.w}" height="${PHONE.h}"
        rx="${PHONE.radius}" ry="${PHONE.radius}"
        fill="url(#frame)" stroke="${PHONE.edge}" stroke-width="1.5"/>

  <!-- screen well: solid black, the screenshot lands on top of this -->
  <rect x="${SCREEN.x}" y="${SCREEN.y}" width="${SCREEN.w}" height="${SCREEN.h}"
        rx="${SCREEN.radius}" ry="${SCREEN.radius}" fill="#000000"/>

  <!-- side button + volume rocker, purely cosmetic -->
  <rect x="${PHONE.x + PHONE.w - 2}" y="${PHONE.y + 250}" width="4" height="86"
        rx="2" fill="#475569"/>
  <rect x="${PHONE.x - 2}" y="${PHONE.y + 200}" width="4" height="54"
        rx="2" fill="#475569"/>
  <rect x="${PHONE.x - 2}" y="${PHONE.y + 268}" width="4" height="54"
        rx="2" fill="#475569"/>
</svg>`;

await fs.mkdir("./assets", { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(OUT);

console.log(`bezel written  ${OUT}  ${CANVAS.w}x${CANVAS.h}`);
console.log(`screen well    ${SCREEN.w}x${SCREEN.h} at (${SCREEN.x}, ${SCREEN.y})`);
