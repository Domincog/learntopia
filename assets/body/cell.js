/**
 * body-map artwork: one animal cell cut open (view 'cell').
 *
 * A schematic with one or a few of each part; a real cell holds hundreds of mitochondria and millions of
 * ribosomes, and cells of different tissues look very different from one another. Box 440 × 380.
 */
import { blob, oval, tube, loop, ink } from './draw.js';

const OUT = [[220, 30], [130, 40], [62, 88], [34, 170], [52, 262], [112, 328], [206, 352], [304, 338], [376, 284], [408, 196], [388, 108], [318, 48]];
const cytoplasm = [blob(OUT)];
const membrane = [loop(OUT, 7)];
const nucleus = [oval(196, 178, 62, 56, -8), oval(210, 188, 17, 16, 0, { tone: 'violet-text' })];
const mito = (x, y, deg) => [oval(x, y, 30, 15, deg), ink([[-20, 0], [-12, -8], [-4, 6], [4, -8], [12, 6], [20, -2]].map(([a, b]) => {
  const r = (deg * Math.PI) / 180;
  return [x + a * Math.cos(r) - b * Math.sin(r), y + a * Math.sin(r) + b * Math.cos(r)];
}))];
const mitochondria = [...mito(318, 110, 28), ...mito(112, 282, -24), ...mito(332, 268, -38)];
const er = [
  tube([[268, 138], [284, 170], [282, 208], [264, 238]], 7), tube([[286, 132], [304, 170], [300, 214], [280, 250]], 7), tube([[306, 150], [322, 186], [314, 228]], 7),
];
const DOTS = [[276, 150], [290, 190], [280, 226], [296, 148], [312, 184], [300, 232], [318, 162], [326, 204], [86, 150], [100, 172], [78, 196], [246, 300], [226, 316], [262, 318], [150, 96], [174, 82], [346, 190], [356, 214], [116, 216], [200, 292]];
const ribosomes = DOTS.map(([x, y]) => oval(x, y, 2.6, 2.6));
const golgi = [
  tube([[112, 98], [136, 86], [162, 92]], 6), tube([[104, 114], [134, 100], [166, 108]], 6), tube([[100, 130], [132, 116], [166, 124]], 6), tube([[104, 146], [130, 134], [158, 140]], 6),
  oval(180, 100, 5, 5), oval(92, 104, 4.5, 4.5),
];
const lysosomes = [oval(170, 290, 12, 12), oval(244, 86, 11, 11), oval(364, 152, 10, 10)];

export default {
  id: 'cell',
  width: 440,
  height: 380,
  cm: 0,
  facing: 'section',
  region: () => null,
  shapes: [
    { id: 'cytoplasm', parts: cytoplasm, at: [226, 262] },
    { id: 'cell-membrane', parts: membrane, at: [62, 88] },
    { id: 'endoplasmic-reticulum', parts: er, at: [300, 214] },
    { id: 'golgi', parts: golgi, at: [132, 116] },
    { id: 'mitochondria', parts: mitochondria, at: [318, 110] },
    { id: 'lysosomes', parts: lysosomes, at: [170, 290] },
    { id: 'nucleus', parts: nucleus, at: [170, 158] },
    { id: 'ribosomes', parts: ribosomes, at: [246, 300] },
  ],
  anchors: {},
};
