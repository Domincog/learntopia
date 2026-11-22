/**
 * body-map artwork: the head and neck from the side, cut open down the middle (view 'head').
 *
 * The face looks to the viewer's LEFT. Box 420 × 480 (the view stops at y = 446, part-way down the neck); about 11 units to the centimetre.
 *
 * This is the usual textbook hybrid: the nose, mouth, throat and neck are shown as a slice through the midline,
 * so that the airway (in front) and the food pipe (behind it) can be told apart, while the brain shows its
 * outer surface with the four lobes. The hypothalamus and the pituitary gland, which lie deep in the middle of
 * the head, are drawn on top of the brain where they would be found inside; the outer ear, which is on the
 * side of the head, is drawn as an outline over the place where it sits.
 */
import { blob, oval, box, tube, ink } from './draw.js';

const skin = [blob([[212, 26], [152, 37], [110, 68], [93, 110], [91, 140], [87, 152], [72, 178], [56, 195], [66, 206], [75, 211], [70, 222], [77, 231], [74, 243], [81, 254], [84, 272],
  [100, 287], [130, 293], [150, 306], [153, 360], [150, 480, 1], [322, 480, 1], [319, 330], [327, 290], [346, 242], [357, 180], [349, 112], [312, 57], [264, 31]])];

// the skull in section: the bone of the vault, the base and the face
const skull = [
  blob([[212, 37], [156, 47], [119, 76], [103, 114], [102, 146], [96, 160], [84, 177], [104, 180], [112, 196], [96, 209], [100, 219], [150, 216], [186, 219], [206, 212], [232, 230],
    [258, 240], [300, 246], [334, 216], [346, 172], [339, 116], [305, 66], [260, 41]]),
  blob([[212, 50], [160, 59], [130, 84], [117, 118], [118, 142], [136, 150], [160, 166], [190, 198], [214, 204], [240, 220], [262, 232], [296, 234], [322, 210], [334, 172], [328, 120], [298, 76], [256, 53]], { tone: 'hair' }),
];
const jaw = [blob([[86, 240], [96, 237], [103, 258], [124, 278], [160, 284], [163, 292], [122, 291], [97, 287], [84, 268]])];
const teeth = [box(87, 213, 7, 13, 3), box(89, 235, 6.5, 12, 3)];

const frontal = [blob([[212, 55], [162, 63], [134, 87], [122, 118], [124, 140], [142, 147], [164, 160], [186, 156], [204, 146], [214, 136], [220, 100], [218, 70]]), ink([[150, 84], [170, 96], [166, 120]]), ink([[186, 72], [196, 100], [188, 132]])];
const parietal = [blob([[216, 55], [222, 100], [217, 138], [240, 146], [268, 150], [290, 120], [290, 88], [264, 63], [238, 54]]), ink([[240, 70], [248, 100], [240, 130]]), ink([[266, 84], [272, 110], [264, 136]])];
const occipital = [blob([[293, 90], [295, 122], [273, 152], [284, 176], [305, 186], [322, 170], [329, 140], [319, 106]]), ink([[300, 124], [310, 146], [300, 168]])];
const temporal = [blob([[150, 166], [168, 163], [190, 160], [210, 151], [240, 150], [268, 154], [281, 177], [262, 192], [228, 198], [192, 197], [164, 187]]), ink([[176, 176], [210, 172], [250, 176]])];
const cerebellum = [blob([[262, 197], [284, 181], [307, 191], [317, 208], [306, 226], [282, 232], [264, 220]]), ink([[272, 200], [300, 196]]), ink([[268, 210], [308, 208]]), ink([[274, 221], [300, 220]])];
const brainstem = [blob([[226, 200], [246, 198], [255, 222], [262, 246], [268, 264], [253, 268], [245, 246], [236, 224]])];
const hypothalamus = [oval(212, 180, 10, 6.5, 12)];
const pituitary = [oval(206, 201, 6, 5.5), ink([[208, 187], [207, 196]])];
const spinalCord = [tube([[261, 262], [269, 300], [274, 360], [278, 470]], 9)];
const cervical = [];
for (let i = 0; i < 7; i++) {
  const y = 264 + i * 25;
  const x = 233 + i * 1.6;
  cervical.push(box(x, y, 26, 20, 5));
  cervical.push(blob([[x + 51, y + 3], [x + 72 - (i < 2 ? 8 : 0), y + 8], [x + 72 - (i < 2 ? 8 : 0), y + 15], [x + 51, y + 16]]));
}

const eye = [oval(118, 158, 13, 13), blob([[105, 152], [109, 151], [110, 158], [109, 165], [105, 164], [103, 158]], { tone: 'ink' }), ink([[131, 158], [150, 164]])];
const ear = [tube([[250, 172], [264, 164], [277, 176], [276, 196], [266, 212], [256, 214]], 4.5), ink([[258, 180], [268, 180], [268, 194], [260, 202]])];
const nose = [blob([[72, 190], [96, 174], [126, 177], [160, 184], [188, 196], [186, 211], [150, 212], [110, 211], [82, 206]]), ink([[100, 190], [150, 194]]), ink([[104, 200], [160, 203]])];
const mouth = [blob([[80, 226], [100, 221], [150, 221], [184, 224], [196, 238], [194, 258], [160, 276], [122, 276], [100, 268], [88, 252], [78, 236]]), tube([[184, 222], [194, 232], [196, 245]], 5, { tone: 'pink' })];
const tongue = [blob([[99, 247], [118, 233], [152, 230], [182, 240], [190, 262], [168, 274], [126, 273], [104, 263]])];
const tonsils = [oval(198, 252, 4.5, 8, -8)];
const salivary = [oval(128, 283, 10, 4.5, 6), oval(160, 291, 9, 5, 10), oval(232, 216, 8, 12, 20)];
const throat = [blob([[190, 194], [206, 198], [220, 214], [224, 250], [223, 290], [220, 312], [202, 310], [198, 290], [200, 262], [202, 236], [194, 214]])];
const epiglottis = [blob([[199, 293], [191, 281], [185, 266], [191, 264], [199, 276], [205, 291]])];
const voiceBox = [blob([[176, 300], [198, 296], [204, 318], [201, 340], [180, 340], [171, 322]]), ink([[178, 322], [198, 320]])];
const windpipe = [tube([[190, 338], [191, 390], [192, 472]], 22), ...[352, 370, 388, 406, 424, 442].map((y) => ink([[180, y], [202, y]]))];
const foodPipe = [tube([[212, 310], [218, 360], [223, 472]], 11)];
const thyroid = [oval(169, 368, 8, 19, 2)];

export default {
  id: 'head',
  width: 420,
  height: 480,
  cm: 0.09,
  facing: 'side',
  region: () => null,
  shapes: [
    { id: 'skin', parts: skin, at: [300, 404] },
    { id: 'skull', parts: skull, at: [330, 100] },
    { id: 'jaw', parts: jaw, at: [110, 280] },
    { id: 'cervical-spine', parts: cervical, at: [250, 350] },
    { id: 'spinal-cord', parts: spinalCord, at: [273, 350], flow: [[261, 262], [269, 300], [274, 360], [277, 440]] },
    { id: 'nose', parts: nose, at: [120, 194], flow: [[80, 197], [110, 194], [160, 198], [184, 204]] },
    { id: 'mouth', parts: mouth, at: [112, 228], flow: [[86, 234], [120, 227], [170, 229], [191, 244]] },
    { id: 'teeth', parts: teeth, at: [90, 219] },
    { id: 'tongue', parts: tongue, at: [146, 252] },
    { id: 'throat', parts: throat, at: [213, 236], flow: [[200, 206], [212, 240], [212, 300]] },
    { id: 'tonsils', parts: tonsils },
    { id: 'salivary-glands', parts: salivary, at: [160, 291] },
    { id: 'food-pipe', parts: foodPipe, at: [219, 384], flow: [[212, 310], [218, 360], [222, 440]] },
    { id: 'windpipe', parts: windpipe, at: [191, 396], flow: [[190, 338], [191, 390], [192, 440]] },
    { id: 'voice-box', parts: voiceBox, at: [187, 328] },
    { id: 'epiglottis', parts: epiglottis },
    { id: 'thyroid', parts: thyroid },
    { id: 'brainstem', parts: brainstem, at: [246, 226] },
    { id: 'cerebellum', parts: cerebellum, at: [290, 208] },
    { id: 'occipital-lobe', parts: occipital, at: [308, 140] },
    { id: 'parietal-lobe', parts: parietal, at: [254, 100] },
    { id: 'temporal-lobe', parts: temporal, at: [226, 176] },
    { id: 'frontal-lobe', parts: frontal, at: [170, 104] },
    { id: 'hypothalamus', parts: hypothalamus },
    { id: 'pituitary', parts: pituitary, at: [206, 201] },
    { id: 'eye', parts: eye, at: [118, 158] },
    { id: 'ear', parts: ear, at: [276, 186] },
  ],
  anchors: {
    forehead: [97, 104], chin: [86, 268], 'neck-front': [153, 334], nape: [318, 320], 'back-of-head': [350, 170], temple: [166, 140],
  },
};
