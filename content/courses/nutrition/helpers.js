// Food and Nutrition: the facts of the course in one place.
//
// Every figure, generated question and piece of feedback in the lessons is built from these tables, so a
// correction is made once. Each table names the body and the year it comes from. Food compositions are
// typical values per 100 g, rounded, from standard food-composition tables (USDA FoodData Central and the
// UK Composition of Foods dataset agree to within a gram or two for these foods); real products vary.

/* ------------------------------------------------------------------ energy */

// Energy per gram used on food labels ("Atwater factors"). EU Regulation 1169/2011, Annex XIV gives the same
// values in both units: carbohydrate 4 kcal (17 kJ), protein 4 (17), fat 9 (37), alcohol 7 (29), fibre 2 (8).
export const KCAL_PER_G = { carb: 4, protein: 4, fat: 9, alcohol: 7, fibre: 2 };
export const KJ_PER_G = { carb: 17, protein: 17, fat: 37, alcohol: 29, fibre: 8 };
// 1 kcal = 4.184 kJ (definition of the thermochemical calorie). Labels round it to 4.2.
export const KJ_PER_KCAL = 4.184;

// Reference daily energy for an "average adult" printed on labels: 2,000 kcal / 8,400 kJ (EU Regulation 1169/2011,
// Annex XIII; the US label uses 2,000 kcal too). Real needs run from roughly 1,600 to 3,000 kcal a day in adults
// (Dietary Guidelines for Americans 2020-2025, Appendix 2), with size, age, sex and activity.
export const REFERENCE_KCAL = 2000;

// Nutrient names as the widgets and the lessons write them.
export const NUTRIENTS = {
  water: { name: 'water', color: 'blue' },
  carb: { name: 'carbohydrate', color: 'orange' },
  fibre: { name: 'fibre', color: 'green' },
  protein: { name: 'protein', color: 'violet' },
  fat: { name: 'fat', color: 'yellow' },
};

// Typical composition per 100 g (grams). `carb` is available carbohydrate (sugars + starch), fibre is separate,
// as on European labels. The few grams missing from 100 are minerals and rounding.
export const FOODS = {
  oil:      { name: 'Olive oil',            water: 0,  carb: 0,  fibre: 0,  protein: 0,  fat: 100 },
  butter:   { name: 'Butter',               water: 16, carb: 1,  fibre: 0,  protein: 1,  fat: 81 },
  almonds:  { name: 'Almonds',              water: 4,  carb: 9,  fibre: 12, protein: 21, fat: 50 },
  cheese:   { name: 'Cheddar cheese',       water: 37, carb: 1,  fibre: 0,  protein: 25, fat: 34 },
  chocolate:{ name: 'Milk chocolate',       water: 2,  carb: 56, fibre: 3,  protein: 8,  fat: 30 },
  oats:     { name: 'Rolled oats (dry)',    water: 11, carb: 58, fibre: 10, protein: 13, fat: 7 },
  white:    { name: 'White bread',          water: 36, carb: 47, fibre: 3,  protein: 9,  fat: 3 },
  wholemeal:{ name: 'Wholemeal bread',      water: 39, carb: 38, fibre: 7,  protein: 11, fat: 3 },
  chicken:  { name: 'Chicken breast (roasted)', water: 65, carb: 0, fibre: 0, protein: 31, fat: 4 },
  egg:      { name: 'Egg (boiled)',         water: 75, carb: 1,  fibre: 0,  protein: 13, fat: 10 },
  rice:     { name: 'White rice (boiled)',  water: 68, carb: 28, fibre: 0,  protein: 3,  fat: 0 },
  lentils:  { name: 'Lentils (boiled)',     water: 70, carb: 12, fibre: 8,  protein: 9,  fat: 0 },
  potato:   { name: 'Potato (boiled)',      water: 77, carb: 18, fibre: 2,  protein: 2,  fat: 0 },
  milk:     { name: 'Whole milk',           water: 88, carb: 5,  fibre: 0,  protein: 3,  fat: 4 },
  apple:    { name: 'Apple',                water: 86, carb: 11, fibre: 2,  protein: 0,  fat: 0 },
  broccoli: { name: 'Broccoli (boiled)',    water: 89, carb: 4,  fibre: 3,  protein: 2,  fat: 0 },
  cola:     { name: 'Cola',                 water: 89, carb: 11, fibre: 0,  protein: 0,  fat: 0 },
  tofu:     { name: 'Tofu (firm)',          water: 73, carb: 1,  fibre: 1,  protein: 13, fat: 8 },
  peanuts:  { name: 'Peanuts',              water: 6,  carb: 8,  fibre: 9,  protein: 26, fat: 49 },
  yogurt:   { name: 'Plain yogurt',         water: 88, carb: 5,  fibre: 0,  protein: 4,  fat: 3 },
  salmon:   { name: 'Salmon (baked)',       water: 65, carb: 0,  fibre: 0,  protein: 22, fat: 12 },
  chickpeas:{ name: 'Chickpeas (boiled)',   water: 60, carb: 19, fibre: 8,  protein: 9,  fat: 3 },
};

/** A food from the table as the `food-makeup` widget wants it. */
export const food = (id) => ({ id, ...FOODS[id] });
export const foods = (...ids) => ids.map(food);

/** Energy of a composition in kcal, with the label factors. */
export const kcalOf = (f) => KCAL_PER_G.carb * (f.carb || 0) + KCAL_PER_G.protein * (f.protein || 0) + KCAL_PER_G.fat * (f.fat || 0) + KCAL_PER_G.fibre * (f.fibre || 0);
export const kjOf = (f) => KJ_PER_G.carb * (f.carb || 0) + KJ_PER_G.protein * (f.protein || 0) + KJ_PER_G.fat * (f.fat || 0) + KJ_PER_G.fibre * (f.fibre || 0);

// Share of the energy in a meal that is spent digesting and processing it ("thermic effect of food").
// Ranges from Westerterp, Nutrition & Metabolism 2004: fat 0-3%, carbohydrate 5-10%, protein 20-30%.
export const THERMIC = { fat: [0, 3], carb: [5, 10], protein: [20, 30] };

// How filling equal-energy portions (240 kcal) of foods were, with white bread set at 100.
// Holt, Brand-Miller, Petocz & Farmakalidis, European Journal of Clinical Nutrition 1995 (a single small study:
// a pattern, not a law).
export const SATIETY = [
  { food: 'Croissant', score: 47 },
  { food: 'Chocolate bar', score: 70 },
  { food: 'White bread', score: 100 },
  { food: 'Eggs', score: 150 },
  { food: 'Apples', score: 197 },
  { food: 'Porridge', score: 209 },
  { food: 'Boiled potatoes', score: 323 },
];

/* ----------------------------------------------------------- carbohydrates */

// Glycaemic index: mean values of the "62 common foods" table in Atkinson, Foster-Powell & Brand-Miller,
// International Tables of Glycemic Index and Glycemic Load Values, Diabetes Care 2008 (glucose = 100).
// `carbs` is the available carbohydrate in the everyday serving named in `serving` (label values, rounded).
export const GI = {
  glucose:    { name: 'Glucose drink',       gi: 100, serving: '50 g in water', carbs: 50 },
  potato:     { name: 'Boiled potato',       gi: 78, serving: '1 medium (150 g)', carbs: 27 },
  watermelon: { name: 'Watermelon',          gi: 76, serving: '1 slice (150 g)', carbs: 11 },
  white:      { name: 'White bread',         gi: 75, serving: '2 slices (70 g)', carbs: 33 },
  wholemeal:  { name: 'Wholemeal bread',     gi: 74, serving: '2 slices (70 g)', carbs: 27 },
  rice:       { name: 'White rice',          gi: 73, serving: '1 bowl (180 g)', carbs: 50 },
  sugar:      { name: 'Table sugar',         gi: 65, serving: '2 teaspoons (8 g)', carbs: 8 },
  cola:       { name: 'Cola',                gi: 59, serving: '1 can (330 mL)', carbs: 35 },
  porridge:   { name: 'Porridge (rolled oats)', gi: 55, serving: '1 bowl (40 g oats)', carbs: 23 },
  banana:     { name: 'Banana',              gi: 51, serving: '1 medium (120 g)', carbs: 24 },
  juice:      { name: 'Orange juice',        gi: 50, serving: '1 glass (250 mL)', carbs: 22 },
  spaghetti:  { name: 'Spaghetti',           gi: 49, serving: '1 plate (180 g)', carbs: 50 },
  milk:       { name: 'Milk',                gi: 39, serving: '1 glass (250 mL)', carbs: 12 },
  apple:      { name: 'Apple',               gi: 36, serving: '1 medium (150 g)', carbs: 17 },
  lentils:    { name: 'Lentils',             gi: 32, serving: '1 bowl (200 g)', carbs: 24 },
  chickpeas:  { name: 'Chickpeas',           gi: 28, serving: '1 bowl (150 g)', carbs: 28 },
};
/** Foods for the `glucose-curve` widget. With `servings`, each food brings the carbohydrate of its everyday serving. */
export const giFoods = (ids, { servings = false } = {}) => ids.map((id) => ({
  id, name: GI[id].name, gi: GI[id].gi, ...(servings ? { carbs: GI[id].carbs, serving: GI[id].serving } : {}),
}));
// Bands used with the index (Atkinson et al. 2008; ISO 26642:2010): low 55 or less, medium 56-69, high 70 or more.
export const GI_BANDS = { lowMax: 55, highMin: 70 };

// WHO guideline "Sugars intake for adults and children" (2015): free sugars under 10% of energy (strong
// recommendation), and a further reduction to under 5% suggested (conditional recommendation).
export const FREE_SUGARS = { strongPct: 10, conditionalPct: 5 };
// Sugar in ordinary cola: 10.6 g per 100 mL, so 35 g in a 330 mL can (manufacturer's label). A level teaspoon of
// sugar is about 4 g.
export const COLA_SUGAR_PER_100ML = 10.6;
export const TEASPOON_SUGAR_G = 4;

// Fibre for adults, grams a day. WHO carbohydrate guideline 2023: at least 25. EFSA 2010: 25. UK SACN 2015: 30.
// United States (Dietary Guidelines 2020-2025): 14 g per 1,000 kcal, about 25 to 34.
// Average intakes are lower: about 18 to 20 g in the UK (NDNS) and 16 to 17 g in the US (NHANES).
export const FIBRE = { who: 25, efsa: 25, uk: 30, usPer1000kcal: 14 };
// What counts as "free sugars" in the WHO definition (2015): sugars added by the manufacturer, cook or consumer,
// and the sugars naturally present in honey, syrups, fruit juices and fruit juice concentrates. Sugars inside
// whole fruit and vegetables and the lactose in milk are not free sugars.
export const FREE_SUGAR_ITEMS = {
  free: [
    { text: 'Sugar stirred into tea', why: 'Added by the person drinking it: a free sugar.' },
    { text: 'Honey on toast', why: 'The sugars in honey count as free sugars, although nobody added them to the honey.' },
    { text: 'The sugar in a glass of apple juice', why: 'Juicing frees the sugar from the fruit\'s cells and removes most of the fibre. Juice sugars count as free.' },
    { text: 'Syrup in a fizzy drink', why: 'Added by the manufacturer: a free sugar.' },
    { text: 'Sugar added to a breakfast cereal', why: 'Added by the manufacturer: a free sugar.' },
    { text: 'Maple syrup on pancakes', why: 'The sugars in syrups count as free sugars.' },
  ],
  intact: [
    { text: 'The sugar inside a whole apple', why: 'Locked inside the cells of the fruit, with its fibre and water: not a free sugar.' },
    { text: 'The lactose in a glass of plain milk', why: 'Milk sugar that is naturally in milk is not counted as a free sugar.' },
    { text: 'The sugar inside a raw carrot', why: 'Inside the cells of a whole vegetable: not a free sugar.' },
    { text: 'The sugar in a handful of whole berries', why: 'Inside whole fruit: not a free sugar.' },
    { text: 'The lactose in plain, unsweetened yogurt', why: 'Milk sugar naturally present in dairy foods is not counted as a free sugar.' },
    { text: 'The sugar inside a whole banana', why: 'Inside whole fruit: not a free sugar.' },
  ],
};

// Fibre in everyday servings (grams, label values rounded).
export const FIBRE_FOODS = [
  { id: 'lentils', name: 'a bowl of lentil soup', g: 8 },
  { id: 'wholemeal', name: 'two slices of wholemeal bread', g: 5 },
  { id: 'white', name: 'two slices of white bread', g: 2 },
  { id: 'apple', name: 'an apple', g: 4 },
  { id: 'oats', name: 'a bowl of porridge', g: 4 },
  { id: 'beans', name: 'half a tin of baked beans', g: 8 },
  { id: 'almonds', name: 'a handful of almonds', g: 4 },
  { id: 'carrot', name: 'a carrot', g: 2 },
  { id: 'rice', name: 'a bowl of white rice', g: 1 },
  { id: 'peas', name: 'a serving of peas', g: 4 },
];

/* -------------------------------------------------------------------- fats */

// The 18-carbon fatty acids the `fatty-acid` widget can build. Melting points from the CRC Handbook of
// Chemistry and Physics (rounded to the degree).
export const FATTY_ACIDS = {
  stearic:   { name: 'stearic acid',          doubles: [],          trans: false, kind: 'saturated',       omega: null, melt: 69,  found: 'beef fat, cocoa butter' },
  oleic:     { name: 'oleic acid',            doubles: [9],         trans: false, kind: 'monounsaturated', omega: 9,    melt: 13,  found: 'olive oil, rapeseed oil' },
  linoleic:  { name: 'linoleic acid',         doubles: [9, 12],     trans: false, kind: 'polyunsaturated', omega: 6,    melt: -5,  found: 'sunflower oil, nuts, seeds' },
  linolenic: { name: 'alpha-linolenic acid',  doubles: [9, 12, 15], trans: false, kind: 'polyunsaturated', omega: 3,    melt: -11, found: 'flaxseed, walnuts, rapeseed oil' },
  elaidic:   { name: 'elaidic acid',          doubles: [9],         trans: true,  kind: 'trans',           omega: 9,    melt: 45,  found: 'partially hydrogenated oils' },
};

// What common fats are made of, as a percentage of their fatty acids (USDA FoodData Central, rounded; the
// rest to 100 is rounding and minor components). Natural products vary by a few points.
export const FAT_PROFILES = [
  { id: 'coconut',   name: 'Coconut oil',   sat: 83, mono: 6,  poly: 2,  solid: true },
  { id: 'butter',    name: 'Butter',        sat: 63, mono: 26, poly: 4,  solid: true },
  { id: 'palm',      name: 'Palm oil',      sat: 49, mono: 37, poly: 9,  solid: true },
  { id: 'lard',      name: 'Lard',          sat: 39, mono: 45, poly: 11, solid: true },
  { id: 'olive',     name: 'Olive oil',     sat: 14, mono: 73, poly: 11, solid: false },
  { id: 'sunflower', name: 'Sunflower oil', sat: 10, mono: 20, poly: 66, solid: false },
  { id: 'rapeseed',  name: 'Rapeseed (canola) oil', sat: 7, mono: 63, poly: 28, solid: false },
];

// WHO guidelines on fat intake (2023): total fat 30% of energy or less, saturated fat 10% or less, trans fat 1%
// or less. The US Dietary Guidelines (2020-2025 and 2025-2030) keep saturated fat under 10% as well.
export const FAT_LIMITS = { totalPct: 30, saturatedPct: 10, transPct: 1 };

// Replacing 5% of energy from saturated fat, and the associated change in coronary heart disease risk in two
// large US cohorts followed for 24 to 30 years (Li et al., Journal of the American College of Cardiology 2015).
// Observational: associations, not proof. The refined-starch and sugar swap showed no significant change.
export const SWAPS = [
  { id: 'poly',    name: 'polyunsaturated fat',        change: -25 },
  { id: 'mono',    name: 'monounsaturated fat',        change: -15 },
  { id: 'whole',   name: 'whole grains',               change: -9 },
  { id: 'refined', name: 'refined starch and sugar',   change: 0 },
];
// Randomised trials pooled by Cochrane (Hooper et al. 2020): cutting saturated fat for at least two years lowered
// combined cardiovascular events by about 17% (RR 0.83, 12 trials; the current edition, CD011737.pub3, August 2020),
// with little or no effect on deaths from all causes (RR 0.96), both graded moderate quality. The edition of May
// 2020 (pub2, 11 trials) had put the fall in events at 21% (RR 0.79): the two figures are two editions of the same
// review, not an overall and a main analysis.
export const COCHRANE_SATFAT = { events: 17, year: 2020 };

/* ----------------------------------------------------------------- protein */

// The nine amino acids adults cannot make (the other eleven of the twenty can be made in the body).
export const ESSENTIAL_AMINO_ACIDS = ['histidine', 'isoleucine', 'leucine', 'lysine', 'methionine', 'phenylalanine', 'threonine', 'tryptophan', 'valine'];
export const AMINO_ACIDS_TOTAL = 20;

// Reference intakes for healthy adults, grams of protein per kilogram of body weight a day.
//   0.8   US/Canada Recommended Dietary Allowance (Institute of Medicine 2005)
//   0.83  WHO/FAO/UNU 2007 "safe level" and EFSA 2012 Population Reference Intake
//   1.0-1.2  healthy adults over 65 (PROT-AGE study group 2013; ESPEN 2014)
//   1.2-2.0  athletes in heavy training (ACSM, Academy of Nutrition and Dietetics & Dietitians of Canada 2016)
//   1.2-1.6  the 2025-2030 Dietary Guidelines for Americans (January 2026), a much-debated rise
export const PROTEIN_REF = { rda: 0.8, who: 0.83, olderLow: 1.0, olderHigh: 1.2, athleteLow: 1.2, athleteHigh: 2.0, dga2026Low: 1.2, dga2026High: 1.6 };
// Mean intake of US adults: about 99 g a day for men and 67 g for women (NHANES 2007-2010, Pasiakos et al. 2015).
export const PROTEIN_INTAKE_US = { men: 99, women: 67 };

// Protein in everyday servings (grams, rounded from the composition table above and standard portion sizes).
export const PROTEIN_SERVINGS = [
  { id: 'chicken',  name: 'a chicken breast (120 g)',          g: 37 },
  { id: 'salmon',   name: 'a salmon fillet (120 g)',           g: 26 },
  { id: 'lentils',  name: 'a bowl of lentils (200 g, cooked)', g: 18 },
  { id: 'tofu',     name: 'a block of firm tofu (150 g)',      g: 20 },
  { id: 'eggs',     name: 'two eggs',                          g: 13 },
  { id: 'yogurt',   name: 'a pot of plain yogurt (150 g)',     g: 6 },
  { id: 'milk',     name: 'a glass of milk (250 mL)',          g: 8 },
  { id: 'cheese',   name: 'a slice of cheddar (30 g)',         g: 8 },
  { id: 'peanuts',  name: 'a handful of peanuts (30 g)',       g: 8 },
  { id: 'bread',    name: 'two slices of wholemeal bread',     g: 8 },
  { id: 'chickpeas', name: 'a bowl of chickpeas (150 g, cooked)', g: 13 },
  { id: 'rice',     name: 'a bowl of rice (180 g, cooked)',    g: 5 },
  { id: 'oats',     name: 'a bowl of porridge (40 g oats)',    g: 5 },
];

/* ----------------------------------------------------- vitamins & minerals */

// The thirteen vitamins, by what they dissolve in.
export const VITAMINS = {
  fat: ['A', 'D', 'E', 'K'],
  water: ['C', 'B1 (thiamin)', 'B2 (riboflavin)', 'B3 (niacin)', 'B5', 'B6', 'B7 (biotin)', 'B9 (folate)', 'B12'],
};

// Deficiency diseases and the discoveries behind them.
export const DEFICIENCY = [
  { nutrient: 'Vitamin C', disease: 'scurvy', sign: 'bleeding gums, wounds that do not heal', sources: 'fruit and vegetables' },
  { nutrient: 'Vitamin D', disease: 'rickets', sign: 'soft, bending bones in children', sources: 'sunlight on skin, oily fish, fortified foods' },
  { nutrient: 'Thiamin (B1)', disease: 'beriberi', sign: 'weakness and nerve damage', sources: 'whole grains, pulses, pork' },
  { nutrient: 'Iodine', disease: 'goitre', sign: 'a swollen thyroid gland in the neck', sources: 'iodised salt, sea fish, dairy' },
  { nutrient: 'Iron', disease: 'anaemia', sign: 'tiredness, pale skin, breathlessness', sources: 'meat, pulses, dark green leaves' },
  { nutrient: 'Vitamin A', disease: 'night blindness', sign: 'poor sight in dim light, then eye damage', sources: 'liver, eggs, orange and dark green vegetables' },
];

// Milestones (years checked against the standard histories; Lind's own account is his Treatise of the Scurvy, 1753).
export const VITAMIN_HISTORY = [
  { id: 'lind', year: 1747, label: "Lind's scurvy trial", short: 'Lind', note: 'On HMS Salisbury, James Lind gives six pairs of sailors with scurvy six different remedies. Only the pair given oranges and lemons recover quickly.' },
  { id: 'eijkman', year: 1897, label: 'Eijkman and beriberi', short: 'Eijkman', note: 'In Java, Christiaan Eijkman reports that chickens fed polished white rice fall ill, and recover on brown rice. Something in the bran protects them.' },
  { id: 'funk', year: 1912, label: 'The word "vitamine"', short: 'Funk', note: 'Casimir Funk proposes that beriberi, scurvy and rickets are each caused by the lack of a "vital amine" in food.' },
  { id: 'salt', year: 1922, label: 'Iodised salt', short: 'Iodised salt', note: 'Switzerland begins adding iodine to table salt to prevent goitre. Michigan follows in 1924.' },
  { id: 'folic', year: 1998, label: 'Folic acid in flour', short: 'Folic acid', note: 'The United States and Canada require folic acid in enriched flour. Neural tube defects fall by a quarter or more.' },
];

// WHO (Global Health Observatory, 2025 edition): anaemia affected 30.7% of women aged 15 to 49 in 2023 and
// 39.8% of children aged 6 to 59 months in 2019. Iron deficiency is the commonest single cause.
export const ANAEMIA = { womenPct: 31, childrenPct: 40 };
// Folic acid before conception and in early pregnancy: 400 micrograms a day (WHO; NHS; US CDC and USPSTF 2023).
// MRC Vitamin Study, Lancet 1991: 72% fewer recurrences of neural tube defects.
export const FOLIC_ACID_UG = 400;
// Label reference values for adults on European packs ("NRV", EU Regulation 1169/2011, Annex XIII).
// `unit` is the unit the label uses: mg (thousandths of a gram) or µg (millionths).
export const NRV = {
  c:      { name: 'vitamin C',   amount: 80,  unit: 'mg' },
  d:      { name: 'vitamin D',   amount: 5,   unit: 'µg' },
  b12:    { name: 'vitamin B12', amount: 2.5, unit: 'µg' },
  folic:  { name: 'folic acid',  amount: 200, unit: 'µg' },
  a:      { name: 'vitamin A',   amount: 800, unit: 'µg' },
  iron:   { name: 'iron',        amount: 14,  unit: 'mg' },
  zinc:   { name: 'zinc',        amount: 10,  unit: 'mg' },
  iodine: { name: 'iodine',      amount: 150, unit: 'µg' },
  calcium:{ name: 'calcium',     amount: 800, unit: 'mg' },
};
// Tolerable upper intake level for preformed vitamin A in adults: 3,000 µg a day (US Institute of Medicine 2001;
// EFSA). The reference intake is 700 to 900 µg, so the margin is only about fourfold.
export const VITAMIN_A = { upperUg: 3000, referenceUg: [700, 900] };
// Vitamin C and the common cold: Cochrane review (Hemilä & Chalker 2013), 29 trial comparisons, 11,306 people.
// Taken every day it did not reduce the number of colds in the general population; colds were about 8% shorter
// in adults and 14% shorter in children. In five trials of people under heavy physical stress (marathon runners,
// skiers, soldiers in the subarctic) it halved the risk.
export const VITAMIN_C_COLDS = { trials: 29, people: 11306, shorterAdultsPct: 8, shorterChildrenPct: 14 };
// US Preventive Services Task Force 2022: evidence insufficient to recommend multivitamins for preventing
// cardiovascular disease or cancer; recommends against beta-carotene and vitamin E for that purpose.
// Beta-carotene supplements raised lung cancer by 18% in male smokers (ATBC trial, 1994) and, given with vitamin A,
// by 28% in smokers, former smokers and asbestos-exposed workers (CARET, 1996).

/* ------------------------------------------------------------ water & salt */

// Adequate intake of total water (drinks and food together), litres a day for adults in a temperate climate
// with moderate activity. EFSA 2010: women 2.0, men 2.5. US National Academies (IOM) 2004: women 2.7, men 3.7.
// About 20 to 30% of it comes from food (EFSA 2010).
export const WATER = { efsa: { women: 2.0, men: 2.5 }, us: { women: 2.7, men: 3.7 }, fromFoodPct: [20, 30] };

// A typical day's water balance for an adult at rest in a temperate climate, in mL (textbook values, e.g.
// Guyton & Hall, Medical Physiology; they shift a great deal with heat and exercise).
export const WATER_BALANCE = {
  in: [{ name: 'Drinks', mL: 1500 }, { name: 'Food', mL: 700 }, { name: 'Made in cells', mL: 300 }],
  out: [{ name: 'Urine', mL: 1500 }, { name: 'Skin and sweat', mL: 500 }, { name: 'Breath', mL: 400 }, { name: 'Faeces', mL: 100 }],
};

// WHO guideline on sodium (2012, reaffirmed in the 2023 global report): adults under 2 g of sodium a day, which
// is under 5 g of salt. World average intake: 4.3 g of sodium, about 10.8 g of salt (WHO 2023).
// Salt (sodium chloride) is 40% sodium by weight, so salt = sodium x 2.5.
export const SALT = { whoMaxG: 5, sodiumMaxG: 2, worldAverageG: 10.8, sodiumToSalt: 2.5 };
// WHO guideline on potassium (2012): adults at least 3.5 g (3,510 mg) a day.
export const POTASSIUM_MIN_MG = 3510;
// Where the sodium in the diet comes from, United States (Harnack et al., Circulation 2017; 450 adults in three
// regions): 71% added outside the home (processed and restaurant food), 14% naturally in foods, 6% added in home
// cooking, 5% at the table; the rest from tap water and supplements. Shares differ by country: in China and
// Japan much more comes from salt and sauces added in the kitchen.
export const SODIUM_SOURCES = [
  { id: 'processed', name: 'Processed and\nrestaurant food', pct: 71 },
  { id: 'natural', name: 'Naturally\nin foods', pct: 14 },
  { id: 'cooking', name: 'Added in\nhome cooking', pct: 6 },
  { id: 'table', name: 'Added at\nthe table', pct: 5 },
];
// Salt in everyday servings, grams (typical label values; products vary widely).
export const SALT_FOODS = [
  { id: 'noodles', name: 'a pack of instant noodles', g: 4.0 },
  { id: 'pizza', name: 'half a frozen pizza', g: 2.5 },
  { id: 'soup', name: 'a bowl of tinned soup', g: 1.8 },
  { id: 'soy', name: 'a tablespoon of soy sauce', g: 2.4 },
  { id: 'bread', name: 'two slices of bread', g: 0.8 },
  { id: 'ham', name: 'two slices of ham', g: 1.0 },
  { id: 'cheese', name: 'a slice of cheddar', g: 0.5 },
  { id: 'crisps', name: 'a small bag of crisps', g: 0.4 },
  { id: 'cereal', name: 'a bowl of cornflakes', g: 0.3 },
  { id: 'apple', name: 'an apple', g: 0 },
];

// Caffeine. EFSA 2015: up to 400 mg a day and up to 200 mg at once raise no safety concern for healthy adults;
// up to 200 mg a day in pregnancy and when breastfeeding. Typical contents from the same opinion (they vary a lot
// with the bean, the brew and the cup).
export const CAFFEINE = { adultDayMg: 400, singleMg: 200, pregnancyDayMg: 200 };
export const CAFFEINE_DRINKS = [
  { id: 'filter', name: 'a mug of filter coffee (200 mL)', mg: 90 },
  { id: 'espresso', name: 'an espresso (60 mL)', mg: 80 },
  { id: 'energy', name: 'a can of energy drink (250 mL)', mg: 80 },
  { id: 'tea', name: 'a mug of black tea (220 mL)', mg: 50 },
  { id: 'cola', name: 'a can of cola (355 mL)', mg: 40 },
];

/* ------------------------------------------------------------- eating well */

// UK front-of-pack "traffic light" bands for foods, grams per 100 g (Department of Health / Food Standards
// Agency guidance, 2013, updated 2016). Other countries use other schemes and other cut-offs.
export const TRAFFIC = {
  fat:       { name: 'Fat',       low: 3.0, high: 17.5 },
  saturates: { name: 'Saturates', low: 1.5, high: 5.0 },
  sugars:    { name: 'Sugars',    low: 5.0, high: 22.5 },
  salt:      { name: 'Salt',      low: 0.3, high: 1.5 },
};
/** 'low' | 'medium' | 'high' for a nutrient at `g` grams per 100 g. */
export const trafficBand = (key, g) => (g <= TRAFFIC[key].low ? 'low' : g > TRAFFIC[key].high ? 'high' : 'medium');

// Sample products for the `food-label` widget: per 100 g, as a European label prints it. Invented products with
// realistic values; the energy lines are computed from the grams with the label factors.
export const LABELS = {
  granola: { name: 'Crunchy oat granola', serving: 45, unit: 'g', fat: 15, saturates: 3.5, carb: 60, sugars: 22, fibre: 7, protein: 9, salt: 0.1,
    ingredients: ['oat flakes (55%)', 'sugar', 'sunflower oil', 'honey (4%)', 'almonds (3%)', 'salt'] },
  muesli: { name: 'No-added-sugar muesli', serving: 45, unit: 'g', fat: 7, saturates: 1.2, carb: 58, sugars: 12, fibre: 9, protein: 11, salt: 0.05,
    ingredients: ['oat flakes (48%)', 'wheat flakes', 'raisins (12%)', 'hazelnuts (5%)', 'sunflower seeds'] },
  soup: { name: 'Tomato soup (tinned)', serving: 200, unit: 'g', fat: 2.5, saturates: 0.3, carb: 7, sugars: 5, fibre: 0.8, protein: 1, salt: 0.6,
    ingredients: ['tomatoes (84%)', 'water', 'modified maize starch', 'sugar', 'rapeseed oil', 'salt'] },
  yogurt: { name: 'Strawberry yogurt', serving: 125, unit: 'g', fat: 2.8, saturates: 1.8, carb: 13, sugars: 12.5, fibre: 0.2, protein: 4, salt: 0.15,
    ingredients: ['yogurt (milk)', 'sugar (8%)', 'strawberries (6%)', 'modified starch', 'flavouring'] },
  crackers: { name: 'Salted crackers', serving: 25, unit: 'g', fat: 22, saturates: 9, carb: 62, sugars: 4, fibre: 3, protein: 8, salt: 2.0,
    ingredients: ['wheat flour', 'palm oil', 'sugar', 'salt', 'raising agent', 'barley malt extract'] },
  beans: { name: 'Baked beans in tomato sauce', serving: 200, unit: 'g', fat: 0.4, saturates: 0.1, carb: 12, sugars: 4.5, fibre: 4, protein: 5, salt: 0.6,
    ingredients: ['haricot beans (51%)', 'tomatoes (34%)', 'water', 'sugar', 'modified maize starch', 'salt', 'spices'] },
  bar: { name: 'Chocolate cereal bar', serving: 30, unit: 'g', fat: 18, saturates: 8, carb: 64, sugars: 32, fibre: 4, protein: 6, salt: 0.4,
    ingredients: ['glucose syrup', 'oat flakes (22%)', 'milk chocolate (18%)', 'palm oil', 'sugar', 'crisped rice', 'salt'] },
  bread: { name: 'Wholemeal sliced bread', serving: 40, unit: 'g', fat: 2.5, saturates: 0.5, carb: 38, sugars: 3, fibre: 7, protein: 11, salt: 0.9,
    ingredients: ['wholemeal wheat flour (62%)', 'water', 'yeast', 'salt', 'rapeseed oil'] },
};
export const label = (id) => ({ id, ...LABELS[id] });

// What the eating patterns with the best trial evidence have in common (Mediterranean: PREDIMED, NEJM 2013,
// republished 2018; DASH: Appel et al., NEJM 1997; summarised in WHO "Healthy diet" 2020 and national guides).
export const PATTERN_PLENTY = ['vegetables', 'fruit', 'beans, lentils and other pulses', 'whole grains', 'nuts and seeds', 'fish or other sources of unsaturated fat'];
export const PATTERN_LITTLE = ['processed meat', 'sugary drinks', 'refined grains', 'foods high in salt'];

// The plate that Canada's Food Guide (2019) and the Harvard Healthy Eating Plate (2011) both draw, in eighths.
export const PLATE = { veg: 4, grain: 2, protein: 2 };

// Hall et al., Cell Metabolism 2019 (NIH): 20 adults, two weeks on each diet, meals matched for energy, sugar,
// fat, fibre and salt offered; eaten freely. On the ultra-processed diet they ate about 500 kcal a day more.
export const NOVA_TRIAL = { people: 20, weeks: 2, extraKcal: 500, year: 2019 };
// IARC 2015: each 50 g of processed meat eaten daily raises the risk of bowel cancer by about 18% (relative).
// In absolute terms, in the UK: about 56 in 1,000 people who eat the least develop it in a lifetime, and about
// 66 in 1,000 of those who eat the most (Cancer Research UK's presentation of the same data).
export const PROCESSED_MEAT = { relativePct: 18, per1000Low: 56, per1000High: 66 };

/* ------------------------------------------------------------------ wording */

/** "1 gram" / "3 grams". */
export const grams = (n) => `${n} ${n === 1 ? 'gram' : 'grams'}`;
/** A number with a thousands comma: 2,000. */
export const grouped = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** One decimal at most, without float noise. */
export const dp1 = (v) => String(Math.round(v * 10) / 10);
/** Named example people for calculations (never the learner). */
export const PEOPLE = ['Amara', 'Ben', 'Chen', 'Dalia', 'Emeka', 'Farah', 'Goran', 'Hana', 'Ines', 'Jamal', 'Keiko', 'Luis', 'Mina', 'Noor', 'Omar', 'Priya'];
