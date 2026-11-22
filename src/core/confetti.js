/**
 * Canvas confetti for the moments that deserve it. Skipped entirely when the
 * learner prefers reduced motion.
 */
import { reducedMotion } from './dom.js';

const COLORS = ['#FF8A1F', '#FFC53D', '#2BB673', '#3D8BFD', '#8A63F5', '#F0569A', '#17B3A6'];

/**
 * @param {{ count?: number, origin?: {x:number,y:number}, spread?: number, duration?: number }} [opts]
 *   origin is in viewport fractions (0–1); default is a burst from the lower middle.
 */
export function confetti(opts = {}) {
  if (reducedMotion()) return;
  const { count = 120, origin = { x: 0.5, y: 0.65 }, spread = 1, duration = 2600 } = opts;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  document.body.appendChild(canvas);
  const g = canvas.getContext('2d');
  g.scale(dpr, dpr);

  const parts = [];
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9 * spread;
    const speed = 7 + Math.random() * 11;
    parts.push({
      x: origin.x * W + (Math.random() - 0.5) * 40,
      y: origin.y * H,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 7,
      h: 4 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      shape: Math.random() < 0.25 ? 'dot' : 'rect',
      wobble: Math.random() * Math.PI * 2,
    });
  }

  const start = performance.now();
  let last = start;
  function frame(now) {
    const dt = Math.min(2.5, (now - last) / 16.67);
    last = now;
    const life = (now - start) / duration;
    g.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.32 * dt;
      p.vx *= Math.pow(0.985, dt);
      p.vy *= Math.pow(0.985, dt);
      p.x += p.vx * dt + Math.sin(p.wobble + now / 180) * 0.6;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      g.save();
      g.globalAlpha = Math.max(0, life > 0.7 ? 1 - (life - 0.7) / 0.3 : 1);
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.fillStyle = p.color;
      if (p.shape === 'dot') { g.beginPath(); g.arc(0, 0, p.h * 0.7, 0, Math.PI * 2); g.fill(); }
      else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.6 + 0.4 * Math.cos(p.rot * 2)));
      g.restore();
    }
    if (life < 1) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
