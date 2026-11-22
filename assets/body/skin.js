/**
 * body-map artwork: a block of skin cut through (view 'skin').
 *
 * Three layers from the surface down: the thin epidermis, the dermis with its glands, vessels, nerve endings
 * and the root of a hair, and the fat underneath. A schematic: real skin is far more crowded, and the layers
 * differ in thickness from one part of the body to another. Box 460 × 380.
 */
import { blob, oval, tube, ink } from './draw.js';

const wave = (y, amp, from = 30, to = 430, step = 40) => {
  const pts = [];
  for (let x = from, i = 0; x <= to; x += step, i++) pts.push([x, y + (i % 2 ? amp : -amp)]);
  return pts;
};
const top = wave(84, 2, 30, 430, 50);
const mid = wave(122, 9);
const low = wave(250, 6, 30, 430, 50);
const epidermis = [blob([[30, 84, 1], ...top.slice(1, -1), [430, 84, 1], [430, 122, 1], ...mid.slice(1, -1).reverse(), [30, 122, 1]])];
const dermis = [blob([[30, 118, 1], ...mid.slice(1, -1), [430, 118, 1], [430, 250, 1], ...low.slice(1, -1).reverse(), [30, 250, 1]])];
const fat = [
  blob([[30, 246, 1], ...low.slice(1, -1), [430, 246, 1], [430, 350, 1], [30, 350, 1]]),
  ...[[64, 290], [112, 318], [150, 284], [204, 312], [250, 286], [300, 318], [344, 288], [396, 314], [86, 334], [262, 334], [404, 276]].map(([x, y]) => ink([[x - 16, y], [x, y - 13], [x + 16, y], [x, y + 13], [x - 16, y]])),
];
const follicle = [blob([[150, 122], [166, 124], [176, 170], [182, 214], [176, 238], [160, 244], [148, 232], [150, 200], [146, 160]])];
const hair = [tube([[164, 228], [160, 170], [150, 110], [132, 24]], 6)];
const oilGland = [blob([[176, 150], [190, 144], [204, 152], [206, 170], [194, 180], [180, 174]])];
const sweatGland = [
  tube([[300, 82], [296, 110], [306, 140], [296, 170], [302, 204]], 4),
  tube([[302, 204], [286, 208], [282, 222], [296, 232], [316, 228], [322, 214], [308, 206], [296, 214], [302, 224]], 6),
];
const pore = [oval(300, 82, 6, 3.5)];
const vessels = [
  tube([[30, 226], [130, 232], [250, 224], [340, 232], [430, 226]], 5, { tone: 'red' }), tube([[30, 240], [130, 244], [250, 238], [340, 244], [430, 240]], 5, { tone: 'blue' }),
  tube([[96, 230], [92, 180], [100, 146], [112, 136]], 3, { tone: 'red' }), tube([[112, 136], [124, 150], [118, 190], [122, 240]], 3, { tone: 'blue' }),
  tube([[366, 230], [362, 176], [372, 146], [384, 138]], 3, { tone: 'red' }), tube([[384, 138], [396, 152], [390, 196], [394, 240]], 3, { tone: 'blue' }),
];
const nerves = [
  tube([[236, 350], [240, 280], [232, 220], [240, 160]], 3.4), oval(240, 150, 7, 10),
  tube([[240, 280], [262, 230], [258, 170], [266, 128]], 2.4), tube([[266, 128], [258, 108]], 1.8), tube([[266, 128], [274, 106]], 1.8),
];

export default {
  id: 'skin',
  width: 460,
  height: 380,
  cm: 0,
  facing: 'section',
  region: () => null,
  shapes: [
    { id: 'fat-layer', parts: fat, at: [404, 300] },
    { id: 'dermis', parts: dermis, at: [404, 184] },
    { id: 'epidermis', parts: epidermis, at: [404, 102] },
    { id: 'skin-vessels', parts: vessels, at: [80, 229] },
    { id: 'nerve-endings', parts: nerves, at: [240, 152] },
    { id: 'sweat-gland', parts: sweatGland, at: [302, 220] },
    { id: 'sweat-pore', parts: pore, at: [300, 82] },
    { id: 'hair-follicle', parts: follicle, at: [164, 236] },
    { id: 'oil-gland', parts: oilGland, at: [194, 162] },
    { id: 'hair', parts: hair, at: [138, 50] },
  ],
  anchors: {},
};
