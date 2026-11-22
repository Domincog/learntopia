/**
 * fast-check — run the three quick checks for a stroke on an example person
 * (a plain line drawing) and record what you find. The learner asks the person
 * to smile, to raise both arms and to say a sentence; the drawing shows the
 * result of each; then the learner ticks the signs that are present.
 *
 * {
 *   type: 'fast-check',
 *   name: 'Rosa',                       // used in the button labels and the descriptions
 *   signs: { face: true, arms: false, speech: 'slurred' },
 *        // face: one side of the mouth does not rise · arms: one arm drifts down
 *        // speech: false | 'slurred' | 'jumbled'
 *   side: 'right',                      // which side of the DRAWING is affected: 'left' | 'right'
 *   sentence: 'The sky is blue today.', // what the person is asked to say
 *   static: false,                      // true: a picture with all three checks already made, no controls
 * }
 *
 * State: { tested, testedCount, allTested, marked, markedCount }
 *   tested      the checks made so far, in the order made: 'face' | 'arms' | 'speech'
 *   marked      { face, arms, speech }: the signs the learner has ticked as present
 * The widget does not say whether the ticks are right: compare `marked` with the spec in the step's check.
 * setState({ tested: ['face', 'arms', 'speech'], marked: { face: true, arms: false, speech: true } }).
 *
 * A drawing can only hint at what these signs look like in a person. It leaves out everything a real
 * bystander would also notice (confusion, a sudden severe headache, loss of balance or vision), and
 * a person with none of the three signs can still be having a stroke.
 */
import { frame, button, s, h, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 440;
const H = 290;
const KEYS = ['face', 'arms', 'speech'];
const SAID = {
  slurred: '“Th’ shky ish… bloo… t’day.”',
  jumbled: '“Blue… the… today is… sky.”',
};

addStyles('fast-check', `
  .widget-fast-check .fc-marks { display: grid; gap: var(--s2); }
  .widget-fast-check .fc-mark {
    min-height: 42px; display: flex; align-items: center; gap: var(--s3); padding: 0.4rem 0.8rem; text-align: left;
    border: var(--bw) solid var(--edge-strong); border-radius: var(--r); background: var(--surface); color: var(--ink);
    font-weight: 700; font-size: var(--fs-sm); cursor: pointer; user-select: none; -webkit-user-select: none;
  }
  .widget-fast-check .fc-mark i { flex: none; width: 20px; height: 20px; border-radius: 6px; border: 2.5px solid var(--ink); background: var(--surface); display: grid; place-items: center; font-style: normal; font-weight: 900; font-size: 14px; line-height: 1; }
  .widget-fast-check .fc-mark[aria-checked="true"] { background: var(--orange-soft); border-color: var(--orange); }
  .widget-fast-check .fc-mark[aria-checked="true"] i { background: var(--orange); color: #1D1B26; }
  .widget-fast-check .fc-mark[aria-disabled="true"] { opacity: 0.55; cursor: default; }
  .widget-fast-check .fc-mark:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-fast-check .fc-legend { margin: 0; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); text-align: center; }
  .widget-fast-check .fc-line { fill: none; stroke: var(--ink); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .widget-fast-check .fc-arm { fill: none; stroke: var(--ink); stroke-width: 22; stroke-linecap: round; }
  .widget-fast-check .fc-sleeve { fill: none; stroke: var(--blue-soft); stroke-width: 17; stroke-linecap: round; }
`);

/** What each check shows, in words (for the description of the drawing). Exported for the course tests. */
export function describe(spec) {
  const signs = spec.signs || {};
  const side = spec.side === 'left' ? 'left' : 'right';
  return {
    face: signs.face ? `One corner of the mouth, on the ${side} of the drawing, does not rise.` : 'Both corners of the mouth rise evenly.',
    arms: signs.arms ? `The arm on the ${side} of the drawing sinks down.` : 'Both arms stay up, level with each other.',
    speech: signs.speech === 'jumbled' ? 'The words come out in the wrong order.' : signs.speech ? 'The words are slurred.' : 'The sentence is clear.',
  };
}

export default function create(spec, env) {
  const signs = { face: !!(spec.signs && spec.signs.face), arms: !!(spec.signs && spec.signs.arms), speech: spec.signs && spec.signs.speech ? (spec.signs.speech === 'jumbled' ? 'jumbled' : 'slurred') : false };
  const side = spec.side === 'left' ? 'left' : 'right';
  const dir = side === 'left' ? -1 : 1;
  const name = spec.name || 'the person';
  const sentence = spec.sentence || 'The sky is blue today.';
  const isStatic = !!spec.static || env.compact;
  const words = describe({ signs, side });
  let readOnly = !!env.readOnly;
  let tested = isStatic ? KEYS.slice() : [];
  const marked = { face: false, arms: false, speech: false };

  const fr = frame({ width: W, height: H, label: spec.alt || `A line drawing of ${name}, facing you` });
  const svg = fr.svg;
  const CX = 128;
  // body
  const armL = s('path.fc-arm');
  const armR = s('path.fc-arm');
  const sleeveL = s('path.fc-sleeve');
  const sleeveR = s('path.fc-sleeve');
  svg.append(armL, armR, sleeveL, sleeveR);
  svg.appendChild(s('path', { d: `M${CX - 62} ${H + 6} L${CX - 62} 196 Q${CX - 62} 166 ${CX - 30} 164 L${CX + 30} 164 Q${CX + 62} 166 ${CX + 62} 196 L${CX + 62} ${H + 6} Z`, fill: 'var(--blue-soft)', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
  svg.appendChild(s('rect', { x: CX - 13, y: 140, width: 26, height: 30, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 3 }));
  svg.appendChild(s('circle', { cx: CX, cy: 92, r: 56, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 3 }));
  svg.appendChild(s('circle', { cx: CX - 21, cy: 80, r: 5, fill: 'var(--ink)' }));
  svg.appendChild(s('circle', { cx: CX + 21, cy: 80, r: 5, fill: 'var(--ink)' }));
  const mouth = s('path.fc-line');
  svg.appendChild(mouth);
  // speech bubble
  const bubble = s('g', { style: 'display:none' },
    s('path', { d: 'M226 14 h192 a14 14 0 0 1 14 14 v50 a14 14 0 0 1 -14 14 h-150 l-44 26 l14 -26 h-12 a14 14 0 0 1 -14 -14 v-50 a14 14 0 0 1 14 -14 Z', fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  const said1 = s('text.fig-label', { x: 322, y: 48, 'text-anchor': 'middle' });
  const said2 = s('text.fig-label', { x: 322, y: 72, 'text-anchor': 'middle' });
  bubble.append(said1, said2);
  svg.appendChild(bubble);

  const legend = h('p.fc-legend', { 'aria-live': 'polite' });
  fr.el.insertBefore(legend, fr.readouts);

  const actions = [
    ['face', `Ask ${name} to smile`],
    ['arms', 'Ask for both arms to be raised and held'],
    ['speech', `Ask for a sentence: “${sentence}”`],
  ];
  const actionEls = new Map();
  if (!isStatic) {
    for (const [key, label] of actions) {
      const el = button(label, () => {
        if (readOnly) return;
        if (!tested.includes(key)) tested.push(key);
        play('select');
        render();
        env.announce(words[key]);
        env.onChange(getState());
      });
      actionEls.set(key, el);
      fr.buttons.appendChild(el);
    }
  }
  const marks = isStatic ? null : h('div.fc-marks', { role: 'group', 'aria-label': 'Signs you found' });
  const markEls = new Map();
  if (marks) {
    for (const [key, label] of [['face', 'Face: one side droops'], ['arms', 'Arms: one arm drifts down'], ['speech', 'Speech: slurred or jumbled']]) {
      const el = h('div.fc-mark', { role: 'checkbox', tabindex: '0', 'aria-checked': 'false' }, h('i', { 'aria-hidden': 'true' }), h('span', label));
      el.dataset.keys = 'own';
      const flip = () => {
        if (readOnly || !tested.includes(key)) return;
        marked[key] = !marked[key];
        play('select');
        render();
        env.onChange(getState());
      };
      el.addEventListener('click', flip);
      el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); flip(); } });
      markEls.set(key, el);
      marks.appendChild(el);
    }
    fr.el.appendChild(marks);
  }

  const getState = () => ({
    tested: tested.slice(),
    testedCount: tested.length,
    allTested: tested.length === KEYS.length,
    marked: { ...marked },
    markedCount: KEYS.filter((k) => marked[k]).length,
  });

  function splitWords(text) {
    if (text.length <= 20) return [text, ''];
    const mid = text.lastIndexOf(' ', Math.ceil(text.length / 2) + 4);
    return [text.slice(0, mid), text.slice(mid + 1)];
  }

  function render() {
    // the mouth: neutral, an even smile, or a smile on one side only
    const y = 118;
    const x0 = CX - 26;
    const x1 = CX + 26;
    if (!tested.includes('face')) mouth.setAttribute('d', `M${x0 + 6} ${y} L${x1 - 6} ${y}`);
    else if (!signs.face) mouth.setAttribute('d', `M${x0} ${y - 8} Q${CX} ${y + 20} ${x1} ${y - 8}`);
    else if (dir > 0) mouth.setAttribute('d', `M${x0} ${y - 8} Q${CX - 6} ${y + 16} ${CX + 6} ${y + 6} L${x1 - 2} ${y + 9}`);
    else mouth.setAttribute('d', `M${x1} ${y - 8} Q${CX + 6} ${y + 16} ${CX - 6} ${y + 6} L${x0 + 2} ${y + 9}`);
    // the arms: at the sides, both out level, or one sinking
    const shoulderL = [CX - 56, 186];
    const shoulderR = [CX + 56, 186];
    const up = tested.includes('arms');
    const end = (sh, sign) => {
      if (!up) return [sh[0] + sign * 16, H + 10];
      const drifts = signs.arms && sign === dir;
      return drifts ? [sh[0] + sign * 52, sh[1] + 58] : [sh[0] + sign * 64, sh[1] - 22];
    };
    const [lx, ly] = end(shoulderL, -1);
    const [rx, ry] = end(shoulderR, 1);
    for (const el of [armL, sleeveL]) el.setAttribute('d', `M${shoulderL[0]} ${shoulderL[1]} L${lx} ${ly}`);
    for (const el of [armR, sleeveR]) el.setAttribute('d', `M${shoulderR[0]} ${shoulderR[1]} L${rx} ${ry}`);
    // the sentence
    const spoke = tested.includes('speech');
    bubble.style.display = spoke ? '' : 'none';
    const [a, b] = splitWords(signs.speech ? SAID[signs.speech] : `“${sentence}”`);
    said1.textContent = a;
    said2.textContent = b;
    said1.setAttribute('y', b ? 48 : 60);

    const left = KEYS.filter((k) => !tested.includes(k)).length;
    legend.textContent = isStatic ? '' : left ? `${left === 3 ? 'Make the three checks' : left === 2 ? 'Two checks to go' : 'One check to go'}, then tick what you find.` : 'Tick every sign you can see in the drawing. Leave the others clear.';
    for (const [key, el] of actionEls) el.classList.toggle('btn-primary', !tested.includes(key));
    for (const [key, el] of markEls) {
      el.setAttribute('aria-checked', String(marked[key]));
      const off = readOnly || !tested.includes(key);
      el.setAttribute('aria-disabled', String(off));
      el.setAttribute('tabindex', off ? '-1' : '0');
      el.firstChild.textContent = marked[key] ? '✓' : '';
    }
    const seen = KEYS.filter((k) => tested.includes(k)).map((k) => words[k]).join(' ');
    svg.setAttribute('aria-label', `${spec.alt || `A line drawing of ${name}, facing you.`} ${seen || 'No check has been made yet.'}`);
  }

  render();
  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.tested)) tested = KEYS.filter((k) => next.tested.includes(k));
      if (next.marked) { tested = KEYS.slice(); for (const k of KEYS) marked[k] = !!next.marked[k]; }
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'fast-check — face and speech', spec: { type: 'fast-check', name: 'Rosa', signs: { face: true, arms: false, speech: 'slurred' }, side: 'right' } },
  { title: 'fast-check — one arm only', spec: { type: 'fast-check', name: 'Daniel', signs: { face: false, arms: true, speech: false }, side: 'left' } },
];
