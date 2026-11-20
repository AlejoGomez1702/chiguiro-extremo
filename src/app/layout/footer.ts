import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { Logo } from './logo';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Logo],
  template: `
    <footer>
      <div class="container cols">
        <div class="about">
          <app-logo />
          <p>Eventos de descenso urbano en las ciudades más empinadas de Latinoamérica.</p>
          <ul class="social" aria-label="Redes">
            <li><a href="https://youtube.com" target="_blank" rel="noopener" aria-label="YouTube"><img src="/assets/brand/icons/yt.svg" alt="" width="18" height="18" /></a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram"><img src="/assets/brand/icons/ig.svg" alt="" width="18" height="18" /></a></li>
            <li><a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook"><img src="/assets/brand/icons/fb.svg" alt="" width="18" height="18" /></a></li>
          </ul>
        </div>
        <nav aria-label="Eventos">
          <b>Eventos</b>
          <a [routerLink]="['/eventos', data.featured().id]">{{ data.featured().name }} {{ data.featured().year }}</a>
          <a routerLink="/carreras">Paradas y clasificación</a>
          <a routerLink="/corredores">Riders</a>
          <a routerLink="/eventos">Histórico de eventos</a>
        </nav>
        <nav aria-label="Más">
          <b>Más</b>
          <a routerLink="/cobertura">Cobertura</a>
          <a routerLink="/tienda">Tienda</a>
          <a routerLink="/serie">Formato y reglamento</a>
          <a routerLink="/serie" fragment="contacto">Contacto y prensa</a>
        </nav>
        <form class="news" (submit)="$event.preventDefault(); sent.set(true)">
          <b>Boletín</b>
          @if (sent()) {
            <p role="status">Listo. Te avisamos cuando abran las inscripciones.</p>
          } @else {
            <label for="nl-mail">Fechas, inscripciones y resultados en tu correo.</label>
            <div class="row">
              <input id="nl-mail" type="email" required placeholder="tu@correo.com" autocomplete="email" />
              <button class="btn btn-sm" type="submit">Suscribirme</button>
            </div>
          }
        </form>
      </div>
      <div class="container legal note">
        <span>© 2026 Chigüiro Extremo. Sitio con datos de ejemplo. Mapa © colaboradores de OpenStreetMap.</span>
        <span>Relieve: Copernicus DEM (ESA). Texturas, cielo y modelos 3D: Poly Haven (CC0).</span>
      </div>
    </footer>
  `,
  styles: `
    footer {
      position: relative;
      z-index: 2;
      background: var(--color-bg);
      border-top: 1px solid var(--color-border);
      padding: var(--space-section) 0 var(--space-l);
    }
    .cols {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1.6fr;
      gap: var(--space-xxl);
    }
    .about p {
      margin: var(--space-m) 0;
      color: var(--color-text-muted);
      max-width: 32ch;
    }
    .social {
      display: flex;
      gap: var(--space-xs);
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .social a {
      display: grid;
      place-items: center;
      width: var(--control-m);
      height: var(--control-m);
      border: 1px solid var(--color-border);
      transition: border-color 0.2s;
    }
    .social a:hover {
      border-color: var(--color-text);
    }
    nav,
    .news {
      display: grid;
      align-content: start;
      gap: var(--space-xs);
    }
    b {
      font: var(--type-label-m);
      color: var(--color-text-subtle);
      margin-bottom: var(--space-xxs);
    }
    nav a {
      color: var(--color-text);
      text-decoration: none;
    }
    nav a:hover {
      color: var(--color-accent);
    }
    .news label,
    .news p {
      color: var(--color-text-muted);
    }
    .row {
      display: flex;
      gap: var(--space-xs);
    }
    input {
      flex: 1;
      min-width: 0;
      height: var(--control-s);
      padding: 0 var(--space-s);
      background: var(--color-surface);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-s);
      color: var(--color-text);
      font: inherit;
    }
    .legal {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--space-xs);
      margin-top: var(--space-xxl);
      padding-top: var(--space-m);
      border-top: 1px solid var(--color-border);
    }
    @media (max-width: 860px) {
      .cols {
        grid-template-columns: 1fr 1fr;
        gap: var(--space-xl);
      }
      .about,
      .news {
        grid-column: 1 / -1;
      }
    }
  `,
})
export class Footer {
  protected data = inject(DataService);
  protected sent = signal(false);
}
