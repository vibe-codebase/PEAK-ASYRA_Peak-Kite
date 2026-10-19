/**
 * A two-line stunt kite in the wind window. The flyer stands at the foot of the window; the kite flies on
 * the end of its lines over a half-ellipse of sky (170 units to each side, 400 up). It always flies forward
 * along its nose. Fastest in the middle of the window, where the wind pulls hardest, it slows toward the
 * edge and cannot pass it: at the rim it slides along, nearly stalled. Pull on the left handle and it turns
 * left; pull on the right and it turns right. Touch the ground, a crow or another kite, and it falls.
 *
 * Everything here is in those canonical units, so a hill plays the same on every screen.
 */
export const RX = 170, RY = 400;
export const DT = 1 / 120;
export const VMAX = 175, VMIN = 55, TURN = 2.7;
export const KITE_R = 11;
export const KITES = 3;

export type Bell = { x: number; y: number; bob?: [number, number, number] };
export type Crow = { y: number; speed: number; dir: 1 | -1; phase: number; period: number; amp: number };
export type Rival = { x: number; y: number; r: number; w: number; phase: number };
export type Cloud = { x: number; y: number; rx: number; ry: number };
export type Tree = { x: number; w: number; h: number };
export type Course = { bells: Bell[]; crows: Crow[]; rivals: Rival[]; clouds: Cloud[]; trees: Tree[]; gust: number; ordered: boolean };

export type Kite = { x: number; y: number; h: number; v: number; down: number; turn: number };
export type State = {
  t: number; kite: Kite; kites: number; rung: boolean[]; next: number; crashT: number; crashes: number;
  done: boolean; won: boolean; wind: number; slow: boolean;
};
export type Ev = { type: 'bell'; i: number; n: number } | { type: 'crash'; why: 'ground' | 'crow' | 'rival' } | { type: 'launch' } | { type: 'won' } | { type: 'lost' };

export const LAUNCH: Kite = { x: 0, y: 70, h: Math.PI / 2, v: VMIN, down: 0, turn: 0 };
export function createState(c: Course): State {
  return { t: 0, kite: { ...LAUNCH }, kites: KITES, rung: c.bells.map(() => false), next: 0, crashT: -1, crashes: 0, done: false, won: false, wind: 1, slow: false };
}
/** Where things are at time t. */
export const bellAt = (b: Bell, t: number): [number, number] => (b.bob ? [b.x + Math.sin(t * b.bob[2]) * b.bob[0], b.y + Math.cos(t * b.bob[2] * 0.8) * b.bob[1]] : [b.x, b.y]);
export const crowAt = (c: Crow, t: number): [number, number] => {
  const span = 2 * (RX + 60), s = (((t + c.phase) % c.period) / c.period) * span - span / 2;
  return [c.dir * s, c.y + Math.sin(t * 2.2 + c.phase) * c.amp];
};
export const rivalAt = (r: Rival, t: number): [number, number] => [r.x + Math.cos(t * r.w + r.phase) * r.r, r.y + Math.sin(t * r.w + r.phase) * r.r * 0.8];
export const windAt = (c: Course, t: number) => 1 + c.gust * (Math.sin(t * 0.7) * 0.6 + Math.sin(t * 1.9 + 1) * 0.4);
export function groundAt(c: Course, x: number) {
  let g = 10;
  for (const tr of c.trees) { const d = Math.abs(x - tr.x) / (tr.w / 2); if (d < 1) g = Math.max(g, tr.h * Math.sqrt(1 - d * d)); }
  return g;
}
/** 0 at the centre of the window's foot, 1 at its rim. */
export const windowR = (x: number, y: number) => Math.hypot(x / RX, y / RY);

/** Advance by DT. `turn` is -1 (left), 0, or 1 (right). */
export function step(c: Course, s: State, turn: number, ev: Ev[] = []) {
  if (s.done) return;
  s.t += DT;
  const k = s.kite;
  if (s.crashT >= 0) {
    // tumbling down; then a fresh launch
    k.y = Math.max(0, k.y - 160 * DT); k.h += 9 * DT;
    if (s.t - s.crashT > 1.3) {
      s.crashT = -1;
      if (s.kites <= 0) { s.done = true; s.won = false; ev.push({ type: 'lost' }); return; }
      Object.assign(k, LAUNCH); ev.push({ type: 'launch' });
    }
    return;
  }
  k.turn = turn;
  s.wind = windAt(c, s.t);
  const r = windowR(k.x, k.y);
  s.slow = c.clouds.some((cl) => ((k.x - cl.x) / cl.rx) ** 2 + ((k.y - cl.y) / cl.ry) ** 2 < 1);
  const target = (VMIN + (VMAX - VMIN) * Math.max(0, 1 - r * r)) * s.wind * (s.slow ? 0.55 : 1);
  k.v += (target - k.v) * Math.min(1, DT * 2.2);
  k.h -= turn * TURN * DT * (k.v < 90 ? 1.15 : 1); // heading runs anticlockwise: pulling left turns left
  let nx = k.x + Math.cos(k.h) * k.v * DT, ny = k.y + Math.sin(k.h) * k.v * DT;
  // the edge of the window: the lines are taut, the kite slides along it
  const rr = windowR(nx, ny);
  if (rr > 1) { nx /= rr; ny /= rr; k.v *= 1 - DT * 3; }
  k.x = nx; k.y = ny;
  // bells
  for (let i = 0; i < c.bells.length; i++) {
    if (s.rung[i] || (c.ordered && i !== s.next)) continue;
    const [bx, by] = bellAt(c.bells[i], s.t);
    if (Math.hypot(k.x - bx, k.y - by) < KITE_R + 12) { s.rung[i] = true; s.next++; ev.push({ type: 'bell', i, n: s.next }); }
  }
  if (s.rung.every(Boolean)) { s.done = true; s.won = true; ev.push({ type: 'won' }); return; }
  // what brings a kite down
  let why: 'ground' | 'crow' | 'rival' | null = null;
  if (k.y < groundAt(c, k.x)) why = 'ground';
  for (const cr of c.crows) { const [x, y] = crowAt(cr, s.t); if (Math.hypot(k.x - x, k.y - y) < KITE_R + 9) why = 'crow'; }
  for (const rv of c.rivals) { const [x, y] = rivalAt(rv, s.t); if (Math.hypot(k.x - x, k.y - y) < KITE_R + 12) why = 'rival'; }
  if (why) { s.crashT = s.t; s.kites--; s.crashes++; ev.push({ type: 'crash', why }); }
}

/**
 * A steady pilot: it flies toward the nearest bell it may ring (pure pursuit, turning the shorter way),
 * pulls up from the ground, and swerves from crows and kites it is about to meet. Used to check every hill
 * can be flown, and to set the times for stars.
 */
export function pilot(c: Course, s: State): number {
  const k = s.kite;
  if (s.crashT >= 0) return 0;
  const want = (ang: number) => { let d = ang - k.h; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  let tx = 0, ty = 200, best = Infinity;
  for (let i = 0; i < c.bells.length; i++) {
    if (s.rung[i] || (c.ordered && i !== s.next)) continue;
    const [bx, by] = bellAt(c.bells[i], s.t + 0.3);
    const d = Math.hypot(bx - k.x, by - k.y) + Math.abs(want(Math.atan2(by - k.y, bx - k.x))) * 60;
    if (d < best) { best = d; tx = bx; ty = by; }
  }
  let d = want(Math.atan2(ty - k.y, tx - k.x));
  // look ahead for trouble
  for (const la of [0.25, 0.5]) {
    const fx = k.x + Math.cos(k.h) * k.v * la, fy = k.y + Math.sin(k.h) * k.v * la;
    if (fy < groundAt(c, fx) + 22) { d = want(Math.PI / 2); break; }
    let hit = false;
    for (const cr of c.crows) { const [x, y] = crowAt(cr, s.t + la); if (Math.hypot(fx - x, fy - y) < 34) hit = true; }
    for (const rv of c.rivals) { const [x, y] = rivalAt(rv, s.t + la); if (Math.hypot(fx - x, fy - y) < 38) hit = true; }
    if (hit) { d = d >= 0 ? 1 : -1; break; }
  }
  if (Math.abs(d) < 0.06) return 0;
  return d > 0 ? -1 : 1; // heading increases anticlockwise: a left turn
}
/** Fly a hill with the pilot; the time it takes, or Infinity. */
export function flyPilot(c: Course, limit = 150) {
  const s = createState(c);
  while (!s.done && s.t < limit) step(c, s, pilot(c, s));
  return { won: s.won, t: s.t, crashes: s.crashes };
}
