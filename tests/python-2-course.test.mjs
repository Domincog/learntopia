// Independent checks of the "Python II: Building Programs" (python-2) course.
//
// Every program a lesson shows is run three ways and the three must agree:
//   1. what the lesson says it prints (its answer key or its wording),
//   2. the mini interpreter the site ships (src/lang/minipy.js),
//   3. real CPython, when python3 (3.12 or newer) is installed. Without it the
//      comparison with CPython is skipped and the rest still runs.
// The expected outputs in this file were worked out by hand or with a formula
// of their own (plain JavaScript, never the interpreter); they are not copied
// from what the lessons computed.
//
//   node --test tests/python-2-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { run } from '../src/lang/minipy.js';
import { gradeCode, normalizeOutput } from '../src/lang/check-code-step.js';
import course from '../content/courses/python-2/course.js';

const SEEDS = 200;
const LESSON_IDS = ['strings', 'loop-patterns', 'nested-data', 'functions-in-depth', 'recursion', 'build-a-program'];

/* ------------------------------------------------------------------ setup */

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/python-2/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, 'python-2', meta.id);
  }
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(1000 + k * 7919), id));
const allSteps = () => Object.entries(lessons).flatMap(([lesson, l]) => l.steps.map((step) => [lesson, step]));

const isProgram = (w) => w && (w.type === 'code' || w.type === 'py-trace' || w.type === 'py-run') && typeof w.code === 'string';
/** The program a step shows: its listing / tracer / editor figure, or the widget of an interact step. */
const codeOf = (step, i = 0) => {
  const found = [...step.figures, step.widget].filter(isProgram);
  assert.ok(found[i], `${step.id} shows a program`);
  return found[i].code;
};
const bare = (text) => String(text).replace(/`/g, '');
const correctTexts = (step) => step.options.filter((o) => o.correct).map((o) => o.text);
const j = (...lines) => lines.join('\n');
const sum = (list) => list.reduce((a, b) => a + b, 0);
const ints = (text) => text.split(', ').map(Number);
const listOf = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/** Every generated step must be named here by the test that re-solves it. */
const TESTED_GENERATED = new Set();
const generated = (lesson, id, n = SEEDS) => { TESTED_GENERATED.add(`${lesson}/${id}`); return variants(lesson, id, n); };

/* ----------------------------------------------- the two Pythons, side by side */

const probe = spawnSync('python3', ['-c', 'import sys; print(sys.version_info[:2] >= (3, 12))'], { encoding: 'utf8' });
const HAVE_PYTHON = probe.status === 0 && probe.stdout.trim() === 'True';

// Runs each program in CPython with a budget of executed lines (so a runaway
// loop comes back as a timeout) and records, for the first lines that run,
// the line number and the variables of the running scope.
const HARNESS = `
import sys, json, io, contextlib
LIMIT = 400000
class Budget(BaseException):
    pass
def run_one(src):
    buf = io.StringIO(); res = {'error': None, 'events': []}; count = [0]
    def snap(frame):
        return {k: repr(v) for k, v in frame.f_locals.items() if not k.startswith('__') and not callable(v)}
    def tracer(frame, event, arg):
        if frame.f_code.co_filename != '<t>':
            return None
        if event == 'line' or (event == 'call' and frame.f_code.co_name != '<module>'):
            count[0] += 1
            if count[0] > LIMIT:
                raise Budget()
            if len(res['events']) < 400:
                res['events'].append([event, frame.f_lineno, snap(frame)])
        return tracer
    try:
        code = compile(src, '<t>', 'exec')
        with contextlib.redirect_stdout(buf):
            sys.settrace(tracer)
            try:
                exec(code, {})
            finally:
                sys.settrace(None)
    except SyntaxError as e:
        res['error'] = [type(e).__name__, e.lineno, e.msg]
    except Budget:
        res['error'] = ['TimeoutError', None, '']
    except BaseException as e:
        tb = e.__traceback__; line = None
        while tb:
            if tb.tb_frame.f_code.co_filename == '<t>': line = tb.tb_lineno
            tb = tb.tb_next
        res['error'] = [type(e).__name__, line, str(e)]
    res['stdout'] = buf.getvalue()[:20000]
    return res
json.dump([run_one(s) for s in json.load(sys.stdin)], sys.stdout)`;

function cpython(sources) {
  const py = spawnSync('python3', ['-I', '-c', HARNESS], { input: JSON.stringify(sources), encoding: 'utf8', maxBuffer: 1 << 28 });
  assert.equal(py.status, 0, py.stderr);
  return JSON.parse(py.stdout);
}

/** One program in the mini interpreter: { stdout, out, error: [type, line, message] | null, trace }. */
function mini(src) {
  const r = run(src, { trace: true, maxTrace: 400 });
  return { stdout: r.stdout, out: r.stdout.replace(/\n$/, ''), error: r.error ? [r.error.type, r.error.line, r.error.message] : null, trace: r.trace || [] };
}

const UNREADABLE = /^(Syntax|Indentation|Tab)Error$/;

/**
 * Run programs in the mini interpreter and, when it is installed, in CPython,
 * and insist that both print the same and stop with the same kind of error on
 * the same line. Returns the mini interpreter's results.
 *
 * Two allowances, both for programs no lesson relies on line by line:
 * - scrambled: true (Parsons orders that cannot be read at all): the two
 *   Pythons only have to agree that the program cannot be read; which kind of
 *   syntax error it is, and on which line, may differ.
 * - A RecursionError is compared by kind and by the first lines printed. The
 *   mini interpreter allows 200 waiting calls and CPython about 1000, so
 *   CPython prints more before it gives up, and it names a different line.
 */
function both(sources, { scrambled = false } = {}) {
  const unique = [...new Set(sources)];
  const mine = new Map(unique.map((src) => [src, mini(src)]));
  if (HAVE_PYTHON) {
    const real = cpython(unique);
    unique.forEach((src, i) => {
      const m = mine.get(src);
      const r = real[i];
      m.real = r;
      const kind = (e) => (e ? e[0] : null);
      if (kind(m.error) === 'TimeoutError' || kind(r.error) === 'TimeoutError') {
        assert.equal(kind(m.error), kind(r.error), `only one of the two Pythons runs for ever:\n${src}`);
        return;
      }
      if (kind(m.error) === 'RecursionError' || kind(r.error) === 'RecursionError') {
        assert.equal(kind(m.error), kind(r.error), `only one of the two Pythons runs out of calls:\n${src}`);
        assert.deepEqual(m.stdout.split('\n').slice(0, 20), r.stdout.split('\n').slice(0, 20), src);
        return;
      }
      if (scrambled && m.error && r.error && UNREADABLE.test(m.error[0]) && UNREADABLE.test(r.error[0])) return;
      assert.equal(m.stdout, r.stdout, `the mini interpreter and CPython print different things for:\n${src}`);
      assert.deepEqual(m.error && m.error.slice(0, 2), r.error && r.error.slice(0, 2), `different error (type, line) for:\n${src}\nCPython: ${r.error}\nmini: ${m.error}`);
    });
  }
  return sources.map((src) => mine.get(src));
}

/** Check that programs print what this file worked out, in both Pythons. cases: [source, expected output]. */
function printsAll(cases) {
  const results = both(cases.map((c) => c[0]));
  cases.forEach(([src, expected], i) => {
    assert.equal(results[i].error, null, src);
    assert.equal(results[i].out, String(expected), src);
  });
}

test('real Python is available for the three-way comparison', (t) => {
  if (!HAVE_PYTHON) { t.skip('python3 >= 3.12 not found: the lessons were only checked against the mini interpreter'); return; }
  const [r] = both(['print("python"[1:4], "abc"[::-1], -3 % 26, [[0] * 2] * 2, (1, 2))']);
  assert.equal(r.out, 'yth cba 23 [[0, 0], [0, 0]] (1, 2)');
});

/* ------------------------------------------------------- shape of the course */

test('the course has six lessons in two chapters, shaped as the brief asks', () => {
  assert.deepEqual(course.chapters.map((c) => c.lessons.map((l) => l.id)), [LESSON_IDS.slice(0, 3), LESSON_IDS.slice(3)]);
  assert.deepEqual(course.requires, ['python']);
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps;
    assert.ok(steps.length >= 12 && steps.length <= 19, `${id}: ${steps.length} steps`);   // 15 to 19 since the teaching screens were added
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: next`);
    assert.equal(steps[0].mode, 'predict', `${id} opens with a prediction`);
    const review = steps.filter((s) => s.review);
    assert.ok(review.length >= 2 && review.length <= 4, `${id}: ${review.length} review steps`);
    const handsOn = steps.filter((s) => s.type === 'interact');
    assert.ok(handsOn.length >= 2, `${id}: ${handsOn.length} hands-on steps`);
    assert.ok(new Set(steps.map((s) => s.type)).size >= 6, `${id}: variety of step types`);
    let infoRun = 0;
    for (const s of steps) { infoRun = s.type === 'info' ? infoRun + 1 : 0; assert.ok(infoRun < 3, `${id}: three info steps in a row`); }
    for (const s of steps) {
      const concrete = resolveStep(s, makeRng(3), s.id);
      if (concrete.graded || concrete.mode === 'predict' || concrete.type === 'interact') assert.ok(concrete.explain, `${id}/${s.id} has no explain`);
      if (s.type === 'code') assert.ok(concrete.hints.length >= 1, `${id}/${s.id}: a code step without hints`);
      if (s.review) assert.ok(!/as we (just )?saw|above|previous step|earlier/i.test(concrete.text), `${id}/${s.id}: a review step must stand alone`);
    }
  }
});

test('no text contains undefined, NaN or an empty slot', () => {
  for (const [lesson, step] of allSteps()) {
    for (let k = 0; k < (step.gen ? SEEDS : 1); k++) {
      const s = resolveStep(step, makeRng(77 + k * 131), step.id);
      const blob = JSON.stringify(s, (key, value) => (typeof value === 'function' ? undefined : value));
      assert.ok(!/undefined|NaN|\[object Object\]/.test(blob), `${lesson}/${step.id} seed ${k}: ${/.{0,60}(undefined|NaN|\[object Object\]).{0,60}/.exec(blob)}`);
    }
  }
  for (const lesson of Object.values(lessons)) assert.ok(!/undefined|NaN/.test(lesson.recap.join(' ') + lesson.next));
});

test('every choice has exactly one correct option and no duplicates; other answer lists are clean too', () => {
  for (const [lesson, step] of allSteps()) {
    for (let k = 0; k < (step.gen ? SEEDS : 1); k++) {
      const s = resolveStep(step, makeRng(5 + k * 97), step.id);
      const where = `${lesson}/${step.id} seed ${k}`;
      const distinct = (list) => assert.equal(new Set(list).size, list.length, `${where} has duplicates: ${list}`);
      if (s.type === 'choice') {
        assert.equal(s.options.filter((o) => o.correct).length, 1, where);
        distinct(s.options.map((o) => o.text));
        for (const o of s.options) assert.ok(!(o.correct && o.why), `${where}: the correct option carries "why it is wrong" feedback`);
        if (s.mode !== 'predict') for (const o of s.options) assert.ok(o.correct || o.why, `${where}: a wrong option has no feedback: ${o.text}`);
      }
      if (s.type === 'multi') {
        assert.ok(s.options.some((o) => o.correct) && s.options.some((o) => !o.correct), where);
        distinct(s.options.map((o) => o.text));
      }
      if (s.type === 'match') { distinct(s.pairs.map((p) => p[0])); distinct(s.pairs.map((p) => p[1])); }
      if (s.type === 'order') distinct(s.items);
      if (s.type === 'bucket') distinct(s.items.map((i) => i.text));
      if (s.type === 'numeric') {
        assert.ok(Number.isFinite(s.answer), where);
        distinct(s.wrong.map((w) => w[0]));
        for (const [value] of s.wrong) assert.notEqual(value, s.answer, `${where}: a "wrong" value equals the answer`);
      }
    }
  }
});

/* ------------------------------------------- "what does this print?" (static) */

/** A Caesar shift written for this file: lower-case letters move, everything else stays. */
const caesar = (text, key) => Array.from(text, (ch) => (ch >= 'a' && ch <= 'z' ? String.fromCharCode(((ch.charCodeAt(0) - 97 + key) % 26 + 26) % 26 + 97) : ch)).join('');
const PLAIN = 'well done! you can read secret messages now';
const KEY = 17;

// [lesson, step, what I worked out by hand, where the lesson commits to an answer]
const PRINTS = [
  ['strings', 'hook', 'yth', (s) => bare(correctTexts(s)[0])],
  ['strings', 'explore', 'yth', null],
  ['strings', 'watch-reverse', 'pots', (s) => /`s`, `ts`, `ots`, `(\w+)`/.exec(s.explain)[1]],
  ['strings', 'method-trap', 'hello', (s) => bare(correctTexts(s)[0])],
  ['strings', 'fstring', 'Ada has 6 books', (s) => bare(correctTexts(s)[0])],
  ['loop-patterns', 'hook', '7', (s) => bare(correctTexts(s)[0])],
  ['loop-patterns', 'be-computer', '7', null],
  ['loop-patterns', 'enumerate', '0 Ana\n1 Bo\n2 Cy', (s) => /whole output is (.*)\./.exec(s.explain)[1].split(', ').map(bare).join('\n')],
  ['loop-patterns', 'pairs', 'S red\nS green\nS blue\nM red\nM green\nM blue', null],
  ['nested-data', 'hook', '7', (s) => bare(correctTexts(s)[0])],
  ['nested-data', 'tap-cell', '', null],
  ['nested-data', 'alias-trap', '[[5, 0, 0], [5, 0, 0]]', (s) => bare(correctTexts(s)[0])],
  ['nested-data', 'records', 'Tom', (s) => bare(correctTexts(s)[0])],
  ['nested-data', 'watch-group', "{'a': ['ant', 'ape'], 'b': ['bee']}", (s) => /The result: `(.*?)`\./.exec(s.explain)[1]],
  ['functions-in-depth', 'hook', '6\n15', (s) => bare(correctTexts(s)[0]).replace(', then ', '\n')],
  ['functions-in-depth', 'be-computer', '24', (s) => /hands (\d+) back to line 7/.exec(s.explain)[1]],
  ['functions-in-depth', 'keywords', '*hi*', (s) => bare(correctTexts(s)[0])],
  ['functions-in-depth', 'watch-tuple', '11 3', (s) => /hands back `\((\d+), (\d+)\)`/.exec(s.explain).slice(1).join(' ')],
  ['recursion', 'hook', '3\n2\n1\nLift off!', (s) => bare(correctTexts(s)[0]).replace(', then ', ', ').split(', ').join('\n')],
  ['recursion', 'watch-countdown', '2\n1\nLift off!', null],
  ['recursion', 'watch-fact', '6', (s) => /3 × 2 = \*\*(\d+)\*\*/.exec(s.explain)[1]],
  ['recursion', 'down-up', 'down 2\ndown 1\nturn\nup 1\nup 2', (s) => bare(correctTexts(s)[0]).split(', ').join('\n')],
  ['recursion', 'fib-cost', '55 after 177 calls', (s) => `55 after ${/`fib\(10\)` takes (\d+) calls/.exec(s.explain)[1]} calls`],
  ['build-a-program', 'hook', '5.0', (s) => /the program prints `(.*?)`/.exec(s.text)[1]],
  ['build-a-program', 'crack', caesar(PLAIN, KEY - 1), null],
  // the worked examples on the teaching screens ("teach before you ask"): what each prints, worked out by hand
  ['strings', 'teach-immutable', 'house\nmouse', (s) => `house\n${/line 4 still prints `(\w+)`/.exec(s.text)[1]}`],
  ['strings', 'example-chain', 'TEA TIME\nteatime\nTea Time', null],
  ['strings', 'teach-fstring', 'Rex is 4 years old\nNext year: 5\n{pet} is {age}', null],
  ['strings', 'example-words', '#red#kite#park', null],
  ['loop-patterns', 'teach-zip', 'Mon 7\nTue 9\nWed 6', (s) => { const m = /`day` is `"(\w+)"` and `h` is (\d)\. On the second they are `"(\w+)"` and (\d)/.exec(s.text); return `${m[1]} ${m[2]}\n${m[3]} ${m[4]}\nWed 6`; }],
  ['loop-patterns', 'teach-nested', '0 0\n0 1\n1 0\n1 1\n2 0\n2 1', null],
  ['loop-patterns', 'example-while', '4\n0 1', null],
  ['loop-patterns', 'example-filter', '[12, 7, 20]', null],
  ['loop-patterns', 'example-search', '-2\nNone', (s) => `${/returns at (-\d)\./.exec(s.text)[1]}\n${/answers `(\w+)`: nothing found/.exec(s.text)[1]}`],
  ['nested-data', 'example-rows', '8\n4\n3\n4\n9\n3\n5', (s) => [/adds up its items: (\d)\./.exec(s.text)[1], .../each row, (\d) and then (\d)\./.exec(s.text).slice(1), .../each row: (\d), (\d), (\d), (\d)\./.exec(s.text).slice(1)].join('\n')],
  ['nested-data', 'teach-shared-rows', '[[7, 0], [7, 0]]\n[[7, 0], [0, 0]]', null],
  ['nested-data', 'teach-records', 'Oslo\nRome', null],
  ['functions-in-depth', 'teach-defaults', 'Hi!\nHi?\nHi!!!', null],
  ['functions-in-depth', 'teach-local', '10\n15', (s) => `${/line 10 still prints (\d+)\./.exec(s.text)[1]}\n15`],
  ['functions-in-depth', 'example-refactor', 'Warm days: 2', (s) => /Both versions print `(.+?)`/.exec(s.text)[1]],
  ['recursion', 'example-trace', '3', (s) => /`length\("cat"\)` \| 1 \+ `length\("at"\)` = (\d) \|/.exec(s.text)[1]],
  ['recursion', 'teach-nested-lists', 'True False\n5', null],
  ['build-a-program', 'teach-wrap', '16\n28\n2\nc', (s) => { const m = /`q` is at position (\d+)\. Twelve places on is (\d+),[^:]*: that is (\d), the position of `(\w)`/.exec(s.text); return m.slice(1).join('\n'); }],
];

// Programs that are shown because they stop with an error: [lesson, step, kind of error, line].
const CRASHES = [
  ['strings', 'immutable', 'TypeError', 2],
  ['functions-in-depth', 'local-trap', 'UnboundLocalError', 4],
  ['recursion', 'no-base', 'RecursionError', null],
  ['build-a-program', 'teach-assert', 'AssertionError', 6],       // the worked example of a claim that fails
];

// Generated steps and the bug hunt: their programs are run by the tests further down.
const RUN_ELSEWHERE = [
  'strings/slice-practice', 'loop-patterns/first-match', 'loop-patterns/zip-total', 'loop-patterns/nested-count',
  'nested-data/grid-practice', 'nested-data/records-total', 'functions-in-depth/defaults', 'functions-in-depth/two-values',
  'recursion/rec-practice', 'build-a-program/catch-bug', 'build-a-program/wrap',
];

test('static programs print what the lesson says, in the mini interpreter and in real Python', () => {
  const steps = PRINTS.map(([lesson, id]) => one(lesson, id));
  const results = both(steps.map((s) => codeOf(s)));
  PRINTS.forEach(([lesson, id, expected, stated], i) => {
    assert.equal(results[i].error, null, `${lesson}/${id}`);
    assert.equal(results[i].out, expected, `${lesson}/${id}: output`);
    if (stated) assert.equal(stated(steps[i]), expected, `${lesson}/${id}: the lesson's stated answer`);
  });
  // every program shown as a listing, tracer or editor is covered by a test in this file
  const covered = new Set([...PRINTS, ...CRASHES].map(([l, id]) => `${l}/${id}`).concat(RUN_ELSEWHERE));
  for (const [lesson, step] of allSteps()) {
    const s = resolveStep(step, makeRng(1), step.id);
    if ([...s.figures, s.widget].some(isProgram)) assert.ok(covered.has(`${lesson}/${step.id}`), `${lesson}/${step.id} shows a program that no test runs`);
  }
});

test('programs that are shown because they crash: the kind of error and the line the lesson names', () => {
  const steps = CRASHES.map(([lesson, id]) => one(lesson, id));
  const results = both(steps.map((s) => codeOf(s)));
  CRASHES.forEach(([lesson, id, type, line], i) => {
    assert.ok(results[i].error, `${lesson}/${id} should stop with an error`);
    assert.equal(results[i].error[0], type, `${lesson}/${id}`);
    if (line) assert.equal(results[i].error[1], line, `${lesson}/${id}`);
  });

  // strings/immutable: the correct option and the explanation quote Python's own words
  const frozen = steps[0];
  assert.deepEqual(correctTexts(frozen), ['It stops with a `TypeError` on line 2']);
  assert.ok(frozen.explain.includes("`TypeError: 'str' object does not support item assignment`"));
  if (HAVE_PYTHON) assert.equal(results[0].real.error[2], "'str' object does not support item assignment");
  assert.equal(results[0].stdout, '');                              // nothing is printed: not `cat`, not `bat`, not `b`

  // functions-in-depth/local-trap
  const reach = steps[1];
  assert.deepEqual(correctTexts(reach), ['It stops with an error on line 4']);
  assert.ok(reach.explain.includes('So line 4 asks for the local `total`') && reach.explain.includes('`UnboundLocalError`'));
  assert.equal(results[1].stdout, '');

  // recursion/no-base: it prints 3, 2, 1, 0, -1 … and then gives up
  const lines = results[2].stdout.split('\n').filter(Boolean);
  assert.deepEqual(lines.slice(0, 6), ['3', '2', '1', '0', '-1', '-2']);  // "3, 2, 1, 0, -1, -2…"
  assert.equal(lines.length, 200);                                   // "Learntopia stops at 200"
  assert.ok(lines.every((l, k) => Number(l) === 3 - k));
  assert.match(steps[2].explain, /\*\*RecursionError\*\*/);
  assert.match(steps[2].explain, /Real Python allows about a thousand; Learntopia stops at 200/);
  if (HAVE_PYTHON) {
    const limit = Number(spawnSync('python3', ['-I', '-c', 'import sys; print(sys.getrecursionlimit())'], { encoding: 'utf8' }).stdout);
    assert.equal(limit, 1000);
  }

  // build-a-program/teach-assert: the true claim passes in silence, the false one stops the program before its last line
  assert.equal(results[3].out, 'The first claim holds');
  const claim = steps[3];
  assert.ok(claim.text.includes('The claim on line 4 is true') && claim.text.includes('The claim on line 6 is false') && claim.text.includes('with an AssertionError, and line 7 never runs'));
  assert.deepEqual(codeOf(claim).split('\n').filter((line) => line.startsWith('assert')).length, 2);
  assert.match(codeOf(claim).split('\n')[5], /^assert double\(4\) == 9$/);
});

test('more facts the lessons state about those programs', () => {
  const lump = raw('functions-in-depth', 'code-refactor').starter;
  const programs = {
    // strings
    sliceWays: 'word = "python"\nprint(word[3:6], word[3:], word[-3:], word)',
    idea: 'word = "python"\nprint(word[0], word[-1], len(word), word[1:4], word[:2], word[2:], "th" in word, word[:2] + word[2:] == word, len(word[1:4]) == 4 - 1)',
    // "word[a:b] has b - a characters, as long as the slice stays inside the word": true inside, false as soon as it does not
    sliceLength: 'word = "python"\nprint(len(word[1:4]), len(word[0:6]), len(word[3:6]), len(word[2:2]), len(word[1:40]), len(word[4:2]), len(word[8:10]))',
    bat: 'name = "cat"\nname = "b" + name[1:]\nprint(name)',
    reverseKeepsWord: `${codeOf(one('strings', 'watch-reverse'))}\nprint(word)`,
    keepUpper: 'shout = "hello"\nshout = shout.upper()\nprint(shout)',
    noF: 'name = "Ada"\nn = 3\nprint("{name} has {n * 2} books")\nprint(f"{name.upper()} has {n} books")',
    tidyParts: 'print("ada@example.com".split("@"))',
    palindromeShortcut: 'clean = "neveroddoreven"\nprint(clean[::-1] == clean, "stop"[::-1])',
    // loop-patterns
    million: 'count = 0\nfor a in range(1000):\n    for b in range(1000):\n        count = count + 1\nprint(count)'.replace(/1000/g, '100'),
    collatz6: 'n = 6\nseen = []\nwhile n != 1:\n    if n % 2 == 0:\n        n = n // 2\n    else:\n        n = 3 * n + 1\n    seen.append(n)\nprint(seen, len(seen))',
    // nested-data
    hookRow: 'grid = [[5, 1, 8], [7, 3, 9]]\nprint(grid[1], len(grid), len(grid[0]))',
    sameRow: 'grid = [[0] * 3] * 2\nprint(grid[0] is grid[1])\nrows = []\nfor r in range(2):\n    rows.append([0] * 3)\nprint(rows[0] is rows[1])',
    lastRow: 'grid = [[1, 2], [3, 4], [5, 6]]\nprint(grid[-1], grid[-1][-1])',
    // functions-in-depth
    lump,
    tuple: 't = (11, 3)\nprint(t[0], len(t))\nt[0] = 5',
    areaStep: 'def area(w, h):\n    return w * h\nprint(area(3, 4), area(3, 4) * 2)',
    // recursion
    factShort: 'def fact(n):\n    if n == 1:\n        return 1\n    return n * fact(n - 1)\nprint(fact(3), fact(2), fact(1))',
    sumFails: 'print(sum([2, 3]))\nprint(sum([4, [5]]))',
    plusJoins: 'print([1, 2] + [3], isinstance([1], list), isinstance(1, list))',
    // build-a-program
    averages: 'def average(nums):\n    return sum(nums) / len(nums)\nprint(average([7]), average([0, 0]), average([-2, 2]))\nprint(average([]))',
    assertTrue: 'assert 1 + 1 == 2\nprint("carried on")',
    assertFalse: 'print("before")\nassert 1 + 1 == 3\nprint("after")',
    negativeRemainder: 'print(-3 % 26, (0 - 3) % 26, (3 - 26) % 26)',
    roundTrip: `${raw('build-a-program', 'code-decode').solution}\nprint(decode(encode("round trip!", 7), 7) == "round trip!", encode("hello", 3), decode("khoor", 3))`,
  };
  const keys = Object.keys(programs);
  const r = Object.fromEntries(both(keys.map((k) => programs[k])).map((res, i) => [keys[i], res]));

  assert.equal(r.sliceWays.out, 'hon hon hon python');             // three ways to `hon`; "None of this changed word"
  assert.equal(r.idea.out, 'p n 6 yth py thon True True True');
  assert.equal(r.sliceLength.out, '3 6 3 0 5 0 0');                 // b - a for the first four; not 39, -2 or 2 for the last three
  const sliceNote = one('strings', 'idea').text;
  assert.ok(sliceNote.includes('`word[a:b]` has `b - a` characters, as long as the slice stays inside the word'), 'the b - a rule is stated with its condition');
  assert.ok(!/always has `b - a`/.test(sliceNote), 'a slice does not ALWAYS have b - a characters');
  assert.equal(r.bat.out, 'bat');
  assert.ok(one('strings', 'immutable').explain.includes('To get `bat`'));
  assert.equal(r.reverseKeepsWord.out, 'pots\nstop');               // "word is still stop at the end"
  assert.equal(r.keepUpper.out, 'HELLO');                           // "To keep the result, give it a name"
  assert.equal(r.noF.out, '{name} has {n * 2} books\nADA has 3 books');    // without the f nothing is filled in; a gap can hold a method call
  assert.deepEqual(one('strings', 'fstring').options.map((o) => bare(o.text)).sort(), ['Ada has 3 books', 'Ada has 6 books', 'Ada has n * 2 books', '{name} has {n * 2} books']);
  assert.equal(r.tidyParts.out, "['ada', 'example.com']");
  assert.ok(one('strings', 'tidy').explain.includes("`['ada', 'example.com']`"));
  assert.equal(r.palindromeShortcut.out, 'True pots');

  assert.equal(r.million.out, String(100 * 100));                   // the same loop with 1,000 would make a million passes
  assert.equal(r.collatz6.out, '[3, 10, 5, 16, 8, 4, 2, 1] 8');
  assert.ok(one('loop-patterns', 'code-collatz').text.includes('From 6 the numbers go 3, 10, 5, 16, 8, 4, 2, 1: eight steps.'));

  assert.equal(r.hookRow.out, '[7, 3, 9] 2 3');                     // "grid[1] is … the whole row [7, 3, 9]"
  assert.equal(r.sameRow.out, 'True\nFalse');                       // the same row twice; a loop builds separate rows
  assert.equal(r.lastRow.out, '[5, 6] 6');                          // "row -1 … quietly reads the last row"

  assert.equal(r.lump.out, 'To pay: 18');                           // the lump prints the same as the refactored program
  assert.equal(r.tuple.out, '11 2');
  assert.equal(r.tuple.error[0], 'TypeError');                      // "a list that cannot be changed"
  assert.equal(r.areaStep.out, '12 24');                            // "area hands 12 back … multiplies it by 2"

  assert.equal(r.factShort.out, '6 2 1');                           // "fact(2) returns 2 × 1 = 2, and fact(3) returns 3 × 2 = 6"
  assert.equal(r.sumFails.out, '5');
  assert.equal(r.sumFails.error[0], 'TypeError');                   // "sum(item) … fails on [4, [5]]"
  assert.equal(r.plusJoins.out, '[1, 2, 3] True False');

  assert.equal(r.averages.out, '7.0 0.0 0.0');
  assert.deepEqual(r.averages.error.slice(0, 2), ['ZeroDivisionError', 2]);  // the division itself is on line 2, inside the function
  const hook = one('build-a-program', 'hook');
  assert.deepEqual(correctTexts(hook), ['`average([])`']);
  assert.ok(hook.explain.includes('ZeroDivisionError') && hook.explain.includes('`7.0`, `0.0` and `0.0`'));
  assert.equal(r.assertTrue.out, 'carried on');                     // a true assert does nothing
  assert.equal(r.assertFalse.out, 'before');
  assert.deepEqual(r.assertFalse.error.slice(0, 2), ['AssertionError', 2]);
  assert.equal(r.negativeRemainder.out, '23 23 3');                 // "% 26 gives a result from 0 to 25 even when the key is negative"
  assert.equal(r.roundTrip.out, 'True khoor hello');
});

test('strings: the methods table and the match step show what Python really gives', () => {
  const table = one('strings', 'methods').text;
  const rows = [...table.matchAll(/^\| `(.+?)` \| `(.+?)` \|$/gm)].map((m) => [m[1], m[2]]);
  assert.equal(rows.length, 7);                                      // "These seven methods"
  // my own reading of each call
  const expected = {
    '"Hi There".lower()': "'hi there'", '"Hi There".upper()': "'HI THERE'", '"  tea ".strip()': "'tea'",
    '"banana".replace("a", "o")': "'bonono'", '"banana".find("n")': '2', '"a,b,c".split(",")': "['a', 'b', 'c']", '"-".join(["a", "b", "c"])': "'a-b-c'",
    '" tea ".strip()': "'tea'", '"tea".replace("t", "s")': "'sea'", '"tea".find("a")': '2', '"t-e-a".split("-")': "['t', 'e', 'a']", '"-".join(["t", "e", "a"])': "'t-e-a'",
  };
  const pairs = one('strings', 'match-methods').pairs.map(([a, b]) => [bare(a), bare(b)]);
  assert.equal(pairs.length, 5);
  const all = [...rows, ...pairs];
  const results = both(all.map(([expr]) => `print(repr(${expr}))`));
  all.forEach(([expr, shown], i) => {
    assert.ok(expr in expected, `no hand-worked value for ${expr}`);
    assert.equal(shown, expected[expr], expr);
    assert.equal(results[i].out, expected[expr], expr);
  });
});

/* ------------------------------------------------------------- the tracers */

test('tracers: the recorded lines and variable values match real Python step for step', () => {
  const found = [];
  for (const [lesson, step] of allSteps()) {
    const s = resolveStep(step, makeRng(1), step.id);
    for (const w of [...s.figures, s.widget]) if (w && w.type === 'py-trace') found.push([`${lesson}/${step.id}`, w.code]);
  }
  assert.deepEqual(found.map((f) => f[0]), [
    'strings/watch-reverse', 'loop-patterns/be-computer', 'nested-data/watch-group', 'functions-in-depth/be-computer',
    'functions-in-depth/watch-tuple', 'recursion/watch-countdown', 'recursion/watch-fact',
  ]);
  const results = both(found.map((f) => f[1]));
  found.forEach(([name, code], i) => {
    assert.ok(results[i].trace.length <= 40, `${name}: ${results[i].trace.length} steps is a lot to click through`);
    assert.equal(results[i].trace[results[i].trace.length - 1].event, 'end', `${name}: the recording reaches the end of the program`);
    assert.ok(code.split('\n').length <= 9, `${name}: too long to keep the variables on screen`);
  });
  if (!HAVE_PYTHON) return;
  found.forEach(([name], i) => {
    const mine = results[i].trace.filter((e) => e.event === 'line' || e.event === 'call')
      .map((e) => [e.event, e.line, Object.fromEntries(Object.entries(e.vars).filter(([, v]) => !/^<function /.test(v)))]);
    assert.deepEqual(mine, results[i].real.events, name);
  });
});

test('tracers: what the lessons say you will see', () => {
  const trace = (lesson, id) => mini(codeOf(one(lesson, id))).trace;
  const lines = (t) => t.filter((e) => e.event === 'line').map((e) => e.line);
  const valuesOf = (t, name) => t.map((e) => e.vars[name]).filter((v, i, a) => v !== undefined && v !== a[i - 1]);
  const shape = (t) => t.map((e) => `${e.event}:${e.line}`);

  let t = trace('strings', 'watch-reverse');
  assert.deepEqual(valuesOf(t, 'result'), ["''", "'s'", "'ts'", "'ots'", "'pots'"]);   // "s, ts, ots, pots"
  assert.deepEqual(valuesOf(t, 'word'), ["'stop'"]);
  assert.match(codeOf(one('strings', 'watch-reverse')).split('\n')[3], /result = ch \+ result/);   // "Line 4 puts each new letter in front"

  t = trace('loop-patterns', 'be-computer');
  assert.deepEqual(lines(t), [1, 2, 3, 2, 3, 4, 5, 6]);            // after the break on line 5 comes line 6
  assert.ok(!t.some((e) => e.vars.n === '10'));                     // "The loop never comes back for the 10"
  assert.equal(t[t.length - 1].vars.found, '7');

  t = trace('nested-data', 'watch-group');
  assert.equal(lines(t).filter((l) => l === 5).length, 2);          // a new list for `a` and for `b`, but not for the second `a`
  assert.equal(lines(t).filter((l) => l === 6).length, 3);
  assert.deepEqual(valuesOf(t, 'groups'), ['{}', "{'a': []}", "{'a': ['ant']}", "{'a': ['ant'], 'b': []}", "{'a': ['ant'], 'b': ['bee']}", "{'a': ['ant', 'ape'], 'b': ['bee']}"]);

  t = trace('functions-in-depth', 'be-computer');
  assert.deepEqual(shape(t), ['line:1', 'line:4', 'line:7', 'call:4', 'line:5', 'call:1', 'line:2', 'return:2', 'return:5', 'end:0']);
  assert.deepEqual(t.filter((e) => e.event === 'return').map((e) => [e.func, e.value, e.callers]), [['area', '12', [7, 5]], ['paint_cost', '24', [7]]]);

  t = trace('functions-in-depth', 'watch-tuple');
  const back = t.find((e) => e.event === 'return');
  assert.deepEqual([back.line, back.value], [4, '(11, 3)']);        // "Line 4 hands back (11, 3)"
  assert.deepEqual([t[t.length - 1].vars.share, t[t.length - 1].vars.spare], ['11', '3']);
  assert.equal(shape(t)[t.indexOf(back) + 1], 'line:7');            // line 6 has unpacked both names by then

  t = trace('recursion', 'watch-countdown');
  const calls = t.filter((e) => e.event === 'call');
  assert.deepEqual(calls.map((e) => e.vars.n), ['2', '1', '0']);    // "first 2, then 1, then 0. Three calls"
  assert.deepEqual(calls.map((e) => e.callers), [[8], [8, 6], [8, 6, 6]]);   // lines 8 and 6 are the ones that wait
  assert.deepEqual(t.filter((e) => e.event === 'return').map((e) => e.vars.n), ['0', '1', '2']);   // "the newest first"
  assert.ok(t.filter((e) => e.func === 'countdown').every((e) => Object.keys(e.vars).join() === 'n'));

  t = trace('recursion', 'watch-fact');
  assert.deepEqual(t.filter((e) => e.event === 'call').map((e) => e.vars.n), ['3', '2', '1']);
  assert.deepEqual(t.filter((e) => e.event === 'return').map((e) => [e.vars.n, e.value]), [['1', '1'], ['2', '2'], ['3', '6']]);
  const lesson = one('recursion', 'watch-fact');
  assert.ok(lesson.explain.includes('`fact(2)` returns 2 × 1 = 2') && lesson.explain.includes('`fact(3)` returns 3 × 2 = **6**'));
});

/* ------------------------------------------------- generated steps: strings */

/** Python's s[a:b] for a string, with blank and negative bounds. */
function pySlice(s, a, b) {
  const n = s.length;
  const fix = (v, blank) => (v === '' ? blank : Math.max(0, Math.min(n, Number(v) < 0 ? n + Number(v) : Number(v))));
  const from = fix(a, 0);
  const to = fix(b, n);
  let text = '';
  for (let i = from; i < to; i++) text += s[i];
  return text;
}
const pyIndex = (s, i) => s[Number(i) < 0 ? s.length + Number(i) : Number(i)];
/** The value of `word[...]` written as Python: a slice or a single index. */
function wordExpr(word, expr) {
  const slice = /^word\[(-?\d*):(-?\d*)\]$/.exec(expr);
  if (slice) return pySlice(word, slice[1], slice[2]);
  const index = /^word\[(-?\d+)\]$/.exec(expr);
  assert.ok(index, expr);
  return pyIndex(word, index[1]);
}

test('strings/slice-practice: every slice, and every sentence about a wrong one', () => {
  const cases = [];
  const kinds = new Set();
  for (const s of generated('strings', 'slice-practice')) {
    const code = codeOf(s);
    const m = /^word = "([a-z]{6})"\nprint\((word\[(-?\d*):(-?\d*)\])\)$/.exec(code);
    assert.ok(m, code);
    const [, word, expr, a, b] = m;
    assert.equal(new Set(word).size, 6, 'no repeated letters, so no two slices look alike');
    const mine = wordExpr(word, expr);
    kinds.add(a === '' ? 'head' : b === '' ? (Number(a) < 0 ? 'neg' : 'tail') : 'mid');
    assert.deepEqual(correctTexts(s), [`\`${mine}\``], code);
    assert.equal(s.options.length, 4);
    assert.ok(s.explain.endsWith(`: **\`${mine}\`**.`), s.explain);
    cases.push([code, mine]);

    // every positional claim in the explanation
    for (const q of s.explain.matchAll(/position (\d), which is `(\w)`/g)) assert.equal(word[Number(q[1])], q[2], s.explain);
    let x;
    if ((x = /That leaves (\d) characters/.exec(s.explain))) assert.equal(Number(x[1]), mine.length);
    if ((x = /so it has (\d) characters/.exec(s.explain))) assert.equal(Number(x[1]), mine.length);
    if ((x = /starts (\d) characters before the end/.exec(s.explain))) assert.equal(Number(x[1]), mine.length);

    // every sentence attached to a wrong option is true of that option
    for (const o of s.options.filter((opt) => !opt.correct)) {
      const shown = bare(o.text);
      const why = o.why;
      assert.notEqual(shown, mine);
      if ((x = /^That is `(word\[[^\]]*\])`/.exec(why))) assert.equal(wordExpr(word, x[1]), shown, why);
      else if ((x = /^That is the single character `(word\[\d\])`/.exec(why))) assert.equal(wordExpr(word, x[1]), shown, why);
      else if ((x = /^That is the single character at position (-\d)/.exec(why))) assert.equal(pyIndex(word, x[1]), shown, why);
      else if ((x = /^A slice stops \*\*before\*\* its end position, so `(\w)` \(position (\d)\) is left out/.exec(why))) {
        assert.equal(word[Number(x[2])], x[1], why);
        assert.equal(Number(x[2]), Number(b), why);
        assert.equal(shown, mine + x[1], 'the wrong option is the right slice plus that one character');
      } else if ((x = /^Positions start at 0, so position (\d) is `(\w)`, not `(\w)`/.exec(why))) {
        assert.equal(Number(x[1]), Number(a), why);
        assert.deepEqual([word[Number(a)], word[Number(a) - 1]], [x[2], x[3]], why);
        assert.equal(shown[0], x[3], 'the wrong option starts one place too early');
      } else if ((x = /^Positions start at 0: the slice begins at `(\w)` and runs up to, but not including, position (\d)/.exec(why))) {
        assert.equal(word[Number(a)], x[1], why);
        assert.equal(Number(x[2]), Number(b), why);
      } else if ((x = /^The slice starts \*\*at\*\* position (\d), so `(\w)` is included/.exec(why))) {
        assert.equal(Number(x[1]), Number(a), why);
        assert.equal(word[Number(a)], x[2], why);
        assert.equal(mine, x[2] + shown, 'the wrong option is the right slice without its first character');
      } else if ((x = /^Position (-\d) is (\d) characters from the end, so the slice has (\d) characters, not (\d)/.exec(why))) {
        assert.deepEqual([Number(x[1]), Number(x[2]), Number(x[3])], [Number(a), -Number(a), mine.length], why);
        assert.equal(shown.length, Number(x[4]), why);
      } else assert.fail(`no check for this feedback sentence: ${why}`);
      if ((x = /everything \*\*except\*\* the last (\d) characters/.exec(why))) assert.equal(shown, word.slice(0, 6 - Number(x[1])), why);
      if ((x = /the part from position (\d) onwards/.exec(why))) assert.equal(shown, word.slice(Number(x[1])), why);
      if ((x = /the part before position (\d)\./.exec(why))) assert.equal(shown, word.slice(0, Number(x[1])), why);
    }
  }
  assert.deepEqual([...kinds].sort(), ['head', 'mid', 'neg', 'tail']);
  printsAll(cases);
});

/* ------------------------------------------- generated steps: loop patterns */

test('loop-patterns/first-match: the first number over the limit, not the last or the largest', () => {
  const cases = [];
  const afterCounts = new Set();
  for (const s of generated('loop-patterns', 'first-match')) {
    const code = codeOf(s);
    const m = /^nums = \[([\d, ]+)\]\nfor n in nums:\n    if n > (\d+):\n        print\(n\)\n        break$/.exec(code);
    assert.ok(m, code);
    const nums = ints(m[1]);
    const limit = Number(m[2]);
    assert.equal(new Set(nums).size, 5);
    let mine = null;
    for (const n of nums) if (mine === null && n > limit) mine = n;
    assert.ok(mine !== null);
    assert.equal(s.answer, mine, code);
    cases.push([code, mine]);
    const over = nums.filter((n) => n > limit);
    const before = nums.slice(0, nums.indexOf(mine));
    assert.ok(before.length >= 1 && nums.indexOf(mine) < 4, 'something is skipped, and something is never checked');
    assert.ok(s.explain.includes(`The loop passes over ${listOf(before)}, which ${before.length === 1 ? 'is' : 'are'} not greater than ${limit}. Then comes **${mine}**`), s.explain);
    // one number left over is "the number", several are "the numbers"
    const after = nums.length - 1 - nums.indexOf(mine);
    afterCounts.add(after);
    assert.ok(s.explain.endsWith(after === 1 ? ' The number after it is never checked.' : ' The numbers after it are never checked.'), `${after} left: ${s.explain}`);
    assert.ok(s.hints[0].includes(`greater than ${limit}?`));
    assert.ok(s.wrong.length >= 2);
    assert.ok(s.wrong.some(([value]) => value === over[over.length - 1]), 'the last match is always an anticipated slip');
    for (const [value, message] of s.wrong) {
      if (/\*\*last\*\* number greater than/.test(message)) { assert.equal(value, over[over.length - 1]); assert.ok(message.includes(`greater than ${limit}.`)); }
      else if (/largest number, and the last one greater than/.test(message)) { assert.equal(value, over[over.length - 1]); assert.equal(value, Math.max(...nums)); assert.ok(message.includes(`greater than ${limit}.`)); }
      else if (/largest number/.test(message)) { assert.equal(value, Math.max(...nums)); assert.ok(message.includes(`greater than ${limit}.`)); }
      else if (/^The first number, /.test(message)) { assert.equal(value, nums[0]); assert.ok(nums[0] <= limit); assert.ok(message.startsWith(`The first number, ${nums[0]}, is not greater than ${limit},`)); }
      else assert.fail(message);
    }
  }
  assert.ok(afterCounts.has(1) && afterCounts.has(2), 'both wordings of the last sentence occur');
  printsAll(cases);
});

test('loop-patterns/zip-total: price times count, pair by pair', () => {
  const cases = [];
  for (const s of generated('loop-patterns', 'zip-total')) {
    const code = codeOf(s);
    const m = /^prices = \[([\d, ]+)\]\ncounts = \[([\d, ]+)\]\ntotal = 0\nfor p, c in zip\(prices, counts\):\n    total = total \+ p \* c\nprint\(total\)$/.exec(code);
    assert.ok(m, code);
    const prices = ints(m[1]);
    const counts = ints(m[2]);
    assert.deepEqual([prices.length, counts.length], [3, 3]);
    let mine = 0;
    for (let i = 0; i < 3; i++) mine += prices[i] * counts[i];
    assert.equal(s.answer, mine, code);
    cases.push([code, mine]);
    const pairs = prices.map((p, i) => `(${p}, ${counts[i]})`).join(', ');
    assert.ok(s.hints[0].includes(`The pairs are ${pairs}.`));
    assert.ok(s.explain.includes(`the pairs ${pairs} `) && s.explain.includes(`${prices.map((p, i) => `${p} × ${counts[i]}`).join(' + ')} = **${mine}**`), s.explain);
    for (const [value, message] of s.wrong) {
      if (/same position/.test(message)) assert.equal(value, sum(prices) * sum(counts));
      else if (/adds all six numbers/.test(message)) assert.equal(value, sum(prices) + sum(counts));
      else if (/only the last pair/.test(message)) assert.equal(value, prices[2] * counts[2]);
      else assert.fail(message);
    }
  }
  printsAll(cases);
});

test('loop-patterns/nested-count: the passes multiply', () => {
  const cases = [];
  const seen = new Set();
  for (const s of generated('loop-patterns', 'nested-count')) {
    const code = codeOf(s);
    const m = /^count = 0\nfor a in range\((\d)\):\n    for b in range\((\d)\):\n        count = count \+ 1\nprint\(count\)$/.exec(code);
    assert.ok(m, code);
    const [a, b] = [Number(m[1]), Number(m[2])];
    let mine = 0;
    for (let x = 0; x < a; x++) for (let y = 0; y < b; y++) mine++;
    seen.add(`${a}x${b}`);
    assert.equal(s.answer, mine, code);
    cases.push([code, mine]);
    assert.ok(s.explain.includes(`The outer loop makes ${a} passes.`) && s.explain.includes(`the inner loop makes ${b} passes`) && s.explain.includes(`${a} × ${b} = **${mine}**`), s.explain);
    assert.ok(s.hints[1].includes(`makes ${a} passes`) && s.hints[1].includes(`contains ${b} passes`));
    assert.equal(s.wrong.length, 3);
    for (const [value, message] of s.wrong) {
      if (/do not take turns/.test(message)) assert.equal(value, a + b);
      else if (/one full run of the inner loop/.test(message)) { assert.equal(value, b); assert.ok(message.includes(`run ${a} times over`)); }
      else if (/passes of the outer loop/.test(message)) { assert.equal(value, a); assert.ok(message.includes(`makes ${b} passes of its own`)); }
      else assert.fail(message);
    }
  }
  assert.ok(seen.size >= 8);
  printsAll(cases);
});

/* --------------------------------------------- generated steps: nested data */

test('nested-data/grid-practice: cells, a row and a column of a 3 × 3 grid', () => {
  const cases = [];
  const kinds = new Set();
  for (const s of generated('nested-data', 'grid-practice')) {
    const code = codeOf(s);
    const m = /^grid = \[\n {4}\[(\d, \d, \d)\],\n {4}\[(\d, \d, \d)\],\n {4}\[(\d, \d, \d)\],\n\]\n([\s\S]+)$/.exec(code);
    assert.ok(m, code);
    const rows = [ints(m[1]), ints(m[2]), ints(m[3])];
    assert.deepEqual(rows.flat().sort(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const everything = sum(rows.flat());
    const col = (c) => rows.map((row) => row[c]);
    const rest = m[4];
    let mine;
    let x;
    if ((x = /^print\(grid\[(\d)\]\[(\d)\] \+ grid\[(\d)\]\[(\d)\]\)$/.exec(rest))) {
      kinds.add('cells');
      const [r1, c1, r2, c2] = x.slice(1).map(Number);
      mine = rows[r1][c1] + rows[r2][c2];
      assert.ok(s.explain.includes(`\`grid[${r1}][${c1}]\` is ${rows[r1][c1]} (row ${r1}, position ${c1})`) && s.explain.includes(`\`grid[${r2}][${c2}]\` is ${rows[r2][c2]} (row ${r2}, position ${c2})`) && s.explain.includes(`**${mine}**`), s.explain);
      assert.ok(s.hints[0].includes(`\`grid[${r1}]\` is the row \`[${rows[r1].join(', ')}]\``) && s.hints[0].includes(`index ${c1} `));
      for (const [value, message] of s.wrong) { assert.match(message, /other way round/); assert.equal(value, rows[c1][r1] + rows[c2][r2]); }
    } else if ((x = /^print\(sum\(grid\[(\d)\]\)\)$/.exec(rest))) {
      kinds.add('row');
      const r = Number(x[1]);
      mine = sum(rows[r]);
      assert.ok(s.explain.includes(`\`grid[${r}]\` is the row \`[${rows[r].join(', ')}]\``) && s.explain.includes(`${rows[r].join(' + ')} = **${mine}**`), s.explain);
      for (const [value, message] of s.wrong) {
        if (/total of a \*\*column\*\*/.test(message)) { assert.equal(value, sum(col(r))); assert.ok(message.includes(`\`grid[${r}]\` is a whole row: \`[${rows[r].join(', ')}]\``)); }
        else if (/every cell/.test(message)) assert.equal(value, everything);
        else assert.fail(message);
      }
    } else if ((x = /^total = 0\nfor row in grid:\n {4}total = total \+ row\[(\d)\]\nprint\(total\)$/.exec(rest))) {
      kinds.add('col');
      const c = Number(x[1]);
      mine = sum(col(c));
      assert.ok(s.explain.includes(`position ${c} from each: ${col(c).join(' + ')} = **${mine}**`) && s.explain.includes('a **column**'), s.explain);
      assert.ok(s.hints[1].includes(`The first pass adds ${rows[0][c]}.`));
      for (const [value, message] of s.wrong) {
        if (/^That is the total of row/.test(message)) { assert.equal(value, sum(rows[c])); assert.ok(message.includes(`total of row ${c}.`) && message.includes(`position ${c} from`)); }
        else if (/every cell/.test(message)) { assert.equal(value, everything); assert.ok(message.includes(`position ${c} of`)); }
        else assert.fail(message);
      }
    } else assert.fail(rest);
    assert.equal(s.answer, mine, code);
    cases.push([code, mine]);
  }
  assert.deepEqual([...kinds].sort(), ['cells', 'col', 'row']);
  printsAll(cases);
});

test('nested-data/records-total: filter a table of records, then total or count', () => {
  const cases = [];
  const kinds = new Set();
  for (const s of generated('nested-data', 'records-total')) {
    const code = codeOf(s);
    const pets = [...code.matchAll(/^ {4}\{"name": "(\w+)", "kind": "(dog|cat)", "age": (\d)\},$/gm)].map((m) => ({ name: m[1], kind: m[2], age: Number(m[3]) }));
    assert.equal(pets.length, 4, code);
    assert.equal(new Set(pets.map((p) => p.name)).size, 4);
    assert.equal(new Set(pets.map((p) => p.age)).size, 4, 'ages are all different');
    assert.equal(new Set(pets.map((p) => p.kind)).size, 2, 'both kinds occur');
    const tail = code.slice(code.indexOf('\n]\n') + 3);
    let mine;
    let x;
    if ((x = /^total = 0\nfor pet in pets:\n {4}if pet\["kind"\] == "(dog|cat)":\n {8}total = total \+ pet\["age"\]\nprint\(total\)$/.exec(tail))) {
      kinds.add('total');
      const kind = x[1];
      const other = kind === 'dog' ? 'cat' : 'dog';
      const chosen = pets.filter((p) => p.kind === kind);
      mine = sum(chosen.map((p) => p.age));
      if (chosen.length === 1) assert.ok(s.explain.includes(`Only one record passes the test: ${chosen[0].name}, aged ${chosen[0].age}. So the total is **${mine}**.`), s.explain);
      else assert.ok(s.explain.includes(`The records that pass the test are ${listOf(chosen.map((p) => `${p.name} (${p.age})`))}. Their ages add up to ${chosen.map((p) => p.age).join(' + ')} = **${mine}**.`), s.explain);
      assert.ok(s.hints[1].includes(`\`"${kind}"\``));
      for (const [value, message] of s.wrong) {
        if (/all four ages/.test(message)) { assert.equal(value, sum(pets.map((p) => p.age))); assert.ok(message.includes(`only lets the ${kind}s through`)); }
        else if (/^That is how many/.test(message)) { assert.equal(value, chosen.length); assert.ok(message.includes(`how many ${kind}s there are`)); }
        else if (/^That is the total for the/.test(message)) { assert.equal(value, sum(pets.filter((p) => p.kind === other).map((p) => p.age))); assert.ok(message.includes(`total for the ${other}s`) && message.includes(`\`"${kind}"\``)); }
        else assert.fail(message);
      }
    } else if ((x = /^count = 0\nfor pet in pets:\n {4}if pet\["age"\] > (\d):\n {8}count = count \+ 1\nprint\(count\)$/.exec(tail))) {
      kinds.add('count');
      const limit = Number(x[1]);
      const older = pets.filter((p) => p.age > limit);
      mine = older.length;
      assert.ok(mine >= 1 && mine <= 3);
      const who = older.length === 1 ? `Only ${older[0].name} is` : `${listOf(older.map((p) => p.name))} are`;
      assert.ok(s.explain.startsWith(`${who} older than ${limit}, so \`count\` goes up ${mine === 1 ? 'once' : `${mine} times`}: **${mine}**.`), s.explain);
      assert.ok(s.wrong.some(([value]) => value === 4), 'counting every pet is always an anticipated slip');
      for (const [value, message] of s.wrong) {
        if (/counts every pet\. But the pet aged exactly/.test(message)) { assert.equal(value, 4); assert.equal(pets.filter((p) => p.age >= limit).length, 4); assert.ok(message.includes(`aged exactly ${limit} is not **older** than ${limit}.`)); }
        else if (/counts every pet/.test(message)) { assert.equal(value, 4); assert.ok(message.includes(`older than ${limit}.`)); }
        else if (/aged exactly/.test(message)) { assert.equal(value, pets.filter((p) => p.age >= limit).length); assert.ok(pets.some((p) => p.age === limit)); assert.ok(message.includes(`aged exactly ${limit} is not **older** than ${limit}`)); }
        else if (/adds up the ages/.test(message)) assert.equal(value, sum(older.map((p) => p.age)));
        else assert.fail(message);
      }
    } else assert.fail(tail);
    assert.equal(s.answer, mine, code);
    cases.push([code, mine]);
  }
  assert.deepEqual([...kinds].sort(), ['count', 'total']);
  printsAll(cases);
});

/* ------------------------------------------------ generated steps: functions */

test('functions-in-depth/defaults: a default is used only when the argument is left out', () => {
  const cases = [];
  for (const s of generated('functions-in-depth', 'defaults')) {
    const code = codeOf(s);
    const m = /^def ticket\(price, discount=(\d)\):\n {4}return price - discount\n\nprint\(ticket\((\d+)\) \+ ticket\((\d+), (\d)\)\)$/.exec(code);
    assert.ok(m, code);
    const [fallback, p, q, given] = m.slice(1).map(Number);
    assert.notEqual(fallback, given);
    const mine = (p - fallback) + (q - given);
    assert.equal(s.answer, mine, code);
    cases.push([code, mine]);
    assert.ok(s.explain.includes(`\`ticket(${p})\` uses the default: ${p} − ${fallback} = ${p - fallback}.`) && s.explain.includes(`${q} − ${given} = ${q - given}. Together: **${mine}**.`), s.explain);
    assert.ok(s.hints[0].includes(`\`discount\` is ${fallback} in that call`) && s.hints[1].includes(`return ${p - fallback} and ${q - given}.`));
    assert.equal(s.wrong.length, 3);
    for (const [value, message] of s.wrong) {
      if (/^The first call passes no discount/.test(message)) { assert.equal(value, (p - given) + (q - given)); assert.ok(message.includes(`the default, ${fallback}. The ${given} belongs`)); }
      else if (/^The second call passes/.test(message)) { assert.equal(value, (p - fallback) + (q - fallback)); assert.ok(message.includes(`passes ${given} as its discount`)); }
      else if (/still gets one/.test(message)) { assert.equal(value, p + (q - given)); assert.ok(message.includes(`the default, ${fallback}.`)); }
      else assert.fail(message);
    }
  }
  printsAll(cases);
});

test('functions-in-depth/two-values: unpack the smallest and the largest', () => {
  const cases = [];
  for (const s of generated('functions-in-depth', 'two-values')) {
    const code = codeOf(s);
    const m = /^def low_high\(nums\):\n {4}return min\(nums\), max\(nums\)\n\nlow, high = low_high\(\[([\d, ]+)\]\)\nprint\(high - low\)$/.exec(code);
    assert.ok(m, code);
    const nums = ints(m[1]);
    assert.equal(new Set(nums).size, 4);
    const sorted = [...nums].sort((a, b) => a - b);
    const [lo, hi] = [sorted[0], sorted[3]];
    const mine = hi - lo;
    assert.equal(s.answer, mine, code);
    cases.push([code, mine]);
    assert.ok(s.explain.includes(`returns the pair (${lo}, ${hi}).`) && s.explain.includes(`\`low\` = ${lo} and \`high\` = ${hi}`) && s.explain.includes(`${hi} − ${lo} = **${mine}**`), s.explain);
    assert.ok(s.hints[1].includes(`the pair (${lo}, ${hi})`));
    assert.ok(s.wrong.length >= 1);
    for (const [value, message] of s.wrong) {
      if (/`high` on its own/.test(message)) assert.equal(value, hi);
      else if (/`low` on its own/.test(message)) assert.equal(value, lo);
      else if (/need not be the first and the last/.test(message)) { assert.equal(value, nums[3] - nums[0]); assert.ok(nums[0] !== lo || nums[3] !== hi); }
      else assert.fail(message);
    }
  }
  printsAll(cases);
});

/* ------------------------------------------------ generated steps: recursion */

test('recursion/rec-practice: four recursive functions, worked out with loops', () => {
  const cases = [];
  const kinds = new Set();
  for (const s of generated('recursion', 'rec-practice')) {
    const code = codeOf(s);
    const m = /^def (\w+)\(n\):\n {4}if (n == 0|n == 1|n < 10):\n {8}return (\d)\n {4}return (.+)\n\nprint\(\1\((\d+)\)\)$/.exec(code);
    assert.ok(m, code);
    const [, name, test, base, step] = m;
    const n = Number(m[5]);
    const baseValue = Number(base);
    kinds.add(name);
    let mine;
    const chainOf = (re) => { const x = re.exec(s.explain); assert.ok(x, s.explain); return x[1]; };
    if (name === 'total') {
      assert.deepEqual([test, baseValue, step], ['n == 0', 0, 'n + total(n - 1)']);
      mine = 0;
      for (let i = n; i > 0; i--) mine += i;
      const chain = chainOf(/are added: ([\d +]+) = \*\*/).split(' + ').map(Number);
      assert.deepEqual(chain, Array.from({ length: n + 1 }, (_, i) => n - i));
      assert.equal(sum(chain), mine);
    } else if (name === 'fact') {
      assert.deepEqual([test, baseValue, step], ['n == 1', 1, 'n * fact(n - 1)']);
      mine = 1;
      for (let i = n; i > 1; i--) mine *= i;
      const chain = chainOf(/are multiplied: ([\d ×]+) = \*\*/).split(' × ').map(Number);
      assert.deepEqual(chain, Array.from({ length: n }, (_, i) => n - i));
      assert.equal(chain.reduce((a, b) => a * b, 1), mine);
    } else if (name === 'power') {
      assert.deepEqual([test, baseValue, step], ['n == 0', 1, '2 * power(n - 1)']);
      mine = 1;
      for (let i = 0; i < n; i++) mine *= 2;
      const chain = chainOf(/doubles what it gets back: ([\d →]+)\. The program/).split(' → ').map(Number);
      assert.equal(chain.length, n + 1);
      chain.forEach((v, i) => assert.equal(v, i === 0 ? 1 : chain[i - 1] * 2));
      assert.ok(s.explain.includes(`each of the ${n} calls above it`));
    } else {
      assert.equal(name, 'digits');
      assert.deepEqual([test, baseValue, step], ['n < 10', 1, '1 + digits(n // 10)']);
      mine = String(n).length;
      const chain = chainOf(/adds 1 to the count: ([\d →]+)\. That is/).split(' → ').map(Number);
      assert.equal(chain[0], n);
      chain.forEach((v, i) => { if (i > 0) assert.equal(v, Math.floor(chain[i - 1] / 10)); });
      assert.ok(chain[chain.length - 1] < 10 && chain.length === mine);
      assert.ok(s.explain.includes(`That is ${mine} calls`));
      assert.match(s.text, /`n \/\/ 10` is `n` without its last digit/);
    }
    assert.equal(s.answer, mine, code);
    assert.ok(s.explain.includes(`**${mine}**`), s.explain);
    cases.push([code, mine]);
    for (const [value, message] of s.wrong) {
      if (/only the share of the first call/.test(message)) { assert.equal(value, n); assert.ok(message.includes(`\`${name}(${n - 1})\``)); }
      else if (/do not stop after one step/.test(message)) assert.equal(value, name === 'total' ? n + (n - 1) : n * (n - 1));
      else if (/^That is what the base case returns/.test(message)) assert.equal(value, baseValue);
      else if (/^That adds the numbers/.test(message)) { assert.equal(name, 'fact'); assert.equal(value, sum(Array.from({ length: n }, (_, i) => i + 1))); }
      else if (/It does not add 2/.test(message)) { assert.equal(name, 'power'); assert.equal(value, 2 * n); }
      else if (/^Count the doublings/.test(message)) { assert.equal(value, 2 ** (n - 1)); assert.ok(message.includes(`That makes ${n} of them`)); }
      else if (/^The base case counts as well/.test(message)) assert.equal(value, mine - 1);
      else if (/the input of the second call/.test(message)) { assert.equal(value, Math.floor(n / 10)); assert.ok(message.includes(`\`${n} // 10\``)); }
      else assert.fail(message);
    }
  }
  assert.deepEqual([...kinds].sort(), ['digits', 'fact', 'power', 'total']);
  printsAll(cases);
});

/* ---------------------------------------- generated steps: build a program */

// What each function in the bug hunt is SUPPOSED to do, written from the task sentence.
const SPEC = {
  longest: (words) => words.reduce((best, w) => (w.length > best.length ? w : best), ''),        // the first of the longest; "" for no words
  passed: (marks) => marks.filter((m) => m >= 50).length,                                         // 50 or more
  in_order: (nums) => nums.every((n, i) => i === 0 || nums[i - 1] <= n),                          // rising order
  smallest: (nums) => Math.min(...nums),
};
const pyValue = (text) => JSON.parse(text.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false'));

test('build-a-program/catch-bug: every assert states what a correct function does, and exactly one catches the bug', () => {
  const seen = new Map();
  for (const s of generated('build-a-program', 'catch-bug')) {
    const code = codeOf(s);
    const name = /^def (\w+)\(/.exec(code)[1];
    assert.ok(SPEC[name], name);
    seen.set(name, s);
    assert.equal(s.options.length, 4);
  }
  assert.deepEqual([...seen.keys()].sort(), ['in_order', 'longest', 'passed', 'smallest']);
  for (const [name, s] of seen) {
    const code = codeOf(s);
    assert.ok(s.text.includes('It has a bug.'));
    const lines = s.options.map((o) => bare(o.text));
    // 1. each claim is true of a correct function
    for (const line of lines) {
      const m = /^assert (\w+)\((.*)\) == (.+)$/.exec(line);
      assert.ok(m && m[1] === name, line);
      assert.deepEqual(SPEC[name](pyValue(m[2])), pyValue(m[3]), `${line} claims something a correct ${name} would not do`);
    }
    // 2. run each against the buggy function, in both Pythons: exactly one stops the program
    const results = both(lines.map((line) => `${code}\n\n${line}\nprint("passed")`));
    const caught = lines.filter((_, i) => results[i].error);
    assert.equal(caught.length, 1, `${name}: ${caught}`);
    results.forEach((r, i) => { if (r.error) assert.equal(r.error[0], 'AssertionError', lines[i]); else assert.equal(r.out, 'passed'); });
    assert.deepEqual(correctTexts(s).map(bare), caught, name);
    for (const o of s.options) if (!o.correct) assert.match(o.why, /passes in silence and catches nothing/);
  }
  // the reasons given in the explanations
  const facts = both([
    `${codeOf(seen.get('longest'))}\nprint(longest(["jam", "tea"]))`,
    `${codeOf(seen.get('passed'))}\nprint(passed([50]), passed([51, 49]))`,
    `${codeOf(seen.get('in_order'))}\nprint(in_order([1, 3, 2]), in_order([3, 1, 2]), list(range(3 - 2)))`,
    `${codeOf(seen.get('smallest'))}\nprint(smallest([150, 200]), smallest([101]))`,
  ]).map((r) => r.out);
  assert.deepEqual(facts, ['tea', '0 1', 'True False [0]', '100 100']);
  assert.match(seen.get('longest').explain, /gives `"tea"`/);
  assert.match(seen.get('passed').explain, /exactly 50 is not counted/);
  assert.match(seen.get('in_order').explain, /\*\*last pair\*\* is never compared/);
  assert.match(seen.get('smallest').explain, /can never return anything larger/);
});

test('build-a-program/wrap: position plus key, wrapped round at 26', () => {
  const cases = [];
  const seen = new Set();
  for (const s of generated('build-a-program', 'wrap')) {
    const code = codeOf(s);
    const m = /^letters = "abcdefghijklmnopqrstuvwxyz"\nprint\(\(letters\.find\("([a-z])"\) \+ (\d)\) % 26\)$/.exec(code);
    assert.ok(m, code);
    const letter = m[1];
    const key = Number(m[2]);
    const pos = letter.charCodeAt(0) - 'a'.charCodeAt(0);
    let mine = pos + key;
    while (mine >= 26) mine -= 26;
    const wraps = pos + key >= 26;
    seen.add(wraps);
    assert.equal(s.answer, mine, code);
    cases.push([code, mine]);
    const lands = String.fromCharCode(97 + mine);
    assert.ok(s.explain.includes(`\`${letter}\` is at position ${pos}, and ${pos} + ${key} = ${pos + key}.`), s.explain);
    if (wraps) assert.ok(s.explain.includes('past the end of the alphabet') && s.explain.includes(`is **${mine}**: the count has wrapped round to \`${lands}\`.`), s.explain);
    else assert.ok(s.explain.includes('still less than 26') && s.explain.includes(`**${mine}**, the position of \`${lands}\`.`), s.explain);
    assert.ok(s.hints[1].includes(`It is ${pos}. Add ${key},`));
    for (const [value, message] of s.wrong) {
      if (/before the wrap/.test(message)) { assert.ok(wraps); assert.equal(value, pos + key); assert.ok(message.startsWith(`That is ${pos} + ${key},`)); }
      else if (/^Positions start at 0/.test(message)) { assert.equal(value, (pos + 1 + key) % 26); assert.ok(message.includes(`\`${letter}\` is at ${pos}, not ${pos + 1}.`)); }
      else assert.fail(message);
    }
    assert.equal(s.wrong.length, wraps ? 2 : 1);
  }
  assert.equal(seen.size, 2, 'some variants wrap round and some do not');
  printsAll(cases);
});

test('guard: every generated step is re-solved by a test in this file', () => {
  const all = allSteps().filter(([, step]) => typeof step.gen === 'function').map(([lesson, step]) => `${lesson}/${step.id}`);
  assert.deepEqual([...TESTED_GENERATED].sort(), [...all].sort());
  assert.deepEqual([...RUN_ELSEWHERE].sort(), [...all].sort());
  assert.equal(all.length, 11);
});

/* --------------------------------------------------------- Parsons problems */

function permutations(list) {
  if (list.length <= 1) return [list];
  return list.flatMap((item, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [item, ...rest]));
}

// For each Parsons problem: the output the task asks for, and extra lines that
// tell a program that does the job from one that prints the right thing by luck.
const PARSONS = [
  ['strings', 'parsons', '4 0 3', '\nprint(count_vowels("Queue"), count_vowels("sky"), count_vowels("AREA"))'],
  ['loop-patterns', 'parsons', '[-2, -5]', ''],
  ['nested-data', 'parsons', "{'a': ['ant', 'ape'], 'b': ['bee']}\n{}", '\nprint(by_letter(["ant", "bee", "ape"]))\nprint(by_letter([]))'],
  ['functions-in-depth', 'parsons', '15 5.0', ''],
  ['recursion', 'parsons', '15', ''],
];

test('Parsons problems: the listed order is the only one that does the job', () => {
  for (const [lesson, id, goal, probeLines] of PARSONS) {
    const s = one(lesson, id);
    assert.ok(s.code, `${lesson}/${id} is shown as code`);
    assert.ok(s.items.every((line) => line.length <= 30), `${lesson}/${id}: a line is too long for a phone screen`);
    const orders = permutations(s.items.map((_, i) => i));
    const results = both(orders.map((order) => order.map((i) => s.items[i]).join('\n') + probeLines), { scrambled: true });
    const working = orders.filter((order, k) => !results[k].error && results[k].out === goal);
    assert.deepEqual(working, [s.items.map((_, i) => i)], `${lesson}/${id}: orders that work`);
  }
  assert.deepEqual(allSteps().filter(([, step]) => step.type === 'order').map(([l, step]) => `${l}/${step.id}`), PARSONS.map(([l, id]) => `${l}/${id}`));
  assert.match(one('strings', 'parsons').text, /`count_vowels\("Queue"\)` should give 4/);
  assert.match(one('loop-patterns', 'parsons').text, /`\[-2, -5\]`/);
  assert.ok(one('nested-data', 'parsons').text.includes("`by_letter([\"ant\", \"bee\", \"ape\"])` should give `{'a': ['ant', 'ape'], 'b': ['bee']}`"));
  assert.match(one('functions-in-depth', 'parsons').text, /prints `15 5\.0`/);
  assert.match(one('recursion', 'parsons').text, /prints `15`/);
});

/* ---------------------------------------------- fill steps (blanks in code) */

/** All ways of filling the dropdowns of a fill step, as [choices, program]. */
function fillings(step) {
  const combos = step.blanks.reduce((acc, blank) => acc.flatMap((c) => blank.options.map((o) => [...c, o])), [[]]);
  const build = (choice) => /```python\n([\s\S]*?)\n```/.exec(step.parts.map((p) => (p.text != null ? p.text : choice[p.blank])).join(''))[1];
  return combos.map((choice) => [choice, build(choice)]);
}

test('fill steps: only the starred choices make the program do its job', () => {
  // strings/tidy: 27 ways to fill three gaps
  const tidy = one('strings', 'tidy');
  assert.deepEqual(tidy.blanks.map((b) => b.answer), ['strip', 'lower', 'split']);
  let all = fillings(tidy);
  assert.equal(all.length, 27);
  let results = both(all.map(([, program]) => program));
  let right = all.filter((_, i) => !results[i].error && results[i].out === 'ada at example.com').map(([choice]) => choice);
  assert.deepEqual(right, [['strip', 'lower', 'split']]);
  assert.match(tidy.text, /It should print `ada at example\.com`/);

  // recursion/nested: 9 ways to fill two gaps; the function must total any nested list
  const nested = one('recursion', 'nested');
  assert.deepEqual(nested.blanks.map((b) => b.answer), ['total(item)', 'item']);
  all = fillings(nested);
  assert.equal(all.length, 9);
  const probeLine = '\nprint(total([1, [2, 3], [4, [5]]]), total([]), total([[[7]], 8]))';
  results = both(all.map(([, program]) => program + probeLine));
  right = all.filter((_, i) => !results[i].error && results[i].out === '15 0 15').map(([choice]) => choice);
  assert.deepEqual(right, [['total(item)', 'item']]);
  assert.match(nested.text, /`total\(\[1, \[2, 3\], \[4, \[5\]\]\]\)` gives 15/);
  // "sum(item) would do for one level, but it fails on [4, [5]]"
  const withSum = all.find(([choice]) => choice.join() === 'sum(item),item')[1];
  const [oneLevel, twoLevels] = both([`${withSum}\nprint(total([1, [2, 3]]))`, `${withSum}\nprint(total([1, [4, [5]]]))`]);
  assert.equal(oneLevel.out, '6');
  assert.equal(twoLevels.error[0], 'TypeError');
});

/* ------------------------------------ bucket, match and multi: my own answers */

test('bucket and match steps agree with an answer key written for this file', () => {
  const bucketOf = (step, pattern) => {
    const item = step.items.find((it) => pattern.test(it.text));
    assert.ok(item, String(pattern));
    return step.buckets[item.bucket];
  };
  const keyed = (lesson, id, key) => {
    const step = one(lesson, id);
    assert.equal(step.items.length, key.length, `${lesson}/${id}`);
    for (const [pattern, bucket] of key) assert.equal(bucketOf(step, pattern), bucket, `${lesson}/${id}: ${pattern}`);
    step.buckets.forEach((b, i) => assert.ok(step.items.some((it) => it.bucket === i), `${lesson}/${id}: nothing goes in "${b}"`));
  };
  keyed('loop-patterns', 'sort-patterns', [
    [/Add up the prices/, 'Accumulate'], [/called Sam/, 'Search'], [/words longer than five/, 'Filter'],
    [/Join all the words/, 'Accumulate'], [/first negative number/, 'Search'], [/only the even numbers/, 'Filter'],
  ]);
  keyed('nested-data', 'shapes', [
    [/chessboard/, 'List of lists'], [/contacts/, 'List of dictionaries'], [/each day of the week/, 'Dictionary of lists'],
    [/pixels/, 'List of lists'], [/books in a library/, 'List of dictionaries'], [/Words filed under/, 'Dictionary of lists'],
  ]);
  keyed('functions-in-depth', 'sort-pure', [
    [/returns the larger one/, 'Pure'], [/`rate` that it reads/, 'Not pure'], [/returns the sum of its items/, 'Pure'],
    [/counter that lives in the main program/, 'Not pure'], [/returns it backwards/, 'Pure'], [/appends an item to that very list/, 'Not pure'],
  ]);

  // loop-patterns/match-patterns: each line, dropped into a real loop, behaves as its pattern says
  const pairs = Object.fromEntries(one('loop-patterns', 'match-patterns').pairs.map(([line, pattern]) => [pattern, bare(line)]));
  assert.deepEqual(Object.keys(pairs).sort(), ['Accumulate', 'Count', 'Filter', 'Find the best', 'Search']);
  const nums = '[4, -2, 7, -5, 0]';
  const body = (line) => line.replace(': ', ':\n            ');
  const programs = {
    Accumulate: `total = 0\nfor x in ${nums}:\n    ${pairs.Accumulate}\nprint(total)`,
    Count: `count = 0\nfor x in ${nums}:\n    ${pairs.Count}\nprint(count)`,
    Filter: `kept = []\nfor x in ${nums}:\n    ${pairs.Filter}\nprint(kept)`,
    Search: `def first(nums):\n    for x in nums:\n        ${pairs.Search}\nprint(first(${nums}))`,
    'Find the best': `lowest = 100\nfor x in ${nums}:\n    ${pairs['Find the best']}\nprint(lowest)`,
  };
  void body;
  const names = Object.keys(programs);
  const out = both(names.map((k) => programs[k])).map((r) => r.out);
  assert.deepEqual(Object.fromEntries(names.map((k, i) => [k, out[i]])), { Accumulate: '4', Count: '2', Filter: '[-2, -5]', Search: '-2', 'Find the best': '-5' });

  // build-a-program/match-cases: each example really is a case of its kind
  const cases = Object.fromEntries(one('build-a-program', 'match-cases').pairs.map(([kind, input]) => [kind, JSON.parse(bare(input))]));
  assert.deepEqual(Object.keys(cases), ['Typical', 'Empty', 'One item', 'A tie']);
  const longestCount = (words) => words.filter((w) => w.length === Math.max(...words.map((v) => v.length))).length;
  assert.ok(cases.Typical.length >= 3 && longestCount(cases.Typical) === 1);
  assert.equal(cases.Empty.length, 0);
  assert.equal(cases['One item'].length, 1);
  assert.ok(cases['A tie'].length === 2 && longestCount(cases['A tie']) === 2);
});

test('functions-in-depth/sort-pure: an experiment for each kind of function', () => {
  const programs = {
    larger: 'def larger(a, b):\n    if a > b:\n        return a\n    return b\nprint(larger(3, 8), larger(3, 8))',
    rate: 'rate = 2\ndef cost(hours):\n    return hours * rate\nfirst = cost(3)\nrate = 5\nprint(first, cost(3))',
    counter: 'count = 0\ndef bump():\n    global count\n    count = count + 1\nbump()\nbump()\nprint(count)',
    append: 'def add(items, x):\n    items.append(x)\n    return items\nmine = [1]\nadd(mine, 2)\nprint(mine)',
    pureAppend: 'def added(items, x):\n    return items + [x]\nmine = [1]\nprint(added(mine, 2), mine)',
    backwards: 'def back(w):\n    out = ""\n    for ch in w:\n        out = ch + out\n    return out\nprint(back("stop"), back("stop"))',
  };
  const keys = Object.keys(programs);
  const r = Object.fromEntries(both(keys.map((k) => programs[k])).map((res, i) => [keys[i], res.out]));
  assert.equal(r.larger, '8 8');
  assert.equal(r.rate, '6 15');            // the same call, two answers: not pure
  assert.equal(r.counter, '2');            // it changes something outside itself
  assert.equal(r.append, '[1, 2]');        // the caller's list is changed
  assert.equal(r.pureAppend, '[1, 2] [1]');// "A pure version would build and return a new list"
  assert.equal(r.backwards, 'pots pots');
});

test('multi steps: one small experiment per statement', () => {
  const truths = one('recursion', 'truths');
  const experiments = [
    [/needs a base case/, 'def f(n):\n    return f(n - 1)\nf(3)', (r) => r.error && r.error[0] === 'RecursionError'],
    [/own set of local variables/, 'def f(n):\n    if n == 0:\n        return\n    f(n - 1)\n    print(n)\nf(3)', (r) => r.out === '1\n2\n3'],
    [/closer to the base case/, 'def f(n):\n    if n == 0:\n        return 0\n    return f(n + 1)\nf(3)', (r) => r.error && r.error[0] === 'RecursionError'],
    [/can finish before the call it made/, 'def f(n):\n    if n > 0:\n        f(n - 1)\n    print("end", n)\nf(2)', (r) => r.out !== 'end 0\nend 1\nend 2'],
    [/simply returns `None` after a while/, 'def f(n):\n    return f(n - 1)\nprint(f(3))', (r) => !r.error && r.out === 'None'],
  ];
  assert.equal(truths.options.length, experiments.length);
  let results = both(experiments.map((e) => e[1]));
  experiments.forEach(([pattern, , holds], i) => {
    const option = truths.options.find((o) => pattern.test(o.text));
    assert.ok(option, String(pattern));
    assert.equal(!!option.correct, !!holds(results[i]), option.text);
    assert.ok(option.correct || option.why);
  });

  const building = one('build-a-program', 'truths');
  const compose = raw('functions-in-depth', 'code-compose').solution.replace('discounted(subtotal(prices)) + tip', 'discounted(subtotal(prices) + tip)');
  const more = [
    [/condition is true does nothing/, 'assert 2 > 1\nprint("on")', (r) => !r.error && r.out === 'on'],
    [/condition is false stops the program/, 'assert 2 < 1\nprint("on")', (r) => r.error && r.error[0] === 'AssertionError' && r.out === ''],
    // an empty list and a single item fail in different functions: each needs its own test
    [/both worth a test of their own/, 'def average(nums):\n    return sum(nums) / len(nums)\ndef gap(nums):\n    return nums[1] - nums[0]\nprint(average([7]))\nprint(gap([7]))', (r) => r.out === '7.0' && r.error && r.error[0] === 'IndexError'],
    // right for a typical input, wrong at the edge
    [/one typical input, it is correct/, 'def biggest(nums):\n    best = 0\n    for n in nums:\n        if n > best:\n            best = n\n    return best\nprint(biggest([3, 9, 4]) == 9, biggest([-5, -2]) == -2)', (r) => r.out === 'True True'],
    // two correct pieces, joined in the wrong order
    [/needs no test of its own/, `${compose}\nprint(subtotal([10, 4]) == 14, discounted(14) == 14, to_pay([10, 4], 3) == 17)`, (r) => r.out.split('\n').pop() === 'True True True'],
  ];
  assert.equal(building.options.length, more.length);
  results = both(more.map((e) => e[1]));
  more.forEach(([pattern, , holds], i) => {
    const option = building.options.find((o) => pattern.test(o.text));
    assert.ok(option, String(pattern));
    assert.equal(!!option.correct, !!holds(results[i]), `${option.text}: ${results[i].out}`);
    assert.ok(option.correct || option.why);
  });
});

/* -------------------------------------------- interact steps: every state */

function subsets(n) { return Array.from({ length: 1 << n }, (_, mask) => Array.from({ length: n }, (_, i) => i).filter((i) => mask & (1 << i))); }
const gridState = (on) => ({ on, colors: Object.fromEntries(on.map((i) => [i, 1])), count: on.length });

test('nested-data/tap-cell: of all 4096 selections, only the one cell grid[2][1] is accepted', () => {
  const s = one('nested-data', 'tap-cell');
  const [r, c] = /`grid\[(\d)\]\[(\d)\]`/.exec(s.text).slice(1).map(Number);
  const rows = [...codeOf(s).matchAll(/^ {4}\[([\d, ]+)\],$/gm)].map((m) => ints(m[1]));
  assert.deepEqual([rows.length, rows[0].length, s.widget.rows, s.widget.cols], [3, 4, 3, 4]);
  assert.deepEqual(s.widget.labels, rows.flat(), 'the board shows the numbers of the listing, row by row');
  assert.deepEqual([s.widget.rowLabels, s.widget.colLabels], [['0', '1', '2'], ['0', '1', '2', '3']]);
  assert.match(s.text, /numbers down the left side count the rows, and the numbers along the top count the columns/);
  const target = r * 4 + c;
  assert.equal(target, 9);
  assert.ok(s.explain.includes(`\`grid[${r}]\` is the row \`[${rows[r].join(', ')}]\``) && s.explain.includes(`its second item: \`${rows[r][c]}\``));
  const [listing] = both([`${codeOf(s)}\nprint(grid[${r}], grid[${r}][${c}])`]);
  assert.equal(listing.out, `[${rows[r].join(', ')}] ${rows[r][c]}`);
  let accepted = 0;
  for (const on of subsets(12)) {
    const verdict = s.check(gridState(on));
    if (on.length === 1 && on[0] === target) { assert.equal(verdict, true); accepted++; continue; }
    assert.equal(typeof verdict, 'string', `selection ${on} must not be accepted`);
    if (on.length === 0) assert.match(verdict, /Tap a cell/);
    else if (on.length > 1) assert.match(verdict, /just one cell/);
    else {
      const [row, col] = [Math.floor(on[0] / 4), on[0] % 4];
      let x;
      if ((x = /^That is `grid\[(\d)\]\[(\d)\]`/.exec(verdict))) assert.deepEqual([Number(x[1]), Number(x[2])], [row, col]);
      else if (/^Right row/.test(verdict)) { assert.equal(row, r); assert.notEqual(col, c); assert.ok(verdict.includes(`\`[${c}]\` is the second cell`) && c === 1); }
      else if (/^Right column, wrong row/.test(verdict)) { assert.equal(col, c); assert.notEqual(row, r); assert.ok(verdict.includes(`\`grid[${r}]\` is the third row`) && r === 2); }
      else { assert.match(verdict, /^Not that one/); assert.ok(row !== r && col !== c); }
    }
  }
  assert.equal(accepted, 1);
  assert.equal(s.check(gridState(s.solution.on)), true);
  // the picture in the next step marks the same cell
  const idea = one('nested-data', 'idea');
  assert.equal(idea.figures[0].caption, `grid[${r}][${c}] is ${rows[r][c]}`);
  assert.ok(idea.figures[0].content.includes('fill-yellow-soft'));
});

test('nested-data/tap-neighbours: of all 4096 selections, only the five cells that touch the star are accepted', () => {
  const s = one('nested-data', 'tap-neighbours');
  const { rows, cols, labels } = s.widget;
  assert.deepEqual([rows, cols], [3, 4]);
  const star = labels.indexOf('★');
  assert.equal(labels.filter((l) => l !== '').length, 1);
  const [sr, sc] = [Math.floor(star / cols), star % cols];
  const touching = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!(r === sr && c === sc) && Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1) touching.push(r * cols + c);
  assert.equal(touching.length, 5);
  assert.ok(s.explain.includes(`Only **${touching.length}**`));
  assert.ok(sc === cols - 1 && sr > 0 && sr < rows - 1, 'the star is on the right-hand edge, not in a corner: three cells to its right are missing');
  // "A cell in a corner has just three neighbours"
  let corner = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!(r === 0 && c === 0) && r <= 1 && c <= 1) corner++;
  assert.equal(corner, 3);
  const edgeOnly = touching.filter((i) => Math.floor(i / cols) === sr || i % cols === sc);
  let accepted = 0;
  for (const on of subsets(12)) {
    const verdict = s.check(gridState(on));
    const exact = on.length === touching.length && on.every((i) => touching.includes(i));
    if (exact) { assert.equal(verdict, true); accepted++; continue; }
    assert.equal(typeof verdict, 'string', `selection ${on} must not be accepted`);
    if (on.includes(star)) assert.match(verdict, /not its own neighbour/);
    else if (on.some((i) => !touching.includes(i))) assert.match(verdict, /does not touch ★/);
    else if (edgeOnly.every((i) => on.includes(i))) {
      assert.match(verdict, /only at a corner count as neighbours too/);
      assert.ok(touching.filter((i) => !on.includes(i)).every((i) => !edgeOnly.includes(i)), 'only corner-touching cells are missing');
    } else assert.match(verdict, /There are more/);
  }
  assert.equal(accepted, 1);
  assert.equal(s.check(gridState(s.solution.on)), true);
});

test('build-a-program/wheel: of the 26 keys, only 3 turns HELLO into KHOOR', () => {
  const s = one('build-a-program', 'wheel');
  assert.deepEqual([s.widget.text, s.widget.mode], ['HELLO', 'encode']);
  assert.match(s.text, /until `HELLO` turns into `KHOOR`/);
  const turn = (text, key) => caesar(text.toLowerCase(), key).toUpperCase();
  for (let key = 0; key < 26; key++) {
    const output = turn('HELLO', key);
    const verdict = s.check({ mode: 'encode', shift: key, input: 'HELLO', output, top: [] });
    if (output === 'KHOOR') { assert.equal(key, 3); assert.equal(verdict, true); continue; }
    assert.equal(typeof verdict, 'string');
    if (key === 0) assert.match(verdict, /nothing moves/);
    else assert.ok(verdict.includes(`With key ${key}, HELLO turns into ${output}.`), verdict);
  }
  assert.equal(s.solution.shift, 3);
  assert.match(s.explain, /H → K, E → H, L → O and O → R/);
  assert.equal(turn('HELO', 3), 'KHOR');
});

test('tracer steps are finished exactly when the end has been reached', () => {
  let count = 0;
  for (const [lesson, step] of allSteps()) {
    if (step.type !== 'interact' || step.widget.type !== 'py-trace') continue;
    count++;
    assert.equal(step.check({ step: 9, steps: 9, done: true, atEnd: true, line: 0, misses: 0 }), true, `${lesson}/${step.id}`);
    assert.equal(typeof step.check({ step: 3, steps: 9, done: false, atEnd: false, line: 2, misses: 1 }), 'string', `${lesson}/${step.id}`);
    assert.deepEqual(step.solution, { done: true });
    assert.equal(step.graded, false);
  }
  assert.equal(count, 7);
});

/* ------------------------------------ interact steps with an editor (py-run) */

/** The state a py-run widget reports after running a program once. */
function ran(src) {
  const r = run(src);
  return { code: src, runs: 1, ok: !r.error, stdout: r.stdout, error: r.error ? r.error.type : null, edited: true };
}
const NOT_RUN = { code: '', runs: 0, ok: null, stdout: '', error: null, edited: false };

test('strings/explore: any way of slicing out `hon` is accepted, and nothing else', () => {
  const s = one('strings', 'explore');
  const base = codeOf(s);
  assert.equal(base, 'word = "python"\nprint(word[1:4])');
  const tries = ['[3:6]', '[3:]', '[-3:]', '[3:10]', '[1:4]', '[3:5]', '[2:5]', '[:2]', '[-1]', '[6]', '[-7]', '[4:2]'].map((index) => base.replace('[1:4]', index));
  const mine = ['hon', 'hon', 'hon', 'hon', 'yth', 'ho', 'tho', 'py', 'n', 'IndexError', 'IndexError', ''];
  const results = both(tries);
  assert.deepEqual(results.map((r) => (r.error ? r.error[0] : r.out)), mine);
  tries.forEach((src, i) => {
    const verdict = s.check(ran(src));
    if (mine[i] === 'hon') assert.equal(verdict, true, src);
    else if (mine[i] === 'IndexError') assert.match(verdict, /That position does not exist/);
    else assert.match(verdict, /Not `hon` yet/);
  });
  assert.match(s.check(NOT_RUN), /press Run/);
  assert.match(s.check(ran('word = "python"\nprint(word[1:4)')), /stopped with an error/);
  assert.equal(s.check(ran(s.solution.code)), true);
  assert.ok(s.explain.includes('`word[3:6]` gives `hon`') && s.explain.includes('`word[3:]`') && s.explain.includes('`word[-3:]`'));
});

test('loop-patterns/pairs: accepted exactly when twelve lines are printed', () => {
  const s = one('loop-patterns', 'pairs');
  const base = codeOf(s);
  const withLists = (sizes, colours) => base.replace('["S", "M"]', JSON.stringify(sizes).replace(/,/g, ', ')).replace('["red", "green", "blue"]', JSON.stringify(colours).replace(/,/g, ', '));
  const S = ['S', 'M', 'L', 'XL', 'XXL', 'XS'];
  const C = ['red', 'green', 'blue', 'pink', 'grey', 'gold'];
  const tries = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) tries.push([a, b, withLists(S.slice(0, a), C.slice(0, b))]);
  const results = both(tries.map((t) => t[2]));
  tries.forEach(([a, b, src], i) => {
    assert.equal(results[i].out.split('\n').length, a * b, 'one line for every size with every colour');
    const verdict = s.check(ran(src));
    if (a * b === 12) assert.equal(verdict, true, `${a} × ${b}`);
    else if (a * b === 6) assert.match(verdict, /Still 6 lines/);
    else assert.ok(verdict.includes(`That prints ${a * b} ${a * b === 1 ? 'line' : 'lines'}, not 12.`), verdict);
  });
  assert.match(s.check(NOT_RUN), /Press Run first/);
  assert.match(s.check(ran(base.replace('"M"]', '"M"'))), /stopped with an error/);
  assert.equal(s.check(ran(s.solution.code)), true);
  assert.equal(both([s.solution.code])[0].out.split('\n').length, 12);
  assert.match(s.text, /2 sizes and 3 colours make 6 lines/);
  assert.match(s.explain, /4 sizes × 3 colours, or 2 × 6, or 3 × 4/);
});

test('recursion/no-base: the repair has to stop at 1, and a base case in the wrong place is explained', () => {
  const s = one('recursion', 'no-base');
  const fixes = {
    solution: s.solution.code,
    lessThan: j('def countdown(n):', '    if n < 1:', '        return', '    print(n)', '    countdown(n - 1)', '', 'countdown(3)'),
    guard: j('def countdown(n):', '    if n > 0:', '        print(n)', '        countdown(n - 1)', '', 'countdown(3)'),
    late: j('def countdown(n):', '    print(n)', '    if n == 0:', '        return', '    countdown(n - 1)', '', 'countdown(3)'),
    untouched: codeOf(s),
    upwards: j('def countdown(n):', '    if n == 0:', '        return', '    print(n)', '    countdown(n + 1)', '', 'countdown(3)'),
    loop: j('def countdown(n):', '    while n > 0:', '        print(n)', '        n = n - 1', '', 'countdown(3)'),
    twoOnly: j('def countdown(n):', '    if n == 1:', '        return', '    print(n)', '    countdown(n - 1)', '', 'countdown(3)'),
    typo: j('def countdown(n):', '    if n == 0', '        return', '    print(n)', '    countdown(n - 1)', '', 'countdown(3)'),
  };
  const keys = Object.keys(fixes);
  const r = Object.fromEntries(both(keys.map((k) => fixes[k])).map((res, i) => [keys[i], res]));
  for (const k of ['solution', 'lessThan', 'guard', 'loop']) { assert.equal(r[k].out, '3\n2\n1', k); assert.equal(s.check(ran(fixes[k])), true, k); }
  assert.equal(r.late.out, '3\n2\n1\n0');
  assert.match(s.check(ran(fixes.late)), /the 0 should not be printed/);
  for (const k of ['untouched', 'upwards']) { assert.equal(r[k].error[0], 'RecursionError'); assert.match(s.check(ran(fixes[k])), /Still no way out/); }
  assert.equal(r.twoOnly.out, '3\n2');
  assert.match(s.check(ran(fixes.twoOnly)), /should be `3`, `2` and `1`/);
  assert.match(s.check(ran(fixes.typo)), /stopped with an error/);
  assert.match(s.check(NOT_RUN), /Press Run/);
});

test('recursion/fib-cost: the call counts, and what the check says at 10, 20 and 25', () => {
  const s = one('recursion', 'fib-cost');
  const at = (n) => codeOf(s).replace('fib(10)', `fib(${n})`);
  // my own count: fib by a loop, and calls(n) = 1 + calls(n - 1) + calls(n - 2) with calls(0) = calls(1) = 1
  const fibs = [0, 1];
  const calls = [1, 1];
  for (let n = 2; n <= 25; n++) { fibs.push(fibs[n - 1] + fibs[n - 2]); calls.push(1 + calls[n - 1] + calls[n - 2]); }
  assert.deepEqual([fibs[10], calls[10], fibs[20], calls[20]], [55, 177, 6765, 21891]);
  printsAll([[at(10), `55 after ${calls[10]} calls`], [at(20), `6765 after ${calls[20]} calls`], [at(12), `${fibs[12]} after ${calls[12]} calls`]]);
  assert.ok(s.explain.includes(`\`fib(10)\` takes ${calls[10]} calls, but \`fib(20)\` takes **21,891**`));
  assert.ok(calls[20] / calls[10] > 100);                           // "more than a hundred times the work"
  // Which calls make two more? Only those above the base case, and that is just under half of them:
  // counted here with my own recurrence, then by a program in both Pythons.
  const inner = [0, 0];
  for (let n = 2; n <= 20; n++) inner.push(1 + inner[n - 1] + inner[n - 2]);
  assert.deepEqual([inner[10], calls[10] - inner[10], inner[20], calls[20] - inner[20]], [88, 89, 10945, 10946]);
  const tally = (n) => j('two = 0', 'none = 0', '', 'def fib(n):', '    global two, none', '    if n < 2:', '        none = none + 1', '        return n', '    two = two + 1', '    return fib(n - 1) + fib(n - 2)', '', `print(fib(${n}), two, none, two + none)`);
  printsAll([[tally(10), `55 ${inner[10]} ${calls[10] - inner[10]} ${calls[10]}`], [tally(20), `6765 ${inner[20]} ${calls[20] - inner[20]} ${calls[20]}`]]);
  assert.ok(s.explain.includes('Every call that has not reached the base case makes two more'), s.explain);
  assert.ok(!/almost every call/i.test(s.explain), 'about half of the calls are base cases, which make no further call');
  assert.ok(fibs.slice(0, 7).join(', ') === '0, 1, 1, 2, 3, 5, 8' && s.text.includes('0, 1, 1, 2, 3, 5, 8…'));
  assert.equal(s.check(ran(at(20))), true);
  assert.equal(s.check(ran(s.solution.code)), true);
  assert.ok(s.check(ran(at(10))).includes(`That is \`fib(10)\`: ${calls[10]} calls.`));
  assert.match(s.check(ran(at(15))), /Set the number on the last line to 20/);
  assert.match(s.check(ran(at(25))), /Too far/);                    // "Try 25, and Learntopia gives up"
  assert.equal(run(at(25)).error.type, 'TimeoutError');
  assert.match(s.check(NOT_RUN), /Press Run first/);
  assert.match(s.check(ran(at(20).replace('return n\n', 'return m\n'))), /stopped with an error/);
});

test('build-a-program/crack: the message is found with key 17, by hand or with a loop over all 26 keys', () => {
  const s = one('build-a-program', 'crack');
  const code = codeOf(s);
  const secret = /^secret = "(.*)"$/m.exec(code)[1];
  assert.equal(secret, caesar(PLAIN, KEY), 'the intercepted message is the plain text moved 17 places');
  assert.equal(caesar(secret, -KEY), PLAIN);
  assert.ok(code.split('\n').length <= 17, 'the whole machine fits a laptop screen');
  assert.ok(code.includes(raw('build-a-program', 'code-decode').solution), 'the editor holds exactly the three functions built in the steps before');
  const byHand = (key) => code.replace('decode(secret, 1)', `decode(secret, ${key})`);
  const loop = s.solution.code;
  const results = both([code, byHand(KEY), byHand(KEY + 26), loop, byHand(3)]);
  assert.equal(results[1].out, PLAIN);
  assert.equal(results[2].out, PLAIN);
  const lines = results[3].out.split('\n');
  assert.equal(lines.length, 26);
  lines.forEach((line, key) => assert.equal(line, `${key} ${caesar(secret, -key)}`));
  assert.deepEqual(lines.filter((line) => line.endsWith(PLAIN)), [`${KEY} ${PLAIN}`], 'exactly one of the 26 lines is readable');
  assert.equal(typeof s.check(ran(code)), 'string');
  assert.match(s.check(ran(code)), /No readable message/);
  assert.equal(s.check(ran(byHand(KEY))), true);
  assert.equal(s.check(ran(loop)), true);
  assert.match(s.check(ran(byHand(3))), /No readable message/);
  assert.match(s.check(NOT_RUN), /Press Run/);
  assert.match(s.check(ran(code.replace('print(decode(secret, 1))', 'print(decode(secret))'))), /stopped with an error/);
  assert.ok(s.explain.includes(`The key was ${KEY}.`));
});

/* ------------------------------------------------------------- code steps */

const pyLit = (v) => (Array.isArray(v) ? `[${v.map(pyLit).join(', ')}]`
  : typeof v === 'boolean' ? (v ? 'True' : 'False')
  : typeof v === 'string' ? JSON.stringify(v)
  : v && typeof v === 'object' ? `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${pyLit(x)}`).join(', ')}}`
  : String(v));
/** The program with its first top-level assignment to each name replaced: what `set` does, done by hand. */
function withInputs(src, set) {
  let text = src;
  for (const [name, value] of Object.entries(set || {})) {
    const re = new RegExp(`^${name}[ \\t]*=(?!=).*$`, 'm');
    assert.ok(re.test(text), `no top-level "${name} = …" line in:\n${src}`);
    text = text.replace(re, `${name} = ${pyLit(value)}`);
  }
  return text;
}
/** The arguments of a call written with Python literals, as JavaScript values. */
function argsOf(expr, name) {
  const m = new RegExp(`^${name}\\((.*)\\)$`).exec(expr);
  assert.ok(m, `${expr} is a call of ${name}`);
  return JSON.parse(`[${m[1]}]`);
}

const LAMPS = [[1, 1, 0], [0, 1, 0], [1, 0, 1]];
const lampsLine = 'lamps = [[1, 1, 0], [0, 1, 0], [1, 0, 1]]';
const SHIFT_FN = j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch not in letters:', '        return ch', '    return letters[(letters.find(ch) + key) % 26]');
const ENCODE_FN = j('def encode(text, key):', '    result = ""', '    for ch in text:', '        result = result + shift(ch, key)', '    return result');
const HELPERS = j('def subtotal(prices):', '    return sum(prices)', '', 'def discounted(amount):', '    if amount > 15:', '        return amount - 2', '    return amount');
const ASSERTS = j('assert biggest([3, 9, 4]) == 9', 'assert biggest([-5, -2]) == -2', 'print("All tests passed")');
const afterDiscount = (amount) => (amount > 15 ? amount - 2 : amount);

// For every code step: my own answer to the task (out: what the program should
// print for given inputs; call: what an expression should be), correct
// programs written a different way, and plausible wrong ones.
const CODE = {
  'strings/code-initials': {
    call: (expr) => argsOf(expr, 'initials')[0].split(' ').filter(Boolean).map((w) => w[0].toUpperCase()).join(''),
    good: [
      j('def initials(name):', '    letters = []', '    for w in name.upper().split(" "):', '        letters.append(w[0])', '    return "".join(letters)'),
      j('def initials(name):', '    result = name[0].upper()', '    for i in range(1, len(name)):', '        if name[i - 1] == " ":', '            result = result + name[i].upper()', '    return result'),
      j('def initials(name):', '    out = ""', '    words = name.split()', '    i = 0', '    while i < len(words):', '        out += words[i][0]', '        i += 1', '    return out.upper()', '', 'print(initials("ada lovelace"))'),
    ],
    bad: [
      j('def initials(name):', '    return name[0].upper()'),
      j('def initials(name):', '    result = ""', '    for word in name.split():', '        result = result + word[0]', '    return result'),
      j('def initials(name):', '    result = ""', '    for word in name.split():', '        result = result + word[0].upper()', '    print(result)'),
      j('def initials(name):', '    return "AL"'),
      j('def initials(name):', '    result = ""', '    for word in name.split():', '        result = result + word[-1].upper()', '    return result'),
      j('def initials(name):', '    result = ""', '    for word in name.split():', '        result = word[0].upper()', '    return result'),
    ],
  },
  'strings/code-palindrome': {
    call: (expr) => { const t = argsOf(expr, 'is_palindrome')[0].toLowerCase().split(' ').join(''); return t === [...t].reverse().join(''); },
    good: [
      j('def is_palindrome(text):', '    clean = text.lower().replace(" ", "")', '    return clean == clean[::-1]'),
      j('def is_palindrome(text):', '    clean = ""', '    for ch in text:', '        if ch != " ":', '            clean = clean + ch.lower()', '    i = 0', '    while i < len(clean) // 2:', '        if clean[i] != clean[-1 - i]:', '            return False', '        i = i + 1', '    return True'),
      j('def is_palindrome(text):', '    t = text.replace(" ", "").lower()', '    if len(t) < 2:', '        return True', '    if t[0] != t[-1]:', '        return False', '    return is_palindrome(t[1:-1])'),
      // a flag is fine as long as it can only ever go from True to False
      j('def is_palindrome(text):', '    clean = text.upper().replace(" ", "")', '    same = True', '    for i in range(len(clean)):', '        if clean[i] != clean[len(clean) - 1 - i]:', '            same = False', '    return same'),
    ],
    bad: [
      j('def is_palindrome(text):', '    return text == text[::-1]'),
      j('def is_palindrome(text):', '    t = text.lower()', '    return t == t[::-1]'),
      j('def is_palindrome(text):', '    t = text.replace(" ", "")', '    return t == t[::-1]'),
      j('def is_palindrome(text):', '    t = text.lower().replace(" ", "")', '    return t[0] == t[-1]'),
      j('def is_palindrome(text):', '    return True'),
      j('def is_palindrome(text):', '    clean = text.lower().replace(" ", "")', '    print(clean == clean[::-1])'),
      j('def is_palindrome(text):', '    clean = text.lower().replace(" ", "")', '    return str(clean == clean[::-1])'),
      // a flag that every pass overwrites: only the LAST pair compared decides (found in review; needs a word like "foot")
      j('def is_palindrome(text):', '    clean = text.lower().replace(" ", "")', '    same = True', '    for i in range(len(clean) // 2):', '        same = clean[i] == clean[len(clean) - 1 - i]', '    return same'),
      j('def is_palindrome(text):', '    clean = text.lower().replace(" ", "")', '    same = True', '    for i in range(len(clean) // 2):', '        if clean[i] == clean[-1 - i]:', '            same = True', '        else:', '            same = False', '    return same'),
      j('def is_palindrome(text):', '    clean = text.lower().replace(" ", "")', '    same = True', '    for i in range(len(clean) // 2 - 1, -1, -1):', '        same = clean[i] == clean[-1 - i]', '    return same'),
      j('def is_palindrome(text):', '    clean = text.lower().replace(" ", "")', '    for i in range(len(clean) // 2):', '        if clean[i] != clean[-1 - i]:', '            return False', '        else:', '            return True', '    return True'),
      j('def is_palindrome(text):', '    clean = text.lower().replace(" ", "", 1)', '    return clean == clean[::-1]'),                  // only the first space goes
    ],
  },
  'loop-patterns/code-collatz': {
    call: (expr) => { let [n] = argsOf(expr, 'collatz_steps'); let count = 0; while (n !== 1) { n = n % 2 === 0 ? n / 2 : 3 * n + 1; count++; } return count; },
    good: [
      j('def collatz_steps(n):', '    count = 0', '    while n > 1:', '        if n % 2 == 1:', '            n = 3 * n + 1', '        else:', '            n = n // 2', '        count += 1', '    return count'),
      j('def collatz_steps(n):', '    if n == 1:', '        return 0', '    if n % 2 == 0:', '        return 1 + collatz_steps(n // 2)', '    return 1 + collatz_steps(3 * n + 1)'),
      j('def collatz_steps(n):', '    steps = 0', '    while True:', '        if n == 1:', '            break', '        if n % 2 == 0:', '            n = n / 2', '        else:', '            n = 3 * n + 1', '        steps = steps + 1', '    return steps'),
    ],
    bad: [
      j('def collatz_steps(n):', '    count = 0', '    # repeat until n is 1', '    return count'),
      j('def collatz_steps(n):', '    count = 1', '    while n != 1:', '        if n % 2 == 0:', '            n = n // 2', '        else:', '            n = 3 * n + 1', '        count = count + 1', '    return count'),
      j('def collatz_steps(n):', '    count = 0', '    while n != 1:', '        if n % 2 == 0:', '            n = n // 2', '            count = count + 1', '        else:', '            n = 3 * n + 1', '    return count'),
      j('def collatz_steps(n):', '    count = 0', '    while n != 1:', '        n = n // 2', '        count = count + 1', '    return count'),
      j('def collatz_steps(n):', '    count = 0', '    while n != 1:', '        if n % 2 == 0:', '            n = n // 2', '        else:', '            n = 3 * n + 1', '        count = count + 1', '    return n'),
      j('def collatz_steps(n):', '    count = 0', '    while n != 1:', '        if n % 2 == 0:', '            n = n // 2', '        else:', '            n = 3 * n + 1', '        count = count + 1', '    print(count)'),
      j('def collatz_steps(n):', '    return 8'),
    ],
  },
  'loop-patterns/code-first-long': {
    call: (expr) => { const [words, n] = argsOf(expr, 'first_long'); for (const w of words) if (w.length > n) return w; return ''; },
    good: [
      j('def first_long(words, n):', '    result = ""', '    for w in words:', '        if len(w) > n:', '            result = w', '            break', '    return result'),
      j('def first_long(words, n):', '    i = 0', '    while i < len(words):', '        if len(words[i]) >= n + 1:', '            return words[i]', '        i += 1', '    return ""'),
      j('def first_long(words, n):', '    found = ""', '    for w in words:', '        if found == "" and len(w) > n:', '            found = w', '    return found'),
    ],
    bad: [
      j('def first_long(words, n):', '    for word in words:', '        if len(word) >= n:', '            return word', '    return ""'),
      j('def first_long(words, n):', '    result = ""', '    for word in words:', '        if len(word) > n:', '            result = word', '    return result'),
      j('def first_long(words, n):', '    for word in words:', '        if len(word) > n:', '            return word', '        else:', '            return ""'),
      j('def first_long(words, n):', '    best = ""', '    for word in words:', '        if len(word) > n and len(word) > len(best):', '            best = word', '    return best'),
      j('def first_long(words, n):', '    for word in words:', '        if len(word) > n:', '            print(word)', '    return ""'),
      j('def first_long(words, n):', '    for word in words:', '        if len(word) > n:', '            return word'),
    ],
  },
  'loop-patterns/code-warmest': {
    call: (expr) => { const [temps] = argsOf(expr, 'warmest_day'); let best = 0; temps.forEach((t, i) => { if (t > temps[best]) best = i; }); return best; },
    good: [
      j('def warmest_day(temps):', '    return temps.index(max(temps))'),
      j('def warmest_day(temps):', '    best = 0', '    for i in range(1, len(temps)):', '        if temps[i] > temps[best]:', '            best = i', '    return best'),
      j('def warmest_day(temps):', '    best_i = 0', '    best_t = temps[0]', '    i = 0', '    while i < len(temps):', '        if temps[i] > best_t:', '            best_t = temps[i]', '            best_i = i', '        i = i + 1', '    return best_i'),
    ],
    bad: [
      j('def warmest_day(temps):', '    best = 0', '    return best'),
      j('def warmest_day(temps):', '    best = 0', '    for i, t in enumerate(temps):', '        if t >= temps[best]:', '            best = i', '    return best'),
      j('def warmest_day(temps):', '    best = temps[0]', '    for t in temps:', '        if t > best:', '            best = t', '    return best'),
      j('def warmest_day(temps):', '    best = 0', '    top = 0', '    for i, t in enumerate(temps):', '        if t > top:', '            top = t', '            best = i', '    return best'),
      j('def warmest_day(temps):', '    return len(temps) - 1'),
      j('def warmest_day(temps):', '    best = 0', '    for i, t in enumerate(temps):', '        if t > temps[best]:', '            best = i', '    print(best)'),
      // compares each day with the day before it, not with the best so far (found in review; needs a list that rises again below its peak)
      j('def warmest_day(temps):', '    best = 0', '    for i in range(1, len(temps)):', '        if temps[i] > temps[i - 1]:', '            best = i', '    return best'),
      j('def warmest_day(temps):', '    top = max(temps)', '    best = 0', '    for i, t in enumerate(temps):', '        if t == top:', '            best = i', '    return best'),   // the latest of the ties
      j('def warmest_day(temps):', '    for i in range(1, len(temps)):', '        if temps[i] > temps[0]:', '            return i', '    return 0'),                                  // the first day warmer than day 0
    ],
  },
  'nested-data/code-rows': {
    out: ({ rows = 2, cols = 3 }) => pyLit(Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (r === 0 && c === 0 ? 5 : 0)))),
    call: (expr) => { assert.equal(expr, 'grid[1] is grid[2]'); return false; },      // separate rows are never one and the same list
    good: [
      j('rows = 2', 'cols = 3', 'grid = []', 'r = 0', 'while r < rows:', '    row = []', '    for c in range(cols):', '        row.append(0)', '    grid.append(row)', '    r += 1', 'grid[0][0] = 5', 'print(grid)'),
      j('rows = 2', 'cols = 3', 'row = [0] * cols', 'grid = []', 'for r in range(rows):', '    grid.append(row.copy())', 'grid[0][0] = 5', 'print(grid)'),
      j('rows = 2', 'cols = 3', 'grid = []', 'for r in range(rows):', '    grid = grid + [[0] * cols]', 'grid[0][0] = 5', 'print(grid)'),
    ],
    bad: [
      j('rows = 2', 'cols = 3', 'grid = [[0] * cols] * rows', 'grid[0][0] = 5', 'print(grid)'),
      j('rows = 2', 'cols = 3', 'grid = [[0, 0, 0], [0, 0, 0]]', 'grid[0][0] = 5', 'print(grid)'),
      j('rows = 2', 'cols = 3', 'row = [0] * cols', 'grid = []', 'for r in range(rows):', '    grid.append(row)', 'grid[0][0] = 5', 'print(grid)'),
      j('rows = 2', 'cols = 3', 'grid = []', 'for r in range(cols):', '    grid.append([0] * rows)', 'grid[0][0] = 5', 'print(grid)'),
      j('rows = 2', 'cols = 3', 'grid = [[0] * cols] * rows', 'grid[0] = [5] + [0] * (cols - 1)', 'print(grid)'),   // right output, rows still shared
      j('rows = 2', 'cols = 3', 'grid = []', 'for r in range(rows):', '    grid.append([0] * cols)', 'grid[0][0] = 5'),
    ],
  },
  'nested-data/code-top': {
    call: (expr) => { const [players] = argsOf(expr, 'top_scorer'); return players.reduce((best, p) => (p.score > best.score ? p : best)).name; },
    good: [
      j('def top_scorer(players):', '    best_name = players[0]["name"]', '    best_score = players[0]["score"]', '    for p in players:', '        if p["score"] > best_score:', '            best_score = p["score"]', '            best_name = p["name"]', '    return best_name'),
      j('def top_scorer(players):', '    best = 0', '    for i in range(len(players)):', '        if players[i]["score"] > players[best]["score"]:', '            best = i', '    return players[best]["name"]'),
      j('def score_of(p):', '    return p["score"]', '', 'def top_scorer(players):', '    return max(players, key=score_of)["name"]'),
    ],
    bad: [
      j('def top_scorer(players):', '    best = players[0]', '    return best["name"]'),
      j('def top_scorer(players):', '    best = players[0]', '    for p in players:', '        if p["score"] >= best["score"]:', '            best = p', '    return best["name"]'),
      j('def top_scorer(players):', '    best = players[0]', '    for p in players:', '        if p["score"] > best["score"]:', '            best = p', '    return best["score"]'),
      j('def top_scorer(players):', '    best = ""', '    top = -1', '    for p in players:', '        if p["score"] > top:', '            top = p["score"]', '            best = p["name"]', '    return best'),
      j('def top_scorer(players):', '    best = players[0]', '    for p in players:', '        best = p', '    return best["name"]'),
      j('def top_scorer(players):', '    best = players[0]', '    for p in players:', '        if p["score"] > best["score"]:', '            best = p', '    return best'),
      j('def top_scorer(players):', '    best = ""', '    top = -99', '    for p in players:', '        if p["score"] > top:', '            top = p["score"]', '            best = p["name"]', '    return best'),   // a made-up starting score
    ],
  },
  'nested-data/code-neighbours': {
    call: (expr) => {
      const [grid, r, c] = argsOf(expr.replace('(lamps,', `(${JSON.stringify(LAMPS)},`), 'neighbours');
      let count = 0;
      grid.forEach((row, rr) => row.forEach((v, cc) => { if ((rr !== r || cc !== c) && Math.abs(rr - r) <= 1 && Math.abs(cc - c) <= 1) count += v; }));
      return count;
    },
    good: [
      j('def neighbours(grid, r, c):', '    count = 0', '    for dr in [-1, 0, 1]:', '        for dc in [-1, 0, 1]:', '            if dr == 0 and dc == 0:', '                continue', '            rr = r + dr', '            cc = c + dc', '            if rr >= 0 and rr < len(grid) and cc >= 0 and cc < len(grid[0]):', '                count += grid[rr][cc]', '    return count', '', lampsLine),
      j('def neighbours(grid, r, c):', '    total = 0', '    for rr in range(max(0, r - 1), min(len(grid), r + 2)):', '        for cc in range(max(0, c - 1), min(len(grid[rr]), c + 2)):', '            total = total + grid[rr][cc]', '    return total - grid[r][c]', '', lampsLine, 'print(neighbours(lamps, 1, 1))'),
      j('def inside(grid, r, c):', '    return 0 <= r < len(grid) and 0 <= c < len(grid[0])', '', 'def neighbours(grid, r, c):', '    count = 0', '    for rr in range(r - 1, r + 2):', '        for cc in range(c - 1, c + 2):', '            if inside(grid, rr, cc) and not (rr == r and cc == c):', '                if grid[rr][cc] == 1:', '                    count = count + 1', '    return count', '', lampsLine),
    ],
    bad: [
      j('def neighbours(grid, r, c):', '    count = 0', '    for rr in range(r - 1, r + 2):', '        for cc in range(c - 1, c + 2):', '            count = count + grid[rr][cc]', '    return count', '', lampsLine),
      j('def neighbours(grid, r, c):', '    count = 0', '    for rr in range(r - 1, r + 2):', '        for cc in range(c - 1, c + 2):', '            if 0 <= rr < len(grid) and 0 <= cc < len(grid[0]):', '                count = count + grid[rr][cc]', '    return count', '', lampsLine),
      j('def neighbours(grid, r, c):', '    count = 0', '    for rr in range(r - 1, r + 2):', '        for cc in range(c - 1, c + 2):', '            if rr != r or cc != c:', '                count = count + grid[rr][cc]', '    return count', '', lampsLine),
      j('def neighbours(grid, r, c):', '    count = 0', '    for rr in range(r - 1, r + 2):', '        for cc in range(c - 1, c + 2):', '            if 0 <= rr < len(grid) and 0 <= cc < len(grid[0]):', '                if rr != r and cc != c:', '                    count = count + grid[rr][cc]', '    return count', '', lampsLine),
      j('def neighbours(grid, r, c):', '    count = 0', '    for rr in range(r - 1, r + 2):', '        for cc in range(c - 1, c + 2):', '            if 0 <= rr < len(grid) and 0 <= cc < len(grid):', '                if rr != r or cc != c:', '                    count = count + grid[rr][cc]', '    return count', '', lampsLine),
      j('def neighbours(grid, r, c):', '    count = 0', '    for rr, cc in [(r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)]:', '        if 0 <= rr < len(grid) and 0 <= cc < len(grid[0]):', '            count = count + grid[rr][cc]', '    return count', '', lampsLine),
    ],
  },
  'functions-in-depth/code-pure': {
    out: ({ prices = [4, 6] }) => String(sum(prices)),
    call: (expr) => { const [total, price] = argsOf(expr, 'add_item'); return total + price; },
    good: [
      j('def add_item(total, price):', '    total = total + price', '    return total', '', 'prices = [4, 6]', 'total = 0', 'for p in prices:', '    total = add_item(total, p)', 'print(total)'),
      j('def add_item(t, p):', '    return p + t', '', 'prices = [4, 6]', 'total = 0', 'i = 0', 'while i < len(prices):', '    total = add_item(total, prices[i])', '    i += 1', 'print(total)'),
      j('def add_item(total, price):', '    total += price', '    return total', '', 'prices = [4, 6]', 'result = 0', 'for p in prices:', '    result = add_item(result, p)', 'print(result)'),
    ],
    bad: [
      j('def add_item(price):', '    total = total + price', '', 'prices = [4, 6]', 'total = 0', 'for p in prices:', '    add_item(p)', 'print(total)'),
      j('def add_item(price):', '    global total', '    total = total + price', '', 'prices = [4, 6]', 'total = 0', 'for p in prices:', '    add_item(p)', 'print(total)'),
      j('def add_item(total, price):', '    global count', '    count = 1', '    return total + price', '', 'prices = [4, 6]', 'total = 0', 'for p in prices:', '    total = add_item(total, p)', 'print(total)'),
      j('def add_item(total, price):', '    return total + price', '', 'prices = [4, 6]', 'total = 0', 'for p in prices:', '    add_item(total, p)', 'print(total)'),
      j('def add_item(total, price):', '    return total + price', '', 'prices = [4, 6]', 'total = 10', 'print(total)'),                                   // the answer typed in
      j('def add_item(total, price):', '    return total + price', '', 'prices = [4, 6]', 'total = 0', 'for p in prices:', '    total = total + p', 'print(total)'),   // right, but the function is never used
      j('def add_item(total, price):', '    print(total + price)', '', 'prices = [4, 6]', 'total = 0', 'for p in prices:', '    add_item(total, p)'),
      j('def add_item(total, price):', '    total = total + price', '', 'prices = [4, 6]', 'total = 0', 'for p in prices:', '    total = add_item(total, p)', 'print(total)'),
    ],
  },
  'functions-in-depth/code-refactor': {
    out: ({ prices = [4, 6, 10] }) => `To pay: ${afterDiscount(sum(prices))}`,
    call: (expr) => (expr.startsWith('subtotal') ? sum(argsOf(expr, 'subtotal')[0]) : afterDiscount(argsOf(expr, 'discounted')[0])),
    good: [
      j('def subtotal(prices):', '    return sum(prices)', '', 'def discounted(amount):', '    if amount > 15:', '        amount = amount - 2', '    return amount', '', 'prices = [4, 6, 10]', 'total = subtotal(prices)', 'total = discounted(total)', 'print("To pay:", total)'),
      j('def discounted(amount):', '    if amount <= 15:', '        return amount', '    else:', '        return amount - 2', '', 'def subtotal(prices):', '    t = 0', '    i = 0', '    while i < len(prices):', '        t += prices[i]', '        i += 1', '    return t', '', 'prices = [4, 6, 10]', 'print("To pay:", discounted(subtotal(prices)))'),
    ],
    bad: [
      j('prices = [4, 6, 10]', 'total = 0', 'for p in prices:', '    total = total + p', 'if total > 15:', '    total = total - 2', 'print("To pay:", total)'),
      j('def subtotal(prices):', '    total = 0', '    for p in prices:', '        total = total + p', '    return total', '', 'def discounted(amount):', '    if amount >= 15:', '        return amount - 2', '    return amount', '', 'prices = [4, 6, 10]', 'print("To pay:", discounted(subtotal(prices)))'),
      j('def subtotal(prices):', '    total = 0', '    for p in prices:', '        total = total + p', '    print(total)', '', 'def discounted(amount):', '    if amount > 15:', '        return amount - 2', '    return amount', '', 'prices = [4, 6, 10]', 'print("To pay:", 18)'),
      j('def subtotal(prices):', '    return sum(prices)', '', 'def discounted(amount):', '    if amount > 15:', '        return amount - 2', '    return amount', '', 'prices = [4, 6, 10]', 'print("To pay:", 18)'),
      j('def subtotal(prices):', '    return sum(prices)', '', 'def discounted(amount):', '    return amount - 2', '', 'prices = [4, 6, 10]', 'print("To pay:", discounted(subtotal(prices)))'),
      j('def subtotal(prices):', '    total = 0', '    for p in prices:', '        total = p', '    return total', '', 'def discounted(amount):', '    if amount > 15:', '        return amount - 2', '    return amount', '', 'prices = [4, 6, 10]', 'print("To pay:", 18)'),
      j('def subtotal(prices):', '    return sum(prices)', '', 'def discounted(amount):', '    if amount > 15:', '        return amount - 2', '    return amount', '', 'prices = [4, 6, 10]', 'print("To pay: " + str(discounted(subtotal(prices))) + ".")'),
      // the two functions are right, but the lump is still there and nothing calls them
      j('def subtotal(prices):', '    return sum(prices)', '', 'def discounted(amount):', '    if amount > 15:', '        return amount - 2', '    return amount', '', 'prices = [4, 6, 10]', 'total = 0', 'for p in prices:', '    total = total + p', 'if total > 15:', '    total = total - 2', 'print("To pay:", total)'),
      j('def subtotal(prices):', '    return sum(prices)', '', 'def discounted(amount):', '    if amount > 15:', '        return amount - 2', '    return amount', '', 'prices = [4, 6, 10]', 'total = subtotal(prices)', 'if total > 15:', '    total = total - 2', 'print("To pay:", total)'),
    ],
  },
  'functions-in-depth/code-compose': {
    call: (expr) => { const [prices, tip = 0] = argsOf(expr.replace('tip=', ''), 'to_pay'); return afterDiscount(sum(prices)) + tip; },
    good: [
      j(HELPERS, '', 'def to_pay(prices, tip=0):', '    amount = subtotal(prices)', '    amount = discounted(amount)', '    return amount + tip'),
      j('def to_pay(prices, tip=0):', '    total = 0', '    for p in prices:', '        total += p', '    if total > 15:', '        total -= 2', '    return total + tip', '', 'print(to_pay([4, 6, 10]))'),
      j(HELPERS, '', 'def to_pay(prices, tip=0):', '    return tip + discounted(subtotal(prices))'),
    ],
    bad: [
      j(HELPERS, '', 'def to_pay(prices):', '    return 0'),
      j(HELPERS, '', 'def to_pay(prices, tip):', '    return discounted(subtotal(prices)) + tip'),
      j(HELPERS, '', 'def to_pay(prices, tip=0):', '    return discounted(subtotal(prices) + tip)'),
      j(HELPERS, '', 'def to_pay(prices, tip=0):', '    return subtotal(prices) + tip'),
      j(HELPERS, '', 'def to_pay(prices, extra=0):', '    return discounted(subtotal(prices)) + extra'),
      j(HELPERS, '', 'def to_pay(prices, tip=0):', '    return discounted(subtotal(prices))'),
      j(HELPERS, '', 'def to_pay(prices, tip=3):', '    return discounted(subtotal(prices)) + tip'),
    ],
  },
  'recursion/code-reverse': {
    call: (expr) => [...argsOf(expr, 'reverse')[0]].reverse().join(''),
    good: [
      j('def reverse(text):', '    if len(text) <= 1:', '        return text', '    return text[-1] + reverse(text[:-1])'),
      j('def reverse(text):', '    if text == "":', '        return ""', '    rest = reverse(text[1:])', '    return rest + text[0]', '', 'print(reverse("stop"))'),
      j('def reverse(text):', '    if len(text) < 2:', '        return text', '    mid = len(text) // 2', '    return reverse(text[mid:]) + reverse(text[:mid])'),
      j('def reverse(text, done=""):', '    if text == "":', '        return done', '    return reverse(text[1:], text[0] + done)'),
      j('def reverse(text):', '    return "" if text == "" else reverse(text[1:])+text[0]'),
      j('def reverse(text):', '    if len(text) < 2:', '        return text', '    return text[-1]+reverse(text[1:-1])+text[0]'),
    ],
    bad: [
      j('def reverse(text):', '    if text == "":', '        return ""', '    return text'),
      j('def reverse(text):', '    if text == "":', '        return ""', '    return text[0] + reverse(text[1:])'),
      j('def reverse(text):', '    result = ""', '    for ch in text:', '        result = ch + result', '    return result'),                 // right answers, but a loop
      j('def reverse(text):', '    return text[::-1]'),                                                                                  // right answers, but the shortcut
      j('def reverse(text):', '    return reverse(text[1:]) + text[0]'),                                                                 // no base case
      j('def reverse(text):', '    if text == "":', '        return ""', '    print(reverse(text[1:]) + text[0])'),
      j('def reverse(text):', '    if len(text) < 2:', '        return text', '    return text[-1] + text[1:-1] + text[0]'),             // swaps the ends only
      j('def reverse(text):', '    i = len(text) - 1', '    result = ""', '    while i >= 0:', '        result = result + text[i]', '        i = i - 1', '    return result'),
      // no recursion at all: the list method `.reverse()` must not count as "reverse calls itself" (found in review)
      j('def reverse(text):', '    letters = list(text)', '    letters.reverse()', '    return "".join(letters)'),
      j('def reverse(text):', '    if text == "":', '        return ""', '    return text[len(text)::-1]'),                                // another slice that reverses
      j('def reverse(text):', '    if text == "":', '        return ""', '    return reverse(text[1:])'),                                 // drops every character
    ],
  },
  'recursion/code-flatten': {
    call: (expr) => argsOf(expr, 'flatten')[0].flat(Infinity),
    good: [
      j('def flatten(items):', '    result = []', '    for item in items:', '        if isinstance(item, list):', '            for x in flatten(item):', '                result.append(x)', '        else:', '            result.append(item)', '    return result'),
      j('def flatten(items):', '    if items == []:', '        return []', '    first = items[0]', '    rest = flatten(items[1:])', '    if isinstance(first, list):', '        return flatten(first) + rest', '    return [first] + rest'),
      j('def flatten(items):', '    out = []', '    for item in items:', '        if type(item) == list:', '            out.extend(flatten(item))', '        else:', '            out = out + [item]', '    return out', '', 'print(flatten([1, [2, [3, 4]], 5]))'),
    ],
    bad: [
      j('def flatten(items):', '    result = []', '    for item in items:', '        result.append(item)', '    return result'),
      j('def flatten(items):', '    result = []', '    for item in items:', '        if isinstance(item, list):', '            for x in item:', '                result.append(x)', '        else:', '            result.append(item)', '    return result'),   // one level only
      j('def flatten(items):', '    result = []', '    for item in items:', '        if isinstance(item, list):', '            result.append(flatten(item))', '        else:', '            result.append(item)', '    return result'),
      j('def flatten(items):', '    result = []', '    for item in items:', '        if isinstance(item, list):', '            result + flatten(item)', '        else:', '            result.append(item)', '    return result'),
      j('def flatten(items):', '    result = []', '    for item in items:', '        if isinstance(item, list):', '            result = flatten(item) + result', '        else:', '            result = [item] + result', '    return result'),
      j('def flatten(items):', '    result = []', '    for item in items:', '        if isinstance(item, list):', '            result = result + flatten(item)', '        else:', '            result.append(item)', '    print(result)'),
    ],
  },
  'build-a-program/code-biggest': {
    out: () => 'All tests passed',
    call: (expr) => Math.max(...argsOf(expr, 'biggest')[0]),
    good: [
      j('def biggest(nums):', '    best = nums[0]', '    for n in nums[1:]:', '        if n > best:', '            best = n', '    return best', '', ASSERTS),
      j('def biggest(nums):', '    return max(nums)', '', ASSERTS),
      j('def biggest(nums):', '    best = None', '    for n in nums:', '        if best == None or n > best:', '            best = n', '    return best', '', ASSERTS),
    ],
    bad: [
      j('def biggest(nums):', '    best = 0', '    for n in nums:', '        if n > best:', '            best = n', '    return best', '', ASSERTS),
      j('def biggest(nums):', '    best = 0', '    for n in nums:', '        if n > best:', '            best = n', '    return best', '', 'assert biggest([3, 9, 4]) == 9', 'print("All tests passed")'),   // the failing test deleted
      j('def biggest(nums):', '    best = -5', '    for n in nums:', '        if n > best:', '            best = n', '    return best', '', ASSERTS),
      j('def biggest(nums):', '    best = -100', '    for n in nums:', '        if n > best:', '            best = n', '    return best', '', ASSERTS),
      j('def biggest(nums):', '    if nums == [-5, -2]:', '        return -2', '    best = 0', '    for n in nums:', '        if n > best:', '            best = n', '    return best', '', ASSERTS),
      j('def biggest(nums):', '    best = nums[0]', '    for n in nums:', '        if n < best:', '            best = n', '    return best', '', 'print("All tests passed")'),
      j('def biggest(nums):', '    return nums[-1]', '', 'print("All tests passed")'),
    ],
  },
  'build-a-program/code-shift': {
    call: (expr) => { const [ch, key] = argsOf(expr, 'shift'); return caesar(ch, key); },
    good: [
      j('def shift(ch, key):', '    if ch < "a" or ch > "z":', '        return ch', '    return chr((ord(ch) - ord("a") + key) % 26 + ord("a"))'),
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    pos = letters.find(ch)', '    if pos == -1:', '        return ch', '    pos = pos + key', '    while pos > 25:', '        pos = pos - 26', '    while pos < 0:', '        pos = pos + 26', '    return letters[pos]'),
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch in letters:', '        return (letters + letters)[letters.index(ch) + key % 26]', '    return ch', '', 'print(shift("a", 3))'),
    ],
    bad: [
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    return ch'),
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch not in letters:', '        return ch', '    return letters[letters.find(ch) + key]'),                // no wrap
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    return letters[(letters.find(ch) + key) % 26]'),                                                  // spaces become letters
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch not in letters:', '        return ch', '    return letters[(letters.find(ch) - key) % 26]'),        // the wrong way
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch not in letters:', '        return ch', '    return (letters.find(ch) + key) % 26'),                 // a number, not a letter
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch not in letters:', '        return ch', '    return letters[(letters.find(ch) + key) % 25]'),
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch not in letters:', '        return ch', '    pos = letters.find(ch) + key', '    if pos > 25:', '        pos = pos - 26', '    return letters[pos]'),   // one lap only
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch not in letters:', '        return ch', '    print(letters[(letters.find(ch) + key) % 26])'),
      // capitals are "not a lower-case letter" and must come back unchanged (found in review: three programs that move them)
      j('def shift(ch, key):', '    if not ch.isalpha():', '        return ch', '    return chr((ord(ch) - 97 + key) % 26 + 97)'),
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch.lower() not in letters:', '        return ch', '    return letters[(letters.find(ch.lower()) + key) % 26]'),
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch.lower() not in letters:', '        return ch', '    new = letters[(letters.find(ch.lower()) + key) % 26]', '    if ch.isupper():', '        return new.upper()', '    return new'),
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch == " ":', '        return ch', '    return letters[(letters.find(ch) + key) % 26]'),      // only the space is special
      j('def shift(ch, key):', '    letters = "abcdefghijklmnopqrstuvwxyz"', '    if ch not in letters:', '        return ch', '    pos = letters.find(ch) + key', '    if pos > 25:', '        pos = pos - 26', '    if pos < 0:', '        pos = pos + 26', '    return letters[pos]'),   // one lap in each direction
    ],
  },
  'build-a-program/code-encode': {
    call: (expr) => { const [text, key] = argsOf(expr, 'encode'); return caesar(text, key); },
    good: [
      j(SHIFT_FN, '', 'def encode(text, key):', '    out = []', '    for ch in text:', '        out.append(shift(ch, key))', '    return "".join(out)'),
      j(SHIFT_FN, '', 'def encode(text, key):', '    result = ""', '    i = 0', '    while i < len(text):', '        result += shift(text[i], key)', '        i += 1', '    return result'),
      j(SHIFT_FN, '', 'def encode(text, key):', '    if text == "":', '        return ""', '    return shift(text[0], key) + encode(text[1:], key)'),
    ],
    bad: [
      j(SHIFT_FN, '', 'def encode(text, key):', '    return text'),
      j(SHIFT_FN, '', 'def encode(text, key):', '    result = ""', '    for ch in text:', '        result = shift(ch, key)', '    return result'),
      j(SHIFT_FN, '', 'def encode(text, key):', '    result = ""', '    for ch in text:', '        result = shift(ch, key) + result', '    return result'),
      j(SHIFT_FN, '', 'def encode(text, key):', '    result = ""', '    for ch in text:', '        result = result + shift(ch, 3)', '    return result'),
      j(SHIFT_FN, '', 'def encode(text, key):', '    result = []', '    for ch in text:', '        result.append(shift(ch, key))', '    return result'),
      j(SHIFT_FN, '', 'def encode(text, key):', '    result = ""', '    for ch in text:', '        result = result + shift(ch, key)', '        return result'),
      j(SHIFT_FN, '', 'def encode(text, key):', '    return shift(text, key)'),
    ],
  },
  'build-a-program/code-decode': {
    call: (expr) => {
      const round = /^decode\(encode\((".*"), (\d+)\), (\d+)\)$/.exec(expr);
      if (round) return caesar(caesar(JSON.parse(round[1]), Number(round[2])), -Number(round[3]));
      const [text, key] = argsOf(expr, 'decode');
      return caesar(text, -key);
    },
    good: [
      j(SHIFT_FN, '', ENCODE_FN, '', 'def decode(text, key):', '    return encode(text, 26 - key)'),
      j(SHIFT_FN, '', ENCODE_FN, '', 'def decode(text, key):', '    result = ""', '    for ch in text:', '        result = result + shift(ch, -key)', '    return result'),
      j(SHIFT_FN, '', ENCODE_FN, '', 'def decode(text, key):', '    return encode(text, 0 - key)', '', 'print(decode("khoor", 3))'),
    ],
    bad: [
      j(SHIFT_FN, '', ENCODE_FN, '', 'def decode(text, key):', '    return text'),
      j(SHIFT_FN, '', ENCODE_FN, '', 'def decode(text, key):', '    return encode(text, key)'),
      j(SHIFT_FN, '', ENCODE_FN, '', 'def decode(text, key):', '    return encode(text, -7)'),
      j(SHIFT_FN, '', ENCODE_FN, '', 'def decode(text, key):', '    return encode(text, key - 26)'),
      j(SHIFT_FN, '', ENCODE_FN, '', 'def decode(text, key):', '    return "round trip!"'),
      j(SHIFT_FN, '', ENCODE_FN, '', 'def decode(text, key):', '    print(encode(text, -key))'),
      j(SHIFT_FN, '', ENCODE_FN, '', 'def decode(text, key):', '    return encode(text, -key + 1)'),
    ],
  },
};

const codeSteps = allSteps().filter(([, step]) => step.type === 'code');

test('every code step has a checked answer sheet in this file', () => {
  assert.deepEqual(codeSteps.map(([lesson, step]) => `${lesson}/${step.id}`).sort(), Object.keys(CODE).sort());
  assert.equal(codeSteps.length, 17);
  for (const lesson of LESSON_IDS) assert.ok(codeSteps.filter(([l]) => l === lesson).length >= 2, `${lesson} has at least two code steps`);
});

for (const [lesson, step] of codeSteps) {
  const key = `${lesson}/${step.id}`;
  test(`code step ${key}: solution and other correct programs pass, wrong ones fail, and Python agrees`, () => {
    const spec = CODE[key];
    const solved = gradeCode(step, step.solution);
    assert.equal(solved.status, 'pass', solved.message);
    assert.ok(step.starter, 'has a starter');
    assert.notEqual(gradeCode(step, step.starter).status, 'pass', 'the starter must not pass');
    assert.ok(spec.good.length >= 2 && spec.bad.length >= 3);
    spec.good.forEach((src) => { const g = gradeCode(step, src); assert.equal(g.status, 'pass', `a correct program is rejected (${g.message}):\n${src}`); });
    spec.bad.forEach((src) => { const g = gradeCode(step, src); assert.notEqual(g.status, 'pass', `a wrong program is accepted:\n${src}`); assert.ok(g.message, 'a rejected program gets a message'); });

    // every expected value in the step, re-derived from the task
    const checks = [...(step.expect != null ? [{ stdout: step.expect }] : []), ...(step.tests || []), ...(step.hidden || [])];
    assert.ok((step.hidden || []).length >= 1, 'has hidden checks, so the visible ones cannot simply be typed in');
    for (const t of checks) {
      if (t.call == null) assert.equal(normalizeOutput(t.stdout), spec.out(t.set || {}), `${key}: expected output for ${JSON.stringify(t.set || {})}`);
      else assert.deepEqual(t.expect, spec.call(t.call, t.set || {}), `${key}: ${t.call}`);
    }
    for (const [wrongOut] of step.wrong || []) assert.notEqual(normalizeOutput(wrongOut), spec.out({}), 'a "wrong" output is the right one');

    // the solution and the other correct programs, with each set of inputs typed in by hand, in both Pythons
    const jobs = [];
    for (const src of [step.solution, ...spec.good]) {
      for (const t of checks) {
        const typed = withInputs(src, t.set);
        if (t.call == null) jobs.push({ src: typed, want: spec.out(t.set || {}), plain: src, set: t.set });
        else jobs.push({ src: `${typed}\nprint("check:", (${t.call}) == ${pyLit(t.expect)})`, last: 'check: True' });
      }
    }
    const results = both(jobs.map((job) => job.src));
    jobs.forEach((job, i) => {
      assert.equal(results[i].error, null, job.src);
      if (job.last) assert.equal(results[i].out.split('\n').pop(), job.last, job.src);
      else {
        assert.equal(normalizeOutput(results[i].stdout), job.want, job.src);
        // the checker's own way of supplying inputs gives the same result as typing them in
        if (job.set) assert.equal(run(job.plain, { inputs: job.set }).stdout, results[i].stdout, job.src);
      }
    });
  });
}

test('code steps: the targeted feedback fires for the mistake it describes', () => {
  const message = (lesson, id, src) => gradeCode(raw(lesson, id), src).message;
  const bad = (key, i) => CODE[key].bad[i];
  assert.match(message('strings', 'code-palindrome', bad('strings/code-palindrome', 2)), /`is_palindrome\("Noon"\)` should give `True`/);         // capitals: the check names the case
  assert.match(message('strings', 'code-palindrome', bad('strings/code-palindrome', 1)), /`is_palindrome\("taco cat"\)` should give `True`/);     // spaces
  assert.match(message('strings', 'code-initials', bad('strings/code-initials', 2)), /\*printed\* `AL` but did not \*\*return\*\* it/);
  assert.match(message('loop-patterns', 'code-warmest', bad('loop-patterns/code-warmest', 3)), /a week of frost/);
  assert.match(message('nested-data', 'code-rows', raw('nested-data', 'code-rows').starter), /still in both rows/);
  assert.match(message('nested-data', 'code-rows', bad('nested-data/code-rows', 4)), /still one and the same list/);
  assert.match(message('nested-data', 'code-top', bad('nested-data/code-top', 3)), /Scores can be negative/);
  assert.match(message('nested-data', 'code-top', bad('nested-data/code-top', 6)), /That works for the examples shown here/);
  assert.match(message('nested-data', 'code-neighbours', bad('nested-data/code-neighbours', 4)), /not square/);
  assert.match(message('functions-in-depth', 'code-pure', bad('functions-in-depth/code-pure', 1)), /Check the parameters on the `def` line/);   // the global version still takes one argument
  assert.match(message('functions-in-depth', 'code-pure', bad('functions-in-depth/code-pure', 2)), /no `global`/);
  assert.match(message('functions-in-depth', 'code-pure', bad('functions-in-depth/code-pure', 3)), /the total never grows/);
  assert.match(message('functions-in-depth', 'code-pure', bad('functions-in-depth/code-pure', 5)), /the main program does not use it/);
  assert.match(message('functions-in-depth', 'code-refactor', bad('functions-in-depth/code-refactor', 7)), /adding loop is still in the main program/);
  assert.match(message('functions-in-depth', 'code-refactor', bad('functions-in-depth/code-refactor', 8)), /discount rule is still in the main program/);
  assert.match(message('functions-in-depth', 'code-refactor', bad('functions-in-depth/code-refactor', 0)), /does not define a function called `subtotal`/);
  assert.match(message('functions-in-depth', 'code-refactor', bad('functions-in-depth/code-refactor', 1)), /exactly 15 is not \*\*over\*\* 15/);
  assert.match(message('functions-in-depth', 'code-compose', bad('functions-in-depth/code-compose', 2)), /Discount first, tip last/);
  assert.match(message('recursion', 'code-reverse', bad('recursion/code-reverse', 2)), /asks for recursion: no loop/);
  assert.match(message('recursion', 'code-reverse', bad('recursion/code-reverse', 3)), /write the recursion yourself/);
  assert.match(message('recursion', 'code-reverse', bad('recursion/code-reverse', 7)), /asks for recursion: no loop/);
  assert.match(message('recursion', 'code-reverse', j('def reverse(text):', '    return "".join(reversed(text))')), /write the recursion yourself/);
  assert.match(message('build-a-program', 'code-biggest', raw('build-a-program', 'code-biggest').starter), /The claim on line 9 is false at the moment/);
  assert.match(message('build-a-program', 'code-biggest', bad('build-a-program/code-biggest', 1)), /Repair the function, not the tests/);
  assert.match(message('build-a-program', 'code-shift', bad('build-a-program/code-shift', 6)), /A key can be much larger than 26/);
  // the checks added in review name the case that goes wrong
  assert.match(message('strings', 'code-palindrome', bad('strings/code-palindrome', 7)), /`is_palindrome\("foot"\)`.*`f` and `t` do not/);
  assert.match(message('strings', 'code-palindrome', bad('strings/code-palindrome', 8)), /`is_palindrome\("foot"\)`/);
  assert.match(message('loop-patterns', 'code-warmest', bad('loop-patterns/code-warmest', 6)), /`warmest_day\(\[18, 11, 14\]\)` should give 0.*not with the day before it/);
  assert.match(message('recursion', 'code-reverse', bad('recursion/code-reverse', 8)), /`reverse` never calls itself/);
  assert.match(message('recursion', 'code-reverse', bad('recursion/code-reverse', 9)), /`reverse` never calls itself/);
  for (const i of [8, 9, 10]) assert.match(message('build-a-program', 'code-shift', bad('build-a-program/code-shift', i)), /A capital such as `"A"` is not a lower-case letter/);
  // each of those messages states a fact
  const [facts] = both(['print("foot"[0] == "foot"[3], "foot"[1] == "foot"[2], [18, 11, 14].index(max([18, 11, 14])), "A" in "abcdefghijklmnopqrstuvwxyz", "A".islower())']);
  assert.equal(facts.out, 'False True 0 False False');
  // the starter of the bug hunt stops exactly where the lesson says: line 8 passes, line 9 does not
  const [starter] = both([raw('build-a-program', 'code-biggest').starter]);
  assert.deepEqual(starter.error.slice(0, 2), ['AssertionError', 9]);
  assert.equal(starter.stdout, '');
});

test('code steps: each project step starts from the tested functions of the step before', () => {
  const shift = raw('build-a-program', 'code-shift');
  const encode = raw('build-a-program', 'code-encode');
  const decode = raw('build-a-program', 'code-decode');
  assert.ok(shift.solution.startsWith(SHIFT_FN));
  assert.ok(encode.starter.startsWith(`${SHIFT_FN}\n\ndef encode(text, key):`), 'step 2 starts with the solution of step 1');
  assert.ok(encode.solution.startsWith(`${SHIFT_FN}\n\n${ENCODE_FN}`));
  assert.ok(decode.starter.startsWith(`${SHIFT_FN}\n\n${ENCODE_FN}\n\ndef decode(text, key):`), 'step 3 starts with the solutions of steps 1 and 2');
  // the functions of the compose step are the ones the refactoring step asked for
  const compose = raw('functions-in-depth', 'code-compose');
  assert.ok(compose.starter.startsWith(HELPERS));
  const [same] = both([`${HELPERS}\nprint(subtotal([1, 2, 3]), discounted(20), discounted(15), discounted(16))`]);
  assert.equal(same.out, '6 18 15 14');
  // editors that have to fit a laptop screen together with their checklist
  for (const [lesson, step] of codeSteps) {
    const lines = step.starter.split('\n').length;
    const rows = (step.expect != null ? 2 : 0) + (step.tests || []).length + ((step.hidden || []).length ? 1 : 0);
    assert.ok(lines + rows <= 16, `${lesson}/${step.id}: ${lines} lines and ${rows} checklist rows`);
  }
});

/* ------------------------- added in review: the model solutions on random inputs */

// The tests above re-derive every expected value a step lists. This one goes
// beyond the listed cases: each model solution (the program a learner is shown
// when they give up) is run on a few hundred inputs made up here, in both
// Pythons, and compared with a reference written in JavaScript for this file.
test('code steps: every model solution agrees with an independent reference on random inputs', () => {
  const rng = makeRng(20261113);
  const many = (n, make) => Array.from({ length: n }, make);
  const word = (lo, hi, alphabet = 'abcdefghijklmnopqrstuvwxyzABCXYZ') => many(rng.int(lo, hi), () => rng.pick([...alphabet])).join('');
  const solutionOf = (key) => { const [lesson, id] = key.split('/'); return raw(lesson, id).solution; };
  // Run the solution once with a list of checks appended; every check must print True.
  const allTrue = (key, checks, chunk = 40) => {
    const cases = [];
    for (let i = 0; i < checks.length; i += chunk) {
      const part = checks.slice(i, i + chunk);
      cases.push([`${solutionOf(key)}\nprint("--")\n${part.map((c) => `print(${c})`).join('\n')}`, part.map(() => 'True').join('\n')]);
    }
    const results = both(cases.map((c) => c[0]));
    cases.forEach(([src, want], i) => {
      assert.equal(results[i].error, null, `${key}: ${results[i].error}\n${src}`);
      const out = results[i].out;                                    // what the solution itself prints, then "--", then the checks
      assert.equal(out.slice(out.indexOf('--\n') + 3), want, `${key}:\n${src}\n${out}`);
    });
    return checks.length;
  };
  const eq = (call, expected) => `(${call}) == ${pyLit(expected)}`;
  let total = 0;

  // strings
  total += allTrue('strings/code-initials', many(120, () => {
    const words = many(rng.int(1, 6), () => word(1, 7));
    return eq(`initials(${pyLit(words.join(' '))})`, words.map((w) => w[0].toUpperCase()).join(''));
  }));
  total += allTrue('strings/code-palindrome', many(300, () => {
    let text = '';
    do { text = many(rng.int(1, 8), () => rng.pick([...'abAB c'])).join(''); } while (text.split(' ').join('') === '');
    const clean = text.toLowerCase().split(' ').join('');
    return `is_palindrome(${pyLit(text)}) is ${clean === [...clean].reverse().join('') ? 'True' : 'False'}`;
  }));

  // loop patterns
  const collatz = (n) => { let c = 0; while (n !== 1) { n = n % 2 === 0 ? n / 2 : 3 * n + 1; c++; } return c; };
  total += allTrue('loop-patterns/code-collatz', many(60, (_, k) => eq(`collatz_steps(${k + 1})`, collatz(k + 1))), 10);
  total += allTrue('loop-patterns/code-first-long', many(200, () => {
    const words = many(rng.int(0, 6), () => word(1, 7));
    const n = rng.int(0, 7);
    return eq(`first_long(${pyLit(words)}, ${n})`, words.find((w) => w.length > n) ?? '');
  }));
  total += allTrue('loop-patterns/code-warmest', many(300, () => {
    const spread = rng.pick([3, 40]);
    const temps = many(rng.int(1, 7), () => rng.int(-spread, spread));
    return eq(`warmest_day(${pyLit(temps)})`, temps.indexOf(Math.max(...temps)));
  }));

  // nested data
  total += allTrue('nested-data/code-top', many(200, () => {
    const spread = rng.pick([2, 30]);
    const players = rng.sample(['Ana', 'Bo', 'Cy', 'Dee', 'Eli', 'Fay', 'Gus'], rng.int(1, 6)).map((name) => ({ name, score: rng.int(-spread, spread) }));
    const top = Math.max(...players.map((p) => p.score));
    return eq(`top_scorer(${pyLit(players)})`, players.find((p) => p.score === top).name);
  }));
  const gridChecks = [];
  for (let k = 0; k < 40; k++) {
    const rows = rng.int(1, 4);
    const cols = rng.int(1, 5);
    const grid = many(rows, () => many(cols, () => rng.int(0, 1)));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let count = 0;
      for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) if (!(rr === r && cc === c) && Math.abs(rr - r) <= 1 && Math.abs(cc - c) <= 1) count += grid[rr][cc];
      gridChecks.push(eq(`neighbours(${pyLit(grid)}, ${r}, ${c})`, count));
    }
  }
  total += allTrue('nested-data/code-neighbours', gridChecks, 20);

  // functions
  total += allTrue('functions-in-depth/code-compose', many(240, () => {
    const prices = many(rng.int(0, 5), () => rng.int(0, 12));
    const tip = rng.int(0, 6);
    const call = rng.pick([`to_pay(${pyLit(prices)})`, `to_pay(${pyLit(prices)}, ${tip})`, `to_pay(${pyLit(prices)}, tip=${tip})`]);
    return eq(call, afterDiscount(sum(prices)) + (call.includes(String(tip)) && !call.endsWith('])') ? tip : 0));
  }));

  // recursion
  total += allTrue('recursion/code-reverse', many(150, () => { const t = word(0, 9, 'abc d!'); return eq(`reverse(${pyLit(t)})`, [...t].reverse().join('')); }), 25);
  const nested = (depth) => many(rng.int(0, 4), () => (depth > 0 && rng.bool(0.4) ? nested(depth - 1) : rng.pick([rng.int(-9, 9), 'a', 'bc'])));
  total += allTrue('recursion/code-flatten', many(200, () => { const items = nested(4); return eq(`flatten(${pyLit(items)})`, items.flat(Infinity)); }));

  // build a program
  total += allTrue('build-a-program/code-biggest', many(200, () => { const nums = many(rng.int(1, 6), () => rng.int(-1000000, 1000000) * rng.pick([1, 1, 100000])); return eq(`biggest(${pyLit(nums)})`, Math.max(...nums)); }));
  const shiftChecks = [];
  for (const ch of 'abcdefghijklmnopqrstuvwxyz !7.,?-_AZMQ') for (const key of [-60, -29, -27, -26, -25, -3, -1, 0, 1, 3, 13, 25, 26, 27, 55, 60]) shiftChecks.push(eq(`shift(${pyLit(ch)}, ${key})`, caesar(ch, key)));
  total += allTrue('build-a-program/code-shift', shiftChecks);
  total += allTrue('build-a-program/code-encode', many(200, () => { const t = word(0, 9, 'abcxyz mno!AZ'); const key = rng.int(-30, 30); return eq(`encode(${pyLit(t)}, ${key})`, caesar(t, key)); }), 25);
  total += allTrue('build-a-program/code-decode', many(200, () => {
    const t = word(0, 9, 'abcxyz mno!AZ');
    const key = rng.int(-30, 30);
    return rng.bool() ? eq(`decode(${pyLit(t)}, ${key})`, caesar(t, -key)) : eq(`decode(encode(${pyLit(t)}, ${key}), ${key})`, t);
  }), 25);
  assert.ok(total > 2500, `${total} random checks`);

  // The three steps that are whole programs: other inputs typed in by hand, and through the checker's `set`.
  const programs = [];
  for (let rows = 1; rows <= 4; rows++) for (let cols = 1; cols <= 4; cols++) {
    const grid = many(rows, (_, r) => many(cols, (_, c) => (r === 0 && c === 0 ? 5 : 0)));
    const shared = j('shared = 0', 'for a in range(len(grid)):', '    for b in range(a + 1, len(grid)):', '        if grid[a] is grid[b]:', '            shared = shared + 1', 'print(shared)');
    programs.push(['nested-data/code-rows', { rows, cols }, shared, `${pyLit(grid)}\n0`]);   // the right grid, and no two rows are one list
  }
  for (let k = 0; k < 12; k++) {
    const prices = many(rng.int(0, 6), () => rng.int(0, 12));
    programs.push(['functions-in-depth/code-pure', { prices }, '', String(sum(prices))]);
    programs.push(['functions-in-depth/code-refactor', { prices }, '', `To pay: ${afterDiscount(sum(prices))}`]);
  }
  const typed = both(programs.map(([key, set, extra]) => `${withInputs(solutionOf(key), set)}${extra ? `\n${extra}` : ''}`));
  programs.forEach(([key, set, extra, want], i) => {
    assert.equal(typed[i].error, null, `${key} ${JSON.stringify(set)}`);
    assert.equal(typed[i].out, want, `${key} ${JSON.stringify(set)}`);
    if (!extra) assert.equal(normalizeOutput(run(solutionOf(key), { inputs: set }).stdout), want, `${key} with set ${JSON.stringify(set)}`);
  });
});

// "Anything that is not a lower-case letter comes back unchanged", wrap-around, negative and large keys,
// through all three layers of the finished machine, with the functions exactly as the last step shows them.
test('build-a-program: the finished cipher machine on capitals, other characters, and keys of every size', () => {
  const machine = codeOf(one('build-a-program', 'crack')).split('\nsecret = ')[0];
  const texts = ['hello', 'Hello, World!', 'xyz abc', 'ABC', 'a-b_c 123', '', 'zzz', 'the quick brown fox jumps over the lazy dog'];
  const keys = [0, 1, 3, 13, 25, 26, 27, 52, 55, 100, -1, -3, -26, -27, -100];
  const lines = [];
  const want = [];
  for (const t of texts) for (const key of keys) {
    lines.push(`print([encode(${pyLit(t)}, ${key}), decode(${pyLit(t)}, ${key}), decode(encode(${pyLit(t)}, ${key}), ${key}) == ${pyLit(t)}])`);
    want.push(`['${caesar(t, key)}', '${caesar(t, -key)}', True]`);
  }
  printsAll([[`${machine}\n${lines.join('\n')}`, want.join('\n')]]);
  assert.equal(caesar('Hello, World!', 3), 'Hhoor, Wruog!');       // capitals and punctuation stay where they are
  // of the 26 keys, exactly one turns the intercepted message into words
  const secret = /^secret = "(.*)"$/m.exec(codeOf(one('build-a-program', 'crack')))[1];
  const common = new Set(['you', 'can', 'the', 'and', 'now', 'well', 'done', 'read', 'secret', 'messages', 'a', 'i', 'to', 'of', 'in', 'is', 'it']);
  const readable = Array.from({ length: 26 }, (_, key) => key).filter((key) => caesar(secret, -key).replace(/[^a-z ]/g, '').split(' ').filter((w) => common.has(w)).length >= 2);
  assert.deepEqual(readable, [KEY]);
});

/* ---------------------------------------------------- teach before you ask */

// Every teaching screen of the course: [the screen, the first graded step that relies on it, words the screen must contain].
// `true` marks the screens that were added so that nothing is asked before it has been shown.
const TEACHING = {
  strings: [
    ['idea', 'slice-practice', ['`word[1:4]` is the slice from position 1', '`word[:2]` is `py`', '`word[2:]` is `thon`', '`word[-3:]` is `hon`', '`"th" in word`']],
    ['teach-immutable', 'immutable', ['**immutable**', 'TypeError', '**build a new string**'], true],
    ['methods', 'match-methods', ['**methods**', 'with a dot', '**new value**', '`strip` removes spaces', '**position** of the first match', '**list** of pieces', '`join` glues']],
    ['example-chain', 'method-trap', ['**hands its result back**', 'giving it a name', '**chain**', 'the empty string `""`', 'never changed'], true],
    ['teach-fstring', 'fstring', ['**f-string**', 'curly brackets', '**works out**', 'has no `f`'], true],
    ['example-words', 'code-initials', ['`split()` cuts a text at the spaces', 'one word per pass', '`return` hands back'], true],
  ],
  'loop-patterns': [
    ['idea', 'sort-patterns', ['**Accumulate**', '**Count**', '**Filter**', '**Search**', '**Find the best**']],
    ['teach-zip', 'zip-total', ['`zip`', '**two lists**', 'side by side', 'two names after `for`', '**same position**'], true],
    ['teach-nested', 'nested-count', ['the inner loop runs **in full**', 'the passes multiply', '3 × 2 = 6 lines'], true],
    ['example-while', 'code-collatz', ['`while`', '**until something happens**', '`//` divides and drops the remainder', '**remainder**', '`n % 2 == 0` asks: is `n` even?'], true],
    ['example-filter', 'parsons', ['**filter**', '**new list**', 'empty list', '`append`'], true],
    ['example-search', 'code-first-long', ['A `return` in the loop ends the loop **and** the function', 'lines up with `for`'], true],
  ],
  'nested-data': [
    ['teach-grid', 'tap-cell', ['**grid**', '**row**', 'one pair at a time', 'The row first, then the place in that row'], true],
    ['idea', 'grid-practice', ['`len(grid)` is the number of rows', '`len(grid[0])` is the number of columns', '`grid[r][c]`', 'on its own is a whole row']],
    ['example-rows', 'grid-practice', ['**one whole row** per pass', '`sum` adds up its items', '**column**', '**every cell**'], true],
    ['teach-shared-rows', 'alias-trap', ['`[0] * 3` is `[0, 0, 0]`', '`[row] * 2` holds the **same** list twice', 'a **new** `[0, 0]` on every pass'], true],
    ['teach-records', 'records-total', ['**record**', '**table**', 'one whole record', 'one of its fields'], true],
  ],
  'functions-in-depth': [
    ['idea', 'sort-pure', ['**One job.**', 'comes in as a parameter', 'goes out through `return`', '**pure**']],
    ['teach-defaults', 'defaults', ['**default value**', 'leave that argument out', 'beats the default', '**by name**', '**keyword argument**', 'repeats a string'], true],
    ['teach-local', 'local-trap', ['**read**', '**change**', '**local** in the whole function', 'out of reach', 'goes **in** as a parameter', 'comes **out** through `return`'], true],
    ['example-refactor', 'code-refactor', ['**refactor**', 'without changing what it prints', 'a function with one job'], true],
  ],
  recursion: [
    ['idea', 'no-base', ['**base case**', '**recursive case**', '**smaller** input']],
    ['example-trace', 'rec-practice', ['right inside the `return` line', '`text[1:]` is the text without its first character', '**down** to the base case', 'from the bottom **up**'], true],
    ['teach-nested-lists', 'nested', ['`isinstance(item, list)` asks: is this item itself a list?', '**any** depth', 'hands it to **itself**'], true],
  ],
  'build-a-program': [
    ['teach-assert', 'code-biggest', ['`assert`', '*this must be true here*', 'nothing happens', '**AssertionError**', 'names the line'], true],
    ['idea', 'catch-bug', ['**test**', '**Typical**', '**Empty**', '**One item**', '**Ties**', '**Extremes**', 'right on a boundary']],
    ['teach-wrap', 'wrap', ['**position**', '`letters.find(ch)`', '**wrap round**', 'remainder after dividing by 26'], true],
  ],
};

// Explorations and predictions that show something a later step relies on, and steps whose rule is stated on the
// teaching screen that follows them: [lesson, the earlier step, the later step, what the earlier step's text must say]
const SHOWN_FIRST = [
  ['strings', 'watch-reverse', 'parsons', /one character at a time/],
  ['strings', 'watch-reverse', 'code-palindrome', /turn a word around/],
  ['loop-patterns', 'be-computer', 'first-match', /after the `break`/],
  ['loop-patterns', 'enumerate', 'teach-zip', /`enumerate` hands out both/],
  ['loop-patterns', 'enumerate', 'code-warmest', /`enumerate` hands out both/],
  ['loop-patterns', 'pairs', 'teach-nested', /2 sizes and 3 colours make 6 lines/],
  ['nested-data', 'hook', 'teach-grid', /A list can hold anything, even other lists/],
  ['nested-data', 'records', 'teach-records', /a \*\*list of dictionaries\*\*/],
  ['nested-data', 'watch-group', 'parsons', /`not in` is the opposite of `in`/],
  ['nested-data', 'tap-neighbours', 'code-neighbours', /the cells that touch it, corners included/],
  ['functions-in-depth', 'be-computer', 'code-compose', /\*\*calls the other\*\*/],
  ['functions-in-depth', 'watch-tuple', 'two-values', /`\/\/` divides and drops the remainder, and `%` gives the remainder/],
  ['functions-in-depth', 'watch-tuple', 'parsons', /what line 4 hands back, and what line 6 does with it/],
  ['recursion', 'watch-countdown', 'down-up', /the call that is running \*\*right now\*\*/],
  ['recursion', 'watch-fact', 'example-trace', /watch what each call returns/],
  ['build-a-program', 'wheel', 'teach-wrap', /moving every letter the same number of places along the alphabet/],
];

test('teach before you ask: the shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  assert.deepEqual(Object.keys(TEACHING), LESSON_IDS);
  const shapes = {};
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((step) => resolveStep(step, makeRng(1), step.id));   // `graded` exists only on resolved steps
    const roles = steps.map(role);
    shapes[id] = roles.map((kind) => ({ teach: 'T', predict: 'p', reflect: 'r', graded: 'G', explore: 'e' })[kind]).join('');
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    assert.ok(roles.filter((kind) => kind === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.notEqual(roles[roles.length - 1], 'teach', `${id}: every teaching screen is followed by something to answer`);
    // the list above names every teaching screen of the lesson, in order
    assert.deepEqual(TEACHING[id].map((t) => t[0]), steps.filter((s) => s.type === 'info').map((s) => s.id), `${id}: teaching screens`);
    for (const [teach, ask, terms] of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === teach);
      const asked = steps.findIndex((s) => s.id === ask);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${teach}" exists`);
      assert.ok(asked > at && steps[asked].graded, `${id}: "${teach}" comes before the graded step "${ask}"`);
      // each idea is checked before the next: a question follows within two steps
      assert.ok(roles.slice(at + 1, at + 3).includes('graded'), `${id}/${teach} is followed by a question`);
      for (const term of terms) assert.ok(steps[at].text.includes(term), `${id}/${teach} should say: ${term}`);
    }
  }
  assert.deepEqual(shapes, {
    strings: 'peTGTGeTGTGTGGGTGG',
    'loop-patterns': 'peTGGpTGGTGTGTGTGGG',
    'nested-data': 'pTGTTGTGGpTGGeGGGG',
    'functions-in-depth': 'peTGTGGeGTGGGTGGr',
    recursion: 'peTGeTGGGGTGGGG',
    'build-a-program': 'pTGTGGGTGGGGGGr',
  });
  // the screens added in the "teach before you ask" revision
  const added = Object.fromEntries(Object.entries(TEACHING).map(([id, list]) => [id, list.filter((t) => t[3]).map((t) => t[0])]));
  assert.deepEqual(added, {
    strings: ['teach-immutable', 'example-chain', 'teach-fstring', 'example-words'],
    'loop-patterns': ['teach-zip', 'teach-nested', 'example-while', 'example-filter', 'example-search'],
    'nested-data': ['teach-grid', 'example-rows', 'teach-shared-rows', 'teach-records'],
    'functions-in-depth': ['teach-defaults', 'teach-local', 'example-refactor'],
    recursion: ['example-trace', 'teach-nested-lists'],
    'build-a-program': ['teach-assert', 'teach-wrap'],
  });
  for (const [lesson, earlier, later, says] of SHOWN_FIRST) {
    const ids = lessons[lesson].steps.map((s) => s.id);
    assert.ok(ids.indexOf(earlier) >= 0 && ids.indexOf(earlier) < ids.indexOf(later), `${lesson}: "${earlier}" comes before "${later}"`);
    assert.match(one(lesson, earlier).text, says, `${lesson}/${earlier}`);
  }
  // the steps that were moved keep their order: the table of methods before the first question about a method,
  // f-strings before the fill step that ends with one, and the meaning of assert before the first program that uses it
  const order = (lesson, ...ids) => { const all = lessons[lesson].steps.map((s) => s.id); const at = ids.map((id) => all.indexOf(id)); assert.ok(at.every((p, i) => p >= 0 && (i === 0 || p > at[i - 1])), `${lesson}: ${ids.join(' < ')}`); };
  order('strings', 'methods', 'match-methods', 'example-chain', 'method-trap', 'teach-fstring', 'fstring', 'tidy', 'parsons', 'example-words', 'code-initials', 'code-palindrome');
  order('nested-data', 'teach-grid', 'tap-cell', 'idea', 'example-rows', 'grid-practice', 'teach-shared-rows', 'alias-trap', 'code-rows');
  order('build-a-program', 'teach-assert', 'code-biggest', 'idea', 'catch-bug', 'match-cases', 'wheel', 'teach-wrap', 'wrap', 'code-shift');
});

test('teach before you ask: every added screen shows a real program or a labelled picture, with an alt text', () => {
  for (const [lesson, list] of Object.entries(TEACHING)) {
    for (const [id, , , isNew] of list) {
      if (!isNew) continue;
      const step = one(lesson, id);
      const [figure] = step.figures;
      assert.ok(figure && figure.alt, `${lesson}/${id}: a figure with an alt text`);
      if (id === 'teach-grid') { assert.equal(figure.type, 'svg'); continue; }
      assert.ok(figure.type === 'py-run' && figure.autorun, `${lesson}/${id} shows a program together with what it prints`);
      assert.ok(figure.code.split('\n').length <= 12, `${lesson}/${id}: short enough to read at a glance`);
      const words = step.text.replace(/```[\s\S]*?```/g, '').replace(/^\|.*$/gm, '').split(/\s+/).filter(Boolean).length;
      assert.ok(words >= 35 && words <= 110, `${lesson}/${id}: ${words} words`);
    }
  }
  // nested-data/teach-grid draws the grid of the opening program and marks the cell its text reads out
  const grid = one('nested-data', 'teach-grid');
  assert.match(codeOf(one('nested-data', 'hook')), /\[5, 1, 8\],\n {4}\[7, 3, 9\],/);
  assert.equal(grid.figures[0].caption, 'grid[0][2] is 8');
  assert.ok(grid.text.includes('the whole row `[5, 1, 8]`') && grid.text.includes('`grid[0][2]` then takes the item at index 2 **of that row**: 8.'));
  assert.equal((grid.figures[0].content.match(/fill-yellow-soft/g) || []).length, 1);
});

test('teach before you ask: facts the teaching screens and the changed prompts state', () => {
  const lump = /```python\n([\s\S]*?)\n```/.exec(one('functions-in-depth', 'example-refactor').text)[1];
  const programs = {
    // strings
    negativeSlice: 'word = "python"\nprint(word[-3:], len(word[-3:]))',
    frozen: 'word = "mouse"\nword[0] = "h"',
    rebuilt: 'word = "mouse"\nprint(word[1:])',
    splitWords: 'print("Red Kite Park".split())',
    // loop patterns
    remainders: 'print(5 // 2, 5 % 2, 20 % 2, 20 % 2 == 0, 5 % 2 == 0)',
    halvings: 'n = 20\nseen = [n]\nwhile n > 1:\n    n = n // 2\n    seen.append(n)\nprint(seen, len(seen) - 1)',
    // nested data
    repeats: 'print([0] * 3)\nrow = [0, 0]\nshared = [row] * 2\nprint(shared[0] is shared[1])\nseparate = []\nfor r in range(2):\n    separate.append([0, 0])\nprint(separate[0] is separate[1])',
    board: `${codeOf(one('nested-data', 'tap-cell'))}\nprint(len(grid), len(grid[0]), grid[2])`,
    // functions
    repeatString: 'print("!" * 3)',
    lump,
    outOfReach: 'score = 10\ndef reset():\n    score = 0\nreset()\nprint(score)',
    smallLarge: 'print(min([14, 3, 9]), max([14, 3, 9]))',
    // recursion
    chain: `${codeOf(one('recursion', 'example-trace')).split('\n\n')[0]}\nprint(length("cat"), length("at"), length("t"), length(""), "cat"[1:])`,
    listSlice: 'nums = [4, 5, 6]\nprint(nums[1:], nums)',
    isList: 'print(isinstance([2, 3], list), isinstance(7, list))',
    // build a program
    wrapRound: 'letters = "abcdefghijklmnopqrstuvwxyz"\nprint(letters.find("a"), letters.find("z"), letters.find("q"), 28 % 26, 19 % 26, letters[2])',
  };
  const keys = Object.keys(programs);
  const r = Object.fromEntries(both(keys.map((k) => programs[k])).map((res, i) => [keys[i], res]));

  assert.equal(r.negativeSlice.out, 'hon 3');                       // "`word[-3:]` is `hon`, the last three characters"
  assert.deepEqual(r.frozen.error.slice(0, 2), ['TypeError', 2]);   // "A line such as word[0] = "h" stops the program with a TypeError"
  assert.equal(r.rebuilt.out, 'ouse');                              // "the slice word[1:], which is ouse"
  assert.equal(r.splitWords.out, "['Red', 'Kite', 'Park']");
  assert.ok(one('strings', 'example-words').text.includes("`\"Red Kite Park\".split()` is `['Red', 'Kite', 'Park']`"));

  assert.equal(r.remainders.out, '2 1 0 True False');               // "5 // 2 is 2 … 5 % 2 is 1, and 20 % 2 is 0"
  const whileText = one('loop-patterns', 'example-while').text;
  assert.ok(whileText.includes('`5 // 2` is 2') && whileText.includes('`5 % 2` is 1, and `20 % 2` is 0'));
  assert.equal(r.halvings.out, '[20, 10, 5, 2, 1] 4');              // "20, 10, 5, 2, 1. That takes four passes"
  assert.ok(whileText.includes('halves `n` until it is 1: 20, 10, 5, 2, 1. That takes four passes'));

  assert.equal(r.repeats.out, '[0, 0, 0]\nTrue\nFalse');            // the same row twice; a loop builds rows of their own
  assert.equal(r.board.out, '3 4 [6, 0, 7, 4]');
  const rowsText = one('nested-data', 'idea').text;
  assert.ok(rowsText.includes('number of rows: here 3') && rowsText.includes('number of columns: here 4') && rowsText.includes('`grid[2]` on its own is a whole row: the ordinary list `[6, 0, 7, 4]`'));

  assert.equal(r.repeatString.out, '!!!');                          // "`"!" * 3` is `"!!!"`"
  assert.ok(one('functions-in-depth', 'teach-defaults').text.includes('`"!" * 3` is `"!!!"`'));
  assert.equal(r.lump.out, 'Warm days: 2');                         // the lump and the refactored program print the same
  assert.equal(r.outOfReach.out, '10');
  assert.equal(r.smallLarge.out, '3 14');
  for (const s of variants('functions-in-depth', 'two-values', 20)) assert.match(s.text, /`min` gives the smallest number of a list and `max` the largest/);

  assert.equal(r.chain.out, '3 2 1 0 at');                          // the table of calls, row by row
  const traceText = one('recursion', 'example-trace').text;
  for (const row of ['| `length("cat")` | 1 + `length("at")` = 3 |', '| `length("at")` | 1 + `length("t")` = 2 |', '| `length("t")` | 1 + `length("")` = 1 |', '| `length("")` | 0: the base case |']) assert.ok(traceText.includes(row), row);
  assert.equal(r.listSlice.out, '[5, 6] [4, 5, 6]');                // "nums[1:] is the list without its first item"
  assert.match(one('recursion', 'parsons').text, /`nums\[1:\]` is the list without its first item/);
  assert.equal(r.isList.out, 'True False');

  assert.equal(r.wrapRound.out, '0 25 16 2 19 c');                  // "a is at 0 and z at 25 … 28 % 26 … 2, the position of c … 19 % 26 is 19"
  const wrapText = one('build-a-program', 'teach-wrap').text;
  assert.ok(wrapText.includes('`a` is at 0 and `z` at 25') && wrapText.includes('`19 % 26` is 19'));
  assert.match(one('nested-data', 'code-neighbours').text, /rows run from 0 to `len\(grid\) - 1`, columns from 0 to `len\(grid\[0\]\) - 1`/);
});

test('teach before you ask: a worked example is never the question that follows, and the whole pool has been shown', () => {
  const example = (lesson, id) => codeOf(one(lesson, id));
  const never = (lesson, ask, teach) => {
    const shown = example(lesson, teach);
    for (const s of variants(lesson, ask)) assert.notEqual(codeOf(s), shown, `${lesson}/${ask} repeats the worked example of ${teach}`);
  };
  never('loop-patterns', 'zip-total', 'teach-zip');
  never('loop-patterns', 'nested-count', 'teach-nested');
  never('nested-data', 'grid-practice', 'example-rows');
  never('nested-data', 'records-total', 'teach-records');
  never('functions-in-depth', 'defaults', 'teach-defaults');
  never('recursion', 'rec-practice', 'example-trace');
  never('build-a-program', 'wrap', 'teach-wrap');

  // loop-patterns/nested-count never asks for 3 passes of 2, the numbers of the example
  assert.match(example('loop-patterns', 'teach-nested'), /range\(3\):\n {4}for seat in range\(2\):/);
  for (const s of variants('loop-patterns', 'nested-count')) assert.ok(!/range\(3\):\n {4}for b in range\(2\):/.test(codeOf(s)));
  // build-a-program/wrap never asks about the letter or the key of the example
  for (const s of variants('build-a-program', 'wrap')) assert.ok(!/find\("q"\)|\+ 12\)/.test(codeOf(s)), codeOf(s));
  // recursion/rec-practice: the example is a fifth function, on a string
  for (const s of variants('recursion', 'rec-practice')) assert.ok(!/def length/.test(codeOf(s)));
  // the fixed questions straight after an example use another program as well
  for (const [lesson, teach, ask] of [['strings', 'teach-immutable', 'immutable'], ['strings', 'example-chain', 'method-trap'], ['strings', 'teach-fstring', 'fstring'], ['nested-data', 'teach-shared-rows', 'alias-trap']]) {
    assert.notEqual(example(lesson, teach), example(lesson, ask), `${lesson}/${ask}`);
  }
  for (const [lesson, teach, ask] of [['strings', 'example-words', 'code-initials'], ['loop-patterns', 'example-while', 'code-collatz'], ['loop-patterns', 'example-search', 'code-first-long'], ['nested-data', 'teach-shared-rows', 'code-rows'], ['functions-in-depth', 'teach-local', 'code-pure'], ['functions-in-depth', 'example-refactor', 'code-refactor']]) {
    const step = raw(lesson, ask);
    assert.notEqual(gradeCode(step, example(lesson, teach)).status, 'pass', `${lesson}/${ask}: the worked example must not be the answer`);
  }
  const lines = (code) => code.split('\n').map((l) => l.trim());
  assert.ok(!lines(example('loop-patterns', 'example-filter')).some((l) => one('loop-patterns', 'parsons').items.map((i) => i.trim()).includes(l) && l !== 'kept = []' && l !== 'print(kept)'), 'the filter example and the Parsons problem test different numbers');

  // strings/slice-practice: each of the four kinds of slice the generator makes is on the screen before it
  const sliceIdea = one('strings', 'idea').text;
  const kindShown = { mid: '`word[1:4]`', head: '`word[:2]`', tail: '`word[2:]`', neg: '`word[-3:]`' };
  const kinds = new Set();
  for (const s of variants('strings', 'slice-practice')) {
    const [, a, b] = /word\[(-?\d*):(-?\d*)\]/.exec(codeOf(s));
    kinds.add(a === '' ? 'head' : b === '' ? (Number(a) < 0 ? 'neg' : 'tail') : 'mid');
  }
  for (const kind of kinds) assert.ok(sliceIdea.includes(kindShown[kind]), `strings/idea shows a slice of the kind "${kind}"`);
  assert.equal(kinds.size, 4);

  // strings/match-methods and strings/tidy: every method they ask about is in the table of the methods screen
  const table = one('strings', 'methods').text;
  const methodsOf = (text) => [...text.matchAll(/\.(\w+)\(/g)].map((m) => m[1]);
  const taught = new Set(methodsOf(table));
  for (const [call] of one('strings', 'match-methods').pairs) for (const m of methodsOf(call)) assert.ok(taught.has(m), `match-methods asks about .${m}()`);
  for (const blank of one('strings', 'tidy').blanks) for (const option of blank.options) assert.ok(taught.has(option), `tidy offers .${option}()`);

  // loop-patterns: the patterns of the bucket and the match step are the rows of the table
  const patterns = one('loop-patterns', 'idea').text;
  for (const name of [...one('loop-patterns', 'sort-patterns').buckets, ...one('loop-patterns', 'match-patterns').pairs.map((p) => p[1])]) assert.ok(patterns.includes(`**${name}**`), `loop-patterns/idea names "${name}"`);

  // nested-data/grid-practice: its three kinds of question each have their line in the example before it
  const walk = example('nested-data', 'example-rows');
  assert.ok(/print\(sum\(grid\[1\]\)\)/.test(walk) && /for row in grid:\n {4}print\(row\[0\]\)/.test(walk) && /for row in grid:\n {4}for cell in row:/.test(walk));
  // nested-data/records-total: a loop over records with an `if` on one field
  assert.match(example('nested-data', 'teach-records'), /for trip in trips:\n {4}if trip\["days"\] > 2:/);

  // recursion/rec-practice: the pool is four functions; the rule they share is on the example screen, and `//` is in the prompt that needs it
  const recKinds = new Set(variants('recursion', 'rec-practice').map((s) => /^def (\w+)/.exec(codeOf(s))[1]));
  assert.deepEqual([...recKinds].sort(), ['digits', 'fact', 'power', 'total']);
  for (const s of variants('recursion', 'rec-practice')) if (/def digits/.test(codeOf(s))) assert.match(s.text, /`\/\/` divides and drops the remainder/);

  // build-a-program/catch-bug: the case that catches each bug is a row of the table on the screen before it
  const cases = one('build-a-program', 'idea').text;
  const caughtBy = { longest: '**Ties**', passed: 'a value right on a boundary', smallest: 'very large numbers' };
  for (const s of variants('build-a-program', 'catch-bug')) {
    const name = /^def (\w+)\(/.exec(codeOf(s))[1];
    if (caughtBy[name]) assert.ok(cases.includes(caughtBy[name]), `build-a-program/idea lists the kind of case that catches ${name}`);
    // in_order is the one function that walks a list by position: its prompt says how to read that
    else { assert.equal(name, 'in_order'); assert.match(s.text, /`i` is a position in the list, so `nums\[i\]` and `nums\[i \+ 1\]` are two numbers that stand next to each other/); }
  }
});
