/**
 * Grading for `code` steps. Pure (no DOM): the step renderer
 * (src/player/types/code.js) and the content validator share it.
 *
 *   gradeCode(step, source)  -> { status, message, result, checks }
 *   checkCodeStep(step)      -> string[]   problems with the step itself (empty when fine)
 *
 * Step fields that matter here (all documented in docs/CODE-STEPS.md):
 *
 *   expect:  'exact printed output'          compared after trimming the end of each line
 *   tests:   [
 *     { call: 'area(3, 4)', expect: 12 },            // any expression; compared by value
 *     { call: 'area(1, 2.5)', repr: '2.5' },         // …or by its exact Python repr
 *     { call: 'greet("Ada")', stdout: 'Hello, Ada' },// what the call prints
 *     { stdout: 'Pass', set: { score: 60 } },        // run again with `score = 60`, check the output
 *     { call: 'total', expect: 6, set: { n: 3 } },   // …or check a variable after that run
 *   ]
 *   hidden:  [ …same shape… ]   run after the visible tests; feedback stays generic
 *   require / forbid: 'for' | /regex/ | { pattern, message }   (or an array of those)
 *   wrong:   [['10', 'feedback for this particular wrong output'], …]
 *   feedback: ({ stdout, source, result, check }) => 'message' | null
 *            (check: the failing check — { kind, label, expected, actual, error, set })
 *
 * Any test (and require / forbid entry) may carry its own `message`.
 */
import { run, syntaxError, codeOnly, pyRepr, toPy } from './minipy.js';

/** Output as it is compared: line ends trimmed, trailing blank lines dropped. */
export function normalizeOutput(text) {
  return String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
}

/** A value as inline code for a feedback message (markdown). */
function code(text, max = 60) {
  let t = String(text).replace(/`/g, "'").replace(/\n/g, '⏎');
  if (t.length > max) t = `${t.slice(0, max - 1)}…`;
  return t === '' ? '(nothing)' : `\`${t}\``;
}

const expectedRepr = (value) => { try { return pyRepr(toPy(value)); } catch { return String(value); } };

/** Does a value from the program (as plain JS) match the author's expected value? */
export function valuesMatch(actual, expected) {
  if (typeof expected === 'number') {
    if (typeof actual === 'bigint') return Number.isInteger(expected) && actual === BigInt(expected);
    if (typeof actual !== 'number') return false;
    if (Number.isInteger(expected) && Number.isInteger(actual)) return actual === expected;
    return Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected));
  }
  if (typeof expected === 'bigint') return typeof actual === 'bigint' ? actual === expected : (typeof actual === 'number' && Number.isInteger(actual) && BigInt(actual) === expected);
  if (expected === null || typeof expected === 'string' || typeof expected === 'boolean') return actual === expected;
  if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length && expected.every((e, i) => valuesMatch(actual[i], e));
  if (typeof expected === 'object') {
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false;
    const keys = Object.keys(expected);
    return keys.length === Object.keys(actual).length && keys.every((k) => Object.prototype.hasOwnProperty.call(actual, k) && valuesMatch(actual[k], expected[k]));
  }
  return false;
}

/** One sentence saying how the printed output differs from what was expected. */
export function describeOutputDiff(actualRaw, expectedRaw) {
  const actual = normalizeOutput(actualRaw);
  const expected = normalizeOutput(expectedRaw);
  if (actual === expected) return null;
  if (actual === '') return 'Your program did not print anything. Use `print(...)` to show the result.';
  const a = actual.split('\n');
  const e = expected === '' ? [] : expected.split('\n');
  if (!e.length) return `Nothing should be printed here, but your program printed ${code(a[0])}.`;
  let i = 0;
  while (i < a.length && i < e.length && a[i] === e[i]) i++;
  const squash = (s) => s.replace(/\s+/g, '');
  let note = '';
  if (i < a.length && i < e.length) {
    if (a[i].toLowerCase() === e[i].toLowerCase()) note = ' Only the capital letters differ.';
    else if (squash(a[i]) === squash(e[i])) note = ' Only the spacing differs.';
    else if (squash(a[i]).replace(/[.,;:!?'"]/g, '') === squash(e[i]).replace(/[.,;:!?'"]/g, '')) note = ' Only the punctuation differs.';
  }
  if (i >= a.length) {
    return `${a.length === 1 ? 'The first line is right' : `The first ${a.length} lines are right`}, but more output is expected. Next should come ${code(e[i])}.`;
  }
  if (i >= e.length) {
    return `${e.length === 1 ? 'The first line is right' : `The first ${e.length} lines are right`}, but then your program prints something extra: ${code(a[i])}.`;
  }
  if (e.length === 1 && a.length === 1) return `The program should print ${code(e[0])}, but it printed ${code(a[0])}.${note}`;
  return `Line ${i + 1} of the output should be ${code(e[i])}, but your program printed ${code(a[i])}.${note}`;
}

/* ------------------------------------------------------- require / forbid */

function ruleList(value) {
  if (value == null) return [];
  return (Array.isArray(value) ? value : [value]).map((r) => (r && typeof r === 'object' && !(r instanceof RegExp) ? r : { pattern: r }));
}

function ruleMatches(pattern, source) {
  const bare = codeOnly(source);
  if (pattern instanceof RegExp) { pattern.lastIndex = 0; return pattern.test(bare); }
  const text = String(pattern);
  if (/^\w+$/.test(text)) return new RegExp(`(?<![\\w.])${text}(?!\\w)`).test(bare);
  const squash = (s) => s.replace(/[ \t]+/g, '');
  return squash(bare).includes(squash(text));
}

const ruleLabel = (pattern) => (pattern instanceof RegExp ? String(pattern) : String(pattern));

/* ------------------------------------------------------------------ tests */

function inputsLabel(set) {
  return Object.keys(set).map((k) => `${k} = ${expectedRepr(set[k])}`).join(', ');
}

function describeRuntimeError(error, { inCall = null } = {}) {
  const where = error.line && !error.inCall ? ` on line ${error.line}` : '';
  if (error.type === 'TimeoutError') return `${inCall ? `${code(inCall)} never finished` : 'Your program did not finish'}: ${error.message}`;
  return `${inCall ? `${code(inCall)} stopped` : 'Your program stopped'}${where} with an error — **${error.type}**: ${error.message.replace(/[`*$]/g, '')}`;
}

function runTest(step, source, test, baseResult) {
  const hasSet = test.set && typeof test.set === 'object';
  const prefix = hasSet ? `With \`${inputsLabel(test.set).replace(/`/g, "'")}\`: ` : '';
  const options = { maxSteps: step.maxSteps, inputs: hasSet ? test.set : undefined };
  const check = { label: test.label || null, ok: false, hidden: !!test.hidden, expected: null, actual: null, message: null, error: null, set: hasSet ? test.set : null };

  // A test without `call` looks at what the whole program prints.
  if (test.call == null) {
    const result = hasSet ? run(source, options) : baseResult;
    check.label = check.label || (hasSet ? inputsLabel(test.set) : 'Output');
    check.expected = normalizeOutput(test.stdout);
    check.actual = normalizeOutput(result.stdout);
    check.kind = 'output';
    if (hasSet && Object.keys(test.set).some((k) => !Object.prototype.hasOwnProperty.call(result.reprs, k) && !result.error)) {
      const missing = Object.keys(test.set).find((k) => !Object.prototype.hasOwnProperty.call(result.reprs, k));
      check.message = `Keep the line \`${missing} = …\` from the starting code (outside any function): the checker changes that value to try other cases.`;
      return check;
    }
    if (result.error) { check.error = result.error; check.actual = result.error.text; check.message = prefix + describeRuntimeError(result.error); return check; }
    if (check.actual === check.expected) { check.ok = true; return check; }
    const diff = describeOutputDiff(result.stdout, test.stdout);
    check.message = prefix ? prefix + diff.charAt(0).toLowerCase() + diff.slice(1) : diff;
    return check;
  }

  // Otherwise evaluate an expression after a fresh run of the program.
  const expr = String(test.call);
  const result = run(source, options);
  check.label = check.label || (hasSet ? `${inputsLabel(test.set)} → ${expr}` : expr);
  check.kind = 'call';
  if (result.error) { check.error = result.error; check.actual = result.error.text; check.message = prefix + describeRuntimeError(result.error); return check; }
  const got = result.call(expr, { maxSteps: step.maxSteps });
  const fnName = (/^\s*([A-Za-z_]\w*)\s*\(/.exec(expr) || [])[1];
  const isCall = !!fnName;
  if (got.error) {
    check.error = got.error;
    check.actual = got.error.text;
    if (got.error.type === 'NameError' && got.error.inCall) {
      const missing = (/name '(\w+)'/.exec(got.error.message) || [])[1];
      check.message = isCall && missing === fnName
        ? `Your program does not define a function called \`${fnName}\`. Check the name on the \`def\` line.`
        : `Your program does not have a variable called \`${missing}\`. Check the spelling.`;
    } else if (got.error.type === 'TypeError' && got.error.inCall && /positional argument|not callable/.test(got.error.message)) {
      check.message = /not callable/.test(got.error.message)
        ? `\`${fnName}\` should be a function (made with \`def\`), but it holds an ordinary value.`
        : `${code(expr)} could not be called: ${got.error.message}. Check the parameters on the \`def\` line.`;
    } else {
      check.message = prefix + describeRuntimeError(got.error, { inCall: expr });
    }
    return check;
  }
  const wantsValue = Object.prototype.hasOwnProperty.call(test, 'expect');
  const wantsRepr = typeof test.repr === 'string';
  const wantsOut = typeof test.stdout === 'string';
  check.expected = wantsRepr ? test.repr : wantsValue ? expectedRepr(test.expect) : wantsOut ? normalizeOutput(test.stdout) : null;
  check.actual = wantsValue || wantsRepr ? got.repr : normalizeOutput(got.stdout);
  const valueOk = (!wantsValue || valuesMatch(got.value, test.expect)) && (!wantsRepr || got.repr === test.repr);
  const outOk = !wantsOut || normalizeOutput(got.stdout) === normalizeOutput(test.stdout);
  if (valueOk && outOk) { check.ok = true; return check; }
  if (!valueOk) {
    const printed = normalizeOutput(got.stdout);
    const expectedText = wantsRepr ? test.repr : expectedRepr(test.expect);
    const expectedPrinted = wantsValue && typeof test.expect === 'string' ? test.expect : expectedText;
    if (got.value === null && isCall && printed !== '' && (printed === expectedText || printed === expectedPrinted)) {
      check.message = `${prefix}${code(expr)} *printed* ${code(printed)} but did not **return** it. Replace \`print\` with \`return\` so the caller gets the value.`;
    } else if (got.value === null && isCall) {
      check.message = `${prefix}${code(expr)} should give ${code(expectedText)}, but it returned \`None\`. Does every path through the function reach a \`return\`?`;
    } else if (isCall) {
      check.message = `${prefix}${code(expr)} should give ${code(expectedText)}, but your function returned ${code(got.repr)}.`;
    } else {
      check.message = `${prefix}${code(expr)} should be ${code(expectedText)}, but it is ${code(got.repr)}.`;
    }
    if (wantsValue && !wantsRepr && typeof test.expect === 'number' && typeof got.value === 'string' && got.value.trim() === String(test.expect)) {
      check.message += ' That is text, not a number: look at the quotes.';
    }
    return check;
  }
  const diff = describeOutputDiff(got.stdout, test.stdout);
  check.message = `${prefix}${code(expr)} prints the wrong thing. ${diff}`;
  return check;
}

/* ------------------------------------------------------------------ grade */

/**
 * Grade a program against a code step.
 * status: 'syntax' (could not be read — no attempt should be used),
 *         'fail', or 'pass'.
 */
export function gradeCode(step, source) {
  const out = { status: 'fail', message: null, result: null, checks: [], rule: null };
  const src = String(source == null ? '' : source);
  const bad = syntaxError(src);
  if (bad) {
    out.status = 'syntax';
    out.result = { ok: false, stdout: '', error: { ...bad, phase: 'syntax' }, globals: {}, reprs: {} };
    out.message = `Line ${bad.line} cannot be read yet — **${bad.type}**: ${bad.message.replace(/[`*$]/g, '')}. Fix it and check again.`;
    return out;
  }
  const result = run(src, { maxSteps: step.maxSteps });
  out.result = result;
  // Feedback the author wrote for mistakes they saw coming. `check` is the
  // failing check: { kind, label, expected, actual, error, set }.
  const authorMessage = (check) => {
    const got = normalizeOutput(result.stdout);
    for (const [wrongOut, text] of Array.isArray(step.wrong) ? step.wrong : []) {
      if (normalizeOutput(wrongOut) === got && !result.error) return String(text);
    }
    if (typeof step.feedback === 'function') {
      try { const msg = step.feedback({ stdout: result.stdout, source: src, result, check: check || null }); if (msg) return String(msg); } catch { /* an author's helper must never break grading */ }
    }
    return null;
  };

  // 1. the program's own output
  if (step.expect != null) {
    const check = { kind: 'output', label: 'Output', ok: false, hidden: false, expected: normalizeOutput(step.expect), actual: normalizeOutput(result.stdout), message: null, error: result.error };
    if (result.error) {
      check.actual = result.error.text;
      check.message = authorMessage(check) || describeRuntimeError(result.error);
    } else if (check.actual === check.expected) check.ok = true;
    else check.message = authorMessage(check) || describeOutputDiff(result.stdout, step.expect);
    out.checks.push(check);
    if (!check.ok) { out.message = check.message; return out; }
  } else if (result.error) {
    out.message = authorMessage({ kind: 'output', label: 'Output', expected: null, actual: result.error.text, error: result.error, set: null }) || describeRuntimeError(result.error);
    return out;
  }

  // 2. tests, visible ones first
  const visible = Array.isArray(step.tests) ? step.tests : [];
  const hidden = (Array.isArray(step.hidden) ? step.hidden : []).map((t) => ({ ...t, hidden: true }));
  for (const test of [...visible, ...hidden]) {
    const check = runTest(step, src, test, result);
    out.checks.push(check);
    if (check.ok) continue;
    if (test.message) out.message = String(test.message);
    else if (check.hidden) out.message = 'That works for the examples shown here, but not in every case. Try your program with a few other values.';
    else out.message = authorMessage(check) || check.message;
    return out;
  }

  // 3. how it was written
  for (const rule of ruleList(step.forbid)) {
    if (!ruleMatches(rule.pattern, src)) continue;
    out.rule = rule;
    out.message = rule.message || `That gives the right result, but this task asks you to do it without ${code(ruleLabel(rule.pattern))}.`;
    return out;
  }
  for (const rule of ruleList(step.require)) {
    if (ruleMatches(rule.pattern, src)) continue;
    out.rule = rule;
    out.message = rule.message || `That gives the right result, but this task asks you to use ${code(ruleLabel(rule.pattern))}.`;
    return out;
  }

  out.status = 'pass';
  return out;
}

/* --------------------------------------------------------------- validate */

const TEST_KEYS = new Set(['call', 'expect', 'repr', 'stdout', 'set', 'label', 'message', 'hidden']);

/**
 * Check a code step against itself. Returns a list of problems (empty when
 * the step is fine): the solution must pass, the starter must not.
 */
export function checkCodeStep(step) {
  const problems = [];
  if (!step || typeof step !== 'object') return ['step is not an object'];
  if (typeof step.solution !== 'string' || !step.solution.trim()) return ['needs a "solution" program'];
  const tests = Array.isArray(step.tests) ? step.tests : [];
  const hidden = Array.isArray(step.hidden) ? step.hidden : [];
  if (step.expect == null && !tests.length) problems.push('needs "expect" (printed output) or "tests"');
  if (step.expect != null && typeof step.expect !== 'string') problems.push('"expect" must be a string (the exact printed output)');
  if (step.tests != null && !Array.isArray(step.tests)) problems.push('"tests" must be an array');
  if (step.hidden != null && !Array.isArray(step.hidden)) problems.push('"hidden" must be an array of tests');
  [...tests, ...hidden].forEach((t, i) => {
    const where = `test ${i + 1}`;
    if (!t || typeof t !== 'object') { problems.push(`${where} is not an object`); return; }
    for (const key of Object.keys(t)) if (!TEST_KEYS.has(key)) problems.push(`${where} has an unknown field "${key}"`);
    if (t.call != null && typeof t.call !== 'string') problems.push(`${where}: "call" must be a string of Python`);
    if (t.call == null && typeof t.stdout !== 'string') problems.push(`${where} needs "call" (an expression) or "stdout"`);
    if (t.call != null && !('expect' in t) && typeof t.repr !== 'string' && typeof t.stdout !== 'string') problems.push(`${where} (${t.call}) needs "expect", "repr" or "stdout"`);
    if (t.set != null && (typeof t.set !== 'object' || Array.isArray(t.set))) problems.push(`${where}: "set" must be an object of variable values`);
  });
  for (const rule of [...ruleList(step.require), ...ruleList(step.forbid)]) {
    if (!(rule.pattern instanceof RegExp) && typeof rule.pattern !== 'string') problems.push('"require" / "forbid" entries must be strings, regular expressions or { pattern, message }');
  }
  if (problems.length) return problems;

  let graded;
  try { graded = gradeCode(step, step.solution); } catch (err) { return [`grading the solution threw: ${err.message}`]; }
  if (graded.status !== 'pass') problems.push(`the solution does not pass its own check — ${graded.message}`);
  for (const line of step.solution.split('\n')) if (/\t/.test(line)) { problems.push('the solution contains a tab character; indent with spaces'); break; }

  if (typeof step.starter === 'string' && step.starter.trim()) {
    let start;
    try { start = gradeCode(step, step.starter); } catch (err) { return [...problems, `grading the starter threw: ${err.message}`]; }
    if (start.status === 'pass') problems.push('the starter already passes every check, so there is nothing to do');
    if (/\t/.test(step.starter)) problems.push('the starter contains a tab character; indent with spaces');
  }
  if (graded.status === 'pass' && Array.isArray(step.wrong)) {
    const right = step.expect != null ? normalizeOutput(step.expect) : normalizeOutput(graded.result.stdout);
    step.wrong.forEach((w, i) => {
      if (!Array.isArray(w) || w.length !== 2) problems.push(`wrong[${i}] must be [output, message]`);
      else if (normalizeOutput(w[0]) === right) problems.push(`wrong[${i}] lists the correct output as a mistake`);
    });
  }
  return problems;
}
