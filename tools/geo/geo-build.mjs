// Genera los datos geográficos reales de Manizales para el motor 3D.
// usage: node geo-build.mjs <projectRoot>
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
const osm = JSON.parse(fs.readFileSync('geo/osm.json'));
const dem = JSON.parse(fs.readFileSync('geo/dem-crop.json'));
const route = JSON.parse(fs.readFileSync('geo/route.json'));

// --- arranque en el punto más alto (Calle 23 Córdoba) ---------------------
let hi = 0;
for (let i = 0; i < route.length && route[i].s < 400; i++) if (route[i].z > route[hi].z) hi = i;
const pts = route.slice(hi);

// --- proyección local en metros: x este, z sur (three: -z = norte) --------
const lat0 = pts.reduce((a, p) => a + p.lat, 0) / pts.length;
const lon0 = pts.reduce((a, p) => a + p.lon, 0) / pts.length;
const KX = 111320 * Math.cos((lat0 * Math.PI) / 180);
const KZ = 110574;
const proj = (lat, lon) => [(lon - lon0) * KX, -(lat - lat0) * KZ];

// --- DEM suavizado (el Copernicus es DSM: incluye techos y árboles) ------
const blur = (src, w, h, r) => {
  const out = new Float32Array(w * h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      let s = 0, n = 0;
      for (let dj = -r; dj <= r; dj++)
        for (let di = -r; di <= r; di++) {
          const a = Math.min(w - 1, Math.max(0, i + di)), b = Math.min(h - 1, Math.max(0, j + dj));
          const wt = Math.exp(-(di * di + dj * dj) / (r * r));
          s += src[b * w + a] * wt; n += wt;
        }
      out[j * w + i] = s / n;
    }
  return out;
};
const smooth = blur(Float32Array.from(dem.data), dem.w, dem.h, 2);
const elev = (lat, lon) => {
  const fx = (lon - dem.west) / dem.rx, fy = (lat - dem.north) / dem.ry;
  const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j;
  const g = (a, b) => smooth[b * dem.w + a];
  return g(i, j) * (1 - tx) * (1 - ty) + g(i + 1, j) * tx * (1 - ty) + g(i, j + 1) * (1 - tx) * ty + g(i + 1, j + 1) * tx * ty;
};

// --- ruta remuestreada cada 2 m -----------------------------------------
const P = pts.map((p) => ({ ...proj(p.lat, p.lon).reduce((o, v, k) => ((o[k ? 'z' : 'x'] = v), o), {}), lat: p.lat, lon: p.lon, hw: p.hw, name: p.name || '' }));
const segLen = [];
let L = 0;
P.forEach((p, i) => { if (i) L += Math.hypot(p.x - P[i - 1].x, p.z - P[i - 1].z); p.s = L; });
const STEP = 2;
const N = Math.floor(L / STEP) + 1;
const xs = [], zs = [], ys = [], kinds = [];
let k = 0;
for (let n = 0; n < N; n++) {
  const s = n * STEP;
  while (k < P.length - 2 && P[k + 1].s < s) k++;
  const a = P[k], b = P[k + 1];
  const t = Math.min(1, Math.max(0, (s - a.s) / Math.max(0.001, b.s - a.s)));
  const lat = a.lat + (b.lat - a.lat) * t, lon = a.lon + (b.lon - a.lon) * t;
  xs.push(a.x + (b.x - a.x) * t);
  zs.push(a.z + (b.z - a.z) * t);
  ys.push(elev(lat, lon));
  kinds.push(b.hw === 'steps' ? 's' : ['footway', 'pedestrian', 'path'].includes(b.hw) ? 'f' : ['secondary', 'primary', 'tertiary'].includes(b.hw) ? 'm' : 'r');
}
// suaviza el perfil salvo en escalinatas, y suaviza el trazo en planta
const smooth1 = (arr, r, keep) => arr.map((v, i) => { if (keep && keep(i)) return v; let s = 0, n = 0; for (let d = -r; d <= r; d++) { const j = Math.min(arr.length - 1, Math.max(0, i + d)); s += arr[j]; n++; } return s / n; });
const ysS = smooth1(ys, 6, (i) => kinds[i] === 's');
const xsS = smooth1(xs, 2), zsS = smooth1(zs, 2);
segLen.push(L);

// --- secciones ------------------------------------------------------------
const runs = [];
for (let i = 0; i < N; i++) { const c = kinds[i]; if (!runs.length || runs.at(-1).k !== c) runs.push({ k: c, a: i * STEP, b: i * STEP }); runs.at(-1).b = i * STEP; }
const heading = (i) => Math.atan2(xsS[Math.min(N - 1, i + 1)] - xsS[Math.max(0, i - 1)], -(zsS[Math.min(N - 1, i + 1)] - zsS[Math.max(0, i - 1)]));
const curv = [];
for (let i = 0; i < N; i++) { let d = heading(Math.min(N - 1, i + 6)) - heading(Math.max(0, i - 6)); d = Math.atan2(Math.sin(d), Math.cos(d)); curv.push(d / 24); }
console.log('runs', runs.filter((r) => r.b - r.a > 10).map((r) => `${r.k}:${r.a}-${r.b}`).join(' '));
console.log('len', L.toFixed(0), 'drop', (ysS[0] - ysS.at(-1)).toFixed(0));
const turns = curv.map((c, i) => [i * STEP, c]).filter(([, c]) => Math.abs(c) > 0.02);
console.log('turns', turns.filter((_, i) => i % 3 === 0).map(([s, c]) => `${s}:${c.toFixed(3)}`).join(' '));
const prof = [];
for (let s = 0; s < L; s += 50) prof.push(`${s}:${ysS[Math.floor(s / STEP)].toFixed(0)}`);
console.log('profile', prof.join(' '));

// --- ciudad: edificios, calles y parques en un radio de la ruta ---------
const R = 420;
const near = (x, z) => { let best = 1e9; for (let i = 0; i < N; i += 5) { const d = Math.hypot(x - xsS[i], z - zsS[i]); if (d < best) best = d; } return best; };
const q = (v) => Math.round(v * 10);
const buildings = [], streets = [], parks = [];
const hash = (n) => { let h = n % 2147483647; h = (h * 16807) % 2147483647; return h / 2147483647; };
for (const e of osm.elements) {
  if (!e.geometry || e.geometry.length < 3) continue;
  const poly = e.geometry.map((g) => proj(g.lat, g.lon));
  const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length, cz = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const d = near(cx, cz);
  if (d > R) continue;
  if (e.tags.building) {
    let area = 0;
    for (let i = 0; i < poly.length - 1; i++) area += poly[i][0] * poly[i + 1][1] - poly[i + 1][0] * poly[i][1];
    area = Math.abs(area / 2);
    if (area < 12) continue;
    let lv = parseInt(e.tags['building:levels'] || '', 10);
    if (!lv) {
      const r = hash(e.id);
      lv = area > 900 ? 5 + Math.floor(r * 6) : area > 350 ? 3 + Math.floor(r * 4) : 2 + Math.floor(r * 2.2);
      if (e.tags.building === 'roof' || e.tags.building === 'hut') lv = 1;
      if (e.tags.building === 'cathedral') lv = 99;
    }
    const ring = poly.slice(0, poly[0][0] === poly.at(-1)[0] && poly[0][1] === poly.at(-1)[1] ? -1 : undefined);
    buildings.push([lv === 99 ? 99 : Math.min(lv, 20), ...ring.flatMap(([x, z]) => [q(x), q(z)])]);
  } else if (e.tags.leisure === 'park') {
    parks.push(poly.flatMap(([x, z]) => [q(x), q(z)]));
  }
}
for (const e of osm.elements) {
  if (!e.tags.highway || !e.geometry || e.geometry.length < 2) continue;
  const w = { trunk: 10, primary: 9, secondary: 8, tertiary: 7, residential: 6, unclassified: 6, service: 4, living_street: 5, pedestrian: 5, footway: 2.5, steps: 3, path: 2 }[e.tags.highway];
  if (!w) continue;
  const poly = e.geometry.map((g) => proj(g.lat, g.lon));
  if (poly.every(([x, z]) => near(x, z) > R + 60)) continue;
  streets.push([e.tags.highway === 'steps' ? -w : w, ...poly.flatMap(([x, z]) => [q(x), q(z)])]);
}

// --- relieve en malla regular local (8 m) ------------------------------
const H = { cell: 8, half: 1400 };
const n = (H.half * 2) / H.cell + 1;
const hdata = [];
for (let j = 0; j < n; j++)
  for (let i = 0; i < n; i++) {
    const x = -H.half + i * H.cell, z = -H.half + j * H.cell;
    const lat = lat0 - z / KZ, lon = lon0 + x / KX;
    hdata.push(Math.round(elev(lat, lon) * 10));
  }
const base = Math.round(Math.min(...ysS)) - 40;
const F = { cell: 32, half: 3200 };
const nf = (F.half * 2) / F.cell + 1;
const fdata = [];
for (let j = 0; j < nf; j++)
  for (let i = 0; i < nf; i++) {
    const x = -F.half + i * F.cell, z = -F.half + j * F.cell;
    fdata.push(Math.round(elev(lat0 - z / KZ, lon0 + x / KX)) - base);
  }
const city = { origin: [lat0, lon0], base, height: { cell: H.cell, n, half: H.half, data: hdata.map((v) => v - base * 10) }, far: { cell: F.cell, n: nf, half: F.half, data: fdata }, buildings, streets, parks };
fs.mkdirSync(path.join(root, 'public/assets/geo'), { recursive: true });
fs.writeFileSync(path.join(root, 'public/assets/geo/manizales.json'), JSON.stringify(city));
console.log('buildings', buildings.length, 'streets', streets.length, 'parks', parks.length, 'height n', n);

// --- datos de la ruta (TS, sin dependencias) -------------------------------
const r1 = (a) => a.map((v) => Math.round(v * 10) / 10);
const ts = `// Generado desde OpenStreetMap + Copernicus DEM (ver README). No editar a mano.
// Ruta propuesta: Calle 23 Córdoba (junto a la Catedral) → escalinata Calle 26A → Carrera 39, Manizales.
export const ROUTE = {
  origin: [${lat0.toFixed(6)}, ${lon0.toFixed(6)}] as const,
  /** altura (m s. n. m.) restada a todas las coordenadas y */
  base: ${base},
  step: ${STEP},
  xs: [${r1(xsS).join(',')}],
  zs: [${r1(zsS).join(',')}],
  ys: [${r1(ysS.map((y) => y - base)).join(',')}],
  /** r = calle, m = vía principal, f = peatonal, s = escalinata */
  kinds: '${kinds.join('')}',
};
`;
fs.writeFileSync(path.join(root, 'src/app/three/world/route-data.ts'), ts);
console.log('route-data.ts', (ts.length / 1024).toFixed(0), 'KB; city', (fs.statSync(path.join(root, 'public/assets/geo/manizales.json')).size / 1024).toFixed(0), 'KB');
