// Deep-sea backdrop for the landing page: light shafts, marine snow, bubbles,
// and a procedurally animated eel with a glowing tail lure (after Huntail).
// One fixed canvas, no dependencies. The eel wanders, circles the pointer when
// it moves, and lunges at clicks.

type Vec = { x: number; y: number };
type RGB = [number, number, number];

interface Mote {
  x: number;
  y: number;
  z: number; // 0.25 (far) .. 1 (near): size, brightness, parallax
  r: number;
  ph: number;
}
interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  ph: number;
  life: number;
}

const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const rgb = (a: RGB, b: RGB, t: number) =>
  `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;

// Water colour at the top and bottom of the viewport, at the surface and at depth.
const SURFACE_TOP: RGB = [16, 78, 112];
const SURFACE_BOT: RGB = [5, 26, 46];
const DEEP_TOP: RGB = [3, 15, 28];
const DEEP_BOT: RGB = [1, 4, 9];
// Depth (m) at which the water is fully dark and the surface light is gone.
const DARK_AT_M = 900;
const RAYS_GONE_M = 350;

// Distant bioluminescence that takes over once the surface light is gone: [colour, x/y drift phase].
const AMBIENT: [RGB, number][] = [
  [[60, 150, 220], 0],
  [[40, 190, 180], 2.1],
  [[110, 110, 230], 4.2],
];

// Half-width of the body along its length, in px at scale 1 (t: 0 = snout, 1 = tail).
const PROFILE: [number, number][] = [
  [0, 8],
  [0.035, 17],
  [0.075, 20],
  [0.12, 13.5],
  [0.2, 15.5],
  [0.38, 14.5],
  [0.62, 9.5],
  [0.86, 4],
  [1, 2.2],
];
function profile(t: number) {
  for (let i = 1; i < PROFILE.length; i++) {
    const [t1, w1] = PROFILE[i];
    if (t <= t1) {
      const [t0, w0] = PROFILE[i - 1];
      return lerp(w0, w1, (t - t0) / (t1 - t0));
    }
  }
  return PROFILE[PROFILE.length - 1][1];
}

// Closed path through `pts`, smoothed with quadratic curves between midpoints.
function smoothClosed(pts: Vec[]) {
  const p = new Path2D();
  const n = pts.length;
  const mid = (a: Vec, b: Vec) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = mid(pts[n - 1], pts[0]);
  p.moveTo(start.x, start.y);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    p.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y);
  }
  p.closePath();
  return p;
}

class Eel {
  readonly n = 46;
  k = 1;
  seg = 9;
  pts: Vec[];
  angle = 0;
  speed = 60;
  phase = 0;
  mouth = 0;
  lunge = 0;
  orbit = 0;
  target: Vec;
  retargetAt = 0;
  nextBubbleAt = 3;
  alpha = 1;
  // Where to wander next; replaced by the scene so the eel can keep clear of text.
  pick: () => Vec = () => this.target;

  constructor(x: number, y: number, k: number) {
    this.setScale(k);
    this.pts = Array.from({ length: this.n }, (_, i) => ({ x: x - i * this.seg, y }));
    this.target = { x, y };
  }

  setScale(k: number) {
    this.k = k;
    this.seg = 9 * k;
  }

  get head() {
    return this.pts[0];
  }

  // Tail lure centre, and the direction it points (away from the body).
  lure(): { c: Vec; dir: Vec } {
    const a = this.pts[this.n - 2];
    const b = this.pts[this.n - 1];
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const dir = { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
    const r = 17 * this.k;
    return { c: { x: b.x + dir.x * r, y: b.y + dir.y * r }, dir };
  }

  strike(p: Vec) {
    this.target = { ...p };
    this.lunge = 0.75;
  }

  update(dt: number, now: number, pointer: Vec | null, bubbles: Bubble[]) {
    const k = this.k;
    const head = this.head;

    if (this.lunge > 0) {
      if (Math.hypot(this.target.x - head.x, this.target.y - head.y) < 26 * k) this.lunge = 0;
    } else if (pointer) {
      // Curious, not hungry: circle the light at a distance.
      this.orbit += dt * 0.7;
      const r = 110 * k;
      this.target = { x: pointer.x + Math.cos(this.orbit) * r, y: pointer.y + Math.sin(this.orbit) * r * 0.7 };
    } else if (now > this.retargetAt || Math.hypot(this.target.x - head.x, this.target.y - head.y) < 70 * k) {
      this.target = this.pick();
      this.retargetAt = now + rand(5, 10);
    }

    const desired = Math.atan2(this.target.y - head.y, this.target.x - head.x);
    const turn = (this.lunge > 0 ? 5.5 : 1.7) * dt;
    this.angle += clamp(wrapAngle(desired - this.angle), -turn, turn);

    const cruise = (pointer ? 95 : 62) * k * (0.8 + 0.2 * Math.sin(now * 0.37));
    const want = this.lunge > 0 ? 430 * k : cruise;
    this.speed = lerp(this.speed, want, 1 - Math.exp(-dt * (this.lunge > 0 ? 7 : 1.4)));

    // The head swims a sine; the chain behind it traces the path, which is what makes it an eel.
    this.phase += dt * (1.7 + this.speed / (55 * k));
    const wig = Math.sin(this.phase) * (this.lunge > 0 ? 0.12 : 0.36);
    head.x += Math.cos(this.angle + wig) * this.speed * dt;
    head.y += Math.sin(this.angle + wig) * this.speed * dt;
    for (let i = 1; i < this.n; i++) {
      const p = this.pts[i];
      const q = this.pts[i - 1];
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const d = Math.hypot(dx, dy) || 1;
      p.x = q.x + (dx / d) * this.seg;
      p.y = q.y + (dy / d) * this.seg;
    }

    this.lunge = Math.max(0, this.lunge - dt);
    this.mouth = lerp(this.mouth, this.lunge > 0 ? 1 : 0, 1 - Math.exp(-dt * 10));

    if (now > this.nextBubbleAt) {
      this.nextBubbleAt = now + rand(3, 7);
      for (let i = 0; i < 3; i++) {
        bubbles.push({
          x: head.x + rand(-4, 4) * k,
          y: head.y - i * 7 * k,
          r: rand(1.5, 3.2) * k,
          vy: rand(28, 45),
          ph: rand(0, TAU),
          life: 9,
        });
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, now: number) {
    const { k, n, pts } = this;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    const fwd: Vec[] = [];
    const nrm: Vec[] = [];
    const wid: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n - 1, i + 1)];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const f = { x: (a.x - b.x) / d, y: (a.y - b.y) / d };
      fwd.push(f);
      nrm.push({ x: -f.y, y: f.x });
      wid.push(profile(i / (n - 1)) * k * (i < 4 ? 1 + this.mouth * 0.12 : 1));
    }
    const at = (i: number, side: number, w: number) => ({
      x: pts[i].x + nrm[i].x * side * w,
      y: pts[i].y + nrm[i].y * side * w,
    });
    const outline = (extra: (t: number) => number) => {
      const left: Vec[] = [];
      const right: Vec[] = [];
      for (let i = 0; i < n; i++) {
        const w = wid[i] + extra(i / (n - 1));
        left.push(at(i, 1, w));
        right.push(at(i, -1, w));
      }
      const snout = { x: pts[0].x + fwd[0].x * wid[0] * 1.1, y: pts[0].y + fwd[0].y * wid[0] * 1.1 };
      const tail = pts[n - 1];
      return smoothClosed([snout, ...left, tail, ...right.reverse()]);
    };

    // Ribbon fin along the back half, rippling against the swim.
    ctx.fillStyle = 'rgba(110, 165, 240, 0.22)';
    ctx.fill(
      outline((t) =>
        t < 0.22 || t > 0.97 ? 0 : Math.sin((Math.PI * (t - 0.22)) / 0.75) * 7 * k * (0.7 + 0.3 * Math.sin(this.phase * 2 - t * 14)),
      ),
    );

    // Pectoral fins.
    const fi = 6;
    for (const side of [1, -1]) {
      const th = 0.75 + 0.3 * Math.sin(this.phase * 1.4 + (side > 0 ? 0 : Math.PI));
      const dir = {
        x: -fwd[fi].x * Math.cos(th) + nrm[fi].x * side * Math.sin(th),
        y: -fwd[fi].y * Math.cos(th) + nrm[fi].y * side * Math.sin(th),
      };
      const base = at(fi, side, wid[fi] * 0.7);
      const len = 24 * k;
      ctx.save();
      ctx.translate(base.x, base.y);
      ctx.rotate(Math.atan2(dir.y, dir.x));
      ctx.beginPath();
      ctx.ellipse(len * 0.5, 0, len * 0.5, 7 * k, 0, 0, TAU);
      ctx.fillStyle = 'rgba(105, 160, 230, 0.62)';
      ctx.fill();
      ctx.restore();
    }

    // Body, back stripe, rim light.
    const body = outline(() => 0);
    ctx.fillStyle = '#2f63ab';
    ctx.fill(body);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1b3d73';
    for (let i = 2; i < n - 3; i++) {
      ctx.lineWidth = wid[i] * 0.95;
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      ctx.stroke();
    }
    ctx.lineWidth = 1.4 * k;
    ctx.strokeStyle = 'rgba(165, 210, 255, 0.35)';
    ctx.stroke(body);

    // Bioluminescent spots, alternating sides.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 7, s = 1; i < n * 0.8; i += 3, s = -s) {
      const p = at(i, s, wid[i] * 0.48);
      const glow = 0.45 + 0.35 * Math.sin(now * 1.8 - i * 0.35);
      ctx.beginPath();
      ctx.arc(p.x, p.y, wid[i] * 0.2 + 0.6 * k, 0, TAU);
      ctx.fillStyle = `rgba(150, 215, 255, ${glow})`;
      ctx.fill();
    }
    ctx.restore();

    // Jaws.
    const jaw = at(0, 0, 0);
    ctx.save();
    ctx.translate(jaw.x + fwd[0].x * wid[0] * 0.55, jaw.y + fwd[0].y * wid[0] * 0.55);
    ctx.rotate(Math.atan2(fwd[0].y, fwd[0].x));
    if (this.mouth > 0.05) {
      const open = this.mouth;
      ctx.beginPath();
      ctx.ellipse(0, 0, wid[1] * 0.55, wid[1] * 0.5 * open, 0, 0, TAU);
      ctx.fillStyle = '#050a14';
      ctx.fill();
      ctx.fillStyle = '#eaf4ff';
      for (const s of [1, -1]) {
        for (const off of [-0.25, 0.2]) {
          ctx.beginPath();
          ctx.moveTo(wid[1] * off, s * wid[1] * 0.5 * open);
          ctx.lineTo(wid[1] * (off + 0.12), s * wid[1] * 0.18 * open);
          ctx.lineTo(wid[1] * (off + 0.24), s * wid[1] * 0.5 * open);
          ctx.fill();
        }
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(-wid[1] * 0.3, 0);
      ctx.lineTo(wid[1] * 0.45, 0);
      ctx.strokeStyle = 'rgba(5, 12, 26, 0.6)';
      ctx.lineWidth = 1.3 * k;
      ctx.stroke();
    }
    ctx.restore();

    // Eyes.
    for (const side of [1, -1]) {
      const e = at(2, side, wid[2] * 0.66);
      ctx.beginPath();
      ctx.arc(e.x, e.y, 4.4 * k, 0, TAU);
      ctx.fillStyle = '#e6f3ff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e.x + fwd[2].x * 1.1 * k, e.y + fwd[2].y * 1.1 * k, 2.7 * k, 0, TAU);
      ctx.fillStyle = '#0a1424';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e.x + fwd[2].x * 1.8 * k - 0.6 * k, e.y + fwd[2].y * 1.8 * k - 0.8 * k, 0.9 * k, 0, TAU);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    // Tail lure: a little fish on the end of the tail.
    const { c, dir } = this.lure();
    const tip = pts[n - 1];
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(c.x - dir.x * 7 * k, c.y - dir.y * 7 * k);
    ctx.strokeStyle = '#2a5799';
    ctx.lineWidth = 2.2 * k;
    ctx.stroke();
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(Math.atan2(dir.y, dir.x));
    ctx.beginPath();
    ctx.moveTo(7 * k, 0);
    ctx.lineTo(14 * k, -5.5 * k);
    ctx.lineTo(14 * k, 5.5 * k);
    ctx.closePath();
    ctx.fillStyle = '#f2b956';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, 9 * k, 5.2 * k, 0, 0, TAU);
    ctx.fillStyle = '#ffd98a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-4.2 * k, -1.2 * k, 1.4 * k, 0, TAU);
    ctx.fillStyle = '#3b2700';
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}

interface Scene {
  eel?: boolean; // landing page only; other pages get the water without the eel
  meters?: [number, number]; // depth at the top and bottom of the scroll
  lost?: boolean; // depth unknown (404): the gauge shows ????
  gauge?: HTMLElement | null;
  hero?: HTMLElement | null; // while this is on screen the eel roams freely
  column?: HTMLElement | null; // text column to keep clear of once past the hero
}

export function startAbyss(
  canvas: HTMLCanvasElement,
  { eel: withEel = true, meters: [top, bottom] = [0, 1000], lost = false, gauge, hero, column }: Scene = {},
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0;
  let h = 0;
  let motes: Mote[] = [];
  const bubbles: Bubble[] = [];
  let pointer: Vec | null = null;
  let pointerAt = -Infinity;
  let now = 0;
  let lastGauge = '';

  const scale = () => clamp(Math.min(w, h) / 820, 0.55, 1.05);
  const eel = new Eel(-60, innerHeight * 0.38, 1);

  // 'open': anywhere on screen. 'gutters': left/right of the text column. 'dim': no room, so fade back.
  type Zone = 'open' | 'gutters' | 'dim';
  let zone: Zone = 'open';
  let gutters: [number, number][] = [];
  function updateZone() {
    const k = eel.k;
    const inHero = !hero || hero.getBoundingClientRect().bottom > h * 0.45;
    let next: Zone = 'open';
    gutters = [];
    if (!inHero && column) {
      const r = column.getBoundingClientRect();
      const pad = 40 * k;
      const min = 150 * k;
      if (r.left - pad >= min && w - r.right - pad >= min) {
        gutters = [
          [40 * k, r.left - pad],
          [r.right + pad, w - 40 * k],
        ];
        next = 'gutters';
      } else next = 'dim';
    }
    if (next !== zone) {
      zone = next;
      eel.retargetAt = 0; // pick a target that fits the new zone right away
    }
  }
  eel.pick = () => {
    const m = 90 * eel.k;
    const y = rand(m, Math.max(m, h - m));
    if (zone !== 'gutters') return { x: rand(m, Math.max(m, w - m)), y };
    // Finish a crossing before choosing again, so it never loiters over the text.
    const x = eel.head.x;
    const crossing = x > gutters[0][1] && x < gutters[1][0];
    if (crossing && gutters.some(([a, b]) => eel.target.x >= a && eel.target.x <= b)) return eel.target;
    // Mostly stay on the side it is already on; crossing over now and then.
    const side = x < w / 2 ? 0 : 1;
    const [a, b] = gutters[Math.random() < 0.88 ? side : 1 - side];
    return { x: rand(a, b), y };
  };

  function resize() {
    w = innerWidth;
    h = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(260, Math.round((w * h) / 6500));
    motes = Array.from({ length: count }, () => {
      const z = rand(0.25, 1);
      return { x: rand(0, w), y: rand(0, h), z, r: lerp(0.5, 1.9, z * z), ph: rand(0, TAU) };
    });
    eel.setScale(scale());
  }

  function depth() {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? clamp(scrollY / max, 0, 1) : 0;
  }

  function step(dt: number) {
    now += dt;
    const active = pointer && now - pointerAt < 3 ? pointer : null;
    if (withEel) {
      updateZone();
      eel.alpha = lerp(eel.alpha, zone === 'dim' && !active ? 0.3 : 1, 1 - Math.exp(-dt * 2));
      eel.update(dt, now, active, bubbles);
    }
    for (const m of motes) {
      m.y += (6 + 10 * m.z) * dt; // marine snow sinks
      m.x += Math.sin(now * 0.3 + m.ph) * 4 * m.z * dt;
      if (m.y > h + 4) m.y -= h + 8;
      if (m.x < -4) m.x += w + 8;
      if (m.x > w + 4) m.x -= w + 8;
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= b.vy * dt;
      b.x += Math.sin(now * 3 + b.ph) * 12 * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < -10) bubbles.splice(i, 1);
    }
  }

  function render() {
    const meters = lerp(top, bottom, depth());
    const dark = clamp(meters / DARK_AT_M, 0, 1);
    const k = eel.k;
    const sy = scrollY;

    const bg = ctx!.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, rgb(SURFACE_TOP, DEEP_TOP, dark));
    bg.addColorStop(1, rgb(SURFACE_BOT, DEEP_BOT, dark));
    ctx!.fillStyle = bg;
    ctx!.fillRect(0, 0, w, h);

    ctx!.save();
    ctx!.globalCompositeOperation = 'lighter';

    if (dark > 0.3) {
      const r = Math.max(w, h) * 0.45;
      for (const [[cr, cg, cb], ph] of AMBIENT) {
        const x = w * (0.5 + 0.42 * Math.sin(now * 0.021 + ph));
        const y = h * (0.5 + 0.38 * Math.sin(now * 0.017 + ph * 1.7));
        const a = 0.075 * (dark - 0.3) * (0.8 + 0.2 * Math.sin(now * 0.4 + ph));
        const g = ctx!.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${a})`);
        g.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx!.fillStyle = g;
        ctx!.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }

    // Light shafts from the surface, fading out as you descend.
    const rays = clamp(1 - meters / RAYS_GONE_M, 0, 1);
    if (rays > 0) {
      for (let i = 0; i < 5; i++) {
        const x = w * (0.08 + 0.21 * i) + Math.sin(now * 0.13 + i * 1.7) * 50;
        const top = -sy * 0.35 - 20;
        const len = h * 1.1;
        const g = ctx!.createLinearGradient(0, top, 0, top + len);
        g.addColorStop(0, `rgba(170, 225, 255, ${(w < 640 ? 0.05 : 0.07) * rays})`);
        g.addColorStop(1, 'rgba(170, 225, 255, 0)');
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.moveTo(x - 30, top);
        ctx!.lineTo(x + 30, top);
        ctx!.lineTo(x + 30 + len * 0.28, top + len);
        ctx!.lineTo(x - 30 + len * 0.12, top + len);
        ctx!.fill();
      }
    }

    // Marine snow, lit up near the lure.
    const { c: lure } = eel.lure();
    const reach = withEel ? 170 * k * eel.alpha : 0;
    for (const m of motes) {
      const y = (((m.y - sy * m.z * 0.25) % h) + h) % h;
      const dl = Math.hypot(m.x - lure.x, y - lure.y);
      const lit = dl < reach ? 1 - dl / reach : 0;
      const a = 0.1 + 0.32 * m.z + 0.6 * lit;
      ctx!.fillStyle = lit > 0 ? `rgba(255, 228, 170, ${a})` : `rgba(195, 228, 255, ${a})`;
      ctx!.beginPath();
      ctx!.arc(m.x, y, m.r, 0, TAU);
      ctx!.fill();
    }
    ctx!.restore();

    if (withEel) eel.draw(ctx!, now);

    ctx!.save();
    ctx!.globalCompositeOperation = 'lighter';
    if (withEel) {
      ctx!.globalAlpha = eel.alpha;
      const pulse = 0.85 + 0.15 * Math.sin(now * 2.1) + 0.25 * eel.mouth;
      const glow = ctx!.createRadialGradient(lure.x, lure.y, 0, lure.x, lure.y, 120 * k * pulse);
      glow.addColorStop(0, 'rgba(255, 210, 120, 0.42)');
      glow.addColorStop(0.25, 'rgba(255, 190, 90, 0.14)');
      glow.addColorStop(1, 'rgba(255, 170, 60, 0)');
      ctx!.fillStyle = glow;
      ctx!.fillRect(lure.x - 130 * k, lure.y - 130 * k, 260 * k, 260 * k);
      ctx!.globalAlpha = 1;
    }

    if (pointer && now - pointerAt < 3) {
      const fade = clamp(3 - (now - pointerAt), 0, 1);
      const pg = ctx!.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 60);
      pg.addColorStop(0, `rgba(150, 230, 255, ${0.16 * fade})`);
      pg.addColorStop(1, 'rgba(150, 230, 255, 0)');
      ctx!.fillStyle = pg;
      ctx!.fillRect(pointer.x - 60, pointer.y - 60, 120, 120);
    }
    ctx!.restore();

    ctx!.lineWidth = 1;
    for (const b of bubbles) {
      const a = clamp(b.life / 2, 0, 1) * 0.55;
      ctx!.strokeStyle = `rgba(205, 238, 255, ${a})`;
      ctx!.beginPath();
      ctx!.arc(b.x, b.y, b.r, 0, TAU);
      ctx!.stroke();
      ctx!.fillStyle = `rgba(235, 248, 255, ${a})`;
      ctx!.beginPath();
      ctx!.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, TAU);
      ctx!.fill();
    }

    if (gauge) {
      const text = lost ? '−???? m' : `−${String(Math.round(meters)).padStart(4, '0')} m`;
      if (text !== lastGauge) gauge.textContent = lastGauge = text;
    }
  }

  resize();
  addEventListener('resize', resize);

  if (still) {
    // Settle the eel into a natural curve off-screen, then draw a single frame.
    eel.pts.forEach((p, i) => ((p.x = w * 0.78 - i * eel.seg), (p.y = h * 0.2)));
    eel.target = { x: w * 0.95, y: h * 0.12 };
    eel.retargetAt = Infinity;
    if (withEel) for (let i = 0; i < 120; i++) step(1 / 60);
    render();
    addEventListener('resize', render);
    addEventListener('scroll', render, { passive: true });
    return;
  }

  eel.target = { x: w * 0.62, y: h * 0.42 };
  eel.retargetAt = 7;

  addEventListener(
    'pointermove',
    (e) => {
      pointer = { x: e.clientX, y: e.clientY };
      pointerAt = now;
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => (pointer = null));
  addEventListener(
    'pointerdown',
    (e) => {
      const p = { x: e.clientX, y: e.clientY };
      // Don't lunge at the thing being clicked; the bubbles are enough feedback there.
      const onControl = (e.target as Element | null)?.closest?.('a, button, summary, input, select, textarea, label');
      if (withEel && !onControl) eel.strike(p);
      for (let i = 0; i < 7; i++) {
        bubbles.push({
          x: p.x + rand(-10, 10),
          y: p.y + rand(-6, 6),
          r: rand(1.5, 4.5),
          vy: rand(35, 80),
          ph: rand(0, TAU),
          life: rand(3, 6),
        });
      }
    },
    { passive: true },
  );

  // Without the eel the water only drifts, so half the frame rate is plenty.
  const minGap = withEel ? 0 : 1000 / 30 - 2;
  let last = performance.now();
  const frame = (t: number) => {
    requestAnimationFrame(frame);
    if (t - last < minGap) return;
    step(Math.min(0.05, (t - last) / 1000));
    last = t;
    render();
  };
  requestAnimationFrame(frame);
}
