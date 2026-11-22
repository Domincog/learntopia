/**
 * Code-editing pieces shared by the `code` step type and the py-run /
 * py-trace widgets. Browser only (the interpreter itself lives in minipy.js
 * and has no DOM dependencies).
 *
 *   createEditor({ value, rows, label, onInput, onRun })   editable code area
 *   createOutput({ label })                                 output + friendly errors
 *   bringIntoView(el)                                       scroll a result into sight
 *   errorCard(error)                                        one error, explained
 *   highlightLines(code)                                    HTML per line (python)
 *
 * The editor is a plain <textarea> laid over a syntax-highlighted copy of
 * its text, so typing, selection, undo, IME and screen readers all behave
 * natively. Extras for writing Python comfortably, also on a phone:
 *   Tab / Shift+Tab   indent / un-indent (Esc, then Tab, leaves the editor)
 *   Enter             keeps the indentation; one level deeper after a colon
 *   Backspace         removes a whole indent level at the start of a line
 *   Ctrl/Cmd + Enter  run
 *   a row of symbol keys (: ( ) " = [ ] …) on touch devices
 *   curly “smart” quotes and non-breaking spaces are straightened as you type
 */
import { h, addStyles, icon } from '../widgets/kit.js';
import { highlight } from '../core/highlight.js';

addStyles('py-lang', `
  .py-editor { position: relative; border: var(--bw) solid var(--edge); border-radius: var(--r); background: var(--surface); overflow: hidden; text-align: left; }
  .py-editor:focus-within { border-color: var(--focus); box-shadow: 0 0 0 3px rgba(63, 140, 255, 0.3); }
  .py-editor.is-readonly { background: var(--sunken); }
  .py-editor-scroll { display: flex; align-items: stretch; overflow: auto; max-height: min(64vh, 34rem); overscroll-behavior-x: contain; }
  .py-editor-gutter, .py-editor-view, .py-editor-input {
    margin: 0; border: 0; font-family: var(--font-mono); font-size: 0.95rem; line-height: 1.6;
    font-variant-ligatures: none; letter-spacing: 0; tab-size: 4; white-space: pre; word-spacing: 0;
  }
  .py-editor-gutter {
    position: sticky; left: 0; z-index: 2; flex: none; min-width: 2.5em; padding: 12px 0;
    background: var(--sunken); border-right: 1px solid var(--hair); color: var(--ink-3);
    text-align: right; user-select: none; -webkit-user-select: none;
  }
  .py-editor-gutter span { display: block; padding: 0 8px 0 6px; }
  .py-editor-gutter span.is-error { background: var(--red); color: var(--on-color); font-weight: 700; }
  .py-editor-body { position: relative; flex: 1 0 auto; min-width: 0; min-height: calc(var(--rows, 5) * 1.6 * 0.95rem + 24px); }
  /* On a short screen the editor starts no taller than seven lines; it still grows as you type. */
  @media (min-width: 700px) and (max-height: 820px) { .py-editor-body { min-height: calc(min(var(--rows, 5), 7) * 1.6 * 0.95rem + 24px); } }
  .py-editor-view { display: block; width: max-content; min-width: 100%; padding: 12px 0; color: var(--ink); background: none; border-radius: 0; pointer-events: none; overflow: visible; }
  .py-editor-view .py-line { display: block; padding: 0 14px; min-height: 1.6em; }
  .py-editor-view .py-line.is-error { background: var(--red-soft); box-shadow: inset 3px 0 0 var(--red); }
  .py-editor-view code { font: inherit; background: none; border: 0; padding: 0; }
  .py-editor-input {
    position: absolute; inset: 0; display: block; width: 100%; height: 100%; padding: 12px 14px; resize: none; overflow: hidden;
    background: transparent; color: transparent; -webkit-text-fill-color: transparent; caret-color: var(--ink); outline: none; border-radius: 0;
  }
  .py-editor-input::selection { background: rgba(63, 140, 255, 0.32); color: transparent; -webkit-text-fill-color: transparent; }
  .py-editor-input:focus-visible { outline: none; }
  .py-editor-keys { display: none; gap: 6px; padding: 6px; overflow-x: auto; border-top: 1px solid var(--hair); background: var(--sunken); scrollbar-width: none; }
  .py-editor-keys::-webkit-scrollbar { display: none; }
  .py-editor-keys button {
    flex: none; min-width: 42px; height: 40px; padding: 0 10px; border: var(--bw) solid var(--edge); border-radius: 10px;
    background: var(--surface); color: var(--ink); font-family: var(--font-mono); font-size: 1rem; font-weight: 700;
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .py-editor-keys button:first-child { font-family: var(--font-body); font-size: var(--fs-sm); }
  .py-editor-keys button:active { background: var(--yellow-soft); }
  @media (pointer: coarse) {
    .py-editor-gutter, .py-editor-view, .py-editor-input { font-size: 16px; }
    .py-editor-body { min-height: calc(var(--rows, 5) * 1.6 * 16px + 24px); }
    .py-editor:not(.is-readonly) .py-editor-keys { display: flex; }
  }
  @supports (-webkit-touch-callout: none) {
    /* iOS draws textarea text 3px in from the padding edge */
    .py-editor-view .py-line { padding-left: 17px; }
  }

  .py-out { border: var(--bw) solid var(--hair); border-radius: var(--r); background: var(--surface); overflow: hidden; text-align: left; }
  .py-out-head { display: flex; align-items: center; justify-content: space-between; gap: var(--s2); padding: 6px 12px; background: var(--sunken); border-bottom: 1px solid var(--hair); }
  .py-out-head .eyebrow { color: var(--ink-2); }
  .py-out-note { font-size: var(--fs-xs); font-weight: 700; color: var(--ink-3); }
  .py-out-body { padding: 10px 12px; display: grid; gap: 10px; }
  .py-out-text {
    margin: 0; max-height: 15em; overflow: auto; font-family: var(--font-mono); font-size: 0.92rem; line-height: 1.55;
    font-variant-ligatures: none; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--ink);
  }
  .py-out-empty { color: var(--ink-3); font-size: var(--fs-sm); }
  .py-err { display: grid; gap: 4px; padding: 10px 12px; border: var(--bw) solid var(--red); border-left-width: 6px; border-radius: var(--r); background: var(--red-soft); }
  .py-err-title { display: flex; align-items: center; gap: 6px; font-weight: 800; color: var(--red-text); }
  .py-err-title svg { flex: none; }
  .py-err-msg { font-family: var(--font-mono); font-size: 0.9rem; font-variant-ligatures: none; overflow-wrap: anywhere; color: var(--ink); }
  .py-err-suggest { font-weight: 700; }
  .py-err-suggest code, .py-err-hint code { font-size: 0.9em; }
  .py-err-hint { font-size: var(--fs-sm); color: var(--ink-2); }
  .py-err-hint b { color: var(--ink); }
  .py-err-stack { font-size: var(--fs-xs); color: var(--ink-3); font-weight: 700; }
`);

/** Syntax-highlighted HTML for each line of a Python program. */
export function highlightLines(code) {
  return String(code).split('\n').map((line) => highlight(line, 'python'));
}

/** Insert text at the caret through the browser's editing pipeline, so undo keeps working. */
function typeText(area, text, from = area.selectionStart, to = area.selectionEnd) {
  area.focus({ preventScroll: true });
  area.setSelectionRange(from, to);
  let done = false;
  try { done = text === '' ? document.execCommand('delete') : document.execCommand('insertText', false, text); } catch { done = false; }
  if (!done) {
    area.setRangeText(text, from, to, 'end');
    area.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

const lineStart = (value, pos) => value.lastIndexOf('\n', pos - 1) + 1;
const lineEnd = (value, pos) => { const i = value.indexOf('\n', pos); return i < 0 ? value.length : i; };

const SYMBOL_KEYS = [['Tab', '    ', 'Indent'], [':', ':'], ['(', '('], [')', ')'], ['"', '"'], ['=', '='], ['[', '['], [']', ']'], ['+', '+'], ['<', '<'], ['>', '>'], ['_', '_'], ['#', '#']];

/**
 * An editable code area.
 * @returns {{ el, area, getValue, setValue, focus, setReadOnly, markError }}
 */
export function createEditor({ value = '', rows = 5, label = 'Code editor', onInput = () => {}, onRun = null } = {}) {
  const gutter = h('div.py-editor-gutter', { 'aria-hidden': 'true' });
  const view = h('pre.py-editor-view', { 'aria-hidden': 'true' });
  const hintId = `py-editor-hint-${Math.random().toString(36).slice(2, 8)}`;
  const area = h('textarea.py-editor-input', {
    spellcheck: false, autocapitalize: 'off', autocorrect: 'off', autocomplete: 'off', wrap: 'off',
    'aria-label': label, 'aria-describedby': hintId, 'aria-multiline': 'true',
  });
  area.setAttribute('autocapitalize', 'off');
  area.setAttribute('autocorrect', 'off');
  area.setAttribute('spellcheck', 'false');
  area.dataset.keys = 'own';
  const keys = h('div.py-editor-keys', { role: 'group', 'aria-label': 'Symbol keys' });
  const el = h('div.py-editor', { dataset: { keys: 'own' }, style: { '--rows': rows } },
    h('div.py-editor-scroll', gutter, h('div.py-editor-body', view, area)),
    keys,
    h('span.sr-only', { id: hintId }, 'Python code editor. Tab indents. To leave the editor with the keyboard, press Escape and then Tab.'),
  );
  let errorLine = 0;
  let escapeArmed = false;
  let readOnly = false;

  function paint() {
    const html = highlightLines(area.value);
    let nums = '';
    let body = '';
    for (let i = 0; i < html.length; i++) {
      const bad = i + 1 === errorLine;
      nums += `<span${bad ? ' class="is-error"' : ''}>${i + 1}</span>`;
      body += `<span class="py-line${bad ? ' is-error' : ''}">${html[i] || ' '}</span>`;
    }
    gutter.innerHTML = nums;
    view.innerHTML = body;
  }

  for (const [face, text, name] of SYMBOL_KEYS) {
    const btn = h('button', { type: 'button', 'aria-label': name || `Insert ${face}`, tabindex: '-1' }, face);
    // pointerdown + preventDefault keeps the keyboard open and the caret in place
    btn.addEventListener('pointerdown', (ev) => { ev.preventDefault(); if (!readOnly) typeText(area, text); });
    btn.addEventListener('click', (ev) => ev.preventDefault());
    keys.appendChild(btn);
  }

  area.addEventListener('input', () => {
    // Phones and word processors love curly quotes and odd spaces; Python does not.
    if (/[\u2018\u2019\u201C\u201D\u00A0\u2028\u2029]/.test(area.value)) {
      const pos = area.selectionStart;
      area.value = area.value.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u00A0/g, ' ').replace(/[\u2028\u2029]/g, '\n');
      area.setSelectionRange(pos, pos);
    }
    errorLine = 0;
    paint();
    onInput(area.value);
  });

  area.addEventListener('keydown', (ev) => {
    if (ev.isComposing || readOnly) return;
    const { value, selectionStart: a, selectionEnd: b } = area;
    if (ev.key === 'Escape') { escapeArmed = true; return; }
    const armed = escapeArmed;
    escapeArmed = false;
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
      if (onRun) { ev.preventDefault(); onRun(); }
      return;
    }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === 'Tab') {
      if (armed) return; // Esc, Tab: let the focus move on
      ev.preventDefault();
      const first = lineStart(value, a);
      const multi = value.slice(a, b).includes('\n');
      if (!ev.shiftKey && !multi) {
        const col = a - first;
        typeText(area, ' '.repeat(4 - (col % 4)));
        return;
      }
      // indent or un-indent every touched line
      const last = lineEnd(value, b > a && value[b - 1] === '\n' ? b - 1 : b);
      const block = value.slice(first, last).split('\n');
      const changed = block.map((line) => (ev.shiftKey ? line.replace(/^ {1,4}/, '') : (line.trim() ? `    ${line}` : line)));
      const text = changed.join('\n');
      if (text === block.join('\n')) return;
      typeText(area, text, first, last);
      const delta0 = changed[0].length - block[0].length;
      const newA = multi ? first : Math.max(first, a + delta0);
      area.setSelectionRange(newA, multi ? first + text.length : newA);
      return;
    }
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      const first = lineStart(value, a);
      const before = value.slice(first, a);
      let indent = /^ */.exec(before)[0];
      const code = before.replace(/#.*$/, '').trimEnd();
      if (code.endsWith(':')) indent += '    ';
      else if (/^\s*(?:return|break|continue|pass)\b/.test(code) && indent.length >= 4 && a === lineEnd(value, a)) indent = indent.slice(4);
      typeText(area, `\n${indent}`);
      return;
    }
    if (ev.key === 'Backspace' && a === b) {
      const first = lineStart(value, a);
      const before = value.slice(first, a);
      if (before.length > 1 && /^ +$/.test(before)) {
        ev.preventDefault();
        const remove = before.length % 4 || 4;
        typeText(area, '', a - remove, a);
      }
    }
  });

  area.value = value;
  paint();

  return {
    el,
    area,
    getValue: () => area.value,
    setValue(text) { area.value = String(text == null ? '' : text); errorLine = 0; paint(); },
    focus() { area.focus({ preventScroll: true }); },
    setReadOnly(v) { readOnly = !!v; area.readOnly = readOnly; el.classList.toggle('is-readonly', readOnly); },
    /** Highlight a line (1-based) as the place of an error; 0 or null clears it. */
    markError(line) { errorLine = line || 0; paint(); },
  };
}

/** A friendly, readable version of an interpreter error. */
export function errorCard(error, { title = null } = {}) {
  const where = error.line ? ` on line ${error.line}` : '';
  const head = title || (error.type === 'TimeoutError' ? 'The program was stopped' : error.type === 'NotSupportedError' ? `Not available here${where}` : `${error.type}${where}`);
  const card = h('div.py-err', { role: 'alert' },
    h('div.py-err-title', icon(error.type === 'TimeoutError' ? 'hourglass' : 'bug', 18), head),
    h('div.py-err-msg', error.message),
  );
  if (error.suggestion) card.appendChild(h('div.py-err-suggest', 'Did you mean ', h('code', error.suggestion), '?'));
  if (error.hint) card.appendChild(h('div.py-err-hint', h('b', 'What this usually means: '), error.hint));
  if (error.stack && error.stack.length) {
    const chain = error.stack.map((f) => `${f.name}() called on line ${f.line}`).join(' → ');
    card.appendChild(h('div.py-err-stack', `How the program got there: ${chain}`));
  }
  return card;
}

/**
 * Scroll just enough to bring an element (the output of a run, say) into
 * view above the lesson player's sticky bottom bar.
 */
export function bringIntoView(el) {
  setTimeout(() => {
    if (!el || !el.isConnected) return;
    const bar = document.querySelector('.player-bottom');
    const limit = window.innerHeight - (bar ? bar.getBoundingClientRect().height : 0) - 12;
    const rect = el.getBoundingClientRect();
    if (rect.bottom <= limit) return;
    const top = Math.min(rect.bottom - limit, Math.max(0, rect.top - 72));
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (top > 0) window.scrollBy({ top, behavior: calm ? 'auto' : 'smooth' });
  }, 80);
}

const MAX_SHOWN_LINES = 200;

/**
 * Output panel: printed text, then (if any) the error that stopped the program.
 * @returns {{ el, showResult(result), showIdle(text), setNote(text), body }}
 */
export function createOutput({ label = 'Output', idle = 'Press Run to see what your program prints.' } = {}) {
  const note = h('span.py-out-note');
  const body = h('div.py-out-body');
  const el = h('div.py-out', { 'aria-live': 'polite' },
    h('div.py-out-head', h('span.eyebrow', label), note),
    body,
  );
  const api = {
    el,
    body,
    setNote(text) { note.textContent = text || ''; },
    showIdle(text = idle) {
      body.replaceChildren(h('div.py-out-empty', text));
      note.textContent = '';
    },
    /** Show what a run printed and, if it failed, why. */
    showResult(result, { emptyText = 'The program ran, but printed nothing.' } = {}) {
      body.replaceChildren();
      const text = result.stdout || '';
      if (text) {
        const all = text.replace(/\n$/, '').split('\n');
        const shown = all.length > MAX_SHOWN_LINES ? all.slice(0, MAX_SHOWN_LINES) : all;
        // Long output scrolls inside its box, so the box must be reachable from the keyboard.
        body.appendChild(h('pre.py-out-text', { tabindex: shown.length > 8 ? '0' : null, role: shown.length > 8 ? 'region' : null, 'aria-label': shown.length > 8 ? 'Program output' : null }, shown.join('\n')));
        if (shown.length < all.length) body.appendChild(h('div.py-out-empty', `… ${all.length - shown.length} more lines not shown.`));
      }
      if (result.error) body.appendChild(errorCard(result.error));
      else if (!text) body.appendChild(h('div.py-out-empty', emptyText));
      note.textContent = result.error ? 'stopped' : '';
    },
  };
  api.showIdle();
  return api;
}
