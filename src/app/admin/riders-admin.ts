import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { Rider } from '../core/data/models';
import { confirmDelete, newId } from './admin-util';

@Component({
  selector: 'app-admin-riders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <header class="adm-head">
      <div>
        <h1 class="display display-m">Corredores por categoría</h1>
        <p>Perfiles de pilotos, placas y paradas en las que participan.</p>
      </div>
      <button type="button" class="btn btn-sm" (click)="startNew()">+ Nuevo corredor</button>
    </header>

    <div class="adm-toolbar" role="group" aria-label="Filtrar por categoría">
      <button type="button" class="adm-chip" [attr.aria-pressed]="cat() === ''" (click)="cat.set('')">Todas ({{ data.riders().length }})</button>
      @for (c of data.categories(); track c) {
        <button type="button" class="adm-chip" [attr.aria-pressed]="cat() === c" (click)="cat.set(c)">{{ c }} ({{ countIn(c) }})</button>
      }
    </div>

    <div class="adm-split">
      @if (editing() !== null) {
        <section class="adm-card" aria-labelledby="rider-form-h">
          <form class="adm-form" [formGroup]="form" (ngSubmit)="save()">
            <div class="adm-form-head">
              <h2 id="rider-form-h">{{ editing() === 'new' ? 'Nuevo corredor' : 'Editar corredor' }}</h2>
              <button type="button" class="adm-btn" (click)="cancel()">Cerrar</button>
            </div>
            <div class="adm-grid">
              <label class="adm-fld"><span>Nombre</span><input formControlName="name" /></label>
              <label class="adm-fld"><span>Código país</span><input formControlName="cc" maxlength="3" placeholder="CO" /></label>
              <label class="adm-fld"><span>País</span><input formControlName="country" /></label>
              <label class="adm-fld"><span>Placa</span><input formControlName="plate" placeholder="07" /></label>
              <label class="adm-fld">
                <span>Categoría</span>
                <input formControlName="category" list="adm-cats" />
                <datalist id="adm-cats">
                  @for (c of data.categories(); track c) {
                    <option [value]="c"></option>
                  }
                </datalist>
                <small>Elige una existente o escribe una nueva.</small>
              </label>
              <label class="adm-fld"><span>Equipo</span><input formControlName="team" /></label>
              <label class="adm-fld"><span>Logro destacado</span><input formControlName="feat" /></label>
              <label class="adm-fld"><span>Trayectoria</span><input formControlName="career" /></label>
              <label class="adm-fld"><span>Color de fondo</span><input type="color" formControlName="bg" /></label>
              <label class="adm-fld"><span>Color de texto</span><input type="color" formControlName="fg" /></label>
              <div class="adm-fld">
                <span>Vista previa</span>
                <span class="plate" [style.background]="form.controls.bg.value" [style.color]="form.controls.fg.value">{{ form.controls.plate.value || '00' }}</span>
              </div>
              <label class="adm-fld wide"><span>Descripción</span><textarea formControlName="desc" rows="4"></textarea></label>
            </div>
            <fieldset>
              <legend class="adm-legend">Paradas en las que corre</legend>
              <div class="adm-checks">
                @for (r of data.races(); track r.id) {
                  <label class="adm-chk">
                    <input type="checkbox" [checked]="form.controls.races.value.includes(r.id)" (change)="toggleRace(r.id)" />
                    {{ r.num }} · {{ r.short }}
                  </label>
                }
              </div>
            </fieldset>
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

      @for (g of groups(); track g.cat) {
        <section [attr.aria-label]="g.cat">
          <h2 class="eyebrow grp">{{ g.cat }} · {{ g.riders.length }}</h2>
          <div class="adm-table-wrap">
            <table class="adm-table">
              <thead>
                <tr>
                  <th scope="col">Placa</th>
                  <th scope="col">Corredor</th>
                  <th scope="col">Equipo</th>
                  <th scope="col">Paradas</th>
                  <th scope="col"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                @for (r of g.riders; track r.id) {
                  <tr [class.is-editing]="editing() === r.id">
                    <td><span class="plate sm" [style.background]="r.bg" [style.color]="r.fg">{{ r.plate }}</span></td>
                    <td>
                      <strong>{{ r.name }}</strong>
                      <div class="muted">{{ r.country }} · {{ r.cc }}</div>
                    </td>
                    <td class="muted">{{ r.team }}</td>
                    <td class="mono">{{ raceNums(r) }}</td>
                    <td>
                      <div class="adm-actions">
                        <button type="button" class="adm-btn" (click)="edit(r)">Editar <span class="sr-only">{{ r.name }}</span></button>
                        <button type="button" class="adm-btn danger" (click)="del(r)">Eliminar <span class="sr-only">{{ r.name }}</span></button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      } @empty {
        <p class="adm-empty">No hay corredores en esta categoría.</p>
      }
    </div>
  `,
  styles: `
    .grp {
      margin: 8px 0 10px;
    }
    .plate {
      display: inline-grid;
      place-items: center;
      width: 64px;
      height: 44px;
      border-radius: 3px;
      font-family: var(--display);
      font-weight: 900;
      font-size: 26px;
      border: 1px solid var(--line-2);
    }
    .plate.sm {
      width: 44px;
      height: 32px;
      font-size: 18px;
    }
  `,
})
export default class RidersAdmin implements OnInit {
  protected data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  protected editing = signal<string | null>(null);
  protected error = signal('');
  protected cat = signal('');

  protected groups = computed(() => {
    const cats = this.cat() ? [this.cat()] : this.data.categories();
    return cats
      .map((c) => ({ cat: c, riders: this.data.riders().filter((r) => r.category === c) }))
      .filter((g) => g.riders.length);
  });

  protected form = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    cc: ['', Validators.required],
    country: [''],
    plate: [''],
    category: ['', Validators.required],
    races: [[] as string[]],
    desc: [''],
    team: [''],
    feat: [''],
    career: [''],
    bg: ['#121212'],
    fg: ['#ff5b1f'],
  });

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('nuevo')) this.startNew();
  }

  protected countIn(c: string) {
    return this.data.riders().filter((r) => r.category === c).length;
  }
  protected raceNums(r: Rider) {
    return r.races.map((id) => this.data.race(id)?.num ?? id).join(' · ') || '—';
  }

  protected startNew() {
    this.form.reset();
    this.form.patchValue({ id: newId('rdr'), category: this.cat() || this.data.categories()[0] || '' });
    this.error.set('');
    this.editing.set('new');
  }
  protected edit(r: Rider) {
    this.form.reset();
    this.form.patchValue({ ...r, races: [...r.races] });
    this.error.set('');
    this.editing.set(r.id);
  }
  protected cancel() {
    this.editing.set(null);
  }
  protected toggleRace(id: string) {
    const c = this.form.controls.races;
    c.setValue(c.value.includes(id) ? c.value.filter((x) => x !== id) : [...c.value, id]);
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa nombre, código de país y categoría.');
      return;
    }
    const v = this.form.getRawValue();
    const rider: Rider = { ...v, cc: v.cc.toUpperCase(), category: v.category.trim() };
    this.data.upsert('riders', rider);
    this.editing.set(null);
  }

  protected del(r: Rider) {
    if (!confirmDelete(r.name)) return;
    this.data.remove('riders', r.id);
    if (this.editing() === r.id) this.editing.set(null);
  }
}
