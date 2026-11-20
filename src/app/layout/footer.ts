import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
          <p>Tres paradas de descenso urbano en Colombia, Perú y México. Temporada 2027.</p>
          <a class="ig" href="https://instagram.com" target="_blank" rel="noopener">Instagram ↗</a>
        </div>
        <nav aria-label="Pie de página">
          <b class="mono">La Copa</b>
          <a routerLink="/carreras">Calendario y clasificación</a>
          <a routerLink="/corredores">Corredores</a>
          <a routerLink="/cobertura">Cobertura</a>
          <a routerLink="/copa">Reglamento</a>
        </nav>
        <nav aria-label="Tienda">
          <b class="mono">Tienda</b>
          <a routerLink="/tienda">Colección Manizales</a>
          <a routerLink="/tienda">Copa 2027</a>
          <a routerLink="/copa" fragment="contacto">Contacto y prensa</a>
        </nav>
        <form class="news" (submit)="$event.preventDefault(); sent.set(true)">
          <b class="mono">Boletín</b>
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
        <span>© 2026 Copa Latinoamericana de Downhill Urbano · Sitio con datos de ejemplo · Mapa © colaboradores de OpenStreetMap</span>
        <span>Relieve: Copernicus DEM (ESA) · Texturas, cielo y modelos 3D: Poly Haven (CC0)</span>
      </div>
    </footer>
  `,
  styles: `
    footer {
      position: relative;
      z-index: 2;
      background: var(--ink);
      border-top: 1px solid var(--line);
      padding: 64px 0 28px;
    }
    .cols {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1.6fr;
      gap: 40px;
    }
    .about p {
      margin: 16px 0 12px;
      color: var(--muted);
      max-width: 32ch;
    }
    .ig {
      font-weight: 700;
      color: var(--signal);
      text-decoration: none;
    }
    nav,
    .news {
      display: grid;
      align-content: start;
      gap: 10px;
    }
    b.mono {
      color: var(--muted-3);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    nav a {
      color: var(--muted-2);
      text-decoration: none;
      font-weight: 600;
    }
    nav a:hover {
      color: var(--bone);
    }
    .news label,
    .news p {
      color: var(--muted);
    }
    .row {
      display: flex;
      gap: 8px;
    }
    input {
      flex: 1;
      min-width: 0;
      height: 40px;
      padding: 0 12px;
      background: var(--ink-3);
      border: 1px solid var(--line-2);
      border-radius: var(--radius);
      color: var(--bone);
      font: inherit;
    }
    .legal {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid var(--line);
    }
    @media (max-width: 860px) {
      .cols {
        grid-template-columns: 1fr 1fr;
      }
      .about,
      .news {
        grid-column: 1 / -1;
      }
    }
  `,
})
export class Footer {
  protected sent = signal(false);
}
