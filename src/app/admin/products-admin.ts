import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormGroup, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { Product, ProductColor } from '../core/data/models';
import { ProductArt } from '../shared/product-art';
import { confirmDelete, newId, toList } from './admin-util';

type ProductType = Product['type'];
type ColorGroup = FormGroup<{ n: FormControl<string>; h: FormControl<string> }>;

const TYPES: { v: ProductType; label: string }[] = [
  { v: 'ropa', label: 'Ropa' },
  { v: 'acc', label: 'Accesorios' },
  { v: 'col', label: 'Coleccionables' },
];
const KINDS = ['tee', 'longsleeve', 'hoodie', 'cap', 'gloves', 'socks', 'poster'];

@Component({
  selector: 'app-admin-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ProductArt],
  template: `
    <header class="adm-head">
      <div>
        <h1 class="display display-m">Tienda oficial</h1>
        <p>Catálogo de la tienda por colección de cada parada.</p>
      </div>
      <button type="button" class="btn btn-sm" (click)="startNew()">+ Nuevo producto</button>
    </header>

    <div class="adm-split">
      @if (editing() !== null) {
        <section class="adm-card" aria-labelledby="prod-form-h">
          <form class="adm-form" [formGroup]="form" (ngSubmit)="save()">
            <div class="adm-form-head">
              <h2 id="prod-form-h">{{ editing() === 'new' ? 'Nuevo producto' : 'Editar producto' }}</h2>
              <button type="button" class="adm-btn" (click)="cancel()">Cerrar</button>
            </div>
            <div class="prod-form">
              <div class="adm-grid">
                <label class="adm-fld wide"><span>Nombre</span><input formControlName="name" /></label>
                <label class="adm-fld">
                  <span>Colección</span>
                  <select formControlName="col">
                    <option value="copa">Evento general</option>
                    @for (r of data.races(); track r.id) {
                      <option [value]="r.id">Parada {{ r.num }} · {{ r.short }}</option>
                    }
                  </select>
                </label>
                <label class="adm-fld">
                  <span>Tipo</span>
                  <select formControlName="type">
                    @for (t of types; track t.v) {
                      <option [value]="t.v">{{ t.label }}</option>
                    }
                  </select>
                </label>
                <label class="adm-fld"><span>Precio (USD)</span><input type="number" min="0" step="1" formControlName="price" /></label>
                <label class="adm-fld">
                  <span>Silueta</span>
                  <input formControlName="kind" list="adm-kinds" />
                  <datalist id="adm-kinds">
                    @for (k of kinds; track k) {
                      <option [value]="k"></option>
                    }
                  </datalist>
                </label>
                <label class="adm-fld"><span>Insignia</span><input formControlName="badge" placeholder="Nuevo, Edición limitada…" /></label>
                <label class="adm-fld">
                  <span>Tallas</span><input formControlName="sizes" placeholder="S, M, L, XL" />
                  <small>Separadas por comas.</small>
                </label>
                <label class="adm-fld wide">
                  <span>Estampado</span><textarea formControlName="print" rows="2"></textarea>
                  <small>Cada línea se imprime en un renglón.</small>
                </label>
                <label class="adm-fld wide"><span>Descripción</span><textarea formControlName="desc" rows="3"></textarea></label>
              </div>
              <div class="adm-fld">
                <span>Vista previa</span>
                @if (preview(); as p) {
                  <app-product-art class="art" [product]="p" />
                }
              </div>
            </div>

            <fieldset>
              <legend class="adm-legend">Colores</legend>
              <div class="colors" formArrayName="colors">
                @for (c of colors.controls; track c; let i = $index) {
                  <div class="color-row" [formGroupName]="i">
                    <label class="adm-fld"><span>Nombre color {{ i + 1 }}</span><input formControlName="n" /></label>
                    <label class="adm-fld"><span>Hex</span><input type="color" formControlName="h" /></label>
                    <button type="button" class="adm-btn danger" (click)="removeColor(i)" [disabled]="colors.length <= 1">Quitar <span class="sr-only">color {{ i + 1 }}</span></button>
                  </div>
                }
              </div>
              <button type="button" class="adm-btn" (click)="addColor()">+ Agregar color</button>
            </fieldset>
            <label class="adm-chk"><input type="checkbox" formControlName="soldOut" /> Agotado</label>

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
              <th scope="col"><span class="sr-only">Imagen</span></th>
              <th scope="col">Producto</th>
              <th scope="col">Colección</th>
              <th scope="col">Precio</th>
              <th scope="col">Colores</th>
              <th scope="col"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            @for (p of data.products(); track p.id) {
              <tr [class.is-editing]="editing() === p.id">
                <td><app-product-art class="thumb" [product]="p" /></td>
                <td>
                  <strong>{{ p.name }}</strong>
                  @if (p.badge) {
                    <span class="tag" style="margin-left: 8px">{{ p.badge }}</span>
                  }
                  <div class="muted">{{ typeLabel(p.type) }} · {{ p.kind }} · {{ p.sizes.join(', ') || 'Talla única' }}</div>
                </td>
                <td class="muted">{{ data.raceName(p.col) }}</td>
                <td class="mono">US$ {{ p.price }}</td>
                <td>
                  @for (c of p.colors; track $index) {
                    <span class="adm-swatch" [style.background]="c.h" [title]="c.n"></span>
                  }
                </td>
                <td>
                  <div class="adm-actions">
                    <button type="button" class="adm-btn" (click)="edit(p)">Editar <span class="sr-only">{{ p.name }}</span></button>
                    <button type="button" class="adm-btn danger" (click)="del(p)">Eliminar <span class="sr-only">{{ p.name }}</span></button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="adm-empty">No hay productos.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .prod-form {
      display: grid;
      gap: 20px;
      grid-template-columns: minmax(0, 1fr) 220px;
    }
    @media (max-width: 700px) {
      .prod-form {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .art {
      width: 100%;
      max-width: 220px;
      border-radius: 4px;
    }
    .thumb {
      width: 48px;
      border-radius: 2px;
    }
    .colors {
      display: grid;
      gap: 10px;
      margin-bottom: 12px;
    }
    .color-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 90px auto;
      gap: 10px;
      align-items: end;
    }
    .adm-swatch + .adm-swatch {
      margin-left: 4px;
    }
  `,
})
export default class ProductsAdmin implements OnInit {
  protected data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  protected types = TYPES;
  protected kinds = KINDS;
  protected editing = signal<string | null>(null);
  protected error = signal('');

  protected form = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    col: ['copa'],
    type: ['ropa' as ProductType],
    price: [0, [Validators.required, Validators.min(0)]],
    kind: ['tee'],
    print: [''],
    badge: [''],
    desc: [''],
    sizes: ['S, M, L, XL'],
    soldOut: [false],
    colors: this.fb.array<ColorGroup>([]),
  });
  protected get colors(): FormArray<ColorGroup> {
    return this.form.controls.colors;
  }

  private value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected preview = computed(() => {
    this.value();
    return this.toProduct();
  });

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('nuevo')) this.startNew();
  }

  protected typeLabel(t: ProductType) {
    return TYPES.find((x) => x.v === t)?.label ?? t;
  }

  private colorGroup(c: ProductColor): ColorGroup {
    return this.fb.group({ n: [c.n, Validators.required], h: [c.h] });
  }
  protected addColor() {
    this.colors.push(this.colorGroup({ n: '', h: '#121212' }));
  }
  protected removeColor(i: number) {
    this.colors.removeAt(i);
  }

  private load(p: Partial<Product>) {
    this.form.reset();
    this.colors.clear();
    (p.colors?.length ? p.colors : [{ n: 'Negro', h: '#121212' }]).forEach((c) => this.colors.push(this.colorGroup(c)));
    this.form.patchValue({
      ...p,
      badge: p.badge ?? '',
      soldOut: !!p.soldOut,
      sizes: p.sizes ? p.sizes.join(', ') : 'S, M, L, XL',
    });
    this.error.set('');
  }

  protected startNew() {
    this.load({ id: newId('prd') });
    this.editing.set('new');
  }
  protected edit(p: Product) {
    this.load(p);
    this.editing.set(p.id);
  }
  protected cancel() {
    this.editing.set(null);
  }

  private toProduct(): Product {
    const v = this.form.getRawValue();
    const p: Product = {
      ...this.data.product(v.id),
      id: v.id,
      name: v.name,
      col: v.col,
      type: v.type,
      price: Number(v.price) || 0,
      kind: v.kind,
      print: v.print,
      desc: v.desc,
      sizes: toList(v.sizes),
      colors: v.colors.map((c) => ({ n: c.n.trim(), h: c.h })),
      soldOut: v.soldOut,
    };
    if (v.badge.trim()) p.badge = v.badge.trim();
    else delete p.badge;
    return p;
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa el nombre, un precio válido y el nombre de cada color.');
      return;
    }
    this.data.upsert('products', this.toProduct());
    this.editing.set(null);
  }

  protected del(p: Product) {
    if (!confirmDelete(p.name)) return;
    this.data.remove('products', p.id);
    if (this.editing() === p.id) this.editing.set(null);
  }
}
