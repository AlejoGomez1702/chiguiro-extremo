import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { Post } from '../core/data/models';

const TYPE: Record<string, string> = { noticia: 'Noticia', cronica: 'Crónica', galeria: 'Galería', video: 'Video' };

@Component({
  selector: 'app-post-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a [routerLink]="['/cobertura', post().id]" [class.big]="big()">
      <figure>
        <img [src]="post().img" [style.object-position]="post().pos ?? 'center'" alt="" loading="lazy" />
        <span class="tag tag-dark">{{ label() }}</span>
        <span class="ill mono">Ilustración</span>
      </figure>
      <span class="eyebrow">{{ data.raceName(post().race) }}</span>
      <h3 [class]="big() ? 'display display-m' : 'title'">{{ post().title }}</h3>
      @if (big()) {
        <p class="dek">{{ post().dek }}</p>
      }
      <span class="mono date">{{ post().date }}</span>
    </a>
  `,
  styles: `
    a {
      display: grid;
      gap: 10px;
      text-decoration: none;
    }
    figure {
      position: relative;
      margin: 0;
      aspect-ratio: 16 / 10;
      overflow: hidden;
      border-radius: 4px;
      background: var(--ink-3);
    }
    .big figure {
      aspect-ratio: 16 / 8;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s var(--ease);
    }
    a:hover img {
      transform: scale(1.04);
    }
    .tag {
      position: absolute;
      top: 10px;
      left: 10px;
    }
    .ill {
      position: absolute;
      right: 10px;
      bottom: 10px;
      font-size: 10px;
      background: color-mix(in srgb, var(--dt-ink) 85%, transparent);
      color: var(--bone);
      padding: 2px 6px;
    }
    .title {
      font-size: 19px;
      line-height: 1.25;
      font-weight: 800;
    }
    a:hover .title {
      text-decoration: underline;
      text-decoration-color: var(--signal);
      text-underline-offset: 3px;
    }
    .dek {
      opacity: 0.75;
      max-width: 60ch;
    }
    .date {
      opacity: 0.65;
    }
  `,
})
export class PostCard {
  readonly post = input.required<Post>();
  readonly big = input(false);
  protected data = inject(DataService);
  protected label = computed(() => {
    const p = this.post();
    return TYPE[p.type] + (p.duration ? ` · ${p.duration}` : p.n ? ` · ${p.n} fotos` : '');
  });
}
