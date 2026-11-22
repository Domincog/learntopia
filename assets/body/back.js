/**
 * body-map artwork: the whole figure seen from BEHIND (views 'back', 'back-torso').
 *
 * Same box and scale as the front (400 × 900, 5 units to the centimetre, midline x = 200), and the same
 * outline. Seen from behind, the person's LEFT is on the viewer's left (x < 200): shapes are drawn there and
 * mirrored with pair(…, 200, 'left', 'right').
 *
 * The limb bones are the front view's (a long bone looks much the same from either side at this level of
 * detail). The kidneys swap sides with the viewpoint: the left one, on the viewer's left, sits a little higher.
 */
import { blob, oval, tube, ink, flip, shift, pair, sided } from './draw.js';
import { shared, region as frontRegion } from './front.js';

const CX = 200;
const both = (parts) => pair(parts, CX, 'left', 'right');
const TURN = { chest: 'upper-back', abdomen: 'lower-back', pelvis: 'buttocks' };

/** The named part of the body surface under a point, seen from behind. Sides are the person's own. */
export function region(x, y) {
  const r = frontRegion(x, y);
  if (!r) return null;
  return { region: TURN[r.region] || r.region, side: r.side === 'left' ? 'right' : r.side === 'right' ? 'left' : null };
}

const skull = [blob([[200, 35], [180, 39], [168, 55], [165, 78], [168, 98], [178, 112], [200, 118], [222, 112], [232, 98], [235, 78], [232, 55], [220, 39]]), ink([[172, 70], [200, 62], [228, 70]]), ink([[200, 62], [200, 38]])];
const brain = [
  shared.brain[0],
  blob([[178, 84], [200, 81], [222, 84], [218, 98], [200, 103], [182, 98]]),
  ink([[200, 41], [200, 83]]), ink([[184, 90], [200, 88], [216, 90]]), ink([[187, 96], [200, 94], [213, 96]]),
  ...pair([ink([[194, 49], [185, 54], [189, 63]]), ink([[177, 58], [176, 69], [183, 74]])], CX),
];
const spines = (parts, n) => parts.concat(Array.from({ length: n }, (_, i) => {
  const ys = parts[i].c.filter((_, k) => k % 2 === 1);
  return oval(CX, (Math.min(...ys) + Math.max(...ys)) / 2, 2.2, 2.6, 0, { tone: 'ink-3' });
}));

// twelve pairs of ribs leave the chest vertebrae and slope down and outwards
const RIB_OUT = [36, 50, 59, 64, 67, 69, 70, 69, 67, 63, 50, 34];
const ribsL = RIB_OUT.map((out, i) => {
  const y = 182 + (i + 0.5) * 10.83;
  const drop = 5 + i * 1.1;
  return tube([[190, y], [200 - out * 0.55, y + drop * 0.35], [200 - out + 3, y + drop], [200 - out + (i > 9 ? 0 : 4), y + drop + (i > 9 ? 4 : 9)]], i > 9 ? 4.4 : 5);
});
const bladeL = [blob([[119, 190], [140, 190], [166, 197], [169, 232], [160, 272], [143, 250], [126, 216]]), tube([[164, 210], [142, 199], [119, 193]], 4)];
const collarL = [tube([[168, 186], [143, 187], [118, 190]], 5)];

const trapL = [blob([[199, 124, 1], [190, 148], [172, 172], [144, 182], [119, 189], [148, 203], [176, 230], [199, 312, 1]]), ink([[196, 180], [150, 192]]), ink([[196, 230], [176, 212]])];
const latL = [blob([[199, 262, 1], [172, 242], [144, 238], [125, 248], [127, 290], [133, 340], [150, 376], [199, 400, 1]]), ink([[194, 300], [136, 262]]), ink([[194, 350], [140, 318]])];
const tricepsL = [blob([[109, 238], [98, 262], [86, 300], [81, 328], [92, 339], [104, 322], [116, 282], [120, 250]]), ink([[108, 256], [92, 322]])];
const gluteL = [blob([[198, 408, 1], [170, 402], [141, 410], [119, 430], [116, 462], [130, 486], [160, 493], [198, 484, 1]]), ink([[150, 420], [176, 470]])];
const hamL = [blob([[124, 498], [118, 540], [124, 590], [136, 620], [158, 626], [180, 618], [190, 580], [194, 520], [186, 498], [156, 502]]), ink([[156, 506], [158, 618]])];
const calfL = [blob([[138, 652], [131, 692], [134, 730], [146, 770], [160, 792], [174, 770], [187, 730], [190, 692], [186, 652], [162, 645]]), ink([[161, 650], [160, 760]])];

const kidneyHigh = shift(shared.kidneyR, 0, -7);          // the left kidney, on the viewer's left here
const kidneyLow = flip(shared.kidneyR, CX);
const adrenals = [...sided(shift(shared.adrenalR, 0, -7), 'left'), ...sided(flip(shared.adrenalR, CX), 'right')];
const spinalCord = [tube([[200, 104], [200, 326]], 4)];
const nervesL = [
  tube([[199, 172], [176, 184], [150, 197], [120, 214], [104, 290], [88, 346], [74, 410], [60, 468], [48, 546]], 2.6),
  ...[222, 242, 262, 282].map((y) => tube([[199, y], [176, y + 5], [152, y + 14]], 1.8)),
  // the sciatic nerve runs down the back of the thigh and divides behind the knee
  tube([[199, 330], [186, 390], [168, 440], [158, 500], [158, 600], [162, 640], [156, 740], [160, 838], [158, 868]], 3.4), tube([[162, 640], [172, 700], [170, 800]], 2.4),
];

const P = (l) => ({ left: l, right: [2 * CX - l[0], l[1]] });

export default {
  id: 'back',
  width: 400,
  height: 900,
  cm: 0.2,
  facing: 'back',
  region,
  shapes: [
    { id: 'skin', parts: shared.skinParts, at: [233, 60] },
    { id: 'left-lung', parts: sided(flip(shared.lungL, CX), 'left'), at: [158, 222] },
    { id: 'right-lung', parts: sided(flip(shared.lungR, CX), 'right'), at: [242, 222] },
    { id: 'left-kidney', parts: sided(kidneyHigh, 'left') },
    { id: 'right-kidney', parts: sided(kidneyLow, 'right') },
    { id: 'adrenals', parts: adrenals },
    { id: 'brain', parts: brain, at: [200, 62] },
    { id: 'skull', parts: skull, at: [200, 50] },
    { id: 'ribs', parts: both(ribsL), atSide: { left: [136, 262], right: [264, 262] } },
    { id: 'pelvis', parts: both(shared.hipR), atSide: { left: [143, 392], right: [257, 392] } },
    { id: 'cervical-spine', parts: spines(shared.cervical, 7), at: [200, 163] },
    { id: 'thoracic-spine', parts: spines(shared.thoracic, 12), at: [200, 250] },
    { id: 'lumbar-spine', parts: spines(shared.lumbar, 5), at: [200, 352] },
    { id: 'sacrum', parts: shared.sacrum, at: [200, 408] },
    { id: 'tailbone', parts: shared.tailbone, at: [200, 447] },
    { id: 'spinal-cord', parts: spinalCord, at: [200, 140], flow: [[200, 104], [200, 326]] },
    { id: 'collarbone', parts: both(collarL) },
    { id: 'shoulder-blade', parts: both(bladeL), atSide: { left: [152, 232], right: [248, 232] } },
    { id: 'humerus', parts: both(shared.humerusR) },
    { id: 'radius', parts: both(shared.radiusR) },
    { id: 'ulna', parts: both(shared.ulnaR) },
    { id: 'hand-bones', parts: both(shared.handR) },
    { id: 'femur', parts: both(shared.femurR), atSide: { left: [150, 540], right: [250, 540] } },
    { id: 'tibia', parts: both(shared.tibiaR), atSide: { left: [169, 740], right: [231, 740] } },
    { id: 'fibula', parts: both(shared.fibulaR), atSide: { left: [149, 750], right: [251, 750] } },
    { id: 'foot-bones', parts: both(shared.footR) },
    { id: 'nerves', parts: both(nervesL), atSide: { left: [158, 560], right: [242, 560] } },
    { id: 'calves', parts: both(calfL) },
    { id: 'hamstrings', parts: both(hamL) },
    { id: 'glutes', parts: both(gluteL) },
    { id: 'latissimus', parts: both(latL) },
    { id: 'trapezius', parts: both(trapL) },
    { id: 'triceps', parts: both(tricepsL) },
    { id: 'forearm-muscles', parts: both(shared.forearmR) },
    { id: 'deltoid', parts: both(shared.deltR) },
  ],
  anchors: {
    'shoulder-joint': P([115, 199]), 'elbow-joint': P([87, 344]), 'wrist-joint': P([59, 466]), 'hip-joint': P([155, 432]), 'knee-joint': P([162, 638]), 'ankle-joint': P([166, 842]),
    'bone-marrow': P([150, 540]),
    'back-of-head': [200, 70], nape: [200, 158], shoulder: P([108, 198]), 'between-shoulder-blades': [200, 228], 'upper-back': P([160, 236]), 'lower-back': [200, 356],
    'upper-arm': P([97, 280]), elbow: P([86, 344]), forearm: P([74, 402]), wrist: P([59, 466]), 'back-of-hand': P([49, 506]), fingertip: P([45, 554]),
    hip: P([121, 434]), buttock: P([158, 448]), 'back-of-thigh': P([155, 540]), 'back-of-knee': P([162, 636]), calf: P([161, 712]), ankle: P([166, 838]), heel: P([164, 868]),
  },
};
