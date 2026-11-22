// Staying Well: Prevention and Everyday Medicine · Lesson 8 · Is That Really True?
//
// Driving question: how do you tell a real health finding from a headline?
// The practice headlines are invented and say so; the real examples are sourced in ../helpers.js.
import { r, num } from '../../../kit.js';
import { MEAT, PILL_SCARE, TORCETRAPIB, EVIDENCE_LADDER, HEADLINE_CASES, thousands } from '../helpers.js';

const EXPOSURES = ['eat a certain snack every day', 'work night shifts', 'take a new supplement', 'drink a certain tea', 'live near a busy road', 'use a new sleep app'];
const CONDITIONS = ['a rare blood disorder', 'kidney stones', 'a broken hip', 'migraine', 'a stomach ulcer', 'gout'];

// Medicines for practice with the number needed to treat: [in 100 without, in 100 with, years, what is prevented]
const TREATMENTS = [
  [10, 8, 5, 'stroke'], [6, 4, 5, 'heart attack'], [20, 15, 10, 'heart attack'], [5, 4, 5, 'stroke'],
  [12, 8, 10, 'broken hip'], [4, 2, 5, 'stroke'], [15, 10, 10, 'heart attack'], [8, 4, 5, 'broken hip'],
];

// Patterns that are real, and the hidden third thing behind each.
const CONFOUNDED = [
  {
    finding: 'On days when more ice cream is sold, more people drown.',
    direct: 'Eating ice cream makes swimmers more likely to drown',
    third: 'Hot weather drives both: people buy ice cream and people go swimming',
    reverse: 'News of drownings makes people buy ice cream',
    note: 'Take the weather into account and the link disappears.',
  },
  {
    finding: 'In many older studies, the people who drank the most coffee had the most lung cancer.',
    direct: 'Coffee damages the lungs',
    third: 'Heavy coffee drinkers of the time were also far more likely to smoke',
    reverse: 'Having lung cancer makes people thirsty for coffee',
    note: 'Among people who have never smoked, coffee shows no such link.',
  },
  {
    finding: 'People who take vitamin pills every day have fewer heart attacks than people who do not.',
    direct: 'Vitamin pills protect the heart',
    third: 'People who choose to take vitamins also tend to exercise more, smoke less and have more money',
    reverse: 'Having a healthy heart makes people buy vitamins',
    note: 'When vitamins were given at random in large trials, the heart attacks were no fewer.',
  },
  {
    finding: 'Young children who sleep with a night-light on are more often short-sighted.',
    direct: 'Night-lights damage children\'s eyes',
    third: 'Short-sighted parents more often leave a light on, and short-sightedness runs in families',
    reverse: 'Being short-sighted makes a baby ask for a light',
    note: 'This one made headlines in 1999. Later studies that asked about the parents\' eyesight found no effect of the lights.',
  },
  {
    finding: 'Countries where people eat more chocolate have won more Nobel prizes for their size.',
    direct: 'Chocolate makes people cleverer',
    third: 'Rich countries can afford both more chocolate and more research',
    reverse: 'Winning Nobel prizes makes a nation eat chocolate',
    note: 'A doctor published this pattern in 2012, as a joke with a serious point.',
  },
  {
    finding: 'Among primary-school children, those with bigger feet read better.',
    direct: 'Large feet help with reading',
    third: 'Older children have bigger feet and have had more practice at reading',
    reverse: 'Reading makes feet grow',
    note: 'Compare children of the same age and the link vanishes.',
  },
];

// The ladder of evidence as a picture: strongest rung at the top, built from the same list as the ordering question.
const LADDER = (() => {
  const hues = ['green', 'teal', 'blue', 'yellow', 'gray'];
  const rungs = EVIDENCE_LADDER.slice().reverse();
  let content = '<text class="fig-label text-muted" x="200" y="16" text-anchor="middle">strongest</text>';
  rungs.forEach((text, i) => {
    const y = 26 + i * 42;
    content += `<rect class="fill-${hues[i]}-soft stroke-ink" stroke-width="2.5" x="6" y="${y}" width="388" height="34" rx="8"/>`;
    content += `<text class="fig-label" x="200" y="${y + 22}" text-anchor="middle">${text.replace(/'/g, '’')}</text>`;
  });
  content += `<text class="fig-label text-muted" x="200" y="${26 + rungs.length * 42 + 12}" text-anchor="middle">weakest</text>`;
  return {
    type: 'svg', viewBox: `0 0 400 ${26 + rungs.length * 42 + 20}`, maxWidth: 440, content,
    alt: `A ladder of five rungs. From the strongest evidence at the top to the weakest at the bottom: ${rungs.join('; ')}.`,
  };
})();

export default {
  id: 'health-claims',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      tone: 'sober',
      title: 'Eighteen per cent',
      text: `
        In 2015 newspapers reported, correctly, a finding of the World Health Organization's cancer agency: eating 50 g of processed meat every day, about two rashers of bacon, **raises the risk of bowel cancer by ${MEAT.relativePct}%**.

        Picture 100 people who eat that much every day of their lives. **How many of them get bowel cancer who would not have done otherwise?**
      `,
      shuffle: false,
      options: [
        { text: 'About 18' },
        { text: 'About 6' },
        { text: 'About 1', correct: true },
        { text: 'It cannot be worked out from the headline' },
      ],
      explain: `
        **About 1 in 100**, and the last option has a point too: the headline alone does not say. You need one more number.

        In a country such as the United Kingdom, about ${MEAT.lifetimePer100} people in 100 get bowel cancer at some time in their lives. Eighteen per cent more than ${MEAT.lifetimePer100} is about 7. The risk is real, and so is the difference between "${MEAT.relativePct}% more" and "1 more person in 100". This lesson is a toolkit for reading claims like this one.
      `,
    },
    {
      id: 'teach-two-ways',
      type: 'info',
      title: 'Two ways to tell it',
      text: `
        A change in risk can be told in two ways.

        - **Relative**: how the new risk compares with the old one. "25% more", "doubles", "cuts by a third".
        - **Absolute**: how many people it changes. "20 more in every 1,000".

        :::example Worked example: "25% more", where 80 in every 1,000 are affected
        - The 25% is taken **of the 80**, not of the 1,000: 80 × 0.25 = 20.
        - So **20 more** in every 1,000: from 80 to 100.
        :::

        The picture shows the same thing as people: the squares are affected either way, and the filled circles are the 20 extra.
      `,
      figure: {
        type: 'risk-array', n: 1000, base: 80, rr: 1.25, static: true,
        words: { without: 'Before', with: 'With 25% more', extra: 'extra cases' },
        alt: 'One thousand dots stand for 1,000 people. Eighty are marked as affected to begin with, and 20 more as extra cases: 100 in all. The summary gives both versions: 25% more, and 20 more in every 1,000.',
      },
    },
    {
      id: 'convert',
      type: 'interact',
      tone: 'sober',
      title: 'Put the people back in',
      text: `
        Here are 1,000 people. In a lifetime, about 60 of them get bowel cancer whatever they eat (the [red squares]{.red}).

        **Set the slider to 1.18×**, which is "18% more", and count the extra cases.
      `,
      widget: {
        type: 'risk-array', n: 1000, base: 60, rr: 1, rrRange: [1, 2, 0.02],
        words: { without: 'Without the daily portion', with: 'With it', extra: 'affected because of it', rrLabel: 'risk with the daily portion' },
        alt: 'One thousand dots stand for 1,000 people. Sixty are marked as getting bowel cancer in any case. A slider multiplies that risk and marks the extra cases.',
      },
      check: (s) => Math.abs(s.rr - 1.18) < 0.001 || `That is ${num(s.rr, 2)}×: ${s.extra} extra in 1,000. Set the slider to exactly 1.18×.`,
      solution: { rr: 1.18 },
      explain: `
        Sixty becomes 71: **11 extra cases in 1,000 people**, or about 1 in 100.

        "18% more" and "11 more in 1,000" are the same fact. The first is the **relative** change: it compares the two risks with each other. The second is the **absolute** change: it counts people.
      `,
    },
    {
      id: 'doubles',
      type: 'interact',
      tone: 'sober',
      attempts: 6,
      title: '"Doubles the risk"',
      text: `
        This time the headline is fixed: something **doubles** a risk. The slider sets how common the problem was to begin with, among 10,000 people.

        The headline is true at every position of the slider. **Find the position at which doubling means just one extra case.**
      `,
      widget: {
        type: 'risk-array', n: 10000, base: 300, rr: 2, baseRange: [1, 500, 1],
        words: { without: 'Before', with: 'After doubling', extra: 'extra cases', baseLabel: 'affected to begin with' },
        alt: 'Ten thousand tiny dots stand for 10,000 people. A slider sets how many are affected to begin with, and the same number again are marked as extra cases.',
      },
      check: (s) => s.extra === 1 || `Doubling a risk of ${thousands(s.base)} in 10,000 means ${thousands(s.extra)} extra cases. Make the starting risk rarer.`,
      solution: { base: 1 },
      hints: ['Doubling adds as many cases as there were to begin with.'],
      explain: `
        From 1 in 10,000 to 2 in 10,000 is "double", and so is from 500 to 1,000. One is a single extra case; the other is five hundred.

        This has mattered. In ${PILL_SCARE.year} British women were warned that a newer contraceptive pill doubled the risk of blood clots: from about ${PILL_SCARE.before} in ${thousands(PILL_SCARE.perWomen)} women a year to about ${PILL_SCARE.after}. Many stopped taking it in alarm, and the following year saw an estimated ${thousands(PILL_SCARE.abortions)} more abortions. Pregnancy itself carries a higher risk of clots than any pill.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Out of how many?',
      text: r`
        You need both numbers. The **relative** one says how strong the effect is; the **absolute** one says how much it matters. Headlines and adverts favour the relative number, because it is nearly always the bigger one. The question that unlocks it is **"out of how many?"**

        :::key
        absolute change = starting risk × relative change
        :::

        :::example Worked example: "a 30% lower risk", where 50 in every 1,000 are affected
        30% of 50 is 50 × 0.3 = 15. So **15 fewer** in every 1,000: from 50 down to 35.
        :::

        A big relative change in a tiny risk is still tiny. A small relative change in a common risk can affect many people.
      `,
    },
    {
      id: 'abs-calc',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const [n, base, pct, dir] = rng.pick(HEADLINE_CASES);
        const change = (base * pct) / 100;
        const exposure = rng.pick(EXPOSURES);
        const condition = rng.pick(CONDITIONS);
        const word = pct === 100 ? 'double the risk' : dir > 0 ? `a ${pct}% higher risk` : `a ${pct}% lower risk`;
        return {
          text: `
            A headline (invented for practice): "People who ${exposure} have **${word}** of ${condition}."

            The small print: among people who do not, **${base} in every ${thousands(n)}** get ${condition}. **How many ${dir > 0 ? 'more' : 'fewer'} people in every ${thousands(n)} is that?**
          `,
          answer: change,
          unit: `${dir > 0 ? 'more' : 'fewer'} in ${thousands(n)}`,
          wrong: [
            ...(pct !== change ? [[pct, `${pct} is the percentage. Take ${pct}% **of the ${base}** people.`]] : []),
            ...(base + dir * change !== change && base + dir * change !== pct ? [[base + dir * change, `That is the new total: ${base} ${dir > 0 ? 'plus' : 'minus'} ${change}. The question asks only for the change.`]] : []),
          ],
          hints: [`${pct}% of ${base} people is what changes.`, r`$${base} \times ${num(pct / 100)}$`],
          explain: r`$${pct}\%$ of ${base} is $${base} \times ${num(pct / 100)} = ${change}$. So the risk goes from ${base} to ${base + dir * change} in every ${thousands(n)}: **${change} ${dir > 0 ? 'more' : 'fewer'}**. Whether that matters depends on how serious the condition is and what the change would cost you, and the headline's percentage tells you neither.`,
        };
      },
    },
    {
      id: 'example-nnt',
      type: 'info',
      title: 'From a percentage back to people',
      text: `
        Adverts for medicines favour the relative number too. To see what it hides, count how many people must take the medicine for one of them to benefit.

        :::example Worked example: "cuts the risk by a third"
        The trial behind the claim: over 5 years, 30 in 100 people who did not take the medicine fell ill, and 20 in 100 people who took it.
        - Of every 100 people who take it, 30 − 20 = **10** are spared.
        - 100 people for 10 spared: 100 ÷ 10 = **10 people for each one spared**.
        :::

        That figure is called the **number needed to treat**.
      `,
      figure: {
        type: 'risk-array', n: 100, base: 30, rr: 2 / 3, static: true, sentence: false,
        words: { without: 'Without the medicine', with: 'With it', base: 'ill either way', fewer: 'spared by the medicine', rest: 'not ill' },
        alt: 'One hundred dots stand for 100 people in a trial. Thirty would fall ill without the medicine. With it, 20 still fall ill and 10 are marked as spared.',
      },
    },
    {
      id: 'nnt',
      type: 'numeric',
      title: 'How many people must take it?',
      gen: (rng) => {
        const [without, withIt, years, what] = rng.pick(TREATMENTS);
        const diff = without - withIt;
        const answer = 100 / diff;
        const relative = Math.round((diff / without) * 100);
        return {
          text: `
            An advert says that a medicine "cuts the risk of a ${what} by ${relative}%". The trial behind it: over ${years} years, **${without} in 100** people who did not take it had a ${what}, and **${withIt} in 100** people who took it.

            **How many people have to take the medicine for ${years} years to prevent one ${what}?**
          `,
          answer,
          unit: 'people',
          wrong: [
            [diff, `That is how many are spared in every 100 who take it. If 100 people must take it to spare ${diff}, how many to spare one?`],
            ...(withIt !== answer && withIt !== diff ? [[withIt, `That is how many still have a ${what} in spite of the medicine.`]] : []),
          ],
          hints: [`Of every 100 people who take it, ${without} − ${withIt} = ${diff} are spared a ${what}.`, `100 people for ${diff} spared: 100 ÷ ${diff} for each one.`],
          explain: r`
            In 100 people the medicine prevents $${without} - ${withIt} = ${diff}$, so one ${what} is prevented for every $100 \div ${diff} = ${num(answer)}$ people who take it. This is the **number needed to treat**.

            The other ${num(answer - 1)} take it for ${years} years without that benefit, though nobody can know in advance which they are. That is not an argument against the medicine. It is the number to weigh against its side effects and cost, and "${relative}%" hides it.
          `,
        };
      },
    },
    {
      id: 'confounding',
      type: 'interact',
      graded: false,
      title: 'Who chooses the pill?',
      text: `
        Forty people, placed by a health score. A supplement is on offer that, in this model, does **nothing at all**.

        First **let them choose** whether to take it, three times or more, and watch the gap between takers and non-takers. Then decide by **coin toss**, three times or more.
      `,
      widget: {
        type: 'assign-lab', count: 40, effect: 0, methods: ['choice', 'coin'], repeat: 0, reveal: 'shown',
        labels: { treat: 'supplement', control: 'no supplement', trait: 'health-minded', outcome: 'health score', unit: 'points', people: 'people' },
        alt: 'Forty people as dots on a health-score axis; half of them are marked as health-minded. Buttons split them into takers and non-takers of a supplement, by their own choice or by coin toss, and show the two group averages.',
      },
      check: (s) => {
        if (s.runs.choice >= 3 && s.runs.coin >= 3) return true;
        if (s.runs.choice < 3) return `Press "Let them choose" at least 3 times (${s.runs.choice} so far).`;
        return `Now press "Toss a coin for each" at least 3 times (${s.runs.coin} so far).`;
      },
      solution: { runs: { choice: 3, coin: 3 } },
      explain: `
        When people choose, the takers come out well ahead, although the pill does nothing: health-minded people (who also exercise, smoke less and see doctors sooner) are the ones who buy supplements. The pill gets the credit for everything else they do. With the coin toss, the gap all but disappears.
      `,
    },
    {
      id: 'teach-confounder',
      type: 'info',
      title: 'A hidden third thing',
      text: `
        A hidden third factor that drives two things at once is a **confounder**. In the model it was being health-minded: it led people to the supplement, and it gave them their better scores.

        A coin toss cannot know who is health-minded, so it spreads such people roughly evenly between the groups. That is the whole point of a **randomised** trial.

        :::example Another confounder
        Suppose a survey finds that people who carry a lighter get lung cancer more often. Lighters do not cause cancer: **smoking** drives both.
        :::

        When two things go together, ask what third thing could push both up at once, and whether the cause might run the other way round.
      `,
    },
    {
      id: 'spot-confounder',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const c = rng.pick(CONFOUNDED);
        return {
          text: `${c.finding}\n\nThe pattern is real. **What is the most likely explanation?**`,
          columns: 1,
          options: [
            { text: c.third, correct: true },
            { text: c.direct, why: 'That is the tempting reading. But two things that rise together may both be driven by something else, and here there is an obvious candidate.' },
            { text: c.reverse, why: 'Checking whether the cause runs the other way is a good habit. Here it does not hold up.' },
            { text: 'It is a coincidence, and would vanish in a bigger study', why: 'The pattern is real and would show up again. It is the explanation that is in question, not the pattern.' },
          ],
          hints: ['Look for a third thing that could push both of them up at once.'],
          explain: `${c.third}. ${c.note}\n\nTwo things that go together are **correlated**. That one **causes** the other is a further claim, and it needs better evidence than the correlation: ideally, a trial in which chance decides who gets what.`,
        };
      },
    },
    {
      id: 'teach-ladder',
      type: 'info',
      title: 'A ladder of evidence',
      text: `
        Not all evidence weighs the same. For the question "does this treatment work in people?", it comes on a ladder.

        - **A story** is one person, with no comparison.
        - **Cells and animals** are not people: most treatments that work in a dish fail in humans.
        - **Observing** what people choose to do is open to confounding.
        - **A randomised trial** removes the confounding.
        - **A review** that pools all the good trials guards against the one fluke result.
      `,
      figure: LADDER,
    },
    {
      id: 'ladder',
      type: 'order',
      review: true,
      title: 'A ladder of evidence',
      text: 'Not all evidence weighs the same. **Order these from the weakest evidence that a treatment works in people to the strongest.**',
      items: EVIDENCE_LADDER,
      labels: ['Weakest', 'Strongest'],
      explain: `
        A story is one person, with no comparison. Cells and mice are not people: most treatments that work in a dish fail in humans. Observing what people choose is open to confounding. A randomised trial removes it, and a review of **all** the good trials guards against the one fluke result.

        Every rung has its uses. Smoking was shown to cause cancer without a single randomised trial, by many kinds of evidence pointing the same way. But a headline that rests on a low rung has earned less of your trust.
      `,
    },
    {
      id: 'chance',
      type: 'interact',
      graded: false,
      title: 'Twenty studies of nothing',
      text: `
        Each tile is a small study of a remedy that does **nothing**. By convention a result counts as a "discovery" if chance alone would produce one that strong less than 5% of the time.

        **Run the 20 studies.** Then run **20 more rounds** and see how often at least one study "discovers" an effect.
      `,
      widget: {
        type: 'many-tests', mode: 'wall', tests: 20, columns: 5, alpha: 0.05, batches: [1, 20], noun: 'studies',
        alt: 'A wall of twenty tiles, each a study of a remedy with no effect. Buttons run the studies, and tiles whose result looks significant light up.',
      },
      check: (s) => s.batches >= 21 || (s.batches === 0 ? 'Press the button to run the 20 studies.' : 'Now press the button that runs 20 rounds at once.'),
      solution: { batches: 21 },
      explain: `
        About two rounds in three contain at least one "discovery", and nothing was there to discover. Test enough things, or run enough small studies, and chance will hand you a result.

        The study that "found something" is the one that gets the headline. That is why single small studies deserve caution, and why results count for more once other teams have repeated them. *Statistical Inference* goes into this in depth.
      `,
    },
    {
      id: 'surrogate',
      type: 'choice',
      tone: 'sober',
      title: 'The number that got better',
      text: `
        People with more HDL, the so-called good cholesterol, have fewer heart attacks. So a drug was developed that raised HDL by about ${TORCETRAPIB.hdlRisePct}%, and lowered LDL as well. On the blood tests it looked superb.

        Then it was tested for what matters, in a trial of ${thousands(TORCETRAPIB.people)} people. The trial was stopped early: **more** people were dying among those given the drug than among those who were not.

        **What is the lesson?**
      `,
      columns: 1,
      options: [
        { text: 'Improving a test result is not the same as improving health: a treatment must be judged by what happens to people', correct: true },
        { text: 'Blood tests are unreliable', why: 'The tests measured HDL correctly, and it did rise. The mistake was to assume that moving the number would move the disease.' },
        { text: 'Trials are too dangerous to run', why: 'Without the trial, the drug would have gone to millions of people on the strength of its blood results. The trial is what caught the harm.' },
        { text: 'Cholesterol has nothing to do with heart disease', why: 'Lowering LDL cholesterol does prevent heart attacks, as dozens of trials have shown. It was the shortcut through HDL that failed.' },
      ],
      explain: `
        A measurement that stands in for the real outcome is called a **surrogate**: a cholesterol level in place of heart attacks, a scan in place of survival. Surrogates are quick and convenient, and sometimes they mislead.

        So when a claim says that something "improves markers of" health, "supports healthy levels" or "boosts" some number, ask what it does to the thing itself.
      `,
    },
    {
      id: 'red-flags',
      type: 'bucket',
      review: true,
      title: 'Red flags',
      text: 'Health products are sold with a familiar set of phrases. Words that cannot be tested, secrecy and stories in place of trials are warning signs. A fair comparison, large numbers and openness are good signs. **Sort these.**',
      buckets: ['Warning sign', 'Good sign'],
      items: [
        { text: '"Detoxes your body in seven days"', bucket: 0, why: 'No toxin is ever named. Your liver and kidneys remove waste products continuously, and no product has been shown to help them.' },
        { text: '"Boosts your immune system"', bucket: 0, why: 'The immune system is not a muscle to be pumped up, and an overactive one causes allergies and autoimmune disease. The phrase has no measurable meaning.' },
        { text: '"The cure doctors do not want you to know about"', bucket: 0, why: 'A treatment that worked would make careers and fortunes for the doctors who proved it. Secrecy is a sales pitch.' },
        { text: 'Dozens of glowing personal stories', bucket: 0, why: 'Stories are the lowest rung of the ladder: no comparison, and nobody collects the stories of the people it did not help.' },
        { text: 'One natural remedy for arthritis, diabetes and cancer', bucket: 0, why: 'Diseases with different causes do not share a cure. And "natural" says nothing about safety: many poisons are natural.' },
        { text: 'Tested against a dummy pill in a randomised trial of 4,000 people', bucket: 1 },
        { text: 'States who paid for the research, and lists side effects', bucket: 1, why: 'Every real treatment has side effects, and honest sources say who funded the work.' },
        { text: 'A review of all the trials reached the same conclusion', bucket: 1 },
      ],
      explain: `
        Warning signs: vague words that cannot be tested ("detox", "boost", "cleanse"), secrecy, testimonials in place of trials, "natural" used to mean "safe", and one product for everything.

        Good signs: a fair comparison, large numbers, openness about funding and harms, and agreement between independent studies.
      `,
    },
    {
      id: 'who-says',
      type: 'choice',
      title: 'What a label has to prove',
      text: `
        A bottle of capsules in a shop says: "Supports heart health."

        In many countries, including the United States and those of the European Union, such products are sold as food supplements, and the law treats a supplement as a food, not as a medicine. **What did the maker have to show before selling it?**
      `,
      columns: 1,
      options: [
        { text: 'Nothing like what a medicine must show: supplements are regulated as foods, with no trials needed to prove that they work', correct: true },
        { text: 'That it prevents heart disease in randomised trials', why: 'That is the standard for a medicine. Careful wording such as "supports" is chosen because it does not claim to treat or prevent a disease.' },
        { text: 'That it works as well as the medicines doctors prescribe', why: 'No comparison with medicines is required, or usually made.' },
        { text: 'That doctors recommend it', why: 'No such approval is needed.' },
      ],
      explain: `
        A medicine must prove in trials that it works and that it is acceptably safe **before** it is sold. A supplement, in most countries, need only be safe to eat and avoid claiming to cure disease. The rules on wording differ from place to place: the European Union, for example, allows only health claims from an approved list.

        Better places to look than a label or a headline: your national health service or health ministry, the World Health Organization, and **Cochrane**, which publishes plain-language summaries of all the trials on a question.
      `,
    },
    {
      id: 'toolkit',
      type: 'info',
      title: 'Three questions to keep',
      text: `
        The next time a health claim catches your eye, try asking:

        1. **Out of how many?** What is the change in absolute numbers?
        2. **How do they know?** A story, mice, people observed, or people in a randomised trial? How many, and has anyone repeated it?
        3. **Who says, and who gains?** Who paid, who is selling, and do independent sources agree?

        And when the experts change their advice, it is usually not a scandal. Stomach ulcers were blamed on stress until two Australian doctors showed in the 1980s that a bacterium causes most of them, and ulcers became curable with antibiotics. Advice that updates when better evidence arrives is science working as it should.
      `,
      cta: 'Finish the course',
    },
  ],
  recap: [
    'A change in risk has two faces: **relative** ("18% more") and **absolute** ("1 more person in 100"). Always ask "out of how many?"',
    'Things that go together need not cause each other: a hidden third factor, a **confounder**, may drive both. Randomised trials are how confounders are removed.',
    'Evidence comes on a ladder, from one person\'s story up to reviews of all the trials. Small single studies throw up flukes; improving a lab number is not the same as improving health.',
    'Be wary of "detox", "boosts immunity", secret cures and testimonials. Supplements are not tested like medicines.',
  ],
  next: 'That completes *Staying Well*: how infections spread and are stopped, how to use medicines, which numbers to know, and how to weigh a claim. The next course is the one for the minutes when prevention has run out: **First Aid: When Minutes Matter**.',
};
