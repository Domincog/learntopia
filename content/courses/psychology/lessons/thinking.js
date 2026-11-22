// Psychology: How Minds Work · Lesson 5 · Fast Answers, Slow Thoughts
//
// Driving question: when does a quick answer serve you, and when does it trap you?
// Sources for the facts are noted in ../helpers.js.
import { ANCHOR, LINDA, FRAMING, LOSS_AVERSION, WASON, DONATION, NUDGE, BIASES, BIAS_CASES, PEOPLE, pct } from '../helpers.js';

const UN_SHARE = pct(ANCHOR.african, ANCHOR.members);

const ABSTRACT_CARDS = {
  type: 'wason-cards',
  rule: 'If a card has a vowel on one side, it has an even number on the other.',
  cards: [
    { front: 'E', back: '8', note: 'A vowel, so its number mattered. It is even: the rule holds.' },
    { front: 'T', back: '5', note: 'A consonant. The rule says nothing about consonants.' },
    { front: '6', back: 'M', note: 'Even, with a consonant behind. Allowed: the rule never said even numbers need a vowel.' },
    { front: '3', back: 'A', note: 'Odd, with a vowel behind. **The rule is broken**, and only turning this card could show it.', breaks: true },
  ],
};
const CAFE_CARDS = {
  type: 'wason-cards',
  rule: 'If someone is drinking beer, they must be over 18.',
  cards: [
    { front: { text: 'Beer', sub: 'drinking' }, back: { text: '27', sub: 'age' }, note: 'Drinking beer, so the age mattered. 27: fine.' },
    { front: { text: 'Cola', sub: 'drinking' }, back: { text: '14', sub: 'age' }, note: 'Cola is allowed at any age.' },
    { front: { text: '30', sub: 'age' }, back: { text: 'Beer', sub: 'drinking' }, note: 'A 30-year-old may drink either.' },
    { front: { text: '16', sub: 'age' }, back: { text: 'Beer', sub: 'drinking' }, note: 'Sixteen, with a beer. **The rule is broken.**', breaks: true },
  ],
};
const cardCheck = (labels) => (s) => {
  const has = (i) => s.selected.includes(i);
  if (s.count === 0) return 'Choose the cards you would turn over.';
  if (has(0) && has(3) && s.count === 2) return true;
  if (has(2)) return `Think about the "${labels[2]}" card. Whatever is on its other side, could it break the rule?`;
  if (has(1)) return `The rule says nothing about "${labels[1]}". Whatever is behind it, the rule survives.`;
  return has(0) ? `"${labels[0]}" is needed. One more card could hide a rule-breaker.` : `"${labels[3]}" is needed. One more card must be checked too.`;
};

const SCREENS = [
  { thing: 'a rare condition', rel: 'who', people: 'people', has: 'have the condition', test: 'A screening test', pos: 'test positive', ask: 'they have the condition' },
  { thing: 'spam', rel: 'that', people: 'emails', has: 'are spam', test: 'A filter', pos: 'are flagged', ask: 'it is spam' },
  { thing: 'a forged ticket', rel: 'that', people: 'tickets', has: 'are forged', test: 'A scanner', pos: 'set off the alarm', ask: 'it is forged' },
  { thing: 'a faulty part', rel: 'that', people: 'parts', has: 'are faulty', test: 'A quality check', pos: 'fail the check', ask: 'it is faulty' },
];
const PURCHASES = [['bat', 'ball'], ['notebook', 'pen'], ['kettle', 'mug'], ['lamp', 'bulb']];

export default {
  id: 'thinking',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      graded: false,
      title: 'A number from nowhere',
      text: `
        Three quick things: spin a wheel of fortune, answer a higher-or-lower question, and make an estimate. It takes a minute, and what it was for is explained straight afterwards.
      `,
      widget: {
        type: 'anchor-wheel', anchors: [ANCHOR.low, ANCHOR.high], medians: [ANCHOR.lowMedian, ANCHOR.highMedian],
        question: 'the percentage of United Nations member countries that are in Africa', truth: UN_SHARE, source: `Tversky and Kahneman, ${ANCHOR.year}`,
      },
      check: (s) => s.done || (!s.spun ? 'Spin the wheel to begin.' : s.side == null ? 'Answer the higher-or-lower question.' : 'Type your estimate and press Reveal.'),
      solution: { anchor: ANCHOR.high, side: 'lower', estimate: 40, revealed: true },
      explain: `
        A wheel of fortune knows nothing about the United Nations, and everyone can see that. Yet in ${ANCHOR.year} the group that saw **${ANCHOR.low}** guessed ${ANCHOR.lowMedian}% and the group that saw **${ANCHOR.high}** guessed ${ANCHOR.highMedian}%. (Today the true figure is ${UN_SHARE}%: ${ANCHOR.african} of ${ANCHOR.members} members.)

        This is **anchoring**: a number met just before an estimate drags the estimate towards it. It is one of the sturdiest findings in psychology, repeated by dozens of laboratories. Not everyone is pulled on every question, and nobody can tell from the inside.
      `,
    },
    {
      id: 'k-words',
      type: 'choice',
      mode: 'predict',
      title: 'Easy to think of',
      text: `
        Take the letter **K**. In ordinary English text, which are there more of?
      `,
      columns: 1,
      options: [
        { text: 'Words with K as their third letter (like "make")', correct: true },
        { text: 'Words that begin with K (like "kite")', why: 'That is what most people say, because words are easy to call up by their first letter.' },
        { text: 'About the same number of each', why: 'There is a clear difference, though not in the direction most people guess.' },
      ],
      explain: `
        K turns up in third place more often (*ask, like, take, bike, joke…*). But try listing them: words come to mind by their first letter, not their third, so the K-words feel more numerous. About two thirds of people in the original study got this wrong.

        Judging how common something is by how easily examples come to mind is the **availability** shortcut. It is why risks that make vivid news feel bigger than quiet ones that harm far more people.
      `,
    },
    {
      id: 'linda',
      type: 'choice',
      mode: 'predict',
      title: 'Linda',
      text: `
        *Linda is 31, single, outspoken and very bright. She studied philosophy. As a student she cared deeply about discrimination and social justice, and took part in demonstrations.*

        **Which is more probable?**
      `,
      columns: 1,
      shuffle: false,
      options: [
        { text: 'Linda is a bank teller', correct: true },
        { text: 'Linda is a bank teller and is active in the feminist movement', why: 'It sounds more like her. But every bank teller who is a feminist is also a bank teller, so the second group cannot be the larger one.' },
      ],
      explain: `
        About ${LINDA.pct}% of students in the original study chose the second (${LINDA.year}). Yet "A and B" can never be more likely than "A" alone: feminist bank tellers are a part of all bank tellers.

        The second option wins because it **resembles** the description, and resemblance is quietly swapped in for probability. Psychologists call the shortcut representativeness, and this slip the **conjunction fallacy**.
      `,
    },
    {
      id: 'teach-shortcuts',
      type: 'info',
      title: 'Fast answers, slow checks',
      text: `
        The wheel, the letter K and Linda each caught a mental shortcut, or **heuristic**, at work: anchoring, availability and resemblance. A shortcut gives a fast, effortless answer. A slower, checking kind of thought has to be switched on to test it. The two styles are nicknamed **System 1** (fast) and **System 2** (slow).

        :::example Checking a quick answer
        A sandwich and a drink cost 70 cents together. The sandwich costs 50 cents more than the drink.

        - Quick answer: the drink costs 20. **Check:** then the sandwich costs 70 and the pair 90, not 70.
        - Slow answer: take the extra 50 off the total. That leaves 20 for two equal parts, so the drink costs **10** and the sandwich 60. Check: 10 + 60 = 70.
        :::
      `,
    },
    {
      id: 'bat-ball',
      type: 'numeric',
      review: true,
      title: 'Check the quick answer',
      gen: (rng) => {
        const [big, small] = rng.pick(PURCHASES);
        const cheap = rng.pick([5, 10, 15, 20, 25, 30]);
        const more = rng.pick([100, 200, 300]);
        const total = more + 2 * cheap;
        const quick = total - more;
        return {
          text: `
            A ${big} and a ${small} cost **${total} cents** together. The ${big} costs **${more} cents more** than the ${small}.

            **How many cents does the ${small} cost?**
          `,
          answer: cheap,
          unit: 'cents',
          wrong: [[quick, `That is the answer that jumps to mind. Check it: a ${small} at ${quick} would make the ${big} ${quick + more}, and the pair ${2 * quick + more} cents, not ${total}.`]],
          hints: [`Call the ${small}'s price x. Then the ${big} costs x + ${more}, and together they cost ${total}.`],
          explain: `${cheap} cents: the ${big} then costs ${cheap + more}, and ${cheap} + ${cheap + more} = ${total}. Most people's first thought is ${quick}, and many clever people give it. A fast, effortless answer arrives first; a slower, checking kind of thought has to be switched on to catch it.`,
        };
      },
    },
    {
      id: 'frame',
      type: 'choice',
      mode: 'predict',
      tone: 'sober',
      title: 'A or B?',
      shuffle: false,
      columns: 1,
      gen: (rng) => {
        const gain = rng.bool();
        const word = rng.pick(['Programme', 'Plan', 'Option']);
        const words = `${word.toLowerCase()}s`;
        const dead = FRAMING.people - FRAMING.sure;
        const a = gain ? `**${FRAMING.sure} people will be saved.**` : `**${dead} people will die.**`;
        const b = gain
          ? `There is a one-in-three chance that **all ${FRAMING.people} will be saved**, and a two-in-three chance that **nobody will be saved**.`
          : `There is a one-in-three chance that **nobody will die**, and a two-in-three chance that **all ${FRAMING.people} will die**.`;
        const sure = gain ? FRAMING.gainSure : FRAMING.lossSure;
        return {
          text: `
            A thought experiment from ${FRAMING.year}. Imagine an unusual disease is expected to kill ${FRAMING.people} people, and two ${words} are on offer.

            - **${word} A:** ${a}
            - **${word} B:** ${b}

            Which would you choose? There is no right answer.
          `,
          options: [
            { text: `${word} A`, why: `${sure}% of people given this wording chose A.` },
            { text: `${word} B`, why: `${100 - sure}% of people given this wording chose B.` },
          ],
          explain: `
            You saw one of two wordings, picked at random. Another reader sees ${word} A as "${gain ? `${dead} people will die` : `${FRAMING.sure} people will be saved`}". It is **the same ${word.toLowerCase()}**: ${FRAMING.sure} of ${FRAMING.people} live either way.

            When the sure option was worded as lives **saved**, ${FRAMING.gainSure}% chose it. Worded as **deaths**, ${FRAMING.lossSure}% did. Identical facts, opposite choices: a **framing effect**. People tend to play safe with gains and to gamble to avoid losses.
          `,
        };
      },
      options: [{ text: 'Programme A' }, { text: 'Programme B' }],
    },
    {
      id: 'loss',
      type: 'interact',
      title: 'Losses loom larger',
      text: `
        Daniel Kahneman and Amos Tversky's **prospect theory** (${LOSS_AVERSION.year}) draws how outcomes feel. The curve bends for gains (the second 100 thrills less than the first), and it is **steeper for losses**.

        **Set the slider so that losing 100 feels twice as bad as gaining 100 feels good.**
      `,
      widget: {
        type: 'plot', x: [-100, 100], y: [-180, 100], xStep: 50, yStep: 50, xLabel: 'loss or gain', yLabel: 'how it feels',
        params: { k: { min: 1, max: 3, step: 0.25, value: 1, label: 'weight of a loss', color: 'red' } },
        fns: [{ expr: 'x^0.88', color: 'green', from: 0, to: 100 }, { expr: '-k*(-x)^0.88', color: 'red', from: -100, to: 0 }],
        readouts: [{ label: 'gaining 100 feels like', expr: '100^0.88', digits: 0 }, { label: 'losing 100 feels like', expr: '-k*100^0.88', digits: 0 }],
        alt: 'A graph of how an outcome feels against its size. Gains rise along a gently bending green curve. Losses fall along a red curve whose steepness is set by a slider.',
      },
      target: { k: 2 },
      solution: { k: 2 },
      hints: ['Watch the two readouts: one should be twice the size of the other.'],
      explain: `
        With the weight at 2, a loss of 100 feels like −115 while a gain of 100 feels like +58. That is **loss aversion**, and it explains why most people turn down a coin toss that wins 110 or loses 100.

        How big the weight really is, is **debated**. Kahneman and Tversky estimated a little over 2; a 2024 review of some 600 estimates averaged close to 2; other researchers argue that for small, everyday stakes it is much nearer 1.
      `,
    },
    {
      id: 'wason',
      type: 'interact',
      graded: false,
      title: 'Four cards',
      text: `
        Each card has a letter on one side and a number on the other. **Which cards must you turn over to find out whether the rule is true?** Choose only the ones you need.
      `,
      widget: { ...ABSTRACT_CARDS, alt: 'Four cards showing E, T, 6 and 3, under the rule: if a card has a vowel on one side, it has an even number on the other.' },
      check: cardCheck(['E', 'T', '6', '3']),
      solution: { selected: [0, 3] },
      hints: ['A rule "if vowel, then even" can only be broken by a vowel paired with an odd number.', 'Which cards could be hiding that combination?'],
      explain: `
        **E and 3.** Only a vowel with an odd number breaks the rule, so only those two cards could expose it. The 6 cannot: whatever is behind it, the rule survives.

        Fewer than about one person in ten gets this right (Peter Wason, 1966). Nearly everyone picks E, and many add the 6, a card that can only *agree* with the rule.
      `,
    },
    {
      id: 'wason-social',
      type: 'interact',
      title: 'The same puzzle in a café',
      text: `
        Each card is a person: what they are drinking is on one side, their age on the other. **Which cards must you turn over to check that the rule is being kept?**
      `,
      widget: { ...CAFE_CARDS, alt: 'Four cards showing Beer, Cola, age 30 and age 16, under the rule: if someone is drinking beer, they must be over 18.' },
      check: cardCheck(['Beer', 'Cola', '30', '16']),
      solution: { selected: [0, 3] },
      explain: `
        **The beer drinker and the 16-year-old.** Only a beer in the hands of someone under 18 breaks the rule, so those are the two cards that could hide it. The logic is the same as with the letters and numbers.
      `,
    },
    {
      id: 'teach-confirmation',
      type: 'info',
      title: 'The same mind, a different costume',
      text: `
        Both puzzles have one logic: a rule "if this, then that" can only be broken by *this* together with *not that*. So the cards to turn are the ones that could hide that pair.

        With letters and numbers, fewer than about one person in ten finds them. As a café rule, about three in four do. People are not bad at logic in general. We are good at it where we have practice, such as spotting someone who breaks a social rule, and poor with bare symbols.

        Picking the 6, a card that can only agree with the rule, has a name. Looking for evidence that fits, and not for evidence that could refute, is **confirmation bias**.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 25, unit: '%', yLabel: 'chose the right cards',
        data: [
          { label: 'Letters and\nnumbers', value: WASON.abstractPct, color: 'gray' },
          { label: 'Café rule', value: WASON.socialPct, color: 'orange' },
        ],
        alt: `Bar chart of the share of people who choose the right two cards: about ${WASON.abstractPct} percent at most with letters and numbers, about ${WASON.socialPct} percent with the café rule.`,
        caption: 'Rounded: "fewer than one in ten" (Wason, 1966) and "about three in four" (Griggs and Cox, 1982).',
      },
    },
    {
      id: 'base-rate',
      type: 'interact',
      graded: false,
      title: 'One in a hundred',
      text: `
        A condition affects **1%** of people. A test picks up **90%** of those who have it, and wrongly flags **9%** of those who do not. Someone tests positive.

        Asked a question like this, many people, including many doctors, put the chance that the person has the condition at around 80%. **Step through the picture as far as "Positives only" and count.**
      `,
      widget: {
        type: 'icon-array', n: 1000, base: 0.01, sens: 0.9, fpr: 0.09, stage: 0, stages: true, answer: true,
        alt: 'A crowd of one thousand dots. Buttons reveal in turn who has the condition, who tests positive, and the positives alone.',
      },
      check: (s) => s.stage >= 3 || 'Keep going: press the buttons until you reach "Positives only".',
      solution: { stage: 3 },
      explain: `
        Of 1,000 people, 10 have the condition and 9 of them test positive. But 89 of the 990 healthy people test positive too. So of 98 positives only 9 are real: **about 9%**.

        The quick answer ignores how rare the condition is (**base-rate neglect**). Gerd Gigerenzer showed that the cure is in the wording: given percentages, people flounder; given counts of people ("9 out of 98"), far more get it right.
      `,
    },
    {
      id: 'ppv',
      type: 'numeric',
      review: true,
      title: 'Count, do not guess',
      gen: (rng) => {
        const c = rng.pick(SCREENS);
        const answer = rng.pick([10, 20, 25, 40, 50]);
        const hit = rng.pick([8, 10, 12, 16, 20]);
        const flagged = (hit * 100) / answer;
        const falseAlarms = flagged - hit;
        const have = hit + rng.pick([0, 2, 4]);
        const caught = Math.round((hit / have) * 100);
        return {
          text: `
            ${c.test} looks for ${c.thing}. Out of **1,000 ${c.people}**:

            - ${have} ${c.has}, and ${hit} of those ${c.pos};
            - of the other ${1000 - have}, ${falseAlarms} also ${c.pos}.

            One of the ${c.people} ${c.rel} ${c.pos} is picked at random. **What is the chance, in per cent, that ${c.ask}?**
          `,
          answer,
          unit: '%',
          tolerance: 0.5,
          wrong: [[caught, `${caught}% is how many of the ${have} ${c.rel} ${c.has} also ${c.pos}. The question runs the other way: out of all ${flagged} ${c.rel} ${c.pos}, how many ${c.has}?`]],
          hints: [`How many of the 1,000 ${c.pos} altogether?`, `${hit} + ${falseAlarms} = ${flagged}. How many of those ${c.has}?`],
          explain: `Altogether ${hit} + ${falseAlarms} = ${flagged} ${c.pos}, and ${hit} of them ${c.has}: ${hit} ÷ ${flagged} = ${answer}%. Counting cases makes the false alarms impossible to overlook.`,
        };
      },
    },
    {
      id: 'teach-biases',
      type: 'info',
      title: 'Five traps, by name',
      text: `
        ${Object.values(BIASES).map((b) => `- **${b.name}**: ${b.what}.`).join('\n        ')}

        You have met four of these in this lesson. The **sunk-cost trap** is new. Money or time already spent is gone whatever you do next, so it is no reason to spend more.

        :::example
        Someone ploughs on with a book they dislike "because I have already read half of it". The hours already read cannot be got back. The only real question is whether the *next* hours are worth it.
        :::
      `,
    },
    {
      id: 'bias-name',
      type: 'choice',
      review: true,
      columns: 1,
      gen: (rng) => {
        const c = rng.pick(BIAS_CASES);
        return {
          text: `
            ${c.text}

            **Which shortcut or bias is at work?**
          `,
          options: Object.keys(BIASES).map((k) => ({
            text: BIASES[k].name, correct: k === c.bias,
            why: k === c.bias ? undefined : `${BIASES[k].name}: ${BIASES[k].what}. Look again at what is driving the choice here.`,
          })),
          explain: `**${BIASES[c.bias].name}**: ${BIASES[c.bias].what}.`,
        };
      },
    },
    {
      id: 'defaults',
      type: 'choice',
      title: 'The power of doing nothing',
      text: `
        In some European countries you become an organ donor only if you tick a box (**opt in**). In others you are a donor unless you tick a box (**opt out**). The chart shows the share of people counted as willing donors (figures published in ${DONATION.year}). Germany and Austria are neighbours with much in common.

        **What best explains the gap?**
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 25, unit: '%', yLabel: 'registered as willing',
        data: [
          { label: 'Denmark\n(opt in)', value: 4, color: 'gray' }, { label: 'Germany\n(opt in)', value: 12, color: 'gray' },
          { label: 'Sweden\n(opt out)', value: 86, color: 'orange' }, { label: 'Austria\n(opt out)', value: 100, color: 'orange' },
        ],
        alt: 'Bar chart of the share registered as willing organ donors. Opt-in countries: Denmark 4 percent, Germany 12 percent. Opt-out countries: Sweden 86 percent, Austria almost 100 percent.',
        caption: 'Johnson and Goldstein, 2003. Austria: 99.98%.',
      },
      columns: 1,
      options: [
        { text: 'Most people stay with whatever happens if they do nothing', correct: true },
        { text: 'People in opt-out countries are far more generous', why: 'Germany and Austria are neighbours with much in common, and they sit at opposite ends of the chart. The form differs, not the people.' },
        { text: 'People in opt-in countries have not heard of organ donation', why: 'Surveys in opt-in countries find that most people approve of donation. Approving and ticking a box are different things.' },
      ],
      explain: `
        The **default** decides. Arranging a choice so that the easy path leads somewhere useful is called a **nudge**.

        Two honest notes. First, the chart shows consent on paper; actual transplant numbers differ far less, since families are still asked. Second, nudges were oversold: in published studies they shifted behaviour by ${NUDGE.published} percentage points on average, but across every trial run by two government teams, published or not, by ${NUDGE.allTrials} points (${NUDGE.year}). Lesson 1's file drawer, at work again.
      `,
    },
    {
      id: 'teach-careful',
      type: 'info',
      title: 'Three cautions',
      text: `
        It is easy to read too much into these puzzles.

        - They are **designed** to catch shortcuts out. In everyday conditions the same shortcuts are fast and usually right, which is why we have them. Gerd Gigerenzer has shown that a simple rule ("go with the option you recognise") can match complex models in the right setting.
        - **Knowing about a bias does not switch it off**, any more than knowing switched off the illusions of lesson 2. What helps is changing the procedure: counting cases, checking the quick answer, writing down an estimate before seeing anyone else's.
        - One famous result, that the least skilled overrate themselves most (the "Dunning-Kruger effect"), needs care. If everyone guessed "a bit above average" with some random error, the lowest scorers would overestimate and the highest would underestimate, with no special blindness needed.
      `,
    },
    {
      id: 'careful',
      type: 'multi',
      title: 'How much to read into all this',
      text: '**Which of these statements are fair?**',
      columns: 1,
      options: [
        { text: '"System 1" (fast) and "System 2" (slow) are useful nicknames for two styles of thinking, not two places in the brain', correct: true },
        { text: 'Quick rules of thumb are often accurate enough, and sometimes do as well as careful calculation', correct: true },
        { text: 'The finding that the least skilled overrate themselves most (the "Dunning-Kruger effect") is partly a by-product of the statistics', correct: true },
        { text: 'Once you know about a bias, you are immune to it', why: 'As with the illusions of lesson 2, knowing does not switch it off. Informed people are still pulled by anchors. What helps is changing the procedure: writing down an estimate before seeing anyone else\'s, counting cases, checking the quick answer.' },
        { text: 'These experiments show that people are basically irrational', why: 'The puzzles are designed to catch shortcuts out. In everyday conditions the same shortcuts are fast and usually right, which is why we have them.' },
      ],
      explain: `
        Shortcuts are tools, and mostly good ones. On the Dunning-Kruger pattern, some real difference in self-insight seems to remain once the statistics are allowed for, but it is smaller than the famous graph suggests.

        Plain **overconfidence** is real, though: asked for a range they are 90% sure contains the true answer, people are right far less than 90% of the time. *How to Learn Anything* lets you test your own.
      `,
    },
    {
      id: 'try',
      type: 'info',
      title: 'When to slow down',
      text: `
        Fast thinking is not the enemy. It gets you through thousands of small decisions a day, mostly well. It trips where a number was planted, where one vivid case stands in for the count, where the wording does the choosing, or where you have already paid.

        The rule worth keeping: **slow down when the stakes are high and the answer came easily.**

        :::tip Optional, this week
        Before one decision that matters, write down your first answer. Then ask: what number or story was put in front of me first? What would I say if the same facts were worded the other way round?
        :::
      `,
    },
  ],
  recap: [
    'Quick mental shortcuts are usually good enough, and predictably wrong in particular situations.',
    'Anchors, vivid examples, resemblance and wording all shift judgements, even when you know about them.',
    'Looking only for evidence that fits is confirmation bias; counting cases beats juggling percentages.',
    'Slow down when the stakes are high and the answer came easily.',
  ],
  next: 'Next: how a mind is built in the first place. You will run one of Piaget\'s experiments, with a jug of juice.',
};
