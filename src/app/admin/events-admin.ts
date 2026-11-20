import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { EventKind, EventModule, EventStatus, SiteEvent } from '../core/data/models';
import { DEFAULT_THEME } from '../core/theme/brand';
import { confirmDelete, newId } from './admin-util';

const STATUS: { v: EventStatus; label: string; hint: string }[] = [
  { v: 'borrador', label: 'Borrador', hint: 'Solo visible en el panel' },
  { v: 'publicado', label: 'Publicado', hint: 'Visible en el sitio' },
  { v: 'archivado', label: 'Archivado', hint: 'Visible en el histórico' },
];
const MODULES: EventModule[] = (['paradas', 'trazado', 'corredores', 'cobertura', 'tienda', 'aliados'] as const).map((key) => ({ key, on: true }));

/** Parte un nombre en las dos líneas del titular de portada. */
function coverLines(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length > 1) return [words[0], words.slice(1).join(' ')];
  const half = Math.ceil(name.length / 2);
  return [name.slice(0, half), name.slice(half)];
}

@Component({
  selector: 'app-admin-events',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <header class="adm-head">
      <div>
        <h1 class="display display-m">Eventos</h1>
        <p>Cada evento tiene su página, sus paradas y su propia portada. Uno de ellos es el principal y ocupa el inicio del sitio.</p>
      </div>
      <button type="button" class="btn btn-sm" (click)="startNew()">Crear evento</button>
    </header>

    <div class="adm-split">
      @if (editing() !== null) {
        <section class="adm-card" aria-labelledby="ev-form-h">
          <form class="adm-form" [formGroup]="form" (ngSubmit)="save()">
            <div class="adm-form-head">
              <h2 id="ev-form-h">{{ editing() === 'new' ? 'Crear evento' : 'Datos del evento' }}</h2>
              <button type="button" class="adm-btn" (click)="editing.set(null)">Cerrar</button>
            </div>
            <div class="adm-grid">
              <label class="adm-fld"><span>Nombre</span><input formControlName="name" placeholder="Downtown" /></label>
              <label class="adm-fld"><span>Apellido o edición</span><input formControlName="series" placeholder="Serie Latinoamérica" /></label>
              <label class="adm-fld">
                <span>Dirección web</span>
                <input formControlName="id" [readOnly]="editing() !== 'new'" />
                <small>/eventos/{{ form.controls.id.value || 'nombre-del-evento' }}</small>
              </label>
              <label class="adm-fld">
                <span>Tipo</span>
                <select formControlName="kind">
                  <option value="serie">Serie de varias paradas</option>
                  <option value="unico">Evento único</option>
                </select>
              </label>
              <label class="adm-fld">
                <span>Estado</span>
                <select formControlName="status">
                  @for (s of status; track s.v) {
                    <option [value]="s.v">{{ s.label }}: {{ s.hint.toLowerCase() }}</option>
                  }
                </select>
              </label>
              <label class="adm-fld"><span>Año</span><input type="number" formControlName="year" /></label>
              <label class="adm-fld"><span>Fechas</span><input formControlName="dateLabel" placeholder="Enero a marzo de 2027" /></label>
              <label class="adm-fld"><span>Lugar</span><input formControlName="place" placeholder="Colombia, Ecuador y México" /></label>
              <label class="adm-fld wide"><span>Resumen</span><textarea formControlName="summary" rows="3"></textarea></label>
            </div>
            @if (error()) {
              <p class="adm-err" role="alert">{{ error() }}</p>
            }
            <div class="adm-form-foot">
              <button type="submit" class="btn btn-sm">{{ editing() === 'new' ? 'Crear evento' : 'Guardar cambios' }}</button>
              <button type="button" class="btn btn-sm btn-ghost" (click)="editing.set(null)">Cancelar</button>
            </div>
          </form>
        </section>
      }

      @if (notice()) {
        <p class="adm-err" role="alert">{{ notice() }}</p>
      }

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th scope="col">Evento</th>
              <th scope="col">Fechas</th>
              <th scope="col">Paradas</th>
              <th scope="col">Estado</th>
              <th scope="col"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            @for (e of data.events(); track e.id) {
              <tr [class.is-editing]="editing() === e.id">
                <td>
                  <strong>{{ e.name }}</strong> {{ e.series }}
                  @if (e.id === data.featuredEventId()) {
                    <span class="tag" style="margin-left: 8px">Principal</span>
                  }
                  <div class="muted">/eventos/{{ e.id }}</div>
                </td>
                <td>{{ e.dateLabel }}<div class="muted">{{ e.place }}</div></td>
                <td class="mono">{{ data.racesOf(e.id).length }}</td>
                <td><span class="tag tag-ink-line">{{ label(e.status) }}</span></td>
                <td>
                  <div class="adm-actions">
                    <a class="adm-btn" [routerLink]="['/admin/eventos', e.id]">Personalizar <span class="sr-only">{{ e.name }}</span></a>
                    <button type="button" class="adm-btn" (click)="edit(e)">Datos <span class="sr-only">de {{ e.name }}</span></button>
                    @if (e.id !== data.featuredEventId()) {
                      <button type="button" class="adm-btn" (click)="makeMain(e)">Hacer principal <span class="sr-only">{{ e.name }}</span></button>
                      <button type="button" class="adm-btn danger" (click)="del(e)">Eliminar <span class="sr-only">{{ e.name }}</span></button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="adm-empty">Aún no hay eventos. Crea el primero.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export default class EventsAdmin implements OnInit {
  protected data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  protected status = STATUS;
  protected editing = signal<string | null>(null);
  protected error = signal('');
  protected notice = signal('');

  protected form = this.fb.group({
    id: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    name: ['', Validators.required],
    series: [''],
    kind: ['unico' as EventKind],
    status: ['borrador' as EventStatus],
    year: [new Date().getFullYear() + 1],
    dateLabel: [''],
    place: [''],
    summary: [''],
  });

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('nuevo')) this.startNew();
  }

  protected label(s: EventStatus) {
    return STATUS.find((x) => x.v === s)?.label ?? s;
  }

  protected startNew() {
    this.form.reset();
    this.form.patchValue({ id: newId('evento') });
    this.error.set('');
    this.notice.set('');
    this.editing.set('new');
  }

  protected edit(e: SiteEvent) {
    this.form.reset();
    this.form.patchValue(e);
    this.error.set('');
    this.notice.set('');
    this.editing.set(e.id);
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Falta el nombre, o la dirección web tiene espacios o mayúsculas. Usa solo minúsculas, números y guiones.');
      return;
    }
    const v = this.form.getRawValue();
    const existing = this.data.event(v.id);
    if (this.editing() === 'new' && existing) {
      this.error.set('Ya hay un evento con esa dirección web. Elige otra.');
      return;
    }
    if (v.id === this.data.featuredEventId() && v.status !== 'publicado') {
      this.error.set('El evento principal debe estar publicado. Elige otro evento principal antes de cambiar su estado.');
      return;
    }
    const [line1, line2] = coverLines(v.name);
    const base: SiteEvent = existing ?? {
      ...v,
      theme: DEFAULT_THEME,
      cover: { line1, line2, arrow: true, kickerLeft: v.name, kickerRight: [v.series, v.year].filter(Boolean).join(' ') },
      modules: MODULES,
    };
    this.data.upsert('events', { ...base, ...v });
    this.editing.set(null);
  }

  protected makeMain(e: SiteEvent) {
    if (e.status !== 'publicado') this.data.upsert('events', { ...e, status: 'publicado' as EventStatus });
    this.data.featuredEventId.set(e.id);
    this.notice.set('');
  }

  protected del(e: SiteEvent) {
    const stops = this.data.racesOf(e.id).length;
    if (stops) {
      this.notice.set(`"${e.name}" tiene ${stops} parada${stops > 1 ? 's' : ''}. Muévelas a otro evento o elimínalas antes de borrarlo.`);
      return;
    }
    if (!confirmDelete(e.name)) return;
    this.data.remove('events', e.id);
    if (this.editing() === e.id) this.editing.set(null);
  }
}
