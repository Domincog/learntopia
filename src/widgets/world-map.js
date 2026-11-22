/**
 * world-map — a map of the world or of a region: a picture to read, a map to explore, or the
 * answer area of a graded step (tap a country, tap a marker, place a pin, trace a route).
 *
 * The author guide, with an example of every option, is docs/MAPS.md. This comment is the reference.
 *
 * {
 *   type: 'world-map',
 *
 *   // ---- what is shown
 *   view: 'world',                 // 'world' | a region name ('europe', 'africa', 'asia', 'south-asia', 'east-asia', 'southeast-asia',
 *                                  //   'central-asia', 'middle-east', 'north-america', 'central-america-caribbean', 'south-america',
 *                                  //   'oceania', 'mediterranean', 'arctic', 'antarctica', … the full list is VIEWS below)
 *                                  // | [west, south, east, north] in degrees (east may be smaller than west across the date line)
 *                                  // | 'EG' or ['EG', 'SD', 'north-africa'] (fit these countries or regions)
 *                                  // | { center: [lon, lat], span: 40 } (span = degrees of arc across the map)
 *                                  // | { ids: ['EG', 'SD'], pad: 0.2 }
 *   projection: 'auto',            // 'auto': Equal Earth for the world, an equal-area azimuthal projection centred on a region.
 *                                  // Or 'equal-earth' | 'natural-earth' | 'mercator' | 'equirectangular' | 'gall-peters'
 *                                  //  | 'orthographic' (a globe; drag it round) | 'azimuthal-equal-area' | 'azimuthal-equidistant'
 *   center: [lon, lat],            // centre of the projection (a number = central meridian). Default: the middle of the view.
 *   detail: 'auto',                // 'low' (1:110m), 'high' (1:50m, loaded on demand) or 'auto' (high for regional views)
 *   aspect: 1.6,                   // width / height of the drawing (default: whatever fits the view, between 0.8 and 2.4)
 *   maxWidth: 560,                 // widest the figure may get, in px
 *
 *   // ---- colouring countries
 *   regions: [                     // groups of countries filled with a theme colour
 *     { ids: ['EG', 'SD'], color: 'orange', label: 'Nile countries' },     // ids: codes and/or region names; tone: 'soft' for a tint
 *     { ids: 'europe', color: 'violet', mainBodyOnly: true },              // leave overseas parts (French Guiana) as plain land
 *   ],
 *   mainBodyOnly: false,           // true: the same for every group, and overseas parts cannot be picked or explored either.
 *                                  //   (Main body: the largest piece of a country and all that lies within about 800 km of it.)
 *   dim: true,                     // grey out every country that is in no group (default: true when there are groups)
 *   legend: true,                  // list the labelled groups, areas and lines under the map (default: true when any has a label)
 *   borders: true,                 // country borders (false: coastlines only)
 *   graticule: false,              // true or a step in degrees: lines of longitude and latitude
 *   lakes: true,
 *   rivers: false,                 // true (the major ones) or names: ['Nile', 'Tigris', 'Euphrates'] (those are labelled)
 *   labels: ['EG', 'SD'],          // country names to print: ids/region names, true (every group member that fits), 'all',
 *                                  //   or objects { id: 'EG', text: 'Kemet' } / { at: [25, 23], text: 'Sahara', style: 'area' | 'water' }
 *   oceans: false, continents: false,     // print ocean / continent names
 *   dots: 'auto',                  // countries too small to see are drawn as small rings. 'auto': those listed by code, and on
 *                                  //   regional maps those in a group, in `pickable`, or (when exploring or picking) all of them; true; false
 *
 *   // ---- things drawn on top
 *   parallels: ['equator', 'tropics', 'polar-circles', { lat: 30, label: '30° N', color: 'red' }],
 *   meridians: ['prime', { lon: 180, label: 'Date line' }],
 *   markers: [                     // points: at is [lon, lat] or the name of a place in the table ('Cairo')
 *     { id: 'giza', at: [31.13, 29.98], label: 'Giza', color: 'red', shape: 'dot', labelPos: 'right' },
 *   ],                             // shape: dot | ring | square | diamond | triangle | star | pin;  size: 's' | 'm' | 'l'
 *                                  // labelPos: right | left | top | bottom; a label the edge of the map would cut off moves inside
 *   markerLabels: 'always',        // 'after': hidden until the step is answered (markers then carry letters A, B, C …)
 *   lines: [                       // routes: points are [lon, lat], place names or marker ids
 *     { points: ['Venice', [35, 33], 'Samarkand'], color: 'red', arrow: true, animate: 'draw', label: 'Silk Road',
 *       curve: 'great-circle', dashed: false, width: 2.5 },     // curve: 'great-circle' | 'straight' | 'rhumb'; arrow: true | 'both'
 *   ],                             // animate: 'draw' (the line draws itself, one after another) | 'flow' (dashes move along it)
 *                                  // labelOn: 'both' (default: beside the line where there is room, and in the legend) | 'map' | 'legend'
 *                                  // labelAt: [lon, lat], a place name or a share 0–1 of the visible line: print the label there
 *                                  //   (always printed, kept inside the frame). Areas take labelOn and labelAt: [lon, lat] too.
 *   areas: [                       // shaded shapes: one of polygon / circle / band / lons / box
 *     { polygon: [[lon, lat], …], color: 'violet', label: 'Roman Empire, 117 CE' },
 *     { circle: 'Mecca', km: 1500, color: 'green' },            // or circle: [lon, lat]
 *     { band: [-23.44, 23.44], color: 'orange', label: 'The tropics' },     // between two latitudes
 *     { lons: [-7.5, 7.5], color: 'blue' },                      // between two longitudes (a time zone)
 *     { box: [west, south, east, north], color: 'teal', outline: false },
 *   ],
 *
 *   // ---- interaction
 *   mode: 'view',                  // 'view' | 'pick' | 'pickMany' | 'pickMarker' | 'pickMarkers' | 'place' | 'trace'
 *   names: true,                   // hovering or tapping a country shows its name. Default: true in 'view', FALSE in every other mode,
 *                                  //   so that a quiz does not give its answer away. Names appear once the step is answered.
 *   zoom: true,                    // zoom buttons, pinch, Ctrl + wheel, drag to pan (a globe is dragged round instead);
 *                                  //   they keep working after the step is answered
 *   static: false,                 // true: a picture, nothing reacts (always so inside an answer option)
 *   pickable: ['africa'],          // pick modes: which countries (or marker ids) can be chosen. Default: all of them
 *   max: 3,                        // pickMany / pickMarkers: at most this many
 *   pickColor: 'yellow',
 *   answer: 'EG',                  // what to show when the step is over: id(s) for pick modes, marker id(s), a route for trace
 *   reveal: true,                  // false: show nothing extra when the widget becomes read-only
 *   pin: { label: 'Timbuktu', color: 'red', start: [0, 20] },      // place mode
 *   coordinates: true,             // place mode: false keeps the pin's longitude and latitude out of the readout and the
 *                                  //   announcements until the step is answered (for "find these coordinates" tasks)
 *   target: [-3, 16.8],            // place mode: where the pin belongs ([lon, lat] or a place name) …
 *   targets: [{ id: 'giza', at: [31.13, 29.98], label: 'Giza' }],  // … or several candidates
 *   alt: 'A map of Africa with Egypt and Sudan highlighted',
 * }
 *
 * State (what `check(state)` receives; `solution` needs only the first field of each)
 *   view         {}
 *   pick         { picked: 'EG' | null, name: 'Egypt' | null, nameThe: 'Egypt' | null }     (nameThe: 'the Philippines' …)
 *   pickMany     { picked: ['EG', 'SD'] (sorted), count: 2 }
 *   pickMarker   { picked: 'giza' | null }
 *   pickMarkers  { picked: ['a', 'c'] (sorted), count: 2 }
 *   place        { pin: [lon, lat], placed: true, country: 'ML' | null (at sea; within 25 km of a coast still counts),
 *                  km: 212, nearest: 'target', distances: { target: 212 } }     (the last three only with target / targets)
 *   trace        { route: ['a', 'c', 'b'], count: 3, km: 5120 }
 *
 * setState accepts the same shapes ({ picked }, { pin }, { route }) and, in any mode, { reveal: true | false } to
 * show or hide names and the `answer` without freezing the widget.
 *
 * Helpers for lesson files (import them from this module):
 *   countryName('EG') → 'Egypt'        countryInfo('EG') → { id, name, continent, subregion, territory, center, box, capital }
 *   countryNameThe('PH') → 'the Philippines' (the name as it reads in a sentence; plain for most countries)
 *   inMainBody([lon, lat], 'FR') → false in French Guiana
 *   countryIds('africa') → ['AO', …]   (sovereign states; pass { territories: true } for dependencies too)
 *   distanceKm([lon, lat], [lon, lat])   place('Cairo') → [31.25, 30.05]   countryAt([lon, lat]) → 'EG' | null
 *   pointInPolygon([lon, lat], [[lon, lat], …])   greatCircle(a, b)   destination([lon, lat], km, bearing)
 *
 * Map data: Natural Earth (public domain), built by tools/build-map-data.mjs into assets/geo/. Each layer is
 *   { res, step, n: [coast, border, dashed, lake] arc counts, arcs, shapes: { id: polygons }, lakes }
 * `arcs` is one string. Each arc is: the number of points, then for every point its x and y on a grid of `step`
 * degrees, the first absolute and the rest as differences from the point before. Every number is zig-zag coded
 * (so that it is not negative) and written in base 32, lowest digit first, one character per digit from
 * A–Z a–z 0–9 - _ ; a digit is followed by more digits when its character's value is 32 or above. A polygon is a
 * list of rings and a ring a list of arc numbers; ~n means arc n walked backwards. Longitude runs on continuously
 * across the date line inside an arc (it can pass 180).
 */
import { frame, handle, button, hue, s, h, cx, clamp, icon, addStyles, HUES } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';
import { COUNTRIES, REGIONS } from '../../assets/geo/countries.js';
import { PLACES } from '../../assets/geo/places.js';
import WORLD_110M from '../../assets/geo/world-110m.js';

addStyles('world-map', `
  .widget-world-map { --wm-ocean: var(--blue-soft); --wm-land: var(--surface); --wm-dim: var(--gray-soft); --wm-coast: var(--ink-2); --wm-border: var(--ink-3); --wm-u: 1; }
  .widget-world-map .w-canvas { background: var(--surface); }
  .widget-world-map .w-canvas svg.is-zoomed, .widget-world-map .w-canvas svg.is-globe { touch-action: none; }
  .widget-world-map .w-canvas svg.is-zoomed, .widget-world-map .w-canvas svg.is-globe { cursor: grab; }
  .widget-world-map .w-canvas svg.is-panning { cursor: grabbing; }
  .widget-world-map .w-canvas svg.is-pointing { cursor: pointer; }
  .widget-world-map .wm-map path { vector-effect: non-scaling-stroke; fill: none; }
  .widget-world-map .wm-map .wm-ocean { fill: var(--wm-ocean); }
  .widget-world-map .wm-map .wm-c { fill: var(--f, var(--wm-land)); stroke: var(--f, var(--wm-land)); stroke-width: 0.6; fill-rule: evenodd; }
  .widget-world-map .wm-map .wm-lake { fill: var(--wm-ocean); stroke: var(--wm-coast); stroke-width: 0.7; fill-rule: evenodd; }
  .widget-world-map .wm-map .wm-river { stroke: var(--blue); stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; opacity: 0.85; }
  .widget-world-map .wm-map .wm-river.is-named { stroke-width: 2.4; opacity: 1; }
  .widget-world-map .wm-map .wm-coast { stroke: var(--wm-coast); stroke-width: 1; stroke-linejoin: round; }
  .widget-world-map .wm-map .wm-border { stroke: var(--wm-border); stroke-width: 0.75; stroke-linejoin: round; }
  .widget-world-map .wm-map .wm-dashed { stroke: var(--wm-border); stroke-width: 0.9; stroke-dasharray: 3 2.5; }
  .widget-world-map .wm-map .wm-grat { stroke: var(--ink-3); stroke-width: 0.6; opacity: 0.32; }
  .widget-world-map .wm-map .wm-rim { stroke: var(--wm-coast); stroke-width: 1.2; }
  .widget-world-map .wm-map .wm-area { fill: var(--c); fill-opacity: 0.3; fill-rule: evenodd; }
  .widget-world-map .wm-map .wm-area-line { stroke: var(--c); stroke-width: 2; stroke-linejoin: round; }
  .widget-world-map .wm-map .wm-area-line.is-dashed, .widget-world-map .wm-map .wm-par.is-dashed { stroke-dasharray: 6 5; }
  .widget-world-map .wm-map .wm-par { stroke: var(--c, var(--ink-2)); stroke-width: 1.5; }
  .widget-world-map .wm-map .wm-answer.is-picked { fill: none; }
  .widget-world-map .wm-map .wm-hover { stroke: var(--ink); stroke-width: 1.6; fill-rule: evenodd; }
  .widget-world-map .wm-map .wm-picked { stroke: var(--ink); stroke-width: 2.1; stroke-linejoin: round; fill-rule: evenodd; }
  .widget-world-map .wm-map .wm-answer { stroke: var(--green-text); stroke-width: 3; stroke-dasharray: 7 4; stroke-linejoin: round; fill: var(--green); fill-opacity: 0.35; fill-rule: evenodd; }
  .widget-world-map .wm-over { pointer-events: none; }
  .widget-world-map .wm-over .wm-pin { pointer-events: auto; }
  .widget-world-map .wm-line { fill: none; stroke: var(--c); stroke-linecap: round; stroke-linejoin: round; }
  .widget-world-map .wm-line-halo { fill: none; stroke: var(--surface); stroke-linecap: round; stroke-linejoin: round; opacity: 0.7; }
  .widget-world-map .wm-line.is-draw, .widget-world-map .wm-line-halo.is-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: wm-draw var(--dur, 1.6s) ease-in-out var(--delay, 0s) forwards; }
  .widget-world-map .wm-arrow.is-draw { opacity: 0; animation: wm-fade 0.25s ease var(--delay, 0s) forwards; }
  .widget-world-map .wm-line.is-flow { animation: wm-flow 1.1s linear infinite; }
  @keyframes wm-draw { to { stroke-dashoffset: 0; } }
  @keyframes wm-fade { to { opacity: 1; } }
  @keyframes wm-flow { to { stroke-dashoffset: calc(var(--wm-u) * -18px); } }
  .widget-world-map .wm-dot { fill: var(--f, var(--wm-land)); stroke: var(--wm-coast); }
  .widget-world-map .wm-dot.is-picked { stroke: var(--ink); }
  .widget-world-map .wm-mark { stroke: var(--edge-strong); stroke-linejoin: round; }
  .widget-world-map .wm-mark.is-ring { fill: var(--surface); stroke: var(--c); }
  .widget-world-map .wm-mark-ring { fill: none; stroke: var(--ink); }
  .widget-world-map .wm-mark-answer { fill: none; stroke: var(--green-text); stroke-dasharray: 4 3; }
  .widget-world-map .wm-badge { fill: var(--ink); }
  .widget-world-map .wm-cursor { fill: none; stroke: var(--focus); }
  .widget-world-map .wm-keys { outline: none; }
  .widget-world-map .w-canvas text.wm-t { font-size: calc(var(--wm-u) * 11.5px); stroke-width: calc(var(--wm-u) * 3px); font-weight: 650; }
  .widget-world-map .w-canvas text.wm-t-b { font-size: calc(var(--wm-u) * 12.5px); stroke-width: calc(var(--wm-u) * 3.2px); font-weight: 800; }
  .widget-world-map .w-canvas text.wm-t-area { font-size: calc(var(--wm-u) * 11.5px); stroke-width: calc(var(--wm-u) * 3px); font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; fill: var(--ink-2); }
  .widget-world-map .w-canvas text.wm-t-water { font-size: calc(var(--wm-u) * 11.5px); stroke-width: calc(var(--wm-u) * 3px); stroke: var(--wm-ocean); font-style: italic; font-weight: 600; fill: var(--blue-text); }
  .widget-world-map .w-canvas text.wm-t-badge { font-size: calc(var(--wm-u) * 10.5px); stroke: none; font-weight: 800; fill: var(--surface); }
  .widget-world-map .wm-pin .w-handle-dot, .widget-world-map .wm-pin .w-handle-halo { display: none; }
  .widget-world-map .wm-pin-body { stroke: var(--edge-strong); stroke-linejoin: round; }
  .widget-world-map .wm-pin.is-loose .wm-pin-body { stroke-dasharray: 3 2; }
  .widget-world-map .wm-pin:focus-visible .wm-pin-body { stroke: var(--focus); stroke-width: 3.5; }
  .widget-world-map .wm-pin-hole { fill: var(--surface); }
  .widget-world-map .wm-target { fill: none; stroke: var(--green-text); }
  .widget-world-map .wm-gap { fill: none; stroke: var(--ink); stroke-dasharray: 4 4; }
  .widget-world-map .wm-tip {
    position: absolute; z-index: 2; pointer-events: none; max-width: 70%; padding: 2px 9px; border-radius: 8px;
    background: var(--ink); color: var(--paper); font-size: var(--fs-sm); font-weight: 700; line-height: 1.35; white-space: nowrap;
    transform: translate(-50%, calc(-100% - 10px));
  }
  .widget-world-map .wm-tip.is-left { transform: translate(-8%, calc(-100% - 10px)); }
  .widget-world-map .wm-tip.is-right { transform: translate(-92%, calc(-100% - 10px)); }
  .widget-world-map .wm-tip.is-below { transform: translate(-50%, 14px); }
  .widget-world-map .wm-tip[hidden] { display: none; }
  .widget-world-map .wm-zoom { position: absolute; z-index: 1; left: 8px; bottom: 8px; display: flex; gap: 4px; }
  .widget-world-map .wm-zoom [role=button] {
    position: relative; box-sizing: border-box; width: 36px; height: 36px; padding: 0; display: grid; place-items: center; cursor: pointer; user-select: none; -webkit-user-select: none; touch-action: manipulation;
    border: var(--bw) solid var(--edge); border-radius: 10px; background: var(--surface); color: var(--ink);
  }
  .widget-world-map .wm-zoom [role=button]::before { content: ''; position: absolute; inset: -4px; }
  .widget-world-map .wm-zoom [role=button]:hover { background: var(--sunken); }
  .widget-world-map .wm-zoom [role=button]:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; }
  .widget-world-map .wm-zoom [role=button][aria-disabled=true] { opacity: 0.4; cursor: default; }
  .widget-world-map .wm-zoom [role=button][hidden] { display: none; }
  @container wcanvas (max-width: 470px) {
    .widget-world-map .wm-zoom { left: 6px; bottom: 6px; gap: 8px; }
    .widget-world-map .wm-zoom [role=button] { width: 32px; height: 32px; border-radius: 9px; }
  }
  .widget-world-map .wm-status { min-height: 1.5em; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-world-map .wm-status:empty { display: none; }
  .widget-world-map .w-legend-item i.is-line { height: 0; border-width: 3px 0 0; border-radius: 0; width: 18px; background: none; }
  .widget-world-map .w-legend-item i.is-area { border-color: var(--c); }
  .widget-world-map.is-readonly .wm-pin { pointer-events: none; }
  @media (prefers-reduced-motion: reduce) {
    .widget-world-map .wm-line.is-draw, .widget-world-map .wm-line-halo.is-draw, .widget-world-map .wm-arrow.is-draw, .widget-world-map .wm-line.is-flow { animation: none; stroke-dashoffset: 0; opacity: 1; }
  }
`);

/* ====================================================================== tables */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const EARTH_KM = 6371.0088;
/** An angle in degrees folded into [-180, 180). */
const wrap180 = (d) => d - 360 * Math.floor((d + 180) / 360);
const round = (v, places = 2) => { const p = 10 ** places; const r = Math.round(v * p) / p; return Object.is(r, -0) ? 0 : r; };

/** Region names that are made of other regions, or are a plain list of countries. */
const GROUPS = {
  'south-asia': ['southern-asia'], 'east-asia': ['eastern-asia'], 'southeast-asia': ['south-eastern-asia'], 'west-asia': ['western-asia'],
  'north-africa': ['northern-africa'], 'west-africa': ['western-africa'], 'east-africa': ['eastern-africa'], 'central-africa': ['middle-africa'],
  'sub-saharan-africa': ['western-africa', 'middle-africa', 'eastern-africa', 'southern-africa'],
  'central-america-caribbean': ['central-america', 'caribbean'],
  'latin-america': ['south-america', 'central-america', 'caribbean'],
  americas: ['north-america', 'south-america'],
  'middle-east': 'AE BH CY EG IL IQ IR JO KW LB OM PS QA SA SY TR YE',
};

/**
 * Named views: [west, south, east, north], or { center, span } for the polar ones. A view is a window, not a
 * list of members: 'europe' stops at the Urals although all of Russia is in countryIds('europe').
 */
export const VIEWS = {
  world: null,
  africa: [-20, -36, 53, 38], 'north-africa': [-18, 12, 38, 38], 'west-africa': [-19, 3, 16, 28], 'east-africa': [21, -13, 52, 19],
  'central-africa': [6, -14, 32, 24], 'southern-africa': [10, -36, 42, -7], 'sub-saharan-africa': [-19, -36, 52, 22],
  europe: [-25, 34, 45, 72], 'western-europe': [-11, 41, 18, 56], 'northern-europe': [-25, 49, 40, 72], 'southern-europe': [-11, 34, 30, 48],
  'eastern-europe': [11, 41, 48, 61], balkans: [12.5, 34.5, 30.5, 48], 'british-isles': [-11, 49.5, 2.5, 61], scandinavia: [3, 54, 33, 72],
  mediterranean: [-10, 29, 38, 47],
  asia: [25, -11, 150, 78], 'middle-east': [24, 11, 64, 43], 'central-asia': [45, 34, 90, 56], 'south-asia': [60, 4, 98, 38],
  'east-asia': [73, 17, 147, 54], 'southeast-asia': [91, -12, 142, 29],
  'north-america': [-168, 6, -52, 74], usa: [-126, 23, -66, 50], 'central-america': [-93, 6, -76, 19], caribbean: [-86, 9, -58, 28],
  'central-america-caribbean': [-93, 6, -58, 28], 'south-america': [-83, -57, -33, 14], 'latin-america': [-118, -57, -33, 33],
  oceania: [110, -49, 215, 22], australia: [111, -45, 156, -9], pacific: { center: [-165, 0], span: 150 },
  atlantic: { center: [-30, 20], span: 130 }, 'indian-ocean': { center: [77, -10], span: 110 },
  arctic: { center: [0, 90], span: 70 }, antarctica: { center: [0, -90], span: 70 },
};
/** The same names in the spelling the data uses. */
const VIEW_ALIAS = {
  'southern-asia': 'south-asia', 'eastern-asia': 'east-asia', 'south-eastern-asia': 'southeast-asia', 'western-asia': 'middle-east',
  'northern-africa': 'north-africa', 'western-africa': 'west-africa', 'eastern-africa': 'east-africa', 'middle-africa': 'central-africa',
};

const OCEANS = [
  ['Pacific Ocean', -140, 2], ['Pacific Ocean', 162, 18], ['Atlantic Ocean', -40, 31], ['Atlantic Ocean', -17, -30], ['Indian Ocean', 79, -27],
  ['Southern Ocean', 25, -61], ['Arctic Ocean', -155, 77], ['Southern Ocean', -125, -63],
];
const CONTINENTS = [
  ['Africa', 21, 9], ['Europe', 16, 50.5], ['Asia', 88, 44], ['North America', -101, 46], ['South America', -59, -13], ['Oceania', 134, -24.5], ['Antarctica', 60, -80],
];
const LINES_OF_LATITUDE = {
  equator: [{ lat: 0, label: 'Equator' }],
  tropics: [{ lat: 23.44, label: 'Tropic of Cancer', dashed: true }, { lat: -23.44, label: 'Tropic of Capricorn', dashed: true }],
  'tropic-of-cancer': [{ lat: 23.44, label: 'Tropic of Cancer', dashed: true }],
  'tropic-of-capricorn': [{ lat: -23.44, label: 'Tropic of Capricorn', dashed: true }],
  'polar-circles': [{ lat: 66.56, label: 'Arctic Circle', dashed: true }, { lat: -66.56, label: 'Antarctic Circle', dashed: true }],
  'arctic-circle': [{ lat: 66.56, label: 'Arctic Circle', dashed: true }],
  'antarctic-circle': [{ lat: -66.56, label: 'Antarctic Circle', dashed: true }],
};
const LINES_OF_LONGITUDE = { prime: [{ lon: 0, label: 'Prime meridian' }], 'date-line': [{ lon: 180, label: '180°', dashed: true }] };
/** Where to print a country's name when its usual spot is outside the view. */
const LABEL_ALT = { RU: [44.7, 58.2], US: [-97.5, 39.5], CA: [-101.9, 57] };

const isId = (v) => typeof v === 'string' && Object.prototype.hasOwnProperty.call(COUNTRIES, v);
let regionCache = null;
/** Every region name → its members (countries and territories). */
function regionTable() {
  if (regionCache) return regionCache;
  const out = {};
  for (const [name, ids] of Object.entries(REGIONS)) out[name] = ids.split(' ');
  for (const [name, parts] of Object.entries(GROUPS)) {
    out[name] = typeof parts === 'string' ? parts.split(' ') : Array.from(new Set(parts.flatMap((p) => out[p] || []))).sort();
  }
  out.world = Object.keys(COUNTRIES);
  regionCache = out;
  return out;
}

/** 'EG' → 'Egypt'. Unknown codes give ''. */
export function countryName(id) { return isId(id) ? COUNTRIES[id][0] : ''; }

/** The countries whose English name takes "the" in a sentence: an explicit list, not a guess from the spelling. */
const WITH_ARTICLE = new Set('AE BS CD CF CG CK DO FK FO GB GM HM IM IO KM KY MH MP MV NL PH PN SB SC TC TF US VG VI'.split(' '));

/**
 * The name as it reads inside a sentence: countryNameThe('PH') → 'the Philippines', countryNameThe('EG') → 'Egypt'.
 * Use it wherever a name follows "is", "in", "of" …: `That is ${countryNameThe(s.picked)}.` Unknown codes give ''.
 */
export function countryNameThe(id) {
  const name = countryName(id);
  return name && WITH_ARTICLE.has(id) ? `the ${name}` : name;
}

/** Everything the table knows about one country, or null. `center` is where its name is printed. */
export function countryInfo(id) {
  if (!isId(id)) return null;
  const [name, continent, subregion, territory, lon, lat, box, capital] = COUNTRIES[id];
  return { id, name, continent, subregion, territory: !!territory, center: [lon, lat], box: box ? box.slice() : null, capital: capital || null };
}

/**
 * The countries of a region, sorted: countryIds('africa'), countryIds('south-asia'), countryIds('world').
 * Sovereign states only (the 193 UN members, the Vatican, Palestine, Kosovo and Taiwan); dependencies and
 * other territories (Greenland, Puerto Rico, Western Sahara …) are added with { territories: true }.
 */
export function countryIds(region = 'world', { territories = false } = {}) {
  const list = regionTable()[region];
  if (!list) return [];
  return list.filter((id) => territories || !COUNTRIES[id][3]).sort();
}

/** Names of all regions that countryIds() and the spec understand. */
export const regionNames = () => Object.keys(regionTable()).sort();

const fold = (text) => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
let placeIndex = null;
/** The position of a city in the table: place('Cairo') → [31.25, 30.05]. Accents and capitals do not matter. Unknown → null. */
export function place(name) {
  if (!placeIndex) {
    placeIndex = new Map();
    for (const key of Object.keys(PLACES)) if (!placeIndex.has(fold(key))) placeIndex.set(fold(key), key);
  }
  const key = placeIndex.get(fold(name));
  return key ? [PLACES[key][0], PLACES[key][1]] : null;
}

/** A position given as [lon, lat] or as a place name → [lon, lat] or null. */
function toPoint(v) {
  if (Array.isArray(v) && v.length >= 2 && Number.isFinite(v[0]) && Number.isFinite(v[1])) return [v[0], clamp(v[1], -90, 90)];
  if (typeof v === 'string') return place(v) || (isId(v) ? [COUNTRIES[v][4], COUNTRIES[v][5]] : null);
  return null;
}

/** Codes and region names, in any mix → a list of country codes (territories included). */
function toIds(v) {
  if (v == null || v === false) return [];
  const out = [];
  const table = regionTable();
  for (const item of Array.isArray(v) ? v : String(v).split(/[\s,]+/)) {
    if (isId(item)) out.push(item);
    else if (table[item]) out.push(...table[item]);
  }
  return Array.from(new Set(out));
}

/* ==================================================================== geometry */

/** Great-circle distance between two [lon, lat] points, in kilometres. */
export function distanceKm(a, b) {
  if (!a || !b) return NaN;
  const p1 = a[1] * RAD;
  const p2 = b[1] * RAD;
  const dp = p2 - p1;
  const dl = (b[0] - a[0]) * RAD;
  const q = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(q)));
}

/** Points along the great circle from a to b ([lon, lat]), both ends included; about one every `stepDeg` degrees. */
export function greatCircle(a, b, stepDeg = 2) {
  const toV = ([lon, lat]) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)];
  const va = toV(a);
  const vb = toV(b);
  const dot = clamp(va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2], -1, 1);
  const omega = Math.acos(dot);
  const n = Math.max(1, Math.ceil((omega * DEG) / stepDeg));
  if (omega < 1e-9 || Math.PI - omega < 1e-6) return [a.slice(0, 2), b.slice(0, 2)];
  const out = [a.slice(0, 2)];
  const so = Math.sin(omega);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const fa = Math.sin((1 - t) * omega) / so;
    const fb = Math.sin(t * omega) / so;
    const x = fa * va[0] + fb * vb[0];
    const y = fa * va[1] + fb * vb[1];
    const z = fa * va[2] + fb * vb[2];
    out.push([Math.atan2(y, x) * DEG, Math.asin(clamp(z, -1, 1)) * DEG]);
  }
  out.push(b.slice(0, 2));
  return out;
}

/** The point `km` away from [lon, lat] in compass direction `bearing` (degrees clockwise from north). */
export function destination([lon, lat], km, bearing) {
  const d = km / EARTH_KM;
  const p1 = lat * RAD;
  const b = bearing * RAD;
  const p2 = Math.asin(clamp(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b), -1, 1));
  const l2 = lon * RAD + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [wrap180(l2 * DEG), p2 * DEG];
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const DIGIT = new Int8Array(128).fill(-1);
for (let i = 0; i < ALPHABET.length; i++) DIGIT[ALPHABET.charCodeAt(i)] = i;

/**
 * Unpack the arcs of a layer (the format is described at the top of this file).
 * Returns one Float64Array per arc: lon, lat, lon, lat … in degrees.
 */
export function decodeArcs(text, step = 0.01) {
  const arcs = [];
  const end = text.length;
  let i = 0;
  const natural = () => {
    let value = 0;
    let scale = 1;
    let digit;
    do {
      digit = DIGIT[text.charCodeAt(i++)];
      if (!(digit >= 0)) throw new Error('world-map: damaged map data');
      value += (digit & 31) * scale;
      scale *= 32;
    } while (digit & 32);
    return value;
  };
  const signed = () => { const v = natural(); return v % 2 ? -(v + 1) / 2 : v / 2; };
  while (i < end) {
    const count = natural();
    const out = new Float64Array(count * 2);
    let x = 0;
    let y = 0;
    for (let k = 0; k < count; k++) {
      x += signed();
      y += signed();
      out[2 * k] = x * step;
      out[2 * k + 1] = y * step;
    }
    arcs.push(out);
  }
  return arcs;
}

/**
 * Borders in the source are straight between far-apart points (the 49th parallel is two points). On a curved
 * projection they must bend, so long steps are cut into pieces of at most `maxStep` degrees.
 */
function densify(arc, maxStep = 3) {
  const n = arc.length / 2;
  let extra = 0;
  for (let i = 1; i < n; i++) {
    const d = Math.max(Math.abs(arc[2 * i] - arc[2 * i - 2]), Math.abs(arc[2 * i + 1] - arc[2 * i - 1]));
    if (d > maxStep) extra += Math.ceil(d / maxStep) - 1;
  }
  if (!extra) return arc;
  const out = new Float64Array((n + extra) * 2);
  let o = 0;
  for (let i = 0; i < n; i++) {
    if (i) {
      const x0 = arc[2 * i - 2];
      const y0 = arc[2 * i - 1];
      const dx = arc[2 * i] - x0;
      const dy = arc[2 * i + 1] - y0;
      const parts = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep);
      for (let j = 1; j < parts; j++) { out[o++] = x0 + (dx * j) / parts; out[o++] = y0 + (dy * j) / parts; }
    }
    out[o++] = arc[2 * i];
    out[o++] = arc[2 * i + 1];
  }
  return out;
}

/** A closed line as the map needs it: its points, a box around them, and whether it runs right round a pole. */
function makeRing(pts) {
  // pts: Float64Array, longitude continuous, NOT repeated at the end (unless it circles a pole, see below)
  let n = pts.length / 2;
  let w = Infinity; let e = -Infinity; let so = Infinity; let no = -Infinity; let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = pts[2 * i]; const y = pts[2 * i + 1];
    if (x < w) w = x; if (x > e) e = x; if (y < so) so = y; if (y > no) no = y;
    sum += y;
  }
  const turn = pts[2 * n - 2] - pts[0];
  let ext = pts;
  let pole = 0;
  if (Math.abs(turn) > 180) {
    // The line goes once round the globe (Antarctica): on a flat map it is closed along the edge of the pole it encloses.
    pole = sum < 0 ? -90 : 90;
    ext = new Float64Array(pts.length + 4);
    ext.set(pts);
    ext[pts.length] = pts[2 * n - 2]; ext[pts.length + 1] = pole;
    ext[pts.length + 2] = pts[0]; ext[pts.length + 3] = pole;
    if (pole < so) so = pole;
    if (pole > no) no = pole;
  } else if (n > 1 && Math.abs(turn) < 1e-9 && Math.abs(pts[2 * n - 1] - pts[1]) < 1e-9) {
    n -= 1;
    pts = pts.subarray(0, 2 * n);
    ext = pts;
  }
  return { pts, ext, pole, box: [w, so, e, no] };
}

/** Is (lon, lat) inside this ring? Even-odd rule on the flat lon/lat plane, trying the neighbouring turns of the globe. */
function inRing(ring, lon, lat) {
  const [w, so, e, no] = ring.box;
  if (lat < so || lat > no) return false;
  const pts = ring.ext;
  const n = pts.length / 2;
  for (let turn = -360; turn <= 360; turn += 360) {
    const x = lon + turn;
    if (x < w || x > e) continue;
    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const yi = pts[2 * i + 1];
      const yj = pts[2 * j + 1];
      if ((yi > lat) !== (yj > lat) && x < ((pts[2 * j] - pts[2 * i]) * (lat - yi)) / (yj - yi) + pts[2 * i]) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}
function inPolygon(rings, lon, lat) {
  let inside = false;
  for (const ring of rings) if (inRing(ring, lon, lat)) inside = !inside;
  return inside;
}

/** Is the point inside a polygon given as a list of [lon, lat]? (Exported for checks: a hand-drawn region, a sea …) */
export function pointInPolygon(point, polygon) {
  return inRing(makeRing(continuous(polygon)), point[0], point[1]);
}

/** [[lon, lat], …] → Float64Array with longitude made continuous (no jump at the date line). */
function continuous(points) {
  const out = new Float64Array(points.length * 2);
  let prev = null;
  points.forEach(([lon, lat], i) => {
    const x = prev === null ? lon : prev + wrap180(lon - prev);
    out[2 * i] = x;
    out[2 * i + 1] = lat;
    prev = x;
  });
  return out;
}

/** [[lon, lat], …] → Float64Array exactly as given (for shapes wider than half the globe, where "continuous" would fold them up). */
function plain(points) {
  const out = new Float64Array(points.length * 2);
  points.forEach(([lon, lat], i) => { out[2 * i] = lon; out[2 * i + 1] = lat; });
  return out;
}

/* ---------------------------------------------------------------------- layers */

function makeLayer(data) {
  const arcs = decodeArcs(data.arcs, data.step).map((a) => densify(a));
  const [coast, border, dashed] = data.n;
  return {
    res: data.res, arcs, shapes: data.shapes, lakes: data.lakes || [],
    ranges: { coast: [0, coast], border: [coast, coast + border], dashed: [coast + border, coast + border + dashed] },
    geom: new Map(), lakeGeom: null, arcBoxes: null,
  };
}

/** Join arcs into one ring (longitude continuous from arc to arc). */
function assemble(layer, refs) {
  let total = 1;
  for (const ref of refs) total += layer.arcs[ref < 0 ? ~ref : ref].length / 2 - 1;
  const out = new Float64Array(total * 2);
  let o = 0;
  let last = null;
  for (const ref of refs) {
    const arc = layer.arcs[ref < 0 ? ~ref : ref];
    const m = arc.length / 2;
    let shift = 0;
    for (let j = 0; j < m; j++) {
      const k = ref < 0 ? m - 1 - j : j;
      const lon = arc[2 * k];
      if (j === 0 && last !== null) { shift = 360 * Math.round((last - lon) / 360); continue; }
      out[o++] = lon + shift;
      out[o++] = arc[2 * k + 1];
    }
    last = out[o - 2];
  }
  const ring = makeRing(o === out.length ? out : out.subarray(0, o));
  ring.refs = refs;
  return ring;
}

/** The polygons of one country in a layer: [[ring, hole, …], …], built once. */
function geometryOf(layer, id) {
  let g = layer.geom.get(id);
  if (g === undefined) {
    const polys = layer.shapes[id];
    g = polys ? polys.map((poly) => poly.map((refs) => assemble(layer, refs))) : null;
    layer.geom.set(id, g);
  }
  return g;
}

/**
 * The main body of a country: its largest piece and everything within about 800 km of it, piece by piece
 * (Corsica with France, Alaska and the Aleutians with the United States), but not what lies overseas
 * (French Guiana, Hawaii, the Canary Islands). Returns the numbers of its polygons that belong to it.
 */
function mainBodyOf(layer, id) {
  if (!layer.main) layer.main = new Map();
  let out = layer.main.get(id);
  if (out) return out;
  const polys = geometryOf(layer, id) || [];
  out = new Set();
  if (polys.length) {
    const boxes = polys.map((rings) => rings[0].box);
    const size = (rings) => {
      const pts = rings[0].ext;
      let a = 0;
      for (let i = 0, j = pts.length / 2 - 1; i < pts.length / 2; j = i++) a += pts[2 * j] * pts[2 * i + 1] - pts[2 * i] * pts[2 * j + 1];
      return Math.abs(a) * Math.cos((((boxes[polys.indexOf(rings)][1] + boxes[polys.indexOf(rings)][3]) / 2) * RAD));
    };
    let first = 0;
    let most = -1;
    polys.forEach((rings, i) => { const a = size(rings); if (a > most) { most = a; first = i; } });
    const gap = (a, b) => {
      const turn = 360 * Math.round(((a[0] + a[2]) / 2 - (b[0] + b[2]) / 2) / 360);
      const dy = Math.max(0, a[1] - b[3], b[1] - a[3]);
      const lat = Math.min(Math.abs(Math.max(a[1], b[1])), Math.abs(Math.min(a[3], b[3])), 85);
      const dx = Math.max(0, a[0] - (b[2] + turn), b[0] + turn - a[2]) * Math.cos(lat * RAD);
      return Math.hypot(dx, dy);
    };
    out.add(first);
    for (let grew = true; grew;) {
      grew = false;
      for (let i = 0; i < polys.length; i++) {
        if (out.has(i)) continue;
        for (const k of out) if (gap(boxes[i], boxes[k]) <= 7) { out.add(i); grew = true; break; }
      }
    }
  }
  layer.main.set(id, out);
  return out;
}

/**
 * Is the point in the main body of the country (see `mainBodyOnly` in the spec)? For checks:
 *   countryAt(p) === 'FR' && inMainBody(p, 'FR')     // in France, and not in French Guiana or Réunion
 * It asks whether the point lies in, or right beside, one of the pieces that make up the main body at 1:110m.
 */
export function inMainBody(point, id) {
  const p = toPoint(point);
  const layer = baseLayer();
  const polys = p && isId(id) ? geometryOf(layer, id) : null;
  if (!polys) return false;
  const lon = wrap180(p[0]);
  for (const i of mainBodyOf(layer, id)) {
    const [w, so, e, no] = polys[i][0].box;
    if (p[1] < so - 1 || p[1] > no + 1) continue;
    for (let turn = -360; turn <= 360; turn += 360) if (lon + turn >= w - 1 && lon + turn <= e + 1) return true;
  }
  return false;
}

const layers = { '110m': null, '50m': null };
let detailPromise = null;
let riversPromise = null;
let riverData = null;
function baseLayer() { return layers['110m'] || (layers['110m'] = makeLayer(WORLD_110M)); }
/** Load the detailed (1:50m) shapes. Resolves when countryAt(point, 'high') and detailed drawing are possible. */
export function loadDetail() {
  if (!detailPromise) detailPromise = import('../../assets/geo/world-50m.js').then((m) => { layers['50m'] = makeLayer(m.default); return true; });
  return detailPromise;
}
function loadRivers() {
  if (!riversPromise) {
    riversPromise = import('../../assets/geo/rivers.js').then((m) => {
      const arcs = decodeArcs(m.default.arcs, m.default.step);
      riverData = m.default.rivers.map(([name, rank, refs]) => ({ name, rank, lines: refs.map((i) => arcs[i]) }));
      return riverData;
    });
  }
  return riversPromise;
}

/** Countries that have no shape at a resolution ('low' = 1:110m, 'high' = 1:50m once loaded): drawn as markers. */
export function markerOnly(detail = 'low') {
  const layer = detail === 'high' ? layers['50m'] : baseLayer();
  if (!layer) return null;
  return Object.keys(COUNTRIES).filter((id) => !layer.shapes[id]);
}

let placesByCountry = null;
/** The cities of the table that lie in a country: [[lon, lat], …]. */
function placesIn(id) {
  if (!placesByCountry) {
    placesByCountry = new Map();
    for (const row of Object.values(PLACES)) {
      if (!placesByCountry.has(row[2])) placesByCountry.set(row[2], []);
      placesByCountry.get(row[2]).push([row[0], row[1]]);
    }
  }
  return placesByCountry.get(id) || [];
}

function countryAtIn(layer, lon, lat, nearKm = 0) {
  // A country with no shape at this resolution is a ring on the map. Which ring, if any, is the point near?
  let ring = null;
  let ringKm = 30;
  let onIt = false;                    // is the point inside the real, tiny country (as far as its size tells)?
  for (const id of Object.keys(COUNTRIES)) {
    if (layer.shapes[id]) continue;
    const c = COUNTRIES[id];
    const exact = c[8];
    // "inside": close to its true centre for its size, or at one of its own cities in the table of places
    const km = Math.abs(c[5] - lat) > 0.5 ? Infinity : distanceKm([lon, lat], [c[4], c[5]]);
    let core = exact && Math.abs(exact[1] - lat) < 0.5 ? distanceKm([lon, lat], exact) <= Math.max(0.6 * exact[2], Math.min(2 * exact[2], 2.5)) : km <= 1;
    if (!core) for (const at of placesIn(id)) if (Math.abs(at[1] - lat) < 0.05 && distanceKm([lon, lat], at) <= Math.min(3, exact ? Math.max(0.5, exact[2]) : 1)) { core = true; break; }
    if (core ? !onIt || km < ringKm : !onIt && km < ringKm) { ring = id; ringKm = core ? Math.min(km, ringKm) : km; onIt = core; }
  }
  if (onIt) return ring;
  // A real shape under the point wins over a ring that is merely close by (Rome is in Italy, not in the Vatican).
  for (const id of Object.keys(layer.shapes)) {
    if (id === '_') continue;
    for (const poly of geometryOf(layer, id)) if (inPolygon(poly, lon, lat)) return id;
  }
  if (ring) return ring;               // at sea, right beside an island state
  if (!(nearKm > 0)) return null;
  // At sea, but perhaps only just: coastlines are simplified, and a pin on a harbour city should count.
  const reach = nearKm / 111.2;
  const kx = Math.max(0.05, Math.cos(lat * RAD));
  let best = null;
  let bestD = reach * reach;
  for (const id of Object.keys(layer.shapes)) {
    if (id === '_') continue;
    for (const poly of geometryOf(layer, id)) {
      const ring = poly[0];
      const [w, so, e, no] = ring.box;
      if (lat < so - reach || lat > no + reach) continue;
      for (let turn = -360; turn <= 360; turn += 360) {
        const x = lon + turn;
        if (x < w - reach / kx || x > e + reach / kx) continue;
        const pts = ring.ext;
        const n = pts.length / 2;
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const ax = (pts[2 * j] - x) * kx; const ay = pts[2 * j + 1] - lat;
          const bx = (pts[2 * i] - x) * kx; const by = pts[2 * i + 1] - lat;
          const dx = bx - ax; const dy = by - ay;
          const len = dx * dx + dy * dy;
          const t = len ? clamp(-(ax * dx + ay * dy) / len, 0, 1) : 0;
          const d = (ax + t * dx) ** 2 + (ay + t * dy) ** 2;
          if (d < bestD) { bestD = d; best = id; }
        }
      }
    }
  }
  return best;
}

/**
 * Which country is this [lon, lat] point in? null at sea (and on unassigned land).
 * Uses the 1:110m shapes unless `detail` is 'high' AND the detailed layer has been loaded (see loadDetail()).
 * With `nearKm`, a point at sea within that distance of a coast counts as the nearest country (coastlines are
 * simplified, so a harbour city can be a few kilometres "offshore"). The `country` of place mode uses 25 km.
 */
export function countryAt(point, detail = 'low', nearKm = 0) {
  const p = toPoint(point);
  if (!p) return null;
  const layer = (detail === 'high' && layers['50m']) || baseLayer();
  return countryAtIn(layer, wrap180(p[0]), p[1], nearKm);
}

/* ================================================================= projections */

const EE = [1.340264, -0.081106, 0.000893, 0.003796];
const EE_M = Math.sqrt(3) / 2;
const MERC_MAX = 85.0511 * RAD;
const SQRT1_2 = Math.SQRT1_2;
/** Flat-map projections: fwd(lambda, phi, out) writes out.X, out.Y; inv(x, y) → [lambda, phi] or null. Radians. */
const PLANAR = {
  'equal-earth': {
    fwd(l, p, o) {
      const t = Math.asin(EE_M * Math.sin(p));
      const t2 = t * t;
      const t6 = t2 * t2 * t2;
      o.X = (l * Math.cos(t)) / (EE_M * (EE[0] + 3 * EE[1] * t2 + t6 * (7 * EE[2] + 9 * EE[3] * t2)));
      o.Y = t * (EE[0] + EE[1] * t2 + t6 * (EE[2] + EE[3] * t2));
    },
    inv(x, y) {
      let t = y;
      for (let i = 0; i < 14; i++) {
        const t2 = t * t;
        const t6 = t2 * t2 * t2;
        const d = (t * (EE[0] + EE[1] * t2 + t6 * (EE[2] + EE[3] * t2)) - y) / (EE[0] + 3 * EE[1] * t2 + t6 * (7 * EE[2] + 9 * EE[3] * t2));
        t -= d;
        if (Math.abs(d) < 1e-13) break;
      }
      const t2 = t * t;
      const t6 = t2 * t2 * t2;
      const sp = Math.sin(t) / EE_M;
      if (!(Math.abs(sp) <= 1)) return null;
      return [(EE_M * x * (EE[0] + 3 * EE[1] * t2 + t6 * (7 * EE[2] + 9 * EE[3] * t2))) / Math.cos(t), Math.asin(sp)];
    },
  },
  'natural-earth': {
    fwd(l, p, o) {
      const p2 = p * p;
      const p4 = p2 * p2;
      o.X = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)));
      o.Y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
    },
    inv(x, y) {
      let p = y;
      for (let i = 0; i < 25; i++) {
        const p2 = p * p;
        const p4 = p2 * p2;
        const d = (p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4))) - y)
          / (1.007226 + p2 * (0.045255 + p4 * (-0.311325 + 0.259866 * p2 - 0.065076 * p4)));
        p -= d;
        if (Math.abs(d) < 1e-13) break;
      }
      const p2 = p * p;
      const p4 = p2 * p2;
      return [x / (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))), p];
    },
  },
  mercator: {
    fwd(l, p, o) { o.X = l; o.Y = Math.log(Math.tan(Math.PI / 4 + clamp(p, -MERC_MAX, MERC_MAX) / 2)); },
    inv(x, y) { return [x, 2 * Math.atan(Math.exp(y)) - Math.PI / 2]; },
  },
  equirectangular: {
    fwd(l, p, o) { o.X = l; o.Y = p; },
    inv(x, y) { return [x, y]; },
  },
  'gall-peters': {
    fwd(l, p, o) { o.X = l * SQRT1_2; o.Y = Math.sin(p) / SQRT1_2; },
    inv(x, y) { const sp = y * SQRT1_2; return Math.abs(sp) <= 1 ? [x / SQRT1_2, Math.asin(sp)] : null; },
  },
};
/** Projections seen from above a point: f(cos c) scales the direction, r(c) is the distance from the centre, c(r) undoes it. */
const AZIMUTHAL = {
  orthographic: { f: () => 1, r: (c) => Math.sin(c), c: (r) => Math.asin(Math.min(1, r)), clip: 90 },
  'azimuthal-equal-area': { f: (z) => Math.sqrt(2 / (1 + z)), r: (c) => 2 * Math.sin(c / 2), c: (r) => 2 * Math.asin(Math.min(1, r / 2)), clip: 179 },
  'azimuthal-equidistant': { f: (z) => { const c = Math.acos(clamp(z, -1, 1)); return c < 1e-9 ? 1 : c / Math.sin(c); }, r: (c) => c, c: (r) => r, clip: 179 },
};
export const PROJECTIONS = [...Object.keys(PLANAR), ...Object.keys(AZIMUTHAL)];

/**
 * The working projection: geography → drawing units. `raw(lon, lat)` leaves its result in P.X, P.Y (y up) and,
 * for the azimuthal family, P.V (is the point on the visible side of the clip circle?) and P.A (its direction
 * from the centre). The fit (P.k, P.tx, P.ty) turns those into SVG units.
 */
function makeProjector(name, lon0 = 0, lat0 = 0, clipDeg = null) {
  const P = { name, lon0, lat0, X: 0, Y: 0, Z: 1, V: true, A: 0, x3: 0, y3: 0, k: 1, tx: 0, ty: 0 };
  const az = AZIMUTHAL[name];
  if (az) {
    const sin0 = Math.sin(lat0 * RAD);
    const cos0 = Math.cos(lat0 * RAD);
    const clip = (clipDeg == null ? az.clip : clipDeg) * RAD;
    const cosClip = Math.cos(clip);
    const rClip = az.r(clip);
    Object.assign(P, { azimuthal: true, clip, cosClip, rClip });
    P.raw = (lon, lat) => {
      const l = (lon - lon0) * RAD;
      const p = lat * RAD;
      const cp = Math.cos(p);
      const sp = Math.sin(p);
      const cl = Math.cos(l);
      const x = cp * Math.sin(l);
      const y = cos0 * sp - sin0 * cp * cl;
      const z = sin0 * sp + cos0 * cp * cl;
      P.x3 = x; P.y3 = y; P.Z = z;
      if (z >= cosClip) { const f = az.f(z); P.X = x * f; P.Y = y * f; P.V = true; }
      else { const a = Math.atan2(y, x); P.A = a; P.X = rClip * Math.cos(a); P.Y = rClip * Math.sin(a); P.V = false; }
    };
    P.rawInv = (X, Y) => {
      const rho = Math.hypot(X, Y);
      if (rho > rClip + 1e-9) return null;
      if (rho < 1e-12) return [lon0, lat0];
      const c = az.c(rho);
      const sc = Math.sin(c);
      const cc = Math.cos(c);
      const lat = Math.asin(clamp(cc * sin0 + (Y * sc * cos0) / rho, -1, 1));
      const lon = lon0 + Math.atan2(X * sc, rho * cos0 * cc - Y * sin0 * sc) * DEG;
      return [wrap180(lon), lat * DEG];
    };
    P.forward = (lon, lat) => { P.raw(lon, lat); return P.V; };
  } else {
    const flat = PLANAR[name] || PLANAR['equal-earth'];
    P.azimuthal = false;
    /** u: degrees east of the central meridian (the caller keeps it within ±180). */
    P.raw = (u, lat) => { flat.fwd(u * RAD, lat * RAD, P); };
    P.rawInv = (X, Y) => {
      const out = flat.inv(X, Y);
      if (!out) return null;
      const [l, p] = out;
      if (!(Math.abs(l) <= Math.PI + 1e-9) || !(Math.abs(p) <= Math.PI / 2 + 1e-9)) return null;
      return [wrap180(lon0 + l * DEG), p * DEG];
    };
    P.forward = (lon, lat) => { P.raw(wrap180(lon - lon0), lat); return true; };
  }
  /** [lon, lat] → [x, y] in SVG units, or null when the point is on the far side of a globe. */
  P.project = (lon, lat) => (P.forward(lon, lat) ? [P.tx + P.k * P.X, P.ty - P.k * P.Y] : null);
  /** SVG units → [lon, lat], or null off the edge of the world. */
  P.invert = (x, y) => P.rawInv((x - P.tx) / P.k, (P.ty - y) / P.k);
  return P;
}

/**
 * A projection for use outside the widget (and in tests):
 *   const p = makeProjection('equal-earth', { center: [0, 0] });
 *   p.forward([lon, lat]) → [x, y] on a globe of radius 1 (y up), or null if the point cannot be seen
 *   p.inverse([x, y])     → [lon, lat], or null outside the map
 */
export function makeProjection(name, { center = [0, 0], clip = null } = {}) {
  if (!PLANAR[name] && !AZIMUTHAL[name]) throw new Error(`world-map: unknown projection "${name}"`);
  const P = makeProjector(name, center[0], center[1], clip);
  return {
    name,
    forward: ([lon, lat]) => (P.forward(lon, lat) ? [P.X, P.Y] : null),
    inverse: ([x, y]) => P.rawInv(x, y),
  };
}

/* --------------------------------------------------------------- path building */

const f1 = (v) => Math.round(v * 10) / 10;

/**
 * A closed ring on a flat map. The ring is laid out east of the central meridian as one continuous line; if
 * it sticks out past ±180° it is drawn again a whole turn away, and each copy is cut off at the edge of the map.
 */
function flatRing(P, M, ring) {
  const pts = ring.ext;
  const n = pts.length / 2;
  const mid = (ring.box[0] + ring.box[2]) / 2;
  const off = 360 * Math.round((P.lon0 - mid) / 360) - P.lon0;
  const lo = ring.box[0] + off;
  const hi = ring.box[2] + off;
  let d = '';
  for (let turn = -360; turn <= 360; turn += 360) {
    if (hi + turn < -180 || lo + turn > 180) continue;
    const shift = off + turn;
    let first = true;
    const put = (u, lat) => { P.raw(u, lat); d += `${first ? 'M' : 'L'}${f1(M.x + M.k * P.X)} ${f1(M.y - M.k * P.Y)}`; first = false; };
    if (lo + turn >= -180 && hi + turn <= 180) {
      for (let i = 0; i < n; i++) put(pts[2 * i] + shift, pts[2 * i + 1]);
      d += 'Z';
      continue;
    }
    let pu = 0; let pl = 0; let ps = 0;
    for (let i = 0; i <= n; i++) {
      const j = i % n;
      const u = pts[2 * j] + shift;
      const lat = pts[2 * j + 1];
      const side = u < -180 ? -1 : u > 180 ? 1 : 0;
      if (i > 0) {
        if (side !== ps) {
          if (ps !== 0) put(ps * 180, pl + ((ps * 180 - pu) / (u - pu)) * (lat - pl));
          if (side !== 0) put(side * 180, pl + ((side * 180 - pu) / (u - pu)) * (lat - pl));
        } else if (side !== 0 && Math.abs(lat - pl) > 4) {
          // both ends on the edge of the map: follow the (curved) edge
          const parts = Math.ceil(Math.abs(lat - pl) / 4);
          for (let q = 1; q < parts; q++) put(side * 180, pl + ((lat - pl) * q) / parts);
        }
      }
      if (i < n) put(side ? side * 180 : u, lat);
      pu = u; pl = lat; ps = side;
    }
    d += 'Z';
  }
  return d;
}

/**
 * A closed ring seen from above a point (a globe, or an azimuthal map). Points beyond the clip circle are
 * pushed onto the circle in their own direction, so the hidden part of the ring collapses onto the rim.
 * (What that leaves wrong, a polygon that contains the point opposite the centre, is put right in fillPath.)
 */
function roundRing(P, M, ring) {
  const pts = ring.pts;
  const n = pts.length / 2;
  const R = P.rClip;
  const cc = P.cosClip;
  let d = '';
  const put = (X, Y) => { d += `${d ? 'L' : 'M'}${f1(M.x + M.k * X)} ${f1(M.y - M.k * Y)}`; };
  const rim = (a) => put(R * Math.cos(a), R * Math.sin(a));
  const along = (a0, a1) => {
    let da = a1 - a0;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    const parts = Math.floor(Math.abs(da) / 0.1);
    for (let q = 1; q <= parts; q++) rim(a0 + (da * q) / (parts + 1));
  };
  let pv = true; let pa = 0; let px = 0; let py = 0; let pz = 0;
  const closed = !ring.pole;
  const count = closed ? n : n - 1;         // a ring round the pole repeats its first point (a whole turn on)
  for (let i = 0; i <= count; i++) {
    const j = i % count;
    P.raw(pts[2 * j], pts[2 * j + 1]);
    if (i > 0) {
      if (P.V !== pv) {
        const t = (pz - cc) / (pz - P.Z);
        const a = Math.atan2(py + t * (P.y3 - py), px + t * (P.x3 - px));
        if (pv) { rim(a); along(a, P.A); } else { along(pa, a); rim(a); }
      } else if (!pv) along(pa, P.A);
    }
    if (i < count) put(P.X, P.Y);
    pv = P.V; pa = P.A; px = P.x3; py = P.y3; pz = P.Z;
  }
  return d ? `${d}Z` : '';
}

function circlePath(M, r) {
  const R = r * M.k;
  return `M${f1(M.x - R)} ${f1(M.y)}A${f1(R)} ${f1(R)} 0 1 0 ${f1(M.x + R)} ${f1(M.y)}A${f1(R)} ${f1(R)} 0 1 0 ${f1(M.x - R)} ${f1(M.y)}Z`;
}

/**
 * Path data for a filled shape: polygons = [[ring, hole, …], …]. Use fill-rule: evenodd.
 * `quick(ring)` may return ready path data for a ring that lies wholly inside the map (see quickRing in the widget).
 */
function fillPath(P, M, polygons, anti = null, quick = null) {
  let d = '';
  for (const rings of polygons) {
    if (P.azimuthal) {
      for (const ring of rings) d += (quick && quick(ring)) || roundRing(P, M, ring);
      // A polygon that contains the point opposite the centre comes out inside-out: adding the whole disc turns it back.
      if (anti && inPolygon(rings, anti[0], anti[1])) d += circlePath(M, P.rClip);
    } else {
      for (const ring of rings) d += (quick && quick(ring)) || flatRing(P, M, ring);
    }
  }
  return d;
}

/** Path data for an open line (Float64Array lon/lat, longitude continuous). Breaks at the edge of the map. */
function linePath(P, M, pts, closed = false) {
  const n = pts.length / 2;
  if (n < 2) return '';
  let d = '';
  const count = closed ? n + 1 : n;
  if (P.azimuthal) {
    let pv = false; let px = 0; let py = 0; let pz = 0;
    let pen = false;
    const R = P.rClip;
    for (let i = 0; i < count; i++) {
      const j = i % n;
      P.raw(pts[2 * j], pts[2 * j + 1]);
      if (i > 0 && P.V !== pv) {
        // where the line crosses the rim
        const t = (pz - P.cosClip) / (pz - P.Z);
        const a = Math.atan2(py + t * (P.y3 - py), px + t * (P.x3 - px));
        d += `${pv ? 'L' : 'M'}${f1(M.x + M.k * R * Math.cos(a))} ${f1(M.y - M.k * R * Math.sin(a))}`;
        pen = !pv;
      }
      if (P.V) { d += `${pen ? 'L' : 'M'}${f1(M.x + M.k * P.X)} ${f1(M.y - M.k * P.Y)}`; pen = true; }
      pv = P.V; px = P.x3; py = P.y3; pz = P.Z;
    }
    return d;
  }
  // flat map: lay the line out continuously, then draw each whole turn that reaches into ±180
  let lo = Infinity;
  let hi = -Infinity;
  const us = new Float64Array(count);
  let prev = 0;
  for (let i = 0; i < count; i++) {
    const j = i % n;
    const u = i === 0 ? wrap180(pts[0] - P.lon0) : prev + wrap180(pts[2 * j] - pts[2 * ((i - 1) % n)]);
    us[i] = u;
    prev = u;
    if (u < lo) lo = u;
    if (u > hi) hi = u;
  }
  for (let turn = -360; turn <= 360; turn += 360) {
    if (hi + turn < -180 || lo + turn > 180) continue;
    let pen = false;
    let pu = 0; let pl = 0; let pin = false;
    const put = (u, lat) => { P.raw(u, lat); d += `${pen ? 'L' : 'M'}${f1(M.x + M.k * P.X)} ${f1(M.y - M.k * P.Y)}`; pen = true; };
    for (let i = 0; i < count; i++) {
      const u = us[i] + turn;
      const lat = pts[2 * (i % n) + 1];
      const inside = u >= -180 && u <= 180;
      if (i > 0 && inside !== pin) {
        const edge = (inside ? pu : u) < -180 ? -180 : 180;
        put(edge, pl + ((edge - pu) / (u - pu)) * (lat - pl));
        if (!inside) pen = false;
      }
      if (inside) put(u, lat);
      pu = u; pl = lat; pin = inside;
    }
  }
  return d;
}

/* ======================================================================= views */

/** Boxes of several countries or regions joined into one [w, s, e, n] (east may pass 180). */
function boxOfIds(ids) {
  let out = null;
  for (const id of ids) {
    const b = COUNTRIES[id] && COUNTRIES[id][6];
    if (!b) continue;
    if (!out) { out = b.slice(); continue; }
    const turn = 360 * Math.round(((out[0] + out[2]) / 2 - (b[0] + b[2]) / 2) / 360);
    out = [Math.min(out[0], b[0] + turn), Math.min(out[1], b[1]), Math.max(out[2], b[2] + turn), Math.max(out[3], b[3])];
  }
  return out;
}
function padBox(box, pad) {
  const dx = Math.max(0.6, (box[2] - box[0]) * pad);
  const dy = Math.max(0.6, (box[3] - box[1]) * pad);
  return [box[0] - dx, Math.max(-89.9, box[1] - dy), box[2] + dx, Math.min(89.9, box[3] + dy)];
}

/** spec.view → { kind: 'world' } | { kind: 'box', box } | { kind: 'cap', center, span }, plus a name for the description. */
function resolveView(view) {
  if (view == null || view === 'world') return { kind: 'world', name: 'the world' };
  if (typeof view === 'string') {
    const key = VIEWS[view] !== undefined ? view : VIEW_ALIAS[view];
    if (key) return { ...resolveView(VIEWS[key]), name: key.replace(/-/g, ' ') };
    const ids = toIds(view);
    const box = boxOfIds(ids);
    if (box) return { kind: 'box', box: padBox(box, 0.12), name: ids.length === 1 ? countryName(ids[0]) : view.replace(/-/g, ' ') };
    return { kind: 'world', name: 'the world' };
  }
  if (Array.isArray(view)) {
    if (view.length === 4 && view.every(Number.isFinite)) {
      let [w, so, e, no] = view;
      if (e <= w) e += 360;
      if (e - w >= 359.9 && so <= -89 && no >= 89) return { kind: 'world', name: 'the world' };
      return { kind: 'box', box: [w, Math.max(-90, so), e, Math.min(90, no)], name: 'part of the world' };
    }
    const ids = toIds(view);
    const box = boxOfIds(ids);
    if (box) return { kind: 'box', box: padBox(box, 0.12), name: ids.length === 1 ? countryName(ids[0]) : 'part of the world' };
    return { kind: 'world', name: 'the world' };
  }
  if (typeof view === 'object') {
    if (view.bounds) return resolveView(view.bounds);
    if (view.ids) {
      const box = boxOfIds(toIds(view.ids));
      if (box) return { kind: 'box', box: padBox(box, view.pad == null ? 0.12 : view.pad), name: 'part of the world' };
    }
    const center = toPoint(view.center);
    if (center) return { kind: 'cap', center, span: clamp(Number(view.span) || 40, 1, 360), name: 'part of the world' };
  }
  return { kind: 'world', name: 'the world' };
}

/* ====================================================================== widget */

const W = 720;
const SHAPES = {
  // marker outlines for a marker of "radius" 1, centred on the point (the pin stands on it)
  square: 'M-0.85 -0.85H0.85V0.85H-0.85Z',
  diamond: 'M0 -1.15L1.15 0L0 1.15L-1.15 0Z',
  triangle: 'M0 -1.15L1.1 0.8H-1.1Z',
  star: 'M0 -1.3L0.38 -0.42L1.24 -0.4L0.56 0.18L0.76 1.05L0 0.56L-0.76 1.05L-0.56 0.18L-1.24 -0.4L-0.38 -0.42Z',
  pin: 'M0 0C-1.5 -1.9 -1.25 -3.4 0 -3.4C1.25 -3.4 1.5 -1.9 0 0Z',
};
const MARKER_SIZE = { s: 3.6, m: 5, l: 6.8 };
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const colour = (name, fallback = 'blue') => (HUES.includes(name) || ['ink', 'ink-2', 'ink-3'].includes(name) ? name : fallback);
const degrees = (lon, lat) => `${Math.abs(Math.round(lat))}° ${lat >= 0 ? 'north' : 'south'}, ${Math.abs(Math.round(wrap180(lon)))}° ${wrap180(lon) >= 0 ? 'east' : 'west'}`;
const listText = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
let seq = 0;

export default function create(spec, env) {
  const uid = `wm${++seq}`;
  const compact = !!env.compact;
  const isStatic = compact || !!spec.static;
  const MODES = ['view', 'pick', 'pickMany', 'pickMarker', 'pickMarkers', 'place', 'trace'];
  const mode = MODES.includes(spec.mode) && !isStatic ? spec.mode : 'view';
  const countryMode = mode === 'pick' || mode === 'pickMany';
  const markerMode = mode === 'pickMarker' || mode === 'pickMarkers' || mode === 'trace';
  const many = mode === 'pickMany' || mode === 'pickMarkers';
  const names = isStatic ? false : spec.names == null ? mode === 'view' : !!spec.names;
  const canZoom = !isStatic && spec.zoom !== false;
  const pickHue = colour(spec.pickColor, 'yellow');
  let readOnly = !!env.readOnly;
  let forcedReveal = null;                 // setState({ reveal }) overrides "revealed when read-only"
  const revealed = () => (forcedReveal != null ? forcedReveal : readOnly && spec.reveal !== false && mode !== 'view');
  const showNames = () => names || revealed();
  let destroyed = false;

  /* ------------------------------------------------------------ projection */
  const view = resolveView(spec.view);
  const wantCenter = typeof spec.center === 'number' ? [spec.center, null] : Array.isArray(spec.center) ? spec.center : toPoint(spec.center);
  let projName = PROJECTIONS.includes(spec.projection) ? spec.projection : 'auto';
  const boxMid = view.kind === 'box' ? [(view.box[0] + view.box[2]) / 2, (view.box[1] + view.box[3]) / 2] : view.kind === 'cap' ? view.center : [0, 0];
  if (projName === 'auto') {
    if (view.kind === 'world') projName = 'equal-earth';
    else if (view.kind === 'box') projName = view.box[2] - view.box[0] > 200 ? 'equal-earth' : 'azimuthal-equal-area';
    else projName = view.span > 180 ? 'equal-earth' : 'azimuthal-equal-area';
  }
  const isRound = !!AZIMUTHAL[projName];
  const globe = projName === 'orthographic';
  const wholeDisc = isRound && (globe || view.kind === 'world');
  let lon0 = wantCenter && Number.isFinite(wantCenter[0]) ? wantCenter[0] : view.kind === 'world' ? 0 : boxMid[0];
  let lat0 = !isRound ? 0 : wantCenter && Number.isFinite(wantCenter[1]) ? wantCenter[1] : view.kind === 'world' ? (globe ? 15 : 90) : boxMid[1];
  lat0 = clamp(lat0, -90, 90);
  let P = makeProjector(projName, lon0, lat0, isRound && !wholeDisc ? 120 : null);

  // The window of the drawing in the projection's own units: [x0, y0, x1, y1]
  function extent() {
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    const add = () => { if (P.X < x0) x0 = P.X; if (P.X > x1) x1 = P.X; if (P.Y < y0) y0 = P.Y; if (P.Y > y1) y1 = P.Y; };
    if (wholeDisc) return [-P.rClip, -P.rClip, P.rClip, P.rClip];
    let box = view.kind === 'box' ? view.box : null;
    if (view.kind === 'world') box = projName === 'mercator' ? [lon0 - 180, -58, lon0 + 180, 84] : [lon0 - 180, -90, lon0 + 180, 90];
    if (view.kind === 'cap') {
      if (isRound) {
        const r = AZIMUTHAL[projName].r(Math.min(view.span / 2, 170) * RAD);
        const a = Number(spec.aspect) > 0 ? Number(spec.aspect) : 1.35;
        return [-r, -r / a, r, r / a];
      }
      const half = view.span / 2;
      const wide = Math.min(180, half / Math.max(0.2, Math.cos(view.center[1] * RAD)));
      box = [view.center[0] - wide, Math.max(-90, view.center[1] - half / 1.35), view.center[0] + wide, Math.min(90, view.center[1] + half / 1.35)];
    }
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const lon = box[0] + ((box[2] - box[0]) * i) / steps;
      const lat = box[1] + ((box[3] - box[1]) * i) / steps;
      for (const [x, y] of [[lon, box[1]], [lon, box[3]], [box[0], lat], [box[2], lat]]) {
        if (isRound) { P.raw(x, y); if (P.V) add(); }
        else { P.raw(clamp(x - lon0, -180, 180), y); add(); }
      }
    }
    if (isRound) { P.raw(boxMid[0], boxMid[1]); add(); }
    return [x0, y0, x1, y1];
  }
  const ext = extent();
  const extW = Math.max(1e-6, ext[2] - ext[0]);
  const extH = Math.max(1e-6, ext[3] - ext[1]);
  const aspect = Number(spec.aspect) > 0 ? clamp(Number(spec.aspect), 0.5, 3) : clamp(extW / extH, compact ? 1 : 0.8, 2.4);
  const H = Math.round(W / aspect);
  const pad = wholeDisc ? 10 : view.kind === 'world' && ['equal-earth', 'natural-earth'].includes(projName) ? 6 : 0;
  P.k = Math.min((W - 2 * pad) / extW, (H - 2 * pad) / extH);
  P.tx = W / 2 - (P.k * (ext[0] + ext[2])) / 2;
  P.ty = H / 2 + (P.k * (ext[1] + ext[3])) / 2;

  // How much of the globe the window shows: used to choose the level of detail and to skip what is out of sight.
  function viewRadius() {
    if (!isRound || wholeDisc) return 180;
    let worst = 0;
    for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H], [W / 2, 0], [W / 2, H], [0, H / 2], [W, H / 2]]) {
      const g = P.invert(x, y);
      if (!g) return 180;
      worst = Math.max(worst, distanceKm([P.lon0, P.lat0], g) / EARTH_KM * DEG);
    }
    return worst;
  }
  const seen = viewRadius();
  const regional = view.kind !== 'world' && !globe && (isRound ? seen < 62 : (view.kind === 'box' ? view.box[2] - view.box[0] : view.span) < 115);
  const wantDetail = spec.detail === 'high' || (spec.detail !== 'low' && regional);
  let layer = (wantDetail && layers['50m']) || baseLayer();

  /* ----------------------------------------------------------------- scene */
  const maxWidth = Number(spec.maxWidth) > 0 ? Number(spec.maxWidth) : aspect >= 1.5 ? 680 : Math.round(clamp(470 * aspect, 360, 620));
  const fr = frame({ width: W, height: H, compact, maxWidth: compact ? null : maxWidth, label: spec.alt || `Map of ${view.name}` });
  const { svg } = fr;
  if (globe && !isStatic) svg.classList.add('is-globe');
  let unit = compact ? W / 240 : W / Math.min(maxWidth, 640);    // SVG units per CSS pixel; corrected as soon as the size is known
  svg.style.setProperty('--wm-u', String(round(unit, 3)));

  const gMap = s('g.wm-map');
  const gOver = s('g.wm-over');
  svg.append(gMap, gOver);
  const ocean = s('path.wm-ocean');
  const grat = s('path.wm-grat');
  const gLand = s('g');
  const lakesEl = s('path.wm-lake');
  const gRivers = s('g');
  const gAreas = s('g');
  const borderEl = s('path.wm-border');
  const dashedEl = s('path.wm-dashed');
  const coastEl = s('path.wm-coast');
  const rimEl = s('path.wm-rim');
  const gPar = s('g');
  const gHi = s('g');
  gMap.append(ocean, grat, gLand, lakesEl, gRivers, gAreas, borderEl, dashedEl, coastEl, rimEl, gPar, gHi);
  const gLines = s('g');
  const gDots = s('g');
  const gText = s('g');
  const gMarks = s('g');
  const gTop = s('g');
  const gKeys = s('g.wm-keys');
  const cursorEl = s('circle.wm-cursor', { visibility: 'hidden' });
  gOver.append(gLines, gDots, gText, gMarks, gTop, gKeys, cursorEl);

  /* --------------------------------------------------------- zoom and pan */
  let zoom = 1;
  let cx0 = W / 2;                      // the point of the unzoomed drawing that sits in the middle of the window
  let cy0 = H / 2;
  const maxZoom = globe ? 6 : 10;
  /** The mapping used for things drawn in the overlay: projection units → SVG units, zoom included. */
  const overlayMap = () => ({ k: P.k * zoom, x: (P.tx - cx0) * zoom + W / 2, y: (P.ty - cy0) * zoom + H / 2 });
  const baseMap = () => ({ k: P.k, x: P.tx, y: P.ty });
  const toScreen = (p) => (p ? [(p[0] - cx0) * zoom + W / 2, (p[1] - cy0) * zoom + H / 2] : null);
  const toBase = (x, y) => [(x - W / 2) / zoom + cx0, (y - H / 2) / zoom + cy0];
  const screenOf = (lon, lat) => toScreen(P.project(lon, lat));
  const geoAt = (x, y) => { const b = toBase(x, y); return P.invert(b[0], b[1]); };
  const onCanvas = (p, margin = 0) => !!p && p[0] >= -margin && p[0] <= W + margin && p[1] >= -margin && p[1] <= H + margin;

  /* --------------------------------------------------------------- content */
  const info = COUNTRIES;
  const regionOf = new Map();         // id -> { color, tone }
  const groups = [];
  for (const r of Array.isArray(spec.regions) ? spec.regions : []) {
    const ids = toIds(r.ids != null ? r.ids : r.id);
    const group = { ids, color: colour(r.color, 'orange'), tone: r.tone === 'soft' ? 'soft' : '', label: r.label || '', mainOnly: !!r.mainBodyOnly };
    groups.push(group);
    for (const id of ids) regionOf.set(id, group);
  }
  const dim = spec.dim == null ? groups.length > 0 : !!spec.dim;
  /** mainBodyOnly: the overseas parts of these countries are drawn as plain land, apart from the country itself. */
  const mainOnly = (id) => !!spec.mainBodyOnly || (regionOf.has(id) && regionOf.get(id).mainOnly);

  // markers
  const markers = [];
  (Array.isArray(spec.markers) ? spec.markers : []).forEach((m, i) => {
    const at = toPoint(m.at != null ? m.at : m.place);
    if (!at) return;
    markers.push({
      id: m.id != null ? String(m.id) : null, at, label: m.label != null ? String(m.label) : (typeof m.at === 'string' && m.label !== false ? m.at : ''),
      color: colour(m.color, 'red'), shape: SHAPES[m.shape] || m.shape === 'ring' ? m.shape : 'dot', r: MARKER_SIZE[m.size] || MARKER_SIZE.m,
      labelPos: m.labelPos || 'auto', index: i, letter: '',
    });
  });
  const markerById = new Map(markers.filter((m) => m.id).map((m) => [m.id, m]));
  const hideMarkerLabels = spec.markerLabels === 'after';
  const pickableMarkers = markerMode
    ? markers.filter((m) => m.id && (!spec.pickable || [].concat(spec.pickable).map(String).includes(m.id)))
    : [];
  pickableMarkers.forEach((m, i) => { m.letter = LETTERS[i % 26] + (i >= 26 ? String(Math.floor(i / 26)) : ''); });
  const geoPoint = (v) => (typeof v === 'string' && markerById.has(v) ? markerById.get(v).at : toPoint(v));

  // which countries can be picked / explored
  const pickSet = countryMode && spec.pickable ? new Set(toIds(spec.pickable)) : null;
  const answerIds = countryMode ? toIds(spec.answer) : [];
  const answerMarkers = markerMode && mode !== 'trace' && spec.answer != null ? [].concat(spec.answer).map(String).filter((id) => markerById.has(id)) : [];
  const answerRoute = mode === 'trace' && Array.isArray(spec.answer) ? spec.answer.map(String).filter((id) => markerById.has(id)) : [];

  // labels asked for
  const labelSpecs = [];              // { id | at, text, style, forced }
  const wantLabels = spec.labels;
  if (wantLabels === true || wantLabels === 'all') {
    const ids = wantLabels === 'all' || !groups.length ? Object.keys(info) : Array.from(regionOf.keys());
    for (const id of ids) labelSpecs.push({ id, text: info[id][0], style: '', forced: false });
  } else if (wantLabels) {
    for (const item of [].concat(wantLabels)) {
      if (typeof item === 'string') for (const id of toIds(item)) labelSpecs.push({ id, text: info[id][0], style: '', forced: true });
      else if (item && isId(item.id)) labelSpecs.push({ id: item.id, text: item.text != null ? String(item.text) : info[item.id][0], style: item.style || '', forced: true });
      else if (item && toPoint(item.at)) labelSpecs.push({ at: toPoint(item.at), text: String(item.text || ''), style: item.style || 'area', forced: true });
    }
  }
  if (spec.continents) for (const [text, lon, lat] of CONTINENTS) labelSpecs.push({ at: [lon, lat], text, style: 'area', forced: false, big: true });
  if (spec.oceans) for (const [text, lon, lat] of OCEANS) labelSpecs.push({ at: [lon, lat], text, style: 'water', forced: false });

  // tiny countries drawn as rings
  // Listed by its own code anywhere in the spec: always. Reached through a region name ('africa'): only sovereign
  // states, and not on a whole-world map, where forty rings would say less than they hide.
  const byCode = new Set();
  const collect = (v) => { for (const item of v == null || v === true ? [] : [].concat(v)) { if (isId(item)) byCode.add(item); else if (item && isId(item.id)) byCode.add(item.id); } };
  for (const r of Array.isArray(spec.regions) ? spec.regions : []) collect(r.ids != null ? r.ids : r.id);
  collect(spec.pickable); collect(spec.answer); collect(spec.labels);
  const zoomedIn = view.kind !== 'world' && !globe;
  const dotWanted = (id) => {
    if (spec.dots === false) return false;
    if (byCode.has(id)) return true;
    if (info[id][3]) return false;
    if (spec.dots === true) return true;
    if (pickSet) return pickSet.has(id) && zoomedIn;
    if (regionOf.has(id)) return zoomedIn;
    return zoomedIn && (countryMode || (mode === 'view' && names && regional));
  };

  // parallels and meridians
  const graticuleLines = [];
  for (const item of [].concat(spec.parallels || [])) {
    const list = typeof item === 'string' ? LINES_OF_LATITUDE[item] || [] : typeof item === 'number' ? [{ lat: item }] : item && Number.isFinite(item.lat) ? [item] : [];
    for (const l of list) graticuleLines.push({ lat: clamp(l.lat, -89.9, 89.9), label: l.label != null ? String(l.label) : '', color: l.color ? colour(l.color, 'ink-2') : null, dashed: !!l.dashed });
  }
  for (const item of [].concat(spec.meridians || [])) {
    const list = typeof item === 'string' ? LINES_OF_LONGITUDE[item] || [] : typeof item === 'number' ? [{ lon: item }] : item && Number.isFinite(item.lon) ? [item] : [];
    for (const l of list) graticuleLines.push({ lon: l.lon, label: l.label != null ? String(l.label) : '', color: l.color ? colour(l.color, 'ink-2') : null, dashed: !!l.dashed });
  }
  for (const l of graticuleLines) {
    const pts = [];
    if (l.lat != null) for (let lon = -180; lon <= 180; lon += 2) pts.push([lon, l.lat]);
    else for (let lat = -88; lat <= 88; lat += 2) pts.push([l.lon, lat]);
    l.pts = continuous(pts);
    l.el = s('path', { class: cx('wm-par', l.dashed && 'is-dashed'), style: l.color ? `--c:${hue(l.color)}` : null });
    gPar.appendChild(l.el);
  }

  // areas
  // a closed outline from corner points: the last side (back to the start) is cut into short steps like the others
  const ringOfPoints = (points, lay = continuous) => makeRing(densify(lay(points.concat([points[0]])), 2));
  const areas = [];
  for (const a of Array.isArray(spec.areas) ? spec.areas : []) {
    const area = { color: colour(a.color, 'violet'), label: a.label ? String(a.label) : '', labelAt: toPoint(a.labelAt), outline: a.outline !== false, dashed: !!a.dashed, rings: [], lines: [], anchor: null,
      onMap: a.labelOn !== 'legend', inLegend: a.labelOn !== 'map' };
    let box = null;
    if (Array.isArray(a.polygon) && a.polygon.length >= 3) {
      const pts = a.polygon.map(toPoint).filter(Boolean);
      if (pts.length < 3) continue;
      const ring = ringOfPoints(pts);
      area.rings = [[ring]];
      area.lines = [{ pts: ring.pts, closed: true }];
      area.anchor = [(ring.box[0] + ring.box[2]) / 2, (ring.box[1] + ring.box[3]) / 2];
    } else if (a.circle != null && toPoint(a.circle)) {
      const c = toPoint(a.circle);
      const km = Math.max(1, Number(a.km) || 500);
      const pts = [];
      for (let b = 0; b < 360; b += 4) pts.push(destination(c, km, b));
      const ring = ringOfPoints(pts);
      area.rings = [[ring]];
      area.lines = [{ pts: ring.pts, closed: true }];
      area.anchor = c;
    } else if (Array.isArray(a.band) && a.band.length === 2) box = [-180, Math.min(a.band[0], a.band[1]), 180, Math.max(a.band[0], a.band[1])];
    else if (Array.isArray(a.lons) && a.lons.length === 2) box = [a.lons[0], -90, a.lons[1] <= a.lons[0] ? a.lons[1] + 360 : a.lons[1], 90];
    else if (Array.isArray(a.box) && a.box.length === 4) box = [a.box[0], a.box[1], a.box[2] <= a.box[0] ? a.box[2] + 360 : a.box[2], a.box[3]];
    else continue;
    if (box) {
      const [w, so, e, no] = [box[0], clamp(box[1], -90, 90), box[2], clamp(box[3], -90, 90)];
      const ring = ringOfPoints([[w, so], [e, so], [e, no], [w, no]], plain);
      area.rings = [[ring]];
      const edge = (p, q) => ({ pts: densify(plain([p, q]), 2), closed: false });
      if (so > -90) area.lines.push(edge([w, so], [e, so]));
      if (no < 90) area.lines.push(edge([w, no], [e, no]));
      if (e - w < 359.9) area.lines.push(edge([w, so], [w, no]), edge([e, so], [e, no]));
      area.anchor = [(w + e) / 2, (so + no) / 2];
    }
    area.fill = s('path.wm-area', { style: `--c:${hue(area.color)}` });
    area.stroke = s('path', { class: cx('wm-area-line', area.dashed && 'is-dashed'), style: `--c:${hue(area.color)}` });
    gAreas.append(area.fill, area.stroke);
    areas.push(area);
  }

  // lines
  const still = reducedMotion();
  const lines = [];
  let drawDelay = 0.3;
  for (const l of Array.isArray(spec.lines) ? spec.lines : []) {
    const pts = (Array.isArray(l.points) ? l.points : []).map(geoPoint).filter(Boolean);
    if (pts.length < 2) continue;
    const curve = ['straight', 'rhumb'].includes(l.curve) ? l.curve : 'great-circle';
    let path = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      let seg;
      if (curve === 'great-circle') seg = greatCircle(pts[i], pts[i + 1], 2);
      else if (curve === 'rhumb') {
        // constant compass bearing: a straight line on a Mercator map
        const my = (lat) => Math.log(Math.tan(Math.PI / 4 + (clamp(lat, -85, 85) * RAD) / 2));
        const dl = wrap180(pts[i + 1][0] - pts[i][0]);
        const n = Math.max(1, Math.ceil(Math.max(Math.abs(dl), Math.abs(pts[i + 1][1] - pts[i][1])) / 2));
        seg = [];
        for (let q = 0; q <= n; q++) {
          const y = my(pts[i][1]) + ((my(pts[i + 1][1]) - my(pts[i][1])) * q) / n;
          seg.push([pts[i][0] + (dl * q) / n, (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * DEG]);
        }
      } else seg = [pts[i], pts[i + 1]];
      path = path.concat(i ? seg.slice(1) : seg);
    }
    const anim = isStatic || still ? '' : l.animate === 'flow' ? 'flow' : l.animate ? 'draw' : '';
    const width = clamp(Number(l.width) || 2.5, 1, 8);
    const line = {
      pts: continuous(path), stops: pts, color: colour(l.color, 'red'), width, dashed: !!l.dashed || anim === 'flow', anim,
      arrow: l.arrow === 'both' ? 'both' : l.arrow ? 'end' : '', label: l.label ? String(l.label) : '', curve,
      onMap: l.labelOn !== 'legend', inLegend: l.labelOn !== 'map',
      labelAt: typeof l.labelAt === 'number' ? clamp(l.labelAt, 0, 1) : geoPoint(l.labelAt),
    };
    line.halo = s('path', { class: cx('wm-line-halo', anim === 'draw' && 'is-draw') });
    line.el = s('path', { class: cx('wm-line', anim === 'draw' && 'is-draw', anim === 'flow' && 'is-flow'), style: `--c:${hue(line.color)}` });
    if (anim === 'draw') {
      const dur = clamp(0.5 + path.length / 60, 0.8, 3);
      for (const el of [line.el, line.halo]) {
        el.setAttribute('pathLength', '1');
        el.style.setProperty('--dur', `${dur}s`);
        el.style.setProperty('--delay', `${round(drawDelay)}s`);
      }
      line.delay = drawDelay + dur;
      drawDelay += dur + 0.15;
    }
    line.heads = [];
    for (const which of line.arrow === 'both' ? ['end', 'start'] : line.arrow ? ['end'] : []) {
      const head = s('path', { class: cx('wm-arrow', anim === 'draw' && 'is-draw'), fill: hue(line.color), 'data-end': which });
      if (anim === 'draw') head.style.setProperty('--delay', `${round(line.delay - 0.1)}s`);
      line.heads.push(head);
    }
    gLines.append(line.halo, line.el, ...line.heads);
    lines.push(line);
  }

  // rivers
  const riverWanted = spec.rivers === true ? true : Array.isArray(spec.rivers) || typeof spec.rivers === 'string' ? [].concat(spec.rivers).map(fold) : null;
  let riverEls = [];

  // place mode
  const targets = [];
  if (mode === 'place') {
    if (spec.target != null && toPoint(spec.target)) targets.push({ id: 'target', at: toPoint(spec.target), label: spec.targetLabel ? String(spec.targetLabel) : (typeof spec.target === 'string' ? spec.target : '') });
    for (const t of Array.isArray(spec.targets) ? spec.targets : []) {
      const at = toPoint(t.at != null ? t.at : t);
      if (at) targets.push({ id: String(t.id != null ? t.id : `t${targets.length + 1}`), at, label: t.label ? String(t.label) : '' });
    }
  }
  const pinSpec = spec.pin && typeof spec.pin === 'object' ? spec.pin : {};
  /** coordinates: false keeps the pin's longitude and latitude to itself until the step is over. */
  const tellCoords = () => spec.coordinates !== false || revealed();
  const pinSaid = () => (tellCoords() ? `Pin at ${degrees(pin[0], pin[1])}.` : 'Pin moved.');

  /* ----------------------------------------------------------------- state */
  let picked = [];                    // country ids or marker ids, in the order they were chosen
  let route = [];
  let pin = toPoint(pinSpec.start) || geoAt(W / 2, H / 2) || [lon0, lat0];
  let placed = false;
  let shown = null;                   // the country whose name is on show (view mode)
  let hover = null;

  /* ------------------------------------------------------------ base map */
  const paths = new Map();            // id -> { el, d }
  const sizes = new Map();            // id -> size on the unzoomed drawing, in SVG units (0: not in sight)
  const anchors = new Map();          // id -> [lon, lat]: where its name, ring and keyboard stop go (absent: not in the window)
  const inWindow = (lon, lat, margin) => { const p = P.project(lon, lat); return !!p && p[0] >= margin && p[0] <= W - margin && p[1] >= margin && p[1] <= H - margin; };
  function findAnchor(id) {
    const c = info[id];
    if (inWindow(c[4], c[5], 3)) return [c[4], c[5]];
    const alt = LABEL_ALT[id];
    if (alt && inWindow(alt[0], alt[1], 3)) return alt;
    if (globe) return [c[4], c[5]];                 // on the far side for the moment
    const b = c[6];
    const polys = b && layer.shapes[id] ? geometryOf(layer, id) : null;
    if (!polys) return null;
    // The usual spot is outside the window. Is some other part of the country inside it?
    let best = null;
    let bestD = Infinity;
    for (let i = 1; i <= 7; i++) for (let j = 1; j <= 7; j++) {
      const lon = b[0] + ((b[2] - b[0]) * i) / 8;
      const lat = b[1] + ((b[3] - b[1]) * j) / 8;
      if (!inWindow(lon, lat, 14)) continue;
      const d = (lon - c[4]) ** 2 + (lat - c[5]) ** 2;
      if (d < bestD && polys.some((rings) => inPolygon(rings, wrap180(lon), lat))) { best = [lon, lat]; bestD = d; }
    }
    return best;
  }
  const farPaths = new Map();         // id -> { el, d }: the overseas parts of a country shown with mainBodyOnly
  function farPath(id) {
    let p = farPaths.get(id);
    if (!p) {
      p = { el: s('path.wm-c'), d: '' };
      farPaths.set(id, p);
      gLand.appendChild(p.el);
    }
    return p;
  }
  function countryPath(id) {
    let p = paths.get(id);
    if (!p) {
      p = { el: s('path.wm-c', { 'data-id': id === '_' ? null : id }), d: '' };
      paths.set(id, p);
      gLand.appendChild(p.el);
    }
    return p;
  }
  const antipode = () => (P.azimuthal ? [wrap180(P.lon0 + 180), -P.lat0] : null);
  /** Can anything inside this lon/lat box be in the window? (Only worth asking on regional azimuthal maps.) */
  const cull = isRound && !wholeDisc && seen < 100;
  function outOfSight(box) {
    if (!cull) return false;
    const midLat = (box[1] + box[3]) / 2;
    const reach = 0.5 * Math.hypot((box[2] - box[0]) * Math.cos(Math.min(Math.abs(box[1]), Math.abs(box[3])) * RAD), box[3] - box[1]) + 1;
    return distanceKm([P.lon0, P.lat0], [(box[0] + box[2]) / 2, midLat]) / EARTH_KM * DEG > seen + reach;
  }
  function arcBoxes() {
    if (!layer.arcBoxes) {
      layer.arcBoxes = layer.arcs.map((arc) => {
        let w = Infinity; let e = -Infinity; let so = Infinity; let no = -Infinity;
        for (let i = 0; i < arc.length; i += 2) { if (arc[i] < w) w = arc[i]; if (arc[i] > e) e = arc[i]; if (arc[i + 1] < so) so = arc[i + 1]; if (arc[i + 1] > no) no = arc[i + 1]; }
        return [w, so, e, no];
      });
    }
    return layer.arcBoxes;
  }
  /*
   * Most arcs lie wholly inside the map, and most are needed three times (two countries and the border between
   * them). Those are projected and written out once: arcText(i) is "x y L x y …" for arc i, or null for an arc
   * that touches the edge of the map (the date line, the far side of a globe) and has to go the long way.
   */
  let arcTexts = [];
  let arcTextsBack = [];
  function arcText(i, back = false) {
    let text = arcTexts[i];
    if (text === undefined) {
      const arc = layer.arcs[i];
      const n = arc.length / 2;
      const parts = new Array(n);
      const M = baseMap();
      const shift = P.azimuthal ? 0 : 360 * Math.round((P.lon0 - arc[0]) / 360) - P.lon0;
      let ok = true;
      for (let k = 0; k < n && ok; k++) {
        if (P.azimuthal) { P.raw(arc[2 * k], arc[2 * k + 1]); ok = P.V; }
        else { const u = arc[2 * k] + shift; ok = u > -179.999 && u < 179.999; if (ok) P.raw(u, arc[2 * k + 1]); }
        if (ok) parts[k] = `${f1(M.x + M.k * P.X)} ${f1(M.y - M.k * P.Y)}`;
      }
      text = ok ? parts.join('L') : null;
      arcTexts[i] = text;
      arcTextsBack[i] = ok ? parts : null;
    }
    if (!back || text === null) return text;
    if (typeof arcTextsBack[i] !== 'string') arcTextsBack[i] = arcTextsBack[i].reverse().join('L');
    return arcTextsBack[i];
  }
  function quickRing(ring) {
    const refs = ring.refs;
    if (!refs) return '';
    let d = '';
    for (let q = 0; q < refs.length; q++) {
      const text = refs[q] < 0 ? arcText(~refs[q], true) : arcText(refs[q]);
      if (text === null) return '';
      d += (q ? 'L' : 'M') + text;
    }
    return `${d}Z`;
  }
  function strokeOf([from, to]) {
    const M = baseMap();
    const boxes = cull ? arcBoxes() : null;
    let d = '';
    for (let i = from; i < to; i++) {
      if (boxes && outOfSight(boxes[i])) continue;
      const text = arcText(i);
      d += text === null ? linePath(P, M, layer.arcs[i]) : `M${text}`;
    }
    return d;
  }

  function rebuild(andLayOut = true) {
    const M = baseMap();
    const anti = antipode();
    arcTexts = [];
    arcTextsBack = [];
    // the sea: the outline of the world on a flat map, the disc of a globe, or simply everything
    let seaD;
    if (isRound) seaD = wholeDisc ? circlePath(M, P.rClip) : `M${-W} ${-H}H${2 * W}V${2 * H}H${-W}Z`;
    else {
      const edge = [];
      for (let lat = -90; lat <= 90; lat += 3) edge.push([-180, lat]);
      for (let lat = 90; lat >= -90; lat -= 3) edge.push([180, lat]);
      seaD = edge.map(([u, lat], i) => { P.raw(u, lat); return `${i ? 'L' : 'M'}${f1(M.x + M.k * P.X)} ${f1(M.y - M.k * P.Y)}`; }).join('') + 'Z';
    }
    ocean.setAttribute('d', seaD);
    rimEl.setAttribute('d', wholeDisc || (!isRound && view.kind === 'world') ? seaD : '');

    if (spec.graticule) {
      const step = Number(spec.graticule) > 0 ? clamp(Number(spec.graticule), 1, 90) : regional ? 10 : 30;
      let d = '';
      for (let lon = -180; lon < 180; lon += step) { const pts = []; for (let lat = -90 + Math.min(step, 10); lat <= 90 - Math.min(step, 10); lat += 2) pts.push([lon, lat]); d += linePath(P, M, continuous(pts)); }
      for (let lat = -90 + step; lat < 90; lat += step) { const pts = []; for (let lon = -180; lon <= 180; lon += 2) pts.push([lon, lat]); d += linePath(P, M, continuous(pts)); }
      grat.setAttribute('d', d);
    }

    for (const p of paths.values()) p.d = '';
    for (const p of farPaths.values()) p.d = '';
    sizes.clear();
    for (const id of Object.keys(layer.shapes)) {
      const polys = geometryOf(layer, id);
      const inSight = cull ? polys.filter((rings) => !outOfSight(rings[0].box)) : polys;
      if (id !== '_' && mainOnly(id) && polys.length > 1) {
        const main = mainBodyOf(layer, id);
        const near = inSight.filter((rings) => main.has(polys.indexOf(rings)));
        const far = inSight.filter((rings) => !main.has(polys.indexOf(rings)));
        countryPath(id).d = near.length ? fillPath(P, M, near, anti, quickRing) : '';
        if (far.length || farPaths.has(id)) farPath(id).d = far.length ? fillPath(P, M, far, anti, quickRing) : '';
        continue;
      }
      countryPath(id).d = inSight.length ? fillPath(P, M, inSight, anti, quickRing) : '';
    }
    for (const p of paths.values()) { if (p.d) p.el.setAttribute('d', p.d); else p.el.removeAttribute('d'); }
    for (const p of farPaths.values()) { if (p.d) p.el.setAttribute('d', p.d); else p.el.removeAttribute('d'); }

    if (spec.lakes !== false) {
      if (!layer.lakeGeom) layer.lakeGeom = layer.lakes.map((rings) => rings.map((ref) => assemble(layer, [ref])));
      const inSight = cull ? layer.lakeGeom.filter((rings) => !outOfSight(rings[0].box)) : layer.lakeGeom;
      lakesEl.setAttribute('d', fillPath(P, M, inSight, anti, quickRing));
    }
    borderEl.setAttribute('d', spec.borders === false ? '' : strokeOf(layer.ranges.border));
    dashedEl.setAttribute('d', spec.borders === false ? '' : strokeOf(layer.ranges.dashed));
    coastEl.setAttribute('d', strokeOf(layer.ranges.coast));

    for (const area of areas) {
      area.fill.setAttribute('d', fillPath(P, M, area.rings, anti));
      area.stroke.setAttribute('d', area.outline ? area.lines.map((l) => linePath(P, M, l.pts, l.closed)).join('') : '');
    }
    for (const l of graticuleLines) l.el.setAttribute('d', linePath(P, M, l.pts));
    drawRivers();

    // where each country is on the drawing, and how big (decides which get a ring, a name, a larger tap area)
    anchors.clear();
    for (const id of Object.keys(info)) {
      const at = findAnchor(id);
      if (!at) { sizes.set(id, 0); continue; }
      anchors.set(id, at);
      const b = info[id][6];
      let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
      for (const [lon, lat] of b ? [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]], [(b[0] + b[2]) / 2, b[1]], [(b[0] + b[2]) / 2, b[3]]] : []) {
        const q = P.project(lon, lat);
        if (!q) continue;
        if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
      }
      sizes.set(id, x1 >= x0 ? Math.max(0.01, Math.min(600, Math.max(x1 - x0, y1 - y0))) : 0.01);
    }
    if (!andLayOut) return;
    paint();
    syncOutlines();
    layout();
  }

  function drawRivers() {
    for (const el of riverEls) el.remove();
    riverEls = [];
    if (!riverWanted || !riverData) return;
    const M = baseMap();
    const maxRank = regional ? 6 : 3;
    let plain = '';
    for (const river of riverData) {
      const named = riverWanted !== true && riverWanted.includes(fold(river.name));
      if (riverWanted !== true && !named) continue;
      if (riverWanted === true && river.rank > maxRank) continue;
      let d = '';
      for (const pts of river.lines) d += linePath(P, M, pts);
      if (named) { const el = s('path.wm-river.is-named', { d }); gRivers.appendChild(el); riverEls.push(el); } else plain += d;
    }
    if (plain) { const el = s('path.wm-river', { d: plain }); gRivers.appendChild(el); riverEls.push(el); }
  }

  /** Fill colours: groups, the dimmed rest, and what has been picked. */
  const fillOf = (id) => {
    if (countryMode && picked.includes(id)) return hue(pickHue);
    const g = regionOf.get(id);
    if (g) return hue(g.color, g.tone);
    return dim || (pickSet && !pickSet.has(id)) ? 'var(--wm-dim)' : null;
  };
  function paint() {
    for (const [id, p] of paths) {
      const f = id === '_' ? (dim || pickSet ? 'var(--wm-dim)' : null) : fillOf(id);
      if (f) p.el.style.setProperty('--f', f); else p.el.style.removeProperty('--f');
    }
    // overseas parts set apart by mainBodyOnly: plain land, like any country that is in no group
    for (const [id, p] of farPaths) {
      if (dim || (pickSet && !pickSet.has(id)) || spec.mainBodyOnly) p.el.style.setProperty('--f', dim || pickSet ? 'var(--wm-dim)' : 'var(--wm-land)'); else p.el.style.removeProperty('--f');
    }
  }

  // outlines on top of the borders: the country under the pointer, the picked ones, the answer
  const outlines = new Map();         // key -> path
  function outline(key, cls, id) {
    let el = outlines.get(key);
    if (!id || !paths.get(id) || !paths.get(id).d) { if (el) { el.remove(); outlines.delete(key); } return; }
    if (el && el.getAttribute('class') !== cls) el.setAttribute('class', cls);
    if (!el) { el = s('path', { class: cls }); outlines.set(key, el); if (cls === 'wm-hover') gHi.insertBefore(el, gHi.firstChild); else gHi.appendChild(el); }
    el.setAttribute('d', paths.get(id).d);
  }
  function syncOutlines() {
    const keep = new Set();
    const rev = revealed();
    if (countryMode) for (const id of picked) { outline(`p:${id}`, 'wm-picked', id); keep.add(`p:${id}`); }
    if (countryMode && rev) for (const id of answerIds) { outline(`a:${id}`, picked.includes(id) ? 'wm-answer is-picked' : 'wm-answer', id); keep.add(`a:${id}`); }
    const hot = hover || (mode === 'view' ? shown : null) || (keysFocused && cursor >= 0 && cands[cursor] && cands[cursor].kind === 'country' ? cands[cursor].id : null);
    if (hot) { outline('hover', 'wm-hover', hot); keep.add('hover'); }
    for (const key of Array.from(outlines.keys())) if (!keep.has(key)) { outlines.get(key).remove(); outlines.delete(key); }
  }

  /* --------------------------------------------------------------- overlay */
  const dots = new Map();             // id -> circle
  const texts = [];                   // pool of <text> elements for country and free labels
  const markEls = markers.map((m) => {
    const g = s('g');
    const shape = m.shape === 'dot' || m.shape === 'ring' ? s('circle', { r: 1 }) : s('path', { d: SHAPES[m.shape] });
    shape.setAttribute('class', cx('wm-mark', m.shape === 'ring' && 'is-ring'));
    if (m.shape === 'ring') shape.style.setProperty('--c', hue(m.color)); else shape.setAttribute('fill', hue(m.color));
    const ring = s('circle.wm-mark-ring', { r: 1, visibility: 'hidden' });
    const ans = s('circle.wm-mark-answer', { r: 1, visibility: 'hidden' });
    const badge = s('g', { visibility: 'hidden' }, s('circle.wm-badge', { r: 1 }), s('text.fig-label-sm.wm-t-badge', { 'text-anchor': 'middle', 'dominant-baseline': 'central' }));
    const label = s('text.fig-label-sm.wm-t-b');
    g.append(ans, ring, shape, badge, label);
    gMarks.appendChild(g);
    return { g, shape, ring, ans, badge, label };
  });
  const lineLabels = lines.map((l) => { if (!l.label || !l.onMap) return null; const t = s('text.fig-label-sm.wm-t-b', { 'text-anchor': 'middle', style: `fill:${hue(l.color, 'text')}` }, l.label); gText.appendChild(t); return t; });
  const areaLabels = areas.map((a) => { if (!a.label || !a.onMap) return null; const t = s('text.fig-label-sm.wm-t-b', { 'text-anchor': 'middle', style: `fill:${hue(a.color, 'text')}` }, a.label); gText.appendChild(t); return t; });
  const parLabels = graticuleLines.map((l) => { if (!l.label) return null; const t = s('text.fig-label-sm.wm-t', { style: l.color ? `fill:${hue(l.color, 'text')}` : null }, l.label); gText.appendChild(t); return t; });
  const riverLabels = [];
  const routeEl = s('path.wm-line', { style: `--c:${hue(pickHue)}` });
  const routeHalo = s('path.wm-line-halo');
  const routeIn = s('path.wm-line', { style: 'stroke:var(--ink)' });
  const answerRouteEl = s('path.wm-line', { style: 'stroke:var(--green-text)' });
  if (mode === 'trace') gLines.append(answerRouteEl, routeHalo, routeIn, routeEl);

  // the pin of place mode
  let pinHandle = null;
  let pinArt = null;
  const gapEl = s('path.wm-gap');
  const gapText = s('text.fig-label-sm.wm-t-b', { 'text-anchor': 'middle' });
  const targetEls = targets.map((t) => {
    const g = s('g', { visibility: 'hidden' }, s('circle.wm-target', { r: 1 }), s('circle', { r: 0.3, fill: 'var(--green-text)' }), s('text.fig-label-sm.wm-t-b', { style: 'fill:var(--green-text)' }, t.label));
    gTop.appendChild(g);
    return g;
  });
  if (mode === 'place') {
    gTop.append(gapEl, gapText);
    const start = screenOf(pin[0], pin[1]) || [W / 2, H / 2];
    pinHandle = handle(svg, {
      x: start[0], y: start[1], color: colour(pinSpec.color, 'red'), keyStep: 3, label: `${pinSpec.label ? `Pin for ${pinSpec.label}` : 'Pin'}. Arrow keys move it`,
      onMove(x, y) {
        if (readOnly) return;
        const g = geoAt(clamp(x, 0, W), clamp(y, 0, H));
        if (!g) return;
        pin = [round(g[0], 2), round(g[1], 2)];
        placed = true;
        placePin();
      },
      onEnd() {
        if (readOnly || !placed) return;
        play('drop');
        status();
        env.announce(pinSaid());
        env.onChange(getState());
      },
    });
    pinHandle.el.classList.add('wm-pin');
    pinArt = s('g', {},
      s('circle', { r: 20, cy: -9, fill: 'transparent' }),
      s('path.wm-pin-body', { d: 'M0 0C-9 -11 -8.5 -22 0 -22C8.5 -22 9 -11 0 0Z', fill: hue(colour(pinSpec.color, 'red')), 'stroke-width': 1.8 }),
      s('circle.wm-pin-hole', { cy: -14, r: 3.2 }),
      pinSpec.label ? s('text.fig-label-sm.wm-t-b', { y: -27, 'text-anchor': 'middle' }, String(pinSpec.label)) : null);
    pinHandle.el.appendChild(pinArt);
    gOver.appendChild(pinHandle.el);
  }
  function placePin() {
    if (!pinHandle) return;
    const p = screenOf(pin[0], pin[1]);
    pinHandle.el.setAttribute('visibility', p ? 'visible' : 'hidden');
    if (p) pinHandle.set(p[0], p[1]);
    pinHandle.setLabel(!placed ? 'not placed yet' : tellCoords() ? degrees(pin[0], pin[1]) : null);
    pinHandle.el.classList.toggle('is-loose', !placed);
    pinArt.setAttribute('transform', `scale(${round(unit, 3)})`);
    // the label of the text inside the pin is in drawing units already (the group is scaled), so undo the font scaling
    const t = pinArt.querySelector('text');
    if (t) { t.style.fontSize = '11.5px'; t.style.strokeWidth = '3px'; t.setAttribute('visibility', revealed() && targets.length ? 'hidden' : 'visible'); }
  }

  /** Candidates for the keyboard, hit testing and the list a screen reader sees. */
  let cands = [];
  let cursor = -1;
  let keysFocused = false;
  const interactiveList = !isStatic && (countryMode || markerMode || names);
  function buildCandidates() {
    const old = cursor >= 0 && cands[cursor] ? cands[cursor].key : null;
    cands = [];
    if (!interactiveList) return;
    if (markerMode) {
      for (const m of pickableMarkers) cands.push({ key: `m:${m.id}`, kind: 'marker', id: m.id, at: m.at, marker: m });
    } else {
      for (const id of Object.keys(info)) {
        if (pickSet && !pickSet.has(id)) continue;
        if (!layer.shapes[id] && !dotWanted(id)) continue;
        if (!anchors.has(id)) continue;
        cands.push({ key: `c:${id}`, kind: 'country', id, at: anchors.get(id) });
      }
    }
    const byName = showNames() && !markerMode;
    cands.sort((a, b) => (byName ? countryName(a.id).localeCompare(countryName(b.id), 'en') : (b.at[1] - a.at[1]) || (a.at[0] - b.at[0])));
    gKeys.replaceChildren();
    cands.forEach((c, i) => {
      c.el = s('g', { role: 'option', id: `${uid}-o${i}`, 'aria-selected': 'false' }, s('circle', { r: 1, fill: 'none' }));
      gKeys.appendChild(c.el);
    });
    cursor = old ? cands.findIndex((c) => c.key === old) : -1;
    labelCandidates();
  }
  function candLabel(c) {
    if (c.kind === 'marker') {
      const m = c.marker;
      const where = route.indexOf(m.id);
      const shownLabel = m.label && (!hideMarkerLabels || revealed());
      return `${shownLabel ? m.label : `Marker ${m.letter}`}${mode === 'trace' && where >= 0 ? `, stop ${where + 1}` : ''}`;
    }
    return showNames() ? countryName(c.id) : `Country near ${degrees(c.at[0], c.at[1])}`;
  }
  function labelCandidates() {
    cands.forEach((c) => {
      const on = c.kind === 'marker' ? (mode === 'trace' ? route.includes(c.id) : picked.includes(c.id)) : (countryMode ? picked.includes(c.id) : shown === c.id);
      c.el.setAttribute('aria-label', candLabel(c));
      c.el.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (cursor >= 0 && cands[cursor]) gKeys.setAttribute('aria-activedescendant', cands[cursor].el.id); else gKeys.removeAttribute('aria-activedescendant');
  }
  const labelPoint = (id) => anchors.get(id) || [info[id][4], info[id][5]];

  /** Is this country too small on screen to tap or see? (size in CSS pixels at the current zoom) */
  const pxSize = (id) => ((sizes.get(id) || 0) * zoom) / unit;
  const isSmall = (id) => !layer.shapes[id] || pxSize(id) < 13;
  /** Does it need a ring to be seen at all (or, when it can be chosen, to be hit)? */
  const needsDot = (id) => !layer.shapes[id] || pxSize(id) < (countryMode ? 9 : 4.5);

  let edgeLabels = false;              // a marker label was moved in from the edge (worth a second look once sizes are known)
  const taken = [];                    // boxes already used by labels and markers: [x0, y0, x1, y1]
  const clash = (b) => taken.some((t) => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
  const textW = (text, size) => text.length * size * 0.56 + size * 0.5;
  /** How wide a label really is on screen, in SVG units (0 while the figure is not in the page yet). */
  const widths = new Map();
  function drawnWidth(el, text, size) {
    const key = `${text}|${Math.round(size * 10)}`;
    if (widths.has(key)) return widths.get(key);
    if (!el.isConnected || typeof el.getComputedTextLength !== 'function') return 0;
    if (el.textContent !== text) el.textContent = text;
    let width = 0;
    try { width = el.getComputedTextLength(); } catch { width = 0; }
    if (width > 0) widths.set(key, width);
    return width;
  }
  let textUsed = 0;
  function putText(text, x, y, cls, anchor = 'middle', fill = null) {
    let el = texts[textUsed];
    if (!el) { el = s('text'); texts.push(el); gText.appendChild(el); }
    textUsed++;
    el.setAttribute('class', `fig-label-sm ${cls}`);
    el.setAttribute('text-anchor', anchor);
    el.setAttribute('x', f1(x));
    el.setAttribute('y', f1(y));
    el.removeAttribute('visibility');
    if (fill) el.setAttribute('style', `fill:${fill}`); else el.removeAttribute('style');
    if (el.textContent !== text) el.textContent = text;
    return el;
  }

  /**
   * The longest stretch of a line that is inside the window, as points on screen a few pixels apart. A stretch
   * ends where the line leaves the window, goes round the back of a globe or crosses the edge of a flat map.
   */
  function visibleRun(l, near) {
    const n = l.pts.length / 2;
    const stepPx = 6 * unit;
    const runs = [];
    let run = [];
    let prev = null;
    let prevU = 0;
    let prevTurn = 0;
    const close = () => { if (run.length > 2) runs.push(run); run = []; };
    const add = (p) => { if (onCanvas(p, -4 * unit)) run.push(p); else close(); };
    for (let i = 0; i < n; i++) {
      const lon = l.pts[2 * i];
      const p = screenOf(lon, l.pts[2 * i + 1]);
      const u = i === 0 ? wrap180(lon - P.lon0) : prevU + wrap180(lon - l.pts[2 * i - 2]);
      const turn = Math.floor((u + 180) / 360);
      if (!p || !prev || (!P.azimuthal && turn !== prevTurn)) { close(); if (p) add(p); } else {
        const pieces = Math.max(1, Math.ceil(Math.hypot(p[0] - prev[0], p[1] - prev[1]) / stepPx));
        for (let q = 1; q <= pieces; q++) add([prev[0] + ((p[0] - prev[0]) * q) / pieces, prev[1] + ((p[1] - prev[1]) * q) / pieces]);
      }
      prev = p; prevU = u; prevTurn = turn;
    }
    close();
    let best = null;
    const target = near ? screenOf(near[0], near[1]) : null;
    if (target) {
      // the stretch that comes closest to the place asked for
      let nearest = Infinity;
      for (const r of runs) for (const q of r) { const d = Math.hypot(q[0] - target[0], q[1] - target[1]); if (d < nearest) { nearest = d; best = r; } }
      return best;
    }
    for (const r of runs) if (!best || r.length > best.length) best = r;
    return best;
  }

  function layout() {
    const M = overlayMap();
    const u = unit;
    taken.length = 0;
    textUsed = 0;
    const rev = revealed();

    // lines and their arrowheads
    lines.forEach((l, i) => {
      const d = linePath(P, M, l.pts);
      l.halo.setAttribute('d', d);
      l.halo.setAttribute('stroke-width', f1((l.width + 2.4) * u));
      l.el.setAttribute('d', d);
      l.el.setAttribute('stroke-width', f1(l.width * u));
      if (l.anim !== 'draw') { if (l.dashed) l.el.setAttribute('stroke-dasharray', `${f1(l.width * 2.4 * u)} ${f1(l.width * 2.2 * u)}`); else l.el.removeAttribute('stroke-dasharray'); }
      for (const head of l.heads) {
        const n = l.pts.length / 2;
        const end = head.dataset.end === 'end';
        const a = screenOf(l.pts[end ? 2 * n - 2 : 0], l.pts[end ? 2 * n - 1 : 1]);
        let b = null;
        for (let q = 1; q < n && !b; q++) {
          const k = end ? n - 1 - q : q;
          const c = screenOf(l.pts[2 * k], l.pts[2 * k + 1]);
          if (c && a && Math.hypot(c[0] - a[0], c[1] - a[1]) > 2 * u) b = c;
          if (!c) break;
        }
        if (!a || !b) { head.setAttribute('d', ''); continue; }
        const ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
        const len = (l.width * 2.4 + 5) * u;
        const wid = len * 0.48;
        const cos = Math.cos(ang); const sin = Math.sin(ang);
        const tip = [a[0] + cos * len * 0.35, a[1] + sin * len * 0.35];
        const bx = tip[0] - cos * len; const by = tip[1] - sin * len;
        head.setAttribute('d', `M${f1(tip[0])} ${f1(tip[1])}L${f1(bx - sin * wid)} ${f1(by + cos * wid)}L${f1(bx + sin * wid)} ${f1(by - cos * wid)}Z`);
      }
    });

    // the route of trace mode
    if (mode === 'trace') {
      const build = (ids) => {
        let d = '';
        for (let i = 0; i + 1 < ids.length; i++) d += linePath(P, M, continuous(greatCircle(markerById.get(ids[i]).at, markerById.get(ids[i + 1]).at, 2)));
        return d;
      };
      const d = build(route);
      routeHalo.setAttribute('d', d); routeHalo.setAttribute('stroke-width', f1(7.5 * u));
      routeIn.setAttribute('d', d); routeIn.setAttribute('stroke-width', f1(5.6 * u));
      routeEl.setAttribute('d', d); routeEl.setAttribute('stroke-width', f1(3.2 * u));
      answerRouteEl.setAttribute('d', rev && answerRoute.length > 1 ? build(answerRoute) : '');
      answerRouteEl.setAttribute('stroke-width', f1(2.6 * u));
      answerRouteEl.setAttribute('stroke-dasharray', `${f1(6 * u)} ${f1(5 * u)}`);
    }

    // markers
    markers.forEach((m, i) => {
      const el = markEls[i];
      const p = screenOf(m.at[0], m.at[1]);
      if (!onCanvas(p, 12 * u)) { el.g.setAttribute('visibility', 'hidden'); m.screen = null; return; }
      m.screen = p;
      el.g.removeAttribute('visibility');
      el.g.setAttribute('transform', `translate(${f1(p[0])} ${f1(p[1])})`);
      const isPicked = mode === 'trace' ? route.includes(m.id) : markerMode && picked.includes(m.id);
      const pickable = pickableMarkers.includes(m);
      const r = (pickable ? Math.max(m.r, 6.4) : m.r) * u;
      if (el.shape.tagName === 'circle') el.shape.setAttribute('r', f1(r)); else el.shape.setAttribute('transform', `scale(${round(r, 2)})`);
      el.shape.setAttribute('stroke-width', el.shape.tagName === 'circle' ? f1((m.shape === 'ring' ? 2.4 : 1.6) * u) : round((1.6 * u) / r, 3));
      if (pickable && m.shape !== 'ring') el.shape.setAttribute('fill', isPicked ? hue(pickHue) : hue(m.color));
      el.ring.setAttribute('visibility', isPicked ? 'visible' : 'hidden');
      el.ring.setAttribute('r', f1(r + 3.6 * u)); el.ring.setAttribute('stroke-width', f1(2.4 * u));
      const isAnswer = rev && (answerMarkers.includes(m.id));
      el.ans.setAttribute('visibility', isAnswer ? 'visible' : 'hidden');
      el.ans.setAttribute('r', f1(r + 7.5 * u)); el.ans.setAttribute('stroke-width', f1(2.6 * u)); el.ans.setAttribute('stroke-dasharray', `${f1(4 * u)} ${f1(3 * u)}`);
      // a letter (markers whose names are hidden) or the stop number (trace)
      const stop = mode === 'trace' ? route.indexOf(m.id) : -1;
      const tag = stop >= 0 ? String(stop + 1) : pickable && hideMarkerLabels && !rev ? m.letter : '';
      el.badge.setAttribute('visibility', tag ? 'visible' : 'hidden');
      if (tag) {
        const br = 7.4 * u;
        const inside = stop < 0;                        // letters sit on the marker itself, stop numbers beside it
        el.badge.setAttribute('transform', inside ? '' : `translate(${f1(-r - br * 0.45)} ${f1(-r - br * 0.45)})`);
        el.badge.firstChild.setAttribute('r', f1(inside ? Math.max(r, br) : br));
        el.badge.lastChild.textContent = tag;
      }
      taken.push([p[0] - r - 2 * u, p[1] - r - 2 * u, p[0] + r + 2 * u, p[1] + r + 2 * u]);
    });
    if (canZoom) taken.push([0, H - 50 * u, (globe ? 172 : 92) * u, H]);      // the zoom buttons
    markers.forEach((m, i) => {
      const el = markEls[i];
      const text = m.label && (!hideMarkerLabels || rev || !pickableMarkers.includes(m)) ? m.label : '';
      if (!m.screen || !text) { el.label.textContent = ''; return; }
      const size = 12.5 * u;
      const w = textW(text, size);
      const r = (pickableMarkers.includes(m) ? Math.max(m.r, 6.4) : m.r) * u + (m.shape === 'pin' ? 0 : 0);
      const gap = r + (pickableMarkers.includes(m) ? 7 : 4.5) * u;
      const up = m.shape === 'pin' ? r * 3.4 : 0;
      const spots = {
        right: [gap, size * 0.35 - up * 0.5, 'start'], left: [-gap, size * 0.35 - up * 0.5, 'end'],
        top: [0, -gap - up - 1.5 * u, 'middle'], bottom: [0, gap + size * 0.8, 'middle'],
      };
      const order = spots[m.labelPos] ? [m.labelPos] : ['right', 'left', 'top', 'bottom'];
      let trueW = null;                  // the width of the text as drawn; asked for only when the estimate says "cut off"
      const at = (key) => {
        const [dx, dy, anchor] = spots[key];
        const x0 = m.screen[0] + dx - (anchor === 'middle' ? w / 2 : anchor === 'end' ? w : 0);
        const box = [x0, m.screen[1] + dy - size * 0.9, x0 + w, m.screen[1] + dy + size * 0.25];
        const whole = box[0] >= 1 && box[2] <= W - 1 && box[1] >= 1 && box[3] <= H - 1;
        // `whole` goes by the (generous) estimate of the width. Before a label is moved for being cut off, `cut`
        // makes sure that it really is.
        const cut = () => {
          if (whole) return false;
          if (trueW === null) trueW = drawnWidth(el.label, text, size) || w;
          const left = m.screen[0] + dx - (anchor === 'middle' ? trueW / 2 : anchor === 'end' ? trueW : 0);
          const base = m.screen[1] + dy;
          return !(left >= 0.5 && left + trueW <= W - 0.5 && base - size * 0.76 >= 0 && base + size * 0.22 <= H);
        };
        return { dx, dy, anchor, box, whole, cut };
      };
      let best = null;
      for (const key of order) {
        const spot = at(key);
        const fits = spot.whole && !clash(spot.box);
        if (!best || fits) best = spot;
        if (fits) break;
      }
      if (!best.whole) edgeLabels = true;
      if (best.cut()) {
        // The label would be cut off by the edge of the map: try the opposite side, then the other two, and if
        // it fits nowhere push it back inside.
        const across = { right: 'left', left: 'right', top: 'bottom', bottom: 'top' }[order[0]];
        let other = null;
        for (const key of [across, 'right', 'left', 'top', 'bottom']) {
          if (key === order[0]) continue;
          const spot = at(key);
          if (spot.cut()) continue;
          const free = !clash(spot.box);
          if (!other || free) other = spot;
          if (free) break;
        }
        if (other) best = other;
        else {
          const mx = best.box[0] < 2 ? 2 - best.box[0] : best.box[2] > W - 2 ? W - 2 - best.box[2] : 0;
          const my = best.box[1] < 2 ? 2 - best.box[1] : best.box[3] > H - 2 ? H - 2 - best.box[3] : 0;
          best = { dx: best.dx + mx, dy: best.dy + my, anchor: best.anchor, box: [best.box[0] + mx, best.box[1] + my, best.box[2] + mx, best.box[3] + my] };
        }
      }
      el.label.textContent = text;
      el.label.setAttribute('x', f1(best.dx)); el.label.setAttribute('y', f1(best.dy)); el.label.setAttribute('text-anchor', best.anchor);
      taken.push(best.box);
    });

    // rings for countries too small to see
    const live = new Set();
    for (const id of Object.keys(info)) {
      if (!anchors.has(id) || !dotWanted(id) || !needsDot(id)) continue;
      const at = anchors.get(id);
      const p = screenOf(at[0], at[1]);
      if (!onCanvas(p, 0)) continue;
      let el = dots.get(id);
      if (!el) { el = s('circle.wm-dot', { 'data-id': id }); dots.set(id, el); gDots.appendChild(el); }
      live.add(id);
      const on = countryMode && picked.includes(id);
      const isAnswer = rev && answerIds.includes(id);
      const r = (on || isAnswer ? 5.2 : countryMode ? 4.2 : 2.7) * u;
      el.setAttribute('cx', f1(p[0])); el.setAttribute('cy', f1(p[1])); el.setAttribute('r', f1(r));
      el.setAttribute('stroke-width', f1((on ? 2.4 : 1.1) * u));
      el.setAttribute('class', cx('wm-dot', on && 'is-picked'));
      const f = isAnswer && !on ? 'var(--green)' : fillOf(id);
      if (f) el.style.setProperty('--f', f); else el.style.removeProperty('--f');
      if (isAnswer) { el.style.stroke = 'var(--green-text)'; el.setAttribute('stroke-width', f1(2.6 * u)); } else el.style.stroke = '';
    }
    for (const [id, el] of dots) if (!live.has(id)) { el.remove(); dots.delete(id); }

    // the pin and, once the step is over, where it belonged
    if (mode === 'place') {
      placePin();
      let nearest = null;
      let best = Infinity;
      targets.forEach((t, i) => {
        const p = rev ? screenOf(t.at[0], t.at[1]) : null;
        const g = targetEls[i];
        g.setAttribute('visibility', p ? 'visible' : 'hidden');
        if (!p) return;
        g.setAttribute('transform', `translate(${f1(p[0])} ${f1(p[1])})`);
        g.children[0].setAttribute('r', f1(7 * u)); g.children[0].setAttribute('stroke-width', f1(2.6 * u));
        g.children[1].setAttribute('r', f1(2.4 * u));
        g.children[2].setAttribute('x', f1(11 * u)); g.children[2].setAttribute('y', f1(4 * u));
        const km = distanceKm(pin, t.at);
        if (km < best) { best = km; nearest = t; }
      });
      const a = rev && nearest && placed ? screenOf(pin[0], pin[1]) : null;
      const b = a ? screenOf(nearest.at[0], nearest.at[1]) : null;
      if (a && b && Math.hypot(a[0] - b[0], a[1] - b[1]) > 16 * u) {
        gapEl.setAttribute('d', linePath(P, M, continuous(greatCircle(pin, nearest.at, 2))));
        gapEl.setAttribute('stroke-width', f1(1.8 * u)); gapEl.setAttribute('stroke-dasharray', `${f1(4 * u)} ${f1(4 * u)}`);
        gapText.textContent = `${Math.round(best).toLocaleString('en')} km`;
        gapText.setAttribute('x', f1((a[0] + b[0]) / 2)); gapText.setAttribute('y', f1((a[1] + b[1]) / 2 - 5 * u));
      } else { gapEl.setAttribute('d', ''); gapText.textContent = ''; }
    }

    // names of areas, lines, parallels and rivers: each tries a few places and takes the first that is free
    const inside = (b) => b[0] >= 1 && b[2] <= W - 1 && b[1] >= 1 && b[3] <= H - 1;
    areas.forEach((a, i) => {
      const t = areaLabels[i];
      if (!t) return;
      const size = 12.5 * u;
      const w = textW(a.label, size);
      const box = a.rings[0][0].box;
      const mid = a.anchor;
      const tall = box[3] - box[1];
      const tries = a.labelAt ? [a.labelAt] : [mid, [mid[0], box[3] - 0.2 * tall], [mid[0], box[1] + 0.2 * tall], [mid[0] - 0.25 * (box[2] - box[0]), mid[1]], [mid[0] + 0.25 * (box[2] - box[0]), mid[1]],
        [mid[0], Math.min(89, box[3] + 0.18 * tall)], [mid[0], Math.max(-89, box[1] - 0.18 * tall)]];
      let spot = null;
      for (const geo of compact ? [] : tries) {
        const p = screenOf(geo[0], geo[1]);
        if (!onCanvas(p, -4)) continue;
        const x = clamp(p[0], w / 2 + 2, W - w / 2 - 2);
        const b = [x - w / 2, p[1] - size * 0.6, x + w / 2, p[1] + size * 0.6];
        if (!inside(b) || (clash(b) && !a.labelAt)) continue;
        spot = { x, y: p[1], b };
        break;
      }
      if (!spot) { t.setAttribute('visibility', 'hidden'); return; }
      t.setAttribute('x', f1(spot.x)); t.setAttribute('y', f1(spot.y + size * 0.35)); t.removeAttribute('visibility');
      taken.push(spot.b);
    });
    lines.forEach((l, i) => {
      const t = lineLabels[i];
      if (!t) return;
      const n = l.pts.length / 2;
      const size = 12.5 * u;
      const w = textW(l.label, size);
      let spot = null;
      // beside the line at a point on screen `p`, given its neighbours on the line: above it first, then below
      const beside = (p, before, after, mustFit) => {
        const len = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1;
        let nx = -(after[1] - before[1]) / len;
        let ny = (after[0] - before[0]) / len;
        if (ny > 0) { nx = -nx; ny = -ny; }
        let first = null;
        for (const side of [1, -1]) {
          let x = p[0] + side * nx * (7 * u + w * 0.5 * Math.abs(nx));
          let y = p[1] + side * ny * (side > 0 ? 9 : 17) * u + size * 0.35;
          if (!mustFit) { x = clamp(x, w / 2 + 2, W - w / 2 - 2); y = clamp(y, size * 0.9 + 2, H - size * 0.25 - 2); }
          const b = [x - w / 2, y - size * 0.9, x + w / 2, y + size * 0.25];
          if (mustFit && !inside(b)) continue;
          if (!clash(b)) return { x, y, b, free: true };
          if (!first) first = { x, y, b, free: false };
        }
        return mustFit ? null : first;
      };
      if (l.labelAt != null && !compact) {
        // The author says where: at that share of the visible line, or at its point nearest to a place.
        const run = visibleRun(l, typeof l.labelAt === 'number' ? null : l.labelAt);
        if (run) {
          let j = Math.round((run.length - 1) * (typeof l.labelAt === 'number' ? l.labelAt : 0.5));
          if (typeof l.labelAt !== 'number') {
            const target = screenOf(l.labelAt[0], l.labelAt[1]) || run[j];
            let nearest = Infinity;
            run.forEach((q, k) => { const d = Math.hypot(q[0] - target[0], q[1] - target[1]); if (d < nearest) { nearest = d; j = k; } });
          }
          j = clamp(j, 1, run.length - 2);
          spot = beside(run[j], run[j - 1], run[j + 1], false);
        }
      } else {
        for (const part of compact ? [] : [0.5, 0.36, 0.64, 0.24, 0.76, 0.12, 0.88]) {
          const k = Math.min(n - 2, Math.floor(n * part));
          const p = screenOf(l.pts[2 * k], l.pts[2 * k + 1]);
          const q = screenOf(l.pts[2 * k + 2], l.pts[2 * k + 3]);
          if (!onCanvas(p, -6) || !q) continue;
          const found = beside(p, p, q, true);
          if (found && found.free) { spot = found; break; }
        }
        // A name that appears nowhere else (no legend entry) must be printed: look along the whole visible line,
        // and if every place is taken, print it at the middle all the same.
        if (!spot && !compact && (!l.inLegend || spec.legend === false)) {
          const run = visibleRun(l, null);
          let fallback = null;
          for (const part of run ? [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82] : []) {
            const j = clamp(Math.round((run.length - 1) * part), 1, run.length - 2);
            const found = beside(run[j], run[j - 1], run[j + 1], false);
            if (found && found.free) { spot = found; break; }
            if (!fallback) fallback = found;
          }
          if (!spot) spot = fallback;
        }
      }
      if (!spot) { t.setAttribute('visibility', 'hidden'); return; }
      t.setAttribute('x', f1(spot.x)); t.setAttribute('y', f1(spot.y)); t.removeAttribute('visibility');
      taken.push(spot.b);
    });
    graticuleLines.forEach((l, i) => {
      const t = parLabels[i];
      if (!t) return;
      const size = 11.5 * u;
      const w = textW(l.label, size);
      let spot = null;
      // the first place, from the left (parallels) or the top (meridians), where the line is inside the window with room for the name
      const n = l.pts.length / 2;
      for (let q = 0; q < n && !spot; q++) {
        const k = l.lat != null ? q : n - 1 - q;
        const p = screenOf(l.pts[2 * k], l.pts[2 * k + 1]);
        if (!p) continue;
        let at = null;
        if (l.lat != null && p[0] >= 6 * u && p[0] + w <= W - 4 && p[1] >= size + 2 && p[1] <= H - 3) at = [p[0], p[1] - 3.5 * u, 'start'];
        if (l.lat == null && p[1] >= size + 4 * u && p[1] <= H - 4 && p[0] + w + 5 * u <= W && p[0] >= 0) at = [p[0] + 5 * u, p[1], 'start'];
        if (at && !clash([at[0], at[1] - size, at[0] + w, at[1] + size * 0.3])) spot = at;
      }
      if (!spot || compact) { t.setAttribute('visibility', 'hidden'); return; }
      t.setAttribute('x', f1(spot[0])); t.setAttribute('y', f1(spot[1])); t.setAttribute('text-anchor', spot[2]); t.removeAttribute('visibility');
      taken.push([spot[0], spot[1] - size, spot[0] + w, spot[1] + size * 0.3]);
    });
    for (const t of riverLabels) t.remove();
    riverLabels.length = 0;
    if (riverData && Array.isArray(riverWanted) && !compact) {
      for (const river of riverData) {
        if (!riverWanted.includes(fold(river.name))) continue;
        // a point of the river that is in the window, as near its middle as there is room for the name
        const size = 11.5 * u;
        const w = textW(river.name, size);
        const options = [];
        for (const pts of river.lines) for (let q = 0; q < pts.length / 2; q += 2) {
          const p = screenOf(pts[2 * q], pts[2 * q + 1]);
          if (onCanvas(p, -16 * u)) options.push(p);
        }
        options.sort((a, b) => Math.hypot(a[0] - W / 2, a[1] - H / 2) - Math.hypot(b[0] - W / 2, b[1] - H / 2));
        let spot = null;
        for (const p of options) {
          for (const side of [1, -1]) {
            const x0 = side > 0 ? p[0] + 6 * u : p[0] - 6 * u - w;
            const b = [x0, p[1] - size * 0.9, x0 + w, p[1] + size * 0.3];
            if (!inside(b)) continue;
            if (!spot || !clash(b)) spot = { x: x0, y: p[1], b, free: !clash(b) };
            if (spot.free) break;
          }
          if (spot && spot.free) break;
        }
        if (!spot) continue;
        const t = s('text.fig-label-sm.wm-t-water', { x: f1(spot.x), y: f1(spot.y) }, river.name);
        gText.appendChild(t);
        riverLabels.push(t);
        taken.push(spot.b);
      }
    }

    // names of countries: the ones asked for, then (once the step is over) the picked ones and the answer
    const wanted = labelSpecs.slice();
    if (rev && countryMode) for (const id of new Set([...answerIds, ...picked])) if (!wanted.some((l) => l.id === id)) wanted.unshift({ id, text: info[id][0], style: '', forced: true });
    const placedNames = new Set();
    wanted.sort((a, b) => (b.forced - a.forced) || ((b.id ? sizes.get(b.id) || 0 : 1e4) - (a.id ? sizes.get(a.id) || 0 : 1e4)));
    for (const l of wanted) {
      if (!l.text) continue;
      if (l.id && !anchors.has(l.id)) continue;
      const geo = l.id ? labelPoint(l.id) : l.at;
      const p = screenOf(geo[0], geo[1]);
      if (!onCanvas(p, l.forced ? 0 : -8 * u)) continue;
      const size = (l.big ? 12.5 : 11.5) * u;
      const spaced = l.style === 'area' ? 1.22 : 1;
      // long names go on two lines
      if (!l.forced && l.at && placedNames.has(l.text) && u > 1.35) continue;      // one "Pacific Ocean" is enough on a phone
      let rows = [l.text];
      if (l.text.length > (l.style === 'water' || l.style === 'area' ? 9 : 15) && l.text.includes(' ')) {
        const words = l.text.split(' ');
        let cut = 1; let bestDiff = Infinity;
        for (let q = 1; q < words.length; q++) { const diff = Math.abs(words.slice(0, q).join(' ').length - words.slice(q).join(' ').length); if (diff < bestDiff) { bestDiff = diff; cut = q; } }
        rows = [words.slice(0, cut).join(' '), words.slice(cut).join(' ')];
      }
      const w = Math.max(...rows.map((row) => textW(row, size))) * spaced;
      const hgt = rows.length * size * 1.08;
      const small = l.id ? isSmall(l.id) : false;
      if (l.id && !l.forced) {
        // an automatic name must fit its country, more or less
        const room = (sizes.get(l.id) || 0) * zoom;
        if (small || w > room * 1.25 || compact) continue;
      }
      const tries = small ? [[w / 2 + 7 * u, 0], [-w / 2 - 7 * u, 0], [0, -hgt / 2 - 6 * u], [0, hgt / 2 + 6 * u]] : [[0, 0], [0, -hgt * 0.7], [0, hgt * 0.7], [w * 0.3, 0], [-w * 0.3, 0]];
      let spot = null;
      for (const [dx, dy] of tries) {
        const x = clamp(p[0] + dx, w / 2 + 2, W - w / 2 - 2);
        const y = clamp(p[1] + dy, hgt / 2 + 2, H - hgt / 2 - 2);
        const box = [x - w / 2, y - hgt / 2, x + w / 2, y + hgt / 2];
        if (!clash(box)) { spot = { x, y, box }; break; }
        if (!spot && l.forced && dx === tries[0][0] && dy === tries[0][1]) spot = { x, y, box, poor: true };
      }
      if (!spot || (spot.poor && !l.forced)) continue;
      taken.push(spot.box);
      placedNames.add(l.text);
      const cls = l.style === 'water' ? 'wm-t-water' : l.style === 'area' ? 'wm-t-area' : 'wm-t';
      rows.forEach((row, q) => putText(row, spot.x, spot.y - hgt / 2 + size * 0.86 + q * size * 1.08, cls));
    }
    for (let q = textUsed; q < texts.length; q++) texts[q].setAttribute('visibility', 'hidden');

    // where the keyboard is
    const cur = keysFocused && cursor >= 0 ? cands[cursor] : null;
    const cp = cur ? screenOf(cur.at[0], cur.at[1]) : null;
    cursorEl.setAttribute('visibility', cp ? 'visible' : 'hidden');
    if (cp) {
      cursorEl.setAttribute('cx', f1(cp[0])); cursorEl.setAttribute('cy', f1(cp[1]));
      cursorEl.setAttribute('r', f1(11 * u)); cursorEl.setAttribute('stroke-width', f1(3 * u));
    }
    placeTip();
  }

  /* ------------------------------------------------- tooltip, status, legend */
  const tipEl = isStatic ? null : h('div.wm-tip', { hidden: true, 'aria-hidden': 'true' });
  if (tipEl) fr.canvas.appendChild(tipEl);
  let tip = null;                      // { text, x, y } in SVG units
  function placeTip() {
    if (!tipEl) return;
    if (!tip) { tipEl.hidden = true; return; }
    tipEl.hidden = false;
    tipEl.textContent = tip.text;
    tipEl.style.left = `${round((tip.x / W) * 100, 2)}%`;
    tipEl.style.top = `${round((tip.y / H) * 100, 2)}%`;
    tipEl.className = cx('wm-tip', tip.x < W * 0.22 && 'is-left', tip.x > W * 0.78 && 'is-right', tip.y < H * 0.2 && 'is-below');
  }
  function tipFor(id, at = null) {
    if (!id || !showNames()) { tip = null; placeTip(); return; }
    const geo = labelPoint(id);
    const p = at || screenOf(geo[0], geo[1]);
    tip = p ? { text: countryName(id), x: clamp(p[0], 0, W), y: clamp(p[1], 0, H) } : null;
    placeTip();
  }

  const statusEl = h('div.wm-status');
  if (!isStatic && mode !== 'view') fr.el.insertBefore(statusEl, fr.readouts);
  const markerText = (id) => { const m = markerById.get(id); return m ? (m.label && (!hideMarkerLabels || revealed()) ? m.label : `marker ${m.letter}`) : id; };
  function status() {
    if (isStatic || mode === 'view') return;
    const rev = revealed();
    let text = '';
    if (countryMode) {
      if (rev) {
        const bits = [];
        if (picked.length) bits.push(`You picked ${listText(picked.map(countryNameThe))}.`);
        if (answerIds.length && (answerIds.length !== picked.length || answerIds.some((id) => !picked.includes(id)))) bits.push(`The answer: ${listText(answerIds.map(countryNameThe))} (dashed outline).`);
        text = bits.join(' ');
      } else if (!picked.length) text = many ? 'Tap the countries to choose them.' : 'Tap a country to choose it.';
      else if (names) text = many ? `Chosen: ${listText(picked.map(countryNameThe))}.` : `Chosen: ${countryNameThe(picked[0])}.`;
      else text = many ? `${picked.length} chosen${spec.max ? ` of ${spec.max}` : ''}. Tap one again to let it go.` : 'One country chosen.';
    } else if (mode === 'pickMarker' || mode === 'pickMarkers') {
      if (rev && answerMarkers.length) text = `${picked.length ? `You picked ${listText(picked.map(markerText))}. ` : ''}${picked.length === answerMarkers.length && answerMarkers.every((id) => picked.includes(id)) ? '' : `The answer: ${listText(answerMarkers.map(markerText))} (dashed ring).`}`;
      else if (!picked.length) text = many ? 'Tap the markers to choose them.' : 'Tap a marker to choose it.';
      else text = `Chosen: ${listText(picked.map(markerText))}.`;
    } else if (mode === 'trace') {
      text = route.length ? `Route: ${route.map(markerText).join(' → ')}` : 'Tap the markers in order to draw the route.';
      if (rev && answerRoute.length) text += `. The answer (dashed): ${answerRoute.map(markerText).join(' → ')}`;
    } else if (mode === 'place') {
      if (!placed) text = 'Drag the pin, or tap the map, to place it.';
      else if (!tellCoords()) text = 'Pin placed. Drag it, or tap the map, to move it.';
      else {
        text = `Pin at ${Math.abs(pin[1]).toFixed(1)}° ${pin[1] >= 0 ? 'N' : 'S'}, ${Math.abs(pin[0]).toFixed(1)}° ${pin[0] >= 0 ? 'E' : 'W'}`;
        if (rev) {
          const st = getState();
          if (st.country) text += `, in ${countryNameThe(st.country)}`;
          if (st.km != null) text += `; ${Math.round(st.km).toLocaleString('en')} km from ${targets.length > 1 ? (targets.find((t) => t.id === st.nearest).label || 'the nearest target') : (targets[0].label || 'the target')}`;
        }
        text += '.';
      }
    }
    statusEl.textContent = text;
  }

  const legendItems = [];
  for (const g of groups) if (g.label) legendItems.push(h('span.w-legend-item', {}, h('i', { style: { background: hue(g.color, g.tone) } }), g.label));
  for (const a of areas) if (a.label && a.inLegend) legendItems.push(h('span.w-legend-item', {}, h('i.is-area', { style: { background: hue(a.color, 'soft'), '--c': hue(a.color) } }), a.label));
  for (const l of lines) if (l.label && l.inLegend) legendItems.push(h('span.w-legend-item', {}, h('i.is-line', { style: { borderColor: hue(l.color), borderTopStyle: l.dashed ? 'dashed' : 'solid' } }), l.label));
  if (legendItems.length && !compact && spec.legend !== false) fr.el.insertBefore(h('div.w-legend', {}, legendItems), statusEl.parentNode === fr.el ? statusEl : fr.readouts);

  /* -------------------------------------------------------------- controls */
  function applyZoom() {
    zoom = clamp(zoom, 1, maxZoom);
    if (globe) { cx0 = W / 2; cy0 = H / 2; } else {
      cx0 = clamp(cx0, W / (2 * zoom), W - W / (2 * zoom));
      cy0 = clamp(cy0, H / (2 * zoom), H - H / (2 * zoom));
    }
    gMap.setAttribute('transform', zoom === 1 ? '' : `translate(${f1(W / 2 - cx0 * zoom)} ${f1(H / 2 - cy0 * zoom)}) scale(${round(zoom, 3)})`);
    if (zoom === 1) gMap.removeAttribute('transform');
    svg.classList.toggle('is-zoomed', zoom > 1.001);
    if (zoomOut) { setAble(zoomOut, zoom > 1.001); setAble(zoomIn, zoom < maxZoom - 0.001); resetBtn.hidden = zoom <= 1.001 && !turned; }
    layout();
  }
  /** Zoom by a factor, keeping the point under (x, y) (SVG units) where it is. */
  function zoomBy(factor, x = W / 2, y = H / 2) {
    const before = toBase(x, y);
    zoom = clamp(zoom * factor, 1, maxZoom);
    cx0 = before[0] - (x - W / 2) / zoom;
    cy0 = before[1] - (y - H / 2) / zoom;
    applyZoom();
  }
  let turned = false;
  let turnQueued = false;
  function turnGlobe(dLon, dLat) {
    lon0 = wrap180(lon0 + dLon);
    lat0 = clamp(lat0 + dLat, -89, 89);
    turned = true;
    const k = P.k; const tx = P.tx; const ty = P.ty;
    P = makeProjector(projName, lon0, lat0, null);
    P.k = k; P.tx = tx; P.ty = ty;
    if (turnQueued) return;
    turnQueued = true;
    requestAnimationFrame(() => { turnQueued = false; if (!destroyed) { rebuild(); if (resetBtn) resetBtn.hidden = !turned && zoom <= 1.001; } });
  }
  const startLon = lon0;
  const startLat = lat0;
  let zoomIn = null; let zoomOut = null; let resetBtn = null;
  let setAble = () => {};
  if (canZoom) {
    // Not <button>s: the widget loader disables every button of a widget once its step is answered, and looking
    // round the map is exactly what a learner wants to do then. These stay live; they are buttons in every other way.
    const mk = (name, label, fn) => {
      const b = h('div', { role: 'button', tabindex: '0', 'aria-label': label, title: label }, icon(name, 18));
      const go = (ev) => { ev.preventDefault(); ev.stopPropagation(); if (b.getAttribute('aria-disabled') !== 'true') fn(); };
      b.addEventListener('click', go);
      b.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') go(ev); });
      b.dataset.keys = 'own';
      return b;
    };
    const able = (b, on) => { if (on) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true'); };
    zoomOut = mk('minus', 'Zoom out', () => zoomBy(1 / 1.6));
    zoomIn = mk('plus', 'Zoom in', () => zoomBy(1.6));
    resetBtn = mk('reset', 'Reset the view', () => { zoom = 1; cx0 = W / 2; cy0 = H / 2; if (globe && turned) { turnGlobe(wrap180(startLon - lon0), startLat - lat0); turned = false; } applyZoom(); });
    resetBtn.hidden = true;
    setAble = able;
    able(zoomOut, false);
    const box = h('div.wm-zoom', {}, zoomOut, zoomIn);
    if (globe) box.append(mk('arrow-left', 'Turn the globe west', () => turnGlobe(-30, 0)), mk('arrow-right', 'Turn the globe east', () => turnGlobe(30, 0)));
    box.append(resetBtn);
    fr.canvas.appendChild(box);
  }
  if (lines.some((l) => l.anim === 'draw')) {
    fr.buttons.appendChild(button('Replay', () => {
      for (const l of lines) for (const el of [l.el, l.halo, ...l.heads]) { if (!el.classList.contains('is-draw')) continue; el.classList.remove('is-draw'); void el.getBoundingClientRect(); el.classList.add('is-draw'); }
    }, { icon: 'play', variant: 'ghost' }));
  }
  let undoBtn = null; let clearBtn = null;
  if (mode === 'trace') {
    undoBtn = button('Undo', () => { if (readOnly || !route.length) return; route.pop(); play('pop'); changed(); }, { icon: 'undo', variant: 'ghost' });
    fr.buttons.appendChild(undoBtn);
  }
  if (many || mode === 'trace') {
    clearBtn = button('Clear', () => { if (readOnly) return; if (!picked.length && !route.length) return; picked = []; route = []; play('pop'); changed(); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(clearBtn);
  }

  /* ------------------------------------------------------------ hit testing */
  /** Is this point of a country in one of the polygons of its main body (on the shapes now on screen)? */
  function inMainPart(id, lon, lat) {
    const polys = geometryOf(layer, id);
    const main = mainBodyOf(layer, id);
    for (let i = 0; i < polys.length; i++) if (inPolygon(polys[i], lon, lat)) return main.has(i);
    return true;
  }
  /** What is under a point of the window? → { kind: 'country' | 'marker', id } or null. `reach` is in CSS pixels. */
  function hit(x, y, reach) {
    if (markerMode) {
      let best = null;
      let bestD = Infinity;
      for (const m of pickableMarkers) {
        if (!m.screen) continue;
        const d = Math.hypot(m.screen[0] - x, m.screen[1] - y);
        if (d < bestD) { best = m; bestD = d; }
      }
      return best && bestD <= Math.max(reach, 10) * unit ? { kind: 'marker', id: best.id } : null;
    }
    // a small country near the point wins over the large one it sits in
    let near = null;
    let nearD = reach * unit;
    for (const c of cands) {
      if (c.kind !== 'country' || !isSmall(c.id) || (!layer.shapes[c.id] && !dots.has(c.id))) continue;
      const p = screenOf(c.at[0], c.at[1]);
      if (!p) continue;
      const d = Math.hypot(p[0] - x, p[1] - y);
      if (d < nearD) { near = c.id; nearD = d; }
    }
    if (near) return { kind: 'country', id: near };
    const g = geoAt(x, y);
    if (!g) return null;
    const id = countryAtIn(layer, g[0], g[1]);
    if (!id || (pickSet && !pickSet.has(id))) return null;
    if (spec.mainBodyOnly && layer.shapes[id] && !inMainPart(id, g[0], g[1])) return null;
    return { kind: 'country', id };
  }

  function changed() {
    paint();
    syncOutlines();
    labelCandidates();
    layout();
    status();
    if (undoBtn) undoBtn.disabled = readOnly || !route.length;
    if (clearBtn) clearBtn.disabled = readOnly || (!picked.length && !route.length);
    env.onChange(getState());
  }

  function choose(target, how = 'tap') {
    if (!target) return;
    const touched = cands.findIndex((c) => c.kind === target.kind && c.id === target.id);
    if (touched >= 0) cursor = touched;       // the keyboard carries on from what was last touched
    if (target.kind === 'country' && mode === 'view') {
      if (!names) return;
      shown = shown === target.id && how === 'tap' ? null : target.id;
      syncOutlines();
      labelCandidates();
      tipFor(shown);
      if (shown) env.announce(countryName(shown));
      return;
    }
    if (readOnly) {
      // the step is over: a tap now only asks "what is this?"
      if (target.kind === 'country' && showNames()) { tipFor(target.id); env.announce(countryName(target.id)); }
      return;
    }
    const id = target.id;
    if (mode === 'trace') {
      const at = route.indexOf(id);
      if (at === route.length - 1 && at >= 0) { route.pop(); play('pop'); }
      else if (at >= 0) { route = route.slice(0, at + 1); play('pop'); }
      else { route.push(id); play('drop'); }
      env.announce(route.length ? `Route: ${route.map(markerText).join(', then ')}.` : 'Route cleared.');
      changed();
      return;
    }
    const at = picked.indexOf(id);
    const what = target.kind === 'marker' ? markerText(id) : (names ? countryNameThe(id).replace(/^the /, 'The ') : 'Country');
    if (at >= 0) { picked.splice(at, 1); play('pop'); env.announce(`${what} no longer chosen.`); }
    else if (many) {
      if (spec.max && picked.length >= spec.max) { env.announce(`You can choose at most ${spec.max}. Let one go first.`); statusEl.textContent = `At most ${spec.max}: tap a chosen one to let it go.`; return; }
      picked.push(id); play('select'); env.announce(`${what} chosen. ${picked.length} chosen.`);
    } else { picked = [id]; play('select'); env.announce(`${what} chosen.`); }
    changed();
  }

  /* ---------------------------------------------------------------- pointer */
  const pointers = new Map();
  let gesture = null;                  // { x, y, moved, pinch }
  const local = (ev) => {
    const m = svg.getScreenCTM();
    if (!m) return [0, 0];
    return [(ev.clientX - m.e) / m.a, (ev.clientY - m.f) / m.d];
  };
  const onDown = (ev) => {
    if (ev.button > 0 || (ev.target.closest && ev.target.closest('.w-handle'))) return;
    const [x, y] = local(ev);
    pointers.set(ev.pointerId, [x, y]);
    if (pointers.size === 1) gesture = { id: ev.pointerId, x, y, sx: x, sy: y, moved: false, touch: ev.pointerType !== 'mouse', time: ev.timeStamp };
    else if (pointers.size === 2 && canZoom) {
      const [a, b] = Array.from(pointers.values());
      gesture = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, moved: true };
      try { svg.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
    }
  };
  const onMove = (ev) => {
    const [x, y] = local(ev);
    if (!pointers.has(ev.pointerId)) {
      if (ev.pointerType === 'mouse' && !isStatic) hoverAt(x, y);
      return;
    }
    pointers.set(ev.pointerId, [x, y]);
    if (!gesture) return;
    if (gesture.pinch) {
      const [a, b] = Array.from(pointers.values());
      if (!a || !b) return;
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
      zoomBy(d / gesture.pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      gesture.pinch = d;
      ev.preventDefault();
      return;
    }
    if (ev.pointerId !== gesture.id) return;
    const dx = x - gesture.x;
    const dy = y - gesture.y;
    if (!gesture.moved && Math.hypot(x - gesture.sx, y - gesture.sy) > 6 * unit) {
      gesture.moved = true;
      if (canZoom && (globe || zoom > 1.001)) { svg.classList.add('is-panning'); try { svg.setPointerCapture(ev.pointerId); } catch { /* ignore */ } }
    }
    if (!gesture.moved || !canZoom) return;
    if (globe) {
      const perDeg = (P.k * zoom * RAD);
      turnGlobe(-dx / perDeg / Math.max(0.3, Math.cos(lat0 * RAD)), dy / perDeg);
    } else if (zoom > 1.001) {
      cx0 -= dx / zoom;
      cy0 -= dy / zoom;
      applyZoom();
    }
    gesture.x = x; gesture.y = y;
    if (tip) { tip = null; placeTip(); }
  };
  const onUp = (ev) => {
    if (!pointers.has(ev.pointerId)) return;
    const [x, y] = pointers.get(ev.pointerId);
    pointers.delete(ev.pointerId);
    svg.classList.remove('is-panning');
    const g = gesture;
    if (pointers.size === 0) gesture = null;
    else if (g && g.pinch) gesture = { moved: true };       // one finger of a pinch is still down: not a tap, not a pan
    if (!g || g.moved || g.pinch || ev.type === 'pointercancel' || g.id !== ev.pointerId) return;
    tap(x, y, g.touch);
  };
  function tap(x, y, touch) {
    if (isStatic) return;
    if (mode === 'place') {
      if (readOnly) return;
      const g = geoAt(x, y);
      if (!g) return;
      pin = [round(g[0], 2), round(g[1], 2)];
      placed = true;
      play('drop');
      layout();
      status();
      env.announce(pinSaid());
      env.onChange(getState());
      return;
    }
    const target = hit(x, y, touch ? 20 : 9);
    if (!target) { if (mode === 'view' && shown) { shown = null; syncOutlines(); tipFor(null); } return; }
    choose(target);
    if (target.kind === 'country' && mode !== 'view' && !readOnly) tipFor(showNames() ? target.id : null);
  }
  let hoverPoint = null;
  function hoverAt(x, y) {
    const waiting = !!hoverPoint;
    hoverPoint = [x, y];
    if (waiting) return;
    requestAnimationFrame(() => {
      const at = hoverPoint;
      hoverPoint = null;
      if (destroyed || gesture || !at) return;
      const active = (countryMode || markerMode) && !readOnly;
      const target = active || showNames() ? hit(at[0], at[1], 7) : null;
      const id = target && target.kind === 'country' ? target.id : null;
      svg.classList.toggle('is-pointing', !!target && active);
      if (id !== hover) { hover = id; syncOutlines(); }
      if (id && showNames()) tipFor(id, at);
      else if (mode === 'view' && shown) tipFor(shown);
      else if (tip) { tip = null; placeTip(); }
    });
  }
  const onLeave = (ev) => { if (ev.pointerType !== 'mouse') return; hoverPoint = null; if (hover) { hover = null; syncOutlines(); } if (mode === 'view' && shown) tipFor(shown); else if (tip) { tip = null; placeTip(); } svg.classList.remove('is-pointing'); };
  const onWheel = (ev) => {
    if (!canZoom || !(ev.ctrlKey || ev.metaKey)) return;       // plain wheel scrolls the page
    ev.preventDefault();
    const [x, y] = local(ev);
    zoomBy(Math.exp(-ev.deltaY * 0.01), x, y);
  };
  if (!isStatic) {
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    svg.addEventListener('pointerleave', onLeave);
    svg.addEventListener('wheel', onWheel, { passive: false });
  }

  /* --------------------------------------------------------------- keyboard */
  function moveCursor(to) {
    if (to < 0 || to >= cands.length) return;
    cursor = to;
    const c = cands[cursor];
    // bring it into the window if it is outside
    let p = screenOf(c.at[0], c.at[1]);
    if (globe && !p) { turnGlobe(wrap180(c.at[0] - lon0), 0); }
    else if (!onCanvas(p, -8 * unit) && zoom > 1.001) { const b = P.project(c.at[0], c.at[1]); if (b) { cx0 = b[0]; cy0 = b[1]; applyZoom(); } p = screenOf(c.at[0], c.at[1]); }
    labelCandidates();
    syncOutlines();
    layout();
    if (c.kind === 'country') tipFor(showNames() ? c.id : null);
    const on = c.el.getAttribute('aria-selected') === 'true';
    env.announce(`${candLabel(c)}${on ? ', chosen' : ''}`);
  }
  function step(dx, dy) {
    if (!cands.length) return;
    if (cursor < 0) { moveCursor(nearestToCentre()); return; }
    const here = navPoint(cands[cursor]);
    let best = -1;
    let bestScore = Infinity;
    cands.forEach((c, i) => {
      if (i === cursor) return;
      const p = navPoint(c);
      const ax = (p[0] - here[0]) * dx + (p[1] - here[1]) * dy;       // how far along the arrow's direction
      const off = Math.abs((p[0] - here[0]) * dy) + Math.abs((p[1] - here[1]) * dx);     // how far to the side
      if (ax <= 0.5 || off > ax * 2.2) return;
      const score = ax + off * 2;
      if (score < bestScore) { bestScore = score; best = i; }
    });
    if (best >= 0) moveCursor(best);
  }
  /** A position for arrow-key travel: the drawing where the point is visible, plain longitude/latitude otherwise. */
  function navPoint(c) {
    const p = P.project(c.at[0], c.at[1]);
    if (p) return p;
    return [W / 2 + wrap180(c.at[0] - P.lon0) * 8, H / 2 - (c.at[1] - P.lat0) * 8];
  }
  function nearestToCentre() {
    let best = 0;
    let bestD = Infinity;
    cands.forEach((c, i) => { const p = screenOf(c.at[0], c.at[1]); if (!p) return; const d = Math.hypot(p[0] - W / 2, p[1] - H / 2); if (d < bestD) { bestD = d; best = i; } });
    return best;
  }
  let typed = '';
  let typedAt = 0;
  const onKey = (ev) => {
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    let used = true;
    if (ev.key === 'ArrowLeft') step(-1, 0);
    else if (ev.key === 'ArrowRight') step(1, 0);
    else if (ev.key === 'ArrowUp') step(0, -1);
    else if (ev.key === 'ArrowDown') step(0, 1);
    else if (ev.key === 'Home') moveCursor(0);
    else if (ev.key === 'End') moveCursor(cands.length - 1);
    else if (ev.key === 'Enter' || ev.key === ' ') { if (cursor < 0) moveCursor(nearestToCentre()); else { const c = cands[cursor]; choose({ kind: c.kind, id: c.id }, 'key'); if (c.kind === 'country') tipFor(showNames() ? c.id : null); } }
    else if ((ev.key === '+' || ev.key === '=') && canZoom) zoomBy(1.6);
    else if ((ev.key === '-' || ev.key === '_') && canZoom) zoomBy(1 / 1.6);
    else if (ev.key === '0' && canZoom && resetBtn && !resetBtn.hidden) resetBtn.click();
    else if (ev.key === 'Escape' && (tip || shown)) { shown = null; tip = null; placeTip(); syncOutlines(); }
    else if (ev.key.length === 1 && /\S/.test(ev.key) && showNames() && !markerMode) {
      // type the first letters of a name to jump to it
      typed = ev.timeStamp - typedAt > 900 ? ev.key : typed + ev.key;
      typedAt = ev.timeStamp;
      const want = fold(typed);
      const from = typed.length === 1 ? cursor + 1 : Math.max(0, cursor);
      for (let q = 0; q < cands.length; q++) { const i = (from + q) % cands.length; if (fold(countryName(cands[i].id)).startsWith(want)) { moveCursor(i); break; } }
    } else used = false;
    if (used) { ev.preventDefault(); ev.stopPropagation(); }
  };
  if (interactiveList) {
    const what = markerMode ? 'Markers' : 'Countries';
    const act = mode === 'view' ? 'Enter shows a name' : mode === 'trace' ? 'Enter adds a marker to the route' : 'Enter chooses';
    gKeys.setAttribute('role', 'listbox');
    gKeys.setAttribute('tabindex', '0');
    gKeys.setAttribute('aria-label', `${what} on the map. Arrow keys move from one to the next, ${act}.`);
    if (many) gKeys.setAttribute('aria-multiselectable', 'true');
    gKeys.dataset.keys = 'own';
    gKeys.style.pointerEvents = 'none';
    gKeys.addEventListener('keydown', onKey);
    gKeys.addEventListener('focus', () => { keysFocused = gKeys.matches(':focus-visible'); if (keysFocused && cursor < 0 && cands.length) cursor = nearestToCentre(); labelCandidates(); syncOutlines(); layout(); });
    gKeys.addEventListener('blur', () => { keysFocused = false; if (tip && !(mode === 'view' && shown)) tip = null; syncOutlines(); layout(); });
  }

  /* ------------------------------------------------------------------ state */
  /** Place mode: the pin stands on one of the rings drawn for a tiny country (what the learner sees is what counts). */
  function ringUnderPin() {
    const p = dots.size ? screenOf(pin[0], pin[1]) : null;
    if (!p) return null;
    let found = null;
    let foundD = Infinity;
    for (const [id, el] of dots) {
      const d = Math.hypot(Number(el.getAttribute('cx')) - p[0], Number(el.getAttribute('cy')) - p[1]);
      if (d <= Number(el.getAttribute('r')) + 4 * unit && d < foundD) { found = id; foundD = d; }
    }
    return found;
  }

  function getState() {
    if (mode === 'pick') return { picked: picked[0] || null, name: picked[0] ? countryName(picked[0]) : null, nameThe: picked[0] ? countryNameThe(picked[0]) : null };
    if (mode === 'pickMany') return { picked: picked.slice().sort(), count: picked.length };
    if (mode === 'pickMarker') return { picked: picked[0] || null };
    if (mode === 'pickMarkers') return { picked: picked.slice().sort(), count: picked.length };
    if (mode === 'trace') {
      let km = 0;
      for (let i = 0; i + 1 < route.length; i++) km += distanceKm(markerById.get(route[i]).at, markerById.get(route[i + 1]).at);
      return { route: route.slice(), count: route.length, km: Math.round(km) };
    }
    if (mode === 'place') {
      const out = { pin: pin.slice(), placed, country: placed ? ringUnderPin() || countryAtIn(layer, pin[0], pin[1], 25) : null };
      if (targets.length) {
        out.distances = {};
        let best = Infinity;
        for (const t of targets) {
          const km = Math.round(distanceKm(pin, t.at));
          out.distances[t.id] = km;
          if (km < best) { best = km; out.nearest = t.id; }
        }
        out.km = best;
      }
      return out;
    }
    return {};
  }

  function describe() {
    const bits = [spec.alt || `Map of ${view.name}.`];
    if (groups.some((g) => g.label)) bits.push(`Shown in colour: ${groups.filter((g) => g.label).map((g) => (showNames() ? `${g.label} (${listText(g.ids.slice(0, 12).map(countryNameThe))}${g.ids.length > 12 ? ' and others' : ''})` : g.label)).join('; ')}.`);
    const named = markers.filter((m) => m.label && (!hideMarkerLabels || revealed() || !pickableMarkers.includes(m)));
    if (named.length) bits.push(`Marked: ${listText(named.slice(0, 12).map((m) => m.label))}.`);
    if (lines.some((l) => l.label)) bits.push(`Lines: ${listText(lines.filter((l) => l.label).map((l) => l.label))}.`);
    if (areas.some((a) => a.label)) bits.push(`Shaded: ${listText(areas.filter((a) => a.label).map((a) => a.label))}.`);
    svg.setAttribute('aria-label', bits.join(' '));
  }

  function refresh() {
    paint();
    buildCandidates();
    syncOutlines();
    layout();
    status();
    describe();
    if (undoBtn) undoBtn.disabled = readOnly || !route.length;
    if (clearBtn) clearBtn.disabled = readOnly || (!picked.length && !route.length);
    if (pinHandle) pinHandle.setEnabled(!readOnly);
    fr.el.classList.toggle('is-readonly', readOnly);
  }

  /* ----------------------------------------------------------------- start */
  rebuild(false);
  refresh();

  // better shapes for regional maps, and rivers, arrive a moment later
  if (wantDetail && layer.res !== '50m') {
    loadDetail().then(() => {
      if (destroyed) return;
      layer = layers['50m'];
      for (const p of paths.values()) p.d = '';
      rebuild();
      refresh();
    }).catch((err) => console.error('[world-map] detailed shapes did not load', err));
  }
  if (riverWanted) {
    loadRivers().then(() => { if (!destroyed) { drawRivers(); layout(); } }).catch((err) => console.error('[world-map] rivers did not load', err));
  }

  // keep text, markers and tap areas the same size on screen however large the figure is shown
  let watcher = null;
  let sized = false;
  if (typeof ResizeObserver === 'function') {
    watcher = new ResizeObserver((entries) => {
      const width = entries[0] && entries[0].contentRect ? entries[0].contentRect.width : 0;
      if (!(width > 0) || destroyed) return;
      const next = W / width;
      const first = !sized;
      sized = true;
      if (Math.abs(next - unit) / unit < 0.02) {
        if (first && edgeLabels) layout();        // labels at the edge were placed by guesswork before the figure was in the page
        return;
      }
      unit = next;
      svg.style.setProperty('--wm-u', String(round(unit, 3)));
      layout();
    });
    watcher.observe(fr.canvas);
  }

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (next == null) return;
      const st = typeof next === 'object' && !Array.isArray(next) ? next : { picked: next, pin: next, route: next };
      if ('reveal' in st) forcedReveal = st.reveal == null ? null : !!st.reveal;
      if (countryMode && st.picked !== undefined) {
        picked = Array.from(new Set([].concat(st.picked == null ? [] : st.picked).filter(isId)));
        if (!many) picked = picked.slice(0, 1);
      }
      if ((mode === 'pickMarker' || mode === 'pickMarkers') && st.picked !== undefined) {
        picked = Array.from(new Set([].concat(st.picked == null ? [] : st.picked).map(String).filter((id) => markerById.has(id))));
        if (!many) picked = picked.slice(0, 1);
      }
      if (mode === 'trace' && Array.isArray(st.route)) route = st.route.map(String).filter((id, i, all) => markerById.has(id) && all.indexOf(id) === i);
      if (mode === 'place' && st.pin !== undefined) {
        const p = toPoint(st.pin);
        if (p) { pin = [round(wrap180(p[0]), 2), round(p[1], 2)]; placed = true; } else if (st.pin === null) { placed = false; }
      }
      refresh();
    },
    setReadOnly(v) {
      readOnly = !!v;
      if (readOnly) { hover = null; svg.classList.remove('is-pointing'); }
      refresh();
    },
    destroy() {
      destroyed = true;
      if (watcher) watcher.disconnect();
      if (pinHandle) pinHandle.destroy();
      svg.removeEventListener('pointerdown', onDown);
      svg.removeEventListener('pointermove', onMove);
      svg.removeEventListener('pointerup', onUp);
      svg.removeEventListener('pointercancel', onUp);
      svg.removeEventListener('pointerleave', onLeave);
      svg.removeEventListener('wheel', onWheel);
    },
  };
}

export const examples = [
  {
    title: 'world-map — the world, coloured by continent',
    note: 'Equal Earth projection. Hover or tap a country for its name; zoom with the buttons, a pinch or Ctrl + wheel.',
    spec: {
      type: 'world-map', oceans: true,
      regions: [
        { ids: 'africa', color: 'orange', label: 'Africa' }, { ids: 'europe', color: 'violet', label: 'Europe' }, { ids: 'asia', color: 'green', label: 'Asia' },
        { ids: 'north-america', color: 'red', label: 'North America' }, { ids: 'south-america', color: 'yellow', label: 'South America' }, { ids: 'oceania', color: 'pink', label: 'Oceania' },
      ],
      alt: 'A world map with each continent in its own colour',
    },
  },
  {
    title: 'world-map — a region with groups, a river, cities and names',
    spec: {
      type: 'world-map', view: [20, 2, 50, 34],
      regions: [{ ids: ['EG', 'SD', 'SS', 'ET', 'UG'], color: 'orange', label: 'Countries on the Nile' }],
      rivers: ['Nile', 'Blue Nile'], labels: ['EG', 'SD', 'SS', 'ET', 'UG'],
      markers: [{ at: 'Cairo', label: 'Cairo' }, { at: 'Khartoum', label: 'Khartoum' }, { at: [32.9, 24.1], label: 'Aswan', shape: 'square', color: 'blue' }],
      alt: 'North-east Africa with the Nile and the countries it runs through',
    },
  },
  {
    title: 'world-map — tap a country (names stay hidden until the step is over)',
    note: 'mode: pick. State is { picked: "PE", name: "Peru" }; `answer` is outlined once the widget is read-only.',
    spec: { type: 'world-map', view: 'south-america', mode: 'pick', answer: 'BO', alt: 'A map of South America without names' },
  },
  {
    title: 'world-map — choose several countries from a restricted set',
    note: 'mode: pickMany with pickable. Tiny countries (Malta, Cyprus …) are rings with a generous tap area.',
    spec: { type: 'world-map', view: 'mediterranean', mode: 'pickMany', pickable: ['southern-europe', 'north-africa', 'TR', 'CY', 'SY', 'LB', 'IL', 'FR'], max: 5, names: true, alt: 'A map of the Mediterranean' },
  },
  {
    title: 'world-map — which marker? (labels appear afterwards)',
    note: 'mode: pickMarker with markerLabels: "after". State is { picked: "b" }.',
    spec: {
      type: 'world-map', view: 'east-asia', mode: 'pickMarker', markerLabels: 'after', answer: 'c',
      markers: [{ id: 'a', at: 'Beijing', label: 'Beijing' }, { id: 'b', at: 'Seoul', label: 'Seoul' }, { id: 'c', at: 'Tokyo', label: 'Tokyo' }, { id: 'd', at: 'Shanghai', label: 'Shanghai' }, { id: 'e', at: 'Ulaanbaatar', label: 'Ulaanbaatar' }],
      alt: 'East Asia with five unnamed city markers',
    },
  },
  {
    title: 'world-map — place a pin',
    note: 'mode: place with a target. State has pin, placed, country and km (the distance from the target).',
    spec: { type: 'world-map', view: 'africa', mode: 'place', pin: { label: 'Timbuktu', color: 'red' }, target: 'Timbuktu', alt: 'A map of Africa with a pin to place' },
  },
  {
    title: 'world-map — routes, shaded areas and lines of latitude',
    spec: {
      type: 'world-map', view: [-12, -8, 150, 62], projection: 'natural-earth',
      parallels: ['equator', 'tropic-of-cancer'],
      areas: [{ circle: 'Samarkand', km: 900, color: 'violet', label: 'Sogdiana' }, { band: [0, 23.44], color: 'orange' }],
      lines: [
        { points: ['Xi\'an', 'Lanzhou', [75.9, 39.5], 'Samarkand', 'Baghdad', [36.2, 36.2], 'Istanbul', 'Venice'], color: 'red', arrow: true, animate: 'draw', label: 'Silk Road' },
        { points: ['Guangzhou', [112, 12], [104.6, 1.2], [98, 5.6], [94, 6], [81, 5], [76, 8], 'Kozhikode', [60, 14], [46, 12.3], [43.3, 12.6], [38, 20], [33.6, 27.6], [32.5, 30]], color: 'blue', arrow: true, animate: 'draw', label: 'Sea route' },
      ],
      markers: [{ at: 'Xi\'an', label: 'Chang\'an', shape: 'square' }, { at: 'Samarkand', label: 'Samarkand', shape: 'diamond', color: 'violet' }, { at: 'Venice', label: 'Venice', shape: 'star', color: 'yellow' }],
      alt: 'Eurasia with the overland Silk Road and the sea route from China to the Mediterranean',
    },
  },
  {
    title: 'world-map — a globe you can turn',
    note: 'projection: orthographic. Drag to turn it; the arrow buttons do the same from the keyboard.',
    spec: { type: 'world-map', projection: 'orthographic', center: [20, 25], graticule: 15, regions: [{ ids: ['GL'], color: 'blue', label: 'Greenland' }, { ids: 'africa', color: 'orange', label: 'Africa' }], maxWidth: 420, alt: 'A globe showing Greenland and Africa at their true relative sizes' },
  },
  {
    title: 'world-map — how maps lie: Mercator',
    note: 'The same two groups as on the globe above. On Mercator, Greenland looks as large as Africa; in truth Africa is 14 times larger.',
    spec: { type: 'world-map', projection: 'mercator', graticule: 30, regions: [{ ids: ['GL'], color: 'blue', label: 'Greenland' }, { ids: 'africa', color: 'orange', label: 'Africa' }], labels: ['GL'], alt: 'A Mercator world map on which Greenland looks as large as Africa' },
  },
  {
    title: 'world-map — trace a route through markers',
    note: 'mode: trace. State is { route: ["lis", "cape", "goa"], count, km }.',
    spec: {
      type: 'world-map', view: [-30, -42, 95, 48], mode: 'trace', projection: 'equirectangular',
      markers: [{ id: 'lis', at: 'Lisbon', label: 'Lisbon' }, { id: 'cv', at: 'Praia', label: 'Cape Verde' }, { id: 'cape', at: 'Cape Town', label: 'Cape of Good Hope' }, { id: 'mom', at: 'Mombasa', label: 'Mombasa' }, { id: 'cal', at: 'Kozhikode', label: 'Calicut' }],
      answer: ['lis', 'cv', 'cape', 'mom', 'cal'],
      alt: 'Africa and the Indian Ocean with five ports to join into a route',
    },
  },
];
