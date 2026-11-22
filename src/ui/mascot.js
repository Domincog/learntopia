/**
 * Lem, the ring-tailed lemur. Drawn in code so there are no image assets,
 * and so the expression can change with what is happening on screen.
 *
 *   mascot('happy')                          // full body, 120px
 *   mascot('cheer', { size: 180 })
 *   mascot('think', { variant: 'face', size: 56 })
 *
 * Moods: happy, cheer, think, oops, wow, wink, sleep, proud
 */

const INK = '#1D1B26';
const FUR = '#B9B4C6';
const FUR_DARK = '#8F8A9E';
const MASK = '#2B2834';
const CREAM = '#FFFDF8';
const EYE = '#FFB321';
const BLUSH = '#F7A8B8';
const TONGUE = '#F2647A';

function eyes(mood) {
  const L = { x: 79, y: 80 };
  const R = { x: 121, y: 80 };
  const open = (c, { r = 11, pr = 5.6, dx = 0, dy = 0 } = {}) => `
    <circle cx="${c.x}" cy="${c.y}" r="${r}" fill="${EYE}" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="${c.x + dx}" cy="${c.y + dy}" r="${pr}" fill="${INK}"/>
    <circle cx="${c.x + dx - 2}" cy="${c.y + dy - 2.4}" r="2" fill="#fff"/>`;
  const arcUp = (c) => `<path d="M ${c.x - 9} ${c.y + 3} Q ${c.x} ${c.y - 9} ${c.x + 9} ${c.y + 3}" fill="none" stroke="${CREAM}" stroke-width="4" stroke-linecap="round"/>`;
  const arcDown = (c) => `<path d="M ${c.x - 9} ${c.y - 1} Q ${c.x} ${c.y + 7} ${c.x + 9} ${c.y - 1}" fill="none" stroke="${CREAM}" stroke-width="4" stroke-linecap="round"/>`;
  switch (mood) {
    case 'cheer': return arcUp(L) + arcUp(R);
    case 'proud': return arcUp(L) + arcUp(R);
    case 'sleep': return arcDown(L) + arcDown(R);
    case 'wink': return arcUp(L) + open(R);
    case 'think': return open(L, { dx: 3, dy: -3.5 }) + open(R, { dx: 3, dy: -3.5 });
    case 'oops': return open(L, { dx: 0, dy: 2.5, pr: 6.2 }) + open(R, { dx: 0, dy: 2.5, pr: 6.2 });
    case 'wow': return open(L, { r: 12.5, pr: 4.2 }) + open(R, { r: 12.5, pr: 4.2 });
    default: return open(L) + open(R);
  }
}

function mouth(mood) {
  switch (mood) {
    case 'cheer':
      return `<path d="M 89 103 Q 100 121 111 103 Z" fill="${TONGUE}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    case 'proud':
    case 'wink':
      return `<path d="M 90 104 Q 100 114 110 104" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`;
    case 'think':
      return `<path d="M 94 107 Q 100 104 107 106" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`;
    case 'oops':
      return `<path d="M 93 108 Q 96.5 104 100 108 Q 103.5 112 107 108" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    case 'wow':
      return `<ellipse cx="100" cy="109" rx="5.5" ry="6.5" fill="${INK}"/>`;
    case 'sleep':
      return `<path d="M 95 106 Q 100 109 105 106" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    default:
      return `<path d="M 91 104 Q 100 112 109 104" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`;
  }
}

function arms(mood) {
  if (mood === 'cheer') {
    // paws thrown up
    return `
      <path d="M 70 140 Q 50 128 46 108" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/>
      <path d="M 70 140 Q 50 128 46 108" fill="none" stroke="${FUR}" stroke-width="11" stroke-linecap="round"/>
      <path d="M 130 140 Q 150 128 154 108" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/>
      <path d="M 130 140 Q 150 128 154 108" fill="none" stroke="${FUR}" stroke-width="11" stroke-linecap="round"/>`;
  }
  if (mood === 'think') {
    // one paw to the chin
    return `
      <ellipse cx="82" cy="160" rx="8" ry="10" fill="${FUR}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M 128 150 Q 132 128 114 116" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/>
      <path d="M 128 150 Q 132 128 114 116" fill="none" stroke="${FUR}" stroke-width="11" stroke-linecap="round"/>`;
  }
  return `
    <ellipse cx="82" cy="160" rx="8" ry="10" fill="${FUR}" stroke="${INK}" stroke-width="3.5"/>
    <ellipse cx="118" cy="160" rx="8" ry="10" fill="${FUR}" stroke="${INK}" stroke-width="3.5"/>`;
}

let clipSeq = 0;

/** Returns the mascot as an SVG markup string. */
export function mascotSvg(mood = 'happy', opts = {}) {
  const { size = 120, variant = 'full', label = null, cls = '', animate = true } = opts;
  const clipId = `lem-clip-${++clipSeq}`;
  const viewBox = variant === 'face' ? '38 16 124 112' : '14 10 180 186';
  const height = variant === 'face' ? Math.round((size * 112) / 124) : Math.round((size * 186) / 180);
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';

  const tail = variant === 'face' ? '' : `
    <g class="lem-tail">
      <path d="M 124 172 C 172 182 190 146 172 112 C 162 92 168 72 184 66" fill="none" stroke="${INK}" stroke-width="23" stroke-linecap="round"/>
      <path d="M 124 172 C 172 182 190 146 172 112 C 162 92 168 72 184 66" fill="none" stroke="${CREAM}" stroke-width="16" stroke-linecap="round"/>
      <path d="M 124 172 C 172 182 190 146 172 112 C 162 92 168 72 184 66" fill="none" stroke="${MASK}" stroke-width="16" stroke-dasharray="12 13" stroke-dashoffset="4"/>
    </g>`;

  const body = variant === 'face' ? '' : `
    <ellipse cx="80" cy="186" rx="15" ry="8" fill="${FUR_DARK}" stroke="${INK}" stroke-width="3.5"/>
    <ellipse cx="120" cy="186" rx="15" ry="8" fill="${FUR_DARK}" stroke="${INK}" stroke-width="3.5"/>
    <ellipse cx="100" cy="150" rx="39" ry="37" fill="${FUR}" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="100" cy="157" rx="22" ry="25" fill="${CREAM}"/>
    ${arms(mood)}`;

  const zzz = mood === 'sleep' ? `<text x="146" y="46" font-family="Georgia, serif" font-weight="700" font-size="22" fill="${INK}" opacity="0.7">z</text><text x="160" y="30" font-family="Georgia, serif" font-weight="700" font-size="15" fill="${INK}" opacity="0.5">z</text>` : '';
  const sparkle = mood === 'proud' ? `<path d="M 160 34 l 3.5 8 l 8 3.5 l -8 3.5 l -3.5 8 l -3.5 -8 l -8 -3.5 l 8 -3.5 z" fill="${EYE}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` : '';

  return `<svg class="mascot mascot-${mood}${animate ? ' mascot-live' : ''}${cls ? ' ' + cls : ''}" width="${size}" height="${height}" viewBox="${viewBox}" ${a11y} xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="${clipId}"><ellipse cx="100" cy="78" rx="50" ry="44"/></clipPath></defs>
    ${tail}
    ${body}
    <g class="lem-head">
      <circle cx="58" cy="42" r="17" fill="${FUR}" stroke="${INK}" stroke-width="4"/>
      <circle cx="58" cy="43" r="8.5" fill="${CREAM}"/>
      <circle cx="142" cy="42" r="17" fill="${FUR}" stroke="${INK}" stroke-width="4"/>
      <circle cx="142" cy="43" r="8.5" fill="${CREAM}"/>
      <ellipse cx="100" cy="78" rx="50" ry="44" fill="${CREAM}"/>
      <g clip-path="url(#${clipId})">
        <path d="M 40 20 H 160 V 74 Q 126 46 100 66 Q 74 46 40 74 Z" fill="${FUR}"/>
        <ellipse cx="60" cy="100" rx="9" ry="6" fill="${BLUSH}" opacity="0.75"/>
        <ellipse cx="140" cy="100" rx="9" ry="6" fill="${BLUSH}" opacity="0.75"/>
      </g>
      <ellipse cx="100" cy="78" rx="50" ry="44" fill="none" stroke="${INK}" stroke-width="4"/>
      <ellipse cx="78" cy="80" rx="17" ry="19" transform="rotate(-14 78 80)" fill="${MASK}"/>
      <ellipse cx="122" cy="80" rx="17" ry="19" transform="rotate(14 122 80)" fill="${MASK}"/>
      <g class="lem-eyes">${eyes(mood)}</g>
      <ellipse cx="100" cy="97" rx="7" ry="5" fill="${INK}"/>
      ${mouth(mood)}
    </g>
    ${zzz}${sparkle}
  </svg>`;
}

/** Returns the mascot as a DOM element. */
export function mascot(mood = 'happy', opts = {}) {
  const tpl = document.createElement('template');
  tpl.innerHTML = mascotSvg(mood, opts).trim();
  return tpl.content.firstChild;
}

/** The small square brand mark used next to the wordmark. */
export function brandMark(size = 34) {
  const tpl = document.createElement('template');
  tpl.innerHTML = mascotSvg('happy', { size, variant: 'face', animate: false, cls: 'brand-mark' }).trim();
  return tpl.content.firstChild;
}
