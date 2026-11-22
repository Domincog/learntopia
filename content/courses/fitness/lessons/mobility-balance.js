// Movement and Fitness · Lesson 4 · Bend, Reach, Balance
//
// Driving question: what actually protects a moving body: stretching, perfect posture, or something else?
// Sources: Lauersen et al., Br J Sports Med 2014 (injury-prevention trials); Herbert et al., Cochrane 2011
// (stretching and soreness); Sherrington et al., Cochrane 2019 (exercise and falls); WHO 2020 (older adults);
// WHO fact sheet on low back pain (2023) and NICE guideline NG59; NHS back-pain page for the warning signs;
// Henschke et al. 2009 (serious causes are rare); Brinjikji et al. 2015 (scans of people without pain).
// Numbers live in ../helpers.js.
import { INJURY_TRIALS, STRETCH_SORENESS, FALLS, SPINE_SCANS, BACK_PAIN, WHO } from '../helpers.js';
import { balanceOf } from '../../../../src/widgets/sway-lab.js';
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/fitness/index.js';

const HARD = { stance: 'one', eyes: 'closed', ground: 'firm' };
const firstSteady = [0, 1, 2, 3, 4, 5, 6, 7, 8].find((wk) => balanceOf({ ...HARD, practice: wk }).steady);
const one = (v) => String(Math.round(v * 10) / 10);

const SCAN_BARS = {
  type: 'bars', yMax: 100, yStep: 20, unit: '%', yLabel: '% of people with no back pain',
  categories: SPINE_SCANS.ages.map((a) => `Age ${a}`),
  series: [
    { name: '"Disc degeneration"', color: 'blue', values: SPINE_SCANS.degeneration },
    { name: '"Disc bulge"', color: 'orange', values: SPINE_SCANS.bulge },
  ],
  alt: `Bar chart of scan findings in people who have no back pain. "Disc degeneration": ${SPINE_SCANS.ages.map((a, i) => `${SPINE_SCANS.degeneration[i]} percent at age ${a}`).join(', ')}. "Disc bulge": ${SPINE_SCANS.ages.map((a, i) => `${SPINE_SCANS.bulge[i]} percent at age ${a}`).join(', ')}.`,
  caption: `Brinjikji and colleagues, ${SPINE_SCANS.year}: scans of 3,110 people without back pain.`,
};

export default {
  id: 'mobility-balance',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      mode: 'predict',
      title: 'What prevents injuries?',
      text: `
        Twenty-five trials, with more than 26,000 sportspeople between them, each
        gave one group an extra routine and compared its injuries with a
        group that carried on as usual.

        Call the injuries in the carry-on-as-usual groups **100**.
        **Drag the bars**: what do you expect for people who added
        stretching, balance training or strength training?
      `,
      widget: {
        type: 'bars', adjust: true, step: 1, yMax: 120, yStep: 20, yLabel: 'injuries (no programme = 100)',
        data: [
          { label: 'Stretching', value: 70, color: 'violet' },
          { label: 'Balance\ntraining', value: 70, color: 'teal' },
          { label: 'Strength\ntraining', value: 70, color: 'orange' },
        ],
        alt: 'Three adjustable bars for the number of sports injuries with stretching, with balance training and with strength training. People with no extra programme are 100.',
      },
      check: (s) => s.values[0][0] > s.values[0][1] && s.values[0][1] > s.values[0][2],
      solution: { values: [[INJURY_TRIALS.stretching, INJURY_TRIALS.balance, INJURY_TRIALS.strength]] },
      explain: `
        Stretching: **${INJURY_TRIALS.stretching}**, no real difference. Balance training:
        **${INJURY_TRIALS.balance}**. Strength training: **${INJURY_TRIALS.strength}**, fewer than a third as
        many injuries (Lauersen and colleagues, ${INJURY_TRIALS.year}).

        Most people guess the other way round. This lesson looks at what
        stretching, balance and posture really do, and at the commonest
        ache of all: the lower back.
      `,
    },
    {
      id: 'teach-stretching',
      type: 'info',
      title: 'What stretching does',
      text: `
        Stretching does one thing well. It keeps or increases **range of
        motion**: how far a joint can move. The gain comes mostly from the
        nervous system learning to tolerate the stretch, and it is lost
        again if the range is never used.

        The rest is hope more than evidence:

        - **Injuries**: ${INJURY_TRIALS.stretching} for every 100 without stretching, as in the chart.
        - **Next-day soreness**: about ${STRETCH_SORENESS.pointsOf100} point less on a 100-point scale. Too small to feel.
        - **Power**: a long, held stretch just before a sprint or a jump slightly reduces it for a while.
        - **Warming up**: stretching a cold muscle is not a warm-up. Easy movement that builds up is.
      `,
      figure: {
        type: 'bars', yMax: 120, yStep: 20, yLabel: 'injuries (no programme = 100)',
        data: [
          { label: 'No extra\nprogramme', value: 100, color: 'gray' },
          { label: 'Stretching', value: INJURY_TRIALS.stretching, color: 'violet' },
          { label: 'Balance\ntraining', value: INJURY_TRIALS.balance, color: 'teal' },
          { label: 'Strength\ntraining', value: INJURY_TRIALS.strength, color: 'orange' },
        ],
        alt: `Bar chart of sports injuries in trials. No extra programme: 100. Stretching: ${INJURY_TRIALS.stretching}. Balance training: ${INJURY_TRIALS.balance}. Strength training: ${INJURY_TRIALS.strength}.`,
        caption: `Lauersen and colleagues, ${INJURY_TRIALS.year}: 25 trials with 26,610 sportspeople.`,
      },
    },
    {
      id: 'stretch-does',
      type: 'bucket',
      review: true,
      text: 'What does regular stretching do, on current evidence?',
      buckets: ['Yes, it does this', 'No, or hardly at all'],
      items: [
        { text: 'Increases how far a joint can move', bucket: 0, why: 'This is what stretching is good for: a larger range of motion, mostly because the nervous system learns to tolerate the stretch.' },
        { text: 'Keeps the range you need for dance, gymnastics or reaching your feet', bucket: 0 },
        { text: 'Prevents sore muscles the next day', bucket: 1, why: `Pooled trials found a difference of about ${STRETCH_SORENESS.pointsOf100} point on a 100-point soreness scale: too small to feel.` },
        { text: 'Cuts sports injuries overall', bucket: 1, why: `In the trials, people who stretched had ${INJURY_TRIALS.stretching} injuries for every 100 in the comparison groups.` },
        { text: 'Makes a sprint or a jump more powerful straight afterwards', bucket: 1, why: 'Long, held stretches just before an explosive effort slightly reduce power for a while.' },
        { text: 'Makes a warm-up unnecessary', bucket: 1, why: 'Stretching a cold muscle is not a warm-up. Easy movement that builds up is.' },
      ],
      explain: `
        Stretching does one thing well: it keeps or increases **range of
        motion**, which you lose if you never use it. That matters for daily
        life and for some sports. It is pleasant, and it is safe if it is
        gentle and never forced into pain. It is not a shield against
        injury or soreness.
      `,
    },
    {
      id: 'warm-up',
      type: 'choice',
      text: `
        A local football club wants fewer injuries this season. Which
        change before training and matches has good trial evidence behind
        it?
      `,
      options: [
        { text: 'A warm-up: easy running, then balance, strength and jumping drills that build up to match pace', correct: true },
        { text: 'A minute of held stretching for each leg muscle', why: 'Held stretches alone have not reduced injuries in trials, and long holds briefly reduce power.' },
        { text: 'Sitting quietly to save energy for the game', why: 'Cold muscles and an unprepared nervous system are the opposite of what the evidence supports.' },
        { text: 'Nothing: preparation makes no difference', why: 'Structured warm-up programmes have cut injuries in several large trials.' },
      ],
      explain: `
        Structured warm-ups that combine running, strength, balance and
        landing practice have cut injuries by about a third in trials with
        footballers. A warm-up raises muscle temperature, speeds up nerve
        signals and rehearses the movements to come.

        The ingredients that did the work in the hook are all in there:
        strength and balance, practised often.
      `,
    },
    {
      id: 'sway-explore',
      type: 'interact',
      graded: false,
      title: 'Standing is not standing still',
      text: `
        Nobody stands perfectly still. The line shows how the body's weight
        wanders over the feet, seen from above, as muscles make tiny
        corrections.

        **Switch to one leg. Then close the eyes.** Watch the line, and the
        three lamps for the senses that balance uses.

        If you are somewhere safe, with a wall or a chair in reach, you can
        try the same thing yourself. That part is optional.
      `,
      widget: { type: 'sway-lab', controls: ['stance', 'eyes', 'ground'], alt: 'Two feet seen from above with a line showing how the body sways, a dashed ring for the limit of balance, and three lamps for the eyes, the inner ear and the feet and joints.' },
      check: (s) => s.tried.some((k) => k.startsWith('one/closed')) || (s.stance === 'one' ? 'Now close the eyes.' : 'Switch the stance to one leg first.'),
      solution: { stance: 'one', eyes: 'closed', tried: ['two/open/firm/0', 'one/open/firm/0', 'one/closed/firm/0'] },
      explain: `
        In this model, on two feet the weight wanders about ${one(balanceOf({ stance: 'two' }).sway)} cm. On one leg the
        sway more than doubles while the safe area shrinks to the width of
        a foot. Close the eyes and it roughly doubles again, to
        ${one(balanceOf(HARD).sway)} cm: too much to hold.
      `,
    },
    {
      id: 'teach-balance',
      type: 'info',
      title: 'Three senses and a loop',
      text: `
        Balance is a loop. **Three senses** report where the body is:

        - the **eyes**;
        - the **inner ear**;
        - the sensors in soles, muscles and joints, a sense called **proprioception**.

        The brain compares the three reports, and muscles correct. Remove
        one sense, as closing the eyes does, or dull one, as a soft cushion
        under the feet does, and the corrections get coarser. **Try both**
        and watch the lamps.
      `,
      figure: { type: 'sway-lab', stance: 'two', controls: ['eyes', 'ground'], alt: 'Two feet seen from above with a line showing how the body sways, and three lamps for the eyes, the inner ear and the feet and joints. The eyes can be closed and the firm floor swapped for a soft cushion.' },
    },
    {
      id: 'practice',
      type: 'interact',
      attempts: 6,
      title: 'A skill, not a gift',
      text: `
        One leg, eyes closed, firm floor. Untrained, the weight wanders
        beyond the limit and the other foot has to come down.

        **Add weeks of balance practice until this person can hold it.**
      `,
      widget: { type: 'sway-lab', ...HARD, controls: ['practice'], alt: 'One foot seen from above with a line showing how the body sways with the eyes closed, and a slider for weeks of balance practice.' },
      check: (s) => {
        if (s.steady) return true;
        return `After ${s.practice} week${s.practice === 1 ? '' : 's'} the weight still wanders up to ${one(s.reach)} cm, beyond the ${s.limit} cm limit. Add more practice.`;
      },
      solution: { practice: firstSteady },
      explain: `
        In this model it takes about **${firstSteady} weeks**. The numbers are
        illustrative, but the finding is solid: balance improves within
        weeks when it is challenged regularly, at any age, and it fades
        when it is not.

        Standing on one leg while the kettle boils, walking heel to toe,
        tai chi, dancing: all of them are practice. Near something to hold
        is the sensible place to do it.
      `,
    },
    {
      id: 'falls',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const falls = rng.pick([100, 200, 300, 400, 500, 600]);
        const place = rng.pick(['a town', 'a housing scheme', 'a group of villages', 'a city district']);
        const fewer = (falls * FALLS.reductionPercent) / 100;
        return {
          text: `
            Somewhere between a quarter and a third of people over 65 fall
            each year, and falls are a leading cause of serious injury in
            later life. A review of 108 trials found that exercise
            programmes, most of them built on balance and strength
            practice, cut the number of falls by **${FALLS.reductionPercent}%**.
            (A cut of 10% would mean 10 fewer falls in every 100.)

            The older residents of ${place} have **${falls} falls** in a
            typical year. If all of them joined such a programme, **about
            how many falls a year would be prevented?**
          `,
          answer: fewer,
          unit: 'falls',
          wrong: [[falls - fewer, `That is how many falls would still happen. The question asks how many are prevented: ${FALLS.reductionPercent}% of ${falls}.`]],
          hints: [`${FALLS.reductionPercent}% of 100 is ${FALLS.reductionPercent}.`],
          explain: `$${FALLS.reductionPercent}\\% \\times ${falls} = ${fewer}$ falls prevented, leaving about ${falls - fewer}. This is why WHO advises people over 65 to practise balance and strength on at least ${WHO.older.balanceDays} days a week. The earlier in life the habit starts, the more there is to keep.`,
        };
      },
    },
    {
      id: 'posture',
      type: 'info',
      title: 'Sit up straight?',
      text: `
        Generations have been told to sit up straight "or you will ruin
        your back". The research on posture and back pain does not bear
        that out:

        - Studies have not found one "correct" posture.
        - The evidence that slouching causes back pain is weak.
        - People with and without back pain sit and stand in every possible way.

        What backs dislike is staying in **any** position for a long time.
        Physiotherapists put it this way: *your best posture is your next
        posture.*
      `,
    },
    {
      id: 'desk',
      type: 'choice',
      text: 'Someone spends most of the working day at a desk. Which habit is best supported by what is known?',
      options: [
        { text: 'Change position often and get up regularly', correct: true },
        { text: 'Hold a straight-backed posture all day', why: 'No posture is right for hours on end, and a rigid one is tiring. Varying it is what helps.' },
        { text: 'Stand all day instead of sitting', why: 'Standing still all day brings its own aches. A desk that allows both is useful because it makes changing easy.' },
        { text: 'Wear a posture-correcting brace', why: 'There is no good evidence that such devices prevent back or neck pain.' },
      ],
      explain: `
        A sensible set-up makes comfort easy: feet supported, screen about
        an arm's length away with its top near eye level, forearms resting,
        things you use often within reach. But no chair or desk prevents
        pain by itself. The body is built to move, and the most protective
        thing at a desk is leaving it now and then.
      `,
    },
    {
      id: 'where-back',
      type: 'interact',
      title: 'The lower back',
      text: `
        The spine is a column of 24 movable bones (vertebrae) standing on
        the sacrum: seven in the neck, twelve in the chest and five in the
        lower back. The lowest five are the largest and carry the most
        weight.

        This figure is seen **from behind**. **Tap the part of the spine
        that people mean by "the lower back".**
      `,
      widget: { type: 'body-map', view: 'back-torso', mode: 'pick', show: ['spine', 'ribs', 'pelvis'], ghost: ['ribs', 'pelvis'], pickable: ['spine'], answer: 'lumbar-spine', alt: 'The trunk seen from behind, with the spine, the ribs and the pelvis, without names.' },
      check: (s) => s.picked === 'lumbar-spine' || (s.picked ? `That is ${s.nameThe}. The lower back is the stretch between the ribs and the pelvis.` : 'Tap a part of the spine.'),
      solution: { picked: 'lumbar-spine' },
      explain: `
        The five **lower-back vertebrae** (the lumbar spine), between the
        lowest ribs and the pelvis. With the discs between them and the
        muscles and ligaments around them, they bend, twist and bear the
        load of everything above. This is where most back pain is felt.
      `,
    },
    {
      id: 'back-serious',
      type: 'info',
      title: 'The commonest ache',
      text: `
        In ${BACK_PAIN.year}, low back pain affected ${BACK_PAIN.millions} million people. It is the
        world's leading cause of disability, and most people will have it
        at some point.

        Of **100 people** who see a doctor with a new episode of low back
        pain:

        - in about **${BACK_PAIN.seriousPer100}** a serious cause is found, such as a broken bone, an infection or cancer;
        - in roughly **${BACK_PAIN.nonSpecificPercent}** no specific damaged structure can be found at all. Doctors call this "non-specific" back pain.

        Non-specific back pain hurts, sometimes a great deal, but it is
        not dangerous, and most episodes ease considerably within a few
        weeks.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 20, yLabel: 'people out of 100',
        data: [
          { label: 'A serious\ncause found', value: BACK_PAIN.seriousPer100, color: 'red' },
          { label: 'No damaged\nstructure found', value: BACK_PAIN.nonSpecificPercent, color: 'blue' },
        ],
        alt: `Bar chart for 100 people who see a doctor with new low back pain. A serious cause is found in about ${BACK_PAIN.seriousPer100}. No specific damaged structure is found in roughly ${BACK_PAIN.nonSpecificPercent}.`,
      },
    },
    {
      id: 'mri',
      type: 'interact',
      title: 'Inside a lower back',
      text: `
        This is an MRI scan of a lower back, seen from the side. The person
        is facing left. The stack of grey blocks is the lower spine.

        **Tap one of the discs: the pads that sit between the bones.**
      `,
      widget: photo(MEDIA['spine-mri'], {
        alt: 'A black-and-white MRI scan of a lower back from the side. A column of five roughly square grey blocks runs down the left half, separated by thinner pads: the upper ones grey with dark rims, the lower ones darker. Behind the column runs a bright white band, and at the far right a bright layer lies under the skin.',
        creditLabel: 'Scan',
        maxWidth: 420,
        hotspots: [
          { id: 'disc', x: 0.34, y: 0.213, r: 0.055, label: 'Disc', alt: 'a thin pad between two grey blocks' },
          { id: 'vertebra', x: 0.35, y: 0.5, r: 0.065, label: 'Vertebra (bone)', alt: 'one of the square grey blocks' },
          { id: 'canal', x: 0.5, y: 0.37, r: 0.05, label: 'Nerve canal', alt: 'the bright band behind the column' },
          { id: 'fat', x: 0.88, y: 0.5, r: 0.06, label: 'Fat under the skin', alt: 'the bright layer at the far right' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'disc') return true;
        if (s.picked === 'vertebra') return 'That is a vertebra, one of the bones. The discs are the thinner pads between them.';
        if (s.picked === 'canal') return 'That bright band is the canal behind the bones, where the nerves run in fluid.';
        return s.picked === 'fat' ? 'That is the layer of fat under the skin of the back.' : 'Tap one of the numbered rings.';
      },
      solution: { picked: 'disc' },
      explain: `
        A **disc** is a pad of tough, springy tissue with a softer centre.
        It spreads load and lets the spine bend. Behind the column, in the
        bright band of fluid, run the nerves to the legs.

        Compare the discs from top to bottom. The lowest ones are darker
        and flatter, and press back a little towards the canal. A report
        would call that "degeneration" and "bulging". The next screen asks
        how much such words should worry anyone.
      `,
    },
    {
      id: 'scans',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const i = rng.int(0, SPINE_SCANS.ages.length - 1);
        const age = SPINE_SCANS.ages[i];
        const finding = rng.pick(['degeneration', 'bulge']);
        const pct = SPINE_SCANS[finding][i];
        const quoted = finding === 'degeneration' ? '"disc degeneration"' : 'a "disc bulge"';
        const n = rng.pick([200, 300, 500]);
        const count = (pct * n) / 100;
        const other = (SPINE_SCANS[finding === 'degeneration' ? 'bulge' : 'degeneration'][i] * n) / 100;
        return {
          text: `
            Researchers pooled the spine scans of people who had **no back
            pain at all** and counted how many showed findings that sound
            alarming in a report. A bar at 10% would mean 10 people in
            every 100.

            Suppose **${n}** pain-free ${age}-year-olds are scanned.
            **About how many would show ${quoted}?**
          `,
          figure: SCAN_BARS,
          answer: count,
          unit: 'people',
          wrong: [
            [pct, `That is the percentage. Out of ${n} people it is ${pct}% of ${n}.`],
            ...(other !== count && other !== pct ? [[other, `That is the other finding. Read the bar for ${quoted} at age ${age}.`]] : []),
          ].filter((wv, k, all) => wv[0] !== count && all.findIndex((x) => x[0] === wv[0]) === k),
          hints: [`Find the bar for age ${age}: ${pct}%.`, `${pct}% of 100 is ${pct}. Scale that to ${n} people.`],
          explain: `$${pct}\\% \\times ${n} = ${count}$ people, none of them in pain. "Degeneration" and "bulges" are mostly signs of age, like grey hair. That is why guidelines advise against routine scans for back pain: a scan usually finds something, and what it finds is often not the cause.`,
        };
      },
    },
    {
      id: 'teach-warning-signs',
      type: 'info',
      tone: 'sober',
      title: 'The signs that are different',
      text: `
        Nearly all low back pain does best with movement and patience. A
        few signs mean something else.

        **Call your emergency number or go to an emergency department
        now** for back pain with any of these:

        - numbness around the genitals or buttocks (the "saddle area");
        - new trouble passing urine, or loss of bladder or bowel control;
        - weakness or numbness in both legs;
        - a serious accident, such as a fall or a crash.

        Back pain with a fever, with unexplained weight loss or with a
        history of cancer needs a doctor promptly. So does pain that is
        not improving after a few weeks.
      `,
    },
    {
      id: 'back-care',
      type: 'bucket',
      review: true,
      tone: 'sober',
      title: 'Keep moving, and know the warning signs',
      text: `
        For ordinary low back pain, guidelines agree: **stay as active as
        you can**, return to normal activities step by step, and avoid
        long bed rest. A few signs are different and need help fast.
        **Sort these.**
      `,
      buckets: ['Usually: keep gently active', 'Get medical help urgently'],
      items: [
        { text: 'An aching back after a weekend of gardening', bucket: 0 },
        { text: 'Stiffness that eases once you are moving', bucket: 0 },
        { text: 'Pain that has slowly improved over two weeks', bucket: 0 },
        { text: 'Numbness around the genitals or buttocks', bucket: 1, why: 'This can mean pressure on the nerves at the base of the spine. It is an emergency.' },
        { text: 'New trouble passing urine, or loss of bladder or bowel control', bucket: 1, why: 'Together with back pain this is an emergency: nerves at the base of the spine may be compressed.' },
        { text: 'Weakness or numbness in both legs', bucket: 1, why: 'Symptoms in both legs at once need to be seen straight away.' },
        { text: 'Severe pain after a fall or a crash', bucket: 1, why: 'A bone may be broken.' },
        { text: 'Back pain with a fever', bucket: 1, why: 'Fever with back pain can mean an infection and needs prompt assessment.' },
      ],
      explain: `
        Numbness in the saddle area, new trouble passing urine, loss of
        bladder or bowel control, or weakness or numbness in both legs:
        **call your emergency number or go to an emergency department
        now.** The same goes for back pain after a serious accident. Fever,
        unexplained weight loss or a history of cancer with new back pain
        need a doctor promptly, as does pain that is not improving after a
        few weeks.

        Everything else, which is nearly all of it, does best with
        movement, patience and, if needed, advice from a doctor,
        physiotherapist or pharmacist.
      `,
    },
    {
      id: 'try',
      type: 'choice',
      mode: 'predict',
      title: 'Something to try',
      text: `
        Balance practice needs no equipment and hides inside ordinary
        moments. **Which of these could you imagine doing this week?**
        There is no right answer.
      `,
      options: [
        { text: 'Standing on one leg while brushing my teeth, near the basin' },
        { text: 'Walking heel to toe along a corridor' },
        { text: 'Getting up from a chair without using my hands' },
        { text: 'Changing position each time I finish a task at my desk' },
      ],
      explain: `
        Each of these is real practice, and each can be made easier (a hand
        on the wall) or harder (a slower pace) to suit the day. Anyone who
        feels unsteady or has had a fall can ask a doctor or
        physiotherapist about a strength and balance programme: they exist
        in many places, and they work.
      `,
    },
  ],
  recap: [
    `Stretching keeps and increases range of motion. It has not been shown to prevent injuries or soreness. **Balance and strength training** have: in trials, balance training cut sports injuries by nearly half and strength training by about two thirds.`,
    'Balance is a skill built on three senses (eyes, inner ear, feet and joints) and on quick muscles. It improves with practice at any age and fades without it.',
    `In later life, balance and strength practice prevents about a quarter of falls. WHO: at least ${WHO.older.balanceDays} days a week from 65.`,
    'There is no single correct posture: *your best posture is your next one*. Low back pain is rarely dangerous and does best with staying active. Numbness in the saddle area, new bladder or bowel problems, or weakness in both legs are emergencies.',
  ],
  next: 'Next: training makes you weaker for a day or two. So when, exactly, do you get fitter?',
};
