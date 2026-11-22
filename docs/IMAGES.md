# Pictures in lessons

Photographs and artworks come from [Wikimedia Commons](https://commons.wikimedia.org), are stored in this repository, and are shown with their credit. This guide is for lesson authors: how to find a picture, add it, describe it and use it. The `photo` widget's full reference is in [WIDGETS.md](WIDGETS.md#photo).

## Contents

1. [The short version](#the-short-version)
2. [When a lesson should have a picture](#when-a-lesson-should-have-a-picture)
3. [Finding a file on Commons](#finding-a-file-on-commons)
4. [Adding it: `tools/fetch-image.mjs`](#adding-it-toolsfetch-imagemjs)
5. [Licences: what is allowed and why](#licences-what-is-allowed-and-why)
6. [Using a picture in a lesson](#using-a-picture-in-a-lesson)
7. [Alt text and captions](#alt-text-and-captions)
8. [Size, format and offline use](#size-format-and-offline-use)
9. [Etiquette: Wikimedia is a shared resource](#etiquette-wikimedia-is-a-shared-resource)
10. [Checks](#checks)

---

## The short version

```bash
node tools/fetch-image.mjs --search "angkor wat reflection"            # find candidates and see their licences
node tools/fetch-image.mjs --course geography --id angkor-wat \
     --title "File:Angkor Wat with its reflection (cropped).jpg" --aspect 3:2
```

```js
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/geography/index.js';

{ id: 'look', type: 'info',
  text: 'Each tower is carved to look like a **lotus bud**.',
  figure: photo(MEDIA['angkor-wat'], {
    alt: 'A wide stone temple with towers shaped like lotus buds, mirrored in a pond in front of it',
    caption: 'Angkor Wat, Cambodia, built in the 12th century',
  }) }
```

The tool is the **only** way a picture may enter the project: it reads the licence from Commons, refuses what Learntopia cannot use, resizes the file, strips its metadata and records the author. Never copy an image file into `content/media/` by hand, and never link to a picture on another site.

---

## When a lesson should have a picture

A picture earns its place when a question or an explanation **refers to something in it**: "which of these is the Parthenon?", "tap the minaret", "what does the painter put in the centre?". It does not earn it by being pretty.

- **Never decorative.** If the step reads the same without the picture, leave the picture out.
- **At most about four pictures per lesson.** (A question with four photo options uses its four.) The validator warns from seven.
- **One picture per step**, except photo options.
- **Show, then ask.** A good pattern is one step that looks closely at a picture and a later step that asks the learner to recognise or locate something.
- Prefer pictures in which the thing in question is large, sharp and not hidden behind crowds, scaffolding or watermarks. Landscape shapes (3:2, 4:3) sit best beside text.
- People: avoid recognisable living private persons. Portraits of historical figures and public-domain artworks are fine.

---

## Finding a file on Commons

**With the tool** (one request, and the answer is cached):

```bash
node tools/fetch-image.mjs --search "taj mahal" --limit 6
```

```
6 candidate(s) for "taj mahal" (✔ usable, ✖ not):
  ✔  File:Taj Mahal (Edited).jpeg
       3840×2525 · CC BY-SA 4.0 · Yann Forget
  ✖  File:Some other file.jpg
       1800×1200 · GFDL 1.2 · refused: it is offered under the GFDL only, …
```

The words go to Commons' own search, so its syntax works: `"exact phrase"`, `incategory:"Featured pictures of India"`, `-night`. Search results also fill the tool's cache, so fetching one of the listed files afterwards costs only the download.

**By hand.** Browse <https://commons.wikimedia.org> (a Wikipedia article's pictures link to their Commons pages). On the file's page, the title at the top (`File:Something.jpg`) is what the tool needs; you may also paste the page's address. Good hunting grounds are the *Featured pictures* and *Quality images* categories.

Before you fetch, **look at the picture on Commons** and read its page:

- Is it really what the description says? Check against a second source if the lesson states a fact about it.
- Does the page carry a warning box besides the licence (personality rights, trademark, a country's cultural-heritage law)? The tool prints such notes as `⚠ Commons notes other restrictions`. Choose another picture when one appears.
- For a photograph of an artwork: is the *artwork* in the public domain (as a rule, its creator died more than 100 years ago)? The tool accepts what Commons labels public domain; you are the second pair of eyes.

To see a file's licence without storing anything: `node tools/fetch-image.mjs --info "File:Something.jpg"`.

---

## Adding it: `tools/fetch-image.mjs`

```bash
node tools/fetch-image.mjs --course <course-id> --id <image-id> --title "File:Example.jpg"
```

| Option | Meaning |
|--------|---------|
| `--course` | The course that uses the picture. Files go to `content/media/<course-id>/`. A lesson may only use pictures of its own course. |
| `--id` | Your name for it: lowercase words joined by dashes (`angkor-wat`). Lessons refer to it as `MEDIA['angkor-wat']`. |
| `--title` | The Commons file title, or the address of its page. |
| `--aspect 3:2` | Cut to a shape (the largest such box). With `--focus x,y` (fractions from the top left; default `0.5,0.5`) you say which point must stay in view. |
| `--crop l,t,r,b` | Keep a box given in fractions of the picture, for example `--crop 0.1,0,0.9,0.8`. |
| `--width 1280` | Which thumbnail to download: `330`, `500`, `960`, `1280` (default) or `1920`. Use `1920` when you crop tightly and the result comes out small. |
| `--max 1280` | Longest side of the stored picture in pixels (320 to 1920). |
| `--budget 180` | Largest file size in KB. Raise it only for an artwork whose detail matters when enlarged. |
| `--name "…"` | The work's name in the credits, when the one on Commons is unwieldy. |
| `--alt "…"`, `--caption "…"` | Optional defaults stored with the picture. Normally you write these in the lesson, where they can fit the question. |
| `--author "…"` | The name to credit, when the one recorded on Commons is not a name. Normally set afterwards, on the existing picture: see [Credits that need a hand](#credits-that-need-a-hand). |
| `--credit-label "Painting"` | The first word of the credit shown in the app (default "Photo", or "Image" for public-domain works). A lesson can still pass its own `creditLabel`. |
| `--force` | Redo a picture that exists (another crop, another size). The download is cached, so Wikimedia is not asked again. |

What you get:

```
✔ geography/angkor-wat: 968×645, 144 KB at quality 84 (+ 480×320, 30 KB for answer options)
  "Angkor Wat with its reflection (cropped)" by Satdeep Gill. CC BY-SA 4.0.
  https://commons.wikimedia.org/wiki/File:Angkor_Wat_with_its_reflection_(cropped).jpg
  In a lesson:  photo(MEDIA['angkor-wat'], { alt: '…what the picture shows…', caption: '…' })
```

and these files (commit all of them):

```
content/media/<course-id>/angkor-wat.jpg       the picture
content/media/<course-id>/angkor-wat.480.jpg   a small copy, used inside answer options
content/media/<course-id>/manifest.json        the record: source, author, licence, sizes, hashes (machine-written)
content/media/<course-id>/index.js             the same for lessons to import (generated)
content/media/CREDITS.md                       one line per picture, all courses (generated)
```

Running the same command again does nothing. **Look at the stored picture** before you use it: a crop can cut off the very thing the question is about.

Several pictures at once cost Wikimedia fewer requests. Put one picture per line in a text file, with the same options, and run it as a batch:

```
# images.txt
--id parthenon   --title "File:The Parthenon in Athens.jpg"
--id taj-mahal   --title "File:Taj Mahal (Edited).jpeg" --aspect 3:2
```

```bash
node tools/fetch-image.mjs --course geography --batch images.txt
```

### Credits that need a hand

The tool takes the author from Commons and tidies it (no "Creator:" prefixes, Flickr addresses, home towns or file names; for a derivative it keeps both names: "A; derivative work: B"). Some records still do not yield a name: a sentence about a colophon, an uploader's remark, a scan's source. The tool then says `⚠ check the author` when it fetches, and you record the right name yourself. This asks Wikimedia nothing:

```bash
node tools/fetch-image.mjs --doubtful                                   # every credit that does not read like a name
node tools/fetch-image.mjs --course world-crossroads --id diamond-sutra --author "printed for Wang Jie, 868 CE" --credit-label "Print"
node tools/fetch-image.mjs --course world-crossroads --id diamond-sutra --author auto     # back to what Commons says
```

The manifest keeps both: `author` (what is shown in the app and in `CREDITS.md`), `authorOverride` (what you set), `authorDerived` and `authorApi` (what the tool and the API said). Set the name here, not with `credit:` in a lesson, so that every lesson and the credits list agree.

**Photographs of old objects.** For a museum piece, Commons' author field often names the maker of the *object* (or "Unknown author"), while the CC licence belongs to the *photographer*, who is named only under "Source" or "Photograph" on the file page. A CC BY or CC BY-SA picture needs the photographer's name. The tool looks for a person in the source field; when it finds none it prints `ATTRIBUTION UNRESOLVED` (at fetch time, in `--doubtful` and in `--verify`), and until you set `--author` the app shows "author named on the source page" instead of a name. Never leave it at that: open the file page, find the photographer, record the name.

For CC BY and CC BY-SA pictures a name set by hand must still contain the name Commons records (you may add to it, not replace it); if the record itself is wrong, `--force` overrides it. Public-domain works may be credited as you judge best: the artist rather than the uploader, "after …", "attributed to …".

`node tools/fetch-image.mjs --recredit [--course <id>] [--dry-run]` derives all authors again from the cached answers with the current cleaner (names set by hand are kept).

Housekeeping:

```bash
node tools/fetch-image.mjs --list --course geography      # what is there, with sizes and licences
node tools/fetch-image.mjs --remove angkor-wat --course geography
node tools/fetch-image.mjs --verify                        # every file matches its record; nothing is unrecorded
```

The tool needs Node 18 or newer and, for the image work, Python 3 with Pillow (`pip install pillow`) or ImageMagick. It talks to Wikimedia through `curl` when that is installed (it follows the system's proxy settings), otherwise through Node itself.

---

## Licences: what is allowed and why

Learntopia's lessons are published under CC BY-SA 4.0, and anyone may copy and adapt them, also commercially. A picture inside a lesson has to allow the same. The tool reads the licence from the Commons API (never from what a person says about the file) and accepts:

| Accepted | Shown as |
|----------|----------|
| Public domain: PD, PD-US, PD-old, PD-Art of a public-domain work, "No known copyright restrictions" | "Public domain, via Wikimedia Commons", or "Image: NASA, public domain, via Wikimedia Commons" when an author is known |
| CC0 | "CC0, via Wikimedia Commons" |
| CC BY 2.0, 2.5, 3.0, 4.0 (also national versions such as "3.0 DE") | "Photo: Jane Doe, CC BY 4.0, via Wikimedia Commons" |
| CC BY-SA 2.0, 2.5, 3.0, 4.0 | "Photo: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons" |

Everything else is refused, with the reason:

- **NC** (non-commercial) and **ND** (no derivatives): Learntopia may be reused commercially, and a resized or cropped copy is a derivative.
- **GFDL only**: it requires reprinting the full licence text with every copy.
- **Fair use / non-free**: not a licence at all.
- **Other free licences** (Free Art License, government licences, "attribution" templates): possibly fine, but nobody has checked them against CC BY-SA. Pick another picture.
- **No machine-readable licence**, or licence fields that contradict each other.

A refusal is final: do not work around it by saving the file some other way. There is almost always an equivalent picture under an accepted licence.

**Pictures keep their own licence.** Learntopia's CC BY-SA 4.0 covers the lesson text, not the photographs in it. What the licences ask for is done for you: the author, the licence and a link to the source appear under every picture in the app, the enlarged view adds the work's name, a link to the licence and what was changed ("resized", "cropped and resized"), and `content/media/CREDITS.md` lists everything in one place.

---

## Using a picture in a lesson

Import the course's index and the helper once per lesson file:

```js
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/<course-id>/index.js';
```

`photo(MEDIA['id'], options)` returns a widget spec. It carries the file's address, its size, the credit and the licence, so never write those out yourself.

### As a figure

```js
figure: photo(MEDIA['earth-apollo-17'], {
  alt: 'The whole Earth seen from space: a large tan and green landmass under swirls of white cloud, and a white ice cap at the bottom',
  caption: 'Earth from Apollo 17, 7 December 1972',
})
```

The learner can tap the picture to enlarge it. On a laptop the picture sits beside the text and is scaled to fit the height of the window; on a phone it spans the width. Options: `aspect: '16:9'` with `fit: 'cover'` and `focus: [x, y]` shows it in a box of another shape; `creditLabel: 'Painting'` replaces the first word of the credit; `zoom: false` removes the enlarge button.

### As answer options

```js
{ id: 'which-parthenon', type: 'choice',
  text: 'Which of these is the **Parthenon**?',
  options: [
    { figure: photo(MEDIA.parthenon, { alt: 'A ruined marble temple with a row of tall fluted columns, on a rocky hilltop' }), correct: true,
      why: 'Marble columns all the way round, on the rock above Athens.' },
    { figure: photo(MEDIA['taj-mahal'], { alt: 'A white marble building with a large onion-shaped dome and four slender towers' }),
      why: 'A dome and four minarets: this is the Taj Mahal.' },
    { figure: photo(MEDIA['angkor-wat'], { alt: 'A wide dark stone temple with towers shaped like lotus buds, behind a pond' }) },
    { figure: photo(MEDIA['machu-picchu'], { alt: 'Stone walls and terraces on a ridge high in green mountains' }) },
  ],
  explain: 'The Parthenon was built between 447 and 432 BCE on the Acropolis of Athens.' }
```

Options are shown as cards of equal size: two by two on a phone, four in a row on a laptop. Each picture comes from the small file and fills a 4:3 card; what does not fit is cut off evenly on both sides. To choose what is shown:

- `focus: [x, y]` (fractions from the top left) keeps that point in view. On a tall picture or a panorama it decides which end is cut. A 3:2 photograph has nothing to spare above and below in a 4:3 card, so there a focus that points up or down is honoured by enlarging the picture a little (×1.25) around that point.
- `magnify: 1.5` enlarges the picture around the focus by the factor you give, on any card (and on a figure with `fit: 'cover'`). Use it to show the building rather than the square in front of it, instead of cropping the file again.
- `fit: 'contain'` shows the whole picture inside the same 4:3 card, with bands at the sides or above and below: for paintings and maps whose edges matter. (`aspect: '1:1'` changes the card's shape; give all options of a question the same.)

Three rules:

- **The alt text must not name the answer.** It is what a screen reader says for the option. Describe what can be seen.
- **No `caption`** on option photos, for the same reason, and leave the option's `text` empty.
- The credits are listed under the grid in a closed "Picture credits" line. They become links only after the step is answered, because a source page usually names its subject.

Use two or four options, with pictures of similar kind and quality: the odd one out should not be guessable from the photography.

### Tapping a part of the picture

Give `hotspots`, in fractions of the picture's width and height (`x: 0` is the left edge, `y: 0` the top; `r` is a fraction of the **width**):

```js
{ id: 'find-fuji', type: 'interact',
  text: 'This print belongs to a series of views of one mountain. **Tap Mount Fuji.**',
  widget: photo(MEDIA['great-wave'], {
    alt: 'A woodblock print: a huge wave with claw-like foam towers over three long boats; a small snow-capped mountain stands in the distance',
    creditLabel: 'Print',
    hotspots: [
      { id: 'wave', x: 0.37, y: 0.30, r: 0.12, label: 'The great wave', alt: 'the crest of the largest wave' },
      { id: 'fuji', x: 0.64, y: 0.69, r: 0.06, label: 'Mount Fuji',     alt: 'a small peak in the distance' },
      { id: 'boat', x: 0.83, y: 0.60, r: 0.07, label: 'Fishing boat',   alt: 'a long boat with rowers' },
    ],
  }),
  check: (s) => s.picked === 'fuji' || (s.picked === 'wave' ? 'That is the wave. The mountain is far away, so it looks small.' : false),
  solution: { picked: 'fuji' },
  explain: 'The small snow-capped peak under the curl of the wave is Mount Fuji.' }
```

| `mode` | What the learner sees | State |
|--------|-----------------------|-------|
| `'pick'` (default) | Numbered rings. They choose one. Labels appear once the step is answered (`hideLabels: false` shows them from the start). | `{ picked: 'fuji', label }` |
| `'point'` | Nothing is marked. They tap the picture or move a marker; the rings and labels appear once the step is answered. | `{ picked: 'fuji' or null, point: { x, y }, label }` |
| `'label'` | Rings with their labels; nothing to answer. For a figure that names the parts. | `{}` |

A picture with hotspots is always shown whole and in its own shape, so that the fractions stay true: `aspect`, `fit` and `focus` do nothing on it. If a tall picture comes out small on a laptop, store a cropped copy with the tool's `--crop` or `--aspect` instead.

To find the fractions, open the stored picture in any image viewer that shows pixel positions and divide by its width and height (the size is printed by the tool and by `--list`), then check the result at `#/dev/lesson?course=…&lesson=…`. Rings should be at least `r: 0.05`, should not overlap much, and should include one or two plausible wrong parts. A hotspot's `alt` is a neutral description ("a small peak in the distance") read to screen-reader users while the labels are hidden; without it they only hear "Spot 2".

---

## Alt text and captions

**`alt` is required**, on every photo, and the validator insists. It is what a learner who cannot see the picture gets instead of it, and what everyone sees if the file fails to load.

- Say **what can be seen**, as you would describe it over the phone to someone who has to answer the same question: "A white marble building with a large onion-shaped dome and four slender towers, at the end of a long pool."
- One or two sentences. Start with the subject, not with "Photo of" or "Image of".
- Include what the step needs: if the question is about the columns, mention the columns.
- Do not give the answer away when the picture is part of a question (see above), and do not repeat the caption.
- Colours, counts and positions help; opinions ("beautiful", "impressive") do not.

**`caption`** is the visible line under a figure. Use it for what the picture cannot say itself: what, where and when ("Angkor Wat, Cambodia, built in the 12th century"). Keep it under about ten words, and state only facts you have checked. The credit is added automatically; do not write it into the caption. Inline formatting works as in other lesson text: `*Las Meninas*` for the title of a work, `**bold**`, `$x^2$`.

---

## Size, format and offline use

You do not have to do anything here; this is what the tool and the app do.

- **Format: JPEG**, progressive, in sRGB. Every browser, every tool and every static host shows it without configuration, which matters more for a project whose content is meant to be copied than the roughly 25% a newer format would save. Transparent or line-art originals are flattened onto white.
- **Size:** the longest side is at most 1280 px and the file at most 180 KB. The tool lowers the JPEG quality step by step (84 to 68) and, if a very detailed picture is still too large, stores it a little smaller instead of blockier. Typical photographs come out at 140 to 180 KB. The small copy for answer options is 480 px and about 30 KB.
- **Metadata is removed:** no EXIF, no GPS position, no camera serial number. Rotation flags are applied first, so pictures are upright.
- **No layout shift:** a picture's width and height are recorded, so its space is reserved before the file arrives.
- **Loaded when needed:** pictures load lazily and are not part of the files downloaded when the app is installed. The service worker saves each picture the first time it is shown; when a lesson is opened it also fetches the small copy of each of that lesson's pictures, so a lesson that was opened once works offline (pictures not yet seen appear at lower resolution).
- **Replacing a picture** (`--force`) gives it a new address (`angkor-wat.jpg?v=1a2b3c4d`, a hash of its content), so learners get the new one. This is also why the spec must come from `photo(MEDIA[…])` and not be typed out.
- Run `node tools/gen-precache.mjs` after adding pictures, as after adding any file.

---

## Etiquette: Wikimedia is a shared resource

Commons is run by a charity and limits how fast any one address may ask. The limit is shared by everyone behind the same internet connection, so a careless script can lock out its neighbours. The tool is deliberately slow and patient; please leave it that way.

- **One request at a time, at least 15 seconds apart.** All copies of the tool running on one machine share a lock and a time stamp, so starting several at once is safe: they queue. An image costs one or two requests, so expect about half a minute per picture.
- **The queue is first come, first served,** request by request: a batch of twenty pictures and a single fetch started later take turns, and neither waits for the other to finish. While it waits the tool says so ("waiting for my turn… 3 ahead", then "still in the queue after 60 s"), so a quiet minute is not a hang. With five authors fetching at once, a picture can take a few minutes: let it run.
- **Nothing is asked twice.** Every answer and every download is cached in a folder shared by all users of the machine (a temporary folder by default; `LEMMA_WIKIMEDIA_CACHE` names another). `--force`, `--info` and repeated searches are answered from the cache.
- **When Wikimedia says "too many requests" (HTTP 429 or 503)** the tool waits as long as the answer asks, otherwise 60, 180 and 600 seconds, and then gives up with a message that says when to try again. If that happens, **wait**. Do not restart it in a loop, do not shorten the gap, and do not try another host or another tool.
- **Only standard thumbnail sizes** are downloaded, never full-size originals: those are answered with errors, and Wikimedia asks tools to use the standard sizes.
- **Search sparingly.** One good search and a look at the candidates in your browser beats five searches. Use `--batch` when you know several titles.
- The tool identifies itself as `LemmaCourseBuilder/1.0 (open-source learning site; image attribution tool)`. Do not change that, and do not add personal details to it.
- Do not use other download tools or scripts against Wikimedia for this project, and never link (`src="https://upload.wikimedia.org/…"`) to a picture from a lesson: besides the load it puts on their servers, it would tell Wikimedia about every learner who opens the lesson, and the app's Content-Security-Policy blocks it anyway.

Settings, should you really need them: `LEMMA_WIKIMEDIA_GAP_MS` (default 15000), `LEMMA_WIKIMEDIA_BACKOFF` (default `60,180,600`, in seconds), `LEMMA_WIKIMEDIA_CACHE`.

---

## Checks

```bash
node tools/validate.mjs --course <course-id>
```

fails when a photo has no `alt`, no credit, a file that does not exist or is not in the course's manifest, an address on another site, or hotspots that make no sense; when a file in `content/media/<course-id>/` was changed by hand or is not in the manifest; and it warns about pictures in the manifest that no lesson uses.

```bash
node tools/smoke.mjs --lesson <course-id>/<lesson-id> --shots /tmp/shots
```

fails when a picture in a step does not load. Look at the screenshots at both sizes: is the thing the question asks about clearly visible in a card 160 px wide on a phone?

Checklist for a lesson with pictures:

- [ ] Every picture is referred to by a question or an explanation. About four at most.
- [ ] Added with `tools/fetch-image.mjs`; you have looked at the stored file and at its Commons page.
- [ ] Every `photo(…)` has an `alt` that describes what can be seen; option photos do not name the answer.
- [ ] Facts in captions are checked.
- [ ] `validate` and `smoke` pass; `manifest.json`, `index.js`, both `.jpg` files and `CREDITS.md` are committed.
