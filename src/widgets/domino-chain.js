/**
 * domino-chain — a row of dominoes as a model of proof by induction. They
 * all fall when two things hold: the first one is pushed (the base case), and
 * every domino stands close enough to knock over the next (the induction
 * step). A link that is broken (the next domino stands too far away) stops
 * the chain right there.
 *
 * {
 *   type: 'domino-chain',
 *   count: 10,          // number of dominoes, 2 to 14
 *   gaps: [6],          // broken links: domino 6 cannot reach domino 7
 *   editable: true,     // the learner may tap between two dominoes to break or mend that link
 *   pushed: false,      // start with the first domino already pushed
 *   static: false,      // true: picture only
 * }
 *
 * State: { count, gaps, pushed, fallen, allFallen }
 *   gaps       the broken links, sorted: k means "domino k does not reach domino k + 1"
 *   pushed     the first domino has been pushed
 *   fallen     how many dominoes fall: 0 before the push, otherwise 1 … up to the first broken link
 *   allFallen  every domino has fallen
 *
 * Changing a link stands all the dominoes up again (pushed becomes false).
 * setState accepts { gaps: [1], pushed: true }.
 */
import { frame, readout, button, hue, s, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('domino-chain', `
  .widget-domino-chain .dc-link { cursor: pointer; outline: none; }
  .widget-domino-chain .dc-link:hover .dc-link-bg, .widget-domino-chain .dc-link:focus-visible .dc-link-bg { fill: var(--sunken); }
  .widget-domino-chain .dc-link:focus-visible .dc-link-bg { stroke: var(--focus); stroke-width: 3; }
  .widget-domino-chain.is-readonly .dc-link { cursor: default; pointer-events: none; }
`);

const W = 480;
const H = 170;
const TALL = 56;
const THICK = 12;
const GROUND = 112;

/** How many dominoes fall once the first is pushed: up to and including the first one that cannot reach its neighbour. */
export function fallenCount(count, gaps) {
  let k = 1;
  while (k < count && !gaps.includes(k)) k++;
  return k;
}

export default function create(spec, env) {
  const count = clamp(Math.round(spec.count || 10), 2, 14);
  const isStatic = !!spec.static || env.compact;
  const editable = spec.editable !== false && !isStatic;
  const tidy = (list) => Array.from(new Set((list || []).map((k) => Math.round(k)).filter((k) => k >= 1 && k < count))).sort((a, b) => a - b);
  let gaps = tidy(spec.gaps);
  let pushed = !!spec.pushed;
  let shown = pushed ? fallenCount(count, gaps) : 0; // how many are drawn as fallen (runs behind `fallen` while the chain is toppling)
  let readOnly = !!env.readOnly;
  let timer = 0;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A row of dominoes' });
  const { svg } = fr;
  const layer = s('g');
  svg.appendChild(layer);
  const roFallen = readout('fallen', { digits: 0, color: 'orange' });
  if (!env.compact) fr.readouts.appendChild(roFallen.el);

  const fallen = () => (pushed ? fallenCount(count, gaps) : 0);
  const getState = () => ({ count, gaps: gaps.slice(), pushed, fallen: fallen(), allFallen: fallen() === count });

  function draw() {
    const g = gaps.length;
    // natural spacing, then one uniform scale so that any number of broken links still fits
    const sp = 28;
    const wide = TALL + 14;
    const xs = [0];
    for (let k = 1; k < count; k++) xs.push(xs[k - 1] + (gaps.includes(k) ? wide : sp));
    const total = xs[count - 1] + THICK + TALL + 4;
    const room = W - 2 * 28 - 30;
    const scale = Math.min(1.25, room / total);
    const left = 28 + 30 + (room - total * scale) / 2;
    const lean = Math.min(66, (Math.acos(Math.min(1, (THICK + 1.5) / sp)) * 180) / Math.PI);
    layer.replaceChildren();
    layer.setAttribute('transform', `translate(${left.toFixed(1)} ${(GROUND * (1 - scale)).toFixed(1)}) scale(${scale.toFixed(3)})`);
    layer.appendChild(s('line', { x1: -40, x2: total + 10, y1: GROUND, y2: GROUND, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
    // the push
    layer.appendChild(s('path', { d: `M-38 ${GROUND - TALL + 8}h22m-8 -7l8 7l-8 7`, fill: 'none', stroke: pushed ? hue('orange') : 'var(--ink-3)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    // links (drawn first, so the dominoes sit on top)
    for (let k = 1; k < count; k++) {
      const broken = gaps.includes(k);
      const x0 = xs[k - 1] + THICK;
      const x1 = xs[k];
      const mid = (x0 + x1) / 2;
      const link = s('g', { class: 'dc-link' });
      // the tap target reaches to the middle of both dominoes, so that it is as wide as it can be
      link.appendChild(s('rect', { class: 'dc-link-bg', x: x0 - THICK / 2, y: GROUND - TALL - 8, width: x1 - x0 + THICK, height: TALL + 34, rx: 6, fill: 'transparent' }));
      if (broken) {
        link.appendChild(s('path', { d: `M${x0 + 5} ${GROUND + 13}H${x1 - 5}M${x0 + 11} ${GROUND + 8}l-6 5l6 5M${x1 - 11} ${GROUND + 8}l6 5l-6 5`, fill: 'none', stroke: hue('red'), 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
        link.appendChild(s('text', { class: 'fig-label-sm text-red', x: mid, y: GROUND + 34, 'text-anchor': 'middle' }, 'too far'));
      }
      if (editable) {
        link.setAttribute('tabindex', readOnly ? '-1' : '0');
        link.setAttribute('role', 'button');
        link.setAttribute('aria-label', `Link from domino ${k} to domino ${k + 1}: ${broken ? 'broken, too far apart' : 'close enough'}`);
        link.dataset.keys = 'own';
        link.addEventListener('click', () => toggle(k));
        link.addEventListener('keydown', (ev) => {
          if (ev.key !== 'Enter' && ev.key !== ' ') return;
          ev.preventDefault();
          ev.stopPropagation();
          toggle(k, true);
        });
      }
      layer.appendChild(link);
    }
    for (let k = 1; k <= count; k++) {
      const x = xs[k - 1];
      const down = k <= shown;
      const flat = down && (k === count || gaps.includes(k)); // nothing to lean on
      const angle = !down ? 0 : flat ? 90 : lean;
      layer.appendChild(s('rect', {
        x, y: GROUND - TALL, width: THICK, height: TALL, rx: 3, 'pointer-events': 'none', transform: `rotate(${angle.toFixed(1)} ${x + THICK} ${GROUND})`,
        fill: down ? hue('orange') : hue('blue'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5,
      }));
      if (!down) layer.appendChild(s('text', { class: count > 10 ? 'fig-label-sm' : 'fig-label', x: x + THICK / 2, y: GROUND - TALL - 8, 'text-anchor': 'middle', 'pointer-events': 'none' }, String(k)));
    }
    roFallen.set(`${shown} of ${count}`);
    if (pushBtn) pushBtn.disabled = readOnly || pushed;
    if (resetBtn) resetBtn.disabled = readOnly || !pushed;
    const f = fallen();
    svg.setAttribute('aria-label', `${count} dominoes in a row. ${g ? `Broken link${g === 1 ? '' : 's'} after domino ${gaps.join(', ')}.` : 'Every domino can reach the next.'} ${pushed ? `${f} of them ${f === 1 ? 'has' : 'have'} fallen.` : 'None has fallen yet.'}`);
  }

  function topple() {
    clearTimeout(timer);
    const target = fallen();
    if (reducedMotion() || shown >= target) { shown = target; draw(); return; }
    shown++;
    draw();
    play('tick');
    timer = setTimeout(topple, 130);
  }

  function push() {
    if (readOnly || pushed) return;
    pushed = true;
    shown = 0;
    topple();
    const f = fallen();
    env.announce(f === count ? 'Every domino falls.' : `${f} domino${f === 1 ? '' : 'es'} fall${f === 1 ? 's' : ''}, then the chain stops.`);
    env.onChange(getState());
  }
  function stand() {
    clearTimeout(timer);
    pushed = false;
    shown = 0;
  }
  function toggle(k, keepFocus = false) {
    if (readOnly || !editable) return;
    gaps = gaps.includes(k) ? gaps.filter((v) => v !== k) : tidy([...gaps, k]);
    stand();
    play('tap');
    draw();
    if (keepFocus) { const el = layer.querySelectorAll('.dc-link')[k - 1]; if (el) el.focus(); }
    env.announce(gaps.includes(k) ? `Link after domino ${k} broken.` : `Link after domino ${k} mended.`);
    env.onChange(getState());
  }

  let pushBtn = null;
  let resetBtn = null;
  if (!isStatic) {
    pushBtn = button('Push the first domino', push, { icon: 'play', variant: 'primary' });
    resetBtn = button('Stand them up', () => { if (readOnly || !pushed) return; stand(); draw(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(pushBtn, resetBtn);
  }
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      clearTimeout(timer);
      if (Array.isArray(next.gaps)) gaps = tidy(next.gaps);
      if (next.pushed != null) pushed = !!next.pushed;
      shown = fallen();
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      draw();
    },
    destroy() { clearTimeout(timer); },
  };
}

export const examples = [
  { title: 'domino-chain — one link is broken', spec: { type: 'domino-chain', count: 12, gaps: [7] } },
  { title: 'domino-chain — the chain that stops at once', spec: { type: 'domino-chain', count: 6, gaps: [1], pushed: true, static: true } },
];
