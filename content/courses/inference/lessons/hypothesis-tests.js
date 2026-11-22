// Statistical Inference · Lesson 3 · Could It Be Chance?
import { r, num } from '../../../kit.js';
import { thousands, pct, binomTail, PLANTS } from '../helpers.js';

/** A coin that is fair by construction, flipped 20 times per run; the friend's coin gave 15 heads. */
const coin = (extra) => ({
  type: 'null-sim', kind: 'coin', n: 20, p: 0.5, observed: 15, success: 'heads', realLabel: 'her coin', verb: 'Flip', ...extra,
});

/** Stories for reading a p-value off a simulation: a null world, and results that are mildly to clearly surprising in it. */
const P_SCENES = [
  {
    n: 50, p: 0.5, results: [30, 31, 32, 33],
    setup: (k) => `A coin lands heads **${k} times in 50 flips**. Is it biased towards heads?`,
    world: 'a fair coin flipped 50 times', event: (k) => `${k} or more heads`, nothing: 'the coin is fair',
  },
  {
    n: 60, p: 1 / 6, results: [14, 15, 16, 17],
    setup: (k) => `A die shows a six **${k} times in 60 rolls**. Is it loaded?`,
    world: 'a fair die rolled 60 times', event: (k) => `${k} or more sixes`, nothing: 'the die is fair',
  },
  {
    n: 40, p: 0.25, results: [14, 15, 16, 17],
    setup: (k) => `A quiz has 40 questions with four possible answers each. A student who says he is only guessing gets **${k} right**. Is he really guessing?`,
    world: 'a pure guesser answering 40 questions', event: (k) => `${k} or more right`, nothing: 'he is only guessing',
  },
];

/** A thousand experiments, one in ten of them on a real effect: the crowd picture of the base-rate step and of the screen after it. */
const thousand = (extra) => ({
  type: 'icon-array', n: 1000, base: 0.1, sens: 0.8, fpr: 0.05,
  words: {
    people: 'experiments', has: 'testing a real effect', not: 'testing nothing', posVerb: 'come out significant',
    tp: 'real effect, significant', fn: 'real effect, missed', fp: 'no effect, significant', tn: 'no effect, not significant',
    stages: ['Every experiment', 'Which are real?', 'Run them all', 'Significant only'],
  },
  ...extra,
});

const CLAIMS = [
  { claim: 'a new fertiliser makes tomato plants grow taller', nothing: 'the fertiliser does nothing', works: 'the fertiliser works' },
  { claim: 'a redesigned web page gets more sign-ups', nothing: 'the new page makes no difference', works: 'the new page is better' },
  { claim: 'a memory-training game improves test scores', nothing: 'the game makes no difference', works: 'the game works' },
  { claim: 'a new running shoe makes runners faster', nothing: 'the shoe makes no difference', works: 'the shoe works' },
];
const ONE_IN = { 0.004: '4 experiments in 1,000', 0.01: '1 experiment in 100', 0.02: '2 experiments in 100', 0.03: '3 experiments in 100' };

export default {
  id: 'hypothesis-tests',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A suspicious coin',
      text: `
        A friend's coin lands **heads 15 times in 20 flips**. "It favours heads!" she says. Maybe. But even a perfectly fair coin does not give exactly 10 heads every time.

        **If the coin is fair, in what percentage of 20-flip runs would you expect 15 heads or more?**
      `,
      min: 0, max: 50, step: 1, answer: 2, tolerance: 2, unit: '%', start: 25,
      explain: `
        About **2%**: a fair coin does this roughly once in 50 runs. Rare, but far from impossible.

        You do not need a formula to find that number. You can ask a fair coin.
      `,
    },
    {
      id: 'simulate',
      type: 'interact',
      graded: false,
      title: 'Ask a fair coin',
      text: `
        This coin is fair *by construction*. One run is 20 flips, and its number of heads goes onto the pile. The dashed line marks your friend's result.

        **Flip at least 1,000 runs.** What share of them reach 15 heads or more?
      `,
      widget: coin({ buttons: [1, 100, 1000], alt: 'Twenty coins for the latest run of a fair coin, and a histogram of the number of heads per run, with a dashed line at 15 heads.' }),
      check: (s) => s.trials >= 1000 || `${thousands(s.trials)} ${s.trials === 1 ? 'run' : 'runs'} so far. Keep flipping until you have at least 1,000.`,
      solution: { trials: 1000 },
      explain: `
        Most runs give between 7 and 13 heads. Runs with 15 or more (orange) are rare: about **2 in every 100**. The exact long-run figure is 2.07%.

        So one of two things is true. Either the coin is fair and something that happens 2% of the time has just happened, or the coin is not fair.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'The null hypothesis and the p-value',
      text: r`
        You have just carried out a **hypothesis test**. Its logic has three parts.

        1. State the boring explanation: *nothing is going on, the coin is fair.* This is the **null hypothesis**.
        2. Work out, or simulate, what results that boring world produces.
        3. See how often it produces a result at least as extreme as the real one.

        That last share is the **p-value**.

        :::key
        The **p-value** is the probability, *if the null hypothesis is true*, of a result at least as extreme as the one actually observed.
        :::

        For the coin, $p \approx 0.02$. A small p-value says: if nothing were going on, data like these would be surprising.

        Throughout this course "extreme" is counted *in the direction of the claim*: 15 heads or more. Many published tests count surprises in both directions, which roughly doubles the p-value.
      `,
    },
    {
      id: 'example-p',
      type: 'info',
      title: 'Worked example: a p-value from a simulation',
      text: r`
        A fairground spinner should land on red **1 time in 5**. In 30 spins it lands on red **11 times**, where a fair one would average 6. Is it rigged towards red?

        :::example
        1. Null hypothesis: the spinner is fair, so red has a chance of 1 in 5 on every spin.
        2. A computer simulates 30 spins of a fair spinner, **4,000 times** over. In **102** of those runs, red comes up 11 times or more.
        3. The p-value is that share: $102 \div 4000 = 0.0255$.

        Reading: if the spinner is fair, 11 or more reds turn up in about 2.6% of experiments.
        :::

        A p-value is a share of the null world's results, so it is a decimal between 0 and 1.
      `,
    },
    {
      id: 'read-p',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick(P_SCENES);
        const k = rng.pick(scene.results);
        const sims = rng.pick([1000, 2000, 5000]);
        const hits = Math.round(binomTail(scene.n, scene.p, k) * sims);
        const answer = hits / sims;
        return {
          text: `
            ${scene.setup(k)}

            A computer simulates ${scene.world}, **${thousands(sims)} times** over. In **${hits}** of those runs the result is ${scene.event(k)}.

            **What is the p-value, according to this simulation?** Give a decimal to at least three places, such as 0.125.
          `,
          answer,
          prefix: '$p \\approx$',
          tolerance: 0.0005,
          wrong: [
            [hits, `${hits} is a number of runs. The p-value is a share: divide by the ${thousands(sims)} runs.`],
            [Math.round((1 - answer) * 1e4) / 1e4, 'That is the share of runs that were *less* extreme than the real result. The p-value counts the ones at least as extreme.'],
            [Math.round(answer * 1e6) / 1e4, `As a percentage, yes. As a decimal that is ${num(answer)}.`],
          ],
          hints: [`The p-value is the share of null-world runs at least as extreme as the real result: ${hits} out of ${thousands(sims)}.`],
          explain: r`
            $${hits} \div ${sims} = ${num(answer)}$. If ${scene.nothing}, a result of ${scene.event(k)} turns up in about ${pct(answer)}% of experiments.
            ${answer < 0.04 ? 'That is rare enough to make the boring explanation look doubtful.' : answer > 0.08 ? 'That is not rare, so the result is little evidence against the boring explanation.' : 'That is unusual, but not very: suggestive at most.'}
          `,
        };
      },
    },
    {
      id: 'threshold-hunt',
      type: 'interact',
      title: 'How many heads is enough?',
      text: `
        The slider moves your friend's result. The orange pill gives the exact long-run share for a fair coin, so you do not depend on the luck of 1,000 runs.

        Many researchers call a result **statistically significant** when its p-value is below **0.05**. **Find the smallest number of heads in 20 flips that is significant by that rule.**
      `,
      widget: coin({ observed: 12, observedRange: [10, 20], exact: true, start: 1000, buttons: [100, 1000], observedLabel: 'her result: heads', alt: 'The histogram of heads in 20 flips of a fair coin, with a slider that moves the dashed line marking the real result.' }),
      check: (s) => {
        if (s.observed === 15) return true;
        // the share as the orange pill prints it: two decimals below 10%, one above
        const share = s.exact < 0.0001 ? 'less than 0.01' : pct(s.exact, s.exact < 0.1 ? 2 : 1);
        return s.observed < 15
          ? `For ${s.observed} heads or more, a fair coin's long-run share is ${share}%. That is not below 5%.`
          : `${s.observed} heads would be significant (the share is ${share}%), but a smaller number already is.`;
      },
      solution: { observed: 15 },
      hints: ['Move the slider one step at a time and read the orange pill. You want the first value where it drops below 5%.'],
      explain: `
        Fourteen heads or more has a p-value of about 5.8%: not quite. Fifteen or more has about 2.1%. So 15 is the smallest count that crosses the line.

        Notice how sharp the line looks, and how little separates 14 heads from 15. Keep that in mind.
      `,
    },
    {
      id: 'shuffle',
      type: 'interact',
      graded: false,
      title: 'Did the fertiliser work?',
      text: `
        A gardener drew lots to pick 10 of 20 tomato plants for a new fertiliser. Six weeks on, the fertilised plants average **67.9 cm** and the plain ones **61.9 cm**: a gap of **6 cm**.

        The boring explanation: the fertiliser does nothing, and every plant would have reached the same height either way. Then "fertiliser" and "plain" are just labels the lottery dealt out, and any other deal was equally likely.

        **Shuffle the labels at least 1,000 times.** What gaps does chance alone produce?
      `,
      widget: {
        type: 'null-sim', kind: 'shuffle', unit: 'cm', buttons: [1, 100, 1000],
        groups: [{ label: 'fertiliser', values: PLANTS.fert }, { label: 'plain', values: PLANTS.plain }],
        alt: 'Two rows of dots, the heights of 10 fertilised and 10 plain tomato plants, and a histogram of the gap between the two rows after the labels have been shuffled.',
      },
      check: (s) => s.trials >= 1000 || `${thousands(s.trials)} ${s.trials === 1 ? 'shuffle' : 'shuffles'} so far. Keep going until you have at least 1,000.`,
      solution: { trials: 1000 },
      explain: `
        After a shuffle each row is a random mix (circles really had fertiliser, squares did not), and the gap between the rows is usually small: mostly between −5 and +5 cm.

        A gap of 6 cm or more turns up in only about **3 shuffles in 100**. This is a **permutation test**: the null world is made by shuffling the labels on the real data.
      `,
    },
    {
      id: 'what-p-says',
      type: 'choice',
      text: `
        For the tomato plants the count can be done exactly. Of the ${thousands(PLANTS.deals)} ways of dealing the labels, ${thousands(PLANTS.extreme)} give a gap of 6 cm or more: a p-value of **0.03**.

        **Which sentence says what that number means?**
      `,
      columns: 1,
      options: [
        { text: 'If the fertiliser did nothing, a gap this big or bigger would appear in about 3% of experiments like this one', correct: true },
        { text: 'There is a 3% chance that the fertiliser does nothing', why: 'This is the most common misreading in all of statistics. The 3% was worked out *assuming* that the fertiliser does nothing. It cannot also be the probability of that assumption.' },
        { text: 'There is a 97% chance that the fertiliser works', why: 'That is the same misreading turned round. A p-value says how surprising the data would be if nothing were going on. It does not say how likely either explanation is.' },
        { text: 'The fertiliser adds 3% to a plant\'s height', why: 'A p-value says nothing about the size of an effect. The size here is the 6 cm gap.' },
      ],
      explain: `
        If nothing were going on, data like these would turn up about 3 times in 100. That is all the 0.03 says.

        It was worked out *assuming* that the fertiliser does nothing, so it cannot also be the probability of that assumption. The next step shows how far apart the two can be.
      `,
    },
    {
      id: 'base-rate',
      type: 'interact',
      title: 'Why p is not the chance that nothing is going on',
      text: `
        You have met this trap before, in [The Base Rate Trap](#/learn/probability/bayes). A significant result is like a positive medical test: what it is worth depends on how common real effects are among the ideas being tested.

        Picture **1,000 experiments**. Only **10%** of them test a real effect. A real effect comes out significant 80% of the time; an experiment on nothing does so 5% of the time, by the 0.05 rule.

        **Step through to "Significant only".** How many of the significant results are false alarms?
      `,
      widget: thousand({ alt: 'A thousand dots, one per experiment. A hundred test a real effect. After all are run, 80 real effects and 45 experiments on nothing come out significant.' }),
      check: (s) => {
        if (s.stage === 3) return true;
        return s.stage === 0 ? 'Press "Which are real?" to begin.' : 'Keep going: step through to "Significant only".';
      },
      solution: { stage: 3 },
      explain: `
        Of the 100 real effects, 80 come out significant. So do 45 of the 900 experiments in which nothing was going on. That makes 125 significant results, and **45 of them, 36%, are false alarms**, although every one has p < 0.05.

        If only 1 idea in 100 were real, most significant results would be false alarms.
      `,
    },
    {
      id: 'teach-not-chance',
      type: 'info',
      title: 'What a p-value does not say',
      text: `
        A p-value answers one question only: *how often would a world in which nothing is going on produce data like these?*

        :::key
        A p-value is a statement about the data, given the null hypothesis. It is **not** the probability that the null hypothesis is true.
        :::

        You have just seen how far apart those two can be: every one of the 125 significant results had p < 0.05, and 45 of them were false alarms. A p-value on its own cannot tell you how likely the null hypothesis is: that depends on the base rate as well.

        Nor does a p-value say how big an effect is. For the tomato plants the size was the 6 cm gap, not the 0.03.
      `,
      figure: thousand({
        stage: 3, stages: false,
        caption: 'The 125 significant results: 80 real effects (squares) and 45 false alarms (circles).',
        alt: 'The 125 experiments out of 1,000 that came out significant: 80 squares for real effects and 45 circles for experiments in which nothing was going on.',
      }),
    },
    {
      id: 'interpret',
      type: 'multi',
      review: true,
      text: 'A drug trial reports that patients on a new drug recovered faster than patients on the old one, with **p = 0.02**. Which statements are **correct**?',
      options: [
        { text: 'If the new drug were no better, a difference at least this large would occur in about 2% of such trials', correct: true },
        { text: 'The result is statistically significant at the 0.05 level', correct: true },
        { text: 'There is a 2% probability that the new drug is no better', why: 'The 2% is the chance of the *data* (or more extreme) if the drug is no better. The chance that the drug is no better is a different thing, and it depends on the base rate too.' },
        { text: 'There is a 98% probability that the new drug is better', why: 'The same misreading the other way round. A p-value is worked out inside the null world; it cannot say how likely that world is.' },
        { text: 'The new drug makes a big difference to recovery', why: 'A p-value says nothing about size. A small improvement, measured on enough patients, gives a small p-value too.' },
      ],
      explain: 'A p-value is the chance of data at least this extreme *if nothing is going on*. Below the chosen line it earns the label "statistically significant". It is not the chance that the null hypothesis is true, and it does not measure the size of the effect.',
    },
    {
      id: 'convention',
      type: 'info',
      title: 'Why 0.05?',
      text: `
        The line at 0.05 is a **convention**, not a law of nature. It goes back to the statistician R. A. Fisher, who wrote in 1925 that one in twenty was a "convenient" limit. It stuck.

        A result whose p-value is below the chosen line is called **statistically significant**. Three cautions:

        - p = 0.049 and p = 0.051 are practically the same evidence. Nothing magic happens at the line.
        - "Significant" means *hard to explain by chance alone*. It does not mean large, or important.
        - A p-value above the line does not show that nothing is going on. **No evidence of an effect is not evidence of no effect.**

        In 2016 the American Statistical Association felt the need to remind researchers of points like these in a public statement.
      `,
    },
    {
      id: 'verdict',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const c = rng.pick(CLAIMS);
        const small = rng.bool();
        const p = small ? rng.pick([0.004, 0.01, 0.02, 0.03]) : rng.pick([0.12, 0.2, 0.35, 0.6]);
        const share = `${pct(p)}%`;
        const backwards = {
          text: `There is ${small ? 'only ' : ''}a ${share} chance that ${c.nothing}`,
          why: `The ${share} was worked out *assuming* that ${c.nothing}. It is the chance of data like these in that world, not the chance that the world is like that.`,
        };
        const options = small
          ? [
            { text: `The result is statistically significant: if ${c.nothing}, a difference at least this large would be rare`, correct: true },
            backwards,
            { text: 'The difference must be a large one', why: 'A small p-value says the difference is hard to put down to chance. A tiny difference can manage that too, if the experiment is big enough.' },
            { text: `It is now proved beyond doubt that ${c.works}`, why: `Strong evidence, but not proof. If ${c.nothing}, results like this still turn up in about ${ONE_IN[p]}.` },
          ]
          : [
            { text: 'The experiment has not shown an effect. It has not shown that there is none, either', correct: true },
            { text: `The experiment shows that ${c.nothing}`, why: 'No evidence of an effect is not evidence of no effect. A small or noisy experiment can easily miss a real one.' },
            backwards,
            { text: 'The result is statistically significant', why: `By the usual rule, significant means a p-value below 0.05. This one is ${p}.` },
          ];
        return {
          text: `
            An experiment tests whether ${c.claim}. The difference comes out in the hoped-for direction, with a p-value of **${p}**.

            Going by the usual 0.05 line, **which conclusion is justified?**
          `,
          columns: 1,
          options,
          explain: small
            ? `A p-value of ${p} is below 0.05: if ${c.nothing}, a difference at least this large would turn up in only about ${ONE_IN[p]}. That counts as statistically significant. It is evidence, not proof, and it says nothing about how large the difference is.`
            : `A p-value of ${p} means that if ${c.nothing}, a difference at least this large would still turn up in about ${share} of experiments. Chance explains the data comfortably. But "chance could do this" is not "nothing is going on": the experiment simply has not settled the question.`,
        };
      },
    },
    {
      id: 'test-order',
      type: 'order',
      text: 'Put the steps of a hypothesis test in order.',
      items: [
        'State the boring explanation: the null hypothesis',
        'Find out what results that world would produce',
        'See where the real result falls among them',
        'Report the share at least as extreme: the p-value',
      ],
      labels: ['First', 'Last'],
      explain: 'Assume nothing is going on, see what that world produces, and ask how surprising the real result would be there. Every test in this course, by coin, by shuffle or by formula, has this shape.',
    },
    {
      id: 'tea',
      type: 'numeric',
      stretch: true,
      title: 'The lady tasting tea',
      text: r`
        Muriel Bristol, a colleague of R. A. Fisher, said she could taste whether the milk or the tea had gone into the cup first. Fisher's test, described in his 1935 book *The Design of Experiments*: 8 cups, 4 made each way, in random order. She must pick out the 4 milk-first cups.

        There are 70 ways to choose 4 cups out of 8, all equally likely for someone who is guessing. Just **1** of them is entirely right, and **16** get exactly three of the four right.

        Suppose a taster gets **three of the four** right. **What is the p-value: the chance that a pure guesser does at least that well?** Give a percentage, to the nearest whole number.
      `,
      answer: (17 / 70) * 100,
      display: '24',
      unit: '%',
      tolerance: 0.5,
      wrong: [
        [(16 / 70) * 100, '"At least as well" includes doing even better. Add the 1 way of getting all four right.'],
        [(1 / 70) * 100, 'That is the chance of getting all four right. Three right *or better* covers more ways.'],
        [75, 'Three out of four is the taster\'s score. The p-value is the share of the 70 equally likely choices that do at least as well.'],
      ],
      hints: ['"At least that well" means exactly three right, or all four right.', 'That is 16 + 1 = 17 of the 70 ways.'],
      explain: r`
        $\frac{16 + 1}{70} = \frac{17}{70} \approx 24\%$. A guesser does this well about a quarter of the time, so three out of four would be no evidence at all.

        Only a perfect score is convincing: $\frac{1}{70} \approx 1.4\%$. According to a colleague who was there, she got every cup right.
      `,
    },
  ],
  recap: [
    'The **null hypothesis** is the boring explanation: nothing is going on.',
    'The **p-value** is the probability, if the null hypothesis is true, of a result at least as extreme as the one observed. You can find it by simulating the null world, or by shuffling labels.',
    'A small p-value means the data would be surprising if nothing were going on. It is **not** the probability that the null hypothesis is true.',
    '0.05 is a convention. And no evidence of an effect is not evidence of no effect.',
  ],
  next: 'Next: a test can be wrong in two different ways. Meet both, and find out why small studies miss real effects.',
};
