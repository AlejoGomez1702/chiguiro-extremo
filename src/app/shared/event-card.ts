import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteEvent } from '../core/data/models';
import { themeVars } from '../core/theme/brand';

const STATUS: Record<string, string> = { publicado: 'En curso', archivado: 'Finalizado', borrador: 'Borrador' };

/** Tarjeta de evento: una mini portada con la paleta propia de ese evento. */
@Component({
  selector: 'app-event-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'theme-scope', '[style]': 'vars()' },
  template: `
    <a [routerLink]="['/eventos', event().id]">
      <div class="tile">
        <i class="px a"></i><i class="px b"></i><i class="px c"></i><i class="px d"></i>
        <strong>{{ event().cover.line1 }}<br />{{ event().cover.line2 }}</strong>
        <span class="year">{{ event().year }}</span>
      </div>
      <div class="meta">
        <h3>{{ event().name }} <span>{{ event().series }}</span></h3>
        <p>{{ event().dateLabel }}. {{ event().place }}.</p>
        <span class="tag" [class.tag-ink-line]="event().status !== 'publicado' || !main()">{{ main() ? 'Evento principal' : status() }}</span>
      </div>
    </a>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }
    a {
      display: grid;
      gap: var(--space-m);
      text-decoration: none;
    }
    .tile {
      --u: calc(100cqw / 8);
      position: relative;
      overflow: hidden;
      aspect-ratio: 8 / 5;
      display: grid;
      align-content: end;
      padding: calc(var(--u) * 0.5);
      background-color: var(--cover-bg);
      background-image:
        linear-gradient(to right, var(--cover-grid) 1px, transparent 1px),
        linear-gradient(to bottom, var(--cover-grid) 1px, transparent 1px);
      background-size: var(--u) var(--u);
      color: var(--cover-title);
    }
    .px {
      position: absolute;
      width: var(--u);
      height: var(--u);
      transition: transform 0.35s var(--ease);
    }
    .a {
      top: 0;
      left: calc(var(--u) * 5);
      background: var(--cover-px-a);
    }
    .b {
      top: 0;
      left: calc(var(--u) * 6);
      background: var(--cover-px-b);
    }
    .c {
      top: var(--u);
      left: calc(var(--u) * 6);
      background: var(--cover-px-a);
    }
    .d {
      top: var(--u);
      left: calc(var(--u) * 7);
      background: var(--cover-px-c);
    }
    /* el recorrido baja un módulo: la única animación de la tarjeta */
    a:hover .px,
    a:focus-visible .px {
      transform: translateY(var(--u));
    }
    strong {
      position: relative;
      font: 800 17cqw / 0.84 var(--font-primary);
      letter-spacing: -0.035em;
      text-transform: uppercase;
    }
    .year {
      position: absolute;
      left: calc(var(--u) * 0.5);
      top: calc(var(--u) * 0.4);
      font: var(--type-data-m);
      color: var(--cover-ink);
    }
    .meta {
      display: grid;
      gap: var(--space-xxs);
      justify-items: start;
    }
    h3 {
      font: var(--type-h3);
      letter-spacing: -0.02em;
    }
    h3 span {
      color: var(--color-text-muted);
    }
    p {
      color: var(--color-text-muted);
      font: var(--type-body-s);
      margin-bottom: var(--space-xxs);
    }
  `,
})
export class EventCard {
  readonly event = input.required<SiteEvent>();
  readonly main = input(false);
  protected vars = computed(() => themeVars(this.event().theme));
  protected status = computed(() => STATUS[this.event().status]);
}
