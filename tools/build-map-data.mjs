#!/usr/bin/env node
/**
 * Builds the map data used by the world-map widget (src/widgets/world-map.js):
 *
 *   assets/geo/countries.js    names, regions, label points and bounding boxes of every country and territory
 *   assets/geo/places.js       capitals and large cities (name, position, country)
 *   assets/geo/world-110m.js   country shapes for whole-world maps (small; always loaded)
 *   assets/geo/world-50m.js    detailed shapes for regional maps (loaded on demand)
 *   assets/geo/rivers.js       named rivers (loaded on demand)
 *
 * Sources (nothing is fetched by this script unless you pass --fetch):
 *
 *   Country polygons   the npm package `world-atlas` (TopoJSON built from Natural Earth, ISC licence)
 *   Everything else    Natural Earth GeoJSON (public domain) from
 *                      https://github.com/nvkelso/natural-earth-vector/tree/master/geojson
 *
 * To regenerate from scratch, in any scratch folder OUTSIDE the project:
 *
 *   npm pack world-atlas && tar xzf world-atlas-*.tgz          # gives ./package/countries-110m.json and -50m.json
 *   node <project>/tools/build-map-data.mjs --atlas ./package --ne ./ne --fetch
 *
 * `--fetch` downloads the Natural Earth files that are missing from the --ne folder. Without it the
 * script only reads what is already there and tells you which files to download (curl works too).
 * `--out <dir>` writes somewhere other than assets/geo. Nothing is added to package.json.
 *
 * What the script does to the data
 *
 *   - joins Natural Earth's attribute table to the world-atlas shapes (by ISO numeric code, then by name) to get
 *     ISO 3166-1 alpha-2 identifiers, regions and label points; English names come from a table in this file
 *   - keeps Natural Earth's default ("de facto") boundaries. Two shapes that Natural Earth draws separately but that
 *     have no ISO code are attached to the state they are internationally recognised as part of, with the line
 *     between them kept as a dashed line: Somaliland (to Somalia, SO) and Northern Cyprus (to Cyprus, CY).
 *     Kosovo keeps its own shape under the user-assigned code XK. The Siachen Glacier area stays unassigned land.
 *   - marks as "dashed" every boundary that Natural Earth classifies as disputed, indefinite, a line of control or
 *     a claim line (ne_*_admin_0_boundary_lines_land), instead of drawing it as a settled border
 *   - snaps coordinates to a 0.01° grid and stores every arc once (shared borders are not repeated), as
 *     delta-encoded, variable-length integers packed into a string of 64 URL-safe characters
 *
 * The format is read by decodeArcs() in src/widgets/world-map.js and is described there.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, fallback = null) => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : fallback; };
const atlasDir = opt('atlas');
const neDir = opt('ne');
const outDir = resolve(String(opt('out', join(root, 'assets/geo'))));
const doFetch = !!opt('fetch');
if (!atlasDir || atlasDir === true || !neDir || neDir === true) {
  console.error('Usage: node tools/build-map-data.mjs --atlas <world-atlas package folder> --ne <Natural Earth geojson folder> [--fetch] [--out assets/geo]');
  process.exit(2);
}

const NE_BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const NE_FILES = [
  'ne_50m_admin_0_countries', 'ne_110m_admin_0_boundary_lines_land', 'ne_50m_admin_0_boundary_lines_land',
  'ne_110m_lakes', 'ne_50m_lakes', 'ne_50m_rivers_lake_centerlines', 'ne_50m_populated_places_simple',
];

/* ------------------------------------------------------------------ editorial tables */

/** Grid the coordinates are snapped to, in degrees. */
const STEP = 0.01;

/** English short names in common use. Anything not listed here uses Natural Earth's NAME_EN. */
const NAMES = {
  US: 'United States', CN: 'China', FM: 'Micronesia', CD: 'DR Congo', CG: 'Congo', CI: 'Ivory Coast', TL: 'Timor-Leste',
  CV: 'Cape Verde', SZ: 'Eswatini', CZ: 'Czechia', GM: 'Gambia', BS: 'Bahamas', VA: 'Vatican City', MK: 'North Macedonia',
  MO: 'Macau', TR: 'Turkey', ST: 'São Tomé and Príncipe', FK: 'Falkland Islands', AX: 'Åland', GS: 'South Georgia',
  TF: 'French Southern Lands', HM: 'Heard and McDonald Islands', VI: 'US Virgin Islands', WF: 'Wallis and Futuna',
  IO: 'British Indian Ocean Territory', XK: 'Kosovo', TW: 'Taiwan', PS: 'Palestine', RU: 'Russia', KR: 'South Korea',
  KP: 'North Korea', LA: 'Laos', BN: 'Brunei', SY: 'Syria', IR: 'Iran', TZ: 'Tanzania', MD: 'Moldova', VN: 'Vietnam',
  BO: 'Bolivia', VE: 'Venezuela', MM: 'Myanmar', GB: 'United Kingdom', IE: 'Ireland', NL: 'Netherlands', MF: 'Saint Martin',
  SX: 'Sint Maarten', BL: 'Saint Barthélemy', PM: 'Saint Pierre and Miquelon', SH: 'Saint Helena', CW: 'Curaçao',
};

/**
 * Entries that are not sovereign states: dependencies, autonomous territories and areas with no settled status.
 * They have shapes and identifiers (so they can be coloured, labelled and tapped) but are left out of
 * countryIds('africa') and friends unless territories are asked for. Everything else in the table is a country:
 * the 193 members of the United Nations, its two observer states (VA, PS), and Kosovo (XK) and Taiwan (TW).
 */
const TERRITORIES = new Set(('AI AS AW AX BL BM CK CW EH FK FO GG GL GS GU HK HM IM IO JE KY MF MO MP MS NC NF NU PF PM PN PR SH SX TC TF VG VI WF AQ').split(' '));

/** Shapes that Natural Earth draws separately and that are attached to another entry here (see the header). */
const MERGE = { Somaliland: 'SO', 'N. Cyprus': 'CY' };
/** Specks that share another entry's code or have none: left out. */
const DROP = new Set(['Ashmore and Cartier Is.', 'Indian Ocean Ter.']);
/** Land that belongs to no entry: drawn, but it has no identifier. */
const UNASSIGNED = new Set(['Siachen Glacier']);
/** world-atlas names (Natural Earth 4.1) that changed in the current attribute table. */
const RENAMED = { Macedonia: 'North Macedonia', Swaziland: 'eSwatini' };

const SUBREGION_SLUG = {
  'Northern Africa': 'northern-africa', 'Western Africa': 'western-africa', 'Middle Africa': 'middle-africa', 'Eastern Africa': 'eastern-africa', 'Southern Africa': 'southern-africa',
  'Northern Europe': 'northern-europe', 'Western Europe': 'western-europe', 'Eastern Europe': 'eastern-europe', 'Southern Europe': 'southern-europe',
  'Western Asia': 'western-asia', 'Central Asia': 'central-asia', 'Southern Asia': 'southern-asia', 'Eastern Asia': 'eastern-asia', 'South-Eastern Asia': 'south-eastern-asia',
  'Northern America': 'northern-america', 'Central America': 'central-america', Caribbean: 'caribbean', 'South America': 'south-america',
  'Australia and New Zealand': 'australia-new-zealand', Melanesia: 'melanesia', Micronesia: 'micronesia', Polynesia: 'polynesia',
  Antarctica: 'antarctica', 'Seven seas (open ocean)': '',
};
const CONTINENT_OF = (sub) => (/africa$/.test(sub) ? 'africa' : /asia$/.test(sub) ? 'asia' : /europe$/.test(sub) ? 'europe'
  : ['northern-america', 'central-america', 'caribbean'].includes(sub) ? 'north-america' : sub === 'south-america' ? 'south-america'
    : ['australia-new-zealand', 'melanesia', 'micronesia', 'polynesia'].includes(sub) ? 'oceania' : sub === 'antarctica' ? 'antarctica' : '');

/** Place names in their usual English spelling (Natural Earth's spelling → ours). */
const PLACE_NAMES = {
  'København': 'Copenhagen', 'Washington,  D.C.': 'Washington, D.C.', 'Nur-Sultan': 'Astana', Makkah: 'Mecca', Banghazi: 'Benghazi',
  'Ft.  Worth': 'Fort Worth', 'St.  Petersburg': 'Saint Petersburg', 'Ōsaka': 'Osaka', Xian: "Xi'an", Shenyeng: 'Shenyang', Bogota: 'Bogotá',
  'İzmir': 'Izmir', 'Zürich': 'Zurich', Odessa: 'Odesa', Melekeok: 'Ngerulmud', Taizz: 'Taiz', Vishakhapatnam: 'Visakhapatnam',
};
/** Where two places share a name, the larger one keeps it and the other becomes "Name, CC"; these are the exceptions. */
const PREFERRED = { Valencia: 'ES', 'Santa Fe': 'US' };
/** Capitals where Natural Earth lists several, or none. */
const CAPITALS = { ZA: 'Pretoria', CI: 'Yamoussoukro', BJ: 'Porto-Novo', TZ: 'Dodoma', BO: 'La Paz', NL: 'Amsterdam', LK: 'Colombo', MY: 'Kuala Lumpur', NR: 'Yaren', SS: 'Juba', MM: 'Naypyidaw', BI: 'Gitega' };
/** Places missing from the source: name → [longitude, latitude, country, capital]. */
const EXTRA_PLACES = { Yaren: [166.92, -0.55, 'NR', 1], Gitega: [29.92, -3.43, 'BI', 1] };
/** Smaller places that lessons about history and culture keep needing. */
const NOTABLE = new Set(['Venice', 'Aswan', 'Timbuktu', 'Samarkand', 'Cusco', 'Luxor', 'Zanzibar', 'Kozhikode', 'Ramallah', 'Juba', 'Dodoma', 'Porto-Novo', 'The Hague', 'Kyoto', 'Medina', 'Varanasi',
  'Québec', 'Winnipeg', 'Halifax', 'Darwin', 'Lhasa', 'Nuuk', 'Iqaluit', 'Santa Fe']);
/** Places Natural Earth still marks as a capital although the government has moved (their flag in the table is 0). */
const FORMER_CAPITALS = new Set(['Bujumbura', 'Yangon']);
/** Label points that work better on a whole-world map than Natural Earth's (which favours the populated west). */
const LABELS = { RU: [98, 62] };
/** Main bodies that the rule in mainBox() gets wrong: the United States without Hawaii and the Aleutian chain. */
const BOXES = { US: [-168.1, 24.5, -66.9, 71.4] };

/** River names: Natural Earth names each stretch separately; these are folded into the name people look for. */
const RIVER_ALIAS = {
  'Al Furat': 'Euphrates', Firat: 'Euphrates', Dicle: 'Tigris', Donau: 'Danube', Rhein: 'Rhine', Rhin: 'Rhine', Huang: 'Yellow River',
  'Chang Jiang': 'Yangtze', Jinsha: 'Yangtze', Tongtian: 'Yangtze', Tuotuo: 'Yangtze', Amazonas: 'Amazon', Ucayali: 'Amazon', 'Marañón': 'Amazon',
  'Albert Nile': 'Nile', 'Victoria Nile': 'Nile', 'Bahr el Jebel': 'Nile', 'El Bahr el Abyad': 'Nile', 'Damietta Branch': 'Nile', 'Rosetta Branch': 'Nile',
  'El Bahr el Azraq': 'Blue Nile', Abay: 'Blue Nile', Lancang: 'Mekong', Za: 'Mekong', Dihang: 'Brahmaputra', Yarlung: 'Brahmaputra', Maquan: 'Brahmaputra',
  Lualaba: 'Congo', Ertis: 'Irtysh', Ertix: 'Irtysh', 'Heilong Jiang': 'Amur', Dnipro: 'Dnieper', Dnepre: 'Dnieper', Ayeyarwady: 'Irrawaddy', 'Irrawaddy Delta': 'Irrawaddy',
  Tajo: 'Tagus', Tejo: 'Tagus', 'Godävari': 'Godavari', Nu: 'Salween', 'Sénégal': 'Senegal', 'Bénoué': 'Benue', Duero: 'Douro', 'Amu  Darya': 'Amu Darya',
  'São  Francisco': 'São Francisco', Yenisey: 'Yenisei', 'Verkhniy Yenisey': 'Yenisei', 'Shatt al Arab': 'Shatt al-Arab', Chari: 'Chari', 'Mahäna Nadï': 'Mahanadi',
  'Selenge (Selenga)': 'Selenga',
};

/* ------------------------------------------------------------------------- input */

async function loadNE(name) {
  const file = join(String(neDir), `${name}.geojson`);
  if (!existsSync(file)) {
    if (!doFetch) {
      console.error(`Missing ${file}\n  curl -o ${file} ${NE_BASE}${name}.geojson\n(or run again with --fetch)`);
      process.exit(2);
    }
    mkdirSync(String(neDir), { recursive: true });
    const res = await fetch(`${NE_BASE}${name}.geojson`);
    if (!res.ok) throw new Error(`Could not download ${name}: HTTP ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    console.log(`downloaded ${name}.geojson`);
  }
  return JSON.parse(readFileSync(file, 'utf8'));
}
const ne = {};
for (const f of NE_FILES) ne[f] = await loadNE(f);

const loadAtlas = (res) => {
  const file = join(String(atlasDir), `countries-${res}.json`);
  if (!existsSync(file)) { console.error(`Missing ${file} (npm pack world-atlas, then unpack it)`); process.exit(2); }
  return JSON.parse(readFileSync(file, 'utf8'));
};

/* ---------------------------------------------------------------------- geometry */

const q = (v) => Math.round(v / STEP);
const wrapQ = (d) => { const full = Math.round(360 / STEP); let r = d % full; if (r >= full / 2) r -= full; if (r < -full / 2) r += full; return r; };

/** TopoJSON arcs → arrays of [lon, lat] in degrees. */
function topoArcs(topology) {
  const [sx, sy] = topology.transform.scale;
  const [tx, ty] = topology.transform.translate;
  return topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
  });
}

/** Snap an open or closed line to the grid, as [qx, qy] pairs with longitude kept continuous (it may leave ±180°). */
function quantize(points) {
  const out = [];
  let px = null;
  for (const [lon, lat] of points) {
    let x = q(lon);
    const y = q(Math.max(-90, Math.min(90, lat)));
    if (px !== null) x = px + wrapQ(x - px);
    if (out.length && out[out.length - 1][0] === x && out[out.length - 1][1] === y) continue;
    out.push([x, y]);
    px = x;
  }
  return out;
}

const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
function segDist2(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return dist2(px, py, ax + t * dx, ay + t * dy);
}

/** All line strings of a GeoJSON geometry. */
function lineStrings(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'MultiLineString') return geometry.coordinates;
  return [];
}
function polygonsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

/** Area of a ring in square degrees, shrunk towards the poles (good enough to rank polygons by size). */
function ringArea(ring) {
  let a = 0;
  let lat = 0;
  let px = ring[0][0];
  const pts = ring.map(([x, y]) => { px += ((x - px + 540) % 360) - 180; return [px, y]; });
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
    lat += y1;
  }
  return Math.abs(a / 2) * Math.cos((lat / pts.length) * Math.PI / 180);
}
function ringBox(ring, around = null) {
  let px = around == null ? ring[0][0] : around + (((ring[0][0] - around + 540) % 360) - 180);
  let w = Infinity; let s = Infinity; let e = -Infinity; let n = -Infinity;
  for (const [x, y] of ring) {
    px += ((x - px + 540) % 360) - 180;
    if (px < w) w = px; if (px > e) e = px; if (y < s) s = y; if (y > n) n = y;
  }
  return [w, s, e, n];
}

/* -------------------------------------------------------------------- attributes */

const neCountries = ne.ne_50m_admin_0_countries.features.map((f) => f.properties);
const byN3 = new Map();
const byName = new Map();
for (const p of neCountries) {
  if (p.ISO_N3_EH && p.ISO_N3_EH !== '-99' && !byN3.has(p.ISO_N3_EH)) byN3.set(p.ISO_N3_EH, p);
  byName.set(p.NAME, p);
}
function attributesFor(geom) {
  const name = RENAMED[geom.properties.name] || geom.properties.name;
  return byName.get(name) || (geom.id && byN3.get(geom.id)) || null;
}
function idOf(p) {
  if (!p) return null;
  if (p.NAME === 'Kosovo') return 'XK';
  const a2 = p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : p.ISO_A2;
  return /^[A-Z]{2}$/.test(a2) ? a2 : null;
}

/* ---------------------------------------------------------------------- encoding */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
/** A non-negative integer as base-32 digits, low digit first; every character but the last has its 6th bit set. */
function varint(n) {
  let out = '';
  do {
    const digit = n & 31;
    n = Math.floor(n / 32);
    out += ALPHABET[digit | (n > 0 ? 32 : 0)];
  } while (n > 0);
  return out;
}
const zigzag = (n) => (n < 0 ? -2 * n - 1 : 2 * n);
/** arcs: arrays of [qx, qy]. Each arc: point count, first point (absolute), then the steps to each next point. */
function encodeArcs(arcs) {
  let out = '';
  for (const arc of arcs) {
    out += varint(arc.length);
    let px = 0;
    let py = 0;
    arc.forEach(([x, y], i) => {
      out += varint(zigzag(i ? x - px : x)) + varint(zigzag(i ? y - py : y));
      px = x; py = y;
    });
  }
  return out;
}

/* ------------------------------------------------------------------ country layer */

function disputedIndex(res) {
  // Natural Earth's own boundary classification: anything that is not a settled international boundary.
  const segs = [];
  for (const f of ne[`ne_${res}_admin_0_boundary_lines_land`].features) {
    const cls = f.properties.FEATURECLA || f.properties.featurecla || '';
    if (/^International boundary/.test(cls)) continue;
    for (const line of lineStrings(f.geometry)) for (let i = 0; i + 1 < line.length; i++) segs.push([line[i][0], line[i][1], line[i + 1][0], line[i + 1][1]]);
  }
  const tol = res === '110m' ? 0.12 : 0.04;
  return (lon, lat) => {
    for (const [ax, ay, bx, by] of segs) {
      if (lon < Math.min(ax, bx) - tol || lon > Math.max(ax, bx) + tol || lat < Math.min(ay, by) - tol || lat > Math.max(ay, by) + tol) continue;
      if (segDist2(lon, lat, ax, ay, bx, by) < tol * tol) return true;
    }
    return false;
  };
}

function buildCountryLayer(res, table) {
  const topology = loadAtlas(res);
  const srcArcs = topoArcs(topology);
  const isDisputed = disputedIndex(res);

  // 1. who owns which polygons
  const entries = new Map();       // id -> [polygon, …]; a polygon is a list of rings; a ring is a list of arc references
  const UNOWNED = '_';
  const report = { dropped: [], merged: [], unmatched: [] };
  for (const geom of topology.objects.countries.geometries) {
    const name = geom.properties.name;
    if (DROP.has(name)) { report.dropped.push(name); continue; }
    let id;
    if (MERGE[name]) { id = MERGE[name]; report.merged.push(`${name} → ${id}`); }
    else if (UNASSIGNED.has(name)) id = UNOWNED;
    else {
      id = idOf(attributesFor(geom));
      if (!id) { report.unmatched.push(name); continue; }
    }
    const polys = geom.type === 'Polygon' ? [geom.arcs] : geom.type === 'MultiPolygon' ? geom.arcs : [];
    if (!entries.has(id)) entries.set(id, []);
    entries.get(id).push(...polys);
  }

  // 2. classify every arc that is still in use: coast (one owner, used once), border (two owners), dashed
  const users = new Map();
  for (const [id, polys] of entries) for (const poly of polys) for (const ring of poly) for (const ref of ring) {
    const a = ref < 0 ? ~ref : ref;
    if (!users.has(a)) users.set(a, []);
    users.get(a).push(id);
  }
  // Each source arc becomes one or more output arcs (a border is cut where its status changes).
  const COAST = 0; const BORDER = 1; const DASHED = 2; const LAKE = 3;
  const pieces = new Map();        // source arc -> [{ cls, pts }]
  for (const [a, owners] of users) {
    const pts = quantize(srcArcs[a]);
    if (pts.length < 2) { pieces.set(a, [{ cls: COAST, pts }]); continue; }
    if (owners.length === 1) { pieces.set(a, [{ cls: COAST, pts }]); continue; }
    if (owners[0] === owners[1] || owners.includes(UNOWNED)) { pieces.set(a, [{ cls: DASHED, pts }]); continue; }
    const flags = [];
    for (let i = 0; i + 1 < pts.length; i++) flags.push(isDisputed(((pts[i][0] + pts[i + 1][0]) / 2) * STEP, ((pts[i][1] + pts[i + 1][1]) / 2) * STEP));
    // a single stray segment is noise from matching two editions of the data, not a change of status
    for (let i = 1; i + 1 < flags.length; i++) if (flags[i] !== flags[i - 1] && flags[i] !== flags[i + 1]) flags[i] = flags[i - 1];
    const out = [];
    let start = 0;
    for (let i = 1; i <= flags.length; i++) {
      if (i === flags.length || flags[i] !== flags[start]) {
        out.push({ cls: flags[start] ? DASHED : BORDER, pts: pts.slice(start, i + 1) });
        start = i;
      }
    }
    pieces.set(a, out);
  }

  // 3. extra shapes that world-atlas (Natural Earth 4.1) does not have: taken from the current Natural Earth file
  const extra = [];                // { id, polys: [[ringPts]] }
  if (res === '50m') {
    for (const f of ne.ne_50m_admin_0_countries.features) {
      const id = idOf(f.properties);
      if (!id || entries.has(id) || !table.has(id)) continue;
      extra.push({ id, polys: polygonsOf(f.geometry).map((poly) => poly.map((ring) => quantize(ring.slice(0, -1)))) });
    }
  }

  // 4. lakes
  const lakeMin = res === '110m' ? 0 : 0.12;   // square degrees; the detailed layer keeps lakes you can see on a regional map
  const lakes = [];
  for (const f of ne[`ne_${res}_lakes`].features) {
    for (const poly of polygonsOf(f.geometry)) {
      if (ringArea(poly[0]) < lakeMin) continue;
      const rings = poly.map((ring) => quantize(ring.slice(0, -1))).filter((r) => r.length >= 3);
      if (rings.length) lakes.push(rings);
    }
  }

  // 5. number the output arcs class by class, so that the classes need no table of their own
  const outArcs = [[], [], [], []];
  const place = new Map();         // piece object -> [cls, index within class]
  for (const list of pieces.values()) for (const piece of list) { place.set(piece, [piece.cls, outArcs[piece.cls].length]); outArcs[piece.cls].push(piece.pts); }
  const extraRefs = extra.map(({ id, polys }) => ({ id, polys: polys.map((poly) => poly.filter((r) => r.length >= 3).map((ring) => { outArcs[COAST].push(ring.concat([ring[0]])); return [[COAST, outArcs[COAST].length - 1]]; })).filter((p) => p.length) }));
  const lakeRefs = lakes.map((rings) => rings.map((ring) => { outArcs[LAKE].push(ring.concat([ring[0]])); return outArcs[LAKE].length - 1; }));
  const base = [0, outArcs[0].length, outArcs[0].length + outArcs[1].length, outArcs[0].length + outArcs[1].length + outArcs[2].length];
  const number = ([cls, i]) => base[cls] + i;

  const distinct = (ring) => {
    // how many different points does this ring visit?
    const seen = new Set();
    for (const ref of ring) for (const piece of pieces.get(ref < 0 ? ~ref : ref)) for (const [x, y] of piece.pts) seen.add(`${x},${y}`);
    return seen.size;
  };
  const shapes = {};
  const lost = [];
  for (const [id, polys] of entries) {
    const outPolys = [];
    for (const poly of polys) {
      const rings = [];
      poly.forEach((ring, ri) => {
        if (distinct(ring) < 3) return;          // collapsed to a line or a point on the grid
        const refs = [];
        for (const ref of ring) {
          const list = pieces.get(ref < 0 ? ~ref : ref);
          if (ref >= 0) for (const piece of list) refs.push(number(place.get(piece)));
          else for (let i = list.length - 1; i >= 0; i--) refs.push(~number(place.get(list[i])));
        }
        if (ri === 0 || rings.length) rings.push(refs);
      });
      if (rings.length) outPolys.push(rings);
    }
    if (outPolys.length) shapes[id] = outPolys; else lost.push(id);
  }
  for (const { id, polys } of extraRefs) if (polys.length) shapes[id] = polys.map((poly) => poly.map((ring) => ring.map(number)));

  const arcs = [].concat(...outArcs);
  const sorted = {};
  for (const id of Object.keys(shapes).sort()) sorted[id] = shapes[id];
  const layer = {
    res, step: STEP,
    n: outArcs.map((list) => list.length),      // how many arcs are coast, border, dashed line, lake shore (in that order)
    arcs: encodeArcs(arcs),
    shapes: sorted,
    lakes: lakeRefs.map((rings) => rings.map((i) => base[LAKE] + i)),
  };
  const points = arcs.reduce((sum, a) => sum + a.length, 0);
  return { layer, report, lost, points, topology, srcArcs, entries };
}

/* ------------------------------------------------------------------------ tables */

/** The box around the main body of a country (its largest polygon and whatever lies close to it). */
function mainBox(polys) {
  const outer = polys.map((poly) => poly[0]).filter((r) => r && r.length >= 3);
  if (!outer.length) return null;
  let best = 0;
  const areas = outer.map(ringArea);
  areas.forEach((a, i) => { if (a > areas[best]) best = i; });
  const main = ringBox(outer[best]);
  const mid = (main[0] + main[2]) / 2;
  const reach = Math.min(8, 0.25 * Math.hypot(main[2] - main[0], main[3] - main[1])) + 0.4;   // islands this close belong to the main body
  const box = main.slice();
  const boxes = outer.map((ring) => ringBox(ring, mid));
  const taken = new Set([best]);
  const grow = (b) => { box[0] = Math.min(box[0], b[0]); box[1] = Math.min(box[1], b[1]); box[2] = Math.max(box[2], b[2]); box[3] = Math.max(box[3], b[3]); };
  // a second body of comparable size counts wherever it is (Malaysia's two halves)
  boxes.forEach((b, i) => { if (i !== best && areas[i] >= 0.25 * areas[best]) { taken.add(i); grow(b); } });
  for (let grew = true; grew;) {
    grew = false;
    boxes.forEach((b, i) => {
      if (taken.has(i)) return;
      const gapX = Math.max(0, b[0] - box[2], box[0] - b[2]);
      const gapY = Math.max(0, b[1] - box[3], box[1] - b[3]);
      if (Math.hypot(gapX, gapY) > reach) return;
      taken.add(i);
      grew = true;
      grow(b);
    });
  }
  // keep west within ±180; east may run past 180 for countries that straddle the date line
  while (box[0] > 180) { box[0] -= 360; box[2] -= 360; }
  while (box[0] < -180) { box[0] += 360; box[2] += 360; }
  return box.map((v) => Math.round(v * 10) / 10);
}

function buildTables() {
  const table = new Map();
  const features = ne.ne_50m_admin_0_countries.features;
  for (const f of features) {
    const p = f.properties;
    if (DROP.has(p.NAME) || MERGE[p.NAME] || UNASSIGNED.has(p.NAME)) continue;
    const id = idOf(p);
    if (!id) { console.warn(`  no identifier for ${p.NAME}; left out`); continue; }
    if (table.has(id)) continue;
    const sub = SUBREGION_SLUG[p.SUBREGION];
    if (sub === undefined) throw new Error(`Unknown subregion "${p.SUBREGION}" for ${p.NAME}`);
    table.set(id, {
      id, name: NAMES[id] || p.NAME_EN || p.NAME_LONG || p.NAME,
      continent: CONTINENT_OF(sub), subregion: sub, territory: TERRITORIES.has(id),
      label: LABELS[id] || [Math.round(p.LABEL_X * 10) / 10, Math.round(p.LABEL_Y * 10) / 10],
      box: BOXES[id] || mainBox(polygonsOf(f.geometry)),
      // where exactly it is and how big (the radius, in km, of a circle of the same area as its largest piece):
      // written out only for entries that are a mere ring on whole-world maps, so that countryAt() can tell
      // Rome from the Vatican
      exact: [Math.round(p.LABEL_X * 1000) / 1000, Math.round(p.LABEL_Y * 1000) / 1000,
        Math.round(Math.sqrt((Math.max(0, ...polygonsOf(f.geometry).map((poly) => ringArea(poly[0]))) * 111.2 * 111.2) / Math.PI) * 10) / 10],
      a3: p.ADM0_A3,
      capital: null,
    });
  }
  // The label points of the two merged pairs stay with the recognised state.
  return table;
}

function buildPlaces(table) {
  const byA3 = new Map(Array.from(table.values()).map((c) => [c.a3, c.id]));
  const rows = [];
  for (const f of ne.ne_50m_populated_places_simple.features) {
    const p = f.properties;
    const capital = p.adm0cap === 1 || /^Admin-0 capital$/.test(p.featurecla || '');
    const keep = capital || p.worldcity === 1 || p.megacity === 1 || p.pop_max >= 1000000 || p.scalerank <= 2 || NOTABLE.has(p.name);
    if (!keep) continue;
    let country = /^[A-Z]{2}$/.test(p.iso_a2 || '') && table.has(p.iso_a2) ? p.iso_a2 : byA3.get(p.adm0_a3) || byA3.get(p.sov_a3) || '';
    if (p.adm0name === 'Somaliland') country = 'SO';
    if (p.adm0name === 'Northern Cyprus' || p.adm0name === 'N. Cyprus') country = 'CY';
    rows.push({ name: PLACE_NAMES[p.name] || p.name, lon: Math.round(p.longitude * 100) / 100, lat: Math.round(p.latitude * 100) / 100, country, capital, pop: p.pop_max || 0, cls: p.featurecla || '' });
  }
  // one entry per name: the largest place keeps the plain name, the others become "Name, CC"
  const first = (r) => (PREFERRED[r.name] === r.country ? 1 : 0);
  rows.sort((a, b) => (first(b) - first(a)) || (b.capital - a.capital) || (b.pop - a.pop));
  // (names are looked up without accents or capitals, so "San Jose" and "San José" are the same name)
  const fold = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const places = {};
  const used = new Set();
  for (const r of rows) {
    let key = r.name;
    if (used.has(fold(key))) key = `${r.name}, ${r.country}`;
    if (used.has(fold(key))) continue;
    used.add(fold(key));
    r.key = key;
    places[key] = [r.lon, r.lat, r.country, r.capital && !FORMER_CAPITALS.has(r.name) ? 1 : 0];
  }
  Object.assign(places, EXTRA_PLACES);
  // capitals: the largest place Natural Earth marks as a capital, unless the table above says otherwise
  for (const r of rows) {
    if (!r.capital || !table.has(r.country)) continue;
    const c = table.get(r.country);
    if (!c.capital && r.key) c.capital = r.key;
  }
  for (const [id, name] of Object.entries(CAPITALS)) {
    if (!places[name]) throw new Error(`Capital ${name} (${id}) is not in the places table`);
    table.get(id).capital = name;
    places[name][3] = 1;
  }
  const sorted = {};
  for (const key of Object.keys(places).sort((a, b) => a.localeCompare(b, 'en'))) sorted[key] = places[key];
  return sorted;
}

function buildRivers() {
  const groups = new Map();
  for (const f of ne.ne_50m_rivers_lake_centerlines.features) {
    const p = f.properties;
    const raw = (p.name_en || p.name || '').trim();
    if (!raw || raw === '?') continue;
    const name = RIVER_ALIAS[p.name] || RIVER_ALIAS[raw] || raw;
    if (!groups.has(name)) groups.set(name, { name, rank: 99, lines: [] });
    const g = groups.get(name);
    g.rank = Math.min(g.rank, p.scalerank);
    for (const line of lineStrings(f.geometry)) { const pts = quantize(line); if (pts.length >= 2) g.lines.push(pts); }
  }
  const list = Array.from(groups.values()).sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'en'));
  const arcs = [];
  const rivers = list.map((g) => [g.name, g.rank, g.lines.map((pts) => { arcs.push(pts); return arcs.length - 1; })]);
  return { layer: { step: STEP, arcs: encodeArcs(arcs), rivers }, points: arcs.reduce((s, a) => s + a.length, 0), count: rivers.length };
}

/* ------------------------------------------------------------------------ output */

const banner = (what) => `/**\n * GENERATED by tools/build-map-data.mjs. Do not edit by hand.\n * ${what}\n * Data: Natural Earth (public domain, naturalearthdata.com); country polygons via the world-atlas package (ISC).\n */\n`;
function write(name, text) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, name), text);
  console.log(`  ${name.padEnd(16)} ${(Buffer.byteLength(text) / 1024).toFixed(1).padStart(7)} KB`);
}

const table = buildTables();
const places = buildPlaces(table);
const low = buildCountryLayer('110m', table);
const high = buildCountryLayer('50m', table);
const rivers = buildRivers();

for (const [label, built] of [['110m', low], ['50m', high]]) {
  console.log(`${label}: ${Object.keys(built.layer.shapes).length} shapes, ${built.layer.n.join(' + ')} arcs (coast + border + dashed + lake), ${built.points} points`);
  if (built.report.unmatched.length) console.log(`  no attribute match (left out): ${built.report.unmatched.join(', ')}`);
  if (built.lost.length) console.log(`  too small for the grid (no shape): ${built.lost.join(', ')}`);
  const missing = Array.from(table.keys()).filter((id) => !built.layer.shapes[id]);
  console.log(`  ${missing.length} entries have no shape at this resolution and are drawn as markers: ${missing.join(' ')}`);
  for (const id of Object.keys(built.layer.shapes)) if (id !== '_' && !table.has(id)) throw new Error(`Shape ${id} has no row in the table`);
}
console.log(`table: ${table.size} entries, ${Array.from(table.values()).filter((c) => !c.territory).length} countries, ${Object.keys(places).length} places, ${rivers.count} rivers (${rivers.points} points)`);

const regionIds = (key, value) => Array.from(table.values()).filter((c) => c[key] === value).map((c) => c.id).sort().join(' ');
const continents = ['africa', 'antarctica', 'asia', 'europe', 'north-america', 'oceania', 'south-america'];
const subregions = Array.from(new Set(Object.values(SUBREGION_SLUG))).filter((s) => s && s !== 'antarctica').sort();

let countriesJs = banner('Every country and territory the map knows: identifier (ISO 3166-1 alpha-2, plus XK for Kosovo) → facts.');
countriesJs += '\n/**\n * id: [name, continent, subregion, territory (1) or country (0), label longitude, label latitude,\n *      [west, south, east, north] of the main body (east runs past 180 across the date line), capital]\n * Entries with no shape at 1:110m have a ninth item: [exact longitude, exact latitude, radius in km of a circle\n * as large as their main island or territory].\n */\n';
countriesJs += 'export const COUNTRIES = {\n';
for (const c of Array.from(table.values()).sort((a, b) => a.id.localeCompare(b.id))) {
  const row = [c.name, c.continent, c.subregion, c.territory ? 1 : 0, c.label[0], c.label[1], c.box, c.capital || ''];
  if (!low.layer.shapes[c.id]) row.push(c.exact);
  countriesJs += `  ${c.id}: ${JSON.stringify(row)},\n`;
}
countriesJs += '};\n\n/** Continents and United Nations subregions → identifiers (countries and territories), space-separated. */\nexport const REGIONS = {\n';
for (const name of continents) countriesJs += `  '${name}': '${regionIds('continent', name)}',\n`;
for (const name of subregions) countriesJs += `  '${name}': '${regionIds('subregion', name)}',\n`;
countriesJs += '};\n';

console.log(`written to ${outDir}:`);
write('countries.js', countriesJs);
write('places.js', `${banner('Capitals and large cities: name → [longitude, latitude, country, capital (1) or not (0)].')}\nexport const PLACES = ${JSON.stringify(places).replace(/\],"/g, '],\n  "').replace(/^\{/, '{\n  ').replace(/\}$/, ',\n}')};\n`);
write('world-110m.js', `${banner('Country shapes at 1:110 million, for whole-world maps.')}\nexport default ${JSON.stringify(low.layer)};\n`);
write('world-50m.js', `${banner('Country shapes at 1:50 million, for regional maps. Loaded on demand.')}\nexport default ${JSON.stringify(high.layer)};\n`);
write('rivers.js', `${banner('Named rivers at 1:50 million: [name, rank (1 = largest), arcs]. Loaded on demand.')}\nexport default ${JSON.stringify(rivers.layer)};\n`);
