import { route, nearest, elev, M, ways } from './route.mjs';
import fs from 'node:fs';
const seq = (w, from) => { const n = w.nodes, g = w.geometry; const fwd = n[0] === from; const idx = n.map((_, k) => k); if (!fwd) idx.reverse(); return idx.map((k) => ({ id: n[k], ...g[k], hw: w.tags.highway, name: w.tags.name, way: w.id })); };
const s26 = ways.get(824221390), s39 = ways.get(824226607), ped = ways.get(824218984);
const start = nearest(5.0682, -75.5173);
const a = route(start, s26.nodes[0]);
const b = seq(s26, s26.nodes[0]);
const c = seq(s39, s26.nodes.at(-1));
// conecta el final de la escalinata 39 con la vía peatonal
const last = c.at(-1); console.log('s39 end', last.id, 'ped nodes include?', ped.nodes.includes(last.id), ped.nodes.length);
let d = [];
if (ped.nodes.includes(last.id)) { const k = ped.nodes.indexOf(last.id); const g = seq(ped, ped.nodes[0]); const fwd = g.slice(k); const back = g.slice(0, k + 1).reverse(); d = (fwd.length > back.length ? fwd : back).slice(1); }
const path = [...a, ...b.slice(1), ...c.slice(1), ...d];
let L = 0; for (let i = 0; i < path.length; i++) { if (i) L += M(path[i - 1], path[i]); path[i].s = L; path[i].z = elev(path[i].lat, path[i].lon); }
console.log('total', L.toFixed(0), 'drop', (path[0].z - path.at(-1).z).toFixed(0), 'nodes', path.length);
let seg; const rows = []; for (const p of path) { const k = p.hw + '|' + (p.name || ''); if (!seg || seg.k !== k) { seg && rows.push(seg); seg = { k, s0: p.s, z0: p.z }; } seg.s1 = p.s; seg.z1 = p.z; } rows.push(seg);
for (const r of rows) console.log(r.k.padEnd(34), r.s0.toFixed(0).padStart(5), '-', r.s1.toFixed(0).padStart(5), ' z', r.z0.toFixed(0), '→', r.z1.toFixed(0));
fs.writeFileSync('geo/route.json', JSON.stringify(path));
