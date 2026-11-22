// Statistical Inference · Lesson 1 · The Dance of the Sample Mean
import { r, num, round } from '../../../kit.js';
import { thousands, unitFor } from '../helpers.js';

/** The city of commuters: journeys of 0 to 80 minutes. As a bell it has mean 40 and SD 10. */
const city = (extra) => ({
  type: 'sample-means', x: [0, 80], unit: 'min', xLabel: 'commute (minutes)', dataLabel: 'Individual commutes', noun: 'commuters', ...extra,
});

/**
 * The depot of the two worked examples: parcels of 416 to 584 g. As a bell it has mean 500 and SD 21,
 * and the examples take samples of 49: a sample size (and a factor of 36) that no generated step can produce.
 */
const parcels = (extra) => ({
  type: 'sample-means', x: [416, 584], unit: 'g', xLabel: 'weight (g)', dataLabel: 'Individual parcels', noun: 'parcels', n: 49, start: 2000, static: true, ...extra,
});

const SE_SCENES = [
  { many: 'bags of rice', act: 'is weighed', each: 'Individual bags vary in weight', of: 'weight', unit: 'g', sds: [12, 18, 24, 30, 36, 60] },
  { many: 'commuters', act: 'is asked how long the journey to work takes', each: 'Individual journey times vary', of: 'journey time', unit: 'minutes', sds: [6, 9, 12, 15, 18] },
  { many: 'batteries', act: 'is run until every battery is flat', each: 'Individual lifetimes vary', of: 'lifetime', unit: 'hours', sds: [12, 20, 24, 30, 40] },
  { many: 'students', act: 'sits a test', each: 'Individual marks vary', of: 'mark', unit: 'marks', sds: [8, 10, 12, 15, 20] },
];

const BAND_SCENES = [
  { what: 'The chocolate bars from one factory', verb: 'have', unit: 'g', m: 100, sd: 4, roots: [2, 4, 8, 10], sample: 'bars' },
  { what: 'The marks in a national exam', verb: 'have', unit: 'marks', m: 60, sd: 12, roots: [3, 4, 6, 12], sample: 'candidates' },
  { what: 'Journeys to work in a large city', verb: 'have', unit: 'minutes', m: 40, sd: 10, roots: [5, 10, 20], sample: 'commuters' },
  { what: 'The lifetimes of one brand of battery', verb: 'have', unit: 'hours', m: 50, sd: 6, roots: [3, 6, 12], sample: 'batteries' },
];

const CITY_NAMES = { skew: 'skewed', twin: 'two-hump' };

export default {
  id: 'sampling-distributions',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Two researchers, one city',
      text: `
        A city has two million commuters. Their journeys to work average **40 minutes**, with a standard deviation of **10 minutes**: plenty of people take 30, plenty take 50.

        Two researchers each pick **16 commuters at random** and work out the average journey time of their own sample.

        **How far apart do you expect the two averages to be?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: 'Exactly equal: both samples come from the same city' },
        { text: 'A few minutes apart', correct: true },
        { text: 'About 10 minutes apart, like two individual commuters' },
        { text: 'Anything from 0 to 80 minutes: it is pure luck' },
      ],
      explain: `
        Usually just a few minutes. Two samples never agree exactly, but an **average** is far steadier than a single commuter.

        In [A Spoonful of Soup](#/learn/statistics/sampling) you watched sample percentages scatter around the truth. Averages do the same. In this lesson you find out exactly how much, and that is the key to everything else in this course.
      `,
    },
    {
      id: 'draw-samples',
      type: 'interact',
      graded: false,
      title: 'One sample, one average',
      text: `
        Here is the city. The top panel shows all its commutes. **Draw 1** picks 16 commuters at random (the orange dots) and drops their average into the bottom panel.

        **Draw at least 10 samples** and watch where their averages land.
      `,
      widget: city({ n: 16, buttons: [1, 10], alt: 'A bell-shaped population of commute times from 0 to 80 minutes, centred on 40, and an empty panel underneath where sample averages will pile up.' }),
      check: (s) => s.count >= 10 || `You have drawn ${s.count} so far. Keep going until you have at least 10.`,
      solution: { count: 10 },
      explain: `
        No two samples agree: one average comes out near 38, another near 42. That is **sampling variation**, and it never goes away.

        But look at the two panels. The orange dots, individual commuters, range from about 20 minutes to about 60. The averages all huddle within a few minutes of 40.
      `,
    },
    {
      id: 'pile-up',
      type: 'interact',
      graded: false,
      title: 'Now thousands of samples',
      text: `
        Ten averages are a handful. To see the pattern you need many more.

        **Draw at least 2,000 samples.** Compare the pile with the population above it: where is its centre, how wide is it, and what shape does it have?
      `,
      widget: city({ n: 16, start: 10, buttons: [10, 1000], alt: 'The population of commute times, and the pile of sample averages underneath it, with ten averages so far.' }),
      check: (s) => s.count >= 2000 || `${thousands(s.count)} samples so far. Press "Draw 1,000" until you have at least 2,000.`,
      solution: { count: 2000 },
      explain: `
        The pile has a shape of its own.

        - It is **centred on 40**, the true mean of the city.
        - It is **much narrower** than the population. Nearly every average lies between 33 and 47, while individual commutes run from 10 to 70.
        - It is **bell-shaped**.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'The sampling distribution',
      text: `
        The pile you built is called the **sampling distribution** of the mean. It shows every average you *could* get from a sample of 16, and how often.

        In real life you draw **one** sample and get **one** average: a single block of that pile. You never see the rest. All of statistical inference rests on knowing what the pile looks like anyway.

        :::key
        Averages of random samples are centred on the true mean, vary less than the data do, and pile up in a bell shape.
        :::

        How *much* less they vary is the next question.
      `,
    },
    {
      id: 'two-spreads',
      type: 'choice',
      title: 'Two different spreads',
      text: `
        The picture now marks two standard deviations. [Blue]{.blue}: individual commutes spread about **10 minutes** either side of 40. [Violet]{.violet}: averages of 16 commuters spread only about **2.5 minutes** either side.

        Remember the 68–95–99.7 rule from [The Shape of Data](#/learn/statistics/distributions): in a bell shape, about 95% of the values lie within 2 standard deviations of the centre.

        Mia asks 16 random commuters and gets an average of **46 minutes**. **Should that surprise her?**
      `,
      figure: city({ n: 16, start: 2000, spreads: 'exact', static: true, alt: 'The population of commutes with a bracket of 10 minutes either side of 40, and under it the pile of 2,000 sample averages with a bracket of only 2.5 minutes either side.' }),
      columns: 1,
      options: [
        { text: 'Yes: for an average of 16 commuters, 46 is unusually far from 40', correct: true },
        { text: 'No: 46 is well within 10 minutes of 40', why: 'Ten minutes is how much **individual commuters** vary. Mia has an **average of 16**, and those vary by only about 2.5 minutes. One commuter at 46 is ordinary. An average of 46 is not.' },
        { text: 'No: any average between 30 and 50 is equally likely', why: 'Look at the violet pile: averages near 40 are common, and averages as far out as 46 are rare.' },
      ],
      explain: r`
        46 is 6 minutes above 40. For one commuter (SD 10) that is nothing. For an average of 16 (SD 2.5) it is $6 \div 2.5 = 2.4$ standard deviations out, and by the 68–95–99.7 rule only about 5% of results land more than 2 away.

        There are **two spreads**, and they answer different questions. The spread of the *data* says how much people differ from one another. The spread of the *average* says how far a sample's average is likely to be from the truth.
      `,
    },
    {
      id: 'size-explore',
      type: 'interact',
      title: 'Bigger samples',
      text: `
        What happens to the pile when each sample is bigger? The violet number is the standard deviation of the averages in the pile.

        **Draw at least 1,000 samples with each sample size: 4, 16 and 64.** Compare the three violet numbers.
      `,
      widget: city({ sizes: [4, 16, 64], n: 4, spreads: true, buttons: [10, 1000], alt: 'The population of commutes and the pile of sample averages, with buttons for sample sizes 4, 16 and 64.' }),
      check: (s) => {
        for (const size of [4, 16, 64]) {
          const have = s.counts.bell[size];
          if (have < 1000) return `You have ${thousands(have)} ${have === 1 ? 'sample' : 'samples'} of size ${size}. Choose sample size ${size} and draw at least 1,000.`;
        }
        return true;
      },
      solution: { counts: { bell: { 4: 1000, 16: 1000, 64: 1000 } }, n: 64 },
      hints: ['Pick a sample size, press "Draw 1,000", and read the violet number. Then do the same for the other two sizes.'],
      explain: `
        The standard deviation of the averages comes out near **5**, then **2.5**, then **1.25** minutes. Each time the sample is **four times** as large, the spread of the averages **halves**.

        The blue number never moved. People are as varied as ever: only the *average* has become steadier.
      `,
    },
    {
      id: 'formula',
      type: 'info',
      title: 'The standard error',
      text: r`
        The standard deviation of the averages has a name of its own: the **standard error** (SE). You have just measured it three times.

        | Sample size $n$ | 4 | 16 | 64 |
        |---|:---:|:---:|:---:|
        | Standard error | 5 | 2.5 | 1.25 |

        Each one is the SD of the data, 10, divided by $\sqrt{n}$:

        $$ \text{SE} = \frac{\text{SD}}{\sqrt{n}} $$

        It is the square-root law you met with the margin of error: four times the data, half the error. (Why the square root? That takes some algebra which this course leaves out; your three piles are the evidence.)

        Nobody knows the SD of a whole population, so in practice the SD of the sample stands in for it.
      `,
    },
    {
      id: 'example-se',
      type: 'info',
      title: 'Worked example: a standard error',
      text: r`
        :::example
        **49 parcels** are weighed. Individual parcels vary in weight with an SD of **21 g**.

        1. Take the square root of the sample size: $\sqrt{49} = 7$.
        2. Divide the SD by it: $\text{SE} = 21 \div 7 = 3$ g.

        Next time, **36 times** as many parcels are weighed. No need to start again: 36 times the sample divides the standard error by $\sqrt{36} = 6$, so it becomes $3 \div 6 = 0.5$ g.
        :::

        A single parcel is typically about 21 g from the mean. The *average* of 49 parcels is typically only about 3 g from the true mean: that is what a standard error tells you.
      `,
      figure: parcels({ spreads: 'exact', caption: 'Blue: single parcels. Violet: averages of 49 parcels. The SD of the averages is the standard error.', alt: 'A bell-shaped population of parcel weights with a bracket of 21 grams either side of 500, and under it the far narrower pile of 2,000 averages of 49 parcels, with a bracket of 3 grams either side.' }),
    },
    {
      id: 'se-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick(SE_SCENES);
        const sd = rng.pick(scene.sds);
        const root = rng.pick([2, 3, 4, 5, 6, 8, 10].filter((k) => (sd * 100) % k === 0));
        const n = root * root;
        const answer = round(sd / root, 2);
        return {
          text: `
            A random sample of **${n} ${scene.many}** ${scene.act}. ${scene.each} with a standard deviation of **${sd} ${scene.unit}**.

            **What is the standard error of the sample's average ${scene.of}?**
          `,
          answer,
          unit: scene.unit,
          tolerance: 0.005,
          wrong: [
            [round(sd / n, 4), r`You divided by $n$ itself. The standard error is the SD divided by the *square root* of $n$.`],
            [sd, `${sd} ${scene.unit} is how much individual ${scene.many} vary. An average of ${n} of them varies less.`],
            [sd * root, 'You multiplied by the square root. Averages vary *less* than single values, so divide.'],
          ],
          hints: [r`$\text{SE} = \text{SD} \div \sqrt{n}$, and $\sqrt{${n}} = ${root}$.`],
          explain: r`$\text{SE} = \dfrac{${sd}}{\sqrt{${n}}} = \dfrac{${sd}}{${root}} = ${num(answer)}$ ${unitFor(answer, scene.unit)}. Single ${scene.many} differ by about ${sd} ${scene.unit}; averages of ${n} differ by only about ${num(answer)}.`,
        };
      },
    },
    {
      id: 'bigger-sample',
      type: 'numeric',
      gen: (rng) => {
        const k = rng.pick([2, 3, 4, 5, 10]);
        const n = rng.pick([50, 100, 200, 400]);
        // keep the journey times believable: the SD they imply (SE × √n) stays between 5 and 45 minutes
        const answer = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.2, 1.5].filter((a) => a * k * Math.sqrt(n) >= 5 && a * k * Math.sqrt(n) <= 45));
        const se = round(answer * k, 2);
        return {
          text: `
            A survey of **${n}** people estimates an average journey time with a standard error of **${num(se)} ${unitFor(se, 'minutes')}**.

            Next year the survey will ask **${thousands(n * k * k)}** people: ${k * k} times as many. **What standard error should it expect?**
          `,
          answer,
          unit: 'minutes',
          tolerance: 0.005,
          wrong: [
            [round(se / (k * k), 4), `${k * k} times the people does not make the error ${k * k} times smaller. It shrinks with the square root: ${k} times smaller.`],
            [se, 'A bigger sample gives a steadier average, so the standard error must come down.'],
            [round(se * k, 2), 'More data makes the average steadier, not shakier: the standard error goes down.'],
          ],
          hints: [r`The standard error is divided by the square root of the factor: $\sqrt{${k * k}} = ${k}$.`],
          explain: r`${k * k} times the sample divides the standard error by $\sqrt{${k * k}} = ${k}$: $${num(se)} \div ${k} = ${num(answer)}$ minutes. Precision is expensive.`,
        };
      },
    },
    {
      id: 'shape-explore',
      type: 'interact',
      title: 'Does the shape of the city matter?',
      text: `
        So far the population was a bell. Real data are often lopsided. Here are two more cities: a **skewed** one (most commutes short, a few very long) and one with **two humps** (walkers and train riders).

        **In each of these two cities, draw at least 1,000 samples of size 1 and 1,000 of size 30.** Watch the shape of the pile.
      `,
      widget: city({
        shapes: ['bell', 'skew', 'twin'], shape: 'skew', shapeLabel: 'City:', shapeLabels: { bell: 'Bell', skew: 'Skewed', twin: 'Two humps' },
        sizes: [1, 2, 5, 30], n: 1, buttons: [10, 1000],
        alt: 'A skewed population of commute times, with buttons to switch between three cities and four sample sizes, and a panel where sample averages pile up.',
      }),
      check: (s) => {
        for (const shape of ['skew', 'twin']) {
          for (const size of [1, 30]) {
            const have = s.counts[shape][size];
            if (have < 1000) return `In the ${CITY_NAMES[shape]} city you have ${thousands(have)} ${have === 1 ? 'sample' : 'samples'} of size ${size}. Draw at least 1,000.`;
          }
        }
        return true;
      },
      solution: { counts: { skew: { 1: 1000, 30: 1000 }, twin: { 1: 1000, 30: 1000 } }, shape: 'twin', n: 30 },
      hints: ['Four piles are needed: skewed city with size 1 and size 30, two-hump city with size 1 and size 30. One press of "Draw 1,000" fills each.'],
      explain: `
        With samples of 1, the pile simply copies the city: skewed, or two-humped. An "average" of one person is just that person.

        By samples of 30, both piles are narrow and close to a bell, centred on the true mean. The lopsidedness has been averaged away.
      `,
    },
    {
      id: 'teach-clt',
      type: 'info',
      title: 'The central limit theorem',
      text: `
        What you just watched is one of the most useful facts in statistics.

        :::key
        **Central limit theorem:** averages of large enough random samples are bell-shaped, almost whatever the shape of the data.
        :::

        The picture shows the skewed city again: lopsided data on top, and underneath a pile of averages of 30 commuters that is close to a bell. The more lopsided the data, the larger the sample has to be before the bell appears.

        It is why the bell curve turns up all over statistics. (The proof is beyond this course, and the next step shows the kind of data that needs care.)
      `,
      figure: city({ shape: 'skew', n: 30, start: 2000, static: true, alt: 'A skewed population of commute times, most of them short and a few very long, and under it the pile of 2,000 averages of 30 commuters: narrow, symmetric and close to a bell.' }),
    },
    {
      id: 'clt-apply',
      type: 'choice',
      text: `
        Household incomes in one city are strongly skewed: most are modest and a few are ten times as high. A survey takes a random sample of **2,500 households** and works out their average income.

        Imagine repeating that survey many times. **What would the pile of averages look like?**
      `,
      columns: 1,
      options: [
        { text: 'Close to a bell, centred on the true average income', correct: true },
        { text: 'Skewed to the right, like the incomes themselves', why: 'Inside each sample the incomes are skewed. The *averages* of 2,500 households are another matter: with samples this large they pile up in a bell.' },
        { text: 'It cannot be known without the exact shape of the income distribution', why: 'That is the surprise of the central limit theorem: for large samples, the shape of the data hardly matters.' },
        { text: 'Flat: every average is equally likely', why: 'Averages cluster around the true mean. Values far from it are rare.' },
      ],
      explain: `
        The data are skewed; the sampling distribution of their average is not. The more lopsided the data, the larger the sample has to be before the bell appears, and 2,500 is plenty here. (It would not be if a few incomes were thousands of times the rest: giant outliers can keep the averages lopsided even in large samples.)

        So one picture, a bell centred on the truth with the standard error as its width, covers surveys of almost anything.
      `,
    },
    {
      id: 'example-band',
      type: 'info',
      title: 'Worked example: where the averages land',
      text: r`
        A sampling distribution is a bell, and its standard deviation is the standard error. So the 68–95–99.7 rule applies to it: about 95% of sample averages lie within **2 standard errors** of the true mean.

        :::example
        Parcels from one depot have a mean of **500 g** and an SD of **21 g**. Samples of **49 parcels** are taken, again and again.

        1. Standard error: $21 \div \sqrt{49} = 3$ g.
        2. Two standard errors: $2 \times 3 = 6$ g.
        3. About 95% of the sample averages lie between $500 - 6 = 494$ g and $500 + 6 = 506$ g.

        Single parcels spread far wider: about 458 to 542 g.
        :::
      `,
    },
    {
      id: 'band-95',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const scene = rng.pick(BAND_SCENES);
        const root = rng.pick(scene.roots);
        const n = root * root;
        const se = round(scene.sd / root, 2);
        const lo = round(scene.m - 2 * se, 2);
        const hi = round(scene.m + 2 * se, 2);
        return {
          text: `
            In a bell shape, about 95% of the values lie within 2 standard deviations of the centre. A sampling distribution is a bell, and its standard deviation is the standard error.

            ${scene.what} ${scene.verb} a mean of **${scene.m} ${scene.unit}** and a standard deviation of **${scene.sd} ${scene.unit}**. Random samples of **${n} ${scene.sample}** are taken, again and again.
          `,
          template: `
            The standard error of the sample average is [[${num(se)}]] ${scene.unit}.

            About 95% of the sample averages lie between [[${num(lo)}]] and [[${num(hi)}]] ${scene.unit}.
          `,
          hints: [
            r`$\text{SE} = \text{SD} \div \sqrt{n} = ${scene.sd} \div ${root}$.`,
            `Go two standard errors either side of ${scene.m}.`,
          ],
          explain: r`
            $\text{SE} = ${scene.sd} \div \sqrt{${n}} = ${num(se)}$ ${unitFor(se, scene.unit)}. Two standard errors are ${num(2 * se)}, so about 95% of the sample averages lie between
            $${scene.m} - ${num(2 * se)} = ${num(lo)}$ and $${scene.m} + ${num(2 * se)} = ${num(hi)}$ ${scene.unit}. Single ${scene.sample} spread far wider: about ${scene.m - 2 * scene.sd} to ${scene.m + 2 * scene.sd}.
          `,
        };
      },
    },
    {
      id: 'spreads-sort',
      type: 'bucket',
      review: true,
      text: 'A survey measures how long people sleep. Sort each phrase: does it describe the **spread of the data** (the SD of individual people) or the **spread of the average** (the standard error)?',
      buckets: ['SD of the data', 'Standard error of the average'],
      items: [
        { text: 'How much one person\'s sleep typically differs from the mean', bucket: 0, why: 'One person against the mean: that is the spread of individuals, the SD of the data.' },
        { text: 'How far the survey\'s average is likely to be from the true mean', bucket: 1, why: 'This is about the average of the whole sample, so it is the standard error.' },
        { text: 'Halves when the sample is made four times as large', bucket: 1, why: 'The standard error is the SD divided by √n. The SD of the data does not shrink when you ask more people.' },
        { text: 'Stays about the same however many people are asked', bucket: 0, why: 'People are as varied in a big survey as in a small one. Only the average gets steadier.' },
        { text: 'Tells you how precise the estimate is', bucket: 1, why: 'Precision of an estimate is what the standard error measures.' },
        { text: 'Tells you how different people are from one another', bucket: 0, why: 'Differences between people are the spread of the data.' },
      ],
      explain: 'The SD of the data describes **people**. The standard error describes **an estimate**. A bigger sample leaves the first alone and shrinks the second.',
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements are **true**?',
      options: [
        { text: 'The averages of random samples are centred on the true mean of the population', correct: true },
        { text: 'To halve the standard error you need a sample four times as large', correct: true },
        { text: 'For large samples the averages are roughly bell-shaped, even when the data are skewed', correct: true },
        { text: 'A bigger sample makes the individual values less spread out', why: 'People are as varied as ever: the SD of the data stays put. It is the *average* that becomes steadier.' },
        { text: 'The standard error of an average of 100 values is 100 times smaller than the SD of a single value', why: 'Ten times smaller: the standard error is the SD divided by the *square root* of 100.' },
      ],
      explain: r`Sample averages form a bell centred on the truth, with standard error $\text{SD} \div \sqrt{n}$. More data narrows that bell slowly, and does nothing to the spread of the data themselves.`,
    },
  ],
  recap: [
    'One sample gives one average. Over many samples the averages form a **sampling distribution**, centred on the true mean.',
    r`Its spread is the **standard error**: $\text{SE} = \text{SD} \div \sqrt{n}$. Four times the data halves it.`,
    'The SD of the data describes people; the standard error describes how far an estimate is likely to be from the truth.',
    '**Central limit theorem:** for large samples the averages are bell-shaped, almost whatever the shape of the data. Giant outliers are the exception that needs care.',
  ],
  next: 'Next: turn the standard error into a range you can report, and find out what "95% confident" really promises.',
};
