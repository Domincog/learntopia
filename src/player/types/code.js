/**
 * `code` — write (or repair) a short Python program, run it, and have it
 * checked. Programs run in the built-in mini-Python interpreter
 * (src/lang/minipy.js); nothing leaves the browser.
 *
 *   starter:   program text the editor starts with
 *   solution:  a program that passes (shown on "Show answer")          [required]
 *   expect:    exact printed output (line ends and trailing blank lines are ignored)
 *   tests:     [{ call: 'area(3, 4)', expect: 12 },            value of an expression
 *               { call: 'greet("Ada")', stdout: 'Hello, Ada' },   what a call prints
 *               { set: { score: 30 }, stdout: 'Fail' },           run again with other values
 *               { call: 'area(1, 2.5)', repr: '2.5' }]            exact repr (int versus float)
 *   hidden:    more tests, same shape; failing one gives only generic feedback
 *   require / forbid:  'for' | /regex/ | { pattern, message } (or arrays of those),
 *              tested against the code with comments and string contents removed
 *   wrong:     [['10', 'feedback for this particular wrong output'], …]
 *   feedback:  ({ stdout, source, result }) => 'message' | null
 *   rows:      minimum height of the editor in lines (default: fits the starter, 5–14)
 *   showGoal:  false hides the "what the check looks for" panel
 *
 * Needs `expect` or `tests` (normalize.js enforces it). Grading lives in
 * src/lang/check-code-step.js, which the content validator shares.
 *
 * Run shows the output without grading and costs nothing. Check grades:
 * a program that cannot be read (a syntax error) is reported as `invalid`,
 * so no attempt is used; anything else is right or wrong with a specific
 * message — which test failed, expected versus actual.
 */
import { h } from '../../core/dom.js';
import { addStyles, icon } from '../../widgets/kit.js';
import { highlight } from '../../core/highlight.js';
import { play } from '../../core/audio.js';
import { run, pyRepr, toPy } from '../../lang/minipy.js';
import { gradeCode, normalizeOutput } from '../../lang/check-code-step.js';
import { createEditor, createOutput, errorCard, bringIntoView } from '../../lang/editor.js';

addStyles('step-code', `
  .code-step { display: grid; gap: var(--s3); min-width: 0; }
  .code-step > * { min-width: 0; }
  /* In the wide side column the checklist and the output share a row, which saves a screenful of height. */
  @media (min-width: 1000px) {
    .step[data-split] .code-step { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; }
    .step[data-split] .code-step > * { grid-column: 1 / -1; }
    .step[data-split] .code-step > .code-goal { grid-column: 1; }
    .step[data-split] .code-step > .code-goal + * { grid-column: 2; }
  }
  .code-step-bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s2); }
  .code-step-bar .btn { min-height: 44px; padding: 0.5rem 1.1rem; }
  .code-step-tip { margin-left: auto; font-size: var(--fs-xs); font-weight: 700; color: var(--ink-3); }
  @media not ((hover: hover) and (pointer: fine)) { .code-step-tip { display: none; } }

  .code-goal { border: var(--bw) dashed var(--hair); border-radius: var(--r); padding: 10px 12px; display: grid; gap: 6px; }
  .code-goal-title { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); }
  .code-goal-list { list-style: none; display: grid; gap: 6px; }
  .code-goal-row { display: flex; align-items: flex-start; gap: 8px; font-size: var(--fs-sm); line-height: 1.5; }
  .code-goal-mark { flex: none; width: 20px; height: 20px; margin-top: 1px; display: grid; place-items: center; border: 2px solid var(--hair); border-radius: 50%; color: transparent; }
  .code-goal-row.is-pass .code-goal-mark { border-color: var(--green); background: var(--green); color: var(--on-color); }
  .code-goal-row.is-fail .code-goal-mark { border-color: var(--red); background: var(--red); color: var(--on-color); }
  .code-goal-text { min-width: 0; overflow-wrap: anywhere; }
  .code-goal-text code { font-size: 0.92em; }
  .code-goal-text pre { margin: 4px 0 0; padding: 6px 10px; border-radius: 8px; background: var(--sunken); font-family: var(--font-mono); font-size: 0.88rem; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; font-variant-ligatures: none; }
  .code-goal-got { display: block; color: var(--red-text); font-weight: 700; }
  .code-goal-row.is-pass .code-goal-got { display: none; }

  .code-diff { margin: 0; font-family: var(--font-mono); font-size: 0.92rem; line-height: 1.55; font-variant-ligatures: none; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 15em; overflow: auto; }
  .code-diff span { display: block; padding: 0 6px; border-radius: 4px; min-height: 1.55em; }
  .code-diff span.is-diff { background: var(--red-soft); box-shadow: inset 3px 0 0 var(--red); }
  .code-diff span.is-missing { color: var(--ink-3); font-style: italic; border: 1px dashed var(--hair); }
  .code-diff-label { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
  .code-pass { display: flex; align-items: center; gap: 6px; font-weight: 800; color: var(--green-text); }

  .code-solution { border: var(--bw) solid var(--blue); border-radius: var(--r); background: var(--blue-soft); overflow: hidden; }
  .code-solution > summary { cursor: pointer; padding: 8px 12px; font-weight: 800; color: var(--blue-text); }
  .code-solution-body { display: grid; gap: 8px; padding: 0 12px 12px; }
  .code-solution pre.code { background: var(--surface); }
  .code-solution-out { font-size: var(--fs-sm); color: var(--ink-2); }
  .code-solution-out pre { margin: 4px 0 0; font-family: var(--font-mono); font-size: 0.88rem; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--ink); }
`);

const reprOf = (value) => { try { return pyRepr(toPy(value)); } catch { return String(value); } };
const setLabel = (set) => Object.keys(set).map((k) => `${k} = ${reprOf(set[k])}`).join(', ');

/** One row of the goal panel: what a visible test expects, in words. */
function describeTest(test) {
  const parts = [];
  if (test.set) parts.push('With ', h('code', setLabel(test.set)), ': ');
  if (test.label) { parts.push(test.label); return parts; }
  if (test.call == null) {
    const text = normalizeOutput(test.stdout);
    // one short line of output fits on the same line as its inputs, which keeps a list of cases compact
    if (test.set && text && !text.includes('\n') && text.length <= 20) parts.push('prints ', h('code', text));
    else parts.push(test.set ? 'prints' : 'The program prints', h('pre', text || '(nothing)'));
    return parts;
  }
  parts.push(h('code', { html: highlight(String(test.call), 'python') }));
  const wantsValue = 'expect' in test || typeof test.repr === 'string';
  if (wantsValue) parts.push(' gives ', h('code', typeof test.repr === 'string' ? test.repr : reprOf(test.expect)));
  if (typeof test.stdout === 'string') {
    const text = normalizeOutput(test.stdout);
    parts.push(wantsValue ? ' and prints ' : ' prints ', text.includes('\n') ? h('pre', text) : h('code', text || '(nothing)'));
  }
  return parts;
}

/** The learner's output with the first wrong line marked. */
function outputDiff(actual, expected) {
  const a = actual === '' ? [] : actual.split('\n');
  const e = expected === '' ? [] : expected.split('\n');
  let first = 0;
  while (first < a.length && first < e.length && a[first] === e[first]) first++;
  const pre = h('pre.code-diff');
  a.slice(0, 200).forEach((line, i) => pre.appendChild(h('span', { class: i === first ? 'is-diff' : null }, line || ' ')));
  if (first >= a.length && first < e.length) pre.appendChild(h('span.is-missing', a.length ? '(more output expected here)' : '(nothing printed)'));
  return pre;
}

function listing(code) {
  const pre = h('pre.code.has-lines', { 'data-lang': 'python' });
  String(code).replace(/\s+$/, '').split('\n').forEach((line, i) => {
    pre.appendChild(h('span.code-line', h('span.code-num', { 'aria-hidden': 'true' }, String(i + 1)), h('code', { html: highlight(line, 'python') || '&nbsp;' })));
  });
  return pre;
}

export default function code(step, env) {
  const starter = typeof step.starter === 'string' ? step.starter.replace(/^\n+|\s+$/g, '') : '';
  const visibleTests = Array.isArray(step.tests) ? step.tests : [];
  const hiddenCount = Array.isArray(step.hidden) ? step.hidden.length : 0;
  const longest = Math.max(starter.split('\n').length, String(step.solution).trim().split('\n').length);
  const rows = Math.min(14, Math.max(5, step.rows || longest + 1));
  let locked = false;
  let resetArmed = 0;

  const editor = createEditor({
    value: starter,
    rows,
    label: 'Your program',
    onInput: (value) => { clearMarks(); env.onReady(value.trim() !== ''); },
    onRun: () => runNow(),
  });
  const output = createOutput({ idle: 'Press Run to try your program. Press Check when you think it is right.' });

  /* ------------------------------------------------------------- goal panel */
  const rowsEl = [];
  const goal = h('div.code-goal', h('div.code-goal-title', 'What the check looks for'));
  const goalList = h('ul.code-goal-list');
  goal.appendChild(goalList);
  const addRow = (content) => {
    const got = h('span.code-goal-got');
    const row = h('li.code-goal-row', h('span.code-goal-mark', { 'aria-hidden': 'true' }, icon('check', { size: 13, stroke: 3.5 })), h('span.code-goal-text', content, got));
    row.got = got;
    goalList.appendChild(row);
    rowsEl.push(row);
    return row;
  };
  if (step.expect != null) addRow(['The program prints', h('pre', normalizeOutput(step.expect) || '(nothing)')]);
  for (const test of visibleTests) addRow(describeTest(test));
  const hiddenRow = hiddenCount ? addRow(`${hiddenCount === 1 ? 'One more check' : `${hiddenCount} more checks`} with other values`) : null;
  if (hiddenRow) rowsEl.pop();
  const showGoal = step.showGoal !== false && goalList.children.length > 0;

  function clearMarks() {
    for (const row of [...rowsEl, hiddenRow]) {
      if (!row) continue;
      row.classList.remove('is-pass', 'is-fail');
      row.got.textContent = '';
    }
  }

  function markChecks(graded) {
    clearMarks();
    const visible = graded.checks.filter((c) => !c.hidden);
    visible.forEach((check, i) => {
      const row = rowsEl[i];
      if (!row) return;
      row.classList.add(check.ok ? 'is-pass' : 'is-fail');
      row.firstChild.replaceChildren(icon(check.ok ? 'check' : 'x', { size: 13, stroke: 3.5 }));
      if (!check.ok && check.kind === 'call' && check.actual != null) row.got.textContent = check.error ? `stopped: ${check.error.type}` : `yours: ${check.actual}`;
    });
    if (hiddenRow) {
      const hidden = graded.checks.filter((c) => c.hidden);
      const failed = hidden.some((c) => !c.ok);
      if (failed || (graded.status === 'pass')) {
        hiddenRow.classList.add(failed ? 'is-fail' : 'is-pass');
        hiddenRow.firstChild.replaceChildren(icon(failed ? 'x' : 'check', { size: 13, stroke: 3.5 }));
      }
    }
  }

  /* -------------------------------------------------------------- run/check */
  function runNow() {
    if (locked) return;
    const result = run(editor.getValue(), { maxSteps: step.maxSteps });
    clearMarks();
    output.showResult(result);
    editor.markError(result.error ? result.error.line : 0);
    play(result.error ? 'pop' : 'tick');
    bringIntoView(output.el);
  }

  function showGrade(graded) {
    markChecks(graded);
    const result = graded.result;
    const failed = graded.checks.find((c) => !c.ok) || null;
    output.showResult(result);
    editor.markError(result.error ? result.error.line : 0);
    if (graded.status === 'pass') {
      output.body.appendChild(h('div.code-pass', icon('circle-check', 18), 'Every check passed.'));
      return;
    }
    if (result.error) return;
    if (failed && failed.error) {
      // the program itself ran, but a test call (or a run with other values) failed
      output.body.appendChild(errorCard(failed.error, { title: `${failed.error.type} while checking ${failed.label}` }));
      if (!failed.error.inCall) editor.markError(failed.error.line);
    } else if (failed && failed.kind === 'output' && failed.expected != null && failed.actual != null && !failed.hidden) {
      const isMain = step.expect != null && graded.checks.indexOf(failed) === 0;
      output.body.replaceChildren(
        h('div.code-diff-label', isMain ? 'Your output' : `Your output — ${failed.label}`),
        outputDiff(failed.actual, failed.expected),
        h('div.code-diff-label', 'Expected'),
        h('pre.code-diff', failed.expected.split('\n').map((line) => h('span', line || ' '))),
      );
    }
  }

  const runBtn = h('button.btn.btn-blue', { type: 'button', onclick: runNow }, icon('play', 16), 'Run');
  const resetBtn = h('button.btn.btn-ghost', { type: 'button' }, icon('reset', 16), 'Reset');
  resetBtn.addEventListener('click', () => {
    if (locked) return;
    if (editor.getValue().replace(/\s+$/, '') === starter) return;
    if (Date.now() - resetArmed > 4000) {
      resetArmed = Date.now();
      resetBtn.lastChild.textContent = 'Really start over?';
      setTimeout(() => { if (Date.now() - resetArmed >= 3900) { resetArmed = 0; resetBtn.lastChild.textContent = 'Reset'; } }, 4000);
      return;
    }
    resetArmed = 0;
    resetBtn.lastChild.textContent = 'Reset';
    editor.setValue(starter);
    clearMarks();
    output.showIdle();
    env.onReady(starter.trim() !== '');
  });

  const solutionBox = h('details.code-solution', { hidden: true });
  function fillSolution(title) {
    if (solutionBox.firstChild) return;
    const res = run(step.solution, { maxSteps: step.maxSteps });
    const printed = normalizeOutput(res.stdout);
    solutionBox.append(
      h('summary', title),
      h('div.code-solution-body', listing(step.solution), printed ? h('div.code-solution-out', 'It prints:', h('pre', printed)) : null),
    );
    solutionBox.hidden = false;
  }

  const el = h('div.code-step',
    editor.el,
    h('div.code-step-bar', runBtn, starter ? resetBtn : null, h('span.code-step-tip', 'Ctrl + Enter runs it')),
    showGoal ? goal : null,
    output.el,
    solutionBox,
  );

  if (starter.trim() !== '') setTimeout(() => env.onReady(true), 0);

  return {
    el,
    check() {
      const graded = gradeCode(step, editor.getValue());
      showGrade(graded);
      if (graded.status !== 'pass') bringIntoView(output.el);
      if (graded.status === 'syntax') return { invalid: true, message: graded.message };
      if (graded.status === 'pass') return { correct: true };
      return { correct: false, message: graded.message };
    },
    retry() { /* the output panel already shows what went wrong */ },
    reveal() {
      fillSolution('A program that works');
      solutionBox.open = true;
    },
    lock() {
      locked = true;
      editor.setReadOnly(true);
      runBtn.disabled = true;
      resetBtn.disabled = true;
      const mine = editor.getValue().replace(/\s+/g, ' ').trim();
      if (!solutionBox.firstChild && mine !== String(step.solution).replace(/\s+/g, ' ').trim()) fillSolution('Compare with our solution');
    },
    focus() { editor.focus(); },
    solve() { editor.setValue(step.solution); clearMarks(); env.onReady(true); },
    editor,
  };
}
