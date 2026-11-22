/** `slider` — answer by setting a slider (good for estimates and "about how much?" questions). */
import { h } from '../../core/dom.js';
import { formatNumber } from '../../core/mathexpr.js';
import { mdSpan } from '../ui.js';

export default function slider(step, env) {
  const { min, max } = step;
  const stepSize = step.step || 1;
  const digits = Math.max(0, (String(stepSize).split('.')[1] || '').length);
  const start = step.start != null ? Number(step.start) : min;
  const input = h('input.range', {
    type: 'range', min, max, step: stepSize, value: start,
    'aria-label': step.label || 'Your answer',
  });
  const readout = h('output.slider-value');
  const fmt = (v) => formatNumber(v, digits);
  const wrap = h('div.slider-q',
    h('div.slider-readout', step.prefix ? mdSpan(step.prefix, 'answer-affix') : null, readout, step.unit ? mdSpan(step.unit, 'answer-affix') : null),
    input,
    h('div.slider-ends', h('span', (step.labels && step.labels[0]) || fmt(min)), h('span', (step.labels && step.labels[1]) || fmt(max))),
  );

  function paint() {
    const v = Number(input.value);
    input.style.setProperty('--fill', `${((v - min) / (max - min)) * 100}%`);
    readout.textContent = step.hideValue ? '?' : fmt(v);
    input.setAttribute('aria-valuetext', `${fmt(v)}${step.unit ? ' ' + step.unit : ''}`);
  }
  const touched = () => { wrap.classList.remove('is-wrong', 'is-right'); paint(); env.onReady(true); };
  input.addEventListener('input', touched);
  input.addEventListener('pointerdown', touched);
  input.addEventListener('keydown', touched);
  paint();

  return {
    el: wrap,
    check() {
      const v = Number(input.value);
      if (Math.abs(v - step.answer) <= step.tolerance + 1e-9) { wrap.classList.add('is-right'); return { correct: true }; }
      wrap.classList.add('is-wrong');
      if (step.directional === false) return { correct: false };
      return { correct: false, message: v < step.answer ? 'Too low — try higher.' : 'Too high — try lower.' };
    },
    retry() { wrap.classList.remove('is-wrong'); },
    reveal() {
      input.value = step.answer;
      step.hideValue = false;
      paint();
      wrap.classList.remove('is-wrong');
      wrap.classList.add('is-revealed');
    },
    lock() { input.disabled = true; },
    solve() { input.value = step.answer; paint(); env.onReady(true); },
  };
}
