import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { run, parse, pyRepr, syntaxError, codeOnly, ERROR_HINTS, DEFAULT_STEPS, PyFloat, PyTuple, toPy, toJS } from '../src/lang/minipy.js';

/** stdout of a program that must run without error. */
function out(src, options) {
  const r = run(src, options);
  assert.equal(r.error, null, r.error ? `${r.error.text} (line ${r.error.line})\n${src}` : '');
  return r.stdout;
}
/** Printed lines of a program. */
const lines = (src, options) => out(src, options).replace(/\n$/, '').split('\n');
/** The value printed by print(<expr>). */
const show = (expr) => out(`print(${expr})`).replace(/\n$/, '');
/** The error of a program that must fail. */
function err(src, options) {
  const r = run(src, options);
  assert.ok(r.error, `expected an error from:\n${src}\nbut it printed ${JSON.stringify(r.stdout)}`);
  assert.equal(r.ok, false);
  return r.error;
}
/** Assert error type, message and line in one go. */
function fails(src, type, message, line) {
  const e = err(src);
  assert.equal(e.type, type, `${e.text}\n${src}`);
  if (message instanceof RegExp) assert.match(e.message, message);
  else if (message != null) assert.equal(e.message, message);
  if (line != null) assert.equal(e.line, line, `line of ${e.text}\n${src}`);
  return e;
}

/* ------------------------------------------------------------------ basics */

test('the required formatting examples', () => {
  assert.equal(show('0.1 + 0.2'), '0.30000000000000004');
  assert.equal(show('7 / 2'), '3.5');
  assert.equal(show('6 / 2'), '3.0');
  assert.equal(show('7 // 2'), '3');
  assert.equal(show('True'), 'True');
  assert.equal(show("[1, 'a']"), "[1, 'a']");
  assert.equal(show('None'), 'None');
});

test('arithmetic and precedence', () => {
  assert.equal(show('1 + 2 * 3'), '7');
  assert.equal(show('(1 + 2) * 3'), '9');
  assert.equal(show('2 ** 3 ** 2'), '512');
  assert.equal(show('-2 ** 2'), '-4');
  assert.equal(show('(-2) ** 2'), '4');
  assert.equal(show('2 ** -1'), '0.5');
  assert.equal(show('10 - 4 - 3'), '3');
  assert.equal(show('8 / 4 / 2'), '1.0');
  assert.equal(show('2 + 3 * 4 ** 2 / 8 % 5'), '3.0');
  assert.equal(show('7 // 2 * 2 + 7 % 2'), '7');
  assert.equal(show('- 5 + 3'), '-2');
  assert.equal(show('not 1 == 2'), 'True');
  assert.equal(show('1 if 0 else 2 if 0 else 3'), '3');
});

test('floor division and modulo follow the sign of the divisor', () => {
  assert.equal(show('-7 // 2'), '-4');
  assert.equal(show('7 // -2'), '-4');
  assert.equal(show('-7 % 3'), '2');
  assert.equal(show('7 % -3'), '-2');
  assert.equal(show('-7.5 % 2'), '0.5');
  assert.equal(show('7.0 // 2'), '3.0');
  assert.equal(show('divmod(-7, 2)'), '(-4, 1)');
});

test('int versus float', () => {
  assert.equal(show('5 / 1'), '5.0');
  assert.equal(show('5 // 1'), '5');
  assert.equal(show('1 + 1.0'), '2.0');
  assert.equal(show('2 * 0.5'), '1.0');
  assert.equal(show('2 ** 2.0'), '4.0');
  assert.equal(show('4 ** 0.5'), '2.0');
  assert.equal(show('type(1 / 1)'), "<class 'float'>");
  assert.equal(show('type(7 // 2)'), "<class 'int'>");
  assert.equal(show('1 == 1.0'), 'True');
  assert.equal(show('int(3.9)'), '3');
  assert.equal(show('int(-3.9)'), '-3');
  assert.equal(show('float(3)'), '3.0');
  assert.equal(show('0.1 + 0.2 == 0.3'), 'False');
  assert.equal(show('-0'), '0');
  assert.equal(show('0 * -1'), '0');
  assert.equal(show('-0.0'), '-0.0');
});

test('whole numbers stay exact at any size', () => {
  assert.equal(show('2 ** 64'), '18446744073709551616');
  assert.equal(show('2 ** 100'), '1267650600228229401496703205376');
  assert.equal(show('9007199254740991 + 2'), '9007199254740993');
  assert.equal(show('12345678901234567890 * 98765432109876543210'), '1219326311370217952237463801111263526900');
  assert.equal(show('10 ** 30 // 7'), '142857142857142857142857142857');
  assert.equal(show('-(10 ** 30) % 7'), '6');
  assert.equal(show('(2 ** 53 + 1) - 2 ** 53'), '1');
  assert.equal(show('2 ** 100 / 2 ** 98'), '4.0');
  assert.equal(lines('def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\nprint(fact(25))')[0], '15511210043330985984000000');
});

test('bool is an int; and / or return operands', () => {
  assert.equal(show('True + True'), '2');
  assert.equal(show('sum([True, False, True])'), '2');
  assert.equal(show('5 and 3'), '3');
  assert.equal(show('0 or "x"'), 'x');
  assert.equal(show('[] or 0'), '0');
  assert.equal(show('not []'), 'True');
  assert.deepEqual(lines('def loud():\n    print("called")\n    return True\nprint(False and loud())\nprint(True or loud())'), ['False', 'True']);
});

test('comparisons, including chained ones', () => {
  assert.equal(show('1 < 2 < 3'), 'True');
  assert.equal(show('1 < 3 < 2'), 'False');
  assert.equal(show('1 == 1 == 1'), 'True');
  assert.equal(show('"a" < "b"'), 'True');
  assert.equal(show('"2" < "10"'), 'False');
  assert.equal(show('[1, 2] < [1, 3]'), 'True');
  assert.equal(show('(1, 2) == [1, 2]'), 'False');
  assert.equal(show('"1" == 1'), 'False');
  assert.equal(show('3 in [1, 2, 3]'), 'True');
  assert.equal(show('"z" not in "hello"'), 'True');
  assert.equal(show('None is None'), 'True');
  // the middle operand of a chain is evaluated once
  assert.deepEqual(lines('def mid():\n    print("mid")\n    return 2\nprint(1 < mid() < 3)'), ['mid', 'True']);
});

test('float repr matches Python', () => {
  assert.equal(show('1e16'), '1e+16');
  assert.equal(show('1e15'), '1000000000000000.0');
  assert.equal(show('1e-5'), '1e-05');
  assert.equal(show('0.0001'), '0.0001');
  assert.equal(show('1 / 3'), '0.3333333333333333');
  assert.equal(show('1.1 + 2.2'), '3.3000000000000003');
  assert.equal(show('123456789.123456789'), '123456789.12345679');
  assert.equal(show('float("inf")'), 'inf');
  assert.equal(show('float("nan")'), 'nan');
  assert.equal(show('1e308 * 10'), 'inf');
  assert.equal(show('2 ** 0.5'), '1.4142135623730951');
});

test('round() uses banker’s rounding and exact decimals', () => {
  assert.equal(show('round(2.5)'), '2');
  assert.equal(show('round(3.5)'), '4');
  assert.equal(show('round(-2.5)'), '-2');
  assert.equal(show('round(2.675, 2)'), '2.67');
  assert.equal(show('round(0.125, 2)'), '0.12');
  assert.equal(show('round(3.14159, 3)'), '3.142');
  assert.equal(show('round(1234.5678, -2)'), '1200.0');
  assert.equal(show('round(1250, -2)'), '1200');
  assert.equal(show('round(7)'), '7');
  assert.equal(show('type(round(2.0))'), "<class 'int'>");
});

test('built-in number helpers', () => {
  assert.equal(show('abs(-5)'), '5');
  assert.equal(show('abs(-2.5)'), '2.5');
  assert.equal(show('min(3, 1, 2)'), '1');
  assert.equal(show('max([3, 1, 2])'), '3');
  assert.equal(show('max("apple", "pear")'), 'pear');
  assert.equal(show('sum([1, 2, 3])'), '6');
  assert.equal(show('sum([])'), '0');
  assert.equal(show('sum([0.1] * 10)'), '1.0'); // compensated summation, as in Python 3.12+
  assert.equal(show('sum(range(101))'), '5050');
  assert.equal(show('sum([1, 2], 10)'), '13');
  assert.equal(show('int("42") + int(" 7 ")'), '49');
  assert.equal(show('float("3.5") * 2'), '7.0');
  assert.equal(show('(bool(0), bool("0"), bool([]), bool([0]))'), '(False, True, False, True)');
  assert.equal(show('pow(2, 10)'), '1024');
});

/* ----------------------------------------------------------------- strings */

test('string operators, indexing and slicing', () => {
  assert.equal(show('"abc" + "def"'), 'abcdef');
  assert.equal(show('"ab" * 3'), 'ababab');
  assert.equal(show('3 * "ab"'), 'ababab');
  assert.equal(show('len("hello")'), '5');
  assert.equal(show('"hello"[0] + "hello"[-1]'), 'ho');
  assert.equal(show('"hello"[1:3]'), 'el');
  assert.equal(show('"hello"[:2] + "hello"[3:]'), 'helo');
  assert.equal(show('"hello"[::-1]'), 'olleh');
  assert.equal(show('"hello"[::2]'), 'hlo');
  assert.equal(show('"hello"[10:]'), '');
  assert.equal(show('"ell" in "hello"'), 'True');
  assert.equal(show('"5" + "5"'), '55');
  assert.equal(show('"5" * 3'), '555');
  assert.equal(show('(len("日本語"), "日本語"[1])'), "(3, '本')");
});

test('string methods', () => {
  assert.equal(show('"Hello".upper()'), 'HELLO');
  assert.equal(show('"Hello".lower()'), 'hello');
  assert.equal(show('"  hi  ".strip() + "|"'), 'hi|');
  assert.equal(show('"a,b,c".split(",")'), "['a', 'b', 'c']");
  assert.equal(show('"a b  c".split()'), "['a', 'b', 'c']");
  assert.equal(show('"a b c".split(" ", 1)'), "['a', 'b c']");
  assert.equal(show('"-".join(["a", "b", "c"])'), 'a-b-c');
  assert.equal(show('"hello".replace("l", "L")'), 'heLLo');
  assert.equal(show('"hello".replace("l", "L", 1)'), 'heLlo');
  assert.equal(show('("hello".find("l"), "hello".find("z"))'), '(2, -1)');
  assert.equal(show('("hello".startswith("he"), "hello".endswith("lo"))'), '(True, True)');
  assert.equal(show('"banana".count("a")'), '3');
  assert.equal(show('"hello world".title()'), 'Hello World');
  assert.equal(show('("42".isdigit(), "4a".isdigit())'), '(True, False)');
  assert.equal(show('sorted(["pear", "Apple", "fig"], key=str.lower)'), "['Apple', 'fig', 'pear']");
});

test('repr and str', () => {
  assert.equal(show('repr("hi")'), "'hi'");
  assert.equal(show('repr("it\'s")'), '"it\'s"');
  assert.equal(show('repr("tab\\there")'), "'tab\\there'");
  assert.equal(show('[1, 2.0, "three", None, True]'), "[1, 2.0, 'three', None, True]");
  assert.equal(show('(1,)'), '(1,)');
  assert.equal(show('()'), '()');
  assert.equal(show('{"a": 1, "b": [2]}'), "{'a': 1, 'b': [2]}");
  assert.equal(show('range(5)'), 'range(0, 5)');
  assert.equal(show('str(1.0) + str(True) + str(None)'), '1.0TrueNone');
  assert.equal(pyRepr([1, new PyFloat(2), 'x', null, true, new PyTuple([1])]), "[1, 2.0, 'x', None, True, (1,)]");
  assert.equal(pyRepr(2n ** 70n), '1180591620717411303424');
  assert.deepEqual(lines('a = [1]\na.append(a)\nprint(a)'), ['[1, [...]]']);
});

test('print: sep and end', () => {
  assert.equal(out('print(1, 2, 3)'), '1 2 3\n');
  assert.equal(out('print("a", "b", sep="-")'), 'a-b\n');
  assert.equal(out('print("a", end="")\nprint("b")'), 'ab\n');
  assert.equal(out('print()'), '\n');
  assert.equal(out('print("x", "y", sep="", end="!")'), 'xy!');
  assert.equal(out('print("a\\tb\\nc")'), 'a\tb\nc\n');
});

test('f-strings', () => {
  assert.equal(out('name = "Ada"\nage = 36\nprint(f"{name} is {age + 1}")'), 'Ada is 37\n');
  assert.equal(show('f"{3.14159:.2f}"'), '3.14');
  assert.equal(show('f"{2.5:.0f} {3.5:.0f} {0.125:.2f}"'), '2 4 0.12');
  assert.equal(show('f"{42:5}|{42:<5}|{42:^5}|{42:05}"'), '   42|42   | 42  |00042');
  assert.equal(show('f"{"hi":>6}|{"hi":*^6}"'), '    hi|**hi**');
  assert.equal(show('f"{1234567.891:,.2f} {0.25:.0%} {255:x} {5:b}"'), '1,234,567.89 25% ff 101');
  assert.equal(show('f"{{literal}} {1 + 1}"'), '{literal} 2');
  assert.equal(show('f"{"a"!r} {[1, "b"]}"'), "'a' [1, 'b']");
  assert.equal(out('x = 5\nprint(f"{x=} {x * 2 = }")'), 'x=5 x * 2 = 10\n');
  assert.equal(show('f"{1e10:g} {123456789:.3e} {1/3:.3}"'), '1e+10 1.235e+08 0.333');
  assert.equal(show('format(3.14159, ".1f")'), '3.1');
});

/* ------------------------------------------------------------------- lists */

test('lists: indexing, slicing, methods', () => {
  assert.equal(show('[1, 2, 3][0] + [1, 2, 3][-1]'), '4');
  assert.equal(show('[1, 2, 3, 4, 5][1:4]'), '[2, 3, 4]');
  assert.equal(show('[1, 2, 3][::-1]'), '[3, 2, 1]');
  assert.equal(show('[1, 2] + [3] + [0] * 2'), '[1, 2, 3, 0, 0]');
  assert.equal(show('len([1, [2, 3]])'), '2');
  assert.deepEqual(lines([
    'a = [3, 1, 2]',
    'a.append(5)', 'print(a)',
    'print(a.pop(), a)',
    'a.insert(0, 9)', 'print(a)',
    'a.remove(1)', 'print(a)',
    'print(a.index(2), a.count(9))',
    'a.sort()', 'print(a)',
    'a.reverse()', 'print(a)',
    'print(a.sort())',
    'print(sorted([3, 1, 2], reverse=True), a)',
    'a[0] = 100', 'a[-1] += 1', 'print(a)',
  ].join('\n')), ['[3, 1, 2, 5]', '5 [3, 1, 2]', '[9, 3, 1, 2]', '[9, 3, 2]', '2 1', '[2, 3, 9]', '[9, 3, 2]', 'None', '[3, 2, 1] [2, 3, 9]', '[100, 3, 10]']);
});

test('lists are references: aliasing behaves as in Python', () => {
  assert.deepEqual(lines('a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)\nprint(a is b)'), ['[1, 2, 3, 4]', 'True']);
  assert.deepEqual(lines('a = [1, 2, 3]\nb = a.copy()\nb.append(4)\nprint(a)\nprint(a is b, a == [1, 2, 3])'), ['[1, 2, 3]', 'False True']);
  assert.deepEqual(lines('a = [1, 2]\nb = a[:]\nc = list(a)\nb[0] = 9\nc[0] = 8\nprint(a)'), ['[1, 2]']);
  // += changes the list in place; a = a + [...] makes a new one
  assert.deepEqual(lines('a = [1]\nb = a\nb += [2]\nprint(a)\nb = b + [3]\nprint(a, b)'), ['[1, 2]', '[1, 2] [1, 2, 3]']);
  // a function receives the same list, not a copy
  assert.deepEqual(lines('def add_one(lst):\n    lst.append(1)\nnums = []\nadd_one(nums)\nadd_one(nums)\nprint(nums)'), ['[1, 1]']);
  assert.deepEqual(lines('grid = [[0] * 2] * 2\ngrid[0][0] = 1\nprint(grid)'), ['[[1, 0], [1, 0]]']);
  // numbers and strings are not affected by this
  assert.deepEqual(lines('x = 5\ny = x\ny += 1\nprint(x, y)'), ['5 6']);
});

test('tuples and unpacking', () => {
  assert.deepEqual(lines('a, b = 1, 2\na, b = b, a\nprint(a, b)'), ['2 1']);
  assert.deepEqual(lines('def minmax(nums):\n    return min(nums), max(nums)\nlo, hi = minmax([3, 1, 4])\nprint(lo, hi, minmax([5]))'), ['1 4 (5, 5)']);
  assert.deepEqual(lines('for i, ch in enumerate("ab"):\n    print(i, ch)'), ['0 a', '1 b']);
  assert.deepEqual(lines('t = (1, 2, 3)\nprint(t[0], t[-1], t[1:], len(t), 2 in t)'), ['1 3 (2, 3) 3 True']);
  assert.deepEqual(lines('a = b = 0\nprint(a, b)'), ['0 0']);
});

test('dicts', () => {
  assert.deepEqual(lines([
    'd = {"a": 1, "b": 2}',
    'd["c"] = 3', 'd["a"] += 10',
    'print(d, len(d), "a" in d, "z" in d)',
    'print(d.get("z"), d.get("z", 0), d["b"])',
    'for k in d:', '    print(k, d[k])',
    'print(list(d.keys()), list(d.values()), list(d.items()))',
    'print(d.keys())',
    'for k, v in d.items():', '    print(k, v, end=";")',
  ].join('\n')), ["{'a': 11, 'b': 2, 'c': 3} 3 True False", 'None 0 2', 'a 11', 'b 2', 'c 3', "['a', 'b', 'c'] [11, 2, 3] [('a', 11), ('b', 2), ('c', 3)]", "dict_keys(['a', 'b', 'c'])", 'a 11;b 2;c 3;']);
  assert.deepEqual(lines('counts = {}\nfor ch in "banana":\n    counts[ch] = counts.get(ch, 0) + 1\nprint(counts)'), ["{'b': 1, 'a': 3, 'n': 2}"]);
  assert.equal(show('{1: "a", 1.0: "b", True: "c"}'), "{1: 'c'}"); // 1, 1.0 and True are the same key
});

/* ------------------------------------------------------------ control flow */

test('if / elif / else runs exactly one branch', () => {
  const grade = (s) => out(`score = ${s}\nif score >= 90:\n    print("A")\nelif score >= 70:\n    print("B")\nelif score >= 50:\n    print("C")\nelse:\n    print("D")`).trim();
  assert.deepEqual([95, 75, 70, 55, 10].map(grade), ['A', 'B', 'B', 'C', 'D']);
  assert.equal(out('temp = 15\nif temp > 20:\n    print("T-shirt")\nprint("Go outside")'), 'Go outside\n');
  assert.equal(out('x = 3\nif x > 1 and not x == 4 or False:\n    print("yes")'), 'yes\n');
});

test('while, for, range, break, continue', () => {
  assert.deepEqual(lines('n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1\nprint("Lift off!")'), ['3', '2', '1', 'Lift off!']);
  assert.equal(show('list(range(5))'), '[0, 1, 2, 3, 4]');
  assert.equal(show('list(range(1, 5))'), '[1, 2, 3, 4]');
  assert.equal(show('list(range(0, 10, 3))'), '[0, 3, 6, 9]');
  assert.equal(show('list(range(5, 0, -2))'), '[5, 3, 1]');
  assert.equal(show('(list(range(3, 3)), len(range(10)))'), '([], 10)');
  assert.deepEqual(lines('total = 0\nfor n in range(1, 5):\n    total = total + n\nprint(total)'), ['10']);
  assert.deepEqual(lines('for i in range(6):\n    if i == 1:\n        continue\n    if i == 4:\n        break\n    print(i)\nprint("end", i)'), ['0', '2', '3', 'end 4']);
  assert.deepEqual(lines('for ch in "ab":\n    for n in [1, 2]:\n        print(ch, n)'), ['a 1', 'a 2', 'b 1', 'b 2']);
  assert.deepEqual(lines('count = 0\nfor letter in "banana":\n    if letter == "a":\n        count = count + 1\nprint(count)'), ['3']);
  // a list changed while looping over it: the loop sees the changes, as in Python
  assert.deepEqual(lines('a = [1, 2, 3, 4]\nfor x in a:\n    if x % 2 == 0:\n        a.remove(x)\nprint(a)'), ['[1, 3]']);
});

/* --------------------------------------------------------------- functions */

test('def, parameters, defaults, keyword arguments', () => {
  assert.deepEqual(lines('def area(w, h=2):\n    return w * h\nprint(area(3), area(3, 4), area(h=5, w=2))'), ['6 12 10']);
  assert.deepEqual(lines('def greet():\n    print("Hello!")\nprint("Start")\ngreet()\ngreet()'), ['Start', 'Hello!', 'Hello!']);
  // default values are created once (the classic mutable-default surprise)
  assert.deepEqual(lines('def f(a, b=[]):\n    b.append(a)\n    return b\nprint(f(1), f(2))'), ['[1, 2] [1, 2]']);
  assert.deepEqual(lines('def apply(f, x):\n    return f(x)\ndef double(n):\n    return n * 2\nprint(apply(double, 4), apply(len, "abc"))'), ['8 3']);
});

test('return versus print', () => {
  assert.deepEqual(lines('def add(a, b):\n    print(a + b)\nresult = add(2, 3)\nprint(result)'), ['5', 'None']);
  assert.deepEqual(lines('def add(a, b):\n    return a + b\nprint(add(2, 3) * 2)'), ['10']);
  assert.deepEqual(lines('def early(x):\n    if x:\n        return "yes"\n    print("still here")\nprint(early(1))\nprint(early(0))'), ['yes', 'still here', 'None']);
});

test('recursion', () => {
  assert.deepEqual(lines('def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\nprint(fact(5), fact(20))'), ['120 2432902008176640000']);
  assert.deepEqual(lines('def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\nprint(fib(15))'), ['610']);
  assert.deepEqual(lines('def depth(n):\n    return 0 if n == 0 else 1 + depth(n - 1)\nprint(depth(150))'), ['150']);
});

test('scoping: locals versus globals', () => {
  assert.deepEqual(lines('x = 10\ndef show():\n    print(x)\nshow()'), ['10']);
  assert.deepEqual(lines('x = 10\ndef shadow():\n    x = 5\n    print(x)\nshadow()\nprint(x)'), ['5', '10']);
  assert.deepEqual(lines('def birthday(age):\n    age = age + 1\n    return age\nage = 10\nbirthday(age)\nprint(age)'), ['10']);
  assert.deepEqual(lines('count = 0\ndef bump():\n    global count\n    count += 1\nbump()\nbump()\nprint(count)'), ['2']);
  assert.deepEqual(lines('def make(n):\n    def add(m):\n        return n + m\n    return add\nprint(make(5)(1))'), ['6']);
  fails('def f():\n    y = 1\nf()\nprint(y)', 'NameError', "name 'y' is not defined", 4);
  fails('x = 10\ndef f():\n    x += 1\nf()', 'UnboundLocalError', "cannot access local variable 'x' where it is not associated with a value", 3);
});

/* ------------------------------------------------------------------ errors */

test('SyntaxError: messages and line numbers', () => {
  fails('x = 1\nif x > 5\n    print(x)', 'SyntaxError', "expected ':'", 2);
  fails('if x = 5:\n    pass', 'SyntaxError', "invalid syntax. Maybe you meant '==' or ':=' instead of '='?", 1);
  fails('x = 1\nprint("a"\ny = 2', 'SyntaxError', "'(' was never closed", 2);
  fails('x = "abc', 'SyntaxError', 'unterminated string literal (detected at line 1)', 1);
  fails('print "hello"', 'SyntaxError', "Missing parentheses in call to 'print'. Did you mean print(...)?", 1);
  fails('x = 1\ny = x +', 'SyntaxError', 'invalid syntax', 2);
  fails('5 = x', 'SyntaxError', "cannot assign to literal here. Maybe you meant '==' instead of '='?", 1);
  fails('print(1 2)', 'SyntaxError', 'invalid syntax. Perhaps you forgot a comma?', 1);
  fails('x = 5)', 'SyntaxError', "unmatched ')'", 1);
  fails('return 5', 'SyntaxError', "'return' outside function", 1);
  fails('x = 1\nbreak', 'SyntaxError', "'break' outside loop", 2);
  fails('x = “hi”', 'SyntaxError', "invalid character '“' (U+201C)", 1);
  fails('if True:\n    pass\nelse if False:\n    pass', 'SyntaxError', "expected ':'", 3);
  fails('x = 2x', 'SyntaxError', 'invalid decimal literal', 1);
  assert.equal(err('x = 1\nif x > 5\n    print(x)').phase, 'syntax');
  // nothing runs when the program cannot be read
  assert.equal(run('print("before")\nx = = 1').stdout, '');
});

test('IndentationError', () => {
  fails('if True:\nprint(1)', 'IndentationError', "expected an indented block after 'if' statement on line 1", 2);
  fails('x = 1\n    y = 2', 'IndentationError', 'unexpected indent', 2);
  fails('if True:\n    x = 1\n  y = 2', 'IndentationError', 'unindent does not match any outer indentation level', 3);
  fails('def f():\nreturn 1', 'IndentationError', 'expected an indented block after function definition on line 1', 2);
  fails('for i in range(3):\nprint(i)', 'IndentationError', "expected an indented block after 'for' statement on line 1", 2);
});

test('NameError, with a spelling suggestion', () => {
  const e = fails('total = 0\nfor n in [1, 2]:\n    total = total + n\nprint(totl)', 'NameError', "name 'totl' is not defined", 4);
  assert.equal(e.suggestion, 'total');
  assert.equal(err('Print("hi")').suggestion, 'print');
  assert.equal(err('x = true').suggestion, 'True');
  assert.equal(err('prnt("hi")').suggestion, 'print');
  assert.equal(err('x = 1\nprint(x + y)').suggestion, undefined);
  assert.match(err('print(hello)').hint, /put it in quotes/);
});

test('TypeError', () => {
  fails('age = 12\nprint("Age: " + age)', 'TypeError', 'can only concatenate str (not "int") to str', 2);
  fails('x = 5 + "5"', 'TypeError', "unsupported operand type(s) for +: 'int' and 'str'", 1);
  fails('x = 5\nx()', 'TypeError', "'int' object is not callable", 2);
  fails('for i in 5:\n    pass', 'TypeError', "'int' object is not iterable", 1);
  fails('def area(w, h):\n    return w * h\n\nprint(area(3))', 'TypeError', "area() missing 1 required positional argument: 'h'", 4);
  fails('def f(a):\n    return a\nf(1, 2)', 'TypeError', 'f() takes 1 positional argument but 2 were given', 3);
  fails('print(1 < "a")', 'TypeError', "'<' not supported between instances of 'int' and 'str'", 1);
  fails('print(len(5))', 'TypeError', "object of type 'int' has no len()", 1);
  fails('s = "abc"\ns[0] = "x"', 'TypeError', "'str' object does not support item assignment", 2);
  // the classic print-instead-of-return failure
  const e = fails('def add(a, b):\n    print(a + b)\nresult = add(2, 3) + 1', 'TypeError', "unsupported operand type(s) for +: 'NoneType' and 'int'", 3);
  assert.match(e.hint, /return/);
  // shadowing a built-in
  fails('sum = 0\nprint(sum([1, 2]))', 'TypeError', "'int' object is not callable", 2);
});

test('ValueError, ZeroDivisionError, IndexError, KeyError, AttributeError', () => {
  fails('x = int("twelve")', 'ValueError', "invalid literal for int() with base 10: 'twelve'", 1);
  fails('a = [1, 2]\na.remove(5)', 'ValueError', 'list.remove(x): x not in list', 2);
  fails('a, b = [1, 2, 3]', 'ValueError', 'too many values to unpack (expected 2)', 1);
  fails('n = 0\nprint(10 / n)', 'ZeroDivisionError', 'division by zero', 2);
  fails('print(10 % 0)', 'ZeroDivisionError', 'integer modulo by zero', 1);
  fails('nums = [1, 2, 3]\nprint(nums[3])', 'IndexError', 'list index out of range', 2);
  fails('print("abc"[5])', 'IndexError', 'string index out of range', 1);
  fails('a = []\na.pop()', 'IndexError', 'pop from empty list', 2);
  fails('d = {"a": 1}\nprint(d["b"])', 'KeyError', "'b'", 2);
  const e = fails('a = [1, 2, 3]\na.push(4)', 'AttributeError', "'list' object has no attribute 'push'", 2);
  assert.equal(e.suggestion, 'append');
  assert.equal(err('print("abc".uper())').suggestion, 'upper');
});

test('errors inside functions report the innermost line and the call stack', () => {
  const e = fails('def f(n):\n    return 10 / n\n\ndef g():\n    return f(0)\n\nprint("start")\ng()', 'ZeroDivisionError', 'division by zero', 2);
  assert.deepEqual(e.stack, [{ name: 'g', line: 8 }, { name: 'f', line: 5 }]);
  assert.equal(run('def f(n):\n    return 10 / n\n\nprint("start")\nf(0)').stdout, 'start\n');
  // after a call returns, errors are reported on the caller's line again
  fails('def f():\n    return 1\nx = f() + "a"', 'TypeError', null, 3);
  // multi-line expressions report the line of the failing part
  fails('print("a",\n      undefined_name,\n      "b")', 'NameError', null, 2);
});

test('RecursionError', () => {
  const e = fails('def f(n):\n    return f(n + 1)\nf(0)', 'RecursionError', 'maximum recursion depth exceeded', 2);
  assert.match(e.hint, /calling itself/);
  assert.equal(run('def f(n):\n    return f(n + 1)\nf(0)', { maxDepth: 50 }).error.type, 'RecursionError');
});

test('the step budget stops runaway programs', () => {
  const e = fails('while True:\n    pass', 'TimeoutError', 'Your program ran for too long — is there a loop that never ends?');
  assert.ok(e.hint.length > 20);
  const r = run('n = 1\nwhile n < 5:\n    print(n)', { maxSteps: 5000 });
  assert.equal(r.error.type, 'TimeoutError');
  assert.ok(r.stdout.startsWith('1\n1\n1\n'));
  assert.ok(r.steps > 5000 && r.steps < 5100);
  assert.equal(run('x = sum(range(10 ** 9))').error.type, 'TimeoutError');
  assert.equal(run('x = list(range(10 ** 12))').error.type, 'TimeoutError');
  assert.equal(run('while True:\n    print("spam" * 100)').error.type, 'TimeoutError');
  assert.equal(run('x = "a" * 10 ** 9').error.type, 'MemoryError');
  assert.equal(run('x = 10 ** 10 ** 10').error.type, 'OverflowError');
  assert.ok(DEFAULT_STEPS >= 200000);
  // a legitimate long loop fits in the default budget
  assert.equal(out('t = 0\nfor i in range(20000):\n    t += i\nprint(t)'), '199990000\n');
});

test('every error type has a plain-English hint', () => {
  for (const type of ['SyntaxError', 'IndentationError', 'NameError', 'TypeError', 'ValueError', 'ZeroDivisionError', 'IndexError', 'KeyError', 'RecursionError', 'AttributeError', 'UnboundLocalError', 'TimeoutError', 'NotSupportedError']) {
    assert.ok(ERROR_HINTS[type] && ERROR_HINTS[type].length > 30, type);
  }
  assert.match(err('if x = 5:\n    pass').hint, /==/);
  assert.match(err('x = 1\nif x > 5\n    print(x)').hint, /colon/);
  assert.match(err('print("Age: " + 12)').hint, /str\(/);
  assert.match(err('if True:\nprint(1)').hint, /4 spaces/);
  assert.match(err('x = 5\nif x > 3 && x < 9:\n    pass').hint, /and/);
  assert.match(err('x = 2 ^ 3').hint, /\*\*/);
  assert.match(err('print(y)\ny = 2').hint, /line 2/);
});

test('features outside the subset fail clearly, not mysteriously', () => {
  for (const src of ['import math', 'class A:\n    pass', 'try:\n    pass\nexcept:\n    pass', 'x = lambda a: a', 'x = [i for i in range(3)]', 'x = {1, 2}', 'name = input("?")', 'def f(*args):\n    pass']) {
    const e = err(src);
    assert.equal(e.type, 'NotSupportedError', src);
    assert.match(e.message, /not available/);
  }
});

test('nothing outside the interpreter is reachable', () => {
  for (const name of ['eval', 'exec', 'open', '__import__', 'globals', 'window', 'process', 'constructor', '__proto__']) {
    assert.equal(err(`print(${name})`).type, 'NameError', name);
  }
  assert.equal(err('print("a".constructor)').type, 'AttributeError');
  // real Python has dunder attributes, so the message says "not available" instead of "no attribute"
  assert.equal(err('print([].__class__)').type, 'NotSupportedError');
  assert.equal(err('print(type(42).__name__)').type, 'NotSupportedError');
  assert.equal(err('print([].nope)').type, 'AttributeError');
  const r = run('__proto__ = 5\nconstructor = 6\nprint(__proto__ + constructor)');
  assert.equal(r.stdout, '11\n');
  assert.equal(Object.getPrototypeOf(r.globals), Object.prototype);
  assert.equal(Object.getOwnPropertyDescriptor(r.globals, '__proto__').value, 5);
});

/* --------------------------------------------------------------------- API */

test('run() result: globals, reprs, types', () => {
  const r = run('x = 3\ny = 2.5\nname = "Ada"\nok = True\nnothing = None\nnums = [1, (2, 3)]\nd = {"k": 1}\ndef f():\n    pass\nbig = 2 ** 70');
  assert.equal(r.ok, true);
  assert.equal(r.error, null);
  assert.deepEqual(r.globals, { x: 3, y: 2.5, name: 'Ada', ok: true, nothing: null, nums: [1, [2, 3]], d: { k: 1 }, big: 2n ** 70n });
  assert.equal(r.reprs.name, "'Ada'");
  assert.equal(r.reprs.nums, '[1, (2, 3)]');
  assert.equal(r.reprs.f, '<function f>');
  assert.equal(r.types.y, 'float');
  assert.deepEqual(r.functions, ['f']);
  assert.ok(r.steps > 0);
  // output printed before an error is kept, and so are the variables
  const bad = run('a = 1\nprint("one")\nb = a / 0\nprint("two")');
  assert.equal(bad.stdout, 'one\n');
  assert.deepEqual(bad.globals, { a: 1 });
  assert.equal(bad.error.phase, 'runtime');
});

test('result.call() evaluates expressions in the final environment', () => {
  const r = run('def area(w, h):\n    return w * h\n\ndef shout(s):\n    print(s.upper())\n\nscale = 2');
  assert.deepEqual(r.call('area(3, 4)'), { ok: true, value: 12, repr: '12', type: 'int', stdout: '', error: null });
  assert.equal(r.call('area(2, 2.5)').repr, '5.0');
  assert.equal(r.call('area(3, 4) * scale').value, 24);
  assert.equal(r.call('scale').value, 2);
  const printed = r.call('shout("hi")');
  assert.equal(printed.value, null);
  assert.equal(printed.stdout, 'HI\n');
  assert.equal(r.stdout, ''); // the program's own output is untouched
  const missing = r.call('volume(1)');
  assert.equal(missing.error.type, 'NameError');
  const wrongArgs = r.call('area(1)');
  assert.equal(wrongArgs.error.type, 'TypeError');
  assert.equal(r.call('area(').error.type, 'SyntaxError');
  assert.equal(r.call('area(1, 2)').value, 2); // still usable after errors
  // each call gets its own step budget
  const loop = run('def spin():\n    while True:\n        pass');
  assert.equal(loop.call('spin()', { maxSteps: 2000 }).error.type, 'TimeoutError');
});

test('inputs replace the first top-level assignment of a name', () => {
  const src = 'score = 62\nif score >= 50:\n    print("Pass")\nelse:\n    print("Fail")';
  assert.equal(run(src).stdout, 'Pass\n');
  assert.equal(run(src, { inputs: { score: 30 } }).stdout, 'Fail\n');
  assert.equal(run(src, { inputs: { score: 50 } }).stdout, 'Pass\n');
  // later assignments work normally; lists and strings can be passed too
  assert.equal(run('n = 1\nn = n + 1\nprint(n)', { inputs: { n: 10 } }).stdout, '11\n');
  assert.equal(run('temps = [1]\nname = "x"\nprint(len(temps), name)', { inputs: { temps: [3, -2, 0], name: 'Bo' } }).stdout, '3 Bo\n');
  assert.equal(run('x = 1\nprint(x / 2)', { inputs: { x: 5 } }).stdout, '2.5\n');
});

test('trace: one entry per executed line, before it runs', () => {
  const r = run('total = 0\nfor n in [1, 2, 3]:\n    total = total + n\nprint(total)', { trace: true });
  assert.deepEqual(r.trace.map((e) => e.line), [1, 2, 3, 2, 3, 2, 3, 2, 4, 0]);
  assert.deepEqual(r.trace.map((e) => e.event), ['line', 'line', 'line', 'line', 'line', 'line', 'line', 'line', 'line', 'end']);
  assert.deepEqual(r.trace[0].vars, {});
  assert.deepEqual(r.trace[2].vars, { total: '0', n: '1' });
  assert.deepEqual(r.trace[4].vars, { total: '1', n: '2' });
  assert.deepEqual(r.trace[8].vars, { total: '6', n: '3' });
  assert.equal(r.trace[8].stdout, '');
  assert.equal(r.trace[9].stdout, '6\n');
  assert.equal(r.traceTruncated, false);
  assert.equal(run('x = 1').trace, undefined);
});

test('trace: branches, function calls and returns', () => {
  const branch = run('age = 12\nif age >= 13:\n    print("Teen")\nelif age >= 5:\n    print("Child")\nelse:\n    print("Baby")\nprint("Done")', { trace: true });
  assert.deepEqual(branch.trace.map((e) => e.line), [1, 2, 4, 5, 8, 0]);

  const r = run('def double(n):\n    return n * 2\n\nx = double(4)\nprint(x)', { trace: true });
  assert.deepEqual(r.trace.map((e) => `${e.event}:${e.line}`), ['line:1', 'line:4', 'call:1', 'line:2', 'return:2', 'line:5', 'end:0']);
  const call = r.trace[2];
  assert.equal(call.func, 'double');
  assert.equal(call.depth, 1);
  assert.deepEqual(call.vars, { n: '4' });
  assert.deepEqual(call.callers, [4]);
  assert.deepEqual(call.globals, { double: '<function double>' });
  assert.equal(r.trace[4].value, '8');
  assert.deepEqual(r.trace[5].vars, { double: '<function double>', x: '8' });

  // locals and globals with the same name are shown separately
  const s = run('def birthday(age):\n    age = age + 1\n    return age\n\nage = 10\nbirthday(age)\nprint(age)', { trace: true });
  const inside = s.trace.find((e) => e.event === 'return');
  assert.deepEqual(inside.vars, { age: '11' });
  assert.equal(inside.globals.age, '10');
});

test('trace: aliasing is visible through object ids; errors end the trace', () => {
  const r = run('a = [1, 2, 3]\nb = a\nb.append(4)\nc = a.copy()\nprint(a)', { trace: true });
  const last = r.trace[r.trace.length - 1];
  assert.equal(last.ids.a, last.ids.b);
  assert.notEqual(last.ids.a, last.ids.c);
  assert.deepEqual(last.vars, { a: '[1, 2, 3, 4]', b: '[1, 2, 3, 4]', c: '[1, 2, 3, 4]' });

  const bad = run('x = 1\nprint(x + y)\nprint("never")', { trace: true });
  assert.deepEqual(bad.trace.map((e) => `${e.event}:${e.line}`), ['line:1', 'line:2', 'error:2']);

  const capped = run('i = 0\nwhile i < 5000:\n    i += 1', { trace: true, maxTrace: 100 });
  assert.equal(capped.trace.length, 100);
  assert.equal(capped.traceTruncated, true);
  assert.equal(capped.globals.i, 5000); // the program still runs to the end
});

test('syntaxError(), parse() and codeOnly()', () => {
  assert.equal(syntaxError('x = 1\nprint(x)'), null);
  assert.equal(syntaxError('x = 1\nprint(x').line, 2);
  assert.equal(parse('x = 1').body[0].type, 'Assign');
  assert.throws(() => parse('x ='), /invalid syntax/);
  assert.equal(codeOnly('x = "for"  # a for loop\nfor i in y:'), `x = "   "${' '.repeat(14)}\nfor i in y:`);
  assert.ok(!/\bsum\b/.test(codeOnly("print('sum(x)')  # sum")));
});

test('toPy / toJS round-trip plain values', () => {
  assert.deepEqual(toJS(toPy({ a: [1, 2.5, 'x', null, true], b: { c: 1 } })), { a: [1, 2.5, 'x', null, true], b: { c: 1 } });
  assert.ok(toPy(2.5) instanceof PyFloat);
  assert.equal(toPy(3), 3);
});

/* ----------------------------------------- agreement with real Python (if any) */

const CORPUS = [
  'print(1 + 2 * 3, 2 ** 3 ** 2, -7 // 2, -7 % 3, 7 / 2, 0.1 + 0.2, 1e16, 1e-5, 2 ** 100)',
  'print(round(2.5), round(3.5), round(2.675, 2), sum([0.1] * 10), 10 ** 30 // 7, float(2 ** 60))',
  'print([1, 2.0, "x", None, True], (1,), {"a": [1]}, repr("it\'s"), range(3), str(1.0))',
  'print("a,b".split(","), " x ".strip(), "abc"[::-1], "hello".replace("l", "L", 1), "a b  c".split(), "-".join("abc"))',
  'x = 3.14159\nn = 42\ns = "hi"\nprint(f"{x:.2f}|{x:10.3f}|{x:e}|{x:g}|{n:5}|{n:<5}|{n:05}|{n:,}|{n:x}|{s:>5}|{s!r}|{n=}|{x:.0%}")',
  'a = [3, 1, 2]\nb = a\nb.sort()\nb.append(9)\nprint(a, a.pop(0), a[::-1], sorted(a, reverse=True), a.index(9), 2 in a)',
  'd = {"b": 1}\nd["a"] = 2\nfor k, v in d.items():\n    print(k, v)\nprint(d, list(d), d.get("z", 0), sorted(d), len(d))',
  'def fact(n):\n    return 1 if n <= 1 else n * fact(n - 1)\nprint(fact(30))\ndef f(a, b=2, c=3):\n    return a, b, c\nprint(f(1), f(1, c=5), f(b=0, a=9))',
  'for i in range(10, 0, -3):\n    print(i, end=" ")\nprint()\nn = 0\nwhile True:\n    n += 1\n    if n % 2:\n        continue\n    if n > 6:\n        break\n    print(n)',
  'x = 10\ndef f():\n    x = 5\n    return x\ndef g():\n    global x\n    x = 99\nprint(f(), x)\ng()\nprint(x)',
  'print(1 / 0)', 'print(undefined)', 'x = [1, 2]\nprint(x[2])', 'print("a" + 1)', 'print(int("x"))', 'd = {}\nprint(d["k"])',
  'if True:\nprint(1)', 'x = (1 +\ny = 2', 'def f(a):\n    pass\nf()', 'x = 5\nx.append(1)', 'a, b = 1, 2, 3', 'print("abc" < 3)',
];

test('agrees with CPython on a sample corpus (skipped when python3 is missing)', (t) => {
  const probe = spawnSync('python3', ['-c', 'import sys; print(sys.version_info[:2] >= (3, 12))'], { encoding: 'utf8' });
  if (probe.status !== 0 || probe.stdout.trim() !== 'True') { t.skip('python3 >= 3.12 not available'); return; }
  const harness = `
import sys, json, io, contextlib
out = []
for src in json.load(sys.stdin):
    buf = io.StringIO(); res = {'error': None}
    try:
        code = compile(src, '<t>', 'exec')
        with contextlib.redirect_stdout(buf):
            exec(code, {})
    except SyntaxError as e:
        res['error'] = [type(e).__name__, e.msg, e.lineno]
    except BaseException as e:
        tb = e.__traceback__; line = None
        while tb:
            if tb.tb_frame.f_code.co_filename == '<t>': line = tb.tb_lineno
            tb = tb.tb_next
        res['error'] = [type(e).__name__, str(e), line]
    res['stdout'] = buf.getvalue()
    out.append(res)
json.dump(out, sys.stdout)`;
  const py = spawnSync('python3', ['-c', harness], { input: JSON.stringify(CORPUS), encoding: 'utf8' });
  assert.equal(py.status, 0, py.stderr);
  const expected = JSON.parse(py.stdout);
  CORPUS.forEach((src, i) => {
    const r = run(src);
    assert.equal(r.stdout, expected[i].stdout, src);
    const mine = r.error ? [r.error.type, r.error.message, r.error.line] : null;
    // CPython words a few messages differently from one release to the next: 3.14 says
    // "too many values to unpack (expected 2, got 3)" where 3.12 and 3.13 stop at "(expected 2)".
    const theirs = expected[i].error && [expected[i].error[0], String(expected[i].error[1]).replace(/ \(expected (\d+), got \d+\)$/, ' (expected $1)'), expected[i].error[2]];
    assert.deepEqual(mine, theirs, src);
  });
});

// Values that contain or share themselves are small in memory but have an
// astronomical number of paths through them. Nothing may hang on them.
test('self-containing and heavily shared values never hang or exhaust memory', () => {
  const quick = (src, opts = {}) => {
    const started = Date.now();
    const res = run(src, { maxSteps: 200000, ...opts });
    assert.ok(Date.now() - started < 3000, `took too long: ${src}`);
    return res;
  };

  // a list holding fifty references to itself
  let res = quick('l = []\nfor i in range(50):\n    l.append(l)\nprint(len(l))');
  assert.equal(res.ok, true);
  assert.equal(res.stdout, '50\n');
  assert.ok(Array.isArray(res.globals.l));

  res = quick('a = [1]\na.append(a)\na.append(a)\nprint(a)');
  assert.equal(res.stdout, '[1, [...], [...]]\n');

  // forty levels of sharing: 41 objects, 2^40 paths
  const shared = 'a = [1]\nfor i in range(40):\n    a = [a, a]\n';
  res = quick(`${shared}print(len(a))`);
  assert.equal(res.stdout, '2\n');
  assert.ok(res.reprs.a.length < 2000000);

  res = quick(`${shared}print(a == a)`);
  assert.equal(res.stdout, 'True\n');

  // printing it is cut short rather than attempted in full
  res = quick(`${shared}print(a)`);
  assert.ok(!res.ok || res.stdout.includes('...'));

  // comparing two separately built copies would take 2^40 steps: a clean timeout instead
  res = quick(`${shared}b = [1]\nfor i in range(40):\n    b = [b, b]\nprint(a == b)`);
  assert.equal(res.ok, false);
  assert.equal(res.error.type, 'TimeoutError');

  // the same for hashing and ordering
  res = quick('t = (1,)\nfor i in range(40):\n    t = (t, t)\nd = {}\nd[t] = 1');
  assert.equal(res.error.type, 'TimeoutError');
  res = quick(`${shared}b = [1]\nfor i in range(40):\n    b = [b, b]\nprint(a < b)`);
  assert.equal(res.error.type, 'TimeoutError');

  // tracing takes a snapshot on every line and must stay quick as well
  res = quick(`${shared}x = 1\ny = 2`, { trace: true });
  assert.equal(res.ok, true);
  assert.ok(res.trace.length > 3);

  // ordinary programs are unaffected, and the budget does not leak between runs
  res = quick('a = [[1, 2], [3, 4]]\nb = [[1, 2], [3, 4]]\nprint(a == b, a < [[1, 2], [3, 5]], (1, 2) in {(1, 2): "x"})');
  assert.equal(res.stdout, 'True True True\n');
  assert.deepEqual(res.globals.a, [[1, 2], [3, 4]]);
});

test('assert: passes silently, stops with AssertionError (and the message) when the condition is false', () => {
  assert.equal(run('assert 1 + 1 == 2\nprint("ok")').stdout, 'ok\n');
  let r = run('x = 2\nassert x > 5');
  assert.equal(r.error.type, 'AssertionError');
  assert.equal(r.error.text, 'AssertionError');           // as in Python: no colon when there is no message
  assert.equal(r.error.line, 2);
  r = run('def f(n):\n    return n * 2\nassert f(3) == 7, "f(3) should be 6"');
  assert.equal(r.error.text, 'AssertionError: f(3) should be 6');
  assert.equal(run('assert [], [1, 2]').error.text, 'AssertionError: [1, 2]');
  assert.equal(run('assert "non-empty"\nassert 0.5\nprint(1)').stdout, '1\n');
});
