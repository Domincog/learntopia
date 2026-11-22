/**
 * Sound effects, synthesised on the fly with the Web Audio API — there are
 * no audio files to download. Everything is short, soft and optional.
 */

let ctx = null;
let enabled = true;
let hapticsOn = true;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * Play one enveloped oscillator note.
 * @param {{f:number, to?:number, at?:number, dur?:number, vol?:number, type?:OscillatorType}} n
 */
function note(ac, { f, to, at = 0, dur = 0.14, vol = 0.12, type = 'sine' }) {
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

const SOUNDS = {
  tap: (ac) => note(ac, { f: 520, dur: 0.05, vol: 0.05, type: 'triangle' }),
  select: (ac) => note(ac, { f: 640, dur: 0.06, vol: 0.05, type: 'triangle' }),
  drop: (ac) => note(ac, { f: 300, to: 220, dur: 0.08, vol: 0.07, type: 'sine' }),
  correct: (ac) => {
    note(ac, { f: 659.25, dur: 0.12, vol: 0.11, type: 'triangle' });
    note(ac, { f: 987.77, at: 0.09, dur: 0.22, vol: 0.11, type: 'triangle' });
    note(ac, { f: 1975.5, at: 0.09, dur: 0.18, vol: 0.03 });
  },
  wrong: (ac) => {
    note(ac, { f: 233, to: 185, dur: 0.16, vol: 0.1 });
    note(ac, { f: 174, to: 155, at: 0.11, dur: 0.2, vol: 0.09 });
  },
  hint: (ac) => {
    note(ac, { f: 880, dur: 0.09, vol: 0.06 });
    note(ac, { f: 1174.66, at: 0.07, dur: 0.14, vol: 0.06 });
  },
  reveal: (ac) => note(ac, { f: 392, to: 523.25, dur: 0.22, vol: 0.07, type: 'triangle' }),
  step: (ac) => note(ac, { f: 440, to: 660, dur: 0.09, vol: 0.05, type: 'triangle' }),
  complete: (ac) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(ac, { f, at: i * 0.1, dur: 0.24, vol: 0.11, type: 'triangle' }));
    note(ac, { f: 1318.5, at: 0.42, dur: 0.5, vol: 0.08 });
    note(ac, { f: 1568, at: 0.42, dur: 0.5, vol: 0.05 });
  },
  levelup: (ac) => {
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => note(ac, { f, at: i * 0.075, dur: 0.2, vol: 0.1, type: 'triangle' }));
    note(ac, { f: 1568, at: 0.5, dur: 0.6, vol: 0.09 });
  },
  streak: (ac) => {
    note(ac, { f: 587.33, dur: 0.1, vol: 0.09, type: 'triangle' });
    note(ac, { f: 880, at: 0.08, dur: 0.1, vol: 0.09, type: 'triangle' });
    note(ac, { f: 1174.66, at: 0.16, dur: 0.3, vol: 0.09, type: 'triangle' });
  },
  pop: (ac) => note(ac, { f: 900, to: 300, dur: 0.07, vol: 0.07 }),
  tick: (ac) => note(ac, { f: 1200, dur: 0.02, vol: 0.03, type: 'square' }),
};

const HAPTICS = { correct: 12, wrong: [18, 40, 18], complete: [12, 50, 12, 50, 24], tap: 4, drop: 6, select: 4 };

/** Play a named sound (and a matching vibration on phones). Never throws. */
export function play(name) {
  if (hapticsOn && HAPTICS[name] && typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(HAPTICS[name]); } catch { /* ignore */ }
  }
  if (!enabled || !SOUNDS[name]) return;
  try {
    const ac = audio();
    if (ac) SOUNDS[name](ac);
  } catch { /* audio is a nicety; never break the app over it */ }
}

export function configureAudio({ sound, haptics }) {
  if (typeof sound === 'boolean') enabled = sound;
  if (typeof haptics === 'boolean') hapticsOn = haptics;
}
