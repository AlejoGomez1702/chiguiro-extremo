import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SmoothScroll } from './core/smooth-scroll.service';
import { ThemeService } from './core/theme/theme.service';
import { CartDrawer } from './layout/cart-drawer';
import { Footer } from './layout/footer';
import { Header } from './layout/header';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, CartDrawer],
  host: { '[style]': 'theme.vars()' },
  template: `
    <a class="skip" href="#contenido">Saltar al contenido</a>
    <app-header />
    <main id="contenido">
      <router-outlet />
    </main>
    <app-footer />
    <app-cart-drawer />
  `,
  styles: `
    .skip {
      position: fixed;
      top: 8px;
      left: 8px;
      z-index: 100;
      padding: 8px 12px;
      background: var(--signal);
      color: var(--ink);
      font-weight: 700;
      transform: translateY(-200%);
    }
    .skip:focus {
      transform: none;
    }
  `,
})
export class App {
  protected theme = inject(ThemeService);
  constructor() {
    const scroll = inject(SmoothScroll);
    const router = inject(Router);
    afterNextRender(() => {
      scroll.init();
      router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
        if (!location.hash) scroll.toTop();
      });
    });
  }
}
