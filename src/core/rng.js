/**
 * Seeded pseudo-random numbers (mulberry32). Lessons use this so a generated
 * problem can be re-created from its seed, and so the daily puzzle is the
 * same for everyone on a given date.
 */

export function hashString(str) {
  // FNV-1a 32-bit
  let hsh = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hsh ^= str.charCodeAt(i);
    hsh = Math.imul(hsh, 0x01000193);
  }
  return hsh >>> 0;
}

export function randomSeed() {
  return (Math.random() * 0x100000000) >>> 0;
}

export function makeRng(seed = randomSeed()) {
  let a = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng = {
    seed,
    /** Float in [0, 1). */
    next,
    /** Float in [lo, hi). */
    float: (lo = 0, hi = 1) => lo + next() * (hi - lo),
    /** Integer in [lo, hi] inclusive. */
    int: (lo, hi) => Math.floor(lo + next() * (hi - lo + 1)),
    /** Integer in [lo, hi] that is never zero. */
    nonzero: (lo, hi) => {
      let v = 0;
      let guard = 0;
      while (v === 0 && guard++ < 100) v = rng.int(lo, hi);
      return v || 1;
    },
    /** Integer in [lo, hi] excluding the listed values. */
    intExcept: (lo, hi, except = []) => {
      const set = new Set(except);
      let v = rng.int(lo, hi);
      let guard = 0;
      while (set.has(v) && guard++ < 200) v = rng.int(lo, hi);
      return v;
    },
    bool: (p = 0.5) => next() < p,
    sign: () => (next() < 0.5 ? -1 : 1),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    /** Returns a new shuffled copy (Fisher–Yates). */
    shuffle: (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
      }
      return out;
    },
    /** n distinct elements. */
    sample: (arr, n) => rng.shuffle(arr).slice(0, n),
    /** Multiple of `step` in [lo, hi]. */
    step: (lo, hi, step = 1) => {
      const k = Math.floor((hi - lo) / step + 1e-9);
      return Math.round((lo + rng.int(0, k) * step) * 1e9) / 1e9;
    },
    /** A child generator with an independent stream. */
    fork: (label = '') => makeRng(hashString(String(a) + ':' + label)),
  };
  return rng;
}
