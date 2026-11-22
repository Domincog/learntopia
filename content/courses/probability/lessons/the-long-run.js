// Probability & Chance · Lesson 3 · The Long Run
import { r, num } from '../../../kit.js';
import { commas } from '../helpers.js';

export default {
  id: 'the-long-run',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Ten flips or a thousand?',
      text: r`
        A fair coin lands heads with probability $\frac{1}{2}$. Picture two
        experiments: flipping it **10 times**, and flipping it **1000 times**.

        **In which one are you more likely to get at least 70% heads?**
      `,
      shuffle: false,
      options: [
        { text: 'With 10 flips', correct: true },
        { text: 'With 1000 flips' },
        { text: 'The chance is the same in both' },
      ],
      explain: `
        With 10 flips. Seven or more heads out of 10 happens about once in
        every six tries. Seven hundred or more out of 1000 is so unlikely
        that you could flip coins for a lifetime and never see it.

        Short runs swing wildly. Long runs do not. Try it.
      `,
    },
    {
      id: 'ten-flips',
      type: 'interact',
      graded: false,
      title: 'Ten flips, again and again',
      text: `
        Flip this coin **10 times** and look at the share of heads. Then press
        **Start again** and flip another 10.

        **Do at least three runs of 10 flips.** How far from 50% do they land?
      `,
      widget: { type: 'chance-lab', kind: 'coin', track: 'Heads', buttons: [1, 10], max: 100 },
      check: (s) => {
        const done = s.runs - 1 + (s.trials >= 10 ? 1 : 0);
        if (done >= 3) return true;
        if (done === 0) return 'Flip the coin 10 times to finish your first run.';
        return `That is ${done} ${done === 1 ? 'run' : 'runs'} of 10 flips. Do three: press "Start again" between runs.`;
      },
      solution: { runs: 3, trials: 10 },
      explain: `
        Three runs, three answers. With only 10 flips, 30% heads or 70% heads
        is nothing unusual, and exactly 50% turns up only about one time in four.

        A probability of one half promises very little about a short run.
      `,
    },
    {
      id: 'thousand',
      type: 'interact',
      graded: false,
      title: 'Now keep going',
      text: `
        Same coin. This time, do not stop at 10.

        **Keep flipping until you have at least 1000 flips**, and watch what the line does.
      `,
      widget: { type: 'chance-lab', kind: 'coin', track: 'Heads', buttons: [10, 100, 1000], max: 10000 },
      check: (s) => s.trials >= 1000 || `${commas(s.trials)} flips so far. Keep going until you reach 1000.`,
      solution: { trials: 1000 },
      explain: `
        The line jumps about at first, then calms down and hugs the dashed 50%
        line. Each new flip matters less and less, because it is one among
        more and more.

        After 1000 flips the share of heads is almost always between 45% and
        55%. After 10,000 it is almost always between 48.5% and 51.5%.
      `,
    },
    {
      id: 'law',
      type: 'info',
      title: 'The law of large numbers',
      text: r`
        What you just watched has a name: the **law of large numbers**.

        :::key
        The more often you repeat a chance experiment, the closer the
        **share** of each outcome tends to get to its probability.
        :::

        This is what a probability really tells you. "The chance of heads is
        $\frac{1}{2}$" says nothing certain about the next flip. It describes
        the share of heads in a very long run of flips.
      `,
    },
    {
      id: 'how-close',
      type: 'choice',
      text: 'A fair coin is flipped **10,000 times**. What can you say about the number of heads?',
      options: [
        { text: 'It will be close to 5,000, but probably not exactly 5,000', correct: true },
        { text: 'It will be exactly 5,000', why: 'Any single exact count is unlikely: exactly 5,000 heads happens less than one time in a hundred. The law says "close to half", not "exactly half".' },
        { text: 'It could easily be anywhere between 4,000 and 6,000', why: 'After 10,000 flips the share of heads is almost never more than a point or two away from 50%. That means between about 4,850 and 5,150 heads.' },
        { text: 'Nothing: it is random', why: 'A single flip is unpredictable. The share of heads in a long run is not, and that is exactly what the law of large numbers says.' },
      ],
      explain: `
        The **share** of heads will be very close to 50%: almost certainly
        between 48.5% and 51.5%. But "close" is not "equal": landing on
        exactly 5,000 heads is itself quite unlikely.
      `,
    },
    {
      id: 'example-expect',
      type: 'info',
      title: 'From a probability to a count',
      text: r`
        In a long run the share of an outcome settles near its probability.
        So the probability tells you roughly how often to expect the outcome:
        **probability × number of tries**.

        :::example
        A bag holds 3 red marbles among 10, so $P(\text{red}) = \frac{3}{10}$.
        You draw 200 times, putting the marble back each time.

        One tenth of 200 is 20, so three tenths is 60:
        $\frac{3}{10} \times 200 = 60$ red draws.
        :::

        That is a best guess, not a promise. The real count usually lands a
        little above or below it.
      `,
    },
    {
      id: 'expected-count',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const story = rng.pick([
          { n: [60, 120, 300, 600, 1200], num: 1, den: 6, what: 'sixes', text: (n) => `A fair die is rolled **${commas(n)} times**. About how many **sixes** should you expect?`, share: 'of the rolls will be sixes' },
          { n: [50, 80, 200, 500, 3000], num: 1, den: 2, what: 'heads', text: (n) => `A fair coin is flipped **${commas(n)} times**. About how many **heads** should you expect?`, share: 'of the flips will be heads' },
          { n: [40, 100, 200, 1000], num: 1, den: 4, what: 'reds', text: (n) => `A spinner has four equal sections, one of them red. It is spun **${commas(n)} times**. About how many times should you expect it to stop on **red**?`, share: 'of the spins will stop on red' },
          { n: [50, 100, 250, 400], num: 2, den: 5, what: 'reds', text: (n) => `A bag holds 2 red marbles and 3 blue ones. You draw a marble, note its colour and put it back, **${commas(n)} times**. About how many times should you expect to draw **red**?`, share: 'of the draws will be red' },
          { n: [60, 180, 360, 600], num: 1, den: 6, what: 'sevens', text: (n) => `Two dice are rolled and added, **${commas(n)} times**. A total of 7 has probability one sixth. About how many **sevens** should you expect?`, share: 'of the rolls will give a 7' },
        ]);
        const n = rng.pick(story.n);
        const answer = (n * story.num) / story.den;
        return {
          text: `${story.text(n)} Give the best single guess.`,
          answer,
          wrong: [
            [n, 'That would mean it happens every single time. What share of the tries should you expect?'],
            [n / story.den, r`That is $\frac{1}{${story.den}}$ of ${commas(n)}. The probability here is $\frac{${story.num}}{${story.den}}$.`],
            [story.den, `The probability tells you the *share*. What is that share of ${commas(n)} tries?`],
          ],
          hints: [
            r`In a long run, about $\frac{${story.num}}{${story.den}}$ ${story.share}.`,
            r`Work out $\frac{${story.num}}{${story.den}}$ of ${commas(n)}.`,
          ],
          explain: r`
            In a long run about $\frac{${story.num}}{${story.den}}$ ${story.share}, so expect about
            $\frac{${story.num}}{${story.den}} \times ${n} = ${num(answer)}$. The real count will
            usually land a little above or below that, almost never exactly on it.
          `,
        };
      },
    },
    {
      id: 'streak-hook',
      type: 'choice',
      mode: 'predict',
      title: 'Five heads in a row',
      text: `
        You flip a fair coin and it lands heads **five times in a row**.

        What is the chance that the *next* flip is heads?
      `,
      shuffle: false,
      options: [
        { text: 'Less than one half: tails is due' },
        { text: 'Exactly one half', correct: true },
        { text: 'More than one half: heads is on a roll' },
      ],
      explain: `
        Exactly one half. The coin is the same piece of metal it was five
        flips ago, and it has no way of knowing what it did before.

        Not convinced? Good. The next experiment puts the question to the coin.
      `,
    },
    {
      id: 'streak-lab',
      type: 'interact',
      graded: false,
      title: 'Ask the coin',
      text: `
        This lab flips a coin and watches for **five heads in a row**. Each
        time that happens, it writes down what the *next* flip turned out to be.

        **Run at least 50,000 flips.** After five heads in a row, how often
        is the next flip heads again?
      `,
      widget: { type: 'chance-lab', kind: 'coin', track: 'Heads', streak: 5, bars: false, buttons: [1000, 10000], max: 100000 },
      check: (s) => s.trials >= 50000 || `${commas(s.trials)} flips so far. Keep going to 50,000 so that there are plenty of streaks to look at.`,
      solution: { trials: 50000 },
      explain: `
        About half the time, usually within two or three points of 50%, and
        closer the longer you run it. After five heads in a row, heads comes
        next just as often as it does at any other moment.
      `,
    },
    {
      id: 'teach-no-memory',
      type: 'info',
      title: 'Chance has no memory',
      text: r`
        The coin is the same piece of metal after a streak as before it. It
        cannot know what it did last time.

        :::key
        Each flip, roll or spin is **independent** of the ones before it:
        what has already happened does not change the chances of what
        comes next.
        :::

        Believing that tails is "due" after a run of heads is so common that
        it has a name: the **gambler's fallacy**.

        :::example
        A spinner with 3 equal sections, one of them yellow, has missed
        yellow 12 times in a row. The chance of yellow on the next spin is
        still $\frac{1}{3}$.
        :::
      `,
    },
    {
      id: 'no-memory',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const k = rng.int(6, 20);
        const sections = rng.pick([4, 5, 8, 10]);
        const story = rng.pick([
          { text: `A fair die has just been rolled **${k} times without a single six**.\n\nWhat is the probability that the next roll is a six?`, n: 1, d: 6, thing: 'die' },
          { text: `A fair coin has just landed **tails ${k} times in a row**.\n\nWhat is the probability that the next flip is heads?`, n: 1, d: 2, thing: 'coin' },
          { text: `A spinner has ${sections} equal sections, one of them green. In the last **${k * 2} spins it never stopped on green**.\n\nWhat is the probability that the next spin stops on green?`, n: 1, d: sections, thing: 'spinner' },
          { text: `A fair die has just shown a **six ${rng.int(3, 5)} times in a row**.\n\nWhat is the probability that the next roll is a six?`, n: 1, d: 6, thing: 'die' },
        ]);
        const p = story.n / story.d;
        return {
          text: `${story.text} Give your answer as a fraction.`,
          answer: `${story.n}/${story.d}`,
          display: `${story.n}/${story.d}`,
          tolerance: 0.0005,
          feedback: (v) => {
            if (!(v >= 0 && v <= 1)) return 'A probability must lie between 0 and 1.';
            if (Math.abs(v - p) < 0.006) return 'Very close, but rounded. Give the exact fraction.';
            return v > p
              ? `That is more than the usual chance. Nothing is "due": the ${story.thing} cannot remember what happened before.`
              : `That is less than the usual chance. A streak does not use anything up: the ${story.thing} cannot remember what happened before.`;
          },
          hints: [`Has anything about the ${story.thing} itself changed since the streak began?`],
          explain: r`Still $\frac{${story.n}}{${story.d}}$, exactly as on any other go. The ${story.thing} has no memory, so a streak tells you nothing about what comes next.`,
        };
      },
    },
    {
      id: 'dilute',
      type: 'numeric',
      title: 'Where does a lucky streak go?',
      gen: (rng) => {
        const h0 = rng.pick([8, 9, 10]);
        const more = rng.pick([90, 190, 490, 990]);
        const total = 10 + more;
        const heads = h0 + more / 2;
        const answer = (100 * heads) / total;
        return {
          text: `
            A fair coin has a lucky start: **${h0} heads in its first 10 flips**.
            It is then flipped ${more} more times and, just as you would
            expect, half of those are heads: ${more / 2}.

            **What share of all ${commas(total)} flips are heads?** Give a percentage.
          `,
          answer,
          unit: '%',
          wrong: [
            [50, 'Not quite 50%: the early heads are still in the count. Nothing cancelled them.'],
            [h0 * 10, `That was the share after the first 10 flips. Count all ${commas(total)}.`],
            [(100 * (more / 2)) / total, `Add the ${h0} early heads to the ${more / 2} later ones.`],
          ],
          hints: [
            `How many heads are there in all ${commas(total)} flips?`,
            `${h0} + ${more / 2} = ${heads} heads out of ${commas(total)} flips. Turn that into a percentage.`,
          ],
          explain: r`
            Heads: $${h0} + ${more / 2} = ${heads}$ out of ${commas(total)} flips,
            which is ${num(answer)}%.

            The early surplus of heads never went away, and no extra tails
            arrived to "make up for it". It was simply **swamped** by all the
            ordinary flips that followed. That is how the law of large numbers works.
          `,
        };
      },
    },
    {
      id: 'hospital',
      type: 'choice',
      review: true,
      stretch: true,
      text: `
        A large hospital has about **45 births a day**, a small one about
        **15**. Roughly half of all babies are boys, but the share varies
        from day to day.

        Over a year, **which hospital records more days on which over 60% of
        the babies born are boys?**
      `,
      options: [
        { text: 'The small hospital', correct: true },
        { text: 'The large hospital', why: 'More births pull the daily share *towards* 50%, not away from it.' },
        { text: 'Both about equally often', why: 'The chance of a boy is the same at both hospitals, but the *swing* of the daily share is not. A day at the small hospital is a short run.' },
      ],
      hints: ['Think of each day as a run of coin flips: 15 flips at one hospital, 45 at the other. Which run is more likely to stray far from 50%?'],
      explain: `
        The small hospital. Fifteen births are a short run, and short runs
        swing widely: there, more than 60% boys happens on about one day in
        seven. With 45 births it happens on only about one day in fifteen.

        Same probability, different sample size.
      `,
    },
    {
      id: 'sort',
      type: 'bucket',
      review: true,
      text: `
        The **gambler's fallacy** is the belief that a result is "due" after
        a streak. Sound reasoning, or the fallacy? **Sort each statement.**
      `,
      buckets: ['Sound', 'Fallacy'],
      items: [
        { text: '"Red has come up eight times running on this roulette wheel, so black is due."', bucket: 1, why: 'The wheel has no memory: black is exactly as likely as on any other spin.' },
        { text: '"In 6000 rolls of a fair die, about 1000 will be sixes."', bucket: 0, why: 'That is the law of large numbers: in a long run the share of sixes settles near one sixth.' },
        { text: '"I have lost five rounds of this dice game in a row. My luck has to turn now."', bucket: 1, why: 'The dice do not know about the last five rounds. The chance of winning the next one is unchanged.' },
        { text: '"Seven heads in 10 flips is no surprise. Seven hundred in 1000 would be."', bucket: 0, why: 'Short runs swing widely, long runs do not. This is sound.' },
        { text: '"Four heads in a row, and the next flip is still fifty-fifty."', bucket: 0, why: 'Exactly right: each flip is independent of the ones before.' },
        { text: '"This lottery number has not come up for a year, so it is more likely this week."', bucket: 1, why: 'The lottery machine has no memory either. Every number has the same chance in every draw.' },
      ],
      explain: `
        Coins, dice, wheels and lottery machines have **no memory**: each go
        is independent of the ones before it. What you *can* rely on is the
        long run, where shares settle near their probabilities.
      `,
    },
  ],
  recap: [
    'A probability describes the **long run**: the share of an outcome over many repetitions.',
    'Short runs swing widely, long runs settle down. That is the law of large numbers.',
    'Chance has **no memory**: after five heads in a row, heads is still fifty-fifty.',
    'An early surplus is never "paid back". It is swamped by everything that follows.',
  ],
  next: 'Next: combine probabilities with *and*, *or* and *not*, and settle a gambling puzzle from the 1650s.',
};
