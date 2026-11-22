/**
 * Course cover illustrations, drawn in code (no image assets).
 * Each is a 160×120 SVG that takes its colours from the surrounding
 * `.hue-*` class (via --accent / --accent-soft), so one drawing works for
 * any course colour and in both themes.
 *
 *   cover('balance')  -> SVGElement
 *
 * To add one: add an entry to COVERS and reference its key from a
 * course.js `cover` field.
 */

const A = 'var(--accent)';
const SOFT = 'var(--accent-soft)';
const INK = 'var(--ink)';
const CREAM = 'var(--surface)';
const SW = 'stroke="var(--ink)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';

const COVERS = {
  // algebra: a balance scale with an unknown box
  balance: `
    <path d="M80 28 V92" ${SW} fill="none"/>
    <path d="M56 100 H104 L92 90 H68 Z" fill="${INK}" ${SW}/>
    <path d="M30 40 L130 34" ${SW} fill="none"/>
    <circle cx="80" cy="36" r="6" fill="${A}" ${SW}/>
    <path d="M30 40 L18 70 H42 Z" fill="none" ${SW}/>
    <path d="M14 70 H46 Q46 82 30 82 Q14 82 14 70 Z" fill="${CREAM}" ${SW}/>
    <rect x="20" y="50" width="20" height="20" rx="4" fill="${A}" ${SW}/>
    <text x="30" y="65.5" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="15" fill="${INK}">x</text>
    <path d="M130 34 L118 64 H142 Z" fill="none" ${SW}/>
    <path d="M114 64 H146 Q146 76 130 76 Q114 76 114 64 Z" fill="${CREAM}" ${SW}/>
    <circle cx="124" cy="57" r="6" fill="${CREAM}" ${SW}/>
    <circle cx="136" cy="57" r="6" fill="${CREAM}" ${SW}/>
    <circle cx="130" cy="47" r="6" fill="${CREAM}" ${SW}/>`,

  // geometry: overlapping shapes
  shapes: `
    <circle cx="104" cy="50" r="30" fill="${CREAM}" ${SW}/>
    <rect x="28" y="50" width="48" height="48" rx="4" fill="${A}" ${SW}/>
    <path d="M62 96 L92 30 L126 96 Z" fill="${SOFT}" ${SW} fill-opacity="0.85"/>
    <path d="M73 96 A 12 12 0 0 0 67 85" fill="none" ${SW}/>
    <circle cx="92" cy="30" r="4" fill="${INK}"/>`,

  // probability: two dice
  dice: `
    <g transform="rotate(-10 56 62)">
      <rect x="28" y="34" width="56" height="56" rx="11" fill="${CREAM}" ${SW}/>
      <circle cx="44" cy="50" r="5" fill="${INK}"/><circle cx="68" cy="50" r="5" fill="${INK}"/>
      <circle cx="56" cy="62" r="5" fill="${INK}"/>
      <circle cx="44" cy="74" r="5" fill="${INK}"/><circle cx="68" cy="74" r="5" fill="${INK}"/>
    </g>
    <g transform="rotate(14 108 64)">
      <rect x="84" y="42" width="48" height="48" rx="10" fill="${A}" ${SW}/>
      <circle cx="98" cy="56" r="4.5" fill="${INK}"/><circle cx="118" cy="76" r="4.5" fill="${INK}"/>
    </g>
    <path d="M118 22 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 z" fill="${A}" ${SW} stroke-width="2"/>`,

  // calculus: curve with a tangent line
  curve: `
    <path d="M26 96 H138 M30 100 V22" ${SW} fill="none"/>
    <path d="M30 88 C 62 86 70 30 100 34 S 128 60 136 44 L136 96 H30 Z" fill="${SOFT}" stroke="none" fill-opacity="0.9"/>
    <path d="M30 88 C 62 86 70 30 100 34 S 128 60 136 44" fill="none" ${SW} stroke-width="3.5"/>
    <path d="M52 80 L98 26" stroke="${A}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="74" cy="54" r="6" fill="${A}" ${SW}/>`,

  // number theory: a sieve of dots
  primes: (() => {
    let out = '';
    const primes = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);
    let n = 1;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        const x = 30 + c * 20;
        const y = 28 + r * 21;
        const p = primes.has(n);
        out += `<circle cx="${x}" cy="${y}" r="${p ? 8.5 : 6.5}" fill="${p ? A : CREAM}" ${SW} stroke-width="${p ? 3 : 2}"/>`;
        n++;
      }
    }
    return out;
  })(),

  // logic: a deduction grid
  logic: `
    <rect x="38" y="18" width="84" height="84" rx="10" fill="${CREAM}" ${SW}/>
    <path d="M66 18 V102 M94 18 V102 M38 46 H122 M38 74 H122" ${SW} fill="none" stroke-width="2.5"/>
    <rect x="66" y="46" width="28" height="28" fill="${A}" ${SW} stroke-width="2.5"/>
    <path d="M73 60 l5 6 l10 -12" fill="none" ${SW} stroke-width="4"/>
    <path d="M46 26 l12 12 M58 26 l-12 12" ${SW} fill="none" stroke-width="3.5"/>
    <path d="M102 82 l12 12 M114 82 l-12 12" ${SW} fill="none" stroke-width="3.5"/>
    <path d="M102 26 l12 12 M114 26 l-12 12" ${SW} fill="none" stroke-width="3.5" opacity="0.35"/>
    <path d="M46 82 l12 12 M58 82 l-12 12" ${SW} fill="none" stroke-width="3.5" opacity="0.35"/>`,

  // algorithms: bars being sorted
  bars: `
    <path d="M22 100 H138" ${SW} fill="none"/>
    <rect x="30" y="70" width="16" height="30" rx="3" fill="${CREAM}" ${SW}/>
    <rect x="52" y="34" width="16" height="66" rx="3" fill="${A}" ${SW}/>
    <rect x="74" y="54" width="16" height="46" rx="3" fill="${A}" ${SW}/>
    <rect x="96" y="44" width="16" height="56" rx="3" fill="${CREAM}" ${SW}/>
    <rect x="118" y="24" width="16" height="76" rx="3" fill="${CREAM}" ${SW}/>
    <path d="M60 24 Q71 8 82 40" fill="none" ${SW} stroke-width="2.5" stroke-dasharray="1 6"/>
    <path d="M77 33 l5 8 l6 -7" fill="none" ${SW} stroke-width="2.5"/>`,

  // programming: a code window
  code: `
    <rect x="22" y="20" width="116" height="82" rx="10" fill="${CREAM}" ${SW}/>
    <path d="M22 38 H138" ${SW} fill="none"/>
    <circle cx="33" cy="29" r="3" fill="${INK}"/><circle cx="43" cy="29" r="3" fill="${A}"/><circle cx="53" cy="29" r="3" fill="${INK}" opacity="0.3"/>
    <path d="M36 52 H64" stroke="${A}" stroke-width="6" stroke-linecap="round"/>
    <path d="M72 52 H104" stroke="${INK}" stroke-width="6" stroke-linecap="round" opacity="0.25"/>
    <path d="M48 66 H92" stroke="${INK}" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
    <path d="M48 80 H74" stroke="${A}" stroke-width="6" stroke-linecap="round"/>
    <path d="M82 80 H118" stroke="${INK}" stroke-width="6" stroke-linecap="round" opacity="0.25"/>
    <path d="M36 92 H56" stroke="${INK}" stroke-width="6" stroke-linecap="round" opacity="0.6"/>`,

  // physics: a projectile arc
  motion: `
    <path d="M18 98 H142" ${SW} fill="none"/>
    <path d="M30 96 Q 80 -24 130 96" fill="none" ${SW} stroke-width="2.5" stroke-dasharray="2 7"/>
    <circle cx="80" cy="36" r="11" fill="${A}" ${SW}/>
    <path d="M94 36 H116 M108 29 L116 36 L108 43" fill="none" ${SW}/>
    <path d="M80 50 V70 M73 63 L80 70 L87 63" fill="none" ${SW}/>
    <rect x="22" y="86" width="16" height="12" rx="2" fill="${INK}"/>
    <path d="M126 98 l4 -10 l4 10" fill="${A}" ${SW} stroke-width="2.5"/>`,

  // statistics: histogram + bell curve
  chart: `
    <path d="M20 100 H140" ${SW} fill="none"/>
    <rect x="28" y="82" width="16" height="18" fill="${CREAM}" ${SW}/>
    <rect x="44" y="60" width="16" height="40" fill="${CREAM}" ${SW}/>
    <rect x="60" y="36" width="16" height="64" fill="${A}" ${SW}/>
    <rect x="76" y="30" width="16" height="70" fill="${A}" ${SW}/>
    <rect x="92" y="52" width="16" height="48" fill="${CREAM}" ${SW}/>
    <rect x="108" y="76" width="16" height="24" fill="${CREAM}" ${SW}/>
    <path d="M22 96 C 50 96 56 20 80 20 S 108 96 138 96" fill="none" ${SW} stroke-width="3.5"/>`,

  // AI: a tiny neural network
  network: (() => {
    const layers = [[34, [36, 60, 84]], [80, [26, 50, 74, 98]], [126, [48, 76]]];
    let lines = '';
    for (let l = 0; l < layers.length - 1; l++) {
      for (const y1 of layers[l][1]) for (const y2 of layers[l + 1][1]) {
        const strong = (y1 + y2) % 3 === 0;
        lines += `<path d="M${layers[l][0]} ${y1} L${layers[l + 1][0]} ${y2}" stroke="${strong ? A : INK}" stroke-width="${strong ? 3.5 : 1.5}" opacity="${strong ? 1 : 0.35}"/>`;
      }
    }
    let nodes = '';
    layers.forEach(([x, ys], li) => ys.forEach((y, i) => {
      nodes += `<circle cx="${x}" cy="${y}" r="9" fill="${(li + i) % 2 ? CREAM : A}" ${SW}/>`;
    }));
    return lines + nodes;
  })(),

  // learning science: forgetting curves lifted by reviews
  memory: `
    <path d="M24 100 H140 M28 104 V20" ${SW} fill="none"/>
    <path d="M28 30 C 36 62 44 76 54 82" fill="none" ${SW} stroke-width="3.5"/>
    <path d="M54 82 V30" stroke="${A}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>
    <path d="M54 30 C 66 52 76 64 90 70" fill="none" ${SW} stroke-width="3.5"/>
    <path d="M90 70 V30" stroke="${A}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>
    <path d="M90 30 C 106 40 122 48 138 52" fill="none" ${SW} stroke-width="3.5"/>
    <circle cx="28" cy="30" r="5.5" fill="${A}" ${SW} stroke-width="2.5"/>
    <circle cx="54" cy="30" r="5.5" fill="${A}" ${SW} stroke-width="2.5"/>
    <circle cx="90" cy="30" r="5.5" fill="${A}" ${SW} stroke-width="2.5"/>`,

  // computers: a chip with binary
  chip: `
    <rect x="44" y="26" width="72" height="68" rx="10" fill="${A}" ${SW}/>
    <rect x="58" y="40" width="44" height="40" rx="5" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <text x="80" y="57" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-weight="700" font-size="13" fill="${INK}">1011</text>
    <text x="80" y="73" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-weight="700" font-size="13" fill="${INK}">0110</text>
    <path d="M30 42 H44 M30 60 H44 M30 78 H44 M116 42 H130 M116 60 H130 M116 78 H130 M62 12 V26 M80 12 V26 M98 12 V26 M62 94 V108 M80 94 V108 M98 94 V108" ${SW} fill="none"/>`,

  // chemistry / science: a flask and molecules
  flask: `
    <path d="M68 22 H92 M72 22 V52 L46 94 Q42 102 52 102 H108 Q118 102 114 94 L88 52 V22" fill="${CREAM}" ${SW}/>
    <path d="M58 76 L49 92 Q46 99 54 99 H106 Q114 99 111 92 L102 76 Q90 70 80 76 T58 76 Z" fill="${A}" stroke="none"/>
    <path d="M72 22 V52 L46 94 Q42 102 52 102 H108 Q118 102 114 94 L88 52 V22" fill="none" ${SW}/>
    <circle cx="74" cy="88" r="4" fill="${CREAM}" ${SW} stroke-width="2"/>
    <circle cx="90" cy="84" r="3" fill="${CREAM}" ${SW} stroke-width="2"/>
    <circle cx="118" cy="38" r="8" fill="${A}" ${SW}/><circle cx="132" cy="50" r="6" fill="${CREAM}" ${SW}/>
    <path d="M124 43 L128 46" ${SW}/>`,

  // functions and growth: an exponential curve climbing through its points
  growth: `
    <path d="M24 98 H140 M28 102 V20" ${SW} fill="none"/>
    <path d="M28 92 C 74 90 104 76 132 24 L132 98 H28 Z" fill="${SOFT}" stroke="none" fill-opacity="0.9"/>
    <path d="M28 92 C 74 90 104 76 132 24" fill="none" ${SW} stroke-width="3.5"/>
    <circle cx="56" cy="89" r="5.5" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <circle cx="84" cy="81" r="5.5" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <circle cx="108" cy="62" r="6" fill="${A}" ${SW} stroke-width="2.5"/>
    <circle cx="126" cy="35" r="6.5" fill="${A}" ${SW} stroke-width="2.5"/>`,

  // trigonometry: a point on a circle drawing a wave
  wave: `
    <path d="M14 62 H146" ${SW} fill="none" stroke-width="2" opacity="0.3"/>
    <circle cx="44" cy="62" r="26" fill="${CREAM}" ${SW}/>
    <path d="M44 62 L62 43" ${SW} fill="none"/>
    <path d="M62 43 H86" stroke="${A}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>
    <path d="M78 62 Q 92 10 106 62 T 134 62" fill="none" ${SW} stroke-width="3.5"/>
    <circle cx="62" cy="43" r="6" fill="${A}" ${SW}/>
    <circle cx="44" cy="62" r="3" fill="${INK}"/>`,

  // calculus II: an integral sign and its dx
  integral: `
    <rect x="26" y="28" width="108" height="64" rx="16" fill="${SOFT}" fill-opacity="0.9"/>
    <path d="M86 22 Q72 16 68 36 L60 84 Q56 104 42 98" fill="none" ${SW} stroke-width="6"/>
    <circle cx="88" cy="24" r="6" fill="${A}" ${SW}/>
    <circle cx="40" cy="96" r="6" fill="${A}" ${SW}/>
    <text x="108" y="72" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="30" fill="${INK}">dx</text>`,

  // probability II: balls falling through pegs into a bell shape
  bell: (() => {
    let out = `<path d="M26 104 H134" ${SW} fill="none"/>`;
    for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) out += `<circle cx="${80 + (c - r / 2) * 18}" cy="${20 + r * 12}" r="3.5" fill="${INK}"/>`;
    [10, 22, 36, 22, 10].forEach((hgt, i) => {
      out += `<rect x="${36 + i * 18}" y="${104 - hgt}" width="16" height="${hgt}" rx="2" fill="${i === 2 ? A : CREAM}" ${SW} stroke-width="2.5"/>`;
    });
    return out + `<circle cx="80" cy="60" r="5" fill="${A}" ${SW} stroke-width="2.5"/>`;
  })(),

  // inference: confidence intervals around a true value, one of them missing it
  interval: (() => {
    let out = `<path d="M80 14 V106" ${SW} fill="none" stroke-width="2.5" stroke-dasharray="2 7"/>`;
    [[50, 98, 26], [64, 112, 42], [38, 86, 58], [94, 134, 74], [56, 104, 90]].forEach(([x1, x2, y]) => {
      const miss = x1 > 80 || x2 < 80;
      out += `<path d="M${x1} ${y} H${x2} M${x1} ${y - 5} V${y + 5} M${x2} ${y - 5} V${y + 5}" ${SW} fill="none" stroke-width="2.5"/>`;
      out += `<circle cx="${(x1 + x2) / 2}" cy="${y}" r="5.5" fill="${miss ? A : CREAM}" ${SW} stroke-width="2.5"/>`;
    });
    return out;
  })(),

  // linear algebra: a grid sheared by a matrix, with its two basis arrows
  matrix: `
    <path d="M38 96 L102 96 L128 38 L64 38 Z" fill="${SOFT}" ${SW} fill-opacity="0.9"/>
    <path d="M59.3 96 L85.3 38 M80.7 96 L106.7 38 M46.7 76.7 H110.7 M55.3 57.3 H119.3" ${SW} fill="none" stroke-width="2" opacity="0.45"/>
    <path d="M38 96 H96 M88 89 L98 96 L88 103" fill="none" ${SW} stroke-width="4"/>
    <path d="M38 96 L61 44 M54 50 L62.5 40.5 L65 53" fill="none" stroke="${A}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="38" cy="96" r="5" fill="${INK}"/>`,

  // programming II: blocks nested inside blocks
  blocks: `
    <rect x="22" y="16" width="116" height="90" rx="10" fill="${CREAM}" ${SW}/>
    <rect x="34" y="28" width="92" height="22" rx="6" fill="${A}" ${SW} stroke-width="2.5"/>
    <path d="M44 39 H72" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <rect x="46" y="56" width="80" height="38" rx="7" fill="${SOFT}" ${SW} stroke-width="2.5"/>
    <path d="M56 66 H82" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
    <rect x="58" y="73" width="56" height="14" rx="5" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <path d="M66 80 H90" stroke="${A}" stroke-width="5" stroke-linecap="round"/>`,

  // algorithms II: a search tree with the chosen path marked
  tree: `
    <path d="M80 24 L48 56 M48 56 L30 90 M48 56 L66 90 M112 56 L130 90" ${SW} fill="none" stroke-width="2.5" opacity="0.45"/>
    <path d="M80 24 L112 56 L94 90" fill="none" stroke="${A}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="48" cy="56" r="9" fill="${CREAM}" ${SW}/>
    <circle cx="30" cy="90" r="8" fill="${CREAM}" ${SW}/><circle cx="66" cy="90" r="8" fill="${CREAM}" ${SW}/><circle cx="130" cy="90" r="8" fill="${CREAM}" ${SW}/>
    <circle cx="80" cy="24" r="10" fill="${A}" ${SW}/>
    <circle cx="112" cy="56" r="9" fill="${A}" ${SW}/>
    <circle cx="94" cy="90" r="9" fill="${A}" ${SW}/>
    <path d="M89 90 l4 5 l7 -9" fill="none" ${SW} stroke-width="3"/>`,

  // neural networks II: a grid of attention weights
  layers: (() => {
    const w = [[1, 0.25, 0.1, 0.1], [0.35, 1, 0.2, 0.1], [0.1, 0.45, 1, 0.25], [0.2, 0.1, 0.55, 1]];
    let out = `<rect x="46" y="24" width="76" height="76" rx="6" fill="${CREAM}" ${SW}/>`;
    w.forEach((row, r) => row.forEach((v, c) => {
      out += `<rect x="${46 + c * 19}" y="${24 + r * 19}" width="19" height="19" fill="${A}" fill-opacity="${v}" stroke="var(--ink)" stroke-width="1.5"/>`;
    }));
    out += `<rect x="46" y="24" width="76" height="76" rx="6" fill="none" ${SW}/>`;
    for (let i = 0; i < 4; i++) out += `<circle cx="30" cy="${33.5 + i * 19}" r="5" fill="${i === 2 ? A : CREAM}" ${SW} stroke-width="2.5"/>`;
    return out;
  })(),

  // proofs: a row of falling dominoes, and the mark that ends a proof
  proof: (() => {
    let out = `<path d="M16 102 H144" ${SW} fill="none"/>`;
    [[30, 40], [58, 24], [86, 10], [112, 0]].forEach(([x, angle], i) => {
      out += `<rect x="${x}" y="52" width="14" height="50" rx="3" fill="${i === 0 ? A : CREAM}" ${SW} transform="rotate(${angle} ${x + 14} 102)"/>`;
    });
    return out + `<rect x="124" y="20" width="14" height="14" rx="2" fill="${INK}"/>`;
  })(),

  // physics II: a moon in orbit, and a wave
  orbit: `
    <ellipse cx="80" cy="56" rx="58" ry="28" fill="none" ${SW} stroke-width="2.5" stroke-dasharray="2 7" transform="rotate(-10 80 56)"/>
    <circle cx="80" cy="56" r="19" fill="${A}" ${SW}/>
    <path d="M68 50 Q78 44 90 50" fill="none" ${SW} stroke-width="2.5" opacity="0.5"/>
    <circle cx="134" cy="40" r="7.5" fill="${CREAM}" ${SW}/>
    <path d="M131 30 L122 16 M121 26 L122 16 L131 20" fill="none" ${SW} stroke-width="2.5"/>
    <path d="M22 106 q8 -12 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" ${SW} stroke-width="2.5" opacity="0.55"/>`,

  // world geography: a globe with a place pin
  globe: `
    <path d="M52 108 H108 M80 98 V108" ${SW} fill="none"/>
    <circle cx="80" cy="56" r="42" fill="${SOFT}" ${SW}/>
    <path d="M74 27 Q90 22 98 33 Q108 38 103 50 Q110 62 99 73 Q93 88 84 85 Q77 74 80 63 Q65 60 65 46 Q65 33 74 27 Z" fill="${A}" ${SW} stroke-width="2.5"/>
    <path d="M48 42 Q57 38 60 47 Q58 57 53 61 Q55 72 50 77 Q43 67 44 55 Q44 47 48 42 Z" fill="${A}" ${SW} stroke-width="2.5"/>
    <path d="M38 56 H122" fill="none" ${SW} stroke-width="2" stroke-dasharray="1 7" opacity="0.6"/>
    <path d="M112 12 a10 10 0 0 1 10 10 q0 8 -10 18 q-10 -10 -10 -18 a10 10 0 0 1 10 -10 Z" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <circle cx="112" cy="22" r="3.5" fill="${INK}"/>`,

  // ancient world: pyramids under the sun
  pyramid: `
    <circle cx="38" cy="32" r="11" fill="${CREAM}" ${SW}/>
    <path d="M98 100 L124 60 L150 100 Z" fill="${CREAM}" ${SW}/>
    <path d="M24 100 L76 28 L128 100 Z" fill="${A}" ${SW}/>
    <path d="M76 28 L96 100 L128 100 Z" fill="${SOFT}" ${SW}/>
    <path d="M10 100 H152" ${SW} fill="none"/>
    <path d="M22 110 H44 M58 110 H104 M118 110 H138" fill="none" ${SW} stroke-width="2.5" opacity="0.45"/>`,

  // crossroads: a compass rose on a dotted route
  compass: `
    <path d="M10 96 Q40 70 70 92 T150 76" fill="none" ${SW} stroke-width="2.5" stroke-dasharray="2 8" opacity="0.55"/>
    <circle cx="80" cy="56" r="44" fill="${CREAM}" ${SW}/>
    <path d="M56 32 L84 52 L104 80 L76 60 Z M104 32 L84 60 L56 80 L76 52 Z" fill="${SOFT}" ${SW} stroke-width="2.5"/>
    <path d="M80 10 L88 48 L126 56 L88 64 L80 102 L72 64 L34 56 L72 48 Z" fill="${A}" ${SW}/>
    <circle cx="80" cy="56" r="4.5" fill="${INK}"/>`,

  // one world: a sailing ship
  ship: `
    <path d="M80 14 V78" ${SW} fill="none"/>
    <path d="M80 14 L98 20 L80 26 Z" fill="${INK}" ${SW} stroke-width="2"/>
    <path d="M74 30 Q52 50 42 72 H74 Z" fill="${CREAM}" ${SW}/>
    <path d="M86 34 Q112 48 122 72 H86 Z" fill="${SOFT}" ${SW}/>
    <path d="M30 78 H132 L118 98 H46 Z" fill="${A}" ${SW}/>
    <path d="M12 108 q8 -9 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" ${SW} stroke-width="2.5" opacity="0.55"/>`,

  // modern world: a factory with a smoking chimney
  factory: `
    <circle cx="118" cy="20" r="8" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <circle cx="132" cy="12" r="6" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <rect x="104" y="36" width="18" height="64" fill="${CREAM}" ${SW}/>
    <path d="M22 100 V64 L48 48 V64 L74 48 V64 L100 48 V100 Z" fill="${A}" ${SW}/>
    <rect x="34" y="76" width="12" height="12" rx="2" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <rect x="56" y="76" width="12" height="12" rx="2" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <rect x="78" y="76" width="12" height="12" rx="2" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <path d="M10 100 H150" ${SW} fill="none"/>
    <circle cx="136" cy="88" r="12" fill="${SOFT}" ${SW}/>
    <circle cx="136" cy="88" r="3.5" fill="${INK}"/>`,

  // world regions: a temple front, a tower and a dome side by side
  landmarks: `
    <path d="M14 100 H146" ${SW} fill="none"/>
    <path d="M18 56 L40 38 L62 56 Z" fill="${A}" ${SW}/>
    <path d="M24 56 V100 M34 56 V100 M46 56 V100 M56 56 V100" fill="none" ${SW}/>
    <path d="M18 56 H62" ${SW} fill="none"/>
    <path d="M82 14 L72 100 H92 Z" fill="${CREAM}" ${SW}/>
    <path d="M78 46 H86 M75 72 H89" fill="none" ${SW} stroke-width="2.5"/>
    <path d="M104 100 V70 H140 V100 Z" fill="${SOFT}" ${SW}/>
    <path d="M108 70 Q104 50 122 40 Q140 50 136 70 Z" fill="${A}" ${SW}/>
    <path d="M122 40 V28" ${SW} fill="none"/>
    <path d="M117 100 V86 Q122 80 127 86 V100" fill="${CREAM}" ${SW} stroke-width="2.5"/>`,

  // the body I: a heart with a pulse trace
  heartbeat: `
    <path d="M80 100 C44 74 26 52 38 34 C50 18 72 24 80 42 C88 24 110 18 122 34 C134 52 116 74 80 100 Z" fill="${A}" ${SW}/>
    <path d="M10 64 H52 L60 48 L70 82 L80 36 L90 74 L96 64 H150" fill="none" stroke="${CREAM}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M10 64 H52 L60 48 L70 82 L80 36 L90 74 L96 64 H150" fill="none" ${SW}/>`,

  // the body II: a nerve cell
  neuron: `
    <path d="M50 58 L26 34 M36 44 L24 52 M50 58 L22 72 M50 58 L34 96 M40 80 L24 90 M50 58 L58 24 M56 34 L70 22" fill="none" ${SW}/>
    <path d="M64 58 H118" ${SW} fill="none"/>
    <rect x="72" y="50" width="16" height="16" rx="7" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <rect x="94" y="50" width="16" height="16" rx="7" fill="${CREAM}" ${SW} stroke-width="2.5"/>
    <path d="M118 58 L136 40 M118 58 L140 58 M118 58 L136 78" fill="none" ${SW}/>
    <circle cx="138" cy="38" r="5" fill="${SOFT}" ${SW} stroke-width="2.5"/>
    <circle cx="144" cy="58" r="5" fill="${SOFT}" ${SW} stroke-width="2.5"/>
    <circle cx="138" cy="80" r="5" fill="${SOFT}" ${SW} stroke-width="2.5"/>
    <circle cx="50" cy="58" r="18" fill="${A}" ${SW}/>
    <circle cx="50" cy="58" r="6" fill="${INK}"/>`,

  // nutrition: an apple
  apple: `
    <path d="M80 44 C64 30 36 38 36 66 C36 90 56 106 68 106 C75 106 76 102 80 102 C84 102 85 106 92 106 C104 106 124 90 124 66 C124 38 96 30 80 44 Z" fill="${A}" ${SW}/>
    <path d="M80 44 Q80 28 88 20" fill="none" ${SW}/>
    <path d="M88 30 Q104 12 118 26 Q104 42 88 30 Z" fill="${SOFT}" ${SW}/>
    <path d="M50 62 Q52 50 62 46" fill="none" stroke="${CREAM}" stroke-width="5" stroke-linecap="round"/>`,

  // fitness: a running shoe at speed
  runner: `
    <path d="M12 52 H34 M8 68 H28 M14 84 H30" fill="none" ${SW} stroke-width="2.5" opacity="0.5"/>
    <path d="M40 86 V56 Q58 62 68 46 L98 66 Q120 72 140 78 Q148 82 146 92 H44 Q40 92 40 86 Z" fill="${A}" ${SW}/>
    <path d="M40 92 H146 Q146 102 136 102 H48 Q40 102 40 92 Z" fill="${CREAM}" ${SW}/>
    <path d="M70 52 L82 62 M78 46 L92 58 M88 58 L98 66" fill="none" ${SW} stroke-width="2.5"/>
    <path d="M40 70 Q54 74 62 66" fill="none" ${SW} stroke-width="2.5"/>`,

  // sleep and mind: a crescent moon and stars
  moon: `
    <path d="M92 16 A44 44 0 1 0 128 88 A36 36 0 1 1 92 16 Z" fill="${A}" ${SW}/>
    <path d="M118 22 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="${CREAM}" ${SW} stroke-width="2"/>
    <path d="M136 50 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" fill="${CREAM}" ${SW} stroke-width="2"/>
    <path d="M30 24 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" fill="${CREAM}" ${SW} stroke-width="2"/>
    <path d="M20 106 H140" fill="none" ${SW} stroke-width="2.5" stroke-dasharray="2 8" opacity="0.5"/>`,

  // staying well: a shield with a tick
  shield: `
    <path d="M80 12 L124 26 V58 C124 84 106 100 80 110 C54 100 36 84 36 58 V26 Z" fill="${A}" ${SW}/>
    <path d="M80 24 L112 34 V58 C112 76 100 88 80 96 Z" fill="${SOFT}" stroke="none"/>
    <path d="M80 12 L124 26 V58 C124 84 106 100 80 110 C54 100 36 84 36 58 V26 Z" fill="none" ${SW}/>
    <path d="M60 60 L75 75 L102 44" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`,

  // first aid: a kit with a cross
  firstaid: `
    <path d="M62 40 V30 Q62 22 70 22 H90 Q98 22 98 30 V40" fill="none" ${SW}/>
    <rect x="26" y="40" width="108" height="66" rx="12" fill="${A}" ${SW}/>
    <circle cx="80" cy="73" r="23" fill="${CREAM}" ${SW}/>
    <path d="M74 58 H86 V67 H95 V79 H86 V88 H74 V79 H65 V67 H74 Z" fill="${A}" ${SW} stroke-width="2.5"/>`,

  // psychology: a head in profile with a thought curling inside
  mind: `
    <path d="M56 106 V88 Q38 78 38 55 Q38 24 74 22 Q107 22 112 52 L123 69 L112 73 V85 Q112 95 100 95 H90 V106 Z" fill="${A}" ${SW}/>
    <circle cx="74" cy="54" r="19" fill="${CREAM}" ${SW}/>
    <path d="M64 55 Q64 43 75 43 Q85 43 85 53 Q85 62 76 62 Q70 62 70 56 Q70 51 75 51" fill="none" ${SW}/>`,

  // money: three growing stacks of coins and a sprout
  coins: `
    <g fill="${A}" ${SW}>
      <rect x="20" y="94" width="38" height="12" rx="5"/><rect x="20" y="82" width="38" height="12" rx="5"/>
      <rect x="61" y="94" width="38" height="12" rx="5"/><rect x="61" y="82" width="38" height="12" rx="5"/><rect x="61" y="70" width="38" height="12" rx="5"/><rect x="61" y="58" width="38" height="12" rx="5"/>
      <rect x="102" y="94" width="38" height="12" rx="5"/><rect x="102" y="82" width="38" height="12" rx="5"/><rect x="102" y="70" width="38" height="12" rx="5"/><rect x="102" y="58" width="38" height="12" rx="5"/><rect x="102" y="46" width="38" height="12" rx="5"/>
    </g>
    <path d="M121 46 V26" fill="none" ${SW}/>
    <path d="M121 34 Q121 22 134 20 Q134 32 121 34 Z M121 38 Q121 28 109 26 Q109 37 121 38 Z" fill="${CREAM}" ${SW}/>`,

  // generic puzzle piece fallback
  puzzle: `
    <path d="M44 34 H70 Q66 22 78 22 T86 34 H114 V60 Q126 56 126 68 T114 76 V100 H86 Q90 88 78 88 T70 100 H44 V76 Q32 80 32 68 T44 60 Z" fill="${A}" ${SW}/>
    <circle cx="66" cy="58" r="4" fill="${INK}"/><circle cx="92" cy="58" r="4" fill="${INK}"/>
    <path d="M68 72 Q79 80 90 72" fill="none" ${SW}/>`,
};

const NS = 'http://www.w3.org/2000/svg';

export function coverSvg(key) {
  const body = COVERS[key] || COVERS.puzzle;
  return `<svg class="cover-art" viewBox="0 0 160 120" xmlns="${NS}" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

export function cover(key) {
  const tpl = document.createElement('template');
  tpl.innerHTML = coverSvg(key);
  return tpl.content.firstChild;
}

export const coverKeys = () => Object.keys(COVERS);
