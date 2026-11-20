import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { DataService } from '../../core/data/data.service';
import { Seo } from '../../core/seo';
import { ProductArt } from '../../shared/product-art';

@Component({
  selector: 'app-product-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductArt],
  template: `
    @if (product(); as p) {
      <section class="wrap">
        <div class="container grid2">
          <div class="art">
            <app-product-art [product]="p" [color]="color()" />
            @if (p.badge) {
              <span class="tag tag-dark">{{ p.badge }}</span>
            }
          </div>
          <div class="info">
            <a routerLink="/tienda" class="back mono">← Tienda</a>
            <span class="eyebrow">{{ p.col === 'copa' ? 'Copa 2027' : 'Edición ' + (data.race(p.col)?.short ?? '') }}</span>
            <h1 class="display display-m">{{ p.name }}</h1>
            <p class="price">{{ p.price }} USD</p>
            <p class="desc">{{ p.desc }}</p>

            <fieldset>
              <legend class="mono">Color · {{ p.colors[color()].n }}</legend>
              <div class="swatches">
                @for (c of p.colors; track c.h; let i = $index) {
                  <button type="button" [style.background]="c.h" [class.on]="color() === i" (click)="color.set(i)" [attr.aria-label]="c.n" [attr.aria-pressed]="color() === i"></button>
                }
              </div>
            </fieldset>

            <fieldset>
              <legend class="mono">Talla</legend>
              <div class="sizes">
                @for (s of p.sizes; track s) {
                  <button type="button" [class.on]="size() === s" (click)="size.set(s); sizeErr.set(false)" [attr.aria-pressed]="size() === s">{{ s }}</button>
                }
              </div>
              @if (sizeErr()) {
                <p class="err" role="alert">Elige una talla.</p>
              }
            </fieldset>

            <button type="button" class="btn add" (click)="add()">Agregar al carrito</button>
            <ul class="perks mono">
              <li>Retiro en la fan zone de la parada</li>
              <li>Envío nacional en Colombia, Perú y México</li>
              <li>Cambios de talla hasta 30 días</li>
            </ul>
          </div>
        </div>
      </section>
    } @else {
      <section class="wrap">
        <div class="container">
          <h1 class="display display-l">Producto no encontrado</h1>
          <a routerLink="/tienda" class="btn">Ver tienda</a>
        </div>
      </section>
    }
  `,
  styles: `
    .wrap {
      padding: calc(var(--header-h) + 48px) 0 80px;
    }
    .grid2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: clamp(28px, 5vw, 64px);
      align-items: start;
    }
    .art {
      position: relative;
      border-radius: 6px;
      overflow: hidden;
    }
    .art .tag {
      position: absolute;
      top: 14px;
      left: 14px;
    }
    .info {
      display: grid;
      gap: 14px;
      justify-items: start;
    }
    .back {
      color: var(--muted);
      text-decoration: none;
    }
    .price {
      font-size: 24px;
      font-weight: 800;
    }
    .desc {
      color: var(--muted-2);
    }
    fieldset {
      border: 0;
      padding: 0;
      margin: 0;
    }
    legend {
      color: var(--muted);
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .swatches,
    .sizes {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .swatches button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid var(--line-2);
      cursor: pointer;
    }
    .swatches button.on {
      outline: 2px solid var(--signal);
      outline-offset: 2px;
    }
    .sizes button {
      min-width: 48px;
      height: 44px;
      padding: 0 12px;
      border: 1px solid var(--line-2);
      background: none;
      border-radius: 3px;
      font-weight: 700;
      cursor: pointer;
    }
    .sizes button.on {
      background: var(--bone);
      color: var(--ink);
      border-color: var(--bone);
    }
    .err {
      color: var(--signal);
      margin-top: 6px;
      font-weight: 700;
    }
    .add {
      width: 100%;
      margin-top: 8px;
    }
    .perks {
      margin: 0;
      padding-left: 18px;
      color: var(--muted);
      display: grid;
      gap: 4px;
    }
    @media (max-width: 760px) {
      .grid2 {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export default class ProductPage {
  readonly id = input.required<string>();
  protected data = inject(DataService);
  private cart = inject(CartService);
  private seo = inject(Seo);
  protected product = computed(() => this.data.product(this.id()));
  protected color = linkedSignal({ source: this.id, computation: () => 0 });
  protected size = linkedSignal<string, string | null>({
    source: this.id,
    computation: () => {
      const p = this.data.product(this.id());
      return p && p.sizes.length === 1 ? p.sizes[0] : null;
    },
  });
  protected sizeErr = signal(false);

  constructor() {
    effect(() => {
      const p = this.product();
      if (p) this.seo.set(p.name, `${p.name}: ${p.desc} ${p.price} USD.`);
    });
  }

  protected add() {
    const p = this.product();
    const s = this.size();
    if (!p) return;
    if (!s) {
      this.sizeErr.set(true);
      return;
    }
    this.cart.add(p.id, this.color(), s);
  }
}
