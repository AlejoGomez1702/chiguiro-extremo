# Datos geográficos reales (Parada 01 · Manizales)

Scripts que generan `src/app/three/world/route-data.ts` y `public/assets/geo/manizales.json`.
Se ejecutan desde una carpeta de trabajo, fuera del proyecto, que tenga una subcarpeta `geo/`.

Dependencias (instálalas en esa carpeta): `npm i geotiff@2 sharp @gltf-transform/cli@4`

1. **Relieve:** descarga la tesela Copernicus GLO-30 en `geo/dem.tif` y recórtala con `node dem.mjs`.
   ```
   curl -o geo/dem.tif https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N05_00_W076_00_DEM/Copernicus_DSM_COG_10_N05_00_W076_00_DEM.tif
   ```
2. **Calles y edificios:** consulta Overpass (OpenStreetMap) y guarda el resultado en `geo/osm.json`. La consulta pide `highway`, `building` y `leisure=park` dentro del recuadro 5.040,-75.535,5.080,-75.495.
3. **Ruta:** `node route3.mjs` arma Calle 23 Córdoba → escalinata Calle 26A → Carrera 39 y guarda `geo/route.json`.
4. **Datos finales:** `node geo-build.mjs <ruta-del-proyecto>` escribe el TS de la ruta y el JSON de la ciudad.

`prep.mjs` descarga y optimiza las texturas, el HDRI y los modelos CC0 de Poly Haven.

Atribución: © colaboradores de OpenStreetMap (ODbL). Copernicus DEM © DLR e.V. 2010-2014 y © Airbus Defence and Space GmbH 2014-2018, distribuido por ESA.
