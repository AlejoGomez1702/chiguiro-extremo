import { Injectable, NgZone, inject, signal } from '@angular/core';
import type Lenis from 'lenis';

/** Scroll suave (Lenis) sincronizado con el ticker de GSAP. Solo navegador. */
@Injectable({ providedIn: 'root' })
export class SmoothScroll {
  private zone = inject(NgZone);
  private lenis?: Lenis;
  /** posición de scroll en px, actualizada en cada frame */
  readonly y = signal(0);

  async init() {
    if (this.lenis) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const [{ default: LenisCtor }, { gsap }, { ScrollTrigger }] = await Promise.all([
      import('lenis'),
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    gsap.registerPlugin(ScrollTrigger);
    this.zone.runOutsideAngular(() => {
      const lenis = new LenisCtor({ lerp: reduce ? 1 : 0.09, smoothWheel: !reduce, anchors: true });
      lenis.on('scroll', (l: Lenis) => {
        ScrollTrigger.update();
        this.y.set(l.scroll);
      });
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      this.lenis = lenis;
      (window as unknown as { __lenis: Lenis }).__lenis = lenis;
    });
    this.y.set(scrollY);
  }

  toTop() {
    if (this.lenis) this.lenis.scrollTo(0, { immediate: true });
    else if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }

  scrollTo(target: string | number) {
    this.lenis?.scrollTo(target, { offset: -72 });
  }
}
