import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./admin-shell'),
    children: [
      { path: '', loadComponent: () => import('./overview'), title: 'Resumen · Panel Chigüiro Extremo' },
      { path: 'eventos', loadComponent: () => import('./events-admin'), title: 'Eventos · Panel Chigüiro Extremo' },
      { path: 'eventos/:id', loadComponent: () => import('./event-editor'), title: 'Personalizar evento · Panel Chigüiro Extremo' },
      { path: 'paradas', loadComponent: () => import('./races-admin'), title: 'Paradas · Panel Chigüiro Extremo' },
      { path: 'corredores', loadComponent: () => import('./riders-admin'), title: 'Riders · Panel Chigüiro Extremo' },
      { path: 'noticias', loadComponent: () => import('./posts-admin'), title: 'Cobertura · Panel Chigüiro Extremo' },
      { path: 'productos', loadComponent: () => import('./products-admin'), title: 'Tienda · Panel Chigüiro Extremo' },
      { path: 'inicio', loadComponent: () => import('./home-admin'), title: 'Evento principal · Panel Chigüiro Extremo' },
      { path: '**', redirectTo: '' },
    ],
  },
] satisfies Routes;
