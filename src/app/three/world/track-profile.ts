import { ROUTE } from './route-data';

/**
 * Trazado real de la Parada 01 sobre calles de Manizales (OpenStreetMap) con
 * alturas del modelo digital de elevación Copernicus. Todo se expresa en
 * metros a lo largo de la distancia recorrida `s`.
 *
 * Este archivo no depende de three para que la UI pueda dibujar la altimetría.
 */
export const STEP = ROUTE.step;
/** Longitud de calles reales del recorrido. */
export const ROUTE_LENGTH = (ROUTE.ys.length - 1) * STEP;
/** Se añade una zona de meta temporal al pie de la escalinata. */
export const RUNOUT = 110;
export const TRACK_LENGTH = ROUTE_LENGTH + 60;

/** Busca dentro del trazado real el tramo de escalinata más largo. */
function longestRun(kind: string): [number, number] {
  let best: [number, number] = [0, 0];
  let a = -1;
  for (let i = 0; i <= ROUTE.kinds.length; i++) {
    const on = ROUTE.kinds[i] === kind;
    if (on && a < 0) a = i;
    if (!on && a >= 0) {
      if (i - a > best[1] - best[0]) best = [a, i];
      a = -1;
    }
  }
  return [best[0] * STEP, best[1] * STEP];
}

const STAIRS = longestRun('s');

export const SECTION = {
  start: [0, 14] as [number, number],
  /** salto de madera sobre la Carrera 31 (zona de público A) */
  kicker: [596, 602] as [number, number],
  landing: [624, 632] as [number, number],
  /** curva cerrada a la derecha (zona de público B) */
  curve: [790, 852] as [number, number],
  /** drop desde plataforma de madera */
  dropRamp: [1086, 1104] as [number, number],
  drop: 1108,
  stairs: STAIRS,
  plaza: ROUTE_LENGTH,
  finish: ROUTE_LENGTH + 22,
};
/** Altura del drop sobre la calle. */
export const DROP_HEIGHT = 2.2;

export function routeKind(s: number): string {
  const i = Math.min(ROUTE.kinds.length - 1, Math.max(0, Math.round(s / STEP)));
  return ROUTE.kinds[i];
}

/** Altura del suelo de la pista (m relativos a ROUTE.base). */
export function groundProfile(s: number): number {
  const ys = ROUTE.ys;
  if (s >= ROUTE_LENGTH) return ys[ys.length - 1] - (s - ROUTE_LENGTH) * 0.015;
  const f = Math.max(0, s / STEP);
  const i = Math.floor(f);
  const t = f - i;
  return ys[i] * (1 - t) + ys[Math.min(ys.length - 1, i + 1)] * t;
}

/** Altitud real sobre el nivel del mar. */
export function altitude(s: number) {
  return ROUTE.base + groundProfile(s);
}

/** Secciones con nombre para la interfaz. */
export const NAMED_SECTIONS: { s: number; label: string }[] = [
  { s: 0, label: 'Salida · Calle 23' },
  { s: 430, label: 'Carrera 31' },
  { s: SECTION.kicker[0] - 20, label: 'Salto' },
  { s: SECTION.curve[0], label: 'Curva' },
  { s: SECTION.dropRamp[0], label: 'Drop' },
  { s: STAIRS[0], label: 'Escalinata 26A' },
  { s: SECTION.plaza, label: 'Meta' },
];
