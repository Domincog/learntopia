/**
 * cell-turnover — a clock for the body's cells. The learner moves time forward, from a day to fifty
 * years, and watches how many of the cells that were there at the start are still the same cells.
 * The lining of the gut is new within days; the neurons of the cortex are the ones you were born with.
 *
 * {
 *   type: 'cell-turnover',
 *   tissues: ['gut', 'skin', 'red', 'fat', 'heart', 'neurons', 'lens'],   // which rows, in this order (default: all)
 *   stop: 0,             // where the clock starts: an index into STOPS (0 = "now")
 *   static: false,       // true: a picture without the slider
 * }
 *
 * State: { stop, label, days, original, replaced, mostlyOriginal, visited }
 *   stop            index of the clock setting (see STOPS);  label — its name ("4 months");  days — its length in days
 *   original        { gut: 0, red: 0, fat: 48, … } per cent of each tissue's cells that are still the original ones (whole numbers)
 *   replaced        ids of the tissues with no original cell left
 *   mostlyOriginal  ids of the tissues where more than half are still original
 *   visited         how many different clock settings the learner has looked at
 *
 * setState accepts { stop } (or { label }).
 *
 * The model, and what it leaves out. Three kinds of tissue:
 *   - a fixed lifespan L (gut lining, skin surface, red cells): cells of every age are present at the start, so
 *     the share still original after t is 1 − t/L, reaching zero at t = L;
 *   - a steady yearly renewal r (fat cells, about 10% a year): the share is (1 − r)^years, a slow fade without an end;
 *   - heart muscle, renewed about 1% a year at age 25 falling to 0.45% a year at 75 (the clock starts at age 25);
 *   - never renewed (neurons of the cerebral cortex, the core of the lens): 100% throughout.
 * "Original" counts the cells present now that were already there at the start; cells that die without being
 * replaced (some neurons do) are not counted against a tissue. Lifespans are typical values: real ones vary
 * between people and between parts of the same tissue.
 */
import { frame, sliderRow, hue, s, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

/** Typical lifespans and renewal rates. Sources: Sender & Milo, Nature Medicine 2021 (gut, red cells, skin); Spalding et al., Nature 2008 (fat); Bergmann et al., Science 2009 (heart); Bhardwaj et al., PNAS 2006 (cortical neurons). */
export const TISSUES = {
  gut: { name: 'Gut lining', kind: 'lifespan', days: 5, color: 'orange', span: 'about 3 to 5 days' },
  skin: { name: 'Skin surface', kind: 'lifespan', days: 30, color: 'yellow', span: 'about a month' },
  red: { name: 'Red blood cells', kind: 'lifespan', days: 120, color: 'red', span: 'about 120 days' },
  fat: { name: 'Fat cells', kind: 'rate', perYear: 0.1, color: 'teal', span: 'about 10% a year' },
  heart: { name: 'Heart muscle', kind: 'heart', color: 'pink', span: 'under 1% a year' },
  neurons: { name: 'Cortex neurons', kind: 'never', color: 'violet', span: 'not replaced' },
  lens: { name: 'Core of the eye lens', kind: 'never', color: 'blue', span: 'not replaced' },
};

export const STOPS = [
  { label: 'now', days: 0 },
  { label: '1 day', days: 1 },
  { label: '5 days', days: 5 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '4 months', days: 122 },
  { label: '1 year', days: 365 },
  { label: '7 years', days: 7 * 365 },
  { label: '10 years', days: 10 * 365 },
  { label: '25 years', days: 25 * 365 },
  { label: '50 years', days: 50 * 365 },
];

/** Per cent of a tissue's cells that are still the original ones after `days` (a whole number, 0 to 100). */
export function originalShare(id, days) {
  const t = TISSUES[id];
  if (!t) return NaN;
  const years = days / 365;
  let f = 1;
  if (t.kind === 'lifespan') f = Math.max(0, 1 - days / t.days);
  else if (t.kind === 'rate') f = Math.pow(1 - t.perYear, years);
  else if (t.kind === 'heart') {
    // yearly renewal falls in a straight line from 1% at age 25 to 0.45% at age 75; the clock starts at 25
    const y = Math.min(years, 50);
    f = Math.exp(-(0.01 * y - (0.0055 / 50) * y * y / 2));
  }
  return Math.round(f * 100);
}

const W = 560;
const ROW = 38;
const X0 = 178;          // where the bars start
const X1 = 496;          // where they end

addStyles('cell-turnover', `
  .widget-cell-turnover .ct-name { font-size: 14px; }
  .widget-cell-turnover .ct-span { font-size: 11.5px; font-weight: 600; fill: var(--ink-3); }
  .widget-cell-turnover .ct-pct { font-family: var(--font-mono); font-size: 14px; font-weight: 700; fill: var(--ink); }
  .widget-cell-turnover .ct-head { font-size: 12px; font-weight: 700; fill: var(--ink-2); }
  @container wcanvas (max-width: 470px) {
    .widget-cell-turnover .ct-name { font-size: 17px; }
    .widget-cell-turnover .ct-span { font-size: 14px; }
    .widget-cell-turnover .ct-pct { font-size: 17px; }
    .widget-cell-turnover .ct-head { font-size: 15px; }
  }
`);

export default function create(spec, env) {
  const ids = (Array.isArray(spec.tissues) && spec.tissues.length ? spec.tissues : Object.keys(TISSUES)).filter((id) => TISSUES[id]);
  const isStatic = !!spec.static || !!env.compact;
  let stop = clamp(Math.round(spec.stop || 0), 0, STOPS.length - 1);
  let readOnly = !!env.readOnly;
  const visited = new Set([stop]);

  const H = 34 + ids.length * ROW + 8;
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'How many of the body\'s cells are still the original ones' });
  const { svg } = fr;
  svg.appendChild(s('text.ct-head', { x: X0, y: 18 }, 'still the original cells'));
  const clock = s('text.ct-head', { x: X1, y: 18, 'text-anchor': 'end' }, '');
  svg.appendChild(clock);

  const rows = ids.map((id, i) => {
    const t = TISSUES[id];
    const y = 34 + i * ROW;
    svg.appendChild(s('text.fig-label.ct-name', { x: 10, y: y + 14 }, t.name));
    svg.appendChild(s('text.ct-span', { x: 10, y: y + 29 }, t.span));
    svg.appendChild(s('rect', { x: X0, y: y + 4, width: X1 - X0, height: 22, rx: 7, fill: 'var(--sunken)', stroke: 'var(--ink)', 'stroke-width': 2 }));
    const bar = s('rect', { x: X0 + 2, y: y + 6, width: 0, height: 18, rx: 5, fill: hue(t.color) });
    const pct = s('text.ct-pct', { x: W - 8, y: y + 20, 'text-anchor': 'end' }, '');
    svg.append(bar, pct);
    return { id, bar, pct };
  });

  const shares = () => Object.fromEntries(ids.map((id) => [id, originalShare(id, STOPS[stop].days)]));
  function getState() {
    const original = shares();
    return {
      stop,
      label: STOPS[stop].label,
      days: STOPS[stop].days,
      original,
      replaced: ids.filter((id) => original[id] === 0),
      mostlyOriginal: ids.filter((id) => original[id] > 50),
      visited: visited.size,
    };
  }

  let row = null;
  function render() {
    const original = shares();
    for (const r of rows) {
      const v = original[r.id];
      r.bar.setAttribute('width', Math.max(0, ((X1 - X0 - 4) * v) / 100));
      r.pct.textContent = `${v}%`;
    }
    clock.textContent = stop === 0 ? 'at the start' : `after ${STOPS[stop].label}`;
    const said = ids.map((id) => `${TISSUES[id].name} ${original[id]} per cent`).join(', ');
    svg.setAttribute('aria-label', `${spec.alt || 'Bars showing how many of the body\'s cells are still the original ones'}. ${stop === 0 ? 'At the start' : `After ${STOPS[stop].label}`}: ${said}.`);
  }

  if (!isStatic) {
    row = sliderRow({
      label: 'time passed', min: 0, max: STOPS.length - 1, step: 1, value: stop, color: 'blue',
      format: (v) => STOPS[v].label,
      onInput: (v) => {
        if (readOnly) return;
        stop = v;
        visited.add(v);
        play('tick');
        render();
        env.onChange(getState());
      },
    });
    row.input.setAttribute('aria-valuetext', STOPS[stop].label);
    row.input.addEventListener('input', () => row.input.setAttribute('aria-valuetext', STOPS[Number(row.input.value)].label));
    fr.controls.appendChild(row.el);
  }
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      let to = next.stop;
      if (to == null && next.label != null) to = STOPS.findIndex((st) => st.label === next.label);
      if (typeof to !== 'number' || to < 0) return;
      stop = clamp(Math.round(to), 0, STOPS.length - 1);
      visited.add(stop);
      if (row) { row.set(stop); row.input.setAttribute('aria-valuetext', STOPS[stop].label); }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (row) row.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'cell-turnover — which cells are still the ones you started with?', spec: { type: 'cell-turnover' } },
  { title: 'cell-turnover — after seven years', spec: { type: 'cell-turnover', stop: 7, static: true } },
];
