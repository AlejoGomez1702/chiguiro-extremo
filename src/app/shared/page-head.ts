import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-head',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      @if (eyebrow()) {
        <span class="eyebrow">{{ eyebrow() }}</span>
      }
      <h1 class="display display-l">{{ title() }}</h1>
      @if (lead()) {
        <p class="lead">{{ lead() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: calc(var(--header-h) + clamp(40px, 7vw, 88px)) 0 clamp(32px, 5vw, 56px);
      background:
        radial-gradient(80% 120% at 85% 0%, color-mix(in srgb, var(--brand-primary) 30%, transparent), transparent 60%),
        var(--ink);
      border-bottom: 1px solid var(--line);
    }
    .container {
      display: grid;
      gap: 14px;
      justify-items: start;
    }
  `,
})
export class PageHead {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly lead = input('');
}
