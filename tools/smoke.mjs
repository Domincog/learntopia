#!/usr/bin/env node
/**
 * Browser smoke test. Plays lessons in a real (headless) browser and checks:
 *   - every step renders without a JavaScript error
 *   - every answerable step's own solution is accepted by its own check
 *   - nothing overflows sideways, on a phone-sized or a laptop-sized screen
 *   - every picture in a step really loads
 *   - (reported, not failed) which steps need scrolling on a laptop before they can be answered
 * Optionally saves a screenshot of every step so you can look at your work.
 *
 *   node tools/smoke.mjs                          # all lessons + widget gallery
 *   node tools/smoke.mjs --course algebra
 *   node tools/smoke.mjs --lesson algebra/lines
 *   node tools/smoke.mjs --lesson algebra/lines --shots /tmp/shots            # desktop screenshots
 *   node tools/smoke.mjs --lesson algebra/lines --shots /tmp/shots --mobile   # phone screenshots
 *   node tools/smoke.mjs --lesson algebra/lines --shots /tmp/shots --dark     # dark-theme screenshots
 *   node tools/smoke.mjs --runs 3                 # repeat each lesson (new random variants each run)
 *   node tools/smoke.mjs --widgets                # only the widget gallery
 *   node tools/smoke.mjs --app                    # only the app pages (home, catalog, review, puzzles …)
 *
 * Needs Playwright:  npm install --no-save playwright && npx playwright install chromium
 */
import { mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };
const KNOWN = ['course', 'lesson', 'widgets', 'app', 'runs', 'shots', 'mobile', 'dark'];
const unknown = args.filter((a) => a.startsWith('--') && !KNOWN.includes(a.slice(2)));
if (unknown.length) {
  // an unrecognised option used to be ignored, which meant "run everything": several minutes of surprise
  console.error(`Unknown option ${unknown.join(', ')}.\nOptions: ${KNOWN.map((k) => `--${k}`).join(' ')}`);
  process.exit(2);
}
const onlyCourse = opt('course');
const onlyLesson = opt('lesson');
const widgetsOnly = !!opt('widgets');
const appOnly = !!opt('app');
const runs = Number(opt('runs')) || 2;
const shotsDir = opt('shots') && opt('shots') !== true ? resolve(String(opt('shots'))) : null;
const mobile = !!opt('mobile');
const dark = !!opt('dark');

let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)('playwright'));
} catch {
  console.error('Playwright is not installed.\n  npm install --no-save playwright && npx playwright install chromium');
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
if ((onlyCourse || onlyLesson) && !lessons.length && !widgetsOnly && !appOnly) {
  console.error('No lesson matched. Use --course <id> or --lesson <course>/<lesson>.');
  process.exit(2);
}

const { createStaticServer } = await import(pathToFileURL(join(root, 'tools/serve.mjs')).href);
const server = createStaticServer();
await new Promise((res) => server.listen(Number(opt('port')) || 0, res)); // port 0 = any free port
const base = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch();
const failures = [];
const notes = [];
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

// A common laptop: 1366 x 768 minus the browser's own bars. Wide and short, which is
// exactly the shape that a layout tested only on tall windows gets wrong.
const DESKTOP = { width: 1366, height: 700 };
const PHONE = { width: 390, height: 844 };

async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`uncaught error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console error: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) problems.push(`HTTP ${r.status()} ${r.url().replace(base, '/')}`); });
  return { ctx, page, problems };
}

/** How far the step runs below the visible area (0 when everything is on screen without scrolling). */
const belowFold = (page) => page.evaluate(() => {
  const article = document.querySelector('article.step');
  const bar = document.querySelector('.player-bottom');
  if (!article || !bar) return 0;
  return Math.max(0, Math.round(article.getBoundingClientRect().bottom + window.scrollY - bar.getBoundingClientRect().top));
});
const tall = [];   // steps that need scrolling on the laptop-sized window
let laptopSteps = 0;
const clipped = []; // display formulas and tables wider than a phone screen (they scroll inside their box, half hidden)

/** The widest display formula or table that does not fit its box, in px over; 0 when all fit. */
const clippedMath = (page) => page.evaluate(() => {
  let worst = 0;
  for (const el of document.querySelectorAll('.player-stage .math-display, .player-stage .md-table-wrap')) worst = Math.max(worst, el.scrollWidth - el.clientWidth);
  return worst;
});

/**
 * Pictures of the current step that did not load. Photos load lazily and after the step is
 * drawn, so this first lets picture options finish mounting, asks every image to load now and
 * waits for the outcome. (The layout does not wait: the photo widget reserves each picture's
 * space from its recorded size, so "laptop fit" is the same before and after the file arrives.)
 */
const brokenImages = (page, scope) => page.evaluate(async (sel) => {
  const root = document.querySelector(sel);
  if (!root) return [];
  const until = performance.now() + 2500;
  while (Array.from(root.querySelectorAll('.option-figure')).some((box) => !box.firstChild) && performance.now() < until) await new Promise((r) => setTimeout(r, 40));
  const imgs = Array.from(root.querySelectorAll('img'));
  for (const img of imgs) if (img.loading === 'lazy') img.loading = 'eager';
  await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((res) => {
    img.addEventListener('load', res, { once: true });
    img.addEventListener('error', res, { once: true });
    setTimeout(res, 6000);
  }))));
  return imgs.filter((img) => !(img.naturalWidth > 0)).map((img) => img.getAttribute('src') || '(an image without src)');
}, scope);

const overflow = (page) => page.evaluate(() => {
  const doc = document.documentElement;
  if (doc.scrollWidth <= doc.clientWidth + 1) return null;
  // name the widest offender to make it easy to fix
  let worst = null;
  for (const el of document.querySelectorAll('.player-stage *')) {
    const r = el.getBoundingClientRect();
    if (r.right > doc.clientWidth + 1 && (!worst || r.right > worst.right)) worst = { right: r.right, cls: el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className), tag: el.tagName.toLowerCase() };
  }
  return { by: doc.scrollWidth - doc.clientWidth, worst };
});

async function playLesson({ course, lesson }, run, viewport, takeShots) {
  const where = `${course}/${lesson}`;
  const { ctx, page, problems } = await newPage(viewport);
  let steps = 0;
  try {
    await page.goto(`${base}#/dev/lesson?course=${course}&lesson=${lesson}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__lemmaPlayer || document.querySelector('.empty, .widget-error, pre.code'), null, { timeout: 15000 });
    for (let guard = 0; guard < 80; guard++) {
      await page.waitForTimeout(120);
      const info = await page.evaluate(() => {
        const p = window.__lemmaPlayer;
        if (!p || !document.querySelector('.player')) return { finished: true };
        const c = p.debug.current();
        const stage = document.querySelector('.player-stage');
        return {
          pos: p.debug.pos(), len: p.debug.queueLength(),
          id: c ? c.step.id : null, type: c ? c.step.type : null, state: c ? c.state : null,
          broken: !c && stage && /This step has a problem/.test(stage.textContent) ? stage.querySelector('pre') && stage.querySelector('pre').textContent : null,
          widgetError: stage && stage.querySelector('.widget-error') ? stage.querySelector('.widget-error').textContent : null,
          mathError: stage && stage.querySelector('.math-error, .katex-error') ? (stage.querySelector('.math-error, .katex-error').textContent || '').slice(0, 80) : null,
        };
      });
      if (info.finished) break;
      if (info.state === 'loading') continue;
      steps++;
      const tag = `${String(info.pos + 1).padStart(2, '0')}-${info.id || 'card'}`;
      const sw = `${where} › ${info.id || `(card ${info.pos + 1})`}`;
      const shot = async (suffix) => {
        if (!takeShots) return;
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: join(shotsDir, `${course}__${lesson}__${tag}-${suffix}.png`), fullPage: true });
      };
      if (info.broken) failures.push(`${sw}: step failed to render — ${info.broken}`);
      if (info.widgetError) failures.push(`${sw}: ${info.widgetError}`);
      if (info.mathError) failures.push(`${sw}: TeX did not render: ${info.mathError}`);
      for (const src of await brokenImages(page, '.player-stage')) failures.push(`${sw}: image did not load: ${src}`);
      const wide = await overflow(page);
      if (wide) failures.push(`${sw}: overflows the ${viewport.width < 500 ? 'phone' : 'laptop'} screen sideways by ${Math.round(wide.by)}px${wide.worst ? ` (widest: <${wide.worst.tag} class="${wide.worst.cls}">)` : ''}`);
      if (viewport.width < 500) {
        const over = await clippedMath(page);
        if (over > 2) clipped.push({ sw, over });
      }
      if (viewport.width >= 1000 && info.state !== null) {
        laptopSteps++;
        await page.evaluate(() => window.scrollTo(0, 0));
        const extra = await belowFold(page);
        if (extra > 8) tall.push({ sw, extra });
      }

      if (info.state === 'idle') {
        await shot('a');
        await page.evaluate(() => window.__lemmaPlayer.debug.solve());
        await page.waitForTimeout(160);
        await page.evaluate(() => window.__lemmaPlayer.debug.check());
        await page.waitForTimeout(260);
        const after = await page.evaluate(() => {
          const c = window.__lemmaPlayer.debug.current();
          const v = document.querySelector('.verdict');
          return { state: c ? c.state : null, verdict: v && !v.hidden ? v.innerText.replace(/\s+/g, ' ').trim() : '' };
        });
        if (!['correct', 'predict', 'done'].includes(after.state)) {
          failures.push(`${sw} [${info.type}]: its own solution was not accepted (state "${after.state}"${after.verdict ? `, feedback: "${after.verdict}"` : ''})`);
        }
        if (viewport.width < 500) {
          const over2 = await clippedMath(page);   // the explanation may hold a wide formula too
          if (over2 > 2) clipped.push({ sw: `${sw} (after answering)`, over: over2 });
        }
        const wide2 = await overflow(page);
        if (wide2 && !wide) failures.push(`${sw}: overflows the ${viewport.width < 500 ? 'phone' : 'laptop'} screen sideways after answering (by ${Math.round(wide2.by)}px)`);
        await shot('b');
      } else {
        await shot('a');
      }
      while (problems.length) failures.push(`${sw}: ${problems.shift()}`);
      await page.evaluate(() => window.__lemmaPlayer.debug.primary());
    }
    while (problems.length) failures.push(`${where}: ${problems.shift()}`);
  } catch (e) {
    failures.push(`${where}: ${e.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
  void run;
  return steps;
}

async function checkWidgets() {
  const { ctx, page, problems } = await newPage(DESKTOP);
  try {
    await page.goto(`${base}#/dev/widgets`, { waitUntil: 'networkidle' });
    await page.waitForSelector('section[data-widget]', { timeout: 15000 });
    await page.waitForTimeout(500);
    const res = await page.evaluate(() => Array.from(document.querySelectorAll('section[data-widget]')).map((sec) => ({
      id: sec.id, error: sec.querySelector('.widget-error') ? sec.querySelector('.widget-error').textContent : null,
    })));
    for (const r of res) if (r.error) failures.push(`widget gallery ${r.id}: ${r.error}`);
    for (const src of await brokenImages(page, '#main')) failures.push(`widget gallery: image did not load: ${src}`);
    while (problems.length) failures.push(`widget gallery: ${problems.shift()}`);
    notes.push(`widget gallery: ${res.length} examples mounted`);
    if (shotsDir) await page.screenshot({ path: join(shotsDir, 'widget-gallery.png'), fullPage: true });
  } catch (e) {
    failures.push(`widget gallery: ${e.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
}

/** Open every top-level page, as a new visitor and as a returning learner. */
async function checkApp() {
  const firstCourse = courses[0];
  const firstLesson = firstCourse.chapters[0].lessons[0];
  const routes = ['/', '/courses', `/course/${firstCourse.id}`, `/learn/${firstCourse.id}/${firstLesson.id}`, '/review', '/review/session', '/puzzles',
    '/puzzles/lights', '/puzzles/target', '/puzzles/codebreaker', '/puzzles/nonogram', '/profile', '/settings', '/about', '/support', '/dev', '/dev/steps', '/dev/time', '/no-such-page'];
  const returning = JSON.stringify({ v: 1, xp: 230, profile: { name: 'Test', goal: 40, interests: ['math'], onboarded: true }, lessons: { [`${firstCourse.id}/${firstLesson.id}`]: { done: 1, first: 1, last: Date.now() - 5 * 86400000, best: 0.8 } }, cards: {}, days: {}, streak: { current: 0, best: 2, last: null, rest: 1, rested: [] } });
  let pages = 0;
  for (const [label, saved, viewport] of [['new visitor', null, DESKTOP], ['returning learner', returning, DESKTOP], ['returning learner on a phone', returning, PHONE]]) {
    const { ctx, page, problems } = await newPage(viewport);
    try {
      await page.goto(`${base}robots.txt`);
      if (saved) await page.evaluate((v) => localStorage.setItem('lemma:v1', v), saved);
      for (const r of routes) {
        await page.goto(`${base}#${r}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(250);
        pages++;
        const state = await page.evaluate(() => {
          const main = document.querySelector('#main');
          const doc = document.documentElement;
          return {
            empty: !main || !main.textContent.trim(),
            crashed: main ? /Something went wrong/.test(main.textContent) : true,
            wide: doc.scrollWidth - doc.clientWidth,
          };
        });
        if (state.empty) failures.push(`app ${r} (${label}): rendered nothing`);
        if (state.crashed) failures.push(`app ${r} (${label}): the page crashed`);
        if (state.wide > 1 && viewport.width < 500) failures.push(`app ${r} (${label}): overflows sideways by ${Math.round(state.wide)}px`);
        while (problems.length) failures.push(`app ${r} (${label}): ${problems.shift()}`);
        if (shotsDir && viewport === PHONE) await page.screenshot({ path: join(shotsDir, `app__${r.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'}.png`), fullPage: true });
      }
    } catch (e) {
      failures.push(`app (${label}): ${e.message.split('\n')[0]}`);
    } finally {
      await ctx.close();
    }
  }
  notes.push(`app pages: ${pages} page loads checked`);
}

try {
  if (!widgetsOnly && !appOnly) {
    for (const item of lessons) {
      const before = failures.length;
      let steps = 0;
      for (let run = 0; run < runs; run++) {
        // alternate desktop and phone so layout problems on either show up
        const viewport = mobile ? PHONE : (run % 2 === 0 ? DESKTOP : PHONE);
        const n = await playLesson(item, run, viewport, !!shotsDir && run === 0);
        if (run === 0) steps = n;
      }
      const failed = failures.length - before;
      console.log(`${failed ? '✖' : '✔'} ${item.course}/${item.lesson}  (${steps} steps × ${runs} runs)${failed ? `  — ${failed} problem(s)` : ''}`);
    }
  }
  if (widgetsOnly || (!onlyCourse && !onlyLesson && !appOnly)) await checkWidgets();
  if (appOnly || (!onlyCourse && !onlyLesson && !widgetsOnly)) await checkApp();
} finally {
  await browser.close();
  server.close();
}

if (laptopSteps) {
  // Not a failure: some steps are simply long. But the list should stay short.
  tall.sort((a, b) => b.extra - a.extra);
  const seen = new Set();
  const unique = tall.filter((t) => (seen.has(t.sw) ? false : seen.add(t.sw)));
  notes.push(`laptop fit (${DESKTOP.width}x${DESKTOP.height}): ${unique.length ? `${unique.length} step(s) need scrolling before they can be answered` : 'every step fits without scrolling'}`);
  for (const t of unique.slice(0, 8)) notes.push(`    ${t.extra}px below the fold: ${t.sw}`);
  if (unique.length > 8) notes.push(`    … and ${unique.length - 8} more`);
}
if (clipped.length) {
  // Not a failure either: the formula can be scrolled sideways. But half a formula is easy to misread.
  const seen = new Set();
  const unique = clipped.sort((a, b) => b.over - a.over).filter((t) => (seen.has(t.sw) ? false : seen.add(t.sw)));
  notes.push(`phone: ${unique.length} step(s) show a display formula or a table wider than the screen (break the formula over two lines; give the table fewer columns or shorter cells, or use a list)`);
  for (const t of unique.slice(0, 8)) notes.push(`    ${Math.round(t.over)}px too wide: ${t.sw}`);
  if (unique.length > 8) notes.push(`    … and ${unique.length - 8} more`);
}
for (const n of notes) console.log(`  ${n}`);
if (failures.length) {
  console.log(`\n${failures.length} problem(s):`);
  for (const f of [...new Set(failures)]) console.log(`  ✖ ${f}`);
} else {
  console.log('\n✔ all good');
}
if (shotsDir) console.log(`\nScreenshots: ${shotsDir}`);
process.exit(failures.length ? 1 : 0);
