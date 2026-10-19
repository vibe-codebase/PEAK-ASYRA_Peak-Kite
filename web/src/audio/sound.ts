/**
 * Kite sound, synthesised with Web Audio: a festival flute and a koto over a drone, with larks over the
 * fields, festival drums in the town, and crickets by the harbour at night; the wind in the lines rising
 * with the kite's speed, glass wind bells that ring the notes of a tune, a crow's caw, and the flutter and
 * thud of a kite coming down.
 */
const semis = (root: number, n: number) => root * Math.pow(2, n / 12);
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; // a bright pentatonic
const ROOTS = [261.63, 293.66, 220];
/** Tunes the bells ring when taken in order (degrees of the scale). */
const TUNES = [[0, 1, 2, 4, 3, 2, 1, 0, 2, 4, 5, 4], [4, 4, 5, 4, 2, 1, 2, 4, 3, 2, 1, 0], [5, 4, 2, 4, 5, 7, 5, 4, 2, 1, 2, 0]];

export class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private verb!: ConvolverNode;
  private noise!: AudioBuffer;
  private amb: GainNode | null = null;
  private timer: number | null = null;
  private next = 0;
  private beatN = 0;
  private chapter = 0;
  private seed = 13;
  private musicVol = 0.6;
  private sfxVol = 0.8;
  private ducked = false;
  private phrase = 4;
  private strings = new Map<number, AudioBuffer>();

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
      this.master.connect(comp).connect(ctx.destination);
      this.music = ctx.createGain(); this.sfx = ctx.createGain();
      this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(3);
      const wet = ctx.createGain(); wet.gain.value = 0.32;
      this.verb.connect(wet).connect(this.master);
      this.music.connect(this.master); this.music.connect(this.verb);
      this.sfx.connect(this.master); this.sfx.connect(this.verb);
      this.noise = this.makeNoise();
      // the room: a kettle on the brazier, or the kiln's breath
      const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13; const lg = ctx.createGain(); lg.gain.value = 0.006;
      this.amb = ctx.createGain(); this.amb.gain.value = 0.012;
      lfo.connect(lg).connect(this.amb.gain); lfo.start();
      src.connect(bp).connect(this.amb).connect(this.music); src.start();
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  setVolumes(music: number, sfx: number) { this.musicVol = music; this.sfxVol = sfx; this.applyVolumes(); }
  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(this.musicVol * 0.55 * (this.ducked ? 0.55 : 1), t, 0.25);
    this.sfx.gain.setTargetAtTime(this.sfxVol, t, 0.05);
  }
  duck(on: boolean) { this.ducked = on; this.applyVolumes(); }
  suspend() { void this.ctx?.suspend(); }
  resume() { if (this.ctx?.state === 'suspended') void this.ctx.resume(); }

  startMusic(chapter: number) {
    if (!this.ctx) return;
    if (this.timer !== null && chapter === this.chapter) return;
    this.chapter = chapter;
    this.next = this.ctx.currentTime + 0.4;
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 150);
  }
  private rnd() { this.seed = (this.seed * 9301 + 49297) % 233280; return this.seed / 233280; }
  private schedule() {
    const ctx = this.ctx!;
    const step = 60 / 60 / 2;
    const root = ROOTS[this.chapter % 3];
    while (this.next < ctx.currentTime + 0.8) {
      const t = this.next, pos = this.beatN % 32;
      if (pos === 0) { this.drone(t, root / 2, step * 32); this.phrase = 3 + Math.floor(this.rnd() * 4); }
      if (pos === 2 || (pos === 18 && this.rnd() < 0.5)) {
        // a flute phrase: two or three long breaths
        let tt = t;
        for (let k = 0; k < 2 + Math.floor(this.rnd() * 2); k++) {
          this.phrase = Math.max(2, Math.min(SCALE.length - 2, this.phrase + Math.floor(this.rnd() * 5) - 2));
          const d = step * (2 + Math.floor(this.rnd() * 3));
          this.flute(tt, semis(root * 2, SCALE[this.phrase]), d * 0.95);
          tt += d;
        }
      }
      if (pos % 4 === 0 && pos > 8 && this.rnd() < 0.45) this.koto(t, semis(root, SCALE[Math.floor(this.rnd() * 6)]), 0.05, this.music);
      if (this.chapter === 0 && this.rnd() < 0.012) this.bird(t);
      if (this.chapter === 1 && (pos === 0 || pos === 6 || pos === 8 || pos === 14)) this.drum(t, pos === 0 ? 0.05 : 0.025);
      if (this.chapter === 2 && pos % 3 === 0 && this.rnd() < 0.4) this.cricket(t);
      this.next += step; this.beatN++;
    }
  }
  private drone(t: number, f: number, dur: number) {
    const ctx = this.ctx!;
    for (const [m, v] of [[1, 0.026], [1.5, 0.01], [2, 0.008]] as const) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.music); o.start(t); o.stop(t + dur + 0.1);
    }
  }
  /** Shakuhachi-ish: a sine with slow vibrato and a breath of filtered noise, swelling and falling. */
  private flute(t: number, f: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f * 0.985, t); o.frequency.linearRampToValueAtTime(f, t + 0.25);
    vib.frequency.value = 4.6; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.008, t + dur * 0.6);
    vib.connect(vg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + 0.18); g.gain.linearRampToValueAtTime(0.022, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.music); o.start(t); o.stop(t + dur + 0.05); vib.start(t); vib.stop(t + dur + 0.05);
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 6;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(0.02, t + 0.1); ng.gain.linearRampToValueAtTime(0.004, t + 0.5); ng.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(ng).connect(this.music); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  private koto(t: number, f: number, vol: number, bus: GainNode) {
    const ctx = this.ctx!;
    const key = Math.round(f * 10);
    let buf = this.strings.get(key);
    if (!buf) {
      const sr = ctx.sampleRate, n = Math.floor(sr * 1.8), period = Math.round(sr / f);
      buf = ctx.createBuffer(1, n, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < period; i++) d[i] = (i < period / 3 ? 1 : -0.5) * (0.6 + Math.random() * 0.4) * 0.7;
      for (let i = period; i < n; i++) d[i] = 0.4975 * (d[i - period] + d[i - period + 1]);
      this.strings.set(key, buf);
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000;
    const g = ctx.createGain(); g.gain.value = vol;
    src.connect(lp).connect(g).connect(bus); src.start(t);
  }
  private bird(t: number) {
    const ctx = this.ctx!;
    const f = 2400 + this.rnd() * 1600;
    for (let k = 0; k < 3; k++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), s = t + k * 0.12;
      o.type = 'sine'; o.frequency.setValueAtTime(f, s); o.frequency.exponentialRampToValueAtTime(f * (k % 2 ? 0.8 : 1.25), s + 0.08);
      g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.008, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.09);
      o.connect(g).connect(this.music); o.start(s); o.stop(s + 0.1);
    }
  }
  private hiss(t: number, dur: number, vol: number, freq: number, q = 1, bus?: GainNode) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.01, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(bus ?? this.sfx); src.start(t, Math.random()); src.stop(t + dur + 0.05);
    return bp;
  }
  private drum(t: number, vol: number) { const ctx = this.ctx!; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.18); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.connect(g).connect(this.music); o.start(t); o.stop(t + 0.4); this.hiss(t, 0.05, vol * 0.4, 300, 1, this.music); }
  private cricket(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(), g = ctx.createGain(), am = ctx.createOscillator(), ag = ctx.createGain();
    o.frequency.value = 4500; am.frequency.value = 36; ag.gain.value = 0.004;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.004, t + 0.02); g.gain.linearRampToValueAtTime(0, t + 0.16);
    am.connect(ag).connect(g.gain); o.connect(g).connect(this.music); o.start(t); o.stop(t + 0.18); am.start(t); am.stop(t + 0.18);
  }
  private wind: { g: GainNode; bp: BiquadFilterNode; hum: OscillatorNode; hg: GainNode } | null = null;
  /** The wind in the lines: louder, higher and with a hum as the kite speeds up (0..1). */
  setFlight(v: number) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    if (!this.wind) {
      const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9; bp.frequency.value = 500;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(bp).connect(g).connect(this.sfx); src.start();
      const hum = ctx.createOscillator(); hum.type = 'triangle'; hum.frequency.value = 180; const hg = ctx.createGain(); hg.gain.value = 0;
      hum.connect(hg).connect(this.sfx); hum.start();
      this.wind = { g, bp, hum, hg };
    }
    const w = this.wind;
    w.g.gain.setTargetAtTime(0.012 + v * v * 0.06, t, 0.15);
    w.bp.frequency.setTargetAtTime(400 + v * 1100, t, 0.15);
    w.hum.frequency.setTargetAtTime(150 + v * 160, t, 0.2);
    w.hg.gain.setTargetAtTime(v > 0.6 ? (v - 0.6) * 0.03 : 0, t, 0.2);
  }
  tap() { if (this.ctx) this.koto(this.ctx.currentTime, 659.25, 0.05, this.sfx); }
  launch() { if (this.ctx) { const t = this.ctx.currentTime; const bp = this.hiss(t, 0.5, 0.05, 400, 0.8); bp.frequency.exponentialRampToValueAtTime(1600, t + 0.45); } }
  /** A wind bell: in order, the next note of the hill's tune; otherwise climbing the scale. */
  bell(n: number, total: number, ordered: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, root = ROOTS[this.chapter % 3] * 4;
    const deg = ordered ? TUNES[this.chapter % 3][n % 12] : Math.min(SCALE.length - 1, Math.round((n / Math.max(1, total - 1)) * 8));
    this.bell2(t, semis(root, SCALE[deg]), 0.05);
    if (n === total - 1) this.bell2(t + 0.18, semis(root, SCALE[Math.min(SCALE.length - 1, deg + 2)]), 0.04);
  }
  private bell2(t: number, f: number, vol: number) { this.bellTone(t, f, vol, this.sfx, 2.2, [1, 2.32, 4.25, 6.8]); this.hiss(t, 0.02, 0.02, 7000, 2); }
  private bellTone(t: number, f: number, vol: number, bus: GainNode, dur: number, ratios: number[]) {
    const ctx = this.ctx!;
    ratios.forEach((m, k) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * m;
      const d = dur / (1 + k * 1.3);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol / (1 + k * 0.8), t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(bus); o.start(t); o.stop(t + d + 0.02);
    });
  }
  crash(why: string) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let k = 0; k < 6; k++) this.hiss(t + k * 0.07, 0.05, 0.05, 900 + k * 120, 2);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.setValueAtTime(why === 'ground' ? 140 : 300, t + 0.45); o.frequency.exponentialRampToValueAtTime(60, t + 0.7);
    g.gain.setValueAtTime(0.0001, t); g.gain.setValueAtTime(0.1, t + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); o.connect(g).connect(this.sfx); o.start(t); o.stop(t + 0.85);
  }
  caw() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let k = 0; k < 2; k++) {
      const s = t + k * 0.22, o = this.ctx.createOscillator(), g = this.ctx.createGain(), bp = this.ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(620, s); o.frequency.exponentialRampToValueAtTime(420, s + 0.16);
      bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 2;
      g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.05, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.18);
      o.connect(bp).connect(g).connect(this.sfx); o.start(s); o.stop(s + 0.2);
    }
  }
  lost() { if (!this.ctx) return; const t = this.ctx.currentTime; [7, 4, 2, 0].forEach((d, i) => this.koto(t + i * 0.18, semis(ROOTS[this.chapter % 3], SCALE[d]), 0.07, this.sfx)); }
  finish(stars: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, root = ROOTS[this.chapter % 3] * 2;
    [0, 2, 4, 5, 7].slice(0, 2 + stars).forEach((d, i) => { this.koto(t + 0.2 + i * 0.13, semis(root, SCALE[d]), 0.09, this.sfx); this.bellTone(t + 0.2 + i * 0.13, semis(root * 2, SCALE[d]), 0.02, this.sfx, 1.5, [1, 2.32]); });
  }
  star(i: number) { if (this.ctx) this.bellTone(this.ctx.currentTime, [880, 1046.5, 1318.5][i] ?? 1318.5, 0.04, this.sfx, 1.4, [1, 2.32, 4.25]); }

  private makeNoise() {
    const ctx = this.ctx!;
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    return b;
  }
}
export const sound = new Sound();
