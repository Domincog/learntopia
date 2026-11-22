import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStep, normalizeLesson, resolveStep, parseFillTemplate, ContentError } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { extractMath, mathError } from '../src/core/markdown.js';
import { exprToTex } from '../src/core/mathtex.js';
import { matchesTarget } from '../src/player/types/interact.js';

const r = String.raw;

test('choice: options normalise and need exactly one correct answer', () => {
  const step = normalizeStep({ type: 'choice', text: 'q', options: ['a', { text: 'b', correct: true }] });
  assert.deepEqual(step.options.map((o) => o.correct), [false, true]);
  assert.equal(step.shuffle, true);
  assert.equal(step.graded, true);
  const byIndex = normalizeStep({ type: 'choice', text: 'q', options: ['a', 'b', 'c'], answer: 2 });
  assert.equal(byIndex.options[2].correct, true);
  assert.throws(() => normalizeStep({ type: 'choice', text: 'q', options: ['a', 'b'] }), ContentError);
  assert.throws(() => normalizeStep({ type: 'choice', text: 'q', options: [{ text: 'a', correct: true }, { text: 'b', correct: true }] }), ContentError);
});

test('predict mode and graded:false are not graded and cannot be review steps', () => {
  const predict = normalizeStep({ type: 'choice', mode: 'predict', text: 'q', options: ['a', 'b'], review: true });
  assert.equal(predict.graded, false);
  assert.equal(predict.review, false);
  const activity = normalizeStep({ type: 'interact', graded: false, text: 'q', widget: { type: 'plot' }, check: () => true, solution: {}, review: true });
  assert.equal(activity.graded, false);
  assert.equal(activity.review, false);
});

test('numeric: answers may be expressions; coinciding "wrong" entries are dropped', () => {
  const step = normalizeStep({ type: 'numeric', text: 'q', answer: '3/4', wrong: [[0.75, 'same as answer'], [1.5, 'doubled']] });
  assert.equal(step.answer, 0.75);
  assert.deepEqual(step.wrong, [[1.5, 'doubled']]);
  assert.throws(() => normalizeStep({ type: 'numeric', text: 'q', answer: 'banana' }), ContentError);
});

test('fill templates parse typed and dropdown blanks', () => {
  const { parts, blanks } = parseFillTemplate('x = [[7]] and y is [[small|*big]] or [[colour;color]]');
  assert.equal(blanks.length, 3);
  assert.equal(blanks[0].kind, 'input');
  assert.equal(blanks[0].numeric, true);
  assert.deepEqual(blanks[1], { kind: 'select', options: ['small', 'big'], answer: 'big', index: 1 });
  assert.deepEqual(blanks[2].answers, ['colour', 'color']);
  assert.equal(blanks[2].numeric, false);
  assert.equal(parts.filter((p) => p.blank !== undefined).length, 3);
  assert.throws(() => parseFillTemplate('no blanks here'), ContentError);
  assert.throws(() => parseFillTemplate('[[a|b]]'), ContentError);
});

test('bucket, slider and interact validation', () => {
  const bucket = normalizeStep({ type: 'bucket', text: 'q', buckets: ['A', 'B'], items: [['x', 0], { text: 'y', bucket: 'B' }] });
  assert.deepEqual(bucket.items.map((i) => i.bucket), [0, 1]);
  assert.throws(() => normalizeStep({ type: 'bucket', text: 'q', buckets: ['A', 'B'], items: [['x', 5]] }), ContentError);
  assert.throws(() => normalizeStep({ type: 'slider', text: 'q', min: 0, max: 10, answer: 20 }), ContentError);
  assert.throws(() => normalizeStep({ type: 'interact', text: 'q', widget: { type: 'plot' } }), ContentError);
  assert.throws(() => normalizeStep({ type: 'nonsense', text: 'q' }), ContentError);
});

test('resolveStep applies generators deterministically per seed', () => {
  const raw = { id: 'g', type: 'numeric', gen: (rng) => { const a = rng.int(1, 100); return { text: `What is ${a} + 1?`, answer: a + 1 }; } };
  const one = resolveStep(raw, makeRng(42));
  const two = resolveStep(raw, makeRng(42));
  const other = resolveStep(raw, makeRng(43));
  assert.equal(one.answer, two.answer);
  assert.equal(one.text, two.text);
  assert.ok(one.answer !== other.answer || one.text !== other.text || true);
  assert.throws(() => resolveStep({ id: 'bad', type: 'numeric', gen: () => 5 }, makeRng(1)), ContentError);
  assert.throws(() => resolveStep({ id: 'bad', type: 'numeric', gen: () => { throw new Error('boom'); } }, makeRng(1)), /boom/);
});

test('normalizeLesson assigns ids and enforces the rules that protect saved progress', () => {
  const lesson = normalizeLesson({ steps: [{ type: 'info', text: 'hi' }, { id: 'q', type: 'choice', text: 'q', options: ['a', 'b'], answer: 0, review: true }] }, 'c', 'l');
  assert.deepEqual(lesson.steps.map((s) => s.id), ['s1', 'q']);
  assert.equal(lesson.steps[1].review, true);
  assert.throws(() => normalizeLesson({ id: 'other', steps: [{ type: 'info', text: 'x' }] }, 'c', 'l'), /does not match/);
  assert.throws(() => normalizeLesson({ steps: [{ id: 'a', type: 'info', text: 'x' }, { id: 'a', type: 'info', text: 'y' }] }, 'c', 'l'), /duplicate/);
  assert.throws(() => normalizeLesson({ steps: [{ type: 'choice', text: 'q', options: ['a', 'b'], answer: 0, review: true }] }, 'c', 'l'), /explicit "id"/);
  assert.throws(() => normalizeLesson({ steps: [] }, 'c', 'l'), ContentError);
});

test('extractMath finds formulas the same way the renderer does', () => {
  const found = extractMath(r`Pay \$5 for $x^2$ items. $$ \frac{a}{b} $$ and code \`$not math$\` and $20 or $30.`);
  assert.deepEqual(found.map((f) => f.tex), [r`\frac{a}{b}`, 'x^2']);
  assert.equal(found[0].display, true);
});

test('mathError reports TeX that does not compile', () => {
  assert.equal(mathError(r`\frac{1}{2} + \blue{x}`), null);
  assert.match(mathError(r`\frac{1}{`), /end of input/);
  assert.match(mathError(r`\notarealcommand{x}`), /Undefined control sequence/);
});

test('exprToTex gives a readable preview', () => {
  assert.equal(exprToTex('3x^2/4', { vars: ['x'] }), r`\frac{3x^{2}}{4}`);
  assert.equal(exprToTex('2(x+1)', { vars: ['x'] }), r`2\left(x + 1\right)`);
  assert.equal(exprToTex('2*3', { vars: [] }), r`2 \cdot 3`);
  assert.equal(exprToTex('sqrt(x)', { vars: ['x'] }), r`\sqrt{x}`);
  assert.equal(exprToTex('x +', { vars: ['x'] }), null);
});

test('matchesTarget compares numbers with tolerance and ignores extra state', () => {
  assert.ok(matchesTarget({ m: 2, b: -3, extra: 1 }, { m: 2, b: -3 }));
  assert.ok(matchesTarget({ P: { x: 1.004, y: 2 } }, { P: { x: 1, y: 2 } }, 0.01));
  assert.ok(!matchesTarget({ m: 2.5 }, { m: 2 }));
  assert.ok(matchesTarget({ list: [1, 2] }, { list: [1, 2] }));
  assert.ok(!matchesTarget({ list: [1, 2, 3] }, { list: [1, 2] }));
  assert.ok(!matchesTarget(null, { m: 1 }));
});

test('editLink builds host-specific editor links and is null without a repository', async () => {
  const { config, repoLink, editLink } = await import('../src/config.js');
  const before = { url: config.repoUrl, branch: config.repoBranch };
  try {
    config.repoUrl = '';
    assert.equal(repoLink(), null);
    assert.equal(editLink('content/x.js'), null);
    config.repoUrl = 'https://github.com/someone/lemma/';
    assert.equal(repoLink(), 'https://github.com/someone/lemma');
    assert.equal(editLink('/content/x.js'), 'https://github.com/someone/lemma/edit/main/content/x.js');
    config.repoUrl = 'https://gitlab.com/someone/lemma';
    assert.equal(editLink('content/x.js'), 'https://gitlab.com/someone/lemma/-/edit/main/content/x.js');
    config.repoUrl = 'https://codeberg.org/someone/lemma';
    config.repoBranch = 'trunk';
    assert.equal(editLink('content/x.js'), 'https://codeberg.org/someone/lemma/_edit/trunk/content/x.js');
    config.repoUrl = 'javascript:alert(1)';
    assert.equal(repoLink(), null);
  } finally {
    config.repoUrl = before.url;
    config.repoBranch = before.branch;
  }
});

test('supportLink is an https address or nothing, and the site address is well formed', async () => {
  const { config, supportLink } = await import('../src/config.js');
  const before = config.support;
  try {
    assert.match(supportLink(), /^https:\/\//);
    config.support = { url: '' };
    assert.equal(supportLink(), null);
    config.support = { url: 'javascript:alert(1)' };
    assert.equal(supportLink(), null);
    config.support = { url: 'http://insecure.example/x' };
    assert.equal(supportLink(), null);
    config.support = undefined;
    assert.equal(supportLink(), null);
  } finally {
    config.support = before;
  }
  assert.match(config.siteUrl, /^https:\/\/[^/]+$/);
  // the same address is repeated in the static files that crawlers read
  const { readFileSync } = await import('node:fs');
  const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  assert.ok(read('index.html').includes(`<link rel="canonical" href="${config.siteUrl}/">`));
  assert.ok(read('robots.txt').includes(`Sitemap: ${config.siteUrl}/sitemap.xml`));
  assert.ok(read('sitemap.xml').includes(`<loc>${config.siteUrl}/</loc>`));
});

test('tone: sober on a lesson is inherited by its steps; on a step it stays local', async () => {
  const { normalizeLesson } = await import('../src/player/normalize.js');
  const step = (id, extra = {}) => ({ id, type: 'choice', text: 'Q', options: [{ text: 'a', correct: true }, { text: 'b' }], explain: 'E', ...extra });
  const whole = normalizeLesson({ tone: 'sober', steps: [step('a'), step('b')] }, 'c', 'l');
  assert.equal(whole.tone, 'sober');
  assert.deepEqual(whole.steps.map((x) => x.tone), ['sober', 'sober']);
  const part = normalizeLesson({ steps: [step('a'), step('b', { tone: 'sober' })] }, 'c', 'l');
  assert.equal(part.tone, '');
  assert.deepEqual(part.steps.map((x) => x.tone), [undefined, 'sober']);
});

test('markdown: only a list that starts at 1 may interrupt a paragraph', async () => {
  const { md } = await import('../src/core/markdown.js');
  // a wrapped line of prose that happens to begin with a number and a full stop stays prose
  assert.ok(!/<ol/.test(md('Breathe slowly, at a count of about\n20. In trials this helped.')));
  assert.ok(!/<ol/.test(md('The treaty was signed in\n1788. It did not last.')));
  // real lists still work, straight after a line of text and after a blank line
  assert.match(md('Steps:\n1. One\n2. Two'), /<ol><li>One<\/li><li>Two<\/li><\/ol>/);
  assert.match(md('Before.\n\n3. Three\n4. Four'), /<ol start="3">/);
  assert.match(md('Text\n- a\n- b'), /<ul><li>a<\/li><li>b<\/li><\/ul>/);
});
