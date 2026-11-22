/**
 * `reflect` — explain something in your own words, then compare with a model
 * answer and rate yourself. Not machine-graded: the value is in generating
 * the explanation (the "self-explanation effect"). With `personal: true` the
 * prompt is about the learner's own life: the model is offered as one way to
 * look at it and nothing is rated. What is typed is never stored.
 */
import { h } from '../../core/dom.js';
import { mdBlock } from '../ui.js';
import { icon } from '../../ui/icon.js';

export default function reflect(step, env) {
  const minChars = step.minChars == null ? 12 : step.minChars;
  const area = h('textarea.textarea.reflect-input', {
    rows: 3,
    placeholder: step.placeholder || 'Write a sentence or two in your own words…',
    'aria-label': 'Your explanation',
  });
  const skip = h('button.link-btn.small', { type: 'button' }, 'I would rather just think it through');
  const model = h('div.reflect-model', { hidden: true },
    h('div.eyebrow', step.personal ? 'One way to look at it' : 'One good answer'),
    mdBlock(step.model),
  );
  const rating = h('div.reflect-rating', { hidden: true });
  let thoughtOnly = false;

  area.addEventListener('input', () => env.onReady(area.value.trim().length >= minChars));
  skip.addEventListener('click', () => {
    thoughtOnly = true;
    skip.hidden = true;
    area.placeholder = 'Take a moment to say it in your head…';
    env.onReady(true);
  });

  function showRating() {
    rating.hidden = false;
    rating.appendChild(h('span.small.muted', 'How close were you?'));
    const opts = [['got', 'Had it', 'smile'], ['partly', 'Partly', 'activity'], ['missed', 'Not yet', 'sprout']];
    const buttons = opts.map(([value, label, ic]) => {
      const btn = h('button.filter', { type: 'button', 'aria-pressed': 'false' }, icon(ic, 16), label);
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        env.note && env.note({ self: value });
      });
      return btn;
    });
    buttons.forEach((b) => rating.appendChild(b));
  }

  return {
    el: h('div.reflect', area, h('div', skip), model, rating),
    checkLabel: 'Compare',
    check() {
      model.hidden = false;
      skip.hidden = true;
      if (!thoughtOnly && !step.personal) showRating();   // a personal prompt has no answer to be close to
      return { ungraded: true, wrote: !thoughtOnly };
    },
    reveal() { model.hidden = false; },
    lock() { area.readOnly = true; },
    focus() { area.focus({ preventScroll: true }); },
    solve() { area.value = 'A sample explanation for testing.'; env.onReady(true); },
  };
}
