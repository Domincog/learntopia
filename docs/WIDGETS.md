# Widgets: interactive figures

A **widget** is an interactive (or static) figure described by a plain object called a *spec*:

```js
{ type: 'plot', x: [-5, 5], y: [-5, 5], fns: [{ expr: 'x^2' }], alt: 'A parabola' }
```

The `type` is the file name: `{ type: 'number-line' }` loads `src/widgets/number-line.js`. There is no registry to edit.

Widgets appear in lessons in three ways:

- as a **figure** on any step: `figure: { type: … }` (or an array of specs). The learner can play with it, but nothing is checked;
- as the **answer** to an `interact` step: `widget: { type: … }` plus a `check(state)`;
- as a picture inside a **choice option**: `{ figure: { type: … } }`, rendered small and read-only.

Every spec may include `alt` (a description for screen readers; always provide one) and `caption` (small text under the figure).

`#/dev/widgets` shows every widget with an example spec and its live state.

## Contents

- [Built-in widgets](#built-in-widgets): [plot](#plot) · [geo](#geo) · [number-line](#number-line) · [grid](#grid) · [balance](#balance) · [bars](#bars) · [memory-curve](#memory-curve) · [calibration](#calibration) · [memory-span](#memory-span) · [switch-cost](#switch-cost) · [photo](#photo) · [timeline](#timeline) · [world-map](#world-map) · [body-map](#body-map) · [svg](#svg) · [code](#code)
- [Writing a new widget](#writing-a-new-widget)
- [The kit](#the-kit)
- [Rules every widget must follow](#rules-every-widget-must-follow)
- [Code steps](#code-steps)

---

## Built-in widgets

Each section lists the spec and the **state** (what `check(state)` receives and what `solution` must look like). The header comment of each widget's source file is the authoritative, complete reference.

### plot

Function grapher with sliders, draggable points and calculus aids.

```js
{
  type: 'plot',
  x: [-5, 5], y: [-5, 5],                 // window
  xLabel: 'x', yLabel: 'y', xStep: 1, yStep: 1, grid: true, tickLabels: true,
  params: {                               // each becomes a slider AND a variable
    m: { min: -3, max: 3, step: 0.5, value: 1, label: 'slope $m$', color: 'blue' },
  },
  fns: [                                  // curves; expressions may use x and any param
    { expr: 'm*x + b', color: 'blue' },
    { expr: '2x - 3', color: 'gray', dashed: true },     // from / to limit the domain
  ],
  points: [
    { id: 'P', x: 1, y: 2, drag: 'xy', snap: 1, color: 'orange', label: 'P', coords: true },   // drag: 'xy' | 'x' | 'y'
    { id: 'S', x: 1, on: 0, drag: 'x' },                   // slides along curve 0
    { id: 'T', x: 'a', on: 0 },                            // fixed to curve 0 at x = a (not draggable)
  ],
  segments: [{ from: 'P', to: [0, 0], color: 'ink', dashed: true }],     // ends: a point id or [xExpr, yExpr]
  vlines: [{ x: 'a', dashed: true }], hlines: [{ y: 2 }],
  areas: [{ fn: 0, from: 0, to: 'b', color: 'blue' }],                    // shaded area under curve 0
  riemann: [{ fn: 0, from: 0, to: 4, n: 'n', mode: 'left', color: 'orange' }],   // mode: left | right | mid
  tangents: [{ fn: 0, at: 'Px', color: 'orange' }],
  secants: [{ fn: 0, from: 'a', to: 'a + h', color: 'violet' }],
  labels: [{ x: 2, y: 3, text: 'peak' }],
  readouts: [{ label: 'slope', expr: 'd0(Px)', digits: 2 }],              // or value: (state, api) => number
}
```

Expressions can use `x`, every param, draggable point coordinates as `Px` / `Py` (id + `x`/`y`), all the usual functions (`sin`, `sqrt`, `abs`, `ln`, `exp` …) and: `f0(x)` the value of curve 0, `d0(x)` its slope, `I0(a, b)` its integral, `R0()` the sum of `riemann[0]`.

**State:** `{ m: 1, b: 0, P: { x: 1, y: 2 } }` — params by name, draggable points by id.

```js
// match a target line
{ type: 'interact', text: 'Make the blue line match the dashed one.',
  widget: { type: 'plot', x: [-6, 6], y: [-6, 6], params: { m: {…}, b: {…} },
            fns: [{ expr: '2x - 3', color: 'gray', dashed: true }, { expr: 'm*x + b' }] },
  target: { m: 2, b: -3 } }
```

### geo

Dynamic geometry: draggable points with shapes and measurements that follow them. Equal scale on both axes.

```js
{
  type: 'geo',
  x: [0, 10], y: [0, 7], grid: true, axes: false,
  points: {
    A: { x: 1, y: 1, drag: true, snap: 0.5, color: 'orange' },        // label defaults to the id; label: false hides it
    C: { x: 4, y: 6, drag: true, circle: ['O', 3] },                  // stays on a circle around O
    D: { x: 2, y: 2, drag: true, segment: ['A', 'B'] },               // stays on segment AB
    E: { x: 2, y: 2, drag: true, constrain: (p, P) => ({ x: p.x, y: 3 }) },
    M: { derive: (P) => ({ x: (P.A.x + P.B.x) / 2, y: (P.A.y + P.B.y) / 2 }) },   // computed point
    O: { x: 5, y: 3, hidden: true },
  },
  shapes: [
    { kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' },          // fill: false for outline only
    { kind: 'segment', pts: ['A', 'B'], label: 'length' },             // or label: 'c'; dashed: true
    { kind: 'line', pts: ['A', 'B'] }, { kind: 'ray', pts: ['A', 'B'] }, { kind: 'vector', pts: ['A', 'B'] },
    { kind: 'circle', center: 'O', through: 'C' },                     // or r: 3
    { kind: 'angle', pts: ['B', 'A', 'C'], label: 'deg' },             // angle at the MIDDLE point; or label: 'α'
    { kind: 'right', pts: ['B', 'A', 'C'] },                           // right-angle marker at A
    { kind: 'square', pts: ['A', 'B'], color: 'green', label: 'area' },   // square built on AB (flip: true for the other side)
    { kind: 'text', at: 'A', text: 'start', dy: -14 },
  ],
  readouts: [{ label: 'Angle sum', value: (g) => g.angle('B','A','C') + g.angle('A','B','C') + g.angle('A','C','B'), digits: 0, unit: '°' }],
}
```

Readout functions get `g = { P, dist(a,b), angle(a,vertex,c), area(...ids), perimeter(...ids), slope(a,b) }`.

**State:** `{ A: { x, y }, B: { x, y } }` — the draggable points. In checks, use the geometry helpers from `content/kit.js` (`dist`, `angleDeg`, `polygonArea`, `near`):

```js
check: (s) => near(angleDeg(s.B, s.A, s.C), 90, 1.5) || 'The angle at A is not 90° yet.'
```

### number-line

```js
{
  type: 'number-line', min: -10, max: 10, step: 1,           // handles snap to `step`
  tick: 1, major: 5,                                          // tick spacing (auto if omitted)
  points: [{ id: 'a', value: 0, color: 'orange', label: 'a' }],       // drag: false to pin; showValue: false to hide the number
  marks: [{ value: 3.5, label: '3.5', color: 'blue', hollow: false }],
  ranges: [{ from: 'a', to: null, color: 'blue', openFrom: true }],   // ends: number, point id, or null for "forever"
  hops: [{ from: 2, to: 7, label: '+5', color: 'green' }],
}
```

**State:** `{ a: 0 }` — one number per point.

### grid

A board of tappable cells: area models, fractions, sieves, pixel pictures, arrays.

```js
{
  type: 'grid', rows: 10, cols: 10,
  on: [0, 11, 22],               // initially selected (row-major indices from 0), or a 2-D array of 0/1
  locked: [0],                   // cells that cannot change
  colors: ['blue'],              // tapping cycles off → colors[0] → colors[1] → … → off
  labels: 'index1',              // 'index' | 'index1' | array | (i, row, col) => text
  shape: 'square',               // or 'circle'
  cell: 40, max: 12, counter: 'Selected', total: true,
  rowLabels: ['a', 'b'], colLabels: ['1', '2'],
}
```

**State:** `{ on: [sorted indices], colors: { index: colourNumber }, count }`. Dragging paints.

### balance

A pan balance for equations.

```js
{
  type: 'balance',
  left: { x: 2, ones: 3 }, right: { x: 0, ones: 11 },   // mystery boxes and unit weights on each pan
  xValue: 4,                                             // true weight of a box
  mode: 'both',                                          // 'both': every move applies to both pans (stays level)
  ops: ['sub1', 'subx', 'div'],                          //   buttons: add1 sub1 addx subx div
  // mode: 'free', edit: { right: ['ones'] },            // 'free': pans are edited separately and it can tip
  equation: true,                                        // show the matching equation
  static: false,                                         // true: picture only (use for figures)
}
```

**State:** `{ left: { x, ones }, right: { x, ones }, balanced, solved, moves }` — `solved` means one box alone against only unit weights.

### bars

Bar chart, single or grouped. With `adjust` the learner drags the bars (ideal for "draw your prediction").

```js
{ type: 'bars', data: [{ label: 'Mon', value: 3, color: 'blue' }], yMax: 10 }

{ type: 'bars',
  categories: ['After 5 minutes', 'After 1 week'],
  series: [{ name: 'Re-read', color: 'gray', values: [80, 40] }, { name: 'Self-test', color: 'orange', values: [70, 60] }],
  yMax: 100, yStep: 20, yLabel: '% remembered', unit: '%',
  adjust: [1], step: 5 }                 // adjust: true (all series) or a list of series indices
```

**State:** `{ values: [[…series 0…], […series 1…]] }`.

### memory-curve

The forgetting curve as a toy: tap to add reviews and watch the decay slow.

```js
{ type: 'memory-curve', days: 30, strength: 1, reviews: [3], editable: true, budget: 3, threshold: 0.7 }
```

**State:** `{ reviews: [days], lowest, final, ok }` (`ok`: never dropped below the threshold).

### calibration

A confidence quiz: answer true/false statements, say how sure you are, see your calibration.

```js
{ type: 'calibration', items: [{ text: 'An octopus has three hearts.', answer: true, why: 'Two for the gills, one for the body.' }] }
```

**State:** `{ done, answered, correct, gap, results }`. Use with `check: (s) => s.done`.

### memory-span

"How much can you hold?" A sequence appears for a few seconds, disappears, and the learner types it back. Used to let people feel the limit of working memory, and how grouping gets round it.

```js
{ type: 'memory-span', lengths: [4, 6, 8, 10] }                     // random digits, one round per length
{ type: 'memory-span', kind: 'letters', lengths: [5, 7] }           // random consonants
{ type: 'memory-span', rounds: [                                    // or fixed rounds
    { show: 'QXJZKVWPRMTB', label: 'Twelve letters', seconds: 6 },
    { show: 'TREE MOON FISH', label: 'Twelve more letters', seconds: 6 } ] }
```

Spaces in `show` are displayed but ignored when the answer is compared. State: `{ done, round, best, results: [{ length, right, correct }] }`, where `best` is the longest sequence recalled completely. Check with `(s) => s.done`.

### switch-cost

A two-round tapping experiment: first numbers then letters, then the same tiles alternating (1, A, 2, B …). The learner sees how much longer the second round took. The clock here is the measurement, not a deadline, and the step should not be graded.

```js
{ type: 'switch-cost' }               // eight numbers and eight letters
{ type: 'switch-cost', count: 5 }     // a shorter version
```

State: `{ done, round, single, switching, cost, slips }`: seconds for each round, the extra time as a percentage, and wrong taps per round. Check with `(s) => s.done`.

### photo

A photograph or an artwork with its credit. As a figure it can be enlarged; inside a choice option it becomes a small card; with `hotspots` the learner taps a part of it. How pictures get into the project, the licence rules and how to write alt text are in [IMAGES.md](IMAGES.md).

You do not write this spec by hand. Add the picture with `tools/fetch-image.mjs`, then build the spec from its record:

```js
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/<course-id>/index.js';

figure: photo(MEDIA['angkor-wat'], {
  alt: 'A wide stone temple with towers shaped like lotus buds, mirrored in a pond',   // required
  caption: 'Angkor Wat, Cambodia, built in the 12th century',                          // optional
})
```

`photo()` fills in `src`, `thumb`, `width`, `height`, `credit`, `license`, `licenseUrl`, `sourceUrl`, `publicDomain`, `title` and `changes` from the record; the second argument adds:

```js
{
  alt: '…',                    // what the picture shows. Required; the validator insists
  caption: '…',                // shown under a figure
  creditLabel: 'Painting',     // first word of the credit (default "Photo"; "Image" for public-domain works)
  aspect: '16:9',              // show in a box of this shape instead of the picture's own …
  fit: 'cover',                //   … 'cover' fills the box, 'contain' shows everything
  magnify: 1.5,                //   … and with 'cover', enlarges the picture this many times around `focus`
  focus: [0.5, 0.3],           //   … and with 'cover' this point of the picture stays in view
  maxWidth: 640, zoom: true,   // largest display width in px; false removes the enlarge button
  hotspots: [                  // parts of the picture: x, y in fractions of width and height, r in fractions of the WIDTH
    { id: 'fuji', x: 0.64, y: 0.69, r: 0.06, label: 'Mount Fuji', alt: 'a small peak in the distance' },
  ],
  mode: 'pick',                // with hotspots: 'pick' (numbered rings, choose one), 'point' (nothing marked: tap or move a marker),
                               //   'label' (rings with labels, nothing to answer)
  hideLabels: true,            // pick: labels appear only once the step is answered (default). false shows them from the start
}
```

Under a figure the widget shows the credit as a link to the source page: "Photo: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons", or "Public domain, via Wikimedia Commons". The enlarged view (tap the picture, or the round button; Esc closes) adds the work's name, a link to the licence and what was changed.

As a **choice option** (`options: [{ figure: photo(…), correct: true }, …]`) the picture fills a 4:3 card and is loaded from the small file. The choice step lays photo options out two by two on a phone and in one row on a laptop, and lists their credits in a closed "Picture credits" line under the grid. Write option alt texts that describe without naming the answer. On a card, `focus` decides which part of the overhang is cut; where there is no overhang in the direction the focus points (a 3:2 picture has none above and below), the card is enlarged ×1.25 around the focus so that it takes effect; `magnify` sets the enlargement yourself; `fit: 'contain'` shows the whole picture inside the same card.

A `caption` may use inline Markdown (`*italic*`, `**bold**`, `$math$`). A picture under CC BY or CC BY-SA is never shown without a name: if its record has none, the line reads "Photo: author named on the source page, CC BY 2.5, via Wikimedia Commons" until someone records the author with `tools/fetch-image.mjs --author` (see [IMAGES.md](IMAGES.md#credits-that-need-a-hand)).

**State:** `pick` → `{ picked: 'fuji' | null, label }`; `point` → `{ picked: id of the hotspot under the marker or null, point: { x, y } | null, label }`; otherwise `{}`.

```js
{ type: 'interact', text: '**Tap Mount Fuji.**',
  widget: photo(MEDIA['great-wave'], { alt: '…', hotspots: [/* … */] }),
  check: (s) => s.picked === 'fuji' || (s.picked === 'wave' ? 'That is the wave. The mountain looks small because it is far away.' : false),
  solution: { picked: 'fuji' } }
```

Rings can be reached with Tab and the arrow keys; the marker of `point` mode moves with the arrow keys (Shift for bigger steps). Labels that would cover one another once they are shown (spots close together, a narrow screen) are moved apart: to the other side of their ring, or beside it. Labels that collide with nothing stay where they are, below the ring.

### timeline

A horizontal time axis: events as dots with labels, spans (empires, eras, lifetimes) as bars in rows.

```js
{
  type: 'timeline',
  from: -3000, to: 2000,                 // years. BCE years are negative: 500 BCE is -500
  step: 1000,                            // tick spacing in years (chosen to fit when omitted)
  events: [{ id: 'rome', year: -753, label: 'Rome founded', short: 'Rome', color: 'red', note: 'Shown when tapped.' }],
  spans:  [{ id: 'han', from: -206, to: 220, label: 'Han dynasty', color: 'teal', note: '…', row: 0 }],   // row is optional
  showYears: false,                      // write the year after each event label
  era: 'auto',                           // "500 BCE" / "1500 CE" when the axis starts before year 1, plain "1789" otherwise; 'always' | 'never'
  axisLabel: 'years', alt: '…',
  minWidth: 0,                           // px: below this width the axis scrolls sideways inside its frame
  mode: 'explore',                       // 'static' | 'explore' (tap to read a note) | 'pick' (tap the answer) | 'place' (drag cards)
  hideLabels: false,                     // pick: numbers and letters instead of names until the step is answered
  place: [{ id: 'press', label: 'Printing press', answer: 1450 }],   // cards to place; `answer` is only shown afterwards, never judged
  snap: 10,                              // place: years per step
  scale: 'linear',                       // 'log-ago' for deep time: years ago, ten times further back at every step to the left
  now: 2025, fromAgo: 5e9, toAgo: 1000,  //   with 'log-ago', ends, events (`ago`) and spans (`fromAgo`, `toAgo`) may be given as years ago
}
```

`setState` (and so a step's `solution`) takes `{ selected: id }`, `{ seen: [ids] }` (explore: marks those notes as read and opens the last one, which is what a check on `seenCount` needs), `{ picked: id }` or `{ placed: { id: year } }`.

The mode defaults to `place` when there are cards, to `explore` when anything has a `note`, and to `static` otherwise. Do not rebuild "put these in order" with it: that is the [`order`](AUTHORING.md#order--put-in-sequence) step.

**No year zero.** 1 BCE is followed by 1 CE. Write 1 BCE as `-1` and 1 CE as `1`; never give an event the year `0` (the validator warns), and never subtract across the boundary yourself. Two helpers are exported for lesson text:

```js
import { formatYear, yearsBetween } from '../../../../src/widgets/timeline.js';

formatYear(-500)        // "500 BCE"          formatYear(1500)  // "1500 CE"     formatYear(1789, { ce: false })  // "1789"
yearsBetween(-44, 14)   // 57, not 58
```

**State**

| Mode | State | Typical check |
|------|-------|---------------|
| `explore` | `{ selected, seen: [ids], seenCount }` | `(s) => s.seenCount >= 3` on a `graded: false` step, with `solution: { seen: ['rome', 'han', 'maya'] }` |
| `pick` | `{ picked: id or null, kind: 'event' or 'span' }` | `(s) => s.picked === 'han'` |
| `place` | `{ placed: { press: 1450 }, count, complete, off: { press: 0 }, maxOff }` (`off` and `maxOff` only when cards have an `answer`) | see below |

```js
{ type: 'interact', text: '**Drag each card to its place.** Within 50 years counts.',
  widget: { type: 'timeline', from: 1400, to: 2000, step: 100, snap: 10,
            events: [{ year: 1492, label: 'Columbus sails', color: 'gray' }],
            place: [{ id: 'press', label: 'Printing press', answer: 1450 }, { id: 'moon', label: 'Moon landing', answer: 1969 }] },
  check: (s) => {
    if (!s.complete) return 'Place both cards on the line.';
    if (Math.abs(s.placed.press - 1450) > 50) return 'The printing press is older than that: before Columbus.';
    return Math.abs(s.placed.moon - 1969) <= 50 || 'People walked on the Moon within living memory.';
  },
  solution: { placed: { press: 1450, moon: 1970 } } }
```

Always check with a tolerance (a card moves in steps of `snap`), and say in the text how close is close enough. Give the learner one or two fixed events or spans as landmarks. Cards are dragged, or moved with ← → (Shift: ten steps, Home / End: the ends); tapping the line moves the card last touched.

The drawing is laid out for the width it gets, at real text size: on a phone, labels that would collide are stacked; if they still do not fit, each event's `short` label is used, and failing that events are numbered (spans lettered) with a legend underneath. Keep labels to two or three words. For a long, crowded axis set `minWidth` and it scrolls sideways inside its frame.

### `world-map`

An interactive map of the world or of any region, drawn from public-domain Natural Earth data: highlight groups of countries, add markers, routes and areas, switch projection (including a globe that turns), and use it for graded steps where the learner picks a country, picks a marker, drops a pin or traces a route.

```js
{ type: 'world-map', view: 'africa', mode: 'pick', names: false, answer: 'ET', alt: 'A map of Africa' }
```

It has its own guide, with every option, the country and region identifiers, the state of each mode and advice on writing `check` functions: **[MAPS.md](MAPS.md)**.

### `body-map`

Every picture of the human body: the whole figure from the front and from behind, the chest and abdomen enlarged, the head in section, and schematics of the heart, the airways, the skin and a cell. All of it is original artwork drawn in code. Show a system, highlight and label structures, animate a flow, or use it for graded steps where the learner taps a structure, taps a marker or puts a marker on the right spot.

```js
{ type: 'body-map', view: 'torso', show: ['digestive'], mode: 'pick', names: false, answer: 'liver',
  alt: 'The digestive organs of the abdomen' }
```

The figure faces the viewer, and sides are always the person's own. Its guide has every option, the structure identifiers, the state of each mode and what the drawings simplify: **[BODY.md](BODY.md)**.

### svg

A static diagram. Use the theme classes instead of colours so it works in light and dark mode.

```js
{ type: 'svg', viewBox: '0 0 320 120', maxWidth: 360, alt: 'Two boxes joined by an arrow',
  content: '<rect class="fill-blue-soft stroke-ink" stroke-width="2.5" x="20" y="30" width="100" height="60" rx="10"/>' +
           '<text class="fig-label" x="70" y="65" text-anchor="middle">input</text>' }
```

Classes: `fill-{hue}`, `fill-{hue}-soft`, `fill-ink`, `fill-surface`, `fill-none`, `stroke-{hue}`, `stroke-ink`, `stroke-hair`, text: `fig-label`, `fig-label-sm`, `fig-label-lg`, `fig-math`, `text-{hue}`, `text-muted`. Hues: blue red green orange violet teal pink yellow gray. Use `stroke-width` 2.5–3 and round caps to match the house style.

### code

A read-only code listing: `{ type: 'code', lang: 'python', code: '…', numbers: true, mark: [3] }` (languages: `python`, `js`, `pseudo`).

---

## Writing a new widget

Create `src/widgets/<type>.js` (lowercase, dashes). It default-exports a factory:

```js
/**
 * coin-flip — flip a coin many times and watch the proportion settle.
 *
 * { type: 'coin-flip', flips: 100, bias: 0.5 }
 *
 * State: { heads, tails, total }
 */
import { frame, button, readout, hue, s, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('coin-flip', `
  .widget-coin-flip .coin { transition: transform 0.3s var(--ease-spring); }
`);

export default function create(spec, env) {
  // env: { rng, readOnly, compact, onChange(state), announce(text) }
  const fr = frame({ width: 560, height: 240, label: spec.alt || 'Coin flip experiment' });
  let heads = 0;
  let total = 0;
  let readOnly = env.readOnly;

  const count = readout('heads', { digits: 0 });
  fr.readouts.appendChild(count.el);
  fr.buttons.appendChild(button('Flip 10', () => {
    if (readOnly) return;
    for (let i = 0; i < 10; i++) { total++; if (env.rng.bool(spec.bias ?? 0.5)) heads++; }
    play('tick');
    render();
    env.onChange(getState());            // tell the lesson something changed
  }, { icon: 'dice' }));

  function render() { count.set(`${heads} of ${total}`); /* …update the SVG… */ }
  const getState = () => ({ heads, tails: total - heads, total });

  render();
  return {
    el: fr.el,                            // required
    getState,                             // plain JSON-able data
    setState(next) { if (next) { heads = next.heads ?? heads; total = next.total ?? total; render(); } },
    setReadOnly(v) { readOnly = !!v; },
    destroy() { /* stop loops, remove window listeners */ },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'coin-flip — a fair coin', spec: { type: 'coin-flip', flips: 100 } },
];
```

### The factory contract

| Member | Required | Purpose |
|--------|----------|---------|
| `el` | yes | Root element. The loader adds the classes `widget widget-<type>`. |
| `getState()` | for `interact` | Plain data describing what the learner has done. Include **derived facts** that make checks easy to write (`solved`, `balanced`, `ok`, counts), not only raw positions. |
| `setState(state)` | for `interact` | Restore a state. Must accept an author-written `solution`, which will contain only the essential fields — recompute anything derived. |
| `setReadOnly(bool)` | yes if interactive | Freeze all input (called when a step is resolved). |
| `destroy()` | if needed | Stop animation loops and timers; remove listeners added outside `el`. |

`env` gives you: `rng` (use it for **all** randomness so results can be reproduced), `readOnly`, `compact` (rendered small inside a choice option: hide controls, keep it simple), `onChange(state)` (call after every learner-driven change, not on initial render or `setState`), and `announce(text)` for screen-reader messages.

Document the spec and the state in the file's header comment. That comment *is* the reference.

---

## The kit

`src/widgets/kit.js` has the shared building blocks. Read its source; every function is documented.

| Function | Use |
|----------|-----|
| `frame({ width, height, plain, label })` | Standard container: `{ el, svg, canvas, readouts, controls, buttons }`. Draw into `svg`; append `sliderRow`s to `controls`, `readout`s to `readouts`, `button`s to `buttons`. |
| `plane({ x, y, width, height, pad })` | Maths ↔ pixel mapping: `sx`, `sy`, `ux`, `uy`, `left/right/top/bottom`, `kx/ky`. |
| `drawAxes(pl, opts)` | Grid, axes and tick labels. |
| `handle(svg, { x, y, color, label, onMove, onEnd })` | A draggable point with a generous touch target and arrow-key support. *You* constrain it in `onMove` and call `handle.set()`. |
| `sliderRow({ label, min, max, step, value, onInput })` | Labelled slider with live value. |
| `readout(label, { digits, unit })` | Live number pill: `.set(value)`. |
| `button(text, onClick, { icon, variant })` | Small button. |
| `loop(fn)` | `requestAnimationFrame` loop with `dt`; `.start()`, `.stop()`. Stop it in `destroy()`. |
| `fnPath(f, pl)` | SVG path for `y = f(x)`, broken at discontinuities. |
| `svgPoint(svg, event)` | Pointer position in SVG coordinates. |
| `hue(name, 'soft' or 'text')` | Theme colour as a CSS variable. |
| `addStyles(id, css)` | Attach the widget's own CSS once. |
| `clipTo`, `arrowMarker`, `niceStep`, `ticks`, `snapTo`, `tidy`, `clamp` | Small utilities. |
| `h`, `s`, `cx` | Create HTML / SVG elements (`s('circle', { cx: 5, cy: 5, r: 3 })`). |

Also useful: `play(name)` from `src/core/audio.js` for a soft sound (`tap`, `drop`, `select`, `pop`, `tick`, `correct`, `wrong`), `reducedMotion()` from `src/core/dom.js`, `compile(expr, { vars })` from `src/core/mathexpr.js` for safe expression evaluation, and `mdInline(text)` to render lesson markdown and math in a label.

---

## Rules every widget must follow

**Look like it belongs**

- Colours come from the palette via `hue()` or the CSS variables (`var(--ink)`, `var(--surface)`, `var(--hair)` …). Never hex codes, with one exception: text drawn on a vivid fill may use `#1D1B26`.
- House style: 2.5–3 px outlines in `var(--ink)`, rounded corners and round line caps, flat fills (soft tint for areas, vivid for the thing in focus), no gradients or drop shadows inside figures.
- Text inside SVG uses the classes `fig-label`, `fig-label-sm`, `tick-label`, `axis-label`.
- Check both themes (Settings → Theme), a phone-width window, and a short laptop window (about 1366 × 700).
- Build drawings with `frame()` whenever you can. A framed drawing is sized for you: it grows when it has a column to itself, shrinks to stay inside a short screen, and on a laptop its sliders, readouts and buttons move beside it when stacking them would not fit. That only works if controls go where the kit expects them (`fr.readouts`, `fr.controls`, `fr.buttons`, or other direct children of `fr.el`), so do not wrap the canvas in extra containers. Things in that side column can be as narrow as 250px: let rows of buttons wrap.
- Do not size things from the viewport (`vw`, or media queries on the screen width) to decide how a drawing looks: the same widget is shown at 360px on a phone, in a 650px column on a laptop and as a thumbnail inside an answer option. Text classes such as `tick-label` already adapt to the drawing's own width.

**Work for everyone**

- Everything draggable must also work from the keyboard (the kit's `handle` does this for you) and by tap.
- Touch targets are at least 40 × 40 px. Use Pointer Events, not mouse events. Set `touch-action: none` only on the element being dragged, so the page can still scroll.
- Give the root or the SVG an `aria-label` describing the current state where practical, and call `env.announce()` for important changes.
- A kit `handle` is exposed to screen readers as a slider. Call `hd.setLabel('x 2, y 3')` whenever it moves so the spoken value means something; without it the position is read as a percentage of the figure.
- An SVG from `frame()` starts life as a picture (`role="img"`). If you put anything focusable inside it, the loader turns it into a group so those parts stay reachable. Do not use `role="grid"` unless you also build real rows and cells; a group of labelled buttons is simpler and correct.
- Never rely on colour alone to carry meaning; add a label, icon or pattern.
- Animations must be skippable in spirit: check `reducedMotion()` and jump to the end state when it is true.
- Keyboard handlers on focusable parts should set `element.dataset.keys = 'own'` so that Enter and letter keys are not interpreted as lesson shortcuts.

**Behave**

- No network requests, no `eval`, no timers left running after `destroy()`.
- Randomness only through `env.rng`.
- `getState()` returns plain data (it is JSON-stringified by tools).
- A widget never decides whether the learner is right — the lesson's `check` does. Widgets expose facts.
- Keep it fast: a first render under ~16 ms, and no layout thrashing in pointer handlers.
- One file per widget, self-contained. Do not edit `kit.js` or shared CSS for a single widget's needs; use `addStyles`.

**Prove it**

- Export `examples` (at least one spec) so the gallery and smoke test can mount it.
- Use it in a lesson and run `node tools/smoke.mjs --lesson <course>/<lesson> --shots /tmp/shots`, then look at the screenshots at both sizes.
- Run `node tools/a11y.mjs --lesson <course>/<lesson>` and fix what it reports.

---

## Code steps

The `code` step type runs learner-written programs in the built-in mini-Python interpreter (`src/lang/minipy.js`). Its fields, the `py-trace` and `py-run` widgets and the supported language are documented in [CODE-STEPS.md](CODE-STEPS.md).
