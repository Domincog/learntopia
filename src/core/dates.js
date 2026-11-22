/**
 * Date helpers. Days are identified by local-time keys like "2026-11-12".
 *
 * `clock.now()` is the single source of time for the whole app so that tests
 * (and the developer "time travel" tool) can move it.
 */

export const DAY_MS = 86400000;

let offsetMs = 0;
try {
  if (typeof sessionStorage !== 'undefined') {
    offsetMs = Number(sessionStorage.getItem('lemma:timeOffsetMs')) || 0;
  }
} catch { /* storage unavailable */ }

export const clock = {
  now: () => Date.now() + offsetMs,
  /** Shift the app's sense of time (dev tool; persists for the browser tab). */
  travel(days) {
    offsetMs += days * DAY_MS;
    try { sessionStorage.setItem('lemma:timeOffsetMs', String(offsetMs)); } catch { /* ignore */ }
  },
  reset() {
    offsetMs = 0;
    try { sessionStorage.removeItem('lemma:timeOffsetMs'); } catch { /* ignore */ }
  },
  offsetDays: () => offsetMs / DAY_MS,
};

const pad = (n) => (n < 10 ? '0' + n : '' + n);

/** Local-time day key for a timestamp or Date. */
export function dayKey(t = clock.now()) {
  const d = t instanceof Date ? t : new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const today = () => dayKey(clock.now());

/** Parse a day key to a local-noon Date (noon avoids DST edge cases). */
export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(key, n) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Whole days from key a to key b (b - a). */
export function diffDays(a, b) {
  return Math.round((keyToDate(b) - keyToDate(a)) / DAY_MS);
}

export function startOfDay(t = clock.now()) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** The last `n` day keys ending today (oldest first). */
export function lastDays(n, end = today()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const weekdayShort = (key) => WEEKDAYS[keyToDate(key).getDay()];
export const monthShort = (key) => MONTHS[keyToDate(key).getMonth()];

export function formatDay(key) {
  const d = keyToDate(key);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "today", "tomorrow", "in 3 days", "in 2 weeks", "in 3 months" */
export function relativeDays(n) {
  if (n <= 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n < 14) return `in ${n} days`;
  if (n < 60) return `in ${Math.round(n / 7)} weeks`;
  if (n < 365) return `in ${Math.round(n / 30)} months`;
  const years = Math.round((n / 365) * 10) / 10;
  return `in ${years} year${years === 1 ? '' : 's'}`;
}

export function greeting(t = clock.now()) {
  const hr = new Date(t).getHours();
  if (hr < 5) return 'Burning the midnight oil';
  if (hr < 12) return 'Good morning';
  if (hr < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Human duration from minutes: "8 min", "1 h 20 min" */
export function formatMinutes(mins) {
  const m = Math.max(0, Math.round(mins));
  if (m < 60) return `${m} min`;
  const hrs = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${hrs} h ${rest} min` : `${hrs} h`;
}
