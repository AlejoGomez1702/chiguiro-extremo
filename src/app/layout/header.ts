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
    <header [class.solid]="solid()" [class.open]="menu()">
      <div class="container bar">
        <a routerLink="/" class="brand" aria-label="Copa LATAM Downhill Urbano, inicio" (click)="menu.set(false)">
          <app-logo />
        </a>
        <nav id="main-nav" aria-label="Principal">
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active" (click)="menu.set(false)">{{ l.label }}</a>
          }
          <a routerLink="/tienda" class="btn btn-sm shop" (click)="menu.set(false)">Tienda</a>
        </nav>
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
    </header>
  `,
  styles: `
    header {
      position: fixed;
      inset: 0 0 auto;
      z-index: 50;
      height: var(--header-h);
      transition:
        background 0.3s,
        border-color 0.3s;
      border-bottom: 1px solid transparent;
      background: linear-gradient(rgba(18, 18, 18, 0.55), rgba(18, 18, 18, 0));
    }
    header.solid {
      background: rgba(18, 18, 18, 0.92);
      backdrop-filter: blur(10px);
      border-color: var(--line);
    }
    .bar {
      height: 100%;
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .brand {
      text-decoration: none;
      margin-right: auto;
    }
    nav {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    nav a:not(.btn) {
      padding: 8px 12px;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      color: var(--muted-2);
      border-radius: 3px;
      transition: color 0.2s;
    }
    nav a:not(.btn):hover,
    nav a.active {
      color: var(--bone);
    }
    nav a.active {
      box-shadow: inset 0 -2px 0 var(--signal);
    }
    .shop {
      margin-left: 8px;
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
      width: 24px;
      height: 24px;
    }
    .badge {
      position: absolute;
      top: 4px;
      right: 2px;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      background: var(--signal);
      color: var(--ink);
      font: 700 11px/18px var(--mono);
      text-align: center;
    }
    .burger {
      display: none;
    }
    .burger span {
      position: absolute;
      left: 11px;
      right: 11px;
      height: 2px;
      background: var(--bone);
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
      .burger {
        display: grid;
      }
      nav {
        position: fixed;
        inset: var(--header-h) 0 auto;
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        padding: 12px var(--gutter) 24px;
        background: rgba(18, 18, 18, 0.97);
        border-bottom: 1px solid var(--line);
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
      nav a:not(.btn) {
        padding: 14px 0;
        font-size: 20px;
        border-bottom: 1px solid var(--line);
      }
      nav a.active {
        box-shadow: none;
        color: var(--signal);
      }
      .shop {
        margin: 16px 0 0;
      }
    }
  `,
})
export class Header {
  protected cart = inject(CartService);
  private scroll = inject(SmoothScroll);
  private router = inject(Router);
  protected menu = signal(false);
  private url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected solid = computed(() => this.menu() || this.scroll.y() > 40 || !this.url().split(/[?#]/)[0].match(/^\/?$|^\/carreras\/[^/]+$/));
  protected links = [
    { path: '/carreras', label: 'Carreras' },
    { path: '/cobertura', label: 'Cobertura' },
    { path: '/corredores', label: 'Corredores' },
    { path: '/copa', label: 'La Copa' },
  ];
}
