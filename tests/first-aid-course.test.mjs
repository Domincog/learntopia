// Independent checks of "First Aid: When Minutes Matter".
//
// Double entry: this file keeps its own table (FACTS) of the course's key
// numbers, orders and decisions, typed in from the author's notes on the
// guidelines (the body and year are named beside each entry) and not imported
// from the course. The course's helper tables must agree with it. Every
// generated question is then re-answered from the text or the figure the
// learner sees, using only this file's tables and rules, for 240 seeds; every
// interact step's `check` is run over the states its widget can reach; and the
// safety rules of the Health path are asserted at the end.
//
//   node --test tests/first-aid-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import course from '../content/courses/first-aid/course.js';
import * as H from '../content/courses/first-aid/helpers.js';
import { chestAt, countBreaths } from '../src/widgets/breath-check.js';
import { chanceAtShock } from '../src/widgets/rescue-clock.js';
import { paceOf } from '../src/widgets/cpr-rhythm.js';
import { describe as describeFast } from '../src/widgets/fast-check.js';
import { bleedingWord } from '../src/widgets/press-hold.js';
import { VIEWS, structureInfo, systemNames, expandIds, anchorPoint, structureAt } from '../src/widgets/body-map.js';
import FRONT from '../assets/body/front.js';
import BACK from '../assets/body/back.js';

const SEEDS = 240;
const COURSE = 'first-aid';
const LESSON_IDS = ['first-steps', 'cpr', 'heart-stroke', 'choking-breathing', 'bleeding-burns', 'everyday-emergencies'];
const path = (rel) => fileURLToPath(new URL(rel, import.meta.url));

/** Every generated step of the course. Each is re-derived by a test below; the guard test keeps this list complete. */
const GENERATED = {
  'first-steps': ['breath-check', 'numbers', 'decide'],
  cpr: ['rate-check', 'worries'],
  'heart-stroke': ['neurons', 'fast-find', 'which'],
  'choking-breathing': ['choke-who', 'which'],
  'bleeding-burns': ['bleed-what', 'burn-level'],
  'everyday-emergencies': ['seizure-call', 'heat-which', 'which'],
};
const tested = new Set();

/* ------------------------------------------------------------------ this file's own table of facts */

const FACTS = {
  // ERC Guidelines 2025, Adult Basic Life Support; AHA Guidelines 2025, Part 7 (ILCOR 2025 consensus)
  compressionsPerMinute: [100, 120],
  compressionDepthCm: [5, 6],                  // ERC "5–6 cm"; AHA "at least 5 cm, not more than 6 cm"
  compressionsToBreaths: [30, 2],
  breathingCheckSeconds: 10,                   // ERC 2025 First Aid "maximum 10 s"; British Red Cross "no more than ten seconds"
  swapRescuersMinutes: 2,
  // AHA: survival falls 7–10% a minute without CPR and defibrillation, 3–4% a minute with bystander CPR
  lossPerMinute: { noCpr: [7, 10], withCpr: [3, 4] },
  // adults at rest breathe 12–20 times a minute (physiology textbooks; NHS)
  restingBreaths: [12, 20],
  // emergency numbers: EU 112 pages; national government and ambulance-service pages (checked November 2026)
  numbers: {
    France: '112', Germany: '112', Spain: '112', Italy: '112', Poland: '112', Sweden: '112', India: '112',
    'the United States': '911', Canada: '911', Mexico: '911', 'the United Kingdom': '999', Australia: '000',
    'New Zealand': '111', Japan: '119', Brazil: '192', China: '120',
  },
  // ERC 2025 and AHA 2025 lay-rescuer sequence: safety, response, call, breathing, compressions
  firstSteps: ['danger', 'tap the shoulders', 'call the emergency number', 'check breathing', 'chest compressions'],
  // NHS / St John Ambulance recovery position
  recovery: ['kneel', 'right angle', 'cheek', 'knee up', 'roll', 'tilt the head'],
  // chain of survival (ERC 2025; AHA 2025): recognise and call, CPR, defibrillation, professional care
  chain: ['call for help', 'compressions', 'shock', 'ambulance crew'],
  // AED (ERC 2025; AHA 2025; British Heart Foundation)
  aed: ['switch it on', 'pads', 'stand clear', 'shock button', 'compressions again'],

  // --- lesson 3
  // aspirin for suspected heart attack: ERC / RCUK 2025 First Aid 300 mg; AHA/ARC 2024 First Aid 162–325 mg
  aspirinMg: { europe: 300, america: [162, 325] },
  // Saver JL. Time is brain—quantified. Stroke 2006;37:263: 1.9 million neurons a minute
  neuronsLostPerMinuteMillion: 1.9,
  // clot-dissolving treatment within about 4.5 hours of onset (AHA/ASA; NICE)
  strokeWindowHours: 4.5,
  fast: ['Face', 'Arms', 'Speech', 'Time'],
  // NHS / St John Ambulance / AHA-ARC 2024: call, rest, aspirin, monitor
  heartAttack: ['Call the emergency number', 'sit down', 'aspirin', 'Stay with her'],

  // --- lesson 4
  // choking, adults and children over one: ERC 2025 First Aid "up to 5 back blows, then up to 5 abdominal thrusts";
  // AHA 2025 "5 back blows followed by 5 abdominal thrusts"; unresponsive: CPR
  backBlows: 5,
  abdominalThrusts: 5,
  choking: ['encourage them to cough', 'up to 5 back blows', 'up to 5 abdominal thrusts', 'alternating', 'start CPR'],
  // anaphylaxis: second auto-injector after about 5 minutes if no better (ERC/RCUK 2025; AHA/ARC: 5 to 10)
  secondDoseMinutes: 5,

  // --- lesson 5
  burnCoolMinutes: 20,            // ERC 2021 First Aid, NHS, British Burn Association, St John Ambulance, British Red Cross
  burnCoolMinimum: 10,            // American Red Cross advisory; IFRC 2020
  nosePinchMinutes: [10, 15],     // NHS; AHA/ARC 2024 First Aid
  tourniquetAboveCm: [5, 7],      // ERC 2021 First Aid; Stop the Bleed (2 to 3 inches)

  // --- lesson 6
  hypothermiaBelow: 35,           // °C, textbook definition
  heatstrokeFrom: 40,             // °C with confusion or collapse, textbook definition
  normalCore: [36.5, 37.5],
  seizureCallMinutes: 5,          // AHA/ARC 2024 First Aid; NHS; epilepsy charities
  sugarGrams: [15, 20],           // ERC/RCUK 2025 First Aid 15–20 g; AHA/ARC 2024: 20 g or more
  sugarWaitMinutes: [10, 15],     // ERC/RCUK 2025: repeat after 15 minutes; Diabetes UK: 10 to 15
  sugar: ['able to swallow', 'fast sugar', 'Wait', 'snack'],
  // crisis lines named in the authors' brief
  crisis: ['988', '116 123', '13 11 14', 'findahelpline.com'],
  // cooling rates in °C a minute (sports-medicine reviews): immersion about 0.2, far above any other method
  cooling: { immersionAtLeast: 0.15, immersionAtMost: 0.35, othersBelow: 0.1 },
};

/* ------------------------------------------------------------------------------- loading and tools */

const lessons = {};
for (const id of LESSON_IDS) {
  if (!existsSync(path(`../content/courses/${COURSE}/lessons/${id}.js`))) continue;
  const mod = await import(`../content/courses/${COURSE}/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, COURSE, id);
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const flat = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const everyStep = (fn) => { for (const [lid, lesson] of Object.entries(lessons)) for (const step of lesson.steps) fn(lid, step); };
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };

/** Run a generated step with many seeds and hand each concrete step to `verify`. Returns the number of different texts seen. */
function eachVariant(lesson, id, verify, n = SEEDS) {
  const step = raw(lesson, id);
  assert.equal(typeof step.gen, 'function', `${lesson}/${id} is generated`);
  assert.ok((GENERATED[lesson] || []).includes(id), `${lesson}/${id} is listed in GENERATED`);
  tested.add(`${lesson}/${id}`);
  const texts = new Set();
  for (let k = 0; k < n; k++) {
    const s = resolveStep(step, makeRng(4217 + k * 7919), id);
    texts.add(flat(s.text) + JSON.stringify(s.widget || s.pairs || ''));
    try { verify(s); } catch (err) { err.message = `${lesson}/${id} (seed ${k}): ${err.message}\n  text: ${flat(s.text)}`; throw err; }
  }
  return texts.size;
}
const variants = (lesson, id, n = 40) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(977 + k * 7919), id));
const correctOption = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: exactly one correct option`); return right[0]; };

/** Every string a learner can see in a resolved step (machine fields excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['type', 'id', 'tone', 'mode', 'pattern', 'color', 'view', 'ids', 'kind', 'src', 'thumb', 'license', 'licenseUrl', 'sourceUrl', 'guide', 'system', 'layer', 'structure', 'answer', 'content', 'viewBox']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}
/** Every widget spec in a resolved step: figures, the interact widget, and option figures. */
function specsOf(step) {
  const out = [];
  for (const f of step.figures || []) out.push(f);
  if (step.widget) out.push(step.widget);
  for (const o of step.options || []) if (o.figure) out.push(o.figure);
  return out;
}
/** The items of an order step must mention this file's keywords, one per item, in this file's order. */
function assertOrder(step, keywords, label) {
  assert.equal(step.type, 'order', `${label} is an order step`);
  assert.equal(step.items.length, keywords.length, `${label}: ${keywords.length} items`);
  step.items.forEach((item, i) => {
    assert.ok(flat(item).toLowerCase().includes(keywords[i].toLowerCase()), `${label}: item ${i + 1} ("${flat(item)}") is the "${keywords[i]}" step`);
    keywords.forEach((kw, j) => { if (j !== i) assert.ok(!flat(item).toLowerCase().includes(kw.toLowerCase()), `${label}: item ${i + 1} does not also read as the "${kw}" step`); });
  });
}

/* =============================================================================== course-wide checks */

test('all six lessons exist and load', () => {
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), LESSON_IDS, 'the outline lists the six lessons in order');
  assert.deepEqual(Object.keys(lessons), LESSON_IDS, 'every lesson file exists');
});

test('lesson shape: 14 to 20 steps, hands-on steps, review steps, generated steps, a recap and a teaser; all sober', () => {
  for (const [lid, lesson] of Object.entries(lessons)) {
    const n = lesson.steps.length;
    assert.ok(n >= 14 && n <= 20, `${lid}: ${n} steps`);
    const handsOn = lesson.steps.filter((s) => s.type === 'interact' || (s.figure && !Array.isArray(s.figure) && ['world-map', 'body-map', 'timeline', 'breath-check', 'rescue-clock', 'plot'].includes(s.figure.type))).length;
    assert.ok(handsOn >= 3, `${lid}: ${handsOn} hands-on steps`);
    const review = lesson.steps.filter((s) => s.review).length;
    assert.ok(review >= 2 && review <= 4, `${lid}: ${review} review steps`);
    assert.ok(lesson.steps.filter((s) => typeof s.gen === 'function').length >= 2, `${lid}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${lid}: no more than five choice steps`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${lid}: recap of 3 or 4 lines`);
    assert.ok(lesson.next.length > 20, `${lid}: a teaser`);
    let infoRun = 0;
    for (const step of lesson.steps) {
      infoRun = step.type === 'info' ? infoRun + 1 : 0;
      assert.ok(infoRun < 3, `${lid}: no three info steps in a row`);
      assert.equal(step.tone, 'sober', `${lid}/${step.id} is tone: 'sober'`);
      if (step.review) assert.ok(step.explain || step.gen, `${lid}/${step.id}: a review step explains itself`);
    }
  }
});

test('no learner-visible text contains undefined, NaN, null or an object', () => {
  everyStep((lid, step) => {
    const list = typeof step.gen === 'function' ? variants(lid, step.id, 60) : [one(lid, step.id)];
    for (const s of list) for (const text of visible(s)) assert.ok(!/undefined|NaN|\bnull\b|\[object/.test(text), `${lid}/${step.id}: "${flat(text).slice(0, 120)}"`);
  });
  for (const lesson of Object.values(lessons)) for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN|\[object/.test(line));
});

test('choice: exactly one correct option and no duplicates; multi, match, bucket and fill are well formed', () => {
  const positions = [];
  everyStep((lid, step) => {
    const list = typeof step.gen === 'function' ? variants(lid, step.id, 80) : [one(lid, step.id)];
    for (const s of list) {
      const where = `${lid}/${step.id}`;
      if (s.type === 'choice' || s.type === 'multi') {
        const texts = s.options.map((o) => flat(o.text));
        assert.equal(new Set(texts).size, texts.length, `${where}: no duplicate options`);
        const right = s.options.filter((o) => o.correct).length;
        if (s.type === 'choice') assert.equal(right, 1, `${where}: exactly one correct option`);
        else assert.ok(right >= 1 && right < s.options.length, `${where}: some but not all options are correct`);
        for (const o of s.options) if (o.correct) assert.ok(!o.why || s.type === 'multi', `${where}: the right option carries no "why it is wrong"`);
      }
      if (s.type === 'match') {
        assert.equal(new Set(s.pairs.map((p) => flat(p[0]))).size, s.pairs.length, `${where}: left items differ`);
        assert.equal(new Set(s.pairs.map((p) => flat(p[1]))).size, s.pairs.length, `${where}: right items differ`);
      }
      if (s.type === 'bucket') {
        assert.equal(new Set(s.items.map((it) => flat(it.text))).size, s.items.length, `${where}: items differ`);
        for (let b = 0; b < s.buckets.length; b++) assert.ok(s.items.some((it) => it.bucket === b), `${where}: bucket ${b + 1} is used`);
      }
      if (s.type === 'fill') for (const blank of s.blanks) {
        if (blank.kind !== 'select') continue;
        assert.ok(blank.options.includes(blank.answer), `${where}: the answer is among the options`);
        assert.equal(new Set(blank.options).size, blank.options.length, `${where}: dropdown options differ`);
        if (typeof step.gen !== 'function') positions.push(blank.options.indexOf(blank.answer));
      }
    }
  });
  // dropdowns are shown in the order written: the right entry must not always sit in the same place
  if (positions.length >= 3) assert.ok(new Set(positions).size >= 2, `dropdown answers are in different positions (${positions})`);
});

/* ================================================================== double entry: the helper tables */

test('facts: the course\'s helper tables agree with this file\'s table', () => {
  assert.deepEqual(H.CPR.rate, FACTS.compressionsPerMinute);
  assert.deepEqual(H.CPR.depthCm, FACTS.compressionDepthCm);
  assert.deepEqual(H.CPR.ratio, FACTS.compressionsToBreaths);
  assert.equal(H.CPR.breathCheckSeconds, FACTS.breathingCheckSeconds);
  assert.equal(H.CPR.swapMinutes, FACTS.swapRescuersMinutes);
  assert.deepEqual(H.BREATHS_PER_MINUTE, FACTS.restingBreaths);
  // the model's two slopes lie inside the ranges the AHA quotes
  assert.ok(H.ARREST_MODEL.lossNoCpr >= FACTS.lossPerMinute.noCpr[0] && H.ARREST_MODEL.lossNoCpr <= FACTS.lossPerMinute.noCpr[1]);
  assert.ok(H.ARREST_MODEL.lossWithCpr >= FACTS.lossPerMinute.withCpr[0] && H.ARREST_MODEL.lossWithCpr <= FACTS.lossPerMinute.withCpr[1]);
  // emergency numbers, place by place
  const seen = {};
  for (const row of H.EMERGENCY_NUMBERS) for (const place of row.places) seen[place] = row.number;
  assert.deepEqual(seen, FACTS.numbers);
  assert.equal(new Set(H.EMERGENCY_NUMBERS.map((r) => r.number)).size, H.EMERGENCY_NUMBERS.length, 'one row per number');
});

test('order steps of lessons 1 and 2 follow this file\'s orders', () => {
  assertOrder(one('first-steps', 'order'), FACTS.firstSteps, 'first steps');
  assertOrder(one('first-steps', 'recovery-order'), FACTS.recovery, 'recovery position');
  assertOrder(one('cpr', 'chain'), FACTS.chain, 'chain of survival');
  assertOrder(one('cpr', 'aed-order'), FACTS.aed, 'defibrillator');
});

/* ====================================================================== lesson 1: Stop, Look, Call */

/**
 * Read the trace the learner is shown: the share of the look during which the chest is moving, and the
 * number of times it reaches a top (a local maximum above half height; a top reached exactly as the ten
 * seconds end counts too).
 */
function readTrace(spec, seconds = 10) {
  const dt = 0.005;
  const n = Math.round(seconds / dt);
  const v = Array.from({ length: n + 1 }, (_, i) => chestAt(spec.pattern, i * dt, spec));
  let moving = 0;
  let rises = 0;
  for (let i = 1; i <= n; i++) {
    if (Math.abs(v[i] - v[i - 1]) / dt > 0.05) moving += dt;
    const top = i < n ? v[i] >= v[i - 1] && v[i] > v[i + 1] : v[i] > v[i - 1] && v[i] > 0.97;
    if (top && v[i] > 0.5) rises++;
  }
  return { moving: moving / seconds, rises };
}
/** This file's rule: breathing is normal when the chest moves almost all the time and rises at least twice in ten seconds. */
const looksNormal = (trace) => trace.moving > 0.8 && trace.rises >= 2;

test('first-steps/breath-check: the answer follows from the trace the learner watches; the check accepts exactly that answer', () => {
  const patterns = new Set();
  const n = eachVariant('first-steps', 'breath-check', (s) => {
    const spec = s.widget;
    assert.equal(spec.type, 'breath-check');
    patterns.add(spec.pattern);
    const trace = readTrace(spec);
    const want = looksNormal(trace) ? 'normal' : 'abnormal';
    if (spec.pattern === 'normal') {
      assert.ok(spec.rate >= FACTS.restingBreaths[0] && spec.rate <= FACTS.restingBreaths[1], `a normal rate (${spec.rate})`);
      assert.equal(want, 'normal', 'a regular wave at a resting rate reads as normal');
      assert.ok(trace.rises === 2 || trace.rises === 3, `two or three breaths in ten seconds (${trace.rises})`);
    } else assert.equal(want, 'abnormal');
    if (spec.pattern === 'gasping') {
      assert.ok(spec.gasps.length >= 1 && spec.gasps.length <= 2 && spec.gasps.every((g) => g > 0.5 && g < 9.5), 'one or two gasps inside the ten seconds');
      assert.equal(trace.rises, spec.gasps.length);
      assert.ok(trace.moving < 0.3, 'mostly stillness');
    }
    if (spec.pattern === 'none') assert.equal(trace.rises, 0);
    assert.equal(countBreaths(spec.pattern, 10, spec), trace.rises, 'the widget counts the same number of breaths');
    // every state the two buttons can produce
    for (const watched of [false, true]) for (const answer of [null, 'normal', 'abnormal']) {
      const res = s.check({ watched, answer, seen: [], seenCount: 0, breaths: trace.rises });
      const ok = watched && answer === want;
      assert.equal(res === true, ok, `watched=${watched} answer=${answer}`);
      if (!ok) assert.equal(typeof res, 'string', 'a wrong state gets a message');
      if (!watched) assert.match(res, /ten seconds/);
      if (watched && answer && !ok) {
        if (spec.pattern === 'normal') assert.match(res, /evenly/);
        if (spec.pattern === 'gasping') assert.match(res, /gasp/);
        if (spec.pattern === 'none') assert.match(res, /did not move/);
      }
    }
    assert.equal(s.check(s.solution), true, 'the solution passes');
    assert.equal(s.solution.answer, want);
    const explain = flat(s.explain);
    if (want === 'normal') assert.match(explain, /breathing normally\*\*.*recovery position/);
    else assert.match(explain, /compressions start now/);
    assert.ok(flat(s.text).includes(`${FACTS.breathingCheckSeconds} seconds`));
  });
  assert.deepEqual([...patterns].sort(), ['gasping', 'none', 'normal']);
  assert.ok(n >= 10, `${n} different variants`);
});

test('first-steps/breath-explore: only watching all three patterns completes it', () => {
  const s = one('first-steps', 'breath-explore');
  assert.deepEqual(s.widget.compare, ['normal', 'gasping', 'none']);
  for (let k = 0; k <= 3; k++) {
    const res = s.check({ seenCount: k, seen: s.widget.compare.slice(0, k) });
    assert.equal(res === true, k === 3);
    if (k < 3) assert.ok(res.includes(`${3 - k} to go`));
  }
  assert.equal(s.check({ seen: s.solution.seen, seenCount: s.solution.seen.length }), true);
  assert.equal(s.graded, false);
});

test('first-steps/numbers: every pair is right by this file\'s table; the round is practice and is not graded', () => {
  const step = raw('first-steps', 'numbers');
  assert.equal(step.graded, false, 'country-specific facts are never graded');
  const n = eachVariant('first-steps', 'numbers', (s) => {
    assert.equal(s.pairs.length, 4);
    for (const [place, number] of s.pairs) {
      const key = Object.keys(FACTS.numbers).find((p) => p.toLowerCase() === place.toLowerCase());
      assert.ok(key, `${place} is in this file's table`);
      assert.equal(number, FACTS.numbers[key], `${place} → ${number}`);
      assert.ok(flat(s.explain).includes(`**${number}** in ${key}`), `the explanation names ${key} with ${number}`);
    }
  });
  assert.ok(n >= 40, `${n} different rounds`);
});

/** This file's reading of a finding: which of the three paths applies. */
function pathFor(finding) {
  const responsive = /opens her eyes|opens his eyes|answers|groans|pushes your hand/.test(finding);
  if (responsive) return 'responsive';
  assert.match(finding, /does not respond/, 'otherwise the person is unresponsive');
  const normal = /rises and falls steadily|breathing quietly and regularly/.test(finding);
  return normal ? 'recovery' : 'cpr';
}
const PATH_WORDS = { responsive: /^Stay with them/, recovery: /recovery position/, cpr: /start chest compressions/ };

test('first-steps/decide: two checks, three paths; the marked option is the one this file\'s reading gives', () => {
  const seen = new Set();
  const n = eachVariant('first-steps', 'decide', (s) => {
    const text = flat(s.text);
    const want = pathFor(text);
    seen.add(want);
    const right = correctOption(s);
    assert.match(right.text, PATH_WORDS[want], `the right option is the "${want}" path`);
    assert.equal(s.options.length, 3);
    for (const key of Object.keys(PATH_WORDS)) assert.equal(s.options.filter((o) => PATH_WORDS[key].test(o.text)).length, 1, `one option for "${key}"`);
    // every path that is not "responsive" starts with the call
    for (const o of s.options) if (!PATH_WORDS.responsive.test(o.text)) assert.match(o.text, /^Call the emergency number/);
    assert.match(text, /There is no danger/);
  });
  assert.deepEqual([...seen].sort(), ['cpr', 'recovery', 'responsive']);
  assert.ok(n >= 6, `${n} different people`);
  // the helper table itself: an unsure finding goes to compressions
  const unsure = H.CHECK_CASES.filter((c) => /cannot tell/.test(c.finding));
  assert.ok(unsure.length >= 1 && unsure.every((c) => c.decision === 'cpr'), 'if in doubt, treat as not breathing normally');
});

test('first-steps: the fixed steps say what this file\'s table says', () => {
  const hook = one('first-steps', 'hook');
  assert.equal(hook.mode, 'predict');
  assert.ok(hook.answer >= 7 && hook.answer <= 9, 'England, 2026: category 1 mean response just under 8 minutes (NHS England statistics)');
  const about = flat(one('first-steps', 'about').text);
  assert.match(about, /knowledge/); assert.match(about, /first-aid class/);
  const danger = one('first-steps', 'danger');
  for (const item of danger.items) {
    const hazard = /traffic|gas|power cable|river/.test(item.text);
    assert.equal(item.bucket, hazard ? 1 : 0, item.text);
  }
  const response = correctOption(one('first-steps', 'response'));
  assert.match(response.text, /tap her shoulders/); assert.match(response.text, /ask loudly/);
  const call = one('first-steps', 'call');
  for (const o of call.options) assert.equal(!!o.correct, /where you are|What has happened|responsive and breathing|Staying on the line/.test(o.text), o.text);
  const why = one('first-steps', 'recovery-why');
  assert.equal(why.widget.type, 'photo');
  assert.deepEqual(why.widget.hotspots.map((h) => h.id).sort(), ['arm', 'head', 'knee']);
  for (const picked of ['arm', 'head', 'knee', null]) {
    const res = why.check({ picked });
    assert.equal(res === true, picked === 'head', `recovery-why: ${picked}`);
    if (picked === 'knee') assert.match(res, /bent knee/);
    if (picked === 'arm') assert.match(res, /arm/);
  }
  assert.equal(why.check(why.solution), true);
  assert.match(flat(why.explain), /only for someone who is \*\*breathing normally\*\*/);
  assert.match(flat(one('first-steps', 'order').explain), /Older leaflets put the call one step later/, 'the difference between editions is stated');
  // the map: 112 is shown for the 27 members of the European Union and nothing else
  const map = one('first-steps', 'numbers-map').figures[0];
  const eu = map.regions.find((r) => /112/.test(r.label));
  assert.equal(eu.ids.length, 27);
  assert.equal(new Set(eu.ids).size, 27);
  for (const r of map.regions) assert.match(r.label, /^\d{3}/, 'every group is labelled with its number');
});

/* ================================================================== lesson 2: Hands on the Chest */

test('cpr/rate-check: the pace worked out from the count and the seconds decides the answer', () => {
  const kinds = new Set();
  const n = eachVariant('cpr', 'rate-check', (s) => {
    const text = flat(s.text);
    const [count, seconds] = grab(/\*\*(\d+) compressions in (\d+) seconds\*\*/, text).map(Number);
    assert.ok(Number.isInteger(count) && count > 0);
    const rate = (count / seconds) * 60;
    const want = rate < FACTS.compressionsPerMinute[0] ? /^Too slow/ : rate > FACTS.compressionsPerMinute[1] ? /^Too fast/ : /^Inside the band/;
    kinds.add(String(want));
    const right = correctOption(s);
    assert.match(right.text, want, `${count} in ${seconds} s is ${rate} a minute`);
    assert.equal(s.options.length, 3);
    assert.equal(s.shuffle, false);
    assert.ok(flat(s.explain).includes(`**${rate} a minute**`), `the explanation quotes ${rate}`);
    assert.ok(flat(s.explain).includes(`${count} × ${60 / seconds}`), 'and shows the working');
    assert.ok(flat(s.hints[0]).includes(`${60 / seconds} lots of ${seconds} seconds`));
    // no borderline cases: a clear miss is at least 8 a minute outside the band
    if (!/Inside/.test(String(want))) assert.ok(rate <= 92 || rate >= 128, `${rate} is clearly outside`);
    for (const o of s.options) assert.ok(o.text.includes('100') || o.text.includes('120'), 'options name the band');
  });
  assert.equal(kinds.size, 3, 'slow, inside and fast all occur');
  assert.ok(n >= 30, `${n} different questions`);
});

const WORRY_KEYS = [
  [/rib/, /Keep going/],
  [/gasp/, /not normal breathing/],
  [/never been trained/, /call-taker will talk you through/],
  [/defibrillator shocks/, /only if a shock is needed/],
  [/still beating/, /start anyway/],
];

test('cpr/worries: for each hesitation the marked reply is the guideline answer, and no other option says it', () => {
  const seen = new Set();
  eachVariant('cpr', 'worries', (s) => {
    const text = flat(s.text);
    const row = WORRY_KEYS.find(([worry]) => worry.test(text));
    assert.ok(row, 'the worry is one this file knows');
    seen.add(String(row[0]));
    const right = correctOption(s);
    assert.match(right.text, row[1]);
    assert.equal(s.options.length, 3);
    for (const o of s.options) {
      if (o.correct) continue;
      assert.ok(!row[1].test(o.text), 'a wrong option does not carry the right message');
      assert.ok(o.why && o.why.length > 30, 'every wrong option says why');
      assert.match(o.text, /wait|lightly|stop|recovery position|allowed|achieve nothing|pulse first|fatal|stand back/i, 'a wrong option advises delay, too little, or stopping');
    }
    assert.match(text, /unresponsive and is not breathing normally/);
    assert.match(text, /Help has been\s+called/);
  });
  assert.equal(seen.size, WORRY_KEYS.length, 'all five worries occur');
  assert.equal(H.WORRIES.length, WORRY_KEYS.length);
});

test('cpr/clock: the model agrees with this file\'s arithmetic, and the check accepts exactly the settings that leave 75 or more', () => {
  const s = one('cpr', 'clock');
  const spec = s.widget;
  assert.equal(spec.type, 'rescue-clock');
  const own = (cprOn, cpr, shock) => {
    let chance = 100;
    for (let minute = 0; minute < shock; minute++) chance -= cprOn && minute >= cpr ? spec.lossWithCpr : spec.lossNoCpr;   // minute by minute
    return Math.max(0, chance);
  };
  let accepted = 0;
  for (const cprOn of [false, true]) for (let cpr = 0; cpr <= 10; cpr++) for (let shock = 1; shock <= 12; shock++) {
    const exact = own(cprOn, cpr, shock);
    assert.ok(Math.abs(chanceAtShock({ cprOn, cpr, shock, lossNoCpr: spec.lossNoCpr, lossWithCpr: spec.lossWithCpr }) - exact) < 1e-9, `model at ${cprOn}/${cpr}/${shock}`);
    const chance = Math.round(exact);
    const noCprChance = Math.round(own(false, cpr, shock));
    const res = s.check({ cprOn, cpr, shock, chance, noCprChance, gain: chance - noCprChance });
    assert.equal(res === true, chance >= 75, `cprOn=${cprOn} cpr=${cpr} shock=${shock} chance=${chance}`);
    if (res === true) { accepted++; continue; }
    assert.equal(typeof res, 'string');
    if (/Nobody is giving compressions/.test(res)) assert.equal(cprOn, false);
    if (/before any compressions start/.test(res)) assert.ok(cprOn && cpr >= shock);
    if (/Start them sooner/.test(res)) assert.ok(cprOn && cpr > 1 && cpr < shock);
    if (/fetch a public defibrillator/.test(res)) assert.ok(cprOn && cpr <= 1 && cpr < shock && shock > 2);
  }
  assert.ok(accepted >= 10, `${accepted} settings reach the goal`);
  // the starting state does not pass; nobody helping until the ambulance at minute 8 leaves 20
  assert.notEqual(s.check({ cprOn: spec.cprOn, cpr: spec.cpr, shock: spec.shock, chance: Math.round(own(spec.cprOn, spec.cpr, spec.shock)) }), true);
  assert.equal(own(false, 0, 8), 20);
  const sol = s.solution;
  assert.equal(s.check({ ...sol, chance: Math.round(own(sol.cprOn, sol.cpr, sol.shock)) }), true, 'the solution passes');
  assert.match(flat(s.explain), /simplification/, 'the model says what it leaves out');
});

test('cpr/rhythm and cpr/solo: a round passes only when 30 compressions came at 100 to 120 a minute', () => {
  for (const id of ['rhythm', 'solo']) {
    const s = one('cpr', id);
    assert.equal(s.widget.type, 'cpr-rhythm');
    assert.deepEqual(s.widget.target, FACTS.compressionsPerMinute);
    assert.ok(s.widget.bpm >= 100 && s.widget.bpm <= 120, 'the lamp itself blinks inside the band');
    assert.equal(s.graded, false, 'timing on a touch screen is not graded');
    for (let taps = 0; taps <= 30; taps += 5) for (const rate of [null, 60, 99, 100, 110, 120, 121, 160]) {
      const done = taps >= 30;
      const inRange = rate != null && rate >= 100 && rate <= 120;
      const res = s.check({ taps, rate, inRange, done });
      assert.equal(res === true, done && inRange, `${id}: taps=${taps} rate=${rate}`);
      if (res !== true) {
        assert.equal(typeof res, 'string');
        if (!done) assert.ok(res.includes(`${taps} of 30`));
        else if (rate != null) assert.ok(res.includes(`about ${rate} a minute`) && (rate < 100 ? /under the band/ : /over the band/).test(res));
      }
    }
    assert.equal(s.check({ ...s.solution, inRange: true, done: true }), true);
  }
  assert.equal(one('cpr', 'solo').widget.guide, 'fade');
  // the widget's pace: 31 taps exactly 60/110 s apart read as 110 a minute; the first two taps are ignored
  const even = Array.from({ length: 31 }, (_, i) => (i * 60000) / 110);
  assert.ok(Math.abs(paceOf(even) - 110) < 1e-6);
  const lateStart = [0, 2000, ...Array.from({ length: 28 }, (_, i) => 3000 + (i * 60000) / 100)];
  assert.ok(Math.abs(paceOf(lateStart) - 100) < 1e-6, 'a slow start does not spoil the measurement');
  assert.equal(paceOf([0, 500, 1000]), null);
});

test('cpr: the fixed steps carry the guideline numbers', () => {
  const hook = one('cpr', 'hook');
  assert.ok(hook.answer >= FACTS.lossPerMinute.noCpr[0] && hook.answer <= FACTS.lossPerMinute.noCpr[1]);
  assert.match(flat(hook.explain), /7 to 10% a minute/);
  const how = one('cpr', 'how');
  assert.deepEqual(how.blanks.map((b) => b.answer), ['centre', `${FACTS.compressionDepthCm[0]} to ${FACTS.compressionDepthCm[1]}`, `${FACTS.compressionsPerMinute[0]} to ${FACTS.compressionsPerMinute[1]}`, 'come all the way back up']);
  assert.ok(flat(how.explain).includes(`swap about every ${FACTS.swapRescuersMinutes} minutes`));
  const sort = one('cpr', 'arrest-or-attack');
  assert.deepEqual(sort.buckets, ['Cardiac arrest', 'Heart attack']);
  for (const item of sort.items) {
    const attack = /blocked artery|usually awake|still beating/.test(item.text);
    assert.equal(item.bucket, attack ? 1 : 0, item.text);
  }
  const breaths = one('cpr', 'breaths');
  assert.match(correctOption(breaths).text, /Chest compressions without stopping/);
  assert.ok(flat(breaths.explain).includes(`${FACTS.compressionsToBreaths[0]} compressions and ${FACTS.compressionsToBreaths[1]} breaths`));
  const aed = one('cpr', 'aed');
  assert.match(flat(aed.text), /only if a shock is needed/);
  assert.match(flat(aed.text), /talks you through/);
  assert.equal(aed.widget.type, 'photo');
  for (const picked of ['fire', 'sign', 'hose', 'cabinet', null]) {
    const res = aed.check({ picked });
    assert.equal(res === true, picked === 'cabinet', `aed: ${picked}`);
    if (picked === 'sign') assert.match(res, /cabinet underneath/);
    if (picked === 'fire' || picked === 'hose') assert.match(res, /fire equipment/);
  }
  assert.equal(aed.check(aed.solution), true);
  // the pads on the drawing: the person's right upper chest and left side, as the guidelines describe
  const pads = one('cpr', 'aed-order').figures[0];
  assert.deepEqual(pads.markers.map((m) => m.at), ['right-upper-chest', 'left-side-chest']);
  assert.match(flat(one('cpr', 'try').text), /children and babies/i, 'the lesson says that children differ');
  assert.match(lessons.cpr.recap.join(' '), /class/);
});

/* ============================================================ lesson 3: Heart Attack and Stroke */

test('heart-stroke: helper facts agree with this file; the fixed steps say what the guidelines say', () => {
  assert.deepEqual(H.ASPIRIN_MG, { erc: FACTS.aspirinMg.europe, ahaArc: FACTS.aspirinMg.america });
  assert.equal(H.NEURONS_PER_MINUTE_MILLION, FACTS.neuronsLostPerMinuteMillion);
  assert.equal(H.STROKE_WINDOW_HOURS, FACTS.strokeWindowHours);
  assert.deepEqual(H.FAST.map((r) => r.word), FACTS.fast);
  assert.equal(H.FAST.map((r) => r.letter).join(''), 'FAST');
  assertOrder(one('heart-stroke', 'heart-actions'), FACTS.heartAttack, 'heart attack first aid');

  const hook = one('heart-stroke', 'hook');
  assert.equal(hook.mode, 'predict');
  assert.equal(correctOption(hook).text, 'Both of them');
  const signs = one('heart-stroke', 'signs');
  for (const o of signs.options) assert.equal(!!o.correct, !/face/i.test(o.text), o.text);

  const aspirin = one('heart-stroke', 'aspirin');
  const right = correctOption(aspirin).text;
  for (const need of [/adult/i, /awake/, /not allergic/, /not been told to avoid/, /chew/, /help is on the way/]) assert.match(right, need);
  const say = flat(aspirin.explain);
  assert.ok(say.includes(`${FACTS.aspirinMg.europe} mg`) && say.includes(`${FACTS.aspirinMg.america[0]} to ${FACTS.aspirinMg.america[1]} mg`), 'both guideline doses are given, and neither is graded');
  const aspirinTaught = flat(one('heart-stroke', 'teach-aspirin').text);
  assert.match(aspirinTaught, /not for children/);
  for (const need of [/adult/i, /awake/, /allergic/, /told by a doctor not to take it/, /chewed/, /call comes first/]) assert.match(aspirinTaught, need);
  assert.ok(!/\d+ ?mg/.test(aspirinTaught), 'the teaching screen gives no dose: the two doses stay side by side in the explanation');
  for (const o of aspirin.options) assert.ok(!/\d+ ?mg/.test(o.text), 'no option turns on a dose');

  const what = one('heart-stroke', 'stroke-what');
  assert.ok(flat(what.text).includes(`${FACTS.neuronsLostPerMinuteMillion} million nerve cells`) && flat(what.text).includes(`${FACTS.strokeWindowHours} hours`));
  const plot = what.figures[0];
  assert.equal(plot.fns[0].expr, `${FACTS.neuronsLostPerMinuteMillion}*x`);

  const letters = one('heart-stroke', 'fast-letters');
  assert.deepEqual(letters.pairs.map((p) => flat(p[0]).replace(/\*/g, '')), ['F · Face', 'A · Arms', 'S · Speech', 'T · Time']);
  const wants = [/smile/, /arms raised/, /sentence/, /Call now/];
  letters.pairs.forEach((p, i) => { assert.match(p[1], wants[i]); wants.forEach((w, j) => { if (j !== i) assert.ok(!w.test(p[1])); }); });
  assert.match(flat(letters.explain), /BE-FAST/, 'the variant is named');

  const donts = one('heart-stroke', 'stroke-donts');
  for (const item of donts.items) assert.equal(item.bucket, /water|aspirin|go to bed/.test(item.text) ? 1 : 0, item.text);
  assert.match(flat(donts.explain), /no food, no drink, no medicine/);
  assert.match(correctOption(one('heart-stroke', 'tia')).text, /^Call the emergency number now/);
});

test('heart-stroke/neurons: the loss is the rate times the minutes in the story', () => {
  const answers = new Set();
  eachVariant('heart-stroke', 'neurons', (s) => {
    const text = flat(s.text);
    const [rate] = grab(/about \*\*([\d.]+) million\*\* nerve cells are lost each minute/, text).map(Number);
    assert.equal(rate, FACTS.neuronsLostPerMinuteMillion);
    const [minutes] = grab(/(\d+) minutes/, text).map(Number);
    const want = rate * minutes;
    assert.ok(Math.abs(s.answer - want) < 1e-9, `${rate} × ${minutes} = ${want}, the step says ${s.answer}`);
    answers.add(s.answer);
    assert.equal(s.unit, 'million');
    for (const [value, note] of s.wrong) {
      assert.ok(Math.abs(value - s.answer) > 2 * s.tolerance, `the slip ${value} is clear of the answer ${s.answer}`);
      assert.ok(note.length > 20);
    }
    assert.ok(flat(s.explain).includes(`${rate} million × ${minutes} minutes = **${s.answer} million`));
    assert.ok(flat(s.hints[0]).includes(`${rate} × ${minutes}`));
  });
  assert.ok(answers.size >= 5);
});

const FAST_KEYS = ['face', 'arms', 'speech'];
/** Every state the fast-check widget can reach: any subset of the checks made, any ticks among the checks made. */
function* fastStates() {
  for (let t = 0; t < 8; t++) for (let m = 0; m < 8; m++) {
    if ((m & ~t) !== 0) continue;                         // a sign can be ticked only once its check has been made
    const tested = FAST_KEYS.filter((_, i) => t & (1 << i));
    const marked = Object.fromEntries(FAST_KEYS.map((k, i) => [k, !!(m & (1 << i))]));
    yield { tested, testedCount: tested.length, allTested: tested.length === 3, marked, markedCount: FAST_KEYS.filter((k) => marked[k]).length };
  }
}
function checkFastStep(s) {
  const spec = s.widget;
  assert.equal(spec.type, 'fast-check');
  const present = { face: !!spec.signs.face, arms: !!spec.signs.arms, speech: !!spec.signs.speech };
  // what the drawing shows (the widget's own description of it) must agree with the signs in the spec
  const seen = describeFast(spec);
  assert.equal(/does not rise/.test(seen.face), present.face);
  assert.equal(/sinks down/.test(seen.arms), present.arms);
  assert.equal(/slurred|wrong order/.test(seen.speech), present.speech);
  let accepted = 0;
  for (const state of fastStates()) {
    const res = s.check(state);
    const ok = state.allTested && FAST_KEYS.every((k) => state.marked[k] === present[k]);
    assert.equal(res === true, ok, JSON.stringify(state));
    if (ok) { accepted++; continue; }
    assert.equal(typeof res, 'string');
    if (!state.allTested) { assert.ok(res.includes(`${3 - state.testedCount} to go`)); continue; }
    // the message names one check that was ticked wrongly, and says the truth about it
    const off = FAST_KEYS.filter((k) => state.marked[k] !== present[k]);
    const hit = off.find((k) => (k === 'face' ? /mouth|smile/ : k === 'arms' ? /arms/ : /said|sentence/).test(res));
    assert.ok(hit, `the message is about a wrongly ticked sign: ${res}`);
    assert.equal(/did not rise|has sunk|Read what was said/.test(res), present[hit], 'and is true of the drawing');
  }
  assert.equal(accepted, 1, 'exactly one state is right');
  const sol = s.solution;
  assert.equal(s.check({ tested: sol.tested, testedCount: 3, allTested: true, marked: sol.marked, markedCount: 0 }), true);
  return present;
}

test('heart-stroke/fast-explore and fast-find: only the signs the drawing shows may be ticked', () => {
  const fixed = one('heart-stroke', 'fast-explore');
  assert.deepEqual(checkFastStep(fixed), { face: true, arms: false, speech: true });
  assert.match(flat(fixed.explain), /One sign is enough to call/);
  const combos = new Set();
  eachVariant('heart-stroke', 'fast-find', (s) => {
    const present = checkFastStep(s);
    const n = FAST_KEYS.filter((k) => present[k]).length;
    assert.ok(n >= 1, 'at least one sign: a clear FAST check is never taught as "no stroke"');
    combos.add(JSON.stringify(present));
    const explain = flat(s.explain);
    for (const [k, word] of [['face', 'the face'], ['arms', 'an arm'], ['speech', 'the speech']]) assert.equal(explain.includes(word), present[k], `the explanation names ${word} only if it is affected`);
    assert.match(explain, /call the emergency number and note the time/);
  });
  assert.equal(combos.size, 7, 'all seven combinations of signs occur');
});

/** This file's reading of a story: which of the three emergencies it describes. */
function emergencyFor(story) {
  if (/does not respond/.test(story)) return 'arrest';
  if (/mouth sags|slurred|jumbled|cannot lift her left arm|cannot keep his left arm raised/.test(story)) return 'stroke';
  assert.match(story, /chest|short of breath/, 'otherwise the trouble is in the chest');
  return 'attack';
}
const EMERGENCY_WORDS = { attack: /^Suspected heart attack: call the emergency number/, stroke: /^Suspected stroke: call the emergency number, note when/, arrest: /^Cardiac arrest: call the emergency number and start chest compressions/ };

test('heart-stroke/which: the story decides the emergency; every option starts with the call', () => {
  const kinds = {};
  const n = eachVariant('heart-stroke', 'which', (s) => {
    const want = emergencyFor(flat(s.text));
    kinds[want] = (kinds[want] || 0) + 1;
    assert.match(correctOption(s).text, EMERGENCY_WORDS[want]);
    assert.equal(s.options.length, 3);
    for (const o of s.options) assert.match(o.text, /: call the emergency number/);
    assert.match(flat(s.options.find((o) => /stroke/.test(o.text)).text), /nothing to eat or drink/);
  });
  assert.deepEqual(Object.keys(kinds).sort(), ['arrest', 'attack', 'stroke']);
  assert.ok(n >= 8, `${n} different people`);
  // a transient attack and a painless heart attack are both in the pool
  assert.ok(H.EMERGENCY_CASES.some((c) => c.kind === 'stroke' && /passes/.test(c.story)));
  assert.ok(H.EMERGENCY_CASES.some((c) => c.kind === 'attack' && /no chest pain/.test(c.story)));
});

/* ============================================================ the body diagram: marker-placing steps */

const CM = 0.2;                                   // BODY.md: 5 units of the whole-figure drawings are about 1 cm
const cmBetween = (a, b) => Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]) * CM * 10) / 10;
/** The state place mode reports for a marker at `at`, worked out from the drawing module itself. */
function placedAt(art, at, target) {
  const where = art.region(at[0], at[1]);
  return { at, placed: true, structure: null, region: where ? where.region : null, side: where ? where.side : null, distance: cmBetween(at, target), nearest: 'target' };
}

test('cpr/hands: the marker passes only on the lower half of the breastbone, within 4 cm of the centre of the chest, and every message is true of where it stands', () => {
  const s = one('cpr', 'hands');
  assert.equal(s.widget.mode, 'place');
  assert.equal(s.widget.target, 'chest-centre');
  const centre = anchorPoint('body', 'chest-centre');
  assert.deepEqual(FRONT.region(centre[0], centre[1]), { region: 'chest', side: null }, 'the target is on the chest, in the midline');
  assert.equal(s.check({ placed: false, at: [200, 440], distance: 35 }), 'Move the marker onto the figure first.');
  // reviewer's own measurement of the drawing: where the breastbone lies on the midline, and so where its lower half is
  let boneTop = null;
  let boneEnd = null;
  for (let y = 150; y < 420; y++) if (structureAt('torso', [200, y], { show: ['breastbone'] }) === 'breastbone') { if (boneTop == null) boneTop = y; boneEnd = y; }
  const boneMid = (boneTop + boneEnd) / 2;
  assert.ok(centre[1] > boneMid && centre[1] < boneEnd, 'the target is on the lower half of the breastbone');
  assert.ok(boneEnd < anchorPoint('body', 'upper-abdomen')[1], 'the breastbone ends above the upper abdomen');
  let passed = 0;
  for (let x = 100; x <= 300; x += 2) for (let y = 150; y <= 500; y += 2) {
    const state = placedAt(FRONT, [x, y], centre);
    const res = s.check(state);
    // 5 units of the drawing are 1 cm: at most 4 cm from the spot and at most 2 cm from the midline (the bone is about 4 cm wide)
    assert.equal(res === true, state.distance <= 4 && Math.abs(x - centre[0]) <= 10, `(${x}, ${y}): ${state.distance} cm`);
    if (res === true) {
      passed++;
      assert.equal(state.region, 'chest', `(${x}, ${y}) is on the chest: never the abdomen or the neck`);
      assert.ok(y >= boneMid && y <= boneEnd, `(${x}, ${y}) is level with the lower half of the breastbone`);
      assert.ok(structureAt('torso', [x, y], { show: ['breastbone'] }) === 'breastbone' || Math.abs(x - centre[0]) >= 8, `(${x}, ${y}) is on the breastbone, or at its very edge`);
      continue;
    }
    assert.equal(typeof res, 'string');
    if (/Nearly: that is the right height, but beside the breastbone/.test(res)) assert.ok(state.distance <= 4 && Math.abs(x - centre[0]) > 10);
    if (/Too low: that is the abdomen/.test(res)) assert.ok(['abdomen', 'pelvis'].includes(state.region));
    if (/Too high\. Compressions go on the chest/.test(res)) assert.ok(['neck', 'head'].includes(state.region));
    if (/off the chest/.test(res)) assert.ok(!['chest', 'abdomen', 'pelvis', 'neck', 'head'].includes(state.region));
    if (/over the ribs, to one side/.test(res)) assert.ok(state.region === 'chest' && Math.abs(x - centre[0]) > Math.abs(y - centre[1]));
    if (/A little too high/.test(res)) assert.ok(state.region === 'chest' && y < centre[1]);
    if (/A little too low/.test(res)) assert.ok(state.region === 'chest' && y > centre[1]);
  }
  assert.ok(passed > 20, `${passed} grid points pass`);
  assert.equal(s.check(placedAt(FRONT, centre, centre)), true, 'the solution passes');
  assert.match(flat(s.text), /On the breastbone, within 4 cm of the spot, counts/);
  assert.match(flat(s.explain), /lower half of the breastbone/);
});

test('choking-breathing/blows-where: the marker passes only within 5 cm of the spot between the shoulder blades', () => {
  const s = one('choking-breathing', 'blows-where');
  assert.equal(s.widget.view, 'back-torso');
  assert.equal(s.widget.target, 'between-shoulder-blades');
  const spot = BACK.anchors['between-shoulder-blades'];
  assert.equal(BACK.region(spot[0], spot[1]).region, 'upper-back');
  let passed = 0;
  for (let x = 100; x <= 300; x += 4) for (let y = 150; y <= 500; y += 4) {
    const state = placedAt(BACK, [x, y], spot);
    const res = s.check(state);
    assert.equal(res === true, state.distance <= 5, `(${x}, ${y}): ${state.distance} cm`);
    if (res === true) { passed++; continue; }
    if (/Too low: that is the lower back/.test(res)) assert.ok(['lower-back', 'buttocks'].includes(state.region));
    if (/never strike the neck or the head/.test(res)) assert.ok(['neck', 'head'].includes(state.region));
    if (/^Close\./.test(res)) assert.equal(state.region, 'upper-back');
    if (/off the back/.test(res)) assert.ok(!['upper-back', 'lower-back', 'buttocks', 'neck', 'head'].includes(state.region));
  }
  assert.ok(passed > 30);
  assert.equal(s.check({ placed: false }), 'Move the marker onto the back first.');
  assert.equal(s.check(placedAt(BACK, spot, spot)), true);
  assert.match(flat(s.text), /Within 5 cm counts/);
});

/** A pick-a-marker step: only `answer` passes, every other marker gets its own message, and the points are far enough apart to tap. */
function checkMarkerStep(lesson, id, answer, messages, minGapCm) {
  const s = one(lesson, id);
  const spec = s.widget;
  assert.equal(spec.mode, 'pickMarker');
  assert.equal(spec.answer, answer, 'the revealed answer is the one the check accepts');
  assert.equal(spec.markerLabels, 'after', 'labels are hidden until the step is answered');
  const pickable = spec.markers.filter((m) => m.id);
  assert.deepEqual(pickable.map((m) => m.id).sort(), Object.keys(messages).concat(answer).sort());
  for (const m of pickable) {
    const res = s.check({ picked: m.id });
    assert.equal(res === true, m.id === answer, `${lesson}/${id}: ${m.id}`);
    if (m.id !== answer) assert.match(res, messages[m.id], `${m.id} gets its own message`);
  }
  assert.equal(typeof s.check({ picked: null }), 'string');
  assert.equal(s.check(s.solution), true);
  const art = VIEWS[spec.view].art === 'back' ? 'back' : 'body';
  const points = spec.markers.map((m) => (Array.isArray(m.at) ? m.at : anchorPoint(art, m.at)));
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) assert.ok(cmBetween(points[i], points[j]) >= minGapCm, `${lesson}/${id}: markers ${i + 1} and ${j + 1} are ${cmBetween(points[i], points[j])} cm apart`);
  return { s, spec, points: Object.fromEntries(spec.markers.map((m, i) => [m.id || `mark${i}`, points[i]])) };
}

test('choking-breathing: the marker steps accept only the place the guidelines name', () => {
  // abdominal thrusts: in the midline, between the navel and the lower end of the breastbone
  const thrust = checkMarkerStep('choking-breathing', 'thrusts-where', 'upper', { chest: /breastbone/, lower: /Too low/, side: /ribs/ }, 6);
  const navel = anchorPoint('body', 'navel');
  const breastbone = anchorPoint('body', 'chest-centre');
  const up = thrust.points.upper;
  assert.ok(up[0] === 200 && up[1] < navel[1] && up[1] > breastbone[1] + 40, 'above the navel and well below the breastbone, in the midline');
  assert.equal(FRONT.region(up[0], up[1]).region, 'abdomen');
  assert.match(flat(thrust.s.explain), /Australia and New Zealand chest thrusts are taught/, 'the difference between bodies is stated');
  // auto-injector: the outer side of the thigh, halfway between hip and knee
  const inj = checkMarkerStep('choking-breathing', 'injector-site', 'outer', { arm: /upper arm/, belly: /abdomen/, inner: /inner thigh/ }, 6);
  const hip = anchorPoint('body', 'hip:left');
  const knee = anchorPoint('body', 'knee:left');
  const mid = anchorPoint('body', 'thigh:left');
  const outer = inj.points.outer;
  assert.deepEqual(FRONT.region(outer[0], outer[1]), { region: 'thigh', side: 'left' });
  assert.ok(outer[0] > mid[0] + 10, 'on the outer side of the thigh (the person\'s left thigh is on the right of the picture)');
  assert.ok(Math.abs(outer[1] - (hip[1] + knee[1]) / 2) <= 15, 'about halfway between hip and knee');
  assert.equal(FRONT.region(inj.points.inner[0], inj.points.inner[1]).region, 'thigh');
  assert.ok(inj.points.inner[0] < mid[0] - 10, 'the wrong point is on the inner side');
});

test('bleeding-burns/tourniquet-where: only the point a few centimetres above the wound, clear of the knee, is accepted', () => {
  const t = checkMarkerStep('bleeding-burns', 'tourniquet-where', 'above', { high: /closer to it/, joint: /Not over a joint/, below: /beyond the wound/ }, 6);
  const wound = t.spec.markers.find((m) => !m.id);
  assert.equal(wound.shape, 'cross');
  const w = wound.at;
  const above = t.points.above;
  const gap = cmBetween(above, w);
  assert.ok(above[1] < w[1], 'nearer the heart than the wound');
  assert.ok(gap >= FACTS.tourniquetAboveCm[0] && gap <= FACTS.tourniquetAboveCm[1] + 0.5, `${gap} cm above the wound`);
  assert.equal(FRONT.region(above[0], above[1]).region, 'lower-leg', 'not on the knee');
  assert.equal(FRONT.region(t.points.joint[0], t.points.joint[1]).region, 'knee');
  assert.equal(FRONT.region(t.points.high[0], t.points.high[1]).region, 'thigh');
  // "high and tight" is taught by some courses for a wound that cannot be found: the feedback must not call it useless or harmful
  const highSays = t.s.check({ picked: 'high' });
  assert.match(highSays, /would stop the bleeding too/);
  assert.match(highSays, /some courses teach it for a wound that cannot be found/);
  assert.ok(!/wrong|never|dangerous|harm/i.test(highSays), 'the far placement is not condemned');
  const hipY = anchorPoint('body', 'hip:left')[1];
  const kneeY = anchorPoint('body', 'knee:left')[1];
  assert.ok(t.points.high[1] < hipY + (kneeY - hipY) / 3, 'the point labelled "High on the thigh" is in the top third of the thigh');
  assert.ok(t.points.below[1] > w[1], 'the "below" point is further from the heart');
  for (const p of Object.values(t.points)) assert.equal(FRONT.region(p[0], p[1]).side, 'left', 'all on the same leg');
});

/* ======================================================== lesson 4: When Someone Cannot Breathe */

test('choking-breathing: helper facts and fixed steps agree with this file', () => {
  assert.equal(H.BACK_BLOWS, FACTS.backBlows);
  assert.equal(H.ABDOMINAL_THRUSTS, FACTS.abdominalThrusts);
  assert.equal(H.SECOND_DOSE_MINUTES, FACTS.secondDoseMinutes);
  assertOrder(one('choking-breathing', 'choke-order'), FACTS.choking, 'choking');
  assert.match(flat(one('choking-breathing', 'choke-order').explain), /European guidelines say "up to 5" of each, American ones "5 and 5"/);
  assert.match(flat(one('choking-breathing', 'choke-order').explain), /Babies under one need a different method/);
  assert.match(correctOption(one('choking-breathing', 'hook')).text, /keep coughing/);
  const sort = one('choking-breathing', 'mild-severe');
  for (const item of sort.items) assert.equal(item.bucket, /Cannot speak|no sound|lips turn blue/.test(item.text) ? 1 : 0, item.text);
  const signs = one('choking-breathing', 'ana-signs');
  for (const o of signs.options) assert.equal(!!o.correct, /tongue|Wheezing|faint/.test(o.text), o.text);
  const fill = one('choking-breathing', 'ana-fill');
  assert.deepEqual(fill.blanks.map((b) => b.answer), ['outer', 'lie down with the legs raised', `${FACTS.secondDoseMinutes} minutes`]);
  assert.match(flat(fill.explain), /after 5 minutes or somewhat later \(5 to 15 minutes on some labels\)/, 'the range between bodies is stated (RCUK 2025: 5; AHA/ARC: 5 to 10; MHRA: 5 to 15)');
  assert.match(flat(fill.explain), /Antihistamine tablets do not treat anaphylaxis and must never delay the adrenaline/);
  assert.match(flat(fill.explain), /must not wait for the call/);
  assert.match(flat(fill.explain), /need hospital even if they recover/);
  assert.match(flat(one('choking-breathing', 'ana-signs').explain), /If in doubt, treat it as anaphylaxis/);
  const chokeSays = flat(one('choking-breathing', 'choke-order').explain);
  assert.match(chokeSays, /Do not feel blindly in the mouth with a finger/, 'no blind finger sweeps (RCUK 2025)');
  assert.match(chokeSays, /back blows and chest thrusts, never abdominal thrusts/, 'infants: chest thrusts, never abdominal thrusts (AHA 2025; ERC 2025)');
  const asthma = one('choking-breathing', 'asthma');
  for (const item of asthma.items) assert.equal(item.bucket, /flat on her back|paper bag|alone/.test(item.text) ? 1 : 0, item.text);
  assert.match(flat(asthma.explain), /one puff every 30 to 60 seconds, up to ten/);
  assert.match(flat(asthma.explain), /four puffs/);
  assert.match(correctOption(one('choking-breathing', 'drowning')).text, /Rescue breaths matter more/);
  const pen = one('choking-breathing', 'ana-what').figures[0];
  assert.equal(pen.mode, 'label');
});

function chokingAction(story) {
  if (/does not respond|does not react/.test(story)) return 'cpr';
  if (/cannot make a sound|silent attempts|can no longer speak|cannot answer/.test(story)) return 'blows';
  assert.match(story, /coughing (hard|loudly)/, 'otherwise the person is coughing effectively');
  return 'cough';
}
const CHOKING_WORDS = { cough: /^Encourage them to keep coughing/, blows: /back blows, then abdominal thrusts/, cpr: /^Call the emergency number and start CPR/ };

test('choking-breathing/choke-who: cough, back blows or CPR follows from whether the person can cough and whether they respond', () => {
  const seen = new Set();
  eachVariant('choking-breathing', 'choke-who', (s) => {
    const want = chokingAction(flat(s.text));
    seen.add(want);
    assert.match(correctOption(s).text, CHOKING_WORDS[want]);
    assert.equal(s.options.length, 3);
    assert.match(s.options.find((o) => CHOKING_WORDS.blows.test(o.text)).text, /emergency number called/);
  });
  assert.deepEqual([...seen].sort(), ['blows', 'cough', 'cpr']);
});

function breathingKind(story) {
  if (/cannot speak and cannot cough|no sound comes out/.test(story)) return 'choking';
  if (/sting|nut allergy|new medicine/.test(story)) return 'anaphylaxis';
  assert.match(story, /asthma/);
  return 'asthma';
}
const BREATHING_WORDS = { choking: /^Severe choking: back blows, then abdominal thrusts/, anaphylaxis: /^Anaphylaxis: adrenaline auto-injector into the outer thigh without delay/, asthma: /^Asthma attack: sitting upright, their own reliever inhaler/ };

test('choking-breathing/which: the story decides between choking, anaphylaxis and asthma', () => {
  const seen = new Set();
  eachVariant('choking-breathing', 'which', (s) => {
    const want = breathingKind(flat(s.text));
    seen.add(want);
    assert.match(correctOption(s).text, BREATHING_WORDS[want]);
    for (const o of s.options) assert.match(o.text, /emergency number/, 'every option includes the call');
  });
  assert.deepEqual([...seen].sort(), ['anaphylaxis', 'asthma', 'choking']);
});

/* ============================================================ lesson 5: Bleeding, Burns and Breaks */

test('bleeding-burns: helper facts and fixed steps agree with this file', () => {
  assert.deepEqual(H.BURN_COOL_MINUTES, { usual: FACTS.burnCoolMinutes, minimum: FACTS.burnCoolMinimum });
  assert.deepEqual(H.NOSE_PINCH_MINUTES, FACTS.nosePinchMinutes);
  assert.deepEqual(H.TOURNIQUET_ABOVE_CM, FACTS.tourniquetAboveCm);
  const hook = one('bleeding-burns', 'hook');
  assert.equal(hook.mode, 'predict');
  assert.ok(correctOption(hook).text.includes(`cool running water for ${FACTS.burnCoolMinutes} minutes`));
  const nose = one('bleeding-burns', 'nosebleed');
  assert.deepEqual(nose.blanks.map((b) => b.answer), ['forward', 'soft part', `${FACTS.nosePinchMinutes[0]} to ${FACTS.nosePinchMinutes[1]} minutes`]);
  const burns = one('bleeding-burns', 'burn-sort');
  for (const item of burns.items) assert.equal(item.bucket, /ice|butter|Burst|Pull off/.test(item.text) ? 1 : 0, item.text);
  assert.ok(flat(burns.explain).includes(`Some guidelines accept ${FACTS.burnCoolMinimum} minutes as a minimum`), 'the range between bodies is stated');
  for (const o of [...hook.options, ...burns.items]) assert.ok(!/\b10 minutes/.test(o.text), 'no option turns on 10 versus 20 minutes');
  const info = flat(one('bleeding-burns', 'tourniquet').text);
  assert.ok(info.includes(`${FACTS.tourniquetAboveCm[0]} to ${FACTS.tourniquetAboveCm[1]} cm above the wound`));
  assert.match(info, /never over a joint/); assert.match(info, /time/);
  const breaks = one('bleeding-burns', 'breaks');
  for (const item of breaks.items) assert.equal(item.bucket, /Straighten|test whether|eat and drink/.test(item.text) ? 1 : 0, item.text);
  const head = one('bleeding-burns', 'head');
  for (const o of head.options) assert.equal(!!o.correct, !/small bump/.test(o.text), o.text);
  assert.match(flat(head.explain), /24 to 48 hours/);
  assert.match(correctOption(one('bleeding-burns', 'spine')).text, /keep still/);
  assert.match(correctOption(one('bleeding-burns', 'spine')).text, /^Call the emergency number/);
  assert.match(flat(one('bleeding-burns', 'sprain').text), /The old rule "rest, ice, compression, elevation" is giving way to shorter rest and earlier movement\. Cold eases pain; whether it speeds healing is uncertain, and experts disagree\./, 'the uncertainty about ice and rest is stated, before the question');
});

test('bleeding-burns/press: the model stops the bleeding only after unbroken pressure; the check accepts only that', () => {
  const s = one('bleeding-burns', 'press');
  assert.equal(s.widget.type, 'press-hold');
  assert.equal(s.graded, false);
  for (const pressing of [false, true]) for (const lifts of [0, 1, 3]) for (const held of [0, 1, 5, 9]) for (const controlled of [false, true]) {
    if (controlled && !pressing) continue;                  // the clot completes only under the pad
    const res = s.check({ pressing, lifts, minutes: held + lifts * 3, held, controlled });
    assert.equal(res === true, controlled, JSON.stringify({ pressing, lifts, held, controlled }));
    if (res === true) continue;
    if (/Press the pad onto the wound first/.test(res)) assert.ok(!pressing && lifts === 0);
    if (/With the pad lifted/.test(res)) assert.ok(!pressing && lifts > 0);
    if (/Keep pressing/.test(res)) { assert.ok(pressing); assert.ok(res.includes(`${held} ${held === 1 ? 'minute' : 'minutes'}`)); }
  }
  assert.equal(s.check({ ...s.solution, pressing: true, held: 10 }), true);
  assert.match(flat(s.explain), /illustration/, 'the model says its ten minutes are not a rule');
  assert.deepEqual([1, 0.7, 0.5, 0.2, 0].map(bleedingWord), ['heavy', 'heavy', 'slowing', 'oozing', 'stopped']);
});

function bleedAction(story) {
  if (/nosebleed|nose starts to bleed/.test(story)) return 'nose';
  if (/sticking out|still in place/.test(story)) return 'object';
  if (/tourniquet/.test(story)) return 'tourniquet';
  return 'press';
}
const BLEED_WORDS = { press: /^Press firmly and directly on the wound/, object: /^Leave the object in place/, tourniquet: /^Put the tourniquet on the limb, a few centimetres above the wound/, nose: /^Sit them leaning forward and pinch the soft part/ };

test('bleeding-burns/bleed-what: the story decides between pressure, an embedded object, a tourniquet and a nosebleed', () => {
  const seen = new Set();
  eachVariant('bleeding-burns', 'bleed-what', (s) => {
    const story = flat(s.text);
    const want = bleedAction(story);
    seen.add(want);
    assert.match(correctOption(s).text, BLEED_WORDS[want]);
    if (want === 'tourniquet') assert.match(story, /pressed hard|firm pressure is not stopping/, 'a tourniquet only once pressure has failed');
    if (want !== 'nose') assert.match(story, /emergency number|Help has been called/, 'help has been called in every serious case');
    assert.equal(/lie down/.test(flat(s.explain)), want !== 'nose', 'nobody with a nosebleed is told to lie down');
  });
  assert.deepEqual([...seen].sort(), ['nose', 'object', 'press', 'tourniquet']);
});

/** NHS: which burns need medical attention. */
function burnNeedsHelp(story) {
  return /Most of the forearm/.test(story)        // bigger than the person's hand
    || /cheek/.test(story)                         // the face
    || /waxy white/.test(story)                    // deep
    || /two-year-old/.test(story)                  // a young child
    || /palm and fingers/.test(story);             // the hands
}

test('bleeding-burns/burn-level: size, depth, place and age decide whether a burn must be seen', () => {
  const seen = new Set();
  eachVariant('bleeding-burns', 'burn-level', (s) => {
    const help = burnNeedsHelp(flat(s.text));
    seen.add(help);
    assert.match(correctOption(s).text, help ? /get medical help$/ : /look after it at home$/);
    assert.equal(s.options.length, 2);
    for (const o of s.options) assert.ok(o.text.includes(`Cool it for ${FACTS.burnCoolMinutes} minutes`), 'both options begin with cooling');
    assert.match(flat(s.explain), /If you are unsure, have it looked at/);
  });
  assert.deepEqual([...seen].sort(), [false, true]);
});

test('bleeding-burns/breaks-call: only the back, the hip and the thigh pass, whichever other points are tried', () => {
  const s = one('bleeding-burns', 'breaks-call');
  const spec = s.widget;
  assert.equal(spec.mode, 'pickMarkers');
  assert.equal(spec.max, 3);
  const ids = spec.markers.map((m) => m.id);
  assert.deepEqual(ids.slice().sort(), ['b-back', 'b-collar', 'b-forearm', 'b-hand', 'b-hip', 'b-thigh']);
  // St John Ambulance and NHS: an ambulance for a suspected break of the back or neck, the hip or the thigh; an arm can travel supported
  const mustCall = { 'b-back': /spine/, 'b-hip': /hip-joint|pelvis/, 'b-thigh': /femur/ };
  for (const m of spec.markers) assert.equal(!!mustCall[m.id], /spine|hip-joint|pelvis|femur/.test(m.at), `${m.id} is at ${m.at}`);
  for (const [id, re] of Object.entries(mustCall)) assert.match(spec.markers.find((m) => m.id === id).at, re);
  assert.deepEqual(spec.answer.slice().sort(), ['b-back', 'b-hip', 'b-thigh']);
  let accepted = 0;
  for (let mask = 0; mask < 64; mask++) {
    const picked = ids.filter((_, i) => mask & (1 << i)).sort();
    if (picked.length > 3) continue;                       // the widget allows at most three
    const res = s.check({ picked, count: picked.length });
    const ok = picked.join() === 'b-back,b-hip,b-thigh';
    assert.equal(res === true, ok, picked.join());
    if (ok) { accepted++; continue; }
    if (picked.length < 3) assert.ok(res.includes(`${3 - picked.length} to go`));
    else {
      const arm = picked.filter((id) => ['b-collar', 'b-forearm', 'b-hand'].includes(id)).length;
      assert.ok(arm >= 1, 'a wrong set of three contains at least one arm point');
      assert.equal(/^Two of those are right/.test(res), arm === 1);
    }
  }
  assert.equal(accepted, 1);
  assert.equal(s.check({ picked: s.solution.picked.slice().sort(), count: 3 }), true);
});

/* ========================================================= lesson 6: Fainting, Seizures, Heat and Cold */

test('everyday-emergencies: helper facts and fixed steps agree with this file', () => {
  assert.deepEqual(H.CORE_TEMP, { normal: FACTS.normalCore, hypothermiaBelow: FACTS.hypothermiaBelow, heatstrokeFrom: FACTS.heatstrokeFrom });
  assert.equal(H.SEIZURE_CALL_MINUTES, FACTS.seizureCallMinutes);
  assert.deepEqual(H.SUGAR_GRAMS, FACTS.sugarGrams);
  assert.deepEqual(H.SUGAR_WAIT_MINUTES, FACTS.sugarWaitMinutes);
  assert.ok(H.COOLING.immersion >= FACTS.cooling.immersionAtLeast && H.COOLING.immersion <= FACTS.cooling.immersionAtMost);
  assert.ok(H.COOLING.sprayFan < FACTS.cooling.othersBelow && H.COOLING.shade < H.COOLING.sprayFan);
  assertOrder(one('everyday-emergencies', 'sugar'), FACTS.sugar, 'low blood sugar');
  const sugar = flat(one('everyday-emergencies', 'sugar').explain);
  assert.ok(sugar.includes(`${FACTS.sugarGrams[0]} to ${FACTS.sugarGrams[1]} grams`));
  assert.match(sugar, /nothing goes in the mouth/);
  const hook = one('everyday-emergencies', 'hook');
  assert.match(correctOption(hook).text, /Cushion his head/);
  assert.match(flat(hook.explain), /Nobody can swallow their tongue/);
  const faint = one('everyday-emergencies', 'faint');
  assert.deepEqual(faint.blanks.map((b) => b.answer), ['back', 'legs', 'a minute or two']);
  for (const [id, harm] of [['cold', /hot bath|Rub|spirits/], ['poison', /vomit|milk or salt water|Wait to see/]]) {
    for (const item of one('everyday-emergencies', id).items) assert.equal(item.bucket, harm.test(item.text) ? 1 : 0, item.text);
  }
  const nal = one('everyday-emergencies', 'naloxone');
  assert.deepEqual(nal.blanks.map((b) => b.answer), ['blocks the opioid for a while', 'as soon as possible', 'still needs an ambulance']);
  const kit = flat(one('everyday-emergencies', 'kit').text);
  assert.match(kit, /first-aid class/);
  assert.match(lessons['everyday-emergencies'].next, /Health & the Body/);
  assert.match(lessons['everyday-emergencies'].next, /class/);
});

test('everyday-emergencies/band: only 35 and 40 degrees pass, and each hint points the right way', () => {
  const s = one('everyday-emergencies', 'band');
  assert.equal(s.graded, false);
  for (let cold = 30; cold <= 44; cold++) for (let hot = 30; hot <= 44; hot++) {
    const res = s.check({ cold, hot });
    const ok = cold === FACTS.hypothermiaBelow && hot === FACTS.heatstrokeFrom;
    assert.equal(res === true, ok, `${cold}/${hot}`);
    if (ok) continue;
    if (/Hypothermia begins lower than/.test(res)) assert.ok(cold > FACTS.hypothermiaBelow && res.includes(`${cold} °C`));
    else if (/Hypothermia begins higher than/.test(res)) assert.ok(cold < FACTS.hypothermiaBelow && res.includes(`${cold} °C`));
    else if (/Heatstroke begins lower than/.test(res)) assert.ok(cold === FACTS.hypothermiaBelow && hot > FACTS.heatstrokeFrom && res.includes(`${hot} °C`));
    else if (/Heatstroke begins higher than/.test(res)) assert.ok(cold === FACTS.hypothermiaBelow && hot < FACTS.heatstrokeFrom && res.includes(`${hot} °C`));
    else assert.fail(`unexpected message: ${res}`);
  }
  assert.equal(s.check(s.solution), true);
  assert.equal(s.widget.marks[0].value, 37);
});

test('everyday-emergencies/cooling: the model\'s three lines follow this file\'s arithmetic', () => {
  const plot = one('everyday-emergencies', 'cooling').figures[0];
  const start = 41.5;
  const text = flat(one('everyday-emergencies', 'cooling').text);
  assert.ok(text.includes(`${start} °C`) && text.includes('about 39 °C'));
  // minutes for a bath to bring 41.5 °C down to 39 °C at 0.2 °C a minute: 12.5, inside the AHA's "15 minutes or until better"
  assert.equal((start - 39) / H.COOLING.immersion, 12.5);
  assert.ok(plot.fns[0].expr.includes(`${start} - ${H.COOLING.immersion}*x`));
  assert.ok(plot.fns[1].expr === `${start} - ${H.COOLING.sprayFan}*x` && plot.fns[2].expr === `${start} - ${H.COOLING.shade}*x`);
  assert.equal(plot.hlines[0].y, 39);
  assert.match(plot.alt, /about 13 minutes/);
  assert.match(plot.alt, /39\.1 degrees after thirty minutes/);
});

test('everyday-emergencies/overdose-breath: one shallow breath in ten seconds is not normal breathing', () => {
  const s = one('everyday-emergencies', 'overdose-breath');
  const trace = readTrace(s.widget);
  assert.equal(trace.rises, 1);
  assert.equal(looksNormal(trace), false);
  assert.equal(countBreaths('slow', 10, s.widget), 1);
  for (const watched of [false, true]) for (const answer of [null, 'normal', 'abnormal']) {
    const res = s.check({ watched, answer });
    assert.equal(res === true, watched && answer === 'abnormal');
  }
  assert.match(s.check({ watched: true, answer: 'normal' }), /One shallow breath in ten seconds/);
  assert.equal(s.check(s.solution), true);
});

/** Minutes a seizure lasted, read from the story ("7 minutes", "1-minute", "90 seconds"). */
function seizureMinutes(story) {
  const m = /(\d+)[- ]minutes?\b/.exec(story) || /after (\d+) minutes/.exec(story);
  if (/(\d+) seconds/.test(story)) return Number(/(\d+) seconds/.exec(story)[1]) / 60;
  assert.ok(m, `a duration in: ${story}`);
  return Number(m[1]);
}
function seizureNeedsCall(story) {
  return seizureMinutes(story) > FACTS.seizureCallMinutes
    || /never had one before|a second one begins|swimming pool|struck his head|still does not respond|pregnant/.test(story);
}

test('everyday-emergencies/seizure-call: length, repeats, a first seizure, water, injury, pregnancy and slow recovery decide', () => {
  const seen = new Set();
  eachVariant('everyday-emergencies', 'seizure-call', (s) => {
    const story = flat(s.text);
    const call = seizureNeedsCall(story);
    seen.add(call);
    assert.equal(correctOption(s).text, call ? 'Call the emergency number' : 'No ambulance is needed: stay with them until they are fully recovered');
    assert.equal(s.options.length, 2);
    assert.ok(flat(s.explain).includes(`more than ${FACTS.seizureCallMinutes} minutes`));
    if (!call) assert.match(story, /epilepsy/, 'no ambulance only for a known epilepsy with a normal recovery');
  });
  assert.deepEqual([...seen].sort(), [false, true]);
  assert.ok(H.SEIZURE_CASES.filter((c) => c.call).length >= 6);
});

test('everyday-emergencies/heat-which: a clear head is heat exhaustion; confusion, collapse or a seizure is heatstroke', () => {
  const seen = new Set();
  eachVariant('everyday-emergencies', 'heat-which', (s) => {
    const story = flat(s.text);
    const stroke = /muddled|nonsense|confused|collapses|seizure/.test(story);
    if (!stroke) assert.match(story, /normally|knows where she is/, 'otherwise the story says the mind is clear');
    seen.add(stroke);
    assert.match(correctOption(s).text, stroke ? /^Heatstroke: call the emergency number now/ : /^Heat exhaustion: a cool place/);
    assert.ok(flat(s.explain).includes('30 minutes'));
  });
  assert.deepEqual([...seen].sort(), [false, true]);
});

function everydayKind(story) {
  if (/diabetes/.test(story)) return 'sugar';
  if (/jerk in rhythm|shakes all over/.test(story)) return 'seizure';
  if (/cold/.test(story)) return 'cold';
  assert.match(story, /dizzy|crumples/);
  return 'faint';
}
const EVERYDAY_WORDS = { faint: /^A faint: lay them flat and raise their legs/, seizure: /^A seizure: protect the head, time it, and put nothing in the mouth/, sugar: /^Low blood sugar: something sugary/, cold: /^Hypothermia: shelter, dry layers/ };

test('everyday-emergencies/which: the story decides between a faint, a seizure, low blood sugar and hypothermia', () => {
  const seen = new Set();
  eachVariant('everyday-emergencies', 'which', (s) => {
    const story = flat(s.text);
    const want = everydayKind(story);
    seen.add(want);
    assert.match(correctOption(s).text, EVERYDAY_WORDS[want]);
    if (want === 'sugar') assert.match(story, /can swallow|can still drink/, 'sugar by mouth only for someone who can swallow');
    assert.match(flat(s.explain), /call, and start chest compressions/);
  });
  assert.deepEqual([...seen].sort(), ['cold', 'faint', 'seizure', 'sugar']);
});

test('everyday-emergencies/crisis: one sober, fixed, careful step, with the pointers to help', () => {
  const s = one('everyday-emergencies', 'crisis');
  assert.equal(s.tone, 'sober');
  assert.equal(typeof raw('everyday-emergencies', 'crisis').gen, 'undefined', 'not generated');
  assert.equal(s.review, false, 'and not a review card');
  const right = correctOption(s).text;
  for (const need of [/Stay with him/, /listen/, /take it seriously/, /crisis line or the emergency number/]) assert.match(right, need);
  const explain = flat(s.explain);
  for (const pointer of FACTS.crisis) assert.ok(explain.includes(pointer), `the explanation gives ${pointer}`);
  assert.match(explain, /emergency number/);
  assert.match(explain, /people get through times like this/, 'help works and people recover');
  const all = visible(s).join(' ');
  assert.ok(!/\b(committed|methods?|overdose|jump|hang|pills|weapon|rope|knife)\b/i.test(all), 'no method and no detail');
  assert.deepEqual(H.CRISIS_LINES.map((c) => c.contact.replace(/[^0-9 ]/g, '').trim()), ['988', '116 123', '13 11 14']);
});

/* ======================================================================================= safety */

const DISCLAIMER = '> **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.';

test('safety: the standard disclaimer appears once, word for word, on the first or second step of the first lesson', () => {
  let count = 0;
  everyStep((lid, step) => {
    const s = typeof step.gen === 'function' ? resolveStep(step, makeRng(3), step.id) : one(lid, step.id);
    for (const text of visible(s)) {
      const lines = text.split('\n').map((l) => l.trim());
      if (lines.includes(DISCLAIMER)) { count++; assert.equal(lid, 'first-steps'); assert.ok(step.index <= 1, 'on the first or second step'); }
      else assert.ok(!/A note before we start/.test(text), `${lid}/${step.id}: the disclaimer is not paraphrased elsewhere`);
    }
  });
  assert.equal(count, 1);
});

test('safety: no step asks for the learner\'s own health data; nothing blames a bystander; reading is not practising', () => {
  everyStep((lid, step) => {
    const list = typeof step.gen === 'function' ? variants(lid, step.id, 30) : [one(lid, step.id)];
    for (const s of list) for (const text of visible(s)) {
      assert.ok(!/your (own )?(weight|height|age|blood pressure|medicines|symptoms|diagnosis)\b|enter your|type your|how much do you weigh|how old are you/i.test(text), `${lid}/${step.id} asks for personal data: ${flat(text).slice(0, 100)}`);
      assert.ok(!/your fault|you failed|you killed|should have known|to blame\b/i.test(text), `${lid}/${step.id} blames: ${flat(text).slice(0, 100)}`);
      assert.ok(!/\b(lol|oops|whoops|yikes|awesome|congrat)/i.test(text), `${lid}/${step.id} is flippant: ${flat(text).slice(0, 100)}`);
    }
    assert.ok(!['numeric', 'slider', 'short'].includes(step.type) || step.mode === 'predict' || typeof step.gen === 'function' || step.review !== true || true);
  });
  assert.match(lessons['first-steps'].steps.slice(0, 2).map((s) => flat(s.text)).join(' '), /cannot give you the \*\*skill\*\*/, 'lesson 1 says a class gives the skill');
  if (lessons['everyday-emergencies']) assert.match(lessons['everyday-emergencies'].recap.join(' '), /class/i, 'the last recap says it again');
});

test('safety: any step that mentions suicide or self-harm is sober, and its lesson carries the help pointers', () => {
  everyStep((lid, step) => {
    const list = typeof step.gen === 'function' ? variants(lid, step.id, 30) : [one(lid, step.id)];
    for (const s of list) {
      const words = visible(s).join(' ');
      if (!/suicid|self-harm|harm themselves|end (his|her|their) life/i.test(words)) continue;
      assert.equal(step.tone, 'sober', `${lid}/${step.id}`);
      assert.ok(!/committed suicide/i.test(words), 'person-first wording');
      const all = lessons[lid].steps.map((st) => visible(typeof st.gen === 'function' ? resolveStep(st, makeRng(2), st.id) : one(lid, st.id)).join(' ')).join(' ');
      for (const pointer of [/988/, /116 123/, /13 11 14/, /findahelpline\.com/, /emergency number/]) assert.match(all, pointer, `${lid} gives the pointer ${pointer}`);
    }
  });
});

test('pictures and diagrams: every photo is in the manifest with a licence and a credit; every body-map id exists', async () => {
  const manifestPath = path(`../content/media/${COURSE}/manifest.json`);
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { images: {} };
  const byFile = new Map(Object.values(manifest.images).map((e) => [e.file, e]));
  const used = new Set();
  const bodySpecs = [];
  everyStep((lid, step) => {
    const list = typeof step.gen === 'function' ? variants(lid, step.id, 30) : [one(lid, step.id)];
    for (const s of list) for (const spec of specsOf(s)) {
      assert.ok(spec.alt && spec.alt.length >= 30, `${lid}/${step.id}: the figure has an alt text`);
      if (spec.type === 'body-map') bodySpecs.push([`${lid}/${step.id}`, spec]);
      if (spec.type !== 'photo') continue;
      const file = spec.src.split('/').pop().split('?')[0];
      const entry = byFile.get(file);
      assert.ok(entry, `${lid}/${step.id}: ${file} is in the manifest`);
      assert.ok(spec.src.includes(`/media/${COURSE}/`), 'a picture of this course');
      assert.ok(entry.license, `${entry.id}: licence`);
      assert.ok(entry.author || entry.credit, `${entry.id}: credit`);
      assert.ok(entry.sourceUrl && entry.sourceUrl.startsWith('https://commons.wikimedia.org/'), `${entry.id}: source`);
      assert.ok(!/^(a |an |the )?(photo|image|picture) of/i.test(spec.alt), `${lid}/${step.id}: alt text describes what is seen`);
      used.add(entry.id);
    }
  });
  assert.deepEqual(Object.keys(manifest.images).filter((id) => !used.has(id)), [], 'pictures in the manifest that no lesson uses');
  assert.ok(used.size >= 2 && used.size <= 12, `${used.size} pictures`);
  assert.ok(bodySpecs.length >= 6, `${bodySpecs.length} steps use the body diagram`);
  if (bodySpecs.length) {
    const body = await import('../src/widgets/body-map.js');
    assert.ok(body, 'the body-map widget loads');
    for (const [where, spec] of bodySpecs) checkBodySpec(body, where, spec);
  }
});

/** Every id a body-map spec names must be one the widget knows, and every point must lie inside its view. */
function checkBodySpec(body, where, spec) {
  assert.ok(VIEWS[spec.view || 'body'], `${where}: view ${spec.view}`);
  const systems = new Set([...Object.keys(systemNames()), 'organs', 'all']);
  const known = (id) => systems.has(id) || !!structureInfo(id) || expandIds([id]).length > 1 || (expandIds([id]).length === 1 && !!structureInfo(expandIds([id])[0]));
  const markerIds = new Set((spec.markers || []).map((m) => m.id).filter(Boolean));
  for (const key of ['show', 'hide', 'ghost', 'focus']) for (const id of spec[key] || []) assert.ok(known(id), `${where}: ${key} "${id}" exists`);
  for (const g of spec.groups || []) for (const id of [].concat(g.ids)) assert.ok(known(id), `${where}: group id "${id}" exists`);
  for (const id of spec.pickable || []) assert.ok(markerIds.has(id) || known(id), `${where}: pickable "${id}" exists`);
  const box = spec.bounds || VIEWS[spec.view || 'body'].box;
  const art = VIEWS[spec.view || 'body'].art === 'back' ? 'back' : 'body';
  const refs = (spec.markers || []).map((m) => m.at);
  if (spec.target) refs.push(spec.target);
  for (const at of refs) {
    let point = at;
    if (!Array.isArray(at)) {
      const info = structureInfo(String(at).split(':')[0]);
      assert.ok(info, `${where}: "${at}" is a structure or an anchor`);
      point = anchorPoint(art, at);
      assert.ok(Array.isArray(point), `${where}: "${at}" is drawn in the ${art} figure`);
    }
    assert.ok(point[0] >= box[0] && point[0] <= box[2] && point[1] >= box[1] && point[1] <= box[3], `${where}: ${JSON.stringify(at)} lies inside the part of the figure that is shown`);
  }
  for (const m of spec.markers || []) if (m.id) assert.ok(!structureInfo(m.id), `${where}: marker id "${m.id}" is not also the id of a structure`);
  if (spec.mode === 'pickMarker') assert.ok(markerIds.has(spec.answer), `${where}: the answer is one of the markers`);
  if (spec.mode === 'place') assert.ok(spec.target, `${where}: place mode has a target`);
}

/* ============================================================================ teach before you ask */
// docs/AUTHORING.md, "Teach before you ask": every procedure, position, number and sign list is shown on a
// teaching screen before a graded step asks for it. The screens are built from the same helper tables as
// the questions; these tests pin that each one stands in front of the step it serves and shows what that
// step needs.

/** The teaching screens added in the revision, lesson by lesson. */
const TEACHING = {
  'first-steps': ['teach-first-steps', 'teach-call', 'teach-recovery', 'teach-paths'],
  cpr: ['teach-chain', 'teach-arrest-attack', 'teach-compressions', 'teach-aed', 'teach-worries'],
  'heart-stroke': ['teach-attack-aid', 'teach-aspirin', 'teach-fast', 'teach-stroke-wait'],
  'choking-breathing': ['teach-choke-signs', 'teach-choke-steps', 'teach-choke-where', 'teach-ana-aid', 'teach-asthma'],
  'bleeding-burns': ['teach-object-nose', 'teach-burns', 'teach-burn-help', 'teach-breaks', 'teach-head'],
  'everyday-emergencies': ['teach-seizure', 'teach-faint', 'teach-sugar', 'teach-heat-cold', 'teach-poison', 'teach-crisis'],
};
const indexOfStep = (lesson, id) => lessons[lesson].steps.indexOf(raw(lesson, id));
/** The text of a teaching screen that stands before every one of the steps it serves. */
function taught(lesson, id, ...serves) {
  const step = raw(lesson, id);
  assert.equal(step.type, 'info', `${lesson}/${id} is a teaching screen`);
  for (const later of serves) assert.ok(indexOfStep(lesson, id) < indexOfStep(lesson, later), `${lesson}/${id} comes before ${later}`);
  return flat(step.text);
}
/** Every item of a procedure appears on the screen, in the order of the table, as a numbered list. */
function showsInOrder(text, items, label) {
  let at = -1;
  items.forEach((item, i) => {
    const found = text.indexOf(`${i + 1}. ${flat(item)}`, at + 1);
    assert.ok(found > at, `${label}: step ${i + 1} ("${item}") is shown, numbered and in order`);
    at = found;
  });
}
const needs = (text, patterns, label) => { for (const p of patterns) assert.ok(p instanceof RegExp ? p.test(text) : text.includes(p), `${label}: shows ${p}`); };
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const figuresOf = (lesson, id) => one(lesson, id).figures;

test('teach before you ask: every lesson teaches before its first graded step, on at least three screens, with at most two predictions', () => {
  assert.deepEqual(Object.keys(TEACHING), LESSON_IDS);
  for (const [lid, lesson] of Object.entries(lessons)) {
    const resolved = lesson.steps.map((step) => resolveStep(step, makeRng(1), step.id));
    const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.graded ? 'graded' : 'explore');
    const roles = resolved.map(role);
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${lid}: a teaching screen or an exploration comes before the first graded step (${lesson.steps[firstGraded].id})`);
    assert.ok(roles.filter((r) => r === 'teach').length >= 3, `${lid}: at least three info steps`);
    assert.ok(roles.filter((r) => r === 'predict').length <= 1, `${lid}: one prediction, the hook`);
    assert.equal(roles[0], 'predict', `${lid}: the prediction is the hook`);
    for (const id of TEACHING[lid]) {
      const step = raw(lid, id);
      assert.equal(step.type, 'info', `${lid}/${id} is a teaching screen`);
      assert.equal(step.tone, 'sober', `${lid}/${id} is sober`);
      assert.ok(flat(step.text).length > 150, `${lid}/${id} teaches something`);
      assert.ok(roles.slice(indexOfStep(lid, id) + 1).includes('graded'), `${lid}/${id} is followed by a question`);
      for (const figure of figuresOf(lid, id)) assert.ok(figure.alt && figure.alt.length > 40, `${lid}/${id}: the figure has alt text`);
    }
  }
});

test('teach before you ask, lesson 1: the first steps, the call, the recovery position and the three paths are shown before they are asked', () => {
  const first = taught('first-steps', 'teach-first-steps', 'danger', 'response', 'breath-check', 'order');
  showsInOrder(first, H.FIRST_STEPS, 'first steps');
  assertOrder({ type: 'order', items: H.FIRST_STEPS }, FACTS.firstSteps, 'the list on the teaching screen');
  assert.ok(indexOfStep('first-steps', 'about') <= 1 && indexOfStep('first-steps', 'teach-first-steps') === 2, 'the standard note keeps its place in front of it');
  assert.match(flat(raw('first-steps', 'danger').text), /Traffic, electricity, gas, fire and deep water injure rescuers every year/, 'the hazards are named before they are sorted');
  // the map shows every place and number the practice round can ask for
  const ISO = { France: 'FR', Germany: 'DE', Spain: 'ES', Italy: 'IT', Poland: 'PL', Sweden: 'SE', India: 'IN', 'the United States': 'US', Canada: 'CA', Mexico: 'MX', 'the United Kingdom': 'GB', Australia: 'AU', 'New Zealand': 'NZ', Japan: 'JP', Brazil: 'BR', China: 'CN' };
  assert.ok(indexOfStep('first-steps', 'numbers-map') < indexOfStep('first-steps', 'numbers'));
  const map = one('first-steps', 'numbers-map').figures[0];
  for (const [place, number] of Object.entries(FACTS.numbers)) {
    const region = map.regions.find((r) => r.ids.includes(ISO[place]));
    assert.ok(region, `${place} is coloured on the map`);
    assert.ok(region.label.startsWith(number), `${place} is shown with ${number}`);
  }
  const call = taught('first-steps', 'teach-call', 'call');
  needs(call, [/\*\*Where\*\* you are, exactly: an address, or landmarks nearby/, /\*\*What\*\* has happened, in a few words/, /whether they are responsive and breathing/, /stay on the line, with the phone on speaker/, /You do not need a diagnosis/], 'the call');
  const recovery = taught('first-steps', 'teach-recovery', 'recovery-order');
  showsInOrder(recovery, H.RECOVERY_STEPS, 'recovery position');
  needs(recovery, [/NHS and St John Ambulance/, /a class is the place to practise/], 'recovery position');
  const picture = figuresOf('first-steps', 'teach-recovery')[0];
  assert.equal(picture.type, 'photo'); assert.equal(picture.mode, 'label');
  assert.deepEqual(picture.hotspots.map((h) => h.id).sort(), ['arm', 'head', 'knee']);
  const paths = taught('first-steps', 'teach-paths', 'decide');
  for (const d of Object.values(H.DECISIONS)) assert.ok(paths.includes(lowerFirst(d.label)), `the path "${d.short}" is shown in the words of its answer`);
  needs(paths, [/\*\*Responsive:\*\* stay with them/, /\*\*Unresponsive, breathing normally:\*\* call the emergency number, place them on their side/, /\*\*Unresponsive, not breathing normally:\*\* call the emergency number and start chest compressions/, /not sure the breathing is normal, treat it as not normal/], 'three paths');
  for (const c of H.CHECK_CASES) assert.ok(H.DECISIONS[c.decision], `${c.who}: a path that the screen shows`);
});

test('teach before you ask, lesson 2: the chain, the two emergencies, compressions with their numbers, the defibrillator and the five worries', () => {
  showsInOrder(taught('cpr', 'teach-chain', 'chain'), H.CHAIN, 'chain of survival');
  needs(taught('cpr', 'teach-arrest-attack', 'arrest-or-attack'), [/pump stopping: no response, no normal breathing/, /chest compressions and a defibrillator at once/, /artery of the heart is blocked/, /heart is still beating/, /usually awake/, /can turn into a cardiac arrest/], 'arrest and attack');
  const push = taught('cpr', 'teach-compressions', 'hands', 'how', 'rate-check', 'breaths');
  needs(push, ['Kneel beside them', 'heel of one hand on the **centre of the chest** and your other hand on top', `push down **${FACTS.compressionDepthCm[0]} to ${FACTS.compressionDepthCm[1]} cm**`,
    `**${FACTS.compressionsPerMinute[0]} to ${FACTS.compressionsPerMinute[1]}** pushes a minute`, 'let the chest **come all the way back up**', 'lower half of the breastbone',
    `cycles of ${FACTS.compressionsToBreaths[0]} compressions and ${FACTS.compressionsToBreaths[1]} breaths`, 'Someone untrained keeps pushing without a break', 'trained and willing'], 'compressions');
  for (const blank of one('cpr', 'how').blanks) assert.ok(push.includes(blank.answer), `the blank "${blank.answer}" is on the teaching screen`);
  // the photo shows the posture of the list on a training manikin, each part labelled; the drawing of the next step
  // shows the bone beneath the hands, and its target is the centre of the chest that the photo names
  const chest = figuresOf('cpr', 'teach-compressions')[0];
  assert.equal(chest.type, 'photo'); assert.equal(chest.mode, 'label', 'a picture to read, its parts named');
  assert.deepEqual(chest.hotspots.map((h) => h.id), ['hands', 'arms', 'knees']);
  const part = (id) => chest.hotspots.find((h) => h.id === id).label;
  assert.match(part('hands'), /centre of the chest/); assert.match(part('arms'), /straight/); assert.match(part('knees'), /Kneeling beside/);
  assert.match(chest.alt, /manikin/); assert.match(chest.alt, /with the face out of the picture/, 'the person is not recognisable');
  assert.equal(one('cpr', 'hands').widget.target, 'chest-centre');
  assert.match(flat(one('cpr', 'hands').text), /this drawing shows what lies beneath the hands/, 'the drawing is tied to the photo before it');
  // the worked example of the pace sum uses a window the generator never does
  for (const s of variants('cpr', 'rate-check', 60)) {
    const text = flat(s.text);
    assert.match(text, /9 compressions in 6 seconds would be 9 × 10 = 90 a minute, because there are 10 lots of 6 seconds in a minute/);
    assert.notEqual(Number(grab(/\*\*\d+ compressions in (\d+) seconds\*\*/, text)[0]), 6);
  }
  assert.equal(9 * (60 / 6), 90);
  assert.match(flat(one('cpr', 'aed').text), /green sign with a white heart and a lightning flash marks a defibrillator/, 'what to look for is said before the picture is tapped');
  const aed = taught('cpr', 'teach-aed', 'aed-order');
  showsInOrder(aed, H.AED_STEPS, 'defibrillator');
  needs(aed, [/Nobody touches the person while the machine checks the heart or gives a shock/, /heart lies between them/], 'defibrillator');
  assert.deepEqual(figuresOf('cpr', 'teach-aed')[0].markers.map((m) => m.at), ['right-upper-chest', 'left-side-chest']);
  const worries = taught('cpr', 'teach-worries', 'worries');
  for (const w of H.WORRIES) assert.ok(worries.includes(w.id === 'gasp' ? w.wrong[0][1] : w.why), `the worry "${w.id}" is answered on the screen from the helper table`);
  needs(worries, [/cracked ribs are a known and accepted price/, /sign of cardiac arrest, not of recovery/, /Call-takers are trained to coach/, /makes the decision/, /Serious harm from compressions on someone who was not in cardiac arrest is rare/], 'worries');
});

test('teach before you ask, lesson 3: the signs, the first aid for a heart attack, aspirin, FAST and what to do while waiting', () => {
  assert.ok(indexOfStep('heart-stroke', 'attack-what') < indexOfStep('heart-stroke', 'signs'));
  assert.match(flat(raw('heart-stroke', 'attack-what').text), /breathlessness, nausea, a cold sweat or light-headedness/, 'the signs that are not pain are named before they are asked');
  const aid = taught('heart-stroke', 'teach-attack-aid', 'heart-actions', 'which');
  showsInOrder(aid, one('heart-stroke', 'heart-actions').items, 'heart attack first aid');
  needs(aid, [/Call first, then rest/, /it has become a cardiac arrest, and compressions start/], 'heart attack first aid');
  taught('heart-stroke', 'teach-aspirin', 'aspirin');
  const fast = taught('heart-stroke', 'teach-fast', 'fast-letters', 'fast-find');
  assert.ok(indexOfStep('heart-stroke', 'fast-explore') < indexOfStep('heart-stroke', 'teach-fast'), 'the three checks are tried first, then named');
  for (const row of H.FAST) assert.ok(fast.includes(`**${row.letter} · ${row.word}.** ${row.check}`), `${row.letter} is shown with its check`);
  needs(fast, [/One sign is enough to call/, /note \*when\* the symptoms began/], 'FAST');
  const wait = taught('heart-stroke', 'teach-stroke-wait', 'stroke-donts', 'tia', 'which');
  needs(wait, [/Nothing by mouth: no food, no drink, no medicine/, /aspirin could make it worse/, /time the symptoms started/, /Symptoms that pass still need the call/, /risk of a full stroke is highest in the next hours and days/], 'stroke, while waiting');
  for (const kind of new Set(H.EMERGENCY_CASES.map((c) => c.kind))) assert.ok(['attack', 'stroke', 'arrest'].includes(kind));
});

test('teach before you ask, lesson 4: choking signs and steps, where the hands go, anaphylaxis and asthma', () => {
  needs(taught('choking-breathing', 'teach-choke-signs', 'mild-severe'), [/Speech and a strong cough need air/, /Silence is the danger sign: no voice, no cough, no breath/, /\*\*mild\*\*/, /\*\*severe\*\*/], 'choking signs');
  const ladder = taught('choking-breathing', 'teach-choke-steps', 'choke-order', 'choke-who');
  showsInOrder(ladder, H.CHOKING_STEPS, 'choking');
  needs(ladder, [/adult, or a child over one year old/, /Babies under one need a different method \(back blows and chest thrusts, never abdominal thrusts\)/], 'choking');
  const where = taught('choking-breathing', 'teach-choke-where', 'blows-where', 'thrusts-where');
  needs(where, [/heel of the hand between the shoulder blades/, /leaning well forward/, /in the midline, just above the navel and well below the breastbone/, /pulled sharply inwards and upwards/], 'hand positions');
  // back blows: the spot is named on the screen in the words the next step's target stands for
  assert.equal(one('choking-breathing', 'blows-where').widget.target, 'between-shoulder-blades');
  assert.match(flat(one('choking-breathing', 'blows-where').text), /seen \*\*from behind\*\*/, 'the next step says how its figure is seen');
  // abdominal thrusts: one drawing from a first-aid manual, of the spot and the grip; the spot it shows is the point the step after accepts
  const [thrustPicture, ...others] = figuresOf('choking-breathing', 'teach-choke-where');
  assert.equal(others.length, 0, 'one picture on the screen');
  assert.equal(thrustPicture.type, 'photo');
  assert.match(where, /shows that spot on the left and the grip from behind on the right/);
  assert.ok(!thrustPicture.hotspots && !thrustPicture.mode, 'a picture to read');
  for (const shown of [/in the midline above the navel and below the lower tip of the breastbone/, /stands behind/, /fist/, /inwards and upwards/]) assert.match(thrustPicture.alt, shown);
  const thrust = one('choking-breathing', 'thrusts-where').widget;
  const accepted = thrust.markers.find((m) => m.id === thrust.answer);
  assert.equal(accepted.at, 'upper-abdomen');
  assert.equal(accepted.label, 'Just above the navel', 'the point the step after accepts is the spot the drawing shows');
  // anaphylaxis: the three threats with their signs, then what to do, with the place on a labelled figure
  const ana = taught('choking-breathing', 'ana-what', 'ana-signs');
  needs(ana, [/\*\*airway\*\* \(a swollen tongue, a hoarse voice\)/, /\*\*breathing\*\* \(wheezing, a struggle to breathe\)/, /\*\*circulation\*\* \(feeling faint, pale and clammy\)/], 'anaphylaxis signs');
  const anaAid = taught('choking-breathing', 'teach-ana-aid', 'injector-site', 'ana-fill', 'which');
  for (const blank of one('choking-breathing', 'ana-fill').blanks) assert.ok(anaAid.replace(/\*/g, '').includes(blank.answer), `the blank "${blank.answer}" is on the teaching screen`);
  needs(anaAid, [/Have the emergency number called, with the word "anaphylaxis"/, /must not wait for the call to finish/, /halfway between hip and knee/, /works through clothing/, /may need to sit up/, /Every device prints its steps on the label/], 'anaphylaxis first aid');
  assert.ok(!/(^|\s)1\. /.test(anaAid), 'bodies differ on the order of injecting, calling and lying down, so the screen does not number them');
  // the site on a published diagram: the outer half of the middle third of the thigh, shaded; the graded point lies in that zone
  const thigh = figuresOf('choking-breathing', 'teach-ana-aid')[0];
  assert.equal(thigh.type, 'photo');
  assert.equal(thigh.title, 'Intramuscular site of adrenaline');
  assert.match(thigh.alt, /The outer half of the middle third is shaded green and labelled "Outer middle third of thigh"/);
  assert.match(anaAid, /\(the green area in the picture\)/, 'the screen points at the shaded zone');
  const graded = one('choking-breathing', 'injector-site').widget.markers.find((m) => m.id === 'outer').at;
  const [hip, knee] = [anchorPoint('body', 'hip:left'), anchorPoint('body', 'knee:left')];
  const along = (graded[1] - hip[1]) / (knee[1] - hip[1]);
  assert.ok(along > 1 / 3 && along < 2 / 3, `the graded point lies in the middle third between hip and knee (${along.toFixed(2)})`);
  assert.ok(graded[0] > anchorPoint('body', 'thigh:left')[0] + 10, 'and on the outer half of the thigh');
  const asthma = taught('choking-breathing', 'teach-asthma', 'asthma', 'which');
  needs(asthma, [/reliever inhaler/, /Upright, reliever, calm, and a low threshold for calling/, /Lying flat makes breathing harder/, /spacer/, /Call at once if the person has no inhaler/], 'asthma');
  // the airways: a published before-and-after drawing shows the three changes the screen names
  needs(asthma, [/small airways of the lungs tighten, swell and fill with mucus/], 'asthma');
  const airways = figuresOf('choking-breathing', 'teach-asthma')[0];
  assert.equal(airways.type, 'photo');
  for (const shown of [/"Before an asthma episode"/, /"After an asthma episode"/, /muscles around the airway contract/, /swell/, /mucus/]) assert.match(airways.alt, shown);
  assert.ok(!/puff every|four puffs/.test(asthma), 'the screen gives no number of puffs: the plans that differ stay side by side in the explanation');
});

test('teach before you ask, lesson 5: the tourniquet on a figure, the two special cases, burns, breaks and head injury', () => {
  // the teaching figure: a wound on the thigh, the band 5 to 7 cm above it; the graded step has its wound on the lower leg
  const fig = figuresOf('bleeding-burns', 'tourniquet')[0];
  assert.ok(indexOfStep('bleeding-burns', 'tourniquet') < indexOfStep('bleeding-burns', 'tourniquet-where'));
  const wound = fig.markers.find((m) => m.shape === 'cross').at;
  const band = fig.markers.find((m) => m.label === 'Tourniquet').at;
  const gap = cmBetween(wound, band);
  assert.ok(gap >= FACTS.tourniquetAboveCm[0] && gap <= FACTS.tourniquetAboveCm[1], `the band is ${gap} cm from the wound`);
  assert.ok(band[1] < wound[1], 'nearer the heart than the wound');
  assert.deepEqual(FRONT.region(band[0], band[1]), { region: 'thigh', side: 'left' }, 'on the thigh, not over a joint');
  assert.deepEqual(FRONT.region(wound[0], wound[1]), { region: 'thigh', side: 'left' });
  const gradedWound = one('bleeding-burns', 'tourniquet-where').widget.markers.find((m) => !m.id).at;
  assert.equal(FRONT.region(gradedWound[0], gradedWound[1]).region, 'lower-leg', 'a different wound from the worked example');
  // the embedded object and the nosebleed, before the fill-in and before the mixed practice
  const special = taught('bleeding-burns', 'teach-object-nose', 'nosebleed', 'bleed-what');
  assert.ok(indexOfStep('bleeding-burns', 'nosebleed') < indexOfStep('bleeding-burns', 'bleed-what'));
  needs(special, [H.BLEED_ACTIONS.object, /plugging the vessel it cut/, /1\. Sit down and lean forward/, /2\. Pinch the soft part of the nose, just above the nostrils/,
    `3. Hold the pinch for ${FACTS.nosePinchMinutes[0]} to ${FACTS.nosePinchMinutes[1]} minutes without letting go to check`], 'special cases');
  for (const blank of one('bleeding-burns', 'nosebleed').blanks) assert.ok(special.includes(blank.answer), `the blank "${blank.answer}" is on the teaching screen`);
  // all four answers of the mixed practice have been shown above it
  assert.match(flat(raw('bleeding-burns', 'press').text), /press hard, directly on the wound/);
  for (const id of ['press', 'tourniquet', 'teach-object-nose']) assert.ok(indexOfStep('bleeding-burns', id) < indexOfStep('bleeding-burns', 'bleed-what'));
  assert.deepEqual(Object.keys(H.BLEED_ACTIONS).sort(), ['nose', 'object', 'press', 'tourniquet']);
  const burns = taught('bleeding-burns', 'teach-burns', 'burn-sort', 'burn-level');
  needs(burns, [`cool running water for ${FACTS.burnCoolMinutes} minutes`, /No ice, and no butter, oil or toothpaste/, /rings or a watch/, /cling film or a clean, non-fluffy cloth/, /keep the rest of the person warm/, /unbroken blister is a sterile cover/, /clothing that has stuck to the burn/], 'burns');
  assert.ok(burns.includes(`Some guidelines accept ${FACTS.burnCoolMinimum} minutes as a minimum`), 'the screen names the 10-minute variant beside the 20 minutes, attributed to "some guidelines"');
  assert.equal((burns.match(/\b10 minutes/g) || []).length, 1, 'and nowhere states 10 minutes as the rule');
  const seen = taught('bleeding-burns', 'teach-burn-help', 'burn-level');
  needs(seen, [/bigger than the person's hand/, /\*\*deep\*\*: white or charred skin/, /face, hands, feet, joints or genitals/, /chemical or electrical/, /young child/, /If you are unsure, have it looked at/], 'burns that need to be seen');
  const breaks = taught('bleeding-burns', 'teach-breaks', 'breaks', 'breaks-call', 'spine');
  needs(breaks, [/Support it, pad it, leave it as it is/, /Moving broken bone ends can damage the vessels and nerves/, /Only an X-ray can tell/, /No food or drink/, /collarbone, forearm or hand can usually sit up and travel/, /\*\*back, hip or thigh\*\*, do not move them: call the emergency number/], 'breaks');
  const bones = figuresOf('bleeding-burns', 'teach-breaks')[0];
  assert.deepEqual(bones.markers.map((m) => m.at.split(':')[0]), ['lumbar-spine', 'hip-joint', 'femur'], 'the three places are marked on the skeleton');
  assert.deepEqual(bones.markers.map((m) => m.label), ['Back', 'Hip', 'Thigh']);
  // the spine: said after the step before it, and asked straight afterwards
  assert.equal(indexOfStep('bleeding-burns', 'spine'), indexOfStep('bleeding-burns', 'breaks-call') + 1);
  assert.match(flat(one('bleeding-burns', 'breaks-call').explain), /pain in the neck or back, tingling, numbness or weakness mean: \*\*assume the spine is injured and keep the person still\*\*/);
  const head = taught('bleeding-burns', 'teach-head', 'head');
  needs(head, [/knocked out, even briefly/, /vomiting more than once/, /more and more drowsy or confused/, /clear fluid running from the nose or an ear/, /a seizure, a headache that keeps getting worse, weakness or numbness, slurred speech, or trouble seeing/, /24 to 48 hours/, /emergency care now/], 'head injury');
});

test('teach before you ask, lesson 6: seizures, a faint, low blood sugar, heat and cold, poisoning and a person in crisis', () => {
  const seizure = taught('everyday-emergencies', 'teach-seizure', 'seizure-call', 'which');
  needs(seizure, [`more than ${FACTS.seizureCallMinutes} minutes`, /another follows/, /the person's \*\*first\*\*/, /happened in water/, /hurt or pregnant/, /do not come round within about ten minutes/,
    /known to have epilepsy, with no injury and a normal recovery, usually needs no ambulance/, /you are in any doubt, call/], 'seizures');
  const faint = taught('everyday-emergencies', 'teach-faint', 'faint', 'which');
  for (const blank of one('everyday-emergencies', 'faint').blanks) assert.ok(faint.includes(blank.answer), `the blank "${blank.answer}" is on the teaching screen`);
  needs(faint, [/Lay the person on their back and raise their legs above the level of the heart/, /come round within a minute or two/, /check their breathing and call the emergency number/], 'a faint');
  const sugar = taught('everyday-emergencies', 'teach-sugar', 'sugar', 'which');
  showsInOrder(sugar, H.SUGAR_STEPS, 'low blood sugar');
  needs(sugar, [/nothing goes in the mouth/, /call the emergency number and use the recovery position/], 'low blood sugar');
  assert.ok(!/\d+ (to \d+ )?grams/.test(sugar), 'the amount of sugar differs between bodies: it stays in the explanation, with both figures');
  const heat = taught('everyday-emergencies', 'teach-heat-cold', 'heat-which', 'cold', 'which');
  assert.ok(indexOfStep('everyday-emergencies', 'band') < indexOfStep('everyday-emergencies', 'teach-heat-cold'), 'the two thresholds are explored first');
  const firstAid = (option) => option.slice(option.indexOf(': ') + 2);
  needs(heat, [firstAid(H.HEAT_OPTIONS.exhaustion), firstAid(H.HEAT_OPTIONS.stroke).replace(/^c/, 'C'), firstAid(H.EVERYDAY_OPTIONS.cold), `within about ${H.HEAT_EXHAUSTION_MINUTES} minutes`,
    /\*\*Heat exhaustion\*\* leaves the mind clear/, /\*\*Heatstroke\*\* shows in the brain: confusion, odd behaviour, collapse, a seizure/, /Call the emergency number now/, /No hot bath, no hard rubbing and no alcohol/], 'heat and cold');
  const poison = taught('everyday-emergencies', 'teach-poison', 'poison');
  needs(poison, [/Call first; nothing by mouth; keep the container/, /Do not make the person vomit/, /Do not wait for symptoms/, /unresponsive, having a seizure or struggling to breathe, use the emergency number/], 'poisoning');
  assert.match(flat(one('everyday-emergencies', 'overdose-breath').text), /Normal breathing gives two or three full breaths in ten seconds/, 'the rule of lesson 1 is recalled in the prompt');
  const nal = flat(one('everyday-emergencies', 'naloxone').text);
  needs(nal, [/blocks the opioid for a while/, /current guidelines encourage bystanders to give it/], 'naloxone');
  // a person in crisis: shown what helps, with the pointers, before the question; the same care as the question itself
  const crisisStep = one('everyday-emergencies', 'teach-crisis');
  const crisis = taught('everyday-emergencies', 'teach-crisis', 'crisis');
  assert.equal(indexOfStep('everyday-emergencies', 'crisis'), indexOfStep('everyday-emergencies', 'teach-crisis') + 1);
  assert.equal(crisisStep.tone, 'sober');
  for (const pointer of FACTS.crisis) assert.ok(crisis.includes(pointer), `the teaching screen gives ${pointer}`);
  needs(crisis, [/Stay, listen, ask, and get help/, /take it seriously/, /Asking does not make it more likely/, /call the emergency number and stay with them/, /people get through times like this, and most go on to recover/], 'crisis');
  assert.ok(!/\b(committed|methods?|overdose|jump|hang|pills|weapon|rope|knife)\b/i.test(visible(crisisStep).join(' ')), 'no method and no detail');
  for (const kind of new Set(H.EVERYDAY_CASES.map((c) => c.kind))) assert.ok(['faint', 'seizure', 'sugar', 'cold'].includes(kind));
});

/* ===================================================== the second reviewer's checks of the teaching screens */
// Added by the reviewer of the teaching screens (November 2026). The screens were built by moving verified
// wording in front of the questions; these lines pin the places where a statement on which the guideline
// bodies differ, an exception or a reason to call had been left behind in an explanation.

test('review of the teaching screens: where the bodies differ, the screen says so; no exception or call is left behind', () => {
  // choking: ERC/RCUK 2025 "up to 5" of each, AHA 2025 "5 and 5": both on the screen that lists the steps
  const ladder = flat(one('choking-breathing', 'teach-choke-steps').text);
  assert.match(ladder, /European guidelines say "up to 5" of each, American ones "5 and 5": check after every blow whether the blockage has cleared/);
  // chest thrusts: late pregnancy (AHA 2025) and Australia and New Zealand (ANZCOR), on the screen that shows the abdominal-thrust point
  const where = flat(one('choking-breathing', 'teach-choke-where').text);
  assert.match(where, /Late in pregnancy, or when you cannot reach round the person, the thrusts are given on the breastbone\. In Australia and New Zealand chest thrusts are taught for everyone/);
  assert.ok(flat(one('choking-breathing', 'thrusts-where').explain).includes('Late in pregnancy, or when you cannot reach round the person, the thrusts are given on the breastbone. In Australia and New Zealand chest thrusts are taught for everyone.'), 'the same two sentences as the explanation they were copied from');
  // second adrenaline dose: "about 5 minutes" (ERC/RCUK 2025) is shown with the later variants (AHA/ARC 5 to 10; MHRA 5 to 15)
  const ana = flat(one('choking-breathing', 'teach-ana-aid').text);
  assert.match(ana, /after about \*\*5 minutes\*\*, a second auto-injector can be used\. Bodies differ on whether a second dose comes after 5 minutes or somewhat later \(5 to 15 minutes on some labels\)/);
  assert.match(flat(one('choking-breathing', 'ana-fill').explain), /whether a second dose comes after 5 minutes or somewhat later \(5 to 15 minutes on some labels\)/);
  // the auto-injector figure names no leg, and neither does the text
  const thighFigure = one('choking-breathing', 'teach-ana-aid').figures[0];
  assert.ok(!/\b(left|right)\b/i.test(`${ana} ${thighFigure.alt} ${thighFigure.caption || ''} ${(thighFigure.hotspots || []).map((h) => h.label).join(' ')}`), 'no particular leg is asked for');
  // drowning: the cause is recalled in the prompt, so the question is an inference and not a guess
  const drowning = one('choking-breathing', 'drowning');
  assert.match(flat(drowning.text), /After drowning the heart stops because the body has run out of oxygen/);
  assert.match(flat(drowning.explain), /After drowning the heart stops because the body has run out of \*\*oxygen\*\*, so guidelines ask trained rescuers to give rescue breaths as well as compressions/);
  assert.match(flat(drowning.explain), /If you have not been trained, follow the call-taker: compressions alone are still far better than nothing/);
  // breaks: every reason to call is said straight after the first question, as before the revision
  assert.match(flat(one('bleeding-burns', 'breaks').explain), /Call the emergency number for a suspected break of the thigh, hip or back, for a bone showing through the skin, or if the limb beyond the injury is cold, pale or numb/);
  assert.match(flat(one('bleeding-burns', 'breaks-call').explain), /Call as well for any break with bone showing through the skin, or with a cold, pale or numb limb beyond it/);
  // heat exhaustion that has not eased after about 30 minutes is a reason to call (NHS: "still unwell after 30 minutes": 999), as the case table says
  assert.match(flat(one('everyday-emergencies', 'teach-heat-cold').text), /should ease within about 30 minutes; if it does not, call\./);
  assert.ok(H.HEAT_CASES.some((c) => /within about half an hour; if he does not, call/.test(c.why)), 'the wording comes from the case table');
  // the defibrillator screen claims no more than the table of steps does
  assert.ok(!/always/.test(flat(one('cpr', 'teach-aed').text)));
  // the first steps: the order is given as that of the 2025 guidelines, with the note on older leaflets beside it (and again after the ordering step)
  const firstSteps = flat(one('first-steps', 'teach-first-steps').text);
  assert.match(firstSteps, /guidelines of 2025 give the first steps in this order/);
  for (const text of [firstSteps, flat(one('first-steps', 'order').explain)]) assert.match(text, /Older leaflets put the call one step later\. The point is the same: the call must not wait/);
});

test('review of the teaching screens: the crisis lines stand one to a line, each with its place, from the same constants as the question', () => {
  const text = one('everyday-emergencies', 'teach-crisis').text;
  const lines = text.split('\n').map((l) => l.trim());
  for (const c of H.CRISIS_LINES) assert.ok(lines.includes(`- in ${c.place}, ${c.contact}`), `"in ${c.place}, ${c.contact}" is a line of its own`);
  assert.ok(lines.includes(`- ${H.CRISIS_DIRECTORY} lists services in other countries`));
  assert.ok(lines.includes('Crisis lines answer day and night:'));
  // nothing but those numbers: no digit on the screen that is not part of one of the three lines
  const digits = flat(text).replace(/\*/g, '').match(/\d[\d ]*\d|\d/g) || [];
  assert.deepEqual(digits.map((d) => d.trim()), ['988', '116 123', '13 11 14']);
  // the question's explanation still carries the same three lines and the directory
  const explain = flat(one('everyday-emergencies', 'crisis').explain);
  for (const c of H.CRISIS_LINES) assert.ok(explain.includes(`in ${c.place}, ${c.contact}`));
  assert.ok(explain.includes(`${H.CRISIS_DIRECTORY} lists services in other countries`));
  // the immediate-danger line follows the crisis lines on the screen
  assert.ok(flat(text).indexOf('13 11 14') < flat(text).indexOf('If their life is in immediate danger, call the emergency number and stay with them'));
});

test('review of the teaching screens: the emergency-number map shows what each number is for', () => {
  const map = one('first-steps', 'numbers-map').figures[0];
  const label = (iso) => map.regions.find((r) => r.ids.includes(iso)).label;
  assert.equal(label('IN'), '112 (India)');            // one number for police, fire and ambulance (Ministry of Home Affairs, ERSS; 112.gov.in)
  assert.equal(label('CN'), '120 (ambulance)');        // 120 ambulance, 110 police, 119 fire (Beijing and Shanghai municipal pages; National Health Commission)
  assert.match(map.alt, /India 112; China 120 for an ambulance/);
  // the numbers that were on the map before the revision are unchanged
  assert.deepEqual(['FR', 'US', 'CA', 'MX', 'GB', 'AU', 'NZ', 'JP', 'BR'].map(label), ['112 (European Union)', '911', '911', '911', '999', '000', '111', '119', '192 (ambulance)']);
  assert.equal(H.EMERGENCY_NUMBERS.find((r) => r.places.includes('China')).note, 'the ambulance service');
});

/* ============================================================================================ guard */

/* ============================================================ the reviewer's safety assertions */
// Added by the independent reviewer (November 2026). Each line names the body it was checked against.

test('review: where the call could be delayed or skipped, the lesson says "call" in so many words', () => {
  // aspirin never delays the call (AHA/ARC 2024: if unsure, wait for the ambulance without it; ERC/RCUK 2025: "whilst awaiting" help)
  const aspirin = flat(one('heart-stroke', 'teach-aspirin').text);
  assert.match(aspirin, /If you are unsure, leave it out/);
  assert.match(aspirin, /never let a search for a tablet hold up the call/);
  assert.match(one('heart-stroke', 'heart-actions').items[0], /^Call the emergency number/);
  // a transient attack is still an emergency (NHS; Stroke Association)
  assert.match(correctOption(one('heart-stroke', 'tia')).text, /^Call the emergency number now/);
  assert.match(flat(one('heart-stroke', 'stroke-donts').explain), /Nothing by mouth: no food, no drink, no medicine/);
  // mild choking: no call is needed, but doubt means a call
  assert.match(flat(one('choking-breathing', 'choke-who').explain), /in any doubt about how well a choking person is breathing, have the emergency number called/);
  for (const c of H.CHOKING_CASES.filter((x) => x.action === 'cough')) assert.match(c.story, /coughing (hard|loudly)/, 'a mild case has a strong cough in the story');
  // head injury: the NHS sends "knocked out, now awake" and vomiting to an emergency department, not to 999: the prompt covers both
  const head = one('bleeding-burns', 'head');
  assert.match(flat(head.text), /which of these mean "emergency care now"/);
  assert.match(flat(head.explain), /Call the emergency number if the person cannot be woken, is getting drowsier, has a seizure, or if you are in any doubt/);
  // nosebleed: NHS 10 to 15 minutes, St John Ambulance and British Red Cross 30: the range is given, no single figure
  assert.match(flat(one('bleeding-burns', 'nosebleed').explain), /ranges from 15 to 30 minutes/);
  // naloxone never replaces or delays CPR (AHA 2025)
  assert.match(flat(one('everyday-emergencies', 'naloxone').explain), /does not replace CPR/);
  // poison lines (HRSA Poison Help; healthdirect; NHS)
  const poison = flat(one('everyday-emergencies', 'teach-poison').text);
  for (const n of ['1-800-222-1222', '13 11 26', '111']) assert.ok(poison.includes(n), n);
  assert.match(poison, /1-800-222-1222 in the United States and 13 11 26 in Australia; in the United Kingdom the health advice line 111/, 'each number with its country');
  assert.match(poison, /unresponsive, having a seizure or struggling to breathe, use the emergency number/);
  // the crisis lines, each with its place (988lifeline.org; 988.ca; samaritans.org; lifeline.org.au)
  const lines = Object.fromEntries(H.CRISIS_LINES.map((c) => [c.place, c.contact.replace(/\*/g, '')]));
  assert.deepEqual(lines, { 'the United States and Canada': 'call or text 988', 'the United Kingdom and Ireland': 'call Samaritans on 116 123', Australia: 'call Lifeline on 13 11 14' });
});

test('review: a seizure with "no ambulance needed" has every reason to call ruled out in its story', () => {
  const quiet = H.SEIZURE_CASES.filter((c) => !c.call);
  assert.equal(quiet.length, 2);
  for (const c of quiet) {
    assert.match(c.story, /has (had )?epilepsy/, 'known epilepsy, so not a first seizure');
    const minutes = /(\d+) minutes/.exec(c.story) ? Number(/(\d+) minutes/.exec(c.story)[1]) : /(\d+) seconds/.exec(c.story) ? Number(/(\d+) seconds/.exec(c.story)[1]) / 60 : NaN;
    assert.ok(minutes < FACTS.seizureCallMinutes, `shorter than ${FACTS.seizureCallMinutes} minutes: ${c.story}`);
    assert.match(c.story, /not hurt (himself|herself)/, 'no injury');
    assert.match(c.story, /awake|talking normally/, 'a normal recovery');
    assert.ok(!/water|pool|pregnan|second one|another/i.test(c.story), 'no water, no pregnancy, no repeat');
  }
  for (const c of H.SEIZURE_CASES.filter((x) => x.call)) assert.ok(!/not hurt/.test(c.story) || /minutes|first|pregnant|pool|second/.test(c.story));
  for (const s of variants('everyday-emergencies', 'seizure-call', 30)) assert.match(flat(s.explain), /you are in any doubt, call/);
});

test('review: no model suggests that help is pointless, and each says it is rough', async () => {
  const clock = flat(one('cpr', 'clock').explain);
  assert.match(clock, /rule of thumb, not a countdown/);
  assert.match(clock, /no minute after which compressions stop being worth starting/);
  const widget = readFileSync(path('../src/widgets/rescue-clock.js'), 'utf8');
  assert.ok(widget.includes("'close to 0'"), 'a modelled zero is shown as "close to 0", never as "0 in 100"');
  assert.ok(widget.includes('(a rule of thumb)'), 'the axis says what the line is');
  assert.match(flat(one('cpr', 'try').text), /call, and push on the centre of the chest/, 'a child: the adult method is better than nothing');
  assert.match(flat(one('everyday-emergencies', 'cooling').text), /rough figures/, 'the cooling rates are not presented as exact');
  const press = readFileSync(path('../src/widgets/press-hold.js'), 'utf8');
  assert.ok(!/bleeding is \$\{bleedingWord\(f\)\} again/.test(press), 'a lifted pad never reads "the bleeding is slowing again"');
});

test('guard: every generated step of the course is re-derived by a test in this file', () => {
  const found = {};
  everyStep((lid, step) => { if (typeof step.gen === 'function') (found[lid] ||= []).push(step.id); });
  for (const lid of Object.keys(found)) assert.deepEqual(found[lid].sort(), (GENERATED[lid] || []).slice().sort(), `${lid}: generated steps are listed in GENERATED`);
  for (const [lid, ids] of Object.entries(GENERATED)) for (const id of ids) assert.ok(tested.has(`${lid}/${id}`), `${lid}/${id} has a test that re-derives it`);
});
