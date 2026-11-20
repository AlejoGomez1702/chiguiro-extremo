// Downloads CC0 assets from Poly Haven and optimizes them for the web.
// usage: node prep.mjs <downloadDir> <publicAssetsDir>
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';

const [dl, out] = process.argv.slice(2);
const api = (id) => fetch(`https://api.polyhaven.com/files/${id}`).then((r) => r.json());
async function get(url, file) {
  try { await fs.access(file); return file; } catch {}
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' ' + r.status);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.from(await r.arrayBuffer()));
  return file;
}

const TEX = {
  road: ['worn_asphalt', 1024],
  pave: ['concrete_pavement', 1024],
  plaster: ['painted_plaster_wall', 1024],
  brick: ['red_brick', 1024],
  roof: ['clay_roof_tiles_02', 512],
  wood: ['wood_planks', 512],
  grass: ['leafy_grass', 512],
  cobble: ['cobblestone_floor_08', 1024],
};
await fs.mkdir(path.join(out, 'tex'), { recursive: true });
for (const [key, [id, size]] of Object.entries(TEX)) {
  const j = await api(id);
  for (const [map, src] of [['diff', 'Diffuse'], ['nor', 'nor_gl'], ['arm', 'arm']]) {
    const f = await get(j[src]['1k'].jpg.url, path.join(dl, 'tex', `${id}_${map}.jpg`));
    await sharp(f).resize(size, size).webp({ quality: map === 'nor' ? 85 : 78 }).toFile(path.join(out, 'tex', `${key}_${map}.webp`));
  }
  console.log('tex', key);
}

const HDRI = 'evening_road_01_puresky';
const h = await api(HDRI);
await fs.mkdir(path.join(out, 'env'), { recursive: true });
await fs.copyFile(await get(h.hdri['1k'].hdr.url, path.join(dl, 'env', `${HDRI}_1k.hdr`)), path.join(out, 'env', 'sky_1k.hdr'));
const tm = await get(h.tonemapped.url, path.join(dl, 'env', `${HDRI}.jpg`));
await sharp(tm, { limitInputPixels: false }).resize(4096, 2048).jpeg({ quality: 80, progressive: true }).toFile(path.join(out, 'env', 'sky_4k.jpg'));
await sharp(tm, { limitInputPixels: false }).resize(2048, 1024).jpeg({ quality: 78, progressive: true }).toFile(path.join(out, 'env', 'sky_2k.jpg'));
console.log('hdri');

const MODELS = ['street_lamp_01', 'concrete_road_barrier', 'shrub_02', 'potted_plant_02', 'utility_box_01'];
await fs.mkdir(path.join(out, 'models'), { recursive: true });
const cli = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');
for (const id of MODELS) {
  const j = await api(id);
  const g = j.gltf['1k'].gltf;
  const dir = path.join(dl, 'models', id);
  const main = await get(g.url, path.join(dir, `${id}.gltf`));
  for (const [rel, v] of Object.entries(g.include || {})) await get(v.url, path.join(dir, rel));
  execFileSync(process.execPath, [cli, 'optimize', main, path.join(out, 'models', `${id}.glb`),
    '--texture-compress', 'webp', '--texture-size', '512', '--compress', 'meshopt'], { stdio: 'inherit' });
  console.log('model', id);
}
