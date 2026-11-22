// Movement and Fitness · Lesson 5 · Stress, Rest, Adapt
//
// Driving question: training leaves you weaker for a day or two. So when do you get fitter?
// Sources: physiology textbooks for the stress–recovery–adaptation model and delayed-onset muscle soreness;
// Cochrane 2011 (stretching and soreness); Dubois and Esculier, Br J Sports Med 2020 and current NHS advice
// for sprains (they differ, and the lesson says so); IOC consensus statement 2023 on relative energy
// deficiency in sport; NHS, American Heart Association and Red Cross for the warning signs.
import { PEOPLE, PAINS, PAIN_ANSWERS, RAMPS, DOMS } from '../helpers.js';
import { recover } from '../../../../src/widgets/training-sim.js';

const ONE = recover([1]);
const SPACED = recover([1, 4, 7, 10, 13, 16, 19]);
const DAILY = recover([12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
const WEEKLY = recover([1, 8, 15]);
const w = (v) => String(Math.round(v));

const SIM = { type: 'training-sim', mode: 'recovery', alt: 'A chart of physical capacity over three weeks, above a calendar of 21 days. Each chosen day has one hard training session.' };

const SORENESS = '10*(x/48)^3*exp(3*(1 - x/48))';
const LACTATE = '10*exp(-x/0.4)';

export default {
  id: 'training-recovery',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'When does it pay off?',
      text: `
        Straight after a hard training session, a careful test would find
        you **weaker and slower** than before it: tired muscles, used-up
        fuel.

        If you then simply get on with life, **when would the test find you
        at your best?**
      `,
      options: [
        { text: 'A few days later, after resting', correct: true },
        { text: 'Within the hour, while the muscles are still warm' },
        { text: 'Never: without more training it only gets worse' },
        { text: 'It makes no difference when' },
      ],
      explain: `
        A few days later. The session itself is only the signal. The
        building happens afterwards, while you eat, sleep and rest.

        The next screens use a simple model of this to ask a practical
        question: how far apart should hard sessions be?
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Three words for all of training',
      text: `
        The whole of training fits in three words: **stress, recovery,
        adaptation.**

        - The session is the **stress**. It uses up fuel and makes microscopic damage, so capacity dips.
        - **Recovery** refills and repairs. It needs sleep, food and time.
        - **Adaptation** is the repair overshooting a little, so the same session will be easier next time.

        The chart is a simple model of one hard session, in made-up
        units: a cartoon of the pattern, not a measurement. The next
        screen asks you to read it.
      `,
      figure: { ...SIM, days: [1], static: true, alt: 'A chart of physical capacity over three weeks after one hard session on day 1. Capacity dips below the dashed starting level, climbs back, rises a little above it and then slowly returns to it.' },
    },
    {
      id: 'one-session',
      type: 'fill',
      review: true,
      text: `
        The chart shows a model of what one hard training session does to
        physical capacity over the following three weeks. The session is at
        the start of day 1; the dashed line is the starting level.
      `,
      // note: false — the widget's own sentence ("a dip, then a peak of 105 about 3 days later, then the gain fades") would give three of the four blanks away
      figure: { ...SIM, days: [1], static: true, note: false },
      template: `
        Straight after the session, capacity is [[higher than|the same as|*lower than]] before it.
        It is back at the starting level after about [[*one day|five days|ten days]],
        and at its highest about [[one day|*three days|ten days]] after the session.
        With no further training, the gain then [[keeps growing|*slowly fades|stays for good]].
      `,
      explain: `
        Stress, then recovery, then a rebound **above** the starting level:
        here from ${w(ONE.low)} back through 100 to a peak of about ${w(ONE.peak)} on day ${Math.round(ONE.peakDay) + 1}.
        Coaches call the rebound **supercompensation**: the body prepares to
        meet the same stress a little better. If the stress never comes
        again, it stops bothering, and the gain fades.
      `,
    },
    {
      id: 'spacing',
      type: 'interact',
      attempts: 8,
      title: 'Three weeks to plan',
      text: `
        Now you place the sessions. **Tap days on the calendar** to add or
        remove a hard session, and watch the curve.

        **Find a plan that ends the three weeks with a capacity of 110 or
        more.**
      `,
      widget: { ...SIM, days: [] },
      check: (s) => {
        if (Math.round(s.end) >= 110) return true;
        if (!s.sessions) return 'Tap a day on the calendar to place the first session.';
        if (s.longestRun >= 3) return `Capacity ends at ${w(s.end)}. There are sessions on ${s.longestRun} days running: each one starts in the dip left by the last. Leave room to recover.`;
        if (s.sessions < 5) return `Capacity ends at ${w(s.end)}. With only ${s.sessions} session${s.sessions === 1 ? '' : 's'} in three weeks, most of each gain fades before the next. Train more often.`;
        return `Capacity ends at ${w(s.end)}. Aim to land each session near the top of the bounce from the one before, and leave a day or two after the last one.`;
      },
      solution: { days: [1, 4, 7, 10, 13, 16, 19] },
      hints: ['After one session the peak came about three days later.', 'Try a session every second or third day.'],
      explain: `
        A hard session every second or third day works well here: every
        third day ends at about ${w(SPACED.end)}. Each session lands while the body is
        still above its old level, so the gains stack up.

        Once a week is too rare in this model: capacity ends at about
        ${w(WEEKLY.end)}, because most of each gain has faded by the time the next
        session comes.
      `,
    },
    {
      id: 'too-much',
      type: 'interact',
      attempts: 8,
      title: 'More is not always more',
      text: `
        Someone decides that if training is good, more must be better.

        **Place at least ten hard sessions so that capacity ends no higher
        than 101**: three weeks of hard work for nothing.
      `,
      widget: { ...SIM, days: [1, 4, 7, 10, 13, 16, 19] },
      check: (s) => {
        if (s.sessions < 10) return `That is ${s.sessions} session${s.sessions === 1 ? '' : 's'}. The task asks for at least ten.`;
        if (Math.round(s.end) <= 101) return true;
        return `Ten or more sessions, and capacity still ends at ${w(s.end)}: somewhere in this plan there is enough rest to recover. Pack the sessions closer together.`;
      },
      solution: { days: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21] },
      hints: ['What happens when a session comes before the last one has been recovered from?'],
      explain: `
        Hard sessions on ten days running end at about ${w(DAILY.end)}, below the
        start. Each one arrives while the body is still in the dip, so
        fatigue piles up and nothing is gained.

        Two cautions about this model. It is about **hard** sessions: easy
        movement such as walking needs no such gap and can be done every
        day. And real bodies differ: beginners, older people and anyone
        short of sleep need longer, and tendons and bones adapt more slowly
        than muscles and the heart.
      `,
    },
    {
      id: 'teach-spacing',
      type: 'info',
      title: 'Fitness is built while you rest',
      text: `
        Your two plans in the model showed the rule that coaches work by:
        **hard sessions need room.**

        - Too close together, and each session starts in the dip left by the last. Fatigue piles up.
        - Too far apart, and each gain has faded before the next session comes.

        That is why plans alternate hard days with easy ones, and why a
        programme without rest days is a slower programme. A cool-down
        after exercise is a pleasant way to wind down; studies do not show
        that it prevents soreness or injury.
      `,
      figure: { ...SIM, days: [1, 4, 7, 10, 13, 16, 19], static: true, alt: `A chart of physical capacity over three weeks with a hard session every third day. Each session lands near the top of the rebound from the one before, and capacity climbs in steps to about ${w(SPACED.end)}.` },
    },
    {
      id: 'recovery-parts',
      type: 'multi',
      text: 'Which of these are real parts of recovery after hard training? **Choose all that apply.**',
      options: [
        { text: 'Sleep', correct: true },
        { text: 'Enough food, with carbohydrate to refill and protein to rebuild', correct: true },
        { text: 'Easy days between the hard ones', correct: true },
        { text: 'A painkiller before each session, so nothing hurts', why: 'Pain is information. Masking it hides the signals that prevent injury, and painkillers have risks of their own: a pharmacist can advise.' },
        { text: 'Another hard session for the same muscles while they are still very sore', why: 'That is training in the dip. The repair has not finished.' },
      ],
      explain: `
        Much of the repair work, and a large share of the day's release of
        growth hormone, happens during sleep, and under-eating slows every
        part of recovery. (Sleep and food have
        courses of their own in this path.)

        Hard training for months without enough rest or enough food can
        leave a person tired all the time, performing worse, often ill, low
        in mood and, in people who have periods, without them. Sports
        doctors call the under-fuelled form *relative energy deficiency in
        sport*. It is a health problem to take to a doctor, not a weakness
        to push through.
      `,
    },
    {
      id: 'soreness',
      type: 'info',
      title: 'The day after the day after',
      text: `
        You try a new activity: a long downhill hike, or a first session of
        squats. The next morning your legs are stiff. The morning after
        that, stairs are a challenge.

        This is **delayed-onset muscle soreness**. Its cause is microscopic
        damage: tiny tears and disruption inside muscle fibres, followed
        by inflammation and repair. It follows unfamiliar work, especially
        when muscles lengthen under load: walking downhill, lowering a
        weight.

        Lactic acid is the famous suspect, and it has an alibi. Read it
        off the next chart.
      `,
    },
    {
      id: 'soreness-curve',
      type: 'fill',
      review: true,
      text: `
        The typical course of two things after one hard, unfamiliar
        session: the extra [lactate]{.orange} in the blood, and how
        [sore]{.blue} the muscles feel. **Move the slider through the
        hours** and read the two curves.
      `,
      figure: {
        type: 'plot', height: 300, x: [0, 144], y: [0, 11], xStep: 24, yStep: 2, xLabel: 'hours after the session', yLabel: 'level',
        params: { t: { min: 0, max: 144, step: 1, value: 0, label: 'hours after the session', color: 'gray' } },
        fns: [{ expr: LACTATE, color: 'orange' }, { expr: SORENESS, color: 'blue' }],
        vlines: [{ x: 't', dashed: true }],
        points: [{ x: 't', on: 0, color: 'orange', r: 6 }, { x: 't', on: 1, color: 'blue', r: 6 }],
        labels: [{ x: 5, y: 9.6, text: 'extra lactate', color: 'orange' }, { x: 62, y: 9.6, text: 'soreness', color: 'blue' }],
        readouts: [
          { label: 'extra lactate', expr: 'f0(t)', digits: 1, color: 'orange' },
          { label: 'soreness', expr: 'f1(t)', digits: 1, color: 'blue' },
        ],
        alt: 'Two curves over six days after a hard session. Extra lactate in the blood starts high and is gone within about an hour. Muscle soreness starts at zero, rises through the first day, peaks at about 48 hours and fades over the following days.',
      },
      template: `
        One hour after the session, the extra lactate is [[at its peak|still rising|*almost gone]].
        Soreness is at its worst about [[2|12|*48]] hours after the session.
        So leftover lactate [[must|*cannot]] be what makes muscles sore two days later.
      `,
      explain: `
        Lactate is back to its resting level within about an hour, and the
        body burns it as fuel. Soreness typically peaks ${DOMS.peakHours[0]} to ${DOMS.peakHours[1]} hours
        after the session and is gone within a week. The two never overlap.

        The soreness is harmless and it protects: after one bout, the same
        activity hurts far less the next time. Gentle movement eases it.
        Stretching does not prevent it. (Extreme muscle pain with swelling
        or dark, cola-coloured urine is something else, and needs medical
        help the same day.)
      `,
    },
    {
      id: 'teach-pains',
      type: 'info',
      tone: 'sober',
      title: 'Three kinds of pain',
      text: `
        Not every pain after exercise means the same thing. Three patterns
        call for three different things.

        - **A dull ache in the muscles that did the work**, usually on both sides, a day or two after something new, easing with movement. ${PAIN_ANSWERS.sore}.
        - **Pain that is sudden, sharp, one-sided, in a joint, swollen or worse each time.** ${PAIN_ANSWERS.stop}.
        - **Chest pain or pressure, fainting, confusion, sudden weakness or trouble speaking, breathlessness that does not settle, or someone hot and confused in the heat.** ${PAIN_ANSWERS.emergency}.
      `,
    },
    {
      id: 'pain-sort',
      type: 'choice',
      review: true,
      tone: 'sober',
      shuffle: false,
      gen: (rng) => {
        const item = rng.pick(PAINS);
        const kinds = ['sore', 'stop', 'emergency'];
        const why = (said) => {
          if (item.kind === 'emergency') return 'These are warning signs of a life-threatening problem. They need help now, not rest.';
          if (item.kind === 'sore') {
            return said === 'emergency'
              ? 'Nothing here points to an emergency: it is a dull ache in muscles that worked hard, a day or two after something new.'
              : 'This has the pattern of ordinary soreness: a dull ache in the muscles that did the work, a day or two after something new. It needs no treatment.';
          }
          return said === 'emergency'
            ? 'This needs rest and perhaps an examination, but nothing here threatens life. An emergency involves the chest, the breathing, the brain or collapse.'
            : 'Ordinary soreness is a dull ache in worked muscles that comes on a day or two later and eases with movement. This is sharp, or in one spot, or in a joint, or getting worse.';
        };
        return {
          text: `
            Not every pain after exercise means the same thing. Decide what
            this one calls for.

            > ${item.text}
          `,
          options: kinds.map((k) => ({ text: PAIN_ANSWERS[k], correct: k === item.kind, why: k === item.kind ? undefined : why(k) })),
          explain: item.kind === 'sore'
            ? 'A dull ache in the muscles that did the work, a day or two after something unfamiliar, easing with movement: delayed-onset muscle soreness. It fades within a few days and needs no treatment.'
            : item.kind === 'stop'
              ? `Sudden, sharp, one-sided, in a joint, or worse each time: that is not training soreness. This pattern suggests ${item.what}. Stop the activity and rest it. If you cannot put weight on it, if it looks misshapen or is numb, or if it is not clearly improving within a few days, have it examined.`
              : `This is ${item.what}. **Stop and call your emergency number now.** Chest pain or pressure, fainting, confusion, sudden weakness or trouble speaking, and severe breathlessness that does not settle are never things to "walk off".`,
        };
      },
    },
    {
      id: 'example-ramp',
      type: 'info',
      title: 'Too much, too soon',
      text: `
        Most training injuries are not accidents. They come from doing
        **too much, too soon**: the load rises faster than the body adapts.
        Tendons and bones adapt over months, not weeks.

        The size of a jump is measured as a percentage of the **old**
        load.

        :::example From 16 km a week to 20 km
        1. The increase: 20 − 16 = 4 km.
        2. As a share of the old load: 4 ÷ 16 = 0.25.
        3. As a percentage: 0.25 × 100 = **25%**.
        :::
      `,
      figure: {
        type: 'bars', yMax: 24, yStep: 4, yLabel: 'km a week',
        data: [
          { label: 'A usual week', value: 16, color: 'gray' },
          { label: 'This week', value: 20, color: 'orange' },
        ],
        alt: 'Bar chart of an example runner\'s weekly distance. A usual week: 16 km. This week: 20 km, a quarter more.',
      },
    },
    {
      id: 'ramp',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const [from, to] = rng.pick(RAMPS);
        const [doing, unit] = rng.pick([['ran', 'km'], ['cycled', 'km'], ['swam', 'lengths']]);
        const wanted = unit === 'km' && doing === 'cycled' ? 4 : unit === 'lengths' ? 2 : 1;
        // with a new load of exactly 100, "the increase" and "the increase as a share of the new load" are the same number: avoid it
        const scale = to * wanted === 100 ? 1 : wanted;
        const a = from * scale;
        const b = to * scale;
        const pct = ((to - from) / from) * 100;
        return {
          text: `
            Most training injuries are not accidents. They come from doing
            **too much, too soon**: the load rises faster than the body
            adapts.

            For months ${who} ${doing} about **${a} ${unit} a week**. This week it was
            **${b} ${unit}**. **By what percentage did the weekly load jump?**
          `,
          answer: pct,
          unit: '%',
          wrong: [
            [b - a, `That is the increase in ${unit}. As a percentage it is measured against the old ${a}.`],
            [((to - from) / to) * 100, `Measure the jump against the old load, ${a}, not the new one.`],
          ].filter((x) => Math.abs(x[0] - pct) > 1.01),
          tolerance: 0.5,
          hints: [`The increase is $${b} - ${a} = ${b - a}$ ${unit}.`, `Divide by the old load: $${b - a} \\div ${a}$.`],
          explain: `$\\frac{${b} - ${a}}{${a}} = \\frac{${b - a}}{${a}} = ${Math.round(pct)}\\%$. ${pct >= 50 ? 'A jump of this size is the classic route to an overuse injury.' : pct <= 10 ? 'A small step like this is how loads are usually built up.' : 'That is a sizeable step for one week.'} A popular rule says "never more than 10% a week"; a trial that tested it found no fewer injuries, so the number is not magic. What studies do agree on is that sudden large jumps go with more injuries, because tendons and bones adapt over months, not weeks.`,
        };
      },
    },
    {
      id: 'sprain',
      type: 'choice',
      title: 'A twisted ankle',
      text: `
        An ankle is twisted on a walk. It is sore and a little swollen, but
        it takes weight and looks the right shape. For decades the advice
        was "RICE": rest, ice, compression, elevation.

        Sports-medicine advice has since moved. It is now to **protect**
        the joint for the first few days and then to **load it gently**
        and progressively, guided by pain. Ice may ease pain but has not
        been shown to speed healing.

        **Which part of RICE has changed most?**
      `,
      options: [
        { text: 'Rest: protect it for the first days, then start gentle movement as pain allows', correct: true },
        { text: 'Rest: it should now be kept completely still for three weeks', why: 'The move has been the other way. Long immobility weakens the tissue; early gentle loading helps it heal.' },
        { text: 'Ice: it should now be applied for hours at a time', why: 'Ice is now recommended less, not more. It can ease pain, but it has not been shown to speed healing.' },
        { text: 'Nothing has changed', why: 'Sports-medicine advice has moved towards protection followed by early movement, though not every health service words it the same way.' },
      ],
      explain: `
        Long immobility weakens the tissue, and early gentle loading helps
        it heal. Even the doctor who coined RICE withdrew his support
        for long rest and routine icing. Many health services still teach
        RICE or a version of it, so advice differs, and the evidence on
        ice is thin either way.

        An injury that cannot take weight, looks misshapen, is numb or is
        not improving needs to be examined. The First Aid course in this
        path covers first care.
      `,
    },
    {
      id: 'heat',
      type: 'multi',
      tone: 'sober',
      text: `
        A long outdoor event on a hot, humid day. Working muscles make
        heat, and in such weather the body struggles to lose it. Sweat
        has to be replaced, but drinking far beyond thirst can dilute the
        salt in the blood, which is dangerous.

        Which of these are sound? **Choose all that apply.**
      `,
      options: [
        { text: 'Slow down, and use shade and breaks', correct: true },
        { text: 'Carry water and drink regularly', correct: true },
        { text: 'Treat confusion or collapse in the heat as an emergency', correct: true },
        { text: 'Drink as much water as you can hold, thirsty or not', why: 'Drinking far beyond thirst during long events can dilute the salt in the blood, which is dangerous. For healthy adults thirst is a fair guide; older people and small children feel it less and may need reminding.' },
        { text: 'Keep going through dizziness: it passes', why: 'Dizziness in the heat is a signal to stop, cool down and drink.' },
      ],
      explain: `
        Slowing down makes less heat, and that is the main protection.
        Dizziness is the body's signal to stop, cool down and drink.
        **Someone who is hot and confused, or who collapses, may have
        heatstroke: call the emergency number and cool them fast.** The
        First Aid course explains how.
      `,
    },
    {
      id: 'try',
      type: 'choice',
      mode: 'predict',
      title: 'Something to notice',
      text: `
        Recovery is the half of training that nobody sees. **Which of these
        are you most curious to notice after your next active day?** There
        is no right answer.
      `,
      options: [
        { text: 'How I feel one day later, and two days later' },
        { text: 'Whether a second go at the same activity leaves me less sore' },
        { text: 'How a short night changes how the same effort feels' },
        { text: 'Whether an easy walk loosens stiff legs' },
      ],
      explain: `
        All four are the body showing its recovery curve. Noticing it is
        the first step to planning around it: hard when you are fresh,
        easy when you are not, and patient with the dip in between.
      `,
    },
  ],
  recap: [
    'Training is **stress → recovery → adaptation**. The session is the signal; the fitness is built afterwards, with sleep, food and time.',
    'Hard sessions need room: too close together and each starts in the dip of the last, too far apart and the gain fades. Easy movement can be daily.',
    `Next-day soreness comes from microscopic damage and repair, peaking after ${DOMS.peakHours[0]} to ${DOMS.peakHours[1]} hours. It is not caused by lactic acid, which is gone within the hour.`,
    'Most injuries come from too much, too soon. Sharp, sudden, one-sided or joint pain means stop. Chest pain, collapse, confusion or sudden weakness means call the emergency number.',
  ],
  next: 'Next: you now know what to do. Why is that the easy part, and what makes a routine survive a busy week?',
};
