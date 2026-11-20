import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marca del sitio: logotipo Chigüiro Extremo (asset del Figma, teñido con currentColor). */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<i class="mark" aria-hidden="true"></i>`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
    }
    .mark {
      display: block;
      width: 116px;
      height: 24px;
      background: currentColor;
      mask: url(/assets/brand/chiguiro-mark.svg) center / contain no-repeat;
    }
  `,
})
export class Logo {}
