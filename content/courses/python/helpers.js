/**
 * Helpers for the "Thinking in Code" lessons.
 *
 * Every program shown in this course is real: the helpers below run code in
 * the same mini-Python interpreter the learner uses, so answers to generated
 * questions are computed, never typed in by hand.
 */
import { run } from '../../../src/lang/minipy.js';

/**
 * A program written as a template literal, with the indentation of the
 * surrounding JavaScript removed:
 *
 *   const code = py`
 *     total = 0
 *     for n in range(${a}, ${b}):
 *         total = total + n
 *     print(total)
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

/** A read-only, numbered listing of a program (a figure). */
export const listing = (code, extra = {}) => ({ type: 'code', lang: 'python', numbers: true, code, ...extra });

/** A program in the step-by-step tracer (a figure, or the widget of an interact step). */
export const tracer = (code, extra = {}) => ({ type: 'py-trace', code, ...extra });

/** Check for tracer steps: the learner must reach the end of the program. */
export const reachedEnd = (message = 'Keep going until the program has finished.') => (s) => s.done || message;

/** The error that stops a (deliberately broken) program: { type, message, line, … }. Throws if it runs fine. */
export function errorOf(code) {
  const result = run(code);
  if (!result.error) throw new Error(`lesson program was expected to fail, but it ran:\n${code}`);
  return result.error;
}
