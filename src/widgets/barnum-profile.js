/**
 * barnum-profile — the Forer ("Barnum") demonstration. The learner chooses
 * three of eight abstract shapes and asks for a "personal profile". A list of
 * statements appears, and the learner may say how well it fits (0 to 5).
 * "How was this made?" then tells the truth: the text is the same for
 * everyone, and the shapes were never used. The learner can choose other
 * shapes and build again to see for themselves that nothing changes.
 *
 * The rating is optional, is shown only to the learner, and is not part of
 * the widget's state. The widget draws no conclusion about the learner.
 *
 * {
 *   type: 'barnum-profile',
 *   statements: ['You have a need for other people to like and admire you…', …],   // the profile (the same for everyone)
 *   note: 'In 1949 Bertram Forer gave 39 students this kind of text…',             // shown with the debriefing (markdown)
 * }
 *
 * State: { picked, built, rated, revealed, builds, done }
 *   picked    how many shapes are selected (0 to 3) · built: a profile is on show
 *   rated     the learner pressed one of the rating buttons (which one is not recorded)
 *   revealed  the debriefing has been shown · done: the same
 *   builds    how many times a profile has been built
 * Use `check: (s) => s.done`. setState accepts { revealed: true }.
 */
import { h, addStyles, mdInline } from './kit.js';
import { play } from '../core/audio.js';

addStyles('barnum-profile', `
  .widget-barnum-profile { gap: var(--s3); padding: var(--s4) var(--s5); border: var(--bw) solid var(--edge); border-radius: var(--r-lg); background: var(--surface); }
  .widget-barnum-profile > * { min-width: 0; max-width: 100%; }
  .widget-barnum-profile .bp-head { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-2); text-align: center; }
  .widget-barnum-profile p { margin: 0; text-wrap: balance; }
  .widget-barnum-profile .bp-shapes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s2); width: min(340px, 100%); margin: 0 auto; }
  .widget-barnum-profile .bp-shape { aspect-ratio: 1; min-height: 48px; border: var(--bw) solid var(--edge-strong); border-radius: var(--r); background: var(--paper); display: grid; place-items: center; padding: 6px; }
  .widget-barnum-profile .bp-shape svg { width: 70%; height: 70%; }
  .widget-barnum-profile .bp-shape[aria-pressed='true'] { background: var(--violet-soft); border-color: var(--violet); box-shadow: inset 0 0 0 2px var(--violet); }
  .widget-barnum-profile .bp-shape:focus-visible, .widget-barnum-profile .bp-rate:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-barnum-profile .bp-list { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; font-size: var(--fs-sm); }
  .widget-barnum-profile .bp-row { display: flex; flex-wrap: wrap; gap: var(--s2); justify-content: center; align-items: center; }
  .widget-barnum-profile .bp-rate { min-width: 40px; min-height: 40px; border: var(--bw) solid var(--edge-strong); border-radius: var(--r); background: var(--paper); color: var(--ink); font-weight: 800; }
  .widget-barnum-profile .bp-rate[aria-pressed='true'] { background: var(--ink); color: var(--surface); }
  .widget-barnum-profile .bp-truth { padding: var(--s3); border-radius: var(--r); background: var(--orange-soft); border: var(--bw) dashed var(--orange); font-size: var(--fs-sm); display: grid; gap: 6px; }
  .widget-barnum-profile .bp-center { text-align: center; }
`);

const SHAPES = [
  ['circle', '<circle cx="24" cy="24" r="16"/>'],
  ['square', '<rect x="9" y="9" width="30" height="30" rx="3"/>'],
  ['triangle', '<path d="M24 7L42 39H6Z"/>'],
  ['star', '<path d="M24 5l5.6 12.4 13.4 1.4-10 9.2 2.8 13.2L24 34.4 12.2 41.2 15 28 5 18.8l13.4-1.4z"/>'],
  ['wave', '<path d="M5 28q6-14 12.5 0t12.5 0 13 0"/>'],
  ['spiral', '<path d="M24 24a3 3 0 1 1 6 0a7 7 0 1 1-13 0a11 11 0 1 1 21 0a15 15 0 0 1-28 3"/>'],
  ['cross', '<path d="M24 7V41M7 24H41"/>'],
  ['crescent', '<path d="M32 7a17 17 0 1 0 0 34a13 13 0 1 1 0-34z"/>'],
];
const DEFAULT = [
  'You have a need for other people to like and admire you, and yet you tend to be critical of yourself.',
  'You have a good deal of unused capacity that you have not turned to your advantage.',
  'At times you are outgoing and sociable, while at other times you are wary and reserved.',
];

export default function create(spec, env) {
  const statements = Array.isArray(spec.statements) && spec.statements.length ? spec.statements.map(String) : DEFAULT;
  let readOnly = !!env.readOnly;
  const chosen = new Set();
  let built = false;
  let rated = false;
  let revealed = false;
  let builds = 0;

  const head = h('div.bp-head');
  const body = h('div', { style: { display: 'grid', gap: 'var(--s3)' } });
  const el = h('div.w-frame', head, body);

  const getState = () => ({ picked: chosen.size, built, rated, revealed, builds, done: revealed });

  function drawPick() {
    built = false;
    head.textContent = revealed ? 'Try other shapes' : 'Your personal profile';
    const go = h('button.btn.btn-primary', { type: 'button', disabled: chosen.size !== 3 }, 'Build my profile');
    const tiles = SHAPES.map(([name, path]) => {
      const btn = h('button.bp-shape', { type: 'button', 'aria-pressed': String(chosen.has(name)), 'aria-label': name });
      btn.innerHTML = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
      btn.addEventListener('click', () => {
        if (readOnly) return;
        if (chosen.has(name)) chosen.delete(name); else if (chosen.size < 3) chosen.add(name); else return;
        btn.setAttribute('aria-pressed', String(chosen.has(name)));
        go.disabled = chosen.size !== 3;
        play('select');
        env.onChange(getState());
      });
      return btn;
    });
    go.addEventListener('click', () => { if (readOnly || chosen.size !== 3) return; builds++; play('pop'); drawProfile(); env.onChange(getState()); });
    body.replaceChildren(
      h('p.bp-center', 'Choose the ', h('strong', 'three shapes'), ' that appeal to you most.'),
      h('div.bp-shapes', { role: 'group', 'aria-label': 'Shapes' }, tiles),
      h('div.bp-row', go),
    );
  }

  function drawProfile() {
    built = true;
    head.textContent = revealed ? 'The profile for these shapes' : 'Your profile';
    const kids = [h('ul.bp-list', statements.map((t) => h('li', t)))];
    if (!revealed) {
      const rate = h('div.bp-row', { role: 'group', 'aria-label': 'How well does this describe you? 0 is not at all, 5 is perfectly' });
      const btns = [0, 1, 2, 3, 4, 5].map((n) => {
        const b = h('button.bp-rate', { type: 'button', 'aria-pressed': 'false' }, String(n));
        b.addEventListener('click', () => { if (readOnly) return; rated = true; for (const x of btns) x.setAttribute('aria-pressed', String(x === b)); play('select'); env.onChange(getState()); });
        return b;
      });
      rate.append(...btns);
      const reveal = h('button.btn.btn-primary', { type: 'button' }, 'How was this made?');
      reveal.addEventListener('click', () => { if (readOnly) return; revealed = true; play('pop'); drawProfile(); env.announce('This profile is the same for everyone. Your shapes were not used.'); env.onChange(getState()); });
      kids.push(h('p.bp-center.small.muted', 'How well does this describe you? 0 = not at all, 5 = perfectly. (Optional, and not saved.)'), rate, h('div.bp-row', reveal));
    } else {
      const again = h('button.btn.btn-sm', { type: 'button' }, 'Choose other shapes');
      again.addEventListener('click', () => { if (readOnly) return; chosen.clear(); drawPick(); env.onChange(getState()); });
      kids.push(h('div.bp-truth',
        h('p', h('strong', 'Everyone gets exactly this text.'), ' The shapes you chose were never used', builds > 1 ? ': you have now built it with different shapes and nothing changed.' : '. Choose different ones and build it again, if you would like to check.'),
        spec.note ? h('p', { html: mdInline(spec.note) }) : null),
      h('div.bp-row', again));
    }
    body.replaceChildren(...kids);
  }

  drawPick();

  return {
    el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.revealed) { revealed = true; builds = Math.max(1, builds); if (chosen.size < 3) for (const [name] of SHAPES) { if (chosen.size < 3) chosen.add(name); } drawProfile(); }
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); },
  };
}

export const examples = [
  { title: 'barnum-profile — a profile for everyone', spec: { type: 'barnum-profile' } },
];
