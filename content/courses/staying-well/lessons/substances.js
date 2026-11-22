// Staying Well: Prevention and Everyday Medicine · Lesson 7 · Alcohol, Tobacco and Other Drugs
//
// Driving question: what do these substances do in the body, why are they hard to stop, and what does stopping give back?
// Factual and non-moralising; no instructions for use. Sources for the facts are noted in ../helpers.js.
import { r, num } from '../../../kit.js';
import { PEOPLE, TOBACCO, QUIT_TIMELINE, QUIT_UNAIDED, ALCOHOL, STANDARD_DRINK, ukUnits, ALCOHOL_GUIDANCE, ALCOHOL_CANCERS, clock } from '../helpers.js';

// The four things in tobacco smoke that do most of the damage: taught as a table, then matched.
const SMOKE = [
  ['Carbon monoxide', 'Takes the place of oxygen in red blood cells'],
  ['Tar', 'Carries chemicals that damage DNA and start cancers'],
  ['Irritant gases and particles', 'Wreck the cleaning hairs and the air sacs of the lungs'],
  ['Nicotine', 'Keeps people smoking: it is what the brain comes to crave'],
];

// Kinds of drug and the main danger of each: taught as a table, then matched.
const DRUGS = [
  ['Opioids, such as heroin, fentanyl and strong painkillers', 'Slow the breathing, and in overdose stop it'],
  ['Stimulants, such as cocaine and amphetamines', 'Drive up heart rate and blood pressure, straining the heart'],
  ['Cannabis', 'Dulls memory, attention and reaction time; heavy use raises the risk of psychosis'],
  ['Alcohol together with sedatives', 'Each deepens the other\'s effect, far more than either alone'],
];

const DRINK_NAMES = ['UK unit', 'Australian standard drink', 'US standard drink'];

// [what, volume in ml, strength in % alcohol by volume]
const DRINKS = [
  ['a 500 ml bottle of beer', 500, 4], ['a 500 ml can of strong lager', 500, 5], ['a large 250 ml glass of wine', 250, 12],
  ['a small 125 ml glass of wine', 125, 12], ['a 750 ml bottle of wine', 750, 12], ['a 25 ml measure of whisky', 25, 40],
  ['a 50 ml double measure of vodka', 50, 40], ['a 1 litre bottle of cider', 1000, 5], ['a 700 ml bottle of gin', 700, 40],
  ['a 200 ml glass of fortified wine', 200, 15], ['a 330 ml bottle of beer', 330, 5],
];

// [grams of pure alcohol on the label, index into STANDARD_DRINK]: every answer is a whole number
const LABEL_GRAMS = [[56, 0], [56, 2], [70, 1], [70, 2], [40, 0], [40, 1], [28, 2], [24, 0], [30, 1], [42, 2], [80, 0], [80, 1]];

export default {
  id: 'substances',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      tone: 'sober',
      title: 'The biggest preventable cause',
      text: `
        Picture 100 people who smoke cigarettes all their adult lives and never stop.

        **How many of them will die of an illness caused by their smoking?**
      `,
      min: 0, max: 100, step: 5, answer: 50, tolerance: 15, start: 0, unit: 'of 100',
      explain: `
        **About half**, and the largest recent studies suggest more. Tobacco kills over ${TOBACCO.deathsMillions} million people a year: more than any other single thing that can be prevented.

        The same studies carry better news. Stopping works at any age, and the body starts to recover within minutes. This lesson is about what tobacco, alcohol and other drugs do, why stopping is hard, and what it gives back.
      `,
    },
    {
      id: 'teach-smoke',
      type: 'info',
      title: 'What is in the smoke',
      text: `
        Burning tobacco releases thousands of chemicals. They are breathed down the airways to the air sacs, and from there into the blood. Four do most of the damage, each in its own way.

        | In the smoke | What it does |
        |---|---|
        ${SMOKE.map(([name, does]) => `| **${name}** | ${does} |`).join('\n        ')}

        Nicotine causes very little of the damage itself. Its part is to make the habit hard to break.
      `,
      figure: { type: 'body-map', view: 'lungs-detail', labels: ['windpipe', { id: 'bronchioles', text: 'Small airways, lined with cleaning hairs' }, 'air-sacs', { id: 'lung-capillaries', text: 'Blood vessels' }], alt: 'The airways inside the lungs: the windpipe divides into bronchi and then into ever smaller airways, which end in clusters of air sacs wrapped in fine blood vessels. One cluster is drawn enlarged.' },
    },
    {
      id: 'smoke-does',
      type: 'match',
      title: 'Four kinds of damage',
      text: 'Four things in tobacco smoke do most of the damage, each in its own way. **Match each with what it does.**',
      pairs: SMOKE,
      explain: 'Smoke chemicals absorbed into the blood also damage the lining of arteries and make blood clot more easily, which is why smoking causes heart attacks and strokes as well as lung disease and more than a dozen kinds of cancer.',
    },
    {
      id: 'reward',
      type: 'choice',
      review: true,
      title: 'Why it is hard to stop',
      text: `
        Nicotine from a cigarette reaches the brain in seconds and sets off the **reward circuit**, the system that normally marks food, warmth and company as worth repeating. With every repeat the brain adapts, until it works normally only when nicotine is present.

        A person who smokes says: "A cigarette calms me down." **What is mostly going on?**
      `,
      columns: 1,
      options: [
        { text: 'The cigarette relieves the tension that the lack of nicotine has caused since the last one', correct: true },
        { text: 'Nicotine is a relaxant that lowers stress in anyone', why: 'Nicotine is a stimulant: it raises the pulse and blood pressure. People who have stopped for a few months report *lower* stress than when they smoked.' },
        { text: 'Smoking supplies oxygen to the brain', why: 'Smoke does the opposite: its carbon monoxide takes up room on the red blood cells that oxygen needs.' },
        { text: 'It is imagination: cigarettes have no effect on mood', why: 'The relief is real. What causes the need for relief is the previous cigarette wearing off.' },
      ],
      explain: `
        Within hours of the last cigarette the adapted brain signals a shortage: restlessness, irritability, trouble concentrating. The next cigarette ends that **withdrawal**, and the relief is felt as calm.

        This is what **addiction** is: reward and habit circuits retrained by a substance. It is a change in the brain, and a health condition. It is not a weakness of character.
      `,
    },
    {
      id: 'quit-timeline',
      type: 'order',
      review: true,
      title: 'What stopping gives back',
      text: 'The body starts to repair itself soon after the last cigarette. The circulation responds within minutes and the blood within days; the lungs take months, the heart about a year, and the risk of cancer longest of all. **Put these gains in the order in which they arrive.**',
      items: QUIT_TIMELINE.map((q) => q.what),
      labels: ['First', 'Last'],
      explain: `
        ${QUIT_TIMELINE.map((q) => `- **After ${q.after}:** ${q.what.charAt(0).toLowerCase() + q.what.slice(1)}`).join('\n        ')}

        After about 15 years the risk of heart disease is close to that of someone who never smoked. People who stop by the age of 40 avoid about nine tenths of the extra risk of dying early, and stopping later still adds years.
      `,
    },
    {
      id: 'quit-help',
      type: 'interact',
      graded: false,
      title: 'Help makes a difference',
      text: `
        Stopping is hard. Of 100 people who try with willpower alone, only about ${QUIT_UNAIDED} are still not smoking a year later.

        Counselling together with a stop-smoking medicine (such as nicotine patches or gum, or a prescribed tablet) makes success two to three times as likely. **Move the slider to 2×, then to 3×**, and count the extra people who succeed.
      `,
      widget: {
        type: 'risk-array', n: 100, base: QUIT_UNAIDED, rr: 1, rrRange: [1, 3, 0.5], good: true,
        words: { people: 'people who try', without: 'Unaided', with: 'With help', base: 'succeed either way', extra: 'succeed because of the help', rest: 'smoking again within a year', rrLabel: 'success with help', measure: 'the chance' },
        alt: 'One hundred dots stand for 100 people trying to stop smoking. A slider multiplies the number who succeed.',
      },
      check: (s) => s.rr >= 3 || (s.rr >= 2 ? 'That is twice as many. Now try 3×.' : 'Drag the slider to the right, to 2× and then 3×.'),
      solution: { rr: 3 },
      explain: `
        Help turns 4 in 100 into 8 to 12 in 100. That is a real gain, and it also shows that most attempts fail, **with or without help**.

        Most people who have stopped for good needed several tries. A failed attempt is practice, not a verdict. A doctor, pharmacist or stop-smoking service can say what is available where you live.
      `,
    },
    {
      id: 'vaping',
      type: 'choice',
      title: 'And e-cigarettes?',
      text: `
        E-cigarettes (vapes) heat a liquid that usually contains nicotine into a mist. Nothing is burned, so there is no tar and no carbon monoxide, and people who have switched from cigarettes have far lower levels of the main toxic chemicals in their bodies.

        Vapes have been in wide use for only about fifteen years. Diseases such as cancer take longer than that to show.

        **Which statement best fits the evidence so far?**
      `,
      columns: 1,
      options: [
        { text: 'For someone who smokes, switching completely is far less harmful than carrying on; for someone who does not, starting adds risk and no benefit', correct: true },
        { text: 'Vaping is harmless', why: 'The mist carries nicotine, which is addictive, and other chemicals whose effects over decades are not yet known.' },
        { text: 'Vaping is at least as harmful as smoking', why: 'Almost all the harm of cigarettes comes from burning tobacco, and vapes burn nothing.' },
        { text: 'Vapes have been used long enough to be sure of their long-term safety', why: 'About fifteen years of wide use is too short a time to be sure.' },
      ],
      explain: `
        Trials show that nicotine e-cigarettes help more smokers to stop than nicotine patches or gum do. The long-term effects are still unknown, and health agencies weigh that differently: some encourage smokers to switch, others are more cautious.

        On one point they agree: vapes are not for children, or for people who do not smoke.
      `,
    },
    {
      id: 'teach-units',
      type: 'info',
      title: 'Counting alcohol',
      text: `
        Drinks differ hugely in strength, so what is counted is the **pure alcohol** in them. In the United Kingdom one **unit** is ${ALCOHOL.unitMl} ml of pure alcohol, which weighs about ${STANDARD_DRINK[0].grams} g.

        :::example Worked example: a 400 ml drink at 10% alcohol
        - Pure alcohol: 10% of 400 ml is 40 ml.
        - Units: 40 ÷ ${ALCOHOL.unitMl} = **4 units**. In one line: 400 × 10 ÷ 1,000 = 4.
        :::

        Other countries count a different portion, by weight: an Australian **standard drink** is ${STANDARD_DRINK[1].grams} g, and a US one is ${STANDARD_DRINK[2].grams} g. A can that holds 20 g of pure alcohol is 20 ÷ ${STANDARD_DRINK[1].grams} = **2** Australian standard drinks.
      `,
      figure: {
        type: 'bars', yMax: 16, yStep: 4, unit: 'g', yLabel: 'pure alcohol',
        data: STANDARD_DRINK.map((d, k) => ({ label: DRINK_NAMES[k], value: d.grams, color: 'orange' })),
        alt: `A bar chart of the pure alcohol in one counted portion: ${STANDARD_DRINK[0].grams} grams in a UK unit, ${STANDARD_DRINK[1].grams} grams in an Australian standard drink and ${STANDARD_DRINK[2].grams} grams in a US standard drink.`,
      },
    },
    {
      id: 'units',
      type: 'numeric',
      review: true,
      title: 'How much alcohol is in a drink?',
      gen: (rng) => {
        const [what, ml, abv] = rng.pick(DRINKS);
        const answer = ukUnits(ml, abv);
        const who = rng.pick(PEOPLE);
        return {
          text: `
            Drinks differ hugely in strength, so alcohol is counted in **units**. In the United Kingdom one unit is ${ALCOHOL.unitMl} ml of pure alcohol:

            units = volume in ml × strength in % ÷ 1,000

            ${who} picks up ${what}, **${abv}%** alcohol. **How many units is that?** (The sliders let you check.)
          `,
          figure: {
            type: 'plot', height: 240, x: [0, 1000], y: [0, 30], xStep: 250, yStep: 10, xLabel: 'volume (ml)', yLabel: 'units',
            params: {
              v: { min: 25, max: 1000, step: 5, value: 250, label: 'volume (ml)', color: 'blue' },
              s: { min: 3, max: 40, step: 1, value: 5, label: 'strength (%)', color: 'orange' },
            },
            fns: [{ expr: 's*x/1000', color: 'orange' }],
            points: [{ id: 'P', x: 'v', on: 0, color: 'blue' }],
            readouts: [{ label: 'pure alcohol (ml)', expr: 'v*s/100', digits: 1 }, { label: 'UK units', expr: 'v*s/1000', digits: 2 }],
            alt: 'A straight line shows the units of alcohol in a drink rising with its volume, steeper for stronger drinks. Sliders set the volume and the strength, and readouts give the millilitres of pure alcohol and the units.',
          },
          answer,
          tolerance: 0.051,
          wrong: [
            [(ml * abv) / 100, `That is the pure alcohol in millilitres. One unit is ${ALCOHOL.unitMl} ml of it.`],
            ...(abv !== answer ? [[abv, 'That is the strength, the percentage of the drink that is alcohol. The amount of alcohol also depends on how much drink there is.']] : []),
          ],
          hints: [`First the pure alcohol: ${abv}% of ${num(ml)} ml is ${num((ml * abv) / 100)} ml.`, `One unit is ${ALCOHOL.unitMl} ml of pure alcohol.`],
          explain: r`$${ml} \times ${abv} \div 1000 = ${num(answer)}$ units. The dose depends on both numbers: a 25 ml measure of spirits (1 unit) and a 500 ml bottle of ordinary beer (2 units) are far closer than their sizes suggest.`,
        };
      },
    },
    {
      id: 'std-drinks',
      type: 'numeric',
      title: 'One drink, three countings',
      gen: (rng) => {
        const [grams, i] = rng.pick(LABEL_GRAMS);
        const c = STANDARD_DRINK[i];
        const other = STANDARD_DRINK[(i + 1) % STANDARD_DRINK.length];
        return {
          text: `
            Countries count alcohol in different-sized portions. One UK **unit** is 8 g of pure alcohol, an Australian **standard drink** is 10 g, and a US **standard drink** is 14 g.

            A bottle's label says that it holds **${grams} g** of pure alcohol. **How many ${c.name} is that in ${c.country}?**
          `,
          figure: {
            type: 'bars', yMax: 16, yStep: 4, unit: 'g', yLabel: 'pure alcohol in one "drink"',
            data: STANDARD_DRINK.map((d, k) => ({ label: ['UK unit', 'Australian standard drink', 'US standard drink'][k], value: d.grams, color: k === i ? 'orange' : 'gray' })),
            alt: 'A bar chart of the pure alcohol in one counted portion: 8 grams in a UK unit, 10 grams in an Australian standard drink and 14 grams in a US standard drink.',
          },
          answer: grams / c.grams,
          tolerance: 0.051,
          wrong: [[Math.round((grams / other.grams) * 100) / 100, `That uses ${other.grams} g, the portion counted in ${other.country}. In ${c.country} one portion is ${c.grams} g.`]],
          hints: [`In ${c.country} each one is ${c.grams} g of pure alcohol.`],
          explain: r`$${grams} \div ${c.grams} = ${num(grams / c.grams)}$. The same bottle is ${num(grams / 8, 1)} UK units, ${num(grams / 10, 1)} Australian standard drinks or ${num(grams / 14, 1)} US ones, so "I had three drinks" means little without knowing whose drinks.`,
        };
      },
    },
    {
      id: 'clearing',
      type: 'interact',
      attempts: 6,
      title: 'The liver keeps its own pace',
      text: `
        Alcohol reaches the blood within minutes. The liver has to break nearly all of it down, at a steady pace of roughly **one UK unit an hour**, whatever the person does.

        Dani stops drinking at midnight with **8 units** still in the body. **Set the first slider to 8. Then move the time to the first hour at which all the alcohol is gone.**
      `,
      widget: {
        type: 'plot', height: 280, x: [0, 12], y: [0, 12], xStep: 2, yStep: 2, xLabel: 'hours after the last drink', yLabel: 'units still in the body',
        params: {
          U: { min: 2, max: 12, step: 1, value: 4, label: 'units at the last drink', color: 'orange' },
          t: { min: 0, max: 12, step: 1, value: 0, label: 'hours later', color: 'blue' },
        },
        fns: [{ expr: 'max(0, U - x)', color: 'orange' }],
        points: [{ id: 'P', x: 't', on: 0, color: 'blue' }],
        readouts: [{ label: 'units still in the body', expr: 'max(0, U - t)', digits: 0 }],
        alt: 'A straight line falls from the number of units at the last drink by one unit each hour until it reaches zero. Sliders set the starting units and the time.',
      },
      check: (s) => {
        if (s.U !== 8) return 'Set the first slider to Dani\'s 8 units.';
        if (s.t < 8) return `At ${clock(s.t)}, ${8 - s.t} unit${8 - s.t === 1 ? ' is' : 's are'} still in the body. Move the time on.`;
        if (s.t > 8) return 'It was all gone before then. Find the **first** hour at which the line touches zero.';
        return true;
      },
      solution: { U: 8, t: 8 },
      hints: ['One unit leaves each hour. How many hours do 8 units take?'],
      explain: `
        Eight hours: Dani is clear at about **8 in the morning**, not on waking. Coffee, cold showers, food and sleep do not speed the liver up.

        This is why people can still be over the drink-drive limit the morning after. The pace is an average, slower for many people, so a sum like this cannot tell anyone when they are safe to drive: the only safe amount before driving is none. In the short term alcohol slows reactions and judgement well before a person feels drunk, which is how it comes to be involved in so many crashes, falls and fights.
      `,
    },
    {
      id: 'teach-alcohol-long',
      type: 'info',
      tone: 'sober',
      title: 'Over the years',
      text: `
        Heavy drinking over years damages the liver, raises blood pressure and can lead to dependence. Less well known: alcohol also causes **cancer**, because the body turns it into a chemical that damages DNA.

        It is an established cause of cancer at seven sites: ${ALCOHOL_CANCERS.slice(0, -1).join(', ')} and ${ALCOHOL_CANCERS[ALCOHOL_CANCERS.length - 1]}.

        The risk rises with the amount, starts at low levels, and is the same for beer, wine and spirits: it is the alcohol that matters.
      `,
      figure: {
        type: 'body-map', view: 'torso', show: ['food-pipe', 'liver', 'large-intestine', 'rectum'], zoom: false,
        groups: [
          { ids: ['food-pipe'], color: 'red', label: 'Food pipe' },
          { ids: ['liver'], color: 'orange', label: 'Liver' },
          { ids: ['large-intestine', 'rectum'], color: 'violet', label: 'Bowel' },
        ],
        markers: [{ at: [236, 258], label: 'Breast', color: 'pink', shape: 'ring', size: 'l' }],
        alt: 'The trunk of a figure with four of the seven sites marked: the food pipe running down behind the breastbone, the liver in the upper right of the abdomen, the large bowel framing the abdomen, and a ring on the chest for the breast. The mouth, the throat and the voice box lie above the picture.',
      },
    },
    {
      id: 'alcohol-long',
      type: 'multi',
      tone: 'sober',
      title: 'Which cancers?',
      text: `
        The body turns alcohol into a chemical that damages DNA.

        **For which of these cancers is alcohol an established cause?** Choose all that apply.
      `,
      columns: 2,
      options: [
        { text: 'Mouth and throat', correct: true },
        { text: 'Food pipe (oesophagus)', correct: true },
        { text: 'Liver', correct: true },
        { text: 'Bowel', correct: true },
        { text: 'Breast', correct: true },
        { text: 'Brain', why: 'No link with brain tumours has been established.' },
        { text: 'Skin', why: 'The established cause of skin cancer is ultraviolet light.' },
      ],
      explain: `
        Seven sites in all: mouth, throat, voice box, food pipe, liver, bowel and breast.

        Alcohol was linked to about ${ALCOHOL.deathsMillions} million deaths worldwide in ${ALCOHOL.deathsYear}. During pregnancy no amount is known to be safe for the baby, so health agencies advise avoiding it altogether.
      `,
    },
    {
      id: 'guidance',
      type: 'info',
      title: 'How much is too much?',
      text: `
        Official advice differs from country to country, and it has been moving in one direction:

        | | Low-risk guidance for adults |
        |---|---|
        | United Kingdom | no more than ${ALCOHOL_GUIDANCE.ukUnitsPerWeek} units a week, spread over several days |
        | Australia | no more than ${ALCOHOL_GUIDANCE.australiaPerWeek} standard drinks a week, and ${ALCOHOL_GUIDANCE.australiaPerDay} on any day |
        | Canada | ${ALCOHOL_GUIDANCE.canadaPerWeek} standard drinks a week or fewer |
        | United States | "consume less alcohol for better overall health" (no number given) |

        The World Health Organization puts it most plainly: no amount has been shown to be free of risk, and **less is better**. Older findings that a daily glass protects the heart are now disputed: people who drink a little differ from non-drinkers in many other ways, and the next lesson shows how that can fool a study.

        That is information, not a commandment. Many adults decide that a drink is worth a small risk; it helps to know the size of what is being weighed.
      `,
    },
    {
      id: 'teach-other-drugs',
      type: 'info',
      tone: 'sober',
      title: 'Other drugs',
      text: `
        Drugs act on the same nerve signals that the body uses itself, which is why they can do such harm. Each kind has a main danger of its own.

        | Kind | Main danger |
        |---|---|
        ${DRUGS.map(([kind, danger]) => `| ${kind.replace(/^(\w+(?: together with sedatives)?)/, '**$1**')} | ${danger} |`).join('\n        ')}
      `,
    },
    {
      id: 'other-drugs',
      type: 'match',
      tone: 'sober',
      title: 'Other drugs',
      text: '**Match each kind of drug with its main danger.**',
      pairs: DRUGS,
      explain: `
        An overdose is a medical emergency: **call your emergency number at once**. An opioid overdose can be reversed within minutes by a medicine called **naloxone**, which is carried by ambulance crews and, in many countries, available to the public. *First Aid* covers what to do.

        All of these drugs can cause dependence, and the law on them differs widely between countries. What does not differ is that street drugs are of unknown strength, which is where much of the danger lies.
      `,
    },
    {
      id: 'addiction',
      type: 'choice',
      review: true,
      tone: 'sober',
      title: 'A health condition',
      text: `
        A friend says of someone with an alcohol or drug problem: "If they really wanted to stop, they would."

        **What does the evidence say?**
      `,
      columns: 1,
      options: [
        { text: 'Addiction retrains the brain\'s reward and habit circuits, so stopping takes more than wanting to. It is a treatable health condition, and most people do recover', correct: true },
        { text: 'It is mainly a matter of willpower and character', why: 'About half of a person\'s risk is inherited, and much of the rest comes from stress, trauma and surroundings. People with addiction usually want to stop, and have tried many times.' },
        { text: 'Once addicted, a person can never recover', why: 'Most people with an addiction do recover, often after several attempts, and treatment improves the odds.' },
        { text: 'People only become addicted to illegal drugs', why: 'Nicotine and alcohol are legal, and they account for most addiction and most of the harm.' },
      ],
      explain: `
        Repeated use teaches the reward system to rank the substance above everything else, while the brain's brakes weaken. Cues set off craving, and stopping brings withdrawal. Wanting to stop is where recovery begins, and it is rarely enough on its own.

        Treatment works: counselling, medicines for nicotine, alcohol and opioid dependence, and the support of other people. Shame keeps people away from it, which is one reason why words matter.
      `,
    },
    {
      id: 'help',
      type: 'info',
      title: 'Where help is',
      text: `
        If you or someone you know would like to cut down or stop, a **family doctor or a pharmacist** is a normal place to start, and what is said there is confidential. Many countries also run free telephone helplines and stop-smoking services.

        Something small to notice this week, if you like: pick up one bottle or can and find the **strength** printed on it, and any count of units or standard drinks. It is the label-reading from the *Medicines* lesson, applied to a different shelf.

        :::warn
        Someone who cannot be woken, is breathing slowly or noisily, or has blue lips after alcohol or drugs needs an ambulance now. Call your emergency number. Stay with them, and if they are breathing, lay them on their side.
        :::
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    'Tobacco kills about half of the people who smoke for life. Smoke damages lungs, arteries and DNA; **nicotine** is what makes it hard to stop.',
    'Stopping pays back from the first 20 minutes to 15 years on, and help makes success two to three times as likely.',
    'Alcohol is counted in units or standard drinks, which differ between countries. The liver clears about one UK unit an hour, and no amount is known to be free of risk.',
    'Addiction is a change in the brain\'s reward circuits: a health condition, not a failing of character, and treatable.',
  ],
  next: 'Next: the last tool of the course. How to tell a real health finding from a headline.',
};
