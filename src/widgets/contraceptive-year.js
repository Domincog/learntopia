/**
 * contraceptive-year — "100 couples rely on this method for one year": a grid
 * of 100 dots in which the couples who would have a pregnancy within the year
 * are marked. The learner switches between methods and between two ways of
 * counting: typical use (as people really use the method, slips included) and
 * perfect use (used correctly every single time).
 *
 * {
 *   type: 'contraceptive-year',
 *   methods: [{ id: 'pill', name: 'The pill', typical: 7, perfect: 0.3 }, …],   // pregnancies per 100 couples in the first year
 *   method: 'pill',             // the one shown first (default: the first in the list)
 *   use: 'typical',             // 'typical' | 'perfect'
 *   useToggle: true,            // show the typical / perfect switch
 *   static: false,
 * }
 *
 * State: { method, use, rate, marked, typical, perfect, seen, sawPerfect }
 *   rate      pregnancies per 100 couples per year for the method and the way of counting now shown
 *   marked    how many of the 100 dots are marked: the rate rounded to a whole number
 *   typical, perfect   both rates of the method now shown
 *   seen      every method the learner has looked at
 *   sawPerfect   the learner has looked at perfect use at least once
 *
 * setState({ method, use, seen }).
 *
 * The figures are supplied by the lesson (the course keeps them, with their source, in its helpers file). A dot is
 * a couple, not a person. The number of marked dots is the rate rounded to a whole number, so a rate below 0.5 in a
 * hundred marks no dot and 0.6 or 0.8 marks one; for any rate below one the caption gives it per thousand as well.
 * Which dots are marked is random (env.rng) but nested: a higher rate marks the same dots and more.
 */
import { frame, hue, s, h, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 420;
const H = 300;

addStyles('contraceptive-year', `
  .widget-contraceptive-year .cy-pick { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .widget-contraceptive-year .cy-opt { min-height: 40px; padding: 6px 12px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--surface); color: var(--ink); font: inherit; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; }
  .widget-contraceptive-year .cy-opt[aria-checked="true"] { background: var(--violet-soft); border-color: var(--violet); box-shadow: inset 0 0 0 1px var(--violet); }
  .widget-contraceptive-year .cy-opt:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-contraceptive-year .cy-opt:disabled { cursor: default; opacity: 0.8; }
  .widget-contraceptive-year .cy-line { margin: 0; text-align: center; font-size: var(--fs-md); text-wrap: balance; }
  .widget-contraceptive-year .cy-line strong { color: var(--orange-text); }
`);

const perText = (rate) => {
  if (rate >= 1) return `about ${Math.round(rate)} in 100`;
  const k = Math.round(rate * 10);
  return `fewer than 1 in 100 (about ${k} in 1,000)`;
};

export default function create(spec, env) {
  const methods = Array.isArray(spec.methods) ? spec.methods : [];
  const isStatic = !!spec.static || !!env.compact;
  let method = methods.find((m) => m.id === spec.method) || methods[0];
  let use = spec.use === 'perfect' ? 'perfect' : 'typical';
  let readOnly = !!env.readOnly;
  const seen = [method.id];
  let sawPerfect = use === 'perfect';
  const order = env.rng.shuffle(Array.from({ length: 100 }, (_, i) => i));     // which dots are marked first

  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 460, label: spec.alt || 'One hundred couples who rely on a method of contraception for a year' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const line = h('p.cy-line', { 'aria-live': 'polite' });
  const methodBtns = {};
  const useBtns = {};

  const rateNow = () => method[use];
  const getState = () => ({ method: method.id, use, rate: rateNow(), marked: Math.round(rateNow()), typical: method.typical, perfect: method.perfect, seen: seen.slice(), sawPerfect });

  function render() {
    g.replaceChildren();
    const n = Math.round(rateNow());
    const marked = new Set(order.slice(0, n));
    const cell = 27;
    const x0 = (W - cell * 10) / 2 + cell / 2;
    const y0 = 18 + cell / 2;
    for (let i = 0; i < 100; i++) {
      const cx = x0 + (i % 10) * cell;
      const cy = y0 + Math.floor(i / 10) * cell;
      if (marked.has(i)) {
        g.appendChild(s('rect', { x: cx - 10, y: cy - 10, width: 20, height: 20, rx: 5, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      } else {
        g.appendChild(s('circle', { cx, cy, r: 8, fill: hue('gray', 'soft'), stroke: 'var(--ink)', 'stroke-width': 1.5, opacity: 0.85 }));
      }
    }
    // "no method" cannot be used well or badly: its two figures are the same, so the caption leaves the way of use out
    const how = use === 'typical' ? 'as people typically use it' : 'used perfectly every time';
    const lead = method.id === 'none' ? method.name : `${method.name}, ${how}`;
    line.replaceChildren(`${lead}: `, h('strong', perText(rateNow())), ' couples have a pregnancy within a year.');
    for (const m of methods) if (methodBtns[m.id]) { methodBtns[m.id].setAttribute('aria-checked', String(m.id === method.id)); methodBtns[m.id].disabled = readOnly; }
    for (const k of ['typical', 'perfect']) if (useBtns[k]) { useBtns[k].setAttribute('aria-checked', String(k === use)); useBtns[k].disabled = readOnly; }
    svg.setAttribute('aria-label', `${spec.alt || 'One hundred couples who rely on a method of contraception for a year'}. ${lead}: ${perText(rateNow())} have a pregnancy within a year. ${n} of the 100 dots are marked.`);
  }

  const chip = (text, onClick) => {
    const b = h('button.cy-opt', { type: 'button', role: 'radio' }, text);
    b.dataset.keys = 'own';
    b.addEventListener('click', () => { if (readOnly) return; onClick(); play('select'); render(); env.onChange(getState()); });
    return b;
  };

  if (!isStatic) {
    if (methods.length > 1) {
      const group = h('div.cy-pick', { role: 'radiogroup', 'aria-label': 'Method' });
      for (const m of methods) {
        methodBtns[m.id] = chip(m.name, () => { method = m; if (!seen.includes(m.id)) seen.push(m.id); });
        group.appendChild(methodBtns[m.id]);
      }
      fr.controls.appendChild(group);
    }
    if (spec.useToggle !== false) {
      const group = h('div.cy-pick', { role: 'radiogroup', 'aria-label': 'How it is used' });
      useBtns.typical = chip('Typical use', () => { use = 'typical'; });
      useBtns.perfect = chip('Perfect use', () => { use = 'perfect'; sawPerfect = true; });
      group.append(useBtns.typical, useBtns.perfect);
      fr.controls.appendChild(group);
    }
  }
  fr.el.insertBefore(line, fr.readouts);

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      const m = methods.find((q) => q.id === next.method);
      if (m) { method = m; if (!seen.includes(m.id)) seen.push(m.id); }
      if (next.use === 'typical' || next.use === 'perfect') { use = next.use; if (use === 'perfect') sawPerfect = true; }
      if (next.sawPerfect) sawPerfect = true;
      if (Array.isArray(next.seen)) for (const id of next.seen) if (methods.some((q) => q.id === id) && !seen.includes(id)) seen.push(id);
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  {
    title: 'contraceptive-year — typical and perfect use',
    spec: {
      type: 'contraceptive-year',
      methods: [
        { id: 'none', name: 'No method', typical: 85, perfect: 85 },
        { id: 'condom', name: 'Condom', typical: 13, perfect: 2 },
        { id: 'pill', name: 'The pill', typical: 7, perfect: 0.3 },
        { id: 'implant', name: 'Implant', typical: 0.1, perfect: 0.1 },
      ],
      method: 'pill',
    },
  },
];
