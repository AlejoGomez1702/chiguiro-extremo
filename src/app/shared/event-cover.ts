import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Race, SiteEvent } from '../core/data/models';
import { themeVars, trailCells } from '../core/theme/brand';
import { Pbtn } from './pbtn';

/**
 * Portada Pixel Trail de un evento (Figma: COVER / MEDIA ASSETS).
 * Todo se mide en `--u`, el módulo de la retícula: 1/24 del ancho en
 * escritorio (frame 1920 / 80 px) y 1/12 en móvil. Trabaja con container
 * queries para que la misma pieza sirva de vista previa en el panel.
 */
@Component({
  selector: 'app-event-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Pbtn, NgTemplateOutlet],
  host: { class: 'theme-scope', '[style]': 'vars()', '[class.preview]': 'preview()' },
  template: `
    <div class="cover" [style.--chars]="chars()">
      <div class="trail top" aria-hidden="true">
        @for (c of cells().top; track c.col + '-' + c.row) {
          <i [class]="'px ' + c.tone" [style.grid-column]="c.col + 1" [style.grid-row]="c.row">
            @if (c.icon) {
              <img [src]="'/assets/brand/icons/' + c.icon + '.svg'" alt="" />
            }
          </i>
        }
      </div>
      <div class="trail bottom" aria-hidden="true">
        @for (c of cells().bottom; track c.col + '-' + c.row) {
          <i [class]="'px ' + c.tone" [style.grid-column]="c.col + 1" [style.grid-row]="c.row">
            @if (c.icon) {
              <img [src]="'/assets/brand/icons/' + c.icon + '.svg'" alt="" />
            }
          </i>
        }
      </div>

      <ng-template #lines>
        <span class="line">{{ event().cover.line1 }}</span>
        <span class="line">
          {{ event().cover.line2 }}
          @if (event().cover.arrow) {
            <i class="arrow" aria-hidden="true"></i>
          }
        </span>
      </ng-template>

      <div class="center">
        @if (preview()) {
          <p class="title"><ng-container [ngTemplateOutlet]="lines" /></p>
        } @else {
          <h1 class="title" [attr.aria-label]="event().name + ' ' + event().series"><ng-container [ngTemplateOutlet]="lines" /></h1>
        }
        <p class="kick">
          <span>{{ event().cover.kickerLeft }}</span>
          <b>{{ event().cover.kickerRight }}</b>
        </p>
        @if (event().status === 'archivado') {
          <p class="past">Evento finalizado · {{ event().dateLabel }}</p>
        }
      </div>

      <div class="act left">
        @if (races().length) {
          <app-pbtn icon="arrow-down" iconTone="signal" label="Ver paradas" [state]="races().length + ''" stateTone="energy" [action]="!preview()" (press)="explore.emit()" />
        } @else {
          <app-pbtn icon="arrow-down" iconTone="signal" label="Conocer" [state]="event().year + ''" stateTone="energy" [action]="!preview()" (press)="explore.emit()" />
        }
      </div>
      @if (next(); as n) {
        <div class="act right">
          <app-pbtn
            icon="arrow-right"
            label="Próxima"
            [state]="n.short"
            [link]="preview() ? null : ['/carreras', n.id]"
          />
        </div>
      }

      @if (races().length) {
        <ol class="stops" aria-label="Paradas">
          @for (r of races(); track r.id) {
            <li>
              <app-pbtn class="block" size="xs" [num]="r.num" icon="chevron" [label]="r.short" [state]="r.dshort" [link]="preview() ? null : ['/carreras', r.id]" />
            </li>
          }
        </ol>
      }

      <p class="by">
        <span class="sr-only">Presentado por Chigüiro</span>
        <i class="by-label" aria-hidden="true"></i>
        <i class="by-mark" aria-hidden="true"></i>
      </p>
    </div>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
      background: var(--cover-bg);
      color: var(--cover-ink);
    }
    .cover {
      --u: calc(100cqw / 24);
      position: relative;
      overflow: hidden;
      /* alto = n módulos + medio: así la franja inferior también cae sobre la retícula */
      min-height: calc(round(up, max(100svh, 56.25cqw) - var(--u) * 0.5, var(--u)) + var(--u) * 0.5);
      display: grid;
      place-items: center;
      /* el bloque del titular descansa justo encima de la franja inferior */
      align-items: end;
      padding: calc(var(--u) * 2.4) var(--u) calc(var(--u) * 3.64);
      /* retícula de 1 módulo */
      background-image:
        linear-gradient(to right, var(--cover-grid) 1px, transparent 1px),
        linear-gradient(to bottom, var(--cover-grid) 1px, transparent 1px);
      background-size: var(--u) var(--u);
    }
    :host(.preview) .cover {
      min-height: 100%;
      height: 100%;
    }

    /* --- recorrido de píxeles --- */
    .trail {
      position: absolute;
      left: 0;
      display: grid;
      grid-template-columns: repeat(24, var(--u));
      grid-auto-rows: var(--u);
      grid-template-rows: repeat(3, var(--u));
      pointer-events: none;
    }
    .top {
      top: var(--u);
    }
    .bottom {

      bottom: calc(var(--u) * 0.5);
    }
    .px {
      display: grid;
      place-items: center;
      color: var(--cover-on-px);
    }
    .px.a {
      background: var(--cover-px-a);
    }
    .px.b {
      background: var(--cover-px-b);
    }
    .px.c {
      background: var(--cover-px-c);
    }
    .px img {
      width: 70%;
      height: auto;
    }

    /* --- titular --- */
    .center {
      position: relative;
      width: min(100%, 62cqw);
      display: grid;
      gap: calc(var(--u) * 0.46);
    }
    .title {
      margin: 0;
      display: grid;
      gap: calc(var(--u) * 0.46);
      font-family: var(--font-primary);
      font-weight: 800;
      font-size: min(16.4cqw, calc(60cqw / (var(--chars) * 0.7)));
      line-height: 0.74;
      letter-spacing: -0.035em;
      text-transform: uppercase;
      white-space: nowrap;
      color: var(--cover-title);
      text-box: trim-both cap alphabetic;
    }
    .line {
      display: flex;
      align-items: center;
      gap: 0.11em;
      text-box: trim-both cap alphabetic;
    }
    .arrow {
      flex: none;
      width: 0.66em;
      height: 0.66em;
      background: currentColor;
      mask: url(/assets/brand/icons/arrow-down-right.svg) center / contain no-repeat;
    }
    .kick {
      display: flex;
      justify-content: space-between;
      gap: var(--space-m);
      padding-left: calc(var(--u) * 0.35);
      font-size: max(14px, 1.5625cqw);
      font-weight: 300;
      line-height: 1.2;
      text-transform: uppercase;
      color: var(--cover-title);
      b {
        font-weight: 800;
      }
    }
    .past {
      justify-self: start;
      margin-left: calc(var(--u) * 0.35);
      padding: 2px 8px;
      font: var(--type-label-m);
      background: var(--cover-ink);
      color: var(--cover-bg);
    }

    /* --- acciones --- */
    .act {
      position: absolute;
      top: 53.2%;
    }
    .left {
      left: calc(var(--u) * 0.68);
    }
    .right {
      right: calc(var(--u) * 0.68);
    }
    .stops {
      position: absolute;
      right: calc(var(--u) * 5);
      bottom: calc(var(--u) * 2.72 - 112px);
      width: max(287px, calc(var(--u) * 3.6));
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
    }

    /* --- presentado por Chigüiro --- */
    .by {
      position: absolute;
      left: calc(var(--u) * 0.25);
      bottom: 22px;
      display: flex;
      align-items: flex-end;
      gap: 0;
      margin: 0;
      color: var(--cover-ink);
    }
    .by i {
      display: block;
      height: 13.74px;
      background: currentColor;
    }
    .by-label {
      width: 81.04px;
      mask: url(/assets/brand/presentado-por.svg) center / contain no-repeat;
    }
    .by-mark {
      width: 57.75px;
      height: 11.96px !important;
      mask: url(/assets/brand/chiguiro-mark.svg) center / contain no-repeat;
    }

    /* --- tablet: las acciones bajan al flujo --- */
    @container (max-width: 1180px) {
      .cover {
        align-items: center;
        align-content: center;
        gap: var(--space-l);
        padding-bottom: calc(var(--u) * 4.4);
      }
      .act,
      .stops {
        position: static;
      }
      .center {
        width: min(100%, 78cqw);
      }
      .title {
        font-size: min(20cqw, calc(76cqw / (var(--chars) * 0.7)));
      }
      .act {
        justify-self: center;
      }
      .left {
        display: none;
      }
      .stops {
        width: min(100%, 340px);
      }
    }

    /* --- móvil: retícula de 12 columnas --- */
    @container (max-width: 700px) {
      .cover {
        --u: calc(100cqw / 12);
        padding: calc(var(--u) * 4.5) var(--space-m) calc(var(--u) * 4.6);
        min-height: calc(round(up, max(100svh, 620px) - var(--u) * 0.5, var(--u)) + var(--u) * 0.5);
      }
      :host(.preview) .cover {
        min-height: 100%;
      }
      .center {
        width: 100%;
      }
      .title {
        font-size: min(31cqw, calc(88cqw / (var(--chars) * 0.7)));
      }
      .kick {
        padding-left: 0;
        font-size: 14px;
      }
      .act {
        justify-self: start;
      }
      .stops {
        justify-self: start;
        width: 100%;
      }
      .by {
        left: var(--space-m);
        bottom: 12px;
      }
    }
  `,
})
export class EventCover {
  readonly event = input.required<SiteEvent>();
  readonly races = input<Race[]>([]);
  /** vista previa del panel: sin enlaces ni altura de pantalla */
  readonly preview = input(false);
  readonly explore = output<void>();

  protected vars = computed(() => themeVars(this.event().theme));
  protected cells = computed(() => trailCells(this.event().theme.trail));
  protected next = computed(() => this.races().find((r) => r.isNext) ?? null);
  /** ancho del titular en "caracteres", para que el texto del cliente siempre quepa */
  protected chars = computed(() => {
    const c = this.event().cover;
    return Math.max(c.line1.trim().length, c.line2.trim().length + (c.arrow ? 1.25 : 0), 3);
  });
}
