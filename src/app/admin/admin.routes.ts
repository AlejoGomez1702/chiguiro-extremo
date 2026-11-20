import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./admin-shell'),
    children: [
      { path: '', loadComponent: () => import('./overview'), title: 'Resumen · Panel Copa LATAM DH' },
      { path: 'eventos', loadComponent: () => import('./races-admin'), title: 'Eventos · Panel Copa LATAM DH' },
      { path: 'corredores', loadComponent: () => import('./riders-admin'), title: 'Corredores · Panel Copa LATAM DH' },
      { path: 'noticias', loadComponent: () => import('./posts-admin'), title: 'Noticias · Panel Copa LATAM DH' },
      { path: 'productos', loadComponent: () => import('./products-admin'), title: 'Productos · Panel Copa LATAM DH' },
      { path: 'inicio', loadComponent: () => import('./home-admin'), title: 'Inicio y galería · Panel Copa LATAM DH' },
      { path: '**', redirectTo: '' },
    ],
  },
] satisfies Routes;
