import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { ModuleKey, SiteEvent } from '../core/data/models';
import { SmoothScroll } from '../core/smooth-scroll.service';
import { EventCover } from './event-cover';
import { EventJourney } from './event-journey';
import { Pbtn } from './pbtn';
import { PostCard } from './post-card';
import { ProductArt } from './product-art';
import { RiderAvatar } from './rider-card';

const ALLIES = ['Alcaldía de Manizales', 'Marca de ejemplo', 'Bicicletas de ejemplo', 'Cascos de ejemplo', 'Energía de ejemplo', 'Medios aliados'];

/**
 * Página de un evento: portada + las secciones que el organizador activó, en
 * el orden que eligió en el panel. La usan el inicio (evento principal) y
 * /eventos/:id.
 */
@Component({
  selector: 'app-event-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EventCover, EventJourney, Pbtn, PostCard, ProductArt, RiderAvatar],
  template: `
    <app-event-cover [event]="event()" [races]="races()" (explore)="explore()" />

    <div class="start" id="evento"></div>
    @if (!modules().length || !hasContent()) {
      <section class="section">
        <div class="container intro">
          <h2 class="display display-l">{{ event().name }}</h2>
          <p class="lead">{{ event().summary }}</p>
          <p class="note">{{ event().dateLabel }}. {{ event().place }}.</p>
        </div>
      </section>
    }

    @if (journey(); as r) {
      <app-event-journey [event]="event()" [race]="r" [modules]="modules()" />
    }

    @for (m of flat(); track m) {
      @switch (m) {
        @case ('paradas') {
          @if (races().length) {
            <section class="section" id="paradas" aria-labelledby="st-t">
              <div class="container split">
                <div class="head">
                  <h2 id="st-t" class="display display-l">{{ stopsTitle() }}</h2>
                  <p class="lead">{{ event().summary }}</p>
                </div>
                <ol class="stops">
                  @for (r of races(); track r.id) {
                    <li>
                      <a [routerLink]="['/carreras', r.id]">
                        <span class="n mono">{{ r.num }}</span>
                        <span class="city">
                          <b class="display display-m">{{ r.title }}</b>
                          <small>{{ r.place }}</small>
                        </span>
                        <span class="when">
                          <b class="mono">{{ r.dshort }}</b>
                          <small>{{ r.statusLabel }}</small>
                        </span>
                      </a>
                    </li>
                  }
                </ol>
              </div>
            </section>
          }
        }
        @case ('trazado') {
          @if (track(); as r) {
            <section class="track" aria-labelledby="tk-t">
              <div class="container track-in">
                <img class="pic" src="/assets/brand/icons/escaleras.svg" alt="" />
                <div class="copy">
                  <h2 id="tk-t" class="display display-l">En {{ r.short }} la pista no se construye: se descubre.</h2>
                  <app-pbtn icon="arrow-right" label="Bajar la pista" state="Trazado 3D" [link]="['/carreras', r.id]" fragment="trazado" />
                </div>
                <dl class="facts">
                  @for (f of r.facts; track f.k) {
                    <div>
                      <dd>{{ f.v }}</dd>
                      <dt>{{ f.k }}</dt>
                    </div>
                  }
                </dl>
              </div>
            </section>
          }
        }
        @case ('corredores') {
          @if (riders().length) {
            <section class="section" aria-labelledby="rd-t">
              <div class="container">
                <div class="row-head">
                  <h2 id="rd-t" class="display display-l">Riders invitados</h2>
                  <a class="link-arrow" routerLink="/corredores">Ver los {{ allRiders() }} riders</a>
                </div>
                <ul class="riders">
                  @for (r of riders(); track r.id) {
                    <li>
                      <a [routerLink]="['/corredores', r.id]">
                        <app-rider-avatar [rider]="r" />
                        <b>{{ r.name }}</b>
                        <small>{{ r.country }} · {{ r.category }}</small>
                      </a>
                    </li>
                  }
                </ul>
              </div>
            </section>
          }
        }
        @case ('cobertura') {
          @if (posts().length) {
            <section class="section section-light" aria-labelledby="cv-t">
              <div class="container">
                <div class="row-head">
                  <h2 id="cv-t" class="display display-l">Cobertura</h2>
                  <a class="link-arrow" routerLink="/cobertura">Toda la cobertura</a>
                </div>
                <div class="grid grid-3">
                  @for (p of posts(); track p.id) {
                    <app-post-card [post]="p" />
                  }
                </div>
              </div>
            </section>
          }
        }
        @case ('tienda') {
          @if (products().length) {
            <section class="section" aria-labelledby="sh-t">
              <div class="container">
                <div class="row-head">
                  <h2 id="sh-t" class="display display-l">Tienda oficial</h2>
                  <a class="link-arrow" routerLink="/tienda">Ver la tienda</a>
                </div>
                <ul class="shop">
                  @for (p of products(); track p.id) {
                    <li>
                      <a [routerLink]="['/tienda', p.id]">
                        <app-product-art [product]="p" />
                        <b>{{ p.name }}</b>
                        <span class="mono">{{ p.price }} USD</span>
                      </a>
                    </li>
                  }
                </ul>
              </div>
            </section>
          }
        }
        @case ('aliados') {
          <section class="section allies" aria-labelledby="al-t">
            <div class="container">
              <h2 id="al-t" class="display display-m">Las ciudades y marcas que lo hacen posible</h2>
              <ul>
                @for (a of allies; track a) {
                  <li>{{ a }}</li>
                }
              </ul>
              <p class="note">Logos pendientes: se publican cuando los aliados confirmen.</p>
            </div>
          </section>
        }
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .start {
      scroll-margin-top: var(--header-h);
    }
    .intro {
      display: grid;
      gap: var(--space-m);
    }
    .split {
      display: grid;
      grid-template-columns: 5fr 7fr;
      gap: clamp(32px, 6vw, 96px);
      align-items: start;
    }
    .head {
      display: grid;
      gap: var(--space-l);
      position: sticky;
      top: calc(var(--header-h) + var(--space-xl));
    }
    .row-head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: var(--space-m);
      flex-wrap: wrap;
      margin-bottom: var(--space-xxl);
    }

    /* paradas: filas que se llenan de color al entrar */
    .stops {
      list-style: none;
      margin: 0;
      padding: 0;
      border-top: 1px solid var(--color-border-strong);
    }
    .stops a {
      display: grid;
      grid-template-columns: 56px 1fr auto;
      align-items: center;
      gap: var(--space-m);
      padding: var(--space-l) var(--space-m);
      text-decoration: none;
      border-bottom: 1px solid var(--color-border-strong);
      transition:
        background 0.2s,
        color 0.2s;
    }
    .stops li:nth-child(3n + 1) a {
      --row: var(--brand-energy-pastel);
    }
    .stops li:nth-child(3n + 2) a {
      --row: var(--brand-primary-pastel);
    }
    .stops li:nth-child(3n) a {
      --row: var(--brand-signal-pastel);
    }
    .stops a:hover,
    .stops a:focus-visible {
      background: var(--row);
      color: var(--on-pastel);
      small {
        color: inherit;
      }
    }
    .n {
      font-size: 14px;
      color: var(--color-text-subtle);
    }
    .stops a:hover .n {
      color: inherit;
    }
    .city,
    .when {
      display: grid;
      gap: 2px;
    }
    .when {
      justify-items: end;
      text-align: right;
    }
    .when b {
      font-weight: 500;
      font-size: 14px;
    }
    small {
      color: var(--color-text-muted);
      font: var(--type-body-s);
    }

    /* trazado: bloque de color primario */
    .track {
      background: var(--brand-primary);
      color: var(--on-brand-primary);
      padding-block: clamp(56px, 8vw, 112px);
    }
    .track-in {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: clamp(24px, 4vw, 64px);
      align-items: start;
    }
    .pic {
      width: clamp(56px, 7vw, 104px);
      padding: 14%;
      box-sizing: content-box;
      background: var(--brand-signal-pastel);
    }
    .copy {
      display: grid;
      gap: var(--space-xl);
      justify-items: start;
      max-width: 22ch;
      font-size: clamp(40px, 5.4vw, 64px);
    }
    .copy h2 {
      max-width: 16ch;
    }
    .facts {
      margin: 0;
      display: grid;
      gap: var(--space-m);
      min-width: 180px;
    }
    .facts div {
      padding-top: var(--space-xs);
      border-top: 1px solid color-mix(in srgb, currentColor 35%, transparent);
    }
    .facts dd {
      margin: 0;
      font: var(--type-metric-m);
      font-size: clamp(28px, 3vw, 40px);
      line-height: 1.15;
    }
    .facts dt {
      font: var(--type-body-s);
      opacity: 0.8;
    }

    .riders,
    .shop {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: var(--space-l);
    }
    .riders {
      grid-template-columns: repeat(4, 1fr);
    }
    .shop {
      grid-template-columns: repeat(3, 1fr);
    }
    .riders a,
    .shop a {
      display: grid;
      gap: var(--space-xs);
      text-decoration: none;
    }
    .riders b,
    .shop b {
      font: var(--type-body-l);
      letter-spacing: -0.02em;
      margin-top: var(--space-xs);
    }
    .shop .mono {
      color: var(--color-text-muted);
    }
    .riders a:hover b,
    .shop a:hover b {
      color: var(--color-accent);
    }

    .allies {
      border-top: 1px solid var(--color-border);
    }
    .allies ul {
      list-style: none;
      margin: var(--space-xl) 0 var(--space-m);
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 1px;
      background: var(--color-border);
      border: 1px solid var(--color-border);
    }
    .allies li {
      display: grid;
      place-items: center;
      min-height: 96px;
      padding: var(--space-s);
      text-align: center;
      background: var(--color-surface);
      color: var(--color-text-muted);
      font: var(--type-body-s);
    }

    @media (max-width: 900px) {
      .split {
        grid-template-columns: 1fr;
      }
      .head {
        position: static;
      }
      .track-in {
        grid-template-columns: 1fr;
      }
      .facts {
        grid-template-columns: 1fr 1fr;
      }
      .riders {
        grid-template-columns: repeat(2, 1fr);
      }
      .shop {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 520px) {
      .stops a {
        grid-template-columns: 32px 1fr;
      }
      .when {
        grid-column: 2;
        justify-items: start;
        text-align: left;
      }
    }
  `,
})
export class EventView {
  readonly event = input.required<SiteEvent>();
  private data = inject(DataService);
  private scroll = inject(SmoothScroll);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected allies = ALLIES;

  protected races = computed(() => this.data.racesOf(this.event().id));
  protected modules = computed<ModuleKey[]>(() => this.event().modules.filter((m) => m.on).map((m) => m.key));
  protected track = computed(() => this.races().find((r) => r.hasMap) ?? null);
  /** con trazado 3D activo, las secciones se leen bajando la pista */
  protected journey = computed(() => (this.modules().includes('trazado') ? this.track() : null));
  protected flat = computed<ModuleKey[]>(() => (this.journey() ? this.modules().filter((m) => m === 'aliados') : this.modules()));
  private eventRiders = computed(() => this.data.ridersOf(this.event().id));
  protected allRiders = computed(() => this.eventRiders().length);
  protected riders = computed(() => this.eventRiders().slice(0, 4));
  protected posts = computed(() => this.data.postsOf(this.event().id).slice(0, 3));
  protected products = computed(() => this.data.productsOf(this.event().id).slice(0, 3));
  protected hasContent = computed(() => this.races().length > 0 || this.posts().length > 0);
  protected stopsTitle = computed(() => {
    const n = this.races().length;
    const words = ['', 'Una ciudad', 'Dos ciudades', 'Tres ciudades', 'Cuatro ciudades', 'Cinco ciudades'];
    return n === 1 ? 'Una ciudad, una bajada' : `${words[n] ?? n + ' ciudades'}, una serie`;
  });

  protected explore() {
    const target = this.host.nativeElement.querySelector<HTMLElement>('#recorrido, #paradas, #evento');
    if (!target) return;
    const y = target.getBoundingClientRect().top + scrollY;
    this.scroll.scrollTo(y);
    if (!(window as { __lenis?: unknown }).__lenis) window.scrollTo({ top: y - 64, behavior: 'smooth' });
  }
}
