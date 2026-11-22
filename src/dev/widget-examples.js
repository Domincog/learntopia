/**
 * Example specs for the widget gallery (#/dev/widgets). When you add a
 * widget, add an example here: it documents the spec and gives the
 * automated smoke test something to mount.
 */
export const widgetExamples = [
  {
    id: 'plot-line', title: 'plot — line with sliders',
    note: 'Sliders change parameters; the dashed line is a fixed target.',
    spec: {
      type: 'plot', x: [-6, 6], y: [-6, 6],
      params: {
        m: { min: -3, max: 3, step: 0.5, value: 1, label: 'slope $m$', color: 'blue' },
        b: { min: -5, max: 5, step: 1, value: 0, label: 'intercept $b$', color: 'orange' },
      },
      fns: [{ expr: '2x - 3', color: 'gray', dashed: true }, { expr: 'm*x + b', color: 'blue' }],
      readouts: [{ label: 'y at x = 1', expr: 'm + b' }],
    },
  },
  {
    id: 'plot-tangent', title: 'plot — draggable point with tangent',
    spec: {
      type: 'plot', x: [-3, 3], y: [-2, 8],
      fns: [{ expr: 'x^2', color: 'blue' }],
      points: [{ id: 'P', x: 1, on: 0, drag: 'x', color: 'orange', coords: true }],
      tangents: [{ fn: 0, at: 'Px', color: 'orange' }],
      readouts: [{ label: 'slope of tangent', expr: 'd0(Px)' }],
    },
  },
  {
    id: 'plot-riemann', title: 'plot — Riemann sum and area',
    spec: {
      type: 'plot', x: [-0.5, 4.5], y: [-1, 9],
      params: { n: { min: 1, max: 40, step: 1, value: 4, label: 'rectangles $n$', color: 'orange' } },
      fns: [{ expr: '0.5x^2', color: 'blue' }],
      riemann: [{ fn: 0, from: 0, to: 4, n: 'n', mode: 'left', color: 'orange' }],
      readouts: [{ label: 'sum of rectangles', expr: 'R0()' }, { label: 'true area', expr: 'I0(0, 4)' }],
    },
  },
  {
    id: 'plot-points', title: 'plot — free points, segment and labels',
    spec: {
      type: 'plot', x: [-1, 9], y: [-1, 7],
      points: [
        { id: 'A', x: 1, y: 1, drag: 'xy', snap: 1, color: 'orange', label: 'A', coords: true },
        { id: 'B', x: 6, y: 4, drag: 'xy', snap: 1, color: 'violet', label: 'B', coords: true },
      ],
      segments: [{ from: 'A', to: 'B', color: 'ink' }, { from: 'A', to: ['Bx', 'Ay'], color: 'green', dashed: true }, { from: ['Bx', 'Ay'], to: 'B', color: 'red', dashed: true }],
      readouts: [{ label: 'run', expr: 'Bx - Ax', color: 'green' }, { label: 'rise', expr: 'By - Ay', color: 'red' }, { label: 'slope', expr: '(By - Ay)/(Bx - Ax)' }],
    },
  },
  {
    id: 'number-line', title: 'number-line — draggable point, range and hop',
    spec: {
      type: 'number-line', min: -10, max: 10, step: 1,
      points: [{ id: 'a', value: -3, color: 'orange', label: 'a' }],
      ranges: [{ from: 'a', to: null, color: 'blue' }],
      hops: [{ from: 2, to: 7, label: '+5', color: 'green' }],
      marks: [{ value: 2, color: 'green' }],
    },
  },
  {
    id: 'grid', title: 'grid — tap or drag to paint cells',
    spec: { type: 'grid', rows: 5, cols: 10, labels: 'index1', on: [1, 2, 4, 6], colors: ['blue', 'orange'], counter: 'Selected' },
  },
  {
    id: 'geo-triangle', title: 'geo — triangle with live angles',
    spec: {
      type: 'geo', x: [0, 10], y: [0, 7],
      points: { A: { x: 1.5, y: 1, drag: true }, B: { x: 8.5, y: 1.5, drag: true }, C: { x: 4, y: 6, drag: true } },
      shapes: [
        { kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' },
        { kind: 'angle', pts: ['B', 'A', 'C'], label: 'deg', color: 'orange' },
        { kind: 'angle', pts: ['A', 'B', 'C'], label: 'deg', color: 'green' },
        { kind: 'angle', pts: ['A', 'C', 'B'], label: 'deg', color: 'violet' },
      ],
      readouts: [{ label: 'Angle sum', value: (g) => g.angle('B', 'A', 'C') + g.angle('A', 'B', 'C') + g.angle('A', 'C', 'B'), digits: 0, unit: '°' }, { label: 'Area', value: (g) => g.area('A', 'B', 'C') }],
    },
  },
  {
    id: 'geo-pythagoras', title: 'geo — squares on a right triangle',
    spec: {
      type: 'geo', x: [-5, 11], y: [-5, 9], grid: true,
      points: {
        C: { x: 0, y: 0, label: false },
        A: { x: 4, y: 0, drag: true, snap: 1, lockY: true, color: 'orange', constrain: (p) => ({ x: Math.max(1, Math.min(6, p.x)), y: 0 }) },
        B: { x: 0, y: 3, drag: true, snap: 1, lockX: true, color: 'violet', constrain: (p) => ({ x: 0, y: Math.max(1, Math.min(5, p.y)) }) },
      },
      shapes: [
        { kind: 'square', pts: ['C', 'A'], color: 'orange', label: 'area' },
        { kind: 'square', pts: ['B', 'C'], color: 'violet', label: 'area' },
        { kind: 'square', pts: ['A', 'B'], color: 'green', label: 'area' },
        { kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' },
        { kind: 'right', pts: ['A', 'C', 'B'] },
      ],
    },
  },
  {
    id: 'balance', title: 'balance — solve by doing the same to both sides',
    spec: { type: 'balance', left: { x: 2, ones: 3 }, right: { x: 0, ones: 11 }, xValue: 4 },
  },
  {
    id: 'balance-free', title: 'balance — free mode (it can tip)',
    spec: { type: 'balance', mode: 'free', left: { x: 1, ones: 0 }, right: { x: 0, ones: 2 }, xValue: 5, edit: { right: ['ones'] } },
  },
  {
    id: 'svg', title: 'svg — static diagram with theme classes',
    spec: { type: 'svg', viewBox: '0 0 320 120', maxWidth: 360, alt: 'Two labelled boxes joined by an arrow',
      content: '<rect class="fill-blue-soft stroke-ink" stroke-width="2.5" x="20" y="30" width="100" height="60" rx="10"/><rect class="fill-orange-soft stroke-ink" stroke-width="2.5" x="200" y="30" width="100" height="60" rx="10"/><path class="stroke-ink fill-none" stroke-width="2.5" stroke-linecap="round" d="M128 60 H190 M180 52 L190 60 L180 68"/><text class="fig-label" x="70" y="65" text-anchor="middle">input</text><text class="fig-label" x="250" y="65" text-anchor="middle">output</text>' },
  },
  {
    id: 'code', title: 'code — listing with line numbers and a marked line',
    spec: { type: 'code', lang: 'python', numbers: true, mark: [3], code: 'def area(w, h):\n    # multiply the sides\n    return w * h\n\nprint(area(3, 4))' },
  },
];
