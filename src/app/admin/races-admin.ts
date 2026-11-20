import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { Race, RaceStatus } from '../core/data/models';
import { confirmDelete, IMAGES, newId } from './admin-util';

const STATUS: { v: RaceStatus; label: string }[] = [
  { v: 'proxima', label: 'Próxima' },
  { v: 'fecha', label: 'Fecha confirmada' },
  { v: 'tba', label: 'Por anunciar' },
  { v: 'finalizada', label: 'Finalizada' },
];

@Component({
  selector: 'app-admin-races',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <header class="adm-head">
      <div>
        
        <h1 class="display display-m">Paradas</h1>
        <p>Las ciudades y fechas de cada evento, con su estado de inscripción.</p>
      </div>
      <button type="button" class="btn btn-sm" (click)="startNew()">Crear parada</button>
    </header>

    <div class="adm-split">
      @if (editing() !== null) {
        <section class="adm-card" aria-labelledby="race-form-h">
          <form class="adm-form" [formGroup]="form" (ngSubmit)="save()">
            <div class="adm-form-head">
              <h2 id="race-form-h">{{ editing() === 'new' ? 'Crear parada' : 'Editar parada' }}</h2>
              <button type="button" class="adm-btn" (click)="cancel()">Cerrar</button>
            </div>
            <div class="adm-grid">
              <label class="adm-fld">
                <span>ID (slug)</span>
                <input formControlName="id" [readOnly]="editing() !== 'new'" />
                <small>Se usa en la URL: /carreras/&lt;id&gt;</small>
              </label>
              <label class="adm-fld">
                <span>Evento</span>
                <select formControlName="eventId">
                  @for (e of data.events(); track e.id) {
                    <option [value]="e.id">{{ e.name }} {{ e.year }}</option>
                  }
                </select>
              </label>
              <label class="adm-fld"><span>Número</span><input formControlName="num" placeholder="01" /></label>
              <label class="adm-fld"><span>Código país</span><input formControlName="code" maxlength="3" placeholder="CO" /></label>
              <label class="adm-fld"><span>Título</span><input formControlName="title" /></label>
              <label class="adm-fld"><span>Nombre corto</span><input formControlName="short" /></label>
              <label class="adm-fld"><span>Lugar</span><input formControlName="place" /></label>
              <label class="adm-fld wide"><span>Fecha (texto largo)</span><input formControlName="date" placeholder="Sábado 9 de enero de 2027" /></label>
              <label class="adm-fld">
                <span>Fecha corta</span><input formControlName="dshort" placeholder="9 ENE 2027" />
                <small>Formato "9 ENE 2027" para la cuenta regresiva.</small>
              </label>
              <label class="adm-fld"><span>Subtítulo fecha</span><input formControlName="dsub" /></label>
              <label class="adm-fld">
                <span>Estado</span>
                <select formControlName="status" (change)="syncLabel()">
                  @for (s of status; track s.v) {
                    <option [value]="s.v">{{ s.label }}</option>
                  }
                </select>
              </label>
              <label class="adm-fld"><span>Etiqueta de estado</span><input formControlName="statusLabel" /></label>
              <label class="adm-fld"><span>Inscripción</span><input formControlName="insc" /></label>
              <label class="adm-fld">
                <span>Imagen</span>
                <select formControlName="img">
                  <option value="">Sin imagen</option>
                  @for (i of images; track i.src) {
                    <option [value]="i.src">{{ i.label }}</option>
                  }
                </select>
              </label>
            </div>
            <div class="adm-checks">
              <label class="adm-chk"><input type="checkbox" formControlName="hasMap" /> Tiene mapa del trazado</label>
              <label class="adm-chk"><input type="checkbox" formControlName="isNext" /> Es la próxima parada de su evento</label>
            </div>
            @if (error()) {
              <p class="adm-err" role="alert">{{ error() }}</p>
            }
            <div class="adm-form-foot">
              <button type="submit" class="btn btn-sm">Guardar</button>
              <button type="button" class="btn btn-sm btn-ghost" (click)="cancel()">Cancelar</button>
            </div>
          </form>
        </section>
      }

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Parada</th>
              <th scope="col">Evento</th>
              <th scope="col">Fecha</th>
              <th scope="col">Estado</th>
              <th scope="col">Inscripción</th>
              <th scope="col"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            @for (r of data.races(); track r.id) {
              <tr [class.is-editing]="editing() === r.id">
                <td class="mono">{{ r.num }}</td>
                <td>
                  <strong>{{ r.title }}</strong>
                  @if (r.isNext) {
                    <span class="tag" style="margin-left: 8px">Próxima</span>
                  }
                  <div class="muted">{{ r.place }} · {{ r.code }}</div>
                </td>
                <td>{{ data.event(r.eventId)?.name ?? "Sin evento" }}</td>
                <td class="mono">{{ r.dshort }}</td>
                <td><span class="tag tag-ink-line">{{ r.statusLabel }}</span></td>
                <td class="muted">{{ r.insc }}</td>
                <td>
                  <div class="adm-actions">
                    <button type="button" class="adm-btn" (click)="edit(r)">Editar <span class="sr-only">{{ r.title }}</span></button>
                    <button type="button" class="adm-btn danger" (click)="del(r)">Eliminar <span class="sr-only">{{ r.title }}</span></button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="adm-empty">Este evento aún no tiene paradas. Crea la primera.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export default class RacesAdmin implements OnInit {
  protected data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  protected status = STATUS;
  protected images = IMAGES;
  protected editing = signal<string | null>(null);
  protected error = signal('');

  protected form = this.fb.group({
    id: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    eventId: [''],
    num: ['', Validators.required],
    code: ['', Validators.required],
    title: ['', Validators.required],
    short: ['', Validators.required],
    place: [''],
    date: [''],
    dshort: [''],
    dsub: [''],
    status: ['tba' as RaceStatus],
    statusLabel: ['Por anunciar'],
    insc: ['Inscripción: por anunciar'],
    img: [''],
    hasMap: [false],
    isNext: [false],
  });

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('nuevo')) this.startNew();
  }

  protected startNew() {
    const n = String(this.data.mainRaces().length + 1).padStart(2, '0');
    this.form.reset();
    this.form.patchValue({ id: newId('parada'), num: n, eventId: this.data.featuredEventId() });
    this.error.set('');
    this.editing.set('new');
  }

  protected edit(r: Race) {
    this.form.reset();
    this.form.patchValue({ ...r, img: r.img ?? '' });
    this.error.set('');
    this.editing.set(r.id);
  }

  protected cancel() {
    this.editing.set(null);
  }

  protected syncLabel() {
    const s = STATUS.find((x) => x.v === this.form.controls.status.value);
    if (s) this.form.controls.statusLabel.setValue(s.label);
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos obligatorios (ID en minúsculas sin espacios, número, código, título y nombre corto).');
      return;
    }
    const v = this.form.getRawValue();
    const isNew = this.editing() === 'new';
    if (isNew && this.data.race(v.id)) {
      this.error.set('Ya existe una parada con ese ID. Elige otro.');
      return;
    }
    const base: Race = this.data.race(v.id) ?? {
      ...v,
      img: null,
      facts: [],
      factsNote: '',
      infoHint: 'Fecha y avisos',
      mapHint: 'Por anunciar',
      covHint: 'Anuncios de la sede',
      kits: 'Lugar y horario: por anunciar.',
    };
    const race: Race = { ...base, ...v, code: v.code.toUpperCase(), img: v.img || null };
    if (race.isNext) {
      for (const other of this.data.racesOf(race.eventId)) {
        if (other.id !== race.id && other.isNext) this.data.upsert('races', { ...other, isNext: false });
      }
    }
    this.data.upsert('races', race);
    this.editing.set(null);
  }

  protected del(r: Race) {
    if (!confirmDelete(r.title)) return;
    this.data.remove('races', r.id);
    if (this.editing() === r.id) this.editing.set(null);
  }
}
