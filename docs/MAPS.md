# Maps: the `world-map` widget

One widget draws every map in Learntopia: a picture of the world or of a region, a map to explore, and the answer area of graded steps (tap a country, tap a marker, place a pin, trace a route). You describe the map with a plain object; nothing is drawn by hand.

```js
{ type: 'world-map', view: 'africa',
  regions: [{ ids: ['EG', 'SD'], color: 'orange', label: 'Nile countries' }],
  alt: 'A map of Africa with Egypt and Sudan highlighted' }
```

It is used like any other widget ([WIDGETS.md](WIDGETS.md)): as a `figure` on any step, as the `widget` of an `interact` step, or small inside a choice option. See every option live at `#/dev/widgets` (search for *world-map*). The header comment of `src/widgets/world-map.js` is the compact reference; this page is the guide.

**Contents:** [What to show](#what-to-show) · [Colouring countries](#colouring-countries) · [Names and labels](#names-and-labels) · [Markers, lines, areas](#markers-lines-and-areas) · [Graded steps](#graded-steps) · [After the answer](#after-the-answer) · [Helpers for checks](#helpers-for-lesson-files) · [Identifiers](#identifiers) · [Disputed areas](#disputed-and-special-areas) · [What reads well on a phone](#what-reads-well-on-a-phone) · [Accessibility](#accessibility) · [The data](#the-data)

---

## What to show

### `view`

| You write | You get |
|-----------|---------|
| nothing, or `view: 'world'` | the whole world |
| `view: 'europe'` | a named window (list below) |
| `view: [20, 2, 50, 34]` | `[west, south, east, north]` in degrees. East may be smaller than west to cross the date line: `[150, -30, -150, 30]` |
| `view: 'EG'` or `view: ['EG', 'SD', 'ET']` | fitted to those countries (codes and region names can be mixed) |
| `view: { ids: ['EG', 'SD'], pad: 0.3 }` | the same with more or less margin (`pad` is a fraction of the size; default 0.12) |
| `view: { center: [39.8, 21.4], span: 50 }` | centred on a point (or a place name: `center: 'Mecca'`); `span` is the width of the map in degrees of arc (1° ≈ 111 km) |

Named views: `world`, `africa`, `north-africa`, `west-africa`, `east-africa`, `central-africa`, `southern-africa`, `sub-saharan-africa`, `europe`, `western-europe`, `northern-europe`, `southern-europe`, `eastern-europe`, `balkans`, `british-isles`, `scandinavia`, `mediterranean`, `asia`, `middle-east`, `central-asia`, `south-asia`, `east-asia`, `southeast-asia`, `north-america`, `usa` (the 48 contiguous states), `central-america`, `caribbean`, `central-america-caribbean`, `south-america`, `latin-america`, `oceania`, `australia`, `pacific`, `atlantic`, `indian-ocean`, `arctic`, `antarctica`.

A view is a *window*, not a list of members: `view: 'europe'` stops at the Urals although all of Russia belongs to `countryIds('europe')`. A country fitted by code is fitted to its main body: `view: 'FR'` shows France without French Guiana, `view: 'US'` the United States without Hawaii.

The drawing takes the proportions of the view (between 0.8 and 2.4 wide for 1 high). Override with `aspect: 1.5`; cap the size with `maxWidth: 480` (px).

### `projection`

Leave it out and you get **Equal Earth** for the world (countries keep their true relative sizes) and an **equal-area azimuthal** projection centred on the region for everything smaller, which keeps shapes honest anywhere on the globe, the poles included.

Name one when the projection is the point of the lesson:

```js
{ type: 'world-map', projection: 'mercator',  regions: [{ ids: ['GL'], color: 'blue' }, { ids: 'africa', color: 'orange' }] }
{ type: 'world-map', projection: 'orthographic', center: [20, 25], regions: [/* the same */] }     // a globe
```

| `projection` | What it is |
|--------------|-----------|
| `equal-earth` | equal-area, the default for the world |
| `natural-earth` | a compromise projection (neither areas nor angles exact, both pleasant) |
| `mercator` | angles true, areas wildly wrong near the poles; the world view is cut off at 84° N and 58° S |
| `equirectangular` | longitude and latitude as x and y |
| `gall-peters` | equal-area cylinder: sizes true, shapes stretched |
| `orthographic` | a globe. The learner can drag it round (or use the arrow buttons) |
| `azimuthal-equal-area` | the default for regions; with `view: 'world'` it shows the whole globe as a disc |
| `azimuthal-equidistant` | distances and directions from the centre are true (default centre: the North Pole) |

`center: [lon, lat]` moves the centre of the projection. For the flat world maps only the longitude matters, and a number is enough: `center: 150` gives a Pacific-centred world. Countries cut by the edge of the map are split correctly.

**When a parallel or a meridian must look straight.** The default projection for a region is drawn as if seen from above its centre, so lines of latitude come out as gentle arcs: the 49th parallel between Canada and the United States bends, and so do the tropics on a map of Africa. That is faithful (a parallel *is* a curve on a globe), but if the point of the map is a straight line (a border along a parallel, a time-zone meridian, "everything north of 60°") say so:

```js
{ type: 'world-map', view: [-130, 40, -60, 56], projection: 'mercator', parallels: [{ lat: 49, label: '49° N' }] }
```

`'mercator'` keeps both parallels and meridians straight and shapes true, and is the usual choice for a region; `'equirectangular'` does the same with evenly spaced latitudes (shapes look squashed towards the poles). Away from the equator both make the north of the map look larger than the south, which hardly shows on a map a few countries tall.

### Detail

Two sets of shapes ship with the site. Whole-world maps use the small one (1:110 million). Regional views automatically load the detailed one (1:50 million, about 230 KB, fetched once and cached), in which every country has a shape. The map appears at once with the coarse shapes and sharpens a moment later. Force a choice with `detail: 'low'` or `detail: 'high'`.

At world scale 62 small countries and territories have no shape at all (Singapore, Malta, Bahrain, most island states: marked ° in the [table](#identifiers)). They are drawn as small **rings** when they matter: when you list them by code anywhere in the spec, when they belong to a coloured group or to `pickable` on a regional map, or when a regional map is explored or used for picking. `dots: true` shows all of them, **`dots: false` none: use that on maps of routes and events**, where rings would look like markers nobody explains. A ring has a generous tap area, so Malta can be picked on a phone.

### Other switches

```js
borders: false,        // coastlines only
graticule: true,       // lines of longitude and latitude; or a step in degrees: graticule: 15
lakes: false,          // lakes are drawn by default
rivers: true,          // the major rivers, unlabelled
rivers: ['Nile', 'Tigris', 'Euphrates'],     // only these, drawn bold and labelled
oceans: true,          // print the names of the oceans
continents: true,      // print the names of the continents
zoom: false,           // no zoom buttons, no pinch, no panning
static: true,          // a picture: nothing reacts at all
```

River names are English ("Yellow River", "Yangtze", "Danube", "Euphrates"); the 300 or so available are listed in `assets/geo/rivers.js`. Rivers load on demand, like the detailed shapes.

---

## Colouring countries

```js
regions: [
  { ids: ['EG', 'SD', 'SS', 'ET', 'UG'], color: 'orange', label: 'Countries on the Nile' },
  { ids: 'western-europe', color: 'blue', tone: 'soft' },          // a region name; tone: 'soft' is a pale tint
  { ids: ['asia', 'RU'], color: 'green', label: 'Asia and Russia' },
],
dim: true,        // grey out everything else (the default as soon as there is a group)
legend: true,     // list the labelled groups, areas and lines under the map (the default; legend: false hides it)
```

**Overseas parts.** In the data a country is everything it governs: France includes French Guiana, Réunion and its Caribbean islands; the United States includes Hawaii; Spain the Canary Islands. So colouring `'europe'` paints a patch of South America, and a tap there picks France. When that is not what the map is about, add `mainBodyOnly`:

```js
regions: [{ ids: 'europe', color: 'violet', label: 'Europe', mainBodyOnly: true }],     // French Guiana stays plain land
```

```js
{ type: 'world-map', mode: 'pick', pickable: 'europe', mainBodyOnly: true }     // for the whole map: every group, and overseas parts cannot be tapped
```

The main body of a country is its largest piece and everything within about 800 km of it, piece by piece: Corsica with France, Alaska and the Aleutians with the United States, Svalbard with Norway, both halves of Malaysia; not French Guiana, Hawaii, the Canary Islands, the Azores or the Galápagos. The overseas parts are still drawn (as plain land) and still belong to the country in the data: `countryAt()` and the `country` of place mode report `FR` in French Guiana. In a check, tell them apart with `inMainBody(point, 'FR')` (see [helpers](#helpers-for-lesson-files)). The default is `false`, and a map without the option is drawn exactly as before.

Colours are the palette names: `blue red green orange violet teal pink yellow gray`. They follow the light and dark themes. A country in two groups takes the colour of the later one. Never let colour carry the meaning alone: give groups a `label` (it goes into the legend and into the description for screen readers).

---

## Names and labels

```js
labels: ['EG', 'SD'],                    // print these countries' names
labels: true,                            // every member of a coloured group whose name fits inside it
labels: 'all',                           // every country whose name fits
labels: ['south-asia', { id: 'MM', text: 'Burma' }, { at: [25, 23], text: 'Sahara', style: 'area' }, { at: [58, 18], text: 'Arabian Sea', style: 'water' }],
```

Names you ask for by code are always printed (they move aside when two collide); names from `true` and `'all'` are dropped when they do not fit, so the same spec works on a phone. Free text takes `style: 'area'` (spaced capitals, for deserts and regions) or `'water'` (blue italics).

**`names`** decides whether a learner can find out what a country is called by hovering, tapping or moving to it with the keyboard:

- in the default `mode: 'view'` names are **on**: the map is something to explore;
- in every other mode names are **off**, so that "tap Egypt" cannot be solved by sweeping the pointer over Africa. Set `names: true` when the names are not the question ("tap the three largest countries of South America").

---

## Markers, lines and areas

### Markers

```js
markers: [
  { at: 'Cairo', label: 'Cairo' },                                        // a place from the table
  { id: 'giza', at: [31.13, 29.98], label: 'Giza', color: 'blue', shape: 'square', labelPos: 'left' },
],
```

`at` is `[longitude, latitude]` (east and north positive) or the name of one of about 590 cities: every capital, every city over a million people and some historic ones (Timbuktu, Samarkand, Venice, Cusco …). Accents and capital letters do not matter; `place('Xi\'an')` in a test tells you whether a name exists. Two cities with one name: the larger has the plain name, the other is `'Valencia, VE'`.

`shape`: `dot` (default), `ring`, `square`, `diamond`, `triangle`, `star`, `pin`. `size`: `'s'`, `'m'`, `'l'`. `labelPos`: `right`, `left`, `top`, `bottom` (by default the first of these that is free). A label that would be cut off by the edge of the map is moved to the opposite side (or, failing that, pushed back inside), whatever `labelPos` says. Use different shapes, not only different colours, for different kinds of place.

### Lines and routes

```js
lines: [
  { points: ['Venice', [35, 33], 'Samarkand', 'Xi\'an'], color: 'red', arrow: true, label: 'Silk Road', animate: 'draw' },
  { points: ['Lisbon', [-25, 15], [5, -40], 'Cape Town'], color: 'blue', dashed: true, width: 3, curve: 'straight' },
],
```

Points are `[lon, lat]`, place names or the `id` of a marker. `curve` is `'great-circle'` (the default: the shortest way, which looks bent on most maps), `'straight'` (straight on this map from point to point: right for rivers and coastlines you trace by hand with many points) or `'rhumb'` (constant compass bearing: straight on Mercator). `arrow: true` puts a head on the end, `'both'` on both ends.

`animate: 'draw'` makes the line draw itself; several such lines draw one after another, in the order given, and a *Replay* button appears. `animate: 'flow'` keeps dashes moving along the line. Both stand still for learners who have asked for reduced motion, so the map must make sense without them.

**Where a line's name goes.** A `label` is printed beside the line and listed in the legend. Three options control that:

```js
{ points: [...], label: 'Ring of Fire', labelOn: 'legend' }      // 'both' (default) | 'map' | 'legend'
{ points: [...], label: 'Silk Road', labelAt: 'Samarkand' }       // beside the line at its point nearest this place (or [lon, lat])
{ points: [...], label: 'Sea route', labelAt: 0.25 }              // or a quarter of the way along the part of the line that is in view
```

- By default the name is put beside the line near its middle if there is free room, and is left off the map when there is none (the legend still names it). On a crowded map, or for a long name, `labelOn: 'legend'` keeps the map clean.
- `labelAt` says where: the name is then always printed, beside the line at that spot and inside the frame. Use it when the automatic place reads as a label for something else (a line that hugs a coast is best named out at sea).
- `labelOn: 'map'` leaves the name out of the legend; it is then always printed somewhere along the line.

Areas take `labelOn` too (and `labelAt: [lon, lat]`).

**Route maps and the little rings.** On a regional map the countries too small to see are drawn as small rings (see [Detail](#detail)). On a map of routes, voyages or battles they look like unexplained markers. Add `dots: false` to any map whose subject is lines and markers rather than countries:

```js
{ type: 'world-map', view: 'mediterranean', dots: false, lines: [...], markers: [...] }
```

To trace a river or a border by hand, find the coordinates on any map service, list a point every few hundred kilometres and use `curve: 'straight'`.

### Areas

```js
areas: [
  { polygon: [[-9, 36], [-9, 43], [3, 43.5], [16, 46], [41, 41], [36, 31], [10, 33], [-6, 34]], color: 'red', label: 'Roman Empire, 117 CE' },
  { circle: 'Mecca', km: 1500, color: 'green', dashed: true },       // or circle: [lon, lat]
  { band: [-23.44, 23.44], color: 'orange', label: 'The tropics' },   // between two latitudes
  { lons: [-7.5, 7.5], color: 'blue', label: 'UTC' },                 // between two longitudes (a time zone); [172.5, -172.5] crosses the date line
  { box: [60, 5, 100, 38], color: 'teal', outline: false },
],
```

Areas are translucent, so the countries stay visible underneath. The outline of a polygon is the straight line between your points on a plain longitude/latitude grid; give more points for a smoother shape. `labelAt: [lon, lat]` moves the label, and `labelOn: 'legend'` (or `'map'`) says where the name appears, as for lines. An area's label is left off the map when there is no free room for it; the legend still names it.

### Lines of latitude and longitude

```js
parallels: ['equator', 'tropics', 'polar-circles', 45, { lat: 30, label: '30° N', color: 'red', dashed: true }],
meridians: ['prime', 'date-line', { lon: 100, label: '100° E' }],
```

Also `'tropic-of-cancer'`, `'tropic-of-capricorn'`, `'arctic-circle'`, `'antarctic-circle'`.

---

## Graded steps

Set `mode` on the `widget` of an `interact` step. The widget reports **facts** as its state; your `check` decides what is right. `solution` is a state that passes; it needs only the first field shown below (the widget recomputes the rest). The smoke test loads every `solution` and runs your `check` on it.

### `pick`: tap one country

```js
{ id: 'find-bolivia', type: 'interact', text: 'Tap **Bolivia**, one of the two countries of South America with no coast.',
  widget: { type: 'world-map', view: 'south-america', mode: 'pick', answer: 'BO', alt: 'A map of South America without names' },
  check: (s) => s.picked === 'BO' || (s.picked === 'PY' ? 'That is the other one, Paraguay.' : false),
  solution: { picked: 'BO' },
  explain: 'Bolivia lost its coast to Chile in the 1880s.' }
```

**State:** `{ picked: 'BO' | null, name: 'Bolivia' | null, nameThe: 'Bolivia' | null }`. `nameThe` is the name with its article where English wants one (`'the Philippines'`), ready for a sentence. Tapping the chosen country again lets it go.

`pickable: ['south-america']` restricts what can be chosen (codes and region names); everything else is greyed out and does not react. Without it, anything on the map can be picked.

### `pickMany`: choose several

```js
widget: { type: 'world-map', view: 'northern-europe', mode: 'pickMany', max: 3, answer: ['EE', 'LV', 'LT'] },
check: (s) => s.picked.join() === 'EE,LT,LV' || (s.count < 3 ? 'There are three of them.' : false),
solution: { picked: ['EE', 'LV', 'LT'] },
```

**State:** `{ picked: ['EE', 'LT', 'LV'], count: 3 }`. `picked` is always **sorted**, so compare with a sorted list (or with `countryIds('…')`, which is sorted too). `max` limits the number. A *Clear* button is provided.

For partial credit in the feedback, count: `const right = s.picked.filter((id) => WANT.includes(id)).length;`.

### `pickMarker` and `pickMarkers`: which of these points?

```js
widget: { type: 'world-map', view: 'east-asia', mode: 'pickMarker', markerLabels: 'after', answer: 'c',
  markers: [{ id: 'a', at: 'Beijing', label: 'Beijing' }, { id: 'b', at: 'Seoul', label: 'Seoul' }, { id: 'c', at: 'Tokyo', label: 'Tokyo' }] },
check: (s) => s.picked === 'c',
solution: { picked: 'c' },
```

**State:** `{ picked: 'c' | null }`, or for `pickMarkers` `{ picked: ['a', 'c'], count: 2 }` (sorted). Only markers with an `id` can be chosen (`pickable: ['a', 'b']` narrows it further).

`markerLabels: 'after'` hides the labels until the step is over. The markers then carry letters A, B, C … in the order you list them, so that your feedback can say "marker B is Seoul".

### `place`: put a pin where something is

```js
{ id: 'timbuktu', type: 'interact', text: 'Timbuktu stood where the Sahara meets the Niger. **Place the pin.** Within 500 km counts.',
  widget: { type: 'world-map', view: 'africa', mode: 'place', pin: { label: 'Timbuktu', color: 'red' }, target: 'Timbuktu' },
  check: (s) => (s.placed && s.km <= 500) || (!s.placed ? 'Move the pin first.' : s.km > 2000 ? 'Much too far: think West Africa.' : `Close, but ${s.km} km away.`),
  solution: { pin: [-3, 16.8] } }
```

**State:** `{ pin: [lon, lat], placed: true, country: 'ML', km: 148, nearest: 'target', distances: { target: 148 } }`

- `pin` is where the pin stands (two decimals); `placed` is false until the learner has moved it (it starts in the middle of the map, or at `pin.start`).
- `country` is the country the pin is in, or `null` at sea. A pin within 25 km of a coast still counts as on land, because coastlines are simplified. It is computed from the shapes on screen: on a regional map those are the coarse shapes for the first moment and the detailed ones after that, which only matters for the very smallest countries (on the coarse shapes they are rings, and a pin on the ring counts).
- `target: [lon, lat]` (or a place name) adds `km`, the distance from the target in whole kilometres. `targets: [{ id: 'giza', at: [31.13, 29.98], label: 'Giza' }, …]` gives `distances` to each, the `nearest` id and `km` to that nearest one.
- Without a target you can still check `s.country`, or compute anything yourself from `s.pin` with the [helpers](#helpers-for-lesson-files).
- `coordinates: false` keeps the pin's longitude and latitude out of the line under the map and out of what a screen reader hears, until the step is answered. Use it whenever the task is to find a place *from* its coordinates ("put the pin at 34° S, 18° E"); also leave `graticule` off, or the grid gives the same help. The country the pin is in is never shown before the answer; afterwards the line reads "Pin at 33.9° S, 18.4° E, in South Africa; 12 km from Cape Town."

The learner drags the pin, taps the map, or focuses the pin and uses the arrow keys (Shift for bigger steps). **Be generous with the tolerance**: see [the table of what a finger can hit](#what-reads-well-on-a-phone).

### `trace`: tap markers in order

```js
widget: { type: 'world-map', view: [-30, -42, 95, 48], mode: 'trace', answer: ['lis', 'cape', 'mom', 'cal'],
  markers: [{ id: 'lis', at: 'Lisbon', label: 'Lisbon' }, { id: 'cape', at: 'Cape Town', label: 'Cape of Good Hope' }, { id: 'mom', at: 'Mombasa', label: 'Mombasa' }, { id: 'cal', at: 'Kozhikode', label: 'Calicut' }] },
check: (s) => s.route.join() === 'lis,cape,mom,cal' || (s.count < 4 ? 'Visit all four ports.' : 'Which port comes first after leaving Europe?'),
solution: { route: ['lis', 'cape', 'mom', 'cal'] },
```

**State:** `{ route: ['lis', 'cape', 'mom', 'cal'], count: 4, km: 16886 }`. Each tap adds a stop; tapping the last stop removes it, tapping an earlier one cuts the route back to it. *Undo* and *Clear* buttons are provided. `km` is the length along great circles.

### Exploring without a grade

`mode: 'view'` (the default) has state `{}`. For "look around, then continue" use an `info` step with the map as its `figure`. A graded mode with `graded: false` on the step makes a goal without a mark ("tap any country you have visited").

---

## After the answer

When a step is resolved the player freezes the widget, and the map then **reveals**:

- the names of the picked countries and of the `answer` (the answer gets a green dashed outline; picked ones keep their solid outline);
- all marker labels hidden by `markerLabels: 'after'`, and a dashed ring round the `answer` marker;
- in `place` mode the target, a dashed line from the pin to it and the distance in km;
- in `trace` mode the `answer` route as a dashed line;
- names on hover and tap, everywhere on the map;
- a sentence under the map that says the same in words ("You picked Chile. The answer: Bolivia (dashed outline).").

`answer` is only ever used for this display. It does not grade anything, so keep it in step with your `check`. `reveal: false` switches the whole reveal off. Zooming and panning keep working after the answer, so the learner can look closer.

`setState({ reveal: true })` (or `false`) forces the reveal on or off without freezing, for widgets you drive yourself.

---

## Helpers for lesson files

```js
import { countryName, countryNameThe, countryIds, countryInfo, distanceKm, place, countryAt, inMainBody, pointInPolygon } from '../../../../src/widgets/world-map.js';
```

| Helper | Returns |
|--------|---------|
| `countryName('EG')` | `'Egypt'` (`''` for an unknown code): the bare name, for labels and lists |
| `countryNameThe('PH')` | `'the Philippines'`: the name as it reads **inside a sentence**. Adds "the" for the 29 names that need it (the United States, the United Kingdom, the Netherlands, the Bahamas, the Gambia, the Maldives, the Seychelles, the Comoros, the Solomon Islands, the Marshall Islands, the United Arab Emirates, the Central African Republic, the Dominican Republic, the DR Congo, the Congo, the Falkland Islands …) and returns the plain name for all others (`'Egypt'`, `'Ukraine'`, `'Ivory Coast'`) |
| `countryIds('africa')` | sorted codes of the **sovereign states** of a region: `['AO', 'BF', …]` (54 of them). `countryIds('africa', { territories: true })` adds dependencies and Western Sahara. `countryIds('world')` is all 197 |
| `countryInfo('EG')` | `{ id, name, continent: 'africa', subregion: 'northern-africa', territory: false, center: [29.4, 26.2], box: [w, s, e, n], capital: 'Cairo' }` |
| `distanceKm([lon, lat], [lon, lat])` | great-circle distance in km |
| `place('Cairo')` | `[31.25, 30.05]`, or `null` |
| `countryAt([lon, lat])` | the code of the country at that point, or `null` (uses the 1:110m shapes; `countryAt(p, 'low', 25)` forgives 25 km of sea). A country that is only a ring at that scale is reported for points inside it or at one of its cities in the table (`countryAt('Vatican City')` is `VA`, `countryAt('Rome')` is `IT`) |
| `inMainBody([lon, lat], 'FR')` | is the point in the main body of that country, as opposed to an overseas part? `countryAt(p) === 'FR' && inMainBody(p, 'FR')` is "in France, and not in French Guiana" |
| `pointInPolygon([lon, lat], [[lon, lat], …])` | is the point inside your own outline (a sea, an empire)? |
| `greatCircle(a, b)`, `destination(point, km, bearing)` | points along a great circle; the point so far away in a compass direction |

Typical checks:

```js
check: (s) => s.picked === 'EG'
check: (s) => s.picked && countryIds('south-america').includes(s.picked) && !['BO', 'PY'].includes(s.picked) ? `No: ${s.nameThe} has a coast.` : s.picked === 'BO'
check: (s) => s.picked === 'ID' || (s.picked ? `That is ${s.nameThe}.` : false)      // "That is the Philippines.", not "That is Philippines."
check: (s) => s.picked.join() === countryIds('southern-africa').join()           // both sorted
check: (s) => s.placed && s.km <= 300
check: (s) => s.placed && distanceKm(s.pin, place('Samarkand')) <= 400
check: (s) => s.placed && pointInPolygon(s.pin, SAHARA) || 'That is not in the Sahara.'
check: (s) => s.route.join() === 'a,c,b'
```

Return a **string** for a wrong state you can diagnose. **In sentences use `s.nameThe` or `countryNameThe(id)`, not the bare name**: "That is the Netherlands", "The pin is in the United States", "On which continent is the Gambia?". The bare `s.name` / `countryName(id)` is for labels, lists and table cells. At the start of a sentence capitalise it yourself (`The Philippines …`). In a generated step (`gen(rng)`), build `widget`, `check` and `solution` from the same variable so they cannot drift apart.

---

## Identifiers

Countries are identified by their **ISO 3166-1 alpha-2** codes (`EG`, `GB`, `US` …), plus `XK` for Kosovo, which has no ISO code but uses this one everywhere. Names are the common English short names. \* marks a territory rather than a sovereign state (not in `countryIds()` unless you ask); ° marks an entry that has no shape on whole-world maps and is drawn as a ring there (all have shapes on regional maps).

Continents and subregions follow the United Nations geoscheme as Natural Earth records it. That puts Russia in Europe, Turkey, Cyprus and the Caucasus in Asia, Mexico in Central America, and Egypt in Africa (it is also in `middle-east`).

**Africa** · `africa` · 54 countries

| Subregion | Members |
|---|---|
| `northern-africa` | `DZ` Algeria · `EG` Egypt · `EH` Western Sahara\* · `LY` Libya · `MA` Morocco · `SD` Sudan · `TN` Tunisia |
| `western-africa` | `BF` Burkina Faso · `BJ` Benin · `CI` Ivory Coast · `CV` Cape Verde° · `GH` Ghana · `GM` Gambia · `GN` Guinea · `GW` Guinea-Bissau · `LR` Liberia · `ML` Mali · `MR` Mauritania · `NE` Niger · `NG` Nigeria · `SH` Saint Helena\*° · `SL` Sierra Leone · `SN` Senegal · `TG` Togo |
| `middle-africa` | `AO` Angola · `CD` DR Congo · `CF` Central African Republic · `CG` Congo · `CM` Cameroon · `GA` Gabon · `GQ` Equatorial Guinea · `ST` São Tomé and Príncipe° · `TD` Chad |
| `eastern-africa` | `BI` Burundi · `DJ` Djibouti · `ER` Eritrea · `ET` Ethiopia · `KE` Kenya · `KM` Comoros° · `MG` Madagascar · `MU` Mauritius° · `MW` Malawi · `MZ` Mozambique · `RW` Rwanda · `SC` Seychelles° · `SO` Somalia · `SS` South Sudan · `TZ` Tanzania · `UG` Uganda · `ZM` Zambia · `ZW` Zimbabwe |
| `southern-africa` | `BW` Botswana · `LS` Lesotho · `NA` Namibia · `SZ` Eswatini · `ZA` South Africa |

**Asia** · `asia` · 49 countries

| Subregion | Members |
|---|---|
| `western-asia` | `AE` United Arab Emirates · `AM` Armenia · `AZ` Azerbaijan · `BH` Bahrain° · `CY` Cyprus · `GE` Georgia · `IL` Israel · `IQ` Iraq · `JO` Jordan · `KW` Kuwait · `LB` Lebanon · `OM` Oman · `PS` Palestine · `QA` Qatar · `SA` Saudi Arabia · `SY` Syria · `TR` Turkey · `YE` Yemen |
| `central-asia` | `KG` Kyrgyzstan · `KZ` Kazakhstan · `TJ` Tajikistan · `TM` Turkmenistan · `UZ` Uzbekistan |
| `southern-asia` | `AF` Afghanistan · `BD` Bangladesh · `BT` Bhutan · `IN` India · `IR` Iran · `LK` Sri Lanka · `MV` Maldives° · `NP` Nepal · `PK` Pakistan |
| `eastern-asia` | `CN` China · `HK` Hong Kong\*° · `JP` Japan · `KP` North Korea · `KR` South Korea · `MN` Mongolia · `MO` Macau\*° · `TW` Taiwan |
| `south-eastern-asia` | `BN` Brunei · `ID` Indonesia · `KH` Cambodia · `LA` Laos · `MM` Myanmar · `MY` Malaysia · `PH` Philippines · `SG` Singapore° · `TH` Thailand · `TL` Timor-Leste · `VN` Vietnam |

**Europe** · `europe` · 45 countries

| Subregion | Members |
|---|---|
| `northern-europe` | `AX` Åland\*° · `DK` Denmark · `EE` Estonia · `FI` Finland · `FO` Faroe Islands\*° · `GB` United Kingdom · `GG` Guernsey\*° · `IE` Ireland · `IM` Isle of Man\*° · `IS` Iceland · `JE` Jersey\*° · `LT` Lithuania · `LV` Latvia · `NO` Norway · `SE` Sweden |
| `western-europe` | `AT` Austria · `BE` Belgium · `CH` Switzerland · `DE` Germany · `FR` France · `LI` Liechtenstein° · `LU` Luxembourg · `MC` Monaco° · `NL` Netherlands |
| `eastern-europe` | `BG` Bulgaria · `BY` Belarus · `CZ` Czechia · `HU` Hungary · `MD` Moldova · `PL` Poland · `RO` Romania · `RU` Russia · `SK` Slovakia · `UA` Ukraine |
| `southern-europe` | `AD` Andorra° · `AL` Albania · `BA` Bosnia and Herzegovina · `ES` Spain · `GR` Greece · `HR` Croatia · `IT` Italy · `ME` Montenegro · `MK` North Macedonia · `MT` Malta° · `PT` Portugal · `RS` Serbia · `SI` Slovenia · `SM` San Marino° · `VA` Vatican City° · `XK` Kosovo |

**North America** · `north-america` · 23 countries

| Subregion | Members |
|---|---|
| `northern-america` | `BM` Bermuda\*° · `CA` Canada · `GL` Greenland\* · `PM` Saint Pierre and Miquelon\*° · `US` United States |
| `central-america` | `BZ` Belize · `CR` Costa Rica · `GT` Guatemala · `HN` Honduras · `MX` Mexico · `NI` Nicaragua · `PA` Panama · `SV` El Salvador |
| `caribbean` | `AG` Antigua and Barbuda° · `AI` Anguilla\*° · `AW` Aruba\*° · `BB` Barbados° · `BL` Saint Barthélemy\*° · `BS` Bahamas · `CU` Cuba · `CW` Curaçao\*° · `DM` Dominica° · `DO` Dominican Republic · `GD` Grenada° · `HT` Haiti · `JM` Jamaica · `KN` Saint Kitts and Nevis° · `KY` Cayman Islands\*° · `LC` Saint Lucia° · `MF` Saint Martin\*° · `MS` Montserrat\*° · `PR` Puerto Rico\* · `SX` Sint Maarten\*° · `TC` Turks and Caicos Islands\*° · `TT` Trinidad and Tobago · `VC` Saint Vincent and the Grenadines° · `VG` British Virgin Islands\*° · `VI` US Virgin Islands\*° |

**South America** · `south-america` · 12 countries

| Subregion | Members |
|---|---|
| `south-america` | `AR` Argentina · `BO` Bolivia · `BR` Brazil · `CL` Chile · `CO` Colombia · `EC` Ecuador · `FK` Falkland Islands\* · `GY` Guyana · `PE` Peru · `PY` Paraguay · `SR` Suriname · `UY` Uruguay · `VE` Venezuela |

**Oceania** · `oceania` · 14 countries

| Subregion | Members |
|---|---|
| `australia-new-zealand` | `AU` Australia · `NF` Norfolk Island\*° · `NZ` New Zealand |
| `melanesia` | `FJ` Fiji · `NC` New Caledonia\* · `PG` Papua New Guinea · `SB` Solomon Islands · `VU` Vanuatu |
| `micronesia` | `FM` Micronesia° · `GU` Guam\*° · `KI` Kiribati° · `MH` Marshall Islands° · `MP` Northern Mariana Islands\*° · `NR` Nauru° · `PW` Palau° |
| `polynesia` | `AS` American Samoa\*° · `CK` Cook Islands\*° · `NU` Niue\*° · `PF` French Polynesia\*° · `PN` Pitcairn Islands\*° · `TO` Tonga° · `TV` Tuvalu° · `WF` Wallis and Futuna\*° · `WS` Samoa° |

**No continent** (remote islands and Antarctica): `AQ` Antarctica\* · `GS` South Georgia\*° · `HM` Heard and McDonald Islands\*° · `IO` British Indian Ocean Territory\*° · `TF` French Southern Lands\*

### Region names

Usable wherever a list of countries is expected (`ids`, `pickable`, `labels`, `view`, `countryIds()`), and mixable with codes:

- continents: `africa`, `asia`, `europe`, `north-america`, `south-america`, `oceania`, `antarctica`
- the subregions in the tables above
- everyday names for the same things: `north-africa`, `west-africa`, `east-africa`, `central-africa`, `south-asia`, `east-asia`, `southeast-asia`, `west-asia`
- groups: `sub-saharan-africa`, `middle-east` (Egypt, Turkey, Iran, Cyprus and the Arab states of Asia), `central-america-caribbean`, `latin-america`, `americas`, `world`

Inside a spec a region name means **everything** in the region, territories included (so that colouring `'africa'` leaves no hole at Western Sahara). `countryIds()` leaves territories out unless asked, because "the 54 countries of Africa" is what a check usually means.

---

## Disputed and special areas

The map shows the world as Natural Earth's default data shows it, which follows who administers a place on the ground rather than any one government's claims. Nothing has been redrawn. Boundaries that Natural Earth classifies as disputed, indefinite or lines of control are drawn **dashed**. The cases an author is most likely to meet:

| Area | How it is drawn |
|------|-----------------|
| Western Sahara (`EH`) | Only the part east of the Moroccan wall has the `EH` shape; the larger coastal part is drawn with Morocco, with a dashed line across the north. `EH` is a territory in the tables. |
| Crimea | Drawn with Russia (the country polygons are Natural Earth 4.1, which shows control on the ground); dashed line at the isthmus. |
| Kosovo (`XK`) | Its own shape; counted as a country. |
| Taiwan (`TW`) | Its own shape; counted as a country. |
| Palestine (`PS`) | The West Bank and, on detailed maps, Gaza; counted as a country (a UN observer state). The Golan Heights are drawn with Israel. Boundaries here are dashed. No capital is recorded for Palestine; Israel's is recorded as Jerusalem, as in Natural Earth. |
| Kashmir | Divided between India and Pakistan along the line of control (dashed); Aksai Chin is drawn with China; the Siachen Glacier area belongs to no entry. Arunachal Pradesh is drawn with India. |
| Somaliland, Northern Cyprus | Natural Earth draws them apart. Here they are part of Somalia (`SO`) and Cyprus (`CY`), which is how they are recognised internationally, with the dividing line kept as a dashed line. |
| Abkhazia, South Ossetia, Transnistria | Drawn with Georgia and Moldova. |
| Korea | Two countries; the demilitarised zone is a dashed line. |
| Falkland Islands (`FK`), Greenland (`GL`), Hong Kong (`HK`), Puerto Rico (`PR`) and other dependencies | Their own shapes and codes, marked as territories. |
| France | Includes French Guiana and the other overseas departments (so a piece of "France" appears in South America). Likewise Norway includes Svalbard. |
| Antarctica (`AQ`) | A territory; territorial claims are not shown. |

If a lesson is *about* a dispute, do not rely on the base map to make the point: draw the claim yourself with `areas` or `lines` and say whose view it is. If the base map's treatment would mislead in your lesson, say so in the text or choose a view where it does not arise. `tests/world-map.test.mjs` pins these cases down, so a change in the data will be noticed.

---

## What reads well on a phone

On a phone the whole map is about 360 px wide; a world map is then only 175 px tall. The widget keeps text, markers and tap areas the same size on screen however small the map gets, so the same spec *works* everywhere, but it cannot make a crowded map legible. Design for the phone first.

**How precise can a finger be?** A tap is good to about ±10 px.

| View | 1 px on a phone is about | Sensible tolerance for `place` |
|------|--------------------------|-------------------------------|
| the world | 110 km | 1000 km or more ("which part of which continent") |
| a continent (`africa`, `asia`, `north-america`) | 20 to 35 km | 300 to 500 km |
| a region (`europe`, `middle-east`, `south-asia`) | 10 to 15 km | 150 to 250 km |
| a country (`view: 'EG'`) | 3 to 5 km | 50 to 100 km |

Learners can zoom (buttons, pinch, Ctrl + wheel) and then pan by dragging, but do not design a step that *requires* it.

- **Choose the smallest view that contains the question.** "Tap Bolivia" belongs on `south-america`, not on the world. On a world map only ask for large countries (wider than about 15°).
- **Restrict `pickable`** to the plausible candidates when neighbours are small: fewer wrong targets under a thumb.
- **Six names is plenty.** Label what the step is about; let `labels: true` drop the ones that do not fit rather than forcing all of them by code.
- **Markers need room.** Two markers closer than about 25 px on the phone (5° on a continent map) are hard to tell apart and hard to tap. Keep labels to one or two words; set `labelPos` when two labels would run into each other.
- **Prefer shapes to legends.** One coloured group and one sentence beats five colours and a legend that wraps over three lines.
- **Tall maps scroll.** A portrait view (South America, Chile, Japan) is taller than a phone screen once text is added. That is acceptable for a figure, less so for the thing being tapped: `aspect: 1.1` trades a little margin for a shorter map.
- **In answer options** the map is a thumbnail about 80 px wide on a phone: highlight one bold thing per option (a country as large as Nigeria on `west-africa` is about the limit) and leave labels and markers out.
- **Write the `alt` text** as if the map were not there: "North-east Africa; Egypt, Sudan, South Sudan, Ethiopia and Uganda are highlighted along the Nile." For a quiz, describe without giving the answer away: "A map of South America without names."

On a laptop the map sits beside the text and is sized to fit a 1366 × 700 window without scrolling, whatever its proportions.

---

## Accessibility

- The countries (or markers) are a single stop in the tab order, followed by the zoom buttons. With the focus on the map, the **arrow keys** move from country to country (or marker to marker) in the direction pressed, **Enter** or **Space** chooses, **Home/End** jump to the first and last, **+ / − / 0** zoom. In maps that show names, typing the first letters of a name jumps to it.
- A screen reader hears the countries as a list of options. Where names are part of the question they are announced as positions instead ("Country near 17° south, 65° west"), and as names once the step is over.
- The pin of `place` mode is a slider that speaks its position; arrow keys move it.
- Every change is announced (`env.announce`), and the sentence under the map states the selection in words, so nothing depends on colour.
- `alt` becomes the description of the figure; the widget adds the labelled groups, markers, lines and areas to it.

Finding a country by its position is still a visual task. Where that matters, pair the map step with a question that can be answered from the text.

---

## The data

All geography is from [Natural Earth](https://www.naturalearthdata.com) (public domain). The country polygons come through the [`world-atlas`](https://github.com/topojson/world-atlas) package (ISC licence), which is Natural Earth 4.1; names, regions, label points, capitals, cities, lakes and rivers are from the current Natural Earth files.

| File | Size | Loaded |
|------|------|--------|
| `assets/geo/countries.js` | 25 KB | always: codes, names, regions, label points, capitals |
| `assets/geo/places.js` | 20 KB | always: about 590 cities |
| `assets/geo/world-110m.js` | 39 KB | always: shapes for world maps (175 of them) |
| `assets/geo/world-50m.js` | 232 KB | when a regional map or `detail: 'high'` asks for it |
| `assets/geo/rivers.js` | 67 KB | when a spec has `rivers` |

The files are generated by `tools/build-map-data.mjs` (its header says how to run it; it needs the `world-atlas` package and seven Natural Earth GeoJSON files, in a scratch folder outside the project). The format is described at the top of `src/widgets/world-map.js`. Names, capital choices and the handful of editorial decisions are tables at the top of the build script: change them there, not in the generated files. Nothing is fetched at run time and there is no third-party code in the page: the decoder and the projections are part of the widget.
