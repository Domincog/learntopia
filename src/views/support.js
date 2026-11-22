/**
 * "Support": what the project costs to run, what help pays for, and the
 * free ways to help. Everything here is driven by `config.support`; with no
 * support address configured the page still lists the free ways to help.
 *
 * House rules for this page and every link to it: nothing in the app is ever
 * locked behind it, it never appears in the middle of a lesson, and there are
 * no pop-ups. See also supportNote() in src/player/summary.js.
 */
import { h, cx } from '../core/dom.js';
import { href } from '../core/router.js';
import { config, repoLink, supportLink } from '../config.js';
import { getCourses, countLessons } from '../core/content.js';
import { icon } from '../ui/icon.js';
import { mascot } from '../ui/mascot.js';

/** Whole number of supporters at `amount` dollars a month that would cover `cost`. */
export function supportersNeeded(cost, amount) {
  if (!(cost > 0) || !(amount > 0)) return 0;
  return Math.ceil(cost / amount);
}

function costs(monthly) {
  return [
    {
      icon: 'pencil', hue: 'orange', title: 'Writing and checking courses', tag: monthly ? 'Most of the bill today' : 'The main cost today',
      text: `Lessons are drafted, cross-checked and tested with the help of AI tools that are paid for by use. Every course is then reviewed independently, because one wrong answer key spoils trust in all the rest.${monthly ? ` At the moment this comes to about $${monthly} a month.` : ''}`,
    },
    {
      icon: 'rocket', hue: 'blue', title: 'Keeping the site online', tag: 'Small, but every month',
      text: 'The domain, hosting and the bandwidth to serve lessons quickly wherever you are.',
    },
    {
      icon: 'refresh', hue: 'teal', title: 'Next goal: optional accounts', tag: 'Planned',
      text: `A small server so that your progress can follow you from phone to laptop. It would stay optional: ${config.name} will always work without signing up for anything.`,
    },
  ];
}

export default {
  title: 'Support',
  render() {
    const link = supportLink();
    const platform = (config.support && config.support.platform) || 'the support page';
    const monthly = Math.max(0, Math.round((config.support && config.support.monthlyCost) || 0));
    const courses = getCourses();
    const lessons = courses.reduce((n, c) => n + countLessons(c), 0);
    const repo = repoLink();

    const giveButton = (cls = 'btn.btn-primary.btn-lg') => (link
      ? h(`a.${cls}`, { href: link, target: '_blank', rel: 'noopener noreferrer' }, icon('heart', 20), `Support on ${platform}`, icon('external', 16))
      : null);

    return h('div.page.support',
      h('header.about-hero',
        h('div',
          h('div.eyebrow', `Support ${config.name}`),
          h('h1', 'Free for everyone. Kept going by people like you.'),
          h('p.muted', `${config.name} has ${courses.length} courses and ${lessons} lessons, with no ads, no tracking and nothing locked away. It is an independent open-source project with no company or investors behind it, so the bills are paid out of pocket, and by learners who choose to chip in.`),
          link ? h('div.row.row-wrap.support-cta', giveButton(), h('span.small.faint', 'Opens in a new tab. Give once or monthly; any amount helps.')) : null,
        ),
        mascot('cheer', { size: 170 }),
      ),

      h('section.section',
        h('h2.support-h', 'Where the money goes'),
        h('div.support-costs', costs(monthly).map((c) => h('article', { class: cx('panel support-cost', `hue-${c.hue}`) },
          h('div.principle-icon', icon(c.icon, 24)),
          h('h3', c.title),
          h('p.support-tag', c.tag),
          h('p', c.text),
        ))),
      ),

      link && monthly ? h('section.section',
        h('div.panel.about-block',
          h('h2', 'How far a little goes'),
          h('p', `About $${monthly} a month keeps new courses coming. Shared out, that is not much:`),
          h('div.support-shares', [3, 5, 10].map((amount) => h('div.support-share',
            h('strong', `${supportersNeeded(monthly, amount)} people`),
            h('span', `giving $${amount} a month`),
          ))),
          h('p', 'Any one of those groups would cover it. A one-off tip counts just the same, and anything beyond the running costs goes towards the next goal.'),
        ),
      ) : null,

      h('section.section',
        h('div.panel.about-block',
          h('h2', 'What you get in return'),
          h('p', 'Nothing extra, because nothing is held back. Every course, every puzzle and every feature is free for everyone, supporter or not, and that will not change. What your help buys is more of it: more courses, fewer mistakes, and a site that stays online.'),
          link ? h('p.small.muted', `Payments are handled by ${platform}; ${config.name} never sees your card details. You can stop a monthly contribution at any time from your ${platform} account.`) : null,
        ),
      ),

      h('section.section',
        h('div.panel.about-block',
          h('h2', 'Ways to help that cost nothing'),
          h('ul.support-free',
            h('li', icon('share', 18), h('span', h('strong', 'Tell someone. '), 'A friend, a class, a teacher, a study group. Most people find a site like this because somebody mentioned it.')),
            h('li', icon('bug', 18), h('span', h('strong', 'Report mistakes. '), repo
              ? ['Every lesson ends with a “Suggest an edit” link, or you can ', h('a', { href: `${repo}/issues`, target: '_blank', rel: 'noopener noreferrer' }, 'open an issue'), '.']
              : 'A wrong answer or a confusing step is worth reporting: fixing it helps every learner after you.')),
            h('li', icon('pencil', 18), h('span', h('strong', 'Write or translate a lesson. '), 'Lessons are plain text files and there is a guide for authors. ', h('a', { href: href('/dev') }, 'Author tools'), repo ? [' · ', h('a', { href: repo, target: '_blank', rel: 'noopener noreferrer' }, 'Source code')] : null)),
          ),
        ),
      ),

      h('section.section',
        h('div.panel.about-block.support-promise',
          h('h2', 'A promise about asking'),
          h('p', `${config.name} will not nag you. There are no pop-ups, no banners and no interruptions in a lesson. You may see one short note when you finish a whole course, and `, h('a', { href: href('/settings') }, 'Settings'), ' has a switch to turn even that off.'),
          link ? h('div.row.row-wrap', { style: { marginTop: 'var(--s2)' } }, giveButton('btn.btn-primary'), h('a.btn.btn-ghost', { href: href('/about') }, `How ${config.name} works`)) : null,
        ),
      ),
    );
  },
};
