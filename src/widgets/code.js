/**
 * Read-only code listing with syntax highlighting and optional line
 * numbers / highlighted lines.
 *
 *   { type: 'code', lang: 'python', code: 'for i in range(3):\n    print(i)', numbers: true, mark: [2] }
 */
import { h } from '../core/dom.js';
import { highlight } from '../core/highlight.js';

export default function create(spec) {
  const lang = spec.lang || '';
  const lines = String(spec.code || '').replace(/^\n+|\s+$/g, '').split('\n');
  const mark = new Set(spec.mark || []);
  const pre = h('pre.code', { 'data-lang': lang || null });
  if (spec.numbers || mark.size) {
    pre.classList.add('has-lines');
    lines.forEach((line, i) => {
      pre.appendChild(h('span', { class: 'code-line' + (mark.has(i + 1) ? ' is-marked' : '') },
        h('span.code-num', { 'aria-hidden': 'true' }, String(i + 1)),
        h('code', { html: highlight(line, lang) || '&nbsp;' }),
      ));
    });
  } else {
    pre.appendChild(h('code', { html: highlight(lines.join('\n'), lang) }));
  }
  return { el: h('div.fig-code', pre) };
}
