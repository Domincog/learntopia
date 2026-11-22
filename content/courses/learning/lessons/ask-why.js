// How to Learn Anything · Lesson 5 · Ask Why
import { r } from '../../../kit.js';

// One line, so it can be dropped into the indented step texts below.
const PASSAGE = '> First the container is filled, though not to the top. Then comes a wait, which ends with a click or a whistle. What was dry goes in next, usually wrapped in something that holds it together. Now timing matters: too short and the result is weak, too long and it turns bitter. Some people add a splash of white at the end. Others think that ruins it.';

export default {
  id: 'ask-why',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Three ways to learn a fact',
      text: `
        Students were given a list of odd little facts to learn, such as:

        > The hungry man got into the car.

        - **Group A** simply read each sentence.
        - **Group B** read each sentence with a reason attached: *…to drive to a restaurant.*
        - **Group C** got no reason. They had to answer one question about each sentence: *"Why would that man do that?"*

        Later, everyone was asked which man did what. **Which group remembered the most?**
      `,
      shuffle: false,
      options: [
        { text: 'Group A, who just read the sentences' },
        { text: 'Group B, who were given a reason' },
        { text: 'Group C, who had to think of a reason', correct: true },
        { text: 'All three did about the same' },
      ],
      explain: `
        Group C, by a wide margin: roughly **twice as many** facts as either of the others
        (Pressley and colleagues, 1987).

        Being *handed* a reason added little. *Producing* one is what made the facts stick.
        This lesson is about why, and about how to do it on purpose.
      `,
    },
    {
      id: 'passage',
      type: 'info',
      title: 'Read this once',
      text: `
        Read this short passage **once**, at your normal speed. You will be asked about it.

        ${PASSAGE}
      `,
      cta: 'I have read it',
    },
    {
      id: 'passage-rate',
      type: 'choice',
      mode: 'predict',
      text: 'No looking back. **How much of that passage could you repeat to someone right now?**',
      shuffle: false,
      options: [
        { text: 'Most of it' },
        { text: 'Some of it' },
        { text: 'Hardly any of it' },
      ],
      explain: `
        For most readers it is *hardly any*. Every word in the passage is simple, and still it
        slides straight off. (Unless you guessed what it was about. In that case you already know
        where this is going.)
      `,
    },
    {
      id: 'passage-title',
      type: 'info',
      title: 'Now read it again',
      text: `
        The passage has a title: **Making a cup of tea.**

        ${PASSAGE}

        Not one word has changed. What changed is that every sentence now has something to
        *attach to*: things you already know about kettles, tea bags and milk.

        In a classic experiment, people who were told the topic of a passage like this **before**
        reading it understood and remembered about twice as much as people who were never told,
        or who were told afterwards (Bransford & Johnson, 1972).

        :::key
        New information is remembered by connecting it to what you already know.
        :::
      `,
    },
    {
      id: 'baker',
      type: 'choice',
      text: `
        Two groups are shown the same photo of a stranger.

        - One group is told: *his name is Baker.*
        - The other is told: *he is a baker.*

        Later they see the photo again. Think about which version of the word has more to
        attach to. **Which group is more likely to remember the word?**
      `,
      options: [
        { text: 'The group told that he is a baker', correct: true },
        { text: 'The group told that his name is Baker', why: 'A name is only a label. It connects to nothing else you know about the person.' },
        { text: 'No difference: it is the same word', why: 'Same word, very different results. What differs is how many other things the word connects to.' },
      ],
      explain: `
        The same word is remembered far better as a job than as a name. *A baker* arrives with
        flour, ovens, early mornings and the smell of bread. *Mr Baker* arrives with nothing.
        Psychologists call this the **Baker/baker paradox**.

        A fact with many connections is easy to find again. A bare fact is a name without a face.
      `,
    },
    {
      id: 'elaboration',
      type: 'info',
      title: 'Elaboration',
      text: `
        Building those connections on purpose is called **elaboration**. It needs no equipment,
        only questions:

        - **Why** is this true? Why this way and not another?
        - **How** does it connect to something I already know?
        - What would be an **example** from my own life?
        - What would happen **if** I changed one part?

        You can ask them of a single fact, of each line of a text, or of each step of a
        worked solution.

        :::key
        Do not just take a fact in. Ask it questions.
        :::
      `,
    },
    {
      id: 'sort',
      type: 'bucket',
      review: true,
      text: 'Which of these habits **build connections**, and which only **copy** the material?',
      buckets: ['Builds connections', 'Only copies'],
      items: [
        { text: 'Asking yourself why a rule works', bucket: 0 },
        { text: 'Inventing your own example of a new idea', bucket: 0 },
        { text: 'Comparing a new idea with one you already know', bucket: 0 },
        { text: 'Explaining each step of a worked solution to yourself', bucket: 0 },
        { text: 'Writing a definition out three times', bucket: 1, why: 'You can copy a sentence perfectly without thinking about what it means.' },
        { text: 'Reading the summary again', bucket: 1 },
        { text: 'Highlighting the key terms', bucket: 1 },
        { text: 'Memorising the textbook wording exactly', bucket: 1, why: 'Word-for-word memory stores the sound of a sentence, not what it connects to.' },
      ],
      explain: 'The connecting habits all make you produce something the page did not give you: a reason, an example, a comparison.',
    },
    {
      id: 'teach-self-explain',
      type: 'info',
      title: 'Explain it to yourself',
      text: `
        Stopping after each line to ask "why?" is called **self-explanation**. In one study,
        students who were prompted to explain each sentence of a text about the heart to
        themselves understood it markedly better than students who read the same text twice
        (Chi and colleagues, 1994).

        A real explanation **adds something the text did not say**.

        :::example
        *The hungry man got into the car.*

        - "A man who was hungry got into a car." That only **restates** it.
        - "He is probably driving somewhere to eat." That **explains** it: a reason, built
          from what you know about hunger and cars.
        :::
      `,
    },
    {
      id: 'heart',
      type: 'choice',
      title: 'Try it: explain as you read',
      text: `
        Two sentences from a biology text:

        > Blood returning from the body enters the right side of the heart, which pumps it to the
        > lungs. From the lungs it returns to the left side of the heart, which pumps it out to the body.

        A good self-explainer stops and asks:
        *why would blood be sent to the lungs before it goes anywhere else?*

        **Which answer shows real understanding?**
      `,
      options: [
        { text: 'It has given up its oxygen to the body, so it must collect more before going round again', correct: true },
        { text: 'Because the lungs are right next to the heart', why: 'True, but it explains nothing. Being close by is not a reason for the trip.' },
        { text: 'Because the right side of the heart always pumps to the lungs', why: 'That only repeats the sentence in other words. Restating is not explaining.' },
        { text: 'Because that is the order the text gives', why: 'That is where the fact came from, not why it is so.' },
      ],
      explain: `
        The right answer adds something the text did not say: a **reason**, built from what you
        already know about oxygen. That is the mark of a good self-explanation.

        It also pays off at once. You could now work out why the heart needs *two* pumps, although
        nobody has told you.
      `,
    },
    {
      id: 'best-move',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          {
            fact: 'that metal expands when it is heated',
            move: 'Ask where you have met it before: is that why a stuck jar lid loosens under hot water?',
          },
          {
            fact: 'that the French word for "book" is *livre*',
            move: 'Connect it to a word you know: a *library* is full of them',
          },
          {
            fact: 'that plants take in carbon dioxide from the air',
            move: 'Ask where the carbon ends up: could it be what the plant builds itself from?',
          },
          {
            fact: r`the rule $2^2 \times 2^3 = 2^5$: when you multiply powers, the exponents add`,
            move: r`Ask why: write it out as $(2 \times 2) \times (2 \times 2 \times 2)$ and count the twos`,
          },
        ]);
        return {
          text: `You have just read ${scene.fact}. **Which next move will do the most to make it stick?**`,
          options: [
            { text: scene.move, correct: true },
            { text: 'Read the sentence again until it feels familiar', why: 'Familiar is not the same as learned: nothing new is being connected.' },
            { text: 'Copy it into your notes in neat handwriting', why: 'Copying moves the words from one page to another without passing through any thought.' },
            { text: 'Highlight it in two colours', why: 'The sentence stands out on the page now. In your memory it is as isolated as before.' },
          ],
        };
      },
      explain: 'Each of the other three leaves the fact standing alone. The winning move ties it to something you already know, so there is a path back to it.',
    },
    {
      id: 'teach-expect',
      type: 'info',
      title: 'Study as if you had to teach it',
      text: `
        Explaining to yourself works. So does getting ready to explain to somebody else.

        In one experiment, two groups studied the same passage for the same time.

        - One group was told they would be **tested** on it.
        - The other was told they would have to **teach** it to someone else.

        In the end nobody taught anything: both groups simply took the same test. The group
        that had **expected to teach** remembered more of the passage, and in better order
        (Nestojko and colleagues, 2014).
      `,
    },
    {
      id: 'teach',
      type: 'choice',
      text: `
        In that experiment both groups had the same passage, the same study time and the same
        test, and nobody actually taught.

        **So what made the difference?**
      `,
      options: [
        { text: 'Expecting to teach changed how they read: they looked for the main points and how the ideas fit together', correct: true },
        { text: 'The teaching group practised by explaining the passage to someone', why: 'Nobody taught anything. The only difference was what each group *expected* to do.' },
        { text: 'The teaching group was given more time with the passage', why: 'Both groups had the same passage for the same time.' },
        { text: 'The teaching group took an easier test', why: 'Both groups took the same test.' },
      ],
      explain: `
        Merely *expecting* to teach changed how people read. They looked for the main points,
        for the order of the ideas, for what a listener would ask.

        You can borrow this at any time. Study as if you had to explain it tomorrow. Better still,
        do explain it: to a friend, to a pet, to an empty chair.
      `,
    },
    {
      id: 'truths',
      type: 'multi',
      review: true,
      text: 'Which of these are **true**?',
      options: [
        { text: 'Information that connects to what you already know is easier to remember', correct: true },
        { text: 'Working out a reason yourself helps more than being handed one', correct: true },
        { text: 'If you can repeat a definition word for word, you understand it', why: 'Repeating shows that you stored the words. Understanding shows when you can say why, give an example, or use the idea.' },
        { text: 'Asking "why?" is only useful in science and maths', why: 'It works wherever facts have reasons: history, languages, law, music.' },
      ],
      explain: 'Understanding is not a feeling you get from the page. It is something you build, one connection at a time.',
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Pick one fact or idea you have learned recently, in any subject.

        **Write one "why" or "how" question about it, and answer it as well as you can.**
      `,
      model: `
        For example: *Why do reviews work better when they are spread out?* Because a memory that
        has faded a little takes effort to pull back, and that effort is what strengthens it. A
        review done straight away is too easy to do any good.

        If your own answer came out thin, that is useful too. It shows you exactly where to look next.
      `,
    },
  ],
  recap: [
    'New information sticks when it connects to something you already know.',
    'Working out a reason yourself beats being handed one.',
    'Ask of every fact: why is it true, what is an example, what does it remind me of?',
    'Study as if you had to teach it. Explaining is the best test of understanding.',
  ],
  next: 'Next: why everything you learn has to squeeze through a very small door.',
};
