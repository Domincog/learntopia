// Algorithms · Lesson 1 · Recipes for Machines
import { COMMAND, FACING, narrate, robotTrace } from '../helpers.js';

const SLIP = {
  mirror: 'That is where it would stop if left and right were swapped. Turn the way the *robot* is facing, not the way you are looking at the screen.',
  turnsMove: 'A turn happens on the spot. It never moves the robot to another square.',
  short: 'The robot passes this square, but it still has a Forward to carry out.',
};

/** The worked trace. Three Forwards in a row: the generated "trace" puzzles never have more than two. */
const TRACE_DEMO = { dir: 'S', program: ['F', 'F', 'F', 'L', 'F', 'F'] };

/** The worked "steps that repeat" example: count the numbers bigger than 10. */
const COUNT_DEMO = { limit: 10, list: [4, 12, 7, 15] };
const COUNT_CODE = [
  'set count to 0',
  'for each number:',
  `  if number > ${COUNT_DEMO.limit}:`,
  '    add 1 to count',
  'output count',
];
/** The run of that recipe on the list: for each number the verdict of the test and the count after it. */
function countRun() {
  let count = 0;
  const verdicts = [];
  const counts = [];
  for (const v of COUNT_DEMO.list) {
    const yes = v > COUNT_DEMO.limit;
    if (yes) count += 1;
    verdicts.push(yes ? 'yes' : 'no');
    counts.push(count);
  }
  return { verdicts, counts, count };
}

export default {
  id: 'what-is-an-algorithm',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'It does what you say',
      text: `
        This robot follows a list of commands, one after another. It knows only three:
        **Forward** (roll one square ahead), **Turn left** and **Turn right** (a quarter turn on the spot).

        It is about to run the program under the grid. **On which square will it stop?**
      `,
      figure: {
        type: 'robot-grid', static: true, cols: 6, rows: 4,
        start: { x: 2, y: 3, dir: 'N' },
        program: ['F', 'F', 'R', 'F', 'F'],
        marks: { A: [0, 1], B: [3, 1], C: [4, 1], D: [5, 1] },
        alt: 'A robot at the bottom of a grid, facing up. Two rows above it, four squares carry letters: A far to the left, then B, C and D to the right.',
      },
      shuffle: false,
      options: [
        { text: 'Square A', why: 'A is where it would stop after turning *left*. The program says right.' },
        { text: 'Square B', why: 'One short: after the turn there are two Forwards, not one.' },
        { text: 'Square C', correct: true },
        { text: 'Square D', why: 'A turn happens on the spot. It does not also move the robot one square.' },
      ],
      explain: `
        Two squares up, a quarter turn to the right **without moving**, two squares along: it stops on **C**.

        The robot did not ask what you meant. It carried out exactly what was written, in order, and then stopped.
      `,
    },
    {
      id: 'first-program',
      type: 'interact',
      graded: false,
      auto: true,
      attempts: 6,
      title: 'Your turn to give the orders',
      text: 'Now you write the program. **Add commands, then press Run** to send the robot to the flag.',
      widget: { type: 'robot-grid', cols: 5, rows: 4, start: { x: 0, y: 3, dir: 'N' }, goal: { x: 3, y: 1 }, max: 12 },
      check: (s) => {
        if (!s.length) return 'The program is empty. Add some commands first.';
        if (!s.ran) return 'Press **Run** to see what your program does.';
        if (s.crashed) return `Command ${s.crashAt} drives the robot off the grid. Change it and run again.`;
        if (s.reached) return true;
        if (s.passedGoal) return 'The robot drove over the flag and kept going. Remove the extra commands.';
        return 'The robot does not stop on the flag yet. Change the program and run it again.';
      },
      solution: { program: ['F', 'F', 'R', 'F', 'F', 'F'] },
      hints: [
        'The flag is 2 squares up and 3 squares to the right.',
        'Forward twice, turn right, then Forward three times.',
      ],
      explain: `
        Every square the robot rolled and every turn it made was one of **your** commands, carried out in order.

        If it did something you did not intend along the way, you met your first **bug**: the machine did what you *said*, not what you *meant*.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'A recipe a machine can follow',
      text: `
        What you just wrote is an **algorithm**: a list of steps for getting a job done, where

        - every step is something the machine **can do** (*forward*, *turn left*),
        - every step is **exact**, with nothing left to judgement,
        - the steps come in a **definite order**, and the list **ends**.

        A recipe that says "bake until golden" works for a person. A machine needs "bake for 12 minutes at 180 °C".

        :::key
        A machine has no common sense. It does exactly what the steps say: no more, no less.
        :::
      `,
    },
    {
      id: 'precise-or-vague',
      type: 'bucket',
      review: true,
      text: 'Which of these instructions are exact enough for a machine, and which only work if you have common sense?',
      buckets: ['Exact enough', 'Needs common sense'],
      items: [
        { text: 'Roll forward 3 squares', bucket: 0 },
        { text: 'Turn a quarter turn to the left', bucket: 0 },
        { text: 'Add 200 ml of water', bucket: 0 },
        { text: 'Wait 10 minutes', bucket: 0 },
        { text: 'Go a bit further', bucket: 1, why: 'How far is "a bit"? A person guesses. A machine cannot.' },
        { text: 'Add salt to taste', bucket: 1, why: 'A machine has no taste. It needs an amount.' },
        { text: 'Stop when it looks done', bucket: 1, why: '"Looks done" is a judgement. A machine needs a test it can check, such as a time or a temperature.' },
        { text: 'Tidy the room nicely', bucket: 1, why: '"Nicely" hides hundreds of decisions that nobody has spelled out.' },
      ],
      explain: `
        The exact ones say **what** to do and **how much**: 3 squares, a quarter turn, 200 ml, 10 minutes.

        The others lean on judgement: *a bit*, *to taste*, *looks done*, *nicely*. People fill such gaps without noticing. A machine cannot.
      `,
    },
    {
      id: 'order-matters',
      type: 'order',
      text: `
        An everyday algorithm: cooking pasta. A machine would carry out these steps in whatever order it is given.

        **Put them in an order that works.**
      `,
      items: [
        'Fill a pot with water',
        'Heat the pot until the water boils',
        'Put the pasta into the boiling water',
        'Wait 10 minutes',
        'Pour off the water',
      ],
      labels: ['First', 'Last'],
      explain: `
        Same five steps, different order, different dinner: pour off the water first and nothing gets cooked.

        In an algorithm the **order is part of the instructions**.
      `,
    },
    {
      id: 'fix-bug',
      type: 'interact',
      auto: true,
      attempts: 6,
      title: 'Find the bug',
      text: `
        This program was meant to take the robot to the flag. **One command is wrong.**

        Press **Run** and watch what goes wrong. Then tap the faulty command, replace it, and run again.
      `,
      widget: {
        type: 'robot-grid', cols: 5, rows: 3, start: { x: 0, y: 2, dir: 'E' }, goal: { x: 4, y: 1 },
        program: ['F', 'L', 'F', 'L', 'F', 'F', 'F'], max: 10,
      },
      check: (s) => {
        if (!s.ran) return 'Press **Run** to test the program.';
        if (s.reached) return true;
        if (s.crashed) return `It still crashes at command ${s.crashAt}. Which way is the robot facing just before that?`;
        return 'No crash now, but the robot does not stop on the flag.';
      },
      solution: { program: ['F', 'L', 'F', 'R', 'F', 'F', 'F'] },
      hints: [
        'Watch the robot at command 4. Which way does it turn? Which way should it turn to face the flag?',
        'Tap command 4, then press **Turn right** to replace it. Then run the program again.',
      ],
      explain: `
        Command 4 said *left* where it should have said *right*. The robot noticed nothing odd. It turned left, rolled on and crashed, exactly as written.

        Hunting down and repairing a mistake like this is called **debugging**. Every programmer does it, every day.
      `,
    },
    {
      id: 'teach-trace',
      type: 'info',
      title: 'Trace it, one command at a time',
      text: `
        To predict where a program ends, **trace** it: go through the commands one by one, and keep track of two things, the robot's square and the way it faces.

        :::example
        The robot faces **${FACING[TRACE_DEMO.dir]}** and runs: ${TRACE_DEMO.program.map((c) => COMMAND[c]).join(', ')}.

        ${narrate(TRACE_DEMO.program, TRACE_DEMO.dir).map((line, i) => `${i + 1}. ${line}`).join('\n        ')}
        :::

        Press **Run** and check the trace against the robot.
      `,
      figure: {
        type: 'robot-grid', editable: false, cols: 5, rows: 4,
        start: { x: 1, y: 0, dir: TRACE_DEMO.dir }, program: TRACE_DEMO.program,
        alt: 'A robot in the top row of a grid, facing down, with a program of six commands under the grid.',
      },
    },
    {
      id: 'trace',
      type: 'choice',
      review: true,
      shuffle: false,
      title: 'Be the robot',
      gen: (rng) => {
        const puzzle = robotTrace(rng);
        const steps = narrate(puzzle.program, puzzle.start.dir);
        return {
          text: `
            The robot starts on the dashed square, facing **${FACING[puzzle.start.dir]}**, and runs this program:

            **${puzzle.program.map((c) => COMMAND[c]).join(', ')}**

            Carry it out in your head, one command at a time. **On which square does it stop?**
          `,
          figure: {
            type: 'robot-grid', static: true, cols: puzzle.cols, rows: puzzle.rows,
            start: puzzle.start, program: puzzle.program, marks: puzzle.marks,
            alt: `A robot on a 5 by 5 grid, in column ${puzzle.start.x + 1} of row ${puzzle.start.y + 1}, facing ${FACING[puzzle.start.dir]}. Four squares carry the letters A, B, C and D.`,
          },
          options: puzzle.squares.map((sq) => ({ text: `Square ${sq.letter}`, correct: sq.correct, why: SLIP[sq.slip] })),
          hints: [
            'A turn changes the direction the robot faces, never the square it is on.',
            '"Left" and "right" are the robot\'s own left and right. Imagine sitting on it, looking where it looks.',
          ],
          explain: `${steps.map((line, i) => `${i + 1}. ${line}`).join('\n')}\n\nIt stops on **${puzzle.answer}**.`,
        };
      },
    },
    {
      id: 'fewer-steps',
      type: 'interact',
      auto: true,
      attempts: 6,
      title: 'Same job, fewer steps',
      text: `
        This program reaches the flag, but it wanders: **8 commands**. Run it and watch.

        Then write a program that does the same job in **5 commands or fewer**.
      `,
      widget: {
        type: 'robot-grid', cols: 5, rows: 4, start: { x: 0, y: 3, dir: 'N' }, goal: { x: 2, y: 1 },
        program: ['F', 'F', 'F', 'R', 'F', 'F', 'R', 'F'], max: 10,
      },
      check: (s) => {
        if (!s.length) return 'The program is empty. Add some commands.';
        if (!s.ran) return 'Press **Run** to test your program.';
        if (s.crashed) return `Command ${s.crashAt} drives the robot off the grid.`;
        if (!s.reached) return 'The robot does not stop on the flag.';
        if (s.length > 5) return `That works, in ${s.length} commands. Five are enough: clear the program and head for the flag more directly.`;
        return true;
      },
      solution: { program: ['F', 'F', 'R', 'F', 'F'] },
      hints: [
        'The flag is 2 squares up and 2 squares to the right of the start. The old program overshoots and comes back.',
        'Forward, Forward, Turn right, Forward, Forward.',
      ],
      explain: `
        Forward, Forward, Turn right, Forward, Forward: straight to the flag. The old program drove one square too far and had to turn round and come back.
      `,
    },
    {
      id: 'teach-many-ways',
      type: 'info',
      title: 'One job, many algorithms',
      text: `
        You have now seen two programs for the same job:

        | Program | Commands | On the flag? |
        |:--|:-:|:-:|
        | The old one | 8 | yes |
        | Yours | 5 | yes |

        Both are **correct**. That is normal: most jobs have many correct algorithms, and we compare them by **counting steps**. The rest of this course is about one question: *which method gets the job done in the fewest steps?*

        An algorithm is the method, not the way it is written down. The same exact steps can be given as robot commands, in plain words, as a diagram or in a programming language.
      `,
    },
    {
      id: 'what-counts',
      type: 'multi',
      review: true,
      text: 'Which of these are true of **every** algorithm?',
      options: [
        { text: 'Each step is exact, with nothing left to judgement', correct: true },
        { text: 'The steps come in a definite order', correct: true },
        { text: 'Sooner or later it finishes', correct: true },
        { text: 'It has to be written in a programming language', why: 'A recipe, a knitting pattern or directions on paper can be an algorithm. What matters is that the steps are exact.' },
        { text: 'It is the only correct method for its problem', why: 'Most problems have many correct algorithms. Some just take far fewer steps than others.' },
      ],
      explain: `
        Exact steps, in a definite order, that come to an end: that is all an algorithm is.
        It can be written in code, in words or as a diagram, and there is usually more than one for the same job.
      `,
    },
    {
      id: 'teach-loop',
      type: 'info',
      title: 'Steps that repeat',
      text: `
        A list can have any length, so an algorithm for lists says *repeat*. This one counts the numbers bigger than ${COUNT_DEMO.limit}, in a memory place named \`count\`:

        \`\`\`pseudo
        ${COUNT_CODE.join('\n        ')}
        \`\`\`

        - **for each** repeats the indented lines under it, once per number.
        - **if** does its indented line only when the test is true. (\`>\` means "is bigger than".)

        On the list ${COUNT_DEMO.list.join(', ')} it puts out **${countRun().count}**:

        | Number | ${COUNT_DEMO.list.join(' | ')} |
        |:--|${COUNT_DEMO.list.map(() => ':-:').join('|')}|
        | Bigger? | ${countRun().verdicts.join(' | ')} |
        | \`count\` | ${countRun().counts.join(' | ')} |
      `,
    },
    {
      id: 'find-largest',
      type: 'order',
      code: 'pseudo',
      stretch: true,
      title: 'A first real algorithm',
      text: `
        A machine has to find the **largest number** in a list. It can look at only one number at a time,
        and it keeps one number in its memory, under the name \`largest\`.

        Arrange the lines into an algorithm that works for any list.
      `,
      items: [
        'set largest to first number',
        'for each other number:',
        '  if number > largest:',
        '    set largest to number',
        'output largest',
      ],
      hints: [
        'Before the machine can compare anything, it needs a first value to compare against.',
        'The indented lines are done again and again, once for each number. The answer is only known when the list has ended.',
      ],
      explain: `
        The machine walks along the list once, always holding on to the best number seen so far.

        It works for 5 numbers or 5 million, and the work is easy to count: a list of $n$ numbers means looking at $n$ numbers.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Think of something you do without thinking, like tying a shoelace or making a hot drink.

        **Which step would be hardest to write down exactly enough for a machine, and why?**
      `,
      model: `
        Usually it is a step that depends on feel or judgement: *pull until it is snug*, *stir until it has dissolved*, *pour until the cup is nearly full*.

        A machine needs a number or a test it can check instead: pull with a set force, stir for 20 seconds, stop pouring 1 cm below the rim.
        Turning "you just know" into exact steps is the real work of writing an algorithm.
      `,
    },
  ],
  recap: [
    'An **algorithm** is a list of exact steps, in a definite order, that ends.',
    'A machine has no common sense: it does what the steps *say*, not what you *meant*.',
    'The order of the steps is part of the algorithm.',
    'Different algorithms can do the same job. We compare them by **counting steps**.',
  ],
  next: 'Next: a guessing game that finds one number among a million in 20 tries.',
};
