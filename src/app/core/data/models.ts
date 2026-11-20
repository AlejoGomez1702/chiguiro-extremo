/**
 * Modelo de dominio de la Copa LATAM DH (ver diagrama de dominio).
 * Los nombres de campos siguen el demo para facilitar la migración a Supabase.
 */
export type RaceStatus = 'proxima' | 'fecha' | 'tba' | 'finalizada';

export interface Fact {
  v: string;
  k: string;
}

export interface Race {
  id: string;
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
  /** id de carrera o 'copa' */
  race: string;
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
