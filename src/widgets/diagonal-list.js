/**
 * diagonal-list — Cantor's diagonal argument as something to do. A list of
 * decimals between 0 and 1 is shown (its first few entries and digits), with
 * the diagonal marked: digit 1 of entry 1, digit 2 of entry 2, and so on.
 * Under it the learner builds a new decimal, digit by digit. Whenever their
 * nth digit differs from the nth digit of the nth entry, the new number
 * cannot be that entry, and the entry gets a tick.
 *
 * {
 *   type: 'diagonal-list',
 *   rows: ['314159', '718281', '414213', '577215', '693147', '161803'],
 *                         // the digits after "0." of each entry; with n rows, each needs at least n digits (4 to 7 rows)
 *   random: false,        // true: random digits instead of `rows`, and a "New list" button
 *   size: 6,              // how many rows a random list has
 *   digits: [2, null],    // digits of the learner's number at the start (null: not chosen yet)
 *   allowed: '12345678',  // the digits on offer. 0 and 9 are left out on purpose: numbers such as
 *                         // 0.5000… = 0.4999… have two decimal forms, and a number without 0s and 9s has only one.
 *   static: false,        // true: picture only
 * }
 *
 * State: { rows, diagonal, digits, filled, clashes, escaped, number }
 *   diagonal  the marked digits, one per row
 *   digits    the learner's digits (null where none is chosen)
 *   filled    how many have been chosen
 *   clashes   the positions (counted from 1) where the learner's digit equals the diagonal digit
 *   escaped   every digit is chosen and none clashes: the number differs from every entry shown
 *   number    the learner's number as text, e.g. '0.253714' ('?' for a missing digit)
 *
 * setState accepts { digits: [2, 5, 3, 7, 1, 4] }, or { escape: true } (fills in digits that dodge every marked digit).
 */
import { frame, readout, button, hue, s, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('diagonal-list', `
  .widget-diagonal-list .dl-digit { font-family: var(--font-mono); font-size: 19px; font-weight: 600; }
  .widget-diagonal-list .dl-digit.is-diag { font-weight: 800; }
  .widget-diagonal-list .dl-pick { cursor: pointer; outline: none; }
  .widget-diagonal-list .dl-pick:focus-visible rect { stroke: var(--focus); stroke-width: 4; }
  .widget-diagonal-list.is-readonly .dl-pick { cursor: default; pointer-events: none; }
`);

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];
const DEFAULT_ROWS = ['314159', '718281', '414213', '577215', '693147', '161803'];

/** One way to dodge a diagonal digit with the digits 1 to 8: take 1, unless the digit is 1, then take 2. */
export const dodge = (diagonal) => diagonal.map((d) => (Number(d) === 1 ? 2 : 1));

export default function create(spec, env) {
  const allowed = String(spec.allowed || '12345678').split('').filter((c) => /\d/.test(c)).map(Number);
  const isStatic = !!spec.static || env.compact;
  const makeRows = () => {
    if (!spec.random && Array.isArray(spec.rows) && spec.rows.length >= 2) return spec.rows.slice(0, 7).map((r) => String(r).replace(/\D/g, ''));
    if (!spec.random) return DEFAULT_ROWS.slice();
    const k = clamp(Math.round(spec.size || 6), 4, 7);
    return Array.from({ length: k }, () => Array.from({ length: k }, () => env.rng.int(0, 9)).join(''));
  };
  let rows = makeRows();
  const n = rows.length;
  let digits = Array.from({ length: n }, (_, j) => (Array.isArray(spec.digits) && allowed.includes(spec.digits[j]) ? spec.digits[j] : null));
  let readOnly = !!env.readOnly;

  const LABEL = 54;
  const LEAD = 26;
  const cw = Math.min(44, (420 - LABEL - LEAD - 56) / n);
  const rh = 36;
  const W = LABEL + LEAD + n * cw + 62;
  const top = 12;
  const mineY = top + n * rh + 24;
  const H = mineY + 64;
  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: Math.round(W * 1.15), label: spec.alt || 'A list of decimals with its diagonal marked' });
  const { svg } = fr;
  const gList = s('g');
  const gMine = s('g');
  svg.append(gList, gMine);
  const roNumber = readout('your number', { color: 'blue' });
  const roDiffers = readout('entries it differs from', { digits: 0, color: 'green' });
  if (!env.compact) fr.readouts.append(roNumber.el, roDiffers.el);
  const colX = (j) => LABEL + LEAD + (j + 0.5) * cw;

  const diagonal = () => rows.map((r, j) => Number(r[j]));
  function getState() {
    const diag = diagonal();
    const clashes = [];
    digits.forEach((d, j) => { if (d != null && d === diag[j]) clashes.push(j + 1); });
    const filled = digits.filter((d) => d != null).length;
    return { rows: rows.slice(), diagonal: diag, digits: digits.slice(), filled, clashes, escaped: filled === n && !clashes.length, number: `0.${digits.map((d) => (d == null ? '?' : d)).join('')}` };
  }

  const picks = [];
  function drawList() {
    gList.replaceChildren();
    const diag = diagonal();
    rows.forEach((row, i) => {
      const y = top + i * rh;
      gList.appendChild(s('text', { class: 'fig-label-sm text-muted', x: LABEL - 8, y: y + rh / 2 + 5, 'text-anchor': 'end' }, ORDINALS[i]));
      gList.appendChild(s('text', { class: 'fig-label dl-digit', x: LABEL + LEAD - 3, y: y + rh / 2 + 7, 'text-anchor': 'end' }, '0.'));
      gList.appendChild(s('rect', { x: colX(i) - cw / 2 + 3, y: y + 3, width: cw - 6, height: rh - 6, rx: 7, fill: hue('orange', 'soft'), stroke: hue('orange'), 'stroke-width': 2.5 }));
      for (let j = 0; j < n; j++) {
        gList.appendChild(s('text', { class: `fig-label dl-digit${i === j ? ' is-diag' : ''}`, x: colX(j), y: y + rh / 2 + 7, 'text-anchor': 'middle' }, row[j] != null ? row[j] : '·'));
      }
      gList.appendChild(s('text', { class: 'fig-label text-muted', x: colX(n - 1) + cw / 2 + 12, y: y + rh / 2 + 5, 'text-anchor': 'middle' }, '…'));
      // does the learner's number differ from this entry at its marked digit?
      const d = digits[i];
      if (d != null) {
        const ok = d !== diag[i];
        const mx = W - 18;
        const my = y + rh / 2;
        gList.appendChild(s('path', { d: ok ? `M${mx - 7} ${my}l5 5l9 -10` : `M${mx - 6} ${my - 6}l12 12M${mx + 6} ${my - 6}l-12 12`, fill: 'none', stroke: ok ? hue('green') : hue('red'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      }
    });
    gList.appendChild(s('text', { class: 'fig-label text-muted', x: LABEL - 8, y: top + n * rh + 12, 'text-anchor': 'end' }, '⋮'));
    gList.appendChild(s('line', { x1: 8, x2: W - 8, y1: mineY - 6, y2: mineY - 6, stroke: 'var(--hair)', 'stroke-width': 2 }));
  }

  function draw() {
    drawList();
    const st = getState();
    picks.forEach((p, j) => {
      const d = digits[j];
      const clash = d != null && d === st.diagonal[j];
      p.box.setAttribute('fill', d == null ? 'var(--surface)' : clash ? hue('red', 'soft') : hue('green', 'soft'));
      p.box.setAttribute('stroke', d == null ? 'var(--ink)' : clash ? hue('red') : hue('green'));
      p.text.textContent = d == null ? '?' : String(d);
      p.note.textContent = d == null ? '' : clash ? `= ${st.diagonal[j]}` : `≠ ${st.diagonal[j]}`;
      p.note.setAttribute('class', `fig-label-sm ${clash ? 'text-red' : 'text-green'}`);
      p.g.setAttribute('aria-label', `Digit ${j + 1} of your number: ${d == null ? 'not chosen' : d}. Digit ${j + 1} of entry ${j + 1} is ${st.diagonal[j]}.${d == null ? '' : clash ? ' They are the same.' : ' They differ.'}`);
      if (!isStatic) p.g.setAttribute('tabindex', readOnly ? '-1' : '0');
    });
    roNumber.set(`${st.number}…`);
    roDiffers.set(`${st.filled - st.clashes.length} of ${n}`);
    if (clearBtn) clearBtn.disabled = readOnly || !st.filled;
    svg.setAttribute('aria-label', `A list of ${n} decimals: ${rows.map((r) => `0.${r.slice(0, n)}`).join(', ')}. Your number so far: ${st.number}.`);
  }

  function setDigit(j, value) {
    if (readOnly || isStatic) return;
    digits[j] = value;
    play('tap');
    draw();
    const st = getState();
    env.announce(value == null ? `Digit ${j + 1} cleared.` : `Digit ${j + 1} is ${value}. ${value === st.diagonal[j] ? 'Same as the marked digit.' : 'Different from the marked digit.'}`);
    env.onChange(st);
  }
  const cycle = (j, by) => {
    const at = digits[j] == null ? (by > 0 ? -1 : 0) : allowed.indexOf(digits[j]);
    setDigit(j, allowed[(at + by + allowed.length) % allowed.length]);
  };

  gMine.appendChild(s('text', { class: 'fig-label-sm text-blue', x: LABEL - 8, y: mineY + 28, 'text-anchor': 'end' }, 'Yours'));
  gMine.appendChild(s('text', { class: 'fig-label dl-digit', x: LABEL + LEAD - 3, y: mineY + 30, 'text-anchor': 'end' }, '0.'));
  gMine.appendChild(s('text', { class: 'fig-label text-muted', x: colX(n - 1) + cw / 2 + 12, y: mineY + 28, 'text-anchor': 'middle' }, '…'));
  for (let j = 0; j < n; j++) {
    const box = s('rect', { x: colX(j) - cw / 2 + 2, y: mineY, width: cw - 4, height: 44, rx: 8, 'stroke-width': 2.5 });
    const text = s('text', { class: 'fig-label dl-digit', x: colX(j), y: mineY + 29, 'text-anchor': 'middle', 'pointer-events': 'none' });
    const note = s('text', { x: colX(j), y: mineY + 59, 'text-anchor': 'middle', 'pointer-events': 'none' });
    const g = s('g', { class: 'dl-pick' }, box, text, note);
    if (!isStatic) {
      g.setAttribute('role', 'button');
      g.dataset.keys = 'own';
      g.addEventListener('click', () => cycle(j, 1));
      g.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowUp') cycle(j, 1);
        else if (ev.key === 'ArrowDown') cycle(j, -1);
        else if (allowed.includes(Number(ev.key)) && /^\d$/.test(ev.key)) setDigit(j, Number(ev.key));
        else if (ev.key === 'Backspace' || ev.key === 'Delete') setDigit(j, null);
        else if (ev.key === 'ArrowRight' && j + 1 < n) picks[j + 1].g.focus();
        else if (ev.key === 'ArrowLeft' && j > 0) picks[j - 1].g.focus();
        else return;
        ev.preventDefault();
        ev.stopPropagation();
      });
    }
    picks.push({ g, box, text, note });
    gMine.appendChild(g);
  }

  let clearBtn = null;
  if (!isStatic) {
    clearBtn = button('Clear my digits', () => { if (readOnly) return; digits = digits.map(() => null); draw(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(clearBtn);
    if (spec.random) fr.buttons.appendChild(button('New list', () => { if (readOnly) return; rows = makeRows(); digits = digits.map(() => null); draw(); env.onChange(getState()); }, { icon: 'shuffle', variant: 'ghost' }));
  }
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.rows) && next.rows.length === n) rows = next.rows.map(String);
      if (Array.isArray(next.digits)) digits = digits.map((_, j) => (allowed.includes(next.digits[j]) ? next.digits[j] : null));
      else if (next.escape) digits = dodge(diagonal());
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      draw();
    },
  };
}

export const examples = [
  { title: 'diagonal-list — build a number that is not on the list', spec: { type: 'diagonal-list' } },
  { title: 'diagonal-list — any list will do', spec: { type: 'diagonal-list', random: true, size: 5 } },
];
