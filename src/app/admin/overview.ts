import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data/data.service';

@Component({
  selector: 'app-admin-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header class="adm-head">
      <div>
        <h1 class="display display-m">Panel de Chigüiro Extremo</h1>
        <p>Evento principal: <strong>{{ data.featured().name }} {{ data.featured().year }}</strong>. Desde aquí gestionas eventos, paradas, riders, cobertura y tienda.</p>
      </div>
    </header>

    <ul class="stats" aria-label="Contenido publicado">
      @for (s of stats(); track s.label) {
        <li class="adm-card">
          <a [routerLink]="s.path">
            <span class="num display">{{ s.count }}</span>
            <span class="mono lbl">{{ s.label }}</span>
            @if (s.sub) {
              <span class="note">{{ s.sub }}</span>
            }
          </a>
        </li>
      }
    </ul>

    <div class="cols">
      <section class="adm-card next" aria-labelledby="next-h">
        <h2 id="next-h">Próxima parada</h2>
        @if (data.nextRace(); as r) {
          <div class="next-body">
            <span class="tag">Parada {{ r.num }} · {{ r.code }}</span>
            <strong class="display display-s">{{ r.title }}</strong>
            <span class="muted">{{ r.place }}</span>
            <span class="mono">{{ r.date }}</span>
            @if (days() !== null) {
              <span class="count"><b class="display">{{ days() }}</b> <span class="mono">días para la largada</span></span>
            }
            <span class="tag tag-ink-line">{{ r.insc }}</span>
          </div>
          <div class="adm-form-foot">
            <a class="adm-btn" routerLink="/admin/paradas">Editar paradas</a>
            <a class="adm-btn" routerLink="/admin/inicio">Cambiar evento principal</a>
          </div>
        } @else {
          <p class="adm-empty">No hay eventos cargados.</p>
        }
      </section>

      <section class="adm-card" aria-labelledby="quick-h">
        <h2 id="quick-h">Accesos rápidos</h2>
        <ul class="quick">
          <li><a routerLink="/admin/eventos" [queryParams]="{ nuevo: 1 }">Crear evento</a></li>
          <li><a [routerLink]="['/admin/eventos', data.featuredEventId()]">Personalizar la portada</a></li>
          <li><a routerLink="/admin/paradas" [queryParams]="{ nuevo: 1 }">Crear parada</a></li>
          <li><a routerLink="/admin/corredores" [queryParams]="{ nuevo: 1 }">Crear rider</a></li>
          <li><a routerLink="/admin/noticias" [queryParams]="{ nuevo: 1 }">Crear publicación</a></li>
          <li><a routerLink="/admin/productos" [queryParams]="{ nuevo: 1 }">Crear producto</a></li>
        </ul>
        <h2 class="sub">Últimas publicaciones</h2>
        <ul class="latest">
          @for (p of latest(); track p.id) {
            <li>
              <span class="tag tag-ink-line">{{ p.type }}</span>
              <span>{{ p.title }}</span>
              <span class="note">{{ p.date }}</span>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: `
    .stats {
      list-style: none;
      margin: 0 0 24px;
      padding: 0;
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
    }
    .stats li {
      padding: 0;
      transition: border-color 0.2s;
    }
    .stats li:hover {
      border-color: var(--signal);
    }
    .stats a {
      display: grid;
      gap: 4px;
      padding: 20px;
      text-decoration: none;
    }
    .num {
      font: var(--type-metric-m);
      font-size: 56px;
      line-height: 1;
      color: var(--signal);
    }
    .lbl {
      font: var(--type-label-m);
    }
    .cols {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
    }
    .next-body {
      display: grid;
      gap: 8px;
      justify-items: start;
      margin-bottom: 16px;
    }
    .muted {
      color: var(--muted);
    }
    .count b {
      font-size: 40px;
      color: var(--signal);
    }
    .quick,
    .latest {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 2px;
    }
    .quick a {
      display: block;
      padding: 10px 0;
      font-weight: 700;
      text-decoration: none;
      border-bottom: 1px solid var(--line);
    }
    .quick a:hover {
      color: var(--signal);
    }
    .sub {
      margin-top: 24px;
    }
    .latest li {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
      padding: 8px 0;
      border-bottom: 1px solid var(--line);
      font-size: 14px;
    }
    .latest .note {
      margin-left: auto;
    }
  `,
})
export default class Overview {
  protected data = inject(DataService);

  protected stats = computed(() => [
    { label: 'Eventos', count: this.data.events().length, path: '/admin/eventos', sub: `${this.data.events().filter((e) => e.status === 'archivado').length} en el histórico` },
    { label: 'Paradas', count: this.data.races().length, path: '/admin/paradas', sub: `${this.data.mainRaces().length} del evento principal` },
    { label: 'Riders', count: this.data.riders().length, path: '/admin/corredores', sub: `${this.data.categories().length} categorías` },
    { label: 'Noticias', count: this.data.posts().length, path: '/admin/noticias', sub: `${this.data.posts().filter((p) => p.featured).length} destacadas` },
    { label: 'Productos', count: this.data.products().length, path: '/admin/productos', sub: '' },
  ]);
  protected days = computed(() => {
    const r = this.data.nextRace();
    return r ? this.data.daysTo(r) : null;
  });
  protected latest = computed(() => this.data.posts().slice(0, 5));
}
