/**
 * Site-wide configuration. Rebranding the whole app is a matter of editing
 * this one file (plus the icons in /assets/icons and the <title> in index.html).
 */
export const config = {
  /** Product name shown in the UI. */
  name: 'Learntopia',
  /** One-liner shown under the wordmark. */
  tagline: 'Small steps to big ideas.',
  /** Longer description for the welcome page. */
  description:
    'Free, open-source interactive lessons in math, logic, computer science, science, history, geography, health, psychology and money. ' +
    'No ads, no accounts, no tracking — just learning by doing.',
  /** The mascot's name. */
  mascot: 'Lem',
  /**
   * Where the source lives, e.g. 'https://github.com/you/learntopia'. Leave empty
   * and the "Source code" and "Suggest an edit" links are simply not shown.
   */
  repoUrl: 'https://github.com/Domincog/learntopia',
  /** Branch that "Suggest an edit" links point at. */
  repoBranch: 'main',
  /** Public address of the site, without a trailing slash (used in share links). */
  siteUrl: 'https://learntopia.org',
  /**
   * Voluntary support. Everything in the app stays free; this only powers the
   * "Support" page and the quiet links to it. Leave `url` empty (for example
   * in a fork) and every trace of it disappears.
   */
  support: {
    /** Where people can chip in. */
    url: 'https://ko-fi.com/domlincog',
    /** Name of that service, as shown on the button. */
    platform: 'Ko-fi',
    /**
     * Rough running cost per month in US dollars, shown on the Support page so
     * that people can see what their help amounts to. 0 hides the figure.
     */
    monthlyCost: 200,
  },
  /** Semantic version of the app shell. */
  version: '1.0.0',
  /**
   * localStorage key for all learner data. Bump only with a migration. (It
   * keeps the project's working name so that progress saved before the site
   * was named Learntopia is not lost.)
   */
  storageKey: 'lemma:v1',
};

/** The repository address without a trailing slash, or null when none is configured. */
export function repoLink() {
  const url = String(config.repoUrl || '').trim().replace(/\/+$/, '');
  return /^https?:\/\//.test(url) ? url : null;
}

/** The address of the support page on the donation service, or null when none is configured. */
export function supportLink() {
  const url = String((config.support && config.support.url) || '').trim();
  return /^https:\/\//.test(url) ? url : null;
}

/**
 * A link that opens `path` (relative to the repository root) in the host's
 * web editor, so a reader can propose a fix without cloning anything.
 * Knows GitHub, GitLab and Forgejo/Gitea (Codeberg); for other hosts it
 * falls back to the repository page. Null when no repository is configured.
 */
export function editLink(path) {
  const repo = repoLink();
  if (!repo) return null;
  const file = String(path).replace(/^\/+/, '');
  const branch = encodeURIComponent(config.repoBranch || 'main');
  if (/\/\/(www\.)?github\.com\//.test(repo)) return `${repo}/edit/${branch}/${file}`;
  if (/gitlab/.test(repo)) return `${repo}/-/edit/${branch}/${file}`;
  if (/codeberg\.org|gitea|forgejo/.test(repo)) return `${repo}/_edit/${branch}/${file}`;
  return repo;
}
