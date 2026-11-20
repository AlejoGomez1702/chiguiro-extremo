import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { RESPONSE_INIT } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section>
      <div class="container">
        <span class="eyebrow">Error 404</span>
        <h1 class="display display-xl">Fuera de pista</h1>
        <p class="lead">Esta página no existe o se movió. Vuelve a la salida.</p>
        <a routerLink="/" class="btn">Volver al inicio</a>
      </div>
    </section>
  `,
  styles: `
    section {
      min-height: 80vh;
      display: grid;
      align-items: center;
      padding-top: var(--header-h);
    }
    .container {
      display: grid;
      gap: 18px;
      justify-items: start;
    }
  `,
})
export default class NotFound {
  constructor() {
    const res = inject(RESPONSE_INIT, { optional: true });
    if (isPlatformServer(inject(PLATFORM_ID)) && res) res.status = 404;
  }
}
