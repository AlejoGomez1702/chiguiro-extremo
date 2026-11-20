import { Injectable, WritableSignal, computed, signal } from '@angular/core';
import { ACCESS, CAPTIONS, CREDITS, GENERIC_BODY, PINS, POSTS, PRODUCTS, RACES, RIDERS, SCHEDULE } from './mock-data';
import { Post, Product, Race, Rider } from './models';

/**
 * Fuente única de datos del sitio. Hoy trabaja en memoria con los datos del
 * demo; el dashboard escribe aquí. Para pasar a Supabase solo hay que cargar
 * estas señales desde las tablas equivalentes (races, riders, posts, products).
 */
@Injectable({ providedIn: 'root' })
export class DataService {
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

  readonly nextRace = computed(() => this.races().find((r) => r.isNext) ?? this.races()[0]);
  readonly categories = computed(() => [...new Set(this.riders().map((r) => r.category))]);

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
    return id === 'copa' ? 'Copa general' : `Parada ${this.race(id)?.num} · ${this.race(id)?.short}`;
  }
  postsFor(raceId: string) {
    return this.posts().filter((p) => p.race === raceId);
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

export type Collection = 'races' | 'riders' | 'posts' | 'products';
