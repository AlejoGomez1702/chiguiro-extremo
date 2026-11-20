import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataService } from '../../core/data/data.service';
import { PageHead } from '../../shared/page-head';
import { RiderCard } from '../../shared/rider-card';

@Component({
  selector: 'app-riders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHead, RiderCard],
  template: `
    <app-page-head eyebrow="Corredores · solo por invitación" title="Pilotos invitados" lead="Especialistas en descenso urbano de toda Latinoamérica. Perfiles de ejemplo hasta la confirmación oficial." />
    <section class="section">
      <div class="container">
        <div class="filters" role="tablist" aria-label="Filtrar por categoría">
          @for (c of cats(); track c) {
            <button type="button" role="tab" [attr.aria-selected]="cat() === c" [class.on]="cat() === c" (click)="cat.set(c)">
              {{ c }}
              <small>{{ count(c) }}</small>
            </button>
          }
        </div>
        <div class="grid grid-4">
          @for (r of list(); track r.id) {
            <app-rider-card [rider]="r" />
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .filters {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 28px;
    }
    .filters button {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      padding: 9px 14px;
      border: 1px solid var(--line-2);
      background: none;
      border-radius: 3px;
      font-weight: 700;
      cursor: pointer;
    }
    .filters button.on {
      background: var(--signal);
      border-color: var(--signal);
      color: var(--ink);
    }
    small {
      font: 700 11px var(--mono);
      opacity: 0.7;
    }
  `,
})
export default class Riders {
  protected data = inject(DataService);
  protected cats = computed(() => ['Todas', ...this.data.categories()]);
  protected cat = signal('Todas');
  protected list = computed(() => this.data.riders().filter((r) => this.cat() === 'Todas' || r.category === this.cat()));
  protected count(c: string) {
    return c === 'Todas' ? this.data.riders().length : this.data.riders().filter((r) => r.category === c).length;
  }
}
