# Code steps and the mini-Python interpreter

Learntopia can run real programs in the browser. Learners read code, predict what
it does, step through it line by line, and write their own. Nothing is sent
anywhere: programs run in an interpreter that is part of the site.

This page covers the three building blocks:

| Building block | Use it for |
|----------------|------------|
| the `code` step type | "write (or fix) a program", checked automatically |
| the `py-trace` widget | stepping through a program and watching the variables |
| the `py-run` widget | free play: edit, run, see the output |

The Python course in `content/courses/python` uses all three and is the best
place to copy from.

## The `code` step

```js
{
  id: 'area-function',
  type: 'code',
  text: 'Write a function `area(w, h)` that **returns** the area of a rectangle.',
  starter: 'def area(w, h):\n    ',
  solution: 'def area(w, h):\n    return w * h',
  tests: [
    { call: 'area(3, 4)', expect: 12 },
    { call: 'area(1, 2.5)', expect: 2.5 },
  ],
  hints: ['Multiply the two parameters.', 'Use `return`, not `print`.'],
  explain: 'A function hands a value back with `return`.',
}
```

The learner gets an editor, a **Run** button (shows the output, costs
nothing) and **Check** (grades it). A program that cannot be read at all, such
as one with a missing colon, is reported without using up an attempt.

### Fields

| Field | Meaning |
|-------|---------|
| `solution` | **Required.** A program that passes. Shown when the learner gives up, and run by the validator to prove the step is solvable. |
| `starter` | Text the editor starts with. Leave gaps for the learner to fill. |
| `expect` | The exact text the program should print. Spaces at the ends of lines and blank lines at the end are ignored. |
| `tests` | A list of checks (see below). Shown to the learner as "what the check looks for". |
| `hidden` | More checks of the same shape. If one fails, the feedback stays general, so the answer cannot be reverse-engineered from the message. |
| `require`, `forbid` | Things the code must or must not contain: a word (`'for'`), a regular expression, or `{ pattern, message }`. Arrays are allowed. Comments and the contents of strings are ignored when matching. |
| `wrong` | Targeted feedback for particular wrong outputs: `[['10', 'That adds the numbers. The task is to multiply them.']]`. |
| `feedback` | A function `({ stdout, source, result, check }) => 'message' or null` for feedback you cannot express any other way. |
| `rows` | Minimum height of the editor in lines. |
| `showGoal` | `false` hides the "what the check looks for" panel. |
| `maxSteps` | Step budget for one run, if a task needs more (or less) than the default million. |

A code step needs `expect` or `tests`. All the common fields (`title`,
`hints`, `explain`, `review`, `stretch`, …) work as in every other step.

### Tests

Each entry of `tests` (and `hidden`) is one of these:

```js
{ call: 'area(3, 4)', expect: 12 }              // the value of an expression
{ call: 'area(1, 2.5)', repr: '2.5' }           // its exact Python repr (tells 2 from 2.0)
{ call: 'greet("Ada")', stdout: 'Hello, Ada' }  // what a call prints
{ stdout: 'Pass', set: { score: 60 } }          // run the program again with score = 60
{ call: 'total', expect: 6, set: { n: 3 } }     // ...or inspect a variable after that run
```

- `call` is any expression, evaluated after the program has run. Use a
  function call to test a function, or a bare name to look at a variable.
- `expect` compares by value. Whole numbers must match exactly, other numbers
  to nine significant digits. Lists and tuples compare element by element.
- `set` replaces values in the program: the first top-level assignment to
  that name stores your value instead of the one written in the code. That is
  how you test a program that has no functions yet with several inputs.
- Any test may carry its own `message`, shown when it fails, and a `label`.

Without a custom message the learner is told which test failed, what was
expected and what happened. Common slips get a specific explanation, for
example printing a result where it should have been returned.

### Checking a code step

`node tools/validate.mjs` runs every code step: the `solution` must pass
every test and every `require` / `forbid` rule, the `starter` must **not**
already pass, and no entry of `wrong` may list the correct output. The same
grading code runs in
the browser and in the validator (`src/lang/check-code-step.js`).

## The `py-trace` widget

A "be the computer" stepper. The program runs once, with tracing on, and the
learner moves through the recording: which line runs next, what each variable
holds, what has been printed.

```js
{
  type: 'interact',
  text: 'Step through the loop. Watch `total`.',
  widget: {
    type: 'py-trace',
    code: 'total = 0\nfor n in [1, 2, 3]:\n    total = total + n\nprint(total)',
  },
  check: (s) => s.done || 'Keep stepping until the program ends.',
  solution: { done: true },
}
```

| Option | Meaning |
|--------|---------|
| `code` | The program. Keep it short: recording stops after 400 steps. |
| `ask: 'next'` | Instead of pressing Step, the learner taps the line they think runs next. |
| `autoplay` | Show a Play button (default `true`, never in ask mode). |
| `speed` | Milliseconds per step while playing. |
| `start` | The step to show first. |
| `output` | `false` hides the output box. |

State: `{ step, steps, done, atEnd, line, misses }`. `done` becomes true once
the end has been reached; `misses` counts wrong taps in ask mode.

It also works as a plain `figure` (not graded) on any step type.

## The `py-run` widget

An editor with a Run button and an output panel, for experiments.

```js
{
  type: 'interact',
  text: 'Make the program print `cherry`.',
  widget: { type: 'py-run', code: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[0])' },
  check: (s) => s.stdout.trim() === 'cherry' || 'Not `cherry` yet. Count positions from 0.',
  solution: { code: 'fruits = ["apple", "banana", "cherry"]\nprint(fruits[2])' },
}
```

Options: `code`, `rows`, `autorun` (run once straight away), `label`.
State: `{ code, runs, ok, stdout, error, edited }`, where `error` is the type
of the error that stopped the last run (`'NameError'`, …) or `null`.

## The language

`src/lang/minipy.js` is an interpreter for a teaching subset of Python 3,
written in plain JavaScript. For everything it supports it behaves like real
Python, including the details learners trip over: exact whole numbers of any
size, `/` versus `//`, floating-point results such as `0.1 + 0.2`,
short-circuit `and` / `or`, chained comparisons, negative indexes and slices.

| | Supported |
|--|-----------|
| Values | `int`, `float`, `bool`, `None`, `str`, `list`, `tuple`, `dict`, `range` |
| Operators | `+ - * / // % **`, comparisons (also chained), `and or not`, `in`, `is`, `x if c else y` |
| Statements | assignment (chained, augmented, by index, tuple unpacking), `if / elif / else`, `while`, `for … in`, `break`, `continue`, `pass`, `def` (defaults, keyword arguments, closures, recursion), `return`, `global`, `del`, `assert` |
| Strings | indexing, slicing, the usual methods, f-strings with format specs |
| Built-ins | `print len range int float str bool abs min max sum round sorted list tuple dict enumerate zip reversed type isinstance repr chr ord divmod pow any all map filter format` |

Not supported, each with a clear "not available in this mini Python" message:
`import`, `class`, `try / except`, `with`, `lambda`, comprehensions, sets,
generators, decorators, `*args` / `**kwargs`, slice assignment, bitwise
operators, `input()`, `nonlocal`, `else` on a loop, `str.format()`, special
attributes such as `__name__`, old-style `%` formatting, and the less common
string methods (`casefold`, `partition`, `title`, `zfill` and others).

Two known differences from CPython, neither of which a lesson relies on:

- A float raised to a fractional power (`4 ** 0.25`) can differ from CPython
  in the last printed digit. Whole-number powers and `** 0.5` are exact.
- When a program has two indentation mistakes, the later one may be the one
  that is reported.

### Error messages

Errors are reported the way Python reports them (`NameError: name 'totl' is
not defined`), followed by one plain sentence about what that kind of error
usually means and, where it can tell, a suggestion ("did you mean `total`?").
Syntax errors point at the line and say what is probably missing.

### Using it directly

```js
import { run } from '../src/lang/minipy.js';

const result = run('x = 2\nprint(x * 21)');
result.ok       // true
result.stdout   // '42\n'
result.error    // null, or { type, message, line, hint, suggestion, … }
result.globals  // { x: 2 }   final variables as plain JavaScript values
result.call('x + 1')   // evaluate an expression afterwards -> { ok, value, repr, stdout, error }
```

Options: `run(source, { maxSteps, maxDepth, maxOutput, trace, maxTrace, inputs })`.
The header of `src/lang/minipy.js` documents the trace format.

## Safety and limits

Learner code is treated as untrusted, even though it only ever runs on the
learner's own device.

- The interpreter never uses `eval` or `Function`, and a program can only
  reach the values and built-ins listed above. There is no path from Python
  code to the page, to storage or to the network. Attribute access goes
  through fixed method tables, so JavaScript internals such as `constructor`
  and `__proto__` are simply unknown names.
- Every run has a step budget (a million steps by default) and stops with
  "ran for too long" instead of freezing the page. Recursion depth, the amount
  of output, the size of numbers and the length of strings and lists are
  capped as well.
- Comparing, hashing and printing are budgeted too, so values that contain or
  share themselves (`a = [a, a]` repeated forty times) cannot hang the tab.

These rules are covered by `tests/minipy.test.mjs`, which also checks the
interpreter's behaviour against real Python when Python 3.12 or newer is
installed (the comparison is skipped otherwise).

## Adding another language

The player and the widgets only rely on a small interface: run a program,
get the output, the error and the final variables, and optionally a trace.
A second interpreter that offers the same `run()` result shape could be used
by the same step type and widgets. That work has not been done; Python is the
only language today.
