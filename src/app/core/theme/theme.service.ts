import { Injectable, computed, inject, signal } from '@angular/core';
import { DataService } from '../data/data.service';
import { EventTheme, themeVars } from './brand';

/**
 * Marca activa del sitio. Por defecto es la del evento principal; la página de
 * un evento la reemplaza mientras se visita, para que cabecera y pie hablen su
 * mismo idioma de color.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private data = inject(DataService);
  private override = signal<EventTheme | null>(null);

  readonly theme = computed(() => this.override() ?? this.data.featured().theme);
  /** variables CSS que app-root aplica como estilo en línea */
  readonly vars = computed(() => themeVars(this.theme()));

  use(theme: EventTheme | null) {
    this.override.set(theme);
  }
}
