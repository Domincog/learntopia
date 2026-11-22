import test from 'node:test';
import assert from 'node:assert/strict';
import { md, mdInline, mdText } from '../src/core/markdown.js';

test('paragraphs and inline formatting', () => {
  const html = md('Hello **bold** and *italic* and `code`.\n\nSecond para.');
  assert.match(html, /<p>Hello <strong>bold<\/strong> and <em>italic<\/em> and <code>code<\/code>\.<\/p>/);
  assert.match(html, /<p>Second para\.<\/p>/);
});

test('html is escaped', () => {
  const html = md('<script>alert(1)</script> & "quotes"');
  assert.ok(!html.includes('<script>'));
  assert.match(html, /&lt;script&gt;/);
});

test('inline and display math render with KaTeX', () => {
  const html = md('Solve $x^2 = 4$ now.\n\n$$\\frac{1}{2}$$');
  assert.match(html, /class="katex"/);
  assert.match(html, /math-display/);
  assert.ok(!html.includes('$'));
});

test('currency is not mistaken for math', () => {
  const html = md('It costs $5 and then $10 more.');
  assert.ok(!html.includes('katex'));
  assert.match(html, /\$5 and then \$10/);
  const esc = md(String.raw`Pay \$20 for $x$ items.`);
  assert.match(esc, /Pay \$20 for/);
  assert.match(esc, /katex/);
});

test('lists, nested lists and ordered lists', () => {
  const html = md('- one\n- two\n  - inner\n- three');
  assert.match(html, /<ul><li>one<\/li>/);
  assert.match(html, /<li>two[\s\S]*<ul><li>inner<\/li><\/ul>/);
  const ol = md('1. first\n2. second');
  assert.match(ol, /<ol><li>first<\/li><li>second<\/li><\/ol>/);
});

test('callouts, quotes, tables, code fences', () => {
  const html = md(':::tip\nUse **both** sides.\n:::');
  assert.match(html, /callout-tip/);
  assert.match(html, /<strong>both<\/strong>/);
  assert.match(md('> quoted'), /<blockquote><p>quoted<\/p><\/blockquote>/);
  const table = md('| a | b |\n|---|--:|\n| 1 | 2 |');
  assert.match(table, /<table class="md-table">/);
  assert.match(table, /<td style="text-align:right">2<\/td>/);
  const code = md('```python\nprint("hi")  # greet\n```');
  assert.match(code, /<pre class="code" data-lang="python">/);
  assert.match(code, /tok-str/);
  assert.match(code, /tok-com/);
});

test('indented template-literal content is dedented', () => {
  const html = md(`
      First line.

      - item
  `);
  assert.match(html, /<p>First line\.<\/p>/);
  assert.match(html, /<ul><li>item<\/li><\/ul>/);
});

test('links are restricted to safe schemes', () => {
  assert.match(md('[ok](https://example.org)'), /<a href="https:\/\/example\.org" target="_blank"/);
  assert.match(md('[in](#/courses)'), /<a href="#\/courses">in<\/a>/);
  assert.ok(!md('[bad](javascript:alert(1))').includes('<a '));
});

test('colour spans and highlight', () => {
  assert.match(mdInline('[rise]{.blue} over ==run=='), /<span class="tc-blue">rise<\/span> over <mark>run<\/mark>/);
  assert.match(md('$\\blue{x}$'), /tc-blue/);
});

test('mdInline has no paragraph wrapper; mdText strips markup', () => {
  assert.equal(mdInline('just **this**'), 'just <strong>this</strong>');
  assert.equal(mdText('Solve **$x+1$** now'), 'Solve x plus 1 now');
  assert.equal(mdText('A [link](https://example.org) and `code`'), 'A link and code');
});

test('multiplication asterisks are left alone', () => {
  assert.equal(mdInline('3 * 4 * 5'), '3 * 4 * 5');
});

test('texToSpeech and mdText give usable spoken math', async () => {
  const { texToSpeech } = await import('../src/core/markdown.js');
  assert.equal(texToSpeech('2x + 3'), '2x plus 3');
  assert.equal(texToSpeech(String.raw`\frac{3}{4}`), '3 over 4');
  assert.equal(texToSpeech('x^2 - 1'), 'x squared minus 1');
  assert.equal(texToSpeech(String.raw`90^\circ`), '90 degrees');
  assert.equal(texToSpeech(String.raw`3 \times 4 = 12`), '3 times 4 equals 12');
  assert.equal(texToSpeech('-5'), 'minus 5');
  assert.equal(mdText(String.raw`Is $\sqrt{16}$ equal to **4**?`), 'Is the square root of 16 equal to 4?');
  assert.equal(mdText(String.raw`Costs \$5`), 'Costs $5');
});

test('table headers: empty corner is not a header, formula-only headers get a spoken name', () => {
  const html = md('|  | $x^2$ | plain |\n|---|---|---|\n| a | 1 | 2 |');
  assert.match(html, /<thead><tr><td><\/td><th scope="col" aria-label="x squared">/);
  assert.match(html, /<th scope="col">plain<\/th>/);
});
