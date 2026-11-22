// Trigonometry: Circles & Waves · Lesson 1 · The Ratio That Never Changes
import { r, num } from '../../../kit.js';
import { trigTable } from '../helpers.js';

const RAMP = { opp: 'height', adj: 'ground', hyp: 'ramp' };

/** Two ramps at the same angle, one four times as long as the other, drawn to scale. */
const TWO_RAMPS = (() => {
  const a = (25 * Math.PI) / 180;
  const base = 168;
  const ramp = (x, len, label) => {
    const w = len * Math.cos(a);
    const hgt = len * Math.sin(a);
    const rr = Math.min(30, len * 0.3);
    return (
      `<polygon class="fill-gray-soft" points="${x},${base} ${x + w},${base} ${x + w},${base - hgt}"/>` +
      `<path class="fill-yellow stroke-ink" stroke-width="2" stroke-linejoin="round" d="M${x} ${base} h${rr} A${rr} ${rr} 0 0 0 ${x + rr * Math.cos(a)} ${base - rr * Math.sin(a)} Z"/>` +
      `<path class="stroke-blue fill-none" stroke-width="4" stroke-linecap="round" d="M${x} ${base} H${x + w}"/>` +
      `<path class="stroke-orange fill-none" stroke-width="4" stroke-linecap="round" d="M${x + w} ${base} V${base - hgt}"/>` +
      `<path class="stroke-violet fill-none" stroke-width="4" stroke-linecap="round" d="M${x} ${base} L${x + w} ${base - hgt}"/>` +
      `<path class="stroke-ink fill-none" stroke-width="2" d="M${x + w - 9} ${base} v-9 h9"/>` +
      `<text class="fig-label-sm" x="${x + w / 2}" y="${base + 20}" text-anchor="middle">${label}</text>`
    );
  };
  return {
    type: 'svg', viewBox: '0 0 440 196', maxWidth: 460,
    alt: 'Two ramps drawn as right-angled triangles. They climb at the same angle, but the second is four times as long as the first.',
    content: ramp(16, 76, 'short ramp') + ramp(124, 304, 'long ramp: 4 times as long'),
  };
})();

/** The ramp of the first exploration at two of its lengths, 6 m and 12 m, with the heights the widget showed. */
const SAME_RATIO = (() => {
  const a = (35 * Math.PI) / 180;
  const base = 156;
  const ramp = (x, len, slope, height) => {
    const w = len * Math.cos(a);
    const hgt = len * Math.sin(a);
    return (
      `<polygon class="fill-gray-soft" points="${x},${base} ${x + w},${base} ${x + w},${base - hgt}"/>` +
      `<path class="fill-yellow stroke-ink" stroke-width="2" stroke-linejoin="round" d="M${x} ${base} h26 A26 26 0 0 0 ${x + 26 * Math.cos(a)} ${base - 26 * Math.sin(a)} Z"/>` +
      `<path class="stroke-blue fill-none" stroke-width="4" stroke-linecap="round" d="M${x} ${base} H${x + w}"/>` +
      `<path class="stroke-orange fill-none" stroke-width="4" stroke-linecap="round" d="M${x + w} ${base} V${base - hgt}"/>` +
      `<path class="stroke-violet fill-none" stroke-width="4" stroke-linecap="round" d="M${x} ${base} L${x + w} ${base - hgt}"/>` +
      `<path class="stroke-ink fill-none" stroke-width="2" d="M${x + w - 9} ${base} v-9 h9"/>` +
      `<text class="fig-label-sm text-violet" x="${x + w / 2 - 8}" y="${base - hgt / 2 - 10}" text-anchor="end">${slope}</text>` +
      `<text class="fig-label-sm text-orange" x="${x + w + 8}" y="${base - hgt / 2 + 5}" text-anchor="start">${height}</text>` +
      `<text class="fig-label-sm" x="${x + 44}" y="${base - 7}" text-anchor="middle">35°</text>`
    );
  };
  return {
    type: 'svg', viewBox: '0 0 440 176', maxWidth: 460,
    alt: 'Two ramps that climb at 35 degrees. The first is 6 metres long and 3.44 metres high. The second is 12 metres long and 6.88 metres high: twice as long and twice as high.',
    content: ramp(30, 104, '6 m', '3.44 m') + ramp(196, 208, '12 m', '6.88 m'),
  };
})();

/** [opposite, adjacent, hypotenuse]: whole-number right-angled triangles that are not too thin to draw. */
const TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [20, 21, 29], [21, 20, 29]];

/** Things that climb in a straight line: [angle, its sine to one decimal] pairs and lengths that suit each one. */
const STORIES = [
  {
    angles: [[30, 0.5], [37, 0.6], [53, 0.8]], lengths: [20, 30, 40, 50, 60, 80], slope: 'the string',
    text: (L, a, sine) => `A kite flies at the end of a straight string **${L} m** long. The string makes an angle of **${a}°** with the ground, and ${sine}.`,
    ask: 'how high is the kite?',
  },
  {
    angles: [[37, 0.6], [53, 0.8]], lengths: [20, 30, 40, 50], slope: 'the wire',
    text: (L, a, sine) => `A straight wire runs from the top of a radio mast down to the ground. The wire is **${L} m** long and meets the ground at **${a}°**, and ${sine}.`,
    ask: 'how tall is the mast?',
  },
  {
    angles: [[30, 0.5]], lengths: [10, 20, 30, 40], slope: 'the escalator',
    text: (L, a, sine) => `An escalator climbs at **${a}°** and is **${L} m** long, measured along the slope. As you know, ${sine}.`,
    ask: 'how high does it lift you?',
  },
  {
    angles: [[37, 0.6]], lengths: [5, 10, 15], slope: 'the slide',
    text: (L, a, sine) => `A straight water slide is **${L} m** long and drops at **${a}°** to the horizontal, and ${sine}.`,
    ask: 'how high above the water does it start?',
  },
];

export default {
  id: 'right-triangle-ratios',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Two ramps',
      text: `
        Two ramps climb at **the same angle**. One is short. The other is four times as long.

        For each ramp, divide its [height]{.orange} by its [length along the slope]{.violet}.

        **Which ramp gives the bigger number?**
      `,
      figure: TWO_RAMPS,
      shuffle: false,
      options: [
        { text: 'The short ramp' },
        { text: 'The long ramp' },
        { text: 'Both give exactly the same number', correct: true },
      ],
      explain: `
        The same number. The long ramp is an **enlargement** of the short one: its slope is 4 times
        as long, and so is its height. Divide one by the other and the 4 cancels.

        In geometry you called such shapes *similar*. This whole course grows out of that one fact.
      `,
    },
    {
      id: 'resize',
      type: 'interact',
      graded: false,
      title: 'Stretch the ramp',
      text: `
        This ramp climbs at 35°. The slider changes how long it is.

        **Try at least three different lengths.** Each time, look at the number under the
        picture: [height]{.orange} ÷ [ramp]{.violet}.
      `,
      widget: {
        type: 'trig-triangle', angle: 35, size: 6, sizeRange: [3, 12], sizeStep: 1, names: RAMP, sides: 'both', unit: 'm',
        ratios: ['sin'], sizeLabel: 'ramp length',
        alt: 'A ramp drawn as a right-angled triangle that climbs at 35 degrees. A slider changes the length of the ramp.',
      },
      check: (s) => s.sizesTried >= 3 || 'Move the "ramp length" slider to a few more lengths, and keep an eye on the ratio each time.',
      solution: { size: 12, sizes: [3, 6, 12] },
      explain: `
        It says **0.57** every time. Stretching the ramp changes both lengths, but not their ratio.
      `,
    },
    {
      id: 'change-angle',
      type: 'interact',
      title: 'Now change the angle',
      text: `
        The ratio does not care about size. Does it care about the angle?

        **Find the angle at which the [height]{.orange} is exactly half of the [ramp]{.violet}.**
      `,
      widget: {
        type: 'trig-triangle', angle: 35, size: 8, sizeRange: [3, 10], sizeStep: 1, angleRange: [10, 75], angleStep: 5, names: RAMP, sides: 'both', unit: 'm',
        ratios: ['sin'], sizeLabel: 'ramp length',
        alt: 'A ramp drawn as a right-angled triangle. One slider changes its length and another changes the angle at which it climbs.',
      },
      check: (s) => {
        if (s.angle === 30) return true;
        return s.sin > 0.5
          ? `At ${s.angle}° the height is ${num(s.sin, 2)} of the ramp: more than half. A flatter ramp gains less height.`
          : `At ${s.angle}° the height is only ${num(s.sin, 2)} of the ramp: less than half. Make the ramp steeper.`;
      },
      solution: { angle: 30 },
      hints: ['You want the ratio under the picture to read 0.5. Only the angle slider can change it.'],
      explain: `
        At **30°** the height is exactly half of the ramp, whatever the length. A steeper ramp
        gives a bigger ratio, and a flatter one a smaller ratio.
      `,
    },
    {
      id: 'same-ratio',
      type: 'info',
      title: 'The ratio belongs to the angle',
      text: `
        A longer ramp at the same angle is an **enlargement** of the shorter one. Its
        [height]{.orange} and its [slope]{.violet} grow by the same scale factor, so when you divide
        one by the other the factor cancels.

        | ramp at 35° | height | height ÷ ramp |
        |:--|:--|:--|
        | 6 m | 3.44 m | 0.57 |
        | 12 m | 6.88 m | 0.57 |

        :::key
        Same angle, same ratio. Different angle, different ratio.
        :::

        So 0.57 does not belong to any one triangle. It belongs to the **angle** 35°, just as 0.5 belongs to 30°.
      `,
      figure: SAME_RATIO,
    },
    {
      id: 'names',
      type: 'info',
      title: 'Three names, seen from the angle',
      text: `
        To use this in any right-angled triangle, the sides need names. They are named
        **from the angle you are working with** (marked in yellow):

        - The [hypotenuse]{.violet} is the longest side. It faces the right angle, as in Pythagoras' theorem.
        - The [opposite]{.orange} side faces the marked angle. It is the one side that does not touch it.
        - The [adjacent]{.blue} side runs from the marked angle to the right angle.

        On the ramp: the height was the opposite side, the ground the adjacent side, and the slope the hypotenuse.
      `,
      figure: {
        type: 'trig-triangle', static: true, angle: 35, size: 10, sides: 'name', text: { angle: '' },
        alt: 'A right-angled triangle with one acute angle marked. The side facing that angle is labelled opposite, the side from the angle to the right angle is labelled adjacent, and the longest side is labelled hypotenuse.',
      },
    },
    {
      id: 'label-sides',
      type: 'interact',
      title: 'Turn it round',
      text: `
        The names do not depend on which way up the triangle is.

        **Name all three sides of this one.** Tap a tag to change what it says.
      `,
      widget: {
        type: 'trig-triangle', label: true, angle: 34, size: 10, turn: 90, text: { angle: '' },
        alt: 'A right-angled triangle standing on one corner, with an acute angle marked at the bottom. Each of its three sides carries a tag to be named.',
      },
      check: (s) => {
        if (s.right === 3) return true;
        if (s.placed < 3) return 'Give every side a name: tap each tag until it shows the name you want.';
        if (s.tags.hyp !== 'hypotenuse') return 'Start with the hypotenuse: it is the longest side, the one facing the right angle (the small square).';
        return 'The hypotenuse is right. Now the other two: the opposite side is the one that does not touch the yellow angle, and the adjacent side is the one that does.';
      },
      solution: { tags: { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse' } },
      hints: ['Find the right angle first. The side facing it is the hypotenuse.', 'Of the two sides that are left, only one touches the yellow angle. That one is adjacent.'],
      explain: `
        Here the opposite side lies flat along the top and the adjacent side stands upright.
        "Opposite" never means "vertical": it means *across from the angle*.

        If you worked from the **other** acute angle instead, opposite and adjacent would swap.
        The hypotenuse would stay where it is.
      `,
    },
    {
      id: 'which-side',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const asked = rng.pick(['opposite', 'opposite', 'adjacent', 'adjacent', 'hypotenuse']);
        const [p, q, t] = rng.shuffle(['p', 'q', 'r']);
        const letter = { opposite: p, adjacent: q, hypotenuse: t };
        const angle = rng.pick([25, 30, 35, 40, 50, 55, 60]);
        const why = {
          opposite: {
            adjacent: 'That side touches the marked angle, so it cannot be opposite it: it is the adjacent side. The opposite side is across the triangle from the angle.',
            hypotenuse: 'That side faces the right angle, so it is the hypotenuse. The opposite side faces the marked angle.',
          },
          adjacent: {
            opposite: 'That side does not touch the marked angle at all: it is the opposite side.',
            hypotenuse: 'That side does touch the marked angle, but it faces the right angle, so it is the hypotenuse. The adjacent side is the other one that touches the angle.',
          },
          hypotenuse: {
            opposite: 'That side faces the marked angle, so it is the opposite side. The hypotenuse faces the right angle.',
            adjacent: 'That side joins the marked angle to the right angle: it is the adjacent side. The hypotenuse faces the right angle.',
          },
        };
        return {
          text: asked === 'hypotenuse'
            ? 'One acute angle of this right-angled triangle is marked in yellow. The small square marks the right angle.\n\n**Which side is the hypotenuse?**'
            : `One acute angle of this right-angled triangle is marked in yellow. The small square marks the right angle.\n\n**Which side is ${asked} ${asked === 'opposite' ? '' : 'to '}the marked angle?**`,
          figure: {
            type: 'trig-triangle', static: true, plain: true, angle, size: 10, turn: rng.pick([0, 90, 180, 270]), flip: rng.bool(),
            text: { opp: letter.opposite, adj: letter.adjacent, hyp: letter.hypotenuse, angle: '' },
            alt: `A right-angled triangle with one acute angle marked. The side facing the marked angle is labelled ${letter.opposite}, the side joining the marked angle to the right angle is labelled ${letter.adjacent}, and the side facing the right angle is labelled ${letter.hypotenuse}.`,
          },
          shuffle: false,
          options: ['p', 'q', 'r'].map((name) => {
            const role = Object.keys(letter).find((k) => letter[k] === name);
            return role === asked ? { text: `Side $${name}$`, correct: true } : { text: `Side $${name}$`, why: why[asked][role] };
          }),
          explain: `Side $${letter.hypotenuse}$ faces the right angle: it is the hypotenuse. Side $${letter.opposite}$ is across from the marked angle: the opposite side. Side $${letter.adjacent}$ joins the marked angle to the right angle: the adjacent side.`,
        };
      },
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Sine, cosine, tangent',
      text: r`
        Three sides give three useful ratios. Each one depends only on the angle, and each has a name.
        The Greek letter $\theta$ ("theta") stands for the angle.

        $$ \begin{aligned} \sin\theta &= \frac{\orange{\text{opposite}}}{\violet{\text{hypotenuse}}} \\[4pt] \cos\theta &= \frac{\blue{\text{adjacent}}}{\violet{\text{hypotenuse}}} \\[4pt] \tan\theta &= \frac{\orange{\text{opposite}}}{\blue{\text{adjacent}}} \end{aligned} $$

        They are read **sine**, **cosine** and **tangent**. The ratio you watched on the ramp
        was the sine: $\sin 35^\circ \approx 0.57$ and $\sin 30^\circ = 0.5$.

        :::tip A way to remember
        **SOH CAH TOA**: **S**ine is **O**pposite over **H**ypotenuse, **C**osine is **A**djacent over **H**ypotenuse, **T**angent is **O**pposite over **A**djacent.
        :::
      `,
    },
    {
      id: 'example-ratios',
      type: 'info',
      title: 'Name the sides, then write the fractions',
      text: r`
        To read the ratios off a triangle, **name the three sides first**, seen from the angle. The fractions then write themselves.

        :::example
        The sides of this triangle are 9, 12 and 15, and the angle is $\theta$.

        - The [hypotenuse]{.violet} faces the right angle: **15**.
        - The [opposite]{.orange} side does not touch $\theta$: **12**.
        - The [adjacent]{.blue} side joins $\theta$ to the right angle: **9**.

        So $\sin\theta = \frac{12}{15}$, $\;\cos\theta = \frac{9}{15}\;$ and $\;\tan\theta = \frac{12}{9}$.
        :::
      `,
      figure: {
        type: 'trig-triangle', static: true, angle: (Math.atan2(12, 9) * 180) / Math.PI, size: 15, turn: 90,
        text: { opp: '12', adj: '9', hyp: '15', angle: 'θ' },
        alt: 'A right-angled triangle turned on its side, with an acute angle marked theta at the bottom. The side facing theta is 12 long and lies along the top, the side from theta up to the right angle is 9 long, and the side facing the right angle is 15 long.',
      },
    },
    {
      id: 'read-ratios',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const [opp, adj, hyp] = rng.pick(TRIPLES);
        const angle = (Math.atan2(opp, adj) * 180) / Math.PI;
        const turn = rng.pick([0, 0, 90, 180, 270]);
        const flip = rng.bool();
        return {
          text: r`The sides of this right-angled triangle are ${Math.min(opp, adj)}, ${Math.max(opp, adj)} and ${hyp} units long. Seen from the angle $\theta$, write each ratio **as a fraction**.`,
          figure: {
            type: 'trig-triangle', static: true, plain: true, angle, size: hyp, turn, flip,
            text: { opp: String(opp), adj: String(adj), hyp: String(hyp), angle: 'θ' },
            alt: `A right-angled triangle with an acute angle marked theta. The side facing theta is ${opp} long, the side from theta to the right angle is ${adj} long, and the side facing the right angle is ${hyp} long.`,
          },
          template: r`
            $\sin\theta =$ [[${opp}/${hyp}]]

            $\cos\theta =$ [[${adj}/${hyp}]]

            $\tan\theta =$ [[${opp}/${adj}]]
          `,
          hints: [
            r`Name the sides first. The hypotenuse faces the right angle: it is ${hyp}. Which of the other two does not touch $\theta$?`,
            r`Seen from $\theta$: opposite $= ${opp}$, adjacent $= ${adj}$, hypotenuse $= ${hyp}$.`,
          ],
          explain: r`
            Seen from $\theta$, the opposite side is ${opp}, the adjacent side is ${adj} and the hypotenuse is ${hyp}. So
            $\sin\theta = \frac{${opp}}{${hyp}}$, $\;\cos\theta = \frac{${adj}}{${hyp}}\;$ and $\;\tan\theta = \frac{${opp}}{${adj}}$.
          `,
        };
      },
    },
    {
      id: 'example-height',
      type: 'info',
      title: 'A ratio finds a missing side',
      text: r`
        This is what the ratios are for. Know the angle and one side, and a ratio gives you another side.

        :::example
        A ramp **10 m** long climbs at **35°**, and $\sin 35^\circ \approx 0.57$. How high does it reach?

        1. The height faces the angle: it is the [opposite]{.orange} side. The ramp is the [hypotenuse]{.violet}. Those two make the **sine**.
        2. $\sin 35^\circ = \dfrac{\text{height}}{10}$
        3. Multiply both sides by 10: the height is about $10 \times 0.57 = 5.7$ m.
        :::

        A quick check: the height must come out **shorter** than the ramp, because the hypotenuse is the longest side.
      `,
      figure: {
        type: 'trig-triangle', static: true, angle: 35, size: 10, text: { opp: '?', adj: '', hyp: '10 m', angle: '35°' },
        alt: 'A ramp drawn as a right-angled triangle that climbs at 35 degrees. Its sloping side is 10 metres long, and its height is marked with a question mark.',
      },
    },
    {
      id: 'use-ratio',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const story = rng.pick(STORIES);
        const [angle, value] = rng.pick(story.angles);
        const length = rng.pick(story.lengths);
        const exactValue = angle === 30;
        const answer = Math.round(length * value);
        const tooBig = Math.round((length / value) * 10) / 10;
        // wide enough for someone who uses the calculator's sine instead of the rounded one in the text
        const tolerance = Math.ceil((Math.abs(length * Math.sin((angle * Math.PI) / 180) - answer) + 0.05) * 100) / 100;
        return {
          // only sin 30° = 0.5 is exact; the others are rounded, and the wording says so
          text: `${story.text(length, angle, `the sine of ${angle}° is ${exactValue ? '' : 'about '}**${value}**`)}\n\n**${exactValue ? story.ask.replace(/^./, (c) => c.toUpperCase()) : `About ${story.ask}`}**`,
          answer,
          unit: 'm',
          tolerance,
          wrong: [
            [tooBig, `That divides ${length} by ${value}, which gives more than the length of ${story.slope} itself. The height is the opposite side: multiply.`],
            [length, `That is the length of ${story.slope}, the hypotenuse. The height is the opposite side, and it is shorter.`],
          ],
          hints: [
            `The height is the side opposite the ${angle}° angle, and ${story.slope} is the hypotenuse. Which ratio uses those two?`,
            r`$\sin ${angle}^\circ = \dfrac{\text{height}}{${length}}$, so the height is $${length} \times ${value}$.`,
          ],
          explain: r`
            The height faces the angle (opposite) and ${story.slope} is the hypotenuse, so
            $\sin ${angle}^\circ = \dfrac{\text{height}}{${length}}$. Multiply both sides by ${length}:
            height $${exactValue ? '=' : '\\approx'} ${length} \times ${value} = ${answer}$ m.
          `,
        };
      },
    },
    {
      id: 'tan-45',
      type: 'numeric',
      title: 'A special angle',
      text: r`
        Set the angle to **45°** and compare the two shorter sides.

        **What is $\tan 45^\circ$, the opposite side divided by the adjacent side?**
      `,
      figure: {
        type: 'trig-triangle', angle: 30, size: 8, angleRange: [15, 75], angleStep: 5, sides: 'both', ratios: [],
        alt: 'A right-angled triangle with a slider for its marked angle. The lengths of the opposite side, the adjacent side and the hypotenuse are written on it.',
      },
      answer: 1,
      wrong: [
        [0.71, 'That is the opposite side divided by the hypotenuse: the sine of 45°. The tangent divides by the adjacent side.'],
        [0.707, 'That is the opposite side divided by the hypotenuse: the sine of 45°. The tangent divides by the adjacent side.'],
        [45, 'That is the angle. The question asks for a ratio of two sides.'],
      ],
      hints: ['At 45° the other acute angle is 45° as well, because the two share 90°. What does that tell you about the two shorter sides?'],
      explain: r`
        At 45° the two acute angles are equal, so the two shorter sides are equal too, and
        $\tan 45^\circ = 1$ exactly.
      `,
    },
    {
      id: 'how-big',
      type: 'info',
      title: 'How big can a ratio get?',
      text: r`
        The [hypotenuse]{.violet} is the longest side, and it is underneath in the sine and the cosine.
        So **$\sin\theta$ and $\cos\theta$ are always less than 1**.

        The tangent compares the two shorter sides, so it has no such limit:

        ${trigTable([20, 45, 70]).replace(/\n/g, '\n        ')}

        Below 45° the opposite side is the shorter one and $\tan\theta < 1$. Above 45° it is the longer one and $\tan\theta > 1$.

        You have met this ratio before: opposite over adjacent is *rise over run*, the **slope** of the hypotenuse.
      `,
    },
    {
      id: 'co-ratio',
      type: 'choice',
      stretch: true,
      title: 'From the other corner',
      text: r`
        The acute angles of this triangle are 35° and 55°. Seen from the 35° corner,
        $\sin 35^\circ = \dfrac{\text{opposite}}{\text{hypotenuse}} \approx 0.57$.

        Now stand in the **55° corner**. Which ratio is made of exactly the same two sides, and so is also 0.57?
      `,
      figure: {
        type: 'trig-triangle', static: true, angle: 35, size: 10, text: { opp: '', adj: '', hyp: '', angle: '35°', other: '55°' },
        alt: 'A right-angled triangle whose acute angles are 35 degrees, at the bottom left, and 55 degrees, at the top right.',
      },
      options: [
        { text: r`$\cos 55^\circ$`, correct: true },
        { text: r`$\sin 55^\circ$`, why: r`Seen from the 55° corner, the opposite side is the *other* short side, the longer one. $\sin 55^\circ \approx 0.82$.` },
        { text: r`$\tan 55^\circ$`, why: r`The tangent does not use the hypotenuse at all. $\tan 55^\circ \approx 1.43$.` },
        { text: r`$\cos 35^\circ$`, why: r`That is still seen from the 35° corner, and it uses the adjacent side: $\cos 35^\circ \approx 0.82$.` },
      ],
      hints: ['The side opposite the 35° angle touches the 55° angle. What is it called from there?'],
      explain: r`
        The side opposite the 35° angle is the side **adjacent** to the 55° angle, and the hypotenuse
        is the same from both corners. So $\sin 35^\circ = \cos 55^\circ$.

        The two acute angles of a right-angled triangle always add up to 90°, so in general
        $\sin\theta = \cos(90^\circ - \theta)$.
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: r`Which of these are **true** for an acute angle $\theta$ in a right-angled triangle?`,
      options: [
        { text: r`$\sin\theta$ depends only on the angle, not on the size of the triangle`, correct: true },
        { text: r`$\sin\theta$ and $\cos\theta$ are always less than 1`, correct: true },
        { text: r`$\tan\theta$ can be greater than 1`, correct: true },
        { text: r`Doubling every side of the triangle doubles $\sin\theta$`, why: 'The opposite side and the hypotenuse both double, so their ratio stays exactly the same.' },
        { text: 'The opposite side is always the vertical one', why: 'It is the side facing the angle you are working from, whichever way the triangle is turned.' },
      ],
      explain: r`
        The ratios belong to the angle, so enlarging the triangle changes none of them. The hypotenuse
        is the longest side, which keeps $\sin\theta$ and $\cos\theta$ below 1. The tangent compares the
        two shorter sides, and passes 1 when the angle passes 45°.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: r`
        A calculator gives $\sin 35^\circ = 0.5736$ at the press of a key. It knows nothing about your triangle.

        **Why is the angle alone enough?**
      `,
      model: `
        Every right-angled triangle with a 35° angle has the same three angles: 35°, 55° and 90°.
        So all of them have the same shape. They are enlargements of one another: similar triangles.

        Enlarging multiplies the opposite side and the hypotenuse by the same scale factor, so
        opposite ÷ hypotenuse comes out the same in every one of them. That shared number is what
        the calculator has stored (or works out) for 35°.
      `,
    },
  ],
  recap: [
    'Right-angled triangles with the same angle are similar, so the ratios of their sides depend only on the angle.',
    r`$\sin\theta = \frac{\text{opposite}}{\text{hypotenuse}}$, $\;\cos\theta = \frac{\text{adjacent}}{\text{hypotenuse}}$, $\;\tan\theta = \frac{\text{opposite}}{\text{adjacent}}$ (SOH CAH TOA).`,
    'Opposite and adjacent are named from the angle you are working with. The hypotenuse always faces the right angle.',
    r`$\sin\theta$ and $\cos\theta$ stay below 1. $\tan\theta$ is the slope of the hypotenuse, and $\tan 45^\circ = 1$.`,
  ],
  next: 'Next: use these ratios to measure a tree without climbing it.',
};
