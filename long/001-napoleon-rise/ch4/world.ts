// Chapter 4's three.js world: sky, light rig, clouds and seven sets (sets.ts), only the shot's own set visible; the
// guns (recoil on their fire times), the waving flags, the river at Lodi, and the cast + effect cards (cast.ts).
// update(id, f, camera) poses everything for shot `id` at frame f (a pure function of id + f).
import * as THREE from "three";
import { V, Kit, Ray, lam } from "../../../src/engine/build";
import { loadKenney } from "../../../src/engine/kit";
import { ctex, waterNear, waterFar, cloudHD } from "../../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../../src/engine/lights";
import { TONE, CHAR, LFB, untone } from "../../../src/engine/shade";
import { NOINK } from "../../../src/engine/ink";
import { Pool, Actor, Fx } from "../../../src/engine/cards";
import { cannon, cannonballs, flagTex } from "../shared/props";
import { buildSets, quadUp, Sets } from "./sets";
import { stage, flagsAt } from "./cast";
import { FPS, SHOTS, ShotDef, SetName, camAt, V3, STREET_GUNS, PARK, RIVER, WATER_Y } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "lantern", "cart", "stall-red", "stall-green", "stall-bench"];
export const loadKit = () => loadKenney(KENNEY);

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});
/** sun per set (camera-relative azimuth / elevation): front-light facades and interiors; ShotDef sunAz / sunEl win */
const SUN_SET: Partial<Record<SetName, { az: number; el: number }>> = {
  palace: { az: 128, el: 40 }, street: { az: 125, el: 42 }, cell: { az: 140, el: 40 }, attic: { az: 135, el: 38 }, salon: { az: 140, el: 34 },
};
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 23: { az: 118, el: 12 }, 17: { az: 140, el: 30 } };

/** sight lines per set: every lens position of that set's shots looking at its subject */
const sightLines = (): Record<string, Ray[]> => {
  const out: Record<string, Ray[]> = {};
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (16 / 9);
    const list = (out[s.set] ??= []);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      list.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

type Gun = { o: THREE.Group; set: SetName; x: number; z: number; yaw: number; fires: number[] };
type FlagM = { cloth: THREE.Mesh; pole: THREE.Mesh; kind: string };

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private sets: Sets;
  private guns: Gun[] = [];
  private flags: FlagM[] = [];
  private WU: Record<string, THREE.IUniform>;
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
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- the sets ----
    this.sets = buildSets(kit, sightLines());
    for (const g of Object.values(this.sets)) { g.visible = false; R.add(g); }

    // ---- the river at Lodi ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "ch4river";
    const wm = new THREE.Mesh(quadUp(-500, 500, -RIVER - 1, RIVER + 1, 1, 1, WATER_Y), waterM);
    wm.receiveShadow = true;
    this.sets.lodi.add(wm);

    // ---- guns ----
    const addGun = (set: SetName, x: number, z: number, yaw: number, fires: number[] = []) => {
      const o = cannon(); o.position.set(x, 0, z); o.rotation.y = yaw; this.sets[set].add(o);
      this.guns.push({ o, set, x, z, yaw, fires });
    };
    STREET_GUNS.forEach(([x, , z], j) => addGun("street", x, z, Math.PI / 2, [(1610 + 17 * j) / FPS]));
    addGun("palace", 6.4, -5.6, -0.6);
    const balls = cannonballs(3); balls.position.set(5.0, 0, -6.9); this.sets.palace.add(balls);
    for (let i = 0; i < 5; i++) addGun("country", PARK[0] - 6 + i * 3, PARK[2] - 2, -Math.PI / 2);
    [-12, -6, 8].forEach((x, j) => addGun("lodi", x, -46, -Math.PI / 2, [(2600 + 30 * j) / FPS]));
    const balls2 = cannonballs(3); balls2.position.set(-9, 0, -48.5); this.sets.lodi.add(balls2);
    // salon candles: two on the wedding table, two three-branched candelabras
    const wax = lam("ch4wax", () => ({ color: "#f3ead2" })), gilt = lam("ch4gilt", () => ({ color: "#d4ac55" }));
    const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; this.sets.salon.add(o); };
    for (const x of [-3.75, -2.85]) { add(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 12), gilt, x, 0.89, -3.5); add(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 10), wax, x, 1.03, -3.5); }
    for (const [x, z] of [[-5.0, -4.4], [-1.6, -4.4]]) {
      add(new THREE.CylinderGeometry(0.03, 0.18, 1.6, 10), gilt, x, 0.8, z);
      add(new THREE.BoxGeometry(0.44, 0.04, 0.04), gilt, x, 1.62, z);
      for (const [dx, h] of [[-0.18, 0], [0, 0.12], [0.18, 0]]) add(new THREE.CylinderGeometry(0.022, 0.022, 0.2, 8), wax, x + dx, 1.74 + h, z);
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
    const o = SUN_SHOT[id] ?? {}, d = s.light === "day" ? SUN_SET[s.set] : undefined;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? o.az ?? d?.az ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? o.el ?? d?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }
  private flag(i: number) {
    while (this.flags.length <= i) {
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.625, 12, 1), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xe8e8e8 }));
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1, 8).translate(0, 0.5, 0), lam("ch4flagpole", () => ({ color: "#6e4b33" })));
      cloth.castShadow = true; cloth.frustumCulled = false; pole.castShadow = true;
      this.root.add(cloth, pole);
      this.flags.push({ cloth, pole, kind: "" });
    }
    return this.flags[i];
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    for (const [name, g] of Object.entries(this.sets)) g.visible = name === s.set;
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.15; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
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
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden" && s.set !== "salon";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    // ---- guns: recoil after each shot, roll back over ~2 s ----
    for (const g of this.guns) {
      if (g.set !== s.set) continue;
      let d = 0;
      for (const t0 of g.fires) { const u = t - t0; if (u > 0) d = Math.max(d, 0.85 * Math.min(1, u * 14) * Math.exp(-u * 0.8)); }
      g.o.position.set(g.x - Math.cos(g.yaw) * d, 0, g.z + Math.sin(g.yaw) * d);
    }
    // ---- flags ----
    const fl = flagsAt(id, f);
    fl.forEach((p, i) => {
      const m = this.flag(i);
      if (m.kind !== p.kind) { (m.cloth.material as THREE.MeshBasicMaterial).map = flagTex(p.kind); (m.cloth.material as THREE.MeshBasicMaterial).needsUpdate = true; m.kind = p.kind; }
      m.cloth.visible = m.pole.visible = true;
      m.pole.position.set(p.x, p.y, p.z); m.pole.scale.set(1, p.h + 0.15, 1);
      const pos = m.cloth.geometry.attributes.position as THREE.BufferAttribute, w = p.w, hgt = w * 0.625;
      for (let k = 0; k < pos.count; k++) {
        const u = (k % 13) / 12, top = k < 13;
        pos.setXYZ(k, u * w, (top ? hgt : 0) - 0.06 * w * u * Math.sin(t * 3.4 - u * 2.5) - 0.12 * w * u * u, 0.18 * w * u * Math.sin(t * 5.2 - u * 5 + p.x));
      }
      pos.needsUpdate = true;
      m.cloth.position.set(p.x, p.y + p.h - hgt, p.z);
      m.cloth.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z) + 0.45, 0);
    });
    for (let i = fl.length; i < this.flags.length; i++) this.flags[i].cloth.visible = this.flags[i].pole.visible = false;
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, f, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
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
      if (a.mat.emissiveMap) a.mat.emissive.set(tint);
      a.mesh.castShadow = L.actorShadow && s.set !== "salon";
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;
export type { V3 };
