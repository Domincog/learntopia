// Calculus II: The Toolkit · Lesson 5 · Equations About Change
import { r, num } from '../../../kit.js';
import { coef, cx, bracketNeg } from '../helpers.js';

/** dy/dt = 0.5y: growth in proportion to size. */
const GROWTH = { type: 'slope-field', rule: '0.5*y', t: [0, 6], y: [0, 10], tStep: 1, yStep: 2, grid: [0.5, 1], tLabel: 't', yLabel: 'y' };

/** Newton's law of cooling for a drink in a room at 20 °C, with time in minutes. */
const COOLING = {
  type: 'slope-field', rule: '-0.05*(y - 20)', t: [0, 60], y: [0, 100], tStep: 10, yStep: 20, grid: [5, 10], tLabel: 'minutes', yLabel: '°C',
  hlines: [{ y: 20, label: 'room: 20 °C', color: 'green' }],
};

/** Rules simple enough to step along by hand, with start heights that keep the numbers short. */
const HAND_RULES = [
  { tex: 't + y', f: (t, y) => t + y, starts: [1, 2, 3] },
  { tex: 'y - t', f: (t, y) => y - t, starts: [2, 3, 4] },
  { tex: '2y', f: (t, y) => 2 * y, starts: [1, 2, 3] },
  { tex: '0.5y', f: (t, y) => 0.5 * y, starts: [2, 4, 6] },
  { tex: '4 - y', f: (t, y) => 4 - y, starts: [0, 1, 2] },
];
const tidy = (v) => Math.round(v * 1e6) / 1e6;

const WARM = ['A mug of tea', 'A bowl of soup', 'A freshly baked loaf of bread'];
const COLD = ['A glass of cold milk', 'A bottle of cold water'];

export default {
  id: 'differential-equations',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A cup of coffee',
      text: `
        A cup of coffee at **90 °C** is left in a room at **20 °C**. Hot things cool fastest
        when they are hottest: the rate of cooling is in proportion to how far the coffee is
        above room temperature.

        After 14 minutes the coffee is down to 55 °C. **What will it be after another 14 minutes?**
      `,
      shuffle: false,
      options: [
        { text: '20 °C: it loses 35 °C every 14 minutes' },
        { text: 'About 37 °C', correct: true },
        { text: 'About 45 °C' },
      ],
      explain: `
        About 37 °C. In the first 14 minutes the gap above room temperature halved, from 70 °C
        to 35 °C. Cooling in proportion to the gap means it halves again in the next 14 minutes,
        to about 17 °C above the room.

        Look at what kind of rule that was. It did not say what the temperature *is*. It said how
        fast the temperature *changes*. This lesson is about rules of that kind.
      `,
    },
    {
      id: 'teach-slope-rule',
      type: 'info',
      title: 'A rule for the slope',
      text: r`
        Here is a simpler rule of the same kind, for a quantity $y$ that changes with time $t$:

        $$ \frac{dy}{dt} = 0.5\,y $$

        It says: whatever $y$ is, it is growing at half of $y$ per unit of time. In
        *Calculus in Pictures*, $\frac{dy}{dt}$ was the slope of the graph of $y$ against $t$.
        So the rule does not tell you the curve. But at any point of the graph, it tells you
        the **slope** a solution must have there.

        :::example
        At the point $(t, y) = (2, 8)$ the slope must be $\mathord{0.5 \times 8} = 4$.
        At $(4, 2)$ it must be $\mathord{0.5 \times 2} = 1$.
        :::

        The picture draws that slope as a little dash at a few points. The blue point is $(2, 8)$.
      `,
      figure: {
        ...GROWTH, grid: [2, 2], curve: false, drag: false, static: true, start: { t: 2, y: 8 },
        alt: 'A grid of short dashes at a few points of a graph of y against t. Along the bottom, where y is 0, the dashes are level. Higher up they are steeper: every dash at height 2 has slope 1, and every dash at height 8 has slope 4.',
      },
    },
    {
      id: 'dash',
      type: 'fill',
      title: 'Read the rule',
      text: r`
        The same rule again:

        $$ \frac{dy}{dt} = 0.5\,y $$

        **Work out the slope it demands at three points.**
      `,
      template: r`
        At the point $(t, y) = (1, 4)$ the slope must be [[2]].

        At $(3, 4)$ it must be [[2]], and at $(3, 6)$ it must be [[3]].

        With this rule the slope depends only on [[the time t|*the height y|neither]].
      `,
      hints: [r`The rule uses only $y$: the slope is half the height.`],
      explain: r`
        Half of 4 is 2, wherever on the time axis you are. Half of 6 is 3. With this rule,
        equal heights get equal slopes.
      `,
    },
    {
      id: 'field',
      type: 'interact',
      title: 'A field of slopes',
      text: r`
        Draw the slope the rule demands as a little dash, at every point of a grid. That
        picture is a **slope field**. A solution of $\frac{dy}{dt} = 0.5y$ is a curve that follows the dashes
        wherever it goes.

        The [blue]{.blue} curve is the solution through the start point.
        **Drag the start point up or down until the curve passes through the ring.**
      `,
      widget: {
        ...GROWTH, start: { t: 0, y: 3 }, snap: [0, 0.25], target: { t: 4, y: 7.39, tol: 0.3 },
        alt: 'A grid of short dashes that are level along the bottom and steeper higher up. A curve starts from a draggable point on the left-hand edge and follows the dashes. A ring marks a point to aim for.',
      },
      check: (s) => {
        if (s.hit) return true;
        return s.miss > 0
          ? `Starting at ${num(s.start.y)}, the curve passes ${num(s.miss, 1)} above the centre of the ring (or leaves the picture before it gets there). Start lower.`
          : `Starting at ${num(s.start.y)}, the curve passes ${num(-s.miss, 1)} below the centre of the ring. Start higher.`;
      },
      solution: { start: { y: 1 } },
      hints: ['A lower start gives a curve that stays lower all the way along.'],
      explain: r`
        Starting from $y = 1$ does it. Every start point gives a different curve, and all of them
        follow the same dashes: one rule, a whole family of solutions.

        You know this family. The curve from $y = 1$ is $y = e^{0.5t}$, which reaches $e^2 \approx 7.39$ at $t = 4$.
      `,
    },
    {
      id: 'name',
      type: 'info',
      title: 'Differential equations',
      text: r`
        An equation that involves the derivative of an unknown function is called a
        **differential equation**. Solving it means finding a *function*, not a number: a curve
        that follows the slope field everywhere.

        - A differential equation has a whole family of solutions.
        - A starting value, such as $y(0) = 1$, picks out one of them.

        :::key
        The solutions of $\;\dfrac{dy}{dt} = k\,y\;$ are $\;y = C\,e^{kt}$, where $C$ is the starting value $y(0)$.
        :::

        That is the fact from *Calculus in Pictures* read backwards: $e^{kt}$ is the curve whose
        slope is $k$ times its height. Positive $k$ gives growth, negative $k$ decay.
      `,
      figure: {
        ...GROWTH, static: true, start: { t: 0, y: 1 }, family: [0.25, 0.5, 2, 3, 5],
        alt: 'The slope field of dy/dt = 0.5y with six solution curves, starting from six different heights. Each one follows the dashes, and none of them cross.',
      },
    },
    {
      id: 'verify',
      type: 'fill',
      title: 'Checking a solution',
      text: r`
        You never have to take a proposed solution on trust: **substitute it into the equation**
        and see whether the two sides agree.

        Is $y = 3e^{0.5t}$ a solution of $\dfrac{dy}{dt} = 0.5\,y$ with $y(0) = 3$?
        (From Lesson 1: $e^{kt}$ has derivative $k\,e^{kt}$, and a number in front stays in front.)
      `,
      template: r`
        Left side: by the chain rule, $\dfrac{dy}{dt} =$ [[1.5]] $e^{0.5t}$.

        Right side: $0.5 \times y = 0.5 \times 3e^{0.5t} =$ [[1.5]] $e^{0.5t}$.

        The two sides are [[*equal for every t|equal only at t = 0|never equal]]. And $y(0) = 3e^0 =$ [[3]].
      `,
      hints: [r`The derivative of $e^{0.5t}$ is $0.5e^{0.5t}$, and the 3 in front stays in front.`],
      explain: r`
        Both sides are $1.5e^{0.5t}$ at every moment, and the curve starts at 3. So yes: it is
        the solution with that starting value.
      `,
    },
    {
      id: 'which-solution',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const k = rng.pick([2, 3, 0.5, -1, -2]);
        const A = rng.pick([4, 5, 6, 8, 10]);
        const up = cx(k, 't');
        return {
          text: r`**Which function solves this differential equation and has the right starting value?** $$ \frac{dy}{dt} = ${cx(k, 'y')} \qquad y(0) = ${A} $$`,
          columns: 1,
          options: [
            { text: `$y = ${A}e^{${up}}$`, correct: true },
            { text: `$y = ${coef(k)}e^{${A}t}$`, why: r`This one starts at $y(0) = ${num(k)}$, not ${A}. And its slope is ${A} times its height, not ${num(k)} times.` },
            { text: `$y = e^{${up}} + ${A - 1}$`, why: r`It does start at ${A}. But its slope is $${coef(k)}e^{${up}}$, which is ${num(k)} times $e^{${up}}$ alone, not ${num(k)} times the whole of $y$.` },
            { text: `$y = ${A} ${k < 0 ? '-' : '+'} ${cx(Math.abs(k), 't')}$`, why: r`It does start at ${A}. But a straight line has the same slope everywhere, and this rule demands a slope that changes with $y$.` },
          ],
          hints: [
            r`The solutions of $\dfrac{dy}{dt} = ky$ are $y = Ce^{kt}$, with $C = y(0)$.`,
            'Or test each option: differentiate it, and compare with the right-hand side of the rule.',
          ],
          explain: r`
            $y = ${A}e^{${up}}$ has derivative $${num(k * A)}e^{${up}}$, which is $${bracketNeg(k)} \times ${A}e^{${up}} = ${cx(k, 'y')}$. And $y(0) = ${A}e^0 = ${A}$.
          `,
        };
      },
    },
    {
      id: 'euler-walk',
      type: 'interact',
      title: 'Walk along the dashes',
      text: r`
        What if you cannot guess a formula? Then **walk**. Look at the dash under your feet, go
        in that direction in a straight line for a short time $h$, look again, and repeat. This
        is **Euler's method**.

        The rule here is $\frac{dy}{dt} = y$, from $y(0) = 1$. The [blue]{.blue} curve is the true solution, $e^t$.

        **Walk to $t = 1$ in steps of 0.5. Then pick a smaller step size and walk again.**
      `,
      widget: {
        type: 'slope-field', rule: 'y', t: [0, 1.1], y: [0, 3], tStep: 0.25, yStep: 0.5, grid: [0.125, 0.25], tLabel: 't', yLabel: 'y',
        start: { t: 0, y: 1 }, euler: { sizes: [0.5, 0.25, 0.125], h: 0.5, to: 1, truth: true }, digits: 3,
        alt: 'The slope field of dy/dt = y between t = 0 and t = 1, with the true solution curve. A walker starts at height 1 and moves in straight steps along the dashes. A slider sets the step size.',
      },
      check: (s) => {
        if (s.done && s.h < 0.5) return true;
        if (!s.done) return `You are at t = ${num(s.t, 3)}. Keep pressing "Take a step" until you reach t = 1.`;
        return `With steps of 0.5 you arrive at ${num(s.y, 2)}, but the true curve is at ${num(s.exact, 2)}. Now choose a smaller step size and walk again.`;
      },
      solution: { h: 0.125, n: 8 },
      explain: r`
        Steps of 0.5 end at 2.25. Steps of 0.25 end at about 2.44, and steps of 0.125 at about 2.57.
        The true value is $e \approx 2.718$.

        Each straight step uses the slope at its *start* and ignores the fact that the slope keeps
        growing along the way, so the walk falls behind the curve. Smaller steps fall behind less.
      `,
    },
    {
      id: 'interest',
      type: 'fill',
      title: 'You have met these numbers',
      text: r`
        One Euler step for $\frac{dy}{dt} = y$ replaces $y$ by $y + h \times y$. In other words, each step
        **multiplies** $y$ by $1 + h$.
      `,
      template: r`
        With $h = 0.25$, each step multiplies $y$ by [[1.25]].

        Four steps take $y$ from 1 to $1.25^4 \approx$ [[2.44]] (to 2 decimals).

        Halve the step and you need [[8]] steps to reach $t = 1$, each multiplying $y$ by 1.125.
      `,
      tolerance: 0.005,
      hints: [r`$1.25^2 = 1.5625$, and $1.5625^2 \approx 2.4414$.`],
      explain: r`
        $1.25^4 \approx 2.44$ is exactly what the generous bank in *Calculus in Pictures* paid on £1
        when it split 100% interest into four quarters. Compound interest **is** Euler's method
        for $\frac{dy}{dt} = y$: with $n$ steps you reach $\left(1 + \frac1n\right)^n$.

        And the number those totals close in on, as the steps shrink, is $e$.
      `,
    },
    {
      id: 'example-euler',
      type: 'info',
      title: 'Euler\'s method by hand',
      text: r`
        The walk needs no picture, only arithmetic. Each step:
        **new $y$ = old $y$ + $h$ × slope**, with the slope worked out from the rule at the
        point you are leaving. And $t$ moves on by $h$.

        :::example
        $\dfrac{dy}{dt} = 2t + y$, from $t = 0$, $y = 1$, in steps of $h = 0.5$.

        1. At $(0, 1)$ the slope is $\mathord{2 \times 0 + 1} = 1$. So $y$ becomes $\mathord{1 + 0.5 \times 1} = 1.5$, at $\mathord{t = 0.5}$.
        2. At $(0.5, 1.5)$ the slope is $\mathord{2 \times 0.5 + 1.5} = 2.5$. So $y$ becomes $\mathord{1.5 + 0.5 \times 2.5} = 2.75$, at $\mathord{t = 1}$.
        :::

        The second slope comes from the *new* point, $(0.5, 1.5)$, not from the start. That
        is why the orange path bends: each step looks at the rule afresh.
      `,
      figure: {
        type: 'plot', x: [0, 1.25], y: [0, 3.5], xStep: 0.25, yStep: 0.5, xLabel: 't', yLabel: 'y',
        segments: [{ from: [0, 1], to: [0.5, 1.5], color: 'orange' }, { from: [0.5, 1.5], to: [1, 2.75], color: 'orange' }],
        points: [{ x: 0, y: 1, color: 'orange' }, { x: 0.5, y: 1.5, color: 'orange' }, { x: 1, y: 2.75, color: 'orange' }],
        alt: 'A path of two straight steps on a graph of y against t. The first goes from (0, 1) to (0.5, 1.5) with slope 1. The second, steeper, goes from (0.5, 1.5) to (1, 2.75) with slope 2.5.',
      },
    },
    {
      id: 'euler-hand',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const rule = rng.pick(HAND_RULES);
        const y0 = rng.pick(rule.starts);
        const h = rng.pick([0.5, 0.5, 0.1]);
        const m1 = tidy(rule.f(0, y0));
        const y1 = tidy(y0 + h * m1);
        const m2 = tidy(rule.f(h, y1));
        const y2 = tidy(y1 + h * m2);
        return {
          text: r`
            Take two steps of Euler's method by hand. Each step: **new $y$ = old $y$ + $h$ × slope**,
            with the slope worked out at the point you are leaving.

            $$ \frac{dy}{dt} = ${rule.tex} $$

            Start at $t = 0$, $y = ${y0}$, and use steps of $h = ${h}$.
          `,
          template: r`
            The slope at the start is [[${num(m1)}]], so after one step $t = ${h}$ and $y =$ [[${num(y1)}]].

            The slope there is [[${num(m2)}]], so after two steps $t = ${num(2 * h)}$ and $y =$ [[${num(y2)}]].
          `,
          hints: [
            r`Put $t = 0$ and $y = ${y0}$ into $${rule.tex}$ to get the first slope.`,
            r`First step: $y = ${y0} + ${h} \times ${bracketNeg(m1)} = ${num(y1)}$. Now put $t = ${h}$ and $y = ${num(y1)}$ into the rule.`,
          ],
          explain: r`
            At $(0, ${y0})$ the slope is $${num(m1)}$, so $y$ becomes $${y0} + ${h} \times ${bracketNeg(m1)} = ${num(y1)}$.

            At $(${h}, ${num(y1)})$ the slope is $${num(m2)}$, so $y$ becomes $${num(y1)} + ${h} \times ${bracketNeg(m2)} = ${num(y2)}$.
          `,
        };
      },
    },
    {
      id: 'cooling',
      type: 'choice',
      title: 'Back to the coffee',
      text: r`
        Newton's law of cooling turns the coffee into a differential equation. With $T$ in °C and $t$ in minutes,

        $$ \frac{dT}{dt} = -0.05\,(T - 20) $$

        The rate of cooling is in proportion to the gap between the drink and the room.

        **Drag the start: try hot coffee, then a drink from the fridge at 5 °C. What do all the solutions do?**
      `,
      figure: {
        ...COOLING, start: { t: 0, y: 90 }, snap: [0, 5],
        alt: 'A slope field for a cooling drink. Above the dashed line at 20 degrees the dashes slope downwards, more steeply the higher they are. Below it they slope upwards. A solution curve starts from a draggable point on the left.',
      },
      columns: 1,
      options: [
        { text: 'They all close in on 20 °C, from above or from below', correct: true },
        { text: 'They all fall, whatever the start', why: r`Start below 20 °C. There $T - 20$ is negative, so the slope $-0.05(T - 20)$ is positive: a cold drink warms up.` },
        { text: 'They reach 20 °C and carry on past it', why: 'The closer a solution gets to 20 °C, the smaller its slope. It creeps towards the line and never crosses it.' },
      ],
      explain: r`
        At $T = 20$ the slope is zero: a drink at room temperature stays there. Above the line the
        slopes point down, below it they point up, so every solution is funnelled towards 20 °C.
        A level solution like this is called an **equilibrium**.

        The curve from 90 °C is $T = 20 + 70e^{-0.05t}$: the 70° gap decays like any quantity that
        shrinks in proportion to its size. You can check it by substituting it in.
      `,
    },
    {
      id: 'cooling-rate',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const hot = rng.bool(0.7);
        const k = rng.pick([0.05, 0.1, 0.2]);
        const room = rng.pick([18, 20, 22, 25]);
        const gap = hot ? rng.pick([20, 30, 40, 50, 60]) : -rng.pick([12, 15]);
        const T = room + gap;
        const answer = tidy(-k * gap);
        return {
          text: r`
            ${rng.pick(hot ? WARM : COLD)} at **${T} °C** stands in a room at **${room} °C**. Its temperature $T$ follows

            $$ \frac{dT}{dt} = -${k}\,(T - ${room}) $$

            with $t$ in minutes. **At what rate is its temperature changing right now?** Give a negative number if it is falling.
          `,
          answer,
          unit: '°C per minute',
          tolerance: 0.0005,
          wrong: [
            [-answer, hot ? 'The size is right, but this is warmer than the room, so its temperature is falling: the rate is negative.' : 'The size is right, but this is colder than the room, so its temperature is rising: the rate is positive.'],
            [tidy(-k * T), r`That uses the temperature itself. The rule uses the *gap* between it and the room, $T - ${room}$.`],
            [-gap, r`That is minus the gap, $-(T - ${room})$. The rule multiplies it by ${k}.`],
          ],
          hints: [
            r`The rule gives the rate directly. Put $T = ${T}$ into the right-hand side.`,
            r`$T - ${room} = ${gap}$. Now multiply by $-${k}$.`,
          ],
          explain: r`$\dfrac{dT}{dt} = -${k} \times (${T} - ${room}) = -${k} \times ${bracketNeg(gap)} = ${num(answer)}$ °C per minute. ${hot ? 'As it cools, the gap shrinks, and so does this rate.' : 'It is below room temperature, so it warms up, more and more slowly as the gap closes.'}`,
        };
      },
    },
    {
      id: 'logistic',
      type: 'fill',
      title: 'Growth that levels off',
      text: r`
        Nothing grows in proportion to its size for ever. A common model for $P$ thousand
        fish in a pond with food for 10 thousand:

        $$ \frac{dP}{dt} = P\left(1 - \frac{P}{10}\right) $$

        For small $P$ the bracket is nearly 1: proportional growth. Near $P = 10$ it
        shrinks to nothing. **Drag the start and watch.**
      `,
      figure: {
        type: 'slope-field', rule: 'y*(1 - y/10)', t: [0, 10], y: [0, 14], tStep: 2, yStep: 2, grid: [0.5, 1], tLabel: 'years', yLabel: 'thousand fish',
        start: { t: 0, y: 1 }, snap: [0, 0.5], hlines: [{ y: 10, label: 'food for 10 thousand', color: 'green' }],
        alt: 'A slope field for a fish population. The dashes are level along the bottom and along a dashed line at 10, steepest halfway between, and slope downwards above 10. A solution curve starts from a draggable point on the left.',
      },
      template: r`
        From 1 thousand, the population [[grows without limit|*levels off at 10|dies out]]. From 13 thousand, it [[keeps growing|*falls back to 10|falls to 0]].

        The rate $P - \frac{P^2}{10}$ is largest where its slope is zero: at $P =$ [[5]].
      `,
      hints: [r`$P\left(1 - \frac{P}{10}\right) = P - \frac{P^2}{10}$ is the growth rate. As in *Calculus in Pictures*, it is largest where its derivative, $1 - \frac{P}{5}$, is zero.`],
      explain: r`
        Every solution that starts above zero is funnelled to $P = 10$, the level the pond can feed. From below
        the curve is an S: slow at first, fastest at $P = 5$ (halfway), then slower again.

        This is **logistic growth**. No formula was needed to see how its solutions behave: the
        slope field shows it.
      `,
    },
    {
      id: 'teach-reading-equations',
      type: 'info',
      title: 'Reading an equation as a sentence',
      text: r`
        A differential equation is a sentence about change. You have now met the main kinds.
        Here they are side by side, with $t$ in years.

        | $\dfrac{dy}{dt}$ equals | what it says |
        |:--|:--|
        | $5$ | a steady rate: 5 more every year |
        | $0.2\,y$ | growth in proportion to size: 20% of $y$ a year |
        | $-0.2\,y$ | decay: it loses 20% of itself a year |
        | $\mathord{-0.2\,(y - 15)}$ | the gap from 15 closes, as in cooling |
        | $\mathord{0.2\,y\left(1 - \frac{y}{80}\right)}$ | growth that levels off at 80 |

        Look for three things: is there a $y$ on the right at all, what is its sign, and is
        there a bracket that shrinks to zero at some level?
      `,
    },
    {
      id: 'match',
      type: 'match',
      review: true,
      text: 'A differential equation is a sentence about change. **Match each situation with its equation.**',
      pairs: [
        ['Savings that earn 3% interest a year', r`$\dfrac{dy}{dt} = 0.03\,y$`],
        ['A radioactive sample that loses 3% of its atoms each year', r`$\dfrac{dy}{dt} = -0.03\,y$`],
        ['A tank filling at a steady 3 litres a minute', r`$\dfrac{dy}{dt} = 3$`],
        ['Soup cooling in a room at 20 °C', r`$\dfrac{dy}{dt} = -0.3\,(y - 20)$`],
        ['Fish in a lake that can feed at most 300', r`$\dfrac{dy}{dt} = 0.3\,y\left(1 - \dfrac{y}{300}\right)$`],
      ],
      explain: r`
        A steady rate is a plain number. "In proportion to its size" is a multiple of $y$, positive for
        growth and negative for decay. Cooling is in proportion to the gap from the room. And a
        ceiling adds a bracket that switches the growth off as $y$ approaches it.
      `,
    },
    {
      id: 'oscillator',
      type: 'multi',
      stretch: true,
      title: 'The equation of a swing',
      text: r`
        Two lessons ago you found that differentiating $\sin t$ twice gives $-\sin t$. So
        $y = \sin t$ is a solution of

        $$ y'' = -y $$

        where $y''$ is the second derivative. This is the rule obeyed by a weight on a spring. **Which of these are solutions of it too?**
        Check each one by differentiating twice.
      `,
      options: [
        { text: r`$y = \cos t$`, correct: true },
        { text: r`$y = 3\sin t$`, correct: true },
        { text: r`$y = \sin t + \cos t$`, correct: true },
        { text: r`$y = e^{t}$`, why: r`Differentiating $e^t$ twice gives $e^t$ again: $y'' = +y$, with the wrong sign.` },
        { text: r`$y = \sin 2t$`, why: r`Each derivative brings out a factor 2: $y'' = -4\sin 2t = -4y$, not $-y$.` },
      ],
      hints: [r`$\cos t \to -\sin t \to -\cos t$. Is that minus what you started with?`],
      explain: r`
        $\cos t$ goes to $-\sin t$ and then to $-\cos t$, so it works. So does any multiple of
        $\sin t$ or $\cos t$, and any sum of them: again a whole family, and this time it takes
        *two* starting values (a position and a velocity) to pick one out.
      `,
    },
  ],
  recap: [
    'A **differential equation** gives the slope of an unknown function. Its solutions are curves that follow the slope field.',
    r`There is a family of solutions, and a starting value picks one. For $\dfrac{dy}{dt} = ky$ the family is $y = Ce^{kt}$.`,
    r`**Euler's method:** new $y$ = old $y$ + $h$ × slope, again and again. Smaller steps follow the true curve more closely.`,
    'To check a proposed solution, substitute it in: differentiate it and compare the two sides.',
  ],
  next: 'Next, the last tool: polynomials that imitate any smooth curve, one derivative at a time.',
};
