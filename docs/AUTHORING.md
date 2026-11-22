# Writing lessons

This guide covers everything you need to write a course or a lesson: the file layout, the lesson recipe, every step type, text formatting, generated problems and the tools that check your work. Interactive figures have their own guide: [WIDGETS.md](WIDGETS.md).

No build step is involved. A lesson is one JavaScript file that exports a plain object.

## Contents

1. [Quick start](#quick-start)
2. [What a good lesson looks like](#what-a-good-lesson-looks-like)
3. [Voice and style](#voice-and-style)
4. [Files](#files)
5. [Text formatting](#text-formatting)
6. [Images](#images)
7. [Fields every step shares](#fields-every-step-shares)
8. [Step types](#step-types)
9. [Generated problems](#generated-problems)
10. [Review steps](#review-steps)
11. [Checking your work](#checking-your-work)
12. [Pre-flight checklist](#pre-flight-checklist)

---

## Quick start

```bash
node tools/serve.mjs                              # http://localhost:8080
```

1. Create `content/courses/<course-id>/lessons/<lesson-id>.js` (copy an existing lesson as a template; `content/courses/algebra/lessons/keeping-the-balance.js` is a good one).
2. List the lesson in `content/courses/<course-id>/course.js`.
3. Preview it without touching your saved progress: `http://localhost:8080/#/dev/lesson?course=<course-id>&lesson=<lesson-id>` (add `&step=5` to jump to step 5).
4. Check it:

```bash
node tools/validate.mjs --lesson <course-id>/<lesson-id>
```

```bash
node tools/smoke.mjs --lesson <course-id>/<lesson-id> --shots /tmp/shots
```

`#/dev/steps` plays a sample lesson containing every step type (source: `src/dev/samples.js`).

---

## What a good lesson looks like

A lesson teaches **one idea** in 12–18 short steps and takes 8–12 minutes. Its backbone is **teach, then ask**: the learner is shown each new thing before being asked to use it, and is asked to use it straight away.

| # | Phase | What happens | Typical step |
|---|-------|--------------|--------------|
| 1 | **Hook** | One concrete, slightly surprising question that the lesson will answer. It is a guess, clearly labelled as one, and never marked wrong. | `choice` or `slider` with `mode: 'predict'` |
| 2 | **Teach** | Show the idea: a short explanation with a picture, a worked example, or something the learner operates and watches. One idea per screen, a few sentences. | `info` (with a `figure` wherever one helps), or an ungraded `interact` |
| 3 | **Check** | Straight after each teaching screen, one or two questions that can be answered from what was just shown, but need a moment's thought: apply it to a new case, do not recite it. | anything graded |
| 4 | **Repeat 2 and 3** | The next idea, taught and checked the same way. Most lessons have three to six teach-and-check rounds. | |
| 5 | **Practise** | Questions that mix the lesson's ideas and climb in difficulty. Start supported (the figure still visible, a hint available), then remove support. | anything graded, often generated |
| 6 | **Stretch** | One harder problem that needs the idea in a new setting. | any, with `stretch: true` |
| 7 | **Consolidate** | Have them put it in their own words, or sort or match the key cases. Then the recap. | `reflect`, `bucket`, `match` |

### Teach before you ask

This is the rule that most separates a lesson from a quiz:

> **A graded step may only ask for what the learner has already been shown**: in the stated prerequisites of the course, in an earlier lesson of the course, or earlier in this lesson (a teaching screen, something they explored, or the explanation that followed an earlier step).

How to keep it:

- **Read your lesson as a beginner.** `node tools/outline.mjs <course>/<lesson>` prints the lesson as the learner meets it: what is SHOWN before each question, what is ASKed, and what is only revealed AFTER the answer. Go down the list and, for every graded step, point to the place above it where the needed fact, term, method or picture was shown. If you cannot, add a teaching screen before it.
- **Facts and vocabulary are taught on an `info` screen first**: the four parts of the blood and what each does, with a picture, *then* the matching question. A `match`, `bucket`, `order` or `choice` about things the lesson has not presented is a guessing game, however good its explanation afterwards.
- **Procedures get a worked example first**: the same kind of problem, solved line by line with the reason for each line (`:::example` is made for this), *then* a problem for the learner with different numbers. For a longer method, follow it with a half-worked example where the learner supplies the last step.
- **Explanations after an answer confirm and extend; they are not where an idea first appears.** If the `explain` of a step is the first time the learner hears something, move that something in front of the step.
- **A prediction is the one place to ask before teaching**, and it is marked as a guess (`mode: 'predict'`). Use it once, as the hook, occasionally twice. It is not a way of introducing every idea.
- **Earlier lessons count, memory fades.** If a step depends on something from two lessons ago, remind the learner in a sentence.
- **Teaching is not a wall of text.** A teaching screen is short (about 40 to 90 words), has one idea, and usually has a figure: a labelled diagram, an animation to step through, a table, a worked example, a simulator to try. Never three `info` screens in a row: check each idea before the next.

The validator warns when a lesson has a graded step before any teaching, or fewer than three teaching screens. It cannot judge whether the right things were taught: the read-through with `tools/outline.mjs` does that.

### The other principles

Each is supported by a large body of research; see [LEARNING-SCIENCE.md](LEARNING-SCIENCE.md).

- **Show, then ask, then ask again later.** Beginners learn a new idea best from a clear explanation and a worked example; they make it stick by retrieving and using it. A lesson needs both, in that order.
- **Active on every screen.** Teaching screens have something to look at closely or operate, and are followed at once by a question. The learner is never reading for long.
- **Concrete before abstract.** A scale before an equation. Dice before a formula. Then fade the picture out.
- **One new thing at a time.** If a step needs two new ideas, it is two steps.
- **Feedback that teaches.** Every graded step has an `explain`. Wrong options that correspond to a real misconception say *why* they are wrong (`why`).
- **Aim for about 85% success.** If nearly everyone gets everything right first time, it is too easy to be memorable; if most answers are wrong, it is demoralising, and usually means something was asked before it was taught. Hints are how you tune this.
- **Vary the surface.** Change numbers, contexts and formats so the learner practises the idea rather than a pattern. Use `gen` for numeric practice.
- **No trick questions.** Difficulty should come from the idea, never from wording or from missing knowledge.

Avoid: walls of text, three `info` steps in a row, graded questions about things not yet taught, questions that only test recall of the previous screen's wording, "All of the above", jokes that need cultural context, and anything that makes a learner feel stupid.

**Keep each step to one screen.** A learner should see the question and the thing they work with at the same time, without scrolling. You do not lay anything out yourself: on a wide screen the player puts the text on the left and the figure or interactive on the right, and on a phone it stacks them. What you control is how much there is. A step that needs a long explanation *and* a big interactive is two steps. The smoke test lists every step that needs scrolling on a laptop; keep that list short.

---

## Voice and style

- Talk to one person: "you", present tense, short sentences. Friendly, never cute.
- Plain words. Introduce a technical term only when the learner already has the idea it names, and **bold** it once.
- Step `text` is usually 1–3 short paragraphs. If it needs scrolling on a phone, cut it.
- A step `title` is optional. Use one for a new phase ("Now fight back"), not for every question.
- Feedback is about the work, not the person: "That adds the same amount each time" rather than "Wrong!". Praise is generated by the player; do not write your own "Great job!".
- `explain` says **why the right answer is right** in 1–3 sentences, ideally showing the working. It appears whether the learner was right or wrong.
- `hints` go from a gentle nudge to nearly the answer. Two is typical; three for hard steps.
- Use real-world numbers that are true. If you cite a study or a fact, be accurate and keep it general enough to be defensible.
- Use metric units, and avoid culture-specific references (sports rules, holidays, currencies) where a neutral one works.
- British or American spelling are both fine; be consistent within a course.

---

## Files

```
content/
  index.js                       the catalog: categories + the list of courses
  kit.js                         helpers for authors (r, frac, linear, numberOptions …)
  media.js                       photo(): a picture from a course's media folder as a figure
  media/<course-id>/             the course's pictures with their credits (written by tools/fetch-image.mjs)
  courses/<course-id>/
    course.js                    title, description, chapters and the lesson list
    lessons/<lesson-id>.js       one lesson
```

Ids are lowercase words joined by dashes (`rate-of-change`). **Never rename a published lesson id or a review step's id**: learners' progress is stored under them.

### course.js

```js
export default {
  id: 'algebra',                          // must match the folder name
  title: 'Algebra Foundations',
  tagline: 'Find the unknown by keeping things balanced.',   // one line, shown on cards
  category: 'math',                       // a category id from content/index.js
  level: 'Beginner',                      // Beginner | Intermediate | Advanced
  color: 'blue',                          // blue red green orange violet teal pink yellow gray
  cover: 'balance',                       // illustration key from src/ui/covers.js
  requires: ['arithmetic'],               // optional: ids of courses this one builds on (shown as "Builds on")
  description: 'Two or three sentences for the course page.',
  outcomes: ['Solve one-step, two-step and both-sides equations', '…'],   // 3–5, each completes "you will be able to…"
  chapters: [
    {
      title: 'The balance',
      lessons: [
        { id: 'keeping-the-balance', title: 'Keeping the Balance', summary: 'One sentence shown in the lesson list.', minutes: 8 },
      ],
    },
  ],
};
```

Covers available: `balance shapes dice curve primes logic bars code motion chart network memory chip flask growth wave integral bell interval matrix blocks tree layers proof orbit globe pyramid compass ship factory landmarks heartbeat neuron apple runner moon shield firstaid mind coins puzzle`.

### Levels, prerequisites and learning paths

Nothing in Learntopia is ever locked, but learners should be able to see what comes first and what comes next.

- `level` says how demanding a course is. A **Beginner** course assumes nothing. An **Intermediate** or **Advanced** course is a follow-on: it lists what it builds on in `requires`, and its lessons may use the ideas, words and widgets of those courses without re-teaching them (reconnect in a sentence, then move on).
- `requires` is advice, not a gate. The course page shows it as "Builds on", with a tick next to the courses the learner has finished, and the home page suggests a course once everything it requires is done.
- A **learning path** strings courses together from first steps to advanced. Paths live in `content/index.js`:

```js
export const paths = [
  { id: 'math', title: 'Mathematics', color: 'blue', icon: 'sigma',
    blurb: 'From balancing an equation to the working toolkit of calculus.',
    courses: ['algebra', 'geometry', 'functions', 'trigonometry', 'calculus', 'calculus-2'] },
];
```

A course belongs to at most one path. The catalog opens on the paths, each course page says where the course sits in its path and links to the next one, and finishing the last lesson of a course offers the next course. When you add a follow-on course, add it to a path (or start a new one) and make sure it does not come before anything it requires. The validator checks all of this.

### A lesson file

```js
// Algebra Foundations · Lesson 1 · Keeping the Balance
import { r } from '../../../kit.js';

export default {
  id: 'keeping-the-balance',     // must match the file name
  steps: [ /* 12–18 steps, see below */ ],
  recap: [                       // 3–4 takeaways shown on the summary screen (markdown allowed)
    'An equation says two things weigh the same.',
  ],
  next: 'Next: what if the box is wrapped in *two* operations at once?',   // optional teaser
};
```

Helpers used only by one course can live in `content/courses/<course-id>/helpers.js`.

---

## Text formatting

All text fields (`text`, `explain`, `hints`, option text, `why`, `recap` …) accept a small Markdown dialect with TeX math.

| You write | You get |
|-----------|---------|
| `**bold**`, `*italic*` | **bold**, *italic* |
| `==highlight==` | a highlighter-pen mark |
| `` `code` `` | inline code |
| `$x^2 + 1$` | inline math (KaTeX) |
| `$$ \frac{a}{b} $$` | display math on its own line |
| `[text]{.blue}` | coloured text (blue red green orange violet teal pink yellow gray) |
| `$\blue{x} + \orange{3}$` | coloured math, same colour names |
| `\$5` | a literal dollar sign |
| `- item` / `1. item` | lists (indent two spaces to nest) |
| `> quote` | block quote |
| a line ending in two spaces | line break |
| `[label](https://…)` or `[label](#/courses)` | link |

Blocks:

````
:::tip            (also: note, key, warn, example, think, fun — optional custom title after the word)
One short idea.
:::

| Step | Value |
|------|------:|
| 1    | 3     |

```python
print("code block with highlighting: python, js, pseudo")
```
````

Use colour to tie words to parts of a figure: if the rise is drawn in red, write `[rise]{.red}`.

### The one rule that will bite you: use `r` for strings with TeX

In a normal JavaScript string a backslash starts an escape, so `'\frac{1}{2}'` silently becomes a form-feed character followed by `rac{1}{2}`. Tag such strings with `r` (it is `String.raw`):

```js
import { r } from '../../../kit.js';

text: r`The slope is $\frac{\text{rise}}{\text{run}}$.`          // correct
text: 'The slope is $\frac{\text{rise}}{\text{run}}$.'           // broken
```

Interpolation works as usual inside `r` strings: ``r`Solve $${a}x = ${a * x}$` `` (the first `$` opens math, `${a}` inserts the value). The validator catches eaten backslashes and TeX that does not compile.

Text can be indented to match your code; common leading whitespace is removed.

---

## Images

Lessons can show photographs and artworks: as a figure, as the pictures of a "which of these is…?" question, or as a picture the learner taps a part of. They come from Wikimedia Commons through one tool, which checks the licence, resizes the file and records the credit:

```bash
node tools/fetch-image.mjs --search "angkor wat reflection"
node tools/fetch-image.mjs --course <course-id> --id angkor-wat --title "File:Angkor Wat with its reflection (cropped).jpg"
```

```js
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/<course-id>/index.js';

figure: photo(MEDIA['angkor-wat'], { alt: 'A wide stone temple with towers shaped like lotus buds, mirrored in a pond', caption: 'Angkor Wat, Cambodia' })
```

The rules in one breath: pictures are added **only** with that tool (never copied in by hand, never linked from another site); every photo needs an `alt` that says what can be seen; a picture must be something a question or an explanation refers to, never decoration; about four per lesson at most. **[IMAGES.md](IMAGES.md)** has the whole story: finding files, the licence allow-list, alt text and captions, photo options and hotspots, and how to be a polite client of Wikimedia.

History lessons also have a [`timeline`](WIDGETS.md#timeline) figure (explore it, pick from it, or drag events onto it), and anything with a *where* can use the `world-map` widget: highlighted countries, markers, routes, and graded steps where the learner picks a country or drops a pin. **[MAPS.md](MAPS.md)** is its guide.

Health and biology lessons have the `body-map` widget: the body's systems and organs, the head, the heart, the airways, the skin and a cell, as pictures to read or as graded steps where the learner taps a structure or places a marker. **[BODY.md](BODY.md)** is its guide.

Health, money and psychology lessons follow stricter rules on sources, safety wording and review than the rest of the site. Read **[HEALTH.md](HEALTH.md)** before you change one.

---

## Fields every step shares

| Field | Type | Meaning |
|-------|------|---------|
| `type` | string | **Required.** One of the step types below. |
| `id` | string | Unique within the lesson. Required for review steps; otherwise defaults to `s1`, `s2`… Give meaningful ids anyway: they appear in tool output. |
| `text` | markdown | The question or instruction. Required for every type except `info` with only a figure. |
| `title` | string | Optional heading above the text. |
| `figure` | widget spec or array | One or more figures shown between the text and the answer area. See [WIDGETS.md](WIDGETS.md). Give each an `alt` for screen readers. |
| `hints` | markdown[] | Graduated hints, revealed one at a time on request. |
| `explain` | markdown | Shown after the step is resolved, right or wrong. |
| `mode: 'predict'` | | A guess before teaching. Never marked wrong, one attempt, the answer and `explain` are then shown. A predict-mode `choice` with *no* correct option is an opinion poll ("How well do you think you understand…?"). |
| `graded: false` | | An activity with a completion check that does not count toward accuracy (explorations, experiments). |
| `stretch: true` | | Marks a challenge problem (small XP bonus, "Challenge" badge). |
| `review: true` | | Save this step for spaced review. See [Review steps](#review-steps). |
| `attempts` | number | Tries before the answer is shown. Defaults: `choice` 2 (1 with only two options), `multi` 2, `interact` 4, others 3. |
| `gen` | function | Generates fields at run time. See [Generated problems](#generated-problems). |
| `tone` | `'sober'` | For steps about war, slavery, genocide and other atrocities, and in health lessons for steps about death, serious illness, a person in danger, suicide or abuse: feedback is worded plainly ("That is right."), with no cheering, no streak flame and no mascot. Set `tone: 'sober'` on the **lesson** (next to `steps`) to apply it to every step and to end the lesson without confetti. Review cards keep the tone when they come back weeks later. |

What the learner experiences on a graded step: they answer and press **Check**. If wrong, they see targeted feedback (if you wrote any), may open hints, and try again. When attempts run out, or they press **Show answer**, the correct answer and `explain` appear. Anything not answered correctly first time returns once at the end of the lesson as a "second look".

---

## Step types

### `info` — explain or explore

```js
{ id: 'idea', type: 'info', title: 'An equation is a balanced scale',
  text: r`The equals sign means **the two sides weigh the same**. $$ \blue{x + 3} = \orange{8} $$`,
  figure: { type: 'balance', static: true, left: { x: 1, ones: 3 }, right: { x: 0, ones: 8 }, xValue: 5, alt: '…' },
  cta: 'Got it' }                       // optional button label (default "Continue")
```

Keep these short, and never put three in a row.

### `choice` — pick one

```js
{ id: 'which-move', type: 'choice',
  text: r`To get $x$ alone in $x + 6 = 15$, what should you do to **both sides**?`,
  options: [
    { text: 'Subtract 6', correct: true, why: r`That removes the $+6$ and leaves $x = 9$.` },
    { text: 'Add 6', why: r`That gives $x + 12 = 21$: still balanced, but no simpler.` },
    { text: 'Divide by 6', why: 'Division undoes multiplication. Here 6 is being *added*.' },
  ],
  explain: r`To undo "plus 6", subtract 6 from both sides.` }
```

- Mark the right option with `correct: true`, or give `answer: <index>` on the step and write options as plain strings.
- `why` is the feedback shown when *that* option is chosen. Write one for every wrong option that reflects a real misconception.
- Options are shuffled unless `shuffle: false` (use that for ordered options such as numbers in sequence, or True/False).
- Short options are laid out in two columns automatically; force with `columns: 1`.
- An option may have a `figure` (a small read-only widget) instead of, or as well as, `text`. With picture options leave `text` empty or set `shuffle: false`, because the letters A–D are assigned after shuffling. Photographs as options (`figure: photo(MEDIA[…], { alt })`) are laid out as a grid of cards; see [IMAGES.md](IMAGES.md#as-answer-options).
- 3–4 options is ideal. Every wrong option should be something a real learner might think.

### `multi` — pick all that apply

Same as `choice`, with one or more options marked `correct: true` (or `answers: [0, 2]`). The learner must select exactly the correct set.

### `numeric` — type a number

```js
{ id: 'solve-add', type: 'numeric',
  text: r`Solve for $x$: $$ x + 7 = 19 $$`,
  answer: 12,                       // a number, or a string expression like '3/4' or 'sqrt(2)'
  prefix: '$x =$',                  // shown before the box
  unit: 'cm',                       // shown after the box (the learner does not type it)
  tolerance: 0.01,                  // absolute; omit for exact answers
  accept: [12.5],                   // other acceptable values
  display: '12',                    // optional: what is shown when the answer is revealed (default: the answer, up to 6 decimals)
  wrong: [[26, 'You added 7. To undo "plus 7", subtract it.']],   // feedback for anticipated wrong answers
  feedback: (value) => (value < 0 ? 'A length cannot be negative.' : null),   // optional, for anything else
  hints: ['What undoes "plus 7"?'],
  explain: r`Subtract 7 from both sides: $x = 19 - 7 = 12$.` }
```

An entry of `wrong` matches when the learner's value is within the step's `tolerance` of it, exactly as the answer does, and the answer is checked first. So with a generous tolerance, make sure no listed slip lies within two tolerances of the answer, or its message will never be seen (and a slip that equals the answer is dropped).

Learners may type decimals, fractions (`3/4`), mixed numbers (`1 1/2`), simple arithmetic (`2^5`) and a comma or point as the decimal mark. Set a `tolerance` whenever the answer is a rounded decimal, and say in the text how to round. With `unit: '%'` the learner types `25`, not `0.25`.

Because simple arithmetic is accepted, "What is $2^{-3}$?" could be answered by typing `2^-3`. When the question *is* the arithmetic, add `plain: true`: only a finished number (a decimal, a fraction or a mixed number) is then accepted, and anything else is sent back without using up an attempt.

### `short` — type a word or phrase

```js
{ type: 'short', text: 'What do we call a polygon with exactly five sides?',
  answers: ['pentagon', /^a pentagon$/i],       // strings (compared ignoring case, spacing, end punctuation) or RegExps
  wrong: [['hexagon', 'A hexagon has six sides.']] }
```

Use sparingly: only when there is one obvious word. Prefer `choice` if spelling could get in the way.

### `expr` — type an algebraic expression

```js
{ type: 'expr', text: r`Expand $(x + 2)(x + 5)$.`,
  answer: 'x^2 + 7x + 10', vars: ['x'],          // any equivalent form is accepted
  prefix: '$y =$',
  wrong: [['x^2 + 10', 'Do not forget the two middle terms.']] }   // matched by equivalence too
```

Equivalence is checked numerically, so `2(x+3)` and `2x+6` are both accepted. The learner sees a typeset preview as they type.

That also means "Expand $(x + 2)(x + 5)$" could be answered by typing the question back. Add `expanded: true` to such a step: an answer that still contains brackets is sent back with a note, without using up an attempt. For any other *particular form* (factored, simplified), use `choice` or `fill` instead.

### `order` — put in sequence

```js
{ type: 'order', text: 'Put these fractions in order, smallest first.',
  items: [r`$\frac{1}{8}$`, r`$\frac{1}{4}$`, r`$\frac{1}{2}$`],   // written in the CORRECT order; shown shuffled
  labels: ['Smallest', 'Largest'] }                                   // optional captions above and below
```

With `code: 'python'` (or `'js'`, `'pseudo'`) the items are shown as code lines, which makes a **Parsons problem**: an efficient way for beginners to practise program structure without syntax errors. Keep indentation in the strings. 4–6 items is ideal. Keep each line under about 30 characters, indentation included: longer lines do not fit a phone screen, and the smoke test will say so.

### `match` — pair things up

```js
{ type: 'match', text: 'Match each equation with the move that gets $x$ alone.',
  pairs: [[r`$x + 5 = 20$`, 'Subtract 5'], [r`$5x = 20$`, 'Divide by 5'], [r`$x - 5 = 20$`, 'Add 5']] }
```

Left items stay in place; right items are shuffled. 3–5 pairs. Left items must be unique.

### `bucket` — sort into groups

```js
{ type: 'bucket', text: 'Sort the numbers.',
  buckets: ['Even', 'Odd'],
  items: [['12', 0], ['7', 1], ['30', 0], ['45', 1]] }     // [text, bucket index]; or { text, bucket, why }
```

2–3 buckets, 5–8 items. Good for telling categories apart (the heart of interleaving).

### `fill` — fill in the blanks

```js
{ type: 'fill', text: 'Complete the solution of $x - 4 = 9$:',
  template: r`Add [[4]] to both sides, so $x =$ [[13]].` }
```

- `[[13]]` is a typed blank. Numbers are compared as numbers (`13.0` is fine); text ignores case. `[[colour;color]]` accepts either.
- `[[a|*b|c]]` is a dropdown; the starred option is correct.
- Typed blanks accept simple arithmetic, like `numeric` steps. Add `plain: true` to the step when a blank must hold a finished number (so that `2^-3` is not an answer to "what is $2^{-3}$?").
- Blanks work inside code blocks, which is ideal for "complete the program" steps. They cannot go *inside* `$…$`; close the math, place the blank, reopen it.

### `slider` — estimate

```js
{ type: 'slider', text: 'Roughly what percentage of new material is forgotten within a day without review?',
  min: 0, max: 100, step: 5, answer: 60, tolerance: 15, unit: '%', start: 0 }
```

For estimates and "about how much?" questions. Wrong answers get "too low / too high" feedback (disable with `directional: false`). Works well with `mode: 'predict'`.

### `interact` — answer by doing

The learner manipulates a widget; you check its state.

```js
{ id: 'isolate', type: 'interact',
  text: r`Here is $x + 3 = 8$. **Remove weights from both sides** until the box sits alone.`,
  widget: { type: 'balance', xValue: 5, left: { x: 1, ones: 3 }, right: { x: 0, ones: 8 }, ops: ['sub1'] },
  check: (s) => s.solved || (s.left.ones > 0 ? 'The box still has company on its pan.' : false),
  solution: { left: { x: 1, ones: 0 }, right: { x: 0, ones: 5 } },
  hints: ['Each press takes one weight from *each* pan.'],
  explain: r`Three weights came off each side: $x + 3 = 8 \longrightarrow x = 5$.` }
```

- `check(state)` receives the widget's state (documented per widget in [WIDGETS.md](WIDGETS.md)). Return `true` when correct; `false` when not; or **a string** — feedback for that particular wrong state. Good checks diagnose: "too steep", "the first review comes too late".
- Instead of `check`, `target: { m: 2, b: -3 }` with optional `tolerance` compares numbers in the state.
- `solution` is a widget state that passes the check. It is shown when the learner gives up, and the smoke test verifies it really passes.
- `auto: true` accepts the answer the moment the state becomes correct (for puzzle-like tasks where pressing Check would be an anticlimax).
- `graded: false` turns it into an exploration with a goal ("add one review anywhere").

### `reflect` — explain in your own words

```js
{ type: 'reflect', text: 'In your own words: why is testing yourself better than re-reading?',
  model: 'Re-reading makes material *feel* familiar… Retrieving it is harder, and that effort strengthens the memory.' }
```

Not machine-graded. The learner writes (or thinks), then compares with your `model` answer and rates themselves. One per lesson at most, usually near the end.

When the prompt is about the learner's own life ("which of these would fit into your week?"), add `personal: true`: the model is then headed "One way to look at it" and the self-rating is left out, because there is no answer to be close to. What the learner types is never stored.

### `code` — write and run a program

Runs real code in the built-in mini-Python interpreter. [CODE-STEPS.md](CODE-STEPS.md) documents the fields, the tests, the two Python widgets (`py-trace`, `py-run`) and the supported language; the Python course (`content/courses/python`) has plenty of examples.

---

## Generated problems

A step with a `gen(rng)` function is re-created with fresh numbers every time it is shown: on a retry, on a "second look", and at each spaced review. This makes the learner practise the *skill* instead of remembering "the answer was 12".

```js
{ id: 'solve-add', type: 'numeric', review: true,
  gen: (rng) => {
    const x = rng.int(3, 19);
    const a = rng.int(2, 15);
    return {
      text: r`Solve for $x$: $$ x + ${a} = ${x + a} $$`,
      answer: x,
      wrong: [[x + a + a, `You added ${a}. To undo "plus ${a}", subtract it.`]],
      hints: [`What undoes "plus ${a}"?`],
      explain: r`Subtract ${a} from both sides: $x = ${x + a} - ${a} = ${x}$.`,
    };
  } }
```

`gen` returns any step fields; they override the static ones. `type`, `id` and `review` must be static.

**Work backwards from the answer.** Pick the answer first, then build the question around it, so the numbers come out clean.

`rng` is seeded, so a variant can be reproduced:

| Call | Result |
|------|--------|
| `rng.int(lo, hi)` | integer, inclusive |
| `rng.nonzero(lo, hi)` | integer, never 0 |
| `rng.intExcept(lo, hi, [a, b])` | integer avoiding some values |
| `rng.step(lo, hi, 0.5)` | multiple of a step |
| `rng.float(lo, hi)` | float |
| `rng.pick(array)` | one element |
| `rng.sample(array, n)` | n distinct elements |
| `rng.shuffle(array)` | shuffled copy |
| `rng.bool(p = 0.5)`, `rng.sign()` | true/false, ±1 |

Helpers in `content/kit.js`: `r`, `num(v)` (tidy number text), `frac(n, d)` (reduced TeX fraction), `signed(b)` (`+ 3` / `- 3`), `term(c, 'x')`, `linear(a, b)` (`2x - 3`), `numberOptions(answer, distractors)` (builds choice options and drops accidental duplicates), `plural`, `ordinal`, `range`, `sum`, `mean`, `median`, `round`, `gcd`, `lcm`, and geometry helpers (`dist`, `angleDeg`, `polygonArea` …).

Vary contexts as well as numbers when you can (`rng.pick` among several stories). The validator runs every generator with many seeds and reports crashes, invalid steps, duplicate options and generators with too little variety.

---

## Review steps

Mark **2–4 steps per lesson** with `review: true`. After the lesson they join the learner's review schedule and come back days, then weeks, later, mixed with steps from other lessons.

A good review step:

- tests the **core idea** of the lesson, not a detail;
- **stands alone**: it will be shown out of context, months later, so it must not say "as we just saw" or depend on an earlier step's figure (it can have its own `figure`);
- has an explicit `id` (required) and an `explain`;
- is generated (`gen`) whenever it is numeric, so it cannot be answered from memory of the number;
- takes under a minute.

`predict`, `reflect`, `info` and `graded: false` steps cannot be review steps.

---

## Checking your work

```bash
node tools/validate.mjs --course <course-id>
```

Checks structure, runs every generator with 20 seeds, compiles every formula, verifies widget names and warns about quality problems (missing `explain`, too few graded or review steps, three `info` steps in a row…). **Fix every error; read every warning.**

```bash
node tools/smoke.mjs --course <course-id> --shots /tmp/shots
```

Plays each lesson in a headless browser at desktop and phone size, presses the real buttons, and fails if a step throws, a formula does not render, something overflows a phone screen, or **a step's own solution is not accepted by its own check**. It also prints two notes that are not failures but should stay empty: "laptop fit" lists steps that need scrolling on a 1366×700 screen before they can be answered, and "phone" lists steps whose display formula is wider than a phone screen (break the formula over two lines or shorten it). `--shots` saves a screenshot of every step before (`-a`) and after (`-b`) answering; add `--mobile` for phone-size screenshots. Look at them. Needs Playwright (`npm install --no-save playwright && npx playwright install chromium`).

```bash
node --test tests/<course-id>-course.test.mjs
```

Every course has a test file that **re-solves its questions independently**. Neither the validator nor the smoke test can tell whether an answer key is *right*; they only check that it is consistent with itself. The course tests close that gap: for each generated step they run a few hundred variants, work the answer out again from the text the learner actually sees (by brute force, or with a different formula than the generator used), and compare. They also check that every listed slip really is wrong, that explanations quote the right numbers, and that each interactive check accepts exactly the states it should. The Python course goes one step further and runs every program in real Python as well, when `python3` is installed.

When you add a lesson, add its generated steps to that file. Write the test from the question's wording, not from your generator's variables, so that a slip in the generator shows up as a failing test instead of a wrong answer in a lesson. Then have someone who did not write the lesson work through it: most of the errors found in review were not wrong keys but true-sounding feedback sentences that were false for some of the numbers.

By hand, in the preview (`#/dev/lesson?course=…&lesson=…`):

- Answer every question **wrong on purpose** at least once. Is the feedback helpful? Are the hints in a sensible order?
- Try it on a phone-sized window and with the keyboard only.
- Read the whole lesson aloud once. Cut every sentence you stumble on.

---

## Pre-flight checklist

- [ ] One idea. 12–18 steps. About ten minutes.
- [ ] **Teach before you ask**: you have read the lesson with `node tools/outline.mjs <course>/<lesson>` and, for every graded step, can point to where the lesson showed what it asks for. At most one or two predictions; at least three teaching screens; a worked example before the first problem of each new kind.
- [ ] At least one hands-on step (`interact` or an interactive figure).
- [ ] No more than two `info` steps in a row; at least four graded steps.
- [ ] Every graded step has `explain`; misconception options have `why`; hard steps have `hints`.
- [ ] Numeric practice uses `gen`.
- [ ] 2–4 `review: true` steps that stand alone.
- [ ] Every figure has `alt`. Photos were added with `tools/fetch-image.mjs`, and their alt text says what can be seen ([IMAGES.md](IMAGES.md)).
- [ ] Facts are true; numbers are realistic; units are given. Dates, names and records have a source you checked.
- [ ] The course test re-solves every generated step of the new lesson, and someone other than the author has worked through it.
- [ ] `recap` has 3–4 crisp takeaways.
- [ ] `validate` and `smoke` pass, you have looked at the screenshots at laptop and phone width, and the smoke test's "laptop fit" line does not list your steps.
