import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataService } from '../../core/data/data.service';
import { PostType } from '../../core/data/models';
import { PageHead } from '../../shared/page-head';
import { PostCard } from '../../shared/post-card';

const TYPES: { id: PostType | 'todo'; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'noticia', label: 'Noticias' },
  { id: 'cronica', label: 'Crónicas' },
  { id: 'galeria', label: 'Galerías' },
  { id: 'video', label: 'Videos' },
];

@Component({
  selector: 'app-coverage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHead, PostCard],
  template: `
    <app-page-head eyebrow="Noticias · crónicas · video" title="Cobertura" lead="Todo lo que pasa antes, durante y después de cada parada." />
    <section class="section section-light">
      <div class="container">
        <div class="bar">
          <div class="filters" role="tablist" aria-label="Tipo de publicación">
            @for (t of types; track t.id) {
              <button type="button" role="tab" [attr.aria-selected]="type() === t.id" [class.on]="type() === t.id" (click)="type.set(t.id)">
                {{ t.label }} <small>{{ count(t.id) }}</small>
              </button>
            }
          </div>
          <label class="race">
            <span class="mono">Sede</span>
            <select [value]="race()" (change)="race.set($any($event.target).value)">
              <option value="todo">Todas</option>
              <option value="copa">Evento general</option>
              @for (r of data.races(); track r.id) {
                <option [value]="r.id">Parada {{ r.num }} · {{ r.short }}</option>
              }
            </select>
          </label>
        </div>
        @if (featured(); as f) {
          <div class="featured">
            <app-post-card [post]="f" [big]="true" />
          </div>
        }
        <div class="grid grid-3">
          @for (p of rest(); track p.id) {
            <app-post-card [post]="p" />
          } @empty {
            <p class="lead">No hay publicaciones con ese filtro.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }
    .filters {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .filters button {
      padding: 9px 14px;
      border: 1px solid var(--color-light-border);
      background: transparent;
      border-radius: 3px;
      font-weight: 700;
      cursor: pointer;
      color: var(--ink);
    }
    .filters button.on {
      background: var(--ink);
      color: var(--bone);
      border-color: var(--ink);
    }
    small {
      font: 700 11px var(--mono);
      opacity: 0.6;
    }
    .race {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    select {
      height: 40px;
      padding: 0 10px;
      border: 1px solid var(--color-light-border);
      border-radius: 3px;
      background: #fff;
      color: var(--ink);
      font: inherit;
    }
    .featured {
      margin-bottom: 40px;
      padding-bottom: 40px;
      border-bottom: 1px solid var(--color-light-border);
    }
  `,
})
export default class Coverage {
  protected data = inject(DataService);
  protected types = TYPES;
  protected type = signal<PostType | 'todo'>('todo');
  protected race = signal('todo');
  private filtered = computed(() =>
    this.data
      .posts()
      .filter((p) => (this.type() === 'todo' || p.type === this.type()) && (this.race() === 'todo' || p.race === this.race())),
  );
  protected featured = computed(() => (this.type() === 'todo' && this.race() === 'todo' ? this.filtered().find((p) => p.featured) : undefined));
  protected rest = computed(() => this.filtered().filter((p) => p !== this.featured()));
  protected count(t: PostType | 'todo') {
    return this.data.posts().filter((p) => t === 'todo' || p.type === t).length;
  }
}
