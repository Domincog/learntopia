// The Body II: Control, Defence and Movement · Lesson 6 · From One Cell to Old Age
//
// Driving question: you began as a single cell. What turned it into you, and what sets the timetable of a life?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/body-control/index.js';
import { LIFE, PREGNANCY_STEPS, PUBERTY_CHANGES, CYCLE_HORMONES, AGEING } from '../helpers.js';

const lower = (t) => t[0].toLowerCase() + t.slice(1);
const pubertyList = (who) => PUBERTY_CHANGES.filter((c) => c[1] === who).map((c) => lower(c[0])).join('; ');
const CYCLE_ALT = 'A chart of one menstrual cycle. Four curves show the hormones FSH, oestrogen, LH and progesterone day by day; below them a band shows the thickness of the lining of the uterus, with the days of the period and the day the egg is released marked.';

export default {
  id: 'life-cycle',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'One cell',
      text: `
        You began as **one cell**, smaller than a full stop. An adult body
        has more than 30 trillion cells (30,000,000,000,000).

        Cells multiply by dividing in two. **About how many rounds of
        doubling does it take to get from one cell to 30 trillion?**
      `,
      shuffle: false,
      options: [
        { text: 'About 45', correct: true },
        { text: 'About 4,500' },
        { text: 'About 45,000' },
        { text: 'About 45 million' },
      ],
      explain: `
        About **${LIFE.doublings}**. One, two, four, eight… doubling ${LIFE.doublings} times gives
        about 35 trillion. (In a real body cells also die and are
        replaced, so the true count of divisions is far higher.)

        But a heap of 30 trillion identical cells is not a person. Each
        cell had to know what to become, and when. Where are the
        instructions?
      `,
    },
    {
      id: 'teach-chromosomes',
      type: 'info',
      title: 'The instruction set',
      text: `
        The instructions are **DNA**. In almost every cell of your body it
        is packed into **${LIFE.chromosomes} chromosomes**, kept in the cell's nucleus.

        The ${LIFE.chromosomes} come as **${LIFE.pairs} pairs**. One chromosome of each pair came
        from each parent.

        A stretch of DNA that holds the recipe for one protein is a
        **gene**. You have about 20,000 genes.
      `,
      figure: {
        type: 'body-map', view: 'cell',
        labels: [{ id: 'nucleus', text: 'Nucleus: holds the chromosomes' }],
        alt: 'One cell cut open, showing the structures inside it. The large round nucleus near the middle is named.',
      },
    },
    {
      id: 'karyotype',
      type: 'interact',
      title: 'The instruction set',
      text: `
        Here are all the chromosomes from one human cell, photographed
        and lined up in their **pairs**, by size.

        In all but one of the pairs, the two partners match. **Tap the
        pair whose partners do not match.**
      `,
      widget: photo(MEDIA.karyotype, {
        alt: 'A grid of dark, banded, worm-shaped chromosomes arranged two by two in four rows, from the largest pairs at the top left to the smallest at the bottom. In most pairs the two are the same length. In the pair at the bottom right, one chromosome is several times longer than the other.',
        caption: 'The chromosomes of one human cell',
        creditLabel: 'Image',
        hotspots: [
          { id: 'xy', x: 0.925, y: 0.862, r: 0.06, label: 'X and Y: the sex chromosomes', alt: 'a pair at the bottom right' },
          { id: 'one', x: 0.08, y: 0.13, r: 0.075, label: 'Pair 1: the largest', alt: 'a pair at the top left' },
          { id: 'mid', x: 0.355, y: 0.385, r: 0.06, label: 'Pair 8', alt: 'a pair in the second row' },
          { id: 'small', x: 0.635, y: 0.885, r: 0.055, label: 'Pair 21', alt: 'a very small pair in the bottom row' },
        ],
      }),
      check: (s) => s.picked === 'xy' || (s.picked ? 'Those two are the same length and have the same pattern of bands. Look for a pair in which one is much shorter than the other.' : false),
      solution: { picked: 'xy' },
      hints: ['Compare the lengths of the two partners in each pair.'],
      explain: `
        The unmatched pair are the **sex chromosomes**, a long **X** and a
        short **Y**. Two X chromosomes usually go with a female body, an X
        and a Y with a male body. That is the usual pattern, not the only
        one: some people are born with other combinations, or with bodies
        that develop differently from what their chromosomes suggest.
      `,
    },
    {
      id: 'chromosome-count',
      type: 'fill',
      review: true,
      title: 'Half from each',
      text: `
        If every cell has ${LIFE.chromosomes} chromosomes, a child of two parents would have
        ${LIFE.chromosomes * 2}, unless eggs and sperm are special. They are.
        **Fill in the numbers.**
      `,
      template: `
        An egg cell carries [[23]] chromosomes: one from each pair.
        A sperm cell carries [[23]] as well.
        When they join, the fertilised egg has [[46]], in [[23]] pairs.
        Every time it divides, each new cell gets a copy of all [[46]].
      `,
      plain: true,
      explain: `
        Eggs and sperm are the only cells with a **half set**. Joining
        two half sets is **fertilisation**, and it makes a full set that
        has never existed before: half the mother's, half the father's,
        shuffled. Every one of your cells carries a copy of it.
      `,
    },
    {
      id: 'where-it-grows',
      type: 'interact',
      title: 'Where a pregnancy grows',
      text: `
        Eggs are stored in the two **ovaries**. About once a month one is
        released into a tube that leads to the **womb (uterus)**, a
        hollow, muscular organ about the size of a pear. If the egg meets
        a sperm on the way, it is fertilised.

        The figure shows the lower abdomen of a female body, facing you.
        The two small ovals at the sides are the ovaries, and a thin
        tube leads from each.
        **Tap the organ in which the fertilised egg settles and grows.**
      `,
      widget: { type: 'body-map', view: 'body', bounds: [100, 335, 300, 495], mode: 'pick', show: ['female', 'bladder', 'pelvis'], pickable: ['ovaries', 'uterus', 'bladder'], answer: 'uterus', zoom: false, alt: 'The lower abdomen of a body facing the viewer, with the pelvis. Low in the middle is a pear-shaped organ with a small oval organ on either side of it, joined to it by a thin tube, and below it a rounded organ.' },
      check: (s) => s.picked === 'uterus' || (s.picked === 'ovaries' ? 'Those are the ovaries, where the eggs come from. The fertilised egg travels on from there.' : s.picked === 'bladder' ? 'That is the bladder, which stores urine. It sits just in front of and below the organ you are looking for.' : false),
      solution: { picked: 'uterus' },
      explain: `
        The **uterus**. Its lining thickens each month in readiness, and
        its muscular wall stretches enormously during a pregnancy.

        Sperm are made in the **testes**, which hang outside the body,
        where it is a little cooler, and they are carried in fluid added
        by the prostate and other glands.
      `,
    },
    {
      id: 'teach-pregnancy',
      type: 'info',
      title: 'Nine months',
      text: `
        Pregnancy lasts about **${LIFE.pregnancyWeeks} weeks**, counted from the first day of
        the last period. It is described in three **trimesters** of about
        three months each.

        | Trimester | What happens |
        |---|---|
        | First | About a week after fertilisation, the dividing ball of cells settles into the lining of the uterus: it **implants**. The **placenta** forms, and the main organs take shape. |
        | Second | The fetus grows, and its movements can be felt. |
        | Third, from week ${LIFE.thirdTrimesterFrom} | The lungs mature and weight is gained fast, until birth. |

        The placenta is the exchange point: oxygen and food cross to the
        fetus, and wastes cross back.
      `,
    },
    {
      id: 'pregnancy-order',
      type: 'order',
      review: true,
      title: 'Nine months',
      text: `
        Pregnancy lasts about **${LIFE.pregnancyWeeks} weeks**, counted from the first day of the
        last period, and is described in three **trimesters** of about
        three months each. **Put the main events in order.**
      `,
      items: PREGNANCY_STEPS,
      labels: ['First', 'Last'],
      explain: `
        By the end of the first trimester every major organ has begun to
        form. The rest is growth.

        In the placenta the two bloodstreams run side by side but **never
        mix**. Antibodies cross to the fetus along with oxygen and food.
        Alcohol, nicotine and many medicines cross too, which is why
        pregnancy has its own health advice.
      `,
    },
    {
      id: 'teach-puberty',
      type: 'info',
      title: 'The second great change',
      text: `
        Childhood is steady growth. Then the brain starts sending new
        hormone signals to the **ovaries** or the **testes**, which answer
        with hormones of their own: mainly oestrogen, or mainly
        testosterone. The result is **puberty**: a child's body becomes an
        adult's, over several years.

        | Where | What changes |
        |---|---|
        | In bodies with ovaries | ${pubertyList('ovaries')} |
        | In bodies with testes | ${pubertyList('testes')} |
        | In both | ${pubertyList('both')} |
      `,
    },
    {
      id: 'puberty-changes',
      type: 'bucket',
      title: 'The second great change',
      text: `
        **Which bodies does each change of puberty happen in?**
      `,
      buckets: ['Bodies with ovaries', 'Bodies with testes', 'Both'],
      items: PUBERTY_CHANGES.map(([text, who]) => ({ text, bucket: ['ovaries', 'testes', 'both'].indexOf(who) })),
      explain: `
        Everybody makes both oestrogen and testosterone, in different
        amounts, which is why much of puberty is shared: growth, hair,
        skin, sweat, and new and stronger feelings.

        Puberty is not a race. It is the same process whenever it starts,
        and everybody arrives.
      `,
    },
    {
      id: 'puberty-range',
      type: 'choice',
      gen: (rng) => {
        const girl = rng.bool();
        const [lo, hi] = girl ? LIFE.pubertyOvaries : LIFE.pubertyTestes;
        const kind = rng.pick(['early', 'in', 'in', 'late']);
        const name = rng.pick(girl ? ['Maya', 'Sofia', 'Ines', 'Hana', 'Zoe'] : ['Jonas', 'Arjun', 'Leo', 'Kofi', 'Mateo']);
        const pro = girl ? ['She', 'her'] : ['He', 'his'];
        const age = kind === 'early' ? lo - rng.int(1, 2) : kind === 'late' ? hi + rng.int(1, 2) : rng.int(lo + 1, hi - 1);
        const story = kind === 'late'
          ? `${name} is ${age} and has had no signs of puberty yet. Most of ${pro[1]} classmates have.`
          : `${name} noticed the first signs of puberty at age ${age}. ${kind === 'early' ? `None of ${pro[1]} classmates had.` : rng.pick([`Some of ${pro[1]} friends started earlier.`, `Some of ${pro[1]} friends have not started yet.`])}`;
        const verdict = { early: 'Earlier than the typical range', in: 'Within the typical range', late: 'Later than the typical range' };
        return {
          text: `
            Puberty typically starts between **${LIFE.pubertyOvaries[0]} and ${LIFE.pubertyOvaries[1]}** in girls and
            between **${LIFE.pubertyTestes[0]} and ${LIFE.pubertyTestes[1]}** in boys: a span of five years in each case.

            An example: ${story}

            **How does that compare with the typical range?**
          `,
          shuffle: false,
          options: ['early', 'in', 'late'].map((k) => ({
            text: verdict[k],
            correct: k === kind,
            why: k === kind ? undefined : `The typical range for ${girl ? 'girls' : 'boys'} is ${lo} to ${hi}. Compare the age of ${age} with it.`,
          })),
          explain: kind === 'in'
            ? `Age ${age} is inside the range of ${lo} to ${hi}. Friends of the same age can be years apart in puberty and all be developing typically.`
            : `Age ${age} is ${kind === 'early' ? 'below' : 'above'} the range of ${lo} to ${hi}. That does not mean anything is wrong (timing often runs in families), but it is worth mentioning to a doctor, who can check.`,
        };
      },
    },
    {
      id: 'teach-cycle',
      type: 'info',
      title: 'A monthly loop',
      text: `
        From puberty, the ovaries and the uterus run a repeating cycle.
        Read the picture from left to right.

        - **Day 1** is the first day of a **period**: the lining of the
          uterus (the band at the bottom) is shed.
        - Then an egg ripens in an ovary, while the lining is rebuilt.
        - Around the middle the egg is released: **ovulation**.
        - After that the lining is kept ready. If no fertilised egg
          implants, it is shed, and the next cycle begins.

        The curves at the top are the four hormones that steer all this.
      `,
      figure: { type: 'cycle-hormones', length: 28, day: 1, static: true, alt: CYCLE_ALT },
    },
    {
      id: 'cycle-explore',
      type: 'interact',
      title: 'A monthly loop',
      text: `
        Now the **four hormones**. Day 1 is the first day of a period.

        **Move through the days and stop on the day the egg is
        released.** Which hormone has just shot up?
      `,
      widget: { type: 'cycle-hormones', length: 28, day: 1, alt: CYCLE_ALT },
      check: (s) => s.phase === 'ovulation' || (s.day < s.ovulation ? 'Not yet: the egg is still ripening. Go later in the cycle.' : 'The egg was released before this day. Go back a little.'),
      solution: { day: 14 },
      hints: ['Look for the small yellow circle above the lining.'],
      explain: `
        In this 28-day cycle the egg is released on **day 14**:
        **ovulation**. It follows a sudden surge of **LH** from the
        pituitary.

        Before it, **FSH** made an egg ripen, and rising **oestrogen**
        rebuilt the lining. After it,
        **progesterone** keeps the lining ready. If no fertilised egg
        implants, progesterone falls, the lining is shed as the next
        period, and the loop starts again.
      `,
    },
    {
      id: 'cycle-length',
      type: 'interact',
      title: 'Not everyone is 28',
      text: `
        Cycles of anything from about **${LIFE.cycleDays[0]} to ${LIFE.cycleDays[1]} days** are common, and
        one person's cycles vary from month to month.

        **Make this a 35-day cycle and find the day of ovulation again.**
        Which part of the cycle has stretched?
      `,
      widget: { type: 'cycle-hormones', length: 28, day: 14, lengthRange: [LIFE.cycleDays[0], LIFE.cycleDays[1], 1], alt: CYCLE_ALT },
      check: (s) => {
        if (s.length !== 35) return 'Set the length of the cycle to 35 days first.';
        return s.phase === 'ovulation' || (s.day < s.ovulation ? 'In this longer cycle the egg is released later than that.' : 'Too late: go back to the day the egg is released.');
      },
      solution: { length: 35, day: 21 },
      explain: `
        Ovulation moves to **day 21**: 35 − ${LIFE.lutealDays}. (In the 28-day cycle it
        was 28 − ${LIFE.lutealDays} = day 14.) The first part of the cycle, while
        an egg ripens, is the part that stretches or shrinks. The part
        after ovulation stays close to **${LIFE.lutealDays} days** (usually 10 to 16).

        So ovulation is best described as "about two weeks before the
        *next* period", which nobody can know in advance.
      `,
    },
    {
      id: 'ovulation-day',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const length = rng.intExcept(LIFE.cycleDays[0] + 1, LIFE.cycleDays[1], [28]);
        const who = rng.pick(['Amira', 'Chen', 'Lucía', 'Thandi', 'Freya']);
        return {
          text: `
            A textbook example: ${who}'s cycle this month turned out to be
            **${length} days** long. Assume the usual ${LIFE.lutealDays} days between
            ovulation and the next period: in a 28-day cycle, that puts
            ovulation on day 28 − ${LIFE.lutealDays} = 14.

            **On about which day of the cycle was the egg released?**
          `,
          answer: length - LIFE.lutealDays,
          prefix: 'day',
          wrong: [
            [14, 'Day 14 fits a 28-day cycle only. Count back from the end of this one.'],
            [Math.round(length / 2 * 10) / 10, 'Not the middle: ovulation comes about 14 days before the *next* period.'],
          ].filter(([v], i, all) => v !== length - LIFE.lutealDays && all.findIndex(([w]) => w === v) === i),
          hints: [`The next period starts after day ${length}. Count ${LIFE.lutealDays} days back.`],
          explain: `
            ${length} − ${LIFE.lutealDays} = **day ${length - LIFE.lutealDays}**. The rule works backwards from the next
            period, so it can only be applied afterwards, and even then
            only roughly: the ${LIFE.lutealDays} days themselves vary by a few days.
          `,
        };
      },
    },
    {
      id: 'cycle-match',
      type: 'match',
      review: true,
      title: 'Four hormones, four jobs',
      text: 'Two come from the pituitary under the brain, two from the ovary. **Match each hormone to its job.**',
      pairs: CYCLE_HORMONES.map(([name, , job]) => [name, job]),
      explain: `
        **FSH** ripens an egg; the ripening egg's surroundings make
        **oestrogen**; high oestrogen triggers the **LH** surge; the empty
        egg sac makes **progesterone**. Each hormone sets off the next: a
        feedback loop, like blood glucose, but with a month-long period.

        The loop runs from puberty until the **menopause**, usually
        between ${LIFE.menopauseAge[0]} and ${LIFE.menopauseAge[1]}, when the ovaries stop releasing eggs and
        periods end. The hormone changes around it can cause hot flushes,
        poor sleep and other symptoms, for which there is effective help.
      `,
    },
    {
      id: 'trainable',
      type: 'multi',
      title: 'Later life',
      text: `
        Bodies change with age: skin thins, bones and muscles tend to lose
        mass, senses dull a little. But not everything simply runs down.
        What is built by use (a muscle, a skill, the brain's connections)
        still answers to practice. What stiffens or slows in everyone
        does not.

        **Which of these can still be improved by practice or training at
        any age?**
      `,
      options: AGEING.map(([text, ok, note]) => ({ text, correct: ok, why: ok ? undefined : note })),
      explain: `
        **Strength, balance and learning** all respond to practice for
        life: studies of strength training in people over 85 show real
        gains. A few things, such as the heart's top speed and the
        flexibility of the eye's lens, decline whatever we do.

        Much of what people fear about ageing is the result of disuse and
        of illness, not of age alone.
      `,
    },
    {
      id: 'life-expectancy',
      type: 'slider',
      tone: 'sober',
      mode: 'predict',
      title: 'A longer story',
      text: `
        In **1900**, the average length of a human life, across the whole
        world, was about **${LIFE.lifeExpectancy1900} years**.

        **What do you think it is today?**
      `,
      min: 30, max: 100, step: 1, start: 50, answer: LIFE.lifeExpectancyNow, tolerance: 3, unit: 'years',
      explain: `
        About **${LIFE.lifeExpectancyNow} years**: more than double.

        The old average was not low because adults died at 32. It was low
        because so many **children** died. Clean water and sewers,
        vaccines, antibiotics, safer childbirth and better food changed
        that. Most of the extra years of life were won by prevention,
        which is where this path goes next.
      `,
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to try this week',
      text: `
        Bodies have histories, and most people enjoy being asked about
        theirs. If you can, **ask someone a generation or two older than
        you** one question:

        *What could you do at my age that you cannot do now, and what can
        you do now that you could not do then?*

        The second half of the answer is usually the more interesting one.
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    `Every person starts as one fertilised cell with **${LIFE.chromosomes} chromosomes**, ${LIFE.pairs} from each parent. Egg and sperm carry half sets.`,
    `Pregnancy lasts about ${LIFE.pregnancyWeeks} weeks; the **placenta** exchanges oxygen, food and wastes without the two bloods mixing.`,
    '**Puberty** is switched on by hormones and starts at very different ages. From then, four hormones run the monthly cycle, with ovulation about two weeks before the next period.',
    'Ageing changes every system, but strength, balance and learning stay trainable for life. Average life expectancy has more than doubled since 1900.',
  ],
  next: 'Next, the last lesson of this course: the facts everyone should have about fertility, contraception, infections and consent.',
};
