// The Body II: Control, Defence and Movement · Lesson 1 · Wired
//
// Driving question: why does your hand leave a hot pan before you feel the pain?
import { DISCLAIMER, NERVE, NERVE_PATHS, NERVE_FIBRES, SYNAPSE_STEPS, BRAIN, AUTONOMIC, NEURON_FIGURE, SYNAPSE_FIGURE, REFLEX_FIGURE, tidyNum } from '../helpers.js';

const BRAIN_IDS = Object.keys(BRAIN);
const IMPULSE = { type: 'nerve-impulse', threshold: 4, speeds: { bare: NERVE.slowSpeed, myelin: NERVE.fastSpeed } };

export default {
  id: 'nervous-system',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Faster than thought',
      text: `
        ${DISCLAIMER}

        Your fingertips brush a very hot pan. Two things happen: your hand
        **jerks away**, and you **feel the pain**. Which comes first?
      `,
      shuffle: false,
      options: [
        { text: 'The pain comes first, and makes you pull away' },
        { text: 'The hand moves first; the pain arrives afterwards', correct: true },
        { text: 'Both at exactly the same instant' },
      ],
      explain: `
        The hand moves first. By the time you feel anything, your arm is
        already on its way. To see how that can be, we need to know how fast
        signals travel in the body, and where they go.
      `,
    },
    {
      id: 'reaction-test',
      type: 'interact',
      graded: false,
      title: 'Time yourself',
      text: `
        First, a measurement. **Tap the pad the moment it changes.** Five
        goes.

        Nothing rides on your score, and if you would rather not do it,
        press *Show sample results instead*.
      `,
      widget: { type: 'reaction-timer', rounds: 5, typical: NERVE.reaction, alt: 'A reaction-time test: a pad that changes after a random wait, and a list of the times measured.' },
      check: (s) => s.done || 'Finish the five goes, or press "Show sample results instead".',
      solution: { done: true },
      explain: `
        Most people land between **${NERVE.reaction[0]} and ${NERVE.reaction[1]} milliseconds**: about a quarter
        of a second. A millisecond (ms) is a thousandth of a second.

        Nobody gets near zero, however hard they try. Light has to be turned
        into nerve signals in the eye, the brain has to notice the change and
        order a movement, and the order has to reach the finger. All of that
        takes time.
      `,
    },
    {
      id: 'teach-neuron',
      type: 'info',
      title: 'The cell that carries the signal',
      text: `
        A nerve cell is a **neuron**. Your brain has about **86 billion**
        of them, and some in your legs are a metre long. A signal passes
        through a neuron in one direction only:

        - branching **dendrites** collect incoming signals
        - the **cell body** keeps the cell alive
        - one long **axon** carries the signal away
        - a fatty **myelin sheath** insulates the axon, which lets the
          signal travel far faster
        - the **axon endings** pass the signal on to the next cell

        What we call a *nerve* is a bundle of thousands of axons, like
        wires in a cable.
      `,
      figure: NEURON_FIGURE,
    },
    {
      id: 'neuron-parts',
      type: 'match',
      title: 'Four parts, four jobs',
      text: '**Match each part of a neuron to its job.**',
      figure: NEURON_FIGURE,
      pairs: [
        ['Dendrites', 'Collect incoming signals'],
        ['Axon', 'Carries the signal away'],
        ['Myelin sheath', 'Insulates the fibre'],
        ['Axon endings', 'Pass the signal on'],
      ],
      explain: `
        Signals come in through the branching **dendrites** and leave along
        the single long **axon**, never the other way: a neuron is a
        one-way street.
      `,
    },
    {
      id: 'example-travel-time',
      type: 'info',
      title: 'How fast is a nerve signal?',
      text: `
        A signal runs along a nerve fibre at a steady speed that depends
        on the fibre: about **${NERVE.fastSpeed} metres per second** on the fastest
        fibres, which are wrapped in myelin, and as little as
        **${NERVE.slowSpeed} metre per second** on the slowest, which are bare.

        So the time for a journey is **distance ÷ speed**.

        :::example A worked example
        A signal has **0.6 m** to travel, along a fibre that carries it at
        **30 metres per second**.

        - Time = distance ÷ speed = 0.6 ÷ 30 = 0.02 seconds.
        - One second is 1,000 milliseconds, so that is 0.02 × 1,000 = **20 ms**.
        :::
      `,
      figure: {
        type: 'body-map', view: 'body', show: ['brain', 'spinal-cord', 'nerves'], zoom: false,
        flows: [{ path: ['toes:left', 'knee-joint:left', 'hip-joint:left', [200, 400]], color: 'orange', label: `From the big toe to the spinal cord: about ${tidyNum(NERVE_PATHS[1][1])} m in a tall adult` }],
        labels: ['brain', 'spinal-cord', 'nerves'],
        alt: 'A whole body facing the viewer, showing the brain, the spinal cord and the main nerves that branch from it into the arms and legs. An arrow follows a nerve from the big toe up the leg to the lower end of the spinal cord.',
      },
    },
    {
      id: 'travel-time',
      type: 'numeric',
      title: 'How long is the journey?',
      gen: (rng) => {
        let path;
        let fibre;
        do { path = rng.pick(NERVE_PATHS); fibre = rng.pick(NERVE_FIBRES); } while (!Number.isInteger(Math.round((path[1] / fibre[1]) * 1e6) / 1e3));
        const [where, metres] = path;
        const [kind, speed] = fibre;
        const ms = Math.round((metres / speed) * 1000);
        return {
          text: `
            A nerve signal travels ${where}: **${tidyNum(metres)} m**. It runs along
            ${kind} at **${speed} metres per second**.

            **How many milliseconds does the journey take?** (1 second = 1,000 ms)
          `,
          answer: ms,
          unit: 'ms',
          wrong: [
            [metres / speed, 'That is the time in seconds. Multiply by 1,000 to get milliseconds.'],
            [metres * speed, 'Time is distance divided by speed, not multiplied by it.'],
          ],
          hints: ['Time = distance ÷ speed. That gives seconds.', `${tidyNum(metres)} ÷ ${speed} = ${tidyNum(metres / speed, 4)} s. Now turn it into milliseconds.`],
          explain: `
            ${tidyNum(metres)} m ÷ ${speed} m/s = ${tidyNum(metres / speed, 4)} s, which is **${ms} ms**.

            So the wiring is quick. Of a ${NERVE.reaction[0]} to ${NERVE.reaction[1]} ms reaction, the journeys along
            nerves take only a small share. Most of the time goes on the
            *handovers* between nerve cells, and the brain uses a great many
            of them to make a decision.
          `,
        };
      },
    },
    {
      id: 'impulse-lab',
      type: 'interact',
      graded: false,
      title: 'Poke a neuron',
      text: `
        Here is one neuron with a recorder on its axon. **Set a stimulus
        strength and press Stimulate.**

        Try a weak one, then stronger and stronger ones. Watch two things:
        **how many** impulses there are, and **how big** each one is.
      `,
      widget: { ...IMPULSE, strength: 2, myelinToggle: false, alt: 'A nerve cell with a stimulus arrow on the left and a recording of the voltage on its axon below. A slider sets the strength of the stimulus.' },
      check: (s) => {
        if (!s.runs) return 'Press **Stimulate** to try this strength.';
        if (!s.sawBelow) return 'Now try a weak stimulus: 3 or less.';
        if (s.sawAbove < 2) return s.sawAbove ? 'Try a second, different strength of 4 or more, and compare the two recordings.' : 'Now raise the strength until the neuron fires.';
        return true;
      },
      solution: { strength: 9, tried: [{ strength: 2 }, { strength: 5 }, { strength: 9 }] },
      explain: `
        Below a **threshold** (here, strength 4) nothing travels at all. At
        the threshold the neuron **fires**, and every impulse is the same
        size: about ${NERVE.impulseSize} millivolts, a tenth of a volt.

        A stronger stimulus does not make bigger impulses. It makes
        **more of them each second**. (The numbers here are one model
        neuron's; real neurons differ in their numbers, not in the rule.)
      `,
    },
    {
      id: 'all-or-nothing',
      type: 'choice',
      review: true,
      text: `
        You press gently on your arm, then press hard. The hard press feels
        stronger. **How do the touch neurons tell your brain the difference?**
      `,
      options: [
        { text: 'They send more impulses each second', correct: true },
        { text: 'They send bigger impulses', why: 'An impulse is all-or-nothing: once a neuron fires, every impulse has the same size, however strong the stimulus.' },
        { text: 'They send faster-moving impulses', why: 'The speed is set by the fibre itself (its thickness and its myelin), not by the stimulus.' },
        { text: 'They send one long impulse instead of short ones', why: 'Each impulse lasts about a thousandth of a second and cannot be stretched.' },
      ],
      explain: `
        A nerve impulse is **all-or-nothing**, like a light switch and unlike
        a dimmer. Strength is coded by **how often** a neuron fires (and by
        how many neurons join in), never by the size of the impulse.
      `,
    },
    {
      id: 'myelin',
      type: 'interact',
      attempts: 5,
      title: 'Speeding it up',
      text: `
        On this bare axon an impulse crawls: **1,000 ms for one metre**.

        **Find a way to get one metre done in under 50 ms**, and send an
        impulse to prove it. Will a stronger stimulus do it?
      `,
      widget: { ...IMPULSE, strength: 6, myelin: false, alt: 'A nerve cell with a stimulus arrow and a recording of its impulses. A slider sets the stimulus strength and a switch wraps the axon in a myelin sheath.' },
      check: (s) => {
        if (s.travel < 50 && s.fired) return true;
        if (s.travel < 50) return s.strength < 4 ? 'The sheath is on, but this stimulus is below the threshold: no impulse is sent.' : 'The sheath is on. Now press **Stimulate** to send an impulse.';
        if (!s.fired) return 'Press **Stimulate** to see how long an impulse takes.';
        return s.strength > 6
          ? `A stronger stimulus sends more impulses (${s.rate} a second), but each one still needs ${s.travel} ms for the metre. Change the axon instead.`
          : `Still ${s.travel} ms for one metre. Something about the axon itself has to change.`;
      },
      solution: { strength: 6, myelin: true },
      hints: ['The stimulus only changes how many impulses are sent.', 'Try the switch under the slider.'],
      explain: `
        Only the **myelin sheath** does it: about ${NERVE.fastSpeed} metres a second
        instead of ${NERVE.slowSpeed}. Myelin is a fatty wrapping with small gaps, and the
        impulse leaps from gap to gap instead of creeping along every
        millimetre.

        That is why a stubbed toe hurts twice: a sharp pain arrives at
        once on myelinated fibres, a dull throb about a second later on
        bare ones. And in multiple sclerosis, where patches of myelin are
        damaged, signals along those fibres slow down or fail.
      `,
    },
    {
      id: 'synapse',
      type: 'order',
      title: 'Crossing the gap',
      text: `
        Neurons do not quite touch. Where one meets the next there is a
        tiny gap: a **synapse**. An electrical impulse cannot jump it, so
        the signal crosses as a chemical: a **transmitter**, stored in
        tiny packets at the end of the axon. The next cell carries
        **receptors** that the transmitter fits.

        **Put the handover in order.**
      `,
      figure: SYNAPSE_FIGURE,
      items: SYNAPSE_STEPS,
      labels: ['First', 'Last'],
      explain: `
        Dopamine and serotonin are two transmitters you may have heard
        of. Each handover takes about a millisecond, and
        it is where signals get combined, strengthened or blocked. Many
        medicines, and drugs such as caffeine and alcohol, act at synapses.
      `,
    },
    {
      id: 'teach-reflex',
      type: 'info',
      title: 'In, across and out',
      text: `
        Neurons come in three kinds, named for where they carry signals.

        | Neuron | Carries signals |
        |---|---|
        | [**Sensory**]{.blue} | **in**: from a **receptor** (a cell that detects heat, touch, light…) to the spinal cord and brain |
        | [**Relay**]{.green} | **across**: from one neuron to the next, inside the spinal cord and brain |
        | [**Motor**]{.red} | **out**: from the spinal cord and brain to a muscle, which then contracts |

        Most signals go up to the brain, are weighed there, and an order
        comes back down. A **reflex** is wired to take a short cut.
      `,
      figure: {
        type: 'body-map', view: 'body', bounds: [30, 20, 370, 572], show: ['brain', 'spinal-cord', 'nerves'], zoom: false,
        flows: [
          { path: ['fingertip:left', 'elbow-joint:left', [250, 197], [203, 180]], color: 'blue', label: 'Sensory neurons: signals in' },
          { path: [[203, 150], 'brain'], color: 'green', label: 'Relay neurons: inside the spinal cord and brain', dashed: true },
          { path: [[197, 180], [150, 197], 'elbow-joint:right', 'forearm:right'], color: 'red', label: 'Motor neurons: orders out to muscles' },
        ],
        alt: 'The upper half of a body facing the viewer, with the brain, the spinal cord and the main nerves. One arrow runs from a fingertip up the arm into the spinal cord; a dashed line runs up the spinal cord to the brain; another arrow runs from the spinal cord down the other arm to its muscles.',
      },
    },
    {
      id: 'reflex-arc',
      type: 'fill',
      review: true,
      title: 'The short cut',
      text: `
        Touch a hot pan and your hand jerks away before you feel any
        pain. A **reflex** like this is wired to skip the brain. The
        picture shows the route, numbered 1 to 5.
        **Complete the description.**
      `,
      figure: REFLEX_FIGURE,
      template: `
        Heat is picked up by a [[muscle|*receptor|relay neuron]] in the skin (1).
        A [[motor|relay|*sensory]] neuron (2) carries the signal into the spinal cord.
        There a [[*relay|sensory|motor]] neuron (3) passes it straight to a
        [[sensory|*motor|relay]] neuron (4), which makes the [[receptor|brain|*muscle]] (5) contract.
      `,
      explain: `
        Three neurons, two synapses, and no detour to the head: a **sensory**
        neuron in, a **relay** neuron across the spinal cord, a **motor**
        neuron out. The cord also sends the news up to the brain, but that
        route is longer and has many more synapses.

        So the hand moves first, and the pain arrives a moment later.
      `,
    },
    {
      id: 'brain-explore',
      type: 'interact',
      graded: false,
      title: 'Headquarters',
      text: `
        The brain and spinal cord form the **central nervous system**; the
        nerves that fan out from them are the **peripheral** one.

        Here is a head cut down the middle, facing left. **Tap at least
        five parts of the brain** and read what each one does.
      `,
      widget: { type: 'body-map', view: 'head', mode: 'explore', show: ['skull', 'cerebrum', 'cerebellum', 'brainstem', 'spinal-cord'], pickable: [...BRAIN_IDS, 'spinal-cord'], alt: 'A head seen from the side and cut open down the middle, showing the brain inside the skull: four large regions of the wrinkled upper brain, a smaller ridged part at the lower back, and a stalk leading down into the spinal cord.' },
      check: (s) => s.seenCount >= 5 || 'Tap a few more parts of the brain.',
      solution: { seen: ['frontal-lobe', 'parietal-lobe', 'occipital-lobe', 'temporal-lobe', 'cerebellum', 'brainstem'] },
      explain: `
        Four lobes of the wrinkled **cerebrum**, the **cerebellum** tucked
        underneath, and the **brainstem** leading down to the spinal cord:

        | Part | Deals mainly with |
        |---|---|
        ${BRAIN_IDS.map((id) => `| ${BRAIN[id][0]} | ${BRAIN[id][1]} |`).join('\n        ')}

        Much of this map was first drawn by noticing what people lose
        when one part is injured.
      `,
    },
    {
      id: 'brain-regions',
      type: 'interact',
      review: true,
      title: 'What an injury reveals',
      gen: (rng) => {
        const id = rng.pick(BRAIN_IDS);
        return {
          text: `
            After an injury to one part of the brain, a person has
            **${BRAIN[id][2]}**.

            **Tap the part of the brain most likely to be injured.**
          `,
          widget: { type: 'body-map', view: 'head', mode: 'pick', show: ['skull', 'cerebrum', 'cerebellum', 'brainstem', 'spinal-cord'], pickable: BRAIN_IDS, labels: BRAIN_IDS, answer: id, alt: 'A head seen from the side and cut open down the middle, with six parts of the brain named: the frontal, parietal, temporal and occipital lobes, the cerebellum and the brainstem.' },
          check: (s) => s.picked === id || (BRAIN[s.picked] ? `That is ${s.nameThe}, which deals mainly with ${BRAIN[s.picked][1]}. Injury there would more likely cause ${BRAIN[s.picked][2]}.` : false),
          solution: { picked: id },
          hints: [`Which part deals with ${BRAIN[id][1]}?`],
          explain: `
            The **${BRAIN[id][0].toLowerCase()}** deals mainly with ${BRAIN[id][1]}, so
            damage there can cause ${BRAIN[id][2]}.

            The regions never work alone, though: even reading this
            sentence uses most of them at once.
          `,
        };
      },
    },
    {
      id: 'teach-whole-brain',
      type: 'info',
      title: 'All of it, both halves, always changing',
      text: `
        Brain scans and studies of injuries agree on three things.

        - **Every region is in use.** Scans show activity in all of them
          over a day, and damage to almost any part causes some loss. The
          brain is only about 2% of body weight, yet it uses about
          **${NERVE.brainEnergyShare}%** of the body's energy at rest.
        - **The two halves work together**, through a thick bridge of
          fibres. Some jobs lean to one side (language is mostly on the
          left in most people), but nobody runs on one half.
        - **Learning rewires it.** Practice strengthens some synapses and
          prunes others. This is **plasticity**: greatest in childhood,
          and it continues throughout life.
      `,
      figure: { type: 'body-map', view: 'head', show: ['skull', 'cerebrum', 'cerebellum', 'brainstem', 'spinal-cord'], labels: BRAIN_IDS, alt: 'A head seen from the side and cut open down the middle, with six parts of the brain named: the frontal, parietal, temporal and occipital lobes, the cerebellum and the brainstem.' },
    },
    {
      id: 'myths',
      type: 'bucket',
      review: true,
      title: 'Brain facts and brain myths',
      text: 'Each of these statements about the brain is often repeated. **Which are supported by the evidence?**',
      buckets: ['Supported by evidence', 'Myth'],
      items: [
        { text: 'We use only 10% of our brains', bucket: 1, why: 'Every region shows activity over a day, and damage to almost any part causes some loss. There is no idle 90%.' },
        { text: `The brain uses about a fifth of the body's energy at rest`, bucket: 0, why: `About ${NERVE.brainEnergyShare}% is a fifth. A tissue that costly would not be kept if nine-tenths of it did nothing.` },
        { text: 'People are either "left-brained" or "right-brained"', bucket: 1, why: 'Some jobs lean to one side, but a study of brain scans from over a thousand people found no sign that individuals favour one half overall.' },
        { text: 'Learning changes the connections between neurons', bucket: 0, why: 'That is plasticity: practice strengthens some synapses and prunes others.' },
        { text: 'The adult brain can no longer change', bucket: 1, why: 'Plasticity continues throughout life: adults learn languages, instruments and new skills after injuries.' },
        { text: 'A nerve impulse is the same size however strong the stimulus', bucket: 0 },
      ],
      explain: `
        The whole brain is in use, both halves together, and its wiring
        keeps changing as you learn. The course *How to Learn Anything* is
        about using that plasticity well.
      `,
    },
    {
      id: 'autonomic',
      type: 'bucket',
      title: 'The part you do not steer',
      gen: (rng) => {
        const pick = (branch) => rng.sample(AUTONOMIC.filter((a) => a[1] === branch), 3);
        const items = rng.shuffle([...pick('sympathetic'), ...pick('parasympathetic')]);
        return {
          text: `
            Heartbeat, digestion, sweating and the size of your pupils are run
            by the **autonomic** nervous system, without your deciding
            anything. It has two branches that pull in opposite directions:

            - **sympathetic**: gets the body ready for action
            - **parasympathetic**: settles it for rest and digestion

            Picture a sprint: the body wants more blood and air for the
            muscles, fuel released, wide pupils, sweat to keep cool, and
            digestion left for later. **Which branch does each of these?**
          `,
          buckets: ['Sympathetic: action', 'Parasympathetic: rest'],
          items: items.map(([effect, branch]) => ({ text: effect, bucket: branch === 'sympathetic' ? 0 : 1 })),
          explain: `
            Whatever a sprint needs is the **sympathetic** branch at work.
            The **parasympathetic** branch does the opposite once the rush
            is over. Both are always active; the balance shifts. (The
            stress response is followed up in *Sleep, Stress and Mental
            Health*.)
          `,
        };
      },
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to notice this week',
      text: `
        Your nervous system reports on itself all day, if you look.

        - **A reflex.** Next time a doctor's hammer, a sudden noise or a
          puff of air makes you kick, flinch or blink, notice that you
          moved *before* you decided to.
        - **Two pains.** If you bump a toe or an elbow, notice the sharp
          signal and then the slow one.
        - **Practice.** Pick any small skill (a chord, a card shuffle,
          typing a new word). A few minutes on a few different days will
          feel different by the end of the week. That is synapses changing.

        None of this is a test. It is simply your own wiring, working.
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    `A **neuron** collects signals on its dendrites and sends impulses down one axon. The brain has about 86 billion of them.`,
    'An impulse is **all-or-nothing**: a stronger stimulus means more impulses, not bigger ones. **Myelin** makes them travel up to about 100 m/s.',
    'Neurons hand signals on across **synapses** using chemical transmitters. A **reflex** takes a short cut through the spinal cord, so you move before you feel.',
    'The whole brain is in use, its regions specialise but cooperate, and learning rewires it for life.',
  ],
  next: 'Next: the nervous system is only as good as its information. How do eyes, ears and skin turn the world into nerve impulses?',
};
