// How AI Learns · shared data sets and figure builders.
//
// Every data set here is fixed (no randomness), so that what a lesson says
// about it ("one line can sort at most 12 of the 16 plants") is always true.
// The claims were checked by brute force over every setting the sliders allow.

/* ------------------------------------------------------------ lesson 1 + 3 */

/** Eight past deliveries: [distance in km, minutes taken]. Best line: about 3 min per km + 5. */
export const DELIVERIES = [[1, 9], [2, 10], [3, 15], [4, 17], [5, 19], [7, 27], [8, 28], [9, 32]];

/** Phone battery: [hours of use, charge left in %]. Best line: about −12 per hour + 99. */
export const BATTERY = [[0.5, 94], [1, 85], [2, 76], [3, 61], [4, 52], [5, 37], [6, 28], [7, 13]];

/** The delivery-time model as a fit-line figure. */
export const deliveryLab = (extra = {}) => ({
  type: 'fit-line',
  points: DELIVERIES,
  x: [0, 10], y: [0, 40], yStep: 10,
  xLabel: 'distance (km)', yLabel: 'minutes',
  names: { input: 'km', output: 'minutes' },
  unit: 'min',
  ...extra,
});

/* ---------------------------------------------------------------- lesson 2 */
// Each fruit: [first measurement, second measurement, 1 = ripe / 0 = unripe]

/** Mangoes: ripe when sweetness + softness is high (both inputs count). */
export const MANGOES = [
  [8.5, 4, 1], [7, 6.5, 1], [5.5, 8, 1], [9, 7, 1], [6.5, 9.2, 1], [4, 8.5, 1], [8, 8.5, 1], [9.3, 3, 1],
  [1.5, 2, 0], [3, 1.5, 0], [2, 4.5, 0], [4, 3, 0], [1, 6.5, 0], [5.5, 2, 0], [6.8, 1, 0], [3, 5, 0],
];

/** Plums: only sweetness separates them; softness says nothing. */
export const PLUMS = [
  [6.1, 1.2, 1], [7, 8.4, 1], [8.2, 5, 1], [9, 2.5, 1], [6.4, 6, 1], [7.8, 3.5, 1], [9.2, 7.4, 1], [6, 9.2, 1],
  [1, 3, 0], [2, 8.2, 0], [3.4, 5.5, 0], [1.5, 6.4, 0], [3, 1.6, 0], [4, 9.3, 0], [2.4, 4, 0], [3.9, 0.9, 0],
];

/** Mangoes again, measured by sweetness and sourness: sourness counts against ripeness. */
export const SOUR_MANGOES = [
  [4, 1, 1], [6, 2.5, 1], [8, 4, 1], [9, 6.5, 1], [7, 4.4, 1], [5, 2.6, 1], [3, 0.8, 1], [9.2, 2, 1],
  [1, 3, 0], [2, 5, 0], [4, 6.5, 0], [5.5, 8.5, 0], [7, 9.2, 0], [3, 7.5, 0], [1, 8, 0], [2.5, 4.6, 0],
];

/** The first batch with one odd mango: ripe, but sitting deep among the unripe ones. No line gets all 16. */
export const MESSY_MANGOES = MANGOES.map((p) => (p[0] === 3 && p[1] === 5 ? [3, 4, 1] : p));

/** A neuron-lab figure for fruit. */
export const fruitLab = (points, extra = {}) => ({
  type: 'neuron-lab',
  points,
  xLabel: 'sweetness', yLabel: 'softness',
  classes: ['unripe', 'ripe'],
  ...extra,
});

/* ---------------------------------------------------------------- lesson 4 */

/**
 * Plants: [sunlight, water, 1 = thrives / 0 = struggles]. A plant thrives when
 * its water matches its sunlight, so the thriving ones lie in a diagonal band
 * with struggling plants on both sides. One line sorts at most 12 of the 16.
 */
export const PLANTS = [
  [1.5, 2.2, 1], [2.8, 2, 1], [3.6, 4.4, 1], [4.8, 4.2, 1], [5.6, 6.6, 1], [6.8, 6.2, 1], [7.6, 8.4, 1], [8.6, 7.8, 1],
  [1, 5.5, 0], [2, 8, 0], [3.5, 7.5, 0], [4.6, 9.2, 0],
  [5.5, 1.5, 0], [7, 3, 0], [8.5, 1.2, 0], [9, 4.6, 0],
];

const PLANT_NAMES = { xLabel: 'sunlight', yLabel: 'water', classes: ['struggles', 'thrives'] };

/** One neuron facing the plants. */
export const plantNeuron = (extra = {}) => ({ type: 'neuron-lab', points: PLANTS, ...PLANT_NAMES, ...extra });

/** The two-layer network facing the plants. */
export const plantNet = (extra = {}) => ({ type: 'tiny-net', points: PLANTS, ...PLANT_NAMES, ...extra });

/** How many plants a sharp (0/1) tiny network sorts correctly. A, B: { w1, w2, b }; out: { a, b, c }. */
export function netCorrect(A, B, out, points = PLANTS) {
  const fires = (n, x, y) => (n.w1 * x + n.w2 * y + n.b > 1e-9 ? 1 : 0);
  let correct = 0;
  for (const [x, y, c] of points) {
    const yes = out.a * fires(A, x, y) + out.b * fires(B, x, y) + out.c > 1e-9;
    if (yes === (c === 1)) correct += 1;
  }
  return correct;
}

/* ------------------------------------------------------------ lesson 5 + 6 */

/** The whole "training text" of the toy language model. "the" occurs 10 times: cat 4, dog 3, mat 2, rug 1. */
export const CAT_SENTENCES = [
  'the cat sat on the mat',
  'the dog sat on the mat',
  'the cat saw the dog',
  'the dog saw the cat',
  'the cat sat on the rug',
];

/** A lopsided training text: after "doctor said" comes "he" 3 times and "she" once. */
export const DOCTOR_SENTENCES = [
  'the doctor said he was late',
  'the doctor said he was busy',
  'the doctor said he would call',
  'the doctor said she was busy',
  'the nurse said she was late',
  'the nurse said she would call',
];

/** The toy language model as a next-word figure. */
export const catModel = (extra = {}) => ({ type: 'next-word', corpus: CAT_SENTENCES, start: 'the', maxWords: 12, ...extra });

/* ---------------------------------------------------------------- lesson 6 */

/** The tomato experiment (data built into the overfit-lab widget). */
export const tomatoLab = (extra = {}) => ({
  type: 'overfit-lab',
  xLabel: 'water (litres a week)', yLabel: 'tomatoes (kg)',
  ...extra,
});
