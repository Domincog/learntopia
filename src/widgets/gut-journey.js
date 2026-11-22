/**
 * gut-journey — follow one meal along the digestive tube. A clock slider moves the meal from the
 * mouth to the far end; the drawing shows where it is, a note says what happens to it there, and five
 * bars show how far the breaking-down of starch, protein and fat has got, how much of the meal's
 * nutrients has passed into the blood, and how much of the water has been taken back.
 *
 * {
 *   type: 'gut-journey',
 *   stop: 0,            // where the clock starts: an index into STOPS
 *   bars: true,         // show the five bars
 *   static: false,
 * }
 *
 * State: { stop, time, station, part, digested, absorbed, water, seen, seenAll }
 *   stop      index of the clock setting;  time — its label ("3 hours")
 *   station   id of the place the meal has reached (see STATIONS);  part — the organ it belongs to:
 *             'mouth' | 'oesophagus' | 'stomach' | 'small intestine' | 'large intestine' | 'out'
 *   digested  { starch, protein, fat } per cent broken down so far
 *   absorbed  per cent of the meal's usable nutrients that have entered the body so far
 *   water     per cent of the water (drink plus digestive juices) that has been taken back
 *   seen      ids of the stations the learner has visited;  seenAll — every station visited
 *
 * setState accepts { stop } and optionally { seen: [...] } (or seenAll: true).
 *
 * The model, and what it leaves out. The clock times are typical: about ten seconds down the oesophagus,
 * two to five hours in the stomach, two to six in the small intestine and anything from ten hours to
 * more than two days in the large intestine. A real meal does not travel as one lump (the stomach
 * releases it a little at a time), and times differ widely between people and between meals. The
 * percentages are rounded teaching values consistent with physiology texts (salivary amylase can
 * split up to 30 to 40% of starch before stomach acid stops it; pepsin does 10 to 20% of protein
 * digestion; over 90% of nutrients and most of the water are absorbed in the small intestine), and the
 * bars are labelled in words for that reason.
 */
import { frame, sliderRow, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

export const STATIONS = {
  mouth: { part: 'mouth', name: 'Mouth', at: [56, 30],
    note: 'Teeth cut and grind. Saliva wets the food, and its enzyme amylase starts cutting starch into sugars.' },
  oesophagus: { part: 'oesophagus', name: 'Oesophagus', at: [56, 76],
    note: 'A wave of muscle squeezes each mouthful down to the stomach in about ten seconds. It works even if you are upside down.' },
  stomach: { part: 'stomach', name: 'Stomach', at: [70, 138],
    note: 'The stomach churns the food with acid, which kills most germs, and with pepsin, an enzyme that starts cutting proteins. A coat of mucus protects the stomach\'s own wall.' },
  'small-first': { part: 'small intestine', name: 'Small intestine: first part', at: [148, 190],
    note: 'The stomach releases the mush a little at a time. Bile from the liver breaks fat into tiny droplets, and enzymes from the pancreas attack starch, protein and fat.' },
  'small-middle': { part: 'small intestine', name: 'Small intestine: middle', at: [180, 120],
    note: 'Enzymes on the lining finish the cutting. Sugars, amino acids and fats pass through millions of finger-like villi into the body.' },
  'small-end': { part: 'small intestine', name: 'Small intestine: end', at: [244, 110],
    note: 'Almost everything useful has now been absorbed, along with most of the water.' },
  large: { part: 'large intestine', name: 'Large intestine', at: [288, 160],
    note: 'What is left is mostly fibre. Trillions of bacteria ferment some of it, and the large intestine takes back water and salts.' },
  out: { part: 'out', name: 'Out', at: [288, 284],
    note: 'The remains (fibre, bacteria, worn-out gut cells and some water) leave the body, typically one to three days after the meal.' },
};

// time label, station, per cent of starch / protein / fat broken down, nutrients absorbed, water taken back
export const STOPS = [
  { time: 'first bite', station: 'mouth', starch: 5, protein: 0, fat: 0, absorbed: 0, water: 0 },
  { time: '1 minute', station: 'oesophagus', starch: 5, protein: 0, fat: 0, absorbed: 0, water: 0 },
  { time: '1 hour', station: 'stomach', starch: 30, protein: 15, fat: 5, absorbed: 0, water: 0 },
  { time: '3 hours', station: 'small-first', starch: 60, protein: 50, fat: 40, absorbed: 30, water: 30 },
  { time: '5 hours', station: 'small-middle', starch: 95, protein: 90, fat: 85, absorbed: 75, water: 65 },
  { time: '8 hours', station: 'small-end', starch: 100, protein: 95, fat: 95, absorbed: 95, water: 85 },
  { time: '16 hours', station: 'large', starch: 100, protein: 95, fat: 95, absorbed: 96, water: 95 },
  { time: '1 day', station: 'large', starch: 100, protein: 95, fat: 95, absorbed: 96, water: 98 },
  { time: '1½ days', station: 'out', starch: 100, protein: 95, fat: 95, absorbed: 96, water: 98 },
];
const STATION_IDS = Object.keys(STATIONS);

/** A share in words: the figures are too rough to print as numbers. */
export const inWords = (v) => (v <= 0 ? 'none yet' : v <= 10 ? 'a little' : v <= 35 ? 'some' : v <= 65 ? 'about half' : v <= 90 ? 'most' : 'nearly all');

const W = 560;
const H = 300;
const BX = 372;       // the bars panel
const BW = 180;

addStyles('gut-journey', `
  .widget-gut-journey .gj-bar-label { font-size: 12px; font-weight: 700; fill: var(--ink); }
  .widget-gut-journey .gj-bar-word { font-size: 12px; font-weight: 700; fill: var(--ink-2); }
  .widget-gut-journey .gj-note { min-height: 4.4em; }
  @container wcanvas (max-width: 470px) {
    .widget-gut-journey .gj-bar-label, .widget-gut-journey .gj-bar-word { font-size: 15px; }
  }
`);

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const showBars = spec.bars !== false;
  let stop = clamp(Math.round(spec.stop || 0), 0, STOPS.length - 1);
  let readOnly = !!env.readOnly;
  const seen = new Set([STOPS[stop].station]);

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'The digestive tube from mouth to large intestine, with a meal on its way through' });
  const { svg } = fr;

  // the tube, drawn once; each organ gets a vivid fill while the meal is in it
  const tube = (d, width) => {
    const outer = s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': width + 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    const inner = s('path', { d, fill: 'none', 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    svg.append(outer, inner);
    return inner;
  };
  const parts = {};
  parts['large intestine'] = tube('M244 72 H288 V258', 26);
  parts['small intestine'] = tube('M112 142 H148 V236 H180 V72 H212 V236 H244 V72', 13);
  parts.oesophagus = tube('M56 40 V104', 12);
  parts.stomach = s('path', { d: 'M56 100 C96 96 122 116 118 146 C114 178 62 182 36 164 C14 148 24 108 56 100 Z', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  parts.mouth = s('rect', { x: 20, y: 14, width: 72, height: 32, rx: 14, stroke: 'var(--ink)', 'stroke-width': 3 });
  svg.append(parts.stomach, parts.mouth);
  const TINT = { mouth: 'pink', oesophagus: 'pink', stomach: 'orange', 'small intestine': 'yellow', 'large intestine': 'teal' };
  // the two glands that pour their juices into the first part of the small intestine
  svg.appendChild(s('path', { d: 'M100 70 Q128 56 156 72 Q160 92 132 96 Q104 96 100 70 Z', fill: hue('violet', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  svg.appendChild(s('ellipse', { cx: 84, cy: 204, rx: 32, ry: 11, fill: hue('green', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  const drip = (d) => s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': '2 5' });
  svg.append(drip('M130 97 V132'), drip('M112 198 Q128 186 130 154'));
  const lab = (x, y, str, anchor = 'middle', cls = 'fig-label-sm') => s(`text.${cls}`, { x, y, 'text-anchor': anchor }, str);
  svg.append(
    lab(56, 35, 'mouth'), lab(72, 144, 'stomach'), lab(129, 60, 'liver'), lab(84, 232, 'pancreas'),
    lab(196, 262, 'small intestine'), lab(308, 150, 'large', 'start'), lab(308, 165, 'intestine', 'start'),
    lab(196, 20, 'oesophagus'),
  );
  svg.appendChild(s('path', { d: 'M150 24 Q100 30 66 64', fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
  svg.appendChild(s('path', { d: 'M288 264 V290 M280 282 L288 292 L296 282', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

  const meal = s('g');
  meal.append(s('circle', { r: 11, fill: hue('red'), stroke: 'var(--ink)', 'stroke-width': 2.5 }), s('circle', { r: 3.5, fill: 'var(--ink)' }));
  svg.appendChild(meal);

  // the bars
  const BARS = [
    { key: 'starch', label: 'starch broken down', color: 'yellow' },
    { key: 'protein', label: 'protein broken down', color: 'pink' },
    { key: 'fat', label: 'fat broken down', color: 'orange' },
    { key: 'absorbed', label: 'nutrients absorbed', color: 'green' },
    { key: 'water', label: 'water taken back', color: 'blue' },
  ];
  const barEls = {};
  if (showBars) {
    BARS.forEach((b, i) => {
      const y = 12 + i * 57;
      svg.appendChild(s('text.gj-bar-label', { x: BX, y: y + 12 }, b.label));
      svg.appendChild(s('rect', { x: BX, y: y + 18, width: BW, height: 16, rx: 6, fill: 'var(--sunken)', stroke: 'var(--ink)', 'stroke-width': 2 }));
      const fill = s('rect', { x: BX + 2, y: y + 20, width: 0, height: 12, rx: 4, fill: hue(b.color) });
      const word = s('text.gj-bar-word', { x: BX + BW, y: y + 48, 'text-anchor': 'end' }, '');
      svg.append(fill, word);
      barEls[b.key] = { fill, word };
    });
  }

  const note = h('p.w-hint.gj-note', { 'aria-live': 'polite' });
  const valuesAt = (i) => { const st = STOPS[i]; return { starch: st.starch, protein: st.protein, fat: st.fat, absorbed: st.absorbed, water: st.water }; };

  function getState() {
    const st = STOPS[stop];
    return {
      stop, time: st.time, station: st.station, part: STATIONS[st.station].part,
      digested: { starch: st.starch, protein: st.protein, fat: st.fat }, absorbed: st.absorbed, water: st.water,
      seen: STATION_IDS.filter((id) => seen.has(id)), seenAll: STATION_IDS.every((id) => seen.has(id)),
    };
  }

  let row = null;
  function render() {
    const st = STOPS[stop];
    const station = STATIONS[st.station];
    for (const [part, el] of Object.entries(parts)) {
      const on = station.part === part;
      const color = hue(TINT[part], on ? '' : 'soft');
      if (el.tagName === 'path' && el.getAttribute('fill') === 'none') el.setAttribute('stroke', color);
      else el.setAttribute('fill', color);
    }
    meal.setAttribute('transform', `translate(${station.at[0]} ${station.at[1]})`);
    if (showBars) {
      const v = valuesAt(stop);
      for (const b of BARS) {
        barEls[b.key].fill.setAttribute('width', Math.max(0, ((BW - 4) * v[b.key]) / 100));
        barEls[b.key].word.textContent = inWords(v[b.key]);
      }
    }
    note.textContent = `${station.name}. ${station.note}`;
    const v = valuesAt(stop);
    svg.setAttribute('aria-label', `${spec.alt || 'The digestive tube with a meal on its way through'}. ${st.time === 'first bite' ? 'At the first bite' : `After ${st.time}`} the meal is here: ${station.name}. Starch broken down: ${inWords(v.starch)}. Protein: ${inWords(v.protein)}. Fat: ${inWords(v.fat)}. Nutrients absorbed: ${inWords(v.absorbed)}. Water taken back: ${inWords(v.water)}.`);
  }

  if (!isStatic) {
    row = sliderRow({
      label: 'time since eating', min: 0, max: STOPS.length - 1, step: 1, value: stop, color: 'red',
      format: (v) => STOPS[v].time,
      onInput: (v) => {
        if (readOnly) return;
        // dragging past a station still passes through it
        const lo = Math.min(stop, v);
        const hi = Math.max(stop, v);
        for (let i = lo; i <= hi; i++) seen.add(STOPS[i].station);
        stop = v;
        play('tick');
        render();
        row.input.setAttribute('aria-valuetext', `${STOPS[stop].time}: ${STATIONS[STOPS[stop].station].name}`);
        env.onChange(getState());
      },
    });
    row.input.setAttribute('aria-valuetext', `${STOPS[stop].time}: ${STATIONS[STOPS[stop].station].name}`);
    fr.controls.appendChild(row.el);
  }
  if (!env.compact) fr.el.insertBefore(note, fr.readouts);
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.stop === 'number') stop = clamp(Math.round(next.stop), 0, STOPS.length - 1);
      seen.add(STOPS[stop].station);
      if (Array.isArray(next.seen)) for (const id of next.seen) if (STATIONS[id]) seen.add(id);
      if (next.seenAll) for (const id of STATION_IDS) seen.add(id);
      if (row) { row.set(stop); row.input.setAttribute('aria-valuetext', `${STOPS[stop].time}: ${STATIONS[STOPS[stop].station].name}`); }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (row) row.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'gut-journey — follow a meal from mouth to the far end', spec: { type: 'gut-journey' } },
  { title: 'gut-journey — five hours after eating', spec: { type: 'gut-journey', stop: 4, static: true } },
];
