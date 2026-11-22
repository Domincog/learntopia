// Data & Statistics · Lesson 6 · Lying with Charts
import { r, num, round } from '../../../kit.js';
import { thousands } from '../helpers.js';

// Invented data: satisfaction scores in an advert, and burglaries per year in the made-up town of Milltown.
const BRANDS = [{ label: 'Rival', value: 96, color: 'gray' }, { label: 'NewWave', value: 98, color: 'pink' }];
const BURGLARIES = [520, 505, 512, 480, 462, 470, 441, 420, 432, 455, 428, 398, 380, 362, 371, 340, 322, 310, 289, 268, 242, 251, 278, 296, 284];

const advert = (extra) => ({ type: 'axis-trick', mode: 'baseline', data: BRANDS, top: 100, unit: '%', yLabel: 'satisfied customers', ...extra });
const milltown = (extra) => ({ type: 'axis-trick', mode: 'window', start: 2000, values: BURGLARIES, from: 2000, to: 2024, yLabel: 'burglaries per year', ...extra });

// Two lines, two axes: revenue (left, 0 to 100) and staff (right, 995 to 1015), 2020 to 2024.
const DUAL_AXES = `
  <g class="stroke-hair" stroke-width="1">
    <line x1="54" x2="306" y1="136.5" y2="136.5"/><line x1="54" x2="306" y1="99" y2="99"/><line x1="54" x2="306" y1="61.5" y2="61.5"/><line x1="54" x2="306" y1="24" y2="24"/>
  </g>
  <g class="stroke-ink" stroke-width="2" stroke-linecap="round"><line x1="54" x2="54" y1="24" y2="174"/><line x1="306" x2="306" y1="24" y2="174"/><line x1="54" x2="306" y1="174" y2="174"/></g>
  <g class="fig-label-sm" text-anchor="end">
    <text class="text-blue" x="47" y="178">0</text><text class="text-blue" x="47" y="140.5">25</text><text class="text-blue" x="47" y="103">50</text><text class="text-blue" x="47" y="65.5">75</text><text class="text-blue" x="47" y="28">100</text>
  </g>
  <g class="fig-label-sm" text-anchor="start">
    <text class="text-orange" x="313" y="178">995</text><text class="text-orange" x="313" y="140.5">1000</text><text class="text-orange" x="313" y="103">1005</text><text class="text-orange" x="313" y="65.5">1010</text><text class="text-orange" x="313" y="28">1015</text>
  </g>
  <g class="fig-label-sm" text-anchor="middle">
    <text class="text-muted" x="54" y="193">2020</text><text class="text-muted" x="117" y="193">2021</text><text class="text-muted" x="180" y="193">2022</text><text class="text-muted" x="243" y="193">2023</text><text class="text-muted" x="306" y="193">2024</text>
  </g>
  <line class="stroke-blue" x1="4" x2="24" y1="8" y2="8" stroke-width="4" stroke-linecap="round"/>
  <g class="fig-label-sm"><text class="text-blue" x="30" y="12">Revenue (millions)</text><text class="text-orange" x="326" y="12" text-anchor="end">Staff</text></g>
  <line class="stroke-orange" x1="334" x2="356" y1="8" y2="8" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 8"/>
  <path class="stroke-blue fill-none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M54 144 L117 121.5 L180 99 L243 76.5 L306 54"/>
  <path class="stroke-orange fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 8" d="M54 136.5 L117 121.5 L180 99 L243 76.5 L306 61.5"/>
  <g class="fill-blue stroke-ink" stroke-width="1.5"><circle cx="54" cy="144" r="4.5"/><circle cx="306" cy="54" r="4.5"/></g>
  <g class="fill-orange stroke-ink" stroke-width="1.5"><rect x="49.5" y="132" width="9" height="9" rx="2"/><rect x="301.5" y="57" width="9" height="9" rx="2"/></g>
`;

export default {
  id: 'misleading-data',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Three times better?',
      text: `
        An advert for the phone company NewWave shows this chart of customer satisfaction. (It is invented, but you have seen adverts like it.)

        The NewWave bar is three times as tall as its rival's. **How much larger is NewWave's score really?**
      `,
      figure: advert({ base: 95, locked: true, readouts: false, alt: 'A bar chart whose axis starts at 95. Rival: 96 percent. NewWave: 98 percent.' }),
      shuffle: false,
      options: [
        { text: 'About 3 times as large' },
        { text: 'About twice as large' },
        { text: 'About 2% larger', correct: true },
      ],
      explain: `
        Read the numbers, not the bars: 98% against 96%. NewWave's score is about 2% larger.

        The bars look so different because the axis starts at 95 instead of 0. You are only shown the very tips of two tall bars.
        Every number on the chart is true, and the picture still misleads. This lesson is a tour of such tricks.
      `,
    },
    {
      id: 'teach-bars',
      type: 'info',
      title: 'How a bar says its number',
      text: r`
        A bar says its number with its **height**, measured from where the axis starts.

        :::example The advert
        Its axis starts at 95.

        - Rival: $96 - 95 = 1$ unit tall.
        - NewWave: $98 - 95 = 3$ units tall.

        So NewWave is drawn 3 times as tall, although 98 is only about 2% more than 96.
        :::

        Start the axis at 0 instead, and the bars are 96 and 98 units tall: almost equal, as the numbers are.
      `,
      figure: [
        advert({ base: 95, locked: true, readouts: false, caption: 'Axis from 95', alt: 'The advert’s bar chart with its axis starting at 95. The NewWave bar, 98 percent, is three times as tall as the Rival bar, 96 percent.' }),
        advert({ base: 0, locked: true, readouts: false, caption: 'Axis from 0', alt: 'The same two bars, 96 and 98 percent, on an axis that starts at 0. They look almost equal.' }),
      ],
    },
    {
      id: 'stretch-axis',
      type: 'interact',
      title: 'Now you are the advertiser',
      text: `
        Here is the honest version again, with the axis starting at 0.

        **Move the start of the axis until the NewWave bar is drawn exactly twice as tall as its rival's.**
      `,
      widget: advert({ base: 0, maxBase: 95, alt: 'The same two bars, 96 and 98 percent, with a slider that moves the start of the axis.' }),
      check: (s) => {
        if (Math.abs(s.looks - 2) < 0.005) return true;
        if (s.looks < 2) return `NewWave is drawn ${num(s.looks, 2)} times as tall. Not dramatic enough: raise the start of the axis.`;
        return `NewWave is now drawn ${num(s.looks, 2)} times as tall. Too much: lower the start of the axis a little.`;
      },
      solution: { base: 94 },
      hints: [
        'A bar is drawn from the start of the axis up to its value. So its drawn height is the value minus the start.',
        'You need 98 − start to be twice 96 − start.',
      ],
      explain: r`
        Start the axis at **94**. Then the bars are drawn $98 - 94 = 4$ and $96 - 94 = 2$ units tall: twice as tall, from a 2% difference.

        Start at 95 and it is three times. Start at 95.5 and it is five times. The data never changes. Only the part of it you are shown does.
      `,
    },
    {
      id: 'zero-rule',
      type: 'info',
      title: 'The truncated axis',
      text: `
        An axis that does not start at zero is called **truncated**. On a bar chart it is poison, because a bar says its number with its *length*. Cut the bottom off, and the lengths lie.

        :::key
        **Bars must start at zero.** Before comparing any shapes, read the numbers on the axis.
        :::

        Line charts are different: zooming in on the interesting part of a line is often fine. But the same warning applies. A zoomed-in axis makes small wiggles look like cliffs, so read the scale first.
      `,
    },
    {
      id: 'drawn-ratio',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { what: 'A brochure compares the average exam mark at two schools', a: 'Other school', b: 'Our school' },
          { what: 'A leaflet compares the votes for one party in two elections, in thousands', a: 'Last time', b: 'This time' },
          { what: 'A shop compares how many buyers out of 100 rated each of two phones as "good"', a: 'Phone A', b: 'Phone B' },
          { what: 'A gym advert compares how many members two gyms have, in hundreds', a: 'Their gym', b: 'Our gym' },
        ]);
        const base = rng.pick([50, 60, 70, 80]);
        const d = rng.int(1, 2);
        const k = rng.pick([2, 3, 4, 5]);
        const a = base + d;
        const b = base + k * d;
        const top = base + Math.ceil((k * d + 1) / 5) * 5;
        const pct = round((b / a - 1) * 100, 0);
        return {
          text: `
            ${scene.what}. The axis of the bar chart starts at **${base}**, not at 0.

            **How many times as tall as the "${scene.a}" bar is the "${scene.b}" bar drawn?**
          `,
          figure: {
            type: 'axis-trick', mode: 'baseline', locked: true, readouts: false, base, top,
            data: [{ label: scene.a, value: a, color: 'gray' }, { label: scene.b, value: b, color: 'pink' }],
            alt: `A bar chart with its axis starting at ${base}. ${scene.a}: ${a}. ${scene.b}: ${b}.`,
          },
          answer: k,
          unit: 'times as tall',
          wrong: [[b - a, `${b - a} is the gap between the two values. Compare the drawn *heights*: each bar starts at ${base}.`]],
          feedback: (v) => (v > 1 && v < 1.9 ? `That is close to how the two *values* compare. The question is about the drawn bars, which start at ${base}, not at 0.` : null),
          hints: [
            `A bar's drawn height is its value minus ${base}, where the axis starts.`,
            `${scene.a}: ${a} − ${base} = ${d}. ${scene.b}: ${b} − ${base} = ${k * d}.`,
          ],
          explain: r`
            Measured from the start of the axis, the bars are $${a} - ${base} = ${d}$ and $${b} - ${base} = ${k * d}$ units tall. So "${scene.b}" is drawn **${k} times** as tall.

            The real values, ${a} and ${b}, differ by only about ${pct}%.
          `,
        };
      },
    },
    {
      id: 'cherry',
      type: 'interact',
      attempts: 6,
      title: 'Choose your years',
      text: `
        The sideways axis can be cropped too. Here are the burglaries recorded each year in Milltown, a made-up town, from 2000 to 2024.

        A campaign wants a frightening headline. **Choose a stretch of at least three years in which burglaries rise by 15% or more.**
      `,
      widget: milltown({ alt: 'Line chart of burglaries in Milltown from 2000 to 2024, falling from 520 to 284 with a few short rises. Two handles choose which years are shown.' }),
      check: (s) => {
        if (s.span < 2) return 'That window shows only two years. Show at least three.';
        if (Math.round(s.percent) >= 15) return true;   // the readout shows whole percents, so judge what the learner sees
        if (s.percent <= 0) return `In this window burglaries ${s.percent === 0 ? 'do not change' : `fall by ${Math.round(-s.percent)}%`}. Look for a stretch where the line climbs.`;
        return `Up by ${Math.round(s.percent)}%: not frightening enough. Start the window at the lowest point you can find.`;
      },
      solution: { from: 2020, to: 2023 },
      hints: ['The lowest year on the whole chart is 2020. What happens if the window starts exactly there?'],
      explain: `
        The most dramatic choice is 2020 to 2023: a rise of 22%. The headline "Burglaries up 22%!" would be true.

        It would also hide the twenty years before, in which burglaries more than halved.
      `,
    },
    {
      id: 'teach-cherry',
      type: 'info',
      title: 'Cherry-picking',
      text: r`
        Picking the years that suit your story is called **cherry-picking**. Starting the clock at the lowest (or highest) point is its favourite move.

        It works because a change is measured against where it *started*:

        :::example Two true headlines
        - 2020 to 2023: from 242 to 296. That is 54 more, and $54 \div 242 \approx 0.22$: **up 22%**.
        - 2000 to 2024: from 520 to 284. That is 236 fewer, and $236 \div 520 \approx 0.45$: **down 45%**.
        :::

        Both sums are right. Only the second covers the whole record. So always ask what happened before the chart begins.
      `,
      figure: [
        milltown({ from: 2020, to: 2023, locked: true, caption: 'The chosen years', alt: 'Line chart of burglaries in Milltown from 2020 to 2023 only: a steep climb from 242 to 296.' }),
        milltown({ locked: true, caption: 'The whole record', alt: 'Line chart of burglaries in Milltown from 2000 to 2024: a long fall from 520 to a low of 242 in 2020, then a small rise to 284.' }),
      ],
    },
    {
      id: 'fair-headline',
      type: 'choice',
      text: 'Here is the whole record again. **Which headline is the fairest summary of these 25 years?**',
      figure: milltown({ locked: true, alt: 'Burglaries in Milltown: 520 in the year 2000, falling to a low of 242 in 2020, then 284 in 2024.' }),
      options: [
        { text: 'Burglaries have almost halved since 2000, despite a recent rise', correct: true },
        { text: 'Burglaries up 22% in three years', why: 'True for 2020 to 2023. But it starts the clock at the lowest point in 25 years and leaves out everything before.' },
        { text: 'Burglaries at a record high', why: 'The record, 520, was in 2000. The latest figure is little more than half of that.' },
        { text: 'Burglaries have hardly changed', why: 'From 520 down to 284 is a fall of about 45%. That is a big change.' },
      ],
      columns: 1,
      explain: 'From 520 to 284 is a fall of about 45%, and the last few years did see a rise. A fair summary gives the long view first and the recent twist second.',
    },
    {
      id: 'pill',
      type: 'choice',
      title: 'Double what?',
      text: `
        In 1995, a health warning in the United Kingdom said that a new kind of contraceptive pill **doubled** the risk of dangerous blood clots. Many women were frightened into stopping the pill.

        The numbers behind the warning: the risk rose from about 1 in 7,000 women to about 2 in 7,000.

        **Which statement describes the very same change?**
      `,
      options: [
        { text: 'About 1 extra case for every 7,000 women', correct: true },
        { text: 'About 100 extra cases for every 7,000 women', why: '"100% more" means the old number once again on top. The old number was 1 case, so that is 1 more case, not 100.' },
        { text: 'Half of the women taking the pill were affected', why: '"Doubled" compares the new risk with the old one. It says nothing about the risk being 50%.' },
        { text: 'The risk rose to 2 in 100', why: 'Check the base: 2 in 7,000 is about 0.03%, far less than 2 in 100.' },
      ],
      columns: 1,
      explain: `
        From 1 in 7,000 to 2 in 7,000 is one more case among 7,000 women. "Doubled" and "one extra case in 7,000" are both true: they describe the very same change.

        When the starting number is tiny, "doubled" sounds far more dramatic than it is. Always ask: *double what?*
      `,
    },
    {
      id: 'teach-relative',
      type: 'info',
      title: 'Relative and absolute change',
      text: `
        There are two honest ways to report one change.

        - The **relative** change compares the new risk with the old one: "doubled".
        - The **absolute** change says what actually happens to people: "one extra case in 7,000".

        | Headline | New risk |
        |---|---|
        | "doubles" | 2 × the old risk |
        | "triples" | 3 × the old risk |
        | "up 50%" | the old risk plus half of it |

        :::example
        "Raises the risk by 25%!" The small print: normally 8 in every 20,000 people.
        A quarter of 8 is 2, so the risk goes from 8 to 10 in every 20,000: **2 extra cases**.
        :::
      `,
    },
    {
      id: 'extra-cases',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { cause: 'Night shifts', many: true, verb: 'work night shifts', ill: 'a rare sleep disorder' },
          { cause: 'A popular painkiller', many: false, verb: 'take the painkiller', ill: 'a rare stomach bleed' },
          { cause: 'A common food colouring', many: false, verb: 'eat the colouring', ill: 'a rare allergy' },
          { cause: 'Daily energy drinks', many: true, verb: 'have a daily energy drink', ill: 'a rare heart rhythm problem' },
        ]);
        const size = rng.pick([1000, 10000, 100000]);
        const factor = rng.pick([2, 2, 3, 1.5]);
        const base = factor === 1.5 ? rng.pick([2, 4, 6]) : rng.int(1, 5);
        const now = base * factor;
        const es = scene.many ? '' : 's';
        const headline = factor === 2 ? `${scene.cause} double${es} the risk of ${scene.ill}!`
          : factor === 3 ? `${scene.cause} triple${es} the risk of ${scene.ill}!`
            : `${scene.cause} raise${es} the risk of ${scene.ill} by 50%!`;
        const share = factor === 2 ? '100%' : factor === 3 ? '200%' : '50%';
        return {
          text: `
            Imagine this headline: **"${headline}"**

            The small print: ${scene.ill} normally affects ${base} in every ${thousands(size)} people.

            **Among ${thousands(size)} people who ${scene.verb}, how many *extra* cases does the headline amount to?**
          `,
          answer: now - base,
          unit: 'extra cases',
          wrong: [
            [now, `${now} is the new total. ${base} of those cases would have happened anyway, so subtract them.`],
            [size * (factor - 1), `The headline compares the new risk with the old risk of ${base} in ${thousands(size)}. It does not apply to everybody.`],
          ],
          hints: [`First find the new number of cases per ${thousands(size)} people.`, `The risk goes from ${base} to ${now} in ${thousands(size)}. How many more is that?`],
          explain: `
            The risk goes from ${base} to ${now} in every ${thousands(size)}: **${now - base} extra ${now - base === 1 ? 'case' : 'cases'}**.
            "${share} more" is the relative change. ${now - base} in ${thousands(size)} is the absolute change, and it is the one that tells you how worried to be.
          `,
        };
      },
    },
    {
      id: 'dual-axes',
      type: 'numeric',
      title: 'Two lines, two rulers',
      text: `
        This chart from a company report suggests that staff numbers have grown hand in hand with revenue. Look closely: each line has its **own axis**.
        The solid line (revenue) is read on the left-hand axis, the dotted line (staff) on the right-hand one.

        **By what percentage did the staff grow from 2020 to 2024?**
      `,
      figure: {
        type: 'svg', viewBox: '0 0 360 200', maxWidth: 440, content: DUAL_AXES,
        alt: 'A chart with two lines that rise almost on top of each other. The solid line, revenue, uses the left axis from 0 to 100 million and goes from 20 to 80. The dotted line, staff, uses the right axis from 995 to 1015 and goes from 1000 to 1010.',
      },
      answer: 1,
      unit: '%',
      tolerance: 0.15,
      wrong: [
        [300, 'That is the growth in revenue, read from the left axis: from 20 to 80 million.'],
        [10, 'Staff grew by 10 *people*: from 1,000 to 1,010. What percentage of 1,000 is that?'],
        [4, 'Revenue became 4 times as large. The staff line belongs to the right-hand axis.'],
      ],
      hints: ['The dotted line starts at 1000 and ends at 1010 on the right-hand axis.', '10 more people on top of 1,000: what percentage is that?'],
      explain: `
        Staff went from 1,000 to 1,010: ten more people, or **1%**. Revenue went from 20 to 80 million: four times as much.

        The lines only travel together because each has its own, separately chosen axis. With two axes, any two rising lines can be made to overlap, or to cross wherever the designer likes.
      `,
    },
    {
      id: 'simpson',
      type: 'choice',
      stretch: true,
      title: 'The average that points the wrong way',
      text: `
        Two hospitals treat the same illness. (The numbers are invented.) Overall, Hospital B looks far better: 80% of its patients recovered, against 59% at Hospital A.

        | Recovered | Hospital A | Hospital B |
        |---|:---:|:---:|
        | Mild cases | 19 of 20 | 72 of 80 |
        | Severe cases | 40 of 80 | 8 of 20 |
        | **All patients** | **59 of 100** | **80 of 100** |

        You are about to be admitted. **Which hospital gives you the better chance?**
      `,
      options: [
        { text: 'Hospital A, whether your case is mild or severe', correct: true },
        { text: 'Hospital B: 80% beats 59%', why: 'Look at the rows above the total. Take the mild cases, then the severe cases: which hospital has the higher recovery rate each time?' },
        { text: 'Hospital B if your case is severe, Hospital A if it is mild', why: 'Check the severe row: 40 of 80 is 50% at Hospital A, while 8 of 20 is only 40% at Hospital B.' },
        { text: 'It makes no difference', why: 'It does. Work out the recovery rate in each row, for each hospital.' },
      ],
      columns: 1,
      hints: ['Turn each cell into a percentage: 19 of 20 is 95%, 72 of 80 is 90%, and so on.'],
      explain: `
        Hospital A is better for mild cases (95% against 90%) *and* for severe cases (50% against 40%).

        Its overall figure is worse only because it takes on far more severe cases: 80 of its 100 patients, against 20 at Hospital B.
        A total over a mixed group can point the opposite way from every group inside it. This is **Simpson's paradox**, and it has turned up in real studies of medical treatments and of university admissions.
      `,
    },
    {
      id: 'checklist',
      type: 'info',
      title: 'Six questions for any chart or statistic',
      text: `
        You now have a toolkit from this whole course. Before you believe a number, ask:

        1. **Where does the axis start?** Read the scale before the shapes.
        2. **Why these years?** What happened before and after?
        3. **Percent of what?** Ask for the actual numbers behind "doubled" or "up 50%".
        4. **Which average, and who is in it?** A mean can hide a long tail; a total can hide its groups.
        5. **Who was asked, and how were they chosen?** A biased sample stays biased, however big.
        6. **Is this a cause, or just a pattern?** Look for a third factor first.

        :::tip
        Being fooled is not about being bad at maths. It is about not asking. Now you know what to ask.
        :::
      `,
    },
    {
      id: 'questions',
      type: 'match',
      review: true,
      text: 'Each trick is defused by one simple question. Match them up.',
      pairs: [
        ['Bars that begin at 95 instead of 0', 'Where does the axis start?'],
        ['A chart that begins in the most convenient year', 'What happened before that?'],
        ['"Risk doubles!" with no numbers given', 'Double what?'],
        ['Two lines, each with its own scale', 'Do they share an axis?'],
        ['One average over very different groups', 'What about each group?'],
      ],
      explain: 'None of these tricks needs a single false number. Each one works by choosing what you see: part of an axis, part of the timeline, a ratio without its base, or a total without its parts.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Think of a chart, an advert or a headline with a number in it that you have seen recently.

        **Which of the six questions would you ask about it first, and what answer would change your mind?**
      `,
      model: `
        For example: an advert says "9 out of 10 customers recommend us." The first question is *who was asked, and how were they chosen?*

        If ten happy customers were hand-picked, or only people who love the product bothered to answer, the number means little. If it comes from a large random sample of all customers, it means a lot.
      `,
    },
  ],
  recap: [
    'A chart can mislead without a single false number. Check where each axis starts.',
    'A short time window can tell the opposite story from the long one. Ask what happened before.',
    '"Doubled" is a **relative** change. Ask for the **absolute** numbers: double what?',
    'An overall figure can hide, or even reverse, what happens inside each group.',
  ],
  next: 'That is the end of the course. The review queue will bring these ideas back just before you forget them.',
};
