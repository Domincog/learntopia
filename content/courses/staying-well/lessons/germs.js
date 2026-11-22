// Staying Well: Prevention and Everyday Medicine · Lesson 1 · Germs and How They Spread
//
// Driving question: how does an infection get from one person to the next, and what actually stops it?
// Sources for the facts are noted in ../helpers.js.
import { r, num } from '../../../kit.js';
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/staying-well/index.js';
import { MICROBES, ILLNESSES, SNOW, SEMMELWEIS, HANDWASH_SECONDS, FOOD, R0, INCUBATION, thousands } from '../helpers.js';

const KIND_OPTIONS = [['bacteria', 'A bacterium'], ['virus', 'A virus'], ['fungus', 'A fungus'], ['parasite', 'A parasite']];

// A red blood cell (7 µm across), a bacterium (2 µm long) and a virus (0.1 µm) drawn to one scale: 20 px per µm.
const SIZES = {
  type: 'svg', viewBox: '0 0 400 190', maxWidth: 460,
  alt: 'Three things drawn to the same scale. A red blood cell is a disc 7 micrometres across. A rod-shaped bacterium beside it is 2 micrometres long, less than a third of that. A virus is a dot one tenth of a micrometre across, barely visible.',
  content:
    '<circle class="fill-red-soft stroke-red" stroke-width="2.5" cx="96" cy="78" r="70"/>'
    + '<circle class="fill-none stroke-red" stroke-width="1.5" opacity="0.5" cx="96" cy="78" r="30"/>'
    + '<text class="fig-label" x="96" y="176" text-anchor="middle">red blood cell, 7 µm</text>'
    + '<rect class="fill-teal stroke-ink" stroke-width="2.5" x="280" y="26" width="40" height="18" rx="9"/>'
    + '<text class="fig-label" x="300" y="68" text-anchor="middle">bacterium, 2 µm</text>'
    + '<circle class="fill-violet" cx="300" cy="112" r="1.6"/>'
    + '<circle class="fill-none stroke-violet" stroke-width="1.5" stroke-dasharray="3 3" cx="300" cy="112" r="10"/>'
    + '<text class="fig-label" x="300" y="146" text-anchor="middle">virus, 0.1 µm</text>'
    + '<text class="fig-label-sm text-muted" x="300" y="164" text-anchor="middle">(the dot inside the ring)</text>',
};

// The illnesses of the practice question, grouped by the kind of germ behind them (same table as the generator).
const illnessesOf = (kind) => ILLNESSES.filter((i) => i.kind === kind)
  .map((i) => (i.name === 'COVID-19' ? i.name : i.name[0].toLowerCase() + i.name.slice(1))).join(', ');

const FOODS = ['a pan of cooked rice', 'a chicken stew', 'a tray of lasagne', 'a bowl of potato salad', 'a pot of lentil soup'];

export default {
  id: 'germs',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Friend or foe?',
      text: `
        > **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.

        Bacteria live on your skin, in your mouth and, by the trillion, in your gut.

        **Out of every 100 kinds of bacteria, how many do you think can make people ill?**
      `,
      min: 0, max: 100, step: 1, answer: 1, tolerance: 1, start: 50, unit: 'in 100',
      explain: `
        **Fewer than 1 in 100.** Most microbes ignore us, and many of the ones that live on us help: they digest fibre, make vitamins and crowd out harmful arrivals.

        This lesson is about the small minority that cause disease, the "germs". How do they get from one person to the next, and what actually stops them?
      `,
    },
    {
      id: 'kinds',
      type: 'info',
      title: 'Four kinds of germ',
      text: `
        | | What it is | Treated with |
        |---|---|---|
        | **${MICROBES.bacteria.plural}** | ${MICROBES.bacteria.what} | ${MICROBES.bacteria.treat} |
        | **${MICROBES.virus.plural}** | ${MICROBES.virus.what} | ${MICROBES.virus.treat} |
        | **${MICROBES.fungus.plural}** | ${MICROBES.fungus.what} | ${MICROBES.fungus.treat} |
        | **${MICROBES.parasite.plural}** | ${MICROBES.parasite.what} | ${MICROBES.parasite.treat} |

        A **micrometre** (µm) is a thousandth of a millimetre. A virus is not even a cell: it has to borrow one of yours to copy itself.
      `,
      figure: SIZES,
    },
    {
      id: 'teach-illnesses',
      type: 'info',
      title: 'Which germ, which illness',
      text: `
        The name of an illness rarely says what kind of germ is behind it. These are the infections this course keeps coming back to.

        | Kind of germ | Illnesses it causes |
        |---|---|
        | **${MICROBES.bacteria.plural}** | ${illnessesOf('bacteria')} |
        | **${MICROBES.virus.plural}** | ${illnessesOf('virus')} |
        | **${MICROBES.fungus.plural}** | ${illnessesOf('fungus')} |
        | **${MICROBES.parasite.plural}** | ${illnessesOf('parasite')} |

        The kind matters because it decides what can treat the illness. Antibiotics work against bacteria, and do nothing against a virus.
      `,
    },
    {
      id: 'which-kind',
      type: 'choice',
      review: true,
      shuffle: false,
      gen: (rng) => {
        const ill = rng.pick(ILLNESSES);
        const m = MICROBES[ill.kind];
        return {
          text: `**${ill.name}**: ${ill.clue}.\n\nWhat kind of germ causes it?`,
          options: KIND_OPTIONS.map(([kind, text]) => ({ text, correct: kind === ill.kind })),
          hints: ['Bacteria are living cells that antibiotics can kill. Viruses are far smaller and need your cells to copy themselves. Fungi include yeasts and moulds. Parasites are larger: single animal-like cells or worms.'],
          explain: `${ill.name} is caused by ${ill.agent}: a **${m.name}**. ${ill.kind === 'virus' ? 'Antibiotics do nothing against a virus.' : ill.kind === 'bacteria' ? 'Bacteria are the germs that antibiotics work against.' : `It is treated with ${m.treat}.`}`,
        };
      },
    },
    {
      id: 'teach-routes',
      type: 'info',
      title: 'Five ways to travel',
      text: `
        A germ has to get from one body into the next, and each has its favourite route. Five routes cover almost everything.

        | Route | An infection that mainly uses it |
        |---|---|
        | **Air**: coughs, sneezes, breath | flu |
        | **Hands and surfaces** | norovirus (a stomach bug) |
        | **Food and water** | cholera |
        | **Blood and sex** | hepatitis B |
        | **Insects** | malaria, by mosquito bite |

        Knowing the route tells you where to block it: clean water and sewers, bed nets against mosquitoes, condoms and sterile needles.
      `,
    },
    {
      id: 'routes',
      type: 'match',
      title: 'How germs travel',
      text: '**Match each infection with the way it mainly spreads.**',
      pairs: [
        ['Flu', 'Droplets and fine particles breathed, coughed or sneezed into the air'],
        ['Norovirus (a stomach bug)', 'Unwashed hands, and the surfaces and food they touch'],
        ['Cholera', 'Drinking water contaminated by sewage'],
        ['Malaria', 'The bite of an infected mosquito'],
        ['Hepatitis B', 'Blood and sex'],
      ],
      explain: 'The five routes again: **air**, **hands and surfaces**, **food and water**, **blood and sex**, and **insects**. Each one is a place where the germ can be stopped. In 1854, nobody knew the route for cholera.',
    },
    {
      id: 'snow-map',
      type: 'interact',
      tone: 'sober',
      title: 'London, 1854',
      text: `
        In ten days, cholera kills hundreds of people in one small neighbourhood of London. Doctors blame "bad air". A physician, **John Snow**, suspects the water, and marks every death on a street map: **one black bar for each person who died**, at the house where they lived.

        People fetched their water from street pumps. Seven are ringed. **Tap the pump you would close.**
      `,
      widget: photo(MEDIA['snow-map'], {
        alt: 'A street map of part of Soho, London, from 1854. Short black bars are stacked along the streets, one for each death from cholera. They are thickest around one pump in the middle of the map, on Broad Street, and thin out in every direction. Six other pumps stand in streets with few or no bars.',
        caption: 'Part of John Snow\'s map, published in 1855',
        creditLabel: 'Map',
        maxWidth: 720,
        hotspots: [
          { id: 'mews', x: 0.119, y: 0.131, r: 0.05, label: 'Marlborough Mews pump', alt: 'a pump near the top left corner, with no bars near it' },
          { id: 'argyll', x: 0.127, y: 0.343, r: 0.05, label: 'Little Marlborough Street pump', alt: 'a pump on the left, with a few bars some streets away' },
          { id: 'broad', x: 0.426, y: 0.452, r: 0.05, label: 'Broad Street pump', alt: 'a pump in the middle of the map, with bars stacked thickly all round it' },
          { id: 'warwick', x: 0.2625, y: 0.875, r: 0.05, label: 'Warwick Street pump', alt: 'a pump at the lower left, with almost no bars near it' },
          { id: 'bridle', x: 0.497, y: 0.831, r: 0.05, label: 'Bridle Street pump', alt: 'a pump near the bottom, with a few bars a street or two to the north' },
          { id: 'rupert', x: 0.734, y: 0.709, r: 0.05, label: 'Rupert Street pump', alt: 'a pump at the lower right, with a few bars to its north-west' },
          { id: 'dean', x: 0.937, y: 0.666, r: 0.05, label: 'Dean Street pump', alt: 'a pump at the right edge, with no bars near it' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'broad') return true;
        if (!s.picked) return 'Tap one of the seven ringed pumps.';
        return 'Few people died near that one. Look for the pump with the black bars stacked thickest around it.';
      },
      solution: { picked: 'broad' },
      hints: ['The deaths are not spread evenly. Find where the bars pile up, and then the pump nearest to that spot.'],
      explain: `
        The bars crowd around the pump in **Broad Street** and thin out with every step away from it. More than ${Math.floor(SNOW.deaths / 100) * 100} people died.

        Snow took his evidence to the local officials, and on ${SNOW.handleRemoved} they had the pump's handle removed. A leaking cesspit was later found a metre from its well.
      `,
    },
    {
      id: 'snow-evidence',
      type: 'choice',
      tone: 'sober',
      title: 'The people who were spared',
      text: `
        Two places close to the pump puzzled everyone. The **workhouse** had ${SNOW.workhouseInmates} inmates, and only ${SNOW.workhouseDeaths} died. The **brewery** had about ${SNOW.breweryWorkers} workers, and none died.

        Snow asked questions. The workhouse had its own well. The brewery had one too, and its men mostly drank beer.

        **Why do these exceptions make Snow's case stronger?**
      `,
      columns: 1,
      options: [
        { text: 'They breathed the same air as their neighbours, but did not drink from the pump', correct: true },
        { text: 'They show that beer protects against cholera', why: 'The workhouse inmates were spared too, and they drank well water. What the two groups share is that neither used the Broad Street pump.' },
        { text: 'They show that cholera cannot pass from person to person', why: 'Cholera does pass on, through water and food contaminated by the waste of people who have it. The exceptions point to which water.' },
        { text: 'They show the deaths were a matter of chance', why: 'Chance would not spare two whole buildings in the middle of the worst-hit streets. A pattern with exceptions that fit the explanation is strong evidence.' },
      ],
      explain: `
        If bad air caused cholera, the workhouse and the brewery should have suffered like the houses around them. They shared the air and not the water.

        Snow never saw the germ. He found the **route** by comparing who fell ill with who did not, which is how outbreaks are still traced today. Germs themselves were shown to cause disease a few decades later, by Louis Pasteur and Robert Koch.
      `,
    },
    {
      id: 'chain',
      type: 'interact',
      graded: false,
      title: 'One case, then how many?',
      text: `
        Here is a town of 300 people. Three of them arrive with a new infection, and nobody is immune.

        Each infectious person passes it on to **2** others on average, then recovers. **Start the outbreak** and watch the new cases round by round.

        Then drag the slider **below 1** and run it again.
      `,
      widget: {
        type: 'outbreak-sim', r0: 2, r0Range: [0.5, 4, 0.5],
        alt: 'A town of 300 dots and a bar chart of new cases in each round. A slider sets how many people one case infects.',
      },
      check: (s) => {
        const above = s.history.some((run) => run.r0 > 1);
        const below = s.history.some((run) => run.r0 < 1);
        if (above && below) return true;
        if (!s.history.length) return 'Press **Start the outbreak** first.';
        return above ? 'Now set the slider below 1 (to 0.5) and start another outbreak.' : 'Now set the slider above 1 and start another outbreak.';
      },
      solution: { r0: 0.5, history: [{ r0: 2 }] },
      explain: 'Above 1, every round is bigger than the last, until the infection starts to run out of people who can still catch it. Below 1, each round is smaller, and the chain dies out.',
    },
    {
      id: 'teach-r',
      type: 'info',
      title: 'The reproduction number',
      text: `
        The average you set with the slider has a name: the **reproduction number**, **R**. For a new germ meeting people with no immunity it is written **R₀** ("R nought"): about ${R0.flu.low} to ${R0.flu.high} for seasonal flu, and ${R0.measles.low} to ${R0.measles.high} for measles.

        :::example Worked example: each case infects 6 others
        Round 0 is one person.
        - Round 1: that person infects **6**.
        - Round 2: each of the 6 infects 6 more: 6 × 6 = **36**.
        - Round 3: each of the 36 infects 6 more: 36 × 6 = **216**.

        Every round **multiplies** the last one by R.
        :::
      `,
      figure: {
        type: 'bars', yMax: 240, yStep: 40, yLabel: 'new cases',
        data: [
          { label: 'round 0', value: 1, color: 'orange' },
          { label: 'round 1', value: 6, color: 'orange' },
          { label: 'round 2', value: 36, color: 'orange' },
          { label: 'round 3', value: 216, color: 'red' },
        ],
        alt: 'A bar chart of new cases when each case infects 6 others: 1 in round 0, 6 in round 1, 36 in round 2 and 216 in round 3. Each bar is six times the one before.',
      },
    },
    {
      id: 'growth',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [R, n] = rng.pick([[2, 5], [2, 6], [2, 7], [2, 8], [2, 10], [3, 4], [3, 5], [4, 3], [4, 4], [4, 5], [5, 3], [5, 4]]);
        const answer = R ** n;
        const chain = Array.from({ length: Math.min(n, 4) + 1 }, (_, i) => thousands(R ** i)).join(' → ');
        return {
          text: `
            A new infection arrives, and nobody is immune. Each case infects **${R}** others, and round 0 is **one** person.

            **How many people are newly infected in round ${n}?**
          `,
          answer,
          unit: 'people',
          wrong: [
            [R * n, `That is ${R} × ${n}: adding ${R} per round. But every case in a round infects ${R} more, so each round **multiplies** by ${R}.`],
            [R ** (n - 1), `That is round ${n - 1}. Multiply by ${R} once more.`],
          ],
          hints: [
            `Round 1 has ${R} new cases. Each of them infects ${R} more, so round 2 has ${R} × ${R} = ${R * R}.`,
            `Multiply by ${R} once for every round: $${R}^{${n}}$.`,
          ],
          explain: r`Each round multiplies the last by ${R}: ${chain}${n > 4 ? ' → …' : ''} So round ${n} has $${R}^{${n}} = ${thousands(answer)}$ new cases. Growth like this, by multiplying, is why outbreaks seem to come from nowhere.`,
        };
      },
    },
    {
      id: 'cut-spread',
      type: 'interact',
      attempts: 6,
      title: 'How much is enough?',
      text: `
        This germ infects **2.5** people per case if nothing is done. Washed hands, staying home when ill, fresh air: each trims the spread a little.

        You do not have to block every infection. **Find the smallest cut that stops outbreaks from growing**, and run it.
      `,
      widget: {
        type: 'outbreak-sim', r0: 2.5, cutRange: [0, 0.8, 0.1], labels: { cut: 'spread cut by' },
        alt: 'A town of 300 dots and a bar chart of new cases in each round. A slider sets what share of the spread is prevented.',
      },
      check: (s) => {
        if (s.re > 1) return `With the spread cut by ${num(s.cut * 100)}%, one case still infects ${num(s.re, 2)} others: more than 1, so outbreaks can grow. Cut more.`;
        if (s.cut > 0.6) return `That stops it, with room to spare: one case now infects only ${num(s.re, 2)}. Find the **smallest** cut that brings the number down to 1.`;
        return s.ran || 'That is the setting. Now press **Start the outbreak** to see what it does.';
      },
      solution: { cut: 0.6 },
      hints: ['Watch the readout "one case now infects". Outbreaks grow while it is above 1.', r`You need $2.5 \times (1 - \text{cut}) = 1$.`],
      explain: r`
        A cut of **60%** is enough: $2.5 \times 0.4 = 1$. Each case then only just replaces itself, and the chains sputter out instead of growing.

        Nobody has to be perfect. Several ordinary measures, each blocking some of the spread, add up to an outbreak that never happens.

        Staying home matters because many infections spread before symptoms are in full swing. The gap between catching a germ and first feeling ill is the **incubation period**: ${INCUBATION.flu} for flu, ${INCUBATION.chickenpox} for chickenpox.
      `,
    },
    {
      id: 'face-entry',
      type: 'interact',
      title: 'The last few centimetres',
      text: `
        A germ picked up from a door handle is harmless while it sits on your fingertip: unbroken skin keeps it out. Germs get in where the body is lined with something thin and moist instead of tough skin. And people touch their own faces many times an hour, mostly without noticing.

        **Tap the three places on the face where germs carried on a fingertip can get into the body.**
      `,
      widget: {
        type: 'body-map', view: 'body', bounds: [128, 22, 272, 168], mode: 'pickMany', max: 3, names: true,
        show: ['eye', 'ear', 'nose', 'mouth'], pickable: ['eye', 'ear', 'nose', 'mouth'], answer: ['eye', 'mouth', 'nose'],
        alt: 'The head of a figure seen from the front, with the eyes, ears, nose and mouth drawn in.',
      },
      check: (s) => {
        if (s.picked.join() === 'eye,mouth,nose') return true;
        if (s.picked.includes('ear')) return 'Not the ear: its canal is lined with skin and ends at the eardrum, so a fingertip rarely delivers an infection that way.';
        return s.count < 3 ? 'There are three of them.' : false;
      },
      solution: { picked: ['eye', 'mouth', 'nose'] },
      hints: ['Skin is a tough barrier. Which openings are lined with something thinner and moist?'],
      explain: `
        The **eyes, nose and mouth** are lined with thin, moist membrane instead of tough skin. A fingertip that rubs an eye or touches a lip carries cold, flu and stomach viruses across the last few centimetres.

        Against germs breathed straight in, the blocks are covered coughs, fresh air and staying home when ill. A well-fitted mask filters much of what an infectious person breathes out, and some of what the wearer breathes in. How much mask-wearing by a whole community changes an outbreak is harder to measure, and trials have given mixed results.
      `,
    },
    {
      id: 'semmelweis',
      type: 'choice',
      tone: 'sober',
      title: 'Vienna, 1847',
      text: `
        In one maternity clinic of Vienna's great hospital, about one mother in nine dies of "childbed fever". Its doctors and students often come straight from dissecting bodies. In the clinic next door, run by midwives, far fewer die.

        A young doctor, **Ignaz Semmelweis**, orders everyone to wash their hands in a chlorine solution before examining a patient.

        **What best explains what happened next?**
      `,
      figure: {
        type: 'bars', yMax: 12, yStep: 2, unit: '%', yLabel: 'mothers who died',
        data: [
          { label: '1846: before', value: SEMMELWEIS.before, color: 'red' },
          { label: '1848: after', value: SEMMELWEIS.after, color: 'green' },
        ],
        alt: `A bar chart of deaths among mothers in the doctors' clinic: ${SEMMELWEIS.before}% in 1846, before handwashing, and ${SEMMELWEIS.after}% in 1848, after it.`,
      },
      columns: 1,
      options: [
        { text: 'Something carried on the doctors\' hands had been causing the fever', correct: true },
        { text: 'The air in the doctors\' clinic had improved', why: 'Nothing about the building or its air changed. The one thing that changed was the handwashing.' },
        { text: 'The midwives\' clinic had been taking the healthier mothers', why: 'Women were sent to the two clinics on alternate days, whatever their health. And that would not explain a sudden drop in 1847.' },
        { text: 'It was a lucky year', why: `A fall from ${SEMMELWEIS.before}% to ${SEMMELWEIS.after}%, starting when the handwashing started and lasting as long as it lasted, is far too large and too well timed for luck.` },
      ],
      explain: `
        Semmelweis was right: the doctors' hands carried the infection from the dissecting room to the mothers. Most of his colleagues rejected the idea, and he did not live to see germs shown to be the cause.

        Clean hands are still regarded as the single most important way of stopping infections in hospitals, and one of the best outside them.
      `,
    },
    {
      id: 'teach-handwash',
      type: 'info',
      title: 'What soap does',
      text: `
        Washing hands removes germs before they reach your mouth, your food or the next person. The work is done by the **soap**: it lifts germs off the skin, and it pulls apart the fatty envelope that many viruses are wrapped in.

        - Soap needs **time and rubbing**: about ${HANDWASH_SECONDS} seconds. In one large study that watched people at public sinks, the average wash lasted about six.
        - The parts most often missed are **thumbs, fingertips and between the fingers**.
        - Germs pass on more easily from **wet** hands than from dry ones.
        - Water you can bear to touch is far too cool to kill germs, and soap labelled "antibacterial" has been found no better than plain soap.
      `,
    },
    {
      id: 'wash',
      type: 'bucket',
      review: true,
      title: 'What matters at the sink',
      text: 'Washing hands removes germs before they reach your mouth, your food or the next person. **Which of these make a real difference?**',
      buckets: ['A real difference', 'Little or none'],
      items: [
        { text: 'Using soap', bucket: 0, why: 'Soap molecules grip grease at one end and water at the other. They lift germs off the skin, and they pull apart the fatty envelope that many viruses are wrapped in.' },
        { text: `Rubbing for about ${HANDWASH_SECONDS} seconds`, bucket: 0, why: 'Soap needs time and rubbing to work germs loose.' },
        { text: 'Reaching thumbs, fingertips and between the fingers', bucket: 0, why: 'These are the parts most often missed, and fingertips are what touch your face and food.' },
        { text: 'Drying your hands afterwards', bucket: 0, why: 'Germs pass on more easily from wet hands than from dry ones.' },
        { text: 'Hot water instead of cold', bucket: 1, why: 'Water you can bear to touch is far too cool to kill germs. Warm or cold, it is the soap and the rubbing that remove them.' },
        { text: 'Soap labelled "antibacterial"', bucket: 1, why: 'Studies have found it no better than plain soap at preventing illness at home. Plain soap already removes bacteria, and viruses too.' },
      ],
      explain: `
        Soap, ${HANDWASH_SECONDS} seconds of rubbing that reaches every surface, a rinse and a dry: that is the whole method. The water temperature and the word "antibacterial" add nothing that has been measured.

        The moments that matter most: after the toilet, before preparing or eating food, after blowing your nose, and after caring for someone who is ill. An alcohol hand rub is a good stand-in when there is no sink, though it works less well on visibly dirty hands and against a few germs, norovirus among them.
      `,
    },
    {
      id: 'doubling',
      type: 'numeric',
      title: 'Left out on the counter',
      gen: (rng) => {
        const food = rng.pick(FOODS);
        const [d, hours] = rng.pick([[20, 1], [20, 2], [20, 3], [30, 2], [30, 3], [30, 4]]);
        const start = rng.pick([10, 50, 100, 200]);
        const k = (hours * 60) / d;
        const answer = start * 2 ** k;
        return {
          text: `
            Bacteria that cause food poisoning multiply fastest between about ${FOOD.coldC} °C and ${FOOD.hotC} °C: warmer than a fridge, cooler than steaming hot.

            Count the doublings first. For example, bacteria that double every 15 minutes double 4 times in an hour, and 2 × 2 × 2 × 2 makes 16 times as many.

            ${food[0].toUpperCase() + food.slice(1)} is left on a warm counter with **${start}** such bacteria in it. They double every **${d} minutes**. **How many are there after ${hours} hour${hours === 1 ? '' : 's'}?** (The slider shows what one bacterium becomes.)
          `,
          figure: {
            type: 'plot', height: 280, x: [0, hours], y: [0, 2 ** k * 1.15], xStep: hours <= 2 ? 0.5 : 1, yStep: 2 ** k <= 16 ? 2 : 2 ** k <= 64 ? 10 : 2 ** k <= 256 ? 50 : 100,
            xLabel: 'hours', yLabel: 'bacteria',
            params: { t: { min: 0, max: hours, step: d / 60, value: 0, label: 'time (hours)', color: 'orange' } },
            fns: [{ expr: `2^(x*${60 / d})`, color: 'red' }],
            points: [{ id: 'T', x: 't', on: 0, color: 'orange' }],
            readouts: [{ label: 'from one bacterium', expr: `2^(t*${60 / d})`, digits: 0 }],
            alt: `A curve that starts at 1 and doubles every ${d} minutes, climbing ever more steeply to ${2 ** k} after ${hours} hour${hours === 1 ? '' : 's'}. A slider moves a point along it.`,
          },
          answer,
          wrong: [
            [start * 2 * k, `That multiplies by 2 × ${k}. Doubling ${k} times means multiplying by 2, ${k} times over: $2^{${k}} = ${2 ** k}$.`],
            [start * k, `There are ${k} doublings, but each one multiplies the number by 2.`],
            [2 ** k, `That is what **one** bacterium becomes. There were ${start} to begin with.`],
          ],
          hints: [
            `${hours} hour${hours === 1 ? '' : 's'} is ${hours * 60} minutes: ${k} doublings of ${d} minutes each.`,
            r`${k} doublings multiply the number by $2^{${k}} = ${2 ** k}$.`,
          ],
          explain: r`
            ${hours * 60} minutes is ${k} doublings, and $2^{${k}} = ${2 ** k}$. So ${start} bacteria become $${start} \times ${2 ** k} = ${thousands(answer)}$.

            Hence the World Health Organization's advice: do not leave cooked food at room temperature for more than ${FOOD.roomHours} hours, keep raw and cooked food apart, cook thoroughly, and reheat leftovers until steaming hot. A fridge slows bacteria down. It does not kill them.
          `,
        };
      },
    },
    {
      id: 'try-it',
      type: 'info',
      title: 'Something to try this week',
      text: `
        Next time you wash your hands, count slowly to ${HANDWASH_SECONDS} while you rub, and notice where you would normally have stopped.

        Then look at the parts you tend to skip: thumbs, fingertips, the backs of your hands. That is all there is to it.

        :::note
        Hospitals treat this one habit as their first line of defence against infection.
        :::
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    'Germs are bacteria, viruses, fungi and parasites. Fewer than 1 kind of bacteria in 100 causes disease, and each germ has its routes: air, hands and surfaces, food and water, blood and sex, insects.',
    'John Snow found the route of cholera in 1854 by mapping who fell ill and who did not. Semmelweis showed that washing hands saves lives.',
    'An infection grows while each case infects more than one other. That average is **R**, the reproduction number. Pull it to 1 or below and the outbreak dies out.',
    `You do not need to block every germ, only enough of them: soap and ${HANDWASH_SECONDS} seconds at the sink, staying home when ill, fresh air, and food kept cold or hot.`,
  ],
  next: 'Next: there is another way to pull R below 1, without anyone having to catch the disease first.',
};
