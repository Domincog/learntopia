// Logic & Deduction · Lesson 2 · Knights and Liars
import { ISLAND_SELF, ISLAND_BOTH, ISLAND_FEUD, ISLAND_THREE, islandWidget, islandSolution, islandCheck } from '../helpers.js';

const PAIRS = [['Hana', 'Ivo'], ['Juno', 'Karl'], ['Lars', 'Mina'], ['Nell', 'Otto'], ['Pia', 'Quin'], ['Rosa', 'Sven']];
const ISLAND = 'On an island, every person is either a **knight**, who always tells the truth, or a **liar**, whose every statement is false.';

export default {
  id: 'truth-tellers-liars',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The island',
      text: `
        On a certain island, every person is either a **knight**, who always tells the truth,
        or a **liar**, whose every statement is false. You cannot tell them apart by looking.

        You meet Cleo and Dax. Cleo says: *“We are both liars.”*

        **What is Cleo?**
      `,
      shuffle: false,
      options: [
        { text: 'A knight' },
        { text: 'A liar', correct: true },
        { text: 'She could be either' },
      ],
      explain: `
        Cleo is a **liar**. A knight could never say “we are both liars”: it would be a lie about herself.

        There is more hiding in that sentence. It also tells you what *Dax* is.
        To dig it out, you need a way of testing guesses.
      `,
    },
    {
      id: 'self',
      type: 'interact',
      graded: false,
      title: 'Try it and see',
      text: `
        Two more islanders, Ada and Bram, each say something about themselves.

        **Try each of them as a knight, then as a liar.** Watch what happens to their sentence.
      `,
      widget: islandWidget(ISLAND_SELF),
      check: (s) => s.triedBoth || 'Try both possibilities for both islanders: knight, then liar.',
      solution: { types: ['knight', 'liar'], triedBoth: true },
      explain: `
        **“I am a knight”** fits either way: a knight says it truthfully, a liar says it falsely.
        So it tells you nothing at all.

        **“I am a liar”** fits *neither* way. From a knight it would be a lie; from a liar it would be the truth.
        Nobody on this island can ever say it.
      `,
    },
    {
      id: 'method',
      type: 'info',
      title: 'Assume, follow, look for a contradiction',
      text: `
        You just used one of the strongest methods a detective has.

        1. **Assume** something: “suppose Bram is a knight”.
        2. **Follow** it: “then his sentence is true, so he is a liar”.
        3. A knight who is a liar is a **contradiction**. So the assumption was wrong. Cross it out.

        When every assumption but one ends in a contradiction, the one left standing is the truth.

        :::key
        A knight’s sentence must be **true**. A liar’s sentence must be **false**.
        Test every possible world against those two rules.
        :::
      `,
    },
    {
      id: 'both-liars',
      type: 'interact',
      title: 'Back to Cleo',
      text: `
        Cleo said: *“We are both liars.”* Dax said nothing.

        **Find the one world with no contradiction.**
      `,
      widget: islandWidget(ISLAND_BOTH),
      check: islandCheck(ISLAND_BOTH),
      solution: islandSolution(ISLAND_BOTH),
      hints: [
        'Start with Cleo. Could a knight say this sentence?',
        'Cleo is a liar, so her sentence is false: they are *not* both liars. What does that make Dax?',
      ],
      explain: `
        If Cleo were a knight, her sentence would be true, which would make her a liar. Contradiction.
        So **Cleo is a liar**.

        Then her sentence is false: they are *not* both liars. Cleo is one, so **Dax is a knight**.
        A liar has just told you the truth about someone else, without meaning to.
      `,
    },
    {
      id: 'argument',
      type: 'order',
      text: 'Here is that argument, cut into pieces. **Put it in order**, so that every line follows from the lines above it.',
      items: [
        'Suppose Cleo is a knight.',
        'Then “we are both liars” is true.',
        'Then Cleo is a liar after all: a contradiction.',
        'So the assumption was wrong, and Cleo is a liar.',
        'So her sentence is false: they are not both liars.',
        'So Dax is a knight.',
      ],
      labels: ['Start', 'Conclusion'],
      explain: `
        This shape of argument is called **proof by contradiction**: assume something, follow it
        until it breaks, and conclude the opposite. Mathematicians have relied on it for more than two thousand years.
      `,
    },
    {
      id: 'teach-cases',
      type: 'info',
      title: 'When two worlds survive',
      text: `
        Sometimes more than one assumption gets through without a contradiction. Then you cannot
        say which world is the real one. But anything that is true in **every** surviving world is certain.

        :::example
        Tor and Ulla each call the other a liar. Try the four worlds.
        Two knights fail: a knight would be lying. Two liars fail: a liar would be telling the truth.
        One knight and one liar fits, **either way round**. You cannot tell who the knight is,
        but you can be sure there is exactly one.
        :::
      `,
      figure: {
        ...islandWidget(ISLAND_FEUD),
        alt: 'Two islanders to try as knight or liar. Tor says: Ulla is a liar. Ulla says: Tor is a liar.',
      },
    },
    {
      id: 'accuse',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const [A, B] = rng.shuffle(rng.pick(PAIRS));
        const accuse = rng.bool();
        const same = 'They are the same kind: two knights or two liars';
        const different = 'They are different kinds: one knight and one liar';
        return {
          text: `
            ${ISLAND}

            ${A} points at ${B} and says: *“${B} is a ${accuse ? 'liar' : 'knight'}.”*

            **What can you be sure of?**
          `,
          options: [
            { text: same, correct: !accuse, why: accuse ? `If both were knights, ${A} would be lying. If both were liars, ${A} would be telling the truth. Neither works.` : undefined },
            { text: different, correct: accuse, why: accuse ? undefined : `Then ${A}’s sentence would be true from a liar, or false from a knight. Neither works.` },
            { text: `${A} is a knight`, why: `${A} could be a liar: then the sentence is false, and that is allowed.` },
            { text: `${B} is a ${accuse ? 'liar' : 'knight'}`, why: `Only if ${A} is a knight, and you do not know that.` },
          ],
          hints: [`Take the two cases in turn: ${A} is a knight, then ${A} is a liar. What is ${B} each time?`],
          explain: accuse
            ? `If ${A} is a knight, the sentence is true and ${B} is a liar. If ${A} is a liar, the sentence is false and ${B} is a knight. Either way they are **different**. An accusation always joins a knight to a liar.`
            : `If ${A} is a knight, the sentence is true and ${B} is a knight too. If ${A} is a liar, the sentence is false and ${B} is a liar too. Either way they are **the same**, though you cannot say which.`,
        };
      },
    },
    {
      id: 'three',
      type: 'interact',
      title: 'Three islanders',
      text: `
        Edda, Finn and Gus each have something to say. There are eight possible worlds,
        and **only one has no contradiction**. Find it.
      `,
      widget: islandWidget(ISLAND_THREE),
      check: islandCheck(ISLAND_THREE),
      solution: islandSolution(ISLAND_THREE),
      attempts: 5,
      hints: [
        'Whoever calls someone a liar is the other kind from them. So Edda and Finn differ, and Finn and Gus differ.',
        'Try Edda as a knight. That makes Finn a liar and Gus a knight. Now read what Gus says.',
        'Edda as a knight ended in a contradiction, so Edda is a liar. Work along the chain again from there.',
      ],
      explain: `
        Suppose Edda is a knight. Then Finn is a liar, so his accusation is false and Gus is a knight.
        But Gus calls Edda a liar. Contradiction.

        So **Edda is a liar**. Her accusation is false, so **Finn is a knight**. His is true, so **Gus is a liar**.
        And Gus’s sentence, “Edda and Finn are both liars”, is false, exactly as it should be.
      `,
    },
    {
      id: 'impossible',
      type: 'choice',
      review: true,
      text: `
        ${ISLAND}

        Which sentence can **nobody** on the island ever say?
      `,
      columns: 1,
      options: [
        { text: '“I am a liar.”', correct: true },
        { text: '“I am a knight.”', why: 'Everybody can say this: a knight truthfully, a liar falsely.' },
        { text: '“My neighbour is a liar.”', why: 'A knight can say this about a liar, and a liar can say it about a knight.' },
        { text: '“My neighbour and I are both liars.”', why: 'A liar can say this, as long as the neighbour is a knight. Then it is false, as a liar’s sentence must be.' },
      ],
      explain: `
        From a knight, “I am a liar” would be false. From a liar, it would be true.
        Both break the rules, so the sentence is never heard on the island.
      `,
    },
    {
      id: 'pairs',
      type: 'choice',
      review: true,
      shuffle: false,
      columns: 1,
      gen: (rng) => {
        const [A, B] = rng.shuffle(rng.pick(PAIRS));
        const v = rng.pick([
          {
            says: 'We are both liars.', answer: 0,
            why: `A knight could not say it, so ${A} is a liar. The sentence is then false: they are not both liars, so ${B} is a knight.`,
          },
          {
            says: 'At least one of us is a liar.', answer: 1,
            why: `If ${A} were a liar, the sentence would be true, and a liar cannot say something true. So ${A} is a knight, the sentence is true, and the liar it mentions must be ${B}.`,
          },
          {
            says: 'We are the same kind.', answer: 2,
            why: `If ${A} is a knight, the sentence is true, so ${B} is a knight as well. If ${A} is a liar, the sentence is false, so ${B} is the other kind: a knight again. ${B} is a knight either way, and ${A} stays a mystery.`,
          },
          {
            says: 'We are different kinds.', answer: 3,
            why: `If ${A} is a knight, the sentence is true, so ${B} is the other kind: a liar. If ${A} is a liar, the sentence is false, so ${B} is the same kind: a liar again. ${B} is a liar either way, and ${A} stays a mystery.`,
          },
        ]);
        return {
          text: `
            ${ISLAND}

            ${A} and ${B} are standing together. ${A} says: *“${v.says}”* ${B} says nothing.

            **What can you conclude?**
          `,
          options: [
            `${A} is a liar and ${B} is a knight`,
            `${A} is a knight and ${B} is a liar`,
            `${B} is a knight, but ${A} could be either`,
            `${B} is a liar, but ${A} could be either`,
          ],
          answer: v.answer,
          hints: [
            `Assume ${A} is a knight and see what that makes ${B}. Then assume ${A} is a liar.`,
            'If one of the two assumptions hits a contradiction, cross it out. If both survive, look for what they agree on.',
          ],
          explain: v.why,
        };
      },
    },
    {
      id: 'teach-questions',
      type: 'info',
      title: 'Asking an islander a question',
      text: `
        A knight answers a yes-or-no question truthfully. A liar gives the **opposite** of the true answer.

        To judge a question, write down what each kind would say in each case.
        Take a chest that is either full or empty, and the question *“Is the chest full?”*

        | | Chest is full | Chest is empty |
        |---|:---:|:---:|
        | A knight says | yes | no |
        | A liar says | no | yes |

        A “yes” can mean either case, so this question tells you nothing.
        A useful question gets the **same answer from both kinds**.
      `,
    },
    {
      id: 'fork',
      type: 'choice',
      stretch: true,
      columns: 1,
      title: 'The fork in the road',
      text: `
        You come to a fork. One road leads to the village, the other into a swamp.
        An islander is standing there, and you do not know whether she is a knight or a liar.

        You may ask **one** yes-or-no question. Which question finds the village for certain?
      `,
      options: [
        {
          text: '“Does the left road lead to the village?”',
          why: 'A knight says yes when it does. A liar says yes when it does not. You cannot tell which answer you were given.',
        },
        {
          text: '“Are you a knight?”',
          why: 'Both kinds answer yes. And it says nothing about the road.',
        },
        {
          text: '“If I asked you whether the left road leads to the village, would you say yes?”',
          correct: true,
        },
        {
          text: '“Would a liar say that the left road leads to the village?”',
          why: 'A knight would honestly report a liar’s false answer. A liar would lie about it, and land on the truth. The two give opposite answers, so you are stuck again.',
        },
      ],
      hints: [
        'A plain question fails because you do not know whether to believe the answer. Could you make a liar lie *twice*?',
        'Do not ask about the road. Ask about the answer she would give.',
      ],
      explain: `
        A knight gives a true report of her true answer. A liar lies about the lie she would have told,
        and **two lies cancel**, like two minus signs. From either of them, “yes” means the left road is the one.
      `,
    },
    {
      id: 'double-lie',
      type: 'fill',
      text: `
        Check the liar’s side of that. Suppose the **left** road really does lead to the village,
        and the islander is a **liar**.
      `,
      template: `
        Asked “Does the left road lead to the village?”, she would say [[yes|*no]].

        So the true answer to “Would you say yes?” is [[yes|*no]].

        She is a liar, so what you actually hear is [[*yes|no]].
      `,
      explain: `
        She would lie about the road (“no”), and then she lies about that (“yes”).
        You hear “yes”, the truth about the road, from someone who has not said one true thing.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A liar never says anything true.

        **So how can a liar’s words still tell you something?** Cleo’s “We are both liars” may help as an example.
      `,
      model: `
        Because you know that a liar’s sentence is **false**, and “this is false” is information too.
        Once Cleo is known to be a liar, “we are both liars” must be false, so Dax is a knight.
        A speaker who is *reliably* wrong is as useful as one who is reliably right.
        The useless one would be a speaker who lies only some of the time.
      `,
    },
  ],
  recap: [
    'A knight’s statement must be true; a liar’s must be false. Test each possible world against that.',
    '**Assume, follow, look for a contradiction.** A contradiction means the assumption was wrong.',
    'Whoever calls someone a liar is the other kind from them.',
    'A reliably false statement still carries information, and two lies cancel out.',
  ],
  next: 'Next: one short sentence, “if… then…”, that trips up almost everybody.',
};
