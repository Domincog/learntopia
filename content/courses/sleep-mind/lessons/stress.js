// Sleep, Stress and Mental Health · Lesson 4 · Fight, Flight and the Long Haul
// Driving question: why does an alarm system that can save your life wear you down when it never switches off?
import { STRESS, STRESS_CURVES, ALARM_NOTES, STRESSORS, BREATH_PATTERNS, WHITEHALL } from '../helpers.js';

const HORMONES = {
  type: 'decay-curve', clock: false, xUnit: 'min', yTick: 50, yLabel: 'above resting level',
  curves: STRESS_CURVES, eventName: 'alarm', amount: 100, watch: 1,
};
const PEAK_LIMIT = 125;

export default {
  id: 'stress',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Two alarms',
      text: `
        On Monday a car pulls out in front of Amara's bike, and she brakes
        just in time. On Tuesday an email arrives: her manager wants to see
        her "about her future here".

        **How different is what happens inside her body?**
      `,
      columns: 1,
      options: [
        { text: 'Very different: one is a physical danger, the other is only a thought' },
        { text: 'Much the same: the same hormones, the same pounding heart', correct: true },
        { text: 'Only the near miss causes any bodily reaction' },
      ],
      explain: 'Much the same. The body has one alarm system, and it answers a worrying thought with the reaction it would use for a charging animal. This lesson follows that reaction through the body, and asks what happens when it never switches off.',
    },
    {
      id: 'alarm-body',
      type: 'interact',
      graded: false,
      title: 'The alarm reaction',
      text: `
        Within a second or two of the near miss, Amara's whole body has
        changed gear. (The figure faces you.)

        **Tap at least five parts of the body** to see what the alarm does
        there.
      `,
      widget: {
        type: 'body-map', view: 'body', bounds: [95, 24, 305, 470], mode: 'explore',
        show: ['brain', 'eye', 'heart', 'lungs', 'liver', 'stomach', 'small-intestine'],
        notes: ALARM_NOTES, zoom: false,
        alt: 'The head and trunk of a body with the brain, eyes, heart, lungs, liver, stomach and gut shown. Each can be tapped to read what the alarm reaction does there.',
      },
      check: (s) => s.seenCount >= 5 || `That is ${s.seenCount}. Tap ${5 - s.seenCount} more.`,
      solution: { seen: ['brain', 'eye', 'heart', 'left-lung', 'liver', 'stomach'] },
      explain: `
        Everything points one way: **fuel and oxygen to the muscles, now**.
        Heart and breathing speed up, sugar pours into the blood, and
        anything that can wait, such as digestion, is paused.

        This is the **fight-or-flight** response. For escaping a real
        danger in the next few minutes it is superb.
      `,
    },
    {
      id: 'teach-adrenals',
      type: 'info',
      title: 'Two hormones, two small glands',
      text: `
        What you just read all over the body is the work of two stress
        hormones, **adrenaline** and **cortisol**.

        Both come from the **adrenal glands**: a pair of small glands that
        sit like caps on top of the kidneys. (The name means "beside the
        kidney".)

        - Their core releases **adrenaline** when nerves from the brain
          tell it to.
        - Their outer layer makes **cortisol** when a hormone messenger
          arrives in the blood.
      `,
      figure: {
        type: 'body-map', view: 'torso', show: ['urinary', 'adrenals', 'spine', 'ribs'], ghost: ['ribs', 'spine'], zoom: false,
        groups: [{ ids: ['adrenals'], color: 'orange' }], dim: false, legend: false,
        labels: ['adrenals', { id: 'left-kidney', text: 'Kidney' }],
        alt: 'The trunk of a body facing the viewer, with the two kidneys at the back of the abdomen and the bladder below. On top of each kidney sits a small cap, highlighted and named: the adrenal glands.',
      },
    },
    {
      id: 'adrenal-pick',
      type: 'interact',
      review: true,
      text: `
        The two main stress hormones, **adrenaline** and **cortisol**, come
        from a pair of small glands whose name means "beside the kidney".

        **Tap them.** (The figure faces you.)
      `,
      widget: {
        type: 'body-map', view: 'torso', mode: 'pick', answer: 'adrenals',
        show: ['urinary', 'adrenals', 'spleen', 'pancreas', 'spine', 'ribs'], ghost: ['ribs', 'spine'],
        pickable: ['adrenals', 'kidneys', 'spleen', 'pancreas', 'bladder', 'ureters'], zoom: false,
        alt: 'The trunk of a body with the kidneys, the bladder and a few other organs and glands of the abdomen, without names.',
      },
      check: (s) => {
        if (s.picked === 'adrenals') return true;
        if (s.picked === 'right-kidney' || s.picked === 'left-kidney') return 'That is a kidney. The glands sit just on top of the kidneys.';
        if (s.picked === 'pancreas') return 'That is the pancreas, which makes insulin. Look higher: on top of the kidneys.';
        return s.picked ? `That is ${s.nameThe}. Look for two small caps on top of the kidneys.` : false;
      },
      solution: { picked: 'adrenals' },
      hints: ['Find the two kidneys first, at the back of the abdomen.'],
      explain: 'The **adrenal glands** sit like small caps on the kidneys. Their core releases adrenaline when nerves from the brain tell it to. Their outer layer makes cortisol when a hormone messenger arrives in the blood.',
    },
    {
      id: 'timeline',
      type: 'fill',
      title: 'Fast and slow',
      text: `
        The graph follows the two hormones after one alarm, at minute 20.
        **Drag the alarm** if you like, and read the curves.
      `,
      figure: { ...HORMONES, from: 0, to: 180, xTick: 20, yMax: 125, events: [{ t: 20, amount: 100 }], edit: 'move', snap: 5, minT: 0, maxT: 60, alt: 'Two curves after an alarm at minute 20. Adrenaline shoots up at once and is gone within about 20 minutes. Cortisol rises slowly, peaks about 20 minutes after the alarm and takes about two hours to fade.' },
      template: 'Adrenaline shoots up within [[an hour|*seconds|20 minutes]] and fades within minutes. Cortisol peaks about [[2|*20|90]] minutes after the alarm, and is back near its resting level after [[*an hour or two|ten minutes|a day]].',
      explain: `
        **Adrenaline** is the sprinter: nerves trigger it within seconds,
        and it is cleared within minutes. **Cortisol** is slower. It keeps
        fuel flowing for longer, and takes an hour or two to settle.

        So after a single fright the system switches itself off. That is
        how it is meant to work.
      `,
    },
    {
      id: 'teach-two-routes',
      type: 'info',
      title: 'A fast route and a slow one',
      text: `
        The two curves differ because the alarm reaches the adrenal glands
        by two routes. Both start in the brain: the **amygdala**, deep
        inside it, flags a threat, and the **hypothalamus** switches on
        the alarm.

        - **The fast route is a nerve route.** Within seconds, nerves make
          the adrenal glands release adrenaline.
        - **The slow route is a hormone route.** Over minutes, a hormone
          messenger travels in the blood from the **pituitary gland**,
          just under the brain, to the adrenal glands, and they make
          cortisol.
      `,
      figure: {
        type: 'body-map', view: 'head', show: ['brain', 'cerebrum', 'cerebellum', 'brainstem', 'hypothalamus', 'pituitary', 'skull'], static: true, zoom: false,
        labels: [{ id: 'hypothalamus', text: 'Hypothalamus' }, { id: 'pituitary', text: 'Pituitary gland' }], labelStyle: 'side',
        alt: 'A head seen from the side, cut open. Two small structures deep in the middle of the head are named: the hypothalamus, at the base of the brain, and the pituitary gland, hanging just beneath it.',
      },
    },
    {
      id: 'chain',
      type: 'order',
      text: 'Put the chain of events after a fright **in order**.',
      items: [
        'The amygdala, deep in the brain, flags a threat',
        'The hypothalamus switches on the alarm',
        'Within seconds: nerves make the adrenal glands release adrenaline',
        'Over minutes: a hormone messenger travels in the blood from the pituitary gland',
        'After about 20 minutes: cortisol reaches its peak',
      ],
      labels: ['First', 'Last'],
      explain: 'The alarm starts in the brain and reaches the adrenal glands twice: first by nerve, which gives adrenaline, then by a hormone through the pituitary gland and the blood, which gives cortisol.',
    },
    {
      id: 'useful',
      type: 'interact',
      title: 'Is the alarm ever useful?',
      text: `
        Noor is about to take her driving test. The curve shows a rule of
        thumb for how well people perform at different levels of
        alertness, from half asleep to panic.

        **Set the slider to the level at which she drives best.**
      `,
      widget: {
        type: 'plot', height: 300, x: [0, 10], y: [0, 110], xStep: 1, yStep: 20, tickLabels: false,
        labels: [{ x: 0.25, y: 102, text: 'performance' }, { x: 0.25, y: 16, text: 'half asleep' }, { x: 9.75, y: 16, text: 'panic', anchor: 'end' }],
        params: { a: { min: 0, max: 10, step: 0.5, value: 1, label: 'level of alertness', color: 'orange' } },
        fns: [{ expr: '100*exp(-((x-5)/2.4)^2)', color: 'blue' }],
        points: [{ id: 'P', x: 'a', on: 0, color: 'orange' }],
        vlines: [{ x: 'a', color: 'orange', dashed: true }],
        readouts: [{ label: 'performance', expr: 'f0(a)', digits: 0 }],
        alt: 'A hill-shaped curve of performance against level of alertness: low when half asleep, highest in the middle, low again in panic. A slider moves a point along it.',
      },
      check: (s) => (s.a >= 4.5 && s.a <= 5.5) || (s.a < 4.5 ? 'She would do better a little more keyed up than that.' : 'Past the top of the hill: now the alarm is getting in her way.'),
      solution: { a: 5 },
      explain: `
        In the middle. A moderate dose of the stress response sharpens
        attention and memory, which is why a little nervousness before a
        test helps. Too much, and thinking narrows and hands shake.

        This "inverted U" goes back to experiments in 1908. Treat it as a
        rule of thumb: the best level differs with the task and the person.
      `,
    },
    {
      id: 'pile-up',
      type: 'interact',
      attempts: 6,
      title: 'When alarms pile up',
      text: `
        Here is Sam's morning: three alarms within half an hour (a missed
        bus, an angry customer, a row). Each new alarm lands before the
        last has worn off, and his cortisol climbs to more than twice the
        peak of a single alarm.

        **Drag the alarms apart** until his cortisol never rises above the
        dashed line.
      `,
      widget: { ...HORMONES, from: 0, to: 360, xTick: 60, yMax: 280, events: [{ t: 20, amount: 100 }, { t: 35, amount: 100 }, { t: 50, amount: 100 }], edit: 'move', snap: 10, minT: 0, maxT: 330, line: { y: PEAK_LIMIT, label: 'a little above one alarm' }, alt: 'Adrenaline and cortisol over six hours with three alarms. Close together, the cortisol curves stack up to a high peak. The alarms can be dragged apart along the time axis.' },
      check: (s) => s.peak <= PEAK_LIMIT || `His cortisol still climbs to ${Math.round(s.peak)}, where a single alarm reaches 100: an alarm is arriving before the last one has worn off. Give them more room.`,
      solution: { events: [{ t: 20, amount: 100 }, { t: 150, amount: 100 }, { t: 280, amount: 100 }] },
      hints: ['After one alarm, cortisol needs about an hour and a half to come most of the way down.'],
      explain: `
        Spaced out, each alarm is over before the next begins. Packed
        together, they add up, and the system never gets back to rest.
      `,
    },
    {
      id: 'teach-long-haul',
      type: 'info',
      title: 'When it never switches off',
      text: `
        That is the difference between **short-term (acute) stress**, a
        sprint with a finish line, and **long-term (chronic) stress**, a
        marathon without one. The same hormones are at work. What changes
        is the recovery: in the graph, a simple model, an alarm comes
        every 40 minutes, and [cortisol]{.blue} never gets back to rest.

        Held on for months, the alarm:

        - disturbs sleep;
        - keeps blood pressure up;
        - weakens some immune defences: in experiments, volunteers under
          long-lasting stress were more likely to develop a cold after
          being given the same dose of virus;
        - wears on mood.

        These are raised risks, not certainties, and they ease when the
        load does.
      `,
      figure: {
        ...HORMONES, static: true, from: 0, to: 360, xTick: 60, yMax: 280,
        events: [20, 60, 100, 140, 180, 220, 260, 300].map((t) => ({ t, amount: 100 })),
        alt: 'Adrenaline and cortisol over six hours with an alarm every forty minutes. Adrenaline spikes and vanishes each time. Cortisol climbs after the first alarms and then stays high, well above the peak of a single alarm, without ever returning to rest.',
      },
    },
    {
      id: 'sprint-or-marathon',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const wantChronic = rng.bool();
        const right = rng.pick(STRESSORS.filter((x) => (x.kind === 'chronic') === wantChronic));
        const others = rng.sample(STRESSORS.filter((x) => (x.kind === 'chronic') !== wantChronic), 3);
        return {
          text: wantChronic
            ? 'Short-term stress is over in minutes or hours. Long-term stress goes on for weeks, months or years.\n\n**Which of these is long-term (chronic) stress?**'
            : 'Short-term stress is over in minutes or hours. Long-term stress goes on for weeks, months or years.\n\n**Which of these is short-term (acute) stress?**',
          columns: 1,
          options: [right, ...others].map((x) => ({
            text: x.text,
            correct: x === right,
            why: x === right ? undefined : (x.kind === 'acute' ? 'This is over within minutes or hours, and the body can then recover: short-term stress.' : 'This goes on for months or years, with no clear end and little chance to recover: long-term stress.'),
          })),
          explain: wantChronic
            ? `"${right.text}" has no finish line: the alarm keeps being set off before the body has recovered. Notice that causes like this are mostly not of a person's own making.`
            : `"${right.text}" is over quickly, and then the body can settle. A reaction like that is uncomfortable but harmless, and often useful.`,
        };
      },
    },
    {
      id: 'chronic',
      type: 'bucket',
      review: true,
      title: 'Sprint and marathon',
      text: 'The same alarm reaction helps in a sprint and costs in a marathon. **Sort these effects.**',
      buckets: ['Helps for a few minutes', 'A cost of months of stress'],
      items: [
        { text: 'Sugar released into the blood for quick energy', bucket: 0 },
        { text: 'A faster, stronger heartbeat', bucket: 0 },
        { text: 'Sharper attention', bucket: 0 },
        { text: 'Digestion paused', bucket: 0, why: 'For a few minutes that frees blood for the muscles. It is one of the alarm\'s quick changes.' },
        { text: 'Blood pressure that stays raised', bucket: 1 },
        { text: 'Trouble falling and staying asleep', bucket: 1 },
        { text: 'Catching more colds', bucket: 1, why: 'In experiments, volunteers under long-lasting stress were more likely to develop a cold after being given the same dose of virus.' },
        { text: 'Low mood and a short temper', bucket: 1 },
      ],
      explain: `
        Held on for months, the alarm disturbs sleep, keeps blood pressure
        up, weakens some immune defences and wears on mood. These are
        raised risks, not certainties, and they ease when the load does.
      `,
    },
    {
      id: 'control',
      type: 'choice',
      mode: 'predict',
      tone: 'sober',
      title: 'Who is under most strain?',
      text: `
        From ${WHITEHALL.started}, researchers followed about 17,500 men working
        for the British civil service, from messengers to the heads of
        departments. All had secure office jobs.

        **Which group do you think had the highest death rate over the
        next ten years?**
      `,
      columns: 1,
      shuffle: false,
      options: [
        { text: 'The top administrators, who carried the most responsibility' },
        { text: 'The middle grades' },
        { text: 'The lowest grades, with the least say over their work', correct: true },
      ],
      explain: `
        The lowest grades: about **three times** the death rate of the top
        grade, with a step at every level in between. A later study tied
        much of the gap in heart disease to **low control** over one's
        work.

        Stress is heaviest where demands are high and control and support
        are low. Poverty, discrimination and overwork are real causes of
        it. It is not a weakness of character.
      `,
    },
    {
      id: 'breathing',
      type: 'interact',
      title: 'A brake you can reach',
      text: `
        Most of the alarm system is out of conscious reach. Breathing is
        the exception: slow breaths with **long out-breaths** slow the
        heart through the body's "rest" nerves.

        **Set a pace of 6 breaths a minute, with the out-breath longer
        than the in-breath.** Then follow it for a minute, if you like.
      `,
      widget: { type: 'paced-breathing', inhale: 3, exhale: 3, inhaleRange: [2, 6, 1], exhaleRange: [2, 8, 1], breaths: 6, alt: 'A breathing pacer: a circle that grows and shrinks, with sliders for the seconds spent breathing in and out.' },
      check: (s) => {
        if (s.rate === 6 && s.longerExhale) return true;
        if (s.rate !== 6) return `In for ${s.inhale} s and out for ${s.exhale} s is one breath every ${s.cycle} s: ${s.rate} breaths a minute. For 6 a minute, each breath has to last 10 seconds.`;
        return 'That is 6 breaths a minute. Now make the out-breath the longer part.';
      },
      solution: { inhale: 4, exhale: 6 },
      hints: ['60 seconds ÷ 6 breaths = 10 seconds for each breath.', 'For example 4 seconds in and 6 seconds out.'],
      explain: `
        Ten seconds a breath, about half the usual resting pace of ${STRESS.restingBreaths[0]} to ${STRESS.restingBreaths[1]}.
        In trials, a few minutes of slow breathing a day lowered feelings
        of stress a little. It is a small, reliable brake, not a cure for
        what is causing the stress. If slow breathing ever makes you dizzy
        or uneasy, stop and breathe normally.
      `,
    },
    {
      id: 'breath-rate',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [i, o] = rng.pick(BREATH_PATTERNS);
        const who = rng.pick(['Amara', 'Sam', 'Noor', 'Jun', 'Carlos', 'Fatima']);
        const cycle = i + o;
        const rate = 60 / cycle;
        const second = (n) => `${n} ${n === 1 ? 'second' : 'seconds'}`;
        return {
          text: `${who} breathes in for **${second(i)}** and out for **${second(o)}**, over and over.\n\n**How many breaths a minute is that?** (For example, 7 seconds in and 8 seconds out make one breath of 15 seconds, and 60 ÷ 15 = 4 breaths a minute.)`,
          answer: rate,
          unit: 'breaths a minute',
          wrong: [
            [cycle, 'That is the number of seconds one breath takes. How many of those fit into 60 seconds?'],
            ...(60 / i !== rate && Number.isInteger(60 / i) && 60 / i !== cycle ? [[60 / i, 'A whole breath is the in-breath and the out-breath together.']] : []),
          ],
          hints: [`One whole breath takes ${i} + ${o} = ${cycle} seconds.`, `How many times does ${cycle} go into 60?`],
          explain: `One breath takes ${i} + ${o} = ${cycle} seconds, and 60 ÷ ${cycle} = **${rate}** breaths a minute. ${rate <= 7 ? 'That is a slow, calming pace' : rate <= 11 ? 'That is slower than most people breathe at rest' : rate <= 20 ? 'That is an ordinary resting pace' : 'That is faster than most people breathe at rest'}${o > i ? ', with the out-breath longer than the in-breath.' : '.'}`,
        };
      },
    },
    {
      id: 'what-helps',
      type: 'match',
      title: 'What reliably helps',
      text: 'Each of these has good evidence behind it. Think of what the alarm does to the body, and of where stress weighs heaviest: where control and support are low. **Match each with the reason it works.**',
      pairs: [
        ['A brisk walk or other exercise', 'Uses the fuel the alarm released, and lifts mood afterwards'],
        ['Talking it over with someone you trust', 'Support makes a threat feel smaller and more manageable'],
        ['Making a plan for the part you can change', 'Gives back some control'],
        ['A full night\'s sleep', 'Lets the stress hormones fall back to their resting rhythm'],
      ],
      explain: `
        Time outdoors and slow breathing belong on the list too. Two
        popular answers make things worse over time: **alcohol**, which
        calms for an hour and then disturbs sleep and mood, and
        **avoiding** the problem, which leaves it to grow.
      `,
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to try',
      text: `
        Next time you notice your heart speeding up before something
        difficult, you might try **three slow breaths with long
        out-breaths**, and see what changes.

        :::note
        Stress that feels unmanageable for weeks, or that comes with poor
        sleep, low mood or constant worry, is worth talking over with a
        doctor. Help for the mind is the subject of Lesson 6.
        :::

        :::warn
        Chest pain or pressure, or sudden trouble breathing, is never "just
        stress" until a professional has said so: call your local emergency
        number.
        :::
      `,
    },
  ],
  recap: [
    'The body has **one alarm system**: adrenaline within seconds, cortisol within minutes, from the adrenal glands on top of the kidneys.',
    'Short-term stress sends fuel and oxygen to the muscles and then switches off. In moderate doses it sharpens performance.',
    '**Long-term stress**, with no time to recover, disturbs sleep, blood pressure, immunity and mood. It grows where control and support are low.',
    'What helps: slow breathing with long out-breaths, movement, sleep, other people, and changing what can be changed. Alcohol and avoidance backfire.',
  ],
  next: 'Next: the alarm often starts with a thought. How thoughts, feelings and actions feed one another.',
};
