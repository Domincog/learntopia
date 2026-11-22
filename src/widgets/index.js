/**
 * Widget loader.
 *
 * A widget is an interactive (or static) figure described by a plain "spec"
 * object: `{ type: 'plot', ... }`. The type name maps straight to a module —
 * `{ type: 'number-line' }` loads `src/widgets/number-line.js` — so adding a
 * widget means adding one file; there is no registry to edit.
 *
 * Every widget module default-exports a factory:
 *
 *   export default function create(spec, env) {
 *     // env: { rng, readOnly, compact, onChange(state), announce(msg) }
 *     return {
 *       el,                    // root DOM element (required)
 *       getState() {},         // plain-data snapshot of what the learner did
 *       setState(state) {},    // restore / show a solution
 *       setReadOnly(bool) {},  // freeze interaction
 *       destroy() {},          // stop timers, listeners, animation frames
 *     };
 *   }
 */
import { h, announce } from '../core/dom.js';
import { makeRng } from '../core/rng.js';

const modules = new Map();

const VALID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function load(type) {
  if (!VALID.test(type)) return Promise.reject(new Error(`Invalid widget type "${type}"`));
  if (!modules.has(type)) {
    modules.set(type, import(`./${type}.js`).then((m) => {
      if (typeof m.default !== 'function') throw new Error(`Widget "${type}" must default-export a factory function`);
      return m.default;
    }).catch((err) => {
      modules.delete(type);
      throw new Error(`Could not load widget "${type}": ${err.message}`);
    }));
  }
  return modules.get(type);
}

const FOCUSABLE = '[tabindex], a[href], button, input, select, textarea, [role="button"], [role="slider"], [role="radio"], [role="checkbox"], [role="switch"], [role="gridcell"]';

/**
 * A picture (`role="img"`) hides everything inside it from assistive tech, so
 * an SVG that contains things you can focus or operate must be a group
 * instead. Widgets do not have to think about this: it is fixed up here.
 */
function syncSvgRoles(root) {
  for (const svg of root.querySelectorAll('svg[role="img"]')) {
    if (svg.querySelector(FOCUSABLE)) svg.setAttribute('role', 'group');
  }
}

/**
 * "Read-only" has to mean the same thing for a mouse, a keyboard and a
 * screen reader. Many widgets grey their buttons out with CSS when they are
 * frozen; this also switches the controls off for real, and back on again.
 */
function freezeControls(root, frozen) {
  for (const el of root.querySelectorAll('button, input, select, textarea')) {
    if (frozen) {
      if (!el.disabled) { el.disabled = true; el.dataset.frozen = '1'; }
    } else if (el.dataset.frozen) {
      el.disabled = false;
      delete el.dataset.frozen;
    }
  }
}

/** Warm the module cache for a widget type (fire and forget). */
export function preloadWidget(type) {
  load(type).catch(() => {});
}

/**
 * Create a widget instance from a spec. Always resolves: if the widget
 * fails to load or throws, a visible error box is returned instead so one
 * broken figure never takes a whole lesson down.
 */
export async function createWidget(spec, env = {}) {
  let root = null;
  let frozen = !!env.readOnly;
  let syncQueued = false;
  const sync = () => {
    if (!root || syncQueued) return;
    syncQueued = true;
    Promise.resolve().then(() => {
      syncQueued = false;
      if (!root) return;
      syncSvgRoles(root);
      if (frozen) freezeControls(root, true); // also catches controls a re-render has just created
    });
  };
  const onChange = env.onChange || (() => {});
  const fullEnv = {
    rng: env.rng || makeRng(),
    readOnly: !!env.readOnly,
    compact: !!env.compact,
    onChange: (state) => { sync(); return onChange(state); },
    announce: env.announce || announce,
  };
  try {
    const factory = await load(spec.type);
    const inst = factory(spec, fullEnv) || {};
    if (!(inst.el instanceof Node)) throw new Error(`Widget "${spec.type}" did not return an element`);
    inst.el.classList.add('widget', `widget-${spec.type}`);
    root = inst.el;
    syncSvgRoles(root);
    if (frozen) freezeControls(root, true);
    sync();
    if (spec.alt && !inst.el.getAttribute('aria-label')) {
      inst.el.setAttribute('role', inst.el.getAttribute('role') || 'group');
      inst.el.setAttribute('aria-label', spec.alt);
    }
    const wrap = spec.caption
      ? h('figure.widget-figure', inst.el, h('figcaption.widget-caption', spec.caption))
      : inst.el;
    return {
      type: spec.type,
      el: wrap,
      getState: inst.getState ? () => inst.getState() : () => ({}),
      setState: inst.setState ? (s) => { const out = inst.setState(s); sync(); return out; } : () => {},
      setReadOnly: (v) => {
        frozen = !!v;
        const out = inst.setReadOnly ? inst.setReadOnly(frozen) : undefined;
        if (root) freezeControls(root, frozen);
        sync();
        return out;
      },
      destroy: () => { root = null; if (inst.destroy) { try { inst.destroy(); } catch (err) { console.error(err); } } },
      ok: true,
    };
  } catch (err) {
    console.error('[widget]', spec && spec.type, err);
    return {
      type: spec && spec.type,
      el: h('div.widget-error', { role: 'alert' }, `This figure could not be shown (${err.message}).`),
      getState: () => ({}),
      setState: () => {},
      setReadOnly: () => {},
      destroy: () => {},
      ok: false,
      error: err,
    };
  }
}
