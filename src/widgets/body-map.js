/**
 * body-map — a diagram of the human body: a picture to read, a figure to explore, or the answer area of a graded
 * step (tap a structure, tap a marker, put a marker on the right spot).
 *
 * The author guide, with an example of every option and the full list of structure ids, is docs/BODY.md.
 * This comment is the reference.
 *
 * The figure FACES the viewer, so the person's left is on the viewer's right. Sides are always the person's own
 * ('left-lung' is drawn on the right of the picture), as in anatomy.
 *
 * {
 *   type: 'body-map',
 *
 *   // ---- what is shown
 *   view: 'body',                  // 'body' (whole figure, front) | 'torso' | 'chest' | 'abdomen' | 'leg' (parts of it, enlarged)
 *                                  // | 'back' (whole figure from behind) | 'back-torso'
 *                                  // | 'head' (head and neck from the side, cut open) | 'heart' (chambers, valves, great vessels)
 *                                  // | 'lungs-detail' (airway tree down to an air sac) | 'skin' (a block of skin) | 'cell'
 *   bounds: [x0, y0, x1, y1],      // show only this part of the view, in the view's own coordinates (see `debug`)
 *   show: ['digestive', 'heart'],  // systems, structure ids and aliases, in any mix. Systems: skeleton muscles circulatory respiratory
 *                                  //   digestive urinary nervous endocrine immune; layers 'female' and 'male' (off unless named);
 *                                  //   aliases: organs lungs kidneys spine cerebrum intestines airways …; 'all'.
 *                                  //   Default: ['organs'] in body views, ['skeleton'] from behind, everything in the other views.
 *                                  //   The outline of the body ('skin') is always drawn unless it is in `hide`.
 *   hide: ['ribs'],                // take these out again
 *   groups: [                      // highlight groups, each in a theme colour
 *     { ids: ['liver', 'pancreas'], color: 'orange', label: 'Make digestive juices' },      // tone: 'soft' for a tint
 *   ],
 *   dim: true,                     // what happens to shown structures that are in no group: true (greyed, the default when there are
 *                                  //   groups) | false (natural colours) | 'ghost' (faint) | 'hide'
 *   ghost: ['ribs', 'muscles'],    // draw these see-through
 *   focus: ['pancreas'],           // these are uncovered completely, in every mode: whatever lies in front of them turns see-through,
 *                                  //   even if it is pickable, labelled or in a group, and a tap on them reaches them through it.
 *                                  //   (Without `focus` the same is done, less thoroughly and only by non-subjects, for group members, labelled
 *                                  //   structures, `pickable` lists, the structure being explored and the revealed answer)
 *   plain: false,                  // true: no natural colours, every structure in the surface colour
 *   legend: true,                  // list labelled groups and flows under the figure (default: true when any has a label)
 *   labels: ['liver', 'stomach'],  // names with leader lines: ids, aliases or systems; true (the group members); 'all' (everything shown);
 *                                  //   objects { id: 'liver', text: 'Liver (1.5 kg)', column: 'left' | 'right' } / { at: [200, 370], text: 'Navel' }
 *   labelStyle: 'auto',            // 'auto': names in columns beside the figure when they fit; otherwise numbers on the figure with a
 *                                  //   key underneath (the figure then takes the room of the columns) | 'side' | 'key'
 *   naming: 'plain',               // 'plain' (Windpipe) | 'scientific' (Trachea) | 'both' (Windpipe (trachea))
 *   notes: { liver: '…' },         // replace the one-line note shown when a structure is explored
 *
 *   // ---- things drawn on top
 *   markers: [                     // points: `at` is an anchor ('pulse-wrist', 'pulse-wrist:left'), a structure id or [x, y]
 *     { id: 'neck', at: 'pulse-neck', label: 'Neck pulse', color: 'red', shape: 'dot', labelPos: 'right', note: '…' },
 *   ],                             // shape: dot | ring | cross | square;  size: 's' | 'm' | 'l';  labelPos: right | left | top | bottom
 *   markerLabels: 'always',        // 'after': hidden until the step is answered (markers then carry letters A, B, C …)
 *   flows: [                       // arrows and moving dots along a path through structures, anchors and points
 *     { path: ['inferior-vena-cava', 'heart', 'right-lung'], color: 'blue', label: 'Oxygen-poor blood', note: '…',
 *       width: 4, dots: true, arrows: true, speed: 1, dashed: false, step: 1 },
 *   ],
 *   stepThrough: false,            // true: flows appear one step at a time, with Back and Next controls (each flow is a step
 *                                  //   unless flows share a `step` number)
 *
 *   // ---- interaction
 *   mode: 'view',                  // 'view' | 'explore' | 'pick' | 'pickMany' | 'pickMarker' | 'pickMarkers' | 'place'
 *   names: true,                   // hovering or tapping shows names. Default: true in 'view' and 'explore', FALSE in the other modes,
 *                                  //   so that a quiz does not give its answer away. Names appear once the step is answered.
 *   pickable: ['digestive'],       // pick modes and explore: which structures (or marker ids) can be chosen. Default: all that are shown
 *   max: 3,                        // pickMany / pickMarkers: at most this many
 *   pickColor: 'yellow',
 *   answer: 'liver',               // what to show when the step is over: id(s) for pick modes, marker id(s) for marker modes
 *   reveal: true,                  // false: show nothing extra when the widget becomes read-only
 *   pin: { label: 'Your hands', color: 'red', start: [200, 420] },     // place mode: the marker (start: where it waits, as `at` below)
 *   target: 'chest-centre',        // place mode: where the marker belongs (an anchor, a structure id or [x, y]) …
 *   targets: [{ id: 'wrist', at: 'pulse-wrist', label: 'wrist' }],     // … or several candidates
 *   zoom: true,                    // zoom buttons, pinch, Ctrl + wheel, drag to pan. Default: on for the whole-figure views
 *   toggles: ['skeleton', 'muscles'],   // buttons that switch systems, aliases or ids on and off (true: the seven main systems);
 *                                  //   they keep working after the answer
 *   static: false,                 // true: a picture, nothing reacts (always so inside an answer option)
 *   aspect: 1.2, maxWidth: 520,    // proportions and largest width of the drawing (defaults fit the view)
 *   debug: false,                  // true: draw a coordinate grid and the anchor points (for authors)
 *   alt: 'The digestive system',
 * }
 *
 * State (what `check(state)` receives; `solution` needs only the first field of each)
 *   view         {}   (with stepThrough: { step, steps, stepsDone })
 *   explore      { selected: 'liver' | null, seen: ['liver', 'stomach'] (in the order first seen), seenCount: 2 }
 *   pick         { picked: 'liver' | null, name: 'Liver' | null, nameThe: 'the liver' | null, side: 'left' | 'right' | null }
 *   pickMany     { picked: ['liver', 'pancreas'] (sorted), count: 2 }
 *   pickMarker   { picked: 'neck' | null }
 *   pickMarkers  { picked: ['a', 'c'] (sorted), count: 2 }
 *   place        { at: [x, y], placed: true, structure: 'breastbone' | null (the topmost visible structure under the marker),
 *                  region: 'chest' | null, side: 'left' | 'right' | null,
 *                  distance: 2.4, nearest: 'target', distances: { target: 2.4 } }      (the last three only with target / targets)
 *                `distance` is in centimetres on an adult about 170 cm tall in the body, back and head views, and in per cent of
 *                the picture's width in the schematic views (heart, lungs-detail, skin, cell).
 *
 * setState accepts the same shapes ({ picked }, { selected, seen }, { at } where `at` may also be an anchor name, { step })
 * and, in any mode, { reveal: true | false } to show or hide names and the `answer` without freezing the widget.
 *
 * Helpers for lesson files (import them from this module):
 *   structureName('windpipe') → 'Windpipe'      structureName('windpipe', 'scientific') → 'Trachea'
 *   structureNameThe('liver') → 'the liver'     (the name as it reads inside a sentence)
 *   structureInfo('liver') → { id, name, scientific, system, systems, side, note, kind, layer }
 *   structureIds('digestive') → ['appendix', …] anchorIds('circulatory') → ['pulse-arm', …]    expandIds(['lungs', 'heart'])
 *   loadView('head') → a promise, for code that needs the geometry: structureAt('torso', [160, 306]) → 'liver',
 *   anchorPoint('body', 'chest-centre') → [200, 262]
 *
 * Artwork: original, drawn in code. assets/body/draw.js turns a few points per structure into smooth outlines;
 * structures.js holds names, systems and notes; front.js and back.js hold the whole figure and are loaded with this
 * module; head.js, heart.js, lungs.js, skin.js and cell.js are imported the first time their view is used.
 */
import { frame, handle, button, hue, s, h, cx, clamp, icon, addStyles, HUES } from './kit.js';
import { play } from '../core/audio.js';
import { STRUCTURES, ANCHORS, ALIASES, SYSTEMS, LAYERS, TONES } from '../../assets/body/structures.js';
import { buildShape, onShape, nearShape, route, lengthOf, pointAlong } from '../../assets/body/draw.js';
import FRONT from '../../assets/body/front.js';
import BACK from '../../assets/body/back.js';

addStyles('body-map', `
  .widget-body-map { --bm-skin: var(--gray-soft); --bm-bone: var(--surface); --bm-dim: var(--sunken); --bm-u: 1; }
  :root[data-theme='dark'] .widget-body-map { --bm-bone: var(--gray-text); --bm-dim: var(--hair); }
  .widget-body-map .w-canvas { background: var(--surface); }
  .widget-body-map .w-canvas svg.is-zoomed { touch-action: none; cursor: grab; }
  .widget-body-map .w-canvas svg.is-panning { cursor: grabbing; }
  .widget-body-map .w-canvas svg.is-pointing { cursor: pointer; }
  .widget-body-map .bm-art { --bm-px: 1; }
  .widget-body-map .bm-s { --b: 1; --o: var(--ink); }
  .widget-body-map .bm-f { fill: var(--f); stroke: var(--o); stroke-width: calc(var(--bm-px) * var(--b) * 4px); stroke-linejoin: round; paint-order: stroke; }
  .widget-body-map .bm-tu { fill: none; stroke: var(--o); stroke-linecap: round; stroke-linejoin: round; stroke-width: calc(max(var(--w) * 1px, var(--bm-px) * 2px) + var(--bm-px) * var(--b) * 3.2px); }
  .widget-body-map .bm-to { fill: none; stroke: var(--f); stroke-linecap: round; stroke-linejoin: round; stroke-width: max(var(--w) * 1px, var(--bm-px) * 2px); }
  .widget-body-map .bm-i { fill: none; stroke: var(--o); stroke-width: calc(var(--bm-px) * 1.2px); stroke-linecap: round; stroke-linejoin: round; opacity: 0.55; }
  .widget-body-map .bm-s.is-flat path { --f: inherit !important; }
  .widget-body-map .bm-s.is-dim { --o: var(--ink-3); }
  .widget-body-map .bm-s.is-dim .bm-i { opacity: 0.3; }
  .widget-body-map .bm-s.is-ghost { opacity: 0.22; }
  .widget-body-map .bm-s.is-ghost.is-on { opacity: 0.5; }
  .widget-body-map .bm-s.is-hot { --b: 1.6; }
  .widget-body-map .bm-s.is-on { --b: 1.9; }
  .widget-body-map.is-small .bm-s { --b: 0.7; }
  .widget-body-map .bm-mark { fill: none; stroke-linejoin: round; stroke-linecap: round; pointer-events: none; }
  .widget-body-map .bm-mark.is-answer { stroke: var(--green-text); stroke-dasharray: calc(var(--bm-px) * 7px) calc(var(--bm-px) * 4px); fill: var(--green); fill-opacity: 0.3; }
  .widget-body-map .bm-mark.is-answer.is-picked { fill: none; }
  .widget-body-map .bm-mark.is-focus { stroke: var(--focus); }
  .widget-body-map .bm-window { fill: none; stroke: var(--hair); }
  .widget-body-map .bm-flow path { fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .widget-body-map .bm-flow .bm-flow-halo { stroke: var(--ink); stroke-width: calc(var(--bm-px) * (var(--fw) + 2.6) * 1px); }
  .widget-body-map .bm-flow .bm-flow-line { stroke: var(--c); stroke-width: calc(var(--bm-px) * var(--fw) * 1px); }
  .widget-body-map .bm-flow.is-dashed .bm-flow-halo, .widget-body-map .bm-flow.is-dashed .bm-flow-line { stroke-dasharray: calc(var(--bm-px) * 8px) calc(var(--bm-px) * 9px); }
  .widget-body-map .bm-flow .bm-flow-dots { stroke: var(--surface); stroke-width: calc(var(--bm-px) * var(--fw) * 0.6px); stroke-dasharray: 0 calc(var(--bm-px) * 16px); animation: bm-flow var(--dur, 1.2s) linear infinite; }
  .widget-body-map .bm-flow .bm-flow-arrows { stroke: none; stroke-width: calc(var(--bm-px) * var(--fw) * 1px); }
  .widget-body-map .bm-flow.is-past { opacity: 0.5; }
  .widget-body-map .bm-flow.is-past .bm-flow-dots { display: none; }
  @keyframes bm-flow { to { stroke-dashoffset: calc(var(--bm-px) * -16px); } }
  .widget-body-map .bm-over { pointer-events: none; }
  .widget-body-map .bm-over .bm-pin { pointer-events: auto; }
  .widget-body-map .bm-lead { fill: none; stroke: var(--ink-2); stroke-linecap: round; stroke-linejoin: round; }
  .widget-body-map .bm-lead-dot { fill: var(--ink); stroke: var(--surface); }
  .widget-body-map .w-canvas text.bm-t { font-size: calc(var(--bm-u) * 12px); stroke-width: calc(var(--bm-u) * 3px); font-weight: 700; }
  .widget-body-map .w-canvas text.bm-t-b { font-size: calc(var(--bm-u) * 12.5px); stroke-width: calc(var(--bm-u) * 3.4px); font-weight: 800; }
  .widget-body-map .w-canvas text.bm-t-badge { font-size: calc(var(--bm-u) * 11px); stroke: none; font-weight: 800; fill: var(--surface); }
  .widget-body-map .w-canvas text.bm-t-grid { font-size: calc(var(--bm-u) * 9px); stroke: none; font-weight: 600; fill: var(--blue-text); }
  .widget-body-map .bm-grid { stroke: var(--blue); opacity: 0.3; }
  .widget-body-map .bm-badge { fill: var(--ink); stroke: var(--surface); }
  .widget-body-map .bm-dot { stroke: var(--edge-strong); stroke-linejoin: round; stroke-linecap: round; }
  .widget-body-map .bm-dot.is-ring, .widget-body-map .bm-dot.is-cross { fill: var(--surface); stroke: var(--c); }
  .widget-body-map .bm-dot-ring { fill: none; stroke: var(--ink); }
  .widget-body-map .bm-dot-answer { fill: none; stroke: var(--green-text); }
  .widget-body-map .bm-cursor { fill: none; stroke: var(--focus); }
  .widget-body-map .bm-keys { outline: none; }
  .widget-body-map .bm-pin .w-handle-dot, .widget-body-map .bm-pin .w-handle-halo { display: none; }
  .widget-body-map .bm-pin-body { stroke: var(--edge-strong); stroke-linejoin: round; }
  .widget-body-map .bm-pin.is-loose .bm-pin-body { stroke-dasharray: 3 2; }
  .widget-body-map .bm-pin:focus-visible .bm-pin-body { stroke: var(--focus); stroke-width: 3.5; }
  .widget-body-map .bm-pin-hole { fill: var(--surface); }
  .widget-body-map .bm-target { fill: none; stroke: var(--green-text); }
  .widget-body-map .bm-gap { fill: none; stroke: var(--ink); }
  .widget-body-map.is-readonly .bm-pin { pointer-events: none; }
  .widget-body-map .bm-tip {
    position: absolute; z-index: 2; pointer-events: none; max-width: 80%; padding: 2px 9px; border-radius: 8px;
    background: var(--ink); color: var(--paper); font-size: var(--fs-sm); font-weight: 700; line-height: 1.35; white-space: nowrap;
    transform: translate(-50%, calc(-100% - 10px));
  }
  .widget-body-map .bm-tip.is-left { transform: translate(-8%, calc(-100% - 10px)); }
  .widget-body-map .bm-tip.is-right { transform: translate(-92%, calc(-100% - 10px)); }
  .widget-body-map .bm-tip.is-below { transform: translate(-50%, 14px); }
  .widget-body-map .bm-tip[hidden] { display: none; }
  .widget-body-map .bm-zoom { position: absolute; z-index: 1; left: 8px; bottom: 8px; display: flex; gap: 4px; }
  .widget-body-map .bm-zoom [role=button], .widget-body-map .bm-steps [role=button] {
    position: relative; box-sizing: border-box; width: 36px; height: 36px; padding: 0; display: grid; place-items: center; cursor: pointer;
    user-select: none; -webkit-user-select: none; touch-action: manipulation;
    border: var(--bw) solid var(--edge); border-radius: 10px; background: var(--surface); color: var(--ink);
  }
  .widget-body-map .bm-zoom [role=button]::before, .widget-body-map .bm-steps [role=button]::before { content: ''; position: absolute; inset: -4px; }
  .widget-body-map [role=button]:hover { background: var(--sunken); }
  .widget-body-map [role=button]:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; }
  .widget-body-map [role=button][aria-disabled=true] { opacity: 0.4; cursor: default; }
  .widget-body-map [role=button][hidden] { display: none; }
  @container wcanvas (max-width: 420px) {
    .widget-body-map .bm-zoom { left: 6px; bottom: 6px; gap: 6px; flex-direction: column-reverse; }
    .widget-body-map .bm-zoom [role=button] { width: 32px; height: 32px; border-radius: 9px; }
  }
  .widget-body-map .bm-status { min-height: 1.5em; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-body-map .bm-status:empty { display: none; }
  .widget-body-map .bm-info { min-height: 4.6em; padding: var(--s2) var(--s3); border: var(--bw) solid var(--hair); border-radius: var(--r); background: var(--surface); font-size: var(--fs-sm); line-height: 1.4; }
  .widget-body-map .bm-info b { font-size: var(--fs-md); }
  .widget-body-map .bm-info i { color: var(--ink-2); }
  .widget-body-map .bm-info p { margin: 2px 0 0; }
  .widget-body-map .bm-info .bm-info-more { color: var(--ink-3); font-weight: 600; }
  .widget-body-map .bm-steps { display: flex; align-items: center; justify-content: center; gap: var(--s3); font-size: var(--fs-sm); font-weight: 700; }
  .widget-body-map .bm-steps-text { flex: 1 1 auto; min-width: 0; text-align: center; }
  .widget-body-map .bm-steps-text small { display: block; font-weight: 600; color: var(--ink-2); }
  .widget-body-map .bm-toggles { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-body-map .bm-toggles [role=button] {
    display: inline-flex; align-items: center; gap: 0.35rem; min-height: 34px; padding: 0.2rem 0.75rem; cursor: pointer; user-select: none; -webkit-user-select: none;
    border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--surface); color: var(--ink); font-size: var(--fs-sm); font-weight: 700; touch-action: manipulation;
  }
  .widget-body-map .bm-toggles [role=button][aria-pressed=true] { background: var(--ink); color: var(--paper); }
  .widget-body-map .bm-key { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px var(--s4); margin: 0; padding: 0; list-style: none; font-size: var(--fs-sm); font-weight: 700; }
  .widget-body-map .bm-key li { display: inline-flex; align-items: baseline; gap: 0.4rem; }
  .widget-body-map .bm-key b { display: inline-grid; place-items: center; min-width: 1.45em; height: 1.45em; border-radius: 999px; background: var(--ink); color: var(--surface); font-size: 0.8em; }
  .widget-body-map .bm-key[hidden] { display: none; }
  .widget-body-map .w-legend-item i.is-line { height: 0; border-width: 3px 0 0; border-radius: 0; width: 18px; background: none; }
`);

/* ====================================================================== tables */

const W = 600;
const MODES = ['view', 'explore', 'pick', 'pickMany', 'pickMarker', 'pickMarkers', 'place'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const round = (v, places = 1) => { const p = 10 ** places; const r = Math.round(v * p) / p; return Object.is(r, -0) ? 0 : r; };
const f1 = (v) => round(v, 1);
const listText = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const colour = (name, fallback) => (HUES.includes(name) ? name : fallback);

/**
 * The views: which drawing each one uses, the part of it that is shown ([x0, y0, x1, y1] in the drawing's own
 * coordinates) and what is switched on when the spec has no `show`.
 */
export const VIEWS = {
  body: { art: 'front', box: [8, 16, 392, 894], show: ['organs'], label: 'The human body, seen from the front', zoom: true },
  torso: { art: 'front', box: [96, 150, 304, 500], show: ['organs'], label: 'The chest and abdomen, seen from the front', zoom: true },
  chest: { art: 'front', box: [108, 150, 292, 330], show: ['organs'], label: 'The chest, seen from the front', zoom: true },
  abdomen: { art: 'front', box: [112, 268, 288, 500], show: ['organs'], label: 'The abdomen, seen from the front', zoom: true },
  leg: { art: 'front', box: [96, 415, 304, 894], show: ['skeleton'], label: 'The legs, seen from the front', zoom: true },
  back: { art: 'back', box: [8, 16, 392, 894], show: ['skeleton'], label: 'The human body, seen from behind', zoom: true },
  'back-torso': { art: 'back', box: [96, 150, 304, 500], show: ['skeleton'], label: 'The back, seen from behind', zoom: true },
  head: { art: 'head', box: [30, 8, 390, 446], show: 'all', label: 'The head and neck from the side, cut open down the middle' },
  heart: { art: 'heart', box: [10, 4, 450, 428], show: 'all', label: 'The heart opened up: four chambers, four valves and the great vessels' },
  'lungs-detail': { art: 'lungs', box: [14, 2, 478, 328], show: 'all', label: 'The airways of the lungs, with one cluster of air sacs enlarged' },
  skin: { art: 'skin', box: [14, 8, 446, 366], show: 'all', label: 'A block of skin, cut through' },
  cell: { art: 'cell', box: [16, 12, 426, 370], show: 'all', label: 'A cell, cut open' },
};

const LOADERS = {
  head: () => import('../../assets/body/head.js'),
  heart: () => import('../../assets/body/heart.js'),
  lungs: () => import('../../assets/body/lungs.js'),
  skin: () => import('../../assets/body/skin.js'),
  cell: () => import('../../assets/body/cell.js'),
};
const RAW = { front: FRONT, back: BACK };
const ART = {};
const PENDING = {};

/**
 * One drawing, ready for use. Path strings, hit polygons and sample points are built once per structure, the first
 * time something asks for them: a figure that shows the digestive system never pays for the skeleton.
 */
const BUILT = ['parts', 'fills', 'tubes', 'inks', 'box', 'samples', 'at', 'atSide', 'sides', 'line'];
function prepare(mod) {
  const shapes = mod.shapes.map((def, z) => {
    let b = null;
    let grip = -1;
    const built = () => b || (b = buildShape(def));
    const sh = { id: def.id, z, deco: def.id[0] === '_', opts: def };
    for (const key of BUILT) Object.defineProperty(sh, key, { enumerable: true, get: () => built()[key] });
    // how much there is to get hold of: the narrow side of the biggest piece, or the thickness of a line
    Object.defineProperty(sh, 'grip', {
      enumerable: true,
      get() {
        if (grip < 0) { grip = 0; for (const p of built().parts) grip = Math.max(grip, p.k === 'fill' ? Math.min(p.box[2] - p.box[0], p.box[3] - p.box[1]) : p.w); }
        return grip;
      },
    });
    return sh;
  });
  return { id: mod.id, width: mod.width, height: mod.height, cm: mod.cm || 0, facing: mod.facing, region: mod.region || (() => null), anchors: mod.anchors || {}, shapes, byId: new Map(shapes.map((sh) => [sh.id, sh])), cover: new Map() };
}
function artNow(name) {
  if (!ART[name] && RAW[name]) ART[name] = prepare(RAW[name]);
  return ART[name] || null;
}
function loadArt(name) {
  if (artNow(name)) return Promise.resolve(ART[name]);
  if (!PENDING[name]) PENDING[name] = LOADERS[name]().then((m) => { RAW[name] = m.default; return artNow(name); });
  return PENDING[name];
}

/** The names of all views. */
export const viewNames = () => Object.keys(VIEWS);

/** Load the drawing a view needs. Resolves when structureAt(), anchorPoint() and the widget can use it at once. */
export function loadView(view) {
  if (!has(VIEWS, view)) return Promise.reject(new Error(`body-map has no view "${view}"`));
  return loadArt(VIEWS[view].art).then(() => undefined);
}

const isStructure = (id) => typeof id === 'string' && has(STRUCTURES, id);
const isAnchor = (id) => typeof id === 'string' && has(ANCHORS, id);
const systemsOf = (id) => (isStructure(id) ? STRUCTURES[id][2] : isAnchor(id) ? ANCHORS[id][2] : '').split(' ').filter(Boolean);

/**
 * The name of a structure or an anchor point: structureName('windpipe') → 'Windpipe'.
 * style 'scientific' → 'Trachea' (the plain name where there is no other), 'both' → 'Windpipe (trachea)'.
 * Unknown ids give ''.
 */
export function structureName(id, style = 'plain') {
  const row = isStructure(id) ? STRUCTURES[id] : isAnchor(id) ? ANCHORS[id] : null;
  if (!row) return '';
  if (style === 'scientific') return row[1] ? row[1][0].toUpperCase() + row[1].slice(1) : row[0];
  if (style === 'both') return row[1] ? `${row[0]} (${row[1]})` : row[0];
  return row[0];
}

/** Names that keep their capital in the middle of a sentence. */
const PROPER = new Set(['golgi']);
/** The name as it reads inside a sentence: structureNameThe('liver') → 'the liver'. Unknown ids give ''. */
export function structureNameThe(id, style = 'plain') {
  const name = structureName(id, style);
  if (!name) return '';
  return `the ${PROPER.has(id) ? name : name[0].toLowerCase() + name.slice(1)}`;
}

/** Is this structure drawn on both sides of the body? (from the two whole-figure drawings) */
function isPaired(id) {
  for (const mod of [FRONT, BACK]) {
    const def = mod.shapes.find((sh) => sh.id === id);
    if (def) { const solid = def.parts.filter((p) => p.k !== 'ink'); return solid.every((p) => p.side) && solid.some((p) => p.side === 'left') && solid.some((p) => p.side === 'right'); }
  }
  return false;
}

/**
 * Everything the tables know about a structure or an anchor point, or null:
 * { id, kind: 'structure' | 'anchor', name, scientific, system, systems, side, note, layer }
 * side: 'left' | 'right' (the person's own) for one of a pair, 'both' for something drawn on both sides, otherwise null.
 */
export function structureInfo(id) {
  const structure = isStructure(id);
  if (!structure && !isAnchor(id)) return null;
  const row = structure ? STRUCTURES[id] : ANCHORS[id];
  const systems = systemsOf(id);
  const side = /^left-/.test(id) ? 'left' : /^right-/.test(id) ? 'right' : (structure ? isPaired(id) : !!row[4]) ? 'both' : null;
  return { id, kind: structure ? 'structure' : 'anchor', name: row[0], scientific: row[1] || row[0].toLowerCase(), system: systems[0], systems, side, note: row[3], layer: LAYERS[id] || null };
}

/**
 * The structures of a system, sorted: structureIds('digestive'). Structures shared by two systems (the pancreas)
 * are in both. 'female' and 'male' give the two reproductive layers; no argument gives every structure.
 */
export function structureIds(system) {
  if (system == null || system === 'all') return Object.keys(STRUCTURES).sort();
  if (system === 'female' || system === 'male') return Object.keys(LAYERS).filter((id) => LAYERS[id] === system).sort();
  return Object.keys(STRUCTURES).filter((id) => systemsOf(id).includes(system)).sort();
}

/** The named points (joints, pulse points, places on the skin), sorted; optionally those of one system. */
export function anchorIds(system) {
  return Object.keys(ANCHORS).filter((id) => !system || systemsOf(id).includes(system)).sort();
}

/** The names of the systems: { digestive: 'Digestive system', … }. */
export const systemNames = () => ({ ...SYSTEMS });

/**
 * Systems, aliases and ids, in any mix → a list of structure ids, in the order given and without repeats.
 * A system never brings in the reproductive layers: those appear only when 'female', 'male' or one of their
 * structures is named.
 */
export function expandIds(list) {
  const out = [];
  const add = (id) => { if (!out.includes(id)) out.push(id); };
  for (const item of list == null || list === false ? [] : [].concat(list)) {
    if (typeof item !== 'string') continue;
    if (has(ALIASES, item)) ALIASES[item].forEach(add);
    else if (isStructure(item)) add(item);
    else if (item === 'all') Object.keys(STRUCTURES).filter((id) => !LAYERS[id]).forEach(add);
    else if (has(SYSTEMS, item)) Object.keys(STRUCTURES).filter((id) => !LAYERS[id] && systemsOf(id).includes(item)).forEach(add);
  }
  return out;
}

/* ============================================================ geometry (pure) */

/** How much of the structure `lower` the structure `upper` covers: a share from 0 to 1 (remembered per drawing). */
export function coverShare(art, upper, lower) {
  const key = `${upper}|${lower}`;
  if (art.cover.has(key)) return art.cover.get(key);
  const a = art.byId.get(upper);
  const b = art.byId.get(lower);
  let share = 0;
  if (a && b && b.samples.length && a.box[0] < b.box[2] && a.box[2] > b.box[0] && a.box[1] < b.box[3] && a.box[3] > b.box[1]) {
    let n = 0;
    for (const q of b.samples) if (onShape(a, q[0], q[1])) n++;
    share = n / b.samples.length;
  }
  art.cover.set(key, share);
  return share;
}
/** Does `upper` cover any part of `lower`? */
export const covers = (art, upper, lower) => coverShare(art, upper, lower) > 0;

/**
 * The sample points of a structure that nothing opaque hides: [[x, y, side], …].
 * `shown` is the set of ids being drawn, `ghost` those drawn see-through.
 */
export function visibleSamples(art, id, shown, ghost = null) {
  const sh = art.byId.get(id);
  if (!sh) return [];
  const b = sh.box;
  const above = [];
  for (let z = sh.z + 1; z < art.shapes.length; z++) {
    const u = art.shapes[z];
    if (u.deco || !shown.has(u.id) || (ghost && ghost.has(u.id))) continue;
    const ub = u.box;
    if (ub[0] < b[2] && ub[2] > b[0] && ub[1] < b[3] && ub[3] > b[1]) above.push(u);
  }
  if (!above.length) return sh.samples;
  const out = sh.samples.filter((q) => !above.some((u) => onShape(u, q[0], q[1])));
  return out.length === sh.samples.length ? sh.samples : out;
}

/** The ids of the shown structures under a point, the nearest to the viewer first. */
export function stackAt(art, x, y, shown) {
  const out = [];
  for (let i = art.shapes.length - 1; i >= 0; i--) {
    const sh = art.shapes[i];
    if (!sh.deco && shown.has(sh.id) && onShape(sh, x, y)) out.push(sh.id);
  }
  return out;
}

/**
 * What a tap at (x, y) chooses: { id, side } or null.
 *   shown     ids being drawn
 *   pickable  ids that can be chosen (default: everything shown but the skin)
 *   ghost     ids drawn see-through: they hide nothing
 *   first     ids the author asked to be reachable (`focus`): under the finger, one of these beats the see-through
 *             structures in front of it. Empty or missing: nothing of the kind happens.
 *   reach     how far a tap may miss a small structure, in drawing units
 *   small     structures whose narrow side (or line thickness) is below this get that help
 * The topmost visible pickable structure wins. Something opaque that cannot be picked hides what is behind it.
 * A `first` structure is the exception: it wins wherever the finger is on it, as long as all that lies in front is see-through.
 * A small structure within reach beats whatever is under the finger unless it lies behind it; when the finger is on
 * something large, the reach is a little under half.
 */
export function hitTest(art, x, y, { shown, pickable = null, ghost = null, first = null, reach = 0, small = 0 } = {}) {
  const can = (sh) => !sh.deco && shown.has(sh.id) && (pickable ? pickable.has(sh.id) : sh.id !== 'skin');
  const wanted = first && first.size ? first : null;
  let exact = null;
  let wall = -1;                       // the z of whatever stops the eye at this point
  for (let i = art.shapes.length - 1; i >= 0; i--) {
    const sh = art.shapes[i];
    if (sh.deco || !shown.has(sh.id) || !onShape(sh, x, y)) continue;
    if (can(sh)) {
      // the finger is on something the author asked to be reachable: that settles it
      if (wanted && wanted.has(sh.id)) return { id: sh.id, side: nearShape(sh, x, y).side };
      if (!exact) { exact = sh; wall = sh.z; }
      if (wanted && ghost && ghost.has(sh.id)) continue;       // see-through: something asked for may lie behind it
      break;
    }
    if (sh.id === 'skin' || (ghost && ghost.has(sh.id))) continue;
    if (!exact) wall = sh.z;
    break;
  }
  if (reach > 0) {
    // a finger that is squarely on something large only just concedes to a small neighbour
    const within = exact && exact.grip >= small ? reach * 0.45 : reach;
    let best = null;
    let bestD = Infinity;
    for (let i = art.shapes.length - 1; i >= 0; i--) {
      const sh = art.shapes[i];
      if (sh.z <= wall) {
        if (!wanted) break;
        if (!wanted.has(sh.id)) continue;     // behind the wall only what was asked for can still be reached
      }
      if (!can(sh) || sh.grip >= small) continue;
      const b = sh.box;
      if (x < b[0] - reach || x > b[2] + reach || y < b[1] - reach || y > b[3] + reach) continue;
      const near = nearShape(sh, x, y);
      if (near.d <= within && near.d < bestD) { best = { id: sh.id, side: near.side }; bestD = near.d; }
    }
    if (best) return best;
  }
  return exact ? { id: exact.id, side: nearShape(exact, x, y).side } : null;
}

const SIDE_REF = /^(.+):(left|right)$/;
/** Is the structure a pair, one on each side of the body (and nothing in the middle)? */
const twoSided = (sh) => sh.sides.length === 2 && sh.parts.every((p) => p.side);
/**
 * The point(s) a reference stands for in a drawing: { points: [[x, y], …], id, side } or null.
 * ref: [x, y] | 'chest-centre' | 'pulse-wrist' (both sides) | 'pulse-wrist:left' | a structure id ('liver', 'femur:right').
 */
export function resolvePoint(art, ref) {
  if (Array.isArray(ref) && ref.length >= 2 && Number.isFinite(Number(ref[0])) && Number.isFinite(Number(ref[1]))) return { points: [[Number(ref[0]), Number(ref[1])]], id: null, side: null };
  if (typeof ref !== 'string') return null;
  const m = SIDE_REF.exec(ref);
  const id = m ? m[1] : ref;
  const side = m ? m[2] : null;
  if (has(art.anchors, id)) {
    const a = art.anchors[id];
    if (Array.isArray(a)) return { points: [a.slice(0, 2)], id, side: null };
    if (side) return a[side] ? { points: [a[side].slice(0, 2)], id, side } : null;
    return { points: [a.left, a.right].filter(Boolean).map((p) => p.slice(0, 2)), id, side: null };
  }
  const sh = art.byId.get(id);
  if (sh && !sh.deco) {
    if (side) return sh.atSide[side] ? { points: [sh.atSide[side]], id, side } : null;
    if (twoSided(sh)) return { points: [sh.atSide.left, sh.atSide.right], id, side: null };
    return { points: [sh.at], id, side: null };
  }
  return null;
}

/** One point for a reference (the person's left where there are two), or null. */
function onePoint(art, ref) {
  const r = resolvePoint(art, ref);
  return r ? r.points[0] : null;
}

/**
 * The way-points of a flow: structures with a course of their own (the food pipe, the aorta, the gut) are followed
 * along it, in whichever direction joins up with the stops before and after; everything else is a single point.
 */
export function flowPoints(art, path) {
  const stops = [];
  for (const ref of Array.isArray(path) ? path : []) {
    const m = typeof ref === 'string' ? SIDE_REF.exec(ref) : null;
    const sh = typeof ref === 'string' ? art.byId.get(m ? m[1] : ref) : null;
    if (sh && sh.opts.flow && !m) stops.push({ line: sh.opts.flow });
    else { const p = onePoint(art, ref); if (p) stops.push({ at: p }); }
  }
  const out = [];
  const push = (p) => { const last = out[out.length - 1]; if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 0.5) out.push([p[0], p[1]]); };
  stops.forEach((stop, i) => {
    if (stop.at) { push(stop.at); return; }
    const line = stop.line;
    const first = line[0];
    const end = line[line.length - 1];
    const prev = out[out.length - 1] || null;
    const nextStop = stops[i + 1];
    const next = nextStop ? (nextStop.at || null) : null;
    let backwards = false;
    if (prev) backwards = Math.hypot(prev[0] - end[0], prev[1] - end[1]) < Math.hypot(prev[0] - first[0], prev[1] - first[1]);
    else if (next) backwards = Math.hypot(next[0] - first[0], next[1] - first[1]) < Math.hypot(next[0] - end[0], next[1] - end[1]);
    else if (nextStop && nextStop.line) {
      const a = nextStop.line[0];
      const b = nextStop.line[nextStop.line.length - 1];
      const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
      backwards = Math.min(d(first, a), d(first, b)) < Math.min(d(end, a), d(end, b));
    }
    (backwards ? line.slice().reverse() : line).forEach(push);
  });
  return out;
}

/**
 * The facts of place mode for a marker at `at`: what is under it and how far it is from the targets.
 *   → { structure, region, side, distance, nearest, distances }   (the last three only with targets)
 */
export function placeFacts(art, at, { shown, ghost = null, targets = [] } = {}) {
  const hit = hitTest(art, at[0], at[1], { shown, ghost });
  const where = art.region(at[0], at[1]);
  const out = { structure: hit ? hit.id : null, region: where ? where.region : null, side: where ? where.side : hit ? hit.side : null };
  if (targets.length) {
    out.distances = {};
    let best = Infinity;
    for (const t of targets) {
      let d = Infinity;
      for (const p of t.points) d = Math.min(d, Math.hypot(p[0] - at[0], p[1] - at[1]));
      const shownAs = art.cm ? round(d * art.cm, 1) : round((d / art.width) * 100, 1);
      out.distances[t.id] = shownAs;
      if (d < best) { best = d; out.nearest = t.id; out.distance = shownAs; }
    }
  }
  return out;
}

/** The structure under a point of a view (the view must be loaded: see loadView). `show` as in the spec. */
export function structureAt(view, point, { show = null } = {}) {
  const V = VIEWS[view];
  const art = V ? artNow(V.art) : null;
  if (!art || !Array.isArray(point)) return null;
  const hit = hitTest(art, point[0], point[1], { shown: shownSet(art, V, show, null) });
  return hit ? hit.id : null;
}

/** Where an anchor or a structure's label point is in a view: [x, y] or null (the view must be loaded). */
export function anchorPoint(view, ref) {
  const V = VIEWS[view];
  const art = V ? artNow(V.art) : null;
  return art ? onePoint(art, ref) : null;
}

/** The ids drawn for a `show` / `hide` pair (the outline is always there unless hidden). */
function shownSet(art, V, show, hide, extra = []) {
  const want = show == null ? V.show : show;
  const ids = new Set(want === 'all' || (Array.isArray(want) && want.includes('all')) ? art.shapes.filter((sh) => !sh.deco && !LAYERS[sh.id]).map((sh) => sh.id) : expandIds(want));
  if (Array.isArray(want)) for (const id of expandIds(want.filter((item) => item !== 'all'))) ids.add(id);
  ids.add('skin');
  for (const id of extra) ids.add(id);
  for (const id of expandIds(hide)) ids.delete(id);
  return new Set(Array.from(ids).filter((id) => art.byId.has(id)));
}

/* ============================================================== labels (pure) */

/** Break a name into lines of at most `maxChars` characters (a longer word gets a line to itself). */
export function wrapText(text, maxChars) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= maxChars) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

const WIDE = new Set('mwMW');
const SLIM = new Set('iljI.,:;\'|!');
const SLENDER = new Set('tfr()-/');
/**
 * A fair guess at the width of a piece of bold label text (a little on the generous side), without measuring it:
 * the widget lays its names out before it is in the page.
 */
export function textWidth(text, size) {
  let em = 0.2;
  for (const ch of String(text)) em += WIDE.has(ch) ? 0.86 : SLIM.has(ch) ? 0.28 : ch === ' ' ? 0.25 : SLENDER.has(ch) ? 0.38 : ch >= 'A' && ch <= 'Z' ? 0.68 : 0.56;
  return em * size;
}

/** Break a name into lines no wider than `width` at a font size (a word wider than that gets a line to itself). */
export function wrapToWidth(text, width, size) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if (textWidth(`${line} ${word}`, size) <= width) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Lay names out in two columns beside the figure, each joined to its structure by a leader line.
 *   items  [{ id, text, x, y, alt: [x, y] (the same structure on the other side of the body), column: 'left' | 'right' }]
 *   o      { W, H, win: [x0, y0, x1, y1] (where the figure is), unit (drawing units per CSS pixel), size (px), maxLines }
 * → { ok, labels: [{ id, column, lines, x, y (first baseline), cy, lh, anchor: 'end' | 'start', at: [x, y], leader: [[x, y] × 3] }] }
 * ok is false when a name is too wide for its column or a column is too full: the widget then numbers the structures.
 */
export function layoutLabels(items, o) {
  const { W, H, win, unit = 1, size = 12, maxLines = 3 } = o;
  const fs = size * unit;
  const lh = fs * 1.2;
  const gap = 9 * unit;
  const pad = 5 * unit;
  const space = 5 * unit;
  const mid = (win[0] + win[2]) / 2;
  const cols = { left: [], right: [] };
  const room = { left: win[0] - gap - pad, right: W - win[2] - gap - pad };
  const prep = (it, column) => {
    const lines = wrapToWidth(it.text, room[column], fs);
    const fits = lines.length > 0 && lines.length <= maxLines && lines.every((l) => textWidth(l, fs) <= room[column]);
    return { fits, lines, h: Math.max(1, lines.length) * lh };
  };
  let ok = true;
  const height = { left: 0, right: 0 };
  const put = (it, column, x, y) => {
    const m = prep(it, column);
    if (!m.fits) ok = false;
    cols[column].push({ id: it.id, text: it.text, column, ax: x, ay: y, lines: m.lines, h: m.h });
    height[column] += m.h + space;
  };
  const twoSided = [];
  for (const it of items) {
    if (it.alt && it.column !== 'left' && it.column !== 'right') { twoSided.push(it); continue; }
    let x = it.x;
    let y = it.y;
    const column = it.column === 'left' || it.column === 'right' ? it.column : x < mid ? 'left' : 'right';
    if (it.alt && (column === 'left') !== (x < mid)) { x = it.alt[0]; y = it.alt[1]; }
    put(it, column, x, y);
  }
  // something drawn on both sides is labelled in whichever column has more room
  for (const it of twoSided) {
    const column = height.left <= height.right ? 'left' : 'right';
    const useAlt = (column === 'left') !== (it.x < it.alt[0]);
    put(it, column, useAlt ? it.alt[0] : it.x, useAlt ? it.alt[1] : it.y);
  }
  // a column that is too full hands its innermost names to the other one
  const limit = H - 2 * pad;
  for (const [from, to] of [['left', 'right'], ['right', 'left']]) {
    while (height[from] - space > limit && cols[from].length > 1 && height[to] + cols[from][0].h < limit) {
      cols[from].sort((a, b) => Math.abs(a.ax - mid) - Math.abs(b.ax - mid));
      const moved = cols[from].shift();
      height[from] -= moved.h + space;
      const again = prep(moved, to);
      if (!again.fits) ok = false;
      cols[to].push({ ...moved, column: to, lines: again.lines, h: again.h });
      height[to] += again.h + space;
    }
  }
  const labels = [];
  for (const column of ['left', 'right']) {
    const list = cols[column].sort((a, b) => a.ay - b.ay || a.ax - b.ax);
    if (!list.length) continue;
    const top = pad;
    const bottom = H - pad;
    let prevEnd = top - space;
    for (const l of list) { l.cy = Math.max(l.ay, prevEnd + space + l.h / 2); prevEnd = l.cy + l.h / 2; }
    let nextStart = bottom + space;
    for (let i = list.length - 1; i >= 0; i--) { const l = list[i]; l.cy = Math.min(l.cy, nextStart - space - l.h / 2); nextStart = l.cy - l.h / 2; }
    if (list[0].cy - list[0].h / 2 < top - 0.5) ok = false;
    for (const l of list) {
      const tx = column === 'left' ? win[0] - gap : win[2] + gap;
      const edge = column === 'left' ? tx + 3 * unit : tx - 3 * unit;
      const elbow = column === 'left' ? Math.min(win[0] + 5 * unit, l.ax) : Math.max(win[2] - 5 * unit, l.ax);
      labels.push({
        id: l.id, column, lines: l.lines, lh, x: tx, cy: l.cy, y: l.cy - l.h / 2 + lh * 0.78, anchor: column === 'left' ? 'end' : 'start',
        at: [l.ax, l.ay], leader: [[edge, l.cy], [elbow, l.cy], [l.ax, l.ay]],
      });
    }
  }
  return { ok, labels };
}

/** Move points apart until none are closer than `min` (numbered badges that would sit on top of one another). */
export function spreadBadges(points, min, box = null, rounds = 16) {
  const out = points.map((p) => [p[0], p[1]]);
  for (let r = 0; r < rounds; r++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        let dx = out[j][0] - out[i][0];
        let dy = out[j][1] - out[i][1];
        let d = Math.hypot(dx, dy);
        if (d >= min) continue;
        if (d < 1e-6) { dx = 1; dy = (j % 2 ? 1 : -1) * 0.6; d = Math.hypot(dx, dy); }
        const push = (min - d) / 2 + 0.01;
        out[i][0] -= (dx / d) * push; out[i][1] -= (dy / d) * push;
        out[j][0] += (dx / d) * push; out[j][1] += (dy / d) * push;
        moved = true;
      }
    }
    if (box) for (const p of out) { p[0] = clamp(p[0], box[0], box[2]); p[1] = clamp(p[1], box[1], box[3]); }
    if (!moved) break;
  }
  return out;
}

/**
 * Where to write a marker's label so that it covers neither another marker nor another label.
 *   → { x, y, anchor, box }   `taken` (a list of boxes) grows by the box chosen.
 */
export function placeTag(at, text, o, taken) {
  const { unit = 1, size = 12, r = 6, prefer = 'right', frame: fr = null } = o;
  const w = textWidth(text, size * unit);
  const hgt = size * unit * 1.25;
  const d = r + 4 * unit;
  const options = {
    right: { x: at[0] + d, y: at[1] + hgt * 0.32, anchor: 'start', box: [at[0] + d, at[1] - hgt / 2, at[0] + d + w, at[1] + hgt / 2] },
    left: { x: at[0] - d, y: at[1] + hgt * 0.32, anchor: 'end', box: [at[0] - d - w, at[1] - hgt / 2, at[0] - d, at[1] + hgt / 2] },
    bottom: { x: at[0], y: at[1] + d + hgt * 0.8, anchor: 'middle', box: [at[0] - w / 2, at[1] + d, at[0] + w / 2, at[1] + d + hgt] },
    top: { x: at[0], y: at[1] - d - hgt * 0.2, anchor: 'middle', box: [at[0] - w / 2, at[1] - d - hgt, at[0] + w / 2, at[1] - d] },
  };
  const order = [prefer, 'right', 'left', 'bottom', 'top'].filter((v, i, all) => options[v] && all.indexOf(v) === i);
  const clash = (b) => taken.some((t) => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
  const outside = (b) => !!fr && (b[0] < fr[0] || b[2] > fr[2] || b[1] < fr[1] || b[3] > fr[3]);
  let pick = null;
  for (const name of order) if (!clash(options[name].box) && !outside(options[name].box)) { pick = options[name]; break; }
  if (!pick) for (const name of order) if (!outside(options[name].box)) { pick = options[name]; break; }
  if (!pick) pick = options[order[0]];
  taken.push(pick.box);
  return pick;
}

/* ================================================================ state (pure) */

/** A fresh state: what the learner has done so far. */
export const emptyState = () => ({ picked: [], side: null, selected: null, seen: [], at: null, placed: false, step: 1, reveal: null });

/**
 * What one action does to the state. Nothing is changed in place: → { state, said }.
 *   action  { type: 'tap', id, side } | { type: 'clear' } | { type: 'move', at: [x, y] } | { type: 'step', by: 1 | -1 }
 *   opts    { mode, max, steps }
 *   said    'chosen' | 'released' | 'full' | 'selected' | 'closed' | 'moved' | 'cleared' | 'stepped' | '' (nothing happened)
 */
export function reduce(state, action, opts = {}) {
  const { mode = 'view', max = 0, steps = 1 } = opts;
  const many = mode === 'pickMany' || mode === 'pickMarkers';
  const next = { ...state, picked: state.picked.slice(), seen: state.seen.slice() };
  if (action.type === 'step') {
    const to = clamp(state.step + (action.by || 0), 1, Math.max(1, steps));
    if (to === state.step) return { state, said: '' };
    next.step = to;
    next.stepMax = Math.max(state.stepMax || 1, to);
    return { state: next, said: 'stepped' };
  }
  if (action.type === 'clear') {
    if (!state.picked.length && !state.selected) return { state, said: '' };
    next.picked = []; next.side = null; next.selected = null;
    return { state: next, said: 'cleared' };
  }
  if (action.type === 'move') {
    if (mode !== 'place' || !Array.isArray(action.at)) return { state, said: '' };
    next.at = [round(action.at[0], 1), round(action.at[1], 1)];
    next.placed = true;
    return { state: next, said: 'moved' };
  }
  if (action.type !== 'tap' || !action.id) return { state, said: '' };
  const id = action.id;
  if (mode === 'explore' || mode === 'view') {
    if (state.selected === id && action.toggle !== false) { next.selected = null; return { state: next, said: 'closed' }; }
    next.selected = id;
    if (mode === 'explore' && !next.seen.includes(id)) next.seen.push(id);
    return { state: next, said: 'selected' };
  }
  if (mode === 'place') return { state, said: '' };
  const at = next.picked.indexOf(id);
  if (at >= 0) {
    next.picked.splice(at, 1);
    if (!many) next.side = null;
    return { state: next, said: 'released' };
  }
  if (many) {
    if (max && next.picked.length >= max) return { state, said: 'full' };
    next.picked.push(id);
    return { state: next, said: 'chosen' };
  }
  next.picked = [id];
  next.side = action.side || null;
  return { state: next, said: 'chosen' };
}

/**
 * Fold an author-written state (a `solution`, or anything passed to setState) into the state.
 *   valid(id) says whether an id can be picked or seen here; place(ref) turns `at` into [x, y] or null.
 */
export function mergeState(state, raw, opts = {}) {
  const { mode = 'view', valid = () => true, place = (v) => (Array.isArray(v) ? v : null), steps = 1 } = opts;
  if (raw == null) return state;
  const st = typeof raw === 'object' && !Array.isArray(raw) ? raw : { picked: raw, selected: raw, at: raw };
  const next = { ...state, picked: state.picked.slice(), seen: state.seen.slice() };
  const many = mode === 'pickMany' || mode === 'pickMarkers';
  const ids = (v) => Array.from(new Set([].concat(v == null ? [] : v).map(String).filter(valid)));
  if ('reveal' in st) next.reveal = st.reveal == null ? null : !!st.reveal;
  if (['pick', 'pickMany', 'pickMarker', 'pickMarkers'].includes(mode) && st.picked !== undefined) {
    next.picked = many ? ids(st.picked) : ids(st.picked).slice(0, 1);
    next.side = st.side === 'left' || st.side === 'right' ? st.side : null;
  }
  if (mode === 'explore' || mode === 'view') {
    if (st.seen !== undefined && mode === 'explore') { next.seen = ids(st.seen); next.selected = next.seen.length ? next.seen[next.seen.length - 1] : null; }
    if (st.selected !== undefined && typeof st.selected !== 'object') {
      next.selected = st.selected != null && valid(String(st.selected)) ? String(st.selected) : null;
      if (mode === 'explore' && next.selected && !next.seen.includes(next.selected)) next.seen.push(next.selected);
    } else if (st.selected === null) next.selected = null;
  }
  if (mode === 'place' && st.at !== undefined) {
    const p = st.at == null ? null : place(st.at);
    if (p) { next.at = [round(p[0], 1), round(p[1], 1)]; next.placed = true; } else if (st.at === null) next.placed = false;
  }
  if (st.step !== undefined && Number.isFinite(Number(st.step))) { next.step = clamp(Math.round(Number(st.step)), 1, Math.max(1, steps)); next.stepMax = Math.max(next.stepMax || 1, next.step); }
  return next;
}

/* ====================================================================== widget */

let seq = 0;
const SIZES = { s: 4, m: 5.5, l: 7.5 };

export default function create(spec, env) {
  const uid = `bm${++seq}`;
  const compact = !!env.compact;
  const isStatic = compact || !!spec.static;
  const viewName = has(VIEWS, spec.view) ? spec.view : 'body';
  const V = VIEWS[viewName];
  const mode = MODES.includes(spec.mode) && !isStatic ? spec.mode : 'view';
  const structMode = mode === 'pick' || mode === 'pickMany';
  const markerMode = mode === 'pickMarker' || mode === 'pickMarkers';
  const many = mode === 'pickMany' || mode === 'pickMarkers';
  const names = isStatic ? false : spec.names == null ? mode === 'view' || mode === 'explore' : !!spec.names;
  const naming = ['plain', 'scientific', 'both'].includes(spec.naming) ? spec.naming : 'plain';
  const nameOf = (id) => structureName(id, naming);
  const nameThe = (id) => structureNameThe(id, naming);
  const pickHue = colour(spec.pickColor, 'yellow');
  let readOnly = !!env.readOnly;
  let destroyed = false;
  let st = emptyState();
  const revealed = () => (st.reveal != null ? st.reveal : readOnly && spec.reveal !== false && mode !== 'view' && mode !== 'explore');
  const showNames = () => names || revealed();

  /* ----------------------------------------------------------------- frame */
  const okBox = (b) => Array.isArray(b) && b.length === 4 && b.every((v) => Number.isFinite(Number(v))) && b[2] - b[0] > 4 && b[3] - b[1] > 4;
  const bounds = okBox(spec.bounds) ? spec.bounds.map(Number) : V.box;
  const bw = bounds[2] - bounds[0];
  const bh = bounds[3] - bounds[1];
  const labelsAsked = !compact && (spec.labels === true || spec.labels === 'all' || (Array.isArray(spec.labels) && spec.labels.length > 0));
  const sideWanted = labelsAsked && spec.labelStyle !== 'key';
  const figAspect = bw / bh;
  const column = figAspect < 0.8 ? 0.255 : 0.2;        // the share of the width each column of names gets
  // The shape of the drawing. With columns of names the figure stands in a window between them; without, it fills the frame.
  let columns = sideWanted;
  let aspect; let H; let maxWidth; let k0; let win; let framed; let midX; let midY;
  let zoom = 1;
  let cx0 = 0;                          // the point of the unzoomed drawing that sits in the middle of the window
  let cy0 = 0;
  function shapeFrame() {
    aspect = Number(spec.aspect) > 0 ? clamp(Number(spec.aspect), 0.4, 2.4) : columns ? clamp(figAspect / (1 - 2 * column), 0.86, 2) : clamp(figAspect, compact ? 0.75 : 0.6, 1.7);
    H = Math.round(W / aspect);
    maxWidth = Number(spec.maxWidth) > 0 ? Number(spec.maxWidth) : Math.round(clamp(540 * aspect, 300, 640));
    const edge = columns ? W * column : 0;
    k0 = Math.min((W - 2 * edge) / bw, H / bh);
    win = [(W - bw * k0) / 2, (H - bh * k0) / 2, (W + bw * k0) / 2, (H + bh * k0) / 2];
    framed = columns && win[0] > 1;
    midX = (win[0] + win[2]) / 2;
    midY = (win[1] + win[3]) / 2;
    zoom = 1; cx0 = midX; cy0 = midY;
  }
  shapeFrame();
  const fr = frame({ width: W, height: H, compact, maxWidth: compact ? null : maxWidth, label: spec.alt || V.label });
  const { svg } = fr;
  let unit = compact ? W / 220 : W / Math.min(maxWidth, 520);       // drawing units per CSS pixel; corrected as soon as the size is known
  svg.style.setProperty('--bm-u', String(round(unit, 3)));

  const clipId = `${uid}-clip`;
  const clipRect = s('rect');
  const windowRect = s('rect.bm-window', { rx: 10, 'stroke-width': 1.5 });
  const defs = s('defs', {}, s('clipPath', { id: clipId }, clipRect));
  const gArt = s('g.bm-art');
  const gClip = s('g', { 'clip-path': `url(#${clipId})` }, gArt);
  const gOver = s('g.bm-over');
  svg.append(defs, gClip, gOver);
  gOver.appendChild(windowRect);
  if (compact) fr.el.classList.add('is-small');
  /** Put the window where shapeFrame() says it is. */
  function placeFrame() {
    for (const el of [clipRect, windowRect]) { el.setAttribute('x', f1(win[0])); el.setAttribute('y', f1(win[1])); el.setAttribute('width', f1(win[2] - win[0])); el.setAttribute('height', f1(win[3] - win[1])); }
    clipRect.setAttribute('rx', framed ? 10 : 0);
    windowRect.setAttribute('visibility', framed ? 'visible' : 'hidden');
  }
  placeFrame();

  /* --------------------------------------------------------- zoom and pan */
  const maxZoom = 5;
  const canZoom = !isStatic && (spec.zoom == null ? !!V.zoom && !okBox(spec.bounds) : !!spec.zoom);
  const toFrame = (p) => [((p[0] - bounds[0]) * k0 + win[0] - cx0) * zoom + midX, ((p[1] - bounds[1]) * k0 + win[1] - cy0) * zoom + midY];
  const toArt = (x, y) => [((x - midX) / zoom + cx0 - win[0]) / k0 + bounds[0], ((y - midY) / zoom + cy0 - win[1]) / k0 + bounds[1]];
  const inWindow = (p, margin = 0) => p[0] >= win[0] - margin && p[0] <= win[2] + margin && p[1] >= win[1] - margin && p[1] <= win[3] + margin;
  /** Drawing units of the artwork per CSS pixel, at the current zoom. */
  const px = () => unit / (k0 * zoom);
  function placeArt() {
    const k = k0 * zoom;
    const tx = (-bounds[0] * k0 + win[0] - cx0) * zoom + midX;
    const ty = (-bounds[1] * k0 + win[1] - cy0) * zoom + midY;
    gArt.setAttribute('transform', `translate(${round(tx, 2)} ${round(ty, 2)}) scale(${round(k, 4)})`);
    gArt.style.setProperty('--bm-px', String(round(px(), 4)));
  }
  placeArt();
  /**
   * The names do not fit beside the figure (a phone, or too many of them): they become numbers with a key underneath,
   * and the figure takes the room the columns had. This happens once and is not undone.
   */
  function dropColumns() {
    columns = false;
    shapeFrame();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    fr.el.style.setProperty('--w-aspect', String(round(W / H, 3)));
    if (!compact) fr.el.style.setProperty('--w-max', `${maxWidth}px`);
    placeFrame();
    placeArt();
  }

  /* ------------------------------------------------------------ what's what */
  const groups = (Array.isArray(spec.groups) ? spec.groups : []).map((g) => ({
    ids: expandIds(g.ids != null ? g.ids : g.id), color: colour(g.color, 'orange'), tone: g.tone === 'soft' ? 'soft' : '', label: g.label || '',
  }));
  const groupOf = new Map();
  for (const g of groups) for (const id of g.ids) groupOf.set(id, g);
  const dimRest = spec.dim == null ? (groups.length > 0 ? true : false) : spec.dim;
  const explicitPickable = spec.pickable != null && !markerMode ? expandIds(spec.pickable) : null;
  const answerIds = structMode ? expandIds(spec.answer) : [];
  const focusIds = expandIds(spec.focus);
  const ghostAsked = new Set(expandIds(spec.ghost));
  const notes = spec.notes && typeof spec.notes === 'object' ? spec.notes : {};
  const labelSpecs = [];
  if (labelsAsked && Array.isArray(spec.labels)) {
    for (const item of spec.labels) {
      if (typeof item === 'string') expandIds([item]).forEach((id) => labelSpecs.push({ id }));
      else if (item && typeof item === 'object' && isStructure(item.id)) labelSpecs.push({ id: item.id, text: item.text, column: item.column });
      else if (item && typeof item === 'object' && item.at != null && item.text) labelSpecs.push({ at: item.at, text: String(item.text), column: item.column });
    }
  } else if (spec.labels === true && groups.length) for (const g of groups) g.ids.forEach((id) => labelSpecs.push({ id }));

  const markerSpecs = (Array.isArray(spec.markers) ? spec.markers : []).filter((m) => m && m.at != null).map((m, i) => ({
    id: m.id != null ? String(m.id) : null, at: m.at, label: m.label != null ? String(m.label) : '', note: m.note ? String(m.note) : '',
    color: colour(m.color, 'red'), shape: ['dot', 'ring', 'cross', 'square'].includes(m.shape) ? m.shape : 'dot', r: SIZES[m.size] || SIZES.m,
    labelPos: m.labelPos, letter: LETTERS[i % 26],
  }));
  const hideMarkerLabels = spec.markerLabels === 'after';
  const answerMarkers = markerMode ? [].concat(spec.answer == null ? [] : spec.answer).map(String) : [];
  const flowSpecs = (Array.isArray(spec.flows) ? spec.flows : []).filter((f) => f && Array.isArray(f.path) && f.path.length > 1);
  const stepThrough = !!spec.stepThrough && flowSpecs.length > 0 && !compact;
  flowSpecs.forEach((f, i) => { f.stepNo = stepThrough ? (Number.isInteger(f.step) && f.step > 0 ? f.step : i + 1) : 1; });
  const stepNumbers = Array.from(new Set(flowSpecs.map((f) => f.stepNo))).sort((a, b) => a - b);
  const stepCount = stepThrough ? stepNumbers.length : 1;
  const toggleSpecs = (spec.toggles === true ? ['skeleton', 'muscles', 'circulatory', 'respiratory', 'digestive', 'urinary', 'nervous'] : Array.isArray(spec.toggles) ? spec.toggles : [])
    .filter((t) => typeof t === 'string' && expandIds([t]).length);

  /* --------------------------------------------- chrome that needs no drawing */
  const statusEl = h('div.bm-status');
  const infoEl = h('div.bm-info', { hidden: true });
  const keyEl = h('ol.bm-key', { hidden: true });
  const stepsEl = h('div.bm-steps');
  const togglesEl = h('div.bm-toggles', { role: 'group', 'aria-label': 'Show or hide parts of the figure' });
  const tipEl = isStatic ? null : h('div.bm-tip', { hidden: true, 'aria-hidden': 'true' });
  if (tipEl) fr.canvas.appendChild(tipEl);
  const legendItems = [];
  for (const g of groups) if (g.label) legendItems.push(h('span.w-legend-item', {}, h('i', { style: { background: hue(g.color, g.tone) } }), g.label));
  for (const f of flowSpecs) if (f.label && !stepThrough) legendItems.push(h('span.w-legend-item', {}, h('i.is-line', { style: { borderColor: hue(colour(f.color, 'red')), borderTopStyle: f.dashed ? 'dashed' : 'solid' } }), f.label));
  if (!compact) {
    fr.el.insertBefore(keyEl, fr.readouts);
    if (legendItems.length && spec.legend !== false) fr.el.insertBefore(h('div.w-legend', {}, legendItems), fr.readouts);
    if (stepThrough) fr.el.insertBefore(stepsEl, fr.readouts);
    if (mode === 'explore') { infoEl.hidden = false; fr.el.insertBefore(infoEl, fr.readouts); }
    if (!isStatic && mode !== 'view' && mode !== 'explore') fr.el.insertBefore(statusEl, fr.readouts);
    if (toggleSpecs.length && !isStatic) fr.el.insertBefore(togglesEl, fr.readouts);
  }
  /** A control that keeps working after the step is answered (the loader disables real buttons then). */
  const liveButton = (content, label, fn, attrs = {}) => {
    const b = h('div', { role: 'button', tabindex: '0', 'aria-label': label, title: label, ...attrs }, content);
    const go = (ev) => { ev.preventDefault(); ev.stopPropagation(); if (b.getAttribute('aria-disabled') !== 'true') fn(b); };
    b.addEventListener('click', go);
    b.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') go(ev); });
    b.dataset.keys = 'own';
    return b;
  };
  const able = (b, on) => { if (!b) return; if (on) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true'); };

  /* ------------------------------------------------- before the drawing is in */
  const validBefore = (id) => (markerMode ? markerSpecs.some((m) => m.id === id) : isStructure(id) || markerSpecs.some((m) => m.id === id));
  const api = {
    el: fr.el,
    getState: () => publicState(null),
    setState(next) { st = mergeState(st, next, { mode, valid: validBefore, place: (v) => (Array.isArray(v) ? v : null), steps: stepCount }); if (next && typeof next === 'object' && typeof next.at === 'string') pendingAt = next.at; },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); },
    destroy() { destroyed = true; },
  };
  let pendingAt = null;
  if (readOnly) fr.el.classList.add('is-readonly');

  /** The state the lesson sees. `facts` are the things only the drawing can tell (place mode). */
  function publicState(facts) {
    const steps = stepThrough ? { step: st.step, steps: stepCount, stepsDone: (st.stepMax || st.step) >= stepCount } : null;
    if (mode === 'explore') return { selected: st.selected, seen: st.seen.slice(), seenCount: st.seen.length, ...steps };
    if (mode === 'pick') {
      const id = st.picked[0] || null;
      return { picked: id, name: id ? structureName(id) : null, nameThe: id ? structureNameThe(id) : null, side: id ? st.side : null };
    }
    if (mode === 'pickMany' || mode === 'pickMarkers') return { picked: st.picked.slice().sort(), count: st.picked.length };
    if (mode === 'pickMarker') return { picked: st.picked[0] || null };
    if (mode === 'place') return { at: st.at ? st.at.slice() : null, placed: st.placed, structure: null, region: null, side: null, ...(facts || {}) };
    return { ...steps };
  }

  const art0 = artNow(V.art);
  if (art0) boot(art0);
  else loadArt(V.art).then((a) => { if (!destroyed) boot(a); }).catch((err) => { console.error('[body-map] the drawing did not load', err); });
  return api;

  /* =============================================================== the drawing */
  function boot(art) {
    const marrow = (id) => art.byId.has(id) && !art.byId.get(id).deco;
    const named = [...groups.flatMap((g) => g.ids), ...labelSpecs.map((l) => l.id).filter(Boolean), ...(explicitPickable || []), ...answerIds, ...focusIds];
    const shown = shownSet(art, V, spec.show, spec.hide, named);
    const hiddenAsked = new Set(expandIds(spec.hide));
    for (const id of hiddenAsked) shown.delete(id);

    /* ---- markers and targets, in drawing coordinates */
    const markers = [];
    for (const m of markerSpecs) { const p = onePoint(art, m.at); if (p) markers.push({ ...m, p }); }
    const markerById = new Map(markers.filter((m) => m.id).map((m) => [m.id, m]));
    const pickableMarkerIds = spec.pickable != null && markerMode ? new Set([].concat(spec.pickable).map(String)) : null;
    const pickableMarkers = markers.filter((m) => m.id && (!pickableMarkerIds || pickableMarkerIds.has(m.id)));
    const targets = [];
    if (mode === 'place') {
      const list = Array.isArray(spec.targets) ? spec.targets : spec.target != null ? [{ id: 'target', at: spec.target }] : [];
      for (const t of list) {
        const r = t && resolvePoint(art, t.at);
        if (r) targets.push({ id: String(t.id != null ? t.id : 'target'), points: r.points, label: t.label || (r.id ? structureName(r.id) : '') });
      }
    }
    const pinSpec = spec.pin && typeof spec.pin === 'object' ? spec.pin : {};
    const pinStart = onePoint(art, pinSpec.start) || [round((bounds[0] + bounds[2]) / 2), round(bounds[1] + bh * 0.88)];
    if (pendingAt) { const p = onePoint(art, pendingAt); if (p) { st.at = [round(p[0], 1), round(p[1], 1)]; st.placed = true; } pendingAt = null; }
    if (mode === 'place' && !st.at) st.at = pinStart.slice();

    /* ---- one group of paths per structure, made when first shown */
    const nodes = new Map();
    const gShapes = s('g');
    const gFlows = s('g');
    const gMarks = s('g');
    gArt.append(gShapes, gFlows, gMarks);
    const partTone = (tone) => (tone === 'bone' ? 'var(--bm-bone)' : `var(--${tone})`);
    function naturalFill(id) {
      if (id === 'skin') return 'var(--bm-skin)';
      const sh = art.byId.get(id);
      if (sh && sh.opts.tone) return partTone(sh.opts.tone);
      const t = TONES.id[id] || TONES.system[systemsOf(id)[0]] || ['gray', 'soft'];
      return t[0] === 'bone' ? 'var(--bm-bone)' : HUES.includes(t[0]) ? hue(t[0], t[1]) : `var(--${t[0]})`;
    }
    function nodeOf(sh) {
      let n = nodes.get(sh.id);
      if (n) return n;
      const g = s('g.bm-s');
      for (const f of sh.fills) g.appendChild(s('path.bm-f', { d: f.d, style: f.tone ? `--f:${partTone(f.tone)}` : null }));
      for (const t of sh.tubes) g.appendChild(s('path.bm-tu', { d: t.d, style: `--w:${t.w}` }));
      for (const t of sh.tubes) g.appendChild(s('path.bm-to', { d: t.d, style: `--w:${t.w}${t.tone ? `;--f:${partTone(t.tone)}` : ''}` }));
      if (sh.inks) g.appendChild(s('path.bm-i', { d: sh.inks }));
      n = { g, sh, cls: '' };
      nodes.set(sh.id, n);
      // keep the drawing order of the artwork whatever order things are switched on in
      let before = null;
      for (let z = sh.z + 1; z < art.shapes.length && !before; z++) { const later = nodes.get(art.shapes[z].id); if (later) before = later.g; }
      gShapes.insertBefore(g, before);
      return n;
    }
    /** The outline of a structure as one path (for the answer and the keyboard cursor). */
    function outline(id, cls) {
      const sh = art.byId.get(id);
      if (!sh) return null;
      const g = s('g');
      for (const f of sh.fills) g.appendChild(s('path', { class: `bm-mark ${cls}`, d: f.d, style: 'stroke-width:calc(var(--bm-px) * 3px)' }));
      for (const t of sh.tubes) g.appendChild(s('path', { class: `bm-mark ${cls}`, d: t.d, style: `fill:none;stroke-width:calc(${t.w}px + var(--bm-px) * 5px);stroke-opacity:0.55` }));
      return g;
    }

    /* ---- who is see-through, who can be chosen */
    let ghost = new Set();
    let veil = new Set();               // what lies in front of a `focus` structure: see-through even while chosen
    const focusFirst = focusIds.length ? new Set(focusIds) : null;
    let pickSet = new Set();
    let cands = [];
    let cursor = -1;
    let keysFocused = false;
    let hover = null;
    const listed = !isStatic && (structMode || markerMode || mode === 'explore' || (mode === 'view' && names));
    const canChoose = (id) => shown.has(id) && marrow(id) && (explicitPickable ? explicitPickable.includes(id) : id !== 'skin' || mode === 'explore');
    function sortOut() {
      const rev = revealed();
      const subjects = new Set([...focusIds, ...groupOf.keys(), ...labelSpecs.map((l) => l.id).filter(Boolean), ...(explicitPickable || []), ...st.picked, ...(rev ? answerIds : [])]);
      if (st.selected && marrow(st.selected)) subjects.add(st.selected);
      ghost = new Set();
      for (const id of ghostAsked) if (shown.has(id)) ghost.add(id);
      if (dimRest === 'ghost') for (const id of shown) if (!groupOf.has(id) && id !== 'skin') ghost.add(id);
      // whatever hides a good part of a subject turns see-through, unless it is a subject itself
      for (const id of subjects) {
        const sh = art.byId.get(id);
        if (!sh || !shown.has(id)) continue;
        const least = focusIds.includes(id) ? 0 : 0.15;
        for (let z = sh.z + 1; z < art.shapes.length; z++) {
          const up = art.shapes[z];
          if (up.deco || !shown.has(up.id) || subjects.has(up.id) || ghost.has(up.id)) continue;
          if (coverShare(art, up.id, id) > least) ghost.add(up.id);
        }
      }
      // a structure named in `focus` is uncovered completely: anything at all in front of it gives way, be it pickable,
      // labelled, in a group or chosen (only another `focus` structure stays as it is)
      veil = new Set();
      for (const id of focusIds) {
        const sh = art.byId.get(id);
        if (!sh || !shown.has(id)) continue;
        for (let z = sh.z + 1; z < art.shapes.length; z++) {
          const up = art.shapes[z];
          if (up.deco || !shown.has(up.id) || focusFirst.has(up.id)) continue;
          if (coverShare(art, up.id, id) > 0) { ghost.add(up.id); veil.add(up.id); }
        }
      }
      pickSet = new Set();
      for (const sh of art.shapes) if (canChoose(sh.id)) pickSet.add(sh.id);
    }
    /** The point where a structure is best pointed at: a visible one, near the middle (of one side if asked). */
    function pointOf(id, side = null) {
      const sh = art.byId.get(id);
      if (!sh) return null;
      const want = side && sh.atSide[side] ? sh.atSide[side] : sh.at;
      const vis = visibleSamples(art, id, shown, ghost).filter((q) => !side || q[2] === side);
      const sideOf = () => {
        if (side || !sh.sides.length) return side;
        for (const p of sh.parts) if (want[0] >= p.box[0] && want[0] <= p.box[2] && want[1] >= p.box[1] && want[1] <= p.box[3]) return p.side;
        return nearShape(sh, want[0], want[1]).side;
      };
      if (!vis.length || vis.length === sh.samples.length) return { at: want, side: sideOf(), hidden: !vis.length && sh.samples.length > 0 };
      const covered = art.shapes.some((up) => up.z > sh.z && !up.deco && shown.has(up.id) && !ghost.has(up.id) && onShape(up, want[0], want[1]));
      if (!covered) return { at: want, side: sideOf(), hidden: false };
      let best = vis[0];
      let bestD = Infinity;
      for (const q of vis) { const d = Math.hypot(q[0] - want[0], q[1] - want[1]); if (d < bestD) { bestD = d; best = q; } }
      return { at: [best[0], best[1]], side: best[2] || null, hidden: false };
    }
    // The list of candidates (for the keyboard, for hit testing and for a screen reader) costs a visibility test per
    // structure, so it is put together just after the figure has been drawn, or the moment something needs it.
    let candsStale = true;
    let candsQueued = false;
    function staleCands() {
      candsStale = true;
      if (candsQueued || !listed) return;
      candsQueued = true;
      const later = typeof requestIdleCallback === 'function' ? (fn) => requestIdleCallback(fn, { timeout: 250 }) : (fn) => setTimeout(fn, 30);
      later(() => { candsQueued = false; if (!destroyed) freshCands(); });
    }
    function freshCands() { if (candsStale) { candsStale = false; buildCands(); } }
    function buildCands() {
      const old = cursor >= 0 && cands[cursor] ? cands[cursor].key : null;
      cands = [];
      if (listed) {
        if (markerMode) for (const m of pickableMarkers) cands.push({ key: `m:${m.id}`, kind: 'marker', id: m.id, at: m.p, marker: m });
        else {
          for (const sh of art.shapes) {
            if (!pickSet.has(sh.id)) continue;
            const p = pointOf(sh.id);
            if (p.hidden && mode !== 'explore') continue;      // nothing of it can be seen, so nothing of it can be tapped
            cands.push({ key: `s:${sh.id}`, kind: 'structure', id: sh.id, at: p.at, side: p.side, hidden: p.hidden });
          }
          if (mode === 'explore') for (const m of markers) if (m.id && (m.label || m.note)) cands.push({ key: `m:${m.id}`, kind: 'marker', id: m.id, at: m.p, marker: m });
        }
        const byName = showNames() && !markerMode;
        if (byName) for (const c of cands) c.sortKey = candName(c).toLowerCase();
        cands.sort((a, b) => (byName ? (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0) : (a.at[1] - b.at[1]) || (a.at[0] - b.at[0])));
      }
      gKeys.replaceChildren();
      cands.forEach((c, i) => {
        c.el = s('g', { role: 'option', id: `${uid}-o${i}`, 'aria-selected': 'false' }, s('circle', { r: 1, fill: 'none' }));
        gKeys.appendChild(c.el);
      });
      cursor = old ? cands.findIndex((c) => c.key === old) : -1;
      labelCands();
    }
    const candIds = () => { freshCands(); return new Set(cands.filter((c) => c.kind === 'structure').map((c) => c.id)); };
    const markerText = (m) => (m.label && (!hideMarkerLabels || revealed() || !markerMode) ? m.label : `marker ${m.letter}`);
    const candName = (c) => (c.kind === 'marker' ? markerText(c.marker) : nameOf(c.id));
    const whereText = (p) => {
      const r = art.region(p[0], p[1]);
      return r ? `${r.region.replace(/-/g, ' ')}${r.side ? `, on the person's ${r.side}` : ''}` : '';
    };
    function candLabel(c, i) {
      if (c.kind === 'marker') { const t = markerText(c.marker); return t[0].toUpperCase() + t.slice(1); }
      if (showNames()) return nameOf(c.id);
      const where = whereText(c.at);
      return `Structure ${i + 1} of ${cands.length}${where ? `: ${where}` : ''}`;
    }
    function isOn(c) { return mode === 'explore' || mode === 'view' ? st.selected === c.id : st.picked.includes(c.id); }
    function labelCands() {
      if (candsStale) return;            // they are labelled when they are built
      cands.forEach((c, i) => {
        c.el.setAttribute('aria-label', candLabel(c, i));
        c.el.setAttribute('aria-selected', isOn(c) ? 'true' : 'false');
      });
      if (cursor >= 0 && cands[cursor]) gKeys.setAttribute('aria-activedescendant', cands[cursor].el.id); else gKeys.removeAttribute('aria-activedescendant');
    }

    /* ---- colours and classes */
    let answerEl = null;
    let focusEl = null;
    function paint() {
      const rev = revealed();
      for (const sh of art.shapes) {
        const on = sh.deco || shown.has(sh.id);
        const hide = !on || (dimRest === 'hide' && !sh.deco && sh.id !== 'skin' && !groupOf.has(sh.id) && !st.picked.includes(sh.id));
        if (hide) { const n = nodes.get(sh.id); if (n) n.g.style.display = 'none'; continue; }
        const n = nodeOf(sh);
        n.g.style.display = '';
        const id = sh.id;
        const g = groupOf.get(id);
        const picked = (structMode && st.picked.includes(id));
        const selected = (mode === 'explore' || mode === 'view') && st.selected === id;
        const offLimits = structMode && explicitPickable && !pickSet.has(id) && id !== 'skin' && !sh.deco;
        let fill = naturalFill(id);
        let flat = false;
        let dim = false;
        if (spec.plain && id !== 'skin' && !sh.deco) { fill = 'var(--surface)'; flat = true; }
        if (id !== 'skin' && !sh.deco && ((dimRest === true && groups.length && !g) || offLimits)) { fill = 'var(--bm-dim)'; flat = true; dim = true; }
        if (g) { fill = hue(g.color, g.tone); flat = true; }
        if (picked) { fill = hue(pickHue); flat = true; dim = false; }
        const cls = cx('bm-s', flat && 'is-flat', dim && 'is-dim', ghost.has(id) && (veil.has(id) || (!picked && !selected)) && 'is-ghost', (picked || selected) && 'is-on', hover === id && !picked && !selected && 'is-hot');
        if (n.cls !== cls) { n.g.setAttribute('class', cls); n.cls = cls; }
        if (n.fill !== fill) { n.g.style.setProperty('--f', fill); n.fill = fill; }
      }
      // the answer, once the step is over
      if (answerEl) { answerEl.remove(); answerEl = null; }
      if (rev && structMode && answerIds.length) {
        answerEl = s('g');
        for (const id of answerIds) if (shown.has(id)) { const o = outline(id, st.picked.includes(id) ? 'is-answer is-picked' : 'is-answer'); if (o) answerEl.appendChild(o); }
        gMarks.appendChild(answerEl);
      }
      if (focusEl) { focusEl.remove(); focusEl = null; }
      if (keysFocused) freshCands();
      const c = keysFocused && cursor >= 0 ? cands[cursor] : null;
      if (c && c.kind === 'structure') { focusEl = outline(c.id, 'is-focus'); if (focusEl) gMarks.appendChild(focusEl); }
    }

    /* ---- flows */
    const flows = [];
    for (const f of flowSpecs) {
      const pts = flowPoints(art, f.path);
      if (pts.length < 2) continue;
      const line = route(pts, 0.28);
      const color = colour(f.color, 'red');
      const width = clamp(Number(f.width) || 4, 1.5, 9);
      const g = s('g', { class: cx('bm-flow', f.dashed && 'is-dashed'), style: `--c:${hue(color)};--fw:${width};--dur:${round(0.9 / clamp(Number(f.speed) || 1, 0.2, 5), 2)}s` });
      g.appendChild(s('path.bm-flow-halo', { d: line.d }));
      const lineEl = s('path.bm-flow-line', { d: line.d });
      g.appendChild(lineEl);
      if (f.dots !== false && !f.dashed && !compact) g.appendChild(s('path.bm-flow-dots', { d: line.d }));
      if (f.arrows !== false) {
        const headId = `${uid}-h${flows.length}`;
        defs.appendChild(s('marker', { id: headId, viewBox: '0 0 12 12', refX: 6.5, refY: 6, markerWidth: 3.6, markerHeight: 3.6, orient: 'auto-start-reverse' },
          s('path', { d: 'M1.6 1.6L10.6 6L1.6 10.4L3.8 6Z', fill: hue(color), stroke: 'var(--ink)', 'stroke-width': 1.1, 'stroke-linejoin': 'round' })));
        const head = `url(#${headId})`;
        g.appendChild(s('path.bm-flow-arrows', { d: (() => { const e = pointAlong(line.pts, 1); const b = pointAlong(line.pts, 0.985); return `M${f1(b.x)} ${f1(b.y)}L${f1(e.x)} ${f1(e.y)}`; })(), 'marker-end': head }));
        // arrowheads along the way: a second, invisible line with a corner wherever a head belongs
        const total = lengthOf(line.pts);
        const every = Math.max(bw / 6.5, 30);
        const n = Math.floor(total / every);
        if (n >= 2) {
          let d = '';
          for (let i = 0; i <= n; i++) { const q = pointAlong(line.pts, (i + 0.5) / (n + 1)); const e = pointAlong(line.pts, Math.min(1, (i + 0.5) / (n + 1) + 0.004)); d += `${i ? 'L' : 'M'}${f1(q.x)} ${f1(q.y)}L${f1(e.x)} ${f1(e.y)}`; }
          g.appendChild(s('path.bm-flow-arrows', { d, 'marker-mid': head }));
        }
      }
      gFlows.appendChild(g);
      flows.push({ spec: f, g, stepNo: f.stepNo, pts: line.pts });
    }
    function showFlows() {
      if (!stepThrough) return;
      const now = stepNumbers[st.step - 1];
      for (const f of flows) {
        f.g.style.display = f.stepNo > now ? 'none' : '';
        f.g.classList.toggle('is-past', f.stepNo < now);
      }
      const current = flowSpecs.filter((f) => f.stepNo === now);
      const title = listText(current.map((f) => f.label).filter(Boolean));
      const note = current.map((f) => f.note).filter(Boolean).join(' ');
      stepText.replaceChildren(`Step ${st.step} of ${stepCount}${title ? `: ${title}` : ''}`, ...(note ? [h('small', {}, note)] : []));
      able(backBtn, st.step > 1);
      able(nextBtn, st.step < stepCount);
    }
    const stepText = h('div.bm-steps-text', { 'aria-live': 'off' });
    let backBtn = null;
    let nextBtn = null;
    function stepBy(by) {
      const res = reduce(st, { type: 'step', by }, { mode, steps: stepCount });
      if (!res.said) return;
      st = res.state;
      play('tick');
      showFlows();
      env.announce(stepText.textContent);
      env.onChange(getState());
    }
    if (stepThrough) {
      backBtn = liveButton(icon('arrow-left', 18), 'Previous step', () => stepBy(-1));
      nextBtn = liveButton(icon('arrow-right', 18), 'Next step', () => stepBy(1));
      stepsEl.append(backBtn, stepText, nextBtn);
    }

    /* ---- overlay: names, markers, the pin */
    const gLabels = s('g');
    const gDots = s('g');
    const gTop = s('g');
    const gKeys = s('g.bm-keys');
    const cursorEl = s('circle.bm-cursor', { visibility: 'hidden' });
    const gGrid = s('g');
    gOver.append(gGrid, gLabels, gDots, gTop, gKeys, cursorEl);
    let keyed = false;                   // names are shown as numbers with a key (they did not fit beside the figure)
    let pinHandle = null;
    let pinArt = null;
    let pinText = null;
    if (mode === 'place') {
      const color = colour(pinSpec.color, 'red');
      pinHandle = handle(svg, {
        x: 0, y: 0, r: 12, color, label: pinSpec.label ? `Marker: ${pinSpec.label}` : 'Marker', keyStep: 8,
        onMove(x, y, ev) {
          if (readOnly) return;
          const p = toArt(clamp(x, win[0], win[2]), clamp(y, win[1], win[3]));
          if (ev && ev.type === 'keydown') { p[0] = Math.round(p[0]); p[1] = Math.round(p[1]); }
          st = reduce(st, { type: 'move', at: p }, { mode }).state;
          layout();
        },
        onEnd() { if (readOnly) return; play('drop'); status(); env.announce(pinSaid()); env.onChange(getState()); },
      });
      pinHandle.el.classList.add('bm-pin');
      pinArt = s('g', {},
        s('circle.bm-pin-body', { r: 10, fill: hue(color), 'fill-opacity': 0.3, 'stroke-width': 2.5 }),
        s('path.bm-pin-body', { d: 'M-15 0H-5M5 0H15M0 -15V-5M0 5V15', fill: 'none', 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
        s('circle.bm-pin-hole', { r: 2.2 }));
      pinHandle.el.appendChild(pinArt);
      gTop.appendChild(pinHandle.el);
    }
    const putText = (parent, text, x, y, cls, anchor = 'middle') => {
      const el = s('text', { class: `fig-label-sm ${cls}`, x: f1(x), y: f1(y), 'text-anchor': anchor }, text);
      parent.appendChild(el);
      return el;
    };
    const facts = () => placeFacts(art, st.at, { shown, ghost, targets });
    function pinSaid() {
      const fx = facts();
      const bits = [`${pinSpec.label || 'Marker'} placed`];
      if (fx.region) bits.push(`on the ${fx.region.replace(/-/g, ' ')}${fx.side ? `, the person's ${fx.side} side` : ''}`);
      return `${bits.join(' ')}.`;
    }
    const dotShape = (m, r) => {
      const g = s('g');
      const sw = 1.6 * unit;
      if (m.shape === 'square') g.appendChild(s('rect.bm-dot', { x: -r, y: -r, width: 2 * r, height: 2 * r, rx: r * 0.25, fill: hue(m.color), 'stroke-width': sw }));
      else if (m.shape === 'ring') g.appendChild(s('circle.bm-dot.is-ring', { r, style: `--c:${hue(m.color)}`, 'stroke-width': sw * 1.9 }));
      else if (m.shape === 'cross') g.append(s('circle.bm-dot.is-ring', { r, style: `--c:${hue(m.color)}`, 'stroke-width': sw }), s('path.bm-dot.is-cross', { d: `M${-r * 0.5} ${-r * 0.5}L${r * 0.5} ${r * 0.5}M${r * 0.5} ${-r * 0.5}L${-r * 0.5} ${r * 0.5}`, style: `--c:${hue(m.color)}`, 'stroke-width': sw * 1.7 }));
      else g.appendChild(s('circle.bm-dot', { r, fill: hue(m.color), 'stroke-width': sw }));
      return g;
    };

    function layout() {
      const u = unit;
      const rev = revealed();
      gLabels.replaceChildren();
      gDots.replaceChildren();
      const taken = [];

      // names beside the figure, or numbers with a key
      const items = [];
      if (!compact) {
        const list = labelSpecs.length ? labelSpecs : spec.labels === 'all' || (spec.labels === true && !groups.length) ? art.shapes.filter((sh) => !sh.deco && sh.id !== 'skin' && shown.has(sh.id)).map((sh) => ({ id: sh.id })) : [];
        for (const l of list) {
          if (l.id) {
            const sh = art.byId.get(l.id);
            if (!sh || !shown.has(l.id)) continue;
            const text = l.text || nameOf(l.id);
            const size = sh.grip / px();           // how much of it there is on screen, in CSS pixels
            if (twoSided(sh)) {
              const a = pointOf(l.id, 'left');
              const b = pointOf(l.id, 'right');
              const pa = toFrame(a.at);
              const pb = toFrame(b.at);
              const ina = inWindow(pa);
              const inb = inWindow(pb);
              if (!ina && !inb) continue;
              if (ina && inb) items.push({ id: l.id, text, x: pa[0], y: pa[1], alt: pb, column: l.column, size });
              else { const p = ina ? pa : pb; items.push({ id: l.id, text, x: p[0], y: p[1], column: l.column, size }); }
            } else {
              const p = toFrame(pointOf(l.id).at);
              if (inWindow(p)) items.push({ id: l.id, text, x: p[0], y: p[1], column: l.column, size });
            }
          } else {
            const a = onePoint(art, l.at);
            const p = a ? toFrame(a) : null;
            if (p && inWindow(p)) items.push({ id: null, text: l.text, x: p[0], y: p[1], column: l.column });
          }
        }
      }
      keyed = false;
      keyEl.hidden = true;
      if (items.length) {
        let done = false;
        if (spec.labelStyle !== 'key' && columns) {
          const res = layoutLabels(items, { W, H, win, unit: u, size: 12 });
          if (res.ok || spec.labelStyle === 'side') {
            for (const l of res.labels) {
              gLabels.appendChild(s('path.bm-lead', { d: `M${f1(l.leader[0][0])} ${f1(l.leader[0][1])}L${f1(l.leader[1][0])} ${f1(l.leader[1][1])}L${f1(l.leader[2][0])} ${f1(l.leader[2][1])}`, 'stroke-width': f1(1.3 * u) }));
              gLabels.appendChild(s('circle.bm-lead-dot', { cx: f1(l.at[0]), cy: f1(l.at[1]), r: f1(2.6 * u), 'stroke-width': f1(1 * u) }));
              const t = s('text', { class: 'fig-label-sm bm-t', 'text-anchor': l.anchor });
              l.lines.forEach((line, i) => t.appendChild(s('tspan', { x: f1(l.x), y: f1(l.y + i * l.lh) }, line)));
              gLabels.appendChild(t);
            }
            done = true;
          }
        }
        if (!done && columns) {
          // no room for the columns: give their space to the figure and start again
          dropColumns();
          if (zoomOut) { able(zoomOut, false); able(zoomIn, true); resetBtn.hidden = true; svg.classList.remove('is-zoomed'); }
          layout();
          drawGrid();
          return;
        }
        if (!done) {
          keyed = true;
          const r = 8.5 * u;
          // a number would cover a small structure, so it stands beside it, on the side away from the middle of the figure
          const start = items.map((it) => {
            if (!(it.size < 30)) return [it.x, it.y];
            const dx = it.x - midX;
            const dy = it.y - midY;
            const len = Math.hypot(dx, dy) || 1;
            const out = r + (it.size / 2 + 5) * u;
            return [it.x + (dx / len) * out, it.y + (dy / len) * out];
          });
          const pts = spreadBadges(start, r * 2.15, [win[0] + r, win[1] + r, win[2] - r, win[3] - r]);
          keyEl.replaceChildren();
          items.forEach((it, i) => {
            const p = pts[i];
            if (Math.hypot(p[0] - it.x, p[1] - it.y) > r * 0.6) gLabels.appendChild(s('path.bm-lead', { d: `M${f1(p[0])} ${f1(p[1])}L${f1(it.x)} ${f1(it.y)}`, 'stroke-width': f1(1.3 * u) }));
            gLabels.appendChild(s('circle.bm-badge', { cx: f1(p[0]), cy: f1(p[1]), r: f1(r), 'stroke-width': f1(1.2 * u) }));
            putText(gLabels, String(i + 1), p[0], p[1] + 3.8 * u, 'bm-t-badge');
            keyEl.appendChild(h('li', {}, h('b', {}, String(i + 1)), it.text));
            taken.push([p[0] - r, p[1] - r, p[0] + r, p[1] + r]);
          });
          keyEl.hidden = false;
        }
      }

      // markers
      const drawn = [];
      for (const m of markers) {
        const p = toFrame(m.p);
        if (!inWindow(p, 2)) { m.screen = null; continue; }
        m.screen = p;
        const r = m.r * u;
        drawn.push(m);
        taken.push([p[0] - r, p[1] - r, p[0] + r, p[1] + r]);
      }
      for (const m of drawn) {
        const p = m.screen;
        const r = m.r * u;
        const on = markerMode ? st.picked.includes(m.id) : (mode === 'explore' && st.selected === m.id);
        const g = dotShape(m, r);
        g.setAttribute('transform', `translate(${f1(p[0])} ${f1(p[1])})`);
        gDots.appendChild(g);
        if (on) gDots.appendChild(s('circle.bm-dot-ring', { cx: f1(p[0]), cy: f1(p[1]), r: f1(r + 3.4 * u), 'stroke-width': f1(2.2 * u) }));
        if (rev && markerMode && answerMarkers.includes(m.id)) gDots.appendChild(s('circle.bm-dot-answer', { cx: f1(p[0]), cy: f1(p[1]), r: f1(r + 7 * u), 'stroke-width': f1(2.2 * u), 'stroke-dasharray': `${f1(4 * u)} ${f1(3 * u)}` }));
        const lettered = hideMarkerLabels && !rev && pickableMarkers.includes(m);
        const text = lettered ? m.letter : m.label;
        if (text && !compact) {
          const tag = placeTag(p, text, { unit: u, size: 12, r: r + (on ? 4 * u : 0), prefer: m.labelPos || (p[0] > midX ? 'right' : 'left'), frame: [2 * u, 2 * u, W - 2 * u, H - 2 * u] }, taken);
          putText(gDots, text, tag.x, tag.y, lettered ? 'bm-t bm-t-b' : 'bm-t', tag.anchor);
        }
      }

      // after the answer: the names of what was picked and of the answer
      if (rev && structMode && !compact) {
        const tags = Array.from(new Set([...st.picked, ...answerIds])).filter((id) => shown.has(id));
        for (const id of tags) {
          const p = toFrame(pointOf(id, st.picked[0] === id ? st.side : null).at);
          if (!inWindow(p)) continue;
          const text = nameOf(id);
          const w = textWidth(text, 12.5 * u);
          let y = p[1] + 4 * u;
          const clash = (b) => taken.some((t) => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
          const x = clamp(p[0], w / 2 + 3 * u, W - w / 2 - 3 * u);
          let boxed = [x - w / 2, y - 12 * u, x + w / 2, y + 4 * u];
          for (let tries = 0; tries < 6 && clash(boxed); tries++) { y += 15 * u; boxed = [x - w / 2, y - 12 * u, x + w / 2, y + 4 * u]; }
          taken.push(boxed);
          putText(gDots, text, x, y, 'bm-t bm-t-b');
        }
      }

      // the marker of place mode, and where it belonged
      if (pinHandle) {
        const p = toFrame(st.at);
        pinHandle.set(p[0], p[1]);
        pinArt.setAttribute('transform', `scale(${round(u, 3)})`);
        pinHandle.el.classList.toggle('is-loose', !st.placed);
        const fx = facts();
        pinHandle.setLabel(st.placed ? (fx.region ? `on the ${fx.region.replace(/-/g, ' ')}${fx.side ? `, the person's ${fx.side} side` : ''}` : 'off the figure') : 'not placed yet');
        if (pinText) { pinText.remove(); pinText = null; }
        if (pinSpec.label) pinText = putText(gDots, pinSpec.label, p[0], p[1] - 20 * u, 'bm-t bm-t-b');
        if (rev && targets.length) {
          const near = targets.find((t) => t.id === fx.nearest) || targets[0];
          let best = near.points[0];
          for (const q of near.points) if (Math.hypot(q[0] - st.at[0], q[1] - st.at[1]) < Math.hypot(best[0] - st.at[0], best[1] - st.at[1])) best = q;
          for (const t of targets) for (const q of (t === near ? [best] : t.points)) {
            const c = toFrame(q);
            gDots.appendChild(s('circle.bm-target', { cx: f1(c[0]), cy: f1(c[1]), r: f1(9 * u), 'stroke-width': f1(2.4 * u), 'stroke-dasharray': `${f1(4 * u)} ${f1(3 * u)}` }));
            gDots.appendChild(s('circle', { cx: f1(c[0]), cy: f1(c[1]), r: f1(2.6 * u), fill: 'var(--green-text)' }));
          }
          const c = toFrame(best);
          if (st.placed && Math.hypot(c[0] - p[0], c[1] - p[1]) > 16 * u) gDots.appendChild(s('path.bm-gap', { d: `M${f1(p[0])} ${f1(p[1])}L${f1(c[0])} ${f1(c[1])}`, 'stroke-width': f1(1.6 * u), 'stroke-dasharray': `${f1(4 * u)} ${f1(4 * u)}` }));
        }
      }

      // the keyboard cursor on a marker (a structure gets its outline instead: see paint)
      if (keysFocused) freshCands();
      const cur = keysFocused && cursor >= 0 ? cands[cursor] : null;
      if (cur && (cur.kind === 'marker' || cur.hidden)) {
        const p = toFrame(cur.at);
        cursorEl.setAttribute('cx', f1(p[0])); cursorEl.setAttribute('cy', f1(p[1]));
        cursorEl.setAttribute('r', f1(13 * u)); cursorEl.setAttribute('stroke-width', f1(3 * u));
        cursorEl.setAttribute('visibility', 'visible');
      } else cursorEl.setAttribute('visibility', 'hidden');
      placeTip();
    }

    /* ---- the grid for authors */
    function drawGrid() {
      gGrid.replaceChildren();
      if (!spec.debug || compact) return;
      const u = unit;
      const span = Math.max(bw, bh) / zoom;
      const step = span > 500 ? 100 : span > 220 ? 50 : span > 90 ? 20 : 10;
      const a = toArt(win[0], win[1]);
      const b = toArt(win[2], win[3]);
      for (let x = Math.ceil(a[0] / step) * step; x <= b[0]; x += step) {
        const p = toFrame([x, a[1]]);
        gGrid.appendChild(s('line.bm-grid', { x1: f1(p[0]), x2: f1(p[0]), y1: f1(win[1]), y2: f1(win[3]), 'stroke-width': f1(u) }));
        putText(gGrid, String(x), p[0] + 2 * u, win[1] + 10 * u, 'bm-t-grid', 'start');
      }
      for (let y = Math.ceil(a[1] / step) * step; y <= b[1]; y += step) {
        const p = toFrame([a[0], y]);
        gGrid.appendChild(s('line.bm-grid', { y1: f1(p[1]), y2: f1(p[1]), x1: f1(win[0]), x2: f1(win[2]), 'stroke-width': f1(u) }));
        putText(gGrid, String(y), win[0] + 2 * u, p[1] - 2 * u, 'bm-t-grid', 'start');
      }
      for (const [id, a0] of Object.entries(art.anchors)) for (const q of Array.isArray(a0) ? [a0] : Object.values(a0)) {
        const p = toFrame(q);
        if (!inWindow(p)) continue;
        gGrid.appendChild(s('circle', { cx: f1(p[0]), cy: f1(p[1]), r: f1(2.4 * u), fill: 'var(--blue)' }));
        if (zoom > 1.5 || bw < 260) putText(gGrid, id, p[0] + 4 * u, p[1] + 3 * u, 'bm-t-grid', 'start');
      }
    }

    /* ---- tooltip, status line, info panel */
    let tip = null;                      // { text, x, y } in drawing units of the frame
    function placeTip() {
      if (!tipEl) return;
      if (!tip) { tipEl.hidden = true; return; }
      tipEl.hidden = false;
      tipEl.textContent = tip.text;
      tipEl.style.left = `${round((tip.x / W) * 100, 2)}%`;
      tipEl.style.top = `${round((tip.y / H) * 100, 2)}%`;
      tipEl.className = cx('bm-tip', tip.x < W * 0.25 && 'is-left', tip.x > W * 0.75 && 'is-right', tip.y < H * 0.16 && 'is-below');
    }
    function tipFor(id, at = null, side = null) {
      if (!id || !showNames() || mode === 'explore') { tip = null; placeTip(); return; }
      const m = markerById.get(id);
      const text = m && !isStructure(id) ? markerText(m) : nameOf(id);
      const p = at || toFrame(m && !isStructure(id) ? m.p : pointOf(id, side).at);
      tip = text ? { text, x: clamp(p[0], 0, W), y: clamp(p[1], 0, H) } : null;
      placeTip();
    }
    function status() {
      if (isStatic || compact) return;
      if (mode === 'explore') { info(); return; }
      if (mode === 'view') return;
      const rev = revealed();
      let text = '';
      if (structMode) {
        if (rev) {
          const bits = [];
          if (st.picked.length) bits.push(`You picked ${listText(st.picked.map(nameThe))}.`);
          if (answerIds.length && (answerIds.length !== st.picked.length || answerIds.some((id) => !st.picked.includes(id)))) bits.push(`The answer: ${listText(answerIds.map(nameThe))} (dashed outline).`);
          text = bits.join(' ');
        } else if (!st.picked.length) text = many ? 'Tap the structures to choose them.' : 'Tap a structure to choose it.';
        else if (names) text = `Chosen: ${listText(st.picked.map(nameThe))}.`;
        else text = many ? `${st.picked.length} chosen${spec.max ? ` of ${spec.max}` : ''}. Tap one again to let it go.` : 'One structure chosen.';
      } else if (markerMode) {
        const label = (id) => { const m = markerById.get(id); return m ? markerText(m) : id; };
        if (rev && answerMarkers.length) text = `${st.picked.length ? `You picked ${listText(st.picked.map(label))}. ` : ''}${st.picked.length === answerMarkers.length && answerMarkers.every((id) => st.picked.includes(id)) ? '' : `The answer: ${listText(answerMarkers.map(label))} (dashed ring).`}`;
        else if (!st.picked.length) text = many ? 'Tap the markers to choose them.' : 'Tap a marker to choose it.';
        else text = `Chosen: ${listText(st.picked.map(label))}.`;
      } else if (mode === 'place') {
        if (!st.placed) text = 'Drag the marker, or tap the figure, to place it.';
        else {
          const fx = facts();
          text = fx.region ? `Marker on the ${fx.region.replace(/-/g, ' ')}${fx.side ? ` (the person's ${fx.side})` : ''}` : 'Marker placed';
          if (rev) {
            if (fx.structure && fx.structure !== 'skin') text += `, over ${nameThe(fx.structure)}`;
            if (fx.distance != null) {
              const t = targets.find((x) => x.id === fx.nearest);
              text += `; ${art.cm ? `${fx.distance} cm` : `${fx.distance}% of the picture`} from ${t && t.label ? t.label[0].toLowerCase() + t.label.slice(1) : 'the right spot'}`;
            }
          }
          text += rev ? '.' : '. Drag it, or tap the figure, to move it.';
        }
      }
      statusEl.textContent = text;
    }
    function noteOf(id) {
      if (has(notes, id)) return String(notes[id]);
      const m = markerById.get(id);
      if (m && !isStructure(id)) return m.note;
      const i = structureInfo(id);
      return i ? i.note : '';
    }
    function info() {
      if (mode !== 'explore') return;
      const id = st.selected;
      const total = pickSet.size + markers.filter((m) => m.id && (m.label || m.note)).length;
      const more = h('p.bm-info-more', {}, `${st.seen.length} of ${total} looked at.${st.seen.length ? '' : ' Tap any part of the figure.'}`);
      if (!id) { infoEl.replaceChildren(h('b', {}, 'Tap a part to read about it'), more); return; }
      const m = markerById.get(id);
      const isMark = m && !isStructure(id);
      const i = isMark ? null : structureInfo(id);
      const title = isMark ? (m.label || 'Marker') : structureName(id);
      const sci = i && STRUCTURES[id][1] ? STRUCTURES[id][1] : '';
      infoEl.replaceChildren(h('b', {}, title), ...(sci ? [h('i', {}, ` (${sci})`)] : []), h('p', {}, noteOf(id)), more);
    }
    function describe() {
      const bits = [spec.alt || `${V.label}.`];
      if (groups.some((g) => g.label)) bits.push(`Shown in colour: ${groups.filter((g) => g.label).map((g) => (showNames() ? `${g.label} (${listText(g.ids.filter((id) => shown.has(id)).slice(0, 10).map(nameOf))})` : g.label)).join('; ')}.`);
      const tagged = markers.filter((m) => m.label && (!hideMarkerLabels || revealed() || !markerMode));
      if (tagged.length) bits.push(`Marked: ${listText(tagged.slice(0, 12).map((m) => m.label))}.`);
      if (flowSpecs.some((f) => f.label)) bits.push(`Flows: ${listText(flowSpecs.filter((f) => f.label).map((f) => f.label))}.`);
      if (labelSpecs.length && showNames()) bits.push(`Labelled: ${listText(labelSpecs.slice(0, 14).map((l) => l.text || nameOf(l.id)))}.`);
      svg.setAttribute('aria-label', bits.join(' '));
    }

    /* ---- controls */
    function applyZoom() {
      zoom = clamp(zoom, 1, maxZoom);
      const halfW = (win[2] - win[0]) / (2 * zoom);
      const halfH = (win[3] - win[1]) / (2 * zoom);
      cx0 = clamp(cx0, win[0] + halfW, win[2] - halfW);
      cy0 = clamp(cy0, win[1] + halfH, win[3] - halfH);
      placeArt();
      svg.classList.toggle('is-zoomed', zoom > 1.001);
      if (zoomOut) { able(zoomOut, zoom > 1.001); able(zoomIn, zoom < maxZoom - 0.001); resetBtn.hidden = zoom <= 1.001; }
      layout();
      drawGrid();
    }
    /** Zoom by a factor, keeping the point under (x, y) where it is. */
    function zoomBy(factor, x = midX, y = midY) {
      const bx = (x - midX) / zoom + cx0;
      const by = (y - midY) / zoom + cy0;
      zoom = clamp(zoom * factor, 1, maxZoom);
      cx0 = bx - (x - midX) / zoom;
      cy0 = by - (y - midY) / zoom;
      applyZoom();
    }
    let zoomIn = null;
    let zoomOut = null;
    let resetBtn = null;
    if (canZoom) {
      zoomOut = liveButton(icon('minus', 18), 'Zoom out', () => zoomBy(1 / 1.6));
      zoomIn = liveButton(icon('plus', 18), 'Zoom in', () => zoomBy(1.6));
      resetBtn = liveButton(icon('reset', 18), 'Reset the view', () => { zoom = 1; cx0 = midX; cy0 = midY; applyZoom(); });
      resetBtn.hidden = true;
      able(zoomOut, false);
      fr.canvas.appendChild(h('div.bm-zoom', {}, zoomOut, zoomIn, resetBtn));
    }
    let clearBtn = null;
    if (many) {
      clearBtn = button('Clear', () => { if (readOnly) return; const res = reduce(st, { type: 'clear' }, { mode }); if (!res.said) return; st = res.state; play('pop'); changed(); }, { icon: 'reset', variant: 'ghost' });
      fr.buttons.appendChild(clearBtn);
    }
    for (const t of toggleSpecs) {
      const ids = expandIds([t]).filter((id) => marrow(id) && !hiddenAsked.has(id));
      if (!ids.length) continue;
      const text = has(SYSTEMS, t) ? SYSTEMS[t].replace(/ system$/, '') : has(ALIASES, t) ? t[0].toUpperCase() + t.slice(1).replace(/-/g, ' ') : structureName(t);
      const b = liveButton(text, `${text}: show or hide`, (el) => {
        const on = el.getAttribute('aria-pressed') !== 'true';
        for (const id of ids) { if (on) shown.add(id); else shown.delete(id); }
        el.setAttribute('aria-pressed', on ? 'true' : 'false');
        play('tap');
        env.announce(`${text} ${on ? 'shown' : 'hidden'}.`);
        refresh();
      }, { 'aria-pressed': ids.some((id) => shown.has(id)) ? 'true' : 'false', title: null });
      togglesEl.appendChild(b);
    }

    /* ---- choosing */
    function hitAt(x, y, touch) {
      const a = toArt(x, y);
      const reach = (touch ? 13 : 5) * px();
      if (markerMode || mode === 'explore') {
        let best = null;
        let bestD = Infinity;
        for (const m of (markerMode ? pickableMarkers : markers.filter((q) => q.id && (q.label || q.note)))) {
          if (!m.screen) continue;
          const d = Math.hypot(m.screen[0] - x, m.screen[1] - y);
          if (d < bestD) { best = m; bestD = d; }
        }
        if (best && bestD <= Math.max((touch ? 20 : 9) * unit, best.r * unit + 4 * unit)) return { kind: 'marker', id: best.id };
        if (markerMode) return null;
      }
      if (!inWindow([x, y])) return null;
      if (mode === 'explore') {
        // tapping the same spot again goes one layer deeper
        let stack = stackAt(art, a[0], a[1], shown).filter((id) => pickSet.has(id));
        const thin = hitTest(art, a[0], a[1], { shown, pickable: pickSet, ghost: shown, reach, small: 22 * px() });
        if (thin && !stack.includes(thin.id)) stack.unshift(thin.id);
        // what the author asked to be reachable comes before the see-through structures in front of it
        if (focusFirst) {
          const near = hitTest(art, a[0], a[1], { shown, pickable: pickSet, ghost, first: focusFirst, reach, small: 22 * px() });
          if (near && focusFirst.has(near.id)) stack = [near.id, ...stack.filter((id) => id !== near.id)];
        }
        if (!stack.length) return null;
        const at = stack.indexOf(st.selected);
        const id = at >= 0 && stack.length > 1 ? stack[(at + 1) % stack.length] : stack[0];
        return { kind: 'structure', id, side: nearShape(art.byId.get(id), a[0], a[1]).side, deeper: at >= 0 && stack.length > 1 };
      }
      const hit = hitTest(art, a[0], a[1], { shown, pickable: candIds(), ghost, first: focusFirst, reach, small: 26 * px() });
      return hit ? { kind: 'structure', id: hit.id, side: hit.side } : null;
    }
    function changed() {
      sortOut();
      paint();
      labelCands();
      layout();
      status();
      if (clearBtn) clearBtn.disabled = readOnly || !st.picked.length;
      env.onChange(getState());
    }
    function choose(target, how = 'tap') {
      if (!target) return;
      freshCands();
      const touched = cands.findIndex((c) => c.kind === target.kind && c.id === target.id);
      if (touched >= 0) cursor = touched;       // the keyboard carries on from what was last touched
      if (mode === 'view') {
        if (!names || target.kind !== 'structure') return;
        st = reduce(st, { type: 'tap', id: target.id, toggle: how === 'tap' }, { mode }).state;
        paint(); labelCands();
        tipFor(st.selected, null, target.side);
        if (st.selected) env.announce(nameOf(st.selected));
        return;
      }
      if (mode === 'explore') {
        const res = reduce(st, { type: 'tap', id: target.id, toggle: false }, { mode });
        st = res.state;
        play('select');
        sortOut(); paint(); staleCands(); layout(); info();
        env.announce(`${target.kind === 'marker' ? markerText(markerById.get(target.id)) : structureName(target.id)}. ${noteOf(target.id)}`);
        env.onChange(getState());
        return;
      }
      if (readOnly) {
        // the step is over: a tap now only asks "what is this?"
        if (target.kind === 'structure' && showNames()) { tipFor(target.id, null, target.side); env.announce(nameOf(target.id)); }
        return;
      }
      const res = reduce(st, { type: 'tap', id: target.id, side: target.side }, { mode, max: Number(spec.max) || 0 });
      const what = target.kind === 'marker' ? (() => { const t = markerText(markerById.get(target.id)); return t[0].toUpperCase() + t.slice(1); })() : (names ? nameOf(target.id) : 'Structure');
      if (res.said === 'full') { env.announce(`You can choose at most ${spec.max}. Let one go first.`); statusEl.textContent = `At most ${spec.max}: tap a chosen one to let it go.`; return; }
      if (!res.said) return;
      st = res.state;
      play(res.said === 'released' ? 'pop' : 'select');
      env.announce(res.said === 'released' ? `${what} no longer chosen.` : many ? `${what} chosen. ${st.picked.length} chosen.` : `${what} chosen.`);
      changed();
    }

    /* ---- pointer */
    const pointers = new Map();
    let gesture = null;
    const local = (ev) => {
      const m = svg.getScreenCTM();
      if (!m) return [0, 0];
      return [(ev.clientX - m.e) / m.a, (ev.clientY - m.f) / m.d];
    };
    const onDown = (ev) => {
      if (ev.button > 0 || (ev.target.closest && ev.target.closest('.w-handle'))) return;
      const [x, y] = local(ev);
      pointers.set(ev.pointerId, [x, y]);
      if (pointers.size === 1) gesture = { id: ev.pointerId, x, y, sx: x, sy: y, moved: false, touch: ev.pointerType !== 'mouse' };
      else if (pointers.size === 2 && canZoom) {
        const [a, b] = Array.from(pointers.values());
        gesture = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, moved: true };
        try { svg.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
      }
    };
    const onMove = (ev) => {
      const [x, y] = local(ev);
      if (!pointers.has(ev.pointerId)) { if (ev.pointerType === 'mouse') hoverAt(x, y); return; }
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
      if (!gesture.moved && Math.hypot(x - gesture.sx, y - gesture.sy) > 6 * unit) {
        gesture.moved = true;
        if (canZoom && zoom > 1.001) { svg.classList.add('is-panning'); try { svg.setPointerCapture(ev.pointerId); } catch { /* ignore */ } }
      }
      if (!gesture.moved || !canZoom || zoom <= 1.001) return;
      cx0 -= (x - gesture.x) / zoom;
      cy0 -= (y - gesture.y) / zoom;
      gesture.x = x; gesture.y = y;
      tip = null;
      applyZoom();
    };
    const onUp = (ev) => {
      if (!pointers.has(ev.pointerId)) return;
      const [x, y] = pointers.get(ev.pointerId);
      pointers.delete(ev.pointerId);
      svg.classList.remove('is-panning');
      const g = gesture;
      if (pointers.size === 0) gesture = null;
      else if (g && g.pinch) gesture = { moved: true };
      if (!g || g.moved || g.pinch || ev.type === 'pointercancel' || g.id !== ev.pointerId) return;
      tap(x, y, g.touch);
    };
    function tap(x, y, touch) {
      if (mode === 'place') {
        if (readOnly || !inWindow([x, y])) return;
        st = reduce(st, { type: 'move', at: toArt(x, y) }, { mode }).state;
        play('drop');
        layout(); status();
        env.announce(pinSaid());
        env.onChange(getState());
        return;
      }
      const target = hitAt(x, y, touch);
      if (!target) { if (mode === 'view' && st.selected) { st = { ...st, selected: null }; paint(); tipFor(null); } return; }
      choose(target);
      if (target.kind === 'structure' && structMode && !readOnly) tipFor(showNames() ? target.id : null, null, target.side);
    }
    let hoverPoint = null;
    function hoverAt(x, y) {
      const waiting = !!hoverPoint;
      hoverPoint = [x, y];
      if (waiting) return;
      requestAnimationFrame(() => {
        const at = hoverPoint;
        hoverPoint = null;
        if (destroyed || gesture || !at || mode === 'place') return;
        const active = (structMode || markerMode) && !readOnly;
        const live = active || mode === 'explore' || showNames();
        let target = null;
        if (live) {
          if (mode === 'explore') { const a = toArt(at[0], at[1]); const top = inWindow(at) ? hitTest(art, a[0], a[1], { shown, pickable: pickSet, ghost, first: focusFirst, reach: 5 * px(), small: 22 * px() }) : null; target = top ? { kind: 'structure', id: top.id } : hitAt(at[0], at[1], false); if (target && target.kind !== 'marker' && !top) target = null; } else target = hitAt(at[0], at[1], false);
        }
        const id = target && target.kind === 'structure' ? target.id : null;
        svg.classList.toggle('is-pointing', !!target && (active || mode === 'explore' || (mode === 'view' && names)));
        if (id !== hover) { hover = id; paint(); }
        if (id && showNames()) tipFor(id, at);
        else if (mode === 'view' && st.selected) tipFor(st.selected);
        else if (tip) { tip = null; placeTip(); }
      });
    }
    const onLeave = (ev) => {
      if (ev.pointerType !== 'mouse') return;
      hoverPoint = null;
      if (hover) { hover = null; paint(); }
      if (mode === 'view' && st.selected) tipFor(st.selected); else if (tip) { tip = null; placeTip(); }
      svg.classList.remove('is-pointing');
    };
    const onWheel = (ev) => {
      if (!canZoom || !(ev.ctrlKey || ev.metaKey)) return;       // a plain wheel scrolls the page
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

    /* ---- keyboard: one stop in the tab order, arrow keys travel from one candidate to the next */
    function moveCursor(to) {
      freshCands();
      if (to < 0 || to >= cands.length) return;
      cursor = to;
      const c = cands[cursor];
      const p = toFrame(c.at);
      if (!inWindow(p, -8 * unit) && zoom > 1.001) { cx0 = (c.at[0] - bounds[0]) * k0 + win[0]; cy0 = (c.at[1] - bounds[1]) * k0 + win[1]; applyZoom(); }
      labelCands(); paint(); layout();
      if (c.kind === 'structure') tipFor(showNames() ? c.id : null);
      env.announce(`${candLabel(c, cursor)}${isOn(c) ? ', chosen' : ''}`);
    }
    function stepCursor(dx, dy) {
      freshCands();
      if (!cands.length) return;
      if (cursor < 0) { moveCursor(0); return; }
      const here = cands[cursor].at;
      let best = -1;
      let bestScore = Infinity;
      cands.forEach((c, i) => {
        if (i === cursor) return;
        const along = (c.at[0] - here[0]) * dx + (c.at[1] - here[1]) * dy;
        const off = Math.abs((c.at[0] - here[0]) * dy) + Math.abs((c.at[1] - here[1]) * dx);
        if (along <= 0.5 || off > along * 2.4) return;
        const score = along + off * 2;
        if (score < bestScore) { bestScore = score; best = i; }
      });
      if (best >= 0) moveCursor(best);
    }
    let typed = '';
    let typedAt = 0;
    const onKey = (ev) => {
      if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
      freshCands();
      let used = true;
      if (ev.key === 'ArrowLeft') stepCursor(-1, 0);
      else if (ev.key === 'ArrowRight') stepCursor(1, 0);
      else if (ev.key === 'ArrowUp') stepCursor(0, -1);
      else if (ev.key === 'ArrowDown') stepCursor(0, 1);
      else if (ev.key === 'Home') moveCursor(0);
      else if (ev.key === 'End') moveCursor(cands.length - 1);
      else if (ev.key === 'Enter' || ev.key === ' ') {
        if (cursor < 0) moveCursor(0);
        else { const c = cands[cursor]; choose({ kind: c.kind, id: c.id, side: c.side || null }, 'key'); if (c.kind === 'structure' && mode !== 'explore') tipFor(showNames() ? c.id : null); }
      } else if ((ev.key === '+' || ev.key === '=') && canZoom) zoomBy(1.6);
      else if ((ev.key === '-' || ev.key === '_') && canZoom) zoomBy(1 / 1.6);
      else if (ev.key === '0' && canZoom && resetBtn && !resetBtn.hidden) resetBtn.click();
      else if (ev.key === 'Escape' && (tip || (mode === 'view' && st.selected))) { if (mode === 'view') st = { ...st, selected: null }; tip = null; placeTip(); paint(); } else if (ev.key.length === 1 && /\S/.test(ev.key) && showNames() && !markerMode) {
        // type the first letters of a name to jump to it
        typed = ev.timeStamp - typedAt > 900 ? ev.key : typed + ev.key;
        typedAt = ev.timeStamp;
        const want = typed.toLowerCase();
        const from = typed.length === 1 ? cursor + 1 : Math.max(0, cursor);
        for (let q = 0; q < cands.length; q++) { const i = (from + q) % cands.length; if (candName(cands[i]).toLowerCase().startsWith(want)) { moveCursor(i); break; } }
      } else used = false;
      if (used) { ev.preventDefault(); ev.stopPropagation(); }
    };
    if (listed) {
      const what = markerMode ? 'Markers' : 'Parts of the figure';
      const act = mode === 'view' ? 'Enter shows a name' : mode === 'explore' ? 'Enter reads about one' : 'Enter chooses';
      // the drawing now holds something to operate, so it can no longer be a plain picture (the loader does this for
      // widgets that are complete when they are created; a view whose artwork arrives later has to do it itself)
      if (svg.getAttribute('role') === 'img') svg.setAttribute('role', 'group');
      gKeys.setAttribute('role', 'listbox');
      gKeys.setAttribute('tabindex', '0');
      gKeys.setAttribute('aria-label', `${what}. Arrow keys move from one to the next, ${act}.`);
      if (many) gKeys.setAttribute('aria-multiselectable', 'true');
      gKeys.dataset.keys = 'own';
      gKeys.addEventListener('keydown', onKey);
      gKeys.addEventListener('focus', () => { freshCands(); keysFocused = gKeys.matches(':focus-visible'); if (keysFocused && cursor < 0 && cands.length) cursor = 0; labelCands(); paint(); layout(); });
      gKeys.addEventListener('blur', () => { keysFocused = false; if (tip && !(mode === 'view' && st.selected)) tip = null; paint(); layout(); });
    }

    /* ---- state */
    function getState() { return publicState(mode === 'place' ? facts() : null); }
    const valid = (id) => (markerMode ? markerById.has(id) : (marrow(id) && (mode === 'explore' || mode === 'view' || shown.has(id))) || (mode === 'explore' && markerById.has(id)));
    function refresh() {
      sortOut();
      staleCands();
      paint();
      showFlows();
      layout();
      drawGrid();
      status();
      describe();
      if (clearBtn) clearBtn.disabled = readOnly || !st.picked.length;
      if (pinHandle) pinHandle.setEnabled(!readOnly);
      fr.el.classList.toggle('is-readonly', readOnly);
    }
    if (structMode && answerIds.some((id) => !marrow(id))) console.warn(`[body-map] the answer is not drawn in the "${viewName}" view:`, answerIds.filter((id) => !marrow(id)).join(', '));

    refresh();

    // keep text, markers and tap areas the same size on screen however large the figure is shown
    let watcher = null;
    if (typeof ResizeObserver === 'function') {
      watcher = new ResizeObserver((entries) => {
        const width = entries[0] && entries[0].contentRect ? entries[0].contentRect.width : 0;
        if (!(width > 0) || destroyed) return;
        const next = W / width;
        if (Math.abs(next - unit) / unit < 0.02) return;
        unit = next;
        svg.style.setProperty('--bm-u', String(round(unit, 3)));
        placeArt();
        layout();
        drawGrid();
      });
      watcher.observe(fr.canvas);
    }

    api.getState = getState;
    api.setState = (next) => {
      if (next == null) return;
      st = mergeState(st, next, { mode, valid, place: (v) => onePoint(art, v), steps: stepCount });
      if (mode === 'place' && st.at) st.at = [clamp(st.at[0], bounds[0], bounds[2]), clamp(st.at[1], bounds[1], bounds[3])];
      refresh();
    };
    api.setReadOnly = (v) => {
      readOnly = !!v;
      if (readOnly) { hover = null; svg.classList.remove('is-pointing'); }
      refresh();
    };
    api.destroy = () => {
      destroyed = true;
      if (watcher) watcher.disconnect();
      if (pinHandle) pinHandle.destroy();
      svg.removeEventListener('pointerdown', onDown);
      svg.removeEventListener('pointermove', onMove);
      svg.removeEventListener('pointerup', onUp);
      svg.removeEventListener('pointercancel', onUp);
      svg.removeEventListener('pointerleave', onLeave);
      svg.removeEventListener('wheel', onWheel);
    };
  }
}

export const examples = [
  {
    title: 'body-map — the main organs, labelled',
    note: 'view: torso with labels. Names sit in columns beside the figure; on a narrow screen they wrap, or become numbers with a key. Hover or tap for a name.',
    spec: { type: 'body-map', view: 'torso', labels: ['right-lung', 'heart', 'liver', 'stomach', 'large-intestine', 'small-intestine', 'bladder', 'left-lung', 'spleen', 'gallbladder'], alt: 'The organs of the chest and abdomen with their names' },
  },
  {
    title: 'body-map — explore the digestive system',
    note: 'mode: explore. Tap a part to read its note; tap the same spot again to go one layer deeper (the pancreas lies behind the stomach). State is { selected, seen, seenCount }.',
    spec: { type: 'body-map', view: 'torso', mode: 'explore', show: ['digestive'], alt: 'The digestive system from the food pipe to the rectum' },
  },
  {
    title: 'body-map — highlight groups with a legend',
    spec: {
      type: 'body-map', view: 'body', show: ['digestive'],
      groups: [{ ids: ['food-pipe', 'stomach', 'small-intestine', 'large-intestine', 'rectum'], color: 'blue', label: 'Food passes through' }, { ids: ['liver', 'gallbladder', 'pancreas'], color: 'orange', label: 'Add digestive juices' }],
      alt: 'The digestive system: the tube that food passes through, and the organs that add juices to it',
    },
  },
  {
    title: 'body-map — tap the organ (names stay hidden until the step is over)',
    note: 'mode: pick. State is { picked: "liver", name: "Liver", side }; `answer` is outlined once the widget is read-only.',
    spec: { type: 'body-map', view: 'torso', mode: 'pick', answer: 'liver', alt: 'The organs of the chest and abdomen, without names' },
  },
  {
    title: 'body-map — the skeleton, with layers to switch on',
    note: 'toggles add buttons that keep working after the step is answered. Zoom with the buttons, a pinch or Ctrl + wheel.',
    spec: { type: 'body-map', view: 'body', show: ['skeleton'], toggles: ['skeleton', 'muscles', 'organs'], labels: ['skull', 'ribs', 'pelvis', 'femur', 'tibia', 'humerus'], naming: 'both', alt: 'The skeleton from the front' },
  },
  {
    title: 'body-map — blood through the heart, one step at a time',
    note: 'view: heart with flows and stepThrough. Blue is oxygen-poor blood, red oxygen-rich.',
    spec: {
      type: 'body-map', view: 'heart', stepThrough: true,
      flows: [
        { path: ['superior-vena-cava', 'right-atrium'], color: 'blue', label: 'From the body into the right atrium' },
        { path: ['right-atrium', 'tricuspid-valve', 'right-ventricle'], color: 'blue', label: 'Through the tricuspid valve into the right ventricle' },
        { path: ['right-ventricle', [196, 262], 'pulmonary-artery'], color: 'blue', label: 'Out through the pulmonary artery to the lungs' },
        { path: ['pulmonary-veins', 'left-atrium'], color: 'red', label: 'Back from the lungs into the left atrium' },
        { path: ['left-atrium', 'mitral-valve', 'left-ventricle'], color: 'red', label: 'Through the mitral valve into the left ventricle' },
        { path: ['left-ventricle', [240, 262], 'aorta'], color: 'red', label: 'Out through the aorta to the whole body' },
      ],
      alt: 'The path of blood through the four chambers of the heart',
    },
  },
  {
    title: 'body-map — where would you feel a pulse? (pick a marker)',
    note: 'mode: pickMarker with markerLabels: "after". State is { picked: "b" }.',
    spec: {
      type: 'body-map', view: 'body', mode: 'pickMarker', show: [], markerLabels: 'after', answer: 'b',
      markers: [{ id: 'a', at: 'forehead', label: 'Forehead' }, { id: 'b', at: 'pulse-wrist:left', label: 'Wrist' }, { id: 'c', at: 'knee:left', label: 'Knee' }, { id: 'd', at: 'navel', label: 'Navel' }],
      alt: 'The outline of a body with four lettered points',
    },
  },
  {
    title: 'body-map — hands for chest compressions (place a marker)',
    note: 'mode: place. State gives the region under the marker and its distance in centimetres from the target.',
    spec: { type: 'body-map', view: 'torso', mode: 'place', show: ['ribs', 'breastbone'], ghost: ['ribs'], pin: { label: 'Hands', color: 'red', start: [200, 430] }, target: 'chest-centre', alt: 'The chest and abdomen with the ribs and breastbone faintly shown' },
  },
  {
    title: 'body-map — the head and neck: airway and food pipe',
    spec: {
      type: 'body-map', view: 'head',
      groups: [{ ids: ['nose', 'voice-box', 'windpipe'], color: 'blue', label: 'Air only' }, { ids: ['mouth', 'food-pipe'], color: 'orange', label: 'Food only' }, { ids: ['throat'], color: 'violet', label: 'Shared by both' }],
      labels: ['epiglottis', 'windpipe', 'food-pipe', 'throat', 'tongue'], dim: false,
      alt: 'The head and neck cut open: the windpipe lies in front of the food pipe, and the throat above them is shared',
    },
  },
  {
    title: 'body-map — the back: choose the muscles',
    note: 'mode: pickMany with names: true and a pickable list.',
    spec: { type: 'body-map', view: 'back', mode: 'pickMany', show: ['muscles'], names: true, max: 3, answer: ['glutes', 'hamstrings', 'calves'], alt: 'The muscles of the back of the body' },
  },
  {
    title: 'body-map — a breath of air, from the windpipe to an air sac',
    spec: {
      type: 'body-map', view: 'lungs-detail', labels: ['windpipe', 'bronchi', 'bronchioles', 'air-sacs', 'lung-capillaries'], naming: 'both',
      flows: [{ path: ['windpipe', 'bronchi', 'bronchioles'], color: 'teal', label: 'Air breathed in' }],
      alt: 'The airways branching inside the lungs, with a cluster of air sacs enlarged',
    },
  },
  {
    title: 'body-map — skin and cell, explored',
    spec: { type: 'body-map', view: 'skin', mode: 'explore', alt: 'A block of skin cut through, showing its layers, a hair, glands, vessels and nerve endings' },
  },
];
