// Store icon, adaptive-icon layers and splash: a red delta kite high in a spring sky, its ribbons streaming.
import * as A from '../src/game/art';

const M = A.MOODS[0];
function ribbon(g: CanvasRenderingContext2D, s: number, col: string, off: number) {
  g.strokeStyle = col; g.lineWidth = 2.4 * s; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(off * s, 8 * s);
  for (let k = 1; k <= 30; k++) g.lineTo(off * s * (1 + k * 0.05) + Math.sin(k * 0.42 + off) * 5 * s * (k / 30) - k * 0.9 * s, 8 * s + k * 3.6 * s);
  g.stroke();
}
function kiteAt(g: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, lines = true) {
  if (lines) {
    g.strokeStyle = 'rgba(40,40,50,0.5)'; g.lineWidth = Math.max(1.5, s * 0.35);
    for (const d of [-1, 1]) { const wx = x + Math.cos(rot) * d * 20 * s, wy = y + Math.sin(rot) * d * 20 * s + 6 * s; g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx + 50 * s, wy + 120 * s, x + 60 * s + d * 6, y + 600 * s); g.stroke(); }
  }
  g.save(); g.translate(x, y); g.rotate(rot);
  ribbon(g, s, M.sail[0], -1.6); ribbon(g, s, M.sail[1], 1.6);
  const k = A.kite(M, 8); g.drawImage(k, -24 * s, -17 * s, 48 * s, 34 * s);
  g.restore();
}
function bellAt(g: CanvasRenderingContext2D, x: number, y: number, s: number) { g.drawImage(A.bell(M, 6, false), x - 14 * s, y, 28 * s, 46 * s); }
export function icon() {
  const { c, g } = A.canvas(1024, 1024);
  g.drawImage(A.sky(M, 1024, 1024, 1, 3), 0, 0);
  g.drawImage(A.cloud(M, 520, 220, 1, 11), 470, 640); g.drawImage(A.cloud(M, 360, 150, 1, 18), -60, 160);
  kiteAt(g, 470, 380, 9, -0.35);
  bellAt(g, 790, 280, 3.4);
  return c;
}
export function adaptive() { const { c, g } = A.canvas(1024, 1024); kiteAt(g, 480, 420, 7, -0.35, false); bellAt(g, 730, 330, 2.6); return c; }
export function adaptiveBg() { const { c, g } = A.canvas(1024, 1024); g.drawImage(A.sky(M, 1024, 1024, 1, 3), 0, 0); g.drawImage(A.cloud(M, 520, 220, 1, 11), 470, 700); return c; }
export function splash() {
  const W = 1284, H = 2778, { c, g } = A.canvas(W, H);
  g.drawImage(A.sky(M, W / 3, H / 3, 3, 3), 0, 0, W, H);
  g.drawImage(A.cloud(M, 600, 250, 1, 11), 700, 900); g.drawImage(A.cloud(M, 480, 200, 1, 17), -120, 1500);
  g.drawImage(A.land(M, W / 3, 700 / 3, 3, 5), 0, H - 700, W, 700);
  for (const [x, y] of [[260, 1250], [420, 1050], [900, 1300], [1040, 1700]]) bellAt(g, x, y, 4);
  kiteAt(g, 640, 1500, 10, -0.25);
  g.textAlign = 'center'; g.font = '400 300px "Young Serif", serif';
  g.save(); g.fillStyle = 'rgba(224,74,58,0.9)'; g.fillText('Kite', W / 2, 640 + 12); g.restore();
  g.save(); g.shadowColor = 'rgba(14,20,36,0.4)'; g.shadowBlur = 50; g.fillStyle = '#fffaf0'; g.fillText('Kite', W / 2, 640); g.restore();
  g.save(); g.shadowBlur = 0; g.font = '800 58px Nunito, sans-serif'; g.fillStyle = '#e04a3a'; try { g.letterSpacing = '34px'; } catch { /* */ } g.fillText('PEAK', W / 2 + 17, 380); g.restore();
  return c;
}
/** The Play Store feature graphic: the red delta kite high over the clouds with wind bells on the right; the words at the left. */
export function feature() {
  const W = 1024, H = 500, { c, g } = A.canvas(W, H);
  g.save(); g.translate(W, 0); g.scale(-1, 1); g.drawImage(A.sky(M, W / 2, H / 2, 2, 3), 0, 0, W, H); g.restore();
  g.drawImage(A.cloud(M, 360, 150, 1, 11), 640, 330); g.drawImage(A.cloud(M, 280, 120, 1, 17), 820, 60);
  for (const [x, y] of [[640, 120], [900, 210], [960, 360], [700, 300]]) bellAt(g, x, y, 1.6);
  kiteAt(g, 800, 190, 3.6, -0.3);
  const shade = g.createLinearGradient(0, 0, 580, 0); shade.addColorStop(0, 'rgba(20,30,56,0.85)'); shade.addColorStop(0.75, 'rgba(20,30,56,0.5)'); shade.addColorStop(1, 'rgba(20,30,56,0)'); g.fillStyle = shade; g.fillRect(0, 0, 580, H);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.save(); g.shadowBlur = 0; g.font = '800 22px Nunito, sans-serif'; g.fillStyle = '#f6c544'; try { g.letterSpacing = '13px'; } catch { /* */ } g.fillText('PEAK', 62, 116); g.restore();
  g.save(); g.font = '400 140px "Young Serif", serif'; g.fillStyle = 'rgba(224,74,58,0.9)'; g.fillText('Kite', 52, 244); g.shadowColor = 'rgba(14,20,36,0.4)'; g.shadowBlur = 20; g.fillStyle = '#fffaf0'; g.fillText('Kite', 52, 238); g.restore();
  g.fillStyle = '#f6c544'; g.fillRect(62, 266, 52, 3);
  g.fillStyle = '#fffaf0'; g.font = '800 26px Nunito, sans-serif'; g.fillText('Two lines, one kite, every bell.', 62, 312);
  g.fillStyle = 'rgba(255,250,240,0.8)'; g.font = '700 18px Nunito, sans-serif'; g.fillText('24 skies · spring fields, festival day, lantern night', 62, 348);
  return c;
}
(window as unknown as { brand: unknown }).brand = { icon, adaptive, adaptiveBg, splash, feature };
