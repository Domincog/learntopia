/** Helpers shared by the step renderers. */
import { h } from '../core/dom.js';
import { md, mdInline, mdText } from '../core/markdown.js';

/** An element containing rendered lesson markdown. */
export function mdBlock(text, cls = 'md') {
  return h('div', { class: cls, html: md(text) });
}

/** A span containing inline-rendered markdown (options, chips, labels). */
export function mdSpan(text, cls = '') {
  return h('span', { class: cls, html: mdInline(text) });
}

/**
 * A spoken name for a control whose visible label contains typeset maths
 * (which screen readers handle unevenly), or null when plain text will do.
 * Use it as the `aria-label` of option buttons and chips.
 */
export function spokenName(text) {
  return /\$/.test(String(text || '')) ? mdText(text) || null : null;
}

/** Normalise free text for forgiving comparison. */
export function normText(str, caseSensitive = false) {
  let out = String(str == null ? '' : str).normalize('NFKC').trim().replace(/\s+/g, ' ');
  out = out.replace(/^[\s.,;:!?"'“”‘’()]+|[\s.,;:!?"'“”‘’()]+$/g, '');
  return caseSensitive ? out : out.toLowerCase();
}

/** Does `value` match any accepted answer (string or RegExp)? */
export function matchesAny(value, answers, caseSensitive = false) {
  const v = normText(value, caseSensitive);
  return answers.some((a) => {
    if (a instanceof RegExp) return a.test(String(value).trim());
    return normText(a, caseSensitive) === v;
  });
}

/** Numeric closeness with an optional absolute tolerance. */
export function numbersMatch(value, answer, tolerance = null) {
  if (!Number.isFinite(value)) return false;
  if (tolerance != null) return Math.abs(value - answer) <= tolerance + 1e-12;
  return Math.abs(value - answer) <= 1e-6 * Math.max(1, Math.abs(answer));
}

/**
 * "3,301" is 3301 to some learners and 3.301 to others. Given the typed text, return the second
 * reading when there is one (a single comma followed by exactly three digits), else NaN.
 */
export function commaAlternative(text) {
  const t = String(text == null ? '' : text).trim().replace(/[−–—]/g, '-');
  return /^-?\d{1,3},\d{3}$/.test(t) ? Number(t.replace(',', '.')) : NaN;
}

/**
 * "40.000" is forty thousand to much of the world and forty to the rest. parseNumber gives the
 * decimal-point reading; this gives the other one when the text has that shape (groups of exactly
 * three digits after each point, and a leading group that is not zero), else NaN. A checker accepts
 * whichever reading is right.
 */
export function dotThousandsAlternative(text) {
  const t = String(text == null ? '' : text).trim().replace(/[−–—]/g, '-');
  return /^-?[1-9]\d{0,2}(\.\d{3})+$/.test(t) ? Number(t.replace(/\./g, '')) : NaN;
}

/** A finished number: 12, -0.5, 3/4, 1 1/2, 1,5 (decimal comma), optionally with a leading = or a trailing %. */
const PLAIN_NUMBER = /^=?\s*-?\s*(\d+([.,]\d+)?|[.,]\d+|\d+\s*\/\s*\d+|\d+\s+\d+\s*\/\s*\d+)\s*%?$/;
export const isPlainNumber = (text) => PLAIN_NUMBER.test(String(text == null ? '' : text).trim().replace(/[−–—]/g, '-'));

/** Shuffle indices, avoiding the identity order when it would give the answer away. */
export function shuffledOrder(n, rng, avoidIdentity = true) {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return idx;
  for (let attempt = 0; attempt < 12; attempt++) {
    const out = rng.shuffle(idx);
    if (!avoidIdentity || out.some((v, i) => v !== i)) return out;
  }
  return idx.slice().reverse();
}

export const LETTERS = 'ABCDEFGHIJKLMNOP';
