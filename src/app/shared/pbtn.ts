import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Role } from '../core/theme/brand';

export type PbtnIcon = 'arrow-right' | 'arrow-left' | 'arrow-down' | 'chevron';

/**
 * Botón paramétrico Downtown (DT/Button/Parametric): módulos pegados de número,
 * icono, etiqueta y estado, cada uno con el pastel de un rol de marca.
 * Con `link` navega, con `action` emite `press`; sin ninguno es decorativo.
 */
@Component({
  selector: 'app-pbtn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgTemplateOutlet],
  template: `
    <ng-template #body>
      @if (num() !== '') {
        <span [class]="'mod num t-' + numTone()">{{ num() }}</span>
      }
      @if (icon(); as ic) {
        <span [class]="'mod ico t-' + iconTone()"><i [class]="'g g-' + ic"></i></span>
      }
      <span [class]="'mod lbl t-' + labelTone()">{{ label() }}</span>
      @if (state()) {
        <span [class]="'mod st t-' + stateTone()">{{ state() }}</span>
      }
    </ng-template>
    @if (link(); as to) {
      <a [class]="'pb ' + size()" [routerLink]="to" [fragment]="fragment()"><ng-container [ngTemplateOutlet]="body" /></a>
    } @else if (action()) {
      <button type="button" [class]="'pb ' + size()" (click)="press.emit()"><ng-container [ngTemplateOutlet]="body" /></button>
    } @else {
      <span [class]="'pb ' + size()"><ng-container [ngTemplateOutlet]="body" /></span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
    }
    :host(.block) {
      display: flex;
      .pb {
        flex: 1;
      }
      .st {
        flex: 1;
        justify-content: flex-start;
      }
    }
    .pb {
      display: inline-flex;
      align-items: stretch;
      height: var(--h);
      padding: 0;
      border: 0;
      background: none;
      font: var(--type-label-m);
      color: var(--on-pastel);
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
    }
    span.pb {
      cursor: default;
    }
    .l {
      --h: var(--control-l);
      --g: var(--icon-20);
    }
    .m {
      --h: var(--control-m);
      --g: var(--icon-20);
    }
    .xs {
      --h: var(--control-xs);
      --g: var(--icon-18);
    }
    .mod {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding-inline: var(--space-l);
      transition:
        background 0.2s,
        color 0.2s;
    }
    .num {
      min-width: var(--h);
      padding-inline: 6px;
      font-family: var(--font-data);
      font-variant-numeric: tabular-nums;
    }
    .ico {
      width: var(--h);
      padding: 0;
      flex: none;
    }
    .lbl,
    .st {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .xs .lbl,
    .xs .st {
      padding-inline: var(--space-m);
    }
    .t-primary {
      background: var(--brand-primary-pastel);
    }
    .t-energy {
      background: var(--brand-energy-pastel);
    }
    .t-signal {
      background: var(--brand-signal-pastel);
    }
    .t-warm {
      background: var(--brand-warm-pastel);
    }
    .t-highlight {
      background: var(--brand-highlight-pastel);
    }
    .g {
      width: var(--g);
      height: var(--g);
      background: currentColor;
      mask: var(--src) center / contain no-repeat;
      transition: transform 0.25s var(--ease);
    }
    .g-arrow-right {
      --src: url(/assets/brand/glyph-arrow-right.svg);
    }
    .g-arrow-left {
      --src: url(/assets/brand/glyph-arrow-left.svg);
    }
    .g-arrow-down {
      --src: url(/assets/brand/glyph-arrow-right.svg);
      rotate: 90deg;
    }
    .g-chevron {
      --src: url(/assets/brand/glyph-chevron.svg);
    }
    /* al pasar el cursor, el módulo del icono se entinta */
    a.pb:hover .ico,
    button.pb:hover .ico,
    a.pb:focus-visible .ico,
    button.pb:focus-visible .ico {
      background: var(--dt-ink);
      color: var(--dt-gray-50);
    }
    a.pb:hover .g-arrow-right,
    button.pb:hover .g-arrow-right,
    a.pb:hover .g-chevron {
      transform: translateX(2px);
    }
    a.pb:hover .g-arrow-left {
      transform: translateX(-2px);
    }
    button.pb:hover .g-arrow-down {
      transform: translateX(2px);
    }
    .pb:focus-visible {
      outline: 2px solid var(--dt-ink);
      outline-offset: 2px;
    }
  `,
})
export class Pbtn {
  readonly label = input.required<string>();
  readonly state = input('');
  readonly num = input('');
  readonly icon = input<PbtnIcon | null>(null);
  readonly size = input<'l' | 'm' | 'xs'>('l');
  readonly link = input<string | unknown[] | null>(null);
  readonly fragment = input<string | undefined>(undefined);
  readonly action = input(false);
  readonly numTone = input<Role>('energy');
  readonly iconTone = input<Role>('energy');
  readonly labelTone = input<Role>('primary');
  readonly stateTone = input<Role>('signal');
  readonly press = output<void>();
}
