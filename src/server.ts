import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

/**
 * Servidor SSR para Cloudflare Workers. Los archivos estáticos y las rutas
 * prerenderizadas los sirve el binding de assets antes de llegar aquí; el
 * worker solo renderiza lo que no existe como HTML estático.
 */
const angularApp = new AngularAppEngine({
  // localhost para `wrangler dev`; en producción se suma el dominio desde angular.json
  allowedHosts: ['localhost', '127.0.0.1'],
});

export const reqHandler = createRequestHandler(async (req) => {
  const res = await angularApp.handle(req);
  return res ?? new Response('Página no encontrada', { status: 404 });
});

export default { fetch: reqHandler };
