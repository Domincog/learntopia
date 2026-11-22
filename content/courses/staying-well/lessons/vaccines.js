// Staying Well: Prevention and Everyday Medicine · Lesson 2 · Training the Immune System
//
// Driving question: how can a vaccine protect someone who never received it?
// Sources for the facts are noted in ../helpers.js.
import { r, num } from '../../../kit.js';
import { R0, MEASLES, AUTISM_CLAIM, VACCINE_HISTORY as HIST, VACCINE_TYPES, herdThreshold, pctText, thousands } from '../helpers.js';

const town = (extra) => ({ type: 'outbreak-sim', vaccinatedRange: [0, 0.95, 0.05], labels: { vaccinated: 'vaccinated' }, ...extra });

// Antibody level after a first meeting with a germ (day 0) and a second (day 40): slow and low, then fast and high.
const RESIDUAL = 12 * (40 / 12) * Math.exp(1 - 40 / 12);
const MEMORY = {
  type: 'plot', height: 300, x: [0, 70], y: [0, 110], xStep: 10, yStep: 20, xLabel: 'days', yLabel: 'antibodies in the blood', tickLabels: true,
  fns: [
    { expr: '12*(x/12)*exp(1 - x/12)', color: 'blue', from: 0, to: 40 },
    { expr: `${RESIDUAL.toFixed(3)} + 92*((x-40)/6)*exp(1 - (x-40)/6)`, color: 'orange', from: 40, to: 70 },
  ],
  vlines: [{ x: 40, dashed: true }],
  labels: [{ x: 14, y: 24, text: 'first meeting' }, { x: 51, y: 92, text: 'second meeting' }],
  alt: 'A graph of antibody level against time. After a first meeting with a germ on day 0 the level rises slowly to a low peak after about 12 days and fades. After a second meeting on day 40 it shoots up within about 6 days to a peak around eight times higher.',
};

const DISEASES = ['a new respiratory virus', 'an infection spreading through schools', 'a virus carried by travellers', 'a stomach bug in a refugee camp', 'an imaginary illness called river fever'];

export default {
  id: 'vaccines',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Protected by your neighbours',
      text: `
        A baby is too young for the measles vaccine. Her parents can still protect her, as long as enough of the people **around** her are immune.

        Measles is the most contagious disease we know: in a town with no immunity, one case infects about 15 others. **What share of the town must be immune before measles can no longer spread there?**
      `,
      min: 0, max: 100, step: 1, answer: 93, tolerance: 3, start: 50, unit: '%',
      explain: `
        About **93%**, and because no vaccine works for everyone, health agencies aim for ${MEASLES.target}%.

        It is a strange idea: an injection in one arm protecting a baby down the street. By the end of this lesson you will be able to work that number out, and say why it is so high for measles and far lower for flu.
      `,
    },
    {
      id: 'teach-memory',
      type: 'info',
      title: 'Remembering a germ',
      text: `
        In *The Body II* you saw what the immune system does with a germ it has met before. The graph shows it again.

        - The **first meeting** is slow and weak. It takes days to find the few cells that fit this germ and multiply them, and meanwhile the person is ill.
        - Those cells leave **memory cells** behind. At a **second meeting** they answer within days and far more strongly, usually before the person feels anything.

        The memory is specific. It recognises the molecular shapes of that one germ, and of any germ that carries almost the same shapes.
      `,
      figure: MEMORY,
    },
    {
      id: 'jenner',
      type: 'choice',
      title: 'The milkmaids\' secret',
      text: `
        In the 1700s smallpox killed about three of every ten people who caught it. Country people knew that milkmaids who had caught **cowpox**, a mild disease of cattle, seemed never to get smallpox.

        In ${HIST.jenner} the English doctor **Edward Jenner** scratched fluid from a cowpox blister into the arm of a boy, James Phipps. Later, exposed to smallpox, the boy stayed well.

        **Why did it work?**
      `,
      columns: 1,
      options: [
        { text: 'The cowpox virus looks enough like the smallpox virus for the immune system\'s memory of one to recognise the other', correct: true },
        { text: 'Cowpox stays in the blood and kills smallpox viruses when they arrive', why: 'The cowpox infection is cleared within weeks. What stays behind is the immune system\'s memory of it.' },
        { text: 'Cowpox uses up the cells that smallpox needs', why: 'The skin cells grow back. Protection lasts for years because memory cells stand ready, as you saw in *The Body II*.' },
        { text: 'Catching any mild illness makes the body stronger in general', why: 'Immune memory is specific. Cowpox protects against smallpox because the two viruses are close relatives, and it does nothing against measles or flu.' },
      ],
      explain: `
        The two viruses are close cousins. An immune system that has beaten cowpox keeps **memory cells** that also recognise smallpox, and destroys it before it takes hold.

        *Vacca* is Latin for cow: this was the first **vaccine**. (An experiment like Jenner's on a child would never be allowed today. Modern vaccines are tested in the careful stages you will meet below.)
      `,
    },
    {
      id: 'memory',
      type: 'choice',
      review: true,
      title: 'A rehearsal',
      text: `
        The graph shows what the immune system does when it meets a germ for the **first** time, and what it does when the same germ comes back.

        A vaccine shows the immune system a harmless version or a piece of a germ. **When a vaccinated person later meets the real germ, which response do they mount?**
      `,
      figure: MEMORY,
      columns: 1,
      options: [
        { text: 'The second: faster and far stronger, because memory cells are already waiting', correct: true },
        { text: 'The first: slow and weak, because the real germ is new to them', why: 'To the immune system the real germ is not new. The vaccine carried the same molecular shapes, and memory cells were made against them.' },
        { text: 'None: the antibodies from the vaccine are still there and do all the work', why: 'Some antibodies do stay, but their levels fall over months and years. The lasting protection is the memory cells, which make fresh antibodies at speed when the germ appears.' },
      ],
      explain: `
        A vaccine is a **rehearsal**. The slow first response happens against something that cannot cause the disease, so the real germ meets the fast second response and is usually beaten before you feel ill.

        Feeling tired or feverish for a day after a vaccination is that first response at work.
      `,
    },
    {
      id: 'teach-types',
      type: 'info',
      title: 'What is in the syringe',
      text: `
        Vaccines differ in what they show the immune system. There are four main kinds.

        | Kind of vaccine | What it contains |
        |---|---|
        ${VACCINE_TYPES.map((t) => `| **${t.kind}** | ${t.gives} |`).join('\n        ')}

        All four teach the same lesson: "this shape means danger". None of the last three can cause the infection, because no whole living germ is in them.
      `,
    },
    {
      id: 'types',
      type: 'match',
      title: 'What is in the syringe',
      text: 'Vaccines differ in what they show the immune system. **Match each kind with what it contains.**',
      pairs: VACCINE_TYPES.map((t) => [t.kind, t.gives]),
      explain: `
        Each kind has familiar examples.

        | Kind | Examples |
        |---|---|
        ${VACCINE_TYPES.map((t) => `| ${t.kind} | ${t.examples} |`).join('\n        ')}
      `,
    },
    {
      id: 'herd-explore',
      type: 'interact',
      graded: false,
      title: 'Vaccinate the town',
      text: `
        Back to the town of 300. This infection has **R₀ = 4**: one case infects four others when nobody is immune. Blue squares are vaccinated people.

        Run three outbreaks: with **nobody** vaccinated, with **half** the town, and with **80%**. Each time, read what happened to the people who were *not* vaccinated.
      `,
      widget: town({ r0: 4, alt: 'A town of 300 dots and a bar chart of new cases in each round. A slider sets what share of the town is vaccinated.' }),
      check: (s) => {
        const runs = s.history;
        const none = runs.some((run) => run.vaccinated === 0);
        const some = runs.some((run) => run.vaccinated > 0 && run.re > 1);
        const enough = runs.some((run) => run.re <= 1);
        if (none && some && enough) return true;
        if (!runs.length) return 'Press **Start the outbreak** with nobody vaccinated first.';
        if (!none) return 'Run one outbreak with the slider at 0%, to see what the infection does unopposed.';
        if (!some) return 'Now vaccinate half the town (50%) and run it again.';
        return 'Now vaccinate 80% of the town and run it again.';
      },
      solution: { vaccinated: 0.8, history: [{ vaccinated: 0 }, { vaccinated: 0.5 }] },
      explain: `
        With nobody vaccinated, almost everyone catches it. At 50% the outbreak is smaller, but most unvaccinated people still fall ill. At 80% the chains break after a few steps, and most of the **unvaccinated** people escape too.

        That indirect protection is called **herd immunity**. It shields the people a vaccine cannot: newborn babies, and people whose immune systems are weakened by illness or by treatments such as chemotherapy.
      `,
    },
    {
      id: 'threshold-find',
      type: 'interact',
      attempts: 6,
      title: 'Where is the tipping point?',
      text: `
        A different infection, with **R₀ = 5**.

        **Find the lowest level of vaccination at which one case infects no more than one other**, and run an outbreak there.
      `,
      widget: town({ r0: 5, alt: 'A town of 300 dots and a bar chart of new cases in each round. A slider sets what share of the town is vaccinated.' }),
      check: (s) => {
        if (s.re > 1) return `With ${num(s.vaccinated * 100)}% vaccinated, one case still infects ${num(s.re, 2)} others. That is more than 1, so outbreaks grow. Vaccinate more.`;
        if (s.vaccinated > 0.8) return `That works, with room to spare: one case infects only ${num(s.re, 2)}. Find the **lowest** level that brings the number down to 1.`;
        return s.ran || 'That is the level. Press **Start the outbreak** to see it.';
      },
      solution: { vaccinated: 0.8 },
      hints: ['Watch the readout "one case now infects" as you drag the slider.', 'Out of 5 people a case would have infected, 4 must already be immune.'],
      explain: r`
        At **80%**, four of every five people a case meets are immune, so it infects $5 \times \tfrac{1}{5} = 1$ person. The infection can no longer grow.

        Below 80%, each case still more than replaces itself. The tipping point is sharp.
      `,
    },
    {
      id: 'threshold-name',
      type: 'info',
      title: 'The herd-immunity threshold',
      text: r`
        If a share $v$ of the people are immune, one case infects $R_0 \times (1 - v)$ others. Outbreaks stop growing when that is 1 or less:

        $$ v \;\ge\; 1 - \frac{1}{R_0} $$

        | $R_0$ | 3 | 5 | 6 | 12 | 15 |
        |---|:-:|:-:|:-:|:-:|:-:|
        | Immune share needed | 67% | 80% | 83% | 92% | 93% |

        Measles, with $R_0$ of ${R0.measles.low} to ${R0.measles.high}, needs 92 to 94%. Two doses of its vaccine protect about ${MEASLES.twoDoses} people in 100, so coverage has to be higher still: the World Health Organization asks for ${MEASLES.target}%.

        :::note
        The formula assumes people mix evenly, and the model town treated every vaccinated person as immune. A town at 95% overall can still have a school at 70%, and that is where outbreaks start.
        :::
      `,
    },
    {
      id: 'example-threshold',
      type: 'info',
      title: 'The formula at work',
      text: r`
        :::example Worked example: an infection with $R_0 = 1.25$, about that of seasonal flu
        1. **The threshold.** $1 - \frac{1}{1.25} = 1 - 0.8 = 0.2$, so **20%** must be immune.
        2. **Is 10% immune enough?** Then 90% of the people a case meets can still be infected: $1.25 \times 0.9 = 1.125$. More than 1, so outbreaks keep growing.
        3. **And 30%?** $1.25 \times 0.7 = 0.875$. Less than 1, so outbreaks die out.
        :::

        The curve shows the threshold for every $R_0$. It climbs steeply at first and then flattens: the more contagious the germ, the closer to everyone the immune share has to be.
      `,
      figure: {
        type: 'plot', height: 280, x: [0, 20], y: [0, 100], xStep: 5, yStep: 20, xLabel: 'R₀', yLabel: 'immune share needed (%)', tickLabels: true,
        fns: [{ expr: '100*(1 - 1/x)', color: 'blue', from: 1, to: 20 }],
        points: [{ id: 'F', x: 1.25, y: 20, color: 'orange', label: '20%' }, { id: 'M', x: 15, y: 93.3, color: 'red', label: 'measles: 93%' }],
        alt: 'A curve of the immune share needed against R nought. It starts at zero when R nought is 1, passes 20% at 1.25 and 80% at 5, and flattens out above 90%: measles, at about 15, needs 93%.',
      },
    },
    {
      id: 'threshold-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        // none of these is in the table on `threshold-name` (3, 5, 6, 12, 15), so the answer is worked out, not looked up
        const r0 = rng.pick([2, 2.5, 4, 8, 10, 20]);
        const answer = Math.round(herdThreshold(r0) * 1000) / 10;
        const what = rng.pick(DISEASES);
        return {
          text: r`
            Health officials are tracking ${what}. They estimate that one case infects **${num(r0)}** others when nobody is immune ($R_0 = ${num(r0)}$).

            **What share of the population must be immune to stop outbreaks from growing?**
          `,
          answer,
          unit: '%',
          tolerance: 0.05,
          wrong: [
            ...(r0 !== 2 ? [[Math.round(1000 / r0) / 10, r`That is $\frac{1}{R_0}$: the share that can be left **without** immunity. The rest must be immune.`]] : []),
            [r0 * 10, r`$R_0$ counts the people infected by one case. It is not a percentage. Use $1 - \frac{1}{R_0}$.`],
          ],
          hints: [
            `Of the ${num(r0)} people one case would infect, all but 1 must already be immune.`,
            r`$1 - \frac{1}{${num(r0)}}$, as a percentage.`,
          ],
          explain: r`$1 - \frac{1}{${num(r0)}} = ${num(herdThreshold(r0), 3)}$, so **${num(answer)}%** must be immune. Then each case meets only enough susceptible people to infect one of them: $${num(r0)} \times ${num(1 / r0, 3)} = 1$.`,
        };
      },
    },
    {
      id: 'enough',
      type: 'fill',
      gen: (rng) => {
        const [r0, v] = rng.pick([[6, 50], [6, 90], [4, 60], [4, 80], [8, 75], [8, 90], [10, 80], [10, 95], [5, 70], [5, 90], [2, 40], [2, 60], [3, 50], [3, 70]]);
        const re = Math.round(r0 * (100 - v)) / 100;
        const grows = re > 1;
        const options = rng.bool() ? `${grows ? '*' : ''}keep growing|${grows ? '' : '*'}die out` : `${grows ? '' : '*'}die out|${grows ? '*' : ''}keep growing`;
        const place = rng.pick(['On an island', 'In a city', 'In a boarding school', 'In a mountain valley']);
        return {
          text: r`${place}, **${v}%** of the people are immune to an infection with $R_0 = ${r0}$. Work out what one case does there.`,
          template: `One case infects [[${num(re)}]] people on average, so outbreaks [[${options}]].`,
          hints: [`${v}% are immune, so ${100 - v}% of the people a case meets can still be infected.`, r`$${r0} \times ${num((100 - v) / 100)}$`],
          explain: r`$${r0} \times ${num((100 - v) / 100)} = ${num(re)}$. That is ${grows ? 'more' : 'less'} than 1, so each round of cases is ${grows ? 'bigger' : 'smaller'} than the last. The threshold for $R_0 = ${r0}$ is ${pctText(herdThreshold(r0))}${grows ? `, and ${v}% falls short of it` : `, and ${v}% is above it`}.`,
        };
      },
    },
    {
      id: 'tested',
      type: 'order',
      title: 'How a vaccine earns its licence',
      text: 'A vaccine is given to healthy people, so the bar for safety is high. It is tested in stages. Each stage involves more people than the one before, and the vaccine goes on to the next only if it passes. **Put the stages of testing in order.**',
      items: [
        'Laboratory and animal studies',
        'Phase 1: a few dozen volunteers. Is it safe? What dose?',
        'Phase 2: hundreds of volunteers. Does the immune system respond?',
        'Phase 3: thousands, half given a comparison injection at random. Does it prevent the disease?',
        'Independent regulators examine all the data',
        'Monitoring continues while millions receive it',
      ],
      labels: ['First', 'Last'],
      explain: `
        From no people at all, to dozens, hundreds, thousands and then millions. A trial of 30,000 people can detect side effects that affect 1 person in a few thousand.

        Rarer ones can only show up once millions are vaccinated, which is why the last stage never ends: doctors and the public report suspected reactions, and health agencies compare rates of illness in vaccinated and unvaccinated people.
      `,
    },
    {
      id: 'risks',
      type: 'order',
      tone: 'sober',
      title: 'Honest numbers',
      text: `
        Vaccines have side effects. Most are mild and common: a sore arm, tiredness, a day of fever. Serious ones are real and rare.

        Here are four risks, as health agencies estimate them. **Order them from most likely to least likely.**
      `,
      items: [
        `Pneumonia, for a child who catches measles (about 1 in ${MEASLES.pneumoniaOneIn})`,
        `Swelling of the brain, for a child who catches measles (about 1 in ${thousands(MEASLES.encephalitisOneIn)})`,
        `A brief seizure brought on by fever, after a dose of measles vaccine (about 1 in ${thousands(MEASLES.febrileSeizureOneIn)})`,
        `A severe allergic reaction, after a dose of any vaccine (about 1 in ${thousands(MEASLES.severeAllergyOneIn)})`,
      ],
      labels: ['Most likely', 'Least likely'],
      explain: `
        "1 in ${MEASLES.pneumoniaOneIn}" is a far bigger risk than "1 in ${thousands(MEASLES.encephalitisOneIn)}": the larger the second number, the rarer the event. Measles also kills ${MEASLES.deathsPerThousand[0]} to ${MEASLES.deathsPerThousand[1]} of every 1,000 children who catch it. (A seizure brought on by fever is frightening to watch, but it passes and leaves no lasting harm.)

        Severe allergic reactions are why you are asked to wait a few minutes after a vaccination: staff are trained and equipped to treat them. The risks of the vaccine are real, and far smaller than the risks of the disease.
      `,
    },
    {
      id: 'autism-claim',
      type: 'choice',
      review: true,
      title: 'Testing a worry',
      text: `
        In ${AUTISM_CLAIM.year} a paper describing ${AUTISM_CLAIM.children} children, since withdrawn by its journal, suggested that the measles, mumps and rubella (MMR) vaccine might cause autism. The first signs of autism are often noticed in the second year of life, soon after the age at which MMR is given, so the idea seemed to fit what some parents had seen. But almost every child is vaccinated at that age: some would show their first signs soon after the injection whether or not it played any part.

        **What is the best way to find out whether the vaccine is the cause?**
      `,
      columns: 1,
      options: [
        { text: 'Compare the rate of autism in very large numbers of vaccinated and unvaccinated children', correct: true },
        { text: 'Collect more stories of children whose autism was noticed after the vaccine', why: 'Most children are vaccinated at that age, so many such stories are certain either way. Stories cannot tell coincidence from cause.' },
        { text: 'Ask parents whether they believe the vaccine was the cause', why: 'Their observations are real and deserve respect. But one thing following another does not show that it caused it; a comparison group is needed.' },
        { text: 'Check whether autism diagnoses have risen since the vaccine was introduced', why: 'Many things changed over those years, including how autism is defined and how carefully it is looked for. Two trends rising together do not show that one causes the other.' },
      ],
      explain: `
        That comparison has been made many times. The largest study followed ${thousands(AUTISM_CLAIM.danishChildren)} children in Denmark (published in ${AUTISM_CLAIM.danishYear}): autism was no more common in the vaccinated than in the unvaccinated, even among children with autistic siblings.

        The ${AUTISM_CLAIM.year} paper was withdrawn by its journal in ${AUTISM_CLAIM.retracted}, after a medical tribunal found that it had misdescribed its research, and its lead author lost his licence to practise. Wanting to protect a child is the best of reasons for asking the question. The answer, from millions of children, is that MMR does not cause autism.
      `,
    },
    {
      id: 'schedule',
      type: 'choice',
      title: 'Why then, and why again?',
      text: `
        Vaccines come on a timetable: some in the first months of life, some repeated, some for teenagers or older adults. The details differ between countries.

        A baby is born carrying antibodies passed on from the mother. They protect for the first months of life and then fade. The measles vaccine is a weakened live virus.

        In most countries the first measles dose is given at around 9 to 15 months of age. **Why not at birth?**
      `,
      columns: 1,
      options: [
        { text: 'Antibodies passed on from the mother would neutralise the weakened virus before the baby\'s own immune system could learn from it', correct: true },
        { text: 'A newborn cannot catch measles', why: 'Newborns can, and measles is most dangerous in the very young. For the first months they rely on their mother\'s antibodies and on the immunity of the people around them.' },
        { text: 'A baby\'s immune system does not work at all in the first year', why: 'It works from birth: several other vaccines are given in the first weeks and months. The timing of each one is set by evidence on when it works best.' },
      ],
      explain: `
        The vaccine is timed for when the mother's antibodies have gone, and until then the baby depends on herd immunity.

        Other timings have their own reasons. Several doses build a stronger and longer memory. Tetanus protection fades, so boosters are offered. Flu viruses change, so the flu vaccine is updated every year. A pharmacist, nurse or doctor can tell you what is recommended where you live.
      `,
    },
    {
      id: 'history',
      type: 'info',
      title: 'What vaccines have done',
      text: `
        **Tap the events** on the line. Then, if you like, one thing to do this week: find out where your own vaccination record is kept. Many adults have never seen theirs.
      `,
      figure: {
        type: 'timeline', from: 1780, to: 2030, step: 50, mode: 'explore',
        events: [
          { id: 'jenner', year: HIST.jenner, label: 'First vaccine', color: 'blue', note: `${HIST.jenner}: Edward Jenner uses cowpox to protect against smallpox.` },
          { id: 'salk', year: HIST.salk, label: 'Polio vaccine', color: 'teal', note: `${HIST.salk}: Jonas Salk's polio vaccine is licensed. Polio was paralysing hundreds of thousands of children a year.` },
          { id: 'smallpox', year: HIST.smallpoxEradicated, label: 'Smallpox gone', short: 'Smallpox', color: 'green', note: `${HIST.smallpoxEradicated}: smallpox is declared eradicated, three years after the last natural case. It had killed hundreds of millions of people in the 1900s alone. It is the only human disease ever wiped out.` },
          { id: 'polio', year: HIST.polioCampaign, label: 'Polio campaign', short: 'Polio drive', color: 'orange', note: `${HIST.polioCampaign}: a global campaign begins, with about ${thousands(HIST.polioCases1988)} polio cases a year. Today wild polio survives in two countries, ${HIST.polioEndemic.join(' and ')}, with fewer than 100 cases a year.` },
          { id: 'today', year: 2024, label: '154 million lives', short: 'Today', color: 'violet', note: `2024: the World Health Organization estimates that childhood vaccines have saved ${HIST.livesSaved} million lives in 50 years, most of them children under five.` },
        ],
        alt: 'A timeline from 1780 to 2030 with five events: the first vaccine in 1796, the polio vaccine in 1955, the eradication of smallpox in 1980, the start of the global polio campaign in 1988, and an estimate of lives saved, made in 2024.',
      },
      cta: 'Finish',
    },
  ],
  recap: [
    'A vaccine is a rehearsal: a harmless version or piece of a germ that leaves memory cells behind, so the real germ meets the fast, strong second response.',
    r`When enough people are immune, each case infects fewer than one other and outbreaks die out. The threshold is $1 - \frac{1}{R_0}$: 50% for $R_0 = 2$, about 95% in practice for measles.`,
    'That **herd immunity** protects people who cannot be vaccinated, such as newborn babies.',
    'Vaccines are tested in ever larger trials and watched for as long as they are used. Serious side effects exist and are rare; large studies have found no link between MMR and autism.',
  ],
  next: 'Next: the medicines in your cupboard. What can an antibiotic do, what can it not do, and how do you read the small print on the box?',
};
