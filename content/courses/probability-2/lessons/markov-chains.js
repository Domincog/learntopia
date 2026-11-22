// Probability II: Random Variables · Lesson 6 · A Memory of One Step
import { r, num } from '../../../kit.js';
import { fracText, fracChain, slips, eqDec, probFeedback, PROB_HOW, PROB_TOL } from '../helpers.js';

/** The weather rule of the whole lesson: sunny stays sunny 90% of the time, rainy stays rainy 60% of the time. */
const WEATHER = {
  type: 'markov-flow',
  states: [{ name: 'Sunny', color: 'yellow' }, { name: 'Rainy', color: 'blue' }],
  P: [[0.9, 0.1], [0.4, 0.6]],
  words: { step: 'day', steps: 'days', unit: 'towns' },
};

/** A fair game of one coin a round, played until the gambler has 0 or 4 coins. */
const RUIN = {
  type: 'markov-flow',
  states: [{ name: '0 coins', color: 'red' }, { name: '1 coin', color: 'blue' }, { name: '2 coins', color: 'blue' }, { name: '3 coins', color: 'blue' }, { name: '4 coins', color: 'green' }],
  P: [[1, 0, 0, 0, 0], [0.5, 0, 0.5, 0, 0], [0, 0.5, 0, 0.5, 0], [0, 0, 0.5, 0, 0.5], [0, 0, 0, 0, 1]],
  start: [0, 1000, 0, 0, 0],
  chart: false,
  buttons: [1, 10],
  words: { step: 'round', steps: 'rounds', unit: 'gamblers' },
};

/** The worked example of the lesson: each week 20% of the books on the shelf are borrowed, and 60% of the books on loan come back. */
const LIBRARY = {
  type: 'markov-flow',
  states: [{ name: 'On the shelf', color: 'green' }, { name: 'On loan', color: 'violet' }],
  P: [[0.8, 0.2], [0.6, 0.4]],
  static: true, flows: true, chart: false,
  words: { step: 'week', steps: 'weeks', unit: 'books' },
};

export default {
  id: 'markov-chains',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Weather with a short memory',
      text: `
        In a certain town the weather follows one simple rule. After a sunny day, the next day is sunny
        90% of the time. After a rainy day, the next day is rainy 60% of the time.

        **Over many years, what percentage of the days are sunny?**
      `,
      min: 0, max: 100, step: 1, answer: 80, tolerance: 4, unit: '%', start: 50,
      explain: `
        80%. Not 90%, and not something half-way between the two rules either.

        Following one town day by day gives you a single zigzag of sun and rain. There is a better
        way: follow a whole crowd of towns at once.
      `,
    },
    {
      id: 'teach-crowd',
      type: 'info',
      title: 'Follow a crowd',
      text: r`
        Picture **1000 towns** that all obey the weather rule, and are all sunny today.

        Each tank holds the towns with one kind of weather. Each arrow carries a fixed share of its
        tank every day: 10% of the sunny towns turn rainy, and 40% of the rainy towns turn sunny
        (the other 60% stay rainy).

        :::example
        **The first day.** Of the 1000 sunny towns, $0.1 \times 1000 = 100$ turn rainy. No town is
        rainy yet, so none comes back. Tomorrow: **900 sunny, 100 rainy**.
        :::

        These are averages: what to expect across many such crowds.
      `,
      figure: {
        ...WEATHER, start: [1000, 0], static: true, flows: true, chart: false,
        alt: 'Two tanks, Sunny and Rainy. All 1000 towns are in the Sunny tank. An arrow marked 10% leads from Sunny to Rainy and will carry 100 towns; an arrow marked 40% leads back and carries none yet.',
      },
    },
    {
      id: 'crowd',
      type: 'interact',
      attempts: 6,
      title: 'A thousand towns',
      text: `
        Here are the 1000 towns, all sunny today. By tomorrow, 10% of them will have turned rainy.

        The numbers are averages, rounded to whole towns. **Press "Next day" until they stop changing.**
      `,
      widget: {
        ...WEATHER, start: [1000, 0], buttons: [1], flows: true,
        alt: 'Two tanks, Sunny and Rainy, joined by arrows: 10% of sunny towns turn rainy each day, 40% of rainy towns turn sunny. A chart below tracks the share of towns in each tank.',
      },
      check: (s) => {
        if (s.settled) return true;
        if (s.step === 0) return 'Press "Next day" to move every town forward by one day.';
        if (s.still) return 'The numbers held still for a day, but they are still creeping by a fraction of a town. Keep going a little longer.';
        return `Day ${s.step}: the numbers are still moving. Keep going.`;
      },
      solution: { steps: 12 },
      explain: `
        The sunny tank drains quickly at first, 1000, 900, 850, 825, and then more and more slowly,
        until it sits at **800 sunny, 200 rainy**.

        Towns keep changing their weather every day. But from then on, the number that leave each
        tank is matched by the number that arrive.
      `,
    },
    {
      id: 'other-start',
      type: 'interact',
      attempts: 6,
      title: 'Does the start matter?',
      text: `
        Maybe 800 only came out because every town started sunny.

        **Choose a different start, and run the days until the numbers settle again.** The dotted grey
        lines in the chart show the run that started all sunny.
      `,
      widget: {
        ...WEATHER, start: [1000, 0], buttons: [1, 10], ghost: [1000, 0],
        starts: [{ label: 'All sunny', counts: [1000, 0] }, { label: 'All rainy', counts: [0, 1000] }, { label: 'Half and half', counts: [500, 500] }],
        alt: 'The Sunny and Rainy tanks again, with buttons to start all sunny, all rainy or half and half.',
      },
      check: (s) => {
        if (s.start[0] === 1000) return 'This run starts with every town sunny, like the last one. Choose "All rainy" or "Half and half" first.';
        if (s.settled) return true;
        if (s.step === 0) return 'Now run the days: press "Next day" or "10 days".';
        if (s.still) return 'The numbers held still for a day, but they are still creeping by a fraction of a town. Keep going a little longer.';
        return `Day ${s.step}: the numbers are still moving. Keep going.`;
      },
      solution: { start: [0, 1000], steps: 14 },
      explain: `
        800 sunny and 200 rainy again. Whatever the weather on the first day, this chain ends up with
        the same shares: it **forgets where it started**.

        That is also the answer to the opening question. In the long run, each single town is sunny on 80% of its days.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'Markov chains',
      text: `
        The weather rule is a **Markov chain**: a set of **states** (sunny, rainy), and for each state the
        probabilities of where to go next.

        :::key
        In a Markov chain, the next state depends **only on the current state**, not on how you got there.
        It has a memory of exactly one step.
        :::

        Shares that no longer change from one step to the next are called a **steady state**.

        :::fun
        Andrey Markov introduced these chains in 1906. In 1913 he tried them out on poetry: he sorted the
        first 20,000 letters of Pushkin's *Eugene Onegin* into vowels and consonants, and showed that
        each letter's type depends on the letter before it.
        :::
      `,
    },
    {
      id: 'balance',
      type: 'interact',
      title: 'Find the balance by hand',
      text: `
        Two brands share **1000 customers**. Every week, 20% of brand A's customers switch to B, and 30%
        of brand B's customers switch to A.

        **Share out the customers so that nothing changes next week.**
      `,
      widget: {
        type: 'markov-flow', mode: 'place',
        states: [{ name: 'Brand A', color: 'orange' }, { name: 'Brand B', color: 'teal' }],
        P: [[0.8, 0.2], [0.3, 0.7]],
        start: [500, 500], placeStep: 10,
        words: { step: 'week', steps: 'weeks', unit: 'customers' },
        alt: 'Two tanks, Brand A and Brand B. Each week 20% of A moves to B and 30% of B moves to A. A slider shares 1000 customers between them, and the arrows show how many would move.',
      },
      check: (s) => {
        if (s.balanced) return true;
        const out = Math.round(s.flows[0][1]);
        const back = Math.round(s.flows[1][0]);
        return out > back
          ? `Brand A would lose ${out} customers and win only ${back}. A has too many.`
          : `Brand A would lose ${out} customers and win ${back}. A has too few.`;
      },
      solution: { counts: [600, 400] },
      hints: ['Watch the two arrows. Nothing changes when the number moving from A to B equals the number moving from B to A.'],
      explain: r`
        With 600 customers at A and 400 at B, each arrow carries 120 people a week:
        $0.2 \times 600 = 120$ and $0.3 \times 400 = 120$.
      `,
    },
    {
      id: 'teach-balance',
      type: 'info',
      title: 'Steady means balanced',
      text: r`
        The slider came to rest where the two arrows carried the same number. Customers keep
        switching, yet the totals stand still.

        :::key
        In a steady state of two states, the **flows balance**: as many move one way as the other.
        :::

        :::example
        Each week 20% of a library's books on the shelf are borrowed, and 60% of its books on loan come back.

        1. Balance the flows: $0.2 \times S = 0.6 \times L$.
        2. Divide both sides by 0.2: $S = 3L$.
        3. Three on the shelf for every one on loan: **75%** are on the shelf in the long run.
        :::

        The picture checks it for 1000 books: 150 leave, 150 come back.
      `,
      figure: {
        ...LIBRARY, start: [750, 250],
        alt: 'Two tanks: 750 books on the shelf and 250 on loan. An arrow marked 20% carries 150 books from the shelf to on loan, and an arrow marked 60% carries 150 books back.',
      },
    },
    {
      id: 'balance-weather',
      type: 'fill',
      title: 'The same trick, without the slider',
      text: `
        Back to the 1000 weather towns, with $S$ sunny and $R$ rainy. Each day 10% of the sunny towns
        turn rainy, and 40% of the rainy towns turn sunny.

        **Balance the flows.**
      `,
      template: r`
        In the steady state, $0.1 \times S = 0.4 \times R$. So there are [[4]] times as many sunny towns as rainy ones.

        Out of 1000 towns, that makes [[800]] sunny and [[200]] rainy.
      `,
      hints: ['Divide both sides of the equation by 0.1.', 'If $S = 4R$, then the 1000 towns are 5 equal parts: 4 sunny and 1 rainy.'],
      explain: r`
        $0.1 \times S = 0.4 \times R$ gives $S = 4R$. With $S + R = 1000$, that is $5R = 1000$: so $R = 200$ and $S = 800$.

        The tanks agree. No stepping was needed.
      `,
    },
    {
      id: 'steady',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [a, b] = rng.pick([[10, 40], [10, 30], [20, 30], [30, 20], [5, 20], [30, 10], [40, 10], [5, 45], [15, 35], [10, 15]]);
        const answer = (100 * b) / (a + b);
        const scene = rng.pick([
          { text: `A machine is either working or broken. A working machine has a **${a}%** chance of breaking down by the next day. A broken one has a **${b}%** chance of being repaired by the next day.`, ask: 'what percentage of days is the machine working', A: 'working', B: 'broken', stay: 'a working machine is still working the next day' },
          { text: `In a mountain village, a dry day is followed by a wet one **${a}%** of the time, and a wet day is followed by a dry one **${b}%** of the time.`, ask: 'what percentage of days are dry', A: 'dry', B: 'wet', stay: 'a dry day is followed by another dry day' },
          { text: `Each week a shopper buys either brand X or brand Y. After a week with X, there is a **${a}%** chance of switching to Y. After a week with Y, there is a **${b}%** chance of switching to X.`, ask: 'in what percentage of weeks does the shopper buy brand X', A: 'brand X', B: 'brand Y', stay: 'a week with X is followed by another week with X' },
        ]);
        return {
          text: `${scene.text}\n\n**In the long run, ${scene.ask}?**`,
          answer,
          unit: '%',
          wrong: slips(answer, [
            [100 - a, `That is the chance that ${scene.stay}. The long-run share comes from balancing the two flows.`],
            [(100 * a) / (a + b), `That is the long-run share of "${scene.B}". The question asks about "${scene.A}".`],
            [50, 'Two states do not have to share the time equally. Balance the flows between them.'],
          ]),
          hints: [
            `Call the long-run shares A (${scene.A}) and B (${scene.B}). In the steady state, ${a}% of A equals ${b}% of B.`,
            `So A : B = ${b} : ${a}. What share of the whole is A?`,
          ],
          explain: r`
            In the steady state the flows balance: ${a}% of the "${scene.A}" share equals ${b}% of the "${scene.B}" share.
            So the two shares are in the ratio ${b} : ${a}, and "${scene.A}" takes $\dfrac{${b}}{${a} + ${b}} = ${num(answer)}\%$.
          `,
        };
      },
    },
    {
      id: 'example-two-steps',
      type: 'info',
      title: 'One step, by hand',
      text: r`
        The steady state is where a chain ends up. To see how it gets there, step the crowd forward
        yourself. After each step, a tank holds those who **stayed** plus those who **came back**.

        :::example
        **1000 library books**, all on the shelf today. Each week 20% of the shelf books are borrowed
        and 60% of the books on loan come back.

        - After 1 week: $0.8 \times 1000 = 800$ on the shelf, 200 on loan.
        - After 2 weeks: $\mathord{0.8 \times 800 + 0.6 \times 200 = 760}$ on the shelf.
        :::

        The picture shows the second week: 160 books leave the shelf, so 640 stay, and 120 come back.
        Keep stepping and the shelf settles at 750, the balance point.
      `,
      figure: {
        ...LIBRARY, start: [800, 200],
        alt: 'Two tanks: 800 books on the shelf and 200 on loan. An arrow marked 20% will carry 160 books from the shelf to on loan, and an arrow marked 60% will carry 120 books back.',
      },
    },
    {
      id: 'two-steps',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.pick([10, 20, 30, 40]);
        const b = rng.pick([10, 20, 30, 40, 50]);
        const a1 = 1000 - 10 * a;
        const b1 = 10 * a;
        const stay = (a1 * (100 - a)) / 100;
        const back = (b1 * b) / 100;
        const answer = stay + back;
        const scene = rng.pick([
          { text: `**1000 customers** all use brand A today. Each week, **${a}%** of brand A's customers switch to brand B, and **${b}%** of brand B's customers switch to A.`, ask: 'On average, how many customers use brand A after two weeks', A: 'with A', B: 'with B', step: 'week', unit: 'customers' },
          { text: `**1000 shared bikes** all start the day at the station. Each day, **${a}%** of the bikes at the station end up in town, and **${b}%** of the bikes in town are brought back to the station.`, ask: 'On average, how many bikes are at the station after two days', A: 'at the station', B: 'in town', step: 'day', unit: 'bikes' },
        ]);
        return {
          text: `${scene.text}\n\n**${scene.ask}?**`,
          answer,
          unit: scene.unit,
          wrong: slips(answer, [
            [a1, `That is after one ${scene.step}. Take one more step.`],
            [stay, `That only counts the ones that stayed both times. In the second ${scene.step}, ${b}% of the ${b1} ${scene.B} come back.`],
            [1000 - 20 * a, `The second ${scene.step} does not take away another ${10 * a}: fewer are left to leave, and some come back.`],
          ]),
          hints: [
            `After one ${scene.step}: ${a1} ${scene.A} and ${b1} ${scene.B}.`,
            `In the second ${scene.step}, ${100 - a}% of the ${a1} stay, and ${b}% of the ${b1} come back.`,
          ],
          explain: r`
            After one ${scene.step}: ${a1} ${scene.A}, ${b1} ${scene.B}. After two:
            $${(100 - a) / 100} \times ${a1} + ${b / 100} \times ${b1} = ${stay} + ${back} = ${answer}$.
            Stepping a crowd forward is just this, again and again.
          `,
        };
      },
    },
    {
      id: 'ruin-hook',
      type: 'choice',
      mode: 'predict',
      title: 'Double or nothing, slowly',
      text: `
        A gambler has **1 coin**. Each round she bets one coin on a fair coin flip: heads she wins a
        coin, tails she loses one. She stops when she has **4 coins**, or when she has none left.

        **What is her chance of reaching 4 coins?**
      `,
      shuffle: false,
      options: [
        { text: '1 in 2: the game is fair' },
        { text: '1 in 3' },
        { text: '1 in 4', correct: true },
        { text: '1 in 8' },
      ],
      explain: `
        1 in 4. Every single flip is fair, but she starts much closer to ruin than to her goal.

        Her fortune is a Markov chain too. Its states are the fortunes 0, 1, 2, 3 and 4, and each round
        she moves one state up or down.
      `,
    },
    {
      id: 'ruin',
      type: 'interact',
      attempts: 6,
      title: 'A thousand gamblers',
      text: `
        Here are **1000 gamblers**, each starting with 1 coin. Each tank is a fortune. Every round, half
        of each middle tank moves up and half moves down. The tanks for 0 and 4 coins have no arrows leading out.

        **Run the game until the numbers stop changing.**
      `,
      widget: {
        ...RUIN,
        alt: 'Five tanks in a row for fortunes of 0, 1, 2, 3 and 4 coins. Arrows marked 50% join neighbouring tanks; the tanks for 0 and 4 coins have no way out.',
      },
      check: (s) => {
        if (s.settled) return true;
        if (s.step === 0) return 'Press "Next round" or "10 rounds" to let everyone play.';
        if (s.moving >= 0.5) return `About ${Math.round(s.moving)} ${Math.round(s.moving) === 1 ? 'gambler is' : 'gamblers are'} still playing. Keep going.`;
        return 'Almost everyone has stopped, but the numbers have not quite settled. A few more rounds.';
      },
      solution: { steps: 40 },
      explain: `
        **750** gamblers end with nothing and **250** with 4 coins: a chance of 1 in 4. The middle
        tanks drain until they are empty, because every gambler who reaches an end tank stays there.
      `,
    },
    {
      id: 'teach-absorbing',
      type: 'info',
      title: 'Why one in four?',
      text: r`
        States like 0 and 4, which can never be left, are called **absorbing**. In the end every
        gambler sits in one of them.

        The game is fair, so the average fortune of the crowd never changes: it stays at 1 coin each.
        At the end every fortune is 0 or 4, and an average of 1 means a quarter of the crowd holds 4.

        :::example
        A gambler starts with **2 coins** and stops at **7 coins**, or at none.

        1. The game is fair, so the average fortune stays at 2.
        2. At the end the fortune is 7 with probability $P$, and 0 otherwise: an average of $7 \times P$.
        3. So $7 \times P = 2$, and $P = \dfrac{2}{7}$.
        :::
      `,
      figure: {
        ...RUIN, start: [750, 0, 0, 0, 250], static: true,
        alt: 'Five tanks in a row for fortunes of 0, 1, 2, 3 and 4 coins, at the end of the game: 750 gamblers in the tank for 0 coins, 250 in the tank for 4 coins, and none in between.',
      },
    },
    {
      id: 'ruin-chance',
      type: 'numeric',
      review: true,
      stretch: true,
      gen: (rng) => {
        const goal = rng.pick([4, 5, 6, 8, 10]);
        const k = rng.int(1, goal - 1);
        const answer = k / goal;
        const story = rng.pick([
          `A gambler starts with **${k === 1 ? '1 coin' : `${k} coins`}**. Each round she wins or loses 1 coin on the flip of a fair coin. She stops when she has **${goal} coins**, or when she has none.\n\n**What is the probability that she reaches ${goal} coins?**`,
          `A token stands on square **${k}** of a track numbered 0 to ${goal}. Each turn a fair coin decides whether it moves one square up or one square down. The game ends when the token reaches square 0 or square ${goal}.\n\n**What is the probability that it ends on square ${goal}?**`,
        ]);
        return {
          text: `${story} ${PROB_HOW}`,
          answer: `${k}/${goal}`,
          display: fracText(k, goal),
          tolerance: PROB_TOL,
          wrong: slips(answer, [
            [(goal - k) / goal, 'That is the chance of ending at 0. The question asks about the other end.'],
            [1 / 2, 'Each step is fifty-fifty, but the two ends are not equally far away.'],
            [1 / goal, `That would be right for a start at 1. This start is at ${k}.`],
          ], PROB_TOL),
          feedback: probFeedback(answer),
          hints: [
            `The game is fair, so the average position never changes: it stays at ${k}.`,
            `At the end the position is 0 or ${goal}. What chance of ${goal} gives an average of ${k}?`,
          ],
          explain: r`
            A fair game keeps the average where it started: at ${k}. The game ends at 0 or at ${goal}, so
            $${goal} \times P = ${k}$, and $P = ${fracChain(k, goal)} ${eqDec(answer)}$.
          `,
        };
      },
    },
    {
      id: 'remembers',
      type: 'choice',
      text: `
        The weather chain forgot its start: 800 sunny towns, whatever the first day looked like.

        **Does the gambler's chain forget where it started too?**
      `,
      options: [
        { text: 'No: start a gambler with 3 coins instead of 1, and she reaches 4 far more often', correct: true },
        { text: 'Yes: every Markov chain settles into shares that do not depend on the start', why: 'The weather chain does, because every state can be reached from every other. Here, a gambler who lands in tank 0 or 4 never leaves, so where she started decides where she is likely to be trapped.' },
        { text: 'Yes, because the game is fair', why: 'Fairness keeps the average fortune fixed. That is exactly why the start matters: a higher start means a better chance of the top tank.' },
      ],
      explain: `
        It remembers. From 1 coin the chance of reaching 4 is 1 in 4; from 3 coins it is 3 in 4.

        A chain forgets its start when you can get from every state to every other and the crowd
        keeps mixing, as the weather does. Absorbing states stop the mixing, so the end depends on the beginning.
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these statements about Markov chains are **true**?',
      options: [
        { text: 'The next state depends only on the current state, not on the path that led there', correct: true },
        { text: 'In a steady state of two states, as many move from the first to the second as move back', correct: true },
        { text: 'An absorbing state is one that can never be left', correct: true },
        { text: 'In a steady state, nobody changes state any more', why: 'Towns went on changing their weather every day. The flows in the two directions cancel, so the totals stay the same.' },
        { text: 'Every Markov chain ends up with the same shares, whatever its start', why: "The gambler's chain does not: with absorbing states, the start decides where the crowd is trapped." },
      ],
      explain: `
        States, one step of memory, flows that balance. The same idea ranks web pages: a surfer who
        clicks links at random settles into a steady state, and the pages with the biggest share come
        out on top. It also writes text one word at a time, as in
        [Guess the Next Word](#/learn/ai/predicting-words), where each word depends on the one before.
      `,
    },
  ],
  recap: [
    'A **Markov chain** has states and step probabilities. The next state depends only on the current one.',
    'Follow a crowd instead of one walker: the shares settle into a **steady state**, where the flows balance.',
    'For two states, set flow out equal to flow in and solve. Chains like the weather forget where they started.',
    '**Absorbing states** cannot be left. A fair game from $k$ coins reaches $N$ coins with probability $k/N$.',
  ],
  next: 'That completes Probability II. You can now count without listing, measure how much a random quantity wobbles, explain where the bell curve comes from, and follow chance as it unfolds over time.',
};
