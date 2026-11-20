import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { DataService } from '../core/data/data.service';
import { ProductArt } from '../shared/product-art';

@Component({
  selector: 'app-cart-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductArt],
  template: `
    @if (cart.open()) {
      <div class="scrim" (click)="cart.open.set(false)"></div>
      <aside role="dialog" aria-modal="true" aria-label="Carrito" (keydown.escape)="cart.open.set(false)">
        <div class="head">
          <h2 class="display display-s">Tu carrito</h2>
          <button type="button" class="close" (click)="cart.open.set(false)" aria-label="Cerrar carrito">✕</button>
        </div>
        @if (!cart.lines().length) {
          <p class="empty">Aún no agregas productos.</p>
          <a routerLink="/tienda" class="btn" (click)="cart.open.set(false)">Ver la tienda</a>
        } @else {
          <ul>
            @for (l of cart.lines(); track $index) {
              @let p = data.product(l.productId);
              @if (p) {
                <li>
                  <app-product-art [product]="p" [color]="l.color" />
                  <div>
                    <b>{{ p.name }}</b>
                    <span class="mono">{{ p.colors[l.color].n }} · {{ l.size }}</span>
                    <div class="qty">
                      <button type="button" (click)="cart.setQty($index, l.qty - 1)" aria-label="Quitar uno">−</button>
                      <span>{{ l.qty }}</span>
                      <button type="button" (click)="cart.setQty($index, l.qty + 1)" aria-label="Agregar uno">+</button>
                    </div>
                  </div>
                  <span class="price">{{ p.price * l.qty }} USD</span>
                </li>
              }
            }
          </ul>
          <div class="total">
            <span>Total</span>
            <b>{{ cart.total() }} USD</b>
          </div>
          @if (checkout()) {
            <p class="note" role="status">
              Demo: el pago se conectará a la pasarela de cada país (Mercado Pago, Bold o ePayco) según la sede.
            </p>
          }
          <button type="button" class="btn" (click)="checkout.set(true)">Ir a pagar</button>
          <p class="note">Retiro en la fan zone de cada parada o envío nacional.</p>
        }
      </aside>
    }
  `,
  styles: `
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 90;
      background: rgba(0, 0, 0, 0.55);
      animation: fade 0.25s;
    }
    aside {
      position: fixed;
      z-index: 91;
      inset: 0 0 0 auto;
      width: min(420px, 100%);
      background: var(--ink-2);
      border-left: 1px solid var(--line);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow: auto;
      animation: slide 0.35s var(--ease);
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .close {
      background: none;
      border: 0;
      font-size: 20px;
      cursor: pointer;
      width: 40px;
      height: 40px;
    }
    .empty {
      color: var(--muted);
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 12px;
    }
    li {
      display: grid;
      grid-template-columns: 72px 1fr auto;
      gap: 12px;
      align-items: start;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--line);
    }
    app-product-art {
      width: 72px;
      height: 72px;
      border-radius: 3px;
    }
    li b {
      display: block;
      font-size: 15px;
    }
    li .mono {
      color: var(--muted);
    }
    .qty {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 6px;
    }
    .qty button {
      width: 28px;
      height: 28px;
      border: 1px solid var(--line-2);
      background: none;
      border-radius: 3px;
      cursor: pointer;
    }
    .price {
      font-weight: 700;
    }
    .total {
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      margin-top: auto;
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
    @keyframes slide {
      from {
        transform: translateX(100%);
      }
    }
  `,
})
export class CartDrawer {
  protected cart = inject(CartService);
  protected data = inject(DataService);
  protected checkout = signal(false);
}
