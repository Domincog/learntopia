// Logic & Deduction · Lesson 3 · If… Then…
import { wasonTask } from '../helpers.js';

const LETTER_CARDS = {
  type: 'wason-cards',
  rule: 'If a card has a vowel on one side, then it has an even number on the other.',
  cards: [
    { front: 'A', back: '6', note: 'A vowel, so the number behind it mattered. It is even: fine.' },
    { front: 'K', back: '3', note: 'A consonant. The rule promises nothing about consonants, so nothing here could break it.' },
    { front: '4', back: 'T', note: 'An even number with a consonant behind it. Allowed: nobody said even numbers need a vowel.' },
    { front: '7', back: 'E', note: 'An odd number with a vowel behind it. **The rule is broken**, and only this card could show it.', breaks: true },
  ],
};

const PARTY_CARDS = {
  type: 'wason-cards',
  rule: 'If someone is drinking beer, then they are at least 18.',
  cards: [
    { front: { text: 'Beer', sub: 'drinking' }, back: { text: '31', sub: 'age' }, note: 'Drinking beer, so the age mattered. 31: fine.' },
    { front: { text: 'Juice', sub: 'drinking' }, back: { text: '15', sub: 'age' }, note: 'Juice is allowed at any age. Nothing here could break the rule.' },
    { front: { text: '25', sub: 'age' }, back: { text: 'Beer', sub: 'drinking' }, note: 'A 25-year-old may drink whatever she likes.' },
    { front: { text: '16', sub: 'age' }, back: { text: 'Beer', sub: 'drinking' }, note: 'Sixteen, with a beer. **The rule is broken.**', breaks: true },
  ],
};

const RAIN = (w) => w[0];
const WET = (w) => w[1];
const STREET_WORLD = {
  type: 'truth-check',
  switches: [
    { label: 'The weather', on: 'Raining', off: 'Not raining', value: true },
    { label: 'The street', on: 'Wet', off: 'Not wet', value: true },
  ],
  statements: [
    { tag: 'The rule', text: 'If it is raining, then the street is wet.', if: RAIN, then: WET },
    { tag: 'A · turned round', text: 'If the street is wet, then it is raining.', if: WET, then: RAIN },
    { tag: 'B · both parts negated', text: 'If it is not raining, then the street is not wet.', if: (w) => !RAIN(w), then: (w) => !WET(w) },
    { tag: 'C · turned round and negated', text: 'If the street is not wet, then it is not raining.', if: (w) => !WET(w), then: (w) => !RAIN(w) },
  ],
};

const PROMISES = [
  {
    rule: 'If it rains on Saturday, the match is cancelled.',
    kept: 'It rains, and the match is cancelled',
    broken: 'It rains, and the match is played',
    extra: 'It stays dry, and the match is cancelled',
    extraWhy: 'Nothing was promised about dry days. The match could be cancelled for some other reason.',
    idle: 'It stays dry, and the match is played',
    why: 'Rain was the “if” part, and it happened. The cancelled match was the “then” part, and it did not.',
  },
  {
    rule: 'If you tidy your room, you will get an ice cream.',
    kept: 'You tidy your room and get an ice cream',
    broken: 'You tidy your room and get no ice cream',
    extra: 'You leave the room messy and get an ice cream anyway',
    extraWhy: 'Generous, but not a broken promise. Nothing was said about what happens if you do not tidy.',
    idle: 'You leave the room messy and get no ice cream',
    why: 'You did your part, the “if”. The ice cream, the “then”, never came.',
  },
  {
    rule: 'If the alarm rings, everybody leaves the building.',
    kept: 'The alarm rings, and everybody leaves',
    broken: 'The alarm rings, and somebody stays inside',
    extra: 'The alarm is silent, and everybody leaves',
    extraWhy: 'People leave buildings for all sorts of reasons. The rule only says what must happen when the alarm rings.',
    idle: 'The alarm is silent, and somebody stays inside',
    why: 'The alarm, the “if” part, rang. The “then” part, everybody leaving, did not happen.',
  },
  {
    rule: 'If a guest orders the set menu, they get a free dessert.',
    kept: 'A guest orders the set menu and gets a free dessert',
    broken: 'A guest orders the set menu and gets no free dessert',
    extra: 'A guest orders only a salad and gets a free dessert',
    extraWhy: 'A lucky guest, but no broken promise. The rule says nothing about guests who skip the set menu.',
    idle: 'A guest orders only a salad and gets no free dessert',
    why: 'The set menu, the “if” part, was ordered. The free dessert, the “then” part, did not arrive.',
  },
];

const RELATIVES = [
  {
    rule: 'If a shape is a square, then it has four sides.',
    contra: 'If a shape does not have four sides, then it is not a square.',
    converse: 'If a shape has four sides, then it is a square.',
    inverse: 'If a shape is not a square, then it does not have four sides.',
    counter: 'a long thin rectangle: four sides, yet not a square',
  },
  {
    rule: 'If you are in Tokyo, then you are in Japan.',
    contra: 'If you are not in Japan, then you are not in Tokyo.',
    converse: 'If you are in Japan, then you are in Tokyo.',
    inverse: 'If you are not in Tokyo, then you are not in Japan.',
    counter: 'someone in Osaka: in Japan, yet not in Tokyo',
  },
  {
    rule: 'If a number is divisible by 10, then it is even.',
    contra: 'If a number is odd, then it is not divisible by 10.',
    converse: 'If a number is even, then it is divisible by 10.',
    inverse: 'If a number is not divisible by 10, then it is odd.',
    counter: 'the number 4: even, yet not divisible by 10',
  },
  {
    rule: 'If an animal is a whale, then it is a mammal.',
    contra: 'If an animal is not a mammal, then it is not a whale.',
    converse: 'If an animal is a mammal, then it is a whale.',
    inverse: 'If an animal is not a whale, then it is not a mammal.',
    counter: 'a horse: a mammal, yet not a whale',
  },
];

export default {
  id: 'if-then',
  steps: [
    {
      id: 'wason',
      type: 'interact',
      mode: 'predict',
      title: 'Four cards',
      text: `
        Each card has a **letter on one side** and a **number on the other**.
        Someone makes a claim about these four cards.

        **Which cards must you turn over to find out whether the claim is true?** Choose as few as you can.
      `,
      widget: LETTER_CARDS,
      check: (s) => s.count === 2 && s.selected[0] === 0 && s.selected[1] === 3,
      solution: { selected: [0, 3] },
      explain: `
        You need **A and 7**, and nothing else.

        If you chose A and 4, you are in good company: it is the most popular answer.
        When the psychologist Peter Wason first set this puzzle in the 1960s, fewer than one person in ten got it right.

        It is not a trick. First, what testing a rule really means. Then the *same* puzzle
        in disguise, which you will probably find easy.
      `,
    },
    {
      id: 'teach-rule-breaker',
      type: 'info',
      title: 'Hunt for a rule-breaker',
      text: `
        A rule about *every* card is false as soon as **one** card goes against it.
        So testing a rule means hunting for a rule-breaker. Ask of each card:
        **could its hidden side break the rule?** Turn it over only if it could.

        :::example
        The **K**: the rule speaks only about vowels. Whatever number is behind a K, the rule is safe. Leave it.

        The **A**: a vowel, so an odd number behind it would break the rule. Turn it.
        :::

        That settles two cards. The 4 and the 7 are easier to judge in a different setting.
      `,
      figure: {
        ...LETTER_CARDS, static: true, reveal: 'never',
        alt: 'Four cards showing A, K, 4 and 7, under the rule: if a card has a vowel on one side, then it has an even number on the other.',
      },
    },
    {
      id: 'party',
      type: 'interact',
      title: 'The same puzzle in disguise',
      text: `
        You are checking a festival. Each card is a person: one side shows **what they are drinking**,
        the other shows **their age**.

        **Whom do you need to check?**
      `,
      widget: PARTY_CARDS,
      check: (s) => {
        const has = (i) => s.selected.includes(i);
        if (has(1)) return 'Juice is allowed at any age. Whatever is on the back of that card, no rule is broken.';
        if (has(2)) return 'A 25-year-old may drink anything. Whatever is on the back of that card, no rule is broken.';
        if (!has(0)) return 'Somebody is drinking beer. Are you sure they are old enough?';
        if (!has(3)) return 'What if the 16-year-old is holding a beer?';
        return true;
      },
      solution: { selected: [0, 3] },
      hints: ['Ask of each card: could the other side show somebody breaking the rule?'],
      explain: `
        You check the **beer drinker**, who might be too young, and the **16-year-old**, who might be holding a beer.
        Nobody bothers the juice drinker or the 25-year-old.

        Most people get this right at once. Yet it is, piece for piece, the card puzzle you just saw.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'An if-then is a promise',
      text: `
        A sentence of the form **“if P, then Q”** is called a **conditional**. Read it as a promise:
        *if you are drinking beer, then you are at least 18.*

        There is exactly **one** way to break it: the “if” part is true and the “then” part is false.

        | “if” part | “then” part | The promise is… |
        |---|---|---|
        | true | true | kept |
        | **true** | **false** | **broken** |
        | false | true | not broken |
        | false | false | not broken |

        When the “if” part is false, nothing was promised. A juice drinker cannot break a rule about beer.
      `,
    },
    {
      id: 'same-puzzle',
      type: 'match',
      text: `
        The two rules, side by side:

        - If **beer**, then **18 or over**.
        - If **vowel**, then **even number**.

        Match each festival card with the letter-and-number card that plays **the same part**.
      `,
      pairs: [
        ['Beer', 'A'],
        ['Juice', 'K'],
        ['Age 25', '4'],
        ['Age 16', '7'],
      ],
      explain: `
        Beer and A: the “if” part is true, so the “then” part had better be true as well.
        Age 16 and 7: the “then” part is false, so the “if” part had better be false too.

        Age 25 is the 4. The “then” part is already satisfied, so nothing behind the card can matter.
      `,
    },
    {
      id: 'breaks',
      type: 'choice',
      review: true,
      columns: 1,
      gen: (rng) => {
        const p = rng.pick(PROMISES);
        return {
          text: `
            Somebody promises: *“${p.rule}”*

            **Which of these would break the promise?**
          `,
          options: [
            { text: p.broken, correct: true },
            { text: p.kept, why: 'That is the promise being kept: the “if” part happened, and so did the “then” part.' },
            { text: p.extra, why: p.extraWhy },
            { text: p.idle, why: 'The “if” part never happened, so the promise was never put to the test.' },
          ],
          explain: `${p.why} An if-then is broken in that one case only: **“if” part true, “then” part false**.`,
        };
      },
    },
    {
      id: 'worlds',
      type: 'interact',
      title: 'Turn it round',
      text: `
        Below is a rule, with three other sentences built from the same two parts.
        Flip the weather and the street to visit all four possible worlds.

        **Find a world where the rule holds but sentence A is broken.**
      `,
      widget: STREET_WORLD,
      check: (s) => {
        if (s.status[0] === 'broken') return 'In this world the rule itself is broken: rain, and a street that is not wet. Find a world where the rule survives.';
        if (s.status[1] !== 'broken') return 'Here the rule holds, but so does sentence A. Keep flipping.';
        return true;
      },
      solution: { world: [false, true] },
      hints: ['Sentence A is a promise about wet streets. To break it, you need a wet street and no rain.'],
      explain: `
        No rain, wet street: perhaps somebody has just washed it. The rule is untouched, because it only
        promised something about rainy days. But “if the street is wet, then it is raining” is plainly false.

        **Turning an if-then round gives you a different claim.** It can fail while the original holds.
      `,
    },
    {
      id: 'twin',
      type: 'choice',
      text: `
        Keep exploring the four worlds. One of the sentences A, B and C is the rule’s twin:
        it is broken in exactly the same world as the rule, and holds in the other three.

        **Which one?**
      `,
      figure: { ...STREET_WORLD, alt: 'Switches for the weather and the street, with the rule and sentences A, B and C judged in the chosen world.' },
      shuffle: false,
      columns: 1,
      options: [
        { text: 'A: If the street is wet, then it is raining.', why: 'Set “not raining” and “wet”. A is broken there, yet the rule holds.' },
        { text: 'B: If it is not raining, then the street is not wet.', why: 'Set “not raining” and “wet”. B is broken there, yet the rule holds.' },
        { text: 'C: If the street is not wet, then it is not raining.', correct: true },
      ],
      hints: ['The rule is broken in only one world: raining, and the street not wet. Which other sentence is broken there?'],
      explain: `
        The rule fails only when it rains on a street that is not wet. Sentence C fails in that same world, and no other.
        They say the same thing from opposite ends: *rain means a wet street*, so *a street that is not wet means no rain*.
      `,
    },
    {
      id: 'names',
      type: 'info',
      title: 'Three relatives of an if-then',
      text: `
        Sentences A, B and C were built from the rule **“if P, then Q”**. Each kind has a name.

        - **Converse** (A): swap the parts. *If Q, then P.* A different claim.
        - **Inverse** (B): negate both parts. *If not P, then not Q.* A different claim.
        - **Contrapositive** (C): swap **and** negate. *If not Q, then not P.* **The same claim.**

        :::example
        Rule: *if you are a teenager, then you are under 20.*
        Contrapositive: *if you are not under 20, then you are not a teenager.* True as well.
        Converse: *if you are under 20, then you are a teenager.* False: think of a six-year-old.
        :::
      `,
      figure: { ...STREET_WORLD, alt: 'The street rule again, with sentence A (turned round), B (both parts negated) and C (turned round and negated), judged in the world chosen with the two switches.' },
    },
    {
      id: 'contra',
      type: 'choice',
      review: true,
      columns: 1,
      gen: (rng) => {
        const p = rng.pick(RELATIVES);
        return {
          text: `
            This statement is true: *“${p.rule}”*

            **Which of these says exactly the same thing?**
          `,
          options: [
            { text: p.contra, correct: true },
            { text: p.converse, why: `That is the converse, and it is false. Think of ${p.counter}.` },
            { text: p.inverse, why: `That is the inverse, and it is false. Think of ${p.counter}.` },
          ],
          hints: ['Swap the two parts **and** negate both.'],
          explain: `That is the **contrapositive**: swap the two parts and negate both. The converse and the inverse both fail here. Think of ${p.counter}.`,
        };
      },
    },
    {
      id: 'teach-two-cards',
      type: 'info',
      title: 'Which cards to turn',
      text: `
        Now the four cards make sense. An if-then is broken in one case only:
        “if” part true, “then” part false. So only two cards can hide a broken rule.

        - **“If” part true** (the A): the back might lack the “then” part. Turn it.
        - **“Then” part false** (the 7): the back might have the “if” part. Turn it.
          That is the contrapositive at work: *if not even, then not a vowel*.

        The 4 tempts people into testing the **converse**, *if even, then vowel*, which nobody claimed.
        Taking a rule for its converse is among the most common slips in reasoning.
      `,
      figure: {
        ...LETTER_CARDS, static: true, reveal: 'never',
        alt: 'The four cards again: A, K, 4 and 7. Only the A and the 7 can hide a broken rule.',
      },
    },
    {
      id: 'cards-again',
      type: 'interact',
      review: true,
      title: 'Cards again',
      gen: (rng) => {
        const t = wasonTask(rng);
        return {
          text: t.text,
          widget: t.widget,
          check: t.check,
          solution: t.solution,
          explain: t.explain,
          hints: ['Only one combination breaks an if-then: “if” part true, “then” part false. Which cards could be hiding half of it?'],
        };
      },
    },
    {
      id: 'only-if',
      type: 'multi',
      stretch: true,
      title: '“If” and “only if”',
      text: `
        One small word changes the direction of a promise. Compare:

        - The lamp is on **if** the switch is up.
        - The lamp is on **only if** the switch is up.

        “Only if” says the lamp cannot be on *without* the switch being up.
        Suppose that second sentence is true. **Which of these must then be true?**
      `,
      options: [
        { text: 'If the lamp is on, then the switch is up.', correct: true },
        { text: 'If the switch is down, then the lamp is off.', correct: true },
        { text: 'If the switch is up, then the lamp is on.', why: 'That is the plain “if” sentence. With “only if”, the switch can be up while the lamp stays dark: the bulb may be broken.' },
        { text: 'If the lamp is off, then the switch is down.', why: 'A broken bulb again: lamp off, switch up. “Only if” does not rule that out.' },
      ],
      hints: [
        'Which combination does the sentence forbid? Only one: lamp on, switch down. A sentence that is false in any *other* combination is not guaranteed.',
        'Once you have the if-then, remember that its contrapositive comes free.',
      ],
      explain: `
        “P **only if** Q” says P cannot happen without Q. That is **if P, then Q**: a lit lamp guarantees the switch is up.
        Its contrapositive comes free: switch down, lamp off.

        Plain “P **if** Q” runs the other way: if Q, then P. When both hold together, people say “P **if and only if** Q”.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Back to the four cards: **A, K, 4, 7**, and the rule “if vowel, then even number”.

        A friend insists on turning over the 4. **How would you convince them that the 7 matters and the 4 does not?**
      `,
      model: `
        The rule only makes a promise about vowels: a vowel must have an even number behind it.
        The 4 cannot break that promise. With a vowel behind it the rule holds, and with a consonant behind it
        the rule has nothing to say. The 7 *can* break it: a vowel on its other side would be a vowel with an odd number.
        Turning over the 4 tests the converse, “if even, then vowel”, which nobody claimed.
      `,
    },
  ],
  recap: [
    '“If P, then Q” is broken in one case only: P true and Q false.',
    'To test an if-then, check where P is true, and where Q is false. Nothing else can break it.',
    'The **contrapositive** (if not Q, then not P) says the same thing. The **converse** (if Q, then P) does not.',
    '“P only if Q” means “if P, then Q”.',
  ],
  next: 'Next: the three small words that every argument is built from.',
};
