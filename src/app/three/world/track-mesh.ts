import { BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { Assets } from '../assets';
import { boxUV, basisMatrix, merge, paint, tube } from '../geo';
import { GeoData } from './geo-data';
import { ROUTE_LENGTH } from './track-profile';
import { SECTION, Track } from './track';

/** Perfil transversal: [lateral(s), altura(s)] por vértice. */
type Profile = ((s: number) => [number, number])[];
const at = (lat: (hw: number) => number, up: number, track: Track) => (s: number) => [lat(track.halfWidth(s)), up] as [number, number];

/**
 * Extruye un perfil transversal a lo largo de la pista entre s0 y s1.
 * UV: u = distancia lateral (aprox.), v = s (ambos / scale).
 */
function ribbon(track: Track, s0: number, s1: number, profile: Profile, scale: number, step = 1, yOf?: (s: number) => number) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const cols = profile.length;
  const p = new Vector3();
  const ss: number[] = [];
  for (let s = s0; s < s1; s += step) ss.push(s);
  ss.push(s1);
  for (const s of ss) {
    let acc = 0;
    let prev: [number, number] | null = null;
    for (let i = 0; i < cols; i++) {
      const [lat, up] = profile[i](s);
      if (prev) acc += Math.hypot(lat - prev[0], up - prev[1]);
      prev = [lat, up];
      track.point(s, lat, up, p);
      if (yOf) p.y = yOf(s) + up;
      pos.push(p.x, p.y, p.z);
      uv.push(acc / scale, s / scale);
    }
  }
  for (let r = 0; r < ss.length - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + cols;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Tramos continuos del recorrido según superficie. */
function runs(track: Track) {
  const out: { kind: 'road' | 'stairs'; a: number; b: number }[] = [];
  for (let s = SECTION.start[1] - 2; s < ROUTE_LENGTH; s += 1) {
    const kind = track.surface(s) === 'stairs' ? 'stairs' : 'road';
    if (!out.length || out[out.length - 1].kind !== kind) out.push({ kind, a: s, b: s });
    out[out.length - 1].b = s + 1;
  }
  return out;
}

/**
 * Distancia del eje a la fachada real más cercana a cada lado (cada 2 m), para
 * que el andén llegue hasta las casas en vez de dejar franjas de pasto.
 */
function facadeOffsets(track: Track, geo: GeoData) {
  const out: Record<number, number[]> = { [-1]: [], [1]: [] };
  for (const side of [-1, 1]) {
    for (let s = 0; s <= ROUTE_LENGTH + 2; s += 2) {
      const hw = track.halfWidth(s);
      let off = hw + 2.4;
      for (let k = 0.5; k <= 11; k += 0.5) {
        const p = track.point(s, side * (hw + k));
        if (geo.inBuilding(p.x, p.z)) {
          off = Math.max(hw + 1.2, hw + k - 0.15);
          break;
        }
        if (k > 2.4 && k === 11) off = hw + 2.4;
      }
      out[side].push(off);
    }
    // suaviza sin pasar la fachada
    const a = out[side];
    out[side] = a.map((v, i) => Math.min(v, ((a[i - 1] ?? v) + v + (a[i + 1] ?? v)) / 3));
  }
  return (s: number, side: number) => {
    const arr = out[side];
    const f = Math.min(arr.length - 1.001, Math.max(0, s / 2));
    const i = Math.floor(f);
    return arr[i] + (arr[i + 1] - arr[i]) * (f - i);
  };
}

export function buildTrackMesh(track: Track, geo: GeoData, assets: Assets) {
  const group = new Group();
  const facade = facadeOffsets(track, geo);
  const mat = (k: Parameters<Assets['material']>[0], extra = {}) => {
    const m = assets.material(k, { metalness: 0, ...extra });
    m.metalnessMap = null;
    return m;
  };
  const road = mat('road');
  const pave = mat('pave');
  const wood = mat('wood');
  const wallMat = mat('plaster', { vertexColors: true });
  const railMat = new MeshStandardMaterial({ color: '#2b2f33', metalness: 0.85, roughness: 0.35 });
  const add = (g: BufferGeometry, m: MeshStandardMaterial, cast = false) => {
    const mesh = new Mesh(g, m);
    mesh.receiveShadow = true;
    mesh.castShadow = cast;
    group.add(mesh);
    return mesh;
  };

  for (const run of runs(track)) {
    if (run.kind === 'road') {
      // calzada con bombeo
      add(
        ribbon(track, run.a, run.b, [at((h) => -h, 0, track), at((h) => -h / 2, 0.04, track), at(() => 0, 0.06, track), at((h) => h / 2, 0.04, track), at((h) => h, 0, track)], 4),
        road,
      );
      // andenes con sardinel
      for (const side of [-1, 1]) {
        const prof: Profile = [
          at((h) => side * h, -0.3, track),
          at((h) => side * h, 0.17, track),
          at((h) => side * (h + 0.12), 0.18, track),
          (s) => [side * facade(s, side), 0.2 + (facade(s, side) - track.halfWidth(s)) * 0.01],
          (s) => [side * facade(s, side), -2],
        ];
        if (side < 0) prof.reverse();
        add(ribbon(track, run.a, run.b, prof, 2), pave);
      }
    } else {
      addStairs(track, run.a, run.b, pave, wallMat, railMat, add);
    }
  }

  // --- rampa de salida en madera -------------------------------------------
  const [w0, w1] = SECTION.start;
  add(ribbon(track, w0 - 6, w1, [() => [-1.9, -0.6], () => [-1.9, 0.05], () => [1.9, 0.05], () => [1.9, -0.6]], 2, 0.5), wood, true);
  const posts: BufferGeometry[] = [];
  for (let s = w0 - 6; s < w1; s += 3) {
    for (const lat of [-1.7, 1.7]) {
      const top = track.point(s, lat, 0);
      posts.push(tube(new Vector3(top.x, top.y - 4, top.z), top, 0.1, 6));
    }
  }
  add(merge(posts), wood);

  // --- kicker y aterrizaje del salto ----------------------------------------
  const [k0, k1] = SECTION.kicker;
  const [l0, l1] = SECTION.landing;
  const deckProf: Profile = [() => [-1.6, -0.2], () => [-1.6, 0], () => [1.6, 0], () => [1.6, -0.2]];
  add(ribbon(track, k0, k1, deckProf, 1.5, 0.25, (s) => track.riderY(s)), wood, true);
  add(ribbon(track, l0 - 1, l1, deckProf, 1.5, 0.25, (s) => Math.max(track.ground(s), track.riderY(s))), wood, true);
  const sides: BufferGeometry[] = [];
  const box = (a: number, b: number, yTop: (s: number) => number) => {
    for (const lat of [-1.6, 1.6]) {
      const g = ribbon(track, a, b, [() => [lat, 0], () => [lat, 0]], 1.5, 0.25);
      const p = g.getAttribute('position') as BufferAttribute;
      for (let i = 0; i < p.count; i += 2) p.setY(i + 1, yTop(Math.min(a + (i / 2) * 0.25, b)));
      g.computeVertexNormals();
      sides.push(g);
    }
  };
  box(k0, k1, (s) => track.riderY(s));
  box(l0 - 1, l1, (s) => Math.max(track.ground(s), track.riderY(s)));

  // --- plataforma del drop -------------------------------------------------
  const [d0] = SECTION.dropRamp;
  const d1 = SECTION.drop;
  add(ribbon(track, d0, d1, deckProf, 1.5, 0.25, (s) => track.ground(s) + track.dropDeck(s)), wood, true);
  box(d0, d1, (s) => track.ground(s) + track.dropDeck(s));
  for (const lat of [-1.5, 0, 1.5]) {
    for (let s = d0 + 4; s <= d1; s += 4) {
      const t = track.point(s, lat, track.dropDeck(s));
      sides.push(tube(new Vector3(t.x, track.ground(s) - 0.2, t.z), t, 0.07, 6));
    }
  }
  const fd = track.frame(d1);
  const deckTop = track.ground(d1) + track.dropDeck(d1 - 0.01);
  const face = boxUV(3.2, 2.4, 0.08, 1);
  face.translate(0, -1.2 + 0.02, 0);
  face.applyMatrix4(basisMatrix(new Vector3(fd.pos.x, deckTop, fd.pos.z), fd.right.clone().negate(), new Vector3(0, 1, 0)));
  sides.push(face);
  const sideMat = wood.clone();
  sideMat.side = 2;
  add(merge(sides), sideMat, true);
  const pad = new Mesh(boxUV(3.4, 0.22, 0.3, 1), new MeshStandardMaterial({ color: '#FF5B1F', roughness: 0.7 }));
  pad.applyMatrix4(basisMatrix(new Vector3(fd.pos.x, deckTop + 0.02, fd.pos.z), fd.right.clone().negate(), new Vector3(0, 1, 0)));
  group.add(pad);

  // --- zona de meta (plataforma temporal de adoquín) ----------------------
  const cobble = assets.material('cobble', { metalness: 0, roughness: 0.92 });
  cobble.metalnessMap = null;
  cobble.roughnessMap = null;
  const plazaProf: Profile = [];
  for (let l = -14; l <= 14; l += 2) plazaProf.push(() => [l, 0.03]);
  add(ribbon(track, SECTION.plaza - 3, track.length + 46, plazaProf, 3, 1), cobble);

  return group;
}

/** Escalinata real: peldaños, muros laterales y barandas. */
function addStairs(
  track: Track,
  a: number,
  b: number,
  pave: MeshStandardMaterial,
  wallMat: MeshStandardMaterial,
  railMat: MeshStandardMaterial,
  add: (g: BufferGeometry, m: MeshStandardMaterial, cast?: boolean) => Mesh,
) {
  const steps: BufferGeometry[] = [];
  const tread = 0.4;
  const f = track.frame(a);
  for (let s = a - 1; s < b + 1; s += tread) {
    const y = track.ground(s + tread);
    track.frame(s + tread / 2, f);
    const w = track.halfWidth(s) * 2 + 0.4;
    const g = boxUV(w, 1.4, tread + 0.02, 1.5);
    g.translate(0, -0.7, 0);
    g.applyMatrix4(basisMatrix(new Vector3(f.pos.x, y + 0.01, f.pos.z), f.right.clone().negate(), new Vector3(0, 1, 0)));
    steps.push(g);
  }
  add(merge(steps), pave, true);

  // muros laterales con remate y jardinera
  for (const side of [-1, 1]) {
    const prof: Profile = [
      (s) => [side * (track.halfWidth(s) + 0.2), -1],
      (s) => [side * (track.halfWidth(s) + 0.2), 0.9],
      (s) => [side * (track.halfWidth(s) + 0.45), 0.95],
      (s) => [side * (track.halfWidth(s) + 0.7), 0.9],
      (s) => [side * (track.halfWidth(s) + 0.7), 0.3],
      (s) => [side * (track.halfWidth(s) + 2.6), 0.3],
      (s) => [side * (track.halfWidth(s) + 2.6), -2],
    ];
    if (side < 0) prof.reverse();
    add(paint(ribbon(track, a - 1, b + 1, prof, 2), [1.22, 1.19, 1.15]), wallMat, true);
  }

  // barandas laterales (el centro queda libre para la línea de carrera)
  const rails: BufferGeometry[] = [];
  for (const k of [-1, 1]) {
    let prev: Vector3 | null = null;
    for (let s = a; s <= b; s += 2.1) {
      const lat = k * (track.halfWidth(s) + 0.05);
      const top = track.point(s, lat, 0.95);
      const foot = top.clone();
      foot.y -= 0.95;
      rails.push(tube(foot, top, 0.022, 8));
      if (prev) rails.push(tube(prev, top, 0.026, 8));
      prev = top;
    }
  }
  add(merge(rails), railMat, true);
}
