/**
 * Kite art, painted with Canvas 2D: three skies (a spring morning over rice fields, a festival afternoon
 * over tiled roofs, a lantern night over the harbour), soft clouds, the flyer, the kite with its painted
 * sail, glass wind bells with their paper strips, and pine trees.
 */
export type Mood = {
  name: string; sky: [string, string, string]; sun: string; sunGlow: string; cloud: string; cloudShade: string;
  far: string; near: string; ground: string; accent: string; sail: [string, string, string]; line: string; bell: string; night: boolean;
};
export const MOODS: Mood[] = [
  { name: 'spring', sky: ['#7fb3d8', '#bcd9e8', '#f6dcc4'], sun: '#fff6dc', sunGlow: 'rgba(255,240,200,0.55)', cloud: '#ffffff', cloudShade: '#d6e3ee',
    far: '#9db6a4', near: '#6f9a64', ground: '#4f7a46', accent: '#c94f3c', sail: ['#e04a3a', '#f6efe2', '#20304a'], line: 'rgba(40,40,50,0.55)', bell: '#bfe6f0', night: false },
  { name: 'festival', sky: ['#3f86c6', '#8fc0e2', '#f7cf9a'], sun: '#fff1c4', sunGlow: 'rgba(255,214,140,0.5)', cloud: '#fffaf2', cloudShade: '#e4cfc0',
    far: '#8a8fa8', near: '#5c5470', ground: '#3d3448', accent: '#e8a23a', sail: ['#1f4f9a', '#f2c230', '#e6e0d2'], line: 'rgba(30,30,40,0.6)', bell: '#ffe2a8', night: false },
  { name: 'night', sky: ['#0e1430', '#243066', '#5a4f86'], sun: '#fff4d6', sunGlow: 'rgba(200,210,255,0.35)', cloud: '#3d4a78', cloudShade: '#252e55',
    far: '#1d2449', near: '#141a38', ground: '#0c1028', accent: '#ffb35c', sail: ['#f2efe6', '#d23b3b', '#202640'], line: 'rgba(230,230,255,0.45)', bell: '#ffd68a', night: true },
];

export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return { c, g: c.getContext('2d')! };
}
export function rng(seed: number) {
  let s = Math.imul(seed + 0x9e3779b9, 2654435761) >>> 0 || 1;
  const next = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  for (let k = 0; k < 8; k++) next();
  return next;
}

/** The sky: a gradient, the sun or moon, and (at night) stars. */
export function sky(m: Mood, W: number, H: number, r: number, seed: number) {
  const { c, g } = canvas(W * r, H * r), rr = rng(seed);
  g.scale(r, r);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, m.sky[0]); gr.addColorStop(0.6, m.sky[1]); gr.addColorStop(1, m.sky[2]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (m.night) for (let k = 0; k < 160; k++) { const y = rr() * H * 0.7; g.fillStyle = `rgba(255,255,240,${0.2 + rr() * 0.6 * (1 - y / H)})`; g.fillRect(rr() * W, y, rr() < 0.1 ? 1.6 : 1, rr() < 0.1 ? 1.6 : 1); }
  const sx = m.night ? W * 0.78 : W * 0.22, sy = m.night ? H * 0.16 : H * 0.2, sr = m.night ? 18 : 26;
  const glow = g.createRadialGradient(sx, sy, 0, sx, sy, sr * 6);
  glow.addColorStop(0, m.sunGlow); glow.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.fillStyle = m.sun; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();
  if (m.night) { g.fillStyle = 'rgba(180,170,150,0.25)'; for (const [dx, dy, rr2] of [[-5, -4, 4], [6, 3, 3], [-2, 7, 2.5]]) { g.beginPath(); g.arc(sx + dx, sy + dy, rr2, 0, Math.PI * 2); g.fill(); } }
  return c;
}
/** A soft cumulus (or, at night, a dark cloud): overlapping puffs, lit from above. */
export function cloud(m: Mood, w: number, h: number, r: number, seed: number, rain = false) {
  const { c, g } = canvas(w * r, h * r), rr = rng(seed);
  g.scale(r, r);
  const puffs: [number, number, number][] = [];
  for (let k = 0; k < 9; k++) { const t = k / 8; puffs.push([w * (0.15 + t * 0.7) + (rr() - 0.5) * w * 0.08, h * (0.62 - Math.sin(t * Math.PI) * 0.25) + (rr() - 0.5) * h * 0.1, h * (0.22 + Math.sin(t * Math.PI) * 0.18 + rr() * 0.06)]); }
  const top = rain ? '#6a7290' : m.cloud, shade = rain ? '#3c4260' : m.cloudShade;
  for (const [x, y, rad] of puffs) {
    const gr = g.createRadialGradient(x - rad * 0.3, y - rad * 0.4, rad * 0.1, x, y, rad);
    gr.addColorStop(0, top); gr.addColorStop(1, shade);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  g.globalCompositeOperation = 'destination-out';
  const fade = g.createLinearGradient(0, h * 0.7, 0, h); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = fade; g.fillRect(0, h * 0.7, w, h * 0.3);
  return c;
}
/** The land at the foot of the sky: hills, and fields, roofs or the harbour, drawn W wide and H tall. */
export function land(m: Mood, W: number, H: number, r: number, seed: number) {
  const { c, g } = canvas(W * r, H * r), rr = rng(seed);
  g.scale(r, r);
  const ridge = (base: number, amp: number, col: string, f: number) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, base - Math.sin(x * f + seed) * amp - Math.sin(x * f * 2.7 + seed * 2) * amp * 0.4);
    g.lineTo(W, H); g.fill();
  };
  ridge(H * 0.38, 16, m.far, 0.018);
  if (m.name === 'spring') {
    ridge(H * 0.55, 10, m.near, 0.03);
    // a pagoda on the far hill
    const px = W * 0.78, py = H * 0.4;
    g.fillStyle = '#5e6b62';
    for (let k = 0; k < 4; k++) { const w = 22 - k * 4, y = py - k * 11; g.fillRect(px - w / 4, y - 7, w / 2, 7); g.beginPath(); g.moveTo(px - w / 2 - 3, y - 6); g.quadraticCurveTo(px, y - 14, px + w / 2 + 3, y - 6); g.lineTo(px, y - 10); g.fill(); }
    g.fillRect(px - 0.6, py - 54, 1.2, 10);
    // flooded rice terraces catching the sky
    for (let k = 0; k < 6; k++) {
      const y = H * (0.6 + k * 0.07);
      g.fillStyle = k % 2 ? '#5d8a54' : '#4c7a46'; g.fillRect(0, y, W, H * 0.07);
      g.fillStyle = 'rgba(220,235,245,0.35)'; g.beginPath(); g.moveTo(0, y + 3); for (let x = 0; x <= W; x += 8) g.lineTo(x, y + 3 + Math.sin(x * 0.02 + k) * 2); g.lineTo(W, y + H * 0.05); g.lineTo(0, y + H * 0.05); g.fill();
      g.strokeStyle = 'rgba(40,70,40,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin(x * 0.02 + k) * 2); g.stroke();
    }
  } else if (m.name === 'festival') {
    ridge(H * 0.48, 8, '#776f8a', 0.025);
    // tiled roofs, row on row, with banners
    for (let row = 0; row < 3; row++) {
      const y0 = H * (0.52 + row * 0.16), col = ['#4a4260', '#3a3350', '#2c2640'][row];
      for (let x = -20 + row * 17; x < W + 30; x += 46 + rr() * 22) {
        const w = 40 + rr() * 24, h = 14 + rr() * 8;
        g.fillStyle = '#2a2236'; g.fillRect(x + 4, y0, w - 8, H - y0);
        g.fillStyle = col; g.beginPath(); g.moveTo(x - 4, y0 + 4); g.quadraticCurveTo(x + w / 2, y0 - h * 0.4, x + w + 4, y0 + 4); g.lineTo(x + w - 6, y0 - h); g.lineTo(x + 6, y0 - h); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 0.8; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x + (w * k) / 5, y0 - h + 1); g.lineTo(x + (w * k) / 5 + (k - 2.5) * 1.5, y0 + 2); g.stroke(); }
        g.fillStyle = 'rgba(255,214,140,0.8)'; if (rr() < 0.5) g.fillRect(x + w * 0.4, y0 + 6, 4, 5);
        if (rr() < 0.35) { g.fillStyle = m.accent; g.fillRect(x + w * 0.8, y0 - h - 18, 1.2, 18); g.fillStyle = ['#d8473a', '#f2c230', '#2f6db5'][Math.floor(rr() * 3)]; g.fillRect(x + w * 0.8 + 1.2, y0 - h - 18, 6, 12); }
      }
    }
  } else {
    // the harbour: water with the moon's path and boats with lanterns
    ridge(H * 0.45, 10, '#151b3c', 0.03);
    const wy = H * 0.55, wg = g.createLinearGradient(0, wy, 0, H); wg.addColorStop(0, '#1c2554'); wg.addColorStop(1, '#0a0e24');
    g.fillStyle = wg; g.fillRect(0, wy, W, H - wy);
    for (let k = 0; k < 26; k++) { const y = wy + 3 + k * k * 0.18, w = 6 + k * 1.6; g.fillStyle = `rgba(255,240,200,${0.45 - k * 0.015})`; g.fillRect(W * 0.78 - w / 2 + Math.sin(k * 2.1) * 4, y, w, 1); }
    for (let k = 0; k < 5; k++) {
      const x = 30 + k * 72 + rr() * 20, y = wy + 14 + rr() * 26;
      g.fillStyle = '#0a0d1e'; g.beginPath(); g.moveTo(x - 14, y); g.lineTo(x + 14, y); g.lineTo(x + 10, y + 5); g.lineTo(x - 10, y + 5); g.fill();
      g.fillRect(x - 0.5, y - 14, 1, 14);
      const lg = g.createRadialGradient(x + 4, y - 9, 0, x + 4, y - 9, 12); lg.addColorStop(0, 'rgba(255,190,100,0.7)'); lg.addColorStop(1, 'rgba(255,190,100,0)');
      g.fillStyle = lg; g.fillRect(x - 10, y - 22, 28, 26);
      g.fillStyle = '#ffcf7a'; g.fillRect(x + 2.5, y - 11, 3, 4);
      g.fillStyle = 'rgba(255,190,100,0.35)'; g.fillRect(x + 2.5, y + 7, 3, 9);
    }
  }
  return c;
}
/** The flyer: a small figure on the hill, arms out to the two handles. */
export function flyer(m: Mood, r: number) {
  const { c, g } = canvas(40 * r, 54 * r);
  g.scale(r, r);
  const col = m.night ? '#05060f' : '#1d1a24';
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(20, 52, 12, 2.5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = col;
  g.beginPath(); g.moveTo(14, 52); g.lineTo(17, 32); g.lineTo(23, 32); g.lineTo(26, 52); g.lineTo(22, 52); g.lineTo(20, 40); g.lineTo(18, 52); g.fill();
  g.beginPath(); g.moveTo(15, 34); g.lineTo(17, 18); g.lineTo(23, 18); g.lineTo(25, 34); g.fill();
  g.beginPath(); g.arc(20, 13, 5, 0, Math.PI * 2); g.fill();
  g.fillStyle = m.accent; g.fillRect(14, 8, 12, 2.4); // a headband
  return c;
}
/** A delta stunt kite seen from the front, nose up: two-tone sail panels, spars, and a keel. */
export function kite(m: Mood, r: number) {
  const W = 48, H = 34, { c, g } = canvas(W * r, H * r);
  g.scale(r, r);
  const [a, b, d] = m.sail, nose: [number, number] = [W / 2, 2], lw: [number, number] = [2, H - 6], rw: [number, number] = [W - 2, H - 6], tail: [number, number] = [W / 2, H - 10];
  const tri = (p: [number, number][], col: string | CanvasGradient) => { g.fillStyle = col; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (const q of p.slice(1)) g.lineTo(q[0], q[1]); g.closePath(); g.fill(); };
  g.save(); g.translate(1.5, 2.5); g.globalAlpha = 0.25; tri([nose, lw, tail, rw], '#000'); g.restore();
  tri([nose, lw, tail], a); tri([nose, tail, rw], a);
  // panels
  tri([nose, [W / 2 - 9, H * 0.55], tail], b); tri([nose, [W / 2 + 9, H * 0.55], tail], b);
  tri([[W / 2 - 15, H * 0.66], lw, [W / 2 - 9, H * 0.7]], d); tri([[W / 2 + 15, H * 0.66], rw, [W / 2 + 9, H * 0.7]], d);
  const sh = g.createLinearGradient(0, 0, W, 0); sh.addColorStop(0, 'rgba(255,255,255,0.18)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.15)');
  tri([nose, lw, tail, rw], sh);
  g.strokeStyle = '#2a2420'; g.lineWidth = 1.1; g.lineCap = 'round';
  g.beginPath(); g.moveTo(nose[0], nose[1]); g.lineTo(lw[0], lw[1]); g.moveTo(nose[0], nose[1]); g.lineTo(rw[0], rw[1]); g.moveTo(nose[0], nose[1]); g.lineTo(tail[0], tail[1] + 3); g.stroke();
  g.lineWidth = 0.8; g.beginPath(); g.moveTo(W * 0.24, H * 0.62); g.lineTo(W * 0.76, H * 0.62); g.stroke();
  return c;
}
/** A glass wind bell (fūrin) with its clapper and paper strip. `lit` is for night, glowing from within. */
export function bell(m: Mood, r: number, lit: boolean) {
  const W = 28, H = 46, { c, g } = canvas(W * r, H * r);
  g.scale(r, r);
  const cx = W / 2;
  if (lit) { const gl = g.createRadialGradient(cx, 12, 0, cx, 12, 14); gl.addColorStop(0, 'rgba(255,214,140,0.55)'); gl.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, 28); }
  g.strokeStyle = 'rgba(60,50,40,0.7)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, 3); g.stroke();
  const dome = g.createRadialGradient(cx - 3, 7, 1, cx, 11, 11);
  dome.addColorStop(0, 'rgba(255,255,255,0.95)'); dome.addColorStop(0.5, m.bell); dome.addColorStop(1, 'rgba(90,140,170,0.85)');
  g.fillStyle = dome; g.beginPath(); g.moveTo(cx - 9, 17); g.quadraticCurveTo(cx - 10, 3, cx, 3); g.quadraticCurveTo(cx + 10, 3, cx + 9, 17); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(cx - 4, 9, 1.6, 3.5, -0.3, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, 17, 9, 1.5, 0, 0, Math.PI * 2); g.stroke();
  // painted goldfish on the glass
  g.fillStyle = '#d8473a'; g.beginPath(); g.ellipse(cx + 3, 11, 2.2, 1.3, 0.3, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(70,60,50,0.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(cx, 8); g.lineTo(cx, 25); g.stroke();
  // the paper strip that catches the wind
  g.fillStyle = '#f6efe0'; g.fillRect(cx - 3, 25, 6, 18);
  g.strokeStyle = 'rgba(40,30,20,0.45)'; g.lineWidth = 0.6; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(cx - 1.5, 29 + k * 4); g.lineTo(cx + 1.5, 29 + k * 4 + 1); g.stroke(); }
  return c;
}
/** A pine on the hill (drawn into a box w × h, rooted at the bottom). */
export function pine(m: Mood, w: number, h: number, r: number, seed: number) {
  const { c, g } = canvas(w * r, h * r), rr = rng(seed);
  g.scale(r, r);
  const col = m.night ? '#0a0f22' : m.name === 'festival' ? '#2a3a2e' : '#2f4a30';
  g.strokeStyle = m.night ? '#080b18' : '#3a2a20'; g.lineWidth = Math.max(2, w * 0.05); g.lineCap = 'round';
  g.beginPath(); g.moveTo(w / 2, h); g.quadraticCurveTo(w * 0.45, h * 0.5, w / 2 + (rr() - 0.5) * w * 0.1, h * 0.15); g.stroke();
  for (let k = 0; k < 5; k++) {
    const y = h * (0.18 + k * 0.15), half = w * (0.18 + k * 0.07) * (0.8 + rr() * 0.4), x = w / 2 + (rr() - 0.5) * w * 0.15;
    g.fillStyle = col; g.beginPath(); g.ellipse(x, y, half, h * 0.07, (rr() - 0.5) * 0.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.ellipse(x - half * 0.2, y - h * 0.025, half * 0.7, h * 0.03, 0, 0, Math.PI * 2); g.fill();
  }
  return c;
}
