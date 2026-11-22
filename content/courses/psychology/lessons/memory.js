// Psychology: How Minds Work · Lesson 4 · Memory Is Not a Recording
//
// Driving question: if memory is not a recording, what is it?
// Sources for the facts are noted in ../helpers.js.
import { SPAN, DRM, LOFTUS, MALL, FLASHBULB, EXONERATIONS, HM, BARTLETT, MEMORY_EFFECTS, MEMORY_CASES, ID_PAIRS, pct } from '../helpers.js';

const speed = (verb) => LOFTUS.speeds.find((row) => row[0] === verb)[1];
const YEARS = [1066, 1492, 1789, 1848, 1914, 1945, 1969, 1989, 2001];

// Three steps in a row: in, kept, out.
const stageBox = (x, cls, name, gloss) => `
  <rect class="${cls} stroke-ink" stroke-width="2.5" x="${x}" y="14" width="104" height="62" rx="10"/>
  <text class="fig-label" x="${x + 52}" y="40" text-anchor="middle">${name}</text>
  <text class="fig-label" x="${x + 52}" y="62" text-anchor="middle" style="font-weight:500">${gloss}</text>`;
const stageArrow = (x) => `<path class="fill-none stroke-ink" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M${x} 45H${x + 14}M${x + 8} 39L${x + 14} 45L${x + 8} 51"/>`;
const STAGES_FIG = {
  type: 'svg', viewBox: '0 0 360 90', maxWidth: 440,
  content: stageBox(4, 'fill-blue-soft', 'Encoding', 'getting it in') + stageArrow(110) + stageBox(128, 'fill-orange-soft', 'Storage', 'keeping it') + stageArrow(234) + stageBox(252, 'fill-green-soft', 'Retrieval', 'getting it out'),
  alt: 'Three boxes joined by arrows, from left to right: Encoding, getting it in; Storage, keeping it; Retrieval, getting it out.',
};

export default {
  id: 'memory',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      graded: false,
      title: 'A quick memory test',
      text: `
        Start with an experiment on yourself. You will see **${DRM.words.length} words**, one at a time. Read each one. Then you will be asked which words you saw.

        (If a timed list does not work for you, "Skip the list" takes you straight to the test.)
      `,
      widget: { type: 'lure-list', words: DRM.words, lure: DRM.lure, test: DRM.test },
      check: (s) => s.done || (s.phase === 'intro' ? 'Press "Show the list" to begin.' : s.phase === 'study' ? 'Read the words; the test follows.' : 'Tick the words you remember, then press "That is my answer".'),
      solution: { done: true, picks: ['bed', 'dream', 'sleep'] },
      explain: `
        This is a real experiment, and it depends on not telling you its purpose beforehand, so here is the full story now. Every word on the list is related to **${DRM.lure}**, and "${DRM.lure}" itself was **never shown**. The test was built to see whether you would remember it anyway.

        When Henry Roediger and Kathleen McDermott ran this in ${DRM.year}, students "recognised" the missing word about as often as words that really were on the list, and many said they could remember hearing it (their lists were read aloud). Some people do not tick it, especially in a short on-screen version like this one. Both results are normal.
      `,
    },
    {
      id: 'teach-gist',
      type: 'info',
      title: 'Memory keeps the meaning',
      text: `
        *Bed, rest, tired, dream…* Each word on the list woke the idea of ${DRM.lure}. What memory keeps best is the **gist**: the meaning. At the test the gist says "${DRM.lure} was there", and many careful readers agree with it.

        A memory of something that was only suggested by related things is called a **false memory by association**.

        :::key
        Memory does not store a copy of events. It stores meaning, and **rebuilds** the details when asked.
        :::
      `,
    },
    {
      id: 'debrief',
      type: 'choice',
      text: `
        The word "${DRM.lure}" was never on the list, yet a large share of people remember it being there.

        **What is the best explanation?**
      `,
      columns: 1,
      options: [
        { text: 'Every word pointed to the same idea, and memory stored the idea more firmly than the exact words', correct: true },
        { text: 'People who remember it were not paying attention', why: 'Careful, attentive readers do it too. Even people warned about the trick in advance still produce false memories of this kind, though fewer.' },
        { text: 'The word was shown too briefly to notice', why: 'It was not shown at all. That is the point: the memory is of something that never happened.' },
      ],
      explain: `
        The gist was stored, and the exact words were rebuilt from it. Attention is not the issue: even people warned about the trick in advance still produce false memories of this kind, though fewer.
      `,
    },
    {
      id: 'span',
      type: 'interact',
      graded: false,
      title: 'The small workspace',
      text: `
        Before anything can be stored it passes through **working memory**: what you are holding in mind right now. Find its size.

        You will see rows of digits for a few seconds each. **Type each row back from memory.**
      `,
      widget: { type: 'memory-span', lengths: [5, 7, 9, 11] },
      check: (s) => s.done || 'Work through all four rows.',
      solution: { done: true },
      explain: `
        Five is easy for most people, seven is a stretch, and eleven is too many for nearly everyone. In ${SPAN.millerYear} George Miller summed up such results as "the magical number seven, plus or minus two".

        Later work showed that seven flatters us, because people quietly group and rehearse. When that is prevented, working memory holds about **${SPAN.cowan} chunks** (Nelson Cowan, ${SPAN.cowanYear}). *How to Learn Anything* has a whole lesson on living with this limit.
      `,
    },
    {
      id: 'chunks',
      type: 'fill',
      title: 'Chunks',
      gen: (rng) => {
        const years = rng.sample(YEARS, rng.pick([3, 4]));
        const digits = years.join('').split('').join(' ');
        return {
          text: `
            The limit is counted in **chunks**: units that mean something to you. The letters C, A, T, D, O, G are six items, but read as CAT and DOG they are two chunks. Now some digits:

            **${digits}**
          `,
          template: `
            Read as single digits, that is [[${years.length * 4}]] separate items: more than working memory can hold.

            Read as the years ${years.join(', ')}, it is only [[${years.length}]] chunks.
          `,
          explain: `${years.length * 4} digits, but only ${years.length} meaningful units. Grouping does not enlarge working memory; it packs more into each slot, using what you already know. That is why an expert can take in at a glance what overwhelms a beginner.`,
        };
      },
    },
    {
      id: 'teach-stages',
      type: 'info',
      title: 'In, kept, out',
      text: `
        **Working memory** is the small workspace you have just measured: a few things held in mind for the task in hand. For you to remember something *later*, three more steps all have to work.

        - **Encoding**: getting it in, by turning an experience into a lasting trace.
        - **Storage**: keeping the trace over time.
        - **Retrieval**: getting it back out when it is needed.

        :::example
        A name you "forgot" a second after hearing it was never encoded. A word on the tip of your tongue is stored but will not come out: a retrieval failure.
        :::
      `,
      figure: STAGES_FIG,
    },
    {
      id: 'stages',
      type: 'match',
      title: 'Three things can go wrong',
      text: 'Someone learns the way to a friend\'s new flat. **Match each term with its part in the story.**',
      pairs: [
        ['Encoding', 'Studying the map before setting out, so that the route goes in'],
        ['Storage', 'Still having the route a month later, without having used it'],
        ['Retrieval', 'Bringing the route back to mind at the first crossroads'],
        ['Working memory', 'Holding "second left, then right" in mind while walking'],
      ],
      explain: `
        Getting it in, keeping it, getting it out, with working memory as the workspace for the moment.

        The surprising part is the third step. Retrieval is not playback. It is where memories get rebuilt, as the next experiments show.
      `,
    },
    {
      id: 'loftus',
      type: 'interact',
      mode: 'predict',
      title: 'One word in the question',
      text: `
        In ${LOFTUS.year} Elizabeth Loftus and John Palmer showed students films of car accidents, then asked how fast the cars were going. One group was asked about the cars when they **"contacted"** each other; their average answer was about ${Math.round(speed('contacted'))} miles per hour.

        Another group saw the same films and was asked about the cars when they **"smashed into"** each other. **Drag the second bar to your guess of their average answer.**
      `,
      widget: {
        type: 'bars', adjust: true, step: 1, yMax: 60, yStep: 10, yLabel: 'estimated speed (mph)',
        data: [
          { label: '"contacted"', value: Math.round(speed('contacted')), color: 'gray' },
          { label: '"smashed into"', value: Math.round(speed('contacted')), color: 'orange' },
        ],
        alt: 'Two adjustable bars showing estimated speed in miles per hour: the group asked about cars that contacted each other, at 32, and the group asked about cars that smashed into each other.',
      },
      check: (s) => s.values[0][1] > s.values[0][0],
      solution: { values: [[Math.round(speed('contacted')), Math.round(speed('smashed'))]] },
      explain: `
        About **${Math.round(speed('smashed'))} mph**: nine more, from one verb. The other verbs fell in between: collided ${speed('collided')}, bumped ${speed('bumped')}, hit ${speed('hit').toFixed(1)}.

        Was it only the estimate that changed, or the memory? In a second experiment, students answered the speed question and were asked a week later, "Did you see any broken glass?" There was none in the film. ${pct(LOFTUS.glass.smashed, LOFTUS.glass.group)}% of the "smashed" group said yes, against ${pct(LOFTUS.glass.hit, LOFTUS.glass.group)}% of those asked about cars that "hit". The word had been built into the memory.
      `,
    },
    {
      id: 'bartlett',
      type: 'fill',
      title: 'The War of the Ghosts',
      text: `
        Long before these studies, in ${BARTLETT.year}, Frederic Bartlett asked English students to read a Native American folk tale, "The War of the Ghosts", and to retell it from memory, again and again over weeks and months.

        With each retelling the story became shorter. Canoes became boats, and a puzzling ending became a tidy one. **Complete what that shows.**
      `,
      template: `
        What people kept of the story was its [[exact wording|*gist]].

        Details that were unfamiliar to them were [[kept exactly|*made familiar or dropped]].

        So remembering works less like playing a recording and more like [[copying a page|*rebuilding from an outline]].
      `,
      explain: `
        Bartlett concluded that remembering is **reconstruction**: we keep the outline and fill the gaps with what we know about how things usually go.

        His methods were loose by modern standards, but the main result has been repeated with stricter ones.
      `,
    },
    {
      id: 'mall',
      type: 'slider',
      mode: 'predict',
      title: 'A whole event that never happened',
      text: `
        Could an entire memory be planted? In ${MALL.year} researchers gave ${MALL.participants} adults four short stories about their own childhood, supplied by a relative. Three were true. The fourth, about getting lost in a shopping centre at about age five, was invented.

        After two interviews, **what share of the ${MALL.participants} said they remembered the invented event?**
      `,
      min: 0, max: 100, step: 1, answer: pct(MALL.remembered, MALL.participants), tolerance: 8, start: 0, unit: '%',
      explain: `
        **${pct(MALL.remembered, MALL.participants)}%**: ${MALL.remembered} of ${MALL.participants}. That is a very small study, and it was rightly criticised for it.

        So it was repeated. A pre-registered version in ${MALL.repeatYear} with ${MALL.repeatN} people found ${MALL.repeatPct}%, and eight such studies pooled give about ${MALL.pooledPct}% of ${MALL.pooledN} people. How "full" these memories are is still argued over, but the core finding stands: a sizeable minority of people can come to remember, in detail, something that was only suggested to them.
      `,
    },
    {
      id: 'teach-four-ways',
      type: 'info',
      title: 'Four ways a sincere memory goes wrong',
      text: `
        Rebuilding can go wrong in four ways. You have met three of them.

        ${Object.values(MEMORY_EFFECTS).map((e) => `- **${e.name}**: ${e.what}.`).join('\n        ')}

        The third is named after a camera flash. After the space shuttle *Challenger* exploded in 1986, ${FLASHBULB.first} students wrote down how they had heard. Two and a half years later ${FLASHBULB.retested} of them were asked again. Their new accounts scored about ${Math.round(FLASHBULB.accuracy)} out of ${FLASHBULB.outOf} for agreement with the first ones, and they were highly confident in them (Neisser and Harsch, ${FLASHBULB.year}).
      `,
    },
    {
      id: 'flashbulb',
      type: 'choice',
      review: true,
      title: 'Vivid is not the same as accurate',
      text: `
        Many people have a vivid, detailed memory of where they were when they heard some shocking news. Researchers have had students write down such a memory the day after the news, and again months or years later.

        **What do these studies find?**
      `,
      columns: 1,
      options: [
        { text: 'The later accounts had changed about as much as ordinary memories, but people stayed very confident in them', correct: true },
        { text: 'These memories stay accurate for life, as if photographed', why: 'They feel that way, which is where the name "flashbulb memory" comes from. Checked against what people wrote at the time, they are not.' },
        { text: 'People lose both the details and their confidence at the same rate', why: 'The details fade and change like those of any memory. The confidence and vividness are what stay.' },
      ],
      explain: `
        Checked against what people wrote at the time, such memories drift like any others: in one study, of the *Challenger* explosion in 1986, later accounts scored about ${Math.round(FLASHBULB.accuracy)} out of ${FLASHBULB.outOf} for agreement with the first ones, and their owners were highly confident in them (Neisser and Harsch, ${FLASHBULB.year}). A ${FLASHBULB.talaricoYear} study of memories of 11 September 2001 found the same pattern.

        Emotion makes a memory feel strong. It does not stop it being rebuilt.
      `,
    },
    {
      id: 'misinfo-kind',
      type: 'choice',
      review: true,
      columns: 1,
      gen: (rng) => {
        const c = rng.pick(MEMORY_CASES);
        return {
          text: `
            ${c.text}

            **What is this an example of?**
          `,
          options: Object.keys(MEMORY_EFFECTS).map((k) => ({
            text: MEMORY_EFFECTS[k].name, correct: k === c.effect,
            why: k === c.effect ? undefined : `${MEMORY_EFFECTS[k].name} means ${MEMORY_EFFECTS[k].what}.`,
          })),
          explain: `**${MEMORY_EFFECTS[c.effect].name}**: ${MEMORY_EFFECTS[c.effect].what}. In every case the person is sincere, and the memory feels like any other.`,
        };
      },
    },
    {
      id: 'teach-lineup',
      type: 'info',
      tone: 'sober',
      title: 'Memory as evidence',
      text: `
        In the ${EXONERATIONS.country}, ${EXONERATIONS.cleared} people convicted of serious crimes were later cleared by DNA evidence between ${EXONERATIONS.from} and ${EXONERATIONS.to}. A mistaken eyewitness played a part in about ${EXONERATIONS.eyewitnessPct}% of those cases (Innocence Project). Most of those witnesses were sincere.

        A memory is evidence that can be contaminated, like a fingerprint:

        - an officer who knows who the suspect is can leak it without meaning to (remember Clever Hans);
        - a witness who assumes the culprit must be present picks whoever looks most similar;
        - confidence grows afterwards, with every retelling, hint and word of praise.

        So the **first** identification, made soon after the event under fair conditions, is the one clean test of a witness's memory. Confidence stated at that moment is informative (Wixted and Wells, 2017). Confidence that arrives later is not.
      `,
    },
    {
      id: 'lineup',
      type: 'multi',
      tone: 'sober',
      title: 'When a witness is wrong',
      text: `
        A police line-up is a test of a witness's memory, and a sincere witness can still be mistaken.

        **Which practices keep that test clean?**
      `,
      columns: 1,
      options: [
        { text: 'The officer running it does not know which person is the suspect', correct: true },
        { text: 'The witness is told that the culprit may not be in the line-up', correct: true },
        { text: 'The witness\'s confidence is written down, in their own words, at the first identification', correct: true },
        { text: 'The suspect is the only person who matches the witness\'s description', why: 'Then the line-up tests nothing: anyone who had only read the description would pick the same person. The others should fit it too.' },
        { text: 'After choosing, the witness is told "good, you picked our suspect"', why: 'Feedback like this raises a witness\'s confidence without making the memory any more accurate.' },
      ],
      explain: `
        Each of the three closes one route of contamination: a leak from an officer who knows the answer, a witness who feels bound to pick somebody, and confidence that swells after the event.

        These procedures are about collecting the evidence of memory cleanly.
      `,
    },
    {
      id: 'which-id',
      type: 'choice',
      review: true,
      tone: 'sober',
      columns: 1,
      shuffle: false,
      gen: (rng) => {
        const p = rng.pick(ID_PAIRS);
        const strongFirst = rng.bool();
        const a = strongFirst ? p.strong : p.weak;
        const b = strongFirst ? p.weak : p.strong;
        return {
          text: `
            Two witnesses have identified the same suspect.

            - **Witness A** ${a}.
            - **Witness B** ${b}.

            **According to research on eyewitness memory, which identification deserves more weight?**
          `,
          options: [
            { text: 'Witness A', correct: strongFirst, why: strongFirst ? undefined : 'Confidence that appears or grows later, after hints, feedback or repeated viewings, says little about the original memory.' },
            { text: 'Witness B', correct: !strongFirst, why: strongFirst ? 'Confidence that appears or grows later, after hints, feedback or repeated viewings, says little about the original memory.' : undefined },
            { text: 'Neither: a witness\'s confidence never tells you anything', why: 'That goes too far. A fast, confident identification at a first, properly run line-up is right much more often than a hesitant one.' },
          ],
          explain: `
            Witness ${strongFirst ? 'A' : 'B'}. The **first** identification, made soon after the event under fair conditions, is the one uncontaminated test of a witness's memory, and high confidence at that moment is informative (Wixted and Wells, 2017). Confidence that arrives later is not.

            So the lesson of the wrongful convictions is not "never believe a witness". It is "test memory once, carefully, and record what was said".
          `,
        };
      },
    },
    {
      id: 'hm',
      type: 'choice',
      tone: 'sober',
      title: 'Knowing how without knowing that',
      text: `
        In ${HM.operation} an operation for severe epilepsy removed part of the brain of a young man, Henry Molaison, known for decades only as "H.M.". Afterwards he could not form new lasting memories of events or facts: he greeted his doctors as strangers every day.

        The psychologist Brenda Milner asked him to practise a tricky skill, tracing a star while seeing his hand only in a mirror, over several days. He got steadily better at it, while saying each day that he had never done it before.

        **What does that show about memory?**
      `,
      columns: 1,
      options: [
        { text: 'Memory is more than one system: a skill can be kept where events and facts are lost', correct: true },
        { text: 'His memory for events had quietly recovered', why: 'He said each day that he had never done the task before. The events were still lost; only the skill was kept.' },
        { text: 'Learning a skill needs no memory at all', why: 'Getting better from one day to the next means something was kept overnight. That is memory, though not memory of the practice sessions.' },
      ],
      explain: `
        H.M. could learn **how** without being able to remember **that**. So "memory" is more than one system: memory for events and facts depends on structures he had lost, and skills and habits (including the conditioning of the last lesson) are stored elsewhere.

        Henry Molaison took part in research for over fifty years, until his death in ${HM.died}. Much of what is known about memory began with him.
      `,
    },
    {
      id: 'myths',
      type: 'multi',
      tone: 'sober',
      title: 'What to believe about memory',
      text: '**Which of these statements are well supported?**',
      columns: 1,
      options: [
        { text: 'Recalling a memory rebuilds it, and the rebuilt version can differ from the original', correct: true },
        { text: 'A memory can be vivid, detailed and confidently held, and still be wrong', correct: true },
        { text: 'Memory works like a video camera: everything is recorded, and the right method can play it back', why: 'Nothing like a complete recording exists to be played back. What is not rebuilt from traces and gist is simply gone.' },
        { text: 'Some adults have a "photographic memory" that keeps whole pages like snapshots', why: 'No such case has stood up to testing in adults. People with astonishing memories turn out to use practised techniques, and are ordinary outside their speciality.' },
        { text: 'Hypnosis reliably brings back accurate lost memories', why: 'Hypnosis makes people produce more "memories" and feel surer of them, but not more accurate ones.' },
      ],
      explain: `
        Memory is a reconstruction: usually a good one, built from real traces, and open to error at every rebuilding. One related question is honestly **disputed among researchers**: whether memories of terrible events can vanish for years and then return accurately. This course takes no side on it, except to say that methods which press people to "recover" memories can also create them.

        :::tip Optional, this week
        Ask someone who shared an event with you, long ago, to describe it before you do. Notice where your versions differ, without trying to settle who is right. Usually neither of you can know.
        :::
      `,
    },
  ],
  recap: [
    'Working memory holds only about four chunks; grouping packs more into each one.',
    'Memory keeps the gist and rebuilds the details, so people can remember words, objects and even whole events that were never there.',
    'Questions and information met afterwards get built into the memory (the misinformation effect).',
    'Confidence long after the event says little; a fair first identification, with its confidence written down, says much more.',
  ],
  next: 'Next: quick answers. A wheel of fortune is about to give you a number that has nothing to do with anything.',
};
