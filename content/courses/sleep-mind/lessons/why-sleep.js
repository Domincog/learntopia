// Sleep, Stress and Mental Health · Lesson 1 · A Third of Your Life
// Driving question: what is a sleeping brain doing all night, and what goes wrong without it?
import { NIGHT, NIGHT_START, STAGES, SLEEP_NEED, SLEEPERS, CYCLE_MINUTES, clock, hoursText, stageAt, pic } from '../helpers.js';

const NIGHT_ALT = 'A chart of one night from 23:00 to 07:00. A stepped line moves between five levels: awake, REM, N1, N2 and N3. Long stretches of N3 come before 03:00; REM stretches get longer towards morning.';
const HYP = { type: 'hypnogram', night: NIGHT, bedtime: NIGHT_START };

const ROW_NAMES = { W: 'Awake', REM: 'REM sleep', N1: 'N1: dozing off', N2: 'N2: light sleep', N3: 'N3: deep sleep' };
const ORDER = { D: 0, M: 1, R: 2 };
// The teaching table of the four stages, in the order a sleeper meets them, in the colours of the chart.
const STAGE_ROWS = ['N1', 'N2', 'N3', 'REM'].map((st) => `| [**${STAGES[st].short}**]{.${STAGES[st].color}} | ${STAGES[st].gist} |`).join('\n        ');
const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);
// Recommended sleep by age, from the same table as the generated question.
const NEED_ROWS = ['child', 'teen', 'adult'].map((key) => `| ${cap(SLEEP_NEED[key].label)} | ${SLEEP_NEED[key].max ? `${SLEEP_NEED[key].min} to ${SLEEP_NEED[key].max} hours` : `${SLEEP_NEED[key].min} hours or more`} |`).join('\n        ');

export default {
  id: 'why-sleep',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Switched off?',
      text: `
        You will spend about a third of your life asleep.
        **What do you think your brain is doing all that time?**

        > **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.
      `,
      columns: 1,
      options: [
        { text: 'Almost nothing: it is switched off until morning' },
        { text: 'Ticking over at one low, steady level all night' },
        { text: 'Moving through several different states, again and again', correct: true },
      ],
      explain: 'Sleep is not an off switch. All night the brain moves through a repeating series of states, and in one of them it is nearly as busy as when you are awake. The next screen shows a night as a sleep laboratory records it.',
    },
    {
      id: 'read-night',
      type: 'interact',
      graded: false,
      title: 'One night, drawn',
      text: `
        This chart is a **hypnogram**: one night of a healthy young adult,
        worked out from recordings of brain waves. Time runs from left to
        right. The higher the line, the closer the sleeper is to waking.

        **Drag the orange marker through the night** until it has been on
        all five levels.
      `,
      widget: { ...HYP, mode: 'read', at: 150, alt: NIGHT_ALT },
      check: (s) => {
        if (s.seenCount >= 5) return true;
        const missing = ['W', 'REM', 'N1', 'N2', 'N3'].filter((st) => !s.seen.includes(st));
        const tip = missing.includes('N1') ? ' N1 is brief: look just after 23:10.' : missing.includes('W') ? ' The sleeper is awake at the very start and the very end.' : '';
        return `Still to visit: ${missing.map((st) => ROW_NAMES[st]).join(', ')}.${tip}`;
      },
      solution: { seen: ['W', 'REM', 'N1', 'N2', 'N3'], t: 235 },
      explain: `
        The sleeper sinks from dozing through light sleep into deep sleep,
        climbs back up, and has a spell of REM sleep. Then the trip starts
        again: five times in this night.
      `,
    },
    {
      id: 'teach-stages',
      type: 'info',
      title: 'Four stages, again and again',
      text: `
        Sleep laboratories sort sleep into four stages. **N** stands for
        non-REM and the number for depth. **REM** means *rapid eye
        movement*.

        | Stage | What it is like |
        |---|---|
        ${STAGE_ROWS}

        One trip down and back up to REM is a **sleep cycle**: this night
        has five in its eight hours. Dreams can come in any stage.
        ${STAGES.W.gist}.
      `,
      figure: { ...HYP, mode: 'static', alt: NIGHT_ALT },
    },
    {
      id: 'name-stages',
      type: 'match',
      review: true,
      text: 'Match each **stage of sleep** with its description.',
      pairs: [
        ['N1', 'Dozing off: a few minutes at the doorway of sleep'],
        ['N2', 'Light sleep: about half of the whole night'],
        ['N3', 'Deep sleep: big slow brain waves, hardest to wake from'],
        ['REM', 'Darting eyes, vivid dreams, large muscles switched off'],
      ],
      explain: `
        **N** stands for non-REM, and the number for depth. **REM** means
        *rapid eye movement*: under closed lids the eyes flick about, while
        the big muscles of the body are switched off, which stops a sleeper
        from acting out a dream.
      `,
    },
    {
      id: 'halves',
      type: 'fill',
      title: 'Early and late',
      text: `
        The night is not the same all the way through. **Drag the marker**
        and compare the two halves in the small table.
      `,
      figure: { ...HYP, mode: 'read', at: 60, halves: true, alt: NIGHT_ALT },
      template: 'Most **deep sleep** comes in the [[second|*first]] half of the night, and most **REM sleep** in the [[*second|first]] half. One sleep cycle lasts very roughly [[20|240|*90]] minutes.',
      explain: `
        In this night all 98 minutes of deep sleep fall before 03:00, while
        88 of the 114 minutes of REM sleep come after it. A cycle takes about
        **90 minutes** (anything from 70 to 120 is ordinary), so a full night
        holds four to six of them.
      `,
    },
    {
      id: 'build-night',
      type: 'interact',
      title: 'Build a night',
      text: `
        Here are five sleep cycles, all the same. Each can be rich in
        **deep** sleep, **mixed**, or rich in **REM** sleep.

        **Tap the cycles** to turn them into a typical night for a healthy
        adult.
      `,
      widget: { type: 'hypnogram', mode: 'build', bedtime: NIGHT_START, halves: true, patterns: ['M', 'M', 'M', 'M', 'M'], alt: 'A night made of five sleep cycles that can each be switched between deep-rich, mixed and REM-rich.' },
      check: (s) => {
        const p = s.patterns;
        for (let i = 1; i < p.length; i++) {
          if (ORDER[p[i]] < ORDER[p[i - 1]]) return `Cycle ${i + 1} has more deep sleep than cycle ${i}. In a typical night deep sleep fades as the hours go by.`;
        }
        if (p[0] !== 'D') return 'The first cycle of the night is the one richest in deep sleep.';
        if (p[4] !== 'R') return 'By the last cycle before waking, deep sleep has gone and the REM period is at its longest.';
        return true;
      },
      solution: { patterns: ['D', 'D', 'M', 'R', 'R'] },
      hints: ['Think of the table you just read: deep sleep early, REM late.', 'Start with a cycle rich in deep sleep and end with one rich in REM sleep. Nothing in between should go back towards deep sleep.'],
      explain: `
        Deep sleep is paid in first, as if it were the most urgent. REM sleep
        takes over towards morning. Real nights are less tidy than this
        model, and they change with age: young children get far more deep
        sleep than adults, and older adults less.
      `,
    },
    {
      id: 'cut-night',
      type: 'choice',
      title: 'An early alarm',
      text: `
        Aroha usually sleeps from 23:00 to 07:00. This month she starts work
        early and gets up at **05:00**, without going to bed any sooner.

        **Drag the alarm to 05:00.** What does she lose?
      `,
      figure: { ...HYP, mode: 'cut', alarm: 480, alt: `${NIGHT_ALT} An alarm marker can be dragged earlier; bars show how much deep sleep, REM sleep and total sleep are left.` },
      columns: 1,
      options: [
        { text: 'Nearly half of her REM sleep, and none of her deep sleep', correct: true },
        { text: 'A quarter of every stage alike', why: 'A quarter of the *time* goes. But the stages are not spread evenly through the night, so they are not lost evenly.' },
        { text: 'Mostly deep sleep', why: 'Her deep sleep was all finished before 03:00. Look at the top bar: it does not shrink.' },
      ],
      explain: `
        Two hours is a quarter of the night, but those two hours hold 52 of
        her 114 minutes of REM sleep: **46%**. A night cut short at the end is
        not a smaller copy of a whole night. It is a night with the last
        part missing.
      `,
    },
    {
      id: 'teach-what-for',
      type: 'info',
      title: 'What is sleep for?',
      text: `
        Researchers are much surer of some answers than of others.

        **Well supported.** While you sleep, the day's learning is replayed
        and filed, so it lasts. Most growth hormone is released in deep
        sleep. And in studies pooled in 2023, people who slept less than
        about six hours around a vaccination made fewer antibodies.

        **Still being worked out.** Does sleep wash waste out of the brain?
        A 2013 study in mice suggested so. A 2024 study found the
        opposite. And nobody has yet shown what dreams are for.

        **A myth.** That practice lets people get by on very little sleep.
        They get used to feeling tired, but their test results keep
        getting worse.
      `,
    },
    {
      id: 'what-for',
      type: 'bucket',
      title: 'What is it for?',
      text: 'Researchers are much surer of some answers than of others. **Sort these claims about sleep.**',
      buckets: ['Well supported', 'Still being worked out', 'Myth'],
      items: [
        { text: 'Sleep after learning helps the memory last', bucket: 0 },
        { text: 'Most growth hormone is released in deep sleep', bucket: 0 },
        { text: 'People short of sleep make fewer antibodies after a vaccine', bucket: 0, why: 'Several studies, pooled in 2023, found a weaker response in people who slept less than about six hours around a vaccination.' },
        { text: 'Sleep washes waste out of the brain faster than waking does', bucket: 1, why: 'A famous 2013 study in mice suggested this. A 2024 study found the opposite, and the two teams disagree. It is an open question.' },
        { text: 'The purpose of dreams is to work through emotions', bucket: 1, why: 'One of several ideas. Nobody has yet shown what dreams are for, or whether they have a purpose at all.' },
        { text: 'In sleep the brain shuts down', bucket: 2, why: 'In REM sleep it is nearly as active as when awake.' },
        { text: 'With practice, anyone can get by on four hours', bucket: 2, why: 'People get used to feeling tired, but their test results keep getting worse.' },
      ],
      explain: `
        The best-established job is **memory** (see *How to Learn
        Anything*). Sleep also sets hormones, supports the immune system
        and steadies mood. Other ideas, such as brain cleaning, are active
        research, and honest scientists say so.
      `,
    },
    {
      id: 'teach-sleep-need',
      type: 'info',
      title: 'How much is enough?',
      text: `
        Sleep experts recommend an amount for each age:

        | Age | Sleep in 24 hours |
        |---|---|
        ${NEED_ROWS}

        The need changes little across adult life: the advice is the same
        at 30 and at 70. What changes is how easy sleep is to get. Older
        adults have less deep sleep and wake more often.

        :::example Short by how much?
        Lena, who is 16, is asleep from 00:30 to 07:00. That is 6½ hours.
        The least recommended for a teenager is 8 hours, so her night is
        8 − 6½ = **1½ hours** short.
        :::
      `,
    },
    {
      id: 'sleep-need',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(SLEEPERS);
        const need = SLEEP_NEED[who.group];
        const short = rng.pick([0.5, 1, 1.5, 2]);
        const wake = rng.pick([5.5, 6, 6.5]);
        const slept = need.min - short;
        const bed = wake - slept + 24;
        const advice = who.group === 'teen'
          ? `Sleep experts recommend **${need.min} to ${need.max} hours** a night for ${need.label}.`
          : `Sleep experts recommend **${need.min} hours or more** a night for adults.`;
        return {
          text: `
            **${who.name}, who is ${who.age},** is asleep from
            **${clock(bed)}** to **${clock(wake)}** ${who.scene}.

            ${advice} **By how many hours does one such night fall short of
            the least recommended?**
          `,
          answer: short,
          unit: 'hours',
          wrong: [
            [slept, `That is how long ${who.name} sleeps. The question asks how far that is below ${need.min} hours.`],
            ...(need.max ? [[need.max - slept, `That is the gap to the top of the range. Compare with the least recommended: ${need.min} hours.`]] : []),
          ],
          hints: [
            bed >= 24 ? `First find the time asleep. Both times are after midnight: count from ${clock(bed)} to ${clock(wake)}.` : `First find the time asleep: from ${clock(bed)} to midnight, then from midnight to ${clock(wake)}.`,
            `${who.name} sleeps ${hoursText(slept)}. Compare that with ${need.min} hours.`,
          ],
          explain: `From ${clock(bed)} to ${clock(wake)} is ${hoursText(slept)}. The least recommended is ${need.min} hours, so each night is ${need.min} − ${slept} = **${short}** ${short === 1 ? 'hour' : 'hours'} short. Over five such nights that adds up to ${hoursText(short * 5)}.`,
        };
      },
    },
    {
      id: 'awake-drunk',
      type: 'choice',
      mode: 'predict',
      title: 'Seventeen hours awake',
      text: `
        In a well-known experiment, volunteers got up in the morning and
        stayed awake. After **17 to 19 hours** (around midnight) they took
        tests of reaction speed and attention.

        Their results were as poor as with a blood alcohol level of about…
      `,
      shuffle: false,
      options: [
        { text: '0.01%: barely measurable' },
        { text: '0.05%: at or over the legal limit for driving in many countries', correct: true },
        { text: '0.3%: close to passing out' },
      ],
      explain: `
        About **0.05%** (Williamson and Feyer, 2000). After a full 24 hours
        awake, another study put it near 0.10%. Short sleep night after
        night adds up in a similar way: attention slips, mood sours,
        appetite rises and accidents become more likely.

        A tired driver cannot fix this with fresh air or loud music. Only
        sleep works.
      `,
    },
    {
      id: 'teach-sleep-signs',
      type: 'info',
      title: 'How to tell that an animal sleeps',
      text: `
        An animal cannot tell anyone that it slept, and brain waves can
        only be recorded from a brain. So biologists look for **three
        signs** in what an animal does:

        - at a regular time of day it goes **quiet**;
        - while quiet, it **reacts more slowly** to a disturbance;
        - kept from resting, it **catches up** afterwards.

        By that test, every animal looked at closely so far sleeps or does
        something very like it: worms, flies, fish, birds. Dolphins sleep
        with one half of the brain at a time and keep swimming.
      `,
    },
    {
      id: 'jellyfish',
      type: 'choice',
      title: 'Who else sleeps?',
      text: `
        The animal in the picture is *Cassiopea*, the upside-down jellyfish.
        It lies on the sea floor and pulses its bell. It has nerve cells,
        but **no brain at all**.

        Does it sleep?
      `,
      figure: pic('cassiopea', {
        alt: 'A pale orange jellyfish lying upside down on the bottom of a tank: its round bell rests on the ground and its frilly arms point upwards.',
        caption: '*Cassiopea*, the upside-down jellyfish',
      }),
      columns: 1,
      options: [
        { text: 'Yes: at night it pulses more slowly, reacts more slowly, and catches up after a disturbed night', correct: true },
        { text: 'No: sleep is something only a brain can do', why: 'That was the guess for a long time. But this animal shows every sign that biologists use to recognise sleep.' },
        { text: 'It cannot be tested in an animal so simple', why: 'It can. Researchers counted its pulses, timed its reactions, and kept it from resting to see what happened next.' },
      ],
      explain: `
        In 2017 researchers showed that it does: all three signs, in an
        animal with no brain at all.

        A habit that leaves an animal defenceless for hours, and that
        evolution has still never dropped, must be doing something vital.
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements about sleep are **true**?',
      options: [
        { text: 'An adult of 70 needs about as much sleep as an adult of 30', correct: true },
        { text: 'In later life sleep tends to become lighter and more broken', correct: true },
        { text: 'Most people can train themselves to do well on five hours', why: 'People get used to feeling tired, but tests show their attention keeps getting worse. Only a rare few carry gene variants that let them thrive on about six hours.' },
        { text: 'Dreams happen only in REM sleep', why: 'The most vivid, story-like dreams come from REM sleep, but people woken from other stages report dreams too.' },
      ],
      explain: 'The need for sleep changes little across adult life: seven hours or more is advised at every adult age. What changes is how easy it is to get. Older adults have less deep sleep and wake more often, which is a reason to protect sleep, not a sign that less is needed.',
    },
    {
      id: 'hypno-read',
      type: 'choice',
      review: true,
      gen: (rng) => {
        // moments well inside a stretch of one stage, so that the picture is unambiguous
        const spots = [];
        let t = 0;
        for (const [stage, len] of NIGHT) {
          if (stage !== 'N1' && len >= 15) {
            for (let m = Math.ceil((t + 5) / 5) * 5; m <= t + len - 5; m += 5) spots.push({ stage, m });
          }
          t += len;
        }
        const stage = rng.pick(['REM', 'N2', 'N3']);
        const spot = rng.pick(spots.filter((sp) => sp.stage === stage));
        const at = clock(NIGHT_START + spot.m / 60);
        return {
          text: `This chart shows one night of sleep. A dashed line marks **${at}**.\n\n**Which stage is the sleeper in at that moment?**`,
          figure: { ...HYP, mode: 'static', mark: spot.m, alt: `A chart of one night's sleep from 23:00 to 07:00 with rows for awake, REM, N1, N2 and N3. A dashed line marks ${at}, where the line is on the ${STAGES[stageAt(spot.m)].short} row.` },
          shuffle: false,
          options: ['W', 'REM', 'N1', 'N2', 'N3'].map((st) => ({
            text: ROW_NAMES[st],
            correct: st === spot.stage,
            why: st === spot.stage ? undefined : 'Find where the dashed line crosses the coloured blocks, then read across to the name at the left.',
          })),
          explain: `At ${at} the dashed line crosses a block on the **${STAGES[spot.stage].short}** row: ${STAGES[spot.stage].name}. ${spot.stage === 'N3' ? 'Deep sleep like this is found in the first half of the night.' : spot.stage === 'REM' ? 'REM periods grow longer towards morning.' : 'About half of the night is spent in this stage.'}`,
        };
      },
    },
    {
      id: 'cycles',
      type: 'numeric',
      gen: (rng) => {
        const who = rng.pick(['Ingrid', 'Darius', 'Nia', 'Kofi', 'Mei']);
        const n = rng.int(3, 6);
        const start = rng.pick([22, 22.5, 23, 23.5, 24]);
        const hours = (n * CYCLE_MINUTES) / 60;
        return {
          text: `${who} falls asleep at **${clock(start)}** and wakes at **${clock(start + hours)}**. One sleep cycle takes about ${CYCLE_MINUTES} minutes, so 3 hours of sleep (180 minutes) would hold 2 cycles.\n\n**About how many full cycles fit into that night?**`,
          answer: n,
          unit: 'cycles',
          wrong: [[hours, `That is the number of hours asleep. Each cycle takes about ${CYCLE_MINUTES} minutes, which is 1½ hours.`]],
          hints: [`From ${clock(start)} to ${clock(start + hours)} is ${hoursText(hours)}.`, `${hoursText(hours)} is ${hours * 60} minutes. How many times does ${CYCLE_MINUTES} go into that?`],
          explain: `The night lasts ${hoursText(hours)}, which is ${hours * 60} minutes, and ${hours * 60} ÷ ${CYCLE_MINUTES} = **${n}** cycles. ${n <= 4 ? 'The cycles that are missing from a short night like this are the late ones, rich in REM sleep.' : 'The later cycles are the ones richest in REM sleep.'}`,
        };
      },
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to notice',
      text: `
        If you like, try this on a day with no alarm and nothing to get up
        for: **notice when you wake by yourself**, and roughly how long you
        slept.

        One morning proves little. But if you sleep much longer whenever
        you are free to, that is your body paying back sleep it was owed.

        :::note
        Sleep needs differ from person to person. Babies, children and
        teenagers need more than the adult figures here, and needs can
        change in pregnancy and illness. Trouble sleeping that goes on for weeks is worth raising with a
        doctor. Lesson 3 comes back to this.
        :::
      `,
    },
  ],
  recap: [
    'Sleep is an **active** state. The brain cycles through light sleep (N1, N2), deep sleep (N3) and REM sleep about every 90 minutes.',
    'Deep sleep comes mostly **early** in the night and REM sleep mostly **late**, so a night cut short loses REM above all.',
    'Sleep files memories, sets hormones and supports immunity and mood. Adults need **7 hours or more** at every adult age, teenagers 8 to 10.',
    'After 17 to 19 hours awake, attention is as poor as at a blood alcohol level of 0.05%. You cannot train the need away.',
  ],
  next: 'Next: how does your body know what time it is? A clock in your brain, set by light.',
};
