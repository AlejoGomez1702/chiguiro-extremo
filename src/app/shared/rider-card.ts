import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../core/data/data.service';
import { Rider } from '../core/data/models';

@Component({
  selector: 'app-rider-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 300 380" aria-hidden="true" [style.background]="rider().bg">
      <path d="M40 380c0-90 50-130 110-130s110 40 110 130Z" [attr.fill]="rider().fg" opacity=".92" />
      <path d="M95 175c0-62 24-92 60-92 38 0 62 30 62 92 0 50-22 78-62 78s-60-28-60-78Z" [attr.fill]="rider().fg" />
      <rect x="125" y="140" width="80" height="26" [attr.fill]="rider().bg" />
      <path d="M100 110 70 98l26 28Z" [attr.fill]="rider().fg" />
    </svg>
    <span class="cc tag tag-dark">{{ rider().cc }}</span>
    <span class="plate display">{{ rider().plate }}</span>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      border-radius: 4px;
      overflow: hidden;
    }
    svg {
      width: 100%;
      height: auto;
      aspect-ratio: 300 / 380;
    }
    .cc {
      position: absolute;
      top: 10px;
      left: 10px;
    }
    .plate {
      position: absolute;
      top: 10px;
      right: 10px;
      background: var(--bone);
      color: var(--ink);
      font-size: 34px;
      padding: 2px 8px 0;
      border-radius: 2px;
    }
  `,
})
export class RiderAvatar {
  readonly rider = input.required<Rider>();
}

@Component({
  selector: 'app-rider-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RiderAvatar],
  template: `
    <a [routerLink]="['/corredores', rider().id]">
      <app-rider-avatar [rider]="rider()" />
      <h3 class="display display-s">{{ rider().name }}</h3>
    </a>
    <span class="eyebrow">{{ rider().country }} · {{ rider().category }}</span>
    <p>{{ rider().desc }}</p>
    <div class="races">
      @for (r of rider().races; track r) {
        @let race = data.race(r);
        <span class="tag" [class.tag-dark]="!$first">P{{ race?.num }} {{ race?.short }}</span>
      }
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      align-content: start;
    }
    a {
      text-decoration: none;
      display: grid;
      gap: 12px;
    }
    a:hover h3 {
      color: var(--signal);
    }
    app-rider-avatar {
      transition: transform 0.4s var(--ease);
    }
    a:hover app-rider-avatar {
      transform: translateY(-4px);
    }
    p {
      color: var(--muted-2);
      font-size: 14.5px;
    }
    .races {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
  `,
})
export class RiderCard {
  readonly rider = input.required<Rider>();
  protected data = inject(DataService);
}
