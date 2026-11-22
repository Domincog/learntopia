/**
 * `fill` — fill in the blanks inside a sentence, formula or code line.
 *   template: 'A triangle has [[3]] sides; its angles sum to [[90|*180|360]] degrees.'
 * [[answer]] is a typed blank ([[colour;color]] accepts either),
 * [[a|*b|c]] is a dropdown with the starred option correct.
 * `plain: true` on the step: numeric blanks take a finished number only ("1/8", not "2^-3").
 */
import { h } from '../../core/dom.js';
import { md } from '../../core/markdown.js';
import { parseNumber } from '../../core/mathexpr.js';
import { matchesAny, numbersMatch, commaAlternative, dotThousandsAlternative, isPlainNumber } from '../ui.js';

// Each blank travels through the markdown renderer as one private-use
// character, which no formatting or syntax-highlighting rule touches.
const TOKEN_BASE = 0xE000;

export default function fill(step, env) {
  let src = '';
  for (const part of step.parts) src += part.text != null ? part.text : String.fromCharCode(TOKEN_BASE + part.blank);
  let html = md(src);
  html = html.replace(/[\uE000-\uE0FF]/g, (ch) => `<span class="blank" data-blank="${ch.charCodeAt(0) - TOKEN_BASE}"></span>`);
  const el = h('div.fill.md', { html });
  const controls = [];

  const refresh = () => env.onReady(controls.every((c) => c.value() !== ''));

  el.querySelectorAll('[data-blank]').forEach((span) => {
    const blank = step.blanks[Number(span.dataset.blank)];
    let ctrl;
    if (blank.kind === 'select') {
      const select = h('select.blank-select', { 'aria-label': `Blank ${blank.index + 1}` },
        h('option', { value: '' }, '— choose —'),
        blank.options.map((o) => h('option', { value: o }, o)),
      );
      select.addEventListener('change', () => { span.classList.remove('is-right', 'is-wrong'); refresh(); });
      ctrl = {
        el: select,
        value: () => select.value,
        right: () => select.value === blank.answer,
        show: () => { select.value = blank.answer; },
        lock: () => { select.disabled = true; },
      };
    } else {
      const longest = blank.answers.reduce((n, a) => Math.max(n, a.length), 1);
      const input = h('input.blank-input', {
        type: 'text',
        inputmode: blank.numeric && blank.numbers.every((v) => Number.isInteger(v) && v >= 0) ? 'numeric' : 'text',
        autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: false,
        'aria-label': `Blank ${blank.index + 1}`,
        style: { width: `${Math.max(3, longest + 2)}ch` },
      });
      input.addEventListener('input', () => { span.classList.remove('is-right', 'is-wrong'); refresh(); });
      ctrl = {
        el: input,
        value: () => input.value.trim(),
        right: () => (blank.numeric
          ? blank.numbers.some((num) => numbersMatch(parseNumber(input.value), num, step.tolerance) || numbersMatch(commaAlternative(input.value), num, step.tolerance) || numbersMatch(dotThousandsAlternative(input.value), num, step.tolerance)
            // "20%" typed into a blank that is followed by a printed % sign means 20, not 0.2
            || (/%\s*$/.test(input.value) && numbersMatch(parseNumber(input.value.replace(/%\s*$/, '')), num, step.tolerance)))
          : matchesAny(input.value, blank.answers, step.caseSensitive)),
        // with `plain: true` on the step, a numeric blank must hold a finished number, not a sum to be worked out
        unfinished: () => !!step.plain && blank.numeric && input.value.trim() !== '' && !isPlainNumber(input.value),
        show: () => { input.value = blank.answers[0]; },
        lock: () => { input.readOnly = true; },
      };
    }
    ctrl.span = span;
    controls[blank.index] = ctrl;
    span.appendChild(ctrl.el);
  });

  return {
    el,
    check() {
      if (controls.some((c) => c.unfinished && c.unfinished())) {
        return { invalid: true, title: 'One more step', message: 'Work each blank out and type it as a single number, such as `8`, `0.125` or `1/8`.' };
      }
      let right = 0;
      for (const c of controls) {
        const ok = c.right();
        c.span.classList.toggle('is-right', ok);
        c.span.classList.toggle('is-wrong', !ok);
        if (ok) right++;
      }
      if (right === controls.length) return { correct: true };
      return { correct: false, message: controls.length > 1 ? `${right} of ${controls.length} blanks are right.` : null };
    },
    retry() {
      const firstWrong = controls.find((c) => !c.right());
      if (firstWrong) firstWrong.el.focus({ preventScroll: true });
    },
    reveal() {
      for (const c of controls) { c.show(); c.span.classList.remove('is-wrong'); c.span.classList.add('is-right'); }
    },
    lock() { controls.forEach((c) => c.lock()); },
    focus() { if (controls[0]) controls[0].el.focus({ preventScroll: true }); },
    solve() { controls.forEach((c) => c.show()); refresh(); },
  };
}
