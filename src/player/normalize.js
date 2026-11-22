/**
 * Lesson normalisation. Authors write steps in a friendly, forgiving format;
 * this module turns them into the strict shape the player expects and throws
 * a clear error when something is wrong. It has no DOM dependencies, so the
 * command-line validator (tools/validate.mjs) uses exactly the same code.
 */
import { evaluate, parseNumber } from '../core/mathexpr.js';

export const STEP_TYPES = [
  'info', 'choice', 'multi', 'numeric', 'short', 'expr', 'order', 'match',
  'bucket', 'fill', 'slider', 'interact', 'reflect', 'code',
];

/** Step types that have a right answer (as opposed to info / reflect). */
export const GRADED_TYPES = new Set(['choice', 'multi', 'numeric', 'short', 'expr', 'order', 'match', 'bucket', 'fill', 'slider', 'interact', 'code']);

export class ContentError extends Error {
  constructor(message, where) {
    super(where ? `${where}: ${message}` : message);
    this.name = 'ContentError';
  }
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function toNumber(value, where, field) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    let n = NaN;
    try { n = evaluate(value, {}, { vars: [] }); } catch { n = parseNumber(value); }
    if (Number.isFinite(n)) return n;
  }
  throw new ContentError(`"${field}" must be a number (got ${JSON.stringify(value)})`, where);
}

function normOptions(step, where, multi) {
  if (!Array.isArray(step.options) || step.options.length < 2) {
    throw new ContentError('needs an "options" array with at least 2 entries', where);
  }
  const answerIdx = multi
    ? new Set(Array.isArray(step.answers) ? step.answers : [])
    : (typeof step.answer === 'number' ? new Set([step.answer]) : new Set());
  const options = step.options.map((opt, i) => {
    const o = typeof opt === 'string' || typeof opt === 'number' ? { text: String(opt) } : { ...opt };
    if (o.text == null && !o.figure) throw new ContentError(`option ${i + 1} needs "text" or "figure"`, where);
    o.text = o.text == null ? '' : String(o.text);
    o.correct = !!o.correct || answerIdx.has(i) || (!multi && typeof step.answer === 'string' && step.answer === o.text);
    return o;
  });
  const nCorrect = options.filter((o) => o.correct).length;
  if (!multi && nCorrect !== 1 && step.mode !== 'predict') {
    throw new ContentError(`a "choice" step needs exactly one correct option (found ${nCorrect}). Mark it with { correct: true } or "answer: <index>"`, where);
  }
  if (multi && nCorrect < 1) throw new ContentError('a "multi" step needs at least one correct option', where);
  return options;
}

/** Parse a fill-in template into text segments and blanks. */
export function parseFillTemplate(template, where) {
  const parts = [];
  const blanks = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(template))) {
    if (m.index > last) parts.push({ text: template.slice(last, m.index) });
    const body = m[1];
    let blank;
    if (body.includes('|')) {
      const opts = body.split('|').map((s) => s.trim());
      const correct = opts.findIndex((o) => o.startsWith('*'));
      if (correct === -1) throw new ContentError(`dropdown blank [[${body}]] needs one option marked with *`, where);
      blank = { kind: 'select', options: opts.map((o) => o.replace(/^\*/, '')), answer: opts[correct].replace(/^\*/, '') };
    } else {
      const answers = body.split(';').map((s) => s.trim()).filter(Boolean);
      const nums = answers.map((a) => parseNumber(a));
      blank = { kind: 'input', answers, numeric: nums.every((n) => Number.isFinite(n)), numbers: nums };
    }
    blank.index = blanks.length;
    blanks.push(blank);
    parts.push({ blank: blank.index });
    last = m.index + m[0].length;
  }
  if (last < template.length) parts.push({ text: template.slice(last) });
  if (!blanks.length) throw new ContentError('a "fill" template needs at least one [[blank]]', where);
  return { parts, blanks };
}

/**
 * Normalise a *concrete* step (after `gen` has been applied).
 * Returns a new object; never mutates its input.
 */
export function normalizeStep(raw, where = 'step') {
  if (!isObj(raw)) throw new ContentError('step must be an object', where);
  const step = { ...raw };
  if (!STEP_TYPES.includes(step.type)) {
    throw new ContentError(`unknown step type "${step.type}". Known types: ${STEP_TYPES.join(', ')}`, where);
  }
  step.text = step.text == null ? '' : String(step.text);
  step.hints = step.hints == null ? [] : (Array.isArray(step.hints) ? step.hints.map(String) : [String(step.hints)]);
  step.explain = step.explain == null ? '' : String(step.explain);
  step.figures = step.figure == null ? [] : (Array.isArray(step.figure) ? step.figure : [step.figure]);
  for (const fig of step.figures) {
    if (!isObj(fig) || typeof fig.type !== 'string') throw new ContentError('each "figure" needs a widget "type"', where);
  }
  // `graded: false` marks an activity: it has a completion check, but it does
  // not count toward accuracy and is not repeated if "missed".
  step.graded = GRADED_TYPES.has(step.type) && step.mode !== 'predict' && raw.graded !== false;
  step.review = !!step.review && step.graded;

  switch (step.type) {
    case 'info':
      if (!step.text && !step.figures.length) throw new ContentError('an "info" step needs "text" or a "figure"', where);
      break;
    case 'choice':
      step.options = normOptions(step, where, false);
      step.shuffle = step.shuffle !== false;
      break;
    case 'multi':
      step.options = normOptions(step, where, true);
      step.shuffle = step.shuffle !== false;
      break;
    case 'numeric': {
      step.answer = toNumber(step.answer, where, 'answer');
      step.accept = (step.accept || []).map((a) => toNumber(a, where, 'accept'));
      step.tolerance = step.tolerance == null ? null : Number(step.tolerance);
      // Anticipated mistakes. In generated problems a "mistake" value can
      // coincide with the right answer for some numbers; those are dropped.
      step.wrong = (Array.isArray(step.wrong) ? step.wrong : Object.entries(step.wrong || {}))
        .map(([val, msg]) => [toNumber(val, where, 'wrong'), String(msg)])
        .filter(([val]) => Math.abs(val - step.answer) > 1e-9 && !step.accept.some((a) => Math.abs(val - a) <= 1e-9));
      break;
    }
    case 'short': {
      const answers = step.answers || (step.answer != null ? [step.answer] : null);
      if (!Array.isArray(answers) || !answers.length) throw new ContentError('a "short" step needs "answers": [..]', where);
      step.answers = answers;
      step.wrong = Array.isArray(step.wrong) ? step.wrong : Object.entries(step.wrong || {});
      break;
    }
    case 'expr': {
      if (typeof step.answer !== 'string') throw new ContentError('an "expr" step needs "answer" as an expression string', where);
      step.vars = step.vars || ['x'];
      const scope = {};
      step.vars.forEach((v, i) => { scope[v] = 1.37 + i; });
      try { evaluate(step.answer, scope, { vars: step.vars }); } catch (err) {
        throw new ContentError(`cannot parse answer "${step.answer}": ${err.message}`, where);
      }
      step.wrong = Array.isArray(step.wrong) ? step.wrong : Object.entries(step.wrong || {});
      break;
    }
    case 'order':
      if (!Array.isArray(step.items) || step.items.length < 2) throw new ContentError('an "order" step needs "items" (2+), listed in the correct order', where);
      step.items = step.items.map(String);
      break;
    case 'match':
      if (!Array.isArray(step.pairs) || step.pairs.length < 2 || step.pairs.some((p) => !Array.isArray(p) || p.length !== 2)) {
        throw new ContentError('a "match" step needs "pairs": [[left, right], …] (2+)', where);
      }
      step.pairs = step.pairs.map(([a, b]) => [String(a), String(b)]);
      break;
    case 'bucket': {
      if (!Array.isArray(step.buckets) || step.buckets.length < 2) throw new ContentError('a "bucket" step needs "buckets" (2+)', where);
      if (!Array.isArray(step.items) || !step.items.length) throw new ContentError('a "bucket" step needs "items"', where);
      step.items = step.items.map((it, i) => {
        const o = Array.isArray(it) ? { text: it[0], bucket: it[1] } : { ...it };
        if (typeof o.bucket === 'string') o.bucket = step.buckets.indexOf(o.bucket);
        if (!Number.isInteger(o.bucket) || o.bucket < 0 || o.bucket >= step.buckets.length) {
          throw new ContentError(`item ${i + 1} has an invalid "bucket"`, where);
        }
        o.text = String(o.text);
        return o;
      });
      break;
    }
    case 'fill': {
      if (typeof step.template !== 'string') throw new ContentError('a "fill" step needs a "template" string with [[blanks]]', where);
      Object.assign(step, parseFillTemplate(step.template, where));
      break;
    }
    case 'slider': {
      for (const f of ['min', 'max', 'answer']) step[f] = toNumber(step[f], where, f);
      step.step = step.step == null ? 1 : Number(step.step);
      step.tolerance = step.tolerance == null ? step.step / 2 : Number(step.tolerance);
      if (!(step.max > step.min)) throw new ContentError('"max" must be greater than "min"', where);
      if (step.answer < step.min || step.answer > step.max) throw new ContentError('"answer" must lie between min and max', where);
      break;
    }
    case 'interact': {
      if (!isObj(step.widget) || typeof step.widget.type !== 'string') throw new ContentError('an "interact" step needs a "widget" spec with a "type"', where);
      if (typeof step.check !== 'function' && !isObj(step.target)) throw new ContentError('an "interact" step needs a "check(state)" function or a "target" object', where);
      if (step.solution === undefined && !isObj(step.target)) throw new ContentError('an "interact" step needs a "solution" (a widget state that passes the check)', where);
      break;
    }
    case 'reflect':
      if (!step.model) throw new ContentError('a "reflect" step needs a "model" answer to compare against', where);
      step.model = String(step.model);
      step.graded = false;
      break;
    case 'code':
      if (typeof step.solution !== 'string') throw new ContentError('a "code" step needs a "solution" program', where);
      if (!Array.isArray(step.tests) && step.expect == null) throw new ContentError('a "code" step needs "tests" or "expect"', where);
      break;
    default:
  }
  return step;
}

/**
 * Apply a step's generator (if any) with the given rng, then normalise.
 * `gen(rng)` returns fields that override the static ones.
 */
export function resolveStep(step, rng, where) {
  let concrete = step;
  if (typeof step.gen === 'function') {
    let made;
    try { made = step.gen(rng); } catch (err) {
      throw new ContentError(`gen() threw: ${err.message}`, where || step.id);
    }
    if (!isObj(made)) throw new ContentError('gen() must return an object of step fields', where || step.id);
    concrete = { ...step, ...made };
  }
  return normalizeStep(concrete, where || step.id);
}

/**
 * Validate the static shape of a lesson module and assign step ids.
 * Generated steps are only shape-checked here; resolveStep() does the rest.
 */
export function normalizeLesson(raw, courseId, lessonId) {
  const where = `${courseId}/${lessonId}`;
  if (!isObj(raw)) throw new ContentError('lesson module must `export default { steps: [...] }`', where);
  if (raw.id && raw.id !== lessonId) throw new ContentError(`lesson id "${raw.id}" does not match its file name "${lessonId}"`, where);
  if (!Array.isArray(raw.steps) || !raw.steps.length) throw new ContentError('lesson needs a non-empty "steps" array', where);
  const seen = new Set();
  const steps = raw.steps.map((s, i) => {
    if (!isObj(s)) throw new ContentError(`step ${i + 1} is not an object`, where);
    const id = s.id ? String(s.id) : `s${i + 1}`;
    if (seen.has(id)) throw new ContentError(`duplicate step id "${id}"`, where);
    if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new ContentError(`step id "${id}" may only contain letters, digits, - and _`, where);
    seen.add(id);
    if (!STEP_TYPES.includes(s.type)) throw new ContentError(`step "${id}" has unknown type "${s.type}"`, where);
    if (s.review && !s.id) throw new ContentError(`step ${i + 1} is marked review: true and therefore needs a stable explicit "id"`, where);
    const step = { ...s, id, index: i };
    if (s.tone === 'sober' || raw.tone === 'sober') step.tone = 'sober';
    step.review = !!s.review && GRADED_TYPES.has(s.type) && s.mode !== 'predict';
    return step;
  });
  // An "info" screen that is followed by something to answer is a teaching screen: the player
  // labels it "Learn". Closing screens (a thing to try this week, a sign-off) are not.
  const lastTask = steps.reduce((last, st, i) => (st.type !== 'info' && st.type !== 'reflect' ? i : last), -1);
  steps.forEach((st, i) => { if (st.type === 'info' && i < lastTask) st.teach = true; });
  return {
    id: lessonId,
    courseId,
    steps,
    recap: Array.isArray(raw.recap) ? raw.recap.map(String) : [],
    next: raw.next ? String(raw.next) : '',
    tone: raw.tone === 'sober' ? 'sober' : '',
  };
}
