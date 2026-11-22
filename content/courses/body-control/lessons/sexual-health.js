// The Body II: Control, Defence and Movement · Lesson 7 · Sexual and Reproductive Health
//
// Driving question: every contraceptive has two failure rates. Why two, and what does that tell you about which methods work best?
// Clinical, plain and inclusive; nothing explicit; no assumptions about the learner. Facts: WHO, CDC, NHS (see helpers.js).
import { METHODS, methodById, FERTILITY, METHOD_GROUPS, STI_FACTS, CONSENT_CASES, SERVICES, SERVICE_CASES, ASSAULT_HELP, LIFE, grouped } from '../helpers.js';

const YEAR = { type: 'contraceptive-year', methods: METHODS };
const YEAR_ALT = 'A grid of one hundred dots, each standing for a couple who rely on one method of contraception for a year. The couples who have a pregnancy within the year are marked. Buttons choose the method and switch between typical and perfect use.';
const pill = methodById('pill');
const condom = methodById('condom');
const implant = methodById('implant');
const none = methodById('none');
const methodsIn = (group) => METHOD_GROUPS.filter((m) => m[1] === group).map((m) => m[0]).join('; ');

export default {
  id: 'sexual-health',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A hundred couples, one year',
      text: `
        This lesson gives the facts about fertility, contraception,
        infections and consent, plainly. They are worth knowing whoever
        you are and whatever your own life looks like.

        Start with a number. One hundred couples have sex regularly for a
        year and use **no contraception at all**. **In how many of the
        hundred do you expect a pregnancy within the year?**
      `,
      min: 0, max: 100, step: 5, start: 50, answer: none.typical, tolerance: 5,
      explain: `
        About **${none.typical} in 100**. Human fertility is high when nothing is done
        about it.

        Every method of contraception is measured against that figure, in
        the same way: of 100 couples relying on it for a year, how many
        have a pregnancy?
      `,
    },
    {
      id: 'fertile-window',
      type: 'interact',
      graded: false,
      title: 'When can it happen?',
      text: `
        A pregnancy can only start in the days around **ovulation**. Sperm
        can survive for up to about ${FERTILITY.spermDays} days after sex; an egg, about one
        day after its release. Together that makes a **fertile window** of
        about ${FERTILITY.windowDays} days in each cycle (green).

        **Change the length of the cycle** a few times, and watch where
        the window falls.
      `,
      widget: { type: 'cycle-hormones', length: 28, day: 1, hormones: false, fertile: true, lengthRange: [LIFE.cycleDays[0], LIFE.cycleDays[1], 1], alt: 'One menstrual cycle on a line of days, with the days of the period, the day the egg is released and a green band for the fertile window. A slider changes the length of the cycle.' },
      check: (s) => s.lengths.length >= 3 || 'Try at least three different cycle lengths.',
      solution: { length: 22, lengths: [28, 35, 22] },
      explain: `
        In a 28-day cycle the window is about days 9 to 14. In a 35-day
        cycle it is days 16 to 21; in a 22-day cycle, days 3 to 8, which
        can overlap the end of a period.

        The window is real, but its position is only known afterwards,
        because it is counted back from a period that has not happened
        yet.
      `,
    },
    {
      id: 'example-window',
      type: 'info',
      title: 'Finding the window',
      text: `
        The window is counted **back from the next period**, in two steps.

        :::example A worked example: a 28-day cycle
        1. Ovulation comes about ${LIFE.lutealDays} days before the next period:
           28 − ${LIFE.lutealDays} = **day ${28 - LIFE.lutealDays}**.
        2. The window is the day of ovulation and the 5 days before it:
           ${28 - LIFE.lutealDays} − 5 = **day ${28 - LIFE.lutealDays - 5}**.

        So the fertile window runs from about day ${28 - LIFE.lutealDays - 5} to day ${28 - LIFE.lutealDays}.
        :::

        Because the count starts from the end, a longer or shorter cycle
        moves the whole window.
      `,
      figure: { type: 'cycle-hormones', length: 28, day: 14, hormones: false, fertile: true, static: true, alt: 'One 28-day menstrual cycle on a line of days. The egg is released on day 14, and a green band marks the fertile window from day 9 to day 14.' },
    },
    {
      id: 'window-days',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const length = rng.intExcept(LIFE.cycleDays[0] + 1, LIFE.cycleDays[1], [28]);
        const ov = length - LIFE.lutealDays;
        const who = rng.pick(['Amira', 'Chen', 'Lucía', 'Thandi', 'Freya', 'Mele']);
        return {
          text: `
            A textbook example. ${who}'s cycle this month was **${length} days**
            long. Take ovulation as ${LIFE.lutealDays} days before the next period, and the
            fertile window as the day of ovulation plus the **5 days before
            it**.
          `,
          template: `Ovulation was on about day [[${ov}]]. The fertile window opened on about day [[${ov - 5}]] and closed on day [[${ov}]].`,
          plain: true,
          hints: [`Ovulation: ${length} − ${LIFE.lutealDays}.`, 'The window is six days long and ends on the day of ovulation.'],
          explain: `
            ${length} − ${LIFE.lutealDays} = day ${ov} for ovulation. Five days earlier is day ${ov - 5},
            so the window ran from about **day ${ov - 5} to day ${ov}**. Had the
            cycle been 28 days, it would have been days 9 to 14.
          `,
        };
      },
    },
    {
      id: 'safe-days',
      type: 'choice',
      title: '"Safe days"',
      text: `
        Someone reasons: "The week after a period is always safe. Day 7
        cannot be fertile."

        **In which of these cycles does day 7 fall inside the fertile
        window?**
      `,
      shuffle: false,
      options: [
        { text: 'A 22-day cycle', correct: true },
        { text: 'A 28-day cycle', why: 'There the window is about days 9 to 14, so day 7 is just outside it. But a shorter cycle moves the window earlier.' },
        { text: 'A 35-day cycle', why: 'There the window is about days 16 to 21. Look at the shortest cycle instead.' },
        { text: 'None: day 7 is never fertile', why: 'In a short cycle ovulation comes early, and the window can open only days after the period began.' },
      ],
      explain: `
        In a 22-day cycle ovulation is on about day 8, so the window runs
        from about day 3 to day 8, and day 7 is inside it. Since cycle
        length varies from month to month, and nobody knows this month's
        length in advance, counting days is unreliable: with typical use,
        between ${FERTILITY.fabTypical[0]} and ${FERTILITY.fabTypical[1]} in 100 couples relying on "fertility awareness"
        methods have a pregnancy within a year, depending on the method.
      `,
    },
    {
      id: 'year-explore',
      type: 'interact',
      graded: false,
      title: 'Methods compared',
      text: `
        Here are 100 couples again, each relying on one method for a year.
        A marked square is a couple who had a pregnancy.

        **Look at four or more methods**, and switch between **typical
        use** (as people really use a method) and **perfect use** (used
        correctly every single time).
      `,
      widget: { ...YEAR, method: 'none', alt: YEAR_ALT },
      check: (s) => (s.seen.length >= 4 && s.sawPerfect) || (s.seen.length < 4 ? 'Look at a few more methods.' : 'Now switch to **Perfect use** and compare.'),
      solution: { method: 'pill', use: 'perfect', seen: ['none', 'condom', 'pill', 'implant'] },
      explain: `
        | Method | Typical use | Perfect use |
        |---|:---:|:---:|
        | No method | ${none.typical} | ${none.perfect} |
        | Withdrawal | ${methodById('withdrawal').typical} | ${methodById('withdrawal').perfect} |
        | Condom | ${condom.typical} | ${condom.perfect} |
        | The pill | ${pill.typical} | ${pill.perfect} |
        | Injection | ${methodById('injection').typical} | ${methodById('injection').perfect} |
        | Copper IUD | ${methodById('iud').typical} | ${methodById('iud').perfect} |
        | Implant | ${implant.typical} | ${implant.perfect} |

        Pregnancies per 100 couples in the first year of use (Trussell
        and Aiken, 2018: the figures CDC and WHO quote). Every method is
        far better than none, and no method is perfect.
      `,
    },
    {
      id: 'the-gap',
      type: 'choice',
      title: 'Two numbers for one method',
      text: `
        The pill: about **${pill.typical} in 100** with typical use, but fewer than
        **1 in 100** with perfect use. **What explains the gap?**
      `,
      options: [
        { text: 'In real life, pills are sometimes missed or taken late', correct: true },
        { text: 'The pill gradually stops working in some people', why: 'It does not wear off. Taken exactly as directed, it fails for fewer than 1 in 100 in a year.' },
        { text: 'The typical-use studies were done carelessly', why: 'Both figures come from the same careful research. They measure different things: the method itself, and the method plus real life.' },
        { text: 'Perfect use is a guess; nobody can measure it', why: 'It is measured, in people who report using the method correctly every time.' },
      ],
      explain: `
        Perfect use measures the **method**. Typical use measures the
        method **plus ordinary life**: a forgotten pill, a late start to a
        pack, a condom put on too late. Neither figure is a judgement of
        anyone; people are human, and the honest number to plan with is
        the typical one.
      `,
    },
    {
      id: 'fit-and-forget',
      type: 'interact',
      title: 'Closing the gap',
      text: `
        If the gap comes from having to remember, some methods should
        hardly have one.

        **Find a method whose typical-use figure is under 1 in 100.**
      `,
      widget: { ...YEAR, method: 'pill', use: 'typical', alt: YEAR_ALT },
      check: (s) => {
        if (s.use !== 'typical') return 'Switch back to **Typical use**: that is the figure that counts in real life.';
        return s.typical < 1 || `With typical use, ${s.marked} in 100 couples relying on this method have a pregnancy in a year. Look for one with nothing to remember.`;
      },
      solution: { method: 'implant', use: 'typical' },
      hints: ['Which methods are fitted once by a clinician and then work by themselves for years?'],
      explain: `
        The **implant** (a small rod under the skin of the arm, lasting
        three years or more) and the **IUD** (a small device placed in the
        uterus, lasting several years) are fitted by a clinician and
        then need nothing done. With nothing to forget, typical use is
        almost the same as perfect use: under 1 in 100.

        Which method suits a person depends on much more than this
        number: health, side effects, plans, preference. That is a
        conversation to have with a doctor, nurse or pharmacist.
      `,
    },
    {
      id: 'per-100',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        let m;
        let couples;
        do { m = rng.pick(METHODS.filter((q) => q.id !== 'none')); couples = rng.pick([200, 500, 1000, 2000, 5000]); } while (!Number.isInteger(Math.round(m.typical * couples) / 100));
        const answer = Math.round(m.typical * couples) / 100;
        const per = m.typical >= 1 ? `**${m.typical} in 100**` : `**${m.typical} in 100** (that is, ${Math.round(m.typical * 10)} in 1,000)`;
        return {
          text: `
            With typical use, ${m.long || m.name.toLowerCase()} has a failure rate of
            ${per} couples a year.

            "In 100" scales up: a rate of 3 in 100 would mean about 12
            among 400 couples (4 groups of 100, with 3 in each).

            In a region, **${grouped(couples)} couples** rely on this method for a
            year. **About how many pregnancies would you expect among them?**
          `,
          answer,
          wrong: [
            [m.typical, `That is the number per 100 couples. There are ${grouped(couples)} couples here.`],
            ...(m.perfect !== m.typical ? [[Math.round(m.perfect * couples) / 100, 'That uses the perfect-use figure. The question gives the typical-use figure, which is the one that describes real life.']] : []),
          ].filter(([v], i, all) => v !== answer && all.findIndex(([w]) => w === v) === i),
          hints: [`${grouped(couples)} is ${couples / 100} lots of 100.`],
          explain: `
            ${grouped(couples)} couples are ${couples / 100} groups of 100, and each group of
            100 has about ${m.typical}: ${couples / 100} × ${m.typical} = **${answer}**.

            A small-sounding rate still means real pregnancies when many
            people use a method, and a large-sounding one still means that
            most couples did not have one.
          `,
        };
      },
    },
    {
      id: 'teach-how-methods',
      type: 'info',
      title: 'How they work',
      text: `
        Contraceptives prevent pregnancy in a few different ways.

        | How it works | Methods |
        |---|---|
        | **Barrier**: physically keeps sperm from the egg | ${methodsIn('barrier')} |
        | **Hormones**: the cycle's own hormones, used to stop the egg being released | ${methodsIn('hormonal')} |
        | **Neither of these** | ${methodsIn('neither')} |

        A diaphragm is a soft dome that covers the entrance of the uterus.
        The copper IUD has no hormones and is not a barrier: copper stops
        sperm from working. Withdrawal is a behaviour, not a device or a
        medicine.
      `,
    },
    {
      id: 'group-methods',
      type: 'bucket',
      title: 'How they work',
      text: `
        **Sort these methods by how they work.**
      `,
      buckets: ['Barrier: keeps sperm from the egg', 'Hormones: stop the egg being released', 'Neither of these'],
      items: METHOD_GROUPS.map(([text, group]) => ({
        text,
        bucket: ['barrier', 'hormonal', 'neither'].indexOf(group),
        why: text.startsWith('Copper') ? 'The copper IUD contains no hormones and is not a barrier: copper stops sperm from working.' : text === 'Withdrawal' ? 'Withdrawal is a behaviour, not a device or a medicine, and its typical-use failure rate is high.' : undefined,
      })),
      explain: `
        **Hormonal** methods use the hormones you met in lesson 6. As well
        as stopping ovulation, they thicken the mucus at the entrance of
        the uterus.

        There is also **emergency contraception**: pills, or a copper IUD
        fitted by a clinician, that can prevent most pregnancies if used
        within ${FERTILITY.ecDays} days after unprotected sex. Sooner is better. It
        prevents a pregnancy from starting; it does not end one.
      `,
    },
    {
      id: 'only-condoms',
      type: 'choice',
      review: true,
      text: `
        Contraception is about pregnancy. But sex can also pass
        **infections** from one person to another. **Which of these
        methods also reduces the risk of infection?**
      `,
      options: [
        { text: 'Condoms', correct: true },
        { text: 'The pill', why: 'The pill changes hormones. It does nothing to stop microbes passing from one person to another.' },
        { text: 'The implant or the IUD', why: 'Both are excellent at preventing pregnancy, and neither is a barrier to microbes.' },
        { text: 'All of them, a little', why: 'Only a physical barrier between two people reduces the passing of infections.' },
      ],
      explain: `
        Only **condoms** (external or internal) do both jobs, because they
        are a barrier. They greatly reduce the risk of infections,
        including HIV, though not to zero. That is why condoms are often
        used together with a second method: one mainly for pregnancy, one
        for infection.
      `,
    },
    {
      id: 'teach-stis',
      type: 'info',
      tone: 'sober',
      title: 'Infections: what is known',
      text: `
        Sexually transmitted infections (STIs) are common, and nothing to
        be ashamed of. One contact with one person who has an infection
        is enough.

        - **Many are silent.** Chlamydia, for example, causes no symptoms
          in most people who have it. A test is the only way to know.
        - **Most can be cured or treated.** Chlamydia, gonorrhoea and
          syphilis are caused by bacteria and are cured with antibiotics.
          Untreated, they can do lasting harm.
        - **Some can be prevented by a vaccine.** HPV causes almost all
          cervical cancer and some other cancers. The HPV vaccine works
          best given before any exposure.

        And, as lesson 4 said of HIV: treatment that keeps the virus
        undetectable also stops it being passed on through sex.
      `,
    },
    {
      id: 'sti-facts',
      type: 'bucket',
      tone: 'sober',
      review: true,
      title: 'Infections: what is true?',
      text: `
        Sexually transmitted infections (STIs) are common: more than a
        million curable ones are caught every day worldwide. **Which of
        these statements are true?**
      `,
      buckets: ['True', 'False'],
      items: STI_FACTS.map(([text, ok, why]) => ({ text, bucket: ok ? 0 : 1, why })),
      explain: `
        Testing, not looking or feeling, is how anyone knows. Early
        treatment prevents lasting harm. And **vaccines** against HPV and
        hepatitis B prevent infections that can cause cancer.

        HIV today: daily treatment keeps people with HIV well for a
        near-normal lifespan and, once the virus is undetectable, stops it being
        passed on through sex. People at risk can also take medicine that
        prevents infection (PrEP).
      `,
    },
    {
      id: 'consent',
      type: 'bucket',
      tone: 'sober',
      title: 'Consent',
      text: `
        Everything in this lesson assumes one thing: that both people
        **want** what is happening. Agreement to sexual activity is called
        **consent**. It is a clear yes from someone able to give one. It
        must be freely given, specific and informed, and it can be
        withdrawn at any time.

        **Which of these is consent?**
      `,
      buckets: ['Consent', 'Not consent'],
      items: CONSENT_CASES.map(([text, ok, why]) => ({ text, bucket: ok ? 0 : 1, why })),
      explain: `
        Only a free, clear yes, from someone able to give it, to this
        thing, now. No one ever owes anyone sex, and anyone may say no or
        stop at any point, whatever came before. Laws add an **age of
        consent**, which differs between countries.

        Sexual activity without consent is assault, and it is **never the
        fault of the person it was done to**. If it has happened to you
        or to someone you know, help exists, and telling someone you
        trust can be the first step:

        ${ASSAULT_HELP.map((line) => `- ${line}`).join('\n        ')}
      `,
    },
    {
      id: 'where-to-go',
      type: 'choice',
      gen: (rng) => {
        const [story, service, why] = rng.pick(SERVICE_CASES);
        const whyNot = {
          ec: 'That is the place for emergency contraception, which is not what is needed here.',
          test: 'A test for infections is not what this situation calls for first.',
          choose: 'Comparing methods for the future can wait; this situation needs something else first.',
          wait: 'Waiting helps nobody here: this is exactly what these services are for.',
        };
        return {
          text: `
            Health services deal with these questions every day, in
            confidence. An example:

            *${story}*

            **What is the best first step?**
          `,
          columns: 1,
          options: Object.entries(SERVICES).map(([key, text]) => ({ text, correct: key === service, why: key === service ? undefined : whyNot[key] })),
          explain: `
            ${why}

            What is available, what it costs, and the age at which a young
            person can use a service without a parent differ from country
            to country. A doctor, a pharmacist or a national health
            website can say what applies where you live.
          `,
        };
      },
    },
    {
      id: 'try-this',
      type: 'info',
      title: 'One thing worth knowing in advance',
      text: `
        Most people look for a sexual health service for the first time
        when they suddenly need one. It is easier the other way round.

        If you like, take two minutes this week to **find out where the
        nearest confidential service is**: a clinic, a pharmacy, a family
        doctor. You may never need it. Someone you know might.

        That is the end of this course: nerves and senses, hormones,
        defences, muscles and bones, and a whole life from one cell.
      `,
      cta: 'Finish the course',
    },
  ],
  recap: [
    `Pregnancy can only start in a **fertile window** of about ${FERTILITY.windowDays} days around ovulation, and its timing cannot be known in advance.`,
    'Every method has two figures: **perfect use** (the method) and **typical use** (the method plus real life). Methods with nothing to remember have almost no gap.',
    'Only **condoms** also reduce the risk of infections. Many infections cause no symptoms, most are curable or treatable, and testing is how anyone knows.',
    '**Consent** must be freely given, specific and informed, and it can be withdrawn at any time. Confidential help exists; services and laws differ by country.',
  ],
  next: 'You have finished The Body II. You now know how the body is supplied, controlled, defended and moved. The next course, Food and Nutrition, asks what to feed it, and what the evidence really says.',
};
