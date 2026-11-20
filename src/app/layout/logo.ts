import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="3" fill="#FF5B1F" />
      <path d="M6 9h7v6h7v6h7v6h3" stroke="#121212" stroke-width="3.6" fill="none" stroke-linecap="square" />
    </svg>
    <span class="txt">
      <b>COPA LATAM</b>
      <small>DOWNHILL URBANO</small>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    svg {
      width: 36px;
      height: 36px;
      flex: none;
    }
    .txt {
      display: grid;
      line-height: 0.9;
    }
    b {
      font-family: var(--display);
      font-weight: 900;
      font-size: 21px;
      letter-spacing: -0.01em;
    }
    small {
      font-family: var(--mono);
      font-weight: 700;
      font-size: 9.5px;
      letter-spacing: 0.08em;
      color: var(--signal);
    }
  `,
})
export class Logo {}
