import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data/data.service';
import { Seo } from '../../core/seo';
import { ThemeService } from '../../core/theme/theme.service';
import { EventView } from '../../shared/event-view';

/** /eventos/:id · página de un evento con su propia marca. Los borradores no se publican. */
@Component({
  selector: 'app-event-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EventView],
  template: `
    @if (event(); as e) {
      <app-event-view [event]="e" />
    } @else {
      <section class="section missing">
        <div class="container">
          <h1 class="display display-l">Este evento no existe o aún no se publica</h1>
          <a routerLink="/eventos" class="btn">Ver todos los eventos</a>
        </div>
      </section>
    }
  `,
  styles: `
    .missing {
      padding-top: calc(var(--header-h) + var(--space-hero));
    }
    .missing .container {
      display: grid;
      gap: var(--space-l);
      justify-items: start;
    }
  `,
})
export default class EventPage {
  readonly id = input.required<string>();
  private data = inject(DataService);
  private theme = inject(ThemeService);
  private seo = inject(Seo);
  protected event = computed(() => {
    const e = this.data.event(this.id());
    return e && e.status !== 'borrador' ? e : undefined;
  });

  constructor() {
    effect(() => {
      const e = this.event();
      this.theme.use(e?.theme ?? null);
      if (e) this.seo.set(`${e.name} ${e.year}`, `${e.summary} ${e.dateLabel}. ${e.place}.`);
    });
    inject(DestroyRef).onDestroy(() => this.theme.use(null));
  }
}
