#!/usr/bin/env node
/**
 * Content validator. Checks every course and lesson without a browser:
 * structure, required fields, generated variants (many random seeds), TeX
 * that compiles, references to widgets that exist, photographs (alt text,
 * credit, a file that exists and is listed in the course's media manifest;
 * see docs/IMAGES.md) and a set of quality warnings drawn from
 * docs/AUTHORING.md.
 *
 *   node tools/validate.mjs                 # everything
 *   node tools/validate.mjs --course algebra
 *   node tools/validate.mjs --lesson algebra/lines
 *   node tools/validate.mjs --strict        # warnings fail the run too
 *   node tools/validate.mjs --seeds 50      # more random variants per generated step
 *
 * Exit code 1 if any errors were found. Interactive steps are fully
 * exercised by the browser-based tools/smoke.mjs.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeLesson, resolveStep, GRADED_TYPES } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { extractMath, mathError } from '../src/core/markdown.js';
import { equivalent } from '../src/core/mathexpr.js';
import { coverKeys } from '../src/ui/covers.js';
import { ICONS } from '../src/ui/icons.js';
import { verifyCourse as verifyMedia, creditWarnings } from './fetch-image.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

// Code steps are verified by really running their solution in the built-in interpreter.
let checkCodeStep = null;
if (existsSync(join(root, 'src/lang/check-code-step.js'))) {
  try { ({ checkCodeStep } = await import(pathToFileURL(join(root, 'src/lang/check-code-step.js')).href)); } catch (e) { console.warn('Could not load the code-step checker:', e.message); }
}
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };
const onlyCourse = opt('course');
const onlyLesson = opt('lesson');
const strict = !!opt('strict');
const quiet = !!opt('quiet');
const SEEDS = Number(opt('seeds')) || 20;

const HUES = ['blue', 'red', 'green', 'orange', 'violet', 'teal', 'pink', 'yellow', 'gray'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

let errors = 0;
let warnings = 0;
const report = [];
const err = (where, msg) => { errors++; report.push({ level: 'error', where, msg }); };
const warn = (where, msg) => { warnings++; report.push({ level: 'warn', where, msg }); };

/* ------------------------------------------------------------ text checks */

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
const BARE_TEX = /(^|[^\\A-Za-z])(frac|dfrac|tfrac|sqrt|text|binom|mathbb|mathrm|overline|times|cdot|approx|infty|neq|leq|geq|alpha|beta|theta|Delta|quad)(?![A-Za-z])/;

function checkText(where, field, value) {
  if (typeof value !== 'string' || !value) return;
  if (CONTROL.test(value) || /\t(?=[a-z])/.test(value)) {
    err(where, `"${field}" contains a control character — a TeX backslash was eaten by JavaScript. Write the string with the r tag: r\`…\``);
    return;
  }
  if (/\b(TODO|FIXME|lorem ipsum)\b/i.test(value)) warn(where, `"${field}" contains placeholder text`);
  let segments;
  try { segments = extractMath(value); } catch (e) { err(where, `"${field}": ${e.message}`); return; }
  for (const { tex, display } of segments) {
    const problem = mathError(tex, display);
    if (problem) { err(where, `"${field}" has TeX that does not compile: $${tex}$ — ${problem.replace(/^KaTeX parse error: /, '')}`); continue; }
    const stripped = tex.replace(/\\text\{[^}]*\}/g, '').replace(/\\(?:mathrm|operatorname)\{[^}]*\}/g, '');
    const m = BARE_TEX.exec(stripped);
    if (m) err(where, `"${field}": TeX command "${m[2]}" is missing its backslash in $${tex}$ (use the r tag for strings with TeX)`);
  }
  // A TeX command sitting in ordinary prose is printed exactly as typed.
  const prose = value.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ').replace(/\$\$[\s\S]*?\$\$/g, ' ').replace(/\\\$/g, ' ').replace(/\$[^$\n]*\$/g, ' ');
  const stray = /\\(?:frac|dfrac|tfrac|sqrt|mathbf|mathrm|text|times|cdot|blue|red|green|orange|violet|teal|pink|yellow|gray|begin|end|left|right|pi|theta|le|ge|ne|approx|to|infty)\b/.exec(prose);
  if (stray) warn(where, `"${field}" has the TeX command ${stray[0]} outside $…$ — it will be shown exactly as typed`);
  const dollars = (value.replace(/\\\$/g, '').match(/\$/g) || []).length;
  if (dollars % 2 === 1 && !segments.length) warn(where, `"${field}" has an unmatched $ — write \\$ for a literal dollar sign`);
}

function stringsOf(step) {
  const out = [];
  const add = (field, v) => { if (typeof v === 'string') out.push([field, v]); };
  add('title', step.title); add('text', step.text); add('explain', step.explain); add('template', step.template);
  add('model', step.model); add('prefix', step.prefix); add('unit', step.unit);
  (step.hints || []).forEach((hint, i) => add(`hints[${i}]`, hint));
  (step.options || []).forEach((o, i) => { add(`options[${i}].text`, o.text); add(`options[${i}].why`, o.why); });
  (step.items || []).forEach((it, i) => { if (typeof it === 'string') add(`items[${i}]`, it); else { add(`items[${i}].text`, it.text); add(`items[${i}].why`, it.why); } });
  (step.pairs || []).forEach((p, i) => { add(`pairs[${i}][0]`, p[0]); add(`pairs[${i}][1]`, p[1]); });
  (step.buckets || []).forEach((b, i) => add(`buckets[${i}]`, b));
  (step.wrong || []).forEach((w, i) => add(`wrong[${i}] message`, w[1]));
  for (const fig of step.figures || []) { add('figure.caption', fig.caption); }
  if (step.widget) add('widget.caption', step.widget.caption);
  return out;
}

const widgetExists = (type) => /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(type) && existsSync(join(root, 'src/widgets', `${type}.js`));

/* ----------------------------------------------------------------- photos */

let currentCourse = null;          // the course whose lesson is being checked
const mediaCache = new Map();      // course id -> { files: Map(file name -> { id, src }), used: Set(ids) } or null

/** The pictures a course owns: content/media/<course-id>/manifest.json, written by tools/fetch-image.mjs. */
function mediaOf(courseId) {
  if (!mediaCache.has(courseId)) {
    const file = join(root, 'content/media', courseId, 'manifest.json');
    let media = null;
    if (existsSync(file)) {
      try {
        const images = JSON.parse(readFileSync(file, 'utf8')).images || {};
        media = { files: new Map(), used: new Set(), ids: Object.keys(images) };
        for (const [id, e] of Object.entries(images)) {
          media.files.set(e.file, { id, src: e.src });
          if (e.small) media.files.set(e.small.file, { id, src: e.small.src });
        }
      } catch (e) { err(courseId, `content/media/${courseId}/manifest.json cannot be read: ${e.message}`); }
    }
    mediaCache.set(courseId, media);
  }
  return mediaCache.get(courseId);
}

/** One address of a picture: a file of this site, in this course's media folder, known to its manifest. */
function checkPhotoFile(where, what, src, field) {
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(src) || /^data:/i.test(src)) { err(where, `${what}: "${field}" must be a file of this site (content/media/…), never an address on another site`); return null; }
  const path = src.split('?')[0].replace(/^\.\//, '');
  const prefix = `content/media/${currentCourse}/`;
  if (!path.startsWith(prefix)) { err(where, `${what}: ${path} is not in this course's media folder (${prefix}). Add the picture to this course with tools/fetch-image.mjs`); return null; }
  if (!existsSync(join(root, path))) { err(where, `${what}: the file ${path} does not exist`); return null; }
  const media = mediaOf(currentCourse);
  const hit = media && media.files.get(path.slice(prefix.length));
  if (!hit) { err(where, `${what}: ${path} is not listed in content/media/${currentCourse}/manifest.json. Pictures may only be added with tools/fetch-image.mjs`); return null; }
  media.used.add(hit.id);
  if (hit.src !== src) err(where, `${what}: the address of ${path} does not match the manifest (was the picture replaced?). Build the spec with photo(MEDIA['${hit.id}'], …) instead of writing it out`);
  return hit.id;
}

/** A `photo` figure, widget or option figure (see src/widgets/photo.js and docs/IMAGES.md). */
function checkPhoto(where, spec, what, step) {
  const alt = typeof spec.alt === 'string' ? spec.alt.trim() : '';
  if (!alt) err(where, `${what}: a photo needs "alt": a sentence that says what the picture shows`);
  else if (/^(a |an |the )?(photo(graph)?|image|picture) of\b/i.test(alt)) warn(where, `${what}: "alt" should describe what is in the picture; drop the opening "${alt.split(/\s+/).slice(0, 3).join(' ')}"`);
  else if (alt.length < 12) warn(where, `${what}: "alt" is very short ("${alt}"); say what the picture shows`);
  if (alt && spec.caption && alt.toLowerCase() === String(spec.caption).trim().toLowerCase()) warn(where, `${what}: "alt" repeats the caption; describe what can be seen instead`);
  if (!spec.credit || typeof spec.credit !== 'string' || !spec.license) err(where, `${what}: a photo needs its credit and licence. Build the spec with photo(MEDIA['id'], …) from content/media.js`);
  if (!(spec.width > 0 && spec.height > 0)) err(where, `${what}: a photo needs "width" and "height" (they reserve its space while it loads)`);
  if (typeof spec.src !== 'string' || !spec.src) { err(where, `${what}: a photo needs "src"`); return null; }
  const id = checkPhotoFile(where, what, spec.src, 'src');
  if (typeof spec.thumb === 'string' && spec.thumb && spec.thumb !== spec.src) checkPhotoFile(where, what, spec.thumb, 'thumb');
  if (spec.hotspots != null) {
    if (!Array.isArray(spec.hotspots)) err(where, `${what}: "hotspots" must be a list`);
    else {
      const ids = new Set();
      spec.hotspots.forEach((sp, i) => {
        const name = `${what}: hotspot ${i + 1}`;
        if (!sp || sp.id == null) { err(where, `${name} needs an "id"`); return; }
        if (ids.has(sp.id)) err(where, `${name} repeats the id "${sp.id}"`);
        ids.add(sp.id);
        if (!(sp.x >= 0 && sp.x <= 1 && sp.y >= 0 && sp.y <= 1)) err(where, `${name} ("${sp.id}"): x and y are fractions of the picture, between 0 and 1`);
        if (sp.r != null && !(sp.r > 0 && sp.r <= 0.5)) err(where, `${name} ("${sp.id}"): r is a fraction of the picture's width, between 0 and 0.5`);
        if (!sp.label && spec.mode !== 'point') warn(where, `${name} ("${sp.id}") has no "label" to show once the step is answered`);
      });
      if (step && step.type === 'interact' && step.widget === spec && step.solution && typeof step.solution === 'object' && 'picked' in step.solution && !ids.has(step.solution.picked)) {
        err(where, `${what}: the solution picks "${step.solution.picked}", which is not one of the hotspots`);
      }
    }
  }
  return id;
}

/** A `timeline` figure or widget (see src/widgets/timeline.js). */
function checkTimeline(where, spec, what) {
  const now = Number.isFinite(spec.now) ? spec.now : 2025;
  const at = (obj, key, agoKey) => (Number.isFinite(obj[agoKey]) ? now - obj[agoKey] : obj[key]);
  const from = at(spec, 'from', 'fromAgo');
  const to = at(spec, 'to', 'toAgo');
  if (!Number.isFinite(from) || !Number.isFinite(to) || !(from < to)) { err(where, `${what}: a timeline needs "from" and "to" in years, with from earlier than to (BCE years are negative)`); return; }
  if (spec.scale === 'log-ago' && !(to < now)) err(where, `${what}: a "log-ago" timeline must end before "now" (${now})`);
  const ids = new Set();
  const seen = (kind, id) => { if (id == null) return; if (ids.has(id)) err(where, `${what}: the id "${id}" is used twice`); ids.add(id); };
  (spec.events || []).forEach((e, i) => {
    const year = at(e, 'year', 'ago');
    seen('event', e.id);
    if (!Number.isFinite(year)) err(where, `${what}: event ${i + 1} needs a "year"`);
    else if (year === 0 && !Number.isFinite(e.ago)) warn(where, `${what}: event "${e.label || i + 1}" is in year 0, which does not exist (1 BCE is -1, 1 CE is 1)`);
    else if (year < from || year > to) warn(where, `${what}: event "${e.label || i + 1}" lies outside the axis`);
    if (!e.label) warn(where, `${what}: event ${i + 1} has no "label"`);
  });
  (spec.spans || []).forEach((sp, i) => {
    const a = at(sp, 'from', 'fromAgo');
    const b = at(sp, 'to', 'toAgo');
    seen('span', sp.id);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !(a < b)) err(where, `${what}: span ${i + 1} needs "from" earlier than "to"`);
    else if (b < from || a > to) warn(where, `${what}: span "${sp.label || i + 1}" lies outside the axis`);
    if (!sp.label) warn(where, `${what}: span ${i + 1} has no "label"`);
  });
  (spec.place || []).forEach((c, i) => {
    if (c.id == null) err(where, `${what}: card ${i + 1} to place needs an "id" (the state names each card's year by it)`);
    seen('card', c.id);
    if (!c.label) err(where, `${what}: card ${i + 1} to place needs a "label"`);
  });
}

/** Every figure of a step that is a photo or a timeline: on the step, as its widget, and inside its options. */
function checkPictures(where, step) {
  const each = [];
  step.figures.forEach((fig, i) => each.push([fig, step.figures.length > 1 ? `figure ${i + 1}` : 'figure']));
  if (step.widget && typeof step.widget === 'object') each.push([step.widget, 'widget']);
  (step.options || []).forEach((o, i) => { if (o && o.figure) each.push([o.figure, `option ${i + 1}`]); });
  const photos = [];
  for (const [spec, what] of each) {
    if (!spec || typeof spec !== 'object') continue;
    if (spec.type === 'photo') { const id = checkPhoto(where, spec, what, step); if (id) photos.push(id); }
    else if (spec.type === 'timeline') checkTimeline(where, spec, what);
  }
  return photos;
}

/* ------------------------------------------------------------- step checks */

function checkConcreteStep(where, step) {
  for (const [field, value] of stringsOf(step)) checkText(where, field, value);

  if (step.type !== 'info' && !step.text && step.type !== 'fill') err(where, 'needs "text" (the question or instruction)');
  for (const fig of step.figures) if (!widgetExists(fig.type)) err(where, `figure uses unknown widget type "${fig.type}" (no src/widgets/${fig.type}.js)`);
  for (const fig of step.figures) if (!fig.alt && !['code', 'photo'].includes(fig.type)) warn(where, `figure "${fig.type}" has no "alt" description for screen readers`);
  const photos = checkPictures(where, step);

  switch (step.type) {
    case 'choice':
    case 'multi': {
      const texts = step.options.map((o) => o.text.trim());
      if (new Set(texts).size !== texts.length && !step.options.some((o) => o.figure)) err(where, `duplicate option text: ${JSON.stringify(texts)}`);
      for (const o of step.options) if (o.figure && !widgetExists(o.figure.type)) err(where, `option figure uses unknown widget "${o.figure.type}"`);
      if (step.type === 'choice' && step.options.length > 6) warn(where, `${step.options.length} options is a lot for one question`);
      break;
    }
    case 'numeric': {
      const decimals = (String(step.answer).split('.')[1] || '').length;
      if (step.tolerance == null && decimals > 3) warn(where, `answer ${step.answer} has many decimals — set a "tolerance" so rounding is accepted`);
      if (!Number.isFinite(step.answer)) err(where, 'answer is not a finite number');
      break;
    }
    case 'expr': {
      for (const [w] of step.wrong) {
        if (equivalent(String(w), step.answer, step.vars)) err(where, `"wrong" entry "${w}" is equivalent to the correct answer`);
      }
      break;
    }
    case 'order':
      if (new Set(step.items).size !== step.items.length) warn(where, 'has duplicate items (allowed, but check it is intended)');
      if (step.items.length > 7) warn(where, `${step.items.length} items to order is a heavy load; consider 4–6`);
      break;
    case 'match':
      if (new Set(step.pairs.map((p) => p[0])).size !== step.pairs.length) err(where, 'left-hand items must be unique');
      break;
    case 'bucket':
      step.buckets.forEach((b, i) => { if (!step.items.some((it) => it.bucket === i)) warn(where, `bucket "${b}" has no items`); });
      break;
    case 'slider': {
      const steps = (step.answer - step.min) / step.step;
      if (Math.abs(steps - Math.round(steps)) > 1e-6 && step.tolerance < step.step / 2) err(where, `answer ${step.answer} cannot be reached with step ${step.step} and tolerance ${step.tolerance}`);
      break;
    }
    case 'interact':
      if (!widgetExists(step.widget.type)) err(where, `uses unknown widget type "${step.widget.type}" (no src/widgets/${step.widget.type}.js)`);
      break;
    case 'code':
      if (checkCodeStep) {
        let problems = [];
        try { problems = checkCodeStep(step) || []; } catch (e) { problems = [`checker crashed: ${e.message}`]; }
        for (const problem of problems) err(where, `code step: ${problem}`);
      }
      break;
    default:
  }

  if (GRADED_TYPES.has(step.type) && step.mode !== 'predict' && !step.explain && step.type !== 'match') {
    warn(where, 'has no "explain" — every answer deserves a short why');
  }
  if (step.review && !step.explain) warn(where, 'is a review step without "explain"');
  return photos;
}

async function checkLesson(course, meta) {
  const where = `${course.id}/${meta.id}`;
  const file = join(root, 'content/courses', course.id, 'lessons', `${meta.id}.js`);
  if (!existsSync(file)) { err(where, `lesson file is missing: content/courses/${course.id}/lessons/${meta.id}.js`); return; }
  let mod;
  currentCourse = course.id;
  const lessonPhotos = new Set();
  try { mod = await import(pathToFileURL(file).href); } catch (e) { err(where, `could not be loaded: ${e.message}`); return; }
  let lesson;
  try { lesson = normalizeLesson(mod.default, course.id, meta.id); } catch (e) { err(where, e.message.replace(`${where}: `, '')); return; }

  let reviewCount = 0;
  let gradedCount = 0;
  let generated = 0;
  const shown = [];   // each step as a learner would meet it (first variant of generated ones)
  lesson.steps.forEach((raw, index) => {
    const sw = `${where} › ${raw.id}`;
    const isGen = typeof raw.gen === 'function';
    if (isGen) generated++;
    const runs = isGen ? SEEDS : 1;
    const seen = new Set();
    for (let k = 0; k < runs; k++) {
      let step;
      try { step = resolveStep(raw, makeRng(1000 + k * 7919 + index), raw.id); } catch (e) {
        err(sw, `${isGen ? `(seed ${k}) ` : ''}${e.message.replace(`${raw.id}: `, '')}`);
        break;
      }
      const before = errors;
      for (const id of checkConcreteStep(sw, step) || []) lessonPhotos.add(id);
      if (errors > before) break; // one bad variant is enough noise
      // Variety can sit in the wording, the answer, the options, the blanks, or the figure and widget.
      if (isGen) {
        const plain = (v) => { try { return JSON.stringify(v, (key, val) => (typeof val === 'function' ? undefined : val)); } catch { return ''; } };
        seen.add(JSON.stringify([step.text, step.answer, (step.options || []).map((o) => o.text), step.template, (step.blanks || []).map((b) => b.answers || b.answer),
          plain(step.figures), plain(step.widget), step.pairs, step.items, step.solution && plain(step.solution)]));
      }
      if (k === 0) {
        shown[index] = step;
        if (step.graded) gradedCount++;
        if (step.review) reviewCount++;
      }
    }
    if (isGen && seen.size < 3 && runs >= 10) warn(sw, `gen() produced only ${seen.size} distinct variant(s) in ${runs} tries — add more variety`);
    if (raw.review && !isGen && ['numeric', 'expr'].includes(raw.type)) warn(sw, 'review step with a fixed answer — consider gen() so learners practise the skill, not the number');
    if (!isGen && raw.type === 'numeric' && raw.wrong) {
      const list = Array.isArray(raw.wrong) ? raw.wrong : Object.entries(raw.wrong);
      for (const [v] of list) if (Number(v) === Number(raw.answer)) err(sw, `"wrong" lists the correct answer (${v}) as a mistake`);
    }
  });

  const n = lesson.steps.length;
  if (n < 6) warn(where, `only ${n} steps — lessons usually have 12–18`);
  if (n > 20) warn(where, `${n} steps — consider splitting the lesson`);
  if (gradedCount < 4) warn(where, `only ${gradedCount} graded steps — a lesson needs practice as well as teaching`);
  // Teach before you ask (docs/AUTHORING.md): what a machine can check of that rule.
  // an info screen after the last task (a closing "try this") is not a teaching screen: normalizeLesson marks the others
  const role = (st) => (st.type === 'info' ? (st.teach ? 'teach' : 'closing') : st.mode === 'predict' ? 'predict' : st.type === 'reflect' ? 'reflect' : st.graded ? 'graded' : 'explore');
  const met = lesson.steps.map((st, i) => shown[i] || st);
  const roles = met.map(role);
  const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
  const cold = met.filter((st, i) => roles[i] === 'graded' && (firstTaught < 0 || i < firstTaught)).map((st) => st.id);
  if (cold.length) warn(where, `graded before anything has been taught: ${cold.join(', ')} — open with a prediction if you like, then teach (an "info" screen or an exploration) before the first graded question`);
  const teachScreens = roles.filter((r) => r === 'teach').length;
  if (teachScreens < 3) warn(where, `only ${teachScreens} teaching screen(s) ("info" steps) — show new knowledge before asking for it; most lessons need 3–6`);
  // an opinion poll (a predict-mode choice with no right option: "what will you try this week?") is not a guess at an answer
  const isPoll = (st) => st.mode === 'predict' && Array.isArray(st.options) && !st.options.some((o) => o.correct);
  const predictions = met.filter((st, i) => roles[i] === 'predict' && !isPoll(st)).length;
  if (predictions > 2) warn(where, `${predictions} predictions — a guess before teaching works once or twice a lesson, not as the main way of introducing ideas`);
  if (reviewCount < 2) warn(where, `only ${reviewCount} step(s) marked review: true — aim for 2–4 so the lesson is remembered`);
  if (reviewCount > 6) warn(where, `${reviewCount} review steps — keep it to the 2–4 most important ideas`);
  if (!lesson.recap.length) warn(where, 'has no "recap" bullets');
  if (lessonPhotos.size > 6) warn(where, `uses ${lessonPhotos.size} different photos — aim for about four, each one something a question or an explanation refers to`);
  lesson.recap.forEach((text, i) => checkText(where, `recap[${i}]`, text));
  checkText(where, 'next', lesson.next);
  let infoRun = 0;
  for (const s of lesson.steps) {
    infoRun = s.type === 'info' ? infoRun + 1 : 0;
    if (infoRun === 3) { warn(where, '3 "info" steps in a row — follow each idea with a quick question before the next'); break; }
  }
  return { steps: n, graded: gradedCount, review: reviewCount, generated };
}

async function checkCourse(course, categories) {
  const where = course.id || '(course without id)';
  if (!SLUG.test(course.id || '')) err(where, 'course id must be lowercase-with-dashes');
  if (!existsSync(join(root, 'content/courses', course.id, 'course.js'))) err(where, `expected content/courses/${course.id}/course.js`);
  for (const f of ['title', 'tagline', 'description', 'category']) if (!course[f]) err(where, `course is missing "${f}"`);
  if (course.category && !categories.some((c) => c.id === course.category)) err(where, `unknown category "${course.category}"`);
  if (course.color && !HUES.includes(course.color)) err(where, `color must be one of ${HUES.join(', ')}`);
  if (course.level && !LEVELS.includes(course.level)) warn(where, `level should be one of ${LEVELS.join(', ')}`);
  if (course.cover && !coverKeys().includes(course.cover)) err(where, `unknown cover "${course.cover}" (see src/ui/covers.js)`);
  if (course.requires != null && !Array.isArray(course.requires)) err(where, '"requires" must be a list of course ids');
  for (const req of Array.isArray(course.requires) ? course.requires : []) {
    if (req === course.id) err(where, 'a course cannot require itself');
    else if (!allCourseIds.has(req)) err(where, `"requires" names an unknown course "${req}"`);
  }
  if (!Array.isArray(course.outcomes) || course.outcomes.length < 2) warn(where, 'add 3–5 "outcomes" (what the learner will be able to do)');
  if (!Array.isArray(course.chapters) || !course.chapters.length) { err(where, 'course needs "chapters"'); return null; }

  const ids = new Set();
  const stats = { lessons: 0, steps: 0, graded: 0, review: 0, generated: 0, minutes: 0 };
  for (const chapter of course.chapters) {
    if (!chapter.title) err(where, 'a chapter is missing its "title"');
    for (const meta of chapter.lessons || []) {
      if (!SLUG.test(meta.id || '')) { err(where, `lesson id "${meta.id}" must be lowercase-with-dashes`); continue; }
      if (ids.has(meta.id)) { err(where, `duplicate lesson id "${meta.id}"`); continue; }
      ids.add(meta.id);
      if (!meta.title || !meta.summary) err(`${where}/${meta.id}`, 'lesson needs "title" and "summary" in course.js');
      if (!(meta.minutes > 0)) warn(`${where}/${meta.id}`, 'lesson has no "minutes" estimate');
      if (onlyLesson && onlyLesson !== `${course.id}/${meta.id}`) continue;
      const res = await checkLesson(course, meta);
      if (res) {
        stats.lessons++; stats.steps += res.steps; stats.graded += res.graded; stats.review += res.review; stats.generated += res.generated;
        stats.minutes += meta.minutes || 0;
      }
    }
  }
  const dir = join(root, 'content/courses', course.id, 'lessons');
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.js') && !ids.has(f.replace(/\.js$/, ''))) warn(where, `lessons/${f} is not listed in course.js`);
    }
  }
  // The course's pictures: files and manifest agree, and (when the whole course was checked) every picture is used.
  const media = mediaOf(course.id);
  if (media) {
    for (const problem of verifyMedia(root, course.id)) err(where, `content/media/${course.id}: ${problem}`);
    // a CC BY / CC BY-SA picture whose record names nobody the licence would accept (see docs/IMAGES.md)
    for (const note of creditWarnings(root, course.id)) warn(where, `content/media/${course.id}: ${note}`);
    if (!onlyLesson) {
      // A picture may sit behind a generator that the seeds did not reach: also look for its id in the course's source.
      let source = '';
      const courseDir = join(root, 'content/courses', course.id);
      for (const f of existsSync(dir) ? readdirSync(dir) : []) if (f.endsWith('.js')) source += readFileSync(join(dir, f), 'utf8');
      for (const f of readdirSync(courseDir)) if (f.endsWith('.js')) source += readFileSync(join(courseDir, f), 'utf8');
      for (const id of media.ids) {
        if (media.used.has(id) || source.includes(`'${id}'`) || source.includes(`"${id}"`) || new RegExp(`MEDIA\\.${id.replace(/-/g, '\\-')}\\b`).test(source)) continue;
        warn(where, `content/media/${course.id}: the picture "${id}" is not used by any lesson (remove it with: node tools/fetch-image.mjs --remove ${id} --course ${course.id})`);
      }
    }
  }
  return stats;
}

/* -------------------------------------------------------------------- main */

const { categories, courses, paths = [] } = await import(pathToFileURL(join(root, 'content/index.js')).href);
const allCourseIds = new Set(courses.map((c) => c.id));
for (const cat of categories) {
  if (!ICONS[cat.icon]) err(`category ${cat.id}`, `unknown icon "${cat.icon}"`);
  if (!HUES.includes(cat.color)) err(`category ${cat.id}`, `unknown color "${cat.color}"`);
}
// Learning paths: every entry is a real course, no course sits in two paths,
// and a course never comes before something it requires in the same path.
const pathHome = new Map();
for (const path of paths) {
  const where = `path ${path.id}`;
  if (!SLUG.test(path.id || '')) err(where, 'path id must be lowercase-with-dashes');
  if (!path.title || !path.blurb) err(where, 'a path needs "title" and "blurb"');
  if (path.icon && !ICONS[path.icon]) err(where, `unknown icon "${path.icon}"`);
  if (path.color && !HUES.includes(path.color)) err(where, `unknown color "${path.color}"`);
  if (!Array.isArray(path.courses) || path.courses.length < 2) { err(where, 'a path needs at least two courses'); continue; }
  path.courses.forEach((id, i) => {
    if (!allCourseIds.has(id)) { err(where, `lists an unknown course "${id}"`); return; }
    if (pathHome.has(id)) err(where, `course "${id}" is already in path "${pathHome.get(id)}"`);
    pathHome.set(id, path.id);
    const course = courses.find((c) => c.id === id);
    for (const req of course.requires || []) {
      if (path.courses.indexOf(req) > i) warn(where, `"${id}" requires "${req}", which comes later in this path`);
    }
  });
}
const seenCourses = new Set();
const table = [];
for (const course of courses) {
  if (seenCourses.has(course.id)) err(course.id, 'duplicate course id in content/index.js');
  seenCourses.add(course.id);
  if (onlyCourse && course.id !== onlyCourse) continue;
  if (onlyLesson && !onlyLesson.startsWith(course.id + '/')) continue;
  const stats = await checkCourse(course, categories);
  if (stats) table.push({ course: course.id, ...stats });
}

// Media folders that belong to no course: the demonstration pictures of the widget gallery (names that
// start with "_") are checked like any other; anything else is a leftover.
if (!onlyCourse && !onlyLesson && existsSync(join(root, 'content/media'))) {
  for (const name of readdirSync(join(root, 'content/media'))) {
    if (allCourseIds.has(name) || !existsSync(join(root, 'content/media', name, 'manifest.json'))) continue;
    for (const problem of verifyMedia(root, name)) err(`content/media/${name}`, problem);
    if (!name.startsWith('_')) warn(`content/media/${name}`, 'these pictures belong to no course in content/index.js');
  }
}

const byWhere = new Map();
for (const item of report) {
  if (!byWhere.has(item.where)) byWhere.set(item.where, []);
  byWhere.get(item.where).push(item);
}
for (const [where, items] of byWhere) {
  const shown = items.filter((it) => it.level === 'error' || !quiet);
  if (!shown.length) continue;
  console.log(`\n${where}`);
  for (const it of shown) console.log(`  ${it.level === 'error' ? '✖' : '⚠'} ${it.msg}`);
}

console.log('\n' + table.map((t) => `  ${t.course.padEnd(16)} ${String(t.lessons).padStart(2)} lessons  ${String(t.steps).padStart(3)} steps  ${String(t.graded).padStart(3)} graded  ${String(t.review).padStart(2)} review  ${String(t.generated).padStart(2)} generated  ~${t.minutes} min`).join('\n'));
console.log(`\n${errors ? '✖' : '✔'} ${errors} error(s), ${warnings} warning(s)\n`);
process.exit(errors || (strict && warnings) ? 1 : 0);
