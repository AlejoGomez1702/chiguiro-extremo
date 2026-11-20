import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _m = new Matrix4();
const _q = new Quaternion();
const _v = new Vector3();
const UP = new Vector3(0, 1, 0);

/**
 * Caja con UV en metros (divididos por `scale`) en cada cara, para que las
 * texturas mantengan su tamaño real sin importar las dimensiones.
 */
export function boxUV(w: number, h: number, d: number, scale = 1): BufferGeometry {
  const hw = w / 2,
    hh = h / 2,
    hd = d / 2;
  // [normal, u-axis, v-axis, size u, size v, offset]
  const faces: [number[], number[], number[], number, number, number][] = [
    [[1, 0, 0], [0, 0, -1], [0, 1, 0], d, h, hw],
    [[-1, 0, 0], [0, 0, 1], [0, 1, 0], d, h, hw],
    [[0, 1, 0], [1, 0, 0], [0, 0, -1], w, d, hh],
    [[0, -1, 0], [1, 0, 0], [0, 0, 1], w, d, hh],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0], w, h, hd],
    [[0, 0, -1], [-1, 0, 0], [0, 1, 0], w, h, hd],
  ];
  const pos: number[] = [],
    nor: number[] = [],
    uv: number[] = [],
    idx: number[] = [];
  for (const [n, u, v, su, sv, off] of faces) {
    const base = pos.length / 3;
    for (const [a, b] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      for (let k = 0; k < 3; k++) pos.push(n[k] * off + u[k] * a * (su / 2) + v[k] * b * (sv / 2));
      nor.push(...n);
      uv.push(((a + 1) / 2) * (su / scale), ((b + 1) / 2) * (sv / scale));
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  return g;
}

/** Cilindro entre dos puntos. */
export function tube(a: Vector3, b: Vector3, r: number, seg = 10, r2 = r): BufferGeometry {
  const len = a.distanceTo(b);
  const g = new CylinderGeometry(r2, r, len, seg, 1, false);
  _q.setFromUnitVectors(UP, _v.subVectors(b, a).normalize());
  _m.compose(a.clone().add(b).multiplyScalar(0.5), _q, new Vector3(1, 1, 1));
  g.applyMatrix4(_m);
  return g;
}

/** Pinta toda la geometría con un color de vértice (permite valores > 1). */
export function paint(g: BufferGeometry, c: Color | [number, number, number]): BufferGeometry {
  const n = g.getAttribute('position').count;
  const arr = new Float32Array(n * 3);
  const [r, gg, b] = Array.isArray(c) ? c : [c.r, c.g, c.b];
  for (let i = 0; i < n; i++) {
    arr[i * 3] = r;
    arr[i * 3 + 1] = gg;
    arr[i * 3 + 2] = b;
  }
  g.setAttribute('color', new BufferAttribute(arr, 3));
  return g;
}

/** Une geometrías normalizando atributos (todas indexadas o ninguna). */
export function merge(list: BufferGeometry[]): BufferGeometry {
  const norm = list.map((g) => (g.index ? g.toNonIndexed() : g));
  const keys = Object.keys(norm[0].attributes);
  for (const g of norm) for (const k of Object.keys(g.attributes)) if (!keys.includes(k)) g.deleteAttribute(k);
  const out = mergeGeometries(norm, false);
  if (!out) throw new Error('merge failed');
  return out;
}

/** Matriz desde posición, base (adelante, arriba) y escala. */
export function basisMatrix(pos: Vector3, forward: Vector3, up: Vector3, scale = new Vector3(1, 1, 1), out = new Matrix4()) {
  const f = forward.clone().normalize();
  const r = new Vector3().crossVectors(f, up).normalize();
  const u = new Vector3().crossVectors(r, f).normalize();
  out.makeBasis(f, u, r);
  out.scale(scale);
  out.setPosition(pos);
  return out;
}

/** PRNG determinista para que la ciudad sea siempre igual (SSR/cliente, recargas). */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ruido de valor 2D + fbm, suficiente para terreno. */
export function makeNoise(seed = 7) {
  const r = rng(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i).sort(() => r() - 0.5);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const vals = Float32Array.from({ length: 256 }, () => r() * 2 - 1);
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const n2 = (x: number, y: number) => {
    const xi = Math.floor(x),
      yi = Math.floor(y);
    const xf = x - xi,
      yf = y - yi;
    const h = (i: number, j: number) => vals[perm[(perm[(xi + i) & 255] + yi + j) & 255]];
    const u = fade(xf),
      v = fade(yf);
    return (h(0, 0) * (1 - u) + h(1, 0) * u) * (1 - v) + (h(0, 1) * (1 - u) + h(1, 1) * u) * v;
  };
  const fbm = (x: number, y: number, oct = 5) => {
    let a = 0.5,
      f = 1,
      s = 0;
    for (let i = 0; i < oct; i++) {
      s += a * n2(x * f, y * f);
      f *= 2.03;
      a *= 0.5;
    }
    return s;
  };
  return { n2, fbm };
}
