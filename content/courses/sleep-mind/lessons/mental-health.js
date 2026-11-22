// Sleep, Stress and Mental Health · Lesson 6 · More Than a Bad Day
// Driving question: when does a hard time become a health condition, and what really helps?
//
// The whole lesson is tone: 'sober'. Every example is an invented person; nothing asks the learner about
// themselves, and nothing here can diagnose. The one step on suicide and self-harm follows safe-messaging
// guidance (WHO, "Preventing suicide: a resource for media professionals", 2023): no methods, no detail,
// not presented as a solution or as common, with the facts that help works and people recover, and with
// pointers to help that work internationally.
import { WORLD, DEPRESSION, CONDITIONS, HARD_TIMES, WORDS, crisisPointers } from '../helpers.js';

const range = (n) => Array.from({ length: n }, (_, i) => i);
// Fourteen of a hundred people, scattered: about one in seven.
const ONE_IN_SEVEN = [3, 11, 18, 26, 32, 39, 45, 51, 57, 64, 70, 78, 85, 93];
// The four kinds of anxiety disorder: the teaching table and the matching question print the same lines.
const ANXIETY_KINDS = [
  ['Generalised anxiety', 'Worry about many things, on most days, for months'],
  ['Panic disorder', 'Sudden surges of intense fear, again and again'],
  ['Social anxiety', 'Intense fear of being judged by other people'],
  ['A phobia', 'Fear of one thing, far beyond the danger it poses'],
];
const rows = (pairs) => pairs.map(([a, b]) => `| **${a}** | ${b} |`).join('\n        ');

export default {
  id: 'mental-health',
  tone: 'sober',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      mode: 'predict',
      title: 'How many?',
      text: `
        Picture 100 people chosen at random from the whole world: every
        age, every country.

        **Tap as many circles as you think are living with a mental health
        condition right now.**
      `,
      widget: { type: 'grid', rows: 10, cols: 10, shape: 'circle', colors: ['blue'], counter: 'Marked', cell: 34, alt: 'One hundred circles in ten rows of ten, standing for one hundred people.' },
      check: (s) => Math.abs(s.on.length - 14) <= 3,
      solution: { on: range(14) },
      explain: `
        About **14**. The World Health Organization estimates that nearly
        **1 person in ${WORLD.oneIn}** worldwide, more than a billion people, is
        living with a mental health condition. Anxiety disorders and
        depression are by far the most common.
      `,
    },
    {
      id: 'teach-how-common',
      type: 'info',
      title: 'One person in seven',
      text: `
        **1 in ${WORLD.oneIn}** means one out of every ${WORLD.oneIn} people: the 14 marked here
        among 100, or 5 in a group of 35, because 35 ÷ ${WORLD.oneIn} = 5.

        Most of them could not be picked out by looking. A mental health
        condition is usually invisible from outside.

        These conditions are part of ordinary human life, in every country
        and every kind of family. They are also treatable, which is what
        this lesson is about.
      `,
      figure: {
        type: 'grid', rows: 10, cols: 10, shape: 'circle', colors: ['blue'], cell: 34,
        on: ONE_IN_SEVEN, locked: range(100),
        alt: 'One hundred circles in ten rows of ten, standing for one hundred people. Fourteen of them, scattered across the rows, are filled in.',
      },
    },
    {
      id: 'count',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const n = rng.pick([70, 140, 210, 350, 490, 700, 1400, 2800]);
        const place = rng.pick([
          { a: 'a village of', b: 'people' },
          { a: 'a school with', b: 'pupils and staff' },
          { a: 'a company with', b: 'employees' },
          { a: 'a concert audience of', b: 'people' },
          { a: 'a block of flats housing', b: 'people' },
        ]);
        const many = n.toLocaleString('en-US');
        return {
          text: `Worldwide, about **1 person in ${WORLD.oneIn}** is living with a mental health condition. Picture ${place.a} **${many}** ${place.b}.\n\n**If the worldwide figure held there, about how many of them would be living with one?**`,
          answer: n / WORLD.oneIn,
          unit: 'people',
          wrong: [[n * WORLD.oneIn, `That multiplies by ${WORLD.oneIn}. One in ${WORLD.oneIn} means dividing the group into ${WORLD.oneIn} equal parts.`]],
          hints: [`"1 in ${WORLD.oneIn}" means one out of every ${WORLD.oneIn} people.`, `Divide ${many} by ${WORLD.oneIn}.`],
          explain: `${many} ÷ ${WORLD.oneIn} = **${(n / WORLD.oneIn).toLocaleString('en-US')}** people. Most of them could not be picked out by looking: a mental health condition is usually invisible from outside.`,
        };
      },
    },
    // Moved up (it used to follow the sorting step): the three questions are shown before they are used.
    {
      id: 'three-questions',
      type: 'info',
      title: 'What this lesson can and cannot do',
      text: `
        **How long? How strong? How much in the way?** Those three
        questions are a guide to when to seek advice. They are not a test.

        Only a trained professional, who has talked with a person, can say
        whether that person has a mental health condition. No list on a
        screen can, and this lesson will not try.

        What a lesson can do is describe the common conditions accurately,
        show what helps, and make it easier to ask.
      `,
    },
    {
      id: 'ordinary-or-ask',
      type: 'bucket',
      title: 'A hard time, or something more?',
      text: 'Sadness, worry and grief are part of every life. Put the three questions to each of these people: how long, how strong, how much in the way? **Which sound like an ordinary reaction, and which are worth talking over with a doctor?**',
      buckets: ['An ordinary reaction', 'Worth talking to a doctor'],
      items: HARD_TIMES.map((x) => ({ text: x.text, bucket: x.ask ? 1 : 0, why: x.why })),
      explain: `
        Three questions separate a hard time from a possible condition:
        **how long** has it lasted, **how strong** is it, and **how much
        does it get in the way** of work, study, sleep and the people in
        someone's life?

        A few bad days after a blow are ordinary. Weeks of it, with daily
        life shrinking, are a reason to ask.
      `,
    },
    {
      id: 'teach-depression',
      type: 'info',
      title: 'Depression: more than sadness',
      text: `
        At the centre of **depression** is low mood, or a loss of interest
        or pleasure in things once enjoyed, that lasts most of the day,
        nearly every day, for at least **${DEPRESSION.weeks === 2 ? 'two' : DEPRESSION.weeks} weeks**.

        It is joined by changes in sleep, appetite, energy, concentration
        and the way a person sees themselves: feeling worthless, or guilty
        without cause. It can make everyday tasks feel impossible.

        Depression is a health condition, not a flaw. It affects people of
        every temperament, including very determined ones. And it often
        cannot be seen from outside: many people with depression keep up
        a cheerful front.

        It is common, it is not a choice, and it responds to treatment.
      `,
    },
    {
      id: 'depression',
      type: 'multi',
      review: true,
      title: 'Depression',
      text: `**Depression** is more than sadness. Doctors look for a group of changes that last most of the day, nearly every day, for at least **${DEPRESSION.weeks === 2 ? 'two' : DEPRESSION.weeks} weeks**. **Which of these are among them?**`,
      options: [
        { text: 'Losing interest or pleasure in things once enjoyed', correct: true },
        { text: 'Changes in sleep or appetite', correct: true },
        { text: 'Tiredness and trouble concentrating', correct: true },
        { text: 'Feeling worthless, or guilty without cause', correct: true },
        { text: 'A weak character', why: 'Depression is a health condition, not a flaw. It affects people of every temperament, including very determined ones.' },
        { text: 'Always looking sad to other people', why: 'Many people with depression keep up a cheerful front. It often cannot be seen from outside.' },
      ],
      explain: 'Low mood or a loss of interest is at the centre, joined by changes in sleep, appetite, energy, concentration and the way a person sees themselves. It can make everyday tasks feel impossible. It is common, it is not a choice, and it responds to treatment. A list like this cannot diagnose anyone: a person who recognises the picture, in themselves or in someone close, can talk it over with a doctor.',
    },
    {
      id: 'teach-anxiety',
      type: 'info',
      title: 'Four kinds of anxiety disorder',
      text: `
        Fear and worry protect us (Lessons 4 and 5). In an **anxiety
        disorder** the alarm is out of proportion, lasts for months and
        gets in the way of life. Four common kinds:

        | Kind | What it is like |
        |---|---|
        ${rows(ANXIETY_KINDS)}

        A panic attack, with a pounding heart and a feeling of doom, can
        be terrifying, but it passes. All four respond well to treatment.
      `,
    },
    {
      id: 'anxiety',
      type: 'match',
      title: 'When the alarm will not stop',
      text: 'Fear and worry protect us (Lessons 4 and 5). In an **anxiety disorder** the alarm is out of proportion, lasts for months and gets in the way of life. **Match each kind with its description.**',
      pairs: ANXIETY_KINDS,
      explain: 'Together these are the most common mental health conditions in the world. All of them respond well to treatment, and therapies built on the ideas of the last lesson are among the best tested.',
    },
    {
      id: 'teach-conditions',
      type: 'info',
      title: 'Six other conditions, a line each',
      text: `
        | Condition | In one line |
        |---|---|
        ${rows(CONDITIONS.map((c) => [c.name, c.gist]))}

        One line cannot hold a condition, and no two people with the same
        diagnosis are alike. None is a character flaw, none is rare, and
        all can be treated or managed.
      `,
    },
    {
      id: 'conditions',
      type: 'match',
      review: true,
      gen: (rng) => {
        const four = rng.sample(CONDITIONS, 4);
        return {
          text: 'A short, accurate line about each of some other conditions. **Match each name with its description.**',
          pairs: four.map((c) => [c.name, c.gist]),
          explain: 'One line cannot hold a condition, and no two people with the same diagnosis are alike. What these have in common: none is a character flaw, none is rare, and all can be treated or managed, the sooner the better.',
        };
      },
    },
    {
      id: 'causes',
      type: 'choice',
      title: 'What causes them?',
      text: `
        Studies of who develops depression find many things at work. Genes
        shift the odds. So do hardship in childhood, long-lasting stress,
        loss, loneliness, physical illness, poverty and discrimination.

        A slogan from the 1990s says that depression is simply "a chemical
        imbalance": too little of the brain chemical serotonin.

        **What does the research say now?**
      `,
      columns: 1,
      options: [
        { text: 'It is too simple: the causes are a mix of biology, experience and circumstances', correct: true },
        { text: 'It is right: depression is a shortage of serotonin and nothing else', why: 'A 2022 review of decades of studies found no consistent evidence that low serotonin causes depression.' },
        { text: 'It is wrong, so biology plays no part and medicines cannot work', why: 'Biology does matter: depression runs partly in families, and antidepressant medicines help many people, although how they work is not fully understood.' },
        { text: 'Depression comes from a negative attitude', why: 'Nobody thinks their way into a condition like this, and nobody can simply think their way out. Blame has no place here.' },
      ],
      explain: `
        Too simple. Usually several causes act together, and often no
        single cause can be found.

        Psychiatry cannot yet point to one mechanism for any of these
        conditions. Honest science says so, and keeps looking.
      `,
    },
    {
      id: 'teach-what-works',
      type: 'info',
      title: 'Treatments that work',
      text: `
        Depression and anxiety disorders can be treated. Three kinds of
        help have good evidence behind them:

        - **talking therapies**, such as CBT, the therapy built on the
          loop of Lesson 5;
        - **medicines** prescribed by a doctor, such as antidepressants;
        - **regular physical activity**, alongside other help.

        Therapy, medicine, or both together: which suits best depends on
        the person and the condition, and is worked out with a
        professional.
      `,
    },
    {
      id: 'what-works',
      type: 'multi',
      title: 'What helps?',
      text: '**Which of these have good evidence for helping people with depression or an anxiety disorder?**',
      options: [
        { text: 'Talking therapies, such as CBT', correct: true },
        { text: 'Medicines prescribed by a doctor, such as antidepressants', correct: true },
        { text: 'Regular physical activity, alongside other help', correct: true },
        { text: 'Being told to pull yourself together', why: 'If willpower could cure these conditions, nobody would have them. Being told so adds shame, and delays real help.' },
        { text: 'Supplements sold online as cures', why: 'None has evidence close to that of therapy or prescribed medicine, and some interfere with medicines.' },
      ],
      explain: `
        Therapy, medicine and activity have the evidence. The first thing
        tried does not always fit, and finding the right help can take
        more than one attempt.

        The most important fact: **most people get better**. Recovery is
        the usual outcome, not the exception.
      `,
    },
    {
      id: 'treatment-gap',
      type: 'interact',
      mode: 'predict',
      title: 'Who gets help?',
      text: `
        Effective treatments exist. Now think of all the people with a
        mental health condition in the world's low- and middle-income
        countries, where most of humanity lives.

        **Drag the bar: what share of them do you think receive no
        treatment at all?**
      `,
      widget: { type: 'bars', adjust: true, step: 5, yMax: 100, yStep: 20, unit: '%', data: [{ label: 'receive no treatment', value: 30, color: 'blue' }], alt: 'One adjustable bar for the share of people with a mental health condition who receive no treatment.' },
      check: (s) => s.values[0][0] >= 70,
      solution: { values: [[75]] },
      explain: `
        **More than ${WORLD.untreatedLmicPct}%**, according to the World Health
        Organization. Even in rich countries, many people wait years or
        never ask.

        There are too few services: across the world, a typical country
        has about ${WORLD.workersPer100k} mental health workers for every 100,000 people.
        Cost is a barrier. And so is stigma: the fear of being judged.
      `,
    },
    {
      id: 'words',
      type: 'bucket',
      review: true,
      title: 'Words matter',
      text: 'The way people talk about mental health can make it easier or harder to ask for help. Respectful words put the **person first** (someone *has* a condition, they are not the condition), keep diagnoses out of jokes, and carry no blame. **Sort these phrases.**',
      buckets: ['Respectful', 'Better avoided'],
      items: WORDS.map((w) => ({ text: w.text, bucket: w.ok ? 0 : 1, why: w.why })),
      explain: 'Put the **person first**: someone *has* a condition, they are not the condition. And keep diagnoses out of jokes and insults. Careless words teach people who are struggling to stay silent.',
    },
    {
      id: 'help-talk',
      type: 'interact',
      attempts: 6,
      title: 'Opening the door',
      text: `
        Noor has noticed that her brother Idris has not been himself for
        weeks. Tonight she asks how he is.

        Three things help in a talk like this: an **open question**,
        **listening** without fixing or judging, and **one small next
        step**.

        **Choose what Noor says**, three times, so that Idris feels heard
        each time. (You can start again.)
      `,
      widget: {
        type: 'dialogue', people: { a: 'Idris', b: 'Noor' },
        opening: ['"I am fine. Just tired. I have been tired for about two months, to be honest."'],
        turns: [
          { options: [
            { id: 'cheer', text: '"Come on, cheer up! You have so much going for you."', reply: '"Yeah. I know. Forget I said anything."', note: 'Meant kindly, but it tells him his feelings are wrong.' },
            { id: 'ask', text: '"Two months is a long time to feel like that. What has it been like?"', good: true, reply: '"Flat. Nothing is fun any more. I cannot even be bothered with football."', note: 'An open question, taken seriously.' },
            { id: 'compare', text: '"Everyone is tired. You should see the week I have had."', reply: '"Sure. Never mind."', note: 'Turning the talk to herself ends his turn to speak.' },
          ] },
          { options: [
            { id: 'fix', text: '"Have you tried going to bed earlier? Or vitamins?"', reply: '"It is not that simple."', note: 'A quick fix, before listening, sounds like "this is easy".' },
            { id: 'label', text: '"You are obviously depressed."', reply: '"So now you are a doctor?"', note: 'A diagnosis is not hers to give, and it lands as a verdict.' },
            { id: 'hear', text: '"That sounds really hard. I am glad you told me."', good: true, reply: '"I thought you would think I was being pathetic."', note: 'No fixing, no judging: she simply hears him.' },
          ] },
          { options: [
            { id: 'doctor', text: '"When it has gone on this long, a doctor is a good person to talk to. Shall I come with you?"', good: true, reply: '"…Maybe. If you came with me."', note: 'A small, concrete next step, and company for it.' },
            { id: 'wait', text: '"I am sure it will pass. Let us not make a drama of it."', reply: '"Right. Sure."', note: 'Two months of this deserves to be taken seriously.' },
            { id: 'order', text: '"You need to sort yourself out. See a doctor or stop moping."', reply: '"Thanks a lot."', note: 'An ultimatum adds shame to a heavy load.' },
          ] },
        ],
        alt: 'A conversation in speech bubbles between Idris and his sister Noor, with three choices for what Noor says next.',
      },
      check: (s) => {
        if (!s.done) return `That is ${s.turn} of 3 replies. Keep going.`;
        if (s.allGood) return true;
        return `${3 - s.good === 1 ? 'One reply' : `${3 - s.good} replies`} made Idris close up. Read the small notes in the conversation, then press "Start again".`;
      },
      solution: { picks: ['ask', 'hear', 'doctor'] },
      explain: `
        Noor asked an open question, listened without fixing or judging,
        and offered one small next step. A **family doctor** is the usual
        first door: they hear this every day, and can explain what help
        exists nearby.

        She did not need the right words. She needed to ask, and to stay.
      `,
    },
    {
      id: 'crisis',
      type: 'info',
      title: 'If someone talks about suicide',
      text: `
        In deep distress, some people have thoughts of ending their life,
        or hurt themselves. This is a sign of great pain. It is **not** a
        sign that things cannot get better: with support, most people come
        through such a time.

        If you are worried about someone:

        - **Ask directly**: "Are you thinking about suicide?" Asking does not plant the idea. It often brings relief.
        - **Listen, and take it seriously.** You do not have to fix it.
        - **If there is danger now, stay with them** and call your local emergency number.
        - **Help them reach support**: a crisis line, a doctor, someone they trust. Then stay in touch.

        :::note Help at any hour
        ${crisisPointers()}. These lines are for anyone, including you.
        :::
      `,
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'Something to do once',
      text: `
        One small, practical thing, if you are willing: **find out which
        number or service you would use where you live**, and save it in
        your phone. It takes two minutes, and it means the door is already
        open if you, or someone near you, should ever need it.

        :::note
        Asking for help with the mind is as ordinary as asking for help
        with a broken arm. The earlier, the easier. And for a friend, the
        most useful sentence is often the simplest: "How are you, really?"
        :::
      `,
    },
  ],
  recap: [
    'Mental health conditions are common, about **1 person in 7** worldwide, and usually invisible. They are health conditions, not flaws of character.',
    'What separates a hard time from a possible condition: **how long**, **how strong**, and **how much it gets in the way**. Only a professional can diagnose.',
    'Causes are a mix of biology, experience and circumstances. Therapy, medicine or both help, it can take more than one try, and **most people get better**.',
    `If someone is in crisis: ask directly, listen, stay, and get help: the local emergency number, or a crisis line (988 in the United States and Canada, 116 123 in the United Kingdom and Ireland, 13 11 14 in Australia; findahelpline.com lists others).`,
  ],
  next: 'Next: the last lesson. Why other people are good for your health, how to support a friend, and a toolkit to take away.',
};
