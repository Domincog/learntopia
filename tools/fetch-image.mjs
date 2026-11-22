#!/usr/bin/env node
/**
 * fetch-image: the only way a photograph or an artwork enters the project.
 *
 * It asks Wikimedia Commons for a file's licence and a standard-size
 * thumbnail, refuses anything whose licence is not on the allow-list,
 * re-encodes the picture locally (resized, metadata stripped) and records
 * who made it and under which licence, so that the credit can be shown under
 * the image in the app and in content/media/CREDITS.md.
 *
 *   node tools/fetch-image.mjs --course <course-id> --id <image-id> --title "File:Example.jpg"
 *        [--width 1280]            standard thumbnail width to download: 330 500 960 1280 1920
 *        [--max 1280]              longest side of the stored image, in pixels (320 to 1920)
 *        [--budget 180]            largest file size in KB; a picture too detailed for it is stored smaller
 *        [--crop l,t,r,b]          keep a box, in fractions of the picture (0,0 is the top left corner)
 *        [--aspect 3:2]            cut to a shape; with [--focus x,y] the point to keep in view (default 0.5,0.5)
 *        [--alt "…"] [--caption "…"]   optional defaults (authors normally write these in the lesson)
 *        [--name "The Great Wave"]  the work's name for the credits, when the one on Commons is unwieldy
 *        [--author "…"]            the name to credit, when the one recorded on Commons is not a name (see below)
 *        [--credit-label "Painting"]   first word of the credit shown in the app (default "Photo" / "Image")
 *        [--force]                 redo an image that already exists (uses the cached download)
 *
 *   node tools/fetch-image.mjs --search "angkor wat sunrise" [--limit 8]    find candidate files
 *   node tools/fetch-image.mjs --info "File:Example.jpg"                    licence decision, nothing stored
 *   node tools/fetch-image.mjs --batch images.txt                           one image per line, same flags as above
 *   node tools/fetch-image.mjs --list   [--course <id>]
 *   node tools/fetch-image.mjs --remove <image-id> --course <id>
 *   node tools/fetch-image.mjs --verify [--course <id>]                     files, hashes, index.js and CREDITS.md agree
 *   node tools/fetch-image.mjs --credits                                    rewrite index.js files and CREDITS.md
 *
 * Credits of pictures that are already there (none of these asks Wikimedia anything):
 *   node tools/fetch-image.mjs --course <id> --id <image-id> --author "Raphael"   set the credited name by hand
 *        ("auto" goes back to the name derived from Commons; for CC BY / BY-SA files the text must
 *         still contain the name Commons records, unless --force; --credit-label works the same way)
 *   node tools/fetch-image.mjs --recredit [--course <id>] [--dry-run]       derive all authors again from the cache
 *   node tools/fetch-image.mjs --doubtful [--course <id>]                   list credits that do not read like a name
 *
 * The manifest keeps, per picture: author (what is shown), authorDerived (the tool's reading of the
 * API), authorOverride (set by hand), authorApi / attributionApi (the API's text) and, when a credit
 * deserves a look, authorCheck (why).
 *
 * Stored per course:
 *   content/media/<course-id>/<image-id>.jpg       the picture (longest side at most 1280 px, at most 180 KB)
 *   content/media/<course-id>/<image-id>.480.jpg   a small copy for answer options
 *   content/media/<course-id>/manifest.json        everything known about each picture (machine-written)
 *   content/media/<course-id>/index.js             the same for lessons:  import { MEDIA } from '…/index.js'
 *   content/media/CREDITS.md                       one line per picture, all courses
 *
 * A polite client. Wikimedia rate-limits by IP address, and several authors
 * share this machine, so:
 *   - one lock file: only one process on the machine talks to Wikimedia at a time, and
 *     requests are served in the order in which they were made (a ticket queue);
 *   - a shared time stamp: at least GAP seconds pass between any two requests;
 *   - HTTP 429 / 503: Retry-After is honoured, otherwise the tool waits 60 s,
 *     180 s, 600 s and then gives up with a message (it never hammers);
 *   - every answer is cached on disk, so nothing is ever asked twice;
 *   - only standard thumbnail sizes are downloaded, never full-size originals.
 *
 * Environment:
 *   LEMMA_WIKIMEDIA_CACHE    directory for the lock, the time stamps and the cache
 *   LEMMA_WIKIMEDIA_GAP_MS   minimum gap between two requests (default 15000)
 *   LEMMA_WIKIMEDIA_BACKOFF  seconds to wait after 429/503, comma separated (default 60,180,600)
 *
 * Exit codes: 0 done, 1 error, 2 licence refused, 3 rate-limited (try again later).
 * See docs/IMAGES.md.
 */
import {
  existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, unlinkSync, renameSync,
  openSync, writeSync, closeSync, utimesSync, appendFileSync, mkdtempSync, rmSync, copyFileSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Sent with every request, exactly like this. No personal names or addresses. */
export const USER_AGENT = 'LemmaCourseBuilder/1.0 (open-source learning site; image attribution tool)';
export const API = 'https://commons.wikimedia.org/w/api.php';
/** Thumbnail widths Wikimedia keeps ready (https://w.wiki/GHai). Anything else costs their servers a render. */
export const STANDARD_WIDTHS = [330, 500, 960, 1280, 1920];
const DOWNLOAD_HOSTS = new Set(['upload.wikimedia.org', 'thumb.wikimedia.org']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const DEFAULTS = {
  width: 1280,          // thumbnail requested from Wikimedia
  max: 1280,            // longest side stored
  small: 480,           // longest side of the copy used in answer options
  budget: 180 * 1024,   // the stored picture is recompressed until it is no larger than this
  smallBudget: 45 * 1024,
  gapMs: 15000,
  backoff: [60, 180, 600],
};

/** Where the lock, the time stamps and the cache live. Shared by every process on the machine. */
export function defaultCacheDir() {
  if (process.env.LEMMA_WIKIMEDIA_CACHE) return resolve(process.env.LEMMA_WIKIMEDIA_CACHE);
  return join(tmpdir(), 'lemma-wikimedia-cache');
}

export class ToolError extends Error {
  constructor(message, code = 1) { super(message); this.exitCode = code; }
}
export class RateLimited extends ToolError {
  constructor(message) { super(message, 3); }
}
export class LicenseRefused extends ToolError {
  constructor(message) { super(message, 2); }
}

/* ------------------------------------------------------------------ text */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', copy: '©', eacute: 'é', egrave: 'è', uuml: 'ü', ouml: 'ö', auml: 'ä', szlig: 'ß', lrm: '', rlm: '' };

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, name) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : '';
    }
    const hit = ENTITIES[name.toLowerCase()];
    return hit === undefined ? all : hit;
  });
}

/** Plain text of an HTML fragment: tags and scripts removed, entities decoded, white space collapsed. */
export function stripHtml(html) {
  if (html == null) return '';
  let text = String(html);
  text = text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ');
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  // Commons hides machine-readable statements ("date QS:P571,+1972-12-07…") in invisible elements
  text = text.replace(/<(div|span)\b[^>]*\bstyle="[^"]*display:\s*none[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  text = text.replace(/<(br|\/p|\/div|\/li|\/tr|\/td|\/th|\/table|\/h[1-6]|\/dd|\/dt)\b[^>]*>/gi, ' ');
  text = text.replace(/<[^>]*>/g, '');
  text = decodeEntities(text);
  return text.replace(/[‎‏‪-‮]/g, '').replace(/\s+/g, ' ').replace(/\s+([,;.])/g, '$1').trim();
}

/** Cut at a word boundary. */
export function shorten(text, max = 90) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const at = cut.lastIndexOf(' ');
  return `${(at > max * 0.5 ? cut.slice(0, at) : cut).replace(/[\s,;:.(\-–]+$/, '')}…`;
}

const UNKNOWN_AUTHOR = /^(unknown( author| artist| photographer)?|anonymous|unbekannt|inconnu|not known|n\/a|\?+)\.?$/i;
const NOTE_LINE = /^(?:notes?|born|died|details|see|source|description|alternative names?|work period|work location)\b/i;
const FILE_PREFIX = /^[^:]{1,140}?\.(?:jpe?g|png|tiff?|gif|svg|webp|pdf|djvu)\s*:\s*/i;

/** One line of an author field: { role: null | 'original' | 'derivative' | 'scan' | 'note', name }. */
function authorLine(raw) {
  let t = String(raw).replace(/[​﻿]/g, '').trim();
  if (!t) return null;
  if (NOTE_LINE.test(t)) return { role: 'note', name: '' };
  let role = null;
  const tagged = /^(derivative work|original|scan|scanned by|reproduction|photograph)\s*:\s*/i.exec(t);
  if (tagged) {
    role = /^deriv/i.test(tagged[1]) ? 'derivative' : /^orig/i.test(tagged[1]) ? 'original' : 'scan';
    t = t.slice(tagged[0].length);
  }
  t = t.replace(FILE_PREFIX, '');                         // "Some_file.jpg: Name" (what a derivative was made from)
  t = t.replace(/^creator\s*:\s*/i, '');                  // a link to a creator page that does not exist
  t = t.replace(/\s*\(?\bhttps?:\/\/[^\s)]+\)?/gi, '').replace(/\s+(?:at|on|via|from)\s*$/i, '');   // addresses are not names
  t = t.replace(/^(?:[a-z]{2,3}:)?(?:user|utilisateur|benutzer|usuario)\s*:\s*/i, '').replace(/\s*\((?:talk|discussion|diskussion)\)\s*$/i, '');
  t = t.replace(/^(?:photo(?:graph)?s?(?:ed)? by|by|author:|authored by|created by|painted by)\s+/i, '').replace(/^(?:©|\(c\)|copyright)\s*/i, '');
  t = t.replace(/\s*[/,|–-]\s*(?:wikimedia commons|wikipedia)\.?$/i, '');
  t = t.replace(/,?\s*(?:the\s+)?author of (?:the\s+)?original[^.]*\bunknown\.?$/i, '');
  const wiki = /^(\S+ Wikipedia) user (.+)$/i.exec(t);
  if (wiki) t = `${wiki[2]} at ${wiki[1]}`;
  // "Name (1485–1534), followed by a remark": the name and the dates are enough
  const dated = /^(.{2,70}?\([^()]*\d{3,4}\s*[-–]\s*\d{2,4}[^()]*\))[\s,;.:(]+\S/.exec(t);
  if (dated) t = dated[1];
  // "Wyld, William (1806 - 1889)" as catalogues write it
  const listed = /^([^\s,()]+),\s+([^,()]+?)\s+\(([^()]*\d{3,4})\s*[-–]\s*(\d{2,4}[^()]*)\)$/.exec(t);
  if (listed) t = `${listed[2]} ${listed[1]} (${listed[3]}–${listed[4]})`;
  t = t.trim().replace(/[,;:]+$/, '').trim();
  return t ? { role, name: t } : null;
}

/**
 * The author of a Commons file as a short line of text. The API hands back
 * HTML: often a link to a user page, sometimes a whole "creator" box with
 * dates and a biography, a list ("File.jpg: A", "derivative work: B"), a
 * Flickr name with a home town, or a sentence. Only the name is wanted.
 *
 * `chain` (default true) keeps everyone a licence may require to be named:
 * "A; derivative work: B". Public-domain files are cleaned with chain false
 * and keep the first name only.
 */
export function cleanAuthor(html, { chain = true } = {}) {
  if (html == null) return null;
  let source = String(html);
  // A requested attribution often comes as a sentence: "…use the following next to the image if you reuse this file: © Name / Wikimedia Commons"
  const asked = /(?:use the following|credit(?: line)?|attribution)[^:<]{0,80}:\s*([\s\S]+)$/i.exec(source);
  if (asked) source = asked[1];
  // creator templates mark the name with the vCard class "fn"
  const card = /<(span|div|bdi)\b[^>]*\bclass="[^"]*\bfn\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/i.exec(source);
  if (card && stripHtml(card[2])) source = card[2];
  source = source.replace(/<small\b[^>]*>[\s\S]*?<\/small>/gi, ' ');   // remarks in small print
  // "Name from Town, Country", as imports from Flickr write it: the place is not part of the name
  source = source.replace(/(<a\b[^>]*href="[^"]*flickr\.com[^"]*"[^>]*>[^<]+<\/a>)\s+from\s+[^<\n]{2,60}?(?=\s*(?:<\/li>|<br|$))/gi, '$1');
  const lines = source.split(/<br\s*\/?>|<\/li>|<\/p>|<\/tr>/i).map((part) => authorLine(stripHtml(part))).filter((line) => line && line.role !== 'note');
  if (!lines.length) return null;
  const original = lines.find((line) => line.role === 'original');
  const plain = lines.filter((line) => !line.role);
  const derived = lines.filter((line) => line.role === 'derivative');
  let text;
  if (original) text = original.name;                                    // "Scan: a library", "Original: Galileo Galilei"
  else {
    const first = plain.length ? plain : lines;
    text = chain ? first.map((line) => line.name).join('; ') : first[0].name;
    if (chain && plain.length && derived.length) text += `; derivative work: ${derived.map((line) => line.name).join(', ')}`;
  }
  if (!text) return null;
  // leftovers of author templates: "Name, M.D. Author info", "Courtesy: an institute", a sentence stop after a name
  text = text.replace(/\s*\bAuthor info\b.*$/i, '').replace(/^courtesy(?:\s+of)?\s*:?\s+/i, '').replace(/([^.\s]{3,})\.$/, (m, word) => (/^(?:Jr|Sr|Inc|Ltd|Co|et al|M\.D|Ph\.D)$/i.test(word) ? m : word)).trim();
  if (!text) return null;
  if (UNKNOWN_AUTHOR.test(text)) return 'Unknown author';
  return shorten(text, /; /.test(text) ? 140 : 90);   // a chain of names is not cut where a single long text would be
}

/**
 * A CC BY / CC BY-SA picture without the name its licence requires: no author, an unknown one, or
 * (as found when the API answer was read) the maker of the photographed object or a mere uploader.
 * An author set by hand settles it.
 */
export function attributionUnresolved(e) {
  if (!e || !e.attributionRequired || e.authorOverride) return false;
  const a = String(e.author || '').trim();
  return !!e.authorUnresolved || !a || UNKNOWN_AUTHOR.test(a) || /^see the source page/i.test(a);
}

/**
 * Why a stored author deserves a human look, or null. Not a judgement on the
 * picture: only on whether the credit reads like a name.
 * @param {object} e { author, authorOverride, authorFrom, authorIsUser, publicDomain, attributionRequired }
 */
export function authorDoubt(e) {
  if (e.authorOverride) return null;
  const a = String(e.author || '');
  if (attributionUnresolved(e)) return `ATTRIBUTION UNRESOLVED: the licence requires the name of whoever holds the copyright (for a photograph of an old object, the photographer), and "${a || 'nothing'}" is not it`;
  if (!a || /^see the source page/i.test(a)) return 'no author was found';
  if (a === 'Unknown author') return null;
  if (e.authorFrom === 'credit' && !e.authorIsUser) return 'taken from the "source" field because the author field was empty or unknown';
  if (/https?:|www\./i.test(a)) return 'contains an address';
  if (/…$/.test(a)) return 'cut off: the author field is a long text';
  const chained = /^[^;:]+; derivative work: [^;:]+$/.test(a);
  if (!chained && /\b(own work|uploaded|upload|hochgeladen|reproduction|scan|scanned|photographs?|copy|transliteration|probably|reads|derivative|author of|unknown|images? by|using|data from)\b/i.test(a)) return 'reads like a remark, not a name';
  if (!chained && /:/.test(a)) return 'contains a colon: probably a label or a file name';
  if (a.length > 80) return 'long for a name';
  if (e.publicDomain && e.authorIsUser) return 'a public-domain work credited to a wiki user: the maker, or only the uploader?';
  return null;
}

/* --------------------------------------------------------------- licences */

const CC_VERSIONS = new Set(['2.0', '2.5', '3.0', '4.0']);
const norm = (text) => stripHtml(text).toLowerCase().replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

/** What one licence name means: { kind, … } when allowed, { refuse } when known and not allowed, null when not recognised. */
function classify(raw) {
  const t = norm(raw);
  if (!t) return null;
  if (/(^|[^a-z])nc([^a-z]|$)|non-?commercial/.test(t)) return { refuse: 'it forbids commercial use (NC), which Learntopia\'s CC BY-SA licence does not' };
  if (/(^|[^a-z])nd([^a-z]|$)|no-?deriv/.test(t)) return { refuse: 'it forbids changed versions (ND), and a resized copy is a changed version' };
  if (/^(cc-?0|cc-zero|cc0-1\.0)/.test(t)) return { kind: 'cc0' };
  if (/^(no-restrictions|no-known-(copyright-)?restrictions)/.test(t)) return { kind: 'pd', flavour: 'no-restrictions' };
  if (/^(pd$|pd-|public-domain|cc-pd|pdm)/.test(t)) return { kind: 'pd' };
  let m = /^cc-by-sa-(\d\.\d)(?:-([a-z]{2}|igo)(?![a-z]))?/.exec(t);
  if (m) return CC_VERSIONS.has(m[1]) ? { kind: 'cc-by-sa', version: m[1], port: m[2] || null } : { refuse: `CC BY-SA ${m[1]} is not on the allow-list (2.0 to 4.0)` };
  m = /^cc-by-(\d\.\d)(?:-([a-z]{2}|igo)(?![a-z]))?/.exec(t);
  if (m) return CC_VERSIONS.has(m[1]) ? { kind: 'cc-by', version: m[1], port: m[2] || null } : { refuse: `CC BY ${m[1]} is not on the allow-list (2.0 to 4.0)` };
  if (/^cc-(by|sa)/.test(t)) return { refuse: 'the Creative Commons version is missing or not on the allow-list (BY or BY-SA, 2.0 to 4.0)' };
  if (/gfdl|gnu-free-documentation/.test(t)) return { refuse: 'it is offered under the GFDL only, which cannot be combined with CC BY-SA content' };
  if (/fair-?use|non-?free|all-rights-reserved|copyrighted$/.test(t)) return { refuse: 'it is not freely licensed' };
  return null;
}

/**
 * Decide from the API's `extmetadata` whether a file may be used.
 * Allowed: public domain (incl. PD-US, PD-old, PD-Art of a public-domain
 * work, "No restrictions"), CC0, CC BY 2.0-4.0 and CC BY-SA 2.0-4.0.
 * Everything else is refused: NC, ND, GFDL-only, fair use, other free
 * licences that nobody has checked against CC BY-SA, and files without a
 * machine-readable licence.
 *
 * @returns {{ ok: true, kind, license, licenseCode, licenseUrl, attributionRequired, publicDomain }
 *         | { ok: false, reason, license }}
 */
export function decideLicense(ext = {}) {
  const val = (key) => (ext && ext[key] && ext[key].value != null ? String(ext[key].value).trim() : '');
  const shortName = stripHtml(val('LicenseShortName'));
  const code = val('License');
  const shown = shortName || code || 'no licence';
  const refuse = (reason) => ({ ok: false, license: shown, reason });

  if (/^true$/i.test(val('NonFree'))) return refuse('the file is marked as non-free (fair use)');
  if (!shortName && !code) return refuse('the file has no machine-readable licence');
  const byCode = classify(code);
  const byName = classify(shortName);
  for (const c of [byCode, byName]) if (c && c.refuse) return refuse(c.refuse);
  if (!byCode && !byName) return refuse(`"${shown}" is not on the allow-list (public domain, CC0, CC BY, CC BY-SA)`);
  if (code && !byCode) return refuse(`its licence code "${code}" is not on the allow-list, although it is labelled "${shortName}"`);
  if (shortName && !byName) return refuse(`its licence label "${shortName}" is not on the allow-list, although its code is "${code}"`);
  const c = byCode || byName;
  const other = byCode && byName ? byName : null;
  const family = (k) => (k === 'cc0' ? 'pd' : k);
  if (other && family(other.kind) !== family(c.kind)) return refuse(`its licence fields disagree ("${code}" and "${shortName}")`);

  const apiUrl = val('LicenseUrl').replace(/^http:\/\//i, 'https://').replace(/^\/\//, 'https://');
  if (c.kind === 'pd' || c.kind === 'cc0') {
    const cc0 = c.kind === 'cc0';
    return {
      ok: true,
      kind: c.kind,
      license: cc0 ? 'CC0' : c.flavour === 'no-restrictions' ? 'No known copyright restrictions' : 'Public domain',
      licenseCode: cc0 ? 'cc0' : 'pd',
      licenseUrl: cc0 ? 'https://creativecommons.org/publicdomain/zero/1.0/' : (/^https:\/\/creativecommons\.org\//.test(apiUrl) ? apiUrl : null),
      attributionRequired: false,
      publicDomain: true,
    };
  }
  const sa = c.kind === 'cc-by-sa';
  const port = c.port ? ` ${c.port.toUpperCase()}` : '';
  const canonical = `https://creativecommons.org/licenses/${sa ? 'by-sa' : 'by'}/${c.version}/${c.port ? `${c.port}/` : ''}`;
  return {
    ok: true,
    kind: c.kind,
    license: `CC BY${sa ? '-SA' : ''} ${c.version}${port}`,
    licenseCode: `cc-by${sa ? '-sa' : ''}-${c.version}${c.port ? `-${c.port}` : ''}`,
    licenseUrl: /^https:\/\/creativecommons\.org\/licenses\//.test(apiUrl) ? apiUrl : canonical,
    attributionRequired: true,
    publicDomain: false,
  };
}

/* ------------------------------------------------------------ crop maths */

/** "3:2", "16/9" or "1.5" as a number (width / height). */
export function parseAspect(text) {
  if (text == null || text === '') return null;
  const m = /^\s*(\d+(?:\.\d+)?)\s*(?:[:/x]\s*(\d+(?:\.\d+)?))?\s*$/.exec(String(text));
  const value = m ? Number(m[1]) / (m[2] ? Number(m[2]) : 1) : NaN;
  if (!(value > 0.2 && value < 5)) throw new ToolError(`--aspect "${text}" is not a usable shape. Write it like 3:2, 1:1 or 16:9.`);
  return value;
}

/** "0.1,0.2,0.9,0.8" as numbers, checked. */
export function parseFractions(text, count, name) {
  const parts = String(text).split(',').map((p) => Number(p.trim()));
  if (parts.length !== count || parts.some((p) => !Number.isFinite(p) || p < 0 || p > 1)) {
    throw new ToolError(`--${name} needs ${count} numbers between 0 and 1, separated by commas.`);
  }
  return parts;
}

/**
 * Which pixels to keep and how large to store them.
 *   crop    [left, top, right, bottom] in fractions of the picture
 *   aspect  width / height of the result: the largest such box, as close to centred on `focus` as fits
 *   focus   [x, y] in fractions of the whole picture
 *   max     longest side of the result (never enlarges)
 * @returns {{ box: [l, t, r, b], width, height, scale }}  box in source pixels
 */
export function planCrop(srcW, srcH, { crop = null, aspect = null, focus = null, max = DEFAULTS.max } = {}) {
  if (!(srcW > 0 && srcH > 0)) throw new ToolError('The picture has no size.');
  let l = 0;
  let t = 0;
  let r = srcW;
  let b = srcH;
  if (crop) {
    const [fl, ft, fr, fb] = crop;
    if (!(fl < fr && ft < fb)) throw new ToolError('--crop is left,top,right,bottom: right must be larger than left, bottom larger than top.');
    l = Math.round(fl * srcW); t = Math.round(ft * srcH); r = Math.round(fr * srcW); b = Math.round(fb * srcH);
  }
  if (aspect) {
    const bw = r - l;
    const bh = b - t;
    let w = bw;
    let h = bw / aspect;
    if (h > bh) { h = bh; w = bh * aspect; }
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    const [fx, fy] = focus || [0.5, 0.5];
    const x = Math.min(Math.max(Math.round(fx * srcW - w / 2), l), r - w);
    const y = Math.min(Math.max(Math.round(fy * srcH - h / 2), t), b - h);
    l = x; t = y; r = x + w; b = y + h;
  }
  const cw = r - l;
  const ch = b - t;
  if (cw < 1 || ch < 1) throw new ToolError('The crop leaves nothing of the picture.');
  const scale = Math.min(1, max / Math.max(cw, ch));
  return { box: [l, t, r, b], width: Math.max(1, Math.round(cw * scale)), height: Math.max(1, Math.round(ch * scale)), scale };
}

/* ---------------------------------------------------------------- titles */

/** "File:Example.jpg" from a title, a bare file name or a Commons page address. */
export function normalizeTitle(input) {
  let t = String(input || '').trim();
  const url = /^https?:\/\/commons\.(?:m\.)?wikimedia\.org\/wiki\/([^?#]+)/i.exec(t);
  if (url) { try { t = decodeURIComponent(url[1]); } catch { t = url[1]; } }
  t = t.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  t = t.replace(/^(file|image)\s*:\s*/i, '');
  if (!t || /[#<>[\]|{}]/.test(t)) throw new ToolError(`"${input}" is not a Commons file title. It should look like "File:Example.jpg".`);
  return `File:${t[0].toUpperCase()}${t.slice(1)}`;
}

export const commonsPage = (title) => `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%3A/gi, ':').replace(/%2F/gi, '/').replace(/%2C/gi, ',').replace(/%28/g, '(').replace(/%29/g, ')')}`;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const COURSE = /^_?[a-z0-9]+(-[a-z0-9]+)*$/;

/* ------------------------------------------------------------- transport */

function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    execFile(cmd, args, { maxBuffer: 64 * 1024 * 1024, ...opts }, (error, stdout, stderr) => {
      if (error) { error.stderr = String(stderr || ''); rej(error); } else res({ stdout, stderr });
    });
  });
}

/** The last block of response headers curl wrote (earlier ones belong to proxies and redirects). */
export function parseHeaderDump(text) {
  const blocks = String(text).split(/\r?\n\r?\n/).filter((b) => /^HTTP\//i.test(b.trim()));
  const last = (blocks[blocks.length - 1] || '').trim().split(/\r?\n/);
  const headers = {};
  for (const line of last.slice(1)) {
    const at = line.indexOf(':');
    if (at > 0) headers[line.slice(0, at).trim().toLowerCase()] = line.slice(at + 1).trim();
  }
  const status = Number((/^HTTP\/\S+\s+(\d{3})/i.exec(last[0] || '') || [])[1]) || 0;
  return { status, headers };
}

let curlMissing = false;

/**
 * One GET request. Uses curl when it is installed (it honours the system's
 * proxy and certificate settings), otherwise Node's own fetch. Redirects are
 * not followed: a request goes to the host it names and nowhere else.
 * @returns {Promise<{ status, headers, body: Buffer }>}
 */
export async function httpGet(url, { timeoutSec = 120 } = {}) {
  if (!curlMissing) {
    const dir = mkdtempSync(join(tmpdir(), 'lemma-http-'));
    try {
      const head = join(dir, 'headers');
      const body = join(dir, 'body');
      await run('curl', ['-sS', '--max-time', String(timeoutSec), '--connect-timeout', '40', '--suppress-connect-headers',
        '-A', USER_AGENT, '-H', 'Accept: application/json, image/*;q=0.9, */*;q=0.5', '-D', head, '-o', body, url]);
      const parsed = parseHeaderDump(existsSync(head) ? readFileSync(head, 'latin1') : '');
      return { ...parsed, body: existsSync(body) ? readFileSync(body) : Buffer.alloc(0) };
    } catch (err) {
      if (err.code === 'ENOENT') curlMissing = true;
      else throw new ToolError(`The request failed before an answer arrived (${(err.stderr || err.message).trim().split('\n').pop()}). Nothing was changed.`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  let res;
  try {
    res = await fetch(url, { headers: { 'user-agent': USER_AGENT, accept: 'application/json, image/*;q=0.9, */*;q=0.5' }, redirect: 'manual', signal: AbortSignal.timeout(timeoutSec * 1000) });
  } catch (err) {
    throw new ToolError(`The request failed before an answer arrived (${err.cause ? err.cause.message : err.message}). Nothing was changed.`);
  }
  const headers = {};
  res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  return { status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) };
}

/** Seconds to wait, from a Retry-After header (a number of seconds or an HTTP date); null when absent or unreadable. */
export function parseRetryAfter(value, now = Date.now()) {
  if (value == null || value === '') return null;
  const text = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(text)) return Math.ceil(Number(text));
  const when = Date.parse(text);
  return Number.isFinite(when) ? Math.max(0, Math.ceil((when - now) / 1000)) : null;
}

/* ----------------------------------------------------- the polite client */

const sha1 = (text) => createHash('sha1').update(text).digest('hex');
const sleepReal = (ms) => new Promise((res) => setTimeout(res, ms));
const clock = (ms) => new Date(ms).toISOString().slice(11, 19);

function readNumber(file) {
  try { const n = Number(readFileSync(file, 'utf8').trim()); return Number.isFinite(n) ? n : 0; } catch { return 0; }
}

function writeAtomic(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}

const held = new Set();
let exitHooked = false;
function hookExit() {
  if (exitHooked) return;
  exitHooked = true;
  const drop = () => { for (const file of held) { try { unlinkSync(file); } catch { /* already gone */ } } held.clear(); };
  process.on('exit', drop);
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { drop(); process.exit(130); });
}

let ticketSeq = 0;

/** Is the process that wrote this lock or ticket gone (or silent for too long)? */
function abandoned(file, staleMs) {
  try {
    const text = readFileSync(file, 'utf8');
    const pid = Number((/"pid"\s*:\s*(\d+)/.exec(text) || /^(\d+)$/.exec(text.trim()) || [])[1]) || 0;
    if (Date.now() - statSync(file).mtimeMs > staleMs) return true;
    if (pid && pid !== process.pid) { try { process.kill(pid, 0); } catch (e) { if (e.code === 'ESRCH') return true; } }
  } catch { /* being written or just removed: look again in a moment */ }
  return false;
}

/**
 * A lock file shared by every process on the machine. `fn` runs while this
 * process holds it. A lock whose owner has died, or has not shown a sign of
 * life for a minute, is taken over.
 *
 * First come, first served: every caller first puts a numbered ticket into
 * `<file>.queue/` and only the holder of the oldest ticket may take the
 * lock, so a process that needs many turns (a batch) cannot be overtaken for
 * ever by processes that arrived later, and cannot starve them either: its
 * next turn starts with a new ticket at the back of the queue. Tickets of
 * processes that died are thrown away by the others.
 *
 * `onWait({ ahead, waitedMs })` is called when the wait begins and then
 * every `noteMs`, so that a caller can say that it is alive and queueing.
 */
export async function withLock(file, fn, { sleep = sleepReal, onWait = () => {}, staleMs = 60000, noteMs = 30000 } = {}) {
  hookExit();
  mkdirSync(dirname(file), { recursive: true });
  const queue = `${file}.queue`;
  mkdirSync(queue, { recursive: true });
  const name = `${String(Date.now()).padStart(15, '0')}-${String(++ticketSeq).padStart(6, '0')}-${process.pid}`;
  const ticket = join(queue, name);
  writeFileSync(ticket, String(process.pid));
  held.add(ticket);
  const began = Date.now();
  let noted = 0;
  try {
    for (;;) {
      // Who is in front of me? Tickets sort by the time they were drawn.
      let ahead = 0;
      let names = [];
      try { names = readdirSync(queue).sort(); } catch { /* the queue folder was cleaned away: nobody is ahead */ }
      for (const other of names) {
        if (other >= name) break;
        const path = join(queue, other);
        const mine = other.endsWith(`-${process.pid}`);
        if (mine ? !held.has(path) : abandoned(path, staleMs)) { try { unlinkSync(path); } catch { /* someone else was faster */ } } else ahead++;
      }
      if (!ahead) {
        try {
          const fd = openSync(file, 'wx');
          writeSync(fd, JSON.stringify({ pid: process.pid, since: new Date().toISOString() }));
          closeSync(fd);
          break;
        } catch (err) {
          if (err.code !== 'EEXIST') throw err;
        }
        if (abandoned(file, staleMs)) {
          // Only one of several waiting processes wins this rename, so a fresh lock is never removed by mistake.
          const aside = `${file}.stale.${process.pid}`;
          try { renameSync(file, aside); unlinkSync(aside); } catch { /* someone else was faster */ }
          continue;
        }
      }
      if (!noted || Date.now() - noted >= noteMs) { noted = Date.now(); onWait({ ahead, waitedMs: Date.now() - began }); }
      try { const now = new Date(); utimesSync(ticket, now, now); } catch { /* a neighbour mistook the ticket for an abandoned one */ writeFileSync(ticket, String(process.pid)); }
      await sleep(250 + Math.floor(Math.random() * 250));
    }
  } finally {
    held.delete(ticket);
    try { unlinkSync(ticket); } catch { /* already gone */ }
  }
  held.add(file);
  const beat = setInterval(() => { try { const now = new Date(); utimesSync(file, now, now); } catch { /* lock gone */ } }, 5000);
  if (beat.unref) beat.unref();
  try {
    return await fn();
  } finally {
    clearInterval(beat);
    held.delete(file);
    try { unlinkSync(file); } catch { /* already gone */ }
  }
}

/** The same idea for a few milliseconds of work that must not be interleaved (no queue: nobody waits long). */
function withLockSync(file, fn, staleMs = 15000) {
  mkdirSync(dirname(file), { recursive: true });
  const nap = new Int32Array(new SharedArrayBuffer(4));
  for (let tries = 0; ; tries++) {
    try { const fd = openSync(file, 'wx'); writeSync(fd, String(process.pid)); closeSync(fd); break; } catch (err) { if (err.code !== 'EEXIST') throw err; }
    if (abandoned(file, staleMs) || tries > 600) { try { unlinkSync(file); } catch { /* someone else was faster */ } continue; }
    Atomics.wait(nap, 0, 0, 25);
  }
  try { return fn(); } finally { try { unlinkSync(file); } catch { /* already gone */ } }
}

/**
 * Everything that talks to Wikimedia goes through one of these.
 *   client.fileInfo(title, width)    metadata + thumbnail address of one file (cached)
 *   client.fileInfos(titles, width)  the same for several files in ONE request
 *   client.search(query, limit)      candidate files (cached, and it fills the fileInfo cache)
 *   client.download(url)             a thumbnail (cached)
 * `transport`, `sleep` and `now` can be replaced in tests.
 */
export function createClient({
  cacheDir = defaultCacheDir(),
  gapMs = Number(process.env.LEMMA_WIKIMEDIA_GAP_MS) || DEFAULTS.gapMs,
  backoff = process.env.LEMMA_WIKIMEDIA_BACKOFF ? process.env.LEMMA_WIKIMEDIA_BACKOFF.split(',').map(Number).filter((n) => n > 0) : DEFAULTS.backoff,
  transport = httpGet,
  sleep = sleepReal,
  now = Date.now,
  log = (msg) => console.error(`  · ${msg}`),
  api = API,
} = {}) {
  for (const sub of ['info', 'search', 'files']) mkdirSync(join(cacheDir, sub), { recursive: true });
  const lockFile = join(cacheDir, 'wikimedia.lock');
  const lastFile = join(cacheDir, 'last-request');
  const blockFile = join(cacheDir, 'blocked-until');
  const stats = { requests: 0, cached: 0 };
  const MAX_WAIT = 1800; // a server asking for more patience than half an hour is telling us to stop for today

  /** One request, in turn, after the gap, with the back-off rules. */
  async function request(url, what) {
    return withLock(lockFile, async () => {
      for (let attempt = 0; ; attempt++) {
        const due = Math.max(readNumber(lastFile) + gapMs, readNumber(blockFile));
        let wait = due - now();
        if (wait > 1500) log(`waiting ${Math.ceil(wait / 1000)} s before asking Wikimedia (${what})`);
        while (wait > 0) {                 // a long wait is taken a minute at a time, with a sign of life
          await sleep(Math.min(wait, 60000));
          wait = due - now();
          if (wait > 1500) log(`still waiting: ${Math.ceil(wait / 1000)} s to go (${what})`);
        }
        let res;
        try {
          res = await transport(url);
        } finally {
          writeAtomic(lastFile, String(now()));
        }
        stats.requests++;
        try { appendFileSync(join(cacheDir, 'requests.log'), `${new Date(now()).toISOString()} pid=${process.pid} ${res.status} ${url.slice(0, 300)}\n`); } catch { /* the log is a nicety */ }
        if (res.status !== 429 && res.status !== 503) return res;

        const asked = parseRetryAfter(res.headers['retry-after'], now());
        const seconds = asked != null ? Math.max(asked, Math.ceil(gapMs / 1000)) : backoff[attempt];
        if (attempt >= backoff.length || seconds == null || seconds > MAX_WAIT) {
          const rest = Math.max(asked || 0, backoff[backoff.length - 1] || 600);
          writeAtomic(blockFile, String(now() + rest * 1000));
          throw new RateLimited(
            `Wikimedia is rate-limiting this machine (HTTP ${res.status}${asked != null ? `, Retry-After ${asked} s` : ''}). ` +
            `${attempt ? `Waited ${attempt} time(s) already; giving up` : 'Giving up'} instead of hammering. Nothing was changed. ` +
            `No process will ask again before ${clock(now() + rest * 1000)} UTC; run the same command after that.`);
        }
        writeAtomic(blockFile, String(now() + seconds * 1000));
        log(`HTTP ${res.status} from Wikimedia: ${asked != null ? `it asks for ${seconds} s of patience` : `backing off ${seconds} s`} (attempt ${attempt + 1} of ${backoff.length})`);
      }
    }, {
      sleep,
      onWait: ({ ahead, waitedMs }) => log(waitedMs < 2000
        ? `waiting for my turn to ask Wikimedia (${what}): ${ahead ? `${ahead} request(s) of other processes are ahead in the queue` : 'another process is asking right now'}`
        : `still in the queue after ${Math.round(waitedMs / 1000)} s (${what}): ${ahead ? `${ahead} ahead of me` : 'I am next'}`),
    });
  }

  const readJson = (file) => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; } };
  const infoFile = (title, width) => join(cacheDir, 'info', `${sha1(`${title}|${width}`)}.json`);

  async function apiGet(params, what) {
    const query = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', ...params });
    const res = await request(`${api}?${query}`, what);
    if (res.status !== 200) throw new ToolError(`The Commons API answered HTTP ${res.status} (${what}). Nothing was changed.`);
    let data;
    try { data = JSON.parse(res.body.toString('utf8')); } catch { throw new ToolError(`The Commons API sent something that is not JSON (${what}).`); }
    if (data.error) throw new ToolError(`The Commons API reported an error: ${data.error.info || data.error.code}`);
    return data;
  }

  const INFO = { prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiextmetadatalanguage: 'en' };

  /** Several files in one request. Returns a Map from the title as given (normalised) to the API's page object. */
  async function fileInfos(titles, width = DEFAULTS.width) {
    const out = new Map();
    const wanted = [];
    for (const title of new Set(titles.map(normalizeTitle))) {
      const hit = readJson(infoFile(title, width));
      if (hit) { stats.cached++; out.set(title, hit.page); } else wanted.push(title);
    }
    for (let i = 0; i < wanted.length; i += 25) {
      const chunk = wanted.slice(i, i + 25);
      const data = await apiGet({ ...INFO, titles: chunk.join('|'), iiurlwidth: String(width), redirects: '1' }, chunk.length === 1 ? chunk[0] : `${chunk.length} files`);
      const query = data.query || {};
      const alias = new Map();
      for (const pair of [...(query.normalized || []), ...(query.redirects || [])]) alias.set(pair.from, pair.to);
      const pages = new Map((query.pages || []).map((p) => [p.title, p]));
      for (const title of chunk) {
        let name = title;
        for (let hop = 0; hop < 4 && alias.has(name); hop++) name = alias.get(name);
        const page = pages.get(name) || { title: name, missing: true };
        writeAtomic(infoFile(title, width), JSON.stringify({ title, width, fetched: new Date(now()).toISOString(), page }, null, 1));
        out.set(title, page);
      }
    }
    return out;
  }

  async function fileInfo(title, width = DEFAULTS.width) {
    const key = normalizeTitle(title);
    return (await fileInfos([key], width)).get(key);
  }

  /** Candidate files for a search phrase. One request; each hit also lands in the fileInfo cache. */
  async function search(text, limit = 8) {
    const count = Math.min(Math.max(1, Math.round(limit) || 8), 15);
    const file = join(cacheDir, 'search', `${sha1(`${text}|${count}`)}.json`);
    let pages = (readJson(file) || {}).pages;
    if (pages) stats.cached++;
    else {
      const data = await apiGet({
        ...INFO, generator: 'search', gsrsearch: `${text} filetype:bitmap`, gsrnamespace: '6', gsrlimit: String(count), iiurlwidth: String(DEFAULTS.width),
      }, `search "${text}"`);
      pages = ((data.query && data.query.pages) || []).sort((a, b) => (a.index || 0) - (b.index || 0));
      writeAtomic(file, JSON.stringify({ query: text, fetched: new Date(now()).toISOString(), pages }, null, 1));
      for (const page of pages) {
        const cached = infoFile(page.title, DEFAULTS.width);
        if (!existsSync(cached)) writeAtomic(cached, JSON.stringify({ title: page.title, width: DEFAULTS.width, fetched: new Date(now()).toISOString(), page }, null, 1));
      }
    }
    return pages;
  }

  /** A thumbnail, from the address the API gave. Only Wikimedia's upload hosts are ever contacted. */
  async function download(url) {
    let parsed;
    try { parsed = new URL(url); } catch { throw new ToolError(`Not a usable address: ${url}`); }
    if (parsed.protocol !== 'https:' || !DOWNLOAD_HOSTS.has(parsed.hostname)) {
      throw new ToolError(`Refusing to download from ${parsed.hostname}: thumbnails come from upload.wikimedia.org only.`);
    }
    const base = join(cacheDir, 'files', sha1(url));
    const meta = readJson(`${base}.json`);
    if (meta && existsSync(`${base}.bin`)) { stats.cached++; return { body: readFileSync(`${base}.bin`), type: meta.type, cached: true }; }
    const res = await request(url, 'thumbnail');
    if (res.status !== 200) throw new ToolError(`The thumbnail download answered HTTP ${res.status}. Nothing was changed.`);
    const type = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (!IMAGE_TYPES.has(type)) throw new ToolError(`The download is not a picture this tool can use (${type || 'unknown type'}).`);
    writeFileSync(`${base}.bin`, res.body);
    writeAtomic(`${base}.json`, JSON.stringify({ url, type, bytes: res.body.length, fetched: new Date(now()).toISOString() }, null, 1));
    return { body: res.body, type, cached: false };
  }

  return { fileInfo, fileInfos, search, download, request, stats, cacheDir, gapMs };
}

/* -------------------------------------------------------- reading the API */

const FORBIDDEN_ORIGINALS = /^(video|audio)\//;

/**
 * Turn the API's page object into the facts the manifest records, with the
 * licence decision. Throws LicenseRefused / ToolError with a message an
 * author can act on.
 */
export function describeFile(page) {
  if (!page || page.missing || !page.imageinfo || !page.imageinfo.length) {
    throw new ToolError(`There is no file called "${page && page.title ? page.title : '?'}" on Wikimedia Commons. Check the spelling (it is case-sensitive), or look for it with --search.`);
  }
  const ii = page.imageinfo[0];
  const ext = ii.extmetadata || {};
  const val = (key) => (ext[key] && ext[key].value != null ? String(ext[key].value) : '');
  if (FORBIDDEN_ORIGINALS.test(ii.mime || '') || /pdf|djvu/.test(ii.mime || '')) throw new ToolError(`"${page.title}" is not a picture (${ii.mime}).`);
  const license = decideLicense(ext);
  // Public-domain files keep the first name only; licensed ones keep everyone the licence may want named.
  const chain = !(license.ok && license.publicDomain);
  let author = cleanAuthor(val('Attribution'), { chain }) || cleanAuthor(val('Artist'), { chain });
  let authorFrom = cleanAuthor(val('Attribution'), { chain }) ? 'attribution' : author ? 'artist' : null;
  const credit = shorten(stripHtml(val('Credit')), 160) || null;
  // A licensed photograph of an old object. Commons' author field then often names the maker of the
  // OBJECT (or says "Unknown author"), while the licence, and the name it requires, are the
  // photographer's, who is named only in the source field ("Marie-Lan Nguyen (2011)"). So for CC BY
  // and CC BY-SA files: no author, an unknown author, or an author who is plainly the object's maker
  // (a creator page, or life dates that end before 1900) sends us to the source field; a person
  // named there (a link to a user page) is taken, and anything else leaves the attribution UNRESOLVED.
  let authorUnresolved = false;
  if (license.ok && license.attributionRequired) {
    const lived = /\([^()]*?\d{3,4}\s*[-–]\s*(\d{3,4})[^()]*\)/.exec(author || '');
    const objectMaker = authorFrom === 'artist' && (/title="Creator:|>\s*Creator:/i.test(val('Artist')) || (lived && Number(lived[1]) < 1900));
    const nobody = !author || author === 'Unknown author';
    if (nobody || objectMaker) {
      const person = /(?:href|title)="[^"]*\bUser:/i.test(val('Credit'));
      const fromCredit = cleanAuthor(val('Credit'), { chain });
      if (person && fromCredit && fromCredit !== 'Unknown author') { author = fromCredit.replace(/\s*\((?:c\.\s*)?\d{4}\)$/, ''); authorFrom = 'credit'; } else authorUnresolved = true;
    } else if (/\b(hochgeladen|uploaded|upload|transferred)\b/i.test(author)) authorUnresolved = true;   // the uploader says so himself
  }
  const named = authorFrom === 'credit' ? val('Credit') : val('Attribution') || val('Artist');
  const authorIsUser = /(?:href|title)="[^"]*\bUser:/i.test(named) || /^\s*(?:[a-z]{2,3}:)?User:/i.test(stripHtml(named));
  const date = shorten(stripHtml(val('DateTimeOriginal')) || stripHtml(val('DateTime')), 60) || null;
  // ObjectName sometimes carries Wikidata label statements after the name ('… label QS:Len,"…"'): keep the name only.
  // The name of an artwork may come in several languages; prefer the English one.
  const english = /<(\w+)\b[^>]*\blang="en"[^>]*>([\s\S]*?)<\/\1>/i.exec(val('ObjectName'));
  const name = shorten(stripHtml(english ? english[2] : val('ObjectName')).split(/\s+(?:label|title) QS:/)[0].trim() || page.title.replace(/^File:/, '').replace(/\.[a-z0-9]{2,5}$/i, ''), 120);
  const restrictions = stripHtml(val('Restrictions')) || null;
  return {
    title: page.title,
    name,
    sourceUrl: ii.descriptionurl || commonsPage(page.title),
    author: author || (license.ok && license.publicDomain ? 'Unknown author' : credit && !/^own work$/i.test(credit) ? credit : 'See the source page for the author'),
    authorFrom: author ? authorFrom : 'credit',
    authorIsUser,
    authorUnresolved,
    authorApi: shorten(stripHtml(val('Artist')), 300) || null,          // what the API said, as plain text, otherwise untouched
    attributionApi: shorten(stripHtml(val('Attribution')), 300) || null,
    credit,
    date,
    restrictions,
    license,
    original: { width: ii.width, height: ii.height, mime: ii.mime || null },
    thumb: { url: ii.thumburl || null, width: ii.thumbwidth || null, height: ii.thumbheight || null },
    originalUrl: ii.url || null,
  };
}

/* ------------------------------------------------------- image processing */

/*
 * The picture is decoded, turned upright, cropped, resized and written as a
 * progressive JPEG by a few lines of Python (Pillow). Nothing of the original
 * file's metadata is copied: no EXIF, no GPS position, no colour profile (the
 * pixels are converted to sRGB first). The download is untrusted data: it sits
 * alone in a fresh directory and Python runs isolated (-I).
 */
const PILLOW = String.raw`
import sys, json, io
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = 120000000

def load(path):
    im = Image.open(path)
    im.load()
    return ImageOps.exif_transpose(im)

def to_srgb(im):
    icc = im.info.get('icc_profile')
    if icc and im.mode in ('RGB', 'CMYK'):
        try:
            from PIL import ImageCms
            im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)), ImageCms.createProfile('sRGB'), outputMode='RGB')
        except Exception:
            pass
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        im = im.convert('RGBA')
        flat = Image.new('RGB', im.size, (255, 255, 255))
        flat.paste(im, mask=im.split()[3])
        im = flat
    elif im.mode not in ('RGB', 'L'):
        im = im.convert('RGB')
    return im

def encode(im, o):
    # Lower the quality step by step; if the picture is still over the budget at the lowest step,
    # make it a little smaller and start again: smaller and clean looks better than large and blocky.
    data = b''
    used = o['qualities'][-1]
    size = (o['width'], o['height'])
    for shrink in (1.0, 0.88, 0.76, 0.66):
        size = (max(1, round(o['width'] * shrink)), max(1, round(o['height'] * shrink)))
        scaled = im.resize(size, Image.Resampling.LANCZOS, reducing_gap=3.0) if size != im.size else im
        for q in o['qualities']:
            buf = io.BytesIO()
            scaled.save(buf, 'JPEG', quality=q, optimize=True, progressive=True, subsampling=2)
            data = buf.getvalue()
            used = q
            if len(data) <= o['budget']:
                break
        if len(data) <= o['budget']:
            break
    with open(o['path'], 'wb') as f:
        f.write(data)
    return {'quality': used, 'bytes': len(data), 'width': size[0], 'height': size[1]}

job = json.loads(sys.argv[1])
im = load(job['src'])
if job['cmd'] == 'probe':
    print(json.dumps({'width': im.size[0], 'height': im.size[1], 'mode': im.mode, 'format': im.format}))
else:
    im = to_srgb(im).crop(tuple(job['box']))
    print(json.dumps({'outputs': [encode(im, o) for o in job['outputs']]}))
`;

const QUALITIES = [84, 80, 76, 72, 68];

async function pillow(job) {
  const { stdout } = await run('python3', ['-I', '-c', PILLOW, JSON.stringify(job)]);
  return JSON.parse(stdout);
}

/** The same work with ImageMagick, for machines without Pillow. */
async function magick(job) {
  if (job.cmd === 'probe') {
    const { stdout } = await run('convert', [job.src, '-auto-orient', '-format', '%w %h', 'info:']);
    const [width, height] = stdout.trim().split(/\s+/).map(Number);
    return { width, height };
  }
  const [l, t, r, b] = job.box;
  const outputs = [];
  for (const o of job.outputs) {
    let used = null;
    let size = [o.width, o.height];
    shrinking: for (const shrink of [1, 0.88, 0.76, 0.66]) {
      size = [Math.max(1, Math.round(o.width * shrink)), Math.max(1, Math.round(o.height * shrink))];
      for (const q of o.qualities) {
        await run('convert', [job.src, '-auto-orient', '-background', 'white', '-alpha', 'remove', '-alpha', 'off', '-crop', `${r - l}x${b - t}+${l}+${t}`, '+repage',
          '-colorspace', 'sRGB', '-filter', 'Lanczos', '-resize', `${size[0]}x${size[1]}!`, '-strip', '-interlace', 'Plane', '-sampling-factor', '4:2:0', '-quality', String(q), `jpg:${o.path}`]);
        used = q;
        if (statSync(o.path).size <= o.budget) break shrinking;
      }
    }
    outputs.push({ quality: used, bytes: statSync(o.path).size, width: size[0], height: size[1] });
  }
  return { outputs };
}

let engine = null;
async function imaging(job, prefer = null) {
  const order = prefer ? [prefer] : engine ? [engine] : ['pillow', 'magick'];
  let lastError = null;
  for (const name of order) {
    try {
      const out = await (name === 'pillow' ? pillow(job) : magick(job));
      if (!prefer) engine = name;
      return out;
    } catch (err) {
      lastError = err;
    }
  }
  throw new ToolError(`Could not process the picture: ${(lastError.stderr || lastError.message).trim().split('\n').pop()}\nThis tool needs Python 3 with Pillow (pip install pillow) or ImageMagick (convert).`);
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/**
 * Re-encode a downloaded picture into `outDir/<id>.jpg` and `outDir/<id>.480.jpg`.
 * @returns {{ file, width, height, bytes, sha256, quality, small: { file, width, height, bytes, sha256 }, box, changes }}
 */
export async function processImage(srcPath, outDir, id, { crop = null, aspect = null, focus = null, max = DEFAULTS.max, small = DEFAULTS.small, budget = DEFAULTS.budget, engine: prefer = null } = {}) {
  const probe = await imaging({ cmd: 'probe', src: srcPath }, prefer);
  const plan = planCrop(probe.width, probe.height, { crop, aspect, focus, max });
  const mini = planCrop(plan.box[2] - plan.box[0], plan.box[3] - plan.box[1], { max: Math.min(small, max) });
  mkdirSync(outDir, { recursive: true });
  const file = `${id}.jpg`;
  const smallFile = `${id}.${small}.jpg`;
  const res = await imaging({
    cmd: 'encode', src: srcPath, box: plan.box,
    outputs: [
      { path: join(outDir, file), width: plan.width, height: plan.height, qualities: QUALITIES, budget },
      { path: join(outDir, smallFile), width: mini.width, height: mini.height, qualities: [78, 72, 66], budget: DEFAULTS.smallBudget },
    ],
  }, prefer);
  const [a, b] = res.outputs;
  const cropped = plan.box[0] > 0 || plan.box[1] > 0 || plan.box[2] < probe.width || plan.box[3] < probe.height;
  return {
    file, width: a.width, height: a.height, bytes: a.bytes, sha256: sha256(readFileSync(join(outDir, file))), quality: a.quality,
    small: { file: smallFile, width: b.width, height: b.height, bytes: b.bytes, sha256: sha256(readFileSync(join(outDir, smallFile))) },
    box: plan.box, source: { width: probe.width, height: probe.height },
    changes: cropped ? 'cropped and resized' : 'resized',
  };
}

/* --------------------------------------------------- manifest and credits */

const mediaRoot = (root) => join(root, 'content', 'media');
const manifestPath = (root, course) => join(mediaRoot(root), course, 'manifest.json');

export function loadManifest(root, course) {
  const file = manifestPath(root, course);
  if (!existsSync(file)) return { course, note: 'Written by tools/fetch-image.mjs. Do not edit by hand: run the tool.', images: {} };
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (!data.images || typeof data.images !== 'object') data.images = {};
  return data;
}

const sortKeys = (obj) => Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));

/** The fields a lesson needs at run time (the manifest keeps more). */
export function publicEntry(entry) {
  const out = {
    id: entry.id, src: entry.src, thumb: entry.small ? entry.small.src : entry.src, width: entry.width, height: entry.height,
    // a CC picture whose record names nobody usable is shown with a pointer to its source page, not with a wrong name
    name: entry.name, author: attributionUnresolved(entry) ? 'See the source page for the author' : entry.author, license: entry.license, licenseUrl: entry.licenseUrl || null, sourceUrl: entry.sourceUrl,
    publicDomain: !!entry.publicDomain, attributionRequired: !!entry.attributionRequired, changes: entry.changes || 'resized',
  };
  if (entry.creditLabel) out.creditLabel = entry.creditLabel;
  if (entry.alt) out.alt = entry.alt;
  if (entry.caption) out.caption = entry.caption;
  return out;
}

/** Source text of content/media/<course>/index.js. */
export function buildIndexModule(manifest) {
  const images = sortKeys(manifest.images);
  const lines = Object.keys(images).map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(publicEntry(images[id]))},`);
  return [
    '/**',
    ` * GENERATED by tools/fetch-image.mjs from manifest.json. Do not edit: run the tool.`,
    ` * Pictures of the course "${manifest.course}", with their credits. Each keeps its own licence (see content/media/CREDITS.md).`,
    ' *',
    ` *   import { MEDIA } from '../../../media/${manifest.course}/index.js';`,
    ` *   import { photo } from '../../../media.js';`,
    ` *   figure: photo(MEDIA['some-id'], { alt: '…', caption: '…' })`,
    ' */',
    'export const MEDIA = {',
    ...lines,
    '};',
    '',
    'export default MEDIA;',
    '',
  ].join('\n');
}

const mdEscape = (text) => String(text == null ? '' : text).replace(/([\\[\]*_<>|`])/g, '\\$1');

/** Source text of content/media/CREDITS.md from every course's manifest. */
export function buildCredits(manifests) {
  const out = [
    '# Image credits',
    '',
    'Generated by `tools/fetch-image.mjs` from the `manifest.json` of each course. Do not edit by hand.',
    '',
    'Every picture below comes from [Wikimedia Commons](https://commons.wikimedia.org) and **keeps its own licence**,',
    'named on its line. The pictures were resized (and cropped where noted) for use in lessons; follow the source link',
    'for the original file, its full description and its history. The same credit is shown under each picture in the app.',
    '',
  ];
  let total = 0;
  for (const manifest of manifests.slice().sort((a, b) => a.course.localeCompare(b.course))) {
    const ids = Object.keys(manifest.images).sort();
    if (!ids.length) continue;
    out.push(`## ${manifest.course}`, '');
    for (const id of ids) {
      const e = manifest.images[id];
      total++;
      const licence = e.licenseUrl ? `[${mdEscape(e.license)}](${e.licenseUrl})` : mdEscape(e.license);
      const by = attributionUnresolved(e) ? `**an author still to be established** (Commons records "${mdEscape(e.author)}"; see the source page)` : mdEscape(e.author);
      out.push(`- \`${e.file}\`: "${mdEscape(e.name)}" by ${by}. Licence: ${licence}. Source: [${mdEscape(e.title)}](${e.sourceUrl}). Changes: ${e.changes || 'resized'}.`);
    }
    out.push('');
  }
  if (!total) out.push('No pictures yet.', '');
  return out.join('\n');
}

export function listCourses(root) {
  const dir = mediaRoot(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => COURSE.test(name) && statSync(join(dir, name)).isDirectory() && existsSync(manifestPath(root, name))).sort();
}

/** Write manifest.json and index.js of one course, and CREDITS.md for all. */
export function writeCourse(root, manifest) {
  const dir = join(mediaRoot(root), manifest.course);
  mkdirSync(dir, { recursive: true });
  manifest.images = sortKeys(manifest.images);
  writeAtomic(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  writeAtomic(join(dir, 'index.js'), buildIndexModule(manifest));
  writeCredits(root);
}

export function writeCredits(root) {
  mkdirSync(mediaRoot(root), { recursive: true });
  // Reading every manifest and writing the list is one step: two authors finishing at the same moment
  // must not leave a list that lacks the other one's picture.
  withLockSync(join(defaultCacheDir(), `credits-${sha1(resolve(root)).slice(0, 12)}.lock`), () => {
    writeAtomic(join(mediaRoot(root), 'CREDITS.md'), buildCredits(listCourses(root).map((c) => loadManifest(root, c))));
  });
}

/** Problems found in one course's media folder (an empty list means all is well). */
export function verifyCourse(root, course) {
  const problems = [];
  const dir = join(mediaRoot(root), course);
  const manifest = loadManifest(root, course);
  const expected = new Set(['manifest.json', 'index.js']);
  for (const [id, e] of Object.entries(manifest.images)) {
    if (e.id !== id) problems.push(`${id}: the entry's id is "${e.id}"`);
    if (!e.title || !e.sourceUrl || !e.license || !e.author) problems.push(`${id}: the entry lacks its title, source, licence or author`);
    for (const part of [e, e.small].filter(Boolean)) {
      expected.add(part.file);
      const file = join(dir, part.file);
      if (!existsSync(file)) { problems.push(`${id}: ${part.file} is missing`); continue; }
      const buf = readFileSync(file);
      if (sha256(buf) !== part.sha256) problems.push(`${id}: ${part.file} does not match its recorded hash (it was changed by hand, or the manifest is stale)`);
      if (buf.length !== part.bytes) problems.push(`${id}: ${part.file} is ${buf.length} bytes, the manifest says ${part.bytes}`);
      if (!part.src || !part.src.includes(`${part.file}?v=${part.sha256.slice(0, 8)}`)) problems.push(`${id}: the src of ${part.file} does not carry its hash`);
    }
  }
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) if (!expected.has(name)) problems.push(`${name} is in content/media/${course}/ but not in the manifest (pictures may only be added with tools/fetch-image.mjs)`);
    const index = join(dir, 'index.js');
    if (!existsSync(index) || readFileSync(index, 'utf8') !== buildIndexModule({ ...manifest, images: sortKeys(manifest.images) })) problems.push('index.js is out of date (run: node tools/fetch-image.mjs --credits)');
  }
  return problems;
}

/**
 * Things in a course's media folder that are not errors but must not be overlooked: pictures under
 * CC BY or CC BY-SA whose manifest names nobody the licence would accept.
 */
export function creditWarnings(root, course) {
  return Object.values(loadManifest(root, course).images).filter(attributionUnresolved).map((e) =>
    `${e.id}: ATTRIBUTION UNRESOLVED. ${e.license} requires a name, and the record says "${e.author || ''}". Find the photographer on ${e.sourceUrl} and record it: ` +
    `node tools/fetch-image.mjs --course ${course} --id ${e.id} --author "…"`);
}

/* ------------------------------------------------------------- operations */

const tell = (msg) => console.log(msg);

function sameOptions(entry, opts) {
  const key = (o) => JSON.stringify([o.crop || null, o.aspect ? Math.round(o.aspect * 1000) : null, o.focus || null, o.max || DEFAULTS.max, o.budget || DEFAULTS.budget]);
  return key(entry.options || {}) === key(opts);
}

function pickThumb(desc, width) {
  const direct = desc.thumb.url && /\/thumb\//.test(desc.thumb.url);
  if (direct) return null;
  // The original is no wider than the size asked for, so the API pointed at the original itself.
  const smaller = STANDARD_WIDTHS.filter((w) => w < width && w < desc.original.width).pop();
  if (!smaller) throw new ToolError(`"${desc.title}" is only ${desc.original.width} px wide: too small to be worth showing. Look for a larger version.`);
  return smaller;
}

/**
 * Add one picture. `opts`: { course, id, title, width, max, crop, aspect, focus, alt, caption, force }.
 * @returns {{ status: 'added' | 'unchanged', entry }}
 */
export async function addImage(root, opts, client) {
  const { course, id } = opts;
  if (!COURSE.test(course || '')) throw new ToolError('--course must be a course id (lowercase words joined by dashes).');
  if (!SLUG.test(id || '')) throw new ToolError('--id must be lowercase words joined by dashes, like "angkor-wat".');
  const title = normalizeTitle(opts.title);
  const width = opts.width || DEFAULTS.width;
  if (!STANDARD_WIDTHS.includes(width)) throw new ToolError(`--width must be one of Wikimedia's standard thumbnail widths: ${STANDARD_WIDTHS.join(', ')}.`);
  const max = opts.max || DEFAULTS.max;
  if (!(max >= 320 && max <= 1920)) throw new ToolError('--max must be between 320 and 1920 pixels.');
  if (opts.budget != null && !(opts.budget >= 20 * 1024 && opts.budget <= 400 * 1024)) throw new ToolError('--budget is the largest file size in KB, between 20 and 400 (default 180).');
  const shape = { crop: opts.crop || null, aspect: opts.aspect || null, focus: opts.focus || null, max };
  if (opts.budget) shape.budget = opts.budget;

  if (opts.author != null && !String(opts.author).trim()) throw new ToolError('--author needs a name.');
  const existing = loadManifest(root, course).images[id];
  if (existing && !opts.force) {
    if (existing.title !== title && existing.requested !== title) {
      throw new ToolError(`The id "${id}" is already used in ${course} for "${existing.title}". Choose another id, or pass --force to replace that picture.`);
    }
    if (!sameOptions(existing, shape)) throw new ToolError(`"${id}" already exists with a different crop or size. Pass --force to redo it (the download is cached, Wikimedia is not asked again).`);
    const dir = join(mediaRoot(root), course);
    if (existsSync(join(dir, existing.file)) && sha256(readFileSync(join(dir, existing.file))) === existing.sha256) return { status: 'unchanged', entry: existing };
  }

  let desc = describeFile(await client.fileInfo(title, width));
  if (!desc.license.ok) {
    throw new LicenseRefused(`Refused: "${desc.title}" cannot be used because ${desc.license.reason}.\n  Licence on Commons: ${desc.license.license}\n  Allowed: public domain, CC0, CC BY 2.0-4.0, CC BY-SA 2.0-4.0. Look for another picture (--search).`);
  }
  if (opts.author) checkOverride(desc, opts.author, opts.force, `${course}/${id}`);
  const smaller = pickThumb(desc, width);
  if (smaller) desc = describeFile(await client.fileInfo(title, smaller));
  if (!desc.thumb.url || !/\/thumb\//.test(desc.thumb.url)) throw new ToolError(`Commons offered no thumbnail for "${desc.title}".`);

  const got = await client.download(desc.thumb.url);
  const work = mkdtempSync(join(tmpdir(), 'lemma-image-'));
  let done;
  try {
    const srcDir = join(work, 'in');
    const outDir = join(work, 'out');
    mkdirSync(srcDir);
    const srcPath = join(srcDir, `download${{ 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[got.type] || '.jpg'}`);
    writeFileSync(srcPath, got.body);
    done = await processImage(srcPath, outDir, id, shape);

    // Read-modify-write of the manifest under a lock of its own: two authors may add to one course at once.
    await withLock(join(client.cacheDir, `manifest-${course}.lock`), async () => {
      const manifest = loadManifest(root, course);
      const dir = join(mediaRoot(root), course);
      mkdirSync(dir, { recursive: true });
      const old = manifest.images[id];
      if (old) for (const part of [old, old.small].filter(Boolean)) { try { unlinkSync(join(dir, part.file)); } catch { /* not there */ } }
      copyFileSync(join(outDir, done.file), join(dir, done.file));
      copyFileSync(join(outDir, done.small.file), join(dir, done.small.file));
      const base = `content/media/${course}/`;
      const entry = {
        id,
        file: done.file,
        src: `${base}${done.file}?v=${done.sha256.slice(0, 8)}`,
        width: done.width, height: done.height, bytes: done.bytes, sha256: done.sha256,
        small: { file: done.small.file, src: `${base}${done.small.file}?v=${done.small.sha256.slice(0, 8)}`, width: done.small.width, height: done.small.height, bytes: done.small.bytes, sha256: done.small.sha256 },
        title: desc.title,
        requested: title,
        name: opts.name || (old && old.requested === title && old.nameGiven ? old.name : desc.name),
        nameGiven: opts.name || (old && old.requested === title && old.nameGiven) ? true : undefined,
        sourceUrl: desc.sourceUrl,
        ...creditFields(desc, {
          authorOverride: opts.author || (old && old.requested === title ? old.authorOverride : undefined),
          creditLabel: opts.creditLabel || (old && old.requested === title ? old.creditLabel : undefined),
        }),
        credit: desc.credit,
        date: desc.date,
        license: desc.license.license,
        licenseCode: desc.license.licenseCode,
        licenseUrl: desc.license.licenseUrl,
        attributionRequired: desc.license.attributionRequired,
        publicDomain: desc.license.publicDomain,
        restrictions: desc.restrictions,
        original: desc.original,
        downloaded: { width: done.source.width, height: done.source.height },
        options: shape,
        changes: done.changes,
        fetched: new Date().toISOString().slice(0, 10),
      };
      if (opts.alt || (old && old.alt)) entry.alt = opts.alt || old.alt;
      if (opts.caption || (old && old.caption)) entry.caption = opts.caption || old.caption;
      for (const key of Object.keys(entry)) if (entry[key] == null) delete entry[key];
      manifest.images[id] = entry;
      writeCourse(root, manifest);
      done.entry = entry;
    });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  return { status: 'added', entry: done.entry, quality: done.quality };
}

/** The names a licence wants to see, from a derived author such as "A; derivative work: B". */
const requiredNames = (derived) => String(derived || '').split(/; derivative work: |; |, (?=[^,]*$)/).map((n) => n.replace(/\s*\([^()]*\)\s*$/, '').trim()).filter((n) => n && !UNKNOWN_AUTHOR.test(n) && !/^see the source page/i.test(n));

/**
 * An author given by hand must not drop a name the licence requires. For
 * CC BY and CC BY-SA files the new text has to contain the name(s) Commons
 * records, unless --force says the record itself is wrong.
 */
function checkOverride(facts, author, force, where) {
  if (!facts.attributionRequired && !(facts.license && facts.license.attributionRequired)) return;
  if (facts.authorUnresolved || attributionUnresolved({ ...facts, author: facts.authorDerived || facts.author, authorOverride: null })) return;   // the record names nobody usable
  const derived = facts.authorDerived || facts.author;
  const missing = requiredNames(derived).filter((n) => !String(author).toLowerCase().includes(n.toLowerCase()));
  if (missing.length && !force) {
    throw new ToolError(`${where}: this picture's licence requires its author to be named, and Commons records "${derived}". ` +
      `The author you gave does not contain ${missing.map((n) => `"${n}"`).join(' or ')}. Keep the name in your text, ` +
      'or add --force if the record on Commons is itself wrong (say so in your commit message).');
  }
}

/** The author part of a manifest entry: the credited name, where it comes from, and what the API said. */
function creditFields(desc, { authorOverride, creditLabel } = {}) {
  const facts = {
    author: desc.author, authorFrom: desc.authorFrom, authorIsUser: desc.authorIsUser, authorUnresolved: desc.authorUnresolved,
    publicDomain: desc.license.publicDomain, attributionRequired: desc.license.attributionRequired,
  };
  const out = {
    author: authorOverride || desc.author,
    authorDerived: desc.author,            // what the tool makes of the API's answer
    authorOverride: authorOverride || undefined,   // what a person decided instead (--author)
    authorApi: desc.authorApi || undefined,         // the API's author field as plain text
    attributionApi: desc.attributionApi || undefined,
    authorCheck: authorDoubt({ ...facts, authorOverride }) || undefined,
    authorUnresolved: attributionUnresolved({ ...facts, authorOverride }) || undefined,
    creditLabel: creditLabel || undefined,
  };
  for (const key of Object.keys(out)) if (out[key] === undefined) delete out[key];
  return out;
}

/** The cached API answer for a title, at whatever width it was asked for. Never asks Wikimedia. */
function cachedInfo(cacheDir, ...titles) {
  for (const title of titles.filter(Boolean)) {
    for (const width of [...STANDARD_WIDTHS].reverse()) {
      try { return JSON.parse(readFileSync(join(cacheDir, 'info', `${sha1(`${normalizeTitle(title)}|${width}`)}.json`), 'utf8')).page; } catch { /* not cached at this width */ }
    }
  }
  return null;
}

const CREDIT_KEYS = ['author', 'authorDerived', 'authorOverride', 'authorApi', 'attributionApi', 'authorCheck', 'authorUnresolved', 'creditLabel'];

/** The credit fields of an entry, derived again from the cached API answer (or kept, when there is none). */
function rederive(entry, cacheDir) {
  const page = cachedInfo(cacheDir, entry.requested, entry.title);
  if (page) {
    try { return { cached: true, fields: creditFields(describeFile(page), { authorOverride: entry.authorOverride, creditLabel: entry.creditLabel }) }; } catch { /* the cached answer is unusable */ }
  }
  const fields = Object.fromEntries(CREDIT_KEYS.filter((k) => entry[k] !== undefined).map((k) => [k, entry[k]]));
  fields.authorDerived = entry.authorDerived || entry.author;
  fields.author = entry.authorOverride || fields.authorDerived;
  if (attributionUnresolved({ ...entry, ...fields })) fields.authorUnresolved = true; else delete fields.authorUnresolved;
  const doubt = authorDoubt({ ...entry, ...fields });
  if (doubt) fields.authorCheck = doubt; else delete fields.authorCheck;
  return { cached: false, fields };
}

/**
 * Set (or with 'auto' remove) the author and the credit label of a picture
 * that is already there. No request is made: only the manifest, index.js and
 * CREDITS.md are rewritten.
 * @param {object} change { author, creditLabel, force }
 */
export async function setCredit(root, course, id, change, { cacheDir = defaultCacheDir() } = {}) {
  return withLock(join(cacheDir, `manifest-${course}.lock`), async () => {
    const manifest = loadManifest(root, course);
    const entry = manifest.images[id];
    if (!entry) throw new ToolError(`There is no picture "${id}" in ${course}.`);
    const before = entry.author;
    if (!entry.authorDerived) entry.authorDerived = entry.author;
    if (change.author != null) {
      const text = String(change.author).trim();
      if (!text) throw new ToolError('--author needs a name (or "auto" to go back to the name derived from Commons).');
      if (/^auto$/i.test(text)) delete entry.authorOverride; else {
        checkOverride(entry, text, change.force, `${course}/${id}`);
        entry.authorOverride = text;
      }
    }
    if (change.creditLabel != null) {
      const label = String(change.creditLabel).trim();
      if (!label || /^auto$/i.test(label)) delete entry.creditLabel; else entry.creditLabel = label;
    }
    const next = rederive(entry, cacheDir).fields;
    for (const key of CREDIT_KEYS) { if (next[key] === undefined) delete entry[key]; else entry[key] = next[key]; }
    writeCourse(root, manifest);
    return { entry, before };
  });
}

/**
 * Derive the authors of pictures that are already there once more, from the
 * API answers in the cache, with today's cleaner. No request is made; an
 * author set by hand is kept.
 * @returns {{ changed: [{ course, id, from, to }], doubtful: [{ course, id, author, license, why }], uncached: [..] }}
 */
export async function recredit(root, courses, { dryRun = false, cacheDir = defaultCacheDir() } = {}) {
  const out = { changed: [], doubtful: [], uncached: [] };
  for (const course of courses) {
    const work = async () => {
      const manifest = loadManifest(root, course);
      let dirty = false;
      for (const [id, entry] of Object.entries(manifest.images)) {
        const { cached, fields: next } = rederive(entry, cacheDir);
        if (!cached) out.uncached.push({ course, id });
        if (next.author !== entry.author) out.changed.push({ course, id, from: entry.author, to: next.author });
        if (next.authorCheck) out.doubtful.push({ course, id, author: next.author, license: entry.license, why: next.authorCheck, title: entry.title });
        const before = JSON.stringify(CREDIT_KEYS.map((k) => entry[k]));
        for (const key of CREDIT_KEYS) { if (next[key] === undefined) delete entry[key]; else entry[key] = next[key]; }
        if (JSON.stringify(CREDIT_KEYS.map((k) => entry[k])) !== before) dirty = true;
      }
      if (dirty && !dryRun) writeCourse(root, manifest);
    };
    if (dryRun) await work(); else await withLock(join(cacheDir, `manifest-${course}.lock`), work);
  }
  return out;
}

export async function removeImage(root, course, id, client) {
  return withLock(join(client.cacheDir, `manifest-${course}.lock`), async () => {
    const manifest = loadManifest(root, course);
    const entry = manifest.images[id];
    if (!entry) throw new ToolError(`There is no picture "${id}" in ${course}.`);
    for (const part of [entry, entry.small].filter(Boolean)) { try { unlinkSync(join(mediaRoot(root), course, part.file)); } catch { /* not there */ } }
    delete manifest.images[id];
    writeCourse(root, manifest);
    return entry;
  });
}

/* ------------------------------------------------------------ command line */

/** Split a line of a batch file like a shell would: quotes keep spaces together. */
export function splitArgs(line) {
  const out = [];
  const re = /"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(line))) out.push(m[1] !== undefined ? m[1].replace(/\\(.)/g, '$1') : m[2] !== undefined ? m[2] : m[3]);
  return out;
}

const FLAGS = new Set(['force', 'list', 'verify', 'credits', 'help', 'recredit', 'doubtful', 'dry-run']);

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) throw new ToolError(`Unexpected "${arg}". Options start with --; put titles and phrases in quotes.`);
    const name = arg.slice(2);
    if (FLAGS.has(name)) { out[name] = true; continue; }
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new ToolError(`--${name} needs a value.`);
    out[name] = value;
    i++;
  }
  return out;
}

function imageOptions(a) {
  return {
    course: a.course, id: a.id, title: a.title,
    width: a.width ? Number(a.width) : undefined,
    max: a.max ? Number(a.max) : undefined,
    budget: a.budget ? Number(a.budget) * 1024 : undefined,
    crop: a.crop ? parseFractions(a.crop, 4, 'crop') : null,
    aspect: parseAspect(a.aspect),
    focus: a.focus ? parseFractions(a.focus, 2, 'focus') : null,
    alt: a.alt, caption: a.caption, name: a.name, force: !!a.force,
    author: a.author, creditLabel: a['credit-label'],
  };
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

function report(res, opts) {
  const e = res.entry;
  if (res.status === 'unchanged') { tell(`✔ ${opts.course}/${e.id} is already there (${e.width}×${e.height}, ${kb(e.bytes)}). Nothing to do; --force redoes it.`); return; }
  tell(`✔ ${opts.course}/${e.id}: ${e.width}×${e.height}, ${kb(e.bytes)}${res.quality ? ` at quality ${res.quality}` : ''} (+ ${e.small.width}×${e.small.height}, ${kb(e.small.bytes)} for answer options)`);
  tell(`  "${e.name}" by ${e.author}. ${e.license}.`);
  if (attributionUnresolved(e)) {
    tell(`\n  ⚠⚠ ATTRIBUTION UNRESOLVED for ${opts.course}/${e.id}\n  ⚠⚠ ${e.license} requires the copyright holder's name. Commons' author field gives "${e.authorApi || e.author || 'nothing'}", which is the\n  ⚠⚠ maker of the object, an uploader, or nobody; the photographer is usually named on the file page under "Source" or "Photograph".\n  ⚠⚠ Open ${e.sourceUrl}\n  ⚠⚠ and record the name:  node tools/fetch-image.mjs --course ${opts.course} --id ${e.id} --author "…"\n`);
  } else if (e.authorCheck) tell(`  ⚠ check the author: ${e.authorCheck}. If "${e.author}" is not the right name to credit, set it:\n      node tools/fetch-image.mjs --course ${opts.course} --id ${e.id} --author "…"`);
  tell(`  ${e.sourceUrl}`);
  if (e.restrictions) tell(`  ⚠ Commons notes other restrictions on this file: ${e.restrictions}. Read the source page before using it.`);
  if (e.bytes > ((e.options && e.options.budget) || DEFAULTS.budget)) tell(`  ⚠ still ${kb(e.bytes)} after shrinking: a very detailed picture. Consider --max 960 or a crop.`);
  else if (e.width < e.downloaded.width * 0.95 && Math.max(e.width, e.height) < ((e.options && e.options.max) || DEFAULTS.max) * 0.95 && e.changes === 'resized') tell(`  · stored at ${e.width} px to stay within the size budget (a very detailed picture)`);
  tell(`  In a lesson:  photo(MEDIA['${e.id}'], { alt: '…what the picture shows…', caption: '…' })`);
}

function printCandidate(page) {
  let desc;
  try { desc = describeFile(page); } catch (err) { tell(`  ✖  ${page.title}\n       ${err.message}`); return; }
  const size = `${desc.original.width}×${desc.original.height}`;
  if (desc.license.ok) tell(`  ✔  ${desc.title}\n       ${size} · ${desc.license.license} · ${desc.author}${desc.original.width < 960 ? ' · small original' : ''}`);
  else tell(`  ✖  ${desc.title}\n       ${size} · ${desc.license.license} · refused: ${desc.license.reason}`);
}

async function main(argv) {
  const a = parseArgs(argv);
  if (a.help || !argv.length) {
    tell(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].split('\n').slice(2).map((l) => l.replace(/^ \* ?/, '')).join('\n'));
    return 0;
  }
  const root = a.root ? resolve(a.root) : ROOT; // --root is for tests

  if (a.list) {
    for (const course of a.course ? [a.course] : listCourses(root)) {
      const images = Object.values(loadManifest(root, course).images);
      tell(`${course}: ${images.length} picture(s), ${kb(images.reduce((t, e) => t + e.bytes, 0))}`);
      for (const e of images) tell(`  ${e.id.padEnd(28)} ${`${e.width}×${e.height}`.padEnd(10)} ${kb(e.bytes).padStart(7)}  ${e.license.padEnd(16)} ${e.author}${e.authorOverride ? ' (set by hand)' : e.authorCheck ? '  ?' : ''}`);
    }
    return 0;
  }
  if (a.verify) {
    let bad = 0;
    let unresolved = 0;
    const courses = a.course ? [a.course] : listCourses(root);
    for (const course of courses) {
      const problems = verifyCourse(root, course);
      bad += problems.length;
      tell(`${problems.length ? '✖' : '✔'} ${course}: ${Object.keys(loadManifest(root, course).images).length} picture(s)${problems.length ? '' : ', all files match'}`);
      for (const p of problems) tell(`    ${p}`);
      const warns = creditWarnings(root, course);
      unresolved += warns.length;
      for (const w of warns) tell(`  ⚠ ${w}`);
    }
    const creditsFile = join(mediaRoot(root), 'CREDITS.md');
    if (!a.course && courses.length && (!existsSync(creditsFile) || readFileSync(creditsFile, 'utf8') !== buildCredits(courses.map((c) => loadManifest(root, c))))) {
      bad++;
      tell('✖ content/media/CREDITS.md is out of date (run: node tools/fetch-image.mjs --credits)');
    }
    if (unresolved) tell(`\n⚠ ${unresolved} picture(s) under a CC licence have no usable author on record (see above). Until that is set, the app shows "author named on the source page" in place of a name.`);
    tell(bad ? `\n${bad} problem(s)` : '\n✔ media verified');
    return bad ? 1 : 0;
  }
  if (a.recredit || a.doubtful) {
    const courses = a.course ? [a.course] : listCourses(root);
    const res = await recredit(root, courses, { dryRun: !!a['dry-run'] || !a.recredit });
    if (a.recredit) {
      for (const c of res.changed) tell(`${a['dry-run'] ? '·' : '✔'} ${c.course}/${c.id}: "${c.from}" → "${c.to}"`);
      tell(`${res.changed.length} author(s) ${a['dry-run'] ? 'would change' : 'changed'}; no request was made.${res.uncached.length ? ` ${res.uncached.length} picture(s) have no cached answer and were left as they are: ${res.uncached.map((u) => `${u.course}/${u.id}`).join(', ')}.` : ''}`);
    }
    if (res.doubtful.length) {
      tell(`\n${res.doubtful.length} credit(s) deserve a look (set one with: --course <id> --id <image-id> --author "…"):`);
      for (const d of res.doubtful) tell(`  ${`${d.course}/${d.id}`.padEnd(38)} ${d.license.padEnd(14)} "${d.author}"\n  ${''.padEnd(38)} ${d.why}`);
    } else tell('\n✔ every credit reads like a name');
    return 0;
  }
  if ((a.author != null || a['credit-label'] != null) && !a.title) {
    if (!a.course || !a.id) throw new ToolError('Setting a credit needs --course and --id (and --author and/or --credit-label).');
    const { entry, before } = await setCredit(root, a.course, a.id, { author: a.author, creditLabel: a['credit-label'], force: !!a.force });
    tell(`✔ ${a.course}/${entry.id}: credited to "${entry.author}"${entry.author !== before ? ` (was "${before}")` : ''}${entry.creditLabel ? `, shown as "${entry.creditLabel}: …"` : ''}. ${entry.license}. No request was made.`);
    if (entry.authorOverride) tell(`  Commons records: "${entry.authorDerived}". Back to that with --author auto.`);
    return 0;
  }
  if (a.credits) {
    // each course under its lock: an author may be adding a picture to it at this very moment
    for (const course of listCourses(root)) await withLock(join(defaultCacheDir(), `manifest-${course}.lock`), async () => writeCourse(root, loadManifest(root, course)));
    writeCredits(root);
    tell('✔ index.js files and content/media/CREDITS.md rewritten');
    return 0;
  }

  const client = createClient();
  if (a.remove) {
    if (!a.course) throw new ToolError('--remove needs --course as well.');
    const entry = await removeImage(root, a.course, a.remove, client);
    tell(`✔ removed ${a.course}/${entry.id} ("${entry.title}")`);
    return 0;
  }
  if (a.search) {
    const pages = await client.search(a.search, a.limit ? Number(a.limit) : 8);
    tell(`${pages.length} candidate(s) for "${a.search}" (✔ usable, ✖ not):`);
    for (const page of pages) printCandidate(page);
    if (!pages.length) tell('  Nothing found. Try fewer or different words.');
    else tell('\nOpen a candidate\'s page on commons.wikimedia.org to look at it before you fetch it.');
    return 0;
  }
  if (a.info) {
    const page = await client.fileInfo(a.info, a.width ? Number(a.width) : DEFAULTS.width);
    printCandidate(page);
    return 0;
  }
  if (a.batch) {
    const lines = readFileSync(resolve(a.batch), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    const jobs = lines.map((line) => imageOptions({ course: a.course, ...parseArgs(splitArgs(line)) }));
    for (const job of jobs) if (!job.course || !job.id || !job.title) throw new ToolError('Every line of a batch file needs --id and --title (and --course, unless it is given on the command line).');
    // One request for the metadata of all files that are not known yet.
    const fresh = jobs.filter((job) => job.force || !loadManifest(root, job.course).images[job.id]);
    await client.fileInfos(fresh.map((job) => job.title), DEFAULTS.width);
    let refused = 0;
    let failed = 0;
    for (const job of jobs) {
      try { report(await addImage(root, job, client), job); } catch (err) {
        // One bad line does not stop the rest; being rate-limited does.
        if (!(err instanceof ToolError) || err instanceof RateLimited) throw err;
        if (err instanceof LicenseRefused) refused++; else failed++;
        tell(`✖ ${job.course}/${job.id}: ${err.message}`);
      }
    }
    if (client.stats.requests) console.error(`  · ${client.stats.requests} request(s) to Wikimedia, ${client.stats.cached} answer(s) from the cache`);
    return failed ? 1 : refused ? 2 : 0;
  }
  if (a.title || a.id) {
    if (!a.course || !a.id || !a.title) throw new ToolError('Adding a picture needs --course, --id and --title. Run with --help for the full list.');
    const opts = imageOptions(a);
    report(await addImage(root, opts, client), opts);
    if (client.stats.requests) console.error(`  · ${client.stats.requests} request(s) to Wikimedia, ${client.stats.cached} answer(s) from the cache`);
    return 0;
  }
  throw new ToolError('Nothing to do. Run with --help for the options.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (err) => {
    if (err instanceof ToolError) { console.error(`\n✖ ${err.message}\n`); process.exitCode = err.exitCode; } else { console.error(err); process.exitCode = 1; }
  });
}
