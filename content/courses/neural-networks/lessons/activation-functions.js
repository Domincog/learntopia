// Inside Neural Networks · Lesson 1 · Bending the Line
import { r, num, linear, signed } from '../../../kit.js';
import { show, V_TARGET, BUMP_TARGET, WAVE_TARGET, wave, hingeGap } from '../helpers.js';

const WEIGHT = { min: -3, max: 3, step: 0.5 };

/** "+ 2 ReLU(x − 3)" as TeX, with tidy signs and no "1 ReLU". */
const hingeTex = (w, k) => {
  const coef = w === 1 ? '+' : w === -1 ? '-' : `${signed(w)}\\,`;
  return r`${coef} \text{ReLU}(x${k === 0 ? '' : ` ${signed(-k)}`})`;
};

const gapAt = (n) => hingeGap(wave, 0, 6, n);

export default {
  id: 'activation-functions',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A hundred layers',
      text: r`
        In *How AI Learns*, a neuron worked out a score, **weights · inputs + bias**, and then
        applied a threshold.

        Suppose you leave the threshold out: every neuron simply passes its score on to the next
        layer. Now stack a hundred layers of such neurons, with millions of weights.

        **Fed one input $x$, what can this network compute?**
      `,
      shuffle: false,
      options: [
        { text: 'Any curve at all, given enough layers' },
        { text: 'A curve with up to a hundred bends' },
        { text: r`Only a straight line: some number times $x$, plus some number`, correct: true },
      ],
      explain: `
        Only a straight line, however many layers and however many weights.

        That sounds too bad to be true, so try it on the smallest stack there is.
      `,
    },
    {
      id: 'no-bend',
      type: 'interact',
      graded: false,
      title: 'Two layers, no threshold',
      text: r`
        A small network with one input, $x$. Its two hidden units have no threshold: the first
        passes on $x$, the second passes on $x - 3$. The output neuron multiplies each by a weight
        and adds a bias of 3.

        The dashed V is the shape we would like. The left arm is already there.

        **Try to make the bend at 3.** Move both sliders, several times.
      `,
      widget: {
        type: 'relu-builder', bend: false, bias: 3, target: V_TARGET,
        hinges: [{ at: 0, weight: { ...WEIGHT, value: -1 } }, { at: 3, weight: { ...WEIGHT, value: 0 } }],
        alt: 'A dashed V-shaped target and the output of a network whose hidden units have no bend.',
      },
      check: (s) => s.tried >= 6 || 'Keep experimenting. Try a few more settings of both sliders and watch what kind of shape you get.',
      solution: { weights: [-1, 2], tried: 6 },
      explain: r`
        Whatever the weights, the result is one straight line. Its slope is simply the two weights
        added together.

        The second unit was supposed to take over at $x = 3$. Instead it tilts the **whole** line,
        the left arm included. Without a bend inside the network, there can be no bend in what
        comes out.
      `,
    },
    {
      id: 'teach-compose',
      type: 'info',
      title: 'Why it stays straight',
      text: r`
        Follow the arithmetic for one hidden unit and one output neuron, neither with a threshold.
        Each does what every neuron does to its input: multiply by a weight, then add a bias.

        :::example Two rules in a row
        The hidden unit works out $h = 6x + 1$. The output neuron works out $y = 5h - 2$.

        1. Put the first rule into the second: $\mathord{y = 5(6x + 1) - 2}$.
        2. Multiply out the bracket: $\mathord{y = 30x + 5 - 2}$.
        3. Tidy up: $\mathord{y = 30x + 3}$.
        :::

        Two "multiply, then add" rules in a row are **one** rule of the same kind, so the graph is
        still one straight line. Its slope is the two slopes multiplied: $5 \times 6 = 30$.
      `,
    },
    {
      id: 'compose',
      type: 'fill',
      title: 'Follow the arithmetic',
      text: r`
        Your turn, with another hidden unit and output neuron:

        $$ h = 2x + 1 \qquad y = 3h - 4 $$

        Put the first rule into the second: $\;y = 3(2x + 1) - 4$. **Multiply it out.**
      `,
      template: r`$y =$ [[6]] $x\; -$ [[1]]`,
      hints: [r`$3 \times 2x$ gives the $x$ part. Then $3 \times 1 - 4$ gives the plain number.`],
      explain: r`
        $3 \times 2x = 6x$, and $3 \times 1 - 4 = -1$. So $y = 6x - 1$.

        One rule again, and the two slopes have multiplied: $3 \times 2 = 6$.
      `,
    },
    {
      id: 'compose-gen',
      type: 'expr',
      review: true,
      gen: (rng) => {
        const a = rng.pick([-3, -2, 2, 3, 4, 5]);
        const b = rng.nonzero(-5, 5);
        const c = rng.pick([-3, -2, 2, 3, 4]);
        const d = rng.nonzero(-6, 6);
        const answer = linear(a * c, c * b + d);
        return {
          text: r`
            A hidden unit without any bend works out $\;h = ${linear(a, b)}$.
            The output neuron takes $h$ and works out $\;y = ${linear(c, d, 'h')}$.

            **Write $y$ in terms of $x$ alone, multiplied out.**
          `,
          prefix: '$y =$',
          answer,
          vars: ['x'],
          expanded: true,
          wrong: [
            [linear(a * c, b + d), r`The slope is right. But the $${num(b)}$ inside $h$ gets multiplied by $${num(c)}$ as well, before $${num(d)}$ is added.`],
            // with a = c = 2 adding the slopes happens to give the right slope, so that slip cannot be told apart
            ...(a + c === a * c ? [] : [[linear(a + c, c * b + d), r`The two slopes multiply, they do not add: $${num(c)} \times ${a < 0 ? `(${num(a)}x)` : `${num(a)}x`}$.`]]),
            [linear(a * c, d), r`Do not lose the $${num(b)}$ inside $h$: it contributes $${num(c)} \times ${b < 0 ? `(${num(b)})` : num(b)} = ${num(c * b)}$.`],
          ],
          hints: [
            r`Replace $h$ by $${linear(a, b)}$: $\;y = ${num(c)}(${linear(a, b)}) ${signed(d)}$.`,
            r`$${num(c)} \times ${num(a)}x = ${num(a * c)}x$, and $${num(c)} \times ${b < 0 ? `(${num(b)})` : num(b)} ${signed(d)} = ${num(c * b + d)}$.`,
          ],
          explain: r`$y = ${num(c)}(${linear(a, b)}) ${signed(d)} = ${answer}$. Still a straight line: the slopes multiplied, $${num(c)} \times ${a < 0 ? `(${num(a)})` : num(a)} = ${num(a * c)}$.`,
        };
      },
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Linear in, linear out',
      text: r`
        A rule of the kind "multiply by fixed numbers, then add" is called **linear**. Feed a linear
        rule into a linear rule and you get a linear rule. Do it a hundred times and you still
        have one.

        It is the same with many inputs. In *Linear Algebra* you saw that doing one matrix after
        another is a single matrix: their product. A layer without thresholds acts on its inputs
        as a matrix does (plus a shift for the biases), so a stack of such layers collapses into
        one layer.

        :::key
        To compute anything but straight lines and flat planes, a network needs a **bend**
        between its layers.
        :::

        The bend goes by the name **activation function**. A sharp threshold is one. It has a flaw
        you met before: it has no slope for gradient descent to follow.
      `,
    },
    {
      id: 'meet-relu',
      type: 'fill',
      title: 'The simplest bend',
      text: r`
        The bend used most in today's networks is about the simplest one possible. It is called
        **ReLU** (for *rectified linear unit*):

        $$ \text{ReLU}(\text{score}) = \max(0,\ \text{score}) $$

        A positive score passes through unchanged. Anything else becomes 0. Drag the point along
        it, then fill in the outputs.
      `,
      figure: {
        type: 'plot', x: [-4, 4], y: [-1, 4], xStep: 1, yStep: 1, xLabel: 'score', yLabel: 'output',
        fns: [{ expr: 'relu(x)', color: 'violet' }],
        points: [{ id: 'P', x: 2, on: 0, drag: 'x', snap: 0.5, color: 'orange' }],
        readouts: [{ label: 'score', expr: 'Px', digits: 1 }, { label: 'output', expr: 'f0(Px)', digits: 1, color: 'violet' }],
        alt: 'The graph of ReLU: flat at zero for negative scores, then a straight line rising at 45 degrees. A point can be dragged along it.',
      },
      template: r`
        ReLU(3) = [[3]]

        ReLU(−2) = [[0]]

        ReLU(0.5) = [[0.5]]

        ReLU(−0.1) = [[0]]
      `,
      explain: `
        A positive score comes out as it went in. Everything else comes out as 0, even a score as close as −0.1.

        Unlike the old threshold, the output for a positive score still says *how far* above 0 the score is.
      `,
    },
    {
      id: 'teach-relu-unit',
      type: 'info',
      title: 'A ReLU unit, worked out',
      text: r`
        A hidden unit with ReLU does two things. First its **score**, as for any neuron in
        *How AI Learns*: weights · inputs + bias. Then the bend: ReLU(score).

        :::example Weights 4 and −5, bias 7, inputs 2 and 6
        1. Score: $\;4 \times 2 - 5 \times 6 + 7 = 8 - 30 + 7 = -15$.
        2. Output: $\;\text{ReLU}(-15) = 0$.
        :::

        Two words for the two cases. When its score is positive, a ReLU unit is **switched on**: it
        passes the score along. Otherwise it is **switched off** and puts out 0, like the unit in the example.
        With a bias of 30 its score would be $8 - 30 + 30 = 8$: switched on, output 8.
      `,
      figure: {
        type: 'plot', x: [-4, 4], y: [-1, 4], xStep: 1, yStep: 1, xLabel: 'score', yLabel: 'output',
        fns: [{ expr: 'relu(x)', color: 'violet' }],
        labels: [{ x: -2, y: 0.6, text: 'switched off' }, { x: 1.6, y: 3.2, text: 'switched on' }],
        alt: 'The graph of ReLU. The flat part at zero, for scores that are not positive, is labelled switched off. The rising part, for positive scores, is labelled switched on.',
      },
    },
    {
      id: 'relu-neuron',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const wantOn = rng.bool();
        let w1; let w2; let b; let x1; let x2; let score;
        let guard = 0;
        do {
          w1 = rng.int(1, 3);
          w2 = rng.pick([-3, -2, -1, 1, 2]);
          b = rng.nonzero(-6, 4);
          x1 = rng.int(1, 5);
          x2 = rng.int(1, 5);
          score = w1 * x1 + w2 * x2 + b;
        } while ((score === 0 || Math.abs(score) > 12 || (score > 0) !== wantOn) && guard++ < 400);
        const on = score > 0;
        const out = Math.max(0, score);
        const sum = `${w1} × ${x1} ${w2 < 0 ? '−' : '+'} ${Math.abs(w2)} × ${x2} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`;
        return {
          text: `
            A hidden unit has weights **${show(w1)}** and **${show(w2)}** and a bias of **${show(b)}**.
            Its inputs are **${x1}** and **${x2}**. Its activation function is ReLU.

            Work out what it passes on.
          `,
          template: `score = ${sum} = [[${score}]]

            Output after ReLU: [[${out}]]

            The unit is [[${on ? '*switched on|switched off' : 'switched on|*switched off'}]].`,
          hints: ['The score is weights · inputs + bias, exactly as for any neuron. ReLU comes afterwards.'],
          explain: `The score is ${show(w1 * x1)} ${w2 * x2 < 0 ? '−' : '+'} ${Math.abs(w2 * x2)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${show(score)}. ${on ? `That is positive, so ReLU passes it on unchanged: the unit is switched on and puts out ${out}.` : 'That is not positive, so ReLU turns it into 0: the unit is switched off.'}`,
        };
      },
    },
    {
      id: 'make-v',
      type: 'interact',
      attempts: 6,
      title: 'Now with the bend',
      text: r`
        The same small network, with ReLU after each hidden unit. Each unit is now a **hinge**: flat
        until its kink, rising after it. The [first]{.blue} has its kink at $x = 0$, the
        [second]{.orange} at $x = 3$.

        The output neuron still multiplies each by a weight and adds a bias of 3.

        **Match the dashed V.**
      `,
      widget: {
        type: 'relu-builder', bias: 3, target: V_TARGET,
        hinges: [{ at: 0, weight: { ...WEIGHT, value: 0 } }, { at: 3, weight: { ...WEIGHT, value: 0 } }],
        alt: 'A dashed V-shaped target and the sum of two ReLU hinges with kinks at 0 and at 3.',
      },
      check: (s) => {
        if (s.match) return true;
        const [w1, w2] = s.weights;
        if (w1 !== -1) return `Start with the left arm. Between 0 and 3 only the first hinge is switched on, so its weight is the slope there. Yours is ${show(w1)}. The V goes down by 1 for every step to the right.`;
        if (w1 + w2 === 0) return 'The left arm is right. But the second weight now exactly cancels the first, so the sum goes flat after 3. The right arm has to climb.';
        return `The left arm is right. From 3 onwards both hinges are switched on, so the slope there is −1 plus the second weight: at the moment ${show(w1 + w2)}. The right arm of the V needs a slope of +1.`;
      },
      solution: { weights: [-1, 2] },
      hints: [
        'Left of 3, the second hinge is switched off: it contributes 0. Set the first weight so that the sum falls like the left arm.',
        'Right of 3, the slopes add: (first weight) + (second weight) must be +1.',
      ],
      explain: r`
        Weights $-1$ and $+2$. Left of 3 only the first hinge is switched on: slope $-1$.
        From 3 onwards both are: $-1 + 2 = +1$.

        The bend that was impossible a moment ago takes two units.
      `,
    },
    {
      id: 'teach-hinges',
      type: 'info',
      title: 'Each hinge adds its slope',
      text: r`
        The picture shows your V with its two hinges drawn in. The rule behind it holds for every sum of ReLU units:

        :::key
        Each hinge adds its weight to the slope, from its kink onwards. Left of its kink it is
        switched off and adds nothing.
        :::

        To get one value of such a sum, work out each ReLU first.

        :::example At x = 4
        $$ \begin{aligned} y = {} & 5 + 4\,\text{ReLU}(x - 1) \\ & - 2\,\text{ReLU}(x - 6) \end{aligned} $$

        1. First unit: $\;\text{ReLU}(4 - 1) = \text{ReLU}(3) = 3$.
        2. Second unit: $\;\text{ReLU}(4 - 6) = \text{ReLU}(-2) = 0$. Switched off.
        3. Add up: $\;y = 5 + 4 \times 3 - 2 \times 0 = 17$.
        :::
      `,
      figure: {
        type: 'relu-builder', bias: 3, target: V_TARGET, static: true, parts: true,
        hinges: [{ at: 0, weight: -1 }, { at: 3, weight: 2 }],
        alt: 'The V again, now matched: the sum of two ReLU hinges with weights −1 and 2 and a bias of 3. Each hinge’s own contribution is drawn thin: the first slopes down from 0, the second is flat until 3 and then climbs.',
      },
    },
    {
      id: 'hinge-sum',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const k1 = rng.int(0, 2);
        const k2 = k1 + rng.int(2, 3);
        const w1 = rng.nonzero(-3, 3);
        const w2 = rng.nonzero(-3, 3);
        const b = rng.pick([-2, -1, 1, 2, 3, 4]);
        // half of the time the second hinge has not been reached yet
        const x = rng.bool() ? rng.int(k1 + 1, k2 - 1) : rng.int(k2 + 1, k2 + 3);
        const r1 = Math.max(0, x - k1);
        const r2 = Math.max(0, x - k2);
        const answer = b + w1 * r1 + w2 * r2;
        const straight = b + w1 * (x - k1) + w2 * (x - k2);
        return {
          text: r`
            A network with two hidden ReLU units computes

            $$ \begin{aligned} y = {} & ${num(b)} ${hingeTex(w1, k1)} \\ & ${hingeTex(w2, k2)} \end{aligned} $$

            (ReLU turns a negative number into 0 and leaves a positive one as it is.)

            **What is $y$ when $x = ${x}$?**
          `,
          answer,
          prefix: '$y =$',
          wrong: [
            // only when the second unit is switched off does "no bend" give a different number
            ...(x < k2 ? [[straight, r`ReLU never gives a negative number. At $x = ${x}$ the second unit's score is $${x} - ${k2} = ${num(x - k2)}$, so that unit is switched off and contributes 0.`]] : []),
            ...(x < k2 && answer - b === straight ? [] : [[answer - b, r`Do not forget the bias, $${num(b)}$.`]]),
          ],
          hints: [
            r`Work out each ReLU first: $\text{ReLU}(${num(x - k1)})$ and $\text{ReLU}(${num(x - k2)})$.`,
            r`They are $${r1}$ and $${r2}$. Now multiply by the weights and add the bias.`,
          ],
          explain: r`
            $\text{ReLU}(${num(x - k1)}) = ${r1}$ and $\text{ReLU}(${num(x - k2)}) = ${r2}$${r2 === 0 ? ': the second unit is switched off' : ''}.
            So $y = ${num(b)} + ${w1 < 0 ? `(${num(w1)})` : num(w1)} \times ${r1} + ${w2 < 0 ? `(${num(w2)})` : num(w2)} \times ${r2} = ${num(answer)}$.
          `,
        };
      },
    },
    {
      id: 'make-bump',
      stretch: true,
      type: 'interact',
      attempts: 6,
      title: 'Up, down, flat',
      text: r`
        Three hinges this time, with kinks at 1, 3 and 5, and a bias of 0.

        **Build the dashed bump.** Work from left to right: each hinge changes the slope from its
        own kink onwards and leaves everything to its left alone.
      `,
      widget: {
        type: 'relu-builder', bias: 0, x: [0, 6], y: [-1, 4], target: BUMP_TARGET,
        hinges: [1, 3, 5].map((at) => ({ at, weight: { ...WEIGHT, value: 0 } })),
        alt: 'A dashed target in the shape of a tent: flat at zero, rising from 1 to a peak of 2 at 3, falling back to zero at 5, then flat. Three ReLU hinges with kinks at 1, 3 and 5 can be weighted to match it.',
      },
      check: (s) => {
        if (s.match) return true;
        const slope = (from) => s.pieces.find((p) => p.from === from).slope;
        if (slope(1) !== 1) return `Start on the left. Between 1 and 3 only the first hinge is switched on, so its weight is the slope there: now ${show(slope(1))}. The bump climbs by 1 per step.`;
        if (slope(3) !== -1) return `The climb is right. From 3 onwards the slope is the first two weights added together: now ${show(slope(3))}. The bump comes down by 1 per step, so the second weight has to turn +1 into −1.`;
        return `Up and down are right. After 5 the bump should be flat, but your slope there is ${show(slope(5))}. All three weights together must add up to 0.`;
      },
      solution: { weights: [1, -2, 1] },
      hints: [
        'First weight: the slope between 1 and 3 should be +1.',
        'Second weight: +1 plus what gives −1?',
        'Third weight: it has to cancel the −1 that is left.',
      ],
      explain: r`
        Weights $+1$, $-2$, $+1$. The slopes, piece by piece: $+1$, then $1 - 2 = -1$, then
        $-1 + 1 = 0$.

        A bump is a useful building block. Place many narrow bumps of different heights side by
        side, and their sum can follow almost any curve.
      `,
    },
    {
      id: 'more-hinges',
      type: 'interact',
      title: 'More hinges, closer fit',
      text: `
        Now a smooth target, with no straight piece anywhere. This time the weights are set for you:
        the sum is made to touch the curve at every kink.

        You choose only **how many hinges** there are.

        **Add hinges until the largest gap between the two curves is below 0.1.**
      `,
      widget: {
        type: 'relu-builder', x: [0, 6], y: [-1, 5], target: WAVE_TARGET, auto: { min: 1, max: 16, value: 2 },
        alt: 'A smooth wavy dashed target and a sum of equally spaced ReLU hinges that touches it at every kink. A slider sets the number of hinges.',
      },
      check: (s) => {
        if (s.gap < 0.1) return true;
        return `With ${s.n} ${s.n === 1 ? 'hinge' : 'hinges'} the largest gap is still ${show(s.gap)}. Add more.`;
      },
      solution: { n: 12 },
      explain: `
        With 2 hinges the largest gap was ${show(gapAt(2))}. With 4 it is ${show(gapAt(4))}, with 8 it is ${show(gapAt(8))},
        and with 16 only ${show(gapAt(16))}. Straight pieces, if there are enough of them, hug a curve as tightly as you like.

        That is the idea behind the **universal approximation theorem** (first proved in 1989 for smooth, S-shaped bends, and later
        extended to ReLU): with enough hidden units, a network with a single hidden layer can come as close as you like to any
        continuous curve over a limited range of inputs.

        Notice what it does not promise: how many units that takes, or that training will find the right weights.
      `,
    },
    {
      id: 'sigmoid',
      type: 'fill',
      title: 'A smooth bend',
      text: r`
        ReLU is not the only activation function. The **sigmoid** squashes any score smoothly into
        the range between 0 and 1:

        $$ \text{sigmoid}(\text{score}) = \frac{1}{1 + e^{-\text{score}}} $$

        Here $e \approx 2.718$ is a fixed number (more in the next lesson). For a score of 2,
        $e^{-2} \approx 0.135$, so the output is $1 \div 1.135 \approx 0.88$: the point in the
        picture. You met this curve in *How AI Learns*, in neurons that "switch on gradually".
        Drag the point and read the outputs.
      `,
      figure: {
        type: 'plot', x: [-8, 8], y: [-0.25, 1.25], xStep: 2, yStep: 0.5, xLabel: 'score', yLabel: 'output',
        fns: [{ expr: 'sigmoid(x)', color: 'violet' }],
        hlines: [{ y: 1, dashed: true, color: 'gray' }],
        points: [{ id: 'P', x: 2, on: 0, drag: 'x', snap: 1, color: 'orange' }],
        readouts: [{ label: 'score', expr: 'Px', digits: 0 }, { label: 'output', expr: 'f0(Px)', digits: 4, color: 'violet' }],
        alt: 'The sigmoid curve: close to 0 for very negative scores, 0.5 at a score of 0, close to 1 for large scores. A point can be dragged along it.',
      },
      template: `
        A score of 0 gives exactly [[0.5]].

        Large positive scores give outputs just below [[1]].

        Large negative scores give outputs just above [[0]].
      `,
      explain: `
        Whatever goes in, something between 0 and 1 comes out. That makes the sigmoid the usual choice
        where a network has to put out a **probability** for a yes-or-no question: “how likely is it that this mango is ripe?”

        Inside deep networks ReLU and its close relatives are more common. They are cheaper to compute,
        and for large scores their slope does not fade away as the sigmoid's does.
      `,
    },
    {
      id: 'which-bend',
      type: 'bucket',
      review: true,
      text: 'Three ways for a hidden unit to treat its score. **Which one does each statement describe?**',
      buckets: ['No bend: pass the score on', 'ReLU', 'Sigmoid'],
      items: [
        { text: 'Layers of these collapse into a single layer', bucket: 0, why: 'Linear after linear is linear: without a bend, a stack of layers computes nothing that one layer could not.' },
        { text: 'A score of −4 comes out as −4', bucket: 0, why: 'ReLU would give 0 and the sigmoid a number just above 0. Only a unit without a bend passes a negative score on.' },
        { text: 'A score of −4 comes out as exactly 0', bucket: 1, why: 'max(0, −4) = 0: the unit is switched off. The sigmoid comes close to 0 but never reaches it.' },
        { text: 'A score of 7 comes out as 7, and a score of −7 as 0', bucket: 1, why: 'That is max(0, score): positive scores pass, everything else becomes 0.' },
        { text: 'Sums of these make shapes out of straight pieces', bucket: 1, why: 'Each ReLU unit is a hinge: flat, then straight. Adding hinges gives straight pieces joined at kinks.' },
        { text: 'The output always lies between 0 and 1', bucket: 2, why: 'The sigmoid squashes every score into that range, which is why it is used for probabilities.' },
        { text: 'A score of 0 comes out as 0.5', bucket: 2, why: 'sigmoid(0) = 1 ÷ (1 + 1) = 0.5. ReLU and “no bend” both give 0.' },
      ],
      explain: 'No bend: the score goes through untouched, and depth buys nothing. ReLU: max(0, score), a hinge. Sigmoid: a smooth squeeze into the range from 0 to 1.',
    },
  ],
  recap: [
    'Linear after linear is linear: without a bend between layers, any stack of layers computes only what a single layer could.',
    'The bend is called an **activation function**. The most common is **ReLU**, max(0, score): a unit is switched on when its score is positive, and puts out 0 otherwise.',
    'A ReLU unit is a hinge. Each hinge adds its weight to the slope from its kink onwards, so sums of hinges build shapes from straight pieces, and enough of them follow any continuous curve closely over a limited range of inputs.',
    'The **sigmoid** squashes a score smoothly into the range 0 to 1. It is used where an output has to be a probability.',
  ],
  next: 'Next: a network that has to choose between several answers. How do raw scores become probabilities, and how wrong is a wrong guess?',
};
