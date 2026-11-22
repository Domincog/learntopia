/**
 * `interact` — the answer is given by manipulating a widget: drag a point,
 * balance a scale, build a circuit…
 *
 *   widget:   the widget spec ({ type: 'plot', … })
 *   check:    (state) => true | false | 'a hint for this wrong state' | { correct, message }
 *   target:   alternative to check — an object matched against the widget state
 *             (numbers within `tolerance`, default 1e-6)
 *   solution: a widget state (or (spec) => state) that passes the check
 *   auto:     true to accept the answer the moment the state becomes correct
 */
import { h } from '../../core/dom.js';
import { createWidget } from '../../widgets/index.js';

/** Does `state` contain everything in `target` (numbers within tol)? */
export function matchesTarget(state, target, tol = 1e-6) {
  if (target === null || typeof target !== 'object') {
    if (typeof target === 'number') return typeof state === 'number' && Math.abs(state - target) <= tol + 1e-12;
    return state === target;
  }
  if (state === null || typeof state !== 'object') return false;
  if (Array.isArray(target)) {
    if (!Array.isArray(state) || state.length !== target.length) return false;
    return target.every((t, i) => matchesTarget(state[i], t, tol));
  }
  return Object.keys(target).every((key) => matchesTarget(state[key], target[key], tol));
}

export default async function interact(step, env) {
  let submitted = false;

  const evaluate = (state) => {
    let res;
    if (typeof step.check === 'function') res = step.check(state);
    else res = matchesTarget(state, step.target, step.tolerance == null ? 1e-6 : step.tolerance);
    if (res === true) return { correct: true };
    if (typeof res === 'string') return { correct: false, message: res };
    if (res && typeof res === 'object') return { correct: !!res.correct, message: res.message };
    return { correct: false };
  };

  const widget = await createWidget(step.widget, {
    rng: env.rng,
    onChange: (state) => {
      env.onReady(true);
      if (step.auto && !submitted) {
        let ok = false;
        try { ok = evaluate(state).correct; } catch { ok = false; }
        if (ok) { submitted = true; env.submit(); }
      }
    },
  });
  if (step.readyAtStart) setTimeout(() => env.onReady(true), 0);

  const solutionState = () => {
    if (typeof step.solution === 'function') return step.solution(step.widget);
    if (step.solution !== undefined) return step.solution;
    return step.target;
  };

  return {
    el: h('div.interact', widget.el),
    check() {
      if (!widget.ok) return { correct: true }; // never trap a learner behind a broken widget
      return evaluate(widget.getState());
    },
    retry() { submitted = false; },
    reveal() { widget.setState(solutionState()); },
    lock() { widget.setReadOnly(true); },
    solve() { widget.setState(solutionState()); env.onReady(true); },
    widget,
    destroy() { widget.destroy(); },
  };
}
