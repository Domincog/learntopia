// Psychology: How Minds Work · Lesson 1 · How Do We Know?
//
// Driving question: if so much psychology sounds like common sense, why run experiments?
// Sources for the facts are noted in ../helpers.js.
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/psychology/index.js';
import { HINDSIGHT, FISCHHOFF, PROVERBS, MYTHS, MEASURES, HANS, OSC, FINDINGS, REFORMS, REFORM_CASES, CLAIMS, CLAIM_SIZES, THREE_QUESTIONS } from '../helpers.js';

// An experiment in one picture: chance makes two groups that are alike, only one gets the treatment.
const dots = (x0, y0, keen) => [0, 1, 2, 3, 4, 5].map((i) => `<circle class="${keen.includes(i) ? 'fill-orange' : 'fill-gray-soft'} stroke-ink" stroke-width="1.5" cx="${x0 + (i % 3) * 22}" cy="${y0 + Math.floor(i / 3) * 22}" r="8"/>`).join('');
const EXPERIMENT = {
  type: 'svg', viewBox: '0 0 360 190', maxWidth: 420,
  content: `
    <text class="fig-label" x="180" y="18" text-anchor="middle">a coin decides for each person</text>
    <path class="fill-none stroke-ink" stroke-width="2.5" stroke-linecap="round" d="M180 26V44M180 44L96 62M180 44L264 62"/>
    <rect class="fill-blue-soft stroke-ink" stroke-width="2.5" x="30" y="66" width="132" height="84" rx="10"/>
    <rect class="fill-surface stroke-ink" stroke-width="2.5" x="198" y="66" width="132" height="84" rx="10"/>
    <text class="fig-label" x="96" y="86" text-anchor="middle">gets the app</text>
    <text class="fig-label" x="264" y="86" text-anchor="middle">control group</text>
    ${dots(74, 104, [0, 2, 4])}${dots(242, 104, [1, 3, 5])}
    <circle class="fill-orange stroke-ink" stroke-width="1.5" cx="124" cy="172" r="8"/>
    <text class="fig-label" x="140" y="177">keen: half of each group</text>`,
  alt: 'A diagram of an experiment. A coin toss sends each person either to a box labelled "gets the app" or to a box labelled "control group". Each box holds six people, and three of the six in each box are marked as keen.',
};
const classicsTable = () => {
  const held = FINDINGS.filter((f) => f.status === 'held');
  const failed = FINDINGS.filter((f) => f.status === 'failed');
  return ['| Held up when repeated | Failed, or shrank to almost nothing |', '|---|---|', ...held.map((f, i) => `| ${f.short} | ${failed[i].short} |`)].join('\n        ');
};

const NOTE = '> **A note before we start.** This course is about how minds work in general. It is not a tool for diagnosing yourself or anyone else. If you are worried about your own mental health, talk to a doctor or another professional you trust.';

// Forty small studies of an effect that does not exist: three cross the line by luck.
const DRAWER = [
  0.62, 0.31, 0.88, 0.47, 0.19, 0.74, 0.03, 0.55, 0.93, 0.26,
  0.41, 0.67, 0.12, 0.81, 0.36, 0.58, 0.97, 0.22, 0.49, 0.71,
  0.84, 0.04, 0.33, 0.6, 0.15, 0.9, 0.44, 0.28, 0.77, 0.52,
  0.09, 0.69, 0.38, 0.95, 0.02, 0.57, 0.24, 0.83, 0.46, 0.65,
];
// One data set about a "focus drink", twenty ways to slice it. Pure noise.
const PATHS = {
  rows: ['Everyone', 'Women', 'Men', 'Under 30'],
  cols: ['Memory', 'Mood', 'Reaction', 'Sleep', 'Focus'],
  p: [
    [0.48, 0.71, 0.33, 0.86, 0.22],
    [0.64, 0.19, 0.57, 0.41, 0.92],
    [0.37, 0.83, 0.031, 0.68, 0.51],
    [0.76, 0.044, 0.29, 0.59, 0.14],
  ],
};

export default {
  id: 'science-of-mind',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Obvious, is it not?',
      gen: (rng) => {
        const f = rng.pick(HINDSIGHT);
        return {
          text: `
            ${NOTE}

            During the Second World War, researchers questioned huge numbers of American soldiers. One of their findings:

            **${f.stated}** (${f.reason})

            How surprising do you find that?
          `,
          explain: `
            Here is the catch. The survey found the **opposite**: ${f.real} (${f.realReason})

            Both versions sound obvious once you are told they are true. The sociologist Paul Lazarsfeld played this trick on his readers in 1949 to make a point: if every result and its opposite can feel like common sense, then common sense is not telling us which one is right.
          `,
        };
      },
      shuffle: false,
      options: [
        { text: 'Not at all. I could have guessed it', why: 'Hold on to that feeling of "of course".' },
        { text: 'A little surprising', why: 'Fair enough. Now read what the survey really found.' },
        { text: 'Very surprising', why: 'Your doubt was well placed.' },
      ],
    },
    {
      id: 'teach-hindsight',
      type: 'info',
      title: 'It only feels obvious afterwards',
      text: `
        That feeling of "of course" has a name: **hindsight bias**. Once we know how something turned out, it seems to have been obvious all along.

        Baruch Fischhoff measured it in ${FISCHHOFF.year}. People who were told how an event had turned out rated that outcome as more predictable than people who had not been told.

        Folk wisdom is slippery in the same way.

        :::example
        *Better safe than sorry.* And yet: *Nothing ventured, nothing gained.*

        Be careful and it goes well: the first saying was right. Take a risk and it goes well: the second was. Together they can never be caught out, so they tell you nothing in advance.
        :::
      `,
    },
    {
      id: 'proverbs',
      type: 'match',
      title: 'Wisdom for every occasion',
      text: `
        Here are four more sayings, each with a partner that says the opposite. **Match each saying with the saying that contradicts it.**
      `,
      pairs: PROVERBS,
      explain: `
        Whatever happens, one of the pair "predicted" it. An idea that can explain any result has told you nothing in advance, and hindsight makes it feel wise all the same.
      `,
    },
    {
      id: 'myths',
      type: 'multi',
      mode: 'predict',
      title: 'What everyone knows',
      text: 'Five things many people believe about the mind. **Which do you think are well supported by evidence?** Tick any you would bet on.',
      columns: 1,
      options: MYTHS.map((m) => ({ text: m.claim, correct: m.verdict, why: m.verdict ? undefined : m.why })),
      explain: `
        Only the last one. Brain scans and the brain's huge energy bill rule out the 10% story; matching lessons to "learning styles" does not improve learning; the "Mozart effect" was a small, brief result in 36 students that later studies mostly failed to find; and no brain is "left" or "right".

        Each of these was believable, widely repeated and wrong. Finding that out took experiments.
      `,
    },
    {
      id: 'teach-measure',
      type: 'info',
      title: 'From a loose idea to a test',
      text: `
        An experiment starts by turning a loose idea into something you can **count or time**. Saying exactly what will be measured, in whom and under which conditions is called an **operational definition**.

        :::example
        The idea: *"Coffee makes people more alert."*

        - *Ask coffee drinkers whether it wakes them up.* Opinions about an effect do not measure it.
        - *Notice that alert people often drink coffee.* That looks only at cases that fit.
        - *Time how fast people press a key when a light comes on, after coffee and after a drink without caffeine.* **This is a test**: two conditions are compared, and the result can go against the idea.
        :::
      `,
    },
    {
      id: 'measure',
      type: 'choice',
      title: 'Make it measurable',
      columns: 1,
      gen: (rng) => {
        const m = rng.pick(MEASURES);
        return {
          text: `
            The idea: **"${m.idea}."** Which plan would actually test it?
          `,
          options: [
            { text: m.good, correct: true },
            { text: m.vague, why: 'Opinions about an effect are not a measurement of it. People are often wrong about what affects them.' },
            { text: m.circular, why: 'That only looks at cases that fit the idea. A test must be able to come out against it.' },
            { text: m.off, why: 'That can be counted, but it is not a measure of the thing the idea is about.' },
          ],
          explain: `
            A good test says in advance **what will be measured, and in whom, under which conditions**: here, "${m.good.charAt(0).toLowerCase()}${m.good.slice(1)}". Then the result can come out either way, and the idea can lose.
          `,
        };
      },
    },
    {
      id: 'assign',
      type: 'interact',
      graded: false,
      title: 'Who gets the app?',
      text: `
        A company says its brain-training app raises memory scores. Here are 40 students. In truth **the app does nothing**. Half the students are [keen]{.orange}: they study more and score higher anyway.

        Split them into app users and non-users **three times by letting them choose**, then **three times by coin toss**. Watch the gap between the groups.
      `,
      widget: {
        type: 'assign-lab', count: 40, effect: 0, methods: ['choice', 'coin'], repeat: 0, reveal: 'shown',
        labels: { treat: 'app', control: 'no app', trait: 'keen', outcome: 'memory score', unit: 'points', people: 'students' },
        alt: 'Forty students as dots on a memory-score axis; half are marked as keen. Buttons split them into app users and non-users, by their own choice or by coin toss, and show the two group averages.',
      },
      check: (s) => {
        if (s.runs.choice >= 3 && s.runs.coin >= 3) return true;
        if (s.runs.choice < 3) return `Let them choose at least 3 times (${s.runs.choice} so far).`;
        return `Now toss a coin for each student at least 3 times (${s.runs.coin} so far).`;
      },
      solution: { runs: { choice: 3, coin: 3 } },
      explain: `
        When students choose, the app users come out well ahead, although the app does nothing. With the coin, the false gap disappears. The next screen says why.
      `,
    },
    {
      id: 'teach-experiment',
      type: 'info',
      title: 'Why the coin works',
      text: `
        Keen students are the ones who download the app. So a survey would report "app users have better memories" and be right, and still be wrong about why. Two things that go together are a **correlation**, and a correlation is not a cause.

        An **experiment** closes that gap:

        - the researcher decides who gets the treatment, by chance: **random assignment**;
        - the others form a **control group**, measured in the same way but without the treatment.

        A coin cannot tell who is keen, so keen students land on both sides.
      `,
      figure: EXPERIMENT,
    },
    {
      id: 'why-random',
      type: 'choice',
      review: true,
      text: `
        In an **experiment**, the researcher decides who gets the treatment, usually by chance (**random assignment**), and compares them with a **control group** that does not get it.

        What does assigning people by chance achieve?
      `,
      columns: 1,
      options: [
        { text: 'It makes the two groups alike, on average, in everything except the treatment', correct: true },
        { text: 'It makes sure the sample represents the whole population', why: 'That is random *sampling*: who gets into the study at all. Random *assignment* is about who gets which treatment once they are in.' },
        { text: 'It guarantees that the treatment will show an effect', why: 'It does the opposite of guaranteeing anything: it lets a useless treatment show up as useless.' },
        { text: 'It lets people have the treatment they prefer', why: 'Letting people choose is exactly what brings hidden differences between the groups.' },
      ],
      explain: 'Chance does not know who is keen, healthy, rich or hopeful, so those people land in both groups in roughly equal numbers. Any difference that then appears between the groups can be put down to the treatment.',
    },
    {
      id: 'hans',
      type: 'choice',
      title: 'The horse that could count',
      text: `
        Berlin, 1904. A horse called Hans taps out the answers to sums with his hoof. His owner is no cheat: Hans gets it right even when strangers ask.

        The psychologist ${HANS.tester} tried one more test: questions from people who **did not know the answer themselves**. Now Hans went on tapping and hardly ever stopped at the right number.

        **What does that result show?**
      `,
      figure: photo(MEDIA['clever-hans'], {
        alt: 'An old photograph of a horse in a brick courtyard, with an elderly bearded man in a long coat standing beside it and a younger man in a cap holding its bridle. In front of them are a blackboard covered in numbers and a row of wooden skittles.',
        caption: 'Hans with his owner, Wilhelm von Osten, and the boards used to question him',
      }),
      columns: 1,
      options: [
        { text: 'Hans was reading the people who asked, not doing sums', correct: true },
        { text: 'Hans could do sums, but only easy ones', why: 'The sums were no harder than before. The only thing that changed was what the person asking knew.' },
        { text: 'His owner had been signalling the answers on purpose', why: 'Hans was right for strangers too, and nobody was cheating. Look at what changed in the new test: the person asking no longer knew the answer.' },
        { text: 'Hans had learned the answers by heart', why: 'Then it would not matter who asked. It mattered a great deal.' },
      ],
      explain: `
        Hans was reading people, not numbers. As the taps neared the right answer, questioners tensed and then relaxed a little, without knowing they did it, and Hans stopped. No signal, no answer (Pfungst, ${HANS.year}).

        Experimenters leak their hopes too. So good studies are run **blind**: the person who deals with the participants does not know who is in which group.
      `,
    },
    {
      id: 'osc',
      type: 'slider',
      mode: 'predict',
      title: 'Run it again',
      text: `
        A finding should turn up again when someone repeats the study: it should **replicate**.

        In ${OSC.year}, ${OSC.authors} researchers repeated ${OSC.studies} studies from leading psychology journals, as exactly as they could. ${OSC.originalSig} of the 100 originals had reported a clear ("statistically significant") effect.

        **How many of the 100 repeats found one?**
      `,
      min: 0, max: 100, step: 1, answer: OSC.replicationSig, tolerance: 8, start: 50,
      explain: `
        **${OSC.replicationSig}.** And across all the repeats, the effects were on average half the size of the originals.

        This was the centre of what is called the **replication crisis**. It does not mean two thirds of psychology is false: some repeats were imperfect, and some effects are real but smaller than first claimed. It does mean that one published study is weak evidence.
      `,
    },
    {
      id: 'drawer',
      type: 'interact',
      graded: false,
      title: 'The file drawer',
      text: `
        How can so many results fail to come back? Here are 40 small studies of an effect that **does not exist**. By luck alone, a few cross the line that counts as "significant".

        Journals have mostly printed the exciting ones. **Switch the view to "published only".**
      `,
      widget: {
        type: 'many-tests', p: DRAWER, columns: 8, drawer: true, noun: 'studies',
        alt: 'A wall of forty tiles, one per study, each with its p-value. Three are highlighted as significant. A switch hides the other thirty-seven, leaving only the published results.',
      },
      check: (s) => s.view === 'published' || 'Use the switch above the tiles to show the published studies only.',
      solution: { view: 'published' },
      explain: `
        Three studies, all "showing" the effect, and 37 in a drawer. A reader of the journals sees unanimous support for something that is not there. This is **publication bias**.

        Small samples make it worse: with few people, luck swings results widely, so the lucky hits look large.
      `,
    },
    {
      id: 'paths',
      type: 'interact',
      graded: false,
      title: 'Twenty ways to look',
      text: `
        A second leak. One team tests a "focus drink" that does nothing. They measured five things and can split the people four ways. **Tap tiles to run analyses until one comes out below 0.05.**
      `,
      widget: {
        type: 'many-tests', mode: 'paths', rows: PATHS.rows, cols: PATHS.cols, p: PATHS.p, open: [[0, 0]],
        alt: 'A grid of twenty possible analyses: four groups of people by five outcomes. Tapping a tile runs that analysis and shows its p-value.',
      },
      check: (s) => {
        if (s.found) return true;
        return s.tried < 20 ? `Nothing below 0.05 yet: the smallest so far is ${s.bestText}. Try other tiles (${s.tried} of 20 run).` : false;
      },
      solution: { opened: [[0, 0], [2, 2]] },
      hints: ['Keep tapping. With twenty looks at pure noise, one or two will cross the line.', 'Try reaction time in men, or mood in the under-30s.'],
      explain: `
        "Focus drink speeds men's reactions (p = 0.03)" would make a fine headline. It was found by trying analysis after analysis on noise.

        Nobody needs to cheat for this to happen. A researcher who honestly tries several reasonable analyses and reports the one that "worked" produces the same result.
      `,
    },
    {
      id: 'teach-reforms',
      type: 'info',
      title: 'Two leaks, four repairs',
      text: `
        The file drawer and the twenty ways to look are two leaks that let luck into the journals. Psychology set about closing them faster than most sciences.

        ${REFORMS.map(([name, what]) => `- **${name}.** ${what}.`).join('\n        ')}

        Pre-registration closes the "twenty ways to look" leak. Registered reports empty the file drawer.
      `,
    },
    {
      id: 'reforms',
      type: 'match',
      title: 'What changed',
      text: 'Four things that used to go wrong. **Match each problem with the reform that answers it.**',
      pairs: REFORM_CASES,
      explain: `
        Pre-registration fixes the plan before the data can tempt anyone. A registered report is accepted before the result is known, so "nothing found" gets printed too. Multi-lab studies replace 30 participants with thousands. Open data lets others check.

        These habits are now spreading through medicine, economics and other fields with the same problems.
      `,
    },
    {
      id: 'teach-classics',
      type: 'info',
      title: 'The classics, run again',
      text: `
        Since 2011, large teams have re-run many famous findings, often with thousands of people.

        ${classicsTable()}

        The survivors had been found many times, by different teams. The casualties mostly rested on a few small, surprising studies.

        :::key
        Three questions for any claim: **How many people? Compared with what? Has anyone repeated it?**
        :::
      `,
    },
    {
      id: 'sort-status',
      type: 'bucket',
      review: true,
      title: 'Which classics survived?',
      gen: (rng) => {
        const held = rng.sample(FINDINGS.filter((f) => f.status === 'held'), 3);
        const failed = rng.sample(FINDINGS.filter((f) => f.status === 'failed'), 3);
        return {
          items: rng.shuffle([...held, ...failed]).map((f) => ({ text: f.name, bucket: f.status === 'held' ? 0 : 1, why: f.note })),
        };
      },
      text: 'Large teams have re-run many famous psychology findings since 2011. **Sort these by how they fared.**',
      buckets: ['Held up when repeated', 'Failed, or shrank to almost nothing'],
      explain: `
        The survivors (the Stroop effect, anchoring, the testing effect, conformity, misleading questions changing memory) had been found many times by different teams. The casualties (power-pose hormones, willpower as a fuel, "old age" words slowing walking, the pen-in-the-teeth smile, the Mozart effect) mostly rested on a few small, surprising studies.

        You will meet the survivors, and take part in several, in the lessons that follow.
      `,
    },
    {
      id: 'three-questions',
      type: 'choice',
      review: true,
      title: 'Three questions for any claim',
      columns: 1,
      gen: (rng) => {
        const c = rng.pick(CLAIMS);
        const n = rng.pick(c.flaw === 'size' ? CLAIM_SIZES.small : CLAIM_SIZES.large);
        const why = {
          size: `With only a handful of people this would be a fair worry, but ${n} is a decent number here.`,
          compare: 'There was a comparison group here, formed by chance.',
          repeat: 'This one has been repeated, by a different team.',
        };
        const tell = {
          size: `Groups of ${n} are far too small: luck alone can produce a gap that size. The comparison and the repeats were there.`,
          compare: 'Scores also change with time, practice and hope. Without a group that did not get the treatment, nobody can say what caused the change.',
          repeat: 'The study itself looks sound, but it stands alone. One result, however neat, is where the checking starts.',
        };
        return {
          text: `
            A headline: **"Psychologists find that ${c.headline}."**

            Behind it: ${c.detail(n)}

            Which question finds the weak spot?
          `,
          hints: ['Check three things in the story: how big the groups were, whether anyone went without the treatment, and whether another team found the same.'],
          options: ['size', 'compare', 'repeat'].map((k) => ({ text: THREE_QUESTIONS[k], correct: k === c.flaw, why: k === c.flaw ? undefined : why[k] })),
          explain: `**${THREE_QUESTIONS[c.flaw]}** ${tell[c.flaw]}`,
        };
      },
      shuffle: false,
    },
    {
      id: 'try',
      type: 'info',
      title: 'Something to try',
      text: `
        This course takes you through psychology's best experiments, and wherever it can, it runs them on you. Each time it will say how well the finding has held up.

        :::tip Optional, this week
        The next time you meet a headline that begins "psychologists say" or "a study shows", ask its three questions: **How many people? Compared with what? Has anyone repeated it?** Often the article does not say, and that is an answer in itself.
        :::
      `,
    },
  ],
  recap: [
    'After the fact almost any result feels obvious. That feeling is hindsight, not evidence.',
    'An experiment assigns people to groups by chance and compares them, so that only the treatment differs.',
    'When 100 studies were repeated in 2015, about a third gave a clear result again: small samples, flexible analysis and unpublished failures were to blame.',
    'Ask of any claim: how many people, compared with what, and has anyone repeated it?',
  ],
  next: 'Next: your own eyes. You will measure how far they can be fooled, and miss something in plain sight.',
};
