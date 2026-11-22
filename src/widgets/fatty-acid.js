/**
 * fatty-acid — build an 18-carbon fatty acid and see what its double bonds do.
 *
 * A chain of 18 carbon atoms with an acid group at one end, each carbon carrying as many hydrogen atoms as it
 * has room for. The learner taps a marked bond to switch it between single and double. Every double bond
 * removes two hydrogens ("unsaturated") and, in its natural cis form, puts a kink in the chain. A switch turns
 * the double bonds to their trans form, which straightens the chain again. Under the molecule a temperature
 * scale shows where the fat melts, and so whether it is solid or liquid in a room.
 *
 * {
 *   type: 'fatty-acid',
 *   doubles: [],             // double bonds at the start, by the number of the carbon they follow, counted from the acid end
 *   sites: [9, 12, 15],      // the bonds that can be switched (any of 9, 12, 15)
 *   trans: false,            // start with the double bonds in their trans form
 *   transSwitch: false,      // show the cis / trans switch
 *   static: false,
 * }
 *
 * State: { doubles, count, trans, kind, omega, hydrogens, name, melt, solid, kinks, tried }
 *   doubles    — sorted positions of the double bonds, e.g. [9, 12]
 *   count      — how many double bonds
 *   trans      — true when the double bonds are in their trans form (false when there are none)
 *   kind       — 'saturated' | 'monounsaturated' | 'polyunsaturated'
 *   omega      — carbons counted from the far (omega) end to the first double bond: 3, 6 or 9; null when saturated
 *   hydrogens  — hydrogen atoms in the molecule (36 when saturated, two fewer for each double bond)
 *   name       — 'stearic acid', 'oleic acid', 'linoleic acid', 'alpha-linolenic acid', 'elaidic acid' …, or null
 *                for the combinations that are rare in food
 *   melt       — melting point in °C, or null when not known here
 *   solid      — true when it melts above 20 °C (room temperature); null when melt is null
 *   kinks      — how many bends the chain has (the number of cis double bonds)
 *   tried      — how many different molecules have been on screen so far, the first one included
 *
 * setState({ doubles: [9], trans: false, tried: 3 }); `tried` is optional and only ever raises the count.
 *
 * Left out: real fats are mixtures of many fatty acids, three at a time on a glycerol backbone; chains come
 * in other lengths; and a molecule is not flat. The bend drawn for a cis bond is schematic.
 */
import { frame, button, hue, s, h, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 470;                // drawn narrow, so that the molecule stays readable on a phone
const H = 330;
const N = 18;
const BOND = 24;
const KINK = 34;                     // degrees the chain turns at a cis double bond
const D2R = Math.PI / 180;
const ROOM = 20;
const T_MIN = -20;
const T_MAX = 80;
const TX0 = 50;
const TX1 = W - 50;
const TY = 276;

// melting points in °C (CRC Handbook of Chemistry and Physics, rounded)
const KNOWN = [
  { doubles: [], trans: false, name: 'stearic acid', melt: 69, found: 'beef fat, cocoa butter' },
  { doubles: [9], trans: false, name: 'oleic acid', melt: 13, found: 'olive oil, rapeseed oil' },
  { doubles: [9, 12], trans: false, name: 'linoleic acid', melt: -5, found: 'sunflower oil, nuts, seeds' },
  { doubles: [9, 12, 15], trans: false, name: 'alpha-linolenic acid', melt: -11, found: 'flaxseed, walnuts, rapeseed oil' },
  { doubles: [9], trans: true, name: 'elaidic acid', melt: 45, found: 'partially hydrogenated oils' },
  { doubles: [9, 12], trans: true, name: 'linolelaidic acid', melt: 28, found: 'partially hydrogenated oils' },
];

addStyles('fatty-acid', `
  .widget-fatty-acid .fa-site { cursor: pointer; outline: none; }
  .widget-fatty-acid .fa-site .fa-ring { fill: transparent; stroke: var(--ink-3); stroke-width: 2; stroke-dasharray: 4 5; }
  .widget-fatty-acid .fa-site:hover .fa-ring, .widget-fatty-acid .fa-site:focus-visible .fa-ring { stroke: var(--focus); stroke-width: 3.5; stroke-dasharray: none; }
  .widget-fatty-acid.is-readonly .fa-site { cursor: default; pointer-events: none; }
  .widget-fatty-acid.is-readonly .fa-ring { display: none; }
  .widget-fatty-acid .fa-info { text-align: center; font-size: var(--fs-md); min-height: 3em; line-height: 1.4; }
  .widget-fatty-acid .fa-info b { font-weight: 800; }
  .widget-fatty-acid .fa-info small { display: block; font-size: var(--fs-sm); color: var(--ink-2); }
  .widget-fatty-acid .fa-end { font-family: var(--font-body); font-size: 13px; font-weight: 800; fill: var(--ink-2); }
  .widget-fatty-acid .fa-count { font-family: var(--font-body); font-size: 11px; font-weight: 800; fill: #1D1B26; pointer-events: none; dominant-baseline: central; }
  @container wcanvas (max-width: 470px) { .widget-fatty-acid .fa-count { font-size: 13px; } .widget-fatty-acid .fa-end { font-size: 16px; } }
`);

const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/** The facts about an 18-carbon fatty acid with these double bonds. Exported for tests. */
export function describeAcid(doublesIn, transIn = false) {
  const doubles = [...new Set(doublesIn)].sort((a, b) => a - b);
  const count = doubles.length;
  const trans = count > 0 && !!transIn;
  const known = KNOWN.find((k) => same(k.doubles, doubles) && k.trans === trans) || null;
  return {
    doubles,
    count,
    trans,
    kind: count === 0 ? 'saturated' : count === 1 ? 'monounsaturated' : 'polyunsaturated',
    omega: count ? N - doubles[count - 1] : null,
    hydrogens: 2 * N - 2 * count,
    name: known ? known.name : null,
    melt: known ? known.melt : null,
    solid: known ? known.melt > ROOM : null,
    found: known ? known.found : null,
    kinks: trans ? 0 : count,
  };
}

export default function create(spec, env) {
  const sites = (Array.isArray(spec.sites) ? spec.sites : [9, 12, 15]).filter((p) => [9, 12, 15].includes(p));
  const isStatic = !!spec.static || !!env.compact;
  let doubles = (Array.isArray(spec.doubles) ? spec.doubles : []).filter((p) => [9, 12, 15].includes(p));
  let trans = !!spec.trans;
  let readOnly = !!env.readOnly;
  const seenForms = new Set();
  let triedFloor = 0;
  const note = () => seenForms.add(`${[...doubles].sort().join('-')}|${doubles.length ? trans : false}`);

  const fr = frame({ width: W, height: H, compact: env.compact, maxWidth: 580, label: spec.alt || 'A fatty acid molecule' });
  const { svg } = fr;
  const gMol = s('g');
  const gSites = s('g');
  const gTemp = s('g');
  svg.append(gTemp, gMol, gSites);
  const info = h('div.fa-info', { 'aria-live': 'polite' });
  if (!env.compact) fr.el.insertBefore(info, fr.readouts);

  let transBtn = null;
  if (spec.transSwitch && !isStatic) {
    transBtn = button('Turn to trans', () => {
      if (readOnly || !doubles.length) return;
      trans = !trans;
      play('select');
      render();
      env.announce(sentence());
      env.onChange(getState());
    });
    fr.buttons.appendChild(transBtn);
  }

  const tx = (deg) => TX0 + ((deg - T_MIN) / (T_MAX - T_MIN)) * (TX1 - TX0);

  function toggle(pos) {
    if (readOnly) return;
    doubles = doubles.includes(pos) ? doubles.filter((p) => p !== pos) : [...doubles, pos];
    if (!doubles.length) trans = false;
    play('tap');
    render();
    env.announce(sentence());
    env.onChange(getState());
  }

  const getState = () => { const { found, ...facts } = describeAcid(doubles, trans); void found; return { ...facts, tried: Math.max(seenForms.size, triedFloor) }; };

  function sentence() {
    const f = describeAcid(doubles, trans);
    const bonds = f.count === 0 ? 'no double bonds' : `${f.count} ${f.trans ? 'trans ' : ''}double bond${f.count > 1 ? 's' : ''}`;
    return `${f.name || 'An 18-carbon fatty acid'}: ${bonds}, ${f.kind}${f.omega ? `, omega-${f.omega}` : ''}, ${f.hydrogens} hydrogen atoms.${f.melt != null ? ` Melts at ${f.melt} degrees Celsius: ${f.solid ? 'solid' : 'liquid'} at room temperature.` : ''}`;
  }

  /** Carbon positions: a zigzag that turns at every cis double bond. */
  function layout(f) {
    const pts = [{ x: 0, y: 0 }];
    let heading = 0;
    for (let j = 1; j < N; j++) {
      const a = (heading + (j % 2 ? -30 : 30)) * D2R;
      const p = pts[j - 1];
      pts.push({ x: p.x + BOND * Math.cos(a), y: p.y + BOND * Math.sin(a) });
      if (f.doubles.includes(j) && !f.trans) heading += KINK;
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const dx = (W - (Math.max(...xs) - Math.min(...xs))) / 2 - Math.min(...xs) + 16;
    const dy = 26 + (200 - (Math.max(...ys) - Math.min(...ys))) / 2 - Math.min(...ys);
    return pts.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  }

  function render() {
    const f = describeAcid(doubles, trans);
    doubles = f.doubles;
    trans = f.trans;
    note();
    for (const g of [gMol, gSites, gTemp]) while (g.firstChild) g.removeChild(g.firstChild);
    const pts = layout(f);
    const unit = (a, b) => { const d = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: (b.x - a.x) / d, y: (b.y - a.y) / d }; };

    // hydrogens first, so that the chain is drawn over their stalks
    const hAtom = (c, nx, ny) => {
      const x = c.x + nx * 15;
      const y = c.y + ny * 15;
      gMol.appendChild(s('line', { x1: c.x, y1: c.y, x2: x, y2: y, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
      gMol.appendChild(s('circle', { cx: x, cy: y, r: 3.6, fill: 'var(--surface)', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    };
    // The acid group (drawn as one orange atom) holds one hydrogen, on its oxygen. It is drawn so that the circles
    // on screen add up to the number the widget states (36 for stearic acid, C18H36O2).
    hAtom(pts[0], 0, 1);
    for (let i = 1; i < N; i++) {                       // carbon i+1 (index i); the acid carbon has no hydrogens of its own
      const c = pts[i];
      const prev = unit(pts[i - 1], c);
      const nextDir = i < N - 1 ? unit(c, pts[i + 1]) : prev;
      // the outward direction at a zigzag corner: away from both neighbours
      let ox = prev.x - nextDir.x;
      let oy = prev.y - nextDir.y;
      const len = Math.hypot(ox, oy);
      if (len < 1e-6) { ox = -prev.y; oy = prev.x; } else { ox /= len; oy /= len; }
      const carbon = i + 1;
      const inDouble = f.doubles.includes(carbon) || f.doubles.includes(carbon - 1);
      if (i === N - 1) {                                // the CH3 at the far end
        hAtom(c, prev.x, prev.y);
        hAtom(c, -prev.y, prev.x);
        hAtom(c, prev.y, -prev.x);
      } else if (inDouble) {
        hAtom(c, ox, oy);                               // one hydrogen only
      } else {
        const a = 52 * D2R;                             // two hydrogens, splayed about the outward direction
        hAtom(c, ox * Math.cos(a) - oy * Math.sin(a), ox * Math.sin(a) + oy * Math.cos(a));
        hAtom(c, ox * Math.cos(-a) - oy * Math.sin(-a), ox * Math.sin(-a) + oy * Math.cos(-a));
      }
    }
    // bonds
    for (let j = 1; j < N; j++) {
      const a = pts[j - 1];
      const b = pts[j];
      const dbl = f.doubles.includes(j);
      if (dbl) {
        const u = unit(a, b);
        for (const sgn of [-1, 1]) gMol.appendChild(s('line', { x1: a.x - u.y * 3.5 * sgn, y1: a.y + u.x * 3.5 * sgn, x2: b.x - u.y * 3.5 * sgn, y2: b.y + u.x * 3.5 * sgn, stroke: hue('red'), 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
      } else {
        gMol.appendChild(s('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
      }
    }
    // carbons. Those counted in from the omega end to the first double bond carry their number.
    pts.forEach((p, i) => {
      const n = N - i;                                  // 1 for the last carbon, 2 for the one before …
      if (f.omega && n <= f.omega) {
        gMol.appendChild(s('circle', { cx: p.x, cy: p.y, r: 9.5, fill: hue('teal'), stroke: 'var(--ink)', 'stroke-width': 2 }));
        gMol.appendChild(s('text.fa-count', { x: p.x, y: p.y + 0.5, 'text-anchor': 'middle' }, String(n)));
      } else {
        gMol.appendChild(s('circle', { cx: p.x, cy: p.y, r: 5.5, fill: i === 0 ? hue('orange') : 'var(--ink)', stroke: 'var(--ink)', 'stroke-width': 2 }));
      }
    });
    gMol.appendChild(s('text.fa-end', { x: pts[0].x - 10, y: pts[0].y + 4, 'text-anchor': 'end' }, 'acid'));
    gMol.appendChild(s('text.fa-end', { x: pts[0].x - 10, y: pts[0].y + 19, 'text-anchor': 'end' }, 'end'));
    const last = pts[N - 1];
    gMol.appendChild(s('text.fa-end', { x: Math.min(last.x + 14, W - 12), y: last.y + 38, 'text-anchor': 'end' }, 'omega end'));
    // the bonds that can be switched
    if (!isStatic) {
      for (const pos of sites) {
        const a = pts[pos - 1];
        const b = pts[pos];
        const on = f.doubles.includes(pos);
        const g = s('g.fa-site', { tabindex: readOnly ? '-1' : '0', role: 'button', 'aria-pressed': on ? 'true' : 'false', 'aria-label': `Bond after carbon ${pos}: ${on ? 'double' : 'single'}. Press to make it ${on ? 'single' : 'double'}.` },
          s('circle', { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, r: 22, fill: 'transparent' }),
          s('circle.fa-ring', { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, r: 17 }));
        g.dataset.keys = 'own';
        g.addEventListener('click', () => toggle(pos));
        g.addEventListener('keydown', (ev) => {
          if (ev.key !== 'Enter' && ev.key !== ' ') return;
          ev.preventDefault();
          ev.stopPropagation();
          toggle(pos);
          const again = gSites.querySelector(`[data-pos="${pos}"]`);
          if (again) again.focus();
        });
        g.dataset.pos = String(pos);
        gSites.appendChild(g);
      }
      if (svg.getAttribute('role') === 'img') svg.setAttribute('role', 'group');
    }

    // temperature scale
    gTemp.appendChild(s('rect', { x: TX0, y: TY - 7, width: tx(ROOM) - TX0, height: 14, fill: hue('blue', 'soft'), stroke: 'none' }));
    gTemp.appendChild(s('rect', { x: tx(ROOM), y: TY - 7, width: TX1 - tx(ROOM), height: 14, fill: hue('orange', 'soft'), stroke: 'none' }));
    gTemp.appendChild(s('rect', { x: TX0, y: TY - 7, width: TX1 - TX0, height: 14, rx: 4, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }));
    for (let t = T_MIN; t <= T_MAX; t += 20) {
      gTemp.appendChild(s('line', { x1: tx(t), x2: tx(t), y1: TY + 7, y2: TY + 12, stroke: 'var(--ink-3)', 'stroke-width': 2 }));
      gTemp.appendChild(s('text.tick-label', { x: tx(t), y: TY + 27, 'text-anchor': 'middle' }, `${t < 0 ? '−' : ''}${Math.abs(t)} °C`));
    }
    gTemp.appendChild(s('line', { x1: tx(ROOM), x2: tx(ROOM), y1: TY - 12, y2: TY + 12, stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    gTemp.appendChild(s('text.fig-label-sm', { x: tx(ROOM), y: TY + 43, 'text-anchor': 'middle' }, 'room temperature'));
    if (f.melt != null) {
      const x = tx(f.melt);
      gTemp.appendChild(s('path', { d: `M${x} ${TY - 9}l-8 -13h16z`, fill: hue('red'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      const right = f.melt < 40;
      gTemp.appendChild(s('text.fig-label', { x: x + (right ? 13 : -13), y: TY - 22, 'text-anchor': right ? 'start' : 'end' }, `melts at ${f.melt < 0 ? '−' : ''}${Math.abs(f.melt)} °C`));
    }

    const bonds = f.count === 0 ? 'no double bonds' : `${f.count} ${f.trans ? 'trans ' : ''}double bond${f.count > 1 ? 's' : ''}`;
    const line2 = f.melt != null
      ? `${f.hydrogens} hydrogens · ${f.solid ? 'solid' : 'liquid'} at room temperature · in ${f.found}`
      : `${f.hydrogens} hydrogens · a combination that is rare in food`;
    info.replaceChildren(
      h('span', h('b', f.name ? f.name.charAt(0).toUpperCase() + f.name.slice(1) : 'An unusual fatty acid'), ` · ${bonds} · ${f.trans ? 'trans fat' : f.kind}${f.omega && !f.trans ? ` · omega-${f.omega}` : ''}`),
      h('small', line2),
    );
    if (transBtn) {
      transBtn.lastChild.textContent = trans ? 'Turn back to cis' : 'Turn to trans';
      transBtn.disabled = readOnly || !doubles.length;
    }
    svg.setAttribute('aria-label', `${spec.alt || 'A chain of 18 carbon atoms with an acid group at one end'}. ${sentence()}`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.doubles)) doubles = next.doubles.filter((p) => [9, 12, 15].includes(p));
      if (next.trans != null) trans = !!next.trans;
      if (typeof next.tried === 'number') triedFloor = Math.max(triedFloor, next.tried);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      render();
    },
  };
}

export const examples = [
  { title: 'fatty-acid — tap a bond to make it double', spec: { type: 'fatty-acid', doubles: [] } },
  { title: 'fatty-acid — cis and trans', spec: { type: 'fatty-acid', doubles: [9], sites: [9], transSwitch: true } },
  { title: 'fatty-acid — alpha-linolenic acid, an omega-3', spec: { type: 'fatty-acid', doubles: [9, 12, 15], static: true } },
];
