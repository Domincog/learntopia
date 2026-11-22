/**
 * body-map artwork: the airway tree down to an air sac (view 'lungs-detail').
 *
 * On the left, the windpipe dividing into the two bronchi and then into smaller and smaller airways inside
 * the outlines of the lungs (drawn facing the viewer: the person's right lung, with three lobes, is on the
 * viewer's left; the left lung has the notch for the heart). On the right, inside the ring, the end of one of
 * the smallest airways enlarged: a cluster of air sacs wrapped in capillaries. Blood arrives oxygen-poor
 * (blue) and leaves oxygen-rich (red). Box 480 × 380.
 */
import { blob, oval, tube, ink, flip } from './draw.js';

const CX = 130;
const lungR = [blob([[110, 62], [121, 74], [122, 130], [120, 210], [98, 222], [62, 236], [34, 250], [29, 190], [38, 120], [70, 74]]), ink([[34, 168], [80, 160], [120, 158]]), ink([[32, 206], [70, 214], [112, 216]])];
const lungL = [blob([[150, 62], [139, 74], [138, 130], [146, 160], [166, 178], [176, 204], [170, 222], [198, 236], [226, 250], [231, 190], [222, 120], [190, 74]]), ink([[229, 150], [200, 196], [176, 218]])];
const windpipe = [tube([[130, 12], [130, 100]], 15), ...[28, 44, 60, 76].map((y) => ink([[123, y], [137, y]]))];
const bronchiR = [tube([[130, 98], [112, 118], [96, 134]], 9)];
const smallR = [
  tube([[97, 133], [78, 126], [62, 110]], 4.5), tube([[97, 133], [78, 150], [58, 160]], 4.5), tube([[90, 140], [92, 170], [84, 200]], 4.5),
  tube([[70, 118], [56, 124], [48, 138]], 2.6), tube([[66, 113], [66, 98]], 2.6), tube([[68, 155], [50, 176], [44, 196]], 2.6), tube([[76, 151], [70, 176]], 2.6),
  tube([[90, 182], [104, 200]], 2.6), tube([[86, 198], [70, 216]], 2.6),
];
const bronchi = [...bronchiR, ...flip(bronchiR, CX)];
const smallL = flip(smallR.filter((_, i) => i !== 7), CX);
// the enlarged air sacs
const lens = [oval(356, 196, 116, 116)];
const duct = [tube([[262, 104], [300, 134], [322, 160]], 15), tube([[322, 160], [346, 170]], 11), tube([[322, 160], [324, 186]], 11)];
const SACS = [[372, 172, 25], [398, 208, 24], [384, 250, 24], [344, 268, 24], [310, 244, 23], [316, 204, 22], [352, 220, 27]];
const sacs = SACS.map(([x, y, r]) => oval(x, y, r, r * 0.96));
const capillaries = [
  tube([[274, 262], [292, 276], [316, 280]], 6, { tone: 'blue' }), tube([[316, 280], [340, 300], [372, 288], [400, 268]], 6, { tone: 'violet' }),
  tube([[400, 268], [426, 238], [428, 204]], 6, { tone: 'red' }), tube([[428, 204], [424, 168], [446, 140]], 6, { tone: 'red' }),
  tube([[316, 280], [296, 252], [292, 222], [300, 196]], 4.5, { tone: 'violet' }), tube([[400, 268], [412, 240]], 4.5, { tone: 'red' }),
];

export default {
  id: 'lungs',
  width: 480,
  height: 380,
  cm: 0,
  facing: 'front',
  region: () => null,
  shapes: [
    { id: 'right-lung', parts: lungR, at: [50, 228] },
    { id: 'left-lung', parts: lungL, at: [212, 228] },
    { id: '_lens', parts: lens, tone: 'surface' },
    { id: '_zoom', parts: [ink([[52, 190], [246, 150]]), ink([[52, 202], [262, 268]])] },
    { id: 'windpipe', parts: windpipe, at: [130, 40], flow: [[130, 12], [130, 100]] },
    { id: 'bronchi', parts: bronchi, at: [150, 120], flow: [[130, 98], [112, 118], [96, 134]] },
    { id: 'bronchioles', parts: [...smallR, ...smallL, ...duct, oval(48, 196, 7, 7, 0, { tone: 'surface' })], at: [286, 122], flow: [[97, 133], [78, 150], [58, 160], [50, 176], [46, 194]] },
    { id: 'lung-capillaries', parts: capillaries, at: [426, 226] },
    { id: 'air-sacs', parts: sacs, at: [352, 220] },
  ],
  anchors: {},
};
