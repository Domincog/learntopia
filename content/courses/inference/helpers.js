/**
 * Helpers shared by the Statistical Inference lessons: small formatting tools
 * and the fixed data sets behind the figures whose numbers the text quotes.
 *
 * Every data set here is invented. Each was produced once by a seeded
 * simulation and is stored as plain numbers, so that what the lessons say
 * about it ("94 of the 100 intervals", "5,679 of the 184,756 deals") stays
 * true whatever happens to the random-number generator. The course test
 * re-derives every quoted figure from these numbers.
 */

/** 20000 -> "20,000" */
export const thousands = (v) => Number(v).toLocaleString('en-US');

const SINGULAR = { minutes: 'minute', hours: 'hour', marks: 'mark', points: 'point' };
/** The unit in the right number: unitFor(1, 'minutes') -> "minute", unitFor(2.5, 'minutes') -> "minutes". */
export const unitFor = (value, unit) => (Number(value) === 1 && SINGULAR[unit] ? SINGULAR[unit] : unit);

/** A number for running text, with a real minus sign: -1.6 -> "−1.6". */
export const signedText = (v) => String(v).replace('-', '−');

/** 0.0577 -> "5.8" (a share as a percentage, without the sign) */
export const pct = (v, digits = 1) => String(Math.round(v * 100 * 10 ** digits) / 10 ** digits);

/** The chance of k or more successes in n tries with chance p each (a plain binomial sum). */
export function binomTail(n, p, k) {
  let total = 0;
  let choose = 1;
  for (let i = 0; i <= n; i++) {
    if (i > 0) choose = (choose * (n - i + 1)) / i;
    if (i >= k) total += choose * p ** i * (1 - p) ** (n - i);
  }
  return total;
}

/* ------------------------------------------------------------ lesson 2: intervals */

/**
 * 100 samples of 64 commuters from a city whose true mean is 40 minutes (SD 12):
 * [sample average, standard error] of each. With "average ± 2 standard errors",
 * 94 of the 100 intervals contain 40; numbers 14, 22, 44, 56, 58 and 67 miss.
 * The first interval (39.13 to 45.53) contains 40 but sits high: only 73 of the
 * other 99 sample averages lie inside it.
 */
export const RAIN = [
  [42.33, 1.6], [40.29, 1.61], [39.91, 1.59], [40.78, 1.38], [39.06, 1.22], [40.22, 1.55], [40.76, 1.51], [40.01, 1.58], [41.46, 1.48], [39.57, 1.73],
  [39.44, 1.49], [41.45, 1.55], [38.56, 1.74], [34.68, 1.42], [40.58, 1.4], [37.9, 1.49], [40.52, 1.5], [41.88, 1.64], [39.2, 1.76], [41.53, 1.54],
  [41.44, 1.63], [42.64, 1.23], [39.88, 1.3], [41.88, 1.48], [40.11, 1.37], [40.01, 1.39], [41.65, 1.31], [42.29, 1.34], [38.58, 1.65], [40.93, 1.18],
  [40.22, 1.54], [37.86, 1.6], [40.18, 1.68], [40.15, 1.49], [37.73, 1.56], [40.15, 1.38], [39.02, 1.38], [42.43, 1.74], [40.05, 1.37], [39.48, 1.42],
  [40.37, 1.48], [39.01, 1.6], [37.93, 1.37], [43.06, 1.45], [37.39, 1.38], [41.27, 1.48], [41.31, 1.32], [39.33, 1.67], [42.54, 1.56], [39.88, 1.45],
  [39.33, 1.65], [40.23, 1.44], [40.38, 1.65], [41.54, 1.55], [41.31, 1.37], [44.55, 1.58], [40.14, 1.4], [36.02, 1.41], [40.73, 1.5], [40.29, 1.68],
  [40.7, 1.54], [42, 1.55], [41.57, 1.56], [38.19, 1.64], [39.96, 1.37], [38.42, 1.5], [36.28, 1.36], [41.37, 1.54], [37.89, 1.44], [37.61, 1.53],
  [38.39, 1.45], [39.16, 1.49], [40.22, 1.22], [37.32, 1.39], [40.84, 1.29], [40.4, 1.4], [41.66, 1.39], [38.67, 1.45], [39.36, 1.7], [40.7, 1.47],
  [41.63, 1.37], [40.93, 1.69], [42.19, 1.45], [41.76, 1.42], [41.73, 1.44], [42.46, 1.29], [39.44, 1.63], [38.82, 1.35], [37.63, 1.53], [38.23, 1.34],
  [40.67, 1.63], [38.94, 1.54], [40.69, 1.65], [38.91, 1.42], [41.55, 1.37], [39.62, 1.42], [38.9, 1.48], [39.79, 1.66], [40.89, 1.56], [39.53, 1.2],
];

/* ---------------------------------------------------------- lesson 3: a shuffle test */

/**
 * Heights (cm) of 20 tomato plants, 10 with fertiliser and 10 without. The
 * averages are 67.9 and 61.9: a gap of 6 cm. Of the 184,756 ways of dealing
 * the 20 heights into two groups of 10, exactly 5,679 give a gap of 6 cm or
 * more in favour of the "fertiliser" group: a p-value of 0.0307.
 */
export const PLANTS = {
  fert: [55, 65, 69, 67, 71, 77, 63, 66, 69, 77],
  plain: [55, 63, 62, 73, 55, 64, 66, 70, 57, 54],
  deals: 184756,
  extreme: 5679,
};

/* -------------------------------------------------- lesson 5: who chooses the treatment */

const KEEN = [76, 70, 70, 67, 65, 70, 70, 70, 70, 80, 65, 77, 80, 77, 68, 82, 73, 67, 74, 69];
const OTHERS = [53, 60, 48, 61, 53, 71, 59, 53, 53, 55, 57, 60, 49, 61, 68, 49, 59, 65, 56, 50];
/**
 * 40 students and the exam score each would get without any app: 20 keen
 * ones (average exactly 72) and 20 others (average exactly 57).
 */
export const STUDENTS = [...KEEN.map((score) => ({ trait: true, score })), ...OTHERS.map((score) => ({ trait: false, score }))];

/* ------------------------------------------------------- lesson 6: forking paths */

/**
 * A trial of a supplement that does nothing: 240 volunteers, half on the
 * supplement, five outcomes that are pure noise. The p-value of every
 * analysis (rows: who is analysed; columns: which outcome), each from an
 * honest two-group comparison of the same data set. The planned analysis is
 * the top-left one. Exactly two of the twenty are below 0.05.
 */
export const HACK = {
  rows: ['Everyone', 'Women', 'Men', 'Over 50'],
  cols: ['Weight', 'Sleep', 'Mood', 'Energy', 'Memory'],
  p: [
    [0.391, 0.188, 0.132, 0.451, 0.319],
    [0.411, 0.166, 0.026, 0.802, 0.274],
    [0.797, 0.624, 0.974, 0.366, 0.85],
    [0.338, 0.367, 0.586, 0.039, 0.106],
  ],
};

/** 100 labs test an idea that is false. Their p-values: six of them are below 0.05. */
export const DRAWER = [
  0.836, 0.16, 0.084, 0.8, 0.636, 0.496, 0.526, 0.375, 0.605, 0.758, 0.277, 0.013, 0.973, 0.836, 0.832, 0.01, 0.416, 0.622, 0.516, 0.515,
  0.498, 0.326, 0.936, 0.085, 0.35, 0.998, 0.413, 0.991, 0.436, 0.6, 0.269, 0.192, 0.439, 0.328, 0.358, 0.009, 0.827, 0.386, 0.57, 0.378,
  0.041, 0.621, 0.291, 0.704, 0.879, 0.938, 0.494, 0.474, 0.751, 0.46, 0.738, 0.256, 0.654, 0.786, 0.342, 0.057, 0.849, 0.217, 0.207, 0.189,
  0.853, 0.326, 0.032, 0.239, 0.965, 0.981, 0.201, 0.83, 0.623, 0.245, 0.636, 0.734, 0.876, 0.138, 0.876, 0.615, 0.51, 0.15, 0.152, 0.698,
  0.56, 0.077, 0.191, 0.882, 0.194, 0.286, 0.658, 0.859, 0.783, 0.203, 0.781, 0.31, 0.098, 0.646, 0.941, 0.03, 0.652, 0.81, 0.526, 0.072,
];

/** Twenty flavours of chewing gum, for the wall of studies. */
export const FLAVOURS = ['mint', 'cherry', 'lemon', 'grape', 'apple', 'melon', 'peach', 'mango', 'lime', 'cola', 'berry', 'banana', 'orange', 'coconut', 'ginger', 'vanilla', 'honey', 'pear', 'plum', 'toffee'];
