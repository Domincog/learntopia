// Staying Well: Prevention and Everyday Medicine · the facts of the course in one place.
//
// Every threshold, typical value and guideline number used by the lessons lives in a table here, with
// the body and year it comes from, so that a correction is made once. Figures, generated questions and
// feedback are built from these tables; tests/staying-well-course.test.mjs keeps an independent copy of
// the key numbers and checks that the two agree.
//
// General health education, not personal medical advice: every calculation is for a named example
// person or a sample label, never for the learner.
import { num } from '../../kit.js';

/** 1234567 -> "1,234,567" */
export const thousands = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** A share as a whole percentage: 0.75 -> "75%" (one decimal when it is not whole: 0.875 -> "87.5%"). */
export const pctText = (share) => `${num(Math.round(share * 1000) / 10, 1)}%`;
/** "a" or "an" in front of a word or a number written in digits. */
export const aAn = (word) => (/^(8|11|18|80|[aeiou])/i.test(String(word)) ? 'an' : 'a');
/** 13.5 -> "13:30", 8 -> "08:00" (24-hour clock). */
export const clock = (hours) => {
  const h = Math.floor(hours + 1e-9);
  const m = Math.round((hours - h) * 60);
  return `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
/** 90 -> "1 hour 30 minutes", 45 -> "45 minutes", 3.75 -> "3.75 minutes", 960 -> "16 hours". */
export const duration = (minutes) => {
  if (minutes < 60) return `${num(minutes, 2)} minute${minutes === 1 ? '' : 's'}`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes - h * 60);
  return `${h} hour${h === 1 ? '' : 's'}${m ? ` ${m} minutes` : ''}`;
};

// Example people for worked calculations. Never the learner.
export const PEOPLE = ['Amara', 'Kenji', 'Sofia', 'Ravi', 'Leila', 'Tomás', 'Ngozi', 'Mei', 'Jonas', 'Aisha', 'Diego', 'Hanna'];

/* ------------------------------------------------------------------ germs */

// The four kinds of microbe that cause infections. Sizes are typical orders of magnitude from
// microbiology textbooks (e.g. Madigan, Brock Biology of Microorganisms); 1 µm = one thousandth of a mm.
export const MICROBES = {
  bacteria: { name: 'bacterium', plural: 'Bacteria', size: 'about 1 to 5 µm', what: 'single cells that feed and divide on their own', treat: 'antibiotics' },
  virus: { name: 'virus', plural: 'Viruses', size: 'about 0.02 to 0.3 µm', what: 'genetic material in a protein coat, copied only inside a living cell', treat: 'vaccines to prevent them; antivirals for some' },
  fungus: { name: 'fungus', plural: 'Fungi', size: 'yeasts about 3 to 10 µm; moulds grow as threads', what: 'yeasts and moulds: cells with a nucleus', treat: 'antifungal medicines' },
  parasite: { name: 'parasite', plural: 'Parasites', size: 'from single cells of 10 µm to worms metres long', what: 'single-celled organisms or worms that live off a host', treat: 'antiparasitic medicines' },
};

// Illness → the kind of microbe behind it, with the main route of spread (WHO and CDC disease fact sheets).
export const ILLNESSES = [
  { name: 'Cholera', kind: 'bacteria', agent: '*Vibrio cholerae*', route: 'water', clue: 'severe watery diarrhoea, caught from contaminated water' },
  { name: 'Tuberculosis', kind: 'bacteria', agent: '*Mycobacterium tuberculosis*', route: 'air', clue: 'a long-lasting lung infection, cured by months of antibiotics' },
  { name: 'Strep throat', kind: 'bacteria', agent: 'group A *Streptococcus*', route: 'air', clue: 'a sore throat that a swab test can confirm and antibiotics treat' },
  { name: 'Tetanus', kind: 'bacteria', agent: '*Clostridium tetani*', route: 'wound', clue: 'caught through a dirty wound, from spores in soil' },
  { name: 'The common cold', kind: 'virus', agent: 'rhinoviruses and many others', route: 'air', clue: 'a runny nose and sneezing, with more than 200 possible culprits' },
  { name: 'Influenza (flu)', kind: 'virus', agent: 'influenza viruses', route: 'air', clue: 'fever and aches that sweep round the world every winter' },
  { name: 'Measles', kind: 'virus', agent: 'the measles virus', route: 'air', clue: 'a rash and fever, among the most contagious infections known' },
  { name: 'COVID-19', kind: 'virus', agent: 'the coronavirus SARS-CoV-2', route: 'air', clue: 'the cause of the pandemic that began in 2019' },
  { name: 'Norovirus infection', kind: 'virus', agent: 'noroviruses', route: 'hands', clue: 'sudden vomiting and diarrhoea, the "winter vomiting bug"' },
  { name: "Athlete's foot", kind: 'fungus', agent: 'skin fungi (dermatophytes)', route: 'contact', clue: 'itchy, flaking skin between the toes' },
  { name: 'Thrush', kind: 'fungus', agent: 'the yeast *Candida*', route: 'own', clue: 'an overgrowth of a yeast that normally lives on us harmlessly' },
  { name: 'Malaria', kind: 'parasite', agent: '*Plasmodium*, a single-celled parasite', route: 'insect', clue: 'fevers in cycles, carried from person to person by mosquitoes' },
];

// John Snow and the Broad Street pump, Soho, London, 1854 (Snow, On the Mode of Communication of Cholera,
// 2nd ed., 1855; UCLA John Snow site).
export const SNOW = { year: 1854, deaths: 616, handleRemoved: '8 September 1854', breweryWorkers: 70, breweryDeaths: 0, workhouseInmates: 535, workhouseDeaths: 5 };

// Semmelweis, Vienna General Hospital: deaths among women giving birth in the First Clinic (doctors and
// students), per 100 births, before and after handwashing in chlorinated lime began in May 1847.
// Semmelweis's own yearly tables (1861), as given in the Medical Journal of Australia, 2018: 11.4% in 1846, 1.3% in 1848.
export const SEMMELWEIS = { year: 1847, before: 11.4, after: 1.3, midwivesClinic: 'under 4' };

// Handwashing: scrub for at least 20 seconds (CDC, "When and How to Wash Your Hands", 2024; NHS). WHO's
// poster gives 40 to 60 seconds for the whole routine from wetting to drying.
export const HANDWASH_SECONDS = 20;

// Food safety (WHO, Five Keys to Safer Food): keep food below 5 °C or above 60 °C; do not leave cooked
// food at room temperature for more than 2 hours; cook to at least 70 °C. National figures differ a
// little (United States 4 to 60 °C, i.e. 40 to 140 °F; United Kingdom 8 to 63 °C).
export const FOOD = { coldC: 5, hotC: 60, cookC: 70, roomHours: 2, doublingMinutes: 20 };

// Basic reproduction numbers, as usually quoted (ranges vary between studies and settings).
// Measles: Guerra et al., Lancet Infect Dis 2017 (12 to 18 is the classic range). Seasonal flu: Biggerstaff
// et al., BMC Infect Dis 2014 (median 1.28). Others: Fine, Epidemiol Rev 1993; Anderson & May 1991.
export const R0 = {
  measles: { name: 'measles', low: 12, high: 18 },
  chickenpox: { name: 'chickenpox', low: 10, high: 12 },
  polio: { name: 'polio', low: 5, high: 7 },
  smallpox: { name: 'smallpox', low: 5, high: 7 },
  flu: { name: 'seasonal flu', low: 1.2, high: 1.4 },
};

/** Herd-immunity threshold for a basic reproduction number: 1 − 1/R0, as a share of the population. */
export const herdThreshold = (r0) => 1 - 1 / r0;

// Incubation periods: time from infection to first symptoms (CDC and NHS disease pages; typical ranges).
export const INCUBATION = {
  norovirus: 'half a day to 2 days',
  flu: '1 to 4 days',
  measles: '7 to 14 days',
  chickenpox: '10 to 21 days',
};

/* --------------------------------------------------------------- vaccines */

// Milestones (WHO, "Smallpox"; Global Polio Eradication Initiative; Riedel, Proc (Bayl Univ Med Cent) 2005).
export const VACCINE_HISTORY = {
  jenner: 1796,                 // Edward Jenner inoculates James Phipps with cowpox
  smallpoxLastCase: 1977,       // last natural case, Somalia
  smallpoxEradicated: 1980,     // declared by the World Health Assembly
  salk: 1955,                   // first polio vaccine licensed
  polioCampaign: 1988,          // Global Polio Eradication Initiative: about 350,000 cases a year in 125 countries
  polioCases1988: 350000,
  polioType2Gone: 2015,         // wild poliovirus types 2 and 3 certified eradicated in 2015 and 2019
  polioType3Gone: 2019,
  polioEndemic: ['Afghanistan', 'Pakistan'],   // wild type 1 only; under 100 cases a year (99 in 2024, 39 in 2025: WHO)
  livesSaved: 154,              // million, in 50 years of childhood vaccination (Shattock et al., Lancet 2024, with WHO)
};

// Measles and the MMR vaccine (CDC, "Measles: symptoms and complications" and "MMR vaccine safety", 2024-25).
export const MEASLES = {
  oneDose: 93, twoDoses: 97,          // % effectiveness against measles
  target: 95,                         // % coverage with two doses that WHO asks for
  pneumoniaOneIn: 20,                 // children with measles
  encephalitisOneIn: 1000,            // swelling of the brain
  deathsPerThousand: [1, 3],
  febrileSeizureOneIn: 3000,          // after a dose of MMR: about 1 in 3,000 to 4,000
  severeAllergyOneIn: 1000000,        // any vaccine: about 1.3 per million doses (McNeil et al., J Allergy Clin Immunol 2016)
};

// The 1998 claim of a link between MMR and autism, and what followed (The Lancet retraction, 2 February 2010;
// UK General Medical Council, May 2010; Hviid et al., Annals of Internal Medicine 2019).
export const AUTISM_CLAIM = { year: 1998, children: 12, retracted: 2010, danishChildren: 657461, danishYear: 2019 };

// Kinds of vaccine with familiar examples (WHO, "Vaccines and immunization: what is vaccination?"; CDC).
export const VACCINE_TYPES = [
  { kind: 'A weakened live germ', gives: 'A germ bred to be too feeble to cause the disease in healthy people', examples: 'measles, mumps and rubella (MMR), chickenpox' },
  { kind: 'An inactivated ("killed") germ', gives: 'A whole germ that can no longer multiply at all', examples: 'injected polio vaccine, hepatitis A' },
  { kind: 'A piece of the germ', gives: 'One purified protein, or a toxin made harmless', examples: 'tetanus, hepatitis B, HPV' },
  { kind: 'mRNA', gives: 'Instructions that let your own cells make one of the germ\'s proteins for a few days', examples: 'some COVID-19 vaccines' },
];

/* -------------------------------------------------------------- medicines */

// Penicillin: Alexander Fleming noticed the mould's effect in 1928; Howard Florey, Ernst Chain and colleagues
// turned it into a medicine in 1940-41; the three shared the Nobel Prize in 1945 (nobelprize.org).
export const PENICILLIN = { fleming: 1928, medicine: 1941, nobel: 1945 };

// Antimicrobial resistance: deaths caused directly by resistant bacterial infections in 2021, and the
// forecast for 2025-2050 (GBD 2021 Antimicrobial Resistance Collaborators, The Lancet, 2024).
export const AMR = { deaths2021: 1.14, forecast2050: 39 };   // millions

// SAMPLE labels for practice. They follow the pattern of real over-the-counter packs (UK and US
// wording both occur, which is why two paracetamol packs can state different maximums), but they are
// teaching material: the label on a real pack, and a pharmacist, are the authority.
//   strength: mg of the active ingredient in one unit · perDose: units in one dose (most allowed at once)
//   everyHours: the shortest gap the label allows between doses · maxUnits: most units in 24 hours
export const LABELS = {
  paracetamol: {
    name: 'Pain Relief Tablets', sub: '16 tablets', color: 'blue', drug: 'paracetamol', unit: 'tablet', strength: 500, perDose: 2, everyHours: 4, maxUnits: 8,
    active: 'Paracetamol 500 mg', use: 'Mild to moderate pain and fever',
    dose: 'Adults and children aged 12 and over: 1 or 2 tablets every 4 to 6 hours, if needed',
    max: 'Do not take more than 8 tablets in 24 hours',
    warn: 'Contains paracetamol. Do not take with any other medicine that contains paracetamol. Taking too much can seriously harm the liver: get medical help at once, even if you feel well.',
  },
  acetaminophen: {
    name: 'Extra Strength Pain Reliever', sub: '24 caplets', color: 'red', drug: 'acetaminophen (the North American name for paracetamol)', unit: 'caplet', strength: 500, perDose: 2, everyHours: 6, maxUnits: 6,
    active: 'Acetaminophen 500 mg', use: 'Minor aches and pains; fever',
    dose: 'Adults and children 12 years and over: 2 caplets every 6 hours while symptoms last',
    max: 'Do not take more than 6 caplets in 24 hours',
    warn: 'Liver warning: severe liver damage may occur if you take more than the maximum, or take it with other medicines that contain acetaminophen.',
  },
  ibuprofen: {
    name: 'Ibuprofen Tablets', sub: '24 tablets', color: 'orange', drug: 'ibuprofen', unit: 'tablet', strength: 200, perDose: 2, everyHours: 4, maxUnits: 6,
    active: 'Ibuprofen 200 mg', use: 'Pain, inflammation and fever',
    dose: 'Adults and children aged 12 and over: 1 or 2 tablets with water, with or after food. Leave at least 4 hours between doses',
    max: 'Do not take more than 6 tablets in 24 hours',
    warn: 'Do not take if you have ever had a stomach ulcer, or a reaction to aspirin or similar painkillers. Ask a pharmacist first if you have asthma, kidney or heart problems, or are pregnant.',
  },
  coldflu: {
    name: 'Cold & Flu Hot Drink', sub: '10 sachets', color: 'yellow', drug: 'paracetamol', unit: 'sachet', strength: 1000, perDose: 1, everyHours: 4, maxUnits: 4,
    active: 'Paracetamol 1000 mg, plus a decongestant', use: 'Relief of cold and flu symptoms',
    dose: 'Adults: 1 sachet dissolved in hot water every 4 to 6 hours, if needed',
    max: 'Do not take more than 4 sachets in 24 hours',
    warn: 'Contains paracetamol. Do not take with any other medicine that contains paracetamol.',
  },
  allergy: {
    name: 'Allergy Relief Tablets', sub: '14 tablets', color: 'green', drug: 'cetirizine', unit: 'tablet', strength: 10, perDose: 1, everyHours: 24, maxUnits: 1,
    active: 'Cetirizine 10 mg', use: 'Hay fever and other allergies',
    dose: 'Adults and children aged 12 and over: 1 tablet once a day',
    max: 'Do not take more than 1 tablet in 24 hours',
    warn: 'May cause drowsiness in some people. If affected, do not drive or use machines.',
  },
};

/** The spec rows of the `med-label` widget for one sample label (ids: active, use, dose, max, warn, prefixed if asked). */
export const labelRows = (label, prefix = '') => [
  { id: `${prefix}active`, head: `Active ingredient (in each ${label.unit})`, text: label.active },
  { id: `${prefix}use`, head: 'Use', text: label.use },
  { id: `${prefix}dose`, head: 'Dose', text: label.dose },
  { id: `${prefix}max`, head: 'Maximum', text: label.max },
  { id: `${prefix}warn`, head: 'Warnings', text: label.warn },
];
export const labelSpec = (label, extra = {}) => ({ type: 'med-label', labels: [{ name: label.name, sub: label.sub, color: label.color, rows: labelRows(label) }], ...extra });

// The adult maximum for paracetamol (acetaminophen) on most labels: 4,000 mg in 24 hours (NHS; US FDA).
// Some packs set a lower limit, such as 3,000 mg. The label in the hand is the one to follow.
export const PARACETAMOL_MAX_MG = 4000;

/* ---------------------------------------------------------- everyday care */

// Teeth. Enamel starts to lose minerals below about pH 5.5 (the "critical pH"; Stephan 1944, and every
// cariology textbook since). Fluoride toothpaste twice a day: WHO, NHS, American Dental Association.
export const TEETH = { criticalPh: 5.5, brushPerDay: 2 };

// The Global Solar UV Index (WHO, WMO, UNEP and ICNIRP, 2002): bands, and what WHO says each calls for.
export const UV_BANDS = [
  { from: 0, to: 2, name: 'low', color: 'green', need: 'none' },
  { from: 3, to: 5, name: 'moderate', color: 'yellow', need: 'protect' },
  { from: 6, to: 7, name: 'high', color: 'orange', need: 'protect' },
  { from: 8, to: 10, name: 'very high', color: 'red', need: 'extra' },
  { from: 11, to: 13, name: 'extreme', color: 'violet', need: 'extra' },
];
export const UV_NEED = {
  none: 'No protection needed',
  protect: 'Protection needed: shade around midday, clothing, a hat, sunscreen',
  extra: 'Extra protection: stay out of the midday sun; shade, clothing, hat and sunscreen are a must',
};
export const uvBand = (index) => UV_BANDS.find((b) => index >= b.from && index <= b.to) || UV_BANDS[UV_BANDS.length - 1];
export const UV_PROTECT_FROM = 3;

// Children and short-sightedness: 40 extra minutes outdoors each school day for three years; new cases of
// myopia 30.4% against 39.5% in the comparison schools (He et al., JAMA 2015, Guangzhou).
export const MYOPIA_TRIAL = { minutes: 40, years: 3, outdoors: 30, usual: 40 };

// Noise and hearing. US National Institute for Occupational Safety and Health (NIOSH, 1998): 85 dB(A) for
// 8 hours a day, and half the time for every 3 dB more. WHO and the ITU's safe-listening standard (H.870,
// 2018) is stricter for leisure listening: 80 dB for 40 hours a week.
export const NOISE = { refDb: 85, refHours: 8, exchangeDb: 3, whoDb: 80, whoHoursPerWeek: 40 };
/** Minutes a day at `db` under the 85 dB / 8 hours / 3 dB rule. */
export const safeMinutes = (db) => (NOISE.refHours * 60) / 2 ** ((db - NOISE.refDb) / NOISE.exchangeDb);

// Seat belts cut the risk of death for people in the front seats by 45 to 50% (WHO, Road traffic injuries fact
// sheet). Motorcycle helmets cut the risk of death by about 42% and of head injury by about 69%
// (Liu et al., Cochrane Database of Systematic Reviews, 2008).
export const ROAD = { beltLow: 45, beltHigh: 50, helmetDeath: 42, helmetHead: 69 };

/* ------------------------------------------------------ know your numbers */

// Noncommunicable diseases (heart disease and stroke, cancers, chronic lung disease, diabetes): at least
// 43 million deaths in 2021, 75% of deaths not related to the pandemic (WHO fact sheet, September 2025).
export const NCD = { deathsMillions: 43, sharePct: 75, year: 2021 };

// High blood pressure: 1.4 billion people in 2024, of whom just over one in five have it under control
// (WHO, Global report on hypertension, September 2025).
export const HYPERTENSION = { peopleBillions: 1.4, year: 2024 };

// What counts as high, by guideline (clinic readings in mmHg, systolic / diastolic). The bodies DIFFER,
// so no step grades a threshold.
//   United States: ACC/AHA 2017, kept in the 2025 AHA/ACC guideline.  Europe: ESC 2024.
//   NICE (UK, NG136), ESH 2023 and WHO 2021 also draw the line for hypertension at 140/90.
export const BP_GUIDELINES = {
  us: {
    name: 'United States (AHA/ACC, 2025)', highFrom: [130, 80],
    bands: [
      { name: 'normal', from: 90, to: 120, color: 'green' },
      { name: 'elevated', from: 120, to: 130, color: 'yellow' },
      { name: 'stage 1', from: 130, to: 140, color: 'orange' },
      { name: 'stage 2', from: 140, to: 180, color: 'red' },
    ],
  },
  europe: {
    name: 'Europe (ESC, 2024)', highFrom: [140, 90],
    bands: [
      { name: 'not elevated', from: 90, to: 120, color: 'green' },
      { name: 'elevated', from: 120, to: 140, color: 'yellow' },
      { name: 'high', from: 140, to: 180, color: 'red' },
    ],
  },
};

// Lab units. Cholesterol: 1 mmol/L = 38.67 mg/dL (rounded to 39 in the lessons). Glucose: 1 mmol/L = 18.02 mg/dL.
export const UNITS = { cholesterol: 39, glucose: 18 };

// Diabetes is diagnosed at an HbA1c of 6.5% (48 mmol/mol) or more, or a fasting glucose of 7.0 mmol/L
// (126 mg/dL) or more, normally confirmed by a second test (WHO 2011/2019; American Diabetes Association,
// Standards of Care 2025). The range called "prediabetes" is drawn differently by different bodies.
export const DIABETES = { hba1cPct: 6.5, hba1cMmolMol: 48, fastingMmol: 7.0, fastingMgDl: 126 };

// Body mass index: weight (kg) ÷ height (m)². WHO's population bands: under 18.5, 18.5 to 24.9, 25 to 29.9,
// 30 and over; lower action points (23 and 27.5) for many Asian populations (WHO expert consultation, Lancet 2004).
export const BMI_BANDS = [18.5, 25, 30];
export const bmi = (kg, metres) => kg / (metres * metres);

// Typical resting heart rate of an adult: 60 to 100 beats a minute, lower in very fit people (AHA; NHS).
export const RESTING_HR = [60, 100];

// A TEACHING model of ten-year risk of heart attack or stroke: rounded multipliers of about the size found
// in large studies, multiplied together as real calculators (SCORE2, PREVENT, QRISK3) roughly do.
//   smoking about ×2 (INTERHEART, Lancet 2004; Prospective studies) · diabetes about ×2 (Emerging Risk Factors
//   Collaboration, Lancet 2010) · systolic pressure 20 mmHg higher about ×2 (Lewington et al., Lancet 2002) ·
//   LDL cholesterol 2 mmol/L higher about ×1.5 (Cholesterol Treatment Trialists, Lancet 2010, read in reverse).
export const RISK_MODEL = {
  base: 4,                                // in 100 people of about 55 with none of the factors
  factors: [
    { id: 'smoking', label: 'Smokes', mult: 2 },
    { id: 'bp', label: 'High blood pressure', mult: 2 },
    { id: 'ldl', label: 'High LDL cholesterol', mult: 1.5 },
    { id: 'diabetes', label: 'Diabetes', mult: 2 },
  ],
};

/* -------------------------------------------------------------- screening */

// Cancer: tobacco causes about a quarter of all cancer deaths, and 30 to 50% of cancers could be prevented
// (WHO, Cancer fact sheet, 2025). HPV vaccination before age 17 was followed by about 88% fewer invasive
// cervical cancers (Lei et al., New England Journal of Medicine, 2020, Sweden).
export const CANCER = { tobaccoShare: 'about a quarter', hpvReduction: 88 };

// A teaching example with numbers of roughly the size seen in breast screening by mammography:
// 8 in 1,000 women screened have a cancer, the test finds 7 of the 8 (87.5%), and it recalls 10% of the
// women who have none. (Programmes differ: recall rates run from about 3% to more than 10%.)
export const SCREEN_EXAMPLE = { base: 0.008, sens: 0.875, fpr: 0.1 };

// Breast screening in the UK: for 10,000 women invited from age 50 for 20 years, about 43 deaths from breast
// cancer are prevented and about 129 women are diagnosed with a cancer that would never have harmed them
// (Independent UK Panel on Breast Cancer Screening, the "Marmot review", The Lancet 2012). The panel called
// its figures best estimates from imperfect data.
export const MARMOT = { invited: 10000, deathsPrevented: 43, overdiagnosed: 129 };

// Screening tests for practice: [people per 1,000 who have the disease, sensitivity %, specificity %].
// Every count out of 1,000 is a whole number.
export const SCREEN_RATES = [
  [10, 90, 90], [10, 80, 90], [20, 90, 95], [20, 95, 90], [40, 75, 95], [40, 90, 90],
  [50, 80, 90], [50, 90, 98], [50, 90, 80], [100, 80, 90], [100, 90, 95], [200, 90, 95],
];
export function screenCounts([perThousand, sens, spec]) {
  const ill = perThousand;
  const well = 1000 - ill;
  const truePos = Math.round((ill * sens) / 100);
  const falsePos = Math.round((well * (100 - spec)) / 100);
  return { ill, well, sens, spec, truePos, falsePos, positives: truePos + falsePos, missed: ill - truePos, ppv: truePos / (truePos + falsePos) };
}

// Programmes that exist in many countries, with examples of how the invitations differ (never graded).
// England: NHS screening programmes, 2025. United States: US Preventive Services Task Force (breast 2024,
// colorectal 2021, cervical 2018).
export const PROGRAMMES = [
  { cancer: 'Cervical', test: 'a test for the HPV virus, or a smear', england: 'ages 25 to 64, every 5 years', us: 'ages 21 to 65, every 3 to 5 years' },
  { cancer: 'Bowel', test: 'a home test for hidden blood in a stool sample, or a camera examination', england: 'ages 50 to 74, every 2 years', us: 'ages 45 to 75' },
  { cancer: 'Breast', test: 'an X-ray of the breast (mammogram)', england: 'ages 50 to 70, every 3 years', us: 'ages 40 to 74, every 2 years' },
];

/* ------------------------------------------------------------- substances */

// Tobacco kills more than 7 million people a year, and up to half of the users who do not quit
// (WHO, Tobacco fact sheet, June 2025). Large cohort studies put it nearer two in three
// (Banks et al., BMC Medicine 2015).
export const TOBACCO = { deathsMillions: 7, killsShare: 'up to half' };

// What improves after the last cigarette, and when (WHO, "Health benefits of smoking cessation";
// US Surgeon General's report on smoking cessation, 2020). Times are typical, not exact.
export const QUIT_TIMELINE = [
  { after: '20 minutes', what: 'Pulse and blood pressure begin to fall' },
  { after: 'a day or two', what: 'Carbon monoxide has cleared from the blood' },
  { after: 'a few months', what: 'Coughing eases and breathing gets easier' },
  { after: '1 year', what: 'The added risk of a heart attack has halved' },
  { after: '10 years', what: 'The risk of lung cancer is about half that of someone still smoking' },
];

// Quitting unaided: about 3 to 5 in 100 attempts last a year (Hughes et al., Addiction 2004). Behavioural
// support together with a stop-smoking medicine roughly doubles to triples that (Cochrane reviews:
// Stead et al. 2016; Lindson et al. 2023).
export const QUIT_UNAIDED = 4;

// Alcohol. Pure alcohol (ethanol) weighs 0.789 g per ml. A UK unit is 10 ml (8 g). "Standard drinks" differ:
// Australia 10 g, United States 14 g (NHS; NHMRC 2020; US NIAAA). The body clears roughly one UK unit an hour
// (NHS), with wide variation between people.
export const ALCOHOL = { gramsPerMl: 0.789, unitMl: 10, clearUnitsPerHour: 1, deathsMillions: 2.6, deathsYear: 2019 };
export const STANDARD_DRINK = [
  { country: 'the United Kingdom', name: 'units', grams: 8 },
  { country: 'Australia', name: 'standard drinks', grams: 10 },
  { country: 'the United States', name: 'standard drinks', grams: 14 },
];
/** UK units in a drink: volume (ml) × strength (% alcohol by volume) ÷ 1000. */
export const ukUnits = (ml, abv) => (ml * abv) / 1000;

// Cancers that alcohol is known to cause (IARC Monographs, vol. 100E, 2012; WHO Europe, 2023).
export const ALCOHOL_CANCERS = ['mouth', 'throat', 'voice box', 'food pipe (oesophagus)', 'liver', 'bowel', 'breast'];

// Low-risk drinking guidance differs by country, and none of it calls any amount risk-free.
//   UK Chief Medical Officers (2016): no more than 14 units a week, spread over three or more days.
//   Australia, NHMRC (2020): no more than 10 standard drinks a week and 4 on any one day.
//   Canada, CCSA (2023): 2 standard drinks or fewer a week is low risk.
//   United States, Dietary Guidelines 2025-2030 (January 2026): "consume less alcohol for better overall health", with no number (the earlier limits of 1 or 2 drinks a day were dropped).
//   WHO (2023): no level of alcohol consumption is safe for health.
export const ALCOHOL_GUIDANCE = { ukUnitsPerWeek: 14, australiaPerWeek: 10, australiaPerDay: 4, canadaPerWeek: 2 };

/* ---------------------------------------------------------- health claims */

// Processed meat and bowel cancer: each 50 g eaten daily raises the risk by about 18% (IARC Monographs
// vol. 114, 2015). Lifetime risk of bowel cancer in the UK is about 6 in 100 (Cancer Research UK).
export const MEAT = { relativePct: 18, lifetimePer100: 6 };

// The 1995 "pill scare" in the UK: a warning that newer contraceptive pills doubled the risk of blood clots
// (from about 1 in 7,000 women a year to about 2 in 7,000) was followed by an estimated 13,000 additional
// abortions the next year (Furedi, Human Reproduction Update 1999; Gigerenzer et al., Psychol Sci Public Interest 2007).
export const PILL_SCARE = { year: 1995, perWomen: 7000, before: 1, after: 2, abortions: 13000 };

// A surrogate outcome that misled: torcetrapib raised HDL ("good") cholesterol by about 70% and lowered LDL,
// yet in a trial of 15,000 people more of those taking it died (ILLUMINATE, New England Journal of Medicine, 2007).
export const TORCETRAPIB = { hdlRisePct: 70, people: 15000, year: 2007 };

// The ladder of evidence, weakest first.
export const EVIDENCE_LADDER = [
  'One person\'s story',
  'Experiments on cells or animals',
  'Studies that observe what people choose to do',
  'Randomised controlled trials',
  'Reviews that pool all the good trials',
];

// Invented headlines for practice: [people in the comparison, of whom affected, % change, more or fewer].
// Every answer is a whole number of people.
export const HEADLINE_CASES = [
  [1000, 20, 50, 1], [1000, 40, 25, 1], [1000, 8, 50, 1], [10000, 10, 100, 1], [10000, 4, 50, 1], [1000, 30, 10, 1],
  [10000, 50, 20, 1], [100, 10, 50, 1], [1000, 60, 50, -1], [1000, 200, 25, -1], [1000, 100, 30, -1], [100, 20, 25, -1],
];
