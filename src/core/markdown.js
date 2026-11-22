/**
 * Lesson text renderer: a compact Markdown dialect + KaTeX math.
 *
 * Supported
 *   Blocks : paragraphs, # headings, - / 1. lists (nested by indent), > quotes,
 *            ``` fenced code, $$ display math $$, | tables |, --- rules,
 *            :::tip / :::note / :::key / :::warn / :::example callouts
 *   Inline : **bold**, *italic*, `code`, $math$, [link](url), ==highlight==,
 *            ~~strike~~, [coloured text]{.blue}, \$ for a literal dollar sign,
 *            two trailing spaces (or a trailing backslash) for a line break
 *
 * Everything is HTML-escaped before formatting, so lesson text can never
 * inject markup.
 */
import katex from '../../vendor/katex/katex.min.js';
import { escapeHtml } from './dom.js';
import { codeBlock } from './highlight.js';

export const TEXT_COLORS = ['blue', 'red', 'green', 'orange', 'violet', 'teal', 'pink', 'yellow', 'gray'];

const MACROS = {
  '\\R': '\\mathbb{R}', '\\N': '\\mathbb{N}', '\\Z': '\\mathbb{Z}', '\\Q': '\\mathbb{Q}',
  '\\dd': '\\mathrm{d}',
  '\\unit': '\\,\\text{#1}',
};
for (const c of TEXT_COLORS) MACROS['\\' + c] = `\\htmlClass{tc-${c}}{#1}`;

const mathCache = new Map();

/** Render TeX to an HTML string with KaTeX. Never throws. */
export function renderMath(tex, display = false) {
  const key = (display ? 'D' : 'I') + tex;
  const hit = mathCache.get(key);
  if (hit !== undefined) return hit;
  let html;
  try {
    html = katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      trust: (ctx) => ctx.command === '\\htmlClass',
      macros: { ...MACROS },
    });
  } catch (err) {
    html = `<code class="math-error" title="${escapeHtml(String(err && err.message))}">${escapeHtml(tex)}</code>`;
  }
  if (mathCache.size > 2000) mathCache.clear();
  mathCache.set(key, html);
  return html;
}

function dedent(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  let min = Infinity;
  for (const line of lines) {
    if (!line.trim()) continue;
    const indent = /^[ \t]*/.exec(line)[0].length;
    if (indent < min) min = indent;
  }
  if (!Number.isFinite(min) || min === 0) return lines.join('\n');
  return lines.map((l) => l.slice(Math.min(min, /^[ \t]*/.exec(l)[0].length))).join('\n');
}

const ESC_DOLLAR = '\u0001';
const stashRe = /\u0000(\d+)\u0000/g;

function safeUrl(url) {
  return /^(https?:\/\/|mailto:|#\/|#$|\.{0,2}\/)/i.test(url);
}

function inlineFormat(raw) {
  let t = escapeHtml(raw);
  // [label](url)
  t = t.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    if (!safeUrl(url)) return m;
    const ext = /^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${url}"${ext}>${label}</a>`;
  });
  // [text]{.blue}
  t = t.replace(/\[([^\]\n]+)\]\{\.([a-z]+)\}/g, (m, label, color) =>
    (TEXT_COLORS.includes(color) ? `<span class="tc-${color}">${label}</span>` : m));
  t = t.replace(/\*\*([^\s*](?:[^*]|\*(?!\*))*?)\*\*/g, '<strong>$1</strong>');
  // (italics may wrap over a line break in the source, like bold, but not over a blank line)
  t = t.replace(/(^|[^*\w\\])\*([^\s*](?:(?:[^*\n]|\n(?!\s*\n))*[^\s*])?)\*(?![*\w])/g, '$1<em>$2</em>');
  t = t.replace(/(^|[^\w\\])_([^\s_](?:[^_\n]*[^\s_])?)_(?!\w)/g, '$1<em>$2</em>');
  t = t.replace(/==([^=\n]+(?:=[^=\n]+)*)==/g, '<mark>$1</mark>');
  t = t.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  t = t.replace(/(?: {2,}|\\)\n/g, '<br>');
  return t;
}

function parseTable(lines) {
  const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const head = cells(lines[0]);
  const aligns = cells(lines[1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-+:$/.test(c) ? 'right' : /^:-+/.test(c) ? 'left' : ''));
  const al = (i) => (aligns[i] ? ` style="text-align:${aligns[i]}"` : '');
  let html = '<div class="md-table-wrap"><table class="md-table"><thead><tr>';
  // an empty corner cell is not a header (screen readers would announce a blank column name)
  head.forEach((c, i) => {
    if (!c.trim()) { html += `<td${al(i)}></td>`; return; }
    // a heading that is only a formula gets a spoken name as well
    const spoken = mathSpeech.get(c.trim());
    html += `<th scope="col"${al(i)}${spoken ? ` aria-label="${escapeHtml(spoken)}"` : ''}>${inlineFormat(c)}</th>`;
  });
  html += '</tr></thead><tbody>';
  for (const line of lines.slice(2)) {
    html += '<tr>';
    cells(line).forEach((c, i) => { html += `<td${al(i)}>${inlineFormat(c)}</td>`; });
    html += '</tr>';
  }
  return html + '</tbody></table></div>';
}

// A list number has one or two digits, so that a sentence which opens with a year ("1788. The first…")
// stays a sentence.
const LIST_RE = /^(\s*)([-*•]|\d{1,2}[.)])\s+(.*)$/;
const CALLOUT_LABELS = { tip: 'Tip', note: 'Note', key: 'Key idea', warn: 'Watch out', example: 'Example', think: 'Think about it', fun: 'Fun fact' };

function parseList(lines) {
  const first = LIST_RE.exec(lines[0]);
  const baseIndent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const items = [];
  let cur = null;
  for (const line of lines) {
    const m = LIST_RE.exec(line);
    if (m && m[1].length === baseIndent) {
      cur = [m[3]];
      items.push(cur);
    } else if (cur) {
      cur.push(line);
    }
  }
  const start = ordered ? parseInt(first[2], 10) : 1;
  let html = ordered ? `<ol${start !== 1 ? ` start="${start}"` : ''}>` : '<ul>';
  for (const item of items) {
    const [head, ...rest] = item;
    if (rest.some((l) => l.trim())) html += `<li>${blocks([head, ...dedent(rest.join('\n')).split('\n')].join('\n'), true)}</li>`;
    else html += `<li>${inlineFormat(head)}</li>`;
  }
  return html + (ordered ? '</ol>' : '</ul>');
}

function blocks(text, tight = false) {
  const lines = text.split('\n');
  const out = [];
  let para = [];
  const flush = () => {
    if (!para.length) return;
    const joined = para.join('\n');
    // A paragraph that is only a stashed block (code / display math) needs no <p>.
    if (/^\s*\u0000\d+\u0000\s*$/.test(joined) && blockStash.has(joined.trim())) out.push(joined.trim());
    else out.push(tight && out.length === 0 ? inlineFormat(joined) : `<p>${inlineFormat(joined)}</p>`);
    para = [];
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { flush(); i++; continue; }
    // stashed block-level placeholder on its own line
    if (blockStash.has(line.trim())) { flush(); out.push(line.trim()); i++; continue; }
    let m = /^(#{1,4})\s+(.*)$/.exec(line);
    if (m) {
      flush();
      const level = Math.min(6, m[1].length + 2);
      out.push(`<h${level} class="md-h">${inlineFormat(m[2])}</h${level}>`);
      i++; continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flush(); out.push('<hr>'); i++; continue; }
    m = /^:::\s*(\w+)\s*(.*)$/.exec(line);
    if (m) {
      flush();
      const kind = m[1].toLowerCase();
      const body = [];
      i++;
      let depth = 1;
      while (i < lines.length) {
        if (/^:::\s*\w+/.test(lines[i])) depth++;
        else if (/^:::\s*$/.test(lines[i])) { depth--; if (depth === 0) break; }
        body.push(lines[i]);
        i++;
      }
      i++;
      const title = m[2].trim() || CALLOUT_LABELS[kind] || '';
      out.push(
        `<aside class="callout callout-${escapeHtml(kind)}">` +
        (title ? `<div class="callout-title">${inlineFormat(title)}</div>` : '') +
        `<div class="callout-body">${blocks(body.join('\n'))}</div></aside>`,
      );
      continue;
    }
    if (/^>\s?/.test(line)) {
      flush();
      const body = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { body.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${blocks(body.join('\n'))}</blockquote>`);
      continue;
    }
    // As in CommonMark, only a list that starts at 1 may interrupt a paragraph: a wrapped line that
    // happens to begin "20. In trials…" stays part of its sentence.
    if (LIST_RE.test(line) && !(para.length && /^\s*\d/.test(line) && !/^\s*1[.)]/.test(line))) {
      flush();
      const body = [];
      const indent = LIST_RE.exec(line)[1].length;
      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim()) {
          // blank line: keep going only if the list continues afterwards
          const nxt = lines[i + 1];
          if (nxt !== undefined && (LIST_RE.test(nxt) || /^\s+\S/.test(nxt)) && /^\s*/.exec(nxt)[0].length >= indent) { body.push(l); i++; continue; }
          break;
        }
        if (LIST_RE.test(l) || /^\s+\S/.test(l)) { body.push(l); i++; continue; }
        break;
      }
      out.push(parseList(body));
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[i + 1])) {
      flush();
      const body = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { body.push(lines[i]); i++; }
      out.push(parseTable(body));
      continue;
    }
    para.push(line);
    i++;
  }
  flush();
  return out.join('\n');
}

let blockStash = new Set();
/** Placeholder -> spoken text for the inline formulas of the render in progress. */
let mathSpeech = new Map();

/**
 * Render lesson markdown to an HTML string.
 * @param {string} src
 * @param {{ inline?: boolean }} [opts] inline: no block elements / <p> wrapper.
 */
export function md(src, opts = {}) {
  if (src == null || src === '') return '';
  let text = dedent(String(src));
  const stash = [];
  const prevBlockStash = blockStash;
  const prevMathSpeech = mathSpeech;
  blockStash = new Set();
  mathSpeech = new Map();
  const keep = (html, block) => {
    stash.push(html);
    const key = `\u0000${stash.length - 1}\u0000`;
    if (block) { blockStash.add(key); return `\n\n${key}\n\n`; }
    return key;
  };

  if (!opts.inline) {
    text = text.replace(/^[ \t]*```([\w-]*)[ \t]*\n([\s\S]*?)\n[ \t]*```[ \t]*$/gm, (_, lang, code) => keep(codeBlock(dedent(code), lang), true));
  }
  text = text.replace(/`([^`\n]+)`/g, (_, code) => keep(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/\\\$/g, ESC_DOLLAR);
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    const html = renderMath(tex.replace(/\u0001/g, '\\$').trim(), true);
    return opts.inline ? keep(html) : keep(`<div class="math-display">${html}</div>`, true);
  });
  // pandoc-style inline math: no space just inside the dollars, no digit right after.
  text = text.replace(/\$([^\s$](?:[^$\n]*[^\s$])?)\$(?!\d)/g, (_, tex) => {
    const source = tex.replace(/\u0001/g, '\\$');
    const key = keep(renderMath(source, false));
    mathSpeech.set(key, texToSpeech(source));
    return key;
  });
  text = text.replace(/\u0001/g, '$');

  let html = opts.inline ? inlineFormat(text.replace(/\n+/g, ' ')) : blocks(text);
  // restore stashed fragments (loop: a stash may itself contain placeholders)
  for (let guard = 0; guard < 5 && stashRe.test(html); guard++) {
    stashRe.lastIndex = 0;
    html = html.replace(stashRe, (_, idx) => stash[Number(idx)]);
  }
  stashRe.lastIndex = 0;
  blockStash = prevBlockStash;
  mathSpeech = prevMathSpeech;
  return html;
}

/**
 * List the math segments in a piece of lesson text, using the same rules as
 * md(). Used by the content validator to check every formula compiles.
 * @returns {{ tex: string, display: boolean }[]}
 */
export function extractMath(src) {
  const out = [];
  let text = dedent(String(src == null ? '' : src));
  text = text.replace(/^[ \t]*```[\w-]*[ \t]*\n[\s\S]*?\n[ \t]*```[ \t]*$/gm, ' ');
  text = text.replace(/`[^`\n]+`/g, ' ');
  text = text.replace(/\\\$/g, ESC_DOLLAR);
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => { out.push({ tex: tex.replace(/\u0001/g, '\\$').trim(), display: true }); return ' '; });
  text.replace(/\$([^\s$](?:[^$\n]*[^\s$])?)\$(?!\d)/g, (_, tex) => { out.push({ tex: tex.replace(/\u0001/g, '\\$'), display: false }); return ' '; });
  return out;
}

/** Strict KaTeX check: returns an error message, or null if the TeX is valid. */
export function mathError(tex, display = false) {
  try {
    katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'ignore', trust: (ctx) => ctx.command === '\\htmlClass', macros: { ...MACROS } });
    return null;
  } catch (err) {
    return String(err && err.message ? err.message : err);
  }
}

/** Inline-only rendering (for option labels, chips, table cells…). */
export const mdInline = (src) => md(src, { inline: true });

const SPOKEN = {
  times: 'times', cdot: 'times', div: 'divided by', pm: 'plus or minus',
  le: 'is at most', leq: 'is at most', ge: 'is at least', geq: 'is at least',
  ne: 'is not equal to', neq: 'is not equal to', approx: 'is about',
  pi: 'pi', theta: 'theta', alpha: 'alpha', beta: 'beta', Delta: 'delta', infty: 'infinity',
  to: 'to', rightarrow: 'to', longrightarrow: 'gives', Rightarrow: 'so',
  angle: 'angle', triangle: 'triangle', sum: 'sum', int: 'integral',
  ldots: 'and so on', dots: 'and so on', cdots: 'and so on', quad: ' ', qquad: ' ',
};

/**
 * A rough spoken version of a TeX formula, for accessible names:
 * "\frac{3}{4}x^2" -> "3 over 4 x squared". Best effort, not a full parser.
 */
export function texToSpeech(tex) {
  let t = String(tex);
  t = t.replace(/\\(?:blue|red|green|orange|violet|teal|pink|yellow|gray|text|mathrm|mathbf|textbf|operatorname|mathbb)\{([^{}]*)\}/g, '$1');
  for (let pass = 0; pass < 4; pass++) {
    t = t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, ' $1 over $2 ');
    t = t.replace(/\\sqrt\{([^{}]*)\}/g, ' the square root of $1 ');
  }
  t = t.replace(/\^\{?\\circ\}?/g, ' degrees');
  t = t.replace(/\^\{?2\}?(?!\d)/g, ' squared').replace(/\^\{?3\}?(?!\d)/g, ' cubed');
  t = t.replace(/\^\{([^{}]*)\}/g, ' to the power $1').replace(/\^(\w)/g, ' to the power $1');
  t = t.replace(/_\{([^{}]*)\}/g, ' sub $1').replace(/_(\w)/g, ' sub $1');
  t = t.replace(/\\%/g, ' percent').replace(/\\\$/g, ' dollars ').replace(/\\[,;:! ]/g, ' ');
  t = t.replace(/\\([a-zA-Z]+)/g, (_, word) => (SPOKEN[word] !== undefined ? ` ${SPOKEN[word]} ` : ' '));
  t = t.replace(/[{}\\]/g, ' ');
  t = t.replace(/</g, ' is less than ').replace(/>/g, ' is greater than ').replace(/=/g, ' equals ').replace(/\+/g, ' plus ');
  t = t.replace(/^\s*-\s*/, 'minus ').replace(/([(=,])\s*-\s*/g, '$1 minus ').replace(/\s*-\s*/g, ' minus ');
  t = t.replace(/\//g, ' over ');
  return t.replace(/\s+/g, ' ').trim();
}

/** Plain-text version of lesson markdown (for aria-labels and search). Math is turned into rough speech. */
export function mdText(src) {
  return String(src == null ? '' : src)
    .replace(/\\\$/g, '\u0001')
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => ` ${texToSpeech(tex)} `)
    .replace(/\$([^\s$](?:[^$\n]*[^\s$])?)\$(?!\d)/g, (_, tex) => ` ${texToSpeech(tex)} `)
    .replace(/\u0001/g, '$')
    .replace(/[*_`=~#>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\{\.[a-z]+\}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
