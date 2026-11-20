import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data/data.service';
import { PageHead } from '../../shared/page-head';

@Component({
  selector: 'app-races',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHead],
  template: `
    <app-page-head eyebrow="Temporada 2027" title="Carreras" lead="Calendario de las tres paradas y clasificación general de la Copa." />

    <section class="section" aria-labelledby="cal-t">
      <div class="container">
        <h2 id="cal-t" class="display display-m">Calendario</h2>
        <ol class="cal">
          @for (r of data.races(); track r.id) {
            <li [class.next]="r.isNext">
              <a [routerLink]="['/carreras', r.id]">
                <figure>
                  @if (r.img) {
                    <img [src]="r.img" alt="" loading="lazy" />
                  } @else {
                    <span class="tba display">{{ r.code }}</span>
                  }
                  <span class="num display">{{ r.num }}</span>
                </figure>
                <div class="body">
                  <span class="tag" [class.tag-ink-line]="!r.isNext">{{ r.statusLabel }}</span>
                  <h3 class="display display-s">{{ r.title }}</h3>
                  <p>{{ r.place }}</p>
                  <p class="mono date">{{ r.date }}</p>
                  <p class="insc">{{ r.insc }}</p>
                  <span class="link-arrow">Ver carrera →</span>
                </div>
              </a>
            </li>
          }
        </ol>
      </div>
    </section>

    <section class="section section-light" aria-labelledby="gen-t">
      <div class="container">
        <span class="eyebrow">Copa general</span>
        <h2 id="gen-t" class="display display-m">Clasificación general</h2>
        <div class="filters" role="tablist" aria-label="Categoría">
          @for (c of categories(); track c) {
            <button type="button" role="tab" [attr.aria-selected]="cat() === c" [class.on]="cat() === c" (click)="cat.set(c)">{{ c }}</button>
          }
        </div>
        <div class="table-wrap">
          <table>
            <caption class="sr-only">Clasificación {{ cat() }}</caption>
            <thead>
              <tr>
                <th scope="col">Pos.</th>
                <th scope="col">Piloto</th>
                <th scope="col">País</th>
                @for (r of data.races(); track r.id) {
                  <th scope="col" class="num">P{{ r.num }}</th>
                }
                <th scope="col" class="num">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id; let i = $index) {
                <tr>
                  <td class="pos display">{{ i + 1 }}</td>
                  <td>
                    <a [routerLink]="['/corredores', row.id]">
                      <span class="plate" [style.background]="row.bg" [style.color]="row.fg">{{ row.plate }}</span>
                      {{ row.name }}
                    </a>
                  </td>
                  <td class="mono">{{ row.cc }}</td>
                  @for (r of data.races(); track r.id) {
                    <td class="num mono">—</td>
                  }
                  <td class="num total">0</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="note">La clasificación se actualiza al terminar cada parada. Orden provisional por número de placa.</p>
      </div>
    </section>
  `,
  styles: `
    .cal {
      list-style: none;
      margin: 28px 0 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: 16px;
    }
    li a {
      display: grid;
      height: 100%;
      text-decoration: none;
      background: var(--ink-2);
      border: 1px solid var(--line);
      border-radius: 4px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    li:not(.next) a {
      border-style: dashed;
    }
    li a:hover {
      border-color: var(--signal);
    }
    figure {
      position: relative;
      margin: 0;
      aspect-ratio: 16 / 9;
      background: repeating-linear-gradient(-45deg, var(--ink-3) 0 12px, var(--ink-2) 12px 24px);
      display: grid;
      place-items: center;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .tba {
      font-size: 72px;
      color: var(--line-2);
    }
    .num {
      position: absolute;
      left: 12px;
      bottom: 6px;
      font-size: 56px;
      color: var(--bone);
      text-shadow: 0 2px 16px rgba(0, 0, 0, 0.6);
    }
    .body {
      padding: 18px;
      display: grid;
      gap: 6px;
      justify-items: start;
    }
    .body p {
      color: var(--muted-2);
    }
    .date {
      color: var(--bone) !important;
    }
    .insc {
      font-size: 14px;
    }
    .filters {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin: 24px 0 16px;
    }
    .filters button {
      border: 1px solid #cfc9bd;
      background: transparent;
      padding: 8px 14px;
      border-radius: 3px;
      font-weight: 700;
      cursor: pointer;
      color: var(--ink);
    }
    .filters button.on {
      background: var(--ink);
      color: var(--bone);
      border-color: var(--ink);
    }
    .table-wrap {
      overflow-x: auto;
      border: 1px solid #ddd6c8;
      border-radius: 4px;
      background: #fff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 560px;
    }
    th {
      font: 700 11px var(--mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-align: left;
      color: #6b665d;
      padding: 12px 14px;
      border-bottom: 1px solid #ddd6c8;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #eee8dc;
      color: var(--ink);
    }
    td a {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      text-decoration: none;
    }
    td a:hover {
      color: var(--brick);
    }
    .plate {
      font: 900 15px var(--display);
      padding: 2px 6px;
      border-radius: 2px;
      min-width: 30px;
      text-align: center;
    }
    .pos {
      font-size: 22px;
      width: 56px;
    }
    .num {
      text-align: right;
    }
    .total {
      font-weight: 800;
    }
    .note {
      margin-top: 12px;
      color: #6b665d;
    }
  `,
})
export default class Races {
  protected data = inject(DataService);
  protected categories = this.data.categories;
  protected cat = signal(this.data.categories()[0] ?? 'Élite Hombres');
  protected rows = computed(() =>
    this.data
      .riders()
      .filter((r) => r.category === this.cat())
      .sort((a, b) => +a.plate - +b.plate),
  );
}
