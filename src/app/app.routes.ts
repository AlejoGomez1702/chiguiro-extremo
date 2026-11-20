import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home'), title: 'Chigüiro Extremo · Descenso urbano en Latinoamérica' },
  { path: 'eventos', loadComponent: () => import('./pages/events/events'), title: 'Eventos · Chigüiro Extremo' },
  { path: 'eventos/:id', loadComponent: () => import('./pages/event/event') },
  { path: 'carreras', loadComponent: () => import('./pages/races/races'), title: 'Paradas · Chigüiro Extremo' },
  { path: 'carreras/:id', loadComponent: () => import('./pages/race/race') },
  { path: 'corredores', loadComponent: () => import('./pages/riders/riders'), title: 'Riders · Chigüiro Extremo' },
  { path: 'corredores/:id', loadComponent: () => import('./pages/rider/rider') },
  { path: 'cobertura', loadComponent: () => import('./pages/coverage/coverage'), title: 'Cobertura · Chigüiro Extremo' },
  { path: 'cobertura/:id', loadComponent: () => import('./pages/post/post') },
  { path: 'tienda', loadComponent: () => import('./pages/shop/shop'), title: 'Tienda oficial · Chigüiro Extremo' },
  { path: 'tienda/:id', loadComponent: () => import('./pages/product/product') },
  { path: 'serie', loadComponent: () => import('./pages/cup/cup'), title: 'La serie · Chigüiro Extremo' },
  { path: 'copa', redirectTo: 'serie' },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes'), title: 'Panel · Chigüiro Extremo' },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found'), title: 'Página no encontrada' },
];
