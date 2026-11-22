/**
 * tour-builder — the travelling salesman problem on a small map. The learner
 * taps the towns in the order a round trip should visit them; every leg is
 * drawn with its length, and when the last town is in, the trip closes back
 * to the start and the total is shown.
 *
 * The distance between two towns is the straight-line distance on the
 * picture, divided by `scale` and rounded to a whole number, so that sums
 * can be checked by hand.
 *
 * Modes
 *   'free'     any order. Tap the last town again to take it out, or an earlier town to cut the trip back to it.
 *   'nearest'  the nearest-neighbour rule, carried out by hand: dashed lines show the distance from the
 *              current town to every town not visited yet, and only a nearest one is accepted
 *              (a tie may be broken either way). No choice can be taken back; "Start again" clears the trip.
 *   'view'     a picture of `tour`.
 *
 * {
 *   type: 'tour-builder',
 *   towns: { A: [160, 140], B: [40, 140], … },   // id (one letter) -> [x, y] in a 560 × `height` box
 *   start: 'A',
 *   scale: 10,                // picture units per unit of distance
 *   unit: 'km',
 *   mode: 'free',
 *   tour: ['A', 'C', 'B'],    // towns already on the trip (view mode: the trip to draw)
 *   height: 320,
 * }
 *
 * State: { tour, visited, complete, length, legs, greedy, mistakes }
 *   tour      the towns in the order visited, start first
 *   visited   how many that is
 *   complete  every town is on the trip (the leg back to the start is then included)
 *   length    total length of the legs drawn so far
 *   legs      their lengths, in order
 *   greedy    every leg so far went to a nearest town not yet visited
 *   mistakes  nearest mode: refused taps
 *
 * setState accepts { tour: ['A', 'B', 'C', …] }.
 */
import { frame, readout, button, hue, s, h, cx, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('tour-builder', `
  .widget-tour-builder .w-canvas svg { touch-action: manipulation; }
  .widget-tour-builder .tb-town { outline: none; }
  .widget-tour-builder .tb-town.is-tap { cursor: pointer; }
  .widget-tour-builder .tb-town:focus-visible .tb-disc { stroke: var(--focus); stroke-width: 5; }
  .widget-tour-builder .tb-town.is-nope .tb-inner { animation: shake 0.4s ease; }
  .widget-tour-builder.is-readonly .tb-town { pointer-events: none; }
  .widget-tour-builder .tb-status { min-height: 2.9em; display: grid; align-content: center; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-tour-builder .tb-status.is-good { color: var(--green-text); }
  .widget-tour-builder .tb-status.is-bad { color: var(--red-text); }
  .widget-tour-builder .btn-ghost { box-shadow: none; }
`);

/** Distance between two towns in whole units. */
export const legLength = (towns, a, b, scale = 10) => Math.round(Math.hypot(towns[a][0] - towns[b][0], towns[a][1] - towns[b][1]) / scale);

/** Legs and total of a trip; the leg back to the first town is included once every town is on it. */
export function measure(towns, tour, scale = 10) {
  const all = Object.keys(towns);
  const complete = tour.length === all.length && all.length > 1;
  const legs = [];
  let greedy = true;
  for (let i = 1; i < tour.length; i++) {
    const d = legLength(towns, tour[i - 1], tour[i], scale);
    const open = all.filter((id) => !tour.slice(0, i).includes(id));
    if (open.some((id) => legLength(towns, tour[i - 1], id, scale) < d)) greedy = false;
    legs.push(d);
  }
  if (complete) legs.push(legLength(towns, tour[tour.length - 1], tour[0], scale));
  return { complete, legs, length: legs.reduce((a, b) => a + b, 0), greedy };
}

const W = 560;
const R = 18;

export default function create(spec, env) {
  const towns = spec.towns || {};
  const ids = Object.keys(towns);
  const start = towns[spec.start] ? spec.start : ids[0];
  const scale = Number(spec.scale) > 0 ? Number(spec.scale) : 10;
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const mode = ['free', 'nearest', 'view'].includes(spec.mode) ? spec.mode : 'free';
  const height = spec.height || 320;
  const interactive = mode !== 'view' && !env.compact;
  let readOnly = !!env.readOnly;
  let mistakes = 0;
  const d = (a, b) => legLength(towns, a, b, scale);

  const cleanTour = (list) => {
    const out = [start];
    for (const id of Array.isArray(list) ? list : []) {
      if (id === start && out.length === 1) continue;
      if (!towns[id] || out.includes(id)) break;
      out.push(id);
    }
    return out;
  };
  let tour = cleanTour(spec.tour);

  const getState = () => ({ tour: tour.slice(), visited: tour.length, ...measure(towns, tour, scale), mistakes });

  /* ---------------------------------------------------------------- scene */
  const fr = frame({ width: W, height, compact: env.compact, label: spec.alt || 'Towns on a map' });
  const { svg } = fr;
  const gHints = s('g');
  const gLegs = s('g');
  const gSigns = s('g');
  const gTowns = s('g');
  svg.append(gHints, gLegs, gSigns, gTowns);
  const townEls = {};
  for (const id of ids) {
    const [x, y] = towns[id];
    const disc = s('circle.tb-disc', { r: R, 'stroke-width': 3 });
    const letter = s('text.fig-label-lg', { y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, id);
    const note = s('text.fig-label-sm', { y: R + 16, 'text-anchor': 'middle' }, id === start ? 'depot' : '');
    const g = s('g.tb-town', { transform: `translate(${x} ${y})` }, s('g.tb-inner', disc, letter, note), s('circle', { r: R + 14, fill: 'transparent' }));
    if (interactive) {
      g.setAttribute('role', 'button');
      g.dataset.keys = 'own';
      g.addEventListener('click', () => tap(id));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); tap(id); } });
    }
    townEls[id] = { g, disc, letter };
    gTowns.appendChild(g);
  }

  const status = h('div.tb-status', { 'aria-live': 'polite' });
  const setStatus = (text, tone = '') => { status.textContent = text; status.className = cx('tb-status', tone && `is-${tone}`); };
  const roLength = readout('Trip so far', { digits: 0 });
  const roSeen = readout('Towns', { digits: 0 });
  const undoBtn = button('Undo', () => { if (readOnly || tour.length < 2 || mode !== 'free') return; tour.pop(); play('pop'); changed(prompt()); }, { icon: 'undo', variant: 'ghost' });
  const clearBtn = button(mode === 'nearest' ? 'Start again' : 'Clear', () => { if (readOnly) return; tour = [start]; mistakes = 0; play('pop'); changed(prompt()); }, { icon: 'reset', variant: 'ghost' });
  if (interactive) {
    fr.el.insertBefore(status, fr.readouts);
    fr.readouts.append(roLength.el, roSeen.el);
    if (mode === 'free') fr.buttons.appendChild(undoBtn);
    fr.buttons.appendChild(clearBtn);
  }

  function prompt() {
    const st = getState();
    if (st.complete) return `Round trip ${tour.join(' → ')} → ${start}: ${st.legs.join(' + ')} = ${st.length}${unit}.`;
    const here = tour[tour.length - 1];
    if (mode === 'nearest') return `You are in ${here}. Tap the nearest town you have not visited yet.`;
    return tour.length === 1 ? `The trip starts and ends at ${start}. Tap the town to visit first.` : `Trip so far: ${tour.join(' → ')}. Tap the next town.`;
  }

  let signs = []; // where numbers have been put in this drawing, so that the next one can keep clear of them
  /** The spot on the line (x1, y1)–(x2, y2) that stays clearest of the towns and of the numbers already drawn. */
  function clearSpot(x1, y1, x2, y2) {
    let best = null;
    for (const t of [0.5, 0.4, 0.6, 0.32, 0.68, 0.25, 0.75]) {
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      let room = Infinity;
      for (const id of ids) room = Math.min(room, Math.hypot(towns[id][0] - x, towns[id][1] - y) - R);
      for (const [sx, sy] of signs) room = Math.min(room, Math.hypot(sx - x, sy - y) - 14);
      if (room >= 20) return [x, y];
      if (!best || room > best[2]) best = [x, y, room];
    }
    return [best[0], best[1]];
  }
  function sign(x, y, text, muted) {
    signs.push([x, y]);
    const wide = String(text).length > 1 ? 32 : 26;
    gSigns.append(
      s('rect', { x: x - wide / 2, y: y - 12, width: wide, height: 24, rx: 8, fill: 'var(--surface)', stroke: muted ? 'var(--ink-3)' : hue('orange'), 'stroke-width': 2, 'stroke-dasharray': muted ? '4 3' : 'none' }),
      s('text.fig-label', { x, y: y + 5, 'text-anchor': 'middle', style: `stroke:none${muted ? ';fill:var(--ink-2)' : ''}` }, String(text)),
    );
  }

  function render() {
    const st = getState();
    gHints.replaceChildren();
    gLegs.replaceChildren();
    gSigns.replaceChildren();
    signs = [];
    const here = tour[tour.length - 1];
    if (mode === 'nearest' && !st.complete && !env.compact) {
      for (const id of ids) {
        if (tour.includes(id)) continue;
        const [x1, y1] = towns[here];
        const [x2, y2] = towns[id];
        gHints.appendChild(s('line', { x1, y1, x2, y2, stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }));
        // the number sits next to the town it belongs to, so that two lines in the same direction cannot be mixed up
        const span = Math.hypot(x2 - x1, y2 - y1) || 1;
        const back = Math.min(R + 24, span / 2);
        sign(x2 - ((x2 - x1) / span) * back, y2 - ((y2 - y1) / span) * back, d(here, id), true);
      }
    }
    const stops = st.complete ? [...tour, start] : tour;
    for (let i = 1; i < stops.length; i++) {
      const [x1, y1] = towns[stops[i - 1]];
      const [x2, y2] = towns[stops[i]];
      gLegs.appendChild(s('line', { x1, y1, x2, y2, stroke: hue('orange'), 'stroke-width': 6, 'stroke-linecap': 'round' }));
      const [sx, sy] = clearSpot(x1, y1, x2, y2);
      sign(sx, sy, st.legs[i - 1], false);
    }
    for (const id of ids) {
      const el = townEls[id];
      const at = tour.indexOf(id);
      const isHere = id === here && !st.complete && mode !== 'view';
      el.disc.setAttribute('fill', id === start ? hue('orange') : at >= 0 ? hue('orange', 'soft') : 'var(--surface)');
      el.disc.setAttribute('stroke', id === start ? 'var(--edge-strong)' : 'var(--ink)');
      el.disc.setAttribute('stroke-width', isHere ? 5.5 : 3);
      el.letter.setAttribute('style', id === start ? 'fill:#1D1B26' : '');
      if (interactive) {
        el.g.classList.toggle('is-tap', !readOnly);
        el.g.setAttribute('tabindex', readOnly ? '-1' : '0');
        let said = `Town ${id}`;
        if (id === start) said += ', the depot';
        if (at >= 0) said += `, stop ${at + 1} of the trip`;
        else if (mode === 'nearest' && !st.complete) said += `, ${d(here, id)} from ${here}`;
        el.g.setAttribute('aria-label', said);
      }
    }
    roLength.set(`${st.length}${unit}`);
    roSeen.set(`${tour.length} of ${ids.length}`);
    undoBtn.disabled = readOnly || tour.length < 2;
    clearBtn.disabled = readOnly || (tour.length < 2 && !mistakes);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Towns ${ids.join(', ')}. Trip so far: ${tour.join(', ')}${st.complete ? `, back to ${start}` : ''}. Length ${st.length}.`);
  }

  function changed(text, tone = '') {
    render();
    setStatus(text, tone);
    env.announce(text);
    env.onChange(getState());
  }

  function nope(id, text, counts) {
    const g = townEls[id].g;
    g.classList.remove('is-nope');
    void g.getBoundingClientRect();
    g.classList.add('is-nope');
    play('wrong');
    if (counts) mistakes++;
    setStatus(text, 'bad');
    env.announce(text);
    if (counts) env.onChange(getState());
  }

  function tap(id) {
    if (readOnly || !interactive) return;
    const here = tour[tour.length - 1];
    const at = tour.indexOf(id);
    if (mode === 'nearest') {
      if (at >= 0) { nope(id, `${id} has been visited. The rule only looks at towns that are still open.`, false); return; }
      const open = ids.filter((x) => !tour.includes(x));
      const best = Math.min(...open.map((x) => d(here, x)));
      if (d(here, id) > best) { nope(id, `${id} is ${d(here, id)}${unit} from ${here}. Another open town is nearer.`, true); return; }
      tour.push(id);
      play('drop');
      const st = getState();
      changed(st.complete ? `Every town is visited, so the trip goes back to ${start}. ${prompt()}` : prompt(), st.complete ? 'good' : '');
      return;
    }
    if (at >= 0) {
      if (tour.length < 2) { setStatus(prompt()); return; }
      if (id === here) tour.pop(); else tour = tour.slice(0, at + 1);
      play('pop');
      changed(prompt());
      return;
    }
    tour.push(id);
    play('drop');
    changed(prompt(), getState().complete ? 'good' : '');
  }

  render();
  setStatus(prompt(), getState().complete ? 'good' : '');
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.tour)) return;
      tour = cleanTour(next.tour);
      render();
      setStatus(prompt(), getState().complete ? 'good' : '');
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

const DEMO = { A: [160, 140], B: [40, 140], C: [130, 240], D: [400, 180], E: [310, 260], F: [350, 80], G: [520, 50] };

export const examples = [
  { title: 'tour-builder — find a short round trip', spec: { type: 'tour-builder', towns: DEMO, start: 'A', unit: 'km' } },
  { title: 'tour-builder — the nearest-neighbour rule by hand', spec: { type: 'tour-builder', towns: DEMO, start: 'A', unit: 'km', mode: 'nearest' } },
  { title: 'tour-builder — a finished trip', spec: { type: 'tour-builder', towns: DEMO, start: 'A', unit: 'km', mode: 'view', tour: ['A', 'B', 'C', 'E', 'D', 'G', 'F'] } },
];
