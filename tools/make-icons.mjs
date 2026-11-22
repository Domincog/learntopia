#!/usr/bin/env node
/**
 * Renders the app icons and the social-preview image from the mascot
 * drawing in src/ui/mascot.js, so the icon set always matches the brand.
 *
 *   node tools/make-icons.mjs
 *
 * Writes into assets/icons/: favicon.svg, icon-192.png, icon-512.png,
 * maskable-512.png, apple-touch-icon.png, og.png
 *
 * Needs Playwright (only for rasterising):
 *   npm install --no-save playwright && npx playwright install chromium
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { mascotSvg } from '../src/ui/mascot.js';
import { config } from '../src/config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets/icons');
mkdirSync(out, { recursive: true });

const ORANGE = '#FF8A1F';
const INK = '#1D1B26';
const PAPER = '#FAF5EA';

/** The mascot's face as bare SVG content positioned inside a box. */
function face(x, y, size) {
  const svg = mascotSvg('happy', { size, variant: 'face', animate: false });
  return svg.replace('<svg ', `<svg x="${x}" y="${y}" `);
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect x="16" y="16" width="480" height="480" rx="112" fill="${ORANGE}" stroke="${INK}" stroke-width="24"/>
  ${face(76, 96, 360)}
</svg>`;
writeFileSync(join(out, 'favicon.svg'), favicon);

const page = (body, w, h, bg = 'transparent') => `<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;background:${bg};overflow:hidden">${body}</body></html>`;

const rounded = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect x="12" y="12" width="488" height="488" rx="116" fill="${ORANGE}" stroke="${INK}" stroke-width="20"/>
  ${face(76, 96, 360)}
</svg>`;

// Maskable / Apple icons are full-bleed squares; keep the face inside the central "safe zone".
const fullBleed = (size, faceSize) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${ORANGE}"/>
  ${face((512 - faceSize) / 2, (512 - faceSize * 0.9) / 2, faceSize)}
</svg>`;

const og = `
  <div style="width:1200px;height:630px;background:${PAPER};display:flex;align-items:center;justify-content:space-between;padding:0 90px;box-sizing:border-box;font-family:Georgia,'Times New Roman',serif;color:${INK}">
    <div>
      <div style="font-size:104px;font-weight:700;letter-spacing:-3px;line-height:1">${config.name}<span style="color:${ORANGE}">.</span></div>
      <div style="font-size:50px;margin-top:26px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-weight:600">${config.tagline}</div>
      <div style="font-size:30px;margin-top:22px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;opacity:0.7;max-width:640px">Free, open-source interactive lessons in math, logic, computer science, science, history, geography, health, psychology and money.</div>
    </div>
    <div style="width:340px;height:340px;border-radius:50%;background:#FFE7CC;border:4px dashed ${ORANGE};display:grid;place-items:center">${mascotSvg('cheer', { size: 280, animate: false })}</div>
  </div>`;

let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)('playwright'));
} catch {
  console.log('Wrote favicon.svg. Install Playwright to render the PNG icons as well.');
  process.exit(0);
}

const browser = await chromium.launch();
async function shot(html, w, h, file, transparent = true) {
  const pg = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await pg.setContent(html);
  await pg.screenshot({ path: join(out, file), omitBackground: transparent });
  await pg.close();
  console.log('wrote', file);
}
await shot(page(rounded(192), 192, 192), 192, 192, 'icon-192.png');
await shot(page(rounded(512), 512, 512), 512, 512, 'icon-512.png');
await shot(page(fullBleed(512, 300), 512, 512, ORANGE), 512, 512, 'maskable-512.png', false);
await shot(page(fullBleed(180, 340), 180, 180, ORANGE), 180, 180, 'apple-touch-icon.png', false);
await shot(page(og, 1200, 630, PAPER), 1200, 630, 'og.png', false);
await browser.close();
