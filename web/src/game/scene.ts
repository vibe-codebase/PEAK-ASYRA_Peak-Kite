import Phaser from 'phaser';
import * as A from './art';
import { LEVELS, starsFor, type Level } from './levels';
import { bellAt, createState, crowAt, DT, pilot, rivalAt, RX, RY, step, VMAX, type Ev, type State } from './sim';
import { sound } from '../audio/sound';

export type Result = { time: number; par: number; stars: number; success: boolean; crashes: number; rung: number; total: number };
export type Finish = { level: Level; result: Result };
type Hooks = { onFinish?: (f: Finish) => void; onFirstAction?: () => void; onHaptic?: (s: 'light' | 'medium' | 'success' | 'warning') => void };
export type HudState = { rung: number; total: number; kites: number; time: number; started: boolean; done: boolean; left: boolean; right: boolean; next: number; ordered: boolean };

/** Bridge between React and the Phaser scene. */
export const sky = {
  hooks: {} as Hooks,
  scene: null as SkyScene | null,
  reducedMotion: false,
  show(mode: 'menu' | 'play', level: Level) { this.scene?.show(mode, level); },
  setPaused(p: boolean) { this.scene?.setPaused(p); },
  state(): HudState | null { return this.scene?.hudState() ?? null; },
  debug() { return this.scene?.debugState(); },
  /** QA only: let the steady pilot fly. */
  qaAuto(on: boolean) { if (this.scene) this.scene.auto = on; },
  /** QA only: CSS x of the left and right halves. */
  qaSides() { return this.scene?.qaSides(); },
};
(window as unknown as { __sky: typeof sky }).__sky = sky;

const VIEW_W = 360;
const SHOWCASE = ['f8', 'd5', 'n6', 'd3', 'n2'];

type TailPt = { x: number; y: number; px: number; py: number };

export class SkyScene extends Phaser.Scene {
  level: Level = LEVELS[0];
  auto = false;
  private mode: 'menu' | 'play' = 'menu';
  private paused = false;
  private finished = false;
  private started = false;
  private texSeq = 0;
  private r = 2;
  private viewW = VIEW_W;
  private viewH = 700;
  private s!: State;
  private acc = 0;
  private clock = 0;
  private endT = -1;
  private pointers = new Map<number, number>();
  private keys = { left: false, right: false };
  private win = { cx: 180, cy: 600, kx: 1, ky: 1 };
  private flyerY = 640;
  private kiteImg!: Phaser.GameObjects.Image;
  private bells: Phaser.GameObjects.Image[] = [];
  private bellTexts: Phaser.GameObjects.Text[] = [];
  private rivalImgs: Phaser.GameObjects.Image[] = [];
  private driftClouds: { img: Phaser.GameObjects.Image; v: number; w: number }[] = [];
  private g!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private tail: TailPt[] = [];
  private bursts: { x: number; y: number; t: number }[] = [];
  private strips: { x: number; y: number; vx: number; vy: number; t: number; a: number }[] = [];
  private sparks: { x: number; y: number; vx: number; vy: number; t: number; c: number }[] = [];
  private streaks: { x: number; y: number; l: number; s: number }[] = [];
  private rain: { x: number; y: number }[] = [];

  constructor() { super('sky'); }

  create() {
    sky.scene = this;
    this.input.addPointer(1);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.down(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (this.pointers.has(p.id)) this.pointers.set(p.id, p.x); });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.pointers.delete(p.id));
    this.input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.pointers.delete(p.id));
    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown-LEFT', () => { this.keys.left = true; this.begin(); }); kb.on('keyup-LEFT', () => (this.keys.left = false));
      kb.on('keydown-RIGHT', () => { this.keys.right = true; this.begin(); }); kb.on('keyup-RIGHT', () => (this.keys.right = false));
    }
    this.scale.on('resize', () => this.rebuild());
    this.show('menu', LEVELS.find((l) => l.id === SHOWCASE[0])!);
  }
  isMenu() { return this.mode === 'menu'; }
  setPaused(p: boolean) { this.paused = p; this.pointers.clear(); }
  private sides() {
    let left = this.keys.left, right = this.keys.right;
    const half = this.scale.width / 2;
    for (const x of this.pointers.values()) { if (x < half) left = true; else right = true; }
    return { left, right };
  }
  hudState(): HudState {
    const { left, right } = this.sides(), s = this.s;
    return { rung: s.rung.filter(Boolean).length, total: s.rung.length, kites: s.kites, time: Math.floor(s.t * 10) / 10, started: this.started, done: this.finished, left, right, next: s.next, ordered: this.level.ordered };
  }
  debugState() { return { ...this.hudState(), mode: this.mode, kite: { ...this.s.kite }, crashes: this.s.crashes, won: this.s.won }; }
  qaSides() { const w = this.game.canvas.clientWidth || VIEW_W; return { left: w * 0.2, right: w * 0.8, y: (this.game.canvas.clientHeight || 700) * 0.6 }; }

  show(mode: 'menu' | 'play', level: Level) {
    this.mode = mode;
    this.level = level;
    this.paused = false; this.finished = false; this.endT = -1; this.acc = 0;
    this.started = mode === 'menu';
    this.s = createState(level);
    this.pointers.clear();
    this.bursts = []; this.strips = []; this.sparks = [];
    this.rebuild();
  }
  private begin() {
    if (this.mode !== 'play' || this.started || this.paused) return;
    this.started = true;
    sky.hooks.onFirstAction?.();
    sound.launch();
  }

  // ── layout ────────────────────────────────────────────────────────────
  private tex(prefix: string, c: HTMLCanvasElement) { const k = `${prefix}-${++this.texSeq}`; this.textures.addCanvas(k, c); return k; }
  private S(x: number, y: number): [number, number] { return [this.win.cx + x * this.win.kx, this.win.cy - y * this.win.ky]; }
  private rebuild() {
    const stale = this.textures.getTextureKeys().filter((k) => /-\d+$/.test(k));
    this.tweens.killAll();
    this.children.removeAll(true);
    if (stale.length) this.events.once('postrender', () => stale.forEach((k) => this.textures.exists(k) && this.textures.remove(k)));
    const pw = this.scale.width, ph = this.scale.height, dpr = Math.min(2, window.devicePixelRatio || 1);
    const zoom = Math.min(pw / VIEW_W, ph / 620);
    this.r = Math.min(2, Math.max(1, zoom));
    this.viewW = pw / zoom; this.viewH = ph / zoom;
    const css = zoom / dpr, top = (this.mode === 'play' ? 74 : 40) / css, bottom = (this.mode === 'play' ? 70 : 150) / css;
    this.cameras.main.setZoom(zoom).centerOn(this.viewW / 2, this.viewH / 2);
    const l = this.level, m = A.MOODS[l.chapter], r = this.r, W = this.viewW, H = this.viewH;
    this.flyerY = H - bottom - 4;
    const cy = this.flyerY - 34, rx = Math.min(W / 2 - 12, 178), ry = Math.max(260, Math.min(cy - top - 26, 560));
    this.win = { cx: W / 2, cy, kx: rx / RX, ky: ry / RY };
    this.add.image(0, 0, this.tex('sky', A.sky(m, W, H, Math.min(r, 1.5), 3 + l.chapter))).setOrigin(0, 0).setScale(1 / Math.min(r, 1.5));
    // high clouds drifting by
    this.driftClouds = [0, 1, 2].map((k) => {
      const w = 110 + k * 40, h = w * 0.42, img = this.add.image((k * 157) % W, H * (0.12 + k * 0.17), this.tex('cloud', A.cloud(m, w, h, r, 11 + k * 7 + l.chapter))).setScale(1 / r).setAlpha(m.night ? 0.5 : 0.85);
      return { img, v: 4 + k * 2.5, w };
    });
    // the land, and the hill the flyer stands on
    const landH = Math.max(120, H - cy + 70);
    this.add.image(0, H - landH, this.tex('land', A.land(m, W, landH, r, 5 + l.chapter))).setOrigin(0, 0).setScale(1 / r);
    for (const [k, t] of l.trees.entries()) {
      const [x0] = this.S(t.x - t.w / 2, 0), [x1] = this.S(t.x + t.w / 2, 0), [, ytop] = this.S(0, t.h);
      const w = (x1 - x0) * 1.05, h = this.win.cy - ytop + 24;
      this.add.image((x0 + x1) / 2, this.win.cy + 24, this.tex('pine', A.pine(m, w, h, r, 7 + k))).setOrigin(0.5, 1).setScale(1 / r);
    }
    // rain clouds over their zones
    for (const [k, c] of l.clouds.entries()) {
      const w = c.rx * this.win.kx * 2.9, h = w * 0.5, [x, y] = this.S(c.x, c.y + c.ry * 0.85);
      this.add.image(x, y, this.tex('rain', A.cloud(m, w, h, r, 31 + k, true))).setScale(1 / r).setAlpha(0.95).setDepth(6);
    }
    this.rain = Array.from({ length: l.clouds.length * 26 }, () => ({ x: Math.random(), y: Math.random() }));
    this.add.image(W / 2, this.flyerY + 2, this.tex('flyer', A.flyer(m, r))).setOrigin(0.5, 1).setScale(1 / r).setDepth(3);
    // bells
    const bellKey = this.tex("bell", A.bell(m, r * 1.15, m.night));
    this.bells = l.bells.map(() => this.add.image(0, 0, bellKey).setOrigin(0.5, 0.06).setScale(1 / r).setDepth(5));
    this.bellTexts = l.bells.map((_, i) => this.add.text(0, 0, String(i + 1), { fontFamily: 'Nunito, sans-serif', fontSize: `${12 * r}px`, fontStyle: '800', color: '#3a2a1a' }).setOrigin(0.5).setScale(1 / r).setDepth(7).setVisible(l.ordered));
    // rival kites
    const rivalMood: A.Mood = { ...m, sail: m.night ? ['#4a8f6a', '#e6d36a', '#20304a'] : ['#2f8a5a', '#f0d040', '#3a2a20'] };
    const rk = this.tex('rival', A.kite(rivalMood, r));
    this.rivalImgs = l.rivals.map(() => this.add.image(0, 0, rk).setScale(0.85 / r).setDepth(8));
    this.g = this.add.graphics().setDepth(9);
    this.kiteImg = this.add.image(0, 0, this.tex("kite", A.kite(m, r * 1.25))).setScale(1 / r).setDepth(10);
    this.fx = this.add.graphics().setDepth(12);
    const [kx, ky] = this.S(this.s.kite.x, this.s.kite.y);
    this.tail = Array.from({ length: 16 }, (_, k) => ({ x: kx, y: ky + k * 4, px: kx, py: ky + k * 4 }));
    this.streaks = Array.from({ length: 14 }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.8, l: 20 + Math.random() * 40, s: 0.5 + Math.random() }));
  }

  // ── input ─────────────────────────────────────────────────────────────
  private down(p: Phaser.Input.Pointer) {
    if (this.mode !== 'play' || this.paused || this.finished) return;
    this.pointers.set(p.id, p.x);
    this.begin();
  }

  // ── each frame ───────────────────────────────────────────────────────
  update(_t: number, dms: number) {
    const dt = Math.min(0.05, dms / 1000);
    this.clock += dt;
    const l = this.level, s = this.s;
    const control = () => {
      if (this.mode === 'menu' || this.auto) return pilot(l, s);
      const { left, right } = this.sides();
      return (left ? -1 : 0) + (right ? 1 : 0);
    };
    if (!this.paused && this.started && !s.done) {
      this.acc += dt;
      const evs: Ev[] = [];
      while (this.acc >= DT) { this.acc -= DT; step(l, s, control(), evs); if (s.done) break; }
      for (const e of evs) this.event(e);
    }
    if (this.mode === 'menu' && s.done && this.endT < 0) this.endT = this.clock;
    if (this.mode === 'menu' && this.endT >= 0 && this.clock - this.endT > 2.5) {
      const i = (SHOWCASE.indexOf(l.id) + 1) % SHOWCASE.length;
      this.show('menu', LEVELS.find((x) => x.id === SHOWCASE[i])!);
      return;
    }
    if (this.mode === 'play' && s.done && this.endT < 0) this.endT = this.clock;
    if (this.mode === 'play' && this.endT >= 0 && !this.finished && this.clock - this.endT > (s.won ? 1.6 : 1.2)) {
      this.finished = true;
      const t = Math.round(s.t * 10) / 10;
      sky.hooks.onFinish?.({ level: l, result: { time: t, par: l.par, stars: s.won ? starsFor(t, l.par, s.crashes) : 0, success: s.won, crashes: s.crashes, rung: s.rung.filter(Boolean).length, total: s.rung.length } });
    }
    sound.setFlight(this.started && s.crashT < 0 && !s.done && !this.paused ? s.kite.v / VMAX : 0);
    this.draw(dt);
  }
  private reduced() { return sky.reducedMotion; }
  private event(e: Ev) {
    const s = this.s;
    if (e.type === 'bell') {
      const [bx, by] = bellAt(this.level.bells[e.i], s.t), [x, y] = this.S(bx, by);
      this.bursts.push({ x, y: y + 10, t: 0 });
      this.strips.push({ x, y: y + 30, vx: 30 + Math.random() * 30, vy: -40, t: 0, a: 0 });
      if (!this.reduced()) for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; this.sparks.push({ x, y: y + 10, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, t: 0, c: 0xfff1c4 }); }
      const img = this.bells[e.i];
      this.tweens.add({ targets: img, scale: 1.4 / this.r, alpha: 0, duration: 450, ease: 'Quad.easeOut' });
      this.bellTexts[e.i].setVisible(false);
      sound.bell(e.n - 1, this.level.bells.length, this.level.ordered);
      sky.hooks.onHaptic?.('light');
    } else if (e.type === 'crash') {
      sound.crash(e.why); sky.hooks.onHaptic?.('warning');
      if (e.why === 'crow') sound.caw();
    } else if (e.type === 'launch') sound.launch();
    else if (e.type === 'won') { sound.finish(starsFor(s.t, this.level.par, s.crashes)); sky.hooks.onHaptic?.('success'); }
    else if (e.type === 'lost') sound.lost();
  }

  private draw(dt: number) {
    const s = this.s, l = this.level, g = this.g, fx = this.fx, m = A.MOODS[l.chapter], t = s.t, W = this.viewW;
    g.clear(); fx.clear();
    const rm = this.reduced();
    for (const c of this.driftClouds) { if (!rm) c.img.x += c.v * dt; if (c.img.x - c.w / 2 > W + 10) c.img.x = -c.w / 2 - 10; }
    // the wind: faint streaks, quicker in a gust
    if (!rm) for (const k of this.streaks) {
      k.x += (30 + 50 * s.wind) * k.s * dt; k.y -= 6 * dt;
      if (k.x > W + 50) { k.x = -60; k.y = Math.random() * this.viewH * 0.75; }
      fx.lineStyle(1, 0xffffff, (m.night ? 0.06 : 0.14) * k.s * Math.min(1.6, s.wind)); fx.lineBetween(k.x, k.y, k.x + k.l, k.y - 2);
    }
    // the window's edge, faintly
    g.lineStyle(1, 0xffffff, m.night ? 0.12 : 0.22);
    for (let a = 0.04; a < Math.PI - 0.04; a += 0.05) { const [x, y] = this.S(Math.cos(a) * RX, Math.sin(a) * RY); g.fillStyle(0xffffff, m.night ? 0.16 : 0.3); g.fillCircle(x, y, 0.9); }
    // rain under the clouds
    for (const [k, c] of l.clouds.entries()) {
      for (let j = 0; j < 26; j++) {
        const d = this.rain[k * 26 + j]; if (!rm) d.y = (d.y + dt * 1.6) % 1;
        const ang = d.x * Math.PI * 2, rr = Math.sqrt((d.x * 7.3) % 1);
        const [x, y] = this.S(c.x + Math.cos(ang) * c.rx * rr, c.y + c.ry * 0.6 - d.y * c.ry * 1.5);
        fx.lineStyle(1, m.night ? 0x9fb0e0 : 0x7d8bb0, 0.5 * Math.sin(d.y * Math.PI)); fx.lineBetween(x, y, x - 1.5, y + 7);
      }
    }
    // bells
    l.bells.forEach((b, i) => {
      const img = this.bells[i];
      if (s.rung[i]) return;
      const [bx, by] = bellAt(b, t + (this.started ? 0 : this.clock)), [x, y] = this.S(bx, by);
      const isNext = !l.ordered || i === s.next;
      img.setPosition(x, y - 10).setRotation(Math.sin(this.clock * 2.2 + i) * 0.12 * (rm ? 0 : 1)).setAlpha(isNext ? 1 : 0.42);
      this.bellTexts[i].setPosition(x, y - 3).setAlpha(isNext ? 1 : 0.6);
      if (l.ordered && i === s.next) { const e = (this.clock % 1.2) / 1.2; fx.lineStyle(1.5, m.night ? 0xffd68a : 0xffffff, 0.8 * (1 - e)); fx.strokeCircle(x, y + 2, 12 + e * 14); }
    });
    // crows
    for (const cr of l.crows) {
      const [cx, cy] = crowAt(cr, t + (this.started ? 0 : this.clock)), [x, y] = this.S(cx, cy), f = Math.sin(this.clock * 12 + cr.phase) * (rm ? 0.3 : 1), d = cr.dir;
      g.fillStyle(m.night ? 0x05060f : 0x15131a, 1);
      g.fillEllipse(x, y, 16, 6);
      g.fillTriangle(x + 7 * d, y - 2, x + 12 * d, y, x + 7 * d, y + 2);
      g.fillTriangle(x - 7 * d, y, x - 13 * d, y - 3, x - 12 * d, y + 3);
      g.fillTriangle(x - 3, y - 1, x + 4, y - 1, x - 4 * d, y - 10 * f - 2);
      g.fillTriangle(x - 3, y + 1, x + 4, y + 1, x - 2 * d, y - 7 * f + 1);
    }
    // rival kites on their lines
    l.rivals.forEach((rv, i) => {
      const [rx, ry] = rivalAt(rv, t + (this.started ? 0 : this.clock)), [x, y] = this.S(rx, ry), img = this.rivalImgs[i];
      const ang = Math.atan2(-Math.cos(t * rv.w + rv.phase) * this.win.ky, -Math.sin(t * rv.w + rv.phase) * this.win.kx) * (rv.w >= 0 ? 1 : -1);
      img.setPosition(x, y).setRotation(rv.r > 0 ? ang + Math.PI / 2 : Math.sin(this.clock) * 0.15);
      const ax = i % 2 ? W + 10 : -10, ay = this.flyerY + 10;
      g.lineStyle(0.8, m.night ? 0xc8d0f0 : 0x333344, 0.45); g.beginPath(); g.moveTo(x, y + 8); g.lineTo((x + ax) / 2, (y + ay) / 2 + 30); g.lineTo(ax, ay); g.strokePath();
    });
    // the kite, its tail, and its two lines
    const k = s.kite, [kx, ky] = this.S(k.x, k.y);
    const hover = !this.started ? Math.sin(this.clock * 2) * 3 : 0;
    const sdx = Math.cos(k.h) * this.win.kx, sdy = -Math.sin(k.h) * this.win.ky, ang = Math.atan2(sdy, sdx);
    const wob = rm ? 0 : Math.sin(this.clock * 9) * 0.04;
    this.kiteImg.setPosition(kx, ky + hover).setRotation(ang + Math.PI / 2 + wob);
    const tailX = kx - Math.cos(ang) * 13, tailY = ky + hover - Math.sin(ang) * 13;
    // tail: a chain pulled behind the kite, falling a little
    this.tail[0].x = tailX; this.tail[0].y = tailY;
    for (let i = 1; i < this.tail.length; i++) {
      const p = this.tail[i], vx = (p.x - p.px) * 0.9, vy = (p.y - p.py) * 0.9;
      p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + 18 * dt * dt * 60;
    }
    for (let it = 0; it < 3; it++) for (let i = 1; i < this.tail.length; i++) {
      const a = this.tail[i - 1], b = this.tail[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 4.2) / d;
      if (i > 1) { a.x += dx * f * 0.5; a.y += dy * f * 0.5; } b.x -= dx * f * (i > 1 ? 0.5 : 1); b.y -= dy * f * (i > 1 ? 0.5 : 1);
    }
    const [c1, c2] = [Phaser.Display.Color.HexStringToColor(m.sail[0]).color, Phaser.Display.Color.HexStringToColor(m.sail[1]).color];
    for (const [off, col] of [[-1.6, c1], [1.6, c2]] as const) {
      g.lineStyle(2.2, col, 0.95); g.beginPath();
      this.tail.forEach((p, i) => { const w = Math.sin(this.clock * 8 + i * 0.7) * (rm ? 0 : 1.2); if (i === 0) g.moveTo(p.x + off, p.y); else g.lineTo(p.x + off + w, p.y); });
      g.strokePath();
    }
    const hx = W / 2, hy = this.flyerY - 34, slack = (s.crashT >= 0 ? 1 : 1 - k.v / VMAX) * 22 + 4;
    g.lineStyle(0.9, Phaser.Display.Color.ValueToColor(m.night ? '#dfe4ff' : '#2a2a35').color, m.night ? 0.55 : 0.6);
    for (const side of [-1, 1]) {
      const wx = kx + Math.cos(ang + Math.PI / 2 * side) * 16 * -1 + Math.cos(ang) * -6, wy = ky + hover + Math.sin(ang + Math.PI / 2 * side) * 16 * -1 + Math.sin(ang) * -6;
      const ex = hx + side * 7, mx = (wx + ex) / 2, my = (wy + hy) / 2 + slack;
      g.beginPath(); g.moveTo(ex, hy);
      for (let j = 1; j <= 16; j++) { const u = j / 16, x = (1 - u) * (1 - u) * ex + 2 * u * (1 - u) * mx + u * u * wx, y = (1 - u) * (1 - u) * hy + 2 * u * (1 - u) * my + u * u * wy; g.lineTo(x, y); }
      g.strokePath();
    }
    // bursts where bells rang
    this.bursts = this.bursts.filter((b) => (b.t += dt) < 0.9);
    for (const b of this.bursts) { const e = b.t / 0.9; fx.lineStyle(2, 0xffffff, 0.8 * (1 - e)); fx.strokeCircle(b.x, b.y, 8 + e * 34); fx.lineStyle(1, m.night ? 0xffd68a : 0xfff1c4, 0.6 * (1 - e)); fx.strokeCircle(b.x, b.y, 4 + e * 22); }
    this.strips = this.strips.filter((p) => (p.t += dt) < 1.6);
    for (const p of this.strips) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 50 * dt; p.a += dt * 6; fx.fillStyle(0xf6efe0, 1 - p.t / 1.6); fx.fillRect(p.x - 2, p.y - 6 + Math.sin(p.a) * 2, 4, 12); }
    this.sparks = this.sparks.filter((p) => (p.t += dt) < 0.7);
    for (const p of this.sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; fx.fillStyle(p.c, 1 - p.t / 0.7); fx.fillCircle(p.x, p.y, 1.5); }
    // the ground the kite must not touch, shown only as a faint line in play
    if (this.mode === 'play' && !this.started) {
      const e = (this.clock % 1.6) / 1.6;
      fx.lineStyle(1.5, 0xffffff, 0.5 * (1 - e)); fx.strokeCircle(kx, ky + hover, 16 + e * 16);
    }
  }
}

export function startGame(parent: HTMLElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#9cc3dc',
    scale: { mode: Phaser.Scale.NONE, width: parent.clientWidth * dpr, height: parent.clientHeight * dpr, zoom: 1 / dpr },
    render: { antialias: true, pixelArt: false, powerPreference: 'high-performance' },
    audio: { noAudio: true },
    fps: { target: 60, smoothStep: false },
    input: { activePointers: 2 },
    scene: [SkyScene],
    banner: false,
  });
  const onResize = () => {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    game.scale.setZoom(1 / d);
    game.scale.resize(parent.clientWidth * d, parent.clientHeight * d);
  };
  window.addEventListener('resize', onResize);
  return () => { window.removeEventListener('resize', onResize); game.destroy(true); };
}
