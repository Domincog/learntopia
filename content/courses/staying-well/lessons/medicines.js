// Staying Well: Prevention and Everyday Medicine · Lesson 3 · Medicines and How to Use Them
//
// Driving question: what can a medicine do and not do, and how do you find that out from the box?
// Every label in this lesson is a SAMPLE label (see ../helpers.js); every calculation is for an example person.
import { r, num, plural } from '../../../kit.js';
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/staying-well/index.js';
import { PEOPLE, PENICILLIN, AMR, LABELS, labelRows, labelSpec, PARACETAMOL_MAX_MG, clock, thousands } from '../helpers.js';

const GUT = { type: 'resistance-sim', words: { place: 'Bacteria in the gut' } };

// Which line of a label answers which question.
const LABEL_QUESTIONS = [
  { row: 'active', ask: 'Which line tells you **what the medicine actually is**, whatever name is printed on the front?', because: 'The active ingredient is the substance that does the work. Two packs with different names and the same active ingredient are the same medicine.' },
  { row: 'max', ask: 'Which line tells you **the most that may be taken in a day**?', because: 'The maximum counts every dose in any 24 hours, however bad the symptoms.' },
  { row: 'dose', ask: 'Which line tells you **how long to wait before another dose**?', because: 'The dose line gives how much to take at one time and the gap to leave before the next.' },
  { row: 'warn', ask: 'Which line tells you **what not to combine it with**, or who should ask before taking it?', because: 'The warnings say who should check first and what must not be taken alongside.' },
];
const ROW_NAMES = { active: 'the active ingredient', use: 'what the medicine is for', dose: 'the dose and the gap between doses', max: 'the daily maximum', warn: 'the warnings' };

// Paracetamol from several products in one day: [doses of two 500 mg tablets, sachets of 1,000 mg, night-time doses of 1,000 mg].
const DOUBLE = [[2, 1, 0], [1, 2, 0], [1, 1, 1], [2, 0, 1], [2, 2, 1], [3, 2, 0], [3, 1, 1], [4, 1, 1], [3, 3, 0], [2, 3, 1]];
const TIMES = ['once', 'twice', 'three times', 'four times'];

// An invented label for the worked example: its numbers are on none of the sample labels the questions draw from.
const EXAMPLE_LABEL = {
  type: 'med-label',
  labels: [{
    name: 'Sample Capsules', sub: '24 capsules · an invented medicine', color: 'violet',
    rows: [
      { id: 'active', head: 'Active ingredient (in each capsule)', text: 'Medicine X 250 mg' },
      { id: 'dose', head: 'Dose', text: 'Adults: 1 or 2 capsules every 8 hours, if needed' },
      { id: 'max', head: 'Maximum', text: 'Do not take more than 6 capsules in 24 hours' },
    ],
  }],
  alt: 'A sample label for an invented medicine. Active ingredient in each capsule: Medicine X 250 mg. Dose: 1 or 2 capsules every 8 hours, if needed. Maximum: do not take more than 6 capsules in 24 hours.',
};

export default {
  id: 'medicines',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'To be on the safe side',
      text: `
        Kofi has had a cold for three days: a runny nose, a sore throat, a cough. He has some antibiotic tablets left over from last year and wonders whether to take them, "to be on the safe side".

        **What would the antibiotics do to his cold?**
      `,
      columns: 1,
      options: [
        { text: 'Clear it up a day or two sooner' },
        { text: 'Stop it from turning into something worse' },
        { text: 'Nothing at all', correct: true },
        { text: 'Help, but only if he took the whole pack' },
      ],
      explain: `
        **Nothing at all.** A cold is caused by a virus, and antibiotics act only on bacteria. In surveys, many people believe otherwise.

        The tablets would not be harmless either. To see why, you need to know how an antibiotic works, and what happens to the bacteria that meet one.
      `,
    },
    {
      id: 'teach-antibiotics',
      type: 'info',
      title: 'Built to hit bacteria',
      text: `
        An antibiotic works by attacking a part that bacteria have and your own cells do not, such as the bacterial cell wall. A virus has no such part: it is a packet of genes that works inside your cells. So everything depends on which kind of germ is behind an illness.

        | Caused by bacteria | Caused by viruses |
        |---|---|
        | Strep throat | The common cold |
        | Tuberculosis | Flu |
        | Urinary tract infections (almost always) | COVID-19 |
        | | Most coughs and sore throats |

        Strep throat is the exception among sore throats: a swab test can tell it from the far commoner viral kind.
      `,
    },
    {
      id: 'targets',
      type: 'bucket',
      review: true,
      title: 'What an antibiotic can hit',
      text: `
        Antibiotics attack parts that bacteria have and your cells do not, such as the bacterial cell wall. A virus has none of those parts: it is a packet of genes that works inside your own cells.

        **Which of these illnesses can an antibiotic treat?**
      `,
      buckets: ['Antibiotics can treat it', 'Antibiotics do nothing'],
      items: [
        { text: 'Strep throat', bucket: 0, why: 'Caused by *Streptococcus* bacteria. A swab test can tell it from the far commoner viral sore throat.' },
        { text: 'A urinary tract infection', bucket: 0, why: 'Almost always bacterial.' },
        { text: 'Tuberculosis', bucket: 0, why: 'Caused by a bacterium, and cured by several antibiotics taken together for months.' },
        { text: 'The common cold', bucket: 1, why: 'Caused by viruses, more than 200 kinds of them.' },
        { text: 'Flu', bucket: 1, why: 'Caused by influenza viruses. Antiviral medicines exist for some people at high risk; antibiotics do nothing.' },
        { text: 'Most coughs and sore throats', bucket: 1, why: 'Most are viral and clear up on their own within a week or two.' },
        { text: 'COVID-19', bucket: 1, why: 'Caused by a virus.' },
      ],
      explain: `
        Bacterial infections on the left, viral ones on the right. For a viral illness, rest, fluids and something for the pain and fever are what help while the immune system does the work.

        Antibiotics changed medicine. **Alexander Fleming** noticed in ${PENICILLIN.fleming} that a mould was killing the bacteria on one of his culture plates; **Howard Florey** and **Ernst Chain** turned its product, penicillin, into a medicine by ${PENICILLIN.medicine}. Before that, an infected scratch could kill.
      `,
    },
    {
      id: 'selection',
      type: 'interact',
      graded: false,
      title: 'Survival of the resistant',
      text: `
        Trillions of bacteria live in your gut, nearly all of them harmless. Here are 200 of them. By chance, **2** carry a gene that lets them survive a certain antibiotic.

        **Give a course of the antibiotic, then let the survivors multiply.** Repeat until more than half of the bacteria are resistant.
      `,
      widget: { ...GUT, alt: 'Two hundred dots stand for bacteria in the gut; two of them are resistant to an antibiotic. Buttons give a course of the antibiotic and let the survivors multiply, and a chart records each step.' },
      check: (s) => {
        if (s.share > 0.5 && s.full) return true;
        if (!s.doses) return 'Press **Give a course of antibiotic** to begin.';
        if (!s.full) return 'Now press **Let them multiply**, so that the survivors fill the space again.';
        return `${s.resistant} of 200 are resistant now: ${num(s.share * 100, 0)}%. Give another course and let them multiply again.`;
      },
      solution: { log: ['dose', 'grow', 'dose', 'grow', 'dose', 'grow'] },
      explain: `
        The resistant share went from 1% to 9%, then 47%, then 89%: three courses were enough.

        No bacterium changed. Each course killed nine in ten of the ordinary bacteria and hardly any of the resistant ones, and the survivors' descendants filled the gap. That is **natural selection**, fast enough to watch.
      `,
    },
    {
      id: 'selection-why',
      type: 'choice',
      review: true,
      title: 'Who becomes resistant?',
      text: `
        This time the 200 bacteria include **no** resistant ones at the start. Try as many courses as you like.

        **What does "antibiotic resistance" mean?**
      `,
      figure: { ...GUT, resistant: 0, alt: 'Two hundred dots stand for bacteria in the gut, none of them resistant. Buttons give a course of an antibiotic and let the survivors multiply.' },
      columns: 1,
      options: [
        { text: 'Bacteria that already resist the antibiotic survive it and take over', correct: true },
        { text: 'Each bacterium learns to resist the antibiotic when it meets it', why: 'In the model, with no resistant bacteria to begin with, none appear: the ordinary ones just die. An antibiotic does not teach; it sorts.' },
        { text: 'The person\'s body gets used to the antibiotic, so it stops working for them', why: 'It is the bacteria that are resistant, not the person. That matters, because resistant bacteria can spread to other people, including people who have never taken an antibiotic.' },
        { text: 'The antibiotic gets weaker each time it is manufactured', why: 'The medicine is the same. What has changed is the population of bacteria it meets.' },
      ],
      explain: `
        Resistance belongs to the **bacteria**. Resistant ones arise rarely, by chance mutations or by picking up genes from other bacteria. Antibiotics do not create them: they clear away the competition.

        So every course, needed or not, shifts the balance a little, in the person who takes it and in the bacteria they pass on. Infections that resist antibiotics directly caused about ${AMR.deaths2021} million deaths worldwide in 2021.
      `,
    },
    {
      id: 'disc-test',
      type: 'interact',
      title: 'Which antibiotic will work?',
      text: `
        A hospital laboratory has spread one patient's bacteria over a plate of jelly and laid small paper discs on top, each soaked in a different antibiotic.

        Where an antibiotic works, nothing can grow, and a dark, clear circle appears around the disc. **Tap a disc whose antibiotic these bacteria resist.**
      `,
      widget: photo(MEDIA['disk-test'], {
        alt: 'A round laboratory plate covered in a pale film of bacteria, with about a dozen small white paper discs on it. Most discs sit in the middle of a darker, clear circle where no bacteria grow; the circles differ in size. Two discs have no clear circle at all: the pale film reaches their edges.',
        caption: 'A disc test: a clear circle is where an antibiotic has stopped the bacteria from growing',
        maxWidth: 640,
        hotspots: [
          { id: 'none1', x: 0.179, y: 0.656, r: 0.05, label: 'No clear circle: resistant', alt: 'a disc near the lower left edge with the pale film right up to it' },
          { id: 'none2', x: 0.410, y: 0.127, r: 0.05, label: 'No clear circle: resistant', alt: 'a disc near the top with the pale film right up to it' },
          { id: 'centre', x: 0.498, y: 0.522, r: 0.05, label: 'Wide circle: works', alt: 'a disc in the middle of the plate inside a wide dark circle' },
          { id: 'right', x: 0.777, y: 0.346, r: 0.05, label: 'Wide circle: works', alt: 'a disc on the right inside a wide dark circle' },
          { id: 'left', x: 0.241, y: 0.276, r: 0.05, label: 'Clear circle: works', alt: 'a disc on the upper left inside a dark circle' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'none1' || s.picked === 'none2') return true;
        if (!s.picked) return 'Tap one of the ringed discs.';
        return 'That disc sits in a dark, clear circle: its antibiotic has stopped the bacteria around it. Look for a disc with the pale film of bacteria right up to its edge.';
      },
      solution: { picked: 'none1' },
      hints: ['A resistant bacterium does not care that the antibiotic is there. What would the plate look like around that disc?'],
      explain: `
        Two of the ringed discs have **no clear circle**: the bacteria have grown right up to the paper. Against this patient's infection those two antibiotics would do nothing, while several others would work. (The laboratory also measures each circle: a narrow one can mean that the antibiotic works too weakly to rely on.)

        A test like this takes a day or two. It lets doctors choose an antibiotic that will work, and the narrowest one that will.
      `,
    },
    {
      id: 'slow-it',
      type: 'multi',
      title: 'Keeping antibiotics working',
      text: 'Resistance cannot be stopped, only slowed. Every course of an antibiotic does some selecting, whether it was needed or not, and an antibiotic that kills many kinds of bacteria does the most. **Which of these slow resistance down?** Choose all that apply.',
      columns: 1,
      options: [
        { text: 'Not asking for antibiotics for colds, flu and most sore throats', correct: true },
        { text: 'Taking a prescribed antibiotic exactly as the prescriber says: dose, timing and length', correct: true },
        { text: 'Never sharing antibiotics or saving leftovers for next time', correct: true },
        { text: 'Vaccination and handwashing, so that fewer infections need treating', correct: true },
        { text: 'Keeping a spare pack at home to take at the first sign of illness', why: 'Most first signs are viral. Unneeded courses select resistant bacteria and can cause side effects, with no benefit.' },
        { text: 'Asking for the strongest antibiotic available', why: 'Antibiotics that kill many kinds of bacteria also do the most selecting. Prescribers choose the narrowest one that will do the job.' },
      ],
      explain: `
        Fewer unnecessary courses means less selection. When an antibiotic *is* needed, it can be life-saving, and it should be taken as prescribed.

        How long a course should last is being studied afresh, and for many infections shorter courses are now prescribed than a generation ago. That is the prescriber's decision to make: do not stop early or carry on longer on your own.
      `,
    },
    {
      id: 'teach-label',
      type: 'info',
      title: 'Five lines on every box',
      text: `
        Every medicine sold without a prescription carries the same few facts. This is a **sample** label.

        - **Active ingredient**: the substance that does the work, and how much of it each tablet holds. The name on the front of the box is only a brand.
        - **Use**: what the medicine is for.
        - **Dose**: how much to take at one time, and the gap to leave before the next dose.
        - **Maximum**: the most in any 24 hours, however bad the symptoms.
        - **Warnings**: who should ask before taking it, and what must not be taken alongside.
      `,
      figure: labelSpec(LABELS.allergy, { alt: `A sample medicine label for ${LABELS.allergy.name}, with five lines. Active ingredient in each tablet: ${LABELS.allergy.active}. Use: ${LABELS.allergy.use}. Dose: ${LABELS.allergy.dose}. Maximum: ${LABELS.allergy.max}. Warnings: ${LABELS.allergy.warn}` }),
    },
    {
      id: 'label-pick',
      type: 'interact',
      title: 'Reading the box',
      gen: (rng) => {
        const key = rng.pick(['paracetamol', 'acetaminophen', 'ibuprofen', 'coldflu']);
        const label = LABELS[key];
        const q = rng.pick(LABEL_QUESTIONS);
        return {
          text: `
            Every medicine sold without a prescription carries the same few facts. This is a **sample** label.

            ${q.ask} **Tap it.**
          `,
          widget: labelSpec(label, { mode: 'pick', alt: `A sample medicine label for ${label.name}, with five lines: active ingredient, use, dose, maximum and warnings.` }),
          check: (s) => {
            if (s.picked === q.row) return true;
            if (!s.picked) return 'Tap one of the five lines of the label.';
            return `That line gives ${ROW_NAMES[s.picked]}. Look for the line that answers the question.`;
          },
          solution: { picked: q.row },
          explain: `${q.because}\n\nA label in your country may arrange these facts differently, but they are always there: **what** it is, what it is **for**, **how much**, **how often**, the **most** in a day, and the **warnings**.`,
        };
      },
    },
    {
      id: 'example-label',
      type: 'info',
      title: 'Three sums from a label',
      text: `
        The numbers on a label answer three questions that come up again and again. Here they are worked out for an invented medicine.

        :::example Worked example: the Sample Capsules
        - **The most in 24 hours, in milligrams.** 6 capsules of 250 mg each: 6 × 250 = **1,500 mg**.
        - **How many more today?** Hanna has taken 2 capsules, twice. That is 4 so far, and 6 − 4 = **2** more.
        - **The earliest next dose.** She took the last one at 07:30. The gap is 8 hours, so not before **15:30**.
        :::

        Where a label gives a range, such as "every 4 to 6 hours", the smaller number is the shortest gap it allows.
      `,
      figure: EXAMPLE_LABEL,
    },
    {
      id: 'max-day',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const key = rng.pick(['paracetamol', 'acetaminophen', 'ibuprofen', 'coldflu']);
        const label = LABELS[key];
        const who = rng.pick(PEOPLE);
        const figure = labelSpec(label, { alt: `A sample medicine label. Active ingredient in each ${label.unit}: ${label.active}. Dose: ${label.dose}. Maximum: ${label.max}.` });
        const maxMg = label.strength * label.maxUnits;
        if (rng.bool(0.5)) {
          return {
            text: `Here is a sample label. **What is the most ${label.drug.split(' ')[0]} this label allows in 24 hours, in milligrams?**`,
            figure,
            answer: maxMg,
            unit: 'mg',
            wrong: [
              [label.strength * label.perDose, `That is one dose: ${plural(label.perDose, label.unit)}. The question asks about a whole day.`],
              [label.maxUnits, `That is the number of ${label.unit}s. Each one holds ${thousands(label.strength)} mg.`],
            ],
            hints: [`Find two numbers on the label: the milligrams in each ${label.unit}, and the most ${label.unit}s in 24 hours.`, `${label.maxUnits} ${label.unit}s × ${thousands(label.strength)} mg`],
            explain: r`Each ${label.unit} holds ${thousands(label.strength)} mg and the maximum is ${label.maxUnits} ${label.unit}s: $${label.maxUnits} \times ${label.strength} = ${thousands(maxMg)}$ mg in 24 hours. Different products have different limits, so the label in your hand is the one to follow.`,
          };
        }
        const doses = rng.int(1, Math.max(1, Math.floor(label.maxUnits / label.perDose) - 1));
        const taken = doses * label.perDose;
        const left = label.maxUnits - taken;
        return {
          text: `Here is a sample label. Since this morning ${who} has taken **${plural(label.perDose, label.unit)}, ${TIMES[doses - 1]}**. **How many more ${label.unit}s does the label allow ${who} in the same 24 hours?**`,
          figure,
          answer: left,
          unit: `${label.unit}s`,
          wrong: [
            [label.maxUnits, `That is the whole day's maximum. ${who} has already taken ${taken} of them.`],
            ...(label.perDose > 1 ? [[label.maxUnits - doses, `${who} took ${plural(label.perDose, label.unit)} each time: ${taken} in all, not ${doses}.`]] : []),
          ],
          hints: [`The label's maximum is ${label.maxUnits} ${label.unit}s in 24 hours.`, `${who} has taken ${doses} × ${label.perDose} = ${taken} so far.`],
          explain: r`Taken so far: $${doses} \times ${label.perDose} = ${taken}$. The maximum is ${label.maxUnits}, so $${label.maxUnits} - ${taken} = ${left}$ more, each dose at least ${label.everyHours} hours after the last. If the pain or fever is not controlled within the label's limits, that is a reason to ask a pharmacist or doctor, not to take more.`,
        };
      },
    },
    {
      id: 'next-dose',
      type: 'choice',
      shuffle: false,
      gen: (rng) => {
        const key = rng.pick(['paracetamol', 'acetaminophen', 'ibuprofen', 'coldflu']);
        const label = LABELS[key];
        const who = rng.pick(PEOPLE);
        const t = rng.pick([6.5, 7, 7.75, 8.5, 9, 10.25, 11.5, 12, 13.25, 14.5, 15]);
        const gaps = label.everyHours === 6 ? [2, 4, 6, 8] : [2, 3, 4, 6];
        return {
          text: `${who} takes a dose of this sample medicine at **${clock(t)}**. **What is the earliest time at which the label allows another dose?**`,
          figure: labelSpec(label, { alt: `A sample medicine label. Dose: ${label.dose}. Maximum: ${label.max}.` }),
          options: gaps.map((g) => ({
            text: clock(t + g),
            correct: g === label.everyHours,
            why: g < label.everyHours ? `That is only ${g} hours later. The label asks for a gap of at least ${label.everyHours} hours.` : g > label.everyHours ? `A dose then is allowed, but it is not the earliest: the label asks for at least ${label.everyHours} hours.` : undefined,
          })),
          hints: ['Look at the dose line: how many hours must pass between doses?'],
          explain: `The label says ${label.everyHours === 6 ? 'every 6 hours' : key === 'ibuprofen' ? 'at least 4 hours between doses' : 'every 4 to 6 hours'}, so the gap must be at least ${label.everyHours} hours: ${clock(t)} + ${label.everyHours} h = **${clock(t + label.everyHours)}**. The gap gives the body time to clear the last dose. Taking doses closer together raises the level in the blood, even when the day's total stays within the maximum.`,
        };
      },
    },
    {
      id: 'brand-generic',
      type: 'choice',
      title: 'Two boxes, two prices',
      text: `
        A pharmacy shelf holds these two packs. One has a well-known name, a glossy box and a price four times as high.

        **What is the difference for the person who swallows the tablet?**
      `,
      figure: {
        type: 'med-label',
        labels: [
          { name: 'BigName Rapid Relief', sub: '16 tablets · 6.40', color: 'pink', rows: labelRows(LABELS.ibuprofen, 'a-').slice(0, 4) },
          { name: 'Ibuprofen Tablets', sub: '16 tablets · 1.60', color: 'orange', rows: labelRows(LABELS.ibuprofen, 'b-').slice(0, 4) },
        ],
        alt: 'Two sample labels side by side. One has an invented brand name and costs 6.40; the other is called simply Ibuprofen Tablets and costs 1.60. Their active ingredient, use, dose and maximum lines are word for word the same: ibuprofen 200 mg.',
      },
      columns: 1,
      options: [
        { text: 'None that matters: same active ingredient, same strength, same dose', correct: true },
        { text: 'The branded one is stronger', why: 'Read the first line of each: 200 mg of ibuprofen in every tablet, in both.' },
        { text: 'The branded one is safer, because it is tested more carefully', why: 'A generic medicine must meet the same standards and show that it delivers the same amount of the active ingredient into the body.' },
        { text: 'The cheaper one works more slowly', why: 'Regulators require a generic to be absorbed at essentially the same rate and to the same extent as the original.' },
      ],
      explain: `
        The name on the front is the **brand**. The name in the active-ingredient line is the **generic** name, and it is what your body meets. Medicines regulators license a generic only if it matches the original in content and in how it is absorbed.

        (Names can differ between countries too: **paracetamol** in most of the world is **acetaminophen** in North America. Same substance.)
      `,
    },
    {
      id: 'double-dose',
      type: 'fill',
      review: true,
      tone: 'sober',
      title: 'The hidden ingredient',
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const [tab, sach, night] = rng.pick(DOUBLE);
        const total = tab * 1000 + sach * 1000 + night * 1000;
        const over = total > PARACETAMOL_MAX_MG;
        const lines = [
          `- two 500 mg paracetamol tablets, ${TIMES[tab - 1]}`,
          sach ? `- ${plural(sach, 'cold-and-flu sachet')}, each with 1,000 mg of paracetamol` : null,
          night ? '- one dose of a night-time cough liquid, with 1,000 mg of paracetamol' : null,
        ].filter(Boolean).join('\n');
        const choice = rng.bool() ? `${over ? '*' : ''}over|${over ? '' : '*'}within` : `${over ? '' : '*'}within|${over ? '*' : ''}over`;
        return {
          text: `${who} has flu, and in one 24 hours takes:\n\n${lines}\n\nEach pack on its own was used as its label says. Every one of them also says: no more than **${thousands(PARACETAMOL_MAX_MG)} mg** of paracetamol in 24 hours, from all medicines together.`,
          template: `Total paracetamol: [[${total}]] mg. That is [[${choice}]] the limit.`,
          hints: [`The tablets alone: ${tab} × 2 × 500 mg = ${thousands(tab * 1000)} mg.`, 'Add 1,000 mg for each sachet and for the night-time dose.'],
          explain: `
            ${thousands(tab * 1000)} mg from the tablets${sach ? ` + ${thousands(sach * 1000)} mg from the sachets` : ''}${night ? ' + 1,000 mg from the night-time liquid' : ''} = **${thousands(total)} mg**${over ? `, which is over the ${thousands(PARACETAMOL_MAX_MG)} mg limit` : `, within the ${thousands(PARACETAMOL_MAX_MG)} mg limit, though with little room left`}.

            Paracetamol (acetaminophen) is safe at label doses and can seriously damage the liver above them. It is in hundreds of cold, flu and sleep remedies, so always check the active-ingredient line. Anyone who may have taken too much needs medical help **at once**, even if they feel well: the harm does not show for a day or more, and early treatment works.

            The limit is lower on some packs and for some people, such as adults of low body weight or with liver disease. The label in the hand is the one to follow, and a pharmacist can say what applies to a particular person.
          `,
        };
      },
    },
    {
      id: 'teach-cautions',
      type: 'info',
      title: 'Not for everyone',
      text: `
        A medicine that is safe for most people is not safe for everybody, and some things that are not medicines at all can interfere with one. Four examples:

        | | A caution that applies |
        |---|---|
        | **Ibuprofen** | Can irritate the stomach. Unsuitable for some people with asthma, ulcers or kidney disease |
        | **Aspirin** | Not for children: linked to a rare, serious illness called Reye's syndrome |
        | **St John's wort** (a herbal remedy) | Can stop other medicines from working, including the contraceptive pill |
        | **Grapefruit juice** | Raises the blood level of several medicines |

        A herbal remedy or a food is not a medicine, and it still contains active chemicals.
      `,
    },
    {
      id: 'cautions',
      type: 'match',
      title: 'Not for everyone',
      text: 'Medicines you can buy without a prescription are safe for most people, used as the label says. Each has its cautions. **Match each one with a caution that applies to it.**',
      pairs: [
        ['Ibuprofen', 'Can irritate the stomach, and is unsuitable for some people with asthma, ulcers or kidney disease'],
        ['Aspirin', 'Not for children: linked to a rare, serious illness called Reye\'s syndrome'],
        ['St John\'s wort, a herbal remedy', 'Can stop other medicines from working, including the contraceptive pill'],
        ['Grapefruit juice', 'A food that raises the blood level of several medicines'],
      ],
      explain: `
        "Natural" does not mean safe, and "sold in a shop" does not mean safe for everybody. Herbal remedies and supplements contain active chemicals too, and can interact with medicines.

        This is what a **pharmacist** is for: they are trained in exactly these questions, and asking costs nothing. Tell them everything you take, including supplements. (The age below which aspirin is ruled out differs between countries.)
      `,
    },
    {
      id: 'placebo',
      type: 'choice',
      title: 'How do we know it works?',
      text: `
        Give 100 people with a headache a tablet that contains no medicine at all, and tell them it is a painkiller. A fair number will say that it helped. That is the **placebo effect**, together with the plain fact that headaches fade by themselves.

        Remember how vaccines are tested: in the largest trials, half the volunteers are given a comparison injection, chosen at random. **So how should a new painkiller be tested?**
      `,
      columns: 1,
      options: [
        { text: 'Give half the volunteers, chosen at random, the drug and the other half a look-alike dummy, with nobody knowing who got which until the end', correct: true },
        { text: 'Give it to 100 people and count how many feel better', why: 'Many would feel better with a dummy tablet too. Without a comparison group, there is no telling what the drug added.' },
        { text: 'Let the volunteers choose between the drug and the dummy', why: 'People who choose the new drug may differ from those who do not, and knowing what you took changes how you rate your pain.' },
        { text: 'Ask the doctors running the trial which patients improved most', why: 'Doctors who know who got the drug may, without meaning to, see more improvement in those patients. That is why the doctors are kept "blind" too.' },
      ],
      explain: `
        This is a **randomised, double-blind, placebo-controlled trial**. Random assignment makes the two groups alike. The dummy (placebo) soaks up the effects of expectation and of time. Blinding keeps hopes from colouring the results.

        Whatever the drug group gains *beyond* the placebo group is the medicine's own effect. A new medicine has to show one, or to match a treatment that already has, before it is licensed.
      `,
    },
    {
      id: 'try-it',
      type: 'info',
      title: 'Something to try this week',
      text: `
        Pick up one medicine you have at home and find its **active ingredient**. Then see whether anything else in the cupboard contains the same one.

        While you are there, two habits worth having:

        - Keep medicines **out of the sight and reach of children**. Many look like sweets.
        - In many countries a pharmacy will take back out-of-date medicines and leftover antibiotics, which is better than binning or flushing them.
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    'Antibiotics kill bacteria and do nothing to viruses, so they cannot treat colds, flu or most sore throats.',
    'Resistance is evolution in action: each course kills the ordinary bacteria and leaves the resistant ones to multiply. It is the bacteria that become resistant, not the person.',
    'A label tells you what the medicine is, how much to take, how often, and the most in 24 hours. The active ingredient matters, not the brand.',
    'Paracetamol (acetaminophen) is safe at label doses and dangerous above them, and it hides in many cold remedies. When in doubt, ask a pharmacist.',
  ],
  next: 'Next: the parts of you that do not grow back, and the small daily habits that keep them.',
};
