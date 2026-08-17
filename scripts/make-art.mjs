// Draws the six landing-page images with SVG. No API, no key, no quota.
//
// Everything the manifest asked for is an abstract gradient or geometric
// pattern, which code renders more precisely than an image model — exact
// dimensions, exact brand colours, tiny files, identical every run.
//
// Colours are the landing page's own tokens. Change them here and rerun.

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const C = {
    ink: "#0d2436",
    ink2: "#123449",
    ink3: "#1b4763",
    brand: "#0ea5e9",
    brand2: "#38bdf8",
    brand3: "#7dd3fc",
    accent: "#f472b6",
    page: "#eef4f9",
    slate: "#dce7f0",
    white: "#ffffff"
};

const DIR = "./assets";

// Deterministic PRNG so the scattered shapes look random but never change
function rng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

/* ── 1. hero-bg ─────────────────────────────────────────────────────
   Pale gradient with faint diagonal streaks. Deliberately low contrast:
   dark headline text sits on top of this.                           */
function heroBg(w, h) {
    const streaks = [];
    const r = rng(7);
    for (let i = 0; i < 9; i++) {
        const x = -h + (i * w) / 6 + r() * 120;
        const width = 40 + r() * 110;
        streaks.push(
            `<rect x="${x.toFixed(0)}" y="${-h}" width="${width.toFixed(0)}" height="${h * 3}"
             fill="${C.white}" opacity="${(0.16 + r() * 0.2).toFixed(2)}"
             transform="rotate(28 ${x.toFixed(0)} 0)"/>`
        );
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0.65" y2="1">
        <stop offset="0%"   stop-color="#d5e8f6"/>
        <stop offset="45%"  stop-color="#e6f1f9"/>
        <stop offset="100%" stop-color="${C.page}"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.72" cy="0.18" r="0.6">
        <stop offset="0%"   stop-color="${C.white}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${C.white}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <g>${streaks.join("")}</g>
    <rect width="${w}" height="${h}" fill="url(#glow)"/>
  </svg>`;
}

/* ── 2. about-visual ────────────────────────────────────────────────
   Floating UI cards on white. Sits in the white "why" section, so the
   background matches and it reads as if it were transparent.        */
function aboutVisual(w, h) {
    const bars = [0.45, 0.72, 0.38, 0.9, 0.6, 0.8];
    const barW = 34, gap = 22, baseY = 470, maxH = 190;
    const barEls = bars.map((v, i) =>
        `<rect x="${180 + i * (barW + gap)}" y="${baseY - v * maxH}"
           width="${barW}" height="${v * maxH}" rx="6"
           fill="${i === 3 ? C.brand : C.brand3}"/>`
    ).join("");

    const ring = (cx, cy, rad, pct, col, sw) => {
        const circ = 2 * Math.PI * rad;
        return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none"
                    stroke="${C.slate}" stroke-width="${sw}"/>
            <circle cx="${cx}" cy="${cy}" r="${rad}" fill="none"
                    stroke="${col}" stroke-width="${sw}" stroke-linecap="round"
                    stroke-dasharray="${(circ * pct).toFixed(1)} ${circ.toFixed(1)}"
                    transform="rotate(-90 ${cx} ${cy})"/>`;
    };

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <filter id="sh" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
        <feOffset dy="10" result="o"/>
        <feFlood flood-color="${C.ink}" flood-opacity="0.10"/>
        <feComposite in2="o" operator="in"/>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="${w}" height="${h}" fill="${C.white}"/>

    <!-- back card -->
    <g filter="url(#sh)">
      <rect x="140" y="150" width="700" height="400" rx="20"
            fill="${C.white}" stroke="${C.slate}"/>
      <rect x="180" y="192" width="150" height="12" rx="6" fill="${C.slate}"/>
      ${barEls}
      <rect x="180" y="${baseY + 14}" width="380" height="6" rx="3" fill="${C.slate}"/>
    </g>

    <!-- front card, overlapping -->
    <g filter="url(#sh)">
      <rect x="560" y="420" width="470" height="300" rx="20"
            fill="${C.ink}" stroke="${C.ink3}"/>
      ${ring(680, 570, 70, 0.72, C.brand2, 16)}
      <rect x="800" y="510" width="180" height="12" rx="6" fill="${C.ink3}"/>
      <rect x="800" y="546" width="130" height="12" rx="6" fill="${C.ink3}"/>
      <rect x="800" y="582" width="160" height="12" rx="6" fill="${C.brand}" opacity="0.55"/>
      <rect x="800" y="618" width="90"  height="12" rx="6" fill="${C.ink3}"/>
    </g>

    <!-- small floating chip -->
    <g filter="url(#sh)">
      <rect x="120" y="600" width="260" height="110" rx="18"
            fill="${C.white}" stroke="${C.slate}"/>
      ${ring(185, 655, 32, 0.45, C.brand, 9)}
      <rect x="245" y="638" width="100" height="10" rx="5" fill="${C.slate}"/>
      <rect x="245" y="664" width="66"  height="10" rx="5" fill="${C.brand3}"/>
    </g>
  </svg>`;
}

/* ── 3. section-1 ─── overlapping translucent squares, calm and orderly */
function section1(w, h) {
    const r = rng(21);
    const cells = [];
    const step = 96;
    for (let y = -step; y < h + step; y += step) {
        for (let x = -step; x < w + step; x += step) {
            cells.push(`<rect x="${x}" y="${y}" width="${step}" height="${step}"
                        fill="none" stroke="${C.slate}" stroke-width="1"/>`);
        }
    }
    const blocks = [];
    for (let i = 0; i < 14; i++) {
        const s = step * (1 + Math.floor(r() * 2));
        const x = Math.floor(r() * (w / step)) * step;
        const y = Math.floor(r() * (h / step)) * step;
        const fill = r() > 0.55 ? C.brand2 : C.ink3;
        blocks.push(`<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="4"
                       fill="${fill}" opacity="${(0.10 + r() * 0.22).toFixed(2)}"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${C.page}"/>
    <g>${cells.join("")}</g>
    <g>${blocks.join("")}</g>
  </svg>`;
}

/* ── 4. section-2 ─── flowing waves on navy, one pink accent */
function section2(w, h) {
    const wave = (yBase, amp, col, op, sw) => {
        let d = `M -50 ${yBase}`;
        for (let x = -50; x <= w + 50; x += 40) {
            const y = yBase + Math.sin((x / w) * Math.PI * 3.1) * amp;
            d += ` L ${x} ${y.toFixed(1)}`;
        }
        return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"
                  opacity="${op}" stroke-linecap="round"/>`;
    };
    const waves = [];
    for (let i = 0; i < 11; i++) {
        waves.push(wave(120 + i * 38, 26 + i * 3, C.brand2, (0.14 + i * 0.045).toFixed(2), 2.5));
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stop-color="${C.ink}"/>
        <stop offset="100%" stop-color="${C.ink2}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg2)"/>
    ${waves.join("")}
    ${wave(300, 44, C.brand, 0.95, 4)}
    ${wave(352, 40, C.accent, 0.7, 3)}
  </svg>`;
}

/* ── 5. section-3 ─── sparse scattered polygons on light slate */
function section3(w, h) {
    const r = rng(99);
    const shapes = [];
    for (let i = 0; i < 22; i++) {
        const cx = r() * w, cy = r() * h;
        const rad = 16 + r() * 46;
        const sides = 3 + Math.floor(r() * 4);
        const rot = r() * Math.PI * 2;
        const pts = [];
        for (let k = 0; k < sides; k++) {
            const a = rot + (k / sides) * Math.PI * 2;
            pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
        }
        const fill = r() > 0.5 ? C.brand2 : C.brand3;
        shapes.push(`<polygon points="${pts.join(" ")}" fill="${fill}"
                          opacity="${(0.16 + r() * 0.4).toFixed(2)}"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="${C.white}"/>
        <stop offset="100%" stop-color="${C.page}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg3)"/>
    ${shapes.join("")}
  </svg>`;
}

/* ── 6. og-image ─── navy card, shapes bottom right, left side empty */
function ogImage(w, h) {
    const r = rng(5);
    const cluster = [];
    for (let i = 0; i < 16; i++) {
        const cx = w * 0.72 + r() * w * 0.3;
        const cy = h * 0.45 + r() * h * 0.6;
        const s = 18 + r() * 62;
        const col = r() > 0.6 ? C.brand : C.brand3;
        cluster.push(
            r() > 0.5
                ? `<rect x="${cx.toFixed(0)}" y="${cy.toFixed(0)}" width="${s.toFixed(0)}"
                 height="${s.toFixed(0)}" rx="6" fill="${col}"
                 opacity="${(0.18 + r() * 0.5).toFixed(2)}"
                 transform="rotate(${(r() * 40 - 20).toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`
                : `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${(s / 2).toFixed(0)}"
                   fill="none" stroke="${col}" stroke-width="3"
                   opacity="${(0.2 + r() * 0.5).toFixed(2)}"/>`
        );
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${C.ink}"/>
    <g>${cluster.join("")}</g>
  </svg>`;
}

const JOBS = [
    { file: "hero-bg.jpg", w: 2400, h: 1400, svg: heroBg },
    { file: "about-visual.jpg", w: 1200, h: 900, svg: aboutVisual },
    { file: "section-1.jpg", w: 800, h: 600, svg: section1 },
    { file: "section-2.jpg", w: 800, h: 600, svg: section2 },
    { file: "section-3.jpg", w: 800, h: 600, svg: section3 },
    { file: "og-image.jpg", w: 1200, h: 630, svg: ogImage }
];

await fs.mkdir(DIR, { recursive: true });

for (const job of JOBS) {
    const out = path.join(DIR, job.file);
    await sharp(Buffer.from(job.svg(job.w, job.h)))
        .jpeg({ quality: 88, mozjpeg: true })
        .toFile(out);
    const { size } = await fs.stat(out);
    console.log(`  ok  ${job.file}  ${job.w}x${job.h}  ${(size / 1024).toFixed(0)} KB`);
}

console.log(`\ndone, ${JOBS.length}/${JOBS.length} drawn — no API, no quota`);
