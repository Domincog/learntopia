/** Settings: profile, appearance, sound, learning preferences and data. */
import { h, cx } from '../core/dom.js';
import { href, navigate } from '../core/router.js';
import { store } from '../core/store.js';
import { config, repoLink, supportLink } from '../config.js';
import { GOALS } from '../core/progress.js';
import { icon } from '../ui/icon.js';
import { toggle, segmented } from '../ui/components.js';
import { confirmDialog } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { play } from '../core/audio.js';
import { install } from '../app.js';

function row(label, hint, control) {
  return h('div.setting',
    h('div.grow', h('div.setting-label', label), hint ? h('div.setting-hint', hint) : null),
    h('div.setting-control', control),
  );
}

function group(title, ...rows) {
  return h('section.section', h('h2.settings-title', title), h('div.panel.settings-group', rows));
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default {
  title: 'Settings',
  render(ctx) {
    const s = store.state;
    const set = (fn) => store.update(fn);

    const name = h('input.input', { type: 'text', maxlength: 24, value: s.profile.name, placeholder: 'Your first name', 'aria-label': 'Your name', autocomplete: 'given-name', style: { maxWidth: '220px' } });
    name.addEventListener('change', () => set((st) => { st.profile.name = name.value.trim(); }));

    const goalPicker = h('div.goal-picker', { role: 'group', 'aria-label': 'Daily goal' }, GOALS.map((g) => {
      const btn = h('button', { type: 'button', class: cx('filter'), 'aria-pressed': String(s.profile.goal === g.xp), title: g.note }, `${g.label} · ${g.xp} XP`);
      btn.addEventListener('click', () => {
        set((st) => { st.profile.goal = g.xp; });
        for (const b of goalPicker.children) b.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-pressed', 'true');
      });
      return btn;
    }));

    const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        const ok = await confirmDialog({
          title: 'Replace your current progress?',
          body: 'Importing a backup replaces everything stored in this browser with the contents of the file.',
          confirmLabel: 'Import',
        });
        if (!ok) return;
        store.importData(parsed);
        toast({ icon: 'check', hue: 'green', title: 'Progress imported' });
        ctx.rerender();
      } catch (err) {
        toast({ icon: 'alert', hue: 'red', title: 'Could not import', body: err.message });
      }
    });

    const offline = h('span.small.muted', 'Checking…');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        offline.textContent = reg && reg.active ? 'Ready: lessons you have opened work without a connection.' : 'Not active in this browser session.';
      }).catch(() => { offline.textContent = 'Unavailable.'; });
    } else {
      offline.textContent = 'Not supported by this browser.';
    }

    return h('div.page.page-narrow',
      h('header.page-head', h('h1', 'Settings')),

      group('You',
        row('Name', 'Used only to greet you. It never leaves this device.', name),
        row('Daily goal', 'A small target you can hit every day beats a big one you hit sometimes.', goalPicker),
      ),

      group('Appearance',
        row('Theme', null, segmented({
          label: 'Theme', value: s.settings.theme,
          options: [{ value: 'auto', label: 'Auto', icon: 'monitor' }, { value: 'light', label: 'Light', icon: 'sun' }, { value: 'dark', label: 'Dark', icon: 'moon' }],
          onChange: (v) => set((st) => { st.settings.theme = v; }),
        })),
        row('Text size', null, segmented({
          label: 'Text size', value: s.settings.fontScale,
          options: [{ value: 0.9, label: 'Small' }, { value: 1, label: 'Normal' }, { value: 1.15, label: 'Large' }, { value: 1.3, label: 'Largest' }],
          onChange: (v) => set((st) => { st.settings.fontScale = v; }),
        })),
        row('Motion', 'Auto follows your device’s “reduce motion” setting.', segmented({
          label: 'Motion', value: s.settings.motion,
          options: [{ value: 'auto', label: 'Auto' }, { value: 'reduce', label: 'Reduced' }, { value: 'full', label: 'Full' }],
          onChange: (v) => set((st) => { st.settings.motion = v; }),
        })),
      ),

      group('Sound and touch',
        row('Sound effects', 'Soft sounds for right and wrong answers.', toggle({
          checked: s.settings.sound, label: 'Sound effects',
          onChange: (v) => { set((st) => { st.settings.sound = v; }); if (v) setTimeout(() => play('correct'), 60); },
        })),
        row('Vibration', 'A light tap on phones that support it.', toggle({
          checked: s.settings.haptics, label: 'Vibration', onChange: (v) => set((st) => { st.settings.haptics = v; }),
        })),
      ),

      group('Learning',
        row('Review session length', 'How many items in one review sitting.', segmented({
          label: 'Review session length', value: s.settings.reviewSize,
          options: [5, 10, 15, 20].map((n) => ({ value: n, label: String(n) })),
          onChange: (v) => set((st) => { st.settings.reviewSize = v; }),
        })),
        row('Review intensity', 'How likely you should be to remember an idea when it comes back. Higher means more frequent reviews.', segmented({
          label: 'Review intensity', value: s.settings.retention,
          options: [{ value: 0.85, label: 'Relaxed 85%' }, { value: 0.9, label: 'Balanced 90%' }, { value: 0.95, label: 'Thorough 95%' }],
          onChange: (v) => set((st) => { st.settings.retention = v; }),
        })),
        row('Warm-up questions', 'Start a lesson with one or two due review questions from earlier in the same course.', toggle({
          checked: s.settings.warmup !== false, label: 'Warm-up questions', onChange: (v) => set((st) => { st.settings.warmup = v; }),
        })),
        supportLink() ? row('Support note', `Show one short note about supporting ${config.name} when you finish a course. It never appears during a lesson.`, toggle({
          checked: s.settings.supportNote !== false, label: 'Support note', onChange: (v) => set((st) => { st.settings.supportNote = v; }),
        })) : null,
        row('Ask how sure I am', 'In reviews, rate your confidence before checking. It sharpens the schedule and your self-knowledge.', toggle({
          checked: s.settings.confidence, label: 'Ask how sure I am', onChange: (v) => set((st) => { st.settings.confidence = v; }),
        })),
      ),

      group('Your data',
        h('p.small.muted', { style: { marginBottom: 'var(--s3)' } },
          `${config.name} has no accounts and no servers. Your progress is stored only in this browser`,
          store.persistent ? '.' : ' — and this browser is blocking storage, so it will be lost when you close the tab.',
          ' Back it up to move it to another device or to keep it safe.'),
        row('Back up', 'Download everything as one file.', h('button.btn.btn-sm', {
          type: 'button',
          onclick: () => { download(`${config.name.toLowerCase()}-progress-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(store.exportData(), null, 2)); toast({ icon: 'download', hue: 'blue', title: 'Backup downloaded' }); },
        }, icon('download', 16), 'Export')),
        row('Restore', 'Load a backup file. This replaces what is here.', h('span', fileInput, h('button.btn.btn-sm', { type: 'button', onclick: () => fileInput.click() }, icon('upload', 16), 'Import'))),
        row('Offline use', null, offline),
        install.prompt ? row('Install', `Add ${config.name} to your home screen or desktop.`, h('button.btn.btn-sm', {
          type: 'button',
          onclick: async () => { const p = install.prompt; if (!p) return; p.prompt(); try { await p.userChoice; } catch { /* dismissed */ } install.prompt = null; ctx.rerender(); },
        }, icon('download', 16), 'Install app')) : null,
        row('Start over', 'Erase all progress in this browser.', h('button.btn.btn-sm.btn-danger', {
          type: 'button',
          onclick: async () => {
            const ok = await confirmDialog({
              title: 'Erase all progress?',
              body: 'Your streak, XP, finished lessons and review schedule will be permanently deleted from this browser. This cannot be undone.',
              confirmLabel: 'Erase everything', danger: true,
            });
            if (!ok) return;
            store.reset();
            toast({ icon: 'trash', hue: 'red', title: 'All progress erased' });
            navigate('/');
          },
        }, icon('trash', 16), 'Reset')),
      ),

      h('section.section.center.small.faint',
        h('p', `${config.name} ${config.version} · `, h('a', { href: href('/about') }, 'How it works'), ' · ',
          supportLink() ? [h('a', { href: href('/support') }, `Support ${config.name}`), ' · '] : null,
          repoLink() ? [h('a', { href: repoLink(), target: '_blank', rel: 'noopener noreferrer' }, 'Source code'), ' · '] : null,
          h('a', { href: href('/dev') }, 'Developer tools')),
      ),
    );
  },
};
