// Logic & Deduction · Lesson 5 · Logic You Can Wire
import {
  CIRCUIT_AND_OR, CIRCUIT_NOT, CIRCUIT_LIGHT, CIRCUIT_NAND, CIRCUIT_XOR_BUILD, XOR_BUILD_SOLUTION,
  CIRCUIT_HALF_ADDER, HALF_ADDER_SOLUTION, CIRCUIT_TRACE_EXAMPLE, CIRCUIT_XOR, traceTask,
} from '../helpers.js';

const GATE_CLUES = [
  { gate: 'AND', text: 'Its output is 1 only when **both** inputs are 1.' },
  { gate: 'AND', text: 'A microwave oven runs only when the door is shut **and** the start button has been pressed.' },
  { gate: 'OR', text: 'Its output is 0 only when **both** inputs are 0.' },
  { gate: 'OR', text: 'A doorbell rings when the front button or the back button is pressed, or both.' },
  { gate: 'NOT', text: 'It has one input, and its output is always the opposite.' },
  { gate: 'NOT', text: 'A night light switches on exactly when its sensor reports that there is **no** daylight.' },
  { gate: 'XOR', text: 'Its output is 1 when **exactly one** of its inputs is 1.' },
  { gate: 'XOR', text: 'A stairway lamp has a switch at the top and one at the bottom. Flipping either one changes the lamp: it is lit when exactly one switch is up.' },
];
const GATE_WHY = {
  AND: 'AND insists on both inputs.',
  OR: 'OR is satisfied by one input, or by both.',
  NOT: 'NOT has a single input and flips it.',
  XOR: 'XOR wants exactly one input on: one or the other, but not both.',
};

export default {
  id: 'logic-gates',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'What is inside a calculator?',
      text: `
        A pocket calculator can add any two numbers you type in. Yet inside its chip there are no numbers at all,
        only tiny parts called **gates**, each switching an electric current on or off.

        **How many different kinds of gate does it take to build a machine that adds?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: 'Three kinds are plenty', correct: true },
        { text: 'About ten: one for each digit from 0 to 9' },
        { text: 'Hundreds of specialised kinds' },
      ],
      explain: `
        Three is plenty: **AND**, **OR** and **NOT**, the same three ideas you met in the last lesson.
        (Engineers can even manage with a single kind.)

        By the end of this lesson you will have wired up a circuit that adds.
      `,
    },
    {
      id: 'explore',
      type: 'interact',
      graded: false,
      title: 'Two switches, two gates',
      text: `
        Switches A and B each send out a **1** (on) or a **0** (off). Their wires run into two different gates,
        and each gate drives a lamp.

        **Flip the switches until you have seen all four combinations.** The table fills in as you go.
      `,
      widget: { ...CIRCUIT_AND_OR, table: 'discover' },
      check: (s) => s.seenAll || `Keep going: you have tried ${s.visited} of the 4 switch combinations.`,
      solution: { inputs: { A: 1, B: 1 }, seenAll: true },
      explain: `
        The **AND** gate lights its lamp only when A *and* B are both 1.
        The **OR** gate lights its lamp when A *or* B is 1, or both.

        These are the truth tables from the last lesson, built out of hardware: **1 for true, 0 for false**.
      `,
    },
    {
      id: 'gates-named',
      type: 'info',
      title: 'Logic gates',
      text: `
        A **logic gate** takes one or two signals in and sends one signal out, according to a fixed rule.

        - **AND**: out is 1 only if both inputs are 1.
        - **OR**: out is 1 if at least one input is 1.
        - **NOT**: one input, and the output is its opposite. Try it below.

        The output of one gate can be wired into the input of another. That is all a circuit is.
      `,
      figure: { ...CIRCUIT_NOT, alt: 'A switch A wired through a NOT gate to a lamp. The lamp is on when the switch is off.' },
    },
    {
      id: 'light-it',
      type: 'interact',
      title: 'Light the lamp',
      text: `
        Three switches, three gates, one lamp. Only **one** setting of the switches lights it.

        **Find that setting.** You could try all eight, but it is quicker to think backwards from the lamp.
      `,
      widget: CIRCUIT_LIGHT,
      check: (s) => {
        if (s.outputs.lamp === 1) return true;
        if (!s.inputs.C) return 'The last AND gate needs a 1 on both of its inputs. One of them comes straight from switch C.';
        if (s.inputs.B) return 'Switch B goes through a NOT gate, which flips it. What must B be for the NOT gate to send out a 1?';
        return 'Follow switch A into the first AND gate. That gate needs a 1 on both inputs.';
      },
      solution: { inputs: { A: 1, B: 0, C: 1 } },
      hints: [
        'The lamp hangs on an AND gate, so both of its inputs must be 1. One of them is switch C.',
        'The other comes from the first AND gate, which needs A to be 1 and the NOT gate’s output to be 1.',
      ],
      explain: `
        Working backwards: the last AND needs two 1s, so **C = 1** and the first AND must send a 1.
        That first AND needs **A = 1** and a 1 from the NOT gate, which means **B = 0**.

        In words, the circuit says: *A and not B and C*.
      `,
    },
    {
      id: 'example-trace',
      type: 'info',
      title: 'Trace it, one gate at a time',
      text: `
        You can work out what a circuit does without flipping anything. Follow the signals from
        the switches to the lamp: each gate’s output is the next gate’s input.

        :::example
        Here **A = 0** and **B = 1**.

        1. The NOT gate gets 0 and flips it. It sends out **1**.
        2. The AND gate gets that 1, and a 1 from B. Both inputs are 1, so it sends out **1**.
        3. The lamp gets 1: it is **on**.
        :::

        Flip a switch, trace the circuit in your head, then see whether the lamp agrees.
      `,
      figure: {
        ...CIRCUIT_TRACE_EXAMPLE,
        alt: 'Switch A, set to 0, feeds a NOT gate. The NOT gate and switch B, set to 1, feed an AND gate, which drives a lamp. The lamp is on.',
      },
    },
    {
      id: 'trace',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        const t = traceTask(rng);
        return {
          text: `
            A gate sends out a 1 or a 0. **AND**: 1 only if both inputs are 1. **OR**: 1 if at least one input is 1. **NOT**: the opposite of its input.

            Here the switches are set to **${t.settings}**. Is the lamp on or off?
          `,
          figure: t.figure,
          options: [{ text: 'On', correct: t.lamp === 1 }, { text: 'Off', correct: t.lamp === 0 }],
          hints: ['Start at the switches and work towards the lamp, one gate at a time.'],
          explain: t.explain,
        };
      },
    },
    {
      id: 'nand-table',
      type: 'interact',
      title: 'What does this circuit do?',
      text: `
        An AND gate with a NOT gate after it. Flip the switches to see how the circuit behaves,
        then **record the lamp for all four combinations**.
      `,
      figure: { ...CIRCUIT_NAND, alt: 'Switches A and B feed an AND gate. Its output passes through a NOT gate to a lamp.' },
      widget: {
        type: 'truth-table', symbols: ['1', '0'], order: 'binary', vars: ['A', 'B'],
        columns: [{ head: 'Lamp', value: (v) => !(v.A && v.B), fill: true }],
      },
      check: (s) => {
        if (s.correct) return true;
        if (!s.complete) return `Fill in all four rows (${s.total - s.filled} to go). Set the switches to match a row, then copy what the lamp does.`;
        return `Set the switches to ${s.firstWrong.inputs} and look at the lamp again.`;
      },
      solution: { solved: true },
      explain: `
        The lamp is on unless **both** switches are on: an AND turned upside down by the NOT. The combination is
        common enough to have its own name, **NAND** (“not and”).

        De Morgan would recognise it: “not both” is the same as “at least one is off”.
      `,
    },
    {
      id: 'build-xor',
      type: 'interact',
      stretch: true,
      attempts: 6,
      title: 'Build it yourself',
      text: `
        This circuit has three empty slots. Put an AND or an OR gate in each one so that the lamp lights
        when **exactly one** switch is on:

        on for **01** and **10**, off for **00** and **11**.
      `,
      widget: CIRCUIT_XOR_BUILD,
      check: (s) => {
        if (!s.complete) return 'Every numbered slot needs a gate first.';
        const t = s.truth.lamp.join('');
        if (t === '0110') return true;
        if (t === '1111') return 'Your lamp is on whatever the switches do. The last gate should insist on **both** of the signals reaching it.';
        if (t === '0000') return 'Your lamp never lights. Look at slots 1 and 2: one path should say “at least one switch is on”, the other, after the NOT, “not both”.';
        return 'Your circuit lights for 00 and 11, exactly the wrong way round. Swap the gates in slots 1 and 2, and let the last gate insist on **both** of the signals reaching it.';
      },
      solution: { gates: XOR_BUILD_SOLUTION },
      hints: [
        '“Exactly one” is two demands at once: **at least one** switch is on, and **not both** are.',
        'Slot 1 has no NOT after it, so let it say “at least one is on”. Which gate says that?',
        'Slot 2 is followed by a NOT. To end up with “not both”, slot 2 itself must say “both”. The last slot then needs both demands met.',
      ],
      explain: `
        **(A OR B) AND NOT (A AND B)**: at least one, but not both. That is the *exclusive or* from the last lesson,
        made from the three basic gates.
      `,
    },
    {
      id: 'xor-named',
      type: 'info',
      title: 'A fourth gate: XOR',
      text: `
        “Exactly one switch on” is wanted so often that it comes ready-made as a single gate:
        **XOR**, short for *exclusive or*.

        - **XOR**: out is 1 when **exactly one** input is 1.

        It does the job of the three-gate circuit you have just seen, *(A OR B) AND NOT (A AND B)*.

        :::key
        Four gates: **AND** needs both inputs, **OR** needs at least one,
        **XOR** needs exactly one, and **NOT** flips a single input.
        :::
      `,
      figure: {
        ...CIRCUIT_XOR,
        alt: 'Switches A and B feed a single XOR gate that drives a lamp. Its truth table reads 0, 1, 1, 0: the lamp is on when exactly one switch is on.',
      },
    },
    {
      id: 'which-gate',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        const clue = rng.pick(GATE_CLUES);
        return {
          text: `
            **Which gate fits this description?**

            ${clue.text}
          `,
          options: ['AND', 'OR', 'NOT', 'XOR'].map((g) => ({ text: g, correct: g === clue.gate })),
          explain: `${GATE_WHY[clue.gate]} The full set: AND needs both, OR needs at least one, XOR needs exactly one, and NOT flips a single input.`,
        };
      },
    },
    {
      id: 'binary',
      type: 'info',
      title: 'Counting with two digits',
      text: `
        A wire can carry only 0 or 1, so computers write numbers in **binary**, using just those two digits.
        Counting goes 0, 1, and then the ones column is already full, so you **carry**: two is written **10**
        (one two, no ones).

        | A | B | A + B | in binary |
        |:---:|:---:|:---:|:---:|
        | 0 | 0 | 0 | 00 |
        | 0 | 1 | 1 | 01 |
        | 1 | 0 | 1 | 01 |
        | 1 | 1 | 2 | **10** |

        Look at the two binary digits as two separate columns of 0s and 1s. Each is a truth table. Do you recognise them?
      `,
    },
    {
      id: 'half-adder',
      type: 'interact',
      title: 'A circuit that adds',
      text: `
        Two lamps show A + B in binary: **Carry** is the left digit (the twos), **Sum** is the right digit (the ones).

        **Choose a gate for each slot so that the lamps always show the right total.**
        The switches start at 1 + 1, which should come out as 10.
      `,
      widget: CIRCUIT_HALF_ADDER,
      check: (s) => {
        if (!s.complete) return 'Both slots need a gate first.';
        const sum = s.truth.sum.join('');
        const carry = s.truth.carry.join('');
        if (sum === '0110' && carry === '0001') return true;
        if (carry !== '0001') return 'Look at the Carry lamp. There is something to carry only for 1 + 1, when **both** switches are on.';
        if (sum === '0111') return 'Try 1 + 1. The answer is 10, so the Sum lamp (the ones digit) should be **off**, and yours is on.';
        return 'Look at the Sum lamp. It should be on for 0 + 1 and 1 + 0, and off for 0 + 0 and 1 + 1.';
      },
      solution: { gates: HALF_ADDER_SOLUTION, inputs: { A: 1, B: 1 } },
      hints: [
        'The Sum digit is 1 when exactly one switch is on. You built a gate for that a moment ago.',
        'The Carry digit is 1 only for 1 + 1, when both switches are on.',
      ],
      explain: `
        **XOR** gives the ones digit and **AND** gives the carry. This circuit is called a **half adder**,
        and with it logic has turned into arithmetic.

        Chain adders together, one stage per digit, and you can add numbers of any size.
        A phone’s processor holds billions of transistors wired up as gates, and deep down this is what they are doing.
      `,
    },
    {
      id: 'adder-recall',
      type: 'fill',
      review: true,
      text: 'A **half adder** adds two binary digits, A and B. Complete the description.',
      template: `
        The ones digit of A + B comes from an [[AND|OR|*XOR]] gate.

        The carry comes from an [[*AND|OR|XOR]] gate.

        So for 1 + 1 the lamps read carry [[1]], sum [[0]].
      `,
      explain: `
        The ones digit is 1 when exactly one input is 1: that is XOR. There is a carry only when both inputs are 1: that is AND.
        And 1 + 1 = 10 in binary: carry 1, sum 0.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend says: “Computers are good with numbers because they understand maths.”

        **What would you tell them really happens inside a chip when it works out 1 + 1?**
      `,
      model: `
        The chip understands nothing. The two 1s are just two wires that are switched on. An XOR gate sees two inputs
        that are the same and sends out 0; an AND gate sees two 1s and sends out 1. Read side by side, those outputs
        say **10**, which is two in binary. Arithmetic comes out of gates that each follow one tiny rule of logic.
      `,
    },
  ],
  recap: [
    'A logic gate turns its inputs into one output by a fixed rule: **AND** (both), **OR** (at least one), **NOT** (flip).',
    'Gates can be chained, and any circuit can be described by a truth table.',
    '**XOR** (exactly one) can be built as (A OR B) AND NOT (A AND B).',
    'XOR for the sum and AND for the carry make a **half adder**: 1 + 1 = 10 in binary.',
  ],
  next: 'Next: how to win a game before it starts, by thinking from the end.',
};
