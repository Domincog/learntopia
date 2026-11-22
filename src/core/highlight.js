/**
 * A deliberately tiny syntax highlighter for the code that appears in lessons.
 * It tokenises with one regex per language and wraps tokens in <span>s.
 */
import { escapeHtml } from './dom.js';

const PY_KW = 'def|return|if|elif|else|for|while|in|not|and|or|is|True|False|None|break|continue|pass|import|from|as|class|lambda|try|except|finally|raise|with|yield|global';
const PY_BUILTIN = 'print|range|len|int|float|str|list|dict|set|tuple|sum|min|max|abs|sorted|reversed|enumerate|zip|input|round|bool|append|pop|type';
const JS_KW = 'const|let|var|function|return|if|else|for|while|of|in|new|class|extends|import|export|from|default|true|false|null|undefined|break|continue|switch|case|try|catch|finally|throw|async|await|typeof|this';
const JS_BUILTIN = 'console|Math|Array|Object|String|Number|JSON|Map|Set|Promise|document|window';

const LANGS = {
  python: new RegExp(
    `(?<c>#.*)|(?<s>"""[\\s\\S]*?"""|'''[\\s\\S]*?'''|f?"(?:\\\\.|[^"\\\\\\n])*"|f?'(?:\\\\.|[^'\\\\\\n])*')|(?<n>\\b\\d+\\.?\\d*\\b)|(?<k>\\b(?:${PY_KW})\\b)|(?<b>\\b(?:${PY_BUILTIN})\\b(?=\\s*\\())|(?<f>\\b[A-Za-z_]\\w*(?=\\s*\\())`,
    'g',
  ),
  js: new RegExp(
    `(?<c>\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\/)|(?<s>"(?:\\\\.|[^"\\\\\\n])*"|'(?:\\\\.|[^'\\\\\\n])*'|\`(?:\\\\.|[^\`\\\\])*\`)|(?<n>\\b\\d+\\.?\\d*\\b)|(?<k>\\b(?:${JS_KW})\\b)|(?<b>\\b(?:${JS_BUILTIN})\\b)|(?<f>\\b[A-Za-z_$][\\w$]*(?=\\s*\\())`,
    'g',
  ),
  pseudo: /(?<c>\/\/.*|#.*)|(?<s>"(?:\\.|[^"\\\n])*")|(?<n>\b\d+\.?\d*\b)|(?<k>\b(?:if|then|else|end|for|each|while|do|repeat|until|return|function|procedure|set|to|in|and|or|not|true|false|swap|output|input)\b)|(?<f>\b[A-Za-z_]\w*(?=\s*\())/gi,
};
LANGS.py = LANGS.python;
LANGS.javascript = LANGS.js;

const CLASS = { c: 'tok-com', s: 'tok-str', n: 'tok-num', k: 'tok-kw', b: 'tok-builtin', f: 'tok-fn' };

export function highlight(code, lang = '') {
  const re = LANGS[String(lang).toLowerCase()];
  const src = String(code);
  if (!re) return escapeHtml(src);
  let out = '';
  let last = 0;
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(src))) {
    if (m[0] === '') { re.lastIndex++; continue; }
    out += escapeHtml(src.slice(last, m.index));
    let cls = '';
    for (const key in CLASS) if (m.groups[key] !== undefined) { cls = CLASS[key]; break; }
    out += `<span class="${cls}">${escapeHtml(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  out += escapeHtml(src.slice(last));
  return out;
}

/** Full <pre> block markup for a code listing. */
export function codeBlock(code, lang = '') {
  const clean = String(code).replace(/^\n+|\s+$/g, '');
  const label = lang ? ` data-lang="${escapeHtml(lang)}"` : '';
  return `<pre class="code"${label}><code>${highlight(clean, lang)}</code></pre>`;
}
