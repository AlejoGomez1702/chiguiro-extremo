/**
 * Capa de marca del sistema Downtown: paletas por país (BRAND MODE del Figma),
 * tratamiento intenso/pastel y la composición de la portada Pixel Trail.
 * De aquí salen las variables CSS que personalizan cada evento.
 */
export type Role = 'primary' | 'energy' | 'signal' | 'warm' | 'highlight';
export type Palette = Record<Role, string>;
export type BrandId = 'latam' | 'colombia' | 'ecuador' | 'mexico' | 'custom';
export type Treatment = 'intense' | 'pastel';
export type TitleTone = 'color' | 'ink';
export type TrailId = 'horizonte' | 'espejo' | 'superior' | 'ninguno';

export interface EventTheme {
  brand: BrandId;
  /** solo cuando brand === 'custom' */
  custom?: Palette;
  treatment: Treatment;
  /** color que llena la portada */
  surface: Role;
  title: TitleTone;
  trail: TrailId;
}

export const INK = '#050505';
export const WHITE = '#ffffff';

export const ROLES: { id: Role; label: string }[] = [
  { id: 'primary', label: 'Primario' },
  { id: 'energy', label: 'Energía' },
  { id: 'signal', label: 'Señal' },
  { id: 'warm', label: 'Cálido' },
  { id: 'highlight', label: 'Destacado' },
];

export const TRAILS: { id: TrailId; label: string }[] = [
  { id: 'horizonte', label: 'Horizonte' },
  { id: 'espejo', label: 'Horizonte en espejo' },
  { id: 'superior', label: 'Solo franja superior' },
  { id: 'ninguno', label: 'Sin recorrido' },
];

interface Preset {
  id: Exclude<BrandId, 'custom'>;
  label: string;
  colors: Palette;
  pastels: Palette;
}

/** Valores de "Reconciliación cromática 2026-10-29" (Figma, 01 · Fundamentos). */
export const PRESETS: Preset[] = [
  {
    id: 'latam',
    label: 'LATAM',
    colors: { primary: '#7337f1', energy: '#0ee973', signal: '#ebda00', warm: '#ff8b00', highlight: '#ff7ee0' },
    // el lila del destacado es el de la portada aprobada (LATAM puede mezclar paletas de país)
    pastels: { primary: '#c2cbff', energy: '#88ffbf', signal: '#f7f1a5', warm: '#ffd29d', highlight: '#ebd2ff' },
  },
  {
    id: 'colombia',
    label: 'Colombia',
    colors: { primary: '#0640ff', energy: '#a3e532', signal: '#a3e532', warm: '#f23118', highlight: '#c77eff' },
    pastels: { primary: '#a8bcff', energy: '#dff6b7', signal: '#dff6b7', warm: '#fab7ae', highlight: '#ebd2ff' },
  },
  {
    id: 'ecuador',
    label: 'Ecuador',
    colors: { primary: '#0071b2', energy: '#e5df32', signal: '#e5df32', warm: '#f23118', highlight: '#00eaff' },
    pastels: { primary: '#a6cde4', energy: '#f6f4b7', signal: '#f6f4b7', warm: '#fab7ae', highlight: '#a6f8ff' },
  },
  {
    id: 'mexico',
    label: 'México',
    colors: { primary: '#009a36', energy: '#32e585', signal: '#32e585', warm: '#ff1d00', highlight: '#eaff00' },
    pastels: { primary: '#a6dcb9', energy: '#b7f6d4', signal: '#b7f6d4', warm: '#ffb0a6', highlight: '#f8ffa6' },
  },
];

export const DEFAULT_THEME: EventTheme = { brand: 'latam', treatment: 'intense', surface: 'energy', title: 'color', trail: 'horizonte' };

// --- color -----------------------------------------------------------------
function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.padEnd(6, '0');
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0) as [number, number, number];
}
function hex(c: number[]): string {
  return '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}
function luminance(color: string): number {
  const [r, g, b] = rgb(color).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Contraste WCAG entre dos colores (1–21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** Tinta o blanco, lo que mejor se lea sobre el color dado. */
export function onColor(bg: string): string {
  return contrast(bg, INK) >= contrast(bg, WHITE) ? INK : WHITE;
}
/** Regla del Figma para pasteles nuevos: 35 % del tono + 65 % de blanco. */
export function pastelOf(color: string): string {
  return hex(rgb(color).map((v) => v * 0.35 + 255 * 0.65));
}

// --- resolución del tema ---------------------------------------------------
export function resolvePalette(theme: EventTheme): { colors: Palette; pastels: Palette } {
  if (theme.brand === 'custom' && theme.custom) {
    const colors = theme.custom;
    const pastels = Object.fromEntries(ROLES.map((r) => [r.id, pastelOf(colors[r.id])])) as Palette;
    return { colors, pastels };
  }
  const p = PRESETS.find((x) => x.id === theme.brand) ?? PRESETS[0];
  return { colors: p.colors, pastels: p.pastels };
}

export interface CoverColors {
  bg: string;
  title: string;
  ink: string;
  px: [string, string, string];
  onPx: string;
}

export function coverColors(theme: EventTheme): CoverColors {
  const { colors, pastels } = resolvePalette(theme);
  const intense = theme.treatment === 'intense';
  const bg = (intense ? colors : pastels)[theme.surface];
  const ink = onColor(bg);
  // el titular toma el pastel de señal (o destacado si la señal ya es el fondo)
  const titleRole: Role = theme.surface === 'signal' ? 'highlight' : 'signal';
  const colored = intense ? pastels[titleRole] : colors.primary;
  const pxSet = intense ? pastels : colors;
  const px: [string, string, string] = [pxSet.highlight, pxSet.signal, pxSet.energy];
  return { bg, title: theme.title === 'ink' ? ink : colored, ink, px, onPx: intense ? INK : onColor(px[0]) };
}

/** Variables CSS de un tema; se aplican como estilo en línea sobre un contenedor. */
export function themeVars(theme: EventTheme): Record<string, string> {
  const { colors, pastels } = resolvePalette(theme);
  const c = coverColors(theme);
  const [r, g, b] = rgb(colors.primary);
  const out: Record<string, string> = {
    '--cover-bg': c.bg,
    '--cover-title': c.title,
    '--cover-ink': c.ink,
    '--cover-px-a': c.px[0],
    '--cover-px-b': c.px[1],
    '--cover-px-c': c.px[2],
    '--cover-on-px': c.onPx,
    '--cover-grid': `rgba(${r}, ${g}, ${b}, 0.18)`,
  };
  for (const { id } of ROLES) {
    out[`--brand-${id}`] = colors[id];
    out[`--brand-${id}-pastel`] = pastels[id];
    out[`--on-brand-${id}`] = onColor(colors[id]);
  }
  return out;
}

// --- Pixel Trail -------------------------------------------------------------
export type PxTone = 'a' | 'b' | 'c';
export interface Px {
  col: number;
  row: number;
  tone: PxTone;
  icon?: string;
}

const px = (col: number, row: number, tone: PxTone, icon?: string): Px => ({ col, row, tone, icon });

/** Composición "Horizonte" sobre retícula de 24 columnas (frame 1920 / módulo 80). */
const TOP: Px[] = [
  px(5, 1, 'c'), px(6, 1, 'a'), px(7, 1, 'a'), px(8, 1, 'a'),
  px(12, 1, 'a'), px(13, 1, 'a'), px(14, 1, 'a'), px(15, 1, 'a'), px(16, 1, 'a'),
  px(2, 2, 'a'), px(3, 2, 'a'), px(4, 2, 'b', 'escaleras'), px(5, 2, 'a'),
  px(8, 2, 'b'), px(9, 2, 'a'), px(10, 2, 'a'), px(11, 2, 'c'), px(12, 2, 'a', 'bike'),
  px(16, 2, 'c'), px(17, 2, 'b'), px(18, 2, 'a'), px(19, 2, 'a'), px(20, 2, 'b', 'creators'),
  px(0, 3, 'b'), px(1, 3, 'a'), px(2, 3, 'a'),
];
const BOTTOM: Px[] = [
  px(0, 1, 'a'), px(1, 1, 'a'), px(2, 1, 'a'), px(3, 1, 'b'),
  px(7, 1, 'a'), px(8, 1, 'a'), px(9, 1, 'a'), px(10, 1, 'c'), px(11, 1, 'a'),
  px(19, 1, 'a', 'barrios'), px(20, 1, 'c'), px(21, 1, 'a'), px(22, 1, 'a'), px(23, 1, 'a'),
  px(3, 2, 'a'), px(4, 2, 'a', 'atletas'), px(5, 2, 'a'), px(6, 2, 'a'), px(7, 2, 'a'),
  px(11, 2, 'b'), px(12, 2, 'b', 'metrocable'), px(13, 2, 'a'), px(14, 2, 'a'), px(15, 2, 'a'), px(19, 2, 'a'),
  px(15, 3, 'c'), px(16, 3, 'a'), px(17, 3, 'a'),
];

export function trailCells(id: TrailId): { top: Px[]; bottom: Px[] } {
  const flip = (cells: Px[]) => cells.map((c) => ({ ...c, col: 23 - c.col }));
  switch (id) {
    case 'espejo':
      return { top: flip(TOP), bottom: flip(BOTTOM) };
    case 'superior':
      return { top: TOP, bottom: [] };
    case 'ninguno':
      return { top: [], bottom: [] };
    default:
      return { top: TOP, bottom: BOTTOM };
  }
}
