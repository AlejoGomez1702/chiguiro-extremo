import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data/data.service';
import { PageHead } from '../../shared/page-head';
import { ProductArt } from '../../shared/product-art';

@Component({
  selector: 'app-shop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHead, ProductArt],
  template: `
    <app-page-head eyebrow="Tienda oficial" title="Colecciones 2027" lead="Ropa y coleccionables de la Copa y de cada parada. Retiro en la fan zone o envío nacional." />
    <section class="section section-paper">
      <div class="container">
        <div class="filters" role="tablist" aria-label="Colección">
          @for (c of cols(); track c.id) {
            <button type="button" role="tab" [attr.aria-selected]="col() === c.id" [class.on]="col() === c.id" (click)="col.set(c.id)">{{ c.label }}</button>
          }
        </div>
        <ul class="grid grid-4 list">
          @for (p of list(); track p.id) {
            <li>
              <a [routerLink]="['/tienda', p.id]">
                <div class="art">
                  <app-product-art [product]="p" />
                  @if (p.badge) {
                    <span class="tag tag-dark">{{ p.badge }}</span>
                  }
                </div>
                <span class="mono col">{{ colName(p.col) }}</span>
                <b>{{ p.name }}</b>
                <span class="price">{{ p.price }} USD</span>
                <span class="swatches">
                  @for (c of p.colors; track c.h) {
                    <i [style.background]="c.h" [title]="c.n"></i>
                  }
                </span>
              </a>
            </li>
          }
        </ul>
        <p class="note">Productos ilustrativos. Precios de referencia en USD; el cobro se hace en la moneda de cada país.</p>
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
      padding: 9px 14px;
      border: 1px solid #c9c2b4;
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
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    a {
      display: grid;
      gap: 6px;
      text-decoration: none;
    }
    .art {
      position: relative;
      border-radius: 4px;
      overflow: hidden;
    }
    .art app-product-art {
      transition: transform 0.5s var(--ease);
    }
    a:hover .art app-product-art {
      transform: scale(1.04);
    }
    .tag {
      position: absolute;
      top: 10px;
      left: 10px;
    }
    .col {
      color: var(--brick);
      font-size: 11px;
      text-transform: uppercase;
      margin-top: 6px;
    }
    b {
      font-size: 17px;
    }
    .price {
      font-weight: 700;
    }
    .swatches {
      display: flex;
      gap: 6px;
    }
    .swatches i {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid rgba(0, 0, 0, 0.2);
    }
    .note {
      margin-top: 32px;
      color: #6b665d;
    }
  `,
})
export default class Shop {
  protected data = inject(DataService);
  protected col = signal('todo');
  protected cols = computed(() => [
    { id: 'todo', label: 'Todo' },
    { id: 'copa', label: 'Copa 2027' },
    ...this.data.races().map((r) => ({ id: r.id, label: `Edición ${r.short}` })),
  ].filter((c) => c.id === 'todo' || this.data.products().some((p) => p.col === c.id)));
  protected list = computed(() => this.data.products().filter((p) => this.col() === 'todo' || p.col === this.col()));
  protected colName(id: string) {
    return id === 'copa' ? 'Copa 2027' : `Edición ${this.data.race(id)?.short ?? ''}`;
  }
}
