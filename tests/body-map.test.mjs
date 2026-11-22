/**
 * body-map: the parts that need no browser. The tables of identifiers that lesson authors rely on, the geometry
 * that turns points into outlines, hit testing, the layout of labels and the state reducers. A few anatomical
 * facts are pinned down too (which side the liver is on), so that a slip in the artwork is noticed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  VIEWS, viewNames, loadView, structureName, structureNameThe, structureInfo, structureIds, anchorIds, systemNames, expandIds,
  coverShare, covers, visibleSamples, stackAt, hitTest, resolvePoint, flowPoints, placeFacts, structureAt, anchorPoint,
  wrapText, wrapToWidth, textWidth, layoutLabels, spreadBadges, placeTag, emptyState, reduce, mergeState, examples,
} from '../src/widgets/body-map.js';
import { STRUCTURES, ANCHORS, ALIASES, SYSTEMS, LAYERS, TONES } from '../assets/body/structures.js';
import { blob, oval, box, tube, loop, ink, rim, flip, shift, turn, grow, pair, pathOf, flat, boxOf, inPolygon, distToSegment, distToLine, lengthOf, pointAlong, route, buildShape, onShape, nearShape } from '../assets/body/draw.js';
import FRONT from '../assets/body/front.js';
import BACK from '../assets/body/back.js';
import HEAD from '../assets/body/head.js';
import HEART from '../assets/body/heart.js';
import LUNGS from '../assets/body/lungs.js';
import SKIN from '../assets/body/skin.js';
import CELL from '../assets/body/cell.js';

const file = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what || 'value'}: ${a} is not within ${tol} of ${b}`);
const MODULES = { front: FRONT, back: BACK, head: HEAD, heart: HEART, lungs: LUNGS, skin: SKIN, cell: CELL };
const HUES = ['blue', 'red', 'green', 'orange', 'violet', 'teal', 'pink', 'yellow', 'gray'];
const built = {};
for (const [name, mod] of Object.entries(MODULES)) built[name] = new Map(mod.shapes.map((def) => [def.id, buildShape(def)]));
await Promise.all(viewNames().map((v) => loadView(v)));

/** A drawing prepared the way the widget prepares it, for the pure helpers that take one. */
function artOf(mod) {
  const shapes = mod.shapes.map((def, z) => {
    const sh = buildShape(def);
    sh.z = z;
    sh.deco = def.id[0] === '_';
    sh.grip = Math.max(...sh.parts.map((p) => (p.k === 'fill' ? Math.min(p.box[2] - p.box[0], p.box[3] - p.box[1]) : p.w)));
    return sh;
  });
  return { id: mod.id, width: mod.width, height: mod.height, cm: mod.cm, region: mod.region, anchors: mod.anchors, shapes, byId: new Map(shapes.map((sh) => [sh.id, sh])), cover: new Map() };
}
const front = artOf(FRONT);
const back = artOf(BACK);
const shownOf = (art, ...lists) => new Set([...expandIds(lists), 'skin'].filter((id) => art.byId.has(id)));

/* ------------------------------------------------------------------ tables */

test('every structure has a kebab-case id, a name, a known system and a one-sentence note', () => {
  const ids = Object.keys(STRUCTURES);
  assert.ok(ids.length >= 110, `only ${ids.length} structures`);
  for (const id of ids) {
    const [name, sci, systems, note] = STRUCTURES[id];
    assert.match(id, /^[a-z]+(-[a-z]+)*$/, `id ${id}`);
    assert.ok(name && name[0] === name[0].toUpperCase() && name.trim() === name, `${id}: name "${name}"`);
    assert.equal(typeof sci, 'string', `${id}: scientific name`);
    if (sci) assert.ok(sci[0] === sci[0].toLowerCase() && sci.toLowerCase() !== name.toLowerCase(), `${id}: scientific name "${sci}" should differ from the plain name and start in lower case`);
    for (const s of systems.split(' ')) assert.ok(SYSTEMS[s] && s !== 'surface', `${id}: unknown system "${s}"`);
    assert.ok(note.length >= 25 && note.length <= 190, `${id}: note has ${note.length} characters`);
    assert.match(note, /^[A-Z].*\.$/, `${id}: note should be a sentence`);
    assert.ok(!/\.\s+[A-Z]/.test(note.replace(/T cells/g, '')), `${id}: note should be ONE sentence`);
    assert.ok(!/ {2}|—|!/.test(note), `${id}: note has stray punctuation`);
  }
});

test('every anchor has a name, a system and a note; paired anchors say so', () => {
  const ids = Object.keys(ANCHORS);
  assert.ok(ids.length >= 40);
  for (const id of ids) {
    const [name, sci, systems, note] = ANCHORS[id];
    assert.match(id, /^[a-z]+(-[a-z]+)*$/);
    assert.ok(!STRUCTURES[id], `${id} is both a structure and an anchor`);
    assert.ok(name && typeof sci === 'string');
    for (const s of systems.split(' ')) assert.ok(SYSTEMS[s], `${id}: unknown system "${s}"`);
    assert.match(note, /^[A-Z].*\.$/, `${id}: note`);
  }
  for (const id of ['shoulder-joint', 'elbow-joint', 'wrist-joint', 'hip-joint', 'knee-joint', 'ankle-joint', 'pulse-neck', 'pulse-wrist', 'pulse-groin', 'pulse-foot']) assert.ok(ANCHORS[id] && ANCHORS[id][4], `${id} should be a paired anchor`);
  for (const id of ['forehead', 'chest-centre', 'navel', 'between-shoulder-blades']) assert.ok(ANCHORS[id] && !ANCHORS[id][4], `${id} should be a single anchor`);
  assert.ok(ANCHORS.breast[4] && !STRUCTURES.breast, 'the breast is a pair of points on the surface, not a drawn structure');
});

test('every structure is drawn in at least one view, with a label point on it', () => {
  for (const id of Object.keys(STRUCTURES)) {
    const homes = Object.keys(MODULES).filter((name) => built[name].has(id));
    assert.ok(homes.length > 0, `${id} is drawn nowhere`);
    for (const name of homes) {
      const sh = built[name].get(id);
      assert.ok(sh.parts.length > 0, `${id} in ${name}: nothing to tap`);
      assert.ok(onShape(sh, sh.at[0], sh.at[1], 0.6), `${id} in ${name}: label point ${sh.at} is not on the shape`);
      for (const side of sh.sides) assert.ok(onShape(sh, sh.atSide[side][0], sh.atSide[side][1], 0.6), `${id} in ${name}: label point for the ${side} side is off the shape`);
      const mod = MODULES[name];
      assert.ok(sh.box[0] >= -30 && sh.box[1] >= -30 && sh.box[2] <= mod.width + 30 && sh.box[3] <= mod.height + 40, `${id} in ${name}: outside the drawing (${sh.box.map(Math.round)})`);
    }
  }
});

test('every anchor has a point in at least one view, inside the figure, and pairs are mirror images', () => {
  for (const id of Object.keys(ANCHORS)) {
    const homes = Object.keys(MODULES).filter((name) => MODULES[name].anchors[id]);
    assert.ok(homes.length > 0, `anchor ${id} has no point in any view`);
    for (const name of homes) {
      const a = MODULES[name].anchors[id];
      const pts = Array.isArray(a) ? [a] : [a.left, a.right];
      for (const p of pts) {
        assert.ok(p && p[0] >= 0 && p[0] <= MODULES[name].width && p[1] >= 0 && p[1] <= MODULES[name].height, `anchor ${id} in ${name}`);
        if (built[name].has('skin')) assert.ok(onShape(built[name].get('skin'), p[0], p[1], 3), `anchor ${id} in ${name} is off the body (${p})`);
      }
      if (name === 'front' || name === 'back') {
        assert.equal(!Array.isArray(a), !!ANCHORS[id][4], `anchor ${id} in ${name}: paired or not?`);
        if (!Array.isArray(a)) {
          near(a.left[0] + a.right[0], 400, 0.01, `${id}: the two sides should mirror about the midline`);
          assert.equal(a.left[1], a.right[1]);
          // facing the viewer the person's left is on the right of the picture; from behind it is on the left
          assert.equal(a.left[0] > 200, name === 'front', `${id} in ${name}: left and right are swapped`);
        } else if (!['right-upper-chest', 'left-side-chest'].includes(id)) near(a[0], 200, 0.01, `${id} should be on the midline`);
      }
    }
  }
  assert.ok(FRONT.anchors['right-upper-chest'][0] < 200 && FRONT.anchors['left-side-chest'][0] > 200, 'the two chest spots are on the person\'s right and left');
});

test('drawings only use ids from the tables, each once', () => {
  for (const [name, mod] of Object.entries(MODULES)) {
    const seen = new Set();
    for (const def of mod.shapes) {
      assert.ok(def.id[0] === '_' || STRUCTURES[def.id], `${name}: unknown structure "${def.id}"`);
      assert.ok(!seen.has(def.id), `${name}: ${def.id} is drawn twice`);
      seen.add(def.id);
      if (def.flow) assert.ok(def.flow.length >= 2 && def.flow.every((p) => onShape(built[name].get(def.id), p[0], p[1], 6)), `${name}: the course of ${def.id} leaves its shape`);
    }
    for (const id of Object.keys(mod.anchors)) assert.ok(ANCHORS[id], `${name}: unknown anchor "${id}"`);
    assert.equal(typeof mod.region, 'function');
  }
});

test('aliases, layers and natural colours refer to things that exist', () => {
  for (const [alias, ids] of Object.entries(ALIASES)) {
    assert.ok(!STRUCTURES[alias] && !SYSTEMS[alias], `alias ${alias} shadows an id or a system`);
    for (const id of ids) assert.ok(STRUCTURES[id], `alias ${alias}: unknown id ${id}`);
  }
  for (const [id, layer] of Object.entries(LAYERS)) { assert.ok(STRUCTURES[id]); assert.ok(layer === 'female' || layer === 'male'); assert.deepEqual(ALIASES[layer].includes(id), true); }
  const tone = ([name, kind]) => (HUES.includes(name) ? kind === '' || kind === 'soft' : ['bone', 'surface', 'ink-2'].includes(name) && kind === '');
  for (const [s, t] of Object.entries(TONES.system)) { assert.ok(SYSTEMS[s]); assert.ok(tone(t), `tone of ${s}`); }
  for (const [id, t] of Object.entries(TONES.id)) { assert.ok(STRUCTURES[id], `tone for unknown id ${id}`); assert.ok(tone(t), `tone of ${id}`); }
});

test('views: each window lies inside its drawing', () => {
  assert.deepEqual(viewNames().slice(0, 2), ['body', 'torso']);
  for (const needed of ['body', 'back', 'torso', 'head', 'heart', 'lungs-detail', 'skin', 'cell']) assert.ok(VIEWS[needed], `view ${needed}`);
  for (const [name, v] of Object.entries(VIEWS)) {
    const mod = MODULES[v.art];
    assert.ok(mod, `${name}: no drawing "${v.art}"`);
    const [x0, y0, x1, y1] = v.box;
    assert.ok(x0 >= 0 && y0 >= 0 && x1 <= mod.width && y1 <= mod.height && x1 - x0 > 50 && y1 - y0 > 50, `${name}: window ${v.box}`);
    assert.ok(v.label && (v.show === 'all' || Array.isArray(v.show)));
  }
  assert.equal(FRONT.cm, 0.2);
  assert.ok(HEART.cm === 0 && CELL.cm === 0);
});

/* --------------------------------------------------- anatomy, pinned down */

test('front view: organs are on the correct side (the figure faces the viewer)', () => {
  const at = (id) => built.front.get(id).at;
  const mid = (id) => { const b = built.front.get(id).box; return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; };
  // on the person's right = the viewer's left (x < 200)
  for (const id of ['liver', 'gallbladder', 'appendix', 'right-lung', 'right-kidney', 'inferior-vena-cava']) assert.ok(mid(id)[0] < 200, `${id} should be on the person's right`);
  // on the person's left = the viewer's right
  for (const id of ['stomach', 'spleen', 'left-lung', 'left-kidney']) assert.ok(mid(id)[0] > 200, `${id} should be on the person's left`);
  assert.ok(mid('heart')[0] > 204, 'most of the heart lies left of the midline');
  const heart = built.front.get('heart');
  const tip = heart.parts[0].pts.reduce((a, p) => (p[1] > a[1] ? p : a));
  assert.ok(tip[0] > 215, `the tip of the heart should point to the person's left (viewer's right), not x = ${tip[0]}`);
  assert.ok(built.front.get('liver').box[2] > 200, 'the left lobe of the liver crosses the midline');
  assert.ok(mid('right-kidney')[1] > mid('left-kidney')[1], 'the right kidney sits lower than the left');
  assert.ok(at('pancreas')[0] < 200 && built.front.get('pancreas').box[2] > 240, 'the head of the pancreas is on the right, its tail reaches the spleen');
  // from the top down
  const order = ['brain', 'thyroid', 'heart', 'diaphragm', 'stomach', 'small-intestine', 'bladder'];
  for (let i = 1; i < order.length; i++) assert.ok(mid(order[i - 1])[1] < mid(order[i])[1], `${order[i - 1]} should be above ${order[i]}`);
  assert.ok(built.front.get('right-lung').box[3] < built.front.get('liver').box[1] + 12, 'the liver lies under the right lung');
  assert.ok(built.front.get('heart').box[3] <= built.front.get('diaphragm').box[3], 'the heart sits on the diaphragm');
  // paired parts carry the person's side
  for (const p of built.front.get('femur').parts) assert.equal(p.side, (p.box[0] + p.box[2]) / 2 < 200 ? 'right' : 'left');
  assert.deepEqual(built.front.get('right-lung').sides, ['right']);
  // the thumb, the radius and the wrist pulse are on the outer side of the forearm (palms forward)
  const radius = built.front.get('radius').parts.filter((p) => p.side === 'right');
  const ulna = built.front.get('ulna').parts.filter((p) => p.side === 'right');
  assert.ok(Math.min(...radius.map((p) => p.box[0])) < Math.min(...ulna.map((p) => p.box[0])), 'the radius is the outer bone of the forearm');
  assert.ok(FRONT.anchors['pulse-wrist'].right[0] < FRONT.anchors.wrist.right[0], 'the wrist pulse is on the thumb side');
  // the fibula is the outer bone of the lower leg
  assert.ok(built.front.get('fibula').atSide.right[0] < built.front.get('tibia').atSide.right[0]);
});

test('back view: left and right swap with the viewpoint', () => {
  const mid = (id) => { const b = built.back.get(id).box; return (b[0] + b[2]) / 2; };
  assert.ok(mid('left-kidney') < 200 && mid('right-kidney') > 200);
  assert.ok(built.back.get('left-kidney').box[1] < built.back.get('right-kidney').box[1], 'the left kidney is the higher one');
  assert.ok(mid('left-lung') < 200 && mid('right-lung') > 200);
  for (const p of built.back.get('femur').parts) assert.equal(p.side, (p.box[0] + p.box[2]) / 2 < 200 ? 'left' : 'right');
  for (const id of ['trapezius', 'latissimus', 'glutes', 'hamstrings', 'calves', 'triceps', 'shoulder-blade', 'thoracic-spine', 'lumbar-spine', 'sacrum']) assert.ok(built.back.has(id), `${id} from behind`);
  assert.equal(BACK.region(160, 250).region, 'upper-back');
  assert.equal(BACK.region(160, 250).side, 'left');
  assert.equal(BACK.region(240, 350).region, 'lower-back');
  assert.equal(BACK.region(240, 450).region, 'buttocks');
});

test('head view: the airway is in front of the food pipe; heart view: the right heart is on the viewer\'s left', () => {
  const mid = (map, id) => { const b = map.get(id).box; return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; };
  // the face looks to the viewer's left, so "in front" is a smaller x
  assert.ok(mid(built.head, 'windpipe')[0] < mid(built.head, 'food-pipe')[0], 'windpipe in front of the food pipe');
  assert.ok(mid(built.head, 'food-pipe')[0] < mid(built.head, 'cervical-spine')[0], 'food pipe in front of the spine');
  assert.ok(mid(built.head, 'frontal-lobe')[0] < mid(built.head, 'parietal-lobe')[0] && mid(built.head, 'parietal-lobe')[0] < mid(built.head, 'occipital-lobe')[0], 'lobes from front to back');
  assert.ok(mid(built.head, 'cerebellum')[1] > mid(built.head, 'occipital-lobe')[1] && mid(built.head, 'pituitary')[1] > mid(built.head, 'hypothalamus')[1]);
  assert.ok(mid(built.head, 'nose')[1] < mid(built.head, 'mouth')[1] && mid(built.head, 'epiglottis')[1] < mid(built.head, 'voice-box')[1]);
  assert.ok(mid(built.heart, 'right-atrium')[0] < mid(built.heart, 'left-atrium')[0] && mid(built.heart, 'right-ventricle')[0] < mid(built.heart, 'left-ventricle')[0]);
  assert.ok(mid(built.heart, 'right-atrium')[1] < mid(built.heart, 'right-ventricle')[1], 'atria above ventricles');
  assert.ok(mid(built.heart, 'tricuspid-valve')[0] < 200 && mid(built.heart, 'mitral-valve')[0] > 260);
  assert.ok(Math.abs(mid(built.heart, 'pulmonary-valve')[0] - mid(built.heart, 'right-ventricle')[0]) < 40, 'the pulmonary valve leaves the right ventricle');
  assert.ok(mid(built.heart, 'aortic-valve')[0] > mid(built.heart, 'septum')[0], 'the aortic valve leaves the left ventricle');
});

/* ---------------------------------------------------------------- geometry */

test('draw: outlines, paths and transforms', () => {
  const square = blob([[0, 0, 1], [10, 0, 1], [10, 10, 1], [0, 10, 1]]);
  assert.equal(square.k, 'fill');
  assert.match(pathOf(square), /^M0 0C.*Z$/);
  assert.equal(flat(square).length, 4 * 6);
  const circle = oval(50, 50, 10, 10);
  for (const p of flat(circle, 8)) near(Math.hypot(p[0] - 50, p[1] - 50), 10, 0.01, 'point on the circle');
  assert.deepEqual(boxOf(flat(box(5, 6, 20, 10, 3))).map((v) => Math.round(v)), [5, 6, 25, 16]);
  const line = tube([[0, 0], [10, 0], [20, 0]], 4);
  assert.ok(!pathOf(line).endsWith('Z'));
  near(lengthOf(flat(line)), 20, 0.01, 'length');
  assert.equal(loop([[0, 0], [10, 0], [10, 10], [0, 10]], 2).k, 'tube');
  assert.equal(ink([[0, 0], [1, 1]]).k, 'ink');
  assert.equal(rim(circle).k, 'ink');
  // a mirror image keeps its points but is written the same way round, so that overlapping pieces merge
  const mirrored = flip(square, 20)[0];
  assert.deepEqual(boxOf(flat(mirrored)).map(Math.round), [30, 0, 40, 10]);
  const signed = (d) => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); let a = 0; for (let i = 0; i + 7 < n.length - 2; i += 6) a += n[i] * n[i + 7] - n[i + 6] * n[i + 1]; return Math.sign(a); };
  assert.equal(signed(pathOf(square)), signed(pathOf(mirrored)), 'both outlines run the same way round');
  assert.deepEqual(boxOf(flat(shift(square, 5, -5)[0])).map(Math.round), [5, -5, 15, 5]);
  assert.deepEqual(boxOf(flat(grow(square, 2, 0, 0)[0])).map(Math.round), [0, 0, 20, 20]);
  assert.equal(grow(line, 2)[0].w, 8);
  assert.deepEqual(boxOf(flat(turn(square, 90, 0, 0)[0])).map(Math.round), [-10, 0, 0, 10]);
  const two = pair([circle], 100, 'right', 'left');
  assert.deepEqual(two.map((p) => p.side), ['right', 'left']);
  near(boxOf(flat(two[1]))[0], 140, 0.05, 'mirror image');
});

test('draw: points, distances and built structures', () => {
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]];
  assert.ok(inPolygon(sq, 5, 5) && !inPolygon(sq, 15, 5) && !inPolygon(sq, 5, -1));
  near(distToSegment(5, 5, [0, 0], [10, 0]), 5, 1e-9);
  near(distToSegment(-3, 4, [0, 0], [10, 0]), 5, 1e-9);
  near(distToLine(sq, 5, 12, true), 2, 1e-9, 'closed outline');
  near(distToLine(sq, -2, 5, false), Math.hypot(2, 5), 1e-9, 'open line: the fourth side is missing, so the nearest point is a corner');
  const mid = pointAlong([[0, 0], [10, 0], [10, 10]], 0.75);
  near(mid.x, 10, 1e-9); near(mid.y, 5, 1e-9); near(mid.deg, 90, 1e-9);
  assert.deepEqual([pointAlong([[0, 0], [10, 0]], -1).x, pointAlong([[0, 0], [10, 0]], 2).x], [0, 10]);
  const r = route([[0, 0], [50, 0], [50, 50]]);
  assert.match(r.d, /^M0 0C/);
  assert.ok(r.pts.length > 10);
  const shape = buildShape({ id: 'x', parts: [...pair([oval(30, 50, 10, 6)], 50), tube([[0, 0], [100, 0]], 4), tube([[0, 4], [100, 4]], 4), tube([[0, 20], [100, 20]], 2, { tone: 'red' }), ink([[0, 0], [5, 5]])] });
  assert.equal(shape.fills.length, 1);
  assert.equal(shape.tubes.length, 2, 'tubes of one width and colour share a path');
  assert.ok(shape.inks.startsWith('M'));
  assert.deepEqual(shape.sides.sort(), ['left', 'right']);
  assert.ok(onShape(shape, 30, 50) && onShape(shape, 70, 50) && !onShape(shape, 50, 50));
  assert.ok(onShape(shape, 50, 1.9) && !onShape(shape, 50, 12) && onShape(shape, 50, 12, 6.1), 'tubes are as thick as their width; reach widens them');
  assert.equal(nearShape(shape, 28, 50).side, 'right');
  near(nearShape(shape, 30, 60).d, 4, 0.2, 'distance to the edge of the oval');
  assert.ok(onShape(shape, shape.atSide.left[0], shape.atSide.left[1]) && shape.atSide.left[0] > 50);
});

test('hit testing: the topmost visible structure wins, and small ones get a larger target', () => {
  const organs = shownOf(front, 'organs');
  assert.equal(hitTest(front, 192, 302, { shown: organs }).id, 'liver');
  assert.equal(hitTest(front, 163, 332, { shown: organs }).id, 'gallbladder', 'the gallbladder lies on top of the liver');
  assert.equal(hitTest(front, 160, 215, { shown: organs }).id, 'right-lung');
  assert.equal(hitTest(front, 160, 215, { shown: organs }).side, 'right');
  assert.equal(hitTest(front, 212, 262, { shown: organs }).id, 'heart');
  assert.equal(hitTest(front, 120, 500, { shown: organs }), null, 'bare skin is not a structure');
  assert.equal(hitTest(front, 120, 500, { shown: organs, pickable: new Set(['skin']) }).id, 'skin');
  assert.equal(hitTest(front, 5, 5, { shown: organs }), null);
  // only what is shown can be hit
  assert.equal(hitTest(front, 192, 302, { shown: shownOf(front, 'skeleton') }), null);
  assert.equal(hitTest(front, 200, 250, { shown: shownOf(front, 'skeleton') }).id, 'breastbone');
  // the kidney is behind the liver: an opaque liver hides it, a see-through one does not
  const both = shownOf(front, 'liver', 'right-kidney');
  assert.ok(onShape(front.byId.get('right-kidney'), 160, 320) && onShape(front.byId.get('liver'), 160, 320));
  assert.equal(hitTest(front, 160, 320, { shown: both }).id, 'liver');
  assert.equal(hitTest(front, 160, 320, { shown: both, pickable: new Set(['right-kidney']) }), null, 'hidden behind something opaque');
  assert.equal(hitTest(front, 160, 320, { shown: both, pickable: new Set(['right-kidney']), ghost: new Set(['liver']) }).id, 'right-kidney');
  // reach: a near miss still finds a small structure, and never something large
  const few = shownOf(front, 'adrenals', 'kidneys');
  const cap = front.byId.get('adrenals');
  const above = [cap.atSide.right[0], cap.parts.find((p) => p.side === 'right').box[1] - 4];
  assert.equal(hitTest(front, above[0], above[1], { shown: few }), null);
  assert.equal(hitTest(front, above[0], above[1], { shown: few, reach: 6, small: 20 }).id, 'adrenals');
  const under = [150, front.byId.get('liver').box[3] + 3];
  assert.equal(hitTest(front, under[0], under[1], { shown: shownOf(front, 'liver') }), null, 'just below the liver');
  assert.ok(nearShape(front.byId.get('liver'), under[0], under[1]).d < 6);
  assert.equal(hitTest(front, under[0], under[1], { shown: shownOf(front, 'liver'), reach: 6, small: 20 }), null, 'the liver is not small: no extra reach');
  // squarely on something large, a small neighbour needs a nearer miss
  const duo = shownOf(front, 'liver', 'gallbladder');
  assert.equal(hitTest(front, 160, 312, { shown: duo, reach: 12, small: 30 }).id, 'liver');
  assert.equal(hitTest(front, 162, 316, { shown: duo, reach: 12, small: 30 }).id, 'gallbladder');
});

test('focus: a structure the author asked for is reached through the see-through ones in front of it', () => {
  const shown = shownOf(front, 'liver', 'stomach', 'adrenals', 'kidneys', 'heart');
  const pickable = new Set(['liver', 'stomach', 'adrenals', 'heart']);
  const cap = front.byId.get('adrenals').parts.find((p) => p.side === 'right');
  const on = [(cap.box[0] + cap.box[2]) / 2, cap.box[3] - 3];        // on the right adrenal gland, under the liver
  assert.ok(onShape(front.byId.get('adrenals'), on[0], on[1]) && onShape(front.byId.get('liver'), on[0], on[1]), 'the test point is on both');
  const veil = new Set(['liver', 'stomach']);
  const first = new Set(['adrenals']);
  // as it always was: the nearest pickable structure wins, see-through or not
  assert.equal(hitTest(front, on[0], on[1], { shown, pickable }).id, 'liver');
  assert.equal(hitTest(front, on[0], on[1], { shown, pickable, ghost: veil }).id, 'liver');
  assert.equal(hitTest(front, on[0], on[1], { shown, pickable, ghost: veil, first: new Set() }).id, 'liver', 'an empty `first` changes nothing');
  // with `first`, the deeper structure wins where the finger is on it …
  const hit = hitTest(front, on[0], on[1], { shown, pickable, ghost: veil, first });
  assert.deepEqual([hit.id, hit.side], ['adrenals', 'right']);
  // … the structures in front stay tappable everywhere else …
  assert.equal(hitTest(front, 192, 302, { shown, pickable, ghost: veil, first }).id, 'liver');
  assert.equal(hitTest(front, 150, 330, { shown, pickable, ghost: veil, first }).id, 'liver');
  assert.equal(hitTest(front, 236, 330, { shown, pickable, ghost: veil, first }).id, 'stomach');
  assert.equal(hitTest(front, 212, 262, { shown, pickable, ghost: veil, first }).id, 'heart');
  // … and something opaque in front still hides it
  assert.equal(hitTest(front, on[0], on[1], { shown, pickable, first }).id, 'liver', 'the liver is not see-through here');
  assert.equal(hitTest(front, on[0], on[1], { shown, pickable: new Set(['adrenals', 'heart']), first }), null, 'an opaque liver that cannot be picked is a wall');
  assert.equal(hitTest(front, on[0], on[1], { shown, pickable: new Set(['adrenals', 'heart']), ghost: veil, first }).id, 'adrenals');
  // a near miss still finds a small structure that was asked for, through what lies in front of it
  const miss = [(cap.box[0] + cap.box[2]) / 2, cap.box[3] + 2];
  assert.ok(!onShape(front.byId.get('adrenals'), miss[0], miss[1]) && onShape(front.byId.get('liver'), miss[0], miss[1]));
  assert.equal(hitTest(front, miss[0], miss[1], { shown, pickable, ghost: veil, reach: 8, small: 20 }).id, 'liver');
  assert.equal(hitTest(front, miss[0], miss[1], { shown, pickable, ghost: veil, first, reach: 8, small: 20 }).id, 'adrenals');
  // without `first` every answer is what it was, see-through structures or not: a sweep over the trunk
  const organs = shownOf(front, 'organs', 'adrenals');
  const seeThrough = new Set(['liver', 'stomach', 'large-intestine', 'small-intestine']);
  let won = 0;
  for (let y = 160; y <= 490; y += 6) {
    for (let x = 100; x <= 300; x += 6) {
      const plain = hitTest(front, x, y, { shown: organs, ghost: seeThrough, reach: 6, small: 20 });
      assert.deepEqual(hitTest(front, x, y, { shown: organs, ghost: seeThrough, first: null, reach: 6, small: 20 }), plain);
      // and with it, only points on or beside the structure asked for can change
      const asked = hitTest(front, x, y, { shown: organs, ghost: seeThrough, first: new Set(['right-kidney']), reach: 6, small: 20 });
      if (JSON.stringify(asked) !== JSON.stringify(plain)) { assert.equal(asked.id, 'right-kidney', `at ${x}, ${y}`); won++; }
    }
  }
  assert.ok(won >= 5, `the kidney should be reachable through the liver and the gut in several places, not ${won}`);
});

test('overlap: what covers what', () => {
  assert.ok(coverShare(front, 'stomach', 'pancreas') > 0.2, 'the stomach hides much of the pancreas');
  assert.ok(coverShare(front, 'bronchi', 'right-lung') < 0.2, 'the bronchi hide little of a lung');
  assert.equal(coverShare(front, 'bladder', 'brain'), 0);
  assert.ok(covers(front, 'ribs', 'heart') && covers(front, 'liver', 'right-kidney') && !covers(front, 'heart', 'liver'));
  const organs = shownOf(front, 'organs');
  const kidney = visibleSamples(front, 'left-kidney', organs);
  assert.ok(kidney.length < front.byId.get('left-kidney').samples.length, 'part of the left kidney is hidden by the organs in front');
  assert.equal(visibleSamples(front, 'left-kidney', shownOf(front, 'kidneys')).length, front.byId.get('left-kidney').samples.length);
  assert.equal(visibleSamples(front, 'left-kidney', organs, organs).length, front.byId.get('left-kidney').samples.length, 'see-through things hide nothing');
  assert.deepEqual(stackAt(front, 232, 322, shownOf(front, 'digestive')), ['stomach', 'pancreas', 'skin']);
  assert.deepEqual(stackAt(front, 5, 5, organs), []);
});

test('points: anchors, sides, structures and coordinates', () => {
  assert.deepEqual(resolvePoint(front, [10, 20]).points, [[10, 20]]);
  assert.deepEqual(resolvePoint(front, 'chest-centre').points, [[200, 262]]);
  assert.equal(resolvePoint(front, 'pulse-wrist').points.length, 2);
  assert.ok(resolvePoint(front, 'pulse-wrist:left').points[0][0] > 200 && resolvePoint(front, 'pulse-wrist:right').points[0][0] < 200);
  assert.ok(resolvePoint(back, 'elbow:left').points[0][0] < 200, 'from behind the left elbow is on the left');
  assert.deepEqual(resolvePoint(front, 'liver').points, [front.byId.get('liver').at]);
  assert.ok(resolvePoint(front, 'femur:left').points[0][0] > 200);
  assert.equal(resolvePoint(front, 'femur').points.length, 2);
  assert.deepEqual(resolvePoint(front, 'chest-centre:left').points, [[200, 262]], 'a side on something that has none is ignored');
  for (const bad of ['no-such-thing', 'heel', null, [1], {}]) assert.equal(resolvePoint(front, bad), null, `${JSON.stringify(bad)}`);
  assert.deepEqual(anchorPoint('body', 'navel'), [200, 370]);
  assert.deepEqual(anchorPoint('body', 'breast:left'), [236, 258]);
  assert.deepEqual(anchorPoint('torso', 'breast:right'), [164, 258]);
  assert.equal(FRONT.region(236, 258).region, 'chest');
  assert.deepEqual(anchorPoint('torso', 'pulse-neck:right'), FRONT.anchors['pulse-neck'].right);
  assert.equal(anchorPoint('nowhere', 'navel'), null);
  assert.equal(structureAt('torso', [192, 302]), 'liver');
  assert.equal(structureAt('torso', [192, 302], { show: ['skeleton'] }), null);
  assert.equal(structureAt('heart', [136, 184]), 'right-atrium');
  assert.equal(structureAt('body', [200, 250], { show: ['skeleton'] }), 'breastbone');
});

test('flows follow the course of a tube, in the direction that joins up', () => {
  const down = flowPoints(front, ['mouth', 'food-pipe', 'stomach']);
  assert.ok(down.length > 6);
  for (let i = 2; i < 5; i++) assert.ok(down[i][1] > down[i - 1][1], 'food goes down the food pipe');
  const up = flowPoints(front, ['stomach', 'food-pipe', 'mouth']);
  assert.ok(up[up.length - 2][1] < up[up.length - 4][1], 'and the other way when the stops are reversed');
  const blood = flowPoints(front, ['inferior-vena-cava', 'heart']);
  assert.ok(blood[0][1] > blood[blood.length - 1][1], 'blood in the lower main vein flows up to the heart');
  assert.deepEqual(flowPoints(front, [[1, 2], 'no-such-thing', [3, 4]]), [[1, 2], [3, 4]]);
  assert.deepEqual(flowPoints(front, ['navel', 'navel', [200, 370]]), [[200, 370]], 'repeated points are dropped');
  const gut = flowPoints(front, ['small-intestine', 'large-intestine', 'rectum']);
  assert.ok(gut.length > 40 && gut[gut.length - 1][1] > 470, 'ends at the bottom of the rectum');
});

test('place mode: what is under the marker and how far from the target', () => {
  const shown = shownOf(front, 'ribs', 'breastbone');
  const target = [{ id: 'target', points: resolvePoint(front, 'chest-centre').points }];
  const hit = placeFacts(front, [200, 262], { shown, targets: target });
  assert.deepEqual(hit, { structure: 'breastbone', region: 'chest', side: null, distances: { target: 0 }, nearest: 'target', distance: 0 });
  const low = placeFacts(front, [170, 380], { shown, targets: target });
  assert.equal(low.structure, null);
  assert.equal(low.region, 'abdomen');
  assert.equal(low.side, 'right');
  near(low.distance, Math.hypot(30, 118) * 0.2, 0.06, 'centimetres: five units to the centimetre');
  const wrists = [{ id: 'wrist', points: resolvePoint(front, 'pulse-wrist').points }, { id: 'neck', points: resolvePoint(front, 'pulse-neck').points }];
  const p = FRONT.anchors['pulse-wrist'].right;
  const fx = placeFacts(front, [p[0] + 5, p[1]], { shown: shownOf(front), targets: wrists });
  assert.equal(fx.nearest, 'wrist');
  assert.equal(fx.distance, 1, 'either wrist counts: the nearer one is measured');
  assert.ok(fx.distances.neck > 50);
  assert.equal(fx.region, 'wrist');
  assert.deepEqual(placeFacts(front, [2, 2], { shown: shownOf(front) }), { structure: null, region: null, side: null });
  // schematic views have no scale: per cent of the picture's width
  const heart = artOf(HEART);
  const far = placeFacts(heart, [46, 100], { shown: new Set(heart.shapes.map((s) => s.id)), targets: [{ id: 't', points: [[276, 100]] }] });
  assert.equal(far.distance, 50);
});

test('regions of the body surface, with the person\'s own sides', () => {
  const r = (x, y) => { const v = FRONT.region(x, y); return v ? `${v.region}${v.side ? `:${v.side}` : ''}` : null; };
  assert.equal(r(200, 60), 'head');
  assert.equal(r(200, 160), 'neck');
  assert.equal(r(200, 262), 'chest');
  assert.equal(r(160, 262), 'chest:right');
  assert.equal(r(240, 340), 'abdomen:left');
  assert.equal(r(200, 440), 'pelvis');
  assert.equal(r(97, 280), 'upper-arm:right');
  assert.equal(r(303, 280), 'upper-arm:left');
  assert.equal(r(74, 402), 'forearm:right');
  assert.equal(r(59, 466), 'wrist:right');
  assert.equal(r(49, 506), 'hand:right');
  assert.equal(r(152, 536), 'thigh:right');
  assert.equal(r(238, 636), 'knee:left');
  assert.equal(r(165, 742), 'lower-leg:right');
  assert.equal(r(160, 866), 'foot:right');
  assert.equal(r(10, 10), null);
  assert.equal(r(120, 300), null, 'between the arm and the trunk');
  assert.equal(HEAD.region(200, 200), null);
});

/* ------------------------------------------------------------------ labels */

test('labels: wrapping and widths', () => {
  assert.deepEqual(wrapText('Small intestine', 10), ['Small', 'intestine']);
  assert.deepEqual(wrapText('Small intestine', 20), ['Small intestine']);
  assert.deepEqual(wrapText('Lower-back vertebrae (lumbar spine)', 12), ['Lower-back', 'vertebrae', '(lumbar', 'spine)']);
  assert.deepEqual(wrapText('Hypothalamus', 5), ['Hypothalamus'], 'a long word keeps its line');
  assert.deepEqual(wrapText('  ', 5), []);
  assert.ok(textWidth('Liver', 12) < textWidth('Large intestine', 12));
  assert.ok(textWidth('mmmm', 12) > textWidth('illi', 12) * 2, 'wide and narrow letters differ');
  near(textWidth('Gallbladder', 12), 66, 4, 'close to the measured width of the real font');
  near(textWidth('Hypothalamus', 12), 81, 4);
  assert.deepEqual(wrapToWidth('Small intestine', 60, 12), ['Small', 'intestine']);
  assert.deepEqual(wrapToWidth('Small intestine', 100, 12), ['Small intestine']);
  assert.deepEqual(wrapToWidth('Hypothalamus', 20, 12), ['Hypothalamus']);
});

test('labels: two columns, no collisions, leaders to the anchors', () => {
  const o = { W: 600, H: 480, win: [150, 0, 450, 480], unit: 1, size: 12 };
  const items = [
    { id: 'a', text: 'Liver', x: 220, y: 200 }, { id: 'b', text: 'Gallbladder', x: 225, y: 206 }, { id: 'c', text: 'Right lung', x: 210, y: 120 },
    { id: 'd', text: 'Stomach', x: 380, y: 204 }, { id: 'e', text: 'Spleen', x: 400, y: 200 }, { id: 'f', text: 'Large intestine', x: 390, y: 300 }, { id: 'g', text: 'Bladder', x: 300, y: 470 },
  ];
  const res = layoutLabels(items, o);
  assert.ok(res.ok);
  assert.equal(res.labels.length, items.length);
  const by = Object.fromEntries(res.labels.map((l) => [l.id, l]));
  assert.deepEqual(['a', 'b', 'c'].map((id) => by[id].column), ['left', 'left', 'left']);
  assert.deepEqual(['d', 'e', 'f'].map((id) => by[id].column), ['right', 'right', 'right']);
  for (const l of res.labels) {
    assert.equal(l.anchor, l.column === 'left' ? 'end' : 'start');
    assert.ok(l.column === 'left' ? l.x < o.win[0] : l.x > o.win[2], 'names stand outside the figure');
    const w = Math.max(...l.lines.map((t) => textWidth(t, 12)));
    assert.ok(l.column === 'left' ? l.x - w >= 0 : l.x + w <= o.W, `${l.id} runs off the picture`);
    const top = l.cy - (l.lines.length * l.lh) / 2;
    assert.ok(top >= 0 && top + l.lines.length * l.lh <= o.H, `${l.id} runs off the top or bottom`);
    assert.deepEqual(l.leader[2], l.at);
    assert.equal(l.leader[0][1], l.leader[1][1], 'the leader leaves the name level');
  }
  for (const column of ['left', 'right']) {
    const list = res.labels.filter((l) => l.column === column).sort((p, q) => p.cy - q.cy);
    for (let i = 1; i < list.length; i++) {
      const gap = (list[i].cy - (list[i].lines.length * list[i].lh) / 2) - (list[i - 1].cy + (list[i - 1].lines.length * list[i - 1].lh) / 2);
      assert.ok(gap >= 4.9, `${list[i - 1].id} and ${list[i].id} overlap (gap ${gap})`);
      assert.ok(list[i].at[1] >= list[i - 1].at[1], 'names keep the order of their structures, so leaders do not cross');
    }
  }
  assert.ok(by.g.cy < 480 - 6, 'a name at the very bottom is pushed up into the picture');
  assert.equal(by.f.lines.length, 1);
});

test('labels: sides, crowding and failure', () => {
  const o = { W: 600, H: 300, win: [150, 0, 450, 300], unit: 1, size: 12 };
  // something drawn on both sides goes to the emptier column, pointing at its part on that side
  const res = layoutLabels([{ id: 'a', text: 'Liver', x: 200, y: 100 }, { id: 'k', text: 'Kidney', x: 250, y: 150, alt: [350, 150] }], o);
  const k = res.labels.find((l) => l.id === 'k');
  assert.equal(k.column, 'right');
  assert.deepEqual(k.at, [350, 150]);
  const forced = layoutLabels([{ id: 'k', text: 'Kidney', x: 250, y: 150, alt: [350, 150], column: 'left' }, { id: 'z', text: 'Heart', x: 400, y: 80, column: 'left' }], o);
  assert.deepEqual(forced.labels.map((l) => l.column), ['left', 'left']);
  assert.deepEqual(forced.labels.find((l) => l.id === 'k').at, [250, 150]);
  // a full column hands names to the other one
  const many = Array.from({ length: 16 }, (_, i) => ({ id: `n${i}`, text: 'Name', x: 160 + i * 4, y: 20 + i * 16 }));
  const spread = layoutLabels(many, o);
  assert.ok(spread.ok);
  assert.ok(spread.labels.filter((l) => l.column === 'right').length >= 1);
  // too many for the height, or a word too wide for the column: say so
  assert.equal(layoutLabels(Array.from({ length: 40 }, (_, i) => ({ id: `n${i}`, text: 'Name', x: 200, y: i * 5 })), o).ok, false);
  assert.equal(layoutLabels([{ id: 'a', text: 'Gastrocnemius', x: 200, y: 100 }], { ...o, win: [60, 0, 540, 300] }).ok, false);
  // text is the same size on screen whatever the scale: at 2 units per pixel it needs twice the room
  assert.equal(layoutLabels([{ id: 'a', text: 'Large intestine', x: 200, y: 100 }], { ...o, unit: 1 }).labels[0].lines.length, 1);
  assert.equal(layoutLabels([{ id: 'a', text: 'Large intestine', x: 200, y: 100 }], { ...o, unit: 2 }).labels[0].lines.length, 2);
  assert.deepEqual(layoutLabels([], o), { ok: true, labels: [] });
});

test('badges and marker labels keep clear of one another', () => {
  const pts = spreadBadges([[100, 100], [102, 100], [100, 101], [300, 300]], 20, [0, 0, 400, 400]);
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) assert.ok(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) >= 19.5, `badges ${i} and ${j}`);
  assert.deepEqual(pts[3], [300, 300], 'a badge with room stays where it is');
  const same = spreadBadges([[10, 10], [10, 10]], 16, [0, 0, 100, 100]);
  assert.ok(Math.hypot(same[0][0] - same[1][0], same[0][1] - same[1][1]) >= 15.5);
  const taken = [[110, 90, 200, 110]];
  const tag = placeTag([100, 100], 'Wrist', { unit: 1, size: 12, r: 6, prefer: 'right', frame: [0, 0, 600, 400] }, taken);
  assert.notEqual(tag.anchor, 'start', 'the right side is taken');
  assert.equal(taken.length, 2);
  const edge = placeTag([590, 100], 'Wrist pulse', { unit: 1, size: 12, r: 6, prefer: 'right', frame: [0, 0, 600, 400] }, []);
  assert.equal(edge.anchor, 'end', 'a label that would run off the picture moves to the other side');
  const free = placeTag([100, 100], 'Knee', { unit: 1, size: 12, r: 6, prefer: 'bottom' }, []);
  assert.equal(free.anchor, 'middle');
  assert.ok(free.y > 100);
});

/* ------------------------------------------------------------------- state */

test('reduce: picking one, picking several, exploring, placing, stepping', () => {
  let st = emptyState();
  let r = reduce(st, { type: 'tap', id: 'liver', side: null }, { mode: 'pick' });
  assert.equal(r.said, 'chosen');
  assert.deepEqual(r.state.picked, ['liver']);
  assert.deepEqual(st.picked, [], 'the old state is left alone');
  r = reduce(r.state, { type: 'tap', id: 'femur', side: 'left' }, { mode: 'pick' });
  assert.deepEqual([r.state.picked, r.state.side], [['femur'], 'left']);
  r = reduce(r.state, { type: 'tap', id: 'femur' }, { mode: 'pick' });
  assert.deepEqual([r.said, r.state.picked, r.state.side], ['released', [], null]);

  st = emptyState();
  for (const id of ['liver', 'stomach']) st = reduce(st, { type: 'tap', id }, { mode: 'pickMany', max: 2 }).state;
  r = reduce(st, { type: 'tap', id: 'spleen' }, { mode: 'pickMany', max: 2 });
  assert.equal(r.said, 'full');
  assert.equal(r.state, st);
  r = reduce(st, { type: 'tap', id: 'liver' }, { mode: 'pickMany', max: 2 });
  assert.deepEqual(r.state.picked, ['stomach']);
  assert.deepEqual(reduce(st, { type: 'clear' }, { mode: 'pickMany' }).state.picked, []);
  assert.equal(reduce(emptyState(), { type: 'clear' }, { mode: 'pickMany' }).said, '');

  st = emptyState();
  for (const id of ['stomach', 'liver', 'stomach']) st = reduce(st, { type: 'tap', id, toggle: false }, { mode: 'explore' }).state;
  assert.deepEqual([st.selected, st.seen], ['stomach', ['stomach', 'liver']], 'seen keeps the order of first sight');
  assert.equal(reduce(st, { type: 'tap', id: 'stomach' }, { mode: 'view' }).state.selected, null, 'in view mode a second tap closes the name');

  r = reduce(emptyState(), { type: 'move', at: [200.04, 261.96] }, { mode: 'place' });
  assert.deepEqual([r.state.at, r.state.placed, r.said], [[200, 262], true, 'moved']);
  assert.equal(reduce(emptyState(), { type: 'move', at: [1, 2] }, { mode: 'pick' }).said, '');
  assert.equal(reduce(emptyState(), { type: 'tap', id: 'liver' }, { mode: 'place' }).said, '');

  r = reduce(emptyState(), { type: 'step', by: 1 }, { steps: 3 });
  assert.deepEqual([r.state.step, r.state.stepMax], [2, 2]);
  assert.equal(reduce(emptyState(), { type: 'step', by: -1 }, { steps: 3 }).said, '');
  assert.equal(reduce({ ...emptyState(), step: 3 }, { type: 'step', by: 1 }, { steps: 3 }).said, '');
  assert.equal(reduce(emptyState(), { type: 'tap' }, { mode: 'pick' }).said, '');
});

test('mergeState: an author-written solution restores the state', () => {
  const valid = (id) => !!STRUCTURES[id];
  assert.deepEqual(mergeState(emptyState(), { picked: 'liver' }, { mode: 'pick', valid }).picked, ['liver']);
  assert.deepEqual(mergeState(emptyState(), 'liver', { mode: 'pick', valid }).picked, ['liver'], 'a bare id works too');
  assert.deepEqual(mergeState(emptyState(), { picked: ['liver', 'stomach'] }, { mode: 'pick', valid }).picked, ['liver'], 'pick keeps one');
  assert.deepEqual(mergeState(emptyState(), { picked: ['liver', 'nonsense', 'liver', 'stomach'] }, { mode: 'pickMany', valid }).picked, ['liver', 'stomach']);
  assert.deepEqual(mergeState({ ...emptyState(), picked: ['liver'] }, { picked: null }, { mode: 'pick', valid }).picked, []);
  assert.equal(mergeState(emptyState(), { picked: 'femur', side: 'left' }, { mode: 'pick', valid }).side, 'left');
  const seen = mergeState(emptyState(), { seen: ['liver', 'stomach'] }, { mode: 'explore', valid });
  assert.deepEqual([seen.seen, seen.selected], [['liver', 'stomach'], 'stomach'], 'the last one seen is opened');
  const sel = mergeState(seen, { selected: 'spleen' }, { mode: 'explore', valid });
  assert.deepEqual([sel.seen, sel.selected], [['liver', 'stomach', 'spleen'], 'spleen']);
  const placed = mergeState(emptyState(), { at: 'chest-centre' }, { mode: 'place', place: (ref) => (ref === 'chest-centre' ? [200, 262] : null) });
  assert.deepEqual([placed.at, placed.placed], [[200, 262], true]);
  assert.equal(mergeState(placed, { at: null }, { mode: 'place' }).placed, false);
  assert.equal(mergeState(emptyState(), { at: 'nowhere' }, { mode: 'place', place: () => null }).placed, false);
  assert.equal(mergeState(emptyState(), { reveal: true }, { mode: 'pick' }).reveal, true);
  assert.equal(mergeState({ ...emptyState(), reveal: true }, { reveal: null }, { mode: 'pick' }).reveal, null);
  assert.deepEqual(mergeState(emptyState(), { step: 9 }, { steps: 4 }).step, 4);
  const before = emptyState();
  assert.equal(mergeState(before, null, { mode: 'pick' }), before);
  assert.deepEqual(mergeState(emptyState(), { picked: 'liver' }, { mode: 'place' }).picked, [], 'fields of other modes are ignored');
});

/* ----------------------------------------------------------------- helpers */

test('names and information for lesson files', () => {
  assert.equal(structureName('windpipe'), 'Windpipe');
  assert.equal(structureName('windpipe', 'scientific'), 'Trachea');
  assert.equal(structureName('windpipe', 'both'), 'Windpipe (trachea)');
  assert.equal(structureName('liver', 'scientific'), 'Liver');
  assert.equal(structureName('liver', 'both'), 'Liver');
  assert.equal(structureName('pulse-wrist'), 'Wrist pulse');
  assert.equal(structureName('nonsense'), '');
  assert.equal(structureNameThe('small-intestine'), 'the small intestine');
  assert.equal(structureNameThe('golgi'), 'the Golgi apparatus');
  assert.equal(structureNameThe('nonsense'), '');
  const p = structureInfo('pancreas');
  assert.deepEqual([p.id, p.kind, p.name, p.system, p.systems, p.side, p.layer], ['pancreas', 'structure', 'Pancreas', 'digestive', ['digestive', 'endocrine'], null, null]);
  assert.equal(p.note, STRUCTURES.pancreas[3]);
  assert.equal(structureInfo('left-lung').side, 'left');
  assert.equal(structureInfo('right-atrium').side, 'right');
  assert.equal(structureInfo('femur').side, 'both');
  assert.equal(structureInfo('ribs').side, 'both');
  assert.equal(structureInfo('heart').side, null);
  assert.equal(structureInfo('windpipe').scientific, 'trachea');
  assert.equal(structureInfo('heart').scientific, 'heart');
  assert.equal(structureInfo('ovaries').layer, 'female');
  const a = structureInfo('pulse-wrist');
  assert.deepEqual([a.kind, a.name, a.scientific, a.system, a.side], ['anchor', 'Wrist pulse', 'radial pulse', 'circulatory', 'both']);
  assert.equal(structureInfo('chest-centre').side, null);
  assert.equal(structureInfo('nonsense'), null);
  assert.equal(systemNames().digestive, 'Digestive system');
});

test('ids by system; the reproductive layers stay out unless asked for', () => {
  const digestive = structureIds('digestive');
  for (const id of ['mouth', 'food-pipe', 'stomach', 'liver', 'gallbladder', 'pancreas', 'small-intestine', 'large-intestine', 'appendix', 'rectum', 'salivary-glands']) assert.ok(digestive.includes(id), `digestive: ${id}`);
  assert.deepEqual(digestive, digestive.slice().sort());
  assert.ok(structureIds('endocrine').includes('pancreas') && structureIds('muscles').includes('diaphragm') && structureIds('respiratory').includes('diaphragm'));
  for (const id of ['skull', 'jaw', 'cervical-spine', 'thoracic-spine', 'lumbar-spine', 'sacrum', 'tailbone', 'ribs', 'breastbone', 'collarbone', 'shoulder-blade', 'humerus', 'radius', 'ulna', 'hand-bones', 'pelvis', 'femur', 'kneecap', 'tibia', 'fibula', 'foot-bones']) assert.ok(structureIds('skeleton').includes(id), `skeleton: ${id}`);
  for (const id of ['deltoid', 'pectorals', 'biceps', 'triceps', 'forearm-muscles', 'abdominals', 'obliques', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'trapezius', 'latissimus', 'heart-muscle']) assert.ok(structureIds('muscles').includes(id), `muscles: ${id}`);
  assert.deepEqual(structureIds('female'), ['ovaries', 'uterus']);
  assert.deepEqual(structureIds('male'), ['prostate', 'testes']);
  assert.equal(structureIds().length, Object.keys(STRUCTURES).length);
  assert.deepEqual(structureIds('nonsense'), []);
  assert.deepEqual(anchorIds('circulatory'), ['pulse-arm', 'pulse-foot', 'pulse-groin', 'pulse-neck', 'pulse-wrist']);
  assert.equal(anchorIds().length, Object.keys(ANCHORS).length);

  assert.deepEqual(expandIds(['lungs', 'heart', 'lungs']), ['right-lung', 'left-lung', 'heart']);
  assert.deepEqual(expandIds('kidneys'), ['right-kidney', 'left-kidney']);
  assert.deepEqual(expandIds(null), []);
  assert.deepEqual(expandIds(['nonsense', 42, 'pulse-wrist']), []);
  for (const list of [['all'], ['endocrine'], ['reproductive'], ['organs'], Object.keys(SYSTEMS)]) {
    for (const id of Object.keys(LAYERS)) assert.ok(!expandIds(list).includes(id), `${id} must not come in with ${list}`);
  }
  assert.deepEqual(expandIds(['female']), ['ovaries', 'uterus']);
  assert.deepEqual(expandIds(['testes']), ['testes']);
  assert.equal(expandIds(['all']).length, Object.keys(STRUCTURES).length - 4);
  // with neither layer asked for, nothing reproductive is under a tap anywhere on the figure
  for (const id of Object.keys(LAYERS)) { const at = front.byId.get(id).at; assert.notEqual(structureAt('body', at, { show: ['all'] }), id); }
  assert.equal(structureAt('body', front.byId.get('uterus').at, { show: ['female'] }), 'uterus');
});

/* ---------------------------------------------------------------- examples */

test('examples: enough of them, and every id and stop in them exists in its view', () => {
  assert.ok(examples.length >= 8 && examples.length <= 12, `${examples.length} examples`);
  const views = new Set();
  const modes = new Set();
  for (const ex of examples) {
    const spec = ex.spec;
    assert.equal(spec.type, 'body-map');
    assert.ok(ex.title && spec.alt, `${ex.title}: title and alt`);
    assert.ok(VIEWS[spec.view], `${ex.title}: view`);
    views.add(spec.view);
    modes.add(spec.mode || 'view');
    const art = artOf(MODULES[VIEWS[spec.view].art]);
    const drawn = (id) => assert.ok(art.byId.has(id), `${ex.title}: "${id}" is not drawn in the ${spec.view} view`);
    for (const g of spec.groups || []) expandIds(g.ids).forEach(drawn);
    for (const l of Array.isArray(spec.labels) ? spec.labels : []) if (typeof l === 'string') { assert.ok(expandIds([l]).length, `${ex.title}: label "${l}"`); expandIds([l]).forEach(drawn); }
    if (spec.mode === 'pick' || spec.mode === 'pickMany') expandIds(spec.answer).forEach(drawn);
    for (const m of spec.markers || []) assert.ok(resolvePoint(art, m.at), `${ex.title}: marker at ${m.at}`);
    if (spec.target) assert.ok(resolvePoint(art, spec.target), `${ex.title}: target`);
    for (const f of spec.flows || []) {
      for (const stop of f.path) assert.ok(resolvePoint(art, stop), `${ex.title}: flow stop ${JSON.stringify(stop)}`);
      assert.ok(flowPoints(art, f.path).length >= 2);
    }
    for (const t of spec.toggles || []) assert.ok(expandIds([t]).some((id) => art.byId.has(id)), `${ex.title}: toggle ${t}`);
  }
  assert.ok(views.size >= 6, `examples cover only ${views.size} views`);
  for (const m of ['view', 'explore', 'pick', 'pickMany', 'pickMarker', 'place']) assert.ok(modes.has(m), `no example of mode ${m}`);
});

test('the files stay small', () => {
  const kb = (rel) => statSync(file(rel)).size / 1024;
  assert.ok(kb('src/widgets/body-map.js') < 140, 'the widget');
  assert.ok(kb('assets/body/structures.js') < 40 && kb('assets/body/draw.js') < 20);
  assert.ok(kb('assets/body/front.js') < 30 && kb('assets/body/back.js') < 12);
  for (const name of ['head', 'heart', 'lungs', 'skin', 'cell']) assert.ok(kb(`assets/body/${name}.js`) < 10, `${name}.js`);
});
