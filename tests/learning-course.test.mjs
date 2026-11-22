// Independent checks of the "How to Learn Anything" course: every generated
// question re-solved from its own wording (many seeds), and the scheduling
// challenges checked against the memory model.
//
//   node --test tests/learning-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { simulate } from '../src/widgets/memory-curve.js';
import course from '../content/courses/learning/course.js';

const SEEDS = 200;
const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/learning/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, 'learning', meta.id);
  }
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(1000 + k * 7919), id));
const curveState = (reviews, days, threshold) => {
  const sim = simulate(reviews, days, 1);
  return { reviews: reviews.slice().sort((a, b) => a - b), lowest: sim.lowest, final: sim.final, ok: sim.lowest >= threshold };
};

// Twelve steps each before the lessons were revised to teach before they ask; the
// extra steps are the teaching screens listed in TEACHING below.
const STEP_COUNTS = {
  'forgetting-curve': 14, retrieval: 14, 'mix-it-up': 13, 'know-what-you-know': 15,
  'ask-why': 14, 'narrow-doorway': 15, 'one-thing': 13, 'build-your-system': 16,
};

test('the course has eight lessons in two chapters, twelve to sixteen steps each', () => {
  assert.deepEqual(course.chapters.map((c) => c.lessons.length), [4, 4]);
  assert.deepEqual(Object.keys(lessons).sort(), Object.keys(STEP_COUNTS).sort());
  for (const [id, lesson] of Object.entries(lessons)) assert.equal(lesson.steps.length, STEP_COUNTS[id], id);
});

test('no generated text contains undefined, NaN or an empty slot', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < 60; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        const blob = JSON.stringify(s, (key, value) => (typeof value === 'function' ? undefined : value));
        assert.ok(!/undefined|NaN|\[object Object\]/.test(blob), `${id}/${step.id} seed ${k}`);
        if (!step.gen) break;
      }
    }
  }
});

test('every choice has exactly one correct option, and polls have none', () => {
  const polls = new Set(['know-what-you-know/zipper-before', 'know-what-you-know/zipper-after', 'ask-why/passage-rate', 'one-thing/hook']);
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'choice') continue;
      for (let k = 0; k < 40; k++) {
        const s = resolveStep(step, makeRng(5 + k * 97), step.id);
        const right = s.options.filter((o) => o.correct).length;
        assert.equal(right, polls.has(`${id}/${step.id}`) ? 0 : 1, `${id}/${step.id}`);
        assert.equal(new Set(s.options.map((o) => o.text)).size, s.options.length, `${id}/${step.id} has duplicate options`);
        if (!step.gen) break;
      }
    }
  }
});

test('forgetting-curve: doubling question', () => {
  for (const s of variants('forgetting-curve', 'doubling')) {
    const start = Number(/about \*\*(\d+) days?\*\*/.exec(s.text)[1]);
    const n = Number(/After \*\*(\d+) reviews\*\*/.exec(s.text)[1]);
    let days = start;
    for (let i = 0; i < n; i++) days *= 2;
    assert.equal(s.answer, days);
    for (const [value] of s.wrong) assert.notEqual(value, s.answer);
  }
});

test('narrow-doorway: counting chunks', () => {
  for (const s of variants('narrow-doorway', 'count-chunks')) {
    const digits = /The number \*\*(\d+)\*\* has (\d+) digits/.exec(s.text);
    const grouped = /in groups instead: \*\*([\d ]+)\*\*/.exec(s.text)[1].split(' ');
    assert.equal(digits[1].length, Number(digits[2]), 'stated length matches the number');
    assert.equal(grouped.join(''), digits[1], 'the groups spell the same number');
    assert.equal(new Set(grouped.map((g) => g.length)).size, 1, 'groups are equal in size');
    assert.equal(s.answer, grouped.length);
    assert.ok(s.answer >= 2 && s.answer <= 5, 'a number of chunks that fits working memory');
    for (const [value] of s.wrong) assert.notEqual(value, s.answer);
    assert.ok(s.explain.includes(`${s.answer} chunks`));
  }
});

test('one-thing: minutes lost to refocusing', () => {
  for (const s of variants('one-thing', 'cost-sum')) {
    const each = Number(/costs you \*\*(\d+) minutes?\*\*/.exec(s.text)[1]);
    const times = Number(/glance at it \*\*(\d+) times\*\*/.exec(s.text)[1]);
    assert.equal(s.answer, each * times);
    assert.ok(s.answer < 60, 'less than the hour it is taken from');
    for (const [value, message] of s.wrong) { assert.notEqual(value, s.answer); assert.ok(message); }
  }
});

test('build-your-system: weekly plans read correctly', () => {
  for (const s of variants('build-your-system', 'week', 60)) {
    const total = /about \*\*(\w+ hours) a week\*\*/.exec(s.text)[1];
    const texts = s.options.map((o) => o.text);
    const daily = Number(/About (\d+) minutes on most days/.exec(texts.find((t) => t.startsWith('About')))[1]);
    const hours = { two: 2, three: 3, four: 4 }[total.split(' ')[0]];
    // "most days" means five to seven sessions: the daily figure must add up to roughly the weekly total
    assert.ok(daily * 5 <= hours * 60 + 15 && daily * 7 >= hours * 60 - 5, `${daily} minutes a day for ${total}`);
    assert.ok(texts.some((t) => t === `One ${total.replace(' hours', '-hour')} session every Sunday`));
    assert.ok(texts.some((t) => /^[A-Z]\w+ hours every Sunday, re-reading/.test(t)));
  }
});

test('scheduling challenges: the given solutions pass and typical mistakes are caught', () => {
  const keepAlive = raw('forgetting-curve', 'keep-alive');
  assert.equal(keepAlive.check(curveState(keepAlive.solution.reviews, 30, 0.7)), true);
  assert.equal(typeof keepAlive.check(curveState([1, 2, 3], 30, 0.7)), 'string');
  assert.equal(typeof keepAlive.check(curveState([10, 20, 28], 30, 0.7)), 'string');

  const exam = raw('build-your-system', 'exam-plan');
  assert.equal(exam.widget.threshold, 0.6);
  const passes = (reviews) => exam.check(curveState(reviews, 30, 0.6));
  assert.equal(passes(exam.solution.reviews), true);
  assert.match(passes([3, 10]), /1 review left/);
  assert.match(passes([27, 28, 29]), /first review comes too late/);     // cramming at the end
  assert.match(passes([1, 2, 3]), /dips under the 60% line/);            // cramming at the start
  assert.match(passes([2, 5, 9]), /Move your last review closer/);       // alive, but faded by exam day

  // The challenge is fair: many placements work, and every one of them starts early and ends late.
  let ok = 0;
  for (let a = 1; a < 30; a++) for (let b = a + 1; b < 30; b++) for (let c = b + 1; c < 30; c++) {
    if (passes([a, b, c]) === true) { ok++; assert.ok(a <= 4 && c >= 19, `${a}/${b}/${c}`); }
  }
  assert.ok(ok > 200 && ok < 600, `${ok} winning placements`);
});

// ---------------------------------------------------------------------------
// Teach before you ask. Every graded step may only ask for what the lesson (or
// an earlier lesson) has already shown. These tests pin the shape of each
// lesson and the substance of the teaching screens that were added for it.

const plain = (text) => String(text || '').replace(/\s+/g, ' ');
const resolved = (lessonId) => lessons[lessonId].steps.map((step) => resolveStep(step, makeRng(1), step.id));   // `graded` exists only on resolved steps

/** The teaching screens added in the teach-first revision. */
const TEACHING = {
  'forgetting-curve': ['teach-review', 'teach-spacing'],
  retrieval: ['teach-pull', 'teach-errors'],
  'mix-it-up': ['teach-mixing'],
  'know-what-you-know': ['teach-depth', 'teach-percent', 'teach-sweet-spot'],
  'ask-why': ['teach-self-explain', 'teach-expect'],
  'narrow-doorway': ['teach-chunks', 'teach-worked', 'teach-load'],
  'one-thing': ['teach-remove'],
  'build-your-system': ['teach-myths', 'teach-toolkit', 'teach-deadline', 'teach-habit'],
};

/** [lesson, teaching screen, the first step it serves, what the screen must say for that step]. */
const SERVES = [
  ['forgetting-curve', 'curve', 'read-curve', ['Ebbinghaus']],
  ['forgetting-curve', 'teach-review', 'timing', ['back to 100%', 'flatter', 'Relearning is much faster']],
  ['forgetting-curve', 'teach-spacing', 'plan', ['fading memory', 'gaps grow', 'spacing']],
  ['forgetting-curve', 'teach-spacing', 'gaps', ['next one can wait longer']],
  ['forgetting-curve', 'lemma', 'truths', ['Review']],
  ['retrieval', 'twist', 'confidence', ['five minutes', 'slightly *ahead*']],
  ['retrieval', 'words', 'recall-2', ['dax', 'to sneeze very quietly']],
  ['retrieval', 'teach-pull', 'sort', ['retrieval practice', 'Pull', 'Push', 'hidden', 'It is the learning']],
  ['retrieval', 'teach-pull', 'plan', ['then check']],
  ['retrieval', 'teach-errors', 'errors', ['wrong', 'see the correct answer', 'better']],
  ['mix-it-up', 'data', 'illusion', ['you would have picked the wrong method']],
  ['mix-it-up', 'teach-mixing', 'what-trains', ['Blocked', 'Mixed', 'decide what kind of problem', 'interleaving']],
  ['mix-it-up', 'teach-mixing', 'schedule', ['AAABBB', 'ABBABA']],
  ['mix-it-up', 'desirable', 'sort-difficulty', ['desirable difficulties', 'Not every difficulty is desirable']],
  ['know-what-you-know', 'calibration', 'percent', ['well calibrated', 'overconfidence']],
  ['know-what-you-know', 'teach-depth', 'best-test', ['illusion of explanatory depth', 'Recognising', 'Producing', 'out of sight']],
  ['know-what-you-know', 'teach-depth', 'evidence', ['Only a feeling', 'Real evidence']],
  ['know-what-you-know', 'teach-percent', 'percent', ['24 \\div 40 = 0.6', '60%', 'overconfident']],
  ['know-what-you-know', 'teach-sweet-spot', 'sweet-spot', ['most of the time, but not always', '85%', 'Too easy to teach you much']],
  ['know-what-you-know', 'in-lemma', 'habits', ['how sure you are']],
  ['ask-why', 'passage-title', 'baker', ['connecting it to what you already know']],
  ['ask-why', 'elaboration', 'sort', ['elaboration', 'Why', 'example', 'worked solution']],
  ['ask-why', 'teach-self-explain', 'heart', ['self-explanation', 'adds something the text did not say', 'restates', 'explains']],
  ['ask-why', 'teach-self-explain', 'best-move', ['a reason']],
  ['ask-why', 'teach-expect', 'teach', ['tested', 'teach', 'nobody taught anything', 'remembered more', 'Nestojko']],
  ['narrow-doorway', 'workspace', 'count-chunks', ['Working memory', 'four']],
  ['narrow-doorway', 'teach-chunks', 'chess', ['chunk']],
  ['narrow-doorway', 'teach-chunks', 'count-chunks', ['chunk', '314 159', '2 chunks']],
  ['narrow-doorway', 'overload', 'swamped', ['cognitive overload', 'not a sign that you lack talent']],
  ['narrow-doorway', 'teach-worked', 'fit-together', ['worked-example effect', 'beginners', 'fade', 'Kirschner', 'Kalyuga']],
  ['narrow-doorway', 'teach-load', 'load-sort', ['Shrink the step', 'Write things down', 'automatic', 'side by side', 'Song lyrics']],
  ['one-thing', 'switching', 'mixing', ['switches', 'every switch has a price', 'never removes it']],
  ['one-thing', 'teach-remove', 'protect', ['not willpower', 'another room', 'notifications off', 'Write it down', 'Choose one']],
  ['one-thing', 'teach-remove', 'fixes', ['Finish the problem first']],
  ['one-thing', 'rest', 'night-before', ['sleep', 'break']],
  ['build-your-system', 'teach-myths', 'myths', ['left-brained or right-brained', 'Dunlosky', 'Re-reading, highlighting', 'Testing yourself, spreading practice out']],
  ['build-your-system', 'teach-toolkit', 'diagnose', ['Spaced reviews', 'Retrieval practice', 'Mixed practice', 'Asking why', 'Small steps and worked examples']],
  ['build-your-system', 'teach-deadline', 'exam-plan', ['gaps grow', 'last review close to the day', '2, 7 and 17']],
  ['build-your-system', 'teach-habit', 'if-then', ['When X happens, I will do Y', 'if-then plans']],
  ['build-your-system', 'teach-habit', 'small', ['small target', 'worst day']],
];

test('teach before you ask: shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  assert.deepEqual(Object.keys(TEACHING).sort(), Object.keys(lessons).sort());
  for (const id of Object.keys(lessons)) {
    const steps = resolved(id);
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    const asksAfter = (at) => roles.slice(at + 1).some((kind) => kind !== 'teach');
    assert.ok(roles.filter((kind, at) => kind === 'teach' && asksAfter(at)).length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.ok(steps.length <= 18, `${id}: ${steps.length} steps`);
    for (const stepId of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === stepId);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${stepId}" exists`);
      assert.ok(roles.indexOf('graded', at + 1) > 0, `${id}/${stepId} is followed by a question`);
      for (const figure of steps[at].figures) assert.ok(figure.alt, `${id}/${stepId}: its figure has alt text`);
    }
  }
});

test('teach before you ask: each teaching screen comes before the step it serves, and says what that step needs', () => {
  for (const [lessonId, teach, ask, terms] of SERVES) {
    const steps = lessons[lessonId].steps;
    const screen = steps.find((s) => s.id === teach);
    assert.ok(screen && screen.type === 'info', `${lessonId}: no teaching screen "${teach}"`);
    const asked = steps.findIndex((s) => s.id === ask);
    assert.ok(asked >= 0 && steps.indexOf(screen) < asked, `${lessonId}: "${teach}" must come before "${ask}"`);
    const shown = plain(screen.text);
    for (const term of terms) assert.ok(shown.includes(term), `${lessonId}/${teach} should mention "${term}" (needed by "${ask}")`);
  }
  // every new teaching screen serves at least one step in the list above
  for (const [lessonId, ids] of Object.entries(TEACHING)) {
    for (const id of ids) assert.ok(SERVES.some(([l, t]) => l === lessonId && t === id), `${lessonId}/${id} serves no listed step`);
  }
  // what a demonstration showed is named on the teaching screen that follows it, not first in its explanation
  for (const [lessonId, stepId, rule] of [
    ['forgetting-curve', 'try-review', 'flatter'], ['retrieval', 'recall-1', 'It is the learning'],
    ['mix-it-up', 'feel-mixed', 'decide what kind'], ['know-what-you-know', 'quiz', 'overconfidence'],
    ['know-what-you-know', 'zipper-after', 'explanatory depth'], ['narrow-doorway', 'chunks', 'chunk'],
    ['narrow-doorway', 'worked', 'worked-example effect'], ['one-thing', 'experiment', 'dropping one sequence'],
    ['one-thing', 'lecture', 'willpower'],
  ]) {
    assert.ok(!plain(raw(lessonId, stepId).explain).includes(rule), `${lessonId}/${stepId}: "${rule}" belongs on the teaching screen that follows, not in the explanation`);
  }
});

test('teach before you ask: the sorting and matching steps only use what a screen above them lists', () => {
  // every tool of the diagnosis is a row of the toolkit table (same table, so the two cannot drift apart)
  const toolkit = plain(raw('build-your-system', 'teach-toolkit').text);
  const tools = { 'Reviews spread out over time': 'Spaced reviews', 'Practise recalling it without notes': 'Retrieval practice', 'Mixed practice': 'Mixed practice', 'Ask why, and invent examples': 'Asking why', 'Smaller steps and worked examples': 'Small steps and worked examples' };
  for (const [, tool] of raw('build-your-system', 'diagnose').pairs) assert.ok(tools[tool] && toolkit.includes(tools[tool]), `diagnose: "${tool}" is in the toolkit table`);
  // every principle matched to a feature of the site is named in the course
  assert.deepEqual(raw('build-your-system', 'in-lemma').pairs.map((p) => p[1]), ['Spacing', 'Retrieval', 'Mixing', 'Calibration', 'Limited working memory']);
  // each of the five moves on the "lighten the load" table is used by the sort that follows, in both directions
  const sort = raw('narrow-doorway', 'load-sort').items;
  const used = { 'Shrink the step': /one new idea at a time|Three new methods/, 'Write things down': /Writing intermediate results|entirely in your head/, 'Practise the basics': /until they are automatic/, 'side by side': /Labels placed right on|on one page and its explanation on another/, 'Cut out competing words': /Songs with lyrics/ };
  for (const item of sort) assert.ok(Object.values(used).some((re) => re.test(item.text)), `load-sort: "${item.text}" is covered by a row of the table`);
  for (const [move, re] of Object.entries(used)) {
    assert.ok(plain(raw('narrow-doorway', 'teach-load').text).includes(move) && sort.some((item) => re.test(item.text)), `teach-load: "${move}"`);
  }
  // the attention fixes: three of the four are rows of the table, the fourth (a break) is on the "rest" screen
  const remove = plain(raw('one-thing', 'teach-remove').text);
  for (const key of ['another room', 'Write it down', 'Finish the problem first']) assert.ok(remove.includes(key), key);
  assert.ok(plain(raw('one-thing', 'rest').text).includes('a break restores it'));
  // the four made-up words are shown before either recall step
  const words = plain(raw('retrieval', 'words').text);
  for (const [word, meaning] of raw('retrieval', 'recall-1').pairs) assert.ok(words.includes(word) && words.includes(meaning), word);
});

test('teach before you ask: the worked examples are right, and are not questions the practice steps can ask', () => {
  const pct = (reviews, days) => { const sim = simulate(reviews, days, 1); return [Math.round(sim.lowest * 100), Math.round(sim.final * 100)]; };
  const figure = (lessonId, stepId, k = 0) => resolveStep(raw(lessonId, stepId), makeRng(1), stepId).figures[k];
  // lesson 1: bunched against spaced, three reviews in 20 days
  assert.deepEqual([figure('forgetting-curve', 'teach-spacing', 0).reviews, figure('forgetting-curve', 'teach-spacing', 1).reviews], [[1, 2, 3], [2, 6, 15]]);
  assert.deepEqual([pct([1, 2, 3], 20), pct([2, 6, 15], 20)], [[63, 63], [81, 94]]);
  assert.match(figure('forgetting-curve', 'teach-spacing', 0).alt, /about 63 percent/);
  assert.match(figure('forgetting-curve', 'teach-spacing', 1).alt, /about 81 percent.*about 94 percent/);
  // ...and it does not give away the stretch problem that follows (30 days, never under 70%)
  assert.notDeepEqual(figure('forgetting-curve', 'teach-spacing', 1).reviews, raw('forgetting-curve', 'keep-alive').solution.reviews);
  assert.equal(figure('forgetting-curve', 'teach-spacing', 1).days, 20);
  // lesson 8: the deadline example
  assert.deepEqual(figure('build-your-system', 'teach-deadline').reviews, [2, 7, 17]);
  assert.deepEqual(pct([2, 7, 17], 20), [78, 97]);
  assert.match(plain(raw('build-your-system', 'teach-deadline').text), /never drops below 78%, and you walk in at 97%/);
  assert.ok(pct([17, 18, 19], 20)[0] < 20, 'all three reviews in the last days: the memory is almost gone first');
  assert.notDeepEqual(figure('build-your-system', 'teach-deadline').reviews, raw('build-your-system', 'exam-plan').solution.reviews);
  // lesson 4: 24 right out of 40 "fairly sure" answers
  assert.equal((24 / 40) * 100, 60);
  assert.deepEqual(figure('know-what-you-know', 'teach-percent').data.map((d) => d.value), [75, 60]);
  for (const s of variants('know-what-you-know', 'percent')) {
    assert.ok(!/\*\*40\*\* answers/.test(s.text), 'the practice step never repeats the worked example');
    const [, total, right] = /\*\*(\d+)\*\* answers[^]*?\*\*(\d+)\*\* of them were right/.exec(s.text).map(Number);
    assert.equal(s.answer, Math.round((right / total) * 100));
    assert.ok(s.answer < 95, 'always below what "almost certain" should mean, as the explanation says');
  }
  // lesson 6: six digits in two groups; the generator never uses six digits
  assert.equal('314159'.length / 3, 2);
  for (const s of variants('narrow-doorway', 'count-chunks')) assert.notEqual(/\*\*(\d+)\*\* has (\d+) digits/.exec(s.text)[2], '6');
  // lesson 1: the worked line of the doubling step (5, 10, 20) starts from a number the generator cannot pick
  for (const s of variants('forgetting-curve', 'doubling')) {
    assert.match(plain(s.text), /starting from 5 days: 10 after one review, 20 after two/);
    assert.notEqual(/about \*\*(\d+) days?\*\*/.exec(s.text)[1], '5');
  }
  // the bar charts repeat the numbers of the studies as the lessons state them
  assert.deepEqual(figure('retrieval', 'twist').series.map((sr) => sr.values), [[83, 40], [71, 61]]);
  assert.deepEqual(figure('mix-it-up', 'data').series.map((sr) => sr.values), [[89, 20], [60, 63]]);
});

test('the course describes this site as it is: one guess, then each idea is taught before it is asked', () => {
  const all = Object.values(lessons).flatMap((lesson) => lesson.steps.map((step) => plain(JSON.stringify(resolveStep(step, makeRng(3), step.id), (key, value) => (typeof value === 'function' ? undefined : value)))));
  for (const blob of all) {
    assert.ok(!/before\s+\*?teaching you the answer|come before the explanation|before being shown how/i.test(blob), 'no lesson says the site asks first and explains afterwards');
  }
  const errors = plain(raw('retrieval', 'teach-errors').text);
  for (const key of ['Sinha & Kapur, 2021', 'little or no benefit', 'procedures', 'younger', '**one** guess', '"Learn" screen before you are asked']) assert.ok(errors.includes(key), `teach-errors: ${key}`);
  const worked = plain(raw('narrow-doorway', 'teach-worked').text);
  for (const key of ['beginners learn new material best from clear explanation and worked examples', 'Kirschner, Sweller & Clark, 2006', 'Kalyuga and colleagues, 2003', '**fade**']) assert.ok(worked.includes(key), `teach-worked: ${key}`);
  const features = raw('build-your-system', 'in-lemma').pairs.map((p) => p[0]).join(' | ');
  assert.match(features, /straight after each idea is shown/);
  assert.match(features, /"Learn" screens/);
  // study results are guessed at most twice in a lesson; the rest are presented or reasoned from what was shown
  for (const [lessonId, stepId] of [['retrieval', 'hook'], ['mix-it-up', 'hook'], ['ask-why', 'hook'], ['narrow-doorway', 'chess'], ['narrow-doorway', 'worked'], ['one-thing', 'lecture'], ['build-your-system', 'styles'], ['build-your-system', 'habit-time']]) {
    assert.equal(raw(lessonId, stepId).mode, 'predict', `${lessonId}/${stepId}`);
  }
});
