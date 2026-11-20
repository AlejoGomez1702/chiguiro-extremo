import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DataService } from '../../core/data/data.service';
import { EventCard } from '../../shared/event-card';
import { PageHead } from '../../shared/page-head';

@Component({
  selector: 'app-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHead, EventCard],
  template: `
    <app-page-head title="Eventos" lead="Todo lo que organiza Chigüiro Extremo: el evento en curso y los que ya bajaron la pista." />

    <section class="section">
      <div class="container">
        <h2 class="display display-m">En curso</h2>
        <div class="list">
          @for (e of current(); track e.id) {
            <app-event-card [event]="e" [main]="e.id === data.featured().id" />
          } @empty {
            <p class="lead">No hay eventos en curso. Vuelve pronto.</p>
          }
        </div>
      </div>
    </section>

    @if (past().length) {
      <section class="section past">
        <div class="container">
          <h2 class="display display-m">Histórico</h2>
          <div class="list">
            @for (e of past(); track e.id) {
              <app-event-card [event]="e" />
            }
          </div>
        </div>
      </section>
    }
  `,
  styles: `
    .past {
      border-top: 1px solid var(--color-border);
    }
    .list {
      margin-top: var(--space-xl);
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: var(--space-xl) var(--space-l);
    }
  `,
})
export default class Events {
  protected data = inject(DataService);
  /** el principal primero */
  protected current = computed(() => {
    const main = this.data.featured().id;
    return this.data
      .publicEvents()
      .filter((e) => e.status === 'publicado')
      .sort((a, b) => +(b.id === main) - +(a.id === main) || b.year - a.year);
  });
  protected past = computed(() =>
    this.data
      .publicEvents()
      .filter((e) => e.status === 'archivado')
      .sort((a, b) => b.year - a.year),
  );
}
