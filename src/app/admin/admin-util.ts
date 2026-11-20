/** Utilidades compartidas del panel. */

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

/** Confirmación nativa; solo se ejecuta en el navegador (el panel no se renderiza en SSR). */
export function confirmDelete(label: string): boolean {
  return typeof globalThis.confirm === 'function' ? globalThis.confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`) : false;
}

export const IMAGES = [
  { src: '/assets/img/escena-escalinata.svg', label: 'Escalinata' },
  { src: '/assets/img/escena-salto.svg', label: 'Salto' },
  { src: '/assets/img/escena-muro.svg', label: 'Muro' },
  { src: '/assets/img/escena-callejon.svg', label: 'Callejón' },
];

/** Divide un texto por líneas en blanco en párrafos. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function toList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
