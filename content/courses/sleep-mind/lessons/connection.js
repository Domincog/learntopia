// Sleep, Stress and Mental Health · Lesson 7 · People Need People
// Driving question: can loneliness really harm a body, and what does it take to support someone well?
// Every conversation is between invented people. The steps that touch on death and on a crisis are tone: 'sober'.
import { LONELY, TIES, TIE_RISKS, HARVARD, SUPPORT_LINES, TOOLKIT, NATURE, crisisPointers } from '../helpers.js';

const range = (n) => Array.from({ length: n }, (_, i) => i);

export default {
  id: 'connection',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      mode: 'predict',
      title: 'Sixty people',
      text: `
        Here are 60 people, drawn from every country and every age.

        **Tap as many as you think would say that they feel lonely.**
      `,
      widget: { type: 'grid', rows: 6, cols: 10, shape: 'circle', colors: ['violet'], counter: 'Marked', cell: 40, alt: 'Sixty circles in six rows of ten, standing for sixty people.' },
      check: (s) => Math.abs(s.on.length - 10) <= 2,
      solution: { on: range(10) },
      explain: `
        About **10**: the World Health Organization estimates that roughly
        **1 person in ${LONELY.oneIn}** is affected by loneliness. It is found at every
        age, and it is most common among teenagers and young adults, not
        the old.

        This lesson asks why that matters for health, and what people can
        do for one another.
      `,
    },
    {
      id: 'teach-lonely',
      type: 'info',
      title: 'Two different things',
      text: `
        **Loneliness** is a feeling: the gap between the contact a person
        has and the contact they want. It is about the quality of
        contact, not the head count.

        **Social isolation** is a fact: having few people in one's life.

        They often go together, but not always:

        | | Wants more contact | Has the contact they want |
        |---|---|---|
        | **Many people around** | lonely | not lonely |
        | **Few people around** | lonely, and isolated | isolated, but not lonely |

        Both loneliness and isolation turn out to matter for health.
      `,
    },
    {
      id: 'lonely-or-alone',
      type: 'bucket',
      title: 'Lonely is not the same as alone',
      text: '**Which of these people are lonely?**',
      buckets: ['Lonely', 'Not lonely'],
      items: [
        { text: 'Surrounded by colleagues all day, and feels that nobody really knows her', bucket: 0, why: 'Loneliness is about the quality of contact, not the head count.' },
        { text: 'New in the city, knows nobody yet, and aches for company', bucket: 0 },
        { text: 'Has 2,000 followers online, and nobody to call when something goes wrong', bucket: 0 },
        { text: 'Lives by himself, sees friends most days, and is content', bucket: 1, why: 'Living alone is not the same as feeling lonely.' },
        { text: 'Spends a week hiking alone, by choice, and loves it', bucket: 1 },
        { text: 'Has two close friends and wants no more', bucket: 1 },
      ],
      explain: `
        What decides it is the gap between the contact a person has and
        the contact they want. A day full of colleagues, or 2,000
        followers, can leave that gap wide open. A week alone, by choice,
        can leave none.
      `,
    },
    {
      id: 'survival',
      type: 'slider',
      mode: 'predict',
      tone: 'sober',
      title: 'Does it show in the body?',
      text: `
        Researchers pooled ${TIES.studies} studies that had followed about
        ${TIES.people.toLocaleString('en-US')} people for ${TIES.years} years on average.

        Compared with people whose social ties were weak, those with
        **strong ties** were how much more likely to be still alive at the
        end?
      `,
      min: 0, max: 100, step: 5, answer: TIES.survivalPct, tolerance: 10, unit: '%', start: 0,
      explain: `
        About **${TIES.survivalPct}%** more likely: a difference of the same order as
        well-known risks such as smoking.

        A caution: these studies watch people, they do not run experiments.
        Illness can itself cut a person off, and although the researchers
        allowed for people's health at the start, some of the link may run
        that way. Popular slogans ("as bad as fifteen cigarettes a day")
        claim more precision than the evidence has.
      `,
    },
    {
      id: 'risk',
      type: 'numeric',
      review: true,
      tone: 'sober',
      gen: (rng) => {
        const r = rng.pick(TIE_RISKS);
        // One person in ten dies during the study: at that level the pooled figure (strictly an odds ratio)
        // and "% more likely" are nearly the same thing. At higher death rates they drift apart.
        const group = rng.pick([2000, 3000, 4000, 5000]);
        const many = group.toLocaleString('en-US');
        const base = group / 10;
        const extra = (base * r.pct) / 100;
        return {
          text: `
            A pooled analysis of many long-running studies found that people
            who ${r.what} were about **${r.pct}% more likely** to die during the
            years of the study than otherwise similar people.

            Picture ${many} older adults ${r.other}, of whom **${base}** die
            during a study. **Among ${many} similar adults ${r.group}, about
            how many deaths would this predict?** (For example, 20% more
            than 50 would be 50 + 10 = 60.)
          `,
          answer: base + extra,
          unit: 'deaths',
          wrong: [
            [extra, `That is the number of extra deaths: ${r.pct}% of ${base}. Add it to the ${base}.`],
            [base + r.pct, `"${r.pct}% more" means ${r.pct}% of ${base} more, not ${r.pct} more.`],
          ],
          hints: [`First find ${r.pct}% of ${base}.`, `${r.pct}% of ${base} is ${extra}. Add that to ${base}.`],
          explain: `${r.pct}% of ${base} is ${extra}, so about ${base} + ${extra} = **${base + extra}** in ${many}, against ${base} in ${many}. Turning "${r.pct}% more likely" into numbers of people shows the real size of a risk. *Staying Well* returns to this skill.`,
        };
      },
    },
    {
      id: 'teach-pathways',
      type: 'info',
      title: 'Four pathways',
      text: `
        Nobody thinks friendship works by magic. Researchers point to four
        pathways that lead from company to health:

        - **A calmer stress system.** Support dampens the stress response
          of Lesson 4.
        - **Better habits.** Other people pull us into healthier
          routines, and towards the doctor.
        - **Practical help.** They help in emergencies.
        - **A reason to keep going.** Being needed gives days a purpose.

        Long-lasting loneliness does the reverse: it acts like a chronic
        stress.
      `,
    },
    {
      id: 'pathways',
      type: 'match',
      title: 'How company gets under the skin',
      text: 'Nobody thinks friendship works by magic. **Match each pathway with an example.**',
      pairs: [
        ['A calmer stress system', 'With a trusted person nearby, the alarm reaction is smaller'],
        ['Better habits', 'A friend drags you out for a walk, or notices that you look ill'],
        ['Practical help', 'A neighbour drives you to hospital, or brings a meal'],
        ['A reason to keep going', 'Somebody is counting on you'],
      ],
      explain: `
        A smaller alarm, a walk and a watchful eye, a lift to hospital,
        somebody counting on you: four different routes by which the same
        few people protect a person's health.
      `,
    },
    {
      id: 'harvard',
      type: 'choice',
      title: 'Eighty years of watching',
      text: `
        Since ${HARVARD.started}, researchers in Boston have followed ${HARVARD.total} men, who
        joined the study as students or as boys from the city's poorest
        streets, through their whole lives.

        Remember what the pooled studies found about social ties. **Which
        of these, measured at the age of 50, best predicted who would be
        healthy at 80?**
      `,
      columns: 1,
      options: [
        { text: 'How satisfied they were with their relationships', correct: true },
        { text: 'Their cholesterol level', why: 'Cholesterol mattered, but it predicted health at 80 less well than satisfaction with relationships did.' },
        { text: 'Their income', why: 'Money, beyond escaping poverty, was not the best predictor. The men who did best were those with warm, dependable relationships.' },
        { text: 'How successful they had become in their careers', why: 'Fame and success at 50 did not predict health at 80. Close relationships did.' },
      ],
      explain: `
        Their **relationships**. It was not the number of friends that
        counted, nor being married, but having people one could rely on.

        The usual cautions apply. The first volunteers were all men from
        one American city, and a study that watches cannot prove what
        causes what. But many other studies point the same way.
      `,
    },
    {
      id: 'teach-support',
      type: 'info',
      title: 'How to be there for someone',
      text: `
        When someone is having a hard time, four things help:

        - **Listen** before anything else.
        - **Do not rush to fix** what cannot be fixed in an evening.
        - **Ask** what would help, instead of guessing.
        - **Stay in touch**: make a small, definite offer, and come back.

        Replies that shut the door are usually meant kindly. They
        **correct** the feeling ("You should not feel that way"),
        **compare** it away ("It could be so much worse"), **rush to
        fix** it ("Here is what you need to do"), or turn the talk to the
        speaker's own story.
      `,
    },
    {
      id: 'listen',
      type: 'interact',
      attempts: 6,
      title: 'Being there',
      text: `
        Elif lost her job three weeks ago and has gone quiet. Her friend
        Chidi calls round.

        **Choose what Chidi says**, three times, so that Elif feels heard
        each time. (You can start again.)
      `,
      widget: {
        type: 'dialogue', people: { a: 'Elif', b: 'Chidi' },
        opening: ['"Sorry I have not answered your messages. I have not felt like seeing anyone."'],
        turns: [
          { options: [
            { id: 'silver', text: '"Honestly, that job was beneath you. This is a blessing in disguise!"', reply: '"It does not feel like a blessing."', note: 'A silver lining, offered too soon, tells her she should not feel bad.' },
            { id: 'fix', text: '"Right. Have you updated your CV? I can send you five job adverts tonight."', reply: '"I cannot even think about that yet."', note: 'Fixing before listening: he has skipped the part she needed.' },
            { id: 'open', text: '"No need to be sorry. I just wanted to see you. How have these weeks been?"', good: true, reply: '"Awful, honestly. I feel useless. I get up at noon."', note: 'No pressure, and an open question.' },
          ] },
          { options: [
            { id: 'hear', text: '"That sounds really hard. Losing a job knocks anyone sideways."', good: true, reply: '"It helps to hear that. Everyone else just tells me to be positive."', note: 'He names the feeling and does not argue with it.' },
            { id: 'worse', text: '"Well, at least you have savings. Some people have nothing."', reply: '"I know. I should not complain."', note: '"At least" shrinks her trouble and adds guilt.' },
            { id: 'me', text: '"I know exactly how you feel. When I failed my driving test…"', reply: '"…Right."', note: 'The conversation is now about Chidi.' },
          ] },
          { options: [
            { id: 'vague', text: '"Well, let me know if you need anything."', reply: '"Sure. Thanks."', note: 'Kind, but it leaves the asking to the person least able to ask.' },
            { id: 'plan', text: '"Would it help to have company? I could come by on Thursday, and we could go for a walk."', good: true, reply: '"…Yes. I would like that."', note: 'A small, definite offer, and a promise to come back.' },
            { id: 'push', text: '"You cannot hide in here for ever. Come out with us tonight, no excuses."', reply: '"I am really not up to it."', note: 'Pressure, however well meant, makes it harder to say what she needs.' },
          ] },
        ],
        alt: 'A conversation in speech bubbles between Elif and her friend Chidi, with three choices for what Chidi says next.',
      },
      check: (s) => {
        if (!s.done) return `That is ${s.turn} of 3 replies. Keep going.`;
        if (s.allGood) return true;
        return `${3 - s.good === 1 ? 'One reply' : `${3 - s.good} replies`} made Elif pull back. Read the small notes in the conversation, then press "Start again".`;
      },
      solution: { picks: ['open', 'hear', 'plan'] },
      explain: `
        Chidi **listened** before anything else, **did not try to fix**
        what cannot be fixed in an evening, **asked** instead of guessing
        what would help, and **promised to stay in touch**.

        None of it needed special training. Most people in trouble do not
        want an answer. They want not to be alone with it.
      `,
    },
    {
      id: 'opens-or-shuts',
      type: 'bucket',
      review: true,
      gen: (rng) => {
        const lines = rng.shuffle([...rng.sample(SUPPORT_LINES.filter((l) => l.opens), 3), ...rng.sample(SUPPORT_LINES.filter((l) => !l.opens), 3)]);
        return {
          text: 'A friend has just told you about something painful. **Which of these replies keep the conversation open, and which shut it down?**',
          buckets: ['Opens the door', 'Shuts it'],
          items: lines.map((l) => ({ text: l.text, bucket: l.opens ? 0 : 1, why: l.why })),
          explain: 'The replies that help make room: they acknowledge the feeling, ask, or offer to stay near. The ones that shut the door are usually meant kindly, but they correct the feeling, compare it away, or rush to fix it.',
        };
      },
    },
    {
      id: 'limits',
      type: 'interact',
      attempts: 6,
      title: 'Knowing your limits',
      text: `
        For three months Mateo has been the one his friend Dev calls, often
        late at night. He cares about Dev, and he is exhausted. At 23:40
        his phone lights up again.

        A supporter may set a limit, kindly. And a friend is one support
        among several, not the whole net.

        **Choose what Mateo says**, twice, so that he stays a good friend
        **and** looks after himself.
      `,
      widget: {
        type: 'dialogue', people: { a: 'Dev', b: 'Mateo' },
        opening: ['"Are you awake? I need to talk again."'],
        turns: [
          { options: [
            { id: 'always', text: '"Of course. Any time, all night, for as long as you need."', reply: '"Thanks. You always say that."', note: 'Generous, but nobody can keep it up, and a worn-out friend helps no one.' },
            { id: 'limit', text: '"I am here. I can talk for half an hour tonight, and I will call you tomorrow after work."', good: true, reply: '"OK. Half an hour helps. Thank you."', note: 'A clear limit, offered warmly, is one he can keep.' },
            { id: 'snap', text: '"Not again. I cannot do this any more."', reply: '"Sorry. I will not bother you again."', note: 'His tiredness is real, but said like this it lands as rejection.' },
          ] },
          { options: [
            { id: 'wider', text: '"I am glad to be one of your people. You deserve more than one. Could we look at seeing a doctor? I would help you book."', good: true, reply: '"I have been putting that off. …Maybe, if you helped."', note: 'A friend is one support among several, not the whole net.' },
            { id: 'only', text: '"You are right. I am all you have got."', reply: '"I know. Sorry."', note: 'Being someone\'s only support is too heavy for any one person.' },
            { id: 'guilt', text: '"That puts a lot of pressure on me, you know."', reply: '"Sorry."', note: 'True, but it leaves Dev with guilt and no next step.' },
          ] },
        ],
        alt: 'A conversation in speech bubbles between Dev and his friend Mateo, late at night, with choices for what Mateo says next.',
      },
      check: (s) => {
        if (!s.done) return `That is ${s.turn} of 2 replies. Keep going.`;
        if (s.allGood) return true;
        return 'Not quite: one of those replies either wears Mateo out or pushes Dev away. Read the notes in the conversation, then press "Start again".';
      },
      solution: { picks: ['limit', 'wider'] },
      explain: `
        Supporting someone is a long game, and it can only be played by a
        person who is still standing. Mateo may say what he can give, keep
        up his own sleep and friendships, and help Dev towards **other
        support**, including professionals. That is not a lesser kind of
        friendship. It is the kind that lasts.
      `,
    },
    {
      id: 'crisis',
      type: 'choice',
      tone: 'sober',
      title: 'When it is more than a friend can carry',
      text: `
        A week later Dev says something that frightens Mateo: that he
        cannot see the point of going on.

        **What should Mateo do?**
      `,
      columns: 1,
      options: [
        { text: 'Take it seriously, ask him directly, stay with him, and get help', correct: true },
        { text: 'Promise to keep it secret, so that Dev goes on trusting him', why: 'This is the one secret a friend should not keep. It is kind to say: "I care about you too much to keep this to myself."' },
        { text: 'Deal with it alone, as he has dealt with everything else', why: 'No friend is a crisis service. This is the moment to bring in people who are trained for it.' },
        { text: 'Change the subject to something cheerful', why: 'Steering away tells Dev that it cannot be spoken about. Asking directly does not plant the idea, and it often brings relief.' },
      ],
      explain: `
        He asks plainly whether Dev is thinking about suicide, listens, and
        does not leave him alone with it. If Dev is in danger now, Mateo
        calls the local emergency number. Otherwise they contact a crisis
        line or a doctor together. People come through times like this,
        and help works.

        ${crisisPointers()}.
      `,
    },
    {
      id: 'teach-what-else',
      type: 'info',
      title: 'What the large studies find',
      text: `
        Many things are said to make or break wellbeing. Here is what
        large studies find for three of them.

        - **Social media.** In surveys of hundreds of thousands of
          teenagers, time on social media explains very little of the
          difference in wellbeing. But averages hide a lot: a small
          average can hide real harm to some.
        - **Nature.** In a survey of about ${NATURE.people.toLocaleString('en-US')} people in England, those
          who spent at least ${NATURE.minutes} minutes a week in nature more often
          reported good health. A survey watches people. It does not run
          an experiment.
        - **Gratitude and kindness.** In trials, gratitude exercises and
          doing kind things for others gave a small lift in wellbeing.
      `,
    },
    {
      id: 'screens',
      type: 'choice',
      title: 'Connected by screens',
      text: `
        Much of life with other people now runs through social media, and
        many worry about what that does to wellbeing, above all in
        teenagers.

        **Taken together, what do the large studies show so far?**
      `,
      columns: 1,
      options: [
        { text: 'On average a small link, with big differences in who is affected and in how it is used', correct: true },
        { text: 'Proof that social media is the main cause of poor mental health in the young', why: 'Some researchers argue this and others dispute it. The studies so far cannot settle it, and the average link they measure is small.' },
        { text: 'Proof that it harms nobody', why: 'A small average can hide real harm to some: through lost sleep, bullying or endless comparison with others.' },
      ],
      explain: `
        The honest summary is **mixed**: a small link on average, and
        averages hide a lot.

        What seems to matter is the **how**: keeping up with real friends
        tends to go with feeling better; scrolling strangers' highlights
        late at night, in place of sleep, with feeling worse.
      `,
    },
    {
      id: 'what-else',
      type: 'fill',
      title: 'What else helps, modestly',
      text: 'Many things are sold as the secret of wellbeing. **Complete the summary of what the evidence supports.**',
      template: `People who spend at least [[20|*${NATURE.minutes}|600]] minutes a week in nature more often report good health: a finding that [[proves nature is the cause|*shows a link, not proof of cause]]. Trials of gratitude exercises, and of doing kind things for others, find a [[huge|*small]] lift in wellbeing for the person who does them.`,
      explain: `
        Two hours a week outdoors, a sense of purpose, helping others,
        noticing what went well: each has some support, and none is a
        miracle. They share something with everything else in this
        lesson. Most of them connect a person to other people.
      `,
    },
    {
      id: 'toolkit',
      type: 'match',
      review: true,
      gen: (rng) => {
        const four = rng.sample(TOOLKIT, 4);
        return {
          text: 'One tool from each part of this course. **Match each situation with the tool that fits it best.**',
          pairs: four.map((x) => [x.situation, x.tool]),
          explain: `Each tool follows from a mechanism: ${four.map((x) => `${x.tool.charAt(0).toLowerCase()}${x.tool.slice(1).replace(/\?$/, '')} (Lesson ${x.lesson})`).join('; ')}. Knowing why a tool works is what makes it easy to remember, and to adapt.`,
        };
      },
    },
    {
      id: 'reach-out',
      type: 'info',
      title: 'One small thing',
      text: `
        Is there someone you have been meaning to get in touch with: a
        friend who has gone quiet, a relative, an old colleague?

        If you like, pick **one small way** to do it this week. A message
        that says "I thought of you today", a photo of something you would
        both laugh at, ten minutes on the phone, an invitation to walk.

        :::note
        Studies of reaching out find the same thing again and again:
        people underestimate how glad the other person will be to hear
        from them.
        :::
      `,
    },
  ],
  recap: [
    '**Loneliness** is the gap between the contact a person has and the contact they want. About 1 person in 6 feels it, and it is linked with poorer health and a shorter life.',
    'To support someone: **listen, do not rush to fix, ask what would help, stay in touch**. Know your limits, and bring in other help.',
    'In a crisis: take it seriously, ask directly, stay, and call the emergency number or a crisis line. Help works, and people recover.',
    'The whole course in a line: protect your **sleep**, respect your **body clock**, give stress a way to **switch off**, check your **thoughts**, ask for **help** early, and keep your **people** close.',
  ],
  next: 'That completes *Sleep, Stress and Mental Health*. Next on the path, *Staying Well: Prevention and Everyday Medicine*: infections, vaccines, medicines, check-ups, and how to judge a health claim.',
};
