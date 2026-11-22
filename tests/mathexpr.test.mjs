import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, compile, equivalent, parseNumber, formatNumber, variablesOf, MathError } from '../src/core/mathexpr.js';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} !~ ${b}`);

test('arithmetic and precedence', () => {
  assert.equal(evaluate('1 + 2 * 3'), 7);
  assert.equal(evaluate('(1 + 2) * 3'), 9);
  assert.equal(evaluate('2^3^2'), 512);
  assert.equal(evaluate('-2^2'), -4);
  assert.equal(evaluate('(-2)^2'), 4);
  assert.equal(evaluate('2^-1'), 0.5);
  assert.equal(evaluate('10 - 4 - 3'), 3);
  assert.equal(evaluate('8 / 4 / 2'), 1);
  assert.equal(evaluate('2 ** 5'), 32);
});

test('implicit multiplication', () => {
  assert.equal(evaluate('2x', { x: 5 }), 10);
  assert.equal(evaluate('2(x + 1)', { x: 5 }), 12);
  assert.equal(evaluate('(x + 1)(x - 1)', { x: 5 }), 24);
  assert.equal(evaluate('3xy', { x: 2, y: 4 }), 24);
  assert.equal(evaluate('2x^2', { x: 3 }), 18);
  near(evaluate('2pi'), 2 * Math.PI);
  assert.equal(evaluate('1/2x', { x: 4 }), 2);
});

test('functions, constants, postfix', () => {
  near(evaluate('sin(pi/2)'), 1);
  assert.equal(evaluate('sqrt(16)'), 4);
  assert.equal(evaluate('√16'), 4);
  assert.equal(evaluate('|3 - 10|'), 7);
  assert.equal(evaluate('5!'), 120);
  assert.equal(evaluate('50%'), 0.5);
  assert.equal(evaluate('choose(5, 2)'), 10);
  assert.equal(evaluate('mod(-1, 5)'), 4);
  assert.equal(evaluate('gcd(12, 18)'), 6);
  assert.equal(evaluate('lcm(4, 6)'), 12);
  near(evaluate('log(1000)'), 3);
  near(evaluate('log(8, 2)'), 3);
  near(evaluate('ln(e)'), 1);
  near(evaluate('(-8)^(1/3)'), -2);
  assert.equal(evaluate('max(1, 7, 3)'), 7);
});

test('unicode operators', () => {
  assert.equal(evaluate('3 × 4'), 12);
  assert.equal(evaluate('12 ÷ 4'), 3);
  assert.equal(evaluate('5 − 7'), -2);
  assert.equal(evaluate('3²'), 9);
});

test('declared variables may be multi-letter and may shadow constants', () => {
  const f = compile('amp*sin(x) + e', { vars: ['amp', 'x', 'e'] });
  near(f({ amp: 2, x: Math.PI / 2, e: 1 }), 3);
  assert.throws(() => compile('y + 1', { vars: ['x'] }), MathError);
});

test('errors', () => {
  assert.throws(() => evaluate(''), MathError);
  assert.throws(() => evaluate('2 +'), MathError);
  assert.throws(() => evaluate('(2 + 3'), MathError);
  assert.throws(() => evaluate('2 $ 3'), MathError);
  assert.throws(() => evaluate('x + 1'), MathError); // x not in scope
  assert.throws(() => evaluate('sin x', { x: 1 }), MathError);
});

test('equivalent expressions', () => {
  assert.ok(equivalent('2(x+3)', '2x+6'));
  assert.ok(equivalent('x^2 - 1', '(x-1)(x+1)'));
  assert.ok(equivalent('(x+y)^2', 'x^2 + 2xy + y^2', ['x', 'y']));
  assert.ok(!equivalent('2x+3', '2x+6'));
  assert.ok(!equivalent('x^2', 'x^3'));
  assert.ok(equivalent('sqrt(x)^2', 'x'));           // only where both are defined
  assert.ok(!equivalent('2x +', '2x'));
  assert.ok(equivalent('1/2 x', 'x/2'));
});

test('parseNumber understands how people type numbers', () => {
  assert.equal(parseNumber('42'), 42);
  assert.equal(parseNumber(' -3.5 '), -3.5);
  assert.equal(parseNumber('3/4'), 0.75);
  assert.equal(parseNumber('1 1/2'), 1.5);
  assert.equal(parseNumber('-2 1/4'), -2.25);
  assert.equal(parseNumber('1,234,567'), 1234567);
  assert.equal(parseNumber('3,5'), 3.5);
  assert.equal(parseNumber('0,375'), 0.375);      // a decimal comma, not a thousands separator
  assert.equal(parseNumber('-0,125'), -0.125);
  assert.equal(parseNumber('12,345'), 12345);
  assert.equal(parseNumber('10 000'), 10000);
  assert.equal(parseNumber('$12.50'), 12.5);
  assert.equal(parseNumber('= 7'), 7);
  assert.equal(parseNumber('−4'), -4);
  assert.equal(parseNumber('2^10'), 1024);
  assert.equal(parseNumber('50%'), 0.5);
  assert.equal(parseNumber('50%', { percentAsNumber: true }), 50);
  assert.equal(parseNumber('12 cm', { unit: 'cm' }), 12);
  assert.equal(parseNumber('45°'), 45);
  assert.ok(Number.isNaN(parseNumber('abc')));
  assert.ok(Number.isNaN(parseNumber('')));
  assert.ok(Number.isNaN(parseNumber('x+1')));
  near(parseNumber('sqrt(2)'), Math.SQRT2);
});

test('formatNumber', () => {
  assert.equal(formatNumber(3), '3');
  assert.equal(formatNumber(0.1 + 0.2), '0.3');
  assert.equal(formatNumber(-2.5), '−2.5');
  assert.equal(formatNumber(1 / 3, 2), '0.33');
  assert.equal(formatNumber(-0.00001, 2), '0');
});

test('variablesOf', () => {
  assert.deepEqual(variablesOf('a*x^2 + b*x + c').sort(), ['a', 'b', 'c', 'x']);
  assert.deepEqual(variablesOf('sin(pi*x)'), ['x']);
});

test('custom functions', () => {
  const f = compile('f0(a) + 1', { vars: ['a'], fns: { f0: (x) => x * x } });
  assert.equal(f({ a: 3 }), 10);
  assert.equal(evaluate('2g(4)', {}, { fns: { g: (x) => x + 1 } }), 10);
});
