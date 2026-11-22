/**
 * py-run — a small free-play Python runner: editable code, a Run button and
 * the output. Programs run in the built-in mini-Python interpreter
 * (src/lang/minipy.js, a teaching subset of Python 3).
 *
 * {
 *   type: 'py-run',
 *   code: 'print("Hello")',      // the program the editor starts with
 *   rows: 5,                     // minimum editor height in lines (default: fits the code)
 *   autorun: false,              // true: run once straight away, so the output is visible
 *   label: 'Output',             // heading of the output panel
 * }
 *
 * State: { code, runs, ok, stdout, error, edited }
 *   runs    how many times the learner pressed Run
 *   ok      the last run finished without an error (null before the first run)
 *   stdout  what the last run printed
 *   error   type of the error that stopped the last run ('NameError', …) or null
 *   edited  the code differs from the starting code
 *
 * As the answer to an `interact` step, check the output of the last run:
 *   check: (s) => s.stdout.trim() === 'cherry' || 'Change the number in the brackets.'
 *   solution: { code: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[2])' }
 * setState({ code }) puts the code in the editor and runs it.
 */
import { h, addStyles, icon } from './kit.js';
import { play } from '../core/audio.js';
import { highlight } from '../core/highlight.js';
import { run } from '../lang/minipy.js';
import { createEditor, createOutput, bringIntoView } from '../lang/editor.js';

addStyles('py-run', `
  .widget-py-run { width: 100%; max-width: 640px; margin: 0 auto; display: grid; gap: var(--s2); min-width: 0; }
  .widget-py-run > * { min-width: 0; }
  .widget-py-run .py-run-bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s2); }
  .widget-py-run .py-run-bar .btn { min-height: 44px; padding: 0.5rem 1.1rem; }
  .widget-py-run .py-run-tip { margin-left: auto; font-size: var(--fs-xs); font-weight: 700; color: var(--ink-3); }
  @media not ((hover: hover) and (pointer: fine)) { .widget-py-run .py-run-tip { display: none; } }
  .widget-py-run.is-compact pre.code { font-size: 0.78rem; padding: var(--s2) var(--s3); }
`);

const clean = (code) => String(code == null ? '' : code).replace(/^\n+|\s+$/g, '');

export default function create(spec, env) {
  const initial = clean(spec.code);

  if (env.compact) {
    // inside a choice option: just the listing
    return { el: h('div.is-compact', h('pre.code', h('code', { html: highlight(initial, 'python') }))) };
  }

  let readOnly = !!env.readOnly;
  let runs = 0;
  let last = null;

  const editor = createEditor({
    value: initial,
    rows: Math.min(14, Math.max(3, spec.rows || initial.split('\n').length + 1)),
    label: spec.alt || 'Python program you can change and run',
    onRun: () => runNow(true),
  });
  const output = createOutput({ label: spec.label || 'Output', idle: 'Press Run to see what the program prints.' });

  function execute() {
    last = run(editor.getValue(), { maxSteps: spec.maxSteps });
    output.showResult(last);
    editor.markError(last.error ? last.error.line : 0);
  }

  function runNow(byLearner) {
    if (readOnly) return;
    execute();
    if (byLearner) {
      runs += 1;
      play(last.error ? 'pop' : 'tick');
      bringIntoView(output.el);
      env.announce(last.error ? `The program stopped with a ${last.error.type}.` : 'The program ran.');
      env.onChange(getState());
    }
  }

  const runBtn = h('button.btn.btn-blue', { type: 'button', onclick: () => runNow(true) }, icon('play', 16), 'Run');
  const resetBtn = h('button.btn.btn-ghost', { type: 'button' }, icon('reset', 16), 'Reset');
  resetBtn.addEventListener('click', () => {
    if (readOnly) return;
    editor.setValue(initial);
    last = null;
    output.showIdle();
    env.onChange(getState());
  });

  const getState = () => ({
    code: editor.getValue(),
    runs,
    ok: last ? last.ok : null,
    stdout: last ? last.stdout : '',
    error: last && last.error ? last.error.type : null,
    edited: clean(editor.getValue()) !== initial,
  });

  const el = h('div',
    editor.el,
    h('div.py-run-bar', runBtn, resetBtn, h('span.py-run-tip', 'Ctrl + Enter runs it')),
    output.el,
  );
  if (readOnly) editor.setReadOnly(true);
  if (spec.autorun) execute();

  return {
    el,
    getState,
    setState(next) {
      if (!next || typeof next.code !== 'string') return;
      editor.setValue(clean(next.code));
      execute();
      runs = Math.max(runs, next.runs || 1);
    },
    setReadOnly(v) {
      readOnly = !!v;
      editor.setReadOnly(readOnly);
      runBtn.disabled = readOnly;
      resetBtn.disabled = readOnly;
    },
  };
}

export const examples = [
  { title: 'py-run — change the program and run it', spec: { type: 'py-run', code: 'name = "Ada"\nfor i in range(3):\n    print("Hello", name, i)' } },
];
