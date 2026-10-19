import { LEVELS } from '../src/game/levels';
import { flyPilot } from '../src/game/sim';
const out: Record<string, number> = {};
for (const l of LEVELS) { const r = flyPilot(l); out[l.id] = Math.round(r.t * 10) / 10; console.log(l.id.padEnd(3), r.won ? 'won ' : 'LOST', r.t.toFixed(1).padStart(6), 'crashes', r.crashes); }
console.log(JSON.stringify(out));
