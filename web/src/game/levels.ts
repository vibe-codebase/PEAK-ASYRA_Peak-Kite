import type { Bell, Cloud, Course, Crow, Rival, Tree } from './sim';

export type Level = Course & { id: string; name: string; chapter: number; hint?: string; par: number };
export const CHAPTERS = [
  { name: 'Spring Fields', blurb: 'A soft wind over the rice fields. Ring every bell, and learn how the kite turns.' },
  { name: 'Festival Day', blurb: 'Kites over the rooftops: crows, rival kites, and a gusty wind.' },
  { name: 'Lantern Night', blurb: 'Rain clouds that steal the wind, bells that sway, and melodies to ring in order.' },
];

const B = (x: number, y: number, bob?: [number, number, number]): Bell => ({ x, y, bob });
const ring = (n: number, cx: number, cy: number, rx: number, ry: number, ph = 0) => Array.from({ length: n }, (_, k) => B(cx + Math.cos(ph + (k / n) * Math.PI * 2) * rx, cy + Math.sin(ph + (k / n) * Math.PI * 2) * ry));
const C = (y: number, speed: number, dir: 1 | -1, phase: number, amp = 10): Crow => ({ y, speed, dir, phase, period: (2 * 230) / speed, amp });
const K = (x: number, y: number, r: number, w: number, phase = 0): Rival => ({ x, y, r, w, phase });
const Cl = (x: number, y: number, rx: number, ry: number): Cloud => ({ x, y, rx, ry });
const T = (x: number, w: number, h: number): Tree => ({ x, w, h });

type Draft = Omit<Level, 'chapter' | 'par' | 'crows' | 'rivals' | 'clouds' | 'trees' | 'gust' | 'ordered'> & Partial<Course>;
const line = (n: number, x0: number, y0: number, x1: number, y1: number) => Array.from({ length: n }, (_, k) => B(x0 + ((x1 - x0) * k) / Math.max(1, n - 1), y0 + ((y1 - y0) * k) / Math.max(1, n - 1)));
const FIELDS: Draft[] = [
  { id: 'f1', name: 'First Flight', bells: line(5, -110, 200, 110, 200), hint: 'Hold the left side of the screen to turn left, the right side to turn right. Let go to fly straight.' },
  { id: 'f2', name: 'High and Low', bells: [...line(3, -80, 330, 80, 330), ...line(3, -120, 90, 120, 90)], hint: 'The kite is fastest in the middle of the sky and slows near the edge.' },
  { id: 'f3', name: 'Circle', bells: ring(8, 0, 205, 105, 120, 0.3) },
  { id: 'f4', name: 'Scale', bells: [B(-120, 110), B(-80, 180), B(-40, 250), B(0, 320), B(40, 250), B(80, 180), B(120, 110)], ordered: true, hint: 'Numbered bells ring a tune: fly to them in order.' },
  { id: 'f5', name: 'Edges', bells: [B(-150, 110), B(-120, 260), B(0, 375), B(120, 260), B(150, 110), B(0, 140), B(0, 250)] },
  { id: 'f6', name: 'Old Pines', bells: [B(-130, 135), B(130, 135), B(0, 280), B(-50, 60), B(50, 60), B(-80, 220), B(80, 220), B(0, 160)], trees: [T(-115, 100, 80), T(115, 100, 80)] },
  { id: 'f7', name: 'Swaying', bells: [B(-90, 160, [30, 10, 1.2]), B(90, 160, [30, 10, 1.4]), B(0, 330, [45, 0, 1]), B(0, 90, [55, 0, 0.9]), B(-70, 270, [20, 20, 1.1]), B(70, 270, [20, 20, 1.3])], gust: 0.1 },
  { id: 'f8', name: 'Figure Eight', bells: [B(0, 215), B(-80, 140), B(-130, 215), B(-80, 290), B(0, 215 + 0.5), B(80, 140), B(130, 215), B(80, 290)], ordered: true, gust: 0.1 },
];
const FESTIVAL: Draft[] = [
  { id: 'd1', name: 'Crows', bells: [...line(4, -120, 120, 120, 120), ...line(3, -80, 320, 80, 320)], crows: [C(220, 70, 1, 0)], gust: 0.15, hint: 'A crow will knock your kite down. Let it pass.' },
  { id: 'd2', name: 'Rival Kite', bells: ring(8, 0, 210, 125, 135, 0.5), rivals: [K(0, 210, 0, 0)], gust: 0.15 },
  { id: 'd3', name: 'Rooftops', bells: [B(-140, 95), B(-80, 105), B(-25, 60), B(25, 60), B(80, 105), B(140, 95), B(0, 280), B(-90, 250), B(90, 250)], trees: [T(-60, 50, 45), T(60, 50, 45)], gust: 0.2 },
  { id: 'd4', name: 'Flock', bells: [...line(4, -100, 290, 100, 290), ...line(4, -120, 110, 120, 110)], crows: [C(200, 75, 1, 0), C(200, 75, 1, 3.2)], gust: 0.2 },
  { id: 'd5', name: 'Kite Fight', bells: ring(9, 0, 205, 128, 140, 0), rivals: [K(-55, 205, 45, 0.9), K(55, 205, 45, -0.9, 1.5)], gust: 0.15 },
  { id: 'd6', name: 'Gusts', bells: [B(-145, 160), B(145, 160), B(0, 370), B(-60, 60), B(60, 60), B(-100, 300), B(100, 300), B(0, 200)], gust: 0.4 },
  { id: 'd7', name: 'Festival Song', bells: [B(-110, 120), B(-40, 280), B(40, 120), B(110, 280), B(0, 200), B(-120, 220), B(120, 220), B(0, 350)], ordered: true, crows: [C(330, 55, -1, 1)], gust: 0.2 },
  { id: 'd8', name: 'Busy Sky', bells: ring(10, 0, 205, 130, 145, 0.2), crows: [C(110, 65, 1, 0), C(300, 65, -1, 3)], rivals: [K(0, 205, 30, 1.2)], gust: 0.25 },
];
const NIGHT: Draft[] = [
  { id: 'n1', name: 'Rain Cloud', bells: [...line(5, -120, 220, 120, 220), B(0, 360), B(0, 90)], clouds: [Cl(0, 220, 45, 38)], gust: 0.15, hint: 'Inside a rain cloud the kite loses its wind. Go round if you can.' },
  { id: 'n2', name: 'Lanterns', bells: [B(-90, 140, [25, 15, 1.3]), B(90, 140, [25, 15, 1.1]), B(-90, 300, [20, 10, 0.9]), B(90, 300, [20, 10, 1.5]), B(0, 225, [40, 20, 0.8]), B(0, 360, [30, 0, 1.2]), B(0, 80, [50, 0, 1])], clouds: [Cl(0, 300, 34, 26)], gust: 0.2 },
  { id: 'n3', name: 'Night Song', bells: [B(0, 100), B(-120, 200), B(0, 330), B(120, 200), B(0, 210), B(-70, 290), B(70, 290), B(0, 150)], ordered: true, clouds: [Cl(-100, 330, 40, 32)], gust: 0.2 },
  { id: 'n4', name: 'Owls', bells: ring(9, 0, 210, 125, 140, 0.5), crows: [C(150, 80, 1, 0), C(270, 80, -1, 1.7)], clouds: [Cl(105, 330, 38, 28)], gust: 0.25 },
  { id: 'n5', name: 'Storm Front', bells: [B(-135, 110), B(135, 110), B(-75, 345), B(75, 345), B(0, 200), B(-125, 220), B(125, 220), B(0, 70)], clouds: [Cl(-60, 220, 45, 42), Cl(70, 235, 42, 38)], gust: 0.35 },
  { id: 'n6', name: 'Moon Kites', bells: ring(10, 0, 210, 130, 140, 0.1), rivals: [K(-50, 220, 40, 1.0), K(50, 220, 40, 1.0, Math.PI)], clouds: [Cl(0, 370, 45, 22)], gust: 0.2 },
  { id: 'n7', name: 'Harbour', bells: [B(-120, 95), B(-40, 200), B(40, 95), B(120, 200), B(0, 330), B(-100, 290), B(100, 290), B(0, 230), B(-60, 350)], ordered: true, trees: [T(0, 70, 50)], crows: [C(250, 70, 1, 0.5)], gust: 0.3 },
  { id: 'n8', name: 'Last Lantern', bells: ring(12, 0, 210, 120, 135, 0.2).map((b, k) => (k % 2 ? { ...b, bob: [14, 10, 1 + k * 0.1] as [number, number, number] } : b)), crows: [C(120, 70, 1, 0), C(320, 60, -1, 2)], rivals: [K(0, 215, 32, 1.1)], clouds: [Cl(-115, 330, 36, 28)], gust: 0.3 },
];

/** Par: the steady pilot's time on each hill (tools/par.ts); stars are measured against it. */
export const PAR: Record<string, number> = {f1: 6.5, f2: 8.6, f3: 5.7, f4: 6, f5: 11.9, f6: 10.7, f7: 4.4, f8: 10.6, d1: 8.3, d2: 7.2, d3: 10.1, d4: 7.9, d5: 7.3, d6: 11, d7: 15.5, d8: 9, n1: 7.4, n2: 7, n3: 10.2, n4: 9.2, n5: 10.8, n6: 8.7, n7: 14.4, n8: 7.3};
const fin = (d: Draft[], chapter: number): Level[] => d.map((x) => ({ crows: [], rivals: [], clouds: [], trees: [], gust: 0, ordered: false, ...x, chapter, par: PAR[x.id] ?? 30 }));
export const LEVELS: Level[] = [...fin(FIELDS, 0), ...fin(FESTIVAL, 1), ...fin(NIGHT, 2)];
export const levelIndex = (id: string) => LEVELS.findIndex((l) => l.id === id);
/** Stars: three within half again the steady pilot's time, two within 2.2 times; a crash costs a star. */
export const starsFor = (t: number, par: number, crashes: number) => Math.max(1, (t <= par * 1.5 ? 3 : t <= par * 2.2 ? 2 : 1) - (crashes > 0 ? 1 : 0));
