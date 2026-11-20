import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { DescentScene, PinScreen, SceneMode } from './descent-scene';

/**
 * Lienzo WebGL del descenso. El motor (three + posprocesado) se importa de
 * forma diferida en el navegador: el HTML del servidor no carga nada de 3D.
 */
@Component({
  selector: 'app-descent-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #canvas aria-hidden="true"></canvas>
    @if (state() !== 'ready') {
      <div class="loader" [class.failed]="state() === 'failed'">
        @if (state() === 'failed') {
          <span class="mono">Vista 3D no disponible en este dispositivo</span>
        } @else {
          <span class="mono">Cargando la pista · {{ pct() }}%</span>
          <span class="bar"><i [style.transform]="'scaleX(' + pct() / 100 + ')'"></i></span>
        }
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      overflow: hidden;
      background:
        radial-gradient(120% 80% at 70% 30%, #e9b98a 0%, #8c6b56 32%, #2b2a2c 70%, #121212 100%);
    }
    canvas {
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 1.2s ease;
      touch-action: pan-y;
    }
    :host(.ready) canvas {
      opacity: 1;
    }
    .loader {
      position: absolute;
      left: 50%;
      bottom: 28px;
      transform: translateX(-50%);
      display: grid;
      gap: 8px;
      justify-items: center;
      color: var(--bone);
      text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
    }
    .bar {
      width: 180px;
      height: 2px;
      background: rgba(242, 239, 233, 0.25);
      overflow: hidden;
    }
    .bar i {
      display: block;
      height: 100%;
      background: var(--signal);
      transform-origin: left;
      transition: transform 0.3s;
    }
  `,
  host: { '[class.ready]': "state() === 'ready'" },
})
export class DescentCanvas {
  readonly mode = input<SceneMode>('ride');
  /** distancia objetivo sobre la pista (m), modo recorrido */
  readonly target = input(0);
  readonly focusPin = input<string | null>(null);
  readonly pins = output<PinScreen[]>();
  readonly ready = output<void>();

  protected readonly state = signal<'loading' | 'ready' | 'failed'>('loading');
  protected readonly pct = signal(0);
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private host = inject(ElementRef<HTMLElement>);
  private scene?: DescentScene;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(async () => {
      const el = this.canvas().nativeElement;
      if (!this.webglAvailable()) {
        this.state.set('failed');
        return;
      }
      try {
        const { DescentScene } = await import('./descent-scene');
        const scene = await DescentScene.create(el, {
          mode: this.mode(),
          onProgress: (p) => this.pct.set(Math.round(p * 100)),
          onPins: (p) => this.pins.emit(p),
        });
        if (this.destroyed) {
          scene.dispose();
          return;
        }
        this.scene = scene;
        scene.setTarget(this.target());
        this.state.set('ready');
        this.ready.emit();
      } catch (e) {
        console.error('[3D]', e);
        this.state.set('failed');
      }
      const ro = new ResizeObserver(() => this.scene?.resize());
      ro.observe(this.host.nativeElement);
      const io = new IntersectionObserver(([en]) => this.scene?.setActive(en.isIntersecting));
      io.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => {
        ro.disconnect();
        io.disconnect();
      });
    });
    destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.scene?.dispose();
    });
    effect(() => {
      const t = this.target();
      this.scene?.setTarget(t);
    });
    effect(() => {
      const id = this.focusPin();
      if (id) this.scene?.focusPin(id);
    });
  }
  private destroyed = false;

  private webglAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!c.getContext('webgl2');
    } catch {
      return false;
    }
  }
}
