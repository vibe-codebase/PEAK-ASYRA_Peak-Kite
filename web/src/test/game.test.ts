import { describe, expect, it } from 'vitest';
import { CHAPTERS, LEVELS, levelIndex, starsFor } from '../game/levels';
import { createState, flyPilot, groundAt, step, windowR, DT, type Course } from '../game/sim';
import { freshSave, isUnlocked, parseSave, recordResult, totalStars } from '../state/save';

const open: Course = { bells: [{ x: 0, y: 380 }], crows: [], rivals: [], clouds: [], trees: [], gust: 0, ordered: false };

describe('levels', () => {
  it('has 24 skies in three chapters of eight, with unique ids', () => {
    expect(LEVELS).toHaveLength(24);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(24);
    CHAPTERS.forEach((_, c) => expect(LEVELS.filter((l) => l.chapter === c)).toHaveLength(8));
    expect(levelIndex('n8')).toBe(23);
  });
  it('every bell hangs inside the sky, above the ground', () => {
    for (const l of LEVELS) for (const b of l.bells) { expect(windowR(b.x, b.y)).toBeLessThan(0.97); expect(b.y).toBeGreaterThan(groundAt(l, b.x) + 15); }
  });
  it('hazards arrive with the chapters: no crows or kites in the first', () => {
    for (const l of LEVELS.filter((x) => x.chapter === 0)) { expect(l.crows).toHaveLength(0); expect(l.rivals).toHaveLength(0); }
    expect(LEVELS.filter((x) => x.chapter === 2).every((l) => l.clouds.length > 0 || l.crows.length > 0)).toBe(true);
  });
  for (const l of LEVELS) {
    it(`${l.id} ${l.name}: the steady pilot rings every bell, and par is its time`, () => {
      const r = flyPilot(l);
      expect(r.won).toBe(true);
      expect(r.crashes).toBeLessThanOrEqual(1);
      expect(Math.abs(r.t - l.par)).toBeLessThan(0.15);
    });
  }
  it('stars: within half again par is three, a fall costs one', () => {
    expect(starsFor(10, 10, 0)).toBe(3); expect(starsFor(15, 10, 0)).toBe(3); expect(starsFor(16, 10, 0)).toBe(2);
    expect(starsFor(23, 10, 0)).toBe(1); expect(starsFor(10, 10, 1)).toBe(2); expect(starsFor(30, 10, 2)).toBe(1);
  });
});

describe('the kite', () => {
  it('pulling left turns it left, pulling right turns it right', () => {
    const a = createState(open), b = createState(open);
    for (let k = 0; k < 40; k++) { step(open, a, -1); step(open, b, 1); }
    expect(a.kite.x).toBeLessThan(0); expect(b.kite.x).toBeGreaterThan(0);
  });
  it('never leaves the wind window, and is slower at its edge', () => {
    const s = createState(open);
    let edgeV = Infinity, midV = 0;
    for (let k = 0; k < 4000 && !s.done; k++) {
      step(open, s, k % 600 < 40 ? 1 : 0);
      if (s.crashT < 0) { expect(windowR(s.kite.x, s.kite.y)).toBeLessThanOrEqual(1.0001); const r = windowR(s.kite.x, s.kite.y); if (r > 0.97) edgeV = Math.min(edgeV, s.kite.v); if (r < 0.3) midV = Math.max(midV, s.kite.v); }
    }
    expect(edgeV).toBeLessThan(midV);
  });
  it('falls on touching the ground, and relaunches until the kites run out', () => {
    const s = createState(open);
    let t = 0;
    while (!s.done && t < 60 / DT) { step(open, s, 1); t++; }
    expect(s.done).toBe(true); expect(s.won).toBe(false); expect(s.crashes).toBe(3); expect(s.kites).toBe(0);
  });
  it('rings ordered bells only in order', () => {
    const c: Course = { ...open, ordered: true, bells: [{ x: 0, y: 300 }, { x: 0, y: 150 }] };
    const s = createState(c);
    for (let k = 0; k < 120 && !s.done; k++) step(c, s, 0);
    expect(s.rung[1]).toBe(false);
  });
});

describe('save', () => {
  it('survives junk and keeps only known skies', () => {
    expect(parseSave('nope')).toEqual(freshSave());
    const s = parseSave(JSON.stringify({ v: 1, stars: { f1: 3, zz: 2 }, best: { f1: 9.5, f2: 'x' }, seenHints: ['f1', 5], settings: { music: 4 } }));
    expect(s.stars).toEqual({ f1: 3 }); expect(s.best).toEqual({ f1: 9.5 }); expect(s.seenHints).toEqual(['f1']); expect(s.settings.music).toBe(1);
  });
  it('records the best stars and time, and unlocks in order', () => {
    let s = freshSave();
    s = recordResult(s, 'f1', 2, 12.34); s = recordResult(s, 'f1', 1, 20);
    expect(s.stars.f1).toBe(2); expect(s.best.f1).toBe(12.3); expect(isUnlocked(s, 1)).toBe(true); expect(totalStars(s)).toBe(2);
  });
});
