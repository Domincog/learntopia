/**
 * A sample lesson that uses every step type once. It doubles as living
 * documentation (see docs/AUTHORING.md) and as a test fixture: open
 * #/dev/steps to play it.
 */
const r = String.raw;

export const sampleLesson = {
  steps: [
    {
      id: 'welcome',
      type: 'info',
      title: 'The step sampler',
      text: r`
        This lesson shows **every kind of step** the player can run.

        Lesson text supports *emphasis*, ==highlights==, [coloured words]{.blue}, inline math like $a^2 + b^2 = c^2$ and display math:

        $$ \blue{x} = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$

        :::tip
        Callouts draw attention to one idea. Keep them short.
        :::

        | Type | Graded? |
        |------|:-------:|
        | info | no |
        | choice | yes |
      `,
    },
    {
      id: 'predict',
      type: 'choice',
      mode: 'predict',
      title: 'Predict first',
      text: 'You re-read your notes three times. A friend reads once, then tests herself twice. A week later, who remembers more?',
      options: [
        { text: 'You (three readings)' },
        { text: 'Your friend (one reading, two self-tests)', correct: true },
        { text: 'About the same' },
      ],
      explain: 'Self-testing wins by a wide margin. Pulling an idea *out* of memory strengthens it far more than putting it *in* again.',
    },
    {
      id: 'choice',
      type: 'choice',
      text: r`Which expression equals $2(x + 3)$?`,
      options: [
        { text: r`$2x + 3$`, why: 'The 2 multiplies *both* terms inside the brackets, not just the $x$.' },
        { text: r`$2x + 6$`, correct: true, why: r`Right: $2 \cdot x + 2 \cdot 3$.` },
        { text: r`$x + 6$`, why: 'The $x$ gets doubled too.' },
        { text: r`$2x + 5$`, why: 'Multiply, do not add: $2 \\cdot 3 = 6$.' },
      ],
      hints: ['Multiply the 2 by each term inside the brackets.', r`$2 \cdot x$ and $2 \cdot 3$ — then add them.`],
      explain: r`Distributing: $2(x+3) = 2\cdot x + 2 \cdot 3 = 2x + 6$.`,
      review: true,
    },
    {
      id: 'multi',
      type: 'multi',
      text: 'Which of these numbers are prime?',
      options: [
        { text: '2', correct: true },
        { text: '9', why: '$9 = 3 \\times 3$, so it is not prime.' },
        { text: '17', correct: true },
        { text: '21', why: '$21 = 3 \\times 7$.' },
        { text: '29', correct: true },
        { text: '1', why: 'By convention 1 is not prime: a prime has exactly two divisors.' },
      ],
      explain: 'A prime has exactly two divisors: 1 and itself. That rules out 1 (one divisor), 9 and 21.',
    },
    {
      id: 'numeric',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 9);
        const x = rng.int(2, 12);
        const b = rng.int(1, 20);
        return {
          text: r`Solve for $x$: $\;${a}x + ${b} = ${a * x + b}$`,
          prefix: '$x =$',
          answer: x,
          wrong: [[(a * x + b) / a, 'Subtract first, *then* divide.'], [a * x, `That is $${a}x$. One more step: divide by ${a}.`]],
          hints: [`First undo the $+ ${b}$ by subtracting ${b} from both sides.`, `Now you have $${a}x = ${a * x}$. Divide both sides by ${a}.`],
          explain: r`Subtract ${b}: $${a}x = ${a * x}$. Divide by ${a}: $x = ${x}$.`,
        };
      },
    },
    {
      id: 'short',
      type: 'short',
      text: 'What do we call a polygon with exactly five sides?',
      answers: ['pentagon', /^a pentagon$/i],
      wrong: [['hexagon', 'A hexagon has six sides.']],
      explain: '*Penta-* is Greek for five, as in pentathlon.',
    },
    {
      id: 'expr',
      type: 'expr',
      text: r`Expand $(x + 2)(x + 5)$.`,
      answer: 'x^2 + 7x + 10',
      vars: ['x'],
      wrong: [['x^2 + 10', 'Do not forget the two middle terms: $5x$ and $2x$.']],
      explain: r`$x \cdot x + x \cdot 5 + 2 \cdot x + 2 \cdot 5 = x^2 + 7x + 10$.`,
    },
    {
      id: 'order',
      type: 'order',
      text: 'Put these fractions in order, smallest first.',
      items: [r`$\frac{1}{8}$`, r`$\frac{1}{4}$`, r`$\frac{1}{3}$`, r`$\frac{1}{2}$`],
      labels: ['Smallest', 'Largest'],
      explain: 'With the same numerator, a bigger denominator means smaller pieces.',
    },
    {
      id: 'parsons',
      type: 'order',
      code: 'python',
      text: 'Arrange the lines into a program that prints the numbers 1 to 3.',
      items: ['n = 1', 'while n <= 3:', '    print(n)', '    n = n + 1'],
      explain: 'Set the counter up first; the loop body is the indented part, and the counter must change inside the loop or it never ends.',
    },
    {
      id: 'match',
      type: 'match',
      text: 'Match each shape to its number of sides.',
      pairs: [['Triangle', '3'], ['Hexagon', '6'], ['Octagon', '8'], ['Pentagon', '5']],
    },
    {
      id: 'bucket',
      type: 'bucket',
      text: 'Sort the numbers.',
      buckets: ['Even', 'Odd'],
      items: [['12', 0], ['7', 1], ['30', 0], ['45', 1], ['0', 0], ['101', 1]],
      explain: 'Even numbers are divisible by 2 — including 0.',
    },
    {
      id: 'fill',
      type: 'fill',
      text: 'Complete the sentence.',
      template: r`A triangle has [[3]] sides and its angles add up to [[90|*180|360]] degrees. If $x + 4 = 10$ then $x =$ [[6]].`,
    },
    {
      id: 'slider',
      type: 'slider',
      text: 'Estimate: roughly what percentage of a new fact do people forget within one day if they never review it?',
      min: 0, max: 100, step: 5, answer: 60, tolerance: 15, unit: '%', start: 0,
      explain: 'Ebbinghaus’s classic experiments found more than half of new material gone within a day. Exact numbers vary with the material — the steep early drop does not.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: 'In your own words: why is testing yourself better than re-reading?',
      model: 'Re-reading makes material *feel* familiar, which we mistake for knowing it. Retrieving it from memory is harder, and that effort is what strengthens the memory and exposes the gaps.',
    },
    {
      id: 'figures',
      type: 'choice',
      text: 'Steps can show figures. What does this code print?',
      figure: [
        { type: 'code', lang: 'python', numbers: true, code: 'total = 0\nfor n in [1, 2, 3]:\n    total = total + n\nprint(total)' },
        { type: 'svg', viewBox: '0 0 300 70', maxWidth: 320, alt: 'Three boxes holding 1, 2 and 3',
          content: '<g class="stroke-ink" stroke-width="2.5"><rect class="fill-blue-soft" x="40" y="14" width="60" height="42" rx="8"/><rect class="fill-blue-soft" x="120" y="14" width="60" height="42" rx="8"/><rect class="fill-blue-soft" x="200" y="14" width="60" height="42" rx="8"/></g><text class="fig-label" x="70" y="42" text-anchor="middle">1</text><text class="fig-label" x="150" y="42" text-anchor="middle">2</text><text class="fig-label" x="230" y="42" text-anchor="middle">3</text>' },
      ],
      options: ['3', '6', '123', '0'],
      answer: 1,
      shuffle: false,
      explain: 'The loop adds each number to `total`: $0 + 1 + 2 + 3 = 6$.',
    },
    {
      id: 'fill-code',
      type: 'fill',
      text: 'Blanks work inside code too. Complete the loop so it prints 0, 1, 2.',
      template: '```python\nfor i in [[range]]([[3]]):\n    print(i)\n```',
      explain: '`range(3)` produces 0, 1, 2.',
    },
    {
      id: 'option-figures',
      type: 'choice',
      text: 'Options can be pictures. Which graph shows a line with **negative** slope?',
      options: [
        { text: 'A', figure: { type: 'plot', x: [-3, 3], y: [-3, 3], fns: [{ expr: 'x', color: 'blue' }], tickLabels: false, alt: 'rising line' } },
        { text: 'B', correct: true, figure: { type: 'plot', x: [-3, 3], y: [-3, 3], fns: [{ expr: '-x', color: 'blue' }], tickLabels: false, alt: 'falling line' } },
        { text: 'C', figure: { type: 'plot', x: [-3, 3], y: [-3, 3], fns: [{ expr: '1', color: 'blue' }], tickLabels: false, alt: 'flat line' } },
        { text: 'D', figure: { type: 'plot', x: [-3, 3], y: [-3, 3], fns: [{ expr: 'x^2 - 2', color: 'blue' }], tickLabels: false, alt: 'parabola' } },
      ],
      explain: 'A line with negative slope falls as you move to the right.',
    },
    {
      id: 'interact',
      type: 'interact',
      text: 'Interactive steps are answered by *doing*. Set the slope and intercept so the blue line matches the dashed one.',
      widget: {
        type: 'plot', x: [-6, 6], y: [-6, 6],
        params: { m: { min: -3, max: 3, step: 0.5, value: 1, label: 'slope $m$' }, b: { min: -5, max: 5, step: 1, value: 0, label: 'intercept $b$', color: 'orange' } },
        fns: [{ expr: '2x - 3', color: 'gray', dashed: true }, { expr: 'm*x + b', color: 'blue' }],
      },
      target: { m: 2, b: -3 },
      hints: ['Where does the dashed line cross the y-axis? That is $b$.'],
      explain: 'The dashed line crosses the y-axis at $-3$ and rises 2 for every 1 across: $y = 2x - 3$.',
    },
  ],
  recap: [
    'Every step type renders and can be checked.',
    'Feedback, hints and explanations are attached to each step.',
  ],
};
