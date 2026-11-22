/**
 * water-balance — a day's water budget, balanced by the kidneys. The learner sets how much water
 * comes in (drinks and food) and how much is lost as sweat; the kidneys answer by making more or less
 * urine, more dilute or more concentrated, so that what goes out matches what came in. When too little
 * comes in, urine falls to the least the kidneys can make and the body runs short.
 *
 * {
 *   type: 'water-balance',
 *   intake: 2.5,        // litres a day taken in as drinks and in food: 0.5 to 4 in steps of 0.5
 *   sweat: 0.2,         // litres a day lost as sweat: 0.2, 1, 2 or 3
 *   controls: ['intake', 'sweat'],
 *   static: false,
 * }
 *
 * State: { intake, sweat, made, fixedLoss, urine, filtered, takenBack, takenBackPercent, short, balanced, adh, colour, colourName, changed }
 *   made        water produced by the cells' own respiration (0.3 L a day)
 *   fixedLoss   water lost in the breath, through the skin without sweating, and in the stool (0.9 L a day)
 *   urine       litres of urine the kidneys make (one decimal; never less than 0.5)
 *   filtered    litres of fluid filtered out of the blood each day (180)
 *   takenBack   filtered − urine;  takenBackPercent — the same as a percentage (one decimal)
 *   short       litres by which the day's losses exceed the day's supply (0 when in balance)
 *   balanced    short === 0
 *   adh         level of the water-saving hormone ADH: 'very low' | 'low' | 'medium' | 'high' | 'very high'
 *   colour      0 (almost clear) to 4 (dark amber);  colourName — the same in words
 *   changed     names of the controls the learner has moved
 *
 * setState accepts { intake, sweat }.
 *
 * The model: water in + water made = fixed losses + sweat + urine, with urine never below the 0.5 L a
 * day that the kidneys need to carry away the day's wastes (if the sum does not work out, the body is
 * short by the difference). All figures are round values for an adult on a temperate day (standard
 * physiology texts give about 2.5 L in and out). Real needs vary with body size, climate, activity,
 * pregnancy and health, and the model is not a guide to how much anyone should drink. Urine colour is a
 * rough sign only: some foods, vitamins and medicines change it.
 */
import { frame, sliderRow, hue, s, h, clamp, tidy, addStyles } from './kit.js';
import { play } from '../core/audio.js';

export const WATER = { made: 0.3, fixedLoss: 0.9, minUrine: 0.5, filtered: 180 };
export const SWEATS = [0.2, 1, 2, 3];
export const COLOURS = ['almost clear', 'pale straw', 'yellow', 'dark yellow', 'amber'];

/** What the kidneys do with a day's supply and losses. */
export function waterDay(intake, sweat) {
  const spare = intake + WATER.made - WATER.fixedLoss - sweat;      // what is left over for urine
  const urine = tidy(Math.max(WATER.minUrine, spare), 1);
  const short = tidy(Math.max(0, WATER.minUrine - spare), 1);
  const level = short > 0 ? 4 : urine <= 1 ? 3 : urine <= 1.6 ? 2 : urine <= 2.6 ? 1 : 0;
  return {
    intake, sweat, made: WATER.made, fixedLoss: WATER.fixedLoss, urine,
    filtered: WATER.filtered, takenBack: tidy(WATER.filtered - urine, 1), takenBackPercent: tidy(((WATER.filtered - urine) / WATER.filtered) * 100, 1),
    short, balanced: short === 0,
    adh: ['very low', 'low', 'medium', 'high', 'very high'][level],
    colour: level, colourName: COLOURS[level],
  };
}

const W = 560;
const H = 262;
const BASE = 226;         // the foot of both bars
const PX = 40;            // pixels per litre

addStyles('water-balance', `
  .widget-water-balance .wb-num { font-family: var(--font-mono); font-size: 13px; font-weight: 700; fill: var(--ink); }
  .widget-water-balance .wb-part { font-size: 12px; font-weight: 700; fill: var(--ink); }
  .widget-water-balance .wb-big { font-size: 15px; }
  @container wcanvas (max-width: 470px) {
    .widget-water-balance .wb-num { font-size: 16px; }
    .widget-water-balance .wb-part { font-size: 15px; }
    .widget-water-balance .wb-big { font-size: 18px; }
  }
`);

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const show = new Set(Array.isArray(spec.controls) ? spec.controls : ['intake', 'sweat']);
  let intake = clamp(Math.round((spec.intake != null ? spec.intake : 2.5) * 2) / 2, 0.5, 4);
  let sweat = SWEATS.includes(spec.sweat) ? spec.sweat : 0.2;
  let readOnly = !!env.readOnly;
  const changed = new Set();

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A day\'s water: what comes in, what goes out and what the kidneys do' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const getState = () => ({ ...waterDay(intake, sweat), changed: [...changed] });
  const litres = (v) => `${v.toFixed(1)} L`;

  // urine swatch: pale to dark, from the palette only
  const urineFill = (level) => (level >= 4 ? { fill: hue('orange'), opacity: 1 } : { fill: hue('yellow'), opacity: [0.18, 0.45, 0.75, 1][level] });

  function describe(d) {
    if (!d.balanced) return `Losses exceed supply by ${litres(d.short)} a day. The kidneys are already making as little urine as they can; the body is drying out, and thirst is strong.`;
    if (d.colour >= 3) return `The kidneys save water: only ${litres(d.urine)} of concentrated urine. The books still balance.`;
    if (d.colour <= 0) return `Plenty of spare water: the kidneys let ${litres(d.urine)} go as dilute urine.`;
    return `In balance: the kidneys let ${litres(d.urine)} go and take back the rest.`;
  }

  function render() {
    const d = waterDay(intake, sweat);
    g.replaceChildren();
    const seg = (x, yTop, ht, fill, opacity = 1) => {
      g.appendChild(s('rect', { x, y: yTop, width: 70, height: ht, fill: 'var(--surface)' }));
      g.appendChild(s('rect', { x, y: yTop, width: 70, height: ht, fill, opacity, stroke: 'none' }));
      g.appendChild(s('rect', { x, y: yTop, width: 70, height: ht, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    };
    const tag = (x, y, str, anchor) => g.appendChild(s('text.wb-part', { x, y, 'text-anchor': anchor }, str));

    // IN: drinks and food, plus water made by the cells
    const inX = 150;
    let y = BASE;
    const inParts = [[intake, hue('blue'), 'drinks and food'], [d.made, hue('violet'), 'made by cells']];
    for (const [v, fill, label] of inParts) {
      const ht = v * PX;
      y -= ht;
      seg(inX, y, ht, fill);
      tag(inX - 8, y + ht / 2 + 4, `${label} ${v.toFixed(1)}`, 'end');
    }
    g.appendChild(s('text.fig-label.wb-big', { x: inX + 35, y: BASE + 22, 'text-anchor': 'middle' }, `IN ${litres(intake + d.made)}`));
    if (!d.balanced) {
      const ht = d.short * PX;
      g.appendChild(s('rect', { x: inX, y: y - ht, width: 70, height: ht, fill: hue('red', 'soft'), stroke: hue('red'), 'stroke-width': 2.5, 'stroke-dasharray': '5 5' }));
      g.appendChild(s('text.wb-part.text-red', { x: inX - 8, y: y - ht / 2 + 4, 'text-anchor': 'end' }, `short by ${d.short.toFixed(1)}`));
    }

    // OUT: fixed losses, sweat, urine
    const outX = 340;
    y = BASE;
    const u = urineFill(d.colour);
    const outParts = [[d.fixedLoss, hue('gray'), 'breath, skin, stool', 1], [sweat, hue('teal'), 'sweat', 1], [d.urine, u.fill, 'urine', u.opacity]];
    for (const [v, fill, label, op] of outParts) {
      const ht = v * PX;
      y -= ht;
      seg(outX, y, ht, fill, op);
      tag(outX + 78, y + ht / 2 + 4, `${label} ${v.toFixed(1)}`, 'start');
    }
    g.appendChild(s('text.fig-label.wb-big', { x: outX + 35, y: BASE + 22, 'text-anchor': 'middle' }, `OUT ${litres(d.fixedLoss + sweat + d.urine)}`));

    // the kidneys' report
    g.appendChild(s('text.fig-label-sm', { x: W / 2, y: 16, 'text-anchor': 'middle' }, `kidneys filter ${d.filtered} L a day and take back ${d.takenBack.toFixed(1)} L (${d.takenBackPercent.toFixed(1)}%)`));
    g.appendChild(s('text.fig-label-sm', { x: W / 2, y: 34, 'text-anchor': 'middle' }, `water-saving hormone (ADH): ${d.adh}  ·  urine: ${d.colourName}`));
    g.appendChild(s('text.fig-label-sm.text-muted', { x: W / 2, y: H - 4, 'text-anchor': 'middle' }, 'litres a day'));

    note.textContent = describe(d);
    svg.setAttribute('aria-label', `${spec.alt || 'A day\'s water budget'}. In: ${litres(intake)} as drinks and food and ${litres(d.made)} made by the cells. Out: ${litres(d.fixedLoss)} in breath, through the skin and in stool, ${litres(sweat)} as sweat and ${litres(d.urine)} as urine, which is ${d.colourName}. ADH is ${d.adh}. ${describe(d)}`);
  }

  const rows = {};
  const touch = (name) => { changed.add(name); play('tick'); render(); env.onChange(getState()); };
  if (!isStatic) {
    if (show.has('intake')) {
      rows.intake = sliderRow({ label: 'water in (drinks and food)', min: 0.5, max: 4, step: 0.5, value: intake, color: 'blue', digits: 1, unit: 'L', onInput: (v) => { if (readOnly) return; intake = v; touch('intake'); } });
      fr.controls.appendChild(rows.intake.el);
    }
    if (show.has('sweat')) {
      rows.sweat = sliderRow({ label: 'sweat', min: 0, max: SWEATS.length - 1, step: 1, value: SWEATS.indexOf(sweat), color: 'teal', format: (v) => `${SWEATS[v].toFixed(1)} L`, onInput: (v) => { if (readOnly) return; sweat = SWEATS[v]; rows.sweat.input.setAttribute('aria-valuetext', `${SWEATS[v]} litres`); touch('sweat'); } });
      rows.sweat.input.setAttribute('aria-valuetext', `${sweat} litres`);
      fr.controls.appendChild(rows.sweat.el);
    }
  }
  if (!env.compact) fr.el.insertBefore(note, fr.readouts);
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.intake === 'number') { intake = clamp(Math.round(next.intake * 2) / 2, 0.5, 4); if (rows.intake) rows.intake.set(intake); changed.add('intake'); }
      if (SWEATS.includes(next.sweat)) { sweat = next.sweat; if (rows.sweat) { rows.sweat.set(SWEATS.indexOf(sweat)); rows.sweat.input.setAttribute('aria-valuetext', `${sweat} litres`); } changed.add('sweat'); }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const k of Object.keys(rows)) rows[k].setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'water-balance — the kidneys balance the books', spec: { type: 'water-balance', intake: 2.5, sweat: 0.2 } },
  { title: 'water-balance — a hot day with too little to drink', spec: { type: 'water-balance', intake: 1.5, sweat: 2, static: true } },
];
