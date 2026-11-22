// The Body I: Fuel, Air and Blood · shared tables and small builders.
//
// The facts of the course live here, once: typical values with their ranges, the order of structures along
// each pathway, who can give blood to whom. Figures, generated questions and feedback are built from these
// tables, so a correction is made in one place. The course test (tests/body-systems-course.test.mjs) keeps
// its own, independently typed copy of the key facts and fails when the two disagree.
//
// "Typical" means typical: values vary with age, sex, size and fitness, and lessons say so. Each table
// names the body or the study the figures come from, with its year.
import { num } from '../../kit.js';

/** 1234567 -> "1,234,567" */
export const grouped = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** A number for running text: at most `digits` decimals, no float noise. */
export const say = (v, digits = 2) => num(v, digits);
/** "a" or "an" before a number written in figures. */
export const aAn = (n) => (/^(8|11\b|18\b)/.test(String(n)) ? 'an' : 'a');

/* ------------------------------------------------------- lesson 1: cells */

// Sender, Fuchs & Milo, PLOS Biology 2016: about 30 trillion human cells and about 38 trillion bacteria in a
// 70 kg "reference man". Bianconi et al. 2013: 37 trillion. Hatton et al., PNAS 2023: about 36 trillion
// (70 kg man), 28 trillion (60 kg woman), 17 trillion (10-year-old child).
export const CELL_COUNT = { humanLow: 30, humanHigh: 37, bacteria: 38, unit: 'trillion' };

// Typical sizes in micrometres (µm; 1000 µm = 1 mm). Textbook values, rounded; real cells vary.
// `spans` are the lengths (mm) a generated question may ask about, chosen so that the count is a whole number.
export const CELL_SIZES = [
  { id: 'bacterium', name: 'gut bacterium', a: 'A typical gut bacterium', um: 2, measure: 'long', spans: [0.5, 1, 2] },
  { id: 'sperm', name: 'sperm cell head', a: 'The head of a sperm cell', um: 5, measure: 'long', spans: [0.5, 1, 2] },
  { id: 'red', name: 'red blood cell', a: 'A red blood cell', um: 8, measure: 'across', spans: [1, 2] },
  { id: 'liver', name: 'liver cell', a: 'A liver cell', um: 25, measure: 'across', spans: [0.5, 1, 2] },
  { id: 'egg', name: 'egg cell', a: 'A human egg cell, one of the largest cells in the body,', um: 100, measure: 'across', spans: [0.5, 1, 2] },
];

// The eleven organ systems as most textbooks count them. `map` is the body-map system id.
// `organs` are unambiguous members (the pancreas, which works for two systems, is deliberately left out).
export const SYSTEMS = [
  { id: 'circulatory', name: 'Circulatory system', job: 'carries oxygen, fuel and wastes to and from every cell', organs: ['heart', 'arteries and veins'], map: 'circulatory' },
  { id: 'respiratory', name: 'Respiratory system', job: 'brings oxygen into the body and gets rid of carbon dioxide', organs: ['lungs', 'windpipe'], map: 'respiratory' },
  { id: 'digestive', name: 'Digestive system', job: 'breaks food down and absorbs it into the blood', organs: ['stomach', 'small intestine'], map: 'digestive' },
  { id: 'urinary', name: 'Urinary system', job: 'filters the blood and removes wastes and spare water as urine', organs: ['kidneys', 'bladder'], map: 'urinary' },
  { id: 'nervous', name: 'Nervous system', job: 'senses, decides and sends fast electrical signals', organs: ['brain', 'spinal cord'], map: 'nervous' },
  { id: 'endocrine', name: 'Endocrine system', job: 'sends slower chemical messages, called hormones, through the blood', organs: ['thyroid gland', 'adrenal glands'], map: 'endocrine' },
  { id: 'immune', name: 'Immune and lymphatic system', job: 'finds and destroys germs and damaged cells', organs: ['lymph nodes', 'spleen'], map: 'immune' },
  { id: 'skeleton', name: 'Skeleton', job: 'supports and protects the body, and makes blood cells in its marrow', organs: ['skull', 'ribs'], map: 'skeleton' },
  { id: 'muscles', name: 'Muscles', job: 'move the body by pulling on bones', organs: ['biceps', 'hamstrings'], map: 'muscles' },
  { id: 'skin', name: 'Skin', job: 'forms a waterproof barrier and helps to control temperature', organs: ['sweat glands', 'hair and nails'], map: 'skin' },
  { id: 'reproductive', name: 'Reproductive system', job: 'makes the cells that can start a new human being', organs: ['uterus', 'prostate'], map: 'reproductive' },
];
export const systemById = (id) => SYSTEMS.find((sy) => sy.id === id);

// From small to large. The example follows one thread through the levels.
export const LEVELS = [
  { level: 'cell', example: 'A heart muscle cell' },
  { level: 'tissue', example: 'Heart muscle: millions of those cells pulling together' },
  { level: 'organ', example: 'The heart: muscle, valves, vessels and nerves' },
  { level: 'system', example: 'The circulatory system: heart, vessels and blood' },
  { level: 'organism', example: 'A whole person' },
];

/* ------------------------------------------------- lesson 2: heart and vessels */

// Typical resting adult values. Heart rate: American Heart Association (60 to 100 a minute; well-trained
// athletes often 40 to 60). Pressures and volumes: standard physiology texts (Guyton & Hall; the Merck Manual's
// "representative cardiac pressures"). Harvey: "De Motu Cordis", Frankfurt, 1628.
export const HEART = {
  restingRate: [60, 100],      // beats a minute
  athleteRate: [40, 60],
  stroke: 70,                  // mL pumped by each ventricle per beat
  output: 5,                   // litres a minute at rest (about 4 to 8)
  bloodVolume: 5,              // litres in an adult (about 4.5 to 5.5)
  leftPeak: 120,               // mmHg in the left ventricle at the height of a beat
  rightPeak: 25,               // mmHg in the right ventricle
  aorta: [120, 80],            // mmHg, highest and lowest in each beat
  pulmonaryArtery: [25, 10],
  harvey: 1628,
};

// One lap for a red blood cell, starting as it returns from the body.
export const BLOOD_PATH = ['Right atrium', 'Right ventricle', 'Lungs', 'Left atrium', 'Left ventricle', 'Body'];

// [statement, vessel index]: 0 arteries, 1 capillaries, 2 veins
export const VESSEL_KINDS = ['Arteries', 'Capillaries', 'Veins'];
export const VESSEL_FACTS = [
  { text: 'Carry blood away from the heart', kind: 0 },
  { text: 'Thick, stretchy, muscular walls', kind: 0, why: 'Arteries take the full force of each heartbeat, so their walls are thick and elastic.' },
  { text: 'Where you can feel a pulse', kind: 0, why: 'A pulse is the pressure wave of each heartbeat travelling along an artery.' },
  { text: 'Walls just one cell thick', kind: 1, why: 'Only capillary walls are thin enough for oxygen, fuel and wastes to pass through.' },
  { text: 'Where oxygen leaves the blood', kind: 1, why: 'Exchange with the cells happens only across the thin walls of the capillaries.' },
  { text: 'Carry blood back to the heart', kind: 2 },
  { text: 'Have valves that stop backflow', kind: 2, why: 'Pressure in the veins is low, so valves (and the squeeze of nearby muscles) keep blood moving towards the heart.' },
];

// Example people for pulse counting: [name, pronoun]
export const PEOPLE = [['Amara', 'her'], ['Kenji', 'his'], ['Sofia', 'her'], ['Tomás', 'his'], ['Leila', 'her'], ['Ravi', 'his'], ['Ngozi', 'her'], ['Jonas', 'his']];

/* ---------------------------------------------------------- lesson 3: blood */

// Typical adult values from standard haematology references. Shares of a spun sample: plasma about 55%,
// red cells about 45% (a little lower in women on average), white cells and platelets under 1%.
// Counts per microlitre (a cubic millimetre): red cells 4 to 6 million, white cells 4,000 to 11,000,
// platelets 150,000 to 450,000. Red cell life about 120 days; about 2 million made each second
// (NHS Blood and Transplant, "How your body replaces blood"). Oxygen: about 200 mL per litre of blood,
// against about 3 mL dissolved in a litre of plasma (1.34 mL per gram of haemoglobin; Guyton & Hall).
// Carbon monoxide binds haemoglobin over 200 times as strongly as oxygen (ATSDR toxicological profile, 2012).
export const BLOOD = {
  volume: 5,                 // litres, a typical adult (roughly 7 to 8% of body weight)
  plasmaShare: 55,           // per cent of the volume
  redShare: 45,
  redLife: 120,              // days
  redPerSecond: 2,           // million made each second
  plateletLife: [7, 10],     // days
  perMicrolitre: { red: [4e6, 6e6], white: [4000, 11000], platelets: [150000, 450000] },
  oxygenPerLitre: 200,       // mL of oxygen carried by a litre of blood leaving the lungs
  oxygenDissolved: 3,        // mL that would dissolve in a litre of plasma alone
  haemPerCell: 270,          // million haemoglobin molecules in one red cell
  coAffinity: 200,           // "more than 200 times"
};

// What one donation takes, with an example donor's blood volume, chosen so that the share is a whole per cent
// (and never 10%, so that "how many donations fit into the blood" is always a different number).
// A standard donation is about 470 mL in the UK and about 500 mL in the United States; some countries
// take 350 to 450 mL (for example Japan 400 mL, India 350 or 450 mL).
export const DONATIONS = [
  { ml: 450, litres: 5 }, { ml: 480, litres: 6 }, { ml: 440, litres: 5.5 }, { ml: 495, litres: 5.5 },
  { ml: 400, litres: 5 }, { ml: 350, litres: 5 }, { ml: 360, litres: 4.5 },
];

// The four parts of blood and their main job (the order they settle in a spun tube: plasma on top).
export const BLOOD_PARTS = [
  { part: 'Plasma', job: 'Liquid that carries fuel, salts, wastes and heat' },
  { part: 'Red cells', job: 'Carry oxygen' },
  { part: 'White cells', job: 'Find and destroy germs' },
  { part: 'Platelets', job: 'Plug leaks and start a clot' },
];

// Sealing a cut, in order.
export const CLOT_STEPS = [
  'The cut vessel narrows',
  'Platelets stick to the gap and to each other',
  'Protein threads (fibrin) weave a mesh over the plug',
  'The mesh traps red cells and hardens into a clot',
];

/* ------------------------------------------------------- lesson 4: breathing */

// Air breathed in is about 21% oxygen and 0.04% carbon dioxide; air breathed out at rest is about 16%
// oxygen (16 to 17) and about 4% carbon dioxide (standard physiology texts; this is why rescue breaths work).
// A resting adult breathes 12 to 20 times a minute (the range used by most clinical references; some give
// 12 to 18), about half a litre each time. Air sacs: on average 480 million in a pair of adult lungs, range
// 274 to 790 million (Ochs et al., Am J Respir Crit Care Med 2004). Their total surface: textbooks give
// about 70 m² (50 to 100); careful microscopy of fully inflated lungs has given up to about 140 m²
// (Gehr, Bachofen & Weibel 1978). The air-blood barrier is about half a micrometre thick on average.
export const BREATH = {
  oxygenIn: 21,            // per cent
  oxygenOut: 16,
  co2In: 0.04,
  co2Out: 4,
  rate: [12, 20],          // breaths a minute, adult at rest
  tidal: 500,              // mL per resting breath
  airSacs: 480,            // million (range 274 to 790)
  surface: 70,             // square metres (estimates from about 50 to over 100)
  wall: 0.5,               // micrometres
};

// The route of a breath, from outside to the exchange surface.
export const AIRWAY = [
  'Nose or mouth',
  'Throat',
  'Windpipe (trachea)',
  'Two bronchi, one to each lung',
  'Ever finer bronchioles',
  'Air sacs (alveoli)',
];

/* ------------------------------------------------------- lesson 5: digestion */

// The tube, in order. Typical times (wireless-capsule studies; Lee et al., J Neurogastroenterol Motil 2014):
// stomach 2 to 5 hours, small intestine 2 to 6 hours, large intestine 10 to 59 hours; mouth to exit
// usually one to three days. Length in a living adult about 5 m, two thirds of it small intestine
// (Helander & Fändriks, Scand J Gastroenterol 2014); measurements after death, when the muscle has relaxed,
// are longer, which is where older figures of 7 to 9 m come from. The same paper puts the inner surface of
// the gut at about 32 m², of which about 30 m² is small intestine: folds, villi and microvilli enlarge it
// 60 to 120 times. Older textbooks gave "a tennis court" (250 m² or more).
export const GUT_PATH = ['Mouth', 'Oesophagus (gullet)', 'Stomach', 'Small intestine', 'Large intestine'];
export const GUT = {
  length: 5,                  // metres in life
  stomachHours: [2, 5],
  smallHours: [2, 6],
  largeHours: [10, 59],
  surface: 30,                // square metres of absorbing surface in the small intestine
  amplify: [60, 120],         // how many times folds, villi and microvilli enlarge it
  fluidPerDay: 9,             // litres entering the gut each day (about 2 drunk and eaten, 7 secreted)
};

// What each kind of food molecule is cut into, and by which enzymes.
export const NUTRIENTS = [
  { id: 'starch', name: 'Starch', food: 'bread, rice and potatoes', units: 'Sugars such as glucose', short: 'sugars', enzyme: 'Amylase', where: 'mouth and small intestine' },
  { id: 'protein', name: 'Protein', food: 'beans, eggs, fish and meat', units: 'Amino acids', short: 'amino acids', enzyme: 'Pepsin and other proteases', where: 'stomach and small intestine' },
  { id: 'fat', name: 'Fat', food: 'oils, nuts and butter', units: 'Fatty acids', short: 'fatty acids', enzyme: 'Lipase', where: 'small intestine' },
];
export const ENZYME_PAIRS = [
  ['Amylase', 'Starch'],
  ['Pepsin', 'Protein'],
  ['Lipase', 'Fat'],
  ['Lactase', 'Milk sugar (lactose)'],
];

// Smooth-tube areas (m²) and enlargement factors whose product stays within the measured range of about
// 24 to 36 m² for the small intestine.
export const VILLI_SUMS = [[0.4, 60], [0.5, 60], [0.6, 60], [0.4, 80], [0.3, 100], [0.3, 120], [0.25, 120]];

/* ------------------------------------------- organs on the body diagram (lesson 1) */

// Organs a learner is asked to find on the body-map (view 'torso'). The kidneys are left out: from the front
// they are hidden behind the liver, the stomach and the intestines (lesson 7 finds them from behind). `ids` are
// the body-map structures that count as the answer; `where` completes the sentence "The … lies/lie …" (sides are the person's own).
export const ORGANS = [
  { name: 'heart', ids: ['heart'], verb: 'lies', where: 'in the middle of the chest, between the lungs, with its tip pointing to the person\'s left' },
  { name: 'lungs', ids: ['right-lung', 'left-lung'], verb: 'lie', where: 'on either side of the heart and fill most of the chest' },
  { name: 'liver', ids: ['liver'], verb: 'lies', where: 'in the upper right of the abdomen, tucked under the ribs' },
  { name: 'stomach', ids: ['stomach'], verb: 'lies', where: 'in the upper left of the abdomen, just under the diaphragm' },
  { name: 'small intestine', ids: ['small-intestine'], verb: 'lies', where: 'coiled in the middle of the abdomen' },
  { name: 'large intestine', ids: ['large-intestine'], verb: 'lies', where: 'round the edge of the abdomen, framing the small intestine' },
  { name: 'bladder', ids: ['bladder'], verb: 'lies', where: 'low in the pelvis, in the midline' },
];

/* ---------------------------------------------------------- lesson 6: energy */

// Energy units: 1 kcal = 4.184 kJ (lessons use 4.2). With oxygen a cell makes about 30 ATP from one glucose
// (30 to 32 by modern counts; older books say 36 to 38); without oxygen, 2. An adult makes and uses roughly
// their own body weight in ATP a day while holding only about a tenth of a kilogram at any moment (standard
// biochemistry texts). At rest an adult turns over about 80 W (roughly 1,650 kcal a day; it varies with
// size, age and sex). Fat mass that is "burned" leaves as 84% carbon dioxide and 16% water
// (Meerman & Brown, BMJ 2014). Stores: about 500 g of glycogen (about 2,000 kcal) against 10 kg or more of
// fat (about 9 kcal per gram: 90,000 kcal or more), even in a lean adult.
export const ENERGY = {
  kjPerKcal: 4.2,
  atpWithOxygen: 30,
  atpWithoutOxygen: 2,
  restingWatts: 80,
  brainMassShare: 2,       // per cent of body mass
  fatAsCO2: 84,            // per cent of the mass of used fat that is breathed out
  fatAsWater: 16,
  glycogenKcal: 2000,
  fatKcal: 100000,
};

// Shares of resting energy use, rounded to the nearest 10% from Elia (1992), "Organ and tissue contribution
// to metabolic rate" (liver 21%, brain 20%, skeletal muscle 22%, heart 9%, kidneys 8%); other tables differ by a
// few points. `mass` is the organ's rough share of body mass, for contrast.
export const ORGAN_SHARES = [
  { organ: 'brain', share: 20, mass: 'about 2%' },
  { organ: 'liver', share: 20, mass: 'about 2.5%' },
  { organ: 'resting muscles', share: 20, mass: 'about 40%' },
  { organ: 'heart', share: 10, mass: 'under 0.5%' },
  { organ: 'kidneys', share: 10, mass: 'under 0.5%' },
];

// Energy figures as they appear on food labels: [kJ, kcal] pairs that are exact at 4.2 kJ per kcal.
export const LABEL_ENERGY = [[210, 50], [420, 100], [630, 150], [840, 200], [1050, 250], [1260, 300], [2100, 500]];
// Each food with the kcal values (from LABEL_ENERGY) that such a portion could plausibly carry, so that a
// conversion exercise never teaches a wrong idea of a food (a glass of milk is not 500 kcal).
export const LABEL_FOODS = [
  { food: 'a carton of yoghurt', kcal: [100, 150] },
  { food: 'a bowl of rice', kcal: [200, 250, 300] },
  { food: 'a slice of bread with cheese', kcal: [150, 200, 250] },
  { food: 'a handful of nuts', kcal: [150, 200] },
  { food: 'a glass of milk', kcal: [100, 150] },
  { food: 'a portion of lentil soup', kcal: [150, 200, 250] },
];

// With oxygen or without: [statement, 0 = with oxygen, 1 = without]
export const OXYGEN_FACTS = [
  { text: 'Yields about 30 ATP from one glucose', kind: 0 },
  { text: 'Yields only 2 ATP from one glucose', kind: 1, why: 'Without oxygen the sugar is only half taken apart, so most of its energy stays locked in the lactate.' },
  { text: 'Ends in carbon dioxide and water', kind: 0 },
  { text: 'Ends in lactate', kind: 1 },
  { text: 'Can also burn fat', kind: 0, why: 'Fat can only be burned with oxygen. There is no route without it.' },
  { text: 'Supplies nearly all your energy at rest', kind: 0 },
  { text: 'Takes the lead 30 seconds into an all-out sprint', kind: 1 },
];

/* ------------------------------------------------- lesson 7: kidneys and balance */

// Core temperature: about 36.5 to 37.5 °C in health, a little lower in the early morning and higher in the
// evening; 38 °C or more is the usual definition of a fever (NHS; standard physiology texts). Large modern
// studies put the average mouth temperature nearer 36.6 °C than the traditional 37 (Protsiv et al., eLife 2020).
// Kidneys: about 1 million filtering units (nephrons) each, with wide variation; together they filter roughly
// 125 mL a minute, about 180 L a day (90 to 125 mL a minute is usual in healthy adults, less with age), take back
// about 99% and leave 1 to 2 L of urine (Guyton & Hall). The head is about a tenth of the body's surface and
// loses about a tenth of its heat (Pretorius et al. 2006; Vreeman & Carroll, BMJ 2008). Chronic kidney disease
// affects at least one adult in ten worldwide (about 9 to 11% in the GBD 2017 analysis, Lancet 2020, and in Hill et al.
// 2016; about 14% of adults aged 20 and over in the GBD 2023 analysis, Lancet 2025).
export const BALANCE = {
  coreTemp: [36.5, 37.5],
  setPoint: 37,
  fever: 38,
  filterPerMinute: 125,     // mL
  filterPerDay: 180,        // litres
  urinePerDay: [1, 2],      // litres
  nephrons: 1,              // million per kidney
  plasma: 3,                // litres of plasma in the blood
  headHeat: 10,             // per cent
};

export const HOT = 0;
export const COLD = 1;
export const TEMP_RESPONSES = [
  { text: 'Sweat glands pour out sweat', kind: HOT },
  { text: 'Blood vessels in the skin widen', kind: HOT, why: 'Wider vessels bring more warm blood to the surface, where its heat can escape. That is why you flush when hot.' },
  { text: 'You want to find some shade', kind: HOT },
  { text: 'Muscles start to shiver', kind: COLD, why: 'Shivering is muscle working for the sake of its by-product, heat.' },
  { text: 'Blood vessels in the skin narrow', kind: COLD, why: 'Narrow vessels keep warm blood away from the surface, so less heat is lost. That is why fingers go pale in the cold.' },
  { text: 'Hairs stand on end', kind: COLD, why: 'Goosebumps trap a layer of air in furry animals. In humans they are a leftover with little effect.' },
  { text: 'You want to curl up or add a layer', kind: COLD },
];

// From losing water to saving it.
export const ADH_LOOP = [
  'You sweat a lot and drink little',
  'The blood becomes slightly more concentrated',
  'Sensors in the brain detect the change',
  'The hormone ADH is released into the blood',
  'The kidneys take back more water: less, darker urine',
];

// What is held steady, and by what.
export const STEADY = [
  ['Body temperature', 'Sweat, shivering, skin vessels'],
  ['Water', 'Thirst and the hormone ADH'],
  ['Salt', 'Kidneys shed more or less salt'],
  ['Blood sugar', 'Insulin and glucagon'],
  ['Carbon dioxide', 'Faster or slower breathing'],
];
