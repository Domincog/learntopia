// Movement and Fitness · Lesson 2 · Heart, Lungs and Stamina
//
// Driving question: why does a fit heart beat more slowly?
// Sources: physiology textbooks for cardiac output and the adaptations to endurance training; Tanaka, Monahan
// and Seals, J Am Coll Cardiol 2001 (maximum heart rate); CDC and American Heart Association for heart-rate
// ranges (they differ, so they are never graded); WHO 2020 for the 0–10 effort scale.
import { PEOPLE as NAMES, HEART, maxHeartRate, HR_ZONES, WHO, grouped } from '../helpers.js';
import { PEOPLE as BODY, physiology, effortForWork } from '../../../../src/widgets/effort-lab.js';

const rest = { before: physiology('before', 0), after: physiology('after', 0) };
const peak = physiology('before', 100);
const JOG = 7;   // work rate of an easy jog, in multiples of rest
const jog = { before: physiology('before', effortForWork('before', JOG)), after: physiology('after', effortForWork('after', JOG)) };
const one = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '');

const LAB = { type: 'effort-lab', alt: 'A heart, a pair of lungs and a speech bubble for an example adult, with bars for heart rate, blood pumped per beat, blood pumped per minute, breathing rate and energy use.' };

export default {
  id: 'aerobic',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Two hearts at rest',
      text: `
        Two adults of the same size sit reading. One has never trained. The
        other has cycled long distances for years. At rest, both bodies need
        the same amount of blood: about ${HEART.restOutput} litres a minute.

        The untrained heart beats **70 times a minute**. What would you
        expect of the cyclist's?
      `,
      options: [
        { text: 'About 50: fewer beats, each one bigger', correct: true },
        { text: 'About 70: at rest all healthy hearts are alike' },
        { text: 'About 90: a trained heart is used to working fast' },
        { text: 'About 70, but each beat is gentler' },
      ],
      explain: `
        Fewer and bigger. Endurance athletes often have resting pulses of
        ${HEART.athleteRate[0]} to ${HEART.athleteRate[1]}, where
        ${HEART.restingRate[0]} to ${HEART.restingRate[1]} is typical for adults.

        Why would a *stronger* heart beat *less*? To see it, you need to
        watch what a heart does when the work starts.
      `,
    },
    {
      id: 'effort-explore',
      type: 'interact',
      graded: false,
      title: 'From the sofa to all-out',
      text: `
        Here is a model of an adult who does not train (real bodies differ
        in the numbers, not in the pattern). **Take them slowly from rest to
        maximum effort**, pausing at moderate, vigorous and near-maximal.

        Which bar grows steadily all the way? Which one stops growing early?
      `,
      widget: { ...LAB, effort: 0 },
      check: (s) => {
        const need = ['moderate', 'vigorous', 'max'].filter((z) => !s.zones.includes(z));
        if (!need.length) return true;
        return need.length === 3 ? 'Move the effort slider up, a little at a time.' : `Keep going: you have not yet stopped at ${need.map((z) => (z === 'max' ? 'near-maximal' : z)).join(' or ')} effort.`;
      },
      solution: { effort: 100, zones: ['rest', 'light', 'moderate', 'vigorous', 'max'] },
      explain: `
        **Heart rate** climbs in a straight line, from ${rest.before.heartRate} to ${peak.heartRate}.
        **Blood per beat** rises from ${rest.before.stroke} to ${peak.stroke} mL and then levels off
        before half-way. Together they lift the **blood per minute** from
        ${one(rest.before.output)} to ${one(peak.output)} litres: about four times as much.
      `,
    },
    {
      id: 'teach-output',
      type: 'info',
      title: 'Three numbers for one pump',
      text: `
        Each bar you watched has a name:

        - **Heart rate**: beats a minute. It is the pulse you can feel at the wrist.
        - **Stroke volume**: the blood pumped by one beat.
        - **Cardiac output**: the blood pumped in a minute. It is the other two multiplied.

        :::example At full effort
        The model heart beats ${peak.heartRate} times a minute and pumps ${peak.stroke} mL with each beat.
        ${peak.heartRate} × ${peak.stroke} mL = ${grouped(peak.heartRate * peak.stroke)} mL, which is **${one(peak.output)} litres a minute** (1 litre = 1,000 mL).
        :::

        The reason is oxygen. At full effort this body uses ${BODY.before.maxWork} times
        the energy it uses at rest, and almost all of it comes from burning
        fuel with oxygen. More blood delivers it, and the muscles also take
        more oxygen out of every litre.
      `,
      figure: { ...LAB, effort: 100, static: true, show: ['heart', 'stroke', 'output'], talk: false, alt: `The example adult at maximum effort, with three bars: heart rate ${peak.heartRate} beats a minute, ${peak.stroke} millilitres pumped per beat, and ${one(peak.output)} litres pumped per minute.` },
    },
    {
      id: 'pulse',
      type: 'numeric',
      title: 'Count a pulse',
      gen: (rng) => {
        const who = rng.pick(NAMES);
        const [secs, mult] = rng.pick([[15, 4], [30, 2], [20, 3]]);
        const perMin = rng.pick([48, 52, 60, 64, 72, 76, 84, 88, 96].filter((v) => v % mult === 0));
        const count = perMin / mult;
        return {
          text: `
            If you like, find your own pulse: two fingertips on the inside of
            your wrist, below the thumb. (This is only to feel it. Nothing you
            count is asked for or stored.)

            A short count is scaled up to a full minute: 11 beats in 10
            seconds would be 11 × 6 = 66 beats a minute.

            ${who}, sitting quietly, counts **${count} beats in ${secs} seconds**.
            **What is ${who}'s pulse in beats a minute?**
          `,
          answer: perMin,
          unit: 'beats a minute',
          wrong: [[count, `That is the count for ${secs} seconds. A minute has ${mult} lots of ${secs} seconds.`]],
          hints: [`${secs} seconds fits into a minute ${mult} times.`],
          explain: `$${count} \\times ${mult} = ${perMin}$ beats a minute. ${perMin < HEART.restingRate[0] ? `That is below the usual ${HEART.restingRate[0]} to ${HEART.restingRate[1]}, which is common in fit people.` : `That is inside the usual adult resting range of ${HEART.restingRate[0]} to ${HEART.restingRate[1]}.`} A resting pulse varies with age, fitness, medicines, caffeine and the time of day.`,
        };
      },
    },
    {
      id: 'output',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(NAMES);
        const [doing, rates, strokes] = rng.pick([
          ['walking briskly', [100, 110, 120], [80, 90, 100]],
          ['jogging steadily', [130, 140, 150], [90, 100, 110]],
          ['sitting on a bench', [60, 70, 80], [60, 70, 80]],
          ['cycling up a long hill', [150, 160, 170], [100, 110, 120]],
        ]);
        const hr = rng.pick(rates);
        const sv = rng.pick(strokes);
        const litres = (hr * sv) / 1000;
        return {
          text: `
            ${who} is ${doing}. The heart beats **${hr} times a minute** and
            pumps **${sv} mL** of blood with each beat.

            **How many litres of blood does it pump in a minute?**
            (1 litre = 1,000 mL.)
          `,
          answer: litres,
          unit: 'litres a minute',
          wrong: [
            [hr * sv, 'That is the answer in millilitres. Divide by 1,000 to get litres.'],
            [hr + sv, 'Each beat pumps that volume, so multiply the two numbers.'],
          ],
          hints: ['Blood per minute = beats per minute × blood per beat.', `$${hr} \\times ${sv} = ${hr * sv}$ mL. Now turn that into litres.`],
          explain: `$${hr} \\times ${sv} \\text{ mL} = ${hr * sv} \\text{ mL} = ${one(litres)}$ litres a minute. This number is the **cardiac output**: heart rate times stroke volume, the volume pumped per beat.`,
        };
      },
    },
    {
      id: 'compare',
      type: 'interact',
      title: 'The same hill, months later',
      text: `
        Now the slider sets the **job**, not the feeling: a work rate, in
        multiples of the energy used at rest. An easy jog is about ${JOG} × rest.

        **Set the work rate to ${JOG}, then switch between the two bodies**:
        the same person before and after months of regular endurance
        training.
      `,
      widget: { ...LAB, scale: 'work', work: 1, compare: true },
      check: (s) => {
        if (s.work !== JOG) return `Set the work rate to ${JOG} × rest first. It is at ${s.work}.`;
        return s.people.length === 2 || 'Now press the other button above the picture to see the other body doing the same job.';
      },
      solution: { work: JOG, person: 'after', people: ['before', 'after'] },
      explain: `
        Same job, different body. Before training: ${jog.before.heartRate} beats a minute,
        ${jog.before.breaths} breaths, only a few words at a time. After:
        ${jog.after.heartRate} beats, ${jog.after.breaths} breaths, and a
        conversation.

        The jog did not get easier. The body got bigger margins.
      `,
    },
    {
      id: 'what-changed',
      type: 'fill',
      review: true,
      text: `
        Set the work rate to **${JOG} × rest** (an easy jog) and compare the
        example person **before** and **after** months of endurance
        training.
      `,
      figure: { ...LAB, scale: 'work', work: JOG, compare: true, show: ['heart', 'stroke', 'output'], talk: false },
      template: `
        Doing the same job, the trained heart beats [[faster|*more slowly|at the same rate]].
        Each beat pumps [[less|the same amount of|*more]] blood.
        The blood pumped per minute is [[*about the same|about half|about double]].
      `,
      explain: `
        ${jog.before.heartRate} beats of ${jog.before.stroke} mL, or ${jog.after.heartRate} beats of
        ${jog.after.stroke} mL: both come to about ${Math.round(jog.before.output)} litres a minute,
        because the job needs the same oxygen. A trained heart has a larger
        **stroke volume**, so it gets there with fewer beats. At rest it is
        the same story: ${rest.after.heartRate} beats instead of ${rest.before.heartRate}.
      `,
    },
    {
      id: 'oxygen-path',
      type: 'order',
      title: 'The supply line',
      text: `
        Stamina is the capacity of one long supply line, and you met its
        stages in *The Body I*. (A capillary is the finest kind of blood
        vessel. A mitochondrion is the part of a cell that burns fuel with
        oxygen.)

        **Put the journey of an oxygen molecule in order**, from the air to
        the place where it is used.
      `,
      items: [
        'Breathed into the air sacs of the lungs',
        'Crosses into the blood and binds to a red blood cell',
        'Pumped out to the body by the left side of the heart',
        'Leaves the blood through a capillary wall in a muscle',
        'Used in a mitochondrion to burn fuel',
      ],
      labels: ['From the air', 'To the muscle cell'],
      explain: `
        Lungs, blood, heart, capillaries, mitochondria. Activity that
        leans on this line for minutes at a time, such as walking,
        cycling or swimming, is called **aerobic**: "with oxygen". The
        next screen shows what it does to each stage.
      `,
    },
    {
      id: 'teach-adaptations',
      type: 'info',
      title: 'Training widens the line',
      text: `
        Weeks and months of regular aerobic activity change **every**
        stage of the supply line:

        - **Heart and blood**: the main chamber grows a little and fills better, and blood volume rises. The stroke volume goes up, so the same supply takes fewer beats, at rest too.
        - **Capillaries**: more grow around each muscle fibre, a shorter path for oxygen.
        - **Mitochondria**: the fibres build more, so more fuel is burned with oxygen each minute.

        The whole line is measured as **VO₂ max**: the most oxygen a body
        can use per minute, per kilogram of body weight. It rises with
        training at any age, and it is one of the strongest known
        predictors of long-term health.
      `,
      figure: { ...LAB, scale: 'work', work: JOG, person: 'after', compare: true, show: ['heart', 'stroke', 'output'], talk: false, alt: `The example adult doing an easy jog, with a switch between the body before and after months of endurance training. Before: ${jog.before.heartRate} beats a minute of ${jog.before.stroke} millilitres. After: ${jog.after.heartRate} beats of ${jog.after.stroke} millilitres. The blood pumped per minute is about the same.` },
    },
    {
      id: 'adaptations',
      type: 'match',
      review: true,
      text: 'Regular endurance training changes the body. **Match each change to what it achieves.**',
      pairs: [
        ['A larger stroke volume', 'More blood moved with every heartbeat'],
        ['A lower resting pulse', 'The same resting supply from fewer beats'],
        ['More capillaries in the muscles', 'A shorter path for oxygen from blood to muscle fibre'],
        ['More mitochondria in the muscles', 'More fuel burned with oxygen each minute'],
      ],
      explain: 'Supply (heart and blood), delivery (capillaries) and use (mitochondria) all grow together. That is why stamina improves faster than any single measurement would suggest.',
    },
    {
      id: 'example-max-rate',
      type: 'info',
      title: 'A heart has a top speed',
      text: `
        The fastest a heart can beat falls with age. A formula fitted to
        studies of more than 18,000 people estimates it:

        $$ 208 - 0.7 \\times \\text{age} $$

        :::example For a 55-year-old
        1. Multiply first: 0.7 × 55 = 38.5.
        2. Then subtract: 208 − 38.5 = **${maxHeartRate.tanaka(55)}** beats a minute.
        :::

        An older rule of thumb, 220 minus age, gives ${maxHeartRate.fox(55)} here. Both are
        averages. A healthy person's true maximum is commonly ${maxHeartRate.spread} beats a
        minute or more to either side, and training hardly changes it.
      `,
      figure: {
        type: 'plot', height: 270, x: [20, 80], y: [130, 210], xStep: 10, yStep: 10, xLabel: 'age', yLabel: 'estimated maximum heart rate',
        fns: [
          { expr: '208 - 0.7*x', color: 'blue' },
          { expr: '220 - x', color: 'gray', dashed: true, width: 2 },
        ],
        points: [{ x: 55, y: maxHeartRate.tanaka(55), color: 'orange', r: 7 }],
        labels: [{ x: 60, y: 180, text: '208 − 0.7 × age', color: 'blue' }, { x: 59, y: 145, text: '220 − age', color: 'gray' }, { x: 52, y: 158, text: `age 55: ${maxHeartRate.tanaka(55)}`, color: 'orange', anchor: 'end' }],
        alt: `Two falling straight lines of estimated maximum heart rate against age from 20 to 80. The formula 208 minus 0.7 times age runs from 194 to 152. The older rule, 220 minus age, runs from 200 to 140 and crosses it at age 40. A dot marks the worked example: ${maxHeartRate.tanaka(55)} at age 55.`,
      },
    },
    {
      id: 'max-rate',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(NAMES);
        const age = rng.pick([20, 30, 40, 50, 60, 70, 80]);
        const est = maxHeartRate.tanaka(age);
        const old = maxHeartRate.fox(age);
        return {
          text: `
            A heart has a top speed, and it falls with age. A formula fitted to
            studies of more than 18,000 people estimates it as

            $$ 208 - 0.7 \\times \\text{age} $$

            **Estimate the maximum heart rate of ${who}, who is ${age}.**
          `,
          answer: est,
          unit: 'beats a minute',
          wrong: [
            ...(old !== est ? [[old, 'That is the older rule of thumb, 220 minus age. Use the formula shown.']] : []),
            [208 - age, `Multiply the age by 0.7 first: $0.7 \\times ${age} = ${Math.round(0.7 * age)}$.`],
          ],
          hints: [`First $0.7 \\times ${age} = ${Math.round(0.7 * age)}$.`],
          explain: `$208 - 0.7 \\times ${age} = 208 - ${Math.round(0.7 * age)} = ${est}$ beats a minute. The older rule, 220 minus age, gives ${old}${old === est ? ': at 40 the two agree' : ''}. Both are averages: a healthy person's true maximum is commonly 10 beats a minute or more away from them.`,
        };
      },
    },
    {
      id: 'spread',
      type: 'choice',
      text: `
        Two healthy 40-year-olds get the same estimate from either formula:
        a maximum heart rate of **180**.

        On a supervised treadmill test, one tops out at **165** and the other
        at **195**. What is the best explanation?
      `,
      options: [
        { text: 'Nothing is wrong: the formulas give an average, and people commonly differ from it by 10 to 20 beats', correct: true },
        { text: 'The one at 195 must be much fitter', why: 'Training hardly changes maximum heart rate. It changes how much blood each beat moves.' },
        { text: 'The one at 165 has a heart problem', why: 'A lower maximum is usually just individual variation. The spread around the formula is about 10 beats a minute to either side, and wider for some.' },
        { text: 'One of the tests was done wrongly', why: 'Differences of this size between healthy people of the same age are ordinary.' },
      ],
      explain: `
        Maximum heart rate is mostly set by age and by the individual. The
        formulas are averages with a spread of about ${maxHeartRate.spread} beats a minute to
        either side, so "percent of maximum" targets are rough guides.
        Agencies do not even agree on the bands: for moderate effort one
        gives ${HR_ZONES.cdc.moderate[0]} to ${HR_ZONES.cdc.moderate[1]}% of maximum, another
        ${HR_ZONES.aha.moderate[0]} to ${HR_ZONES.aha.moderate[1]}%. Some medicines, such as beta blockers,
        slow the heart, and then heart-rate targets do not apply.

        How hard it **feels** works for everyone: on a scale from 0 to 10,
        moderate is about ${WHO.rpe.moderate[0]} or ${WHO.rpe.moderate[1]} and vigorous about ${WHO.rpe.vigorous[0]} or ${WHO.rpe.vigorous[1]}. And the talk test
        costs nothing.
      `,
    },
    {
      id: 'fuel',
      type: 'choice',
      title: 'What is in the tank',
      text: `
        Muscles burn a mix of **fat** and **carbohydrate**. Some gym machines
        mark a gentle effort as the "fat-burning zone".

        **Slide the effort** and watch the bar: its length is the energy used
        each minute, and its two parts show where that energy comes from.
        Which statement fits what you see?
      `,
      figure: { type: 'effort-lab', effort: 20, show: ['fuel'], alt: 'A heart, lungs and a speech bubble for an example adult, with one bar for energy use, split into a part from fat and a part from carbohydrate.' },
      options: [
        { text: 'At gentle effort fat supplies a larger share, but of a much smaller total', correct: true },
        { text: 'Only gentle exercise uses any fat', why: 'Slide to moderate effort: the fat part of the bar is longer there than at gentle effort. Only near maximum does it shrink away.' },
        { text: 'The mix stays the same at every effort', why: 'Watch the striped part: the harder the effort, the more of the energy comes from carbohydrate.' },
        { text: 'Exercise runs on carbohydrate alone', why: 'At rest and at gentle effort more than half of the energy comes from fat.' },
      ],
      explain: `
        The label confuses a **share** with an **amount**. As effort rises,
        the mix shifts towards carbohydrate, the fuel that can be burned
        fastest, while the total energy used keeps climbing. In this model
        the fat used per minute is highest at moderate effort.

        For health, the fuel mix of a session hardly matters. What counts is
        the activity itself: the minutes and the effort.
      `,
    },
    {
      id: 'intervals',
      type: 'choice',
      shuffle: false,
      title: 'Steady or in bursts',
      text: `
        Two people record their heart rate during a 30-minute session.
        One keeps a **steady** moderate effort. The other does **intervals**:
        hard bursts with easy stretches between.

        In trials that compare them, both kinds of session raise VO₂ max,
        and intervals often give a similar or slightly larger gain for
        less time. **Which statement about them is best supported?**
      `,
      figure: {
        type: 'plot', height: 250, x: [0, 30], y: [60, 200], xStep: 5, yStep: 20, xLabel: 'minutes', yLabel: 'heart rate',
        fns: [
          { expr: '130 - 60*exp(-x/1.5)', color: 'blue' },
          { expr: '142 + 26*tanh(3*sin(1.05*x - 1.6)) - 46*exp(-x/1.2)', color: 'orange' },
        ],
        labels: [{ x: 10.9, y: 140, text: 'steady', color: 'blue' }, { x: 21.5, y: 182, text: 'intervals', color: 'orange' }],
        alt: 'Two heart-rate traces over 30 minutes. The steady session rises to about 130 beats a minute and stays there. The interval session swings five times between about 115 and 170.',
      },
      options: [
        { text: 'Both improve fitness; intervals can do it in less time, and steady effort is easier to keep up', correct: true },
        { text: 'Only the interval session improves fitness', why: 'Steady moderate activity is what most of the evidence for health is built on.' },
        { text: 'Only the steady session is safe', why: 'Interval training has been used safely in trials with many groups, including older people. Anyone with a medical condition should check first.' },
        { text: 'The interval session does not count, because part of it is easy', why: 'Every minute counts, and the vigorous minutes count double.' },
      ],
      explain: `
        Both sessions train the supply line, and every minute of both
        counts. Neither is required. The session that helps most is the
        one a person will still be doing next year.
      `,
    },
    {
      id: 'stroke-stretch',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const who = rng.pick(NAMES);
        const [h1, s1, h2, s2] = rng.pick([[72, 70, 60, 84], [80, 63, 70, 72], [84, 60, 72, 70], [70, 72, 63, 80], [72, 70, 63, 80], [80, 63, 60, 84]]);
        const out = h1 * s1;
        return {
          text: `
            Before starting to train, ${who}'s resting heart beat **${h1} times a
            minute**, pumping **${s1} mL** per beat. A year later the resting
            pulse is **${h2}**, and the body at rest still needs the same blood
            flow per minute.

            **How much blood does each beat pump now?**
          `,
          answer: s2,
          unit: 'mL per beat',
          wrong: [[s1, 'If each beat still pumped that much, fewer beats would deliver less blood than the body needs.'], [out / 1000, 'That is the blood per minute, in litres. Divide the millilitres per minute by the new pulse.']],
          hints: [`Before: $${h1} \\times ${s1} = ${out}$ mL a minute. That has not changed.`, `Now ${out} mL a minute is shared among ${h2} beats.`],
          explain: `The flow is unchanged: $${h1} \\times ${s1} = ${out}$ mL a minute. With ${h2} beats, each must pump $${out} \\div ${h2} = ${s2}$ mL. That is the answer to the opening question: a trained heart beats more slowly **because** each beat does more.`,
        };
      },
    },
    {
      id: 'try',
      type: 'choice',
      mode: 'predict',
      title: 'Something to notice',
      text: `
        Fitness shows up in small, ordinary signs long before any test.
        **Which of these would you be most curious to watch over the coming
        weeks?** There is no right answer.
      `,
      options: [
        { text: 'How soon my breathing settles after a flight of stairs' },
        { text: 'Whether a familiar walk starts to feel easier' },
        { text: 'My pulse on waking, now and again' },
        { text: 'Whether I can chat on a hill where I used to puff' },
      ],
      explain: `
        All four are real signals. How fast the pulse and the breathing come
        back down after effort is called **recovery**, and it speeds up with
        fitness. Numbers wander from day to day with sleep, heat, caffeine
        and illness, so a trend over weeks means more than any single
        reading.
      `,
    },
  ],
  recap: [
    'Effort raises the demand for oxygen. The heart answers with more beats and more blood per beat: **cardiac output = heart rate × stroke volume**.',
    'Training enlarges the stroke volume and adds capillaries and mitochondria. The same job then takes fewer beats, which is why a fit heart is slow at rest.',
    'Maximum heart rate falls with age (roughly 208 − 0.7 × age) and varies by 10 beats or more between people. How hard it feels and the talk test are reliable guides.',
    'Steady or in intervals, gentle or hard: all of it trains the system. The fuel mix of a session matters far less than doing it.',
  ],
  next: 'Next: muscles and bones answer to load too. Why do beginners get stronger weeks before their muscles grow?',
};
