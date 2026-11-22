// Probability II: Random Variables · Lesson 1 · How Many Ways?
import { r, plural } from '../../../kit.js';
import { factorial, arrangements, choose, falling, commas, fracText, fracChain, slips, lineups, codes, eqDec, probFeedback, PROB_HOW, PROB_TOL } from '../helpers.js';

// All 27 three-letter codes from A, B, C (repeats allowed), and the 24 line-ups of three different letters from A, B, C, D.
const CODES = codes(['A', 'B', 'C'], 3);
const LINEUPS = lineups(['A', 'B', 'C', 'D'], 3);
const noRepeat = (word) => new Set(word).size === word.length;
const sameSet = (word, set) => word.length === set.length && set.split('').every((c) => word.includes(c));
const indicesWhere = (list, test) => list.map((w, i) => (test(w) ? i : -1)).filter((i) => i >= 0);

export default {
  id: 'counting-arrangements',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A deck nobody has seen',
      text: `
        Shuffle a deck of 52 cards thoroughly and lay the cards out in a row.

        **Has any well-shuffled deck, anywhere in history, ever come out in exactly this order before?**
      `,
      shuffle: false,
      options: [
        { text: 'Almost certainly: cards have been shuffled billions of times' },
        { text: 'It is about fifty-fifty' },
        { text: 'Almost certainly not', correct: true },
      ],
      explain: r`
        Almost certainly not. A deck can be ordered in about $8 \times 10^{67}$ ways: an 8 followed by 67 zeros.

        Picture a billion people, each shuffling one deck every second since the universe began 13.8 billion
        years ago. Together they would have seen about $4 \times 10^{26}$ orders: far less than one part in a
        trillion trillion trillion of the total.

        Nobody found that number by listing orders. This lesson is about counting without listing.
      `,
    },
    {
      id: 'teach-stages',
      type: 'info',
      title: 'Choices multiply',
      text: r`
        Counting without listing starts with a rule you met in the first probability course, where
        a coin and a three-part spinner made $2 \times 3 = 6$ outcomes: each result of one part can go with each result of the other.

        :::key
        When a result is built in stages, **multiply** the number of choices at each stage.
        :::

        :::example
        **A sandwich:** one of 5 breads, then one of 7 fillings, then toasted or not.
        Every bread can go with every filling, and each of those pairs with either finish.

        - $5 \times 7 \times 2 = 70$ sandwiches.

        **A 4-digit PIN:** each digit is one of the ten digits 0 to 9, and digits may repeat.

        - $10 \times 10 \times 10 \times 10 = 10,000$ PINs.
        :::
      `,
    },
    {
      id: 'multiply',
      type: 'numeric',
      title: 'Your turn',
      gen: (rng) => {
        const intro = r`Two dice have $6 \times 6 = 36$ outcomes, because every face of one die can pair with every face of the other. The same rule counts anything that is built in stages.`;
        const kind = rng.pick(['menu', 'outfit', 'lock', 'coins']);
        if (kind === 'menu') {
          const a = rng.int(2, 4);
          const b = rng.int(3, 6);
          const c = rng.int(2, 4);
          return {
            text: `${intro}\n\nA café offers **${a} starters**, **${b} main courses** and **${c} desserts**. A meal is one of each.\n\n**How many different meals are possible?**`,
            answer: a * b * c,
            wrong: slips(a * b * c, [
              [a + b + c, 'That adds the choices. Every starter can go with every main course, and every such pair with every dessert: multiply.'],
              [a * b, `That counts starter-and-main pairs. Each of them can end with any of the ${c} desserts.`],
            ]),
            hints: [`Pick a starter. How many main courses can go with it? And how many desserts with each of those?`],
            explain: r`$${a} \times ${b} \times ${c} = ${a * b * c}$ meals: each starter goes with each main course, and each of those pairs with each dessert.`,
          };
        }
        if (kind === 'outfit') {
          const a = rng.int(3, 6);
          const b = rng.int(2, 4);
          const c = rng.int(2, 3);
          return {
            text: `${intro}\n\nA suitcase holds **${a} shirts**, **${b} pairs of trousers** and **${c} pairs of shoes**. An outfit is one of each.\n\n**How many different outfits are possible?**`,
            answer: a * b * c,
            wrong: slips(a * b * c, [
              [a + b + c, 'That adds the choices. Every shirt can go with every pair of trousers, and every such pair with every pair of shoes: multiply.'],
              [a * b, `That counts shirt-and-trousers pairs. Each of them can go with any of the ${c} pairs of shoes.`],
            ]),
            hints: [`Pick a shirt. How many pairs of trousers can go with it? And how many pairs of shoes with each of those?`],
            explain: r`$${a} \times ${b} \times ${c} = ${a * b * c}$ outfits: every choice at one stage can be combined with every choice at the next.`,
          };
        }
        if (kind === 'lock') {
          const d = rng.pick([2, 3]);
          const s = rng.pick([4, 5, 6, 10]);
          const digits = s === 10 ? 'the digits 0 to 9' : `the digits 1 to ${s}`;
          return {
            text: `${intro}\n\nA bike lock has **${d} dials**. Each dial shows one of ${digits}, and dials may show the same digit.\n\n**How many different codes can the lock be set to?**`,
            answer: Math.pow(s, d),
            wrong: slips(Math.pow(s, d), [
              [s * d, `That adds up ${s} settings for each dial. Every setting of one dial can go with every setting of the next: multiply.`],
            ]),
            hints: [`How many settings does one dial have? Each of them can go with every setting of the next dial.`],
            explain: r`$${Array(d).fill(s).join(r` \times `)} = ${commas(Math.pow(s, d))}$ codes: ${s} choices for each of the ${d} dials.`,
          };
        }
        const c = rng.int(1, 3);
        const answer = 6 * Math.pow(2, c);
        return {
          text: `${intro}\n\nYou roll one die and flip **${plural(c, 'coin')}**. An outcome records the die's number and what ${c === 1 ? 'the coin shows' : 'each coin shows, in order'}.\n\n**How many different outcomes are there?**`,
          answer,
          wrong: slips(answer, [
            [6 + 2 * c, 'That adds the possibilities. Every face of the die can go with every result of the coins: multiply.'],
            [6 * 2, c > 1 ? `That is one die and one coin. There are ${c} coins, and each one doubles the count.` : ''],
          ].filter(([, msg]) => msg)),
          hints: [`The die has 6 faces. Each coin has 2 sides, and each coin multiplies the count by 2.`],
          explain: r`$6 \times ${Array(c).fill(2).join(r` \times `)} = ${answer}$ outcomes.`,
        };
      },
    },
    {
      id: 'no-repeats',
      type: 'interact',
      title: 'When nothing may repeat',
      text: r`
        Here are all $3 \times 3 \times 3 = 27$ three-letter codes made from A, B and C.

        Now suppose each letter is a tile, and you own only one of each.
        **Tap every code that uses each letter exactly once.**
      `,
      widget: {
        type: 'grid', rows: 3, cols: 9, labels: CODES, cell: 46, colors: ['orange'], counter: 'Selected',
        alt: 'A board of the 27 three-letter codes made from A, B and C, from AAA to CCC.',
      },
      check: (s) => {
        const bad = s.on.find((i) => !noRepeat(CODES[i]));
        if (bad != null) {
          const word = CODES[bad];
          const twice = word.split('').find((c) => word.indexOf(c) !== word.lastIndexOf(c));
          return `${word} uses the letter ${twice} more than once.`;
        }
        if (s.count === 0) return 'Tap a code to select it.';
        if (s.count < 6) return `${s.count} so far, all correct. There are more.`;
        return true;
      },
      solution: { on: indicesWhere(CODES, noRepeat) },
      hints: ['Start with the codes that begin with A. Once A is used, which letters are left for the second place?'],
      explain: r`
        Six codes: ABC, ACB, BAC, BCA, CAB, CBA.

        There are 3 choices for the first letter. Whichever you take, only 2 are left for the second, and
        then 1 for the third: $3 \times 2 \times 1 = 6$. The choices still multiply, but they shrink at every stage.
      `,
    },
    {
      id: 'factorial',
      type: 'info',
      title: 'Factorials',
      text: r`
        Putting $n$ different things in order always works like that: $n$ choices for the first place,
        $n - 1$ for the second, and so on down to 1.

        :::key
        The number of orders of $n$ different things is "$n$ **factorial**":
        $$ n! = n \times (n-1) \times \cdots \times 2 \times 1 $$
        :::

        :::example
        **Eight runners**, no ties: 8 choices for first place, then 7 for second, and so on.

        - $8! = 8 \times 7 \times 6 \times \cdots \times 1 = 40,320$ finishing orders
        :::

        Factorials grow faster than almost anything you will meet. The last one here is the deck of cards.

        | $n$ | 3 | 8 | 10 | 20 | 52 |
        |---|---|---|---|---|---|
        | $n!$ | 6 | 40,320 | 3,628,800 | about $2.4 \times 10^{18}$ | about $8 \times 10^{67}$ |
      `,
    },
    {
      id: 'orders',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.int(4, 7);
        const story = rng.pick([
          { text: `**${n} runners** finish a race, with no ties.\n\n**In how many different orders can they finish?**`, first: 'first place', thing: 'runners' },
          { text: `You have **${n} different books** and one shelf.\n\n**In how many different orders can you line them up?**`, first: 'the left-hand end', thing: 'books' },
          { text: `A playlist holds **${n} different songs**, and each is played once.\n\n**In how many different orders can the songs be played?**`, first: 'the first slot', thing: 'songs' },
          { text: `**${n} people** queue at a counter.\n\n**In how many different orders can they stand in line?**`, first: 'the front of the queue', thing: 'people' },
        ]);
        const answer = factorial(n);
        return {
          text: story.text,
          answer,
          wrong: slips(answer, [
            [n * n, `That gives ${n} choices to each of two places. There are ${n} places to fill, and the choices shrink: ${n}, then ${n - 1}, then ${n - 2}…`],
            [n * (n - 1), `That fills only the first two places. Keep going until all ${n} are placed.`],
            [(n * (n + 1)) / 2, `That adds $${n} + ${n - 1} + \\cdots + 1$. The choices at each stage multiply.`],
            [Math.pow(n, n), `That would let the same one of the ${story.thing} fill several places. Once used, it is gone.`],
          ]),
          hints: [
            `How many choices are there for ${story.first}? Once that is settled, how many are left for the next place?`,
            r`Multiply the shrinking choices: $${falling(n, n)}$.`,
          ],
          explain: r`$${n}! = ${falling(n, n)} = ${commas(answer)}$ orders.`,
        };
      },
    },
    {
      id: 'podium',
      type: 'fill',
      title: 'Only the first few places',
      text: `
        Eight runners race for three medals: gold, silver and bronze. Who finishes fourth or eighth does not matter.

        **Count the possible podiums.**
      `,
      template: 'There are [[8]] choices for gold. Then [[7]] runners are left for silver, and then [[6]] for bronze. That makes [[336]] different podiums.',
      hints: ['After gold is awarded, seven runners are still in the running for silver.', 'Multiply the three numbers of choices.'],
      explain: r`
        $8 \times 7 \times 6 = 336$. The choices shrink exactly as before. The product simply stops once the three medals are gone.
      `,
    },
    {
      id: 'teach-arrange',
      type: 'info',
      title: 'k places, n candidates',
      text: r`
        The podium count is the start of $8!$, cut off after three factors, because only three places are filled.

        :::key
        The number of ways to arrange $k$ things chosen from $n$ is $n \times (n-1) \times \cdots$ with $k$ factors.
        :::

        :::example
        A club with **12 members** elects a chair and a deputy. Nobody holds both posts.

        1. Two posts, so two factors, starting from 12.
        2. $12 \times 11 = 132$ ways.

        Add a third post, a treasurer, and there is a third factor: $12 \times 11 \times 10 = 1,320$ ways.
        :::

        Order matters here: swap the chair and the deputy and the result is a different one.
      `,
    },
    {
      id: 'arrange',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.int(5, 10);
        const k = rng.pick([2, 3]);
        const roles = k === 2 ? 'a president and a secretary' : 'a president, a secretary and a treasurer';
        const medals = k === 2 ? 'a gold and a silver medal' : 'gold, silver and bronze medals';
        const story = rng.pick([
          { text: `A club with **${n} members** elects ${roles}. Nobody can hold two posts.\n\n**In how many different ways can the posts be filled?**`, group: 'the same people with the posts swapped round', repeat: 'one member hold several posts' },
          { text: `**${n} runners** race for ${medals}, with no ties.\n\n**In how many different ways can the medals be awarded?**`, group: 'the same runners with the medals swapped round', repeat: 'one runner win several medals' },
          { text: `You have **${n} different letter tiles** and lay ${k} of them in a row to make a code.\n\n**How many different codes can you make?**`, group: 'the same tiles in a different order', repeat: 'one tile be used several times' },
        ]);
        const answer = arrangements(n, k);
        return {
          text: story.text,
          answer,
          wrong: slips(answer, [
            [Math.pow(n, k), `That would let ${story.repeat}. The choices shrink: ${n}, then ${n - 1}${k === 3 ? `, then ${n - 2}` : ''}.`],
            [choose(n, k), `That counts groups of ${k} and ignores order. Here ${story.group} count as a different result.`],
            [factorial(n), `That puts all ${n} in order. Only ${k} places are being filled.`],
            [n * k, `Multiply the number of choices at each stage: $${falling(n, k)}$.`],
          ]),
          hints: [
            `How many choices are there for the first place? How many are left for the next?`,
            r`Multiply $${k}$ shrinking factors, starting from ${n}.`,
          ],
          explain: r`$${falling(n, k)} = ${commas(answer)}$: ${n} choices for the first place, then ${n - 1}${k === 3 ? `, then ${n - 2}` : ''}.`,
        };
      },
    },
    {
      id: 'overcount',
      type: 'interact',
      title: 'When order stops mattering',
      text: r`
        A club with four members, A, B, C and D, elects a president, a secretary and a treasurer.
        That can be done in $4 \times 3 \times 2 = 24$ ways, all shown here: ABC means A is president, B secretary, C treasurer.

        Now the club only wants a **committee** of three, with no posts.
        **Tap every line-up that puts A, B and C on the committee.**
      `,
      widget: {
        type: 'grid', rows: 4, cols: 6, labels: LINEUPS, cell: 52, colors: ['orange'], counter: 'Selected',
        alt: 'A board of the 24 ordered line-ups of three letters chosen from A, B, C and D.',
      },
      check: (s) => {
        const bad = s.on.find((i) => !sameSet(LINEUPS[i], 'ABC'));
        if (bad != null) return `${LINEUPS[bad]} includes D. This committee is A, B and C.`;
        if (s.count === 0) return 'Tap a line-up to select it.';
        if (s.count < 6) return `${s.count} so far, all correct. The same three people appear in other orders too.`;
        return true;
      },
      solution: { on: indicesWhere(LINEUPS, (w) => sameSet(w, 'ABC')) },
      hints: ['Look in every row: a line-up counts whenever its three letters are A, B and C, in any order.'],
      explain: r`
        Six line-ups, one committee: three people can be put in order in $3! = 6$ ways.

        The same is true of every committee. So the 24 line-ups count each committee 6 times, and the
        number of committees is $24 \div 6 = 4$. (Check: a committee of three is fixed by the one member left out.)
      `,
    },
    {
      id: 'choose-idea',
      type: 'info',
      title: 'n choose k',
      text: r`
        Whenever order does not matter, count the ordered line-ups first and then divide out the repeats.
        Every group of $k$ things shows up $k!$ times, once for each of its orders.

        :::key
        The number of ways to choose $k$ things from $n$, in any order, is "$n$ **choose** $k$":
        $$ \binom{n}{k} = \frac{n \times (n-1) \times \cdots \ \text{($k$ factors)}}{k!} $$
        :::

        :::example
        Three medals, **ten** runners: $\mathord{10 \times 9 \times 8 = 720}$ ordered podiums. Each trio appears in $\mathord{3! = 6}$ of them.
        $$ \binom{10}{3} = \frac{10 \times 9 \times 8}{3 \times 2 \times 1} = 120 \text{ trios.} $$
        :::

        Ordered arrangements are also called **permutations**, and unordered choices **combinations**.
      `,
    },
    {
      id: 'choose',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.int(5, 9);
        const k = rng.pick([2, 3, 4].filter((v) => v <= n - 2));
        const story = rng.pick([
          { text: `A team of **${k}** is to be picked from **${n} volunteers**. Everyone on the team has the same job.\n\n**How many different teams are possible?**`, group: 'team' },
          { text: `A pizzeria offers **${n} toppings**. You choose **${k} different ones** for your pizza.\n\n**How many different pizzas are possible?**`, group: 'pizza' },
          { text: `You own **${n} books** and pack **${k}** of them for a trip.\n\n**How many different selections can you pack?**`, group: 'selection' },
        ]);
        const answer = choose(n, k);
        const ordered = arrangements(n, k);
        return {
          text: story.text,
          answer,
          wrong: slips(answer, [
            [ordered, `That counts ordered line-ups, so every ${story.group} is counted ${factorial(k)} times. Divide by $${k}! = ${factorial(k)}$.`],
            [ordered / k, k > 2 ? `Divide by $${k}! = ${factorial(k)}$, the number of orders of ${k} things, not by ${k}.` : ''],
            [Math.pow(n, k), `That allows repeats and counts every order separately. Start from $${falling(n, k)}$, then divide out the repeats.`],
          ].filter(([, msg]) => msg)),
          hints: [
            r`First count ordered line-ups: $${falling(n, k)} = ${ordered}$.`,
            `Each ${story.group} appears once for every order of its ${k} members. How many orders is that?`,
          ],
          explain: r`$\binom{${n}}{${k}} = \dfrac{${falling(n, k)}}{${falling(k, k)}} = \dfrac{${ordered}}{${factorial(k)}} = ${answer}$. Each ${story.group} was counted $${k}! = ${factorial(k)}$ times among the ordered line-ups.`,
        };
      },
    },
    {
      id: 'pascal',
      type: 'interact',
      title: "Pascal's triangle",
      text: r`
        The numbers $\binom{n}{k}$ fit into a triangle: row $n$, place $k$, both counted from 0.
        Tap any number to see where it comes from.

        **Tap the number of ways to choose 3 things from 6.**
      `,
      widget: { type: 'pascal-triangle', rows: 7, alt: "Pascal's triangle, rows 0 to 6." },
      check: (s) => {
        if (s.n == null) return 'Tap a number in the triangle.';
        if (s.n === 6 && s.k === 3) return true;
        if (s.n === 6) return `That is row 6, place ${s.k}: the ways to choose ${s.k} from 6. Count the places from 0 at the left-hand end.`;
        if (s.k === 3) return `That is place 3 of row ${s.n}: the ways to choose 3 from ${s.n}. You want row 6.`;
        return `That is row ${s.n}, place ${s.k}: the ways to choose ${s.k} from ${s.n}. Find row 6, then count places from 0.`;
      },
      solution: { selected: [6, 3] },
      hints: ['Choosing from 6 things means row 6, the bottom row. The first number in a row is place 0.'],
      explain: r`
        $\binom{6}{3} = 20$, and the triangle shows it as $10 + 10$: **every number is the sum of the two above it.**

        Here is why. Put one of the 6 things aside. A choice of 3 either includes it, leaving 2 more to
        choose from the other 5 (10 ways), or leaves it out, so all 3 come from the other 5 (10 ways).

        :::fun
        The triangle carries the name of Blaise Pascal, who wrote a treatise on it in the 1650s. It had been
        known for centuries before that to mathematicians in India, Persia and China.
        :::
      `,
    },
    {
      id: 'order-or-not',
      type: 'bucket',
      review: true,
      text: 'Before counting, ask one question: **would the same things in a different order count as a different result?** Sort these.',
      buckets: ['Order matters', 'Order does not matter'],
      items: [
        { text: 'The first three finishers of a race, as gold, silver and bronze', bucket: 0, why: 'Swap gold and silver and you have a different result.' },
        { text: 'Three friends chosen to share a taxi', bucket: 1, why: 'The same three friends are in the taxi, however you list them.' },
        { text: 'A four-digit PIN', bucket: 0, why: '1234 and 4321 are different PINs.' },
        { text: 'Five cards dealt to you as a hand', bucket: 1, why: 'A hand is the same hand in whatever order the cards arrived.' },
        { text: 'The running order of songs at a concert', bucket: 0, why: 'The same songs in a different order make a different concert.' },
        { text: 'Six numbers ticked on a lottery ticket', bucket: 1, why: 'Only which numbers are ticked matters, not the order of ticking.' },
      ],
      explain: r`
        If order matters, multiply the shrinking choices: $n \times (n-1) \times \cdots$ with $k$ factors.
        If it does not, divide that by $k!$ to get $\binom{n}{k}$.
      `,
    },
    {
      id: 'example-groups',
      type: 'info',
      title: 'Counting becomes probability',
      text: r`
        In the first course, a probability was a fraction: the outcomes you want, out of all the
        equally likely outcomes. With $\binom{n}{k}$ you can count both, even when there are far too many to list.

        :::example
        A class has **10 pupils**, and 3 of them are left-handed. Two pupils are picked at random.
        What is the chance that both are left-handed?

        1. All pairs: $\binom{10}{2} = \dfrac{10 \times 9}{2 \times 1} = 45$, each equally likely.
        2. Pairs of left-handers: $\binom{3}{2} = \dfrac{3 \times 2}{2 \times 1} = 3$.
        3. Probability: $\dfrac{3}{45} = \dfrac{1}{15}$, about 0.067.
        :::
      `,
    },
    {
      id: 'all-red',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const red = rng.int(4, 6);
        const blue = rng.int(2, 5);
        const k = rng.pick([2, 3]);
        const total = red + blue;
        const good = choose(red, k);
        const all = choose(total, k);
        const answer = good / all;
        const replaced = Math.pow(red / total, k);
        return {
          text: `
            A bag holds **${red} red** and **${blue} blue** marbles. You draw **${k} marbles** at random,
            without putting any back. Every group of ${k} marbles is equally likely.

            **What is the probability that all ${k} are red?** ${PROB_HOW}
          `,
          answer: `${good}/${all}`,
          display: fracText(good, all),
          tolerance: PROB_TOL,
          wrong: slips(answer, [
            [replaced, `That would be right if each marble went back into the bag before the next draw. Here none goes back: count groups of ${k} instead.`],
            [red / total, `That is the chance that one marble is red. All ${k} have to be.`],
          ], PROB_TOL),
          feedback: probFeedback(answer),
          hints: [
            `Probability = groups you want ÷ all groups. How many groups of ${k} can be made from all ${total} marbles?`,
            r`All groups: $\binom{${total}}{${k}} = ${all}$. All-red groups: $\binom{${red}}{${k}} = ${good}$.`,
          ],
          explain: r`
            Groups of ${k} from all ${total} marbles: $\binom{${total}}{${k}} = ${all}$. Groups of ${k} from the ${red} red ones:
            $\binom{${red}}{${k}} = ${good}$. So the probability is $${fracChain(good, all)} ${eqDec(answer)}$.

            Counting equally likely outcomes was the first idea of probability. Factorials and
            $\binom{n}{k}$ let you do it when there are far too many outcomes to list.
          `,
        };
      },
    },
  ],
  recap: [
    'Choices made in stages **multiply**. If nothing may repeat, the choices shrink: $n \\times (n-1) \\times \\cdots$',
    '$n! = n \\times (n-1) \\times \\cdots \\times 1$ counts the orders of $n$ things, and grows explosively.',
    'When order does not matter, divide out the $k!$ orders of each group: that is $\\binom{n}{k}$, "$n$ choose $k$".',
    "Pascal's triangle holds every $\\binom{n}{k}$: each number is the sum of the two above it.",
  ],
  next: 'Next: flip a coin ten times. Counting the routes to "exactly five heads" leads to the most useful distribution in probability.',
};
