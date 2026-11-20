import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Layout del panel: barra lateral + área de contenido.
 * Los estilos van sin encapsulación (prefijo .adm) para que las secciones hijas
 * compartan formularios, tablas y botones.
 */
@Component({
  selector: 'app-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="adm">
      <aside class="adm-side" aria-label="Secciones del panel">
        <div class="adm-brand">
          <span class="eyebrow">Panel</span>
          <strong>Chigüiro Extremo</strong>
        </div>
        <nav class="adm-nav">
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: l.exact }">
              {{ l.label }}
            </a>
          }
        </nav>
        <a routerLink="/" class="adm-back mono">← Ver sitio</a>
      </aside>
      <main class="adm-main">
        <p class="adm-demo" role="status">
          <span class="tag">Demo</span>
          Modo demo: los cambios se guardan solo en esta sesión. Conexión con Supabase pendiente.
        </p>
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .adm {
      --adm-side: 232px;
      display: grid;
      grid-template-columns: var(--adm-side) minmax(0, 1fr);
      min-height: 100vh;
      padding-top: var(--header-h);
      background: var(--ink);
    }
    .adm-side {
      position: sticky;
      top: var(--header-h);
      align-self: start;
      height: calc(100vh - var(--header-h));
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 28px 16px;
      background: var(--ink-2);
      border-right: 1px solid var(--line);
    }
    .adm-brand {
      display: grid;
      gap: 6px;
      padding-inline: 8px;
    }
    .adm-brand strong {
      font: var(--type-h3);
      font-size: 22px;
      letter-spacing: -0.02em;
    }
    .adm-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .adm-nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius);
      font-weight: 500;
      font-size: 15px;
      text-decoration: none;
      color: var(--muted-2);
      border-left: 2px solid transparent;
      transition:
        background 0.2s,
        color 0.2s;
    }
    .adm-nav a .mono {
      color: var(--muted-3);
      font-size: 13px;
    }
    .adm-nav a:hover {
      background: var(--ink-3);
      color: var(--bone);
    }
    .adm-nav a.active {
      background: var(--ink-3);
      color: var(--bone);
      border-left-color: var(--signal);
    }
    .adm-nav a.active .mono {
      color: var(--signal);
    }
    .adm-back {
      margin-top: auto;
      padding: 8px 12px;
      color: var(--muted);
      text-decoration: none;
    }
    .adm-back:hover {
      color: var(--signal);
    }
    .adm-main {
      min-width: 0;
      padding: 28px clamp(16px, 3vw, 40px) 80px;
    }
    .adm-demo {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 28px;
      padding: 10px 14px;
      border: 1px dashed var(--line-2);
      border-radius: var(--radius);
      font-family: var(--font-primary);
      font-size: 12px;
      color: var(--muted-2);
      background: var(--color-accent-soft);
    }

    @media (max-width: 860px) {
      .adm {
        grid-template-columns: minmax(0, 1fr);
      }
      .adm-side {
        position: sticky;
        top: var(--header-h);
        z-index: 10;
        height: auto;
        flex-direction: row;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border-right: 0;
        border-bottom: 1px solid var(--line);
        overflow-x: auto;
        scrollbar-width: none;
      }
      .adm-brand,
      .adm-back {
        display: none;
      }
      .adm-nav {
        flex-direction: row;
      }
      .adm-nav a {
        white-space: nowrap;
        border-left: 0;
        border-bottom: 2px solid transparent;
        border-radius: 0;
      }
      .adm-nav a.active {
        border-bottom-color: var(--signal);
      }
    }

    /* ---------- piezas compartidas por las secciones ---------- */
    .adm-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .adm-head h1 {
      margin-top: 6px;
    }
    .adm-head p {
      color: var(--muted);
      margin-top: 8px;
      max-width: 60ch;
    }
    .adm-card {
      background: var(--ink-2);
      border: 1px solid var(--line);
      border-radius: var(--radius-m);
      padding: 20px;
    }
    .adm-card h2 {
      font: var(--type-h3);
      font-size: 22px;
      letter-spacing: -0.02em;
      margin-bottom: 16px;
    }
    .adm-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .adm-chip {
      font-family: var(--font-primary);
      font-size: 13px;
      font-weight: 500;
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid var(--line-2);
      background: transparent;
      color: var(--muted-2);
      cursor: pointer;
    }
    .adm-chip:hover {
      color: var(--bone);
      border-color: var(--muted-3);
    }
    .adm-chip[aria-pressed='true'] {
      background: var(--signal);
      border-color: var(--signal);
      color: var(--ink);
    }
    .adm-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: var(--radius-m);
    }
    .adm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .adm-table th {
      text-align: left;
      font-family: var(--font-primary);
      font-size: 13px;
      color: var(--muted);
      font-weight: 500;
      padding: 12px 14px;
      background: var(--ink-2);
      border-bottom: 1px solid var(--line);
      white-space: nowrap;
    }
    .adm-table td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      vertical-align: middle;
    }
    .adm-table tr:last-child td {
      border-bottom: 0;
    }
    .adm-table tbody tr:hover {
      background: var(--ink-3);
    }
    .adm-table tr.is-editing {
      background: var(--color-accent-soft);
    }
    .adm-table .muted {
      color: var(--muted);
    }
    .adm-actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      white-space: nowrap;
    }
    .adm-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 32px;
      padding: 0 12px;
      border-radius: var(--radius-s);
      border: 1px solid var(--line-2);
      background: transparent;
      color: var(--bone);
      font-family: var(--font-primary);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
    }
    .adm-btn:hover {
      border-color: var(--bone);
    }
    .adm-btn.danger {
      color: var(--dt-danger);
      border-color: color-mix(in srgb, var(--dt-danger) 45%, transparent);
    }
    .adm-btn.danger:hover {
      background: var(--signal);
      color: var(--ink);
      border-color: var(--signal);
    }
    .adm-split {
      display: grid;
      gap: 24px;
      grid-template-columns: minmax(0, 1fr);
    }
    .adm-form {
      display: grid;
      gap: 16px;
    }
    .adm-form-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .adm-form-head h2 {
      margin: 0;
    }
    .adm-grid {
      display: grid;
      gap: 14px 16px;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
    }
    .adm-fld {
      display: grid;
      gap: 6px;
      align-content: start;
    }
    .adm-fld.wide {
      grid-column: 1 / -1;
    }
    .adm-fld > span,
    .adm-legend {
      font-family: var(--font-primary);
      font-size: 13px;
      font-weight: 500;
      color: var(--muted);
    }
    .adm-fld small {
      color: var(--muted-3);
      font-size: 12px;
    }
    .adm input:not([type='checkbox']):not([type='radio']):not([type='color']),
    .adm select,
    .adm textarea {
      width: 100%;
      min-height: 40px;
      padding: 8px 12px;
      background: var(--ink);
      color: var(--bone);
      border: 1px solid var(--line-2);
      border-radius: var(--radius-s);
      font: inherit;
      font-size: 15px;
    }
    .adm textarea {
      min-height: 120px;
      resize: vertical;
      line-height: 1.5;
    }
    .adm input:focus,
    .adm select:focus,
    .adm textarea:focus {
      outline: none;
      border-color: var(--signal);
      box-shadow: 0 0 0 1px var(--signal);
    }
    .adm input.ng-invalid.ng-touched,
    .adm select.ng-invalid.ng-touched {
      border-color: var(--dt-danger);
    }
    .adm input[type='checkbox'],
    .adm input[type='radio'] {
      accent-color: var(--signal);
      width: 16px;
      height: 16px;
    }
    .adm input[type='color'] {
      width: 100%;
      height: 40px;
      padding: 2px;
      background: var(--ink);
      border: 1px solid var(--line-2);
      border-radius: var(--radius-s);
      cursor: pointer;
    }
    .adm-chk {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      cursor: pointer;
    }
    .adm fieldset {
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 12px 14px;
      margin: 0;
    }
    .adm fieldset legend {
      padding: 0 6px;
    }
    .adm-checks {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 18px;
    }
    .adm-form-foot {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid var(--line);
    }
    .adm-err {
      color: var(--dt-danger);
      font-family: var(--font-primary);
      font-size: 12px;
    }
    .adm-empty {
      padding: 32px;
      text-align: center;
      color: var(--muted);
      font-family: var(--font-primary);
      font-size: 12px;
    }
    .adm-swatch {
      display: inline-block;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid var(--line-2);
      vertical-align: middle;
    }
    .adm-thumb {
      width: 56px;
      height: 40px;
      object-fit: cover;
      border-radius: 2px;
      background: var(--ink-3);
    }
  `,
})
export default class AdminShell {
  protected links = [
    { path: '/admin', label: 'Resumen', n: '00', exact: true },
    { path: '/admin/eventos', label: 'Eventos', n: '01', exact: false },
    { path: '/admin/paradas', label: 'Paradas', n: '02', exact: false },
    { path: '/admin/corredores', label: 'Riders', n: '03', exact: false },
    { path: '/admin/noticias', label: 'Cobertura', n: '04', exact: false },
    { path: '/admin/productos', label: 'Tienda', n: '05', exact: false },
    { path: '/admin/inicio', label: 'Evento principal', n: '06', exact: false },
  ];
}
