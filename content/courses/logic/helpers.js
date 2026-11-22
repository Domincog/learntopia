/**
 * Logic & Deduction · shared puzzle data, solvers and checkers.
 *
 * Every puzzle in this course is defined here as data plus small predicate
 * functions, so that it can be solved by brute force. tests/logic-course.test.mjs
 * runs those solvers and fails if any puzzle stops having exactly one answer.
 */

/* ------------------------------------------------------------------- text */

/**
 * Join blocks of lesson text with blank lines between them. Use this in
 * generators instead of interpolating multi-line strings into an indented
 * template literal, which would spoil the markdown indentation.
 */
export const blocks = (...parts) => parts.filter(Boolean).join('\n\n');

/** A markdown bullet list. */
export const bullets = (items) => items.map((item) => `- ${item}`).join('\n');

/* ------------------------------------------------------------------ grids */

/** All orderings of 0 … n-1. */
export function permutations(n) {
  const out = [];
  const walk = (prefix, rest) => {
    if (!rest.length) { out.push(prefix); return; }
    rest.forEach((v, i) => walk([...prefix, v], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  walk([], Array.from({ length: n }, (_, i) => i));
  return out;
}

/**
 * A grid puzzle pairs each row with exactly one column. An assignment is an
 * array `a` where a[r] is the column index paired with row r. A clue is
 * { text, holds(a) }: `holds` says whether a COMPLETE assignment obeys it.
 */
export const solutionsOf = (puzzle) =>
  permutations(puzzle.rows.length).filter((a) => puzzle.clues.every((c) => c.holds(a)));

/** The one solution of a puzzle (throws if it is not unique). */
export function solve(puzzle) {
  const all = solutionsOf(puzzle);
  if (all.length !== 1) throw new Error(`puzzle has ${all.length} solutions, expected exactly 1`);
  return all[0];
}

/** Lesson 1, puzzle 1: three friends, three pets. */
export const PETS = {
  rows: ['Ana', 'Ben', 'Cy'],
  cols: ['Cat', 'Dog', 'Fish'],
  clues: [
    { text: 'Ana is allergic to cats.', holds: (a) => a[0] !== 0 },
    { text: 'Ben’s pet has no legs.', holds: (a) => a[1] === 2 },
  ],
};

/** Lesson 1, puzzle 2: who plays what? Needs the column rule. */
export const BAND = {
  rows: ['Dev', 'Eva', 'Finn'],
  cols: ['Drums', 'Flute', 'Piano'],
  clues: [
    { text: 'Dev lives next door to the drummer.', holds: (a) => a[0] !== 0 },
    { text: 'Finn sat beside the drummer on the bus.', holds: (a) => a[2] !== 0 },
    { text: 'Finn is taller than the flute player.', holds: (a) => a[2] !== 1 },
  ],
};

/** Lesson 1, puzzle 3: a four-runner race with ordering clues. */
export const RACE = {
  rows: ['Ali', 'Bea', 'Cal', 'Dee'],
  cols: ['1st', '2nd', '3rd', '4th'],
  clues: [
    { text: 'Ali did not finish first or last.', holds: (a) => a[0] !== 0 && a[0] !== 3 },
    { text: 'Bea finished immediately after Dee.', holds: (a) => a[1] === a[3] + 1 },
    { text: 'Cal finished ahead of Ali.', holds: (a) => a[2] < a[0] },
  ],
};

/** Widget spec for a grid puzzle. */
export const gridWidget = (puzzle, extra = {}) => ({
  type: 'logic-grid',
  rows: puzzle.rows,
  cols: puzzle.cols,
  clues: puzzle.clues.map((c) => c.text),
  solution: solve(puzzle),
  ...extra,
});

/** `solution` for an interact step that uses gridWidget(). */
export const gridSolution = (puzzle) => ({ ticks: solve(puzzle) });

/**
 * Build the `check` for a grid puzzle. Feedback, in order of usefulness:
 * ticks that break one particular clue, a tick that leads to a dead end,
 * a cross that no clue supports, then "keep going".
 */
export function gridCheck(puzzle) {
  const n = puzzle.rows.length;
  const perms = permutations(n);
  return (s) => {
    if (s.solved) return true;
    const ticks = s.ticks || [];
    const fits = perms.filter((p) => ticks.every((c, r) => c == null || p[r] === c));
    const broken = puzzle.clues.findIndex((clue) => !fits.some((p) => clue.holds(p)));
    if (broken >= 0) return `With these ticks, clue ${broken + 1} can no longer be true: “${puzzle.clues[broken].text}” Take a tick back and look again.`;
    if (s.wrong && s.wrong.length) {
      return `The tick in ${puzzle.rows[s.wrong[0]]}’s row cannot be right. Follow it through the clues and you reach a dead end. Take it back.`;
    }
    if (s.badCrosses && s.badCrosses.length) {
      const [r] = s.badCrosses[0];
      return `One of the crosses in ${puzzle.rows[r]}’s row has no clue behind it. Only cross out what a clue (or a tick) rules out.`;
    }
    const missing = ticks.filter((c) => c == null).length || n;
    return `${missing === 1 ? 'One row still needs' : `${missing} rows still need`} a tick. Look for a row or column with only one open square.`;
  };
}

const MINI_NAMES = [
  ['Ana', 'Ben', 'Cy'], ['Mia', 'Noah', 'Omar'], ['Lena', 'Raj', 'Tess'], ['Kofi', 'Yuki', 'Zara'], ['Iris', 'Jon', 'Kai'],
];
const MINI_THEMES = [
  {
    items: ['cat', 'dog', 'parrot'],
    intro: 'each own one pet: a cat, a dog and a parrot',
    pos: (who, what) => `${who} owns the ${what}`,
    neg: (who, what) => `${who} does not own the ${what}`,
    ask: (what) => `Who owns the ${what}?`,
  },
  {
    items: ['drums', 'flute', 'piano'],
    intro: 'each play one instrument: the drums, the flute and the piano',
    pos: (who, what) => `${who} plays the ${what}`,
    neg: (who, what) => `${who} does not play the ${what}`,
    ask: (what) => `Who plays the ${what}?`,
  },
  {
    items: ['soup', 'pasta', 'curry'],
    intro: 'each ordered one dish: the soup, the pasta and the curry',
    pos: (who, what) => `${who} ordered the ${what}`,
    neg: (who, what) => `${who} did not order the ${what}`,
    ask: (what) => `Who ordered the ${what}?`,
  },
  {
    items: ['door', 'fence', 'gate'],
    intro: 'each painted one thing: the door, the fence and the gate',
    pos: (who, what) => `${who} painted the ${what}`,
    neg: (who, what) => `${who} did not paint the ${what}`,
    ask: (what) => `Who painted the ${what}?`,
  },
];

/**
 * A random cast for small generated questions: three people (A, B, C in a
 * random order), three things (x, y, z), and sentence builders.
 */
export function miniCast(rng) {
  const [A, B, C] = rng.shuffle(rng.pick(MINI_NAMES));
  const theme = rng.pick(MINI_THEMES);
  const [x, y, z] = rng.shuffle(theme.items);
  const names = [A, B, C].slice().sort();
  return { A, B, C, x, y, z, names, intro: `${names[0]}, ${names[1]} and ${names[2]} ${theme.intro}.`, pos: theme.pos, neg: theme.neg, ask: theme.ask };
}

/**
 * A small generated puzzle that can be solved in your head: three people,
 * three things, three "not" clues. Returns the story, the clues, the
 * question, the answer and the reasoning, plus a `puzzle` object so the
 * brute-force test can confirm the answer is forced.
 */
export function miniPuzzle(rng) {
  const cast = miniCast(rng);
  const { A, B, C, x, y, z } = cast; // the truth: C goes with x, B with y, A with z
  const items = [x, y, z];
  const idx = (what) => items.indexOf(what);
  const clue = (row, who, what) => ({ text: `${cast.neg(who, what)}.`, holds: (a) => a[row] !== idx(what) });
  let clues;
  let why;
  if (rng.bool()) {
    // x is ruled out for two people, so the third has it; then A is pinned down
    clues = [clue(0, A, x), clue(1, B, x), clue(0, A, y)];
    why = `The ${x} is ruled out for both ${A} and ${B}, so it goes with ${C}. For ${A}, the ${x} and the ${y} are both ruled out, which leaves the ${z}. The only thing left for ${B} is the ${y}.`;
  } else {
    // B is ruled out twice, which fixes B; the rest follows
    clues = [clue(0, A, x), clue(1, B, x), clue(1, B, z)];
    why = `For ${B}, the ${x} and the ${z} are both ruled out, so ${B} goes with the ${y}. The ${x} is ruled out for ${A} and ${B}, so it goes with ${C}. That leaves the ${z} for ${A}.`;
  }
  const askCol = rng.int(0, 2);
  const truth = [idx(z), idx(y), idx(x)]; // rows A, B, C
  const answerRow = truth.indexOf(askCol);
  return {
    names: cast.names,
    intro: cast.intro,
    clues: rng.shuffle(clues).map((c) => c.text),
    question: cast.ask(items[askCol]),
    answer: [A, B, C][answerRow],
    why,
    puzzle: { rows: [A, B, C], cols: items, clues },
    answerRow,
    askCol,
  };
}

/* ------------------------------------------------------- knights & liars */

/**
 * Islanders are { name, says, claim }. `claim(k)` is the truth of what they
 * say in a world `k`, an array of booleans (k[i] is true when islander i is
 * a knight). A world is possible when every knight's claim is true and
 * every liar's claim is false. Islanders without a claim say nothing.
 */
export function possibleWorlds(people) {
  const n = people.length;
  const out = [];
  for (let m = 0; m < 1 << n; m++) {
    const k = people.map((_, i) => !!(m & (1 << (n - 1 - i))));
    if (people.every((p, i) => !p.claim || !!p.claim(k) === k[i])) out.push(k);
  }
  return out;
}

/** "I am a knight" fits everyone; "I am a liar" fits no one. */
export const ISLAND_SELF = [
  { name: 'Ada', says: 'I am a knight.', claim: (k) => k[0] },
  { name: 'Bram', says: 'I am a liar.', claim: (k) => !k[1] },
];

/** The classic: "We are both liars." */
export const ISLAND_BOTH = [
  { name: 'Cleo', says: 'We are both liars.', claim: (k) => !k[0] && !k[1] },
  { name: 'Dax', says: null },
];

/**
 * Worked example for the "two worlds survive" teaching screen: each calls the
 * other a liar. Both mixed worlds fit, so only "one of each" is certain.
 * (The names are not in the lesson's PAIRS, so no generated question repeats it.)
 */
export const ISLAND_FEUD = [
  { name: 'Tor', says: 'Ulla is a liar.', claim: (k) => !k[1] },
  { name: 'Ulla', says: 'Tor is a liar.', claim: (k) => !k[0] },
];

/** Three islanders, one possible world. */
export const ISLAND_THREE = [
  { name: 'Edda', says: 'Finn is a liar.', claim: (k) => !k[1] },
  { name: 'Finn', says: 'Gus is a liar.', claim: (k) => !k[2] },
  { name: 'Gus', says: 'Edda and Finn are both liars.', claim: (k) => !k[0] && !k[1] },
];

/** Widget spec + solution for an island with exactly one possible world. */
export const islandWidget = (people, extra = {}) => ({ type: 'truth-check', people, ...extra });
export function islandSolution(people) {
  const worlds = possibleWorlds(people);
  if (worlds.length !== 1) throw new Error(`island has ${worlds.length} possible worlds, expected exactly 1`);
  return { types: worlds[0].map((isKnight) => (isKnight ? 'knight' : 'liar')) };
}

/** Feedback for an island puzzle: name the first contradiction. */
export function islandCheck(people) {
  return (s) => {
    if (s.consistent) return true;
    if (!s.assigned) return 'Decide for everyone first: knight or liar?';
    const i = s.fits.findIndex((f) => f === false);
    if (i < 0) return false;
    const p = people[i];
    return s.types[i] === 'knight'
      ? `You made ${p.name} a knight, but in this world “${p.says}” is false. A knight cannot say that. Change something.`
      : `You made ${p.name} a liar, but in this world “${p.says}” is true. A liar cannot say that. Change something.`;
  };
}

/* ------------------------------------------------------------ if … then */

const face = (text, sub) => ({ text: String(text), sub });

/**
 * Selection-task stories. Each makes four cards: P (the "if" part is
 * true), notP, Q (the "then" part is true) and notQ. Only P and notQ can
 * hide a broken rule, so those are the two that must be turned over.
 */
const WASON_STORIES = [
  (rng) => {
    const breaks = rng.bool(0.6);
    return {
      about: 'Each card has a letter on one side and a number on the other.',
      rule: 'If a card has a vowel on one side, then it has an even number on the other.',
      ifPart: 'a vowel',
      P: { front: rng.pick(['A', 'E', 'U']), back: rng.pick([2, 6, 8]), note: 'A vowel, so the number behind it mattered. It is even: fine.' },
      notP: { front: rng.pick(['D', 'K', 'M', 'T']), back: rng.pick([1, 4, 7]), note: 'A consonant. The rule promises nothing about consonants.' },
      Q: { front: rng.pick([2, 4, 8]), back: rng.pick(['B', 'G', 'R']), note: 'An even number. Whatever letter is behind it, the rule is safe.' },
      notQ: breaks
        ? { front: rng.pick([3, 5, 9]), back: rng.pick(['A', 'E', 'U']), note: 'An odd number with a vowel behind it. **The rule is broken.**', breaks: true }
        : { front: rng.pick([3, 5, 9]), back: rng.pick(['H', 'N', 'S']), note: 'An odd number, so a vowel behind it would have broken the rule. It is a consonant: safe.' },
    };
  },
  (rng) => {
    const breaks = rng.bool(0.6);
    return {
      about: 'Each card is a parcel. One side shows where it is going, the other shows whether it has a customs form.',
      rule: 'If a parcel is going abroad, then it has a customs form.',
      ifPart: 'a parcel going abroad',
      P: { front: face('Abroad', 'going'), back: face('Form', 'customs'), note: 'Going abroad, so the form mattered. It is there: fine.' },
      notP: { front: face('Local', 'going'), back: face('No form', 'customs'), note: 'A local parcel. The rule promises nothing about those.' },
      Q: { front: face('Form', 'customs'), back: face('Local', 'going'), note: 'It has a form. Wherever it is going, the rule is safe.' },
      notQ: breaks
        ? { front: face('No form', 'customs'), back: face('Abroad', 'going'), note: 'No form, and it is going abroad. **The rule is broken.**', breaks: true }
        : { front: face('No form', 'customs'), back: face('Local', 'going'), note: 'No form, so “abroad” would have broken the rule. It is local: safe.' },
    };
  },
  (rng) => {
    const breaks = rng.bool(0.6);
    return {
      about: 'Each card is a child at the playground. One side shows where they are playing, the other shows their age.',
      rule: 'If a child is on the big slide, then they are at least 6 years old.',
      ifPart: 'a child on the big slide',
      P: { front: face('Slide', 'playing on'), back: face(rng.pick([7, 9, 10]), 'age'), note: 'On the slide, so the age mattered. Old enough: fine.' },
      notP: { front: face('Sandpit', 'playing in'), back: face(rng.pick([3, 5, 8]), 'age'), note: 'In the sandpit. The rule promises nothing about the sandpit.' },
      Q: { front: face(rng.pick([8, 11]), 'age'), back: face('Sandpit', 'playing in'), note: 'Old enough for anything. Wherever they are playing, the rule is safe.' },
      notQ: breaks
        ? { front: face(rng.pick([3, 4, 5]), 'age'), back: face('Slide', 'playing on'), note: 'Too young, and on the big slide. **The rule is broken.**', breaks: true }
        : { front: face(rng.pick([3, 4, 5]), 'age'), back: face('Sandpit', 'playing in'), note: 'Too young for the slide, so that had to be checked. In the sandpit: safe.' },
    };
  },
  (rng) => {
    const breaks = rng.bool(0.6);
    return {
      about: 'Each card is a library book. One side shows its shelf, the other shows the colour of its label.',
      rule: 'If a book is on the top shelf, then it has a red label.',
      ifPart: 'a book on the top shelf',
      P: { front: face('Top', 'shelf'), back: face('Red', 'label'), note: 'On the top shelf, so the label mattered. It is red: fine.' },
      notP: { front: face('Bottom', 'shelf'), back: face(rng.pick(['Blue', 'Red']), 'label'), note: 'On the bottom shelf. The rule promises nothing about that shelf.' },
      Q: { front: face('Red', 'label'), back: face('Bottom', 'shelf'), note: 'A red label. Whichever shelf it is on, the rule is safe.' },
      notQ: breaks
        ? { front: face('Blue', 'label'), back: face('Top', 'shelf'), note: 'A blue label on the top shelf. **The rule is broken.**', breaks: true }
        : { front: face('Blue', 'label'), back: face('Bottom', 'shelf'), note: 'A blue label, so “top shelf” would have broken the rule. Bottom shelf: safe.' },
    };
  },
];

/**
 * A generated selection task: step fields for an `interact` step that uses
 * the wason-cards widget (text, widget, check, solution, explain).
 */
export function wasonTask(rng) {
  const story = rng.pick(WASON_STORIES)(rng);
  const roles = rng.shuffle(['P', 'notP', 'Q', 'notQ']);
  const cards = roles.map((role) => {
    const c = story[role];
    return { ...c, front: typeof c.front === 'object' ? c.front : String(c.front), back: typeof c.back === 'object' ? c.back : String(c.back) };
  });
  const at = (role) => roles.indexOf(role);
  const label = (role) => { const f = story[role].front; return typeof f === 'object' ? f.text : String(f); };
  const solution = [at('P'), at('notQ')].sort((a, b) => a - b);
  return {
    roles,
    solutionIndices: solution,
    text: `
      ${story.about} Someone claims that this rule holds for all four cards.

      **Which cards must you turn over to test the claim?** Choose only the ones you need.
    `,
    widget: { type: 'wason-cards', rule: story.rule, cards },
    solution: { selected: solution },
    check: (s) => {
      const has = (role) => s.selected.includes(at(role));
      if (has('notP')) return `The rule only makes a promise about ${story.ifPart}. The “${label('notP')}” card cannot break it, whatever is on the back.`;
      if (has('Q')) return `The “${label('Q')}” card already has the “then” part. Whatever is on its back, the rule is not broken. Turning it over would be testing the converse.`;
      if (!has('P') && !has('notQ')) return 'Which cards could be hiding a broken rule? Look for the “if” part being true, or the “then” part being false.';
      if (!has('P')) return `The “${label('P')}” card has the “if” part. If its other side lacks the “then” part, the rule is broken.`;
      if (!has('notQ')) return `The “${label('notQ')}” card is missing the “then” part. If its other side has the “if” part, the rule is broken.`;
      return true;
    },
    explain: `
      Only two cards can hide a broken rule: “**${label('P')}**”, where the “if” part is true, and “**${label('notQ')}**”, where the “then” part is false.
      The other two cannot break the rule whatever is behind them.
    `,
  };
}

/* ----------------------------------------------------------------- gates */

const sw = (id, value = 0, extra = {}) => ({ id, value, ...extra });

/** Two switches feeding an AND gate and an OR gate: explore both at once. */
export const CIRCUIT_AND_OR = {
  type: 'gates',
  inputs: [sw('A'), sw('B')],
  gates: [
    { id: 'and', type: 'AND', in: ['A', 'B'], col: 1, row: 0 },
    { id: 'or', type: 'OR', in: ['A', 'B'], col: 1, row: 1.4 },
  ],
  outputs: [{ id: 'andLamp', from: 'and', label: 'AND' }, { id: 'orLamp', from: 'or', label: 'OR' }],
};

/** One switch, one NOT gate. */
export const CIRCUIT_NOT = {
  type: 'gates',
  inputs: [sw('A')],
  gates: [{ id: 'not', type: 'NOT', in: ['A'], col: 1, row: 0 }],
  outputs: [{ id: 'lamp', from: 'not', label: 'Lamp' }],
};

/**
 * Worked example for tracing: (NOT A) AND B, with A = 0 and B = 1.
 * Deliberately not one of TRACE_CIRCUITS, so the question after it is new.
 */
export const CIRCUIT_TRACE_EXAMPLE = {
  type: 'gates',
  inputs: [sw('A', 0), sw('B', 1)],
  gates: [
    { id: 'not', type: 'NOT', in: ['A'], col: 1, row: 0 },
    { id: 'and', type: 'AND', in: ['not', 'B'], col: 2, row: 0.5 },
  ],
  outputs: [{ id: 'lamp', from: 'and', label: 'Lamp' }],
};

/** A single XOR gate with its truth table, for the screen that names it. */
export const CIRCUIT_XOR = {
  type: 'gates',
  table: 'full',
  inputs: [sw('A'), sw('B')],
  gates: [{ id: 'xor', type: 'XOR', in: ['A', 'B'], col: 1, row: 0.5 }],
  outputs: [{ id: 'lamp', from: 'xor', label: 'Lamp' }],
};

/** (A AND NOT B) AND C: exactly one switch setting lights the lamp. */
export const CIRCUIT_LIGHT = {
  type: 'gates',
  inputs: [sw('A', 0), sw('B', 1), sw('C', 0)],
  gates: [
    { id: 'not', type: 'NOT', in: ['B'], col: 1, row: 1 },
    { id: 'and1', type: 'AND', in: ['A', 'not'], col: 2, row: 0.5 },
    { id: 'and2', type: 'AND', in: ['and1', 'C'], col: 3, row: 1.5 },
  ],
  outputs: [{ id: 'lamp', from: 'and2', label: 'Lamp' }],
};

/** AND followed by NOT. */
export const CIRCUIT_NAND = {
  type: 'gates',
  inputs: [sw('A'), sw('B')],
  gates: [
    { id: 'and', type: 'AND', in: ['A', 'B'], col: 1, row: 0.5 },
    { id: 'not', type: 'NOT', in: ['and'], col: 2, row: 0.5 },
  ],
  outputs: [{ id: 'lamp', from: 'not', label: 'Lamp' }],
};

/** Three open slots; only OR / AND / AND makes "exactly one switch on". */
export const CIRCUIT_XOR_BUILD = {
  type: 'gates',
  table: 'full',
  inputs: [sw('A'), sw('B')],
  gates: [
    { id: 'g1', slot: ['AND', 'OR'], in: ['A', 'B'], col: 1, row: 0 },
    { id: 'g2', slot: ['AND', 'OR'], in: ['A', 'B'], col: 1, row: 1.5 },
    { id: 'not', type: 'NOT', in: ['g2'], col: 2, row: 1.5 },
    { id: 'g3', slot: ['AND', 'OR'], in: ['g1', 'not'], col: 3, row: 0.75 },
  ],
  outputs: [{ id: 'lamp', from: 'g3', label: 'Lamp' }],
};
export const XOR_BUILD_SOLUTION = { g1: 'OR', g2: 'AND', g3: 'AND' };

/** Two open slots: the sum digit and the carry digit of A + B. */
export const CIRCUIT_HALF_ADDER = {
  type: 'gates',
  table: 'full',
  inputs: [sw('A', 1), sw('B', 1)],
  gates: [
    { id: 'gs', slot: ['AND', 'OR', 'XOR'], title: 'Sum gate', in: ['A', 'B'], col: 1, row: 0 },
    { id: 'gc', slot: ['AND', 'OR', 'XOR'], title: 'Carry gate', in: ['A', 'B'], col: 1, row: 1.4 },
  ],
  outputs: [{ id: 'carry', from: 'gc', label: 'Carry' }, { id: 'sum', from: 'gs', label: 'Sum' }],
  readouts: [{ label: 'A + B in binary:', value: (v) => `${v.A} + ${v.B} = ${v.carry}${v.sum}` }],
};
export const HALF_ADDER_SOLUTION = { gs: 'XOR', gc: 'AND' };

/**
 * Small circuits for "trace it in your head" questions. `f` is the lamp as
 * plain arithmetic (the test compares it with the widget's own evaluator),
 * `walk` explains the trace for given inputs.
 */
export const TRACE_CIRCUITS = [
  {
    inputs: ['A', 'B', 'C'],
    gates: [
      { id: 'or', type: 'OR', in: ['A', 'B'], col: 1, row: 0.5 },
      { id: 'not', type: 'NOT', in: ['C'], col: 1, row: 2 },
      { id: 'and', type: 'AND', in: ['or', 'not'], col: 2, row: 1.25 },
    ],
    from: 'and',
    f: (a, b, c) => (a | b) & (1 - c),
    walk: (a, b, c) => `The OR gate gets ${a} and ${b}, so it sends out ${a | b}. The NOT gate flips ${c} into ${1 - c}. The AND gate gets ${a | b} and ${1 - c}`,
  },
  {
    inputs: ['A', 'B', 'C'],
    gates: [
      { id: 'and', type: 'AND', in: ['A', 'B'], col: 1, row: 0.5 },
      { id: 'or', type: 'OR', in: ['and', 'C'], col: 2, row: 1.25 },
    ],
    from: 'or',
    f: (a, b, c) => (a & b) | c,
    walk: (a, b, c) => `The AND gate gets ${a} and ${b}, so it sends out ${a & b}. The OR gate gets ${a & b} and ${c}`,
  },
  {
    inputs: ['A', 'B'],
    gates: [
      { id: 'and', type: 'AND', in: ['A', 'B'], col: 1, row: 0.5 },
      { id: 'not', type: 'NOT', in: ['and'], col: 2, row: 0.5 },
    ],
    from: 'not',
    f: (a, b) => 1 - (a & b),
    walk: (a, b) => `The AND gate gets ${a} and ${b}, so it sends out ${a & b}. The NOT gate flips that`,
  },
  {
    inputs: ['A', 'B'],
    gates: [
      { id: 'not', type: 'NOT', in: ['A'], col: 1, row: 0 },
      { id: 'or', type: 'OR', in: ['not', 'B'], col: 2, row: 0.5 },
    ],
    from: 'or',
    f: (a, b) => (1 - a) | b,
    walk: (a, b) => `The NOT gate flips ${a} into ${1 - a}. The OR gate gets ${1 - a} and ${b}`,
  },
  {
    inputs: ['A', 'B', 'C'],
    gates: [
      { id: 'not', type: 'NOT', in: ['A'], col: 1, row: 0 },
      { id: 'or', type: 'OR', in: ['B', 'C'], col: 1, row: 1.5 },
      { id: 'and', type: 'AND', in: ['not', 'or'], col: 2, row: 0.75 },
    ],
    from: 'and',
    f: (a, b, c) => (1 - a) & (b | c),
    walk: (a, b, c) => `The NOT gate flips ${a} into ${1 - a}. The OR gate gets ${b} and ${c}, so it sends out ${b | c}. The AND gate gets ${1 - a} and ${b | c}`,
  },
];

/** A generated tracing question: a circuit with its switches set and its signals hidden. */
export function traceTask(rng) {
  const index = rng.int(0, TRACE_CIRCUITS.length - 1);
  const c = TRACE_CIRCUITS[index];
  const bits = c.inputs.map(() => rng.int(0, 1));
  const lamp = c.f(...bits);
  return {
    index,
    bits,
    lamp,
    settings: c.inputs.map((id, i) => `${id}\u00a0=\u00a0${bits[i]}`).join(', '),
    figure: {
      type: 'gates', static: true, hideSignals: true,
      inputs: c.inputs.map((id, i) => ({ id, value: bits[i], locked: true })),
      gates: c.gates,
      outputs: [{ id: 'lamp', from: c.from, label: 'Lamp' }],
      alt: `A circuit with switches ${c.inputs.map((id, i) => `${id} = ${bits[i]}`).join(', ')}, feeding ${c.gates.map((g) => `${g.type === 'NOT' ? 'a NOT' : `an ${g.type}`} gate`).join(', then ')} and a lamp.`,
    },
    explain: `${c.walk(...bits)}, so the lamp gets **${lamp}**: it is ${lamp ? 'on' : 'off'}.`,
  };
}
