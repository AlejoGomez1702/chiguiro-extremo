/**
 * Modelo de dominio de Chigüiro Extremo: el sitio aloja varios eventos
 * (SiteEvent); cada uno tiene sus paradas (Race), su tema visual y su portada.
 * Los nombres de campos siguen el demo para facilitar la migración a Supabase.
 */
import type { EventTheme } from '../theme/brand';

export type EventStatus = 'borrador' | 'publicado' | 'archivado';
export type EventKind = 'serie' | 'unico';
export type ModuleKey = 'paradas' | 'trazado' | 'corredores' | 'cobertura' | 'tienda' | 'aliados';

export interface EventModule {
  key: ModuleKey;
  on: boolean;
}

export interface EventCover {
  line1: string;
  line2: string;
  /** flecha circular al final de la segunda línea */
  arrow: boolean;
  kickerLeft: string;
  kickerRight: string;
}

export interface SiteEvent {
  /** slug: se usa en la URL /eventos/<id> */
  id: string;
  name: string;
  /** apellido del evento, p. ej. "Serie Latinoamérica" */
  series: string;
  kind: EventKind;
  status: EventStatus;
  year: number;
  dateLabel: string;
  place: string;
  summary: string;
  theme: EventTheme;
  cover: EventCover;
  /** secciones de la página del evento, en orden */
  modules: EventModule[];
}

export type RaceStatus = 'proxima' | 'fecha' | 'tba' | 'finalizada';

export interface Fact {
  v: string;
  k: string;
}

export interface Race {
  id: string;
  /** evento al que pertenece la parada */
  eventId: string;
  num: string;
  /** código ISO del país */
  code: string;
  title: string;
  short: string;
  place: string;
  date: string;
  dshort: string;
  dsub: string;
  status: RaceStatus;
  statusLabel: string;
  img: string | null;
  hasMap: boolean;
  isNext: boolean;
  insc: string;
  facts: Fact[];
  factsNote: string;
  infoHint: string;
  mapHint: string;
  covHint: string;
  mapNote?: string;
  kits: string;
}

export type PinKind = 'route' | 'pub' | 'acc';
export interface Pin {
  id: string;
  kind: PinKind;
  label: string;
  x: number;
  y: number;
  group: string;
  desc: string;
}

export interface ScheduleSlot {
  t: string;
  title: string;
  place: string;
  pin: string;
  past?: boolean;
  now?: boolean;
}
export interface ScheduleDay {
  day: string;
  slots: ScheduleSlot[];
}

export interface Access {
  pin: string;
  title: string;
  text: string;
}

export type PostType = 'noticia' | 'cronica' | 'galeria' | 'video';
export interface Post {
  id: string;
  type: PostType;
  /** id de parada, o 'copa' para el evento en general */
  race: string;
  /** evento de una publicación general; si falta, es el evento principal */
  eventId?: string;
  title: string;
  dek: string;
  date: string;
  img: string;
  pos?: string;
  body?: string[];
  pull?: string;
  featured?: boolean;
  duration?: string;
  n?: number;
}

export interface ProductColor {
  n: string;
  h: string;
}
export type ProductKind = 'tee' | 'poster' | 'longsleeve' | 'cap' | 'gloves' | 'socks' | 'hoodie';
export interface Product {
  id: string;
  name: string;
  /** colección: id de carrera o 'copa' */
  col: string;
  type: 'ropa' | 'acc' | 'col';
  price: number;
  kind: ProductKind | string;
  print: string;
  colors: ProductColor[];
  sizes: string[];
  badge?: string;
  soldOut?: boolean;
  desc: string;
}

export interface Rider {
  id: string;
  name: string;
  cc: string;
  country: string;
  plate: string;
  races: string[];
  bg: string;
  fg: string;
  desc: string;
  team: string;
  feat: string;
  career: string;
  category: string;
}

export interface CartLine {
  productId: string;
  color: number;
  size: string;
  qty: number;
}
