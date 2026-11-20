import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { EventCover as CoverData, ModuleKey, SiteEvent } from '../core/data/models';
import { BrandId, DEFAULT_THEME, EventTheme, PRESETS, Palette, ROLES, Role, TRAILS, contrast, coverColors, resolvePalette } from '../core/theme/brand';
import { EventCover } from '../shared/event-cover';

const MODULE_LABEL: Record<ModuleKey, { label: string; hint: string }> = {
  paradas: { label: 'Paradas', hint: 'Lista de ciudades y fechas' },
  trazado: { label: 'Recorrido 3D', hint: 'Las secciones se leen bajando la pista con el scroll' },
  corredores: { label: 'Riders', hint: 'Cuatro riders invitados' },
  cobertura: { label: 'Cobertura', hint: 'Últimas tres publicaciones' },
  tienda: { label: 'Tienda', hint: 'Tres productos del evento' },
  aliados: { label: 'Aliados', hint: 'Ciudades y marcas' },
};
const FRAME = { desktop: [1440, 810], mobile: [390, 764] } as const;

/** Personalización de un evento: portada, marca y secciones, con vista previa en vivo. */
@Component({
  selector: 'app-admin-event-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, EventCover],
  template: `
    @if (draft(); as e) {
      <header class="adm-head">
        <div>
          <a class="back" routerLink="/admin/eventos">Eventos</a>
          <h1 class="display display-m">Personalizar {{ e.name }}</h1>
          <p>Los cambios se ven en la vista previa al instante y llegan al sitio cuando guardas.</p>
        </div>
        <div class="head-actions">
          @if (e.status !== 'borrador') {
            <a class="adm-btn" [routerLink]="['/eventos', e.id]">Ver en el sitio</a>
          }
          <button type="button" class="btn btn-sm btn-ghost" [disabled]="!dirty()" (click)="discard()">Descartar</button>
          <button type="button" class="btn btn-sm" [disabled]="!dirty()" (click)="save()">Guardar cambios</button>
        </div>
      </header>
      @if (saved() && !dirty()) {
        <p class="ok" role="status">Cambios guardados.</p>
      }

      <div class="layout">
        <div class="controls">
          <section class="adm-card" aria-labelledby="c-cover">
            <h2 id="c-cover">Portada</h2>
            <div class="adm-grid">
              <label class="adm-fld"><span>Titular, línea 1</span><input [ngModel]="e.cover.line1" (ngModelChange)="cover({ line1: $event })" maxlength="14" /></label>
              <label class="adm-fld"><span>Titular, línea 2</span><input [ngModel]="e.cover.line2" (ngModelChange)="cover({ line2: $event })" maxlength="14" /></label>
              <label class="adm-fld"><span>Texto inferior izquierdo</span><input [ngModel]="e.cover.kickerLeft" (ngModelChange)="cover({ kickerLeft: $event })" /></label>
              <label class="adm-fld"><span>Texto inferior derecho</span><input [ngModel]="e.cover.kickerRight" (ngModelChange)="cover({ kickerRight: $event })" /></label>
            </div>
            <label class="adm-chk gap"><input type="checkbox" [ngModel]="e.cover.arrow" (ngModelChange)="cover({ arrow: $event })" /> Flecha de descenso junto al titular</label>
            <p class="note">El titular se ajusta solo al ancho: cuanto más corto, más grande.</p>
          </section>

          <section class="adm-card" aria-labelledby="c-brand">
            <h2 id="c-brand">Colores</h2>
            <fieldset>
              <legend class="adm-legend">Paleta</legend>
              <div class="presets">
                @for (p of presets; track p.id) {
                  <label class="preset" [class.on]="e.theme.brand === p.id">
                    <input type="radio" name="brand" [checked]="e.theme.brand === p.id" (change)="brand(p.id)" />
                    <span>{{ p.label }}</span>
                    <span class="chips">
                      @for (r of roles; track r.id) {
                        <i [style.background]="p.colors[r.id]"></i>
                      }
                    </span>
                  </label>
                }
                <label class="preset" [class.on]="e.theme.brand === 'custom'">
                  <input type="radio" name="brand" [checked]="e.theme.brand === 'custom'" (change)="brand('custom')" />
                  <span>Propia</span>
                  <span class="chips">
                    @for (r of roles; track r.id) {
                      <i [style.background]="palette().colors[r.id]"></i>
                    }
                  </span>
                </label>
              </div>
            </fieldset>

            @if (e.theme.brand === 'custom') {
              <div class="adm-grid colors">
                @for (r of roles; track r.id) {
                  <label class="adm-fld">
                    <span>{{ r.label }}</span>
                    <input type="color" [ngModel]="palette().colors[r.id]" (ngModelChange)="color(r.id, $event)" />
                  </label>
                }
              </div>
              <p class="note">Los tonos pastel se calculan solos (35 % del color + 65 % de blanco) y el texto sobre cada color cambia a tinta o blanco según cuál se lea mejor.</p>
            }

            <div class="adm-grid">
              <label class="adm-fld">
                <span>Color de fondo</span>
                <select [ngModel]="e.theme.surface" (ngModelChange)="theme({ surface: $event })">
                  @for (r of roles; track r.id) {
                    <option [value]="r.id">{{ r.label }}</option>
                  }
                </select>
              </label>
              <label class="adm-fld">
                <span>Intensidad</span>
                <select [ngModel]="e.theme.treatment" (ngModelChange)="theme({ treatment: $event })">
                  <option value="intense">Intensa: fondo saturado, bloques pastel</option>
                  <option value="pastel">Pastel: fondo suave, bloques saturados</option>
                </select>
              </label>
              <label class="adm-fld">
                <span>Titular</span>
                <select [ngModel]="e.theme.title" (ngModelChange)="theme({ title: $event })">
                  <option value="color">De color</option>
                  <option value="ink">En tinta, máxima legibilidad</option>
                </select>
              </label>
              <label class="adm-fld">
                <span>Recorrido de bloques</span>
                <select [ngModel]="e.theme.trail" (ngModelChange)="theme({ trail: $event })">
                  @for (t of trails; track t.id) {
                    <option [value]="t.id">{{ t.label }}</option>
                  }
                </select>
              </label>
            </div>
            <p class="ratio" [class.low]="ratio() < 3" role="status">
              <b class="mono">{{ ratio().toFixed(1) }}:1</b>
              @if (ratio() >= 3) {
                Contraste del titular sobre el fondo: suficiente para texto grande.
              } @else {
                Contraste bajo entre titular y fondo. Funciona como gesto gráfico en letras gigantes; si el titular debe leerse de lejos, cámbialo a tinta.
              }
            </p>
          </section>

          <section class="adm-card" aria-labelledby="c-mod">
            <h2 id="c-mod">Secciones de la página</h2>
            <ul class="mods">
              @for (m of e.modules; track m.key; let i = $index, first = $first, last = $last) {
                <li [class.off]="!m.on">
                  <label class="adm-chk">
                    <input type="checkbox" [ngModel]="m.on" (ngModelChange)="toggle(i, $event)" />
                    <span>
                      <b>{{ label(m.key).label }}</b>
                      <small>{{ label(m.key).hint }}</small>
                    </span>
                  </label>
                  <span class="adm-actions">
                    <button type="button" class="adm-btn" (click)="move(i, -1)" [disabled]="first">Subir <span class="sr-only">{{ label(m.key).label }}</span></button>
                    <button type="button" class="adm-btn" (click)="move(i, 1)" [disabled]="last">Bajar <span class="sr-only">{{ label(m.key).label }}</span></button>
                  </span>
                </li>
              }
            </ul>
            <p class="note">Una sección sin contenido (por ejemplo, tienda sin productos) no se muestra aunque esté activa.</p>
          </section>
        </div>

        <aside class="preview" aria-label="Vista previa de la portada">
          <div class="pv-bar">
            <span>Vista previa</span>
            <div class="seg" role="group" aria-label="Tamaño de la vista previa">
              <button type="button" [attr.aria-pressed]="mode() === 'desktop'" (click)="mode.set('desktop')">Escritorio</button>
              <button type="button" [attr.aria-pressed]="mode() === 'mobile'" (click)="mode.set('mobile')">Móvil</button>
            </div>
          </div>
          <div class="pv" #pv [style.height.px]="frame()[1] * scale()">
            <div class="pv-in" [style.width.px]="frame()[0]" [style.height.px]="frame()[1]" [style.transform]="'scale(' + scale() + ')'" [style.left.px]="offset()">
              <app-event-cover [event]="e" [races]="races()" [preview]="true" />
            </div>
          </div>
        </aside>
      </div>
    } @else {
      <p class="adm-empty">Este evento no existe. <a routerLink="/admin/eventos">Volver a eventos</a></p>
    }
  `,
  styles: `
    .back {
      font: var(--type-label-m);
      color: var(--color-text-muted);
      text-decoration: none;
    }
    .back::before {
      content: '← ';
    }
    .back:hover {
      color: var(--color-accent);
    }
    .head-actions {
      display: flex;
      gap: var(--space-xs);
      align-items: center;
      flex-wrap: wrap;
    }
    .btn[disabled] {
      opacity: 0.4;
      pointer-events: none;
    }
    .ok {
      margin-bottom: var(--space-m);
      color: var(--color-accent);
      font: var(--type-label-m);
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
      gap: var(--space-l);
      align-items: start;
    }
    .controls {
      display: grid;
      gap: var(--space-m);
    }
    .gap {
      margin-top: var(--space-m);
    }
    .note {
      margin-top: var(--space-s);
    }
    .presets {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: var(--space-xs);
    }
    .preset {
      position: relative;
      display: grid;
      gap: var(--space-xs);
      padding: var(--space-s);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-s);
      font: var(--type-label-m);
      cursor: pointer;
    }
    .preset.on {
      border-color: var(--color-text);
      background: var(--color-surface-raised);
    }
    .preset input {
      position: absolute;
      top: var(--space-s);
      right: var(--space-s);
    }
    .chips {
      display: flex;
    }
    .chips i {
      flex: 1;
      height: 20px;
    }
    .colors {
      margin-top: var(--space-m);
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
    fieldset + .adm-grid,
    .note + .adm-grid {
      margin-top: var(--space-m);
    }
    .ratio {
      margin-top: var(--space-m);
      padding: var(--space-s);
      border-left: 3px solid var(--color-accent);
      background: var(--color-surface-raised);
      font: var(--type-body-s);
      color: var(--color-text-muted);
    }
    .ratio b {
      color: var(--color-text);
      font-size: 14px;
      margin-right: var(--space-xs);
    }
    .ratio.low {
      border-left-color: var(--brand-warm);
    }
    .mods {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .mods li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-s);
      padding: var(--space-s) 0;
      border-bottom: 1px solid var(--color-border);
    }
    .mods li.off b,
    .mods li.off small {
      opacity: 0.5;
    }
    .mods label span {
      display: grid;
    }
    .mods small {
      color: var(--color-text-muted);
      font: var(--type-caption);
    }
    .preview {
      position: sticky;
      top: calc(var(--header-h) + var(--space-m));
      display: grid;
      gap: var(--space-xs);
    }
    .pv-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font: var(--type-label-m);
      color: var(--color-text-muted);
    }
    .seg {
      display: flex;
    }
    .seg button {
      height: var(--control-xs);
      padding: 0 var(--space-s);
      border: 1px solid var(--color-border-strong);
      background: none;
      font: var(--type-label-m);
      cursor: pointer;
    }
    .seg button + button {
      border-left: 0;
    }
    .seg button[aria-pressed='true'] {
      background: var(--color-text);
      color: var(--color-bg);
      border-color: var(--color-text);
    }
    .pv {
      position: relative;
      overflow: hidden;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
    }
    .pv-in {
      position: absolute;
      top: 0;
      transform-origin: top left;
    }
    .pv-in app-event-cover {
      height: 100%;
    }
    @media (max-width: 1100px) {
      .layout {
        grid-template-columns: minmax(0, 1fr);
      }
      .preview {
        position: static;
        order: -1;
      }
      .colors {
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      }
    }
  `,
})
export default class EventEditor {
  readonly id = input.required<string>();
  private data = inject(DataService);
  protected presets = PRESETS;
  protected roles = ROLES;
  protected trails = TRAILS;

  private source = computed(() => this.data.event(this.id()));
  /** copia de trabajo: se reinicia al guardar o al cambiar de evento */
  protected draft = linkedSignal<SiteEvent | undefined>(() => {
    const e = this.source();
    return e ? (JSON.parse(JSON.stringify(e)) as SiteEvent) : undefined;
  });
  protected dirty = computed(() => JSON.stringify(this.draft()) !== JSON.stringify(this.source()));
  protected saved = signal(false);
  protected races = computed(() => this.data.racesOf(this.id()));
  protected palette = computed(() => resolvePalette(this.draft()?.theme ?? DEFAULT_THEME));
  protected ratio = computed(() => {
    const t = this.draft()?.theme;
    if (!t) return 21;
    const c = coverColors(t);
    return contrast(c.title, c.bg);
  });

  // --- vista previa a escala ---
  protected mode = signal<'desktop' | 'mobile'>('desktop');
  protected frame = computed(() => FRAME[this.mode()]);
  private box = viewChild<ElementRef<HTMLElement>>('pv');
  private width = signal(600);
  protected scale = computed(() => Math.min(1, this.width() / this.frame()[0]));
  protected offset = computed(() => Math.max(0, (this.width() - this.frame()[0] * this.scale()) / 2));

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.box()?.nativeElement;
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => this.width.set(entry.contentRect.width));
      ro.observe(el);
      destroy.onDestroy(() => ro.disconnect());
    });
  }

  protected label(k: ModuleKey) {
    return MODULE_LABEL[k];
  }

  private patch(change: (e: SiteEvent) => SiteEvent) {
    this.saved.set(false);
    this.draft.update((e) => (e ? change(e) : e));
  }
  protected cover(c: Partial<CoverData>) {
    this.patch((e) => ({ ...e, cover: { ...e.cover, ...c } }));
  }
  protected theme(t: Partial<EventTheme>) {
    this.patch((e) => ({ ...e, theme: { ...e.theme, ...t } }));
  }
  protected brand(id: BrandId) {
    // la paleta propia arranca desde la que estaba puesta
    const custom: Palette | undefined = id === 'custom' ? { ...this.palette().colors } : undefined;
    this.patch((e) => ({ ...e, theme: { ...e.theme, brand: id, custom: custom ?? e.theme.custom } }));
  }
  protected color(role: Role, value: string) {
    this.patch((e) => ({ ...e, theme: { ...e.theme, custom: { ...this.palette().colors, [role]: value } } }));
  }
  protected toggle(i: number, on: boolean) {
    this.patch((e) => ({ ...e, modules: e.modules.map((m, j) => (j === i ? { ...m, on } : m)) }));
  }
  protected move(i: number, dir: -1 | 1) {
    this.patch((e) => {
      const modules = [...e.modules];
      const j = i + dir;
      if (j < 0 || j >= modules.length) return e;
      [modules[i], modules[j]] = [modules[j], modules[i]];
      return { ...e, modules };
    });
  }

  protected save() {
    const e = this.draft();
    if (!e) return;
    this.data.upsert('events', e);
    this.saved.set(true);
  }
  protected discard() {
    const e = this.source();
    this.draft.set(e ? (JSON.parse(JSON.stringify(e)) as SiteEvent) : undefined);
  }
}
