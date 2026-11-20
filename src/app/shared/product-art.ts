import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Product } from '../core/data/models';

/** Silueta ilustrativa del producto con su estampado (como en el demo). */
@Component({
  selector: 'app-product-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 200 200" role="img" [attr.aria-label]="product().name">
      @switch (shape()) {
        @case ('poster') {
          <rect x="52" y="30" width="96" height="140" [attr.fill]="fill()" stroke="var(--color-light-border)" />
        }
        @case ('cap') {
          <path d="M40 120c0-40 25-62 60-62s60 22 60 62Z" [attr.fill]="fill()" />
          <path d="M150 118c20 2 34 8 38 16H142Z" [attr.fill]="fill()" />
        }
        @case ('gloves') {
          <path d="M60 170V95l8-38h10l2 34 6-44h10l2 44 6-40h10l2 42 6-30h10l-2 52-8 55Z" [attr.fill]="fill()" />
        }
        @case ('socks') {
          <path d="M80 30h40v90l30 22c12 9 6 30-10 30H90c-10 0-14-8-14-16Z" [attr.fill]="fill()" />
        }
        @case ('hoodie') {
          <path d="M70 40c10-12 50-12 60 0l38 20 16 70-26 8-8-40v92H50V98l-8 40-26-8 16-70Z" [attr.fill]="fill()" />
          <path d="M80 40c4 18 36 18 40 0" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="4" />
        }
        @default {
          <path
            [attr.d]="
              shape() === 'longsleeve'
                ? 'M70 38c8 10 52 10 60 0l40 18 16 92-24 4-12-62v100H50V90l-12 62-24-4 16-92Z'
                : 'M70 38c8 10 52 10 60 0l44 22-14 32-20-8v106H60V84l-20 8-14-32Z'
            "
            [attr.fill]="fill()"
          />
        }
      }
      @if (product().print) {
        <text x="100" [attr.y]="textY()" text-anchor="middle" [attr.fill]="ink()" font-family="Bricolage Grotesque" font-weight="800" [attr.font-size]="size()">
          @for (l of lines(); track $index) {
            <tspan x="100" [attr.dy]="$index ? size() * 0.88 : 0">{{ l }}</tspan>
          }
        </text>
      }
    </svg>
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
      background: var(--sand);
      aspect-ratio: 1;
    }
    svg {
      width: 78%;
      height: 78%;
    }
  `,
})
export class ProductArt {
  readonly product = input.required<Product>();
  readonly color = input(0);
  protected fill = computed(() => this.product().colors[this.color()]?.h ?? '#1a1a1a');
  protected shape = computed(() => this.product().kind);
  protected lines = computed(() => this.product().print.split('\n'));
  protected ink = computed(() => {
    const h = this.fill().replace('#', '');
    const lum = (parseInt(h.slice(0, 2), 16) * 299 + parseInt(h.slice(2, 4), 16) * 587 + parseInt(h.slice(4, 6), 16) * 114) / 1000;
    if (this.fill().toUpperCase() === '#FF5B1F') return '#121212';
    return lum > 150 ? '#121212' : '#FF5B1F';
  });
  protected size = computed(() => (this.shape() === 'poster' ? 18 : 16));
  protected textY = computed(() => (this.shape() === 'poster' ? 92 : this.shape() === 'cap' ? 100 : 100));
}
