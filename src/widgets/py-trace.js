/**
 * py-trace — step through a Python program one line at a time and watch
 * what the computer does: which line runs next, what every variable holds,
 * and what has been printed so far. A "notional machine" you can drive.
 *
 * {
 *   type: 'py-trace',
 *   code: 'total = 0\nfor n in [1, 2, 3]:\n    total = total + n\nprint(total)',
 *   ask: 'next',        // optional "be the computer" mode: instead of pressing Step,
 *                       // the learner taps the line they think runs next
 *   autoplay: true,     // show a Play button (default true; never in ask mode)
 *   speed: 1100,        // milliseconds per step when playing
 *   start: 0,           // step to show first
 *   output: true,       // false hides the output box (for programs that print nothing)
 * }
 *
 * State: { step, steps, done, atEnd, line, misses }
 *   step    index of the current step (0 = nothing has run yet)
 *   steps   index of the last step
 *   atEnd   the tracer is at the last step right now
 *   done    the end has been reached at least once — use it for
 *           "step through to the end":  check: (s) => s.done || 'Keep stepping.'
 *   line    the line about to run (0 at the end)
 *   misses  ask mode: wrong taps so far
 * setState({ done: true }) or { step: 'end' } jumps to the end; { step: 3 } to a step.
 *
 * The program runs once, up front, in the built-in interpreter
 * (src/lang/minipy.js) with tracing on; stepping only moves through the
 * recorded steps, so going back is free. Programs must be short: the
 * recording stops after 400 steps.
 */
import { h, addStyles, icon, mdInline } from './kit.js';
import { play } from '../core/audio.js';
import { highlight } from '../core/highlight.js';
import { run, parse } from '../lang/minipy.js';
import { errorCard } from '../lang/editor.js';

addStyles('py-trace', `
  .widget-py-trace { width: 100%; max-width: 680px; margin: 0 auto; display: grid; gap: var(--s3); min-width: 0; text-align: left; }
  .widget-py-trace > * { min-width: 0; }
  .widget-py-trace .pt-code {
    list-style: none; margin: 0; padding: 8px 0; border: var(--bw) solid var(--edge); border-radius: var(--r); background: var(--surface);
    overflow-x: auto; font-family: var(--font-mono); font-size: 0.92rem; line-height: 1.75; font-variant-ligatures: none;
  }
  .widget-py-trace .pt-line { display: flex; align-items: center; width: max-content; min-width: 100%; padding-right: 12px; border-left: 4px solid transparent; outline-offset: -3px; }
  .widget-py-trace .pt-mark { flex: none; width: 26px; height: 1.75em; display: grid; place-items: center; color: var(--ink-3); }
  .widget-py-trace .pt-num { flex: none; width: 1.9em; padding-right: 0.7em; text-align: right; color: var(--ink-3); user-select: none; -webkit-user-select: none; }
  .widget-py-trace .pt-line code { white-space: pre; background: none; border: 0; padding: 0; font-size: inherit; }
  .widget-py-trace .pt-line.is-ran { border-left-color: var(--green); }
  .widget-py-trace .pt-line.is-ran .pt-mark { color: var(--green-text); }
  .widget-py-trace .pt-line.is-next { background: var(--yellow-soft); border-left-color: var(--orange); }
  .widget-py-trace .pt-line.is-next .pt-mark { color: var(--orange-text); }
  .widget-py-trace .pt-line.is-waiting { background: var(--sunken); }
  .widget-py-trace .pt-line.is-failed { background: var(--red-soft); border-left-color: var(--red); }
  .widget-py-trace .pt-line.is-failed .pt-mark { color: var(--red-text); }
  .widget-py-trace .pt-end { font-family: var(--font-body); font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-py-trace .pt-end .pt-num { visibility: hidden; }
  .widget-py-trace.is-asking .pt-line { cursor: pointer; min-height: 44px; -webkit-tap-highlight-color: transparent; }
  .widget-py-trace.is-asking .pt-mark { height: 44px; }
  /* with a mouse the lines need not be finger-sized, and a short laptop screen is glad of the room */
  @media (hover: hover) and (pointer: fine) and (max-height: 820px) { .widget-py-trace.is-asking .pt-line { min-height: 34px; } .widget-py-trace.is-asking .pt-mark { height: 34px; } }
  @media (hover: hover) {
    .widget-py-trace.is-asking:not(.is-finished):not(.is-readonly) .pt-line:hover { background: var(--blue-soft); }
  }
  .widget-py-trace.is-asking .pt-line.is-wrong { background: var(--red-soft); animation: shake 0.4s ease; }
  .widget-py-trace.is-asking .pt-line.is-hint { outline: 3px dashed var(--orange); }
  .widget-py-trace.is-asking.is-readonly .pt-line, .widget-py-trace.is-finished .pt-line { cursor: default; }

  .widget-py-trace .pt-bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s2); }
  .widget-py-trace .pt-bar .btn { min-height: 44px; padding: 0.5rem 0.9rem; }
  .widget-py-trace .pt-bar .btn-primary { min-width: 104px; }
  .widget-py-trace .pt-count { margin-left: auto; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-3); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .widget-py-trace .pt-note { min-height: 3.1em; padding: 8px 12px; border-radius: var(--r); background: var(--blue-soft); font-size: var(--fs-md); line-height: 1.45; }
  .widget-py-trace .pt-note code { font-size: 0.9em; background: var(--surface); }
  .widget-py-trace .pt-note.is-prompt { background: var(--violet-soft); font-weight: 600; }
  .widget-py-trace .pt-note.is-miss { background: var(--red-soft); }

  .widget-py-trace .pt-state { display: grid; gap: var(--s3); grid-template-columns: minmax(0, 1fr); align-items: start; }
  .widget-py-trace .pt-state.has-output { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); }
  @media (max-width: 560px) { .widget-py-trace .pt-state.has-output { grid-template-columns: minmax(0, 1fr); } }
  .widget-py-trace .pt-box { border: var(--bw) solid var(--hair); border-radius: var(--r); background: var(--surface); overflow: hidden; }
  .widget-py-trace .pt-box-head { padding: 5px 12px; background: var(--sunken); border-bottom: 1px solid var(--hair); font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-2); }
  .widget-py-trace .pt-box-head code { text-transform: none; letter-spacing: 0; font-size: 1.05em; background: none; border: 0; padding: 0; }
  .widget-py-trace .pt-box-body { padding: 6px 12px 8px; min-height: 2.6em; }
  .widget-py-trace .pt-empty { color: var(--ink-3); font-size: var(--fs-sm); padding: 4px 0; }
  .widget-py-trace table.pt-vars { width: 100%; border-collapse: collapse; }
  .widget-py-trace .pt-vars th, .widget-py-trace .pt-vars td { padding: 4px 6px; text-align: left; vertical-align: baseline; border-bottom: 1px solid var(--hair); font-family: var(--font-mono); font-size: 0.92rem; font-variant-ligatures: none; }
  .widget-py-trace .pt-vars tr:last-child th, .widget-py-trace .pt-vars tr:last-child td { border-bottom: 0; }
  .widget-py-trace .pt-vars th { width: 1%; white-space: nowrap; font-weight: 700; color: var(--blue-text); padding-left: 0; }
  .widget-py-trace .pt-vars td { overflow-wrap: anywhere; }
  .widget-py-trace .pt-vars .pt-eq { width: 1%; color: var(--ink-3); padding: 4px 2px; }
  .widget-py-trace .pt-vars tr.is-changed td.pt-val > b, .widget-py-trace .pt-vars tr.is-new td.pt-val > b { background: var(--yellow-soft); box-shadow: 0 0 0 3px var(--yellow-soft); border-radius: 3px; }
  .widget-py-trace .pt-vars td.pt-val > b { font-weight: 600; }
  .widget-py-trace .pt-tag { display: inline-block; margin-left: 8px; padding: 0 6px; border-radius: 999px; font-family: var(--font-body); font-size: 0.72rem; font-weight: 800; white-space: nowrap; vertical-align: 1px; }
  .widget-py-trace .pt-tag.is-was { background: var(--sunken); color: var(--ink-2); }
  .widget-py-trace .pt-tag.is-new { background: var(--green-soft); color: var(--green-text); }
  .widget-py-trace .pt-tag.is-same { background: var(--violet-soft); color: var(--violet-text); display: inline-flex; align-items: center; gap: 3px; }
  .widget-py-trace .pt-fn { font-family: var(--font-body); font-size: var(--fs-sm); color: var(--ink-3); font-style: italic; }
  .widget-py-trace .pt-scope { font-family: var(--font-body); font-size: var(--fs-xs); font-weight: 800; color: var(--ink-3); padding: 6px 0 2px; }
  .widget-py-trace .pt-out { margin: 0; font-family: var(--font-mono); font-size: 0.92rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; font-variant-ligatures: none; max-height: 12em; overflow: auto; }
  .widget-py-trace .pt-out .is-fresh { background: var(--yellow-soft); box-shadow: 0 0 0 2px var(--yellow-soft); border-radius: 3px; }
  .widget-py-trace.is-compact .pt-code { font-size: 0.78rem; border-width: 1.5px; }
`);

const clean = (code) => String(code == null ? '' : code).replace(/^\n+|\s+$/g, '');
const tick = (text) => `\`${String(text).replace(/`/g, "'")}\``;
const shorten = (text, max = 46) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** Which lines open a block, and where their body starts. */
function blockInfo(source, lines) {
  const info = {};
  let tree;
  try { tree = parse(source); } catch { return info; }
  const visit = (body) => {
    for (const node of body) {
      if (!node || !node.body) continue;
      const text = lines[node.line - 1] || '';
      const m = /^\s*(if|elif|while|for|def)\b\s*(.*?)\s*:\s*(?:#.*)?$/.exec(text);
      if (m) info[node.line] = { kind: m[1], cond: m[2], body: node.body[0] ? node.body[0].line : 0, name: node.name || null };
      visit(node.body);
      if (node.orelse) visit(node.orelse);
    }
  };
  visit(tree.body);
  return info;
}

/** For the first line under each `else:`, the line number of that `else:`. */
function elseLines(lines) {
  const map = {};
  lines.forEach((text, i) => {
    if (!/^\s*else\s*:\s*(#.*)?$/.test(text)) return;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() && !/^\s*#/.test(lines[j])) { map[j + 1] = i + 1; break; }
    }
  });
  return map;
}

/** New and changed variables between two snapshots. */
function changes(before, after) {
  const out = [];
  for (const name of Object.keys(after)) {
    if (!Object.prototype.hasOwnProperty.call(before, name)) out.push({ name, now: after[name], was: null });
    else if (before[name] !== after[name]) out.push({ name, now: after[name], was: before[name] });
  }
  return out;
}

export default function create(spec, env) {
  const source = clean(spec.code);
  const lines = source.split('\n');
  const result = run(source, { trace: true, maxTrace: 400, maxSteps: 100000 });
  const entries = result.trace || [];
  const info = blockInfo(source, lines);
  const elseOf = elseLines(lines);
  const asking = spec.ask === 'next' && !env.compact && entries.length > 1;
  const showOutput = spec.output !== false;
  const last = Math.max(0, entries.length - 1);
  const speed = spec.speed > 200 ? spec.speed : 1100;
  // In ask mode the learner also has to notice that the program is over.
  const mustTapEnd = asking && entries[last].event === 'end';

  let pos = Math.min(last, Math.max(0, spec.start | 0));
  let done = false;
  let misses = 0;
  let missesHere = 0;
  let wrongLine = -1; // ask mode: the line just tapped by mistake
  let hintLine = -1;  // ask mode: the line outlined as a hint
  let readOnly = !!env.readOnly;
  let timer = 0;
  let note = '';

  /* ---------------------------------------------------------------- code */
  const lineEls = lines.map((text, i) => {
    // In "be the computer" mode the lines are buttons, and a list may only hold list items.
    const li = h(asking ? 'div.pt-line' : 'li.pt-line', { dataset: { line: i + 1 } },
      h('span.pt-mark', { 'aria-hidden': 'true' }),
      h('span.pt-num', String(i + 1)),
      h('code', { html: highlight(text, 'python') || ' ' }),
    );
    return li;
  });
  const endEl = h('div.pt-line.pt-end', { dataset: { line: 0 } }, h('span.pt-mark', { 'aria-hidden': 'true' }), h('span.pt-num', ''), h('span', 'The program ends'));
  const codeEl = asking
    ? h('div.pt-code', { role: 'group', 'aria-label': 'Program. Choose the line that runs next.' }, lineEls, endEl)
    : h('ol.pt-code', { 'aria-label': 'Program' }, lineEls);

  if (env.compact || !entries.length) {
    const el = h('div', { class: env.compact ? 'is-compact' : null }, codeEl, !entries.length && result.error ? errorCard(result.error) : null);
    return { el, getState: () => ({ step: 0, steps: 0, done: false, atEnd: false, line: 0, misses: 0 }) };
  }

  /* --------------------------------------------------------------- pieces */
  const noteEl = h('div.pt-note', { 'aria-live': 'polite' });
  const countEl = h('span.pt-count');
  const varsBody = h('div.pt-box-body');
  const varsHead = h('div.pt-box-head', 'Variables');
  const outPre = h('pre.pt-out');
  const outBody = h('div.pt-box-body', outPre);
  const stateEl = h('div', { class: `pt-state${showOutput ? ' has-output' : ''}` },
    h('div.pt-box', varsHead, varsBody),
    showOutput ? h('div.pt-box', h('div.pt-box-head', 'Output so far'), outBody) : null,
  );
  const errorSlot = h('div');

  const mkBtn = (label, ic, fn, variant = '') => {
    const b = h('button', { type: 'button', class: `btn${variant ? ` btn-${variant}` : ''}` }, icon(ic, 16), label);
    b.addEventListener('click', () => { if (!readOnly) fn(); });
    return b;
  };
  const restartBtn = mkBtn('Restart', 'reset', () => { stopPlaying(); go(0, true); }, 'ghost');
  const backBtn = mkBtn('Back', 'arrow-left', () => { stopPlaying(); go(pos - 1, true); });
  const stepBtn = mkBtn('Step', 'arrow-right', () => { stopPlaying(); go(pos + 1, true); }, 'primary');
  const playBtn = mkBtn('Play', 'play', () => (timer ? stopPlaying() : startPlaying()));
  const bar = h('div.pt-bar', asking ? [restartBtn] : [stepBtn, backBtn, spec.autoplay === false ? null : playBtn, restartBtn], countEl);

  /* ------------------------------------------------------------ narration */
  const nextLineOf = (e) => (e.event === 'return' ? (e.callers[e.callers.length - 1] || 0) : e.event === 'end' ? 0 : e.line);

  function effects(prev, cur, sameScope) {
    const parts = [];
    const before = sameScope ? prev.vars : (prev.globals || prev.vars);
    const after = sameScope ? cur.vars : (cur.event === 'call' || cur.depth > 0 ? (cur.globals || {}) : cur.vars);
    const diff = changes(before, after).filter((c) => !/^<function /.test(c.now));
    const ids = sameScope || cur.depth === 0 ? cur.ids : (cur.globalIds || {});
    const shared = diff.filter((c) => ids[c.name] && diff.some((o) => o !== c && ids[o.name] === ids[c.name]));
    if (shared.length > 1) {
      parts.push(`${shared.map((c) => tick(c.name)).join(' and ')} are two names for **one** list, so both now show ${tick(shorten(shared[0].now))}.`);
    }
    for (const c of diff.filter((d) => !shared.includes(d)).slice(0, 3)) {
      parts.push(c.was === null ? `New variable: ${tick(c.name)} = ${tick(shorten(c.now))}.` : `${tick(c.name)} changes from ${tick(shorten(c.was, 24))} to ${tick(shorten(c.now, 24))}.`);
    }
    const printed = cur.stdout.slice(prev.stdout.length).replace(/\n$/, '');
    if (cur.stdout.length > prev.stdout.length) {
      const first = printed.split('\n')[0];
      parts.push(printed === '' ? 'It printed an empty line.' : `It printed ${tick(shorten(first))}${printed.includes('\n') ? ' and more' : ''}.`);
    }
    return parts;
  }

  /** What happened between two neighbouring steps, in a sentence or two. */
  function narrate(prev, cur, announceEnd = true) {
    const parts = [];
    if (prev.event === 'line') {
      const L = prev.line;
      const block = info[L];
      if (cur.event === 'call') {
        const args = Object.keys(cur.vars).map((k) => `${k} = ${cur.vars[k]}`).join(', ');
        parts.push(`Line ${L} calls ${tick(cur.func)}${args ? `, with ${tick(shorten(args))}` : ''}. Its body starts now.`);
      } else {
        const entered = block && cur.event === 'line' && cur.depth === prev.depth && cur.line === block.body;
        if (block && (block.kind === 'if' || block.kind === 'elif' || block.kind === 'while') && block.body !== L) {
          parts.push(`${tick(shorten(block.cond, 34))} is **${entered ? 'True' : 'False'}**, so ${entered ? 'the indented lines run' : block.kind === 'while' ? 'the loop is over' : 'the indented lines are skipped'}.`);
        } else if (block && block.kind === 'for' && block.body !== L) {
          const got = effects(prev, cur, true);
          parts.push(entered ? (got.length ? `Next item. ${got.join(' ')}` : 'Next item: the indented lines run again.') : 'No items are left, so the loop is over.');
        } else if (block && block.kind === 'def') {
          parts.push(`Python now knows a function called ${tick(block.name || '?')}. Its body waits until the function is called.`);
        } else {
          const got = effects(prev, cur, cur.depth === prev.depth);
          parts.push(got.length ? `Line ${L} ran. ${got.join(' ')}` : `Line ${L} ran.`);
        }
        if (cur.event === 'return') parts.push(cur.value === 'None' ? `${tick(cur.func)} is finished. It hands back nothing (\`None\`).` : `${tick(cur.func)} hands back ${tick(shorten(cur.value))}.`);
      }
    } else if (prev.event === 'call') {
      if (cur.event === 'return') parts.push(`${tick(cur.func)} is finished.`);
      else parts.push(`Inside ${tick(prev.func)}. Its own variables are listed separately.`);
    } else if (prev.event === 'return') {
      const back = prev.callers[prev.callers.length - 1];
      if (cur.event === 'call') parts.push(`Back on line ${back}, which now calls ${tick(cur.func)}.`);
      else {
        const got = cur.depth === 0 ? effects(prev, cur, false) : [];
        parts.push(`Back on line ${back}${got.length ? `. ${got.join(' ')}` : ', which finishes.'}`);
      }
    }
    if (cur.event === 'end' && announceEnd) parts.push('**The program is finished.**');
    if (cur.event === 'error') parts.push(`Line ${cur.line} cannot be carried out, so the program stops here.`);
    return parts.join(' ');
  }

  /* ---------------------------------------------------------------- render */
  function varTable(vars, ids, before, title) {
    const names = Object.keys(vars);
    const frag = [];
    if (title) frag.push(h('div.pt-scope', { html: mdInline(title) }));
    if (!names.length) { frag.push(h('div.pt-empty', title ? 'none yet' : 'No variables yet.')); return frag; }
    const table = h('table.pt-vars');
    for (const name of names) {
      const value = vars[name];
      const isFn = /^<function /.test(value);
      const isNew = before && !Object.prototype.hasOwnProperty.call(before, name);
      const changed = before && !isNew && before[name] !== value;
      const cell = h('td.pt-val');
      if (isFn) cell.appendChild(h('span.pt-fn', 'a function'));
      else cell.appendChild(h('b', value));
      if (isNew && !isFn) cell.appendChild(h('span.pt-tag.is-new', 'new'));
      if (changed) cell.appendChild(h('span.pt-tag.is-was', `was ${shorten(before[name], 20)}`));
      if (ids && ids[name]) {
        const twins = names.filter((other) => other !== name && ids[other] === ids[name]);
        if (twins.length) cell.appendChild(h('span.pt-tag.is-same', icon('link', 11), `same list as ${twins.join(', ')}`));
      }
      table.appendChild(h('tr', { class: isNew && !isFn ? 'is-new' : changed ? 'is-changed' : null }, h('th', { scope: 'row' }, name), h('td.pt-eq', '='), cell));
    }
    frag.push(table);
    return frag;
  }

  function render() {
    const cur = entries[pos];
    const prev = pos > 0 ? entries[pos - 1] : null;
    const atEnd = pos === last;
    const over = asking ? (atEnd && done) : atEnd; // nothing left to do
    const nextLine = atEnd && cur.event !== 'error' ? 0 : nextLineOf(cur);
    const ranLine = !prev ? 0 : prev.event === 'line' ? prev.line : prev.event === 'return' ? (prev.callers[prev.callers.length - 1] || 0) : 0;
    const waiting = new Set(cur.callers || []);

    lineEls.forEach((li, i) => {
      const n = i + 1;
      const isNext = !asking && n === nextLine && cur.event !== 'error';
      const failed = cur.event === 'error' && n === cur.line;
      const ran = n === ranLine && !isNext && !failed;
      li.className = `pt-line${isNext ? ' is-next' : ''}${ran ? ' is-ran' : ''}${failed ? ' is-failed' : ''}${waiting.has(n) && !isNext && !ran ? ' is-waiting' : ''}${n === wrongLine ? ' is-wrong' : ''}${n === hintLine ? ' is-hint' : ''}`;
      const mark = li.firstChild;
      mark.replaceChildren();
      if (failed) mark.appendChild(icon('x', { size: 16, stroke: 3 }));
      else if (isNext) mark.appendChild(icon('arrow-right', { size: 16, stroke: 3 }));
      else if (ran) mark.appendChild(icon('check', { size: 15, stroke: 3 }));
      else if (waiting.has(n)) mark.appendChild(icon('hourglass', 13));
      if (asking) { li.setAttribute('role', 'button'); li.setAttribute('tabindex', readOnly || over ? '-1' : '0'); }
    });
    if (asking) {
      const ended = over && cur.event === 'end';
      endEl.className = `pt-line pt-end${ended ? ' is-ran' : ''}${wrongLine === 0 ? ' is-wrong' : ''}${hintLine === 0 ? ' is-hint' : ''}`;
      endEl.firstChild.replaceChildren(ended ? icon('check', { size: 15, stroke: 3 }) : icon('square', 12));
      endEl.setAttribute('role', 'button');
      endEl.setAttribute('tabindex', readOnly || over ? '-1' : '0');
    }

    // variables
    const inFn = cur.depth > 0 && cur.func;
    const prevSame = prev && prev.depth === cur.depth && prev.func === cur.func ? prev.vars : null;
    varsBody.replaceChildren();
    if (inFn) {
      varsHead.replaceChildren('Variables');
      varsBody.append(...varTable(cur.vars, cur.ids, cur.event === 'call' ? {} : prevSame, `Inside \`${cur.func}\``));
      varsBody.append(...varTable(cur.globals || {}, cur.globalIds, prev ? (prev.globals || prev.vars) : null, 'In the main program'));
    } else {
      const before = prev ? (prev.depth === 0 ? prev.vars : (prev.globals || null)) : null;
      varsBody.append(...varTable(cur.vars, cur.ids, before, null));
    }

    // output
    if (showOutput) {
      const old = prev ? prev.stdout : '';
      outPre.replaceChildren();
      if (!cur.stdout) outBody.replaceChildren(h('div.pt-empty', 'Nothing printed yet.'));
      else {
        outPre.append(old, h('span.is-fresh', cur.stdout.slice(old.length).replace(/\n$/, '')), cur.stdout.length > old.length && cur.stdout.endsWith('\n') ? '\n' : '');
        outBody.replaceChildren(outPre);
        outPre.scrollTop = outPre.scrollHeight;
      }
    }

    // caption
    let text = note;
    let kind = '';
    if (!text) {
      if (pos === 0) text = asking ? '**Be the computer.** Tap the line that runs first.' : `Nothing has run yet. The arrow marks the line that runs next: press **Step**.`;
      else text = narrate(prev, cur, !asking || over);
      if (asking && !over && pos > 0) text += ' **Which line runs next?**';
      if (asking && !over) kind = 'is-prompt';
      if (atEnd && result.traceTruncated) text += ' (The program keeps going, but the tracer stops recording here.)';
    } else kind = 'is-miss';
    noteEl.className = `pt-note${kind ? ` ${kind}` : ''}`;
    noteEl.innerHTML = mdInline(text);
    errorSlot.replaceChildren(cur.event === 'error' && result.error ? errorCard(result.error) : '');

    countEl.textContent = `Step ${pos} of ${last}`;
    backBtn.disabled = readOnly || pos === 0;
    stepBtn.disabled = readOnly || atEnd;
    restartBtn.disabled = readOnly || pos === 0;
    playBtn.disabled = readOnly || atEnd;
    el.classList.toggle('is-finished', over);
    el.setAttribute('aria-label', `${spec.alt || 'Program tracer'}. Step ${pos} of ${last}${nextLine ? `, next line ${nextLine}` : ', finished'}.`);
  }

  function go(target, byLearner) {
    const next = Math.min(last, Math.max(0, target));
    if (next === pos && byLearner) return;
    pos = next;
    note = '';
    missesHere = 0;
    wrongLine = -1;
    hintLine = -1;
    if (pos === last && !mustTapEnd) done = true;
    render();
    if (byLearner) {
      play(pos === last ? 'drop' : 'tick');
      env.onChange(getState());
    }
  }

  /* --------------------------------------------------------------- playing */
  function stopPlaying() {
    if (!timer) return;
    clearTimeout(timer);
    timer = 0;
    playBtn.replaceChildren(icon('play', 16), 'Play');
  }
  function startPlaying() {
    if (pos === last) return;
    playBtn.replaceChildren(icon('pause', 16), 'Pause');
    const advance = () => {
      go(pos + 1, true);
      if (pos === last || readOnly) { stopPlaying(); return; }
      timer = setTimeout(advance, speed);
    };
    timer = setTimeout(advance, 250);
  }

  /* -------------------------------------------------------------- ask mode */
  /**
   * What the learner has to tap now. A step that only enters a function is
   * folded into the next line (the def line is accepted too); after a
   * return, the answer is the line that made the call.
   */
  function nextStop() {
    if (pos === last) return { index: last, accept: new Set([0]), line: 0, target: entries[last] };
    let j = pos;
    const accept = new Set();
    if (entries[j].event === 'call') { accept.add(entries[j].line); j += 1; }
    const target = entries[j];
    const line = target.event === 'return' ? (target.callers[target.callers.length - 1] || 0) : target.event === 'end' ? 0 : target.line;
    accept.add(line);
    if (target.event === 'line' && elseOf[line]) accept.add(elseOf[line]); // tapping the `else:` itself is fine
    return { index: j, accept, line, target };
  }

  function guess(line, li) {
    if (readOnly || (pos === last && done)) return;
    const stop = nextStop();
    if (stop.accept.has(line)) {
      const from = pos;
      const finishing = pos === last;
      pos = Math.min(last, stop.index + 1);
      if (finishing || (pos === last && !mustTapEnd)) done = true;
      // tell the whole story of the steps we pass through
      const story = [];
      for (let k = from + 1; k <= pos; k++) story.push(narrate(entries[k - 1], entries[k], done));
      note = '';
      missesHere = 0;
      wrongLine = -1;
      hintLine = -1;
      render();
      if (finishing) noteEl.innerHTML = mdInline('Right: no lines are left. **The program is finished.**');
      else {
        const text = story.filter(Boolean).join(' ');
        if (text) noteEl.innerHTML = mdInline(text + (done ? '' : ' **Which line runs next?**'));
      }
      play(done ? 'drop' : 'tick');
      env.onChange(getState());
      return;
    }
    misses += 1;
    missesHere += 1;
    wrongLine = line;
    const cur = entries[pos];
    const prev = pos > 0 ? entries[pos - 1] : null;
    const block = prev && prev.event === 'line' ? info[prev.line] : null;
    if (pos === 0) note = 'A program starts at the top: the first line runs first.';
    else if (pos === last) note = 'Not that one. Look below the last line: is there anything left to run?';
    else if (cur.event === 'call') note = `Not that one. Line ${prev.line} calls ${tick(cur.func)}, so Python jumps into the body of that function.`;
    else if (cur.event === 'return') note = `Not that one. ${tick(cur.func)} is finished, so Python goes back to the line that called it.`;
    else if (block && (block.kind === 'if' || block.kind === 'elif' || block.kind === 'while') && block.body !== prev.line) note = `Not that one. Line ${prev.line} asked a question: is ${tick(shorten(block.cond, 34))} True or False right now? Check the variables.`;
    else if (block && block.kind === 'for') note = `Not that one. Line ${prev.line} takes the next item — if there is one left.`;
    else if (block && block.kind === 'def') note = 'Not that one. A def line only remembers the function. Its body runs later, when the function is called.';
    else if (stop.line === 0) note = 'Not that one. Is there any line left to run?';
    else if (prev && stop.line <= prev.line) note = 'Not that one. After the last indented line, a loop jumps back up to its first line to check again.';
    else note = 'Not that one. Python moves on down the page — but it skips the branches that were not chosen.';
    if (missesHere >= 2) {
      hintLine = stop.line;
      note += ' It is the line with the dashed outline.';
    }
    li.classList.remove('is-wrong'); // restart the shake if the same line is tapped twice
    void li.offsetWidth;
    render();
    play('wrong');
    env.onChange(getState());
  }

  if (asking) {
    for (const li of [...lineEls, endEl]) {
      li.dataset.keys = 'own';
      li.addEventListener('click', () => guess(Number(li.dataset.line), li));
      li.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); guess(Number(li.dataset.line), li); }
      });
    }
  }

  const getState = () => ({
    step: pos,
    steps: last,
    done,
    atEnd: pos === last,
    line: pos === last ? 0 : nextLineOf(entries[pos]),
    misses,
  });

  const el = h('div', { class: asking ? 'is-asking' : null, role: 'group' }, codeEl, bar, noteEl, errorSlot, stateEl);
  if (readOnly) el.classList.add('is-readonly');
  if (pos === last && !mustTapEnd) done = true;
  render();

  return {
    el,
    getState,
    setState(next) {
      if (!next) return;
      stopPlaying();
      if (next.done || next.step === 'end') { done = true; go(last, false); }
      else if (Number.isFinite(next.step)) go(next.step, false);
      if (Number.isFinite(next.misses)) misses = next.misses;
    },
    setReadOnly(v) {
      readOnly = !!v;
      if (readOnly) stopPlaying();
      el.classList.toggle('is-readonly', readOnly);
      render();
    },
    destroy() { stopPlaying(); },
  };
}

export const examples = [
  { title: 'py-trace — step through a loop', spec: { type: 'py-trace', code: 'total = 0\nfor n in [1, 2, 3]:\n    total = total + n\nprint(total)' } },
  { title: 'py-trace — be the computer (tap the next line)', spec: { type: 'py-trace', ask: 'next', code: 'age = 12\nif age >= 13:\n    print("Teen ticket")\nelse:\n    print("Child ticket")\nprint("Enjoy the film")' } },
];
