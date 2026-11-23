# The body: the `body-map` widget

One widget draws the human body wherever Learntopia needs it drawn: the whole figure from the front and from behind, the chest and abdomen enlarged, the head cut open, and small schematics of the heart, the airways, the skin and a cell. It can be a picture to read, a figure to explore, or the answer area of a graded step (tap a structure, tap a marker, put a marker on the right spot). You describe what you want with a plain object; nothing is drawn by hand.

Use it for what a photograph cannot show: where things lie inside the whole body, and anything the learner taps, places or explores. A step that only asks the learner to look at a real structure (cells under a microscope, a scan, an organ close up, a technique on a training manikin) uses a sourced picture instead; see [HEALTH.md](HEALTH.md#pictures-and-diagrams) and [IMAGES.md](IMAGES.md).

```js
{ type: 'body-map', view: 'torso', show: ['digestive'],
  groups: [{ ids: ['liver', 'pancreas'], color: 'orange', label: 'Make digestive juices' }],
  labels: ['liver', 'pancreas', 'stomach'],
  alt: 'The digestive organs; the liver and the pancreas are highlighted' }
```

It is used like any other widget ([WIDGETS.md](WIDGETS.md)): as a `figure` on any step, as the `widget` of an `interact` step, or small inside a choice option. See it live at `#/dev/widgets` (search for *body-map*). The header comment of `src/widgets/body-map.js` is the compact reference; this page is the guide.

**Contents:** [Left and right](#left-and-right) · [Views](#views) · [What is shown](#what-is-shown) · [Overlapping organs](#overlapping-organs) · [Colour and groups](#colour-and-groups) · [Names and labels](#names-and-labels) · [Markers](#markers) · [Flows](#flows) · [Graded steps](#graded-steps) · [After the answer](#after-the-answer) · [Layer buttons and zoom](#layer-buttons-and-zoom) · [Helpers for lesson files](#helpers-for-lesson-files) · [Identifiers](#identifiers) · [What reads well on a phone](#what-reads-well-on-a-phone) · [Accessibility](#accessibility) · [What the drawings simplify](#what-the-drawings-simplify) · [The artwork](#the-artwork)

---

## Left and right

The figure **faces the viewer**, as in every anatomy book. So the person's left is on the viewer's right: the heart's tip points to the right of the picture, the liver is on the left of the picture, the stomach and the spleen on the right.

**Sides are always the person's own.** `left-lung` is the lung drawn on the right of the picture, `pulse-wrist:left` is the person's left wrist, and `side: 'left'` in a state means the person's left. Write lesson text the same way ("the liver lies on the right side of the body") and, the first time it matters, tell the learner that the figure is facing them. In the view from behind (`back`) the person's left is on the viewer's left, as it should be; the ids and sides still mean the same.

---

## Views

| `view` | What it shows | Coordinates |
|--------|---------------|-------------|
| `body` (default) | the whole figure from the front | 400 × 900 |
| `torso` | chest and abdomen, enlarged: where most organ questions happen | part of `body` |
| `chest`, `abdomen`, `leg` | smaller parts of the front figure | part of `body` |
| `back` | the whole figure from behind: spine, shoulder blades, back muscles, kidneys | 400 × 900 |
| `back-torso` | the trunk from behind | part of `back` |
| `head` | head and neck from the side, cut open down the middle: brain regions, eye, ear, nose, mouth, throat; the windpipe in front and the food pipe behind it | 420 × 450 |
| `heart` | the heart opened up: four chambers, four valves, the great vessels | 460 × 430 |
| `lungs-detail` | the airway tree inside the lungs, with one cluster of air sacs enlarged | 480 × 380 |
| `skin` | a block of skin cut through: layers, a hair, glands, vessels, nerve endings | 460 × 380 |
| `cell` | one cell cut open | 440 × 380 |

Every drawing has its own coordinates, with the origin at the top left and y running down. In the two whole-figure drawings the midline is x = 200, the crown of the head y = 30 and the soles y = 880: **5 units are about 1 cm** on an adult 170 cm tall. Coordinates are what you use for `bounds`, for a marker or a label placed by hand, and for the way-points of a flow.

**`bounds: [x0, y0, x1, y1]`** shows only that part of the view:

```js
{ type: 'body-map', view: 'body', bounds: [20, 180, 200, 580], show: ['skeleton'], labels: ['humerus', 'radius', 'ulna', 'hand-bones'] }     // the person's right arm
```

**`debug: true`** draws the coordinate grid and every anchor point over the figure. Switch it on while you write a step and off before you commit.

The drawing takes the proportions of what it shows; a figure with labels is wider, because the names stand in columns beside it. Override with `aspect: 1.2` (width / height) and cap the size with `maxWidth: 480` (px). In a lesson the player sizes the figure to fit the screen whatever you choose.

The front and back figures load with the widget. The other five drawings are fetched the first time their view is used (a few kilobytes each) and appear a moment later; the service worker has them cached for offline use like everything else.

---

## What is shown

```js
show: ['digestive'],                       // a whole system
show: ['skeleton', 'heart', 'lungs'],      // systems, single structures and aliases, in any mix
show: ['organs', 'female'],                // the usual organs plus the female reproductive layer
show: [],                                  // only the outline of the body
hide: ['ribs'],                            // take something out again
```

- **Systems:** `skeleton`, `muscles`, `circulatory`, `respiratory`, `digestive`, `urinary`, `nervous`, `endocrine`, `immune`. A structure that belongs to two systems (the pancreas: `digestive` and `endocrine`) comes with either.
- **Structures:** any id from the [tables below](#identifiers).
- **Aliases:** `organs` (the main organs of the trunk and the brain), `lungs`, `kidneys`, `spine`, `intestines`, `airways`, `cerebrum`, `heart-chambers`, `heart-valves`, `venae-cavae`, `lymph-nodes`, `arm-bones`, `leg-bones`, and `all`.
- **The outline of the body** (`skin`) is always drawn in the views that have one. `hide: ['skin']` removes it. (In `show`, `'skin'` means that outline; the parts of the `skin` view are named one by one, or simply left to the default.)
- Anything you name in `groups`, `labels`, `pickable`, `answer` or `focus` is switched on for you.
- Ids that a view does not draw are ignored, so `show: ['digestive']` works in `torso` (stomach, liver, intestines …) and in `head` (mouth, teeth, tongue, throat, food pipe …).

**Defaults** when you write no `show`: `['organs']` in the front views, `['skeleton']` from behind and in `leg`, and everything in `head`, `heart`, `lungs-detail`, `skin` and `cell`.

**Reproductive anatomy is off unless you ask for it.** Two layers exist, `female` (ovaries, womb) and `male` (testicles, prostate gland). Neither a system name nor `all` switches them on; only `show: ['female']`, `show: ['male']` or the ids themselves do. Without them the figure shows no reproductive anatomy at all. The figure itself is the same in every case: a neutral outline with no sex and no particular ethnicity. Breasts are not drawn as a structure; for a marker on the chest there is a pair of anchor points, `breast:left` and `breast:right`.

---

## Overlapping organs

In a real body the stomach lies in front of the pancreas, the intestines in front of the kidneys, the lungs around the heart and the ribs in front of everything. The widget draws structures in their real order, from the back wall of the body to the muscles under the skin, so with several systems switched on **the nearer structures hide the deeper ones**, exactly as they would. Four things keep the deeper ones reachable:

1. **Choose what to show.** The plainest tool: `show: ['urinary']` shows the kidneys with nothing in front of them.
2. **`ghost`** draws structures see-through: `show: ['skeleton', 'lungs', 'heart'], ghost: ['ribs', 'breastbone']`.
3. **Subjects are uncovered automatically.** When a structure is what the picture is about, whatever lies in front of it and hides a good part of it turns see-through. A structure is a subject when it is in a highlight group, has a label, is in a `pickable` list, is the one being explored, or is the `answer` being revealed after the step. Subjects do not make way for one another.
4. **`focus: ['pancreas']` uncovers a structure completely, in every mode.** Anything at all that lies in front of it turns see-through, even if it is itself pickable, labelled, in a highlight group or already chosen, and a tap on the focused structure reaches it through whatever is in front. The structures in front can still be tapped everywhere else. (Only another `focus` structure stays as it is.)

```js
// the pancreas lies behind the stomach: the stomach turns see-through because the pancreas is labelled
{ type: 'body-map', view: 'torso', show: ['digestive'], labels: ['pancreas'] }

// the kidneys with the organs in front of them faintly visible
{ type: 'body-map', view: 'torso', show: ['organs', 'adrenals'], focus: ['kidneys', 'adrenals'] }
```

**In a graded step, do not rely on the automatic uncovering.** When several organs that lie on top of one another are all `pickable`, each is a subject and none makes way for the others automatically: a tap lands on the nearest one, and a deep organ such as a kidney or an adrenal gland can be left with only a sliver to hit. For `pick`, `pickMany` and `explore` steps in which something deep must be reachable, **name the deep structures in `focus`**: the organs in front of them then turn see-through, and a tap on the deep one reaches it. (`focus` shows the learner which structures lie behind, so in a quiz put every deep candidate in it, not only the answer.) Showing fewer structures works too. Either way, try the step on a phone.

```js
// the adrenal glands lie behind the liver and the stomach: all four can be chosen
{ type: 'body-map', view: 'torso', mode: 'pickMany', show: ['liver', 'stomach', 'adrenals', 'kidneys', 'heart'],
  pickable: ['liver', 'stomach', 'adrenals', 'heart'], focus: ['adrenals'] }
```

**In pick modes nothing is uncovered for the answer before the step is over** (that would give it away). A structure can be tapped only where it can be seen, so make sure the answer is visible: show the right systems, or give a `pickable` list (its members are subjects, so they are uncovered and everything else is greyed). The browser console warns when an `answer` is not drawn in the view at all.

**In `explore` mode the learner peels the layers:** tapping the same spot again selects the structure behind the one just read about, and the ones in front fade.

---

## Colour and groups

By default each structure has a natural, textbook-like colour from the theme palette (bones pale, muscles and the heart red, lungs pink, the liver orange …), in light and in dark mode.

```js
groups: [
  { ids: ['food-pipe', 'stomach', 'small-intestine', 'large-intestine', 'rectum'], color: 'blue', label: 'Food passes through' },
  { ids: ['liver', 'gallbladder', 'pancreas'], color: 'orange', label: 'Add digestive juices', tone: 'soft' },     // tone: 'soft' is a pale tint
],
dim: true,        // everything shown that is in no group: true = greyed (the default as soon as there is a group),
                  //   false = natural colours, 'ghost' = faint, 'hide' = not drawn
legend: true,     // list the labelled groups and flows under the figure (the default; legend: false hides it)
plain: true,      // no natural colours at all: every structure in the paper colour (for "colour gives it away" quizzes)
```

`ids` takes systems and aliases too (`{ ids: 'respiratory', color: 'blue' }`). Colours are the palette names: `blue red green orange violet teal pink yellow gray`. A structure in two groups takes the colour of the later one. Never let colour carry the meaning alone: give groups a `label` (it goes into the legend and into the description for screen readers).

---

## Names and labels

```js
labels: ['liver', 'stomach', 'kidneys'],     // these names, with leader lines (ids, aliases and systems)
labels: true,                                // every member of a highlight group
labels: 'all',                               // everything that is shown
labels: ['heart', { id: 'liver', text: 'Liver (about 1.5 kg)', column: 'left' }, { at: [200, 370], text: 'Navel' }],
labelStyle: 'auto',                          // 'auto' | 'side' | 'key'
naming: 'plain',                             // 'plain' → Windpipe · 'scientific' → Trachea · 'both' → Windpipe (trachea)
```

Names stand in two columns beside the figure, each joined to its structure by a line; long names wrap. They never collide: the widget spreads them out, and moves a name to the other column when one side is full. If the names still do not fit (a wide figure on a phone, a very long name, too many of them), the structures are **numbered**, the names are listed in a key under the figure, and the figure takes the room the columns had. `labelStyle: 'key'` asks for numbers from the start; `'side'` insists on the columns.

A structure drawn on both sides of the body (`femur`, `kidneys` as two ids, `ribs`) gets one label, on whichever side has room. `column: 'left'` or `'right'` puts a label in that column of the *picture*.

**`names`** decides whether a learner can find out what something is called by hovering, tapping or moving to it with the keyboard:

- in `mode: 'view'` and `'explore'` names are **on**;
- in every other mode names are **off**, so that "tap the liver" cannot be solved by sweeping the pointer over the abdomen. Set `names: true` when the names are not the question ("tap the three organs that add digestive juices").

Labels you ask for with `labels` are printed whatever `names` says, so in a naming quiz label only what is not being asked.

---

## Markers

Points drawn on top of the figure: pulse points, where to press, where it hurts.

```js
markers: [
  { id: 'neck', at: 'pulse-neck', label: 'Neck (carotid)', color: 'red' },
  { id: 'wrist', at: 'pulse-wrist:left', label: 'Wrist (radial)', shape: 'ring', labelPos: 'right' },
  { at: [200, 340], label: 'Press here', shape: 'cross', size: 'l', note: 'Shown when the marker is tapped in explore mode.' },
],
markerLabels: 'after',      // hide the labels until the step is answered; the markers then carry letters A, B, C …
```

**`at`** is one of:

- an **anchor point**: `'chest-centre'`, `'navel'`, `'pulse-neck'`, `'knee-joint'` … (the [tables](#identifiers) list them all). Anchors that exist on both sides take the side after a colon: `'pulse-wrist:left'`, `'knee:right'`. Without a side you get the person's left. An anchor that a view does not have (`'heel'` from the front) draws nothing;
- a **structure**: `'liver'`, `'femur:right'` (the point its label would point at);
- **coordinates** `[x, y]` in the view's drawing.

`shape`: `dot` (default), `ring`, `cross`, `square`. `size`: `'s'`, `'m'`, `'l'`. `labelPos`: `right`, `left`, `top`, `bottom`; a label that would cover another marker or run off the picture moves by itself.

---

## Flows

Arrows with moving dots along a path: blood through the heart, air in and out, food along the gut, a nerve signal from a finger to the brain.

```js
flows: [
  { path: ['mouth', 'food-pipe', 'stomach', 'small-intestine', 'large-intestine', 'rectum'], color: 'orange', label: 'The path of food' },
  { path: ['fingertip:left', 'elbow-joint:left', [250, 197], [201, 172], 'brain'], color: 'yellow', label: 'Signal to the brain', dashed: true },
],
```

**`path`** is a list of stops: structures, anchors and `[x, y]` points, in any mix. A structure with a course of its own (`food-pipe`, `windpipe`, `stomach`, `small-intestine`, `large-intestine`, `rectum`, `aorta`, the venae cavae, `spinal-cord`; in the heart view the great vessels; in the head view `nose`, `mouth`, `throat`) is **followed along its length**, in whichever direction joins up with the stops before and after. Everything else is a single point (the one its label points at). Add `[x, y]` points wherever the line should bend.

Per flow: `color`; `label` (goes into the legend); `width` (px, default 4); `speed` (default 1); `dots: false` (no moving dots); `arrows: false`; `dashed: true` (a dashed line without dots: good for signals). The dots stand still when the learner has asked for reduced motion; the arrowheads still give the direction.

Blood has two conventional colours: use `'red'` for oxygen-rich and `'blue'` for oxygen-poor blood, and say so in a `label` or in the text.

**`stepThrough: true`** shows the flows one step at a time, with *Back* and *Next* controls and a sentence for each step (`label`, plus an optional longer `note`). Each flow is a step; flows with the same `step: n` appear together. Earlier steps stay on the picture, faded. The controls keep working after the step is answered.

```js
{ type: 'body-map', view: 'heart', stepThrough: true, flows: [
    { path: ['superior-vena-cava', 'right-atrium'], color: 'blue', label: 'From the body into the right atrium' },
    { path: ['right-atrium', 'tricuspid-valve', 'right-ventricle'], color: 'blue', label: 'Into the right ventricle' },
    { path: ['right-ventricle', [196, 262], 'pulmonary-artery'], color: 'blue', label: 'Out to the lungs' },
    { path: ['pulmonary-veins', 'left-atrium'], color: 'red', label: 'Back from the lungs into the left atrium' },
    { path: ['left-atrium', 'mitral-valve', 'left-ventricle'], color: 'red', label: 'Into the left ventricle' },
    { path: ['left-ventricle', [240, 262], 'aorta'], color: 'red', label: 'Out to the whole body' } ] }
```

With `stepThrough` the state gains `{ step, steps, stepsDone }` (`stepsDone` is true once the last step has been shown), so an ungraded `interact` step can ask the learner to go through all of them: `check: (s) => s.stepsDone || 'Go on to the last step.'`, `solution: { step: 6 }`.

---

## Graded steps

Set `mode` on the `widget` of an `interact` step. The widget reports **facts** as its state; your `check` decides what is right. `solution` is a state that passes; it needs only the first field shown below (the widget works out the rest). The smoke test loads every `solution` and runs your `check` on it.

### `explore`: tap to read

```js
{ id: 'meet-the-gut', type: 'interact', graded: false,
  text: 'Tap at least four parts of the digestive system and read what each one does.',
  widget: { type: 'body-map', view: 'torso', mode: 'explore', show: ['digestive'],
            notes: { liver: 'The liver is the largest organ inside the body, about 1.5 kg in an adult.' },
            alt: 'The digestive system from the food pipe to the rectum' },
  check: (s) => s.seenCount >= 4 || 'Tap a few more parts.',
  solution: { seen: ['stomach', 'liver', 'small-intestine', 'large-intestine'] } }
```

**State:** `{ selected: 'liver' | null, seen: ['stomach', 'liver'], seenCount: 2 }`. `seen` lists what has been read, in the order it was first tapped. `setState({ seen: [...] })` marks those as read and opens the last one.

A tap shows the structure's plain name, its scientific name and a one-line note under the figure. Every structure has a default note (the same text `structureInfo(id).note` returns); **`notes: { id: '…' }`** replaces it for your lesson. Keep notes to one or two plain sentences, and keep them true: this is health information. Markers with an `id` and a `label` or `note` can be explored too (their id goes into `seen`). `pickable: [...]` restricts what reacts.

### `pick`: tap one structure

```js
{ id: 'find-the-liver', type: 'interact', text: '**Tap the liver.**',
  widget: { type: 'body-map', view: 'torso', mode: 'pick', answer: 'liver', alt: 'The organs of the chest and abdomen, without names' },
  check: (s) => s.picked === 'liver' || (s.picked === 'stomach' ? 'That is the stomach. The liver is on the other side: the person\'s right.' : false),
  solution: { picked: 'liver' },
  explain: 'The liver fills the upper right of the abdomen, tucked under the ribs.' }
```

**State:** `{ picked: 'liver' | null, name: 'Liver' | null, nameThe: 'the liver' | null, side: 'left' | 'right' | null }`. `nameThe` is ready for a sentence (`` `That is ${s.nameThe}.` ``). `side` tells which of a pair was tapped, for structures drawn on both sides (`femur`, `ribs`, `pelvis`); a `solution` may include it. Tapping the chosen structure again lets it go.

`pickable: ['digestive']` restricts what can be chosen (systems, aliases, ids); everything else is greyed out and does not react. Without it, anything visible except the outline can be picked.

Two things make picking fair on a small screen: the **topmost visible** structure under the finger is the one chosen, and a structure smaller than a comfortable finger target (the gallbladder, the adrenal glands, a nerve) is given a larger tap area around it.

### `pickMany`: choose several

```js
widget: { type: 'body-map', view: 'torso', mode: 'pickMany', show: ['digestive'], names: true, max: 3, answer: ['liver', 'gallbladder', 'pancreas'] },
check: (s) => s.picked.join() === 'gallbladder,liver,pancreas' || (s.count < 3 ? 'There are three of them.' : false),
solution: { picked: ['liver', 'gallbladder', 'pancreas'] },
```

**State:** `{ picked: ['gallbladder', 'liver', 'pancreas'], count: 3 }`. `picked` is always **sorted**, so compare with a sorted list. `max` limits the number. A *Clear* button is provided. For feedback that counts: `const right = s.picked.filter((id) => WANT.includes(id)).length;`.

### `pickMarker` and `pickMarkers`: which of these points?

```js
{ id: 'pulse-where', type: 'interact', text: 'At which of these points can a pulse be felt most easily? **Tap it.**',
  widget: { type: 'body-map', view: 'body', mode: 'pickMarker', show: [], markerLabels: 'after', answer: 'b',
            markers: [{ id: 'a', at: 'forehead', label: 'Forehead' }, { id: 'b', at: 'pulse-wrist:left', label: 'Wrist' },
                      { id: 'c', at: 'knee:left', label: 'Kneecap' }, { id: 'd', at: 'navel', label: 'Navel' }],
            alt: 'The outline of a body with four lettered points' },
  check: (s) => s.picked === 'b',
  solution: { picked: 'b' } }
```

**State:** `{ picked: 'b' | null }`, or for `pickMarkers` `{ picked: ['a', 'c'], count: 2 }` (sorted). Only markers with an `id` can be chosen (`pickable: ['a', 'b']` narrows it further). With `markerLabels: 'after'` the markers carry letters A, B, C … in the order you list them until the step is over, so your feedback can say "point B is the wrist".

### `place`: put a marker where something is

```js
{ id: 'compressions', type: 'interact',
  text: 'A person has collapsed and is not breathing. **Put the marker where your hands go for chest compressions.**',
  widget: { type: 'body-map', view: 'torso', mode: 'place', show: ['ribs', 'breastbone'], ghost: ['ribs'],
            pin: { label: 'Hands', color: 'red' }, target: 'chest-centre',
            alt: 'The chest and abdomen, with the ribs and breastbone faintly shown' },
  check: (s) => (s.placed && s.distance <= 4) || (!s.placed ? 'Move the marker first.' : s.region === 'abdomen' ? 'Too low: that is the abdomen. Press on the breastbone.' : s.distance <= 9 ? 'Close. Aim for the middle of the chest, on the lower half of the breastbone.' : false),
  solution: { at: 'chest-centre' } }
```

**State:** `{ at: [200, 262], placed: true, structure: 'breastbone', region: 'chest', side: null, distance: 0, nearest: 'target', distances: { target: 0 } }`

- `at` is where the marker stands, in the view's coordinates; `placed` is false until the learner has moved it (it starts near the bottom of the picture, or at `pin.start`).
- `structure` is the topmost visible structure under the marker (`null` on bare skin or off the figure). It depends on what is shown.
- `region` and `side` name the part of the body surface under the marker, whatever is shown: `head`, `neck`, `shoulder`, `chest`, `abdomen`, `pelvis`, `upper-arm`, `elbow`, `forearm`, `wrist`, `hand`, `thigh`, `knee`, `lower-leg`, `ankle`, `foot`; from behind `upper-back`, `lower-back` and `buttocks` take the place of chest, abdomen and pelvis. `side` is the person's `'left'` or `'right'`, or `null` on the midline. Both are `null` off the figure and in the `head` and schematic views.
- `target: 'chest-centre'` (an anchor, a structure or `[x, y]`) adds `distance`, in **centimetres on an adult about 170 cm tall** (one decimal). A target that exists on both sides counts from the nearer one: `target: 'pulse-wrist'` accepts either wrist, `'pulse-wrist:left'` only the left.
- `targets: [{ id: 'neck', at: 'pulse-neck', label: 'the neck' }, { id: 'wrist', at: 'pulse-wrist', label: 'the wrist' }]` gives `distances` to each, the `nearest` id and `distance` to that nearest one: "where could you check a pulse?" then passes with `s.distance <= 3`.
- In the `heart`, `lungs-detail`, `skin` and `cell` views there is no real scale: `distance` is in per cent of the picture's width.
- `solution` takes `{ at: 'chest-centre' }` (an anchor) or `{ at: [200, 262] }`.

The learner drags the marker, taps the figure, or focuses the marker and uses the arrow keys (Shift for bigger steps). **Be generous with the tolerance**: see [the table of what a finger can hit](#what-reads-well-on-a-phone).

### Looking without a grade

`mode: 'view'` (the default) has state `{}`. For "look at this, then continue" use an `info` step with the figure as its `figure`. Any mode with `graded: false` on the step makes a goal without a mark.

---

## After the answer

When a step is resolved the player freezes the widget, and the figure then **reveals**:

- the names of the picked structures and of the `answer` (the answer gets a green dashed outline, and whatever hides it turns see-through);
- all marker labels hidden by `markerLabels: 'after'`, and a dashed ring round the `answer` marker;
- in `place` mode the target, a dashed line from the marker to it and the distance;
- names on hover and tap, everywhere on the figure;
- a sentence under the figure that says the same in words ("You picked the stomach. The answer: the liver (dashed outline).").

`answer` is only ever used for this display. It does not grade anything, so keep it in step with your `check`. `reveal: false` switches the whole reveal off.

`setState({ reveal: true })` (or `false`) forces the reveal on or off without freezing, for figures you drive yourself.

---

## Layer buttons and zoom

```js
toggles: ['skeleton', 'muscles', 'organs'],     // one button per system, alias or structure
toggles: true,                                  // the seven systems that make sense on the whole figure
zoom: true,                                     // zoom buttons, pinch, Ctrl + wheel; drag to pan once zoomed in
```

`toggles` adds buttons under the figure that switch layers on and off. They start pressed for whatever `show` switched on. Zoom is on by default in the whole-figure views (`body`, `torso`, `back` …) and off in the schematics and when you give `bounds`; `zoom: false` removes it. **Both keep working after the step is answered**, so a learner can look closer at the explanation.

`static: true` makes the figure a plain picture: nothing reacts. Inside an answer option it always is.

---

## Helpers for lesson files

```js
import { structureName, structureNameThe, structureInfo, structureIds, anchorIds, expandIds } from '../../../../src/widgets/body-map.js';

structureName('windpipe')                  // 'Windpipe'
structureName('windpipe', 'scientific')    // 'Trachea'          ('both' → 'Windpipe (trachea)')
structureNameThe('small-intestine')        // 'the small intestine': the name as it reads inside a sentence
structureInfo('pancreas')                  // { id: 'pancreas', kind: 'structure', name: 'Pancreas', scientific: 'pancreas', system: 'digestive',
                                           //   systems: ['digestive', 'endocrine'], side: null, layer: null, note: 'The pancreas makes digestive enzymes and …' }
structureInfo('left-lung').side            // 'left'    ('both' for something drawn on both sides, such as 'femur'; null for one in the middle)
structureInfo('pulse-wrist')               // anchors too: { kind: 'anchor', name: 'Wrist pulse', scientific: 'radial pulse', side: 'both', … }
structureIds('digestive')                  // ['appendix', 'epiglottis', 'food-pipe', …] sorted; no argument: every structure
structureIds('female')                     // ['ovaries', 'uterus']
anchorIds('circulatory')                   // ['pulse-arm', 'pulse-foot', 'pulse-groin', 'pulse-neck', 'pulse-wrist']
expandIds(['lungs', 'heart'])              // ['right-lung', 'left-lung', 'heart']
```

Use `structureName` and `structureInfo(id).note` in generated questions and feedback instead of typing names again: a choice question built from `structureIds('skeleton')` then always agrees with the figure.

```js
// "What is this?" with the figure as the question and four names as the options
gen: (rng) => {
  const ids = rng.sample(['liver', 'stomach', 'spleen', 'pancreas', 'gallbladder', 'bladder'], 4);
  return { text: 'Which organ is highlighted?',
           figure: { type: 'body-map', view: 'torso', show: ['organs'], groups: [{ ids: [ids[0]], color: 'orange' }], static: true, alt: 'The organs of the trunk with one of them highlighted' },
           options: ids.map((id, i) => ({ text: structureName(id), correct: i === 0 })) };
}
```

Two helpers need the geometry, which for the five smaller views is loaded on demand:

```js
import { loadView, structureAt, anchorPoint } from '../../../../src/widgets/body-map.js';
await loadView('head');                               // not needed for the body and back views
structureAt('torso', [160, 306])                      // 'liver': what a tap there would hit (optionally { show: ['digestive'] })
anchorPoint('body', 'chest-centre')                   // [200, 262]
```

---

## Identifiers

Ids are stable: lessons may rely on them. Each has a plain English name and, where it differs, a scientific name; `naming` chooses which one is printed. "Views" says where a structure is drawn (`body` stands for all the front views, `back` for both back views).

<!-- ids:start -->
### Skin (`skin`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `skin` | Skin |  | body, back, head |
| `epidermis` | Outer skin layer | epidermis | skin |
| `dermis` | Inner skin layer | dermis | skin |
| `fat-layer` | Fat layer | subcutaneous tissue | skin |
| `hair` | Hair |  | skin |
| `hair-follicle` | Hair follicle |  | skin |
| `sweat-gland` | Sweat gland |  | skin |
| `sweat-pore` | Sweat pore |  | skin |
| `oil-gland` | Oil gland | sebaceous gland | skin |
| `skin-vessels` | Blood vessels of the skin |  | skin |
| `nerve-endings` | Nerve endings | sensory receptors | skin |

### Skeleton (`skeleton`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `skull` | Skull | cranium | body, back, head |
| `jaw` | Lower jaw | mandible | body, head |
| `cervical-spine` | Neck vertebrae | cervical spine | body, back, head |
| `thoracic-spine` | Chest vertebrae | thoracic spine | body, back |
| `lumbar-spine` | Lower-back vertebrae | lumbar spine | body, back |
| `sacrum` | Sacrum |  | body, back |
| `tailbone` | Tailbone | coccyx | body, back |
| `ribs` | Ribs |  | body, back |
| `breastbone` | Breastbone | sternum | body |
| `collarbone` | Collarbone | clavicle | body, back |
| `shoulder-blade` | Shoulder blade | scapula | body, back |
| `humerus` | Upper arm bone | humerus | body, back |
| `radius` | Radius |  | body, back |
| `ulna` | Ulna |  | body, back |
| `hand-bones` | Hand bones | carpals, metacarpals and phalanges | body, back |
| `pelvis` | Pelvis |  | body, back |
| `femur` | Thigh bone | femur | body, back |
| `kneecap` | Kneecap | patella | body |
| `tibia` | Shin bone | tibia | body, back |
| `fibula` | Calf bone | fibula | body, back |
| `foot-bones` | Foot bones | tarsals, metatarsals and phalanges | body, back |

Anchor points:

| id | Name | Scientific name | Both sides | Views |
|----|------|-----------------|:----------:|-------|
| `shoulder-joint` | Shoulder joint |  | yes | body, back |
| `elbow-joint` | Elbow joint |  | yes | body, back |
| `wrist-joint` | Wrist joint |  | yes | body, back |
| `hip-joint` | Hip joint |  | yes | body, back |
| `knee-joint` | Knee joint |  | yes | body, back |
| `ankle-joint` | Ankle joint |  | yes | body, back |

### Muscles (`muscles`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `deltoid` | Shoulder muscle | deltoid | body, back |
| `pectorals` | Chest muscles | pectoralis major | body |
| `biceps` | Biceps | biceps brachii | body |
| `triceps` | Triceps | triceps brachii | back |
| `forearm-muscles` | Forearm muscles |  | body, back |
| `abdominals` | Abdominal muscles | rectus abdominis | body |
| `obliques` | Side abdominal muscles | obliques | body |
| `quadriceps` | Front thigh muscles | quadriceps | body |
| `hamstrings` | Back thigh muscles | hamstrings | back |
| `glutes` | Buttock muscles | gluteal muscles | back |
| `calves` | Calf muscles | gastrocnemius and soleus | body, back |
| `trapezius` | Trapezius |  | body, back |
| `latissimus` | Broad back muscle | latissimus dorsi | back |

Also in this system: `diaphragm`, `heart-muscle`.

### Circulatory system (`circulatory`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `heart-muscle` | Heart muscle | myocardium | heart |
| `heart` | Heart |  | body |
| `aorta` | Aorta |  | body, heart |
| `arteries` | Main arteries |  | body |
| `veins` | Main veins |  | body |
| `superior-vena-cava` | Upper main vein | superior vena cava | body, heart |
| `inferior-vena-cava` | Lower main vein | inferior vena cava | body, heart |
| `pulmonary-artery` | Lung artery | pulmonary artery | heart |
| `pulmonary-veins` | Lung veins | pulmonary veins | heart |
| `right-atrium` | Right atrium |  | heart |
| `right-ventricle` | Right ventricle |  | heart |
| `left-atrium` | Left atrium |  | heart |
| `left-ventricle` | Left ventricle |  | heart |
| `septum` | Septum |  | heart |
| `tricuspid-valve` | Tricuspid valve |  | heart |
| `pulmonary-valve` | Pulmonary valve |  | heart |
| `mitral-valve` | Mitral valve |  | heart |
| `aortic-valve` | Aortic valve |  | heart |
| `lung-capillaries` | Lung capillaries | pulmonary capillaries | lungs-detail |

Also in this system: `skin-vessels`.

Anchor points:

| id | Name | Scientific name | Both sides | Views |
|----|------|-----------------|:----------:|-------|
| `pulse-neck` | Neck pulse | carotid pulse | yes | body |
| `pulse-arm` | Upper-arm pulse | brachial pulse | yes | body |
| `pulse-wrist` | Wrist pulse | radial pulse | yes | body |
| `pulse-groin` | Groin pulse | femoral pulse | yes | body |
| `pulse-foot` | Foot pulse | dorsalis pedis pulse | yes | body |

### Respiratory system (`respiratory`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `diaphragm` | Diaphragm |  | body |
| `nose` | Nose | nasal cavity | body, head |
| `throat` | Throat | pharynx | head |
| `epiglottis` | Epiglottis |  | head |
| `voice-box` | Voice box | larynx | body, head |
| `windpipe` | Windpipe | trachea | body, head, lungs-detail |
| `bronchi` | Bronchi |  | body, lungs-detail |
| `bronchioles` | Small airways | bronchioles | lungs-detail |
| `right-lung` | Right lung |  | body, back, lungs-detail |
| `left-lung` | Left lung |  | body, back, lungs-detail |
| `air-sacs` | Air sacs | alveoli | lungs-detail |

Also in this system: `lung-capillaries`.

### Digestive system (`digestive`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `mouth` | Mouth | oral cavity | body, head |
| `teeth` | Teeth |  | head |
| `tongue` | Tongue |  | head |
| `salivary-glands` | Salivary glands |  | body, head |
| `food-pipe` | Food pipe | oesophagus | body, head |
| `stomach` | Stomach |  | body |
| `liver` | Liver |  | body |
| `gallbladder` | Gallbladder |  | body |
| `pancreas` | Pancreas |  | body |
| `small-intestine` | Small intestine |  | body |
| `large-intestine` | Large intestine | colon | body |
| `appendix` | Appendix |  | body |
| `rectum` | Rectum |  | body |

Also in this system: `throat`, `epiglottis`.

### Urinary system (`urinary`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `right-kidney` | Right kidney |  | body, back |
| `left-kidney` | Left kidney |  | body, back |
| `ureters` | Ureters |  | body |
| `bladder` | Bladder |  | body |

### Nervous system (`nervous`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `brain` | Brain |  | body, back |
| `frontal-lobe` | Frontal lobe |  | head |
| `parietal-lobe` | Parietal lobe |  | head |
| `temporal-lobe` | Temporal lobe |  | head |
| `occipital-lobe` | Occipital lobe |  | head |
| `cerebellum` | Cerebellum |  | head |
| `brainstem` | Brainstem |  | head |
| `hypothalamus` | Hypothalamus |  | head |
| `spinal-cord` | Spinal cord |  | body, back, head |
| `nerves` | Main nerves |  | body, back |
| `eye` | Eye |  | body, head |
| `ear` | Ear |  | body, head |

Also in this system: `nerve-endings`.

### Endocrine system (`endocrine`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `pituitary` | Pituitary gland |  | head |
| `thyroid` | Thyroid gland |  | body, head |
| `adrenals` | Adrenal glands |  | body, back |

Also in this system: `pancreas`, `hypothalamus`, `thymus`, `ovaries`, `testes`.

### Immune and lymphatic system (`immune`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `tonsils` | Tonsils |  | head |
| `thymus` | Thymus |  | body |
| `spleen` | Spleen |  | body |
| `lymph-nodes-neck` | Neck lymph nodes |  | body |
| `lymph-nodes-armpit` | Armpit lymph nodes |  | body |
| `lymph-nodes-groin` | Groin lymph nodes |  | body |

Anchor points:

| id | Name | Scientific name | Both sides | Views |
|----|------|-----------------|:----------:|-------|
| `bone-marrow` | Bone marrow |  | yes | body, back |

### Reproductive system (`reproductive`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `ovaries` (layer `female`) | Ovaries |  | body |
| `uterus` (layer `female`) | Womb | uterus | body |
| `testes` (layer `male`) | Testicles | testes | body |
| `prostate` (layer `male`) | Prostate gland |  | body |

### Cell (`cell`)

| id | Name | Scientific name | Views |
|----|------|-----------------|-------|
| `cell-membrane` | Cell membrane |  | cell |
| `cytoplasm` | Cytoplasm |  | cell |
| `nucleus` | Nucleus |  | cell |
| `mitochondria` | Mitochondria |  | cell |
| `ribosomes` | Ribosomes |  | cell |
| `endoplasmic-reticulum` | Endoplasmic reticulum |  | cell |
| `golgi` | Golgi apparatus |  | cell |
| `lysosomes` | Lysosomes |  | cell |

### Places on the body surface (anchor points)

| id | Name | Both sides | Views |
|----|------|:----------:|-------|
| `forehead` | Forehead |  | body, head |
| `temple` | Temple | yes | body, head |
| `chin` | Chin |  | body, head |
| `neck-front` | Front of the neck |  | body, head |
| `shoulder` | Shoulder | yes | body, back |
| `armpit` | Armpit | yes | body |
| `breast` | Breast | yes | body |
| `chest-centre` | Centre of the chest |  | body |
| `right-upper-chest` | Right upper chest |  | body |
| `left-side-chest` | Left side of the chest |  | body |
| `upper-abdomen` | Upper abdomen |  | body |
| `navel` | Navel |  | body |
| `lower-abdomen` | Lower abdomen |  | body |
| `upper-arm` | Upper arm | yes | body, back |
| `inner-elbow` | Inner elbow | yes | body |
| `forearm` | Forearm | yes | body, back |
| `wrist` | Wrist | yes | body, back |
| `palm` | Palm | yes | body |
| `fingertip` | Fingertip | yes | body, back |
| `hip` | Hip | yes | body, back |
| `groin` | Groin | yes | body |
| `thigh` | Thigh | yes | body |
| `knee` | Knee | yes | body |
| `shin` | Shin | yes | body |
| `ankle` | Ankle | yes | body, back |
| `foot-top` | Top of the foot | yes | body |
| `toes` | Toes | yes | body |
| `back-of-head` | Back of the head |  | back, head |
| `nape` | Back of the neck |  | back, head |
| `between-shoulder-blades` | Between the shoulder blades |  | back |
| `upper-back` | Upper back | yes | back |
| `lower-back` | Lower back |  | back |
| `elbow` | Elbow | yes | back |
| `back-of-hand` | Back of the hand | yes | back |
| `buttock` | Buttock | yes | back |
| `back-of-thigh` | Back of the thigh | yes | back |
| `back-of-knee` | Back of the knee | yes | back |
| `calf` | Calf | yes | back |
| `heel` | Heel | yes | back |

### Aliases

| Alias | Stands for |
|-------|------------|
| `lungs` | `right-lung`, `left-lung` |
| `kidneys` | `right-kidney`, `left-kidney` |
| `spine` | `cervical-spine`, `thoracic-spine`, `lumbar-spine`, `sacrum`, `tailbone` |
| `cerebrum` | `frontal-lobe`, `parietal-lobe`, `temporal-lobe`, `occipital-lobe` |
| `venae-cavae` | `superior-vena-cava`, `inferior-vena-cava` |
| `heart-chambers` | `right-atrium`, `right-ventricle`, `left-atrium`, `left-ventricle` |
| `heart-valves` | `tricuspid-valve`, `pulmonary-valve`, `mitral-valve`, `aortic-valve` |
| `lymph-nodes` | `lymph-nodes-neck`, `lymph-nodes-armpit`, `lymph-nodes-groin` |
| `intestines` | `small-intestine`, `large-intestine`, `appendix`, `rectum` |
| `airways` | `nose`, `throat`, `voice-box`, `windpipe`, `bronchi` |
| `arm-bones` | `humerus`, `radius`, `ulna`, `hand-bones` |
| `leg-bones` | `femur`, `kneecap`, `tibia`, `fibula`, `foot-bones` |
| `female` | `ovaries`, `uterus` |
| `male` | `testes`, `prostate` |
| `organs` | `brain`, `windpipe`, `bronchi`, `right-lung`, `left-lung`, `heart`, `diaphragm`, `liver`, `gallbladder`, `stomach`, `spleen`, `pancreas`, `small-intestine`, `large-intestine`, `appendix`, `rectum`, `right-kidney`, `left-kidney`, `bladder` |

<!-- ids:end -->

---

## What reads well on a phone

On a phone the figure is at most 360 px wide; the whole body is then some 500 px tall, its liver 60 px across and its gallbladder 9 px. The widget keeps outlines, text, markers and tap areas the same size on screen however small the figure gets, so the same spec *works* everywhere, but it cannot make a crowded picture legible. Design for the phone first.

**How precise can a finger be?** A tap is good to about ±10 px.

| View | 1 cm of body on a phone is about | Sensible tolerance for `place` |
|------|----------------------------------|--------------------------------|
| `body`, `back` (whole figure) | 2 to 3 px | 5 to 8 cm ("the right part of the right limb") |
| `torso`, `back-torso` | 4 px with names beside it, 7 px without | 3 to 4 cm |
| `chest`, `abdomen` | 10 px | 2 to 3 cm |
| `head` | 11 px | 2 cm |

- **Choose the smallest view that contains the question.** Organs belong on `torso`, not on `body`. Use `body` for the skeleton, the muscles, pulse points and first-aid positions.
- **Show one or two systems, not six.** Every extra layer hides something. If the step is about the kidneys, show the urinary system and perhaps the spine and lowest ribs for orientation.
- **Six to eight labels is plenty**, three or four to a side, in plain names. On a phone, names beside the figure fit the tall views (`body`, `torso`, `back`); the wider ones (`head`, `heart`, `chest`, the schematics) usually switch to numbers with a key, which reads well and leaves the figure large. Scientific names and `naming: 'both'` are long: expect the key.
- **Restrict `pickable`** to the plausible candidates when the answer has small neighbours: fewer wrong targets under a thumb.
- **Markers need room.** Two markers closer than about 25 px on the phone (8 cm on the whole body, 4 cm on the torso) are hard to tell apart and hard to tap.
- **Small structures on the whole body are too small to ask for.** The gallbladder, the adrenal glands, the pituitary and single valves can be picked in `torso`, `head` and `heart`; on `body` only ask for things at least as large as a kidney.
- **In answer options** the figure is a thumbnail about 100 px wide: highlight one bold thing per option (`groups` with one organ, or one marker) and leave labels out (they are not drawn at that size anyway).
- **Write the `alt` text** as if the figure were not there: "The digestive organs; the liver and the pancreas are highlighted." For a quiz, describe without giving the answer away: "The organs of the chest and abdomen, without names."

On a laptop the figure sits beside the text and is sized to fit a 1366 × 700 window without scrolling, whatever its proportions. Tall figures (`body`, `back`) become narrow there; that is expected.

---

## Accessibility

- The parts of the figure (or the markers) are a **single stop in the tab order**, followed by the zoom buttons, the step controls and the layer buttons. With the focus on the figure, the **arrow keys** move from one part to the next in the direction pressed, **Enter** or **Space** chooses (or reads, in explore mode), **Home/End** jump to the first and last, **+ / − / 0** zoom. Where names are shown, typing the first letters of a name jumps to it.
- A screen reader hears the parts as a list of options. Where names are part of the question they are announced by position instead ("Structure 4 of 19: abdomen, on the person's right"), and by name once the step is over.
- The marker of `place` mode is a slider that speaks the region it is on; arrow keys move it.
- Every change is announced (`env.announce`), and the sentence or panel under the figure states the selection in words, so nothing depends on colour or on sight of the picture alone.
- `alt` becomes the description of the figure; the widget adds the labelled groups, markers and flows to it.
- Flows do not rely on motion: with reduced motion the dots stand still and the arrowheads remain.

Finding an organ by its position is still a visual task. Where that matters, pair the figure step with a question that can be answered from the text.

---

## What the drawings simplify

The figures are teaching schematics in the style of the rest of the site, not a medical atlas: clarity comes before detail. Positions, sides and relative sizes are those of a textbook; these are the liberties taken, so that lesson text does not claim more than the picture shows.

- **The figure** is an adult of average proportions, without sex or particular ethnicity, standing with the palms forward (the anatomical position): the thumbs point away from the body, so the radius and the wrist pulse are on the outer side of the forearm.
- **Skeleton.** The hand and the foot are drawn with a few bones each, not 27 and 26. From the front ten pairs of ribs are drawn; the two lowest ("floating") pairs are short and reach only part of the way round, so they appear only in the view from behind. The pelvis is one shape for both hip bones; the sacrum and tailbone are separate.
- **Muscles** are the large surface groups only, a dozen of some 600. From the front, `calves` is the edge of the calf visible on either side of the shin; from behind it is the whole muscle. `trapezius` from the front is only its upper edge between neck and shoulder.
- **Blood vessels.** `arteries` and `veins` are the main trunks to the head, arms, kidneys and legs, drawn side by side; the real vessels branch thousands of times. Vessel colours follow the convention: red for oxygen-rich, blue for oxygen-poor blood (so the pulmonary artery is blue and the pulmonary veins are red).
- **Nerves.** `nerves` is a handful of main lines from the spinal cord to the limbs and between the ribs.
- **Digestive organs.** The coils of the small intestine are a tidy schematic (the real thing is about 6 m long and fills the space inside the frame of the large intestine). Most of the pancreas lies behind the stomach, and the kidneys behind the intestines and (on the right) the liver: see [Overlapping organs](#overlapping-organs).
- **The diaphragm** is drawn as its upper edge: a band arching under the lungs and the heart, over the liver and the stomach.
- **The `head` view** is the usual textbook hybrid. Nose, mouth, throat and neck are a slice through the midline, where only the front teeth are cut; the brain shows its outer surface with the four lobes. The hypothalamus and the pituitary gland lie deep in the middle of the head and are drawn on top of the brain at the place where they would be found inside. The outer ear, which is on the side of the head, is drawn as an outline over the place where it sits. Of the salivary glands, three of the largest are shown on one side.
- **The `heart` view** spreads the chambers apart and straightens the vessels. It keeps the right heart on the viewer's left, the thicker left ventricle, the vessels joined to the correct chambers and the aorta arching over the pulmonary artery. Two pulmonary veins are shown on each side; the aorta is cut short after its arch.
- **The `lungs-detail` view** shows a few generations of branching (real airways divide more than twenty times) and one cluster of air sacs, enormously enlarged, of some hundreds of millions.
- **The `skin` and `cell` views** show one or a few of each part: real skin is far more crowded and differs from place to place on the body, and a real cell holds hundreds of mitochondria and millions of ribosomes.
- **Reproductive layers** show the ovaries and womb, or the testicles and prostate gland, as simply as the other organs; nothing else.
- **Distances** in `place` mode are measured on the drawing and converted with one scale (170 cm for the whole figure). They are good to a centimetre or two, which is also all a finger on a screen can do.

---

## The artwork

All artwork is original and drawn in code: there are no image files, and nothing is traced or copied from an existing illustration. A structure is a few dozen coordinates that `assets/body/draw.js` turns into smooth outlines, so the figures follow the theme colours, scale to any size and can be hit-tested without the browser.

| File | Size | Loaded |
|------|------|--------|
| `src/widgets/body-map.js` | 120 KB | with the first body-map on a page: the widget |
| `assets/body/structures.js` | 30 KB | always: names, systems, notes, natural colours |
| `assets/body/draw.js` | 17 KB | always: outlines from points, hit testing |
| `assets/body/front.js`, `back.js` | 24 KB, 8 KB | always: the whole figure, front and back |
| `assets/body/head.js`, `heart.js`, `lungs.js`, `skin.js`, `cell.js` | 2 to 7 KB each | when their view is first used |

A figure is in the page a few milliseconds after its step opens (the very first one of a visit takes some tens of milliseconds on a slow phone, more with many systems switched on at once); the list of parts for the keyboard and for screen readers is put together just after that.

To correct a shape, edit its points in the drawing's file (the header comment of each explains its coordinates) and look at the result with `debug: true`. To correct a name or a note, edit `structures.js`. `tests/body-map.test.mjs` checks that every id has a name, a system, a note, a shape in at least one view and a label point inside its shape, and that the organs are on the correct side of the body.
