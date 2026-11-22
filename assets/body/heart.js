/**
 * body-map artwork: the heart opened up (view 'heart'): four chambers, four valves and the great vessels.
 *
 * A schematic, not a portrait: the chambers are spread out so that each can be seen and tapped, and the
 * vessels are tidied into straight runs. What it keeps true: the heart is drawn as in the body, facing the
 * viewer, so the person's RIGHT atrium and ventricle are on the viewer's LEFT; the left ventricle has the
 * thickest wall; the pulmonary artery leaves the right ventricle and the aorta the left, and the aorta arches
 * over the pulmonary artery; the venae cavae enter the right atrium and the pulmonary veins the left.
 * Blue marks oxygen-poor blood and red oxygen-rich blood (so the pulmonary ARTERY is blue and the pulmonary
 * VEINS are red). Box 460 × 430.
 */
import { blob, tube } from './draw.js';

const muscle = [blob([[92, 140], [140, 124], [200, 132], [262, 126], [322, 134], [352, 170], [352, 236], [330, 310], [286, 366], [240, 396], [196, 372], [150, 322], [122, 262], [90, 234], [82, 186]])];
const ra = [blob([[100, 152], [140, 140], [172, 152], [176, 196], [160, 226], [112, 226], [94, 192]])];
const la = [blob([[266, 146], [304, 140], [336, 158], [340, 196], [318, 216], [276, 214], [262, 184]])];
const rv = [blob([[128, 246], [166, 242], [186, 236], [208, 240], [210, 300], [214, 352], [198, 350], [162, 310], [136, 274]])];
const lv = [blob([[226, 238], [250, 234], [286, 236], [318, 244], [312, 296], [276, 346], [244, 374], [234, 340], [232, 290]])];
const septum = [blob([[209, 250], [229, 248], [232, 290], [234, 340], [240, 378], [222, 370], [214, 352], [210, 300]])];
const tricuspid = [tube([[114, 234], [140, 239], [164, 234]], 5.5)];
const mitral = [tube([[270, 224], [292, 229], [316, 225]], 5.5)];
const pulmonaryValve = [tube([[186, 236], [198, 232], [210, 236]], 5.5)];
const aorticValve = [tube([[226, 233], [238, 229], [250, 233]], 5.5)];
const svc = [tube([[130, 18], [130, 150]], 24)];
const ivc = [tube([[104, 424], [104, 300], [108, 222]], 22)];
const pulmonaryArtery = [tube([[198, 238], [198, 116]], 26), tube([[198, 110], [150, 96], [20, 96]], 20), tube([[198, 110], [250, 96], [440, 96]], 20)];
const aorta = [
  tube([[238, 236], [238, 120], [246, 74], [278, 46], [322, 50], [354, 82], [362, 132]], 26),
  tube([[268, 44], [264, 14]], 10), tube([[294, 38], [296, 10]], 10), tube([[322, 44], [330, 16]], 10),
];
const pulmonaryVeins = [tube([[440, 158], [336, 164]], 14), tube([[440, 198], [338, 196]], 14), tube([[20, 162], [100, 166]], 14), tube([[20, 198], [100, 196]], 14)];

export default {
  id: 'heart',
  width: 460,
  height: 430,
  cm: 0,
  facing: 'front',
  region: () => null,
  shapes: [
    { id: 'pulmonary-veins', parts: pulmonaryVeins, at: [400, 160], flow: [[440, 158], [330, 164]] },
    { id: 'heart-muscle', parts: muscle, at: [336, 268] },
    { id: 'septum', parts: septum, at: [222, 300] },
    { id: 'inferior-vena-cava', parts: ivc, at: [104, 360], flow: [[104, 424], [104, 300], [112, 212]] },
    { id: 'pulmonary-artery', parts: pulmonaryArtery, at: [60, 96], flow: [[198, 238], [198, 116], [250, 96], [440, 96]] },
    { id: 'aorta', parts: aorta, at: [322, 50], flow: [[238, 236], [238, 120], [246, 74], [278, 46], [322, 50], [354, 82], [362, 132]] },
    { id: 'superior-vena-cava', parts: svc, at: [130, 60], flow: [[130, 18], [130, 160]] },
    { id: 'right-atrium', parts: ra, at: [136, 184] },
    { id: 'left-atrium', parts: la, at: [300, 180] },
    { id: 'right-ventricle', parts: rv, at: [176, 280] },
    { id: 'left-ventricle', parts: lv, at: [272, 284] },
    { id: 'tricuspid-valve', parts: tricuspid, at: [140, 238] },
    { id: 'mitral-valve', parts: mitral, at: [292, 228] },
    { id: 'pulmonary-valve', parts: pulmonaryValve, at: [198, 233] },
    { id: 'aortic-valve', parts: aorticValve, at: [238, 230] },
  ],
  anchors: {},
};
