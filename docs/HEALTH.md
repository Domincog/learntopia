# Writing and correcting health, money and psychology lessons

The courses in the **Health & the Body** path teach how the body works and what is known about keeping it well. People act on health information, so these lessons follow stricter rules than the rest of the site. Everything in [AUTHORING.md](AUTHORING.md) still applies; this page adds the rules that are specific to health. A correction that breaks one of them will not be merged, however well meant.

The lessons are general education. They are not personal medical advice, and nothing in them may read as if it were.

## Accuracy

- **Follow the current mainstream consensus**: physiology textbooks, the World Health Organization, national bodies (NHS and NICE, CDC and NIH, and their counterparts elsewhere), the guideline bodies of the field (AHA, ESC, ILCOR, ERC and the Red Cross for resuscitation and first aid; EFSA and national dietary guidelines; AASM for sleep) and Cochrane reviews.
- **Name the source and its year** for every figure, in a comment in the course's `helpers.js` fact tables, and in the lesson text when the number is the point. Guidance changes: check that you are quoting the current edition.
- **Where authorities differ, say so**, and never make a contested threshold the answer of a graded step. Blood-pressure categories, alcohol guidance, screening ages and burn-cooling times all differ between countries; the lessons show them side by side.
- **Be honest about the strength of evidence.** A single study is not settled knowledge; a settled finding should not be hedged into mush. Do not overclaim for supplements, diets, gadgets or "wellness" practices, and do not underclaim well-established risks (tobacco, alcohol, high blood pressure) or benefits (vaccination, physical activity).
- **A teaching model is labelled as one.** The simulators simplify (a cartoon training curve, a glucose loop with rounded constants). The lesson says what the model leaves out, and no made-up number is presented as a measurement.
- Each health course has a test file, `tests/<course>-course.test.mjs`, with an independent table of the facts the lessons rely on and assertions for the safety wording below. Extend it with every change.

## Safety and care

- **No diagnosis, no prescribing.** Never tell the learner what they have, or to start, stop or change a medicine, supplement, diet or treatment. Describe what a named body advises for a named group, and who to ask ("a pharmacist can tell you…"). Doses appear only as examples of how to read a label. Never discourage anyone from seeking care.
- **Red flags are stated plainly.** Wherever a lesson mentions a symptom that needs urgent help (chest pain, signs of a stroke, trouble breathing, a severe allergic reaction, thoughts of suicide, a seizure that does not stop), it says that this is a "call your emergency number" situation.
- **The standard note.** The first lesson of each health course carries this callout once, word for word, on its first or second step:
  `> **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.`
- **Never ask for the learner's own health data.** No step asks for their weight, height, age, blood pressure, food intake, cycle, symptoms, mood, medicines or history, and no step scores or labels them. Calculations are done for named example people. An optional self-observation (taking a pulse) is never recorded or judged. A reflection prompt about the learner's own life uses `personal: true`.
- **Bodies, weight and food.** Neutral, kind language. No ideal or target weights, no weight-loss goals, no calorie-counting or restriction drills, no "good food / bad food / clean / guilt-free" framing, no exercise as a way of "earning" or "burning off" food. BMI is taught as a population screening tool with its limits. Eating disorders are mentioned with respect and a pointer to help, and without numbers or methods that could act as tips. Health is shaped by many things outside a person's control, and the lessons say so.
- **Mental health.** Person-first, non-judgemental language ("a person with depression", "died by suicide"). No questionnaire that scores the learner. Whenever suicide or self-harm is mentioned, follow the WHO safe-messaging guidance: no method and no detail, never presented as a solution or as common, always with the facts that help works and people recover, and always with pointers that work internationally (the local emergency number, a few crisis lines each named with its country, and findahelpline.com). Verify every telephone number on the organisation's own page before it goes in, and again whenever you touch the step.
- **Substances.** Accurate, non-moralising, no instructions for use. Addiction is described as a health condition, and help is named.
- **Sexual and reproductive health.** Clinical, matter-of-fact and inclusive, written for readers of about 13 and up: correct anatomical names, schematic diagrams only, no assumptions about the learner, consent explained plainly, typical-use figures for contraception, and a note that services and laws differ by country.
- **First aid.** Teach only what current lay-rescuer guidelines teach, in their order, and check every procedure against at least two guideline bodies in their latest editions. Calling the emergency number comes first. Where bodies differ, teach the shared core and say that they differ. Reading is not the same as practising: the course says so and sends the learner to a hands-on class.
- **Tone.** Warm, respectful, never preachy, alarmist or jokey about illness. Steps about death, serious illness, a person in danger, suicide or abuse carry `tone: 'sober'` (see [AUTHORING.md](AUTHORING.md#fields-every-step-shares)), which removes the cheering, the mascot and the points flourish.

## Pictures and diagrams

- Anatomy is drawn with the `body-map` widget ([BODY.md](BODY.md)). The figure faces the viewer, and left and right are always the person's own.
- Photographs follow [IMAGES.md](IMAGES.md), with extra care: no wounds or gore, no nudity, no identifiable patients, no before-and-after or body-shaming imagery, and no picture that works as an advertisement for a product.

## Money and psychology lessons

Two other courses carry rules of the same kind, because readers act on what they say.

**Money** (`content/courses/money`):

- **No advice, no recommendations, no forecasts.** The lessons explain how pay, tax, debt, saving, insurance and investing work. They never tell the learner what to buy, sell, borrow or sign up for, never recommend a named product, fund, company, bank, platform or coin, and never predict markets, rates or prices. Evidence is reported as evidence ("most actively managed funds trailed their benchmark over twenty years"), and rules of thumb are called rules of thumb, with their caveats.
- **Written for any country.** Amounts use "$" as a stand-in for any currency. Graded questions use an invented country's tax bands and example rates; real systems appear only in ungraded comparison tables that name the country and the year. Deposit-protection limits, regulators' names and helpline numbers change: verify them on the organisation's own page whenever you touch them.
- **Never the learner's own finances.** No step asks for their income, savings, debts, spending or rent. All sums are done for example people, and those people include some on low and irregular incomes for whom the textbook advice is out of reach.
- **No shame and no hype.** Debt, low income and past mistakes are discussed without judgement; no "anyone can be rich". Steps about problem debt, fraud losses and gambling carry `tone: 'sober'` and name free, independent help, each service with its country.
- **The arithmetic is exact**, states its rounding, and is re-derived by a different route in the course's test file. Simulators say what they assume and never present an assumed return as a forecast.

**Psychology** (`content/courses/psychology`):

- **Tell each study as it was**, with its numbers and its replication status. Do not teach as established anything that failed to replicate, and correct the popular legend where it is wrong.
- **The learner takes part, and is never scored or labelled.** Demonstrations show what most minds do; they work for someone who is not fooled, and nothing returns a personality type, an intelligence score or a diagnosis. Where a demonstration depends on not saying in advance what it is about, the next screen explains what was done and why.
- **People and groups.** No stereotypes, no claims about innate differences in intelligence between groups, nothing that reads as a verdict on anyone's upbringing or parenting. Steps about people or animals harmed in the history of the field carry `tone: 'sober'`.
- Mental disorders belong to the *Sleep, Stress and Mental Health* course and to the rules above.

## Review

Every health course in this repository was written by one author and then checked line by line by a separate reviewer against the sources above. Please keep that habit: a change to health content should be read by a second person who checks the claim against a current source, and the pull request should name that source.

Mistakes will still have got through. If you find one, open an issue or a pull request with the source that shows it; corrections to health lessons are the most valuable contributions this project can receive.
