// Trigonometry: Circles & Waves · Lesson 2 · Heights You Cannot Climb
import { r, num } from '../../../kit.js';
import { TRIG, fixed, tabled, roundTo, trigTable, keyFor } from '../helpers.js';

const R2D = 180 / Math.PI;
const RATIO_OF = { 'hyp>opp': 'sin', 'hyp>adj': 'cos', 'adj>opp': 'tan', 'opp>hyp': 'sin', 'adj>hyp': 'cos', 'opp>adj': 'tan' };
const SIDE = { opp: 'opposite side', adj: 'adjacent side', hyp: 'hypotenuse' };
const WORD = { sin: 'sine', cos: 'cosine', tan: 'tangent' };
const TEX = { sin: '\\sin', cos: '\\cos', tan: '\\tan' };
const FN_SIDES = { sin: 'opposite ÷ hypotenuse', cos: 'adjacent ÷ hypotenuse', tan: 'opposite ÷ adjacent' };

/** A triangle to scale with the known side and the wanted side written on it. */
function sketch({ angle, known, want, size, scene, alt, angleText }) {
  const text = { opp: '', adj: '', hyp: '', angle: angleText || `${angle}°` };
  text[known] = `${num(size)} m`;
  text[want] = '?';
  return { type: 'trig-triangle', static: true, angle, size, fix: known, scene: scene || undefined, ground: true, text, alt };
}

/**
 * Stories in which the unknown side is on top of the ratio (multiply).
 * known / want are the roles of the two sides, seen from the angle.
 */
const MULTIPLY = [
  {
    known: 'hyp', want: 'opp', scene: 'wall', sizes: [4, 5, 6, 7, 8], angles: [60, 65, 70, 75],
    text: (L, a) => `A ladder **${L} m** long leans against a wall and makes an angle of **${a}°** with the ground.`,
    ask: 'How high up the wall does the ladder reach?',
    alt: (L, a) => `A ladder ${L} metres long leaning against a wall at ${a} degrees to the ground. The height it reaches is marked with a question mark.`,
  },
  {
    known: 'hyp', want: 'adj', scene: 'wall', sizes: [4, 5, 6, 7, 8], angles: [60, 65, 70, 75],
    text: (L, a) => `A ladder **${L} m** long leans against a wall and makes an angle of **${a}°** with the ground.`,
    ask: 'How far is the foot of the ladder from the wall?',
    alt: (L, a) => `A ladder ${L} metres long leaning against a wall at ${a} degrees to the ground. The distance from its foot to the wall is marked with a question mark.`,
  },
  {
    known: 'hyp', want: 'opp', scene: null, sizes: [30, 40, 50, 60, 80], angles: [35, 40, 50, 55, 65],
    text: (L, a) => `A kite flies on a straight string **${L} m** long. The string makes an angle of **${a}°** with the ground.`,
    ask: 'How high is the kite?',
    alt: (L, a) => `A kite string ${L} metres long rising at ${a} degrees from the ground. The height of the kite is marked with a question mark.`,
  },
  {
    known: 'adj', want: 'opp', scene: 'tower', sizes: [20, 25, 30, 40, 50], angles: [25, 32, 38, 52, 58],
    text: (d, a) => `A surveyor sets an instrument on the ground **${d} m** from a tower. It has to be tilted up by **${a}°** to point at the top of the tower.`,
    ask: 'How tall is the tower?',
    alt: (d, a) => `A tower seen from a point on the ground ${d} metres away. The line of sight to its top rises at ${a} degrees. The height of the tower is marked with a question mark.`,
  },
  {
    known: 'adj', want: 'opp', scene: 'tree', sizes: [6, 8, 10, 12, 15], angles: [28, 35, 42, 50, 56],
    text: (d, a) => `A tree casts a shadow **${d} m** long on level ground. The sun is **${a}°** above the horizon, so the sunlight over the treetop meets the ground at ${a}°.`,
    ask: 'How tall is the tree?',
    alt: (d, a) => `A tree and its shadow, ${d} metres long. A ray of sunlight passes the treetop and meets the ground at the tip of the shadow, at ${a} degrees. The height of the tree is marked with a question mark.`,
  },
];

/** Stories in which the unknown side is underneath (divide). */
const DIVIDE = [
  {
    known: 'opp', want: 'hyp', scene: 'pole', sizes: [12, 15, 18, 20, 24, 30], angles: [50, 55, 60, 65, 70],
    text: (h, a) => `A straight wire runs from the top of a mast **${h} m** tall to the ground, and meets the ground at **${a}°**.`,
    ask: 'How long is the wire?',
    alt: (h, a) => `A mast ${h} metres tall with a wire from its top to the ground. The wire meets the ground at ${a} degrees, and its length is marked with a question mark.`,
  },
  {
    known: 'opp', want: 'hyp', scene: 'wall', sizes: [3, 4, 5, 6], angles: [65, 70, 75],
    text: (h, a) => `A ladder has to reach a window ledge **${h} m** above the ground, and it should stand at **${a}°** to the ground.`,
    ask: 'How long must the ladder be?',
    alt: (h, a) => `A ladder leaning against a wall at ${a} degrees to the ground, reaching a point ${h} metres up. The length of the ladder is marked with a question mark.`,
  },
  {
    known: 'opp', want: 'adj', scene: 'tower', sizes: [30, 40, 50, 60], angles: [20, 25, 30, 35, 40],
    text: (h, a) => `From a small boat, the top of a lighthouse **${h} m** tall is seen **${a}°** above the horizontal.`,
    ask: 'How far is the boat from the foot of the lighthouse?',
    alt: (h, a) => `A lighthouse ${h} metres tall, seen from a boat at sea level. The line of sight to its top rises at ${a} degrees. The distance from the boat to the lighthouse is marked with a question mark.`,
  },
  {
    known: 'adj', want: 'hyp', scene: 'wall', sizes: [1.5, 2, 2.5, 3], angles: [65, 70, 75],
    text: (d, a) => `The foot of a ladder is **${num(d)} m** from a wall. The ladder leans against the wall at **${a}°** to the ground.`,
    ask: 'How long is the ladder?',
    alt: (d, a) => `A ladder leaning against a wall at ${a} degrees to the ground, with its foot ${num(d)} metres from the wall. The length of the ladder is marked with a question mark.`,
  },
];

/** Two known sides whose angle comes out within 0.2° of a whole number. [top of the fraction, bottom]. */
const ANGLE_STORIES = [
  {
    fn: 'sin', pairs: [[4, 5], [7, 8], [7, 9], [9, 10], [6, 7], [3.5, 4]], scene: 'wall',
    text: (a, b) => `A ladder **${num(b)} m** long leans against a wall and reaches **${num(a)} m** up it.`,
    ask: 'What angle does the ladder make with the ground?',
    sides: (a, b) => ({ opp: `${num(a)} m`, adj: '', hyp: `${num(b)} m` }),
    top: 'height reached', bottom: 'length of the ladder',
  },
  {
    fn: 'sin', pairs: [[15, 40], [20, 30], [30, 50], [35, 40], [40, 50], [40, 70], [45, 70], [35, 80]], scene: null,
    text: (a, b) => `A kite is **${a} m** above the ground, at the end of a straight string **${b} m** long.`,
    ask: 'What angle does the string make with the ground?',
    sides: (a, b) => ({ opp: `${a} m`, adj: '', hyp: `${b} m` }),
    top: 'height', bottom: 'length of the string',
  },
  {
    fn: 'cos', pairs: [[1.5, 4], [2.5, 7], [3, 5], [3, 8], [3.5, 8], [3.5, 9], [4, 7], [2, 4]], scene: 'wall',
    text: (a, b) => `A ladder **${num(b)} m** long leans against a wall. Its foot is **${num(a)} m** from the wall.`,
    ask: 'What angle does the ladder make with the ground?',
    sides: (a, b) => ({ opp: '', adj: `${num(a)} m`, hyp: `${num(b)} m` }),
    top: 'distance from the wall', bottom: 'length of the ladder',
  },
  {
    fn: 'tan', pairs: [[3, 4], [3, 5], [5, 6], [5, 8], [5, 9], [7, 10], [4, 9], [2, 5], [7, 9], [9, 10], [8, 11], [4, 11]], scene: null,
    text: (a, b) => `One side of a roof rises **${a} m** over a horizontal distance of **${b} m**.`,
    ask: 'What angle does the roof make with the horizontal?',
    sides: (a, b) => ({ opp: `${a} m`, adj: `${b} m`, hyp: '' }),
    top: 'rise', bottom: 'horizontal distance',
  },
];

const INV = { sin: Math.asin, cos: Math.acos, tan: Math.atan };
const row = (angle) => trigTable([angle]);

/** A "find the side" question, for either list of stories. */
function sideQuestion(rng, stories, divide) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const story = rng.pick(stories);
    const size = rng.pick(story.sizes);
    const angle = rng.pick(story.angles);
    const fn = RATIO_OF[`${story.known}>${story.want}`];
    const value = TRIG[fn](angle);
    const exact = divide ? size / value : size * value;
    const viaTable = divide ? size / tabled(value) : size * tabled(value);
    const key = keyFor(exact, [viaTable, divide ? size / tabled(value, 4) : size * tabled(value, 4)], 1);
    // the explanation works with the table value: it has to round to the same answer as the calculator's
    if (roundTo(viaTable, 1) !== key.answer) continue;
    // what the common slips give: the wrong operation, or one of the other two ratios
    const slips = [[divide ? size * value : size / value, divide
      ? `That multiplies ${num(size)} by ${fixed(value)}. Here the unknown is underneath the fraction bar: divide ${num(size)} by ${fixed(value)} instead.`
      : `That divides ${num(size)} by ${fixed(value)}. Here the unknown is on top of the fraction: multiply.`]];
    const others = [];
    for (const other of ['sin', 'cos', 'tan']) {
      if (other === fn) continue;
      const v = TRIG[other](angle);
      slips.push([divide ? size / v : size * v, `That uses the ${WORD[other]}, which is ${FN_SIDES[other]}. You know the ${SIDE[story.known]} and want the ${SIDE[story.want]}: which ratio is made of those two?`]);
      others.push(divide ? size * v : size / v);     // the wrong ratio and the wrong operation at once
    }
    // no slip may land on the right answer by accident
    if ([...slips.map(([v]) => v), ...others].some((v) => Math.abs(v - key.answer) < 4 * key.tolerance + 0.1)) continue;
    const top = divide ? num(size) : '?';
    const bottom = divide ? '?' : num(size);
    const setUp = `The ${SIDE[story.known]} is known and the ${SIDE[story.want]} is wanted, so use the ${WORD[fn]}`;
    return {
      text: `${story.text(size, angle)}\n\n${row(angle)}\n\n**${story.ask}** Round to 1 decimal place.`,
      figure: sketch({ angle, known: story.known, want: story.want, size, scene: story.scene, alt: story.alt(size, angle) }),
      ...key,
      unit: 'm',
      wrong: slips.map(([v, why]) => [roundTo(v, 1), why]),
      hints: [
        `Seen from the ${angle}° angle, the ${num(size)} m is the ${SIDE[story.known]} and the unknown is the ${SIDE[story.want]}. Which ratio uses exactly those two?`,
        r`$${TEX[fn]} ${angle}^\circ = \dfrac{${top}}{${bottom}}$, and $${TEX[fn]} ${angle}^\circ \approx ${fixed(value)}$.`,
      ],
      explain: divide
        ? r`${setUp}: $${TEX[fn]} ${angle}^\circ = \dfrac{${top}}{${bottom}}$. Multiply both sides by the unknown, then divide by $${TEX[fn]} ${angle}^\circ$: $\;? = \dfrac{${num(size)}}{${fixed(value)}} \approx ${key.display}$ m.`
        : r`${setUp}: $${TEX[fn]} ${angle}^\circ = \dfrac{${top}}{${bottom}}$. Multiply both sides by ${num(size)}: $\;? = ${num(size)} \times ${fixed(value)} \approx ${key.display}$ m.`,
    };
  }
  throw new Error('no clean variant found');
}

const TREE = {
  type: 'trig-triangle', static: true, angle: 40, size: 20, fix: 'adj', scene: 'tree',
  alt: 'A tree seen from a point on the ground 20 metres away. The line of sight to the treetop rises at 40 degrees. The height of the tree is marked with a question mark.',
};

export default {
  id: 'finding-sides-angles',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'How tall is the tree?',
      text: `
        A surveyor sets an instrument on the ground **20 m** from a tree. To point at the
        treetop it has to be tilted up by **40°**. The picture is drawn to scale.

        **Estimate the height of the tree.**
      `,
      figure: { ...TREE, text: { adj: '20 m', opp: '?', hyp: '' } },
      min: 5, max: 40, step: 1, start: 5, answer: 17, tolerance: 3, unit: 'm',
      explain: `
        About **16.8 m**. You could get that by measuring the drawing with a ruler and scaling up.

        The ratios from the last lesson do the same job with one multiplication, as accurately
        as you like, and nobody has to draw anything or climb anything.
      `,
    },
    {
      id: 'example-side',
      type: 'info',
      title: 'The side you know, the side you want',
      text: r`
        Each ratio from the last lesson ties the angle to **two sides**: ${['sin', 'cos', 'tan'].map((fn) => `the ${WORD[fn]} is ${FN_SIDES[fn]}`).join(', ')}.

        So when you know the angle and one side, use the ratio made of **the side you know and the side you want**.

        :::example
        A ramp **12 m** long climbs at **20°**. How far does it reach along the ground? ($\cos 20^\circ \approx ${fixed(TRIG.cos(20))}$)

        1. You know the [hypotenuse]{.violet} and want the [adjacent]{.blue} side: that pair is the **cosine**.
        2. $\cos 20^\circ = \dfrac{\text{ground}}{12}$
        3. Multiply both sides by 12: the ground is about $12 \times ${fixed(TRIG.cos(20))} \approx ${roundTo(12 * tabled(TRIG.cos(20)), 1)}$ m.
        :::
      `,
      figure: sketch({
        angle: 20, known: 'hyp', want: 'adj', size: 12,
        alt: 'A ramp 12 metres long climbing at 20 degrees. The distance it covers along the ground is marked with a question mark.',
      }),
    },
    {
      id: 'pick-ratio',
      type: 'choice',
      title: 'Which ratio?',
      text: `
        Seen from the 40° angle, the 20 m along the ground is the [adjacent]{.blue} side: you **know** it.
        The height is the [opposite]{.orange} side: you **want** it.
        The [hypotenuse]{.violet} is neither known nor wanted.

        **Which ratio is made of exactly the two sides you care about?**
      `,
      figure: { ...TREE, text: { adj: 'adjacent: 20 m', opp: 'opposite: ?', hyp: 'hypotenuse' } },
      options: [
        { text: r`$\tan 40^\circ = \dfrac{\text{opposite}}{\text{adjacent}}$`, correct: true },
        { text: r`$\sin 40^\circ = \dfrac{\text{opposite}}{\text{hypotenuse}}$`, why: 'That brings in the hypotenuse, which you do not know and do not want. One equation, two unknowns.' },
        { text: r`$\cos 40^\circ = \dfrac{\text{adjacent}}{\text{hypotenuse}}$`, why: 'That ratio does not contain the height at all.' },
      ],
      columns: 1,
      explain: r`
        The tangent is opposite over adjacent, the two sides in play:
        $$ \tan 40^\circ = \frac{\text{height}}{20} $$
        One equation with one unknown. You know how to solve those.
      `,
    },
    {
      id: 'solve-tree',
      type: 'fill',
      title: 'Solve it',
      text: r`
        A calculator set to **degrees**, or a table of tangents, gives $\tan 40^\circ \approx 0.839$. So

        $$ \frac{\text{height}}{20} = 0.839 $$
      `,
      template: `
        To get the height alone, [[*multiply|divide]] both sides by 20.

        The height is about [[16.8]] m (to 1 decimal place).
      `,
      tolerance: 0.05,
      hints: ['The height is being divided by 20. What undoes that?', r`$20 \times 0.839 = \;?$`],
      explain: r`
        Multiply both sides by 20: height $= 20 \times 0.839 = 16.78 \approx 16.8$ m.

        A tip for this lesson: you can type a calculation such as ==20*0.839== straight into an answer box.
      `,
    },
    {
      id: 'recipe',
      type: 'info',
      title: 'Three questions, every time',
      text: `
        Any right-angled triangle with one known angle and one known side gives up its other sides the same way:

        1. **Name the sides** from the angle. Which one do you *know*? Which one do you *want*?
        2. **Pick the ratio** made of exactly those two: sine, cosine or tangent.
        3. **Solve** the small equation.

        The values of sin, cos and tan come from a calculator in **degree mode** or from a table.
        Each question here gives you a line of the table, to 3 decimals. Round your final answer as the question asks.

        :::note
        Table or calculator, you may get slightly different last digits. Both are accepted.
        :::
      `,
    },
    {
      id: 'aim',
      type: 'interact',
      title: 'Measure the angle yourself',
      text: `
        A flagpole stands **30 m** away across level ground.

        **Tilt the line of sight until it just touches the top of the pole.** Then you will know the angle.
      `,
      widget: {
        type: 'trig-triangle', angle: 20, size: 30, fix: 'adj', angleRange: [10, 50], angleStep: 1, angleLabel: 'tilt',
        scene: 'pole', sceneHeight: 30 * Math.tan(35 / R2D), ratios: [], text: { adj: '30 m', opp: '', hyp: '' },
        alt: 'A flagpole 30 metres away across level ground, and a line of sight from a point on the ground. A slider tilts the line of sight up or down.',
      },
      check: (s) => {
        if (s.angle === 35) return true;
        return s.gap < 0
          ? 'The line of sight hits the pole below its top. Tilt it up a little.'
          : 'The line of sight passes above the top of the pole. Tilt it down a little.';
      },
      solution: { angle: 35 },
      explain: `
        **35°**. An instrument for measuring an angle like this is called a *clinometer*. A
        home-made one is a protractor with a drinking straw to sight along and a weighted string.

        The angle and the 30 m you can pace out on the ground are enough to pin the height down.
      `,
    },
    {
      id: 'pole-height',
      type: 'numeric',
      text: `
        The flagpole is **30 m** away and the angle up to its top is **35°**.

        ${row(35)}

        **How tall is the flagpole?** Round to 1 decimal place.
      `,
      figure: {
        type: 'trig-triangle', static: true, angle: 35, size: 30, fix: 'adj', scene: 'pole', text: { adj: '30 m', opp: '?', hyp: '' },
        alt: 'A flagpole seen from a point on the ground 30 metres away. The line of sight to its top rises at 35 degrees. The height of the pole is marked with a question mark.',
      },
      ...keyFor(30 * Math.tan(35 / R2D), [30 * 0.7], 1),
      unit: 'm',
      wrong: [
        [17.2, 'That uses the sine, which is opposite ÷ hypotenuse. The 30 m is the adjacent side, not the hypotenuse.'],
        [24.6, 'That uses the cosine, which does not contain the height. You know the adjacent side and want the opposite side.'],
        [42.9, 'That divides 30 by 0.700. The height is on top of the fraction, so multiply.'],
      ],
      hints: ['You know the adjacent side (30 m) and want the opposite side. Which ratio is opposite ÷ adjacent?', r`$\tan 35^\circ = \dfrac{\text{height}}{30}$, so the height is $30 \times 0.700$.`],
      explain: r`Adjacent known, opposite wanted: use the tangent. $\tan 35^\circ = \dfrac{\text{height}}{30}$, so height $\approx 30 \times 0.700 = 21.0$ m.`,
    },
    {
      id: 'find-side',
      type: 'numeric',
      review: true,
      gen: (rng) => sideQuestion(rng, MULTIPLY, false),
    },
    {
      id: 'example-divide',
      type: 'info',
      title: 'When the side you want is underneath',
      text: r`
        Sometimes the unknown side is the **bottom** of the fraction. Naming the sides and picking the ratio work as before. Only the last step changes.

        :::example
        A zip wire runs from the top of a pole **9 m** tall and meets the ground at **25°**. How long is the wire? ($\sin 25^\circ \approx ${fixed(TRIG.sin(25))}$)

        1. You know the [opposite]{.orange} side and want the [hypotenuse]{.violet}: the **sine**.
        2. $\sin 25^\circ = \dfrac{9}{\text{wire}}$
        3. Multiply both sides by the wire, then divide by $\sin 25^\circ$: the wire is about $\dfrac{9}{${fixed(TRIG.sin(25))}} \approx ${roundTo(9 / tabled(TRIG.sin(25)), 1)}$ m.
        :::

        :::key
        Unknown on top of the fraction: multiply. Unknown underneath: divide.
        :::
      `,
      figure: sketch({
        angle: 25, known: 'opp', want: 'hyp', size: 9, scene: 'pole',
        alt: 'A pole 9 metres tall with a wire from its top to the ground. The wire meets the ground at 25 degrees, and its length is marked with a question mark.',
      }),
    },
    {
      id: 'find-hyp',
      type: 'numeric',
      review: true,
      title: 'When the unknown is underneath',
      gen: (rng) => sideQuestion(rng, DIVIDE, true),
    },
    {
      id: 'angle-search',
      type: 'interact',
      title: 'Backwards: from sides to an angle',
      text: `
        A ramp rises **3 m** over **4 m** of level ground, so opposite ÷ adjacent is 3 ÷ 4 = 0.75.
        But what **angle** is that?

        **Change the angle until the ratio under the picture reads 0.75.**
      `,
      widget: {
        type: 'trig-triangle', angle: 20, size: 4, fix: 'adj', angleRange: [10, 60], angleStep: 1, sides: 'both', unit: 'm', ratios: ['tan'],
        alt: 'A right-angled triangle whose adjacent side is 4 metres long. A slider changes the marked angle, and the opposite side grows or shrinks with it.',
      },
      check: (s) => {
        if (s.angle === 37) return true;
        return s.tan > 0.75
          ? `At ${s.angle}° the ratio is ${num(s.tan, 2)}: the ramp is too steep.`
          : `At ${s.angle}° the ratio is ${num(s.tan, 2)}: the ramp is not steep enough yet.`;
      },
      solution: { angle: 37 },
      explain: r`
        About **37°**. You have just searched for *the angle whose tangent is 0.75*.

        That search has a name, the **inverse tangent**, and a calculator key: $\tan^{-1}(0.75) \approx 36.87^\circ$.
      `,
    },
    {
      id: 'inverse',
      type: 'info',
      title: 'Running a ratio backwards',
      text: r`
        Sine, cosine and tangent turn an angle into a ratio. Their **inverses** turn a ratio back into the angle:

        $$ \begin{aligned} \theta &= \sin^{-1}\!\left(\frac{\text{opposite}}{\text{hypotenuse}}\right) \\[4pt] \theta &= \cos^{-1}\!\left(\frac{\text{adjacent}}{\text{hypotenuse}}\right) \\[4pt] \theta &= \tan^{-1}\!\left(\frac{\text{opposite}}{\text{adjacent}}\right) \end{aligned} $$

        On a calculator they share the sin, cos and tan keys (press SHIFT or 2nd first). In a table,
        find the ratio in the body of the table and read the angle at the edge.

        :::warn Not a power
        The small $-1$ means "inverse", not "one over". $\sin^{-1}(0.5)$ is the angle whose sine is 0.5, which is 30°.
        :::
      `,
    },
    {
      id: 'example-angle',
      type: 'info',
      title: 'An angle from two sides',
      text: r`
        :::example
        A ramp **7 m** long rises **3 m**. What angle does it make with the ground?

        1. Seen from that angle, you know the [opposite]{.orange} side and the [hypotenuse]{.violet}: the **sine**.
        2. $\sin\theta = \dfrac{3}{7} \approx ${fixed(3 / 7)}$
        3. Go down the $\sin$ column to the value closest to ${fixed(3 / 7)}. That is ${fixed(TRIG.sin(25))}, in the row of **25°**. (A calculator gives $\sin^{-1}(${fixed(3 / 7)}) \approx ${num(Math.asin(tabled(3 / 7)) * R2D, 1)}^\circ$.)
        :::

        ${trigTable([24, 25, 26]).replace(/\n/g, '\n        ')}
      `,
      figure: {
        type: 'trig-triangle', static: true, angle: Math.asin(3 / 7) * R2D, size: 7, ground: true, text: { opp: '3 m', adj: '', hyp: '7 m', angle: '?' },
        alt: 'A ramp drawn as a right-angled triangle. Its sloping side is 7 metres long and it rises 3 metres. The angle it makes with the ground is marked with a question mark.',
      },
    },
    {
      id: 'find-angle',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const story = rng.pick(ANGLE_STORIES);
        const [a, b] = rng.pick(story.pairs);
        const exact = INV[story.fn](a / b) * R2D;
        const answer = Math.round(exact);
        const first = answer - rng.int(0, 3);
        const rows = [first, first + 1, first + 2, first + 3];
        const ratio = fixed(a / b);
        const name = WORD[story.fn];
        const tex = TEX[story.fn];
        return {
          text: `${story.text(a, b)}\n\n${trigTable(rows)}\n\n**${story.ask}** Give it to the nearest degree.`,
          figure: {
            type: 'trig-triangle', static: true, angle: exact, size: b, fix: story.fn === 'tan' ? 'adj' : 'hyp', scene: story.scene || undefined, ground: true,
            text: { ...story.sides(a, b), angle: '?' },
            alt: `A right-angled triangle drawn to scale. Seen from the angle marked with a question mark, ${story.fn === 'cos' ? 'the adjacent' : 'the opposite'} side is ${num(a)} metres and ${story.fn === 'tan' ? 'the adjacent side' : 'the hypotenuse'} is ${num(b)} metres.`,
          },
          answer,
          tolerance: 0.5,
          unit: '°',
          wrong: [[90 - answer, 'That is the other acute angle of the triangle. Check which side is opposite the angle you want, and which way up your fraction is.']],
          hints: [
            `Seen from the angle you want, the two known sides are the ${FN_SIDES[story.fn].replace(' ÷ ', ' side and the ')}${story.fn === 'tan' ? ' side' : ''}. Which ratio is that?`,
            r`$${tex}\theta = \dfrac{${num(a)}}{${num(b)}} \approx ${ratio}$. Look down the $${tex}$ column for the value closest to ${ratio}.`,
          ],
          explain: r`The two known sides are ${FN_SIDES[story.fn].replace('÷', 'and')} (${story.top} and ${story.bottom}), so use the ${name}: $${tex}\theta = \dfrac{${num(a)}}{${num(b)}} \approx ${ratio}$. The closest value in the $${tex}$ column belongs to ${answer}°, and a calculator gives $${tex}^{-1}(${ratio}) \approx ${num(INV[story.fn](Number(ratio)) * R2D, 1)}^\circ$.`,
        };
      },
    },
    {
      id: 'eye-height',
      type: 'numeric',
      stretch: true,
      title: 'Do not forget where you stand',
      gen: (rng) => {
        for (let attempt = 0; attempt < 40; attempt++) {
          const thing = rng.pick([{ name: 'building', scene: 'tower' }, { name: 'tree', scene: 'tree' }, { name: 'clock tower', scene: 'tower' }]);
          const d = rng.pick([15, 20, 25, 30, 40]);
          const angle = rng.pick([25, 30, 35, 40, 50]);
          const eye = rng.pick([1.5, 1.6, 1.7]);
          const t = Math.tan(angle / R2D);
          const above = d * t;
          const key = keyFor(above + eye, [d * tabled(t) + eye, roundTo(above, 1) + eye, roundTo(d * tabled(t), 1) + eye], 1);
          // the hint and the explanation multiply by the table value: that has to give the same rounded height
          if (key.tolerance > 0.2 || roundTo(d * tabled(t), 1) !== roundTo(above, 1)) continue;
          return {
            text: `You stand **${d} m** from a ${thing.name} and look up at its top. Your line of sight is **${angle}°** above the horizontal, and your eyes are **${eye} m** above the ground. The right-angled triangle starts at your eyes, not at your feet.\n\n${row(angle)}\n\n**How tall is the ${thing.name}?** Round to 1 decimal place.`,
            figure: {
              type: 'trig-triangle', static: true, angle, size: d, fix: 'adj', scene: thing.scene, eye,
              text: { adj: `${d} m`, opp: '', hyp: '', eye: `${eye} m`, total: '?' },
              alt: `A person standing ${d} metres from a ${thing.name}. From eye level, ${eye} metres above the ground, the line of sight to the top rises at ${angle} degrees. The full height of the ${thing.name} is marked with a question mark.`,
            },
            ...key,
            unit: 'm',
            wrong: [
              [roundTo(above, 1), `That is how far the top is above your **eyes**. Your eyes are ${eye} m above the ground: add that on.`],
              [roundTo(d / t + eye, 1), `The height above eye level is on top of the fraction, so multiply ${d} by ${fixed(t)} rather than dividing.`],
            ],
            hints: [
              'The triangle starts at your eyes, not at your feet. Find the height of the top above eye level first.',
              r`Above eye level: $${d} \times \tan ${angle}^\circ = ${d} \times ${fixed(t)} \approx ${num(roundTo(above, 1))}$ m. Now add the height of your eyes.`,
            ],
            explain: r`The triangle sits at eye level. Its opposite side is $${d} \times \tan ${angle}^\circ \approx ${d} \times ${fixed(t)} \approx ${num(roundTo(above, 1))}$ m. Add the ${eye} m from the ground to your eyes: about **${key.display} m**.`,
          };
        }
        throw new Error('no clean variant found');
      },
    },
    {
      id: 'which-tool',
      type: 'bucket',
      review: true,
      text: 'In a right-angled triangle, which ratio (or its inverse) does each job? The sides are named from the angle in question.',
      buckets: ['sine', 'cosine', 'tangent'],
      items: [
        { text: 'Know the hypotenuse and the angle. Want the opposite side.', bucket: 0, why: 'Opposite and hypotenuse: that pair is the sine.' },
        { text: 'Know the opposite side and the hypotenuse. Want the angle.', bucket: 0, why: 'Opposite and hypotenuse: the inverse sine gives the angle.' },
        { text: 'Know the angle and the adjacent side. Want the hypotenuse.', bucket: 1, why: 'Adjacent and hypotenuse: that pair is the cosine.' },
        { text: 'Know the adjacent side and the hypotenuse. Want the angle.', bucket: 1, why: 'Adjacent and hypotenuse: the inverse cosine gives the angle.' },
        { text: 'Know the angle and the adjacent side. Want the opposite side.', bucket: 2, why: 'Opposite and adjacent: that pair is the tangent.' },
        { text: 'Know both shorter sides. Want the angle.', bucket: 2, why: 'The two shorter sides are the opposite and the adjacent: the inverse tangent gives the angle.' },
      ],
      explain: 'Look at which **two sides** are in play: the one you know and the one you want, or the two you know. Opposite with hypotenuse is the sine, adjacent with hypotenuse the cosine, opposite with adjacent the tangent.',
    },
  ],
  recap: [
    'Name the sides from the angle, pick the ratio made of the side you know and the side you want, then solve.',
    'Unknown on top of the fraction: multiply. Unknown underneath: divide.',
    r`The inverses $\sin^{-1}$, $\cos^{-1}$ and $\tan^{-1}$ turn a ratio of two sides back into an angle.`,
    'Check that the triangle starts where you think it does: an eye-level measurement needs the height of the eye added.',
  ],
  next: 'Next: what could the sine of 150° possibly mean? No right-angled triangle has room for such an angle.',
};
