import {
  BufferGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { Assets, ModelKey, textTexture } from '../assets';
import { basisMatrix, boxUV, merge, paint, rng, tube } from '../geo';
import { GeoData } from './geo-data';
import { SECTION, Track } from './track';

const UP = new Vector3(0, 1, 0);

/** Instancia todas las mallas de un glTF con las transformaciones dadas. */
function instanceModel(assets: Assets, key: ModelKey, transforms: Matrix4[], shadow = true) {
  const g = new Group();
  const gltf = assets.models.get(key);
  if (!gltf || !transforms.length) return g;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const im = new InstancedMesh(mesh.geometry, mesh.material, transforms.length);
    transforms.forEach((t, i) => im.setMatrixAt(i, t.clone().multiply(mesh.matrixWorld)));
    im.castShadow = shadow;
    im.receiveShadow = true;
    im.computeBoundingSphere();
    g.add(im);
  });
  return g;
}

/** Matriz orientada a lo largo de la pista. */
function along(track: Track, s: number, lateral: number, up = 0, yaw = 0, scale = 1, y?: number) {
  const f = track.frame(s);
  const p = track.point(s, lateral, up);
  if (y !== undefined) p.y = y;
  const fwd = f.forward.clone().applyAxisAngle(UP, yaw);
  return basisMatrix(p, fwd, UP, new Vector3(scale, scale, scale));
}

export interface Crowd {
  group: Object3D;
  update(t: number, riderS: number): void;
}

/** Tramo con valla: [desde, hasta, lado]. */
type Span = [number, number, number];

export function buildProps(track: Track, geo: GeoData, assets: Assets, quality: 'low' | 'mid' | 'high') {
  const r = rng(77);
  const group = new Group();
  const free = (s: number, lat: number, margin = 0.4) => {
    const p = track.point(s, lat);
    return !geo.inBuilding(p.x, p.z, margin);
  };

  // --- faroles y mobiliario urbano sobre los andenes -----------------------
  const lamps: Matrix4[] = [];
  const pots: Matrix4[] = [];
  const boxes: Matrix4[] = [];
  const shrubs: Matrix4[] = [];
  let side = 1;
  for (let s = 30; s < SECTION.plaza; s += 22) {
    const stairs = track.surface(s) === 'stairs';
    const hw = track.halfWidth(s);
    const lat = side * (stairs ? hw + 0.45 : hw + 1.1);
    const y = track.ground(s) + (stairs ? 0.95 : 0.2);
    if (free(s, lat)) lamps.push(along(track, s, lat, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2, 1, y));
    side *= -1;
    if (stairs) {
      for (const sd of [-1, 1]) if (r() < 0.6) shrubs.push(along(track, s + r() * 6, sd * (hw + 1.6), 0.3, r() * 6, 0.7 + r() * 0.4));
      continue;
    }
    const ps = s + 6 + r() * 8;
    const pl = (r() < 0.5 ? -1 : 1) * (track.halfWidth(ps) + 1.55);
    if (r() < 0.5 && free(ps, pl, 0.3)) pots.push(along(track, ps, pl, 0, r() * 6, 0.9 + r() * 0.4, track.ground(ps) + 0.2));
    const bs = s + 11;
    const bl = -side * (track.halfWidth(bs) + 1.5);
    if (r() < 0.15 && free(bs, bl, 0.3)) boxes.push(along(track, bs, bl, 0, bl > 0 ? Math.PI / 2 : -Math.PI / 2, 1, track.ground(bs) + 0.2));
  }
  for (let i = 0; i < 14; i++) {
    const s = SECTION.plaza + 30 + r() * 60;
    const lat = (r() < 0.5 ? -1 : 1) * (10 + r() * 4);
    if (free(s, lat)) shrubs.push(along(track, s, lat, 0, r() * 6, 1 + r() * 0.8));
  }
  group.add(instanceModel(assets, 'street_lamp_01', lamps));
  group.add(instanceModel(assets, 'shrub_02', shrubs, quality !== 'low'));
  group.add(instanceModel(assets, 'potted_plant_02', pots));
  group.add(instanceModel(assets, 'utility_box_01', boxes));

  // barreras de concreto en la aproximación al drop
  const barriers: Matrix4[] = [];
  for (const sd of [-1, 1]) {
    for (let s = SECTION.dropRamp[0] - 14; s < SECTION.dropRamp[0] - 1; s += 2.2) barriers.push(along(track, s, sd * 2.4, 0, 0, 1, track.ground(s)));
  }
  group.add(instanceModel(assets, 'concrete_road_barrier', barriers));

  // --- vallas de público con pancarta ----------------------------------------
  const spans: Span[] = [];
  for (const sd of [-1, 1]) {
    spans.push([SECTION.kicker[0] - 22, SECTION.landing[1] + 16, sd]);
    spans.push([SECTION.curve[0], SECTION.curve[1], sd]);
    spans.push([SECTION.dropRamp[0] - 4, SECTION.drop + 30, sd]);
    spans.push([SECTION.stairs[1] - 40, SECTION.stairs[1], sd]);
    spans.push([SECTION.plaza + 2, SECTION.finish + 36, sd]);
  }
  const fenceLat = (s: number) => (s > SECTION.plaza ? 4.2 : track.halfWidth(s) + (track.surface(s) === 'stairs' ? 0.75 : 0.3));
  const panel = 2.4;
  const fences: { m: Matrix4; sd: number }[] = [];
  for (const [a, b, sd] of spans) {
    for (let s = a; s < b; s += panel) {
      const lat = sd * fenceLat(s);
      if (!free(s + panel / 2, lat, 0.2)) continue;
      const y = track.surface(s) === 'stairs' ? track.ground(s + panel / 2) + 0.3 : undefined;
      fences.push({ m: along(track, s + panel / 2, lat, s > SECTION.plaza ? 0 : 0.18, 0, 1, y), sd });
    }
  }
  const fenceMesh = new InstancedMesh(fenceGeometry(panel), new MeshStandardMaterial({ color: '#9aa0a6', metalness: 0.8, roughness: 0.35 }), fences.length);
  const bannerTex = textTexture(['DOWNTOWN', 'SERIE LATINOAMÉRICA 2027'], { w: 1024, h: 256 });
  const bannerTex2 = textTexture(['MANIZALES · PARADA 01'], { w: 1024, h: 256, bg: '#121212', fg: '#FF5B1F' });
  const bannerGeo = new PlaneGeometry(panel - 0.06, 0.78);
  bannerGeo.translate(0, 0.55, 0);
  const banners = [
    new InstancedMesh(bannerGeo, new MeshStandardMaterial({ map: bannerTex, roughness: 0.75, side: DoubleSide }), fences.length),
    new InstancedMesh(bannerGeo, new MeshStandardMaterial({ map: bannerTex2, roughness: 0.75, side: DoubleSide }), fences.length),
  ];
  const counts = [0, 0];
  fences.forEach(({ m, sd }, i) => {
    fenceMesh.setMatrixAt(i, m);
    const k = i % 3 === 2 ? 1 : 0;
    banners[k].setMatrixAt(counts[k]++, m.clone().multiply(new Matrix4().makeTranslation(0, 0, -sd * 0.04)));
  });
  banners.forEach((b, i) => {
    b.count = counts[i];
    b.castShadow = true;
    group.add(b);
  });
  fenceMesh.castShadow = true;
  group.add(fenceMesh);

  // --- salida, meta, fan zone y Catedral ----------------------------------
  group.add(startHouse(track));
  group.add(finishArch(track));
  group.add(fanZone(track));
  group.add(cathedralTower(geo, assets));

  const crowd = buildCrowd(track, geo, spans, fenceLat, quality, r);
  group.add(crowd.group);
  return { group, crowd };
}

function fenceGeometry(w: number) {
  const parts: BufferGeometry[] = [];
  const h = 1.1;
  const half = w / 2;
  const a = (x: number, y: number) => new Vector3(x, y, 0);
  parts.push(tube(a(-half, 0.12), a(half, 0.12), 0.02, 6));
  parts.push(tube(a(-half, h), a(half, h), 0.02, 6));
  parts.push(tube(a(-half, 0.12), a(-half, h), 0.02, 6));
  parts.push(tube(a(half, 0.12), a(half, h), 0.02, 6));
  for (let i = 1; i < 14; i++) {
    const x = -half + (i / 14) * w;
    parts.push(tube(a(x, 0.14), a(x, h - 0.02), 0.008, 4));
  }
  for (const x of [-half + 0.1, half - 0.1]) parts.push(tube(new Vector3(x, 0, -0.35), new Vector3(x, 0, 0.35), 0.02, 4));
  return merge(parts);
}

function startHouse(track: Track) {
  const g = new Group();
  const s = 2.5;
  const f = track.frame(s);
  const y = track.ground(s);
  const base = track.point(s, 0);
  const mat = new MeshStandardMaterial({ color: '#121212', roughness: 0.6 });
  const legs: BufferGeometry[] = [];
  for (const lat of [-2.1, 2.1]) {
    const p = track.point(s, lat);
    legs.push(tube(new Vector3(p.x, y - 1, p.z), new Vector3(p.x, y + 3.4, p.z), 0.09, 8));
  }
  g.add(new Mesh(merge(legs), mat));
  const tex = textTexture(['SALIDA'], { w: 1024, h: 256, bg: '#FF5B1F', fg: '#121212' });
  for (const flip of [0, Math.PI]) {
    const banner = new Mesh(new PlaneGeometry(4.4, 1.1), new MeshStandardMaterial({ map: tex, roughness: 0.7 }));
    banner.applyMatrix4(basisMatrix(new Vector3(base.x, y + 3.1, base.z), f.right.clone().negate(), UP));
    banner.rotateY(flip);
    banner.translateZ(0.02);
    g.add(banner);
  }
  const tent = new Mesh(new ConeGeometry(3.2, 1.4, 4, 1, true), new MeshStandardMaterial({ color: '#FF5B1F', side: DoubleSide, roughness: 0.7 }));
  tent.position.copy(track.point(-3, 0, 4.2));
  tent.rotation.y = Math.PI / 4 - track.heading(0);
  tent.castShadow = true;
  g.add(tent);
  return g;
}

function finishArch(track: Track) {
  const g = new Group();
  const s = SECTION.finish;
  const f = track.frame(s);
  const c = track.point(s, 0);
  const m = new Mesh(new TorusGeometry(5.2, 0.55, 18, 48, Math.PI), new MeshStandardMaterial({ color: '#FF5B1F', roughness: 0.45 }));
  m.applyMatrix4(basisMatrix(c, f.right.clone().negate(), UP));
  m.castShadow = true;
  g.add(m);
  const tex = textTexture(['META'], { w: 1024, h: 256, bg: '#121212', fg: '#F2EFE9', stripe: '#FF5B1F' });
  for (const flip of [0, Math.PI]) {
    const b = new Mesh(new PlaneGeometry(5.6, 1.4), new MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    b.applyMatrix4(basisMatrix(c.clone().add(new Vector3(0, 4.3, 0)), f.right.clone().negate(), UP));
    b.rotateY(flip);
    b.translateZ(0.6);
    g.add(b);
  }
  return g;
}

function fanZone(track: Track) {
  const g = new Group();
  const canopyMats = ['#121212', '#FF5B1F', '#F2EFE9'].map((c) => new MeshStandardMaterial({ color: c, roughness: 0.7, side: DoubleSide }));
  const legMat = new MeshStandardMaterial({ color: '#cfcfcf', metalness: 0.8, roughness: 0.3 });
  const labels = ['TIENDA OFICIAL', 'KITS', 'HIDRATACIÓN', 'PRENSA', 'PRIMEROS AUXILIOS', 'CAFÉ'];
  let i = 0;
  for (const sd of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const s = SECTION.finish + 14 + k * 7;
      const lat = sd * 9.5;
      const p = track.point(s, lat);
      const canopy = new Mesh(new ConeGeometry(3.4, 1.2, 4, 1, true), canopyMats[(i + k) % 3]);
      canopy.position.set(p.x, p.y + 3.2, p.z);
      canopy.rotation.y = Math.PI / 4 - track.heading(s);
      canopy.castShadow = true;
      g.add(canopy);
      const legs: BufferGeometry[] = [];
      for (const [a, b] of [
        [-2.3, -2.3],
        [-2.3, 2.3],
        [2.3, -2.3],
        [2.3, 2.3],
      ]) {
        const q = track.point(s + a, lat + b);
        legs.push(tube(new Vector3(q.x, p.y, q.z), new Vector3(q.x, p.y + 2.6, q.z), 0.04, 6));
      }
      g.add(new Mesh(merge(legs), legMat));
      const tex = textTexture([labels[i % labels.length]], { w: 1024, h: 160, bg: '#121212', fg: '#F2EFE9' });
      const valance = new Mesh(new PlaneGeometry(4.6, 0.5), new MeshStandardMaterial({ map: tex, side: DoubleSide }));
      valance.applyMatrix4(basisMatrix(track.point(s, lat - sd * 2.3, 2.45), track.frame(s).forward, UP));
      g.add(valance);
      const table = new Mesh(boxUV(2.4, 0.06, 0.8), new MeshStandardMaterial({ color: '#e9e5dc', roughness: 0.6 }));
      table.applyMatrix4(basisMatrix(track.point(s, lat - sd * 1.2, 0.85), track.frame(s).forward, UP));
      table.castShadow = true;
      g.add(table);
      i++;
    }
  }
  const pod = new Group();
  const heights = [0.9, 1.3, 0.6];
  [-1.4, 0, 1.4].forEach((x, k) => {
    const b = new Mesh(boxUV(1.3, heights[k], 1.3, 1), new MeshStandardMaterial({ color: k === 1 ? '#FF5B1F' : '#F2EFE9', roughness: 0.5 }));
    b.position.set(x, heights[k] / 2, 0);
    b.castShadow = true;
    pod.add(b);
  });
  pod.applyMatrix4(basisMatrix(track.point(SECTION.finish + 40, 0), track.frame(SECTION.finish).right, UP));
  g.add(pod);
  return g;
}

/**
 * Torre de la Catedral Basílica de Manizales (≈106 m), en su sitio real sobre
 * la Plaza de Bolívar: es el hito que se ve desde la salida.
 */
function cathedralTower(geo: GeoData, assets: Assets) {
  const g = new Group();
  const b = geo.buildings.find((x) => x.levels === 99);
  if (!b) return g;
  const y = Math.min(...b.ring.map(([x, z]) => geo.terrainHeight(x, z)));
  const stone = assets.material('plaster', { vertexColors: true, metalness: 0 });
  stone.metalnessMap = null;
  const parts: BufferGeometry[] = [];
  const stack: [number, number, number][] = [
    [14, 38, 0],
    [11, 22, 38],
    [8.5, 16, 60],
    [6.5, 12, 76],
  ];
  for (const [w, h, y0] of stack) {
    const p = boxUV(w, h, w, 3);
    p.translate(0, y0 + h / 2, 0);
    parts.push(p);
    // contrafuertes en las esquinas
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const c = boxUV(1.4, h * 0.85, 1.4, 3);
      c.translate((sx * w) / 2, y0 + (h * 0.85) / 2, (sz * w) / 2);
      parts.push(c);
    }
  }
  const geom = paint(merge(parts), [1.0, 0.98, 0.94]);
  geom.translate(b.cx, y, b.cz);
  const tower = new Mesh(geom, stone);
  tower.castShadow = tower.receiveShadow = true;
  g.add(tower);
  const spire = new Mesh(new ConeGeometry(4.2, 18, 8), new MeshStandardMaterial({ color: '#c9c3b6', roughness: 0.7 }));
  spire.position.set(b.cx, y + 88 + 9, b.cz);
  spire.castShadow = true;
  g.add(spire);
  const cross = merge([boxUV(0.5, 4, 0.5), (() => { const c = boxUV(2.2, 0.45, 0.45); c.translate(0, 0.8, 0); return c; })()]);
  const crossMesh = new Mesh(cross, new MeshStandardMaterial({ color: '#d8d2c4', metalness: 0.4, roughness: 0.4 }));
  crossMesh.position.set(b.cx, y + 108, b.cz);
  g.add(crossMesh);
  // pináculos en las esquinas de cada cuerpo y ventanales ojivales oscuros
  const pin = new MeshStandardMaterial({ color: '#d9d3c6', roughness: 0.7 });
  const dark = new MeshStandardMaterial({ color: '#15171a', roughness: 0.35 });
  for (const [w, h, y0] of stack) {
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const c = new Mesh(new ConeGeometry(0.9, 4.5, 6), pin);
      c.position.set(b.cx + (sx * w) / 2, y + y0 + h + 2.2, b.cz + (sz * w) / 2);
      c.castShadow = true;
      g.add(c);
    }
    const rows = Math.max(1, Math.floor(h / 9));
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      for (let row = 0; row < rows; row++) {
        for (const off of w > 9 ? [-w / 4, w / 4] : [0]) {
          const win = new Mesh(new PlaneGeometry(Math.min(2.4, w / 4), Math.min(7, h / rows - 2)), dark);
          const cy = y + y0 + (h / rows) * (row + 0.5);
          win.position.set(b.cx + Math.sin(a) * (w / 2 + 0.03) + Math.cos(a) * off, cy, b.cz + Math.cos(a) * (w / 2 + 0.03) - Math.sin(a) * off);
          win.rotation.y = a;
          g.add(win);
          const arch = new Mesh(new ConeGeometry(Math.min(1.2, w / 8), 1.6, 3), dark);
          arch.position.copy(win.position).setY(cy + Math.min(3.5, (h / rows - 2) / 2) + 0.7);
          arch.rotation.y = a;
          arch.scale.z = 0.05;
          g.add(arch);
        }
      }
    }
  }
  return g;
}

function buildCrowd(track: Track, geo: GeoData, spans: Span[], fenceLat: (s: number) => number, quality: string, r: () => number): Crowd {
  const density = quality === 'low' ? 0.5 : 1;
  type P = { base: Matrix4; s: number; phase: number; amp: number };
  const people: P[] = [];
  for (const [a, b, sd] of spans) {
    for (let s = a; s < b; s += 0.85 / density) {
      const plaza = s > SECTION.plaza;
      const rows = plaza ? 3 : 2;
      for (let row = 0; row < rows; row++) {
        if (r() < 0.32) continue;
        const lat = sd * (fenceLat(s) + 0.55 + row * 0.62 + r() * 0.2);
        const ss = s + (r() - 0.5) * 0.5;
        const p = track.point(ss, lat, plaza ? 0 : 0.2);
        if (geo.inBuilding(p.x, p.z, 0.3)) continue;
        if (track.surface(ss) === 'stairs') p.y = track.ground(ss) + 0.3;
        const f = track.frame(s);
        const look = f.right.clone().multiplyScalar(-sd).applyAxisAngle(UP, (r() - 0.5) * 0.8);
        const sc = 0.92 + r() * 0.16;
        people.push({ base: basisMatrix(p, look, UP, new Vector3(sc, sc, sc)), s, phase: r() * 10, amp: 0.5 + r() });
      }
    }
  }
  const n = people.length;
  const torso = new CapsuleGeometry(0.16, 0.36, 4, 12);
  torso.scale(0.82, 1, 1.32);
  torso.translate(0, 1.2, 0);
  const neck = tube(new Vector3(0, 1.42, 0), new Vector3(0, 1.56, 0), 0.05, 8);
  const armsDown = [-1, 1].flatMap((sd) => [
    tube(new Vector3(0, 1.38, sd * 0.2), new Vector3(0.02, 1.1, sd * 0.25), 0.048, 8),
    tube(new Vector3(0.02, 1.1, sd * 0.25), new Vector3(0.12, 0.9, sd * 0.22), 0.042, 8),
  ]);
  const armsUp = [-1, 1].flatMap((sd) => [
    tube(new Vector3(0, 1.38, sd * 0.2), new Vector3(0.06, 1.62, sd * 0.32), 0.048, 8),
    tube(new Vector3(0.06, 1.62, sd * 0.32), new Vector3(0.1, 1.9, sd * 0.3), 0.042, 8),
  ]);
  const shirtDown = merge([torso, ...armsDown]);
  const shirtUp = merge([torso.clone(), ...armsUp]);
  const legs = merge(
    [-1, 1].flatMap((sd) => {
      const shoe = boxUV(0.26, 0.09, 0.11);
      shoe.translate(0.05, 0.045, sd * 0.09);
      return [tube(new Vector3(0, 0.05, sd * 0.09), new Vector3(0, 0.95, sd * 0.1), 0.06, 8, 0.085), shoe];
    }),
  );
  const head = merge([new SphereGeometry(0.1, 14, 10).scale(0.95, 1.12, 0.9).translate(0, 1.67, 0), neck]);
  const hair = new SphereGeometry(0.106, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55).scale(1, 1.1, 0.95).translate(-0.012, 1.69, 0);
  const up = people.map(() => r() < 0.45);
  const upIdx: number[] = [];
  const downIdx: number[] = [];
  let cu = 0;
  let cd = 0;
  up.forEach((u, i) => {
    upIdx[i] = u ? cu++ : -1;
    downIdx[i] = u ? -1 : cd++;
  });
  const meshes = [
    new InstancedMesh(shirtDown, new MeshStandardMaterial({ roughness: 0.85 }), Math.max(1, cd)),
    new InstancedMesh(shirtUp, new MeshStandardMaterial({ roughness: 0.85 }), Math.max(1, cu)),
    new InstancedMesh(legs, new MeshStandardMaterial({ roughness: 0.9 }), Math.max(1, n)),
    new InstancedMesh(head, new MeshStandardMaterial({ roughness: 0.6 }), Math.max(1, n)),
    new InstancedMesh(hair, new MeshStandardMaterial({ roughness: 0.75 }), Math.max(1, n)),
  ];
  meshes[0].count = cd;
  meshes[1].count = cu;
  for (const m of meshes.slice(2)) m.count = n;
  const slot = (i: number): [InstancedMesh, number][] => [
    up[i] ? [meshes[1], upIdx[i]] : [meshes[0], downIdx[i]],
    [meshes[2], i],
    [meshes[3], i],
    [meshes[4], i],
  ];
  const shirts = ['#FF5B1F', '#F2EFE9', '#121212', '#1F5FA8', '#B3261E', '#2E7D4F', '#E0A526', '#6b6b6b', '#FCD116'];
  const pants = ['#1d2433', '#2a2a2a', '#3b4a63', '#5a4a3a'];
  const skins = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#6b4423', '#a0673a'];
  const hairs = ['#1a1310', '#2b1d14', '#3b2a1e', '#0e0e0e', '#5a4632', '#2a2a2a'];
  const c = new Color();
  people.forEach((p, i) => {
    const [[sm, si], [lm], [hm], [hr]] = slot(i);
    sm.setColorAt(si, c.set(shirts[Math.floor(r() * shirts.length)]));
    lm.setColorAt(i, c.set(pants[Math.floor(r() * pants.length)]));
    hm.setColorAt(i, c.set(skins[Math.floor(r() * skins.length)]));
    hr.setColorAt(i, c.set(hairs[Math.floor(r() * hairs.length)]));
    for (const [m, k] of slot(i)) m.setMatrixAt(k, p.base);
  });
  const group = new Group();
  for (const m of meshes) {
    m.castShadow = quality !== 'low';
    m.receiveShadow = true;
    m.computeBoundingSphere();
    group.add(m);
  }
  const tmp = new Matrix4();
  const off = new Matrix4();
  return {
    group,
    update(t, riderS) {
      for (let i = 0; i < n; i++) {
        const p = people[i];
        const near = Math.max(0, 1 - Math.abs(p.s - riderS) / 30);
        // solo se anima el público cercano al piloto
        if (near === 0 && (i + Math.floor(t * 10)) % 8 !== 0) continue;
        const jump = Math.max(0, Math.sin(t * (6 + p.amp * 2) + p.phase)) * 0.12 * near * p.amp + Math.sin(t * 1.3 + p.phase) * 0.01;
        off.makeTranslation(0, jump, 0);
        tmp.multiplyMatrices(p.base, off);
        for (const [m, k] of slot(i)) m.setMatrixAt(k, tmp);
      }
      for (const m of meshes) m.instanceMatrix.needsUpdate = true;
    },
  };
}
