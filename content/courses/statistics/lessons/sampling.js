// Data & Statistics · Lesson 5 · A Spoonful of Soup
import { num } from '../../../kit.js';
import { thousands } from '../helpers.js';

const pot = (extra) => ({ type: 'sampler', share: 0.6, ...extra });

// Two poll results with their margins of error, on an axis from 40% to 60% (15 units per point):
// A = 52 ± 4 (48 to 56) and B = 48 ± 4 (44 to 52). They overlap from 48 to 52.
const LEAD_RANGES = `
  <rect class="fill-violet-soft" x="150" y="26" width="60" height="84" rx="6"/>
  <text class="fig-label text-violet" x="180" y="18" text-anchor="middle">overlap</text>
  <line class="stroke-blue" x1="150" x2="270" y1="50" y2="50" stroke-width="8" stroke-linecap="round"/>
  <circle class="fill-blue stroke-ink" cx="210" cy="50" r="7" stroke-width="2"/>
  <text class="fig-label text-blue" x="284" y="55">A: 52%</text>
  <line class="stroke-orange" x1="90" x2="210" y1="86" y2="86" stroke-width="8" stroke-linecap="round"/>
  <circle class="fill-orange stroke-ink" cx="150" cy="86" r="7" stroke-width="2"/>
  <text class="fig-label text-orange" x="76" y="91" text-anchor="end">B: 48%</text>
  <g class="stroke-ink" stroke-width="2" stroke-linecap="round">
    <line x1="30" x2="330" y1="118" y2="118"/>
    <line x1="30" x2="30" y1="113" y2="123"/><line x1="90" x2="90" y1="113" y2="123"/><line x1="150" x2="150" y1="113" y2="123"/>
    <line x1="210" x2="210" y1="113" y2="123"/><line x1="270" x2="270" y1="113" y2="123"/><line x1="330" x2="330" y1="113" y2="123"/>
  </g>
  <g class="fig-label text-muted" text-anchor="middle">
    <text x="30" y="143">40%</text><text x="90" y="143">44%</text><text x="150" y="143">48%</text><text x="210" y="143">52%</text><text x="270" y="143">56%</text><text x="330" y="143">60%</text>
  </g>
`;

export default {
  id: 'sampling',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'How many people do you need to ask?',
      text: `
        A country has 50 million voters. A polling company wants to know what share of them support a new law, to within about 3 percentage points.

        If it picks voters at random, **roughly how many must it ask?**
      `,
      shuffle: false,
      options: [
        { text: 'About 1,000', correct: true },
        { text: 'About 50,000' },
        { text: 'About 500,000' },
        { text: 'About 5 million' },
      ],
      explain: `
        About **1,000** is enough. That is one voter in every 50,000, and it is the size of most national opinion polls.

        It works for the same reason a cook can judge a whole pot of soup from one spoonful. In this lesson you will see when a small sample can be trusted, and what ruins it.
      `,
    },
    {
      id: 'ten-beads',
      type: 'interact',
      graded: false,
      title: 'A spoonful of beads',
      text: `
        This pot holds 1,000 beads, well stirred. Exactly **60%** of them are teal.
        One sample is 10 beads picked at random; its share of teal beads lands on the strip underneath.

        **Draw at least 8 samples** and watch where they land.
      `,
      widget: pot({ rows: [{ n: 10 }], alt: 'A pot of 1,000 beads, 60 percent teal, and a strip where each sample of 10 leaves a dot at its percentage.' }),
      check: (s) => s.counts[0] >= 8 || `You have drawn ${s.counts[0]} so far. Keep going until you have at least 8.`,
      solution: { counts: [8] },
      explain: `
        No two samples need agree. One says 40% teal, the next says 80%, and a sample of 10 can never say 65%.

        Still, the dots are not just anywhere. They scatter *around* the true 60%. A sample of 10 is a rough guide: better than nothing, and nothing like certain.
      `,
    },
    {
      id: 'bigger-spoons',
      type: 'interact',
      graded: false,
      title: 'Bigger spoons',
      text: `
        Ten samples of 10 are already on the top strip. Now try bigger samples from the same pot.

        **Draw at least 15 samples of 40, and at least 15 samples of 160.** Compare the three piles.
      `,
      widget: pot({
        rows: [{ n: 10 }, { n: 40 }, { n: 160 }], row: 1, start: [10, 0, 0], pickLabel: 'Sample size:',
        alt: 'The pot of beads with three strips, for samples of 10, 40 and 160.',
      }),
      check: (s) => {
        if (s.counts[1] < 15) return `You have ${s.counts[1]} samples of 40 so far. Draw at least 15.`;
        if (s.counts[2] < 15) return `Now choose n = 160 and draw at least 15 samples. You have ${s.counts[2]}.`;
        return true;
      },
      solution: { counts: [10, 15, 15], row: 2 },
      explain: `
        The bigger the sample, the tighter the pile around the true 60%. Samples of 10 land anywhere from about 30% to 90%.
        Samples of 160 almost all land within about 7 points of it.

        Every sample still misses a little, and no two agree exactly. But a large random sample cannot miss by much.
      `,
    },
    {
      id: 'teach-sample',
      type: 'info',
      title: 'Population and sample',
      text: `
        Statisticians have names for the pot and the spoonful.

        - The **population** is the whole group you want to know about: all 1,000 beads, or all 50 million voters.
        - A **sample** is the part you actually look at: 40 beads, or the people a poll questions.
        - In a **random sample**, every member of the population has the same chance of being picked. That is the stirring.

        You have seen what random samples do. They wobble around the truth, and bigger ones wobble less.
      `,
      figure: pot({
        rows: [{ n: 40 }], start: [1],
        alt: 'The pot of 1,000 beads with one random sample of 40 beads ringed. The strip underneath marks the percentage of teal beads in that sample.',
        caption: 'The pot is the population. The ringed beads are one random sample of 40. Draw a few more.',
      }),
    },
    {
      id: 'halving',
      type: 'choice',
      title: 'How fast does it tighten?',
      text: `
        Here are 40 samples of each size. The shaded bands show where about 95% of all samples land: within 31 points of the truth for samples of 10, and so on.

        Each row uses a sample **four times** as large as the row above. **What happens to the width of the band each time?**
      `,
      figure: pot({
        rows: [{ n: 10 }, { n: 40 }, { n: 160 }], start: [40, 40, 40], band: true, row: 0, pickLabel: 'Sample size:',
        alt: 'Three strips of sample results. The bands are plus or minus 31 points for samples of 10, plus or minus 15 for samples of 40 and plus or minus 7 for samples of 160.',
      }),
      options: [
        { text: 'It roughly halves', correct: true },
        { text: 'It shrinks to a quarter', why: 'Check the labels: ±31, then ±15, then ±7. Four times the sample buys less than you might hope.' },
        { text: 'It shrinks by the same number of points', why: 'From 31 to 15 is a drop of 16 points, but from 15 to 7 is a drop of only 8. Compare the ratios instead.' },
        { text: 'It stays about the same', why: 'Check the labels: ±31, then ±15, then ±7.' },
      ],
      explain: `
        From ±31 to ±15 to ±7: each time the sample grows fourfold, the band halves.

        Four times the work buys only twice the precision.
      `,
    },
    {
      id: 'margin',
      type: 'info',
      title: 'The margin of error',
      text: `
        That band has a name. A poll's **margin of error** is the distance within which about 95% of random samples land from the truth. Roughly:

        | People asked (at random) | Margin of error |
        |---:|:---:|
        | 100 | ± 10 points |
        | 400 | ± 5 points |
        | 1,000 | ± 3 points |
        | 10,000 | ± 1 point |

        So "54% support the law, margin of error 3 points" means: the true figure is very probably between 51% and 57%.

        Notice what the table does not ask: how big the population is. The margin of error depends on how many people are in the sample, and hardly at all on how many people there are altogether.
      `,
    },
    {
      id: 'cauldron',
      type: 'choice',
      title: 'The pot does not matter',
      text: `
        A cook tastes one spoonful from a small saucepan of soup, then one spoonful from a cauldron a hundred times bigger. Both have been stirred well.

        **Is the spoonful from the cauldron a worse guide to its soup?**
      `,
      options: [
        { text: 'No. What counts is the size of the spoon and the stirring, not the size of the pot', correct: true },
        { text: 'Yes. A spoonful is a much smaller fraction of the cauldron', why: 'It is a smaller fraction, but that hardly matters. A well-stirred spoonful tastes like the pot it came from, whatever the size of the pot.' },
        { text: 'Yes. The cook would need a hundred spoonfuls to be fair', why: 'If the soup is well stirred, every spoonful is a fair sample already. The size of the pot does not change that.' },
      ],
      columns: 1,
      explain: `
        A well-stirred spoonful tastes like its pot, whether the pot holds 2 litres or 200.

        It is the same with surveys: what counts is **how many people are asked**, not how many people there are. That is why 1,000 random voters can speak for 50 million as well as for 5 million.
      `,
    },
    {
      id: 'example-margin',
      type: 'info',
      title: 'Precision is expensive',
      text: `
        You saw the band halve each time the sample grew fourfold. The same rule works for any cut:

        :::key
        To make the margin of error **k times smaller**, you need **k × k times** as many people. Half the margin costs 4 times the sample. A tenth of it costs 100 times.
        :::

        :::example
        A poll of 1,600 people has a margin of error of about ±2.5 points. How many people would cut that to a third, about ±0.8?

        A third means 3 times smaller, so you need 3 × 3 = 9 times as many: 1,600 × 9 = **14,400 people**.
        :::
      `,
    },
    {
      id: 'margin-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [n, m] = rng.pick([[100, 10], [400, 5], [625, 4], [1000, 3], [2500, 2]]);
        const k = rng.pick([2, 3, 4, 5, 10]);
        const words = { 2: 'half', 3: 'a third', 4: 'a quarter', 5: 'a fifth', 10: 'a tenth' };
        return {
          text: `
            A random sample's margin of error shrinks slowly: to make it ${k} times smaller, you need ${k} × ${k} times as many people.

            A poll of **${thousands(n)}** randomly chosen people has a margin of error of about ±${m} points.
            **How many people would it take to cut that to ${words[k]}** (about ±${num(m / k, 1)} ${m === k ? 'point' : 'points'})?
          `,
          answer: n * k * k,
          unit: 'people',
          wrong: [
            [n * k, `${k} times the people is not enough. The margin shrinks with the *square root* of the sample, so ${k} times smaller needs ${k} × ${k} = ${k * k} times as many.`],
            [n * k * k * k, `Too many: ${k} × ${k} = ${k * k} times the sample is enough.`],
          ],
          feedback: (v) => (v <= n ? 'A smaller margin needs *more* people than before, not fewer.' : null),
          hints: [`${k} times smaller needs ${k} × ${k} = ${k * k} times as many people.`],
          explain: `To cut the margin to ${words[k]}, multiply the sample by $${k}^2 = ${k * k}$: $${n} \\times ${k * k} = ${n * k * k}$ people.`,
        };
      },
    },
    {
      id: 'digest',
      type: 'choice',
      mode: 'predict',
      title: 'The poll with 2.4 million answers',
      text: `
        In 1936 an American magazine, the *Literary Digest*, mailed out mock ballots for the presidential election to its subscribers and to people listed in telephone books and car registrations. About **2.4 million** people sent them back.

        A young pollster, George Gallup, questioned only about **50,000** people, chosen to resemble the whole electorate. The two polls named different winners.

        **Which poll got it right?**
      `,
      shuffle: false,
      options: [
        { text: 'The Literary Digest, with 2.4 million answers' },
        { text: 'Gallup, with about 50,000', correct: true },
      ],
      explain: `
        Gallup. The Digest predicted a comfortable win for Alf Landon. Franklin Roosevelt won 46 of the 48 states.

        In the middle of the Great Depression, people with telephones, cars and magazine subscriptions were richer than the average voter, and voted differently. And most of the people who were sent a ballot never replied.
        A mountain of answers from the wrong people gave a confident, wrong result.
      `,
    },
    {
      id: 'unstirred',
      type: 'interact',
      title: 'Soup that was never stirred',
      text: `
        This pot has **not** been stirred: the teal beads float towards the top. Overall, 60% of the beads are still teal.

        One spoon takes 100 beads from the top layers. The other takes only 25, but from all over the pot.
        **Draw at least 10 samples each way.** Which spoon would you trust?
      `,
      widget: pot({
        stirred: false, rows: [{ n: 100, method: 'top', label: 'top 100' }, { n: 25, label: 'random 25' }], pickLabel: 'Spoon:',
        alt: 'An unstirred pot with more teal beads near the top, and two strips: samples of 100 from the top layers and random samples of 25.',
      }),
      check: (s) => {
        if (s.counts[0] < 10) return `Draw at least 10 samples with the "top 100" spoon. You have ${s.counts[0]}.`;
        if (s.counts[1] < 10) return `Now switch to "random 25" and draw at least 10 samples. You have ${s.counts[1]}.`;
        return true;
      },
      solution: { counts: [10, 10], row: 1 },
      explain: `
        The big spoon gives nearly the same answer every time: about 90% teal. Consistent, confident and wrong, because it only ever sees the top of the pot.

        The small random samples wobble a lot, but they wobble around the true 60%. Taking 200 beads from the top instead of 100 would not help at all.
      `,
    },
    {
      id: 'teach-bias',
      type: 'info',
      title: 'Bias: when the stirring is missing',
      text: `
        A way of choosing that favours some members of the population over others is **biased**. Two common sources:

        - **Some people cannot be picked.** The Digest wrote to people with telephones and cars, who were richer than the average voter.
        - **People choose themselves.** Most of those who got a ballot never replied. The ones who did were *self-selected*.

        :::example
        A café asks its own customers whether they like coffee. Biased: people who dislike coffee are not in the room.
        :::

        :::key
        A bigger sample shrinks random wobble. It does nothing about **bias**.
        :::
      `,
    },
    {
      id: 'fair-or-biased',
      type: 'bucket',
      text: 'A **random** sample gives everyone the same chance of being picked: that is the stirring. Sort these ways of choosing whom to ask.',
      buckets: ['Fair: chosen at random', 'Biased'],
      items: [
        { text: 'Draw 500 names by lottery from the full list of residents', bucket: 0, why: 'A lottery over the full list gives every resident the same chance. That is a random sample.' },
        { text: 'A computer picks 200 customers at random from all customers', bucket: 0, why: 'Every customer has the same chance of being picked. That is a random sample.' },
        { text: 'An online poll that anyone can click on', bucket: 1, why: 'People choose themselves here, and those with strong opinions click most. The quiet majority is missing.' },
        { text: 'Ask people leaving a gym how much they exercise', bucket: 1, why: 'Everyone leaving a gym has just exercised. People who never exercise cannot be picked.' },
        { text: 'A survey about internet use, sent out by email', bucket: 1, why: 'People who are rarely online will rarely answer an email. The sample leans towards heavy users.' },
        { text: 'The reviews customers chose to post about a product', bucket: 1, why: 'Delighted and furious customers write reviews. The many who were simply satisfied mostly stay silent.' },
      ],
      explain: `
        In every biased case, some people are more likely to end up in the sample than others, and the reason is tied to the very thing being measured.
        Asking more gym-goers, or collecting more clicks, only makes the wrong answer look more convincing.
      `,
    },
    {
      id: 'which-poll',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { place: 'A city', about: 'a new tram line', big: 'an online poll on the tram company’s website, open to anyone', list: 'the register of residents', who: 'residents', sizes: [40000, 60000, 90000] },
          { place: 'A TV channel', about: 'a ban on fireworks', big: 'a phone-in vote during its evening show', list: 'all adults in the country', who: 'adults', sizes: [150000, 250000, 400000] },
          { place: 'A university', about: 'longer library opening hours', big: 'a form left on the tables in the library', list: 'the full list of students', who: 'students', sizes: [5000, 8000, 12000] },
          { place: 'A newspaper', about: 'a sugar tax', big: 'a click poll underneath an article attacking the tax', list: 'the electoral register', who: 'voters', sizes: [30000, 50000, 80000] },
        ]);
        const [n, m] = rng.pick([[400, 5], [625, 4], [1000, 3], [1600, 2.5]]);
        const huge = rng.pick(scene.sizes);
        return {
          text: `
            ${scene.place} wants to know what share of ${scene.who} support ${scene.about}. It has two results:

            - **Poll A:** ${thousands(huge)} answers from ${scene.big}.
            - **Poll B:** ${thousands(n)} ${scene.who} picked at random from ${scene.list}.

            Which result deserves more trust?
          `,
          options: [
            { text: 'Poll B: random choice matters more than sheer size', correct: true },
            { text: `Poll A: ${thousands(huge)} answers must beat ${thousands(n)}`, why: 'Poll A’s people chose themselves, so they are not typical. More answers of that kind only repeat the same bias more confidently.' },
            { text: 'Neither: Poll B is far too small to mean anything', why: `A random sample of ${thousands(n)} has a margin of error of only about ±${m} points. Small, but honest.` },
            { text: 'Average the two results', why: 'Mixing a biased figure into an unbiased one just contaminates the good one.' },
          ],
          columns: 1,
          explain: `
            Poll B is a random sample, so its only error is random wobble: about ±${m} points for ${thousands(n)} people.

            Poll A is huge but self-selected: the people who answered are those who cared enough to. No amount of extra answers fixes that.
          `,
        };
      },
    },
    {
      id: 'example-lead',
      type: 'info',
      title: 'Is the lead real?',
      text: `
        A poll gives every share with the same margin of error. So before you believe a lead, give both sides their range.

        :::example
        625 random voters: **52%** for A, **48%** for B. Margin of error: about ±4 points.

        - A is somewhere between 48% and 56%.
        - B is somewhere between 44% and 52%.

        The ranges overlap, so B may well be in front: too close to call.
        Had the poll said 60% against 40%, the ranges (56 to 64, and 36 to 44) would be far apart: a real lead.
        :::

        :::key
        A lead only counts when it is clearly bigger than the margin of error.
        :::
      `,
      figure: {
        type: 'svg', viewBox: '0 0 360 150', maxWidth: 420, content: LEAD_RANGES,
        alt: 'A percentage axis from 40 to 60. The range for A runs from 48 to 56, centred on 52. The range for B runs from 44 to 52, centred on 48. The two ranges overlap between 48 and 52.',
        caption: '52% against 48%, each give or take 4 points: the two ranges share the stretch from 48 to 52.',
      },
    },
    {
      id: 'too-close',
      type: 'choice',
      review: true,
      stretch: true,
      gen: (rng) => {
        const scene = rng.pick([
          { intro: 'Two candidates are standing for mayor.', a: 'Candidate A', b: 'Candidate B', ahead: 'Candidate A is ahead!' },
          { intro: 'A town is about to vote on building a new bridge.', a: 'Yes', b: 'No', ahead: 'Yes is ahead!' },
          { intro: 'A club is choosing between two designs for its new logo.', a: 'the red design', b: 'the blue design', ahead: 'Red is winning!' },
        ]);
        const [n, m] = rng.pick([[400, 5], [1000, 3], [2500, 2]]);
        const close = rng.bool();
        const lead = close ? rng.pick(m === 5 ? [2, 4] : [2]) : rng.pick(m === 5 ? [20, 24] : m === 3 ? [12, 16] : [8, 10]);
        const a = 50 + lead / 2;
        const b = 50 - lead / 2;
        const ranges = `${scene.a} is somewhere between about ${a - m}% and ${a + m}%, and ${scene.b} between about ${b - m}% and ${b + m}%`;
        return {
          text: `
            ${scene.intro} A poll of ${thousands(n)} randomly chosen voters finds **${a}% for ${scene.a}** and **${b}% for ${scene.b}**.
            Its margin of error is about ±${m} points.

            A headline announces: *"${scene.ahead}"* **Does the poll justify that?**
          `,
          options: [
            close
              ? { text: 'Yes: the lead is clearly bigger than the margin of error', why: `Compare the two numbers: the lead is ${lead} points and the margin of error is ${m}. Allowing for the margin, ${ranges}. Those ranges overlap.` }
              : { text: 'Yes: the lead is clearly bigger than the margin of error', correct: true },
            close
              ? { text: 'No: the lead is within the margin of error, so it is too close to call', correct: true }
              : { text: 'No: the lead is within the margin of error, so it is too close to call', why: `Compare the two numbers: the lead is ${lead} points and the margin of error only ${m}. Allowing for the margin, ${ranges}. Those ranges are far apart.` },
            { text: `No: ${thousands(n)} people are too few to tell us anything`, why: `A random sample of ${thousands(n)} is accurate to within about ${m} points. That is enough to see a big lead, though not a small one.` },
          ],
          shuffle: false,
          columns: 1,
          hints: [`How big is the lead, in points? How does that compare with the margin of error of ±${m}?`],
          explain: close
            ? `
              The lead is ${lead} points, no bigger than the margin of error. Allowing for it, ${ranges}.
              The ranges overlap, so ${scene.b} may well be the one in front. A lead inside the margin of error is no lead at all.
            `
            : `
              The lead is ${lead} points, many times the margin of error. Allowing for it, ${ranges}.
              The ranges are far apart, so the headline is fair. A lead only counts when it is clearly bigger than the margin of error.
            `,
        };
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements about samples are **true**?',
      options: [
        { text: 'A random sample of about 1,000 people can estimate a whole country’s opinion to within about 3 points', correct: true },
        { text: 'To halve the margin of error, you need four times as many people', correct: true },
        { text: 'Two random samples from the same population usually give slightly different results', correct: true },
        { text: 'A biased sample becomes accurate if it is made large enough', why: 'Size shrinks random wobble only. A biased method stays just as biased with ten times the answers.' },
        { text: 'A sample must contain at least 10% of the population to be reliable', why: 'The margin of error depends on how many people are asked, hardly at all on the size of the population. Think of the spoon and the cauldron.' },
      ],
      explain: 'Random samples wobble, and the wobble halves each time the sample grows fourfold, whatever the size of the population. Bias is a different problem: it does not shrink at all.',
    },
  ],
  recap: [
    'A **random sample** resembles the population in miniature. Different samples give slightly different answers.',
    'The **margin of error** shrinks slowly: four times the sample halves it. About 1,000 people give ±3 points.',
    'The size of the population hardly matters. The size of the sample does.',
    '**Bias beats size.** A huge sample chosen in a lopsided way is worse than a small random one.',
  ],
  next: 'Next: the numbers are honest, the chart is not. Learn to spot the tricks.',
};
