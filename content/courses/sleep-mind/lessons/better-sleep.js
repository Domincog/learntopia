// Sleep, Stress and Mental Health · Lesson 3 · Sleeping Well
// Driving question: what decides when you feel sleepy, and what really helps you sleep?
import { PRESSURE, CAFFEINE, DRINKS, CLEARERS, SLEEP_SCENES, SLEEP_CAUSES, INSOMNIA, clock, hoursText, pic } from '../helpers.js';

const dur = (hours) => { const m = Math.round(hours * 60); return m < 60 ? `${m}-minute` : m % 60 ? `${Math.floor(m / 60)}-hour-${m % 60}-minute` : `${m / 60}-hour`; };
const COFFEE = {
  type: 'decay-curve', from: 6, to: 26, xTick: 2, yMax: 125, yTick: 25, unit: 'mg', yLabel: 'caffeine in the body',
  curves: [{ id: 'caffeine', label: 'caffeine', color: 'orange', halfLife: CAFFEINE.halfLife }],
  eventName: 'coffee', amount: 100, minT: 7, maxT: 22, snap: 0.5,
  marker: { t: 23, label: 'bedtime 23:00' },
};

export default {
  id: 'better-sleep',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The long night',
      text: `
        Kwame gets up at 07:00 and then stays awake all night to finish a
        project. He keeps going through the next day.

        **When do you think he feels sleepier?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: 'At 05:00, after 22 hours awake', correct: true },
        { text: 'At 10:00, after 27 hours awake' },
        { text: 'The same at both: sleepiness just keeps rising' },
      ],
      explain: 'At 05:00, although by 10:00 he has been awake five hours longer. Sleepiness is not simply a count of hours awake. Two separate processes set it, and the next screen shows both.',
    },
    {
      id: 'teach-two-curves',
      type: 'info',
      title: 'Two processes',
      text: `
        Two separate processes decide how sleepy a person feels.

        [**Sleep pressure**]{.blue} builds up for every hour awake and
        drains away during sleep. The graph is a model of an ordinary day.
        On the model's own scale of 0 to 100, which is not a measurement,
        pressure climbs from about ${PRESSURE.usualWake} on waking at 07:00 to about ${PRESSURE.usualBed} at
        23:00, and a night's sleep brings it down again.

        The body clock adds an [**alerting signal**]{.orange} (dotted)
        that works against sleep. It is strongest in the early evening and
        weakest shortly before dawn.
      `,
      figure: {
        type: 'sleep-pressure', static: true, from: 7, to: 31, s0: PRESSURE.usualWake / 100, clock: true, tick: 3,
        blocks: [{ id: 'night', start: 23, end: 31 }],
        alt: 'A graph of one ordinary day from 07:00 to 07:00. Sleep pressure rises steadily from about 9 on waking to about 62 at 23:00 and falls during the night\'s sleep. A dotted curve for the body clock\'s alerting signal peaks at 17:00 and is lowest at 05:00.',
      },
    },
    {
      id: 'all-nighter',
      type: 'interact',
      attempts: 6,
      title: 'Two curves',
      text: `
        This is Kwame's long night. The [blue]{.blue} curve is his **sleep
        pressure**, which builds up for as long as he is awake. The dotted
        [orange]{.orange} curve is the **alerting signal** from his body
        clock. The further the blue curve stands above the dotted one, the
        sleepier he is.

        **Drag the marker to the time when he is sleepiest.**
      `,
      widget: { type: 'sleep-pressure', from: 7, to: 41, s0: PRESSURE.usualWake / 100, clock: true, cursor: 14, tick: 3, alt: 'A graph from 07:00 one day to 17:00 the next. Sleep pressure rises all the way. A dotted curve for the body clock\'s alerting signal peaks at 17:00 and is lowest at 05:00. A marker can be dragged to read both.' },
      check: (s) => {
        if (Math.abs(s.cursor - s.worst.t) <= 1) return true;
        if (s.cursor < s.worst.t) return `At ${s.clock} his sleepiness is ${s.sleepiness}. It climbs higher than that later on.`;
        return `At ${s.clock} his sleepiness is ${s.sleepiness}, lower than it was earlier, although he has now been awake for longer. Go back and find the peak.`;
      },
      solution: { cursor: 29.5 },
      hints: ['Sleepiness is greatest where the blue curve is furthest above the dotted one.', 'Look near the lowest point of the dotted curve.'],
      explain: `
        He is sleepiest at about **05:30**: pressure is high, and the clock's
        alerting signal is at its lowest. By mid-morning the pressure is
        higher still, but the clock's daytime signal covers part of it up.
        That is the "second wind".

        It is a mask, not a recovery: his reactions at 10:00 are still far
        worse than after a night's sleep.
      `,
    },
    {
      id: 'two-processes',
      type: 'fill',
      review: true,
      text: 'Two processes decide how sleepy a person feels. Complete the summary.',
      template: '**Sleep pressure** [[falls|*rises]] with every hour awake and [[*falls|rises]] during sleep. The body clock\'s **alerting signal** is strongest in the [[early morning|*early evening|middle of the night]] and weakest shortly before dawn. A person feels sleepiest when pressure is high and the alerting signal is [[high|*low]].',
      explain: `
        This is the **two-process model**, proposed in 1982 and still the
        standard picture. Part of sleep pressure is a chemical,
        **adenosine**, which builds up in the brain during waking hours and
        is cleared away during sleep.

        Sleep comes easily when both processes agree: high pressure, and a
        clock that has switched its alerting signal off.
      `,
    },
    {
      id: 'lie-in',
      type: 'interact',
      attempts: 6,
      title: 'The Sunday lie-in',
      text: `
        Li usually sleeps from 23:00 to 07:00, and at bedtime her sleep
        pressure is about **${PRESSURE.usualBed}** (the dashed line). This Sunday she
        slept in until **10:30**. At 23:00 her pressure is only 52, and she
        lies awake.

        **Move her bedtime to the earliest time at which her pressure is
        back at its usual level.**
      `,
      widget: {
        type: 'sleep-pressure', from: 22, to: 58, s0: 0.61, tick: 3,
        blocks: [{ id: 'saturday', start: 23, end: 34.5 }, { id: 'sunday', start: 47, end: 55 }],
        sliders: [{ block: 'sunday', edge: 'start', min: 47, max: 53, step: 0.5, label: 'Sunday bedtime' }],
        bed: 'sunday', line: PRESSURE.usualBed, lineLabel: 'her usual level at bedtime',
        alt: 'A graph of sleep pressure from Saturday 22:00 to Monday 10:00. It falls during a long sleep until 10:30 on Sunday, rises through Sunday, and falls again in the sleep that ends with the alarm at 07:00 on Monday. A slider moves Sunday\'s bedtime.',
      },
      check: (s) => {
        const bed = s.blocks.sunday.start;
        if (s.bedPressure < PRESSURE.usualBed) return `At ${clock(bed)} her pressure is ${Math.round(s.bedPressure)}: still below ${PRESSURE.usualBed}. Later.`;
        if (bed > 51.5) return `At ${clock(bed)} her pressure is ${Math.round(s.bedPressure)}. It reached ${PRESSURE.usualBed} a little before that: find the earliest such bedtime.`;
        return true;
      },
      solution: { blocks: { sunday: { start: 51.5 } } },
      hints: ['On a normal day she needs about 16 hours awake to reach this level. After such a long sleep she starts from lower down, so it takes a little longer still.'],
      explain: `
        Not until about **03:30**. A lie-in of three and a half hours has
        pushed the moment she is ready for sleep back by four and a half,
        and the Monday alarm still rings at 07:00.

        A big gap between the hours kept on free days and on working days
        is sometimes called "social jet lag". A **steady getting-up time**
        is one of the best-supported sleep habits there is.
      `,
    },
    {
      id: 'nap',
      type: 'interact',
      attempts: 6,
      title: 'Where to put a nap',
      text: `
        Mei is up at 07:00 and in bed at 23:00. Today she napped for 90
        minutes at 18:00, and now her bedtime pressure is far below the
        dashed line, the level at which she falls asleep easily.

        **Change the nap** (she still wants one) so that her pressure at
        23:00 is on or above the line.
      `,
      widget: {
        type: 'sleep-pressure', from: 7, to: 31, s0: PRESSURE.usualWake / 100, tick: 3,
        blocks: [{ id: 'nap', start: 18, end: 19.5, label: 'nap' }, { id: 'night', start: 23, end: 31 }],
        sliders: [
          { block: 'nap', edge: 'move', min: 12, max: 20, step: 0.5, label: 'nap starts at' },
          { block: 'nap', edge: 'length', min: 0.25, max: 2, step: 0.25, label: 'nap lasts' },
        ],
        bed: 'night', line: PRESSURE.napLine, lineLabel: 'falls asleep easily',
        alt: 'A graph of sleep pressure from 07:00 to 07:00. It rises through the day, drops during a nap, rises again until bedtime at 23:00 and falls in the night. Sliders set when the nap starts and how long it lasts.',
      },
      check: (s) => s.bedPressure >= PRESSURE.napLine
        || `A ${dur(s.blocks.nap.length)} nap at ${clock(s.blocks.nap.start)} leaves her pressure at ${Math.round(s.bedPressure * 10) / 10} by 23:00: below the line at ${PRESSURE.napLine}. Try a shorter nap, or an earlier one.`,
      solution: { blocks: { nap: { start: 13, length: 0.25 } } },
      hints: ['Sleep drains pressure quickly, so every minute of a nap costs something. Start with its length.'],
      explain: `
        A **short nap, early in the afternoon** costs little pressure, and
        there are many waking hours left to rebuild it. A long nap in the
        evening spends pressure that the night needed.

        Short daytime naps do improve alertness, and they suit many people.
        For someone who struggles to fall asleep at night, they are worth
        a second look.
      `,
    },
    {
      id: 'caffeine-predict',
      type: 'slider',
      mode: 'predict',
      title: 'An afternoon coffee',
      text: `
        Jo drinks a coffee containing **100 mg** of caffeine at **15:00**.

        For a typical adult, roughly how much of that caffeine do you think
        is still in the body at **23:00**?
      `,
      min: 0, max: 100, step: 5, answer: 35, tolerance: 10, unit: 'mg', start: 0,
      explain: `
        About **33 mg**: a third of the cup. The body clears caffeine
        slowly. It takes a typical adult about **5 hours** to get rid of
        half of what is there, and another 5 hours to get rid of half of
        the rest. That time is called the **half-life**.
      `,
    },
    {
      id: 'caffeine-move',
      type: 'interact',
      attempts: 6,
      title: 'The last cup',
      text: `
        Caffeine works by blocking the brain's receptors for adenosine: it
        **hides** sleep pressure without removing it.

        Here is Jo's 100 mg coffee, with a half-life of 5 hours. **Drag the
        cup to the latest time** that leaves no more than **25 mg** at
        23:00.
      `,
      widget: { ...COFFEE, events: [{ t: 15, amount: 100 }], edit: 'move', line: { y: 25, label: '25 mg' }, alt: 'A graph of caffeine in the body from 06:00 to 02:00. The level jumps to 100 milligrams when a coffee is drunk and then falls by half every five hours. The coffee can be dragged along the time axis; a marker shows the level at 23:00.' },
      check: (s) => {
        const t = s.events[0].t;
        if (s.atMarker > 25) return `A coffee at ${clock(t)} leaves ${s.atMarker} mg at 23:00: more than 25. Earlier.`;
        if (t < 13) return `A coffee at ${clock(t)} leaves ${s.atMarker} mg at 23:00. That is under 25, but a later cup would also do. Find the latest.`;
        return true;
      },
      solution: { events: [{ t: 13, amount: 100 }] },
      hints: ['100 mg falls to 50 mg in one half-life, and to 25 mg in two.', 'Two half-lives are 10 hours. Count back from 23:00.'],
      explain: `
        **13:00.** From 100 mg to 25 mg takes two half-lives, which is 10
        hours. So an early-afternoon cup is a quarter of a cup at bedtime.

        In one trial a large dose (400 mg) taken six hours before bed still
        cost more than an hour of sleep, and the sleepers did not notice.
        This model treats the cup as absorbed at once; really it takes half
        an hour or more.
      `,
    },
    {
      id: 'caffeine-left',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(CLEARERS);
        const d = rng.pick(DRINKS);
        const k = rng.pick(who.halfLife >= 6 ? [1, 2] : [1, 2, 3]);
        const start = rng.pick([8, 9, 10, 11, 12, 13, 14].filter((t) => t + k * who.halfLife <= 25));
        const end = start + k * who.halfLife;
        const left = d.mg / 2 ** k;
        const steps = [d.mg];
        for (let i = 1; i <= k; i++) steps.push(d.mg / 2 ** i);
        return {
          text: `
            ${who.name}'s body clears caffeine with a half-life of
            **${who.halfLife} hours** (${who.why}). At **${clock(start)}**
            ${who.name} has ${d.drink}, with about **${d.mg} mg** of
            caffeine.

            **About how much of that caffeine is left at ${clock(end)}?**
          `,
          answer: left,
          unit: 'mg',
          wrong: [
            ...(k > 1 ? [[d.mg / 2, `That is what is left after one half-life, at ${clock(start + who.halfLife)}. By ${clock(end)}, ${k} half-lives have passed.`]] : []),
            [d.mg, 'That is the whole dose. Half of it is gone after one half-life.'],
            ...(k === 3 ? [[d.mg / 4, `That is what is left after two half-lives. From ${clock(start)} to ${clock(end)} is three.`]] : []),
          ],
          hints: [`From ${clock(start)} to ${clock(end)} is ${k * who.halfLife} hours. How many half-lives of ${who.halfLife} hours is that?`, `Halve ${d.mg} mg once for each half-life.`],
          explain: `From ${clock(start)} to ${clock(end)} is ${k * who.halfLife} hours: ${k === 1 ? 'one half-life' : `${k} half-lives`}. So the amount is halved ${k === 1 ? 'once' : k === 2 ? 'twice' : 'three times'}: ${steps.join(' → ')} mg. **${left} mg** is left. Half-lives from about ${CAFFEINE.range[0]} to ${CAFFEINE.range[1]} hours have been measured in healthy adults, which is one reason the same cup keeps one person awake and not another.`,
        };
      },
    },
    {
      id: 'which-process',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const scene = rng.pick(SLEEP_SCENES);
        const whys = {
          pressure: 'Pressure depends on the hours spent awake since the last sleep. Count them here.',
          clock: 'Ask what time it is for this person\'s body clock, not for the clock on the wall.',
          caffeine: 'Is there any caffeine in this story?',
        };
        return {
          text: `${scene.text}\n\n**What best explains it?**`,
          shuffle: false,
          columns: 1,
          options: ['pressure', 'clock', 'caffeine'].map((key) => ({
            text: SLEEP_CAUSES[key],
            correct: key === scene.cause,
            why: key === scene.cause ? undefined : (key === 'caffeine' ? 'There is no caffeine in this story. ' : '') + whys[scene.cause],
          })),
          explain: scene.because,
        };
      },
    },
    {
      id: 'teach-habits',
      type: 'info',
      title: 'Sleep advice, sorted by evidence',
      text: `
        Advice about sleep is everywhere. Trials sort it into three
        piles.

        - **Helps.** The plain habits: regular hours, morning light, a
          bedroom that is cool, dark and quiet, and a bed kept for
          sleeping.
        - **Harms.** Caffeine late in the day, and alcohol. Alcohol does
          bring sleep on faster, but as it wears off the second half of
          the night is broken and short of REM sleep.
        - **Little or mixed evidence.** Glasses that filter out blue
          light: a 2023 Cochrane review found no clear benefit for sleep.
          And sleep trackers: they guess at sleep stages from movement
          and pulse, and worrying about the score can itself keep people
          awake.
      `,
    },
    {
      id: 'habits',
      type: 'bucket',
      title: 'What helps?',
      text: 'Advice about sleep is everywhere. **Sort these by what the evidence says.**',
      buckets: ['Helps sleep', 'Harms sleep', 'Little or mixed evidence'],
      items: [
        { text: 'Getting up at the same time every day', bucket: 0 },
        { text: 'Daylight in the morning', bucket: 0, why: 'Morning light steadies the body clock (Lesson 2).' },
        { text: 'A cool, dark, quiet bedroom', bucket: 0 },
        { text: 'A glass of wine to help you drop off', bucket: 1, why: 'Alcohol does bring sleep on faster. But as it wears off the second half of the night is broken and short of REM sleep.' },
        { text: 'A large coffee six hours before bed', bucket: 1, why: 'After six hours nearly half of the caffeine is still there.' },
        { text: 'Glasses that filter out blue light', bucket: 2, why: 'A 2023 Cochrane review found no clear benefit for sleep.' },
        { text: 'Aiming for a perfect score on a sleep tracker', bucket: 2, why: 'Trackers guess at sleep stages from movement and pulse, and worrying about the score can itself keep people awake.' },
      ],
      explain: `
        The plain habits have the best evidence.

        Evening screens are less clear-cut. In trials they delay sleep by
        minutes rather than hours, and what is on the screen (and the sleep
        time it eats) seems to matter more than its blue light.
      `,
    },
    {
      id: 'teach-insomnia',
      type: 'info',
      title: 'Insomnia, and what treats it',
      text: `
        Trouble sleeping on at least ${INSOMNIA.nightsPerWeek} nights a week, for ${INSOMNIA.months} months or
        more, with the days suffering for it, is long-term **insomnia**.
        About one adult in ten has it.

        Medical guidelines recommend a talking therapy first:
        **cognitive behavioural therapy for insomnia (CBT-I)**. Over a few
        weeks a therapist, or a tested online programme, helps a person to
        rebuild sleep pressure, to keep the bed for sleep, and to loosen
        the worry about not sleeping. It helps most people who try it, and
        the gains last after it ends.

        Sleeping pills can help for a short while, but they bring side
        effects and the benefit fades. Guidelines keep them as a second
        choice, for short periods.
      `,
    },
    {
      id: 'insomnia',
      type: 'choice',
      title: 'When sleep will not come',
      text: `
        For four months Dana has lain awake for hours on most nights and
        dragged herself through the days. This is long-term **insomnia**,
        and about one adult in ten has it.

        **Which treatment do medical guidelines recommend trying first?**
      `,
      columns: 1,
      options: [
        { text: 'A talking therapy designed for insomnia (CBT-I)', correct: true },
        { text: 'Sleeping pills every night', why: 'Sleeping pills can help for a short while, but they bring side effects and the benefit fades. Guidelines keep them as a second choice, for short periods.' },
        { text: 'Going to bed much earlier, to give sleep more time', why: 'More time in bed with low sleep pressure means more time lying awake, and the bed becomes a place of frustration. The therapy often does the opposite at first.' },
        { text: 'A nightcap', why: 'Alcohol breaks up the second half of the night, and relying on it brings problems of its own.' },
      ],
      explain: `
        **CBT-I**, the talking therapy designed for insomnia. Months of
        bad nights like Dana's are what it is meant for.

        A family doctor is the usual place to start.
      `,
    },
    {
      id: 'teach-apnoea',
      type: 'info',
      title: 'When to ask a doctor',
      text: `
        Most poor nights need no doctor. A few signs do.

        One is loud snoring with pauses in breathing, together with
        sleepiness by day. These are the signs of **sleep apnoea**, in
        which the throat collapses and the airway keeps closing during
        sleep. Breathing stops for a moment and sleep is broken, dozens
        of times an hour. It is common, it strains the heart, and it is
        very treatable, by keeping the airway open during sleep.

        Another is nodding off at the wheel or at work. At the wheel it
        is dangerous now.
      `,
      figure: {
        type: 'body-map', view: 'head', show: ['skull', 'brain', 'nose', 'mouth', 'tongue', 'throat', 'windpipe', 'food-pipe'], static: true, zoom: false,
        labels: [{ id: 'throat', text: 'Throat: where the airway closes' }, { id: 'windpipe', text: 'Windpipe' }],
        flows: [{ path: ['nose', 'throat', 'windpipe'], color: 'blue', label: 'The path of air to the lungs', dots: false }],
        alt: 'A head and neck seen from the side, cut open. An arrow follows the air from the nose down through the throat, behind the tongue, into the windpipe. The throat is named as the place where the airway closes in sleep apnoea.',
      },
    },
    {
      id: 'red-flags',
      type: 'multi',
      title: 'Worth a doctor\'s visit',
      text: 'Most poor nights need no doctor. **Which of these are worth raising with one?**',
      options: [
        { text: 'Loud snoring with pauses in breathing, and sleepiness by day', correct: true },
        { text: 'Nodding off at the wheel or at work', correct: true },
        { text: `Trouble sleeping at least ${INSOMNIA.nightsPerWeek} nights a week for ${INSOMNIA.months} months`, correct: true },
        { text: 'A poor night before an exam', why: 'A short spell of bad sleep around a stressful event is ordinary and usually passes by itself.' },
        { text: 'Waking briefly in the night and dropping off again', why: 'Brief awakenings are part of every normal night, as the hypnogram in Lesson 1 showed.' },
      ],
      explain: `
        Snoring with pauses and daytime sleepiness point to **sleep
        apnoea**, and months of bad nights to insomnia. Both can be
        treated, and a doctor is the way in.

        Sleepiness at the wheel is dangerous now: the only safe response is
        to stop driving, and then to find out why.
      `,
    },
    {
      id: 'cpap',
      type: 'choice',
      title: 'A machine by the bed',
      text: `
        The picture shows the most common treatment for sleep apnoea: a
        small bedside machine, a hose, and a mask worn over the nose (or
        nose and mouth) all night.

        **What does it do?**
      `,
      figure: pic('cpap', {
        alt: 'A grey box-shaped bedside machine with a long flexible hose, lying on a red cloth beside two clear plastic face masks with fabric head straps.',
        caption: 'A CPAP machine with its hose and two kinds of mask',
      }),
      columns: 1,
      options: [
        { text: 'It blows room air in gently, and the slight pressure holds the airway open', correct: true },
        { text: 'It supplies extra oxygen', why: 'It uses ordinary room air. What helps is the gentle pressure, which stops the throat from collapsing, not extra oxygen.' },
        { text: 'It gives a sleeping medicine as a mist', why: 'There is no medicine in it. The problem in sleep apnoea is a blocked airway, and the machine is a pump.' },
      ],
      explain: `
        It is called **CPAP**: continuous positive airway pressure. The
        stream of air acts as a splint for the throat, so breathing no
        longer stops and sleep is no longer broken dozens of times an
        hour. Many people feel the difference within days.

        Sleep apnoea is diagnosed with an overnight sleep test, and there
        are other treatments too. The first step is to mention the snoring
        and the sleepiness to a doctor.
      `,
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to try',
      text: `
        If you would like to experiment, pick **one** thing for a week:

        - a steady getting-up time, weekends included; or
        - moving your last caffeine of the day a couple of hours earlier.

        Then notice how your evenings feel. No scores are needed.

        :::note
        Chasing perfect sleep can backfire: trying hard to sleep is a
        reliable way to stay awake. A few poor nights do no lasting harm.
        Children, people who are pregnant and people with a health
        condition may be given different advice about caffeine and sleep.
        :::
      `,
    },
  ],
  recap: [
    'Two processes set sleepiness: **sleep pressure**, which builds while you are awake, and the **body clock**, whose alerting signal is weakest before dawn.',
    'Long lie-ins and late naps spend pressure the next night needs. A steady getting-up time is among the best-supported habits.',
    'Caffeine hides sleep pressure. Its **half-life** is about 5 hours, with wide differences between people. Alcohol brings sleep on and then breaks it up.',
    'Long-term insomnia is treated first with **CBT-I**, not pills. Snoring with pauses, or sleepiness at the wheel, is a reason to see a doctor.',
  ],
  next: 'Next: a pounding heart before a test, and a job that never lets up. What stress is, and what it does to a body.',
};
