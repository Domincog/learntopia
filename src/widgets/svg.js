/**
 * Static SVG figure, for diagrams that need no interaction.
 *
 *   { type: 'svg', viewBox: '0 0 320 160', content: '<circle …/>', alt: 'A circle', maxWidth: 360 }
 *
 * Use theme-aware classes instead of hard-coded colours so the drawing works
 * in light and dark mode:
 *   fill-blue / fill-blue-soft / fill-ink / fill-surface / fill-none
 *   stroke-ink / stroke-blue / stroke-hair …   (all hues: blue red green orange violet teal pink yellow gray)
 *   <text class="fig-label"> for labels (inherits the theme's text colour and font)
 */
export default function create(spec) {
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(NS, 'svg');
  svgEl.setAttribute('viewBox', spec.viewBox || '0 0 320 200');
  svgEl.setAttribute('class', 'fig-svg');
  svgEl.setAttribute('role', 'img');
  if (spec.alt) svgEl.setAttribute('aria-label', spec.alt);
  else svgEl.setAttribute('aria-hidden', 'true');
  svgEl.innerHTML = spec.content || '';
  const el = document.createElement('div');
  el.className = 'fig-svg-wrap';
  if (spec.maxWidth) el.style.maxWidth = typeof spec.maxWidth === 'number' ? `${spec.maxWidth}px` : spec.maxWidth;
  el.appendChild(svgEl);
  return { el };
}
