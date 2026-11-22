/**
 * photo — a photograph or an artwork with its credit, and optionally parts
 * of the picture the learner can tap.
 *
 * Authors do not write this spec by hand. Pictures enter the project through
 * tools/fetch-image.mjs, which records author, licence and size, and lessons
 * build the spec from that record (see docs/IMAGES.md):
 *
 *   import { MEDIA } from '../../../media/<course-id>/index.js';
 *   import { photo } from '../../../media.js';
 *   figure: photo(MEDIA['angkor-wat'], { alt: 'A stone temple with five towers…', caption: 'Angkor Wat at sunrise' })
 *
 * {
 *   type: 'photo',
 *   src: 'content/media/<course>/<id>.jpg?v=…',   // same-origin file; never a link to another site
 *   thumb: '…/<id>.480.jpg?v=…',                  // small copy, used inside answer options
 *   width: 1280, height: 853,                     // pixel size of the file: reserves the space before it loads
 *   alt: 'What the picture shows',                // REQUIRED. In an answer option, describe without naming the answer
 *   caption: 'Shown under the picture',           // optional
 *   credit: 'Jane Doe',                           // author, as recorded by the fetch tool
 *   license: 'CC BY-SA 4.0', licenseUrl: '…', sourceUrl: 'https://commons.wikimedia.org/wiki/File:…',
 *   publicDomain: false, title: 'Name of the work', changes: 'resized',
 *   creditLabel: 'Painting',                      // optional first word of the credit (default "Photo", or "Image" for public-domain works)
 *
 *   aspect: '16:9',                               // optional: show in a box of this shape instead of the picture's own
 *   fit: 'cover',                                 //   'cover' fills the box and cuts the overhang, 'contain' shows everything
 *   focus: [0.5, 0.3],                            //   with 'cover': the point of the picture that must stay in view
 *   magnify: 1.5,                                 //   with 'cover': enlarge the picture this many times around `focus` (1 = not at all)
 *   maxWidth: 640,                                // optional: largest display width in px
 *   zoom: true,                                   // false removes the enlarge button
 *
 *   hotspots: [                                   // parts of the picture, in fractions of its width and height
 *     { id: 'tower', x: 0.52, y: 0.31, r: 0.07, label: 'Central tower', alt: 'the tallest tower' },
 *   ],                                            //   r is a fraction of the WIDTH (a circle on screen); alt is a neutral
 *                                                 //   description read out while the labels are hidden
 *   mode: 'pick',                                 // with hotspots: 'pick'  numbered rings, the learner chooses one (default)
 *                                                 //                'point' nothing is marked, the learner taps or moves a pin
 *                                                 //                'label' rings with their labels, nothing to answer
 *   hideLabels: true,                             // pick: labels stay hidden until the step is answered (default true);
 *                                                 //   false shows the labels on the rings from the start
 * }
 *
 * Inside a choice option (env.compact) the picture is shown small, in a 4:3
 * card (or the `aspect` given), from the `thumb` file, without credit or
 * zoom: the choice step lists the credits itself. By default the picture
 * fills the card and its overhang is cut evenly (fit 'cover'); `focus` says
 * which part of the overhang goes. A 3:2 picture has nothing to spare above
 * and below in a 4:3 card, so a card whose focus points up or down there is
 * enlarged a little (magnify 1.25 unless the spec says otherwise) and shows
 * the part of the picture around that point; `magnify` does the same on any
 * card or figure. fit 'contain' shows the whole picture inside the same
 * card, with bands at the sides or above and below.
 *
 * A `caption` may use inline Markdown (*italic*, **bold**, $math$), like other lesson text.
 *
 * State:  pick   { picked: 'tower' | null, label: 'Central tower' | null }
 *         point  { picked: id of the hotspot under the pin, or null, point: { x, y } | null, label }
 *         otherwise {}
 * setState accepts { picked } (point mode moves the pin to that hotspot's centre) or { point: { x, y } }.
 * A lesson checks with  check: (s) => s.picked === 'tower'  and gives  solution: { picked: 'tower' }.
 */
import { frame, h, cx, clamp, addStyles, icon, mdInline } from './kit.js';
import { play } from '../core/audio.js';

/* ------------------------------------------------------------- pure parts */

const UNKNOWN = /^(unknown( author)?|anonymous|see the source page for the author)?$/i;

/**
 * The pieces of a credit: { label, author, license, licenseUrl, sourceUrl, via, publicDomain, title, changes }.
 * `author` is null when nobody is named.
 */
export function creditParts(spec = {}) {
  const author = spec.credit && !UNKNOWN.test(String(spec.credit).trim()) ? String(spec.credit).trim() : null;
  const publicDomain = !!spec.publicDomain;
  const source = spec.sourceUrl || null;
  return {
    label: spec.creditLabel || (publicDomain ? 'Image' : 'Photo'),
    author,
    license: spec.license || null,
    licenseUrl: spec.licenseUrl || null,
    sourceUrl: source,
    via: source && /^https:\/\/([a-z-]+\.)?wikimedia\.org\//.test(source) ? 'Wikimedia Commons' : null,
    publicDomain,
    title: spec.title || null,
    changes: spec.changes || null,
  };
}

/** "Photo: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons" — the line shown under a picture. */
export function creditLine(spec = {}) {
  const p = creditParts(spec);
  if (!p.author && !p.license) return '';
  const lower = (text) => (/^(public domain|no known copyright restrictions)$/i.test(text) ? text.toLowerCase() : text);
  const bits = [];
  // A licence that requires attribution is never shown without one: when the record names nobody,
  // the line says where the name is to be found (and it links there).
  const free = p.publicDomain || !p.license || /^(public domain|cc0|no known copyright restrictions)/i.test(p.license);
  if (!p.author && !free) bits.push(`${p.label}: author named on the source page`);
  if (p.author) bits.push(`${p.label}: ${p.author}`);
  if (p.license) bits.push(p.author || !free ? lower(p.license) : p.license);
  if (p.via) bits.push(`via ${p.via}`);
  return bits.join(', ');
}

/**
 * The hotspot under a point. x and y are fractions of the picture, `aspect`
 * is its width / height. Radii are fractions of the width, so every hotspot
 * is a circle on screen. Where spots overlap, the smallest one wins.
 */
export function hotspotAt(spots, x, y, aspect) {
  let best = null;
  for (const sp of spots || []) {
    const d = Math.hypot(x - sp.x, (y - sp.y) / aspect);
    if (d <= sp.r && (!best || sp.r < best.r)) best = sp;
  }
  return best ? best.id : null;
}

/** With fit 'cover': the part of a width × height picture that shows in a box of shape `boxAspect`. */
export function coverBox(width, height, boxAspect, focus = [0.5, 0.5]) {
  const natural = width / height;
  if (natural > boxAspect) {
    const w = height * boxAspect;
    return { x: (width - w) * clamp(focus[0], 0, 1), y: 0, width: w, height };
  }
  const hgt = width / boxAspect;
  return { x: 0, y: (height - hgt) * clamp(focus[1], 0, 1), width, height: hgt };
}

/**
 * The part of a picture shown when it is enlarged `magnify` times inside a box of shape `boxAspect`
 * and centred, as far as its edges allow, on `focus`. Everything in fractions of the picture:
 * { x, y, w, h }. With magnify 1 this is the largest part of the picture that has the box's shape.
 */
export function cropWindow(natural, boxAspect, focus = [0.5, 0.5], magnify = 1) {
  const m = Math.max(1, Number(magnify) || 1);
  const w = (natural > boxAspect ? boxAspect / natural : 1) / m;
  const hgt = (natural > boxAspect ? 1 : natural / boxAspect) / m;
  return { x: clamp(focus[0] - w / 2, 0, 1 - w), y: clamp(focus[1] - hgt / 2, 0, 1 - hgt), w, h: hgt };
}

function parseShape(value) {
  if (typeof value === 'number') return value > 0 ? value : null;
  const m = /^\s*(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)\s*$/.exec(String(value || ''));
  return m && Number(m[2]) > 0 ? Number(m[1]) / Number(m[2]) : null;
}

/* ------------------------------------------------------------------ style */

addStyles('photo', `
  .widget-photo { gap: var(--s2); }
  .widget-photo .w-canvas { background: var(--sunken); }
  .widget-photo .w-canvas > svg { pointer-events: none; }
  .widget-photo .w-canvas .ph-zoom svg { width: 18px; height: 18px; }   /* icons are not drawings: the kit would stretch them */
  .widget-photo .w-canvas .ph-error svg { width: 28px; height: 28px; }
  .widget-photo .ph-img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 0.25s ease; color: transparent; }
  .widget-photo .w-canvas.is-loaded .ph-img { opacity: 1; }
  .widget-photo .w-canvas.is-zoomable .ph-img { cursor: zoom-in; }
  .widget-photo .ph-error { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: var(--s2); padding: var(--s4); text-align: center; color: var(--ink-2); font-size: var(--fs-sm); background: var(--sunken); }
  .widget-photo .ph-error b { color: var(--ink); }
  .widget-photo .ph-zoom {
    position: absolute; right: 8px; bottom: 8px; width: 40px; height: 40px; padding: 0; display: grid; place-items: center;
    border: 1.5px solid var(--edge); border-radius: 50%; background: var(--surface); color: var(--ink);
    opacity: 0.9; transition: transform 0.09s ease, opacity 0.15s ease;
  }
  .widget-photo .ph-zoom:hover { opacity: 1; transform: scale(1.06); }
  .widget-photo .ph-credit { margin: 0; font-size: var(--fs-xs); line-height: 1.35; color: var(--ink-3); text-align: right; overflow-wrap: anywhere; }
  .widget-photo .ph-credit a { color: inherit; text-decoration-thickness: 1px; text-underline-offset: 2px; }
  .widget-photo .ph-credit a:hover { color: var(--ink); }
  .widget-photo.is-compact .w-canvas { border-radius: 8px; border-width: 0; }

  /* parts of the picture */
  .widget-photo .ph-spots { position: absolute; inset: 0; }
  .widget-photo .ph-spots.is-point { cursor: crosshair; touch-action: manipulation; }
  .widget-photo .ph-spot {
    position: absolute; transform: translate(-50%, -50%); aspect-ratio: 1; min-width: 44px; padding: 0;
    border: 3px solid var(--ink); border-radius: 50%; background: transparent; color: var(--ink);
    box-shadow: 0 0 0 2.5px var(--surface), inset 0 0 0 2.5px var(--surface);
    transition: background-color 0.15s ease, border-color 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .widget-photo button.ph-spot { cursor: pointer; touch-action: manipulation; }
  .widget-photo button.ph-spot:hover { background: color-mix(in srgb, var(--surface) 35%, transparent); }
  .widget-photo .ph-spot[aria-checked='true'], .widget-photo .ph-spot.is-hit { border-color: var(--blue); background: color-mix(in srgb, var(--blue) 38%, transparent); box-shadow: 0 0 0 2.5px var(--surface), inset 0 0 0 2.5px var(--surface), 0 0 0 6px var(--blue); }
  .widget-photo .ph-spot:disabled { cursor: default; }
  .widget-photo .ph-num {
    position: absolute; left: 50%; top: 0; transform: translate(-50%, -55%); min-width: 26px; height: 26px; padding: 0 6px; display: grid; place-items: center;
    border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--surface); color: var(--ink);
    font-size: var(--fs-sm); font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums;
  }
  .widget-photo .ph-spot[aria-checked='true'] .ph-num { background: var(--blue); border-color: var(--edge-strong); color: var(--on-color); }
  .widget-photo .ph-tag {
    position: absolute; top: calc(100% + 5px); left: 50%; transform: translateX(-50%); width: max-content; max-width: 11rem; padding: 2px 8px;
    border: var(--bw) solid var(--edge); border-radius: 8px; background: var(--surface); color: var(--ink);
    font-size: var(--fs-xs); font-weight: 700; line-height: 1.25; text-align: center; white-space: normal; pointer-events: none;
  }
  .widget-photo .ph-spot.at-left .ph-tag { left: 0; transform: none; text-align: left; }
  .widget-photo .ph-spot.at-right .ph-tag { left: auto; right: 0; transform: none; text-align: right; }
  .widget-photo .ph-spot.at-bottom .ph-tag { top: auto; bottom: calc(100% + 5px); }
  .widget-photo .ph-spot.at-bottom .ph-num { top: 100%; transform: translate(-50%, -45%); }
  /* a ring so close to the bottom edge that a number under it would be cut off keeps its number on top */
  .widget-photo .ph-spot.at-bottom.num-top .ph-num { top: 0; transform: translate(-50%, -55%); }
  .widget-photo .ph-spots.is-pick .ph-spot.at-bottom.num-top:not(.is-flipped):not(.is-beside-right):not(.is-beside-left) .ph-tag { bottom: calc(100% + 17px); }
  /* a label that would cover another one moves to the other side of its ring (see arrange()) */
  .widget-photo .ph-spot.is-flipped .ph-tag { top: auto; bottom: calc(100% + 5px); }
  .widget-photo .ph-spots.is-pick .ph-spot.is-flipped .ph-tag { bottom: calc(100% + 17px); }
  .widget-photo .ph-spot.at-bottom.is-flipped .ph-tag { bottom: auto; top: calc(100% + 5px); }
  .widget-photo .ph-spots.is-pick .ph-spot.at-bottom.is-flipped .ph-tag { top: calc(100% + 17px); }
  .widget-photo .ph-spot.is-beside-right .ph-tag { top: 50%; bottom: auto; left: calc(100% + 6px); right: auto; transform: translateY(-50%); text-align: left; }
  .widget-photo .ph-spot.is-beside-left .ph-tag { top: 50%; bottom: auto; right: calc(100% + 6px); left: auto; transform: translateY(-50%); text-align: right; }
  .widget-photo .ph-spots.hides-labels:not(.is-revealed) .ph-tag { display: none; }
  .widget-photo .ph-spots:not(.is-pick) .ph-num { display: none; }
  .widget-photo .ph-spots.is-point:not(.is-revealed) .ph-spot { display: none; }
  .widget-photo .ph-pin {
    position: absolute; width: 44px; height: 44px; transform: translate(-50%, -50%); display: grid; place-items: center; border-radius: 50%;
    cursor: grab; touch-action: none; color: var(--ink);
  }
  .widget-photo .ph-pin::before { content: ''; width: 22px; height: 22px; border-radius: 50%; border: 3px solid var(--ink); background: var(--orange); box-shadow: 0 0 0 2.5px var(--surface); }
  .widget-photo .ph-pin.is-unplaced::before { background: var(--surface); border-style: dashed; }
  .widget-photo .ph-pin:active { cursor: grabbing; }
  .widget-photo.is-readonly .ph-pin { cursor: default; pointer-events: none; }
  .widget-photo .ph-hint { margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-3); }

  /* enlarged view */
  .widget-photo .ph-lightbox {
    padding: 0; border: var(--bw) solid var(--edge); border-radius: var(--r-lg); background: var(--surface); color: var(--ink);
    max-width: min(96vw, 1400px); max-height: 94vh; max-height: 94dvh; overflow: auto; box-shadow: var(--shadow-lg);
  }
  .widget-photo .ph-lightbox::backdrop { background: var(--scrim); }
  .widget-photo .ph-lb-inner { position: relative; display: grid; }
  .widget-photo .ph-lb-img { display: block; width: auto; height: auto; max-width: 100%; max-height: 78vh; max-height: 78dvh; margin: 0 auto; background: var(--sunken); }
  .widget-photo .ph-lb-text { padding: var(--s3) var(--s4); display: grid; gap: var(--s1); max-width: 70ch; }
  .widget-photo .ph-lb-caption { margin: 0; font-weight: 700; }
  .widget-photo .ph-lb-credit { margin: 0; font-size: var(--fs-sm); color: var(--ink-2); overflow-wrap: anywhere; }
  .widget-photo .ph-lb-close {
    position: absolute; top: 8px; right: 8px; width: 44px; height: 44px; padding: 0; display: grid; place-items: center;
    border: var(--bw) solid var(--edge); border-radius: 50%; background: var(--surface); color: var(--ink); box-shadow: 2px 2px 0 var(--drop);
  }
  @media (prefers-reduced-motion: reduce) { .widget-photo .ph-img { transition: none; } }
`);

const link = (href, text) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text);

/** The full credit, as shown in the enlarged view: title, author, source, licence and what was changed. */
function fullCredit(spec) {
  const p = creditParts(spec);
  const out = [];
  if (p.title) out.push(`“${p.title}”`);
  const named = p.author || (p.license && !p.publicDomain && !/^(public domain|cc0|no known copyright restrictions)/i.test(p.license) ? 'the author named on the source page' : null);
  out.push(named ? `${p.title ? ' by ' : `${p.label}: `}${named}. ` : p.title ? '. ' : '');
  if (p.license) out.push('Licence: ', p.licenseUrl ? link(p.licenseUrl, p.license) : p.license, '. ');
  if (p.sourceUrl) out.push('Source: ', link(p.sourceUrl, p.via || 'original file'), '. ');
  if (p.changes) out.push(`Changes: ${p.changes}.`);
  return out;
}

/* ----------------------------------------------------------------- widget */

export default function create(spec, env) {
  const W = spec.width > 0 ? spec.width : 1200;
  const H = spec.height > 0 ? spec.height : 900;
  const natural = W / H;
  const compact = !!env.compact;
  const spots = !compact && Array.isArray(spec.hotspots)
    ? spec.hotspots.filter((sp) => sp && sp.id != null && Number.isFinite(sp.x) && Number.isFinite(sp.y)).map((sp) => ({ ...sp, r: sp.r > 0 ? sp.r : 0.06 }))
    : [];
  const mode = !spots.length ? 'plain' : ['pick', 'point', 'label'].includes(spec.mode) ? spec.mode : 'pick';
  const hideLabels = mode === 'point' || (mode === 'pick' && spec.hideLabels !== false);
  let readOnly = !!env.readOnly;
  let picked = null;
  let point = null;

  // The box the picture is shown in. Hotspots are positioned on the whole picture, so they keep its own shape.
  const cover = !spots.length && (spec.fit || (compact ? 'cover' : 'contain')) === 'cover';
  // A card (an answer option) always has the standard 4:3 shape unless the spec names another: with
  // fit 'contain' the whole picture sits inside it, so that a row of cards stays even.
  const boxAspect = spots.length ? natural : parseShape(spec.aspect) || (compact ? 4 / 3 : natural);
  const focus = Array.isArray(spec.focus) ? spec.focus : [0.5, 0.5];
  // Enlarged around the focus point: when the spec asks for it (`magnify`), and on a card whose
  // `focus` would otherwise do nothing. A focus can only choose which part of the OVERHANG is cut,
  // and a 3:2 picture in a 4:3 card has none above and below (and little at the sides): there a
  // focus that points up or down is honoured by enlarging the picture a little. Cards whose focus
  // already works (a tall picture, a panorama) are shown exactly as before.
  const overX = natural > boxAspect ? 1 - boxAspect / natural : 0;
  const overY = natural > boxAspect ? 0 : 1 - natural / boxAspect;
  const stuck = compact && cover && Array.isArray(spec.focus)
    && ((overX < 0.02 && Math.abs(focus[0] - 0.5) > 0.02) || (overY < 0.02 && Math.abs(focus[1] - 0.5) > 0.02));
  const magnify = spec.magnify > 0 ? Math.max(1, spec.magnify) : stuck ? 1.25 : 1;
  const windowed = cover && (spec.magnify > 0 || stuck);
  const maxWidth = compact ? 300 : spec.maxWidth || (boxAspect >= 1 ? 640 : Math.round(clamp(620 * boxAspect, 280, 560)));
  const fr = frame({ width: 1000, height: Math.round(1000 / boxAspect), compact, maxWidth });
  const { canvas, svg } = fr;
  // The SVG only reserves the picture's space (so nothing moves when the file arrives); the <img> carries the description.
  svg.removeAttribute('role');
  svg.setAttribute('aria-hidden', 'true');
  fr.el.setAttribute('role', 'group');
  fr.el.setAttribute('aria-label', mode === 'pick' || mode === 'point' ? 'Picture with parts to choose' : 'Picture');

  const img = h('img.ph-img', {
    src: compact && spec.thumb ? spec.thumb : spec.src,
    alt: spec.alt || '',
    width: String(W), height: String(H),
    loading: 'lazy', decoding: 'async', draggable: 'false',
    style: { objectFit: cover ? 'cover' : 'contain', objectPosition: `${clamp(focus[0], 0, 1) * 100}% ${clamp(focus[1], 0, 1) * 100}%` },
  });
  if (windowed) {
    // place the picture so that exactly the chosen window fills the box
    const win = cropWindow(natural, boxAspect, [clamp(focus[0], 0, 1), clamp(focus[1], 0, 1)], magnify);
    Object.assign(img.style, {
      objectFit: 'fill', objectPosition: '', right: 'auto', bottom: 'auto', maxWidth: 'none',
      width: `${100 / win.w}%`, height: `${100 / win.h}%`, left: `${(-win.x / win.w) * 100}%`, top: `${(-win.y / win.h) * 100}%`,
    });
  }
  const loaded = () => { if (img.naturalWidth > 0) canvas.classList.add('is-loaded'); };
  img.addEventListener('load', loaded);
  img.addEventListener('error', () => {
    canvas.classList.add('is-error');
    canvas.appendChild(h('div.ph-error', icon('eye-off', 28), h('b', 'This picture could not be loaded.'), spec.alt ? h('span', spec.alt) : null));
  });
  canvas.insertBefore(img, svg);
  loaded();

  /* caption: the widget loader writes it under the figure as plain text; give it the lesson's inline formatting */
  if (spec.caption && /[*_`$=[\\]/.test(String(spec.caption)) && typeof queueMicrotask === 'function') {
    queueMicrotask(() => {
      const figure = fr.el.parentElement;
      const cap = figure && figure.classList.contains('widget-figure') ? figure.querySelector(':scope > figcaption.widget-caption') : null;
      if (cap && cap.textContent === String(spec.caption)) cap.innerHTML = mdInline(String(spec.caption));   // mdInline escapes HTML itself
    });
  }

  /* credit */
  const line = creditLine(spec);
  if (!compact && line) {
    fr.el.insertBefore(h('p.ph-credit', spec.sourceUrl ? link(spec.sourceUrl, line) : line), fr.readouts);
  }

  /* enlarge */
  let dialog = null;
  const canZoom = !compact && mode === 'plain' && spec.zoom !== false && typeof HTMLDialogElement === 'function';
  if (canZoom) {
    const open = () => {
      if (!dialog) {
        const close = h('button.ph-lb-close', { type: 'button', 'aria-label': 'Close the enlarged picture', onclick: () => dialog.close() }, icon('x', 22));
        dialog = h('dialog.ph-lightbox', { 'aria-label': 'Enlarged picture' },
          h('div.ph-lb-inner',
            h('img.ph-lb-img', { src: spec.src, alt: spec.alt || '', width: String(W), height: String(H), decoding: 'async' }),
            close,
            h('div.ph-lb-text', spec.caption ? h('p.ph-lb-caption', { html: mdInline(String(spec.caption)) }) : null, h('p.ph-lb-credit', fullCredit(spec)))));
        dialog.dataset.keys = 'own';
        dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); }); // a click on the backdrop
        fr.el.appendChild(dialog);
      }
      if (!dialog.open) dialog.showModal();
    };
    canvas.classList.add('is-zoomable');
    img.addEventListener('click', open);
    canvas.appendChild(h('button.ph-zoom', { type: 'button', 'aria-label': 'Enlarge the picture', title: 'Enlarge', onclick: open }, icon('search', { size: 18, stroke: 2.4 })));
  }

  /* parts of the picture */
  const label = (id) => { const sp = spots.find((x) => x.id === id); return sp ? sp.label || null : null; };
  const getState = () => {
    if (mode === 'pick') return { picked, label: label(picked) };
    if (mode === 'point') return { picked, point: point ? { x: point.x, y: point.y } : null, label: label(picked) };
    return {};
  };
  let layer = null;
  let pin = null;
  let hint = null;
  let watcher = null;
  const buttons = new Map();

  /**
   * Labels that are showing must not cover one another (narrow portrait pictures, spots close
   * together). Labels are taken in order. One that overlaps an earlier label is moved: to the
   * other side of its ring, beside the ring, or pushed clear on its own side, whichever leaves it
   * overlapping no label, covering the fewest other rings, and inside the picture. A label that
   * overlaps no earlier label is never moved, so a picture without collisions looks exactly as
   * it always did.
   */
  function arrange() {
    if (!layer || !layer.isConnected) return;
    const items = spots.map((sp) => buttons.get(sp.id)).map((el) => ({ el, tag: el && el.querySelector('.ph-tag') })).filter((it) => it.tag);
    const place = (it, where, shift) => {
      it.el.classList.toggle('is-flipped', where === 'flip');
      it.el.classList.toggle('is-beside-right', where === 'right');
      it.el.classList.toggle('is-beside-left', where === 'left');
      it.tag.style.marginTop = '';
      it.tag.style.marginBottom = '';
      if (shift) it.tag.style[it.el.classList.contains('at-bottom') !== (where === 'flip') ? 'marginBottom' : 'marginTop'] = `${Math.ceil(shift)}px`;
    };
    for (const it of items) place(it, '', 0);
    const box = layer.getBoundingClientRect();
    if (!box.width || items.length < 2) return;
    const rect = (it) => it.tag.getBoundingClientRect();
    const hits = (a, b) => a.width > 0 && b.width > 0 && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    for (let i = 1; i < items.length; i++) {
      const me = items[i];
      const labels = () => items.filter((o) => o !== me).map(rect);
      if (!items.slice(0, i).some((o) => hits(rect(me), rect(o)))) continue;
      const rings = items.filter((o) => o !== me).map((o) => o.el.getBoundingClientRect());
      // how far to push the label, on the side it is on, to clear the labels it runs into there
      const clearance = (where) => {
        const mine = rect(me);
        const inWay = labels().filter((o) => hits(mine, o));
        if (!inWay.length) return 0;
        const upward = me.el.classList.contains('at-bottom') !== (where === 'flip');
        return upward ? mine.bottom - Math.min(...inWay.map((o) => o.top)) + 4 : Math.max(...inWay.map((o) => o.bottom)) - mine.top + 4;
      };
      let best = null;
      for (const [where, push] of [['flip', false], ['right', false], ['left', false], ['', true], ['flip', true]]) {
        place(me, where, 0);
        const shift = push ? clearance(where) : 0;
        if (push) place(me, where, shift);
        const mine = rect(me);
        const outside = mine.top < box.top || mine.bottom > box.bottom || mine.left < box.left || mine.right > box.right;
        const cost = labels().filter((o) => hits(mine, o)).length * 10 + rings.filter((o) => hits(mine, o)).length + (outside ? 100 : 0);
        if (!best || cost < best.cost) best = { where, shift, cost };
        if (!cost) break;
      }
      place(me, best.where, best.shift);
    }
  }
  let arranging = 0;
  const arrangeSoon = () => {
    if (arranging || typeof requestAnimationFrame !== 'function') return;
    arranging = requestAnimationFrame(() => { arranging = 0; arrange(); });
  };

  function paint() {
    if (!layer) return;
    layer.classList.toggle('is-revealed', readOnly || mode === 'label');
    if (layer.classList.contains('is-revealed') || !hideLabels) arrangeSoon();
    if (hint) hint.hidden = readOnly;
    for (const [id, el] of buttons) {
      if (mode === 'pick') {
        el.setAttribute('aria-checked', String(id === picked));
        const sp = spots.find((x) => x.id === id);
        const n = spots.indexOf(sp) + 1;
        el.setAttribute('aria-label', hideLabels && !readOnly ? `Spot ${n}${sp.alt ? `: ${sp.alt}` : ''}` : `Spot ${n}: ${sp.label || sp.alt || ''}`);
      } else if (mode === 'point') {
        el.classList.toggle('is-hit', readOnly && id === picked);
      }
    }
    if (pin) {
      const at = point || { x: 0.5, y: 0.5 };
      pin.style.left = `${at.x * 100}%`;
      pin.style.top = `${at.y * 100}%`;
      pin.classList.toggle('is-unplaced', !point);
      pin.setAttribute('aria-valuenow', String(Math.round(at.x * 100)));
      pin.setAttribute('aria-valuetext', point ? `${Math.round(at.x * 100)}% across, ${Math.round(at.y * 100)}% down` : 'not placed yet');
      pin.tabIndex = readOnly ? -1 : 0;
    }
  }

  function choose(id) {
    if (readOnly || picked === id) return;
    picked = id;
    play('select');
    paint();
    const n = spots.findIndex((x) => x.id === id) + 1;
    env.announce(hideLabels ? `Spot ${n} chosen` : `${label(id) || `Spot ${n}`} chosen`);
    env.onChange(getState());
  }

  function place(x, y, quiet) {
    if (readOnly) return;
    point = { x: Math.round(clamp(x, 0, 1) * 1000) / 1000, y: Math.round(clamp(y, 0, 1) * 1000) / 1000 };
    picked = hotspotAt(spots, point.x, point.y, natural);
    paint();
    if (!quiet) { play('tap'); env.onChange(getState()); }
  }

  if (spots.length) {
    layer = h('div', { class: cx('ph-spots', hideLabels && 'hides-labels', `is-${mode}`) });
    if (mode === 'pick') { layer.setAttribute('role', 'radiogroup'); layer.setAttribute('aria-label', 'Parts of the picture'); }
    spots.forEach((sp, i) => {
      const interactive = mode === 'pick';
      const el = h(interactive ? 'button.ph-spot' : 'div.ph-spot', {
        // 16 px of room under the ring on a picture shown 300 px wide, as a fraction of its height
        class: cx(sp.x < 0.22 && 'at-left', sp.x > 0.78 && 'at-right', sp.y > 0.72 && 'at-bottom',
          sp.y > 0.72 && 1 - sp.y - sp.r * natural < (16 * natural) / 300 && 'num-top'),
        style: { left: `${sp.x * 100}%`, top: `${sp.y * 100}%`, width: `${sp.r * 200}%` },
      },
        h('span.ph-num', { 'aria-hidden': interactive ? 'true' : null }, String(i + 1)),
        sp.label ? h('span.ph-tag', { 'aria-hidden': interactive ? 'true' : null }, sp.label) : null);
      if (interactive) {
        el.type = 'button';
        el.setAttribute('role', 'radio');
        el.dataset.keys = 'own';
        el.addEventListener('click', () => choose(sp.id));
        el.addEventListener('keydown', (ev) => {
          const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
          if (!dir) return;
          ev.preventDefault();
          const all = Array.from(buttons.values());
          all[(all.indexOf(el) + dir + all.length) % all.length].focus();
        });
      }
      buttons.set(sp.id, el);
      layer.appendChild(el);
    });
    if (mode === 'point') {
      pin = h('div.ph-pin', { role: 'slider', tabindex: '0', 'aria-label': 'Marker. Arrow keys move it across the picture.', 'aria-valuemin': '0', 'aria-valuemax': '100' });
      pin.dataset.keys = 'own';
      const fromEvent = (ev) => {
        const box = layer.getBoundingClientRect();
        return [(ev.clientX - box.left) / box.width, (ev.clientY - box.top) / box.height];
      };
      layer.addEventListener('click', (ev) => { if (ev.target === layer) place(...fromEvent(ev)); });
      let drag = null;
      pin.addEventListener('pointerdown', (ev) => {
        if (readOnly || ev.button > 0) return;
        drag = ev.pointerId;
        try { pin.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
        ev.preventDefault();
        pin.focus();
      });
      pin.addEventListener('pointermove', (ev) => { if (drag === ev.pointerId) place(...fromEvent(ev), true); });
      const up = (ev) => {
        if (drag !== ev.pointerId) return;
        drag = null;
        if (point) { play('drop'); env.onChange(getState()); }
      };
      pin.addEventListener('pointerup', up);
      pin.addEventListener('pointercancel', up);
      pin.addEventListener('keydown', (ev) => {
        const step = ev.shiftKey ? 0.1 : 0.02;
        const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step * natural], ArrowDown: [0, step * natural] }[ev.key];
        if (!move || readOnly) return;
        ev.preventDefault();
        ev.stopPropagation();
        const at = point || { x: 0.5, y: 0.5 };
        place(at.x + move[0], at.y + move[1]);
      });
      layer.appendChild(pin);
      hint = h('p.ph-hint', 'Tap the picture, or drag the marker.');
      fr.el.insertBefore(hint, fr.readouts);
    }
    canvas.appendChild(layer);
    paint();
    if (typeof ResizeObserver === 'function' && spots.some((sp) => sp.label)) { watcher = new ResizeObserver(arrangeSoon); watcher.observe(canvas); }
  }
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !spots.length) return;
      if (next.point && Number.isFinite(next.point.x) && Number.isFinite(next.point.y)) {
        point = { x: clamp(next.point.x, 0, 1), y: clamp(next.point.y, 0, 1) };
        picked = hotspotAt(spots, point.x, point.y, natural);
      } else if ('picked' in next) {
        const sp = spots.find((x) => x.id === next.picked);
        picked = sp ? sp.id : null;
        if (mode === 'point') point = sp ? { x: sp.x, y: sp.y } : null;
      }
      paint();
    },
    setReadOnly(value) {
      readOnly = !!value;
      fr.el.classList.toggle('is-readonly', readOnly);
      paint();
    },
    destroy() {
      if (dialog && dialog.open) dialog.close();
      if (watcher) watcher.disconnect();
      if (arranging && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(arranging);
    },
  };
}

/* The pictures below were fetched with tools/fetch-image.mjs into the demonstration course "_demo". */
import { MEDIA } from '../../content/media/_demo/index.js';

const demo = (id, extra) => {
  const e = MEDIA[id];
  if (!e) return null;
  return {
    type: 'photo', src: e.src, thumb: e.thumb, width: e.width, height: e.height, credit: e.author, license: e.license, licenseUrl: e.licenseUrl,
    sourceUrl: e.sourceUrl, publicDomain: e.publicDomain, title: e.name, changes: e.changes, ...extra,
  };
};
const ex = (title, spec, note) => (spec ? [{ title, spec, note }] : []);

export const examples = [
  ...ex('photo — a photograph with caption and credit', demo('angkor-wat', {
    alt: 'A wide stone temple with towers shaped like lotus buds, mirrored in a pond in front of it, with palm trees on either side',
    caption: 'Angkor Wat, Cambodia, built in the 12th century',
  }), 'Tap the picture or the round button to enlarge it.'),
  ...ex('photo — public-domain image', demo('earth-apollo-17', {
    alt: 'The whole Earth seen from space: Africa and Arabia under swirls of white cloud, Antarctica at the bottom',
    caption: 'Earth from Apollo 17, 7 December 1972',
  })),
  ...ex('photo — pick a marked part (labels appear once answered)', demo('great-wave', {
    alt: 'A woodblock print: a huge wave with claw-like foam towers over three long boats; a small snow-capped mountain stands in the distance',
    creditLabel: 'Print',
    hotspots: [
      { id: 'wave', x: 0.37, y: 0.3, r: 0.12, label: 'The great wave', alt: 'the crest of the largest wave' },
      { id: 'fuji', x: 0.64, y: 0.69, r: 0.06, label: 'Mount Fuji', alt: 'a small peak in the distance' },
      { id: 'boat', x: 0.83, y: 0.6, r: 0.07, label: 'Fishing boat', alt: 'a long boat with rowers' },
      { id: 'title', x: 0.07, y: 0.18, r: 0.06, label: 'Title of the series', alt: 'writing in a box' },
    ],
  }), 'state.picked is the id of the chosen spot.'),
  ...ex('photo — point at a part (nothing is marked)', demo('great-wave', {
    alt: 'A woodblock print: a huge wave towers over three long boats; a small snow-capped mountain stands in the distance',
    creditLabel: 'Print', mode: 'point',
    hotspots: [
      { id: 'fuji', x: 0.64, y: 0.69, r: 0.07, label: 'Mount Fuji' },
      { id: 'wave', x: 0.37, y: 0.3, r: 0.14, label: 'The great wave' },
    ],
  }), 'state.picked is the hotspot under the marker, or null.'),
  ...ex('photo — labelled parts', demo('great-wave', {
    alt: 'A woodblock print of a great wave, three boats and a distant mountain, with two parts labelled',
    creditLabel: 'Print', mode: 'label',
    hotspots: [
      { id: 'fuji', x: 0.64, y: 0.69, r: 0.06, label: 'Mount Fuji' },
      { id: 'wave', x: 0.37, y: 0.3, r: 0.12, label: 'The great wave' },
    ],
  })),
  ...ex('photo — cut to a shape around a focus point', demo('parthenon', {
    alt: 'A ruined marble temple with a row of tall fluted columns, on a rocky hilltop',
    aspect: '16:9', fit: 'cover', focus: [0.5, 0.45], caption: 'The Parthenon, Athens',
  })),
];
