// Independent checks of the "Thinking in Code" (python) course.
//
// Every program a lesson shows is run three ways and the three must agree:
//   1. what the lesson says it prints (its answer key or its wording),
//   2. the mini interpreter the site ships (src/lang/minipy.js),
//   3. real CPython, when python3 (3.12 or newer) is installed. Without it the
//      comparison with CPython is skipped and the rest still runs.
// The expected outputs in this file were worked out by hand or with a formula
// of their own; they are never copied from what the interpreter printed.
//
//   node --test tests/python-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { run } from '../src/lang/minipy.js';
import { gradeCode, normalizeOutput } from '../src/lang/check-code-step.js';
import course from '../content/courses/python/course.js';

const SEEDS = 200;

/* ------------------------------------------------------------------ setup */

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/python/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, 'python', meta.id);
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
const fenced = (text) => /```python\n([\s\S]*?)\n```/.exec(text)[1];

/* ----------------------------------------------- the two Pythons, side by side */

const probe = spawnSync('python3', ['-c', 'import sys; print(sys.version_info[:2] >= (3, 12))'], { encoding: 'utf8' });
const HAVE_PYTHON = probe.status === 0 && probe.stdout.trim() === 'True';

// Runs each program in CPython with a budget of executed lines (so a runaway
// loop comes back as a timeout) and records, for the first lines that run,
// the line number and the variables of the running scope.
const HARNESS = `
import sys, json, io, contextlib
LIMIT = 20000
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
            if len(res['events']) < 60:
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
    res['stdout'] = buf.getvalue()[:4000]
    return res
json.dump([run_one(s) for s in json.load(sys.stdin)], sys.stdout)`;

function cpython(sources) {
  const py = spawnSync('python3', ['-I', '-c', HARNESS], { input: JSON.stringify(sources), encoding: 'utf8', maxBuffer: 1 << 28 });
  assert.equal(py.status, 0, py.stderr);
  return JSON.parse(py.stdout);
}

/** One program in the mini interpreter: { stdout, out, error: [type, line, message] | null, trace }. */
function mini(src) {
  const r = run(src, { maxSteps: 300000, trace: true, maxTrace: 400 });
  return { stdout: r.stdout, out: r.stdout.replace(/\n$/, ''), error: r.error ? [r.error.type, r.error.line, r.error.message] : null, trace: r.trace || [] };
}

/**
 * Run programs in the mini interpreter and, when it is installed, in CPython,
 * and insist that both print the same and stop with the same kind of error on
 * the same line. Returns the mini interpreter's results.
 *
 * syntaxLines: false compares only the kind of a syntax error, not its line.
 * A program with two indentation mistakes is reported differently: CPython
 * names the first ("expected an indented block", found while parsing), the
 * mini interpreter a later "unindent does not match" (found while splitting
 * the whole text into tokens). Only scrambled Parsons orders are affected.
 */
function both(sources, { syntaxLines = true } = {}) {
  const unique = [...new Set(sources)];
  const mine = new Map(unique.map((src) => [src, mini(src)]));
  if (HAVE_PYTHON) {
    const real = cpython(unique);
    unique.forEach((src, i) => {
      const m = mine.get(src);
      const r = real[i];
      const timedOut = (m.error && m.error[0] === 'TimeoutError') || (r.error && r.error[0] === 'TimeoutError');
      if (timedOut) {
        assert.equal(m.error && m.error[0], 'TimeoutError', `only real Python runs for ever:\n${src}`);
        assert.equal(r.error && r.error[0], 'TimeoutError', `only the mini interpreter runs for ever:\n${src}`);
        assert.deepEqual(m.stdout.split('\n').slice(0, 20), r.stdout.split('\n').slice(0, 20), src);
        return;
      }
      assert.equal(m.stdout, r.stdout, `the mini interpreter and CPython print different things for:\n${src}`);
      const cut = !syntaxLines && m.error && r.error && /^(Syntax|Indentation)Error$/.test(r.error[0]) ? 1 : 2;
      assert.deepEqual(m.error && m.error.slice(0, cut), r.error && r.error.slice(0, cut), `different error (type, line) for:\n${src}\nCPython: ${r.error}\nmini: ${m.error}`);
      m.real = r;
    });
  }
  return sources.map((src) => mine.get(src));
}

test('real Python is available for the three-way comparison', (t) => {
  if (!HAVE_PYTHON) { t.skip('python3 >= 3.12 not found: the lessons were only checked against the mini interpreter'); return; }
  const [r] = both(['print(7 // 2, -7 // 2, 7 / 2, "2" + "3")']);
  assert.equal(r.out, '3 -4 3.5 23');
});

/* ------------------------------------------------------- shape of the course */

test('the course has seven lessons in two chapters', () => {
  assert.deepEqual(course.chapters.map((c) => c.lessons.map((l) => l.id)), [['variables', 'decisions', 'loops'], ['functions', 'lists', 'dictionaries', 'debugging']]);
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.ok(lesson.steps.length >= 8 && lesson.recap.length >= 3, id);
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
        for (const [value] of s.wrong) assert.notEqual(value, s.answer, `${where}: a "wrong" value equals the answer`);
      }
    }
  }
});

/* ------------------------------------------- "what does this print?" (static) */

// [lesson, step, what I worked out by hand, where the lesson commits to an answer]
const PRINTS = [
  ['variables', 'hook', '6', (s) => bare(correctTexts(s)[0])],
  ['variables', 'watch', '6', (s) => /`y` stayed (\d+)/.exec(s.explain)[1]],
  ['variables', 'strings', '5\n23', (s) => `${/first line prints `(\d+)`/.exec(s.text)[1]}\n${bare(correctTexts(s)[0])}`],
  ['decisions', 'hook', 'Go outside', (s) => /^Only `(.*)`$/.exec(correctTexts(s)[0])[1]],
  ['decisions', 'be-computer', 'Child ticket\nEnjoy the film', null],
  ['loops', 'hook', 'Hello\nHello\nHello\nHello\nHello', (s) => Array(s.answer).fill('Hello').join('\n')],
  ['loops', 'be-computer', '2\n1\nLift off!', null],
  ['loops', 'for-range', '0\n1\n2\n3\n4', (s) => /hands out ([\d, ]+)\./.exec(s.explain)[1].split(', ').join('\n')],
  ['loops', 'watch-total', '15', (s) => /`total` went ([\d, ]+)\./.exec(s.explain)[1].split(', ').pop()],
  // the worked examples on the teaching screens ("teach before you ask"): what each prints, worked out by hand
  ['variables', 'example-update', '30', (s) => /`print` shows `(\d+)`/.exec(s.text)[1]],
  ['variables', 'teach-strings', '8\n4 + 4\nsunset', null],
  ['variables', 'example-program', '6 90', (s) => `6 ${/6 × 15 is (\d+)/.exec(s.text)[1]}`],
  ['decisions', 'teach-if-else', 'Slow down\nDrive on', (s) => /prints `(Slow down)`, skips the `else` branch and prints `(Drive on)`/.exec(s.text).slice(1).join('\n')],
  ['decisions', 'teach-elif', 'Good morning', (s) => /prints `(Good \w+)`/.exec(s.text)[1]],
  ['decisions', 'teach-and-or', 'Discount', (s) => /program prints `(\w+)`/.exec(s.text)[1]],
  ['loops', 'idea', '2\n1\nLift off!', null],
  ['loops', 'teach-for-range', '50\n60\n70', (s) => `50\n60\n${/last line printed is `(\d+)`/.exec(s.text)[1]}`],
  ['loops', 'teach-accumulator', '20', (s) => /shows `(\d+)`/.exec(s.text)[1]],
  ['loops', 'example-count', '3', (s) => /prints `(\d+)`/.exec(s.text)[1]],
  ['functions', 'example-two-params', '6\n17', (s) => `${/and returns (\d+)\./.exec(s.text)[1]}\n${/prints `(\d+)`/.exec(s.text)[1]}`],
  ['functions', 'teach-print-vs-return', '8\nNone', (s) => `${/prints `(\d+)`, but/.exec(s.text)[1]}\n${/line 5 prints `(\w+)`/.exec(s.text)[1]}`],
  ['functions', 'teach-locals', '40 35', (s) => /program prints `(\d+ \d+)`/.exec(s.text)[1]],
  ['functions', 'example-early-return', 'Too small\nWelcome aboard', null],
  ['lists', 'example-change-list', "['cat', 'owl', 'fish']\n3", (s) => `['cat', 'owl', 'fish']\n${/line 5 prints `(\d+)`/.exec(s.text)[1]}`],
  ['lists', 'teach-for-list', 'red paint\ngreen paint\nblue paint\nDone', null],
  ['lists', 'example-list-function', '2', null],
  ['lists', 'teach-alias', "['Zed', 'Bo']", (s) => /shows the change too: `(.+?)`/.exec(s.text)[1]],
  ['dictionaries', 'example-change-dict', "{'apples': 4, 'plums': 8}\n2", (s) => `{'apples': 4, 'plums': 8}\n${/line 5 prints `(\d+)`/.exec(s.text)[1]}`],
  ['dictionaries', 'teach-for-dict', 'Ana 31\nBo 25', (s) => [...s.text.matchAll(/`ages\[name\]` is (\d+)/g)].map((m, i) => `${['Ana', 'Bo'][i]} ${m[1]}`).join('\n')],
  ['functions', 'hook', 'Start\nHello!\nHello!', (s) => correctTexts(s)[0].split(', ').join('\n')],
  ['functions', 'be-computer', '8', (s) => /hands (\d+) back/.exec(s.explain)[1]],
  ['functions', 'return-vs-print', '5\nNone', (s) => bare(correctTexts(s)[0]).replace(', then ', '\n')],
  ['functions', 'locals', '10', (s) => bare(correctTexts(s)[0])],
  ['functions', 'watch-locals', '10', null],
  ['lists', 'hook', 'banana', (s) => bare(correctTexts(s)[0])],
  ['lists', 'explore', 'banana', null],
  ['lists', 'append-len', '3 rest', (s) => bare(correctTexts(s)[0])],
  ['lists', 'watch-best', '30', (s) => /from \d+ to (\d+)\./.exec(s.explain)[1]],
  ['lists', 'alias', '[1, 2, 3, 4]', (s) => bare(correctTexts(s)[0])],
  ['lists', 'watch-alias', '[1, 2, 3, 4]\n[1, 2, 3, 4, 5]', null],
  ['dictionaries', 'hook', '5', (s) => bare(correctTexts(s)[0])],
  ['dictionaries', 'explore', '5', null],
  ['dictionaries', 'update', '3 7', (s) => bare(correctTexts(s)[0])],
  ['dictionaries', 'in-check', 'unknown', (s) => bare(correctTexts(s)[0])],
  ['dictionaries', 'watch-tally', "{'red': 2, 'blue': 1}", null],
  ['dictionaries', 'case-trap', '2', (s) => bare(correctTexts(s)[0])],
  ['debugging', 'hook', 'Total: 10', (s) => bare(correctTexts(s)[0])],
  ['debugging', 'find-line', 'Total: 10', (s) => /printed `(Total: \d+)`/.exec(s.text)[1]],
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
  const covered = new Set([
    ...PRINTS.map(([l, id]) => `${l}/${id}`),
    'variables/reassign', 'variables/swap-trap', 'decisions/boundary', 'decisions/elif-chain', 'decisions/indent',
    'loops/forever', 'loops/range-practice', 'loops/accumulate', 'functions/params', 'lists/index-practice', 'lists/search',
    'dictionaries/lookup-practice', 'dictionaries/loop-total',
    'debugging/read-message', 'debugging/read-fix', 'debugging/teach-error-message',
  ]);
  for (const [lesson, step] of allSteps()) {
    const s = resolveStep(step, makeRng(1), step.id);
    if ([...s.figures, s.widget].some(isProgram)) assert.ok(covered.has(`${lesson}/${step.id}`), `${lesson}/${step.id} shows a program that no test runs`);
  }
});

test('more facts the lessons state about those programs', () => {
  const programs = {
    hookFinal: `${codeOf(one('variables', 'hook'))}\nprint(x, y)`,
    loopCount: `${codeOf(one('loops', 'hook'))}\nprint(count)`,
    range15: 'print(list(range(1, 5)), len(range(5)))',
    keepIt: codeOf(one('functions', 'locals')).replace('\nbirthday(age)\n', '\nage = birthday(age)\n'),
    double: `${fenced(one('functions', 'idea').text)}\nprint(double(4))`,
    indentA: codeOf(one('decisions', 'indent'), 0),
    indentB: codeOf(one('decisions', 'indent'), 1),
    listIdea: j('fruits = ["apple", "banana", "cherry"]', 'print(len(fruits), len(fruits) - 1, fruits[len(fruits) - 1] == fruits[-1])',
      'fruits.append("date")', 'print(fruits[-1], len(fruits))', 'fruits[0] = "avocado"', 'print(fruits)', 'print(["apple", "banana"])'),
    rumour: 'people = 1\nfor day in range(10):\n    people = people * 2\nprint(people)',
    noneAdd: 'x = None + None',
    swapShortcut: 'a = 1\nb = 2\na, b = b, a\nprint(a, b)',
  };
  const keys = Object.keys(programs);
  const r = Object.fromEntries(both(keys.map((k) => programs[k])).map((res, i) => [keys[i], res]));
  assert.equal(r.hookFinal.out, '6\n10 6');                       // "x names 10, y names 6"
  assert.match(one('variables', 'idea').figures[0].caption, /x names 10, y names 6/);
  assert.equal(r.loopCount.out.split('\n').pop(), '6');           // "Once it reaches 6 … the loop stops"
  assert.equal(r.range15.out, '[1, 2, 3, 4] 5');                  // "five numbers"; range(1, 5) stops before 5
  assert.equal(r.keepIt.out, '11');                               // "To keep it: age = birthday(age)"
  assert.equal(r.double.out, '8');
  assert.equal(r.indentA.out, '');                                // program A prints nothing at all
  assert.equal(r.indentB.out, 'Wear boots');
  assert.deepEqual(correctTexts(one('decisions', 'indent')), ['Only B']);
  assert.equal(r.listIdea.out, "3 2 True\ndate 4\n['avocado', 'banana', 'cherry', 'date']\n['apple', 'banana']");
  assert.equal(r.rumour.out, '1024');                             // "1024 on day 10"
  assert.equal(r.noneAdd.error[0], 'TypeError');                  // "None + None is an error"
  assert.equal(r.swapShortcut.out, '2 1');
});

test('teaching screens: the other things they say about their worked examples', () => {
  const code = (lesson, id) => codeOf(one(lesson, id));
  const text = (lesson, id) => one(lesson, id).text;
  const swap = (src, from, to) => { assert.ok(src.includes(from), `${from} is in the program`); return src.replace(from, to); };
  const tableRows = (t) => [...t.matchAll(/^\| `(range\([\d, ]+\))` \| ([\d, ]+) \|$/gm)].map((m) => [m[1], m[2]]);
  const programs = {
    arithmetic: 'print(7 + 2, 7 - 2, 7 * 2, 7 / 2, 12 / 3, 7 // 2)',
    decimal: 'print(type(3.5) == float, type("4 + 4") == str)',
    payEight: swap(code('variables', 'example-program'), 'hours = 6', 'hours = 8'),
    payTooEarly: 'pay = hours * rate\nhours = 6\nrate = 15\nprint(hours, pay)',
    capitals: 'raining = False\nprint("cat" == "Cat", raining, 2 + 2 == 4)',
    speedSixty: swap(code('decisions', 'teach-if-else'), 'speed = 70', 'speed = 60'),
    hour14: swap(code('decisions', 'teach-elif'), 'hour = 9', 'hour = 14'),
    hour20: swap(code('decisions', 'teach-elif'), 'hour = 9', 'hour = 20'),
    hourBoth: 'hour = 9\nprint(hour < 12, hour < 18)',
    discountAnd: swap(code('decisions', 'teach-and-or'), ' or ', ' and '),
    discountSides: 'age = 30\nmember = True\nprint(age < 16, member, not member)',
    ranges: tableRows(text('loops', 'teach-for-range')).map(([call]) => `print(list(${call}))`).join('\n'),
    range58: 'print(list(range(5, 8)), len(range(5, 8)), len(range(4)))',
    pepper: 'for letter in "pepper":\n    print(letter)',
    changeCalls: `${code('functions', 'example-two-params').split('\n').slice(0, 2).join('\n')}\nprint(left(10, 4), left(20, 5), left(3, 1))`,
    rideEdge: `${code('functions', 'example-early-return').split('\n').slice(0, 4).join('\n')}\nprint(ride(119), ride(120))`,
    returnInLoop: swap(code('lists', 'example-list-function'), '    return wins', '        return wins'),
    fruits: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[-1], fruits[len(fruits) - 1])\nprint(fruits[3])',
    prices: 'prices = {"apple": 3, "pear": 5}\nprint(prices["pear"], "pear" in prices, "plum" in prices)\nprint(prices["Pear"])',
    emptyDict: 'counts = {}\nprint(len(counts), counts)',
    passDoesNothing: 'for name in ["a", "b"]:\n    pass\nprint("after")',
    sumLen: 'marks = []\nprint(sum(marks), len(marks), sum([3, 5, 4]), len([3, 5, 4]))',
    typo: code('debugging', 'teach-error-message'),
    typoFixed: swap(code('debugging', 'teach-error-message'), 'widht', 'width'),
    copy: 'a = [1, 2]\nc = a.copy()\nc.append(3)\nprint(a, c)',
  };
  const keys = Object.keys(programs);
  const r = Object.fromEntries(both(keys.map((k) => programs[k])).map((res, i) => [keys[i], res]));

  assert.equal(r.arithmetic.out, '9 5 14 3.5 4.0 3');             // + - * (times) and / (divided by); / always gives a decimal; // rounds down
  assert.equal(r.decimal.out, 'True True');                       // "3.5 is a number too"; quotes make a string
  assert.equal(r.payEight.out, '8 120');                          // "Change the 6 to 8 … line 3 still does its job"
  assert.deepEqual(r.payTooEarly.error.slice(0, 2), ['NameError', 1]);   // a name used before an earlier line gave it a value
  assert.equal(r.capitals.out, 'False False True');               // '"cat" == "Cat" is False'; a name can hold False; sums are worked out first
  assert.equal(r.speedSixty.out, 'Speed is fine\nDrive on');      // "60 is not greater than 60, so the other branch runs"
  assert.equal(r.hour14.out, 'Good afternoon');                   // "Try 14, then 20"
  assert.equal(r.hour20.out, 'Good evening');
  assert.equal(r.hourBoth.out, 'True True');                      // "It never asks hour < 18, although that is True as well"
  assert.equal(r.discountAnd.out, 'Full price');                  // "Change or to and … now both sides have to be True"
  assert.equal(r.discountSides.out, 'False True False');          // "age < 16 is False, but member is True"; not flips
  const rows = tableRows(text('loops', 'teach-for-range'));
  assert.equal(rows.length, 2);
  assert.equal(r.ranges.out, rows.map(([, numbers]) => `[${numbers}]`).join('\n'));   // the table of ranges
  assert.equal(r.range58.out, '[5, 6, 7] 3 4');                   // "8 − 5 = 3 numbers"; range(4) runs the body four times
  assert.equal(r.pepper.out, 'p\ne\np\np\ne\nr');                 // a for loop walks through a string one character at a time
  assert.equal(r.changeCalls.out, '6 15 2');                      // "returns 6"; "Python adds 15 + 2"
  assert.match(text('functions', 'example-two-params'), /adds 15 \+ 2 and prints `17`/);
  assert.equal(r.rideEdge.out, 'Too small Welcome aboard');
  assert.equal(r.returnInLoop.out, '1');                          // a return inside the loop body ends the function on the first pass
  assert.equal(r.fruits.stdout, 'cherry cherry\n');               // "fruits[-1] is the last item"
  assert.deepEqual(r.fruits.error.slice(0, 2), ['IndexError', 3]);     // "An index past the end, such as fruits[3]"
  assert.equal(r.prices.stdout, '5 True False\n');                // lookup, and the two "in" questions
  assert.deepEqual(r.prices.error.slice(0, 2), ['KeyError', 3]);       // "The spelling has to match exactly"
  assert.equal(r.emptyDict.out, '0 {}');                          // "counts = {} starts with an empty dictionary"
  assert.equal(r.passDoesNothing.out, 'after');                   // 'pass means "do nothing"'
  assert.equal(r.sumLen.out, '0 0 12 3');                         // the note on debugging/read-fix
  assert.deepEqual(r.typo.error, ['NameError', 2, "name 'widht' is not defined"]);   // the three parts the screen reads out
  assert.match(text('debugging', 'teach-error-message'), /here `NameError`[\s\S]*line 2[\s\S]*the name `widht` is not defined/);
  assert.equal(r.typoFixed.out, '8');
  assert.equal(r.copy.out, '[1, 2] [1, 2, 3]');                   // "a.copy() builds a new list with the same items"
});

test('the runaway loop really never ends, and prints 1 every time', () => {
  const s = one('loops', 'forever');
  const [r] = both([codeOf(s)]);
  assert.equal(r.error[0], 'TimeoutError');
  const lines = r.stdout.split('\n').filter(Boolean);
  assert.ok(lines.length > 100 && lines.every((l) => l === '1'));
  assert.match(correctTexts(s)[0], /`1` again and again/);
});

/* ------------------------------------------------------------- the tracers */

test('tracers: the recorded lines and variable values match real Python step for step', () => {
  const found = [];
  for (const [lesson, step] of allSteps()) {
    const s = resolveStep(step, makeRng(1), step.id);
    for (const w of [...s.figures, s.widget]) if (w && w.type === 'py-trace') found.push([`${lesson}/${step.id}`, w.code]);
  }
  // ten tracers the learner drives, and four worked examples on teaching screens
  assert.deepEqual(found.map((f) => f[0]).sort(), [
    'debugging/find-line', 'decisions/be-computer', 'dictionaries/watch-tally', 'functions/be-computer', 'functions/teach-locals', 'functions/watch-locals',
    'lists/teach-alias', 'lists/watch-alias', 'lists/watch-best', 'loops/be-computer', 'loops/example-count', 'loops/watch-total', 'variables/example-update', 'variables/watch',
  ]);
  const results = both(found.map((f) => f[1]));
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

  let t = trace('variables', 'watch');
  assert.deepEqual(valuesOf(t, 'y'), ['6']);                       // "y stayed 6 the whole time"
  assert.deepEqual(valuesOf(t, 'x'), ['5', '10']);

  t = trace('decisions', 'be-computer');
  assert.deepEqual(lines(t), [1, 2, 5, 6]);                        // jumps over line 3, runs the else part, carries on with line 6

  t = trace('loops', 'be-computer');
  assert.deepEqual(lines(t), [1, 2, 3, 4, 2, 3, 4, 2, 5]);
  assert.equal(lines(t).filter((l) => l === 3).length, 2);         // "The body ran twice."
  assert.equal(lines(t).filter((l) => l === 2).length, 3);         // "The question was asked three times"

  t = trace('loops', 'watch-total');
  assert.equal(lines(t).filter((l) => l === 3).length, 5);         // once for every number the range hands out: 1 to 5
  assert.deepEqual(valuesOf(t, 'total'), ['0', '1', '3', '6', '10', '15']);
  assert.equal(/`total` went ([\d, ]+)\./.exec(one('loops', 'watch-total').explain)[1], '0, 1, 3, 6, 10, 15');
  assert.match(one('loops', 'watch-total').text, /`range\(1, 6\)` hands out 1 to 5/);

  t = trace('variables', 'example-update');
  assert.deepEqual(valuesOf(t, 'eggs'), ['12', '10', '30']);       // "12 − 2 is 10 … 10 × 3 is 30"
  assert.match(one('variables', 'example-update').text, /12 − 2 is 10[\s\S]*10 × 3 is 30/);

  t = trace('loops', 'example-count');
  assert.deepEqual(valuesOf(t, 'count'), ['0', '1', '2', '3']);
  assert.deepEqual(valuesOf(t, 'letter').slice(0, 3), ["'p'", "'e'", "'p'"]);   // "letter is "p", then "e", then "p" again"
  assert.equal(lines(t).filter((l) => l === 4).length, 3);         // line 4 runs only on the passes where the letter is p
  assert.equal(lines(t).filter((l) => l === 5).length, 1);         // "The last line runs once"

  t = trace('functions', 'teach-locals');
  const inDiscount = t.filter((e) => e.func === 'discount');
  assert.deepEqual(valuesOf(inDiscount, 'price'), ['40', '35']);   // "Inside, price drops to 35."
  assert.ok(inDiscount.every((e) => e.globals.price === '40'));    // "Outside, it stays 40."
  assert.equal(t[t.length - 1].vars.sale, '35');                   // line 6 stores what came back

  t = trace('lists', 'teach-alias');
  assert.equal(t[t.length - 1].ids.team, t[t.length - 1].ids.squad);   // one shared list, two names

  t = trace('functions', 'be-computer');
  assert.deepEqual(t.map((e) => `${e.event}:${e.line}`), ['line:1', 'line:4', 'call:1', 'line:2', 'return:2', 'line:5', 'end:0']);
  assert.deepEqual(t[2].vars, { n: '4' });                         // "jumps into the body with n set to 4"
  assert.equal(t[4].value, '8');
  assert.deepEqual(t[4].callers, [4]);                             // "hands 8 back to line 4"
  assert.equal(t[5].vars.x, '8');

  t = trace('functions', 'watch-locals');
  const inside = t.filter((e) => e.func === 'birthday');
  assert.deepEqual(valuesOf(inside, 'age'), ['10', '11']);
  assert.ok(inside.every((e) => e.globals.age === '10'));          // the other age never changes
  assert.equal(t.find((e) => e.event === 'return').value, '11');   // "The function did return 11"

  t = trace('lists', 'watch-best');
  assert.deepEqual(valuesOf(t, 'best'), ['12', '30']);             // "Only once: from 12 to 30."
  assert.match(one('lists', 'watch-best').explain, /Only once: from 12 to 30\. The later scores, 8 and 21/);

  t = trace('lists', 'watch-alias');
  const last = t[t.length - 1];
  assert.equal(last.ids.a, last.ids.b);                            // one list, two names
  assert.notEqual(last.ids.a, last.ids.c);                         // c is a list of its own

  t = trace('debugging', 'find-line');
  assert.deepEqual(valuesOf(t, 'total'), ['0', '4', '6', '10']);   // "total changes from 4 to 6 — but 4 + 6 should give 10"
  assert.match(one('debugging', 'find-line').text, /4, then 10, then 20/);
  assert.match(codeOf(one('debugging', 'find-line')).split('\n')[3], /total = p/);  // "line 4 … says total = p"
});

/* --------------------------------------------------------- generated steps */

/** Check the answers of generated "what does it print?" steps in both Pythons. */
function printsAll(cases) {
  const results = both(cases.map((c) => c[0]));
  cases.forEach(([src, expected], i) => {
    assert.equal(results[i].error, null, src);
    assert.equal(results[i].out, String(expected), src);
  });
}

test('variables/reassign: (a + b) × 2, from the program text', () => {
  const cases = [];
  for (const s of variants('variables', 'reassign')) {
    const code = codeOf(s);
    const m = /^(\w+) = (\d+)\n\1 = \1 \+ (\d+)\n\1 = \1 \* 2\nprint\(\1\)$/.exec(code);
    assert.ok(m, code);
    const [name, a, b] = [m[1], Number(m[2]), Number(m[3])];
    const mine = (a + b) * 2;
    assert.equal(s.answer, mine);
    cases.push([code, mine]);
    assert.ok(s.text.includes(`\`${name} = ${name} + ${b}\``));
    const said = /(\d+) \+ (\d+) is (\d+),.*Then (\d+) × 2 is \*\*(\d+)\*\*/.exec(s.explain).slice(1).map(Number);
    assert.deepEqual(said, [a, b, a + b, a + b, mine]);
    assert.ok(s.hints[1].includes(`is ${a + b}.`));
    assert.deepEqual(new Set(s.wrong.map((w) => w[0])), new Set([a + b, a * 2, a + b * 2]));
  }
  printsAll(cases);
});

test('variables/swap-trap: both names end up with the second value', () => {
  const cases = [];
  for (const s of variants('variables', 'swap-trap')) {
    const code = codeOf(s);
    const m = /^(\w+) = (\d)\n(\w+) = (\d)\n\1 = \3\n\3 = \1\nprint\(\1, \3\)$/.exec(code);
    assert.ok(m, code);
    const [p, q] = [m[2], m[4]];
    assert.notEqual(p, q);
    cases.push([code, `${q} ${q}`]);
    assert.deepEqual(correctTexts(s), [`\`${q} ${q}\``]);
    assert.deepEqual(new Set(s.options.map((o) => bare(o.text))), new Set([`${q} ${q}`, `${q} ${p}`, `${p} ${q}`, `${p} ${p}`]));
    assert.ok(s.explain.includes(`both names stand for ${q}`));
  }
  printsAll(cases);
});

test('decisions/boundary: the discount applies only strictly above the limit', () => {
  const cases = [];
  const seen = new Set();
  for (const s of variants('decisions', 'boundary')) {
    const [off, limit] = /takes (\d+) off any price \*\*over\*\* (\d+)/.exec(s.text).slice(1).map(Number);
    const code = codeOf(s);
    const m = /^price = (\d+)\nif price > (\d+):\n    price = price - (\d+)\nprint\(price\)$/.exec(code);
    assert.ok(m, code);
    const price = Number(m[1]);
    assert.deepEqual([Number(m[2]), Number(m[3])], [limit, off], 'the program matches the story');
    const mine = price > limit ? price - off : price;
    seen.add(Math.sign(price - limit));
    assert.equal(s.answer, mine);
    assert.ok(mine > 0);
    cases.push([code, mine]);
    assert.ok(s.explain.includes(`\`${price} > ${limit}\` is ${price > limit ? 'True' : 'False'}`) && s.explain.includes(`**${mine}**`));
    assert.deepEqual(s.wrong.map((w) => w[0]), [price > limit ? price : price - off]);
    assert.match(s.wrong[0][1], price > limit ? /does run/ : /skipped/);
  }
  assert.equal(seen.size, 3, 'below, exactly at and above the limit all occur');
  printsAll(cases);
});

test('decisions/elif-chain: the first true branch decides the grade', () => {
  const cases = [];
  const seen = new Set();
  for (const s of variants('decisions', 'elif-chain')) {
    const score = Number(/scores (\d+)\./.exec(s.text)[1]);
    const code = codeOf(s);
    assert.ok(code.startsWith(`score = ${score}\nif score >= 90:`));
    const mine = score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';
    seen.add(mine);
    cases.push([code, mine]);
    assert.deepEqual(s.options.map((o) => o.text), ['`A`', '`B`', '`C`', '`D`']);
    assert.deepEqual(correctTexts(s), [`\`${mine}\``]);
    assert.ok(s.explain.includes(`gives \`${mine}\``));
    for (const o of s.options) {
      const letter = bare(o.text);
      if (/That condition is True as well/.test(o.why || '')) assert.ok(score >= { B: 70, C: 50 }[letter], `${letter} for ${score}`);
      if (/at least 50\? No/.test(o.why || '')) assert.ok(score < 50);
    }
  }
  assert.equal(seen.size, 4);
  printsAll(cases);
});

test('loops/range-practice: how many passes, and the last number', () => {
  const cases = [];
  const kinds = new Set();
  for (const s of variants('loops', 'range-practice')) {
    const code = codeOf(s);
    const count = /^for i in range\((\d+), (\d+)\):\n    print\("Hi"\)$/.exec(code);
    const lastOf = /^for i in range\((\d+)(?:, (\d+))?\):\n    print\(i\)$/.exec(code);
    assert.ok(count || lastOf, code);
    if (count) {
      const [a, b] = [Number(count[1]), Number(count[2])];
      let mine = 0;
      for (let i = a; i < b; i++) mine++;
      kinds.add('count');
      assert.match(s.text, /How many times/);
      assert.equal(s.answer, mine);
      cases.push([code, Array(mine).fill('Hi').join('\n')]);
      assert.ok(s.explain.includes(`gives the numbers ${a} to ${b - 1}. That is ${b} − ${a} = **${mine}**`));
      assert.ok(s.hints[0].includes(`${a}, ${a + 1}, … and stop before ${b}`));
    } else {
      const [start, stop] = lastOf[2] === undefined ? [0, Number(lastOf[1])] : [Number(lastOf[1]), Number(lastOf[2])];
      const numbers = [];
      for (let i = start; i < stop; i++) numbers.push(i);
      const mine = numbers[numbers.length - 1];
      kinds.add(lastOf[2] === undefined ? 'last-one' : 'last');
      assert.match(s.text, /\*\*last\*\* number/);
      assert.equal(s.answer, mine);
      cases.push([code, numbers.join('\n')]);
      assert.ok(s.explain.includes(`not including, ${stop}.`) && s.explain.includes(`**${mine}**`));
      assert.deepEqual(s.wrong.map((w) => w[0]), [stop]);
    }
  }
  assert.equal(kinds.size, 3);
  printsAll(cases);
});

test('loops/accumulate: the sum of the range', () => {
  const cases = [];
  for (const s of variants('loops', 'accumulate')) {
    const code = codeOf(s);
    const m = /^total = 0\nfor n in range\((\d+), (\d+)\):\n    total = total \+ n\nprint\(total\)$/.exec(code);
    assert.ok(m, code);
    const [a, b] = [Number(m[1]), Number(m[2])];
    const terms = [];
    for (let i = a; i < b; i++) terms.push(i);
    const mine = terms.reduce((x, y) => x + y, 0);
    assert.equal(s.answer, mine);
    cases.push([code, mine]);
    assert.ok(s.explain.includes(`: ${terms.join(' + ')} = **${mine}**`));
    assert.ok(s.hints[0].includes(`the values ${terms.join(', ')}.`));
    assert.deepEqual(s.wrong.map((w) => w[0]), [mine + b, b - 1, 0]);
  }
  printsAll(cases);
});

test('functions/params: two calls, added', () => {
  const cases = [];
  for (const s of variants('functions', 'params')) {
    const code = codeOf(s);
    const m = /^def area\(w, h\):\n    return w \* h\n\nprint\(area\((\d+), (\d+)\) \+ area\((\d+), (\d+)\)\)$/.exec(code);
    assert.ok(m, code);
    const [a, b, c, d] = m.slice(1).map(Number);
    const mine = a * b + c * d;
    assert.equal(s.answer, mine);
    cases.push([code, mine]);
    assert.ok(s.explain.includes(`returns ${a * b} and`) && s.explain.includes(`returns ${c * d}.`) && s.explain.includes(`${a * b} + ${c * d} = **${mine}**`));
    assert.ok(s.hints[1].includes(`return ${a * b} and ${c * d}`));
    for (const [value] of s.wrong) assert.ok([a * b, c * d, (a + c) * (b + d)].includes(value));
  }
  printsAll(cases);
});

test('lists/index-practice: indexes from 0, negative indexes, len', () => {
  const cases = [];
  const kinds = new Set();
  for (const s of variants('lists', 'index-practice')) {
    const code = codeOf(s);
    const m = /^nums = \[([\d, ]+)\]\nprint\((.+)\)$/.exec(code);
    assert.ok(m, code);
    const nums = m[1].split(', ').map(Number);
    assert.equal(new Set(nums).size, 5);
    const plain = /^nums\[(\d)\]$/.exec(m[2]);
    let mine;
    if (plain) {
      const i = Number(plain[1]);
      mine = nums[i];
      kinds.add('plain');
      assert.ok(s.explain.includes(`index ${i} holds **${mine}**`));
      assert.deepEqual(s.wrong.map((w) => w[0]), [nums[i - 1]]);
      assert.ok(s.hints[0].includes(`\`nums[0]\` is ${nums[0]}`));
    } else if (m[2] === 'nums[0] + nums[-1]') {
      mine = nums[0] + nums[nums.length - 1];
      kinds.add('ends');
      assert.ok(s.explain.includes(`the first item, ${nums[0]},`) && s.explain.includes(`the last, ${nums[4]}.`) && s.explain.includes(`**${mine}**`));
    } else {
      assert.equal(m[2], 'nums[len(nums) - 1]');
      mine = nums[nums.length - 1];
      kinds.add('len');
      assert.ok(s.explain.includes('The list has 5 items') && s.explain.includes(`**${mine}**`));
    }
    assert.equal(s.answer, mine);
    cases.push([code, mine]);
  }
  assert.equal(kinds.size, 3);
  printsAll(cases);
});

test('lists/search: the loop finds the largest score, which is never first or last', () => {
  const cases = [];
  for (const s of variants('lists', 'search')) {
    const code = codeOf(s);
    const m = /^scores = \[([\d, ]+)\]\nbest = scores\[0\]\nfor s in scores:\n    if s > best:\n        best = s\nprint\(best\)$/.exec(code);
    assert.ok(m, code);
    const scores = m[1].split(', ').map(Number);
    const mine = Math.max(...scores);
    assert.equal(s.answer, mine);
    cases.push([code, mine]);
    assert.deepEqual(s.wrong.map((w) => w[0]), [scores[scores.length - 1], scores[0]]);
    assert.ok(s.hints[0].includes(`starts at ${scores[0]}.`) && s.explain.includes(`starts at ${scores[0]} `) && s.explain.includes(`**${mine}**`));
  }
  printsAll(cases);
});

/* ------------------------------------------------------------ dictionaries */

/** Parse a one-line dictionary literal with string keys and whole-number values, keeping the order. */
const dictOf = (text) => Array.from(text.matchAll(/"(\w+)": (\d+)/g), (m) => [m[1], Number(m[2])]);

test('dictionaries/lookup-practice: lookups, replacing a value, counting pairs', () => {
  const cases = [];
  const kinds = new Set();
  for (const s of variants('dictionaries', 'lookup-practice')) {
    const code = codeOf(s);
    const lines = code.split('\n');
    const m = /^cost = (\{.*\})$/.exec(lines[0]);
    assert.ok(m, code);
    const d = new Map(dictOf(m[1]));
    assert.equal(d.size, dictOf(m[1]).length, 'no key is written twice');
    let mine;
    for (const line of lines.slice(1)) {
      let x;
      if ((x = /^cost\["(\w+)"\] = cost\["(\w+)"\] \+ (\d+)$/.exec(line))) { assert.ok(d.has(x[2]), line); d.set(x[1], d.get(x[2]) + Number(x[3])); kinds.add('replace'); }
      else if ((x = /^cost\["(\w+)"\] = (\d+)$/.exec(line))) d.set(x[1], Number(x[2]));
      else if ((x = /^print\(cost\["(\w+)"\] \+ cost\["(\w+)"\]\)$/.exec(line))) { assert.ok(d.has(x[1]) && d.has(x[2]), line); mine = d.get(x[1]) + d.get(x[2]); kinds.add('sum'); }
      else if ((x = /^print\(cost\["(\w+)"\]\)$/.exec(line))) { assert.ok(d.has(x[1]), line); mine = d.get(x[1]); }
      else if (line === 'print(len(cost))') { mine = d.size; kinds.add('count'); }
      else assert.fail(`unexpected line: ${line}`);
    }
    assert.equal(s.answer, mine, code);
    assert.ok(s.explain.includes(`**${mine}**`), s.explain);
    for (const [value] of s.wrong) assert.notEqual(value, mine, 'a listed slip is the right answer');
    cases.push([code, mine]);
  }
  assert.deepEqual([...kinds].sort(), ['count', 'replace', 'sum']);
  printsAll(cases);
});

test('dictionaries/loop-total: a loop over the keys adds up the values', () => {
  const cases = [];
  for (const s of variants('dictionaries', 'loop-total')) {
    const code = codeOf(s);
    const m = /^cost = (\{.*\})\ntotal = 0\nfor item in cost:\n    total = total \+ cost\[item\]\nprint\(total\)$/.exec(code);
    assert.ok(m, code);
    const pairs = dictOf(m[1]);
    assert.equal(new Set(pairs.map((p) => p[0])).size, 3);
    const mine = sum(pairs.map((p) => p[1]));
    assert.equal(s.answer, mine);
    assert.ok(s.hints[0].includes(`\`"${pairs[0][0]}"\``) && s.hints[0].includes(`is ${pairs[0][1]}.`), s.hints[0]);
    assert.ok(s.explain.includes(`${pairs.map((p) => p[1]).join(' + ')} = **${mine}**`), s.explain);
    for (const [value] of s.wrong) assert.notEqual(value, mine, 'a listed slip is the right answer');
    cases.push([code, mine]);
  }
  printsAll(cases);
});

test('dictionaries: the facts the lesson states about its programs', () => {
  const programs = {
    plum: 'prices = {"apple": 3, "pear": 5}\nprint(prices["plum"])',
    capital: 'prices = {"apple": 3, "pear": 5}\nprint(prices["Apple"])',
    idea: j('prices = {"apple": 3, "pear": 5}', 'prices["plum"] = 4', 'print(len(prices), "plum" in prices, "fig" in prices)', 'prices["plum"] = 9', 'print(len(prices), prices["plum"])'),
    get: 'ages = {"Ana": 31, "Bo": 25}\nprint(ages.get("Cy", 0), ages.get("Bo", 0))',
    caseTrap: `${codeOf(one('dictionaries', 'case-trap'))}\nprint(ages["Ana"])`,
    tallyGet: j('word = "banana"', 'counts = {}', 'for letter in word:', '    counts[letter] = counts.get(letter, 0) + 1', 'print(counts)'),
  };
  const keys = Object.keys(programs);
  const r = Object.fromEntries(both(keys.map((k) => programs[k])).map((res, i) => [keys[i], res]));
  assert.equal(r.plum.error[0], 'KeyError');                      // "stops the program with a KeyError"
  assert.equal(r.capital.error[0], 'KeyError');                   // '"Apple" would fail too'
  assert.equal(r.idea.out, '3 True False\n3 9');                  // a new key adds a pair, an existing key is replaced
  assert.equal(r.get.out, '0 25');                                // get: the fallback, or the value
  assert.equal(r.caseTrap.out, '2\n31');                          // 'ages["Ana"] is still 31'
  assert.equal(r.tallyGet.out, "{'b': 1, 'a': 3, 'n': 2}");       // the one-line version in the explanation
  // the explore check accepts the apple price and explains a KeyError
  const check = raw('dictionaries', 'explore').check;
  assert.equal(check({ runs: 1, error: null, stdout: '3\n' }), true);
  assert.match(check({ runs: 1, error: 'KeyError', stdout: '' }), /nothing stored under that label/);
  assert.match(check({ runs: 1, error: null, stdout: '5\n' }), /Not the price of an apple/);
  assert.match(check({ runs: 0, error: null, stdout: '' }), /press Run/);
});

/* -------------------------------------------------- debugging: read and fix */

// For each broken program of debugging/read-fix: the error I expect from
// Python, and what each offered fix really does when it is applied.
const FIXES = [
  { find: 'print(names[3])', error: ['IndexError', 2, 'list index out of range'], options: [
    ['Change `names[3]` to `names[2]`', (c) => c.replace('names[3]', 'names[2]'), { out: 'Cy' }],
    ['Change the square brackets to round ones', (c) => c.replace('names[3]', 'names(3)'), { error: 'TypeError' }],       // "a different error"
    ['Put quotes around the 3', (c) => c.replace('names[3]', 'names["3"]'), { error: 'TypeError' }],
  ] },
  { find: 'print("Total: " + price * 3)', error: ['TypeError', 2, 'can only concatenate str (not "int") to str'], options: [
    ['Wrap the number: `str(price * 3)`', (c) => c.replace('price * 3', 'str(price * 3)'), { out: 'Total: 12' }],
    ['Remove the quotes around `Total: `', (c) => c.replace('"Total: "', 'Total: '), { error: 'SyntaxError' }],
    ['Change `price = 4` to `price = 4.0`', (c) => c.replace('price = 4', 'price = 4.0'), { error: 'TypeError' }],
  ] },
  { find: 'print("Passed with", scroe)', error: ['NameError', 3, "name 'scroe' is not defined"], options: [
    ['Correct the spelling on line 3: `score`', (c) => c.replace('scroe', 'score'), { out: 'Passed with 80' }],
    ['Add the line `scroe = 0` at the top', (c) => `scroe = 0\n${c}`, { out: 'Passed with 0' }],                          // "would then print 0"
    ['Put quotes around `scroe`', (c) => c.replace('scroe', '"scroe"'), { out: 'Passed with scroe' }],                     // "prints the word"
  ] },
  { find: 'average = sum(marks) / len(marks)', error: ['ZeroDivisionError', 2, 'division by zero'], options: [
    ['Only divide when the list has at least one mark', (c) => c.replace(/average = (.*)\nprint\(average\)/, 'if len(marks) > 0:\n    average = $1\n    print(average)\nprint("ok")'), { out: 'ok' }],
    ['Use `//` instead of `/`', (c) => c.replace(' / ', ' // '), { error: 'ZeroDivisionError' }],                          // "still a division by zero"
    ['Divide by `len(marks) - 1` instead', (c) => c.replace('len(marks)', '(len(marks) - 1)'), { out: '-0.0' }],           // no message any more
  ] },
];

test('debugging/read-fix: the message shown is the one Python gives, and each fix does what the feedback says', () => {
  const seen = new Set();
  const toRun = [];
  for (const s of variants('debugging', 'read-fix')) {
    const code = codeOf(s);
    const spec = FIXES.find((f) => code.includes(f.find));
    assert.ok(spec, code);
    seen.add(spec.find);
    const [type, line, message] = spec.error;
    assert.ok(s.text.includes(`\`\`\`\n${type} on line ${line}\n${message}\n\`\`\``), s.text);
    assert.deepEqual(s.figures[0].mark, [line]);
    assert.deepEqual(new Set(s.options.map((o) => o.text)), new Set(spec.options.map((o) => o[0])));
    assert.deepEqual(correctTexts(s), [spec.options[0][0]]);
    toRun.push([code, spec]);
  }
  assert.equal(seen.size, FIXES.length, 'all four broken programs turn up');
  const unique = [...new Map(toRun.map(([code, spec]) => [code, spec])).entries()];
  const results = both(unique.map(([code]) => code));
  unique.forEach(([code, spec], i) => {
    assert.deepEqual(results[i].error, spec.error, code);
    if (HAVE_PYTHON) assert.equal(results[i].real.error[2], spec.error[2], 'the message is word for word the one CPython prints');
    const fixed = both(spec.options.map((o) => o[1](code)));
    spec.options.forEach(([text, apply, want], k) => {
      assert.notEqual(apply(code), code, `${text}: the fix changes the program`);
      if (want.error) assert.equal(fixed[k].error && fixed[k].error[0], want.error, text);
      else { assert.equal(fixed[k].error, null, text); assert.equal(fixed[k].out, want.out, text); }
    });
    // only the fix marked correct gives a program that runs and does the job
    assert.ok(spec.options.slice(1).every((o, k) => fixed[k + 1].error || o[2].out !== spec.options[0][2].out));
  });
});

test('debugging: the crashes the lesson shows are the ones Python reports', () => {
  const message = one('debugging', 'read-message');
  const starters = {
    readMessage: codeOf(message),
    readMessageFixed: codeOf(message).replace('+ age', '+ str(age)'),
    name: raw('debugging', 'code-name').starter,
    equals: raw('debugging', 'code-equals').starter,
    range: raw('debugging', 'code-range').starter,
    indent: raw('debugging', 'code-indent').starter,
    costStarter: raw('functions', 'code-return').starter,
    // the usual causes listed in match-errors
    nameTypo: 'total = 1\nprint(totl)',
    nameEarly: 'print(total)\ntotal = 1',
    typeMix: 'print("text" + 5)',
    indexPast: 'items = [1, 2, 3]\nprint(items[3])',
    noColon: 'if 3 > 2\n    print("yes")',
    noBracket: 'print((1 + 2)\nprint(3)',
    noQuote: 'print("hello)',
    assignAsQuestion: 'x = 5\nif x = 5:\n    print("yes")',
  };
  const keys = Object.keys(starters);
  const r = Object.fromEntries(both(keys.map((k) => starters[k])).map((res, i) => [keys[i], res]));

  assert.deepEqual(r.readMessage.error.slice(0, 2), ['TypeError', 2]);
  assert.deepEqual(message.blanks.map((b) => (b.kind === 'select' ? b.answer : b.answers[0])), ['2', 'TypeError', 'str']);
  assert.equal(r.readMessageFixed.out, 'Age: 12');
  assert.deepEqual(r.name.error.slice(0, 2), ['NameError', 5]);        // "A NameError on line 5"
  assert.match(r.name.error[2], /'totl'/);
  assert.deepEqual(r.equals.error.slice(0, 2), ['SyntaxError', 3]);    // "will not even start"; "fix the line it points to"
  assert.equal(r.equals.stdout, '');
  assert.equal(r.range.out, '1\n2\n3\n4');                             // "stops one number early"
  assert.equal(r.indent.out, 'ready\nDone\nsteady\nDone\ngo\nDone');   // "Done appears three times"
  assert.equal(r.costStarter.stdout, '12\n10\n');
  assert.deepEqual(r.costStarter.error.slice(0, 2), ['TypeError', 4]);
  assert.match(r.costStarter.error[2], /NoneType/);                    // the lesson's feedback looks for this word

  const pairs = Object.fromEntries(one('debugging', 'match-errors').pairs.map(([kind, cause]) => [bare(kind), cause]));
  assert.deepEqual(Object.keys(pairs), ['NameError', 'TypeError', 'IndexError', 'SyntaxError']);
  assert.equal(r.nameTypo.error[0], 'NameError');
  assert.equal(r.nameEarly.error[0], 'NameError');
  assert.equal(r.typeMix.error[0], 'TypeError');
  assert.equal(r.indexPast.error[0], 'IndexError');
  for (const k of ['noColon', 'noBracket', 'noQuote', 'assignAsQuestion']) assert.equal(r[k].error[0], 'SyntaxError', k);
});

test('debugging/order-method lists the steps in the order the method was taught', () => {
  const taught = [...one('debugging', 'method').text.matchAll(/^\d\. \*\*(.+?)\*\*/gm)].map((m) => m[1]);
  assert.deepEqual(taught, ['Read the message.', 'Reproduce it.', 'Make a guess you can test.', 'Test the guess.', 'Change one thing']);
  const items = one('debugging', 'order-method').items;
  [/^Read the error message/, /^Run the program again/, /^Make a guess/, /^Test the guess/, /^Change one thing/].forEach((re, i) => assert.match(items[i], re));
  // the scenario says the message is already on the screen, so "read it" can only come first
  assert.match(one('debugging', 'order-method').text, /has just stopped with an error message/);
});

/* --------------------------------------------------------- Parsons problems */

function permutations(list) {
  if (list.length <= 1) return [list];
  return list.flatMap((item, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [item, ...rest]));
}

// For each Parsons problem: the output the task asks for, and an extra line
// that tells a program that does the job from one that prints it by luck.
const PARSONS = [
  ['variables', 'parsons', '24', ''],
  ['loops', 'parsons', '3', ''],
  ['functions', 'parsons', '8\n9 4 7', '\nprint(biggest(9, 2), biggest(4, 4), biggest(-1, 7))'],
  ['lists', 'parsons', 'Hi Ana\nHi Bo\nHi Cy\n3', ''],
];

test('Parsons problems: the listed order is the only one that does the job', () => {
  for (const [lesson, id, goal, probeLine] of PARSONS) {
    const s = one(lesson, id);
    assert.ok(s.code, `${lesson}/${id} is shown as code`);
    const orders = permutations(s.items.map((_, i) => i));
    const results = both(orders.map((order) => order.map((i) => s.items[i]).join('\n') + probeLine), { syntaxLines: false });
    const working = orders.filter((order, k) => !results[k].error && results[k].out === goal);
    assert.deepEqual(working, [s.items.map((_, i) => i)], `${lesson}/${id}: orders that work`);
    if (id === 'parsons' && lesson === 'variables') {
      // "Any other order stops with a NameError."
      orders.forEach((order, k) => { if (k > 0) assert.equal(results[k].error && results[k].error[0], 'NameError', order.join()); });
    }
  }
  assert.match(one('variables', 'parsons').text, /prints `24`/);
  assert.match(one('loops', 'parsons').explain, /`3`/);
  assert.match(one('functions', 'parsons').text, /prints `8`/);
  assert.match(one('lists', 'parsons').text, /`Hi Ana`, `Hi Bo`, `Hi Cy` and then `3`/);
});

/* ------------------------------------------- fill, bucket, multi and match */

test('fill steps: the blanks hold what the programs really do', () => {
  const table = one('variables', 'table');
  const [r] = both([`${fenced(table.template)}\nprint(a, b)`]);
  assert.equal(r.out, '9 6');
  assert.deepEqual(table.blanks.map((b) => b.answers), [['9'], ['6']]);

  // decisions/fill-vote: try every combination of the two dropdowns, for several ages
  const vote = one('decisions', 'fill-vote');
  const [op, branch] = vote.blanks;
  assert.deepEqual([op.answer, branch.answer], ['<', 'else']);
  const ages = [3, 16, 17, 18, 19, 60];
  const combos = op.options.flatMap((a) => branch.options.map((b) => [a, b]));
  const build = ([a, b], age) => fenced(vote.parts.map((p) => (p.text != null ? p.text : [a, b][p.blank])).join('')).replace('age = 16', `age = ${age}`);
  const results = both(combos.flatMap((c) => ages.map((age) => build(c, age))));
  const right = combos.filter((c, i) => ages.every((age, k) => {
    const res = results[i * ages.length + k];
    return !res.error && res.out === (age < 18 ? 'Too young' : 'You can vote');
  }));
  assert.deepEqual(right, [['<', 'else']]);
});

test('bucket, multi and match steps: every item evaluated by Python', () => {
  const kinds = one('variables', 'kinds');
  assert.deepEqual(kinds.buckets, ['Number', 'String (text)']);
  const kindResults = both(kinds.items.map((it) => `v = ${bare(it.text)}\nprint(type(v) == int or type(v) == float, type(v) == str)`));
  kinds.items.forEach((it, i) => assert.equal(kindResults[i].out, it.bucket === 0 ? 'True False' : 'False True', it.text));
  assert.equal(both(['print(7 + 1, len("7 + 1"), len("42"))'])[0].out, '8 5 2');   // "the number 8", "five characters", "the two characters 4 and 2"

  const tf = one('decisions', 'true-false');
  assert.deepEqual(tf.buckets, ['True', 'False']);
  const tfResults = both(tf.items.map((it) => `print(${bare(it.text)})`));
  tf.items.forEach((it, i) => assert.equal(tfResults[i].out, tf.buckets[it.bucket], it.text));

  const andOr = one('decisions', 'and-or');
  const x = Number(/Suppose `x = (\d+)`/.exec(andOr.text)[1]);
  const aoResults = both(andOr.options.map((o) => `x = ${x}\nprint(${bare(o.text)})`));
  andOr.options.forEach((o, i) => assert.equal(aoResults[i].out, o.correct ? 'True' : 'False', o.text));

  const ranges = one('loops', 'match-range');
  const rangeResults = both(ranges.pairs.map(([left]) => `print(list(${bare(left)}))`));
  ranges.pairs.forEach(([left, right], i) => assert.equal(rangeResults[i].out, `[${right}]`, left));

  // variables/truths: one small experiment per statement
  const truths = one('variables', 'truths');
  const experiments = [
    [/works out `x \+ 1` first/, 'x = 5\nx = x + 1\nprint(x)', (r) => r.out === '6'],
    [/changing `x` later changes `y`/, 'x = 5\ny = x + 1\nx = 10\nprint(y)', (r) => r.out === '11'],
    [/different kinds of value/, 'print(type("12") == type(12), "12" == 12)', (r) => r.out === 'False False'],
    [/given a new value later/, 'x = 1\nx = 2\nprint(x)', (r) => r.out === '2'],
    [/`=` asks whether two values are equal/, 'x = 5\nprint(x = 5)', (r) => r.out === 'True'],
  ];
  assert.equal(truths.options.length, experiments.length);
  const truthResults = both(experiments.map((e) => e[1]));
  experiments.forEach(([pattern, , holds], i) => {
    const option = truths.options.find((o) => pattern.test(o.text));
    assert.ok(option, String(pattern));
    assert.equal(!!option.correct, holds(truthResults[i]), option.text);
  });

  // functions/sort-print-return: the behaviours being sorted
  const sort = one('functions', 'sort-print-return');
  const bucketOf = (pattern) => sort.buckets[sort.items.find((it) => pattern.test(it.text)).bucket];
  const facts = both([
    'def f():\n    print("shown")\nx = f()\nprint(x)',                        // only prints: the caller is left with None
    'def f():\n    return 1\n    print("never")\nprint(f())',                // return ends the function straight away
    'def f():\n    print("a")\n    print("b")\nf()',                         // a function carries on after a print
    'def double(n):\n    return n * 2\nx = double(4)\nprint(x)',
    'def double(n):\n    print(n * 2)\nx = double(4)\nprint(x)',
  ]);
  assert.deepEqual(facts.map((f) => f.out), ['shown\nNone', '1', 'a\nb', '8', '8\nNone']);
  assert.equal(bucketOf(/Leaves the caller with `None`/), 'print');
  assert.equal(bucketOf(/Ends the function straight away/), 'return');
  assert.equal(bucketOf(/give `x` the value 8/), 'return');
  assert.equal(bucketOf(/Shows a value on the screen/), 'print');
  assert.equal(bucketOf(/Hands a value back/), 'return');
});

test('lists/explore: the check accepts cherry by either index and explains an IndexError', () => {
  const s = one('lists', 'explore');
  const base = codeOf(s);
  const tries = ['[2]', '[-1]', '[3]', '[0]', '[-3]', '[-4]'].map((index) => base.replace('[1]', index));
  const results = both(tries);
  assert.deepEqual(results.map((r) => (r.error ? r.error[0] : r.out)), ['cherry', 'cherry', 'IndexError', 'apple', 'apple', 'IndexError']);
  const state = (r) => ({ runs: 1, ok: !r.error, stdout: r.stdout, error: r.error ? r.error[0] : null });
  assert.equal(s.check(state(results[0])), true);
  assert.equal(s.check(state(results[1])), true);
  assert.match(s.check(state(results[2])), /no such position/);
  assert.match(s.check(state(results[3])), /Not `cherry` yet/);
  assert.equal(typeof s.check({ runs: 0, stdout: '', error: null }), 'string');
  assert.equal(typeof s.check({ runs: 1, stdout: '', error: 'SyntaxError' }), 'string');
  assert.equal(both([s.solution.code])[0].out, 'cherry');
});

/* ------------------------------------------------------------- code steps */

const pyLit = (v) => (Array.isArray(v) ? `[${v.map(pyLit).join(', ')}]`
  : typeof v === 'boolean' ? (v ? 'True' : 'False')
  : typeof v === 'string' ? JSON.stringify(v)
  : v && typeof v === 'object' ? `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${pyLit(x)}`).join(', ')}}`
  : String(v));
/** How Python prints a dictionary with string keys: {'a': 1, 'b': 2}. */
const dictRepr = (pairs) => `{${pairs.map(([k, x]) => `'${k}': ${x}`).join(', ')}}`;
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
const listArg = (expr) => JSON.parse(/\((\[.*\])\)$/.exec(expr)[1]);
const numArg = (expr) => Number(/\((-?[\d.]+)\)$/.exec(expr)[1]);
const sum = (list) => list.reduce((a, b) => a + b, 0);

// For every code step: my own answer to the task (out: what the program should
// print for given inputs; call: what an expression should be), correct
// programs written a different way, and plausible wrong ones.
const CODE = {
  'variables/code-total': {
    out: ({ price = 12, tickets = 3 }) => String(price * tickets),
    good: [
      j('price = 12', 'tickets = 3', 'total = tickets * price', 'print(total)'),
      j('price = 12', 'tickets = 3', 'total = 0', 'total = total + price * tickets', 'print(total)'),
      j('price = 12', 'tickets = 3', 'total = 0', 'for i in range(tickets):', '    total += price', 'print(total)'),
    ],
    bad: [
      j('price = 12', 'tickets = 3', 'total = 36', 'print(total)'),
      j('price = 12', 'tickets = 3', 'total = price + tickets', 'print(total)'),
      j('price = 12', 'tickets = 3', 'total = price * 3', 'print(total)'),
      j('price = 12', 'tickets = 3', 'total = "price * tickets"', 'print(total)'),
    ],
  },
  'variables/code-lives': {
    out: ({ lives = 3 }) => String((lives - 1) * 2),
    good: [
      j('lives = 3', 'lives -= 1', 'lives *= 2', 'print(lives)'),
      j('lives = 3', '# lose one life', 'lives = lives - 1', '', '# double the lives', 'lives = 2 * lives', '', 'print(lives)'),
      j('lives = 3', 'lives = lives - 1', 'lives = lives + lives', 'print(lives)'),
    ],
    bad: [
      j('lives = 3', 'lives - 1', 'lives * 2', 'print(lives)'),
      j('lives = 3', 'lives = lives * 2', 'lives = lives - 1', 'print(lives)'),
      j('lives = 3', 'lives = 2', 'lives = 4', 'print(lives)'),
      j('lives = 3', 'lives = lives + 1', 'print(lives)'),
      j('lives = 3', 'lives = lives - 1', 'lives = lives + 2', 'print(lives)'),
    ],
  },
  'variables/code-swap': {
    out: ({ a = 1, b = 2 }) => `${b} ${a}`,
    call: (expr, { a, b }) => { assert.equal(expr, '[a, b]'); return [b, a]; },
    good: [
      j('a = 1', 'b = 2', 'a, b = b, a', 'print(a, b)'),
      j('a = 1', 'b = 2', 'temp = b', 'b = a', 'a = temp', 'print(a, b)'),
      j('a = 1', 'b = 2', 'a = a + b', 'b = a - b', 'a = a - b', 'print(a, b)'),
    ],
    bad: [
      j('a = 1', 'b = 2', 'a = 2', 'b = 1', 'print(a, b)'),
      j('a = 1', 'b = 2', 'temp = a', 'a = b', 'b = a', 'print(a, b)'),
      j('a = 1', 'b = 2', 'print(b, a)'),                                  // prints the right thing without swapping
      j('a = 1', 'b = 2', 'b = a', 'a = b', 'print(a, b)'),
    ],
  },
  'decisions/code-pass': {
    out: ({ score = 62 }) => (score >= 50 ? 'Pass' : 'Fail'),
    good: [
      j('score = 62', 'if score >= 50:', '    print("Pass")', 'if score < 50:', '    print("Fail")'),
      j('score = 62', 'if score < 50:', '    print("Fail")', 'else:', '    print("Pass")'),
      j('score = 62', 'if score > 49:', "    print('Pass')", 'else:', "    print('Fail')"),
    ],
    bad: [
      j('score = 62', 'if score >= 50:', '    print("Pass")', 'print("Fail")'),
      j('score = 62', 'if score > 50:', '    print("Pass")', 'else:', '    print("Fail")'),
      j('score = 62', 'if score >= 50:', '    print("Pass")', 'else:', '    print("fail")'),
    ],
  },
  'decisions/code-weather': {
    out: ({ temp = 18 }) => (temp < 0 ? 'Freezing' : temp < 15 ? 'Cold' : temp < 25 ? 'Mild' : 'Hot'),
    good: [
      j('temp = 18', 'if temp >= 25:', '    print("Hot")', 'elif temp >= 15:', '    print("Mild")', 'elif temp >= 0:', '    print("Cold")', 'else:', '    print("Freezing")'),
      j('temp = 18', 'if temp < 0:', '    print("Freezing")', 'if temp >= 0 and temp < 15:', '    print("Cold")', 'if 15 <= temp < 25:', '    print("Mild")', 'if temp >= 25:', '    print("Hot")'),
      j('temp = 18', 'if temp < 0:', '    word = "Freezing"', 'elif temp < 15:', '    word = "Cold"', 'elif temp < 25:', '    word = "Mild"', 'else:', '    word = "Hot"', 'print(word)'),
    ],
    bad: [
      j('temp = 18', 'if temp < 0:', '    print("Freezing")', 'if temp < 15:', '    print("Cold")', 'if temp < 25:', '    print("Mild")', 'else:', '    print("Hot")'),
      j('temp = 18', 'if temp <= 0:', '    print("Freezing")', 'elif temp <= 15:', '    print("Cold")', 'elif temp <= 25:', '    print("Mild")', 'else:', '    print("Hot")'),
      j('temp = 18', 'if temp < 25:', '    print("Mild")', 'elif temp < 15:', '    print("Cold")', 'elif temp < 0:', '    print("Freezing")', 'else:', '    print("Hot")'),
      j('temp = 18', 'if temp < 0:', '    print("Freezing")', 'elif temp < 15:', '    print("Cold")', 'elif temp < 25:', '    print("Mild")', 'elif temp > 25:', '    print("Hot")'),
    ],
  },
  'decisions/code-ticket': {
    out: ({ age = 20, student = true }) => String(age < 5 ? 0 : (age < 18 || student) ? 6 : 10),
    good: [
      j('age = 20', 'student = True', 'if age < 5:', '    print(0)', 'elif student or age < 18:', '    print(6)', 'else:', '    print(10)'),
      j('age = 20', 'student = True', 'if age < 5:', '    price = 0', 'elif age < 18:', '    price = 6', 'elif student:', '    price = 6', 'else:', '    price = 10', 'print(price)'),
      j('age = 20', 'student = True', 'if age >= 18 and not student:', '    print(10)', 'elif age < 5:', '    print(0)', 'else:', '    print(6)'),
    ],
    bad: [
      j('age = 20', 'student = True', 'if age < 5:', '    print(0)', 'elif age < 18 and student:', '    print(6)', 'else:', '    print(10)'),
      j('age = 20', 'student = True', 'if age <= 5:', '    print(0)', 'elif age <= 18 or student:', '    print(6)', 'else:', '    print(10)'),
      j('age = 20', 'student = True', 'if age < 5:', '    print(0)', 'elif age < 18:', '    print(6)', 'else:', '    print(10)'),
    ],
  },
  'loops/code-forever': {
    out: () => '1\n2\n3\n4',
    good: [
      j('n = 1', 'while n < 5:', '    print(n)', '    n += 1'),
      j('n = 1', 'while n < 5:', '    print(n)', '    n = 1 + n'),
      j('n = 1', 'while n <= 4:', '    print(n)', '    n = n + 1'),
    ],
    bad: [
      j('n = 1', 'while n < 5:', '    n = n + 1', '    print(n)'),
      j('n = 1', 'while n < 5:', '    print(n)', 'n = n + 1'),
      j('n = 1', 'while n <= 5:', '    print(n)', '    n = n + 1'),
      j('n = 1', 'while n < 5:', '    print(n)', '    n = n - 1'),
    ],
  },
  'loops/code-sum': {
    out: ({ n = 100 }) => { let t = 0; for (let i = 1; i <= n; i++) t += i; return String(t); },
    good: [
      j('n = 100', 'total = 0', 'for i in range(n + 1):', '    total += i', 'print(total)'),
      j('n = 100', 'total = 0', 'i = 1', 'while i <= n:', '    total = total + i', '    i = i + 1', 'print(total)'),
      j('n = 100', 'total = 0', 'while n > 0:', '    total += n', '    n -= 1', 'print(total)'),
      j('n = 100', 'total = 0', 'for i in range(n, 0, -1):', '    total += i', 'print(total)'),
    ],
    bad: [
      j('n = 100', 'total = 0', 'for i in range(1, n):', '    total = total + i', 'print(total)'),
      j('n = 100', 'total = 0', 'for i in range(1, n + 1):', '    total = i', 'print(total)'),
      j('n = 100', 'total = 5050', 'print(total)'),
      j('n = 100', 'total = n * (n + 1) // 2', 'print(total)'),                 // right number, but no loop
      j('n = 100', 'total = 0', 'for i in range(1, 101):', '    total = total + i', 'print(total)'),
    ],
  },
  'loops/code-rumour': {
    out: ({ target = 1000 }) => { let people = 1; let days = 0; while (!(people > target)) { people *= 2; days++; } return String(days); },
    good: [
      j('target = 1000', 'people = 1', 'days = 0', 'while not people > target:', '    people *= 2', '    days += 1', 'print(days)'),
      j('target = 1000', 'people = 1', 'days = 0', 'while True:', '    if people > target:', '        break', '    people = people * 2', '    days = days + 1', 'print(days)'),
      j('target = 1000', 'people = 1', 'days = 0', 'while 2 ** days <= target:', '    days += 1', 'print(days)'),
    ],
    bad: [
      j('target = 1000', 'people = 1', 'days = 0', 'while people < target:', '    people = people * 2', '    days = days + 1', 'print(days)'),
      j('target = 1000', 'people = 1', 'days = 0', 'while people <= target:', '    people = people + 2', '    days = days + 1', 'print(days)'),
      j('target = 1000', 'people = 1', 'days = 10', 'print(days)'),
      j('target = 1000', 'people = 1', 'days = 1', 'while people <= target:', '    people = people * 2', '    days = days + 1', 'print(days)'),
    ],
  },
  'functions/code-square': {
    call: (expr) => numArg(expr) ** 2,
    good: [
      j('def square(n):', '    return n ** 2', '', 'print(square(3))'),
      j('def square(n):', '    result = n * n', '    return result'),
      j('def square(number):', '    return number * number', 'print(square(5))'),
    ],
    bad: [
      j('def square(n):', '    print(n * n)', '', 'print(square(3))'),
      j('def square(n):', '    return n * 2', '', 'print(square(3))'),
      j('def square(n):', '    return 9', '', 'print(square(3))'),
      j('def square(n):', '    n * n', '', 'print(square(3))'),
    ],
  },
  'functions/code-return': {
    out: () => String(4 * 3 + 5 * 2),
    call: (expr) => { assert.equal(expr, 'cost(4, 3)'); return 4 * 3; },
    good: [
      j('def cost(price, count):', '    return (price * count)', '', 'bill = cost(4, 3) + cost(5, 2)', 'print(bill)'),
      j('def cost(price, count):', '    total = price * count', '    return total', '', 'bill = cost(4, 3) + cost(5, 2)', 'print(bill)'),
      j('def cost(price, count):', '    return count * price', 'bill = cost(4, 3) + cost(5, 2)', 'print(bill)'),
    ],
    bad: [
      j('def cost(price, count):', '    print(price * count)', '    return price * count', '', 'bill = cost(4, 3) + cost(5, 2)', 'print(bill)'),
      j('def cost(price, count):', '    print(price * count)', '', 'bill = 22', 'print(bill)'),
      j('def cost(price, count):', '    return price + count', '', 'bill = cost(4, 3) + cost(5, 2)', 'print(bill)'),
      j('def cost(price, count):', '    return 11', '', 'bill = cost(4, 3) + cost(5, 2)', 'print(bill)'),
    ],
  },
  'functions/code-ticket': {
    call: (expr) => { const age = numArg(expr); return age < 5 ? 0 : age < 18 ? 6 : 10; },
    good: [
      j('def ticket_price(age):', '    if age < 5:', '        return 0', '    elif age < 18:', '        return 6', '    else:', '        return 10'),
      j('def ticket_price(age):', '    price = 10', '    if age < 18:', '        price = 6', '    if age < 5:', '        price = 0', '    return price'),
      j('def ticket_price(age):', '    if age >= 18:', '        return 10', '    if age >= 5:', '        return 6', '    return 0', 'print(ticket_price(12))'),
    ],
    bad: [
      j('def ticket_price(age):', '    if age <= 5:', '        return 0', '    if age <= 18:', '        return 6', '    return 10'),
      j('def ticket_price(age):', '    if age < 18:', '        return 6', '    if age < 5:', '        return 0', '    return 10'),
      j('def ticket_price(age):', '    if age < 5:', '        print(0)', '    elif age < 18:', '        print(6)', '    else:', '        print(10)'),
      j('def ticket_price(age):', '    if age < 5:', '        return 0', '    if age < 18:', '        return 6'),
    ],
  },
  'lists/code-count': {
    out: ({ temps = [3, -2, 0, -7, 5, -1] }) => String(temps.filter((t) => t < 0).length),
    good: [
      j('temps = [3, -2, 0, -7, 5, -1]', 'count = 0', 'for t in temps:', '    if t < 0:', '        count += 1', 'print(count)'),
      j('temps = [3, -2, 0, -7, 5, -1]', 'count = 0', 'for t in temps:', '    if t >= 0:', '        continue', '    count = count + 1', 'print(count)'),
      j('temps = [3, -2, 0, -7, 5, -1]', 'count = 0', 'for i in range(len(temps)):', '    if temps[i] < 0:', '        count = count + 1', 'print(count)'),
    ],
    bad: [
      j('temps = [3, -2, 0, -7, 5, -1]', 'count = 0', 'for t in temps:', '    if t <= 0:', '        count = count + 1', 'print(count)'),
      j('temps = [3, -2, 0, -7, 5, -1]', 'count = 0', 'for t in temps:', '    if t > 0:', '        count = count + 1', 'print(count)'),
      j('temps = [3, -2, 0, -7, 5, -1]', 'count = 3', 'print(count)'),
      j('temps = [3, -2, 0, -7, 5, -1]', 'count = 0', 'for t in temps:', '    if t < 0:', '        count = count + t', 'print(count)'),
    ],
  },
  'lists/code-total': {
    call: (expr) => sum(listArg(expr)),
    good: [
      j('def total(nums):', '    result = 0', '    for i in range(len(nums)):', '        result += nums[i]', '    return result'),
      j('def total(nums):', '    total = 0', '    for n in nums:', '        total = total + n', '    return total', '', 'print(total([3, 5, 2]))'),
      j('def total(nums):', '    t = 0', '    i = 0', '    while i < len(nums):', '        t = t + nums[i]', '        i = i + 1', '    return t'),
      j('def total(nums):', '    if len(nums) == 0:', '        return 0', '    return nums[0] + total(nums[1:])'),
    ],
    bad: [
      j('def total(nums):', '    result = 0', '    for n in nums:', '        result = result + n', '        return result'),
      j('def total(nums):', '    return sum(nums)'),                                   // the built-in is off limits here
      j('def total(nums):', '    result = 0', '    for n in nums:', '        result = n', '    return result'),
      j('def total(nums):', '    result = 0', '    for n in nums:', '        result = result + n', '    print(result)'),
      j('def total(nums):', '    result = nums[0]', '    for n in nums[1:]:', '        result = result + n', '    return result'),
    ],
  },
  'lists/code-backup': {
    out: ({ scores = [70, 85, 90] }) => `${pyLit(scores)}\n${pyLit([...scores, 100])}`,
    call: (expr) => { assert.equal(expr, 'backup'); return [70, 85, 90]; },
    good: [
      j('scores = [70, 85, 90]', 'backup = scores[:]', 'scores.append(100)', 'print(backup)', 'print(scores)'),
      j('scores = [70, 85, 90]', 'backup = list(scores)', 'scores.append(100)', 'print(backup)', 'print(scores)'),
      j('scores = [70, 85, 90]', 'backup = scores', 'scores = scores + [100]', 'print(backup)', 'print(scores)'),
      j('scores = [70, 85, 90]', 'backup = []', 'for s in scores:', '    backup.append(s)', 'scores.append(100)', 'print(backup)', 'print(scores)'),
    ],
    bad: [
      j('scores = [70, 85, 90]', 'backup = [70, 85, 90]', 'scores.append(100)', 'print(backup)', 'print(scores)'),
      j('scores = [70, 85, 90]', 'backup = scores', 'print(backup)', 'scores.append(100)', 'print(scores)'),   // right output, still one list
      j('scores = [70, 85, 90]', 'backup = scores.copy', 'scores.append(100)', 'print(backup)', 'print(scores)'),
      j('scores = [70, 85, 90]', 'backup = scores', 'backup.copy()', 'scores.append(100)', 'print(backup)', 'print(scores)'),
    ],
  },
  'dictionaries/code-tally': {
    out: ({ word = 'banana' }) => {
      const counts = new Map();
      for (const ch of word) counts.set(ch, (counts.get(ch) || 0) + 1);
      return dictRepr([...counts]);
    },
    good: [
      j('word = "banana"', 'counts = {}', 'for letter in word:', '    counts[letter] = counts.get(letter, 0) + 1', 'print(counts)'),
      j('word = "banana"', 'counts = {}', 'for letter in word:', '    if letter not in counts:', '        counts[letter] = 0', '    counts[letter] += 1', 'print(counts)'),
      j('word = "banana"', 'counts = {}', 'for letter in word:', '    if letter in counts:', '        counts[letter] += 1', '    else:', '        counts[letter] = 1', 'print(counts)'),
    ],
    bad: [
      j('word = "banana"', 'counts = {}', 'for letter in word:', '    counts[letter] = 1', 'print(counts)'),
      j('word = "banana"', 'counts = {"b": 1, "a": 3, "n": 2}', 'print(counts)'),
      j('word = "banana"', 'counts = {}', 'for letter in word:', '    if letter in counts:', '        counts[letter] = 1', '    else:', '        counts[letter] = counts[letter] + 1', 'print(counts)'),
      j('word = "banana"', 'counts = {}', 'for letter in word:', '    counts[letter] = counts.get(letter, 1) + 1', 'print(counts)'),
    ],
  },
  'dictionaries/code-price': {
    call: (expr) => {
      const m = /^price_of\((\{.*\}), "(\w+)"\)$/.exec(expr);
      assert.ok(m, expr);
      const menu = JSON.parse(m[1]);
      return Object.prototype.hasOwnProperty.call(menu, m[2]) ? menu[m[2]] : 0;
    },
    good: [
      j('def price_of(menu, item):', '    return menu.get(item, 0)'),
      j('def price_of(menu, item):', '    if item not in menu:', '        return 0', '    return menu[item]'),
      j('def price_of(menu, item):', '    for key in menu:', '        if key == item:', '            return menu[key]', '    return 0'),
    ],
    bad: [
      j('def price_of(menu, item):', '    return menu[item]'),
      j('def price_of(menu, item):', '    if item in menu:', '        print(menu[item])', '    return 0'),
      j('def price_of(menu, item):', '    return menu.get(item)'),
      j('def price_of(menu, item):', '    if item in menu:', '        return 4', '    return 0'),
    ],
  },
  'dictionaries/code-best': {
    out: ({ scores = { Ana: 7, Bo: 9, Cy: 4 } }) => Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a))[0],
    good: [
      j('scores = {"Ana": 7, "Bo": 9, "Cy": 4}', 'best = ""', 'top = -1', 'for name in scores:', '    if scores[name] > top:', '        best = name', '        top = scores[name]', 'print(best)'),
      j('scores = {"Ana": 7, "Bo": 9, "Cy": 4}', 'best = ""', 'for name in scores:', '    if best == "" or scores[name] > scores[best]:', '        best = name', 'print(best)'),
      j('scores = {"Ana": 7, "Bo": 9, "Cy": 4}', 'best = ""', 'top = -1', 'for name, score in scores.items():', '    if score > top:', '        top = score', '        best = name', 'print(best)'),
    ],
    bad: [
      j('scores = {"Ana": 7, "Bo": 9, "Cy": 4}', 'best = ""', 'top = -1', 'for name in scores:', '    pass', 'print(best)'),
      j('scores = {"Ana": 7, "Bo": 9, "Cy": 4}', 'best = ""', 'top = -1', 'for name in scores:', '    best = name', 'print(best)'),
      j('scores = {"Ana": 7, "Bo": 9, "Cy": 4}', 'print("Bo")'),
      j('scores = {"Ana": 7, "Bo": 9, "Cy": 4}', 'best = ""', 'top = -1', 'for name in scores:', '    if scores[name] > top:', '        top = scores[name]', 'print(top)'),
      j('scores = {"Ana": 7, "Bo": 9, "Cy": 4}', 'best = ""', 'top = -1', 'for name in scores:', '    if scores[name] > top:', '        best = name', 'print(best)'),
    ],
  },
  'debugging/code-name': {
    out: () => '4.0',                                                              // (3 + 5 + 4) / 3 with true division: a float
    good: [
      j('marks = [3, 5, 4]', 'total = 0', 'for m in marks:', '    total += m', 'average = total / len(marks)', 'print(average)'),
      j('marks = [3, 5, 4]', 'totl = 0', 'for m in marks:', '    totl = totl + m', 'average = totl / len(marks)', 'print(average)'),
    ],
    bad: [
      j('marks = [3, 5, 4]', 'total = 0', 'for m in marks:', '    total = total + m', 'average = total // len(marks)', 'print(average)'),
      j('marks = [3, 5, 4]', 'total = 0', 'totl = 0', 'for m in marks:', '    total = total + m', 'average = totl / len(marks)', 'print(average)'),
      j('print(4)'),
    ],
  },
  'debugging/code-equals': {
    out: ({ guess = 7, secret = 7 }) => (guess === secret ? 'Jackpot!' : 'Try again'),
    good: [
      j('guess = 7', 'secret = 7', 'if secret == guess:', '    print("Jackpot!")', 'else:', '    print("Try again")'),
      j('guess = 7', 'secret = 7', 'if guess != secret:', '    print("Try again")', 'else:', '    print("Jackpot!")'),
    ],
    bad: [
      j('guess = 7', 'secret = 7', 'if guess >= secret:', '    print("Jackpot!")', 'else:', '    print("Try again")'),
      j('guess = 7', 'secret = 7', 'if guess:', '    print("Jackpot!")', 'else:', '    print("Try again")'),
      j('guess = 7', 'secret = 7', 'if guess == 7:', '    print("Jackpot!")', 'else:', '    print("Try again")'),
      j('guess = 7', 'secret = 7', 'print("Jackpot!")'),
    ],
  },
  'debugging/code-range': {
    out: () => '1\n2\n3\n4\n5',
    good: [
      j('for i in range(5):', '    print(i + 1)'),
      j('for i in range(1, 5 + 1):', '    print(i)'),
      j('for i in range(1, 5):', '    print(i)', 'print(5)'),
    ],
    bad: [
      j('for i in range(6):', '    print(i)'),
      j('for i in range(1, 7):', '    print(i)'),
      j('for i in range(1, 6):', '    print(i, end=" ")'),
    ],
  },
  'debugging/code-logic': {
    out: ({ prices = [4, 6, 10] }) => `Total: ${sum(prices)}`,
    good: [
      j('prices = [4, 6, 10]', 'total = 0', 'for p in prices:', '    total += p', 'print("Total:", total)'),
      j('prices = [4, 6, 10]', 'total = 0', 'for p in prices:', '    total = p + total', 'print("Total:", total)'),
      j('prices = [4, 6, 10]', 'total = sum(prices)', 'print("Total:", total)'),
    ],
    bad: [
      j('prices = [4, 6, 10]', 'total = 0', 'for p in prices:', '    total = p', 'print("Total:", 20)'),
      j('prices = [4, 6, 10]', 'total = 0', 'for p in prices:', '    total = total + p', 'print("Total:" + str(total))'),
      j('prices = [4, 6, 10]', 'total = 0', 'for p in prices:', '    total = total + p', '    print("Total:", total)'),
    ],
  },
  'debugging/code-indent': {
    out: () => 'ready\nsteady\ngo\nDone',
    good: [
      j('for word in ["ready", "steady", "go"]:', '    print(word)', '', 'print("Done")'),
      j('words = ["ready", "steady", "go"]', 'for word in words:', '    print(word)', 'print("Done")'),
    ],
    bad: [
      j('for word in ["ready", "steady", "go"]:', '    print(word)'),
      j('print("Done")', 'for word in ["ready", "steady", "go"]:', '    print(word)'),
      j('for word in ["ready", "steady", "go"]:', 'print(word)', 'print("Done")'),
    ],
  },
};

const codeSteps = allSteps().filter(([, step]) => step.type === 'code');

test('every code step has a checked answer sheet in this file', () => {
  assert.deepEqual(codeSteps.map(([lesson, step]) => `${lesson}/${step.id}`).sort(), Object.keys(CODE).sort());
  assert.equal(codeSteps.length, 23);
});

for (const [lesson, step] of codeSteps) {
  const key = `${lesson}/${step.id}`;
  test(`code step ${key}: solution and other correct programs pass, wrong ones fail, and Python agrees`, () => {
    const spec = CODE[key];
    const solved = gradeCode(step, step.solution);
    assert.equal(solved.status, 'pass', solved.message);
    if (step.starter) assert.notEqual(gradeCode(step, step.starter).status, 'pass', 'the starter must not pass');
    assert.ok(spec.good.length >= 2 && spec.bad.length >= 2);
    spec.good.forEach((src) => { const g = gradeCode(step, src); assert.equal(g.status, 'pass', `a correct program is rejected (${g.message}):\n${src}`); });
    spec.bad.forEach((src) => assert.notEqual(gradeCode(step, src).status, 'pass', `a wrong program is accepted:\n${src}`));

    // every expected value in the step, re-derived from the task
    const checks = [...(step.expect != null ? [{ stdout: step.expect }] : []), ...(step.tests || []), ...(step.hidden || [])];
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
        else jobs.push({ src: `${typed}\nprint("check:", ${t.call} == ${pyLit(t.expect)})`, last: 'check: True' });
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
  assert.match(message('variables', 'code-lives', j('lives = 3', 'lives - 1', 'lives * 2', 'print(lives)')), /never changes/);
  assert.match(message('variables', 'code-lives', j('lives = 3', 'lives = lives * 2', 'lives = lives - 1', 'print(lives)')), /doubles first/);
  assert.match(message('variables', 'code-swap', j('a = 1', 'b = 2', 'print(b, a)')), /have not changed places/);
  assert.match(message('decisions', 'code-weather', CODE['decisions/code-weather'].bad[0]), /more than one word/);
  assert.match(message('decisions', 'code-weather', CODE['decisions/code-weather'].bad[1]), /"Below 0" does not include 0/);
  assert.match(message('decisions', 'code-ticket', j('age = 20', 'student = True', 'if student:', '    print(6)', 'elif age < 5:', '    print(0)', 'elif age < 18:', '    print(6)', 'else:', '    print(10)')), /free ticket comes first/);
  assert.match(message('loops', 'code-forever', raw('loops', 'code-forever').starter), /never ends/);
  assert.match(message('loops', 'code-forever', j('n = 1', 'while n < 5:', '    print(n)', 'n = n + 1')), /\*\*inside\*\* the loop/);
  assert.match(message('loops', 'code-forever', j('n = 1', 'while n < 5:', '    n = n + 1', '    print(n)')), /before\* it is printed/);
  assert.match(message('loops', 'code-sum', CODE['loops/code-sum'].bad[0]), /stops at 99/);
  assert.match(message('loops', 'code-sum', CODE['loops/code-sum'].bad[1]), /just the last number/);
  assert.match(message('loops', 'code-sum', j('n = 100', 'total = 0', 'for i in range(1, n + 2):', '    total = total + i', 'print(total)')), /one number past/);
  assert.match(message('loops', 'code-sum', CODE['loops/code-sum'].bad[3]), /asks for a loop/);
  assert.match(message('loops', 'code-rumour', CODE['loops/code-rumour'].bad[0]), /not yet \*more than\* 8/);
  assert.match(message('functions', 'code-return', raw('functions', 'code-return').starter), /both results are `None`/);
  assert.match(message('functions', 'code-ticket', CODE['functions/code-ticket'].bad[0]), /right on the edges/);
  assert.match(message('lists', 'code-count', CODE['lists/code-count'].bad[0]), /Zero is not below zero/);
  assert.match(message('lists', 'code-total', CODE['lists/code-total'].bad[1]), /build the sum yourself/);
  assert.match(message('lists', 'code-backup', CODE['lists/code-backup'].bad[1]), /still the same list/);
  assert.match(message('debugging', 'code-range', 'for i in range(6):\n    print(i)'), /starts at 0/);
  assert.match(message('debugging', 'code-logic', CODE['debugging/code-logic'].bad[0]), /worked out from the list/);
  // a program that cannot be read is reported as such and costs no attempt
  assert.equal(gradeCode(raw('debugging', 'code-equals'), raw('debugging', 'code-equals').starter).status, 'syntax');
});

/* ---------------------------------------------------- teach before you ask */

// Every teaching screen of the course: [the screen, the first step that relies on it, words the screen must contain].
// `added: true` marks the screens that were added so that nothing is asked before it has been shown.
const TEACHING = {
  variables: [
    ['idea', 'reassign', ['right-hand side', 'make this name stand for this value']],
    ['example-update', 'reassign', ['`*` (times)', '`/` (divided by)', '**same name**', 'reads the old value'], true],
    ['teach-strings', 'strings', ['**string**', '**joins**', '**nothing is worked out**', '`3.5` is a number'], true],
    ['example-program', 'parsons', ['`NameError`', '**earlier** line', 'comma inside `print`'], true],
  ],
  decisions: [
    ['idea', 'true-false', ['`a == b`', '`a != b`', '`a < b`, `a > b`', '`a <= b`, `a >= b`', 'capitals count', '`raining = False`', '`==` asks whether two values are equal']],
    ['teach-if-else', 'boundary', ['**colon**', '**indented**', '`else:` means *otherwise*', 'needs no `else`'], true],
    ['teach-elif', 'elif-chain', ['`elif` means "otherwise, if"', '**from the top**', '**first** branch', 'rest of the chain is skipped'], true],
    ['teach-and-or', 'and-or', ['`a and b`', '`a or b`', '`not a`', '**both** sides', '**at least one**', 'flips'], true],
  ],
  loops: [
    ['idea', 'forever', ['Check the condition', '**body**', 'the loop never ends']],
    ['teach-for-range', 'range-practice', ['once for each number', 'starts at 0 unless', '**before** its end number'], true],
    ['teach-accumulator', 'accumulate', ['**accumulator**', 'start a variable at 0', '**Inside** the loop', '**After** the loop'], true],
    ['example-count', 'parsons', ['walk through a **string**', 'may hold an `if`', 'the deeper it sits'], true],
  ],
  functions: [
    ['idea', 'code-square', ['**parameters**', '**called**', '`return` hands a value back']],
    ['example-two-params', 'params', ['**arguments**', '**in order**', 'replaced by its result'], true],
    ['teach-print-vs-return', 'return-vs-print', ['**shows** a value on the screen', '**hands a value back**', 'ends the function at once', '`None`, Python\'s word for "no value"'], true],
    ['teach-locals', 'locals', ['**local**', 'vanish when it returns', 'two separate variables'], true],
    ['example-early-return', 'parsons', ['ends the function **at once**', 'No `else` is needed'], true],
  ],
  lists: [
    ['idea', 'index-practice', ['**index**', 'Indexes start at 0', '`len(fruits) - 1`', '`fruits[-1]` is the last item', 'IndexError']],
    ['example-change-list', 'append-len', ['`pets.append("fish")` adds an item at the **end**', '**replaces** the item at index 1', '`len(pets)`', 'single quotes'], true],
    ['teach-for-list', 'parsons', ['from index 0 to the end', 'stands for the **next item**'], true],
    ['example-list-function', 'code-total', ['handed to a function', '**after** the loop', 'lines up with `for`'], true],
    ['teach-alias', 'alias', ['does **not** copy the list', 'the **same** list'], true],
  ],
  dictionaries: [
    ['idea', 'in-check', ['**key**', '**value**', 'KeyError', '`"pear" in prices` asks whether a key exists']],
    ['example-change-dict', 'update', ['a pair is **added**', 'its value is **replaced**', '`len(bag)` is the number of pairs'], true],
    ['teach-for-dict', 'loop-total', ['visits its **keys**', 'look it up inside the loop'], true],
  ],
  debugging: [
    ['teach-error-message', 'read-message', ['**kind** of error', '**Where** it happened', '**description**', 'first word'], true],
    ['teach-error-kinds', 'match-errors', ['First word', 'Usual cause', '**before** the program starts'], true],
    ['method', 'code-range', ['**Read the message.**', '**Change one thing**', 'No error message?']],
  ],
};

// Explorations that act as the worked example for the step after them, and prompts that carry a needed sentence:
// [lesson, the earlier step, the step that relies on it, what the earlier step's text must say]
const SHOWN_FIRST = [
  ['variables', 'watch', 'reassign', /what `print` has shown so far/],
  ['decisions', 'be-computer', 'boundary', /The line under `else:` is for when the answer is no/],
  ['loops', 'be-computer', 'forever', /where Python goes \*\*after line 4\*\*/],
  ['loops', 'watch-total', 'accumulate', /`range\(1, 6\)` hands out 1 to 5/],
  ['loops', 'watch-total', 'code-sum', /`range\(1, 6\)` hands out 1 to 5/],
  ['functions', 'be-computer', 'params', /\*\*into\*\* the function when it is called/],
  ['lists', 'watch-best', 'search', /replaces `best` whenever it meets a bigger one/],
  ['lists', 'watch-alias', 'code-backup', /`a\.copy\(\)` builds a \*\*new\*\* list with the same items/],
  ['dictionaries', 'watch-tally', 'code-tally', /If it is already a key, add 1 to its value\. Otherwise it is new: store it with a 1/],
  ['dictionaries', 'watch-tally', 'code-tally', /`counts = \{\}` starts with an empty dictionary/],
];

test('teach before you ask: the shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  assert.deepEqual(Object.keys(TEACHING), Object.keys(lessons));
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((step) => resolveStep(step, makeRng(1), step.id));   // `graded` exists only on resolved steps
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    assert.ok(roles.filter((kind) => kind === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.ok(steps.length >= 12 && steps.length <= 18, `${id}: ${steps.length} steps`);
    // the list above names every teaching screen of the lesson, in order
    assert.deepEqual(TEACHING[id].map((t) => t[0]), steps.filter((s) => s.type === 'info').map((s) => s.id), `${id}: teaching screens`);
    for (const [teach, ask, terms] of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === teach);
      const asked = steps.findIndex((s) => s.id === ask);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${teach}" exists`);
      assert.ok(asked > at && steps[asked].graded, `${id}: "${teach}" comes before the graded step "${ask}"`);
      // each idea is checked before the next: a question follows within two steps (an exploration may sit between)
      assert.ok(roles.slice(at + 1, at + 3).includes('graded'), `${id}/${teach} is followed by a question`);
      for (const term of terms) assert.ok(steps[at].text.includes(term), `${id}/${teach} should say: ${term}`);
    }
  }
  // the screens added in the "teach before you ask" revision
  const added = Object.fromEntries(Object.entries(TEACHING).map(([id, list]) => [id, list.filter((t) => t[3]).map((t) => t[0])]));
  assert.deepEqual(added, {
    variables: ['example-update', 'teach-strings', 'example-program'],
    decisions: ['teach-if-else', 'teach-elif', 'teach-and-or'],
    loops: ['teach-for-range', 'teach-accumulator', 'example-count'],
    functions: ['example-two-params', 'teach-print-vs-return', 'teach-locals', 'example-early-return'],
    lists: ['example-change-list', 'teach-for-list', 'example-list-function', 'teach-alias'],
    dictionaries: ['example-change-dict', 'teach-for-dict'],
    debugging: ['teach-error-message', 'teach-error-kinds'],
  });
  for (const [lesson, earlier, later, says] of SHOWN_FIRST) {
    const ids = lessons[lesson].steps.map((s) => s.id);
    assert.ok(ids.indexOf(earlier) >= 0 && ids.indexOf(earlier) < ids.indexOf(later), `${lesson}: "${earlier}" comes before "${later}"`);
    assert.match(one(lesson, earlier).text, says, `${lesson}/${earlier}`);
  }
});

test('teach before you ask: every worked example is a program that runs, shown before the first question of its kind', () => {
  // a screen whose title or id promises an example shows a real program: in a tracer, or in an editor with its output
  const shows = (lesson, id) => one(lesson, id).figures.filter(isProgram);
  for (const [lesson, list] of Object.entries(TEACHING)) {
    for (const [id, , , isNew] of list) {
      if (!isNew || id === 'teach-error-kinds') continue;
      const [program] = shows(lesson, id);
      assert.ok(program && (program.type === 'py-trace' || (program.type === 'py-run' && program.autorun)), `${lesson}/${id} shows a program with what it does`);
      assert.ok(program.alt, `${lesson}/${id}: the figure has an alt text`);
    }
  }
  // sentences a question needs, carried in its own prompt (review steps come back without the lesson round them)
  for (const s of variants('variables', 'swap-trap', 20)) assert.match(s.text, /`print` with a comma shows both values on one line/);
  assert.match(one('variables', 'code-lives').text, /a comment starts with `#`; Python ignores it/);
  assert.match(one('dictionaries', 'code-best').text, /`pass` means "do nothing"/);
  assert.match(one('debugging', 'code-name').text, /`\/` divides, and its result is always written with a decimal point/);
  assert.match(one('decisions', 'and-or').text, /`and` is True only when \*\*both\*\* sides are True/);
  for (const s of variants('decisions', 'elif-chain', 20)) assert.match(s.text, /`elif` means "otherwise, if"/);
  for (const s of variants('dictionaries', 'loop-total', 20)) assert.match(s.text, /visits its \*\*keys\*\*/);
});

test('teach before you ask: the worked examples are never the question that follows', () => {
  const example = (lesson, id) => codeOf(one(lesson, id));
  const never = (lesson, ask, teachLesson, teach, n = SEEDS) => {
    const shown = example(teachLesson, teach);
    for (const s of variants(lesson, ask, n)) assert.notEqual(codeOf(s), shown, `${lesson}/${ask} repeats the example of ${teach}`);
  };
  never('variables', 'reassign', 'variables', 'example-update');
  never('decisions', 'boundary', 'decisions', 'teach-if-else');
  never('decisions', 'elif-chain', 'decisions', 'teach-elif');
  never('loops', 'accumulate', 'loops', 'watch-total');
  never('loops', 'accumulate', 'loops', 'teach-accumulator');
  never('functions', 'params', 'functions', 'example-two-params');
  never('lists', 'search', 'lists', 'watch-best');
  never('dictionaries', 'lookup-practice', 'dictionaries', 'example-change-dict');
  never('dictionaries', 'loop-total', 'dictionaries', 'teach-for-dict');
  // the ranges written on the range screen and in the adding loop are not among the generated questions
  const taughtRanges = [...one('loops', 'teach-for-range').text.matchAll(/`(range\([\d, ]+\))`/g)].map((m) => m[1]);
  assert.deepEqual(taughtRanges, ['range(3)', 'range(10, 13)', 'range(5, 8)']);
  for (const [id, shown] of [['range-practice', taughtRanges], ['accumulate', [...taughtRanges, 'range(1, 6)', 'range(4)']]]) {
    for (const s of variants('loops', id)) for (const call of shown) assert.ok(!codeOf(s).includes(call), `loops/${id} asks about ${call}, which was the worked example`);
  }
  // lists/search uses scores from 2 to 9; the search the learner watches first uses two-digit scores
  assert.match(example('lists', 'watch-best'), /^scores = \[\d\d, \d\d, \d, \d\d\]/);
  for (const s of variants('lists', 'search')) assert.match(codeOf(s), /^scores = \[\d(, \d)+\]\n/);
});

test('teach before you ask: tables that questions are drawn from are taught in full', () => {
  // debugging: the kinds of error. The matching question and the teaching table come from one list in the lesson.
  const kindsScreen = one('debugging', 'teach-error-kinds').text;
  for (const [kind, cause] of one('debugging', 'match-errors').pairs) {
    assert.ok(kindsScreen.includes(`| ${kind} | ${cause} |`), `the table teaches ${kind}: ${cause}`);
  }
  // every broken program of debugging/read-fix stops with a kind of error that the table lists
  const order = lessons.debugging.steps.map((s) => s.id);
  assert.ok(order.indexOf('teach-error-kinds') < order.indexOf('match-errors') && order.indexOf('teach-error-kinds') < order.indexOf('read-fix'));
  const seen = new Set();
  for (const s of variants('debugging', 'read-fix')) {
    const kind = /```\n(\w+) on line \d+\n/.exec(s.text)[1];
    seen.add(kind);
    assert.ok(kindsScreen.includes(`| \`${kind}\` |`), `read-fix shows a ${kind}, which the table does not list`);
    if (kind === 'ZeroDivisionError') assert.match(s.text, /`sum\(marks\)` adds up a list and `len\(marks\)` counts its items\. `\/\/` is division rounded down/);
  }
  assert.deepEqual([...seen].sort(), ['IndexError', 'NameError', 'TypeError', 'ZeroDivisionError']);
  // read-message: the three blanks can be read off the crash shown beside them (kind, line, and the fix in the note under it)
  const crash = run(codeOf(one('debugging', 'read-message')));
  assert.equal(crash.error.type, 'TypeError');
  assert.match(crash.error.hint, /str\(/);

  // decisions: every comparison the questions use is in the table of the "idea" screen, above them
  const table = one('decisions', 'idea').text;
  const used = new Set();
  const collect = (text) => { for (const m of String(text).matchAll(/(==|!=|<=|>=|<|>)/g)) used.add(m[1]); };
  one('decisions', 'true-false').items.forEach((it) => collect(bare(it.text)));
  one('decisions', 'match-ops').pairs.forEach(([left]) => collect(bare(left)));
  one('decisions', 'fill-vote').blanks[0].options.forEach(collect);
  collect(codeOf(one('decisions', 'boundary')));
  collect(codeOf(one('decisions', 'elif-chain')));
  assert.deepEqual([...used].sort(), ['!=', '<', '==', '>', '>=']);
  for (const op of used) assert.ok(new RegExp(`\`a ${op.replace(/[<>=!]/g, '\\$&')} b\``).test(table), `the comparison ${op} is in the table`);

  // loops/match-range: both forms of range (one number, two numbers) are on the range screen
  const rangeScreen = one('loops', 'teach-for-range').text;
  assert.match(rangeScreen, /`range\(\d+\)` \| 0, 1, 2/);
  assert.match(rangeScreen, /`range\(\d+, \d+\)` \|/);
});
