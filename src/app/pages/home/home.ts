import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data/data.service';
import { EventCard } from '../../shared/event-card';
import { EventView } from '../../shared/event-view';

/** Inicio de Chigüiro Extremo: el evento principal en portada y, debajo, el resto de eventos. */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EventView, EventCard],
  template: `
    <app-event-view [event]="data.featured()" />

    @if (others().length) {
      <section class="section more" aria-labelledby="more-t">
        <div class="container">
          <div class="row-head">
            <h2 id="more-t" class="display display-l">Más eventos de Chigüiro Extremo</h2>
            <a class="link-arrow" routerLink="/eventos">Ver el histórico</a>
          </div>
          <div class="list">
            @for (e of others(); track e.id) {
              <app-event-card [event]="e" />
            }
          </div>
        </div>
      </section>
    }
  `,
  styles: `
    .more {
      border-top: 1px solid var(--color-border);
    }
    .row-head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: var(--space-m);
      flex-wrap: wrap;
      margin-bottom: var(--space-xxl);
    }
    .list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: var(--space-xl) var(--space-l);
    }
  `,
})
export default class Home {
  protected data = inject(DataService);
  protected others = computed(() =>
    this.data
      .publicEvents()
      .filter((e) => e.id !== this.data.featured().id)
      .slice(0, 3),
  );
}
