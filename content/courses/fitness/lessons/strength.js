// Movement and Fitness · Lesson 3 · Stronger
//
// Driving question: why do you get stronger weeks before your muscles get bigger, and what keeps them growing?
// Sources: physiology textbooks for neural adaptation and muscle growth (Moritani and deVries 1979; Sale 1988);
// WHO 2020 and the NHS for the two-days guideline and what counts; Jones et al. 1977 (tennis players' arm
// bones); Fiatarone et al., JAMA 1990 (strength training at ninety); American Academy of Pediatrics 2020
// (resistance training for children and adolescents). Numbers live in ../helpers.js.
import { WHO, PEOPLE, TENNIS_ARM, NONAGENARIANS, STRENGTHENING } from '../helpers.js';
import { overload } from '../../../../src/widgets/training-sim.js';

const SAME = overload(['same', 'same', 'same', 'same']);
const UP = overload(['up', 'up', 'up', 'up']);
const BREAK = overload(['up', 'up', 'rest', 'up']);
const w = (v) => String(Math.round(v));
const kg = (v) => String(v).replace(/\.0$/, '');

const SIM = { type: 'training-sim', mode: 'overload', alt: 'A chart of strength over sixteen weeks, in four blocks of four weeks. For each block there is a choice: no training, the same load, or a load that goes up.' };

const LIFTS = ['leg presses', 'squats holding a weight', 'seated rows', 'overhead presses', 'step-ups holding weights'];
const lower = (text) => text.charAt(0).toLowerCase() + text.slice(1);

// Bone mass through life, as a share of the average peak: built up until about 30, then slowly lost,
// faster in later life. p is the peak this person reached, in percent of the average.
const BONE = 'p * min(1 - 0.8*exp(-x/7), 0.99 - 0.003*max(x - 30, 0) - 0.006*max(x - 50, 0))';
const fragileAge = (p) => Math.round((1.38 - 70 / p) / 0.009);

export default {
  id: 'strength',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Stronger, but not bigger',
      text: `
        Someone who has never trained starts doing strength exercises twice
        a week. After **three weeks** they can lift clearly more than on day
        one. Yet a scan of the muscle shows almost no change in its size.

        **Where did the extra strength come from?**
      `,
      options: [
        { text: 'The nervous system has learned to use the muscle better', correct: true },
        { text: 'The muscle grew, but too little for a scan to see' },
        { text: 'The bones got stronger and now take part of the load' },
        { text: 'Nowhere: early gains are imagination' },
      ],
      explain: `
        From the **nervous system**. In the first weeks the brain and spinal
        cord learn to switch on more of the muscle's fibres at once, to fire
        them faster and in step, and to quieten the muscles that pull the
        other way. The muscle itself starts to grow only later.

        So strength is a skill as well as a size. The model on the next
        screen shows both parts.
      `,
    },
    {
      id: 'overload-explore',
      type: 'interact',
      graded: false,
      title: 'Sixteen weeks',
      text: `
        This is a model of sixteen weeks of strength training. Right now
        the plan is the **same load** in every block: the same weights,
        week after week.

        Look at the curve. Then **change all four blocks to "Load goes
        up"**: a little more weight whenever the old one gets easy.
      `,
      widget: { ...SIM, plan: ['same', 'same', 'same', 'same'] },
      check: (s) => {
        if (s.seen.includes('up,up,up,up')) return true;
        return s.plan.some((k) => k === 'up') ? 'Set every block to "Load goes up" and compare the curve with the one you started with.' : 'Change the blocks to "Load goes up".';
      },
      solution: { plan: ['up', 'up', 'up', 'up'], seen: ['same,same,same,same', 'up,up,up,up'] },
      explain: `
        With the same load, strength climbs to about ${w(SAME.end)} and then
        **levels off**: once the body can do the job comfortably, the job no
        longer asks it to change. With a load that keeps pace, strength
        reaches about ${w(UP.end)} and is still rising.

        Look at the two coloured bands as well. The early gain is mostly
        [nerve learning]{.violet}. [Muscle growth]{.orange} is slower, and
        takes over later.
      `,
    },
    {
      id: 'teach-overload',
      type: 'info',
      title: 'Progressive overload',
      text: `
        A muscle adapts only as far as it is asked to. Once a load has
        become comfortable, strength levels off, as in this model. To
        keep improving, the demand has to grow a little at a time. That
        principle is called **progressive overload**.

        The gain comes in two stages:

        - First [nerve learning]{.violet}: the nervous system switches on more of the muscle's fibres at once, and in step.
        - Later [muscle growth]{.orange}: each fibre grows thicker. The number of fibres hardly changes.
      `,
      figure: { ...SIM, plan: ['same', 'same', 'same', 'same'], static: true, alt: `A chart of strength over sixteen weeks with the same load throughout. Strength climbs from 100 to about ${w(SAME.end)} and then levels off. A violet band for nerve learning makes up most of the early gain; an orange band for muscle growth is thinner and grows later.` },
    },
    {
      id: 'overload-read',
      type: 'fill',
      review: true,
      text: `
        The chart shows a model of sixteen weeks of strength training with a
        load that goes up as strength does. The two bands show where the
        gain comes from.
      `,
      figure: { ...SIM, plan: ['up', 'up', 'up', 'up'], static: true },
      template: `
        The early gains come mostly from [[more muscle fibres|*nerve learning|fat becoming muscle]].
        Later gains come more and more from [[*thicker muscle fibres|new muscles|longer bones]].
        If the load never changed, strength would [[keep rising|fall to the start|*level off]].
      `,
      explain: `
        First the nerves learn, then the fibres thicken (the number of fibres
        hardly changes). And a muscle adapts only as far as it is asked to:
        to keep improving, the demand has to grow a little at a time. That
        principle is called **progressive overload**.
      `,
    },
    {
      id: 'break',
      type: 'interact',
      stretch: true,
      attempts: 6,
      title: 'A month off',
      text: `
        Real plans get interrupted. Here weeks 9 to 12 are lost to a busy
        month: **no training**, and that block is fixed.

        **Choose the other three blocks so that strength at week 16 is 130
        or more.**
      `,
      widget: { ...SIM, plan: ['same', 'same', 'rest', 'same'], lockPlan: [2] },
      check: (s) => {
        if (Math.round(s.end) >= 130) return true;
        if (s.plan[3] === 'rest') return `Strength ends at ${w(s.end)}. The last block is free: use it.`;
        return `Strength ends at ${w(s.end)}. What was banked before the break counts most: look at weeks 1 to 8.`;
      },
      solution: { plan: ['up', 'up', 'rest', 'up'] },
      hints: ['A load that goes up builds more in the first eight weeks than a load that stays the same.'],
      explain: `
        With a rising load before and after the break, strength reaches about
        ${w(BREAK.weeks[8].total)} by week 8, slips to about ${w(BREAK.weeks[12].total)} during
        the month off and is back at about ${w(BREAK.end)} by week 16.

        Two things to notice. A break costs **some** of the gain, not all of
        it. And in the model the muscle band shrinks faster than the nerve
        band: what the nervous system has learned is kept for longer. A
        missed month is a dip, not a reset.
      `,
    },
    {
      id: 'teach-log',
      type: 'info',
      title: 'Three numbers in a training log',
      text: `
        Strength training is written down in three numbers:

        - a **repetition** is one lift;
        - a **set** is a group of repetitions done without a rest;
        - the **load** is the weight.

        :::example "2 sets of 5 with 6 kg"
        2 × 5 = 10 lifts, each of 6 kg. So 10 × 6 = **60 kg** was lifted
        in total. Trainers call this total the **volume**.
        :::

        Progressive overload can come through any of the three: a little
        more load, more repetitions, or one more set.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 20, yLabel: 'kg lifted in total',
        data: [
          { label: '2 sets of 5\nwith 6 kg', value: 2 * 5 * 6, color: 'gray' },
          { label: '2 sets of 5\nwith 7 kg', value: 2 * 5 * 7, color: 'orange' },
          { label: '2 sets of 6\nwith 6 kg', value: 2 * 6 * 6, color: 'orange' },
          { label: '3 sets of 5\nwith 6 kg', value: 3 * 5 * 6, color: 'orange' },
        ],
        alt: 'Bar chart of the total weight lifted in four log entries. 2 sets of 5 with 6 kg: 60 kg. With 7 kg instead: 70 kg. With 6 repetitions instead of 5: 72 kg. With 3 sets instead of 2: 90 kg.',
        caption: 'One entry, and three ways of asking for a little more.',
      },
    },
    {
      id: 'log',
      type: 'numeric',
      title: 'Reading a training log',
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const lift = rng.pick(LIFTS);
        const sets = rng.pick([2, 3, 4]);
        const reps = rng.pick([8, 10, 12, 15]);
        const load = rng.pick([10, 20, 30, 40, 50]);
        const total = sets * reps * load;
        return {
          text: `
            A log entry gives the sets, the repetitions in each set, and
            the load.

            ${who}'s log says: ${lift}, **${sets} sets of ${reps} with ${load} kg**.
            **How many kilograms were lifted in total?**
          `,
          answer: total,
          unit: 'kg',
          wrong: [
            [sets * reps, `That is the number of lifts: ${sets} × ${reps}. Each of them moved ${load} kg.`],
            [reps * load, `That is one set. There were ${sets} of them.`],
          ],
          hints: [`First the number of lifts: $${sets} \\times ${reps} = ${sets * reps}$.`],
          explain: `$${sets} \\times ${reps} = ${sets * reps}$ lifts of ${load} kg each: $${sets * reps} \\times ${load} = ${total}$ kg. Trainers call this total the **volume**. It can grow through any of the three numbers: more load, more repetitions, or more sets.`,
        };
      },
    },
    {
      id: 'which-overload',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const lift = rng.pick(LIFTS);
        const sets = rng.pick([2, 3]);
        const reps = rng.pick([8, 10, 12]);
        const load = rng.pick([15, 20, 30, 40]);
        const step = rng.pick([2.5, 5]);
        const entry = (s, r, l) => `${s} sets of ${r} with ${kg(l)} kg`;
        const kind = rng.pick(['load', 'reps', 'sets']);
        const better = kind === 'load' ? [sets, reps, load + step] : kind === 'reps' ? [sets, reps + 2, load] : [sets + 1, reps, load];
        const said = kind === 'load' ? `the load went up by ${kg(step)} kg` : kind === 'reps' ? 'each set has two more repetitions' : 'there is one more set';
        return {
          text: `
            A month ago ${who} did ${lift}: **${entry(sets, reps, load)}**, and
            the last repetitions of each set were hard.

            **Which of today's entries shows progressive overload**: a
            little more than the muscles have already adapted to?
          `,
          options: rng.shuffle([
            { text: entry(...better), correct: true },
            { text: entry(sets, reps, load), why: 'Exactly the same as a month ago. If it now feels easier, the body has adapted, and it will stop there.' },
            { text: entry(sets, reps, load - step), why: 'The same lifts with less weight ask less of the muscle than a month ago.' },
            { text: entry(sets, reps - 2, load), why: 'Fewer repetitions with the same weight: less work than a month ago.' },
          ]),
          shuffle: false,
          hints: ['Progressive overload means asking for a little more than last time.'],
          explain: `**${entry(...better)}**: ${said}, so the muscles are asked for a little more than they have already adapted to. Progress can also come from a harder version of a body-weight exercise or a thicker resistance band. Small steps are the point: the load follows the strength, not the other way round.`,
        };
      },
    },
    {
      id: 'bone',
      type: 'choice',
      columns: 1,
      title: 'Not only muscle',
      text: `
        Professional tennis players hit thousands of balls a week with one
        arm. X-rays compared the upper-arm bone of the **racket arm** with
        the same bone in the other arm. In the racket arm the wall of the
        bone was about **${TENNIS_ARM.men}% thicker** in the men and ${TENNIS_ARM.women}% in the women
        (Jones and colleagues, ${TENNIS_ARM.year}).

        Both arms belong to one person, with the same food and the same
        hormones. **What does the difference show?**
      `,
      figure: {
        type: 'body-map', view: 'body', bounds: [20, 150, 380, 470], show: ['skeleton'], groups: [{ ids: ['humerus'], color: 'orange', label: 'Upper-arm bone (humerus)' }],
        zoom: false, static: true, alt: 'The skeleton of the upper body from the front. The upper-arm bone on each side, between shoulder and elbow, is highlighted.',
      },
      options: [
        { text: 'Bone is built up where it is loaded', correct: true },
        { text: 'People born with thick bones become tennis players', why: 'Then both arms would be thick. Only the arm that takes the load differs.' },
        { text: 'A bone is finished once you are grown', why: 'These were adults, and years of play had changed one arm and not the other.' },
        { text: 'Food alone decides how strong a bone is', why: 'Both arms are fed by the same blood. Food cannot explain a difference between them.' },
      ],
      explain: `
        Same person, same food, same hormones: the difference is **load**.

        Bone is living tissue that is rebuilt all life long, and it is built
        up where it is loaded. Astronauts, whose bones carry no weight, lose
        about 1% of the bone in their hips and legs every month. Impact (walking, running, jumping,
        dancing) and muscle pulling on bone both count.
      `,
    },
    {
      id: 'bone-bank',
      type: 'choice',
      title: 'The bone bank',
      text: `
        Bone mass is built up through childhood and youth, peaks by about
        the age of 30 and then slowly falls, faster in later life. In this
        simplified picture, the dashed line marks where bones begin to
        break easily.

        **Move the slider**: it sets how much bone a person has built by
        that peak. What does a higher peak change?
      `,
      figure: {
        type: 'plot', height: 300, x: [0, 100], y: [0, 120], xStep: 10, yStep: 20, xLabel: 'age', yLabel: 'bone mass',
        params: { p: { min: 90, max: 110, step: 5, value: 100, label: 'bone built by age 30', unit: '%', color: 'blue' } },
        fns: [{ expr: BONE.replace('p *', '100 *'), color: 'gray', dashed: true, width: 2 }, { expr: BONE, color: 'blue' }],
        segments: [{ from: [30, 70], to: [100, 70], color: 'red', dashed: true }],
        labels: [{ x: 34, y: 60, text: 'fragile below this line', color: 'red' }],
        readouts: [{ label: 'line crossed at about age', value: (st) => fragileAge(st.p), digits: 0, color: 'red' }],
        alt: 'A curve of bone mass against age: it rises steeply in childhood, peaks at about 30, falls slowly to 50 and faster afterwards. From age 30 on, a dashed horizontal line marks the level below which bones are fragile. A slider raises or lowers the peak, and with it the whole later curve.',
      },
      options: [
        { text: 'The line is crossed years later, because the whole later curve sits higher', correct: true },
        { text: 'Bone is lost more slowly afterwards', why: 'In this model the slope after 30 is the same whatever the peak. What changes is the height it starts from.' },
        { text: 'Nothing after the age of 50', why: `Compare the readout at 90% and at 110%: about age ${fragileAge(90)} against about ${fragileAge(110)}.` },
        { text: 'Bone stops being lost at all', why: 'The curve still falls. A higher peak buys time, it does not stop the loss.' },
      ],
      explain: `
        A higher peak is like a bigger balance in a bank account that is
        slowly drawn down: in this model, ${fragileAge(110) - fragileAge(90)} years' difference
        between the lowest and the highest setting. That is why active
        play, running and jumping in childhood and the teens matter for
        life.

        The account is not closed at 30. Loading bones in adult life slows
        the loss, and so do enough calcium and vitamin D and not smoking.
        Genes and hormones play a large part too.
      `,
    },
    {
      id: 'ninety',
      type: 'multi',
      title: 'Too late to start?',
      text: `
        Muscle and strength decline from mid-life, faster after about 60.
        That loss decides who can still rise from a chair at 85.

        In ${NONAGENARIANS.year}, ten frail nursing-home residents with an average age of
        **${NONAGENARIANS.meanAge}** trained their thigh muscles hard for ${NONAGENARIANS.weeks} weeks. In the
        nine who finished, strength rose by **${NONAGENARIANS.gainPercent}%** on average, the
        thigh muscles grew and walking got faster.

        **Which conclusions does this small study support?**
      `,
      figure: {
        type: 'bars', yMax: 300, yStep: 50, yLabel: 'thigh strength (start = 100)',
        data: [
          { label: 'Before', value: 100, color: 'gray' },
          { label: `After ${NONAGENARIANS.weeks} weeks`, value: 100 + NONAGENARIANS.gainPercent, color: 'orange' },
        ],
        alt: `Bar chart of average thigh strength in nine nursing-home residents aged about ninety. Before training: 100. After ${NONAGENARIANS.weeks} weeks of strength training: ${100 + NONAGENARIANS.gainPercent}.`,
        caption: `Fiatarone and colleagues, ${NONAGENARIANS.year}.`,
      },
      options: [
        { text: 'Muscles still answer to training at ninety', correct: true },
        { text: 'Part of the weakness that is blamed on age can be won back', correct: true },
        { text: 'Every ninety-year-old would triple their strength', why: `${NONAGENARIANS.gainPercent}% is an average over nine people. A small study shows what is possible, not what each person would gain.` },
        { text: 'Training stops muscles from ageing', why: 'The decline with age is real. The study shows that training can win back part of what was lost, not that nothing is lost.' },
      ],
      explain: `
        A rise of **${NONAGENARIANS.gainPercent}%** means they could lift nearly three times as much
        as before (Fiatarone and colleagues, ${NONAGENARIANS.year}).

        Much of the weakness that is blamed on age comes from disuse, and
        much of it can be won back at any age. For older people, strength
        is what independence is made of.
      `,
    },
    {
      id: 'teach-counts',
      type: 'info',
      title: 'What counts as strengthening',
      text: `
        WHO recommends **muscle-strengthening activity on ${WHO.adult.strengthDays} or more days
        a week**, working all the major muscle groups: legs, hips, back,
        abdomen, chest, shoulders and arms.

        Anything that makes muscles work against a load until they are
        tired counts. No gym is needed.

        - **Counts**: ${STRENGTHENING.filter((a) => a.yes).map((a) => lower(a.text)).join(', ')}.
        - **Does not count**: ${STRENGTHENING.filter((a) => !a.yes).map((a) => lower(a.text)).join(', ')}. None of these loads the muscles enough.
      `,
      figure: {
        type: 'body-map', view: 'body', show: ['muscles'], static: true, zoom: false,
        groups: [{ ids: ['quadriceps'], color: 'orange' }],
        labels: [
          { id: 'deltoid', text: 'Shoulders' },
          { id: 'pectorals', text: 'Chest' },
          { id: 'biceps', text: 'Arms' },
          { id: 'abdominals', text: 'Abdomen' },
          { id: 'quadriceps', text: 'Front thigh muscles: they straighten the knee' },
        ],
        alt: 'A body seen from the front with its large surface muscles drawn in. Named: the shoulders, the chest, the arms, the abdomen and, highlighted, the front thigh muscles, which straighten the knee.',
      },
    },
    {
      id: 'counts',
      type: 'bucket',
      review: true,
      gen: (rng) => {
        const yes = rng.sample(STRENGTHENING.filter((a) => a.yes), 4);
        const no = rng.sample(STRENGTHENING.filter((a) => !a.yes), 2);
        return {
          text: `WHO recommends **muscle-strengthening activity on ${WHO.adult.strengthDays} or more days a week**, working all the major muscle groups. Which of these count?`,
          buckets: ['Counts as muscle-strengthening', 'Does not count'],
          items: rng.shuffle([...yes.map((a) => ({ text: a.text, bucket: 0 })), ...no.map((a) => ({ text: a.text, bucket: 1, why: a.why }))]),
          explain: 'Anything that makes muscles work against a load until they are tired counts: the body\'s own weight, a band, a bag of shopping, a spade or a barbell. No gym is needed. The major groups are the legs, hips, back, abdomen, chest, shoulders and arms.',
        };
      },
    },
    {
      id: 'chair',
      type: 'interact',
      title: 'The everyday strength test',
      text: `
        Standing up from a chair without using the hands is a strength
        exercise, and one that physiotherapists use to test the legs.

        The figure faces you. **Tap the muscle group that straightens the
        knees to lift the body.**
      `,
      widget: { type: 'body-map', view: 'body', mode: 'pick', show: ['muscles'], pickable: ['muscles'], answer: 'quadriceps', alt: 'A body seen from the front with its large surface muscles drawn in, without names.' },
      check: (s) => s.picked === 'quadriceps' || (s.picked ? `That is ${s.nameThe}. The muscles that straighten the knee lie on the front of the thigh.` : 'Tap one of the muscle groups.'),
      solution: { picked: 'quadriceps' },
      hints: ['To straighten a joint, a muscle has to cross it. Which large muscle group runs down to the knee?'],
      explain: `
        The **front thigh muscles** (quadriceps) straighten the knees,
        helped by the buttock muscles, which straighten the hips. They are
        among the largest muscles in the body, and how well they work decides
        whether stairs, chairs and kerbs stay easy in later life.
      `,
    },
    {
      id: 'myths',
      type: 'interact',
      graded: false,
      title: 'Six things people say',
      text: `
        Strength training collects folklore. **Say whether each statement is
        true, and how sure you are.** At the end you will see how well your
        confidence matched your answers.
      `,
      widget: {
        type: 'calibration',
        alt: 'Six statements about strength training, shown one at a time, each to be marked true or false with a level of confidence.',
        items: [
          { text: 'Lifting weights stunts a child\'s growth.', answer: false, why: 'There is no evidence for it. Paediatric bodies support supervised strength training for children and teenagers, with good technique and sensible loads.' },
          { text: 'A muscle you stop using turns into fat.', answer: false, why: 'Muscle and fat are different tissues. Unused muscle shrinks. Fat may be gained at the same time, but nothing turns into anything.' },
          { text: 'People in their eighties can still build muscle and strength.', answer: true, why: 'Trials in people over 80, and even over 90, show large gains.' },
          { text: 'A session only works if it hurts.', answer: false, why: 'Effort is needed: the last repetitions should be hard. Pain is not. Sharp pain, or pain in a joint, is a signal to stop.' },
          { text: 'Only heavy weights build strength; bands and body weight do not.', answer: false, why: 'Lighter loads build muscle too, as long as a set is taken close to the point where no more repetitions are possible.' },
          { text: 'A few months of strength training makes most women very muscular.', answer: false, why: 'Large muscles take years of dedicated training for anyone. Women and men gain strength at similar relative rates.' },
        ],
      },
      check: (s) => s.done,
      solution: { done: true },
      explain: '"No pain, no gain" is half right: no *effort*, no gain. The rest of the list is simply false, and some of it has kept children, women and older people away from an activity that would have served them well.',
    },
    {
      id: 'teach-technique',
      type: 'info',
      title: 'How beginners are taught to start',
      text: `
        Instructors and physiotherapists teach beginners the same few
        principles:

        - **Form first.** Learn the movement with a light load before adding weight.
        - **Control.** Move under control, and keep breathing.
        - **Small steps.** Add load a little at a time.
        - **Rest.** Leave a day or two before the same muscles work hard again.

        Effort is part of it: the last repetitions of a set should be
        hard. Pain is not. Sharp pain, or pain in a joint, is a signal to
        stop.
      `,
    },
    {
      id: 'technique',
      type: 'multi',
      text: 'Which of these are sensible principles for someone beginning strength training? **Choose all that apply.**',
      options: [
        { text: 'Learn the movement with a light load before adding weight', correct: true },
        { text: 'Move under control, and keep breathing', correct: true },
        { text: 'Add load in small steps', correct: true },
        { text: 'Leave a day or two before working the same muscles hard again', correct: true },
        { text: 'Push through sharp or joint pain to finish the set', why: 'Tired, burning muscles are part of training. Sharp pain, or pain in a joint, means stop.' },
        { text: 'Start with the heaviest weight you can move once', why: 'A beginner\'s tendons and technique are not ready for that. The early gains come from learning the movement.' },
      ],
      explain: `
        Good form first, then load, in small steps, with rest between hard
        sessions for the same muscles. These are principles, not a
        programme: a qualified instructor or physiotherapist can turn them
        into one, and anyone with a medical condition, or who is pregnant
        or unsure, should check with a professional first.
      `,
    },
    {
      id: 'try',
      type: 'choice',
      mode: 'predict',
      title: 'Something to notice',
      text: `
        Much of daily life is already strength work. **Which of these do
        you meet most often in a week?** There is no right answer.
      `,
      options: [
        { text: 'Getting up from a chair' },
        { text: 'Carrying bags or a child' },
        { text: 'Stairs' },
        { text: 'Digging, lifting or pushing something heavy' },
      ],
      explain: `
        Each is a strength exercise in disguise. Standing up from a chair
        without using the hands is the squat that physiotherapists test
        older people with. This week you might notice which everyday loads
        already make your muscles work, and which could become a small
        habit.
      `,
    },
  ],
  recap: [
    'Strength comes first from the **nervous system** learning to use the muscle, then from muscle fibres growing thicker.',
    'A muscle adapts only as far as it is asked to. **Progressive overload**: a little more load, or more repetitions, or more sets, as the old demand gets easy.',
    'Bone answers to load as well. The peak reached by about 30 is banked for life, and loading slows the loss later.',
    `Strength can be built at any age, even past ninety, and it protects independence. The guideline: **all major muscle groups on ${WHO.adult.strengthDays} or more days a week**.`,
  ],
  next: 'Next: stretching, balance and posture. Which of the things everyone "knows" about them survive a close look?',
};
