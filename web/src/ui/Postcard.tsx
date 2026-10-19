import { useEffect, useRef } from 'react';
import { bell, canvas, kite, land, MOODS, sky } from '../game/art';
import type { Level } from '../game/levels';
import { bellAt, createState, pilot, RX, RY, step } from '../game/sim';

const cache = new Map<string, HTMLCanvasElement>();
/** A small window of sky: its bells, and once flown, the ribbon of a flight through them. */
function paintCard(level: Level, flown: boolean, w: number, h: number, dpr: number) {
  const m = MOODS[level.chapter], { c, g } = canvas(w * dpr, h * dpr);
  g.scale(dpr, dpr);
  g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 9); g.clip();
  g.drawImage(sky(m, w, h, 1, 3 + level.chapter), 0, 0);
  g.drawImage(land(m, w * 2, h * 0.5, 1, 5 + level.chapter), 0, 0, w * 2, h * 0.5, 0, h * 0.72, w, h * 0.28);
  const cx = w / 2, cy = h * 0.86, kx = (w / 2 - 6) / RX, ky = (h * 0.78) / RY;
  const S = (x: number, y: number): [number, number] => [cx + x * kx, cy - y * ky];
  if (flown) {
    const s = createState(level), pts: [number, number][] = [];
    while (!s.done && s.t < 60) { step(level, s, pilot(level, s)); if (Math.round(s.t * 120) % 4 === 0 && s.crashT < 0) pts.push(S(s.kite.x, s.kite.y)); }
    g.strokeStyle = m.sail[0]; g.globalAlpha = 0.8; g.lineWidth = 1.4; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.globalAlpha = 1;
  }
  const b = bell(m, 1, m.night);
  for (const bl of level.bells) { const [x, y] = S(...bellAt(bl, 0)); g.globalAlpha = flown ? 0.55 : 1; g.drawImage(b, x - 4, y - 5, 8, 13); }
  g.globalAlpha = 1;
  const k = kite(m, 1); const [x, y] = S(flown ? 0 : 0, flown ? 330 : 70); g.drawImage(k, x - 9, y - 6, 18, 13);
  g.restore();
  return c;
}

export function Postcard({ level, flown, locked, width }: { level: Level; flown: boolean; locked: boolean; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const height = Math.round(width * 1.22);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), key = `${level.id}|${flown}|${locked}|${width}|${dpr}`;
    let src = cache.get(key);
    if (!src) { src = paintCard(level, flown && !locked, width, height, dpr); cache.set(key, src); }
    el.width = src.width; el.height = src.height; el.getContext('2d')!.drawImage(src, 0, 0);
  }, [level, flown, locked, width, height]);
  return <canvas ref={ref} className="postcard" style={{ width, height }} aria-hidden />;
}
