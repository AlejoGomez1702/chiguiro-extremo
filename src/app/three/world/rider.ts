import {
  BufferGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { textTexture } from '../assets';
import { boxUV, merge, tube } from '../geo';

/**
 * Bicicleta de descenso + piloto, todo procedural.
 * Ejes locales: x adelante, y arriba, z derecha. Suelo en y = 0.
 */
const WHEEL_R = 0.37;
const REAR = new Vector3(-0.63, WHEEL_R, 0);
const FRONT = new Vector3(0.64, WHEEL_R, 0);
const BB = new Vector3(0, 0.36, 0);

const v = (x: number, y: number, z = 0) => new Vector3(x, y, z);

export class Rider {
  readonly root = new Group();
  /** pivote para cabeceo/alabeo del conjunto */
  readonly body = new Group();
  private wheels: Object3D[] = [];
  private cranks = new Group();
  private riderGroup = new Group();
  private fork = new Group();

  constructor() {
    this.root.add(this.body);
    const frameMat = new MeshPhysicalMaterial({
      color: '#FF5B1F',
      metalness: 0.35,
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
    const black = new MeshStandardMaterial({ color: '#141414', roughness: 0.45, metalness: 0.3 });
    const alloy = new MeshStandardMaterial({ color: '#b9bcc0', roughness: 0.25, metalness: 1 });
    const gold = new MeshStandardMaterial({ color: '#c9962b', roughness: 0.2, metalness: 1 });
    const rubber = new MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.92 });

    // --- cuadro ----------------------------------------------------------
    const headTop = v(0.47, 1.0);
    const headBot = v(0.53, 0.84);
    const seatCluster = v(-0.12, 0.82);
    const frame = merge([
      tube(BB, headBot, 0.034, 14, 0.03), // tubo diagonal
      tube(seatCluster, headTop, 0.028, 14, 0.026), // tubo superior
      tube(BB, seatCluster.clone().add(v(-0.03, 0.12)), 0.026, 12), // tubo de sillín
      tube(headBot, headTop, 0.04, 14),
      ...[-1, 1].flatMap((s) => [
        tube(BB.clone().setZ(s * 0.045), REAR.clone().setZ(s * 0.07), 0.018, 10),
        tube(seatCluster.clone().setZ(s * 0.03), REAR.clone().setZ(s * 0.07), 0.015, 10),
      ]),
    ]);
    const frameMesh = new Mesh(frame, frameMat);
    this.body.add(frameMesh);

    // amortiguador trasero con resorte naranja
    const shockA = v(0.2, 0.55);
    const shockB = v(-0.05, 0.62);
    this.body.add(new Mesh(tube(shockA, shockB, 0.022, 10), black));
    const coil = new Mesh(new TorusGeometry(0.03, 0.006, 6, 18), new MeshStandardMaterial({ color: '#FF5B1F', roughness: 0.3, metalness: 0.6 }));
    for (let i = 0; i < 7; i++) {
      const c = coil.clone();
      c.position.lerpVectors(shockA, shockB, 0.2 + i * 0.09);
      c.lookAt(c.position.clone().add(shockB.clone().sub(shockA)));
      this.body.add(c);
    }

    // sillín y tija
    const post = seatCluster.clone().add(v(-0.06, 0.2));
    this.body.add(new Mesh(tube(seatCluster, post, 0.016, 10), black));
    const saddle = new Mesh(new CapsuleGeometry(0.06, 0.18, 4, 10), black);
    saddle.rotation.z = Math.PI / 2;
    saddle.scale.set(0.5, 1, 1);
    saddle.position.copy(post).add(v(0.02, 0.03));
    this.body.add(saddle);

    // --- horquilla de doble corona, manubrio, potencia --------------------
    const steer = new Vector3().subVectors(headBot, headTop).normalize();
    for (const s of [-1, 1]) {
      const top = v(0.45, 1.08, s * 0.075);
      const axle = FRONT.clone().setZ(s * 0.075);
      const mid = top.clone().lerp(axle, 0.42);
      this.fork.add(new Mesh(tube(top, mid, 0.018, 12), gold));
      this.fork.add(new Mesh(tube(mid, axle, 0.024, 12), black));
    }
    for (const y of [1.03, 0.87]) {
      const crown = new Mesh(new CylinderGeometry(0.03, 0.03, 0.2, 10), black);
      crown.rotation.x = Math.PI / 2;
      crown.position.set(0.47 + (1.03 - y) * 0.3, y, 0);
      this.fork.add(crown);
    }
    this.body.add(this.fork);
    const bar = new Mesh(new CylinderGeometry(0.011, 0.011, 0.8, 10), black);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0.43, 1.12, 0);
    this.body.add(bar);
    for (const s of [-1, 1]) {
      const grip = new Mesh(new CylinderGeometry(0.017, 0.017, 0.13, 10), rubber);
      grip.rotation.x = Math.PI / 2;
      grip.position.set(0.43, 1.12, s * 0.33);
      this.body.add(grip);
    }
    void steer;

    // placa con número
    const plateTex = textTexture(['01'], { w: 256, h: 256, bg: '#F2EFE9', fg: '#121212' });
    const plate = new Mesh(new PlaneGeometry(0.22, 0.18), new MeshStandardMaterial({ map: plateTex, roughness: 0.5 }));
    plate.position.set(0.5, 1.13, 0);
    plate.rotation.y = Math.PI / 2;
    plate.rotation.x = -0.2;
    this.body.add(plate);

    // --- ruedas ----------------------------------------------------------
    for (const c of [REAR, FRONT]) {
      const w = this.wheel(rubber, alloy, black);
      w.position.copy(c);
      this.wheels.push(w);
      this.body.add(w);
    }

    // --- transmisión -------------------------------------------------------
    const ring = new Mesh(new CylinderGeometry(0.085, 0.085, 0.006, 32), alloy);
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(BB).setZ(0.06);
    this.body.add(ring);
    for (const s of [-1, 1]) {
      const arm = new Mesh(tube(v(0, 0, 0), v(0.17, 0, 0), 0.014, 8), black);
      arm.position.z = s * 0.08;
      arm.rotation.z = s > 0 ? 0 : Math.PI;
      const pedal = new Mesh(new CylinderGeometry(0.05, 0.05, 0.1, 6), black);
      pedal.rotation.x = Math.PI / 2;
      pedal.scale.set(1.3, 1, 0.25);
      pedal.position.set(s > 0 ? 0.17 : -0.17, 0, s * 0.13);
      this.cranks.add(arm, pedal);
    }
    this.cranks.position.copy(BB);
    this.body.add(this.cranks);
    this.body.add(new Mesh(tube(BB.clone().setZ(0.06), REAR.clone().setZ(0.06), 0.004, 4), alloy));

    // --- piloto ------------------------------------------------------------
    this.buildRider(alloy);
    this.body.add(this.riderGroup);

    this.root.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }

  private wheel(rubber: MeshStandardMaterial, alloy: MeshStandardMaterial, black: MeshStandardMaterial) {
    const g = new Group();
    // neumático con taco: toro + nudos
    const tire = new Mesh(new TorusGeometry(WHEEL_R - 0.03, 0.032, 14, 64), rubber);
    g.add(tire);
    const knobs: BufferGeometry[] = [];
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const k = new CylinderGeometry(0.009, 0.011, 0.012, 5);
      k.rotateZ(Math.PI / 2);
      k.translate(WHEEL_R + 0.0, 0, (i % 2 ? 1 : -1) * 0.016);
      k.rotateZ(a);
      knobs.push(k);
    }
    g.add(new Mesh(merge(knobs), rubber));
    g.add(new Mesh(new TorusGeometry(WHEEL_R - 0.07, 0.014, 8, 48), black));
    const spokes: BufferGeometry[] = [];
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const side = i % 2 ? 1 : -1;
      spokes.push(tube(v(0, 0, side * 0.03), v(Math.cos(a + side * 0.2) * (WHEEL_R - 0.075), Math.sin(a + side * 0.2) * (WHEEL_R - 0.075), side * 0.008), 0.0018, 3));
    }
    g.add(new Mesh(merge(spokes), alloy));
    const hub = new Mesh(new CylinderGeometry(0.025, 0.025, 0.1, 12), black);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    const rotor = new Mesh(new CylinderGeometry(0.1, 0.1, 0.003, 28), alloy);
    rotor.rotation.x = Math.PI / 2;
    rotor.position.z = -0.05;
    g.add(rotor);
    return g;
  }

  private buildRider(alloy: MeshStandardMaterial) {
    const jersey = new MeshPhysicalMaterial({ color: '#FF5B1F', roughness: 0.85, sheen: 1, sheenColor: new Color('#ffb08a'), sheenRoughness: 0.6 });
    const jerseyDark = new MeshPhysicalMaterial({ color: '#141414', roughness: 0.85, sheen: 0.6, sheenColor: new Color('#555'), sheenRoughness: 0.6 });
    const pants = new MeshPhysicalMaterial({ color: '#1c1c1e', roughness: 0.75, sheen: 0.5, sheenColor: new Color('#444') });
    const helmetMat = new MeshPhysicalMaterial({ color: '#17181a', roughness: 0.45, clearcoat: 1, clearcoatRoughness: 0.12 });
    const shoe = new MeshStandardMaterial({ color: '#111', roughness: 0.7 });
    const goggles = new MeshPhysicalMaterial({ color: '#ff8a4a', metalness: 1, roughness: 0.08, iridescence: 0.8, iridescenceIOR: 1.5 });
    const g = this.riderGroup;
    const limb = (a: Vector3, b: Vector3, r: number, mat: MeshStandardMaterial, r2 = r) => {
      const len = a.distanceTo(b);
      const c = new CapsuleGeometry((r + r2) / 2, Math.max(0.01, len - (r + r2)), 4, 12);
      const m = new Mesh(c, mat);
      m.position.copy(a).lerp(b, 0.5);
      m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
      g.add(m);
      return m;
    };

    // pose de ataque: de pie sobre pedales nivelados, codos afuera
    const hip = v(-0.16, 1.02);
    const chest = v(0.14, 1.38);
    for (const s of [-1, 1]) {
      const foot = s > 0 ? v(0.17, 0.4, 0.15) : v(-0.17, 0.4, -0.15);
      const knee = s > 0 ? v(0.16, 0.74, 0.17) : v(-0.04, 0.7, -0.16);
      const h = hip.clone().setZ(s * 0.11);
      limb(h, knee, 0.075, pants, 0.065);
      limb(knee, foot.clone().add(v(0, 0.06)), 0.058, pants, 0.045);
      const sh = new Mesh(new CapsuleGeometry(0.045, 0.15, 4, 10), shoe);
      sh.rotation.z = Math.PI / 2;
      sh.position.copy(foot).add(v(0.02, 0.02));
      g.add(sh);
      const shoulder = chest.clone().add(v(0.02, 0.06, s * 0.19));
      const elbow = v(0.2, 1.2, s * 0.36);
      const hand = v(0.43, 1.13, s * 0.31);
      limb(shoulder, elbow, 0.052, jersey, 0.047);
      limb(elbow, hand, 0.045, jerseyDark, 0.04);
      const glove = new Mesh(new SphereGeometry(0.04, 10, 8), jerseyDark);
      glove.position.copy(hand);
      g.add(glove);
    }
    // torso: cápsula ancha + pechera de protección
    const torso = limb(hip.clone().add(v(0.02, 0.05)), chest, 0.15, jersey, 0.16);
    torso.scale.set(1, 1, 1.25);
    const back = limb(hip.clone().add(v(0, 0.12, 0)), chest.clone().add(v(-0.04, 0.02)), 0.06, jerseyDark);
    back.position.add(v(-0.1, 0.02));
    back.scale.set(1.2, 1, 2.2);
    // cuello y casco integral
    limb(chest.clone().add(v(0.02, 0.1)), v(0.22, 1.56), 0.05, jerseyDark);
    const head = new Group();
    head.position.set(0.26, 1.64, 0);
    head.rotation.z = -0.35;
    const shell = new Mesh(new SphereGeometry(0.145, 32, 24), helmetMat);
    shell.scale.set(1.18, 1.02, 0.96);
    head.add(shell);
    // abertura facial oscura
    const port = new Mesh(new SphereGeometry(0.1, 20, 14), new MeshStandardMaterial({ color: '#0b0b0b', roughness: 0.6 }));
    port.scale.set(0.5, 0.62, 0.95);
    port.position.set(0.12, -0.01, 0);
    head.add(port);
    // mentonera
    const chin = new Mesh(new CapsuleGeometry(0.055, 0.12, 6, 14), helmetMat);
    chin.rotation.x = Math.PI / 2;
    chin.scale.set(1, 1, 0.9);
    chin.position.set(0.13, -0.095, 0);
    head.add(chin);
    // visera
    const visor = new Mesh(boxUV(0.12, 0.012, 0.2), helmetMat);
    visor.position.set(0.16, 0.11, 0);
    visor.rotation.z = -0.25;
    head.add(visor);
    // franja naranja
    const stripe = new Mesh(new TorusGeometry(0.15, 0.011, 8, 32, Math.PI), new MeshStandardMaterial({ color: '#FF5B1F', roughness: 0.4 }));
    stripe.rotation.y = Math.PI / 2;
    stripe.scale.set(1, 1.02, 1.18);
    head.add(stripe);
    // gafas: lente espejada + correa
    const gog = new Mesh(new CapsuleGeometry(0.032, 0.11, 4, 12), goggles);
    gog.rotation.x = Math.PI / 2;
    gog.position.set(0.14, 0.025, 0);
    head.add(gog);
    const strap = new Mesh(new TorusGeometry(0.152, 0.014, 6, 32), new MeshStandardMaterial({ color: '#121212', roughness: 0.8 }));
    strap.rotation.x = Math.PI / 2;
    strap.position.y = 0.025;
    strap.scale.set(1.15, 0.95, 1);
    head.add(strap);
    g.add(head);
    void alloy;
  }

  private dist = 0;
  /**
   * Pone el conjunto sobre la pista.
   * @param pitch cabeceo (rad, + nariz arriba) @param lean alabeo (rad, + a la derecha)
   */
  update(pos: Vector3, forward: Vector3, pitch: number, lean: number, ds: number, t: number, crouch: number) {
    this.root.position.copy(pos);
    const yaw = Math.atan2(-forward.z, forward.x);
    this.root.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), yaw);
    this.body.rotation.set(lean, 0, pitch, 'YXZ');
    this.dist += ds;
    const spin = -this.dist / WHEEL_R;
    for (const w of this.wheels) w.rotation.z = spin;
    // vibración de suspensión y piloto absorbiendo terreno
    const bump = Math.sin(t * 31) * 0.004 + Math.sin(t * 17.3) * 0.006;
    this.riderGroup.position.y = bump * Math.min(1, Math.abs(ds) * 20) - crouch * 0.12;
    this.riderGroup.position.x = -crouch * 0.05;
  }
}

void Matrix4;
void Quaternion;
