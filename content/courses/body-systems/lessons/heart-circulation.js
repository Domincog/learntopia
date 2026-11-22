// The Body I: Fuel, Air and Blood · Lesson 2 · The Pump and the Loop
//
// Driving question: why does your heart have two sides?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/body-systems/index.js';
import { HEART, BLOOD_PATH, VESSEL_KINDS, VESSEL_FACTS, PEOPLE, grouped } from '../helpers.js';

const HEART_ALT = 'A diagram of the heart seen from the front, so the person\'s right side is on the left of the picture. On each side an upper chamber, the atrium, leads through an inlet valve to a lower chamber, the ventricle, and an outlet valve leads to an artery. The right side holds blood that is poor in oxygen and sends it to the lungs. The left side holds blood that is rich in oxygen and sends it to the body.';

const VALVE_NAMES = { tricuspid: 'right inlet valve', mitral: 'left inlet valve', pulmonary: 'right outlet valve', aortic: 'left outlet valve' };
const listValves = (ids) => ids.map((v) => VALVE_NAMES[v]).join(' and the ');

export default {
  id: 'heart-circulation',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Two pumps in one',
      text: `
        Your heart is really **two pumps** joined side by side, beating together. The
        left-hand pump sends blood out to the whole body, from scalp to toes.

        **Where does the right-hand pump send its blood?**
      `,
      figure: {
        type: 'body-map', view: 'chest', show: ['heart', 'lungs', 'windpipe', 'bronchi'], labels: ['heart', { id: 'right-lung', text: 'Lungs' }],
        alt: 'The chest seen from the front. The heart, about the size of a fist, sits in the middle between the two lungs, with its tip pointing to the person\'s left.',
        caption: 'The figure faces you: the person\'s left is on your right.',
      },
      options: [
        { text: 'To the right half of the body' },
        { text: 'Only to the lungs', correct: true },
        { text: 'To the whole body as well, as a back-up' },
        { text: 'To the head and brain' },
      ],
      explain: `
        Only to the **lungs**, a few centimetres away. Blood goes round **two loops**:
        heart → lungs → heart, then heart → body → heart.

        Why have two pumps for that, and not one? Step through a heartbeat and see what
        each side does.
      `,
    },
    {
      id: 'step-through',
      type: 'interact',
      graded: false,
      title: 'One heartbeat, in slow motion',
      text: `
        This heart is drawn as if you were **facing the person**, so their right side is on
        your left. Each side has an upper chamber, the **atrium**, that receives blood, and
        a lower one, the **ventricle**, that pumps it out. A **valve** guards the way into
        each ventricle and another the way out. Numbers are pressures in **mmHg**, the
        unit used for blood pressure.

        **Press "Next moment" until you have seen the whole beat.** Watch the four
        valves: when does each pair open and close?
      `,
      widget: { type: 'heart-cycle', mode: 'cycle', alt: HEART_ALT },
      check: (s) => s.seen.length === 5 || `You have seen ${s.seen.length} of the 5 moments of the beat. Keep pressing **Next moment**.`,
      solution: { beats: 1 },
      explain: `
        The valves into the ventricles are open while the ventricles fill, and shut the
        moment the ventricles squeeze. Only then do the valves out of them open. The next
        screen puts names to what you saw.
      `,
    },
    {
      id: 'teach-beat',
      type: 'info',
      title: 'Four valves, two sounds',
      text: `
        Two **inlet valves** let blood into the ventricles, and two **outlet valves** let
        it out. Nothing pulls them: they are flaps, pushed open or shut by the blood itself.

        | The ventricles | Inlet valves | Outlet valves |
        |---|---|---|
        | relax and fill | open | shut |
        | squeeze | shut | open |

        The two pairs are never open together, so blood can only move forwards.

        Each pair shuts with a snap, and that is the sound of a heartbeat. **"Lub"**: the
        inlet valves shut as the ventricles start to squeeze. **"Dub"**: the outlet valves
        shut as the ventricles relax.
      `,
      figure: { type: 'heart-cycle', mode: 'cycle', static: true, phase: 'eject', pressures: false, valveNames: true, alt: `${HEART_ALT} The picture shows the moment when the ventricles squeeze: the two inlet valves, tricuspid and mitral, are shut, and the two outlet valves, pulmonary and aortic, are open.` },
    },
    {
      id: 'one-way',
      type: 'interact',
      title: 'You are the valves',
      text: `
        Now the valves are yours. The ventricles are squeezing hard: this is
        **ejection**, with 120 mmHg in the left ventricle.

        **Tap the valves to open or close them, until blood moves forward only.**
        The drawing shows what your setting would do.
      `,
      widget: { type: 'heart-cycle', mode: 'valves', phase: 'eject', open: ['tricuspid', 'mitral'], alt: HEART_ALT },
      check: (s) => {
        if (s.oneWay) return true;
        if (s.backflow.length) return `Blood is running backwards through the ${listValves(s.backflow)}: the pressure in the squeezing ventricle is higher than in the atrium above it.`;
        return `Blood is held up behind the ${listValves(s.blocked)}. The ventricle is squeezing, but its way out is shut.`;
      },
      solution: { open: ['aortic', 'pulmonary'] },
      hints: ['Blood always moves from higher pressure to lower pressure. Compare the numbers on both sides of each valve.', 'While the ventricles squeeze, their inlets must be shut and their outlets open.'],
      explain: `
        Inlets shut, outlets open. With the inlet valves open, the squeeze would push
        blood **back** into the atria and the veins. With the outlets shut, it could not
        leave at all.

        A leaky or stiff heart valve does exactly what you just saw, and the heart
        has to work harder to make up for it.
      `,
    },
    {
      id: 'lub-dub',
      type: 'fill',
      review: true,
      title: 'Four chambers, four valves, two sounds',
      text: `
        Each side has an upper chamber, the **atrium**, that receives blood, and a
        lower one, the **ventricle**, that pumps it out, with an **inlet valve** between
        them and an **outlet valve** at the exit.

        A heartbeat sounds like "lub-dub". Both sounds are valves snapping shut.
        **Complete the sentences.**
      `,
      figure: { type: 'heart-cycle', mode: 'cycle', static: true, phase: 'fill', pressures: false, valveNames: true, alt: `${HEART_ALT} The valves are named: tricuspid and pulmonary on the right side, mitral and aortic on the left.` },
      template: `"Lub": the two [[outlet|*inlet]] valves shut as the ventricles start to [[*squeeze|relax]]. "Dub": the two [[*outlet|inlet]] valves shut as the ventricles [[squeeze|*relax]].`,
      explain: `
        **Lub**: the ventricles squeeze and the inlet valves (tricuspid and mitral) shut.
        **Dub**: the ventricles relax and the outlet valves (pulmonary and aortic) shut,
        so blood cannot fall back in. This is what a stethoscope listens for.
      `,
    },
    {
      id: 'teach-lap',
      type: 'info',
      title: 'One lap, two loops',
      text: `
        One lap for a red blood cell, starting as it comes back from the body:

        **${BLOOD_PATH.join(' → ')}**

        The right side collects used blood and sends it to the lungs next door, at about
        ${HEART.rightPeak} mmHg. The left side collects it from the lungs and drives it round the
        whole body, at about ${HEART.leftPeak} mmHg. **Follow the lap with the arrow under the picture.**

        The colours are only a convention. Real blood is always red: bright red when it
        is loaded with oxygen, darker red when it has given some up.
      `,
      figure: {
        type: 'body-map', view: 'heart', stepThrough: true,
        labels: ['right-atrium', 'right-ventricle', 'left-atrium', 'left-ventricle'],
        flows: [
          { path: ['superior-vena-cava', 'right-atrium'], color: 'blue', label: 'From the body into the right atrium' },
          { path: ['right-atrium', 'tricuspid-valve', 'right-ventricle'], color: 'blue', label: 'Into the right ventricle' },
          { path: ['right-ventricle', [196, 262], 'pulmonary-artery'], color: 'blue', label: 'Out to the lungs' },
          { path: ['pulmonary-veins', 'left-atrium'], color: 'red', label: 'Back from the lungs into the left atrium' },
          { path: ['left-atrium', 'mitral-valve', 'left-ventricle'], color: 'red', label: 'Into the left ventricle' },
          { path: ['left-ventricle', [240, 262], 'aorta'], color: 'red', label: 'Out to the whole body' },
        ],
        alt: 'The heart opened up, seen from the front, with its four chambers and the large vessels joined to them. Arrows can be stepped through one at a time to follow the blood through the right side, out to the lungs, back into the left side and out to the body.',
      },
    },
    {
      id: 'follow-blood',
      type: 'order',
      review: true,
      title: 'One lap',
      text: `
        A red blood cell has just dropped off its oxygen in a leg muscle and is
        returning to the heart through a vein.

        **Put its next stops in order.**
      `,
      items: BLOOD_PATH,
      labels: ['Back from the body', 'One lap later'],
      hints: ['Blood from the body always arrives on the right side of the heart.', 'An atrium receives; the ventricle below it pumps. The lungs lie between the right side and the left.'],
      explain: `
        **Right atrium → right ventricle → lungs → left atrium → left ventricle → body.**
        The right side collects used blood and sends it to the lungs for oxygen. The left
        side collects it from the lungs and sends it round the body. At rest, a lap takes
        about a minute.
      `,
    },
    {
      id: 'why-thicker',
      type: 'choice',
      title: 'Why two sides?',
      text: `
        Both ventricles pump the **same amount** of blood with every beat. Yet the muscle
        wall of the left ventricle is about three times as thick as that of the right.

        **Why?**
      `,
      figure: {
        type: 'body-map', view: 'body', show: ['heart', 'lungs', 'arteries', 'aorta'], dim: false, zoom: false,
        flows: [
          { path: ['heart', 'right-lung'], color: 'blue', label: 'Right side: to the lungs and back' },
          { path: ['heart', 'aorta', 'toes:left'], color: 'red', label: 'Left side: to the whole body and back' },
        ],
        alt: 'The whole body with the heart, the lungs and the main arteries. A short arrow runs from the heart to the lungs beside it, and a long one from the heart down to the toes.',
      },
      options: [
        { text: 'The left must push blood much further, against much higher pressure', correct: true },
        { text: 'The left pumps more blood with each beat', why: 'It cannot: the two pumps are in series, so whatever one sends on, the other must send on too. Otherwise blood would pile up in the lungs or in the body.' },
        { text: 'The left has to pump thicker, oxygen-rich blood', why: 'Oxygen-rich blood is no thicker. What differs is the pressure needed to drive it.' },
        { text: 'The right side rests on every second beat', why: 'Both sides contract on every beat, at the same moment.' },
      ],
      explain: `
        The left ventricle drives blood through the whole body at about
        **${HEART.leftPeak} mmHg**. The lungs are close by, and their thin air sacs would be
        flooded by that pressure: the right ventricle needs only about
        **${HEART.rightPeak} mmHg**.

        That is the reason for two sides: **two circuits that need very different
        pressures**, and a visit to the lungs on every single lap.
      `,
    },
    {
      id: 'teach-vessels',
      type: 'info',
      title: 'Three kinds of pipe',
      text: [
        'Blood leaves the heart in **arteries**, which branch into microscopic **capillaries** that reach every tissue. The capillaries join up into **veins**, which lead back to the heart.',
        '',
        ...VESSEL_KINDS.map((kind, k) => `- **${kind}**: ${VESSEL_FACTS.filter((f) => f.kind === k).map((f) => f.text.charAt(0).toLowerCase() + f.text.slice(1)).join('; ')}.`),
        '',
        'Arteries take the full force of each beat, and a pulse is that pressure wave travelling along one. In the veins the pressure is low, so valves keep the blood moving towards the heart.',
      ].join('\n'),
      figure: {
        type: 'body-map', view: 'body', show: ['heart', 'arteries', 'veins'], dim: false, zoom: false,
        groups: [
          { ids: ['arteries', 'aorta'], color: 'red', label: 'Main arteries: away from the heart' },
          { ids: ['veins', 'venae-cavae'], color: 'blue', label: 'Main veins: back to the heart' },
        ],
        alt: 'The whole body with the heart and the main blood vessels. Arteries, drawn red, run from the heart to the head, the arms and the legs. Veins, drawn blue, run beside them back to the heart. Capillaries are too small to draw.',
        caption: 'Only the main trunks are drawn. The capillaries between them are far too fine to see.',
      },
    },
    {
      id: 'vessels',
      type: 'bucket',
      review: true,
      title: 'Three kinds of pipe',
      text: `
        Blood leaves the heart in **arteries**, which branch into microscopic
        **capillaries** that reach every tissue. The capillaries join up into **veins**,
        which lead back to the heart.

        **Which vessel does each line describe?**
      `,
      buckets: VESSEL_KINDS,
      items: VESSEL_FACTS.map((f) => ({ text: f.text, bucket: f.kind, why: f.why })),
      explain: `
        **Arteries** carry the pressure wave of each beat, so they are thick and elastic.
        **Capillaries** are so narrow that red cells pass in single file, and their walls
        are thin enough for exchange. **Veins** carry blood back at low pressure, helped by
        valves and by the squeeze of your muscles.
      `,
    },
    {
      id: 'blue-blood',
      type: 'choice',
      title: 'Blue blood?',
      text: `
        Diagrams draw oxygen-poor blood in blue, and the veins on the inside of your wrist
        do look bluish.

        **What colour is the blood inside those veins?**
      `,
      options: [
        { text: 'Dark red', correct: true },
        { text: 'Blue, until it meets the air', why: 'A common belief, but blood taken from a vein into a sealed tube, with no air, is dark red.' },
        { text: 'Purple', why: 'Darker than blood from an artery, but still clearly red.' },
        { text: 'Bright red, the same as in arteries', why: 'Not quite: having given up part of its oxygen, blood in veins is a darker red.' },
      ],
      explain: `
        **Dark red.** Human blood is always red: bright red when it is loaded with
        oxygen, darker when it has given some up. Veins look blue because of the way
        light is scattered and absorbed on its way through skin.

        The blue in diagrams (and in this lesson) is only a convention.
      `,
    },
    {
      id: 'harvey',
      type: 'choice',
      title: 'How we know it goes round',
      text: `
        Until the 1600s, doctors believed that blood was made fresh in the liver and soaked
        away into the body. In **${HEART.harvey}** the English physician William Harvey published
        this experiment. A band round the upper arm makes the veins stand out, with little
        knots along them (B, C and D).

        Below, a finger presses at H, and the blood has been stroked out of the vein
        from H up to the knot O. That stretch **stays empty**, although the vein beyond O is full.
        **What does this show?**
      `,
      figure: photo(MEDIA['harvey-veins'], {
        alt: 'An engraving in two parts. Above: a forearm with a band tied round the upper arm and a hand gripping a rod; the veins stand out and have small knots along them, marked B, C and D. Below: the same arm; a finger presses on a vein at a point marked H, and the vein is drawn empty from H to a knot marked O, and full beyond O towards the upper arm.',
        caption: 'From William Harvey, *De Motu Cordis*, 1628',
        creditLabel: 'Engraving',
      }),
      options: [
        { text: 'The knots are valves: blood in veins can pass only towards the heart', correct: true },
        { text: 'Veins carry blood from the heart out to the hand', why: 'Then blood from the upper arm would have run down past O and refilled the empty stretch at once. It did not.' },
        { text: 'Blood moves back and forth in veins, like a tide', why: 'That was the old view. A tide would have refilled the empty stretch from above. Nothing came back past the knot at O.' },
      ],
      explain: `
        The knots are **valves**. Blood can be pushed through them towards the heart, but it
        cannot come back. When Harvey lifted his finger, the vein refilled from the hand side.
        Veins lead only to the heart and arteries only away from it, so the blood must travel
        in a circle: the **circulation**.

        His second argument was a sum. It comes next.
      `,
    },
    {
      id: 'teach-output',
      type: 'info',
      title: 'Rate times volume',
      text: `
        How much blood does a heart move? Multiply the **heart rate** (beats a minute) by
        the volume of each beat (the **stroke volume**). The result is the
        **cardiac output**.

        :::example
        A heart beats 100 times a minute and pushes out 50 mL each time.

        - In a minute: 100 × 50 mL = 5,000 mL, which is 5 litres (1 litre = 1,000 mL).
        - In an hour: 5 litres × 60 = 300 litres.
        :::

        About ${HEART.output} litres a minute is what an adult body needs at rest: nearly all the
        blood it holds, every minute. Try other pairs with the sliders.
      `,
      figure: { type: 'heart-cycle', mode: 'output', rate: 100, stroke: 50, alt: 'Two sliders, heart rate and stroke volume, and a bar showing the litres of blood pumped each minute. They start at 100 beats a minute and 50 millilitres a beat, which gives 5 litres a minute.' },
    },
    {
      id: 'harvey-sum',
      type: 'numeric',
      gen: (rng) => {
        const rate = rng.pick([60, 65, 70, 75, 80]);
        const stroke = rng.pick([60, 70, 80]);
        const perMin = (rate * stroke) / 1000;      // litres a minute: at most two decimals
        const answer = (rate * stroke * 6) / 100;   // litres an hour: always a whole number here
        return {
          text: `
            A resting heart beats **${rate} times a minute**, and each beat pushes
            **${stroke} mL** of blood out of the left ventricle.

            **How many litres does it pump in one hour?** (1 litre = 1,000 mL)
          `,
          answer,
          unit: 'litres',
          wrong: [
            [perMin, 'That is the amount pumped in one minute. An hour has 60 of them.'],
            [rate * stroke * 60, 'That is the answer in millilitres. Divide by 1,000 to get litres.'],
            [rate * stroke, 'That is millilitres in one minute. Change it to litres, then multiply by the 60 minutes of an hour.'],
          ],
          hints: [
            `In one minute: ${rate} × ${stroke} mL = ${grouped(rate * stroke)} mL, which is ${perMin} litres.`,
            `In one hour: ${perMin} litres × 60.`,
          ],
          explain: `
            ${rate} × ${stroke} mL = ${grouped(rate * stroke)} mL = ${perMin} litres a minute, and ${perMin} × 60 =
            **${grouped(answer)} litres an hour**. Yet an adult body holds only about ${HEART.bloodVolume} litres of
            blood. Nobody could make that much fresh blood from food: it has to be the
            same blood, going round and round. That was Harvey's proof.
          `,
        };
      },
    },
    {
      id: 'pulse',
      type: 'numeric',
      review: true,
      figure: {
        type: 'body-map', view: 'body', show: ['heart', 'arteries'], dim: false, zoom: false,
        markers: [
          { at: 'pulse-wrist:left', label: 'Wrist', color: 'red', labelPos: 'right' },
          { at: 'pulse-arm:right', label: 'Inner upper arm', color: 'red', labelPos: 'left' },
          { at: 'pulse-foot:left', label: 'Top of the foot', color: 'red', labelPos: 'right' },
        ],
        alt: 'The body with the heart and the main arteries. Three points are marked where an artery runs close under the skin: the inside of the wrist below the thumb, the inner side of the upper arm and the top of the foot.',
      },
      gen: (rng) => {
        const [name, their] = rng.pick(PEOPLE);
        const window = rng.pick([10, 15, 20, 30]);
        const times = 60 / window;
        const rate = rng.int(Math.ceil(54 / times), Math.floor(96 / times)) * times;
        const count = rate / times;
        return {
          text: `
            Each beat sends a pressure wave along the arteries: the **pulse**. You can feel it
            where an artery runs close under the skin, most easily with two fingertips on the
            inside of the wrist, below the thumb. A short count is scaled up to a full minute:
            7 beats in 6 seconds would be 7 × 10 = 70 a minute.

            ${name} sits quietly, finds ${their} pulse and counts **${count} beats in ${window} seconds**.
            **What is ${their} heart rate in beats per minute?**
          `,
          answer: rate,
          unit: 'beats a minute',
          wrong: [
            [count, `That is the number of beats in ${window} seconds. A minute is ${times} times as long.`],
            [count * window, `Multiply by the number of ${window}-second stretches in a minute (${times}), not by ${window}.`],
          ],
          hints: [`How many times does ${window} seconds fit into a minute?`, `${window} seconds fits ${times} times into 60 seconds, so multiply the count by ${times}.`],
          explain: `
            A minute is ${times} × ${window} seconds, so the rate is ${count} × ${times} = **${rate} beats a minute**.
            For adults at rest, ${HEART.restingRate[0]} to ${HEART.restingRate[1]} a minute is typical. Very fit people are
            often lower, and the rate changes with age, heat, caffeine, medicines and emotion.
          `,
        };
      },
    },
    {
      id: 'output',
      type: 'interact',
      title: 'Rate times volume',
      text: `
        The blood pumped each minute, the **cardiac output**, is the heart rate times the
        stroke volume.

        An endurance athlete may have a resting heart rate of only **50**. Their body still
        needs about ${HEART.output} litres a minute. **Set the sliders to show how.**
      `,
      widget: { type: 'heart-cycle', mode: 'output', rate: 70, stroke: 70, alt: 'Two sliders, heart rate and stroke volume, and a bar showing the litres of blood pumped each minute.' },
      check: (s) => {
        if (s.rate !== 50) return 'First set the heart rate to 50 beats a minute.';
        if (Math.abs(s.output - 5) < 0.01) return true;
        return s.output < 5
          ? `At 50 beats a minute, ${s.stroke} mL a beat gives only ${s.output} litres a minute. Each beat has to move more.`
          : `At 50 beats a minute, ${s.stroke} mL a beat gives ${s.output} litres a minute: more than the ${HEART.output} needed at rest.`;
      },
      solution: { rate: 50, stroke: 100 },
      hints: ['Fewer beats, the same output: each beat must carry more blood.', 'You need 50 × (stroke volume) = 5,000 mL.'],
      explain: `
        50 × **100 mL** = 5 litres a minute. Regular endurance training makes the heart
        muscle stronger and its chambers a little larger, so each beat moves more blood,
        and fewer beats are needed at rest.

        In hard exercise both numbers rise, and the output can reach 20 litres a minute or more.
      `,
    },
    {
      id: 'pressure',
      type: 'fill',
      title: 'What "120 over 80" measures',
      text: `
        A blood pressure reading has two numbers, such as **120/80**. Both are pressures
        in the large arteries, in mmHg (millimetres of mercury: how high the pressure would
        push a column of mercury).

        Step through the beat and watch the number beside the artery **to the body**. Then
        **complete the sentence.**
      `,
      figure: { type: 'heart-cycle', mode: 'cycle', alt: HEART_ALT },
      template: 'The first, higher number is the pressure in the arteries while the ventricles [[fill|*squeeze|rest]]. The second, lower number is the pressure [[in the veins|in the lungs|*between beats]].',
      explain: `
        Each squeeze drives blood into the arteries and the pressure peaks: the first
        number (**systolic**). Between beats the stretched artery walls keep
        the blood moving while the pressure sinks to its lowest: the second number
        (**diastolic**).

        What counts as too high, and why it matters, comes in *Staying Well*.
      `,
    },
    {
      id: 'notice',
      type: 'info',
      title: 'Something to try this week',
      text: `
        An invitation, if you would like to: sit quietly for a few minutes, rest two
        fingertips on the inside of your wrist below the thumb, and count the beats for
        30 seconds. Later, count again just after climbing some stairs.

        There is no number to aim for and nothing to write down. Simply notice how fast
        your heart answers when your muscles ask for more.

        :::note
        A resting pulse that is often above 100 or feels irregular is worth mentioning to a doctor
        or nurse. So is one below 60 that comes with dizziness or faintness (a low rate alone is
        common in fit people). It is easy to check. Chest pain, fainting or severe breathlessness
        needs urgent help: call your emergency number.
        :::
      `,
    },
  ],
  recap: [
    'The heart is **two pumps**: the right side sends blood to the lungs, the left side sends it round the body. Each has an atrium, a ventricle and two one-way valves.',
    '**Right atrium → right ventricle → lungs → left atrium → left ventricle → body.** "Lub" is the inlet valves shutting, "dub" the outlet valves.',
    'Two sides, because the two circuits need different pressures: about 25 mmHg for the lungs, about 120 mmHg for the body.',
    '**Arteries** carry blood away under pressure, **capillaries** do the exchange, **veins** bring it back. Output = heart rate × stroke volume, about 5 litres a minute at rest.',
  ],
  next: 'Next: what is actually in those five litres? A delivery service, a defence force and a repair crew.',
};
