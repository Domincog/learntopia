// Sleep, Stress and Mental Health · Lesson 2 · Your Inner Clock
// Driving question: how does your body know what time it is, and what keeps a clock that is not exactly 24 hours long on time?
import { CLOCK, JET, FLIGHTS, SEATTLE, DAY_CURVES, clock, hoursText, daysText, pic } from '../helpers.js';

const DIAL_ALT = 'A round 24-hour dial. The outer ring shows local day and night. An inner ring shows the body clock: a band for the body\'s night and a marker for its low point.';
// The path of the reset signal: from the eye to the master clock. (The teaching screen names the path only;
// which signal travels along it is the question that follows.)
const head = (flowLabel) => ({
  type: 'body-map', view: 'head', show: ['brain', 'cerebrum', 'cerebellum', 'brainstem', 'eye', 'hypothalamus', 'skull'], static: true, zoom: false,
  labels: [{ id: 'hypothalamus', text: 'Master clock (in the hypothalamus)' }, { id: 'eye', text: 'Eye' }],
  flows: [{ path: ['eye', 'hypothalamus'], color: 'orange', label: flowLabel, dashed: true }],
  alt: 'A head seen from the side, cut open: a dashed arrow runs from the eye back to the hypothalamus, a small region deep in the middle of the brain, where the master clock sits.',
});

// The daily curves, for a body clock shifted c hours later than the middling one.
const curves = (extra = {}) => ({
  type: 'plot', height: 330, x: [0, 24], y: [0, 1.22], xStep: 3, tickLabels: 'x', grid: true,
  xLabel: 'time of day',
  xFormat: (v) => `${String(v % 24).padStart(2, '0')}`,
  params: { c: { min: -2, max: 3, step: 0.5, value: 0, label: 'body clock runs later by', unit: 'h', color: 'violet' } },
  fns: [
    { expr: DAY_CURVES.temperature, color: 'orange' },
    { expr: DAY_CURVES.melatonin, color: 'violet' },
    { expr: DAY_CURVES.cortisol, color: 'teal' },
  ],
  labels: [
    { x: 'c + 16.5', y: 0.96, text: 'body temperature', color: 'orange', anchor: 'middle' },
    { x: 'c + 3.4', y: 1.04, text: 'melatonin', color: 'violet', anchor: 'middle' },
    { x: 'c + 9.6', y: 1.0, text: 'cortisol', color: 'teal', anchor: 'middle' },
  ],
  ...extra,
});

export default {
  id: 'body-clock',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A plant in a cupboard',
      text: `
        The leaves of the mimosa plant spread open by day and fold shut at
        night. In 1729 the French scientist Jean-Jacques de Mairan shut one
        in a **dark cupboard** and peeked in from time to time.

        **What do you think its leaves did?**
      `,
      figure: pic('mimosa', {
        alt: 'A close view of a mimosa plant: feathery green leaves, each with two neat rows of many small narrow leaflets along a thin stalk.',
        caption: '*Mimosa pudica*: its leaflets spread by day and fold at night',
      }),
      columns: 1,
      options: [
        { text: 'Stayed folded: with no light there is no day' },
        { text: 'Stayed open, waiting for the light to return' },
        { text: 'Kept opening and folding on about the same daily schedule', correct: true },
      ],
      explain: 'They kept time in the dark. The rhythm does not simply follow the sun: the plant carries a **clock of its own**. So do you, and so does nearly every living thing that has been tested.',
    },
    {
      id: 'cave',
      type: 'interact',
      graded: false,
      title: 'No sun, no clocks',
      text: `
        Sana volunteers for a sleep study. She will live for two weeks in
        rooms with **no windows, clocks or screens**, sleeping whenever she
        feels like it.

        The inner ring is her body clock. **Press "Next day" ten times** and
        watch her night against the night outside.
      `,
      widget: { type: 'body-clock', cave: true, drift: CLOCK.driftPerDay, maxDays: 14, alt: `${DIAL_ALT} Here the person has no time cues, and the body ring can be stepped forward day by day.` },
      check: (s) => s.days >= 10 || `That is ${daysText(s.days)}. Keep pressing "Next day" until ten days have passed.`,
      solution: { days: 10 },
      explain: `
        Her rhythm carries on with nothing to guide it, so the clock is
        inside her. But it runs slow: in careful experiments the human body
        clock averages about **24.2 hours**, so her days slide about 12
        minutes later each day, **two hours** in ten days. (Each day is
        0.2 hours too long, which is 12 minutes, and 10 × 0.2 = 2.)

        Hence the name **circadian** rhythm, from the Latin for "about a
        day". Something must set this clock right every single day.
      `,
    },
    {
      id: 'drift',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(['Sana', 'Jonas', 'Mirembe', 'Tariq', 'Aiko']);
        const tenths = rng.pick([1, 2, 3, 5]);
        const days = rng.pick([5, 10, 20]);
        const drift = (tenths * days) / 10;
        const minutes = tenths * 6;
        return {
          text: `
            Body clocks differ a little from person to person. ${who}'s runs a
            day of **24.${tenths} hours**.

            ${who} spends **${days} days** in a study with no daylight, clocks
            or screens. By the end, **how many hours later than at the start
            does the body clock run**, measured against the world outside?
          `,
          answer: drift,
          unit: 'hours',
          wrong: [
            [tenths / 10, `That is the drift in one day. It builds up over ${days} days.`],
            [minutes * days, 'That is the drift in minutes. The question asks for hours.'],
          ],
          hints: [`Each day is 24.${tenths} − 24 = 0.${tenths} hours too long.`, `0.${tenths} hours a day for ${days} days.`],
          explain: `Each day the clock falls 0.${tenths} hours (${minutes} minutes) further behind the outside world. After ${days} days that is ${days} × 0.${tenths} = **${drift}** ${drift === 1 ? 'hour' : 'hours'}. With no daily reset, even a small error adds up.`,
        };
      },
    },
    {
      id: 'teach-master-clock',
      type: 'info',
      title: 'Where the clock sits',
      text: `
        In ordinary life the body clock does not slide: every day,
        something from the outside world sets it right.

        The clock that is set is the **master clock**: a cluster of about
        ${CLOCK.scnNeurons.toLocaleString('en-US')} nerve cells deep in the brain, in the **hypothalamus**,
        just above the place where the two optic nerves cross.

        It has a line to the eyes. Special cells in the retina, which are
        not used for seeing pictures, report to it how bright the world
        is.
      `,
      figure: head('The nerve path from the eye to the master clock'),
    },
    {
      id: 'reset-signal',
      type: 'choice',
      title: 'The daily reset',
      text: `
        Each day a signal from the outside world sets the master clock
        right. Think of where the clock sits, and what reports to it.

        **Which signal is the main one?**
      `,
      options: [
        { text: 'Light reaching the eyes', correct: true },
        { text: 'The temperature of the air', why: 'Temperature has little hold on the human master clock, which keeps the same time through hot days and cold ones.' },
        { text: 'Mealtimes', why: 'Meals can nudge the clocks of organs such as the liver, but the master clock in the brain takes its time mainly from light.' },
        { text: 'The sound of an alarm', why: 'An alarm wakes you. It does not move the clock that decides when you feel sleepy the next night.' },
      ],
      explain: `
        **Light.** The master clock sits on the path from the eyes, and
        the brightness they report sets it right every day.

        Almost every cell of the body keeps its own clock as well. The
        master clock keeps them together, like a conductor.
      `,
    },
    {
      id: 'light-shift',
      type: 'interact',
      title: 'Which way does light push?',
      text: `
        Sana is home again. The mark on the inner ring is her **low point**,
        around 04:30, when body temperature and alertness are lowest.

        **Drag the yellow block of bright light** around the dial. Find a
        time when it moves her clock **later**, and a time when it moves it
        **earlier**.
      `,
      widget: { type: 'body-clock', offset: 0, light: 15, alt: `${DIAL_ALT} A yellow block of bright light can be dragged around the outer ring.` },
      check: (s) => {
        if (s.previewed.later && s.previewed.earlier) return true;
        if (s.previewed.later) return 'You have found light that makes the clock later. Now try the hours after the low point: early morning.';
        if (s.previewed.earlier) return 'You have found light that makes the clock earlier. Now try the hours before the low point: evening and night.';
        return 'Drag the yellow block right round the dial and read the line underneath.';
      },
      solution: { light: 7, previewed: { later: true, earlier: true } },
      hints: ['Try the block at 22:00, and then at 07:00.'],
      explain: `
        The same light does opposite things at different times of the
        body's day. The next screen puts that into a rule.

        This dial is a simple model. It ignores ordinary daylight, which
        normally does both jobs and holds the clock steady.
      `,
    },
    {
      id: 'teach-light-rule',
      type: 'info',
      title: 'The rule of the low point',
      text: `
        What you found on the dial is the rule by which light sets the
        clock:

        - Light **before** the low point, in the body's evening and night,
          tells the clock "the day is not over" and pushes it
          [**later**]{.orange}.
        - Light **after** the low point, in the body's morning, tells it
          "the day has begun" and pulls it [**earlier**]{.teal}.
        - In the body's afternoon, light hardly moves it.

        Darkness sends a signal too. As it falls, the pineal gland in the
        brain releases **melatonin**, which tells the whole body that
        night has come. Bright light late in the evening holds melatonin
        back.
      `,
      figure: { type: 'body-clock', offset: 0, light: false, zones: true, static: true, alt: `${DIAL_ALT} The nine hours before the low point at 04:30 are marked in orange, where light moves the clock later, and the nine hours after it in teal, where light moves it earlier.` },
    },
    {
      id: 'light-rule',
      type: 'fill',
      review: true,
      text: 'Complete the rule for how light sets the body clock. (The **low point** is the moment in the late night when body temperature is lowest.)',
      figure: head('Light signal from the eye to the master clock'),
      template: 'Bright light in the hours **before** the body\'s low point moves the clock [[earlier|*later]]. Bright light in the hours **after** it moves the clock [[*earlier|later]]. In darkness a gland in the brain releases [[adrenaline|insulin|*melatonin]], the body\'s signal that it is night.',
      explain: `
        Evening light delays the clock; morning light advances it. As
        darkness falls, the pineal gland releases **melatonin**, which tells
        the whole body that night has come. Bright light late in the evening
        holds melatonin back.
      `,
    },
    {
      id: 'curves',
      type: 'fill',
      title: 'A day in three curves',
      text: `
        The clock sets daily waves in the body. These curves show three of
        them, each from its lowest level to its highest, for a person who sleeps from about 23:00 to 07:00. (Leave the slider
        where it is for now.)
      `,
      figure: curves({ alt: 'Three curves over 24 hours. Body temperature is lowest near 04:30 and highest in the late afternoon. Melatonin is high from late evening to early morning. Cortisol peaks at about 08:00. A slider can shift all three later or earlier.' }),
      template: 'Body temperature is lowest at about [[16:30|*04:30|12:00]]. Melatonin is high [[all day|in the afternoon|*during the night]]. Cortisol, a hormone that helps to launch the day, peaks [[*soon after waking|at bedtime|at midnight]].',
      explain: `
        Temperature and alertness bottom out in the last hours of the night
        and peak in the late afternoon or early evening. Melatonin rises a couple of hours
        before the usual bedtime. Cortisol climbs before dawn and peaks
        within an hour of waking. Lesson 4 meets cortisol again as a stress
        hormone.
      `,
    },
    {
      id: 'school',
      type: 'choice',
      title: 'Larks, owls and teenagers',
      text: `
        People's clocks are set differently: **larks** run early and
        **owls** late, partly because of their genes. In the teenage years
        nearly everyone's clock moves later, by as much as two hours.

        **Move the slider to 2 h later.** For this teenager, what is a
        06:30 alarm for school like?
      `,
      figure: curves({ vlines: [{ x: 6.5, color: 'red', dashed: true }], labels: [
        { x: 'c + 16.5', y: 0.96, text: 'body temperature', color: 'orange', anchor: 'middle' },
        { x: 'c + 3.4', y: 1.04, text: 'melatonin', color: 'violet', anchor: 'middle' },
        { x: 'c + 9.6', y: 1.0, text: 'cortisol', color: 'teal', anchor: 'middle' },
        { x: 6.7, y: 1.16, text: '06:30 alarm', color: 'red' },
      ], alt: 'The three daily curves with a dashed line at 06:30. A slider shifts the curves later. With the curves two hours later, the dashed line falls at the lowest point of body temperature, while melatonin is still high.' }),
      columns: 1,
      options: [
        { text: 'Like being woken at the low point of the night, with melatonin still high', correct: true },
        { text: 'No different: a body clock follows the alarm clock', why: 'The body clock is set by light and by age, not by the alarm. Slide it later and the curves move; the dashed line stays put.' },
        { text: 'Easier, because the cortisol peak now comes before the alarm', why: 'The other way round. Shifted two hours later, the cortisol peak comes at about 10:00, long after the alarm.' },
      ],
      explain: `
        With the clock two hours later, the low point lands at 06:30: for
        this body it is still deep night. That is biology, not laziness.

        When Seattle moved the start of high school from ${SEATTLE.before} to
        ${SEATTLE.after}, students slept **${SEATTLE.gained} minutes longer** a
        night: bedtimes hardly changed. Paediatricians recommend that
        teenagers' schools start no earlier than ${SEATTLE.aapEarliest}.
      `,
    },
    {
      id: 'teach-jet-lag',
      type: 'info',
      title: 'A clock left behind',
      text: `
        An aeroplane crosses time zones in hours. The body clock cannot
        follow: it stays on home time and moves only an hour or so a day.
        Until it has caught up, a traveller is sleepy, hungry and alert at
        the wrong times. That mismatch is **jet lag**.

        Fly **east**, and the local clocks are **ahead** of the body.
        Fly **west**, and they are **behind** it.

        :::example What time is it for the body?
        Ama flies east to a city where the clocks are 4 hours ahead. At
        08:00 on her first morning there, her body clock is still on home
        time, 4 hours earlier: it shows **04:00**, close to the low point
        of her night.
        :::
      `,
      figure: { type: 'body-clock', offset: 4, light: false, static: true, alt: `${DIAL_ALT} Here the body ring is turned four hours behind local time, so the body's night lasts until late in the local morning and its low point falls at 08:30.` },
    },
    {
      id: 'body-time',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const f = rng.pick(FLIGHTS);
        const east = f.ahead > 0;
        const n = Math.abs(f.ahead);
        const local = rng.pick(east ? [7, 8, 9, 10] : [18, 19, 20, 21, 22]);
        const body = (((local - f.ahead) % 24) + 24) % 24;
        const other = (((local + f.ahead) % 24) + 24) % 24;
        return {
          text: `
            ${f.who} flies from ${f.from} to ${f.to}, where the clocks are
            **${n} hours ${east ? 'ahead' : 'behind'}**. On the first
            ${east ? 'morning' : 'evening'} there, the local time is
            **${clock(local)}**.

            ${f.who}'s body clock has not moved yet. **What hour does it
            show?** (Use the 24-hour clock: for 23:00 type 23.)
          `,
          answer: body,
          unit: ':00',
          wrong: [[other, `${f.to} is ${n} hours ${east ? 'ahead of' : 'behind'} ${f.from}, so the body clock, still on ${f.from} time, is ${n} hours ${east ? 'behind' : 'ahead of'} the local clocks.`]],
          hints: [`The body clock is still on ${f.from} time.`, `${f.from} time is ${n} hours ${east ? 'earlier' : 'later'} than the time in ${f.to}.`],
          explain: `${f.from} is ${n} hours ${east ? 'behind' : 'ahead'}, so at ${clock(local)} in ${f.to} the body clock shows **${clock(body)}**. ${f.who}'s body is still living ${n} hours ${east ? 'behind' : 'ahead of'} the local day: sleepy, hungry and alert at the wrong times. That mismatch is **jet lag**.`,
        };
      },
    },
    {
      id: 'jet-east',
      type: 'interact',
      attempts: 6,
      title: 'Six zones east',
      text: `
        Camille has flown from New York to Paris. Her body clock is **6
        hours behind** local time, so her low point now falls at 10:30.
        Light in the [orange]{.orange} zone moves her clock later, in the
        [teal]{.teal} zone earlier.

        **Place the light, then press "Next day".** Get her clock within
        half an hour of local time in **7 days or fewer**. You may move the
        light on any day.
      `,
      widget: { type: 'body-clock', offset: 6, light: 8, zones: true, maxDays: 10, alt: `${DIAL_ALT} The body ring is turned six hours behind local time. A block of light can be dragged round the outer ring, and the days stepped forward.` },
      check: (s) => {
        if (s.aligned && s.days <= 7) return true;
        if (s.aligned) return `Her clock is in step, but it took ${s.days} days. Press "Start again" and keep the light a few hours after her low point as the low point moves.`;
        if (s.days === 0) return 'Place the light, then press "Next day" to see where her clock has moved.';
        if (s.offset < 0) return `Her clock has been pulled too far: it is now ${hoursText(Math.round(-s.offset * 10) / 10)} ahead of local time. Press "Start again", and stop as soon as the two clocks agree.`;
        if (s.offset > 6) return `Her clock has moved the wrong way: it is now ${hoursText(Math.round(s.offset * 10) / 10)} behind. Light before her low point pushes the clock later. Press "Start again".`;
        if (s.days >= 7) return `After ${s.days} days she is still ${hoursText(Math.round(s.offset * 10) / 10)} behind. Press "Start again", and keep the light in the teal zone, a few hours after her low point.`;
        return `Day ${s.days + 1}: she is ${hoursText(Math.round(s.offset * 10) / 10)} behind. Keep going.`;
      },
      solution: { offset: 0.3, days: 6, light: 9 },
      hints: [
        'Morning light at 08:00 sounds right, but look where it falls on HER clock: before her low point.',
        'Start with the light in the early afternoon. As her low point moves earlier each day, you can move the light earlier too.',
      ],
      explain: `
        The trap is the first morning. Paris sunshine at 08:00 hits her body
        at 02:00, before the low point, and pushes her clock the wrong way.
        Light a few hours **after** the low point pulls it earlier, by an
        hour a day at best: about **six days for six zones**.

        Flying west is easier. The clock must move later, which bodies do
        faster, and which is the way they drift anyway.
      `,
    },
    {
      id: 'jet-days',
      type: 'numeric',
      gen: (rng) => {
        const f = rng.pick(FLIGHTS.filter((x) => x.ahead > 0 || (-x.ahead / JET.westPerDay) % 1 === 0));
        const east = f.ahead > 0;
        const n = Math.abs(f.ahead);
        const rate = east ? JET.eastPerDay : JET.westPerDay;
        const days = n / rate;
        const otherDays = n / (east ? JET.westPerDay : JET.eastPerDay);
        return {
          text: `
            A rule of thumb for travellers: the body clock can move about
            **1 hour a day** after a flight east and about **1½ hours a day**
            after a flight west. (Clocks that are ahead mean a flight east,
            so 4 hours ahead would take about 4 ÷ 1 = 4 days.)

            ${f.who} flies from ${f.from} to ${f.to}, where the clocks are
            **${n} hours ${east ? 'ahead' : 'behind'}**. **About how many days
            until the body clock has caught up?**
          `,
          answer: days,
          unit: 'days',
          wrong: [[otherDays, `That uses the rate for a flight ${east ? 'west' : 'east'}. Clocks that are ${east ? 'ahead' : 'behind'} mean ${f.who} flew ${east ? 'east' : 'west'}.`]],
          hints: [`Clocks that are ${east ? 'ahead' : 'behind'} mean a flight ${east ? 'east' : 'west'}: about ${east ? '1 hour' : '1½ hours'} a day.`],
          explain: `${f.to} is ${east ? 'east' : 'west'} of ${f.from}, so the clock moves about ${east ? '1 hour' : '1½ hours'} a day: ${n} ÷ ${rate} = **${days}** days. ${east ? 'The same distance westward would take less time.' : `The same trip eastward would take about ${daysText(n)}.`} People differ, and daylight at the right times helps.`,
        };
      },
    },
    {
      id: 'teach-shift-work',
      type: 'info',
      title: 'Jet lag without a flight',
      text: `
        Millions of people work at night, and live in a kind of permanent
        jet lag. Daylight on the way home and on days off keeps pulling
        the clock back, so most night workers stay half-adjusted, however
        long they do it.

        **Well documented.** Years of night work go with more sleep
        problems, accidents, type 2 diabetes and heart disease.

        **Much less certain.** In 2019 the World Health Organization's
        cancer agency rated night shift work as "probably"
        cancer-causing. The human evidence is limited, and researchers
        disagree about the size of any risk.
      `,
    },
    {
      id: 'shift-work',
      type: 'multi',
      title: 'Working against the clock',
      text: 'Millions of people work at night. **Which of these statements does the evidence support?**',
      options: [
        { text: 'Most night workers\' body clocks never fully switch to a night schedule', correct: true },
        { text: 'Years of night work go with more sleep problems, accidents, type 2 diabetes and heart disease', correct: true },
        { text: 'After a week of nights, the body treats night as day', why: 'Daylight on the way home and on days off keeps pulling the clock back, so most night workers stay half-adjusted.' },
        { text: 'Night work has been proved to cause cancer', why: 'The World Health Organization\'s cancer agency rated night shift work as "probably" cancer-causing in 2019. The human evidence is limited, and researchers disagree about the size of any risk.' },
      ],
      explain: `
        The health costs are well documented; a cancer risk is not proved.
        Night workers do work that everyone depends on, so good shift
        design, lighting and health checks matter.

        A small version reaches whole countries when the clocks change:
        in the days after they spring forward, studies find slightly more
        road accidents and heart attacks.
      `,
    },
    {
      id: 'sort',
      type: 'bucket',
      review: true,
      text: 'What does each of these do to a person\'s **body clock**? (The person normally sleeps from 23:00 to 07:00.)',
      buckets: ['Moves it later', 'Moves it earlier', 'Hardly moves it'],
      items: [
        { text: 'Bright light in the last hours before bed', bucket: 0 },
        { text: 'Weeks with no daylight or clocks at all', bucket: 0, why: 'Left alone, the human clock runs a little longer than 24 hours, so it drifts later.' },
        { text: 'Daylight in the first hours after waking', bucket: 1 },
        { text: 'A week of camping with no electric light', bucket: 1, why: 'In a well-known experiment, a week of sunrise, sunset and campfire moved campers\' clocks about two hours earlier.' },
        { text: 'Bright light in the middle of the afternoon', bucket: 2, why: 'In the body\'s afternoon the clock hardly responds to light.' },
        { text: 'Setting a second alarm', bucket: 2, why: 'An alarm changes when you get up, not what time your body thinks it is.' },
      ],
      explain: 'Light late in the body\'s day delays the clock, light early in its day advances it, and with no cues at all it drifts later. The clock listens to light, not to alarms.',
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to try',
      text: `
        If it suits you, try this for a few days: **get into daylight in the
        first hour or two after you wake**. A walk, a window seat or
        breakfast outdoors all count. Even an overcast sky is many times
        brighter than a lit room.

        Notice whether evenings feel any different after a week.

        :::note
        Larks and owls are both normal. So is the late clock of the teenage
        years, which drifts earlier again in the twenties.
        :::
      `,
    },
  ],
  recap: [
    'Your body keeps its own **circadian** clock, which runs a little longer than 24 hours and would drift later without a daily reset.',
    'The reset is **light**: before the body\'s low point (evening, night) it moves the clock later; after it (morning) it moves the clock earlier.',
    'The clock sets daily waves of temperature, melatonin and cortisol. Larks, owls and the late clocks of teenagers are biology.',
    '**Jet lag** and shift work are a body clock out of step with the world: about a day per time zone to recover, and east is harder than west.',
  ],
  next: 'Next: the clock is only half the story. What else decides when you feel sleepy, and what really helps you sleep?',
};
