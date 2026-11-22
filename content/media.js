/**
 * Pictures in lessons.
 *
 * Photographs and artworks are added with tools/fetch-image.mjs, which stores
 * them under content/media/<course-id>/ together with their author and
 * licence. A lesson turns one of those records into a figure with photo():
 *
 *   import { MEDIA } from '../../../media/geography/index.js';
 *   import { photo } from '../../../media.js';
 *
 *   figure: photo(MEDIA['angkor-wat'], {
 *     alt: 'A wide stone temple with five towers, mirrored in a pond',   // always: what the picture shows
 *     caption: 'Angkor Wat, Cambodia',                                    // optional
 *   })
 *
 * The same call works for the picture inside an answer option
 * (`options: [{ figure: photo(…), correct: true }, …]`) and, with `hotspots`,
 * for an `interact` step where the learner taps a part of the picture.
 * Every option of the photo widget may be passed in the second argument
 * (see src/widgets/photo.js and docs/IMAGES.md).
 */
export { creditLine, creditParts } from '../src/widgets/photo.js';

const used = new Set();
let warming = false;

/**
 * Once a lesson is open, quietly fetch the SMALL copy of each of its pictures
 * (about 30 KB each), so that the service worker has something to show for
 * every step if the learner goes offline before reaching it. Full-size files
 * are only fetched when a picture is really shown. Only when the page is
 * served through the service worker, and never on a connection the learner
 * has asked to save data on.
 */
function warm() {
  if (warming || typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  if (navigator.connection && navigator.connection.saveData) return;
  warming = true;
  // when the page is idle, but in any case within a few seconds (a busy page may never be idle)
  const idle = window.requestIdleCallback ? (fn) => window.requestIdleCallback(fn, { timeout: 4000 }) : (fn) => setTimeout(fn, 1500);
  setTimeout(() => idle(async () => {
    for (const url of Array.from(used)) {
      used.delete(url);
      try { await fetch(url); } catch { /* offline, or gone: the picture is fetched again when it is shown */ }
    }
    warming = false;
    if (used.size) warm();
  }), 2500);
}

/**
 * A `photo` widget spec from a record of the course's media index.
 * @param {object} entry   MEDIA['image-id']
 * @param {object} [opts]  alt (required unless the record has one), caption, hotspots, mode, hideLabels,
 *                         aspect, fit, focus, magnify, creditLabel, maxWidth, zoom
 */
export function photo(entry, opts = {}) {
  if (!entry || typeof entry !== 'object' || !entry.src) {
    throw new Error('photo(): this picture is not in the media index. Check the id, or add the picture with tools/fetch-image.mjs.');
  }
  const spec = {
    type: 'photo',
    src: entry.src,
    thumb: entry.thumb || entry.src,
    width: entry.width,
    height: entry.height,
    alt: entry.alt,
    caption: entry.caption,
    credit: entry.author,
    license: entry.license,
    licenseUrl: entry.licenseUrl || null,
    sourceUrl: entry.sourceUrl,
    publicDomain: !!entry.publicDomain,
    title: entry.name,
    changes: entry.changes,
    ...(entry.creditLabel ? { creditLabel: entry.creditLabel } : null),   // recorded with the picture (--credit-label); a lesson may still give its own
    ...opts,
  };
  for (const key of ['alt', 'caption']) if (spec[key] == null || spec[key] === '') delete spec[key];
  used.add(spec.thumb);
  warm();
  return spec;
}
