#!/usr/bin/env node
/**
 * Read a lesson the way a learner meets it: one step after another, with what
 * is shown before the answer (SHOWN), what has to be done (ASK), and what is
 * only revealed afterwards (AFTER).
 *
 *   node tools/outline.mjs <course>              every lesson of a course
 *   node tools/outline.mjs <course>/<lesson>     one lesson
 *        [--brief]      cut long texts to about 200 characters
 *        [--seed 7]     which variant of generated steps to show (default 1)
 *        [--titles]     one line per step (id, kind, title): a quick view of what a course teaches
 *        [--pool]       for generated steps, also list every distinct question the generator
 *                       can produce (over 200 seeds): the whole pool has to be taught, not one variant
 *
 * Use it to check the rule in docs/AUTHORING.md, "Teach before you ask": go
 * down the list and, for each graded step, ask whether a learner who knows
 * only the course's prerequisites, its earlier lessons and the SHOWN and
 * AFTER texts above that step could work the answer out. If not, the lesson
 * is testing something it has not taught.
 *
 * The summary line of each lesson counts its teaching screens and names the
 * graded steps that come before any teaching ("cold").
 */
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
const brief = args.includes('--brief');
const pool = args.includes('--pool');
const titlesOnly = args.includes('--titles');
const seedAt = args.indexOf('--seed');
const seed = seedAt >= 0 ? Number(args[seedAt + 1]) || 1 : 1;
if (!target) { console.error('usage: node tools/outline.mjs <course>[/<lesson>] [--brief] [--seed n]'); process.exit(1); }
const [courseId, onlyLesson] = target.split('/');

const load = (p) => import(pathToFileURL(join(root, p)).href);
const { normalizeLesson, resolveStep } = await load('src/player/normalize.js');
const { makeRng } = await load('src/core/rng.js');
let course;
try { course = (await load(`content/courses/${courseId}/course.js`)).default; } catch { console.error(`No course "${courseId}" in content/courses.`); process.exit(1); }

const flat = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const cut = (s, n = 200) => { const t = flat(s); return brief && t.length > n ? `${t.slice(0, n)}…` : t; };
const words = (s) => flat(s).split(' ').filter(Boolean).length;

/** What a step is for the learner: a teaching screen, a guess, an activity or a graded question. */
function stepRole(step) {
  if (step.type === 'info') return step.teach ? 'teach' : 'closing';   // an info screen after the last task teaches nothing that is then used
  if (step.mode === 'predict') return Array.isArray(step.options) && !step.options.some((o) => o.correct) ? 'poll' : 'predict';   // a choice with no right option is an opinion poll
  if (step.type === 'reflect') return 'reflect';
  return step.graded ? 'graded' : 'explore';
}

function describeAnswer(s) {
  if (Array.isArray(s.options)) return s.options.map((o) => `${o.correct ? '✔' : '·'} ${cut(o.text || '(picture)', 70)}`).join('  ');
  if (s.type === 'order' && Array.isArray(s.items)) return `in order: ${s.items.map((x) => cut(x, 40)).join(' → ')}`;
  if (s.type === 'match' && Array.isArray(s.pairs)) return s.pairs.map((p) => `${cut(p[0] ?? p.left, 30)} ↔ ${cut(p[1] ?? p.right, 40)}`).join('; ');
  if (s.type === 'bucket' && Array.isArray(s.items)) return s.buckets.map((b, i) => `${b}: ${s.items.filter((it) => it.bucket === i).map((it) => cut(it.text, 30)).join(', ')}`).join(' | ');
  if (s.answer != null && typeof s.answer !== 'object') return `answer: ${s.answer}`;
  if (Array.isArray(s.blanks)) return `blanks: ${s.blanks.map((b) => (b.answers ? b.answers[0] : b.answer)).join(', ')}`;
  return '';
}

let lessons = course.chapters.flatMap((ch) => ch.lessons);
if (onlyLesson) lessons = lessons.filter((l) => l.id === onlyLesson);
if (!lessons.length) { console.error(`No lesson "${onlyLesson}" in ${courseId}.`); process.exit(1); }

for (const meta of lessons) {
  const mod = await load(`content/courses/${courseId}/lessons/${meta.id}.js`);
  const lesson = normalizeLesson(mod.default, courseId, meta.id);
  console.log(`\n${'='.repeat(78)}\n${courseId}/${meta.id} · ${meta.title}\n${'='.repeat(78)}`);
  let taught = 0; let teachScreens = 0; const cold = []; const roles = [];
  lesson.steps.forEach((raw, i) => {
    let s = raw;
    try { s = resolveStep(raw, makeRng(seed)); } catch { /* show the unresolved step */ }
    const role = stepRole(s);
    roles.push({ teach: 'T', closing: 'c', predict: 'p', poll: 'o', reflect: 'r', graded: 'G', explore: 'e' }[role]);
    const tags = [s.type, role === 'graded' ? 'GRADED' : role, s.review ? 'review' : null, raw.gen ? 'generated' : null, s.tone === 'sober' ? 'sober' : null].filter(Boolean).join(' · ');
    if (titlesOnly) {
      console.log(`${String(i + 1).padStart(3)}. [${s.id}] ${role}${s.title ? ` · ${s.title}` : ` · ${cut(s.text, 80).slice(0, 80)}`}`);
      if (role === 'graded' && taught === 0) cold.push(s.id);
      if (role === 'teach' || role === 'explore') taught += 1;
      if (role === 'teach') teachScreens += 1;
      return;
    }
    console.log(`\n${String(i + 1).padStart(2)}. [${s.id}] ${tags}${s.title ? ` · "${s.title}"` : ''}`);
    const figures = [...(s.figures || []).map((f) => f.type), s.widget ? `${s.widget.type} (the learner works in it)` : null].filter(Boolean);
    if (role === 'teach' || role === 'closing') console.log(`    SHOWN: ${cut(s.text, 600)}`);
    else console.log(`    ASK:   ${cut(s.text, 400)}`);
    if (figures.length) console.log(`    FIGURE: ${figures.join(', ')}`);
    const ans = role === 'teach' || role === 'closing' ? '' : describeAnswer(s);
    if (ans) console.log(`    ANSWER: ${ans}`);
    if (s.hints && s.hints.length) console.log(`    HINTS: ${s.hints.length}`);
    if (s.explain) console.log(`    AFTER: ${cut(s.explain, 400)}`);
    if (pool && typeof raw.gen === 'function') {
      const seenAsk = new Map();
      for (let k = 0; k < 200; k++) {
        let v; try { v = resolveStep(raw, makeRng(1000 + k * 7919 + i)); } catch { continue; }
        // one line per distinct question and right answer (the order and choice of wrong options does not matter here)
        const right = Array.isArray(v.options) ? v.options.filter((o) => o.correct).map((o) => flat(o.text || '(picture)')).join(' + ') : describeAnswer(v);
        const key = `${flat(v.text)} ⇒ ${right}`;
        if (!seenAsk.has(key)) seenAsk.set(key, true);
      }
      const list = [...seenAsk.keys()];
      console.log(`    POOL: ${list.length} distinct variant(s) in 200 seeds${list.length > 40 ? ' (first 40 shown)' : ''}`);
      list.slice(0, 40).forEach((t) => console.log(`      - ${t.length > 300 ? `${t.slice(0, 300)}…` : t}`));
    }
    if (role === 'graded' && taught === 0) cold.push(s.id);
    if (role === 'teach' || role === 'explore') taught += 1;
    if (role === 'teach') teachScreens += 1;
  });
  console.log(`\n   shape: ${roles.join('')}   (T teaching screen, e exploration, p prediction, G graded, r reflection, o opinion poll, c closing screen)`);
  console.log(`   ${lesson.steps.length} steps · ${teachScreens} teaching screen(s) · ${words(lesson.steps.filter((s) => s.type === 'info').map((s) => s.text).join(' '))} words taught before answers${cold.length ? ` · graded before any teaching: ${cold.join(', ')}` : ''}`);
}
