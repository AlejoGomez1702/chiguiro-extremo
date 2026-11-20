import fs from 'node:fs';
const osm = JSON.parse(fs.readFileSync('geo/osm.json'));
const dem = JSON.parse(fs.readFileSync('geo/dem-crop.json'));
export const elev = (lat, lon) => { const fx = (lon - dem.west) / dem.rx, fy = (lat - dem.north) / dem.ry; const i = Math.floor(fx), j = Math.floor(fy); const tx = fx - i, ty = fy - j; const g = (a, b) => dem.data[b * dem.w + a]; return g(i,j)*(1-tx)*(1-ty)+g(i+1,j)*tx*(1-ty)+g(i,j+1)*(1-tx)*ty+g(i+1,j+1)*tx*ty; };
const M = (a, b) => Math.hypot((a.lat - b.lat) * 110570, (a.lon - b.lon) * 110570 * Math.cos(5.06 * Math.PI / 180));
const ok = new Set(['secondary','tertiary','residential','footway','steps','pedestrian','unclassified','service','path','living_street','primary','tertiary_link','secondary_link']);
const nodes = new Map(); const adj = new Map(); const ways = new Map();
for (const e of osm.elements) {
  if (!e.tags.highway || !ok.has(e.tags.highway) || !e.nodes) continue;
  ways.set(e.id, e);
  e.nodes.forEach((id, k) => nodes.set(id, e.geometry[k]));
  for (let k = 1; k < e.nodes.length; k++) {
    const a = e.nodes[k - 1], b = e.nodes[k];
    const len = M(e.geometry[k - 1], e.geometry[k]);
    for (const [u, v] of [[a, b], [b, a]]) { if (!adj.has(u)) adj.set(u, []); adj.get(u).push({ v, len, hw: e.tags.highway, way: e.id, name: e.tags.name }); }
  }
}
const nearest = (lat, lon) => { let best, bd = 1e9; for (const [id, p] of nodes) { const d = M(p, { lat, lon }); if (d < bd && adj.has(id)) { bd = d; best = id; } } return best; };
export function route(a, b, downhillOnly = true) {
  const dist = new Map([[a, 0]]), prev = new Map(); const q = [[0, a]]; const done = new Set();
  while (q.length) { q.sort((x, y) => x[0] - y[0]); const [d, u] = q.shift(); if (done.has(u)) continue; done.add(u); if (u === b) break;
    for (const ed of adj.get(u) || []) { const pu = nodes.get(u), pv = nodes.get(ed.v); const rise = elev(pv.lat, pv.lon) - elev(pu.lat, pu.lon);
      let c = ed.len * (ed.hw === 'steps' ? 0.6 : ['primary','secondary'].includes(ed.hw) ? 1.6 : 1) + (rise > 0 ? rise * (downhillOnly ? 60 : 5) : 0);
      const nd = d + c; if (nd < (dist.get(ed.v) ?? 1e12)) { dist.set(ed.v, nd); prev.set(ed.v, [u, ed]); q.push([nd, ed.v]); } } }
  const path = []; let u = b; while (u !== a) { const p = prev.get(u); if (!p) return null; path.push({ id: u, ...nodes.get(u), hw: p[1].hw, name: p[1].name, way: p[1].way }); u = p[0]; }
  path.push({ id: a, ...nodes.get(a), hw: 'start' }); return path.reverse();
}
export { nearest, nodes, ways, M };
if (process.argv[2] === 'probe') {
  const st = ways.get(824221390); const g = st.geometry; console.log('steps 26A ends', g[0], elev(g[0].lat,g[0].lon).toFixed(0), g.at(-1), elev(g.at(-1).lat,g.at(-1).lon).toFixed(0));
  // parks/plazas below
  const parks = osm.elements.filter(e => e.tags.leisure === 'park' && e.geometry).map(e => { const c = e.geometry.reduce((a, p) => ({ lat: a.lat + p.lat / e.geometry.length, lon: a.lon + p.lon / e.geometry.length }), { lat: 0, lon: 0 }); return [e.tags.name || '-', c.lat.toFixed(5), c.lon.toFixed(5), elev(c.lat, c.lon).toFixed(0), M(c, g.at(-1)).toFixed(0)]; }).filter(p => +p[4] < 1500).sort((a, b) => a[3] - b[3]);
  console.log(parks.slice(0, 25).map(p => p.join(' | ')).join('\n'));
}
