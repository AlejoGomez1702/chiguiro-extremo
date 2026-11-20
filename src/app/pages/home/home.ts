import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data/data.service';
import { SmoothScroll } from '../../core/smooth-scroll.service';
import { ProductArt } from '../../shared/product-art';
import { RiderAvatar } from '../../shared/rider-card';
import { DescentCanvas } from '../../three/descent-canvas';
import { NAMED_SECTIONS, SECTION, TRACK_LENGTH, altitude, groundProfile } from '../../three/world/track-profile';

/** Capítulos del recorrido: cada uno ancla la cámara en un punto de la pista. */
const ANCHORS = [
  0,
  250,
  470,
  SECTION.kicker[0] - 4,
  (SECTION.curve[0] + SECTION.curve[1]) / 2,
  SECTION.drop - 2,
  (SECTION.stairs[0] + SECTION.stairs[1]) / 2,
  SECTION.finish - 2,
];
const END_S = SECTION.finish + 42;

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DescentCanvas, ProductArt, RiderAvatar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export default class Home {
  protected data = inject(DataService);
  private scroll = inject(SmoothScroll);
  private journey = viewChild.required<ElementRef<HTMLElement>>('journey');

  protected race = this.data.nextRace;
  protected days = computed(() => this.data.daysTo(this.race()));
  protected featuredRiders = computed(() => this.data.riders().filter((r) => r.races.includes('mzl')).slice(0, 4));
  protected latest = computed(() => this.data.posts().slice(0, 3));
  protected products = computed(() => this.data.products().filter((p) => p.col === 'mzl' || p.id === 'p1').slice(0, 3));
  protected raceDay = this.data.schedule[1];

  /** medidas del recorrido (px) para mapear scroll → distancia */
  private top = signal(0);
  private chapterTops = signal<number[]>([]);
  private total = signal(1);
  protected ready = signal(false);

  protected s = computed(() => {
    const y = this.scroll.y() - this.top();
    const tops = this.chapterTops();
    if (!tops.length) return 0;
    const pts = [...tops.map((t, i) => [t, ANCHORS[i]] as const), [this.total(), END_S] as const];
    if (y <= pts[0][0]) return ANCHORS[0];
    for (let i = 0; i < pts.length - 1; i++) {
      const [y0, s0] = pts[i];
      const [y1, s1] = pts[i + 1];
      if (y <= y1) {
        const x = (y - y0) / Math.max(1, y1 - y0);
        // se detiene mientras el capítulo se lee y viaja entre capítulos
        const e = x < 0.2 ? 0 : x > 0.9 ? 1 : (x - 0.2) / 0.7;
        return s0 + (s1 - s0) * (e * e * (3 - 2 * e));
      }
    }
    return END_S;
  });

  protected section = computed(() => {
    const s = this.s();
    return [...NAMED_SECTIONS].reverse().find((n) => s >= n.s - 8)?.label ?? 'Salida';
  });
  protected km = computed(() => (Math.min(this.s(), TRACK_LENGTH) / 1000).toFixed(2).replace('.', ','));
  protected alt = computed(() => Math.round(altitude(Math.min(this.s(), TRACK_LENGTH))).toLocaleString('es-CO'));

  /** altimetría de la pista para el HUD */
  protected profilePath = (() => {
    const pts: string[] = [];
    const max = groundProfile(0);
    const min = groundProfile(TRACK_LENGTH);
    for (let s = 0; s <= TRACK_LENGTH; s += 6) {
      const x = (s / TRACK_LENGTH) * 200;
      const y = 4 + ((max - groundProfile(s)) / (max - min)) * 40;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return 'M' + pts.join(' L');
  })();
  protected marker = computed(() => {
    const s = Math.min(this.s(), TRACK_LENGTH);
    const max = groundProfile(0);
    const min = groundProfile(TRACK_LENGTH);
    return { x: (s / TRACK_LENGTH) * 200, y: 4 + ((max - groundProfile(s)) / (max - min)) * 40 };
  });
  protected sectionMarks = NAMED_SECTIONS.map((n) => ({ ...n, x: (n.s / TRACK_LENGTH) * 200 }));

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const measure = () => {
        const el = this.journey().nativeElement;
        const r = el.getBoundingClientRect();
        const top = r.top + scrollY;
        this.top.set(top);
        const chapters = [...el.querySelectorAll<HTMLElement>('.chapter')];
        this.chapterTops.set(
          chapters.map((c, i) => (i === 0 ? 0 : c.offsetTop + c.offsetHeight / 2 - innerHeight / 2)),
        );
        this.total.set(el.offsetHeight - innerHeight);
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(this.journey().nativeElement);
      addEventListener('resize', measure);

      // aparición de paneles
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.target.classList.toggle('in', e.isIntersecting)),
        { threshold: 0.15 },
      );
      this.journey()
        .nativeElement.querySelectorAll('.panel')
        .forEach((p) => io.observe(p));
      destroy.onDestroy(() => {
        ro.disconnect();
        io.disconnect();
        removeEventListener('resize', measure);
      });
    });
  }

  protected go(chapter: number) {
    const tops = this.chapterTops();
    this.scroll.scrollTo(this.top() + (tops[chapter] ?? 0) + 72);
  }
}
