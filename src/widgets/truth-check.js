/**
 * truth-check — make an assumption, then see which statements survive it.
 * The widget does the bookkeeping of "assume, follow the consequences, look
 * for a contradiction". It comes in two flavours.
 *
 * 1. Knights and liars. Every islander is a knight (whatever they say is
 *    true) or a liar (whatever they say is false). The learner decides who
 *    is what; the widget works out whether each statement is true in that
 *    world, and whether that fits the person who said it.
 *
 *   {
 *     type: 'truth-check',
 *     people: [
 *       { name: 'Cleo', says: 'We are both liars.', claim: (k) => !k[0] && !k[1] },
 *       { name: 'Dax', says: null },                 // says nothing
 *     ],
 *     start: [null, null],     // 'knight' | 'liar' | null (undecided) for each person
 *   }
 *
 *   claim(k) gets an array of booleans: k[i] is true when person i is a knight.
 *
 *   State: { types, values, fits, assigned, consistent, contradictions, triedBoth, seen, total }
 *     types          — 'knight' | 'liar' | null for each person
 *     values         — is each statement true in this world? (null: silent, or it depends on someone undecided)
 *     fits           — does each statement fit its speaker? (null when it cannot be judged yet)
 *     assigned       — everyone has a type
 *     consistent     — everyone has a type and nothing contradicts
 *     contradictions — how many statements do not fit their speaker
 *     triedBoth      — every person has been tried as a knight and as a liar
 *     seen / total   — complete worlds tried so far / all 2^n worlds
 *
 * 2. Worlds. A few facts the learner can flip, and statements judged in
 *    the world that results.
 *
 *   {
 *     type: 'truth-check',
 *     switches: [{ label: 'Weather', on: 'Raining', off: 'Dry', value: false }, …],
 *     statements: [
 *       { tag: 'Rule', text: 'If it is raining, the street is wet.', if: (w) => w[0], then: (w) => w[1] },
 *       { tag: 'Fact', text: 'The street is wet.', value: (w) => w[1] },
 *     ],
 *   }
 *
 *   A statement with if/then is a promise. In a given world it is 'kept'
 *   (if-part and then-part both true), 'broken' (if-part true, then-part
 *   false) or 'untested' (if-part false, so nothing was promised).
 *
 *   State: { world, values, status, seen, total }
 *     world  — the switches, as booleans
 *     values — is each statement true? (an untested promise counts as true)
 *     status — 'kept' | 'broken' | 'untested' | 'true' | 'false' for each statement
 *
 * setState accepts { types: […] } (plus triedBoth: true) or { world: […] }.
 */
import { h, readout, addStyles, mdInline, icon } from './kit.js';
import { play } from '../core/audio.js';

addStyles('truth-check', `
  .widget-truth-check .tck-list { display: grid; gap: var(--s3); list-style: none; }
  .widget-truth-check .tck-person {
    display: grid; gap: var(--s2); padding: var(--s3) var(--s4);
    border: var(--bw) solid var(--edge); border-radius: var(--r-lg); background: var(--surface);
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }
  .widget-truth-check .tck-person[data-fit='yes'] { border-color: var(--green); }
  .widget-truth-check .tck-person[data-fit='no'] { border-color: var(--red); background: var(--red-soft); }
  .widget-truth-check .tck-top { display: flex; align-items: center; flex-wrap: wrap; gap: var(--s2) var(--s3); }
  .widget-truth-check .tck-avatar {
    flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%;
    border: var(--bw) solid var(--edge-strong); background: var(--gray-soft); color: var(--ink);
    font-weight: 800; font-size: var(--fs-lg); transition: background-color 0.15s ease;
  }
  .widget-truth-check .tck-person[data-type='knight'] .tck-avatar { background: var(--blue); color: #1D1B26; }
  .widget-truth-check .tck-person[data-type='liar'] .tck-avatar { background: var(--orange); color: #1D1B26; }
  .widget-truth-check .tck-name { flex: 1 1 auto; font-weight: 800; font-size: var(--fs-lg); }
  .widget-truth-check .tck-bubble {
    position: relative; margin-top: 6px; padding: 0.55rem 0.9rem; border-radius: 14px;
    background: var(--sunken); font-size: var(--fs-lg); line-height: 1.35;
  }
  .widget-truth-check .tck-bubble::before {
    content: ''; position: absolute; left: 14px; top: -8px;
    border: 8px solid transparent; border-top-width: 0; border-bottom-color: var(--sunken);
  }
  .widget-truth-check .tck-person[data-fit='no'] .tck-bubble { background: var(--surface); }
  .widget-truth-check .tck-person[data-fit='no'] .tck-bubble::before { border-bottom-color: var(--surface); }
  .widget-truth-check .tck-silent { color: var(--ink-3); font-size: var(--fs-sm); font-style: italic; }
  .widget-truth-check .tck-verdict { display: flex; align-items: flex-start; gap: var(--s2); min-height: 1.5em; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-3); }
  .widget-truth-check .tck-verdict svg { flex: none; margin-top: 2px; }
  .widget-truth-check [data-fit='yes'] .tck-verdict { color: var(--green-text); }
  .widget-truth-check [data-fit='no'] .tck-verdict { color: var(--red-text); }
  .widget-truth-check .tck-summary {
    text-align: center; text-wrap: balance;
    padding: var(--s2) var(--s4); border: var(--bw) dashed var(--hair); border-radius: var(--r);
    font-weight: 700; color: var(--ink-2);
  }
  .widget-truth-check .tck-summary svg { display: inline-block; vertical-align: -3px; margin-right: 6px; }
  .widget-truth-check .tck-summary[data-kind='ok'] { border-style: solid; border-color: var(--green); background: var(--green-soft); color: var(--green-text); }
  .widget-truth-check .tck-summary[data-kind='bad'] { border-style: solid; border-color: var(--red); background: var(--red-soft); color: var(--red-text); }
  /* three people and the summary have to share a laptop screen */
  @media (min-width: 700px) and (max-height: 820px) {
    .widget-truth-check .tck-list { gap: var(--s2); }
    .widget-truth-check .tck-person { gap: var(--s1); padding: var(--s2) var(--s4); }
    .widget-truth-check .tck-avatar { width: 34px; height: 34px; font-size: var(--fs-md); }
    .widget-truth-check .tck-bubble { padding: 0.4rem 0.9rem; font-size: var(--fs-md); }
  }
  .widget-truth-check .segmented button { min-height: 42px; }
  .widget-truth-check .segmented button[aria-pressed='true'] { font-weight: 800; }
  .widget-truth-check.is-readonly .segmented { pointer-events: none; }

  .widget-truth-check .tck-switches { display: grid; gap: var(--s2); padding: var(--s3) var(--s4); border: var(--bw) solid var(--edge); border-radius: var(--r-lg); background: var(--surface); }
  .widget-truth-check .tck-switch { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--s2) var(--s3); }
  .widget-truth-check .tck-switch-label { font-weight: 800; }
  .widget-truth-check .tck-statement {
    display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: var(--s1) var(--s3);
    padding: var(--s3) var(--s4); border: var(--bw) solid var(--hair); border-radius: var(--r); background: var(--surface);
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }
  .widget-truth-check .tck-tag { grid-column: 1 / -1; font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); }
  .widget-truth-check .tck-text { font-size: var(--fs-md); line-height: 1.35; }
  .widget-truth-check .tck-pill {
    display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; border-radius: 999px;
    font-size: var(--fs-sm); font-weight: 800; white-space: nowrap; background: var(--sunken); color: var(--ink-2);
  }
  .widget-truth-check .tck-statement[data-status='kept'], .widget-truth-check .tck-statement[data-status='true'] { border-color: var(--green); }
  .widget-truth-check .tck-statement[data-status='kept'] .tck-pill, .widget-truth-check .tck-statement[data-status='true'] .tck-pill { background: var(--green-soft); color: var(--green-text); }
  .widget-truth-check .tck-statement[data-status='broken'], .widget-truth-check .tck-statement[data-status='false'] { border-color: var(--red); background: var(--red-soft); }
  .widget-truth-check .tck-statement[data-status='broken'] .tck-pill, .widget-truth-check .tck-statement[data-status='false'] .tck-pill { background: var(--surface); color: var(--red-text); }
  @media (max-width: 480px) {
    .widget-truth-check .tck-statement { grid-template-columns: minmax(0, 1fr); }
    .widget-truth-check .tck-pill { justify-self: start; }
  }
`);

const TYPES = ['knight', 'liar'];
const TYPE_LABEL = { knight: 'Knight', liar: 'Liar' };

/** A two-way toggle built on the shared .segmented style. */
function toggle(labels, onPick, ariaLabel) {
  const buttons = labels.map((label, i) => {
    const btn = h('button', { type: 'button', 'aria-pressed': 'false' }, label);
    btn.addEventListener('click', () => onPick(i));
    return btn;
  });
  const el = h('div.segmented', { role: 'group', 'aria-label': ariaLabel }, buttons);
  return { el, set(index) { buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === index))); } };
}

function createPeople(spec, env) {
  const people = spec.people || [];
  const n = people.length;
  let types = people.map((_, i) => (spec.start && TYPES.includes(spec.start[i]) ? spec.start[i] : null));
  const tried = people.map(() => ({ knight: false, liar: false }));
  const seen = new Set();
  let readOnly = !!env.readOnly;

  /** Truth of person i's statement, or null if it depends on someone undecided. */
  function valueOf(i, t = types) {
    const p = people[i];
    if (typeof p.claim !== 'function') return null;
    const free = t.map((v, j) => (v == null ? j : -1)).filter((j) => j >= 0);
    let result = null;
    for (let m = 0; m < 1 << free.length; m++) {
      const k = t.map((v) => v === 'knight');
      free.forEach((j, b) => { k[j] = !!(m & (1 << b)); });
      const v = !!p.claim(k);
      if (result === null) result = v;
      else if (result !== v) return null;
    }
    return result;
  }
  function facts() {
    const values = people.map((_, i) => valueOf(i));
    const fits = people.map((_, i) => (types[i] == null || values[i] == null ? null : values[i] === (types[i] === 'knight')));
    const assigned = types.every((t) => t != null);
    const contradictions = fits.filter((f) => f === false).length;
    return { values, fits, assigned, contradictions, consistent: assigned && contradictions === 0 };
  }
  function note() {
    types.forEach((t, i) => { if (t) tried[i][t] = true; });
    if (types.every((t) => t != null)) seen.add(types.join(','));
  }
  note();

  const summary = h('div.tck-summary', { 'aria-live': 'polite' });
  const roSeen = readout('worlds tried', { digits: 0 });
  const cards = people.map((p, i) => {
    const avatar = h('span.tck-avatar', { 'aria-hidden': 'true' }, (p.name || '?').charAt(0));
    const tg = toggle(['Knight', 'Liar'], (k) => pick(i, TYPES[k]), `${p.name} is a…`);
    const verdict = h('div.tck-verdict');
    const el = h('li.tck-person',
      h('div.tck-top', avatar, h('span.tck-name', p.name), tg.el),
      p.says ? h('div.tck-bubble', { html: mdInline(`“${p.says}”`) }) : h('div.tck-silent', 'says nothing'),
      p.says ? verdict : null,
    );
    return { el, tg, verdict };
  });
  const root = h('div.w-frame',
    h('ul.tck-list', cards.map((c) => c.el)),
    summary,
    env.compact ? null : h('div.w-readouts', roSeen.el),
  );

  function pick(i, type) {
    if (readOnly || types[i] === type) return;
    types[i] = type;
    note();
    play('select');
    render();
    const f = facts();
    if (f.contradictions) env.announce('Contradiction.');
    else if (f.consistent) env.announce('No contradiction. This world is possible.');
    env.onChange(getState());
  }

  function render() {
    const f = facts();
    cards.forEach((card, i) => {
      const t = types[i];
      const p = people[i];
      card.tg.set(t ? TYPES.indexOf(t) : -1);
      card.el.dataset.type = t || 'none';
      card.el.dataset.fit = f.fits[i] == null ? 'none' : f.fits[i] ? 'yes' : 'no';
      if (!p.says) return;
      card.verdict.replaceChildren();
      if (t == null) {
        card.verdict.append('Knight or liar? Choose, and see what follows.');
      } else if (f.values[i] == null) {
        card.verdict.append('This depends on someone you have not decided yet.');
      } else {
        const truth = f.values[i] ? 'true' : 'false';
        const ok = f.fits[i];
        card.verdict.append(
          icon(ok ? 'check' : 'x', { size: 16, stroke: 3 }),
          h('span', ok
            ? `In this world that is ${truth}, just what a ${t} would say.`
            : `In this world that is ${truth}. A ${t} could never say it.`),
        );
      }
    });
    summary.replaceChildren();
    if (f.contradictions) {
      summary.dataset.kind = 'bad';
      summary.append(icon('x', { size: 18, stroke: 3 }), h('span', 'Contradiction: things cannot be this way.'));
    } else if (f.consistent) {
      summary.dataset.kind = 'ok';
      summary.append(icon('check', { size: 18, stroke: 3 }), h('span', 'No contradiction: this world is possible.'));
    } else {
      summary.dataset.kind = 'idle';
      summary.append(h('span', n === 1 ? 'Decide what this islander is.' : 'Decide for everyone to test a world.'));
    }
    roSeen.set(`${seen.size} of ${1 << n}`);
  }

  function getState() {
    const f = facts();
    return {
      types: types.slice(),
      values: f.values,
      fits: f.fits,
      assigned: f.assigned,
      consistent: f.consistent,
      contradictions: f.contradictions,
      triedBoth: tried.every((t) => t.knight && t.liar),
      seen: seen.size,
      total: 1 << n,
    };
  }

  render();
  if (readOnly) root.classList.add('is-readonly');
  return {
    el: root,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.types)) types = people.map((_, i) => (TYPES.includes(next.types[i]) ? next.types[i] : null));
      if (next.triedBoth) tried.forEach((t) => { t.knight = true; t.liar = true; });
      note();
      render();
    },
    setReadOnly(v) { readOnly = !!v; root.classList.toggle('is-readonly', readOnly); },
  };
}

const STATUS_LABEL = { kept: 'Holds', untested: 'Holds (not tested)', broken: 'Broken', true: 'True', false: 'False' };

function createWorld(spec, env) {
  const switches = spec.switches || [];
  const statements = spec.statements || [];
  let world = switches.map((sw) => !!sw.value);
  const seen = new Set([world.join(',')]);
  let readOnly = !!env.readOnly;

  function statusOf(st) {
    if (typeof st.if === 'function') {
      if (!st.if(world)) return 'untested';
      return st.then(world) ? 'kept' : 'broken';
    }
    return st.value(world) ? 'true' : 'false';
  }

  const roSeen = readout('worlds tried', { digits: 0 });
  const toggles = switches.map((sw, i) => {
    const tg = toggle([sw.on || 'Yes', sw.off || 'No'], (k) => flip(i, k === 0), sw.label || `Switch ${i + 1}`);
    return { tg, el: h('div.tck-switch', h('span.tck-switch-label', { html: mdInline(sw.label || '') }), tg.el) };
  });
  const rows = statements.map((st) => {
    const pill = h('span.tck-pill');
    const el = h('li.tck-statement', st.tag ? h('span.tck-tag', st.tag) : null, h('span.tck-text', { html: mdInline(st.text) }), pill);
    return { el, pill };
  });
  const root = h('div.w-frame',
    h('div.tck-switches', toggles.map((t) => t.el)),
    h('ol.tck-list', { 'aria-live': 'polite' }, rows.map((r) => r.el)),
    env.compact ? null : h('div.w-readouts', roSeen.el),
  );

  function flip(i, value) {
    if (readOnly || world[i] === value) return;
    world[i] = value;
    seen.add(world.join(','));
    play('select');
    render();
    env.onChange(getState());
  }

  function render() {
    toggles.forEach((t, i) => t.tg.set(world[i] ? 0 : 1));
    statements.forEach((st, i) => {
      const status = statusOf(st);
      const good = status !== 'broken' && status !== 'false';
      rows[i].el.dataset.status = status;
      rows[i].pill.replaceChildren(icon(good ? 'check' : 'x', { size: 14, stroke: 3 }), STATUS_LABEL[status]);
    });
    roSeen.set(`${seen.size} of ${1 << switches.length}`);
  }

  function getState() {
    const status = statements.map(statusOf);
    return {
      world: world.slice(),
      values: status.map((st) => st !== 'broken' && st !== 'false'),
      status,
      seen: seen.size,
      total: 1 << switches.length,
    };
  }

  render();
  if (readOnly) root.classList.add('is-readonly');
  return {
    el: root,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.world)) return;
      world = switches.map((_, i) => !!next.world[i]);
      seen.add(world.join(','));
      render();
    },
    setReadOnly(v) { readOnly = !!v; root.classList.toggle('is-readonly', readOnly); },
  };
}

export default function create(spec, env) {
  return Array.isArray(spec.switches) ? createWorld(spec, env) : createPeople(spec, env);
}

export const examples = [
  {
    title: 'truth-check — knights and liars',
    spec: {
      type: 'truth-check',
      people: [
        { name: 'Cleo', says: 'We are both liars.', claim: (k) => !k[0] && !k[1] },
        { name: 'Dax', says: null },
      ],
    },
  },
  {
    title: 'truth-check — worlds and promises',
    spec: {
      type: 'truth-check',
      switches: [{ label: 'Weather', on: 'Raining', off: 'Dry', value: true }, { label: 'Street', on: 'Wet', off: 'Dry', value: true }],
      statements: [
        { tag: 'Rule', text: 'If it is raining, the street is wet.', if: (w) => w[0], then: (w) => w[1] },
        { tag: 'Turned round', text: 'If the street is wet, it is raining.', if: (w) => w[1], then: (w) => w[0] },
      ],
    },
  },
];
