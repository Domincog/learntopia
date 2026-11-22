/**
 * schedule-lab — schedules of reinforcement on a simulated pigeon pecking a
 * key. The learner picks a schedule, trains the bird for two minutes, then
 * stops the rewards and sees how long the pecking goes on. Each run is drawn
 * as a cumulative record (the classic way: time across, total pecks up, a
 * tick for every reward), and runs stay on the chart for comparison.
 *
 *   'crf'  every peck is rewarded
 *   'fr'   fixed ratio: every 10th peck
 *   'vr'   variable ratio: on average every 10th peck, unpredictably (after 1 to 31 pecks)
 *   'fi'   fixed interval: the first peck after 10 seconds
 *   'vi'   variable interval: the first peck after a wait that averages 10 seconds (2 to 18)
 *
 * {
 *   type: 'schedule-lab',
 *   schedules: ['crf', 'fr', 'vr', 'fi', 'vi'],   // which are offered
 *   start: 'crf',                                 // the one selected at first
 * }
 *
 * The model (a deliberate simplification; real birds are noisier):
 *   - while rewards come, each schedule has its textbook pattern of pecking: steady and fast on VR, a pause
 *     after each reward on FR, a slow start and a rush towards the end of each interval on FI, steady and
 *     moderate on VI, and one peck per reward on CRF, with time out to eat;
 *   - after the rewards stop, the bird goes on until it has pecked three times as many unrewarded pecks in a
 *     row as it ever did during training (at least 5), slowing down towards the end. A bird that was always
 *     rewarded notices the change at once; a bird used to long dry runs cannot tell that anything has changed.
 *
 * State: { schedule, trained, stopped, rate, after, most }
 *   schedule  the one selected
 *   trained   ids of the schedules that have been run, in the order they were run
 *   stopped   ids of those whose rewards have been stopped
 *   rate      { id: pecks per minute during training } for trained schedules
 *   after     { id: pecks made after the rewards stopped } for stopped schedules
 *   most      the id with the largest `after` (null when none)
 *
 * setState accepts { schedule, trained: [...], stopped: [...] } (a stopped schedule counts as trained).
 */
import { frame, button, readout, hue, s, h, cx, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('schedule-lab', `
  .widget-schedule-lab .sl-pick { display: flex; flex-wrap: wrap; gap: var(--s2); justify-content: center; }
  .widget-schedule-lab .sl-pick .btn { white-space: normal; text-align: center; }
  .widget-schedule-lab .sl-pick .btn[aria-pressed='true'] { background: var(--ink); color: var(--surface); }
  .widget-schedule-lab .sl-note { margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); min-height: 1.4em; }
`);

const W = 560;
const H = 320;
const TRAIN = 120; // seconds
const T_MAX = 210;
const N_MAX = 360;
export const SCHEDULE_INFO = {
  crf: { tag: 'every', label: 'Every peck', color: 'gray' },
  fr: { tag: 'FR', label: 'Every 10th peck', color: 'green' },
  vr: { tag: 'VR', label: 'About every 10th, unpredictably', color: 'orange' },
  fi: { tag: 'FI', label: 'First peck after 10 s', color: 'blue' },
  vi: { tag: 'VI', label: 'After about 10 s, unpredictably', color: 'violet' },
};
const VR_LIST = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 22, 31]; // mean 10
const VI_LIST = [2, 5, 8, 10, 12, 15, 18]; // mean 10

/**
 * Simulate one schedule. `order` gives the shuffled VR and VI lists.
 * Returns { pecks: [times], rewards: [times], rate, maxRun, after, quit: [times of unrewarded pecks after training] }.
 */
export function simulate(id, order = { vr: VR_LIST, vi: VI_LIST }) {
  const pecks = [];
  const rewards = [];
  let t = 0;
  let run = 0;
  let maxRun = 0;
  const peck = (rewarded) => { pecks.push(t); run++; if (rewarded) { rewards.push(t); maxRun = Math.max(maxRun, run); run = 0; } };
  if (id === 'crf') {
    while (t + 1 <= TRAIN) { t += 1; peck(true); t += 2; }
  } else if (id === 'fr') {
    let k = 0;
    while (t + 0.5 <= TRAIN) { t += 0.5; k++; const hit = k % 10 === 0; peck(hit); if (hit) t += 4; }
  } else if (id === 'vr') {
    let i = 0;
    let need = order.vr[0];
    while (t + 0.4 <= TRAIN) { t += 0.4; need--; const hit = need === 0; peck(hit); if (hit) { i++; need = order.vr[i % order.vr.length]; t += 1; } }
  } else if (id === 'fi') {
    let from = 0;
    for (;;) {
      let stop = false;
      for (let k = 1; k <= 8; k++) {
        const at = from + 10 * Math.pow(k / 8, 1 / 2.5);
        if (at > TRAIN) { stop = true; break; }
        t = at;
        peck(k === 8);
      }
      if (stop) break;
      from = t + 1;
    }
  } else {
    let i = 0;
    let ready = order.vi[0];
    while (t + 1 <= TRAIN) { t += 1; const hit = t >= ready; peck(hit); if (hit) { i++; ready = t + order.vi[i % order.vi.length]; } }
  }
  const trained = pecks.length;
  const after = Math.max(5, 3 * maxRun);
  const gap = { crf: 1, fr: 0.5, vr: 0.4, fi: 0.7, vi: 1 }[id];
  const quit = [];
  let q = TRAIN;
  for (let k = 1; k <= after; k++) { q += gap * (1 + 2 * Math.pow(k / after, 3)); quit.push(q); }
  return { pecks, rewards, rate: Math.round(trained / (TRAIN / 60)), maxRun, after, quit };
}

export default function create(spec, env) {
  const offered = (Array.isArray(spec.schedules) ? spec.schedules : Object.keys(SCHEDULE_INFO)).filter((k) => SCHEDULE_INFO[k]);
  const order = { vr: env.rng.shuffle(VR_LIST), vi: env.rng.shuffle(VI_LIST) };
  const sims = {};
  for (const id of offered) sims[id] = simulate(id, order);
  let schedule = offered.includes(spec.start) ? spec.start : offered[0];
  let trained = [];
  let stopped = [];
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Cumulative records of pecking' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const note = h('p.sl-note', { 'aria-live': 'polite' });
  const rateOut = readout('pecks per minute while rewarded', { digits: 0 });
  const afterOut = readout('pecks after the rewards stopped', { digits: 0, color: 'orange' });
  fr.readouts.append(rateOut.el, afterOut.el);
  const pick = h('div.sl-pick', { role: 'group', 'aria-label': 'Schedule' });
  fr.controls.append(pick);
  fr.el.insertBefore(note, fr.readouts);

  const getState = () => {
    const rate = {};
    const after = {};
    for (const id of trained) rate[id] = sims[id].rate;
    for (const id of stopped) after[id] = sims[id].after;
    const most = stopped.length ? stopped.reduce((a, b) => (sims[b].after > sims[a].after ? b : a)) : null;
    return { schedule, trained: trained.slice(), stopped: stopped.slice(), rate, after, most };
  };

  const x0 = 46;
  const x1 = W - 54;
  const y0 = H - 34;
  const y1 = 16;
  const sx = (t) => x0 + (t / T_MAX) * (x1 - x0);
  const sy = (n) => y0 - (n / N_MAX) * (y0 - y1);

  function draw() {
    g.replaceChildren();
    for (const n of [0, 100, 200, 300]) {
      g.append(s('line', { x1: x0, x2: x1, y1: sy(n), y2: sy(n), stroke: 'var(--hair)', 'stroke-width': n ? 1 : 2 }));
      g.append(s('text', { class: 'tick-label', x: x0 - 6, y: sy(n) + 4, 'text-anchor': 'end' }, String(n)));
    }
    for (const t of [0, 60, 120, 180]) g.append(s('text', { class: 'tick-label', x: sx(t), y: y0 + 16, 'text-anchor': 'middle' }, `${t / 60} min`));
    g.append(s('text', { class: 'fig-label-sm', x: x0 - 34, y: 12 }, 'total pecks'));
    if (stopped.length) {
      g.append(s('line', { x1: sx(TRAIN), x2: sx(TRAIN), y1, y2: y0, stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
      g.append(s('text', { class: 'fig-label-sm', x: sx(TRAIN) + 6, y: y1 + 12 }, 'rewards stop'));
    }
    const ends = [];
    for (const id of trained) {
      const sim = sims[id];
      const color = hue(SCHEDULE_INFO[id].color);
      const current = id === schedule;
      let d = `M${sx(0).toFixed(1)} ${sy(0).toFixed(1)}`;
      sim.pecks.forEach((t, i) => { d += `H${sx(t).toFixed(1)}V${sy(i + 1).toFixed(1)}`; });
      let endT = TRAIN;
      let endN = sim.pecks.length;
      d += `H${sx(TRAIN).toFixed(1)}`;
      if (stopped.includes(id)) {
        sim.quit.forEach((t, i) => { d += `H${sx(t).toFixed(1)}V${sy(sim.pecks.length + i + 1).toFixed(1)}`; });
        endT = Math.min(T_MAX, sim.quit[sim.quit.length - 1] + 22);
        endN += sim.quit.length;
        d += `H${sx(endT).toFixed(1)}`;
      }
      g.append(s('path', { d, fill: 'none', stroke: color, 'stroke-width': current ? 3.5 : 2.5, 'stroke-linejoin': 'round', opacity: current ? 1 : 0.75 }));
      if (current) sim.rewards.forEach((t) => { const n = sim.pecks.indexOf(t) + 1; g.append(s('line', { x1: sx(t), y1: sy(n), x2: sx(t) + 5, y2: sy(n) + 7, stroke: 'var(--ink)', 'stroke-width': 1.5 })); });
      ends.push({ id, x: sx(endT), y: sy(endN) });
    }
    // end labels, moved apart when they would collide
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
    for (const e of ends) g.append(s('text', { class: 'fig-label-sm', x: e.x + 5, y: Math.min(y0 - 2, e.y + 4), style: e.id === schedule ? 'font-weight:800' : '' }, SCHEDULE_INFO[e.id].tag));

    const st = getState();
    rateOut.set(trained.includes(schedule) ? sims[schedule].rate : '–');
    afterOut.set(stopped.includes(schedule) ? sims[schedule].after : '–');
    for (const btn of pick.children) btn.setAttribute('aria-pressed', String(btn.dataset.id === schedule));
    trainBtn.disabled = readOnly || trained.includes(schedule);
    stopBtn.disabled = readOnly || !trained.includes(schedule) || stopped.includes(schedule);
    note.textContent = !trained.includes(schedule) ? `${SCHEDULE_INFO[schedule].label}: not run yet.`
      : !stopped.includes(schedule) ? 'Trained. Each small tick on the line is a reward. Now stop the rewards.'
        : `After the rewards stopped, the bird pecked ${sims[schedule].after} more times before giving up.`;
    svg.setAttribute('aria-label', `${spec.alt || 'Cumulative records of pecking'}. ${trained.map((id) => `${SCHEDULE_INFO[id].label}: ${sims[id].rate} pecks a minute${stopped.includes(id) ? `, ${sims[id].after} pecks after the rewards stopped` : ''}`).join('. ')}`);
    return st;
  }

  const trainBtn = button('Train for 2 minutes', () => {
    if (readOnly || trained.includes(schedule)) return;
    trained.push(schedule);
    play('tick');
    env.onChange(draw());
  }, { icon: 'play', variant: 'primary' });
  const stopBtn = button('Stop the rewards', () => {
    if (readOnly || !trained.includes(schedule) || stopped.includes(schedule)) return;
    stopped.push(schedule);
    play('pop');
    const st = draw();
    env.announce(note.textContent);
    env.onChange(st);
  });
  const clearBtn = button('Clear', () => { if (readOnly) return; trained = []; stopped = []; env.onChange(draw()); }, { icon: 'reset' });
  fr.buttons.append(trainBtn, stopBtn, clearBtn);
  for (const id of offered) {
    const btn = h('button', { type: 'button', class: cx('btn btn-sm'), dataset: { id } }, `${SCHEDULE_INFO[id].tag === 'every' ? '' : `${SCHEDULE_INFO[id].tag}: `}${SCHEDULE_INFO[id].label}`);
    btn.addEventListener('click', () => { if (readOnly) return; schedule = id; env.onChange(draw()); });
    pick.append(btn);
  }
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      const ok = (list) => (Array.isArray(list) ? list.filter((id) => offered.includes(id)) : []);
      if (next.trained || next.stopped) {
        stopped = ok(next.stopped);
        trained = [...new Set([...ok(next.trained), ...stopped])];
      }
      if (offered.includes(next.schedule)) schedule = next.schedule;
      else if (stopped.length) schedule = stopped[stopped.length - 1];
      draw();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); draw(); },
  };
}

export const examples = [
  { title: 'schedule-lab — five schedules', spec: { type: 'schedule-lab' } },
  { title: 'schedule-lab — every peck against variable ratio', spec: { type: 'schedule-lab', schedules: ['crf', 'vr'] } },
];
