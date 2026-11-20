import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { IMAGES } from './admin-util';

interface GalleryItem {
  src: string;
  label: string;
  caption: string;
  visible: boolean;
}

@Component({
  selector: 'app-admin-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="adm-head">
      <div>
        <h1 class="display display-m">Evento principal</h1>
        <p>El evento principal ocupa el inicio del sitio y le da sus colores a todo lo demás. Solo se pueden elegir eventos publicados.</p>
      </div>
    </header>

    <section class="adm-card block" aria-labelledby="main-h">
      <h2 id="main-h">Evento en el inicio</h2>
      <fieldset>
        <legend class="adm-legend">Eventos publicados</legend>
        <div class="races">
          @for (e of published(); track e.id) {
            <label class="race" [class.on]="e.id === data.featuredEventId()">
              <input type="radio" name="main-event" [checked]="e.id === data.featuredEventId()" (change)="setMain(e.id)" />
              <span class="mono">{{ e.year }} · {{ data.racesOf(e.id).length }} paradas</span>
              <strong class="display">{{ e.name }}</strong>
              <span class="note">{{ e.series }}</span>
            </label>
          } @empty {
            <p class="adm-empty">No hay eventos publicados. <a routerLink="/admin/eventos">Publica uno</a> para elegirlo.</p>
          }
        </div>
      </fieldset>
      <div class="adm-form-foot foot">
        <a class="adm-btn" [routerLink]="['/admin/eventos', data.featuredEventId()]">Personalizar su portada</a>
        <a class="adm-btn" routerLink="/admin/eventos">Todos los eventos</a>
      </div>
    </section>

    <section class="adm-card block" aria-labelledby="hero-h">
      <h2 id="hero-h">Próxima parada de {{ data.featured().name }}</h2>
      <fieldset>
        <legend class="adm-legend">Aparece destacada en la portada</legend>
        <div class="races">
          @for (r of data.mainRaces(); track r.id) {
            <label class="race" [class.on]="r.isNext">
              <input type="radio" name="next-race" [checked]="r.isNext" (change)="setNext(r.id)" />
              <span class="mono">Parada {{ r.num }} · {{ r.code }}</span>
              <strong class="display">{{ r.short }}</strong>
              <span class="note">{{ r.dshort }} · {{ r.statusLabel }}</span>
            </label>
          }
        </div>
      </fieldset>
      @if (saved()) {
        <p class="note ok" role="status">Inicio actualizado: {{ data.featured().name }}, próxima parada {{ data.nextRace().title }}.</p>
      }
    </section>

    <section class="adm-card block" aria-labelledby="gal-h">
      <div class="adm-form-head">
        <h2 id="gal-h">Galería de inicio</h2>
        <span class="note">{{ visibleCount() }} de {{ gallery().length }} visibles</span>
      </div>
      <ul class="gallery">
        @for (g of gallery(); track g.src; let i = $index, first = $first, last = $last) {
          <li [class.hidden]="!g.visible">
            <img [src]="g.src" [alt]="g.caption || g.label" />
            <div class="g-body">
              <label class="adm-fld">
                <span>Pie de foto · {{ g.label }}</span>
                <input [ngModel]="g.caption" (ngModelChange)="patch(i, { caption: $event })" [name]="'cap-' + i" />
              </label>
              <div class="g-actions">
                <label class="adm-chk"><input type="checkbox" [ngModel]="g.visible" (ngModelChange)="patch(i, { visible: $event })" [name]="'vis-' + i" /> Visible</label>
                <button type="button" class="adm-btn" (click)="move(i, -1)" [disabled]="first">Subir <span class="sr-only">{{ g.label }}</span></button>
                <button type="button" class="adm-btn" (click)="move(i, 1)" [disabled]="last">Bajar <span class="sr-only">{{ g.label }}</span></button>
              </div>
            </div>
          </li>
        }
      </ul>
      <p class="note">La galería se guarda solo en esta vista mientras se conecta Supabase.</p>
    </section>
  `,
  styles: `
    .block {
      margin-bottom: 20px;
    }
    .races {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
    }
    .race {
      position: relative;
      display: grid;
      gap: 4px;
      padding: 14px;
      border: 1px solid var(--line-2);
      border-radius: 4px;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .race:hover {
      border-color: var(--muted-3);
    }
    .race.on {
      border-color: var(--signal);
      background: var(--color-accent-soft);
    }
    .race input {
      position: absolute;
      top: 14px;
      right: 14px;
    }
    .race strong {
      font-size: 26px;
      font-weight: 400;
      line-height: 1.1;
    }
    .foot {
      margin-top: 16px;
    }
    .ok {
      margin-top: 12px;
      color: var(--signal);
    }
    .gallery {
      list-style: none;
      margin: 0 0 12px;
      padding: 0;
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
    }
    .gallery li {
      border: 1px solid var(--line);
      border-radius: 4px;
      overflow: hidden;
      background: var(--ink);
      transition: opacity 0.2s;
    }
    .gallery li.hidden {
      opacity: 0.45;
    }
    .gallery img {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      background: var(--ink-3);
    }
    .g-body {
      display: grid;
      gap: 10px;
      padding: 12px;
    }
    .g-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .g-actions .adm-chk {
      margin-right: auto;
    }
  `,
})
export default class HomeAdmin {
  protected data = inject(DataService);
  protected saved = signal(false);
  protected gallery = signal<GalleryItem[]>(
    IMAGES.map((img, i) => ({ ...img, caption: this.data.captions[i] ?? '', visible: true })),
  );
  protected visibleCount = computed(() => this.gallery().filter((g) => g.visible).length);

  protected published = computed(() => this.data.events().filter((e) => e.status === 'publicado'));

  protected setMain(id: string) {
    this.data.featuredEventId.set(id);
    this.saved.set(true);
  }

  protected setNext(id: string) {
    for (const r of this.data.mainRaces()) {
      const isNext = r.id === id;
      if (r.isNext !== isNext) this.data.upsert('races', { ...r, isNext });
    }
    this.saved.set(true);
  }

  protected patch(i: number, change: Partial<GalleryItem>) {
    this.gallery.update((list) => list.map((g, j) => (j === i ? { ...g, ...change } : g)));
  }

  protected move(i: number, dir: -1 | 1) {
    this.gallery.update((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
}
