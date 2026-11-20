import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { Post, PostType } from '../core/data/models';
import { confirmDelete, IMAGES, newId, toParagraphs } from './admin-util';

const TYPES: { v: PostType; label: string }[] = [
  { v: 'noticia', label: 'Noticia' },
  { v: 'cronica', label: 'Crónica' },
  { v: 'galeria', label: 'Galería' },
  { v: 'video', label: 'Video' },
];

@Component({
  selector: 'app-admin-posts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <header class="adm-head">
      <div>
        <h1 class="display display-m">Cobertura</h1>
        <p>Noticias, crónicas, galerías y videos de cada parada.</p>
      </div>
      <button type="button" class="btn btn-sm" (click)="startNew()">+ Nueva publicación</button>
    </header>

    <div class="adm-toolbar" role="group" aria-label="Filtrar por tipo">
      <button type="button" class="adm-chip" [attr.aria-pressed]="type() === ''" (click)="type.set('')">Todas ({{ data.posts().length }})</button>
      @for (t of types; track t.v) {
        <button type="button" class="adm-chip" [attr.aria-pressed]="type() === t.v" (click)="type.set(t.v)">{{ t.label }} ({{ countOf(t.v) }})</button>
      }
    </div>

    <div class="adm-split">
      @if (editing() !== null) {
        <section class="adm-card" aria-labelledby="post-form-h">
          <form class="adm-form" [formGroup]="form" (ngSubmit)="save()">
            <div class="adm-form-head">
              <h2 id="post-form-h">{{ editing() === 'new' ? 'Nueva publicación' : 'Editar publicación' }}</h2>
              <button type="button" class="adm-btn" (click)="cancel()">Cerrar</button>
            </div>
            <div class="adm-grid">
              <label class="adm-fld wide"><span>Título</span><input formControlName="title" /></label>
              <label class="adm-fld wide"><span>Bajada</span><input formControlName="dek" /></label>
              <label class="adm-fld">
                <span>Tipo</span>
                <select formControlName="type">
                  @for (t of types; track t.v) {
                    <option [value]="t.v">{{ t.label }}</option>
                  }
                </select>
              </label>
              <label class="adm-fld">
                <span>Parada</span>
                <select formControlName="race">
                  <option value="copa">Evento general</option>
                  @for (r of data.races(); track r.id) {
                    <option [value]="r.id">Parada {{ r.num }} · {{ r.short }}</option>
                  }
                </select>
              </label>
              <label class="adm-fld"><span>Fecha</span><input formControlName="date" placeholder="12 ENE 2027" /></label>
              <label class="adm-fld">
                <span>Imagen</span>
                <select formControlName="img">
                  @for (i of images; track i.src) {
                    <option [value]="i.src">{{ i.label }}</option>
                  }
                </select>
              </label>
              <div class="adm-fld">
                <span>Vista previa</span>
                <img class="preview" [src]="form.controls.img.value" alt="" />
              </div>
              <label class="adm-fld wide">
                <span>Cuerpo</span>
                <textarea formControlName="body" rows="8"></textarea>
                <small>Separa los párrafos con una línea en blanco.</small>
              </label>
            </div>
            <label class="adm-chk"><input type="checkbox" formControlName="featured" /> Destacada en portada de cobertura</label>
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
              <th scope="col">Título</th>
              <th scope="col">Tipo</th>
              <th scope="col">Parada</th>
              <th scope="col">Fecha</th>
              <th scope="col"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            @for (p of list(); track p.id) {
              <tr [class.is-editing]="editing() === p.id">
                <td><img class="adm-thumb" [src]="p.img" alt="" /></td>
                <td>
                  <strong>{{ p.title }}</strong>
                  @if (p.featured) {
                    <span class="tag" style="margin-left: 8px">Destacada</span>
                  }
                  <div class="muted">{{ p.dek }}</div>
                </td>
                <td><span class="tag tag-ink-line">{{ p.type }}</span></td>
                <td class="muted">{{ data.raceName(p.race) }}</td>
                <td class="mono">{{ p.date }}</td>
                <td>
                  <div class="adm-actions">
                    <button type="button" class="adm-btn" (click)="edit(p)">Editar <span class="sr-only">{{ p.title }}</span></button>
                    <button type="button" class="adm-btn danger" (click)="del(p)">Eliminar <span class="sr-only">{{ p.title }}</span></button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="adm-empty">No hay publicaciones de este tipo.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .preview {
      width: 100%;
      max-width: 220px;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      border-radius: 3px;
      background: var(--ink-3);
    }
  `,
})
export default class PostsAdmin implements OnInit {
  protected data = inject(DataService);
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  protected types = TYPES;
  protected images = IMAGES;
  protected editing = signal<string | null>(null);
  protected error = signal('');
  protected type = signal<PostType | ''>('');
  protected list = computed(() => (this.type() ? this.data.posts().filter((p) => p.type === this.type()) : this.data.posts()));

  protected form = this.fb.group({
    id: [''],
    title: ['', Validators.required],
    dek: [''],
    type: ['noticia' as PostType],
    race: ['copa'],
    date: [''],
    img: [IMAGES[0].src],
    featured: [false],
    body: [''],
  });

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('nuevo')) this.startNew();
  }

  protected countOf(t: PostType) {
    return this.data.posts().filter((p) => p.type === t).length;
  }

  protected startNew() {
    this.form.reset();
    this.form.patchValue({ id: newId('post'), type: this.type() || 'noticia' });
    this.error.set('');
    this.editing.set('new');
  }
  protected edit(p: Post) {
    this.form.reset();
    this.form.patchValue({ ...p, featured: !!p.featured, body: (p.body ?? []).join('\n\n') });
    this.error.set('');
    this.editing.set(p.id);
  }
  protected cancel() {
    this.editing.set(null);
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('El título es obligatorio.');
      return;
    }
    const { body, ...v } = this.form.getRawValue();
    const prev = this.data.post(v.id);
    const post: Post = { ...prev, ...v, body: toParagraphs(body) };
    this.data.upsert('posts', post);
    this.editing.set(null);
  }

  protected del(p: Post) {
    if (!confirmDelete(p.title)) return;
    this.data.remove('posts', p.id);
    if (this.editing() === p.id) this.editing.set(null);
  }
}
