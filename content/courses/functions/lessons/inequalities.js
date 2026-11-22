// Algebra II: Functions & Growth · Lesson 3 · More Than, Less Than
import { r, num, linear } from '../../../kit.js';
import { SIGNS, SIGN_TEX, FLIPPED, signBlank } from '../helpers.js';

const LINE = { min: -6, max: 6 };

export default {
  id: 'inequalities',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'How many answers?',
      text: r`
        The equation $2x + 1 = 7$ has exactly one solution: $x = 3$.

        Now change the equals sign to $<$, "is less than":

        $$ 2x + 1 < 7 $$

        **How many numbers make this true?**
      `,
      shuffle: false,
      options: [
        { text: 'Exactly one' },
        { text: 'Exactly two' },
        { text: 'Infinitely many', correct: true },
        { text: 'None' },
      ],
      explain: r`
        Try 2: $2 \times 2 + 1 = 5$, and $5 < 7$ is true. So is $0$. So is $-100$. So are $2.9$ and $2.99$.

        The answer to an **inequality** is not one number but a whole stretch of the number line. This lesson is about finding that stretch and drawing it.
      `,
    },
    {
      id: 'four-signs',
      type: 'info',
      title: 'Four signs',
      text: r`
        An inequality compares two sides with one of four signs. A **solution** is a number that makes it true.

        | Sign | Read it as | True | False |
        |:-:|---|:-:|:-:|
        | $<$ | is less than | $\mathord{5 < 7}$ | $\mathord{7 < 7}$ |
        | $\le$ | is less than or equal to | $\mathord{7 \le 7}$ | $\mathord{8 \le 7}$ |
        | $>$ | is greater than | $\mathord{9 > 7}$ | $\mathord{7 > 7}$ |
        | $\ge$ | is greater than or equal to | $\mathord{7 \ge 7}$ | $\mathord{6 \ge 7}$ |

        On a number line the solutions are a shaded ray. Its end is **hollow** when the end number is left out ($<$, $>$) and **filled** when it counts ($\le$, $\ge$).
      `,
      figure: [
        {
          type: 'ineq-line', mode: 'ray', ...LINE, at: -2, dir: 'right', closed: false, symbols: true, static: true,
          alt: 'A number line with a ray shaded to the right of -2. The end at -2 is hollow: x is greater than -2.',
        },
        {
          type: 'ineq-line', mode: 'ray', ...LINE, at: 1, dir: 'left', closed: true, symbols: true, static: true,
          alt: 'A number line with a ray shaded to the left of 1. The end at 1 is filled: x is less than or equal to 1.',
        },
      ],
    },
    {
      id: 'probe',
      type: 'interact',
      title: 'Test some numbers',
      text: r`
        Drag the orange probe along the line. Every number it visits is tried in $\;2x + 1 < 7\;$ and marked with a tick (true) or a cross (false).

        **Keep testing until you can see exactly where true turns into false.**
      `,
      widget: {
        type: 'ineq-line', mode: 'probe', ...LINE, x: 0,
        test: { lhs: '2x + 1', op: '<', rhs: '7' },
        alt: 'A number line from -6 to 6 with a probe that can be dragged. Each number the probe visits is marked true or false for the statement 2x + 1 < 7.',
      },
      check: (s) => {
        if (s.trueAt.includes(2) && s.falseAt.includes(3)) return true;
        if (!s.falseAt.length) return 'Every number you have tried makes it true. Try some larger ones.';
        if (!s.trueAt.length) return 'Every number you have tried makes it false. Try some smaller ones.';
        return `So far it is true up to $${Math.max(...s.trueAt)}$ and false from $${Math.min(...s.falseAt)}$ on. Test the numbers in between.`;
      },
      solution: { visited: [0, 1, 2, 3, 4], x: 4 },
      explain: r`
        True for 2 and everything below it, false for 3 and everything above it.

        Look closely at 3 itself: $2 \times 3 + 1 = 7$, and $7 < 7$ is false. But $2.9$ works, and so does $2.99$. The solutions are **all numbers less than 3**, written $x < 3$.
      `,
    },
    {
      id: 'draw-it',
      type: 'interact',
      title: 'Draw the answer',
      text: r`
        The solutions of $2x + 1 < 7$ are the numbers with $x < 3$. On a number line that is a shaded ray.

        **Drag the end to the right number and shade the correct side.** Then decide: is the end **filled** (the number itself counts) or **hollow** (it does not)?
      `,
      widget: {
        type: 'ineq-line', mode: 'ray', ...LINE, at: 0, dir: 'right', closed: true, symbols: true,
        alt: 'A number line from -6 to 6 with a shaded ray. Its end can be dragged, its direction turned round, and its end made filled or hollow.',
      },
      check: (s) => {
        if (s.at !== 3) return 'The shading should stop at 3: that is where true turned into false.';
        if (s.dir !== 'left') return r`This shades the numbers greater than 3. Test one of them: is $2 \times 5 + 1$ less than 7?`;
        if (s.closed) return r`A filled end says that 3 itself is a solution. But $2 \times 3 + 1 = 7$, and $7 < 7$ is false. Make the end hollow.`;
        return true;
      },
      solution: { at: 3, dir: 'left', closed: false },
      explain: r`
        $x < 3$: a ray to the left with a **hollow** end, because 3 itself is not included.

        Had the sign been $\le$, the number 3 itself would count and the end would be filled.
      `,
    },
    {
      id: 'read-picture',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const at = rng.int(-4, 4);
        const dir = rng.pick(['left', 'right']);
        const closed = rng.bool();
        const sign = dir === 'left' ? (closed ? '≤' : '<') : (closed ? '≥' : '>');
        const otherWay = dir === 'left' ? ['>', '≥'] : ['<', '≤'];
        return {
          text: 'Which inequality does this number line show?',
          figure: {
            type: 'ineq-line', mode: 'ray', ...LINE, at, dir, closed, static: true,
            alt: `A number line with a ray shaded to the ${dir} of ${at}. The end at ${at} is ${closed ? 'filled' : 'hollow'}.`,
          },
          shuffle: false,
          options: SIGNS.map((sg) => ({
            text: `$x ${SIGN_TEX[sg]} ${at}$`,
            correct: sg === sign,
            why: sg === sign ? undefined
              : otherWay.includes(sg) ? `That would shade the other side: the numbers ${dir === 'left' ? 'greater' : 'less'} than $${at}$.`
                : closed ? `Look at the end of the ray: it is filled, so $${at}$ itself is included.` : `Look at the end of the ray: it is hollow, so $${at}$ itself is not included.`,
          })),
          explain: `The shading covers the numbers ${dir === 'left' ? 'less' : 'greater'} than $${at}$, and the ${closed ? 'filled' : 'hollow'} end says that $${at}$ itself is ${closed ? 'included' : 'not included'}: $x ${SIGN_TEX[sign]} ${at}$.`,
        };
      },
    },
    {
      id: 'example-solve',
      type: 'info',
      title: 'Solve it like an equation',
      text: r`
        You do not have to test numbers every time. An inequality stays true when you add or subtract the same number on both sides, or multiply or divide both sides by a **positive** number.

        :::example
        Solve $2x + 5 > 11$.

        | Line | Move, on both sides |
        |---|---|
        | $2x + 5 > 11$ | |
        | $2x > 6$ | subtract 5 |
        | $x > 3$ | divide by 2 |
        :::

        Check with a number from the answer, say 4: $\;2 \times 4 + 5 = 13$, and $13 > 11$ is true.
      `,
      figure: {
        type: 'ineq-line', mode: 'ray', ...LINE, at: 3, dir: 'right', closed: false, symbols: true, static: true,
        alt: 'The answer on a number line: a ray shaded to the right of 3 with a hollow end, x is greater than 3.',
      },
    },
    {
      id: 'like-an-equation',
      type: 'fill',
      title: 'Your turn',
      text: r`
        The same two moves work here, and neither changes the sign.

        **Solve $\;3x - 4 \le 11$.**
      `,
      template: r`
        Add [[4]] to both sides: $\;3x \le$ [[15]]

        Divide both sides by 3: $\;x$ [[<|*≤|>|≥]] [[5]]
      `,
      explain: r`
        $3x - 4 \le 11 \;\longrightarrow\; 3x \le 15 \;\longrightarrow\; x \le 5$.

        Check with a number from the answer, say 0: $\;3 \times 0 - 4 = -4$, and $-4 \le 11$ is true.
      `,
    },
    {
      id: 'flip-discover',
      type: 'interact',
      title: 'The one trap',
      text: r`
        Solve $\;-2x < 6\;$ the same way: divide both sides by $-2$ and you get $x < -3$.

        Or do you? **Test numbers on both sides of $-3$ before you believe it.**
      `,
      widget: {
        type: 'ineq-line', mode: 'probe', ...LINE, x: 0,
        test: { lhs: '-2x', op: '<', rhs: '6' },
        alt: 'A number line from -6 to 6 with a probe that can be dragged. Each number the probe visits is marked true or false for the statement -2x < 6.',
      },
      check: (s) => {
        const below = s.falseAt.filter((v) => v < -3);
        if (s.falseAt.includes(-3) && below.length && s.trueAt.some((v) => v > -3)) return true;
        if (!s.falseAt.length) return r`Everything you have tried is true, and none of it is less than $-3$. Now try some numbers that are less than $-3$.`;
        if (!s.falseAt.includes(-3)) return r`Test $-3$ itself as well.`;
        return r`Try a number less than $-3$, such as $-5$. Those were supposed to be the solutions.`;
      },
      solution: { visited: [-5, -4, -3, -2, -1, 0], x: -5 },
      explain: r`
        The answer $x < -3$ is the wrong way round. The numbers that work are the ones **greater** than $-3$:

        $$ -2x < 6 \;\longrightarrow\; x > -3 $$

        Dividing by a negative number turned "less than" into "greater than".
      `,
    },
    {
      id: 'flip-rule',
      type: 'info',
      title: 'Why the sign turns round',
      text: r`
        Start with something true: $\;2 < 5$. Multiply both numbers by $-1$. Each is mirrored to the other side of zero, and in a mirror left and right swap: now $-2$ lies to the right, so $-2 > -5$.

        :::key
        Multiply or divide both sides of an inequality by a **negative** number, and the sign **flips**: $<$ becomes $>$, and $\le$ becomes $\ge$.
        :::

        :::example
        | Line | Move, on both sides |
        |---|---|
        | $-7x - 1 \le 13$ | |
        | $-7x \le 14$ | add 1: the sign stays |
        | $x \ge -2$ | divide by $-7$: the sign **flips** |
        :::
      `,
      figure: {
        type: 'number-line', min: -6, max: 6, step: 1, major: 1,
        marks: [{ value: 2, color: 'blue' }, { value: 5, color: 'blue' }, { value: -2, color: 'orange' }, { value: -5, color: 'orange' }],
        hops: [{ from: 2, to: -2, color: 'gray' }, { from: 5, to: -5, color: 'gray' }],
        alt: 'A number line from -6 to 6. Arrows carry 2 over to -2 and 5 over to -5, on the other side of zero.',
      },
    },
    {
      id: 'solve',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const a = (rng.bool(0.65) ? -1 : 1) * rng.int(2, 6);
        const n = rng.int(-6, 6);
        const b = rng.nonzero(-9, 9);
        const sign = rng.pick(SIGNS);
        const answer = a < 0 ? FLIPPED[sign] : sign;
        const rhs = a * n + b;
        const st = SIGN_TEX[sign];
        return {
          text: r`
            **Solve the inequality.**

            $$ ${linear(a, b)} ${st} ${num(rhs)} $$
          `,
          template: r`$x$ ${signBlank(answer)} [[${n}]]`,
          hints: [
            `First get the $x$ term alone: ${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)} on both sides.`,
            a < 0
              ? r`Then you divide by $${a}$, a negative number. What must happen to the sign?`
              : r`Then you divide by $${a}$, a positive number, so the sign stays as it is.`,
          ],
          explain: r`
            ${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: $\;${a}x ${st} ${num(a * n)}$. Then divide by $${a}$${a < 0 ? r`, which is negative, so the sign flips` : ', which is positive, so the sign stays'}:

            $$ x ${SIGN_TEX[answer]} ${num(n)} $$
          `,
        };
      },
    },
    {
      id: 'which-flips',
      type: 'bucket',
      title: 'Flip or keep?',
      text: 'You do one thing to **both sides** of an inequality. Does the sign have to flip?',
      buckets: ['The sign stays', 'The sign flips'],
      items: [
        { text: 'Add 7', bucket: 0 },
        { text: 'Subtract 10', bucket: 0, why: 'Subtracting moves both sides the same distance along the number line. Their order does not change.' },
        { text: r`Add $-4$`, bucket: 0, why: r`Adding a negative number is just subtracting. Only **multiplying** or **dividing** by a negative flips the sign.` },
        { text: 'Multiply by 3', bucket: 0 },
        { text: r`Divide by $-2$`, bucket: 1 },
        { text: r`Multiply by $-1$`, bucket: 1 },
        { text: 'Divide by 5', bucket: 0 },
      ],
      explain: r`
        Only two moves flip the sign: multiplying by a negative number and dividing by one.

        Adding and subtracting never do, whatever the sign of the number. Test it: $2 < 5$, and after adding $-4$ to both sides, $-2 < 1$ is still true.
      `,
    },
    {
      id: 'teach-compound',
      type: 'info',
      title: 'Between two numbers',
      text: r`
        Two conditions can be written as one: $\;-1 \le x < 4\;$ says that $x$ is at least $-1$ **and** less than 4. Read it from the middle outwards. On the line it is a stretch with two ends.

        To solve a double inequality, do the same thing to **all three parts**.

        :::example
        | Line | Move, on all three parts |
        |---|---|
        | $-5 \le 6x + 1 < 25$ | |
        | $-6 \le 6x < 24$ | subtract 1 |
        | $-1 \le x < 4$ | divide by 6 |
        :::
      `,
      figure: {
        type: 'ineq-line', mode: 'segment', ...LINE, from: -1, to: 4, closedFrom: true, closedTo: false, symbols: true, static: true,
        alt: 'A number line with the stretch from -1 to 4 shaded. The end at -1 is filled and the end at 4 is hollow.',
      },
    },
    {
      id: 'compound',
      type: 'interact',
      title: 'Draw one',
      text: r`
        Here is another double inequality:

        $$ -2 < x \le 3 $$

        It says that $x$ is greater than $-2$ **and** at most 3. **Draw it.**
      `,
      widget: {
        type: 'ineq-line', mode: 'segment', ...LINE, from: -5, to: 1, closedFrom: true, closedTo: false,
        alt: 'A number line from -6 to 6 with a shaded stretch between two ends. Each end can be dragged and made filled or hollow.',
      },
      check: (s) => {
        if (s.from !== -2 || s.to !== 3) return r`The shading should run from $-2$ to $3$.`;
        if (s.closedFrom) return r`$-2 < x$ says that $x$ is greater than $-2$. So $-2$ itself is not included: that end is hollow.`;
        if (!s.closedTo) return r`$x \le 3$ allows $x$ to be equal to 3. So that end is filled.`;
        return true;
      },
      solution: { from: -2, to: 3, closedFrom: false, closedTo: true },
      explain: r`
        A hollow end at $-2$, a filled end at $3$, and everything in between.

        Read $-2 < x \le 3$ from the middle outwards: "$x$ is greater than $-2$, and $x$ is less than or equal to 3".
      `,
    },
    {
      id: 'solve-compound',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 5);
        const b = rng.nonzero(-8, 8);
        const lo = rng.int(-5, 2);
        const hi = lo + rng.int(2, 6);
        const s1 = rng.pick(['<', '≤']);
        const s2 = rng.pick(['<', '≤']);
        const [t1, t2] = [SIGN_TEX[s1], SIGN_TEX[s2]];
        const move = `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}`;
        return {
          text: r`
            A double inequality is solved by doing the same thing to **all three parts**.

            $$ ${num(a * lo + b)} ${t1} ${linear(a, b)} ${t2} ${num(a * hi + b)} $$
          `,
          template: r`[[${lo}]] $${t1}\; x \;${t2}$ [[${hi}]]`,
          hints: [
            `${move} in all three parts, so that only the $x$ term is left in the middle.`,
            `Then divide all three parts by ${a}. It is positive, so both signs stay.`,
          ],
          explain: r`
            ${move} everywhere: $\;${num(a * lo)} ${t1} ${a}x ${t2} ${num(a * hi)}$. Divide everything by ${a}:

            $$ ${num(lo)} ${t1} x ${t2} ${num(hi)} $$
          `,
        };
      },
    },
    {
      id: 'example-limit',
      type: 'info',
      title: 'A limit is an inequality',
      text: r`
        Many everyday limits are inequalities: "at most" means $\le$.

        :::example
        A shelf holds at most 50 kg. A toolbox of 8 kg is already on it, and each tin of paint weighs 4 kg. How many tins, $x$, can join it?

        | Line | Why |
        |---|---|
        | $8 + 4x \le 50$ | the total must not pass the limit |
        | $4x \le 42$ | subtract 8 |
        | $x \le 10.5$ | divide by 4 |
        :::

        Tins come whole, so take the largest whole number that is not above 10.5: **10 tins**.
      `,
    },
    {
      id: 'limit',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const story = rng.pick([
          { each: [35, 40, 45, 60], fixed: [80, 110, 130, 150], lead: (L, F, E) => `A goods lift can carry at most **${L} kg**. A trolley weighing **${F} kg** is already inside, and each crate weighs **${E} kg**.`, ask: 'What is the largest number of crates that can go in with the trolley?', unit: 'crates', what: 'crates' },
          { each: [3, 4, 6, 7], fixed: [5, 9, 12, 14], lead: (L, F, E) => `A phone has **${L} GB** of free space. An update will take up **${F} GB**, and each film needs **${E} GB**.`, ask: 'What is the largest number of films that still fit together with the update?', unit: 'films', what: 'films' },
          { each: [12, 15, 18, 25], fixed: [30, 45, 50, 70], lead: (L, F, E) => `You have **${L} coins** in a game. Entering the tournament costs **${F} coins**, and each extra life costs **${E} coins**.`, ask: 'What is the largest number of extra lives you can afford on top of the entry?', unit: 'lives', what: 'extra lives' },
        ]);
        const each = rng.pick(story.each);
        const fixed = rng.pick(story.fixed);
        const n = rng.int(4, 11);
        const spare = rng.bool(0.25) ? 0 : rng.int(1, each - 1);
        const limit = fixed + n * each + spare;
        const room = limit - fixed;
        const careless = Math.floor(limit / each);
        return {
          title: 'At most',
          text: `
            ${story.lead(limit, fixed, each)}

            **${story.ask}**
          `,
          answer: n,
          unit: story.unit,
          wrong: [
            [n + 1, `Check that: ${fixed} + ${n + 1} × ${each} = ${fixed + (n + 1) * each}, which is more than ${limit}.`],
            [careless, `That uses the whole ${limit} for the ${story.what}. But ${fixed} of it is already taken.`],
          ],
          hints: [
            r`Call the number $x$. The total must not go over the limit: $\;${fixed} + ${each}x \le ${limit}$.`,
            r`Subtract ${fixed}: $\;${each}x \le ${room}$. How many whole times does ${each} go into ${room}?`,
          ],
          explain: r`
            $${fixed} + ${each}x \le ${limit}$, so $${each}x \le ${room}$.

            $${n} \times ${each} = ${n * each}$ fits ${spare === 0 ? 'exactly' : `(with ${spare} to spare)`}, and $${n + 1} \times ${each} = ${(n + 1) * each}$ is too much. The largest whole number is **${n}**.
          `,
        };
      },
    },
    {
      id: 'square',
      type: 'interact',
      stretch: true,
      title: 'A square in an inequality',
      text: r`
        **Which numbers satisfy $\;x^2 < 9\,$?**

        Test a few in your head first: try $0$, $4$, $-4$ and $3$. Then draw the answer.
      `,
      widget: {
        type: 'ineq-line', mode: 'segment', ...LINE, from: -5, to: 5, closedFrom: true, closedTo: true,
        alt: 'A number line from -6 to 6 with a shaded stretch between two ends. Each end can be dragged and made filled or hollow.',
      },
      check: (s) => {
        if (s.to > 3) {
          const w = Math.max(s.from, 3) + 0.5;
          return r`Your shading reaches beyond 3. Test a number from that part: $${num(w)}^2 = ${num(w * w)}$, which is not less than 9.`;
        }
        if (s.from < -3) {
          const w = Math.min(s.to, -3) - 0.5;
          return r`Your shading reaches beyond $-3$. Test a number from that part: $(${num(w)})^2 = ${num(w * w)}$, which is not less than 9.`;
        }
        if (s.to < 3) {
          const w = s.to + 0.5;
          return r`Some solutions are missing. For example $${num(w)}$ is not shaded, but $${w < 0 ? `(${num(w)})` : num(w)}^2 = ${num(w * w)}$ is less than 9.`;
        }
        if (s.from > -3) {
          const w = s.from - 0.5;
          return r`Some solutions are missing. For example $${num(w)}$ is not shaded, but $${w < 0 ? `(${num(w)})` : num(w)}^2 = ${num(w * w)}$ is less than 9.`;
        }
        if (s.closedFrom || s.closedTo) return r`At $x = 3$ and at $x = -3$ the square is exactly 9, and $9 < 9$ is false. Both ends must be hollow.`;
        return true;
      },
      solution: { from: -3, to: 3, closedFrom: false, closedTo: false },
      hints: [r`$(-4)^2 = 16$ is too big, just like $4^2$. Negative numbers have positive squares.`],
      explain: r`
        $-3 < x < 3$. A square is less than 9 when the number is closer to zero than 3, on either side.

        Think of the parabola $y = x^2$: it is below the height 9 exactly between its two crossings, at $-3$ and at $3$. Taking a square root "on both sides" would have given only $x < 3$ and missed the left end. When in doubt, test numbers.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        $4 < 10$ is true. Divide both sides by $-2$.

        **In your own words: what happens to the two numbers, and why must the sign flip?**
      `,
      model: r`
        The numbers become $-2$ and $-5$. On the number line $-2$ is to the right of $-5$, so now the left-hand number is the larger one: $-2 > -5$.

        Dividing by a negative number mirrors everything to the other side of zero. A mirror swaps left and right, so whichever number was further right is now further left. The sign has to turn round to keep the statement true.
      `,
    },
  ],
  recap: [
    'The solutions of an inequality fill a stretch of the number line. A hollow end is left out ($<$, $>$); a filled end is included ($\\le$, $\\ge$).',
    'Solve an inequality like an equation: add, subtract, multiply or divide on both sides.',
    'The one trap: multiplying or dividing by a **negative** number flips the sign.',
    'A double inequality such as $-2 < x \\le 3$ is solved by doing the same to all three parts.',
  ],
  next: 'Next: the rules of powers, and what a power of zero, a negative power and a power of one half must mean.',
};
