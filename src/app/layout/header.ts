import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { CartService } from '../core/cart.service';
import { SmoothScroll } from '../core/smooth-scroll.service';
import { Logo } from './logo';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Logo],
  template: `
    <header [class.solid]="solid()" [class.on-cover]="onCover()" [class.open]="menu()">
      <div class="bar">
        <a routerLink="/" class="brand" aria-label="Chigüiro Extremo, inicio" (click)="menu.set(false)">
          <app-logo />
        </a>
        <nav id="main-nav" aria-label="Principal">
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active" (click)="menu.set(false)">{{ l.label }}</a>
          }
          <a routerLink="/tienda" class="nav-shop" routerLinkActive="active" (click)="menu.set(false)">Tienda</a>
        </nav>
        <div class="tools">
          <a routerLink="/tienda" class="shop" routerLinkActive="active" (click)="menu.set(false)">Tienda</a>
          <button class="icon cart" type="button" (click)="cart.open.set(true)" [attr.aria-label]="'Carrito, ' + cart.count() + ' productos'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 7h12l-1 13H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
            @if (cart.count()) {
              <span class="badge">{{ cart.count() }}</span>
            }
          </button>
          <button class="icon burger" type="button" (click)="menu.update((v) => !v)" [attr.aria-expanded]="menu()" aria-controls="main-nav" aria-label="Menú">
            <span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: `
    header {
      position: fixed;
      inset: 0 0 auto;
      z-index: 50;
      height: var(--header-h);
      color: var(--color-text);
      border-bottom: 1px solid transparent;
      transition:
        background 0.3s,
        border-color 0.3s,
        color 0.3s;
    }
    /* sobre la portada de color: tinta del evento, sin fondo */
    header.on-cover {
      color: var(--cover-ink);
    }
    header.solid {
      color: var(--color-text);
      background: color-mix(in srgb, var(--color-bg) 92%, transparent);
      backdrop-filter: blur(10px);
      border-color: var(--color-border);
    }
    .bar {
      height: 100%;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: var(--space-l);
      padding-inline: clamp(16px, 1.4vw, 24px);
    }
    .brand {
      justify-self: start;
      text-decoration: none;
    }
    nav {
      display: flex;
      align-items: center;
      gap: var(--space-xxs);
    }
    nav a,
    .shop {
      padding: 6px 12px;
      font: var(--type-label-m);
      text-decoration: none;
      transition:
        background 0.2s,
        color 0.2s;
    }
    /* enlace activo o bajo el cursor: bloque sólido con el texto en negativo */
    nav a:hover,
    .shop:hover,
    nav a.active,
    .shop.active {
      background: var(--color-text);
      color: var(--color-bg);
    }
    .on-cover:not(.solid) nav a:hover,
    .on-cover:not(.solid) .shop:hover,
    .on-cover:not(.solid) nav a.active {
      background: var(--cover-ink);
      color: var(--cover-bg);
    }
    .tools {
      justify-self: end;
      display: flex;
      align-items: center;
      gap: var(--space-xxs);
    }
    .icon {
      position: relative;
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      background: none;
      border: 0;
      cursor: pointer;
    }
    .icon svg {
      width: 22px;
      height: 22px;
    }
    .badge {
      position: absolute;
      top: 4px;
      right: 2px;
      min-width: 18px;
      height: 18px;
      background: var(--color-accent);
      color: var(--color-on-accent);
      font: 500 11px/18px var(--font-data);
      text-align: center;
    }
    .burger,
    nav .nav-shop {
      display: none;
    }
    .burger span {
      position: absolute;
      left: 11px;
      right: 11px;
      height: 2px;
      background: currentColor;
      transition: transform 0.3s var(--ease);
    }
    .burger span:first-child {
      transform: translateY(-4px);
    }
    .burger span:last-child {
      transform: translateY(4px);
    }
    .open .burger span:first-child {
      transform: rotate(45deg);
    }
    .open .burger span:last-child {
      transform: rotate(-45deg);
    }
    @media (max-width: 860px) {
      .bar {
        grid-template-columns: 1fr auto;
      }
      .burger {
        display: grid;
      }
      .shop {
        display: none;
      }
      nav .nav-shop {
        display: block;
      }
      nav {
        position: fixed;
        inset: var(--header-h) 0 auto;
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        padding: var(--space-s) var(--gutter) var(--space-l);
        background: var(--color-bg);
        color: var(--color-text);
        border-bottom: 1px solid var(--color-border);
        transform: translateY(-8px);
        opacity: 0;
        visibility: hidden;
        transition: 0.25s var(--ease);
      }
      .open nav {
        transform: none;
        opacity: 1;
        visibility: visible;
      }
      nav a {
        padding: 14px 0;
        font-size: 22px;
        font-weight: 300;
        line-height: 1.2;
        border-bottom: 1px solid var(--color-border);
      }
      nav a:hover,
      nav a.active {
        background: none;
        color: var(--color-accent);
      }
    }
  `,
})
export class Header {
  protected cart = inject(CartService);
  private scroll = inject(SmoothScroll);
  private router = inject(Router);
  protected menu = signal(false);
  private path = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects.split(/[?#]/)[0]),
    ),
    { initialValue: this.router.url.split(/[?#]/)[0] },
  );
  /** rutas que abren con una portada de color a pantalla completa */
  private cover = computed(() => /^\/?$|^\/eventos\/[^/]+$/.test(this.path()));
  private clear = computed(() => this.cover() || /^\/carreras\/[^/]+$/.test(this.path()));
  protected onCover = computed(() => this.cover() && !this.menu());
  protected solid = computed(() => this.menu() || this.scroll.y() > 40 || !this.clear());
  protected links = [
    { path: '/eventos', label: 'Eventos' },
    { path: '/carreras', label: 'Paradas' },
    { path: '/corredores', label: 'Riders' },
    { path: '/cobertura', label: 'Cobertura' },
    { path: '/serie', label: 'La serie' },
  ];
}
