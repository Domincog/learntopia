// Movement and Fitness · Lesson 1 · The Nearest Thing to a Wonder Drug
//
// Driving question: how much movement does it take to make a difference, and where is the biggest gain?
// Sources: WHO guidelines on physical activity and sedentary behaviour (2020); Arem et al., JAMA Intern Med
// 2015; Morris et al., Lancet 1953; Ekelund et al., Lancet 2016; Ding et al., Lancet Public Health 2025;
// CDC "Measuring physical activity intensity". The numbers live in ../helpers.js.
import { WHO, DOSE, DOSE_EXPR, doseRisk, STEPS, BUS_STUDY, ACTIVITIES, LEVELS, TALK, PEOPLE, INACTIVITY, equivalent, grouped } from '../helpers.js';

const risk = (id) => DOSE.find((d) => d.id === id).risk;
const MOD = WHO.adult.moderate[0];        // 150
const STRENGTH = WHO.adult.strengthDays;  // 2

const DOSE_BARS = {
  type: 'bars', yMax: 100, yStep: 20, yLabel: 'risk of early death (none = 100)',
  data: [
    { label: 'None', value: risk('none'), color: 'gray' },
    { label: 'Some, below\nthe minimum', value: risk('some'), color: 'blue' },
    { label: '1–2 × the\nminimum', value: risk('x1'), color: 'blue' },
    { label: '2–3 ×', value: risk('x2'), color: 'blue' },
    { label: '3–5 ×', value: risk('x3'), color: 'blue' },
  ],
  alt: `Bar chart of the risk of early death by weekly activity. No activity: 100. Some activity below the recommended minimum: ${risk('some')}. One to two times the minimum: ${risk('x1')}. Two to three times: ${risk('x2')}. Three to five times: ${risk('x3')}.`,
  caption: 'Arem and colleagues, 2015: 661,137 adults followed for about 14 years.',
};

const MODERATE_WAYS = ['brisk walking', 'gentle cycling', 'water aerobics', 'doubles tennis', 'dancing'];
const VIGOROUS_WAYS = ['running', 'lap swimming', 'singles tennis', 'fast cycling', 'football'];

// The teaching screen before the sorting question lists every activity of the table the question draws from.
const lower = (text) => text.charAt(0).toLowerCase() + text.slice(1);
const examplesOf = (level) => ACTIVITIES.filter((a) => a.level === level).map((a) => lower(a.text)).join(', ');
const LEVEL_NAMES = { light: 'Light', moderate: 'Moderate', vigorous: 'Vigorous' };

// The worked example's week, drawn with the course's week planner: 2 × 35 moderate minutes, 45 vigorous, strength on one day.
const EXAMPLE_WEEK = {
  type: 'week-planner', static: true,
  free: [35, 20, 0, 35, 0, 45, 0],
  activities: [
    { id: 'walk', label: 'Brisk walk', minutes: 35, kind: 'moderate' },
    { id: 'run', label: 'Run', minutes: 45, kind: 'vigorous' },
    { id: 'strength', label: 'Strength exercises', minutes: 20, strength: true },
  ],
  plan: [['walk'], ['strength'], [], ['walk'], [], ['run'], []],
  need: { minutes: MOD, strengthDays: STRENGTH },
  alt: `A week plan for an example adult: a 35-minute brisk walk on Monday and on Thursday, strength exercises on Tuesday and a 45-minute run on Saturday. The bar shows ${equivalent(70, 45)} moderate-equivalent minutes, inside the WHO range of 150 to 300, and strength on 1 of the 2 recommended days.`,
};

export default {
  id: 'why-move',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      mode: 'predict',
      title: 'How much buys how much?',
      text: `
        > **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.

        Researchers followed 661,000 adults for 14 years. Call the risk of
        dying during those years **100** for people who did no exercise in
        their free time.

        **Drag the bars**: what do you think the risk was for the other three
        groups?
      `,
      widget: {
        type: 'bars', adjust: true, step: 1, yMax: 100, yStep: 20, yLabel: 'risk (no activity = 100)',
        data: [
          { label: 'A little:\n10 min a day', value: 95, color: 'blue' },
          { label: 'Guideline:\n30 min a day', value: 95, color: 'blue' },
          { label: 'Double:\n60 min a day', value: 95, color: 'blue' },
        ],
        alt: 'Three adjustable bars for the risk of early death: people who walk briskly about 10 minutes a day, about 30 minutes a day and about 60 minutes a day. People who do none are 100.',
      },
      check: (s) => s.values[0][0] > s.values[0][1] && s.values[0][1] > s.values[0][2],
      solution: { values: [[risk('some'), risk('x1'), risk('x2')]] },
      explain: `
        The study found about **${risk('some')}**, **${risk('x1')}** and **${risk('x2')}**.

        More movement went with lower risk each time. But look at the size of
        the steps: the first one, from nothing to a little, is by far the
        biggest. The next screens look at that shape, and at whether such a
        study can be trusted.
      `,
    },
    {
      id: 'dose-explore',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Walk along the curve',
      text: `
        The dots are the study's groups. The curve is our own smooth line
        through them, a drawing aid. **Move the slider** to the right and
        watch the second readout: what the *next* 75 minutes a week would
        be worth.

        At the start they are worth 20 points. **Find the place where another
        75 minutes is worth only about 2 points.**
      `,
      widget: {
        type: 'plot', height: 330, x: [0, 600], y: [0, 110], xStep: 75, yStep: 20,
        xLabel: 'active minutes a week', yLabel: 'risk (none = 100)',
        params: { m: { min: 0, max: 525, step: 15, value: 0, label: 'active minutes a week', color: 'orange' } },
        fns: [{ expr: DOSE_EXPR, color: 'blue' }],
        areas: [{ fn: 0, from: MOD, to: WHO.adult.moderate[1], color: 'green' }],
        vlines: [{ x: 'm', dashed: true, color: 'orange' }],
        points: [
          ...DOSE.filter((d) => d.minutes).map((d) => ({ x: d.minutes, y: d.risk, color: 'ink', r: 5 })),
          { x: 0, y: 100, color: 'ink', r: 5 },
          { x: 'm', on: 0, color: 'orange', r: 8 },
        ],
        labels: [{ x: 225, y: 30, text: 'WHO range', color: 'green', anchor: 'middle' }],
        readouts: [
          { label: 'risk now', expr: 'f0(m)', digits: 0, color: 'blue' },
          { label: 'the next 75 min lower it by', expr: 'f0(m) - f0(m + 75)', digits: 0, color: 'orange' },
        ],
        alt: 'A curve of the risk of early death against active minutes a week. It starts at 100 with no activity, falls steeply to 80 at about 75 minutes, then flattens: 69 at 225 minutes, 63 at 375 and 61 at 600. The range from 150 to 300 minutes is shaded and marked as the WHO range.',
      },
      check: (s) => {
        const gain = Math.round(doseRisk(s.m) - doseRisk(s.m + 75));
        if (gain === 2) return true;
        if (s.m === 0) return 'Move the slider to the right and watch the second readout shrink.';
        return gain > 2
          ? `At ${s.m} minutes a week, another 75 minutes is still worth about ${gain} points. Keep going right.`
          : `At ${s.m} minutes a week, another 75 minutes is worth only about ${gain} point${gain === 1 ? '' : 's'}. Come back a little.`;
      },
      solution: { m: 300 },
      hints: ['The readout falls quickly at first: 20, then about 7, then about 4…', 'Try the top of the shaded WHO range.'],
      explain: `
        On this curve, at around **300 minutes a week**. The same 75 minutes
        that were worth 20 points to someone doing nothing are worth about 2
        points to someone already doing five hours.
      `,
    },
    {
      id: 'teach-dose-response',
      type: 'info',
      title: 'The steep start',
      text: `
        The shape you just walked along has a name: a **dose–response
        curve**. The "dose" is the amount of activity. The "response" is
        what happens to the risk.

        It falls steeply at first and then flattens. That makes it the
        most useful fact in this course: **the biggest gain goes to whoever
        moves from none to some.**

        :::note
        A study like this compares people as they are: nobody was told how
        much to move. A later screen asks whether such a result can be
        trusted.
        :::
      `,
      figure: {
        type: 'plot', height: 280, x: [0, 600], y: [0, 110], xStep: 150, yStep: 20,
        xLabel: 'active minutes a week', yLabel: 'risk (none = 100)',
        fns: [{ expr: DOSE_EXPR, color: 'blue' }],
        points: [
          ...DOSE.filter((d) => d.minutes).map((d) => ({ x: d.minutes, y: d.risk, color: 'ink', r: 5 })),
          { x: 0, y: 100, color: 'ink', r: 5 },
        ],
        labels: [{ x: 95, y: 93, text: 'steep: big gain', color: 'orange' },{ x: 450, y: 74, text: 'flat: small gain', color: 'gray', anchor: 'middle' }],
        alt: 'The dose–response curve of risk against active minutes a week. It falls steeply from 100 with no activity to 80 at about 75 minutes, a part marked "steep: big gain", and is nearly level between 375 and 600 minutes, a part marked "flat: small gain".',
        caption: 'The dots are the study\'s groups. The line through them is a drawing aid.',
      },
    },
    {
      id: 'dose-steps',
      type: 'fill',
      review: true,
      text: `
        A study of 661,000 adults compared people by how active they were in
        their free time. "The minimum" is what WHO recommends: about 150
        minutes of moderate activity a week.

        **Read the chart and work out the size of each step down.**
      `,
      figure: DOSE_BARS,
      template: `
        From none to some: the risk falls by [[${risk('none') - risk('some')}]] points.
        From some to 1–2 times the minimum: by [[${risk('some') - risk('x1')}]] more.
        From there to 2–3 times: by [[${risk('x1') - risk('x2')}]] more.
        So the biggest gain comes from [[doing far more than the minimum|reaching exactly 150 minutes|*the first step, from none to some]].
      `,
      explain: `
        $${risk('none')} - ${risk('some')} = ${risk('none') - risk('some')}$, then
        $${risk('some')} - ${risk('x1')} = ${risk('some') - risk('x1')}$, then
        $${risk('x1')} - ${risk('x2')} = ${risk('x1') - risk('x2')}$. Each step
        is smaller than the one before. Some is much better than none, more is
        better still, and the curve flattens after about three times the
        minimum.
      `,
    },
    {
      id: 'buses',
      type: 'choice',
      columns: 1,
      title: 'Where the idea came from',
      text: `
        London, around 1950. Every double-decker bus has two workers. The
        **driver** sits at the wheel all shift. The **conductor** sells
        tickets on both decks, climbing some 500 to 750 stairs a day.

        A doctor named Jerry Morris compared their medical records. The
        conductors had roughly **half** the rate of fatal heart attacks
        (Morris, ${BUS_STUDY.year}).

        A fair objection: perhaps healthier men *chose* to be conductors.
        **Which later evidence answers that objection best?**
      `,
      options: [
        { text: 'Trials in which volunteers take up an activity programme, and their blood pressure, blood sugar and fitness are measured', correct: true },
        { text: 'The same comparison of drivers and conductors in another city', why: 'The same objection would apply there: those men chose their jobs too.' },
        { text: 'The size of the difference: half is too much to be chance', why: 'A large difference can still come from who took which job. Its size does not show what caused it.' },
        { text: 'Asking the conductors whether they felt fit', why: 'How people feel does not show what the stairs did to their hearts.' },
      ],
      explain: `
        In a trial the activity is the thing that is changed, so it no
        longer matters who chose which job. Morris checked what he could,
        and since then hundreds of studies in millions of people, plus
        trials that measure blood pressure, blood sugar and fitness
        directly, have pointed the same way.

        The size of the benefit is an estimate. That activity protects is
        as well established as anything in public health.
      `,
    },
    {
      id: 'teach-benefits',
      type: 'info',
      title: 'One habit, many organs',
      text: `
        On strong evidence, regular physical activity makes all of these
        **less likely**:

        - heart attack and stroke
        - type 2 diabetes
        - colon and breast cancer (the evidence is strongest for these two)
        - depression and dementia
        - falls in older age

        Mood and sleep improve within days: active people tend to sleep
        better, though they need just as much sleep as anyone. And sweat
        is water and salt for cooling. Clearing waste is the job of the
        liver and kidneys.
      `,
      figure: {
        type: 'body-map', view: 'body', static: true, zoom: false,
        groups: [{ ids: ['brain', 'heart', 'large-intestine', 'femur'], color: 'orange' }],
        labels: [
          { id: 'brain', text: 'Brain' },
          { id: 'heart', text: 'Heart and arteries' },
          { id: 'large-intestine', text: 'Bowel' },
          { id: 'femur', text: 'Bones and muscles' },
        ],
        alt: 'A body seen from the front with four parts highlighted and named: the brain, the heart and arteries, the bowel, and the bones and muscles.',
      },
    },
    {
      id: 'benefits',
      type: 'bucket',
      review: true,
      text: 'Which of these does regular physical activity make **less likely**, on strong evidence?',
      buckets: ['Less likely with regular activity', 'Not something activity does'],
      items: [
        { text: 'Heart attack and stroke', bucket: 0 },
        { text: 'Type 2 diabetes', bucket: 0 },
        { text: 'Colon and breast cancer', bucket: 0, why: 'The evidence is strongest for these two cancers, and good for several others.' },
        { text: 'Depression', bucket: 0, why: 'Active people are less likely to develop depression, and activity is part of its treatment.' },
        { text: 'Dementia', bucket: 0 },
        { text: 'Falls in older age', bucket: 0, why: 'Strength and balance practice lowers the rate of falls.' },
        { text: 'Colour blindness', bucket: 1, why: 'Almost always inherited. No habit changes it.' },
        { text: 'Needing less sleep', bucket: 1, why: 'Active people tend to sleep better. They do not need less of it.' },
        { text: '"Toxins" leaving in sweat', bucket: 1, why: 'Sweat is water and salt for cooling. Clearing waste is the job of the liver and kidneys.' },
      ],
      explain: `
        One habit, many organs: heart and arteries, the handling of blood
        sugar, the bowel, the brain, bones and muscles. That breadth is why
        activity is sometimes called the nearest thing to a wonder drug. It
        also lifts mood and improves sleep within days, long before any risk
        has changed.
      `,
    },
    {
      id: 'talk-test',
      type: 'interact',
      title: 'Moderate or vigorous?',
      text: `
        Guidelines sort activity by how hard it is: light, **moderate** or
        **vigorous**. You do not need a gadget to tell them apart. Health
        agencies use the **talk test**.

        This is an example adult. **Raise the effort until they can still talk
        but could no longer sing.** Watch the heart and the breathing on the
        way.
      `,
      widget: { type: 'effort-lab', effort: 0, show: ['heart', 'breath'], alt: 'A heart, a pair of lungs and a speech bubble for an example adult. A slider sets the effort from rest to maximum.' },
      check: (s) => {
        if (s.talk === 'talk') return true;
        if (s.zone === 'rest') return 'Move the effort slider up from rest.';
        if (s.talk === 'sing') return 'Still easy enough to sing. Push the effort up.';
        return s.talk === 'words' ? 'Now only a few words fit between breaths: that is vigorous. Ease back a little.' : 'That is close to all-out: no breath left for talking. Ease back.';
      },
      solution: { effort: 50 },
      explain: `
        That is **moderate** effort: talking is possible, singing is not,
        and breathing and pulse are clearly up. Push a little further and
        only a few words fit between breaths: that is **vigorous**.
      `,
    },
    {
      id: 'teach-intensity',
      type: 'info',
      title: 'Three levels, one test',
      text: `
        The talk test sorts any activity into three levels. For a typical
        healthy adult:

        ${LEVELS.map((level) => `- **${LEVEL_NAMES[level]}** (${TALK[level]}): ${examplesOf(level)}.`).join('\n        ')}

        The test is relative to the person. A brisk walk is light for a
        trained runner and vigorous for someone recovering from illness,
        and the test reads each of them correctly.
      `,
      figure: { type: 'effort-lab', effort: 20, show: ['breath'], alt: 'A heart, a pair of lungs and a speech bubble for an example adult. A slider sets the effort from rest to maximum, and the bubble shows what the talk test would find: singing, talking, a few words or nothing.' },
    },
    {
      id: 'intensity-sort',
      type: 'bucket',
      review: true,
      gen: (rng) => {
        const picks = ['light', 'moderate', 'vigorous'].flatMap((level, i) => rng.sample(ACTIVITIES.filter((a) => a.level === level), 2).map((a) => ({ text: a.text, bucket: i })));
        return {
          text: 'For a typical healthy adult, how hard is each of these? Use the talk test in your head: sing, talk, or only a few words.',
          buckets: ['Light: could sing', 'Moderate: talk, not sing', 'Vigorous: a few words'],
          items: rng.shuffle(picks),
          explain: 'Light activity barely changes your breathing. Moderate activity makes you breathe faster but leaves you able to hold a conversation. Vigorous activity leaves you a few words at a time. For a less fit or an older body the same activity sits one level higher, and that is fine.',
        };
      },
    },
    {
      id: 'guideline',
      type: 'info',
      title: 'How much is recommended',
      text: `
        The World Health Organization's advice for **adults** (${WHO.year}):

        - **${WHO.adult.moderate[0]} to ${WHO.adult.moderate[1]} minutes a week** of *moderate* activity, **or** ${WHO.adult.vigorous[0]} to ${WHO.adult.vigorous[1]} minutes of *vigorous* activity, or a mix. One vigorous minute counts as two moderate ones.
        - **Muscle-strengthening** activity on **${STRENGTH} or more days** a week.

        Children and teenagers: an average of **${WHO.child.dailyAverage} minutes a day** of moderate-to-vigorous activity. People over 65: the adult amounts, plus balance and strength practice on ${WHO.older.balanceDays} or more days.

        Any activity counts, in bouts of any length. About ${INACTIVITY.adultsPercent}% of the world's adults do not reach the minimum.

        :::note
        For most people, building up gently is safe. If you have a heart
        condition or another medical condition, get chest pain or dizziness
        with effort, are pregnant, or are unsure what is safe for you, check
        with a health professional before changing what you do.
        :::
      `,
    },
    {
      id: 'example-equivalent',
      type: 'info',
      title: 'Adding up a week',
      text: `
        The recommendation has two parts, checked one at a time. The
        **aerobic** part is the minutes of activity that keeps heart and
        lungs working harder, such as walking or running. The **strength**
        part is counted in days.

        :::example Olu's week
        Olu, an adult, does **70 minutes** of brisk walking (moderate) and
        **45 minutes** of running (vigorous), with strength exercises on
        **1 day**.

        1. Vigorous minutes count double: 2 × 45 = 90.
        2. Add the moderate minutes: 70 + 90 = **${equivalent(70, 45)} moderate-equivalent minutes**.
        3. The aerobic part: ${equivalent(70, 45)} reaches the minimum of ${MOD}. Met.
        4. The strength part: 1 day is short of the ${STRENGTH} recommended. Not met yet.
        :::
      `,
      figure: EXAMPLE_WEEK,
    },
    {
      id: 'equivalent',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const mod = rng.pick(MODERATE_WAYS);
        const vig = rng.pick(VIGOROUS_WAYS);
        const a = rng.pick([30, 40, 45, 60, 80, 90, 100, 120]);
        const b = rng.pick([15, 20, 25, 30, 35, 50].filter((v) => v !== a && 2 * v !== a));
        const total = equivalent(a, b);
        return {
          text: `
            In a typical week ${who} does **${a} minutes** of ${mod} (moderate)
            and **${b} minutes** of ${vig} (vigorous).

            WHO counts one vigorous minute as two moderate ones.
            **How many "moderate-equivalent" minutes is that?**
          `,
          answer: total,
          unit: 'minutes',
          wrong: [
            [a + b, 'That adds the minutes as they are. The vigorous minutes count double.'],
            [2 * a + b, 'It is the vigorous minutes that count double, not the moderate ones.'],
            [2 * b, 'That is the vigorous part alone. Add the moderate minutes.'],
          ],
          hints: [`Double the vigorous minutes: $2 \\times ${b} = ${2 * b}$.`, `Then add the ${a} moderate minutes.`],
          explain: `$${a} + 2 \\times ${b} = ${a} + ${2 * b} = ${total}$ minutes. ${total >= MOD ? `That reaches WHO's minimum of ${MOD}.` : `WHO's minimum is ${MOD}, so ${who} is ${MOD - total} minutes short of it. Those ${total} minutes still count for a great deal: the first steps down the curve are the biggest.`}`,
        };
      },
    },
    {
      id: 'meets',
      type: 'choice',
      shuffle: false,
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const aerobicMet = rng.bool();
        const strengthMet = rng.bool();
        const mod = rng.pick(MODERATE_WAYS);
        const vig = rng.pick(VIGOROUS_WAYS);
        const [a, b] = rng.pick(aerobicMet
          ? [[90, 30], [120, 20], [60, 60], [100, 40], [170, 0], [0, 80]]
          : [[60, 20], [90, 10], [40, 30], [100, 0], [0, 50], [30, 45]]);
        const days = rng.pick(strengthMet ? [2, 3] : [0, 1]);
        const total = equivalent(a, b);
        const parts = [a ? `${a} minutes of ${mod}` : null, b ? `${b} minutes of ${vig}` : null].filter(Boolean).join(' and ');
        const strength = days === 0 ? 'no muscle-strengthening exercise' : `muscle-strengthening exercises on ${days} day${days === 1 ? '' : 's'}`;
        const right = aerobicMet ? (strengthMet ? 0 : 1) : (strengthMet ? 2 : 3);
        const aerobicWhy = `${a}${b ? ` + 2 × ${b}` : ''} = ${total} moderate-equivalent minutes, ${aerobicMet ? `which reaches ${MOD}` : `which is below ${MOD}`}.`;
        const strengthWhy = `Strengthening on ${days} day${days === 1 ? '' : 's'} ${strengthMet ? 'reaches' : 'is short of'} the ${STRENGTH} days recommended.`;
        const options = ['Both parts are met', 'The aerobic part is met, the strength part is not', 'The strength part is met, the aerobic part is not', 'Neither part is met yet']
          .map((text, i) => ({ text, correct: i === right, why: i === right ? undefined : `${(i < 2) !== aerobicMet ? aerobicWhy : strengthWhy}` }));
        return {
          text: `
            ${who}, an adult, has this week: ${parts}, and ${strength}.

            WHO recommends at least **${MOD} moderate-equivalent minutes**
            (vigorous minutes count double) **and** strengthening on at least
            **${STRENGTH} days**. How does this week compare?
          `,
          options,
          hints: ['Work out the two parts separately: the minutes, then the strength days.'],
          explain: `${aerobicWhy} ${strengthWhy} ${right === 0 ? '' : 'A week that falls short is not a failed week: every part of it still counts.'}`,
        };
      },
    },
    {
      id: 'sitting',
      type: 'choice',
      title: 'What about all the sitting?',
      text: `
        A pooled analysis of more than a million adults sorted people two
        ways: by hours of sitting a day, and by how active they were
        (Ekelund and colleagues, 2016).

        - Among the **least active** people, those who sat more than eight
          hours a day were more likely to die during the study than those
          who sat less than four.
        - In the **most active quarter**, with 60 to 75 minutes of moderate
          activity a day, long sitting hours made almost no difference.

        **Which reading of the two findings is fair?**
      `,
      columns: 1,
      options: [
        { text: 'Sitting time mattered most for people who moved little; with plenty of activity it stopped showing up as a risk', correct: true },
        { text: 'Long sitting is harmless for everyone', why: 'Among the least active people, long sitting went with a higher risk of dying during the study.' },
        { text: 'Sitting protects people who are very active', why: 'Sitting was never protective. In the most active group it simply stopped showing up as a risk.' },
        { text: 'Activity only helps from 60 minutes a day', why: 'The analysis compared sitting hours. It did not test where the benefit of activity begins, and the dose–response curve shows gains from the first minutes.' },
      ],
      explain: `
        The extra risk that went with long sitting shrank as activity rose,
        and was no longer measurable in the most active group. The people
        worst off were the inactive ones, however long they sat.

        WHO's advice is modest: **limit long sitting, and replace some of it
        with movement of any intensity.** Nobody has found a safe number of
        sitting hours, and getting up now and then is sensible though its
        long-term benefit is not yet proven.
      `,
    },
    {
      id: 'steps',
      type: 'choice',
      columns: 1,
      title: 'How many steps?',
      text: `
        Step counters love the number ${grouped(STEPS.slogan)}. It comes from
        a Japanese pedometer sold from about ${STEPS.sloganYear}, the
        *manpo-kei*: "10,000-steps meter".

        A 2025 review of 57 studies compared people by their daily steps.
        Compared with ${grouped(STEPS.reference)} steps a day, **${grouped(STEPS.benefit)}
        steps a day** went with a ${STEPS.lowerRiskPercent}% lower risk of early
        death. Beyond that the curve flattens.

        **Which statement fits both facts?**
      `,
      options: [
        { text: `Most of the gain is already there at about ${grouped(STEPS.benefit)} steps; ${grouped(STEPS.slogan)} is a catchy name, not a research finding`, correct: true },
        { text: `The benefit only begins at ${grouped(STEPS.slogan)} steps`, why: `In the review the risk was nearly halved by about ${grouped(STEPS.benefit)} steps, well short of ${grouped(STEPS.slogan)}.` },
        { text: `Steps beyond ${grouped(STEPS.benefit)} do harm`, why: 'A curve that flattens means that more steps add little. Nothing in the review says they harm.' },
        { text: 'A day of 4,000 steps is wasted', why: `Fewer steps are far from wasted. The comparison is with ${grouped(STEPS.reference)} steps a day, and the curve has the shape you walked along earlier: steepest at the start.` },
      ],
      explain: `
        About **${grouped(STEPS.benefit)}** steps a day: ${STEPS.lowerRiskPercent}% lower than at ${grouped(STEPS.reference)}
        (Ding and colleagues, 2025), and after that the curve flattens, the
        same shape you walked along earlier.

        The number ${grouped(STEPS.slogan)} began as a product name. It is a
        fine target if you enjoy it, and fewer steps are far from wasted.
      `,
    },
    {
      id: 'teach-everybody',
      type: 'info',
      title: 'Written for every body',
      text: `
        The WHO guidelines are more than numbers. They are written for all
        ages and all bodies, and they say:

        - **Doing some physical activity is better than doing none.**
        - **Start with small amounts and build up gradually.**
        - The same recommendations apply to people living with a
          disability or a long-term condition, adapted to what they can do.
        - People who are pregnant are advised to stay active, with their
          midwife's or doctor's guidance.

        After 65 nothing is taken away: the adult amounts still apply, with
        balance and strength practice added.
      `,
    },
    {
      id: 'everybody',
      type: 'multi',
      text: 'Which of these statements are part of the WHO guidelines? **Choose all that apply.**',
      options: [
        { text: 'Doing some physical activity is better than doing none', correct: true },
        { text: 'Start with small amounts and build up gradually', correct: true },
        { text: 'The recommendations also apply to people living with a disability or a long-term condition, adapted to what they can do', correct: true },
        { text: 'Only sessions of 30 minutes or more count', why: 'Activity of any length counts. An older rule about ten-minute bouts was dropped in 2020 for lack of evidence.' },
        { text: 'After 65, vigorous activity should be avoided', why: 'The adult amounts apply to older people too, with balance and strength practice added. What changes is the starting point, not the principle.' },
      ],
      explain: `
        Two of the five are not in the guidelines: a bout of any length
        counts, and nothing is taken away after 65.

        The right activity differs from one body to the next. The principle
        does not: **some is better than none, and it is never too late to
        start.**
      `,
    },
    {
      id: 'try',
      type: 'choice',
      mode: 'predict',
      title: 'One small thing',
      text: `
        The curve says the first minutes matter most. If you felt like
        adding a few this week, **which of these would fit your days most
        easily?** There is no right answer.
      `,
      options: [
        { text: 'A ten-minute walk after a meal' },
        { text: 'The stairs, where there is a choice' },
        { text: 'Moving about during a phone call' },
        { text: 'Getting off one stop early' },
        { text: 'Dancing to two songs at home' },
      ],
      explain: `
        Every one of them counts towards the ${MOD} minutes, and each is
        exactly the kind of step that the steep left end of the curve
        rewards. You might simply notice, this week, where such a moment
        already exists in your day.
      `,
    },
  ],
  recap: [
    `Regular activity lowers the risk of heart disease, stroke, type 2 diabetes, several cancers, depression, dementia and early death. Few findings in health are better established.`,
    `The dose–response curve is steepest at the start: **the biggest gain comes from moving from none to some**, and it flattens after a few times the minimum.`,
    `WHO for adults: **${WHO.adult.moderate[0]}–${WHO.adult.moderate[1]} minutes** of moderate activity a week (vigorous minutes count double), plus muscle-strengthening on **${STRENGTH} days**. Any bout of any length counts.`,
    `Moderate means you can talk but not sing. Vigorous means a few words at a time. Both are relative to your own body.`,
  ],
  next: 'Next: what is actually happening inside when you get out of breath, and why a trained heart beats more slowly.',
};
