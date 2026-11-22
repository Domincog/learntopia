/**
 * paced-breathing — a breathing pacer. A circle grows while you breathe in
 * and shrinks while you breathe out; two sliders set how long each takes,
 * and the widget says how many breaths a minute that makes. Following it is
 * optional: lessons grade the pattern that was set, never whether anybody
 * actually breathed along.
 *
 * {
 *   type: 'paced-breathing',
 *   inhale: 3, exhale: 3,                 // seconds
 *   inhaleRange: [2, 6, 1],               // optional sliders: [min, max, step]
 *   exhaleRange: [2, 8, 1],
 *   breaths: 6,                           // one round: the pacer stops by itself after this many breaths
 * }
 *
 * State: { inhale, exhale, cycle, rate, longerExhale, breaths, running, done }
 *   cycle         seconds for one whole breath (inhale + exhale)
 *   rate          breaths a minute at this pace, to one decimal (60 / cycle)
 *   longerExhale  exhale > inhale
 *   breaths       whole breaths completed with the pacer since it was last started
 *   done          a full round was completed at least once
 *
 * setState accepts { inhale, exhale, breaths, done }.
 *
 * The Start / Stop control keeps working after the step is answered, so that a learner can try the pattern
 * after reading the explanation. With reduced motion the circle changes size in two steps instead of gliding.
 * Nothing here is medical treatment: it is a pacer, like a metronome. While it runs, the note under the
 * circle says to stop on feeling dizzy or uneasy.
 */
import { frame, sliderRow, readout, loop, hue, s, h, clamp, tidy, addStyles, icon } from './kit.js';
import { reducedMotion } from '../core/dom.js';

const W = 360;
const H = 270;
const CX = 180;
const CY = 132;
const R_MIN = 44;
const R_MAX = 104;

addStyles('paced-breathing', `
  .widget-paced-breathing .pb-word { font-family: var(--font-body); font-size: 19px; font-weight: 800; fill: #1D1B26; }
  .widget-paced-breathing .pb-count { font-family: var(--font-mono); font-size: 15px; font-weight: 700; fill: #1D1B26; }
  .widget-paced-breathing .pb-go { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 40px; padding: 0.35rem 0.9rem; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--surface); color: var(--ink); font-weight: 800; font-size: var(--fs-sm); cursor: pointer; box-shadow: var(--shadow-sm); user-select: none; }
  .widget-paced-breathing .pb-go:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-paced-breathing .pb-go.is-on { background: var(--teal-soft); }
  .widget-paced-breathing .pb-note { text-align: center; font-size: var(--fs-sm); color: var(--ink-2); margin: 0; min-height: 1.5em; text-wrap: balance; }
`);

export default function create(spec, env) {
  const ranges = { inhale: Array.isArray(spec.inhaleRange) ? spec.inhaleRange : null, exhale: Array.isArray(spec.exhaleRange) ? spec.exhaleRange : null };
  let inhale = spec.inhale != null ? spec.inhale : 4;
  let exhale = spec.exhale != null ? spec.exhale : 6;
  const round = spec.breaths || 6;
  let breaths = 0;
  let done = false;
  let running = false;
  let t = 0;                 // seconds into the current breath
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 400, label: spec.alt || 'A breathing pacer' });
  const { svg } = fr;
  const ring = s('circle', { cx: CX, cy: CY, r: R_MAX + 8, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '3 7' });
  const disc = s('circle', { cx: CX, cy: CY, r: R_MIN, fill: hue('teal'), stroke: 'var(--ink)', 'stroke-width': 3 });
  const word = s('text.pb-word', { x: CX, y: CY - 2, 'text-anchor': 'middle' });
  const count = s('text.pb-count', { x: CX, y: CY + 20, 'text-anchor': 'middle' });
  const gDots = s('g');
  svg.append(ring, disc, word, count, gDots);

  const roRate = readout('pace', { color: 'teal' });
  const roCycle = readout('one breath', { color: 'teal' });
  const note = h('p.pb-note', { 'aria-live': 'polite' });
  const rows = {};
  let go = null;

  const getState = () => ({
    inhale, exhale, cycle: inhale + exhale, rate: tidy(Math.round((60 / (inhale + exhale)) * 10) / 10, 1),
    longerExhale: exhale > inhale, breaths, running, done,
  });

  function render() {
    const cycle = inhale + exhale;
    const inPhase = t < inhale;
    let f;                                     // 0 = empty, 1 = full
    if (reducedMotion()) f = running ? (inPhase ? 1 : 0) : 0;
    else if (inPhase) f = 0.5 - 0.5 * Math.cos((Math.PI * t) / inhale);
    else f = 0.5 + 0.5 * Math.cos((Math.PI * (t - inhale)) / exhale);
    disc.setAttribute('r', (R_MIN + (R_MAX - R_MIN) * (running ? f : 0)).toFixed(1));
    if (running) {
      word.textContent = inPhase ? 'Breathe in' : 'Breathe out';
      count.textContent = String(Math.max(1, Math.ceil(inPhase ? inhale - t : cycle - t)));
    } else {
      word.textContent = `${inhale} s in`;
      count.textContent = `${exhale} s out`;
    }
    while (gDots.firstChild) gDots.removeChild(gDots.firstChild);
    for (let i = 0; i < round; i++) {
      gDots.appendChild(s('circle', { cx: CX - ((round - 1) * 18) / 2 + i * 18, cy: H - 16, r: 5.5, fill: i < breaths ? hue('teal') : 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2 }));
    }
    const st = getState();
    roRate.set(`${st.rate} breaths a minute`);
    roCycle.set(`${cycle} s`);
    if (go) {
      go.classList.toggle('is-on', running);
      go.setAttribute('aria-pressed', running ? 'true' : 'false');
      go.replaceChildren(icon(running ? 'pause' : 'play', 16), running ? 'Stop' : (done ? 'Breathe along again' : 'Breathe along (optional)'));
    }
    svg.setAttribute('aria-label', `${spec.alt || 'A breathing pacer'}. In for ${inhale} seconds, out for ${exhale} seconds: ${st.rate} breaths a minute.${running ? ` ${inPhase ? 'Breathe in' : 'Breathe out'}.` : ''}`);
  }

  const anim = loop((dt) => {
    const cycle = inhale + exhale;
    const before = t < inhale;
    t += dt;
    if (t >= cycle) {
      t -= cycle;
      breaths++;
      if (breaths >= round) {
        running = false; done = true; t = 0;
        anim.stop();
        note.textContent = `${round} slow breaths done.`;
        env.announce(note.textContent);
        render();
        env.onChange(getState());
        return;
      }
      env.onChange(getState());
    }
    if (before !== (t < inhale)) env.announce(t < inhale ? 'Breathe in' : 'Breathe out');
    render();
  });

  function toggle() {
    if (running) { running = false; anim.stop(); t = 0; note.textContent = ''; }
    else { running = true; breaths = 0; t = 0; note.textContent = 'Follow the circle gently, through the nose if that is comfortable. Stop if you feel dizzy or uneasy, or whenever you like.'; anim.start(); }
    render();
    env.onChange(getState());
  }

  if (!env.compact && !spec.static) {
    fr.readouts.append(roRate.el, roCycle.el);
    const meta = { inhale: { label: 'breathe in for', color: 'blue' }, exhale: { label: 'breathe out for', color: 'teal' } };
    for (const key of ['inhale', 'exhale']) {
      if (!ranges[key]) continue;
      const [lo, hi, st] = ranges[key];
      rows[key] = sliderRow({
        label: meta[key].label, min: lo, max: hi, step: st || 1, value: clamp(key === 'inhale' ? inhale : exhale, lo, hi), unit: 's', color: meta[key].color,
        onInput: (v) => {
          if (readOnly) return;
          if (key === 'inhale') inhale = v; else exhale = v;
          if (running) { t = 0; }
          render();
          env.onChange(getState());
        },
      });
      fr.controls.appendChild(rows[key].el);
    }
    // not a <button>: the loader disables buttons once a step is answered, and this one should keep working
    go = h('div.pb-go', { role: 'button', tabindex: '0', 'aria-pressed': 'false' });
    go.dataset.keys = 'own';
    go.addEventListener('click', toggle);
    go.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); toggle(); } });
    fr.buttons.appendChild(go);
    fr.el.appendChild(note);
  }
  render();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.inhale === 'number') { inhale = next.inhale; if (rows.inhale) rows.inhale.set(inhale); }
      if (typeof next.exhale === 'number') { exhale = next.exhale; if (rows.exhale) rows.exhale.set(exhale); }
      if (typeof next.breaths === 'number') breaths = next.breaths;
      if (next.done != null) done = !!next.done;
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in rows) rows[key].setDisabled(readOnly);
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'paced-breathing — set a pace and follow it', spec: { type: 'paced-breathing', inhale: 3, exhale: 3, inhaleRange: [2, 6, 1], exhaleRange: [2, 8, 1], breaths: 6 } },
];
