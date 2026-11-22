/**
 * Turn a parsed expression (see mathexpr.js) back into TeX, so learners can
 * see a typeset preview of what they are typing: "3x^2/4" -> \frac{3x^{2}}{4}
 */
import { parse } from './mathexpr.js';

const GREEK = new Set(['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 'sigma', 'omega', 'phi', 'rho', 'tau']);
const NAMED_FN = new Set(['sin', 'cos', 'tan', 'ln', 'log', 'exp', 'min', 'max', 'gcd', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh']);

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4 };

function prec(node) {
  if (node.t === 'bin') return PREC[node.op];
  if (node.t === 'neg') return PREC.neg;
  if (node.t === 'num' && node.v < 0) return PREC.neg;
  return 5;
}

function numTex(v) {
  if (v === Math.PI) return '\\pi';
  if (v === Math.E) return 'e';
  if (v === 2 * Math.PI) return '\\tau';
  if (!Number.isFinite(v)) return v > 0 ? '\\infty' : '-\\infty';
  const str = String(Math.round(v * 1e10) / 1e10);
  return str.includes('e') ? v.toPrecision(6) : str;
}

function varTex(name) {
  if (GREEK.has(name)) return `\\${name}`;
  const m = /^([A-Za-z])_?(\w+)$/.exec(name);
  if (m && /^\d+$|^_/.test(name.slice(1))) return `${m[1]}_{${m[2]}}`;
  return name.length > 1 ? `\\mathrm{${name}}` : name;
}

const paren = (tex) => `\\left(${tex}\\right)`;
const wrap = (node, min) => (prec(node) < min ? paren(tex(node)) : tex(node));

/** Can `b` be written right after `a` with no multiplication sign? */
function juxtapose(a, b) {
  const bStartsWithNumber = b.t === 'num' || (b.t === 'bin' && b.op === '^' && b.a.t === 'num');
  if (bStartsWithNumber) return false;
  if (b.t === 'neg') return false;
  if (a.t === 'call' && !['sqrt', 'abs'].includes(a.name)) return false;
  return true;
}

function tex(node) {
  switch (node.t) {
    case 'num': return numTex(node.v);
    case 'var': return varTex(node.name);
    case 'neg': return `-${wrap(node.a, PREC.neg)}`;
    case 'bin': {
      const { op, a, b } = node;
      if (op === '+') return `${tex(a)} + ${wrap(b, 1)}`;
      if (op === '-') return `${tex(a)} - ${wrap(b, 2)}`;
      if (op === '/') return `\\frac{${tex(a)}}{${tex(b)}}`;
      if (op === '^') {
        const base = a.t === 'call' || prec(a) < 5 ? paren(tex(a)) : tex(a);
        return `${base}^{${tex(b)}}`;
      }
      const left = wrap(a, 2);
      const right = wrap(b, 2);
      const rightNeedsParen = prec(b) < 2;
      if (juxtapose(a, b) || rightNeedsParen) return `${left}${right}`;
      return `${left} \\cdot ${right}`;
    }
    case 'call': {
      const args = node.args.map(tex);
      if (node.name === 'sqrt') return `\\sqrt{${args[0]}}`;
      if (node.name === 'cbrt') return `\\sqrt[3]{${args[0]}}`;
      if (node.name === 'abs') return `\\left|${args[0]}\\right|`;
      if (node.name === 'fact') return `${wrap(node.args[0], 5)}!`;
      if (node.name === 'choose' || node.name === 'nCr' || node.name === 'binom') return `\\binom{${args[0]}}{${args[1]}}`;
      const fn = NAMED_FN.has(node.name) ? `\\${node.name}` : `\\operatorname{${node.name}}`;
      return `${fn}\\left(${args.join(', ')}\\right)`;
    }
    default: return '';
  }
}

/** Expression string -> TeX string, or null if it does not parse. */
export function exprToTex(src, opts) {
  try {
    return tex(parse(src, opts));
  } catch {
    return null;
  }
}

export const astToTex = tex;
