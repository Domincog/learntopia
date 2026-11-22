/**
 * blood-match — who can give red blood cells to whom. Red cells carry markers (antigens A, B and the
 * Rh marker D); a person's plasma holds antibodies against the A or B marker they do not have. The
 * learner tries donors against a patient and sees what the antibodies would do.
 *
 *   'pair'    pick a donor group and a patient group; the drawing shows the donor cell's markers, the
 *             patient's antibodies and whether they clash;
 *   'donors'  the patient is fixed and the learner selects every donor group that would be safe. The
 *             drawing shows markers and antibodies but gives no verdict: the lesson's check does that.
 *
 * {
 *   type: 'blood-match',
 *   mode: 'pair',            // 'pair' | 'donors'
 *   donor: 'A+',             // pair: the donor shown first
 *   recipient: 'B+',         // the patient (fixed in 'donors' mode; in 'pair' mode the learner may change it unless lockRecipient)
 *   lockRecipient: false,
 *   selected: [],            // donors: groups selected at the start
 *   static: false,
 * }
 *
 * Groups are written 'O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+' in specs and state (TYPES, in that
 * order) and shown with a proper minus sign.
 *
 * State
 *   pair:   { mode, donor, recipient, compatible, clash, tried, triedSafe, triedClash }
 *             clash — the donor markers the patient's blood would attack, e.g. ['A', 'D'] (empty when compatible)
 *             tried — every pairing looked at so far: [{ donor, recipient, compatible }]
 *             triedSafe / triedClash — how many of those were compatible / were not
 *   donors: { mode, recipient, selected, unsafe, missed, count }
 *             selected — the chosen donor groups, in TYPES order
 *             unsafe   — chosen groups that this patient must not be given;  missed — safe groups not chosen
 *
 * setState: pair { donor, recipient, tried };  donors { selected }.
 *
 * The rule (for red-cell transfusion): a donor is compatible when the donor's cells carry no marker that
 * the patient lacks. People without the D marker have no ready-made antibody to it, but can form one after
 * meeting D-positive blood, so the rule treats D like A and B. Left out: plasma and platelets (plasma follows
 * the reverse rule), the many rarer blood group systems, and the cross-match that a hospital always does
 * before a real transfusion.
 */
import { frame, hue, s, h, addStyles } from './kit.js';
import { play } from '../core/audio.js';

export const TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
/** The markers on the red cells of a group: 'AB+' -> ['A', 'B', 'D']. */
export const antigens = (type) => [...(type.includes('A') ? ['A'] : []), ...(type.includes('B') ? ['B'] : []), ...(type.endsWith('+') ? ['D'] : [])];
/** The ready-made antibodies in the plasma of a group: 'O+' -> ['A', 'B']. */
export const antibodies = (type) => ['A', 'B'].filter((m) => !type.includes(m));
/** The donor markers that a patient's blood would attack. */
export const clashes = (donor, recipient) => antigens(donor).filter((m) => !antigens(recipient).includes(m));
/** Can red cells of group `donor` be given to a patient of group `recipient`? */
export const canGive = (donor, recipient) => clashes(donor, recipient).length === 0;
/** 'AB-' -> 'AB−' (a real minus sign, for text). */
export const showType = (type) => String(type).replace('-', '−');

const MARK = { A: { color: 'orange', name: 'A' }, B: { color: 'violet', name: 'B' }, D: { color: 'teal', name: 'D' } };
const DARK = '#1D1B26';
const W = 560;

addStyles('blood-match', `
  .widget-blood-match .bm-rows { display: grid; gap: 8px; }
  .widget-blood-match .bm-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; }
  .widget-blood-match .bm-row > span { font-size: var(--fs-sm); font-weight: 800; color: var(--ink-2); min-width: 4.2em; text-align: right; }
  .widget-blood-match .bm-chip { min-width: 46px; min-height: 40px; padding: 4px 8px; border: var(--bw) solid var(--edge); border-radius: 12px; background: var(--surface); color: var(--ink); font: inherit; font-weight: 800; font-size: var(--fs-md); cursor: pointer; }
  .widget-blood-match .bm-chip[aria-pressed="true"] { background: var(--red-soft); border-color: var(--edge-strong); box-shadow: inset 0 0 0 2px var(--red); }
  .widget-blood-match .bm-chip:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-blood-match .bm-chip:disabled { cursor: default; opacity: 0.75; }
  .widget-blood-match .bm-verdict { font-size: 15px; font-weight: 800; }
  .widget-blood-match .bm-mark { font-family: var(--font-body); font-size: 12px; font-weight: 800; fill: ${DARK}; }
  .widget-blood-match .bm-type { font-size: 15px; }
  @container wcanvas (max-width: 470px) {
    .widget-blood-match .bm-verdict { font-size: 18px; }
    .widget-blood-match .bm-mark { font-size: 14px; }
    .widget-blood-match .bm-type { font-size: 18px; }
  }
`);

/** A red cell with its marker badges round the rim. */
function cell(cx, cy, r, type, { faded = false } = {}) {
  const g = s('g', { opacity: faded ? 0.42 : 1 });
  g.appendChild(s('circle', { cx, cy, r, fill: hue('red', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  g.appendChild(s('circle', { cx, cy, r: r * 0.42, fill: hue('red'), opacity: 0.4 }));
  const spots = { A: -140, B: -40, D: 90 };
  const br = Math.max(9, r * 0.3);
  for (const m of antigens(type)) {
    const ang = (spots[m] * Math.PI) / 180;
    const x = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    if (m === 'B') g.appendChild(s('rect', { x: x - br, y: y - br, width: 2 * br, height: 2 * br, rx: 3, fill: hue(MARK[m].color), stroke: 'var(--ink)', 'stroke-width': 2 }));
    else if (m === 'D') g.appendChild(s('path', { d: `M${x} ${y - br * 1.25}L${x + br * 1.25} ${y}L${x} ${y + br * 1.25}L${x - br * 1.25} ${y}Z`, fill: hue(MARK[m].color), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    else g.appendChild(s('circle', { cx: x, cy: y, r: br, fill: hue(MARK[m].color), stroke: 'var(--ink)', 'stroke-width': 2 }));
    g.appendChild(s('text.bm-mark', { x, y: y + 4.5, 'text-anchor': 'middle' }, m));
  }
  return g;
}

/** A Y-shaped antibody with its name underneath. */
function antibody(x, y, m, { dashed = false } = {}) {
  const g = s('g');
  g.appendChild(s('path', { d: `M${x} ${y}v-18M${x} ${y - 18}l-11 -13M${x} ${y - 18}l11 -13`, fill: 'none', stroke: hue(MARK[m].color), 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-dasharray': dashed ? '2 8' : null }));
  g.appendChild(s('path', { d: `M${x} ${y}v-18M${x} ${y - 18}l-11 -13M${x} ${y - 18}l11 -13`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: dashed ? 0 : 0.55 }));
  g.appendChild(s('text.fig-label-sm', { x, y: y + 16, 'text-anchor': 'middle' }, `anti-${m}`));
  return g;
}

export default function create(spec, env) {
  const mode = spec.mode === 'donors' ? 'donors' : 'pair';
  const isStatic = !!spec.static || !!env.compact;
  const valid = (t, fallback) => (TYPES.includes(t) ? t : fallback);
  let donor = valid(spec.donor, 'A+');
  let recipient = valid(spec.recipient, 'B+');
  const lockRecipient = mode === 'donors' || !!spec.lockRecipient;
  let selected = new Set((Array.isArray(spec.selected) ? spec.selected : []).filter((t) => TYPES.includes(t)));
  let tried = [];
  let readOnly = !!env.readOnly;

  const H = mode === 'pair' ? 214 : 232;
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Blood groups: the markers on red cells and the antibodies in plasma' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const rows = h('div.bm-rows');
  const chips = { donor: {}, recipient: {}, pick: {} };

  const record = () => {
    const last = tried[tried.length - 1];
    if (last && last.donor === donor && last.recipient === recipient) return;
    if (tried.some((t) => t.donor === donor && t.recipient === recipient)) return;
    tried.push({ donor, recipient, compatible: canGive(donor, recipient) });
  };

  function verdictText() {
    const cl = clashes(donor, recipient);
    if (!cl.length) return `Safe. Group ${showType(recipient)} blood has no antibody against anything on group ${showType(donor)} cells.`;
    const ab = cl.filter((m) => m !== 'D');
    const parts = [];
    if (ab.length) parts.push(`the patient's anti-${ab.join(' and anti-')} ${ab.length > 1 ? 'antibodies stick' : 'antibody sticks'} to the donor cells and clumps them`);
    if (cl.includes('D')) parts.push(`the donor cells carry the D marker, which a group ${showType(recipient)} patient lacks and would make antibodies against`);
    return `Not safe: ${parts.join(', and ')}.`;
  }

  function patientPanel(x0, x1, y0) {
    const mid = (x0 + x1) / 2;
    g.appendChild(s('rect', { x: x0, y: y0, width: x1 - x0, height: H - y0 - 12, rx: 16, fill: hue('yellow', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    g.appendChild(s('text.fig-label.bm-type', { x: mid, y: y0 + 24, 'text-anchor': 'middle' }, `Patient: group ${showType(recipient)}`));
    const abs = antibodies(recipient);
    const makesD = !recipient.endsWith('+');
    const items = [...abs.map((m) => ({ m, dashed: false })), ...(makesD ? [{ m: 'D', dashed: true }] : [])];
    const yy = y0 + 92;
    if (!items.length) {
      g.appendChild(s('text.fig-label-sm', { x: mid, y: yy - 20, 'text-anchor': 'middle' }, 'no antibodies against'));
      g.appendChild(s('text.fig-label-sm', { x: mid, y: yy - 4, 'text-anchor': 'middle' }, 'A, B or D'));
    } else {
      const step = Math.min(58, (x1 - x0 - 30) / items.length);
      items.forEach((it, i) => g.appendChild(antibody(mid + (i - (items.length - 1) / 2) * step, yy, it.m, { dashed: it.dashed })));
    }
    const foot = makesD ? ['dotted: made only', 'after meeting D'] : ['antibodies in', 'the plasma'];
    foot.forEach((line, i) => g.appendChild(s('text.fig-label-sm.text-muted', { x: mid, y: H - 38 + i * 16, 'text-anchor': 'middle' }, line)));
  }

  function render() {
    g.replaceChildren();
    if (mode === 'pair') {
      // donor cell on the left, patient's plasma on the right, the verdict between
      g.appendChild(s('text.fig-label.bm-type', { x: 100, y: 30, 'text-anchor': 'middle' }, `Donor: group ${showType(donor)}`));
      g.appendChild(cell(100, 112, 46, donor));
      const marks = antigens(donor);
      g.appendChild(s('text.fig-label-sm.text-muted', { x: 100, y: H - 16, 'text-anchor': 'middle' }, marks.length ? `markers on the cell: ${marks.join(', ')}` : 'no A, B or D marker'));
      patientPanel(356, 548, 8);
      const ok = canGive(donor, recipient);
      g.appendChild(s('path', { d: 'M188 104 H318', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': ok ? null : '3 9' }));
      g.appendChild(s('path', { d: 'M306 92 L322 104 L306 116', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      g.appendChild(s('circle', { cx: 254, cy: 104, r: 22, fill: hue(ok ? 'green' : 'red', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      g.appendChild(s('path', { d: ok ? 'M243 105 L251 113 L266 96' : 'M245 95 L263 113 M263 95 L245 113', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      g.appendChild(s(`text.fig-label.bm-verdict.${ok ? 'text-green' : 'text-red'}`, { x: 254, y: 152, 'text-anchor': 'middle' }, ok ? 'safe' : 'clash'));
      if (!ok) g.appendChild(s('text.fig-label-sm', { x: 254, y: 170, 'text-anchor': 'middle' }, `against ${clashes(donor, recipient).join(' and ')}`));
      note.textContent = verdictText();
    } else {
      // the eight donor cells on the left, the patient on the right
      TYPES.forEach((t, i) => {
        const cx = 52 + (i % 4) * 84;
        const cy = 62 + Math.floor(i / 4) * 106;
        const on = selected.has(t);
        if (on) g.appendChild(s('rect', { x: cx - 39, y: cy - 44, width: 78, height: 98, rx: 14, fill: hue('green', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
        g.appendChild(cell(cx, cy - 6, 24, t, { faded: false }));
        g.appendChild(s('text.fig-label.bm-type', { x: cx, y: cy + 44, 'text-anchor': 'middle' }, showType(t)));
      });
      patientPanel(372, 548, 8);
      const names = TYPES.filter((t) => selected.has(t)).map(showType);
      note.textContent = names.length ? `Chosen donors: ${names.join(', ')}.` : 'No donor group chosen yet.';
    }
    for (const t of TYPES) {
      if (chips.donor[t]) chips.donor[t].setAttribute('aria-pressed', String(t === donor));
      if (chips.recipient[t]) chips.recipient[t].setAttribute('aria-pressed', String(t === recipient));
      if (chips.pick[t]) chips.pick[t].setAttribute('aria-pressed', String(selected.has(t)));
    }
    svg.setAttribute('aria-label', `${spec.alt || 'Blood groups'}. ${mode === 'pair' ? `Donor group ${showType(donor)}, patient group ${showType(recipient)}. ${verdictText()}` : `Patient group ${showType(recipient)}. ${note.textContent}`}`);
  }

  function getState() {
    if (mode === 'donors') {
      const list = TYPES.filter((t) => selected.has(t));
      return {
        mode, recipient, selected: list,
        unsafe: list.filter((t) => !canGive(t, recipient)),
        missed: TYPES.filter((t) => canGive(t, recipient) && !selected.has(t)),
        count: list.length,
      };
    }
    return {
      mode, donor, recipient, compatible: canGive(donor, recipient), clash: clashes(donor, recipient),
      tried: tried.map((t) => ({ ...t })), triedSafe: tried.filter((t) => t.compatible).length, triedClash: tried.filter((t) => !t.compatible).length,
    };
  }

  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const chip = (t, label, onClick) => {
    const b = h('button.bm-chip', { type: 'button', 'aria-pressed': 'false', 'aria-label': `${label} ${showType(t)}` }, showType(t));
    b.addEventListener('click', (ev) => { ev.preventDefault(); if (!readOnly) onClick(t); });
    return b;
  };
  if (!isStatic) {
    if (mode === 'pair') {
      const dRow = h('div.bm-row', { role: 'group', 'aria-label': 'Donor group' }, h('span', 'Donor'));
      for (const t of TYPES) { chips.donor[t] = chip(t, 'Donor group', (v) => { donor = v; record(); play('select'); render(); env.announce(verdictText()); env.onChange(getState()); }); dRow.appendChild(chips.donor[t]); }
      rows.appendChild(dRow);
      if (!lockRecipient) {
        const rRow = h('div.bm-row', { role: 'group', 'aria-label': 'Patient group' }, h('span', 'Patient'));
        for (const t of TYPES) { chips.recipient[t] = chip(t, 'Patient group', (v) => { recipient = v; record(); play('select'); render(); env.announce(verdictText()); env.onChange(getState()); }); rRow.appendChild(chips.recipient[t]); }
        rows.appendChild(rRow);
      }
    } else {
      const pRow = h('div.bm-row', { role: 'group', 'aria-label': 'Donor groups to give' });
      for (const t of TYPES) {
        chips.pick[t] = chip(t, 'Donor group', (v) => { if (selected.has(v)) selected.delete(v); else selected.add(v); play(selected.has(v) ? 'pop' : 'tap'); render(); env.onChange(getState()); });
        pRow.appendChild(chips.pick[t]);
      }
      rows.appendChild(pRow);
    }
    fr.el.insertBefore(rows, fr.readouts);
  }
  if (!env.compact) fr.el.insertBefore(note, fr.readouts);
  if (mode === 'pair') record();
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'donors') {
        if (Array.isArray(next.selected)) selected = new Set(next.selected.filter((t) => TYPES.includes(t)));
      } else {
        if (Array.isArray(next.tried)) tried = next.tried.filter((t) => t && TYPES.includes(t.donor) && TYPES.includes(t.recipient)).map((t) => ({ donor: t.donor, recipient: t.recipient, compatible: canGive(t.donor, t.recipient) }));
        if (TYPES.includes(next.donor)) donor = next.donor;
        if (TYPES.includes(next.recipient) && !lockRecipient) recipient = next.recipient;
        record();
      }
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); },
  };
}

export const examples = [
  { title: 'blood-match — try a donor against a patient', spec: { type: 'blood-match', mode: 'pair', donor: 'A+', recipient: 'B+' } },
  { title: 'blood-match — choose every safe donor', spec: { type: 'blood-match', mode: 'donors', recipient: 'A-' } },
];
