// Movement and Fitness · Lesson 6 · Making It Stick
//
// Driving question: why is knowing not doing, and what turns an intention into a routine?
// Sources: Lally et al., Eur J Soc Psychol 2010 (how long habits take; a missed day); Maltz 1960 (the origin
// of "21 days"); Gollwitzer 1999 and Gollwitzer and Sheeran 2006 (if-then plans); WHO 2020 (the
// recommendations the week planner scores against). Numbers live in ../helpers.js.
import { WHO, HABIT, PEOPLE, IF_THEN, INACTIVITY } from '../helpers.js';
import { tally } from '../../../../src/widgets/week-planner.js';

const NEED = WHO.adult.moderate[0];
const HABIT_STUDY_N = 96;   // Lally et al. 2010: 96 volunteers (see ../helpers.js)

// Rosa: a nurse on shifts with two children. Minutes she can realistically free up, Monday to Sunday.
const ROSA = {
  type: 'week-planner',
  free: [30, 20, 0, 30, 20, 90, 60],
  activities: [
    { id: 'walk', label: 'Brisk walk', minutes: 30, kind: 'moderate' },
    { id: 'stairs', label: 'Stairs and a fast walk at work', minutes: 20, kind: 'moderate' },
    { id: 'run', label: 'Run', minutes: 20, kind: 'vigorous' },
    { id: 'dance', label: 'Dance class', minutes: 60, kind: 'moderate' },
    { id: 'strength', label: 'Strength exercises at home', minutes: 20, strength: true },
  ],
  need: { minutes: NEED, strengthDays: WHO.adult.strengthDays },
  alt: 'A planner for one week. Each day shows how many minutes are free. Activities can be placed on a day, and a bar adds up the moderate-equivalent minutes against the WHO range of 150 to 300.',
};
const ROSA_PLAN = [['walk'], ['strength'], [], ['walk'], ['strength'], ['dance'], ['run']];

// Kenji, 72: the recommendation for people over 65 adds balance practice on three days.
const KENJI = {
  type: 'week-planner',
  free: [60, 45, 60, 0, 60, 45, 30],
  activities: [
    { id: 'walk', label: 'Brisk walk', minutes: 30, kind: 'moderate' },
    { id: 'garden', label: 'Digging the garden', minutes: 30, kind: 'moderate', strength: true },
    { id: 'taichi', label: 'Tai chi class', minutes: 45, balance: true, strength: true },
    { id: 'home', label: 'Strength and balance exercises', minutes: 20, strength: true, balance: true },
  ],
  need: { minutes: NEED, strengthDays: WHO.adult.strengthDays, balanceDays: WHO.older.balanceDays },
  alt: 'A planner for one week for a person over 65. Besides the minutes and the strength days, it counts days with balance practice, of which three are recommended.',
};
const KENJI_PLAN = [['walk', 'home'], ['taichi'], ['walk', 'home'], [], ['walk', 'garden'], ['walk'], []];

// The habit loop as a picture: cue, routine, reward, and the arrow back that repetition draws.
const loopBox = (x, hue, name, example) => `<rect class="fill-${hue}-soft stroke-ink" stroke-width="2.5" x="${x}" y="24" width="104" height="52" rx="12"/>`
  + `<text class="fig-label" x="${x + 52}" y="55" text-anchor="middle">${name}</text>`
  + `<text class="fig-label text-muted" x="${x + 52}" y="100" text-anchor="middle">${example}</text>`;
const loopArrow = (x) => `<line x1="${x}" y1="50" x2="${x + 24}" y2="50" class="stroke-ink" stroke-width="2.5" stroke-linecap="round"/><polygon points="${x + 34},50 ${x + 22},43 ${x + 22},57" class="fill-ink"/>`;
const HABIT_LOOP = {
  type: 'svg', viewBox: '0 0 400 200', maxWidth: 460,
  alt: 'A loop of three boxes. Cue (for example: lunch break starts) leads to routine (a ten-minute walk), which leads to reward (fresh air). A dashed arrow runs from the reward back to the cue, marked "repeated in the same setting".',
  content: loopBox(4, 'blue', 'Cue', 'lunch break')
    + loopArrow(111)
    + loopBox(148, 'orange', 'Routine', 'a short walk')
    + loopArrow(255)
    + loopBox(292, 'green', 'Reward', 'fresh air')
    + '<path d="M344 114 C 344 168, 56 168, 56 124" class="fill-none stroke-violet" stroke-width="2.5" stroke-dasharray="7 6" stroke-linecap="round"/>'
    + '<polygon points="56,112 48,126 64,126" class="fill-violet"/>'
    + '<text class="fig-label text-violet" x="200" y="188" text-anchor="middle">repeated in the same setting</text>',
};

const plannerCheck = (need) => (s) => {
  if (s.meets) return true;
  if (!s.count) return 'Pick a day, then tap an activity to place it there.';
  const short = [];
  if (!s.meetsAerobic) short.push(`${need.minutes - s.equivalent} more moderate-equivalent minutes`);
  if (!s.meetsStrength) short.push(`strength on ${need.strengthDays - s.strengthDays} more day${need.strengthDays - s.strengthDays === 1 ? '' : 's'}`);
  if (need.balanceDays && !s.meetsBalance) short.push(`balance on ${need.balanceDays - s.balanceDays} more day${need.balanceDays - s.balanceDays === 1 ? '' : 's'}`);
  return `Not there yet. Still to find: ${short.join(', ')}.`;
};

export default {
  id: 'habits',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'How long until it runs by itself?',
      text: `
        Ninety-six volunteers each chose one small daily behaviour, such as
        a walk after breakfast, and reported every day how automatic it
        felt: done without having to think or decide.

        **After how many days, for the typical volunteer, did the behaviour
        become automatic?**
      `,
      min: 7, max: 120, step: 1, start: 7, answer: HABIT.medianDays, tolerance: 10, unit: 'days',
      explain: `
        **${HABIT.medianDays} days** for the typical person, and anywhere from ${HABIT.range[0]} to
        ${HABIT.range[1]} (Lally and colleagues, ${HABIT.year}). Habits form in weeks to months,
        not days, and exercise habits are among the slower ones.

        The famous "${HABIT.mythDays} days" comes from a ${HABIT.mythYear} self-help book by a plastic
        surgeon, who wrote that patients took *at least* about ${HABIT.mythDays} days to
        get used to a changed appearance. It was never a finding about
        habits.
      `,
    },
    {
      id: 'teach-habit',
      type: 'info',
      title: 'What a habit is made of',
      text: `
        An intention is made in a calm moment. It is carried out, or not,
        at 6 pm on a wet Tuesday. A plan that needs a fresh decision every
        day meets tiredness, weather and a full diary, and often loses.

        A **habit** skips the decision. It has three parts:

        - a **cue** in the surroundings, which sets off
        - a **routine**, followed by
        - a **reward**, which makes the brain mark the pairing as worth keeping.

        Repeat it in the same setting, and the cue begins to start the
        routine by itself.
      `,
      figure: HABIT_LOOP,
    },
    {
      id: 'gap',
      type: 'choice',
      title: 'Knowing is not doing',
      text: `
        Almost everyone knows that activity is good for them. Yet about
        ${INACTIVITY.adultsPercent}% of the world's adults do not reach the recommended minimum, and
        in studies roughly half of the people who firmly *intend* to
        exercise do not follow through.

        **What explains the gap best?**
      `,
      options: [
        { text: 'A plan that depends on deciding afresh each day loses to tiredness, weather and a full diary', correct: true },
        { text: 'People who do not exercise are lazy', why: 'Blame explains nothing. The same person keeps some routines effortlessly and not others, and time, money, safety, health and caring for others shape what is possible.' },
        { text: 'They have not been given enough information', why: 'These are people who already know, and already intend to. More facts do not close the gap.' },
        { text: 'Exercise only suits a sporty minority', why: 'Almost everyone can find some form of movement that suits their body. The gap is about how routines form, not about who people are.' },
      ],
      explain: `
        Intentions are made in a calm moment. They are carried out, or not,
        at 6 pm on a wet Tuesday. What survives that moment is not
        willpower but **routine**: behaviour that starts without a
        decision.

        Much also lies outside any one person's control: safe streets,
        free time, money, health. The tools in this lesson work within
        that reality; they do not replace it.
      `,
    },
    {
      id: 'loop',
      type: 'match',
      text: `
        Dev wanted stronger legs and now does ten squats every morning
        without thinking about it. A habit has parts. **Match each part to
        its place in Dev's morning.**
      `,
      pairs: [
        ['Cue', 'The kettle is switched on'],
        ['Routine', 'Ten squats while it boils'],
        ['Reward', 'The first sip of tea, and a tick on the calendar'],
        ['Repetition', 'The same thing, in the same place, every morning'],
      ],
      explain: `
        The kettle is the **cue**, the squats are the **routine**, and the
        tea and the tick are the **reward**. Tying a new behaviour to
        something you already do every day borrows a cue that is already
        reliable.
      `,
    },
    {
      id: 'curve',
      type: 'choice',
      title: 'The shape of a habit',
      text: `
        In the habit study, "how automatic it feels" rose along a curve
        like this one. The slider sets how long a habit takes to form:
        short for an easy behaviour or a lucky person, long for a harder
        one.

        **Try both ends of the slider. What do all the curves have in
        common?**
      `,
      figure: {
        type: 'plot', height: 290, x: [0, 260], y: [0, 110], xStep: 30, yStep: 20, xLabel: 'days of repeating it', yLabel: 'how automatic (%)',
        params: { d: { min: 18, max: 252, step: 6, value: 66, label: 'nearly automatic after', unit: 'days', color: 'orange' } },
        fns: [{ expr: '100*(1 - exp(-3*x/d))', color: 'blue' }],
        hlines: [{ y: 95, dashed: true, color: 'gray' }],
        vlines: [{ x: 'd', dashed: true, color: 'orange' }],
        labels: [{ x: 172, y: 84, text: 'as automatic as it gets', color: 'gray' }],
        alt: 'A curve of how automatic a behaviour feels against the number of days it has been repeated. It rises steeply at first and then flattens towards a ceiling. A slider makes the rise faster or slower: the ceiling is nearly reached after anything from 18 to about 250 days.',
      },
      options: [
        { text: 'They rise fastest at the start and then flatten', correct: true },
        { text: 'Nothing happens until day 21, then the habit switches on', why: 'There is no switch and no special day. Every repetition adds a little, the early ones most.' },
        { text: 'They climb in a straight line', why: 'Compare the first 20 days with any later 20 days: the early gain is much bigger.' },
        { text: 'They all reach the top on day 66', why: `Move the slider: 66 days is the middle of a very wide range, from about ${HABIT.range[0]} to ${HABIT.range[1]} days.` },
      ],
      explain: `
        Early repetitions do the most, so the first weeks matter, and there
        is no finishing line: the curve just flattens. Where the slider
        starts, it is nearly flat after ${HABIT.medianDays} days; at its two ends, after
        ${HABIT.range[0]} or about ${HABIT.range[1]}.

        If you have studied *How to Learn Anything*, the shape is
        familiar: skills, memories and habits are all built by spaced
        repetition, little and often.
      `,
    },
    {
      id: 'teach-habit-study',
      type: 'info',
      title: 'What the habit study found',
      text: `
        The curve comes from one study: ${HABIT_STUDY_N} volunteers, each repeating one
        small daily behaviour and rating every day how automatic it felt
        (Lally and colleagues, ${HABIT.year}).

        | Days until it was nearly automatic | |
        |---|--:|
        | The typical volunteer | ${HABIT.medianDays} |
        | The quickest | ${HABIT.range[0]} |
        | The slowest | ${HABIT.range[1]} |
        | The popular claim (not from this study) | ${HABIT.mythDays} |

        The study also recorded slips. **A single missed day made no
        measurable difference**: the curve carried on. Repeated misses,
        of course, slow things down.
      `,
    },
    {
      id: 'missed',
      type: 'choice',
      text: `
        Three weeks into a new lunchtime walk, Mei misses a day: a meeting
        ran over. "Three weeks thrown away," she thinks.

        **On the study's evidence, what has the missed day done to the
        habit that was forming?**
      `,
      options: [
        { text: 'Nothing measurable: the curve carried on', correct: true },
        { text: 'It reset the habit to zero', why: 'This is the all-or-nothing belief that ends many good routines. The data did not show it.' },
        { text: 'It halved the progress so far', why: 'A single miss left no measurable dent. Repeated misses, of course, slow things down.' },
        { text: 'It made the habit form faster', why: 'There was no benefit either: the curve simply carried on.' },
      ],
      explain: `
        One missed day made no measurable difference. What derails a
        routine is rarely the miss itself. It is the thought "I have blown
        it, so there is no point", which turns one missed day into ten.

        Studies of self-compassion suggest that people who meet a lapse
        with a shrug and a plan for tomorrow get back to it sooner than
        people who meet it with self-criticism. The
        useful question is not "what is wrong with me?" but "what got in
        the way, and what would make tomorrow easier?"
      `,
    },
    {
      id: 'teach-if-then',
      type: 'info',
      title: 'When X happens, I will do Y',
      text: `
        One of the best-tested tools for closing the gap between meaning
        to and doing is the **if-then plan**. It names a **cue** that will
        certainly happen, and **one specific action** to follow it.

        - **An if-then plan**: "When I close my laptop at five, I will walk round the block."
        - **A wish**: "I want more energy." It names no action and no time.
        - **A vague resolve**: "I will move more." The deciding is left for later.
        - **A slogan**: "Movement is medicine." No cue and no action.

        In many experiments, people who made if-then plans acted on their
        intentions more often than people who only set a goal. The effect
        is modest, and it is real.
      `,
    },
    {
      id: 'if-then',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const item = rng.pick(IF_THEN);
        return {
          text: `
            One of the best-tested tools for closing the gap between meaning
            to and doing is the **if-then plan**: it names a cue that will
            certainly happen, and one specific action to follow it.

            **Which of these is an if-then plan?**
          `,
          options: rng.shuffle([
            { text: item.plan, correct: true },
            { text: item.wish, why: 'This is an outcome to hope for. It does not say what to do, or when.' },
            { text: item.vague, why: 'A good intention, but "more" and "when I can" leave the deciding for later, which is where intentions get lost.' },
            { text: item.slogan, why: 'A slogan, not a plan: no cue and no action.' },
          ]),
          shuffle: false,
          columns: 1,
          explain: 'An if-then plan has the form **"When X happens, I will do Y"**: a cue you cannot miss, and an action small and specific enough to start without thinking. In many experiments, people who made such plans acted on their intentions more often than people who only set a goal. The effect is modest, and it is real.',
        };
      },
    },
    {
      id: 'teach-easy',
      type: 'info',
      title: 'Easy, pleasant, small, specific',
      text: `
        Routines that last tend to share four features. None of them
        needs willpower, which is the point.

        - **Easy**: close, cheap, prepared. Every step removed between the cue and the action helps.
        - **Pleasant**: something you like, with people you like. Enjoyment is among the best predictors of who is still active a year later.
        - **Small**: small enough to survive a bad day. Ten minutes done beats forty minutes skipped.
        - **Specific**: a cue and an action. Motivation comes and goes. A cue does not.
      `,
    },
    {
      id: 'easy',
      type: 'bucket',
      review: true,
      text: 'A new activity routine is taking shape. Which of these make it **more likely** to last, and which less?',
      buckets: ['More likely to last', 'Less likely to last'],
      items: [
        { text: 'An activity you actually enjoy', bucket: 0, why: 'Enjoyment is among the best predictors of who is still active a year later.' },
        { text: 'A friend who is expecting you', bucket: 0, why: 'Company adds a cue, a reward and a reason to turn up.' },
        { text: 'Shoes and clothes laid out the night before', bucket: 0, why: 'Every step removed between the cue and the action helps.' },
        { text: 'A goal small enough for a bad day', bucket: 0, why: 'Ten minutes done beats forty minutes skipped, and keeps the cue alive.' },
        { text: 'A venue forty minutes away', bucket: 1, why: 'Effort before the activity even starts is where routines die.' },
        { text: 'Waiting until you feel motivated', bucket: 1, why: 'Motivation comes and goes. A cue does not.' },
        { text: 'A rule that one missed day means starting over', bucket: 1, why: 'All-or-nothing rules turn a slip into a stop.' },
      ],
      explain: `
        Make it **easy** (close, cheap, prepared), make it **pleasant**
        (something you like, with people you like), make it **small**
        (so it survives bad days) and make it **specific** (a cue and an
        action). None of this needs willpower, which is the point.
      `,
    },
    {
      id: 'build-up',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const [now, add] = rng.pick([[60, 15], [30, 20], [90, 10], [60, 30], [90, 15], [30, 30], [50, 20], [70, 10], [90, 20], [30, 15]]);
        const weeks = (NEED - now) / add;
        return {
          text: `
            ${who} walks briskly for **${now} minutes a week** and wants to build
            up to WHO's minimum of **${NEED} minutes** without a big jump:
            **${add} more minutes each week** than the week before.
            (From 100 minutes, with 25 more each week, it would take
            50 ÷ 25 = 2 weeks.)

            **After how many weeks of adding will ${who} reach ${NEED}?**
          `,
          answer: weeks,
          unit: 'weeks',
          wrong: [
            [NEED / add, `That would be right starting from nothing. ${who} already does ${now} minutes.`],
            [NEED - now, 'That is the number of minutes still to add. Divide it by the weekly step.'],
          ].filter((x) => x[0] !== weeks),
          hints: [`The gap is $${NEED} - ${now} = ${NEED - now}$ minutes.`, `Each week closes ${add} minutes of it.`],
          explain: `$${NEED} - ${now} = ${NEED - now}$ minutes to add, at ${add} a week: $${NEED - now} \\div ${add} = ${weeks}$ weeks. A goal like this is **specific** and **small**: each week has a number that can be hit, and no step is big enough to hurt. Every week on the way already counts.`,
        };
      },
    },
    {
      id: 'planner',
      type: 'interact',
      attempts: 8,
      title: "Rosa's week",
      text: `
        Rosa is a nurse with two children. The cards show the minutes she
        can realistically free up each day: none on Wednesday.

        **Pick a day, then tap an activity to place it.** Build a week
        that reaches **${NEED} moderate-equivalent minutes** (vigorous
        minutes count double) **and strength on ${WHO.adult.strengthDays} days**.
      `,
      widget: ROSA,
      check: plannerCheck(ROSA.need),
      solution: { plan: ROSA_PLAN },
      hints: ['Saturday and Sunday have the most room.', 'A 20-minute run counts as 40 moderate minutes.'],
      explain: `
        One way: a walk on Monday and Thursday, strength exercises on
        Tuesday and Friday, the dance class on Saturday and a short run on
        Sunday. That is ${tally(ROSA_PLAN, ROSA.activities).moderate} + 2 × ${tally(ROSA_PLAN, ROSA.activities).vigorous} = ${tally(ROSA_PLAN, ROSA.activities).equivalent} minutes, with strength on two
        days.

        Notice what made it possible: short blocks on busy days, the long
        one where there was room, and vigorous minutes doing double duty.
        A week that fits a real life beats an ideal week that does not.
      `,
    },
    {
      id: 'planner-older',
      type: 'interact',
      stretch: true,
      attempts: 8,
      title: "Kenji's week",
      text: `
        Kenji is 72. For people over 65 the recommendation adds one
        thing: **balance practice on ${WHO.older.balanceDays} days**. Some activities do two
        jobs at once.

        **Build Kenji a week with ${NEED} minutes, strength on
        ${WHO.adult.strengthDays} days and balance on ${WHO.older.balanceDays}.** Thursday is taken.
      `,
      widget: KENJI,
      check: plannerCheck(KENJI.need),
      solution: { plan: KENJI_PLAN },
      hints: ['Tai chi and the home exercises each count for both strength and balance.', 'Digging counts as moderate minutes and as strength.'],
      explain: `
        One way: brisk walks on four days, the tai chi class on Tuesday,
        the home exercises on two of the walking days and an hour that
        combines a walk with digging the garden.
        Balance and strength do not need extra days. They can ride along
        with things that are already in the week.

        What suits a person depends on their health and what they enjoy.
        Someone with a medical condition, or who is unsure, can ask a
        doctor or physiotherapist where to begin.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Noor says: "I know I should move more. I just never have the
        time." Using what you have learned, **what would you suggest she
        tries first, and why?**
      `,
      model: `
        Something small, tied to a cue that already exists: for example,
        "When I get off the bus, I will walk the last stop", or "After
        lunch I will walk for ten minutes". The first minutes of activity
        bring the biggest health gain, a small action survives busy days,
        and a fixed cue means she does not have to find time or decide
        each day. It also helps to choose something she enjoys, and not to
        count a missed day as a failure.
      `,
    },
    {
      id: 'try',
      type: 'choice',
      mode: 'predict',
      title: 'One sentence',
      text: `
        If you wanted to try this, the whole method fits in one sentence:
        *"When ______, I will ______."* **Which cue in your own day would
        be the easiest to hang something small on?** There is no right
        answer.
      `,
      options: [
        { text: 'Something in my morning routine' },
        { text: 'The journey to or from work or school' },
        { text: 'A meal or a break' },
        { text: 'Something in my evening routine' },
      ],
      explain: `
        Any of them works, as long as it happens every day whether you
        feel like it or not. Keep the action small enough to be almost
        silly. It can grow later; first it has to exist.
      `,
    },
  ],
  recap: [
    `Knowing is not doing. What lasts is **routine**: a cue, a small action, a reward, repeated in the same setting.`,
    `Habits take weeks to months to form (typically about ${HABIT.medianDays} days, with a wide range), not ${HABIT.mythDays} days. A missed day does no harm; giving up after it does.`,
    'An **if-then plan** ("When X happens, I will do Y") turns an intention into something a cue can start. Easy, pleasant, small and specific beats ambitious.',
    `A week that reaches ${NEED} minutes and two strength days can be built from short blocks that fit a real life. Some is always better than none.`,
  ],
  next: 'That completes Movement and Fitness: why to move, how stamina, strength and balance are built, why rest is part of training, and how to make it last. Next in the path: **Sleep, Stress and Mental Health**, the recovery that happens in the mind.',
};
