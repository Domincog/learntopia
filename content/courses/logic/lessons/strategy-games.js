// Logic & Deduction · Lesson 6 · Winning Backwards
import { plural } from '../../../kit.js';

const RULES = 'Two players take turns removing stones from one pile. Whoever takes the **last stone wins**.';

/** Feedback on a first move in a "take 1 to k" game, for a pile of n. */
const moveFeedback = (n, k) => (v) => {
  const m = k + 1;
  if (!Number.isInteger(v) || v < 1 || v > k) return `You may only take a whole number of stones from 1 to ${k}.`;
  const left = n - v;
  const reply = left % m;
  return `That leaves ${left}. Your opponent can take ${reply} and leave *you* on ${left - reply}, a multiple of ${m}.`;
};

export default {
  id: 'strategy-games',
  steps: [
    {
      id: 'play',
      type: 'interact',
      graded: false,
      title: 'Fifteen stones',
      text: `
        A game for two. There are **15 stones**. On your turn you take **1, 2 or 3** of them.
        Whoever takes the **last stone wins**.

        You move first. **Play a full game against the computer**, or a few, and then press Check.
      `,
      widget: { type: 'nim-game', stones: 15, take: [1, 2, 3], first: 'you' },
      check: (s) => s.games >= 1 || 'Play one game through to the last stone first.',
      solution: { won: true },
      explain: `
        Did the computer beat you? It usually does, and not by luck. It knows exactly which piles to leave you with.
        The trail of numbers under the pile is its fingerprint.

        You are about to learn its secret. The trick is to stop thinking about the first move, and **start at the end**.
      `,
    },
    {
      id: 'four-left',
      type: 'choice',
      shuffle: false,
      columns: 1,
      text: `
        Jump to the end of a game. It is **your turn**, and **4 stones** are left.

        **What is your best move?**
      `,
      options: [
        { text: 'Take 1', why: 'That leaves 3, and your opponent takes all three.' },
        { text: 'Take 2', why: 'That leaves 2, and your opponent takes both.' },
        { text: 'Take 3', why: 'That leaves 1, and your opponent takes it.' },
        { text: 'It makes no difference: every move loses', correct: true },
      ],
      explain: `
        Whatever you take, your opponent takes the rest. Facing 4 stones, you have **already lost**,
        as long as the other player is paying attention.

        Which makes 4 exactly the pile you would like to hand to your opponent.
      `,
    },
    {
      id: 'positions',
      type: 'info',
      title: 'Winning and losing positions',
      text: `
        Give every pile size a label, from the point of view of **the player about to move**.

        - A **losing position**: whatever you do, a careful opponent wins. Four stones is one.
        - A **winning position**: at least one move hands your opponent a losing position.

        With 1, 2 or 3 stones you take them all: winning. With 4, every move leaves 1, 2 or 3: losing.

        :::key
        You do not have to see the whole game ahead. Find the losing positions,
        **and keep leaving your opponent in one**.
        :::
      `,
    },
    {
      id: 'leave-four',
      type: 'numeric',
      gen: (rng) => {
        const n = rng.int(5, 7);
        const answer = n - 4;
        return {
          text: `
            It is your turn, and **${n} stones** are left. You may take 1, 2 or 3.

            **How many should you take** to be certain of winning?
          `,
          answer,
          unit: answer === 1 ? 'stone' : 'stones',
          feedback: (v) => {
            if (!Number.isInteger(v) || v < 1 || v > 3) return 'You may only take 1, 2 or 3 stones.';
            const left = n - v;
            return left <= 3
              ? `That leaves ${left}, and your opponent takes ${left === 1 ? 'it' : 'the lot'}.`
              : `That leaves ${left}. Now your opponent can take ${left - 4} and leave *you* with 4.`;
          },
          hints: ['Which pile would you like your opponent to be facing?'],
          explain: `Take ${answer} and leave **4**. Whatever your opponent does next, you take the rest.`,
        };
      },
    },
    {
      id: 'mark-losing',
      type: 'interact',
      title: 'Work backwards',
      text: `
        Now label the whole game. Each number is a pile size, seen by the player about to move.
        So far you know that 1, 2 and 3 are winning, and 4 is losing.

        **Tap every losing position.** Start with the small piles and work upwards:
        a pile is losing when *every* move from it lands on a winning pile.
      `,
      widget: { type: 'grid', rows: 3, cols: 5, labels: 'index1', colors: ['red'], counter: 'Losing positions', cell: 54 },
      check: (s) => {
        const on = s.on.map((i) => i + 1);
        const wrong = on.find((n) => n % 4 !== 0);
        if (wrong && wrong <= 3) return `With ${plural(wrong, 'stone')} left you just take ${wrong === 1 ? 'it' : 'them all'}. That is a winning position.`;
        if (wrong) return `From ${wrong} you can take ${wrong % 4} and leave ${wrong - (wrong % 4)}. That makes ${wrong} a winning position.`;
        if (!on.length) return 'Start with the one you already know: 4.';
        const missing = [4, 8, 12].find((n) => !on.includes(n));
        if (missing) return `There is another one. Look for a pile from which every move lands on a winning pile${missing > 4 ? `, somewhere above ${missing - 4}` : ''}.`;
        return true;
      },
      solution: { on: [3, 7, 11] },
      hints: [
        '5, 6 and 7 are winning: from each of them you can leave exactly 4.',
        'From 8 you can only reach 7, 6 or 5, and those are all winning for your opponent. So 8 is losing.',
        'The same step repeats. The losing piles are 4, 8 and 12.',
      ],
      explain: `
        The losing positions are **4, 8 and 12**.

        From 8, every move lands on 5, 6 or 7, and from each of those your opponent can leave you on 4.
        At 12 the same thing happens one level up: every move lands on 9, 10 or 11.
      `,
    },
    {
      id: 'teach-multiples',
      type: 'info',
      title: 'The pattern: multiples of 4',
      text: `
        The losing piles, 4, 8 and 12, are the **multiples of 4**. That is no accident.

        - From a multiple of 4 you cannot reach another one: you may take at most 3.
        - From any other pile you can step down to the nearest multiple of 4 below it.

        :::example
        **34 stones**, and it is your move. The nearest multiple of 4 below 34 is 32,
        so take **2**. Your opponent now faces a losing pile.
        :::
      `,
      figure: {
        type: 'nim-game', static: true, stones: 34, groups: 4, taken: ['you', 'you'],
        alt: 'Thirty-four stones. Two have been taken by you, and the 32 that remain are drawn as eight groups of four.',
      },
    },
    {
      id: 'reply',
      type: 'fill',
      text: `
        So the plan is to leave your opponent on a multiple of 4, **every time**.
        Say they are facing 12. How do you get them onto 8, whatever they do?
      `,
      figure: { type: 'nim-game', static: true, stones: 12, groups: 4, alt: 'Twelve stones, drawn as three groups of four.' },
      template: `
        If they take 1, I take [[3]]. If they take 2, I take [[2]]. If they take 3, I take [[1]].

        Each round, the pile shrinks by exactly [[4]].
      `,
      explain: `
        You make every round add up to 4, and their choice stops mattering. 12 becomes 8, 8 becomes 4,
        4 becomes 0, and the last stone is yours.
      `,
    },
    {
      id: 'first-move',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([9, 10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 23, 25, 26, 27, 29, 30]);
        const answer = n % 4;
        return {
          text: `
            ${RULES} On each turn a player takes **1, 2 or 3** stones.

            The pile has **${n} stones** and you go first. **How many should you take** to be sure of winning?
          `,
          answer,
          unit: answer === 1 ? 'stone' : 'stones',
          feedback: moveFeedback(n, 3),
          hints: [`The losing piles are the multiples of 4. Which is the nearest one below ${n}?`, `Leave exactly ${n - answer}.`],
          explain: `
            Leave a multiple of 4. The nearest one below ${n} is ${n - answer}, so take **${answer}**.
            After that, answer each of your opponent’s moves so that the two of you remove 4 between you.
          `,
        };
      },
    },
    {
      id: 'win',
      type: 'interact',
      auto: true,
      attempts: 6,
      title: 'Beat the computer',
      text: `
        The game from the start of the lesson: 15 stones, take 1, 2 or 3, last stone wins, you go first.
        The computer has not become any worse.

        **Win.** If a game slips away, press Check for a pointer, or just play again.
      `,
      widget: { type: 'nim-game', stones: 15, take: [1, 2, 3], first: 'you' },
      check: (s) => {
        if (s.won) return true;
        if (s.slip) return `When there were ${s.slip.from} stones you took ${s.slip.take} and left ${s.slip.left}. Taking ${s.slip.better} would have left ${s.slip.from - s.slip.better}, a multiple of 4.${s.over ? ' Play again.' : ''}`;
        if (s.over) return 'Play again, and leave a multiple of 4 after every one of your moves.';
        return 'Keep going. After each of your moves, the pile should be a multiple of 4.';
      },
      solution: { won: true },
      hints: [
        'Your first move has to leave 12.',
        'After that, whatever the computer takes, take enough to make 4 between you: 12, then 8, then 4, then nothing.',
      ],
      explain: `
        You left 12, then 8, then 4, and each time the computer had nothing but bad moves.
        It plays perfectly, and still it could not escape. **The game was decided by your very first move.**
      `,
    },
    {
      id: 'teach-general',
      type: 'info',
      title: 'New rules, same method',
      text: `
        Change how many stones a player may take, and the losing piles move. The reasoning does not.

        :::example
        Suppose a turn may take **1 to 9** stones. Whatever your opponent takes, you can make the
        round add up to **10**: they take 3, you take 7. So the losing piles are the multiples of 10.
        From 47 stones, take **7** and leave 40.
        :::

        :::key
        The losing piles are the multiples of **one more than the largest move**.
        :::
      `,
    },
    {
      id: 'general',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const k = rng.pick([2, 4, 5, 6]);
        const m = k + 1;
        const base = m * rng.int(2, 6);
        const answer = rng.int(1, k);
        const n = base + answer;
        return {
          text: `
            ${RULES} In this version a player may take **any number from 1 to ${k}** on a turn.

            The pile has **${n} stones** and you go first. **How many should you take** to be sure of winning?
          `,
          answer,
          unit: answer === 1 ? 'stone' : 'stones',
          feedback: moveFeedback(n, k),
          hints: [
            'With moves of 1 to 3, the losing piles were the multiples of 4, because the second player could always make a round total 4. What can a round always total now?',
            `The losing piles are the multiples of ${m}. Step down to the nearest one.`,
          ],
          explain: `
            Whatever your opponent takes, say $t$, you can answer with $${m} - t$, so every round removes ${m}.
            The losing piles are the multiples of **${m}**: one more than the largest move. The nearest one below ${n} is ${base}, so take **${answer}**.
          `,
        };
      },
    },
    {
      id: 'choose-first',
      type: 'interact',
      stretch: true,
      auto: true,
      attempts: 6,
      title: 'Your call',
      text: `
        A new game: **16 stones**, take 1, 2 or 3, last stone wins. This time you decide who starts.

        **Win the game.**
      `,
      widget: { type: 'nim-game', stones: 16, take: [1, 2, 3], first: 'choose' },
      check: (s) => {
        if (s.won) return true;
        if (s.turn === 'choose') return 'First decide who starts. Is 16 a pile you would like to move from?';
        if (s.startedLosing) return `16 is a multiple of 4, so whoever has to move first is in a losing position, and you chose to be that player.${s.over ? ' Play again.' : ''}`;
        if (s.slip) return `When there were ${s.slip.from} stones you took ${s.slip.take} and left ${s.slip.left}. Taking ${s.slip.better} would have left ${s.slip.from - s.slip.better}, a multiple of 4.${s.over ? ' Play again.' : ''}`;
        return s.over ? 'Play again, and think about the starting pile before you choose.' : 'Keep going. After each of your moves, the pile should be a multiple of 4.';
      },
      solution: { won: true },
      hints: [
        'Is 16 a winning or a losing position for the player who has to move?',
        'Let the computer start. Then answer each of its moves so that the two of you remove 4.',
      ],
      explain: `
        16 is a multiple of 4, a **losing** position for whoever must move. So the winning move comes before
        the game begins: let the computer go first. After that, you answer each of its moves to make 4.

        Knowing the losing positions tells you how to play, and also *whether* to play first.
      `,
    },
    {
      id: 'sort-positions',
      type: 'bucket',
      review: true,
      gen: (rng) => {
        const k = rng.pick([2, 3, 4]);
        const m = k + 1;
        const losing = rng.sample([m, 2 * m, 3 * m, 4 * m], 3);
        const pool = [];
        for (let n = k + 2; n <= 4 * m + k; n++) if (n % m !== 0) pool.push(n);
        const winning = rng.sample(pool, 4);
        const items = [
          ...losing.map((n) => ({ text: plural(n, 'stone'), bucket: 1, why: `From ${n}, every move leaves a pile that is not a multiple of ${m}, and the opponent can step straight back down to one. ${n} is losing.` })),
          ...winning.map((n) => ({ text: plural(n, 'stone'), bucket: 0, why: `From ${n} you can take ${n % m} and leave ${n - (n % m)}, a multiple of ${m}. So ${n} is winning.` })),
        ].sort((a, b) => parseInt(a.text, 10) - parseInt(b.text, 10));
        return {
          text: `
            ${RULES} On each turn a player takes **${k === 2 ? '1 or 2' : `between 1 and ${k}`}** stones.

            Sort these piles by what they mean for **the player about to move**.
          `,
          buckets: ['Winning position', 'Losing position'],
          items,
          hints: [`Work up from the smallest piles. With 1 to ${k} stones you take everything. What about ${m}?`],
          explain: `
            A round can always be made to total ${m}, so the losing positions are the multiples of **${m}**.
            Every other pile is winning, because the player to move can step down to a multiple of ${m}.
          `,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Thinking forwards from 15 stones, there are thousands of different ways the game could go.

        **Why does working backwards from the end make it manageable?**
      `,
      model: `
        Going forwards, every move branches into up to three more, and the branches multiply.
        Going backwards, each pile size gets a single label, winning or losing, and that label depends only on
        smaller piles that are already settled. Fifteen small questions replace thousands of possible games.
        Once the labels are known, the best move is simply the one that leaves a losing position.
      `,
    },
  ],
  recap: [
    'Label positions for the player about to move: **losing** if every move helps the opponent, **winning** if some move leaves a losing position.',
    'Find the labels by working backwards from the end of the game.',
    'Take 1 to 3, last stone wins: the losing piles are the multiples of 4. Always leave one.',
    'Take 1 to *k*: the losing piles are the multiples of *k* + 1.',
  ],
  next: 'That is the end of the course. The same habits (rule things out, test assumptions, work backwards) will serve you in every other subject.',
};
