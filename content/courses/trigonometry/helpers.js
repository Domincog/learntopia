/**
 * Helpers shared by the lessons of "Trigonometry: Circles & Waves".
 */
import { gcd } from '../../kit.js';

export const D2R = Math.PI / 180;
export const sind = (deg) => Math.sin(deg * D2R);
export const cosd = (deg) => Math.cos(deg * D2R);
export const tand = (deg) => Math.tan(deg * D2R);
export const TRIG = { sin: sind, cos: cosd, tan: tand };

/** A value as it appears in a three-figure table: fixed(0.5) -> "0.500". */
export const fixed = (v, places = 3) => { const out = v.toFixed(places); return /^-0\.?0*$/.test(out) ? out.slice(1) : out; };
/** The same value as a number: what a learner who uses the table multiplies by. */
export const tabled = (v, places = 3) => Number(v.toFixed(places));
/** Round half up to `places` decimals, without float fuzz. */
export const roundTo = (v, places = 1) => { const p = 10 ** places; return Math.round((v + Math.sign(v) * 1e-9) * p) / p; };

/**
 * A small table of trig values, as markdown.
 *   trigTable([35])                 one row with sin, cos and tan
 *   trigTable([35, 36, 37], ['tan'])  a strip of one function
 */
export function trigTable(angles, fns = ['sin', 'cos', 'tan']) {
  const head = `| angle | ${fns.map((f) => `$\\${f}$`).join(' | ')} |`;
  const rule = `|:-----:|${fns.map(() => ':----:').join('|')}|`;
  const rows = angles.map((a) => `| ${a}° | ${fns.map((f) => fixed(TRIG[f](a))).join(' | ')} |`);
  return [head, rule, ...rows].join('\n');
}

/**
 * A multiple of π as TeX: piTex(3, 4) -> "\frac{3\pi}{4}", piTex(1, 1) -> "\pi", piTex(2, 1) -> "2\pi", piTex(0, 1) -> "0".
 * The fraction is reduced first.
 */
export function piTex(n, d = 1, { inline = false } = {}) {
  if (n === 0) return '0';
  const g = gcd(n, d) || 1;
  let a = n / g;
  let b = d / g;
  if (b < 0) { a = -a; b = -b; }
  const sign = a < 0 ? '-' : '';
  const top = Math.abs(a) === 1 ? '\\pi' : `${Math.abs(a)}\\pi`;
  if (b === 1) return `${sign}${top}`;
  return inline ? `${sign}${top}/${b}` : `${sign}\\frac{${top}}{${b}}`;
}

/** The reduced fraction n/d as plain text a learner could type: "3/4", "2", "-1/2". */
export function fracText(n, d) {
  const g = gcd(n, d) || 1;
  let a = n / g;
  let b = d / g;
  if (b < 0) { a = -a; b = -b; }
  return b === 1 ? String(a) : `${a}/${b}`;
}

/**
 * The key for an answer that is to be rounded: the rounded calculator value, and a
 * tolerance wide enough to accept every honest route to it. `routes` are the values
 * other sensible methods arrive at before rounding (three-figure table values,
 * rounding in the middle of a two-step calculation); each is accepted both as it
 * stands and rounded to `places` decimals.
 *   keyFor(16.782, [16.78], 1) -> { answer: 16.8, tolerance: 0.06, display: '16.8' }
 */
export function keyFor(exact, routes = [], places = 1) {
  const answer = roundTo(exact, places);
  const half = 0.5 / 10 ** places;
  let reach = Math.abs(exact - answer);
  for (const v of routes) reach = Math.max(reach, Math.abs(v - answer), Math.abs(roundTo(v, places) - answer));
  const tolerance = Math.max(half, Math.ceil((reach + half * 0.2) * 1000) / 1000);
  return { answer, tolerance, display: answer.toFixed(places) };
}
