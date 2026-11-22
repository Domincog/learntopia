// The Body II: Control, Defence and Movement · Lesson 4 · Your Standing Army
//
// Driving question: why do you catch some diseases only once?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/body-control/index.js';
import { BARRIERS, INFLAMMATION, ADAPTIVE_STEPS, RESPONSE, IMMUNE_FAULTS, IMMUNE_CLAIMS } from '../helpers.js';

const lower = (t) => t[0].toLowerCase() + t.slice(1);
const ALT = 'Two pairs of graphs side by side, for a first meeting with a microbe and for a meeting months later. The upper graphs show microbes in the body; the lower graphs show antibodies.';

export default {
  id: 'immune-system',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Once is enough',
      text: `
        A child catches measles, is ill for about a week, and recovers.
        Thirty years later the same virus gets into their body again.

        **What do you expect to happen?**
      `,
      shuffle: false,
      options: [
        { text: 'They fall ill again, just as badly' },
        { text: 'They fall ill, but a little less badly' },
        { text: 'Almost certainly nothing they would notice', correct: true },
      ],
      explain: `
        Almost certainly nothing. Having measles once protects nearly
        everyone for life. Thirty years on, the body still "knows" that
        virus and destroys it before it can cause illness.

        A system with no brain that remembers for decades: how?
      `,
    },
    {
      id: 'teach-barriers',
      type: 'info',
      title: 'First, keep them out',
      text: `
        Microbes are everywhere, and most never get in. The first line of
        defence is not cells at all but **barriers**.

        ${BARRIERS.map(([barrier, how]) => `- **${barrier}**: ${lower(how)}.`).join('\n        ')}

        Trouble starts only when a barrier is breached: a cut, a burn, or
        a virus that latches onto the cells lining the nose.
      `,
      figure: {
        type: 'body-map', view: 'body', bounds: [70, 30, 330, 440], show: ['windpipe', 'bronchi', 'stomach'], zoom: false,
        labels: [
          { id: 'eye', text: 'Tears', column: 'right' },
          { id: 'windpipe', text: 'Mucus and tiny hairs', column: 'left' },
          { id: 'stomach', text: 'Stomach acid', column: 'right' },
          { at: [97, 300], text: 'Skin', column: 'left' },
        ],
        alt: 'The head and trunk of a body facing the viewer, with four barriers named: tears at the eye, mucus and tiny hairs in the windpipe, acid in the stomach, and the skin all over.',
      },
    },
    {
      id: 'barriers',
      type: 'match',
      title: 'Four barriers at work',
      text: '**Match each barrier to the microbes it stops.**',
      pairs: BARRIERS.map(([barrier, , example]) => [barrier, example]),
      explain: `
        Skin, mucus, acid and tears stop the great majority of microbes
        without any fight.
      `,
    },
    {
      id: 'phagocyte',
      type: 'interact',
      title: 'Second, eat them',
      text: `
        This picture was taken with an electron microscope and coloured
        afterwards. One of your **white blood cells** has caught some
        bacteria and is swallowing them. Cells that do this are called
        **phagocytes** ("eating cells"): much bigger than bacteria, they
        wrap themselves round microbes and digest them. The white bar is
        5 thousandths of a millimetre long.

        **Tap the white blood cell.**
      `,
      widget: photo(MEDIA.neutrophil, {
        alt: 'A microscope picture on a dark background. A large, lumpy, ruffled yellow shape reaches out an arm towards a bundle of thin, straight orange rods; one rod is half inside the yellow shape. A white scale bar lies along the bottom.',
        caption: 'A neutrophil engulfing anthrax bacteria',
        hotspots: [
          { id: 'cell', x: 0.7, y: 0.42, r: 0.13, label: 'White blood cell (a neutrophil)', alt: 'a large, lumpy yellow shape' },
          { id: 'bacteria', x: 0.32, y: 0.62, r: 0.085, label: 'Bacteria', alt: 'thin straight orange rods' },
          { id: 'bar', x: 0.2, y: 0.92, r: 0.05, label: 'Scale bar: 5 micrometres', alt: 'a white line along the bottom' },
        ],
      }),
      check: (s) => s.picked === 'cell' || (s.picked === 'bacteria' ? 'Those thin rods are the bacteria. The cell that eats them is much bigger than they are.' : s.picked === 'bar' ? 'That is the scale bar. The white blood cell is the thing doing the swallowing.' : false),
      solution: { picked: 'cell' },
      explain: `
        The big yellow cell is the phagocyte: a neutrophil, the commonest
        white blood cell.

        Phagocytes are part of the **innate** defences: ready from birth,
        on the scene within minutes, and the same for every invader. They
        do not improve with practice.
      `,
    },
    {
      id: 'teach-inflammation',
      type: 'info',
      tone: 'sober',
      title: 'Signs of work in progress',
      text: `
        A splinter goes in. Within hours the skin around it is red, warm,
        swollen and sore. That is **inflammation**: the defence arriving,
        not the damage itself. Each sign has a cause.

        | What you notice | What is happening |
        |---|---|
        ${INFLAMMATION.map(([sign, cause]) => `| ${sign} | ${cause} |`).join('\n        ')}
      `,
      figure: {
        type: 'body-map', view: 'skin',
        labels: [{ id: 'skin-vessels', text: 'Blood vessels: widen and leak' }, { id: 'nerve-endings', text: 'Nerve endings: grow more sensitive' }],
        alt: 'A block of skin cut through, showing its layers, a hair, glands, small blood vessels and nerve endings. The blood vessels and the nerve endings are named.',
      },
    },
    {
      id: 'inflammation',
      type: 'match',
      tone: 'sober',
      title: 'Signs of work in progress',
      text: `
        Around a splinter the skin has become red, warm, swollen and sore.
        **Match each sign of inflammation to its cause.**
      `,
      pairs: INFLAMMATION,
      explain: `
        More blood, leakier vessels, more sensitive nerves: every sign is
        the defence at work. The
        same goes for **fever**: signals from white cells make the brain
        turn up the body's thermostat (see *The Body I*), which speeds up
        defences and slows many microbes.

        :::warn
        A fever with a stiff neck, a rash that does not fade when pressed,
        confusion or trouble breathing is an emergency: call your emergency
        number. Any fever (38 °C, 100.4 °F, or more) in a baby under three
        months needs medical help **urgently**, the same day.
        :::
      `,
    },
    {
      id: 'first-meeting',
      type: 'interact',
      graded: false,
      title: 'Third, the specialists',
      text: `
        Some microbes multiply faster than phagocytes can eat them. Then a
        slower, far more precise defence takes over. Its best-known weapons
        are **antibodies**.

        **Let this body meet microbe A for the first time.** Watch when
        the antibodies appear, and how long the illness lasts.
      `,
      widget: { type: 'immune-response', second: [], alt: ALT },
      check: (s) => s.count >= 1 || 'Press **Meet microbe A**.',
      solution: { exposures: ['first'] },
      explain: `
        For about **${RESPONSE.first.lag} days** there are hardly any antibodies, and the
        microbes multiply freely: the person is ill. Antibodies peak
        around day ${RESPONSE.first.peakDay}, the microbes are cleared, and the illness has
        lasted about a week.

        These are typical textbook curves; real infections differ a
        great deal in their timing. But why any delay? The next step
        shows what is happening in those first days.
      `,
    },
    {
      id: 'teach-adaptive',
      type: 'info',
      title: 'Why the delay?',
      text: `
        You carry millions of different **lymphocytes** (another kind of
        white cell), each able to recognise one particular molecular
        shape. They wait in **lymph nodes**, small organs clustered in the
        neck, the armpits and the groin.

        When a new microbe arrives, phagocytes carry fragments of it to a
        lymph node. Only a handful of lymphocytes fit them. Those few
        switch on and **divide again and again** into a large clone:

        - **B cells** pour out **antibodies** that fit the microbe
        - **killer T cells** destroy body cells it has already invaded
        - **memory cells** stay for years after the rest have died away
      `,
      figure: {
        type: 'body-map', view: 'body', bounds: [60, 100, 340, 520], show: ['lymph-nodes'], zoom: false,
        labels: ['lymph-nodes-neck', 'lymph-nodes-armpit', 'lymph-nodes-groin'],
        alt: 'The head, trunk and upper legs of a body facing the viewer, with clusters of small bead-like lymph nodes named at the sides of the neck, in the armpits and in the groin.',
      },
    },
    {
      id: 'clonal',
      type: 'order',
      review: true,
      title: 'Finding the right cells',
      text: `
        You carry millions of different **lymphocytes** (another kind of
        white cell), each able to recognise one particular molecular
        shape. For any new microbe, only a handful fit.

        **Put the response in order.**
      `,
      items: ADAPTIVE_STEPS,
      labels: ['First', 'Last'],
      explain: `
        A handful of matching cells must multiply into millions before
        antibodies and killer cells arrive. That is the delay you saw.

        This is the **adaptive** response: slow the first time, but
        tailor-made. And it leaves **memory cells** behind.
      `,
    },
    {
      id: 'lock-and-key',
      type: 'choice',
      title: 'Made to measure',
      text: `
        Someone who has recovered from measles has plenty of antibodies
        against the measles virus. They give **no protection against flu**.
        Why not?
      `,
      options: [
        { text: 'Each antibody fits the shape of one particular molecule', correct: true },
        { text: 'Antibodies are used up after one infection', why: 'They do fade, but the memory cells that make them remain. The trouble is fit, not supply.' },
        { text: 'Antibodies only work against bacteria', why: 'Antibodies work against viruses, bacteria and toxins alike. Measles and flu are both viruses.' },
        { text: 'Flu is too mild to need antibodies', why: 'Flu can be severe, and the body makes antibodies against it too: different ones.' },
      ],
      explain: `
        An antibody is a Y-shaped protein whose tips fit one molecular
        shape, the way a key fits one lock. A molecule that sets off an
        immune response is called an **antigen**. Measles antibodies stick
        to measles antigens and to nothing else.
      `,
    },
    {
      id: 'second-meeting',
      type: 'interact',
      attempts: 6,
      title: 'Months later',
      text: `
        This body has already met microbe A, and recovered. Now it meets a
        microbe again. **Try both possibilities** and compare them:

        - the **same** microbe, A
        - a **new** one, B
      `,
      widget: { type: 'immune-response', exposures: ['first'], second: ['same', 'different'], alt: ALT },
      check: (s) => {
        if (s.sawSame && s.sawDifferent) return true;
        if (s.sawSame) return 'That is the memory response. Now try **a new microbe, B** and compare.';
        if (s.sawDifferent) return 'A slow first response all over again. Now try **A again** and compare.';
        return 'Press one of the "Months later" buttons.';
      },
      solution: { exposures: ['first', 'different'], sawSame: true, sawDifferent: true },
      explain: `
        **A again:** antibodies within about ${RESPONSE.memory.lag} days, a peak some
        ${RESPONSE.memory.times} times higher, and the microbes never get far enough to cause
        illness. Memory cells were waiting, already numerous.

        **A new microbe, B:** the memory of A is useless, and the slow
        first response starts from scratch.

        This is why measles comes once, and it is the principle behind
        every **vaccine**: give the system a safe first meeting.
        (More in *Staying Well*.)
      `,
    },
    {
      id: 'who-remembers',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const first = { lag: rng.int(5, 8), peak: rng.int(11, 14), level: rng.pick([1, 2]) };
        const memory = { lag: rng.int(1, 3), peak: rng.int(4, 7), level: rng.pick([20, 30, 50]) };
        const [nameA, nameB] = rng.sample(['Asha', 'Ben', 'Chidi', 'Dara', 'Emre', 'Farah'], 2);
        const memoryFirst = rng.bool();
        const a = memoryFirst ? memory : first;
        const b = memoryFirst ? first : memory;
        const right = memoryFirst ? nameA : nameB;
        const wrongName = memoryFirst ? nameB : nameA;
        return {
          text: `
            Two example people are exposed to the same virus on the same
            day. Their blood is tested daily for antibodies against it.

            | | ${nameA} | ${nameB} |
            |---|:---:|:---:|
            | Antibodies first detected | day ${a.lag} | day ${b.lag} |
            | Antibody peak | day ${a.peak} | day ${b.peak} |
            | Peak level (units) | ${a.level} | ${b.level} |

            **Who had met this virus (or its vaccine) before?**
          `,
          shuffle: false,
          options: [
            { text: nameA, correct: memoryFirst, why: memoryFirst ? undefined : `${nameA}'s antibodies took ${a.lag} days to appear and stayed low: the slow response of a first meeting.` },
            { text: nameB, correct: !memoryFirst, why: memoryFirst ? `${nameB}'s antibodies took ${b.lag} days to appear and stayed low: the slow response of a first meeting.` : undefined },
            { text: 'Neither: both responses are first meetings', why: `Look at ${right}: antibodies by day ${memory.lag} and a far higher peak. Only memory cells can do that.` },
          ],
          explain: `
            **${right}.** Antibodies on day ${memory.lag} rather than day ${first.lag}, and a peak of
            ${memory.level} units against ${wrongName}'s ${first.level}: sooner, faster and stronger. That is
            the signature of **memory cells**. ${wrongName} is meeting the virus for
            the first time.
          `,
        };
      },
    },
    {
      id: 'lymph-nodes',
      type: 'interact',
      title: 'Where the army gathers',
      text: `
        That multiplying happens in **lymph nodes**: small bean-shaped
        organs packed with lymphocytes, clustered where they can filter
        the fluid draining from a region of the body. The figure shows
        the three main clusters, the spleen and the thymus.

        A person has a **sore throat** and can feel tender lumps.
        **Tap the lymph nodes that have swollen.**
      `,
      widget: { type: 'body-map', view: 'body', bounds: [60, 100, 340, 520], mode: 'pick', show: ['lymph-nodes', 'spleen', 'thymus'], pickable: ['lymph-nodes', 'spleen', 'thymus'], answer: 'lymph-nodes-neck', zoom: false, alt: 'The head, trunk and upper legs of a body facing the viewer. Small clusters of bead-like organs are drawn at the sides of the neck, in both armpits and in both groins; one organ lies behind the breastbone and one in the upper abdomen on the person\'s left.' },
      check: (s) => s.picked === 'lymph-nodes-neck'
        || (s.picked === 'lymph-nodes-armpit' ? 'Those are the nodes of the armpit. They filter fluid from the arm and the chest wall, so they would swell with an infected cut on the hand.'
          : s.picked === 'lymph-nodes-groin' ? 'Those are the nodes of the groin, which filter fluid from the leg.'
            : s.picked === 'spleen' ? 'That is the spleen. It filters the blood, not the fluid from the throat.'
              : s.picked === 'thymus' ? 'That is the thymus, where T cells mature. It does not swell with a sore throat.' : false),
      solution: { picked: 'lymph-nodes-neck' },
      hints: ['Nodes filter the fluid from the nearest part of the body.'],
      explain: `
        The **neck** nodes: the nearest ones to the throat. When people
        say their "glands are up", these are what they feel. They are not
        hormone glands at all: the swelling is the clone from the last
        step, multiplying.

        Nodes usually settle as the infection clears. A lump that keeps
        growing, feels hard, or has not gone down after a week or two is
        worth showing to a doctor.
      `,
    },
    {
      id: 'teach-misfires',
      type: 'info',
      tone: 'sober',
      title: 'Three ways to go wrong',
      text: `
        A defence this powerful can be aimed at the wrong target, or be
        weakened.

        - **Allergy.** A false alarm: the system attacks something
          harmless.
        - **Autoimmune disease.** The system mistakes part of the body for
          an invader, and attacks the body's own cells.
        - **A weakened immune system.** Something has worn the defences
          down, so that infections get through.
      `,
    },
    {
      id: 'misfires',
      type: 'bucket',
      tone: 'sober',
      review: true,
      title: 'When the system gets it wrong',
      text: `
        A defence this powerful can be aimed at the wrong target, or be
        weakened. **Sort the examples.**
      `,
      buckets: ['Allergy: a harmless thing attacked', 'Autoimmune: the body\'s own cells attacked', 'Immune system weakened'],
      items: IMMUNE_FAULTS.map(([text, kind]) => ({ text, bucket: ['allergy', 'autoimmune', 'deficiency'].indexOf(kind) })),
      explain: `
        Most allergies are a nuisance. A severe one (**anaphylaxis**:
        swelling of the throat, trouble breathing, collapse) is an
        emergency: call your emergency number at once. (What to do is
        covered in *First Aid*.)

        **HIV** is a virus that infects the helper T cells which
        coordinate the adaptive response; untreated, it slowly wears the
        defences down. With today's daily treatment, people with HIV live
        long, healthy lives, and when treatment keeps the virus
        undetectable in their blood they do not pass it on through sex.
      `,
    },
    {
      id: 'teach-support',
      type: 'info',
      title: 'What really helps',
      text: `
        "Boosts your immune system!" sells a great many products. The
        evidence is plainer.

        - Nothing you can buy makes a healthy immune system "stronger".
          You would not want it stronger: an overactive one is what
          allergy and autoimmune disease are.
        - It can be **looked after**: enough sleep, enough food with
          variety, not smoking. A real shortage weakens it; topping up
          beyond enough does not strengthen it.
        - It can be **trained safely**, with vaccines.
        - **Antibiotics** act only on bacteria. Colds are caused by
          viruses.
      `,
    },
    {
      id: 'boosting',
      type: 'bucket',
      title: '"Boosts your immune system!"',
      gen: (rng) => {
        const items = rng.shuffle([...rng.sample(IMMUNE_CLAIMS.filter((c) => c[1]), 3), ...rng.sample(IMMUNE_CLAIMS.filter((c) => !c[1]), 3)]);
        return {
          text: `
            The phrase sells a great many products. **Which of these does
            good evidence support as helping the immune system do its job?**
          `,
          buckets: ['Supported by good evidence', 'Not supported'],
          items: items.map(([text, ok, note]) => ({ text, bucket: ok ? 0 : 1, why: note })),
          explain: `
            What the evidence supports is looking after the system you
            have (sleep, enough food, not smoking) and training it safely
            with vaccines. For people who are not short of anything,
            products sold as "boosting" it have not been shown to prevent
            infections.
          `,
        };
      },
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to notice',
      text: `
        Next time you have a cold or a sore throat, you can read your own
        defences at work:

        - the sore, red throat is **inflammation**: blood and white cells
          arriving
        - a raised temperature is your thermostat **turned up on purpose**
        - tender lumps under the jaw are **lymph nodes** full of dividing
          cells
        - and feeling better after a week or so is the **adaptive
          response** arriving, leaving memory cells behind.

        If you are curious, you could also find out which vaccines you
        have had. A family doctor or local health service can tell you
        what is recommended where you live.
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    '**Barriers** (skin, mucus, acid, tears) keep most microbes out; **phagocytes** and inflammation deal quickly with those that get in.',
    'The **adaptive** response is slow the first time: the few lymphocytes that fit the invader must multiply before antibodies and killer cells arrive.',
    '**Memory cells** remain, so a second meeting with the same microbe is met sooner, faster and far more strongly, often with no illness.',
    'Allergy and autoimmune disease are the system misfiring. No product "boosts" it; sleep, enough food, not smoking and vaccines support it.',
  ],
  next: 'Next: from the cells that defend you to the machinery that moves you. How do 206 bones and some 600 muscles turn a nerve impulse into a step?',
};
