// Psychology: How Minds Work · Lesson 3 · Bells, Levers and Slot Machines
//
// Driving question: why does a habit you no longer enjoy keep its grip?
// Sources for the facts are noted in ../helpers.js.
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/psychology/index.js';
import { PAVLOV, ALBERT, LEARNING_YEARS as Y, LEPPER, CLASSICAL_TERMS, CLASSICAL_CASES, CONSEQUENCES, SCHEDULES } from '../helpers.js';

const SIX_PAIRS = ['pair', 'pair', 'pair', 'pair', 'pair', 'pair'];
const FADE = ['alone', 'alone', 'alone', 'alone', 'alone', 'alone', 'alone'];

export default {
  id: 'conditioning',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The most famous dogs in science',
      text: `
        Ivan Pavlov won a Nobel Prize in ${PAVLOV.nobel}, and nearly everyone has heard of his dogs.

        **What was the prize for?**
      `,
      figure: photo(MEDIA['pavlov-demo'], {
        alt: 'An old photograph of a lecture theatre. A bearded man in uniform sits at a table of laboratory apparatus, with rows of students in uniform standing and sitting around him.',
        caption: 'Ivan Pavlov (seated, left) demonstrating an experiment to students in St Petersburg, about 1904',
      }),
      columns: 1,
      options: [
        { text: 'His studies of how digestion works', correct: true },
        { text: 'Discovering that dogs can learn to drool at a bell', why: 'That is what he is remembered for, but the prize was for the work it grew out of, and it began as a nuisance.' },
        { text: 'Showing that animals have emotions', why: 'Pavlov was a physiologist measuring digestive juices. Emotions were not his subject.' },
      ],
      explain: `
        **Digestion.** Pavlov measured the saliva and stomach juices of dogs as they ate. Then something spoiled his measurements: the dogs began to drool *before* the food arrived, at the sight of the bowl or the footsteps of the assistant who fed them.

        He spent the next thirty years on that nuisance. You are about to repeat his experiment, with the bell of the popular story (in his laboratory the signal was more often a metronome, a buzzer or a touch on the skin).
      `,
    },
    {
      id: 'pair',
      type: 'interact',
      graded: false,
      title: 'Teach the dog',
      text: `
        The chart counts the drops of saliva the dog produces **when the bell rings**.

        First press **Bell alone** once: a bell means nothing to a dog. Then press **Bell + food** several times, and test with **Bell alone** again. **Carry on until the bell by itself produces at least 8 drops.** Then try **A higher bell**.
      `,
      widget: { type: 'pavlov-lab', actions: ['pair', 'alone', 'near'], alt: 'A dog, a bell, a food bowl and a tube collecting saliva, beside a chart of the drops produced on each trial.' },
      check: (s) => {
        if (s.acquired) return true;
        if (s.pairs === 0) return 'Ring the bell together with food a few times, then test the bell alone.';
        return s.alones === 0 || s.trials[s.trials.length - 1].kind !== 'alone'
          ? 'Now test it: press "Bell alone" and see how many drops the bell produces without food.'
          : `The bell alone gave ${s.trials[s.trials.length - 1].drops} drops. Pair bell and food a few more times, then test again.`;
      },
      solution: { trials: ['alone', ...SIX_PAIRS, 'alone'] },
      explain: `
        The bell alone now makes the dog drool. Notice the shape of the curve: big gains at first, smaller ones later. And a bell with a slightly higher note also makes the dog drool, a little less.
      `,
    },
    {
      id: 'teach-classical',
      type: 'info',
      title: 'What the dog learned',
      text: `
        The dog has learned that **the bell predicts food**, and its body now gets ready at the bell. This is **classical conditioning**: a signal that meant nothing comes to trigger a response, because it has reliably come just before something that matters.

        Pavlov's names for the parts are still used. *Unconditioned* means needing no learning. *Conditioned* means learned.

        | | Stimulus | Response |
        |---|---|---|
        | **Unconditioned** | the food | drooling at food |
        | **Conditioned** | the bell, after training | drooling at the bell |
      `,
    },
    {
      id: 'terms',
      type: 'match',
      title: 'Four names',
      text: `
        The same four names fit any case. Each time the oven timer rings, warm cake comes out and a child's mouth waters. After some weeks the ring of the timer does it alone.

        **Match each term with its part in this story.**
      `,
      pairs: [
        ['Unconditioned stimulus', 'The cake'],
        ['Unconditioned response', 'Mouth watering at the cake'],
        ['Conditioned stimulus', 'The ring of the timer, after those weeks'],
        ['Conditioned response', 'Mouth watering at the ring'],
      ],
      explain: `
        Cake makes a mouth water with no training at all: stimulus and response are both **unconditioned**. The ring, and the watering it comes to produce, are **conditioned**: they depend on what the child has been through.

        The same learning ties a dentist's waiting room to a tight stomach, and the smell of a kitchen to hunger.
      `,
    },
    {
      id: 'extinguish',
      type: 'interact',
      title: 'Now break the link',
      text: `
        This dog has already been trained. Find out what it takes to undo that.

        1. Press **Bell alone** again and again until the bell produces **1 drop or none**.
        2. Then press **Wait a night**, and ring the **bell alone** once more.
      `,
      widget: { type: 'pavlov-lab', actions: ['alone', 'rest'], trials: SIX_PAIRS, alt: 'A trained dog, a bell and a tube collecting saliva, beside a chart of the drops produced on each trial.' },
      check: (s) => {
        if (s.recovered) return true;
        if (!s.acquired) return 'Start by ringing the bell alone.';
        if (!s.extinguished) return `The bell still produces ${s.drops} drops. Keep ringing it without food.`;
        return s.rests === 0 ? 'The response has faded. Now let a night pass, and ring the bell once more.' : 'After the night, ring the bell alone to see what it does now.';
      },
      solution: { trials: [...SIX_PAIRS, ...FADE, 'rest', 'alone'] },
      hints: ['Each ring without food weakens the response a little. It takes about seven.', 'When the bars are down to 1 or 0, press "Wait a night", then "Bell alone".'],
      explain: `
        Ringing the bell without food makes the response fade. But after a night's rest, about half of it is back, with no new training.
      `,
    },
    {
      id: 'teach-extinction',
      type: 'info',
      title: 'Fading is not forgetting',
      text: `
        You have now watched the dog do four things. Each has a name.

        ${Object.values(CLASSICAL_TERMS).map((c) => `- **${c.name}**: ${c.what}.`).join('\n        ')}

        Extinction does not rub the old learning out. The dog learns something new on top ("the bell no longer means food"), and that newer learning is the more fragile of the two. That is one reason an old habit or an old fear can return after a break.
      `,
      figure: { type: 'pavlov-lab', actions: [], trials: [...SIX_PAIRS, ...FADE, 'rest', 'alone'], alt: 'The chart of drops for a trained dog. The bars rise over six pairings of bell and food, fall to almost nothing over seven rings of the bell alone, and after a night without the bell one ring gives about half the earlier response.' },
    },
    {
      id: 'classical-name',
      type: 'choice',
      review: true,
      columns: 1,
      gen: (rng) => {
        const c = rng.pick(CLASSICAL_CASES);
        return {
          text: `
            ${c.text}

            **Which part of classical conditioning is this?**
          `,
          options: Object.keys(CLASSICAL_TERMS).map((k) => ({
            text: CLASSICAL_TERMS[k].name, correct: k === c.term,
            why: k === c.term ? undefined : `${CLASSICAL_TERMS[k].name} is when ${CLASSICAL_TERMS[k].what}.`,
          })),
          explain: `**${CLASSICAL_TERMS[c.term].name}**: ${CLASSICAL_TERMS[c.term].what}.`,
        };
      },
    },
    {
      id: 'garcia',
      type: 'choice',
      title: 'Not every link is equal',
      text: `
        Pavlov thought any signal could be tied to any response. In ${Y.garcia} John Garcia tested that. He gave rats sweet-tasting water while lights flashed and a clicker sounded. Some rats were then made to feel sick. Others got a mild electric shock to the feet as they drank.

        Afterwards the **sick** rats avoided the sweet taste, but not the lights and clicks. The **shocked** rats avoided the lights and clicks, but not the taste.

        **What does that result show?**
      `,
      columns: 1,
      options: [
        { text: 'Animals learn some links far more readily than others', correct: true },
        { text: 'Any signal can be tied to any response equally well', why: 'Then both groups would have avoided everything that had been present. Each group avoided only one kind of signal.' },
        { text: 'Rats cannot learn anything from lights and sounds', why: 'The shocked rats did exactly that: they avoided the lights and clicks.' },
      ],
      explain: `
        Animals are **prepared** to learn some links more easily than others. Sickness gets blamed on a taste, even hours later and after a single meal, because that is how poisoning works in nature. You may know this yourself: one bad experience can put you off a food for years.

        Pavlov's "any signal will do" was too simple. Evolution has opinions.
      `,
    },
    {
      id: 'albert',
      type: 'choice',
      tone: 'sober',
      title: '"Little Albert"',
      text: `
        In ${ALBERT.year} John Watson and Rosalie Rayner reported an experiment on a baby they called Albert. He was shown a white rat, which did not frighten him. Then, ${ALBERT.pairings} times, a steel bar was struck behind his head as the rat appeared. He came to cry at the rat, and seemed wary of other furry things.

        It is among the most retold studies in psychology. Put the questions from lesson 1 to it: how many people, and compared with what? **How much does it show?**
      `,
      columns: 1,
      options: [
        { text: 'Little: one child, no comparison, vague measures, and it would not be allowed today', correct: true },
        { text: 'It proved that all human fears are learned by conditioning', why: 'One infant cannot prove a claim about all human fears, and later attempts to repeat the study gave mixed results.' },
        { text: 'It proved that fears learned in infancy last for life', why: 'Albert left the hospital soon afterwards and was never followed up. Nobody removed his fear, and nobody knows how long it lasted.' },
      ],
      explain: `
        The study had **${ALBERT.infants} participant**, no control child, and "fear" was judged by eye. Albert's reactions were weaker and less consistent than textbooks later claimed. It is unclear what his mother was told, his fear was never undone, and historians still disagree about who he was.

        Fear conditioning in people is real, and it has since been shown by careful and harmless methods. This famous demonstration is remembered mostly as a lesson in how not to do research.
      `,
    },
    {
      id: 'law-of-effect',
      type: 'info',
      title: 'A second kind of learning',
      text: `
        Pavlov's dogs learned what **predicts** what. Animals also learn from what their own actions **bring about**.

        In ${Y.thorndike} Edward Thorndike shut hungry cats in boxes with a latch. They escaped by accident at first, then faster and faster: actions followed by something good get repeated (the **law of effect**). B. F. Skinner built on this from the 1930s with a box like the one in the picture, in which pressing a lever or pecking a key delivers food automatically. He called it **operant conditioning**.

        - A consequence that makes a behaviour **more** likely is a **reinforcer**.
        - One that makes it **less** likely is a **punisher**.

        Complicated behaviour is built up by **shaping**: rewarding each small step in the right direction.
      `,
      figure: photo(MEDIA['skinner-box'], {
        alt: 'A laboratory chamber with clear walls and a floor of metal bars, inside a white cabinet, with a small box of electronics above it.',
        caption: 'A modern operant chamber ("Skinner box")', maxWidth: 330,
      }),
    },
    {
      id: 'teach-quadrants',
      type: 'info',
      title: 'Positive, negative: added, taken away',
      text: `
        Two pairs of words name every consequence. **Reinforcement** makes a behaviour more likely; **punishment** makes it less likely. **Positive** means something is added; **negative** means something is taken away. Neither word means good or bad.

        - **Positive reinforcement**: something pleasant is added, and the behaviour increases. *A rat presses a lever and food arrives. It presses more.*
        - **Negative reinforcement**: something unpleasant is taken away, and the behaviour increases. *Putting up an umbrella stops the rain hitting you. You put it up sooner next time.*
        - **Punishment**: the consequence, whether something unpleasant added or something pleasant taken away, makes the behaviour decrease. *A nettle stings the hand that grabs it. You grab nettles less.*
      `,
    },
    {
      id: 'quadrants',
      type: 'bucket',
      review: true,
      title: 'The word that trips everyone',
      gen: (rng) => ({
        items: rng.shuffle([0, 1, 2].flatMap((b) => rng.sample(CONSEQUENCES.filter((c) => c.bucket === b), 2))).map((c) => ({ text: c.text, bucket: c.bucket, why: c.why })),
      }),
      text: `
        In this vocabulary "positive" means something is **added** and "negative" means something is **taken away**. Neither word means good or bad. Reinforcement always makes a behaviour **more** likely; punishment makes it **less** likely.

        **Sort these.**
      `,
      buckets: ['Positive reinforcement', 'Negative reinforcement', 'Punishment'],
      explain: `
        **Negative reinforcement is not punishment.** It strengthens a behaviour by removing something unpleasant: the beeping stops, the headache lifts. Punishment weakens a behaviour.

        Punishment also has a built-in limit: it tells the learner what *not* to do, and nothing about what to do instead. That is why rewarding the wanted behaviour usually teaches more.
      `,
    },
    {
      id: 'schedules',
      type: 'interact',
      graded: false,
      title: 'When the rewards stop',
      text: `
        A pigeon pecks a key for grain. You decide the rule for when a peck pays off.

        **Train the bird on "Every peck", then stop the rewards.** Do the same for **"VR: About every 10th, unpredictably"**. Compare how long each bird keeps pecking for nothing. (Try the other rules if you like.)
      `,
      widget: { type: 'schedule-lab', alt: 'A chart of total pecks against time for a pigeon trained on different reward rules, with buttons to train the bird and to stop the rewards.' },
      check: (s) => {
        const need = ['crf', 'vr'].filter((id) => !s.stopped.includes(id));
        if (!need.length) return true;
        const name = { crf: '"Every peck"', vr: 'the VR rule' }[need[0]];
        return s.trained.includes(need[0]) ? `Now stop the rewards for ${name}.` : `Select ${name}, train the bird, then stop the rewards.`;
      },
      solution: { trained: ['crf', 'vr'], stopped: ['crf', 'vr'] },
      explain: `
        The bird that was paid for every peck gives up after a handful. The bird on the unpredictable rule pecks fastest of all while rewards come, and goes on for about ninety pecks after they stop.

        This simulation uses one simple rule: the bird quits once it has gone three times longer without a reward than it ever did in training. Real birds are messier, but the pattern is one of the most solid in psychology.
      `,
    },
    {
      id: 'teach-schedules',
      type: 'info',
      title: 'Schedules of reinforcement',
      text: `
        A rule for when a response pays off is called a **schedule of reinforcement**. The reward can depend on **how many** responses were made (a **ratio**) or on **how much time** has passed (an **interval**), and the requirement can be **fixed** or **variable**.

        ${[['fr', 'every 10th peck'], ['vr', 'about every 10th peck, unpredictably'], ['fi', 'the first peck after 10 seconds'], ['vi', 'the first peck after a wait that keeps changing']].map(([id, bird]) => `- **${SCHEDULES[id].name}**: ${SCHEDULES[id].rule}. *For the pigeon: ${bird}.*`).join('\n        ')}

        Ratio schedules reward effort, so they produce fast responding. Your two birds showed the extremes: paid for every peck, and paid on a variable ratio.
      `,
    },
    {
      id: 'slot',
      type: 'choice',
      review: true,
      title: 'Why the unpredictable reward grips hardest',
      text: `
        Rewards that arrive after an **unpredictable number of responses** (a "variable-ratio schedule") produce behaviour that is very hard to extinguish.

        Why does such behaviour carry on so long after the rewards have stopped?
      `,
      columns: 1,
      options: [
        { text: 'Long runs without a reward were normal all along, so nothing signals that the rewards have ended', correct: true },
        { text: 'The total amount of reward was larger', why: 'It was smaller: a reward for every response gives many times as much, and that behaviour stops almost at once.' },
        { text: 'The animal has stopped caring about the reward', why: 'If it did not care, it would not work so hard. It is working *for* the reward, which might be one response away.' },
      ],
      explain: `
        On this schedule "nothing this time" has always been followed, sooner or later, by a win. The next try might be the one. Slot machines pay out this way, and so do scratch cards, loot boxes and feeds that sometimes show something wonderful when you pull to refresh.

        It also answers this lesson's question: a habit can keep its grip long after it stopped being enjoyable, if its rewards were unpredictable.
      `,
    },
    {
      id: 'schedule-match',
      type: 'match',
      title: 'Four rules for paying out',
      gen: (rng) => {
        const ids = rng.shuffle(Object.keys(SCHEDULES));
        return { pairs: ids.map((id) => [rng.pick(SCHEDULES[id].examples), `${SCHEDULES[id].name}: ${SCHEDULES[id].rule}`]) };
      },
      text: `
        A reward can depend on **how many** responses were made (a ratio) or on **how much time** has passed (an interval), and the requirement can be **fixed** or **variable**.

        **Match each example with its schedule.**
      `,
      explain: `
        | | Fixed | Variable |
        |---|---|---|
        | **Ratio** (count) | every tenth coffee free | slot machine |
        | **Interval** (time) | weekly wage | checking for messages |

        Ratio schedules reward effort, so they produce fast responding. Variable schedules give no moment when it is safe to stop.
      `,
    },
    {
      id: 'limits',
      type: 'match',
      title: 'More than bells and levers',
      text: `
        The **behaviourists** hoped to explain all learning by conditioning, without mentioning thoughts. Three experiments showed its limits. **Match each limit with the finding that shows it.**
      `,
      pairs: [
        ['Learning can happen without any reward', `Tolman, ${Y.tolman}: rats that explored a maze without reward had learned the layout, and showed it the day food appeared`],
        ['Learning can happen just by watching', `Bandura, ${Y.bandura}: children who watched an adult hit a "Bobo" doll copied the actions, with no reward for doing so`],
        ['A reward can backfire', `Lepper, ${LEPPER.year}: children promised a prize for drawing with felt-tip pens later chose to draw less in their free time`],
      ],
      explain: `
        Learning can happen **without reward** (the rats had built a mental map), **by watching** (${Y.banduraChildren} nursery children in Bandura's first study), and a reward can even backfire: children promised a prize later spent about half as much free time drawing as children who were not.

        That last result is the least settled: researchers still argue about how large it is and when it happens. The first two have held up well.
      `,
    },
    {
      id: 'habit',
      type: 'fill',
      title: 'The habit loop',
      text: 'Everyday habits can be read with these tools. A habit is a loop of three parts: something that sets it off, the thing you do, and what keeps it going. **Complete the description.**',
      template: `
        A habit starts with a [[reward|*cue|punisher]]: a place, a time, a feeling or a buzz from a phone.

        The cue sets off the [[*routine|schedule|extinction]], the thing you do.

        The routine is kept going by a [[cue|conditioned stimulus|*reinforcer]], which for many apps arrives on a [[fixed|*variable]] schedule.
      `,
      explain: `
        Cue, routine, reward. Punishing yourself for the routine rarely works well: it says what not to do and offers nothing in its place. Changing the cue, or putting a different routine after the same cue, works with the learning instead of against it.

        :::tip Optional, this week
        Pick one small habit of yours and look for its **cue**: where are you, what time is it, what just happened? You do not have to change anything. Spotting the cue is the experiment.
        :::
      `,
    },
  ],
  recap: [
    'Classical conditioning: a signal that reliably comes before something important starts to trigger the response by itself.',
    'Extinction is new learning laid over the old, which is why faded responses can come back.',
    'Operant conditioning: reinforcement makes behaviour more likely (negative reinforcement included); punishment makes it less likely.',
    'Unpredictable rewards produce the most persistent behaviour: nothing signals that they have stopped.',
  ],
  next: 'Next: memory. You will take a short memory test, and it may show you something that was never there.',
};
