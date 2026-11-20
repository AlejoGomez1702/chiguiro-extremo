import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DataTexture,
  DataUtils,
  DirectionalLight,
  FogExp2,
  HalfFloatType,
  MathUtils,
  Mesh,
  NoToneMapping,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  Timer,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  BloomEffect,
  DepthOfFieldEffect,
  BlendFunction,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  SMAAEffect,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';
import { Assets } from './assets';
import { GeoData } from './world/geo-data';
import { applySkyFog } from './sky-fog';
import { buildCity } from './world/city';
import { buildProps, Crowd } from './world/props';
import { Rider } from './world/rider';
import { buildTerrain } from './world/terrain';
import { SECTION, Track } from './world/track';
import { buildTrackMesh } from './world/track-mesh';

export type Quality = 'low' | 'mid' | 'high';
export type SceneMode = 'ride' | 'map';

export interface PinDef {
  id: string;
  s: number;
  lateral: number;
}
export interface PinScreen {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface DescentOptions {
  mode: SceneMode;
  quality?: Quality;
  onProgress?: (p: number) => void;
  onPins?: (pins: PinScreen[]) => void;
  pins?: PinDef[];
}

/** Ubicación de los puntos del mapa ilustrativo sobre el trazado 3D. */
const STAIRS_MID = (SECTION.stairs[0] + SECTION.stairs[1]) / 2;
export const PIN_POSITIONS: Record<string, [number, number]> = {
  S: [4, 0],
  '1': [STAIRS_MID, 0],
  A: [SECTION.kicker[0] + 12, 6],
  '2': [SECTION.drop, 0],
  B: [(SECTION.curve[0] + SECTION.curve[1]) / 2, -7],
  M: [SECTION.finish, 0],
  N: [120, -8],
  E: [SECTION.finish + 40, 12],
  '+': [SECTION.stairs[1] - 24, 5],
};

/** Plano de cámara en el marco del piloto: [adelante, arriba, derecha]. */
interface CamKey {
  s: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
}
const K = SECTION;
const CAM_KEYS: CamKey[] = [
  { s: 0, pos: [-6, 3.0, -1.7], look: [14, -2.6, -2.8], fov: 46 },
  { s: 26, pos: [-5.5, 2.3, 1.0], look: [6, 0.4, 0], fov: 50 },
  { s: 240, pos: [-6.5, 2.8, -1.0], look: [8, 0, 0], fov: 52 },
  { s: 460, pos: [-5, 4.2, 1.2], look: [10, -1, 0], fov: 54 },
  { s: K.kicker[0] - 6, pos: [2.5, 1.0, 4.4], look: [0, 1.6, 0], fov: 44 },
  { s: K.landing[1] + 20, pos: [-6, 2.4, 1], look: [6, 0.5, 0], fov: 50 },
  { s: (K.curve[0] + K.curve[1]) / 2, pos: [-3, 7, -4.5], look: [6, 0, 0], fov: 48 },
  { s: K.drop - 3, pos: [6, 0.6, 1.6], look: [-1, 1.2, 0], fov: 44 },
  { s: K.drop + 50, pos: [-5, 1.8, 1], look: [8, 0, 0], fov: 55 },
  { s: K.stairs[0] - 4, pos: [-4.5, 4.2, 0.6], look: [9, -3.5, 0], fov: 56 },
  { s: STAIRS_MID, pos: [4.2, 0.6, 1.2], look: [-2, 1.4, 0], fov: 46 },
  { s: K.stairs[1] - 8, pos: [-5, 2.4, -1], look: [8, -2, 0], fov: 52 },
  { s: K.finish - 2, pos: [9, 2.0, -3], look: [0, 1.2, 0], fov: 44 },
  { s: K.finish + 44, pos: [-22, 18, 12], look: [12, 0, 0], fov: 50 },
];

export function detectQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (mobile || cores <= 4 || (nav.deviceMemory ?? 8) <= 4) return mobile && cores >= 8 ? 'mid' : 'low';
  return cores >= 8 ? 'high' : 'mid';
}

export class DescentScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(45, 1, 0.25, 12000);
  private composer!: EffectComposer;
  private ao?: N8AOPostPass;
  private dof?: DepthOfFieldEffect;
  private focusPoint = new Vector3();
  private sun = new DirectionalLight('#ffc993', 5.2);
  private sunDir = new Vector3(0.6, 0.3, 0.74).normalize();
  private track = new Track();
  private geo?: GeoData;
  private rider = new Rider();
  private crowd?: Crowd;
  private dust?: Points;
  private timer = new Timer();
  private raf = 0;
  private active = true;
  private disposed = false;
  private controls?: OrbitControls;
  private quality: Quality;
  private pixelRatio: number;
  private slowFrames = 0;

  // estado de recorrido
  private targetS = 0;
  private s = 0;
  private lastS = 0;
  private camPos = new Vector3();
  private camLook = new Vector3();
  private camInit = false;
  private focus?: { pos: Vector3; target: Vector3; t: number };

  private constructor(
    private canvas: HTMLCanvasElement,
    private opts: DescentOptions,
  ) {
    this.quality = opts.quality ?? detectQuality();
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      stencil: false,
      depth: true,
      powerPreference: 'high-performance',
    });
    this.pixelRatio = Math.min(devicePixelRatio, this.quality === 'high' ? 1.75 : this.quality === 'mid' ? 1.25 : 1);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
  }

  static async create(canvas: HTMLCanvasElement, opts: DescentOptions) {
    const scene = new DescentScene(canvas, opts);
    await scene.init();
    return scene;
  }

  get qualityLevel() {
    return this.quality;
  }

  private async init() {
    const assets = new Assets(this.renderer, (p) => this.opts.onProgress?.(p * 0.85));
    const [, geo] = await Promise.all([
      assets.load(this.quality === 'low'),
      GeoData.load('/assets/geo/manizales.json', this.track),
      document.fonts?.ready,
    ]);
    this.geo = geo;
    if (this.disposed) return;

    this.setupSky(assets.skyHdr, assets.skyJpg);
    this.opts.onProgress?.(0.9);

    const world = new Object3D();
    const time = <T>(label: string, fn: () => T): T => {
      const t0 = performance.now();
      const out = fn();
      if (location.search.includes('debug')) console.info(`[3D] ${label}: ${Math.round(performance.now() - t0)} ms`);
      return out;
    };
    world.add(time('terreno', () => buildTerrain(this.track, geo, assets, this.quality)));
    world.add(time('pista', () => buildTrackMesh(this.track, geo, assets)));
    world.add(time('ciudad', () => buildCity(this.track, geo, assets, this.quality)));
    const props = time('utilería', () => buildProps(this.track, geo, assets, this.quality));
    world.add(props.group);
    this.crowd = props.crowd;
    world.traverse((o) => {
      o.updateMatrix();
      o.matrixAutoUpdate = false;
    });
    world.updateMatrixWorld(true);
    this.scene.add(world);
    this.scene.add(this.rider.root);
    applySkyFog(this.scene, assets.skyJpg, 1.05);
    this.dust = this.makeDust();
    this.scene.add(this.dust);

    // sol con sombras que siguen al piloto
    const shadowSize = this.quality === 'high' ? 4096 : this.quality === 'mid' ? 2048 : 1024;
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(shadowSize, shadowSize);
    const sc = this.sun.shadow.camera;
    sc.left = sc.bottom = -48;
    sc.right = sc.top = 48;
    sc.near = 1;
    sc.far = 400;
    this.sun.shadow.bias = -0.00025;
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.radius = 3;
    this.scene.add(this.sun, this.sun.target);

    this.setupComposer();
    this.setMode(this.opts.mode);
    this.resize();
    this.opts.onProgress?.(1);
    // compila shaders antes del primer frame para evitar tirones
    await time('shaders', () => this.renderer.compileAsync(this.scene, this.camera));
    this.timer.connect(document);
    this.loop();
    if (location.search.includes('debug')) (window as unknown as { __descent: DescentScene }).__descent = this;
  }

  /** Cielo: JPG tonemapeado como fondo, HDR para iluminación. */
  private setupSky(hdr: DataTexture, jpg: Texture) {
    // dirección del sol = píxel más brillante del HDR
    const { data, width, height } = hdr.image as { data: Uint16Array | Float32Array; width: number; height: number };
    let best = 0;
    let bi = 0;
    const half = data instanceof Uint16Array;
    for (let i = 0; i < width * height; i++) {
      const r = half ? DataUtils.fromHalfFloat(data[i * 4]) : data[i * 4];
      const g = half ? DataUtils.fromHalfFloat(data[i * 4 + 1]) : data[i * 4 + 1];
      const b = half ? DataUtils.fromHalfFloat(data[i * 4 + 2]) : data[i * 4 + 2];
      const l = r + g + b;
      if (l > best) {
        best = l;
        bi = i;
      }
    }
    const u = ((bi % width) + 0.5) / width;
    const v = 1 - (Math.floor(bi / width) + 0.5) / height;
    const phi = (u - 0.5) * Math.PI * 2;
    const el = (v - 0.5) * Math.PI;
    this.sunDir.set(Math.cos(phi) * Math.cos(el), Math.sin(el), Math.sin(phi) * Math.cos(el)).normalize();

    const pmrem = new PMREMGenerator(this.renderer);
    hdr.mapping = 303; // EquirectangularReflectionMapping
    this.scene.environment = pmrem.fromEquirectangular(hdr).texture;
    this.scene.environmentIntensity = 0.5;
    pmrem.dispose();

    const sky = new Mesh(
      new SphereGeometry(9500, 64, 32),
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { map: { value: jpg }, gain: { value: 1.05 } },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
            gl_Position = projectionMatrix * viewMatrix * vec4((modelMatrix * vec4(position, 1.0)).xyz, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D map;
          uniform float gain;
          varying vec3 vDir;
          #include <common>
          void main() {
            vec3 d = normalize(vDir);
            vec2 uv = vec2(atan(d.z, d.x) * RECIPROCAL_PI2 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * RECIPROCAL_PI + 0.5);
            vec3 c = texture2D(map, uv).rgb;
            // el JPG ya está tonemapeado: lo llevamos a lineal y compensamos el AgX posterior
            gl_FragColor = vec4(pow(c, vec3(2.2)) * gain, 1.0);
          }`,
      }),
    );
    sky.renderOrder = -1;
    sky.frustumCulled = false;
    sky.onBeforeRender = () => sky.position.copy(this.camera.position);
    this.scene.add(sky);
    this.scene.fog = new FogExp2(new Color('#b7bcc0'), 0.00048);
  }

  private setupComposer() {
    const r = this.renderer;
    this.composer = new EffectComposer(r, { frameBufferType: HalfFloatType });
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    if (this.quality !== 'low') {
      const ao = new N8AOPostPass(this.scene, this.camera, 1, 1);
      ao.configuration.aoRadius = 1.6;
      ao.configuration.distanceFalloff = 0.6;
      ao.configuration.intensity = 2.2;
      ao.configuration.halfRes = this.quality === 'mid';
      ao.setQualityMode(this.quality === 'high' ? 'Medium' : 'Low');
      this.composer.addPass(ao);
      this.ao = ao;
    }
    const bloom = new BloomEffect({ intensity: 0.55, luminanceThreshold: 0.82, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 });
    const vignette = new VignetteEffect({ offset: 0.3, darkness: 0.55 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const effects = [bloom, vignette, tone];
    if (this.quality === 'high') {
      const noise = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: false });
      noise.blendMode.opacity.value = 0.05;
      effects.push(noise as never);
    }
    if (this.quality === 'high') {
      // profundidad de campo con enfoque automático en el piloto
      this.dof = new DepthOfFieldEffect(this.camera, { focusRange: 9, bokehScale: 2.2, resolutionScale: 0.5 });
      this.dof.target = this.focusPoint;
      this.composer.addPass(new EffectPass(this.camera, this.dof));
    }
    this.composer.addPass(new EffectPass(this.camera, ...effects));
    this.composer.addPass(new EffectPass(this.camera, new SMAAEffect()));
  }

  /** Motas de polvo iluminadas por el sol alrededor de la cámara. */
  private makeDust() {
    const n = this.quality === 'low' ? 400 : 1400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,240,220,1)');
    grd.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
    const m = new PointsMaterial({
      size: 0.09,
      map: new CanvasTexture(c),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: AdditiveBlending,
      color: '#ffe2bf',
    });
    const p = new Points(g, m);
    p.frustumCulled = false;
    return p;
  }

  setMode(mode: SceneMode) {
    this.opts.mode = mode;
    if (mode === 'map') {
      if (!this.controls) {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.maxPolarAngle = 1.25;
        this.controls.minDistance = 30;
        this.controls.maxDistance = 1400;
      }
      const mid = this.track.point(SECTION.drop, 0);
      this.controls.target.copy(mid);
      this.camera.position.copy(mid).add(new Vector3(-480, 420, 320));
      this.camera.fov = 45;
      this.camera.updateProjectionMatrix();
      this.controls.enabled = true;
    } else if (this.controls) {
      this.controls.enabled = false;
    }
  }

  /** Distancia objetivo sobre la pista (modo recorrido). */
  setTarget(s: number) {
    this.targetS = MathUtils.clamp(s, 0, this.track.length - 6);
  }

  focusPin(id: string) {
    const p = PIN_POSITIONS[id];
    if (!p || !this.controls) return;
    const target = this.track.point(p[0], p[1], 1);
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    const pos = target.clone().add(dir.multiplyScalar(70)).add(new Vector3(0, 12, 0));
    this.focus = { pos, target, t: 0 };
  }

  overview() {
    if (this.controls) this.setMode('map');
  }

  /** Solo depuración: fija la cámara en coordenadas de la pista. */
  debugCam(s: number, lateral: number, up: number, lookS: number, lookUp = 0) {
    this.opts.mode = 'map';
    this.controls = this.controls ?? new OrbitControls(this.camera, this.canvas);
    this.track.point(s, lateral, up, this.camera.position);
    this.controls.target.copy(this.track.point(lookS, 0, lookUp));
    this.controls.update();
  }

  setActive(active: boolean) {
    this.active = active;
  }

  resize() {
    const w = this.canvas.clientWidth || innerWidth;
    const h = this.canvas.clientHeight || innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h, false);
    this.ao?.setSize(w * this.pixelRatio, h * this.pixelRatio);
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.active || document.hidden) return;
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    const t = this.timer.getElapsed();
    this.adapt(dt);
    this.step(dt, t);
    this.composer.render(dt);
  };

  /** Calidad adaptativa: baja resolución y luego AO si no llega a ~40 fps. */
  private adapt(dt: number) {
    this.slowFrames = dt > 1 / 38 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 2);
    if (this.slowFrames > 90) {
      this.slowFrames = 0;
      if (this.pixelRatio > 0.8) {
        this.pixelRatio = Math.max(0.75, this.pixelRatio - 0.2);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.resize();
      } else if (this.ao?.enabled) {
        this.ao.enabled = false;
      }
    }
  }

  private frame = this.track.frame(0);
  private step(dt: number, t: number) {
    const tr = this.track;
    if (this.opts.mode === 'map') {
      // vuelta de reconocimiento automática
      this.s = (this.s + dt * 11) % (tr.length - 10);
    } else {
      this.s += (this.targetS - this.s) * (1 - Math.exp(-dt * 2.6));
    }
    const s = this.s;
    const ds = s - this.lastS;
    this.lastS = s;

    // --- piloto -------------------------------------------------------------
    const f = tr.frame(s, this.frame);
    const y = tr.riderY(s);
    const pos = f.pos.clone();
    pos.y = y;
    // línea de carrera: pequeña oscilación lateral
    pos.addScaledVector(f.right, Math.sin(s * 0.045) * 0.6);
    const yA = tr.riderY(s - 0.6);
    const yB = tr.riderY(s + 0.6);
    const pitch = Math.atan2(yB - yA, 1.2);
    const curv = (tr.heading(s + 2) - tr.heading(s - 2)) / 4;
    const speed = Math.abs(ds) / Math.max(dt, 1e-3);
    const lean = MathUtils.clamp(-curv * speed * 1.6, -0.6, 0.6);
    const air = y - tr.ground(s) > 0.3 ? 1 : 0;
    this.rider.update(pos, f.forward, pitch, lean, ds, t, air ? 0.4 : 0.15 + Math.min(0.3, speed * 0.02));

    this.crowd?.update(t, s);
    this.focusPoint.copy(pos).setY(pos.y + 1);
    if (this.dof) this.dof.blendMode.opacity.value = this.opts.mode === 'ride' ? 1 : 0;
    if (this.dust) this.dust.position.copy(this.camera.position).setY(this.camera.position.y - 6);

    // sol y sombras centrados en la acción
    const focus = this.opts.mode === 'map' && this.controls ? this.controls.target : pos;
    this.sun.target.position.copy(focus);
    this.sun.position.copy(focus).addScaledVector(this.sunDir, 200);
    this.sun.target.updateMatrixWorld();

    // --- cámara ---------------------------------------------------------------
    if (this.opts.mode === 'map' && this.controls) {
      if (this.focus) {
        this.focus.t = Math.min(1, this.focus.t + dt / 1.4);
        const k = 1 - Math.pow(1 - this.focus.t, 3);
        this.camera.position.lerp(this.focus.pos, k * 0.12);
        this.controls.target.lerp(this.focus.target, k * 0.12);
        if (this.focus.t >= 1) this.focus = undefined;
      }
      this.controls.update(dt);
      this.emitPins();
      return;
    }
    const { p, l, fov } = this.cameraPose(s, pos, f.forward, f.right);
    // se suaviza el desplazamiento relativo al piloto (no la posición absoluta)
    // para que la cámara nunca se rezague y lo alcance a alta velocidad
    const offP = p.clone().sub(pos);
    const offL = l.clone().sub(pos);
    if (!this.camInit) {
      this.camPos.copy(offP);
      this.camLook.copy(offL);
      this.camInit = true;
    }
    const k = 1 - Math.exp(-dt * 3.5);
    this.camPos.lerp(offP, k);
    this.camLook.lerp(offL, k);
    const shake = Math.min(1, speed / 14) * 0.025;
    this.camera.position.copy(pos).add(this.camPos).add(new Vector3(Math.sin(t * 23) * shake, Math.sin(t * 29) * shake, 0));
    // la suavización no debe meter la cámara bajo el suelo
    const camS = tr.nearest(this.camera.position.x, this.camera.position.z).s;
    this.camera.position.y = Math.max(this.camera.position.y, tr.ground(camS) + 0.4);
    this.camera.lookAt(pos.clone().add(this.camLook));
    const targetFov = fov + Math.min(8, speed * 0.4);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * k;
      this.camera.updateProjectionMatrix();
    }
  }

  private cameraPose(s: number, riderPos: Vector3, fwd: Vector3, right: Vector3) {
    let i = 0;
    while (i < CAM_KEYS.length - 2 && s > CAM_KEYS[i + 1].s) i++;
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    const t = MathUtils.smootherstep(s, a.s, b.s);
    const lerp3 = (x: number[], y: number[]) => x.map((v, k) => v + (y[k] - v) * t);
    let [pf, pu, pr] = lerp3(a.pos, b.pos);
    let [lf, lu, lr] = lerp3(a.look, b.look);
    // pantallas verticales: encuadre más centrado y algo más lejos
    if (this.camera.aspect < 1) {
      const k = Math.max(0.25, this.camera.aspect);
      pr *= k;
      lr *= k * 0.4;
      pf *= 1.25;
      pu *= 1.15;
      lf *= 0.8;
    }
    const ground = riderPos.clone();
    ground.y = this.track.ground(s);
    const p = ground.clone().addScaledVector(fwd, pf).addScaledVector(right, pr);
    p.y += pu;
    // no atravesar el suelo
    const camS = MathUtils.clamp(s + pf, 0, this.track.length);
    p.y = Math.max(p.y, this.track.ground(camS) + 0.45, this.track.riderY(camS) + 0.35);
    // nunca dentro de un edificio real: acerca la cámara al eje de la calle
    for (let k = 0; k < 6 && this.geo?.inBuilding(p.x, p.z, 0.6); k++) {
      p.addScaledVector(right, -Math.sign(pr) * Math.min(Math.abs(pr), 1.2));
      pr -= Math.sign(pr) * Math.min(Math.abs(pr), 1.2);
      p.y += 0.8;
    }
    const l = riderPos.clone().addScaledVector(fwd, lf).addScaledVector(right, lr);
    l.y += lu;
    return { p, l, fov: a.fov + (b.fov - a.fov) * t };
  }

  private v = new Vector3();
  private emitPins() {
    if (!this.opts.onPins) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const out: PinScreen[] = [];
    for (const [id, [s, lat]] of Object.entries(PIN_POSITIONS)) {
      this.track.point(s, lat, 2.5, this.v);
      this.v.project(this.camera);
      out.push({ id, x: (this.v.x * 0.5 + 0.5) * w, y: (-this.v.y * 0.5 + 0.5) * h, visible: this.v.z < 1 });
    }
    this.opts.onPins(out);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.controls?.dispose();
    this.composer?.dispose();
    this.scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mt) => mt.dispose());
      }
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
