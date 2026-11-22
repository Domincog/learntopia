/**
 * calibration — a mini confidence quiz. For each true/false statement the
 * learner answers AND says how sure they are; at the end they see how often
 * they were right at each confidence level.
 *
 * {
 *   type: 'calibration',
 *   items: [{ text: 'An octopus has three hearts.', answer: true, why: 'Two pump blood through the gills, one to the body.' }, …],
 * }
 *
 * State: { done, answered, correct, results: [{ correct, level }], gap }
 *   gap — average stated confidence minus actual accuracy, in percentage
 *         points (positive = overconfident). Use `check: (s) => s.done`.
 */
import { h, cx, mdInline, icon } from './kit.js';
import { play } from '../core/audio.js';

const LEVELS = [
  { key: 'guess', pct: 55, label: 'Just guessing', hue: 'gray' },
  { key: 'think', pct: 75, label: 'Fairly sure', hue: 'blue' },
  { key: 'sure', pct: 95, label: 'Almost certain', hue: 'violet' },
];

export default function create(spec, env) {
  const items = spec.items || [];
  const results = [];
  let index = 0;
  let pickedAnswer = null;
  let pickedLevel = null;
  let readOnly = !!env.readOnly;
  const el = h('div.w-frame.w-calib');

  const summary = () => {
    const answered = results.length;
    const correct = results.filter((r) => r.correct).length;
    const avgConf = answered ? results.reduce((t, r) => t + LEVELS[r.level].pct, 0) / answered : 0;
    const acc = answered ? (correct / answered) * 100 : 0;
    return { answered, correct, gap: Math.round(avgConf - acc), done: answered >= items.length };
  };
  const getState = () => ({ ...summary(), results: results.map((r) => ({ ...r })) });

  function drawQuestion() {
    const item = items[index];
    pickedAnswer = null;
    pickedLevel = null;
    const answerBtns = [true, false].map((val) => h('button.btn', { type: 'button', 'aria-pressed': 'false' }, val ? 'True' : 'False'));
    const levelBtns = LEVELS.map((lv) => h('button.filter', { type: 'button', 'aria-pressed': 'false' }, lv.label));
    const lock = h('button.btn.btn-primary', { type: 'button', disabled: true }, 'Lock it in');
    const sync = () => { lock.disabled = pickedAnswer === null || pickedLevel === null; };
    answerBtns.forEach((btn, i) => btn.addEventListener('click', () => {
      if (readOnly) return;
      pickedAnswer = i === 0;
      answerBtns.forEach((b, j) => { b.setAttribute('aria-pressed', String(i === j)); b.classList.toggle('btn-ink', i === j); });
      play('select');
      sync();
    }));
    levelBtns.forEach((btn, i) => btn.addEventListener('click', () => {
      if (readOnly) return;
      pickedLevel = i;
      levelBtns.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      play('select');
      sync();
    }));
    lock.addEventListener('click', () => {
      if (readOnly || lock.disabled) return;
      const correct = pickedAnswer === item.answer;
      results.push({ correct, level: pickedLevel });
      play(correct ? 'correct' : 'wrong');
      drawFeedback(item, correct);
      env.onChange(getState());
    });
    el.replaceChildren(
      h('div.w-calib-count', `Statement ${index + 1} of ${items.length}`),
      h('div.w-calib-statement', { html: mdInline(item.text) }),
      h('div.w-calib-row', answerBtns),
      h('div.w-calib-sure', h('span.small.muted', 'How sure are you?'), h('div.w-calib-row', levelBtns)),
      h('div.w-calib-row', lock),
    );
  }

  function drawFeedback(item, correct) {
    const last = index >= items.length - 1;
    const next = h('button.btn.btn-primary', { type: 'button' }, last ? 'See my calibration' : 'Next statement');
    next.addEventListener('click', () => {
      index++;
      if (index >= items.length) drawResults(); else drawQuestion();
    });
    el.replaceChildren(
      h('div.w-calib-count', `Statement ${index + 1} of ${items.length}`),
      h('div.w-calib-statement', { html: mdInline(item.text) }),
      h('div', { class: cx('w-calib-verdict', correct ? 'is-right' : 'is-wrong') },
        icon(correct ? 'check' : 'x', { size: 20, stroke: 3 }),
        h('div', h('strong', `${item.answer ? 'True' : 'False'}. `), h('span', { html: mdInline(item.why || '') }))),
      h('div.w-calib-row', next),
    );
    next.focus({ preventScroll: true });
  }

  function drawResults() {
    const sum = summary();
    const rows = LEVELS.map((lv, i) => {
      const mine = results.filter((r) => r.level === i);
      if (!mine.length) return null;
      const right = mine.filter((r) => r.correct).length;
      const acc = Math.round((right / mine.length) * 100);
      return h('div', { class: cx('w-calib-result', `hue-${lv.hue}`) },
        h('div.w-calib-result-head', h('strong', lv.label), h('span.small.muted', `${right} of ${mine.length} right`)),
        h('div.w-calib-bars',
          h('div.w-calib-bar', h('span.tiny', `felt like ${lv.pct}%`), h('i.is-stated', { style: { width: `${lv.pct}%` } })),
          h('div.w-calib-bar', h('span.tiny', `actually ${acc}%`), h('i', { style: { width: `${Math.max(acc, 2)}%` } })),
        ),
      );
    });
    let verdict;
    if (sum.gap > 12) verdict = `You felt about **${sum.gap} points more confident** than your results justified. That is the most common pattern there is — almost everyone is overconfident on questions like these.`;
    else if (sum.gap < -12) verdict = `You were **more accurate than you felt** (by about ${-sum.gap} points). You can afford to trust yourself a little more.`;
    else verdict = 'Your confidence **matched your accuracy** closely. That is good calibration — and it is a skill that improves with practice.';
    el.replaceChildren(
      h('div.w-calib-count', `You got ${sum.correct} of ${sum.answered}`),
      h('div.w-calib-results', rows),
      h('p.w-calib-summary', { html: mdInline(verdict) }),
    );
    env.onChange(getState());
  }

  if (items.length) drawQuestion();

  return {
    el,
    getState,
    setState(next) {
      // used to show a "finished" state: fill in results and jump to the chart
      if (!next || !next.done) return;
      results.length = 0;
      const src = Array.isArray(next.results) && next.results.length ? next.results : items.map(() => ({ correct: true, level: 1 }));
      src.forEach((r) => results.push({ correct: !!r.correct, level: r.level || 0 }));
      index = items.length;
      drawResults();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); },
  };
}
