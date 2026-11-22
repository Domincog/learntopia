# Architecture

Learntopia is a static, local-first web app: HTML, CSS and native JavaScript modules, with no framework, no bundler and no backend. This note explains how the pieces fit, and why.

## The shape of the system

```
                 ┌────────────────────────── browser ──────────────────────────┐
 index.html ───► │ src/app.js                                                   │
                 │   ├─ core/router.js      hash routes  →  views/*.js          │
                 │   ├─ core/store.js       one JSON document in localStorage   │
                 │   ├─ ui/shell.js         sidebar / tab bar                   │
                 │   └─ views/lesson.js ──► player/player.js                    │
                 │                            ├─ player/types/*.js  (step UIs)  │
                 │                            └─ widgets/*.js        (figures)   │
                 │ content/index.js  → courses/<id>/course.js   (loaded at boot)│
                 │                   → courses/<id>/lessons/*.js (on demand)    │
                 │ sw.js             offline cache                              │
                 └──────────────────────────────────────────────────────────────┘
```

There is no server-side state at all. Deploying is copying files.

## Decisions and their reasons

**No build step.** Source files are the deployed files. Anyone can view source, edit a lesson in a text editor and reload. The costs are many small HTTP requests (fine over HTTP/2 and cached by the service worker) and no TypeScript or JSX; we consider that a fair trade for a project whose main contributors are meant to be teachers and curious learners.

**No framework.** Views build DOM nodes with a 40-line hyperscript helper (`h()` / `s()` in `core/dom.js`). Dashboard views are marked `live` and are simply re-rendered when the store changes; the lesson player manages its own DOM imperatively. The app is small enough that this stays readable.

**Hash routing.** `#/course/algebra` works on every static host with zero configuration and survives being opened from a subdirectory.

**Local-first data.** Everything a learner does is one JSON document under the `lemma:v1` key in `localStorage` (see `defaultState()` in `core/store.js`). There are no accounts. Export and import (Settings) are the sync story. `migrate()` upgrades older documents; bump `SCHEMA_VERSION` when the shape changes.

**Content as code.** A lesson is an ES module exporting a plain object. Using JavaScript rather than JSON or Markdown lets a step carry a problem *generator* (`gen(rng)`) and a `check(state)` function for interactive steps. `player/normalize.js` turns the forgiving authoring format into the strict shape the player needs and produces clear error messages; the command-line validator reuses exactly that code.

**Convention over registries.** A widget spec `{ type: 'number-line' }` loads `src/widgets/number-line.js`; a lesson loads from `content/courses/<course>/lessons/<lesson>.js`. Adding a widget or a lesson never requires editing a central table (a course needs one line in `content/index.js`).

## Core modules (`src/core`)

| Module | Responsibility |
|--------|----------------|
| `dom.js` | `h()`/`s()` element builders, `disposer()` for cleanup, `announce()` for screen readers |
| `router.js` | Hash router with `:params` and query strings |
| `store.js` | Load / save / migrate / export / import the learner document; change subscriptions |
| `dates.js` | Local-day keys and the app clock (shiftable for testing) |
| `rng.js` | Seeded random numbers (mulberry32) |
| `srs.js` | The review scheduler (FSRS model): `schedule()`, `retrievability()`, `gradeFrom()`, `interleave()` |
| `progress.js` | XP, levels, daily goal, streaks with rest days, finishing lessons, applying reviews, summaries |
| `achievements.js` | Achievement definitions and checks |
| `content.js` | Catalog access and lazy lesson loading |
| `mathexpr.js` | Safe expression parser/evaluator (no `eval`): numeric answers, algebraic equivalence, plotting |
| `mathtex.js` | Expression → TeX for the live preview on algebra answers |
| `markdown.js` | Lesson text: a small Markdown dialect + KaTeX |
| `highlight.js` | Tiny syntax highlighter |
| `audio.js` | Synthesised sound effects (Web Audio; no audio files) |
| `confetti.js` | Canvas confetti |
| `geom.js` | Geometry helpers shared by widgets and lesson checks |

`srs.js`, `progress.js`, `mathexpr.js`, `markdown.js`, `rng.js`, `normalize.js` and the interpreter have no DOM dependencies and are unit-tested with `node:test`.

## The lesson player (`src/player`)

`createPlayer({ mode, items, … })` runs a queue of steps in one of three modes:

- `lesson` — up to 2–4 attempts per step with hints; a step missed on the first attempt is queued again at the end ("second look"); XP and activity are recorded as you go.
- `review` — one attempt per item, optional confidence rating; results go to the scheduler via `onResult`.
- `preview` — nothing is saved (author tools).

For each step the player resolves generators with a seeded rng (`resolveStep`), mounts figures (widgets), then asks the step type's **renderer** for a controller:

```
renderer(step, env) → { el, check(), reveal(), lock(), retry?(), focus?(), onKey?(), solve?(), destroy?() }
```

`check()` returns `{ correct, message }`, `{ invalid, message }` (unreadable input; no attempt used) or `{ ungraded }`. The player owns everything around that: the Check/Continue button, verdicts, hints, explanations, attempts, keyboard shortcuts, sounds, XP and the retry queue. Renderers are small (40–120 lines each) and live in `player/types/`.

`solve()` fills in the correct answer; `tools/smoke.mjs` uses it to prove that every step accepts its own solution.

### How a step is laid out

A step is one column on phones and tablets. From 1000px of width the player uses the room a laptop has, which is sideways: a step with something to look at is split into two columns, the prompt (and later the hints and the explanation) on the left, the visual on the right. Nothing is decided per lesson; the player works it out from the step:

| The step has… | Layout on a wide screen (`data-split`) |
|---------------|-----------------------------------------|
| a `figure` | `figure`: figures right, text and answer area left |
| an `interact`, `code` or `order` answer area, or a long choice prompt | `input`: the answer area right, text left |
| a `bucket` or `match` board, or picture options | `board`: one wide column, the board using the full width |
| none of these | one centred column |

The right-hand column (`.step-side`) is a real element only in the split layout; everywhere else it is `display: contents`, so the single-column order stays natural.

Height is the scarce dimension on a laptop, and CSS cannot know how tall a widget's sliders are, so the player measures (`fitSide()` in `player.js`): it gives every kit-framed drawing the height that is actually free (`--w-fit-h`, turned into a width by `.w-frame.w-fit`), moves the controls *beside* the drawing when stacking them still does not fit (`.w-frame.is-row`), and keeps the column in view while the prompt scrolls when the column fits (`.is-sticky`). On short windows (`max-height: 820px`) spacing and type tighten a little; on large, tall monitors the whole interface is scaled up through the root font size (`--screen-scale`).

`tools/smoke.mjs` plays every lesson in a 1366 × 700 window and on a phone, fails on sideways overflow in either, and reports which steps need scrolling on the laptop before they can be answered.

## Widgets (`src/widgets`)

A widget module default-exports `create(spec, env) → { el, getState, setState, setReadOnly, destroy }`. `kit.js` provides the shared pieces: a framed SVG canvas, coordinate planes and axes, draggable handles with keyboard support, sliders, readouts, an animation loop and theme colours. Widgets expose **facts** (`getState()`); lessons decide what counts as correct (`check(state)`). See [WIDGETS.md](WIDGETS.md).

## Spaced review

When a lesson is finished, each `review: true` step becomes a *card*: `{ s, d, last, due, reps, lapses }` (stability, difficulty, timestamps). The first grade comes from how the step went in the lesson. `progress.dueCardIds()` lists cards whose `due` time has passed, weakest predicted recall first; `views/review-session.js` loads the corresponding steps, interleaves them by lesson, and runs them in the player. Each answer is converted to a grade (`gradeFrom`: Again / Hard / Good / Easy from correctness, hints and stated confidence) and passed to `schedule()`.

Cards practised before they are due are left untouched unless missed, so extra practice cannot inflate the schedule.

Use `#/dev/time` to move the app clock forward and watch reviews come due.

## Offline

`sw.js` serves same-origin requests network-first with a cache fallback (so deployments are never stuck behind a stale cache), fonts and vendored libraries cache-first, and on install downloads everything listed in `precache.json`. Regenerate that list with `node tools/gen-precache.mjs`. Two kinds of file are deliberately left out of that list and cached the first time they are used instead: the photographs under `content/media/` (cache-first, with the content hash in the address; opening a lesson also fetches the small copies of its pictures so that it works offline afterwards) and the detailed map layers in `assets/geo/` that the `world-map` widget imports on demand. The service worker is not registered on `localhost` unless you set `localStorage['lemma:sw'] = '1'`, to keep development free of caching surprises.

## Styling

`assets/css/tokens.css` defines every colour, size and radius as a custom property, once for light and once for dark. Components, widgets and SVG figures use only those tokens, which is how the theme switch reaches inside every interactive. The look: warm paper background, ink outlines, flat fills, hard offset shadows on things you can press.

## Security and privacy

- No third-party requests of any kind: fonts, KaTeX and icons are vendored.
- `_headers` sets a Content-Security-Policy of `default-src 'self'` (inline *styles* are allowed because KaTeX needs them; inline scripts are not).
- Lesson text is HTML-escaped before formatting; links are restricted to `http(s)`, `mailto` and in-app routes.
- Learner-written code runs in an interpreter written in JavaScript with step and depth limits; it has no access to the page or the network.

## Testing

| Command | What it covers |
|---------|----------------|
| `npm test` | Pure logic: scheduler, progress rules, math engine, markdown, interpreter |
| `npm run validate` | Every lesson's structure, generators (many seeds), TeX, widget references, quality warnings |
| `npm run smoke` | Every lesson played in a real browser at laptop and phone size; every solution checked against its own check; a report of steps that need scrolling on a laptop |
| `npm run a11y` | axe-core accessibility rules on the main pages and on every lesson step, before and after answering |
