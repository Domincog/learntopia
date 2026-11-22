// Data & Statistics · Lesson 4 · Do They Move Together?
import { r, num, round } from '../../../kit.js';
import { ICE, cloud, correlation, seeded } from '../helpers.js';

const kiosk = (extra) => ({
  type: 'scatter-fit', x: [14, 34], y: [0, 300], xStep: 2, yStep: 50,
  xLabel: 'temperature at noon (°C)', yLabel: 'ice creams sold', points: ICE, ...extra,
});
const picture = (seed, rho, alt) => ({ type: 'scatter-fit', x: [0, 10], y: [0, 10], points: cloud(seeded(seed), 28, rho), alt });
const LINE = [[2, 3], [3, 3.5], [3.5, 4.5], [4.5, 5], [5, 6], [6, 6.5]];
// A perfect U, symmetric about x = 5: plainly a pattern, and r is exactly 0.
const U_SHAPE = [[1, 9], [2, 5.5], [3, 3], [4, 1.5], [5, 1], [6, 1.5], [7, 3], [8, 5.5], [9, 9]];

const CASES = [
  {
    finding: 'On days when a city sells more umbrellas, it also has more car accidents.',
    claim: 'Umbrellas distract drivers.',
    right: 'Rain does both: it sells umbrellas and it makes roads slippery',
    other: ['Accidents make people buy umbrellas', 'Turning the arrow around does not help here. Look for something that could cause both at once.'],
    explain: 'Rain is a **third factor** behind both numbers. Umbrellas and accidents move together without either causing the other.',
  },
  {
    finding: 'Across a country, towns with more bakeries have more burglaries.',
    claim: 'Bakeries attract burglars.',
    right: 'Bigger towns have more of everything, bakeries and burglaries included',
    other: ['Burglaries make people open bakeries', 'Turning the arrow around does not help here. Look for something that could cause both at once.'],
    explain: 'The size of the town is a **third factor**. More people means more bakeries and more burglaries, with no link between the two.',
  },
  {
    finding: 'Students who have a private tutor score lower, on average, than students who do not.',
    claim: 'Tutoring harms your marks.',
    right: 'Struggling students are the ones most likely to get a tutor',
    other: ['It is a coincidence that will vanish next year', 'A pattern like this shows up year after year. There is a real reason for it, just not the one claimed.'],
    explain: 'The arrow points **the other way**: low marks lead to tutoring, not tutoring to low marks.',
  },
  {
    finding: 'People who were in hospital last week are far more likely to die this year than people who were not.',
    claim: 'Hospitals are bad for your health.',
    right: 'Being seriously ill is what brings people to hospital in the first place',
    other: ['It is a coincidence that will vanish next year', 'A pattern like this shows up year after year. There is a real reason for it, just not the one claimed.'],
    explain: 'The arrow points **the other way**: poor health leads to a hospital stay. The stay is not what makes people ill.',
  },
  {
    finding: 'People who wear a fitness tracker exercise more than people who do not.',
    claim: 'Hand everyone a tracker and the whole country will exercise more.',
    right: 'People who already like exercise are the ones who buy a tracker',
    other: ['Exercise and trackers are unrelated, so the pattern must be a mistake', 'The pattern is real. The question is which way the arrow points.'],
    explain: 'The arrow may well point **the other way**: a love of exercise leads to buying a tracker. Whether a tracker changes anyone’s habits needs a proper experiment.',
  },
  {
    finding: 'Children who grow up in homes with many books do better at school.',
    claim: 'Put more books on the shelf and marks will rise.',
    right: 'Homes with many books differ in other ways too, such as income and how much the family reads together',
    other: ['Good marks make books appear in the house', 'Turning the arrow around does not help much here. Look for something that could lie behind both.'],
    explain: 'Family background is a **third factor** that could lie behind both the full bookshelves and the good marks.',
  },
];

export default {
  id: 'correlation',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Tomorrow at the beach',
      text: `
        Each dot is one summer day at a beach kiosk (invented data): how hot it was at noon, and how many ice creams were sold.

        Tomorrow's forecast is **30 °C**. About how many ice creams should the kiosk expect to sell?
      `,
      figure: kiosk({ alt: 'Scatter plot of 14 days. Hotter days sold more ice creams: from about 60 at 16 degrees to about 220 at 33 degrees.' }),
      min: 0, max: 300, step: 10, answer: 200, tolerance: 30, start: 100,
      explain: `
        There is no dot at exactly 30 °C, and still you could make a sensible guess: the dots climb together, and near 30 °C the climb passes close to **200**.

        This lesson is about reading the pattern in a cloud of dots, and about not reading too much into it.
      `,
    },
    {
      id: 'teach-scatter',
      type: 'info',
      title: 'Reading a scatter plot',
      text: `
        A chart like this is a **scatter plot**: one dot per case, with one measurement on each axis. Here, a case is a day.

        :::example Reading one dot
        Take the dot furthest to the right. Straight below it, the bottom axis says 33 °C. Level with it, the side axis says about 215.
        So on the hottest day, at 33 °C, the kiosk sold about 215 ice creams.
        :::

        Now look at the whole cloud. The dots on the left sit low and the dots on the right sit high: hotter days tended to sell more. That drift is what let you guess for 30 °C.
      `,
      figure: kiosk({ alt: 'The scatter plot of the 14 kiosk days. The dot furthest to the right is at 33 degrees and 215 ice creams; the dot furthest to the left is at 16 degrees and 70 ice creams.' }),
    },
    {
      id: 'fit-line',
      type: 'interact',
      attempts: 6,
      title: 'Draw the trend',
      text: `
        Make the pattern visible. **Drag the two orange handles until the line runs through the middle of the cloud.**

        The red bars show how far each day is from your line. Try to keep them short.
      `,
      widget: kiosk({
        line: { left: 150, right: 150 }, fit: 'reveal',
        alt: 'The ice-cream scatter plot with a movable line and bars showing the gap between each point and the line.',
      }),
      check: (s) => {
        const { excess, tilt, offset } = s.line;
        if (excess <= 0.5) return true;
        if (tilt > 2) return 'Your line is too steep: it climbs faster than the dots do.';
        if (tilt < -2) return 'Your line is too flat: the dots climb faster than that.';
        return offset > 0
          ? 'The slope looks about right, but the line sits too high: most dots are below it.'
          : 'The slope looks about right, but the line sits too low: most dots are above it.';
      },
      solution: { line: { left: 50, right: 225 } },
      hints: ['Start with the left handle: put it at the height of the dots on the left. Then do the same on the right.'],
      explain: `
        The dashed line that just appeared is the one that keeps the red gaps as small as they can be overall.
        If yours ran close to it, your eye did the job well.
      `,
    },
    {
      id: 'teach-direction',
      type: 'info',
      title: 'The line of best fit',
      text: r`
        The dashed line you just saw is the **line of best fit**: of all possible lines, it keeps the gaps to the dots smallest overall. One line now sums up the whole cloud.

        :::example Using the line
        At 20 °C the line is at about 100 ice creams, and it climbs about 10 for every extra degree. So for 30 °C it says about $100 + 10 \times 10 = 200$.
        :::

        This line climbs, so the two measurements have a **positive association**: more of one tends to come with more of the other.
        A line that falls shows a **negative association**: the warmer it is outside, the lower the heating bill.
      `,
      figure: kiosk({
        fit: true,
        alt: 'The kiosk scatter plot with the line of best fit drawn through the cloud. The line climbs from about 60 ice creams at 16 degrees to about 230 at 33 degrees.',
        caption: 'The line of best fit. It is what you used, by eye, to predict tomorrow.',
      }),
    },
    {
      id: 'direction',
      type: 'choice',
      title: 'Which way does it lean?',
      text: `
        Three clouds of dots, without their lines.

        **Which plot shows a negative association?**
      `,
      columns: 1,
      options: [
        { text: '', figure: picture(11, 0.85, 'A cloud of points that climbs from lower left to upper right.'), why: 'This cloud climbs from left to right: as one measurement grows, so does the other. That is a positive association.' },
        { text: '', correct: true, figure: picture(12, -0.85, 'A cloud of points that falls from upper left to lower right.') },
        { text: '', figure: picture(13, 0, 'A round cloud of points with no direction.'), why: 'This cloud does not lean either way. Knowing one measurement tells you nothing about the other: no association.' },
      ],
      explain: 'A falling cloud means that high values of one measurement tend to come with low values of the other. A line of best fit through it would slope downwards.',
    },
    {
      id: 'r-explore',
      type: 'info',
      title: 'One number for the pattern',
      text: r`
        The **correlation coefficient**, written $r$, measures how closely a cloud of dots follows a straight line.
        The sign tells you the direction: $+$ climbs, $-$ falls. The size tells you the strength:

        | Size of $r$ | The cloud |
        |:---:|---|
        | 1 | every dot on one line |
        | about 0.9 | hugs a line: strong |
        | about 0.7 | clear trend, much scatter |
        | about 0.4 | weak: direction just shows |
        | 0 | no straight-line trend |

        So $r = -0.9$ is a tight band that falls, and $r = +0.4$ is a loose cloud that climbs.
      `,
      figure: {
        type: 'scatter-fit', x: [0, 10], y: [0, 10], numbers: false, cloud: { n: 40, r: 0.6, slider: true },
        alt: 'A cloud of 40 points whose correlation is set by a slider.',
        caption: 'Slide r from −1 to +1. Stop at 0.9, at 0.5 and at 0.2: a correlation of 0.5 looks weaker than most people expect.',
      },
    },
    {
      id: 'estimate-r',
      type: 'slider',
      review: true,
      gen: (rng) => {
        const target = rng.pick([-0.9, -0.7, -0.4, 0, 0.4, 0.7, 0.9]);
        const points = cloud(rng, 36, target);
        const actual = round(correlation(points), 2);
        const size = Math.abs(target);
        const strength = size >= 0.85 ? 'The dots hug a line closely: a strong association.'
          : size >= 0.6 ? 'There is a clear trend, with plenty of scatter around it.'
            : size >= 0.3 ? 'The trend is weak: you can tell the direction, but only just.'
              : 'The cloud leans neither way: no association.';
        return {
          text: r`The correlation coefficient $r$ runs from $-1$ (a perfect falling line) through 0 (no trend) to $+1$ (a perfect climbing line). **Estimate $r$ for this scatter plot.**`,
          figure: { type: 'scatter-fit', x: [0, 10], y: [0, 10], numbers: false, height: 340, points, alt: 'A scatter plot of 36 points.' },
          min: -1, max: 1, step: 0.1, answer: target, tolerance: 0.2, start: 0, prefix: '$r \\approx$',
          hints: ['First the sign: does the cloud climb (positive) or fall (negative)? Then the size: a tight band is close to 1, a round blob is close to 0.'],
          explain: `${strength} Here $r = ${num(actual, 2)}$${target === 0 ? '' : target > 0 ? ', positive because the cloud climbs' : ', negative because the cloud falls'}. Any estimate within 0.2 counts as a good read.`,
        };
      },
    },
    {
      id: 'outlier',
      type: 'interact',
      title: 'One point against six',
      text: r`
        These seven points lie almost on a line: $r = 0.99$.

        **Drag the orange point until $r$ is negative.**
      `,
      widget: {
        type: 'scatter-fit', x: [0, 10], y: [0, 10], points: [...LINE, [6.5, 7.5]], drag: [6], snap: 0.5, fit: true, r: true,
        alt: 'Seven points close to a climbing line, with the best-fit line drawn in. The top right point is orange and can be dragged.',
      },
      check: (s) => {
        if (s.r < 0) return true;
        if (s.r > 0.9) return 'Still almost a perfect line. Pull the orange point well away from the others.';
        return `Now r = ${num(s.r, 2)}: weaker, but not negative yet. Which corner is furthest from where the trend says this point should be?`;
      },
      solution: { points: [...LINE, [10, 0]] },
      hints: ['The trend says: far right means high up. Put the orange point far right and *low*.'],
      explain: r`
        One point out of seven turned a near-perfect positive correlation into a negative one.

        $r$ is worked out from all the points at once, and a point far from the rest has huge leverage, like the lone weight at the end of a ruler.
      `,
    },
    {
      id: 'teach-r-limits',
      type: 'info',
      title: 'Look at the plot, not just the number',
      text: r`
        $r$ is one number, and one number can be fooled in two ways.

        - **One unusual point** can change it a great deal, as you just saw. A surprising $r$ may be the work of a single dot.
        - **It only sees straight lines.** The dots in the figure are plainly related: they trace a perfect U. But the falling half cancels the climbing half, and $r = 0$.

        :::key
        Never trust $r$ on its own. **Look at the scatter plot.**
        :::
      `,
      figure: {
        type: 'scatter-fit', x: [0, 10], y: [0, 10], points: U_SHAPE, fit: true, r: true, height: 340,
        alt: 'Nine points that trace a U: high on the left, lowest in the middle, high again on the right. The line of best fit is flat and r is 0.',
        caption: 'A perfect U: a clear pattern, a flat line of best fit, and r = 0.',
      },
    },
    {
      id: 'ice-cream',
      type: 'choice',
      title: 'The correlation trap',
      text: `
        Now a pattern from the real world. Month by month, ice-cream sales and the number of drownings rise and fall together: a strong positive correlation.
        Both are highest in the hot summer months.

        **What is the most sensible explanation?**
      `,
      options: [
        { text: 'Hot weather drives both: people buy ice cream, and people go swimming', correct: true },
        { text: 'Eating ice cream makes swimmers more likely to drown', why: 'Before believing that, ask whether something else could be pushing both numbers up at the same time.' },
        { text: 'News of drownings makes people buy ice cream', why: 'Turning the arrow around does not help. Ask whether something else could be pushing both numbers up at the same time.' },
        { text: 'It is pure coincidence', why: 'The pattern returns every single summer, so chance is a poor explanation. Something real is behind it.' },
      ],
      columns: 1,
      explain: `
        Summer heat sends people to the ice-cream stand and into the water. More swimmers means more accidents.
        The two numbers move together because they share a cause, not because one causes the other.
      `,
    },
    {
      id: 'traps',
      type: 'info',
      title: 'Correlation is not causation',
      text: `
        When two things move together, it is tempting to say that one *causes* the other. There are three other explanations to rule out first.

        - **A third factor** drives both. Heat raises ice-cream sales *and* swimming. (Statisticians call it a *confounder*.)
        - **The arrow points the other way.** Windmills turn faster on windy days, but windmills do not make the wind.
        - **Coincidence.** Compare enough unrelated numbers and some will line up by chance. In the United States, yearly cheese eating once tracked the number of people who died tangled in their bedsheets, for a whole decade.

        :::key
        A correlation tells you *that* two things move together. It cannot tell you *why*.
        :::
      `,
    },
    {
      id: 'sort-traps',
      type: 'bucket',
      text: 'Imagine reading these six findings. Sort each one by its most likely explanation.',
      buckets: ['A third factor drives both', 'The arrow points the other way', 'Coincidence'],
      items: [
        { text: 'Children with bigger feet read better', bucket: 0, why: 'Feet do not teach reading. Older children have bigger feet *and* more reading practice: age is behind both.' },
        { text: 'The more firefighters at a fire, the greater the damage', bucket: 0, why: 'A bigger fire brings more firefighters and does more damage. The size of the fire is behind both.' },
        { text: 'People who take painkillers often have more headaches', bucket: 1, why: 'The headaches come first: they are the reason for the painkillers.' },
        { text: 'Students with a private tutor have lower marks', bucket: 1, why: 'Low marks are usually why a tutor is hired in the first place.' },
        { text: 'A city’s sales of yellow cars tracked the price of bananas abroad', bucket: 2, why: 'Nothing plausibly connects these. Compare enough pairs of numbers and some will match by luck.' },
        { text: 'Cheese eaten per person tracked deaths by tangled bedsheets', bucket: 2, why: 'Nothing plausibly connects these. Compare enough pairs of numbers and some will match by luck.' },
      ],
      explain: `
        Age lies behind foot size and reading. The size of the fire lies behind both firefighters and damage.
        Headaches lead to painkillers, and low marks lead to tutoring: the arrow runs backwards.
        Cars, bananas, cheese and bedsheets have nothing to do with each other.
      `,
    },
    {
      id: 'scenario',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const c = rng.pick(CASES);
        return {
          text: `**${c.finding}**\n\nSomeone concludes: *"${c.claim}"*\n\nWhat is a more likely explanation for the pattern?`,
          options: [
            { text: c.right, correct: true },
            { text: c.other[0], why: c.other[1] },
            { text: 'No other explanation is needed: a clear correlation is proof', why: 'A correlation shows that two things move together. On its own it cannot show which, if either, is the cause.' },
          ],
          columns: 1,
          explain: `${c.explain}\n\nBefore accepting "A causes B", always ask: could something else cause both? Could B be causing A? Could it be chance?`,
        };
      },
    },
    {
      id: 'teach-experiment',
      type: 'info',
      title: 'So how do you show a cause?',
      text: `
        Just watching what happens cannot rule out a third factor. To show a cause, **change one thing yourself** and keep everything else alike:

        1. Split the cases into two groups **by chance**, for example by tossing a coin for each one.
        2. Give one group the treatment and the other none.
        3. Compare the two groups afterwards.

        Chance makes the groups alike, on average, in everything else, even in things nobody thought of. This is a **randomised experiment**, and it is why new medicines are tested in randomised trials.

        :::example
        Does a new app help pupils learn words? A coin decides, pupil by pupil, who uses it. A month later, both groups take the same test.
        :::
      `,
    },
    {
      id: 'experiment',
      type: 'choice',
      stretch: true,
      title: 'Plan the test',
      text: `
        A gardener suspects that a new fertiliser makes tomato plants grow taller. She has 40 seedlings.

        **Which plan gives the most trustworthy answer?**
      `,
      options: [
        { text: 'Toss a coin for each seedling to decide whether it gets fertiliser, then compare the two groups', correct: true },
        { text: 'Give fertiliser to the 20 healthiest-looking seedlings and compare them with the rest', why: 'Then the fertilised group had a head start. You could not separate the effect of the fertiliser from the effect of being healthier to begin with.' },
        { text: 'Give fertiliser to all 40 and see whether they grow tall', why: 'Tall compared with what? Without a group that goes without, there is nothing to compare.' },
        { text: 'Ask other gardeners whether they use it, and compare their plants', why: 'Gardeners who buy a new fertiliser may differ in other ways: better soil, more sun, more care. That is the third-factor trap again.' },
      ],
      columns: 1,
      hints: ['The danger is a third factor that differs between the two groups. Which plan makes the groups alike in everything except the fertiliser?'],
      explain: `
        The coin lets chance decide who gets the treatment. Then the two groups are alike, on average, in everything else: soil, sun, starting size.
        If the fertilised group still ends up taller, the fertiliser is very likely the cause.
      `,
    },
    {
      id: 'r-truths',
      type: 'multi',
      review: true,
      text: r`Which of these statements about the correlation coefficient $r$ are **true**?`,
      options: [
        { text: r`$r = -0.8$ is a stronger association than $r = 0.5$`, correct: true },
        { text: r`A single unusual point can change $r$ a great deal`, correct: true },
        { text: r`$r$ is never larger than 1 or smaller than $-1$`, correct: true },
        { text: r`$r = 0.9$ proves that one thing causes the other`, why: 'A strong correlation shows that two things move together. A third factor, a reversed arrow or chance could still explain it.' },
        { text: r`$r = 0$ means the two things are not related in any way`, why: r`$r$ only measures straight-line trends. Dots arranged in a perfect U shape can have $r = 0$.` },
      ],
      explain: r`The size of $r$ gives the strength, so $-0.8$ beats $0.5$; the sign only gives the direction. $r$ stays between $-1$ and $1$, reacts strongly to unusual points, sees only straight-line patterns, and never proves a cause.`,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A headline reads: **"Teenagers who eat breakfast get better grades. Breakfast boosts brainpower!"**

        Suggest at least one other explanation for this pattern.
      `,
      model: `
        A **third factor** is easy to imagine: homes with calm mornings, enough money and regular routines may provide both breakfast and support with schoolwork. Enough sleep could lie behind both, too.

        The arrow might even point partly **the other way**: teenagers who are doing well at school may find it easier to get up in time to eat.

        To know whether breakfast itself helps, you would need an experiment in which chance decides who gets breakfast.
      `,
    },
  ],
  recap: [
    'A **scatter plot** shows how two measurements move together. A line of best fit sums up the trend.',
    'The correlation $r$ runs from −1 to +1. Its sign is the direction; its size is the strength of the straight-line pattern.',
    'Look at the plot, not just the number: one unusual point can change $r$ completely.',
    '**Correlation is not causation.** Rule out a third factor, a reversed arrow and coincidence. A randomised experiment settles it.',
  ],
  next: 'Next: how can a thousand people speak for a whole country?',
};
