import {
  BufferAttribute,
  CanvasTexture,
  MeshDepthMaterial,
  RGBADepthPacking,
  SRGBColorSpace,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three';
import { Assets } from '../assets';
import { makeNoise, merge, paint, rng, tube } from '../geo';
import { GeoData } from './geo-data';
import { Track } from './track';

const noise = makeNoise(11);
const NEAR_HALF = 1390;
const FAR_R = 3150;

export function buildTerrain(track: Track, geo: GeoData, assets: Assets, quality: 'low' | 'mid' | 'high') {
  const group = new Group();

  // --- relieve real cercano (malla de ~8 m) ------------------------------
  const seg = quality === 'low' ? 240 : 350;
  const g = new PlaneGeometry(NEAR_HALF * 2, NEAR_HALF * 2, seg, seg);
  g.rotateX(-Math.PI / 2);
  const pos = g.getAttribute('position') as BufferAttribute;
  const uv = g.getAttribute('uv') as BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const lush = new Color('#5c8a37');
  const dark = new Color('#2f5a24');
  const urbanCol = new Color('#5d5a55');
  const tmp = new Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, geo.terrainHeight(x, z) + noise.n2(x * 0.05, z * 0.05) * 0.35);
    uv.setXY(i, x / 7, z / 7);
    const n = noise.n2(x * 0.02, z * 0.02) * 0.5 + 0.5;
    tmp.copy(lush).lerp(dark, n * 0.8);
    // suelo urbano (patios, andenes, lotes) donde hay edificios
    const corridor = Math.max(0, 1 - track.nearest(x, z).dist / 30);
    tmp.lerp(urbanCol, Math.min(1, geo.urban(x, z) * 1.2 + corridor));
    // compensa el tono marrón de la textura base
    col[i * 3] = tmp.r * 1.25;
    col[i * 3 + 1] = tmp.g * 1.55;
    col[i * 3 + 2] = tmp.b * 1.3;
  }
  g.setAttribute('color', new BufferAttribute(col, 3));
  g.computeVertexNormals();
  const grass = assets.material('grass', { vertexColors: true, metalness: 0 });
  grass.metalnessMap = null;
  const terrain = new Mesh(g, grass);
  terrain.receiveShadow = true;
  group.add(terrain);

  group.add(buildFarTerrain(geo, quality));
  group.add(buildMountains(geo));
  group.add(buildTrees(track, geo, quality));
  group.add(buildWaxPalms(track, geo, quality));
  return group;
}

/** Anillo con el relieve real grueso (32 m) hasta ~3 km. */
function buildFarTerrain(geo: GeoData, quality: string) {
  const rings = quality === 'low' ? 50 : 80;
  const segs = quality === 'low' ? 180 : 260;
  const r0 = NEAR_HALF - 30;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const green = new Color('#34502b');
  const dark = new Color('#22381e');
  const c = new Color();
  for (let i = 0; i <= rings; i++) {
    const r = r0 + (FAR_R - r0) * Math.pow(i / rings, 1.4);
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      pos.push(x, geo.demHeight(x, z) - 1.2, z);
      c.copy(green).lerp(dark, noise.n2(x * 0.01, z * 0.01) * 0.5 + 0.5);
      col.push(c.r, c.g, c.b);
    }
  }
  ringIndex(idx, rings, segs);
  return meshFrom(pos, col, idx, true);
}

/** Cordillera más allá del modelo de elevación, continua con su borde. */
function buildMountains(geo: GeoData) {
  const rings = 60;
  const segs = 240;
  const r1 = 11000;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const near = new Color('#2b4027');
  const far = new Color('#3a4a52');
  const c = new Color();
  const edge: number[] = [];
  for (let j = 0; j <= segs; j++) {
    const a = (j / segs) * Math.PI * 2;
    edge.push(geo.demHeight(Math.cos(a) * FAR_R, Math.sin(a) * FAR_R));
  }
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const r = FAR_R - 40 + (r1 - FAR_R) * Math.pow(t, 1.5);
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const ridge = Math.pow(1 - Math.abs(noise.fbm(x * 0.0006, z * 0.0006, 6)), 2.2);
      const rise = Math.min(1, t * 2.5);
      const y = edge[j] * (1 - rise) + rise * (120 + ridge * (500 + 900 * t)) - 2;
      pos.push(x, y, z);
      c.copy(near).lerp(far, Math.min(1, t * 1.4));
      col.push(c.r, c.g, c.b);
    }
  }
  ringIndex(idx, rings, segs);
  return meshFrom(pos, col, idx, false);
}

function ringIndex(idx: number[], rings: number, segs: number) {
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j;
      const b = a + segs + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
}

function meshFrom(pos: number[], col: number[], idx: number[], shadows: boolean) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('color', new BufferAttribute(new Float32Array(col), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new Mesh(g, new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  m.receiveShadow = shadows;
  return m;
}

/** Textura de follaje: racimos de hojas con transparencia, dibujados en canvas. */
function leafTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const r = rng(9);
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 110;
    const x = 128 + Math.cos(a) * d;
    const y = 128 + Math.sin(a) * d * 0.9;
    const l = 30 + r() * 26;
    g.save();
    g.translate(x, y);
    g.rotate(r() * Math.PI * 2);
    g.fillStyle = `hsl(${95 + r() * 30}, ${45 + r() * 20}%, ${l}%)`;
    g.beginPath();
    g.ellipse(0, 0, 9 + r() * 6, 4 + r() * 2.5, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 1;
    g.stroke();
    g.restore();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Tronco y ramas de un árbol (las hojas son tarjetas aparte). */
function trunkGeometry(seed: number) {
  const r = rng(seed);
  const parts = [paint(tube(new Vector3(0, -1, 0), new Vector3(0, 4.2, 0), 0.26, 7, 0.14), new Color('#4a3a2a'))];
  for (let i = 0; i < 5; i++) {
    const a = r() * Math.PI * 2;
    const from = new Vector3(0, 2.6 + r() * 1.5, 0);
    const to = new Vector3(Math.cos(a) * (1.6 + r()), 4.6 + r() * 2, Math.sin(a) * (1.6 + r()));
    parts.push(paint(tube(from, to, 0.1, 5, 0.04), new Color('#4a3a2a')));
  }
  return merge(parts);
}

/** Copa de tarjetas cruzadas distribuidas en un elipsoide. */
function crownGeometry(seed: number) {
  const r = rng(seed);
  const cards: BufferGeometry[] = [];
  for (let i = 0; i < 34; i++) {
    const size = 1.7 + r() * 1.1;
    const p = new PlaneGeometry(size, size);
    p.rotateY(r() * Math.PI);
    p.rotateX((r() - 0.5) * 1.2);
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 2.1;
    p.translate(Math.cos(a) * d, 5.2 + (r() - 0.35) * 3.2, Math.sin(a) * d);
    cards.push(p);
  }
  const g = merge(cards);
  // normales "esféricas" para que la copa se ilumine como un volumen
  const pos = g.getAttribute('position') as BufferAttribute;
  const nor = g.getAttribute('normal') as BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const v = new Vector3(pos.getX(i), pos.getY(i) - 5.4, pos.getZ(i)).normalize();
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

function buildTrees(track: Track, geo: GeoData, quality: string) {
  const count = quality === 'low' ? 1400 : 4200;
  const r = rng(5);
  const leaves = leafTexture();
  const leafMat = new MeshStandardMaterial({ map: leaves, alphaTest: 0.45, side: DoubleSide, roughness: 0.85 });
  const depth = new MeshDepthMaterial({ map: leaves, alphaTest: 0.45, depthPacking: RGBADepthPacking });
  const barkMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  const kinds = [0, 1, 2].map((k) => ({ trunk: trunkGeometry(k + 1), crown: crownGeometry(k + 11) }));
  const per = Math.ceil(count / kinds.length);
  const trunks = kinds.map((k) => new InstancedMesh(k.trunk, barkMat, per));
  const crowns = kinds.map((k) => {
    const m = new InstancedMesh(k.crown, leafMat, per);
    m.customDepthMaterial = depth;
    return m;
  });
  const counts = [0, 0, 0];
  const m = new Matrix4();
  const q = new Quaternion();
  const color = new Color();
  let tries = 0;
  while (counts.reduce((a, b) => a + b) < count && tries++ < count * 8) {
    const x = (r() - 0.5) * NEAR_HALF * 1.95;
    const z = (r() - 0.5) * NEAR_HALF * 1.95;
    const urban = geo.urban(x, z);
    // en la ciudad solo árboles sueltos; en las laderas, manchas de bosque
    if (urban > 0.5 && r() > 0.06) continue;
    if (urban <= 0.5 && noise.n2(x * 0.012, z * 0.012) < -0.1) continue;
    if (track.nearest(x, z).dist < 10 || geo.inBuilding(x, z, 2)) continue;
    const y = geo.terrainHeight(x, z);
    const v = Math.floor(r() * 3);
    if (counts[v] >= per) continue;
    const sc = 0.8 + r() * 0.9;
    q.setFromAxisAngle(new Vector3(0, 1, 0), r() * Math.PI * 2);
    m.compose(new Vector3(x, y - 0.3, z), q, new Vector3(sc, sc * (0.9 + r() * 0.4), sc));
    trunks[v].setMatrixAt(counts[v], m);
    crowns[v].setMatrixAt(counts[v], m);
    crowns[v].setColorAt(counts[v], color.setHSL(0.27 + r() * 0.06, 0.35 + r() * 0.2, 0.42 + r() * 0.18));
    counts[v]++;
  }
  const grp = new Object3D();
  [...trunks, ...crowns].forEach((mesh, i) => {
    mesh.count = counts[i % 3];
    mesh.castShadow = quality !== 'low';
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    grp.add(mesh);
  });
  return grp;
}

/**
 * Palma de cera del Quindío: árbol nacional de Colombia, tronco altísimo y
 * corona pequeña. Le da identidad al paisaje cafetero.
 */
function buildWaxPalms(track: Track, geo: GeoData, quality: string) {
  const r = rng(21);
  const trunkG = paint(tube(new Vector3(0, -1, 0), new Vector3(0, 1, 0), 0.24, 8, 0.2), new Color('#cfc8b8'));
  trunkG.translate(0, 1, 0);
  const fronds: BufferGeometry[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + r() * 0.3;
    const len = 3.2 + r() * 1.2;
    const segs = 8;
    const p: number[] = [];
    const idx: number[] = [];
    for (let k = 0; k <= segs; k++) {
      const t = k / segs;
      const out = t * len;
      const droop = Math.sin(t * Math.PI * 0.55) * 1.4 - t * t * 2.2;
      const w = Math.sin(t * Math.PI) * 0.55 + 0.05;
      const px = Math.cos(a) * out;
      const pz = Math.sin(a) * out;
      const sx = -Math.sin(a) * w;
      const sz = Math.cos(a) * w;
      p.push(px - sx, droop, pz - sz, px + sx, droop, pz + sz);
      if (k < segs) {
        const b = k * 2;
        idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }
    const fg = new BufferGeometry();
    fg.setAttribute('position', new BufferAttribute(new Float32Array(p), 3));
    fg.setIndex(idx);
    fg.computeVertexNormals();
    fronds.push(paint(fg, new Color('#4e7a32').multiplyScalar(0.8 + r() * 0.4)));
  }
  const crown = merge(fronds);
  const trunkMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const leafMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: DoubleSide });
  const n = quality === 'low' ? 40 : 90;
  const trunks = new InstancedMesh(trunkG, trunkMat, n);
  const crowns = new InstancedMesh(crown, leafMat, n);
  const m = new Matrix4();
  const q = new Quaternion();
  let c = 0;
  for (let tries = 0; c < n && tries < 4000; tries++) {
    const x = (r() - 0.5) * 1600;
    const z = (r() - 0.5) * 1600;
    if (geo.urban(x, z) > 0.35 || geo.inBuilding(x, z, 3) || track.nearest(x, z).dist < 14) continue;
    const y = geo.terrainHeight(x, z);
    const h = 18 + r() * 16;
    q.setFromAxisAngle(new Vector3(0, 1, 0), r() * 6.28);
    m.compose(new Vector3(x, y - 0.5, z), q, new Vector3(1, h / 2, 1));
    trunks.setMatrixAt(c, m);
    m.compose(new Vector3(x, y - 0.5 + h, z), q, new Vector3(1, 1, 1));
    crowns.setMatrixAt(c, m);
    c++;
  }
  trunks.count = crowns.count = c;
  trunks.castShadow = crowns.castShadow = true;
  const g = new Group();
  g.add(trunks, crowns);
  return g;
}
