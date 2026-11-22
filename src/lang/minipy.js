/**
 * minipy — a small, safe interpreter for a teaching subset of Python 3.
 *
 * Pure JavaScript, no DOM, no eval / Function, no access to anything outside
 * the interpreter. It runs in the browser (code steps, the py-trace and
 * py-run widgets) and in Node (tests, the content validator).
 *
 *   import { run } from './minipy.js';
 *   const result = run('x = 2\nprint(x * 21)');
 *   result.ok        true
 *   result.stdout    '42\n'
 *   result.error     null | { type, message, line, hint, suggestion, stack, text }
 *   result.globals   { x: 2 }             final global variables as plain JS values
 *   result.reprs     { x: '2' }           the same, as Python repr strings
 *   result.types     { x: 'int' }
 *   result.trace     [...]                only with { trace: true }, see below
 *   result.call('x + 1')                  evaluate an expression in the final
 *                                         environment -> { ok, value, repr, type, stdout, error }
 *
 * Options: run(source, { maxSteps: 1000000, trace: false, maxTrace: 2000,
 *                        maxDepth: 200, maxOutput: 50000, inputs: { n: 5 } })
 *   maxSteps — budget of evaluation steps (statements + expression nodes);
 *              exceeding it stops the program with a clear TimeoutError.
 *   maxDepth — deepest chain of function calls (RecursionError beyond it).
 *   inputs — test values: the first top-level assignment `n = …` stores the
 *            given value instead of the one written in the program.
 *
 * Trace entries (one per executed line, *before* the line runs):
 *   { event: 'line' | 'call' | 'return' | 'end' | 'error',
 *     line, depth, func,              func: name of the running function or null
 *     vars:  { name: repr },          variables of the current scope
 *     ids:   { name: n },             identity of lists / dicts (same n = same object)
 *     globals, globalIds,             only inside a function
 *     callers: [line, …],             call sites, outermost first
 *     stdout,                         everything printed so far
 *     value }                         'return' only: repr of the returned value
 *
 * Language (faithful to Python 3 for everything it supports):
 *   values      int (exact, any size), float, bool, None, str, list, tuple, dict, range
 *   operators   + - * / // % **, comparisons (chained), == !=, and or not,
 *               in / not in, is / is not, unary + -, x if c else y
 *   statements  assignment (chained, augmented, index, tuple unpacking), if / elif / else,
 *               while, for … in, break, continue, pass, def (defaults, keyword
 *               arguments, closures, recursion), return, global, del
 *   strings     indexing, slicing, methods, f-strings with format specs
 *   built-ins   print len range int float str bool abs min max sum round sorted list
 *               tuple dict enumerate zip reversed type isinstance repr chr ord divmod
 *               pow any all map filter format
 *
 * Not supported (a clear NotSupportedError says so): import, class, try / except,
 * with, lambda, comprehensions, sets, generators, decorators, *args / **kwargs,
 * slice assignment, bitwise operators, complex numbers, bytes, input().
 */

/* ====================================================================== */
/* Errors                                                                 */
/* ====================================================================== */

export class PyError extends Error {
  constructor(type, message, line = 0) {
    super(message);
    this.name = 'PyError';
    this.pyType = type;
    this.line = line;
  }
}

/** Default budget of evaluation steps (statements + expression nodes): well under a second. */
export const DEFAULT_STEPS = 1000000;
const TOO_LONG = 'Your program ran for too long — is there a loop that never ends?';
const TOO_MUCH = 'Your program printed too much — is there a loop that never ends?';

/** One plain-English "what this usually means" line per error type. */
export const ERROR_HINTS = {
  SyntaxError: 'Python could not read this line, so the program never started. Look for a missing colon, bracket or quote — on this line or the one just above it.',
  IndentationError: 'The spaces at the start of a line tell Python which lines belong together. Lines inside an if, a loop or a function must start further in than the line that opens the block, and line up with each other.',
  TabError: 'This program mixes tabs and spaces at the start of lines. Use spaces only: 4 for each level.',
  NameError: 'Python does not know this name. Check the spelling (capital letters matter), and check that the name is given a value on an earlier line.',
  UnboundLocalError: 'Inside a function, any name you assign to belongs to that function. This line uses the name before the function has given it a value.',
  TypeError: 'A value of the wrong kind was used here, such as text where a number is needed. Check what each name on this line really holds.',
  ValueError: 'The kind of value is right, but this particular value cannot be used here — like int("hello").',
  ZeroDivisionError: 'Dividing by zero has no answer. Find out why the number after the division sign is 0 when this line runs.',
  IndexError: 'That position does not exist. Positions start at 0, so a list with 3 items has positions 0, 1 and 2.',
  KeyError: 'The dictionary has no entry with that key. Check the spelling, or test with "in" first.',
  AssertionError: 'An assert line checks that something is true, and this time it was not. The program stopped there on purpose: find out why the condition is False.',
  AttributeError: 'This kind of value has nothing with that name after the dot. Check the spelling, and check what type the value before the dot is.',
  RecursionError: 'A function kept calling itself and never reached a stopping point. Make sure one case returns without calling the function again.',
  TimeoutError: 'Something inside the loop has to change so that its condition becomes False. Check that the loop variable is updated inside the loop.',
  NotSupportedError: 'This is real Python, but it is outside the small part of the language that runs in these lessons.',
  OverflowError: 'A number became too big to handle. Check the numbers on this line.',
  MemoryError: 'The program tried to build something enormous. Check the numbers on this line.',
  RuntimeError: 'Something went wrong while the program was running. Read the message for the detail.',
};

/* ====================================================================== */
/* Values                                                                 */
/* ====================================================================== */
/*
 * Python value        JavaScript representation
 *   int               number (safe integers) or bigint (beyond 2^53)
 *   float             PyFloat { v: number }
 *   bool, str, None   boolean, string, null
 *   list              Array
 *   tuple             PyTuple { items }
 *   dict              PyDict (insertion-ordered, Python hashing rules)
 *   range             PyRange
 */

export class PyFloat { constructor(v) { this.v = v; } }
export class PyTuple { constructor(items) { this.items = items; } }

export class PyDict {
  constructor() { this.map = new Map(); }
  get size() { return this.map.size; }
  get(key) { const e = this.map.get(hashKey(key)); return e ? e[1] : undefined; }
  set(key, value) {
    const k = hashKey(key);
    const e = this.map.get(k);
    if (e) e[1] = value; else this.map.set(k, [key, value]);
  }
  has(key) { return this.map.has(hashKey(key)); }
  delete(key) { return this.map.delete(hashKey(key)); }
  keys() { return Array.from(this.map.values(), (e) => e[0]); }
  values() { return Array.from(this.map.values(), (e) => e[1]); }
  entries() { return Array.from(this.map.values()); }
}

class PyRange {
  constructor(start, stop, step) {
    this.start = start; this.stop = stop; this.step = step;
    this.length = step > 0 ? Math.max(0, Math.ceil((stop - start) / step)) : Math.max(0, Math.ceil((start - stop) / -step));
  }
  at(i) { return this.start + i * this.step; }
}

class PySlice { constructor(start, stop, step) { this.start = start; this.stop = stop; this.step = step; } }

class PyFunc {
  constructor(node, closure, defaults) {
    this.name = node.name; this.node = node; this.closure = closure; this.defaults = defaults;
  }
}

class PyBuiltin { constructor(name, fn) { this.name = name; this.fn = fn; } }
class PyType extends PyBuiltin {}
class PyBound { constructor(self, name, fn) { this.self = self; this.name = name; this.fn = fn; } }
/** One-shot iterators: enumerate, zip, reversed, map, filter. */
class PyIter { constructor(kind, next) { this.kind = kind; this.next = next; } }
/** dict.keys() / .values() / .items() — live views. */
class PyView { constructor(kind, dict) { this.kind = kind; this.dict = dict; } }

const STOP = Symbol('stop');
const NOKW = Object.freeze({});
const MAX_LEN = 1000000;      // longest string / list we are willing to build
const MAX_INT_BITS = 16384;   // about 4900 decimal digits

const TypeErr = (msg) => new PyError('TypeError', msg);
const ValueErr = (msg) => new PyError('ValueError', msg);

export function typeName(v) {
  switch (typeof v) {
    case 'number': case 'bigint': return 'int';
    case 'boolean': return 'bool';
    case 'string': return 'str';
    default:
  }
  if (v === null || v === undefined) return 'NoneType';
  if (Array.isArray(v)) return 'list';
  if (v instanceof PyFloat) return 'float';
  if (v instanceof PyTuple) return 'tuple';
  if (v instanceof PyDict) return 'dict';
  if (v instanceof PyRange) return 'range';
  if (v instanceof PySlice) return 'slice';
  if (v instanceof PyFunc) return 'function';
  if (v instanceof PyType) return 'type';
  if (v instanceof PyBuiltin || v instanceof PyBound) return 'builtin_function_or_method';
  if (v instanceof PyIter) return v.kind;
  if (v instanceof PyView) return `dict_${v.kind}`;
  return 'object';
}

const isNum = (v) => typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean' || v instanceof PyFloat;
const isIntLike = (v) => typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean';
const intOf = (v) => (typeof v === 'boolean' ? (v ? 1 : 0) : v);
/** Numeric value usable in JS comparisons (number or bigint). */
const numOf = (v) => (v instanceof PyFloat ? v.v : typeof v === 'boolean' ? (v ? 1 : 0) : v);

function bigToFloat(b) {
  const x = Number(b);
  if (!Number.isFinite(x)) throw new PyError('OverflowError', 'int too large to convert to float');
  return x;
}
const floatOf = (v) => (v instanceof PyFloat ? v.v : typeof v === 'bigint' ? bigToFloat(v) : typeof v === 'boolean' ? (v ? 1 : 0) : v);

function bitLength(b) { return (b < 0n ? -b : b).toString(2).length; }

/** BigInt -> the canonical int representation (number when it fits). */
function normBig(b) {
  if (b >= -9007199254740991n && b <= 9007199254740991n) return Number(b);
  if (bitLength(b) > MAX_INT_BITS) throw new PyError('OverflowError', 'this whole number has more than about 4900 digits — too big for this mini Python');
  return b;
}

function checkLen(n) {
  if (n > MAX_LEN) throw new PyError('MemoryError', 'this would build something with more than a million items');
}

const SURROGATE = /[\uD800-\uDFFF]/;
/** Code points of a string (the string itself when that is the same thing). */
const chars = (s) => (SURROGATE.test(s) ? Array.from(s) : s);

/* ---------------------------------------------------------- work budget */

/*
 * Comparing, hashing and printing walk a value recursively. A value that
 * shares parts of itself (a = [a, a], forty times over) is tiny in memory
 * but has 2^40 paths through it, so these walks are budgeted: while a
 * program runs, the work they do counts against WORK_LIMIT and ends in the
 * ordinary "ran for too long" error instead of freezing the page.
 */
const WORK_LIMIT = 3000000;
let work = Infinity; // Infinity outside run(), so the helpers stay usable on their own
function spend(n) {
  work -= n;
  if (work < 0) throw new PyError('TimeoutError', TOO_LONG);
}

/* ------------------------------------------------------------- hashing */

function hashKey(v) {
  switch (typeof v) {
    case 'number': case 'bigint': return v;
    case 'boolean': return v ? 1 : 0;
    case 'string': return `s${v}`;
    default:
  }
  if (v === null) return null;
  if (v instanceof PyFloat) {
    const x = v.v;
    if (Number.isInteger(x)) return Number.isSafeInteger(x) ? x + 0 : BigInt(x);
    return Number.isNaN(x) ? v : `f${x}`;
  }
  if (v instanceof PyTuple) {
    spend(v.items.length + 1);
    return `t${v.items.map((it) => { const k = hashKey(it); const s = typeof k === 'object' && k !== null ? 'obj' : String(k); return `${typeof k}${s.length}:${s}`; }).join(',')}`;
  }
  if (Array.isArray(v) || v instanceof PyDict) throw TypeErr(`unhashable type: '${typeName(v)}'`);
  return v; // functions, types, ranges: by identity
}

/* ------------------------------------------------------------ repr/str */

function floatRepr(x) {
  if (Number.isNaN(x)) return 'nan';
  if (x === Infinity) return 'inf';
  if (x === -Infinity) return '-inf';
  if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
  // toExponential() with no argument gives the shortest digits that round-trip.
  const [mant, expText] = Math.abs(x).toExponential().split('e');
  const digits = mant.replace('.', '');
  const e = Number(expText);
  let s;
  if (e >= -4 && e < 16) {
    if (e >= 0) {
      s = digits.length <= e + 1
        ? `${digits}${'0'.repeat(e + 1 - digits.length)}.0`
        : `${digits.slice(0, e + 1)}.${digits.slice(e + 1)}`;
    } else {
      s = `0.${'0'.repeat(-e - 1)}${digits}`;
    }
  } else {
    const m = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits;
    s = `${m}e${e < 0 ? '-' : '+'}${String(Math.abs(e)).padStart(2, '0')}`;
  }
  return (x < 0 ? '-' : '') + s;
}

function strRepr(s) {
  const quote = s.includes("'") && !s.includes('"') ? '"' : "'";
  let out = quote;
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (ch === quote || ch === '\\') out += `\\${ch}`;
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (code < 0x20 || code === 0x7f) out += `\\x${code.toString(16).padStart(2, '0')}`;
    else if ((code >= 0x80 && code <= 0xa0) || code === 0xad) out += `\\x${code.toString(16).padStart(2, '0')}`;
    else if (code >= 0xd800 && code <= 0xdfff) out += `\\u${code.toString(16).padStart(4, '0')}`;
    else out += ch;
  }
  return out + quote;
}

/** Python's repr() of a value. */
/** Most container items one repr() will spell out; the rest become "...". */
const REPR_NODES = 100000;

/** Join the reprs of `items`, stopping with "..." once the budget is used up. */
function reprItems(items, budget, one) {
  const parts = [];
  for (let i = 0; i < items.length; i++) {
    if (budget.left <= 0) { parts.push('...'); break; }
    budget.left--;
    parts.push(one(items[i]));
  }
  return parts.join(', ');
}

/**
 * Python's repr() of a value.
 * @param {Set} [seen]   containers being printed right now (cycle detection)
 * @param {{left: number}} [budget]  how many container items may still be spelled out
 */
export function pyRepr(v, seen, budget) {
  switch (typeof v) {
    case 'number': return String(v + 0);
    case 'bigint': return v.toString();
    case 'boolean': return v ? 'True' : 'False';
    case 'string': return strRepr(v);
    case 'undefined': return 'None';
    default:
  }
  if (v === null) return 'None';
  if (v instanceof PyFloat) return floatRepr(v.v);
  if (v instanceof PyFunc) return `<function ${v.name}>`;
  if (v instanceof PyType) return `<class '${v.name}'>`;
  if (v instanceof PyBuiltin) return `<built-in function ${v.name}>`;
  if (v instanceof PyBound) return `<built-in method ${v.name} of ${typeName(v.self)} object>`;
  if (v instanceof PyRange) return v.step === 1 ? `range(${v.start}, ${v.stop})` : `range(${v.start}, ${v.stop}, ${v.step})`;
  if (v instanceof PyIter) return `<${v.kind} object>`;
  if (v instanceof PySlice) return `slice(${pyRepr(v.start)}, ${pyRepr(v.stop)}, ${pyRepr(v.step)})`;
  const stack = seen || new Set();
  const left = budget || { left: REPR_NODES };
  const isList = Array.isArray(v);
  if (stack.has(v)) return isList ? '[...]' : v instanceof PyDict ? '{...}' : '(...)';
  if (left.left <= 0) return '...';
  stack.add(v);
  const one = (x) => pyRepr(x, stack, left);
  let out;
  if (isList) out = `[${reprItems(v, left, one)}]`;
  else if (v instanceof PyTuple) out = v.items.length === 1 ? `(${one(v.items[0])},)` : `(${reprItems(v.items, left, one)})`;
  else if (v instanceof PyDict) out = `{${reprItems(v.entries(), left, ([k, x]) => `${one(k)}: ${one(x)}`)}}`;
  else if (v instanceof PyView) out = `dict_${v.kind}(${one(viewItems(v))})`;
  else out = '<object>';
  stack.delete(v);
  return out;
}

/** Python's str() of a value (what print shows). */
export function pyStr(v) { return typeof v === 'string' ? v : pyRepr(v); }

function viewItems(view) {
  if (view.kind === 'keys') return view.dict.keys();
  if (view.kind === 'values') return view.dict.values();
  return view.dict.entries().map(([k, v]) => new PyTuple([k, v]));
}

/* ----------------------------------------------------------- truthiness */

function truthy(v) {
  switch (typeof v) {
    case 'boolean': return v;
    case 'number': return v !== 0;
    case 'bigint': return v !== 0n;
    case 'string': return v.length > 0;
    default:
  }
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (v instanceof PyFloat) return v.v !== 0;
  if (v instanceof PyTuple) return v.items.length > 0;
  if (v instanceof PyDict) return v.size > 0;
  if (v instanceof PyRange) return v.length > 0;
  if (v instanceof PyView) return v.dict.size > 0;
  return true;
}

/* ------------------------------------------------------------- equality */

function pyEq(a, b) {
  if (isNum(a)) {
    if (!isNum(b)) return false;
    // eslint-disable-next-line eqeqeq
    return numOf(a) == numOf(b); // loose: compares number with bigint by value
  }
  if (a === b) return true;
  if (typeof a === 'string' || typeof b === 'string' || a === null || b === null) return false;
  if (Array.isArray(a)) return Array.isArray(b) && seqEq(a, b);
  if (a instanceof PyTuple) return b instanceof PyTuple && seqEq(a.items, b.items);
  if (a instanceof PyDict) {
    if (!(b instanceof PyDict) || a.size !== b.size) return false;
    spend(a.size + 1);
    for (const [k, v] of a.entries()) {
      const other = b.get(k);
      if (other === undefined || !pyEq(v, other)) return false;
    }
    return true;
  }
  if (a instanceof PyRange) {
    if (!(b instanceof PyRange) || a.length !== b.length) return false;
    return a.length === 0 || (a.start === b.start && (a.length === 1 || a.step === b.step));
  }
  return false;
}

function seqEq(x, y) {
  if (x.length !== y.length) return false;
  spend(x.length + 1);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i] && !pyEq(x[i], y[i])) return false;
  return true;
}

function pyIs(a, b) {
  if (a instanceof PyFloat || b instanceof PyFloat) return a === b;
  return a === b;
}

/* ------------------------------------------------------------- ordering */

function order(op, a, b) {
  if (isNum(a) && isNum(b)) {
    const x = numOf(a);
    const y = numOf(b);
    return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b : a >= b;
  }
  const xs = Array.isArray(a) ? a : a instanceof PyTuple ? a.items : null;
  const ys = Array.isArray(b) ? b : b instanceof PyTuple ? b.items : null;
  if (xs && ys && Array.isArray(a) === Array.isArray(b)) {
    const n = Math.min(xs.length, ys.length);
    spend(n + 1);
    for (let i = 0; i < n; i++) if (!pyEq(xs[i], ys[i])) return order(op, xs[i], ys[i]);
    const x = xs.length;
    const y = ys.length;
    return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
  }
  throw TypeErr(`'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`);
}

function contains(box, item) {
  if (typeof box === 'string') {
    if (typeof item !== 'string') throw TypeErr(`'in <string>' requires string as left operand, not ${typeName(item)}`);
    return box.includes(item);
  }
  if (Array.isArray(box)) return box.some((x) => x === item || pyEq(x, item));
  if (box instanceof PyTuple) return box.items.some((x) => x === item || pyEq(x, item));
  if (box instanceof PyDict) return box.has(item);
  if (box instanceof PyRange) {
    if (!isNum(item)) return false;
    const x = numOf(item);
    if (typeof x === 'bigint' || !Number.isInteger(x)) return false;
    if (box.step > 0 ? (x < box.start || x >= box.stop) : (x > box.start || x <= box.stop)) return false;
    return (x - box.start) % box.step === 0;
  }
  if (box instanceof PyView) {
    if (box.kind === 'keys') return box.dict.has(item);
    return viewItems(box).some((x) => pyEq(x, item));
  }
  if (box instanceof PyIter) {
    for (let x = box.next(); x !== STOP; x = box.next()) if (pyEq(x, item)) return true;
    return false;
  }
  throw TypeErr(`argument of type '${typeName(box)}' is not iterable`);
}

/* ------------------------------------------------------------ iteration */

/** Returns a function that yields the next item, or STOP. */
function getIter(v) {
  if (Array.isArray(v)) { let i = 0; return () => (i < v.length ? v[i++] : STOP); } // live: sees changes made while looping
  if (typeof v === 'string') { const cs = chars(v); let i = 0; return () => (i < cs.length ? cs[i++] : STOP); }
  if (v instanceof PyRange) { let i = 0; return () => (i < v.length ? v.at(i++) : STOP); }
  if (v instanceof PyTuple) { let i = 0; return () => (i < v.items.length ? v.items[i++] : STOP); }
  if (v instanceof PyDict || v instanceof PyView) {
    const dict = v instanceof PyDict ? v : v.dict;
    const items = v instanceof PyDict ? v.keys() : viewItems(v);
    const size = dict.size;
    let i = 0;
    return () => {
      if (dict.size !== size) throw new PyError('RuntimeError', 'dictionary changed size during iteration');
      return i < items.length ? items[i++] : STOP;
    };
  }
  if (v instanceof PyIter) return v.next;
  throw TypeErr(`'${typeName(v)}' object is not iterable`);
}

/* ----------------------------------------------------------- arithmetic */

const unsupported = (op, a, b) => TypeErr(`unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`);

function intPow(a, b) {
  if (b < 0) {
    // eslint-disable-next-line eqeqeq
    if (a == 0) throw new PyError('ZeroDivisionError', '0.0 cannot be raised to a negative power');
    return floatArith('**', floatOf(a), floatOf(b));
  }
  /* eslint-disable eqeqeq */
  if (b == 0 || a == 1) return 1;
  if (a == 0) return 0;
  if (a == -1) return (typeof b === 'bigint' ? b % 2n === 0n : b % 2 === 0) ? 1 : -1;
  /* eslint-enable eqeqeq */
  if (typeof b === 'bigint' || bitLength(BigInt(a)) * b > MAX_INT_BITS + 64) {
    throw new PyError('OverflowError', 'this whole number has more than about 4900 digits — too big for this mini Python');
  }
  let result = 1;
  let base = a;
  let e = b;
  while (e > 0) {
    if (e % 2 === 1) result = intArith('*', result, base);
    e = Math.floor(e / 2);
    if (e > 0) base = intArith('*', base, base);
  }
  return result;
}

/** (num / den) × 2^exp as a correctly rounded double; num and den are positive BigInts. */
function ratioToDouble(num, den, exp) {
  const shift = Math.max(0, 66 + bitLength(den) - bitLength(num));
  const scaled = num << BigInt(shift);
  let q = scaled / den;
  let sticky = scaled % den !== 0n;
  let e = exp - shift;
  const extra = bitLength(q) - 64;
  if (extra > 0) {
    if ((q & ((1n << BigInt(extra)) - 1n)) !== 0n) sticky = true;
    q >>= BigInt(extra);
    e += extra;
  }
  if (sticky) q |= 1n; // keeps the final rounding honest
  const half = Math.trunc(e / 2);
  return Number(q) * Math.pow(2, half) * Math.pow(2, e - half);
}

/** int / int when at least one side is too big for a JS number. */
function bigTrueDiv(a, b) {
  let p = BigInt(a);
  let q = BigInt(b);
  if (p === 0n) return (q < 0n) ? -0 : 0;
  const neg = (p < 0n) !== (q < 0n);
  if (p < 0n) p = -p;
  if (q < 0n) q = -q;
  const val = ratioToDouble(p, q, 0);
  if (!Number.isFinite(val)) throw new PyError('OverflowError', 'integer division result too large for a float');
  return neg ? -val : val;
}

/** Arithmetic on two ints (number | bigint). */
function intArith(op, a, b) {
  const small = typeof a === 'number' && typeof b === 'number';
  switch (op) {
    case '+': { if (small) { const r = a + b; if (Number.isSafeInteger(r)) return r; } return normBig(BigInt(a) + BigInt(b)); }
    case '-': { if (small) { const r = a - b; if (Number.isSafeInteger(r)) return r; } return normBig(BigInt(a) - BigInt(b)); }
    case '*': { if (small) { const r = a * b; if (Number.isSafeInteger(r)) return r + 0; } return normBig(BigInt(a) * BigInt(b)); }
    case '/':
      // eslint-disable-next-line eqeqeq
      if (b == 0) throw new PyError('ZeroDivisionError', 'division by zero');
      return new PyFloat(small ? a / b : bigTrueDiv(a, b));
    case '//': {
      // eslint-disable-next-line eqeqeq
      if (b == 0) throw new PyError('ZeroDivisionError', 'integer division or modulo by zero');
      if (small && Math.abs(a) + Math.abs(b) < 4503599627370496) return Math.floor(a / b) + 0;
      const x = BigInt(a);
      const y = BigInt(b);
      let q = x / y;
      if (x % y !== 0n && (x < 0n) !== (y < 0n)) q -= 1n;
      return normBig(q);
    }
    case '%': {
      // eslint-disable-next-line eqeqeq
      if (b == 0) throw new PyError('ZeroDivisionError', 'integer modulo by zero');
      if (small) { let r = a % b; if (r !== 0 && (r < 0) !== (b < 0)) r += b; return r + 0; }
      const y = BigInt(b);
      let r = BigInt(a) % y;
      if (r !== 0n && (r < 0n) !== (y < 0n)) r += y;
      return normBig(r);
    }
    case '**': return intPow(a, b);
    default: throw new Error(`bad int operator ${op}`);
  }
}

/**
 * x ** n for a whole-number n, correctly rounded. JavaScript's Math.pow can be
 * one unit off in the last digit; CPython's results are (almost always) the
 * correctly rounded ones, so we compute the power exactly and round once.
 */
function exactPow(x, n) {
  const k = Math.abs(n);
  if (x === 0 || !Number.isFinite(x) || k > 512 || k < 2) return Math.pow(x, n);
  const guess = Math.pow(x, n);
  if (!Number.isFinite(guess) || Math.abs(guess) < 1e-290 || Math.abs(guess) > 1e290) return guess;
  DV.setFloat64(0, Math.abs(x));
  const hi = DV.getUint32(0);
  const be = (hi >>> 20) & 0x7ff;
  let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(DV.getUint32(4));
  let e;
  if (be === 0) e = -1074; else { m |= 1n << 52n; e = be - 1075; }
  while ((m & 1n) === 0n) { m >>= 1n; e += 1; }
  const p = m ** BigInt(k);
  // value = p × 2^(e·k), or its reciprocal
  const r = n > 0 ? ratioToDouble(p, 1n, e * k) : ratioToDouble(1n, p, -e * k);
  return x < 0 && k % 2 === 1 ? -r : r;
}

/** x ** -0.5, correctly rounded (Math.pow computes 1 / sqrt(x), which rounds twice). */
function invSqrt(x) {
  if (!(x >= 2.2250738585072014e-308) || !Number.isFinite(x)) return Math.pow(x, -0.5);
  DV.setFloat64(0, x);
  const hi = DV.getUint32(0);
  let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(DV.getUint32(4)) | (1n << 52n);
  let e = ((hi >>> 20) & 0x7ff) - 1075;
  if (e % 2 !== 0) { m <<= 1n; e -= 1; }
  // q = floor(2^100 / sqrt(m)) by integer square root (Newton's method)
  const target = (1n << 200n) / m;
  let q = 1n << BigInt((bitLength(target) + 1) >> 1);
  for (;;) { const y = (q + target / q) >> 1n; if (y >= q) break; q = y; }
  if (q * q * m !== 1n << 200n) q |= 1n; // sticky bit: the true value is a little larger
  const exp = -100 - e / 2;
  const half = Math.trunc(exp / 2);
  return Number(q) * Math.pow(2, half) * Math.pow(2, exp - half);
}

function floatMod(x, y) {
  let mod = x % y;
  if (mod !== 0) { if ((y < 0) !== (mod < 0)) mod += y; } else mod = y < 0 ? -0 : 0;
  return mod;
}

function floatArith(op, x, y) {
  switch (op) {
    case '+': return new PyFloat(x + y);
    case '-': return new PyFloat(x - y);
    case '*': return new PyFloat(x * y);
    case '/':
      if (y === 0) throw new PyError('ZeroDivisionError', 'float division by zero');
      return new PyFloat(x / y);
    case '//': {
      if (y === 0) throw new PyError('ZeroDivisionError', 'float floor division by zero');
      let mod = x % y;
      let div = (x - mod) / y;
      if (mod !== 0 && (y < 0) !== (mod < 0)) { mod += y; div -= 1; }
      let fl;
      if (div !== 0) { fl = Math.floor(div); if (div - fl > 0.5) fl += 1; } else fl = (x / y) < 0 || Object.is(x / y, -0) ? -0 : 0;
      return new PyFloat(fl);
    }
    case '%':
      if (y === 0) throw new PyError('ZeroDivisionError', 'float modulo by zero');
      return new PyFloat(floatMod(x, y));
    case '**': {
      if (x === 0 && y < 0) throw new PyError('ZeroDivisionError', '0.0 cannot be raised to a negative power');
      if (x < 0 && Number.isFinite(y) && !Number.isInteger(y)) throw new PyError('NotSupportedError', 'a negative number to a fractional power is a complex number, which this mini Python does not have');
      const r = Number.isInteger(y) ? exactPow(x, y) : y === 0.5 && x >= 0 && Number.isFinite(x) ? Math.sqrt(x) : y === -0.5 ? invSqrt(x) : Math.pow(x, y);
      if (!Number.isFinite(r) && Number.isFinite(x) && Number.isFinite(y)) throw new PyError('OverflowError', "(34, 'Numerical result out of range')");
      if (x === 1 || y === 0) return new PyFloat(1); // Python: 1 ** nan == nan ** 0 == 1.0
      return new PyFloat(r);
    }
    default: throw new Error(`bad float operator ${op}`);
  }
}

function numArith(op, a, b) {
  if (a instanceof PyFloat || b instanceof PyFloat) return floatArith(op, floatOf(a), floatOf(b));
  return intArith(op, intOf(a), intOf(b));
}

function repeatCount(v) {
  const n = intOf(v);
  if (typeof n === 'bigint') { if (n < 0n) return 0; throw new PyError('MemoryError', 'this would build something with more than a million items'); }
  return Math.max(0, n);
}

function repeatSeq(seq, count) {
  const n = repeatCount(count);
  const len = typeof seq === 'string' ? seq.length : Array.isArray(seq) ? seq.length : seq.items.length;
  checkLen(len * n);
  if (typeof seq === 'string') return seq.repeat(n);
  const src = Array.isArray(seq) ? seq : seq.items;
  const out = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < src.length; j++) out.push(src[j]);
  return Array.isArray(seq) ? out : new PyTuple(out);
}

const isSeq = (v) => typeof v === 'string' || Array.isArray(v) || v instanceof PyTuple;

/** Binary operators. `sym` is the operator as the learner wrote it (for messages). */
function binop(op, a, b, sym = op) {
  if (typeof a === 'number' && typeof b === 'number') {
    // the overwhelmingly common case: two small ints
    if (op === '+') { const r = a + b; if (Number.isSafeInteger(r)) return r; }
    else if (op === '-') { const r = a - b; if (Number.isSafeInteger(r)) return r; }
    return intArith(op, a, b);
  }
  if (isNum(a) && isNum(b)) return numArith(op, a, b);
  if (op === '+') {
    if (typeof a === 'string') {
      if (typeof b !== 'string') throw TypeErr(`can only concatenate str (not "${typeName(b)}") to str`);
      checkLen(a.length + b.length);
      return a + b;
    }
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) throw TypeErr(`can only concatenate list (not "${typeName(b)}") to list`);
      checkLen(a.length + b.length);
      return a.concat(b);
    }
    if (a instanceof PyTuple) {
      if (!(b instanceof PyTuple)) throw TypeErr(`can only concatenate tuple (not "${typeName(b)}") to tuple`);
      checkLen(a.items.length + b.items.length);
      return new PyTuple(a.items.concat(b.items));
    }
  } else if (op === '*') {
    if (isSeq(a)) {
      if (!isIntLike(b)) throw TypeErr(`can't multiply sequence by non-int of type '${typeName(b)}'`);
      return repeatSeq(a, b);
    }
    if (isSeq(b)) {
      if (!isIntLike(a)) throw TypeErr(`can't multiply sequence by non-int of type '${typeName(a)}'`);
      return repeatSeq(b, a);
    }
  } else if (op === '%' && typeof a === 'string') {
    throw new PyError('NotSupportedError', 'old-style % formatting is not available here — use an f-string instead');
  }
  throw unsupported(sym === '**' ? '** or pow()' : sym, a, b);
}

function negate(v) {
  if (typeof v === 'number') return v === 0 ? 0 : -v;
  if (typeof v === 'bigint') return normBig(-v);
  if (typeof v === 'boolean') return v ? -1 : 0;
  if (v instanceof PyFloat) return new PyFloat(-v.v);
  throw TypeErr(`bad operand type for unary -: '${typeName(v)}'`);
}

/* -------------------------------------------------- indexing and slices */

/** An index argument as a JS number; `what` names the container for errors. */
function toIndex(v, what) {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'bigint') return v > 0n ? Infinity : -Infinity;
  if (what === 'str') throw TypeErr(`string indices must be integers, not '${typeName(v)}'`);
  if (what) throw TypeErr(`${what} indices must be integers or slices, not ${typeName(v)}`);
  throw TypeErr(`'${typeName(v)}' object cannot be interpreted as an integer`);
}

function sliceRange(len, sl) {
  const step = sl.step === null ? 1 : toIndex(sl.step);
  if (step === 0) throw ValueErr('slice step cannot be zero');
  const lower = step > 0 ? 0 : -1;
  const upper = step > 0 ? len : len - 1;
  const clampTo = (v, dflt) => {
    if (v === null) return dflt;
    let i = toIndex(v);
    if (i < 0) i += len;
    return Math.min(upper, Math.max(lower, i));
  };
  const start = clampTo(sl.start, step > 0 ? lower : upper);
  const stop = clampTo(sl.stop, step > 0 ? upper : lower);
  const out = [];
  if (step > 0) for (let i = start; i < stop; i += step) out.push(i);
  else for (let i = start; i > stop; i += step) out.push(i);
  return out;
}

function seqIndex(len, idx, what) {
  let i = toIndex(idx, what);
  if (i < 0) i += len;
  return i >= 0 && i < len ? i : -1;
}

function getItem(obj, idx) {
  if (Array.isArray(obj)) {
    if (idx instanceof PySlice) return sliceRange(obj.length, idx).map((i) => obj[i]);
    const i = seqIndex(obj.length, idx, 'list');
    if (i < 0) throw new PyError('IndexError', 'list index out of range');
    return obj[i];
  }
  if (typeof obj === 'string') {
    const cs = chars(obj);
    if (idx instanceof PySlice) {
      if (idx.step === null && cs === obj) { // plain slice of a plain string: the fast path
        const r = sliceRange(obj.length, idx);
        return r.length ? obj.slice(r[0], r[r.length - 1] + 1) : '';
      }
      return sliceRange(cs.length, idx).map((i) => cs[i]).join('');
    }
    const i = seqIndex(cs.length, idx, 'str');
    if (i < 0) throw new PyError('IndexError', 'string index out of range');
    return cs[i];
  }
  if (obj instanceof PyDict) {
    const v = obj.get(idx);
    if (v === undefined) throw new PyError('KeyError', pyRepr(idx));
    return v;
  }
  if (obj instanceof PyTuple) {
    if (idx instanceof PySlice) return new PyTuple(sliceRange(obj.items.length, idx).map((i) => obj.items[i]));
    const i = seqIndex(obj.items.length, idx, 'tuple');
    if (i < 0) throw new PyError('IndexError', 'tuple index out of range');
    return obj.items[i];
  }
  if (obj instanceof PyRange) {
    if (idx instanceof PySlice) return sliceRange(obj.length, idx).map((i) => obj.at(i));
    const i = seqIndex(obj.length, idx, 'range');
    if (i < 0) throw new PyError('IndexError', 'range object index out of range');
    return obj.at(i);
  }
  throw TypeErr(`'${typeName(obj)}' object is not subscriptable`);
}

function setItem(obj, idx, value) {
  if (Array.isArray(obj)) {
    if (idx instanceof PySlice) throw new PyError('NotSupportedError', 'assigning to a slice (a[1:3] = …) is not available in this mini Python');
    const i = seqIndex(obj.length, idx, 'list');
    if (i < 0) throw new PyError('IndexError', 'list assignment index out of range');
    obj[i] = value;
    return;
  }
  if (obj instanceof PyDict) { obj.set(idx, value); return; }
  throw TypeErr(`'${typeName(obj)}' object does not support item assignment`);
}

function delItem(obj, idx) {
  if (Array.isArray(obj)) {
    if (idx instanceof PySlice) { const drop = new Set(sliceRange(obj.length, idx)); const keep = obj.filter((_, i) => !drop.has(i)); obj.length = 0; obj.push(...keep); return; }
    const i = seqIndex(obj.length, idx, 'list');
    if (i < 0) throw new PyError('IndexError', 'list assignment index out of range');
    obj.splice(i, 1);
    return;
  }
  if (obj instanceof PyDict) {
    if (!obj.delete(idx)) throw new PyError('KeyError', pyRepr(idx));
    return;
  }
  throw TypeErr(`'${typeName(obj)}' object doesn't support item deletion`);
}

function pyLen(v) {
  if (typeof v === 'string') return chars(v).length;
  if (Array.isArray(v)) return v.length;
  if (v instanceof PyTuple) return v.items.length;
  if (v instanceof PyDict) return v.size;
  if (v instanceof PyRange) return v.length;
  if (v instanceof PyView) return v.dict.size;
  throw TypeErr(`object of type '${typeName(v)}' has no len()`);
}

/* ====================================================================== */
/* Exact decimal formatting of floats (round-half-even, like CPython)     */
/* ====================================================================== */

const DV = new DataView(new ArrayBuffer(8));

/** x × 10^k rounded half-to-even, as a BigInt. x must be finite and >= 0. */
function scaledRound(x, k) {
  if (x === 0) return 0n;
  DV.setFloat64(0, x);
  const hi = DV.getUint32(0);
  const lo = DV.getUint32(4);
  const be = (hi >>> 20) & 0x7ff;
  let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let e;
  if (be === 0) e = -1074; else { m |= 1n << 52n; e = be - 1075; }
  let num = m;
  let den = 1n;
  if (e >= 0) num <<= BigInt(e); else den <<= BigInt(-e);
  if (k >= 0) num *= 10n ** BigInt(k); else den *= 10n ** BigInt(-k);
  let q = num / den;
  const twice = (num % den) * 2n;
  if (twice > den || (twice === den && (q & 1n) === 1n)) q += 1n;
  return q;
}

/** |x| with exactly p digits after the point ("%.pf"). */
function fixedDigits(x, p) {
  const s = scaledRound(Math.abs(x), p).toString().padStart(p + 1, '0');
  return p ? `${s.slice(0, s.length - p)}.${s.slice(s.length - p)}` : s;
}

/** |x| as [digits (p + 1 of them), decimal exponent] ("%.pe"). */
function sciDigits(x, p) {
  const ax = Math.abs(x);
  if (ax === 0) return ['0'.repeat(p + 1), 0];
  let e = Math.floor(Math.log10(ax));
  let n = scaledRound(ax, p - e);
  const hiLimit = 10n ** BigInt(p + 1);
  const loLimit = 10n ** BigInt(p);
  if (n >= hiLimit) { e += 1; n = scaledRound(ax, p - e); } else if (n < loLimit) { e -= 1; n = scaledRound(ax, p - e); if (n >= hiLimit) { e += 1; n = scaledRound(ax, p - e); } }
  return [n.toString(), e];
}

const expText = (e) => `e${e < 0 ? '-' : '+'}${String(Math.abs(e)).padStart(2, '0')}`;

function groupDigits(intPart, sep, size = 3) {
  let out = '';
  for (let i = intPart.length; i > 0; i -= size) out = intPart.slice(Math.max(0, i - size), i) + (out ? sep + out : '');
  return out;
}

function stripZeros(s) {
  if (!s.includes('.')) return s;
  return s.replace(/0+$/, '').replace(/\.$/, '');
}

/** Body of a float for format type e / f / g / % / none (no sign, no padding). */
function floatBody(x, type, precision, alt) {
  const ax = Math.abs(x);
  if (Number.isNaN(x)) return type === 'F' || type === 'E' || type === 'G' ? 'NAN' : type === '%' ? 'nan%' : 'nan';
  if (!Number.isFinite(x)) return type === 'F' || type === 'E' || type === 'G' ? 'INF' : type === '%' ? 'inf%' : 'inf';
  const lower = type.toLowerCase();
  if (lower === 'f') return fixedDigits(ax, precision == null ? 6 : precision) + (alt && precision === 0 ? '.' : '');
  if (lower === '%') return `${fixedDigits(ax * 100, precision == null ? 6 : precision)}%`;
  if (lower === 'e') {
    const p = precision == null ? 6 : precision;
    const [d, e] = sciDigits(ax, p);
    const out = `${d[0]}${p ? `.${d.slice(1)}` : alt ? '.' : ''}${expText(e)}`;
    return type === 'E' ? out.toUpperCase() : out;
  }
  // 'g' and the no-type form
  if (type === '' && precision == null) return floatRepr(ax);
  let p = precision == null ? 6 : precision;
  if (p === 0) p = 1;
  const [d, e] = sciDigits(ax, p - 1);
  let out;
  const useExp = type === '' ? !(e >= -4 && e < p) : (e < -4 || e >= p);
  if (!useExp) {
    out = fixedDigits(ax, Math.max(0, p - 1 - e));
    if (!alt) out = stripZeros(out);
    if (type === '' && !out.includes('.')) out += '.0';
  } else {
    let mant = p > 1 ? `${d[0]}.${d.slice(1)}` : d[0];
    if (!alt) mant = stripZeros(mant);
    out = mant + expText(e);
  }
  return type === 'G' ? out.toUpperCase() : out;
}

const SPEC = /^(?:(.)?([<>=^]))?([+\- ])?(z)?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([a-zA-Z%])?$/su;

/** format(value, spec) — the format-spec mini-language used by f-strings. */
function formatValue(v, spec) {
  if (spec === '') return pyStr(v);
  const tn = typeName(v);
  if (!(typeof v === 'string' || isNum(v))) throw TypeErr(`unsupported format string passed to ${tn}.__format__`);
  const m = SPEC.exec(spec);
  if (!m) throw ValueErr('Invalid format specifier');
  let [, fill, align, sign, zflag, alt, zero, width, grouping, precision, type] = m;
  width = width ? Number(width) : 0;
  precision = precision === undefined ? null : Number(precision);
  type = type || '';
  if (width > 10000 || (precision || 0) > 400) throw ValueErr('Too many decimal digits in format string');
  const unknown = () => ValueErr(`Unknown format code '${type}' for object of type '${tn}'`);

  let body;
  let prefix = '';
  let numeric = true;
  if (typeof v === 'string') {
    if (type && type !== 's') throw unknown();
    if (sign) throw ValueErr('Sign not allowed in string format specifier');
    if (alt) throw ValueErr('Alternate form (#) not allowed in string format specifier');
    if (align === '=') throw ValueErr("'=' alignment not allowed in string format specifier");
    if (grouping) throw ValueErr(`Cannot specify '${grouping}' with 's'.`);
    if (zflag) throw ValueErr('Negative zero coercion (z) not allowed in string format specifier');
    const cs = Array.from(v);
    body = precision == null ? v : cs.slice(0, precision).join('');
    numeric = false;
  } else if (v instanceof PyFloat || 'eEfFgG%'.includes(type || '?')) {
    if (type && !'eEfFgGn%'.includes(type)) throw unknown();
    const x = floatOf(v);
    let neg = x < 0 || Object.is(x, -0);
    body = floatBody(x, type === 'n' ? 'g' : type, precision, !!alt);
    if (neg && zflag && !/[1-9]/.test(body.replace(/e.*$/i, ''))) neg = false; // 'z': no negative zero
    prefix = neg ? '-' : sign === '+' ? '+' : sign === ' ' ? ' ' : '';
    if (grouping && Number.isFinite(x)) {
      const cut = body.search(/[.e%]/i);
      const head = cut < 0 ? body : body.slice(0, cut);
      body = groupDigits(head, grouping) + (cut < 0 ? '' : body.slice(cut));
    }
  } else {
    // int (and bool)
    if (type && !'bcdoxXn'.includes(type)) throw unknown();
    if (precision != null) throw ValueErr('Precision not allowed in integer format specifier');
    if (zflag) throw ValueErr('Negative zero coercion (z) not allowed in integer format specifier');
    const n = intOf(v);
    const neg = n < 0;
    const mag = neg ? (typeof n === 'bigint' ? -n : -n) : n;
    prefix = neg ? '-' : sign === '+' ? '+' : sign === ' ' ? ' ' : '';
    if (type === 'c') {
      if (sign) throw ValueErr("Sign not allowed with integer format specifier 'c'");
      body = String.fromCodePoint(Number(n));
      prefix = '';
    } else if (type === 'b' || type === 'o' || type === 'x' || type === 'X') {
      if (grouping === ',') throw ValueErr(`Cannot specify ',' with '${type}'.`);
      const radix = type === 'b' ? 2 : type === 'o' ? 8 : 16;
      body = mag.toString(radix);
      if (type === 'X') body = body.toUpperCase();
      if (grouping) body = groupDigits(body, '_', 4);
      if (alt) prefix += `0${type}`;
    } else {
      body = mag.toString();
      if (grouping) body = groupDigits(body, grouping);
    }
  }

  if (zero && !align) { fill = '0'; align = '='; }
  if (fill === '0' && align === '=' && grouping && numeric && /^\d/.test(body)) {
    // Python also puts separators into the zero padding: 000,000,255.000
    const cut = body.search(/[^\d,_]/);
    let head = (cut < 0 ? body : body.slice(0, cut)).replace(/[,_]/g, '');
    const tail = cut < 0 ? '' : body.slice(cut);
    const size = /[box]/i.test(type) ? 4 : 3;
    while (prefix.length + groupDigits(head, grouping, size).length + tail.length < width) head = `0${head}`;
    body = groupDigits(head, grouping, size) + tail;
  }
  if (!align) align = numeric ? '>' : '<';
  if (fill === undefined) fill = ' ';
  const used = Array.from(prefix + body).length;
  const pad = Math.max(0, width - used);
  if (!pad) return prefix + body;
  if (align === '<') return prefix + body + fill.repeat(pad);
  if (align === '>') return fill.repeat(pad) + prefix + body;
  if (align === '=') return prefix + fill.repeat(pad) + body;
  const left = Math.floor(pad / 2);
  return fill.repeat(left) + prefix + body + fill.repeat(pad - left);
}

/** round(x) for a float: nearest integer, ties to even, as an int. */
function roundToInt(x) {
  if (Number.isNaN(x)) throw ValueErr('cannot convert float NaN to integer');
  if (!Number.isFinite(x)) throw new PyError('OverflowError', 'cannot convert float infinity to integer');
  const n = scaledRound(Math.abs(x), 0);
  return normBig(x < 0 ? -n : n);
}

function roundFloat(x, nd) {
  if (!Number.isFinite(x) || x === 0) return x;
  if (nd > 308) return x;
  if (nd < -308) return x < 0 ? -0 : 0;
  const n = scaledRound(Math.abs(x), nd);
  const text = nd >= 0 ? (() => { const s = n.toString().padStart(nd + 1, '0'); return `${s.slice(0, s.length - nd)}.${s.slice(s.length - nd)}`; })() : n.toString() + '0'.repeat(-nd);
  const r = Number(text);
  return x < 0 ? -r : r;
}

/* ====================================================================== */
/* Tokenizer                                                              */
/* ====================================================================== */

const KEYWORDS = new Set(['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']);
const OPERATORS = ['**=', '//=', '>>=', '<<=', '...', '!=', '==', '<=', '>=', '->', ':=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '@=', '**', '//', '<<', '>>', '+', '-', '*', '/', '%', '@', '&', '|', '^', '~', '<', '>', '(', ')', '[', ']', '{', '}', ',', ':', '.', ';', '='];
const NUMBER = /0[xX](?:_?[0-9a-fA-F])+|0[oO](?:_?[0-7])+|0[bB](?:_?[01])+|(?:\d(?:_?\d)*)?\.\d(?:_?\d)*(?:[eE][+-]?\d(?:_?\d)*)?|\d(?:_?\d)*\.?(?:[eE][+-]?\d(?:_?\d)*)?/y;
const NAME = /[\p{L}_][\p{L}\p{N}_]*/uy;
const STRING_START = /(?:[fF][rR]?|[rR][fFbB]?|[bB][rR]?|[uU])?(?:'|")/y;
const CLOSER = { '(': ')', '[': ']', '{': '}' };
const ESCAPES = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', v: '\v', 0: '\0' };

/**
 * Turn source text into tokens: name, kw, num, str, fstr, op, nl, indent,
 * dedent, eof. A tokenizer error is recorded on the result (`error`) rather
 * than thrown, so that the parser can decide which error to report first,
 * the way CPython does.
 */
function tokenize(source, firstLine = 1, nested = false) {
  const text = String(source).replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');
  const n = text.length;
  const toks = [];
  const indents = [0];
  const altIndents = [0];
  const brackets = [];
  let i = 0;
  let line = firstLine;
  let atLineStart = !nested;
  let error = null;
  let unclosed = null;
  const push = (t, v) => { const tok = { t, v, line }; toks.push(tok); return tok; };
  const fail = (msg, ln = line, type = 'SyntaxError') => { throw new PyError(type, msg, ln); };

  function readEscape(j) {
    // text[j] is the backslash; returns [string, nextIndex]
    const c = text[j + 1];
    if (c === undefined) return ['\\', j + 1];
    if (c === '\n') { line++; return ['', j + 2]; }
    if (c === 'x') {
      const hex = text.slice(j + 2, j + 4);
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) fail('(unicode error) truncated \\xXX escape');
      return [String.fromCharCode(parseInt(hex, 16)), j + 4];
    }
    if (c === 'u' || c === 'U') {
      const len = c === 'u' ? 4 : 8;
      const hex = text.slice(j + 2, j + 2 + len);
      if (hex.length !== len || !/^[0-9a-fA-F]+$/.test(hex) || parseInt(hex, 16) > 0x10ffff) fail(`(unicode error) truncated \\${c}${'X'.repeat(len)} escape`);
      return [String.fromCodePoint(parseInt(hex, 16)), j + 2 + len];
    }
    if (c >= '0' && c <= '7') {
      const m = /^[0-7]{1,3}/.exec(text.slice(j + 1, j + 4));
      return [String.fromCharCode(parseInt(m[0], 8)), j + 1 + m[0].length];
    }
    if (c === 'N') fail('\\N{…} character names are not available in this mini Python', line, 'NotSupportedError');
    if (Object.prototype.hasOwnProperty.call(ESCAPES, c)) return [ESCAPES[c], j + 2];
    return [`\\${c}`, j + 2]; // unknown escapes are kept, as in Python
  }

  /** Skip a nested string literal inside an f-string expression; returns the index after it. */
  function skipString(j) {
    const q = text[j];
    const triple = text.startsWith(q.repeat(3), j);
    const len = triple ? 3 : 1;
    j += len;
    for (;;) {
      if (j >= n) fail("f-string: expecting '}'");
      if (text[j] === '\\') { j += 2; continue; }
      if (text[j] === '\n') { if (!triple) fail("f-string: expecting '}'"); line++; }
      if (triple ? text.startsWith(q.repeat(3), j) : text[j] === q) return j + len;
      j++;
    }
  }

  /** Read one {replacement field}; text[j] is just after the '{'. */
  function readField(j, parts, q, triple) {
    const start = j;
    const startLine = line;
    let depth = 0;
    const atEnd = (k) => k >= n || (triple ? text.startsWith(q.repeat(3), k) : text[k] === q) || (!triple && text[k] === '\n');
    for (;;) {
      if (j >= n) fail("f-string: expecting '}'", startLine);
      const ch = text[j];
      if (ch === '"' || ch === "'") { j = skipString(j); continue; }
      if (ch === '\n') line++;
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') {
        if (depth === 0) { if (ch === '}') break; fail(`f-string: unmatched '${ch}'`, startLine); }
        depth--;
      } else if (depth === 0 && ((ch === '!' && text[j + 1] !== '=') || ch === ':')) break;
      else if (ch === '#') fail("f-string expression part cannot include '#'", startLine);
      else if (ch === '\\') fail('f-string expression part cannot include a backslash', startLine);
      j++;
    }
    let src = text.slice(start, j);
    if (!src.trim()) fail(text[j] === '}' ? "f-string: valid expression required before '}'" : `f-string: valid expression required before '${text[j]}'`, startLine);
    let debug = null;
    const trimmed = src.replace(/\s+$/, '');
    if (trimmed.endsWith('=') && !/[=!<>]=$/.test(trimmed)) { debug = src; src = trimmed.slice(0, -1); }
    let conv = null;
    if (text[j] === '!') {
      conv = text[j + 1];
      if (!'rsa'.includes(conv || '?')) fail(`f-string: invalid conversion character '${conv}': expected 's', 'r', or 'a'`, startLine);
      j += 2;
      if (text[j] !== ':' && text[j] !== '}') fail("f-string: expecting '}'", startLine);
    }
    let spec = '';
    if (text[j] === ':') {
      const from = ++j;
      while (text[j] !== '}') {
        if (atEnd(j)) fail("f-string: expecting '}'", startLine);
        if (text[j] === '{') fail('nested {…} inside a format spec is not available in this mini Python', startLine, 'NotSupportedError');
        j++;
      }
      spec = text.slice(from, j);
    }
    parts.push({ src, line: startLine, conv, spec, debug });
    return j + 1;
  }

  function readString() {
    STRING_START.lastIndex = i;
    const m = STRING_START.exec(text);
    const prefix = m[0].slice(0, -1).toLowerCase();
    const q = m[0][m[0].length - 1];
    let j = i + m[0].length - 1;
    const triple = text.startsWith(q.repeat(3), j);
    const qlen = triple ? 3 : 1;
    j += qlen;
    const raw = prefix.includes('r');
    const isF = prefix.includes('f');
    const startLine = line;
    if (prefix.includes('b')) fail('bytes literals (b"…") are not available in this mini Python', line, 'NotSupportedError');
    const parts = [];
    let buf = '';
    for (;;) {
      if (j >= n) {
        fail(triple ? `unterminated triple-quoted string literal (detected at line ${line})` : `unterminated string literal (detected at line ${startLine})`, startLine);
      }
      const ch = text[j];
      if (ch === '\n') {
        if (!triple) fail(`unterminated string literal (detected at line ${startLine})`, startLine);
        buf += ch; j++; line++;
        continue;
      }
      if (triple ? text.startsWith(q.repeat(3), j) : ch === q) { j += qlen; break; }
      if (ch === '\\') {
        if (raw) {
          buf += ch;
          if (text[j + 1] !== undefined) { buf += text[j + 1]; if (text[j + 1] === '\n') line++; }
          j += 2;
        } else {
          const [s, nextJ] = readEscape(j);
          buf += s; j = nextJ;
        }
        continue;
      }
      if (isF && (ch === '{' || ch === '}')) {
        if (text[j + 1] === ch) { buf += ch; j += 2; continue; }
        if (ch === '}') fail("f-string: single '}' is not allowed", startLine);
        if (buf) { parts.push({ lit: buf }); buf = ''; }
        j = readField(j + 1, parts, q, triple);
        continue;
      }
      buf += ch; j++;
    }
    i = j;
    const tok = { t: isF ? 'fstr' : 'str', line: startLine };
    if (isF) { if (buf) parts.push({ lit: buf }); tok.parts = parts; } else tok.v = buf;
    toks.push(tok);
  }

  function readNumber() {
    NUMBER.lastIndex = i;
    const m = NUMBER.exec(text);
    const raw = m[0];
    const after = text[i + raw.length];
    const radixed = /^0[xXoObB]/.test(raw);
    if (raw === '0' && after !== undefined && /[xXoObB]/.test(after)) {
      const kind = /[xX]/.test(after) ? 'hexadecimal' : /[oO]/.test(after) ? 'octal' : 'binary';
      const digit = text[i + 2];
      if (kind !== 'hexadecimal' && digit !== undefined && /\d/.test(digit)) fail(`invalid digit '${digit}' in ${kind} literal`);
      fail(`invalid ${kind} literal`);
    }
    if (after !== undefined && /[\p{L}\p{N}_]/u.test(after)) {
      if (!radixed && (after === 'j' || after === 'J')) fail('complex numbers (1j) are not available in this mini Python', line, 'NotSupportedError');
      if (/^0[bB]/.test(raw) && /\d/.test(after)) fail(`invalid digit '${after}' in binary literal`);
      if (/^0[oO]/.test(raw) && /\d/.test(after)) fail(`invalid digit '${after}' in octal literal`);
      fail(radixed ? `invalid ${/^0[xX]/.test(raw) ? 'hexadecimal' : /^0[oO]/.test(raw) ? 'octal' : 'binary'} literal` : 'invalid decimal literal');
    }
    i += raw.length;
    const clean = raw.replace(/_/g, '');
    if (radixed) { push('num', normBig(BigInt(clean.toLowerCase()))); return; }
    if (/[.eE]/.test(clean)) { push('num', new PyFloat(Number(clean))); return; }
    if (/^0\d/.test(clean) && /[1-9]/.test(clean)) fail('leading zeros in decimal integer literals are not permitted; use an 0o prefix for octal integers');
    push('num', clean.length <= 15 ? Number(clean) : normBig(BigInt(clean)));
  }

  try {
    while (i < n) {
      if (atLineStart && brackets.length === 0) {
        let col = 0;
        let alt = 0;
        let j = i;
        for (; j < n; j++) {
          const c = text[j];
          if (c === ' ') { col++; alt++; } else if (c === '\t') { col = (Math.floor(col / 8) + 1) * 8; alt++; } else if (c === '\f') { col = 0; alt = 0; } else break;
        }
        if (j >= n) { i = j; break; }
        if (text[j] === '\n') { i = j + 1; line++; continue; }
        if (text[j] === '#') { while (j < n && text[j] !== '\n') j++; i = j; continue; }
        i = j;
        atLineStart = false;
        const top = indents[indents.length - 1];
        const altTop = altIndents[altIndents.length - 1];
        const tabError = () => fail('inconsistent use of tabs and spaces in indentation', line, 'TabError');
        if (col === top) { if (alt !== altTop) tabError(); } else if (col > top) {
          if (alt <= altTop) tabError();
          indents.push(col); altIndents.push(alt); push('indent');
        } else {
          while (indents.length > 1 && indents[indents.length - 1] > col) { indents.pop(); altIndents.pop(); push('dedent'); }
          if (indents[indents.length - 1] !== col) fail('unindent does not match any outer indentation level', line, 'IndentationError');
          if (altIndents[altIndents.length - 1] !== alt) tabError();
        }
        continue;
      }
      const c = text[i];
      if (c === '\n') {
        i++;
        if (brackets.length === 0) { push('nl'); atLineStart = true; }
        line++;
        continue;
      }
      if (c === ' ' || c === '\t' || c === '\f') { i++; continue; }
      if (c === '#') { while (i < n && text[i] !== '\n') i++; continue; }
      if (c === '\\') {
        if (text[i + 1] === '\n') { i += 2; line++; continue; }
        if (i + 1 >= n) fail('unexpected EOF while parsing');
        fail('unexpected character after line continuation character');
      }
      STRING_START.lastIndex = i;
      if (STRING_START.test(text)) { readString(); continue; }
      if ((c >= '0' && c <= '9') || (c === '.' && text[i + 1] >= '0' && text[i + 1] <= '9')) { readNumber(); continue; }
      NAME.lastIndex = i;
      const nm = NAME.exec(text);
      if (nm) { i += nm[0].length; push(KEYWORDS.has(nm[0]) ? 'kw' : 'name', nm[0]); continue; }
      let op = null;
      for (const cand of OPERATORS) if (text.startsWith(cand, i)) { op = cand; break; }
      if (!op) {
        const ch = String.fromCodePoint(text.codePointAt(i));
        const code = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
        if (ch === '\u00A0' || ch === '\u200B' || ch.codePointAt(0) < 0x20) fail(`invalid non-printable character U+${code}`);
        if (ch === '$' || ch === '?' || ch === '!' || ch === '`') fail('invalid syntax');
        fail(`invalid character '${ch}' (U+${code})`);
      }
      if (op === '(' || op === '[' || op === '{') brackets.push({ ch: op, line, index: toks.length });
      else if (op === ')' || op === ']' || op === '}') {
        const open = brackets.pop();
        if (!open) fail(`unmatched '${op}'`);
        if (CLOSER[open.ch] !== op) fail(`closing parenthesis '${op}' does not match opening parenthesis '${open.ch}'`);
      }
      i += op.length;
      push('op', op);
    }
  } catch (err) {
    if (!(err instanceof PyError)) throw err;
    error = err;
  }
  if (!error && brackets.length) unclosed = brackets[brackets.length - 1];
  // CPython reports the last real line for errors found at the end of the file.
  let eofLine = line;
  if (n > 0 && text[n - 1] === '\n' && line > firstLine) eofLine = line - 1;
  line = eofLine;
  if (!nested) {
    if (toks.length && toks[toks.length - 1].t !== 'nl') push('nl');
    while (indents.length > 1) { indents.pop(); push('dedent'); }
  }
  push('eof');
  return { toks, error, unclosed };
}

/* ====================================================================== */
/* Parser                                                                 */
/* ====================================================================== */

const COMPARE_OPS = new Set(['==', '!=', '<', '>', '<=', '>=']);
const AUG_OPS = new Set(['+=', '-=', '*=', '/=', '//=', '%=', '**=']);
const UNSUPPORTED_KW = {
  import: 'import is', from: 'import is', class: 'classes are', try: 'try / except is', except: 'try / except is', finally: 'try / except is',
  with: 'with blocks are', lambda: 'lambda is', yield: 'generators (yield) are', raise: 'raise is', async: 'async code is',
  await: 'async code is', nonlocal: 'nonlocal is',
};
/** `what` is a phrase ending in "is" or "are": "classes are", "lambda is". */
const notSupported = (what, line) => new PyError('NotSupportedError', `${/ (?:is|are)$/.test(what) ? what : `${what} is`} not available in this mini Python`, line);

class Parser {
  constructor(tokens) {
    this.toks = tokens.toks;
    this.unclosed = tokens.unclosed;
    this.i = 0;
    this.fnDepth = 0;
    this.loopDepth = 0;
    this.scope = null; // { assigned: Set, globals: Set } while inside a def
  }

  get tok() { return this.toks[this.i]; }
  peek(k = 1) { return this.toks[Math.min(this.i + k, this.toks.length - 1)]; }
  next() { const t = this.toks[this.i]; if (this.i < this.toks.length - 1) this.i++; return t; }
  isOp(v) { const t = this.toks[this.i]; return t.t === 'op' && t.v === v; }
  isKw(v) { const t = this.toks[this.i]; return t.t === 'kw' && t.v === v; }
  acceptOp(v) { if (this.isOp(v)) { this.i++; return true; } return false; }
  acceptKw(v) { if (this.isKw(v)) { this.i++; return true; } return false; }

  /** A generic syntax error at the current token (may become "'(' was never closed"). */
  fail(msg = 'invalid syntax', tok = this.tok, type = 'SyntaxError') {
    const un = this.unclosed;
    if (un && type === 'SyntaxError' && /^(invalid syntax|expected)/.test(msg) && (tok.t === 'eof' || tok.t === 'nl' || tok.t === 'dedent' || tok.line > un.line)) {
      throw new PyError('SyntaxError', `'${un.ch}' was never closed`, un.line);
    }
    throw new PyError(type, msg, tok.line);
  }

  expectOp(v, msg) { if (!this.acceptOp(v)) this.fail(msg); }

  /* ---------------------------------------------------------- statements */

  program() {
    const body = [];
    while (this.tok.t !== 'eof') this.statement(body);
    return { type: 'Module', body };
  }

  statement(out) {
    const t = this.tok;
    if (t.t === 'indent') this.fail('unexpected indent', t, 'IndentationError');
    if (t.t === 'nl') { this.next(); return; }
    if (t.t === 'kw') {
      switch (t.v) {
        case 'if': out.push(this.ifStmt()); return;
        case 'while': out.push(this.whileStmt()); return;
        case 'for': out.push(this.forStmt()); return;
        case 'def': out.push(this.defStmt()); return;
        case 'elif': case 'else': this.fail('invalid syntax');
        // falls through
        default:
      }
    }
    if (t.t === 'op' && t.v === '@') throw notSupported('decorators are', t.line);
    this.simpleLine(out);
  }

  /** One or more simple statements separated by ';', then a newline. */
  simpleLine(out) {
    for (;;) {
      out.push(this.simpleStmt());
      if (this.acceptOp(';')) { if (this.tok.t === 'nl' || this.tok.t === 'eof') break; continue; }
      break;
    }
    if (this.tok.t === 'nl') this.next();
    else if (this.tok.t !== 'eof') this.fail('invalid syntax');
  }

  simpleStmt() {
    const t = this.tok;
    const line = t.line;
    if (t.t === 'kw') {
      switch (t.v) {
        case 'pass': this.next(); return { type: 'Pass', line };
        case 'break':
          if (!this.loopDepth) this.fail("'break' outside loop");
          this.next(); return { type: 'Break', line };
        case 'continue':
          if (!this.loopDepth) this.fail("'continue' not properly in loop");
          this.next(); return { type: 'Continue', line };
        case 'return': {
          if (!this.fnDepth) this.fail("'return' outside function");
          this.next();
          const value = this.endOfSimple() ? null : this.exprList();
          return { type: 'Return', value, line };
        }
        case 'global': {
          this.next();
          const names = [];
          do {
            if (this.tok.t !== 'name') this.fail('invalid syntax');
            names.push(this.next().v);
          } while (this.acceptOp(','));
          if (this.scope) for (const nm of names) this.scope.globals.add(nm);
          return { type: 'Global', names, line };
        }
        case 'del': {
          this.next();
          const targets = [];
          do { targets.push(this.toTarget(this.expr(), 'del')); } while (this.acceptOp(','));
          return { type: 'Del', targets, line };
        }
        case 'assert': {
          this.next();
          const test = this.expr();
          const message = this.acceptOp(',') ? this.expr() : null;
          return { type: 'Assert', test, message, line };
        }
        default:
          if (UNSUPPORTED_KW[t.v]) throw notSupported(UNSUPPORTED_KW[t.v], line);
      }
    }
    const left = this.exprList(true);
    if (this.isOp('=')) {
      const parts = [left];
      while (this.acceptOp('=')) {
        if (this.endOfSimple()) this.fail('invalid syntax');
        parts.push(this.exprList(true));
      }
      const value = parts.pop();
      const targets = parts.map((p) => this.toTarget(p, 'assign'));
      return { type: 'Assign', targets, value, line };
    }
    if (this.tok.t === 'op' && AUG_OPS.has(this.tok.v)) {
      const op = this.next().v;
      if (left.type !== 'Name' && left.type !== 'Index') {
        if (left.type === 'Attr') throw notSupported('assigning to an attribute (x.y = …)', line);
        this.fail(`'${describeTarget(left)}' is an illegal expression for augmented assignment`, t);
      }
      if (left.type === 'Name' && this.scope) this.scope.assigned.add(left.id);
      if (this.endOfSimple()) this.fail('invalid syntax');
      const value = this.exprList();
      return { type: 'AugAssign', target: left, op: op.slice(0, -1), value, line };
    }
    if (this.tok.t === 'op' && /^(?:&|\||\^|<<|>>|@)=$/.test(this.tok.v)) throw notSupported(`the ${this.tok.v} operator`, line);
    if (this.isOp(':') && left.type === 'Name') throw notSupported('type annotations (x: int = …) are', line);
    if (left.type === 'Name' && left.id === 'print' && ['str', 'fstr', 'num', 'name'].includes(this.tok.t)) {
      this.fail("Missing parentheses in call to 'print'. Did you mean print(...)?", t);
    }
    return { type: 'Expr', value: left, line };
  }

  endOfSimple() { const t = this.tok; return t.t === 'nl' || t.t === 'eof' || (t.t === 'op' && t.v === ';'); }

  /** Turn a parsed expression into an assignment target (or complain). */
  toTarget(node, how) {
    const suffix = how === 'assign' ? " here. Maybe you meant '==' instead of '='?" : '';
    const bad = (what) => this.fail(how === 'del' ? `cannot delete ${what}` : `cannot assign to ${what}${suffix}`, { line: node.line, t: 'x' });
    switch (node.type) {
      case 'Name':
        if (this.scope && how !== 'del') this.scope.assigned.add(node.id);
        return node;
      case 'Index':
        if (node.index.type === 'Slice' && how !== 'del') throw notSupported('assigning to a slice (a[1:3] = …)', node.line);
        return node;
      case 'Attr': throw notSupported('assigning to an attribute (x.y = …)', node.line);
      case 'Tuple': case 'List':
        if (how === 'del') throw notSupported('deleting several things at once', node.line);
        return { type: 'Unpack', elts: node.elts.map((e) => this.toTarget(e, how === 'assign' ? 'assign-inner' : how)), line: node.line };
      case 'Const':
        if (node.value === true || node.value === false || node.value === null) {
          this.fail(`cannot ${how === 'del' ? 'delete' : 'assign to'} ${pyRepr(node.value)}`, { line: node.line, t: 'x' });
        }
        return bad('literal');
      case 'FString': return bad('f-string expression');
      case 'Call': return bad('function call');
      case 'Compare': return this.fail(`cannot ${how === 'del' ? 'delete' : 'assign to'} comparison`, { line: node.line, t: 'x' });
      case 'IfExp': return this.fail('cannot assign to conditional expression', { line: node.line, t: 'x' });
      default: return bad('expression');
    }
  }

  /** ':' then an indented block (or simple statements on the same line). */
  block(what, headerLine) {
    if (!this.isOp(':')) {
      if (this.isOp('=')) this.fail("invalid syntax. Maybe you meant '==' or ':=' instead of '='?");
      if (this.tok.t === 'nl' || this.tok.t === 'eof' || what === "'else' statement") this.fail("expected ':'");
      this.fail('invalid syntax');
    }
    this.next();
    const body = [];
    if (this.tok.t !== 'nl') {
      if (this.tok.t === 'eof') this.fail('invalid syntax');
      this.simpleLine(body);
      return body;
    }
    this.next();
    if (this.tok.t !== 'indent') this.fail(`expected an indented block after ${what} on line ${headerLine}`, this.tok, 'IndentationError');
    this.next();
    while (this.tok.t !== 'dedent' && this.tok.t !== 'eof') this.statement(body);
    if (this.tok.t === 'dedent') this.next();
    return body;
  }

  ifStmt(word = 'if') {
    const line = this.next().line;
    if (this.isOp(':') || this.tok.t === 'nl') this.fail('invalid syntax');
    const test = this.namedExpr();
    const body = this.block(`'${word}' statement`, line);
    let orelse = null;
    if (this.isKw('elif')) orelse = [this.ifStmt('elif')];
    else if (this.isKw('else')) {
      const elseLine = this.next().line;
      orelse = this.block("'else' statement", elseLine);
    }
    return { type: 'If', test, body, orelse, line };
  }

  whileStmt() {
    const line = this.next().line;
    if (this.isOp(':') || this.tok.t === 'nl') this.fail('invalid syntax');
    const test = this.namedExpr();
    this.loopDepth++;
    const body = this.block("'while' statement", line);
    this.loopDepth--;
    if (this.isKw('else')) throw notSupported('else on a loop', this.tok.line);
    return { type: 'While', test, body, line };
  }

  forStmt() {
    const line = this.next().line;
    const first = this.tok;
    const elts = [];
    let isTuple = false;
    for (;;) {
      if (this.isKw('in') || this.isOp(':') || this.tok.t === 'nl') { if (!elts.length) this.fail('invalid syntax'); break; }
      elts.push(this.bitOr());
      if (!this.acceptOp(',')) break;
      isTuple = true;
    }
    const raw = isTuple ? { type: 'Tuple', elts, line: first.line } : elts[0];
    if (raw.type === 'Const' || raw.type === 'FString') this.fail('cannot assign to literal', first);
    const target = this.toTarget(raw, 'for');
    if (!this.acceptKw('in')) this.fail('invalid syntax');
    if (this.isOp(':') || this.tok.t === 'nl') this.fail('invalid syntax');
    const iter = this.exprList();
    this.loopDepth++;
    const body = this.block("'for' statement", line);
    this.loopDepth--;
    if (this.isKw('else')) throw notSupported('else on a loop', this.tok.line);
    return { type: 'For', target, iter, body, line };
  }

  defStmt() {
    const line = this.next().line;
    if (this.tok.t !== 'name') this.fail('invalid syntax');
    const name = this.next().v;
    if (this.scope) this.scope.assigned.add(name);
    this.expectOp('(', 'invalid syntax');
    const params = [];
    const defaults = [];
    while (!this.isOp(')')) {
      if (this.isOp('*') || this.isOp('**')) throw notSupported('*args and **kwargs are', line);
      if (this.isOp('/')) throw notSupported('positional-only parameters are', line);
      if (this.tok.t !== 'name') this.fail('invalid syntax');
      const p = this.next().v;
      if (params.includes(p)) this.fail(`duplicate argument '${p}' in function definition`, { line, t: 'x' });
      params.push(p);
      if (this.acceptOp(':')) this.expr(); // annotation: parsed and ignored
      if (this.acceptOp('=')) defaults.push(this.expr());
      else if (defaults.length) this.fail('parameter without a default follows parameter with a default', { line, t: 'x' });
      if (!this.acceptOp(',')) break;
    }
    this.expectOp(')', 'invalid syntax');
    if (this.acceptOp('->')) this.expr();
    const outer = { scope: this.scope, fnDepth: this.fnDepth, loopDepth: this.loopDepth };
    this.scope = { assigned: new Set(params), globals: new Set() };
    this.fnDepth++;
    this.loopDepth = 0;
    const body = this.block('function definition', line);
    const { assigned, globals } = this.scope;
    for (const g of globals) assigned.delete(g);
    this.scope = outer.scope; this.fnDepth = outer.fnDepth; this.loopDepth = outer.loopDepth;
    return { type: 'Def', name, params, defaults, body, locals: assigned, globals, line };
  }

  /* --------------------------------------------------------- expressions */

  /** expr (',' expr)* [','] — a tuple when there is a comma. */
  exprList(allowStar = false) {
    const first = this.tok;
    if (this.isOp('*')) { if (allowStar) throw notSupported('starred expressions (*x) are', first.line); this.fail("can't use starred expression here"); }
    const e = this.expr();
    if (!this.isOp(',')) return e;
    const elts = [e];
    while (this.acceptOp(',')) {
      if (this.endOfSimple() || this.isOp('=') || this.isOp(')') || this.isOp(':')) break;
      if (this.isOp('*')) throw notSupported('starred expressions (*x) are', this.tok.line);
      elts.push(this.expr());
    }
    return { type: 'Tuple', elts, line: first.line };
  }

  namedExpr() {
    const e = this.expr();
    if (this.isOp(':=')) throw notSupported('the := operator', this.tok.line);
    return e;
  }

  expr() {
    if (this.isKw('lambda')) throw notSupported('lambda', this.tok.line);
    const body = this.orTest();
    if (this.isKw('if')) {
      const line = this.next().line;
      const test = this.orTest();
      if (!this.acceptKw('else')) this.fail("expected 'else' after 'if' expression");
      const orelse = this.expr();
      return { type: 'IfExp', test, body, orelse, line: body.line || line };
    }
    return body;
  }

  orTest() {
    let left = this.andTest();
    if (!this.isKw('or')) return left;
    const values = [left];
    while (this.acceptKw('or')) values.push(this.andTest());
    left = { type: 'BoolOp', op: 'or', values, line: left.line };
    return left;
  }

  andTest() {
    const left = this.notTest();
    if (!this.isKw('and')) return left;
    const values = [left];
    while (this.acceptKw('and')) values.push(this.notTest());
    return { type: 'BoolOp', op: 'and', values, line: left.line };
  }

  notTest() {
    if (this.isKw('not')) {
      const line = this.next().line;
      return { type: 'Not', operand: this.notTest(), line };
    }
    return this.comparison();
  }

  comparison() {
    const left = this.bitOr();
    const ops = [];
    const rights = [];
    for (;;) {
      const t = this.tok;
      let op = null;
      if (t.t === 'op' && COMPARE_OPS.has(t.v)) { op = t.v; this.next(); }
      else if (t.t === 'kw' && t.v === 'in') { op = 'in'; this.next(); }
      else if (t.t === 'kw' && t.v === 'not' && this.peek().t === 'kw' && this.peek().v === 'in') { op = 'not in'; this.next(); this.next(); }
      else if (t.t === 'kw' && t.v === 'is') { this.next(); op = this.acceptKw('not') ? 'is not' : 'is'; }
      else break;
      ops.push(op);
      rights.push(this.bitOr());
    }
    if (!ops.length) return left;
    return { type: 'Compare', left, ops, rights, line: left.line };
  }

  /** Bitwise operators are not part of the subset; say so clearly. */
  bitOr() {
    const left = this.arith();
    const t = this.tok;
    if (t.t === 'op' && (t.v === '|' || t.v === '&' || t.v === '^' || t.v === '<<' || t.v === '>>')) {
      const extra = t.v === '^' ? ' (for powers, use **)' : (t.v === '&' || t.v === '|') ? ' (use the words and / or)' : '';
      throw new PyError('NotSupportedError', `the ${t.v} operator is not available in this mini Python${extra}`, t.line);
    }
    return left;
  }

  arith() {
    let left = this.term();
    for (;;) {
      const t = this.tok;
      if (t.t !== 'op' || (t.v !== '+' && t.v !== '-')) return left;
      this.next();
      left = { type: 'BinOp', op: t.v, left, right: this.term(), line: left.line };
    }
  }

  term() {
    let left = this.factor();
    for (;;) {
      const t = this.tok;
      if (t.t !== 'op' || (t.v !== '*' && t.v !== '/' && t.v !== '//' && t.v !== '%' && t.v !== '@')) return left;
      if (t.v === '@') throw notSupported('the @ operator', t.line);
      this.next();
      left = { type: 'BinOp', op: t.v, left, right: this.factor(), line: left.line };
    }
  }

  factor() {
    const t = this.tok;
    if (t.t === 'op' && (t.v === '-' || t.v === '+')) {
      this.next();
      const operand = this.factor();
      if (t.v === '-' && operand.type === 'Const' && operand.fresh && isNum(operand.value) && typeof operand.value !== 'boolean') {
        return { type: 'Const', value: negate(operand.value), line: t.line }; // fold -5 into one constant
      }
      return { type: 'Unary', op: t.v, operand, line: t.line };
    }
    if (t.t === 'op' && t.v === '~') throw notSupported('the ~ operator', t.line);
    return this.power();
  }

  power() {
    const base = this.primary();
    if (this.isOp('**')) {
      this.next();
      if (base.type === 'Const') base.fresh = false;
      return { type: 'BinOp', op: '**', left: base, right: this.factor(), line: base.line };
    }
    return base;
  }

  primary() {
    let node = this.atom();
    for (;;) {
      const t = this.tok;
      if (t.t !== 'op') return node;
      if (t.v === '(') {
        this.next();
        const { args, kwargs } = this.callArgs();
        node = { type: 'Call', func: node, args, kwargs, line: node.line };
      } else if (t.v === '[') {
        this.next();
        const index = this.subscript();
        this.expectOp(']', 'invalid syntax');
        node = { type: 'Index', value: node, index, line: node.line };
      } else if (t.v === '.') {
        this.next();
        if (this.tok.t !== 'name') this.fail('invalid syntax');
        node = { type: 'Attr', value: node, attr: this.next().v, line: node.line };
      } else return node;
    }
  }

  callArgs() {
    const args = [];
    let kwargs = null;
    while (!this.isOp(')')) {
      if (this.isOp('*') || this.isOp('**')) throw notSupported('unpacking arguments with * or **', this.tok.line);
      if (this.tok.t === 'name' && this.peek().t === 'op' && this.peek().v === '=') {
        const key = this.next().v;
        this.next();
        if (!kwargs) kwargs = [];
        if (kwargs.some((k) => k.name === key)) this.fail(`keyword argument repeated: ${key}`);
        kwargs.push({ name: key, value: this.expr() });
      } else {
        const start = this.tok;
        const e = this.expr();
        if (this.isKw('for')) throw notSupported('generator expressions are', this.tok.line);
        if (this.isOp('=')) this.fail("expression cannot contain assignment, perhaps you meant \"==\"?", start);
        if (kwargs) this.fail('positional argument follows keyword argument', start);
        args.push(e);
      }
      if (!this.acceptOp(',')) break;
    }
    if (!this.isOp(')')) this.fail(this.startsExpr() ? 'invalid syntax. Perhaps you forgot a comma?' : 'invalid syntax');
    this.next();
    return { args, kwargs };
  }

  startsExpr() {
    const t = this.tok;
    if (t.t === 'name' || t.t === 'num' || t.t === 'str' || t.t === 'fstr') return true;
    if (t.t === 'kw') return t.v === 'True' || t.v === 'False' || t.v === 'None' || t.v === 'not';
    return t.t === 'op' && (t.v === '(' || t.v === '[' || t.v === '{');
  }

  subscript() {
    const line = this.tok.line;
    const part = () => (this.isOp(':') || this.isOp(']') ? null : this.expr());
    const start = part();
    if (!this.isOp(':')) {
      if (start === null) this.fail('invalid syntax');
      if (this.isOp(',')) throw notSupported('indexing with several values (a[1, 2])', line);
      return start;
    }
    this.next();
    const stop = part();
    let step = null;
    if (this.acceptOp(':')) step = part();
    return { type: 'Slice', start, stop, step, line };
  }

  atom() {
    const t = this.tok;
    const line = t.line;
    switch (t.t) {
      case 'name': this.next(); return { type: 'Name', id: t.v, line };
      case 'num': this.next(); return { type: 'Const', value: t.v, fresh: true, line };
      case 'str': case 'fstr': return this.strings();
      case 'kw':
        if (t.v === 'True') { this.next(); return { type: 'Const', value: true, line }; }
        if (t.v === 'False') { this.next(); return { type: 'Const', value: false, line }; }
        if (t.v === 'None') { this.next(); return { type: 'Const', value: null, line }; }
        if (UNSUPPORTED_KW[t.v] && t.v !== 'from' && t.v !== 'except' && t.v !== 'finally') throw notSupported(UNSUPPORTED_KW[t.v], line);
        return this.fail('invalid syntax');
      case 'op':
        if (t.v === '(') return this.paren();
        if (t.v === '[') return this.listDisplay();
        if (t.v === '{') return this.dictDisplay();
        if (t.v === '...') throw notSupported('the ... object', line);
        return this.fail('invalid syntax');
      case 'indent': return this.fail('unexpected indent', t, 'IndentationError');
      default: return this.fail('invalid syntax');
    }
  }

  strings() {
    const line = this.tok.line;
    const parts = [];
    let plain = true;
    while (this.tok.t === 'str' || this.tok.t === 'fstr') {
      const t = this.next();
      if (t.t === 'str') { parts.push({ lit: t.v }); continue; }
      plain = false;
      for (const p of t.parts) {
        if (p.lit !== undefined) { parts.push(p); continue; }
        const sub = tokenize(`(${p.src})`, p.line, true);
        if (sub.error) throw sub.error;
        const inner = new Parser(sub);
        inner.scope = this.scope;
        inner.next();
        const value = inner.exprList();
        if (!inner.isOp(')')) inner.fail(inner.startsExpr() ? 'invalid syntax. Perhaps you forgot a comma?' : 'invalid syntax');
        inner.next();
        if (inner.tok.t !== 'eof') inner.fail('invalid syntax');
        parts.push({ value, conv: p.conv, spec: p.spec, debug: p.debug });
      }
    }
    if (plain) return { type: 'Const', value: parts.map((p) => p.lit).join(''), line };
    return { type: 'FString', parts, line };
  }

  paren() {
    const line = this.next().line;
    if (this.acceptOp(')')) return { type: 'Tuple', elts: [], line };
    if (this.isOp('*')) throw notSupported('starred expressions (*x) are', line);
    const first = this.namedExpr();
    if (this.isKw('for')) throw notSupported('generator expressions are', this.tok.line);
    if (this.acceptOp(')')) { if (first.type === 'Const') first.fresh = false; return first; }
    if (!this.isOp(',')) this.fail(this.startsExpr() ? 'invalid syntax. Perhaps you forgot a comma?' : 'invalid syntax');
    const elts = [first];
    while (this.acceptOp(',')) {
      if (this.isOp(')')) break;
      elts.push(this.expr());
    }
    if (!this.isOp(')')) this.fail(this.startsExpr() ? 'invalid syntax. Perhaps you forgot a comma?' : 'invalid syntax');
    this.next();
    return { type: 'Tuple', elts, line };
  }

  listDisplay() {
    const line = this.next().line;
    const elts = [];
    while (!this.isOp(']')) {
      if (this.isOp('*')) throw notSupported('starred expressions (*x) are', this.tok.line);
      elts.push(this.expr());
      if (this.isKw('for')) throw notSupported('list comprehensions are', this.tok.line);
      if (!this.acceptOp(',')) break;
    }
    if (!this.isOp(']')) this.fail(this.startsExpr() ? 'invalid syntax. Perhaps you forgot a comma?' : 'invalid syntax');
    this.next();
    return { type: 'List', elts, line };
  }

  dictDisplay() {
    const line = this.next().line;
    const keys = [];
    const values = [];
    while (!this.isOp('}')) {
      if (this.isOp('**')) throw notSupported('unpacking with **', this.tok.line);
      const key = this.expr();
      if (!this.isOp(':')) {
        if (this.isOp(',') || this.isOp('}') || this.isKw('for')) throw notSupported('sets ({1, 2, 3}) are', line);
        this.fail(this.startsExpr() ? 'invalid syntax. Perhaps you forgot a comma?' : 'invalid syntax');
      }
      this.next();
      keys.push(key);
      values.push(this.expr());
      if (this.isKw('for')) throw notSupported('dict comprehensions are', this.tok.line);
      if (!this.acceptOp(',')) break;
    }
    if (!this.isOp('}')) this.fail(this.startsExpr() ? 'invalid syntax. Perhaps you forgot a comma?' : 'invalid syntax');
    this.next();
    return { type: 'Dict', keys, values, line };
  }
}

function describeTarget(node) {
  switch (node.type) {
    case 'Const': return 'literal';
    case 'Call': return 'function call';
    case 'Tuple': return 'tuple';
    case 'List': return 'list';
    case 'Compare': return 'comparison';
    default: return 'expression';
  }
}

/** Parse a whole program. Throws PyError (SyntaxError and friends). */
export function parse(source) {
  const tokens = tokenize(source);
  const parser = new Parser(tokens);
  let tree;
  try {
    tree = parser.program();
  } catch (err) {
    // Like CPython: a tokenizer error anywhere wins over a parser error,
    // except for an unexpected indent met before it.
    if (tokens.error && !(err instanceof PyError && err.message === 'unexpected indent')) throw tokens.error;
    throw err;
  }
  if (tokens.error) throw tokens.error;
  return tree;
}

function parseExpression(source) {
  const tokens = tokenize(`(${source}\n)`, 1, true);
  if (tokens.error) throw tokens.error;
  const parser = new Parser(tokens);
  parser.next();
  const node = parser.exprList();
  if (!parser.isOp(')')) parser.fail('invalid syntax');
  parser.next();
  if (parser.tok.t !== 'eof') parser.fail('invalid syntax');
  return node;
}

/* ====================================================================== */
/* Methods of str, list, dict, tuple                                      */
/* ====================================================================== */

function argCount(name, args, min, max = min) {
  const n = args.length;
  if (n >= min && n <= max) return;
  if (min === max) {
    if (min === 0) throw TypeErr(`${name}() takes no arguments (${n} given)`);
    if (min === 1) throw TypeErr(`${name}() takes exactly one argument (${n} given)`);
    throw TypeErr(`${name.replace(/^.*\./, '')} expected ${min} arguments, got ${n}`);
  }
  const short = name.replace(/^.*\./, '');
  if (n < min) throw TypeErr(`${short} expected at least ${min} argument${min === 1 ? '' : 's'}, got ${n}`);
  throw TypeErr(`${short} expected at most ${max} argument${max === 1 ? '' : 's'}, got ${n}`);
}

function noKw(name, kw) {
  for (const k in kw) throw TypeErr(`${name}() takes no keyword arguments`); // eslint-disable-line guard-for-in, no-unreachable-loop
}

function strArg(method, v, pos = 1) {
  if (typeof v !== 'string') throw TypeErr(`${method}() argument ${pos} must be str, not ${typeName(v)}`);
  return v;
}

const WS = /^\s$/u;

function stripChars(s, set, left, right) {
  const cs = Array.from(s);
  const drop = set === null ? (c) => WS.test(c) : (c) => set.includes(c);
  let a = 0;
  let b = cs.length;
  if (left) while (a < b && drop(cs[a])) a++;
  if (right) while (b > a && drop(cs[b - 1])) b--;
  return cs.slice(a, b).join('');
}

function stripMethod(name, left, right) {
  return (I, s, args) => {
    argCount(`str.${name}`, args, 0, 1);
    const set = args.length && args[0] !== null ? args[0] : null;
    if (set !== null && typeof set !== 'string') throw TypeErr(`${name} arg must be None or str`);
    return stripChars(s, set, left, right);
  };
}

function splitWhitespace(s, max) {
  const out = [];
  const re = /\S+/gu;
  let m;
  while ((m = re.exec(s))) {
    if (max >= 0 && out.length === max) { out.push(s.slice(m.index).replace(/^\s+/u, '')); return out; }
    out.push(m[0]);
  }
  return out;
}

function findFrom(s, sub, start, end, last = false) {
  const cs = chars(s);
  const len = cs.length;
  const fix = (v, dflt) => { if (v === undefined || v === null) return dflt; let i = toIndex(v); if (i < 0) i += len; return Math.min(len, Math.max(0, i)); };
  const a = fix(start, 0);
  const b = fix(end, len);
  if (cs !== s) { // strings with astral characters: work on code points
    const hay = cs.slice(a, b).join('');
    const pos = last ? hay.lastIndexOf(sub) : hay.indexOf(sub);
    return pos < 0 ? -1 : a + Array.from(hay.slice(0, pos)).length;
  }
  if (a > b) return -1;
  const hay = s.slice(a, b);
  const pos = last ? hay.lastIndexOf(sub) : hay.indexOf(sub);
  return pos < 0 ? -1 : a + pos;
}

function affix(name, test) {
  return (I, s, args) => {
    argCount(name, args, 1, 3);
    const p = args[0];
    const cs = chars(s);
    const body = args.length > 1 ? getItem(s, new PySlice(args[1] === undefined ? null : args[1], args[2] === undefined ? null : args[2], null)) : s;
    void cs;
    if (typeof p === 'string') return test(body, p);
    if (p instanceof PyTuple) {
      return p.items.some((x) => { if (typeof x !== 'string') throw TypeErr(`tuple for ${name} must only contain str, not ${typeName(x)}`); return test(body, x); });
    }
    throw TypeErr(`${name} first arg must be str or a tuple of str, not ${typeName(p)}`);
  };
}

const isCased = (s, fn) => s !== fn(s) || /\p{L}/u.test(s);

const STR_METHODS = {
  upper: (I, s, a) => { argCount('str.upper', a, 0); return s.toUpperCase(); },
  lower: (I, s, a) => { argCount('str.lower', a, 0); return s.toLowerCase(); },
  strip: stripMethod('strip', true, true),
  lstrip: stripMethod('lstrip', true, false),
  rstrip: stripMethod('rstrip', false, true),
  split: (I, s, a, kw) => {
    argCount('split', a, 0, 2);
    const sep = a.length ? a[0] : (kw.sep === undefined ? null : kw.sep);
    const max = a.length > 1 ? toIndex(a[1]) : (kw.maxsplit === undefined ? -1 : toIndex(kw.maxsplit));
    if (sep === null) return splitWhitespace(s, max);
    if (typeof sep !== 'string') throw TypeErr(`must be str or None, not ${typeName(sep)}`);
    if (sep === '') throw ValueErr('empty separator');
    if (max < 0) return s.split(sep);
    const out = [];
    let from = 0;
    while (out.length < max) {
      const at = s.indexOf(sep, from);
      if (at < 0) break;
      out.push(s.slice(from, at));
      from = at + sep.length;
    }
    out.push(s.slice(from));
    return out;
  },
  join: (I, s, a) => {
    argCount('str.join', a, 1);
    let next;
    try { next = getIter(a[0]); } catch { throw TypeErr('can only join an iterable'); }
    const parts = [];
    let total = 0;
    for (let x = next(); x !== STOP; x = next()) {
      I.tick();
      if (typeof x !== 'string') throw TypeErr(`sequence item ${parts.length}: expected str instance, ${typeName(x)} found`);
      parts.push(x);
      total += x.length + s.length;
      checkLen(total);
    }
    return parts.join(s);
  },
  replace: (I, s, a) => {
    if (a.length < 2) throw TypeErr(`replace() takes at least 2 positional arguments (${a.length} given)`);
    argCount('replace', a, 2, 3);
    const from = strArg('replace', a[0], 1);
    const to = strArg('replace', a[1], 2);
    let count = a.length > 2 ? toIndex(a[2]) : -1;
    if (count < 0) count = Infinity;
    if (from === '') {
      const cs = Array.from(s);
      let out = '';
      let used = 0;
      for (let i = 0; i <= cs.length; i++) { if (used < count) { out += to; used++; } if (i < cs.length) out += cs[i]; }
      checkLen(out.length);
      return out;
    }
    let out = '';
    let pos = 0;
    let used = 0;
    while (used < count) {
      const at = s.indexOf(from, pos);
      if (at < 0) break;
      out += s.slice(pos, at) + to;
      checkLen(out.length);
      pos = at + from.length;
      used++;
    }
    return out + s.slice(pos);
  },
  find: (I, s, a) => { argCount('find', a, 1, 3); return findFrom(s, strArg('find', a[0]), a[1], a[2]); },
  rfind: (I, s, a) => { argCount('rfind', a, 1, 3); return findFrom(s, strArg('rfind', a[0]), a[1], a[2], true); },
  index: (I, s, a) => {
    argCount('index', a, 1, 3);
    const at = findFrom(s, strArg('index', a[0]), a[1], a[2]);
    if (at < 0) throw ValueErr('substring not found');
    return at;
  },
  count: (I, s, a) => {
    argCount('count', a, 1, 3);
    const sub = strArg('count', a[0]);
    const body = a.length > 1 ? getItem(s, new PySlice(a[1], a[2] === undefined ? null : a[2], null)) : s;
    if (sub === '') return chars(body).length + 1;
    let nFound = 0;
    for (let pos = body.indexOf(sub); pos >= 0; pos = body.indexOf(sub, pos + sub.length)) nFound++;
    return nFound;
  },
  startswith: affix('startswith', (s, p) => s.startsWith(p)),
  endswith: affix('endswith', (s, p) => s.endsWith(p)),
  isdigit: (I, s, a) => { argCount('str.isdigit', a, 0); return /^\p{Nd}+$/u.test(s); },
  isalpha: (I, s, a) => { argCount('str.isalpha', a, 0); return /^\p{L}+$/u.test(s); },
  isalnum: (I, s, a) => { argCount('str.isalnum', a, 0); return /^[\p{L}\p{N}]+$/u.test(s); },
  isspace: (I, s, a) => { argCount('str.isspace', a, 0); return /^\s+$/u.test(s); },
  isupper: (I, s, a) => { argCount('str.isupper', a, 0); return s === s.toUpperCase() && s !== s.toLowerCase(); },
  islower: (I, s, a) => { argCount('str.islower', a, 0); return s === s.toLowerCase() && s !== s.toUpperCase(); },
  capitalize: (I, s, a) => { argCount('str.capitalize', a, 0); const cs = Array.from(s); return cs.length ? cs[0].toUpperCase() + cs.slice(1).join('').toLowerCase() : s; },
  title: (I, s, a) => {
    argCount('str.title', a, 0);
    let out = '';
    let prevCased = false;
    for (const ch of s) {
      const cased = isCased(ch, (c) => c.toUpperCase()) && /\p{L}/u.test(ch);
      out += cased ? (prevCased ? ch.toLowerCase() : ch.toUpperCase()) : ch;
      prevCased = cased;
    }
    return out;
  },
  zfill: (I, s, a) => {
    argCount('str.zfill', a, 1);
    const w = toIndex(a[0]);
    const signed = s[0] === '+' || s[0] === '-';
    const pad = Math.max(0, w - chars(s).length);
    checkLen(w);
    return signed ? s[0] + '0'.repeat(pad) + s.slice(1) : '0'.repeat(pad) + s;
  },
  ljust: (I, s, a) => padMethod('ljust', s, a, '<'),
  rjust: (I, s, a) => padMethod('rjust', s, a, '>'),
  center: (I, s, a) => padMethod('center', s, a, '^'),
  format: () => { throw new PyError('NotSupportedError', 'str.format() is not available in this mini Python — use an f-string instead'); },
};

function padMethod(name, s, a, how) {
  argCount(name, a, 1, 2);
  const w = toIndex(a[0]);
  const fill = a.length > 1 ? a[1] : ' ';
  if (typeof fill !== 'string' || chars(fill).length !== 1) throw TypeErr('The fill character must be exactly one character long');
  checkLen(w);
  const pad = Math.max(0, w - chars(s).length);
  if (how === '<') return s + fill.repeat(pad);
  if (how === '>') return fill.repeat(pad) + s;
  const left = Math.floor(pad / 2) + (pad % 2 && w % 2 ? 1 : 0);
  return fill.repeat(left) + s + fill.repeat(pad - left);
}

function sortItems(I, items, kw) {
  for (const k in kw) if (k !== 'key' && k !== 'reverse') throw TypeErr(`sort() got an unexpected keyword argument '${k}'`);
  const keyFn = kw.key === undefined ? null : kw.key;
  const reverse = kw.reverse === undefined ? false : truthy(kw.reverse);
  const line = I.line;
  const pairs = items.map((item) => ({ item, key: keyFn === null ? item : I.call(keyFn, [item], null, line) }));
  const less = (x, y) => { I.tick(); return order('<', x, y); };
  pairs.sort((p, q) => {
    if (reverse) return less(q.key, p.key) ? -1 : less(p.key, q.key) ? 1 : 0;
    return less(p.key, q.key) ? -1 : less(q.key, p.key) ? 1 : 0;
  });
  return pairs.map((p) => p.item);
}

function listIndexOf(name, list, a) {
  argCount(name, a, 1, 3);
  const len = list.length;
  const fix = (v, dflt) => { if (v === undefined) return dflt; let i = toIndex(v); if (i < 0) i += len; return Math.min(len, Math.max(0, i)); };
  const from = fix(a[1], 0);
  const to = fix(a[2], len);
  for (let i = from; i < to && i < list.length; i++) if (list[i] === a[0] || pyEq(list[i], a[0])) return i;
  return -1;
}

const LIST_METHODS = {
  append: (I, l, a) => { argCount('list.append', a, 1); checkLen(l.length + 1); l.push(a[0]); return null; },
  pop: (I, l, a) => {
    argCount('pop', a, 0, 1);
    if (!l.length) throw new PyError('IndexError', 'pop from empty list');
    if (!a.length) return l.pop();
    let i = toIndex(a[0]);
    if (i < 0) i += l.length;
    if (i < 0 || i >= l.length) throw new PyError('IndexError', 'pop index out of range');
    return l.splice(i, 1)[0];
  },
  insert: (I, l, a) => {
    argCount('insert', a, 2);
    let i = toIndex(a[0]);
    if (i < 0) i = Math.max(0, i + l.length);
    checkLen(l.length + 1);
    l.splice(Math.min(i, l.length), 0, a[1]);
    return null;
  },
  remove: (I, l, a) => {
    argCount('list.remove', a, 1);
    const i = l.findIndex((x) => x === a[0] || pyEq(x, a[0]));
    if (i < 0) throw ValueErr('list.remove(x): x not in list');
    l.splice(i, 1);
    return null;
  },
  index: (I, l, a) => {
    const i = listIndexOf('index', l, a);
    if (i < 0) throw ValueErr(`${pyRepr(a[0])} is not in list`);
    return i;
  },
  count: (I, l, a) => { argCount('list.count', a, 1); return l.reduce((nFound, x) => nFound + (x === a[0] || pyEq(x, a[0]) ? 1 : 0), 0); },
  sort: (I, l, a, kw) => {
    if (a.length) throw TypeErr('sort() takes no positional arguments');
    const sorted = sortItems(I, l.slice(), kw);
    l.length = 0;
    for (const x of sorted) l.push(x);
    return null;
  },
  reverse: (I, l, a) => { argCount('list.reverse', a, 0); l.reverse(); return null; },
  extend: (I, l, a) => {
    argCount('list.extend', a, 1);
    const items = I.toArray(a[0]);
    checkLen(l.length + items.length);
    for (const x of items) l.push(x);
    return null;
  },
  copy: (I, l, a) => { argCount('list.copy', a, 0); return l.slice(); },
  clear: (I, l, a) => { argCount('list.clear', a, 0); l.length = 0; return null; },
};

const TUPLE_METHODS = {
  index: (I, t, a) => {
    const i = listIndexOf('index', t.items, a);
    if (i < 0) throw ValueErr('tuple.index(x): x not in tuple');
    return i;
  },
  count: (I, t, a) => { argCount('tuple.count', a, 1); return t.items.reduce((nFound, x) => nFound + (pyEq(x, a[0]) ? 1 : 0), 0); },
};

const DICT_METHODS = {
  get: (I, d, a) => { argCount('get', a, 1, 2); const v = d.get(a[0]); return v === undefined ? (a.length > 1 ? a[1] : null) : v; },
  keys: (I, d, a) => { argCount('dict.keys', a, 0); return new PyView('keys', d); },
  values: (I, d, a) => { argCount('dict.values', a, 0); return new PyView('values', d); },
  items: (I, d, a) => { argCount('dict.items', a, 0); return new PyView('items', d); },
  pop: (I, d, a) => {
    argCount('pop', a, 1, 2);
    const v = d.get(a[0]);
    if (v === undefined) { if (a.length > 1) return a[1]; throw new PyError('KeyError', pyRepr(a[0])); }
    d.delete(a[0]);
    return v;
  },
  setdefault: (I, d, a) => {
    argCount('setdefault', a, 1, 2);
    const v = d.get(a[0]);
    if (v !== undefined) return v;
    const dflt = a.length > 1 ? a[1] : null;
    d.set(a[0], dflt);
    return dflt;
  },
  update: (I, d, a, kw) => {
    argCount('update', a, 0, 1);
    if (a.length) fillDict(I, d, a[0]);
    for (const k of Object.keys(kw)) d.set(k, kw[k]);
    return null;
  },
  copy: (I, d, a) => { argCount('dict.copy', a, 0); const out = new PyDict(); for (const [k, v] of d.entries()) out.set(k, v); return out; },
  clear: (I, d, a) => { argCount('dict.clear', a, 0); d.map.clear(); return null; },
};

function fillDict(I, d, src) {
  if (src instanceof PyDict) { for (const [k, v] of src.entries()) d.set(k, v); return; }
  const items = I.toArray(src);
  items.forEach((pair, i) => {
    let kv;
    try { kv = I.toArray(pair); } catch { throw TypeErr(`cannot convert dictionary update sequence element #${i} to a sequence`); }
    if (kv.length !== 2) throw ValueErr(`dictionary update sequence element #${i} has length ${kv.length}; 2 is required`);
    d.set(kv[0], kv[1]);
  });
}

function methodTable(v) {
  if (typeof v === 'string') return STR_METHODS;
  if (Array.isArray(v)) return LIST_METHODS;
  if (v instanceof PyDict) return DICT_METHODS;
  if (v instanceof PyTuple) return TUPLE_METHODS;
  return null;
}

// Methods that real Python has and this interpreter does not. Saying "no attribute" for them would be false.
const REAL_METHODS = {
  str: 'capitalize casefold center encode expandtabs format format_map index isalnum isascii isdecimal isidentifier isnumeric isprintable isspace istitle ljust maketrans partition removeprefix removesuffix rfind rindex rjust rpartition rsplit splitlines swapcase title translate zfill',
  list: 'sort reverse insert remove pop index count extend copy clear append',
  dict: 'fromkeys popitem setdefault update',
  tuple: 'count index',
};

function findMethod(obj, name) {
  const table = methodTable(obj);
  if (table && Object.prototype.hasOwnProperty.call(table, name)) return table[name];
  const kind = typeof obj === 'string' ? 'str' : Array.isArray(obj) ? 'list' : obj instanceof PyDict ? 'dict' : obj instanceof PyTuple ? 'tuple' : null;
  if (kind && REAL_METHODS[kind].split(' ').includes(name)) {
    throw new PyError('NotSupportedError', `${kind}.${name}() is not available in this mini Python`);
  }
  // Real Python has these; saying "no attribute" would teach something false.
  if (/^__\w+__$/.test(name)) throw new PyError('NotSupportedError', `special attributes such as ${name} are not available in this mini Python`);
  if (obj instanceof PyType) throw new PyError('AttributeError', `type object '${obj.name}' has no attribute '${name}'`);
  throw new PyError('AttributeError', `'${typeName(obj)}' object has no attribute '${name}'`);
}

const TYPE_TABLES = { str: STR_METHODS, list: LIST_METHODS, dict: DICT_METHODS, tuple: TUPLE_METHODS };

/** str.upper, list.append … — a method taken from the type; the value comes first. */
function unboundMethod(type, name) {
  const table = TYPE_TABLES[type.name];
  if (!table || !Object.prototype.hasOwnProperty.call(table, name)) {
    if (/^__\w+__$/.test(name)) throw new PyError('NotSupportedError', `special attributes such as ${name} are not available in this mini Python`);
    throw new PyError('AttributeError', `type object '${type.name}' has no attribute '${name}'`);
  }
  const method = table[name];
  return new PyBuiltin(`${type.name}.${name}`, (I, args, kw) => {
    if (!args.length) throw TypeErr(`unbound method ${type.name}.${name}() needs an argument`);
    if (typeName(args[0]) !== type.name) throw TypeErr(`descriptor '${name}' for '${type.name}' objects doesn't apply to a '${typeName(args[0])}' object`);
    return method(I, args[0], args.slice(1), kw);
  });
}

/* ====================================================================== */
/* Built-in functions                                                     */
/* ====================================================================== */

const BUILTINS = new Map();
const TYPES = new Map();
const builtin = (name, fn) => BUILTINS.set(name, new PyBuiltin(name, fn));
const builtinType = (name, fn) => { const t = new PyType(name, fn); TYPES.set(name, t); BUILTINS.set(name, t); return t; };

function typeObject(name) {
  if (!TYPES.has(name)) TYPES.set(name, new PyType(name, () => { throw TypeErr(`cannot create '${name}' instances`); }));
  return TYPES.get(name);
}

function parseIntText(s, base) {
  const bad = () => ValueErr(`invalid literal for int() with base ${base}: ${pyRepr(s)}`);
  let t = s.trim();
  if (!/^[+-]?[0-9a-zA-Z]+(?:_[0-9a-zA-Z]+)*$/.test(t)) throw bad();
  t = t.replace(/_/g, '');
  let neg = false;
  if (t[0] === '+' || t[0] === '-') { neg = t[0] === '-'; t = t.slice(1); }
  if (base === 10) {
    if (!/^\d+$/.test(t)) throw bad();
    const v = t.length <= 15 ? Number(t) : BigInt(t);
    return typeof v === 'number' ? (neg ? -v : v) + 0 : normBig(neg ? -v : v);
  }
  const lower = t.toLowerCase();
  const prefixes = { 2: '0b', 8: '0o', 16: '0x' };
  const digits = prefixes[base] && lower.startsWith(prefixes[base]) ? lower.slice(2) : lower;
  if (!digits) throw bad();
  let acc = 0n;
  for (const ch of digits) {
    const d = parseInt(ch, 36);
    if (Number.isNaN(d) || d >= base) throw bad();
    acc = acc * BigInt(base) + BigInt(d);
  }
  return normBig(neg ? -acc : acc);
}

builtinType('int', (I, a, kw) => {
  noKw('int', kw);
  argCount('int', a, 0, 2);
  if (!a.length) return 0;
  const x = a[0];
  if (a.length === 2) {
    if (typeof x !== 'string') throw TypeErr("int() can't convert non-string with explicit base");
    const base = toIndex(a[1]);
    if (base < 2 || base > 36) throw ValueErr('int() base must be >= 2 and <= 36, or 0');
    return parseIntText(x, base);
  }
  if (typeof x === 'number' || typeof x === 'bigint') return x;
  if (typeof x === 'boolean') return x ? 1 : 0;
  if (x instanceof PyFloat) {
    if (Number.isNaN(x.v)) throw ValueErr('cannot convert float NaN to integer');
    if (!Number.isFinite(x.v)) throw new PyError('OverflowError', 'cannot convert float infinity to integer');
    const t = Math.trunc(x.v);
    return Number.isSafeInteger(t) ? t + 0 : normBig(BigInt(t));
  }
  if (typeof x === 'string') return parseIntText(x, 10);
  throw TypeErr(`int() argument must be a string, a bytes-like object or a real number, not '${typeName(x)}'`);
});

builtinType('float', (I, a, kw) => {
  noKw('float', kw);
  argCount('float', a, 0, 1);
  if (!a.length) return new PyFloat(0);
  const x = a[0];
  if (x instanceof PyFloat) return x;
  if (isIntLike(x)) return new PyFloat(floatOf(x));
  if (typeof x === 'string') {
    const t = x.trim().toLowerCase();
    if (/^[+-]?(?:inf|infinity)$/.test(t)) return new PyFloat(t[0] === '-' ? -Infinity : Infinity);
    if (/^[+-]?nan$/.test(t)) return new PyFloat(NaN);
    if (/^[+-]?(?:\d+(?:_\d+)*\.?(?:\d+(?:_\d+)*)?|\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?$/.test(t)) return new PyFloat(Number(t.replace(/_/g, '')));
    throw ValueErr(`could not convert string to float: ${pyRepr(x)}`);
  }
  throw TypeErr(`float() argument must be a string or a real number, not '${typeName(x)}'`);
});

builtinType('str', (I, a, kw) => { noKw('str', kw); argCount('str', a, 0, 3); return a.length ? pyStr(a[0]) : ''; });
builtinType('bool', (I, a, kw) => { noKw('bool', kw); argCount('bool', a, 0, 1); return a.length ? truthy(a[0]) : false; });
builtinType('list', (I, a, kw) => { noKw('list', kw); argCount('list', a, 0, 1); return a.length ? I.toArray(a[0]) : []; });
builtinType('tuple', (I, a, kw) => { noKw('tuple', kw); argCount('tuple', a, 0, 1); return a.length ? (a[0] instanceof PyTuple ? a[0] : new PyTuple(I.toArray(a[0]))) : new PyTuple([]); });
builtinType('dict', (I, a, kw) => {
  argCount('dict', a, 0, 1);
  const d = new PyDict();
  if (a.length) fillDict(I, d, a[0]);
  for (const k of Object.keys(kw)) d.set(k, kw[k]);
  return d;
});

function rangeArg(v) {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') {
    if (Math.abs(v) > 1e15) throw new PyError('OverflowError', 'range() bounds are too large for this mini Python');
    return v;
  }
  if (typeof v === 'bigint') throw new PyError('OverflowError', 'range() bounds are too large for this mini Python');
  throw TypeErr(`'${typeName(v)}' object cannot be interpreted as an integer`);
}

builtinType('range', (I, a, kw) => {
  noKw('range', kw);
  if (a.length === 0) throw TypeErr('range expected at least 1 argument, got 0');
  if (a.length > 3) throw TypeErr(`range expected at most 3 arguments, got ${a.length}`);
  const v = a.map(rangeArg);
  if (v.length === 1) return new PyRange(0, v[0], 1);
  if (v.length === 2) return new PyRange(v[0], v[1], 1);
  if (v[2] === 0) throw ValueErr('range() arg 3 must not be zero');
  return new PyRange(v[0], v[1], v[2]);
});

builtinType('type', (I, a, kw) => {
  noKw('type', kw);
  if (a.length !== 1) throw TypeErr('type() takes 1 or 3 arguments');
  return typeObject(typeName(a[0]));
});

builtin('print', (I, a, kw) => {
  let sep = ' ';
  let end = '\n';
  for (const k of Object.keys(kw)) {
    const v = kw[k];
    if (k === 'sep' || k === 'end') {
      if (v !== null && typeof v !== 'string') throw TypeErr(`${k} must be None or a string, not ${typeName(v)}`);
      if (v !== null) { if (k === 'sep') sep = v; else end = v; }
    } else if (k !== 'flush' && k !== 'file') throw TypeErr(`print() got an unexpected keyword argument '${k}'`);
  }
  let text = '';
  for (let i = 0; i < a.length; i++) text += (i ? sep : '') + pyStr(a[i]);
  I.write(text + end);
  return null;
});

builtin('len', (I, a, kw) => { noKw('len', kw); argCount('len', a, 1); return pyLen(a[0]); });
builtin('repr', (I, a, kw) => { noKw('repr', kw); argCount('repr', a, 1); return pyRepr(a[0]); });

builtin('abs', (I, a, kw) => {
  noKw('abs', kw);
  argCount('abs', a, 1);
  const x = a[0];
  if (typeof x === 'number') return Math.abs(x);
  if (typeof x === 'bigint') return x < 0n ? normBig(-x) : x;
  if (typeof x === 'boolean') return x ? 1 : 0;
  if (x instanceof PyFloat) return new PyFloat(Math.abs(x.v));
  throw TypeErr(`bad operand type for abs(): '${typeName(x)}'`);
});

function minMax(name, op) {
  return (I, a, kw) => {
    for (const k in kw) if (k !== 'key' && k !== 'default') throw TypeErr(`${name}() got an unexpected keyword argument '${k}'`);
    if (!a.length) throw TypeErr(`${name} expected at least 1 argument, got 0`);
    const items = a.length === 1 ? I.toArray(a[0]) : a;
    if (!items.length) {
      if (kw.default !== undefined) return kw.default;
      throw ValueErr(`${name}() iterable argument is empty`);
    }
    const keyFn = kw.key === undefined || kw.key === null ? null : kw.key;
    const line = I.line;
    const keyOf = (x) => (keyFn ? I.call(keyFn, [x], null, line) : x);
    let best = items[0];
    let bestKey = keyOf(best);
    for (let i = 1; i < items.length; i++) {
      const k = keyOf(items[i]);
      if (order(op, k, bestKey)) { best = items[i]; bestKey = k; }
    }
    return best;
  };
}
builtin('min', minMax('min', '<'));
builtin('max', minMax('max', '>'));

builtin('sum', (I, a, kw) => {
  for (const k in kw) if (k !== 'start') throw TypeErr(`sum() got an unexpected keyword argument '${k}'`);
  if (a.length < 1) throw TypeErr('sum() takes at least 1 positional argument (0 given)');
  if (a.length > 2) throw TypeErr(`sum() takes at most 2 arguments (${a.length} given)`);
  let total = a.length > 1 ? a[1] : (kw.start === undefined ? 0 : kw.start);
  if (typeof total === 'string') throw TypeErr("sum() can't sum strings [use ''.join(seq) instead]");
  const next = getIter(a[0]);
  const fitsLong = (v) => typeof v !== 'bigint' || (v >= -9223372036854775808n && v <= 9223372036854775807n);
  let x = next();
  // The same three phases as CPython, so that results match digit for digit.
  // 1. whole numbers, exactly
  if (typeof total === 'number' || typeof total === 'bigint') {
    while (x !== STOP && isIntLike(x) && fitsLong(total)) { I.tick(); total = intArith('+', total, intOf(x)); x = next(); }
    if (x !== STOP && fitsLong(total)) { I.tick(); total = binop('+', total, x); x = next(); }
  }
  // 2. floats, with compensated (Neumaier) summation as in Python 3.12+
  if (total instanceof PyFloat) {
    let f = total.v;
    let c = 0;
    while (x !== STOP) {
      if (x instanceof PyFloat) {
        const v = x.v;
        const t = f + v;
        c += Math.abs(f) >= Math.abs(v) ? (f - t) + v : (v - t) + f;
        f = t;
      } else if (isIntLike(x) && fitsLong(x)) f += floatOf(x);
      else break;
      I.tick();
      x = next();
    }
    if (c && Number.isFinite(c)) f += c;
    total = new PyFloat(f);
  }
  // 3. anything else: plain +
  while (x !== STOP) { I.tick(); total = binop('+', total, x); x = next(); }
  return total;
});

builtin('round', (I, a, kw) => {
  for (const k in kw) if (k !== 'ndigits' && k !== 'number') throw TypeErr(`round() got an unexpected keyword argument '${k}'`);
  const x = a.length ? a[0] : kw.number;
  if (x === undefined) throw TypeErr("round() missing required argument 'number' (pos 1)");
  if (a.length > 2) throw TypeErr(`round() takes at most 2 arguments (${a.length} given)`);
  let nd = a.length > 1 ? a[1] : (kw.ndigits === undefined ? null : kw.ndigits);
  if (nd !== null) {
    if (!isIntLike(nd)) throw TypeErr(`'${typeName(nd)}' object cannot be interpreted as an integer`);
    nd = Number(intOf(nd));
  }
  if (x instanceof PyFloat) return nd === null ? roundToInt(x.v) : new PyFloat(roundFloat(x.v, nd));
  if (isIntLike(x)) {
    const n = intOf(x);
    if (nd === null || nd >= 0) return n;
    if (-nd > 5000) return 0;
    const unit = 10n ** BigInt(-nd);
    const big = BigInt(n);
    const neg = big < 0n;
    const mag = neg ? -big : big;
    let q = mag / unit;
    const twice = (mag % unit) * 2n;
    if (twice > unit || (twice === unit && (q & 1n) === 1n)) q += 1n;
    return normBig((neg ? -q : q) * unit);
  }
  throw TypeErr(`type ${typeName(x)} doesn't define __round__ method`);
});

builtin('sorted', (I, a, kw) => {
  if (a.length !== 1) throw TypeErr(`sorted expected 1 argument, got ${a.length}`);
  return sortItems(I, I.toArray(a[0]), kw);
});

builtin('enumerate', (I, a, kw) => {
  for (const k in kw) if (k !== 'start') throw TypeErr(`enumerate() got an unexpected keyword argument '${k}'`);
  if (!a.length) throw TypeErr("enumerate() missing required argument 'iterable'");
  argCount('enumerate', a, 1, 2);
  const next = getIter(a[0]);
  let i = a.length > 1 ? a[1] : (kw.start === undefined ? 0 : kw.start);
  if (!isIntLike(i)) throw TypeErr(`'${typeName(i)}' object cannot be interpreted as an integer`);
  i = intOf(i);
  return new PyIter('enumerate', () => {
    const x = next();
    if (x === STOP) return STOP;
    const pair = new PyTuple([i, x]);
    i = intArith('+', i, 1);
    return pair;
  });
});

builtin('zip', (I, a, kw) => {
  noKw('zip', kw);
  const nexts = a.map(getIter);
  return new PyIter('zip', () => {
    if (!nexts.length) return STOP;
    const row = [];
    for (const next of nexts) { const x = next(); if (x === STOP) return STOP; row.push(x); }
    return new PyTuple(row);
  });
});

builtin('reversed', (I, a, kw) => {
  noKw('reversed', kw);
  argCount('reversed', a, 1);
  const seq = a[0];
  if (seq instanceof PyDict) {
    const keys = seq.keys();
    let i = keys.length;
    return new PyIter('dict_reversekeyiterator', () => (i > 0 ? keys[--i] : STOP));
  }
  if (!(isSeq(seq) || seq instanceof PyRange)) throw TypeErr(`'${typeName(seq)}' object is not reversible`);
  const items = typeof seq === 'string' ? chars(seq) : Array.isArray(seq) ? seq : seq instanceof PyTuple ? seq.items : null;
  let i = items ? items.length : seq.length;
  return new PyIter(Array.isArray(seq) ? 'list_reverseiterator' : seq instanceof PyRange ? 'range_iterator' : 'reversed', () => {
    if (items && i > items.length) i = items.length;
    if (i <= 0) return STOP;
    i -= 1;
    return items ? items[i] : seq.at(i);
  });
});

builtin('map', (I, a, kw) => {
  noKw('map', kw);
  if (a.length < 2) throw TypeErr('map() must have at least two arguments.');
  const fn = a[0];
  const nexts = a.slice(1).map(getIter);
  const line = I.line;
  return new PyIter('map', () => {
    const row = [];
    for (const next of nexts) { const x = next(); if (x === STOP) return STOP; row.push(x); }
    return I.call(fn, row, null, line);
  });
});

builtin('filter', (I, a, kw) => {
  noKw('filter', kw);
  argCount('filter', a, 2);
  const fn = a[0];
  const next = getIter(a[1]);
  const line = I.line;
  return new PyIter('filter', () => {
    for (let x = next(); x !== STOP; x = next()) {
      I.tick();
      if (truthy(fn === null ? x : I.call(fn, [x], null, line))) return x;
    }
    return STOP;
  });
});

builtin('any', (I, a, kw) => { noKw('any', kw); argCount('any', a, 1); const next = getIter(a[0]); for (let x = next(); x !== STOP; x = next()) { I.tick(); if (truthy(x)) return true; } return false; });
builtin('all', (I, a, kw) => { noKw('all', kw); argCount('all', a, 1); const next = getIter(a[0]); for (let x = next(); x !== STOP; x = next()) { I.tick(); if (!truthy(x)) return false; } return true; });

builtin('isinstance', (I, a, kw) => {
  noKw('isinstance', kw);
  argCount('isinstance', a, 2);
  const types = a[1] instanceof PyTuple ? a[1].items : [a[1]];
  const tn = typeName(a[0]);
  return types.some((t) => {
    if (!(t instanceof PyType)) throw TypeErr('isinstance() arg 2 must be a type, a tuple of types, or a union');
    return t.name === tn || (t.name === 'int' && tn === 'bool') || t.name === 'object';
  });
});

builtin('chr', (I, a, kw) => {
  noKw('chr', kw);
  argCount('chr', a, 1);
  const n = toIndex(a[0]);
  if (!(n >= 0 && n < 0x110000)) throw ValueErr('chr() arg not in range(0x110000)');
  return String.fromCodePoint(n);
});

builtin('ord', (I, a, kw) => {
  noKw('ord', kw);
  argCount('ord', a, 1);
  if (typeof a[0] !== 'string') throw TypeErr(`ord() expected string of length 1, but ${typeName(a[0])} found`);
  const cs = Array.from(a[0]);
  if (cs.length !== 1) throw TypeErr(`ord() expected a character, but string of length ${cs.length} found`);
  return cs[0].codePointAt(0);
});

builtin('divmod', (I, a, kw) => {
  noKw('divmod', kw);
  argCount('divmod', a, 2);
  if (!isNum(a[0]) || !isNum(a[1])) throw unsupported('divmod()', a[0], a[1]);
  return new PyTuple([binop('//', a[0], a[1]), binop('%', a[0], a[1])]);
});

builtin('pow', (I, a, kw) => {
  noKw('pow', kw);
  if (a.length === 3) throw new PyError('NotSupportedError', 'pow() with three arguments is not available in this mini Python');
  argCount('pow', a, 2);
  return binop('**', a[0], a[1]);
});

builtin('format', (I, a, kw) => {
  noKw('format', kw);
  argCount('format', a, 1, 2);
  if (a.length > 1 && typeof a[1] !== 'string') throw TypeErr(`format() argument 2 must be str, not ${typeName(a[1])}`);
  return formatValue(a[0], a.length > 1 ? a[1] : '');
});

builtin('input', () => { throw new PyError('NotSupportedError', 'input() is not available here — give the variable a value in the program instead'); });

/* ====================================================================== */
/* Interpreter                                                            */
/* ====================================================================== */

const BREAK = { signal: 'break' };
const CONTINUE = { signal: 'continue' };
class Return { constructor(value) { this.value = value; } }

const REPR_LIMIT = 240;
/** A clipped repr never shows more than REPR_LIMIT characters, so it never needs more items than this. */
const SNAPSHOT_NODES = 400;
const clip = (s) => (s.length > REPR_LIMIT ? `${s.slice(0, REPR_LIMIT - 1)}…` : s);

/** Set an own property safely (a variable may be called __proto__). */
function setOwn(obj, key, value) {
  Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
}

class Interp {
  constructor(options) {
    this.maxSteps = options.maxSteps > 0 ? options.maxSteps : DEFAULT_STEPS;
    this.maxDepth = options.maxDepth > 0 ? options.maxDepth : 200;
    this.maxOutput = options.maxOutput > 0 ? options.maxOutput : 50000;
    this.maxTrace = options.maxTrace > 0 ? options.maxTrace : 2000;
    this.tracing = !!options.trace;
    this.trace = [];
    this.traceTruncated = false;
    this.steps = 0;
    this.out = '';
    this.line = 0;
    this.globals = new Map();
    this.module = { vars: this.globals, fn: null, parent: null };
    this.frame = this.module; // the frame that is running right now
    this.callStack = [];
    this.ids = new WeakMap();
    this.nextId = 1;
    this.inputs = null;
    if (options.inputs) {
      this.inputs = new Map();
      for (const key of Object.keys(options.inputs)) this.inputs.set(key, toPy(options.inputs[key]));
    }
  }

  tick() { if (++this.steps > this.maxSteps) throw new PyError('TimeoutError', TOO_LONG); }

  write(text) {
    this.out += text;
    if (this.out.length > this.maxOutput) {
      this.out = this.out.slice(0, this.maxOutput);
      throw new PyError('TimeoutError', TOO_MUCH);
    }
  }

  /** Collect an iterable into a new array (counting steps, so huge ranges stop). */
  toArray(v) {
    if (Array.isArray(v)) return v.slice();
    if (v instanceof PyTuple) return v.items.slice();
    const next = getIter(v);
    const out = [];
    for (let x = next(); x !== STOP; x = next()) {
      this.tick();
      out.push(x);
      if (out.length > MAX_LEN) checkLen(out.length);
    }
    return out;
  }

  /* --------------------------------------------------------------- trace */

  snapshot(vars) {
    const reprs = {};
    let ids = null;
    for (const [name, value] of vars) {
      if (value === undefined) continue;
      setOwn(reprs, name, clip(pyRepr(value, undefined, { left: SNAPSHOT_NODES })));
      if (Array.isArray(value) || value instanceof PyDict) {
        let id = this.ids.get(value);
        if (!id) { id = this.nextId++; this.ids.set(value, id); }
        if (!ids) ids = {};
        setOwn(ids, name, id);
      }
    }
    return [reprs, ids];
  }

  record(event, line, frame, value) {
    if (this.trace.length >= this.maxTrace) { this.traceTruncated = true; this.tracing = false; return; }
    const [vars, ids] = this.snapshot(frame.vars);
    const entry = { event, line, depth: this.callStack.length, func: frame.fn ? frame.fn.name : null, vars, ids: ids || {}, out: this.out.length };
    if (frame.fn) {
      const [g, gids] = this.snapshot(this.globals);
      entry.globals = g;
      entry.globalIds = gids || {};
    }
    entry.callers = this.callStack.map((c) => c.line);
    if (value !== undefined) entry.value = clip(pyRepr(value, undefined, { left: SNAPSHOT_NODES }));
    this.trace.push(entry);
  }

  /* ---------------------------------------------------------- statements */

  execBlock(body, frame) {
    for (let i = 0; i < body.length; i++) {
      const signal = this.exec(body[i], frame);
      if (signal !== undefined) return signal;
    }
    return undefined;
  }

  exec(node, frame) {
    this.tick();
    this.line = node.line;
    if (this.tracing) this.record('line', node.line, frame);
    switch (node.type) {
      case 'Expr': this.eval(node.value, frame); return undefined;
      case 'Assign': return this.execAssign(node, frame);
      case 'AugAssign': return this.execAugAssign(node, frame);
      case 'If':
        if (truthy(this.eval(node.test, frame))) return this.execBlock(node.body, frame);
        return node.orelse ? this.execBlock(node.orelse, frame) : undefined;
      case 'While': return this.execWhile(node, frame);
      case 'For': return this.execFor(node, frame);
      case 'Def': {
        const defaults = node.defaults.map((d) => this.eval(d, frame));
        this.store(node.name, new PyFunc(node, frame, defaults), frame);
        return undefined;
      }
      case 'Return': return new Return(node.value ? this.eval(node.value, frame) : null);
      case 'Break': return BREAK;
      case 'Continue': return CONTINUE;
      case 'Pass': case 'Global': return undefined;
      case 'Del': return this.execDel(node, frame);
      case 'Assert': {
        if (truthy(this.eval(node.test, frame))) return undefined;
        const detail = node.message ? this.eval(node.message, frame) : null;
        throw new PyError('AssertionError', detail === null ? '' : (typeof detail === 'string' ? detail : pyRepr(detail)));
      }
      default: throw new Error(`unknown statement ${node.type}`);
    }
  }

  execAssign(node, frame) {
    const targets = node.targets;
    if (this.inputs && frame === this.module && targets.length === 1 && targets[0].type === 'Name' && this.inputs.has(targets[0].id)) {
      const name = targets[0].id;
      this.globals.set(name, this.inputs.get(name));
      this.inputs.delete(name);
      return undefined;
    }
    const value = this.eval(node.value, frame);
    for (let i = 0; i < targets.length; i++) this.assign(targets[i], value, frame);
    return undefined;
  }

  execAugAssign(node, frame) {
    const target = node.target;
    const sym = `${node.op}=`;
    if (target.type === 'Name') {
      const current = this.load(target, frame);
      const value = this.eval(node.value, frame);
      this.line = node.line;
      this.store(target.id, this.inplace(node.op, current, value, sym), frame);
      return undefined;
    }
    const obj = this.eval(target.value, frame);
    const idx = this.evalIndex(target.index, frame);
    this.line = node.line;
    const current = getItem(obj, idx);
    const value = this.eval(node.value, frame);
    this.line = node.line;
    setItem(obj, idx, this.inplace(node.op, current, value, sym));
    return undefined;
  }

  /** x op= y. Lists are changed in place (so other names for the list see it). */
  inplace(op, current, value, sym) {
    if (Array.isArray(current)) {
      if (op === '+') {
        const items = this.toArray(value);
        checkLen(current.length + items.length);
        for (const x of items) current.push(x);
        return current;
      }
      if (op === '*' && isIntLike(value)) {
        const copy = repeatSeq(current, value);
        current.length = 0;
        for (const x of copy) current.push(x);
        return current;
      }
    }
    return binop(op, current, value, sym);
  }

  execWhile(node, frame) {
    for (let first = true; ; first = false) {
      if (!first) {
        this.tick();
        this.line = node.line;
        if (this.tracing) this.record('line', node.line, frame);
      }
      if (!truthy(this.eval(node.test, frame))) return undefined;
      const signal = this.execBlock(node.body, frame);
      if (signal === BREAK) return undefined;
      if (signal !== undefined && signal !== CONTINUE) return signal;
    }
  }

  execFor(node, frame) {
    const iterable = this.eval(node.iter, frame);
    this.line = node.line;
    const next = getIter(iterable);
    for (let first = true; ; first = false) {
      if (!first) {
        this.tick();
        this.line = node.line;
        if (this.tracing) this.record('line', node.line, frame);
      }
      const item = next();
      if (item === STOP) return undefined;
      this.assign(node.target, item, frame);
      const signal = this.execBlock(node.body, frame);
      if (signal === BREAK) return undefined;
      if (signal !== undefined && signal !== CONTINUE) return signal;
    }
  }

  execDel(node, frame) {
    for (const target of node.targets) {
      if (target.type === 'Name') {
        const local = frame.fn && frame.fn.node.locals.has(target.id);
        const vars = local ? frame.vars : this.globals;
        if (vars.get(target.id) === undefined) {
          if (local) throw new PyError('UnboundLocalError', `cannot access local variable '${target.id}' where it is not associated with a value`);
          throw new PyError('NameError', `name '${target.id}' is not defined`);
        }
        vars.delete(target.id);
      } else {
        const obj = this.eval(target.value, frame);
        const idx = this.evalIndex(target.index, frame);
        this.line = node.line;
        delItem(obj, idx);
      }
    }
    return undefined;
  }

  store(name, value, frame) {
    if (frame.fn && !frame.fn.node.globals.has(name)) frame.vars.set(name, value);
    else this.globals.set(name, value);
  }

  assign(target, value, frame) {
    if (target.type === 'Name') { this.store(target.id, value, frame); return; }
    if (target.type === 'Index') {
      const obj = this.eval(target.value, frame);
      const idx = this.evalIndex(target.index, frame);
      this.line = target.line;
      setItem(obj, idx, value);
      return;
    }
    // Unpack
    const want = target.elts.length;
    let items;
    if (Array.isArray(value)) items = value;
    else if (value instanceof PyTuple) items = value.items;
    else {
      let next;
      try { next = getIter(value); } catch { throw TypeErr(`cannot unpack non-iterable ${typeName(value)} object`); }
      items = [];
      for (let x = next(); x !== STOP; x = next()) {
        this.tick();
        items.push(x);
        if (items.length > want) break;
      }
    }
    if (items.length > want) throw ValueErr(`too many values to unpack (expected ${want})`);
    if (items.length < want) throw ValueErr(`not enough values to unpack (expected ${want}, got ${items.length})`);
    for (let i = 0; i < want; i++) this.assign(target.elts[i], items[i], frame);
  }

  load(node, frame) {
    const name = node.id;
    if (frame.fn) {
      if (frame.fn.node.locals.has(name)) {
        const v = frame.vars.get(name);
        if (v === undefined) {
          this.line = node.line;
          throw new PyError('UnboundLocalError', `cannot access local variable '${name}' where it is not associated with a value`);
        }
        return v;
      }
      for (let f = frame.parent; f && f.fn; f = f.parent) {
        if (f.fn.node.locals.has(name)) {
          const v = f.vars.get(name);
          if (v === undefined) {
            this.line = node.line;
            throw new PyError('NameError', `cannot access free variable '${name}' where it is not associated with a value in enclosing scope`);
          }
          return v;
        }
      }
    }
    let v = this.globals.get(name);
    if (v !== undefined) return v;
    v = BUILTINS.get(name);
    if (v !== undefined) return v;
    this.line = node.line;
    const err = new PyError('NameError', `name '${name}' is not defined`);
    err.missing = name;
    err.known = this.knownNames(frame);
    throw err;
  }

  knownNames(frame) {
    const names = new Set();
    for (let f = frame; f; f = f.parent) for (const [k, v] of f.vars) if (v !== undefined) names.add(k);
    for (const [k, v] of this.globals) if (v !== undefined) names.add(k);
    for (const k of BUILTINS.keys()) names.add(k);
    for (const k of ['True', 'False', 'None']) names.add(k);
    return Array.from(names);
  }

  /* --------------------------------------------------------- expressions */

  eval(node, frame) {
    this.tick();
    switch (node.type) {
      case 'Const': return node.value;
      case 'Name': return this.load(node, frame);
      case 'BinOp': return this.evalBinOp(node, frame);
      case 'Compare': return this.evalCompare(node, frame);
      case 'Call': return this.evalCall(node, frame);
      case 'Index': return this.evalSubscript(node, frame);
      case 'Attr': return this.evalAttr(node, frame);
      case 'BoolOp': return this.evalBoolOp(node, frame);
      case 'Not': return !truthy(this.eval(node.operand, frame));
      case 'Unary': return this.evalUnary(node, frame);
      case 'List': return this.evalList(node.elts, frame);
      case 'Tuple': return new PyTuple(this.evalList(node.elts, frame));
      case 'Dict': return this.evalDict(node, frame);
      case 'IfExp': return truthy(this.eval(node.test, frame)) ? this.eval(node.body, frame) : this.eval(node.orelse, frame);
      case 'FString': return this.evalFString(node, frame);
      default: throw new Error(`unknown expression ${node.type}`);
    }
  }

  evalList(elts, frame) {
    const out = new Array(elts.length);
    for (let i = 0; i < elts.length; i++) out[i] = this.eval(elts[i], frame);
    return out;
  }

  evalBinOp(node, frame) {
    const a = this.eval(node.left, frame);
    const b = this.eval(node.right, frame);
    this.line = node.line;
    return binop(node.op, a, b);
  }

  evalUnary(node, frame) {
    const v = this.eval(node.operand, frame);
    this.line = node.line;
    if (node.op === '-') return negate(v);
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (!isNum(v)) throw TypeErr(`bad operand type for unary +: '${typeName(v)}'`);
    return v;
  }

  evalBoolOp(node, frame) {
    const values = node.values;
    const isAnd = node.op === 'and';
    let v;
    for (let i = 0; i < values.length; i++) {
      v = this.eval(values[i], frame);
      if (truthy(v) !== isAnd) return v;
    }
    return v;
  }

  evalCompare(node, frame) {
    let left = this.eval(node.left, frame);
    for (let i = 0; i < node.ops.length; i++) {
      const right = this.eval(node.rights[i], frame);
      this.line = node.line;
      const op = node.ops[i];
      let ok;
      switch (op) {
        case '==': ok = pyEq(left, right); break;
        case '!=': ok = !pyEq(left, right); break;
        case 'in': ok = contains(right, left); break;
        case 'not in': ok = !contains(right, left); break;
        case 'is': ok = pyIs(left, right); break;
        case 'is not': ok = !pyIs(left, right); break;
        default: ok = order(op, left, right);
      }
      if (!ok) return false;
      left = right;
    }
    return true;
  }

  evalIndex(index, frame) {
    if (index.type !== 'Slice') return this.eval(index, frame);
    const part = (p) => (p === null ? null : this.eval(p, frame));
    const start = part(index.start);
    const stop = part(index.stop);
    const step = part(index.step);
    for (const v of [start, stop, step]) {
      if (v !== null && !isIntLike(v)) { this.line = index.line; throw TypeErr('slice indices must be integers or None or have an __index__ method'); }
    }
    return new PySlice(start, stop, step);
  }

  evalSubscript(node, frame) {
    const obj = this.eval(node.value, frame);
    const idx = this.evalIndex(node.index, frame);
    this.line = node.line;
    return getItem(obj, idx);
  }

  evalAttr(node, frame) {
    const obj = this.eval(node.value, frame);
    this.line = node.line;
    if (obj instanceof PyType) return unboundMethod(obj, node.attr);
    return new PyBound(obj, node.attr, findMethod(obj, node.attr));
  }

  evalDict(node, frame) {
    const d = new PyDict();
    for (let i = 0; i < node.keys.length; i++) {
      const k = this.eval(node.keys[i], frame);
      const v = this.eval(node.values[i], frame);
      this.line = node.line;
      d.set(k, v);
    }
    return d;
  }

  evalFString(node, frame) {
    let out = '';
    for (const part of node.parts) {
      if (part.lit !== undefined) { out += part.lit; continue; }
      let v = this.eval(part.value, frame);
      this.line = node.line;
      if (part.debug !== null && part.debug !== undefined) {
        out += part.debug;
        if (!part.conv && !part.spec) v = pyRepr(v);
      }
      if (part.conv === 'r' || part.conv === 'a') v = pyRepr(v);
      else if (part.conv === 's') v = pyStr(v);
      out += formatValue(v, part.spec);
      checkLen(out.length);
    }
    return out;
  }

  evalKwargs(list, frame) {
    const kw = {};
    for (let i = 0; i < list.length; i++) setOwn(kw, list[i].name, this.eval(list[i].value, frame));
    return kw;
  }

  evalCall(node, frame) {
    const fnode = node.func;
    if (fnode.type === 'Attr') {
      // method call: value.method(args)
      const obj = this.eval(fnode.value, frame);
      this.line = node.line;
      if (obj instanceof PyType) {
        const fn = unboundMethod(obj, fnode.attr);
        const args = this.evalList(node.args, frame);
        const kw = node.kwargs ? this.evalKwargs(node.kwargs, frame) : NOKW;
        this.line = node.line;
        return fn.fn(this, args, kw);
      }
      const method = findMethod(obj, fnode.attr);
      const args = this.evalList(node.args, frame);
      const kw = node.kwargs ? this.evalKwargs(node.kwargs, frame) : NOKW;
      this.line = node.line;
      return method(this, obj, args, kw);
    }
    const fn = this.eval(fnode, frame);
    const args = this.evalList(node.args, frame);
    const kw = node.kwargs ? this.evalKwargs(node.kwargs, frame) : null;
    this.line = node.line;
    return this.call(fn, args, kw, node.line);
  }

  call(fn, args, kw, line) {
    if (fn instanceof PyFunc) return this.callFunction(fn, args, kw, line);
    if (fn instanceof PyBuiltin) return fn.fn(this, args, kw || NOKW);
    if (fn instanceof PyBound) return fn.fn(this, fn.self, args, kw || NOKW);
    throw TypeErr(`'${typeName(fn)}' object is not callable`);
  }

  callFunction(fn, args, kw, line) {
    if (this.callStack.length >= this.maxDepth) throw new PyError('RecursionError', 'maximum recursion depth exceeded');
    const node = fn.node;
    const params = node.params;
    const n = params.length;
    const vars = new Map();
    if (args.length > n) {
      const required = n - fn.defaults.length;
      const takes = fn.defaults.length ? `from ${required} to ${n} positional arguments` : `${n} positional argument${n === 1 ? '' : 's'}`;
      throw TypeErr(`${fn.name}() takes ${takes} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`);
    }
    for (let i = 0; i < args.length; i++) vars.set(params[i], args[i]);
    if (kw) {
      for (const key of Object.keys(kw)) {
        if (!params.includes(key)) throw TypeErr(`${fn.name}() got an unexpected keyword argument '${key}'`);
        if (vars.has(key)) throw TypeErr(`${fn.name}() got multiple values for argument '${key}'`);
        vars.set(key, kw[key]);
      }
    }
    if (vars.size < n) {
      const firstDefault = n - fn.defaults.length;
      const missing = [];
      for (let i = 0; i < n; i++) {
        if (vars.has(params[i])) continue;
        if (i >= firstDefault) vars.set(params[i], fn.defaults[i - firstDefault]);
        else missing.push(`'${params[i]}'`);
      }
      if (missing.length) {
        const list = missing.length === 1 ? missing[0] : missing.length === 2 ? missing.join(' and ') : `${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}`;
        throw TypeErr(`${fn.name}() missing ${missing.length} required positional argument${missing.length === 1 ? '' : 's'}: ${list}`);
      }
      // keep parameters in their declared order for the variable table
      const ordered = new Map();
      for (const p of params) ordered.set(p, vars.get(p));
      vars.clear();
      for (const [k, v] of ordered) vars.set(k, v);
    }
    const frame = { vars, fn, parent: fn.closure };
    const caller = this.frame;
    this.callStack.push({ name: fn.name, line });
    this.frame = frame;
    if (this.tracing) this.record('call', node.line, frame);
    const signal = this.execBlock(node.body, frame);
    const value = signal instanceof Return ? signal.value : null;
    if (this.tracing) this.record('return', this.line, frame, value);
    // (not restored when an error unwinds: the error report wants the failing frame)
    this.callStack.pop();
    this.frame = caller;
    this.line = line;
    return value;
  }
}

/* ====================================================================== */
/* Conversions between Python values and plain JavaScript values          */
/* ====================================================================== */

/** Most container items one conversion to plain JavaScript will copy. */
const JS_NODES = 200000;

/**
 * A Python value as plain JavaScript data. Deeply nested, self-containing or
 * heavily shared values are cut off (null) once `budget` items have been
 * copied, so the result is always a modest tree that is safe to walk.
 */
function toJS(v, depth = 0, budget = { left: JS_NODES }) {
  switch (typeof v) {
    case 'number': return v + 0;
    case 'bigint': case 'boolean': case 'string': return v;
    default:
  }
  if (v === null || v === undefined) return null;
  if (v instanceof PyFloat) return v.v;
  if (depth > 40 || budget.left <= 0) return null;
  const items = (list) => {
    const out = [];
    for (let i = 0; i < list.length && budget.left > 0; i++) { budget.left--; out.push(toJS(list[i], depth + 1, budget)); }
    return out;
  };
  if (Array.isArray(v)) return items(v);
  if (v instanceof PyTuple) return items(v.items);
  if (v instanceof PyDict) {
    const out = {};
    for (const [k, x] of v.entries()) {
      if (budget.left <= 0) break;
      budget.left--;
      setOwn(out, pyStr(k), toJS(x, depth + 1, budget));
    }
    return out;
  }
  if (v instanceof PyRange) return v.length <= 10000 ? Array.from({ length: v.length }, (_, i) => v.at(i)) : pyRepr(v);
  if (v instanceof PyView) return items(viewItems(v));
  return pyRepr(v);
}

function toPy(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? (Number.isSafeInteger(v) ? v + 0 : normBig(BigInt(v))) : new PyFloat(v);
  if (typeof v === 'bigint') return normBig(v);
  if (typeof v === 'string' || typeof v === 'boolean') return v;
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return v.map(toPy);
  if (v instanceof PyFloat || v instanceof PyTuple || v instanceof PyDict) return v;
  if (typeof v === 'object') {
    if (Object.keys(v).length === 1 && typeof v.float === 'number') return new PyFloat(v.float);
    if (Object.keys(v).length === 1 && Array.isArray(v.tuple)) return new PyTuple(v.tuple.map(toPy));
    const d = new PyDict();
    for (const k of Object.keys(v)) d.set(k, toPy(v[k]));
    return d;
  }
  throw new Error(`cannot convert ${typeof v} to a Python value`);
}

/* ====================================================================== */
/* Friendly error descriptions                                            */
/* ====================================================================== */

function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev[j - 1]); // swapped letters (approx.)
    }
    prev = cur;
  }
  return prev[n];
}

function closest(name, candidates) {
  let best = null;
  let bestScore = Infinity;
  const lower = name.toLowerCase();
  for (const cand of candidates) {
    if (cand === name) continue;
    let score = cand.toLowerCase() === lower ? 0.5 : editDistance(name, cand);
    // short names are too easy to "almost match": only accept a difference in capitals
    const allowed = Math.min(name.length, cand.length) < 3 ? 0.5 : Math.floor(Math.max(name.length, cand.length) / 3);
    if (score > allowed) continue;
    if (cand.startsWith('_')) score += 1;
    if (score < bestScore) { best = cand; bestScore = score; }
  }
  return best;
}

const METHOD_ALIASES = {
  push: 'append', add: 'append', length: 'len(...)', size: 'len(...)', len: 'len(...)', contains: 'in', includes: 'in',
  indexOf: 'index', toUpperCase: 'upper', toLowerCase: 'lower', trim: 'strip', uppercase: 'upper', lowercase: 'lower',
};

function describeError(err, source) {
  const type = err.pyType;
  const message = err.message;
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const lineText = err.line >= 1 && err.line <= lines.length ? lines[err.line - 1] : '';
  const code = lineText.replace(/#.*$/, '');
  let hint = ERROR_HINTS[type] || '';
  let suggestion = null;

  if (type === 'SyntaxError') {
    if (/Maybe you meant '=='/.test(message) || /^\s*(?:if|elif|while)\b[^=]*[^=!<>]=[^=]/.test(code)) hint = 'A single = stores a value. To compare two values, use ==.';
    else if (/^expected ':'/.test(message)) hint = /^\s*else\s+if\b/.test(code) ? 'Python spells "else if" as one word: elif.' : 'A line that opens a block — if, elif, else, for, while, def — must end with a colon.';
    else if (/was never closed|unmatched|does not match opening/.test(message)) hint = 'Every opening bracket needs a matching closing bracket. Count them on this line.';
    else if (/unterminated/.test(message)) hint = 'Text must end with the same kind of quote mark it starts with.';
    else if (/Missing parentheses/.test(message)) hint = 'print is a function: put what you want to show inside brackets, like print("hi").';
    else if (/invalid character/.test(message) && /[‘’“”]/.test(message)) hint = 'Those are curly "smart" quotes. Python needs straight quotes: " or \'.';
    else if (/forgot a comma/.test(message)) hint = 'Values inside brackets are separated by commas.';
    else if (/outside function/.test(message)) hint = 'return only makes sense inside a function. Check that this line is indented under a def line.';
    else if (/outside loop|not properly in loop/.test(message)) hint = 'break and continue only make sense inside a loop. Check the indentation of this line.';
    else if (/&&|\|\|/.test(code)) hint = 'Python uses the words and, or and not instead of &&, || and !.';
    else if (/\+\+|--/.test(code)) hint = 'Python has no ++ or --. Write x += 1 or x = x + 1.';
    else if (/===|!==/.test(code)) hint = 'Python compares with == and !=.';
    else if (/^\s*else\s+if\b/.test(code)) hint = 'Python spells "else if" as one word: elif.';
    else if (/^\s*(?:if|elif|else|for|while|def)\b/.test(code) && !/:\s*$/.test(code.trimEnd()) && !/:/.test(code)) hint = 'A line that opens a block — if, elif, else, for, while, def — must end with a colon.';
  } else if (type === 'IndentationError') {
    if (/expected an indented block/.test(message)) hint = 'The line after a colon must start further in (4 spaces is usual). That is how Python knows which lines belong to the block.';
    else if (/unexpected indent/.test(message)) hint = 'This line starts further in than the line before it, but nothing opened a block. Remove the extra spaces at the start.';
    else if (/unindent/.test(message)) hint = 'The spaces at the start of this line do not line up with any earlier line. Make it match the block it belongs to.';
  } else if (type === 'NotSupportedError') {
    if (/the \^ operator/.test(message)) hint = 'In Python, ^ is not "to the power of". Write 2 ** 3 for two cubed.';
    else if (/the [&|] operator/.test(message)) hint = 'Python uses the words and, or and not instead of &&, || and !.';
    else if (/input\(\)/.test(message)) hint = 'These lessons run without a keyboard prompt. Set the value directly, for example name = "Ada".';
  } else if (type === 'NameError' && err.missing) {
    const name = err.missing;
    const spelled = { true: 'True', false: 'False', none: 'None', null: 'None', nil: 'None', TRUE: 'True', FALSE: 'False' }[name];
    if (spelled) { suggestion = spelled; hint = `Python spells it ${spelled}, with a capital letter.`; }
    else {
      suggestion = closest(name, err.known || []);
      const later = lines.findIndex((l, i) => i >= err.line && new RegExp(`^\\s*${name.replace(/[^\w]/g, '')}\\s*=[^=]`).test(l));
      if (!suggestion && later >= 0) hint = `This name only gets its value on line ${later + 1}, after this line has already run.`;
      else if (!suggestion) hint += ` If you meant the text ${name}, put it in quotes: "${name}".`;
    }
  } else if (type === 'TypeError') {
    if (/can only concatenate str|unsupported operand type\(s\) for \+=?: '(?:int|float)' and 'str'/.test(message)) hint = 'The + sign cannot join text and a number. Turn the number into text with str(...), or build the text with an f-string.';
    else if (/NoneType/.test(message)) hint = 'None usually means a function finished without a return. If you meant to use its result, the function has to return a value, not just print it.';
    else if (/object is not callable/.test(message)) hint = 'Round brackets after a name mean "call this function", but this name holds an ordinary value. Has a variable taken the name of a function, such as sum, list or len?';
    else if (/required positional argument|positional arguments? but/.test(message)) hint = 'A call must pass one value for each parameter in the def line — no more, no fewer.';
    else if (/not subscriptable/.test(message)) hint = 'Square brackets pick an item out of a list, a string or a dictionary. This value is none of those.';
    else if (/not iterable/.test(message)) hint = 'A for loop needs something to walk through, such as a list, a string or range(...). To count up to a number n, use range(n).';
    else if (/not supported between instances/.test(message)) hint = 'Python cannot say which is bigger when the two values are of different kinds, such as text and a number.';
    else if (/indices must be integers/.test(message)) hint = 'A position in a list or string must be a whole number.';
  } else if (type === 'AttributeError') {
    const m = /'(\w+)' object has no attribute '(\w+)'/.exec(message);
    if (m) {
      const [, kind, attr] = m;
      const table = kind === 'str' ? STR_METHODS : kind === 'list' ? LIST_METHODS : kind === 'dict' ? DICT_METHODS : kind === 'tuple' ? TUPLE_METHODS : null;
      if (METHOD_ALIASES[attr]) suggestion = METHOD_ALIASES[attr];
      else if (table) suggestion = closest(attr, Object.keys(table));
      if (kind === 'NoneType') hint = 'The value before the dot is None. That usually means a function (or a method like sort) returned nothing.';
      else if (!table) hint = `A value of type ${kind} has no methods here. Check what the name before the dot really holds.`;
    }
  } else if (type === 'ValueError' && /invalid literal for int/.test(message)) {
    hint = 'int() can only convert text that looks like a whole number, such as "42".';
  } else if (type === 'KeyError') {
    hint = ERROR_HINTS.KeyError;
  }

  const out = { type, message, line: err.line || 0, hint, text: message === '' ? type : `${type}: ${message}` };
  if (suggestion) out.suggestion = suggestion;
  return out;
}

/* ====================================================================== */
/* Public API                                                             */
/* ====================================================================== */

function finishError(interp, err, source) {
  let e = err;
  if (!(e instanceof PyError)) {
    // The JavaScript stack ran out before our own depth limit did
    // (RangeError in most engines, InternalError in Firefox).
    if (e instanceof RangeError || (e && /too much recursion|call stack/i.test(String(e.message)))) e = new PyError('RecursionError', 'maximum recursion depth exceeded');
    else throw e;
  }
  if (!e.line) e.line = interp.line;
  const info = describeError(e, source);
  if (interp.callStack.length) info.stack = interp.callStack.map((c) => ({ name: c.name, line: c.line }));
  return info;
}

function exportGlobals(interp, result) {
  const globals = {};
  const reprs = {};
  const types = {};
  const functions = [];
  for (const [name, value] of interp.globals) {
    if (value === undefined) continue;
    setOwn(reprs, name, pyRepr(value));
    setOwn(types, name, typeName(value));
    if (value instanceof PyFunc) functions.push(name);
    else setOwn(globals, name, toJS(value));
  }
  result.globals = globals;
  result.reprs = reprs;
  result.types = types;
  result.functions = functions;
}

/**
 * Run a program.
 * @param {string} source
 * @param {{ maxSteps?: number, trace?: boolean, maxTrace?: number, maxDepth?: number, maxOutput?: number, inputs?: object }} [options]
 */
export function run(source, options = {}) {
  const src = String(source == null ? '' : source);
  const interp = new Interp(options);
  const result = { ok: true, stdout: '', error: null, globals: {}, reprs: {}, types: {}, functions: [], steps: 0 };
  let tree = null;
  try {
    tree = parse(src);
  } catch (err) {
    result.ok = false;
    result.error = finishError(interp, err, src);
    result.error.phase = 'syntax';
  }
  if (tree) {
    work = WORK_LIMIT;
    try {
      interp.execBlock(tree.body, interp.module);
      if (interp.tracing) interp.record('end', 0, interp.module);
    } catch (err) {
      result.ok = false;
      result.error = finishError(interp, err, src);
      result.error.phase = 'runtime';
      if (options.trace && interp.trace.length < interp.maxTrace) {
        interp.tracing = true;
        interp.record('error', result.error.line, interp.frame);
      }
    } finally {
      work = Infinity;
    }
  }
  result.stdout = interp.out;
  result.steps = interp.steps;
  exportGlobals(interp, result);
  if (options.trace) {
    for (const entry of interp.trace) { entry.stdout = interp.out.slice(0, entry.out); delete entry.out; }
    result.trace = interp.trace;
    result.traceTruncated = interp.traceTruncated;
  }

  /**
   * Evaluate an expression (for example a call such as "area(3, 4)") in the
   * program's final environment.
   */
  result.call = (expression, callOptions = {}) => {
    const out = { ok: true, value: null, repr: 'None', type: 'NoneType', stdout: '', error: null };
    const before = interp.out.length;
    interp.steps = 0;
    interp.maxSteps = callOptions.maxSteps > 0 ? callOptions.maxSteps : (options.maxSteps > 0 ? options.maxSteps : DEFAULT_STEPS);
    interp.callStack.length = 0;
    interp.frame = interp.module;
    interp.tracing = false;
    interp.line = 1;
    work = WORK_LIMIT;
    try {
      const node = parseExpression(String(expression));
      const value = interp.eval(node, interp.module);
      out.value = toJS(value);
      out.repr = pyRepr(value);
      out.type = typeName(value);
    } catch (err) {
      out.ok = false;
      out.error = finishError(interp, err, src);
      out.error.inCall = !interp.callStack.length;
    } finally {
      work = Infinity;
    }
    out.stdout = interp.out.slice(before);
    interp.out = interp.out.slice(0, before);
    return out;
  };
  return result;
}

/** Check the syntax of a program without running it: null, or an error description. */
export function syntaxError(source) {
  try { parse(String(source)); return null; } catch (err) {
    if (!(err instanceof PyError)) throw err;
    return describeError(err, String(source));
  }
}

/**
 * The program with string contents and comments blanked out (same length,
 * same line breaks). Used for simple "must use a for loop" style checks.
 */
export function codeOnly(source) {
  const text = String(source);
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '#') { while (i < text.length && text[i] !== '\n') { out += ' '; i++; } continue; }
    if (c === '"' || c === "'") {
      const triple = text.startsWith(c.repeat(3), i);
      const q = triple ? c.repeat(3) : c;
      out += q; i += q.length;
      while (i < text.length && !text.startsWith(q, i)) {
        if (text[i] === '\n') { if (!triple) break; out += '\n'; i++; continue; }
        if (text[i] === '\\' && i + 1 < text.length && text[i + 1] !== '\n') { out += '  '; i += 2; continue; }
        out += ' '; i++;
      }
      if (text.startsWith(q, i)) { out += q; i += q.length; }
      continue;
    }
    out += c; i++;
  }
  return out;
}

export { tokenize, toJS, toPy, formatValue };
