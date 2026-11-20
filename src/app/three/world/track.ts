import { Vector3 } from 'three';
import { ROUTE } from './route-data';
import { DROP_HEIGHT, RUNOUT, ROUTE_LENGTH, SECTION, STEP, TRACK_LENGTH, groundProfile, routeKind } from './track-profile';

export { SECTION, TRACK_LENGTH } from './track-profile';

export type Surface = 'wood' | 'road' | 'stairs' | 'plaza';

export interface Frame {
  pos: Vector3;
  forward: Vector3;
  right: Vector3;
}

/**
 * Pista sobre el trazado real. Las coordenadas x/z vienen de OpenStreetMap
 * proyectadas a metros locales; al final se prolonga en recta para la meta.
 */
export class Track {
  readonly length = TRACK_LENGTH;
  private readonly n: number;
  private readonly xs: Float32Array;
  private readonly zs: Float32Array;
  private readonly hs: Float32Array;
  readonly min = new Vector3(Infinity, Infinity, Infinity);
  readonly max = new Vector3(-Infinity, -Infinity, -Infinity);

  constructor() {
    const base = ROUTE.xs.length;
    const extra = Math.ceil(RUNOUT / STEP);
    this.n = base + extra;
    this.xs = new Float32Array(this.n);
    this.zs = new Float32Array(this.n);
    this.hs = new Float32Array(this.n);
    for (let i = 0; i < base; i++) {
      this.xs[i] = ROUTE.xs[i];
      this.zs[i] = ROUTE.zs[i];
    }
    // rumbo suavizado (ventana de ±3 muestras) para curvas sin quiebres
    for (let i = 0; i < base; i++) {
      const a = Math.max(0, i - 3);
      const b = Math.min(base - 1, i + 3);
      this.hs[i] = Math.atan2(this.xs[b] - this.xs[a], -(this.zs[b] - this.zs[a]));
    }
    // desenvuelve el ángulo para interpolar sin saltos de 2π
    for (let i = 1; i < base; i++) {
      while (this.hs[i] - this.hs[i - 1] > Math.PI) this.hs[i] -= Math.PI * 2;
      while (this.hs[i] - this.hs[i - 1] < -Math.PI) this.hs[i] += Math.PI * 2;
    }
    const h = this.hs[base - 1];
    for (let i = base; i < this.n; i++) {
      this.hs[i] = h;
      this.xs[i] = this.xs[i - 1] + Math.sin(h) * STEP;
      this.zs[i] = this.zs[i - 1] - Math.cos(h) * STEP;
    }
    for (let i = 0; i < this.n; i++) {
      const p = new Vector3(this.xs[i], groundProfile(i * STEP), this.zs[i]);
      this.min.min(p);
      this.max.max(p);
    }
  }

  ground(s: number): number {
    return groundProfile(s);
  }

  surface(s: number): Surface {
    if (s < SECTION.start[1]) return 'wood';
    if (s >= SECTION.plaza) return 'plaza';
    return routeKind(s) === 's' ? 'stairs' : 'road';
  }

  /** Semiancho de la calzada según el tipo de vía real. */
  halfWidth(s: number): number {
    if (s >= ROUTE_LENGTH) return 12;
    // promedio en una ventana para que el ancho cambie de forma gradual
    let w = 0;
    let n = 0;
    for (let d = -10; d <= 10; d += 2) {
      const k = routeKind(Math.max(0, s + d));
      w += k === 'm' ? 4 : k === 'r' ? 3.2 : k === 's' ? 2.3 : 2.2;
      n++;
    }
    return w / n;
  }

  private sample(arr: Float32Array, s: number) {
    const f = Math.max(0, Math.min(this.n - 1.001, s / STEP));
    const i = Math.floor(f);
    const t = f - i;
    return arr[i] * (1 - t) + arr[i + 1] * t;
  }

  heading(s: number) {
    return this.sample(this.hs, s);
  }

  frame(s: number, out?: Frame): Frame {
    const o = out ?? { pos: new Vector3(), forward: new Vector3(), right: new Vector3() };
    const h = this.heading(s);
    o.pos.set(this.sample(this.xs, s), this.ground(s), this.sample(this.zs, s));
    o.forward.set(Math.sin(h), 0, -Math.cos(h));
    o.right.set(Math.cos(h), 0, Math.sin(h));
    return o;
  }

  /** Punto a un desplazamiento lateral (m, + derecha) y altura sobre el suelo. */
  point(s: number, lateral = 0, up = 0, out = new Vector3()) {
    const h = this.heading(s);
    return out.set(
      this.sample(this.xs, s) + Math.cos(h) * lateral,
      this.ground(s) + up,
      this.sample(this.zs, s) + Math.sin(h) * lateral,
    );
  }

  /** Altura de la plataforma del drop sobre la calle. */
  dropDeck(s: number): number {
    const [a, b] = SECTION.dropRamp;
    if (s < a || s > SECTION.drop) return 0;
    if (s < b) return DROP_HEIGHT * ((s - a) / (b - a));
    return DROP_HEIGHT;
  }

  /**
   * Altura de la línea del piloto: sigue el suelo salvo en el salto
   * (kicker → aterrizaje) y en el drop, donde vuela en parábola.
   */
  riderY(s: number): number {
    const g = this.ground(s);
    const [k0, k1] = SECTION.kicker;
    const [l0, l1] = SECTION.landing;
    const kick = 1.6;
    if (s >= k0 && s < k1) return g + kick * ((s - k0) / (k1 - k0)) ** 1.4;
    if (s >= k1 && s < l0) {
      const t = (s - k1) / (l0 - k1);
      const land = 1.15;
      return g + kick + (land - kick) * t + 4 * 2.6 * t * (1 - t);
    }
    if (s >= l0 && s < l1) return g + 1.15 * (1 - (s - l0) / (l1 - l0));
    const deck = this.dropDeck(s);
    if (deck > 0) return g + deck;
    const d = SECTION.drop;
    if (s > d && s < d + 9) {
      const t = (s - d) / 9;
      const top = this.ground(d) + DROP_HEIGHT;
      const arc = top + 0.45 * Math.sin(Math.min(1, t * 2.2) * Math.PI * 0.5) - (top - this.ground(d + 9) + 0.45) * t * t;
      return Math.max(g, arc);
    }
    return g;
  }

  /** Muestra más cercana a (x,z). Devuelve s y la distancia lateral firmada. */
  nearest(x: number, z: number): { s: number; lateral: number; dist: number } {
    let best = 0;
    let bd = Infinity;
    for (let k = 0; k < this.n; k += 6) {
      const dx = this.xs[k] - x;
      const dz = this.zs[k] - z;
      const d = dx * dx + dz * dz;
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    const c = best;
    for (let k = Math.max(0, c - 8); k < Math.min(this.n, c + 9); k++) {
      const dx = this.xs[k] - x;
      const dz = this.zs[k] - z;
      const d = dx * dx + dz * dz;
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    const h = this.hs[best];
    const lateral = (x - this.xs[best]) * Math.cos(h) + (z - this.zs[best]) * Math.sin(h);
    return { s: best * STEP, lateral, dist: Math.sqrt(bd) };
  }
}
