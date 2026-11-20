import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home'), title: 'Copa LATAM Downhill Urbano 2027' },
  { path: 'carreras', loadComponent: () => import('./pages/races/races'), title: 'Carreras · Copa LATAM DH' },
  { path: 'carreras/:id', loadComponent: () => import('./pages/race/race') },
  { path: 'corredores', loadComponent: () => import('./pages/riders/riders'), title: 'Corredores · Copa LATAM DH' },
  { path: 'corredores/:id', loadComponent: () => import('./pages/rider/rider') },
  { path: 'cobertura', loadComponent: () => import('./pages/coverage/coverage'), title: 'Cobertura · Copa LATAM DH' },
  { path: 'cobertura/:id', loadComponent: () => import('./pages/post/post') },
  { path: 'tienda', loadComponent: () => import('./pages/shop/shop'), title: 'Tienda oficial · Copa LATAM DH' },
  { path: 'tienda/:id', loadComponent: () => import('./pages/product/product') },
  { path: 'copa', loadComponent: () => import('./pages/cup/cup'), title: 'La Copa · Copa LATAM DH' },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes'), title: 'Panel · Copa LATAM DH' },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found'), title: 'Página no encontrada' },
];
