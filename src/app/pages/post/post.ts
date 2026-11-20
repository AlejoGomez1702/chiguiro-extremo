import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data/data.service';
import { Seo } from '../../core/seo';
import { PostCard } from '../../shared/post-card';

const IMGS = ['/assets/img/escena-escalinata.svg', '/assets/img/escena-salto.svg', '/assets/img/escena-muro.svg', '/assets/img/escena-callejon.svg'];

@Component({
  selector: 'app-post-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PostCard],
  template: `
    @if (post(); as p) {
      <article>
        <header class="container head">
          <a routerLink="/cobertura" class="back mono">← Cobertura</a>
          <span class="eyebrow">{{ data.raceName(p.race) }} · {{ typeLabel() }}</span>
          <h1 class="display display-l">{{ p.title }}</h1>
          <p class="lead">{{ p.dek }}</p>
          <span class="mono date">{{ p.date }}</span>
        </header>

        <figure class="container hero">
          @if (p.type === 'video') {
            <button type="button" class="video" (click)="playing.set(true)" [attr.aria-label]="'Reproducir ' + p.title">
              <img [src]="p.img" alt="" />
              @if (playing()) {
                <span class="msg mono">Demo: aquí se inserta el video (YouTube o Cloudflare Stream).</span>
              } @else {
                <span class="play">▶</span>
                <span class="dur mono">{{ p.duration }}</span>
              }
            </button>
          } @else {
            <img [src]="p.img" alt="" [style.object-position]="p.pos ?? 'center'" />
          }
          <figcaption class="note">Ilustración provisional.</figcaption>
        </figure>

        @if (p.type === 'galeria') {
          <div class="container gallery">
            @for (c of data.captions; track c; let i = $index) {
              <figure>
                <img [src]="img(i)" alt="" loading="lazy" />
                <figcaption>{{ c }}</figcaption>
              </figure>
            }
          </div>
        }

        <div class="container body">
          @for (para of body(); track $index) {
            <p>{{ para }}</p>
            @if ($index === 1 && p.pull) {
              <blockquote class="display">{{ p.pull }}</blockquote>
            }
          }
        </div>
      </article>

      <section class="section related">
        <div class="container">
          <h2 class="display display-m">Más de {{ data.raceName(p.race) }}</h2>
          <div class="grid grid-3">
            @for (o of related(); track o.id) {
              <app-post-card [post]="o" />
            }
          </div>
        </div>
      </section>
    } @else {
      <div class="container head">
        <h1 class="display display-l">Publicación no encontrada</h1>
        <a routerLink="/cobertura" class="btn">Ver cobertura</a>
      </div>
    }
  `,
  styles: `
    .head {
      padding-top: calc(var(--header-h) + 48px);
      display: grid;
      gap: 14px;
      justify-items: start;
      max-width: 900px;
    }
    .back {
      text-decoration: none;
      color: var(--muted);
    }
    .date {
      color: var(--muted);
    }
    .hero {
      margin-top: 32px;
      margin-bottom: 0;
    }
    .hero img,
    .video {
      width: 100%;
      aspect-ratio: 16 / 8;
      object-fit: cover;
      border-radius: 4px;
    }
    .video {
      position: relative;
      padding: 0;
      border: 0;
      cursor: pointer;
      display: block;
      overflow: hidden;
    }
    .video img {
      height: 100%;
    }
    .play {
      position: absolute;
      inset: 0;
      margin: auto;
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: var(--signal);
      color: var(--ink);
      display: grid;
      place-items: center;
      font-size: 30px;
    }
    .dur,
    .msg {
      position: absolute;
      left: 12px;
      bottom: 12px;
      background: var(--ink);
      padding: 4px 8px;
    }
    figcaption {
      margin-top: 8px;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
      gap: 12px;
      margin-top: 24px;
    }
    .gallery figure {
      margin: 0;
    }
    .gallery img {
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: 3px;
      width: 100%;
    }
    .gallery figcaption {
      font-size: 13px;
      color: var(--muted-2);
    }
    .body {
      max-width: 760px;
      margin-top: 40px;
      padding-bottom: 64px;
      display: grid;
      gap: 20px;
      font-size: 18.5px;
      line-height: 1.7;
      color: var(--muted-2);
    }
    blockquote {
      margin: 12px 0;
      padding-left: 20px;
      border-left: 4px solid var(--signal);
      font-size: clamp(32px, 4vw, 48px);
      color: var(--bone);
      line-height: 1;
    }
    .related {
      background: var(--ink-2);
      border-top: 1px solid var(--line);
    }
    .related h2 {
      margin-bottom: 24px;
    }
  `,
})
export default class PostPage {
  readonly id = input.required<string>();
  protected data = inject(DataService);
  private seo = inject(Seo);
  protected playing = signal(false);
  protected post = computed(() => this.data.post(this.id()));
  protected body = computed(() => this.post()?.body ?? this.data.genericBody);
  protected typeLabel = computed(() => ({ noticia: 'Noticia', cronica: 'Crónica', galeria: 'Galería', video: 'Video' })[this.post()?.type ?? 'noticia']);
  protected related = computed(() => {
    const p = this.post();
    if (!p) return [];
    const same = this.data.posts().filter((o) => o.id !== p.id && o.race === p.race);
    return (same.length >= 3 ? same : [...same, ...this.data.posts().filter((o) => o.id !== p.id && o.race !== p.race)]).slice(0, 3);
  });
  protected img(i: number) {
    return IMGS[i % IMGS.length];
  }
  constructor() {
    effect(() => {
      const p = this.post();
      if (p) this.seo.set(p.title, p.dek);
    });
  }
}
