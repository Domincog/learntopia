// The Body II: Control, Defence and Movement · Lesson 5 · Levers and Motors
//
// Driving question: to hold a 5 kg bag in your hand, how hard does your biceps have to pull, and why is the arm built that way?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/body-control/index.js';
import { SKELETON, LEVERS, CONNECTORS, MUSCLE_TYPES, INJURIES, INJURY_STORIES, JOINT_FIGURE, tidyNum } from '../helpers.js';

const ARM = { type: 'arm-lever', reach: SKELETON.forearmReach };
const ARM_ALT = 'An upright upper arm and a level forearm holding a weight. The biceps runs from the shoulder to a point on the forearm near the elbow. Arrows show the pull of the muscle and the weight of the load.';
const N = SKELETON.newtonsPerKg;
const capital = (t) => t[0].toUpperCase() + t.slice(1);
const lower = (t) => t[0].toLowerCase() + t.slice(1);

export default {
  id: 'muscles-bones',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Holding the shopping',
      text: `
        You hold a **5 kg** bag in your hand, elbow bent at a right angle,
        forearm level. Your biceps is doing the holding.

        **How hard is the biceps pulling, compared with the weight of the
        bag?**
      `,
      shuffle: false,
      options: [
        { text: 'Less than the bag weighs: the arm is a lever, and levers make lifting easier' },
        { text: 'About the same as the bag weighs' },
        { text: 'About twice what the bag weighs' },
        { text: 'About eight times what the bag weighs', correct: true },
      ],
      explain: `
        About **eight times**. To hold 5 kg in the hand, the biceps pulls
        with a force that could lift some 40 kg directly.

        The arm is a lever, but one built "the wrong way round". The next
        screen shows why.
      `,
    },
    {
      id: 'lever-explore',
      type: 'interact',
      graded: false,
      title: 'The forearm as a lever',
      text: `
        The forearm pivots at the **elbow**. The load pulls down
        **${SKELETON.forearmReach} cm** from the pivot; the biceps pulls up only
        **${SKELETON.bicepsAttach} cm** from it. Forces are in newtons (N): 1 kg weighs
        about ${N} N.

        **Change the load** a few times. What happens to the muscle's
        pull, and to "times the load"?
      `,
      widget: { ...ARM, load: 5, attach: SKELETON.bicepsAttach, attachRange: null, alt: ARM_ALT },
      check: (s) => s.loads.length >= 3 || 'Try at least three different loads and watch the readouts.',
      solution: { load: 8, loads: [5, 2, 8] },
      explain: `
        The muscle's pull is always **${SKELETON.forearmReach / SKELETON.bicepsAttach} times the load**, whatever the load.

        A lever balances when *force × distance from the pivot* is the
        same on both sides. The load is ${SKELETON.forearmReach / SKELETON.bicepsAttach} times further from the elbow
        than the muscle is, so the muscle must pull ${SKELETON.forearmReach / SKELETON.bicepsAttach} times harder:
        $F \\times ${SKELETON.bicepsAttach} = \\text{load} \\times ${SKELETON.forearmReach}$.

        (The model leaves out the weight of the forearm itself, so real
        muscle forces are higher still.)
      `,
    },
    {
      id: 'lever-attach',
      type: 'interact',
      title: 'Redesign the arm',
      text: `
        That looks like poor design. Suppose the biceps attached further
        down the forearm.

        **Find the attachment point where the muscle needs only 4 times
        the load.** Then look at the third readout: what was given up?
      `,
      widget: { ...ARM, load: 5, loadRange: null, attach: SKELETON.bicepsAttach, attachRange: [2, 8, 1], alt: ARM_ALT },
      check: (s) => s.ratio === 4 || (s.ratio > 4 ? `Now the muscle needs ${s.ratio} times the load. It should be less: move the attachment the other way.` : `That is ${s.ratio} times the load: a little too far.`),
      solution: { attach: 8 },
      hints: ['Further from the elbow means a longer lever arm for the muscle.', `The load is ${SKELETON.forearmReach} cm out. Where is a quarter of that?`],
      explain: `
        At **8 cm** the force halves. But now each centimetre the muscle
        shortens moves the hand only 4 cm instead of 8.

        Muscle can pull very hard but only shortens a little. Attaching
        close to the joint trades spare force for **speed and reach**: a
        small, quick shortening swings the hand through a wide arc. That
        is what lets you throw, type and catch.
      `,
    },
    {
      id: 'example-lever',
      type: 'info',
      title: 'Working out the pull',
      text: `
        The lever rule gives the muscle's force for any arm and any load.

        :::example A worked example
        A hand holds **2 kg**, **28 cm** from the elbow. The biceps
        attaches **4 cm** from the elbow.

        1. The load in newtons: 2 × ${N} = ${2 * N} N.
        2. The load is 28 ÷ 4 = 7 times further from the elbow than the
           muscle is.
        3. So the muscle must pull 7 times harder: ${2 * N} × 7 = **${2 * N * 7} N**.

        Check the balance: ${2 * N * 7} × 4 = ${2 * N * 7 * 4}, and ${2 * N} × 28 = ${2 * N * 28}.
        :::
      `,
      figure: { ...ARM, reach: 28, load: 2, attach: 4, loadRange: null, attachRange: null, static: true, alt: 'An upright upper arm and a level forearm holding a 2 kilogram weight 28 centimetres from the elbow. The biceps is attached to the forearm 4 centimetres from the elbow. Arrows show the weight of the load pulling down and the much larger pull of the muscle upwards.' },
    },
    {
      id: 'lever-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [attach, reach] = rng.pick(LEVERS);
        const kg = rng.int(2, 8);
        const [who, what] = rng.pick([['A waiter', 'a tray'], ['A climber', 'a coil of rope'], ['A gardener', 'a watering can'], ['A parent', 'a toddler\'s car seat'], ['A cook', 'a pan of water']]);
        const weight = kg * N;
        const ratio = reach / attach;
        const force = weight * ratio;
        return {
          text: `
            ${who} holds ${what} weighing **${kg} kg** in one hand, forearm
            level. In this arm the load is **${reach} cm** from the elbow, and
            the biceps attaches **${attach} cm** from the elbow.

            **With what force must the biceps pull?** (1 kg weighs ${N} N.
            Ignore the weight of the forearm.)
          `,
          answer: force,
          unit: 'N',
          wrong: [
            [weight, `That is the weight of the load, ${weight} N. The muscle is much closer to the elbow, so it must pull harder.`],
            [kg * ratio, `Right ratio, but that is in kilograms. The load weighs ${kg} × ${N} = ${weight} N.`],
            [Math.round((weight * attach) / reach * 100) / 100, 'That is the load divided by the ratio. The muscle is on the short arm of the lever, so its force is bigger, not smaller.'],
          ].filter(([v], i, all) => all.findIndex(([w]) => w === v) === i),
          hints: [`First the load in newtons: ${kg} × ${N} = ${weight} N.`, `Balance: force × ${attach} = ${weight} × ${reach}.`],
          explain: `
            The load weighs ${kg} × ${N} = ${weight} N and is ${reach} ÷ ${attach} = ${tidyNum(ratio)} times further
            from the elbow than the muscle is. So the biceps pulls with
            ${weight} × ${tidyNum(ratio)} = **${force} N**: as much as lifting ${tidyNum(force / N)} kg directly.
          `,
        };
      },
    },
    {
      id: 'pairs',
      type: 'interact',
      title: 'Muscles cannot push',
      text: `
        A muscle does one thing: it **shortens**, and so it pulls. It
        cannot push anything back.

        **Bend this elbow, then straighten it again.** Which muscle does
        each job?
      `,
      widget: { type: 'arm-lever', mode: 'pair', alt: 'An arm seen from the side with the biceps on the front of the upper arm and the triceps on the back. Two buttons contract one muscle or the other.' },
      check: (s) => {
        if (s.bent && s.straightened) return true;
        if (s.bent) return 'Bent. Now straighten it: which muscle can pull the forearm back down?';
        if (s.straightened) return 'Straight. Now bend it.';
        return 'Press one of the two buttons.';
      },
      solution: { bent: true, straightened: true, last: 'triceps' },
      explain: `
        The **biceps** bends the elbow; the **triceps**, on the other side
        of the bone, straightens it. Each crosses the joint and pulls on
        the forearm from its own side. While one contracts, the other
        relaxes and is stretched out again. Almost every movable joint has
        such an **opposing pair**.

        Inside a muscle fibre, two kinds of protein thread slide past each
        other and overlap more: the fibre gets shorter and fatter. Nothing
        in that machinery can run in reverse.
      `,
    },
    {
      id: 'pull-only',
      type: 'interact',
      review: true,
      title: 'Find the puller',
      text: `
        You swing your lower leg forward to kick a ball: the knee
        **straightens**. Something must be pulling the shin forward.

        These are the legs seen from the front. **Tap what does the
        pulling.**
      `,
      widget: { type: 'body-map', view: 'leg', mode: 'pick', show: ['leg-bones', 'quadriceps', 'calves'], pickable: ['quadriceps', 'calves', 'kneecap', 'tibia'], answer: 'quadriceps', zoom: false, alt: 'The legs of a body seen from the front, with the bones of the leg, a large muscle group on the front of each thigh and the edge of a muscle on each side of the lower leg.' },
      check: (s) => s.picked === 'quadriceps'
        || (s.picked === 'calves' ? 'The calf muscles lie behind the shin and pull on the heel: they point the foot, they do not straighten the knee.'
          : s.picked === 'kneecap' || s.picked === 'tibia' ? `That is ${s.nameThe}: a bone. Bones are the levers; only a muscle can pull.` : false),
      solution: { picked: 'quadriceps' },
      hints: ['To pull the shin forward, a muscle must lie in front of the knee and cross it.'],
      explain: `
        The **quadriceps** on the front of the thigh pulls on the shin
        (through the kneecap) and straightens the knee. Its partners, the
        **hamstrings** at the back of the thigh, bend it again. Nothing
        pushes: every movement you make is a pull.
      `,
    },
    {
      id: 'teach-joint',
      type: 'info',
      title: 'What holds it together',
      text: `
        Where two bones meet is a **joint**. Some work like a hinge (elbow,
        knee, fingers); the shoulder and hip are ball-and-socket joints
        that turn in every direction.

        Four things keep a joint together and moving:

        ${CONNECTORS.map(([name, job], i) => `${i + 1}. **${name}**: ${lower(job)}.`).join('\n        ')}

        Ligaments also keep a joint from bending the wrong way.
      `,
      figure: JOINT_FIGURE,
    },
    {
      id: 'connectors',
      type: 'match',
      review: true,
      title: 'What holds it together',
      text: `
        A joint, where two bones meet, takes several kinds of tissue to
        hold it together and keep it moving.

        **Match each part of a joint to its job.**
      `,
      pairs: CONNECTORS,
      explain: `
        You can feel a tendon: the cord at the back of your heel ties the
        calf muscle to the heel bone.

        In **osteoarthritis**, the commonest joint disease, the cartilage
        gradually thins and the joint becomes stiff and painful.
      `,
    },
    {
      id: 'xray',
      type: 'interact',
      title: 'Twenty-seven bones',
      text: `
        An adult skeleton has **${SKELETON.adultBones} bones**, and more than half of
        them are in the hands and feet. This is an X-ray of one hand:
        ${SKELETON.handBones} bones, counting the wrist.

        **Tap the wrist: the cluster of ${SKELETON.wristBones} small bones.**
      `,
      widget: photo(MEDIA['hand-xray'], {
        alt: 'An X-ray of an open hand, fingers pointing up. Each finger shows three bones in a row (the thumb two), joined to long bones in the palm. Below the palm is a tight cluster of small rounded bones, and below that the ends of two large bones.',
        caption: 'X-ray of a left hand',
        maxWidth: 380,
        hotspots: [
          { id: 'wrist', x: 0.36, y: 0.8, r: 0.11, label: 'Wrist: 8 small bones', alt: 'a tight cluster of small rounded bones' },
          { id: 'palm', x: 0.29, y: 0.6, r: 0.08, label: 'A bone of the palm', alt: 'a long thin bone' },
          { id: 'finger', x: 0.445, y: 0.225, r: 0.075, label: 'A finger joint (a hinge)', alt: 'a gap between two finger bones' },
          { id: 'thumb', x: 0.83, y: 0.53, r: 0.08, label: 'Thumb: two bones', alt: 'a short, thick digit set apart from the other four' },
        ],
      }),
      check: (s) => s.picked === 'wrist' || (s.picked === 'thumb' ? 'That is the thumb, which has two bones where each finger has three. The wrist is lower down.' : s.picked === 'palm' ? 'That is one of the five long bones of the palm. The wrist is below them.' : s.picked === 'finger' ? 'That is a joint between two finger bones. Look much lower.' : false),
      solution: { picked: 'wrist' },
      explain: `
        Eight wrist bones, five in the palm, fourteen in the fingers and
        thumb. So many small joints are what make a hand so nimble.

        A newborn has about ${SKELETON.birthBones} bones and bony parts. Many fuse during
        growth: on a child's X-ray you would see gaps of cartilage near
        the ends of the long bones, where they are still growing.
      `,
    },
    {
      id: 'teach-bone',
      type: 'info',
      title: 'What bone is',
      text: `
        A skeleton in a museum is dry and dead. The ${SKELETON.adultBones} bones inside
        you are not.

        Bone is a mesh of protein (collagen) hardened with calcium
        phosphate, threaded with blood vessels and full of living cells.
        Some of those cells dissolve old bone; others lay down new. Most
        of an adult's skeleton is renewed about every **${SKELETON.renewYears} years**.

        Inside the bones, soft **marrow** makes all your blood cells.
      `,
      figure: {
        type: 'body-map', view: 'body', show: ['skeleton'], zoom: false,
        markers: [{ at: 'bone-marrow', color: 'red' }],
        labels: [{ at: [250, 540], text: 'Marrow, inside the bone: makes blood cells', column: 'right' }, 'skull', 'ribs', 'pelvis'],
        alt: 'The skeleton of a body facing the viewer, with the skull, the ribs and the pelvis named. A point inside the thigh bone is marked as bone marrow.',
      },
    },
    {
      id: 'bone-alive',
      type: 'choice',
      title: 'Alive or not?',
      text: `
        A broken bone can knit itself together again. **Which description
        of the bone in a living adult fits that?**
      `,
      options: [
        { text: 'A hard mineral frame, like a shell: once grown, it stays as it is', why: 'A frame that stayed as it was could not mend. Bone does hold mineral, but its cells dissolve and rebuild it all the time.' },
        { text: 'Living tissue with a blood supply, constantly dissolved and rebuilt', correct: true },
        { text: 'Hardened cartilage with no cells in it', why: 'Bone is full of living cells and has its own blood supply. Those cells are what do the mending.' },
      ],
      explain: `
        Bone is **alive**, and it never stops being rebuilt. That is how
        fractures heal, and how bone thickens where it is loaded.

        Bone mass peaks at about ${SKELETON.peakBoneAge[0]} to ${SKELETON.peakBoneAge[1]}. If too much is lost later
        (**osteoporosis**), bones break more easily. (Building bone:
        *Movement and Fitness*.)
      `,
    },
    {
      id: 'three-muscles',
      type: 'bucket',
      review: true,
      title: 'Three kinds of muscle',
      text: `
        The muscles that move your skeleton are only one kind.

        - **Skeletal**: attached to bones, under your control (even where
          it usually runs by itself, as breathing does)
        - **Smooth**: in the walls of hollow organs, automatic
        - **Cardiac**: only in the heart, automatic, never rests

        **Sort these.**
      `,
      buckets: ['Skeletal', 'Smooth', 'Cardiac'],
      items: MUSCLE_TYPES.map(([text, kind]) => ({ text, bucket: ['skeletal', 'smooth', 'cardiac'].indexOf(kind), why: text.startsWith('The diaphragm') ? 'The diaphragm is skeletal muscle: you can hold your breath or take a deep one at will. It simply also runs on its own when you stop thinking about it.' : undefined })),
      explain: `
        You have more than ${SKELETON.muscles} skeletal muscles. Smooth muscle squeezes
        food along the gut and sets the width of blood vessels and pupils,
        without your deciding anything. Cardiac muscle beats about a
        hundred thousand times a day for life.
      `,
    },
    {
      id: 'teach-injuries',
      type: 'info',
      title: 'Three words, three tissues',
      text: `
        Three everyday words name three different injuries. Each belongs
        to one tissue.

        | Word | What has happened |
        |---|---|
        ${Object.entries(INJURIES).map(([word, v]) => `| **${capital(word)}** | ${capital(v.what)} |`).join('\n        ')}

        In the picture, the tendon is 1 and the ligament is 2.
      `,
      figure: JOINT_FIGURE,
    },
    {
      id: 'injuries',
      type: 'choice',
      gen: (rng) => {
        const [story, kind] = rng.pick(INJURY_STORIES);
        const options = [...Object.entries(INJURIES).map(([k, v]) => ({ text: v.tissue, correct: k === kind, why: k === kind ? undefined : `Damage to ${v.tissue.toLowerCase()} is a ${k}.` })),
          { text: 'A nerve', why: 'None of these three words describes nerve damage.' }];
        return {
          text: `
            Three everyday words name three different injuries.

            ${story}

            **Which tissue has been damaged?**
          `,
          options,
          explain: `
            A **${kind}** means that ${INJURIES[kind].what}. Sprain: ligament.
            Strain: muscle or tendon. Fracture: bone.

            From the outside they can look alike. A limb that looks out of
            shape, cannot take weight, or is numb needs medical attention
            promptly. (What to do first is in *First Aid*.)
          `,
        };
      },
    },
    {
      id: 'knuckles',
      type: 'choice',
      mode: 'predict',
      title: 'An experiment of one',
      text: `
        "Stop cracking your knuckles, you'll get arthritis!" A doctor named
        Donald Unger tested the warning on himself: for fifty years he
        cracked the knuckles of his **left** hand at least twice a day,
        and left the **right** hand alone.

        **What do you think he found?**
      `,
      options: [
        { text: 'No arthritis in either hand', correct: true },
        { text: 'Arthritis in the left hand only', why: 'That is what the warning predicts, but it is not what happened.' },
        { text: 'Arthritis in both hands, worse on the left', why: 'Neither hand developed arthritis.' },
        { text: 'Arthritis in the right hand only', why: 'Neither hand developed arthritis.' },
      ],
      explain: `
        Neither hand. One person proves little, but larger studies that
        compared X-rays of people who do and do not crack their knuckles
        agree: **no link with arthritis**. The pop comes from a gas bubble
        in the joint fluid.

        A habit can be annoying without being harmful, and a warning can
        be repeated for generations without being true.
      `,
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to notice this week',
      text: `
        You carry the demonstration with you.

        - Rest one hand on the front of your other upper arm and **bend
          the elbow** against a little resistance: the biceps hardens and
          bulges. Now press the hand down on a table: the back of the arm
          hardens instead. An opposing pair, taking turns.
        - Stand up from a chair slowly with a hand on the front of your
          thigh, and feel the muscle that straightens the knee.

        Bones and muscles both grow stronger with use at any age. How to
        use them is the subject of *Movement and Fitness*.
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    'A muscle can only **pull**. Muscles are arranged in opposing pairs (biceps and triceps) so that every joint can move both ways.',
    'Muscles attach close to the joints, so they pull **many times harder** than the load weighs, in exchange for speed and reach.',
    '**Tendons** join muscle to bone and **ligaments** join bone to bone. A sprain injures a ligament; a strain, a muscle or tendon; a fracture, a bone.',
    `Bone is **living tissue**, renewed about every ${SKELETON.renewYears} years. The ${SKELETON.adultBones} bones of an adult also store minerals and make blood cells.`,
  ],
  next: 'Next: every bone, muscle and neuron in this course grew from a single cell. How does one cell become a person, and what changes over a lifetime?',
};
