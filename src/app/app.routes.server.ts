import { RenderMode, ServerRoute } from '@angular/ssr';
import { EVENTS, POSTS, PRODUCTS, RACES, RIDERS } from './core/data/mock-data';

/**
 * Todo el contenido público se prerenderiza (HTML estático servido por
 * Cloudflare). Cuando los datos vengan de Supabase, las fichas pueden pasar a
 * RenderMode.Server para reflejar cambios sin recompilar.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'eventos/:id', renderMode: RenderMode.Prerender, getPrerenderParams: async () => EVENTS.filter((e) => e.status !== 'borrador').map((e) => ({ id: e.id })) },
  { path: 'carreras/:id', renderMode: RenderMode.Prerender, getPrerenderParams: async () => RACES.map((r) => ({ id: r.id })) },
  { path: 'corredores/:id', renderMode: RenderMode.Prerender, getPrerenderParams: async () => RIDERS.map((r) => ({ id: r.id })) },
  { path: 'cobertura/:id', renderMode: RenderMode.Prerender, getPrerenderParams: async () => POSTS.map((p) => ({ id: p.id })) },
  { path: 'tienda/:id', renderMode: RenderMode.Prerender, getPrerenderParams: async () => PRODUCTS.map((p) => ({ id: p.id })) },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'admin', renderMode: RenderMode.Client },
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'carreras', renderMode: RenderMode.Prerender },
  { path: 'corredores', renderMode: RenderMode.Prerender },
  { path: 'cobertura', renderMode: RenderMode.Prerender },
  { path: 'tienda', renderMode: RenderMode.Prerender },
  { path: 'eventos', renderMode: RenderMode.Prerender },
  { path: 'serie', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Server },
];
