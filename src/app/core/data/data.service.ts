import { Injectable, WritableSignal, computed, signal } from '@angular/core';
import { ACCESS, CAPTIONS, CREDITS, EVENTS, GENERIC_BODY, PINS, POSTS, PRODUCTS, RACES, RIDERS, SCHEDULE } from './mock-data';
import { Post, Product, Race, Rider, SiteEvent } from './models';

/**
 * Fuente única de datos del sitio. Hoy trabaja en memoria con los datos del
 * demo; el dashboard escribe aquí. Para pasar a Supabase solo hay que cargar
 * estas señales desde las tablas equivalentes (events, races, riders, posts,
 * products) y guardar featuredEventId en la configuración del sitio.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  readonly events = signal<SiteEvent[]>(EVENTS);
  /** evento principal: protagoniza el inicio y da la marca a todo el sitio */
  readonly featuredEventId = signal(EVENTS[0].id);
  readonly races = signal<Race[]>(RACES);
  readonly riders = signal<Rider[]>(RIDERS);
  readonly posts = signal<Post[]>(POSTS);
  readonly products = signal<Product[]>(PRODUCTS);
  readonly pins = PINS;
  readonly schedule = SCHEDULE;
  readonly access = ACCESS;
  readonly genericBody = GENERIC_BODY;
  readonly captions = CAPTIONS;
  readonly credits = CREDITS;

  readonly featured = computed(() => this.events().find((e) => e.id === this.featuredEventId()) ?? this.events()[0]);
  /** eventos visibles en el sitio (los borradores solo existen en el panel) */
  readonly publicEvents = computed(() => this.events().filter((e) => e.status !== 'borrador'));
  /** paradas del evento principal */
  readonly mainRaces = computed(() => this.racesOf(this.featured().id));
  readonly nextRace = computed(() => this.nextRaceOf(this.featured().id) ?? this.races()[0]);
  readonly categories = computed(() => [...new Set(this.riders().map((r) => r.category))]);

  event(id: string) {
    return this.events().find((e) => e.id === id);
  }
  race(id: string) {
    return this.races().find((r) => r.id === id);
  }
  rider(id: string) {
    return this.riders().find((r) => r.id === id);
  }
  post(id: string) {
    return this.posts().find((p) => p.id === id);
  }
  product(id: string) {
    return this.products().find((p) => p.id === id);
  }
  raceName(id: string) {
    return id === 'copa' ? 'Evento general' : `Parada ${this.race(id)?.num} · ${this.race(id)?.short}`;
  }
  postsFor(raceId: string) {
    return this.posts().filter((p) => p.race === raceId);
  }

  // --- contenido por evento ------------------------------------------------
  racesOf(eventId: string) {
    return this.races().filter((r) => r.eventId === eventId);
  }
  nextRaceOf(eventId: string): Race | undefined {
    const list = this.racesOf(eventId);
    return list.find((r) => r.isNext) ?? list[0];
  }
  /** ¿el contenido ligado a `ref` (id de parada o 'copa') pertenece al evento? */
  private belongs(ref: string, eventId: string, own?: string) {
    if (ref === 'copa') return (own ?? this.featuredEventId()) === eventId;
    return this.race(ref)?.eventId === eventId;
  }
  postsOf(eventId: string) {
    return this.posts().filter((p) => this.belongs(p.race, eventId, p.eventId));
  }
  productsOf(eventId: string) {
    return this.products().filter((p) => this.belongs(p.col, eventId));
  }
  ridersOf(eventId: string) {
    const ids = new Set(this.racesOf(eventId).map((r) => r.id));
    return this.riders().filter((r) => r.races.some((id) => ids.has(id)));
  }

  /** Días hasta una fecha tipo "9 ENE 2027". */
  daysTo(race: Race): number | null {
    const m = race.dshort.match(/^(\d+) (\w{3}) (\d{4})$/);
    if (!m) return null;
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const d = new Date(+m[3], months.indexOf(m[2]), +m[1]);
    return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
  }

  // --- escritura (dashboard) ----------------------------------------------
  upsert<T extends { id: string }>(kind: Collection, item: T) {
    this.collection(kind).update((list) => {
      const i = list.findIndex((x) => x.id === item.id);
      return i < 0 ? [item, ...list] : list.map((x) => (x.id === item.id ? item : x));
    });
  }
  remove(kind: Collection, id: string) {
    this.collection(kind).update((list) => list.filter((x) => x.id !== id));
  }
  private collection(kind: Collection) {
    return this[kind] as unknown as WritableSignal<{ id: string }[]>;
  }
}

export type Collection = 'events' | 'races' | 'riders' | 'posts' | 'products';
