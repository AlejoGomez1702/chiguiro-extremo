import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, signal, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data/data.service';
import { Pin } from '../../core/data/models';
import { Seo } from '../../core/seo';
import { PostCard } from '../../shared/post-card';
import { ProductArt } from '../../shared/product-art';
import { RiderCard } from '../../shared/rider-card';
import { DescentCanvas } from '../../three/descent-canvas';
import type { PinScreen } from '../../three/descent-scene';

const STATES = [
  { id: 'antes', label: 'Antes' },
  { id: 'durante', label: 'Durante' },
  { id: 'despues', label: 'Después' },
] as const;

@Component({
  selector: 'app-race-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DescentCanvas, PostCard, ProductArt, RiderCard],
  templateUrl: './race.html',
  styleUrl: './race.scss',
})
export default class RacePage {
  readonly id = input.required<string>();
  protected data = inject(DataService);
  private seo = inject(Seo);
  protected race = computed(() => this.data.race(this.id()));
  protected posts = computed(() => this.data.postsFor(this.id()));
  protected riders = computed(() => this.data.riders().filter((r) => r.races.includes(this.id())));
  protected products = computed(() => this.data.products().filter((p) => p.col === this.id()));
  protected days = computed(() => (this.race() ? this.data.daysTo(this.race()!) : null));
  protected states = STATES;
  protected phase = signal<(typeof STATES)[number]['id']>('antes');

  protected groups = computed(() => {
    const out = new Map<string, Pin[]>();
    for (const p of this.data.pins) out.set(p.group, [...(out.get(p.group) ?? []), p]);
    return [...out.entries()];
  });
  protected selected = signal<Pin | null>(null);
  protected focus = signal<string | null>(null);
  private pinEls = viewChildren<ElementRef<HTMLElement>>('pinEl');

  constructor() {
    effect(() => {
      const r = this.race();
      if (r) this.seo.set(`Parada ${r.num} · ${r.title}`, `${r.date}. ${r.place}. Trazado 3D, horarios, accesos y cobertura.`);
    });
  }

  protected pick(p: Pin) {
    this.selected.set(p);
    // reinicia el foco para que se pueda volver al mismo pin
    this.focus.set(null);
    queueMicrotask(() => this.focus.set(p.id));
  }

  protected goPin(id: string) {
    const p = this.data.pins.find((x) => x.id === id);
    if (!p) return;
    this.pick(p);
    document.getElementById('trazado')?.scrollIntoView({ behavior: 'smooth' });
  }

  /** Posiciona los pines sobre el lienzo directamente (60 fps, sin señales). */
  protected onPins(list: PinScreen[]) {
    const els = this.pinEls();
    for (const el of els) {
      const node = el.nativeElement;
      const p = list.find((x) => x.id === node.dataset['pin']);
      if (!p) continue;
      node.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      node.style.visibility = p.visible ? 'visible' : 'hidden';
    }
  }
}
