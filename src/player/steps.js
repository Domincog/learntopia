/**
 * Step-type registry: maps a step's `type` to the function that renders it.
 *
 * A renderer is `(step, env) => controller` (it may be async) where
 *   env = { rng, mode, onReady(bool), submit(), note(data) }
 * and the controller is
 *   { el, check(), reveal(), lock(), retry?(), focus?(), onKey?(ev), solve?(), destroy?(), checkLabel? }
 *
 * check() returns one of
 *   { correct: true|false, message? }   graded answer (message is markdown feedback)
 *   { invalid: true, message }          input could not be read; no attempt is used
 *   { ungraded: true }                  nothing to grade (reflection)
 *
 * To add a step type: write the renderer in ./types/, register it here, and
 * teach normalize.js to validate its fields.
 */
import info from './types/info.js';
import choice from './types/choice.js';
import numeric from './types/numeric.js';
import short from './types/short.js';
import expr from './types/expr.js';
import order from './types/order.js';
import match from './types/match.js';
import bucket from './types/bucket.js';
import fill from './types/fill.js';
import slider from './types/slider.js';
import interact from './types/interact.js';
import reflect from './types/reflect.js';

export const RENDERERS = {
  info,
  choice,
  multi: choice,
  numeric,
  short,
  expr,
  order,
  match,
  bucket,
  fill,
  slider,
  interact,
  reflect,
  // `code` pulls in the mini-Python interpreter, so it is loaded on demand.
  code: (step, env) => import('./types/code.js').then((m) => m.default(step, env)),
};

/** How many tries a learner gets before the answer is shown. */
export function attemptsAllowed(step, mode) {
  if (step.mode === 'predict') return 1;
  if (mode === 'review') return 1;
  if (Number.isInteger(step.attempts) && step.attempts > 0) return step.attempts;
  switch (step.type) {
    case 'choice': return step.options.length <= 2 ? 1 : 2;
    case 'multi': return 2;
    case 'interact': return 4;
    case 'code': return 6;
    default: return 3;
  }
}
