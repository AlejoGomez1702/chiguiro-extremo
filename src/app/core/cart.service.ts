import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DataService } from './data/data.service';
import { CartLine } from './data/models';

const KEY = 'copa-dh-cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private data = inject(DataService);
  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly lines = signal<CartLine[]>(this.restore());
  readonly open = signal(false);
  readonly count = computed(() => this.lines().reduce((a, l) => a + l.qty, 0));
  readonly total = computed(() =>
    this.lines().reduce((a, l) => a + (this.data.product(l.productId)?.price ?? 0) * l.qty, 0),
  );

  constructor() {
    effect(() => {
      const l = this.lines();
      if (!this.browser) return;
      try {
        localStorage.setItem(KEY, JSON.stringify(l));
      } catch {
        /* almacenamiento no disponible */
      }
    });
  }

  private restore(): CartLine[] {
    if (!this.browser) return [];
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  add(productId: string, color: number, size: string) {
    this.lines.update((ls) => {
      const i = ls.findIndex((l) => l.productId === productId && l.color === color && l.size === size);
      if (i >= 0) return ls.map((l, k) => (k === i ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { productId, color, size, qty: 1 }];
    });
    this.open.set(true);
  }

  setQty(index: number, qty: number) {
    this.lines.update((ls) => (qty <= 0 ? ls.filter((_, k) => k !== index) : ls.map((l, k) => (k === index ? { ...l, qty } : l))));
  }
}
