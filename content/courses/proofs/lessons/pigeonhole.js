// Proofs: How to Be Certain · Lesson 4 · More Pigeons Than Holes
import { r, plural } from '../../../kit.js';

const POOL = [3, 7, 12, 14, 18, 21, 25, 26, 31, 34, 40, 43, 47, 52, 58, 60];
const FIELD_POINTS = ['A', 'B', 'C', 'D', 'E'];
const inField = (p) => ({ x: Math.min(1, Math.max(0, p.x)), y: Math.min(1, Math.max(0, p.y)) });

/** The smallest distance between any two of the five points. */
function closestPair(points) {
  let best = Infinity;
  for (let i = 0; i < FIELD_POINTS.length; i++) for (let j = i + 1; j < FIELD_POINTS.length; j++) {
    const a = points[FIELD_POINTS[i]];
    const b = points[FIELD_POINTS[j]];
    best = Math.min(best, Math.hypot(a.x - b.x, a.y - b.y));
  }
  return best;
}

/** The unit square cut into four, with five points; two of them share a small square. */
const QUARTERED = {
  type: 'svg', viewBox: '0 0 260 260', maxWidth: 280,
  alt: 'A square cut into four equal smaller squares by dashed lines. Five dots are scattered in it; two of them lie in the same small square, whose diagonal is drawn.',
  content:
    '<rect class="fill-blue-soft stroke-ink" stroke-width="3" x="20" y="20" width="220" height="220" rx="3"/>' +
    '<path class="fill-none stroke-ink" stroke-width="2" stroke-dasharray="7 6" d="M130 20V240M20 130H240"/>' +
    '<rect class="fill-orange-soft stroke-orange" stroke-width="3" x="130" y="20" width="110" height="110"/>' +
    '<line class="stroke-orange" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7" x1="130" y1="130" x2="240" y2="20"/>' +
    [[62, 70], [80, 190], [190, 196], [160, 98], [214, 46]].map(([x, y], i) => `<circle class="${i > 2 ? 'fill-orange' : 'fill-blue'} stroke-ink" stroke-width="2.5" cx="${x}" cy="${y}" r="8"/>`).join('') +
    '<text class="fig-label-sm" x="75" y="254" text-anchor="middle">½</text>' +
    '<text class="fig-label-sm" x="185" y="254" text-anchor="middle">½</text>' +
    '<text class="fig-label-sm" x="9" y="79" text-anchor="middle">½</text>' +
    '<text class="fig-label-sm" x="9" y="189" text-anchor="middle">½</text>',
};

const SOCK_STORIES = [
  (c) => `A drawer holds a jumble of socks in **${c} colours**, plenty of each. The room is dark.\n\n**How many socks must you pull out to be certain of two of the same colour?**`,
  (c) => `A bag holds marbles in **${c} colours**, plenty of each. You draw them without looking.\n\n**How many marbles must you draw to be certain of two of the same colour?**`,
  (c) => `A box holds a heap of cards, each printed with one of **${c} different symbols**, plenty of each. You take cards without looking.\n\n**How many cards must you take to be certain of two with the same symbol?**`,
];

export default {
  id: 'pigeonhole',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      graded: false,
      title: 'Six pigeons, five holes',
      text: r`
        Six pigeons want to roost, and there are five holes.

        **Put every pigeon into a hole, and try to give each pigeon a hole to itself.**
      `,
      widget: { type: 'pigeon-boxes', mode: 'place', boxes: 5, pigeons: 6, alt: 'Six pigeons waiting above a row of five pigeonholes.' },
      check: (s) => s.allPlaced || `${s.waiting === 1 ? 'One pigeon is' : `${s.waiting} pigeons are`} still waiting. Tap a hole to put the next one in.`,
      solution: { counts: [2, 1, 1, 1, 1] },
      explain: r`
        It cannot be done. Five pigeons can have a hole each, and then the sixth has to share.

        You did not need to try every arrangement to know that. This lesson is about how much
        that small certainty can prove.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'The pigeonhole principle',
      text: r`
        :::key
        If more than $n$ things are put into $n$ boxes, then some box holds **at least two** of them.
        :::

        This is the **pigeonhole principle**. (Why is it true? Suppose no box held more than one.
        Then there would be at most $n$ things: a contradiction.) It does not say *which* box is
        crowded. Its power comes from choosing well **what the pigeons are and what the holes are**.

        :::example Socks in the dark
        A drawer holds black socks and white socks. The socks you pull out are the pigeons; the
        2 colours are the holes. Two socks might be one of each colour. A **third** has to
        join one of them, so 3 socks make a pair certain. Try it with the birds.
        :::

        The principle is often named after the mathematician Dirichlet, who used it in the 19th century.
      `,
      figure: { type: 'pigeon-boxes', mode: 'place', boxes: ['black', 'white'], pigeons: 3, boxTitle: 'colour of the sock', alt: 'Three pigeons waiting above two pigeonholes, labelled black and white. However they are placed, one hole ends up with at least two.' },
    },
    {
      id: 'socks',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = rng.int(3, 9);
        return {
          text: rng.pick(SOCK_STORIES)(c),
          answer: c + 1,
          wrong: [
            [c, `With ${c} you could be unlucky and hold one of each kind.`],
            [2, 'Two could easily be different. "Certain" means even in the unluckiest case.'],
            [2 * c, 'That is certainly enough, but it is more than you need. What is the smallest number that already forces a match?'],
          ],
          hints: [
            'Imagine the unluckiest possible run. How long can you go without a match?',
            `After ${c} you might hold one of each kind. What does the next one have to do?`,
          ],
          explain: `The unluckiest start is one of each kind: ${c} of them and still no match. The next one has to match something you already hold. So ${c + 1} are enough, and ${c} are not.`,
        };
      },
    },
    {
      id: 'hairs',
      type: 'fill',
      title: 'The same number of hairs',
      text: r`
        A human head has roughly 100,000 hairs, and nobody has anywhere near a million.
        Take a city of 2 million people.

        **Are there two people in it with exactly the same number of hairs on their heads?**
      `,
      template: `
        The pigeons are the [[hairs|*people|cities]]: there are 2,000,000 of them.

        The holes are the [[people in the city|*possible numbers of hairs|hairs on one head]]: 0, 1, 2, … up to 999,999, which makes [[999,999|*1,000,000|1,000,001]] holes.

        More pigeons than holes, so two people [[probably|*certainly]] have exactly the same number of hairs.
      `,
      hints: ['Each person is put into the hole labelled with their number of hairs.', 'Counting from 0 to 999,999 gives one more than 999,999 numbers.'],
      explain: r`
        Two million people and only a million possible hair counts: two people must share a count.

        Nobody counted a single hair, and the proof does not say who the two people are. It
        says, with complete certainty, that they exist.
      `,
    },
    {
      id: 'remainders-try',
      type: 'interact',
      graded: false,
      title: 'Sorting by remainder',
      text: r`
        Divide a whole number by 5 and the remainder is 0, 1, 2, 3 or 4. Every number you pick
        drops into the box for its remainder.

        **Pick six numbers, and try to keep every box down to one number.**
      `,
      widget: {
        type: 'pigeon-boxes', mode: 'choose', boxes: ['0', '1', '2', '3', '4'], boxTitle: 'remainder when divided by 5',
        pool: POOL, boxOf: (v) => v % 5, limit: 6,
        alt: 'Sixteen numbers to choose from, and five boxes labelled with the remainders 0 to 4.',
      },
      check: (s) => s.allPlaced || `Pick ${plural(s.waiting, 'more number')}.`,
      solution: { chosen: [25, 21, 7, 3, 14, 40] },
      explain: r`
        Six numbers but only five possible remainders: two of your numbers had to share a box,
        whichever six you picked.
      `,
    },
    {
      id: 'teach-remainders',
      type: 'info',
      title: 'Same remainder, same box',
      text: r`
        Two numbers with the same remainder differ by a multiple of 5: 21 and 31 both leave
        remainder 1, and they differ by 10, which is $2 \times 5$. So **among any 6 whole
        numbers, two differ by a multiple of 5.** Nothing is special about 5.

        :::key
        Among any $n + 1$ whole numbers, two differ by a multiple of $n$.
        :::

        :::example Four numbers, dividing by 3
        Take 10, 14, 20 and 27. Their remainders are 1, 2, 2 and 0. So 14 and 20 share a box,
        and $20 - 14 = 6 = 2 \times 3$. Pick all four and watch.
        :::
      `,
      figure: {
        type: 'pigeon-boxes', mode: 'choose', boxes: ['0', '1', '2'], boxTitle: 'remainder when divided by 3',
        pool: [10, 14, 20, 27], boxOf: (v) => v % 3, limit: 4,
        alt: 'Four numbers to choose from, 10, 14, 20 and 27, and three boxes labelled with the remainders 0, 1 and 2. The numbers 14 and 20 land in the same box.',
      },
    },
    {
      id: 'difference',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const n = rng.int(4, 7);
        const twice = rng.int(0, n - 1);
        const numbers = [];
        const multipliers = rng.sample([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 2);
        for (let res = 0; res < n; res++) {
          if (res === twice) numbers.push(res + n * multipliers[0], res + n * multipliers[1]);
          else numbers.push(res + n * rng.int(2, 12));
        }
        const pair = numbers.filter((v) => v % n === twice).sort((a, b) => a - b);
        const others = [];
        const shuffled = rng.shuffle(numbers);
        for (let i = 0; i < shuffled.length && others.length < 3; i++) {
          const a = Math.min(shuffled[i], shuffled[(i + 1) % shuffled.length]);
          const b = Math.max(shuffled[i], shuffled[(i + 1) % shuffled.length]);
          if ((b - a) % n !== 0 && !others.some((o) => o[0] === a && o[1] === b)) others.push([a, b]);
        }
        const list = rng.shuffle(numbers);
        return {
          text: r`
            Here are ${n + 1} whole numbers:

            $$ ${list.join(',\\; ')} $$

            The pigeonhole principle promises that two of them differ by a multiple of ${n}. **Which two?**
          `,
          options: [
            { text: `${pair[0]} and ${pair[1]}`, correct: true },
            ...others.map(([a, b]) => ({ text: `${a} and ${b}`, why: r`$${b} - ${a} = ${b - a}$, which is not a multiple of ${n}. Their remainders are ${a % n} and ${b % n}.` })),
          ],
          hints: [`Work out the remainder of each number on division by ${n}. Two of the remainders must agree.`],
          explain: r`Divide each number by ${n}. Only ${pair[0]} and ${pair[1]} leave the same remainder (${twice}), and $${pair[1]} - ${pair[0]} = ${pair[1] - pair[0]} = ${(pair[1] - pair[0]) / n} \times ${n}$.`,
        };
      },
    },
    {
      id: 'points-square',
      type: 'interact',
      graded: false,
      title: 'Five points in a square',
      text: r`
        A square field, 1 km along each side. Five people want to stand in it (the edges and
        corners count), each as far from the others as possible.

        **Move the points so that the closest two are as far apart as you can manage.**
        Can you get the closest pair to 0.70 km or more?
      `,
      widget: {
        type: 'geo', x: [-0.07, 1.07], y: [-0.07, 1.07], grid: false, axes: false,
        points: {
          P: { x: 0, y: 0, hidden: true }, Q: { x: 1, y: 0, hidden: true }, R: { x: 1, y: 1, hidden: true }, S: { x: 0, y: 1, hidden: true },
          A: { x: 0.3, y: 0.3, drag: true, snap: 0.05, color: 'orange', constrain: inField },
          B: { x: 0.7, y: 0.35, drag: true, snap: 0.05, color: 'orange', constrain: inField },
          C: { x: 0.55, y: 0.75, drag: true, snap: 0.05, color: 'orange', constrain: inField },
          D: { x: 0.25, y: 0.7, drag: true, snap: 0.05, color: 'orange', constrain: inField },
          E: { x: 0.5, y: 0.5, drag: true, snap: 0.05, color: 'orange', constrain: inField },
        },
        shapes: [{ kind: 'polygon', pts: ['P', 'Q', 'R', 'S'], color: 'blue' }],
        readouts: [{ label: 'closest pair', value: (g) => closestPair(g.P), digits: 2, unit: 'km', color: 'orange' }],
        alt: 'A square field with five points in it that can be moved. A readout shows the distance between the two closest points.',
      },
      check: (s) => {
        const d = closestPair(s);
        if (d >= 0.7) return true;
        return `The closest two are ${d.toFixed(2)} km apart. Spread everybody out more: which spots in a square are furthest from each other?`;
      },
      solution: { A: { x: 0, y: 0 }, B: { x: 1, y: 0 }, C: { x: 1, y: 1 }, D: { x: 0, y: 1 }, E: { x: 0.5, y: 0.5 } },
      hints: ['Send four people to the corners. Where is the fifth furthest from all of them?'],
      explain: r`
        Four corners and the centre: the closest pairs are $\frac{\sqrt{2}}{2} \approx 0.707$ km
        apart, and however you try, you cannot beat it.

        But "I could not do better" is evidence, not proof. Pigeons can settle it.
      `,
    },
    {
      id: 'points-holes',
      type: 'choice',
      title: 'Invent the holes',
      text: r`
        Cut the field into four smaller squares, each $\frac12$ km along a side. Five points, four
        small squares: **two points must lie in the same small square.** (A point on a dividing
        line can be counted with either side.)

        **How far apart can two points in the same small square be, at most?**
      `,
      figure: QUARTERED,
      columns: 1,
      options: [
        { text: r`$\frac{\sqrt{2}}{2} \approx 0.71$ km: the diagonal of a small square`, correct: true },
        { text: r`$\frac{1}{2}$ km: the side of a small square`, why: 'Two opposite corners of a small square are further apart than its side is long.' },
        { text: r`$1$ km: the side of the field`, why: 'A small square is only half as wide as the field.' },
        { text: r`$\sqrt{2} \approx 1.41$ km: the diagonal of the field`, why: 'That is the longest distance in the whole field, not inside one small square.' },
      ],
      hints: ['The two points of a square that are furthest apart sit in opposite corners.'],
      explain: r`
        The longest distance inside a square of side $\frac12$ is its diagonal:
        $\sqrt{\frac14 + \frac14} = \frac{\sqrt{2}}{2} \approx 0.71$.

        So **among any five points in the square, two are at most 0.71 apart**, proved for every
        arrangement at once. Nobody handed you the holes this time: they had to be invented.
        That is the art.
      `,
    },
    {
      id: 'pick-holes',
      type: 'match',
      review: true,
      text: 'Each claim can be proved with the pigeonhole principle. **Match it to the holes that make the proof work.**',
      pairs: [
        ['Among 13 people, two were born in the same month', 'The 12 months'],
        ['Among 8 whole numbers, two differ by a multiple of 7', 'The 7 possible remainders'],
        ['Among 5 points in a square of side 1, two are within 0.71', '4 smaller squares'],
        ['In a city of 2 million, two people have equally many hairs', 'The possible numbers of hairs'],
      ],
      explain: 'In every case there are more pigeons (people, numbers, points) than holes, so two pigeons share a hole, and sharing a hole is exactly the coincidence the claim promises.',
    },
    {
      id: 'teach-crowded',
      type: 'info',
      title: 'More than a pair',
      text: r`
        The same reasoning can force three into one box, or more. Ask how many things fit
        **without** that happening, then add one.

        :::example Two colours, three alike
        Socks in 2 colours. The unluckiest run with no three alike is 2 of each colour:
        $2 \times 2 = 4$ socks. The 5th sock makes three of one colour. Try to avoid it with
        the five birds.
        :::

        :::key
        Put more than $(k - 1) \times n$ things into $n$ boxes, and some box holds **at least $k$**.
        :::

        It reads backwards too. Take 9 things in 4 boxes: if every box held at most 2, there
        would be at most 8 things. So some box holds at least 3.
      `,
      figure: { type: 'pigeon-boxes', mode: 'place', boxes: ['red', 'blue'], pigeons: 5, boxTitle: 'colour of the sock', alt: 'Five pigeons waiting above two pigeonholes, labelled red and blue. However they are placed, one hole ends up with at least three.' },
    },
    {
      id: 'three-alike',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const c = rng.int(3, 7);
        const k = rng.pick([3, 4]);
        const word = k === 3 ? 'three' : 'four';
        const safe = (k - 1) * c;
        return {
          title: 'More than a pair',
          text: `
            A drawer holds socks in **${c} colours**, plenty of each. The room is dark.

            **How many socks must you pull out to be certain of ${word} of the same colour?**
          `,
          answer: safe + 1,
          wrong: [
            [c + 1, `That guarantees a pair. For ${word} of one colour, the unluckiest run is longer.`],
            [safe, `With ${safe} socks you could hold exactly ${k - 1} of every colour, and no colour would have ${word} yet.`],
            [k * c, 'That is certainly enough, but it is more than you need.'],
          ],
          hints: [
            `What is the largest number of socks you can hold with no colour appearing ${word} times?`,
            `${k - 1} of each colour makes ${safe} socks. Then take one more.`,
          ],
          explain: r`
            The unluckiest run is ${k - 1} socks of every colour: $${k - 1} \times ${c} = ${safe}$ socks and still no ${word} alike. One more forces it: **${safe + 1}**.
          `,
        };
      },
    },
    {
      id: 'friends',
      type: 'fill',
      title: 'Friends at a party',
      text: r`
        Five people are at a party. Some pairs of them are friends (friendship always goes both
        ways). Claim: **two of the five have the same number of friends at the party.**

        Each person has 0, 1, 2, 3 or 4 friends there. That is five possible numbers for five
        people: not yet enough for the pigeonhole principle.
      `,
      template: `
        If somebody has 4 friends at the party, they are friends with everybody there, so nobody can have [[0]] friends.

        So the numbers 0 and 4 cannot **both** occur at the same party. At most [[4]] different numbers are really in use.

        Five people and at most four numbers: at least [[2]] people have the same number of friends.
      `,
      hints: ['Could one guest be friends with everyone while another guest is friends with no one?'],
      explain: r`
        The holes are the friend-counts that can occur *together*: either 0, 1, 2, 3 or 1, 2, 3, 4.
        Four holes for five people, so two people share.

        The same argument works for a party of any size from two people up: with $n$ guests, at
        most $n - 1$ different numbers can be in use.
      `,
    },
    {
      id: 'guaranteed',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const students = rng.pick([13, 14, 17, 20, 23, 25, 26, 29, 30, 34, 37, 40, 45, 50, 55]);
        const m = Math.ceil(students / 12);
        return {
          text: `
            A class has **${students} students**. Sort them by the month of their birthday: 12 holes, ${students} pigeons.

            **Which of these is certain?**
          `,
          columns: 1,
          options: [
            { text: `Some month holds at least ${m} of the birthdays`, correct: true },
            { text: `Some month holds at least ${m + 1} of the birthdays`, why: `Not certain: the birthdays could be spread out so that no month has more than ${m}.` },
            { text: 'Every month holds at least one of the birthdays', why: 'Not certain: the whole class might be born in just a few months. The principle never promises that every hole is used.' },
            { text: `No month holds more than ${m} of the birthdays`, why: `Not certain: all ${students} students might even be born in the same month.` },
          ],
          hints: [`Could every month hold at most ${m - 1} of the birthdays? Count how many students that would allow.`],
          explain: `If every month held at most ${m - 1}, there would be at most ${12 * (m - 1)} students, and there are ${students}. So some month holds at least ${m}. Nothing more is certain: the birthdays might be spread evenly, or all fall in one month.`,
        };
      },
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        The pigeonhole principle proves that two people in a big city have exactly the same number
        of hairs, without saying who they are.

        **Is that a real proof? Why?**
      `,
      model: r`
        Yes. A proof has to make the claim certain, and this one does: with two million people
        and at most a million possible hair counts, it is impossible for everybody to be different.

        It does not find the two people, and it does not need to, because the claim was only that
        they exist. That is typical of the pigeonhole principle: it guarantees a coincidence
        without locating it. Finding the pair would take months of counting. Knowing that there
        is one takes two lines.
      `,
    },
  ],
  recap: [
    '**Pigeonhole principle:** if more than $n$ things go into $n$ boxes, some box holds at least two.',
    'The skill is choosing the pigeons and the holes: remainders, months, small squares, possible counts.',
    'It proves that a coincidence exists (two people, two numbers, two points) without finding it.',
    'To be certain of $k$ in one box, you need more than $(k - 1) \\times n$ things.',
  ],
  next: 'Next: how to prove that something can never be done, however long and however cleverly anyone tries.',
};
