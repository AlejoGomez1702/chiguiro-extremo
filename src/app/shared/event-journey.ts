import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { ModuleKey, Race, SiteEvent } from '../core/data/models';
import { SmoothScroll } from '../core/smooth-scroll.service';
import { DescentCanvas } from '../three/descent-canvas';
import { NAMED_SECTIONS, SECTION, TRACK_LENGTH, altitude, groundProfile } from '../three/world/track-profile';
import { Pbtn } from './pbtn';
import { ProductArt } from './product-art';
import { RiderAvatar } from './rider-card';

type ChapterKey = 'trazado' | 'paradas' | 'corredores' | 'dia' | 'cobertura' | 'tienda' | 'meta';

/** Puntos de la pista donde la cámara se detiene a leer un capítulo intermedio. */
const STOPS = [250, 470, SECTION.kicker[0] - 4, (SECTION.curve[0] + SECTION.curve[1]) / 2, SECTION.drop - 2, (SECTION.stairs[0] + SECTION.stairs[1]) / 2];
const END_S = SECTION.finish + 42;

/**
 * Recorrido 3D de un evento: la escena queda fija y el scroll baja la pista;
 * cada sección activa del evento es un capítulo anclado a un punto del trazado.
 */
@Component({
  selector: 'app-event-journey',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DescentCanvas, Pbtn, ProductArt, RiderAvatar],
  template: `
    <section class="journey" #journey id="recorrido" [attr.aria-label]="'Recorrido 3D por la pista de ' + race().short">
      <div class="stage">
        <app-descent-canvas [target]="s()" />
        <div class="shade"></div>

        <!-- telemetría -->
        <div class="hud" aria-hidden="true">
          <div class="readout">
            <span><small>Sección</small><b>{{ section() }}</b></span>
            <span><small>Distancia</small><b>{{ km() }} km</b></span>
            <span><small>Altitud</small><b>{{ alt() }} m</b></span>
          </div>
          <svg viewBox="0 -2 200 52" class="profile" preserveAspectRatio="none">
            <path [attr.d]="profilePath + ' L200,48 L0,48 Z'" class="area" />
            <path [attr.d]="profilePath" class="line" />
            @for (m of sectionMarks; track m.s) {
              <line [attr.x1]="m.x" [attr.x2]="m.x" y1="0" y2="48" class="tick" />
            }
            <circle [attr.cx]="marker().x" [attr.cy]="marker().y" r="2.6" class="dot" />
          </svg>
        </div>
      </div>

      @for (c of chapters(); track c; let i = $index) {
        <div class="chapter" [class.first]="$first" [class.right]="!$first && i % 2 === 1" [class.wide]="c === 'corredores'" [class.finish]="c === 'meta'">
          <div class="container">
            @switch (c) {
              @case ('trazado') {
                <div class="panel glass">
                  <h2 class="display display-m">En {{ race().short }} la pista no se construye: se descubre.</h2>
                  <dl class="facts">
                    @for (f of race().facts; track f.k) {
                      <div>
                        <dd>{{ f.v }}</dd>
                        <dt>{{ f.k }}</dt>
                      </div>
                    }
                  </dl>
                  <p class="note">{{ race().factsNote }}</p>
                  <app-pbtn icon="arrow-down" iconTone="signal" label="Bajar la pista" state="Desliza" stateTone="energy" [action]="true" (press)="go(1)" />
                </div>
              }
              @case ('paradas') {
                <div class="panel glass">
                  <h2 class="display display-l">{{ stopsTitle() }}</h2>
                  <p class="lead">{{ event().summary }}</p>
                  <ol class="season">
                    @for (r of races(); track r.id) {
                      <li>
                        <a [routerLink]="['/carreras', r.id]">
                          <span class="n mono">{{ r.num }}</span>
                          <span class="who">
                            <b>{{ r.title }}</b>
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
              }
              @case ('corredores') {
                <div class="panel glass">
                  <div class="panel-head">
                    <h2 class="display display-l">Riders invitados</h2>
                    <a class="link-arrow" routerLink="/corredores">Ver los {{ riderCount() }} riders</a>
                  </div>
                  <ul class="riders">
                    @for (r of riders(); track r.id) {
                      <li>
                        <a [routerLink]="['/corredores', r.id]">
                          <app-rider-avatar [rider]="r" />
                          <b>{{ r.name }}</b>
                          <small>{{ r.country }}</small>
                        </a>
                      </li>
                    }
                  </ul>
                </div>
              }
              @case ('dia') {
                <div class="panel glass">
                  <h2 class="display display-l">Vívela desde la baranda</h2>
                  <p class="lead">Entrada libre a las zonas de público. La A para ver los saltos, la B para ir en familia.</p>
                  <ul class="schedule">
                    @for (sl of raceDay.slots; track sl.t) {
                      <li [class.now]="sl.now">
                        <span class="mono t">{{ sl.t }}</span>
                        <span>
                          <b>{{ sl.title }}</b>
                          <small>{{ sl.place }}</small>
                        </span>
                        @if (sl.now) {
                          <span class="tag">En vivo</span>
                        }
                      </li>
                    }
                  </ul>
                  <p class="note">{{ raceDay.day }}. Horarios ilustrativos.</p>
                </div>
              }
              @case ('cobertura') {
                <div class="panel glass">
                  <h2 class="display display-l">Cobertura</h2>
                  <ul class="news">
                    @for (p of posts(); track p.id) {
                      <li>
                        <a [routerLink]="['/cobertura', p.id]">
                          <img [src]="p.img" alt="" loading="lazy" [style.object-position]="p.pos ?? 'center'" />
                          <span>
                            <small>{{ p.date }} · {{ data.raceName(p.race) }}</small>
                            <b>{{ p.title }}</b>
                          </span>
                        </a>
                      </li>
                    }
                  </ul>
                  <a class="link-arrow" routerLink="/cobertura">Toda la cobertura</a>
                </div>
              }
              @case ('tienda') {
                <div class="panel glass">
                  <h2 class="display display-l">Tienda oficial</h2>
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
                  <a class="link-arrow" routerLink="/tienda">Ver la tienda</a>
                </div>
              }
              @case ('meta') {
                <div class="panel finish-panel">
                  <h2 class="display display-xl">Nos vemos<br />en la meta</h2>
                  <p class="lead">{{ race().insc }}. Premiación, tienda oficial y entrega de kits en la fan zone.</p>
                  <div class="ctas">
                    <app-pbtn icon="arrow-right" label="Inscripción y horarios" [state]="race().short" [link]="['/carreras', race().id]" />
                    <app-pbtn icon="arrow-right" iconTone="highlight" label="Explorar el trazado" state="3D" stateTone="energy" [link]="['/carreras', race().id]" fragment="trazado" />
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .journey {
      position: relative;
    }
    .stage {
      position: sticky;
      top: 0;
      height: 100vh;
      height: 100svh;
      overflow: hidden;
    }
    /* degradados para legibilidad del texto sobre la escena */
    .shade {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--dt-ink) 55%, transparent) 0%, transparent 18%),
        linear-gradient(0deg, color-mix(in srgb, var(--dt-ink) 60%, transparent) 0%, transparent 30%);
    }

    .hud {
      position: absolute;
      right: var(--gutter);
      bottom: 22px;
      width: min(300px, 46vw);
      display: grid;
      gap: 6px;
      pointer-events: none;
      color: var(--color-text);
    }
    .readout {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      span {
        display: grid;
      }
      small {
        font: var(--type-caption);
        color: var(--dt-gray-200);
      }
      b {
        font: 500 14px/20px var(--font-data);
        white-space: nowrap;
      }
    }
    .profile {
      width: 100%;
      height: 46px;
      overflow: visible;
      .area {
        fill: color-mix(in srgb, var(--dt-gray-50) 12%, transparent);
      }
      .line {
        fill: none;
        stroke: var(--dt-gray-50);
        stroke-width: 1.2;
        vector-effect: non-scaling-stroke;
      }
      .tick {
        stroke: color-mix(in srgb, var(--dt-gray-50) 25%, transparent);
        stroke-dasharray: 2 3;
        vector-effect: non-scaling-stroke;
      }
      .dot {
        fill: var(--color-accent);
        stroke: var(--dt-ink);
        stroke-width: 1;
      }
    }

    /* capítulos superpuestos a la escena fija */
    .chapter {
      position: relative;
      z-index: 2;
      min-height: 135vh;
      display: flex;
      align-items: center;
      pointer-events: none;
      > .container {
        width: 100%;
      }
    }
    .chapter.first {
      margin-top: -100vh;
      margin-top: -100svh;
      min-height: 100vh;
      min-height: 100svh;
      align-items: flex-end;
      padding-bottom: clamp(72px, 10vh, 130px);
    }
    .panel {
      pointer-events: auto;
      padding: clamp(22px, 3vw, 36px);
      max-width: 540px;
      display: grid;
      gap: var(--space-m);
      opacity: 0;
      transform: translateY(40px);
      transition:
        opacity 0.8s var(--ease),
        transform 0.8s var(--ease);
      &.in {
        opacity: 1;
        transform: none;
      }
    }
    .right .panel {
      margin-left: auto;
    }
    /* deja ver la pista a un lado */
    .wide .panel {
      max-width: 860px;
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: var(--space-m);
      flex-wrap: wrap;
    }
    small {
      font: var(--type-body-s);
      color: var(--color-text-muted);
    }

    /* datos técnicos */
    .facts {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-s) var(--space-l);
      margin: 0;
      div {
        padding-top: var(--space-xs);
        border-top: 1px solid var(--color-border-strong);
      }
      dd {
        margin: 0;
        font: var(--type-metric-m);
        font-size: 32px;
        line-height: 1.2;
      }
      dt {
        font: var(--type-body-s);
        color: var(--color-text-muted);
      }
    }

    /* paradas */
    .season {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      border-top: 1px solid var(--color-border-strong);
      a {
        display: grid;
        grid-template-columns: 32px 1fr auto;
        align-items: center;
        gap: var(--space-s);
        padding: var(--space-s) var(--space-xs);
        text-decoration: none;
        border-bottom: 1px solid var(--color-border-strong);
        transition:
          background 0.2s,
          color 0.2s;
      }
      a:hover,
      a:focus-visible {
        background: var(--brand-energy-pastel);
        color: var(--on-pastel);
        small,
        .n {
          color: inherit;
        }
      }
      .n {
        color: var(--color-text-subtle);
      }
      .who,
      .when {
        display: grid;
      }
      .who b {
        font: var(--type-h3);
        letter-spacing: -0.02em;
      }
      .when {
        justify-items: end;
        b {
          font-weight: 500;
        }
      }
    }

    /* riders */
    .riders {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-m);
      a {
        display: grid;
        gap: var(--space-xxs);
        text-decoration: none;
      }
      b {
        font: var(--type-body-l);
        letter-spacing: -0.02em;
        margin-top: var(--space-xs);
      }
      app-rider-avatar {
        transition: transform 0.4s var(--ease);
      }
      a:hover app-rider-avatar {
        transform: translateY(-4px);
      }
    }

    /* horario */
    .schedule {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      li {
        display: grid;
        grid-template-columns: 56px 1fr auto;
        gap: var(--space-s);
        align-items: center;
        padding: 10px 0;
        border-top: 1px solid var(--color-border-strong);
      }
      .t {
        color: var(--color-text-muted);
      }
      .now .t {
        color: var(--color-accent);
      }
      span {
        display: grid;
      }
    }

    /* cobertura */
    .news {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: var(--space-s);
      a {
        display: grid;
        grid-template-columns: 96px 1fr;
        gap: var(--space-m);
        align-items: center;
        text-decoration: none;
      }
      img {
        width: 96px;
        height: 64px;
        object-fit: cover;
      }
      span {
        display: grid;
        gap: 2px;
      }
      small {
        font: var(--type-caption);
        color: var(--color-text-muted);
      }
      b {
        font-weight: 500;
        line-height: 1.25;
      }
      a:hover b {
        color: var(--color-accent);
      }
    }

    /* tienda */
    .shop {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-s);
      a {
        display: grid;
        gap: 6px;
        text-decoration: none;
      }
      b {
        font: var(--type-body-s);
        font-weight: 500;
      }
      .mono {
        color: var(--color-text-muted);
      }
    }
    .link-arrow {
      justify-self: start;
    }

    /* meta */
    .finish {
      min-height: 150vh;
      align-items: flex-end;
      padding-bottom: 18vh;
    }
    .finish-panel {
      max-width: 860px;
      padding: 0;
      text-shadow: 0 2px 30px rgba(0, 0, 0, 0.4);
      h2 {
        font-size: clamp(56px, 10vw, 150px);
      }
      .lead {
        color: var(--color-text);
      }
    }
    .ctas {
      display: flex;
      gap: var(--space-xs);
      flex-wrap: wrap;
      text-shadow: none;
    }

    @media (max-width: 860px) {
      .chapter {
        min-height: 120vh;
        align-items: flex-end;
        padding-bottom: 12vh;
      }
      .panel {
        max-width: none;
      }
      .riders {
        grid-template-columns: repeat(2, 1fr);
      }
      .hud {
        top: calc(var(--header-h) + 8px);
        bottom: auto;
        width: auto;
        left: var(--gutter);
        .profile {
          display: none;
        }
      }
    }
  `,
})
export class EventJourney {
  readonly event = input.required<SiteEvent>();
  /** parada cuyo trazado se recorre */
  readonly race = input.required<Race>();
  /** secciones activas del evento, en su orden */
  readonly modules = input<ModuleKey[]>([]);

  protected data = inject(DataService);
  private scroll = inject(SmoothScroll);
  private journey = viewChild.required<ElementRef<HTMLElement>>('journey');
  protected raceDay = this.data.schedule[1];

  protected races = computed(() => this.data.racesOf(this.event().id));
  private eventRiders = computed(() => this.data.ridersOf(this.event().id));
  protected riderCount = computed(() => this.eventRiders().length);
  protected riders = computed(() => this.eventRiders().slice(0, 4));
  protected posts = computed(() => this.data.postsOf(this.event().id).slice(0, 3));
  protected products = computed(() => this.data.productsOf(this.event().id).slice(0, 3));
  protected stopsTitle = computed(() => {
    const n = this.races().length;
    const words = ['', 'Una ciudad', 'Dos ciudades', 'Tres ciudades', 'Cuatro ciudades', 'Cinco ciudades'];
    return n === 1 ? 'Una ciudad, una bajada' : `${words[n] ?? n + ' ciudades'}, una serie`;
  });

  /** capítulos: abre el trazado, siguen las secciones activas con contenido y cierra la meta */
  protected chapters = computed<ChapterKey[]>(() => {
    const has: Partial<Record<ModuleKey, boolean>> = {
      paradas: this.races().length > 0,
      corredores: this.riders().length > 0,
      cobertura: this.posts().length > 0,
      tienda: this.products().length > 0,
    };
    const mid: ChapterKey[] = [];
    for (const m of this.modules()) {
      if (!has[m]) continue;
      mid.push(m as ChapterKey);
      if (m === 'paradas') mid.push('dia');
    }
    return ['trazado', ...mid, 'meta'];
  });
  /** distancia de pista en la que se lee cada capítulo */
  private anchors = computed(() => {
    const n = this.chapters().length - 2;
    const mid = Array.from({ length: n }, (_, i) => STOPS[n === 1 ? 2 : Math.round((i * (STOPS.length - 1)) / (n - 1))]);
    return [0, ...mid, SECTION.finish - 2];
  });

  /** medidas del recorrido (px) para mapear scroll → distancia */
  private top = signal(0);
  private chapterTops = signal<number[]>([]);
  private total = signal(1);

  protected s = computed(() => {
    const y = this.scroll.y() - this.top();
    const tops = this.chapterTops();
    const anchors = this.anchors();
    if (!tops.length || tops.length !== anchors.length) return 0;
    const pts = [...tops.map((t, i) => [t, anchors[i]] as const), [this.total(), END_S] as const];
    if (y <= pts[0][0]) return anchors[0];
    for (let i = 0; i < pts.length - 1; i++) {
      const [y0, s0] = pts[i];
      const [y1, s1] = pts[i + 1];
      if (y <= y1) {
        const x = (y - y0) / Math.max(1, y1 - y0);
        // se detiene mientras el capítulo se lee y viaja entre capítulos
        const e = x < 0.2 ? 0 : x > 0.9 ? 1 : (x - 0.2) / 0.7;
        return s0 + (s1 - s0) * (e * e * (3 - 2 * e));
      }
    }
    return END_S;
  });

  protected section = computed(() => {
    const s = this.s();
    return [...NAMED_SECTIONS].reverse().find((n) => s >= n.s - 8)?.label ?? 'Salida';
  });
  protected km = computed(() => (Math.min(this.s(), TRACK_LENGTH) / 1000).toFixed(2).replace('.', ','));
  protected alt = computed(() => Math.round(altitude(Math.min(this.s(), TRACK_LENGTH))).toLocaleString('es-CO'));

  /** altimetría de la pista para el HUD */
  protected profilePath = (() => {
    const pts: string[] = [];
    const max = groundProfile(0);
    const min = groundProfile(TRACK_LENGTH);
    for (let s = 0; s <= TRACK_LENGTH; s += 6) {
      const x = (s / TRACK_LENGTH) * 200;
      const y = 4 + ((max - groundProfile(s)) / (max - min)) * 40;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return 'M' + pts.join(' L');
  })();
  protected marker = computed(() => {
    const s = Math.min(this.s(), TRACK_LENGTH);
    const max = groundProfile(0);
    const min = groundProfile(TRACK_LENGTH);
    return { x: (s / TRACK_LENGTH) * 200, y: 4 + ((max - groundProfile(s)) / (max - min)) * 40 };
  });
  protected sectionMarks = NAMED_SECTIONS.map((n) => ({ ...n, x: (n.s / TRACK_LENGTH) * 200 }));

  constructor() {
    // Se vuelve a enganchar cada vez que cambian el nodo o los capítulos, para
    // que las medidas nunca queden atadas a un DOM que ya no está en pantalla.
    afterRenderEffect((onCleanup) => {
      const el = this.journey().nativeElement;
      this.chapters();
      const measure = () => {
        this.top.set(el.getBoundingClientRect().top + scrollY);
        const chapters = [...el.querySelectorAll<HTMLElement>('.chapter')];
        this.chapterTops.set(chapters.map((c, i) => (i === 0 ? 0 : c.offsetTop + c.offsetHeight / 2 - innerHeight / 2)));
        this.total.set(el.offsetHeight - innerHeight);
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      ro.observe(document.body);
      addEventListener('resize', measure);

      // aparición de paneles
      const io = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('in', e.isIntersecting)), { threshold: 0.15 });
      el.querySelectorAll('.panel').forEach((p) => io.observe(p));
      onCleanup(() => {
        ro.disconnect();
        io.disconnect();
        removeEventListener('resize', measure);
      });
    });
  }

  /** lleva el scroll al capítulo indicado */
  protected go(chapter: number) {
    const y = this.top() + (this.chapterTops()[chapter] ?? 0);
    this.scroll.scrollTo(y + 72);
    if (!(window as { __lenis?: unknown }).__lenis) window.scrollTo({ top: y, behavior: 'smooth' });
  }
}
