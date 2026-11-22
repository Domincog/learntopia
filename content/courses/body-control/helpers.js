// The Body II: Control, Defence and Movement · facts, figures and shared diagrams.
//
// Every number a lesson states lives here once, with the source it was checked against (body and year).
// The course test (tests/body-control-course.test.mjs) keeps its own independently typed copy of the
// key figures and fails when the two disagree. Values are typical, not universal: the lessons say so.

/** The standard disclaimer of the Health path: once per course, word for word, on the first lesson. */
export const DISCLAIMER = '> **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.';

/** "1,000" */
export const grouped = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** Tidy number text: no float noise, no trailing zeros. */
export const tidyNum = (v, places = 2) => String(Math.round(v * 10 ** places) / 10 ** places);

/* ============================================================ 1 · nervous system */

export const NERVE = {
  neurons: 86e9,            // neurons in a human brain: Azevedo, Herculano-Houzel et al., J. Comp. Neurol. 2009 (86.1 ± 8.1 billion)
  fastSpeed: 100,           // m/s, large myelinated fibres: physiology textbooks give up to about 100–120 m/s
  slowSpeed: 1,             // m/s, thin unmyelinated (C) fibres: textbooks give about 0.5–2 m/s
  impulseSize: 100,         // mV from resting level (about −70 mV) to peak (about +30 mV)
  reaction: [200, 300],     // ms, typical simple reaction time to something seen (about 250 ms on average in large samples)
  brainEnergyShare: 20,     // % of the body's resting energy used by the brain (about 2% of body mass): textbook figure
};

/** Paths along which a signal travels, for the travel-time questions: [what, metres]. */
export const NERVE_PATHS = [
  ['from a fingertip to the spinal cord', 0.8],
  ['from the big toe to the spinal cord of a tall adult', 1.2],
  ['from the knee to the spinal cord', 0.5],
  ['from the sole of the foot to the spinal cord', 1],
];
/** Fibre types for those questions: [name, m/s]. All inside the range physiology textbooks give for myelinated fibres. */
export const NERVE_FIBRES = [
  ['a fast, thickly myelinated fibre', 100],
  ['a myelinated touch fibre', 50],
  ['a myelinated fibre', 40],
  ['a thinly myelinated fibre', 20],
];

/** The reflex arc, in order. */
export const REFLEX_ARC = [
  'A receptor in the skin detects the heat',
  'A sensory neuron carries the signal to the spinal cord',
  'A relay neuron in the spinal cord passes it straight across',
  'A motor neuron carries the signal out to the arm',
  'The muscle contracts and pulls the hand away',
];

/** What happens at a synapse, in order. */
export const SYNAPSE_STEPS = [
  'An impulse arrives at the end of the axon',
  'Tiny packets release a chemical transmitter into the gap',
  'The transmitter crosses the gap and locks onto receptors',
  'The next cell becomes more likely (or less likely) to fire',
];

/** Brain regions: body-map id → [name, what it mainly does, what damage there can cause]. Matches the body-map notes. */
export const BRAIN = {
  'frontal-lobe': ['Frontal lobe', 'planning, decisions, speech and voluntary movement', 'trouble planning, a change in personality, or weakness on one side'],
  'parietal-lobe': ['Parietal lobe', 'touch and the sense of where the body is', 'numbness, or losing track of one side of the body'],
  'temporal-lobe': ['Temporal lobe', 'hearing, memory and understanding language', 'trouble understanding speech or forming new memories'],
  'occipital-lobe': ['Occipital lobe', 'vision', 'loss of part of the field of vision, although the eyes are healthy'],
  cerebellum: ['Cerebellum', 'balance and smooth, coordinated movement', 'clumsy, unsteady movement'],
  brainstem: ['Brainstem', 'breathing, heartbeat and other vital functions', 'lost control of breathing and heartbeat'],
};

/** The two branches of the autonomic system: [effect, branch]. Standard physiology. */
export const AUTONOMIC = [
  ['Heart beats faster', 'sympathetic'],
  ['Pupils widen', 'sympathetic'],
  ['Airways widen', 'sympathetic'],
  ['Digestion is put on hold', 'sympathetic'],
  ['Sweating increases', 'sympathetic'],
  ['The liver releases stored glucose', 'sympathetic'],
  ['Heart beats more slowly', 'parasympathetic'],
  ['Pupils narrow', 'parasympathetic'],
  ['Saliva flows and digestion gets going', 'parasympathetic'],
  ['Airways narrow back to their resting width', 'parasympathetic'],
];

/* ------------------------------------------------------------------ diagrams */

const INK = 'class="fill-none stroke-ink" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
const label = (x, y, text, cls = 'fig-label-sm', anchor = 'middle') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${text}</text>`;
const badge = (x, y, n, hueName = 'orange') => `<circle class="fill-${hueName} stroke-ink" stroke-width="2.5" cx="${x}" cy="${y}" r="13"/><text class="fig-label" x="${x}" y="${y + 5}" text-anchor="middle" fill="#1D1B26" style="fill:#1D1B26;stroke:none">${n}</text>`;

/** A neuron with its parts named. */
export const NEURON_FIGURE = {
  type: 'svg', viewBox: '0 20 560 200', maxWidth: 480,
  alt: 'A nerve cell drawn from left to right: short branching dendrites, a round cell body with a nucleus, then one long thin axon wrapped in a row of myelin segments with small gaps between them, ending in a spray of small knobs.',
  content:
    // dendrites
    ['M92 110 L50 66', 'M92 110 L40 110', 'M92 110 L52 156', 'M62 78 L50 46', 'M62 78 L30 78', 'M60 146 L32 150', 'M60 146 L52 182', 'M92 110 L84 58', 'M92 110 L88 168'].map((d) => `<path ${INK} d="${d}"/>`).join('') +
    // axon
    `<line ${INK} stroke-width="4" x1="118" y1="110" x2="470" y2="110"/>` +
    // myelin
    [0, 1, 2, 3, 4].map((i) => `<rect class="fill-yellow-soft stroke-ink" stroke-width="2.5" x="${146 + i * 64}" y="97" width="54" height="26" rx="13"/>`).join('') +
    // terminals
    ['M470 110 L512 74', 'M470 110 L520 110', 'M470 110 L512 146', 'M492 91 L520 56', 'M492 129 L520 166'].map((d) => `<path ${INK} d="${d}"/>`).join('') +
    [[514, 72], [524, 110], [514, 148], [522, 53], [522, 169]].map(([x, y]) => `<circle class="fill-ink" cx="${x}" cy="${y}" r="5.5"/>`).join('') +
    // cell body
    '<circle class="fill-violet-soft stroke-ink" stroke-width="3" cx="100" cy="110" r="26"/><circle class="fill-violet" cx="100" cy="110" r="8"/>' +
    // labels
    label(40, 212, 'dendrites') + '<path class="stroke-hair fill-none" stroke-width="2" d="M40 198 L46 160"/>' +
    label(110, 34, 'cell body') + '<path class="stroke-hair fill-none" stroke-width="2" d="M108 40 L102 82"/>' +
    label(300, 156, 'axon') + '<path class="stroke-hair fill-none" stroke-width="2" d="M270 143 L205 112"/>' +
    label(300, 70, 'myelin sheath') + '<path class="stroke-hair fill-none" stroke-width="2" d="M300 76 L300 96"/>' +
    label(498, 212, 'axon endings') + '<path class="stroke-hair fill-none" stroke-width="2" d="M500 198 L514 158"/>' +
    '<path class="stroke-orange fill-none" stroke-width="3" stroke-linecap="round" d="M150 190 H420 M408 182 L420 190 L408 198"/>' + label(285, 182, 'direction of the signal', 'fig-label-sm text-orange'),
};

/** A synapse: the end of one neuron, the gap, and the surface of the next cell. */
export const SYNAPSE_FIGURE = {
  type: 'svg', viewBox: '0 0 420 250', maxWidth: 360,
  alt: 'The swollen end of an axon sits just above the surface of another cell, separated from it by a narrow gap. Inside the axon ending are small round packets; dots of transmitter are spilling from them into the gap and reaching cup-shaped receptors on the cell below.',
  content:
    '<path class="fill-violet-soft stroke-ink" stroke-width="3" stroke-linejoin="round" d="M180 0 V52 C120 60 104 100 108 128 C112 150 150 156 210 156 C270 156 308 150 312 128 C316 100 300 60 240 52 V0 Z"/>' +
    [[150, 96], [196, 84], [246, 98], [176, 126], [230, 128], [272, 124]].map(([x, y]) => `<circle class="fill-surface stroke-ink" stroke-width="2.5" cx="${x}" cy="${y}" r="13"/><circle class="fill-orange" cx="${x - 4}" cy="${y - 3}" r="2.6"/><circle class="fill-orange" cx="${x + 4}" cy="${y}" r="2.6"/><circle class="fill-orange" cx="${x - 1}" cy="${y + 5}" r="2.6"/>`).join('') +
    [[160, 166], [176, 176], [200, 168], [214, 180], [236, 170], [252, 178], [190, 186], [228, 188]].map(([x, y]) => `<circle class="fill-orange" cx="${x}" cy="${y}" r="3.4"/>`).join('') +
    '<path class="fill-blue-soft stroke-ink" stroke-width="3" stroke-linejoin="round" d="M60 250 V206 C60 198 70 196 84 196 H336 C350 196 360 198 360 206 V250 Z"/>' +
    [150, 190, 230, 270].map((x) => `<path class="fill-none stroke-ink" stroke-width="3" stroke-linecap="round" d="M${x - 10} 190 V200 H${x + 10} V190"/>`).join('') +
    label(60, 30, 'end of the axon', 'fig-label-sm', 'start') + '<path class="stroke-hair fill-none" stroke-width="2" d="M150 34 L176 44"/>' +
    label(336, 96, 'packets of', 'fig-label-sm', 'start') + label(336, 111, 'transmitter', 'fig-label-sm', 'start') + '<path class="stroke-hair fill-none" stroke-width="2" d="M332 100 L288 118"/>' +
    label(18, 178, 'the gap', 'fig-label-sm', 'start') + '<path class="stroke-hair fill-none" stroke-width="2" d="M72 174 L140 176"/>' +
    label(210, 236, 'the next cell, with receptors'),
};

/** The withdrawal reflex: finger on something hot, in at the back of the spinal cord, straight out to the arm muscle. */
export const REFLEX_FIGURE = {
  type: 'svg', viewBox: '16 0 550 280', maxWidth: 560,
  alt: 'A diagram of a reflex. A fingertip touches a hot pan (1). A blue nerve fibre (2) runs from the finger up the arm into the spinal cord. Inside the cord a short green neuron (3) links it to a red nerve fibre (4) that runs back down to a muscle in the upper arm (5). A dashed line continues from the spinal cord upwards, labelled "to the brain".',
  content:
    // hot pan and hand
    '<rect class="fill-gray-soft stroke-ink" stroke-width="3" x="24" y="246" width="120" height="22" rx="8"/><path class="stroke-red fill-none" stroke-width="3" stroke-linecap="round" d="M52 236 q6 -10 0 -20 M84 236 q6 -10 0 -20 M116 236 q6 -10 0 -20"/>' +
    '<path class="fill-orange-soft stroke-ink" stroke-width="3" stroke-linejoin="round" d="M150 238 C132 244 120 240 118 232 C116 224 130 218 150 214 L218 178 L236 208 Z"/>' +
    // forearm and upper arm
    '<path class="fill-orange-soft stroke-ink" stroke-width="3" stroke-linejoin="round" d="M218 178 L330 150 L340 186 L236 208 Z"/>' +
    '<path class="fill-orange-soft stroke-ink" stroke-width="3" stroke-linejoin="round" d="M330 150 L352 44 L392 50 L340 186 Z"/>' +
    '<path class="fill-red-soft stroke-ink" stroke-width="2.5" d="M350 70 C332 98 334 126 342 150 C358 126 366 96 366 72 Z"/>' +
    // spinal cord cross-section
    '<ellipse class="fill-surface stroke-ink" stroke-width="3" cx="480" cy="104" rx="56" ry="46"/>' +
    '<path class="fill-gray-soft stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M450 76 C462 88 470 92 480 92 C490 92 498 88 510 76 C516 90 510 100 500 104 C510 108 518 122 510 136 C498 124 490 118 480 118 C470 118 462 124 450 136 C442 122 450 108 460 104 C450 100 444 90 450 76 Z"/>' +
    // sensory neuron (blue): finger → up the arm → into the back of the cord
    '<path class="stroke-blue fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M128 230 L226 190 L338 164 L372 60 C390 30 440 40 458 84"/>' +
    // relay (green)
    '<path class="stroke-green fill-none" stroke-width="4" stroke-linecap="round" d="M458 86 C470 100 468 112 462 126"/>' +
    // motor neuron (red): out of the front of the cord → muscle
    '<path class="stroke-red fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M462 128 C440 170 400 140 356 112"/>' +
    // to the brain
    '<path class="stroke-ink fill-none" stroke-width="2.5" stroke-dasharray="5 7" stroke-linecap="round" d="M480 58 V14 M472 24 L480 12 L488 24"/>' + label(494, 24, 'to the brain', 'fig-label-sm', 'start') +
    label(480, 172, 'spinal cord', 'fig-label-sm') + label(480, 187, '(cut across)', 'fig-label-sm') +
    badge(112, 206, 1) + badge(262, 160, 2, 'blue') + badge(492, 104, 3, 'green') + badge(428, 168, 4, 'red') + badge(318, 100, 5),
};

/* ============================================================ 2 · senses */

export const EYE = {
  rods: 120e6,              // rods per retina: about 120 million (textbooks give roughly 90–120 million)
  cones: 6e6,               // cones per retina: about 6 million
  totalPower: 60,           // dioptres, cornea plus relaxed lens (about two thirds from the cornea): textbook optics of the eye
  blindSpotAngle: 15,       // degrees to the outer side of the point you look at
  hairCells: 16000,         // hair cells in one cochlea at birth: CDC, "How does loud noise cause hearing loss?"
  smellReceptorTypes: 400,  // kinds of smell receptor in humans, about
};

/** Typical loudness in decibels. CDC (NCEH), "What noises cause hearing loss?"; values are typical, not exact. */
export const SOUNDS = [
  ['a whisper', 30],
  ['normal conversation', 60],
  ['a washing machine', 70],
  ['city traffic heard from inside a car', 80],
  ['a loud sports crowd', 100],
  ['a very loud music venue', 110],
  ['a siren close by', 120],
];

/** Smallest gap at which two points feel like two, in millimetres. Classic values (Weinstein, 1968), as quoted in physiology texts. */
export const TWO_POINT = [['Fingertip', 3], ['Palm', 10], ['Forearm', 40]];

/** Sound's route through the ear, in order. */
export const EAR_PATH = [
  'Sound waves make the eardrum vibrate',
  'Three tiny bones pass the vibration on',
  'Fluid inside the snail-shaped cochlea ripples',
  'Hair cells bend and fire',
  'The hearing nerve carries impulses to the brain',
];

/** The ear from the outside inwards: canal, eardrum, three bones, cochlea, hearing nerve; the balance loops above the cochlea. */
export const EAR_FIGURE = {
  type: 'svg', viewBox: '70 0 470 232', maxWidth: 560,
  alt: 'A diagram of the ear from the outside inwards. Sound waves enter a short canal that ends at the eardrum. Behind the eardrum a chain of three tiny bones leads to a snail-shaped tube, the cochlea. A nerve leaves the cochlea for the brain. Above the cochlea are three small loops, the balance organs.',
  content:
    // sound waves
    '<path class="stroke-orange fill-none" stroke-width="3" stroke-linecap="round" d="M84 108 q10 20 0 40 M100 98 q16 30 0 60"/>' +
    // ear canal
    '<path class="fill-orange-soft stroke-ink" stroke-width="3" stroke-linejoin="round" d="M126 72 C150 94 170 108 214 110 V146 C170 148 150 162 126 184 Z"/>' +
    // middle ear
    '<rect class="fill-surface stroke-ink" stroke-width="3" x="214" y="88" width="126" height="80" rx="18"/>' +
    // eardrum
    '<path class="stroke-teal fill-none" stroke-width="7" stroke-linecap="round" d="M214 104 V152"/>' +
    // balance loops (behind the cochlea)
    [[368, 62, -28], [402, 52, 8], [434, 66, 44]].map(([x, y, a]) => `<g transform="rotate(${a} ${x} ${y})"><ellipse class="fill-violet-soft stroke-ink" stroke-width="2.5" cx="${x}" cy="${y}" rx="15" ry="24"/><ellipse class="fill-surface stroke-ink" stroke-width="2" cx="${x}" cy="${y}" rx="6" ry="14"/></g>`).join('') +
    // cochlea
    '<circle class="fill-blue-soft stroke-ink" stroke-width="3" cx="398" cy="128" r="46"/>' +
    '<path class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" d="M352 128 A38 38 0 0 1 428 128 A30 30 0 0 1 368 128 A22 22 0 0 1 412 128 A14 14 0 0 1 384 128"/>' +
    // three bones
    '<rect class="fill-yellow-soft stroke-ink" stroke-width="2.5" x="220" y="116" width="44" height="15" rx="7.5" transform="rotate(-22 242 123)"/>' +
    '<rect class="fill-yellow-soft stroke-ink" stroke-width="2.5" x="254" y="116" width="44" height="15" rx="7.5" transform="rotate(24 276 123)"/>' +
    '<rect class="fill-yellow-soft stroke-ink" stroke-width="2.5" x="290" y="122" width="62" height="15" rx="7.5" transform="rotate(-6 321 129)"/>' +
    // hearing nerve
    '<path class="stroke-yellow fill-none" stroke-width="8" stroke-linecap="round" d="M444 128 H500"/><path class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M500 118 L516 128 L500 138"/>' +
    // labels
    label(98, 212, 'sound') +
    label(162, 212, 'ear canal') + '<path class="stroke-hair fill-none" stroke-width="2" d="M162 198 L166 152"/>' +
    label(228, 212, 'eardrum') + '<path class="stroke-hair fill-none" stroke-width="2" d="M224 198 L216 160"/>' +
    label(272, 70, 'three tiny bones') + '<path class="stroke-hair fill-none" stroke-width="2" d="M272 76 L276 112"/>' +
    label(398, 198, 'cochlea') + label(398, 214, '(fluid and hair cells)') +
    label(492, 106, 'hearing nerve') + label(492, 160, 'to the brain') +
    label(488, 30, 'balance organs') + '<path class="stroke-hair fill-none" stroke-width="2" d="M466 36 L446 54"/>',
};

/** People whose sight needs correcting: [story, light from where, where the unaided focus falls, lens]. */
export const SIGHT_CASES = [
  { who: 'Aiko, aged 12, reads her book easily, but the writing on the classroom board is blurred.', light: 'distant', focus: 'front', lens: 'minus', name: 'short sight (myopia)', why: 'her eyeball is slightly too long for its focusing power' },
  { who: 'Kwame can read a road sign from far off, but his eyes tire and blur when he reads small print.', light: 'near', focus: 'behind', lens: 'plus', name: 'long sight (hyperopia)', why: 'his eyeball is slightly too short for its focusing power' },
  { who: 'Marta, aged 50, has always seen well. Now she holds her phone at arm\'s length to read it.', light: 'near', focus: 'behind', lens: 'plus', name: 'age-related long sight (presbyopia)', why: 'her lens has stiffened with age and can no longer fatten enough' },
  { who: 'Luis, aged 16, sees his phone perfectly, but cannot read the numbers on a bus until it is close.', light: 'distant', focus: 'front', lens: 'minus', name: 'short sight (myopia)', why: 'his eyeball is slightly too long for its focusing power' },
];

/** Everyday moments and the sense behind them: [what happens, sense]. */
export const SENSE_NAMES = { balance: 'Balance organs in the inner ear', position: 'Position sensors in muscles and joints', pain: 'Pain receptors', touch: 'Touch receptors in the skin' };
export const SENSE_SCENES = [
  ['With your eyes shut, you can still bring a fingertip to the tip of your nose.', 'position'],
  ['In the dark, you know without looking whether your knee is bent or straight.', 'position'],
  ['You can walk upstairs without watching your feet.', 'position'],
  ['After spinning round, the room seems to keep turning for a few seconds.', 'balance'],
  ['In a windowless cabin on a ship, you feel it rolling although everything you can see is still.', 'balance'],
  ['You tilt your head, and you know which way is up without looking.', 'balance'],
  ['You step on a sharp stone and snatch your foot away.', 'pain'],
  ['You find a coin among the keys in your pocket by its edge.', 'touch'],
];

/** The blind-spot test card: a cross on the left, a dot on the right (for the right eye). */
export const BLIND_SPOT_FIGURE = {
  type: 'svg', viewBox: '0 0 560 150', maxWidth: 640,
  alt: 'A test card: a small cross near the left edge and a large round dot near the right edge, on a plain background.',
  content:
    '<rect class="fill-surface stroke-ink" stroke-width="3" x="4" y="4" width="552" height="142" rx="14"/>' +
    '<path class="stroke-ink fill-none" stroke-width="6" stroke-linecap="round" d="M62 75 H98 M80 57 V93"/>' +
    '<circle class="fill-ink" cx="480" cy="75" r="20"/>',
};

/** Two identical grey squares, one on a dark ground and one on a light ground. */
export const CONTRAST_FIGURE = {
  type: 'svg', viewBox: '0 0 520 220', maxWidth: 560,
  alt: 'Two large panels side by side, one very dark and one very light. In the middle of each sits a small grey square.',
  content:
    '<rect class="fill-ink" x="10" y="10" width="250" height="200"/><rect class="fill-surface" x="260" y="10" width="250" height="200"/>' +
    '<rect class="fill-gray" x="100" y="75" width="70" height="70"/><rect class="fill-gray" x="350" y="75" width="70" height="70"/>' +
    '<rect class="fill-none stroke-ink" stroke-width="3" x="10" y="10" width="500" height="200" rx="2"/>',
};

/* ============================================================ 3 · hormones */

export const GLUCOSE = {
  fasting: 5,               // mmol/L, a typical fasting level in a person without diabetes (usual range about 4 to 6)
  mgPerMmol: 18,            // 1 mmol/L of glucose = 18 mg/dL (molar mass 180 g/mol)
  bloodLitres: 5,           // litres of blood in a typical adult
  gramsInBlood: 5,          // 5 mmol/L × 5 L × 0.18 g/mmol = 4.5 g: about one teaspoon
  breadGrams: 15,           // carbohydrate in a typical slice of bread, about
  kidneyThreshold: 10,      // mmol/L, about: above this the kidneys lose glucose into the urine
  adultsWithDiabetes: 589e6, // adults aged 20–79 living with diabetes in 2024: IDF Diabetes Atlas, 11th edition (2025)
  type2Share: 90,           // % of diabetes that is type 2: "over 90%" (IDF 2025; WHO gives "more than 95%")
  firstInsulin: 1922,       // first person treated with insulin: Leonard Thompson, aged 14, Toronto, January 1922
};

/** The glucose loop after a meal, in order. */
export const GLUCOSE_LOOP = [
  'A meal is digested and blood glucose rises',
  'The pancreas detects the rise and releases insulin',
  'Insulin makes muscle, fat and liver cells take glucose in',
  'Blood glucose falls back towards its usual level',
  'The pancreas releases less insulin again',
];

/** Glands: body-map id → [gland, main hormone(s), what they do]. */
export const GLANDS = {
  pituitary: ['Pituitary', 'growth hormone and "control" hormones', 'Growth, and orders to other glands'],
  thyroid: ['Thyroid', 'thyroid hormone', 'Sets how fast cells use energy'],
  adrenals: ['Adrenal glands', 'adrenaline and cortisol', 'Readiness for action and stress'],
  pancreas: ['Pancreas', 'insulin and glucagon', 'Keeps blood glucose steady'],
  pineal: ['Pineal gland', 'melatonin', 'Signals darkness and night'],
};

/** Example glucose readings for the unit conversions, in mmol/L (each × 18 is a whole number of mg/dL). */
export const GLUCOSE_READINGS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 8, 10];

/** Thyroid feedback cases: what the thyroid does → what the pituitary's signal (TSH) does. */
export const THYROID_CASES = [
  { story: 'the thyroid gland has become **underactive** and makes too little thyroid hormone', hormone: 'low', tsh: 'High', effect: 'tired, cold and slowed down' },
  { story: 'the thyroid gland has become **overactive** and makes too much thyroid hormone', hormone: 'high', tsh: 'Low', effect: 'restless, hot and with a racing pulse' },
];

/* ============================================================ 4 · immune system */

/** Barriers: [barrier, how it keeps microbes out, the same thing as a case for the matching question]. */
export const BARRIERS = [
  ['Skin', 'A dry, tough, tightly sealed wall', 'Bacteria on your palm get no further'],
  ['Mucus and tiny hairs in the airways', 'Trap microbes and sweep them out', 'Breathed-in spores are caught and swept out'],
  ['Stomach acid', 'Destroys most microbes that are swallowed', 'Swallowed bacteria are destroyed'],
  ['Tears', 'Wash the surface and carry a germ-killing enzyme', 'Microbes that land on the eye are rinsed away'],
];

/** The signs of inflammation: [sign, what causes it]. */
export const INFLAMMATION = [
  ['Redness and warmth', 'Blood vessels widen, bringing more blood'],
  ['Swelling', 'Vessel walls leak fluid and white cells into the tissue'],
  ['Pain', 'Chemical signals make nerve endings more sensitive'],
  ['Pus', 'Dead white cells and microbes pile up'],
];

/** The adaptive response to a new microbe, in order. */
export const ADAPTIVE_STEPS = [
  'Phagocytes carry fragments of the microbe to a lymph node',
  'The few lymphocytes whose receptors fit the fragments switch on',
  'Those cells divide again and again into a large clone',
  'The clone makes antibodies and killer cells, and the microbe is cleared',
  'Most of the clone dies away; memory cells stay for years',
];

/** Typical timings, as drawn by the immune-response widget (textbook shapes: Janeway's Immunobiology; values vary by infection). */
export const RESPONSE = {
  first: { lag: 5, peakDay: 12, illDays: 7 },
  memory: { lag: 2, peakDay: 6, illDays: 0, times: 20 },
};

/** When the immune system misfires: [example, kind]. */
export const IMMUNE_FAULTS = [
  ['Hay fever: sneezing at harmless pollen', 'allergy'],
  ['A reaction to peanuts', 'allergy'],
  ['Type 1 diabetes: insulin-making cells destroyed', 'autoimmune'],
  ['Rheumatoid arthritis: the lining of joints attacked', 'autoimmune'],
  ['Multiple sclerosis: myelin attacked', 'autoimmune'],
  ['Untreated HIV infection: helper T cells lost', 'deficiency'],
];

/** What supports normal immune function, and what is merely sold as doing so: [claim, supported, note]. */
export const IMMUNE_CLAIMS = [
  ['Being up to date with vaccines', true, 'Vaccines give the adaptive system its memory without the illness.'],
  ['Getting enough sleep', true, 'In studies, people who sleep too little catch more colds and make fewer antibodies after a vaccine.'],
  ['Not smoking', true, 'Smoke damages the airways\' sweeping hairs and weakens defences in the lungs.'],
  ['Eating enough, with a varied diet', true, 'Real shortages of protein, vitamins or minerals do weaken immunity. Topping up beyond enough does not strengthen it.'],
  ['"Immune-boosting" supplements for well-fed people', false, 'For people who are not deficient, trials have not shown that such products prevent infections.'],
  ['Large doses of vitamin C to prevent colds', false, 'A Cochrane review of trials found that regular vitamin C does not stop most people catching colds.'],
  ['"Detox" teas and juices', false, 'The liver and kidneys clear wastes already, and nothing in these products has been shown to help immunity.'],
  ['Antibiotics at the first sign of a cold', false, 'Colds are caused by viruses, and antibiotics act only on bacteria.'],
];

export const HIV = {
  livingWith: 40.8e6,       // people living with HIV worldwide in 2024: WHO / UNAIDS (2025)
  // WHO (2023, restated 2025): people on treatment with an undetectable viral load have zero risk of passing HIV on through sex.
};

/* ============================================================ 5 · muscles and bones */

export const SKELETON = {
  adultBones: 206,          // bones in a typical adult skeleton (anatomy textbooks; small variations are common)
  birthBones: 300,          // about: a newborn has roughly 270–300 separate bones and bony parts, many of which fuse
  muscles: 600,             // skeletal muscles, "more than 600"
  handBones: 27,            // one hand and wrist: 8 wrist bones, 5 in the palm, 14 in the fingers and thumb
  wristBones: 8,
  peakBoneAge: [25, 30],    // peak bone mass is reached at about this age: NIH (NIAMS), "Bone health for life"
  renewYears: 10,           // the adult skeleton is renewed about every 10 years: NIH Osteoporosis and Related Bone Diseases centre
  newtonsPerKg: 10,         // weight of one kilogram, rounded (9.8)
  bicepsAttach: 4,          // cm from the elbow joint to the biceps attachment in an adult, roughly 3–5
  forearmReach: 32,         // cm from the elbow joint to the middle of the palm, roughly
};

/** Forearm levers for the practice questions: [attachment cm, reach cm], every ratio a whole number. */
export const LEVERS = [[3, 30], [3, 36], [4, 32], [4, 36], [4, 40], [5, 30], [5, 35], [5, 40]];

/** Connecting tissues: [name, what it does]. */
export const CONNECTORS = [
  ['Tendon', 'Joins a muscle to a bone'],
  ['Ligament', 'Joins a bone to a bone'],
  ['Cartilage', 'Smooth, slippery cap on the end of a bone'],
  ['Joint fluid', 'Oils the joint from inside'],
];

/** A hinge joint cut open, with its four connecting tissues numbered in the order of CONNECTORS. */
export const JOINT_FIGURE = {
  type: 'svg', viewBox: '44 30 432 208', maxWidth: 520,
  alt: 'A joint cut open: the rounded ends of two bones face each other across a narrow space. A muscle lies along one bone and narrows into a cord, numbered 1, that crosses the joint and is fixed to the other bone. A band, numbered 2, runs from one bone to the other across the joint. Each bone end has a smooth cap, numbered 3, and the space between the caps, numbered 4, is filled with fluid.',
  content:
    // the capsule, filled with joint fluid
    '<ellipse class="fill-yellow-soft stroke-ink" stroke-width="2.5" cx="250" cy="125" rx="52" ry="58"/>' +
    // two bones
    '<path class="fill-surface stroke-ink" stroke-width="3" stroke-linejoin="round" d="M50 96 H168 C186 96 192 82 208 82 C222 82 228 102 228 125 C228 148 222 168 208 168 C192 168 186 154 168 154 H50 Z"/>' +
    '<path class="fill-surface stroke-ink" stroke-width="3" stroke-linejoin="round" d="M470 96 H332 C314 96 308 82 292 82 C278 82 272 102 272 125 C272 148 278 168 292 168 C308 168 314 154 332 154 H470 Z"/>' +
    // cartilage caps
    '<path class="stroke-teal fill-none" stroke-width="11" stroke-linecap="round" d="M214 88 C231 102 231 148 214 162"/>' +
    '<path class="stroke-teal fill-none" stroke-width="11" stroke-linecap="round" d="M286 88 C269 102 269 148 286 162"/>' +
    // ligament: bone to bone
    '<path class="fill-green-soft stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M184 97 C214 40 286 40 316 97 L302 101 C280 60 220 60 198 101 Z"/>' +
    // muscle and its tendon: muscle to bone
    '<path class="fill-gray-soft stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M190 190 C250 196 300 186 344 154 L356 160 C312 198 252 208 192 204 Z"/>' +
    '<path class="fill-red-soft stroke-ink" stroke-width="3" stroke-linejoin="round" d="M58 186 C92 166 160 166 200 197 C160 230 92 230 58 212 Z"/>' +
    label(112, 130, 'bone') + label(408, 130, 'bone') + label(122, 203, 'muscle') +
    badge(292, 190, 1) + badge(250, 52, 2, 'green') + badge(224, 106, 3, 'teal') + badge(252, 142, 4, 'yellow'),
};

/** Three kinds of muscle: [example, kind]. */
export const MUSCLE_TYPES = [
  ['Biceps', 'skeletal'],
  ['The muscles that move your eyes', 'skeletal'],
  ['The diaphragm, which you breathe with', 'skeletal'],
  ['The wall of the stomach', 'smooth'],
  ['The walls of arteries', 'smooth'],
  ['The muscle that narrows the pupil', 'smooth'],
  ['The wall of the heart', 'cardiac'],
];

/** Sprain, strain, fracture: the tissue each one names. */
export const INJURIES = {
  sprain: { tissue: 'A ligament', what: 'a ligament, the tough band that joins bone to bone, has been overstretched or torn' },
  strain: { tissue: 'A muscle or its tendon', what: 'a muscle, or the tendon that joins it to bone, has been overstretched or torn' },
  fracture: { tissue: 'A bone', what: 'a bone has cracked or broken' },
};
export const INJURY_STORIES = [
  ['Sam steps off a kerb awkwardly, and a nurse says the ankle is **sprained**.', 'sprain'],
  ['Noor lands badly at netball and is told she has **sprained** her wrist.', 'sprain'],
  ['A sprinter pulls up clutching the back of his thigh: a hamstring **strain**.', 'strain'],
  ['After a day of digging, Li is told the ache in her lower back is a **strain**.', 'strain'],
  ['Ola falls off a bike, and the X-ray shows a **fracture** near the wrist.', 'fracture'],
  ['A skateboarder falls on an outstretched hand; the clinic finds a **fracture** of the collarbone.', 'fracture'],
];

/* ============================================================ 6 · life cycle */

export const LIFE = {
  chromosomes: 46,          // in almost every human cell: 23 pairs
  pairs: 23,
  doublings: 45,            // 2^45 ≈ 35 trillion: about the number of cells in an adult (Bianconi et al. 2013: 37 trillion; Hatton et al. 2023: about 36 trillion in a 70 kg man)
  pregnancyWeeks: 40,       // counted from the first day of the last period (about 38 weeks from fertilisation): NHS, WHO
  implantDays: 7,           // about a week after fertilisation (6 to 10 days)
  thirdTrimesterFrom: 28,   // week 28 on: NHS and ACOG agree; they differ by a week on where the first trimester ends (12 or 13)
  pubertyOvaries: [8, 13],  // typical age at which puberty starts in girls: NHS, "Early or delayed puberty"
  pubertyTestes: [9, 14],   // and in boys: NHS
  cycleDays: [21, 35],      // usual range of cycle length in adults (average 28): NHS
  lutealDays: 14,           // ovulation to the next period: about 14 days (usually 10 to 16): NHS, "Fertility in the menstrual cycle"
  periodDays: [2, 7],       // length of a period: NHS
  menopauseAge: [45, 55],   // usual age of menopause; average about 51 (UK): NHS
  lifeExpectancy1900: 32,   // world average: Our World in Data (Riley 2005)
  lifeExpectancyNow: 73,    // world average, 2023: UN World Population Prospects 2024
};

/** From fertilisation to birth, in order. */
export const PREGNANCY_STEPS = [
  'A sperm and an egg join in the tube leading from an ovary',
  'The dividing ball of cells settles into the lining of the uterus',
  'The placenta forms and the main organs take shape',
  'The fetus grows, and its movements can be felt',
  'The lungs mature and weight is gained fast, until birth',
];

/** Changes of puberty: [change, who: 'ovaries' | 'testes' | 'both']. */
export const PUBERTY_CHANGES = [
  ['Breasts develop', 'ovaries'],
  ['Periods begin', 'ovaries'],
  ['Hips widen', 'ovaries'],
  ['Testicles and penis grow', 'testes'],
  ['The voice "breaks" and deepens a lot', 'testes'],
  ['Sperm start to be made', 'testes'],
  ['A growth spurt', 'both'],
  ['Hair grows under the arms and around the genitals', 'both'],
  ['Skin becomes oilier, and spots are common', 'both'],
];

/** The four hormones of the menstrual cycle: [name, where from, job]. */
export const CYCLE_HORMONES = [
  ['FSH', 'pituitary', 'Makes an egg ripen in the ovary'],
  ['Oestrogen', 'ovary', 'Rebuilds the lining of the uterus'],
  ['LH', 'pituitary', 'Its sudden surge releases the egg'],
  ['Progesterone', 'ovary', 'Keeps the lining ready after ovulation'],
];

/** What training can still change at any age: [thing, trainable, note]. */
export const AGEING = [
  ['Muscle strength', true, 'Strength training builds muscle even in people in their eighties and nineties.'],
  ['Balance', true, 'Balance is a skill, and practising it reduces falls in later life.'],
  ['Learning new skills', true, 'The brain keeps its plasticity for life, as lesson 1 showed.'],
  ['The highest heart rate the heart can reach', false, 'Maximum heart rate falls steadily with age whatever a person does, though fitness can still improve.'],
  ['The eye lens\'s ability to focus close up', false, 'The lens stiffens with age in everyone; lesson 2 showed why reading glasses follow.'],
];

/* ============================================================ 7 · sexual and reproductive health */

/**
 * Contraceptive methods: pregnancies per 100 couples (strictly: per 100 women) in the first year of use.
 * typical = as commonly used; perfect = used correctly and consistently.
 * Source: Trussell & Aiken in Contraceptive Technology, 21st edition (2018), the table CDC and WHO use;
 * CDC, "Contraception and Birth Control Methods" (current page, checked November 2026): implant 0.1, injection 4, pill 7, external condom 13, copper IUD 0.8.
 * Perfect-use figures (withdrawal 4, condom 2, pill 0.3, injection 0.2, copper IUD 0.6, implant 0.1) are from the same Trussell & Aiken table.
 * Fertility-awareness methods are left out of the table because their typical-use figure is a wide range (CDC: 2 to 23).
 */
export const METHODS = [
  { id: 'none', name: 'No method', typical: 85, perfect: 85, group: 'none' },
  { id: 'withdrawal', name: 'Withdrawal', typical: 20, perfect: 4, group: 'neither' },
  { id: 'condom', name: 'Condom', long: 'the external condom', typical: 13, perfect: 2, group: 'barrier' },
  { id: 'pill', name: 'The pill', long: 'the pill', typical: 7, perfect: 0.3, group: 'hormonal' },
  { id: 'injection', name: 'Injection', long: 'the three-monthly injection', typical: 4, perfect: 0.2, group: 'hormonal' },
  { id: 'iud', name: 'Copper IUD', long: 'the copper IUD (coil)', typical: 0.8, perfect: 0.6, group: 'neither' },
  { id: 'implant', name: 'Implant', long: 'the implant', typical: 0.1, perfect: 0.1, group: 'hormonal' },
];
export const methodById = (id) => METHODS.find((m) => m.id === id);

export const FERTILITY = {
  windowDays: 6,            // the day of ovulation and the five days before it: Wilcox, Weinberg & Baird, NEJM 1995
  spermDays: 5,             // sperm can survive up to about five days
  eggHours: 24,             // an egg can be fertilised for about a day
  fabTypical: [2, 23],      // typical-use failure of fertility-awareness methods, per 100 per year: CDC
  ecDays: 5,                // emergency contraception: within 5 days, the sooner the better; a copper IUD is the most effective form: WHO fact sheet (2021)
  stiPerDay: 1e6,           // more than 1 million curable STIs acquired every day worldwide (ages 15–49): WHO
};

/** How methods work, for sorting: [method, group]. */
export const METHOD_GROUPS = [
  ['External condom (worn on the penis)', 'barrier'],
  ['Internal condom (worn in the vagina)', 'barrier'],
  ['Diaphragm', 'barrier'],
  ['The pill', 'hormonal'],
  ['Implant in the arm', 'hormonal'],
  ['Injection every three months', 'hormonal'],
  ['Copper IUD (coil)', 'neither'],
  ['Withdrawal', 'neither'],
];

/** Statements about sexually transmitted infections: [statement, true?, why]. WHO fact sheets (STIs; HIV; HPV), 2023–2025. */
export const STI_FACTS = [
  ['Many infections cause no symptoms at all', true, 'Chlamydia, for example, is silent in most people who have it, so a test is the only way to know.'],
  ['You can tell by looking whether someone has an infection', false, 'Most infections cannot be seen, and a person may not know they have one.'],
  ['Chlamydia, gonorrhoea and syphilis can be cured with antibiotics', true, 'All three are caused by bacteria. Untreated, they can do lasting harm, which is why testing matters.'],
  ['The HPV vaccine prevents several kinds of cancer', true, 'HPV causes almost all cervical cancer and some cancers of the throat, anus and genitals. The vaccine works best given before any exposure.'],
  ['A person on effective HIV treatment, with no detectable virus, does not pass HIV on through sex', true, 'WHO states the risk is zero. Treatment keeps the person well and protects partners.'],
  ['Only people with many partners get infections', false, 'One contact with one person who has an infection is enough. Infections are common and are nothing to be ashamed of.'],
  ['The pill gives some protection against infections', false, 'Hormonal methods prevent pregnancy only. Among contraceptives, only condoms reduce the risk of infection.'],
];

/** Consent: [situation, is it consent?, which part of the idea it shows]. */
export const CONSENT_CASES = [
  ['Says a clear yes, wide awake, clear-headed and under no pressure', true, 'Freely given, informed and specific: this is what consent is.'],
  ['Says yes only after being asked over and over and told "if you loved me, you would"', false, 'Consent must be freely given. A yes produced by pressure, guilt or threats is not consent.'],
  ['Said yes last week, and has not been asked today', false, 'Consent is specific to one occasion. A yes then is not a yes now.'],
  ['Agreed to kissing, and the other person takes that as a yes to more', false, 'Consent is specific. Agreeing to one thing is not agreeing to anything more.'],
  ['Said yes, then changed their mind partway', false, 'Consent is reversible. Anyone can stop at any moment, and then it must stop.'],
  ['Is asleep, or very drunk, and does not say no', false, 'Someone who is asleep or incapacitated cannot consent. Silence is not a yes.'],
];

/** Example people and the right first port of call: [story, service]. */
export const SERVICES = {
  ec: 'A pharmacy or clinic, today',
  test: 'A sexual health clinic or a doctor, for a test',
  choose: 'A doctor, nurse or family planning clinic, to compare methods',
  wait: 'Nowhere yet: wait to see whether anything happens',
};
export const SERVICE_CASES = [
  ['A condom split last night, and Dana does not want to become pregnant.', 'ec', 'Emergency contraception can prevent most pregnancies if used within 5 days, and the sooner the better. A pharmacist or clinic can advise on the options.'],
  ['Two days ago Mina had sex without contraception. She does not want to become pregnant.', 'ec', 'Emergency contraception can prevent most pregnancies if used within 5 days, and the sooner the better. A pharmacist or clinic can advise on the options.'],
  ['Ravi feels perfectly well. He has a new partner, and neither of them has ever been tested for infections.', 'test', 'Many infections have no symptoms, so feeling well proves nothing. A test is quick, and in many places free and confidential.'],
  ['Jo had sex without a condom a month ago, feels fine, and wonders whether to bother with a test.', 'test', 'Many infections have no symptoms, so feeling well proves nothing. A test is quick, and in many places free and confidential.'],
  ['Sam and Alex are thinking about starting to have sex and want to know which contraception would suit them.', 'choose', 'Methods differ in how they work, how well, and what suits whom. A professional can go through the choices, and the conversation is confidential.'],
  ['Noor keeps forgetting her pill and wonders whether another method would suit her better.', 'choose', 'Several methods need no daily action. A professional can go through the choices, and the conversation is confidential.'],
];

/**
 * Where to find help after sexual assault or abuse (numbers verified November 2026; services differ by country).
 * The Rape Crisis England & Wales 24/7 line is for people aged 16 and over, so Childline (NSPCC; under-19s, UK) is
 * listed too: this lesson is read by younger teenagers.
 */
export const ASSAULT_HELP = [
  'In immediate danger, call your local emergency number.',
  'United States: RAINN, 800 656 4673 (free, 24 hours) or rainn.org.',
  'England and Wales, aged 16 or over: Rape Crisis, 0808 500 2222 (free, 24 hours).',
  'United Kingdom, under 19: Childline, 0800 1111 (free).',
  'Elsewhere: findahelpline.com lists free, confidential services by country.',
];
