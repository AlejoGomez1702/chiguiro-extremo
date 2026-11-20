import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data/data.service';
import { PageHead } from '../../shared/page-head';

@Component({
  selector: 'app-cup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHead],
  template: `
    <app-page-head eyebrow="Downtown" title="Descenso urbano latinoamericano" lead="Una serie por invitación que lleva el downhill a las calles más empinadas de la región: escaleras, muros, barandas y plazas llenas de público." />

    <section class="section">
      <div class="container cols">
        <div>
          <span class="eyebrow">Formato</span>
          <h2 class="display display-m">Tres paradas, una clasificación</h2>
        </div>
        <ol class="steps">
          <li>
            <b class="display">01</b>
            <div>
              <h3>Entrenamientos y reconocimiento</h3>
              <p>El viernes los pilotos recorren la pista a pie y hacen bajadas cronometradas no oficiales.</p>
            </div>
          </li>
          <li>
            <b class="display">02</b>
            <div>
              <h3>Clasificación</h3>
              <p>Una bajada por piloto define el orden de salida de la final (los más rápidos salen al final).</p>
            </div>
          </li>
          <li>
            <b class="display">03</b>
            <div>
              <h3>Final</h3>
              <p>Una sola bajada contra el reloj. El mejor tiempo gana la parada y suma puntos a la clasificación general.</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <section class="section section-light">
      <div class="container">
        <span class="eyebrow">Categorías</span>
        <h2 class="display display-m">Quién corre</h2>
        <ul class="cats">
          @for (c of data.categories(); track c) {
            <li>
              <b>{{ c }}</b>
              <span class="mono">{{ countIn(c) }} invitados</span>
            </li>
          }
        </ul>
      </div>
    </section>

    <section class="section" id="reglamento">
      <div class="container">
        <span class="eyebrow">Reglamento</span>
        <h2 class="display display-m">Lo esencial</h2>
        <div class="faq">
          @for (q of faq; track q.q; let i = $index) {
            <div class="item" [class.open]="open() === i">
              <button type="button" (click)="open.set(open() === i ? -1 : i)" [attr.aria-expanded]="open() === i">
                {{ q.q }}
                <span aria-hidden="true">{{ open() === i ? '−' : '+' }}</span>
              </button>
              @if (open() === i) {
                <p>{{ q.a }}</p>
              }
            </div>
          }
        </div>
        <p class="note">Resumen ilustrativo. El reglamento oficial se publica en PDF antes de cada parada.</p>
      </div>
    </section>

    <section class="section section-paper" id="contacto">
      <div class="container cols">
        <div>
          <span class="eyebrow">Contacto y prensa</span>
          <h2 class="display display-m">Hablemos</h2>
          <p>Ciudades interesadas en recibir una parada, marcas aliadas y acreditaciones de prensa.</p>
        </div>
        <form (submit)="$event.preventDefault(); sent.set(true)">
          @if (sent()) {
            <p class="ok" role="status">Mensaje recibido (demo). Te respondemos pronto.</p>
          } @else {
            <label>Nombre <input required autocomplete="name" /></label>
            <label>Correo <input type="email" required autocomplete="email" /></label>
            <label>
              Motivo
              <select>
                <option>Prensa</option>
                <option>Patrocinio</option>
                <option>Ciudad sede</option>
                <option>Otro</option>
              </select>
            </label>
            <label>Mensaje <textarea rows="4"></textarea></label>
            <button class="btn btn-dark" type="submit">Enviar</button>
          }
        </form>
      </div>
    </section>

    <section class="section cta">
      <div class="container">
        <h2 class="display display-l">La próxima parada es {{ data.nextRace().title }}</h2>
        <a class="btn" [routerLink]="['/carreras', data.nextRace().id]">Ver carrera</a>
      </div>
    </section>
  `,
  styles: `
    .cols {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: clamp(28px, 5vw, 72px);
      align-items: start;
    }
    .steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 1px;
      background: var(--line);
      border: 1px solid var(--line);
    }
    .steps li {
      display: grid;
      grid-template-columns: 64px 1fr;
      gap: 16px;
      padding: 20px;
      background: var(--ink-2);
    }
    .steps b {
      font-size: 40px;
      color: var(--signal);
    }
    .steps h3 {
      font-size: 19px;
      margin-bottom: 4px;
    }
    .steps p {
      color: var(--muted-2);
    }
    .cats {
      list-style: none;
      margin: 24px 0 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }
    .cats li {
      padding: 20px;
      border: 1px solid var(--color-light-border);
      border-radius: 4px;
      background: #fff;
      display: grid;
      gap: 4px;
    }
    .cats b {
      font: 900 28px var(--display);
      text-transform: uppercase;
    }
    .cats .mono {
      color: var(--color-light-muted);
    }
    .faq {
      margin-top: 24px;
      border-top: 1px solid var(--line);
    }
    .item {
      border-bottom: 1px solid var(--line);
    }
    .item button {
      width: 100%;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 0;
      background: none;
      border: 0;
      text-align: left;
      font-weight: 700;
      font-size: 18px;
      cursor: pointer;
    }
    .item p {
      padding-bottom: 18px;
      color: var(--muted-2);
      max-width: 70ch;
    }
    .note {
      margin-top: 16px;
    }
    form {
      display: grid;
      gap: 12px;
    }
    label {
      display: grid;
      gap: 6px;
      font-weight: 700;
      font-size: 14px;
    }
    input,
    select,
    textarea {
      padding: 10px 12px;
      border: 1px solid var(--color-light-border);
      border-radius: 3px;
      background: #fff;
      color: var(--ink);
      font: inherit;
      font-weight: 400;
    }
    .ok {
      font-weight: 700;
    }
    .cta {
      text-align: center;
      background:
        radial-gradient(60% 120% at 50% 100%, color-mix(in srgb, var(--brand-primary) 45%, transparent), transparent 70%),
        var(--ink);
    }
    .cta .container {
      display: grid;
      gap: 24px;
      justify-items: center;
    }
    @media (max-width: 760px) {
      .cols {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export default class Cup {
  protected data = inject(DataService);
  protected open = signal(0);
  protected sent = signal(false);
  protected faq = [
    { q: '¿Quién puede correr?', a: 'Downtown es por invitación. La organización invita pilotos por su trayectoria en descenso urbano y en campeonatos nacionales.' },
    { q: '¿Qué equipo de protección es obligatorio?', a: 'Casco integral certificado, protector de espalda, rodilleras, guantes de dedo completo y calzado cerrado.' },
    { q: '¿Cómo se otorgan los puntos?', a: 'Cada final reparte puntos por posición. La suma de las tres paradas define al campeón de la serie por categoría.' },
    { q: '¿El público paga entrada?', a: 'Las zonas de público son de acceso libre salvo que la sede indique lo contrario. Se publica en la ficha de cada carrera.' },
  ];
  protected countIn(c: string) {
    return this.data.riders().filter((r) => r.category === c).length;
  }
}
