# Copa LATAM Downhill Urbano · sitio 3D

Angular 21 (SSR + prerender) con un descenso urbano en 3D (Three.js) y despliegue en Cloudflare Workers.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo en http://localhost:4200 |
| `npm run build` | Build de producción (`dist/browser` + `dist/server`), prerenderiza 36 rutas |
| `npm run preview` | Build + `wrangler dev` (worker local en http://localhost:8787) |
| `npm run deploy` | Build + `wrangler deploy` a Cloudflare Workers |

Requisitos: Node ≥ 20.19 (Angular 21). Para subir a Angular 22 hace falta Node ≥ 24.15.

## Estructura

- `src/app/three/`: motor 3D, que se carga solo en el navegador y en diferido.
  - `world/track-profile.ts`: trazado (pendientes, curvas y secciones). No depende de three.
  - `world/track.ts`, `track-mesh.ts`: pista, escalinata, salto, drop y plaza.
  - `world/city.ts`: edificios reales extruidos, ventanas por shader, detalle 3D junto a la pista, calles de OSM, cables y banderines.
  - `world/geo-data.ts`: carga los datos reales y responde altura del terreno y si hay edificio en un punto.
  - `world/terrain.ts`: relieve real (malla de 8 m + anillo de 32 m), cordillera, árboles y palmas de cera.
  - `world/props.ts`: faroles, vallas, público animado, salida, meta, fan zone y catedral.
  - `world/rider.ts`: bicicleta de descenso y piloto procedurales.
  - `descent-scene.ts`: render, posprocesado (N8AO, bloom, ACES), cámara por scroll, modo mapa con pines y calidad adaptativa.
  - `sky-fog.ts`: niebla con el color del cielo HDRI (perspectiva aérea).
- `src/app/pages/`: páginas públicas (inicio, carreras, ficha con trazado 3D, corredores, cobertura, tienda y La Copa).
- `src/app/admin/`: panel (dashboard) en modo demo.
- `src/app/core/data/`: modelo de dominio y datos de ejemplo. `DataService` es el punto donde se conecta Supabase.
- `public/assets/`: texturas, HDRI y modelos CC0 de Poly Haven ya optimizados (webp/glb con meshopt).
- `public/assets/geo/manizales.json` y `world/route-data.ts`: Manizales real (3.791 edificios y 579 calles de OpenStreetMap, relieve Copernicus). Se regeneran con `tools/geo/` (ver su README).

## Cloudflare

`wrangler.jsonc` sirve `dist/browser` como assets estáticos, incluido el HTML prerenderizado. El worker (`src/server.ts`) solo renderiza lo que no está prerenderizado. Al usar un dominio propio, agrégalo a `security.allowedHosts` en `angular.json`.

## Pendiente

- Conectar Supabase: tablas races, riders, posts y products, autenticación del panel y storage de imágenes.
- Pasarelas de pago por país en la tienda.
- Fotos y videos reales en lugar de las ilustraciones del demo.
