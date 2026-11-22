/**
 * effort-lab — one example adult from rest to all-out effort. A slider sets
 * how hard the body is working; a beating heart, breathing lungs, a speech
 * bubble (the "talk test") and a set of bars show what the heart, the lungs
 * and the fuel supply do about it. A switch can show the same person before
 * and after some months of endurance training.
 *
 * {
 *   type: 'effort-lab',
 *   scale: 'effort',          // what the slider sets:
 *                             //   'effort' — 0 to 100% of this person's own maximum (relative intensity)
 *                             //   'work'   — the work rate, as multiples of resting energy use (1 to 12):
 *                             //              the same job for the untrained and the trained body
 *   effort: 0,                // start value for scale 'effort' (0–100, steps of 5)
 *   work: 1,                  // start value for scale 'work' (1–12, steps of 0.5)
 *   person: 'before',         // 'before' | 'after' training
 *   compare: false,           // true: show the before / after switch
 *   show: ['heart', 'stroke', 'output', 'breath', 'fuel'],   // which bars appear
 *   talk: true,               // the speech bubble and the name of the intensity level
 *   static: false,            // true: a picture without controls
 * }
 *
 * State: { scale, person, effort, work, zone, talk, heartRate, stroke, output, breaths, energy, fatShare,
 *          fatUse, carbUse, beyond, zones, people }
 *   effort    — percent of this person's range between rest and maximum (0–100)
 *   work      — energy use as a multiple of rest ("METs"), one decimal
 *   zone      — 'rest' | 'light' | 'moderate' | 'vigorous' | 'max'
 *   talk      — 'sing' | 'talk' | 'words' | 'none': the talk test at this effort
 *   heartRate — beats a minute;  stroke — millilitres pumped per beat;  output — litres a minute
 *   breaths   — breaths a minute
 *   energy    — energy use as a multiple of rest (same as work);  fatShare — percent of it supplied by fat
 *   fatUse, carbUse — the two parts of `energy` (they add up to it)
 *   beyond    — scale 'work' only: the work rate asked for is more than this person can sustain
 *   zones     — the zones the learner has visited so far, in order of first visit
 *   people    — which of 'before' and 'after' have been looked at
 *
 * setState({ effort } or { work }, { person }, { zones }, { people }) restores a state.
 *
 * The model (exported as `physiology`). A 70 kg adult. Before training: resting
 * pulse 70, maximum 190, 70 mL per beat at rest and 100 mL at most, maximum
 * energy use 10 times rest. After training: resting pulse 58, maximum 188,
 * 85 mL and 120 mL per beat, maximum 12 times rest. Heart rate rises in a
 * straight line with the work rate; the volume per beat rises early and then
 * levels off; breathing speeds up gently and then sharply above about 60% of
 * the range; the share of fuel that is fat falls as effort rises. Intensity
 * levels follow the American College of Sports Medicine's bands of the range
 * between rest and maximum: light below 40%, moderate 40–59%, vigorous 60–89%,
 * near-maximal from 90%. Real bodies differ from this one and from each
 * other; the directions of the changes are what is general.
 */
import { frame, sliderRow, loop, hue, s, h, cx, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 150;

export const PEOPLE = {
  before: { label: 'Before training', restRate: 70, maxRate: 190, restStroke: 70, maxStroke: 100, maxWork: 10 },
  after: { label: 'After months of training', restRate: 58, maxRate: 188, restStroke: 85, maxStroke: 120, maxWork: 12 },
};
export const ZONES = {
  rest: { label: 'At rest', from: 0 },
  light: { label: 'Light effort', from: 5 },
  moderate: { label: 'Moderate effort', from: 40 },
  vigorous: { label: 'Vigorous effort', from: 60 },
  max: { label: 'Near-maximal effort', from: 90 },
};
const TALK = {
  sing: ['“I could sing', 'a whole song.”'],
  talk: ['“I can talk,', 'but not sing.”'],
  words: ['“Only… a few…', 'words…”'],
  none: ['(cannot spare', 'the breath to talk)'],
};
const ZONE_TALK = { rest: 'sing', light: 'sing', moderate: 'talk', vigorous: 'words', max: 'none' };
const ZONE_HUE = { rest: 'gray', light: 'teal', moderate: 'green', vigorous: 'orange', max: 'red' };

export function zoneOf(effort) {
  if (effort >= 90) return 'max';
  if (effort >= 60) return 'vigorous';
  if (effort >= 40) return 'moderate';
  if (effort >= 5) return 'light';
  return 'rest';
}

/**
 * What the example body does at a given effort.
 * @param {'before'|'after'} who
 * @param {number} effort percent of the range between rest and this person's maximum (0–100)
 */
export function physiology(who, effort) {
  const p = PEOPLE[who] || PEOPLE.before;
  const f = clamp(effort, 0, 100) / 100;
  const heartRate = p.restRate + f * (p.maxRate - p.restRate);
  const rise = Math.min(1, f / 0.45);
  const stroke = p.restStroke + (p.maxStroke - p.restStroke) * rise * (2 - rise);
  const breaths = 14 + 16 * f + 37.5 * Math.max(0, f - 0.6);
  const energy = 1 + f * (p.maxWork - 1);
  const fatShare = 0.65 * (1 - Math.pow(f, 1.6));
  const zone = zoneOf(effort);
  return {
    heartRate: Math.round(heartRate),
    stroke: Math.round(stroke),
    output: tidy((Math.round(heartRate) * Math.round(stroke)) / 1000, 1),
    breaths: Math.round(breaths),
    energy: tidy(energy, 1),
    fatShare: Math.round(fatShare * 100),
    fatUse: tidy(energy * fatShare, 2),
    carbUse: tidy(energy * (1 - fatShare), 2),
    zone,
    talk: ZONE_TALK[zone],
  };
}

/** The effort (percent of range) at which a person works at `work` times resting energy use. */
export const effortForWork = (who, work) => ((work - 1) / ((PEOPLE[who] || PEOPLE.before).maxWork - 1)) * 100;

addStyles('effort-lab', `
  .widget-effort-lab .el-who { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-effort-lab .el-tab {
    min-height: 42px; padding: 0.4rem 0.9rem; border: var(--bw) solid var(--edge-strong); border-radius: var(--r);
    background: var(--surface); color: var(--ink); font-weight: 700; font-size: var(--fs-sm); cursor: pointer;
    user-select: none; -webkit-user-select: none; display: inline-flex; align-items: center; text-align: center;
  }
  .widget-effort-lab .el-tab[aria-pressed="true"] { background: var(--violet-soft); border-color: var(--violet); box-shadow: inset 0 0 0 1px var(--violet); }
  .widget-effort-lab .el-tab:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-effort-lab.is-readonly .el-tab { cursor: default; }
  .widget-effort-lab .el-bars { display: grid; gap: 6px; }
  .widget-effort-lab .el-row { display: grid; grid-template-columns: minmax(6.6em, 9.2em) minmax(0, 1fr) minmax(5.2em, auto); align-items: center; gap: var(--s2); font-size: var(--fs-sm); font-weight: 700; line-height: 1.2; }
  .widget-effort-lab .el-row > span:last-child { font-family: var(--font-mono); text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .widget-effort-lab .el-bar { display: flex; height: 16px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--sunken); overflow: hidden; }
  .widget-effort-lab .el-bar i { display: block; height: 100%; }
  .widget-effort-lab .el-key { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px var(--s4); font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-effort-lab .el-key i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; border: 1.5px solid var(--edge-strong); margin-right: 5px; vertical-align: -1px; }
  .widget-effort-lab .el-fat { background: var(--yellow); }
  .widget-effort-lab .el-carb { background: repeating-linear-gradient(135deg, var(--blue), var(--blue) 4px, var(--blue-soft) 4px, var(--blue-soft) 7px); }
  .widget-effort-lab .el-zone { font-family: var(--font-body); font-weight: 800; font-size: 15px; }
  .widget-effort-lab .el-say { font-family: var(--font-body); font-weight: 700; font-size: 14px; fill: var(--ink); }
  .widget-effort-lab .el-num { font-family: var(--font-mono); font-weight: 800; font-size: 22px; fill: var(--ink); font-variant-numeric: tabular-nums; }
  .widget-effort-lab .el-unit { font-family: var(--font-body); font-weight: 700; font-size: 12px; fill: var(--ink-2); }
  @media (max-width: 520px) { .widget-effort-lab .el-say { font-size: 18px; } .widget-effort-lab .el-unit { font-size: 15px; } .widget-effort-lab .el-zone { font-size: 19px; } }
  @container wcanvas (max-width: 470px) { .widget-effort-lab .el-say { font-size: 18px; } .widget-effort-lab .el-unit { font-size: 15px; } .widget-effort-lab .el-zone { font-size: 19px; } }
`);

const ROWS = {
  heart: { label: 'Heart rate', max: 200, color: 'red', value: (v) => `${v.heartRate} a min`, of: (v) => v.heartRate },
  stroke: { label: 'Blood per beat', max: 130, color: 'pink', value: (v) => `${v.stroke} mL`, of: (v) => v.stroke },
  output: { label: 'Blood per minute', max: 25, color: 'violet', value: (v) => `${formatNumber(v.output, 1)} L`, of: (v) => v.output },
  breath: { label: 'Breathing', max: 50, color: 'teal', value: (v) => `${v.breaths} a min`, of: (v) => v.breaths },
  fuel: { label: 'Energy use', max: 12, value: (v) => `${formatNumber(v.energy, 1)} × rest` },
};

export default function create(spec, env) {
  const byWork = spec.scale === 'work';
  const isStatic = !!spec.static || !!env.compact;
  const compare = !!spec.compare && !isStatic;
  const showTalk = spec.talk !== false;
  const rows = (Array.isArray(spec.show) ? spec.show : ['heart', 'stroke', 'output', 'breath', 'fuel']).filter((k) => ROWS[k]);
  let person = spec.person === 'after' ? 'after' : 'before';
  let effort = clamp(Math.round((spec.effort || 0) / 5) * 5, 0, 100);
  let work = clamp(spec.work != null ? spec.work : 1, 1, 12);
  let readOnly = !!env.readOnly;
  let zones = [];
  let people = [person];

  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, label: spec.alt || 'A heart, a pair of lungs and what a person can say at this effort' });
  const { svg } = fr;

  /* --------------------------------------------------------------- picture */
  // heart
  const HX = 92;
  const HY = 62;
  const heart = s('path', { d: 'M0 22 C-34 -2 -30 -30 -12 -30 C-4 -30 0 -24 0 -19 C0 -24 4 -30 12 -30 C30 -30 34 -2 0 22 Z', fill: hue('red'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
  const heartG = s('g', { transform: `translate(${HX} ${HY})` }, heart);
  const heartNum = s('text.el-num', { x: HX, y: 116, 'text-anchor': 'middle' });
  const heartUnit = s('text.el-unit', { x: HX, y: 136, 'text-anchor': 'middle' }, 'beats a minute');
  // lungs
  const LX = 250;
  const LY = 60;
  const lobe = (dir) => s('path', { d: `M${dir * 6} -26 C${dir * 30} -30 ${dir * 44} 0 ${dir * 40} 26 C${dir * 22} 32 ${dir * 8} 24 ${dir * 6} 12 Z`, fill: hue('teal', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
  const lungs = s('g', {}, lobe(-1), lobe(1), s('path', { d: 'M0 -38 V-22 M0 -22 L-9 -12 M0 -22 L9 -12', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
  const lungG = s('g', { transform: `translate(${LX} ${LY})` }, lungs);
  const lungNum = s('text.el-num', { x: LX, y: 116, 'text-anchor': 'middle' });
  const lungUnit = s('text.el-unit', { x: LX, y: 136, 'text-anchor': 'middle' }, 'breaths a minute');
  svg.append(heartG, heartNum, heartUnit, lungG, lungNum, lungUnit);
  // speech bubble and level
  const bubble = s('path', { d: 'M352 18 H536 a10 10 0 0 1 10 10 V74 a10 10 0 0 1 -10 10 H398 L378 100 L382 84 H352 a10 10 0 0 1 -10 -10 V28 a10 10 0 0 1 10 -10 Z', fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
  const say1 = s('text.el-say', { x: 444, y: 46, 'text-anchor': 'middle' });
  const say2 = s('text.el-say', { x: 444, y: 66, 'text-anchor': 'middle' });
  const zoneText = s('text.el-zone', { x: 444, y: 130, 'text-anchor': 'middle' });
  if (showTalk) svg.append(bubble, say1, say2, zoneText);

  /* ------------------------------------------------------------------ bars */
  const bars = {};
  const wrap = h('div.el-bars', { role: 'group', 'aria-label': 'Measurements' });
  for (const key of rows) {
    const def = ROWS[key];
    const value = h('span');
    let fills;
    if (key === 'fuel') fills = [h('i.el-fat'), h('i.el-carb')];
    else { fills = [h('i')]; fills[0].style.background = hue(def.color); }
    wrap.appendChild(h('div.el-row', h('span', def.label), h('div.el-bar', fills), value));
    bars[key] = { fills, value };
  }
  if (rows.length && !env.compact) fr.el.insertBefore(wrap, fr.readouts);
  const key = h('div.el-key', h('span', h('i.el-fat'), 'from fat'), h('span', h('i.el-carb'), 'from carbohydrate'));
  if (rows.includes('fuel') && !env.compact) fr.el.insertBefore(key, fr.readouts);

  /* -------------------------------------------------------------- controls */
  const tabEls = {};
  if (compare) {
    const tabs = h('div.el-who', { role: 'group', 'aria-label': 'Which body' });
    for (const who of ['before', 'after']) {
      const el = h('div.el-tab', { role: 'button', tabindex: '0', 'aria-pressed': 'false' }, PEOPLE[who].label);
      el.dataset.keys = 'own';
      const go = () => {
        if (readOnly || person === who) return;
        person = who;
        if (!people.includes(who)) people.push(who);
        play('select');
        render();
        env.onChange(getState());
      };
      el.addEventListener('click', go);
      el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
      tabEls[who] = el;
      tabs.appendChild(el);
    }
    fr.el.insertBefore(tabs, fr.canvas);
  }
  let row = null;
  if (!isStatic) {
    row = byWork
      ? sliderRow({ label: 'work rate', min: 1, max: 12, step: 0.5, value: work, color: 'orange', format: (v) => `${formatNumber(v, 1)} × rest`, onInput: (v) => { if (readOnly) return; work = v; moved(); } })
      : sliderRow({ label: 'effort', min: 0, max: 100, step: 5, value: effort, color: 'orange', unit: '%', onInput: (v) => { if (readOnly) return; effort = v; moved(); } });
    fr.controls.appendChild(row.el);
  }
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  if (!isStatic) fr.el.appendChild(note);

  function moved() {
    render();
    env.onChange(getState());
  }

  /* ----------------------------------------------------------------- model */
  /** Effort as a percent of the current person's range, and whether the work rate is out of reach. */
  function current() {
    if (!byWork) return { e: effort, beyond: false };
    const e = effortForWork(person, work);
    return { e: clamp(e, 0, 100), beyond: e > 100 + 1e-9 };
  }
  const values = () => { const c = current(); return { ...physiology(person, c.e), effort: tidy(c.e, 1), beyond: c.beyond }; };

  /* ------------------------------------------------------------- animation */
  let beatPhase = 0;
  let breathPhase = 0;
  const anim = loop((dt) => {
    const v = values();
    beatPhase = (beatPhase + (dt * v.heartRate) / 60) % 1;
    breathPhase = (breathPhase + (dt * v.breaths) / 60) % 1;
    pose();
  });
  function pose() {
    // a quick squeeze at the start of each beat; a smooth swell for each breath
    const squeeze = beatPhase < 0.18 ? Math.sin((beatPhase / 0.18) * Math.PI) : 0;
    heart.setAttribute('transform', `scale(${(1 + 0.12 * squeeze).toFixed(3)})`);
    const swell = 0.5 - 0.5 * Math.cos(breathPhase * 2 * Math.PI);
    lungs.setAttribute('transform', `scale(${(0.94 + 0.12 * swell).toFixed(3)})`);
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    const v = values();
    if (!zones.includes(v.zone)) zones.push(v.zone);
    heartNum.textContent = String(v.heartRate);
    lungNum.textContent = String(v.breaths);
    if (showTalk) {
      const lines = TALK[v.talk];
      say1.textContent = lines[0];
      say2.textContent = lines[1];
      zoneText.textContent = v.beyond ? 'More than this body can do' : ZONES[v.zone].label;
      zoneText.setAttribute('fill', hue(ZONE_HUE[v.zone], 'text'));
    }
    for (const k of rows) {
      const def = ROWS[k];
      const bar = bars[k];
      bar.value.textContent = def.value(v);
      if (k === 'fuel') {
        bar.fills[0].style.width = `${clamp((v.fatUse / def.max) * 100, 0, 100).toFixed(2)}%`;
        bar.fills[1].style.width = `${clamp((v.carbUse / def.max) * 100, 0, 100).toFixed(2)}%`;
      } else {
        bar.fills[0].style.width = `${clamp((def.of(v) / def.max) * 100, 0, 100).toFixed(2)}%`;
      }
    }
    for (const who of Object.keys(tabEls)) tabEls[who].setAttribute('aria-pressed', String(who === person));
    if (row) row.set(byWork ? work : effort);
    note.textContent = v.beyond ? `${PEOPLE[person].label}, this body tops out at ${PEOPLE[person].maxWork} × rest. The readings show its maximum.` : '';
    const fuel = rows.includes('fuel') ? ` Energy use ${formatNumber(v.energy, 1)} times rest, ${v.fatShare}% of it from fat.` : '';
    svg.setAttribute('aria-label', `${compare ? `${PEOPLE[person].label}. ` : ''}${ZONES[v.zone].label}: heart rate ${v.heartRate} beats a minute, ${v.breaths} breaths a minute.${showTalk ? ` Talk test: ${TALK[v.talk].join(' ')}` : ''}${fuel}`);
    if (reducedMotion() || isStatic) pose();
  }

  function getState() {
    const v = values();
    return {
      scale: byWork ? 'work' : 'effort',
      person,
      effort: v.effort,
      work: byWork ? work : v.energy,
      zone: v.zone,
      talk: v.talk,
      heartRate: v.heartRate,
      stroke: v.stroke,
      output: v.output,
      breaths: v.breaths,
      energy: v.energy,
      fatShare: v.fatShare,
      fatUse: v.fatUse,
      carbUse: v.carbUse,
      beyond: v.beyond,
      zones: zones.slice(),
      people: people.slice(),
    };
  }

  render();
  pose();
  if (!isStatic && !reducedMotion()) anim.start();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.person === 'before' || next.person === 'after') person = next.person;
      if (Array.isArray(next.people)) people = next.people.filter((p) => PEOPLE[p]);
      if (!people.includes(person)) people.push(person);
      if (Array.isArray(next.zones)) zones = next.zones.filter((z) => ZONES[z]);
      if (byWork && typeof next.work === 'number') work = clamp(Math.round(next.work * 2) / 2, 1, 12);
      if (!byWork && typeof next.effort === 'number') effort = clamp(Math.round(next.effort / 5) * 5, 0, 100);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (row) row.setDisabled(readOnly);
      for (const who of Object.keys(tabEls)) tabEls[who].setAttribute('tabindex', readOnly ? '-1' : '0');
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'effort-lab — from rest to all-out', spec: { type: 'effort-lab', effort: 50 } },
  { title: 'effort-lab — the talk test only', spec: { type: 'effort-lab', effort: 30, show: ['heart', 'breath'] } },
  { title: 'effort-lab — the same job before and after training', spec: { type: 'effort-lab', scale: 'work', work: 7, compare: true } },
];
