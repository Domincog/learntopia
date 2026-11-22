/**
 * outbreak-sim — an infection passing through a town, round by round. Each
 * dot is a person. A few arrive infected; every infected person meets some
 * others at random and infects those who are still susceptible, and then
 * recovers. A bar chart beside the town counts the new cases of each round.
 * Three things can be changed: how many people one case infects in a town
 * where nobody is immune (R0), how much of the spread is cut by everyday
 * measures, and how many people are vaccinated.
 *
 * {
 *   type: 'outbreak-sim',
 *   people: 300,                     // size of the town (20 dots per row)
 *   seeds: 3,                        // infected people at the start (never vaccinated ones)
 *   r0: 3,                           // people one case infects, on average, when everyone else is susceptible
 *   vaccinated: 0,                   // share of the town that is immune from the start (0 to 0.95)
 *   cut: 0,                          // share of the spread prevented by other measures (0 to 0.9)
 *   r0Range: [1, 6, 0.5],            // optional sliders: [min, max, step]
 *   vaccinatedRange: [0, 0.95, 0.05],
 *   cutRange: [0, 0.8, 0.1],
 *   labels: { r0: 'one case infects', vaccinated: 'vaccinated', cut: 'spread cut by' },   // slider captions
 *   maxRounds: 40,
 *   static: false,                   // true: a picture without controls
 * }
 *
 * State: { r0, vaccinated, cut, re, ran, runs, last, history }
 *   re      — r0 × (1 − cut) × (1 − vaccinated): how many people one case infects at the START with these
 *             settings (rounded to 2 decimals). Below 1 an outbreak cannot grow.
 *   ran     — an outbreak has been run to its end with the current settings
 *   runs    — outbreaks run so far
 *   last    — the outbreak on show: { infected, rounds, peak, unvaccinated, escaped } or null.
 *             infected counts everyone who caught it (the first cases included); escaped is how many
 *             unvaccinated people never caught it.
 *   history — one entry per finished outbreak: { r0, vaccinated, cut, re, infected }
 * Who meets whom is random (env.rng), so `last` and the numbers in `history` differ from run to run:
 * write checks about the settings, `re`, `ran` and `runs` only.
 *
 * setState({ r0, vaccinated, cut, history }) sets the sliders and shows a finished outbreak;
 * { ran: false } only sets the sliders. `history` may list earlier runs by their settings alone.
 *
 * The model. Rounds are generations of the infection. An infected person meets Poisson(r0 × (1 − cut))
 * people picked at random from the whole town, and each of them is infected if still susceptible. The
 * vaccine is treated as fully protective and immunity as lasting, there are no age groups or households,
 * and everybody mixes with everybody: real outbreaks are lumpier.
 */
import { frame, sliderRow, button, readout, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 262;
const COLS = 20;
const PITCH = 14;
const GX = 12;           // the town
const GY = 34;
const CX0 = 346;         // the chart
const CX1 = 546;
const CY0 = 44;
const CY1 = 212;
const ROUND_MS = 380;

const SUS = 0;
const VAC = 1;
const NOW = 2;
const HAD = 3;

addStyles('outbreak-sim', `
  .widget-outbreak-sim .ob-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s1) var(--s4); font-size: var(--fs-sm); font-weight: 700; }
  .widget-outbreak-sim .ob-key { display: inline-flex; align-items: center; gap: 0.4rem; }
  .widget-outbreak-sim .ob-key svg { flex: none; width: 16px; height: 16px; }
  .widget-outbreak-sim .ob-note { min-height: 2.7em; margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); text-wrap: balance; }
  @container wcanvas (max-width: 470px) { .widget-outbreak-sim .ob-count { display: none; } }
`);

/** How a person in a given state is drawn. */
function look(state) {
  if (state === VAC) return { size: 9, rx: 2, fill: hue('blue', 'soft'), stroke: hue('blue'), sw: 1.5 };
  if (state === NOW) return { size: 11, rx: 5.5, fill: hue('red'), stroke: 'var(--ink)', sw: 2 };
  if (state === HAD) return { size: 9, rx: 4.5, fill: hue('orange'), stroke: 'var(--edge-strong)', sw: 1 };
  return { size: 8, rx: 4, fill: hue('gray', 'soft'), stroke: hue('gray'), sw: 1 };
}

function swatch(state) {
  const k = look(state);
  return s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' },
    s('rect', { x: 8 - k.size / 2, y: 8 - k.size / 2, width: k.size, height: k.size, rx: k.rx, fill: k.fill, stroke: k.stroke, 'stroke-width': k.sw }));
}

/** The reproduction number at the start of an outbreak with these settings. */
export const effectiveR = (r0, vaccinated = 0, cut = 0) => r0 * (1 - cut) * (1 - vaccinated);

export default function create(spec, env) {
  const N = clamp(Math.round(spec.people || 300), 60, 400);
  const rows = Math.ceil(N / COLS);
  const seeds = clamp(Math.round(spec.seeds || 3), 1, 10);
  const maxRounds = clamp(Math.round(spec.maxRounds || 40), 5, 80);
  const isStatic = !!spec.static || !!env.compact;
  const keys = ['r0', 'vaccinated', 'cut'];
  const defaults = { r0: 3, vaccinated: 0, cut: 0 };
  const limits = { r0: [0, 20], vaccinated: [0, 0.95], cut: [0, 0.9] };
  const captions = { r0: 'one case infects', vaccinated: 'vaccinated', cut: 'spread cut by', ...(spec.labels || {}) };
  const set = {};
  const ranges = {};
  for (const key of keys) {
    ranges[key] = !isStatic && Array.isArray(spec[`${key}Range`]) ? spec[`${key}Range`] : null;
    const [lo, hi] = ranges[key] || limits[key];
    set[key] = clamp(typeof spec[key] === 'number' ? spec[key] : defaults[key], lo, hi);
  }
  const initial = { ...set };
  let readOnly = !!env.readOnly;

  // A fixed random order of the people: the first ones in it are the vaccinated, the last ones the first cases.
  const order = env.rng.shuffle(Array.from({ length: N }, (_, i) => i));
  let status = new Uint8Array(N);
  let counts = [];              // new cases per round; counts[0] are the first cases
  let wave = [];                // who is infectious now
  let ran = false;
  let running = false;
  let timer = 0;
  let history = [];
  let last = null;

  const re = () => tidy(effectiveR(set.r0, set.vaccinated, set.cut), 2);
  const vaccinatedCount = () => Math.min(N - seeds, Math.round(N * set.vaccinated));

  function poisson(lambda) {
    if (lambda <= 0) return 0;
    const limit = Math.exp(-lambda);
    let k = 0;
    let p = env.rng.next();
    while (p > limit && k < 200) { k++; p *= env.rng.next(); }
    return k;
  }

  /** The town before anything has happened. */
  function prepare() {
    status = new Uint8Array(N);
    const nv = vaccinatedCount();
    for (let i = 0; i < nv; i++) status[order[i]] = VAC;
    wave = [];
    for (let i = 0; i < seeds; i++) { const who = order[N - 1 - i]; status[who] = NOW; wave.push(who); }
    counts = [seeds];
    last = null;
  }

  /** One generation: returns false when nobody is infectious any more. */
  function round() {
    const lambda = set.r0 * (1 - set.cut);
    const next = [];
    for (const who of wave) {
      const meets = poisson(lambda);
      for (let j = 0; j < meets; j++) {
        let other = env.rng.int(0, N - 2);
        if (other >= who) other++;
        if (status[other] === SUS) { status[other] = NOW; next.push(other); }
      }
    }
    for (const who of wave) status[who] = HAD;
    wave = next;
    if (next.length) counts.push(next.length);
    return next.length > 0 && counts.length <= maxRounds;
  }

  function summary() {
    let had = 0;
    let sus = 0;
    for (let i = 0; i < N; i++) { if (status[i] === HAD || status[i] === NOW) had++; else if (status[i] === SUS) sus++; }
    return { infected: had, rounds: counts.length - 1, peak: Math.max(...counts), unvaccinated: N - vaccinatedCount(), escaped: sus };
  }

  /* ------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A town of dots and a chart of new cases in each round of an outbreak' });
  const { svg } = fr;
  svg.appendChild(s('text.axis-label', { x: GX, y: 20 }, `A town of ${N} people`));
  svg.appendChild(s('text.axis-label', { x: CX0, y: 20 }, 'New cases in each round'));
  const dots = [];
  const shown = new Int8Array(N).fill(-1);
  for (let i = 0; i < N; i++) { const el = s('rect'); dots.push(el); svg.appendChild(el); }
  svg.appendChild(s('line', { x1: CX0, x2: CX1, y1: CY1, y2: CY1, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  svg.appendChild(s('line', { x1: CX0, x2: CX0, y1: CY0 - 6, y2: CY1, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  const yTop = s('text.tick-label', { x: CX0 - 6, y: CY0 + 4, 'text-anchor': 'end' });
  svg.appendChild(yTop);
  svg.appendChild(s('text.tick-label', { x: CX0 - 6, y: CY1 + 4, 'text-anchor': 'end' }, '0'));
  svg.appendChild(s('text.axis-label', { x: (CX0 + CX1) / 2, y: CY1 + 30, 'text-anchor': 'middle' }, 'round'));
  const gBars = s('g');
  const topLine = s('line.grid-line', { x1: CX0, x2: CX1, y1: CY0, y2: CY0 });
  svg.append(topLine, gBars);

  const roR = readout('one case now infects', { color: 'violet' });
  const roTotal = readout('caught it', { color: 'red' });
  const note = h('p.ob-note', { 'aria-live': 'polite' });
  const legend = h('div.ob-legend',
    h('span.ob-key', swatch(SUS), 'can catch it'),
    h('span.ob-key', swatch(VAC), 'vaccinated'),
    h('span.ob-key', swatch(NOW), 'infectious now'),
    h('span.ob-key', swatch(HAD), 'has had it'));

  const pct = (v) => `${formatNumber(v * 100, 0)}%`;

  function render() {
    for (let i = 0; i < N; i++) {
      if (shown[i] === status[i]) continue;
      shown[i] = status[i];
      const k = look(status[i]);
      const el = dots[i];
      const x = GX + (i % COLS) * PITCH + (PITCH - k.size) / 2;
      const y = GY + Math.floor(i / COLS) * PITCH + (PITCH - k.size) / 2;
      el.setAttribute('x', x); el.setAttribute('y', y);
      el.setAttribute('width', k.size); el.setAttribute('height', k.size); el.setAttribute('rx', k.rx);
      el.setAttribute('fill', k.fill); el.setAttribute('stroke', k.stroke); el.setAttribute('stroke-width', k.sw);
    }
    // the chart
    while (gBars.firstChild) gBars.removeChild(gBars.firstChild);
    const slots = Math.max(10, counts.length);
    const peak = Math.max(10, ...counts);
    const yMax = peak <= 10 ? 10 : Math.ceil(peak / 20) * 20;
    yTop.textContent = String(yMax);
    const bw = (CX1 - CX0 - 6) / slots;
    counts.forEach((c, i) => {
      const hgt = (c / yMax) * (CY1 - CY0);
      const x = CX0 + 4 + i * bw;
      gBars.appendChild(s('rect', { x: x + 1, y: CY1 - hgt, width: Math.max(2, bw - 2), height: hgt, rx: Math.min(3, bw / 4), fill: hue('red'), stroke: 'var(--edge-strong)', 'stroke-width': 1.5 }));
      if (slots <= 14) gBars.appendChild(s('text.tick-label.ob-count', { x: x + bw / 2, y: CY1 - hgt - 4, 'text-anchor': 'middle' }, String(c)));
    });
    const every = slots <= 20 ? 2 : 5;
    for (let i = 0; i < slots; i += every) gBars.appendChild(s('text.tick-label', { x: CX0 + 4 + i * bw + bw / 2, y: CY1 + 15, 'text-anchor': 'middle' }, String(i)));

    const sum = summary();
    roR.set(formatNumber(re(), 2));
    roTotal.set(`${sum.infected} of ${N}`);
    const settings = `One case infects ${formatNumber(set.r0, 1)} in a town with no immunity; ${pct(set.vaccinated)} vaccinated; spread cut by ${pct(set.cut)}.`;
    svg.setAttribute('aria-label', `${spec.alt || 'A town of dots and a chart of new cases in each round of an outbreak'}. ${settings}${ran && !running ? ` ${describe()}` : ''}`);
    if (goBtn) { goBtn.lastChild.textContent = ran && !running ? 'Run it again' : 'Start the outbreak'; goBtn.disabled = readOnly || running; }
  }

  function describe() {
    const sum = last || summary();
    const went = sum.rounds === 0 ? 'The first cases infected nobody' : `It ended after ${sum.rounds} round${sum.rounds === 1 ? '' : 's'}`;
    const spared = sum.unvaccinated - sum.infected;
    const tail = set.vaccinated > 0
      ? ` Of the ${sum.unvaccinated} unvaccinated people, ${spared} never caught it.`
      : ` ${spared} people never caught it.`;
    return `${went}: ${sum.infected} of ${N} people caught it.${tail}`;
  }

  /* ------------------------------------------------------------ controls */
  const sliders = {};
  let goBtn = null;
  const stop = () => { clearTimeout(timer); timer = 0; running = false; };
  const reset = () => { stop(); ran = false; prepare(); note.textContent = ''; render(); };

  if (!isStatic) {
    const meta = {
      r0: { color: 'red', format: (v) => `${formatNumber(v, 1)} ${v === 1 ? 'person' : 'people'}` },
      vaccinated: { color: 'blue', format: pct, scale: 100 },
      cut: { color: 'green', format: pct, scale: 100 },
    };
    for (const key of keys) {
      if (!ranges[key]) continue;
      const [lo, hi, st] = ranges[key];
      const k = meta[key].scale || 1;
      sliders[key] = sliderRow({
        label: captions[key], min: lo * k, max: hi * k, step: (st || 1) * k, value: set[key] * k, color: meta[key].color,
        format: (v) => meta[key].format(v / k),
        onInput: (v) => { if (readOnly) return; set[key] = tidy(v / k, 4); reset(); env.onChange(getState()); },
      });
      fr.controls.appendChild(sliders[key].el);
    }
    fr.readouts.append(roR.el, roTotal.el);
    goBtn = button('Start the outbreak', () => go(true), { icon: 'play', variant: 'primary' });
    fr.buttons.appendChild(goBtn);
    fr.el.insertBefore(legend, fr.readouts);
    fr.el.appendChild(note);
  } else if (!env.compact) {
    fr.el.appendChild(legend);
  }

  function finish(notify) {
    stop();
    ran = true;
    last = summary();
    history.push({ ...set, re: re(), infected: last.infected });
    render();
    note.textContent = describe();
    if (notify) {
      play('tick');
      env.announce(note.textContent);
      env.onChange(getState());
    }
  }

  function go(notify) {
    if (notify && readOnly) return;
    stop();
    ran = false;
    prepare();
    note.textContent = '';
    if (!notify || reducedMotion()) {
      while (round()) { /* run to the end */ }
      finish(notify);
      return;
    }
    running = true;
    render();
    const tick = () => {
      const more = round();
      if (!more) { finish(true); return; }
      render();
      timer = setTimeout(tick, ROUND_MS);
    };
    timer = setTimeout(tick, ROUND_MS);
  }

  function getState() {
    return {
      r0: set.r0, vaccinated: set.vaccinated, cut: set.cut,
      re: re(),
      ran: ran && !running,
      runs: history.length,
      last: ran && !running && last ? { ...last } : null,
      history: history.map((r) => ({ ...r })),
    };
  }

  prepare();
  if (isStatic && spec.show === 'end') { while (round()) { /* run to the end */ } ran = true; last = summary(); }
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      stop();
      const apply = (values) => {
        for (const key of keys) {
          if (typeof values[key] !== 'number') continue;
          const [lo, hi] = ranges[key] || limits[key];
          set[key] = clamp(values[key], lo, hi);
        }
      };
      if (Array.isArray(next.history)) {
        // earlier runs are given by their settings: play each one through so that the log is complete
        history = [];
        for (const run of next.history) {
          for (const key of keys) set[key] = initial[key];
          apply(run);
          prepare();
          while (round()) { /* run to the end */ }
          history.push({ ...set, re: re(), infected: summary().infected });
        }
        if (typeof next.r0 !== 'number' && typeof next.vaccinated !== 'number' && typeof next.cut !== 'number' && history.length) {
          apply(history[history.length - 1]);
          history.pop();
        }
      }
      apply(next);
      for (const key of keys) if (sliders[key]) sliders[key].set(set[key] * (key === 'r0' ? 1 : 100));
      if (next.ran === false) { ran = false; prepare(); note.textContent = ''; render(); return; }
      go(false);
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliders) sliders[key].setDisabled(readOnly);
      if (readOnly && running) { while (round()) { /* run to the end */ } finish(false); }
      render();
    },
    destroy() { stop(); },
  };
}

export const examples = [
  { title: 'outbreak-sim — how far does it spread?', spec: { type: 'outbreak-sim', r0: 2, r0Range: [0.5, 6, 0.5] } },
  { title: 'outbreak-sim — cut the spread', spec: { type: 'outbreak-sim', r0: 2.5, cutRange: [0, 0.8, 0.1] } },
  { title: 'outbreak-sim — vaccinate the town', spec: { type: 'outbreak-sim', r0: 4, vaccinatedRange: [0, 0.95, 0.05] } },
];
