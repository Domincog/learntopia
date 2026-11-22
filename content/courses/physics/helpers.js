/**
 * Helpers shared by the lessons of "Physics: Motion & Forces".
 *
 * The figure builders return specs for the built-in `svg` widget and use the
 * theme classes (fill-*, stroke-*, fig-label…) so the drawings follow light
 * and dark mode.
 */

/** Acceleration of free fall used throughout the course (m/s²). */
export const G = 10;

/** "a" or "an" before a number as it is read aloud: aAn(80) is "an", aAn(70) is "a". */
export const aAn = (n) => (/^(8|11$|18$)/.test(String(n)) ? 'an' : 'a');

const f1 = (v) => (Math.round(v * 10) / 10).toString();

/**
 * A grid of small position–time sketches, one per story, for "which graph
 * matches?" questions. Each panel is { label: 'A', pts: [[t, x], …] }.
 */
export function graphPanels(panels, { tMax = 8, xMax = 12, alt = '' } = {}) {
  const cols = 2;
  const pw = 212;
  const ph = 150;
  const gap = 16;
  const rows = Math.ceil(panels.length / cols);
  const width = cols * pw + (cols - 1) * gap;
  const height = rows * ph + (rows - 1) * gap;
  let content = '';
  panels.forEach((panel, i) => {
    const ox = (i % cols) * (pw + gap);
    const oy = Math.floor(i / cols) * (ph + gap);
    const left = ox + 16;
    const right = ox + pw - 14;
    const top = oy + 30;
    const bottom = oy + ph - 26;
    const sx = (t) => left + (t / tMax) * (right - left - 8);
    const sy = (x) => bottom - (x / xMax) * (bottom - top - 4);
    content += `<rect class="fill-surface stroke-hair" stroke-width="2" x="${ox + 1}" y="${oy + 1}" width="${pw - 2}" height="${ph - 2}" rx="14"/>`;
    content += `<path class="stroke-ink fill-none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M${left} ${top - 6}V${bottom}H${right}"/>`;
    content += `<path class="stroke-blue fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="${panel.pts.map(([t, x], k) => `${k ? 'L' : 'M'}${f1(sx(t))} ${f1(sy(x))}`).join('')}"/>`;
    content += `<text class="fig-label-lg" x="${ox + pw - 16}" y="${oy + 26}" text-anchor="end">${panel.label}</text>`;
    content += `<text class="fig-label text-muted" x="${left + 8}" y="${oy + 21}">position</text>`;
    content += `<text class="fig-label text-muted" x="${right}" y="${oy + ph - 8}" text-anchor="end">time</text>`;
  });
  return { type: 'svg', viewBox: `0 0 ${width} ${height}`, maxWidth: 520, content, alt };
}

/**
 * A box on the ground with horizontal force arrows, for net-force questions.
 *   forceDiagram([{ n: 30, dir: 'right', label: 'push' }, { n: 12, dir: 'left', label: 'friction' }], { mass: '4 kg' })
 * Arrow lengths follow the sizes. Rightward forces are drawn orange, leftward
 * ones red, unless a `color` is given.
 */
export function forceDiagram(forces, { alt = '', mass = '' } = {}) {
  const W = 440;
  const H = 136;
  const cx = W / 2;
  const boxW = 76;
  const boxH = 58;
  const ground = 112;
  const top = ground - boxH;
  const biggest = Math.max(...forces.map((f) => Math.abs(f.n)), 1);
  const k = 122 / biggest;
  let content = `<line class="stroke-ink" stroke-width="3" stroke-linecap="round" x1="14" x2="${W - 14}" y1="${ground}" y2="${ground}"/>`;
  content += `<rect class="fill-yellow-soft stroke-ink" stroke-width="2.5" x="${cx - boxW / 2}" y="${top}" width="${boxW}" height="${boxH - 1.5}" rx="6"/>`;
  if (mass) content += `<text class="fig-label" x="${cx}" y="${ground - boxH / 2 + 5}" text-anchor="middle">${mass}</text>`;
  const sides = { right: forces.filter((f) => f.dir !== 'left'), left: forces.filter((f) => f.dir === 'left') };
  for (const side of ['right', 'left']) {
    const dir = side === 'right' ? 1 : -1;
    const list = sides[side];
    list.forEach((f, row) => {
      const y = list.length === 1 ? ground - boxH / 2 + 8 : top + 20 + row * 30;
      const x0 = cx + dir * (boxW / 2 + 5);
      const len = Math.max(34, Math.abs(f.n) * k);
      const x1 = x0 + dir * len;
      const color = f.color || (dir > 0 ? 'orange' : 'red');
      content += `<line class="stroke-${color}" stroke-width="6" stroke-linecap="round" x1="${f1(x0)}" x2="${f1(x1 - dir * 10)}" y1="${y}" y2="${y}"/>`;
      content += `<path class="fill-${color} stroke-${color}" stroke-width="2" stroke-linejoin="round" d="M${f1(x1)} ${y}L${f1(x1 - dir * 13)} ${y - 8}L${f1(x1 - dir * 13)} ${y + 8}Z"/>`;
      const text = f.label ? `${f.label} ${f.n} N` : `${f.n} N`;
      content += `<text class="fig-label text-${color}" x="${f1(x0 + dir * 2)}" y="${y - 12}" text-anchor="${dir > 0 ? 'start' : 'end'}">${text}</text>`;
    });
  }
  return { type: 'svg', viewBox: `0 0 ${W} ${H}`, maxWidth: 460, content, alt };
}
