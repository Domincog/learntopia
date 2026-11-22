// Algorithms · Lesson 2 · Halve It
import { r, range } from '../../../kit.js';
import { group, guessSplit, guessSplitFigure, halvingChain, halvingFigure } from '../helpers.js';

/** The worked "what does a guess rule out?" example: one guess on a short range. */
const SPLIT_DEMO = { max: 20, guess: 5 };
const SPLIT = guessSplit(SPLIT_DEMO.max, SPLIT_DEMO.guess);

/** The worked search on a sorted row: binary search flips cards 4 and 6, and the learner flips the last one. */
const ROW_DEMO = { values: [14, 22, 35, 47, 53, 68, 81], target: 53 };

/** The worked count. 60 is not a size that "count-guesses" can ask about. */
const COUNT_DEMO = 60;
const COUNT_CHAIN = halvingChain(COUNT_DEMO);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const capital = (word) => word[0].toUpperCase() + word.slice(1);

export default {
  id: 'binary-search',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      directional: false,
      title: 'How many guesses?',
      text: `
        I am thinking of a whole number from **1 to 100**. After each guess I will tell you *higher*, *lower* or *correct*.

        Play as cleverly as you can. **How many guesses do you need to be certain of getting it**, even with the worst luck?
      `,
      min: 0, max: 100, step: 1, start: 0, answer: 7, unit: 'guesses',
      explain: `
        **Seven.** Not 50, not 99: seven guesses are always enough for a hundred numbers, as long as each guess is well chosen.

        Play a round and see whether you can spot how.
      `,
    },
    {
      id: 'play',
      type: 'interact',
      graded: false,
      attempts: 6,
      title: 'Play a round',
      text: `
        A number from 1 to 100 is hidden. **Tap the bar to choose a guess, then press Guess.**

        Keep an eye on the strip at the top: what happens to the numbers that are ruled out?
      `,
      widget: { type: 'guess-number', max: 100 },
      check: (s) => s.found || 'Keep guessing until you find the number.',
      solution: { found: true },
      explain: `
        Every answer wipes out a piece of the range: everything on the wrong side of your guess.

        The question is how to make sure it is always a **big** piece.
      `,
    },
    {
      id: 'teach-worst-case',
      type: 'info',
      title: 'What a guess rules out',
      text: `
        An answer rules out your guess and every number on the wrong side of it. How many that is depends on the answer, so a careful player asks: *what if the answer goes against me?*

        :::example
        The numbers 1 to ${SPLIT_DEMO.max}, and you guess ${SPLIT_DEMO.guess}.

        - "Lower" leaves 1 to ${SPLIT_DEMO.guess - 1}: **${SPLIT.lower} numbers**.
        - "Higher" leaves ${SPLIT_DEMO.guess + 1} to ${SPLIT_DEMO.max}: **${SPLIT.higher} numbers**.

        With bad luck, ${SPLIT.worst} numbers are still alive. Judge a guess by that figure.
        :::
      `,
      figure: guessSplitFigure(SPLIT_DEMO.max, SPLIT_DEMO.guess),
    },
    {
      id: 'best-first',
      type: 'choice',
      shuffle: false,
      text: `
        A new game, 1 to 100. You want a first guess that rules out as many numbers as possible **even if the answer goes against you**.

        What should you guess?
      `,
      options: [
        { text: '1', why: 'The answer will almost certainly be "higher", and then you have ruled out a single number.' },
        { text: '10', why: 'If the answer is "higher", 90 numbers are still alive. Only a lucky "lower" would help.' },
        { text: '50', correct: true, why: 'Whatever the answer, at most 50 numbers survive.' },
        { text: '90', why: 'If the answer is "lower", 89 numbers are still alive.' },
      ],
      explain: `
        A guess in the **middle** cuts the numbers into two halves, and one of the halves always disappears.

        No answer can hurt you. That is the whole trick.
      `,
    },
    {
      id: 'halving',
      type: 'info',
      title: 'Halve, halve, halve',
      text: `
        Always guess the **middle of what is left**. Then each answer throws away half of the remaining numbers (give or take one), and the pile you face shrinks like this:

        **100 → 50 → 25 → 12 → 6 → 3 → 1**

        Seven piles, one guess for each. The last pile holds a single number, so the seventh guess cannot miss.

        This method is called **binary search**: *binary* because every step splits the possibilities in two.
      `,
      figure: halvingFigure(100),
    },
    {
      id: 'beat-the-cheat',
      type: 'interact',
      auto: true,
      attempts: 6,
      title: 'Against the worst luck there is',
      text: `
        This time the game cheats. It has **not** picked a number. After each guess it gives whichever answer keeps *more* numbers alive, so your luck is as bad as it can possibly be.

        **Pin the number down in 7 guesses or fewer anyway.**
      `,
      widget: { type: 'guess-number', max: 100, adversary: true, limit: 7 },
      check: (s) => {
        if (s.found) return s.guesses <= 7 || `You got there, but in ${s.guesses} guesses. Press **New game** and aim every guess at the middle of what is left.`;
        if (s.guesses >= 7) return `Seven guesses are gone and ${s.left === 1 ? '1 number is' : `${s.left} numbers are`} still alive. Press **New game** and aim every guess at the middle of what is left.`;
        return 'Keep going until the number is found.';
      },
      solution: { found: true },
      hints: [
        'Guess the middle of the numbers that are still alive. For 1 to 100 that is 50.',
        'After each answer, work out the middle of the *new* range. For 51 to 100 it is 75.',
        'The big bar always shows just the numbers still alive, so its centre is the guess you want.',
      ],
      explain: `
        Even a cheating opponent cannot stop you. A guess in the middle halves the pile **whatever** the answer is:

        **100 → 50 → 25 → 12 → 6 → 3 → 1**

        That is what "always enough" means: seven guesses work in the worst case, not just on a lucky day.
      `,
    },
    {
      id: 'teach-sorted-row',
      type: 'info',
      title: 'From a game to real data',
      text: `
        Computers rarely play guessing games. They search **lists**. Binary search works there too, as long as the list is **sorted**.

        :::example
        Seven cards, sorted from smallest to largest. Find **${ROW_DEMO.target}**.

        1. Flip the middle card, card 4. It shows ${ROW_DEMO.values[3]}: too low. In a sorted row cards 1 to 3 are lower still, so they are ruled out without a look.
        2. Cards 5 to 7 are left. Flip the middle one, card 6. It shows ${ROW_DEMO.values[5]}: too high, and card 7 is higher still.
        3. Only card 5 is left.
        :::

        **Flip card 5** to finish the search.
      `,
      figure: {
        type: 'card-row', values: ROW_DEMO.values, target: ROW_DEMO.target, flipped: [3, 5], redeal: false,
        alt: `Seven cards in a sorted row. Card 4 is face up and shows ${ROW_DEMO.values[3]}, card 6 is face up and shows ${ROW_DEMO.values[5]}. Cards 1, 2, 3 and 7 are ruled out. Card 5 is still face down.`,
      },
    },
    {
      id: 'cards-sorted',
      type: 'interact',
      auto: true,
      attempts: 6,
      title: 'Three flips',
      text: `
        Your turn. Here are 7 new cards, face down, **sorted** from smallest to largest.

        **Find the target card in 3 flips or fewer.**
      `,
      widget: { type: 'card-row', count: 7, sorted: true },
      check: (s) => {
        if (!s.found) return `Keep flipping until you find ${s.target}.`;
        return s.flips <= 3 || `Found, but in ${s.flips} flips. Three are always enough: press **New cards** and start with the middle card.`;
      },
      solution: { found: true },
      hints: [
        'Start with card 4, the middle one. Whatever it shows, half the row is ruled out.',
        'Then flip the middle card of the three that are left.',
      ],
      explain: r`
        The middle card of seven leaves at most three cards in play, **because the row is sorted**, and the middle one of those leaves a single card.

        $7 \to 3 \to 1$: three flips are always enough for 7 cards.
      `,
    },
    {
      id: 'cards-shuffled',
      type: 'interact',
      graded: false,
      attempts: 8,
      title: 'Now shuffle the row',
      text: `
        Seven cards again, but this time in **random order**. And, as before, expect the worst luck.

        Find the target. Does starting in the middle still help?
      `,
      widget: { type: 'card-row', count: 7, sorted: false, unlucky: true, redeal: false },
      check: (s) => s.found || `Keep flipping until you find ${s.target}.`,
      solution: { found: true },
      explain: `
        Seven flips for seven cards: with the worst luck, the target was under the last card you turned.

        Starting in the middle did not help. No flip ruled out anything except the card itself.
      `,
    },
    {
      id: 'teach-linear',
      type: 'info',
      title: 'No order, no halving',
      text: `
        Checking items one after another is called **linear search**. It is all you can do when the items are in no order: each look tells you about that one item and nothing about the others. With the worst luck it looks at every item: 7 flips for 7 cards, a million looks for a million names. (With ordinary luck, about half of them.)

        :::key
        Binary search only works on **sorted** data. That is a big reason why computers keep so many things in order.
        :::

        The test: *does one look tell you which side to throw away?* In a contact list kept in alphabetical order it does. In a box of loose photographs it does not.
      `,
    },
    {
      id: 'next-check',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const values = rng.sample(range(10, 100), 7).sort((a, b) => a - b);
        const stage = rng.pick([0, 1, 1, 2, 2]);
        const t = stage === 2 ? rng.pick([0, 2, 4, 6]) : rng.pick([0, 1, 2, 4, 5, 6]);
        const target = values[t];
        // the cards binary search turns over on its way to the target
        const path = [];
        let lo = 0;
        let hi = 6;
        const reasons = [];
        for (;;) {
          const mid = Math.floor((lo + hi) / 2);
          if (path.length === stage) { path.push(mid); break; }
          path.push(mid);
          if (values[mid] < target) { reasons.push(`card ${mid + 1} shows ${values[mid]}, which is too low, so the target lies to its right`); lo = mid + 1; }
          else { reasons.push(`card ${mid + 1} shows ${values[mid]}, which is too high, so the target lies to its left`); hi = mid - 1; }
        }
        const open = path.slice(0, stage);
        const answer = path[stage];
        const live = lo === hi ? `only card ${lo + 1} is` : `cards ${lo + 1} to ${hi + 1} are`;
        return {
          text: stage === 0
            ? `Binary search is about to look for **${target}** in this sorted row of face-down cards. **Tap the card it should turn over first.**`
            : `Binary search is looking for **${target}** in this sorted row. It has already turned over the ${stage === 1 ? 'card' : 'cards'} you can see. **Tap the card it should turn over next.**`,
          widget: { type: 'card-row', values, target, open, pick: true },
          check: (s) => {
            if (s.picked == null) return 'Tap one of the face-down cards.';
            if (s.picked === answer) return true;
            for (const j of open) {
              if (values[j] < target && s.picked < j) return `Card ${j + 1} shows ${values[j]}, which is lower than ${target}. In a sorted row everything to its left is lower still.`;
              if (values[j] > target && s.picked > j) return `Card ${j + 1} shows ${values[j]}, which is higher than ${target}. In a sorted row everything to its right is higher still.`;
            }
            return stage === 0
              ? 'Any card could be the target. Only the **middle** one guarantees that half the row is ruled out, whatever it shows.'
              : `That card is still in play, but so are others: ${live} possible. Turn over the middle one of those.`;
          },
          solution: { picked: answer },
          hints: [
            'First work out which cards could still be the target. The row is sorted, smallest on the left.',
            'Binary search always turns over the middle card of the ones still in play.',
          ],
          explain: stage === 0
            ? `Nothing is known yet, so all 7 cards are in play. The middle one is **card ${answer + 1}**: whatever it shows, at most 3 cards remain.`
            : `Here ${reasons.join(', and ')}. So ${live} still in play, and the middle of that is **card ${answer + 1}**.`,
        };
      },
    },
    {
      id: 'where-it-works',
      type: 'bucket',
      review: true,
      text: 'Binary search needs order. **Where does halving work, and where are you stuck checking one by one?**',
      buckets: ['Halving works', 'One by one'],
      items: [
        { text: 'A word in a printed dictionary', bucket: 0, why: 'A dictionary is in alphabetical order: open it in the middle and you know which half your word is in.' },
        { text: 'A name in an alphabetical list', bucket: 0, why: 'Alphabetical order is an order: one look in the middle rules out half the list.' },
        { text: 'Page 212 of a book', bucket: 0, why: 'Page numbers are in order: open the book anywhere and you know whether to go forward or back.' },
        { text: 'One sock in a messy drawer', bucket: 1, why: 'Nothing about one sock tells you where another one is.' },
        { text: 'A card in a shuffled deck', bucket: 1, why: 'In a shuffled deck, seeing one card says nothing about where another is.' },
        { text: 'A face in a crowd', bucket: 1, why: 'A crowd is not sorted: every face you check rules out just that one person.' },
      ],
      explain: `
        Dictionaries, alphabetical lists and page numbers are **sorted**, so one look in the middle rules out half of what is left.

        A messy drawer, a shuffled deck and a crowd have no order. Every look rules out just one thing.
      `,
    },
    {
      id: 'teach-count',
      type: 'info',
      title: 'Count the piles',
      text: `
        How many checks are **always enough** for a sorted list? Write down the pile sizes: start with the whole list and keep halving until 1 is left. An odd pile does not split evenly, so round down. Then count the piles: one check for each.

        :::example
        ${COUNT_DEMO} items: **${COUNT_CHAIN.join(' → ')}**

        ${capital(WORDS[COUNT_CHAIN.length])} piles, so ${COUNT_CHAIN.length} checks are always enough.
        :::

        A list twice as long, ${2 * COUNT_DEMO} items, needs just one more check: the first check brings it back down to ${COUNT_DEMO}.
      `,
      figure: halvingFigure(COUNT_DEMO),
    },
    {
      id: 'count-guesses',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([12, 16, 20, 31, 32, 40, 50, 63, 64, 127, 128, 200, 250, 255, 256, 500, 1000]);
        const chain = halvingChain(n);
        const k = chain.length;
        const scene = rng.pick([
          {
            text: `
              The guessing game with *higher / lower / correct* answers, played with the numbers from **1 to ${group(n)}**.

              With binary search, how many guesses are **always enough**?
            `,
            unit: 'guesses',
          },
          {
            text: `
              A sorted list holds **${group(n)} names**. You look for one of them by binary search: check the middle name, keep the half that can still contain yours, repeat.

              How many names do you have to check **at most**?
            `,
            unit: 'checks',
          },
        ]);
        return {
          ...scene,
          answer: k,
          wrong: [
            [Math.floor(n / 2), 'That is how many are left after the *first* check. Keep halving until only one is left, and count the checks.'],
            [k - 1, `Count the first pile too. The chain starts at ${group(n)} itself, and the final pile of 1 still needs its own check.`],
            [k + 1, 'One too many. Stop when the pile is down to 1: that last pile takes just one check.'],
            [n, 'That would be checking every single one. Each check in the middle throws away half of what is left.'],
          ],
          hints: [
            `Write down the pile sizes: start with ${group(n)} and keep halving, rounding down, until you reach 1.`,
            `The piles are ${chain.map(group).join(' → ')}. Count them: one check per pile.`,
          ],
          explain: `
            **${chain.map(group).join(' → ')}**

            That is **${k} piles**, and each check deals with one pile, so ${k} are always enough.
          `,
        };
      },
    },
    {
      id: 'million',
      type: 'numeric',
      title: 'One name in a million',
      text: `
        A sorted list holds **1,000,000 names**. Reading it from the top could take a million looks.

        About how many looks does binary search need, at most? (For comparison: 1,000 names need ${halvingChain(1000).length}.)
      `,
      answer: 20,
      tolerance: 1,
      unit: 'looks',
      wrong: [
        [500000, 'That is how many names are left after the *first* look. Keep halving.'],
        [1000, 'Halving is much stronger than that: about ten halvings already turn 1,000 into 1.'],
        [10, 'Ten halvings are enough for about a thousand names. A million is a thousand thousands.'],
      ],
      hints: [
        r`About ten halvings shrink 1,000 names to 1, because $2^{10} = 1024$.`,
        'A million is 1,000 × 1,000. Ten halvings take 1,000,000 down to about 1,000. How many more from there down to 1?',
      ],
      explain: r`
        Halve 1,000,000 again and again: after 19 halvings a single name is left. That makes 20 piles and one look for each, so **20 looks** are always enough. (Twenty doublings give $2^{20} = 1{,}048{,}576$, just over a million.)

        Twenty looks instead of up to a million: that is the power of throwing away half each time.
      `,
    },
    {
      id: 'recipe',
      type: 'order',
      stretch: true,
      title: 'Write it down for a machine',
      text: 'Here is binary search as a list of steps for a sorted list. **Put the steps in order.**',
      items: [
        'Look at the middle item of the part that is left.',
        'If it is the one you want, stop: found.',
        'If it is too small, throw it away together with everything before it.',
        'Otherwise, throw it away together with everything after it.',
        'Go back to the first step, with the part that is left.',
      ],
      labels: ['First', 'Last'],
      hints: [
        'You can only decide anything after you have looked at an item.',
        '"Otherwise" covers the one case that is left when the item is neither the one you want nor too small.',
      ],
      explain: `
        Look, compare, discard half, repeat. Five lines are enough to search a list of any length.

        Every line is exact, the order is fixed, and the list shrinks on every round, so the search is sure to end. It is an algorithm in the full sense.
      `,
    },
  ],
  recap: [
    '**Binary search**: look in the middle, throw away the half that cannot contain the answer, repeat.',
    'Count the piles: 100 → 50 → 25 → 12 → 6 → 3 → 1 means 7 checks are always enough.',
    'A thousand items need about 10 checks, a million about 20.',
    'It only works on **sorted** data. Unsorted data means checking one by one (**linear search**).',
  ],
  next: 'Next: if sorted data is so useful, how does a machine sort things in the first place?',
};
