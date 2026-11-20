import {
  CanvasTexture,
  DataTexture,
  LoadingManager,
  MeshStandardMaterial,
  MeshStandardMaterialParameters,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const BASE = '/assets';

export type TexKey = 'road' | 'pave' | 'plaster' | 'brick' | 'roof' | 'wood' | 'grass' | 'cobble';
export type ModelKey =
  | 'street_lamp_01'
  | 'concrete_road_barrier'
  | 'shrub_02'
  | 'potted_plant_02'
  | 'utility_box_01';

export interface PbrSet {
  map: Texture;
  normalMap: Texture;
  /** ambient occlusion (r), roughness (g), metalness (b) */
  arm: Texture;
}

export class Assets {
  readonly manager: LoadingManager;
  private tex: TextureLoader;
  private gltf: GLTFLoader;
  private hdr: HDRLoader;
  readonly pbr = new Map<TexKey, PbrSet>();
  readonly models = new Map<ModelKey, GLTF>();
  skyHdr!: DataTexture;
  skyJpg!: Texture;

  constructor(
    private renderer: WebGLRenderer,
    onProgress: (p: number) => void,
  ) {
    this.manager = new LoadingManager();
    this.manager.onProgress = (_url, loaded, total) => onProgress(loaded / total);
    this.tex = new TextureLoader(this.manager);
    this.gltf = new GLTFLoader(this.manager).setMeshoptDecoder(MeshoptDecoder);
    this.hdr = new HDRLoader(this.manager);
  }

  private loadTex(url: string, srgb: boolean) {
    return this.tex.loadAsync(url).then((t) => {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      if (srgb) t.colorSpace = SRGBColorSpace;
      return t;
    });
  }

  async load(lowQuality: boolean) {
    const keys: TexKey[] = ['road', 'pave', 'plaster', 'brick', 'roof', 'wood', 'grass', 'cobble'];
    const models: ModelKey[] = [
      'street_lamp_01',
      'concrete_road_barrier',
      'shrub_02',
      'potted_plant_02',
      'utility_box_01',
    ];
    await Promise.all([
      ...keys.map(async (k) => {
        const [map, normalMap, arm] = await Promise.all([
          this.loadTex(`${BASE}/tex/${k}_diff.webp`, true),
          this.loadTex(`${BASE}/tex/${k}_nor.webp`, false),
          this.loadTex(`${BASE}/tex/${k}_arm.webp`, false),
        ]);
        this.pbr.set(k, { map, normalMap, arm });
      }),
      ...models.map(async (m) => this.models.set(m, await this.gltf.loadAsync(`${BASE}/models/${m}.glb`))),
      this.hdr.loadAsync(`${BASE}/env/sky_1k.hdr`).then((t) => (this.skyHdr = t)),
      this.loadTex(`${BASE}/env/${lowQuality ? 'sky_2k' : 'sky_4k'}.jpg`, true).then((t) => (this.skyJpg = t)),
    ]);
  }

  /**
   * Material PBR con texturas repetidas en coordenadas de mundo (las UV de
   * nuestras geometrías ya vienen en metros / `scale`).
   */
  material(key: TexKey, params: MeshStandardMaterialParameters = {}) {
    const set = this.pbr.get(key)!;
    return new MeshStandardMaterial({
      map: set.map,
      normalMap: set.normalMap,
      aoMap: set.arm,
      roughnessMap: set.arm,
      metalnessMap: set.arm,
      roughness: 1,
      metalness: 1,
      ...params,
    });
  }
}

/** Textura de texto para pancartas y señalética. */
export function textTexture(
  lines: string[],
  opts: { w?: number; h?: number; bg?: string; fg?: string; font?: string; repeat?: number; stripe?: string } = {},
) {
  const w = opts.w ?? 1024;
  const h = opts.h ?? 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = opts.bg ?? '#FF5B1F';
  g.fillRect(0, 0, w, h);
  if (opts.stripe) {
    g.fillStyle = opts.stripe;
    g.fillRect(0, 0, w, h * 0.08);
    g.fillRect(0, h * 0.92, w, h * 0.08);
  }
  g.fillStyle = opts.fg ?? '#121212';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lh = h / (lines.length + 0.4);
  g.font = opts.font ?? `900 ${Math.round(lh * 0.82)}px "Big Shoulders Display", Impact, sans-serif`;
  const rep = opts.repeat ?? 1;
  for (let r = 0; r < rep; r++) {
    lines.forEach((l, i) => g.fillText(l, (w / rep) * (r + 0.5), lh * (i + 0.7)));
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
