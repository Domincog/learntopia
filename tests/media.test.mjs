/**
 * Images and timelines: the pure logic behind tools/fetch-image.mjs (licence
 * allow-list, author clean-up, crop maths, manifest and credits, the polite
 * Wikimedia client), the photo helper for lessons, and the timeline widget's
 * year formatting and scales.
 *
 * Nothing here touches the network: the client is driven by a scripted
 * transport and a virtual clock, and pictures are made on the spot.
 *
 *   node --test tests/media.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import {
  USER_AGENT, STANDARD_WIDTHS, DEFAULTS, stripHtml, cleanAuthor, shorten, decideLicense, parseAspect, parseFractions, planCrop,
  normalizeTitle, commonsPage, parseHeaderDump, parseRetryAfter, httpGet, withLock, createClient, describeFile, processImage,
  buildIndexModule, buildCredits, publicEntry, loadManifest, verifyCourse, addImage, removeImage, splitArgs, parseArgs,
  RateLimited, LicenseRefused, ToolError,
  authorDoubt, attributionUnresolved, creditWarnings, setCredit, recredit,
} from '../tools/fetch-image.mjs';
import { photo, creditLine, creditParts } from '../content/media.js';
import {
  formatYear, formatAgo, yearsBetween, makeScale, yearTicks, agoTicks, staggerLabels, assignRows, exploreState,
} from '../src/widgets/timeline.js';
import { hotspotAt, coverBox, cropWindow } from '../src/widgets/photo.js';

/* ------------------------------------------------------------- fixtures */

const v = (value) => ({ value, source: 'commons-desc-page' });

/** `extmetadata` as the Commons API returns it (trimmed to the fields the tool reads). */
const META = {
  // File:The Earth seen from Apollo 17.jpg, as answered on 14 November 2026 (the icon's long address shortened)
  apollo: {
    ObjectName: v('<div class="fn">\n<div style="font-weight:bold;display:inline-block;"><div style="display:inline-block" dir="ltr" lang="en"><i>The Blue Marble <span class="mw-valign-text-top noprint" typeof="mw:File/Frameless"><a href="https://www.wikidata.org/wiki/Q202014#P1476" title="Edit this at Wikidata"><img alt="Edit this at Wikidata" src="https://thumb.wikimedia.org/x.png" decoding="async" loading="lazy" width="10" height="10" class="mw-file-element"></a></span></i></div></div><div style="display: none;">label QS:Lar,"الگُلَّة (البلية) الزرقاء"</div><div style="display: none;">label QS:Len,"The Blue Marble"</div></div>'),
    Artist: v('<div class="fn value">\nNASA/Apollo 17 crew; taken by either <a href="https://en.wikipedia.org/wiki/Harrison_Schmitt" class="extiw" title="en:Harrison Schmitt">Harrison Schmitt</a> or <a href="https://en.wikipedia.org/wiki/Ronald_Evans_(astronaut)" class="extiw" title="en:Ronald Evans (astronaut)">Ron Evans</a></div>'),
    Credit: v('<a rel="nofollow" class="external free" href="https://www.nasa.gov/image-detail/as17-148-22727/">https://www.nasa.gov/image-detail/as17-148-22727/</a>'),
    DateTimeOriginal: v('7 December 1972<div style="display: none;">date QS:P571,+1972-12-07T00:00:00Z/11</div>'),
    LicenseShortName: v('Public domain'),
    UsageTerms: v('Public domain'),
    License: v('pd'),
    Copyrighted: v('False'),
    AttributionRequired: v('false'),
    Restrictions: v(''),
  },
  // File:Tsunami by hokusai 19th century.jpg
  wave: {
    ObjectName: v('<div class="fn">\n<div style="font-size:0.9em;display:inline-block;">Japanese:  <div style="display:inline-block" dir="ltr" lang="ja">『神奈川沖浪裏 <span class="mw-valign-text-top noprint"><a href="https://www.wikidata.org/wiki/Q28912605#P1476" title="Edit this at Wikidata"><img alt="Edit this at Wikidata" src="https://thumb.wikimedia.org/x.png" width="10" height="10"></a></span>』</div></div><br><div style="font-weight:bold;display:inline-block;"><div style="display:inline-block" dir="ltr" lang="en"><i>The Great Wave off Kanagawa</i></div></div><div style="display: none;">title QS:P1476,ja:"神奈川沖浪裏 "</div><div style="display: none;">label QS:Lit,"La grande onda di Kanagawa"</div><div style="display: none;">label QS:Len,"The Great Wave off Kanagawa"</div></div>'),
    Artist: v('<bdi><a href="https://en.wikipedia.org/wiki/en:Hokusai" class="extiw" title="w:en:Hokusai"><span title="Japanese artist (1760-1849)">Katsushika Hokusai</span></a></bdi>'),
    Credit: v('<a href="https://en.wikipedia.org/wiki/Metropolitan_Museum_of_Art" class="extiw" title="en:Metropolitan Museum of Art">Metropolitan Museum of Art</a>:  entry  <a rel="nofollow" class="external text" href="https://www.metmuseum.org/art/collection/search/45434">45434</a>'),
    DateTimeOriginal: v('First publication:  between circa 1830 and circa 1832<div style="display: none;">date QS:P571,+1830-00-00T00:00:00Z/8,P1319,+1830-00-00T00:00:00Z/9,P1326,+1832-00-00T00:00:00Z/9,P1480,Q5727902</div>.<br>'),
    LicenseShortName: v('Public domain'), UsageTerms: v('Public domain'), License: v('pd'), AttributionRequired: v('false'), Copyrighted: v('False'), Restrictions: v(''),
  },
  // File:Taj Mahal (Edited).jpeg: the author asks for a particular credit
  taj: {
    ObjectName: v('Taj Mahal (Edited)'),
    Artist: v('<a href="//commons.wikimedia.org/wiki/User:Yann" title="User:Yann">Yann</a>; edited by <a href="//commons.wikimedia.org/wiki/User:Jim_Carter" title="User:Jim Carter">Jim Carter</a>'),
    Attribution: v('This file is not in the public domain. Therefore you are requested to use the following next to the image if you reuse this file: © <a href="//commons.wikimedia.org/wiki/User:Yann" title="User:Yann">Yann Forget</a> / <a class="external text" href="https://commons.wikimedia.org">Wikimedia Commons</a>'),
    Credit: v('Edited version of <a href="//commons.wikimedia.org/wiki/File:Taj_Mahal,_Agra,_India.jpg" title="File:Taj Mahal, Agra, India.jpg">File:Taj Mahal, Agra, India.jpg</a>'),
    LicenseShortName: v('CC BY-SA 4.0'), License: v('cc-by-sa-4.0'), LicenseUrl: v('https://creativecommons.org/licenses/by-sa/4.0'), UsageTerms: v('Creative Commons Attribution-Share Alike 4.0'),
    AttributionRequired: v('true'), Copyrighted: v('True'), Restrictions: v(''), DateTimeOriginal: v('2010'),
  },
  // File:Colosseo 2020.jpg: freely licensed, but Commons notes a restriction outside copyright
  colosseo: {
    ObjectName: v('Colosseo 2020'), Artist: v('<a href="//commons.wikimedia.org/wiki/User:FeaturedPics" title="User:FeaturedPics">FeaturedPics</a>'), Credit: v('<span class="int-own-work" lang="en">Own work</span>'),
    LicenseShortName: v('CC BY-SA 4.0'), License: v('cc-by-sa-4.0'), LicenseUrl: v('https://creativecommons.org/licenses/by-sa/4.0'), AttributionRequired: v('true'), Restrictions: v('ita-mibac'),
  },
  ccBySa4: {
    ObjectName: v('Angkor Wat temple'),
    Artist: v('<a href="//commons.wikimedia.org/wiki/User:Example_Photographer" title="User:Example Photographer">Example Photographer</a>'),
    Credit: v('<span class="int-own-work" lang="en">Own work</span>'),
    DateTimeOriginal: v('2013-11-03 06:12:44'),
    LicenseShortName: v('CC BY-SA 4.0'),
    UsageTerms: v('Creative Commons Attribution-Share Alike 4.0'),
    License: v('cc-by-sa-4.0'),
    LicenseUrl: v('https://creativecommons.org/licenses/by-sa/4.0'),
    Copyrighted: v('True'),
    AttributionRequired: v('true'),
  },
  ccBy2: {
    Artist: v('Steve Swayne'),
    Credit: v('<a rel="nofollow" class="external text" href="https://www.flickr.com/photos/68686051@N00/2416778389/">O Partenon de Atenas</a>'),
    LicenseShortName: v('CC BY 2.0'),
    License: v('cc-by-2.0'),
    LicenseUrl: v('http://creativecommons.org/licenses/by/2.0'),
    AttributionRequired: v('true'),
  },
  cc0: { Artist: v('Jane Roe'), LicenseShortName: v('CC0'), License: v('cc0'), LicenseUrl: v('http://creativecommons.org/publicdomain/zero/1.0/deed.en'), AttributionRequired: v('false') },
  pdArt: {
    Artist: v('<div class="fn value">\n<a href="https://en.wikipedia.org/wiki/Hokusai" class="extiw" title="w:Hokusai">Katsushika Hokusai</a></div>\n<div style="display:none">(1760–1849)</div><table class="creator"><tr><td>Description</td><td>Japanese painter and printmaker</td></tr></table>'),
    LicenseShortName: v('Public domain'), License: v('pd'), AttributionRequired: v('false'), Copyrighted: v('False'),
  },
  pdOld: { Artist: v('Unknown author'), LicenseShortName: v('PD-old-100'), License: v('pd-old-100') },
  pdUs: { LicenseShortName: v('PD-US'), License: v('pd-us') },
  noRestrictions: { Artist: v('Bain News Service'), LicenseShortName: v('No restrictions'), UsageTerms: v('No known copyright restrictions') },
  portDe: { Artist: v('Erika Mustermann'), LicenseShortName: v('CC BY-SA 3.0 de'), License: v('cc-by-sa-3.0-de'), LicenseUrl: v('https://creativecommons.org/licenses/by-sa/3.0/de/deed.en') },
  migrated: { Artist: v('A. Uploader'), LicenseShortName: v('CC BY-SA 3.0'), License: v('cc-by-sa-3.0-migrated') },
  // refusals
  nc: { Artist: v('Someone'), LicenseShortName: v('CC BY-NC-SA 2.0'), License: v('cc-by-nc-sa-2.0'), LicenseUrl: v('https://creativecommons.org/licenses/by-nc-sa/2.0/') },
  nd: { Artist: v('Someone'), LicenseShortName: v('CC BY-ND 4.0'), License: v('cc-by-nd-4.0') },
  gfdl: { Artist: v('Fir0002'), LicenseShortName: v('GFDL 1.2'), License: v('gfdl-1.2'), UsageTerms: v('GNU Free Documentation License 1.2') },
  // File:Carpenter ant Tanzania crop.jpg, as answered on 14 November 2026: GFDL only, and no licence code at all
  gfdlReal: {
    Artist: v('<b><a href="https://en.wikipedia.org/wiki/User:Muhammad_Mahdi_Karim" class="extiw" title="w:User:Muhammad Mahdi Karim">Muhammad Mahdi Karim</a></b>'),
    Credit: v('<span class="int-own-work" lang="en">Own work</span>'), LicenseShortName: v('GFDL 1.2'), LicenseUrl: v('http://www.gnu.org/licenses/old-licenses/fdl-1.2.html'),
    UsageTerms: v('GNU Free Documentation License 1.2'), AttributionRequired: v('true'), Copyrighted: v('True'), Restrictions: v(''),
  },
  fairUse: { LicenseShortName: v('Fair use'), NonFree: v('true') },
  fal: { Artist: v('Someone'), LicenseShortName: v('FAL'), License: v('fal') },
  bySa1: { Artist: v('Someone'), LicenseShortName: v('CC BY-SA 1.0'), License: v('cc-by-sa-1.0') },
  empty: {},
  disagree: { LicenseShortName: v('CC BY-SA 4.0'), License: v('pd') },
  codeUnknown: { LicenseShortName: v('CC BY-SA 4.0'), License: v('custom-licence') },
  sneakyNc: { LicenseShortName: v('CC BY-SA 4.0'), License: v('cc-by-nc-4.0') },
};

const page = (title, ext, extra = {}) => ({
  pageid: 1, ns: 6, title, imagerepository: 'local',
  imageinfo: [{
    size: 4000000, width: 3000, height: 2000, mime: 'image/jpeg',
    thumburl: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/${encodeURIComponent(title.slice(5).replace(/ /g, '_'))}/1280px-x.jpg`,
    thumbwidth: 1280, thumbheight: 853,
    url: `https://upload.wikimedia.org/wikipedia/commons/a/ab/${encodeURIComponent(title.slice(5).replace(/ /g, '_'))}`,
    descriptionurl: `https://commons.wikimedia.org/wiki/${title.replace(/ /g, '_')}`,
    extmetadata: ext,
    ...extra,
  }],
});

/* ---------------------------------------------------------------- licences */

test('licence allow-list: what is accepted', () => {
  const pd = decideLicense(META.apollo);
  assert.deepEqual([pd.ok, pd.license, pd.publicDomain, pd.attributionRequired, pd.licenseUrl], [true, 'Public domain', true, false, null]);

  const sa = decideLicense(META.ccBySa4);
  assert.equal(sa.ok, true);
  assert.equal(sa.license, 'CC BY-SA 4.0');
  assert.equal(sa.licenseCode, 'cc-by-sa-4.0');
  assert.equal(sa.licenseUrl, 'https://creativecommons.org/licenses/by-sa/4.0');
  assert.equal(sa.attributionRequired, true);
  assert.equal(sa.publicDomain, false);

  const by = decideLicense(META.ccBy2);
  assert.equal(by.license, 'CC BY 2.0');
  assert.equal(by.licenseUrl, 'https://creativecommons.org/licenses/by/2.0', 'http is upgraded to https');

  const cc0 = decideLicense(META.cc0);
  assert.deepEqual([cc0.ok, cc0.license, cc0.publicDomain, cc0.licenseUrl], [true, 'CC0', true, 'https://creativecommons.org/publicdomain/zero/1.0/']);

  for (const key of ['pdArt', 'pdOld', 'pdUs']) {
    const d = decideLicense(META[key]);
    assert.equal(d.ok, true, key);
    assert.equal(d.license, 'Public domain', key);
    assert.equal(d.attributionRequired, false, key);
  }
  const flickr = decideLicense(META.noRestrictions);
  assert.equal(flickr.ok, true);
  assert.equal(flickr.license, 'No known copyright restrictions');

  const de = decideLicense(META.portDe);
  assert.deepEqual([de.ok, de.license, de.licenseCode], [true, 'CC BY-SA 3.0 DE', 'cc-by-sa-3.0-de']);
  assert.equal(decideLicense(META.migrated).license, 'CC BY-SA 3.0');
  assert.equal(decideLicense(META.migrated).licenseUrl, 'https://creativecommons.org/licenses/by-sa/3.0/', 'a missing URL is filled in');

  for (const version of ['2.0', '2.5', '3.0', '4.0']) {
    assert.equal(decideLicense({ LicenseShortName: v(`CC BY ${version}`), License: v(`cc-by-${version}`) }).ok, true, `CC BY ${version}`);
    assert.equal(decideLicense({ LicenseShortName: v(`CC BY-SA ${version}`), License: v(`cc-by-sa-${version}`) }).ok, true, `CC BY-SA ${version}`);
  }
});

test('licence allow-list: what is refused, and why', () => {
  const refused = (key, pattern) => {
    const d = decideLicense(META[key]);
    assert.equal(d.ok, false, `${key} must be refused`);
    assert.match(d.reason, pattern, key);
    assert.equal(d.publicDomain, undefined);
  };
  refused('nc', /commercial/);
  refused('nd', /changed versions/);
  refused('gfdl', /GFDL/);
  refused('gfdlReal', /GFDL only/);
  refused('fairUse', /non-free/);
  refused('fal', /not on the allow-list/);
  refused('bySa1', /1\.0 is not on the allow-list/);
  refused('empty', /no machine-readable licence/);
  refused('disagree', /disagree/);
  refused('codeUnknown', /licence code "custom-licence"/);
  refused('sneakyNc', /commercial/);
  assert.equal(decideLicense(undefined).ok, false);
  assert.equal(decideLicense({ LicenseShortName: v('Copyrighted free use') }).ok, false);
  assert.equal(decideLicense({ LicenseShortName: v('CC BY-NC 4.0') }).ok, false);
  assert.equal(decideLicense({ LicenseShortName: v('Attribution'), License: v('attribution') }).ok, false);
  assert.equal(decideLicense({ LicenseShortName: v('OGL 3'), License: v('ogl-3.0') }).ok, false);
  // a human's say-so does not count: only the licence fields are read
  assert.equal(decideLicense({ UsageTerms: v('Public domain'), ImageDescription: v('This is public domain, trust me') }).ok, false);
});

/* ------------------------------------------------------------------- text */

test('HTML is stripped from author and credit fields', () => {
  assert.equal(stripHtml('<a href="//x/User:Foo" title="User:Foo">Foo&nbsp;Bar</a> &amp; <b>Baz</b>'), 'Foo Bar & Baz');
  assert.equal(stripHtml('a<br>b<script>alert(1)</script><style>p{}</style><!-- c -->d'), 'a b d');
  assert.equal(stripHtml('&#233;t&#xE9; &lt;tag&gt; &unknown;'), 'été <tag> &unknown;');
  assert.equal(stripHtml(null), '');
  assert.equal(cleanAuthor(META.apollo.Artist.value), 'NASA/Apollo 17 crew; taken by either Harrison Schmitt or Ron Evans');
  assert.equal(cleanAuthor(META.ccBySa4.Artist.value), 'Example Photographer');
  assert.equal(cleanAuthor(META.pdArt.Artist.value), 'Katsushika Hokusai', 'only the name is taken from a creator box');
  assert.equal(cleanAuthor('<a href="/wiki/User:Diliff">User:Diliff</a> (talk)'), 'Diliff');
  assert.equal(cleanAuthor('Photo by <i>Ansel</i>'), 'Ansel');
  assert.equal(cleanAuthor(META.taj.Attribution.value), 'Yann Forget');
  assert.equal(cleanAuthor(META.wave.Artist.value), 'Katsushika Hokusai');
  assert.equal(cleanAuthor('© Jane Roe / Wikimedia Commons'), 'Jane Roe');
  assert.equal(stripHtml(META.apollo.DateTimeOriginal.value), '7 December 1972');
  assert.equal(stripHtml('a<span style="color:red; display:none">hidden</span>b'), 'a b');
  assert.equal(cleanAuthor('Unknown'), 'Unknown author');
  assert.equal(cleanAuthor('<span>anonymous</span>'), 'Unknown author');
  assert.equal(cleanAuthor('   '), null);
  assert.equal(cleanAuthor(null), null);
  const long = cleanAuthor(`<p>${'Very Long Institution Name '.repeat(12)}</p>`);
  assert.ok(long.length <= 90 && long.endsWith('…'), long);
  assert.equal(shorten('one two three four', 12), 'one two…');
  assert.ok(!/[<>]/.test(cleanAuthor('<img src=x onerror=alert(1)>Mallory<svg/onload=1>')));
});

test('file titles and page addresses', () => {
  assert.equal(normalizeTitle('File:The Earth seen from Apollo 17.jpg'), 'File:The Earth seen from Apollo 17.jpg');
  assert.equal(normalizeTitle('the_Earth_seen_from_Apollo_17.jpg'), 'File:The Earth seen from Apollo 17.jpg');
  assert.equal(normalizeTitle('https://commons.wikimedia.org/wiki/File:Taj_Mahal_(Edited).jpeg'), 'File:Taj Mahal (Edited).jpeg');
  assert.equal(normalizeTitle('Image: x.png'), 'File:X.png');
  assert.throws(() => normalizeTitle(''), ToolError);
  assert.throws(() => normalizeTitle('File:a|b.jpg'), ToolError);
  assert.equal(commonsPage('File:Taj Mahal (Edited).jpeg'), 'https://commons.wikimedia.org/wiki/File:Taj_Mahal_(Edited).jpeg');
  assert.equal(commonsPage('File:Café 100%.jpg'), 'https://commons.wikimedia.org/wiki/File:Caf%C3%A9_100%25.jpg');
});

/* ------------------------------------------------------------- crop maths */

test('crop and resize maths', () => {
  // no crop: longest side becomes max, never enlarged
  assert.deepEqual(planCrop(1280, 853, {}), { box: [0, 0, 1280, 853], width: 1280, height: 853, scale: 1 });
  assert.deepEqual(planCrop(1920, 1280, { max: 1280 }).width, 1280);
  assert.deepEqual(planCrop(1920, 1280, { max: 1280 }).height, 853);
  const portrait = planCrop(1280, 1920, { max: 1280 });
  assert.deepEqual([portrait.width, portrait.height], [853, 1280]);
  const small = planCrop(500, 400, { max: 1280 });
  assert.deepEqual([small.width, small.height, small.scale], [500, 400, 1]);

  // a fraction box
  const box = planCrop(2000, 1000, { crop: [0.25, 0.1, 0.75, 0.9], max: 1280 });
  assert.deepEqual(box.box, [500, 100, 1500, 900]);
  assert.deepEqual([box.width, box.height], [1000, 800]);

  // an aspect ratio: the largest box of that shape, centred by default
  const square = planCrop(2000, 1000, { aspect: 1, max: 1280 });
  assert.deepEqual(square.box, [500, 0, 1500, 1000]);
  assert.deepEqual([square.width, square.height], [1000, 1000]);
  // … moved towards the focus point, but never outside the picture
  assert.deepEqual(planCrop(2000, 1000, { aspect: 1, focus: [0.9, 0.5] }).box, [1000, 0, 2000, 1000]);
  assert.deepEqual(planCrop(2000, 1000, { aspect: 1, focus: [0, 0] }).box, [0, 0, 1000, 1000]);
  assert.deepEqual(planCrop(2000, 1000, { aspect: 1, focus: [0.4, 0.5] }).box, [300, 0, 1300, 1000]);
  // wider than the picture: full width, height cut around the focus
  const wide = planCrop(1000, 1000, { aspect: 2, focus: [0.5, 0.2] });
  assert.deepEqual(wide.box, [0, 0, 1000, 500]);
  const lower = planCrop(1000, 1000, { aspect: 2, focus: [0.5, 0.8] });
  assert.deepEqual(lower.box, [0, 500, 1000, 1000]);
  // every result keeps the asked shape and stays inside the source
  for (const [w, h, aspect, fx, fy] of [[1280, 853, 4 / 3, 0.2, 0.9], [853, 1280, 16 / 9, 0.7, 0.1], [999, 333, 1, 0.5, 0.5], [640, 480, 3 / 2, 1, 1]]) {
    const p = planCrop(w, h, { aspect, focus: [fx, fy], max: 800 });
    const [l, t, r, b] = p.box;
    assert.ok(l >= 0 && t >= 0 && r <= w && b <= h && l < r && t < b, JSON.stringify(p));
    assert.ok(Math.abs((r - l) / (b - t) - aspect) < 0.01, `shape of ${JSON.stringify(p.box)}`);
    assert.ok(Math.max(p.width, p.height) <= 800);
    assert.ok(Math.abs(p.width / p.height - aspect) < 0.02);
  }
  assert.throws(() => planCrop(100, 100, { crop: [0.5, 0, 0.5, 1] }), ToolError);
  assert.throws(() => planCrop(0, 100), ToolError);

  assert.equal(parseAspect('3:2'), 1.5);
  assert.equal(parseAspect('16/9'), 16 / 9);
  assert.equal(parseAspect('1'), 1);
  assert.equal(parseAspect(undefined), null);
  assert.throws(() => parseAspect('wide'), ToolError);
  assert.throws(() => parseAspect('100:1'), ToolError);
  assert.deepEqual(parseFractions('0.1, 0.2,0.9,1', 4, 'crop'), [0.1, 0.2, 0.9, 1]);
  assert.throws(() => parseFractions('0.1,0.2', 4, 'crop'), ToolError);
  assert.throws(() => parseFractions('0.1,1.2', 2, 'focus'), ToolError);
});

/* ----------------------------------------------------------- the API page */

test('an API page becomes manifest facts', () => {
  const d = describeFile(page('File:The Earth seen from Apollo 17.jpg', META.apollo));
  assert.equal(d.title, 'File:The Earth seen from Apollo 17.jpg');
  assert.equal(d.name, 'The Blue Marble', 'the English name, without the hidden Wikidata statements');
  assert.equal(d.sourceUrl, 'https://commons.wikimedia.org/wiki/File:The_Earth_seen_from_Apollo_17.jpg');
  assert.equal(d.author, 'NASA/Apollo 17 crew; taken by either Harrison Schmitt or Ron Evans');
  assert.equal(d.credit, 'https://www.nasa.gov/image-detail/as17-148-22727/');
  assert.equal(d.date, '7 December 1972', 'hidden machine-readable dates are dropped');
  assert.equal(d.restrictions, null);
  const wave = describeFile(page('File:Tsunami by hokusai 19th century.jpg', META.wave));
  assert.deepEqual([wave.name, wave.author, wave.credit, wave.date], ['The Great Wave off Kanagawa', 'Katsushika Hokusai', 'Metropolitan Museum of Art: entry 45434', 'First publication: between circa 1830 and circa 1832.']);
  const taj = describeFile(page('File:Taj Mahal (Edited).jpeg', META.taj));
  assert.equal(taj.author, 'Yann Forget', 'the credit the author asked for');
  assert.equal(taj.sourceUrl, 'https://commons.wikimedia.org/wiki/File:Taj_Mahal_(Edited).jpeg');
  assert.equal(describeFile(page('File:Colosseo 2020.jpg', META.colosseo)).restrictions, 'ita-mibac');
  assert.deepEqual(d.original, { width: 3000, height: 2000, mime: 'image/jpeg' });
  assert.equal(d.license.ok, true);
  assert.match(d.thumb.url, /^https:\/\/upload\.wikimedia\.org\/.*\/thumb\//);

  assert.equal(describeFile(page('File:X.jpg', META.pdOld)).author, 'Unknown author');
  assert.equal(describeFile(page('File:X.jpg', META.pdUs)).author, 'Unknown author', 'public domain without a named author');
  assert.equal(describeFile(page('File:Some name.jpg', { ...META.ccBySa4, ObjectName: undefined })).name, 'Some name');
  assert.equal(describeFile(page('File:X.jpg', { ...META.apollo, ObjectName: v('The Blue Marble label QS:Lar,"الگُلَّة" label QS:Len,"The Blue Marble"') })).name, 'The Blue Marble');
  assert.equal(describeFile(page('File:X.jpg', { ...META.apollo, ObjectName: v('<span lang="en"></span>') })).name, 'X');
  assert.equal(describeFile(page('File:X.jpg', { LicenseShortName: v('CC BY 4.0'), License: v('cc-by-4.0'), Credit: v('Museum of Examples') })).author, 'Museum of Examples');
  assert.equal(describeFile(page('File:X.jpg', META.nc)).license.ok, false);
  assert.throws(() => describeFile({ title: 'File:Nope.jpg', missing: true }), /no file called "File:Nope.jpg"/);
  assert.throws(() => describeFile(page('File:Film.webm', META.ccBySa4, { mime: 'video/webm' })), /not a picture/);
});

/* ------------------------------------------------------ manifest and index */

const entry = (id, over = {}) => ({
  id, file: `${id}.jpg`, src: `content/media/demo/${id}.jpg?v=0123abcd`, width: 1280, height: 853, bytes: 150000, sha256: '0123abcd'.repeat(8),
  small: { file: `${id}.480.jpg`, src: `content/media/demo/${id}.480.jpg?v=89abcdef`, width: 480, height: 320, bytes: 30000, sha256: '89abcdef'.repeat(8) },
  title: `File:${id}.jpg`, name: `Name of ${id}`, sourceUrl: `https://commons.wikimedia.org/wiki/File:${id}.jpg`,
  author: 'Jane Doe', license: 'CC BY-SA 4.0', licenseCode: 'cc-by-sa-4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  attributionRequired: true, publicDomain: false, changes: 'resized', ...over,
});

test('index.js is generated from the manifest and can be imported', async () => {
  const manifest = { course: 'demo', images: { zebra: entry('zebra', { alt: 'A zebra', caption: 'Stripes' }), apple: entry('apple', { publicDomain: true, attributionRequired: false, license: 'Public domain', licenseUrl: null, author: 'Unknown author' }) } };
  const source = buildIndexModule(manifest);
  assert.match(source, /GENERATED by tools\/fetch-image\.mjs/);
  assert.ok(source.indexOf('"apple"') < source.indexOf('"zebra"'), 'entries are sorted, so the file is stable');
  const dir = mkdtempSync(join(tmpdir(), 'lemma-index-'));
  try {
    writeFileSync(join(dir, 'index.mjs'), source);
    const mod = await import(pathToFileURL(join(dir, 'index.mjs')).href);
    assert.equal(mod.default, mod.MEDIA);
    assert.deepEqual(Object.keys(mod.MEDIA), ['apple', 'zebra']);
    assert.deepEqual(mod.MEDIA.zebra, {
      id: 'zebra', src: 'content/media/demo/zebra.jpg?v=0123abcd', thumb: 'content/media/demo/zebra.480.jpg?v=89abcdef', width: 1280, height: 853,
      name: 'Name of zebra', author: 'Jane Doe', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:zebra.jpg', publicDomain: false, attributionRequired: true, changes: 'resized', alt: 'A zebra', caption: 'Stripes',
    });
    assert.equal(mod.MEDIA.apple.licenseUrl, null);
    assert.ok(!('sha256' in mod.MEDIA.apple) && !('bytes' in mod.MEDIA.apple), 'only what a lesson needs');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.deepEqual(publicEntry(entry('x', { small: undefined })).thumb, 'content/media/demo/x.jpg?v=0123abcd');
});

test('CREDITS.md lists every picture with author, licence and source', () => {
  const text = buildCredits([
    { course: 'zeta', images: { b: entry('b', { name: 'Odd [name]_*', changes: 'cropped and resized' }) } },
    { course: 'alpha', images: { a: entry('a', { publicDomain: true, license: 'Public domain', licenseUrl: null, author: 'NASA' }) } },
    { course: 'empty', images: {} },
  ]);
  assert.ok(text.indexOf('## alpha') < text.indexOf('## zeta'));
  assert.ok(!text.includes('## empty'));
  assert.match(text, /- `a\.jpg`: "Name of a" by NASA\. Licence: Public domain\. Source: \[File:a\.jpg\]\(https:\/\/commons\.wikimedia\.org\/wiki\/File:a\.jpg\)\. Changes: resized\./);
  assert.match(text, /Licence: \[CC BY-SA 4\.0\]\(https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/\)/);
  assert.match(text, /"Odd \\\[name\\\]\\_\\\*"/, 'markdown in names is escaped');
  assert.match(text, /Changes: cropped and resized\./);
  assert.match(buildCredits([]), /No pictures yet/);
});

/* -------------------------------------------------------- the polite client */

/** A client on a virtual clock: sleeping only moves the clock, so tests take no time. */
function fakeClient(script, { gapMs = 5000, backoff = [60, 180, 600] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'lemma-client-'));
  let time = 1_000_000_000_000;
  const calls = [];
  const sleeps = [];
  const logs = [];
  const client = createClient({
    cacheDir: dir, gapMs, backoff,
    now: () => time,
    sleep: async (ms) => { sleeps.push(ms); time += ms; },
    log: (msg) => logs.push(msg),
    transport: async (url) => {
      calls.push({ url, at: time });
      time += 300; // the request itself takes a moment
      const next = typeof script === 'function' ? script(url, calls.length) : script.shift();
      if (!next) throw new Error(`unexpected request ${url}`);
      return { status: next.status || 200, headers: next.headers || {}, body: Buffer.isBuffer(next.body) ? next.body : Buffer.from(typeof next.body === 'string' ? next.body : JSON.stringify(next.body || {})) };
    },
  });
  return { client, dir, calls, sleeps, logs, clock: () => time, advance: (ms) => { time += ms; }, done: () => rmSync(dir, { recursive: true, force: true }) };
}

const apiBody = (...pages) => ({ batchcomplete: true, query: { pages } });

test('client: the exact User-Agent, standard widths, and the API parameters', async () => {
  assert.equal(USER_AGENT, 'LemmaCourseBuilder/1.0 (open-source learning site; image attribution tool)');
  assert.deepEqual(STANDARD_WIDTHS, [330, 500, 960, 1280, 1920]);
  const f = fakeClient([{ body: apiBody(page('File:A b.jpg', META.ccBySa4)) }]);
  try {
    const got = await f.client.fileInfo('File:A_b.jpg', 1280);
    assert.equal(got.title, 'File:A b.jpg');
    const url = new URL(f.calls[0].url);
    assert.equal(url.origin + url.pathname, 'https://commons.wikimedia.org/w/api.php');
    const q = Object.fromEntries(url.searchParams);
    assert.equal(q.action, 'query');
    assert.equal(q.prop, 'imageinfo');
    assert.equal(q.iiprop, 'url|size|mime|extmetadata');
    assert.equal(q.iiurlwidth, '1280');
    assert.equal(q.titles, 'File:A b.jpg');
  } finally { f.done(); }
});

test('client: every answer is cached, nothing is asked twice', async () => {
  const f = fakeClient([
    { body: apiBody(page('File:A.jpg', META.ccBySa4)) },
    { headers: { 'content-type': 'image/jpeg' }, body: Buffer.from('JPEGDATA') },
  ]);
  try {
    await f.client.fileInfo('File:A.jpg');
    await f.client.fileInfo('a.jpg');
    await f.client.fileInfo('https://commons.wikimedia.org/wiki/File:A.jpg');
    const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/A.jpg/1280px-A.jpg';
    const one = await f.client.download(url);
    const two = await f.client.download(url);
    assert.equal(one.body.toString(), 'JPEGDATA');
    assert.deepEqual([one.cached, two.cached, two.body.toString(), two.type], [false, true, 'JPEGDATA', 'image/jpeg']);
    assert.equal(f.calls.length, 2, 'one API request and one download in total');
    assert.equal(f.client.stats.requests, 2);
    // a second client (another process) on the same cache directory asks nothing at all
    const again = createClient({ cacheDir: f.dir, transport: async () => { throw new Error('must not be called'); }, log: () => {} });
    assert.equal((await again.fileInfo('File:A.jpg')).title, 'File:A.jpg');
    assert.equal((await again.download(url)).cached, true);
  } finally { f.done(); }
});

test('client: a minimum gap between any two requests, shared through a time stamp file', async () => {
  const f = fakeClient((url, n) => ({ body: apiBody(page(`File:P${n}.jpg`, META.ccBySa4)) }), { gapMs: 5000 });
  try {
    await f.client.fileInfo('File:P1.jpg');
    await f.client.fileInfo('File:P2.jpg');
    await f.client.fileInfo('File:P3.jpg');
    assert.equal(f.calls.length, 3);
    for (let i = 1; i < f.calls.length; i++) assert.ok(f.calls[i].at - f.calls[i - 1].at >= 5000, `gap before request ${i + 1} was ${f.calls[i].at - f.calls[i - 1].at} ms`);
    assert.ok(existsSync(join(f.dir, 'last-request')));
    // another process starting right now has to wait as well
    let t = f.clock();
    const started = t;
    const seen = [];
    const other = createClient({ cacheDir: f.dir, gapMs: 5000, now: () => t, sleep: async (ms) => { t += ms; }, log: () => {}, transport: async () => { seen.push(t); return { status: 200, headers: {}, body: Buffer.from(JSON.stringify(apiBody(page('File:Q.jpg', META.cc0)))) }; } });
    await other.fileInfo('File:Q.jpg');
    assert.ok(seen[0] - started >= 4600, `the second process waited ${seen[0] - started} ms`);
    assert.match(readFileSync(join(f.dir, 'requests.log'), 'utf8'), /pid=\d+ 200 https:\/\/commons\.wikimedia\.org/);
  } finally { f.done(); }
});

test('client: HTTP 429 with Retry-After is honoured', async () => {
  const f = fakeClient([
    { status: 429, headers: { 'retry-after': '42' }, body: 'slow down' },
    { body: apiBody(page('File:A.jpg', META.ccBySa4)) },
  ]);
  try {
    await f.client.fileInfo('File:A.jpg');
    assert.equal(f.calls.length, 2);
    assert.ok(f.calls[1].at - f.calls[0].at >= 42000, `waited ${f.calls[1].at - f.calls[0].at} ms`);
    assert.ok(f.calls[1].at - f.calls[0].at < 50000);
    assert.ok(f.logs.some((l) => /HTTP 429/.test(l) && /42 s/.test(l)), f.logs.join('\n'));
  } finally { f.done(); }
});

test('client: without Retry-After it backs off 60 s, 180 s, 600 s and then gives up', async () => {
  const f = fakeClient(() => ({ status: 429, body: 'You are making too many requests' }));
  try {
    await assert.rejects(f.client.fileInfo('File:A.jpg'), (err) => {
      assert.ok(err instanceof RateLimited);
      assert.equal(err.exitCode, 3);
      assert.match(err.message, /rate-limiting this machine/);
      assert.match(err.message, /Nothing was changed/);
      return true;
    });
    assert.equal(f.calls.length, 4, 'the first try and three retries, never more');
    const gaps = f.calls.slice(1).map((c, i) => Math.round((c.at - f.calls[i].at) / 1000));
    assert.deepEqual(gaps, [60, 180, 600]);
    // …and everyone is held off for a while afterwards
    assert.ok(Number(readFileSync(join(f.dir, 'blocked-until'), 'utf8')) >= f.clock() + 590000);
    assert.ok(!existsSync(join(f.dir, 'wikimedia.lock')), 'the lock is released');
    const before = f.calls.length;
    f.client.fileInfo('File:B.jpg').catch(() => {});
    await new Promise((r) => setTimeout(r, 30));
    assert.ok(f.calls[before].at - f.calls[before - 1].at >= 600000, 'the next request waits out the block');
  } finally { f.done(); }
});

test('client: 503 is treated like 429, and an absurd Retry-After stops at once', async () => {
  const a = fakeClient([{ status: 503, body: 'busy' }, { body: apiBody(page('File:A.jpg', META.cc0)) }]);
  try {
    await a.client.fileInfo('File:A.jpg');
    assert.equal(Math.round((a.calls[1].at - a.calls[0].at) / 1000), 60);
  } finally { a.done(); }
  const b = fakeClient([{ status: 429, headers: { 'retry-after': '86400' }, body: '' }]);
  try {
    await assert.rejects(b.client.fileInfo('File:A.jpg'), RateLimited);
    assert.equal(b.calls.length, 1);
  } finally { b.done(); }
  assert.equal(parseRetryAfter('120'), 120);
  assert.equal(parseRetryAfter(''), null);
  assert.equal(parseRetryAfter(undefined), null);
  assert.equal(parseRetryAfter('Wed, 21 Oct 2015 07:28:30 GMT', Date.parse('Wed, 21 Oct 2015 07:28:00 GMT')), 30);
  assert.equal(parseRetryAfter('soon'), null);
});

test('client: downloads only from Wikimedia upload hosts, and only pictures', async () => {
  const f = fakeClient([{ headers: { 'content-type': 'text/html; charset=utf-8' }, body: '<html>' }, { status: 404, body: '' }]);
  try {
    await assert.rejects(f.client.download('https://example.org/x.jpg'), /Refusing to download from example\.org/);
    await assert.rejects(f.client.download('http://upload.wikimedia.org/x.jpg'), /Refusing/);
    await assert.rejects(f.client.download('https://upload.wikimedia.org.evil.example/x.jpg'), /Refusing/);
    assert.equal(f.calls.length, 0);
    await assert.rejects(f.client.download('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/A.jpg/1280px-A.jpg'), /not a picture/);
    await assert.rejects(f.client.download('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/B.jpg/1280px-B.jpg'), /HTTP 404/);
  } finally { f.done(); }
});

test('client: several files in one request; search fills the per-file cache', async () => {
  const f = fakeClient([
    { body: { query: { normalized: [{ from: 'File:b.jpg', to: 'File:B.jpg' }], redirects: [{ from: 'File:C old.jpg', to: 'File:C new.jpg' }], pages: [page('File:A.jpg', META.cc0), page('File:B.jpg', META.ccBy2), page('File:C new.jpg', META.apollo), { title: 'File:Missing.jpg', missing: true }] } } },
    { body: { query: { pages: [{ ...page('File:Two.jpg', META.nc), index: 2 }, { ...page('File:One.jpg', META.ccBySa4), index: 1 }] } } },
  ]);
  try {
    const map = await f.client.fileInfos(['File:A.jpg', 'File:B.jpg', 'File:C old.jpg', 'File:Missing.jpg']);
    assert.equal(f.calls.length, 1);
    assert.equal(new URL(f.calls[0].url).searchParams.get('titles'), 'File:A.jpg|File:B.jpg|File:C old.jpg|File:Missing.jpg');
    assert.equal(map.get('File:C old.jpg').title, 'File:C new.jpg', 'redirects are followed');
    assert.equal(map.get('File:Missing.jpg').missing, true);
    assert.equal((await f.client.fileInfo('File:B.jpg')).title, 'File:B.jpg');
    assert.equal(f.calls.length, 1, 'answered from the cache');

    const hits = await f.client.search('angkor wat', 5);
    assert.deepEqual(hits.map((p) => p.title), ['File:One.jpg', 'File:Two.jpg'], 'in the search engine\'s order');
    const q = new URL(f.calls[1].url).searchParams;
    assert.equal(q.get('generator'), 'search');
    assert.equal(q.get('gsrsearch'), 'angkor wat filetype:bitmap');
    assert.equal(q.get('gsrnamespace'), '6');
    assert.equal(q.get('gsrlimit'), '5');
    await f.client.search('angkor wat', 5);
    await f.client.fileInfo('File:One.jpg');
    assert.equal(f.calls.length, 2, 'the search and its hits are cached');
    assert.equal((await f.client.search('x', 500).catch((e) => e)) instanceof Error, true, 'no scripted answer left');
    assert.equal(new URL(f.calls[2].url).searchParams.get('gsrlimit'), '15', 'the result count stays small');
  } finally { f.done(); }
});

test('lock: only one holder at a time; a dead owner\'s lock is taken over', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lemma-lock-'));
  const lock = join(dir, 'wikimedia.lock');
  try {
    let inside = 0;
    let most = 0;
    const order = [];
    const job = (name) => withLock(lock, async () => {
      inside++; most = Math.max(most, inside); order.push(`${name}+`);
      await new Promise((r) => setTimeout(r, 40));
      order.push(`${name}-`); inside--;
    }, { sleep: (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 15))) });
    await Promise.all([job('a'), job('b'), job('c')]);
    assert.equal(most, 1);
    assert.equal(order.length, 6);
    for (let i = 0; i < 6; i += 2) assert.equal(order[i].slice(0, -1), order[i + 1].slice(0, -1), `no interleaving: ${order.join(' ')}`);
    assert.ok(!existsSync(lock));

    // a lock left behind by a process that no longer exists
    writeFileSync(lock, JSON.stringify({ pid: 2 ** 22 + 12345, since: 'long ago' }));
    let ran = false;
    await withLock(lock, async () => { ran = true; }, { sleep: () => new Promise((r) => setTimeout(r, 10)) });
    assert.ok(ran);
    // a live owner is respected until it lets go
    writeFileSync(lock, JSON.stringify({ pid: process.ppid || 1, since: 'now' }));
    let waited = false;
    const pending = withLock(lock, async () => 'mine', { sleep: () => new Promise((r) => setTimeout(r, 10)), onWait: () => { waited = true; rmSync(lock); } });
    assert.equal(await pending, 'mine');
    assert.ok(waited);
    // the lock is released when the work throws
    await assert.rejects(withLock(lock, async () => { throw new Error('boom'); }), /boom/);
    assert.ok(!existsSync(lock));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('transport: curl header dumps and a real request to a local server', async () => {
  const dump = 'HTTP/1.1 200 Connection established\r\n\r\nHTTP/2 429 \r\ncontent-type: text/plain\r\nRetry-After: 17\r\nx-a: b: c\r\n\r\n';
  assert.deepEqual(parseHeaderDump(dump), { status: 429, headers: { 'content-type': 'text/plain', 'retry-after': '17', 'x-a': 'b: c' } });
  assert.deepEqual(parseHeaderDump(''), { status: 0, headers: {} });

  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ url: req.url, agent: req.headers['user-agent'] });
    if (req.url === '/limited') { res.writeHead(429, { 'Retry-After': '7', 'Content-Type': 'text/plain' }); res.end('too many'); return; }
    if (req.url === '/moved') { res.writeHead(302, { Location: '/elsewhere' }); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'image/jpeg' }); res.end(Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01]));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const ok = await httpGet(`${base}/picture.jpg`);
    assert.equal(ok.status, 200);
    assert.equal(ok.headers['content-type'], 'image/jpeg');
    assert.deepEqual([...ok.body], [0xff, 0xd8, 0xff, 0x00, 0x01]);
    const limited = await httpGet(`${base}/limited`);
    assert.deepEqual([limited.status, limited.headers['retry-after'], limited.body.toString()], [429, '7', 'too many']);
    const moved = await httpGet(`${base}/moved`);
    assert.equal(moved.status, 302, 'redirects are not followed');
    assert.equal(seen.length, 3);
    for (const s of seen) assert.equal(s.agent, USER_AGENT);
  } finally {
    await new Promise((r) => server.close(r));
  }
});

/* ------------------------------------------------------- image processing */

let pillowOk = true;
try { execFileSync('python3', ['-I', '-c', 'import PIL'], { stdio: 'ignore' }); } catch { pillowOk = false; }
let magickOk = true;
try { execFileSync('convert', ['-version'], { stdio: 'ignore' }); } catch { magickOk = false; }

/** A 1600×800 picture stored on its side with an EXIF orientation flag, a GPS position and a camera name. */
function makeCameraFile(path, { noisy = false } = {}) {
  execFileSync('python3', ['-I', '-c', `
import sys, random
from PIL import Image, ImageDraw
w, h = 1600, 800
im = Image.new('RGB', (w, h), (30, 60, 200))                 # left half blue
d = ImageDraw.Draw(im)
d.rectangle([w // 2, 0, w, h], fill=(220, 40, 40))            # right half red
d.rectangle([0, 0, w, h // 8], fill=(250, 250, 250))          # a white band along the top
if sys.argv[2] == 'noisy':
    random.seed(7)
    im = Image.frombytes('RGB', (w, h), bytes(random.getrandbits(8) for _ in range(w * h * 3)))
stored = im.transpose(Image.Transpose.ROTATE_90)             # what the sensor saw; orientation 6 turns it back
exif = Image.Exif()
exif[0x0112] = 6
exif[0x010F] = 'SecretCam'
gps = exif.get_ifd(0x8825)
gps[1] = 'N'; gps[2] = (52.0, 30.0, 0.0); gps[3] = 'E'; gps[4] = (13.0, 22.0, 0.0)
stored.save(sys.argv[1], 'JPEG', quality=95, exif=exif)
`, path, noisy ? 'noisy' : 'plain']);
}

const inspect = (path) => JSON.parse(execFileSync('python3', ['-I', '-c', `
import sys, json
from PIL import Image
im = Image.open(sys.argv[1]); im.load()
px = im.convert('RGB')
w, h = im.size
print(json.dumps({'size': [w, h], 'format': im.format, 'progressive': bool(im.info.get('progressive') or im.info.get('progression')),
  'exif': len(im.getexif()), 'gps': len(im.getexif().get_ifd(0x8825)), 'icc': bool(im.info.get('icc_profile')),
  'left': px.getpixel((w // 4, h // 2)), 'right': px.getpixel((3 * w // 4, h // 2)), 'top': px.getpixel((w // 2, 2))}))
`, path]).toString());

test('pictures are turned upright, resized, re-encoded and stripped of EXIF and GPS', { skip: !pillowOk && 'needs python3 with Pillow' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lemma-img-'));
  try {
    mkdirSync(join(dir, 'in'));
    const src = join(dir, 'in', 'camera.jpg');
    makeCameraFile(src);
    const before = inspect(src);
    assert.deepEqual(before.size, [800, 1600], 'stored sideways');
    assert.ok(before.exif > 0 && before.gps > 0, 'the test picture really carries EXIF and GPS');
    assert.match(readFileSync(src, 'latin1'), /SecretCam/);

    const out = join(dir, 'out');
    const res = await processImage(src, out, 'upright', { max: 1280 });
    assert.deepEqual([res.file, res.width, res.height], ['upright.jpg', 1280, 640]);
    assert.deepEqual([res.small.file, res.small.width, res.small.height], ['upright.480.jpg', 480, 240]);
    assert.equal(res.changes, 'resized');
    assert.match(res.sha256, /^[0-9a-f]{64}$/);
    assert.equal(res.bytes, readFileSync(join(out, 'upright.jpg')).length);
    assert.deepEqual(readdirSync(out).sort(), ['upright.480.jpg', 'upright.jpg']);
    for (const name of ['upright.jpg', 'upright.480.jpg']) {
      const after = inspect(join(out, name));
      assert.equal(after.format, 'JPEG');
      assert.equal(after.exif, 0, `${name}: no EXIF`);
      assert.equal(after.gps, 0, `${name}: no GPS`);
      assert.equal(after.icc, false);
      assert.ok(!/SecretCam|Exif/.test(readFileSync(join(out, name), 'latin1')), `${name}: no trace of the camera`);
      // upright again: blue on the left, red on the right, the white band on top
      assert.ok(after.left[2] > 150 && after.left[0] < 90, `${name} left is blue: ${after.left}`);
      assert.ok(after.right[0] > 150 && after.right[2] < 90, `${name} right is red: ${after.right}`);
      assert.ok(Math.min(...after.top) > 200, `${name} top is white: ${after.top}`);
    }
    assert.equal(inspect(join(out, 'upright.jpg')).progressive, true);

    // a crop to the right-hand (red) half, as a square
    const crop = await processImage(src, out, 'red', { aspect: 1, focus: [0.9, 0.5], max: 600 });
    assert.deepEqual([crop.width, crop.height, crop.changes], [600, 600, 'cropped and resized']);
    assert.deepEqual(crop.box, [800, 0, 1600, 800]);
    const red = inspect(join(out, 'red.jpg'));
    assert.ok(red.left[0] > 150 && red.right[0] > 150 && red.left[2] < 90, 'all red');
    const frac = await processImage(src, out, 'blue', { crop: [0, 0.25, 0.5, 1], max: 1280 });
    assert.deepEqual([frac.width, frac.height], [800, 600], 'never enlarged');
    assert.ok(inspect(join(out, 'blue.jpg')).right[2] > 150);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a detailed picture is recompressed until it fits the size budget', { skip: !pillowOk && 'needs python3 with Pillow' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lemma-img-'));
  try {
    mkdirSync(join(dir, 'in'));
    const src = join(dir, 'in', 'noise.jpg');
    makeCameraFile(src, { noisy: true });
    const plain = await processImage(src, join(dir, 'a'), 'n', { max: 640, budget: 10 * 1024 * 1024 });
    assert.equal(plain.quality, 84, 'the first quality is kept when the budget allows');
    const tight = await processImage(src, join(dir, 'b'), 'n', { max: 640, budget: Math.round(plain.bytes * 0.8) });
    assert.ok(tight.quality < 84, `quality went down to ${tight.quality}`);
    assert.ok(tight.bytes <= Math.round(plain.bytes * 0.8));
    assert.deepEqual([tight.width, tight.height], [640, 320], 'quality alone was enough');
    // far too large even at the lowest quality: the picture is made smaller, in the same shape, rather than blockier
    const tiny = await processImage(src, join(dir, 'c'), 'n', { max: 640, budget: Math.round(plain.bytes * 0.3) });
    assert.ok(tiny.width < 640 && tiny.quality >= 68, `${tiny.width} px at quality ${tiny.quality}`);
    assert.equal(Math.round((tiny.width / tiny.height) * 10), 20);
    assert.equal(inspect(join(dir, 'c', 'n.jpg')).size[0], tiny.width, 'the recorded size is the real size');
    assert.equal(DEFAULTS.budget, 180 * 1024);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('ImageMagick does the same job where Pillow is missing', { skip: (!magickOk || !pillowOk) && 'needs ImageMagick (and Pillow to make the test picture)' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lemma-img-'));
  try {
    mkdirSync(join(dir, 'in'));
    const src = join(dir, 'in', 'camera.jpg');
    makeCameraFile(src);
    const res = await processImage(src, join(dir, 'out'), 'im', { max: 1000, engine: 'magick' });
    assert.deepEqual([res.width, res.height], [1000, 500]);
    const after = inspect(join(dir, 'out', 'im.jpg'));
    assert.deepEqual([after.exif, after.gps], [0, 0]);
    assert.ok(after.left[2] > 150 && after.right[0] > 150 && Math.min(...after.top) > 200, 'upright');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

/* ------------------------------------------- adding a picture, end to end */

test('adding, re-running, replacing, verifying and removing a picture (no network)', { skip: !pillowOk && 'needs python3 with Pillow' }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'lemma-root-'));
  const scratch = mkdtempSync(join(tmpdir(), 'lemma-src-'));
  const src = join(scratch, 'camera.jpg');
  makeCameraFile(src);
  const jpeg = readFileSync(src);
  const thumb = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Angkor.jpg/1280px-Angkor.jpg';
  const f = fakeClient((url) => {
    if (url.startsWith('https://commons.wikimedia.org/w/api.php')) {
      const title = new URL(url).searchParams.get('titles');
      if (title === 'File:Non commercial.jpg') return { body: apiBody(page(title, META.nc)) };
      if (title === 'File:Tiny.jpg') return { body: apiBody(page(title, META.cc0, { width: 300, height: 200, thumburl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Tiny.jpg', thumbwidth: 300 })) };
      return { body: apiBody(page(title, META.ccBySa4, { thumburl: thumb })) };
    }
    return { headers: { 'content-type': 'image/jpeg' }, body: jpeg };
  });
  try {
    const first = await addImage(root, { course: 'demo', id: 'angkor-wat', title: 'File:Angkor.jpg', alt: 'A temple' }, f.client);
    assert.equal(first.status, 'added');
    const e = first.entry;
    assert.deepEqual([e.id, e.file, e.width, e.height], ['angkor-wat', 'angkor-wat.jpg', 1280, 640]);
    assert.equal(e.src, `content/media/demo/angkor-wat.jpg?v=${e.sha256.slice(0, 8)}`, 'the address carries the content hash');
    assert.equal(e.small.src, `content/media/demo/angkor-wat.480.jpg?v=${e.small.sha256.slice(0, 8)}`);
    assert.deepEqual([e.title, e.author, e.license, e.licenseUrl, e.attributionRequired, e.publicDomain], ['File:Angkor.jpg', 'Example Photographer', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0', true, false]);
    assert.deepEqual(e.original, { width: 3000, height: 2000, mime: 'image/jpeg' });
    assert.equal(e.sourceUrl, 'https://commons.wikimedia.org/wiki/File:Angkor.jpg');
    assert.equal(e.credit, 'Own work');
    assert.equal(e.date, '2013-11-03 06:12:44');
    assert.equal(e.alt, 'A temple');
    assert.ok(!('caption' in e));
    assert.equal(e.bytes, readFileSync(join(root, 'content/media/demo/angkor-wat.jpg')).length);
    assert.deepEqual(readdirSync(join(root, 'content/media/demo')).sort(), ['angkor-wat.480.jpg', 'angkor-wat.jpg', 'index.js', 'manifest.json']);
    assert.deepEqual(loadManifest(root, 'demo').images['angkor-wat'], e);
    const index = await import(`${pathToFileURL(join(root, 'content/media/demo/index.js')).href}?1`);
    assert.equal(index.MEDIA['angkor-wat'].src, e.src);
    assert.match(readFileSync(join(root, 'content/media/CREDITS.md'), 'utf8'), /`angkor-wat\.jpg`: "Angkor Wat temple" by Example Photographer\. Licence: \[CC BY-SA 4\.0\]/);
    assert.deepEqual(verifyCourse(root, 'demo'), []);
    assert.equal(f.calls.length, 2, 'one API request, one download');

    // idempotent: the same command again does nothing and asks nothing
    const again = await addImage(root, { course: 'demo', id: 'angkor-wat', title: 'File:Angkor.jpg' }, f.client);
    assert.equal(again.status, 'unchanged');
    assert.equal(f.calls.length, 2);
    // the id is taken; other options need --force
    await assert.rejects(addImage(root, { course: 'demo', id: 'angkor-wat', title: 'File:Other.jpg' }, f.client), /already used/);
    await assert.rejects(addImage(root, { course: 'demo', id: 'angkor-wat', title: 'File:Angkor.jpg', aspect: 1 }, f.client), /--force/);
    assert.equal(f.calls.length, 2);
    const forced = await addImage(root, { course: 'demo', id: 'angkor-wat', title: 'File:Angkor.jpg', aspect: 1, max: 640, force: true, caption: 'Now square' }, f.client);
    assert.deepEqual([forced.status, forced.entry.width, forced.entry.height, forced.entry.changes], ['added', 640, 640, 'cropped and resized']);
    assert.notEqual(forced.entry.src, e.src, 'a replaced picture gets a new address');
    assert.equal(forced.entry.alt, 'A temple', 'the alt text given earlier is kept');
    assert.equal(forced.entry.caption, 'Now square');
    assert.equal(f.calls.length, 2, '--force re-uses the cached download');
    assert.deepEqual(verifyCourse(root, 'demo'), []);

    // refusals leave no trace
    await assert.rejects(addImage(root, { course: 'demo', id: 'nc', title: 'File:Non commercial.jpg' }, f.client), (err) => err instanceof LicenseRefused && err.exitCode === 2 && /CC BY-NC-SA 2\.0/.test(err.message));
    await assert.rejects(addImage(root, { course: 'demo', id: 'tiny', title: 'File:Tiny.jpg' }, f.client), /too small/);
    await assert.rejects(addImage(root, { course: 'demo', id: 'Bad Id', title: 'File:Angkor.jpg' }, f.client), /--id/);
    await assert.rejects(addImage(root, { course: 'demo', id: 'x', title: 'File:Angkor.jpg', width: 1000 }, f.client), /standard thumbnail widths/);
    assert.deepEqual(Object.keys(loadManifest(root, 'demo').images), ['angkor-wat']);

    // verify notices tampering and strays
    writeFileSync(join(root, 'content/media/demo/stray.jpg'), 'x');
    writeFileSync(join(root, 'content/media/demo/angkor-wat.jpg'), Buffer.concat([readFileSync(join(root, 'content/media/demo/angkor-wat.jpg')), Buffer.from('x')]));
    const problems = verifyCourse(root, 'demo').join('\n');
    assert.match(problems, /stray\.jpg is in content\/media\/demo\/ but not in the manifest/);
    assert.match(problems, /angkor-wat\.jpg does not match its recorded hash/);
    rmSync(join(root, 'content/media/demo/stray.jpg'));

    const gone = await removeImage(root, 'demo', 'angkor-wat', f.client);
    assert.equal(gone.id, 'angkor-wat');
    assert.deepEqual(readdirSync(join(root, 'content/media/demo')).sort(), ['index.js', 'manifest.json']);
    assert.match(readFileSync(join(root, 'content/media/CREDITS.md'), 'utf8'), /No pictures yet/);
    await assert.rejects(removeImage(root, 'demo', 'angkor-wat', f.client), /no picture/);
  } finally {
    f.done();
    rmSync(root, { recursive: true, force: true });
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('command-line parsing', () => {
  assert.deepEqual(parseArgs(['--course', 'x', '--id', 'a-b', '--title', 'File:A b.jpg', '--force']), { course: 'x', id: 'a-b', title: 'File:A b.jpg', force: true });
  assert.throws(() => parseArgs(['--title']), /needs a value/);
  assert.throws(() => parseArgs(['File:A.jpg']), /Unexpected/);
  assert.deepEqual(splitArgs(`--id great-wave --title "File:Tsunami by hokusai.jpg" --aspect 3:2 --alt 'A big wave'`), ['--id', 'great-wave', '--title', 'File:Tsunami by hokusai.jpg', '--aspect', '3:2', '--alt', 'A big wave']);
});

/* ------------------------------------------------------- the photo helper */

const MEDIA = {
  temple: publicEntry(entry('temple')),
  earth: publicEntry(entry('earth', { publicDomain: true, attributionRequired: false, license: 'Public domain', licenseUrl: null, author: 'NASA/Apollo 17 crew', alt: 'Earth from space' })),
  old: publicEntry(entry('old', { publicDomain: true, attributionRequired: false, license: 'Public domain', licenseUrl: null, author: 'Unknown author' })),
};

test('photo() builds a widget spec from a manifest entry', () => {
  const spec = photo(MEDIA.temple, { alt: 'A stone temple with five towers', caption: 'Angkor Wat' });
  assert.deepEqual(spec, {
    type: 'photo', src: 'content/media/demo/temple.jpg?v=0123abcd', thumb: 'content/media/demo/temple.480.jpg?v=89abcdef', width: 1280, height: 853,
    alt: 'A stone temple with five towers', caption: 'Angkor Wat', credit: 'Jane Doe', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:temple.jpg', publicDomain: false, title: 'Name of temple', changes: 'resized',
  });
  assert.equal(photo(MEDIA.earth).alt, 'Earth from space', 'the manifest\'s alt is the default');
  assert.equal(photo(MEDIA.earth, { alt: 'Our planet' }).alt, 'Our planet');
  assert.ok(!('caption' in photo(MEDIA.earth)));
  const hot = photo(MEDIA.temple, { alt: 'x', hotspots: [{ id: 'a', x: 0.5, y: 0.5, r: 0.1, label: 'A' }], fit: 'contain', focus: [0.5, 0.2] });
  assert.equal(hot.hotspots.length, 1);
  assert.equal(hot.fit, 'contain');
  assert.throws(() => photo(undefined, { alt: 'x' }), /not in the media index/);
  assert.throws(() => photo(MEDIA['no-such'], { alt: 'x' }), /not in the media index/);
});

test('the credit line under a picture', () => {
  assert.equal(creditLine(photo(MEDIA.temple, { alt: 'x' })), 'Photo: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons');
  assert.equal(creditLine(photo(MEDIA.earth)), 'Image: NASA/Apollo 17 crew, public domain, via Wikimedia Commons');
  assert.equal(creditLine(photo(MEDIA.old, { alt: 'x' })), 'Public domain, via Wikimedia Commons');
  assert.equal(creditLine(photo(MEDIA.temple, { alt: 'x', creditLabel: 'Painting' })), 'Painting: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons');
  assert.equal(creditLine({ credit: 'Jane Doe', license: 'CC BY 4.0' }), 'Photo: Jane Doe, CC BY 4.0');
  assert.equal(creditLine({ credit: 'Someone', license: 'CC0', publicDomain: true, sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg' }), 'Image: Someone, CC0, via Wikimedia Commons');
  assert.equal(creditLine({}), '');
  const parts = creditParts(photo(MEDIA.temple, { alt: 'x' }));
  assert.deepEqual(parts, { label: 'Photo', author: 'Jane Doe', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', sourceUrl: 'https://commons.wikimedia.org/wiki/File:temple.jpg', via: 'Wikimedia Commons', publicDomain: false, title: 'Name of temple', changes: 'resized' });
});

test('photo geometry: hotspots and the visible part of a cropped picture', () => {
  const spots = [{ id: 'big', x: 0.5, y: 0.5, r: 0.3 }, { id: 'small', x: 0.55, y: 0.5, r: 0.05 }, { id: 'corner', x: 0.1, y: 0.1, r: 0.08 }];
  // radii are fractions of the picture's WIDTH, so a spot is a circle on screen whatever the shape
  assert.equal(hotspotAt(spots, 0.55, 0.5, 2), 'small', 'the smallest spot that contains the point wins');
  assert.equal(hotspotAt(spots, 0.3, 0.5, 2), 'big');
  assert.equal(hotspotAt(spots, 0.5, 0.95, 2), 'big', '0.45 of the height is 0.225 of the width on a 2:1 picture: inside');
  assert.equal(hotspotAt(spots, 0.5, 0.95, 1), null);
  assert.equal(hotspotAt(spots, 0.5, 0.75, 1), 'big');
  assert.equal(hotspotAt(spots, 0.9, 0.9, 1.5), null);
  assert.equal(hotspotAt([], 0.5, 0.5, 1), null);
  // object-fit: cover — which part of a 3:2 picture shows in a 4:3 box
  const c = coverBox(1200, 800, 4 / 3, [0.5, 0.5]);
  assert.ok(Math.abs(c.width - 1066.67) < 0.01 && c.height === 800 && Math.abs(c.x - 66.67) < 0.01 && c.y === 0, JSON.stringify(c));
  assert.equal(coverBox(1200, 800, 4 / 3, [1, 0.5]).x + coverBox(1200, 800, 4 / 3, [1, 0.5]).width, 1200);
  assert.deepEqual(coverBox(800, 1200, 1, [0.5, 0]), { x: 0, y: 0, width: 800, height: 800 });
});

/* ---------------------------------------------------------------- timeline */

test('years: BCE and CE labels, and no year zero', () => {
  assert.equal(formatYear(-500), '500 BCE');
  assert.equal(formatYear(1500), '1500 CE');
  assert.equal(formatYear(1), '1 CE');
  assert.equal(formatYear(-1), '1 BCE');
  assert.equal(formatYear(-12000), '12,000 BCE');
  assert.equal(formatYear(-3000), '3000 BCE', 'four-digit years have no separator');
  assert.equal(formatYear(1969, { ce: false }), '1969');
  assert.equal(formatYear(-44, { ce: false }), '44 BCE');
  assert.equal(formatYear(0), '1 BCE / 1 CE', 'the point between the two eras');
  assert.equal(formatYear(-753.4), '753 BCE');
  assert.equal(formatYear(-2.5e6), '2.5 million BCE');
  assert.equal(formatYear(-4.6e9), '4.6 billion BCE');

  // the span from 1 BCE to 1 CE is one year, not two
  assert.equal(yearsBetween(-1, 1), 1);
  assert.equal(yearsBetween(-44, 14), 57);
  assert.equal(yearsBetween(-753, 476), 1228);
  assert.equal(yearsBetween(1914, 1918), 4);
  assert.equal(yearsBetween(-500, -300), 200);
  assert.equal(yearsBetween(14, -44), -57);
  assert.equal(yearsBetween(5, 5), 0);

  assert.equal(formatAgo(13.8e9), '13.8 billion years ago');
  assert.equal(formatAgo(66e6), '66 million years ago');
  assert.equal(formatAgo(66002025), '66 million years ago', 'rounded to three figures');
  assert.equal(formatAgo(300000), '300,000 years ago');
  assert.equal(formatAgo(12000), '12,000 years ago');
  assert.equal(formatAgo(525), '525 years ago');
  assert.equal(formatAgo(1), '1 year ago');
  assert.equal(formatAgo(2.5e6, { short: true }), '2.5 M');
  assert.equal(formatAgo(1e9, { short: true }), '1 bn');
  assert.equal(formatAgo(10000, { short: true }), '10 k');
  assert.equal(formatAgo(100, { short: true }), '100');
});

test('timeline scales: linear and log years-ago', () => {
  const lin = makeScale({ from: -3000, to: 2000 });
  assert.equal(lin.t(-3000), 0);
  assert.equal(lin.t(2000), 1);
  assert.equal(lin.t(-500), 0.5);
  assert.equal(lin.year(0.5), -500);
  assert.equal(lin.t(-9999), 0, 'clamped to the axis');
  assert.equal(lin.t(9999), 1);
  for (const y of [-3000, -1234, 0, 1, 1999]) assert.ok(Math.abs(lin.year(lin.t(y)) - y) < 1e-6, `round trip ${y}`);

  // deep time: each step to the left is ten times further back
  const log = makeScale({ from: -1e9 + 2000, to: 1000, scale: 'log-ago', now: 2000 });
  assert.equal(log.kind, 'log-ago');
  assert.ok(Math.abs(log.t(2000 - 1e9)) < 1e-9, 'a billion years ago is the left end');
  assert.ok(Math.abs(log.t(1000) - 1) < 1e-9, 'a thousand years ago is the right end');
  assert.ok(Math.abs(log.t(2000 - 1e6) - 0.5) < 1e-9, 'a million years ago sits halfway between 10^9 and 10^3');
  const gaps = [1e9, 1e8, 1e7, 1e6, 1e5, 1e4, 1e3].map((ago) => log.t(2000 - ago));
  for (let i = 1; i < gaps.length; i++) assert.ok(Math.abs(gaps[i] - gaps[i - 1] - 1 / 6) < 1e-9, 'equal steps per factor of ten');
  for (const ago of [9e8, 66e6, 3e5, 12000, 1500]) assert.ok(Math.abs(log.ago(log.t(2000 - ago)) - ago) / ago < 1e-9, `round trip ${ago}`);
  assert.equal(log.t(2000), 1, 'the present cannot be drawn on a log axis: clamped to the right end');
  assert.ok(log.t(1990) <= 1 && log.t(-1e12) === 0);
  // monotonic: later years are never drawn further left
  let last = -1;
  for (const y of [-1e9, -5e8, -1e6, -10000, -500, 0, 500, 999]) { const t = log.t(y); assert.ok(t >= last, `monotonic at ${y}`); last = t; }
  // "years ago" given directly
  const ago = makeScale({ fromAgo: 4.6e9, toAgo: 1e4, scale: 'log-ago', now: 2000 });
  assert.ok(Math.abs(ago.t(2000 - 4.6e9)) < 1e-9 && Math.abs(ago.t(2000 - 1e4) - 1) < 1e-9);
  assert.throws(() => makeScale({ from: 5, to: 5 }), /"from" must be earlier than "to"/);
});

test('timeline ticks', () => {
  const t = yearTicks(-3000, 2000, 1000);
  assert.deepEqual(t.map((x) => x.year), [-3000, -2000, -1000, 0, 1000, 2000]);
  assert.deepEqual(t.map((x) => x.label), ['3000 BCE', '2000 BCE', '1000 BCE', 'BCE | CE', '1000 CE', '2000 CE']);
  assert.deepEqual(yearTicks(1700, 2000, 100).map((x) => x.label), ['1700', '1800', '1900', '2000'], 'an all-CE axis drops the suffix');
  assert.deepEqual(yearTicks(1700, 2000, 100, { ce: true }).map((x) => x.label), ['1700 CE', '1800 CE', '1900 CE', '2000 CE']);
  assert.deepEqual(yearTicks(-70, 20, 30).map((x) => x.year), [-60, -30, 0]);
  const auto = yearTicks(-3000, 2000, null, { room: 6 });
  assert.ok(auto.length >= 3 && auto.length <= 7, `auto step gives ${auto.length} ticks`);
  const decades = agoTicks(4.6e9, 1e4);
  assert.deepEqual(decades.map((d) => d.ago), [1e9, 1e8, 1e7, 1e6, 1e5, 1e4]);
  assert.deepEqual(decades.map((d) => d.label), ['1 bn', '100 M', '10 M', '1 M', '100 k', '10 k']);
});

test('timeline labels that would collide are staggered; spans get rows', () => {
  // three labels of 80 px around x = 100, 120, 300 on a 400 px axis
  const placed = staggerLabels([{ x: 100, w: 80 }, { x: 120, w: 80 }, { x: 300, w: 80 }], { width: 400, gap: 6, maxLevels: 3 });
  assert.deepEqual(placed.map((p) => p.level), [0, 1, 0]);
  for (const p of placed) assert.ok(p.left >= 0 && p.left + p.w <= 400);
  // labels near the edges are pulled inside
  const edge = staggerLabels([{ x: 2, w: 90 }, { x: 398, w: 90 }], { width: 400, gap: 6, maxLevels: 3 });
  assert.deepEqual(edge.map((p) => p.left), [0, 310]);
  // no two labels on one level overlap, whatever the input
  const many = Array.from({ length: 9 }, (_, i) => ({ x: 40 + i * 37, w: 70 + (i % 3) * 15 }));
  const out = staggerLabels(many, { width: 390, gap: 6, maxLevels: 9 });
  for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
    if (out[i].level !== out[j].level) continue;
    assert.ok(out[i].left + out[i].w + 6 <= out[j].left + 1e-9 || out[j].left + out[j].w + 6 <= out[i].left + 1e-9, `labels ${i} and ${j} overlap`);
  }
  // too many for the levels allowed: the caller is told, and falls back to numbers with a legend
  assert.equal(staggerLabels(Array.from({ length: 6 }, () => ({ x: 200, w: 120 })), { width: 390, gap: 6, maxLevels: 3 }), null);

  // spans: explicit rows are kept, the rest fill the first row that is free
  const rows = assignRows([{ from: 0, to: 100 }, { from: 50, to: 150 }, { from: 120, to: 200 }, { from: 10, to: 20, row: 2 }, { from: 100, to: 110 }]);
  assert.deepEqual(rows, [0, 1, 0, 2, 0]);
});

/* =========================================================== follow-up work
 * Author strings as they really occur, credits set by hand, the fair queue,
 * and what a timeline's solution may say about notes that were read.
 */

/** Author fields as the Commons API returned them for pictures now in the courses (14 November 2026). */
const ARTISTS = {
  everest: '<ul><li><a href="//commons.wikimedia.org/wiki/File:Mount_Everest_as_seen_from_Drukair2.jpg" title="File:Mount Everest as seen from Drukair2.jpg">Mount_Everest_as_seen_from_Drukair2.jpg</a>: <a rel="nofollow" class="external text" href="https://www.flickr.com/photos/37047767@N00">shrimpo1967</a></li>\n<li>derivative work: <a href="//commons.wikimedia.org/w/index.php?title=User:Papa_Lima_Whiskey_2&amp;action=edit&amp;redlink=1" class="new" title="User:Papa Lima Whiskey 2 (page does not exist)">Papa Lima Whiskey 2</a> (<a href="//commons.wikimedia.org/wiki/User_talk:Papa_Lima_Whiskey_2" title="User talk:Papa Lima Whiskey 2"><span class="signature-talk">talk</span></a>)</li></ul>',
  petra: '<ul><li><a href="//commons.wikimedia.org/wiki/File:Al_Khazneh_Petra.jpg" title="File:Al Khazneh Petra.jpg">Al_Khazneh_Petra.jpg</a>: <a rel="nofollow" class="external text" href="https://www.flickr.com/photos/12427420@N00">Graham Racher</a> from London, UK</li>\n<li>derivative work: <a href="//commons.wikimedia.org/wiki/User:MrPanyGoff" title="User:MrPanyGoff"><span style="font-family:BernhardMod BT;">MrPanyGoff</span></a></li></ul>',
  copernicus: '<ul><li><a href="//commons.wikimedia.org/wiki/File:Copernican_heliocentrism_diagram.jpg" title="File:Copernican heliocentrism diagram.jpg">Copernican_heliocentrism_diagram.jpg</a>: Own work from  Copernicus 1543</li>\n<li>derivative work: <a href="//commons.wikimedia.org/w/index.php?title=User:Professor_marginalia&amp;action=edit&amp;redlink=1" class="new" title="User:Professor marginalia (page does not exist)">Professor marginalia</a> (<a href="//commons.wikimedia.org/wiki/User_talk:Professor_marginalia" title="User talk:Professor marginalia"><span class="signature-talk">talk</span></a>)</li></ul>',
  astrolabe: '<div class="fn value">\n<a href="//commons.wikimedia.org/w/index.php?title=Creator:%E2%80%98Umar_ibn_Yusuf&amp;action=edit&amp;redlink=1" class="new" title="Creator:‘Umar ibn Yusuf ibn ‘Umar ibn ‘Ali ibn Rasul al-Muzaffari (page does not exist)">Creator:‘Umar ibn Yusuf ibn ‘Umar ibn ‘Ali ibn Rasul al-Muzaffari</a></div>',
  machuPicchu: 'Pedro Szekely at <a rel="nofollow" class="external free" href="https://www.flickr.com/photos/pedrosz/">https://www.flickr.com/photos/pedrosz/</a>',
  zimbabwe: '<a rel="nofollow" class="external text" href="https://www.flickr.com/people/84985982@N00">Andrew Moore</a> from Johannesburg, South Africa',
  quipu: 'Claus Ableiter nur hochgeladen aus enWiki',
  ife: '​<a href="https://en.wikipedia.org/wiki/Main_Page" class="extiw" title="en:Main Page">English Wikipedia</a> user <a href="https://en.wikipedia.org/wiki/User:Ukabia" class="extiw" title="en:User:Ukabia">Ukabia</a>',
  jikji: 'Authored by Baegun Hwaseng (1289-1374), a master of Seon Buddhism in Korea, and published by his students, Seokchan and Daljam in 1377.',
  tenochtitlan: "Friedrich Peypus (1485–1534), probably after drawing made by one of Cortez' men.",
  wyld: '<div class="fn value">\nWyld, William (1806 - 1889)  (English)<br> Born in London. Died in Paris.<br> <a rel="nofollow" class="external text" href="http://www.googleartproject.com/artist/william-wyld/4126375/">Details on Google Art Project</a></div>',
  giraffe: 'Shen Du (沈度, 1357–1434)<br><small>Note: In contrast to the other references, the Philadelphia Museum of Art considers this to be rather a later work by an unknown painter from the 16th century.</small>',
  medicean: '<ul><li>Scan: History of Science Collections, University of Oklahoma Libraries</li>\n<li>Original: Galileo Galilei</li></ul>',
  isaiah: 'Photographs by Ardon Bar Hama, author of original document is unknown.',
  diamondSutra: 'The colophon, at the inner end, reads: Reverently [caused to be] made for universal free distribution by Wang Jie on behalf of his two parents on the 13th of the 4th moon of the 9th year of Xiantong [i.e. 11th May, CE 868 ].',
  quranFolio: '<div class="fn value">\n<table cellpadding="0" cellspacing="0"><tbody><tr><td>Unknown author<span style="display: none;">Unknown author</span></td><td valign="top"> <span class="mw-valign-text-top noprint"><a href="https://www.wikidata.org/wiki/Q29385260#P170" title="Edit this at Wikidata"><img alt="Edit this at Wikidata" src="https://thumb.wikimedia.org/x.png" width="10" height="10"></a></span></td></tr></tbody></table></div>',
};

test('author strings: the patterns that really occur', () => {
  // lists of "File.jpg: name" and "derivative work: name": everyone a licence may want named is kept …
  assert.equal(cleanAuthor(ARTISTS.everest), 'shrimpo1967; derivative work: Papa Lima Whiskey 2');
  assert.equal(cleanAuthor(ARTISTS.petra), 'Graham Racher; derivative work: MrPanyGoff');
  // … and for public-domain files (chain: false) the first name is enough
  assert.equal(cleanAuthor(ARTISTS.everest, { chain: false }), 'shrimpo1967');
  assert.equal(cleanAuthor(ARTISTS.copernicus, { chain: false }), 'Own work from Copernicus 1543', 'not a name, and flagged as such below');
  assert.equal(cleanAuthor(ARTISTS.astrolabe), '‘Umar ibn Yusuf ibn ‘Umar ibn ‘Ali ibn Rasul al-Muzaffari', 'no "Creator:" prefix');
  assert.equal(cleanAuthor(ARTISTS.machuPicchu), 'Pedro Szekely', 'no Flickr address');
  assert.equal(cleanAuthor(ARTISTS.zimbabwe), 'Andrew Moore', 'no home town after a Flickr name');
  assert.equal(cleanAuthor('Tatters ❀ from Brisbane, Australia'), 'Tatters ❀ from Brisbane, Australia', 'plain text is not guessed at: only "from" after a Flickr link is dropped');
  assert.equal(cleanAuthor(ARTISTS.ife), 'Ukabia at English Wikipedia');
  assert.equal(cleanAuthor('<a href="https://en.wikipedia.org/wiki/en:User:Arad">en:User:Arad</a>'), 'Arad');
  assert.equal(cleanAuthor(ARTISTS.jikji), 'Baegun Hwaseng (1289-1374)');
  assert.equal(cleanAuthor(ARTISTS.tenochtitlan), 'Friedrich Peypus (1485–1534)');
  assert.equal(cleanAuthor(ARTISTS.wyld), 'William Wyld (1806–1889)');
  assert.equal(cleanAuthor(ARTISTS.giraffe), 'Shen Du (沈度, 1357–1434)', 'a remark in small print is dropped');
  assert.equal(cleanAuthor(ARTISTS.medicean), 'Galileo Galilei', '"Original:" names the author, "Scan:" does not');
  assert.equal(cleanAuthor(ARTISTS.isaiah), 'Ardon Bar Hama');
  assert.equal(cleanAuthor(ARTISTS.quranFolio), 'Unknown author');
  assert.equal(cleanAuthor(ARTISTS.quipu), 'Claus Ableiter nur hochgeladen aus enWiki', 'a note in another language is left alone, and flagged');
  const sutra = cleanAuthor(ARTISTS.diamondSutra, { chain: false });
  assert.ok(sutra.length <= 90 && sutra.endsWith('…'), 'a sentence is capped');
  // nothing that was fine before has changed
  assert.equal(cleanAuthor('NASA/Apollo 17 crew; taken by either Harrison Schmitt or Ron Evans'), 'NASA/Apollo 17 crew; taken by either Harrison Schmitt or Ron Evans');
  assert.equal(cleanAuthor('Phillip Maiwald (Nikopol)'), 'Phillip Maiwald (Nikopol)');
  assert.equal(cleanAuthor("Limbourg brothers / Barthélemy d'Eyck"), "Limbourg brothers / Barthélemy d'Eyck");
  assert.equal(cleanAuthor('anonymous Portuguese (1502)'), 'anonymous Portuguese (1502)');
  assert.equal(cleanAuthor('FDR Presidential Library &amp; Museum'), 'FDR Presidential Library & Museum');
  assert.equal(cleanAuthor('https://www.flickr.com/photos/someone/'), null, 'an address alone is not an author');
});

test('whose name the licence wants: photographs of old objects, uploaders, and nobody', () => {
  const cc = { LicenseShortName: v('CC BY 2.5'), License: v('cc-by-2.5'), LicenseUrl: v('https://creativecommons.org/licenses/by/2.5') };
  // File:Folio Blue Quran Met 2004.88.jpg: the author field describes the 9th-century folio, the photographer is in the source field
  const folio = describeFile(page('File:Folio Blue Quran Met 2004.88.jpg', { ...cc, Artist: v(ARTISTS.quranFolio), Credit: v('<a href="//commons.wikimedia.org/wiki/User:Jastrow" title="User:Jastrow">Marie-Lan Nguyen</a> (2011)') }));
  assert.deepEqual([folio.author, folio.authorFrom, folio.authorUnresolved], ['Marie-Lan Nguyen', 'credit', false]);
  // the maker of the object, with a creator page or with life dates long past, is not the photographer either
  const oldMaster = describeFile(page('File:Bowl.jpg', { ...cc, Artist: v('<div class="fn value">Jan Maker (1610–1675)</div>'), Credit: v('<a href="//commons.wikimedia.org/wiki/User:Lens" title="User:Lens">Lena Lens</a>') }));
  assert.deepEqual([oldMaster.author, oldMaster.authorFrom, oldMaster.authorUnresolved], ['Lena Lens', 'credit', false]);
  // … and when the source field names no person, the attribution is unresolved, and nothing is invented
  const noPerson = describeFile(page('File:Bowl.jpg', { ...cc, Artist: v(ARTISTS.quranFolio), Credit: v('<a rel="nofollow" href="https://www.metmuseum.org/art/collection/search/1">Metropolitan Museum of Art</a>') }));
  assert.deepEqual([noPerson.author, noPerson.authorUnresolved], ['Unknown author', true]);
  const creatorPage = describeFile(page('File:Astrolabe.jpg', { ...cc, Artist: v(ARTISTS.astrolabe), Credit: v('Donated by a museum') }));
  assert.equal(creatorPage.authorUnresolved, true);
  // File:Inca Quipu.jpg: the "author" says himself that he only uploaded it
  const quipu = describeFile(page('File:Inca Quipu.jpg', { LicenseShortName: v('CC BY-SA 3.0'), License: v('cc-by-sa-3.0'), Artist: v(ARTISTS.quipu), Credit: v('enWiki, hochgeladen von User Lyndsaruell; siehe http://en.wikipedia.org/wiki/Image:Inca_Quipu.jpg') }));
  assert.equal(quipu.authorUnresolved, true);
  // an attribution the author asked for settles it, whatever the artist field says
  const asked = describeFile(page('File:Wall.jpg', { ...cc, Artist: v('Unknown photographer, Reproduction by Lear 21'), Attribution: v('<a href="https://en.wikipedia.org/wiki/User:Lear_21">Lear 21</a> at English Wikipedia') }));
  assert.deepEqual([asked.author, asked.authorFrom, asked.authorUnresolved], ['Lear 21 at English Wikipedia', 'attribution', false]);
  // ordinary photographs are untouched; public-domain files are never "unresolved"
  assert.equal(describeFile(page('File:X.jpg', META.ccBySa4)).authorUnresolved, false);
  assert.equal(describeFile(page('File:X.jpg', META.pdOld)).authorUnresolved, false);
  assert.equal(describeFile(page('File:Wave.jpg', META.wave)).authorUnresolved, false, 'life dates on a public-domain work are just the artist');
  const pdList = describeFile(page('File:Diagram.png', { LicenseShortName: v('Public domain'), License: v('pd'), Artist: v(ARTISTS.everest) }));
  assert.equal(pdList.author, 'shrimpo1967', 'public domain: the first name only');
  assert.equal(describeFile(page('File:E.jpg', { ...cc, Artist: v(ARTISTS.everest) })).author, 'shrimpo1967; derivative work: Papa Lima Whiskey 2');

  assert.equal(attributionUnresolved({ attributionRequired: true, author: 'Unknown author' }), true);
  assert.equal(attributionUnresolved({ attributionRequired: true, author: '' }), true);
  assert.equal(attributionUnresolved({ attributionRequired: true, author: 'Anonymous' }), true);
  assert.equal(attributionUnresolved({ attributionRequired: true, author: 'See the source page for the author' }), true);
  assert.equal(attributionUnresolved({ attributionRequired: true, author: 'A maker (1610–1675)', authorUnresolved: true }), true);
  assert.equal(attributionUnresolved({ attributionRequired: true, author: 'Unknown author', authorOverride: 'Lena Lens' }), false, 'a name set by hand settles it');
  assert.equal(attributionUnresolved({ attributionRequired: false, author: 'Unknown author' }), false);
  assert.equal(attributionUnresolved({ attributionRequired: true, author: 'Jane Doe' }), false);

  assert.match(authorDoubt({ attributionRequired: true, author: 'Unknown author' }), /^ATTRIBUTION UNRESOLVED/);
  assert.equal(authorDoubt({ publicDomain: true, author: 'Unknown author' }), null);
  assert.equal(authorDoubt({ attributionRequired: true, author: 'Jane Doe' }), null);
  assert.equal(authorDoubt({ attributionRequired: true, author: 'shrimpo1967; derivative work: Papa Lima Whiskey 2' }), null, 'a chain of names is what the licence wants');
  assert.match(authorDoubt({ publicDomain: true, author: 'Own work from Copernicus 1543' }), /remark/);
  assert.match(authorDoubt({ publicDomain: true, author: 'Konrad Miller (copy and transliteration)' }), /remark/);
  assert.match(authorDoubt({ publicDomain: true, author: 'The colophon, at the inner end, reads: Reverently…' }), /cut off/);
  assert.match(authorDoubt({ publicDomain: true, author: 'Yann', authorIsUser: true }), /uploader/);
  assert.equal(authorDoubt({ attributionRequired: true, author: 'Yann', authorIsUser: true }), null, 'a wiki user is who licenses most photographs');
  assert.equal(authorDoubt({ publicDomain: true, author: 'whatever: it says', authorOverride: 'whatever: it says' }), null, 'nobody second-guesses a name set by hand');
});

test('a credit line under a CC licence is never without a name', () => {
  const cc = { license: 'CC BY 2.5', sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg' };
  assert.equal(creditLine({ ...cc, credit: 'Unknown author' }), 'Photo: author named on the source page, CC BY 2.5, via Wikimedia Commons');
  assert.equal(creditLine({ ...cc, credit: '' }), 'Photo: author named on the source page, CC BY 2.5, via Wikimedia Commons');
  assert.equal(creditLine({ ...cc, credit: 'See the source page for the author' }), 'Photo: author named on the source page, CC BY 2.5, via Wikimedia Commons');
  assert.equal(creditLine({ ...cc, credit: 'Marie-Lan Nguyen' }), 'Photo: Marie-Lan Nguyen, CC BY 2.5, via Wikimedia Commons');
  // public-domain works may stay anonymous, exactly as before
  assert.equal(creditLine({ credit: 'Unknown author', license: 'Public domain', publicDomain: true, sourceUrl: cc.sourceUrl }), 'Public domain, via Wikimedia Commons');
  assert.equal(creditLine({ credit: 'Unknown author', license: 'CC0', sourceUrl: cc.sourceUrl }), 'CC0, via Wikimedia Commons');
});

test('credits set by hand, re-derived from the cache, and warned about (no network)', { skip: !pillowOk && 'needs python3 with Pillow' }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'lemma-root-'));
  const scratch = mkdtempSync(join(tmpdir(), 'lemma-src-'));
  const src = join(scratch, 'camera.jpg');
  makeCameraFile(src);
  const jpeg = readFileSync(src);
  const thumb = (name) => ({ thumburl: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/${name}.jpg/1280px-${name}.jpg` });
  const answers = {
    'File:Everest.jpg': page('File:Everest.jpg', { LicenseShortName: v('CC BY-SA 2.0'), License: v('cc-by-sa-2.0'), Artist: v(ARTISTS.everest) }, thumb('Everest')),
    'File:Folio.jpg': page('File:Folio.jpg', { LicenseShortName: v('CC BY 2.5'), License: v('cc-by-2.5'), Artist: v(ARTISTS.quranFolio), Credit: v('A museum') }, thumb('Folio')),
    'File:Quipu.jpg': page('File:Quipu.jpg', { LicenseShortName: v('CC BY-SA 3.0'), License: v('cc-by-sa-3.0'), Artist: v(ARTISTS.quipu) }, thumb('Quipu')),
    'File:Sutra.jpg': page('File:Sutra.jpg', { LicenseShortName: v('Public domain'), License: v('pd'), Artist: v(ARTISTS.diamondSutra) }, thumb('Sutra')),
    'File:School.jpg': page('File:School.jpg', { LicenseShortName: v('Public domain'), License: v('pd'), Artist: v('<a href="//commons.wikimedia.org/wiki/User:Uploader" title="User:Uploader">Uploader</a>') }, thumb('School')),
  };
  const f = fakeClient((url) => (url.startsWith('https://commons.wikimedia.org/w/api.php')
    ? { body: apiBody(answers[new URL(url).searchParams.get('titles')]) }
    : { headers: { 'content-type': 'image/jpeg' }, body: jpeg }));
  const at = { cacheDir: f.dir };
  const manifest = () => loadManifest(root, 'demo').images;
  const index = async () => (await import(`${pathToFileURL(join(root, 'content/media/demo/index.js')).href}?${Math.random()}`)).MEDIA;
  const credits = () => readFileSync(join(root, 'content/media/CREDITS.md'), 'utf8');
  try {
    for (const [id, title] of [['everest', 'File:Everest.jpg'], ['folio', 'File:Folio.jpg'], ['quipu', 'File:Quipu.jpg'], ['sutra', 'File:Sutra.jpg'], ['school', 'File:School.jpg']]) {
      await addImage(root, { course: 'demo', id, title, max: 400 }, f.client);
    }
    const requests = f.calls.length;
    let m = manifest();
    // what a new fetch records: the name shown, the tool's reading, the API's own text, and a note where a look is needed
    assert.deepEqual([m.everest.author, m.everest.authorDerived, m.everest.authorApi, m.everest.authorCheck, m.everest.authorOverride],
      ['shrimpo1967; derivative work: Papa Lima Whiskey 2', 'shrimpo1967; derivative work: Papa Lima Whiskey 2', 'Mount_Everest_as_seen_from_Drukair2.jpg: shrimpo1967 derivative work: Papa Lima Whiskey 2 (talk)', undefined, undefined]);
    assert.deepEqual([m.folio.author, m.folio.authorUnresolved], ['Unknown author', true]);
    assert.match(m.folio.authorCheck, /^ATTRIBUTION UNRESOLVED/);
    assert.equal(m.quipu.authorUnresolved, true);
    assert.match(m.sutra.authorCheck, /cut off/);
    assert.match(m.school.authorCheck, /uploader/);
    assert.equal(m.sutra.authorUnresolved, undefined, 'public domain: untidy, but nothing is owed');
    assert.deepEqual(verifyCourse(root, 'demo'), [], 'the new fields do not disturb --verify');
    // until someone records the photographer, lessons and the credits list say so instead of naming the wrong person
    assert.equal((await index()).quipu.author, 'See the source page for the author');
    assert.equal(creditLine(photo((await index()).quipu, { alt: 'Knotted cords' })), 'Photo: author named on the source page, CC BY-SA 3.0, via Wikimedia Commons');
    assert.match(credits(), /`quipu\.jpg`: "[^"]*" by \*\*an author still to be established\*\* \(Commons records "Claus Ableiter nur hochgeladen aus enWiki"/);
    assert.equal((await index()).everest.author, 'shrimpo1967; derivative work: Papa Lima Whiskey 2');
    const warned = creditWarnings(root, 'demo');
    assert.equal(warned.length, 2);
    assert.match(warned[0], /^folio: ATTRIBUTION UNRESOLVED\. CC BY 2\.5 requires a name/);
    assert.match(warned[1], /^quipu: /);

    // --author on a picture that is already there: no request, and the record is corrected everywhere
    const set = await setCredit(root, 'demo', 'folio', { author: 'Marie-Lan Nguyen' }, at);
    assert.deepEqual([set.before, set.entry.author], ['Unknown author', 'Marie-Lan Nguyen']);
    m = manifest();
    assert.deepEqual([m.folio.author, m.folio.authorOverride, m.folio.authorDerived, m.folio.authorApi, m.folio.authorCheck, m.folio.authorUnresolved],
      ['Marie-Lan Nguyen', 'Marie-Lan Nguyen', 'Unknown author', 'Unknown author', undefined, undefined], 'the original values stay on record beside the override');
    assert.equal((await index()).folio.author, 'Marie-Lan Nguyen');
    assert.equal(photo((await index()).folio, { alt: 'A page of gold writing on blue' }).credit, 'Marie-Lan Nguyen');
    assert.match(credits(), /`folio\.jpg`: "[^"]*" by Marie-Lan Nguyen\. Licence: \[CC BY 2\.5\]/);
    assert.equal(creditWarnings(root, 'demo').length, 1);
    // an unresolved record cannot veto its own correction …
    await setCredit(root, 'demo', 'quipu', { author: 'Lyndsaruell at English Wikipedia' }, at);
    assert.equal(manifest().quipu.author, 'Lyndsaruell at English Wikipedia');
    assert.deepEqual(creditWarnings(root, 'demo'), []);
    // … but a good record can: attribution is never weakened by accident
    await assert.rejects(setCredit(root, 'demo', 'everest', { author: 'A mountaineer' }, at), /licence requires its author to be named.*does not contain "shrimpo1967" or "Papa Lima Whiskey 2"/s);
    await assert.rejects(setCredit(root, 'demo', 'everest', { author: 'shrimpo1967' }, at), /"Papa Lima Whiskey 2"/);
    assert.equal(manifest().everest.author, 'shrimpo1967; derivative work: Papa Lima Whiskey 2');
    await setCredit(root, 'demo', 'everest', { author: 'shrimpo1967 (edited by Papa Lima Whiskey 2)' }, at);
    assert.equal(manifest().everest.author, 'shrimpo1967 (edited by Papa Lima Whiskey 2)');
    await setCredit(root, 'demo', 'everest', { author: 'Someone else entirely', force: true }, at);
    assert.equal(manifest().everest.authorOverride, 'Someone else entirely', '--force is the way to say that the record is wrong');
    // public-domain works: any text, plus a label for the credit line
    await setCredit(root, 'demo', 'sutra', { author: 'printed for Wang Jie, 868 CE', creditLabel: 'Print' }, at);
    m = manifest();
    assert.deepEqual([m.sutra.author, m.sutra.creditLabel, m.sutra.authorCheck], ['printed for Wang Jie, 868 CE', 'Print', undefined]);
    const spec = photo((await index()).sutra, { alt: 'A printed scroll' });
    assert.equal(spec.creditLabel, 'Print');
    assert.equal(creditLine(spec), 'Print: printed for Wang Jie, 868 CE, public domain, via Wikimedia Commons');
    assert.equal(creditLine(photo((await index()).sutra, { alt: 'A printed scroll', creditLabel: 'Book' })), 'Book: printed for Wang Jie, 868 CE, public domain, via Wikimedia Commons', 'a lesson can still choose its own label');
    // "auto" goes back to what Commons says
    await setCredit(root, 'demo', 'everest', { author: 'auto' }, at);
    await setCredit(root, 'demo', 'sutra', { creditLabel: 'auto' }, at);
    m = manifest();
    assert.deepEqual([m.everest.author, m.everest.authorOverride, m.sutra.creditLabel, m.sutra.author], ['shrimpo1967; derivative work: Papa Lima Whiskey 2', undefined, undefined, 'printed for Wang Jie, 868 CE']);
    await assert.rejects(setCredit(root, 'demo', 'nope', { author: 'X' }, at), /no picture "nope"/);
    await assert.rejects(setCredit(root, 'demo', 'sutra', { author: '  ' }, at), /needs a name/);
    assert.deepEqual(verifyCourse(root, 'demo'), []);
    assert.equal(f.calls.length, requests, 'none of this asked Wikimedia anything');

    // --recredit: manifests written before the cleaner improved are brought up to date from the cache
    const file = join(root, 'content/media/demo/manifest.json');
    const old = JSON.parse(readFileSync(file, 'utf8'));
    old.images.everest = { ...old.images.everest, author: 'Mount_Everest_as_seen_from_Drukair2.jpg: shrimpo1967 derivative work: Papa Lima Whiskey 2' };
    for (const key of ['authorDerived', 'authorApi', 'attributionApi', 'authorCheck', 'authorUnresolved']) for (const e of Object.values(old.images)) delete e[key];
    old.images.school.author = 'Uploader';
    writeFileSync(file, JSON.stringify(old, null, 2));
    const dry = await recredit(root, ['demo'], { dryRun: true, ...at });
    assert.deepEqual(dry.changed, [{ course: 'demo', id: 'everest', from: 'Mount_Everest_as_seen_from_Drukair2.jpg: shrimpo1967 derivative work: Papa Lima Whiskey 2', to: 'shrimpo1967; derivative work: Papa Lima Whiskey 2' }]);
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).images.everest.authorDerived, undefined, 'a dry run writes nothing');
    const done = await recredit(root, ['demo'], at);
    assert.deepEqual(done.changed.map((c) => c.id), ['everest']);
    assert.deepEqual(done.doubtful.map((d) => d.id), ['school'], 'only what still needs a look; names set by hand are settled');
    assert.deepEqual(done.uncached, []);
    m = manifest();
    assert.equal(m.everest.author, 'shrimpo1967; derivative work: Papa Lima Whiskey 2');
    assert.deepEqual([m.folio.author, m.folio.authorOverride, m.folio.authorDerived], ['Marie-Lan Nguyen', 'Marie-Lan Nguyen', 'Unknown author'], 'an author set by hand survives');
    assert.equal(m.quipu.author, 'Lyndsaruell at English Wikipedia');
    assert.match(credits(), /by shrimpo1967; derivative work: Papa Lima Whiskey 2\./);
    assert.deepEqual((await recredit(root, ['demo'], at)).changed, [], 'running it again changes nothing');
    // a picture whose API answer is not in the cache is left exactly as it is
    const blind = await recredit(root, ['demo'], { cacheDir: mkdtempSync(join(tmpdir(), 'lemma-empty-')) });
    assert.equal(blind.uncached.length, 5);
    assert.deepEqual(blind.changed, []);
    assert.deepEqual(manifest().folio.authorOverride, 'Marie-Lan Nguyen');
    // re-fetching the same file (--force) keeps the override; an --author at fetch time is recorded as one
    const again = await addImage(root, { course: 'demo', id: 'folio', title: 'File:Folio.jpg', max: 320, force: true }, f.client);
    assert.deepEqual([again.entry.author, again.entry.authorOverride, again.entry.authorDerived], ['Marie-Lan Nguyen', 'Marie-Lan Nguyen', 'Unknown author']);
    const fresh = await addImage(root, { course: 'demo', id: 'sutra-2', title: 'File:Sutra.jpg', max: 320, author: 'Wang Jie (donor)', creditLabel: 'Print' }, f.client);
    assert.deepEqual([fresh.entry.author, fresh.entry.authorOverride, fresh.entry.creditLabel], ['Wang Jie (donor)', 'Wang Jie (donor)', 'Print']);
    await assert.rejects(addImage(root, { course: 'demo', id: 'everest-2', title: 'File:Everest.jpg', max: 320, author: 'Nobody' }, f.client), /licence requires its author/);
    assert.equal(f.calls.length, requests, 'still not a single request');
  } finally {
    f.done();
    rmSync(root, { recursive: true, force: true });
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('the queue is first come, first served', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lemma-queue-'));
  const lock = join(dir, 'wikimedia.lock');
  const nap = (ms) => new Promise((r) => setTimeout(r, ms));
  const quick = { sleep: (ms) => nap(Math.min(ms, 12)), noteMs: 40 };
  try {
    // B, C and D arrive, in that order, while A holds the lock: they are served in that order
    const order = [];
    const notes = [];
    const job = (name, hold) => withLock(lock, async () => { order.push(name); await nap(hold); }, { ...quick, onWait: (info) => notes.push({ name, ...info }) });
    const a = job('A', 150);
    await nap(20);
    const b = job('B', 10);
    await nap(20);
    const c = job('C', 10);
    await nap(20);
    const d = job('D', 10);
    await Promise.all([a, b, c, d]);
    assert.deepEqual(order, ['A', 'B', 'C', 'D']);
    // everyone who waited said so at once, and again while the wait went on, with their place in the queue
    for (const name of ['B', 'C', 'D']) assert.ok(notes.filter((n) => n.name === name).length >= 2, `${name} reported ${notes.filter((n) => n.name === name).length} time(s)`);
    assert.deepEqual(notes.filter((n) => n.name === 'D')[0].ahead, 2, 'D starts behind B and C');
    assert.ok(notes.every((n) => Number.isFinite(n.waitedMs) && n.ahead >= 0));
    assert.ok(!notes.some((n) => n.name === 'A'), 'whoever gets the lock at once has nothing to report');

    // a process that needs many turns (a batch) neither starves a latecomer nor is starved by one
    const turns = [];
    const batch = (async () => { for (let i = 1; i <= 4; i++) await withLock(lock, async () => { turns.push(`batch${i}`); await nap(40); }, quick); })();
    await nap(15);
    const late = withLock(lock, async () => { turns.push('late'); await nap(10); }, quick);
    await Promise.all([batch, late]);
    assert.deepEqual(turns, ['batch1', 'late', 'batch2', 'batch3', 'batch4'], 'the latecomer is served after the turn in progress, not after the whole batch');

    // the ticket of a process that died while queueing does not hold anyone up
    mkdirSync(`${lock}.queue`, { recursive: true });
    writeFileSync(join(`${lock}.queue`, '000000000000001-000001-4199999'), '4199999');
    let ran = false;
    await withLock(lock, async () => { ran = true; }, quick);
    assert.ok(ran);
    assert.deepEqual(readdirSync(`${lock}.queue`), [], 'no tickets are left behind');
    assert.ok(!existsSync(lock));
    // a waiter whose own work throws leaves the queue cleanly too
    await assert.rejects(withLock(lock, async () => { throw new Error('boom'); }, quick), /boom/);
    assert.deepEqual(readdirSync(`${lock}.queue`), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('client: the politeness rules are unchanged by the queue, and long waits show signs of life', async () => {
  const f = fakeClient([{ status: 429, body: 'slow down' }, { body: apiBody(page('File:A.jpg', META.cc0)) }, { body: apiBody(page('File:B.jpg', META.cc0)) }], { gapMs: 15000 });
  try {
    await f.client.fileInfo('File:A.jpg');
    await f.client.fileInfo('File:B.jpg');
    assert.deepEqual(f.calls.slice(1).map((c, i) => Math.round((c.at - f.calls[i].at) / 1000)), [60, 15], 'back-off first, then the ordinary gap');
    assert.ok(f.sleeps.every((ms) => ms <= 60000), 'no single sleep is longer than a minute');
    assert.ok(f.logs.some((l) => /^waiting 60 s before asking Wikimedia/.test(l)), f.logs.join('\n'));
    assert.ok(!existsSync(join(f.dir, 'wikimedia.lock')) && readdirSync(join(f.dir, 'wikimedia.lock.queue')).length === 0);
  } finally { f.done(); }
  // ten minutes of back-off: a line a minute
  const g = fakeClient([{ status: 429, body: '' }, { status: 429, body: '' }, { status: 429, body: '' }, { body: apiBody(page('File:A.jpg', META.cc0)) }]);
  try {
    await g.client.fileInfo('File:A.jpg');
    assert.equal(g.logs.filter((l) => /^still waiting: \d+ s to go/.test(l)).length, 0 + 2 + 9, 'during the 180 s and the 600 s waits');
  } finally { g.done(); }
});

test('timeline: what a solution may say about notes that were read', () => {
  const known = (id) => ['a', 'b', 'c', 'han'].includes(id);
  // the documented check (s) => s.seenCount >= 3 can now be met by  solution: { seen: ['a', 'b', 'c'] }
  assert.deepEqual(exploreState({ seen: ['a', 'b', 'c'] }, known), { seen: ['a', 'b', 'c'], selected: 'c' });
  assert.deepEqual(exploreState({ seen: ['a', 'zzz', 'a', 'han'] }, known), { seen: ['a', 'han'], selected: 'han' }, 'unknown ids and repeats are dropped');
  assert.deepEqual(exploreState({ seen: ['a', 'b'], selected: 'a' }, known), { seen: ['a', 'b'], selected: 'a' });
  assert.deepEqual(exploreState({ seen: ['a'], selected: null }, known), { seen: ['a'], selected: null });
  assert.deepEqual(exploreState({ seen: [] }, known), { seen: [], selected: null });
  // the forms that worked before behave as before
  assert.deepEqual(exploreState({ selected: 'b' }, known), { seen: null, selected: 'b' });
  assert.deepEqual(exploreState({ selected: 'nope' }, known), { seen: null, selected: null });
  assert.deepEqual(exploreState({}, known), { seen: null, selected: null });
  assert.deepEqual(exploreState({ seen: 'a' }, known), { seen: null, selected: null }, 'seen must be a list');
});

test('photo: the part of a picture a card shows', () => {
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  // magnify 1: the largest window of the box's shape, centred on the focus as far as the edges allow
  let w = cropWindow(1.5, 4 / 3, [0.5, 0.5], 1);
  assert.ok(near(w.w, 8 / 9) && near(w.h, 1) && near(w.x, 1 / 18) && near(w.y, 0), JSON.stringify(w));
  // a 3:2 picture in a 4:3 card has nothing to spare vertically: a focus cannot move the cut up or down …
  assert.equal(cropWindow(1.5, 4 / 3, [0.5, 0.9], 1).y, 0);
  // … which is why a card with a focus is enlarged a little (1.25): now the focus shows
  w = cropWindow(1.5, 4 / 3, [0.5, 0.7], 1.25);
  assert.ok(near(w.h, 0.8) && near(w.y, 0.2) && near(w.w, 8 / 9 / 1.25), JSON.stringify(w));
  assert.ok(near(cropWindow(1.5, 4 / 3, [0.5, 0.1], 1.25).y, 0));
  assert.ok(near(cropWindow(1.5, 4 / 3, [0.5, 0.5], 1.25).y, 0.1));
  // the window never leaves the picture, and always has the box's shape
  for (const [natural, box, fx, fy, m] of [[1.5, 4 / 3, 0, 0, 1.25], [0.66, 4 / 3, 1, 1, 2], [2.4, 1, 0.3, 0.8, 1.5], [1, 16 / 9, 0.5, 0.2, 1]]) {
    const c = cropWindow(natural, box, [fx, fy], m);
    assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= 1 + 1e-9 && c.y + c.h <= 1 + 1e-9, JSON.stringify(c));
    assert.ok(near((c.w * natural) / c.h, box), `shape of ${JSON.stringify(c)}`);
  }
  assert.ok(near(cropWindow(1.5, 4 / 3, [0.5, 0.5], 0.5).h, 1), 'never smaller than the picture');
});
