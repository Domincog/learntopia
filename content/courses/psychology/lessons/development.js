// Psychology: How Minds Work · Lesson 6 · Growing a Mind
//
// Driving question: how does a baby who thinks a hidden toy has vanished become a child who can tell what you are thinking?
// Sources for the facts are noted in ../helpers.js.
import { STAGES, STAGE_BEHAVIOURS, DEV_YEARS, HARLOW, ATTACHMENT, LANGUAGE, PEERS, TWINS, MARSHMALLOW, ZONE_CASES, HERITABLE } from '../helpers.js';

/* The Sally-Anne story in four panels. Sally is drawn as a circle on a square body, Anne as a circle on a triangle. */
const person = (x, who) => (who === 'sally'
  ? `<rect class="fill-blue-soft stroke-ink" stroke-width="2.5" x="${x - 9}" y="50" width="18" height="26" rx="4"/><circle class="fill-blue-soft stroke-ink" stroke-width="2.5" cx="${x}" cy="38" r="10"/><text class="fig-label-sm" x="${x}" y="22" text-anchor="middle">Sally</text>`
  : `<path class="fill-orange-soft stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M${x} 50L${x + 12} 76H${x - 12}Z"/><circle class="fill-orange-soft stroke-ink" stroke-width="2.5" cx="${x}" cy="38" r="10"/><text class="fig-label-sm" x="${x}" y="22" text-anchor="middle">Anne</text>`);
const panel = (col, row, n, caption, { sally, ball, arrow = false, ask = false }) => `
  <g transform="translate(${col * 170} ${row * 150})">
    <rect class="fill-surface stroke-hair" stroke-width="2" x="4" y="4" width="162" height="142" rx="10"/>
    <text class="fig-label" x="16" y="24">${n}</text>
    ${sally ? person(52, 'sally') : ''}${person(122, 'anne')}
    <path class="fill-none stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M32 88H72L66 114H38Z"/>
    <rect class="fill-none stroke-ink" stroke-width="2.5" x="104" y="88" width="36" height="26" rx="2"/>
    <circle class="fill-red stroke-ink" stroke-width="2" cx="${ball === 'basket' ? 52 : 122}" cy="104" r="7"/>
    ${arrow ? '<path class="fill-none stroke-ink" stroke-width="2" stroke-dasharray="4 4" d="M60 100Q88 70 114 100"/>' : ''}
    ${ask ? '<text class="fig-label-lg" x="76" y="50" text-anchor="middle">?</text>' : ''}
    <text class="fig-label-sm" x="85" y="134" text-anchor="middle">${caption}</text>
  </g>`;
const SALLY_ANNE = {
  type: 'svg', viewBox: '0 0 340 300', maxWidth: 460,
  content: panel(0, 0, 1, 'Sally hides her ball', { sally: true, ball: 'basket' })
    + panel(1, 0, 2, 'Sally goes out', { sally: false, ball: 'basket' })
    + panel(0, 1, 3, 'Anne moves the ball', { sally: false, ball: 'box', arrow: true })
    + panel(1, 1, 4, 'Sally comes back', { sally: true, ball: 'box', ask: true }),
  alt: 'A story in four pictures. One: Sally puts a ball into a basket while Anne watches; a box stands beside it. Two: Sally leaves. Three: Anne moves the ball from the basket into the box. Four: Sally comes back, with a question mark beside her.',
};

/* Three mountains, seen from one side of the table: a tall one with a snow cap, a middle one with a flag, a low one with a hut. */
const PEAKS = {
  tall: (x) => `<path class="fill-gray-soft stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M${x - 42} 120L${x} 22L${x + 42} 120Z"/><path class="fill-surface stroke-ink" stroke-width="2" stroke-linejoin="round" d="M${x - 12} 50L${x} 22L${x + 12} 50L${x + 4} 44L${x - 3} 52Z"/>`,
  mid: (x) => `<path class="fill-green-soft stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M${x - 36} 120L${x} 58L${x + 36} 120Z"/><path class="stroke-ink fill-red" stroke-width="2" stroke-linejoin="round" d="M${x} 58V36M${x} 36L${x + 14} 41L${x} 46"/>`,
  low: (x) => `<path class="fill-orange-soft stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M${x - 32} 120L${x} 84L${x + 32} 120Z"/><path class="fill-surface stroke-ink" stroke-width="2" stroke-linejoin="round" d="M${x - 7} 84V74L${x} 67L${x + 7} 74V84Z"/>`,
};
const NAMES = { tall: 'a tall peak with snow', mid: 'a middle-sized peak with a flag', low: 'a low hill with a hut' };
const view = (order, extra = {}) => ({
  type: 'svg', viewBox: '0 0 260 132', maxWidth: 300,
  content: `<line class="stroke-ink" stroke-width="3" stroke-linecap="round" x1="8" y1="121" x2="252" y2="121"/>${order.map((k, i) => PEAKS[k](56 + i * 74)).join('')}`,
  alt: `Three mountains on a table. From left to right: ${order.map((k) => NAMES[k]).join(', ')}.`,
  ...extra,
});
const MINE = ['low', 'tall', 'mid'];

const stageName = (id) => { const st = STAGES.find((x) => x.id === id); return `${st.name} (${st.ages})`; };

export default {
  id: 'development',
  steps: [
    {
      id: 'pour',
      type: 'interact',
      graded: false,
      title: 'You are the experimenter',
      text: `
        Start with a famous experiment, with you in charge. Glasses A and B hold the same amount of juice, and both children agree that they do.

        **Pour glass B into the tall glass. Then ask each child** whether the two glasses now hold the same amount. You can pour it back and ask again.
      `,
      widget: { type: 'pour-task', alt: 'Two identical wide glasses of juice, A and B, and an empty tall, thin glass, on a table.' },
      check: (s) => {
        if (s.complete) return true;
        if (!s.poured && !s.afterYoung && !s.afterOld) return 'Pour glass B into the tall glass first.';
        return `Now ask the ${s.afterYoung ? 'seven' : 'four'}-year-old${s.poured ? '' : ' (with the juice in the tall glass)'}.`;
      },
      solution: { poured: true, asked: ['after-4', 'after-7'] },
      explain: `
        The four-year-old watched you pour and still says the tall glass has **more**. The seven-year-old knows the amount is unchanged: "you only poured it".

        Knowing that pouring changes nothing is called **conservation**. The younger child fixes on one striking feature, the height, and cannot yet run the pouring backwards in her head. It is not simply a lack of attention or of words: ask again tomorrow and you will most likely get the same answer.
      `,
    },
    {
      id: 'teach-stages',
      type: 'info',
      title: 'Children think differently',
      text: `
        That test was devised by Jean Piaget. Watching his own three children in the 1920s and 30s, he concluded that children are not small adults who know less. They **think differently**, and their mistakes show how. He described four stages.

        ${STAGES.map((st, i) => `${i + 1}. **${st.name}** (${st.ages}): ${st.mark}.`).join('\n        ')}

        Knowing that hidden things still exist is called **object permanence**. Drop a cloth over a toy, and a young baby acts as if the toy were gone. From about eight or nine months, babies search for it.

        (All the ages in this lesson are typical ones. Healthy children vary a great deal.)
      `,
    },
    {
      id: 'hook',
      type: 'choice',
      title: 'Out of sight',
      text: `
        A six-month-old baby is reaching eagerly for a toy. You drop a cloth over the toy, in full view. **What does the baby typically do?**
      `,
      columns: 1,
      options: [
        { text: 'Stops reaching and looks away, as if the toy were gone', correct: true },
        { text: 'Pulls the cloth off to get the toy', why: 'Babies do this a few months later, typically from about eight or nine months. At six months most do not.' },
        { text: 'Cries until the toy is uncovered', why: 'Usually not: most simply lose interest, as if there were nothing left to want.' },
      ],
      explain: `
        Piaget concluded that for a young baby an object out of sight has stopped existing. Only later in the first year do babies search, showing **object permanence**.
      `,
    },
    {
      id: 'stages',
      type: 'order',
      title: 'Piaget\'s four stages',
      text: 'Piaget described the growth of thinking as four stages, each with its own way of thinking. **Put them in order, from birth onwards.**',
      items: STAGES.map((st) => `**${st.name}**: ${st.mark}`),
      labels: ['First', 'Last'],
      explain: `
        | Stage | Typical ages |
        |---|---|
        ${STAGES.map((st) => `| ${st.name} | ${st.ages} |`).join('\n        ')}

        The order has held up. The neat steps have not: change is **gradual**, differs from task to task, and depends on teaching and culture.

        And Piaget underrated babies. When Renée Baillargeon (${DEV_YEARS.baillargeon}) measured how long infants *look*, instead of whether they reach, babies of three to five months stared longer at "impossible" events, such as a screen swinging through the place where a box had been hidden. They seem to know the box is still there, months before they can search for it.
      `,
    },
    {
      id: 'stage-pick',
      type: 'match',
      review: true,
      gen: (rng) => ({
        pairs: rng.shuffle(STAGES.map((st) => [rng.pick(STAGE_BEHAVIOURS[st.id]), stageName(st.id)])),
      }),
      text: 'Piaget\'s stages: sensorimotor, preoperational, concrete operational, formal operational. **Match each observation with the stage it is typical of.**',
      explain: `
        ${STAGES.map((st) => `**${st.name}** (${st.ages}): ${st.mark}.`).join('\n\n        ')}
      `,
    },
    {
      id: 'mountains',
      type: 'choice',
      title: 'Three mountains',
      text: `
        Another of Piaget's tasks, for you to try. A model of three mountains stands on a table. **The picture shows what you see from your chair.** A doll sits on the opposite side of the table, facing you.

        **Which picture shows what the doll sees?**
      `,
      figure: view(MINE, { caption: 'Your view' }),
      shuffle: false,
      options: [
        { text: '', figure: view(MINE), why: 'That is your own view again. From the far side, left and right are swapped.' },
        { text: '', figure: view(['mid', 'tall', 'low']), correct: true },
        { text: '', figure: view(['tall', 'low', 'mid']), why: 'The tall peak stays in the middle from both sides. Only the two outer ones change places.' },
      ],
      explain: `
        From the far side, what is on your left is on the doll's right. Asked this, most children under about seven choose **their own view** (Piaget and Inhelder, ${DEV_YEARS.mountains}). Piaget called it **egocentrism**: not selfishness, but difficulty in setting one's own viewpoint aside.

        Later researchers showed that the task matters. With a simpler, more familiar set-up (hiding a doll from a toy policeman), most four-year-olds manage it.
      `,
    },
    {
      id: 'teach-theory-of-mind',
      type: 'info',
      title: 'Other people have other minds',
      text: `
        Something else changes at about four. To a younger child, what she knows is simply what everyone knows. She has not yet grasped that another person can hold a belief that is **false**.

        Researchers test this with a **false-belief task**: a story in which a character misses a change that the child has seen. To answer, the child must keep two things apart: what is true, and what the character thinks.

        - Under about four, most children answer with what they themselves know to be true.
        - From about four, in country after country, most answer with what the character believes.

        Understanding that other people have minds, with their own beliefs and wishes, is called **theory of mind**.
      `,
    },
    {
      id: 'sally',
      type: 'fill',
      review: true,
      title: 'Where will Sally look?',
      text: `
        Children watch this short story, acted with dolls, and are asked one question: **"Where will Sally look for her ball?"** Complete what researchers find.
      `,
      figure: SALLY_ANNE,
      template: `
        Most three-year-olds answer [[the basket|*the box]], which is where the ball really is.

        Most five-year-olds answer [[*the basket|the box]], which is where Sally believes it is.

        The older children understand that another person can hold a belief that is [[true|*false]].
      `,
      explain: `
        To pass, a child must keep two things apart: what is true, and what Sally thinks. This **false-belief task** (Wimmer and Perner, ${DEV_YEARS.wimmer}; the Sally and Anne version, ${DEV_YEARS.sallyAnne}) is passed at about age ${DEV_YEARS.falseBeliefAge}, in country after country.

        The ability it taps is called **theory of mind**. Between the baby and the five-year-old lies the discovery that other people see, know and believe different things.
      `,
    },
    {
      id: 'zone',
      type: 'choice',
      title: 'Just out of reach',
      columns: 1,
      gen: (rng) => {
        const z = rng.pick(ZONE_CASES);
        return {
          text: `
            The Russian psychologist Lev Vygotsky stressed something Piaget played down: children learn **with other people**. He held that learning is fastest in the gap between what a child manages alone and what the child manages with a little help.

            ${z.child} can ${z.alone} without help. ${z.child} can ${z.helped}. ${z.child} cannot yet ${z.beyond}, even with help.

            **According to Vygotsky, which task teaches ${z.child} the most?**
          `,
          options: [
            { text: `To ${z.helped}`, correct: true },
            { text: `To ${z.alone}`, why: `${z.child} can already do this alone. It is good practice, but nothing new is being built.` },
            { text: `To ${z.beyond}`, why: `This is still out of reach even with help, so help has nothing to hold on to yet.` },
          ],
          explain: `
            The middle task sits in the gap between "alone" and "not yet": Vygotsky's "zone of proximal development". The helper's support (often called scaffolding) is taken away bit by bit as the skill grows.

            It works for adults too. This course tries to stay in that zone for you.
          `,
        };
      },
    },
    {
      id: 'harlow',
      type: 'interact',
      mode: 'predict',
      tone: 'sober',
      title: 'What is a mother for?',
      text: `
        In the 1950s most psychologists held that a baby loves its mother because she feeds it. In ${HARLOW.year} Harry Harlow tested this on infant monkeys, raised apart from their mothers with two stand-ins: one of **bare wire, which held the milk bottle**, and one **covered in soft cloth, which gave no milk**.

        **Drag the bars: how many hours a day did the infants spend on each?**
      `,
      widget: {
        type: 'bars', adjust: true, step: 1, yMax: 24, yStep: 6, yLabel: 'hours a day',
        data: [{ label: 'Wire, with milk', value: 12, color: 'gray' }, { label: 'Cloth, no milk', value: 12, color: 'orange' }],
        alt: 'Two adjustable bars showing hours a day spent on the wire stand-in that gave milk and on the cloth stand-in that gave none.',
      },
      check: (s) => s.values[0][1] > s.values[0][0] + 6,
      solution: { values: [[HARLOW.wire, HARLOW.cloth]] },
      explain: `
        About **${HARLOW.cloth} hours a day on the cloth**, and about ${HARLOW.wire} on the wire, just long enough to feed. When something frightened them, they ran to the cloth. Comfort and safety, not food, were what bound them.

        The finding helped to change how hospitals and children's homes treated infants, and it supported John Bowlby's theory of **attachment**: a baby needs a dependable person to return to. It came at a price. The monkeys were harmed for life by their isolation, and experiments like these would not be approved today.
      `,
    },
    {
      id: 'teach-attachment',
      type: 'info',
      title: 'Watching attachment',
      text: `
        Mary Ainsworth devised a way to observe attachment in one-year-olds: a caregiver leaves the room for a few minutes and returns, and researchers watch how the child reacts. Most children are easily comforted and go back to playing (a **secure** pattern); some avoid the caregiver, and some stay upset.

        An analysis of ${ATTACHMENT.samples} samples from ${ATTACHMENT.countries} countries (${ATTACHMENT.year}) found the secure pattern to be the commonest one everywhere, with more variation inside countries than between them.

        What is seen is one relationship, on one day, in an unfamiliar room. A child's temperament, the family's situation and what is normal in their culture all shape it. A pattern can change as circumstances change, and its links with adult life are modest.
      `,
    },
    {
      id: 'attachment',
      type: 'multi',
      title: 'Reading attachment research with care',
      text: `
        Ainsworth's procedure is often misread. **Which statements are accurate?**
      `,
      columns: 1,
      options: [
        { text: 'The secure pattern is the most common one in every country studied', correct: true },
        { text: 'The mix of patterns differs between cultures, and differs even more between groups within one country', correct: true },
        { text: 'A pattern seen at age one can change as a child\'s circumstances change', correct: true },
        { text: 'The procedure measures how good a parent is', why: 'It describes one relationship on one day in an unfamiliar room. A child\'s temperament, the family\'s situation and what is normal in their culture all shape what is seen. It was not built to grade parents and cannot do so.' },
        { text: 'The pattern at age one settles how a person\'s adult relationships will go', why: 'Links between infant patterns and adult life exist but are modest. Later relationships and circumstances matter a great deal.' },
      ],
      explain: `
        Attachment research describes how relationships tend to work. It is not a test, a diagnosis or a forecast for any one child, and a parent with a worry is better served by a health professional than by a chart.
      `,
    },
    {
      id: 'language',
      type: 'fill',
      title: 'Learning to talk',
      text: `
        No one teaches babies their first language; they work it out. One finding shows how early the work starts.

        At six months, babies in English-speaking homes could hear sound contrasts that are used in Hindi and not in English. By ten to twelve months they no longer noticed them (Werker and Tees, ${LANGUAGE.narrowing}).

        **Complete what that shows.**
      `,
      template: `
        Young babies can tell apart the speech sounds of [[only one language|*any language]].

        By about their first birthday, that ability has [[widened|stayed the same|*narrowed]] to the sounds of [[*their home language|no language]].
      `,
      explain: `
        Babies start as "citizens of the world" and tune in to what they hear. At around six months, babies everywhere begin to babble, and deaf babies who see sign language babble with their hands.

        A first language is learned most easily early in life. For later languages, a study of ${Math.round(LANGUAGE.people / 1000)},000 people found that the knack for picking up grammar stays strong until about ${LANGUAGE.declineAge} and then declines slowly. Adults still learn languages well; they just rarely end up sounding native.
      `,
    },
    {
      id: 'teen',
      type: 'multi',
      title: 'The teenage years',
      text: `
        Two findings about adolescence.

        - In a driving-game study (${PEERS.year}), 13- to 16-year-olds took far more risks with friends in the room than alone. Adults drove the same either way.
        - The brain goes on maturing through the teens and well into the twenties, and the change slows down gradually.

        **Which statements fit those findings?**
      `,
      columns: 1,
      options: [
        { text: 'The extra risk-taking of the teens shows up above all in company', correct: true },
        { text: 'For the brain, growing up runs well past the eighteenth birthday', correct: true },
        { text: 'The brain is finished at exactly 25', why: 'No study shows a finishing line. Change slows gradually, at different times in different people and different parts of the brain, and some of it continues for life. "25" is a popular rounding, not a finding.' },
        { text: 'Teenagers take risks because they cannot understand danger', why: 'Then they would take them alone as well. By their mid-teens people reason about risks, in calm conditions, about as well as adults. The difference shows in the heat of the moment, above all in company.' },
      ],
      explain: `
        Sensitivity to rewards and to peers peaks in the teens, while the brain systems for self-control mature more slowly, into the twenties.

        That is not a design fault. Leaving the family, trying things and joining a group of equals are what adolescence is for.
      `,
    },
    {
      id: 'teach-heritability',
      type: 'info',
      title: 'What "heritable" means',
      text: `
        Genes or surroundings? For nearly everything about people the answer is both. Researchers compare identical twins with non-identical twins to estimate how **heritable** a trait is: how much of the *differences between individuals* in a population go with differences in their genes.

        :::example
        Suppose the heritability of height among the plants in one field is 70%. That says most of the differences **between those plants** go with genetic differences.

        It does not say that 70% of each plant comes from its genes. And it does not say the plants could not all grow taller in better soil.
        :::

        Heritability describes a population in its present conditions, never one individual.
      `,
    },
    {
      id: 'heritability',
      type: 'choice',
      review: true,
      title: 'Nature and nurture',
      columns: 1,
      gen: (rng) => {
        const t = rng.pick(HERITABLE);
        return {
          text: `
            By comparing identical twins with non-identical twins, researchers estimate how **heritable** a trait is. In the populations studied, the heritability of **${t.trait}** is about ${t.pct}%.

            **What does that figure mean?**
          `,
          options: [
            { text: `About ${t.pct}% of the differences between people in that population go with differences in their genes`, correct: true },
            { text: `About ${t.pct}% of each person's ${t.trait} comes from genes, and the rest from surroundings`, why: 'Heritability describes a population, not a person. In one individual, genes and surroundings cannot be separated into shares, any more than the area of a rectangle can be split into "the part due to its width".' },
            { text: `About ${t.pct}% of people inherit their ${t.trait} from their parents`, why: 'It is not a count of people. It describes how much of the spread across a population is linked to genetic differences.' },
            { text: `${t.trait.charAt(0).toUpperCase()}${t.trait.slice(1)} is ${t.pct}% fixed, whatever the surroundings`, why: 'Heritability says nothing about what can change. Height is highly heritable, and average height has still risen a great deal with better food and health.' },
          ],
          explain: `
            Heritability is a statistic about **differences within one population in its present conditions**. Change the conditions and the figure changes. A huge review of twin studies (${TWINS.traits.toLocaleString('en')} traits, ${TWINS.year}) found an average of about ${TWINS.heritability}%: for nearly everything about people, both genes and surroundings matter, and neither is the whole story.
          `,
        };
      },
    },
    {
      id: 'marshmallow',
      type: 'choice',
      title: 'The marshmallow test',
      text: `
        Around 1970, preschool children were offered one treat now or two if they could wait. Follow-ups reported that those who waited longer did better at school years later, and "self-control at four predicts success" became famous.

        In ${MARSHMALLOW.year} the study was repeated with ${MARSHMALLOW.children} children from a much wider range of families. The link was about half as strong, and most of it disappeared once family background and early abilities were taken into account.

        **What is the fairest conclusion?**
      `,
      columns: 1,
      options: [
        { text: 'How long a child waited mostly reflected things already known to matter, such as the family\'s circumstances', correct: true },
        { text: 'Self-control at four decides how a child will do at school', why: 'A link half as strong, most of which goes once background is allowed for, cannot carry a claim that large.' },
        { text: 'Waiting for a treat has nothing at all to do with later results', why: 'A modest link was there. It was allowing for background that took most of it away.' },
      ],
      explain: `
        The original follow-ups involved fewer than a hundred children, all from one university's nursery: lesson 1's first question, "how many people?". In the larger study, how long a child waited mostly reflected things already known to matter: family income, the mother's education, the child's early skills.

        Waiting may also be sensible or not depending on experience: a child who has learned that promised treats often fail to arrive is wise to eat the one in front of her.
      `,
    },
    {
      id: 'lifespan',
      type: 'interact',
      mode: 'predict',
      title: 'And at the other end of life?',
      text: `
        Development does not stop at twenty. Take a typical 25-year-old's scores as 100. **Drag the bars to show where you think a typical healthy 70-year-old stands** on speed of thinking (reacting, comparing things quickly) and on vocabulary.
      `,
      widget: {
        type: 'bars', adjust: true, step: 5, yMax: 140, yStep: 20, yLabel: '25-year-old = 100',
        data: [{ label: 'Speed of thinking', value: 100, color: 'blue' }, { label: 'Vocabulary', value: 100, color: 'green' }],
        alt: 'Two adjustable bars for a typical 70-year-old compared with a 25-year-old at 100: speed of thinking, and vocabulary.',
      },
      check: (s) => s.values[0][0] < 100 && s.values[0][1] >= 100,
      solution: { values: [[75, 110]] },
      explain: `
        Speed falls, steadily, from the twenties onwards. Vocabulary and general knowledge **hold up or keep growing** into the sixties and seventies. (The bars here are a sketch of that pattern, not exact data.) Different abilities peak at very different ages, so there is no single age at which a mind is "at its best".

        :::tip Optional, this week
        The next time you help someone learn something, whether a child, a friend or a colleague, look for the task they can just manage with you beside them. That is where Vygotsky would tell you to work.
        :::
      `,
    },
  ],
  recap: [
    'Children think differently from adults, not just less: a four-year-old really believes the taller glass holds more.',
    'Piaget\'s order of stages has held up; his ages were too cautious, and change is more gradual than his steps suggest.',
    'At about four, children grasp that other people can hold false beliefs (theory of mind).',
    'Heritability describes differences in a population, never the make-up of one person, and says nothing about what can change.',
  ],
  next: 'Next: other people. Would you say that two lines are equal when you can see that they are not?',
};
