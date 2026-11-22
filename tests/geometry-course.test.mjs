/**
 * Geometry course: the generated problems are checked against an independent
 * calculation, and against the figure the learner is shown, for many seeds.
 * (tools/validate.mjs checks structure; this checks that the maths is right.)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng.js';
import { resolveStep, normalizeLesson } from '../src/player/normalize.js';
import { angleDeg } from '../src/core/geom.js';
import { triangleFigure, rightTriangleFigure, crossFigure, pol, onArc } from '../content/courses/geometry/helpers.js';

const SEEDS = 150;
const lessons = {};
for (const id of ['angles', 'triangle-sum', 'area-rearranged', 'pythagoras', 'circles-pi', 'similarity']) {
  lessons[id] = (await import(`../content/courses/geometry/lessons/${id}.js`)).default;
}

/** Every variant of one generated step. */
function* variants(lessonId, stepId, n = SEEDS) {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has no step "${stepId}"`);
  for (let k = 0; k < n; k++) yield resolveStep(raw, makeRng(7 + k * 7919), stepId);
}
const numberIn = (text) => { const m = /-?\d+(\.\d+)?/.exec(String(text)); return m ? Number(m[0]) : null; };
const figureOf = (step) => step.figures[0];
/** Numbers written on the angle arcs of a geo figure (ignoring '?', 'x' …). */
const angleLabels = (fig) => fig.shapes.filter((sh) => sh.kind === 'angle' && /\d/.test(sh.label || '')).map((sh) => numberIn(sh.label));
/** Numbers written along the sides of a geo figure, in the order drawn. */
const sideLabels = (fig) => fig.shapes.filter((sh) => sh.kind === 'segment' && sh.label).map((sh) => (/\d/.test(sh.label) ? numberIn(sh.label) : null));
const sum = (list) => list.reduce((t, v) => t + v, 0);
const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} is not ${b}`);

test('every lesson has 12–18 steps, 2–4 review steps and a hands-on step', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.equal(lesson.id, id);
    assert.ok(lesson.steps.length >= 12 && lesson.steps.length <= 18, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review).length;
    assert.ok(reviews >= 2 && reviews <= 4, `${id}: ${reviews} review steps`);
    assert.ok(lesson.steps.some((s) => s.type === 'interact'), `${id}: no interact step`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
  }
});

test('angles: the missing angle completes 180° on a line and 360° round a point', () => {
  for (const step of variants('angles', 'line-missing')) assert.equal(sum(angleLabels(figureOf(step))) + step.answer, 180);
  for (const step of variants('angles', 'around-point')) {
    const labels = angleLabels(figureOf(step));
    assert.equal(sum(labels) + step.answer, 360);
    assert.ok([...labels, step.answer].every((v) => v > 20 && v < 180), 'every angle can be drawn as an arc');
  }
});

test('angles: crossing lines and parallel lines', () => {
  for (const step of variants('angles', 'cross-practice')) {
    const [given] = angleLabels(figureOf(step));
    assert.deepEqual(step.blanks.map((b) => b.numbers[0]), [180 - given, given, 180 - given]);
  }
  for (const step of variants('angles', 'parallel-find')) {
    const fig = figureOf(step);
    const [given] = angleLabels(fig);
    // measure the marked angle on the drawing itself
    const mark = fig.shapes.find((sh) => sh.kind === 'angle' && sh.label === '?');
    const [p, v, q] = mark.pts.map((id) => fig.points[id]);
    close(angleDeg(p, v, q), step.answer, 0.2);
    assert.ok(step.answer === given || step.answer === 180 - given);
  }
  for (const step of variants('angles', 'mixed')) {
    const rights = step.pairs.map((pair) => pair[1]);
    assert.equal(new Set(rights).size, rights.length, 'answers to match are all different');
  }
});

test('triangle-sum: missing angles agree with the figure', () => {
  for (const step of variants('triangle-sum', 'missing')) assert.equal(sum(angleLabels(figureOf(step))) + step.answer, 180);
  for (const step of variants('triangle-sum', 'right-triangle')) assert.equal(sum(angleLabels(figureOf(step))) + step.answer, 90);
  for (const step of variants('triangle-sum', 'isosceles')) {
    const fig = figureOf(step);
    const [known] = angleLabels(fig);
    const unknowns = fig.shapes.filter((sh) => sh.kind === 'angle' && sh.label === 'x').length;
    if (unknowns === 2) assert.equal(known + 2 * step.answer, 180); // top angle known, two equal base angles wanted
    else assert.equal(2 * known + step.answer, 180);                 // one base angle known, top angle wanted
    assert.ok(step.answer > 0 && Number.isInteger(step.answer));
  }
  for (const step of variants('triangle-sum', 'exterior')) assert.equal(step.answer, sum(angleLabels(figureOf(step))));
});

test('triangle-sum: the sorting step puts each set of angles in the right group', () => {
  for (const step of variants('triangle-sum', 'possible')) {
    for (const item of step.items) {
      const total = sum(item.text.split(',').map(numberIn));
      assert.equal(item.bucket === 0, total === 180, item.text);
    }
  }
});

test('helpers: triangles are drawn with the angles they claim', () => {
  for (const angles of [[30, 60, 90], [50, 60, 70], [25, 25, 130], [80, 70, 30], [90, 35, 55], [35, 110, 35]]) {
    const { points: P } = triangleFigure({ angles });
    close(angleDeg(P.B, P.A, P.C), angles[0], 0.15);
    close(angleDeg(P.A, P.B, P.C), angles[1], 0.15);
    close(angleDeg(P.A, P.C, P.B), angles[2], 0.15);
    for (const p of Object.values(P)) assert.ok(p.x > 0.3 && p.x < 9.7 && p.y > 0.3 && p.y < 5.2, 'inside the frame');
  }
  const ext = triangleFigure({ angles: [60, 50, 70], extend: 1.6, outside: '?', letters: true }).points;
  close(angleDeg(ext.A, ext.C, ext.D), 110, 0.3); // outside angle = 60 + 50
  for (const p of Object.values(ext)) assert.ok(p.x > 0.2 && p.x < 9.8 && p.y > 0.2 && p.y < 5.3, 'extension stays inside the frame');
  const right = rightTriangleFigure({ a: 3, b: 4 }).points;
  close(angleDeg(right.A, right.C, right.B), 90, 1e-6);
  const cross = crossFigure({ a: 65, labels: ['65°', 'x', 'y', 'z'] });
  const [first] = cross.shapes.filter((sh) => sh.kind === 'angle');
  close(angleDeg(...first.pts.map((id) => cross.points[id])), 65, 0.1);
});

test('area: answers match the measurements written on the figure', () => {
  for (const step of variants('area-rearranged', 'parallelogram-area')) {
    const fig = figureOf(step);
    assert.equal(step.answer, numberIn(fig.labels.base) * numberIn(fig.labels.height));
    close(Math.hypot(fig.lean, fig.height), numberIn(fig.labels.side), 1e-9); // the slanted side really is that long
    assert.notEqual(numberIn(fig.labels.base), numberIn(fig.labels.height));
    assert.notEqual(numberIn(fig.labels.base), numberIn(fig.labels.side));
  }
  for (const step of variants('area-rearranged', 'triangle-area')) {
    const fig = figureOf(step);
    assert.equal(step.answer, (numberIn(fig.labels.base) * numberIn(fig.labels.height)) / 2);
    assert.ok(Number.isInteger(step.answer));
    assert.ok(fig.lean > 0 && fig.lean < fig.base, 'the height falls inside the base');
  }
  for (const step of variants('area-rearranged', 'trapezium')) {
    const fig = figureOf(step);
    assert.equal(step.answer, ((fig.base + fig.top) * fig.height) / 2);
    assert.ok(fig.lean + fig.top < fig.base + 0.001, 'a proper trapezium');
  }
  for (const step of variants('area-rearranged', 'compare')) {
    const [b, h, tb, th] = step.text.match(/\d+/g).map(Number);
    const want = b * h > (tb * th) / 2 ? 0 : b * h < (tb * th) / 2 ? 1 : 2;
    assert.equal(step.options.findIndex((o) => o.correct), want, step.text);
  }
});

test('pythagoras: sides on the figure satisfy the theorem', () => {
  for (const id of ['hypotenuse', 'leg']) {
    for (const step of variants('pythagoras', id)) {
      const [a, b, c] = sideLabels(figureOf(step)).map((v) => (v == null ? step.answer : v)); // horizontal, vertical, hypotenuse
      assert.equal(a * a + b * b, c * c, `${a}, ${b}, ${c}`);
    }
  }
  for (const step of variants('pythagoras', 'in-the-world')) {
    const nums = step.text.match(/\d+(\.\d+)?/g).map(Number);
    if (step.unit === 'cm') close(step.answer, Math.hypot(nums[0], nums[1]), 0.051);   // screen: width, height (… to 1 decimal place)
    else close(step.answer, Math.sqrt(nums[0] * nums[0] - nums[1] * nums[1]), 1e-9);    // ladder: length, foot
  }
  for (const step of variants('pythagoras', 'converse')) {
    for (const item of step.items) {
      const [a, b, c] = item.text.split(',').map(numberIn).sort((p, q) => p - q);
      assert.equal(item.bucket === 0, a * a + b * b === c * c, item.text);
      assert.ok(a + b > c, 'a real triangle');
    }
  }
});

test('circles: circumference and area', () => {
  for (const step of variants('circles-pi', 'circumference')) {
    const d = numberIn(step.text);
    assert.ok(Math.abs(step.answer - Math.PI * d) <= step.tolerance, 'the calculator answer is accepted');
    assert.ok(Math.abs(step.answer - 3.14 * d) <= 0.051, 'so is the answer with 3.14');
    assert.ok(Math.abs(3 * d - step.answer) > step.tolerance, 'but "three diameters" is not');
  }
  for (const step of variants('circles-pi', 'from-radius')) {
    const r = numberIn(step.text.split('half the diameter.')[1]);
    assert.ok(Math.abs(step.answer - 2 * Math.PI * r) <= step.tolerance);
    assert.ok(Math.abs(Math.PI * r - step.answer) > step.tolerance, 'π × radius is rejected');
  }
  for (const step of variants('circles-pi', 'reverse')) {
    const c = numberIn(step.text);
    assert.ok(Math.abs(c / 3.14 - step.answer) <= 1e-6 && Math.abs(c / Math.PI - step.answer) <= step.tolerance);
  }
  for (const step of variants('circles-pi', 'area')) {
    const r = numberIn(step.text);
    assert.ok(Math.abs(step.answer - Math.PI * r * r) <= step.tolerance);
    assert.ok(Math.abs(step.answer - 3.14 * r * r) <= 0.051);
    assert.ok(Math.abs(2 * Math.PI * r - step.answer) > step.tolerance, 'the circumference formula is rejected (so r is never 2, where the two coincide)');
  }
});

test('circles: comparisons', () => {
  for (const step of variants('circles-pi', 'tube')) {
    const [n, d] = step.text.match(/\d+(\.\d+)?/g).map(Number);
    assert.equal(step.options.findIndex((o) => o.correct), n * d > Math.PI * d ? 0 : 1, step.text);
  }
  for (const step of variants('circles-pi', 'pizza')) {
    const [big, small] = step.text.match(/\d+/g).map(Number);
    const one = Math.PI * (big / 2) ** 2;
    const two = 2 * Math.PI * (small / 2) ** 2;
    assert.ok(Math.abs(one - two) / one > 0.015, 'never too close to call');
    assert.equal(step.options.findIndex((o) => o.correct), one > two ? 0 : 1, step.text);
  }
});

test('similarity: scale factors', () => {
  for (const step of variants('similarity', 'missing-side')) {
    const [a, b, big] = figureOf(step).content.match(/>(\d+(?:\.\d+)?) (?:cm|mm|m)</g).map(numberIn);
    close(step.answer / b, big / a, 1e-9); // same scale factor for both sides
    assert.ok(big / a > 1);
  }
  for (const step of variants('similarity', 'area-scaling')) {
    const [w, area, bigW] = step.text.match(/\d+/g).map(Number); // width, area, enlarged width
    const k = bigW / w;
    assert.ok(Number.isInteger(k) && k >= 2);
    assert.equal(step.answer, area * k * k);
  }
  for (const step of variants('similarity', 'shadows')) {
    const [pole, poleShadow, treeShadow] = step.text.match(/\d+(\.\d+)?/g).map(Number);
    close(step.answer / pole, treeShadow / poleShadow, 1e-9);
  }
  for (const step of variants('similarity', 'similar-or-not')) {
    const [a, b] = step.text.match(/(\d+) × (\d+)/).slice(1).map(Number);
    for (const item of step.items) {
      const [p, q] = item.text.split('×').map((v) => Number(v.trim()));
      const same = Math.abs(p / q - a / b) < 1e-9 || Math.abs(q / p - a / b) < 1e-9;
      assert.equal(item.bucket === 0, same, `${item.text} vs ${a} × ${b}`);
    }
    assert.equal(new Set(step.items.map((it) => it.text)).size, step.items.length, 'no repeated rectangles');
  }
  for (const id of ['giant', 'statue']) {
    for (const step of variants('similarity', id)) {
      const k = numberIn(step.text.split('**')[1]);
      const blanks = step.blanks.map((b) => b.numbers[0]);
      assert.deepEqual(blanks.slice().sort((p, q) => p - q), [k, k * k, k * k * k]);
    }
  }
});

/* ------------------------------------------------------------------------
 * Accuracy review: every step of every lesson, as the learner sees it.
 * Generated steps are resolved with 150 seeds; fixed steps once.
 * --------------------------------------------------------------------- */

const allSteps = Object.entries(lessons).flatMap(([lessonId, lesson]) => (
  normalizeLesson(lesson, 'geometry', lessonId).steps.map((step) => ({ lessonId, step }))));

function* everyStep(n = SEEDS) {
  for (const { lessonId, step } of allSteps) {
    const count = typeof step.gen === 'function' ? n : 1;
    for (let k = 0; k < count; k++) {
      yield { where: `${lessonId}/${step.id} (variant ${k})`, step: resolveStep(step, makeRng(31 + k * 104729), step.id) };
    }
  }
}

/** Everything a learner can read in a resolved step, figure labels and alt text included. */
function wordsOf(step) {
  const out = [];
  const add = (v) => { if (typeof v === 'string' && v) out.push(v); };
  [step.title, step.text, step.explain, step.template, step.prefix, step.unit, step.model].forEach(add);
  step.hints.forEach(add);
  (step.options || []).forEach((o) => { add(o.text); add(o.why); });
  (step.wrong || []).forEach((w) => add(w[1]));
  (step.items || []).forEach((it) => { if (typeof it === 'string') add(it); else { add(it.text); add(it.why); } });
  (step.pairs || []).forEach((pair) => pair.forEach(add));
  (step.buckets || []).forEach(add);
  for (const fig of step.figures) {
    add(fig.alt);
    if (fig.labels && typeof fig.labels === 'object') Object.values(fig.labels).forEach(add);
    (fig.shapes || []).forEach((sh) => add(sh.label));
    if (typeof fig.content === 'string') (fig.content.match(/>[^<>]+</g) || []).forEach((t) => add(t.slice(1, -1)));
  }
  return out;
}

/** The rule the player uses for a numeric answer (numbersMatch in src/player/ui.js). */
const accepted = (step, value) => (step.tolerance != null
  ? Math.abs(value - step.answer) <= step.tolerance + 1e-12
  : Math.abs(value - step.answer) <= 1e-6 * Math.max(1, Math.abs(step.answer)));
const dp = (v, places) => Math.round(v * 10 ** places) / 10 ** places;

test('no text a learner sees contains undefined, NaN, null or float noise', () => {
  let seen = 0;
  for (const { where, step } of everyStep()) {
    for (const text of wordsOf(step)) {
      seen++;
      assert.ok(!/undefined|NaN|Infinity|\[object|\bnull\b/.test(text), `${where}: "${text}"`);
      assert.ok(!/\d\.\d{5,}/.test(text.replace('3.14159', '')), `${where}: float noise in "${text}"`);
    }
  }
  assert.ok(seen > 20000, 'the texts were really read');
});

test('every choice has exactly one correct option; nothing to pick from is repeated', () => {
  for (const { where, step } of everyStep()) {
    const distinct = (list) => assert.equal(new Set(list).size, list.length, `${where}: repeated entry in ${JSON.stringify(list)}`);
    if (step.type === 'choice' || step.type === 'multi') {
      distinct(step.options.map((o) => o.text));
      const right = step.options.filter((o) => o.correct);
      if (step.type === 'choice') assert.equal(right.length, 1, `${where}: ${right.length} correct options`);
      else assert.ok(right.length >= 1 && right.length < step.options.length, where);
      for (const o of right) assert.ok(!o.why, `${where}: the correct option carries "why it is wrong" feedback`);
    }
    if (step.type === 'match') { distinct(step.pairs.map((p) => p[0])); distinct(step.pairs.map((p) => p[1])); }
    if (step.type === 'bucket') distinct(step.items.map((it) => it.text));
    if (step.type === 'order') distinct(step.items);
    if (step.type === 'numeric') {
      assert.ok(Number.isFinite(step.answer) && step.answer > 0, `${where}: answer ${step.answer}`);
      if (typeof step.feedback === 'function') assert.equal(step.feedback(step.answer) || null, null, `${where}: the right answer gets "wrong answer" feedback`);
    }
  }
});

/**
 * Every purely numeric statement in a text ("3.14 × 35 = 109.9", "9² + 12² = 81 + 144 = 225",
 * "\sqrt{676} = 26", "π ≈ 3.14" …) as { left, right, tolerance, source }. Statements with letters
 * in them are skipped. "=" must hold exactly; "≈" to the number of decimals quoted.
 */
const TERM = String.raw`(?:sqrt\([\d.]+\)|\(\d+\/\d+\)|\d+(?:\.\d+)?(?:\*\*[23])?)`;
const EXPR = `${TERM}(?:\\s*[-+*/]\\s*${TERM})*`;
const CHAIN = new RegExp(`${EXPR}(?:\\s*[=≈]\\s*${EXPR})+`, 'g');
function calculations(text) {
  const plain = text.replace(/\*\*/g, '')
    .replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '($1/$2)').replace(/\\sqrt\{([\d.]+)\}/g, 'sqrt($1)')
    .replace(/\\times|×/g, '*').replace(/\\div|÷/g, '/').replace(/\\approx/g, '≈').replace(/−/g, '-')
    .replace(/\^\\circ|°/g, '').replace(/\^2|²/g, '**2').replace(/\^3/g, '**3').replace(/\\pi|π/g, String(Math.PI));
  const value = (expr) => Function('sqrt', `"use strict"; return (${expr});`)(Math.sqrt);
  const out = [];
  for (const m of plain.matchAll(CHAIN)) {
    const parts = m[0].split(/([=≈])/);
    const glued = plain[m.index - 1] || ' ';                          // the character right before the match
    const before = plain.slice(0, m.index).trimEnd().slice(-1);        // the last thing written before it
    const after = plain[m.index + m[0].length] || '';
    let from = 0;
    let to = parts.length;
    if (/[A-Za-z\\^_{]/.test(glued) || /[-+*/]/.test(before)) from = 2;   // the tail of a longer expression with a letter in it
    if (/[A-Za-z\\^_{]/.test(after)) to -= 2;                          // "… = 3.14159\ldots", "… = 2x"
    for (let i = from; i + 2 < to; i += 2) {
      const right = parts[i + 2].trim();
      const decimals = /^\d+(\.\d+)?$/.test(right) ? (right.split('.')[1] || '').length : 9;
      const tolerance = parts[i + 1] === '≈' ? 0.5 * 10 ** -decimals + 1e-9 : 1e-9 * Math.max(1, Math.abs(value(right)));
      out.push({ left: value(parts[i]), right: value(right), tolerance, source: m[0].trim() });
    }
  }
  return out;
}

test('the calculation reader itself works', () => {
  const read = (t) => calculations(t).map((c) => [c.left, c.right]);
  assert.deepEqual(read(String.raw`$c^2 = 24^2 + 10^2 = 576 + 100 = 676$, so $c = \sqrt{676} = 26$ mm.`), [[676, 676], [676, 676], [26, 26]]);
  assert.deepEqual(read(String.raw`Half: $\frac{1}{2} \times 9 \times 6 = 27$ mm². Check it: 7² + 10² = 149, but 12² = 144.`), [[27, 27], [149, 149], [144, 144]]);
  assert.deepEqual(read(String.raw`$a^2 + b^2 = c^2$ and $k \times k = k^2$ and $\pi = 3.14159\ldots$ and $x + 3 = 8$`), []);
  const wrong = calculations(String.raw`Around: $\pi \times 7.2 \approx 22.61$ cm.`)[0];
  assert.ok(Math.abs(wrong.left - wrong.right) > wrong.tolerance, 'π × 7.2 is 22.62 to two places, not 22.61');
  const fine = calculations(String.raw`Around: $3.14 \times 7.2 \approx 22.61$ cm, and $\pi \approx 3.14$.`);
  assert.equal(fine.length, 2);
  for (const c of fine) assert.ok(Math.abs(c.left - c.right) <= c.tolerance);
});

test('every worked calculation quoted in a question, hint, explanation or piece of feedback is true', () => {
  let checked = 0;
  for (const { where, step } of everyStep()) {
    for (const text of wordsOf(step)) {
      for (const c of calculations(text)) {
        checked++;
        assert.ok(Math.abs(c.left - c.right) <= c.tolerance, `${where}: "${c.source}" is false (${c.left} against ${c.right})`);
      }
    }
  }
  assert.ok(checked > 5000, `only ${checked} calculations were found`);
});

test('angles: the mixed-rules matching step, re-solved from its wording', () => {
  for (const step of variants('angles', 'mixed')) {
    for (const [left, right] of step.pairs) {
      const n = left.match(/\d+/g).map(Number);
      const want = /neighbour/.test(left) ? 180 - n[0]
        : /full turn/.test(left) ? 360 - n[0] - n[1]
          : /Vertically opposite|Corresponds/.test(left) ? n[0] : NaN;
      assert.equal(numberIn(right), want, left);
    }
  }
});

test('figures are drawn to match the numbers written on them', () => {
  const drawn = (fig, sh) => angleDeg(...sh.pts.map((id) => fig.points[id]));
  const geoSteps = [
    ['angles', 'line-missing'], ['angles', 'cross-practice'], ['angles', 'around-point'], ['angles', 'parallel-find'],
    ['triangle-sum', 'missing'], ['triangle-sum', 'right-triangle'], ['triangle-sum', 'isosceles'], ['triangle-sum', 'exterior'],
  ];
  for (const [lessonId, stepId] of geoSteps) {
    for (const step of variants(lessonId, stepId)) {
      const fig = figureOf(step);
      const arcs = fig.shapes.filter((sh) => sh.kind === 'angle');
      assert.ok(arcs.length >= 2, `${stepId}: the figure marks its angles`);
      for (const sh of arcs) {
        if (/\d/.test(sh.label)) close(drawn(fig, sh), numberIn(sh.label), 0.3);        // a labelled angle really is that size
        else if (sh.label === '?' || (sh.label === 'x' && stepId === 'isosceles')) close(drawn(fig, sh), step.answer, 0.3);   // and so is the unknown
      }
      for (const sh of fig.shapes.filter((s) => s.kind === 'right')) close(drawn(fig, sh), 90, 0.3);
      if (stepId === 'cross-practice') {
        const size = Object.fromEntries(arcs.map((sh) => [sh.label, drawn(fig, sh)]));
        step.blanks.forEach((blank, i) => close(size['xyz'[i]], blank.numbers[0], 0.3));
      }
      if (stepId === 'line-missing') close(sum(arcs.map((sh) => drawn(fig, sh))), 180, 0.3);
      if (stepId === 'around-point') close(sum(arcs.map((sh) => drawn(fig, sh))), 360, 0.3);
      if (stepId === 'parallel-find') {
        const P = fig.points;
        assert.ok(P.Xleft.y === P.Xright.y && P.Dleft.y === P.Dright.y, 'the two blue lines are parallel');
      }
      if (stepId === 'isosceles') {
        const P = fig.points;
        const equal = fig.shapes.filter((sh) => sh.kind === 'segment' && sh.label);
        assert.equal(equal.length, 2);
        assert.equal(equal[0].label, equal[1].label, 'the two marked sides are given the same length');
        const [len1, len2] = equal.map((sh) => Math.hypot(P[sh.pts[0]].x - P[sh.pts[1]].x, P[sh.pts[0]].y - P[sh.pts[1]].y));
        close(len1, len2, 0.02);
        close(angleDeg(P.B, P.A, P.C), angleDeg(P.A, P.B, P.C), 0.3);   // … and they face the two bottom angles
      }
      if (stepId === 'exterior') {
        const { B, C, D } = fig.points;
        close((C.x - B.x) * (D.y - B.y) - (C.y - B.y) * (D.x - B.x), 0, 0.02);          // B, C and D are in line
        assert.ok((D.x - C.x) * (C.x - B.x) + (D.y - C.y) * (C.y - B.y) > 0, 'D is beyond C');
      }
    }
  }
  // right-angled triangles: the legs are drawn in the proportion of their labels, and the hypotenuse is the longest side
  for (const id of ['hypotenuse', 'leg']) {
    for (const step of variants('pythagoras', id)) {
      const fig = figureOf(step);
      const [a, b, c] = sideLabels(fig).map((v) => (v == null ? step.answer : v));
      const P = fig.points;
      close(Math.abs(P.A.x - P.C.x) / Math.abs(P.B.y - P.C.y), a / b, 0.01);
      assert.ok(c > a && c > b, `${a}, ${b}, ${c}`);
      const labels = fig.shapes.filter((sh) => sh.kind === 'segment').map((sh) => sh.label);
      if (id === 'hypotenuse') assert.equal(labels[2], '?');
      else assert.ok(labels[2] !== '?' && labels.filter((l) => l === '?').length === 1, 'the hypotenuse is given, one leg is asked for');
    }
  }
  // similar triangles: both are drawn to scale
  for (const step of variants('similarity', 'missing-side')) {
    const svg = figureOf(step).content;
    const [a, b, big] = svg.match(/>(\d+(?:\.\d+)?) (?:cm|mm|m)</g).map(numberIn);
    const [small, large] = [...svg.matchAll(/points="([^"]*)"/g)].map((m) => m[1].split(' ').map((p) => p.split(',').map(Number)))
      .map((p) => ({ w: Math.abs(p[1][0] - p[0][0]), h: Math.abs(p[2][1] - p[0][1]) }));
    close(small.w / small.h, a / b, 0.01);
    close(large.w / small.w, big / a, 0.01);
    close(large.h / small.h, big / a, 0.01);
  }
  // area figures: the outline that is drawn has the area that is asked for
  const outlineArea = (pts) => Math.abs(sum(pts.map(([x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return x * y2 - x2 * y; }))) / 2;
  for (const step of variants('area-rearranged', 'parallelogram-area')) {
    const f = figureOf(step);
    assert.equal(outlineArea([[0, 0], [f.base, 0], [f.base + f.lean, f.height], [f.lean, f.height]]), step.answer);
    assert.ok(f.lean <= f.base, 'the dashed height meets the base');
  }
  for (const step of variants('area-rearranged', 'triangle-area')) {
    const f = figureOf(step);
    assert.equal(outlineArea([[0, 0], [f.base, 0], [f.lean, f.height]]), step.answer);
  }
  for (const step of variants('area-rearranged', 'trapezium')) {
    const f = figureOf(step);
    assert.equal(outlineArea([[0, 0], [f.base, 0], [f.lean + f.top, f.height], [f.lean, f.height]]), step.answer);
  }
});

test('circles: answers from 3.14 and from the π key are both accepted, however sensibly they are rounded', () => {
  const kinds = [
    // step, how to read the given length, what multiplies π, tempting wrong answers
    ['circumference', (t) => numberIn(t), (d) => d, (d) => [3 * d, 2 * Math.PI * d, (Math.PI * d) / 2]],
    ['from-radius', (t) => numberIn(t.split('half the diameter.')[1]), (r) => 2 * r, (r) => [Math.PI * r, Math.PI * r * r, 6 * r]],
    ['area', (t) => numberIn(t), (r) => r * r, (r) => [2 * Math.PI * r, 3 * r * r, 4 * Math.PI * r * r]],
  ];
  for (const [id, read, times, slips] of kinds) {
    for (const step of variants('circles-pi', id)) {
      const given = read(step.text);
      const m = times(given);
      // 3.14 × m, rounded half up to 1 decimal place, in whole-number arithmetic (m has at most two decimals)
      const tenThousandths = 314 * Math.round(m * 100);
      const key = Math.floor((tenThousandths + 500) / 1000) / 10;
      close(step.answer, key, 1e-9);
      const rough = tenThousandths / 10000;
      const truth = Math.PI * m;
      for (const good of [rough, dp(rough, 2), key, truth, dp(truth, 1), dp(truth, 2), dp(truth, 3)]) {
        assert.ok(accepted(step, good), `${id}, given ${given}: ${good} should be accepted (key ${step.answer} ± ${step.tolerance})`);
      }
      for (const slip of slips(given)) {
        assert.ok(!accepted(step, slip), `${id}, given ${given}: ${slip} should be rejected (key ${step.answer} ± ${step.tolerance})`);
      }
      assert.ok(step.tolerance <= 0.6 && step.tolerance <= 0.02 * step.answer, `${id}, given ${given}: tolerance ${step.tolerance}`);
    }
  }
  for (const step of variants('circles-pi', 'reverse')) {
    const c = numberIn(step.text);
    for (const good of [c / 3.14, c / Math.PI, dp(c / Math.PI, 1), Math.round(c / Math.PI)]) assert.ok(accepted(step, good), `${good} for ${step.text}`);
    for (const slip of [c / 3.14 / 2, c / 3, c * 3.14]) assert.ok(!accepted(step, slip), `${slip} for ${step.text}`);
  }
});

test('circles: the sums quoted for the tube and the pizzas agree with the option marked correct', () => {
  for (const step of variants('circles-pi', 'tube')) {
    const [height, around] = step.explain.match(/(?:=|\\approx) [\d.]+\$ cm/g).map(numberIn);
    assert.equal(step.options.findIndex((o) => o.correct), height > around ? 0 : 1, step.explain);
    assert.ok(Math.abs(height - around) > 0.5, 'never too close to call');
  }
  for (const step of variants('circles-pi', 'pizza')) {
    const [one, two] = step.explain.match(/\\approx (\d+)\$ cm²/g).map(numberIn);
    assert.equal(step.options.findIndex((o) => o.correct), one > two ? 0 : 1, step.explain);
  }
});

test('pythagoras: a diagonal rounded as asked is accepted, a careless one is not', () => {
  for (const step of variants('pythagoras', 'in-the-world')) {
    const n = step.text.match(/\d+(\.\d+)?/g).map(Number);
    if (step.unit === 'cm') {
      const d = Math.hypot(n[0], n[1]);
      close(step.answer, dp(d, 1), 1e-9);
      for (const good of [d, dp(d, 1), dp(d, 2), dp(d, 3)]) assert.ok(accepted(step, good), `${good} for ${step.text}`);
      for (const slip of [Math.round(d) === dp(d, 1) ? -1 : Math.round(d), n[0] + n[1], n[0] * n[0] + n[1] * n[1]]) assert.ok(!accepted(step, slip), `${slip} for ${step.text}`);
    } else {
      assert.ok(n[0] > n[1], 'the ladder (hypotenuse) is longer than the distance from the wall');
      assert.ok(step.answer < n[0], 'and longer than the height it reaches');
      for (const slip of [n[0] - n[1], Math.hypot(n[0], n[1])]) assert.ok(!accepted(step, slip), `${slip} for ${step.text}`);
    }
  }
});

test('hands-on steps accept exactly what their instruction asks for', () => {
  const stepOf = (lessonId, stepId) => lessons[lessonId].steps.find((s) => s.id === stepId);
  const passes = (step, state) => step.check(state) === true;

  // "Paint a rectangle that covers exactly 12 squares" on the 5 × 8 grid
  const count = stepOf('area-rearranged', 'count');
  const block = (row, col, tall, wide) => {
    const on = [];
    for (let r = row; r < row + tall; r++) for (let c = col; c < col + wide; c++) on.push(r * 8 + c);
    return { on, count: on.length };
  };
  for (const [tall, wide] of [[3, 4], [4, 3], [2, 6]]) {
    for (let row = 0; row + tall <= 5; row++) for (let col = 0; col + wide <= 8; col++) assert.ok(passes(count, block(row, col, tall, wide)), `${tall} × ${wide} at ${row}, ${col}`);
  }
  assert.ok(!passes(count, { on: [0, 1, 2, 3, 4, 5, 6, 7, 8, 16, 24, 32], count: 12 }), 'an L of 12 squares is not a rectangle');
  assert.ok(!passes(count, { on: [0, 1, 2, 3, 4, 5, 16, 17, 18, 19, 20, 21], count: 12 }), 'two separate rows are not a rectangle');
  assert.ok(!passes(count, block(0, 0, 3, 5)) && !passes(count, block(0, 0, 2, 5)));
  assert.ok(passes(count, { ...count.solution, count: count.solution.on.length }));

  // "Drag C to make a triangle with an area of exactly 15" on a base of 6: any point 5 above the base
  const apex = stepOf('area-rearranged', 'apex');
  for (let x = 0; x <= 10; x++) for (let y = 2; y <= 7; y++) assert.equal(passes(apex, { C: { x, y } }), y === 6, `C at ${x}, ${y}`);
  assert.ok(passes(apex, apex.solution));

  // "Make the two smaller squares 9 and 16"
  const squares = stepOf('pythagoras', 'explore');
  for (let a = 1; a <= 4; a++) for (let b = 1; b <= 4; b++) assert.equal(passes(squares, { A: { x: a, y: 0 }, B: { x: 0, y: b } }), a * b === 12, `legs ${a}, ${b}`);

  // swing a ray to 60° / turn a line to 70°: the target can be reached with the 5° snapping, and only there
  const cases = [['explore-line', { x: 5, y: 1.1 }, 3.2, onArc({ x: 5, y: 1.1 }, 3.2), 60], ['explore-cross', { x: 5, y: 2.6 }, 2.3, onArc({ x: 5, y: 2.6 }, 2.3, 20, 160), 70]];
  for (const [id, O, radius, constrain, target] of cases) {
    const step = stepOf('angles', id);
    assert.ok(passes(step, step.solution));
    for (let a = 0; a <= 180; a += 1) {
      const P = constrain(pol(O, radius, a));
      const turned = angleDeg({ x: O.x + 1, y: O.y }, O, P);
      close(turned, Math.round(turned / 5) * 5, 0.05);               // the ray snaps to whole multiples of 5°
      assert.equal(passes(step, { P }), Math.abs(a - target) < 2.5, `${id}: dragged towards ${a}°`);
    }
  }

  // scale factors
  const zoom = stepOf('similarity', 'explore');
  const cube = stepOf('similarity', 'cube');
  for (const k of [1, 2, 3, 4]) {
    assert.equal(passes(zoom, { k, areaFactor: k * k }), k * k === 4);
    assert.equal(passes(cube, { k, cubes: k ** 3 }), k ** 3 === 27);
  }
});

/* ------------------------------------------------------------------------
 * Teach before you ask: a graded step may only ask for what the lesson has
 * already shown. The validator checks the shape; these pin the substance.
 * --------------------------------------------------------------------- */

// teaching screens added when the course was revised to teach first
const TEACHING = {
  angles: ['teach-degrees', 'teach-opposite', 'teach-around-point', 'teach-corresponding'],
  'triangle-sum': ['example-missing', 'teach-isosceles'],
  'area-rearranged': ['example-parallelogram', 'teach-triangle-area'],
  pythagoras: ['example-hypotenuse', 'example-leg'],
  'circles-pi': ['teach-circle-parts', 'teach-radius', 'teach-circle-area'],
  similarity: ['teach-scale-rule', 'teach-similar', 'teach-same-shape', 'teach-volume'],
};

// [lesson, teaching screen, the first step that needs it, what the screen must say]
const SERVES = [
  ['angles', 'teach-degrees', 'explore-line', ['angle', 'degrees', '360°', '180°', '90°', 'right angle']],
  ['angles', 'half-turn', 'line-missing', ['straight line', '180°', ':::example']],
  ['angles', 'teach-opposite', 'cross-practice', ['vertically opposite', 'equal', 'neighbour', ':::example']],
  ['angles', 'teach-around-point', 'around-point', ['around a point', '360°', ':::example']],
  ['angles', 'teach-corresponding', 'parallel-find', ['corresponding', 'parallel', 'same position', ':::example']],
  ['triangle-sum', 'why', 'missing', ['180°']],
  ['triangle-sum', 'example-missing', 'missing', ['180°', 'right angle', ':::example']],
  ['triangle-sum', 'teach-isosceles', 'isosceles', ['isosceles', 'equal sides', ':::example']],
  ['area-rearranged', 'base-height', 'parallelogram-area', ['base × height', 'slanted side']],
  ['area-rearranged', 'example-parallelogram', 'parallelogram-area', ['base', 'height', 'slanted side', 'm²', ':::example']],
  ['area-rearranged', 'teach-triangle-area', 'triangle-area', ['\\frac{1}{2}', 'base', 'height', ':::example']],
  ['pythagoras', 'theorem', 'hypotenuse', ['hypotenuse', 'a^2 + b^2 = c^2', 'squared']],
  ['pythagoras', 'example-hypotenuse', 'hypotenuse', ['square root', '\\sqrt', ':::example']],
  ['pythagoras', 'example-leg', 'leg', ['hypotenuse', 'subtract', ':::example']],
  ['circles-pi', 'teach-circle-parts', 'roll', ['centre', 'radius', 'diameter', 'circumference', 'twice the radius']],
  ['circles-pi', 'pi', 'order', ['circumference', 'diameter', '3.14', ':::example']],
  ['circles-pi', 'teach-radius', 'from-radius', ['radius', 'Double', 'diameter', ':::example']],
  ['circles-pi', 'teach-circle-area', 'area', ['\\pi r^2', 'radius', 'halve', ':::example']],
  ['similarity', 'teach-scale-rule', 'area-scaling', ['scale factor', 'k^2', ':::example']],
  ['similarity', 'teach-similar', 'missing-side', ['similar', 'scale factor', '1.5', ':::example']],
  ['similarity', 'teach-same-shape', 'similar-or-not', ['similar', 'multiplies both sides', '0.5', 'added']],
  ['similarity', 'teach-volume', 'giant', ['volume', 'area', 'k^3', ':::example']],
];

test('teach before you ask: shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = normalizeLesson(lesson, 'geometry', id).steps.map((step) => resolveStep(step, makeRng(1), step.id));   // as the player sees them
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    assert.ok(roles.filter((kind) => kind === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const stepId of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === stepId);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${stepId}" exists`);
      assert.ok(steps[at].figures.length >= 1 && steps[at].figures[0].alt, `${id}/${stepId} has a figure with alt text`);
      assert.ok(roles.indexOf('graded', at + 1) > 0, `${id}/${stepId} is followed by a question`);
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
    for (const term of terms) assert.ok(screen.text.includes(term), `${lessonId}/${teach} should mention "${term}" (needed by "${ask}")`);
  }
  // every rule named in the mixed matching step of lesson 1 is on a teaching screen above it
  const angles = lessons.angles.steps;
  const taught = angles.slice(0, angles.findIndex((s) => s.id === 'mixed')).filter((s) => s.type === 'info').map((s) => s.text).join('\n');
  for (const step of variants('angles', 'mixed', 20)) {
    for (const [left] of step.pairs) {
      const rule = ['neighbour', 'straight line', 'Vertically opposite', 'full turn', 'Corresponds', 'parallel'].filter((word) => left.includes(word));
      assert.ok(rule.length >= 1, `a rule is named in "${left}"`);
      for (const word of rule) assert.ok(taught.toLowerCase().includes(word.toLowerCase()), `"${word}" is taught before the mixed step`);
    }
  }
  // a rule is stated on a teaching screen, not first in the explanation of the step that discovers it
  for (const [lessonId, stepId, rule] of [
    ['angles', 'why-opposite', 'vertically opposite'], ['angles', 'full-turn', 'around a point'], ['angles', 'parallel-slide', 'corresponding'],
    ['area-rearranged', 'triangle-double', ':::key'], ['circles-pi', 'rectangle', ':::key'], ['similarity', 'pattern', ':::key'], ['similarity', 'cube', ':::key'],
  ]) {
    const step = lessons[lessonId].steps.find((s) => s.id === stepId);
    assert.ok(!String(step.explain).includes(rule), `${lessonId}/${stepId}: "${rule}" belongs on the teaching screen that follows, not in the explanation`);
  }
});

test('teach before you ask: worked examples use numbers their practice step cannot produce', () => {
  const never = (lessonId, stepId, same) => {
    for (const step of variants(lessonId, stepId)) assert.ok(!same(step), `${lessonId}/${stepId} can repeat the worked example: ${step.text}`);
  };
  const angles = (step) => angleLabels(figureOf(step));
  never('angles', 'line-missing', (s) => (angles(s).length === 1                                      // two angles on the line: one is given
    ? angles(s)[0] === 85 || angles(s)[0] === 95
    : angles(s).includes(115)));
  never('angles', 'cross-practice', (s) => angles(s).includes(80) || angles(s).includes(100));
  never('angles', 'around-point', (s) => angles(s).includes(90) && angles(s).includes(150));
  never('angles', 'parallel-find', (s) => angles(s).includes(72) || angles(s).includes(60));          // 60° is the angle of the sliding exploration
  never('triangle-sum', 'missing', (s) => angles(s).includes(25));
  never('triangle-sum', 'isosceles', (s) => angles(s).includes(140) || s.answer === 140);
  never('area-rearranged', 'parallelogram-area', (s) => numberIn(figureOf(s).labels.base) === 20 || numberIn(figureOf(s).labels.height) === 15);
  never('area-rearranged', 'triangle-area', (s) => numberIn(figureOf(s).labels.base) === 14);
  never('pythagoras', 'hypotenuse', (s) => sideLabels(figureOf(s)).includes(30) || sideLabels(figureOf(s)).includes(40));
  never('pythagoras', 'leg', (s) => sideLabels(figureOf(s)).includes(41) || sideLabels(figureOf(s)).includes(40));
  never('circles-pi', 'circumference', (s) => numberIn(s.text) === 9);
  never('circles-pi', 'from-radius', (s) => numberIn(s.text.split('half the diameter.')[1]) === 20);
  never('circles-pi', 'area', (s) => numberIn(s.text) === 30);
  never('similarity', 'area-scaling', (s) => { const [w, , bigW] = s.text.match(/\d+/g).map(Number); return bigW / w === 6; });
  never('similarity', 'missing-side', (s) => /> ?7 (cm|mm|m)</.test(figureOf(s).content) || />21 (cm|mm|m)</.test(figureOf(s).content));
  never('similarity', 'similar-or-not', (s) => s.text.includes('2 × 4'));
  for (const id of ['giant', 'statue']) never('similarity', id, (s) => numberIn(s.text.split('**')[1]) === 6);
});
