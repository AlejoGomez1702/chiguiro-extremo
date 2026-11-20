import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data/data.service';
import { Seo } from '../../core/seo';
import { RiderAvatar, RiderCard } from '../../shared/rider-card';

@Component({
  selector: 'app-rider-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RiderAvatar, RiderCard],
  template: `
    @if (rider(); as r) {
      <section class="profile">
        <div class="container grid2">
          <app-rider-avatar [rider]="r" />
          <div class="info">
            <a routerLink="/corredores" class="back mono">← Corredores</a>
            <span class="eyebrow">{{ r.country }} · {{ r.category }}</span>
            <h1 class="display display-l">{{ r.name }}</h1>
            <p class="lead">{{ r.desc }}</p>
            <dl>
              <div>
                <dt class="mono">Placa</dt>
                <dd class="display">{{ r.plate }}</dd>
              </div>
              <div>
                <dt class="mono">Equipo</dt>
                <dd>{{ r.team || 'Por confirmar' }}</dd>
              </div>
              @if (r.feat) {
                <div class="wide">
                  <dt class="mono">Logros</dt>
                  <dd>{{ r.feat }}</dd>
                </div>
              }
              @if (r.career) {
                <div class="wide">
                  <dt class="mono">Trayectoria</dt>
                  <dd>{{ r.career }}</dd>
                </div>
              }
            </dl>
            <h2 class="mono sub">Paradas confirmadas</h2>
            <ul class="races">
              @for (id of r.races; track id) {
                @let race = data.race(id);
                @if (race) {
                  <li>
                    <a [routerLink]="['/carreras', race.id]">
                      <span class="display">P{{ race.num }}</span>
                      <b>{{ race.title }}</b>
                      <span class="mono">{{ race.dshort }}</span>
                    </a>
                  </li>
                }
              }
            </ul>
            <p class="note">Perfil de ejemplo.</p>
          </div>
        </div>
      </section>
      <section class="section more">
        <div class="container">
          <h2 class="display display-m">Más corredores</h2>
          <div class="grid grid-4">
            @for (o of others(); track o.id) {
              <app-rider-card [rider]="o" />
            }
          </div>
        </div>
      </section>
    } @else {
      <section class="profile">
        <div class="container">
          <h1 class="display display-l">Corredor no encontrado</h1>
          <a routerLink="/corredores" class="btn">Ver corredores</a>
        </div>
      </section>
    }
  `,
  styles: `
    .profile {
      padding: calc(var(--header-h) + 48px) 0 64px;
    }
    .grid2 {
      display: grid;
      grid-template-columns: minmax(0, 0.8fr) 1fr;
      gap: clamp(28px, 5vw, 64px);
      align-items: start;
    }
    .info {
      display: grid;
      gap: 14px;
      justify-items: start;
    }
    .back {
      text-decoration: none;
      color: var(--muted);
    }
    dl {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1px;
      width: 100%;
      margin: 8px 0;
      background: var(--line);
      border: 1px solid var(--line);
    }
    dl div {
      background: var(--ink-2);
      padding: 14px;
    }
    .wide {
      grid-column: 1 / -1;
    }
    dt {
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
    }
    dd {
      margin: 4px 0 0;
    }
    dd.display {
      font-size: 40px;
    }
    .sub {
      color: var(--muted);
      text-transform: uppercase;
    }
    .races {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
      width: 100%;
    }
    .races a {
      display: grid;
      grid-template-columns: 64px 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--ink-2);
      border: 1px solid var(--line);
      border-radius: 4px;
      text-decoration: none;
    }
    .races a:hover {
      border-color: var(--signal);
    }
    .races .display {
      font-size: 28px;
      color: var(--signal);
    }
    .more {
      background: var(--ink-2);
      border-top: 1px solid var(--line);
    }
    .more h2 {
      margin-bottom: 24px;
    }
    @media (max-width: 760px) {
      .grid2 {
        grid-template-columns: 1fr;
      }
      app-rider-avatar {
        max-width: 320px;
      }
    }
  `,
})
export default class RiderPage {
  readonly id = input.required<string>();
  protected data = inject(DataService);
  private seo = inject(Seo);
  protected rider = computed(() => this.data.rider(this.id()));
  protected others = computed(() => this.data.riders().filter((r) => r.id !== this.id()).slice(0, 4));
  constructor() {
    effect(() => {
      const r = this.rider();
      if (r) this.seo.set(r.name, `${r.name} (${r.country}), rider invitado de Downtown. ${r.desc}`);
    });
  }
}
