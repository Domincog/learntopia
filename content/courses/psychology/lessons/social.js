// Psychology: How Minds Work · Lesson 7 · The Power of the Situation
//
// Driving question: would you have gone along with it?
// Sources for the facts are noted in ../helpers.js.
import { ASCH, MILGRAM, BURGER, STANFORD, BYSTANDER, GENOVESE, STREET, SOCIAL_YEARS as Y, CROWD_CASES, ATTRIBUTION_CASES, SOCIAL_SOLID, pct } from '../helpers.js';

const PARTNER_ROUNDS = [
  { standard: 150, lines: [110, 150, 190], group: null },
  { standard: 170, lines: [140, 200, 170], group: 0 },
  { standard: 130, lines: [165, 105, 130], group: 0 },
];
const byObedience = [...MILGRAM.variations].sort((a, b) => b.pct - a.pct);
const milgramPct = pct(MILGRAM.toEnd, MILGRAM.men);
const solidTable = () => {
  const solid = SOCIAL_SOLID.filter((x) => x.bucket === 0);
  const weak = SOCIAL_SOLID.filter((x) => x.bucket === 1);
  return ['| Well supported | Weaker than its fame |', '|---|---|', ...solid.map((x, i) => `| ${x.short} | ${weak[i].short} |`)].join('\n        ');
};

export default {
  id: 'social',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      graded: false,
      title: 'A simple judgement',
      text: `
        You are one of six people taking part in a study of visual judgement. On each round, say **which of the three lines is the same length as the standard**.

        The others give their answers before you, one at a time.
      `,
      widget: { type: 'line-judge' },
      check: (s) => s.done || `Give your answer on each round (${s.round} of 6 done).`,
      solution: { done: true },
      explain: `
        The other five were scripted, and on three rounds they were scripted to agree on a wrong answer. Solomon Asch ran this in the 1950s with real people in a real room: one genuine participant, and six to eight others who were secretly working for him.

        On a screen, with drawn "participants" you know are not real, there is little pressure, so however you answered tells you little. In Asch's room, a row of confident strangers looked at the same lines as you and calmly said something that was plainly wrong.
      `,
    },
    {
      id: 'teach-asch',
      type: 'info',
      title: 'What people did in Asch\'s room',
      text: `
        The task was easy: answering alone, people made mistakes less than ${ASCH.aloneErrorPct}% of the time. In the group, the real participant answered last or nearly last, after everyone else had given the same wrong answer.

        Across ${ASCH.participants} participants, people went along with the group on **about ${Math.round(ASCH.conformedPct)}%** of those rounds. About ${ASCH.everShare}% went along at least once, and about ${ASCH.neverShare}% never did.

        Giving the group's answer against your own judgement is called **conformity**. Interviewed afterwards, some of those who had yielded said they had come to doubt their own eyes. Others knew the group was wrong and did not want to stand out.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 25, unit: '%', yLabel: 'wrong answers',
        data: [
          { label: 'Answering\nalone', value: ASCH.aloneErrorPct, color: 'gray' },
          { label: 'After a unanimous\nwrong group', value: Math.round(ASCH.conformedPct), color: 'orange' },
        ],
        alt: `Bar chart of wrong answers in Asch's line task: under ${ASCH.aloneErrorPct} percent when people answered alone, about ${Math.round(ASCH.conformedPct)} percent after the rest of the group had agreed on a wrong answer.`,
        caption: `Asch, 1956. Alone, the share was under ${ASCH.aloneErrorPct}%.`,
      },
    },
    {
      id: 'asch-numbers',
      type: 'slider',
      title: 'Read it both ways',
      text: `
        Asch's result is usually told as "people give in to the group". Turn it round.

        Count only the rounds on which the rest of the group agreed on a wrong answer. **On what percentage of those rounds did the real participants say what they saw, against everyone else in the room?**
      `,
      min: 0, max: 100, step: 1, answer: 100 - Math.round(ASCH.conformedPct), tolerance: 3, start: 0, unit: '%',
      hints: [`They went along on about ${Math.round(ASCH.conformedPct)}% of the rounds. What is left?`],
      explain: `
        **About ${100 - Math.round(ASCH.conformedPct)}%**: 100 − ${Math.round(ASCH.conformedPct)}. A wrong majority moved many people to deny their own eyes. And on nearly two thirds of the rounds, people said what they saw, against everyone else. Both halves are the finding.
      `,
    },
    {
      id: 'partner',
      type: 'interact',
      graded: false,
      title: 'One other voice',
      text: `
        Asch then changed one thing. Play three more rounds and **watch participant no. 4**.
      `,
      widget: { type: 'line-judge', ally: true, rounds: PARTNER_ROUNDS },
      check: (s) => s.done || `Give your answer on each round (${s.round} of 3 done).`,
      solution: { done: true },
      explain: `
        With a single partner who gave the right answer, conformity fell to about **a quarter** of what it had been. The partner did not need to be persuasive or even competent-looking; breaking the unanimity was enough.

        The reverse matters as much: it means that one person who speaks up makes it far easier for the next.
      `,
    },
    {
      id: 'milgram',
      type: 'interact',
      mode: 'predict',
      tone: 'sober',
      title: 'Milgram\'s experiment',
      text: `
        Yale University, early 1960s. ${MILGRAM.men} men answered an advertisement for a "study of memory". Each was made the "teacher". An experimenter in a grey coat told him to give a "learner" in the next room an electric shock for every mistake, 15 volts stronger each time, on a machine that went up to ${MILGRAM.volts} volts. The learner was an actor and received no shocks; at 300 volts he pounded on the wall, and then fell silent.

        Psychiatrists asked beforehand predicted that about one person in a thousand would go to the end. **Drag the bar to your own guess.**
      `,
      widget: {
        type: 'bars', adjust: true, step: 1, yMax: 100, yStep: 20, unit: '%', yLabel: `continued to ${MILGRAM.volts} volts`,
        data: [{ label: `Went on to ${MILGRAM.volts} volts`, value: 10, color: 'gray' }],
        alt: 'One adjustable bar: the percentage of participants who continued to the 450-volt end of the scale.',
      },
      check: (s) => s.values[0][0] >= 50,
      solution: { values: [[milgramPct]] },
      explain: `
        **${MILGRAM.toEnd} of the ${MILGRAM.men}: ${milgramPct}%** (Stanley Milgram, ${MILGRAM.year}). They did not go quietly. Many sweated, trembled, argued and pleaded with the experimenter to stop, and went on when he said, "The experiment requires that you continue."

        The participants were deceived and put through severe stress, and not all were told the truth promptly afterwards. The study provoked a debate about research ethics that led to today's rules, under which it could not be run.
      `,
    },
    {
      id: 'milgram-vary',
      type: 'order',
      mode: 'predict',   // nobody could work out the exact order: it is a guess that sets up the table
      tone: 'sober',
      title: 'It depended on the details',
      text: `
        The ${milgramPct}% is one result out of more than twenty. Milgram varied the set-up, and the share who went to the end changed enormously. **Predict the order, from the highest share to the lowest.**
      `,
      items: byObedience.map((v) => v.label),
      labels: ['Most went to the end', 'Fewest'],
      explain: `
        | Version | Went to ${MILGRAM.volts} volts |
        |---|---:|
        ${byObedience.map((v) => `| ${v.label} | ${v.pct}% |`).join('\n        ')}

        The closer the victim, the further away the authority, and the more company a person had in refusing, the fewer went on. "${milgramPct}% of people obey" is not a fact about human nature. It is what happened in one particular arrangement.
      `,
    },
    {
      id: 'teach-milgram-reading',
      type: 'info',
      tone: 'sober',
      title: 'Three things learned since',
      text: `
        - **A repeat.** A partial repeat in ${BURGER.year} was halted at ${BURGER.stopVolts} volts to protect participants. ${BURGER.readyPct}% were prepared to go on past that point, against ${BURGER.milgramPct}% in Milgram's comparable version: a gap small enough, in groups of that size, to be chance.
        - **The archives.** Records opened to researchers decades later show a messier experiment than the published account. The experimenter often went beyond his script, and some participants doubted the shocks were real.
        - **The prompts.** The experimenter had a set of prompts for a participant who hesitated. People continued when persuaded that the research mattered. The one prompt that was a flat order worked worst.

        An influential modern reading is less "blind obedience" than **followership**: people went along when they identified with the experimenter and believed the science was worthwhile, and broke off when that broke down.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 25, unit: '%', yLabel: `ready to go on past ${BURGER.stopVolts} volts`,
        data: [
          { label: 'Milgram\'s\ncomparable version', value: BURGER.milgramPct, color: 'gray' },
          { label: `Partial repeat,\n${BURGER.year}`, value: BURGER.readyPct, color: 'orange' },
        ],
        alt: `Bar chart of the share of participants ready to continue past ${BURGER.stopVolts} volts: ${BURGER.milgramPct} percent in Milgram's comparable version, ${BURGER.readyPct} percent in the ${BURGER.year} partial repeat.`,
      },
    },
    {
      id: 'milgram-read',
      type: 'multi',
      tone: 'sober',
      title: 'What Milgram does and does not show',
      text: 'Milgram\'s studies are among the most discussed in psychology. **Which statements are accurate?**',
      columns: 1,
      options: [
        { text: 'When the experimenter was out of the room, or when others refused, most participants stopped', correct: true },
        { text: `A partial repeat in ${BURGER.year}, halted at ${BURGER.stopVolts} volts to protect participants, found people about as willing to continue as in Milgram's day`, correct: true },
        { text: 'Records in the archives show that the experimenter often went beyond his script, and that some participants doubted the shocks were real', correct: true },
        { text: 'The studies show that ordinary people will blindly obey any order', why: 'The one prompt that was a flat order ("You have no other choice, you must go on") worked worst: in the 2009 repeat, nobody who heard it carried on. People continued when persuaded that the research mattered.' },
        { text: 'Participants went on because they did not care about the learner', why: 'Their distress shows the opposite. They were torn between two things they cared about: the man next door, and a scientific project they had agreed to help.' },
      ],
      explain: `
        "Followership" fits the details better than "blind obedience": the participants were torn, they could be persuaded, and a bare order moved them least.

        None of that makes the result comfortable. Ordinary people, persuaded that a cause is good, did something they believed was hurting a man.
      `,
    },
    {
      id: 'stanford',
      type: 'choice',
      tone: 'sober',
      title: 'The prison in the basement',
      text: `
        In ${STANFORD.year} Philip Zimbardo turned a basement at Stanford University into a mock prison and assigned student volunteers at random to be "guards" or "prisoners". It was planned to last ${STANFORD.plannedDays} days and was stopped after ${STANFORD.ranDays}, as some guards had become abusive. For decades textbooks drew the lesson: *put ordinary people in a role, and the role takes over.*

        Recordings and notes from the archive, published in ${STANFORD.critique}, show the organisers telling guards how to behave and pressing lenient ones to be tougher. There was no control group, and the study was run only once.

        **Why is the study weak evidence for the textbook lesson?**
      `,
      columns: 1,
      options: [
        { text: 'It was one unrepeated demonstration with nothing to compare it with, and the guards had been coached to be tough', correct: true },
        { text: 'Because the volunteers were paid to take part', why: 'Paying participants is normal and does not by itself spoil a study.' },
        { text: 'Because the same result has been found too many times to be interesting', why: 'The opposite. When British researchers ran a similar study in 2001 without coaching, the guards were reluctant to use their power.' },
      ],
      explain: `
        Lesson 1's questions again: compared with what, and has anyone repeated it? Most guards were not cruel, and the researcher was also the "prison superintendent".

        The study does not show that roles turn people into brutes unprompted. If anything it fits what Milgram's variations show: people do harm when a leader they trust tells them it serves a good cause.
      `,
    },
    {
      id: 'bystander',
      type: 'info',
      title: 'Someone else will do it',
      text: `
        ${BYSTANDER.year}. A student sits alone in a booth, talking with other students over an intercom. One of the others begins to stammer, says he is having a seizure, and calls for help. (It was a recording.) John Darley and Bibb Latané counted how many left the booth to get help before the voice cut off.

        Of those who believed they were the **only** listener, ${BYSTANDER.alone}% went. With one other listener it was ${BYSTANDER.oneOther}%, and with four others ${BYSTANDER.fourOthers}%.

        The more people who could help, the less each one feels it is up to them: **diffusion of responsibility**. The students who stayed put were not indifferent. They were found tense and upset, unsure whether to act and assuming someone else already had.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 25, unit: '%', yLabel: 'went for help',
        data: [
          { label: 'Only\nlistener', value: BYSTANDER.alone, color: 'orange' },
          { label: 'One other\nlistener', value: BYSTANDER.oneOther, color: 'gray' },
          { label: 'Four other\nlisteners', value: BYSTANDER.fourOthers, color: 'gray' },
        ],
        alt: `Bar chart of the share of students who went for help: ${BYSTANDER.alone} percent of those who thought they were the only listener, ${BYSTANDER.oneOther} percent with one other listener, ${BYSTANDER.fourOthers} percent with four others.`,
        caption: `Darley and Latané, ${BYSTANDER.year}`,
      },
    },
    {
      id: 'genovese',
      type: 'multi',
      tone: 'sober',
      title: 'The story behind the research',
      text: `
        That experiment was prompted by a murder. In March ${GENOVESE.year} Kitty Genovese was attacked and killed near her home in New York. A newspaper reported that ${GENOVESE.claimed} neighbours had watched for half an hour and that none had called the police, and the story went round the world.

        Historians and psychologists re-examined the case decades later (${GENOVESE.corrected}): few neighbours saw anything clearly, and some did call out or telephone. And in ${STREET.conflicts} street conflicts filmed by cameras in three countries (${STREET.year}), bystanders stepped in in about ${STREET.helpedInTen} out of 10, more often when more people were around.

        **Which statements fit what is now known?**
      `,
      columns: 1,
      options: [
        { text: 'The newspaper account was wrong in important ways', correct: true },
        { text: 'When a real conflict breaks out in a public place, the usual outcome is that somebody steps in', correct: true },
        { text: 'People who live in big cities do not care about strangers', why: 'Neither her case nor the research shows this. Hesitation comes from uncertainty and from assuming others have acted, and it is found everywhere.' },
        { text: 'The more people are present, the less likely it is that anyone at all will help', why: 'Each individual is less likely to act. But in real conflicts caught on camera, the more people were present, the more likely it was that at least one of them stepped in.' },
      ],
      explain: `
        There was no group of ${GENOVESE.claimed} silent watchers, and the newspaper itself has since called its report flawed. A real person's death became a legend that was untrue to her neighbours.

        The laboratory effect is real: each person is slower to act when others could. But with more people around, it is more likely that at least one of them does.
      `,
    },
    {
      id: 'diffuse',
      type: 'choice',
      review: true,
      tone: 'sober',
      columns: 1,
      gen: (rng) => {
        const c = rng.pick(CROWD_CASES);
        const who = `${c.who.charAt(0).toUpperCase()}${c.who.slice(1)}`;
        return {
          text: `
            ${c.scene}. Someone needs to ${c.task}.

            **Knowing how responsibility spreads thin in a crowd, what is the best thing to say?**
          `,
          options: [
            { text: `Look at one person and say: "${who}: ${c.task} now."`, correct: true },
            { text: `Call out to everyone: "Somebody ${c.task}!"`, why: '"Somebody" is the problem. Each person can assume the call is meant for someone else, or has been answered already.' },
            { text: 'Say nothing: with this many people, someone will already have done it', why: 'That is the very thought each onlooker is having. It is how a crowd of well-meaning people ends up doing nothing.' },
          ],
          explain: `
            Pick out **one person** and give them **one job**. That puts the responsibility on a named pair of shoulders, and the diffusion stops. First-aid courses teach exactly this: one person calls, another fetches the defibrillator (see the *First Aid* course on this site).

            And if you are the onlooker: assume nobody has acted yet.
          `,
        };
      },
    },
    {
      id: 'teach-attribution',
      type: 'info',
      title: 'Person or situation?',
      text: `
        To explain what someone did, we can point to the **person** ("that is the kind of man he is") or to the **situation** ("anyone would, in his place"). Psychologists call such an explanation an **attribution**.

        Studies show a steady tilt. Observers explain other people's behaviour by character, even when they have been told the person had no choice. The tilt is called the **fundamental attribution error**. For our own slips it runs the other way: we blame the situation.

        :::example
        A stranger lets a door swing shut in your face. First thought: "How rude." A rival explanation from the situation: his arms were full, or he never saw you.
        :::
      `,
    },
    {
      id: 'fae',
      type: 'choice',
      review: true,
      title: 'Why did they do that?',
      columns: 1,
      gen: (rng) => {
        const c = rng.pick(ATTRIBUTION_CASES);
        return {
          text: `
            ${c.act}. The explanation that comes first to most onlookers: *"${c.person}."*

            **What does research say about that kind of first explanation?**
          `,
          options: [
            { text: 'We tend to overrate character and underrate the situation when explaining what other people do', correct: true },
            { text: 'First impressions of character are usually right', why: 'Sometimes they are. But studies show a steady tilt: observers explain behaviour by personality even when they have been told the person had no choice.' },
            { text: 'We tend to blame the situation too much and let people off', why: 'That is closer to how we explain our own slips. For other people, the tilt goes the other way.' },
          ],
          explain: `
            This tilt is called the **fundamental attribution error**. Here the situation offers a good rival explanation: ${c.situation.charAt(0).toLowerCase()}${c.situation.slice(1)}.

            The whole lesson has been a demonstration of it: we expect conformity, obedience and helping to depend on what kind of person someone is, and they turn out to depend heavily on the set-up. The tilt is not universal, though: it is weaker in studies from India, China and Japan than in those from the United States.
          `,
        };
      },
    },
    {
      id: 'dissonance',
      type: 'choice',
      title: 'One dollar or twenty',
      text: `
        Leon Festinger proposed that holding two thoughts that clash is uncomfortable (**cognitive dissonance**), and that people ease the clash by changing whichever thought is easiest to change. A good outside reason for what you did removes the clash.

        He tested it in ${Y.festinger}. Students spent an hour on a deliberately boring task. Then each was asked to tell the next participant that it was fun, for a payment of **${Y.small} dollar** or of **${Y.large} dollars**. Later, all were asked privately how enjoyable the task really was.

        **On Festinger's idea, which group should rate it higher?**
      `,
      columns: 1,
      options: [
        { text: 'Those paid 1 dollar', correct: true },
        { text: 'Those paid 20 dollars', why: 'A natural guess: more reward, more liking. But twenty dollars is a good outside reason for a small lie, so no clash is left to ease.' },
        { text: 'No difference: everyone found it boring', why: 'The poorly paid group has a clash to ease, between "it was dull" and "I told someone it was fun". The well-paid group does not.' },
      ],
      explain: `
        The **1-dollar** group, and that is what happened. Twenty dollars is reason enough for a small lie: "I said it for the money." One dollar is not, which leaves an uncomfortable clash between "it was dull" and "I told someone it was fun". The easiest thing to change is the opinion.

        The idea has held up broadly, though recent large repeats suggest the effect is fussier than textbooks imply.
      `,
    },
    {
      id: 'groups',
      type: 'match',
      title: 'Us and them',
      text: 'Three questions about groups, and three findings. **Match each question with the finding that answers it.**',
      pairs: [
        ['How little does it take to make an "us"?', `Tajfel, ${Y.tajfel}: boys sorted into groups on a trivial pretext gave more money to members of their own group`],
        ['What sets two groups against each other?', `Sherif, ${Y.sherif}: two groups of boys at a summer camp turned hostile when set to compete, and friendlier when they had to work together`],
        ['What tends to reduce prejudice?', `${Y.contactStudies} studies: getting to know members of another group, on equal terms`],
      ],
      explain: `
        A group needs almost nothing to form: a coin toss will do, and favouritism follows. The **contact** finding is the best supported of the three (an analysis in ${Y.contact}).

        Robbers Cave needs a caution. It involved ${Y.boys} boys, the staff steered events towards conflict, and an earlier camp, where the boys refused to turn on each other, was left out of the famous account.
      `,
    },
    {
      id: 'teach-solid',
      type: 'info',
      title: 'Solid, and less solid',
      text: `
        The famous findings of social psychology are not equally trustworthy.

        ${solidTable()}

        Two in the right-hand column are new. Scores on the "implicit association test" predict an individual's behaviour only weakly, and the same person's score shifts from day to day. And reminding people of a stereotype is said to lower their test scores: some studies find it, but large pre-registered repeats have often found little or nothing.
      `,
    },
    {
      id: 'how-solid',
      type: 'bucket',
      review: true,
      title: 'How solid is it?',
      gen: (rng) => ({
        items: rng.shuffle([0, 1].flatMap((b) => rng.sample(SOCIAL_SOLID.filter((x) => x.bucket === b), 3))).map((x) => ({ text: x.text, bucket: x.bucket, why: x.why })),
      }),
      text: 'Social psychology has some of the best-known findings in science, and they are not equally trustworthy. **Sort these claims.**',
      buckets: ['Well supported', 'Weaker than its fame'],
      explain: `
        Conformity, the bystander effect in the laboratory, favouring one's own group and the benefits of contact have each been found many times. The Stanford prison story, the 38 witnesses, quick tests of "implicit bias" as a guide to a person's behaviour, and "stereotype threat" are all shakier than their fame.

        :::tip Optional, this week
        The next time someone's behaviour annoys you, think of one explanation that lies in their situation. You need not believe it. Notice how seldom the first explanation was about the situation.
        :::
      `,
    },
  ],
  recap: [
    'Faced with a unanimous wrong majority, people in Asch\'s studies went along about a third of the time; one dissenter cut that sharply.',
    'In Milgram\'s best-known version 65% continued to the end, but the figure ranged from 10% to 65% with the set-up, and the "blind obedience" reading does not fit the evidence.',
    'In a crowd, responsibility spreads thin. Give one person one job.',
    'We explain other people by their character and overlook their situation; several famous stories (Stanford, the 38 witnesses) are weaker than their fame.',
  ],
  next: 'Next: can a test tell you who you are? Choose three shapes, and receive your personal profile.',
};
