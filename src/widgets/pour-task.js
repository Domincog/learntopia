/**
 * pour-task — Piaget's conservation-of-liquid task, with the learner as the
 * experimenter. Two identical glasses hold the same amount of juice. The
 * learner pours one of them into a tall, thin glass (and back), and asks a
 * typical four-year-old and a typical seven-year-old whether the two glasses
 * now hold the same amount. The children's answers are the ones Piaget and
 * many later researchers recorded for those ages.
 *
 * {
 *   type: 'pour-task',
 *   ages: [4, 7],          // the two children who can be asked (labels only; the first answers by looks, the second conserves)
 *   drink: 'juice',
 * }
 *
 * The drawing keeps the amount honest: the tall glass is half as wide, so the level in it is twice as high.
 *
 * State: { poured, asked, afterYoung, afterOld, complete }
 *   poured      the juice from glass B is in the tall glass now
 *   asked       every question put so far, as strings: 'before-4', 'after-4', 'before-7', 'after-7'
 *   afterYoung  the younger child has been asked after the pouring · afterOld: the older child has
 *   complete    both of those
 *
 * setState accepts { poured, asked: [...] }.
 */
import { frame, button, hue, s, h, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('pour-task', `
  .widget-pour-task .pt-say { margin: 0; text-align: center; min-height: 3.2em; text-wrap: balance; }
  .widget-pour-task .pt-say .pt-who { display: block; font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-2); }
  .widget-pour-task .pt-say q { font-weight: 700; font-size: var(--fs-md); }
  .widget-pour-task .w-buttons .btn { white-space: normal; }
`);

const W = 520;
const H = 270;
const BASE = 236;

export default function create(spec, env) {
  const ages = Array.isArray(spec.ages) && spec.ages.length === 2 ? spec.ages : [4, 7];
  const drink = spec.drink || 'juice';
  let poured = false;
  let asked = [];
  let last = null; // { age, text }
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, label: spec.alt || 'Glasses of juice' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const say = h('p.pt-say', { 'aria-live': 'polite' });
  if (!env.compact) fr.el.insertBefore(say, fr.readouts);

  const getState = () => {
    const afterYoung = asked.includes(`after-${ages[0]}`);
    const afterOld = asked.includes(`after-${ages[1]}`);
    return { poured, asked: asked.slice(), afterYoung, afterOld, complete: afterYoung && afterOld };
  };

  const ink = { stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  function glass(x, width, height, level, label) {
    if (level > 0) g.append(s('rect', { x: x + 3, y: BASE - level, width: width - 6, height: level - 2, fill: hue('orange') }));
    g.append(s('path', { d: `M${x} ${BASE - height}V${BASE}H${x + width}V${BASE - height}`, fill: 'none', ...ink }));
    g.append(s('text', { class: 'fig-label', x: x + width / 2, y: BASE + 24, 'text-anchor': 'middle' }, label));
  }

  function draw() {
    g.replaceChildren();
    g.append(s('line', { x1: 30, x2: W - 30, y1: BASE + 2, y2: BASE + 2, stroke: 'var(--hair)', 'stroke-width': 3 }));
    glass(70, 96, 116, 62, 'A');
    glass(214, 96, 116, poured ? 0 : 62, 'B');
    glass(382, 48, 206, poured ? 124 : 0, 'tall glass');
    say.replaceChildren();
    if (last) say.append(h('span.pt-who', `A typical ${last.age}-year-old`), h('q', last.text));
    else say.append(h('span.pt-who', 'The question'), `"Is there the same amount of ${drink} in both, or does one have more?"`);
    pourBtn.lastChild.textContent = poured ? 'Pour it back into glass B' : 'Pour glass B into the tall glass';
    svg.setAttribute('aria-label', `${spec.alt || 'Glasses of juice'}. ${poured ? `Glass A is still as full as before. The ${drink} from glass B is now in the tall, thin glass, where it stands twice as high.` : `Glasses A and B are the same shape and equally full. A tall, thin glass stands empty.`}`);
  }

  function answer(i) {
    const everPoured = asked.some((a) => a.startsWith('after-'));
    if (!poured) return i === 0 && everPoured ? 'Now they are the same again.' : 'They are the same.';
    return i === 0 ? 'The tall one has more. Look how high it goes!' : `Still the same. You only poured it. It is taller, but it is thinner too.`;
  }

  const pourBtn = button('Pour glass B into the tall glass', () => {
    if (readOnly) return;
    poured = !poured;
    last = null;
    play('drop');
    draw();
    env.announce(poured ? `The ${drink} from glass B is now in the tall glass.` : `The ${drink} is back in glass B.`);
    env.onChange(getState());
  }, { variant: 'primary' });
  fr.buttons.append(pourBtn);
  ages.forEach((age, i) => {
    fr.buttons.append(button(`Ask the ${age}-year-old`, () => {
      if (readOnly) return;
      const key = `${poured ? 'after' : 'before'}-${age}`;
      const text = answer(i);
      if (!asked.includes(key)) asked.push(key);
      last = { age, text };
      play('pop');
      draw();
      env.onChange(getState());
    }));
  });
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.poured != null) poured = !!next.poured;
      if (Array.isArray(next.asked)) asked = next.asked.filter((a) => /^(before|after)-\d+$/.test(a));
      last = null;
      if (poured && asked.includes(`after-${ages[1]}`)) last = { age: ages[1], text: answer(1) };
      draw();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); },
  };
}

export const examples = [
  { title: 'pour-task — same amount, different glass', spec: { type: 'pour-task' } },
];
