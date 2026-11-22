/** "How it works": the learning science in plain words, privacy, credits. */
import { h, cx } from '../core/dom.js';
import { href } from '../core/router.js';
import { config, repoLink, supportLink } from '../config.js';
import { icon } from '../ui/icon.js';
import { mascot } from '../ui/mascot.js';

const PRINCIPLES = [
  {
    icon: 'lightbulb', hue: 'blue', title: 'Shown first, then asked',
    text: 'People new to a subject learn best from a clear explanation and a worked example, not from being left to guess. So each new idea is shown on a short screen before you are asked to use it.',
    how: 'Screens marked “Learn” teach one idea with a picture or an example. The questions that follow use what you have just been shown.',
  },
  {
    icon: 'hand', hue: 'orange', title: 'You learn by doing',
    text: 'An idea you have only read slips away. One you have used straight away, on a new case, starts to stick. Almost every screen gives you something to do: drag a point, run a simulation, solve a small problem.',
    how: 'Every teaching screen is followed at once by a question or an interactive, and practice gets harder as support is taken away.',
  },
  {
    icon: 'telescope', hue: 'violet', title: 'One guess to start',
    text: 'A guess before you are taught makes you curious about the answer and readier to remember it, even when the guess is wrong.',
    how: 'Most lessons open with one “make a prediction” question. It can never be marked wrong, and the lesson then teaches what you need.',
  },
  {
    icon: 'message', hue: 'blue', title: 'Feedback that explains',
    text: 'Being told “wrong” teaches little. Being told why, right away, teaches a lot.',
    how: 'Every question has an explanation, and common mistakes get their own specific feedback. Hints are there when you want them.',
  },
  {
    icon: 'heart', hue: 'pink', title: 'Mistakes cost nothing',
    text: 'Struggle is not a sign you are bad at this. It is what learning feels like from the inside.',
    how: 'There are no lives, timers or penalties. Anything you miss simply comes back for a second look at the end of the lesson.',
  },
  {
    icon: 'review', hue: 'teal', title: 'Remember, don’t re-read',
    text: 'Pulling an idea out of memory strengthens it much more than reading it again. Spreading those recalls out over time multiplies the effect.',
    how: 'Each lesson saves a few key ideas. A memory model estimates when each one is about to fade and brings it back for review at that moment — days, then weeks, then months apart.',
  },
  {
    icon: 'shuffle', hue: 'green', title: 'Mix it up',
    text: 'Practising one type of problem at a time feels smooth but teaches you less about when to use which idea.',
    how: 'Review sessions mix questions from everything you have learned, and practice questions are regenerated with new numbers so you cannot just remember the answer.',
  },
  {
    icon: 'scale', hue: 'yellow', title: 'Know what you know',
    text: 'Feeling sure and being right are different things. Learners who can tell them apart study more effectively.',
    how: 'In reviews you can say how confident you are before checking. Your Progress page shows how well your confidence matches reality.',
  },
  {
    icon: 'coffee', hue: 'red', title: 'Little and often',
    text: 'Ten minutes a day beats an hour once a week. And rest is part of learning: sleep is when memories are consolidated.',
    how: 'Lessons take under ten minutes. Streaks count days you practised, and banked rest days mean an off day does not break them.',
  },
];

export default {
  title: 'How it works',
  render() {
    return h('div.page.about',
      h('header.about-hero',
        h('div',
          h('div.eyebrow', `How ${config.name} works`),
          h('h1', 'Built on what is known about learning'),
          h('p.muted', `${config.name} is designed around a small number of findings that have held up across decades of research on memory and instruction. Here is what they are and how the app uses them.`),
        ),
        mascot('proud', { size: 170 }),
      ),

      h('section.section',
        h('div.principles', PRINCIPLES.map((p) => h('article', { class: cx('principle panel', `hue-${p.hue}`) },
          h('div.principle-icon', icon(p.icon, 24)),
          h('h2', p.title),
          h('p', p.text),
          h('p.principle-how', h('strong', 'In the app: '), p.how),
        ))),
      ),

      h('section.section',
        h('div.panel.about-block',
          h('h2', 'Your data stays with you'),
          h('p', `There are no accounts, no ads, no analytics and no cookies. Your progress is saved in this browser and nowhere else. `, h('a', { href: href('/settings') }, 'Settings'), ' lets you download a backup, restore it on another device, or erase everything.'),
          h('p', 'Once a lesson has loaded it keeps working without an internet connection.'),
        ),
      ),

      h('section.section',
        h('div.panel.about-block',
          h('h2', 'Open source'),
          h('p', `${config.name} is free software. The app is released under the MIT license and the lessons under Creative Commons BY-SA 4.0, so anyone may use, study, translate, improve and share them.`),
          h('p', 'Lessons are plain text files, and there is a guide for writing new ones. Corrections and new courses are welcome.'),
          h('p', 'There is no build step: the files your browser loaded are exactly the files the authors wrote, so you can read all of it with View Source.'),
          h('div.row.row-wrap', { style: { marginTop: 'var(--s3)' } },
            repoLink() ? h('a.btn.btn-primary', { href: repoLink(), target: '_blank', rel: 'noopener noreferrer' }, icon('code', 18), 'Source code') : null,
            h('a.btn', { href: href('/dev') }, icon('wand', 18), 'Author tools'),
            h('a.btn.btn-ghost', { href: 'LICENSE', target: '_blank', rel: 'noopener' }, 'Code license'),
            h('a.btn.btn-ghost', { href: 'LICENSE-CONTENT.md', target: '_blank', rel: 'noopener' }, 'Lesson license'),
          ),
        ),
      ),

      h('section.section',
        h('div.panel.about-block',
          h('h2', 'How the courses are made, and their limits'),
          h('p', 'Every course is written to a brief, then checked by an independent reviewer who re-solves the questions and verifies the facts against standard references, and every generated question is tested by machine across hundreds of variants. Mistakes will still have got through; corrections are always welcome.'),
          h('p', h('strong', 'Health lessons are general education. '), 'They explain how the body works and what current mainstream guidance says. They cannot take account of your own circumstances, so they are not medical advice and not a substitute for a health professional who knows you. In an emergency, call your local emergency number.'),
          h('p', h('strong', 'Money lessons are general education too. '), 'They explain how pay, debt, saving and investing work, with made-up people and example rates. Rules differ from country to country and nobody here knows your circumstances, so they are not financial advice, and no product or company is ever recommended. The psychology course describes how minds work in general; it is not a way to diagnose yourself or anyone else.'),
          h('p', 'The history and geography lessons draw today\'s borders from public-domain map data and describe disputed places as neutrally as they can.'),
        ),
      ),

      supportLink() ? h('section.section',
        h('div.panel.about-block',
          h('h2', 'Free, and paid for by its learners'),
          h('p', `${config.name} has no ads and sells nothing, so it runs on voluntary support. If it has been useful to you, you can help keep it online and growing. Nothing is locked either way.`),
          h('div.row.row-wrap', { style: { marginTop: 'var(--s2)' } },
            h('a.btn', { href: href('/support') }, icon('heart', 18), 'How to support it'),
          ),
        ),
      ) : null,

      h('section.section',
        h('div.panel.about-block',
          h('h2', 'Keyboard shortcuts'),
          h('ul.shortcut-list',
            h('li', h('span.kbd', 'Enter'), ' check your answer / continue'),
            h('li', h('span.kbd', '1'), '–', h('span.kbd', '9'), ' or ', h('span.kbd', 'A'), '–', h('span.kbd', 'F'), ' choose an option'),
            h('li', h('span.kbd', '↑'), ' ', h('span.kbd', '↓'), ' move a focused item when ordering'),
            h('li', h('span.kbd', '←'), ' ', h('span.kbd', '→'), ' ', h('span.kbd', '↑'), ' ', h('span.kbd', '↓'), ' move a focused point in a figure (hold Shift for bigger steps)'),
          ),
        ),
      ),

      h('section.section',
        h('div.panel.about-block',
          h('h2', 'Credits'),
          h('p', 'Math is typeset with ', h('a', { href: 'https://katex.org', target: '_blank', rel: 'noopener noreferrer' }, 'KaTeX'), '. Icons are from ', h('a', { href: 'https://lucide.dev', target: '_blank', rel: 'noopener noreferrer' }, 'Lucide'), '. Type is set in Fraunces, Atkinson Hyperlegible Next and JetBrains Mono. The review scheduler follows the open ', h('a', { href: 'https://github.com/open-spaced-repetition', target: '_blank', rel: 'noopener noreferrer' }, 'FSRS'), ' memory model. All are open source; their licenses ship with the app.'),
          h('p.small.faint', `${config.name} ${config.version}`),
        ),
      ),
    );
  },
};
