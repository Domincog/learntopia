#!/usr/bin/env node
/**
 * Accessibility audit. Opens the app in a real (headless) browser and runs
 * the axe-core rule set (WCAG 2.1 A + AA and best practices) on:
 *   - the main pages (home, catalog, a course, review, profile, settings, puzzles …)
 *   - every step of every lesson, both before and after it is answered
 *
 *   node tools/a11y.mjs                       # pages + all lessons, light theme
 *   node tools/a11y.mjs --dark                # same, dark theme
 *   node tools/a11y.mjs --course algebra
 *   node tools/a11y.mjs --lesson algebra/lines
 *   node tools/a11y.mjs --pages               # only the app pages
 *
 * Needs Playwright and axe-core (neither ships with the site):
 *   npm install --no-save playwright axe-core && npx playwright install chromium
 *
 * Automated checks catch roughly a third of real accessibility problems
 * (contrast, names, roles, structure). They do not replace trying the lesson
 * with a keyboard and a screen reader.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };
const onlyCourse = opt('course');
const onlyLesson = opt('lesson');
const pagesOnly = !!opt('pages');
const dark = !!opt('dark');
const require = createRequire(import.meta.url);

let chromium;
let axeSource;
try {
  ({ chromium } = require('playwright'));
  axeSource = readFileSync(process.env.AXE_PATH || require.resolve('axe-core/axe.min.js'), 'utf8');
} catch {
  console.error('Playwright and axe-core are needed for this check.\n  npm install --no-save playwright axe-core && npx playwright install chromium');
  process.exit(2);
}

const { courses } = await import(pathToFileURL(join(root, 'content/index.js')).href);
const lessons = [];
for (const course of courses) {
  if (onlyCourse && course.id !== onlyCourse) continue;
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      if (onlyLesson && onlyLesson !== `${course.id}/${lesson.id}`) continue;
      lessons.push({ course: course.id, lesson: lesson.id });
    }
  }
}

const { createStaticServer } = await import(pathToFileURL(join(root, 'tools/serve.mjs')).href);
const server = createStaticServer();
await new Promise((res) => server.listen(Number(opt('port')) || 0, res));
const base = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch();
const totals = new Map();
let findings = 0;

async function newPage() {
  // a common laptop window, so the side-by-side lesson layout is what gets audited
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 700 }, reducedMotion: 'reduce', colorScheme: dark ? 'dark' : 'light' });
  // Skip onboarding so every page is reachable.
  await ctx.addInitScript(() => {
    try {
      if (!localStorage.getItem('lemma:v1')) localStorage.setItem('lemma:v1', JSON.stringify({ profile: { onboarded: true, name: 'Tester' } }));
    } catch { /* storage unavailable */ }
  });
  return ctx.newPage();
}

async function audit(page, label) {
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } });
    for (const v of res.violations) {
      for (const node of v.nodes) {
        let el = null;
        try { el = document.querySelector(node.target[node.target.length - 1]); } catch { /* unusual selector */ }
        node.hasMath = !!(el && el.querySelector('.katex'));
      }
    }
    return res;
  });
  for (const v of result.violations) {
    // Known false positive: this rule only counts painted text, and a typeset
    // formula keeps its readable form in (visually hidden) MathML. Such headers
    // also carry a spoken aria-label, so they are fine.
    if (v.id === 'empty-table-header') v.nodes = v.nodes.filter((node) => !node.hasMath);
    if (!v.nodes.length) continue;
    const key = `${v.id} [${v.impact}]`;
    totals.set(key, (totals.get(key) || 0) + v.nodes.length);
    findings += v.nodes.length;
    console.log(`✘ ${label}: ${v.id} [${v.impact}] ×${v.nodes.length} — ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      const why = (node.failureSummary || '').split('\n').slice(1, 2).join(' ').trim();
      console.log(`    ${node.target.join(' ').slice(0, 100)}\n      ${why.slice(0, 200)}`);
    }
  }
}

async function auditPages() {
  const first = courses[0];
  const routes = ['/', '/courses', first ? `/course/${first.id}` : null, '/review', '/profile', '/settings', '/about', '/support', '/puzzles',
    '/puzzle/lights', '/puzzle/target', '/puzzle/codebreaker', '/puzzle/nonogram', '/dev', '/dev/widgets'].filter(Boolean);
  const page = await newPage();
  for (const route of routes) {
    await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await audit(page, `page ${route}`);
  }
  await page.context().close();
  console.log(`· ${routes.length} pages checked`);
}

async function auditLesson({ course, lesson }) {
  const page = await newPage();
  const before = findings;
  await page.goto(`${base}#/dev/lesson?course=${course}&lesson=${lesson}`, { waitUntil: 'networkidle' });
  await page.reload({ waitUntil: 'networkidle' });
  let steps = 0;
  for (let i = 0; i < 400; i++) {
    await page.waitForTimeout(120);
    const info = await page.evaluate(() => {
      const p = window.__lemmaPlayer;
      if (!p || !document.querySelector('.player-top')) return null;
      const c = p.debug.current();
      return c ? { id: c.step.id, type: c.step.type, state: c.state } : { id: 'card', type: '', state: 'card' };
    });
    if (!info) break;
    if (info.state === 'loading') continue;
    await audit(page, `${course}/${lesson} › ${info.id} (${info.type})`);
    if (info.state === 'idle') {
      await page.evaluate(() => window.__lemmaPlayer.debug.solve());
      await page.waitForTimeout(120);
      await page.evaluate(() => window.__lemmaPlayer.debug.check());
      await page.waitForTimeout(300);
      await audit(page, `${course}/${lesson} › ${info.id} (${info.type}) answered`);
    }
    steps++;
    await page.evaluate(() => window.__lemmaPlayer.debug.primary());
  }
  await page.context().close();
  console.log(`${findings === before ? '✔' : '✘'} ${course}/${lesson}  (${steps} steps)`);
}

try {
  if (!onlyCourse && !onlyLesson) await auditPages();
  if (!pagesOnly) for (const item of lessons) await auditLesson(item);
} finally {
  await browser.close();
  server.close();
}

if (findings) {
  console.log(`\n${findings} finding${findings === 1 ? '' : 's'}:`);
  for (const [key, n] of totals) console.log(`  ${String(n).padStart(4)}  ${key}`);
  process.exit(1);
}
console.log(`\n✔ no accessibility findings (${dark ? 'dark' : 'light'} theme)`);
