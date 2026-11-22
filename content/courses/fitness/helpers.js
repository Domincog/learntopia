// Movement and Fitness: the facts of the course in one place.
//
// Every number a lesson states comes from a table in this file, so that a
// correction is made once. Each table names the body or study and the year.
// tests/fitness-course.test.mjs holds an independent copy of the key figures
// and fails if the two disagree.
//
// General health education, not personal medical advice.

/* ------------------------------------------------------------------ guidelines */

// WHO guidelines on physical activity and sedentary behaviour (2020), still current in 2026.
// Adults 18–64: 150–300 min moderate OR 75–150 min vigorous aerobic activity a week (or an equivalent
// mix), plus muscle-strengthening of all major muscle groups on 2 or more days. Children and
// adolescents 5–17: an average of 60 min a day of moderate-to-vigorous activity, with vigorous and
// muscle- and bone-strengthening activity on at least 3 days. Adults 65+: as adults, plus varied
// multicomponent activity that emphasises balance and strength on 3 or more days.
export const WHO = {
  year: 2020,
  adult: { moderate: [150, 300], vigorous: [75, 150], strengthDays: 2 },
  child: { dailyAverage: 60, vigorousDays: 3 },
  older: { balanceDays: 3 },
  /** One minute of vigorous activity counts as two of moderate. */
  vigorousFactor: 2,
  /** WHO 2020: on a 0–10 scale of a person's own capacity, moderate is usually 5 or 6, vigorous 7 or 8. */
  rpe: { moderate: [5, 6], vigorous: [7, 8] },
};

/** Moderate-equivalent minutes: vigorous minutes count double. */
export const equivalent = (moderate, vigorous) => moderate + WHO.vigorousFactor * vigorous;

// WHO fact sheet "Physical activity" (June 2024), from Strain et al., Lancet Global Health 2024.
export const INACTIVITY = { adultsPercent: 31, adultsBillion: 1.8, year: 2022 };

/* ----------------------------------------------------------------- dose–response */

// Arem et al., JAMA Internal Medicine 2015: pooled analysis of six cohorts, 661,137 adults followed for
// a median of 14.2 years. Risk of death compared with people reporting no leisure-time activity
// (= 100). "times" are multiples of the guideline minimum (7.5 MET-hours a week, about 150 minutes of
// moderate activity).
export const DOSE = [
  { id: 'none', label: 'None', times: [0, 0], risk: 100 },
  { id: 'some', label: 'Some, below the guideline', times: [0, 1], minutes: 75, risk: 80 },
  { id: 'x1', label: '1 to 2 times the minimum', times: [1, 2], minutes: 225, risk: 69 },
  { id: 'x2', label: '2 to 3 times', times: [2, 3], minutes: 375, risk: 63 },
  { id: 'x3', label: '3 to 5 times', times: [3, 5], minutes: 600, risk: 61 },
  { id: 'x5', label: '5 to 10 times', times: [5, 10], risk: 61 },
  { id: 'x10', label: '10 times or more', times: [10, Infinity], risk: 69 },
];

// A smooth curve drawn through the first five groups (placed at the middle of each group's range).
// It is a drawing aid, not a result of the study: 59.4 + 11.5·e^(−m/30) + 29.1·e^(−m/195).
export const DOSE_EXPR = '59.4 + 11.5*exp(-x/30) + 29.1*exp(-x/195)';
export const doseRisk = (minutes) => 59.4 + 11.5 * Math.exp(-minutes / 30) + 29.1 * Math.exp(-minutes / 195);

// Steps. Ding et al., Lancet Public Health 2025 (meta-analysis, 57 studies): compared with 2,000 steps a
// day, 7,000 steps a day went with a 47% lower risk of death; most curves flatten at about 5,000 to
// 7,000. Paluch et al., Lancet Public Health 2022 (15 cohorts): the benefit levels off at about
// 6,000–8,000 steps a day for people over 60 and 8,000–10,000 for younger adults.
// The 10,000 figure: the "manpo-kei" ("10,000-steps meter"), a pedometer sold by Yamasa in Japan from
// about 1965.
export const STEPS = { reference: 2000, benefit: 7000, lowerRiskPercent: 47, slogan: 10000, sloganYear: 1965 };

// Morris et al., Lancet 1953: London bus conductors (about 500–750 stairs a working day) had roughly
// half the rate of fatal heart attacks of the drivers of the same buses.
export const BUS_STUDY = { year: 1953 };

/* -------------------------------------------------------------------- intensity */

// Examples of intensity for a typical healthy adult, as listed in the US Physical Activity Guidelines
// (2nd edition, 2018), the CDC and the NHS. Intensity is relative: the same walk can be light for one
// person and vigorous for another.
export const ACTIVITIES = [
  { text: 'Strolling slowly', level: 'light' },
  { text: 'Washing the dishes', level: 'light' },
  { text: 'Cooking a meal', level: 'light' },
  { text: 'Dusting the shelves', level: 'light' },
  { text: 'Walking briskly', level: 'moderate' },
  { text: 'Cycling gently on flat ground', level: 'moderate' },
  { text: 'Water aerobics', level: 'moderate' },
  { text: 'Doubles tennis', level: 'moderate' },
  { text: 'Ballroom dancing', level: 'moderate' },
  { text: 'Raking leaves', level: 'moderate' },
  { text: 'Pushing a lawn mower', level: 'moderate' },
  { text: 'Running', level: 'vigorous' },
  { text: 'Swimming laps', level: 'vigorous' },
  { text: 'Singles tennis', level: 'vigorous' },
  { text: 'Skipping with a rope', level: 'vigorous' },
  { text: 'Cycling fast or uphill', level: 'vigorous' },
  { text: 'Hiking uphill with a heavy pack', level: 'vigorous' },
  { text: 'A football match', level: 'vigorous' },
];
export const LEVELS = ['light', 'moderate', 'vigorous'];

// The talk test (CDC, NHS): at moderate intensity you can talk but not sing; at vigorous intensity you
// cannot say more than a few words without pausing for breath.
export const TALK = {
  light: 'can talk and sing',
  moderate: 'can talk, but not sing',
  vigorous: 'only a few words between breaths',
};

/* ---------------------------------------------------------------- example people */

export const PEOPLE = ['Amira', 'Kofi', 'Mei', 'Diego', 'Priya', 'Tomás', 'Aiko', 'Noor', 'Sam', 'Lena', 'Ravi', 'Zanele', 'Mateo', 'Ingrid', 'Kenji', 'Rosa', 'Dev', 'Ana', 'Yusuf', 'Hana'];

/* ------------------------------------------------------------- heart and stamina */

// Typical adult values from physiology textbooks; they vary with age, sex, size and fitness.
export const HEART = {
  restingRate: [60, 100],          // beats a minute, adults (AHA, NHS)
  athleteRate: [40, 60],           // well-trained endurance athletes
  restOutput: 5,                   // litres a minute at rest
  maxOutputUntrained: 20,          // about, healthy young adult
  maxOutputElite: 35,              // or more, elite endurance athletes
};

// Estimating maximum heart rate. "220 − age" goes back to Fox, Naughton and Haskell (1971) and was not
// derived from a single study; Tanaka, Monahan and Seals (J Am Coll Cardiol 2001; 351 studies, 18,712
// people) found 208 − 0.7 × age. Either is an average: individual values are spread about 10 beats a
// minute (one standard deviation) to either side.
export const maxHeartRate = {
  fox: (age) => 220 - age,
  tanaka: (age) => Math.round((208 - 0.7 * age) * 10) / 10,
  spread: 10,
};

// Heart-rate ranges for intensity differ between bodies, so no lesson grades them:
// CDC 64–76% of maximum for moderate and 77–93% for vigorous; American Heart Association 50–70% and 70–85%.
export const HR_ZONES = { cdc: { moderate: [64, 76], vigorous: [77, 93] }, aha: { moderate: [50, 70], vigorous: [70, 85] } };

/* ------------------------------------------------------------------------ strength */

// Fiatarone et al., JAMA 1990: ten frail nursing-home residents (mean age 90, the oldest 96) began eight
// weeks of high-intensity leg-strength training; in the nine who completed it, strength rose by 174% on average.
export const NONAGENARIANS = { year: 1990, weeks: 8, meanAge: 90, gainPercent: 174 };

// Jones et al., J Bone Joint Surg 1977: in professional tennis players the bone wall (cortex) of the
// upper-arm bone was about 35% thicker in the playing arm of men and 28% in women.
export const TENNIS_ARM = { year: 1977, men: 35, women: 28 };

// Muscle-strengthening activities (NHS "Physical activity guidelines for adults", WHO 2020).
export const STRENGTHENING = [
  { text: 'Push-ups or squats', yes: true },
  { text: 'Exercises with a resistance band', yes: true },
  { text: 'Lifting weights', yes: true },
  { text: 'Carrying heavy shopping bags', yes: true },
  { text: 'Digging the garden', yes: true },
  { text: 'Yoga or Pilates', yes: true },
  { text: 'Pushing yourself along in a wheelchair', yes: true },
  { text: 'A gentle stroll', yes: false, why: 'Good for you, but it does not load the muscles hard enough to count as strengthening.' },
  { text: 'Watching a workout video', yes: false, why: 'Watching is not loading. The muscles have to do the work.' },
  { text: 'Stretching your calves', yes: false, why: 'Stretching works on range of movement. It does not make a muscle work against a load.' },
];

/* -------------------------------------------------------------- mobility and balance */

// Lauersen, Bertelsen and Andersen, Br J Sports Med 2014: 25 randomised trials, 26,610 participants.
// Sports injuries per 100 in the comparison groups (relative risk × 100).
export const INJURY_TRIALS = { year: 2014, stretching: 96, balance: 55, strength: 32 };

// Herbert, de Noronha and Kamper, Cochrane Database Syst Rev 2011: stretching before or after exercise
// changes next-day soreness by about 1 point on a 100-point scale.
export const STRETCH_SORENESS = { year: 2011, pointsOf100: 1 };

// Sherrington et al., Cochrane Database Syst Rev 2019 (108 trials, 23,407 people living at home, mostly
// over 65): exercise programmes cut the rate of falls by 23% (high-certainty evidence).
export const FALLS = { year: 2019, reductionPercent: 23 };

// Brinjikji et al., AJNR 2015: MRI and CT findings in 3,110 people WITHOUT back pain, by age.
export const SPINE_SCANS = {
  year: 2015,
  ages: [20, 50, 80],
  degeneration: [37, 80, 96],      // % with "disc degeneration"
  bulge: [30, 60, 84],             // % with a "disc bulge"
};

// WHO fact sheet "Low back pain" (2023): 619 million people in 2020, the leading cause of disability
// worldwide; about 90% of cases are "non-specific". Henschke et al., Arthritis Rheum 2009: of 1,172
// people seeing a primary-care clinician with new low back pain, 0.9% had a serious cause.
export const BACK_PAIN = { millions: 619, year: 2020, nonSpecificPercent: 90, seriousPer100: 1 };

/* -------------------------------------------------------------- training and recovery */

// Delayed-onset muscle soreness: begins 12–24 h after unaccustomed exercise, peaks at 24–72 h and
// fades within about a week. Blood lactate is back at resting level within about an hour.
export const DOMS = { peakHours: [24, 72], lactateClearedHours: 1 };

// What a pain after exercise most likely means, and what to do: 'sore' (delayed-onset muscle soreness:
// both sides, a dull ache a day or two after something new, easing with movement), 'stop' (a possible
// strain, sprain or overuse injury: sudden, sharp, one-sided, in a joint, or getting worse) and
// 'emergency' (red flags for the heart, the brain or heatstroke: call the emergency number).
// NHS, American Heart Association and Red Cross first-aid guidance.
export const PAINS = [
  { text: 'Both thighs ache and feel stiff two days after a first long downhill walk. It eases once moving.', kind: 'sore' },
  { text: 'Both calves are tender to the touch the day after a first dance class.', kind: 'sore' },
  { text: 'Arms and chest ache dully on the second morning after trying push-ups for the first time.', kind: 'sore' },
  { text: 'The muscles of both legs feel heavy and sore the day after a longer bike ride than usual.', kind: 'sore' },
  { text: 'A sudden sharp pain in the back of one thigh during a sprint. Walking now hurts.', kind: 'stop', what: 'a pulled (strained) muscle' },
  { text: 'An ankle rolls over on a kerb, swells within the hour and hurts to stand on.', kind: 'stop', what: 'a sprain, or possibly a break' },
  { text: 'Pain along one shin that starts earlier in every run and now lingers in the evening.', kind: 'stop', what: 'an overuse injury of the bone or its covering' },
  { text: 'One knee hurts sharply inside the joint with every squat, and has done for two weeks.', kind: 'stop', what: 'a joint or tendon problem' },
  { text: 'Pressure in the chest during a brisk uphill walk, spreading to the arm and jaw.', kind: 'emergency', what: 'a possible heart attack' },
  { text: 'On a hot day a runner becomes confused and stumbles, and their skin is very hot.', kind: 'emergency', what: 'possible heatstroke' },
  { text: 'During a game someone suddenly cannot lift one arm, and their speech is slurred.', kind: 'emergency', what: 'a possible stroke' },
];
export const PAIN_ANSWERS = {
  sore: 'Ordinary training soreness: gentle movement is fine',
  stop: 'Stop, rest it, and get it checked if it does not settle',
  emergency: 'Stop and call the emergency number now',
};

// Changes in weekly training load, for practice with percentages.
export const RAMPS = [[10, 15], [20, 25], [20, 30], [30, 33], [40, 50], [40, 60], [10, 20], [40, 44], [25, 30], [50, 55]];

/* ----------------------------------------------------------------------------- habits */

// Lally, van Jaarsveld, Potts and Wardle, Eur J Soc Psychol 2010: 96 volunteers; the median time for a
// new daily behaviour to become automatic was 66 days, with a range from 18 to 254 days.
// "21 days" comes from Maxwell Maltz, Psycho-Cybernetics (1960), a remark about patients getting used
// to a changed appearance.
export const HABIT = { medianDays: 66, range: [18, 254], year: 2010, mythDays: 21, mythYear: 1960 };

// If-then plans ("implementation intentions", Gollwitzer 1999): a named cue, then a specific action.
// Each entry: a plan of that form, and three things that are not (a wish, a vague resolve, a slogan).
export const IF_THEN = [
  { plan: 'When I get home on Tuesdays and Thursdays, I will change straight into my walking shoes and walk for 20 minutes.', wish: 'I want to be fitter by the summer.', vague: 'I will try to walk more often.', slogan: 'No excuses: just do it.' },
  { plan: 'After I put the kettle on in the morning, I will do ten squats while it boils.', wish: 'I would love to have stronger legs.', vague: 'I will do some exercises when I can.', slogan: 'Strong body, strong mind.' },
  { plan: 'When my lunch break starts, I will walk once around the park before I eat.', wish: 'I hope to lose my afternoon slump.', vague: 'I will get out more at lunchtime.', slogan: 'A body in motion stays in motion.' },
  { plan: 'If it is raining at 7 on Saturday, I will do the exercise video in the living room instead of my run.', wish: 'I wish the weather would not stop me.', vague: 'I will not let rain put me off any more.', slogan: 'There is no bad weather.' },
  { plan: 'When I step off the bus on the way home, I will get off one stop early and walk the rest.', wish: 'I want to reach 7,000 steps a day.', vague: 'I will build more walking into my day.', slogan: 'Every step counts.' },
  { plan: 'After I brush my teeth at night, I will stand on each leg for thirty seconds by the basin.', wish: 'I would like better balance.', vague: 'I will practise balancing regularly.', slogan: 'Use it or lose it.' },
];

/* --------------------------------------------------------------------------- wording */

export const plural = (n, word, many) => `${n} ${n === 1 ? word : (many || `${word}s`)}`;
/** "Amira's", "Tomás's". */
export const possessive = (name) => `${name}'s`;
/** 1234 -> "1,234" */
export const grouped = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
