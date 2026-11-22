/**
 * Learner data store.
 *
 * Everything a learner does lives in ONE JSON document in localStorage, on
 * their own device. There is no server, no account and no analytics. The
 * document can be exported/imported from Settings.
 *
 *   store.init();
 *   store.state.xp
 *   store.update((s) => { s.settings.sound = false; });
 *   const off = store.subscribe((state) => rerender());
 */
import { config } from '../config.js';
import { clock } from './dates.js';

export const SCHEMA_VERSION = 1;

export function defaultState(now = clock.now()) {
  return {
    v: SCHEMA_VERSION,
    createdAt: now,
    profile: {
      name: '',
      avatar: 'orange',
      goal: 40,          // daily XP goal
      interests: [],     // category ids chosen during onboarding
      onboarded: false,
    },
    settings: {
      theme: 'auto',     // 'auto' | 'light' | 'dark'
      sound: true,
      haptics: true,
      motion: 'auto',    // 'auto' | 'reduce' | 'full'
      fontScale: 1,      // 0.9 | 1 | 1.15 | 1.3
      reviewSize: 10,    // max items per review session
      retention: 0.9,    // target recall probability for the scheduler
      confidence: true,  // ask "how sure are you?" during reviews
      warmup: true,      // start lessons with a couple of due review questions from the same course
      supportNote: true, // show a short note about supporting the project when a course is finished
    },
    xp: 0,
    /** dayKey -> { xp, lessons, reviews, answered, correct, ms, puzzles } */
    days: {},
    streak: { current: 0, best: 0, last: null, rest: 1, rested: [] },
    /** "course/lesson" -> { done, first, last, best, resume? } */
    lessons: {},
    /** "course/lesson/step" -> scheduler card */
    cards: {},
    /** confidence calibration: level -> [answered, correct] */
    calib: { guess: [0, 0], think: [0, 0], sure: [0, 0] },
    /** achievement id -> timestamp earned */
    ach: {},
    /** puzzle type -> stats; plus daily: { dayKey: {...} } */
    puzzles: { daily: {} },
    /** one-off UI flags (tips seen, etc.) */
    flags: {},
    recent: { course: null },
  };
}

/** Bring any older / partial document up to the current shape. */
export function migrate(raw, now = clock.now()) {
  const base = defaultState(now);
  if (!raw || typeof raw !== 'object') return base;
  const out = { ...base, ...raw };
  out.v = SCHEMA_VERSION;
  out.profile = { ...base.profile, ...(raw.profile || {}) };
  out.settings = { ...base.settings, ...(raw.settings || {}) };
  out.streak = { ...base.streak, ...(raw.streak || {}) };
  out.calib = { ...base.calib, ...(raw.calib || {}) };
  out.puzzles = { ...base.puzzles, ...(raw.puzzles || {}) };
  if (!out.puzzles.daily) out.puzzles.daily = {};
  out.recent = { ...base.recent, ...(raw.recent || {}) };
  for (const key of ['days', 'lessons', 'cards', 'ach', 'flags']) {
    if (!out[key] || typeof out[key] !== 'object') out[key] = {};
  }
  if (!Array.isArray(out.streak.rested)) out.streak.rested = [];
  if (!Array.isArray(out.profile.interests)) out.profile.interests = [];
  out.xp = Number(out.xp) || 0;
  return out;
}

function storageAvailable() {
  try {
    const k = '__lemma_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function createStore() {
  let state = defaultState();
  let persistent = false;
  let saveTimer = null;
  let notifyQueued = false;
  const subs = new Set();
  const key = config.storageKey;

  function saveNow() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!persistent) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.warn('[store] could not save progress', err);
    }
  }

  function queueSave() {
    if (saveTimer) return;
    saveTimer = setTimeout(saveNow, 250);
  }

  function notify() {
    if (notifyQueued) return;
    notifyQueued = true;
    Promise.resolve().then(() => {
      notifyQueued = false;
      for (const fn of Array.from(subs)) {
        try { fn(state); } catch (err) { console.error(err); }
      }
    });
  }

  return {
    get state() { return state; },
    get persistent() { return persistent; },

    init() {
      persistent = storageAvailable();
      if (persistent) {
        try {
          const raw = localStorage.getItem(key);
          state = migrate(raw ? JSON.parse(raw) : null);
        } catch (err) {
          console.warn('[store] corrupt save data, starting fresh', err);
          state = defaultState();
        }
        // keep several open tabs in sync (last writer wins)
        window.addEventListener('storage', (ev) => {
          if (ev.key !== key || !ev.newValue) return;
          try { state = migrate(JSON.parse(ev.newValue)); notify(); } catch { /* ignore */ }
        });
        window.addEventListener('pagehide', saveNow);
        document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
      }
      return state;
    },

    /** Mutate state in place inside `fn`; saving and re-rendering are automatic. */
    update(fn, { silent = false } = {}) {
      const result = fn(state);
      queueSave();
      if (!silent) notify();
      return result;
    },

    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },

    flush: saveNow,

    /** A JSON-serialisable snapshot for backups. */
    exportData() {
      return {
        app: config.name,
        exportedAt: new Date(clock.now()).toISOString(),
        data: JSON.parse(JSON.stringify(state)),
      };
    },

    /** Replace all data with a previously exported snapshot. Throws on bad input. */
    importData(snapshot) {
      const data = snapshot && snapshot.data ? snapshot.data : snapshot;
      if (!data || typeof data !== 'object' || !('xp' in data) || !('lessons' in data)) {
        throw new Error('That file does not look like a progress backup.');
      }
      state = migrate(data);
      saveNow();
      notify();
    },

    reset() {
      state = defaultState();
      saveNow();
      notify();
    },

    /** Test hook: replace state without touching storage. */
    _set(next) { state = next; },
  };
}

export const store = createStore();
