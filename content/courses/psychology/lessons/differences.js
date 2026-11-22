// Psychology: How Minds Work · Lesson 8 · Measuring People
//
// Driving question: what can a test tell you about a person?
// Sources for the facts are noted in ../helpers.js.
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/psychology/index.js';
import { FORER, CARLSON, BIG_FIVE, BIG_FIVE_CASES, MBTI, MISCHEL, IQ, FLYNN, IQ_HERITABILITY, EUGENICS, MINDSET, WEIRD, MEASURE_CASES, MEASURE_KINDS, WEIGHED, PEOPLE } from '../helpers.js';

const SCALES = [
  { name: 'IQ scores', mean: 100, sd: 15 },
  { name: 'Scores on a reading test', mean: 50, sd: 10 },
  { name: 'Scores on a university entrance test', mean: 500, sd: 100 },
];
// share (%) from the "68 and 95" rule; `both` is the two-sided share that the common slip gives
const REGIONS = [
  { k: 1, where: 'between', answer: 68 },
  { k: 2, where: 'between', answer: 95 },
  { k: 1, where: 'above', answer: 16, both: 32 },
  { k: 1, where: 'below', answer: 16, both: 32 },
  { k: 2, where: 'above', answer: 2.5, both: 5 },
  { k: 2, where: 'below', answer: 2.5, both: 5 },
];
const thousands = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default {
  id: 'differences',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      graded: false,
      title: 'Who are you?',
      text: `
        Countless websites offer to reveal your personality. Here is one more.

        **Choose three shapes and build your profile.** Read it, decide how well it fits, and then press **"How was this made?"**
      `,
      widget: {
        type: 'barnum-profile', statements: FORER.statements,
        note: `In **${FORER.year}** the psychologist Bertram Forer handed ${FORER.students} students a text like this as the "result" of a personality test. On a scale from 0 to 5 they rated its accuracy at **${FORER.mean}** on average.`,
      },
      check: (s) => s.done || (s.built ? 'When you have read the profile, press "How was this made?"' : 'Choose three shapes and build the profile.'),
      solution: { revealed: true },
      explain: `
        The "test" was a fake, and saying so straight away is part of doing this honestly. Forer's students had all received **the same text**, which he had put together from an astrology book.

        The statements feel personal because they are vague, mostly flattering, and have it both ways ("at times outgoing, at other times reserved"), so they fit nearly everyone. This is the **Barnum effect**. Not everyone is convinced, least of all on a screen where a trick may be expected, and that is fine too. Astrology has been tested the same way: in ${CARLSON.year}, ${CARLSON.astrologers} astrologers tried to match birth charts to personality profiles and did no better than guessing.
      `,
    },
    {
      id: 'ruler',
      type: 'interact',
      graded: false,
      title: 'Three rulers',
      text: `
        So how can a good test be told from a bad one? Start with something simpler than a mind: a pencil, known to be exactly 12.0 cm long.

        **Measure it at least five times with each of the three rulers**, and watch the dots.
      `,
      widget: { type: 'stretchy-ruler', alt: 'A pencil lying above a ruler, and three strips of dots recording the readings of a steel ruler, an elastic ruler and a misprinted ruler.' },
      check: (s) => {
        const todo = Object.keys(s.counts).filter((id) => s.counts[id] < 5);
        if (!todo.length) return true;
        const names = { steel: 'steel', elastic: 'elastic', misprint: 'misprinted' };
        return `Take at least five readings with the ${names[todo[0]]} ruler (${s.counts[todo[0]]} so far).`;
      },
      solution: { counts: { steel: 5, elastic: 5, misprint: 5 } },
      explain: `
        - The **steel** ruler gives almost exactly the same answer every time, and it is the right answer.
        - The **elastic** ruler gives a different answer every time. A measure you cannot repeat tells you nothing.
        - The **misprinted** ruler is just as consistent, and consistently wrong.
      `,
    },
    {
      id: 'teach-reliable-valid',
      type: 'info',
      title: 'Two questions for any measure',
      text: `
        A measure is **reliable** if it gives the same result when repeated. It is **valid** if it measures what it claims to measure.

        | Ruler | Repeats? | Right? | So it is… |
        |---|---|---|---|
        | Steel | yes | yes | reliable and valid |
        | Elastic | no | no | neither |
        | Misprinted | yes | no | reliable, not valid |

        Reliability comes first: a measure that cannot agree with itself tells you nothing. But it is not enough, as the misprinted ruler shows.

        A test of people faces the same two questions. Would the result be the same next month? And does it go with the thing it claims to measure?
      `,
    },
    {
      id: 'rel-val',
      type: 'choice',
      review: true,
      columns: 1,
      shuffle: false,
      gen: (rng) => {
        const c = rng.pick(MEASURE_CASES);
        // why[picked][truth]: feedback for choosing `picked` when the case is really `truth`
        const why = {
          both: { reliable: 'It does give the same result each time. But is that result the thing it claims to measure?', neither: 'Its results do not even repeat from one time to the next.' },
          reliable: { both: 'It is reliable, yes. But here the results also match the real thing, so it is valid as well.', neither: 'Reliable means the result repeats. Here it changes from one time to the next.' },
          neither: { both: 'Its results repeat, and they match the real thing: that is both.', reliable: 'Look again: it gives the same result every time, which makes it reliable at least.' },
        };
        const tell = {
          both: 'It repeats (reliable) and it matches what it is supposed to measure (valid).',
          reliable: 'It repeats, so it is reliable. But what it repeats is not the thing it claims to measure, so it is not valid.',
          neither: 'Its results do not repeat, so it is not reliable, and a measure that cannot agree with itself cannot be valid.',
        };
        return {
          text: `
            A measure is **reliable** if it gives the same result when repeated, and **valid** if it measures what it claims to measure.

            ${c.text}

            **This measure is…**
          `,
          options: Object.keys(MEASURE_KINDS).map((k) => ({ text: MEASURE_KINDS[k], correct: k === c.kind, why: k === c.kind ? undefined : why[k][c.kind] })),
          explain: `**${MEASURE_KINDS[c.kind]}.** ${tell[c.kind]}`,
        };
      },
    },
    {
      id: 'types',
      type: 'choice',
      title: 'Types or traits?',
      columns: 1,
      gen: (rng) => {
        const [a, b, c] = rng.sample(PEOPLE, 3);
        const low = 50 - rng.int(1, 3);
        const mid = 50 + rng.int(1, 3);
        const high = rng.int(84, 97);
        return {
          text: `
            A questionnaire scores how outgoing people are, from 0 to 100. ${a} scores **${low}**, ${b} scores **${mid}** and ${c} scores **${high}**.

            A "personality type" test then calls everyone above 50 an **extravert** and everyone below 50 an **introvert**. **Which two people get the same label?**
          `,
          options: [
            { text: `${b} and ${c}`, correct: true },
            { text: `${a} and ${b}`, why: `They are only ${mid - low} points apart, but they fall on opposite sides of the cut-off, so they get opposite labels.` },
            { text: `${a} and ${c}`, why: `${a} is below 50 and ${c} far above it: opposite labels.` },
          ],
          explain: `
            ${b} (${mid}) and ${c} (${high}) are both "extraverts", though ${b} is ${mid - low} points from ${a} and ${high - mid} from ${c}. Most people score near the middle of such scales, so a cut-off splits the crowd where it is thickest, and a small wobble on a retest flips the label. One review of the best-known type test, the MBTI, reported that ${MBTI.changeShare} of people got a different four-letter type when retested ${MBTI.retestWeeks} weeks later, and the types predict little about how people fare at work.

            A label throws away most of what the score said.
          `,
        };
      },
    },
    {
      id: 'teach-big-five',
      type: 'info',
      title: 'Traits, not types',
      text: `
        Psychologists describe personality with **traits**: positions on continuous scales, not boxes. Decades of research in many languages keep arriving at the same five broad traits, the **Big Five**.

        | Trait | Someone high on it is… |
        |---|---|
        ${BIG_FIVE.map(([name, what]) => `| **${name}** | ${what} |`).join('\n        ')}

        Everyone has a position on all five, somewhere between the extremes.
      `,
    },
    {
      id: 'big-five',
      type: 'match',
      title: 'The Big Five',
      text: 'Five people, each described by one habit. **Match each trait with the person who is high on it.**',
      pairs: BIG_FIVE_CASES,
      explain: `
        Curious, careful, sociable, trusting, prone to worry: each habit is the high end of one scale. Scores are reasonably stable from year to year and predict real things, modestly: conscientiousness, for example, goes with better results at school and work.

        They also shift slowly with age. On average, people become a little more conscientious, more agreeable and less prone to worry as they move through adult life.
      `,
    },
    {
      id: 'situation',
      type: 'fill',
      title: 'The person and the situation',
      text: `
        In ${MISCHEL.year} Walter Mischel caused an upset by checking how well trait scores predict what people actually do. He found that a trait score says little about what a person does on **one particular occasion**. The reply came later: **averaged over many occasions**, the prediction is far better.

        **Apply both findings to someone who scores high on punctuality.**
      `,
      template: `
        Whether she is on time for one meeting next Tuesday is predicted only [[strongly|*weakly|perfectly]].

        How often she is on time over a whole year is predicted [[*quite well|not at all]].

        So a high score means she is on time [[always|*more often than most people|never]].
      `,
      explain: `
        Any single act depends heavily on the situation, as lesson 7 showed. Traits show up as **tendencies across many situations**. Both sides of the old "person or situation" argument turned out to be right about something.
      `,
    },
    {
      id: 'binet',
      type: 'choice',
      title: 'The first intelligence test',
      text: `
        Paris, ${IQ.binet}. All French children now have to go to school, and the government has turned to the psychologist **Alfred Binet** for a tool. His test sets children everyday tasks (naming objects, repeating numbers, explaining a picture) to see who is falling behind others of the same age. Binet warns against treating the score as a measure of something fixed, and designs exercises to improve it.

        **So what was his test designed to do?**
      `,
      figure: photo(MEDIA.binet, {
        alt: 'A black-and-white portrait of a man with short hair, a beard and a moustache, wearing pince-nez glasses, a dark jacket and a bow tie.',
        caption: 'Alfred Binet (1857-1911)', maxWidth: 260,
      }),
      columns: 1,
      options: [
        { text: 'Find the children who needed extra help at school', correct: true },
        { text: 'Rank all children by their inborn ability', why: 'Binet rejected this reading. He insisted that his scale did not measure a fixed, inborn quantity, and nobody designs exercises to improve something fixed.' },
        { text: 'Pick out the cleverest children for the best schools', why: 'It was built for the opposite end: to notice children who were struggling, so that they could be taught differently.' },
      ],
      explain: `
        The test looked for children who were falling behind, **so that they could be helped**.

        Hold on to that purpose. It was soon forgotten.
      `,
    },
    {
      id: 'bell',
      type: 'interact',
      title: 'What an IQ score is',
      text: `
        A modern IQ score is not an amount of anything. It says **where a person stands compared with others of the same age**. The average is set at ${IQ.mean}, and the scale is stretched so that scores spread out in the bell shape shown.

        **Set the two limits to 85 and 115.** What share of people falls between them?
      `,
      widget: {
        type: 'plot', height: 300, x: [40, 160], y: [0, 0.03], xStep: 10, yStep: 0.01, xLabel: 'IQ score', tickLabels: true, grid: false,
        params: {
          a: { min: 40, max: 160, step: 5, value: 70, label: 'lower limit', color: 'violet' },
          b: { min: 40, max: 160, step: 5, value: 100, label: 'upper limit', color: 'violet' },
        },
        fns: [{ expr: '0.026596*exp(-((x-100)/15)^2/2)', color: 'ink' }],
        areas: [{ fn: 0, from: 'a', to: 'b', color: 'violet' }],
        readouts: [{ label: 'share of people between the limits (%)', expr: '100*abs(I0(a, b))', digits: 0 }],
        alt: 'A bell-shaped curve of IQ scores centred on 100. Two sliders set a lower and an upper limit, and the area between them is shaded.',
      },
      target: { a: 85, b: 115 },
      solution: { a: 85, b: 115 },
      hints: ['Move the lower limit to 85 and the upper limit to 115, then read the percentage.'],
      explain: `
        **About ${IQ.within1}%.** Roughly two people in three score between 85 and 115.

        Scores on very different mental tests tend to rise and fall together, which is why one summary number is possible at all (Charles Spearman noticed this in ${IQ.spearman}). The score predicts school results moderately well and some kinds of job performance. It does not measure creativity, wisdom, kindness or character.
      `,
    },
    {
      id: 'teach-bell',
      type: 'info',
      title: 'One standard deviation',
      text: `
        The spread of the scale is fixed by design. Its yardstick is the **standard deviation**: for IQ, ${IQ.sd} points. About ${IQ.within1}% of people score within **one** standard deviation of the average (85 to 115), and about ${IQ.within2}% within **two** (70 to 130). Only about ${Math.round(IQ.above130)} in 100 score above 130.

        :::example
        A test is scaled to an average of 200 with a standard deviation of 20. What share scores **above 220**?

        - 220 is one standard deviation above the average, so about 68% score between 180 and 220.
        - That leaves 32% outside, split evenly between the two tails.
        - So about **16%** score above 220.
        :::
      `,
      figure: {
        type: 'plot', height: 280, x: [40, 160], y: [0, 0.03], xStep: 10, yStep: 0.01, xLabel: 'IQ score', tickLabels: true, grid: false,
        fns: [{ expr: '0.026596*exp(-((x-100)/15)^2/2)', color: 'ink' }],
        areas: [{ fn: 0, from: 70, to: 130, color: 'gray' }, { fn: 0, from: 85, to: 115, color: 'violet' }],
        vlines: [{ x: 85, dashed: true }, { x: 115, dashed: true }],
        labels: [{ x: 91, y: 0.011, text: `about ${IQ.within1}%` }, { x: 72, y: 0.0285, text: `about ${IQ.within2}% from 70 to 130` }, { x: 75, y: 0.019, text: '85' }, { x: 117, y: 0.019, text: '115' }],
        alt: `A bell-shaped curve of IQ scores centred on 100. The band from 85 to 115 is shaded and labelled about ${IQ.within1} percent; the wider band from 70 to 130 is shaded more lightly and labelled about ${IQ.within2} percent.`,
      },
    },
    {
      id: 'iq-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const sc = rng.pick(SCALES);
        const rg = rng.pick(REGIONS);
        const lo = sc.mean - rg.k * sc.sd;
        const hi = sc.mean + rg.k * sc.sd;
        const where = rg.where === 'between' ? `between ${lo} and ${hi}` : rg.where === 'above' ? `above ${hi}` : `below ${lo}`;
        const inside = rg.k === 1 ? 68 : 95;
        return {
          text: `
            ${sc.name} are scaled to an average of **${sc.mean}** with a standard deviation of **${sc.sd}**, and follow a bell curve. In any bell curve, about 68% of people are within one standard deviation of the average, and about 95% within two.

            **About what percentage of people score ${where}?**
          `,
          answer: rg.answer,
          unit: '%',
          tolerance: 0.5,
          wrong: rg.both ? [[rg.both, `${rg.both}% is everyone outside ${lo} to ${hi}, on both sides. The curve is symmetrical, so half of them are ${rg.where} it.`]] : [],
          hints: [`How many standard deviations from ${sc.mean} is ${rg.where === 'below' ? lo : hi}?`, rg.where === 'between' ? 'That range is the average plus and minus that many standard deviations.' : `About ${inside}% are inside ${lo} to ${hi}. The rest are split evenly between the two tails.`],
          explain: rg.where === 'between'
            ? `${lo} to ${hi} is the average plus and minus ${rg.k === 1 ? 'one standard deviation' : 'two standard deviations'} (${rg.k} × ${sc.sd}), so about ${rg.answer}% of people fall inside it.`
            : `About ${inside}% score between ${lo} and ${hi}, leaving ${100 - inside}% outside. The curve is symmetrical, so half of those, about ${rg.answer}%, are ${rg.where} ${rg.where === 'above' ? hi : lo}.`,
        };
      },
    },
    {
      id: 'flynn',
      type: 'numeric',
      title: 'The rising tide',
      gen: (rng) => {
        const decades = rng.int(2, 5);
        const gain = FLYNN.perDecade * decades;
        return {
          text: `
            Through much of the twentieth century, average performance on IQ tests rose by about **${FLYNN.perDecade} points per decade** (the "Flynn effect"). Tests are regularly re-scaled so that the current average stays at 100.

            Someone scores exactly 100 against today's scale. They then take a test whose scale was set **${decades} decades ago**. **About what do they score on it?**

            (Against a scale only one decade old, the same person would score about 103: the average of that time was 3 points lower.)
          `,
          answer: 100 + gain,
          wrong: [[100 - gain, 'The other way round: people of the past did less well on these tests, so against their scale an average person of today looks above average.']],
          hints: [`How many points did the average rise in ${decades} decades?`],
          explain: `${decades} × ${FLYNN.perDecade} = ${gain} points, so about **${100 + gain}**. Genes cannot change that fast: the rise shows how strongly test performance depends on **surroundings** such as schooling, nutrition, health and practice with abstract thinking. In some countries the rise has since stalled or reversed. In Norway the fall shows up even between brothers in the same family, which again points to environment (${FLYNN.reversalYear}).`,
        };
      },
    },
    {
      id: 'between-groups',
      type: 'choice',
      review: true,
      title: 'Two trays of seeds',
      text: `
        Take a bag of mixed seeds and plant half in rich soil and half in poor soil. **Within** each tray, the plants differ in height almost entirely because of their genes: heritability is high in both. The rich-soil tray is much taller on average.

        **What does the difference between the two trays show?**
      `,
      columns: 1,
      options: [
        { text: 'Nothing about genes: here it comes entirely from the soil, although heritability within each tray is high', correct: true },
        { text: 'That the rich-soil seeds had better genes, because height is highly heritable', why: 'Both trays were filled from the same bag. High heritability inside each tray tells you nothing about why the trays differ from each other.' },
        { text: 'That heritability must really be low', why: 'Within each tray it is high. A trait can be highly heritable within groups while the gap between groups is wholly environmental.' },
      ],
      explain: `
        Heritability describes differences **within** one group living in its conditions. It cannot explain a difference **between** groups living in different conditions, and it says nothing about what would change if conditions changed.

        The same goes for test scores. In twin studies their heritability rises with age (about ${IQ_HERITABILITY[0][1]}% at age ${IQ_HERITABILITY[0][0]}, about ${IQ_HERITABILITY[2][1]}% at ${IQ_HERITABILITY[2][0]}), and that figure still tells us nothing about average differences between groups of people, which are in any case far smaller than the differences among individuals inside any group.
      `,
    },
    {
      id: 'misuse',
      type: 'choice',
      tone: 'sober',
      title: 'What the tests were used for',
      text: `
        Binet's test was soon put to uses he had warned against. In the early twentieth century the **eugenics** movement treated low scores as proof of inherited inferiority. Its supporters used test results to argue for the quotas of the United States Immigration Act of ${EUGENICS.immigrationAct}, and for laws under which more than ${thousands(EUGENICS.usSterilised)} people in the United States were sterilised without their consent (upheld by the Supreme Court in ${EUGENICS.buckVBell}). A German law of ${EUGENICS.germanLaw} that drew on these led to about ${thousands(EUGENICS.germanSterilised)} forced sterilisations.

        **What was the basic scientific error?**
      `,
      columns: 1,
      options: [
        { text: 'Treating a test score as a fixed, inherited measure of a person\'s worth', correct: true },
        { text: 'Using tests that were too short to be reliable', why: 'Longer tests would not have helped. The fault lay in what the scores were taken to mean.' },
        { text: 'Testing adults with questions written for children', why: 'That happened too, but it was not the root of the harm. The root was the belief about what a score reveals.' },
      ],
      explain: `
        A score records how someone did on particular tasks on a particular day. It reflects schooling, language, health and familiarity with tests as well as ability, and it says nothing about a person's value or rights. Many of the people tested had little schooling or were examined in a language they barely knew.

        This history is why psychologists today are careful about what tests are used for, and why the two questions from the rulers matter outside the laboratory: is it reliable, and is it valid **for this use**?
      `,
    },
    {
      id: 'teach-weigh',
      type: 'info',
      title: 'Three popular ideas, tested',
      text: `
        Types, traits and IQ you have met. Three more ideas about people are widely sold, and each has been put to the test.

        - **Growth mindset.** Teaching pupils that ability can grow does help, a little. In a study of ${thousands(MINDSET.students)} students in the United States (${MINDSET.year}), a short online course raised the grades of lower-achieving students by about a tenth of a grade point.
        - **"Grit"**, or sticking at long-term goals, is offered as a newly found key to success. It predicts a little, and overlaps very strongly with conscientiousness, which was already known.
        - **"Multiple intelligences"**: the idea that there are eight or so separate ones. Abilities that are supposed to be separate turn out to be correlated, and no good tests of the separate intelligences exist.

        Small, real effects are normal in psychology.
      `,
    },
    {
      id: 'weigh',
      type: 'bucket',
      title: 'Popular ideas, weighed',
      text: 'You now have the tools to weigh claims about people. **Sort these by how well the evidence supports them.**',
      buckets: ['Well supported', 'Real, but smaller than claimed', 'Little or no good evidence'],
      items: WEIGHED.map((w) => ({ text: w.text, bucket: w.bucket, why: w.why })),
      explain: `
        The Big Five and the link between IQ scores and school results have been found again and again. Mindset and "grit" are real and small. Personality types, separate "intelligences" and star signs are popular and poorly supported.

        Be most careful with ideas that are simple, flattering and sold with confidence.
      `,
    },
    {
      id: 'weird',
      type: 'slider',
      mode: 'predict',
      title: 'One last question about evidence',
      text: `
        Throughout this course the question has been "how do we know?". Here is a final check on the evidence itself.

        A survey of leading psychology journals counted where the participants in their studies lived. **What percentage came from Western, industrialised countries**, which hold about ${WEIRD.worldShare}% of the world's people?
      `,
      min: 0, max: 100, step: 1, answer: WEIRD.westernPct, tolerance: 6, start: 50, unit: '%',
      explain: `
        **${WEIRD.westernPct}%**, and ${WEIRD.usPct}% from the United States alone, most of them students. Researchers call such samples **WEIRD**: Western, Educated, Industrialised, Rich and Democratic (${WEIRD.year}). Some findings travel well. Others do not: even the Müller-Lyer illusion from lesson 2 is weaker in some societies. Psychology is now testing its classics in far more places.

        :::tip Optional, this week
        When a quiz, an app or an article offers to tell you what kind of person you are, ask the ruler questions. Would I get the same result next month? What does it predict? And would this description fit almost anyone?
        :::
      `,
    },
  ],
  recap: [
    'A good measure is reliable (it repeats) and valid (it measures what it claims). Vague, flattering profiles feel accurate to almost everyone.',
    'Personality is better described by positions on continuous traits than by types.',
    'An IQ score is a position on a bell curve (average 100, standard deviation 15); it predicts some things moderately and has a history of misuse.',
    'Heritability within a group says nothing about differences between groups, or about what can change.',
  ],
  next: 'That completes the course. You have taken part in a dozen classic experiments and seen which famous findings stood up. Keep asking the question that runs through all of it: how do we know?',
};
