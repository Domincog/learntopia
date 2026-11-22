// Sleep, Stress and Mental Health: the facts of the course in one place.
// Figures, generated questions and feedback are built from these tables, so a
// correction is made once. Every number carries its source (body, year).
// General health education, not personal medical advice.

import { photo } from '../../media.js';
import { MEDIA } from '../../media/sleep-mind/index.js';

/** A picture of this course as a figure, or nothing at all if it has not been fetched (the step must work without it). */
export const pic = (id, options) => (MEDIA[id] ? photo(MEDIA[id], options) : undefined);

/* ------------------------------------------------------------------ text helpers */

/** "23:30" from hours counted from midnight (may run past 24 or below 0). */
export function clock(hours) {
  const total = Math.round((((hours % 24) + 24) % 24) * 60);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "7.5" → "7½ hours", "8" → "8 hours", "1" → "1 hour", "0.5" → "half an hour". */
export function hoursText(v) {
  if (v === 0.5) return 'half an hour';
  const whole = Math.floor(v);
  const half = Math.abs(v - whole - 0.5) < 1e-9;
  if (half) return `${whole}½ hours`;
  return `${v} ${v === 1 ? 'hour' : 'hours'}`;
}

/** "1 day", "4 days". */
export const daysText = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;

/* ------------------------------------------------------------------ lesson 1: why-sleep */

// The stages of sleep, as scored in sleep laboratories (American Academy of Sleep Medicine
// scoring manual, 2007 and later editions: N1, N2, N3 and REM replaced the older "stages 1 to 4").
// Typical shares of a healthy young adult's night (textbook ranges, e.g. StatPearls "Physiology,
// Sleep Stages", 2024): N1 about 5%, N2 about 45 to 55%, N3 about 13 to 25%, REM about 20 to 25%.
// `gist` is the one-line version of `note` that the teaching table of lesson 1 prints.
export const STAGES = {
  W: { name: 'Awake', short: 'Awake', color: 'gray', gist: 'Brief awakenings are part of every normal night', note: 'Brief awakenings are part of every normal night. Most are too short to remember.' },
  REM: { name: 'REM sleep', short: 'REM', color: 'orange', gist: 'Darting eyes, the most vivid dreams, large muscles switched off', note: 'Rapid eye movement sleep: the brain is nearly as active as when awake, the eyes dart about, most vivid dreams happen, and the body\'s large muscles are switched off.' },
  N1: { name: 'N1: dozing off', short: 'N1', color: 'teal', gist: 'Dozing off: the doorway into sleep, a few minutes long', note: 'The doorway into sleep. It lasts a few minutes, and a person woken now often says they were not asleep at all.' },
  N2: { name: 'N2: light sleep', short: 'N2', color: 'blue', gist: 'Light sleep: about half of the night is spent here', note: 'Light, stable sleep. Heart rate and body temperature fall. About half of the night is spent here.' },
  N3: { name: 'N3: deep sleep', short: 'N3', color: 'violet', gist: 'Deep sleep: big, slow brain waves, hardest to be woken from', note: 'Deep, slow-wave sleep: big, slow brain waves, and the hardest stage to be woken from.' },
};

// One typical night of a healthy young adult, lights out at 23:00, up at 07:00: [stage, minutes].
// A teaching example built to match the textbook pattern: cycles of roughly 90 minutes (range
// about 70 to 120), most deep sleep in the first half, REM periods that lengthen towards morning.
// Totals: N3 98 min, REM 114 min, N2 232 min, N1 17 min, awake 19 min: of the 461 minutes asleep,
// N3 is 21%, REM 25%, N2 50% and N1 4%.
export const NIGHT = [
  ['W', 10], ['N1', 10], ['N2', 10], ['N3', 42], ['N2', 10], ['REM', 8],
  ['N2', 20], ['N3', 38], ['N2', 17], ['REM', 18],
  ['N2', 32], ['N3', 18], ['N2', 22], ['REM', 26],
  ['W', 3], ['N1', 7], ['N2', 59], ['REM', 30],
  ['N2', 52], ['REM', 32], ['N2', 10], ['W', 6],
];
export const NIGHT_START = 23;          // lights out, as a clock hour
export const NIGHT_MINUTES = NIGHT.reduce((t, seg) => t + seg[1], 0);   // 480

/** The stage at `minute` after lights out. */
export function stageAt(minute, night = NIGHT) {
  let t = 0;
  for (const [stage, len] of night) {
    if (minute < t + len) return stage;
    t += len;
  }
  return night[night.length - 1][0];
}

/** Minutes of `stage` between two moments of the night. */
export function minutesOf(stage, from = 0, to = NIGHT_MINUTES, night = NIGHT) {
  let t = 0;
  let total = 0;
  for (const [st, len] of night) {
    if (st === stage) total += Math.max(0, Math.min(to, t + len) - Math.max(from, t));
    t += len;
  }
  return total;
}

// Recommended sleep in 24 hours.
// Adults: "7 or more hours per night on a regular basis" (American Academy of Sleep Medicine and Sleep
// Research Society consensus statement, 2015). Children and teenagers: AASM consensus statement, 2016
// (endorsed by the American Academy of Pediatrics): 6 to 12 years 9 to 12 h, 13 to 18 years 8 to 10 h.
// The US National Sleep Foundation (2015) gives 7 to 9 h for adults and 8 to 10 h for teenagers, so the
// lower ends used in graded questions (7 h and 8 h) are the same in both.
export const SLEEP_NEED = {
  child: { label: 'children of 6 to 12', min: 9, max: 12, ages: [6, 12] },
  teen: { label: 'teenagers of 13 to 18', min: 8, max: 10, ages: [13, 18] },
  adult: { label: 'adults', min: 7, max: null, ages: [18, 120] },
};

// Example people for the sleep-need questions: name, age, group, what keeps them up.
export const SLEEPERS = [
  { name: 'Kofi', age: 15, group: 'teen', scene: 'on school nights' },
  { name: 'Mei', age: 16, group: 'teen', scene: 'during exam weeks' },
  { name: 'Tomás', age: 17, group: 'teen', scene: 'on school nights' },
  { name: 'Aroha', age: 14, group: 'teen', scene: 'on school nights' },
  { name: 'Ingrid', age: 34, group: 'adult', scene: 'on working days' },
  { name: 'Darius', age: 45, group: 'adult', scene: 'on working days' },
  { name: 'Nia', age: 28, group: 'adult', scene: 'on the nights before early shifts' },
  { name: 'Mr Okafor', age: 71, group: 'adult', scene: 'on most nights' },
];

// Being awake for a long time and a matched dose of alcohol:
// Williamson & Feyer, Occupational and Environmental Medicine, 2000: after 17 to 19 hours without sleep,
// performance on some tests was equivalent to or worse than at a blood alcohol concentration of 0.05%.
// Dawson & Reid, Nature, 1997: after 24 hours awake, about 0.10%.
export const AWAKE_ALCOHOL = { hours: [17, 19], bac: 0.05, hours24bac: 0.1 };

// The length of one sleep cycle used for rough arithmetic (the textbook "about 90 minutes").
export const CYCLE_MINUTES = 90;

/* ------------------------------------------------------------------ lesson 2: body-clock */

// The human body clock, measured in conditions that remove time cues: an average period of 24.18 hours
// (Czeisler and others, Science, 1999), here rounded to 24.2. The master clock, the suprachiasmatic
// nucleus (SCN) of the hypothalamus, holds roughly 20,000 nerve cells (textbook figure).
export const CLOCK = { period: 24.2, driftPerDay: 0.2, scnNeurons: 20000, lowPoint: 4.5 };

// Rules of thumb for how fast the body clock can be shifted after a flight: about 1 hour a day after
// flying east (the clock must move earlier) and about 1.5 hours a day after flying west (later).
// The figures go back to measurements on travellers (Aschoff and others, 1975: about 57 minutes a day
// eastward, 92 minutes a day westward) and are widely quoted in travel medicine; individuals vary.
export const JET = { eastPerDay: 1, westPerDay: 1.5 };

// Flights for the jet-lag questions. `ahead` is how many hours the destination's clocks are ahead of
// (+) or behind (−) the city of departure, in standard time; daylight saving can change some of these
// by an hour for part of the year, so every question states the difference itself.
export const FLIGHTS = [
  { who: 'Yuki', from: 'London', to: 'Tokyo', ahead: 9 },
  { who: 'Camille', from: 'New York', to: 'Paris', ahead: 6 },
  { who: 'Wanjiru', from: 'Nairobi', to: 'Singapore', ahead: 5 },
  { who: 'Diego', from: 'Los Angeles', to: 'New York', ahead: 3 },
  { who: 'Hemi', from: 'Sydney', to: 'Auckland', ahead: 2 },
  { who: 'Haruto', from: 'Tokyo', to: 'London', ahead: -9 },
  { who: 'Léa', from: 'Paris', to: 'New York', ahead: -6 },
  { who: 'Maya', from: 'New York', to: 'Los Angeles', ahead: -3 },
];

// Seattle moved the start of its high-school day from 07:50 to 08:45 in 2016. Students wearing wrist
// monitors slept a median of 34 minutes longer, 6 h 50 min → 7 h 24 min (Dunster and others, Science
// Advances, 2018). The American Academy of Pediatrics (2014) recommends that middle and high schools
// start at 08:30 or later.
export const SEATTLE = { before: '07:50', after: '08:45', later: 55, gained: 34, sleepBefore: [6, 50], sleepAfter: [7, 24], aapEarliest: '08:30' };

/** The three daily curves of the lesson as expressions for the plot widget; `c` shifts the whole body clock later. */
export const DAY_CURVES = {
  temperature: '0.5 - 0.38*cos(2*pi*(x - c - 4.5)/24)',
  melatonin: '0.9*(exp(-((x - c - 3)/3.2)^2) + exp(-((x - c - 27)/3.2)^2) + exp(-((x - c + 21)/3.2)^2))',
  cortisol: '0.08 + 0.85*(exp(-((x - c - 8)/3.6)^2) + exp(-((x - c - 32)/3.6)^2) + exp(-((x - c + 16)/3.6)^2))',
};

/* ------------------------------------------------------------------ lesson 3: better-sleep */

// The two-process model of sleep regulation (Borbély, 1982): sleep pressure ("Process S") and the
// circadian clock ("Process C"). The constants are the usual textbook ones and live in the widget
// src/widgets/sleep-pressure.js. Pressure on the model's 0-to-100 scale for a person who sleeps
// 23:00 to 07:00: about 9 on waking and about 62 at bedtime.
export const PRESSURE = { usualBed: 62, usualWake: 9, napLine: 58 };

// Caffeine: the half-life in healthy adults averages about 5 hours and ranges from roughly 1.5 to
// 9.5 hours (US National Academies / StatPearls "Caffeine", 2023); it is longer in pregnancy and with
// oral contraceptives, shorter in smokers. Up to about 400 mg a day is considered safe for most adults
// (EFSA, 2015; US FDA), 200 mg a day in pregnancy (EFSA; many national bodies).
// 400 mg taken 6 hours before bedtime still cut sleep by more than an hour (Drake and others, Journal of
// Clinical Sleep Medicine, 2013).
export const CAFFEINE = { halfLife: 5, range: [1.5, 9.5], adultDailyMax: 400, pregnancyDailyMax: 200 };

// Typical caffeine contents, rounded so that the halving arithmetic stays clean (EFSA 2015 gives about
// 80 mg for an espresso or a 250 ml energy drink, 90 mg for a 200 ml cup of filter coffee, 50 mg for a
// 220 ml cup of black tea, 40 mg for a 355 ml can of cola). Real drinks vary a great deal.
export const DRINKS = [
  { drink: 'a large filter coffee', mg: 160 },
  { drink: 'an espresso', mg: 80 },
  { drink: 'a small can of energy drink', mg: 80 },
  { drink: 'a can of cola', mg: 40 },
  { drink: 'a mug of black tea', mg: 40 },
  { drink: 'a caffeine tablet', mg: 200 },
];

// Example people whose bodies clear caffeine at different speeds (all inside the measured range).
export const CLEARERS = [
  { name: 'Ravi', halfLife: 5, why: 'a typical figure for an adult' },
  { name: 'Eleni', halfLife: 8, why: 'slow, as it often is for people taking the contraceptive pill' },
  { name: 'Chen', halfLife: 4, why: 'a little faster than average' },
  { name: 'Oluwaseun', halfLife: 6, why: 'a little slower than average' },
  { name: 'Marta', halfLife: 3, why: 'fast, largely because of her genes' },
];

// "Why can this person not sleep (or stay awake)?": each scene has one best explanation.
//   pressure — too little sleep pressure has built up;  clock — the body clock is sending its alerting signal;
//   caffeine — caffeine is blocking the signal of sleep pressure.
export const SLEEP_SCENES = [
  { text: 'Dmitri napped from 18:00 to 20:00. At 23:30 he lies wide awake.', cause: 'pressure', because: 'The long, late nap drained most of the pressure he had built up, and three and a half hours awake have not rebuilt it.' },
  { text: 'Hana slept until noon on Sunday. At 23:00, her usual bedtime, she is not sleepy at all.', cause: 'pressure', because: 'She has been awake for only eleven hours, so far less pressure has built up than on a normal day.' },
  { text: 'Kwame stayed up all night. At 10:00 he feels more awake than he did at 05:00.', cause: 'clock', because: 'His sleep pressure is higher than ever, but by mid-morning his body clock is sending its daytime alerting signal, which masks part of it.' },
  { text: 'Leilani has just flown west across eight time zones. At 03:00 local time she is wide awake.', cause: 'clock', because: 'Her body clock is still on home time, where it is 11:00 in the morning.' },
  { text: 'Tunde works nights. After 20 hours awake he goes to bed at 11:00 in the morning and cannot fall asleep.', cause: 'clock', because: 'His pressure is very high, but his body clock is in its daytime phase and is working against sleep.' },
  { text: 'Ines drank two strong coffees at 20:00. At midnight, after 17 hours awake, she does not feel tired.', cause: 'caffeine', because: 'After 17 hours her pressure is high, but caffeine is blocking the brain\'s receptors for adenosine, so she cannot feel it.' },
  { text: 'Bao had an energy drink at 21:30 to finish an essay. In bed at 00:30, after an 06:00 start, he lies awake.', cause: 'caffeine', because: 'Three hours after the drink, most of its caffeine is still in his body, hiding a day\'s worth of sleep pressure.' },
];
export const SLEEP_CAUSES = {
  pressure: 'Too little sleep pressure has built up',
  clock: 'The body clock is sending its alerting signal',
  caffeine: 'Caffeine is hiding the sleep pressure',
};

// Long-term (chronic) insomnia: trouble falling or staying asleep at least 3 nights a week for at least
// 3 months, with daytime effects (ICSD-3, DSM-5); roughly one adult in ten. Cognitive behavioural
// therapy for insomnia (CBT-I) is the recommended first treatment: American College of Physicians 2016,
// European guideline 2017 (updated 2023), American Academy of Sleep Medicine 2021 (strong recommendation
// for CBT-I). The AASM's April 2026 guideline is about COMBINING CBT-I with medicines: it suggests the
// combination over medicine alone, and suggests against the combination over CBT-I alone.
export const INSOMNIA = { nightsPerWeek: 3, months: 3 };

/* ------------------------------------------------------------------ lesson 4: stress */

// The acute stress response (standard physiology, e.g. Guyton & Hall; McEwen, New England Journal of
// Medicine, 1998): nerve signals make the adrenal glands release adrenaline within seconds; the slower
// hormone chain hypothalamus → pituitary → adrenal glands raises cortisol, which peaks about 20 to 30
// minutes after the stress begins and is back near its resting level about an hour or two later.
export const STRESS = { cortisolPeakMin: [20, 30], restingBreaths: [12, 20], slowBreaths: 6 };

// The two curves of the stress-hormone model (time in minutes; a cartoon with realistic time scales).
export const STRESS_CURVES = [
  { id: 'adrenaline', label: 'adrenaline', color: 'red', halfLife: 4, rise: 0.5 },
  { id: 'cortisol', label: 'cortisol', color: 'blue', halfLife: 25, rise: 12 },
];

// What the alarm reaction does around the body: notes for the body diagram (ids from docs/BODY.md).
export const ALARM_NOTES = {
  brain: 'The brain: a small region deep inside, the amygdala, spots the threat and raises the alarm. Attention narrows onto the danger.',
  eye: 'The eyes: the pupils widen and let in more light.',
  heart: 'The heart beats faster and harder. Blood pressure rises, and more blood reaches the muscles.',
  'right-lung': 'The lungs: breathing speeds up and the airways widen, to take in more oxygen.',
  'left-lung': 'The lungs: breathing speeds up and the airways widen, to take in more oxygen.',
  liver: 'The liver releases stored sugar (glucose) into the blood: quick fuel for muscles and brain.',
  stomach: 'The stomach: digestion is put on hold, and blood is sent to the muscles instead. This is the "butterflies" feeling.',
  'small-intestine': 'The gut: digestion is put on hold, and blood is sent to the muscles instead.',
};

// Stressors for the "sprint or marathon?" question. acute: over within minutes or hours. chronic: goes on for weeks, months or years.
export const STRESSORS = [
  { text: 'A car pulls out in front of your bike', kind: 'acute' },
  { text: 'A job interview tomorrow morning', kind: 'acute' },
  { text: 'Giving a short speech at a wedding', kind: 'acute' },
  { text: 'A penalty kick in a cup final', kind: 'acute' },
  { text: 'A driving test', kind: 'acute' },
  { text: 'A dog barks suddenly behind you', kind: 'acute' },
  { text: 'Two years of caring alone for a sick parent', kind: 'chronic' },
  { text: 'Months of not knowing how to pay the rent', kind: 'chronic' },
  { text: 'Being picked on at work, week after week', kind: 'chronic' },
  { text: 'Years of facing discrimination', kind: 'chronic' },
  { text: 'A job with constant overtime and no say over the workload', kind: 'chronic' },
  { text: 'Living for years in a noisy, overcrowded flat', kind: 'chronic' },
];

// Breathing patterns for the pace question: [seconds in, seconds out]. All give a whole number of breaths a minute.
export const BREATH_PATTERNS = [[4, 6], [2, 3], [3, 3], [4, 8], [5, 5], [2, 2], [5, 7], [2, 4], [6, 6], [3, 7], [1, 2], [2, 1]];

// The Whitehall studies of British civil servants (Marmot and others): in Whitehall I (begun 1967,
// about 17,500 men) the lowest grades had about three times the death rate of the highest over ten
// years; Whitehall II (begun 1985) tied much of the gap in heart disease to low control over one's work.
export const WHITEHALL = { started: 1967, men: 17500, ratio: 3 };

/* ------------------------------------------------------------------ lesson 5: emotions-mind */

// The cognitive model behind cognitive behavioural therapy (Aaron Beck, 1960s and 70s): it is not the
// situation itself but what a person takes it to mean that most directly shapes the feeling and the
// action, and the action feeds back into the next situation.

// Common "thinking traps", each with example thoughts of example people (never the learner's own).
export const TRAPS = {
  catastrophe: { name: 'Catastrophising', gist: 'leaping to the worst possible outcome' },
  mindreading: { name: 'Mind-reading', gist: 'assuming you know what others think' },
  allornothing: { name: 'All-or-nothing thinking', gist: 'only perfect or failed, nothing in between' },
};
export const TRAP_THOUGHTS = [
  { trap: 'catastrophe', scene: 'Kemal\'s manager asks for a quick word tomorrow.', thought: 'I am going to be fired, and then I will lose the flat.', why: 'From "a quick word" he has jumped straight to the worst ending he can imagine.' },
  { trap: 'catastrophe', scene: 'Mina\'s train is ten minutes late.', thought: 'I will miss the connection, then the interview, and I will never find a job.', why: 'A ten-minute delay has grown, link by link, into the worst possible future.' },
  { trap: 'catastrophe', scene: 'Otto stumbles over one sentence in his presentation.', thought: 'That is it. My career is over.', why: 'One stumble has become the worst outcome imaginable.' },
  { trap: 'mindreading', scene: 'Priya\'s friend takes an hour to answer a message.', thought: 'She finds me boring.', why: 'Priya cannot see into her friend\'s head. There are a dozen reasons for a slow reply.' },
  { trap: 'mindreading', scene: 'Two colleagues laugh as Ben walks past.', thought: 'They are laughing at me.', why: 'Ben is guessing what is in other people\'s minds, and treating the guess as a fact.' },
  { trap: 'mindreading', scene: 'The teacher frowns while reading Sofia\'s essay.', thought: 'He thinks I am stupid.', why: 'A frown could mean many things. Sofia has decided she knows what he thinks.' },
  { trap: 'allornothing', scene: 'Hye-jin gets 85% in the exam.', thought: 'Anything less than full marks is a failure.', why: 'She allows only two results, perfect and failed, and 85% is neither.' },
  { trap: 'allornothing', scene: 'Luis misses one session of his training plan.', thought: 'The plan is ruined. There is no point in going on.', why: 'One missed session of many does not ruin a plan. He sees only "kept perfectly" or "ruined".' },
  { trap: 'allornothing', scene: 'Tomasz plays one wrong note in the concert.', thought: 'Either I play perfectly or I am no musician at all.', why: 'Between perfect and worthless lies nearly every real performance.' },
];

// Going round in circles (rumination) versus looking for a next step (problem-solving). Rumination as a
// habit that deepens and prolongs low mood: Nolen-Hoeksema and others, reviewed 2008.
export const INNER_TALK = [
  { text: 'Why does this always happen to me?', kind: 'rumination' },
  { text: 'What is wrong with me?', kind: 'rumination' },
  { text: 'If only I had not said that. If only…', kind: 'rumination' },
  { text: 'Why can I never get anything right?', kind: 'rumination' },
  { text: 'I should have known. I should have known.', kind: 'rumination' },
  { text: 'What is one thing I can do about this before Friday?', kind: 'solving' },
  { text: 'Who could I ask for advice?', kind: 'solving' },
  { text: 'What would I try differently next time?', kind: 'solving' },
  { text: 'I cannot change that part. Which part can I change?', kind: 'solving' },
  { text: 'What is the smallest first step?', kind: 'solving' },
];

// The model of the fear-curve widget: staying until the fear settles lowers the next peak by a quarter;
// leaving at once raises it by a tenth. A cartoon of the principle behind exposure therapy, the
// best-supported treatment for phobias and several anxiety disorders (e.g. NICE guidance; Craske 2014).
export const FEAR = { start: 80, encounters: 5, stay: 0.75, leave: 1.1, goal: 30 };

// Mindfulness: Goyal and others, JAMA Internal Medicine, 2014 (47 trials): moderate evidence of small to
// moderate improvements in anxiety, depression and pain; no evidence that it beats other active treatments.
// MYRIAD trial (Kuyken and others, 2022; 85 UK schools, about 8,400 pupils aged 11 to 14): school
// mindfulness lessons gave no benefit over usual teaching.
export const MINDFULNESS = { goyalTrials: 47, myriadSchools: 85, myriadYear: 2022 };

/* ------------------------------------------------------------------ lesson 6: mental-health */

// How common: in 2021 nearly 1 person in 7 worldwide (about 1.1 billion) was living with a mental
// disorder; anxiety disorders (359 million, 2021) and depressive disorders (332 million, 2021; the
// 2019 figure was 280 million) are the most common (World Health Organization: "Mental disorders" and
// "Depression" fact sheets and "World mental health today", September 2025). Earlier WHO figures (2019)
// said 1 in 8.
// Treatment gap: more than 75% of people with a mental disorder in low- and middle-income countries
// receive no treatment (a long-standing WHO statement: mhGAP, 2008, and the fact sheets up to 2023;
// the 2025 reports give different measures that point the same way); the world has a median of 13
// mental health workers per 100,000 people (WHO Mental Health Atlas 2024).
export const WORLD = { oneIn: 7, totalBillion: 1.1, year: 2021, anxietyMillion: 359, depressionMillion: 332, untreatedLmicPct: 75, workersPer100k: 13 };

// Depression (a depressive episode, ICD-11 and DSM-5): low mood or loss of interest for most of the day,
// nearly every day, for at least two weeks, with other symptoms, and getting in the way of daily life.
export const DEPRESSION = { weeks: 2 };

// Where to turn in a crisis (each checked on the service's own or an official page, November 2026):
// 988 on 988lifeline.org and samhsa.gov (United States: call, text or chat) and on 988.ca and canada.ca
// (Canada: call or text); Samaritans 116 123 on samaritans.org (free, day and night) and, for the Republic
// of Ireland, on samaritans.org/samaritans-ireland and the HSE's pages (www2.hse.ie); Lifeline 13 11 14 on
// lifeline.org.au and healthdirect.gov.au (24 hours). Services and numbers differ by country:
// findahelpline.com (a directory recommended by the International Association for Suicide Prevention) lists them.
export const CRISIS_LINES = [
  { where: 'the United States and Canada', number: '988', name: '988 (call or text)' },
  { where: 'the United Kingdom and Ireland', number: '116 123', name: 'Samaritans' },
  { where: 'Australia', number: '13 11 14', name: 'Lifeline' },
];
export const HELPLINE_DIRECTORY = 'findahelpline.com';
/** The crisis pointers as one short paragraph of lesson text. */
export const crisisPointers = () => `**${CRISIS_LINES[0].number}** (call or text) in ${CRISIS_LINES[0].where}, ${CRISIS_LINES[1].name} on **${CRISIS_LINES[1].number}** in ${CRISIS_LINES[1].where}, ${CRISIS_LINES[2].name} on **${CRISIS_LINES[2].number}** in ${CRISIS_LINES[2].where}. [${HELPLINE_DIRECTORY}](https://${HELPLINE_DIRECTORY}) lists free services for most other countries`;

// One-line descriptions of some other conditions (after the WHO fact sheets and ICD-11). Every one of
// them is far more varied than a line can say, and every one can be treated or managed.
export const CONDITIONS = [
  { name: 'Bipolar disorder', gist: 'Episodes of depression, and episodes of unusually high mood and energy' },
  { name: 'Schizophrenia', gist: 'Episodes of psychosis: hearing or believing things that others do not' },
  { name: 'Post-traumatic stress disorder', gist: 'After a terrifying event: flashbacks, nightmares, always on guard' },
  { name: 'ADHD', gist: 'Since childhood: trouble with attention, restlessness, acting on impulse' },
  { name: 'An eating disorder', gist: 'Eating and thoughts about food and body take over, and harm health' },
  { name: 'Obsessive-compulsive disorder', gist: 'Unwanted, distressing thoughts, and rituals repeated to quiet them' },
];

// Example people for "an ordinary reaction, or worth a doctor's visit?": what matters is how long it has
// lasted, how strong it is and how much it gets in the way of daily life.
export const HARD_TIMES = [
  { text: 'Sad and tearful for a few days after a break-up, but still seeing friends', ask: false },
  { text: 'Nervous for a week before an exam, fine once it is over', ask: false },
  { text: 'Waves of grief in the weeks after her grandfather died, while still getting through the days', ask: false, why: 'Grief is not an illness. It hurts, it comes in waves, and for most people it slowly eases. Company helps.' },
  { text: 'Low and without interest in anything for a month, and has stopped going to work', ask: true },
  { text: 'Worried about nearly everything on most days for six months, and sleeping badly', ask: true },
  { text: 'So afraid of being judged that he has avoided all his lectures this term', ask: true },
];

// Words: person-first, non-judgemental language (WHO; mental-health charities' media guidelines).
export const WORDS = [
  { text: 'a person with schizophrenia', ok: true },
  { text: 'she is living with depression', ok: true },
  { text: 'he died by suicide', ok: true },
  { text: 'people with mental health conditions', ok: true },
  { text: 'a schizophrenic', ok: false, why: 'It turns a person into a diagnosis. Say "a person with schizophrenia".' },
  { text: 'he committed suicide', ok: false, why: '"Committed" is the word used for crimes. Say "died by suicide".' },
  { text: '"I am so OCD about my desk"', ok: false, why: 'Using a diagnosis as a joke about tidiness makes a serious condition sound trivial.' },
  { text: 'the mentally ill', ok: false, why: 'It lumps very different people into one label. Say "people with mental health conditions".' },
];

/* ------------------------------------------------------------------ lesson 7: connection */

// Loneliness: about 1 person in 6 worldwide is affected, and it is linked to an estimated 871,000 deaths
// a year (WHO Commission on Social Connection, "From loneliness to social connection", June 2025).
// Social ties and survival: across 148 studies (about 309,000 people, followed for 7.5 years on average)
// people with stronger social relationships were 50% more likely to be alive at the end (Holt-Lunstad,
// Smith and Layton, PLoS Medicine, 2010). A second pooled analysis found a higher likelihood of death of
// 26% with loneliness, 29% with social isolation and 32% with living alone (Holt-Lunstad and others,
// Perspectives on Psychological Science, 2015).
export const LONELY = { oneIn: 6, deathsPerYear: 871000 };
export const TIES = { studies: 148, people: 309000, years: 7.5, survivalPct: 50 };
export const TIE_RISKS = [
  { what: 'feel lonely', group: 'who feel lonely', other: 'who do not feel lonely', pct: 26 },
  { what: 'are socially isolated', group: 'who have very little contact with other people', other: 'with plenty of contact', pct: 29 },
  { what: 'live alone', group: 'who live alone', other: 'who live with others', pct: 32 },
];

// The Harvard Study of Adult Development: begun in 1938 with 268 Harvard students, joined by 456 boys
// from Boston's poorest districts (724 in all), and still running. How satisfied the men were with their
// relationships at 50 predicted their health at 80 better than their cholesterol did (Waldinger and others).
export const HARVARD = { started: 1938, students: 268, boys: 456, total: 724 };

// Things a supporter might say: which open the door and which shut it.
export const SUPPORT_LINES = [
  { text: '"That sounds really hard."', opens: true },
  { text: '"Do you want advice, or just someone to listen?"', opens: true },
  { text: '"I am here. Take your time."', opens: true },
  { text: '"What has been the hardest part?"', opens: true },
  { text: '"Thank you for telling me."', opens: true },
  { text: '"Shall I check in with you on Thursday?"', opens: true },
  { text: '"At least you still have your health."', opens: false, why: '"At least" tells a person that their trouble is smaller than they feel it to be.' },
  { text: '"Other people have it much worse."', opens: false, why: 'Somebody else\'s pain does not shrink this person\'s. It only adds guilt.' },
  { text: '"You just need to think positive."', opens: false, why: 'It makes the trouble sound like a fault of attitude.' },
  { text: '"I know exactly how you feel. When I…"', opens: false, why: 'The conversation has just become about the listener.' },
  { text: '"Have you tried yoga?"', opens: false, why: 'A fix offered before listening says: this is simple, and you should have solved it.' },
  { text: '"Cheer up, it might never happen."', opens: false, why: 'It brushes the feeling aside instead of hearing it.' },
];

// The course's toolkit: a situation, and the tool from one of the seven lessons that fits it best.
export const TOOLKIT = [
  { situation: 'Wide awake at midnight after a coffee at 17:00', tool: 'Move the last caffeine of the day earlier', lesson: 3 },
  { situation: 'Out of step for days after a long flight east', tool: 'Seek daylight at the right time for the body clock', lesson: 2 },
  { situation: 'Heart pounding just before giving a talk', tool: 'Slow breaths with long out-breaths', lesson: 4 },
  { situation: 'Sure that a friend is angry, after one unanswered message', tool: 'Ask: is that a fact, or a guess?', lesson: 5 },
  { situation: 'More afraid of the lift every month, and always taking the stairs', tool: 'Approach the fear in small steps', lesson: 5 },
  { situation: 'A friend says he has felt flat for two months', tool: 'Ask, listen, and suggest a doctor', lesson: 6 },
  { situation: 'Cannot fall asleep on Sunday night after sleeping until noon', tool: 'Keep a steady getting-up time', lesson: 3 },
];

// Other things said to be good for wellbeing, and what the evidence is.
// Nature: in a survey of about 20,000 people in England, those who spent at least 120 minutes a week in
// nature were more likely to report good health and wellbeing (White and others, Scientific Reports, 2019): a link, not proof of cause.
// Social media: in very large surveys of teenagers, screen and social-media use accounted for well under
// 1% of the differences in wellbeing (Orben and Przybylski, Nature Human Behaviour, 2019); experiments and
// later studies give mixed results, and researchers disagree about how much harm there is.
// Gratitude exercises and acts of kindness: pooled trials find small boosts to wellbeing (e.g. Curry and others, 2018).
export const NATURE = { minutes: 120, people: 20000 };
