import { Track } from './track';

interface Grid {
  cell: number;
  n: number;
  half: number;
  data: number[];
}
interface RawCity {
  origin: [number, number];
  base: number;
  /** alturas en decímetros sobre `base` */
  height: Grid;
  /** alturas en metros sobre `base` (malla gruesa de paisaje) */
  far: Grid;
  /** [pisos, x0, z0, x1, z1, ...] en decímetros */
  buildings: number[][];
  /** [ancho (negativo = escalinata), x0, z0, ...] en decímetros */
  streets: number[][];
  parks: number[][];
}

export interface Building {
  levels: number;
  /** anillo en metros, sentido antihorario visto desde arriba */
  ring: [number, number][];
  cx: number;
  cz: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** distancia mínima a la pista */
  dist: number;
}

export interface Street {
  width: number;
  steps: boolean;
  pts: [number, number][];
}

const BIN = 24;

/**
 * Datos reales de Manizales (OpenStreetMap + Copernicus DEM) en metros
 * locales. La pista aplana el relieve en su corredor para que calle y
 * terreno coincidan.
 */
export class GeoData {
  readonly buildings: Building[] = [];
  readonly streets: Street[] = [];
  readonly parks: [number, number][][] = [];
  private grid = new Map<string, number[]>();
  private h: Grid;
  private far: Grid;

  private constructor(
    raw: RawCity,
    private track: Track,
  ) {
    this.h = raw.height;
    this.far = raw.far;
    for (const b of raw.buildings) {
      const ring: [number, number][] = [];
      for (let i = 1; i < b.length; i += 2) ring.push([b[i] / 10, b[i + 1] / 10]);
      // orientación antihoraria en el plano x/z visto desde +y
      let area = 0;
      for (let i = 0; i < ring.length; i++) {
        const [x0, z0] = ring[i];
        const [x1, z1] = ring[(i + 1) % ring.length];
        area += x0 * z1 - x1 * z0;
      }
      if (area > 0) ring.reverse();
      const xs = ring.map((p) => p[0]);
      const zs = ring.map((p) => p[1]);
      const cx = xs.reduce((a, v) => a + v, 0) / xs.length;
      const cz = zs.reduce((a, v) => a + v, 0) / zs.length;
      const bld: Building = {
        levels: b[0],
        ring,
        cx,
        cz,
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minZ: Math.min(...zs),
        maxZ: Math.max(...zs),
        dist: Math.min(...ring.map(([x, z]) => track.nearest(x, z).dist), track.nearest(cx, cz).dist),
      };
      // no dejamos edificios encima de la pista
      if (bld.dist < track.halfWidth(track.nearest(cx, cz).s) + 0.6) continue;
      const id = this.buildings.push(bld) - 1;
      for (let gx = Math.floor(bld.minX / BIN); gx <= Math.floor(bld.maxX / BIN); gx++)
        for (let gz = Math.floor(bld.minZ / BIN); gz <= Math.floor(bld.maxZ / BIN); gz++) {
          const k = `${gx},${gz}`;
          (this.grid.get(k) ?? this.grid.set(k, []).get(k)!).push(id);
        }
    }
    for (const s of raw.streets) {
      const pts: [number, number][] = [];
      for (let i = 1; i < s.length; i += 2) pts.push([s[i] / 10, s[i + 1] / 10]);
      this.streets.push({ width: Math.abs(s[0]), steps: s[0] < 0, pts });
    }
    for (const p of raw.parks) {
      const pts: [number, number][] = [];
      for (let i = 0; i < p.length; i += 2) pts.push([p[i] / 10, p[i + 1] / 10]);
      this.parks.push(pts);
    }
  }

  static async load(url: string, track: Track) {
    const raw = (await (await fetch(url)).json()) as RawCity;
    return new GeoData(raw, track);
  }

  /** Relieve real (malla fina de 8 m, luego la gruesa de 32 m). */
  demHeight(x: number, z: number): number {
    const g = this.h;
    if (Math.abs(x) < g.half - g.cell && Math.abs(z) < g.half - g.cell) return this.bilinear(g, x, z) / 10;
    return this.bilinear(this.far, x, z);
  }

  private bilinear(g: Grid, x: number, z: number) {
    const fx = Math.min(g.n - 1.001, Math.max(0, (x + g.half) / g.cell));
    const fz = Math.min(g.n - 1.001, Math.max(0, (z + g.half) / g.cell));
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    const tx = fx - i;
    const tz = fz - j;
    const d = g.data;
    const a = d[j * g.n + i];
    const b = d[j * g.n + i + 1];
    const c = d[(j + 1) * g.n + i];
    const e = d[(j + 1) * g.n + i + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + e * tx) * tz;
  }

  /** Terreno con el corredor de la pista aplanado a la altura de la calle. */
  terrainHeight(x: number, z: number): number {
    const dem = this.demHeight(x, z);
    const { s, dist } = this.track.nearest(x, z);
    const hw = this.track.halfWidth(s);
    const inner = hw + 3;
    const outer = hw + 16;
    if (dist >= outer) return dem;
    // bajo las escalinatas el relieve se hunde más para no asomar entre peldaños
    const sink = this.track.surface(s) === 'stairs' ? 1.8 : 0.3;
    const road = this.track.ground(Math.min(s, this.track.length + 40)) - sink;
    if (dist <= inner) return road;
    const t = (dist - inner) / (outer - inner);
    const k = t * t * (3 - 2 * t);
    return road + (dem - road) * k;
  }

  /** ¿Está el punto dentro de algún edificio? */
  inBuilding(x: number, z: number, margin = 0): boolean {
    const ids = this.grid.get(`${Math.floor(x / BIN)},${Math.floor(z / BIN)}`);
    if (!ids) return false;
    for (const id of ids) {
      const b = this.buildings[id];
      if (x < b.minX - margin || x > b.maxX + margin || z < b.minZ - margin || z > b.maxZ + margin) continue;
      if (margin === 0 ? pointInRing(x, z, b.ring) : pointInRing(x, z, b.ring) || distToRing(x, z, b.ring) < margin) return true;
    }
    return false;
  }

  /** Densidad urbana aproximada (0..1) para colorear el suelo. */
  urban(x: number, z: number): number {
    let c = 0;
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) c += this.grid.get(`${Math.floor(x / BIN) + i},${Math.floor(z / BIN) + j}`)?.length ?? 0;
    return Math.min(1, c / 14);
  }
}

export function pointInRing(x: number, z: number, ring: [number, number][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

function distToRing(x: number, z: number, ring: [number, number][]) {
  let best = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const [ax, az] = ring[i];
    const [bx, bz] = ring[(i + 1) % ring.length];
    const dx = bx - ax;
    const dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}
