// Inside Neural Networks · Lesson 3 · Passing the Blame Backwards
import { r, num } from '../../../kit.js';
import { show, par, roundTo, NET, EXAMPLE_NET, netForward, netBackward, netAfterSteps, netFigure } from '../helpers.js';

const F = netForward();      // zA 2, hA 2, zB −1, hB 0, y 3, L 1
const G = netBackward();     // gy 2, gc 2, gv1 4, gv2 0, ghA 4, ghB 6, gzA 4, gzB 0, gwA1 8, gwA2 4, gbA 4, B's all 0
// The worked examples on the teaching screens use a second network, so that none of their numbers is an answer.
const EF = netForward(EXAMPLE_NET);    // zA 4, hA 4, zB −2, hB 0, y 7, L 4
const EG = netBackward(EXAMPLE_NET);   // gy −4, gc −4, gv1 −16, gv2 0, ghA −8, ghB −20, gzA −8, gzB 0, gwA1 −24
const exampleFigure = (given, alt) => ({ type: 'backprop-net', ...EXAMPLE_NET, given, static: true, alt });
const RATE = 0.005;
const lossAfter = (n) => netForward(netAfterSteps(n, RATE)).L;
const STEPS_NEEDED = (() => { let n = 0; while (lossAfter(n) >= 0.01) n += 1; return n; })();

/** The check shared by the three fill-the-network steps. */
const allFilled = (total) => (s) => {
  if (s.done) return true;
  if (s.filled.length === 0 && s.mistakes === 0) return 'Type the number that is asked for into the box under the picture, then press Enter.';
  return `${s.filled.length} of ${total} filled in. The blank being asked for is marked in yellow in the picture.`;
};

export default {
  id: 'backpropagation',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A million questions',
      text: `
        A network has a million weights, and its loss is too high. Before gradient descent can take a
        step, the same question has to be answered for **every** weight: *if this weight goes up a
        little, does the loss go up or down, and how fast?*

        The obvious way is to nudge one weight, run the whole network again and see what the loss
        did. Then the next weight. And the next.

        **A cleverer method answers all million questions together. How many passes through the network does it need?**
      `,
      shuffle: false,
      options: [
        { text: 'Two: one forwards and one backwards', correct: true },
        { text: 'About a thousand: one for each layer of weights' },
        { text: 'About a million: there is no way round one run per weight' },
      ],
      explain: `
        Two. The obvious way would cost a million runs for a single step of gradient descent,
        and training takes millions of steps.

        The method is called **backpropagation**. It rests on one small idea about rates, which you can find for yourself.
      `,
    },
    {
      id: 'teach-rate',
      type: 'info',
      title: 'How fast does it change?',
      text: r`
        "If this goes up a little, how fast does that change?" The answer to such a question is a
        number, called a **rate**.

        :::example A link that works out y = 5 × w
        1. At $w = 2$ the result is $y = 10$.
        2. Nudge $w$ up by 0.1, to 2.1. Now $y = 10.5$: it changed by 0.5.
        3. Rate: $\;0.5 \div 0.1 = 5$. "$y$ moves 5 times as fast as $w$."
        :::

        A rate is **the change in the result, divided by the small nudge that caused it**. Knowing
        it, you can say what any small nudge does: nudge × rate. A nudge of 0.02 moves $y$ by
        $0.02 \times 5 = 0.1$.

        A negative rate means "moves the other way": if $y = -5 \times w$, raising $w$ lowers $y$.
      `,
    },
    {
      id: 'chain-explore',
      type: 'fill',
      title: 'A chain of two links',
      text: r`
        The smallest chain inside a network. A weight $w$ multiplies an input of 3, giving a hidden
        value $h = 3 \times w$. An output weight of 2 then gives $y = 2 \times h$.

        **Drag $w$** and watch the other two move. The label on each link says how fast the lower
        value moves compared with the upper one.
      `,
      figure: {
        type: 'rate-chain', inner: '3*x', outer: '2*u', x: [0, 4], u: [0, 12], y: [0, 24], start: 1, snap: 0.5,
        names: ['weight', 'hidden value', 'output'], symbols: ['w', 'h', 'y'], units: ['', '', ''],
        rates: ['h per w', 'y per h', 'y per w'], show: ['inner', 'outer'],
        alt: 'Three tracks, one each for the weight w, the hidden value h and the output y. Moving w moves h three times as far, and h moves y twice as far.',
      },
      template: r`
        When $w$ goes up by 1, $h$ goes up by [[3]].

        When $h$ goes up by 1, $y$ goes up by [[2]].

        So when $w$ goes up by 1, $y$ goes up by [[6]].
      `,
      hints: ['Move $w$ from 1 to 2 and read off $y$ before and after.'],
      explain: r`
        Move $w$ from 1 to 2: $h$ goes from 3 to 6, and $y$ from 6 to 12. That is $+6$ for $y$, and $6 = 3 \times 2$.

        The two rates have **multiplied**.
      `,
    },
    {
      id: 'name-chain',
      type: 'info',
      title: 'Rates multiply along a chain',
      text: r`
        :::key
        When one number drives a second, and the second drives a third, the rates multiply.
        :::

        If $h$ moves 3 times as fast as $w$, and $y$ moves 2 times as fast as $h$, then $y$ moves
        $3 \times 2 = 6$ times as fast as $w$. With three links you multiply three rates, and so on
        down any chain. Mathematicians call this the **chain rule**.

        :::example Three links, with rates 7, −1 and 3
        1. The rate of the whole chain: $\;7 \times (-1) \times 3 = -21$.
        2. Nudge the first number up by 0.1, and the last one changes by $0.1 \times (-21) = -2.1$. It falls.
        :::

        A negative rate still means "moves the other way". The rule is the same: multiply, signs included.
      `,
    },
    {
      id: 'chain-gen',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const a = rng.int(2, 5);
        const b = rng.pick([-3, -2, 2, 3, 4]);
        const c = rng.pick([-4, -2, 2, 4, 6]);
        const rate = a * b * c;
        const answer = roundTo(rate * 0.1, 2);
        return {
          text: r`
            Inside a network, a weight $w$ is the first link of a chain:

            | Raise this by 1 … | … and this changes by |
            |---|:-:|
            | the weight $w$ | the score $z$: $${num(a)}$ |
            | the score $z$ | the output $y$: $${num(b)}$ |
            | the output $y$ | the loss: $${num(c)}$ |

            **The weight goes up by 0.1. By how much does the loss change?** (Negative if the loss falls.)
          `,
          answer,
          tolerance: 0.001,
          wrong: [
            [rate, r`$${num(rate)}$ is the rate: the change in the loss for each whole unit of $w$. The weight only moved by 0.1.`],
            [roundTo((a + b + c) * 0.1, 2), 'Rates along a chain multiply. They do not add.'],
            [-answer, 'Check the sign: multiply the three rates with their signs.'],
          ],
          hints: [
            r`First the rate of the whole chain: $${num(a)} \times ${par(b)} \times ${par(c)}$.`,
            r`That is $${num(rate)}$ per unit of $w$. Now scale it to a nudge of 0.1.`,
          ],
          explain: r`The rates multiply: $${num(a)} \times ${par(b)} \times ${par(c)} = ${num(rate)}$. So the loss changes $${num(rate)}$ times as fast as $w$, and a nudge of 0.1 changes it by $0.1 \times ${par(rate)} = ${num(answer)}$.`,
        };
      },
    },
    {
      id: 'square-rate',
      type: 'fill',
      title: 'The last link',
      text: r`
        One link is not a plain multiplication: the one from the output to the loss. As in
        *How AI Learns*, the loss here is the squared miss, $(y - \text{target})^2$. Take a target of 2,
        and nudge $y$ by 0.01:

        | $y$ | loss | $y$ nudged | loss then | change |
        |:-:|:-:|:-:|:-:|:-:|
        | 3 | 1 | 3.01 | 1.0201 | 0.0201 |
        | 5 | 9 | 5.01 | 9.0601 | 0.0601 |

        **How fast does the loss change, compared with $y$?** Round to whole numbers.
      `,
      template: r`
        At $y = 3$: about [[2]] times as fast.

        At $y = 5$: about [[6]] times as fast.

        Both times that is [[2]] $\times\ (y - \text{target})$.
      `,
      tolerance: 0.02,
      hints: ['A rate is the change in the result divided by the nudge: 0.0201 ÷ 0.01, for instance.'],
      explain: r`
        $0.0201 \div 0.01 \approx 2$ and $0.0601 \div 0.01 \approx 6$. The misses were 1 and 3, so each
        rate is **twice the miss**: $2 \times (y - \text{target})$.

        The further the output is from its target, the faster the loss reacts to it. (For a smaller
        nudge the match gets ever closer to exact.)
      `,
    },
    {
      id: 'teach-forward',
      type: 'info',
      title: 'A forward pass, worked out',
      text: r`
        Now a whole network, small enough to do by hand: two inputs, two hidden **ReLU** units
        ([A]{.violet} and [B]{.teal}) and one output. The number on each connection is its weight.
        Working out every value, from the inputs to the loss, is a **forward pass**.

        :::example The network in the picture
        1. **A:** its score is $1 \times 3 + 2 \times 1 - 1 = ${num(EF.zA)}$. Positive, so A is switched on and passes on ${num(EF.hA)}.
        2. **B:** its score is $-1 \times 3 + 1 \times 1 + 0 = ${num(EF.zB)}$. Not positive, so B is switched off and passes on 0.
        3. **Output:** $y = 2 \times ${num(EF.hA)} + 5 \times ${num(EF.hB)} - 1 = ${num(EF.y)}$. The output has no bend.
        4. **Loss:** the squared miss, $(${num(EF.y)} - ${num(EXAMPLE_NET.target)})^2 = ${num(EF.L)}$.
        :::

        A score is weights · inputs + bias, and a hidden unit passes on ReLU(score) = max(0, score),
        as in "Bending the Line".
      `,
      figure: exampleFigure('forward', 'A network diagram. Inputs x1 = 3 and x2 = 1 feed hidden units A and B. A has a score of 4 and passes on 4; B has a score of −2 and passes on 0. The output y is 7, the target is 9 and the loss is 4.'),
    },
    {
      id: 'forward',
      type: 'interact',
      auto: true,
      attempts: 5,
      title: 'Forwards first',
      text: r`
        A network of the same shape, with other numbers.

        A score is weights · inputs + bias, as always. A hidden unit passes on ReLU(score).
        The output $y$ has no bend. The loss is $(y - \text{target})^2$.

        **Run the network forwards.** Type each number that is asked for and press Enter.
      `,
      widget: netFigure({
        ask: ['zA', 'hA', 'zB', 'hB', 'y', 'L'],
        slips: {
          zA: [[3, 'Do not forget the bias: 1 × 2 + 1 × 1 is 3, and then the bias of −1 is added.']],
          zB: [[5, 'Mind the sign: the weight on x₂ is −3, so that term is −3 × 1 = −3.'], [-3, 'That is only the x₂ term. Add 1 × 2 for x₁ (the bias is 0).']],
          hB: [[-1, 'ReLU never passes a negative number on: max(0, −1) = 0. B is switched off.']],
          y: [[4, 'Do not forget the output bias of −1.'], [0, 'B puts out 0, not −1, so its term is 3 × 0.']],
        },
        alt: 'A network diagram. Inputs x1 = 2 and x2 = 1 feed hidden units A and B. Their outputs feed the output y, which is compared with a target of 2.',
      }),
      check: allFilled(6),
      solution: { done: true },
      explain: r`
        **A:** $1 \times 2 + 1 \times 1 - 1 = ${num(F.zA)}$. Positive, so A is switched on and passes on ${num(F.hA)}.

        **B:** $1 \times 2 - 3 \times 1 + 0 = ${num(F.zB)}$. Not positive, so B is switched off and passes on 0.

        **Output:** $y = 2 \times ${num(F.hA)} + 3 \times ${num(F.hB)} - 1 = ${num(F.y)}$, and the loss is $(${num(F.y)} - ${num(NET.target)})^2 = ${num(F.L)}$.
      `,
    },
    {
      id: 'teach-backward',
      type: 'info',
      title: 'Backwards from the loss',
      text: r`
        Now turn round. For every number in the network we want its **gradient**: the rate at which
        the loss changes when that number goes up a little. For a weight, that is the slope
        gradient descent needs. The chain rule gives the gradients one link at a time, starting
        at the loss. They are the [orange]{.orange} badges.

        :::example The example network: y = 7, target 9
        1. **At $y$:** the last link has the rate $2 \times (y - \text{target}) = 2 \times (${num(EF.y)} - ${num(EXAMPLE_NET.target)}) = ${num(EG.gy)}$. Raising $y$ would lower the loss.
        2. **Output bias:** raise it by 1 and $y$ rises by 1. Gradient: $\mathord{${num(EG.gy)} \times 1 = ${num(EG.gc)}}$.
        3. **Weight A → $y$:** it multiplies A's output, ${num(EF.hA)}. Raise it by 1 and $y$ rises by ${num(EF.hA)}. Gradient: $\mathord{${num(EG.gy)} \times ${num(EF.hA)} = ${num(EG.gv1)}}$.
        4. **Weight B → $y$:** it multiplies B's output, 0. Gradient: $\mathord{${num(EG.gy)} \times 0 = 0}$.
        :::
      `,
      figure: exampleFigure(['forward', 'gy', 'gc', 'gv1', 'gv2'], 'The example network with its forward values and four orange gradient badges at the output: −4 at y, −4 at the output bias, −16 on the connection from A and 0 on the connection from B.'),
    },
    {
      id: 'backward-top',
      type: 'interact',
      auto: true,
      attempts: 5,
      title: 'Now backwards',
      text: r`
        Your network again, with its forward values filled in. Walk back from the loss in the same way.

        - **At $y$:** the last link. $2 \times (y - \text{target})$.
        - **One link further back:** multiply by the rate of that link. Raise the output bias by 1 and
          $y$ rises by 1. Raise the weight on A → $y$ by 1 and $y$ rises by A's output.

        **Fill in the four gradients at the output.**
      `,
      widget: netFigure({
        given: 'forward', ask: ['gy', 'gc', 'gv1', 'gv2'],
        slips: {
          gy: [[1, 'That is the miss, y − target. The loss is the miss squared, and it changes 2 × the miss as fast as y.']],
          gv1: [[2, 'That is the gradient at y. This weight multiplies A’s output, which is 2, so the gradient is 2 × 2.']],
          gv2: [[6, 'That would be the gradient at y times the weight. A weight’s own gradient is the gradient at y times what the weight multiplies: B’s output, 0.'], [2, 'This weight multiplies B’s output, and B put out 0. So the gradient is 2 × 0.']],
        },
        alt: 'The network with all its forward values filled in. Four orange blanks sit at the output: at y, at the output bias and on the two connections into y.',
      }),
      check: allFilled(4),
      solution: { done: true },
      explain: r`
        At $y$: $2 \times (${num(F.y)} - ${num(NET.target)}) = ${num(G.gy)}$. The bias: $${num(G.gy)} \times 1 = ${num(G.gc)}$.
        The weight on A → $y$: $${num(G.gy)} \times ${num(F.hA)} = ${num(G.gv1)}$.

        The weight on B → $y$: $${num(G.gy)} \times ${num(F.hB)} = ${num(G.gv2)}$. B put out 0, so right now it makes no
        difference what that output is multiplied by.
      `,
    },
    {
      id: 'teach-backward-hidden',
      type: 'info',
      title: 'Back through a hidden unit',
      text: r`
        Keep walking back. Every further link is one more multiplication.

        :::example The example network: from y (gradient −4) to the hidden units
        1. **A's output** reaches $y$ through a weight of 2: raise it by 1 and $y$ rises by 2. Gradient: $\mathord{${num(EG.gy)} \times 2 = ${num(EG.ghA)}}$.
        2. **B's output** reaches $y$ through a weight of 5. Gradient: $\mathord{${num(EG.gy)} \times 5 = ${num(EG.ghB)}}$.
        3. **A's score:** A is switched on, so a nudge to its score passes straight on. Gradient: $\mathord{${num(EG.ghA)} \times 1 = ${num(EG.gzA)}}$.
        4. **B's score:** B is switched off. Nudge its score from −2 to −1.99: still 0 out. Gradient: $\mathord{${num(EG.ghB)} \times 0 = 0}$.
        :::

        :::key
        A ReLU unit that is switched on passes the gradient back unchanged.
        **A unit that is switched off passes no gradient back.**
        :::
      `,
      figure: exampleFigure(['forward', 'gy', 'gc', 'gv1', 'gv2', 'ghA', 'ghB', 'gzA', 'gzB'], 'The example network with four more gradient badges on the hidden units: −8 at A’s output and at A’s score, −20 at B’s output and 0 at B’s score.'),
    },
    {
      id: 'backward-hidden',
      type: 'interact',
      auto: true,
      attempts: 5,
      title: 'Back through the ReLU',
      text: r`
        Now the hidden units of your network.

        - **At a hidden output:** raise it by 1 and $y$ rises by the weight on its connection. So:
          gradient at $y$ × that weight.
        - **At a hidden score**, through the ReLU: × 1 for a unit that is switched on, × 0 for a
          unit that is switched off.

        **Fill in the four gradients.**
      `,
      widget: netFigure({
        given: ['forward', 'gy', 'gc', 'gv1', 'gv2'], ask: ['ghA', 'ghB', 'gzA', 'gzB'],
        slips: {
          ghA: [[2, 'That is the gradient at y. A’s output reaches y through a weight of 2, so the gradient is 2 × 2.']],
          ghB: [[0, 'Not zero yet. If B’s output rose, y would rise 3 times as fast, so the gradient here is 2 × 3. The zero comes one step further back.'], [2, 'B’s output reaches y through a weight of 3, so the gradient is 2 × 3.']],
          gzB: [[6, 'B is switched off: its score is −1, and a small nudge leaves its output at 0. So the ReLU passes back 6 × 0.']],
        },
        alt: 'The network with forward values and the four output gradients. Four orange blanks sit on the hidden units: one at each output and one at each score.',
      }),
      check: allFilled(4),
      solution: { done: true },
      explain: r`
        Hidden outputs: A gets $${num(G.gy)} \times 2 = ${num(G.ghA)}$ and B gets $${num(G.gy)} \times 3 = ${num(G.ghB)}$.

        Through the ReLU: A is switched on, so $${num(G.ghA)} \times 1 = ${num(G.gzA)}$ arrives at its score.
        B is switched off, so $${num(G.ghB)} \times 0 = ${num(G.gzB)}$.

        Nudge B's score from −1 to −0.99 and it still puts out 0: the loss cannot feel the nudge.
      `,
    },
    {
      id: 'backward-weights',
      type: 'interact',
      auto: true,
      attempts: 5,
      title: 'The first layer of weights',
      text: r`
        The last step back. A weight into a hidden unit multiplies one input, so raising the weight
        by 1 raises that unit's score by **the input**:

        gradient of the weight = gradient at the score × the input it multiplies.

        In the example network, A's score had a gradient of ${num(EG.gzA)}, and the weight on $x_1$ multiplied an
        input of ${EXAMPLE_NET.x[0]}: its gradient is $${num(EG.gzA)} \times ${EXAMPLE_NET.x[0]} = ${num(EG.gwA1)}$.

        A bias adds straight into the score, so its gradient equals the gradient at the score.

        **Fill in the last four.**
      `,
      widget: netFigure({
        given: ['forward', 'gy', 'gc', 'gv1', 'gv2', 'ghA', 'ghB', 'gzA', 'gzB'], ask: ['gwA1', 'gwA2', 'gbA', 'gwB1'],
        slips: {
          gwA1: [[4, 'That is the gradient at A’s score. This weight multiplies x₁, which is 2, so the gradient is 4 × 2.']],
          gwA2: [[8, 'This weight multiplies x₂, which is 1, not x₁. So: 4 × 1.']],
          gwB1: [[12, 'Start from the gradient at B’s score, which is 0 because B is switched off. 0 × 2 = 0.'], [6, 'Start from the gradient at B’s score, which is 0 because B is switched off. 0 × 2 = 0.']],
        },
        alt: 'The network with every gradient found so far. Four orange blanks remain: on the two connections into A, at A’s bias, and on the connection from x1 to B.',
      }),
      check: allFilled(4),
      solution: { done: true },
      explain: r`
        Into A: $${num(G.gzA)} \times 2 = ${num(G.gwA1)}$ for the weight on $x_1$, $\;${num(G.gzA)} \times 1 = ${num(G.gwA2)}$ for the
        weight on $x_2$, and ${num(G.gbA)} for the bias. Into B: $0 \times 2 = 0$, and the same for its other weight and its bias.

        Every one of the nine weights now has its gradient. Each cost one multiplication, using a
        number that was already there.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Backpropagation',
      text: `
        You have just done **backpropagation** by hand.

        1. **Forward pass:** work out every value, from the inputs to the loss.
        2. **Backward pass:** start with the gradient at the output and walk back. At every link, multiply by that link's rate.

        The result is one number per weight, its **gradient**: positive means that raising the weight
        raises the loss, negative means the opposite, and the size says how strongly. Together they
        are exactly the slopes that gradient descent needs.

        Two passes, whether the network has nine weights or billions. The method became widely known through a 1986 paper by
        David Rumelhart, Geoffrey Hinton and Ronald Williams, although the idea had been found
        several times before. Nobody does it by hand: software records the forward pass and runs the
        backward pass by itself, which is called **automatic differentiation**.
      `,
      figure: netFigure({ given: 'all', static: true, alt: 'The network with every forward value and every gradient filled in. The gradients of B’s two weights and of its bias are zero.' }),
    },
    {
      id: 'nudge-check',
      type: 'fill',
      title: 'Check it the slow way',
      text: r`
        Do not take the backward pass on trust. Test a gradient the obvious way: nudge one weight by
        0.01, run the network again, and see what the loss did.

        **Press the buttons and read off the change in the loss.** Give 2 decimal places.
      `,
      figure: netFigure({
        given: 'all', nudge: { weights: ['wA1', 'wB1'], by: 0.01 },
        alt: 'The network with all values and gradients. Buttons nudge the weight from x1 to A, or the weight from x1 to B, by 0.01, and readouts show the loss before and after.',
      }),
      template: r`
        Nudging the weight $x_1 \to$ A by 0.01 changes the loss by about [[${num(roundTo(0.01 * G.gwA1, 2))}]].

        Backpropagation predicted $0.01 \times$ [[${num(G.gwA1)}]].

        Nudging the weight $x_1 \to$ B by 0.01 changes the loss by [[0]].
      `,
      tolerance: 0.005,
      hints: ['The readout “change” is the loss after the nudge minus the loss before.', 'The gradient of the weight x₁ → A is its orange badge.'],
      explain: r`
        The loss moves from 1 to 1.0816: a change of about 0.08, just as $0.01 \times ${num(G.gwA1)}$ says. (The small extra,
        0.0016, shrinks away as the nudge gets smaller.) The weight into B changes nothing at all: B stays switched off.

        This check costs one run of the network **per weight**. Backpropagation gave all nine answers in one backward pass.
      `,
    },
    {
      id: 'descend',
      type: 'interact',
      attempts: 6,
      title: 'Use the gradients',
      text: r`
        Now hand the gradients to gradient descent, as in *How AI Learns*:

        $$ \begin{aligned} & \text{new weight} = \text{old weight} \\ & \quad - ${num(RATE)} \times \text{gradient} \end{aligned} $$

        Each press moves all nine weights at once, then runs the forward and backward pass again.

        **Take steps until the loss is below 0.01.** Keep an eye on B's weights.
      `,
      widget: netFigure({
        given: 'all', train: { rate: RATE },
        alt: 'The network with all values and gradients, and a button that takes one step of gradient descent on all nine weights.',
      }),
      check: (s) => {
        if (s.loss < 0.01) return true;
        if (s.steps === 0) return 'Press “Take one step” and watch the loss.';
        return `After ${s.steps} ${s.steps === 1 ? 'step' : 'steps'} the loss is ${show(s.loss, 4)}. Keep going.`;
      },
      solution: { steps: STEPS_NEEDED },
      explain: r`
        The loss falls from 1 to ${show(lossAfter(1), 2)}, ${show(lossAfter(2), 2)}, ${show(lossAfter(3), 2)} … and after ${STEPS_NEEDED} steps it is below 0.01.
        As $y$ closes in on its target, every gradient shrinks, and so do the steps.

        B's three weights never moved: their gradients were 0 all along. A unit that is switched
        off learns nothing from this example. On other inputs it may be switched on, and then it learns too.
      `,
    },
    {
      id: 'one-weight',
      stretch: true,
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const on = rng.bool(0.6);
        const g = rng.pick([-4, -2, 2, 4, 6]);
        const v = rng.pick([-3, -2, 2, 3]);
        const x = rng.int(2, 4);
        const z = on ? rng.int(1, 5) : -rng.int(1, 5);
        const through = g * v * x;
        const answer = on ? through : 0;
        return {
          text: r`
            Part of a network, in the middle of a backward pass:

            - An input of **${x}** reaches a hidden ReLU unit through a weight $w$.
            - The unit's score is **${show(z)}**.
            - The unit's output reaches $y$ through a weight of **${show(v)}**.
            - The gradient at $y$ has already been found: **${show(g)}**.

            **What is the gradient of the weight $w$?**
          `,
          answer,
          wrong: [
            ...(on ? [] : [[through, `That would be right if the unit were switched on. Its score is ${show(z)}, which is not positive: the ReLU passes no gradient back.`]]),
            ...(on ? [[g * v, `That is the gradient at the unit's score. The weight multiplies an input of ${x}, so there is one more factor.`]] : []),
            ...(on ? [[g * x, `The unit's output reaches $y$ through a weight of ${show(v)}. That link is part of the chain too.`]] : []),
          ],
          hints: [
            'Walk back from $y$: first to the unit’s output (× the weight on that connection), then through the ReLU (× 1 or × 0), then to the weight (× its input).',
            `Is the unit switched on? Its score is ${show(z)}.`,
          ],
          explain: on
            ? r`The score is positive, so the unit is switched on. Walk back: $${num(g)} \times ${par(v)} = ${num(g * v)}$ at the unit's output, $\times 1$ through the ReLU, $\times ${x}$ for the input: $${num(answer)}$.`
            : r`The score, ${show(z)}, is not positive: the unit is switched off, and its ReLU passes back $${num(g * v)} \times 0 = 0$. So the gradient of $w$ is 0, whatever the other numbers are.`,
        };
      },
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are true of **backpropagation**?',
      options: [
        { text: 'It gives every weight a gradient: how fast the loss changes when that weight goes up a little', correct: true },
        { text: 'It works backwards from the loss, multiplying rates link by link', correct: true },
        { text: 'A ReLU unit that is switched off passes no gradient back to its incoming weights', correct: true },
        { text: 'It needs one run of the network for each weight', why: 'That is the slow nudge-and-rerun method. Backpropagation gets all the gradients from one forward and one backward pass.' },
        { text: 'It changes the weights so that the loss goes down', why: 'Backpropagation only works out the gradients. Changing the weights is gradient descent’s job, and it uses those gradients.' },
      ],
      explain: 'Backpropagation is bookkeeping for the chain rule: one forward pass for the values, one backward pass for the gradients. Gradient descent then moves each weight a small step against its gradient.',
    },
  ],
  recap: [
    'Rates multiply along a chain (the **chain rule**): if one number drives another, which drives a third, multiply the two rates.',
    '**Backpropagation**: one forward pass for every value, then one backward pass that multiplies rates link by link, from the loss back to every weight.',
    'The result is a **gradient** for each weight: which way the loss moves when the weight rises, and how fast. Gradient descent uses exactly these numbers.',
    'A ReLU unit that is switched off passes no gradient back, so its weights do not learn from that example.',
  ],
  next: 'Next: gradients for one example are only the beginning. How is a network trained on a whole data set, and how do you tell whether the training is going well?',
};
