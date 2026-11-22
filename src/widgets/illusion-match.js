/**
 * illusion-match — measure an illusion on yourself by the method of
 * adjustment. Two things are drawn; one is fixed and the other can be
 * adjusted with a slider (which shows no numbers). The learner sets it until
 * the two LOOK equal, then presses "Reveal": guides are drawn, and the true
 * values and the size of the mismatch are shown. Nothing is judged: the
 * message under the figure describes what most people do, and covers the
 * learner who is not fooled as well as the one who is.
 *
 * {
 *   type: 'illusion-match',
 *   kind: 'muller-lyer',     // 'muller-lyer'  two lines: arrowheads on the fixed one, outward fins on the adjustable one
 *                            // 'ponzo'        two bars between converging lines; the lower one is adjustable
 *                            // 'contrast'     two grey patches on different surrounds; the right one is adjustable
 *   start: 150,              // optional starting value (otherwise chosen with env.rng, clearly off on either side)
 *   static: false,           // true: a picture with both set equal, no controls (use `value` to draw another setting)
 *   value: 200,              // static only: the adjustable value to draw
 *   guides: false,           // static only: draw the guides that "Reveal" shows
 * }
 *
 * Units: for the two line figures, lengths in drawing units (the fixed line is 200, the fixed bar 110);
 * for 'contrast', the lightness of the patch from 0 to 100 (the fixed patch is 50).
 *
 * State: { kind, value, truth, error, moved, revealed }
 *   value     the learner's setting · truth: the value that would make the two physically equal
 *   error     how far off the setting is: percent of the true length for the line figures (−12 = 12% too short),
 *             lightness steps for 'contrast' (+8 = 8 steps lighter than the fixed patch)
 *   moved     the slider has been touched · revealed: "Reveal" has been pressed
 *
 * setState accepts { value, revealed }.
 *
 * The greys of 'contrast' are the stimulus of an experiment, so they are the same physical greys in the
 * light and the dark theme: mixtures of white and black, not theme colours. Everything else follows the theme.
 */
import { frame, sliderRow, button, readout, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('illusion-match', `
  .widget-illusion-match .im-note { margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); min-height: 2.6em; text-wrap: balance; }
  .widget-illusion-match .im-note b { color: var(--ink); }
`);

const W = 520;
const H = 300;
const KINDS = {
  'muller-lyer': { truth: 200, min: 120, max: 280, step: 2, label: 'Length of the lower line', unit: '%', usual: -1 },
  ponzo: { truth: 110, min: 60, max: 180, step: 2, label: 'Length of the lower bar', unit: '%', usual: 1 },
  contrast: { truth: 50, min: 20, max: 80, step: 1, label: 'Shade of the right-hand patch', unit: '', usual: 1 },
};
const grey = (level) => `color-mix(in srgb, white ${level}%, black)`;

export default function create(spec, env) {
  const kind = KINDS[spec.kind] ? spec.kind : 'muller-lyer';
  const K = KINDS[kind];
  const isStatic = !!spec.static || env.compact;
  const snap = (v) => clamp(Math.round(v / K.step) * K.step, K.min, K.max);
  const randomStart = () => {
    const span = K.max - K.min;
    const off = env.rng.int(Math.round(span * 0.28), Math.round(span * 0.4));
    return snap(K.truth + (env.rng.bool() ? off : -off));
  };
  let value = isStatic ? (spec.value != null ? snap(spec.value) : K.truth) : (spec.start != null ? snap(spec.start) : randomStart());
  let revealed = isStatic ? !!spec.guides : false;
  let moved = false;
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, plain: kind !== 'contrast', label: spec.alt || 'An illusion to measure' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const note = h('p.im-note', { 'aria-live': 'polite' });
  const trueOut = readout(kind === 'contrast' ? 'left patch' : 'fixed line', { digits: 0 });
  const yourOut = readout('your setting', { digits: 0 });
  const diffOut = readout('difference', { digits: 0 });

  const error = () => (kind === 'contrast' ? value - K.truth : Math.round(((value - K.truth) / K.truth) * 1000) / 10);
  const getState = () => ({ kind, value, truth: K.truth, error: error(), moved, revealed });

  const line = (x1, y1, x2, y2, extra = {}) => s('line', { x1, y1, x2, y2, stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round', ...extra });
  const guide = (x, y1, y2) => s('line', { x1: x, x2: x, y1, y2, stroke: hue('orange'), 'stroke-width': 2, 'stroke-dasharray': '5 5' });

  function drawLines() {
    const cx0 = W / 2;
    const f = 30;
    const fins = (x, y, dir) => [line(x, y, x + dir * f, y - f), line(x, y, x + dir * f, y + f)];
    const yA = 92;
    const yB = 212;
    const a0 = cx0 - K.truth / 2;
    const a1 = cx0 + K.truth / 2;
    const b0 = cx0 - value / 2;
    const b1 = cx0 + value / 2;
    // fixed line: arrowheads (fins point back along the line), which make it look shorter
    g.append(line(a0, yA, a1, yA), ...fins(a0, yA, 1), ...fins(a1, yA, -1));
    // adjustable line: fins point outwards, which make it look longer
    g.append(line(b0, yB, b1, yB, { stroke: hue('blue') }), ...fins(b0, yB, -1), ...fins(b1, yB, 1));
    if (revealed) g.append(guide(a0, yA - 44, yB + 44), guide(a1, yA - 44, yB + 44));
  }

  function drawPonzo() {
    const cx0 = W / 2;
    g.append(line(cx0 - 150, H - 14, cx0 - 30, 14, { 'stroke-width': 3 }), line(cx0 + 150, H - 14, cx0 + 30, 14, { 'stroke-width': 3 }));
    // sleepers, to give the "railway" its depth
    for (let i = 0; i < 6; i++) {
      const y = 30 + i * 46;
      const half = 30 + ((y - 14) / (H - 28)) * 120 + 8;
      g.append(s('line', { x1: cx0 - half, x2: cx0 + half, y1: y, y2: y, stroke: 'var(--hair)', 'stroke-width': 2 }));
    }
    const yA = 76;
    const yB = 236;
    const bar = (len, y, color) => s('line', { x1: cx0 - len / 2, x2: cx0 + len / 2, y1: y, y2: y, stroke: color, 'stroke-width': 9, 'stroke-linecap': 'butt' });
    g.append(bar(K.truth, yA, 'var(--ink)'), bar(value, yB, hue('blue')));
    if (revealed) g.append(guide(cx0 - K.truth / 2, yA - 16, yB + 16), guide(cx0 + K.truth / 2, yA - 16, yB + 16));
  }

  function drawContrast() {
    const size = 200;
    const top = revealed ? 12 : 50;
    const patch = 64;
    const sq = (x, level) => s('rect', { x, y: top, width: size, height: size, fill: grey(level) });
    const pt = (x, level) => s('rect', { x: x + (size - patch) / 2, y: top + (size - patch) / 2, width: patch, height: patch, fill: grey(level) });
    g.append(sq(40, 12), sq(W - 40 - size, 88), pt(40, K.truth), pt(W - 40 - size, value));
    if (revealed) {
      // the two patches lifted out and laid side by side on one background
      const y = top + size + 18;
      g.append(s('rect', { x: 150, y, width: 220, height: 56, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2, rx: 6 }));
      g.append(s('rect', { x: 196, y: y + 8, width: 64, height: 40, fill: grey(K.truth) }), s('rect', { x: 260, y: y + 8, width: 64, height: 40, fill: grey(value) }));
      g.append(s('text', { class: 'fig-label-sm', x: 142, y: y + 33, 'text-anchor': 'end' }, 'left'), s('text', { class: 'fig-label-sm', x: 378, y: y + 33 }, 'right'));
    }
  }

  function message() {
    if (!revealed) { note.textContent = isStatic ? '' : 'Adjust until the two look the same to you. There is no clock.'; return; }
    const e = error();
    const size = Math.abs(e);
    const unit = kind === 'contrast' ? ` step${size === 1 ? '' : 's'}` : '%';
    const small = kind === 'contrast' ? size <= 2 : size <= 3;
    const usualWord = kind === 'muller-lyer' ? 'shorter' : kind === 'ponzo' ? 'longer' : 'lighter';
    const otherWord = kind === 'muller-lyer' ? 'longer' : kind === 'ponzo' ? 'shorter' : 'darker';
    note.replaceChildren();
    if (small) {
      note.append(h('b', size === 0 ? 'Exactly equal.' : `Within ${size}${unit} of equal.`), ' Most people end up clearly further off. Careful comparing, or knowing the figure, can shrink the effect.');
    } else if (Math.sign(e) === K.usual) {
      note.append('You made it ', h('b', `${size}${unit} ${usualWord}`), ' than the fixed one, and they looked equal. That is the direction almost everyone goes in.');
    } else {
      note.append('You made it ', h('b', `${size}${unit} ${otherWord}`), '. Most people go the other way; correcting for an illusion you expect can overshoot.');
    }
  }

  function draw() {
    g.replaceChildren();
    if (kind === 'ponzo') drawPonzo(); else if (kind === 'contrast') drawContrast(); else drawLines();
    if (revealed && !isStatic) {
      trueOut.set(K.truth);
      yourOut.set(value);
      const e = error();
      diffOut.set(`${e > 0 ? '+' : e < 0 ? '−' : ''}${Math.abs(e)}${kind === 'contrast' ? '' : '%'}`);
      if (!fr.readouts.firstChild) fr.readouts.append(trueOut.el, yourOut.el, diffOut.el);
    } else fr.readouts.replaceChildren();
    message();
    const what = kind === 'contrast' ? 'Two grey patches on different surrounds' : kind === 'ponzo' ? 'Two bars between converging lines' : 'Two lines with fins at their ends';
    svg.setAttribute('aria-label', `${spec.alt || what}.${revealed ? ` Fixed: ${K.truth}. Your setting: ${value}.` : ''}`);
  }

  let row = null;
  let revealBtn = null;
  if (!isStatic) {
    row = sliderRow({
      label: K.label, min: K.min, max: K.max, step: K.step, value, color: 'blue', format: () => '',
      onInput: (v) => { if (readOnly) return; value = snap(v); moved = true; draw(); env.onChange(getState()); },
    });
    row.input.setAttribute('aria-valuetext', 'adjust by eye');
    fr.controls.append(row.el);
    fr.el.insertBefore(note, fr.readouts);
    revealBtn = button('Reveal', () => {
      if (readOnly) return;
      revealed = !revealed;
      revealBtn.lastChild.textContent = revealed ? 'Hide the guides' : 'Reveal';
      play('pop');
      draw();
      if (revealed) env.announce(note.textContent);
      env.onChange(getState());
    }, { variant: 'primary' });
    fr.buttons.append(revealBtn);
  }
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.value != null) { value = snap(next.value); moved = true; if (row) row.set(value); }
      if (next.revealed != null) { revealed = !!next.revealed; if (revealBtn) revealBtn.lastChild.textContent = revealed ? 'Hide the guides' : 'Reveal'; }
      draw();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); if (row) row.setDisabled(readOnly); },
  };
}

export const examples = [
  { title: 'illusion-match — Müller-Lyer', spec: { type: 'illusion-match', kind: 'muller-lyer' } },
  { title: 'illusion-match — Ponzo', spec: { type: 'illusion-match', kind: 'ponzo' } },
  { title: 'illusion-match — lightness contrast', spec: { type: 'illusion-match', kind: 'contrast' } },
  { title: 'illusion-match — a picture with guides', spec: { type: 'illusion-match', kind: 'muller-lyer', static: true, guides: true } },
];
