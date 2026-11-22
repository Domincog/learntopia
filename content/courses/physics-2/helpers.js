/**
 * Helpers shared by the lessons of "Physics II: Orbits & Waves".
 *
 * The figure builders return specs for the built-in `svg` widget and use the
 * theme classes (fill-*, stroke-*, fig-label…) so the drawings follow light
 * and dark mode.
 */

/** Acceleration of free fall at the Earth's surface used throughout the course (m/s²), as in "Motion & Forces". */
export const G = 10;
/** Radius of the Earth used throughout the course (km). The measured mean radius is 6371 km. */
export const EARTH_RADIUS = 6400;
/** Speed of sound in air used in the questions (m/s): the value at about 15 °C. */
export const SOUND = 340;
/** Speed of light in empty space, rounded (km/s). The defined value is 299 792.458 km/s. */
export const LIGHT = 300000;

/** "a" or "an" before a number as it is read aloud: aAn(80) is "an", aAn(70) is "a". */
export const aAn = (n) => (/^(8|11(\D|$)|18(\D|$))/.test(String(n)) ? 'an' : 'a');

/** 6400000 -> "6,400,000": digits in groups of three, for running text. */
export const grouped = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** The same inside TeX math, where a bare comma would be followed by a gap: "6{,}400{,}000". */
export const groupedTex = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');

const f1 = (v) => (Math.round(v * 10) / 10).toString();

/**
 * Why 8 km/s: over 8 km of level flight the Earth's surface curves away by
 * 5 m, exactly as far as a ball falls in one second. Not to scale.
 */
export function curveDrop({ alt = '' } = {}) {
  const W = 460;
  const H = 190;
  // the ground: an arc that starts level at the left and drops away to the right
  let ground = '';
  for (let i = 0; i <= 40; i++) {
    const x = 40 + i * 9.6;
    const y = 96 + 0.00034 * (x - 40) * (x - 40) + 0.0000009 * (x - 40) ** 3;
    ground += `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`;
  }
  const yEnd = 96 + 0.00034 * 384 * 384 + 0.0000009 * 384 ** 3;
  let content = `<path class="fill-blue-soft" d="${ground}L424 ${H}L40 ${H}Z"/>`;
  content += `<path class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" d="${ground}"/>`;
  // the straight line the ball would follow without gravity
  content += '<line class="stroke-ink" stroke-width="2" stroke-dasharray="6 6" x1="40" y1="60" x2="424" y2="60"/>';
  // where the ball really is, one second later
  const yBall = 60 + (yEnd - 96);
  content += `<path class="stroke-orange fill-none" stroke-width="3.5" stroke-linecap="round" d="M40 60Q232 60 424 ${f1(yBall)}"/>`;
  content += '<circle class="fill-orange stroke-ink" stroke-width="2.5" cx="40" cy="60" r="9"/>';
  content += `<circle class="fill-orange stroke-ink" stroke-width="2.5" cx="424" cy="${f1(yBall)}" r="9"/>`;
  // the two 5 m drops
  content += `<line class="stroke-red" stroke-width="3" stroke-linecap="round" x1="444" y1="62" x2="444" y2="${f1(yBall - 2)}"/>`;
  content += `<text class="fig-label text-red" x="452" y="${f1((60 + yBall) / 2 + 5)}">5 m</text>`;
  content += `<line class="stroke-blue" stroke-width="3" stroke-linecap="round" x1="16" y1="98" x2="16" y2="${f1(yEnd - 2)}"/>`;
  content += `<line class="stroke-blue" stroke-width="2" stroke-dasharray="3 5" x1="16" y1="96" x2="44" y2="96"/>`;
  content += `<line class="stroke-blue" stroke-width="2" stroke-dasharray="3 5" x1="16" y1="${f1(yEnd)}" x2="420" y2="${f1(yEnd)}"/>`;
  content += `<text class="fig-label text-blue" x="24" y="${f1((96 + yEnd) / 2 + 12)}">5 m</text>`;
  content += '<text class="fig-label" x="232" y="48" text-anchor="middle">8 km in one second</text>';
  content += '<text class="fig-label-sm text-muted" x="232" y="24" text-anchor="middle">not to scale</text>';
  content += `<text class="fig-label text-blue" x="250" y="${H - 14}" text-anchor="middle">the ground curves away</text>`;
  return { type: 'svg', viewBox: `0 0 ${W + 30} ${H}`, maxWidth: 500, content, alt };
}

/**
 * Why astronauts float: a person on a bathroom scale in a lift. While the
 * cable holds, the floor pushes up and the scale shows the person's weight;
 * with the cable snapped everything falls together and the scale reads zero.
 */
export function liftScale({ alt = '' } = {}) {
  const lift = (x, held) => {
    const cx = x + 60;
    let s = '';
    // the cable: whole, or snapped with a gap
    if (held) s += `<line class="stroke-ink" stroke-width="3" x1="${cx}" y1="4" x2="${cx}" y2="48"/>`;
    else s += `<line class="stroke-ink" stroke-width="3" x1="${cx}" y1="4" x2="${cx}" y2="16"/><line class="stroke-ink" stroke-width="3" x1="${cx}" y1="34" x2="${cx}" y2="48"/>`;
    s += `<rect class="fill-surface stroke-ink" stroke-width="3" x="${x}" y="48" width="120" height="150" rx="6"/>`;
    // the scale on the floor, and the person standing on it
    s += `<rect class="fill-yellow stroke-ink" stroke-width="2.5" x="${cx - 28}" y="184" width="56" height="12" rx="3"/>`;
    s += `<rect class="fill-blue-soft stroke-ink" stroke-width="2.5" x="${cx - 13}" y="112" width="26" height="72" rx="11"/>`;
    s += `<circle class="fill-blue-soft stroke-ink" stroke-width="2.5" cx="${cx}" cy="96" r="13"/>`;
    if (held) {
      // the push of the floor on the person
      s += `<line class="stroke-red" stroke-width="4" stroke-linecap="round" x1="${cx + 34}" y1="180" x2="${cx + 34}" y2="140"/>`;
      s += `<path class="fill-red stroke-red" stroke-width="2" stroke-linejoin="round" d="M${cx + 34} 128L${cx + 27} 142L${cx + 41} 142Z"/>`;
    } else {
      // everything is falling
      s += `<line class="stroke-orange" stroke-width="4" stroke-linecap="round" x1="${x + 138}" y1="90" x2="${x + 138}" y2="140"/>`;
      s += `<path class="fill-orange stroke-orange" stroke-width="2" stroke-linejoin="round" d="M${x + 138} 152L${x + 131} 138L${x + 145} 138Z"/>`;
    }
    s += `<text class="fig-label" x="${cx}" y="222" text-anchor="middle">${held ? 'cable holds' : 'cable snapped'}</text>`;
    s += `<text class="fig-label ${held ? 'text-red' : 'text-orange'}" x="${cx}" y="244" text-anchor="middle">scale reads ${held ? '700 N' : '0 N'}</text>`;
    return s;
  };
  return { type: 'svg', viewBox: '0 0 400 252', maxWidth: 420, content: lift(40, true) + lift(230, false), alt };
}

/**
 * How the direction of a ray is described: a ray meeting a surface, the
 * normal at the point where it hits, and the angle between the two (40°).
 */
export function rayNormal({ alt = '' } = {}) {
  let content = '<rect class="fill-teal-soft" x="30" y="170" width="320" height="34"/>';
  content += '<line class="stroke-ink" stroke-width="4" stroke-linecap="round" x1="30" y1="170" x2="350" y2="170"/>';
  content += '<line class="stroke-ink" stroke-width="2.5" stroke-dasharray="6 6" x1="190" y1="34" x2="190" y2="170"/>';
  // the ray comes in at 40° from the normal
  content += '<line class="stroke-red" stroke-width="4" stroke-linecap="round" x1="93.6" y1="55.1" x2="190" y2="170"/>';
  content += '<path class="fill-red stroke-red" stroke-width="2" stroke-linejoin="round" d="M146.9 118.7L142.5 104.1L133.3 111.9Z"/>';
  content += '<path class="stroke-violet fill-none" stroke-width="3" d="M190 110A60 60 0 0 0 151.4 124"/>';
  content += '<text class="fig-label text-violet" x="172" y="100" text-anchor="middle">40°</text>';
  content += '<text class="fig-label text-red" x="84" y="46" text-anchor="middle">ray</text>';
  content += '<text class="fig-label" x="198" y="46">normal</text>';
  content += '<text class="fig-label" x="342" y="193" text-anchor="end">surface</text>';
  return { type: 'svg', viewBox: '0 0 380 210', maxWidth: 420, content, alt };
}

/**
 * White light entering a glass prism and leaving as a fan of colours. Red is
 * turned least and violet most. The spread is drawn larger than life.
 */
export function prism({ alt = '', maxWidth = 500 } = {}) {
  const colours = ['red', 'orange', 'yellow', 'green', 'blue', 'violet'];
  let content = '<path class="fill-teal-soft stroke-ink" stroke-width="3" stroke-linejoin="round" d="M210 30L320 200L100 200Z"/>';
  content += '<line class="stroke-ink" stroke-width="5" stroke-linecap="round" x1="14" y1="150" x2="150.5" y2="122"/>';
  content += '<text class="fig-label" x="12" y="126">white light</text>';
  colours.forEach((c, i) => {
    const yOut = 116 + i * 7;
    const xOut = 210 + ((yOut - 30) * 110) / 170;          // on the right-hand face of the prism
    const yEnd = 124 + i * 22;
    content += `<path class="stroke-${c} fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M150.5 122L${f1(xOut)} ${f1(yOut)}L446 ${f1(yEnd)}"/>`;
    // every ray is named, so that the order can be read without telling the colours apart
    content += `<text class="fig-label text-${c}" x="454" y="${f1(yEnd + 5)}">${c}</text>`;
  });
  content += '<text class="fig-label-sm text-muted" x="210" y="222" text-anchor="middle">glass prism</text>';
  return { type: 'svg', viewBox: '0 0 524 250', maxWidth, content, alt };
}

/**
 * Wave crests sent out by a source: evenly spaced rings when it stands still,
 * squeezed ahead and stretched behind when it moves to the right.
 *   moving: 0 (at rest) … 0.6 (fraction of the wave speed)
 */
export function dopplerRings({ moving = 0.5, alt = '', labels = true } = {}) {
  const W = 480;
  const H = 230;
  const cx = moving ? 270 : W / 2;
  const cy = 112;
  const gap = 24;
  let content = '';
  for (let i = 1; i <= 4; i++) {
    // the crest sent out i periods ago: it has grown to radius i·gap round the place where the source was then
    content += `<circle class="stroke-blue fill-none" stroke-width="2.5" cx="${f1(cx - moving * gap * i)}" cy="${cy}" r="${gap * i}"/>`;
  }
  content += `<circle class="fill-orange stroke-ink" stroke-width="2.5" cx="${cx}" cy="${cy}" r="9"/>`;
  if (moving) {
    content += `<line class="stroke-orange" stroke-width="4" stroke-linecap="round" x1="${cx + 14}" y1="${cy}" x2="${cx + 44}" y2="${cy}"/>`;
    content += `<path class="fill-orange stroke-orange" stroke-width="2" stroke-linejoin="round" d="M${cx + 54} ${cy}L${cx + 42} ${cy - 7}L${cx + 42} ${cy + 7}Z"/>`;
    if (labels) {
      content += `<text class="fig-label" x="${W - 8}" y="${H - 8}" text-anchor="end">ahead: crests squeezed</text>`;
      content += `<text class="fig-label" x="8" y="${H - 8}">behind: crests stretched</text>`;
    }
  }
  return { type: 'svg', viewBox: `0 0 ${W} ${H}`, maxWidth: 480, content, alt };
}

/**
 * Why a pool looks shallower than it is. Light from a coin on the bottom
 * bends away from the normal as it leaves the water; the eye traces it
 * straight back and sees the coin higher up than it is. With `ghost: true`
 * the place where the coin seems to be is drawn and labelled.
 */
export function shallowPool({ alt = '', ghost = false } = {}) {
  // Geometry worked out with the real speeds: 41.0° from the normal in water becomes 61.0° in air,
  // since sin 61.0° / sin 41.0° = 300 000 / 225 000. The eye's line, extended straight back, passes above the coin.
  let content = '<rect class="fill-blue-soft" x="0" y="90" width="460" height="146"/>';
  content += '<line class="stroke-ink" stroke-width="3" x1="0" y1="90" x2="460" y2="90"/>';
  content += '<line class="stroke-ink" stroke-width="3" x1="0" y1="235" x2="460" y2="235"/>';
  content += '<path class="stroke-red fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M150 228L270 90L390 23.5"/>';
  content += '<line class="stroke-violet" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round" x1="270" y1="90" x2="150" y2="156.5"/>';
  content += '<line class="stroke-ink" stroke-width="2" stroke-dasharray="5 6" x1="270" y1="34" x2="270" y2="150"/>';
  content += '<ellipse class="fill-yellow stroke-ink" stroke-width="2.5" cx="150" cy="228" rx="15" ry="6"/>';
  if (ghost) content += '<ellipse class="fill-yellow-soft stroke-violet" stroke-width="2.5" stroke-dasharray="4 4" cx="150" cy="156.5" rx="15" ry="6"/>';
  // the eye
  content += '<path class="fill-surface stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M390 23.5Q406 4 428 14Q414 32 390 23.5Z"/>';
  content += '<circle class="fill-ink" cx="410" cy="17" r="4"/>';
  content += '<text class="fig-label" x="174" y="224">coin</text>';
  if (ghost) content += '<text class="fig-label text-violet" x="130" y="152" text-anchor="end">where it seems to be</text>';
  content += '<text class="fig-label-sm text-muted" x="278" y="48">normal</text>';
  content += '<text class="fig-label-sm text-muted" x="12" y="80">air</text>';
  content += '<text class="fig-label-sm text-muted" x="12" y="110">water</text>';
  return { type: 'svg', viewBox: '0 0 460 238', maxWidth: 480, content, alt };
}
