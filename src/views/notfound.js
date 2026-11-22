import { h } from '../core/dom.js';
import { href } from '../core/router.js';
import { mascot } from '../ui/mascot.js';

export default {
  title: 'Not found',
  render() {
    return h('div.page.page-narrow', h('div.empty',
      mascot('wow', { size: 150 }),
      h('h1', 'This page wandered off'),
      h('p', 'The link may be old, or the lesson may have moved.'),
      h('a.btn.btn-primary', { href: href('/') }, 'Back to home'),
    ));
  },
};
