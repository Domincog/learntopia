/**
 * Plays one puzzle.
 *   #/puzzles/lights            arcade: random board, pick a level
 *   #/puzzles/lights?daily=1    today's shared board (seeded by the date)
 */
import { h, cx, mount } from '../core/dom.js';
import { href } from '../core/router.js';
import { store } from '../core/store.js';
import { clock, today, formatDay } from '../core/dates.js';
import { makeRng, randomSeed } from '../core/rng.js';
import { getPuzzle, dailyPuzzleInfo } from '../puzzles/registry.js';
import { addActivity, XP } from '../core/progress.js';
import { checkAchievements } from '../core/achievements.js';
import { getCourses } from '../core/content.js';
import { icon } from '../ui/icon.js';
import { mascot } from '../ui/mascot.js';
import { segmented, loadingBlock } from '../ui/components.js';
import { toast } from '../ui/toast.js';
import { confetti } from '../core/confetti.js';
import { play } from '../core/audio.js';
import notFound from './notfound.js';

const MAX_PAID_SOLVES_PER_DAY = 5; // XP for puzzles is capped so they stay a treat, not a grind

export default {
  title: (ctx) => { const p = getPuzzle(ctx.params.puzzleId); return p ? p.title : 'Puzzle'; },
  async render(ctx) {
    const meta = getPuzzle(ctx.params.puzzleId);
    if (!meta) return notFound.render(ctx);
    const day = today();
    const dailyInfo = dailyPuzzleInfo(day);
    const isDaily = ctx.query.daily === '1' && dailyInfo.id === meta.id;

    const root = h('div', { class: cx('page page-narrow puzzle-page', `hue-${meta.hue}`) }, loadingBlock());
    let mod;
    try {
      mod = (await meta.load()).default;
    } catch (err) {
      console.error(err);
      return h('div.page.page-narrow', h('div.empty', h('h1', 'This puzzle could not be loaded'), h('a.btn.btn-primary', { href: href('/puzzles') }, 'Back to puzzles')));
    }

    let game = null;
    let level = (store.state.puzzles[meta.id] && store.state.puzzles[meta.id].level) || (mod.levels[1] || mod.levels[0]).id;
    if (isDaily) level = (mod.levels[1] || mod.levels[0]).id;
    let startedAt = clock.now();
    const stage = h('div.puzzle-stage');
    const status = h('div.puzzle-status', { role: 'status' });
    const win = h('div.puzzle-win', { hidden: true });
    const controls = h('div.puzzle-controls');
    ctx.d(() => { if (game) game.destroy(); });

    function onSolved(result) {
      const now = clock.now();
      const seconds = Math.max(1, Math.round((now - startedAt) / 1000));
      const firstDaily = isDaily && !store.state.puzzles.daily[day];
      const paidToday = (store.state.days[day] && store.state.days[day].puzzles) || 0;
      const xp = firstDaily ? XP.dailyPuzzle : paidToday < MAX_PAID_SOLVES_PER_DAY ? XP.puzzle : 0;
      const activity = store.update((s) => {
        const rec = s.puzzles[meta.id] || (s.puzzles[meta.id] = { solved: 0 });
        rec.solved = (rec.solved || 0) + 1;
        rec.level = level;
        if (isDaily && !s.puzzles.daily[day]) s.puzzles.daily[day] = { id: meta.id, moves: result.moves || 0, seconds };
        return addActivity(s, now, { xp, puzzles: 1, ms: Math.min(seconds * 1000, 15 * 60000) });
      });
      const earned = store.update((s) => checkAchievements(s, now, getCourses()));
      play('complete');
      confetti({ count: 90 });
      if (activity.streakExtended) toast({ icon: 'flame', hue: 'orange', title: `${activity.streak}-day streak!` });
      for (const a of earned) toast({ icon: a.icon, hue: a.hue, title: `Achievement: ${a.title}`, body: a.desc, duration: 4500 });

      const shareText = `${isDaily ? `Learntopia daily puzzle, ${formatDay(day)}\n` : ''}${game.share ? game.share() : meta.title + ': solved'}`;
      const shareBtn = h('button.btn', { type: 'button' }, icon('share', 18), 'Copy result');
      shareBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(shareText);
          toast({ icon: 'copy', hue: 'blue', title: 'Result copied' });
        } catch {
          toast({ icon: 'alert', hue: 'red', title: 'Could not copy', body: 'Your browser blocked clipboard access.' });
        }
      });
      const mins = Math.floor(seconds / 60);
      mount(win,
        mascot('cheer', { size: 110 }),
        h('div',
          h('h2', 'Solved!'),
          h('p.muted', `${game.status ? game.status() + ' · ' : ''}${mins ? `${mins} min ${seconds % 60} s` : `${seconds} s`}${xp ? ` · +${xp} XP` : ''}`),
          h('div.row.row-wrap', { style: { marginTop: 'var(--s3)' } },
            isDaily ? null : h('button.btn.btn-primary', { type: 'button', onclick: () => start() }, 'Another one', icon('arrow-right', 18)),
            shareBtn,
            h('a.btn.btn-ghost', { href: href('/puzzles') }, 'All puzzles'),
          ),
        ),
      );
      win.hidden = false;
      drawControls();
    }

    function drawControls() {
      const solved = !win.hidden;
      mount(controls,
        game.undo ? h('button.btn.btn-sm.btn-ghost', { type: 'button', disabled: solved, onclick: () => game.undo() }, icon('undo', 16), 'Undo') : null,
        game.hint ? h('button.btn.btn-sm.btn-ghost', { type: 'button', disabled: solved, onclick: () => { game.hint(); status.textContent = game.status ? game.status() : ''; } }, icon('lightbulb', 16), 'Hint') : null,
        h('button.btn.btn-sm.btn-ghost', { type: 'button', onclick: () => { win.hidden = true; game.restart(); drawControls(); } }, icon('reset', 16), 'Restart'),
        isDaily ? null : h('button.btn.btn-sm', { type: 'button', onclick: () => start() }, icon('shuffle', 16), 'New puzzle'),
      );
    }

    function start() {
      if (game) game.destroy();
      win.hidden = true;
      startedAt = clock.now();
      const seed = isDaily ? dailyInfo.seed : randomSeed();
      game = mod.create({
        rng: makeRng(seed),
        level,
        onChange: () => { status.textContent = game && game.status ? game.status() : ''; },
        onSolved,
      });
      mount(stage, game.el);
      status.textContent = game.status ? game.status() : '';
      drawControls();
    }

    const levelPicker = !isDaily && mod.levels.length > 1 ? segmented({
      label: 'Difficulty', value: level,
      options: mod.levels.map((l) => ({ value: l.id, label: l.label })),
      onChange: (v) => { level = v; store.update((s) => { (s.puzzles[meta.id] || (s.puzzles[meta.id] = { solved: 0 })).level = v; }, { silent: true }); start(); },
    }) : null;

    start();
    mount(root,
      h('a.back-link', { href: href('/puzzles') }, icon('arrow-left', 18), 'Puzzles'),
      h('header.puzzle-head',
        h('div.arcade-icon', icon(meta.icon, 28)),
        h('div.grow',
          h('div.eyebrow', isDaily ? `Daily puzzle · ${formatDay(day)}` : 'Arcade'),
          h('h1', meta.title),
        ),
        levelPicker,
      ),
      h('details.puzzle-how', { open: !(store.state.puzzles[meta.id] && store.state.puzzles[meta.id].solved) },
        h('summary', 'How to play'),
        h('ul.md', mod.howTo.map((line) => h('li', line))),
      ),
      win,
      stage,
      status,
      controls,
    );
    return root;
  },
};
