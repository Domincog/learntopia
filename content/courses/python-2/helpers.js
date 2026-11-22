/**
 * Helpers for the "Python II: Building Programs" lessons.
 *
 * Every program shown in this course is real: the helpers below run code in
 * the same mini-Python interpreter the learner uses, so the answers to
 * generated questions are computed, never typed in by hand.
 */
import { run } from '../../../src/lang/minipy.js';

/**
 * A program written as a template literal, with the indentation of the
 * surrounding JavaScript removed:
 *
 *   const code = py`
 *     def double(n):
 *         return n * ${k}
 *   `;
 */
export function py(strings, ...values) {
  let text = '';
  strings.forEach((s, i) => { text += s + (i < values.length ? String(values[i]) : ''); });
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)[0].length));
  return lines.map((l) => l.slice(Math.min(indent, /^ */.exec(l)[0].length))).join('\n');
}

/** What a program prints, without the final line break. Throws if the program fails. */
export function out(code) {
  const result = run(code);
  if (result.error) throw new Error(`lesson program failed: ${result.error.text} (line ${result.error.line})\n${code}`);
  return result.stdout.replace(/\n$/, '');
}

/** The error that stops a (deliberately broken) program: { type, message, line, … }. Throws if it runs fine. */
export function errorOf(code) {
  const result = run(code);
  if (!result.error) throw new Error(`lesson program was expected to fail, but it ran:\n${code}`);
  return result.error;
}

/** The outcome of a program that may or may not fail: { ok, out, error } with error = the error type or null. */
export function outcome(code) {
  const result = run(code);
  return { ok: !result.error, out: result.stdout.replace(/\n$/, ''), error: result.error ? result.error.type : null };
}

/** A read-only, numbered listing of a program (a figure). */
export const listing = (code, extra = {}) => ({ type: 'code', lang: 'python', numbers: true, code, ...extra });

/** A program in the step-by-step tracer (a figure, or the widget of an interact step). */
export const tracer = (code, extra = {}) => ({ type: 'py-trace', code, ...extra });

/** A program in the free-play editor (a figure, or the widget of an interact step). */
export const runner = (code, extra = {}) => ({ type: 'py-run', code, ...extra });

/** Check for tracer steps: the learner must reach the end of the program. */
export const reachedEnd = (message = 'Keep pressing Step until the program has finished.') => (s) => s.done || message;

/** A Python list literal for a JavaScript array of numbers or strings (nested arrays too). */
export function lit(value) {
  if (Array.isArray(value)) return `[${value.map(lit).join(', ')}]`;
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return String(value);
}

/**
 * A row of boxes, one per character or item, with the indexes written above
 * (and, on request, the negative indexes below). Used to picture a string or
 * a list as a sequence of numbered positions.
 *
 *   boxes('python', { negative: true, mark: [1, 2, 3] })
 */
export function boxes(items, { negative = false, mark = [], mono = true, alt = '', cell = 56 } = {}) {
  const list = typeof items === 'string' ? items.split('') : items;
  const n = list.length;
  const pad = 14;
  const top = 34;
  const h = 50;
  const width = pad * 2 + n * cell;
  const height = top + h + (negative ? 34 : 12);
  const marked = new Set(mark);
  const parts = ['<g class="stroke-ink" stroke-width="2.5">'];
  list.forEach((_, i) => {
    parts.push(`<rect class="${marked.has(i) ? 'fill-yellow-soft' : 'fill-blue-soft'}" x="${pad + i * cell}" y="${top}" width="${cell}" height="${h}" rx="9"/>`);
  });
  parts.push('</g>');
  list.forEach((item, i) => {
    const x = pad + i * cell + cell / 2;
    parts.push(`<text class="fig-label fig-mono" style="fill:var(--orange-text)" x="${x}" y="${top - 11}" text-anchor="middle">${i}</text>`);
    parts.push(`<text class="fig-label-lg${mono ? ' fig-mono' : ''}" x="${x}" y="${top + h / 2 + 8}" text-anchor="middle">${String(item).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`);
    if (negative) parts.push(`<text class="fig-label fig-mono" style="fill:var(--violet-text)" x="${x}" y="${top + h + 24}" text-anchor="middle">${i - n}</text>`);
  });
  return { type: 'svg', viewBox: `0 0 ${width} ${height}`, maxWidth: Math.min(520, width + 40), alt, content: parts.join('') };
}

/**
 * A grid of numbers drawn as rows of cells, with row numbers down the left
 * and column numbers along the top.
 *
 *   gridFigure([[1, 2, 3], [4, 5, 6]], { mark: [[1, 2]] })
 */
export function gridFigure(rows, { mark = [], alt = '', cell = 54 } = {}) {
  const nr = rows.length;
  const nc = rows[0].length;
  const left = 62;
  const top = 44;
  const width = left + nc * cell + 14;
  const height = top + nr * cell + 12;
  const marked = new Set(mark.map(([r, c]) => `${r},${c}`));
  const parts = ['<g class="stroke-ink" stroke-width="2.5">'];
  rows.forEach((row, r) => row.forEach((_, c) => {
    parts.push(`<rect class="${marked.has(`${r},${c}`) ? 'fill-yellow-soft' : 'fill-blue-soft'}" x="${left + c * cell}" y="${top + r * cell}" width="${cell}" height="${cell}" rx="8"/>`);
  }));
  parts.push('</g>');
  for (let c = 0; c < nc; c++) parts.push(`<text class="fig-label fig-mono" style="fill:var(--violet-text)" x="${left + c * cell + cell / 2}" y="${top - 10}" text-anchor="middle">${c}</text>`);
  rows.forEach((row, r) => {
    parts.push(`<text class="fig-label fig-mono" style="fill:var(--orange-text)" x="${left - 14}" y="${top + r * cell + cell / 2 + 6}" text-anchor="end">${r}</text>`);
    row.forEach((v, c) => parts.push(`<text class="fig-label-lg fig-mono" x="${left + c * cell + cell / 2}" y="${top + r * cell + cell / 2 + 8}" text-anchor="middle">${v}</text>`));
  });
  parts.push(`<text class="fig-label-sm" style="fill:var(--orange-text)" x="${left - 14}" y="${top - 10}" text-anchor="end">row</text>`);
  return { type: 'svg', viewBox: `0 0 ${width} ${height}`, maxWidth: Math.min(420, width + 40), alt, content: parts.join('') };
}
