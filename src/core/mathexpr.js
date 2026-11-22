/**
 * A small, safe math-expression engine (no eval).
 *
 * Used for: checking typed numeric answers ("3/4", "2^5", "sqrt(2)"),
 * checking algebraic answers by numeric equivalence ("2(x+3)" vs "2x+6"),
 * and plotting functions in widgets ("a*sin(b*x)").
 *
 *   evaluate('2x^2 + 1', { x: 3 })            // 19
 *   const f = compile('m*x + b', { vars: ['m', 'x', 'b'] });  f({ m: 2, x: 1, b: 0 })
 *   equivalent('2(x+3)', '2x+6', ['x'])        // true
 *   parseNumber('1 1/2')                        // 1.5
 */

export class MathError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MathError';
  }
}

const gcd2 = (a, b) => {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { const t = a % b; a = b; b = t; }
  return a;
};

function factorial(n) {
  if (n < 0 || Math.abs(n - Math.round(n)) > 1e-9) return NaN;
  n = Math.round(n);
  if (n > 170) return Infinity;
  let out = 1;
  for (let i = 2; i <= n; i++) out *= i;
  return out;
}

function choose(n, k) {
  n = Math.round(n); k = Math.round(k);
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let out = 1;
  for (let i = 1; i <= k; i++) out = (out * (n - k + i)) / i;
  return Math.round(out);
}

const D2R = Math.PI / 180;

export const FUNCTIONS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
  arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  sind: (x) => Math.sin(x * D2R), cosd: (x) => Math.cos(x * D2R), tand: (x) => Math.tan(x * D2R),
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
  root: (x, n) => (x < 0 && Math.round(n) % 2 !== 0 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n)),
  ln: Math.log, log2: Math.log2, log10: Math.log10,
  log: (x, base) => (base === undefined ? Math.log10(x) : Math.log(x) / Math.log(base)),
  exp: Math.exp,
  floor: Math.floor, ceil: Math.ceil, trunc: Math.trunc,
  round: (x, places = 0) => { const p = Math.pow(10, places); return Math.round(x * p) / p; },
  min: Math.min, max: Math.max, sign: Math.sign, hypot: Math.hypot,
  mod: (a, b) => ((a % b) + b) % b,
  gcd: (...xs) => xs.reduce(gcd2),
  lcm: (...xs) => xs.reduce((a, b) => (a && b ? Math.abs(a * b) / gcd2(a, b) : 0)),
  fact: factorial,
  choose, nCr: choose, binom: choose,
  nPr: (n, k) => (k < 0 || k > n ? 0 : Math.round(factorial(n) / factorial(n - k))),
  deg: (x) => x / D2R, rad: (x) => x * D2R,
  clamp: (x, lo, hi) => Math.min(hi, Math.max(lo, x)),
  step: (x) => (x >= 0 ? 1 : 0),
  sigmoid: (x) => 1 / (1 + Math.exp(-x)),
  relu: (x) => Math.max(0, x),
};

export const CONSTANTS = {
  pi: Math.PI, 'π': Math.PI, tau: 2 * Math.PI, 'τ': 2 * Math.PI,
  e: Math.E, phi: (1 + Math.sqrt(5)) / 2, inf: Infinity,
};

const OP_ALIASES = {
  '×': '*', '·': '*', '⋅': '*', '∗': '*', '∙': '*',
  '÷': '/', '∕': '/',
  '−': '-', '–': '-', '—': '-',
  '²': '^2', '³': '^3',
};

const IDENT_RE = /^[A-Za-z_Ͱ-Ͽ][A-Za-z0-9_Ͱ-Ͽ]*/;
const NUM_RE = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;

function tokenize(src, known) {
  const tokens = [];
  let i = 0;
  const str = String(src);
  while (i < str.length) {
    let ch = str[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (OP_ALIASES[ch]) {
      const rep = OP_ALIASES[ch];
      if (rep.length === 1) tokens.push({ t: 'op', v: rep });
      else { tokens.push({ t: 'op', v: '^' }); tokens.push({ t: 'num', v: Number(rep.slice(1)) }); }
      i++; continue;
    }
    if (ch === '√') { tokens.push({ t: 'id', v: 'sqrt', radical: true }); i++; continue; }
    if (ch === '*' && str[i + 1] === '*') { tokens.push({ t: 'op', v: '^' }); i += 2; continue; }
    const rest = str.slice(i);
    let m = NUM_RE.exec(rest);
    if (m) {
      // "2e" followed by a non-digit is 2·e, which NUM_RE already leaves alone.
      tokens.push({ t: 'num', v: Number(m[0]) });
      i += m[0].length; continue;
    }
    m = IDENT_RE.exec(rest);
    if (m) {
      for (const name of splitIdent(m[0], known)) {
        if (/^\d/.test(name)) tokens.push({ t: 'num', v: Number(name) });
        else tokens.push({ t: 'id', v: name });
      }
      i += m[0].length; continue;
    }
    if ('+-*/^(),!%|'.includes(ch)) { tokens.push({ t: 'op', v: ch }); i++; continue; }
    if (ch === '[' || ch === '{') { tokens.push({ t: 'op', v: '(' }); i++; continue; }
    if (ch === ']' || ch === '}') { tokens.push({ t: 'op', v: ')' }); i++; continue; }
    throw new MathError(`Unexpected character "${ch}"`);
  }
  return tokens;
}

/** Split "2xy" style words into known names; unknown multi-letter words become single letters. */
function splitIdent(word, known) {
  if (known(word)) return [word];
  if (/^[A-Za-z]\d+$/.test(word) || /^[A-Za-z]_\w+$/.test(word)) return [word]; // x1, x_0
  const out = [];
  let i = 0;
  while (i < word.length) {
    let found = null;
    for (let len = word.length - i; len >= 2; len--) {
      const piece = word.slice(i, i + len);
      if (known(piece)) { found = piece; break; }
    }
    if (found) { out.push(found); i += found.length; continue; }
    const ch = word[i];
    if (/\d/.test(ch)) {
      let j = i;
      while (j < word.length && /\d/.test(word[j])) j++;
      out.push(word.slice(i, j));
      i = j;
    } else {
      out.push(ch);
      i++;
    }
  }
  return out;
}

/**
 * Parse an expression into an AST.
 * @param {string} src
 * @param {{ vars?: string[], fns?: Record<string, Function> }} [opts]
 *   If `vars` is given, only those names are accepted as variables (anything
 *   else is an error). If omitted, any identifier that is not a function or
 *   constant is treated as a variable. `fns` adds custom functions, e.g.
 *   { f0: (x) => x * x } makes "f0(3) + 1" valid.
 */
export function parse(src, opts = {}) {
  const allowed = opts.vars ? new Set(opts.vars) : null;
  const custom = opts.fns || null; // extra functions: { f0: (x) => … }
  const isFn = (name) => (custom && Object.prototype.hasOwnProperty.call(custom, name)) ||
    Object.prototype.hasOwnProperty.call(FUNCTIONS, name);
  const fnRef = (name) => (custom && Object.prototype.hasOwnProperty.call(custom, name) ? custom[name] : FUNCTIONS[name]);
  const known = (name) =>
    (allowed ? allowed.has(name) : false) ||
    isFn(name) ||
    Object.prototype.hasOwnProperty.call(CONSTANTS, name);
  const tokens = tokenize(src, known);
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (v) => tokens[pos] && tokens[pos].t === 'op' && tokens[pos].v === v;
  const eat = (v) => { if (isOp(v)) { pos++; return true; } return false; };

  if (!tokens.length) throw new MathError('Empty expression');

  function parseExpr(stopBar) {
    let node = parseTerm(stopBar);
    while (isOp('+') || isOp('-')) {
      const op = tokens[pos++].v;
      node = { t: 'bin', op, a: node, b: parseTerm(stopBar) };
    }
    return node;
  }

  function startsOperand(stopBar) {
    const tk = peek();
    if (!tk) return false;
    if (tk.t === 'num' || tk.t === 'id') return true;
    if (tk.t === 'op' && tk.v === '(') return true;
    if (tk.t === 'op' && tk.v === '|' && !stopBar) return true;
    return false;
  }

  function parseTerm(stopBar) {
    let node = parseUnary(stopBar);
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = tokens[pos++].v;
        node = { t: 'bin', op, a: node, b: parseUnary(stopBar) };
      } else if (startsOperand(stopBar)) {
        // implicit multiplication: 2x, 3(x+1), (a)(b), 2pi
        node = { t: 'bin', op: '*', a: node, b: parsePower(stopBar) };
      } else break;
    }
    return node;
  }

  function parseUnary(stopBar) {
    if (eat('-')) return { t: 'neg', a: parseUnary(stopBar) };
    if (eat('+')) return parseUnary(stopBar);
    return parsePower(stopBar);
  }

  function parsePower(stopBar) {
    const base = parsePostfix(stopBar);
    if (eat('^')) return { t: 'bin', op: '^', a: base, b: parseUnary(stopBar) }; // right assoc
    return base;
  }

  function parsePostfix(stopBar) {
    let node = parsePrimary(stopBar);
    for (;;) {
      if (eat('!')) node = { t: 'call', name: 'fact', args: [node], fn: FUNCTIONS.fact };
      else if (eat('%')) node = { t: 'bin', op: '/', a: node, b: { t: 'num', v: 100 } };
      else break;
    }
    return node;
  }

  function parsePrimary(stopBar) {
    const tk = tokens[pos];
    if (!tk) throw new MathError('Expression ended unexpectedly');
    if (tk.t === 'num') { pos++; return { t: 'num', v: tk.v }; }
    if (tk.t === 'id') {
      pos++;
      const name = tk.v;
      const isVar = allowed ? allowed.has(name) : false;
      if (!isVar && isFn(name)) {
        if (eat('(')) {
          const args = [];
          if (!isOp(')')) {
            do { args.push(parseExpr(false)); } while (eat(','));
          }
          if (!eat(')')) throw new MathError('Missing closing parenthesis');
          return { t: 'call', name, args, fn: fnRef(name) };
        }
        if (tk.radical) return { t: 'call', name, args: [parsePower(stopBar)], fn: fnRef(name) };
        throw new MathError(`Use parentheses with ${name}, like ${name}(x)`);
      }
      if (!isVar && Object.prototype.hasOwnProperty.call(CONSTANTS, name)) {
        return { t: 'num', v: CONSTANTS[name] };
      }
      if (allowed && !isVar) throw new MathError(`Unknown symbol "${name}"`);
      return { t: 'var', name };
    }
    if (tk.t === 'op' && tk.v === '(') {
      pos++;
      const node = parseExpr(false);
      if (!eat(')')) throw new MathError('Missing closing parenthesis');
      return node;
    }
    if (tk.t === 'op' && tk.v === '|' && !stopBar) {
      pos++;
      const node = parseExpr(true);
      if (!eat('|')) throw new MathError('Missing closing |');
      return { t: 'call', name: 'abs', args: [node], fn: FUNCTIONS.abs };
    }
    throw new MathError(`Unexpected "${tk.v}"`);
  }

  const ast = parseExpr(false);
  if (pos < tokens.length) throw new MathError(`Unexpected "${tokens[pos].v}"`);
  return ast;
}

function build(node) {
  switch (node.t) {
    case 'num': { const v = node.v; return () => v; }
    case 'var': {
      const name = node.name;
      return (scope) => {
        const v = scope ? scope[name] : undefined;
        if (v === undefined) throw new MathError(`Unknown variable "${name}"`);
        return v;
      };
    }
    case 'neg': { const a = build(node.a); return (sc) => -a(sc); }
    case 'bin': {
      const a = build(node.a);
      const b = build(node.b);
      switch (node.op) {
        case '+': return (sc) => a(sc) + b(sc);
        case '-': return (sc) => a(sc) - b(sc);
        case '*': return (sc) => a(sc) * b(sc);
        case '/': return (sc) => a(sc) / b(sc);
        case '^': return (sc) => {
          const base = a(sc);
          const ex = b(sc);
          // Real odd roots of negatives, e.g. (-8)^(1/3)
          if (base < 0 && !Number.isInteger(ex)) {
            const inv = 1 / ex;
            if (Math.abs(inv - Math.round(inv)) < 1e-9 && Math.abs(Math.round(inv)) % 2 === 1) {
              return -Math.pow(-base, ex);
            }
          }
          return Math.pow(base, ex);
        };
        default: throw new MathError(`Unknown operator ${node.op}`);
      }
    }
    case 'call': {
      const fn = node.fn || FUNCTIONS[node.name];
      const args = node.args.map(build);
      if (args.length === 1) { const a0 = args[0]; return (sc) => fn(a0(sc)); }
      return (sc) => fn(...args.map((f) => f(sc)));
    }
    default: throw new MathError('Bad expression');
  }
}

/** Compile to a fast function of a scope object. Throws MathError on bad syntax. */
export function compile(src, opts) {
  const fn = build(parse(src, opts));
  return (scope) => fn(scope || {});
}

/** Parse + evaluate in one go. */
export function evaluate(src, scope = {}, opts) {
  return compile(src, opts)(scope);
}

/** Like compile(), but returns null instead of throwing. */
export function tryCompile(src, opts) {
  try { return compile(src, opts); } catch { return null; }
}

/** All variable names used in an expression. */
export function variablesOf(src, opts) {
  const names = new Set();
  (function walk(n) {
    if (!n) return;
    if (n.t === 'var') names.add(n.name);
    if (n.a) walk(n.a);
    if (n.b) walk(n.b);
    if (n.args) n.args.forEach(walk);
  })(typeof src === 'string' ? parse(src, opts) : src);
  return Array.from(names);
}

/** Relative/absolute closeness check for floats. */
export function approxEqual(a, b, tol = 1e-9) {
  if (a === b) return true;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}

/**
 * Are two expressions equal as functions? Checked numerically at sample points.
 * Not a proof, but more than enough to grade school algebra.
 */
export function equivalent(exprA, exprB, vars = ['x'], opts = {}) {
  const { samples = 14, tol = 1e-6, domain = [-4, 4] } = opts;
  let fa; let fb;
  try {
    fa = compile(exprA, { vars });
    fb = compile(exprB, { vars });
  } catch {
    return false;
  }
  // Deterministic, irrational-ish sample points avoid accidental coincidences.
  let valid = 0;
  for (let i = 0; i < samples * 3 && valid < samples; i++) {
    const scope = {};
    vars.forEach((v, j) => {
      const u = ((i + 1) * 0.6180339887 + (j + 1) * 0.3247179572 + i * j * 0.1234567) % 1;
      scope[v] = domain[0] + u * (domain[1] - domain[0]);
    });
    let a; let b;
    try { a = fa(scope); b = fb(scope); } catch { return false; }
    // Skip points where either side is undefined (sqrt of a negative, 1/0…):
    // "x^2/x" should still count as "x".
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (!approxEqual(a, b, tol)) return false;
    valid++;
  }
  return valid >= Math.min(4, samples);
}

/**
 * Parse what a learner typed into a number box. Accepts decimals, fractions,
 * mixed numbers ("1 1/2"), thousands separators, simple arithmetic, a comma
 * decimal mark ("3,5"), and leading currency / trailing unit noise.
 * Returns NaN when it is not a number.
 */
export function parseNumber(input, opts = {}) {
  if (typeof input === 'number') return input;
  let str = String(input == null ? '' : input).trim();
  if (!str) return NaN;
  str = str.replace(/^[=≈]\s*/, '').replace(/^[$€£¥]\s*/, '').replace(/[−–—]/g, '-');
  if (opts.percentAsNumber) str = str.replace(/\s*%$/, '');
  // strip a trailing unit word the author told us about, e.g. "12 cm"
  if (opts.unit) {
    const unit = String(opts.unit).trim();
    if (unit && str.toLowerCase().endsWith(unit.toLowerCase())) str = str.slice(0, -unit.length).trim();
  }
  str = str.replace(/°$/, '').trim();
  // mixed number: "1 1/2" or "-2 3/4"
  let m = /^(-?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(str);
  if (m) {
    const val = Number(m[2]) + Number(m[3]) / Number(m[4]);
    return m[1] ? -val : val;
  }
  // thousands separators: 1,234,567(.89). A number that starts with 0 is never grouped this way,
  // so "0,375" falls through to the decimal-comma rule instead of being read as 375.
  if (/^-?[1-9]\d{0,2}(,\d{3})+(\.\d+)?$/.test(str)) str = str.replace(/,/g, '');
  // comma as decimal mark: "3,5"
  else if (/^-?\d+,\d+$/.test(str)) str = str.replace(',', '.');
  // spaces inside long numbers: "10 000"
  if (/^-?\d{1,3}( \d{3})+(\.\d+)?$/.test(str)) str = str.replace(/ /g, '');
  try {
    const val = evaluate(str, {}, { vars: [] });
    return typeof val === 'number' ? val : NaN;
  } catch {
    return NaN;
  }
}

/**
 * Format a number for display: at most `digits` decimals, no trailing zeros,
 * and a real minus sign.
 */
export function formatNumber(n, digits = 4) {
  if (!Number.isFinite(n)) return n > 0 ? '∞' : n < 0 ? '−∞' : '—';
  const p = Math.pow(10, digits);
  let r = Math.round(n * p) / p;
  if (Object.is(r, -0)) r = 0;
  const str = String(r);
  const out = /e/.test(str) ? r.toPrecision(4) : str;
  return out.replace('-', '−');
}
