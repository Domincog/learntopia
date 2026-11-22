/**
 * next-word — a language model small enough to read in full. It is built by
 * counting, in a handful of training sentences, which word follows which.
 * Pick a word, see the chances of every possible next word, and write text
 * one word at a time — choosing yourself or letting the model pick.
 *
 * {
 *   type: 'next-word',
 *   corpus: ['the cat sat on the mat', 'the dog sat on the rug'],   // the training text, one sentence per entry
 *   start: 'the',                 // the text begins with this word (or words: 'the doctor said')
 *   context: 1,                   // how many previous words the model looks at: 1 or 2
 *   temperature: { min: 0, max: 2, step: 0.5, value: 1 },   // the randomness slider (false: none; a number: fixed)
 *   maxWords: 12,                 // stop after this many words
 *   starters: true,               // show a row of words to start a new text with (or a list of words or phrases)
 *   showCorpus: true,             // show the training text, with the current word highlighted wherever it occurs
 *   pick: true,                   // tapping a bar adds that word
 *   auto: true,                   // show the "Model picks" button
 *   static: false,                // true: no controls at all, just the table for the starting text
 * }
 *
 * Randomness (often called temperature): the model's chance of picking a word
 * is proportional to count^(1 / randomness). At 1 that is simply the share of
 * the counts; below 1 likely words are favoured even more; at 0 it always
 * takes the most frequent word (the first one, if several tie); above 1 the
 * chances are flatter.
 *
 * State: { text, word, context, options, total, temperature, ended, full, modelPicks, ownPicks, novel, copied, repeats }
 *   text       — the words written so far ('.' marks the end of a sentence)
 *   options    — what may come next: [{ word, count, chance }], most frequent first
 *   total      — how often the current context occurs in the training text
 *   ended      — the last word is the full stop; full — maxWords reached
 *   modelPicks / ownPicks — how many words the model / the learner added
 *   copied     — the finished sentence is word for word one of the training sentences
 *   novel      — the sentence has ended and is not in the training text
 *   repeats    — some pair of neighbouring words occurs twice in the text (it is going round in circles)
 *
 * setState accepts { text: [...], temperature, modelPicks, ownPicks }.
 */
import { h, sliderRow, button, tidy, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('next-word', `
  .widget-next-word { gap: var(--s3); }
  .widget-next-word .w-nw-corpus {
    padding: var(--s3) var(--s4);
    border: var(--bw) solid var(--hair);
    border-radius: var(--r-lg);
    background: var(--sunken);
    line-height: 1.75;
  }
  .widget-next-word .w-nw-corpus p { margin: 0; }
  .widget-next-word .w-nw-corpus .is-ctx { background: var(--yellow-soft); box-shadow: 0 0 0 2px var(--yellow); border-radius: 4px; font-weight: 700; }
  .widget-next-word .w-nw-corpus .is-next { text-decoration: underline; text-decoration-color: var(--blue); text-decoration-thickness: 3px; text-underline-offset: 3px; font-weight: 700; }
  .widget-next-word .w-nw-head { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 2px; }
  .widget-next-word .w-nw-ask { font-weight: 700; }
  .widget-next-word .w-nw-ask b { background: var(--yellow-soft); box-shadow: 0 0 0 2px var(--yellow); border-radius: 4px; padding: 0 0.2em; }
  .widget-next-word .w-nw-bars { display: grid; gap: 6px; }
  .widget-next-word .w-nw-bar {
    display: grid;
    grid-template-columns: 4.2em minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--s3);
    width: 100%;
    min-height: 44px;
    padding: 4px 10px;
    border: var(--bw) solid var(--edge);
    border-radius: var(--r);
    background: var(--surface);
    color: var(--ink);
    text-align: left;
    font-weight: 700;
    -webkit-tap-highlight-color: transparent;
    transition: background-color 0.12s ease, transform 0.08s ease;
  }
  .widget-next-word button.w-nw-bar:hover { background: var(--blue-soft); }
  .widget-next-word button.w-nw-bar:active { transform: scale(0.985); }
  .widget-next-word .w-nw-bar[disabled] { opacity: 0.55; pointer-events: none; }
  .widget-next-word .w-nw-bar.is-picked { border-color: var(--blue); box-shadow: 0 0 0 2px var(--blue); }
  .widget-next-word .w-nw-track { height: 16px; border-radius: 999px; background: var(--sunken); border: var(--bw) solid var(--edge); overflow: hidden; }
  .widget-next-word .w-nw-track i { display: block; height: 100%; background: var(--blue); border-radius: 999px; transition: width 0.25s var(--ease-out); }
  .widget-next-word .w-nw-num { font-family: var(--font-mono); font-size: var(--fs-sm); font-variant-numeric: tabular-nums; white-space: nowrap; text-align: right; }
  .widget-next-word .w-nw-num small { color: var(--ink-3); font-weight: 600; font-size: inherit; }
  .widget-next-word .w-nw-note { color: var(--ink-2); font-weight: 600; padding: var(--s2) 0; }
  /* on a short laptop screen the training text, the bars and the buttons have to share one view */
  @media (min-width: 700px) and (max-height: 820px) {
    .widget-next-word { gap: var(--s2); }
    .widget-next-word .w-nw-corpus { columns: 2; column-gap: var(--s5); padding: var(--s2) var(--s4); line-height: 1.65; }
    .widget-next-word .w-nw-corpus p { break-inside: avoid; }
    .widget-next-word .w-nw-bar { min-height: 36px; padding: 2px 10px; }
    .widget-next-word .w-nw-text { min-height: 46px; padding: var(--s2) var(--s4); }
  }
  .widget-next-word .w-nw-text {
    min-height: 56px;
    padding: var(--s3) var(--s4);
    border: var(--bw) solid var(--edge);
    border-radius: var(--r-lg);
    background: var(--surface);
    font-size: var(--fs-xl);
    font-weight: 700;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .widget-next-word .w-nw-text .is-last { background: var(--yellow-soft); box-shadow: 0 0 0 2px var(--yellow); border-radius: 4px; padding: 0 0.15em; }
  .widget-next-word .w-nw-text .is-caret { display: inline-block; width: 3px; height: 1.1em; margin-left: 4px; vertical-align: text-bottom; background: var(--ink-3); }
  .widget-next-word .w-nw-starters { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .widget-next-word .w-nw-starters .filter { min-height: 40px; padding: 0.2rem 0.75rem; }
  .widget-next-word .w-nw-temp { font-size: var(--fs-sm); color: var(--ink-2); font-weight: 600; text-align: center; }
  .widget-next-word .btn-ghost.btn-sm { box-shadow: none; }
  .widget-next-word .btn-sm { min-height: 40px; }
  .widget-next-word.is-readonly .w-nw-starters .filter { pointer-events: none; opacity: 0.6; }
`);

const END = '.';
const tokenize = (sentence) => {
  const words = String(sentence).toLowerCase().replace(/[.!?]+\s*$/, '').split(/\s+/).filter(Boolean);
  words.push(END);
  return words;
};

export default function create(spec, env) {
  const sentences = (spec.corpus || []).map(tokenize);
  const order = Math.max(1, Math.min(2, spec.context || 1));
  const maxWords = spec.maxWords || 12;
  const tempDef = spec.temperature === false || typeof spec.temperature === 'number'
    ? null
    : { min: 0, max: 2, step: 0.5, value: 1, ...(spec.temperature || {}) };
  let temperature = typeof spec.temperature === 'number' ? spec.temperature : (tempDef ? tempDef.value : 1);
  const interactive = !env.compact && !spec.static;
  let readOnly = !!env.readOnly;

  /* --------------------------------------------------- the count tables */
  // tables[k] maps a k-word context ("sat on") to { next word: count }, in order of first appearance
  const tables = { 1: new Map(), 2: new Map() };
  const vocab = [];
  for (const words of sentences) {
    words.forEach((word, i) => {
      if (word !== END && !vocab.includes(word)) vocab.push(word);
      for (const k of [1, 2]) {
        if (i < k) continue;
        const key = words.slice(i - k, i).join(' ');
        if (!tables[k].has(key)) tables[k].set(key, new Map());
        const row = tables[k].get(key);
        row.set(word, (row.get(word) || 0) + 1);
      }
    });
  }

  const startWords = String(spec.start || vocab[0] || '').toLowerCase().split(/\s+/).filter(Boolean);
  let text = startWords.slice();
  let modelPicks = 0;
  let ownPicks = 0;
  let lastAdded = null;

  /** The context the model uses now, and the table row for it. */
  function lookup(words = text) {
    for (let k = Math.min(order, words.length); k >= 1; k--) {
      const key = words.slice(-k).join(' ');
      if (tables[k].has(key)) return { key, k, row: tables[k].get(key) };
    }
    return { key: words.slice(-1).join(' '), k: 1, row: new Map() };
  }
  function options() {
    const { row } = lookup();
    const list = Array.from(row, ([word, count]) => ({ word, count }));
    const total = list.reduce((t, o) => t + o.count, 0);
    if (!list.length) return { list, total };
    if (temperature <= 0) {
      const top = Math.max(...list.map((o) => o.count));
      const first = list.findIndex((o) => o.count === top);
      list.forEach((o, i) => { o.chance = i === first ? 1 : 0; });
    } else {
      const raised = list.map((o) => Math.pow(o.count, 1 / temperature));
      const sum = raised.reduce((t, v) => t + v, 0);
      list.forEach((o, i) => { o.chance = raised[i] / sum; });
    }
    list.sort((p, q) => q.count - p.count);     // stable: ties keep their order of first appearance
    return { list, total };
  }
  const ended = () => text[text.length - 1] === END;
  const full = () => !ended() && text.length >= maxWords;

  function add(word, byModel) {
    if (readOnly || ended() || full()) return;
    text.push(word);
    lastAdded = word;
    if (byModel) modelPicks += 1; else ownPicks += 1;
    play(word === END ? 'drop' : 'tap');
    render();
    env.announce(word === END ? 'The sentence has ended.' : `Added ${word}.`);
    env.onChange(getState());
  }
  function modelPick() {
    const { list } = options();
    if (!list.length) return;
    let r = env.rng.next();
    let choice = list[list.length - 1];
    for (const o of list) { r -= o.chance; if (r < 0) { choice = o; break; } }
    add(choice.word, true);
  }
  function restart(words) {
    if (readOnly) return;
    text = words.slice();
    modelPicks = 0;
    ownPicks = 0;
    lastAdded = null;
    play('select');
    render();
    env.onChange(getState());
  }

  /* ------------------------------------------------------------- layout */
  const el = h('div.w-frame');
  const corpusBox = h('div.w-nw-corpus');
  const ask = h('div.w-nw-ask');
  const bars = h('div.w-nw-bars');
  const textBox = h('div.w-nw-text', { 'aria-live': 'polite', 'aria-label': 'The text so far' });
  const tempNote = h('div.w-nw-temp');
  const controls = h('div.w-controls');
  const buttonRow = h('div.w-buttons');
  const starters = h('div.w-nw-starters');

  if (spec.showCorpus !== false && !env.compact) el.appendChild(h('div', h('div.w-nw-head', 'Training text'), corpusBox));
  el.appendChild(h('div', h('div.w-nw-head', 'The text so far'), textBox));
  el.appendChild(h('div', ask, bars));

  let slider = null;
  if (tempDef && interactive) {
    slider = sliderRow({
      label: 'randomness', min: tempDef.min, max: tempDef.max, step: tempDef.step, value: temperature, color: 'violet',
      onInput: (v) => { temperature = v; render(); env.onChange(getState()); },
    });
    controls.append(slider.el, tempNote);
    el.appendChild(controls);
  }
  const autoBtn = button('Model picks', () => modelPick(), { icon: 'dice', variant: 'primary' });
  const undoBtn = button('Undo', () => {
    if (readOnly || text.length <= startWords.length) return;
    text.pop();
    lastAdded = null;
    render();
    env.onChange(getState());
  }, { icon: 'undo', variant: 'ghost' });
  const againBtn = button('Start over', () => restart(startWords), { icon: 'reset', variant: 'ghost' });
  const canWrite = spec.pick !== false || spec.auto !== false;
  if (interactive && canWrite) {
    if (spec.auto !== false) buttonRow.appendChild(autoBtn);
    buttonRow.append(undoBtn, againBtn);
    el.appendChild(buttonRow);
  }
  // starting points: single words by default, or phrases such as 'the doctor said'
  const starterWords = Array.isArray(spec.starters) ? spec.starters.map((w) => String(w).toLowerCase().trim()) : (spec.starters === false ? [] : vocab);
  const starterBtns = [];
  if (interactive && spec.starters !== false && starterWords.length > 1) {
    starters.appendChild(h('span.w-nw-head', { style: { margin: 0 } }, 'Start with'));
    for (const phrase of starterWords) {
      const btn = h('button.filter', { type: 'button', 'aria-pressed': 'false' }, phrase);
      btn.addEventListener('click', () => restart(phrase.split(/\s+/)));
      starterBtns.push({ phrase, btn });
      starters.appendChild(btn);
    }
    el.appendChild(starters);
  }

  /* ------------------------------------------------------------ render */
  const pct = (v) => `${Math.round(v * 100)}%`;
  const show = (word) => (word === END ? '. (end)' : word);
  const say = (word) => (word === END ? 'end of sentence' : word);

  function renderCorpus() {
    const { key, k } = lookup();
    const ctx = ended() ? [] : key.split(' ');
    corpusBox.replaceChildren(...sentences.map((words) => {
      const p = h('p');
      const marks = new Array(words.length).fill('');
      if (ctx.length && ctx[0]) {
        for (let i = 0; i + k <= words.length; i++) {
          if (words.slice(i, i + k).join(' ') !== key) continue;
          for (let j = i; j < i + k; j++) marks[j] = 'is-ctx';
          if (i + k < words.length && marks[i + k] !== 'is-ctx') marks[i + k] = 'is-next';
        }
      }
      words.forEach((word, i) => {
        if (word === END) { p.appendChild(marks[i] ? h(`span.${marks[i]}`, '.') : document.createTextNode('.')); return; }
        if (i > 0) p.appendChild(document.createTextNode(' '));
        p.appendChild(marks[i] ? h(`span.${marks[i]}`, word) : document.createTextNode(word));
      });
      return p;
    }));
  }

  function render() {
    renderCorpus();
    // the text so far
    const kids = [];
    text.forEach((word, i) => {
      const last = i === text.length - 1;
      if (word === END) { kids.push(h('span', { class: last ? 'is-last' : '' }, '.')); return; }
      if (i > 0) kids.push(' ');
      kids.push(last ? h('span.is-last', word) : word);
    });
    if (!ended() && !full()) kids.push(h('span.is-caret', { 'aria-hidden': 'true' }));
    textBox.replaceChildren(...kids);

    // what can come next
    const { list, total } = options();
    const { key } = lookup();
    bars.replaceChildren();
    if (ended()) {
      ask.textContent = '';
      bars.appendChild(h('div.w-nw-note', 'The sentence has ended. Start over to write another.'));
    } else if (full()) {
      ask.textContent = '';
      bars.appendChild(h('div.w-nw-note', `That is ${maxWords} words without reaching a full stop. Start over to try again.`));
    } else if (!list.length) {
      ask.textContent = '';
      bars.appendChild(h('div.w-nw-note', `The training text never shows what follows “${key}”, so the model has nothing to go on.`));
    } else {
      ask.replaceChildren('After ', h('b', key), `, the training text goes on with:`);
      for (const o of list) {
        const canPick = interactive && spec.pick !== false;
        const row = h(canPick ? 'button.w-nw-bar' : 'div.w-nw-bar', canPick ? { type: 'button' } : null,
          h('span', show(o.word)),
          h('span.w-nw-track', h('i', { style: { width: `${Math.max(o.chance * 100, o.chance > 0 ? 3 : 0)}%` } })),
          h('span.w-nw-num', h('small', `${o.count} of ${total} · `), pct(o.chance)),
        );
        if (canPick) {
          row.setAttribute('aria-label', `${say(o.word)}: follows ${o.count} of ${total} times, chance ${pct(o.chance)}. Add it to the text.`);
          row.disabled = readOnly;
          row.addEventListener('click', () => add(o.word, false));
        }
        bars.appendChild(row);
      }
    }

    if (slider) {
      tempNote.textContent = temperature <= 0 ? 'Randomness 0: always the most frequent word.'
        : temperature < 1 ? 'Below 1: frequent words are favoured even more.'
          : temperature === 1 ? 'Randomness 1: chances match the counts.'
            : 'Above 1: rarer words get more of a chance.';
    }
    const stop = readOnly || ended() || full() || !list.length;
    autoBtn.disabled = stop;
    undoBtn.disabled = readOnly || text.length <= startWords.length;
    againBtn.disabled = readOnly || (text.length === startWords.length && text.every((w, i) => w === startWords[i]));
    for (const { phrase, btn } of starterBtns) btn.setAttribute('aria-pressed', String(text.join(' ') === phrase));
    void lastAdded;
  }

  function getState() {
    const { list, total } = options();
    const { key } = lookup();
    const sentence = text.join(' ');
    const copied = ended() && sentences.some((words) => words.join(' ') === sentence);
    const pairs = new Set();
    let repeats = false;
    for (let i = 1; i < text.length; i++) {
      const pair = `${text[i - 1]} ${text[i]}`;
      if (pairs.has(pair)) repeats = true;
      pairs.add(pair);
    }
    return {
      text: text.slice(),
      word: text[text.length - 1] || '',
      context: key,
      options: list.map((o) => ({ word: o.word, count: o.count, chance: tidy(o.chance, 4) })),
      total,
      temperature,
      ended: ended(),
      full: full(),
      modelPicks,
      ownPicks,
      copied,
      novel: ended() && !copied,
      repeats,
    };
  }

  render();
  if (readOnly) el.classList.add('is-readonly');

  return {
    el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.temperature === 'number') { temperature = next.temperature; if (slider) slider.set(temperature); }
      if (Array.isArray(next.text)) {
        text = next.text.map((w) => String(w).toLowerCase());
        ownPicks = Number.isInteger(next.ownPicks) ? next.ownPicks : Math.max(0, text.length - startWords.length);
        modelPicks = Number.isInteger(next.modelPicks) ? next.modelPicks : 0;
        if (Number.isInteger(next.modelPicks) && !Number.isInteger(next.ownPicks)) ownPicks = Math.max(0, text.length - startWords.length - modelPicks);
      }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      render();
    },
  };
}

export const examples = [
  {
    title: 'next-word — a model you can read in full',
    spec: {
      type: 'next-word', start: 'the',
      corpus: ['the cat sat on the mat', 'the dog sat on the mat', 'the cat saw the dog', 'the dog saw the cat', 'the cat sat on the rug'],
    },
  },
  {
    title: 'next-word — two words of context, no randomness slider',
    spec: {
      type: 'next-word', start: 'the doctor said', context: 2, temperature: false, starters: false,
      corpus: ['the doctor said he was late', 'the doctor said he was busy', 'the doctor said he would call', 'the doctor said she was busy', 'the nurse said she was late', 'the nurse said she would call'],
    },
  },
];
