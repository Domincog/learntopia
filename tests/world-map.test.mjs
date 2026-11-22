/**
 * world-map: the parts that need no browser. The decoder for the packed map data, the projections,
 * distances, "which country is this point in", and the tables of identifiers that lesson authors rely on.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  decodeArcs, makeProjection, PROJECTIONS, VIEWS, distanceKm, greatCircle, destination, pointInPolygon,
  countryName, countryNameThe, countryInfo, countryIds, countryAt, inMainBody, regionNames, place, markerOnly, loadDetail, examples,
} from '../src/widgets/world-map.js';
import { COUNTRIES, REGIONS } from '../assets/geo/countries.js';
import { PLACES } from '../assets/geo/places.js';
import WORLD_110M from '../assets/geo/world-110m.js';

const file = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what || 'value'}: ${a} is not within ${tol} of ${b}`);

/* ---------------------------------------------------------------- decoder */

// An encoder written from the description of the format (not shared with the build script), to test the decoder against.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function varint(n) {
  let out = '';
  do { const digit = n % 32; n = Math.floor(n / 32); out += ALPHABET[digit + (n > 0 ? 32 : 0)]; } while (n > 0);
  return out;
}
const zigzag = (n) => (n < 0 ? -2 * n - 1 : 2 * n);
function encode(arcs, step) {
  let out = '';
  for (const arc of arcs) {
    out += varint(arc.length);
    let px = 0; let py = 0;
    arc.forEach(([lon, lat], i) => {
      const x = Math.round(lon / step); const y = Math.round(lat / step);
      out += varint(zigzag(i ? x - px : x)) + varint(zigzag(i ? y - py : y));
      px = x; py = y;
    });
  }
  return out;
}

test('decodeArcs reads back what an independent encoder wrote', () => {
  const arcs = [
    [[0, 0], [0.01, -0.01], [12.34, 56.78], [-179.99, -89.99]],
    [[180, 90], [181.5, 89]],                      // longitude may run on past 180 inside an arc
    [[-73.98, 40.75]],
    [[100, 0], [100, 0.31], [100.32, 0.31], [100.32, 0], [100, 0]],
  ];
  const decoded = decodeArcs(encode(arcs, 0.01), 0.01);
  assert.equal(decoded.length, arcs.length);
  arcs.forEach((arc, i) => {
    assert.equal(decoded[i].length, arc.length * 2);
    arc.forEach(([lon, lat], k) => { near(decoded[i][2 * k], lon, 1e-9, 'lon'); near(decoded[i][2 * k + 1], lat, 1e-9, 'lat'); });
  });
});

test('decodeArcs: single characters, long numbers and other grid sizes', () => {
  assert.deepEqual(Array.from(decodeArcs('BCC', 1)[0]), [1, 1]);          // one point: x = zigzag 2 = 1, y = 1
  assert.deepEqual(Array.from(decodeArcs('BBD', 0.5)[0]), [-0.5, -1]);    // zigzag 1 = -1, zigzag 3 = -2
  const big = decodeArcs(encode([[[123456.5, -98765.5]]], 0.5), 0.5)[0];
  assert.deepEqual(Array.from(big), [123456.5, -98765.5]);
  assert.deepEqual(decodeArcs('', 0.01), []);
});

test('decodeArcs rejects damaged data instead of drawing nonsense', () => {
  assert.throws(() => decodeArcs('B C', 0.01), /damaged/);
  assert.throws(() => decodeArcs('B*C', 0.01), /damaged/);
});

test('the 1:110m layer is well formed', () => {
  const arcs = decodeArcs(WORLD_110M.arcs, WORLD_110M.step);
  assert.equal(arcs.length, WORLD_110M.n.reduce((a, b) => a + b, 0), 'the arc classes add up to the number of arcs');
  for (const arc of arcs) {
    for (let i = 0; i < arc.length; i += 2) {
      assert.ok(arc[i] >= -360 && arc[i] <= 360, `longitude ${arc[i]}`);
      assert.ok(arc[i + 1] >= -90 && arc[i + 1] <= 90, `latitude ${arc[i + 1]}`);
    }
  }
  // every ring is made of arcs that exist and that join end to end (give or take whole turns of the globe)
  const end = (ref, last) => { const a = arcs[ref < 0 ? ~ref : ref]; const k = (ref < 0) === last ? 0 : a.length - 2; return [a[k], a[k + 1]]; };
  let rings = 0;
  for (const [id, polygons] of Object.entries(WORLD_110M.shapes)) {
    for (const polygon of polygons) for (const ring of polygon) {
      rings++;
      ring.forEach((ref, i) => {
        assert.ok((ref < 0 ? ~ref : ref) < arcs.length, `${id}: arc ${ref} exists`);
        const [x1, y1] = end(ref, true);
        const [x2, y2] = end(ring[(i + 1) % ring.length], false);
        near(((x1 - x2) % 360 + 540) % 360 - 180, 0, 1e-6, `${id}: arcs join (longitude)`);
        near(y1, y2, 1e-6, `${id}: arcs join (latitude)`);
      });
    }
  }
  assert.ok(rings > 250, `${rings} rings`);
});

test('the default layer stays small', () => {
  const kb = ['assets/geo/world-110m.js', 'assets/geo/countries.js', 'assets/geo/places.js'].reduce((sum, f) => sum + statSync(file(f)).size, 0) / 1024;
  assert.ok(kb < 150, `default map data is ${kb.toFixed(1)} KB (limit 150)`);
  // the heavy layers must only ever be loaded on demand
  const src = readFileSync(file('src/widgets/world-map.js'), 'utf8');
  for (const heavy of ['world-50m.js', 'rivers.js']) {
    assert.ok(!new RegExp(`^import[^\\n]*${heavy.replace('.', '\\.')}`, 'm').test(src), `${heavy} is not imported statically`);
    assert.ok(src.includes(`import('../../assets/geo/${heavy}')`), `${heavy} is imported dynamically`);
  }
});

/* ------------------------------------------------------------ projections */

const GRID = [];
for (let lon = -175; lon <= 175; lon += 25) for (let lat = -80; lat <= 80; lat += 20) GRID.push([lon, lat]);

test('every projection inverts its own output', () => {
  assert.deepEqual(PROJECTIONS, ['equal-earth', 'natural-earth', 'mercator', 'equirectangular', 'gall-peters', 'orthographic', 'azimuthal-equal-area', 'azimuthal-equidistant']);
  for (const name of PROJECTIONS) {
    for (const center of [[0, 0], [20, 35], [-100, -40], [150, 60]]) {
      const p = makeProjection(name, { center });
      let seen = 0;
      for (const [lon, lat] of GRID) {
        const xy = p.forward([lon, lat]);
        if (!xy) continue;                         // the far side of a globe
        if (name !== 'orthographic' && name !== 'equal-earth' && name !== 'natural-earth' && name !== 'mercator' && name !== 'equirectangular' && name !== 'gall-peters') {
          // azimuthal maps squeeze the far side of the world into a thin rim: skip the last few degrees
          if (distanceKm([lon, lat], center) > 19000) continue;
        }
        const back = p.inverse(xy);
        assert.ok(back, `${name} @${center}: inverse of ${lon},${lat}`);
        near(((back[0] - lon) % 360 + 540) % 360 - 180, 0, 1e-6, `${name} @${center}: longitude of ${lon},${lat}`);
        near(back[1], lat, 1e-6, `${name} @${center}: latitude of ${lon},${lat}`);
        seen++;
      }
      assert.ok(seen > 30, `${name} @${center}: ${seen} points visible`);
    }
  }
});

test('projections: known values', () => {
  const ee = makeProjection('equal-earth');
  assert.deepEqual(ee.forward([0, 0]), [0, 0]);
  near(ee.forward([179.999999, 0])[0], 2.70663, 1e-4, 'Equal Earth: half-width at the equator');
  near(ee.forward([0, 90])[1], 1.31737, 1e-4, 'Equal Earth: height of the pole');
  near(makeProjection('mercator').forward([0, 45])[1], Math.log(Math.tan(3 * Math.PI / 8)), 1e-12, 'Mercator at 45°');
  near(makeProjection('natural-earth').forward([90, 0])[0], 0.8707 * Math.PI / 2, 1e-9, 'Natural Earth: quarter-width');
  assert.deepEqual(makeProjection('equirectangular').forward([90, 45]), [Math.PI / 2, Math.PI / 4]);
  // a globe: the centre is in the middle, the far side cannot be seen, the limb is at radius 1
  const globe = makeProjection('orthographic', { center: [10, 50] });
  const mid = globe.forward([10, 50]);
  near(mid[0], 0, 1e-12); near(mid[1], 0, 1e-12);
  assert.equal(globe.forward([-170, -50]), null);
  assert.equal(globe.forward([10, -50]), null);
  near(Math.hypot(...globe.forward([99.99, 0])), 1, 1e-6, 'a point 90° away is on the limb');
  assert.equal(globe.inverse([0.9, 0.9]), null, 'off the edge of the globe');
  // a different centre moves the map: the central meridian goes to x = 0
  near(makeProjection('equal-earth', { center: [150, 0] }).forward([150, 20])[0], 0, 1e-12);
  // distances from the centre of an equidistant map are true
  const eq = makeProjection('azimuthal-equidistant', { center: [0, 90] });
  near(Math.hypot(...eq.forward([77, 0])), Math.PI / 2, 1e-9, 'pole to equator');
  assert.throws(() => makeProjection('peirce-quincuncial'), /unknown projection/);
});

test('the equal-area projections keep areas, and Mercator does not', () => {
  // the area on the map of a small box of the same true size at different latitudes
  const mapArea = (p, lon, lat) => {
    const d = 0.5;
    const a = p.forward([lon - d, lat - d]); const b = p.forward([lon + d, lat - d]);
    const c = p.forward([lon + d, lat + d]); const e = p.forward([lon - d, lat + d]);
    const shoelace = Math.abs((a[0] * b[1] - b[0] * a[1]) + (b[0] * c[1] - c[0] * b[1]) + (c[0] * e[1] - e[0] * c[1]) + (e[0] * a[1] - a[0] * e[1])) / 2;
    return shoelace / Math.cos(lat * Math.PI / 180);      // a box of 1° × 1° shrinks with cos(latitude) on the globe
  };
  for (const name of ['equal-earth', 'gall-peters', 'azimuthal-equal-area']) {
    const p = makeProjection(name);
    const at0 = mapArea(p, 10, 0);
    for (const [lon, lat] of [[10, 30], [60, 60], [-120, -45], [100, 75]]) near(mapArea(p, lon, lat) / at0, 1, 0.01, `${name} at ${lon},${lat}`);
  }
  const m = makeProjection('mercator');
  assert.ok(mapArea(m, 0, 72) / mapArea(m, 0, 0) > 9, 'Mercator blows Greenland up about tenfold');
});

/* ---------------------------------------------------- distance and shapes */

test('distanceKm', () => {
  assert.equal(distanceKm([10, 20], [10, 20]), 0);
  near(distanceKm([-0.13, 51.51], [-74.01, 40.71]), 5570, 12, 'London – New York');
  near(distanceKm([0, 90], [0, -90]), 20015, 1, 'pole to pole');
  near(distanceKm([0, 0], [0, 1]), 111.195, 0.01, 'one degree of latitude');
  near(distanceKm([179, 0], [-179, 0]), 222.39, 0.01, 'across the date line, not round the world');
  near(distanceKm([31.25, 30.05], [151.2, -33.87]), distanceKm([151.2, -33.87], [31.25, 30.05]), 1e-9, 'symmetric');
  assert.ok(Number.isNaN(distanceKm(null, [0, 0])));
});

test('greatCircle and destination', () => {
  const half = greatCircle([0, 0], [90, 0], 45);
  assert.equal(half.length, 3);
  near(half[1][0], 45, 1e-9); near(half[1][1], 0, 1e-9);
  const path = greatCircle([-0.13, 51.51], [139.69, 35.69], 2);
  assert.deepEqual(path[0], [-0.13, 51.51]);
  assert.deepEqual(path[path.length - 1], [139.69, 35.69]);
  assert.ok(Math.max(...path.map((p) => p[1])) > 65, 'London – Tokyo passes over the Arctic');
  for (let i = 1; i < path.length; i++) assert.ok(distanceKm(path[i - 1], path[i]) < 240, 'steps of about 2°');
  near(path.reduce((sum, p, i) => sum + (i ? distanceKm(path[i - 1], p) : 0), 0), distanceKm(path[0], path[path.length - 1]), 1, 'the pieces add up to the whole');
  const north = destination([10, 0], 111.195, 0);
  near(north[0], 10, 1e-9); near(north[1], 1, 1e-4);
  near(distanceKm([30, 50], destination([30, 50], 800, 123)), 800, 1e-6, 'destination is that far away');
});

test('pointInPolygon', () => {
  const square = [[0, 0], [10, 0], [10, 10], [0, 10]];
  assert.equal(pointInPolygon([5, 5], square), true);
  assert.equal(pointInPolygon([15, 5], square), false);
  const dateLine = [[170, -10], [-170, -10], [-170, 10], [170, 10]];       // 20° wide, across 180°
  assert.equal(pointInPolygon([179, 0], dateLine), true);
  assert.equal(pointInPolygon([-179, 0], dateLine), true);
  assert.equal(pointInPolygon([0, 0], dateLine), false);
});

test('countryAt finds the right country', async () => {
  const expectLow = {
    Cairo: 'EG', Paris: 'FR', 'Brasília': 'BR', Canberra: 'AU', Moscow: 'RU', Beijing: 'CN', 'New Delhi': 'IN', Nairobi: 'KE', Ottawa: 'CA', 'Mexico City': 'MX', Tehran: 'IR', Kinshasa: 'CD',
  };
  for (const [city, id] of Object.entries(expectLow)) assert.equal(countryAt(city), id, city);
  assert.equal(countryAt([0, 0]), null, 'the Gulf of Guinea');
  assert.equal(countryAt([-140, 0]), null, 'the Pacific');
  assert.equal(countryAt([40, -85]), 'AQ', 'Antarctica, whose outline runs right round the pole');
  assert.equal(countryAt([0, -89.9]), 'AQ', 'the South Pole');
  assert.equal(countryAt([175, 67]), 'RU', 'Russia west of the date line');
  assert.equal(countryAt([-175, 67]), 'RU', 'Russia east of the date line');
  assert.equal(countryAt([-150, 65]), 'US', 'Alaska');
  assert.equal(countryAt([-53, 4]), 'FR', 'French Guiana is part of France in the data');
  assert.equal(countryAt([46, 9.5]), 'SO', 'Somaliland is drawn with Somalia');
  assert.equal(countryAt([33.6, 35.3]), 'CY', 'Northern Cyprus is drawn with Cyprus');
  assert.equal(countryAt([21, 42.6]), 'XK', 'Kosovo');
  assert.equal(countryAt([121, 24]), 'TW', 'Taiwan');
  assert.equal(countryAt([103.82, 1.35]), 'SG', 'Singapore is only a marker at this resolution: a point on the marker counts');
  // … but a real shape wins over a ring that is merely close by
  assert.equal(countryAt([12.48, 41.9], 'low'), 'IT', 'Rome is in Italy, 3 km from the Vatican\'s ring');
  assert.equal(countryAt('Rome'), 'IT');
  assert.equal(countryAt([12.453, 41.903]), 'VA', 'a point in the Vatican itself');
  assert.equal(countryAt('Vatican City'), 'VA');
  assert.equal(countryAt('Singapore'), 'SG');
  assert.equal(countryAt([103.76, 1.46]), 'MY', 'Johor Bahru, across the strait from Singapore');
  assert.equal(countryAt('Kuala Lumpur'), 'MY');
  assert.equal(countryAt([7.26, 43.7]), 'FR', 'Nice, 12 km from Monaco');
  assert.equal(countryAt('Monaco'), 'MC');
  assert.equal(countryAt([12.57, 44.06]), 'IT', 'Rimini, beside San Marino');
  assert.equal(countryAt('San Marino'), 'SM');
  assert.equal(countryAt('Vaduz'), 'LI');
  assert.equal(countryAt('Hong Kong'), 'HK', 'a city of the table is in its own country');
  assert.equal(countryAt('Shenzhen'), 'CN');
  assert.equal(countryAt('Valletta'), 'MT', 'an island state with no shape: still found at sea');
  assert.equal(countryAt('Manama'), 'BH');
  // every city of the table that belongs to a ring country resolves to that country on the coarse layer
  for (const [name, row] of Object.entries(PLACES)) if (COUNTRIES[row[2]] && COUNTRIES[row[2]][8]) assert.equal(countryAt([row[0], row[1]]), row[2], name);
  assert.equal(countryAt([-200, 30]), countryAt([160, 30]), 'longitudes are folded into range');
  assert.equal(countryAt('Atlantis'), null);

  // the detailed layer: every capital is in its own country (apart from capitals on islets the 1:50m coast leaves out)
  await loadDetail();
  const wrong = [];
  let checked = 0;
  for (const [id, row] of Object.entries(COUNTRIES)) {
    if (!row[7]) continue;
    checked++;
    const got = countryAt(row[7], 'high', 25);      // harbour cities can be just off the simplified coast
    if (got !== id) wrong.push(`${row[7]} (${id}): ${got}`);
  }
  assert.ok(checked >= 195, `${checked} capitals checked`);
  // Jerusalem lies on the armistice line; the Vatican is smaller than the grid the shapes are drawn on
  assert.deepEqual(wrong, ['Jerusalem (IL): PS', 'Vatican City (VA): IT'], 'capitals placed in the wrong country at 1:50m');
  assert.equal(countryAt('Lisbon', 'high'), null, 'exactly: Lisbon\'s position is in the Tagus estuary');
  assert.equal(countryAt('Lisbon', 'high', 25), 'PT', 'with 25 km of slack it is in Portugal');
  assert.equal(countryAt([-30, 40], 'high', 25), null, 'mid-ocean stays mid-ocean');
  assert.equal(countryAt([14.42, 35.9], 'high'), 'MT', 'Malta has a shape at 1:50m');
  assert.equal(countryAt([6.13, 49.61], 'high'), 'LU');
});

test('disputed areas are drawn as Natural Earth draws them (the cases listed in docs/MAPS.md)', async () => {
  await loadDetail();
  const cases = [
    [[-12.6, 24], 'EH', 'Western Sahara east of the berm has its own shape'],
    [[-15.5, 23.5], 'MA', 'the part of Western Sahara that Morocco controls is drawn with Morocco'],
    [[34.5, 45.3], 'RU', 'Crimea is drawn with Russia (Natural Earth 4.1 shows control on the ground)'],
    [[35.3, 32], 'PS', 'the West Bank'], [[34.38, 31.42], 'PS', 'Gaza', 'high'], [[35.8, 33], 'IL', 'the Golan Heights'],
    [[74.8, 34.1], 'IN', 'Kashmir is split along the line of control'], [[79.5, 35], 'CN', 'Aksai Chin'], [[94.5, 28], 'IN', 'Arunachal Pradesh'],
    [[-59, -51.7], 'FK', 'the Falkland Islands'], [[121, 24], 'TW', 'Taiwan'], [[21, 42.6], 'XK', 'Kosovo'],
    [[41, 43], 'GE', 'Abkhazia'], [[29.5, 47], 'MD', 'Transnistria'], [[28.6, 9.6], 'SD', 'Abyei'],
  ];
  for (const [point, id, what, only] of cases) {
    assert.equal(countryAt(point, 'high'), id, `${what} (1:50m)`);
    if (!only) assert.equal(countryAt(point), id, `${what} (1:110m)`);       // the Gaza Strip is too small for 1:110m
  }
});

/* ------------------------------------------------------- identifier tables */

test('the country table: codes, names, regions', () => {
  const ids = Object.keys(COUNTRIES);
  assert.ok(ids.length >= 230, `${ids.length} entries`);
  const names = new Set();
  for (const id of ids) {
    const [name, continent, subregion, territory, lon, lat, box] = COUNTRIES[id];
    assert.match(id, /^[A-Z]{2}$/, `${id} is a two-letter code`);
    assert.ok(name && name.trim() === name, `${id} has a name`);
    assert.ok(!names.has(name), `the name ${name} is used once`);
    names.add(name);
    assert.ok(['africa', 'antarctica', 'asia', 'europe', 'north-america', 'oceania', 'south-america', ''].includes(continent), `${id}: continent "${continent}"`);
    assert.ok(continent !== '' || territory === 1, `${id}: only remote territories have no continent`);
    assert.ok(subregion === '' || REGIONS[subregion], `${id}: subregion "${subregion}"`);
    assert.ok(territory === 0 || territory === 1);
    assert.ok(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90, `${id}: label point`);
    assert.ok(Array.isArray(box) && box.length === 4 && box[0] <= box[2] && box[1] <= box[3] && box[0] >= -180 && box[2] <= 540, `${id}: box ${box}`);
    assert.equal(countryName(id), name);
    assert.equal(countryInfo(id).id, id);
  }
  assert.equal(ids.filter((id) => !COUNTRIES[id][3]).length, 197, '193 UN members + Vatican City, Palestine, Kosovo, Taiwan');
  // common English short names, as the brief asks
  const expected = { RU: 'Russia', KR: 'South Korea', KP: 'North Korea', TZ: 'Tanzania', CZ: 'Czechia', US: 'United States', GB: 'United Kingdom', CN: 'China', IR: 'Iran', SY: 'Syria',
    LA: 'Laos', VN: 'Vietnam', BO: 'Bolivia', VE: 'Venezuela', MD: 'Moldova', CD: 'DR Congo', CG: 'Congo', CI: 'Ivory Coast', TR: 'Turkey', MK: 'North Macedonia', SZ: 'Eswatini',
    MM: 'Myanmar', TL: 'Timor-Leste', CV: 'Cape Verde', XK: 'Kosovo', TW: 'Taiwan', PS: 'Palestine', EG: 'Egypt', FM: 'Micronesia', BN: 'Brunei', VA: 'Vatican City' };
  for (const [id, name] of Object.entries(expected)) assert.equal(countryName(id), name);
  assert.equal(countryName('ZZ'), '');
  assert.equal(countryName('constructor'), '');
  assert.equal(countryInfo('ZZ'), null);
  assert.deepEqual(countryInfo('EG'), { id: 'EG', name: 'Egypt', continent: 'africa', subregion: 'northern-africa', territory: false, center: [29.4, 26.2], box: COUNTRIES.EG[6], capital: 'Cairo' });
});

test('every code resolves to a shape, or is listed as a marker at that resolution', async () => {
  const ids = Object.keys(COUNTRIES);
  const low = markerOnly('low');
  for (const id of ids) assert.ok(WORLD_110M.shapes[id] || low.includes(id), `${id}: a shape at 1:110m, or on the marker list`);
  for (const id of low) assert.ok(!WORLD_110M.shapes[id] && COUNTRIES[id], `${id} is only on the marker list if it has no shape`);
  for (const id of Object.keys(WORLD_110M.shapes)) assert.ok(id === '_' || COUNTRIES[id], `shape ${id} is in the table`);
  assert.ok(low.length < 70, `${low.length} markers at 1:110m`);
  for (const id of ['SG', 'MT', 'BH', 'LI', 'AD', 'MC', 'SM', 'VA', 'MV', 'MU', 'TV']) assert.ok(low.includes(id), `${id} is a marker at 1:110m`);
  for (const id of ['LU', 'QA', 'KW', 'LB', 'CY', 'JM', 'BN', 'TL', 'GM', 'FJ', 'XK', 'TW', 'PS']) assert.ok(!low.includes(id), `${id} has a shape at 1:110m`);
  const mod = await import('../assets/geo/world-50m.js');
  await loadDetail();
  assert.deepEqual(markerOnly('high'), [], 'at 1:50m every entry has a shape');
  for (const id of Object.keys(mod.default.shapes)) assert.ok(id === '_' || COUNTRIES[id], `1:50m shape ${id} is in the table`);
  const arcs = decodeArcs(mod.default.arcs, mod.default.step);
  assert.equal(arcs.length, mod.default.n.reduce((a, b) => a + b, 0));
});

test('label points are inside their countries', () => {
  const off = [];
  for (const id of Object.keys(WORLD_110M.shapes)) {
    if (id === '_') continue;
    const { center } = countryInfo(id);
    if (countryAt(center) !== id) off.push(id);
  }
  // archipelagos and crescents are named beside their largest island or across a bay; that is as it should be
  assert.ok(off.length <= 6, `label points outside their country at 1:110m: ${off.join(' ')}`);
});

test('names with their article, for use in sentences', () => {
  const expected = { PH: 'the Philippines', US: 'the United States', GB: 'the United Kingdom', NL: 'the Netherlands', BS: 'the Bahamas', GM: 'the Gambia',
    MV: 'the Maldives', SC: 'the Seychelles', KM: 'the Comoros', SB: 'the Solomon Islands', MH: 'the Marshall Islands', AE: 'the United Arab Emirates',
    CF: 'the Central African Republic', DO: 'the Dominican Republic', CD: 'the DR Congo', CG: 'the Congo', FK: 'the Falkland Islands',
    EG: 'Egypt', FR: 'France', CI: 'Ivory Coast', CZ: 'Czechia', UA: 'Ukraine', SD: 'Sudan', LB: 'Lebanon', VA: 'Vatican City', FM: 'Micronesia', TT: 'Trinidad and Tobago' };
  for (const [id, name] of Object.entries(expected)) assert.equal(countryNameThe(id), name);
  assert.equal(countryNameThe('ZZ'), '');
  // it only ever adds "the " in front of the plain name, and names made of "Islands", "Republic" or "United" always get it
  let withArticle = 0;
  for (const id of Object.keys(COUNTRIES)) {
    const plain = countryName(id);
    const the = countryNameThe(id);
    assert.ok(the === plain || the === `the ${plain}`, `${id}: ${the}`);
    if (the !== plain) withArticle++;
    if (/(Islands|Republic|Emirates|Kingdom|States|Territory|Lands)$/.test(plain) || /^(United|Isle) /.test(plain)) assert.equal(the, `the ${plain}`, `${id}: ${plain} needs an article`);
  }
  assert.ok(withArticle >= 20 && withArticle <= 40, `${withArticle} names take an article`);
});

test('the main body of a country (mainBodyOnly, inMainBody)', () => {
  assert.equal(inMainBody('Paris', 'FR'), true);
  assert.equal(inMainBody([9.1, 42.2], 'FR'), true, 'Corsica is part of the main body');
  assert.equal(inMainBody([-53, 4], 'FR'), false, 'French Guiana is overseas');
  assert.equal(countryAt([-53, 4]), 'FR', 'although the data draws it as France');
  assert.equal(inMainBody('Chicago', 'US'), true);
  assert.equal(inMainBody([-150, 65], 'US'), true, 'Alaska counts');
  assert.equal(inMainBody([-157, 21], 'US'), false, 'Hawaii does not');
  assert.equal(inMainBody([170, 66], 'RU'), true, 'Russia east of 170° E');
  assert.equal(inMainBody([-175, 67], 'RU'), true, 'and across the date line');
  assert.equal(inMainBody([20.5, 54.7], 'RU'), true, 'Kaliningrad');
  assert.equal(inMainBody([16, 78], 'NO'), true, 'Svalbard is close enough to count');
  assert.equal(inMainBody([114, 3], 'MY'), true, 'both halves of Malaysia');
  assert.equal(inMainBody([102, 4], 'MY'), true);
  assert.equal(inMainBody([0, 0], 'FR'), false);
  assert.equal(inMainBody([0, 0], 'ZZ'), false);
  // every country's own label point is in its main body
  for (const id of Object.keys(WORLD_110M.shapes)) if (id !== '_') assert.equal(inMainBody(countryInfo(id).center, id), true, `${id}: label point`);
});

test('regions', () => {
  const africa = countryIds('africa');
  assert.equal(africa.length, 54, 'Africa has 54 countries');
  assert.deepEqual(africa, africa.slice().sort());
  assert.ok(!africa.includes('EH') && countryIds('africa', { territories: true }).includes('EH'), 'Western Sahara only with territories');
  assert.equal(countryIds('world').length, 197);
  assert.equal(countryIds('south-america').length, 12);
  assert.equal(countryIds('oceania').length, 14);
  assert.equal(countryIds('europe').length + countryIds('asia').length + countryIds('africa').length + countryIds('north-america').length + countryIds('south-america').length + countryIds('oceania').length, 197, 'every country is in exactly one continent');
  assert.ok(countryIds('europe').includes('RU') && !countryIds('europe').includes('TR'), 'Natural Earth puts Russia in Europe and Turkey in Asia');
  assert.deepEqual(countryIds('south-asia'), ['AF', 'BD', 'BT', 'IN', 'IR', 'LK', 'MV', 'NP', 'PK']);
  assert.deepEqual(countryIds('east-asia'), ['CN', 'JP', 'KP', 'KR', 'MN', 'TW']);
  assert.equal(countryIds('southeast-asia').length, 11);
  assert.ok(countryIds('middle-east').includes('EG') && countryIds('middle-east').includes('IR'));
  assert.equal(countryIds('central-america-caribbean').length, 8 + 13);
  assert.equal(countryIds('sub-saharan-africa').length, 54 - 6);
  assert.deepEqual(countryIds('atlantis'), []);
  // subregions do not overlap and together cover every entry that has one
  const seen = new Map();
  for (const [name, list] of Object.entries(REGIONS)) {
    for (const id of list.split(' ')) {
      assert.ok(COUNTRIES[id], `${name}: ${id} is in the table`);
      if (COUNTRIES[id][2] === name) { assert.ok(!seen.has(id), `${id} is in one subregion`); seen.set(id, name); }
    }
  }
  for (const name of regionNames()) assert.ok(countryIds(name, { territories: true }).length > 0, `region ${name} is not empty`);
  for (const name of ['europe', 'africa', 'asia', 'south-asia', 'east-asia', 'southeast-asia', 'middle-east', 'north-america', 'central-america-caribbean', 'south-america', 'oceania']) {
    assert.ok(regionNames().includes(name), `${name} is a region`);
  }
});

test('views', () => {
  for (const name of ['world', 'europe', 'africa', 'asia', 'south-asia', 'east-asia', 'southeast-asia', 'middle-east', 'north-america', 'central-america-caribbean', 'south-america', 'oceania', 'mediterranean']) {
    assert.ok(name in VIEWS, `view ${name}`);
  }
  for (const [name, v] of Object.entries(VIEWS)) {
    if (v === null) continue;
    if (Array.isArray(v)) assert.ok(v.length === 4 && v[0] < v[2] && v[1] < v[3] && v[1] >= -90 && v[3] <= 90, `${name}: ${v}`);
    else assert.ok(Array.isArray(v.center) && v.span > 0, name);
  }
  // a named view shows the countries it is named after
  for (const [view, ids] of [['europe', ['PT', 'GR', 'NO', 'UA']], ['africa', ['MA', 'ZA', 'SO', 'SN']], ['south-asia', ['PK', 'LK', 'BD']], ['southeast-asia', ['MM', 'ID', 'PH']], ['south-america', ['CO', 'AR', 'BR']], ['middle-east', ['EG', 'IR', 'YE', 'TR']]]) {
    const [w, s, e, n] = VIEWS[view];
    for (const id of ids) { const [lon, lat] = countryInfo(id).center; assert.ok(lon > w && lon < e && lat > s && lat < n, `${id} is inside the ${view} view`); }
  }
});

test('places', () => {
  assert.deepEqual(place('Cairo'), [31.25, 30.05]);
  assert.deepEqual(place('bogota'), place('Bogotá'));
  assert.deepEqual(place('  SÃO   paulo '), place('São Paulo'));
  assert.equal(place('Atlantis'), null);
  for (const name of ['Timbuktu', 'Samarkand', 'Venice', 'Mecca', 'Jerusalem', 'Istanbul', 'Xi\'an', 'Kyoto', 'Cusco', 'Washington, D.C.', 'Copenhagen', 'Astana',
    'Québec', 'Quebec', 'Winnipeg', 'Halifax', 'Darwin', 'Lhasa', 'Nuuk', 'Iqaluit', 'Boston', 'Santa Fe', 'Gitega', 'Naypyidaw']) assert.ok(place(name), `${name} is in the table`);
  assert.equal(countryAt('Santa Fe'), 'US', 'Santa Fe is the one in New Mexico; the Argentine city is "Santa Fe, AR"');
  assert.equal(countryAt('Santa Fe, AR'), 'AR');
  assert.equal(countryInfo('MM').capital, 'Naypyidaw');
  assert.equal(countryInfo('BI').capital, 'Gitega');
  assert.equal(PLACES.Yangon[3], 0, 'a former capital is not flagged as one');
  assert.equal(PLACES.Bujumbura[3], 0);
  for (const [name, row] of Object.entries(PLACES)) {
    assert.ok(row[0] >= -180 && row[0] <= 180 && row[1] >= -90 && row[1] <= 90, `${name}: position`);
    assert.ok(row[2] === '' || COUNTRIES[row[2]], `${name}: country ${row[2]}`);
  }
  // every country has a capital in the table, except where there is no agreed answer
  const none = Object.keys(COUNTRIES).filter((id) => !COUNTRIES[id][3] && !COUNTRIES[id][7]);
  assert.deepEqual(none, ['PS']);
  for (const [id, row] of Object.entries(COUNTRIES)) if (row[7]) { assert.ok(PLACES[row[7]], `${id}: capital ${row[7]} is a place`); assert.equal(PLACES[row[7]][2], id, `${row[7]} is in ${id}`); }
});

test('rivers', async () => {
  const { default: data } = await import('../assets/geo/rivers.js');
  const arcs = decodeArcs(data.arcs, data.step);
  const names = data.rivers.map((r) => r[0]);
  for (const name of ['Nile', 'Blue Nile', 'Euphrates', 'Tigris', 'Indus', 'Ganges', 'Yangtze', 'Yellow River', 'Mekong', 'Danube', 'Rhine', 'Volga', 'Amazon', 'Mississippi', 'Niger', 'Congo', 'Zambezi', 'Jordan']) {
    assert.ok(names.includes(name), `the ${name}`);
  }
  assert.equal(new Set(names).size, names.length, 'each river is listed once');
  for (const [name, rank, refs] of data.rivers) {
    assert.ok(rank >= 0 && rank <= 9 && refs.length > 0, name);
    for (const i of refs) assert.ok(arcs[i] && arcs[i].length >= 4, `${name}: arc ${i}`);
  }
  // the Nile reaches from near Lake Victoria to the Mediterranean
  const nile = data.rivers.find((r) => r[0] === 'Nile')[2].flatMap((i) => Array.from(arcs[i]).filter((_, k) => k % 2 === 1));
  assert.ok(Math.min(...nile) < 3 && Math.max(...nile) > 31, `Nile latitudes ${Math.min(...nile)} to ${Math.max(...nile)}`);
});

/* ---------------------------------------------------------------- examples */

test('the gallery examples are sound', () => {
  assert.ok(examples.length >= 6 && examples.length <= 10);
  const modes = new Set();
  for (const { title, spec } of examples) {
    assert.equal(spec.type, 'world-map', title);
    assert.ok(spec.alt, `${title}: has alt text`);
    assert.deepEqual(JSON.parse(JSON.stringify(spec)), spec, `${title}: plain data`);
    modes.add(spec.mode || 'view');
    for (const m of spec.markers || []) assert.ok(Array.isArray(m.at) || place(m.at), `${title}: marker at ${m.at}`);
    for (const l of spec.lines || []) for (const p of l.points) assert.ok(Array.isArray(p) || place(p), `${title}: line point ${p}`);
    for (const r of spec.regions || []) for (const id of [].concat(r.ids)) assert.ok(COUNTRIES[id] || regionNames().includes(id), `${title}: region member ${id}`);
    if (spec.projection) assert.ok(PROJECTIONS.includes(spec.projection), `${title}: projection`);
    if (typeof spec.view === 'string') assert.ok(spec.view in VIEWS || COUNTRIES[spec.view], `${title}: view ${spec.view}`);
  }
  for (const mode of ['view', 'pick', 'pickMany', 'pickMarker', 'place', 'trace']) assert.ok(modes.has(mode), `an example of mode ${mode}`);
});
