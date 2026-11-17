// Chapter 2's scene: sky, light rig, the sets (places.ts) and the cast (cast.ts), posed per frame for shot `id`
// (a pure function of id + f). Same light rig, sky and card binding as the sample chapter (long/000-sample/ch1).
import * as THREE from "three";
import { V, lam, Kit, Ray } from "../../../src/engine/build";
import { loadKenney } from "../../../src/engine/kit";
import { ctex, cloudHD } from "../../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../../src/engine/lights";
import { TONE, CHAR, untone } from "../../../src/engine/shade";
import { NOINK } from "../../../src/engine/ink";
import { Pool, Actor, Fx } from "../../../src/engine/cards";
import { flagTex } from "../shared/props";
import { buildSets, Sets } from "./places";
import { stage, crowdAt, FLAG_BEARERS } from "./cast";
import { FPS, SHOTS, ShotDef, V3, P, camAt, FORT0, FORT1, FIRE1, FIRE2, smooth } from "./story";

const KENNEY = ["tree_oak", "tree_default", "tree-high-round"];
export const loadKit = () => loadKenney(KENNEY);

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const glowTex = () => ctex("candleGlow", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,220,150,0.9)"); gr.addColorStop(0.25, "rgba(255,190,110,0.35)"); gr.addColorStop(1, "rgba(255,170,90,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
const flameTex = () => ctex("flame", 64, 128, (g) => {
  g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(32, 4); g.quadraticCurveTo(58, 80, 32, 124); g.quadraticCurveTo(6, 80, 32, 4); g.fill();
});
/** per-shot sun override (degrees, camera-relative): interiors get a sun from behind the lens so the back walls are lit */
const SUN_SHOT: Record<number, { az?: number; el?: number }> = {
  1: { az: 150, el: 52 }, 7: { az: 150, el: 52 }, 15: { az: 140, el: 50 }, 16: { az: 165, el: 22 }, 17: { az: 160, el: 22 }, 19: { az: 140, el: 50 }, 21: { az: 140, el: 50 },
  2: { az: 120 }, 3: { az: 135 }, 4: { az: 135 }, 5: { az: 135 }, 6: { az: 130 }, 8: { az: 120 }, 9: { az: 135 }, 10: { az: 100 }, 12: { az: 120 }, 18: { az: 135 }, 20: { az: 135 }, 22: { az: 140 }, 11: { az: 145, el: 12 },
};
/** grey winter sky stops (on-screen colours) for Brienne */
const GREY_SKY = { c: ["#d9dde3", "#cbd2dc", "#b6c1cf", "#a6b3c5", "#93a3ba"], e: [0, 3, 8, 16, 40] };
const GREY_FOG = "#d9dde3";

/** every lens position of the film looking at its subject (Kenney trees there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 6; f < s.b + 6; f += 3) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (16 / 9);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private sets: Sets;
  private snowGround = lam("snowGround", () => ({ color: "#dfe5ee" }));
  private flame: THREE.Mesh; private glow: THREE.Sprite;
  private flags: { pole: THREE.Mesh; cloth: THREE.Mesh }[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunDisc.renderOrder = -0.5; this.sunDisc.frustumCulled = false; this.sunDisc.layers.set(NOINK); R.add(this.sunDisc);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.layers.set(NOINK); m.userData.k = i;
      this.clouds.push(m); R.add(m);
    }
    this.sets = buildSets(R, kit, sightLines());
    // candle flame (HDR emissive: blooms) + additive glow
    this.flame = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.11), new THREE.MeshBasicMaterial({ map: flameTex(), color: new THREE.Color(5.0, 3.2, 1.3), transparent: true, depthWrite: false, fog: false }));
    this.flame.layers.set(NOINK); R.add(this.flame);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(1, 1, 1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.glow.layers.set(NOINK); R.add(this.glow);
    // tricolour flags for the 1789 crowd
    const poleM = lam("flagPole", () => ({ color: "#6a4a32" })), clothM = lam("flagFR", () => ({ map: flagTex("fr"), side: THREE.DoubleSide }));
    for (let i = 0; i < FLAG_BEARERS.length; i++) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 6), poleM);
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8, 12, 1), clothM);
      pole.castShadow = cloth.castShadow = true; pole.visible = cloth.visible = false; cloth.frustumCulled = false;
      R.add(pole, cloth); this.flags.push({ pole, cloth });
    }
  }

  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(SUN_SHOT[id]?.az ?? L.az), el = THREE.MathUtils.degToRad(SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky + fog: grey winter sky at Brienne by day ----
    const su = this.skyMat.uniforms, grey = s.sky === "grey" && s.light === "day";
    const sky = grey ? GREY_SKY : K.sky;
    sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(grey ? GREY_FOG : L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = grey ? 260 : L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const outdoors = s.place === "brienne" || s.place === "paris";
    this.sunDisc.visible = s.light === "golden" && outdoors;
    if (this.sunDisc.visible) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
    }
    for (const m of this.clouds) {
      const i = m.userData.k as number, a = (i / 12) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60, w = (grey ? 190 : 130) + (i % 4) * 30;
      m.position.set(cam.position.x + Math.cos(a) * d, 110 + (i % 4) * 34, cam.position.z + Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.map = this.cloudMaps[s.light][i % 4];
      mat.color.setScalar(grey ? 0.86 : 1.1);
      m.visible = outdoors;
    }
    // ---- per-shot sets ----
    const S = this.sets;
    for (const g of S.groundBrienne) g.material = s.snow ? this.snowGround : (g.userData.base as THREE.Material);
    for (const p of S.snowPieces) p.visible = !!s.snow;
    const fortK = id === 8 ? smooth((t - FORT0) / (FORT1 - FORT0)) : id > 8 && id <= 11 ? 1 : 0;
    S.fortress.visible = fortK > 0.001;
    S.fortress.scale.set(1, Math.max(0.001, fortK), 1);
    const room = s.place === "room" || s.place === "classA" || s.place === "classB";
    for (const w of S.winDay) w.visible = room && !s.night;
    for (const w of S.winNight) w.visible = room && !!s.night;
    // candle: lit at night only
    const lit = s.place === "room" && !!s.night;
    this.flame.visible = this.glow.visible = lit;
    if (lit) {
      const fl = 1 + 0.08 * Math.sin(t * 23) + 0.05 * Math.sin(t * 37 + 1);
      this.flame.position.copy(S.candle).add(V(0, 0.06 * fl, 0)); this.flame.scale.set(1, fl, 1); this.flame.quaternion.copy(cam.quaternion);
      this.glow.position.copy(S.candle).add(V(0, 0.06, 0)); this.glow.scale.setScalar(0.9 * fl);
    }
    // the battery: recoil on each shot (back 0.7 m in 3 f, run forward over 1.2 s)
    const muzzle: V3[] = [];
    for (const g of S.guns) {
      const home = g.userData.home as THREE.Vector3, mid = g.userData.i === 1;
      let back = 0;
      if (mid) for (const tf of [FIRE1, FIRE2]) {
        const u = t - tf;
        if (u >= 0 && u < 0.1) back = Math.max(back, 0.7 * (u / 0.1));
        else if (u >= 0.1 && u < 1.4) back = Math.max(back, 0.7 * (1 - smooth((u - 0.1) / 1.3)));
      }
      g.position.set(home.x, home.y, home.z + back);
      g.updateMatrixWorld(true);
      const m = (g.userData.muzzle as THREE.Vector3).clone().applyMatrix4(g.matrixWorld);
      muzzle.push([m.x, m.y, m.z]);
    }
    // flags in the 1789 crowd
    const crowd = id === 22 ? crowdAt(t) : [];
    this.flags.forEach((fl, k) => {
      const on = id === 22;
      fl.pole.visible = fl.cloth.visible = on;
      if (!on) return;
      const [lx, , lz] = crowd[FLAG_BEARERS[k]], [x, , z] = P("paris", lx, 0, lz);
      const bob = 0.04 * Math.sin(t * 6.3 + k);
      const base = V(x + 0.32, 0.9 + bob, z - 0.1);
      fl.pole.position.copy(base).add(V(0, 1.3, 0));
      fl.cloth.position.copy(base).add(V(0, 2.18, 0));
      const p = fl.cloth.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const u = (i % 13) / 12, y = i < 13 ? 0.4 : -0.4;
        p.setXYZ(i, u * 1.2, y + 0.04 * u * Math.sin(t * 5 - u * 3 + k), 0.2 * u * Math.sin(t * 6.5 - u * 5 + k * 1.7));
      }
      p.needsUpdate = true;
    });
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right }, { muzzle });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(Math.max(1e-4, p.w), Math.max(1e-4, p.h), 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return focus;
  }
}
export { P };
