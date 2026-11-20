import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  ShapeUtils,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLProgramParametersWithUniforms,
} from 'three';
import { Assets, textTexture } from '../assets';
import { basisMatrix, boxUV, merge, rng } from '../geo';
import { Building, GeoData } from './geo-data';
import { SECTION, Track } from './track';

const TRIM = ['#B3261E', '#1F5FA8', '#2E7D4F', '#E0A526', '#6C3A8C', '#D9541E', '#0E6E6C', '#8E3B24', '#2C3E8F', '#5a3b24'];
const WALLS = ['#F4F1EA', '#F4F1EA', '#F2EEE4', '#EFE6D2', '#E7D6B8', '#DCE5DD', '#F1D3B8', '#D8E1EC', '#E9C9A0', '#C9D7C2'];
const FLOOR_H = 3.1;
const BAY = 2.6;
/** Edificios a esta distancia de la pista reciben detalle 3D en fachada. */
const DETAIL_DIST = 34;

/**
 * Ventanas procedurales en el shader: a partir de la coordenada de fachada
 * (metros a lo largo del muro, metros sobre la base) se dibujan vanos con
 * vidrio reflectivo, marco del color de la casa y algunas luces encendidas.
 */
function facadePatch(shader: WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute vec3 facade;\nattribute vec3 trim;\nvarying vec3 vFacade;\nvarying vec3 vTrim;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFacade = facade;\nvTrim = trim;');
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
varying vec3 vFacade;
varying vec3 vTrim;
float fh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
    )
    .replace(
      '#include <map_fragment>',
      `#include <map_fragment>
float facadeOn = vFacade.z;
vec2 fp = vFacade.xy / vec2(${BAY.toFixed(1)}, ${FLOOR_H.toFixed(1)});
vec2 cell = floor(fp);
vec2 q = fract(fp);
float win = facadeOn * step(0.3, q.x) * step(q.x, 0.7) * step(0.27, q.y) * step(q.y, 0.81) * step(0.4, vFacade.y);
float frame = facadeOn * step(0.27, q.x) * step(q.x, 0.73) * step(0.23, q.y) * step(q.y, 0.85) * step(0.4, vFacade.y) - win;
float lit = step(0.9, fh(cell + floor(vFacade.x * 0.01)));
float blind = step(0.55, fh(cell * 1.7 + 3.1)) * step(0.62, q.y) ;
diffuseColor.rgb = mix(diffuseColor.rgb, vTrim, frame);
diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.025, 0.03, 0.035), vec3(0.55, 0.5, 0.42), blind * 0.6), win);`,
    )
    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.06, win * (1.0 - blind));')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.62, 0.32) * lit * win * 1.4;');
}

interface Parts {
  pos: number[];
  nor: number[];
  uv: number[];
  col: number[];
  fac: number[];
  trim: number[];
}
const parts = (): Parts => ({ pos: [], nor: [], uv: [], col: [], fac: [], trim: [] });

function toGeometry(p: Parts) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(p.pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(p.nor), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(p.uv), 2));
  g.setAttribute('color', new BufferAttribute(new Float32Array(p.col), 3));
  g.setAttribute('facade', new BufferAttribute(new Float32Array(p.fac), 3));
  g.setAttribute('trim', new BufferAttribute(new Float32Array(p.trim), 3));
  return g;
}

/** Añade un triángulo con normal, uv, color y datos de fachada. */
function tri(p: Parts, v: number[][], n: number[], uv: number[][], col: Color, fac: number[][], trim: Color) {
  for (let i = 0; i < 3; i++) {
    p.pos.push(...v[i]);
    p.nor.push(...n);
    p.uv.push(...uv[i]);
    p.col.push(col.r, col.g, col.b);
    p.fac.push(...fac[i]);
    p.trim.push(trim.r, trim.g, trim.b);
  }
}

/** Rectángulo orientado de área mínima (para techos a dos aguas). */
function obb(ring: [number, number][]) {
  let best: { area: number; c: [number, number]; ax: [number, number]; w: number; d: number } | null = null;
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i];
    const [x1, z1] = ring[(i + 1) % ring.length];
    const len = Math.hypot(x1 - x0, z1 - z0);
    if (len < 0.5) continue;
    const ux = (x1 - x0) / len;
    const uz = (z1 - z0) / len;
    let a0 = Infinity,
      a1 = -Infinity,
      b0 = Infinity,
      b1 = -Infinity;
    for (const [x, z] of ring) {
      const a = x * ux + z * uz;
      const b = -x * uz + z * ux;
      a0 = Math.min(a0, a);
      a1 = Math.max(a1, a);
      b0 = Math.min(b0, b);
      b1 = Math.max(b1, b);
    }
    const area = (a1 - a0) * (b1 - b0);
    if (!best || area < best.area) {
      const ca = (a0 + a1) / 2;
      const cb = (b0 + b1) / 2;
      best = { area, c: [ca * ux - cb * uz, ca * uz + cb * ux], ax: [ux, uz], w: a1 - a0, d: b1 - b0 };
    }
  }
  return best!;
}

function ringArea(ring: [number, number][]) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i];
    const [x1, z1] = ring[(i + 1) % ring.length];
    a += x0 * z1 - x1 * z0;
  }
  return Math.abs(a / 2);
}

export function buildCity(track: Track, geo: GeoData, assets: Assets, quality: 'low' | 'mid' | 'high') {
  const r = rng(42);
  const group = new Group();
  const plasterP = parts();
  const brickP = parts();
  const roofFlatP = parts();
  const roofTileP = parts();
  type Inst = { m: Matrix4; c: Color };
  const windows: Inst[] = [];
  const doors: Inst[] = [];
  const balconies: Inst[] = [];
  const rails: Inst[] = [];
  const signs: { m: Matrix4; text: string }[] = [];
  const SHOP = ['TIENDA', 'PANADERÍA', 'CAFÉ', 'DROGUERÍA', 'MISCELÁNEA', 'FRUTERÍA', 'BARBERÍA', 'ASADERO', 'FERRETERÍA', 'PAPELERÍA'];

  for (const b of geo.buildings) {
    const ring = b.ring;
    const gh = ring.map(([x, z]) => geo.terrainHeight(x, z));
    const gMin = Math.min(...gh);
    const gMax = Math.max(...gh);
    const area = ringArea(ring);
    // la Catedral se modela aparte (nave de piedra + torre en props)
    const cathedral = b.levels === 99;
    const levels = cathedral ? 8 : b.levels;
    const brick = !cathedral && r() < 0.32;
    const wall = cathedral ? new Color(0.92, 0.9, 0.86) : brick ? new Color(1.12, 1.05, 1.0) : new Color(WALLS[Math.floor(r() * WALLS.length)]).multiplyScalar(1.38);
    const trim = new Color(TRIM[Math.floor(r() * TRIM.length)]);
    const top = gMax + levels * FLOOR_H + 0.35;
    const bottom = gMin - 2.5;
    const box = obb(ring);
    const gable = !cathedral && levels <= 4 && area / box.area > 0.82 && Math.min(box.w, box.d) < 15 && area < 420 && r() < 0.8;
    const P = brick ? brickP : plasterP;

    // --- muros -----------------------------------------------------------
    for (let i = 0; i < ring.length; i++) {
      const [x0, z0] = ring[i];
      const [x1, z1] = ring[(i + 1) % ring.length];
      const len = Math.hypot(x1 - x0, z1 - z0);
      if (len < 0.05) continue;
      const nx = -(z1 - z0) / len;
      const nz = (x1 - x0) / len;
      const n = [nx, 0, nz];
      // centra la grilla de vanos en el muro
      const off = (len - Math.floor(len / BAY) * BAY) / 2;
      const act = len > 2.2 && !cathedral ? 1 : 0;
      const fa = (u: number, y: number) => [u - off, y - gMin, act];
      const A0 = [x0, bottom, z0];
      const B0 = [x1, bottom, z1];
      const B1 = [x1, top, z1];
      const A1 = [x0, top, z0];
      const uvs = (u: number, y: number) => [u / 2.5, y / 2.5];
      tri(P, [A0, B0, B1], n, [uvs(0, bottom), uvs(len, bottom), uvs(len, top)], wall, [fa(0, bottom), fa(len, bottom), fa(len, top)], trim);
      tri(P, [A0, B1, A1], n, [uvs(0, bottom), uvs(len, top), uvs(0, top)], wall, [fa(0, bottom), fa(len, top), fa(0, top)], trim);

      // --- detalle 3D en fachadas que miran a la pista ---------------------
      if (b.dist < DETAIL_DIST && act && !cathedral && quality !== 'low') {
        const mx = (x0 + x1) / 2;
        const mz = (z0 + z1) / 2;
        const near = track.nearest(mx, mz);
        const tp = track.point(near.s, 0);
        const toward = (tp.x - mx) * nx + (tp.z - mz) * nz;
        if (toward > 0 && near.dist < DETAIL_DIST + 6) {
          const along = new Vector3(x1 - x0, 0, z1 - z0).normalize();
          const normal = new Vector3(nx, 0, nz);
          const bays = Math.floor(len / BAY);
          const floorsVisible = Math.floor((top - gMin) / FLOOR_H);
          const balconyFloor = levels > 1 && r() < 0.5 ? 1 + Math.floor(r() * Math.min(2, levels - 1)) : -1;
          for (let k = 0; k < bays; k++) {
            const u = off + (k + 0.5) * BAY;
            const px = x0 + along.x * u;
            const pz = z0 + along.z * u;
            const street = geo.terrainHeight(px + nx * 1.5, pz + nz * 1.5);
            for (let f = 0; f < floorsVisible; f++) {
              const y = gMin + f * FLOOR_H + FLOOR_H * 0.54;
              if (y < street + 0.9 || y > top - 1) continue;
              windows.push({ m: fixFacing(new Matrix4(), along, normal, new Vector3(px, y, pz)), c: trim.clone() });
            }
            if (k % 3 === 1 && street > gMin - 0.5) {
              const pos = new Vector3(px, street + 1.2, pz);
              doors.push({ m: fixFacing(new Matrix4(), along, normal, pos), c: trim.clone() });
              if (r() < 0.25 && signs.length < 60) {
                signs.push({ m: fixFacing(new Matrix4(), along, normal, new Vector3(px, street + 2.75, pz)), text: SHOP[Math.floor(r() * SHOP.length)] });
              }
            }
          }
          if (balconyFloor > 0 && len > 4) {
            const y = gMin + balconyFloor * FLOOR_H + 0.05;
            if (y > geo.terrainHeight(mx + nx * 2, mz + nz * 2) + 2.6 && y < top - 2) {
              const bw = len - 1;
              const c = new Vector3(mx, y, mz);
              balconies.push({ m: fixFacing(new Matrix4(), along, normal, c.clone().addScaledVector(normal, 0.55)).multiply(new Matrix4().makeScale(bw, 1, 1)), c: new Color('#6b4a2e') });
              rails.push({ m: fixFacing(new Matrix4(), along, normal, c.clone().addScaledVector(normal, 1.05).setY(y + 0.05)).multiply(new Matrix4().makeScale(bw, 1, 1)), c: trim.clone() });
            }
          }
        }
      }
    }

    // --- cubierta ----------------------------------------------------------
    if (gable) {
      addGable(roofTileP, P, box, top, wall, trim, 1.3 + r() * 0.9);
    } else {
      const contour = ring.map(([x, z]) => new Vector2(x, z));
      const tris = ShapeUtils.triangulateShape(contour, []);
      const tile = !cathedral && levels <= 3 && r() < 0.6;
      const RP = tile ? roofTileP : roofFlatP;
      const rc = tile ? new Color(1, 1, 1) : new Color(0.9, 0.88, 0.85);
      for (const [a, bb, c] of tris) {
        let v = [ring[a], ring[bb], ring[c]];
        // normal hacia arriba
        const cross = (v[1][0] - v[0][0]) * (v[2][1] - v[0][1]) - (v[1][1] - v[0][1]) * (v[2][0] - v[0][0]);
        if (cross > 0) v = [v[0], v[2], v[1]];
        tri(
          RP,
          v.map(([x, z]) => [x, top, z]),
          [0, 1, 0],
          v.map(([x, z]) => [x / 2.2, z / 2.2]),
          rc,
          [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
          trim,
        );
      }
    }
  }

  // --- mallas combinadas ---------------------------------------------------
  const plaster = assets.material('plaster', { vertexColors: true, metalness: 0 });
  plaster.metalnessMap = null;
  const brickMat = assets.material('brick', { vertexColors: true, metalness: 0 });
  brickMat.metalnessMap = null;
  for (const m of [plaster, brickMat]) {
    m.onBeforeCompile = facadePatch;
    m.customProgramCacheKey = () => 'facade';
  }
  const roofMat = assets.material('roof', { metalness: 0, side: DoubleSide, vertexColors: true });
  roofMat.metalnessMap = null;
  const flatMat = assets.material('pave', { metalness: 0, vertexColors: true });
  flatMat.metalnessMap = null;
  const add = (p: Parts, mat: MeshStandardMaterial) => {
    if (!p.pos.length) return;
    const mesh = new Mesh(toGeometry(p), mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  add(plasterP, plaster);
  add(brickP, brickMat);
  add(roofTileP, roofMat);
  add(roofFlatP, flatMat);

  // --- instancias de fachada ----------------------------------------------
  const inst = (geo: BufferGeometry, mat: MeshStandardMaterial, list: Inst[], shadow = false) => {
    if (!list.length) return;
    const mesh = new InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m);
      mesh.setColorAt(i, it.c);
    });
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  };
  const paintMat = new MeshStandardMaterial({ roughness: 0.55, metalness: 0 });
  inst(windowFrame(), paintMat, windows);
  inst(windowShutters(), paintMat, windows.filter((_, i) => i % 3 !== 0));
  inst(doorGeometry(), paintMat, doors);
  inst(boxUV(1, 0.14, 1.1, 1), new MeshStandardMaterial({ roughness: 0.8 }), balconies, true);
  inst(railGeometry(), paintMat, rails, true);

  for (const sgn of signs) {
    const tex = textTexture([sgn.text], { w: 512, h: 128, bg: '#F2EFE9', fg: '#1a1a1a' });
    const face = new MeshStandardMaterial({ map: tex, roughness: 0.6 });
    const m = new Mesh(boxUV(2.2, 0.55, 0.06, 1), [paintMat, paintMat, paintMat, paintMat, face, paintMat]);
    m.geometry.clearGroups();
    for (let i = 0; i < 6; i++) m.geometry.addGroup(i * 6, 6, i);
    m.applyMatrix4(sgn.m.clone().multiply(new Matrix4().makeTranslation(0, 0, 0.08)));
    group.add(m);
  }

  group.add(buildStreets(track, geo, assets));
  if (quality !== 'low') group.add(buildOverheads(track, geo, r));
  return group;
}

/** Matriz con x = a lo largo del muro (izq→der visto de frente), z = normal hacia afuera. */
function fixFacing(out: Matrix4, _along: Vector3, normal: Vector3, pos: Vector3) {
  const y = new Vector3(0, 1, 0);
  const x = new Vector3().crossVectors(y, normal).normalize();
  out.makeBasis(x, y, normal);
  out.setPosition(pos);
  return out;
}

/** Techo a dos aguas sobre el rectángulo orientado, con tímpanos. */
function addGable(
  roof: Parts,
  wallP: Parts,
  box: { c: [number, number]; ax: [number, number]; w: number; d: number },
  top: number,
  wall: Color,
  trim: Color,
  h: number,
) {
  // cumbrera en el eje largo
  let ax = box.ax;
  let w = box.w;
  let d = box.d;
  if (d > w) {
    ax = [-ax[1], ax[0]];
    [w, d] = [d, w];
  }
  const ov = 0.6;
  const hw = w / 2 + 0.3;
  const hd = d / 2 + ov;
  const [cx, cz] = box.c;
  const P = (a: number, b: number, y: number) => [cx + ax[0] * a - ax[1] * b, y, cz + ax[1] * a + ax[0] * b];
  const ridgeY = top + h;
  const eaveY = top - ov * (h / (d / 2));
  const white = new Color(1, 1, 1);
  const zero = [0, 0, 0];
  const slope = Math.hypot(h + (top - eaveY), hd);
  for (const sgn of [1, -1]) {
    const a0 = P(-hw, sgn * hd, eaveY);
    const a1 = P(hw, sgn * hd, eaveY);
    const b1 = P(hw, 0, ridgeY);
    const b0 = P(-hw, 0, ridgeY);
    const e1 = new Vector3(...(a1 as [number, number, number])).sub(new Vector3(...(a0 as [number, number, number])));
    const e2 = new Vector3(...(b0 as [number, number, number])).sub(new Vector3(...(a0 as [number, number, number])));
    const n = new Vector3().crossVectors(e1, e2).normalize();
    let quad = [a0, a1, b1, b0];
    let uvq = [
      [0, 0],
      [w, 0],
      [w, slope],
      [0, slope],
    ];
    if (n.y < 0) {
      n.negate();
      quad = [a0, b0, b1, a1];
      uvq = [
        [0, 0],
        [0, slope],
        [w, slope],
        [w, 0],
      ];
    }
    const nn = [n.x, n.y, n.z];
    const uv = uvq.map(([u, v]) => [u / 2.2, v / 2.2]);
    tri(roof, [quad[0], quad[1], quad[2]], nn, [uv[0], uv[1], uv[2]], white, [zero, zero, zero], trim);
    tri(roof, [quad[0], quad[2], quad[3]], nn, [uv[0], uv[2], uv[3]], white, [zero, zero, zero], trim);
  }
  // tímpanos (triángulos de muro en los extremos)
  for (const sgn of [1, -1]) {
    const a = P(sgn * (w / 2), -d / 2, top);
    const b = P(sgn * (w / 2), d / 2, top);
    const c = P(sgn * (w / 2), 0, ridgeY);
    const n = [ax[0] * sgn, 0, ax[1] * sgn];
    const order = sgn > 0 ? [a, c, b] : [a, b, c];
    // asegura que la cara mire hacia afuera
    const v0 = new Vector3(...(order[0] as [number, number, number]));
    const nrm = new Vector3()
      .subVectors(new Vector3(...(order[1] as [number, number, number])), v0)
      .cross(new Vector3().subVectors(new Vector3(...(order[2] as [number, number, number])), v0));
    const tv = nrm.dot(new Vector3(n[0], 0, n[2])) < 0 ? [order[0], order[2], order[1]] : order;
    tri(wallP, tv, n, tv.map(([x, y, z]) => [(x + z) / 2.5, y / 2.5]), wall, [zero, zero, zero], trim);
  }
}

/** Calles reales de OpenStreetMap (fuera de la pista) drapeadas sobre el relieve. */
function buildStreets(track: Track, geo: GeoData, assets: Assets) {
  const asphalt: number[] = [];
  const asphaltUv: number[] = [];
  const steps: number[] = [];
  const stepsUv: number[] = [];
  for (const st of geo.streets) {
    const P = st.steps ? steps : asphalt;
    const U = st.steps ? stepsUv : asphaltUv;
    const hw = st.width / 2;
    for (let i = 0; i < st.pts.length - 1; i++) {
      const [x0, z0] = st.pts[i];
      const [x1, z1] = st.pts[i + 1];
      const len = Math.hypot(x1 - x0, z1 - z0);
      if (len < 0.1) continue;
      const nx = -(z1 - z0) / len;
      const nz = (x1 - x0) / len;
      const n = Math.max(1, Math.ceil(len / 4));
      for (let k = 0; k < n; k++) {
        const t0 = k / n;
        const t1 = (k + 1) / n;
        const ax = x0 + (x1 - x0) * t0;
        const az = z0 + (z1 - z0) * t0;
        const bx = x0 + (x1 - x0) * t1;
        const bz = z0 + (z1 - z0) * t1;
        const mid = track.nearest((ax + bx) / 2, (az + bz) / 2);
        if (mid.dist < track.halfWidth(mid.s) + 1.5) continue;
        const v = (x: number, z: number) => [x, geo.terrainHeight(x, z) + 0.07, z];
        const p0 = v(ax - nx * hw, az - nz * hw);
        const p1 = v(ax + nx * hw, az + nz * hw);
        const p2 = v(bx + nx * hw, bz + nz * hw);
        const p3 = v(bx - nx * hw, bz - nz * hw);
        // orden para que la normal mire hacia arriba
        P.push(...p0, ...p2, ...p1, ...p0, ...p3, ...p2);
        const s0 = ((i + t0) * len) / 4;
        const s1 = ((i + t1) * len) / 4;
        U.push(0, s0, st.width / 4, s1, st.width / 4, s0, 0, s0, 0, s1, st.width / 4, s1);
      }
    }
  }
  const g = new Group();
  const mk = (pos: number[], uv: number[], mat: MeshStandardMaterial) => {
    if (!pos.length) return;
    const geom = new BufferGeometry();
    geom.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
    geom.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
    geom.computeVertexNormals();
    // la normal debe mirar arriba: si no, invertimos el material
    const nrm = geom.getAttribute('normal');
    if (nrm.getY(0) < 0) mat.side = DoubleSide;
    const m = new Mesh(geom, mat);
    m.receiveShadow = true;
    g.add(m);
  };
  const road = assets.material('road', { metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  road.metalnessMap = null;
  const pave = assets.material('pave', { metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  pave.metalnessMap = null;
  mk(asphalt, asphaltUv, road);
  mk(steps, stepsUv, pave);
  return g;
}

function windowFrame() {
  const w = 1.15,
    h = 1.72,
    t = 0.09,
    d = 0.14;
  const p = [boxUV(w, t, d), boxUV(w, t, d), boxUV(t, h, d), boxUV(t, h, d), boxUV(0.05, h, 0.06), boxUV(w + 0.25, 0.08, 0.22)];
  p[0].translate(0, -h / 2, d / 2);
  p[1].translate(0, h / 2, d / 2);
  p[2].translate(-w / 2, 0, d / 2);
  p[3].translate(w / 2, 0, d / 2);
  p[4].translate(0, 0, 0.04);
  p[5].translate(0, -h / 2 - 0.06, 0.12);
  return merge(p);
}

/** Postigos abiertos a los lados de cada ventana, típicos del bahareque. */
function windowShutters() {
  const p: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const s = boxUV(0.46, 1.6, 0.04);
    s.translate(side * 0.84, 0, 0.06);
    p.push(s);
    for (let i = 0; i < 6; i++) {
      const slat = boxUV(0.42, 0.045, 0.03);
      slat.translate(side * 0.84, -0.63 + i * 0.25, 0.09);
      p.push(slat);
    }
  }
  return merge(p);
}

function doorGeometry() {
  const p = [boxUV(1.2, 2.4, 0.1), boxUV(1.36, 0.1, 0.16), boxUV(0.08, 2.4, 0.16), boxUV(0.08, 2.4, 0.16)];
  p[1].translate(0, 1.22, 0.02);
  p[2].translate(-0.64, 0, 0.02);
  p[3].translate(0.64, 0, 0.02);
  for (const [x, y] of [
    [-0.27, 0.55],
    [0.27, 0.55],
    [-0.27, -0.45],
    [0.27, -0.45],
  ]) {
    const q = boxUV(0.42, 0.75, 0.04);
    q.translate(x, y, 0.06);
    p.push(q);
  }
  return merge(p);
}

/** Baranda de balcón de 1 m de ancho (se escala en x). */
function railGeometry() {
  const p: BufferGeometry[] = [];
  const top = boxUV(1, 0.06, 0.08);
  top.translate(0, 0.95, 0);
  p.push(top);
  const bottom = boxUV(1, 0.05, 0.06);
  bottom.translate(0, 0.12, 0);
  p.push(bottom);
  for (let i = 0; i < 9; i++) {
    const b = boxUV(0.025, 0.85, 0.025);
    b.translate(-0.45 + i * 0.1125, 0.53, 0);
    p.push(b);
  }
  return merge(p);
}

/** Cables eléctricos y banderines que cruzan la pista entre fachadas reales. */
function buildOverheads(track: Track, geo: GeoData, r: () => number) {
  const g = new Group();
  const cables: BufferGeometry[] = [];
  const flagPos: Matrix4[] = [];
  const flagCol: Color[] = [];
  const flagColors = ['#FF5B1F', '#F2EFE9', '#121212', '#FCD116', '#003893', '#CE1126'];
  for (let s = 30; s < SECTION.stairs[0]; s += 16 + r() * 14) {
    const hw = track.halfWidth(s);
    // solo donde hay casas a ambos lados
    const L = track.point(s, -(hw + 4));
    const R = track.point(s, hw + 4);
    if (!geo.inBuilding(L.x, L.z, 1.5) || !geo.inBuilding(R.x, R.z, 1.5)) continue;
    const a = track.point(s, -(hw + 1.6), 0);
    const b = track.point(s + (r() - 0.5) * 5, hw + 1.6, 0);
    const ha = 6 + r() * 2;
    a.y = track.ground(s) + ha;
    b.y = track.ground(s) + ha + (r() - 0.5);
    const sag = 1 + r();
    const pts: Vector3[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const p = a.clone().lerp(b, t);
      p.y -= Math.sin(t * Math.PI) * sag;
      pts.push(p);
    }
    const curve = new CatmullRomCurve3(pts);
    cables.push(new TubeGeometry(curve, 24, 0.012, 4));
    if (r() < 0.6) {
      const n = Math.floor(a.distanceTo(b) / 0.42);
      const dir = b.clone().sub(a).normalize();
      for (let i = 1; i < n; i++) {
        const p = curve.getPoint(i / n);
        flagPos.push(basisMatrix(p, new Vector3(0, -1, 0).cross(dir).normalize(), new Vector3(0, 1, 0)));
        flagCol.push(new Color(flagColors[i % flagColors.length]));
      }
    }
  }
  if (cables.length) g.add(new Mesh(merge(cables), new MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.6 })));
  if (flagPos.length) {
    const t = new BufferGeometry();
    t.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, -0.17, 0, 0, 0.17, 0, -0.38, 0]), 3));
    t.computeVertexNormals();
    const flags = new InstancedMesh(t, new MeshStandardMaterial({ side: DoubleSide, roughness: 0.7 }), flagPos.length);
    flagPos.forEach((m, i) => {
      flags.setMatrixAt(i, m);
      flags.setColorAt(i, flagCol[i]);
    });
    g.add(flags);
  }
  return g;
}

export type { Building };
