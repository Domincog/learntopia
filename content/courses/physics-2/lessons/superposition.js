// Physics II: Orbits & Waves · Lesson 5 · Adding Waves
import { r, num, plural } from '../../../kit.js';

const PULSES = { type: 'wave-adder', mode: 'pulses' };
// A string 1.2 m long on which waves travel at 264 m/s: its fundamental is 264 ÷ 2.4 = 110 Hz.
const STRING = { type: 'standing-wave', length: 1.2, speed: 264 };

export default {
  id: 'superposition',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Head-on',
      text: `
        Two people hold the ends of a long rope. At the same moment, each
        flicks a hump towards the other.

        **What happens when the two humps meet in the middle?**
      `,
      figure: { ...PULSES, static: true, time: 0.7, alt: 'A rope with two humps on it. Hump A is on the left, moving right. Hump B is on the right, moving left.' },
      shuffle: false,
      options: [
        { text: 'They bounce off each other and go back' },
        { text: 'They cancel out, and the rope lies still' },
        { text: 'They pass through each other and carry on unchanged', correct: true },
        { text: 'They join into one big hump' },
      ],
      explain: 'They pass straight through, each one as if the other were not there. But while they overlap, something interesting happens in the middle.',
    },
    {
      id: 'pulses',
      type: 'interact',
      graded: false,
      title: 'Run it, twice',
      text: `
        **Press Play** and watch the rope at the meeting point. The dashed
        outlines show each pulse on its own; the black line is the rope.

        Then turn pulse B into a **trough** and play it again.
      `,
      widget: { ...PULSES, alt: 'A rope with two pulses running towards each other. A time slider and a Play button move them; buttons turn pulse B from a crest into a trough.' },
      check: (s) => {
        if (s.playedUp && s.playedFlipped) return true;
        if (!s.playedUp && !s.playedFlipped) return 'Press **Play** and watch the two pulses meet.';
        return s.playedUp ? 'Now choose **B is a trough** and play it again.' : 'Now choose **B is a crest** and play that as well.';
      },
      solution: { flip: true, playedUp: true, playedFlipped: true },
      explain: `
        **Crest meets crest:** for a moment the rope stands 40 cm high, the
        two 20 cm humps stacked up.

        **Crest meets trough:** for a moment the rope is flat. +20 cm and
        −20 cm add up to nothing.

        Either way, both pulses come out the far side unchanged.
      `,
    },
    {
      id: 'principle',
      type: 'info',
      title: 'Waves add',
      text: r`
        Where two waves overlap, each point of the medium moves by the **sum**
        of what the waves would do to it separately. This is the principle of
        **superposition**. Afterwards each wave carries on as if nothing had
        happened.

        How far a point is from its resting level is its **displacement**:
        positive above, negative below. Add the displacements, signs and all.

        :::example
        At one point, wave A alone would lift the rope 30 mm. Wave B alone
        would push it 50 mm below its resting level.

        $30 + (-50) = -20$ mm: the point is 20 mm **below** its resting
        level.
        :::

        Two balls cannot be in the same place at once. Two waves can.
      `,
      figure: { ...PULSES, static: true, time: 2, alt: 'The rope at the moment the two humps meet in the middle. Dashed outlines show each 20 centimetre hump on its own; the rope itself stands 40 centimetres high there, the two added together.' },
    },
    {
      id: 'add-heights',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 12) * 2;
        const b = rng.intExcept(2, 12, [a / 2]) * 2;
        const down = rng.bool(0.6);
        const medium = rng.pick(['a rope', 'a long spring', 'the surface of a pond', 'a stretched string']);
        const answer = down ? a - b : a + b;
        return {
          text: `
            Two waves cross on ${medium}. At one point, at one instant, wave A
            alone would lift it **${a} mm** above its resting level. Wave B alone
            would ${down ? `push it **${b} mm below**` : `lift it **${b} mm above**`} that level.

            **Where is that point, with both waves there?** (Up counts as positive.)
          `,
          answer,
          unit: 'mm',
          wrong: [
            [down ? a + b : a - b, down ? 'B pushes the other way, so its displacement counts as negative.' : 'Both waves lift this point, so the two displacements have the same sign.'],
            [b - a, 'Check the signs: A lifts the point, and up counts as positive.'],
            [Math.max(a, b), 'The bigger wave does not win. Both act at once, and their displacements add.'],
          ],
          hints: ['Where waves overlap, add their displacements. Mind the signs.'],
          explain: down
            ? r`Displacements add: $${a} + (-${b}) = ${answer}$ mm. ${answer > 0 ? 'The point is above its resting level, but lower than A alone would lift it.' : 'The point ends up below its resting level: B is the bigger of the two.'}`
            : r`Displacements add: $${a} + ${b} = ${answer}$ mm, higher than either wave alone would lift it.`,
        };
      },
    },
    {
      id: 'teach-interference',
      type: 'info',
      title: 'Bigger or smaller',
      text: `
        Two steady waves in the same place add up point by point, all the
        way along.

        - Crests arrive on crests: the sum is bigger. That is
          **constructive interference**. Two equal waves make a wave twice
          as tall.
        - Crests arrive on troughs: the sum is smaller. That is
          **destructive interference**. Two equal waves cancel completely.

        In the picture, [A]{.blue} and [B]{.orange} lie crest on crest, and
        their [sum]{.violet} is twice as tall as either.
      `,
      figure: { type: 'wave-adder', mode: 'waves', shift: 0, static: true, alt: 'Three rows of waves: wave A, wave B and their sum. A and B have the same wavelength and lie crest on crest; the sum is a wave twice as tall.' },
    },
    {
      id: 'shift',
      type: 'interact',
      attempts: 6,
      title: 'Line them up',
      text: `
        Two steady waves, [A]{.blue} and [B]{.orange}, with the same
        wavelength and the same amplitude. The [violet]{.violet} curve is
        their sum: what the medium really does.

        **Slide wave B along until the sum is as small as it can get.**
      `,
      widget: { type: 'wave-adder', mode: 'waves', shift: 0, alt: 'Three rows of waves: wave A, wave B and their sum. A slider slides wave B along. Dashed lines mark the crests of A.' },
      check: (s) => {
        if (s.sumAmp < 0.01) return true;
        if (s.shift === 0 || s.shift === 1) return 'Here crest sits on crest, and the sum is as *big* as it can get: 40 cm. Slide B along.';
        return `The sum still swings ${num(s.sumAmp, 1)} cm each way. The dashed lines mark the crests of A: where should the troughs of B go?`;
      },
      solution: { shift: 0.5 },
      hints: ['The dashed lines mark the crests of A. Put the troughs of B on them.'],
      explain: `
        Slide B along by **half a wavelength**, and each of its troughs sits
        on a crest of A. Everywhere, the two cancel: the sum is flat.

        With no shift, or with a whole wavelength, crest sits on crest and the
        sum is twice as tall. Anything in between gives something in between.
      `,
    },
    {
      id: 'noise',
      type: 'choice',
      text: `
        Noise-cancelling headphones have a tiny microphone that listens to the
        noise around you. A loudspeaker inside then adds a sound of its own.

        **What must the added sound be, to make the noise quieter?**
      `,
      options: [
        { text: 'The noise turned upside down: a trough wherever the noise has a crest', correct: true },
        { text: 'A louder sound that drowns the noise out', why: 'That only adds more sound. The aim is a sum that is *smaller* than the noise alone.' },
        { text: 'An exact copy of the noise, crest on crest', why: 'Crest on crest is constructive interference: the noise would get louder.' },
        { text: 'A steady high-pitched tone', why: 'To cancel, the added wave has to match the noise crest for trough, moment by moment. An unrelated tone just adds to it.' },
      ],
      explain: `
        The added sound is the noise **inverted**, so the two interfere
        destructively at your ear.

        It works best on steady, low-pitched noise such as the drone of an
        engine. Sudden or high-pitched sounds change too quickly to be matched
        well, so some noise always gets through.
      `,
    },
    {
      id: 'fit',
      type: 'interact',
      attempts: 6,
      title: 'A string fixed at both ends',
      text: `
        A guitar string is clamped at both ends, so those two points can never
        move. Which waves can live on it?

        This string is 1.2 m long. **Slide the wavelength and find three
        different wavelengths that fit.**
      `,
      widget: { ...STRING, mode: 'fit', wavelength: 2, alt: 'A string clamped at both ends above a ruler. A slider sets the wavelength of a wave drawn from the left-hand clamp.' },
      check: (s) => {
        if (s.found.length >= 3) return true;
        if (!s.found.length) return 'No fit yet. A wave fits when it gets back to zero exactly at the right-hand clamp. Try 2.4 m.';
        return `${plural(s.found.length, 'fit')} so far (${s.found.map((v) => `${num(v)} m`).join(', ')}). Keep sliding: ${s.found.includes(0.4) ? 'longer' : 'shorter'} wavelengths fit too.`;
      },
      solution: { wavelength: 0.8, found: [2.4, 1.2, 0.8] },
      hints: ['Watch the readout. How many half-wavelengths lie along the string each time a wave fits?'],
      explain: `
        On this string, 2.4 m, 1.2 m, 0.8 m, 0.6 m and 0.4 m all fit. Each
        time, a **whole number of half-wavelengths** lies along the string:
        1, 2, 3, 4 and 6. (Five fit too, at 0.48 m, between the steps of the
        slider.)

        Any other wavelength would need the clamped end to move.
      `,
    },
    {
      id: 'standing',
      type: 'info',
      title: 'Standing waves',
      text: r`
        A wave on the string runs to a clamp, reflects, and meets itself
        coming back. The two add up to a pattern that does not travel: a
        **standing wave**. Its **nodes** never move. Between them the string
        swings in **loops**, each half a wavelength long.

        A node is needed at each end, so a string of length $L$ holds a whole
        number $n$ of loops:

        $$ L = n \times \frac{\lambda}{2} $$

        :::example
        A string 1.5 m long vibrates in 5 loops.

        1. One loop is $1.5 \div 5 = 0.3$ m long.
        2. A loop is half a wavelength, so $\lambda = 2 \times 0.3 = 0.6$ m.
        :::

        Try other numbers of loops on this 1.2 m string.
      `,
      figure: { ...STRING, mode: 'harmonics', n: 1, nRange: [1, 6], readouts: ['wavelength'], alt: 'A string clamped at both ends, vibrating in loops. A slider sets the number of loops; a readout gives the wavelength.' },
    },
    {
      id: 'harmonic-wavelength',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.int(1, 4);
        const half = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6]);
        const L = Math.round(n * half * 100) / 100;
        const lambda = 2 * half;
        const what = rng.pick(['A string', 'A stretched wire', 'A guitar string', 'A rubber cord']);
        const wrong = [[half, 'That is the length of one loop, and a loop is only **half** a wavelength.']];
        if (n > 2) wrong.push([L, 'That would be right for two loops. Count the loops in this pattern: each one is half a wavelength.']);
        return {
          text: `${what} **${num(L)} m** long is fixed at both ends. It vibrates in a standing wave with **${plural(n, 'loop')}**, as shown.\n\n**What is the wavelength?**`,
          figure: { type: 'standing-wave', mode: 'harmonics', static: true, caption: false, length: L, n, alt: `A string fixed at both ends, vibrating in ${plural(n, 'loop')}.` },
          answer: lambda,
          unit: 'm',
          wrong,
          hints: ['Each loop is half a wavelength long.', `${plural(n, 'loop')} along ${num(L)} m: how long is one loop?`],
          explain: n === 1
            ? `The single loop is half a wavelength, and it takes up the whole ${num(L)} m. So the wavelength is 2 × ${num(L)} = ${num(lambda)} m.`
            : `Each loop is half a wavelength. ${n} loops share ${num(L)} m, so one loop is ${num(half)} m, and the wavelength is twice that: ${num(lambda)} m.`,
        };
      },
    },
    {
      id: 'teach-harmonics',
      type: 'info',
      title: 'Harmonics',
      text: r`
        One loop is the string's **fundamental**: its longest wave and its
        lowest note. Two, three, four and more loops are its **harmonics**.

        Waves run along the string at the same speed whatever the pattern.
        Since $v = f\lambda$, when $n$ loops make the wavelength $n$ times
        shorter, the frequency is $n$ times higher.

        :::example
        A string's fundamental is 150 Hz. In 6 loops its wavelength is 6
        times shorter, so its frequency is $6 \times 150 = 900$ Hz.
        :::

        Check the pattern on this string. Its fundamental is 110 Hz.
      `,
      figure: { ...STRING, mode: 'harmonics', n: 1, nRange: [1, 6], alt: 'A string clamped at both ends, vibrating in loops. A slider sets the number of loops; readouts give the wavelength and the frequency.' },
    },
    {
      id: 'harmonic-frequency',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const f1 = rng.pick([55, 110, 196, 220, 440]);
        const n = rng.int(2, 5);
        const what = rng.pick(['A string', 'A stretched wire', 'A piano string']);
        return {
          text: `${what} fixed at both ends vibrates in one loop at **${f1} Hz**: its fundamental. With nothing else changed, it is then made to vibrate in **${n} loops**.\n\n**What is its frequency now?**`,
          answer: n * f1,
          unit: 'Hz',
          wrong: [
            [f1 / n, 'More loops means a shorter wavelength. At the same wave speed, shorter waves have a *higher* frequency.'],
            [f1, 'The wave speed on the string has not changed, but the wavelength has.'],
          ],
          hints: [`With ${n} loops the wavelength is ${n} times shorter than with one.`, r`The waves travel along it at the same speed as before, and $v = f\lambda$.`],
          explain: r`${n} loops fit where one did, so the wavelength is ${n} times shorter. The wave speed along it is unchanged, and $v = f\lambda$, so the frequency is ${n} times higher: $${n} \times ${f1} = ${n * f1}$ Hz.`,
        };
      },
    },
    {
      id: 'fret',
      type: 'interact',
      attempts: 6,
      title: 'Change the note',
      text: `
        This string sounds its fundamental at **110 Hz**. A guitarist cannot
        change strings in the middle of a tune. She presses the string down,
        so that only part of it is free to vibrate.

        **Shorten the string until its fundamental is 220 Hz.**
      `,
      widget: { ...STRING, mode: 'harmonics', n: 1, lengthRange: [0.4, 1.2, 0.2], alt: 'A string vibrating in one loop above a ruler. A slider shortens the string; readouts give the wavelength and the frequency.' },
      check: (s) => {
        if (s.frequency === 220) return true;
        return s.frequency < 220
          ? `At ${num(s.length)} m the string sounds ${num(s.frequency)} Hz. Make it shorter still.`
          : `At ${num(s.length)} m the string sounds ${num(s.frequency)} Hz: too high. Lengthen it a little.`;
      },
      solution: { length: 0.6 },
      hints: ['Watch the wavelength readout as the string gets shorter.'],
      explain: r`
        **Half** the length: 0.6 m. The single loop is now half as long, so the
        wavelength halves, from 2.4 m to 1.2 m.

        The waves run along the string as fast as before, and $v = f\lambda$,
        so half the wavelength means twice the frequency. That is what the
        frets on a guitar are for.
      `,
    },
    {
      id: 'beats',
      type: 'interact',
      attempts: 6,
      title: 'Nearly the same note',
      text: `
        Two notes sound together: [A]{.blue}, at 10 Hz, and [B]{.orange},
        which you control. (Real notes are far higher. Slow ones are easier to
        draw.) The [violet]{.violet} curve is their sum, against time.

        **Set B so that the sum swells and fades exactly twice a second.**
      `,
      widget: { type: 'wave-adder', mode: 'beats', freqA: 10, freqB: 10, freqBRange: [6, 14, 1], readouts: false, alt: 'Three rows drawn against time: note A, note B and their sum. A slider sets the frequency of B.' },
      check: (s) => {
        if (s.beat === 2) return true;
        if (s.beat === 0) return 'With both at 10 Hz the two notes stay in step, and the sum is steady. Make B a little different.';
        return `These notes differ by ${num(s.beat)} Hz, and the sum swells ${plural(s.beat, 'time')} a second. Count the swells between 0 s and 1 s.`;
      },
      solution: { freqB: 12 },
      hints: ['Start with B at 11 Hz and count how many times the sum swells in one second.'],
      explain: `
        8 Hz or 12 Hz: either way the two notes differ by 2 Hz.

        They start in step, crest on crest: loud. Then B drifts out of step
        until crest meets trough: quiet. Half a second after the start they
        are in step again.
      `,
    },
    {
      id: 'teach-beats',
      type: 'info',
      title: 'Beats',
      text: r`
        Two notes of nearly the same frequency drift in and out of step. In
        step, crest on crest, they add: loud. Out of step, crest on trough,
        they cancel: quiet. Each swell is a **beat**.

        :::key
        Beats per second = the **difference** between the two frequencies.
        :::

        :::example
        - Forks of 300 Hz and 307 Hz together: $307 - 300 = 7$ beats each
          second.
        - A string sounded with a 200 Hz fork gives 8 beats each second, and
          is known to be too high. It differs from the fork by 8 Hz, so it
          sounds $200 + 8 = 208$ Hz.
        :::
      `,
      figure: { type: 'wave-adder', mode: 'beats', freqA: 10, freqB: 12, static: true, readouts: false, alt: 'Three rows drawn against time over two seconds: a note of 10 hertz, a note of 12 hertz and their sum. The sum swells and fades four times in the two seconds: twice a second.' },
    },
    {
      id: 'beat-frequency',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const d = rng.int(1, 6);
        if (rng.bool(0.5)) {
          const f1 = rng.pick([256, 330, 440, 512]);
          const f2 = f1 + rng.pick([-1, 1]) * d;
          const [x, y] = rng.shuffle([f1, f2]);
          return {
            text: `Two tuning forks are struck together. One sounds **${x} Hz**, the other **${y} Hz**.\n\n**How many beats do you hear each second?**`,
            answer: d,
            unit: 'beats per second',
            wrong: [
              [(f1 + f2) / 2, 'That is the average, which is roughly the pitch you hear. The swelling and fading comes at the *difference*.'],
              [f1 + f2, 'Beats come at the difference of the two frequencies, not their sum.'],
            ],
            hints: ['Beats per second = the difference between the two frequencies.'],
            explain: r`Beats per second = the difference: $${Math.max(f1, f2)} - ${Math.min(f1, f2)} = ${d}$.`,
          };
        }
        const flat = rng.bool(0.5);
        const who = rng.pick(['A violinist tuning her A string', 'A musician tuning a string that should sound 440 Hz', 'A piano tuner checking the string for the A above middle C']);
        const answer = flat ? 440 - d : 440 + d;
        return {
          text: `${who} sounds it together with a 440 Hz tuning fork and hears **${plural(d, 'beat')} each second**. The string is known to be a little too **${flat ? 'low' : 'high'}**.\n\n**What is the frequency of the string?**`,
          answer,
          unit: 'Hz',
          wrong: [
            [flat ? 440 + d : 440 - d, `That is ${d} Hz on the wrong side of the fork. The string is too ${flat ? 'low' : 'high'}.`],
            [d, 'That is the difference between the two frequencies. The string itself is close to 440 Hz.'],
          ],
          hints: [`${plural(d, 'beat')} a second means the two frequencies differ by ${d} Hz.`],
          explain: `${plural(d, 'beat')} a second means the string and the fork differ by ${d} Hz. The string is too ${flat ? 'low' : 'high'}, so it sounds 440 ${flat ? '−' : '+'} ${d} = ${answer} Hz. Tightening or slackening it until the beats slow down and stop brings it into tune.`,
        };
      },
    },
    {
      id: 'match',
      type: 'match',
      text: 'Match each effect to what causes it.',
      pairs: [
        ['Constructive interference', 'Crests arrive on crests'],
        ['Destructive interference', 'Crests arrive on troughs'],
        ['A standing wave', 'A wave meets its own reflection'],
        ['Beats', 'Two slightly different frequencies'],
      ],
      explain: 'All four are superposition at work: wherever waves overlap, their displacements simply add.',
    },
  ],
  recap: [
    'Where waves overlap, their displacements add. Afterwards each wave carries on unchanged.',
    'Crest on crest makes a bigger wave (constructive interference). Crest on trough cancels (destructive).',
    r`A string fixed at both ends holds a whole number of half-wavelengths: $L = n \times \frac{\lambda}{2}$. Hence the fundamental and its harmonics, and a shorter string plays a higher note.`,
    'Two nearby frequencies together make beats. Beats per second = the difference of the frequencies.',
  ],
  next: 'Next: the wave you use most and never see waving. Light.',
};
