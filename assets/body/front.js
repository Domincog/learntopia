/**
 * body-map artwork: the whole figure seen from the FRONT (views 'body', 'torso', 'chest', 'abdomen', 'leg').
 *
 * Original artwork, drawn in code. The figure stands in the anatomical position (arms a little away from the
 * sides, palms forward) in a box 400 wide and 900 high: the crown of the head is at y = 30 and the soles at
 * y = 880, so 5 units are about 1 cm on an adult 170 cm tall. The midline is x = 200.
 *
 * The figure FACES the viewer: the person's right is on the viewer's left (x < 200). Shapes below are drawn on
 * the viewer's left and mirrored with pair(…, 200, 'right', 'left'), which tags each half with the person's side.
 *
 * Landmarks used (all y): chin 143, notch at the top of the breastbone 184, lower end of the breastbone 292,
 * lowest ribs 345, navel 370, top of the hip bones 372, hip joints 432, crotch 482, knee joints 636, ankles 840.
 * Organs are placed against those landmarks as a textbook places them; the list is in drawing order, from the
 * deepest structure to the one nearest the viewer.
 */
import { blob, oval, box, tube, ink, rim, flip, shift, pair, sided, flat, inPolygon } from './draw.js';

const CX = 200;
const both = (parts) => pair(parts, CX, 'right', 'left');

/* ------------------------------------------------------------------- skin */
const head = blob([[200, 30], [178, 35], [164, 54], [161, 80], [164, 104], [173, 124], [187, 139], [200, 143], [213, 139], [227, 124], [236, 104], [239, 80], [236, 54], [222, 35]]);
const earR = oval(159, 91, 6, 12, -6);
const neck = blob([[176, 116], [175, 140], [172, 160], [163, 176], [200, 182], [237, 176], [228, 160], [225, 140], [224, 116]]);
const torso = blob([[200, 172], [172, 171], [146, 179], [120, 187], [106, 204], [106, 226], [119, 250], [122, 286], [128, 326], [133, 354], [127, 388], [117, 420], [113, 446], [116, 470], [150, 490], [200, 484],
  [250, 490], [284, 470], [287, 446], [283, 420], [273, 388], [267, 354], [272, 326], [278, 286], [281, 250], [294, 226], [294, 204], [280, 187], [254, 179], [228, 171]]);
const armR = blob([[116, 187], [103, 191], [93, 206], [86, 240], [74, 290], [63, 338], [53, 380], [47, 430], [45, 458], [33, 474], [20, 492], [15, 510], [22, 517], [30, 505],
  [31, 530], [33, 552], [40, 561], [50, 560], [58, 548], [64, 520], [72, 488], [75, 466], [87, 424], [98, 376], [105, 344], [116, 300], [124, 258], [128, 226], [128, 200]]);
const legR = blob([[160, 424], [116, 432], [111, 474], [115, 534], [125, 592], [135, 634], [132, 690], [139, 760], [151, 826], [148, 852], [139, 868], [140, 879], [160, 883],
  [182, 880], [187, 866], [182, 846], [181, 826], [185, 760], [190, 700], [188, 640], [190, 590], [196, 530], [199, 486], [200, 440]]);
const skinParts = [...both([legR, armR]), torso, neck, ...both([earR]), head];
const zones = {
  head: flat(head), neck: flat(neck), torso: flat(torso),
  arm: flat(armR), leg: flat(legR),
};

/** The named part of the body surface under a point: { region, side } or null off the figure. Sides are the person's own. */
export function region(x, y) {
  const mx = x > CX ? 2 * CX - x : x;          // the same point on the viewer's left half
  const side = Math.abs(x - CX) < 4 ? null : x < CX ? 'right' : 'left';
  if (inPolygon(zones.head, x, y) && y < 146) return { region: 'head', side: null };
  if (inPolygon(zones.arm, mx, y) && (mx < 112 || y > 250) && !(inPolygon(zones.torso, mx, y) && mx > 118)) {
    // lines across the arm at the elbow and the wrist
    const along = (mx - 112) * -0.2 + (y - 195) * 0.98;
    return { region: along < 30 ? 'shoulder' : along < 138 ? 'upper-arm' : along < 168 ? 'elbow' : along < 262 ? 'forearm' : along < 284 ? 'wrist' : 'hand', side: x < CX ? 'right' : 'left' };
  }
  if (inPolygon(zones.torso, x, y) && y < 478) {
    if (y < 184) return { region: Math.abs(x - CX) < 30 ? 'neck' : 'shoulder', side: Math.abs(x - CX) < 30 ? null : side };
    if (Math.abs(x - CX) > 62 && y < 232) return { region: 'shoulder', side };
    return { region: y < 292 ? 'chest' : y < 405 ? 'abdomen' : 'pelvis', side };
  }
  if (inPolygon(zones.leg, mx, y)) {
    return { region: y < 478 ? 'pelvis' : y < 612 ? 'thigh' : y < 662 ? 'knee' : y < 826 ? 'lower-leg' : y < 850 ? 'ankle' : 'foot', side: x < CX ? 'right' : 'left' };
  }
  if (inPolygon(zones.neck, x, y)) return { region: 'neck', side: null };
  if (inPolygon(zones.torso, x, y)) return { region: 'pelvis', side };
  return null;
}

/* --------------------------------------------------------------- skeleton */
const skull = [
  blob([[200, 35], [180, 39], [168, 55], [165, 78], [168, 98], [176, 110], [182, 120], [200, 123], [218, 120], [224, 110], [232, 98], [235, 78], [232, 55], [220, 39]]),
  ...both([oval(185, 92, 8, 6.5, -6, { tone: 'ink-3' })]),
  blob([[200, 100], [195, 110], [200, 114], [205, 110]], { tone: 'ink-3' }),
  ink([[186, 118], [200, 120], [214, 118]]),
];
const jaw = [blob([[168, 100], [169, 121], [179, 135], [200, 142], [221, 135], [231, 121], [232, 100], [225, 103], [223, 119], [214, 127], [200, 130], [186, 127], [177, 119], [175, 103]])];

function vertebrae(y0, y1, n, w0, w1) {
  const out = [];
  const h = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    const w = w0 + ((w1 - w0) * i) / Math.max(1, n - 1);
    out.push(box(CX - w / 2, y0 + i * h + 0.9, w, h - 1.8, Math.min(3, h / 3)));
  }
  return out;
}
const cervical = vertebrae(127, 182, 7, 15, 19);
const thoracic = vertebrae(182, 312, 12, 19, 25);
const lumbar = vertebrae(312, 391, 5, 27, 31);
const sacrum = [blob([[183, 392, 1], [217, 392, 1], [213, 412], [205, 436], [200, 441], [195, 436], [187, 412]]), ink([[190, 404], [210, 404]]), ink([[193, 416], [207, 416]]), ink([[196, 427], [204, 427]])];
const tailbone = [blob([[196, 441], [204, 441], [202, 451], [200, 456], [198, 451]])];

const RIB_Y = [190, 205, 220, 235, 249, 262, 274];
const RIB_OUT = [[164, 181], [150, 191], [141, 206], [136, 222], [133, 239], [131, 256], [130, 273]];
const ribsR = [];
RIB_Y.forEach((sy, i) => {
  const [lx, ly] = RIB_OUT[i];
  const sag = 1 + i * 1.3;
  ribsR.push(tube([[191, sy], [191 - (191 - lx) * 0.45, sy + sag], [lx + 5, ly + 6 + i * 0.4], [lx, ly - 2], [lx + 2, ly - 8]], 5));
});
// the cartilage of the lower ribs sweeps down and out from the breastbone: ribs 8 to 10 hang from it
ribsR.push(tube([[193, 281], [181, 292], [166, 308], [152, 324], [141, 337]], 5));
[[178, 295, 131, 290], [163, 311, 133, 306], [149, 327, 136, 321]].forEach(([jx, jy, lx, ly]) => {
  ribsR.push(tube([[jx, jy], [(jx + lx) / 2, jy + 2], [lx + 4, ly + 5], [lx, ly - 2], [lx + 2, ly - 8]], 5));
});
const breastbone = [blob([[187, 185], [200, 187], [213, 185], [212, 205], [209, 212], [209, 276], [205, 284], [200, 294], [195, 284], [191, 276], [191, 212], [188, 205]]), ink([[190, 209], [210, 209]]), ink([[193, 282], [207, 282]])];
const collarR = [tube([[189, 189], [168, 185], [143, 189], [118, 190]], 6.5)];
const bladeR = [blob([[112, 190], [128, 186], [164, 197], [163, 232], [156, 272], [140, 244], [124, 214]])];
const humerusR = [tube([[113, 201], [100, 270], [87, 338]], 9), oval(115, 199, 11, 11), oval(86, 341, 13, 7.5, -12)];
const radiusR = [tube([[78, 353], [64, 410], [53, 458]], 6), oval(78, 352, 5.5, 4, -12), oval(52.5, 459, 7, 4.5, -12)];
const ulnaR = [tube([[92, 349], [78, 410], [66, 460]], 5.5), oval(92.5, 348, 7, 5.5, -12), oval(66, 461, 4.5, 3.5, -12)];
// the hand: a wrist of small bones, then five rays. u runs down the hand, p points to the thumb (the outer) side.
const HAND = { o: [59, 468], u: [-0.196, 0.981], p: [-0.981, -0.196] };
const hp = (a, s) => [HAND.o[0] + HAND.u[0] * a + HAND.p[0] * s, HAND.o[1] + HAND.u[1] * a + HAND.p[1] * s];
const handR = [oval(...hp(5, 3), 7, 4.2, -11), oval(...hp(6, -6), 6, 4.2, -11), oval(...hp(13, -1), 9, 3.6, -11)];
[[13, 13, 22, 30, 31, 50], [9, 18, 11, 43, 12, 86], [3, 18, 3, 45, 3, 90], [-3, 18, -5, 43, -6, 85], [-9, 17, -12, 39, -14, 74]].forEach(([s0, a0, s1, a1, s2, a2]) => {
  handR.push(tube([hp(a0, s0), hp(a1 - 2, s1)], 3.8), tube([hp(a1 + 2, s1), hp(a2, s2)], 3.4));
});
const hipR = [
  blob([[185, 394], [170, 377], [150, 372], [135, 381], [136, 401], [146, 420], [147, 438], [156, 466], [170, 484], [184, 479], [197, 471], [197, 453], [183, 446], [176, 426], [186, 411]]),
  rim(oval(174, 464, 7, 9, 20)),
];
const femurR = [tube([[153, 433], [141, 441]], 9), oval(137, 443, 7, 10, -15), tube([[140, 448], [150, 540], [161, 624]], 11), oval(155, 432, 10.5, 10.5), oval(162, 630, 17, 10)];
const kneecapR = [oval(162, 631, 8.5, 9.5)];
const tibiaR = [tube([[166, 655], [169, 740], [169, 832]], 9.5), oval(165, 651, 16, 7), oval(172, 838, 6.5, 6)];
const fibulaR = [tube([[148, 660], [149, 750], [152, 836]], 4.5), oval(148, 657, 4.5, 4.5), oval(152, 840, 4.2, 6)];
const footR = [oval(163, 850, 13, 6.5, -6)];
[[152, 856, 143, 874], [157, 858, 151, 877], [163, 859, 160, 879], [169, 859, 169, 879], [175, 857, 179, 877]].forEach(([x0, y0, x1, y1], i) => {
  footR.push(tube([[x0, y0], [x1, y1]], i === 4 ? 5 : 3.6));
});

/* ---------------------------------------------------------------- muscles */
const trapR = [blob([[177, 150], [174, 168], [146, 180], [122, 186], [150, 190], [178, 186]])];
const deltR = [blob([[126, 186], [107, 192], [96, 210], [93, 240], [101, 263], [111, 246], [121, 222], [131, 200]]), ink([[112, 200], [103, 240]])];
const pecR = [blob([[196, 197], [162, 191], [134, 197], [123, 219], [129, 237], [150, 262], [176, 270], [196, 266]]), ink([[190, 222], [136, 222]]), ink([[190, 246], [142, 240]])];
const bicepsR = [blob([[109, 242], [99, 264], [89, 300], [87, 328], [96, 337], [106, 320], [116, 282], [118, 252]])];
const forearmR = [blob([[73, 351], [59, 376], [53, 410], [51, 448], [62, 456], [76, 438], [89, 400], [97, 366], [92, 350]]), ink([[80, 362], [60, 440]])];
const absR = [blob([[198, 288], [186, 287], [177, 294], [175, 330], [176, 384], [182, 426], [191, 448], [198, 452]]), ink([[176, 316], [198, 314]]), ink([[176, 344], [198, 342]]), ink([[177, 372], [198, 371]])];
const obliqueR = [blob([[172, 298], [150, 308], [133, 326], [134, 356], [129, 386], [136, 406], [158, 428], [172, 436], [173, 390], [172, 340]]), ink([[140, 330], [168, 354]]), ink([[136, 362], [168, 392]])];
const quadR = [blob([[126, 452], [117, 500], [121, 560], [134, 610], [150, 622], [176, 616], [188, 580], [192, 520], [186, 470], [160, 448]]), ink([[150, 470], [158, 600]]), ink([[172, 480], [170, 596]])];
const calfR = [blob([[138, 660], [132, 694], [136, 740], [144, 786], [149, 744], [150, 698], [147, 662]]), blob([[183, 660], [189, 696], [187, 742], [181, 786], [177, 744], [176, 698], [178, 662]])];

/* ----------------------------------------------------------------- organs */
const brain = [
  blob([[200, 39], [181, 42], [170, 53], [167, 66], [172, 78], [185, 84], [200, 85], [215, 84], [228, 78], [233, 66], [230, 53], [219, 42]]),
  ink([[200, 41], [200, 84]]),
  ...both([ink([[194, 49], [185, 54], [189, 63]]), ink([[177, 58], [176, 69], [183, 74]]), ink([[194, 66], [189, 74], [194, 80]])]),
];
const eyeR = [oval(185, 93, 6.5, 4.6), oval(185, 93, 2.4, 2.4, 0, { tone: 'ink' })];
const earParts = [oval(159, 91, 5, 11, -6), ink([[160, 84], [157, 91], [160, 98]])];
const nose = [blob([[200, 94], [196, 105], [192, 110], [200, 114], [208, 110], [204, 105]])];
const mouth = [blob([[188, 124], [200, 121], [212, 124], [200, 129]]), ink([[189, 124], [200, 125], [211, 124]])];
const salivaryR = [oval(168, 108, 4.5, 8, 8), oval(184, 135, 4.5, 3.2, -18)];
const voiceBox = [blob([[192, 151], [200, 149], [208, 151], [209, 163], [200, 168], [191, 163]]), ink([[196, 158], [204, 158]])];
const thyroid = [oval(191.5, 173, 5, 8.5, -8), oval(208.5, 173, 5, 8.5, 8), box(193, 172, 14, 5.5, 2)];
const windpipe = [tube([[200, 165], [200, 217]], 11), ...[176, 184, 192, 200, 208].map((y) => ink([[195, y], [205, y]]))];
const bronchi = [
  tube([[200, 214], [187, 226], [176, 236]], 7), tube([[200, 214], [213, 226], [224, 236]], 7),
  tube([[178, 234], [166, 230], [156, 222]], 3.6), tube([[178, 235], [164, 246], [154, 262]], 3.6), tube([[170, 240], [172, 256], [168, 270]], 3.2),
  tube([[222, 234], [234, 230], [244, 222]], 3.6), tube([[222, 235], [238, 244], [250, 256]], 3.6), tube([[232, 240], [246, 262], [252, 274]], 3.2),
];
const foodPipe = [tube([[206, 150], [207, 200], [208, 258], [213, 301]], 7)];
const lungR = [
  blob([[176, 177], [189, 186], [192, 214], [190, 250], [189, 277], [171, 280], [151, 287], [135, 301], [131, 278], [133, 240], [142, 205], [158, 184]]),
  ink([[134, 246], [164, 240], [190, 240]]), ink([[133, 262], [154, 272], [176, 284]]),
];
const lungL = [
  blob([[224, 177], [211, 186], [208, 214], [213, 232], [230, 246], [243, 262], [247, 274], [243, 282], [254, 288], [265, 301], [269, 278], [267, 240], [258, 205], [242, 184]]),
  ink([[267, 236], [252, 262], [240, 288]]),
];
const heart = [
  blob([[188, 230], [204, 226], [222, 231], [240, 249], [247, 280], [237, 290], [206, 289], [181, 280], [178, 254]]),
  ink([[212, 232], [226, 260], [237, 287]]),
];
const aorta = [tube([[203, 238], [198, 214], [204, 199], [216, 205], [214, 240], [209, 300], [203, 340], [202, 367]], 9)];
const arteriesR = [
  tube([[199, 199], [190, 181], [187, 152], [184, 128]], 4),
  tube([[196, 200], [162, 193], [130, 206], [110, 280], [93, 342]], 4.2), tube([[93, 342], [80, 362], [64, 410], [53, 460]], 3.2), tube([[93, 342], [88, 384], [78, 420], [68, 462]], 3.2),
  tube([[203, 320], [180, 325]], 3.4),
  tube([[202, 366], [182, 398], [161, 440], [164, 520], [170, 606], [167, 650], [162, 740], [164, 836], [160, 862]], 4.4),
];
const arteriesL = flip([arteriesR[1], arteriesR[2], arteriesR[3], arteriesR[5]], CX).concat([tube([[208, 200], [211, 181], [213, 152], [216, 128]], 4), tube([[205, 314], [226, 318]], 3.4)]);
const veinsR = [
  tube([[192, 204], [181, 186], [179, 156], [177, 128]], 4.2),
  tube([[192, 204], [160, 200], [124, 216], [116, 284], [100, 346], [84, 404], [64, 466]], 4),
  tube([[195, 378], [178, 402], [168, 440], [172, 520], [178, 610], [176, 700], [173, 838]], 4.4),
];
const veinsL = flip(veinsR, CX);
const svc = [tube([[192, 203], [190, 238]], 8)];
const ivc = [tube([[193, 284], [194, 330], [195, 378]], 8)];
const diaphragm = [tube([[130, 322], [138, 301], [158, 286], [182, 286], [200, 292], [221, 290], [242, 287], [262, 301], [270, 322]], 5)];
const liver = [
  blob([[132, 310], [141, 296], [163, 291], [196, 295], [222, 297], [240, 297], [233, 305], [206, 316], [178, 329], [150, 345], [135, 341], [129, 326]]),
  ink([[196, 296], [192, 308], [190, 322]]),
];
const gallbladder = [blob([[166, 318], [172, 323], [170, 335], [163, 343], [157, 337], [160, 325]])];
const stomach = [
  blob([[212, 304], [232, 294], [250, 300], [256, 319], [249, 338], [232, 350], [211, 352], [196, 343], [188, 332], [196, 327], [207, 331], [215, 322], [211, 311]]),
];
const spleen = [oval(263, 320, 10, 18, 20)];
const pancreas = [blob([[166, 330], [180, 325], [196, 328], [215, 324], [235, 317], [252, 311], [251, 319], [233, 327], [213, 335], [197, 341], [185, 350], [171, 347], [164, 338]])];
const smallIntestine = [tube([[190, 331], [177, 334], [170, 346], [175, 360], [190, 368], [212, 376], [233, 384], [229, 394], [202, 390], [176, 388], [167, 398], [178, 406], [204, 404], [229, 408], [233, 418],
  [214, 422], [187, 418], [171, 424], [177, 435], [198, 433], [220, 436], [224, 446], [205, 449], [184, 446], [166, 436], [156, 425]], 10)];
const largeIntestine = [tube([[148, 428], [145, 400], [143, 364], [150, 345], [174, 362], [200, 371], [228, 364], [253, 342], [261, 331], [264, 346], [263, 382], [259, 410], [245, 428], [227, 424], [212, 434], [205, 444]], 16)];
const appendix = [tube([[146, 436], [151, 446], [148, 455]], 4.6)];
const rectum = [tube([[205, 444], [200, 458], [200, 477]], 13)];
const kidneyR = [blob([[162, 299], [173, 302], [179, 312], [176, 321], [172, 326], [176, 331], [179, 340], [173, 350], [162, 353], [153, 343], [150, 326], [153, 309]]), ink([[172, 326], [165, 326]])];
const kidneyL = shift(flip(kidneyR, CX), 0, -7);
const adrenalR = [blob([[159, 297], [169, 292], [176, 300], [167, 303]])];
const adrenals = [...sided(adrenalR, 'right'), ...sided(shift(flip(adrenalR, CX), 0, -7), 'left')];
const ureters = [...sided([tube([[176, 330], [181, 362], [183, 410], [191, 452], [196, 461]], 3)], 'right'), ...sided([tube([[224, 323], [220, 362], [217, 410], [209, 452], [204, 461]], 3)], 'left')];
const bladder = [blob([[200, 446], [213, 450], [216, 462], [208, 472], [200, 474], [192, 472], [184, 462], [187, 450]])];
const thymus = [blob([[200, 198], [207, 202], [209, 216], [204, 227], [200, 222], [196, 227], [191, 216], [193, 202]]), ink([[200, 200], [200, 221]])];
const nodes = (list) => list.map(([x, y]) => oval(x, y, 3.2, 3.2));
const spinalCord = [tube([[200, 106], [200, 326]], 4)];
const nervesR = [
  tube([[199, 172], [176, 184], [150, 197], [120, 214], [104, 290], [88, 346], [74, 410], [60, 468], [48, 546]], 2.6), tube([[88, 346], [84, 410], [70, 466], [60, 536]], 2.2),
  ...[222, 242, 262, 282].map((y) => tube([[199, y], [176, y + 5], [152, y + 14]], 1.8)),
  tube([[199, 326], [184, 380], [170, 424], [156, 470], [158, 560], [163, 640], [158, 740], [160, 838], [157, 868]], 2.8), tube([[199, 310], [178, 352], [160, 400], [146, 470], [140, 560]], 2.2),
];
const uterus = [blob([[188, 430], [200, 427], [212, 430], [210, 444], [204, 456], [196, 456], [190, 444]]), ink([[189, 431], [177, 426], [170, 433]]), ink([[211, 431], [223, 426], [230, 433]])];
const ovaries = both([oval(169, 438, 6, 4.5, -20)]);
const prostate = [oval(200, 481, 7, 5.5)];
const testes = both([oval(192, 501, 5.5, 8)]);

/** Pieces the view from behind reuses (the outline and the limbs look the same from both sides). */
export const shared = { skinParts, zones, cervical, thoracic, lumbar, sacrum, tailbone, hipR, humerusR, radiusR, ulnaR, handR, femurR, tibiaR, fibulaR, footR, forearmR, deltR, kidneyR, adrenalR, lungR, lungL, brain };

/* -------------------------------------------------------------- the view */
const P = (r) => ({ right: r, left: [2 * CX - r[0], r[1]] });

export default {
  id: 'front',
  width: 400,
  height: 900,
  /** One unit of the drawing is about this many centimetres on an adult 170 cm tall. */
  cm: 0.2,
  facing: 'front',
  region,
  shapes: [
    { id: 'skin', parts: skinParts, at: [233, 60] },
    // deepest first: the spine and the back wall
    { id: 'shoulder-blade', parts: both(bladeR) },
    { id: 'cervical-spine', parts: cervical, at: [200, 162] },
    { id: 'thoracic-spine', parts: thoracic, at: [200, 250] },
    { id: 'lumbar-spine', parts: lumbar, at: [200, 352] },
    { id: 'pelvis', parts: both(hipR), atSide: { right: [143, 392], left: [257, 392] } },
    { id: 'sacrum', parts: sacrum, at: [200, 408] },
    { id: 'tailbone', parts: tailbone, at: [200, 447] },
    { id: 'spinal-cord', parts: spinalCord, at: [200, 150], flow: [[200, 106], [200, 326]] },
    { id: 'humerus', parts: both(humerusR) },
    { id: 'radius', parts: both(radiusR) },
    { id: 'ulna', parts: both(ulnaR) },
    { id: 'hand-bones', parts: both(handR) },
    { id: 'femur', parts: both(femurR), atSide: { right: [150, 540], left: [250, 540] } },
    { id: 'tibia', parts: both(tibiaR), atSide: { right: [169, 740], left: [231, 740] } },
    { id: 'fibula', parts: both(fibulaR), atSide: { right: [149, 750], left: [251, 750] } },
    { id: 'kneecap', parts: both(kneecapR) },
    { id: 'foot-bones', parts: both(footR) },
    { id: 'nerves', parts: both(nervesR), atSide: { right: [104, 290], left: [296, 290] } },
    { id: 'veins', parts: [...sided(veinsR, 'right'), ...sided(veinsL, 'left')], atSide: { right: [172, 520], left: [228, 520] } },
    { id: 'arteries', parts: [...sided(arteriesR, 'right'), ...sided(arteriesL, 'left')], atSide: { right: [164, 520], left: [236, 520] } },
    { id: 'right-kidney', parts: sided(kidneyR, 'right') },
    { id: 'left-kidney', parts: sided(kidneyL, 'left') },
    { id: 'adrenals', parts: adrenals },
    { id: 'ureters', parts: ureters },
    { id: 'inferior-vena-cava', parts: ivc, flow: [[195, 378], [194, 330], [193, 284]] },
    { id: 'superior-vena-cava', parts: svc, flow: [[192, 203], [190, 238]] },
    { id: 'aorta', parts: aorta, at: [213, 262], flow: [[203, 238], [198, 214], [204, 199], [216, 205], [214, 240], [209, 300], [203, 340], [202, 367]] },
    { id: 'food-pipe', parts: foodPipe, at: [208, 262], flow: [[206, 150], [207, 200], [208, 258], [213, 301]] },
    { id: 'spleen', parts: sided(spleen, 'left') },
    { id: 'pancreas', parts: pancreas, at: [181, 337] },
    { id: 'rectum', parts: rectum, flow: [[205, 444], [200, 458], [200, 477]] },
    { id: 'uterus', parts: uterus },
    { id: 'ovaries', parts: ovaries },
    { id: 'prostate', parts: prostate },
    { id: 'stomach', parts: stomach, at: [234, 322], flow: [[213, 302], [236, 304], [240, 328], [222, 344], [200, 338], [190, 330]] },
    { id: 'small-intestine', parts: smallIntestine, at: [204, 404], flow: [[190, 331], [177, 334], [170, 346], [175, 360], [190, 368], [212, 376], [233, 384], [229, 394], [202, 390], [176, 388], [167, 398], [178, 406], [204, 404], [229, 408],
      [233, 418], [214, 422], [187, 418], [171, 424], [177, 435], [198, 433], [220, 436], [224, 446], [205, 449], [184, 446], [166, 436], [156, 425]] },
    { id: 'large-intestine', parts: largeIntestine, at: [263, 382], flow: [[148, 428], [145, 400], [143, 364], [150, 345], [174, 362], [200, 371], [228, 364], [253, 342], [261, 331], [264, 346], [263, 382], [259, 410], [245, 428], [227, 424],
      [212, 434], [205, 444]] },
    { id: 'appendix', parts: appendix },
    { id: 'bladder', parts: bladder },
    { id: 'testes', parts: testes },
    { id: 'right-lung', parts: sided(lungR, 'right'), at: [158, 222] },
    { id: 'left-lung', parts: sided(lungL, 'left'), at: [242, 218] },
    { id: 'bronchi', parts: bronchi, at: [182, 230] },
    { id: 'windpipe', parts: windpipe, at: [200, 196], flow: [[200, 165], [200, 217]] },
    { id: 'voice-box', parts: voiceBox },
    { id: 'thyroid', parts: thyroid, at: [209, 174] },
    { id: 'diaphragm', parts: diaphragm, at: [158, 286] },
    { id: 'heart', parts: heart, at: [212, 260] },
    { id: 'thymus', parts: thymus },
    { id: 'liver', parts: liver, at: [160, 306] },
    { id: 'gallbladder', parts: gallbladder },
    { id: 'lymph-nodes-neck', parts: both(nodes([[183, 148], [181, 158], [184, 167]])) },
    { id: 'lymph-nodes-armpit', parts: both(nodes([[125, 236], [129, 245], [121, 247]])) },
    { id: 'lymph-nodes-groin', parts: both(nodes([[166, 437], [172, 446], [160, 447]])) },
    // the bones of the chest and the head lie in front of the organs
    { id: 'ribs', parts: both(ribsR), atSide: { right: [133, 256], left: [267, 256] } },
    { id: 'breastbone', parts: breastbone, at: [200, 240] },
    { id: 'collarbone', parts: both(collarR) },
    { id: 'brain', parts: brain, at: [200, 62] },
    { id: 'skull', parts: skull, at: [200, 50] },
    { id: 'jaw', parts: jaw, at: [200, 136] },
    { id: 'salivary-glands', parts: both(salivaryR) },
    { id: 'eye', parts: both(eyeR) },
    { id: 'ear', parts: both(earParts) },
    { id: 'nose', parts: nose },
    { id: 'mouth', parts: mouth },
    // muscles lie over everything but the skin
    { id: 'calves', parts: both(calfR) },
    { id: 'quadriceps', parts: both(quadR) },
    { id: 'obliques', parts: both(obliqueR) },
    { id: 'abdominals', parts: both(absR) },
    { id: 'trapezius', parts: both(trapR) },
    { id: 'pectorals', parts: both(pecR) },
    { id: 'biceps', parts: both(bicepsR) },
    { id: 'forearm-muscles', parts: both(forearmR) },
    { id: 'deltoid', parts: both(deltR) },
  ],
  anchors: {
    'shoulder-joint': P([115, 199]), 'elbow-joint': P([87, 344]), 'wrist-joint': P([59, 466]), 'hip-joint': P([155, 432]), 'knee-joint': P([162, 638]), 'ankle-joint': P([166, 842]),
    'bone-marrow': P([150, 540]),
    'pulse-neck': P([186, 153]), 'pulse-arm': P([111, 290]), 'pulse-wrist': P([51, 460]), 'pulse-groin': P([161, 441]), 'pulse-foot': P([160, 860]),
    forehead: [200, 56], temple: P([168, 80]), chin: [200, 138], 'neck-front': [200, 160], shoulder: P([108, 198]), armpit: P([123, 250]),
    breast: P([164, 258]), 'chest-centre': [200, 262], 'right-upper-chest': [166, 206], 'left-side-chest': [270, 270], 'upper-abdomen': [200, 340], navel: [200, 370], 'lower-abdomen': [200, 416],
    'upper-arm': P([97, 280]), 'inner-elbow': P([90, 344]), forearm: P([74, 402]), wrist: P([59, 466]), palm: P([49, 506]), fingertip: P([45, 554]),
    hip: P([121, 434]), groin: P([163, 443]), thigh: P([152, 536]), knee: P([162, 636]), shin: P([165, 742]), ankle: P([166, 838]), 'foot-top': P([161, 858]), toes: P([159, 876]),
  },
};
