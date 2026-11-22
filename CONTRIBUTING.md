# Contributing to Learntopia

Thank you for wanting to help. Learntopia gets better every time someone fixes a confusing sentence, adds a hint to a hard question or writes a new lesson.

## Ways to contribute

| You want to… | Start here |
|--------------|-----------|
| Fix a typo, a wrong answer or an unclear explanation | Edit the lesson file under `content/courses/…` and open a pull request |
| Improve a lesson (better hints, feedback for a common mistake, a clearer figure) | [docs/AUTHORING.md](docs/AUTHORING.md) |
| Write a new lesson or course | [docs/AUTHORING.md](docs/AUTHORING.md) |
| Correct or write a health, money or psychology lesson | [docs/HEALTH.md](docs/HEALTH.md) first: sources, safety wording and review are stricter there |
| Build an interactive figure | [docs/WIDGETS.md](docs/WIDGETS.md) |
| Fix a bug or improve the app | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Improve accessibility | Any of the above; please describe how you tested |
| Question the pedagogy | [docs/LEARNING-SCIENCE.md](docs/LEARNING-SCIENCE.md), then open an issue with sources |

## Set up

```bash
node tools/serve.mjs
```

Open <http://localhost:8080>. There is nothing to install for normal work. Before sending a change, run:

```bash
npm test
```

```bash
npm run validate
```

If you changed a lesson or a widget, also run the browser smoke test for it (needs Playwright, see the README):

```bash
node tools/smoke.mjs --lesson <course>/<lesson> --shots /tmp/shots
node tools/outline.mjs <course>/<lesson>                 # read the lesson as a beginner meets it: is everything taught before it is asked?
```

and look at the screenshots at phone and desktop width. `node tools/a11y.mjs --lesson <course>/<lesson>` runs the automated accessibility rules on the same lesson.

## What makes a good pull request

- **One thing at a time.** A fix to one lesson, or one new lesson, or one feature.
- **Say why.** For content changes: what was confusing or wrong? For pedagogy changes: what is the evidence?
- **Checks pass.** `npm test` and `npm run validate` are green; new lessons pass the smoke test.
- **It works on a phone, in dark mode and with a keyboard.**
- **No new dependencies and no build step.** If you think one is truly needed, open an issue first.

## Lesson quality checklist

The full version is at the end of [docs/AUTHORING.md](docs/AUTHORING.md). In short: one idea per lesson; one prediction to open, then every new thing taught on a short screen before it is asked; at least one hands-on step; every answer explained; practice generated with varied numbers; 2–4 stand-alone review steps; every fact true.

## Code style

- Modern JavaScript modules, two-space indentation, single quotes, semicolons.
- Small files with a header comment saying what the module is for.
- No frameworks. Use `h()` / `s()` from `src/core/dom.js`.
- Colours and sizes come from the CSS custom properties in `assets/css/tokens.css`.
- Pure logic (anything without the DOM) gets a unit test in `tests/`.
- Keep supporting older devices in mind: avoid CSS nesting, regex lookbehind and other features missing from Safari 15.

## Stable ids

Learner progress is stored under course ids, lesson ids and the ids of review steps. **Do not rename them** once published. If a lesson must be restructured, keep the ids of its review steps or accept that those items will drop out of learners' review schedules.

## Licensing of contributions

By contributing you agree that your code is released under the [MIT license](LICENSE) and your lesson content under [CC BY-SA 4.0](LICENSE-CONTENT.md). Only submit material you have the right to license this way. Do not copy text, problems or figures from other courses, textbooks or websites.

## Conduct

Be kind, be specific, assume good faith. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
