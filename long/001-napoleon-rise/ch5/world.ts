// Chapter 5 world: one three.js scene holding every place of the chapter (places.ts), each a group shown only in its
// own shots; the sky, light rig, fog and water from the sample chapter (camera-relative sun frozen per shot), plus two
// night looks (moonlight, the burning bay) and a hazy desert look. update(id, f, camera) poses everything for shot `id`
// at frame f (a pure function of id + f): camera, light, ships bobbing, flags waving, cast and effect cards.
import * as THREE from "three";
import { V, Kit, Ray } from "../../../src/engine/build";
import { loadKenney } from "../../../src/engine/kit";
import { ctex, waterNear, waterFar, cloudHD } from "../../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "../../../src/engine/lights";
import { TONE, CHAR, LFB, untone } from "../../../src/engine/shade";
import { NOINK } from "../../../src/engine/ink";
import { Pool, Actor, Fx } from "../../../src/engine/cards";
import { buildVoyage, buildShore, buildFrenchLine, buildBritish, buildWrecks, buildEscape, buildDesert, buildFrance, rosettaStone, Bobber, Waver } from "./places";
import { stage } from "./cast";
import { FPS, SHOTS, ShotDef, camAt, SHORE_Z, DIG, STONE2, smallX, SMALL_Z, patrolX, PATROL_Z, brZ, BOOM } from "./story";

const KENNEY = ["lantern"];
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

// ---------------- looks: desert haze, the two nights ----------------
const DESERT_L: LightPreset = { ...LIGHTS.day, hor: "#e9dfc9", fog: "#e9dfc9", fogNear: 90, fogFar: 1150, lift: [0.06, 0.06, 0.1] };
const DESERT_K: WorldLook = { ...LOOK.day, sky: { c: ["#ece0c6", "#d3d9df", "#9cbde4", "#6a9fe0", "#3f80d4"], e: [0, 3, 9, 18, 40] } };
const DESERT_GL: LightPreset = { ...LIGHTS.golden, fogNear: 80, fogFar: 900 };
const MOON_L: LightPreset = {
  ...LIGHTS.day, az: 40, el: 28,
  lit: [0.78, 0.9, 1.25], shade: [0.2, 0.22, 0.42], lift: [0.06, 0.07, 0.17], lambert: 0.35, sideK: 0.84, term: 0.2,
  charTint: [0.78, 0.84, 1.02], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.85, 0.88, 1.0],
  blob: [0.55, 0.55, 0.7], top: "#18224a", hor: "#4a5f96", fog: "#3b4c80", fogNear: 40, fogFar: 460, sunDisc: "#f4f2ff",
};
const MOON_K: WorldLook = {
  sky: { c: ["#55689e", "#3e5089", "#2b3a72", "#1d2a5a", "#121b42"], e: [0, 4, 10, 20, 45] },
  water: { near: "#1d3566", mid: "#22406f", far: "#3e5384", crest: "#7d93c8", trough: "#0f1d40", glint: "#e6ecff", shade: [0.5, 0.56, 0.75] },
  cloud: { lit: "#8e9cc8", mid: "#5f6d9e", shade: "#3c4778" }, bounce: [0, 0, 0.02], sat: 1.0,
};
const FIRE_L: LightPreset = {
  ...LIGHTS.golden, az: 20, el: 14,
  lit: [1.35, 0.72, 0.42], shade: [0.16, 0.14, 0.32], lift: [0.06, 0.05, 0.16],
  charTint: [1.0, 0.78, 0.66], top: "#1e1838", hor: "#a8564a", fog: "#563452", fogNear: 60, fogFar: 520, sunDisc: "#ffcf9e",
};
const FIRE_K: WorldLook = {
  sky: { c: ["#b0604c", "#7c3f4c", "#4a2c4c", "#2a2042", "#151530"], e: [0, 3, 8, 18, 40] },
  water: { near: "#1a1d3c", mid: "#2b2748", far: "#9a5048", crest: "#e09060", trough: "#120f28", glint: "#ffc98a", shade: [0.45, 0.42, 0.65] },
  cloud: { lit: "#a86a6a", mid: "#6a4560", shade: "#3a2c4a" }, bounce: [0.04, 0.02, 0.0], sat: 1.05,
};
const lookOf = (s: ShotDef): { L: LightPreset; K: WorldLook } => {
  if (s.night === "moon") return { L: MOON_L, K: MOON_K };
  if (s.night === "fire") return { L: FIRE_L, K: FIRE_K };
  if (s.place === "desert") return s.light === "day" ? { L: DESERT_L, K: DESERT_K } : { L: DESERT_GL, K: LOOK.golden };
  return { L: LIGHTS[s.light], K: LOOK[s.light] };
};
/** per-shot sun override (degrees from the shot's mean view direction) */
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 9: { az: 12, el: 6 }, 10: { az: -25, el: 8 }, 16: { az: 25, el: 9 }, 19: { az: -60, el: 18 }, 12: { az: 110, el: 30 } };
/** water flow (m/s, the pattern drifts -x): the sailing convoy; the bay is calm */
const FLOW: Record<string, number> = { voyage: 3.2, bay: 0.15, battle: 0.1, wrecks: 0.15, escape: 1.2, desert: 0.4, france: 0 };

/** every lens position of the France shots (the street houses keep out of them) */
const sightLines = (ids: number[]): Ray[] => {
  const out: Ray[] = [];
  for (const id of ids) {
    const s = SHOTS[id - 1];
    for (let f = s.a - 8; f < s.b + 8; f += 2) {
      const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
      const fw = look.clone().sub(o), len = fw.length();
      fw.normalize();
      const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
      const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (16 / 9);
      for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
        out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
    }
  }
  return out;
};

type GroupName = "seaFull" | "seaCut" | "voyage" | "shore" | "frLine" | "brSail" | "brBattle" | "wrecks" | "escape" | "desert" | "france";
const SHOW: Record<string, GroupName[]> = {
  voyage: ["seaFull", "voyage"], desert: ["desert"], bay: ["seaCut", "shore", "frLine", "brSail"], battle: ["seaCut", "shore", "frLine", "brBattle"],
  wrecks: ["seaCut", "shore", "wrecks"], escape: ["seaCut", "shore", "escape"], france: ["france"],
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden" | "moon" | "fire", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private G = {} as Record<GroupName, THREE.Group>;
  private bobs: Record<string, Bobber[]> = {};
  private wav: Waver[] = [];
  private escape: { small: THREE.Group; patrol: THREE.Group };
  private digStone: THREE.Group; private crateStone: THREE.Group;
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
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)),
      moon: [0, 1, 2, 3].map((k) => cloudHD(k, MOON_K.cloud)), fire: [0, 1, 2, 3].map((k) => cloudHD(k, FIRE_K.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }
    for (const n of ["seaFull", "seaCut", "voyage", "shore", "frLine", "brSail", "brBattle", "wrecks", "escape", "desert", "france"] as GroupName[]) {
      const g = new THREE.Group(); g.visible = false; this.G[n] = g; R.add(g);
    }
    // ---- water (sample river shader; the flow offset is a uniform) ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wOff: { value: 0 },
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
    waterM.customProgramCacheKey = () => "oj5sea";
    const waterPlane = (x0: number, x1: number, z0: number, z1: number, y: number) => {
      const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
      const m = new THREE.Mesh(g, waterM); m.receiveShadow = true; return m;
    };
    this.G.seaFull.add(waterPlane(-3000, 3000, -3000, 3000, 0));
    this.G.seaCut.add(waterPlane(-3000, 3000, SHORE_Z + 6, 3000, 0));
    this.G.desert.add(waterPlane(300, 380, -3000, 3000, -0.55));
    // ---- places ----
    for (const k of ["voyage", "frLine", "brSail", "brBattle", "wrecks"]) this.bobs[k] = [];
    buildVoyage(this.G.voyage, this.bobs.voyage);
    buildShore(this.G.shore);
    buildFrenchLine(this.G.frLine, this.bobs.frLine);
    buildBritish(this.G.brSail, this.bobs.brSail, false, true);
    buildBritish(this.G.brBattle, this.bobs.brBattle, true, false);
    buildWrecks(this.G.wrecks, this.bobs.wrecks);
    this.escape = buildEscape(this.G.escape);
    buildDesert(this.G.desert, kit, []);
    this.digStone = rosettaStone(); this.digStone.position.set(DIG[0] + 0.4, 0.25, DIG[2] - 0.6); this.digStone.rotation.set(-0.95, -0.25, 0.08);
    this.crateStone = rosettaStone(); this.crateStone.position.set(STONE2[0], 0.55 + 0.57, STONE2[2]); this.crateStone.rotation.set(-0.08, 0.05, 0);
    this.G.desert.add(this.digStone, this.crateStone);
    buildFrance(this.G.france, kit, sightLines([18, 19, 20, 21, 22]), this.wav);
    this.G.france.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && o.parent && o.parent !== this.G.france) m.castShadow = false; });
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
    const t = f / FPS, s = SHOTS[id - 1], { L, K } = lookOf(s);
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (L.actorShadow) Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun / moon, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden" || !!s.night;
    this.sunDisc.visible = this.sunHalo.visible = showSun && s.place !== "france";
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(s.night === "moon" ? 1.2 : 1.7)));
      (this.sunDisc.material as THREE.SpriteMaterial).color.set(s.night === "moon" ? new THREE.Color(2.2, 2.2, 2.4) : new THREE.Color(6.0, 4.4, 2.4));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(s.night === "moon" ? 10 : 24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(s.night === "moon" ? 0.35 : 1.3);
    }
    const cm = this.cloudMaps[s.night ?? s.light];
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = cm[i % 4];
      m.visible = s.place !== "france";
    }
    // ---- water ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wOff.value = (FLOW[s.place] ?? 0) * t;
    // ---- places ----
    const show = new Set(SHOW[s.place]);
    for (const [n, g] of Object.entries(this.G)) g.visible = show.has(n as GroupName);
    this.digStone.visible = id === 14; this.crateStone.visible = id === 15;
    for (const [n, list] of Object.entries(this.bobs)) if (show.has(n as GroupName)) for (const b of list) {
      const w = t * 0.9 + b.ph;
      b.o.position.set(b.x + (b.vx ?? 0) * brZ(t), b.y + b.amp * 0.22 * Math.sin(w), b.z + (b.vz ?? 0) * brZ(t));
      b.o.rotation.set(b.amp * 0.018 * Math.sin(w * 0.8 + 1), b.yaw, b.amp * 0.012 * Math.sin(w * 0.6));
    }
    // L'Orient (the middle of the French line) is gone once the fireball covers it
    this.bobs.frLine[6].o.visible = !(id === 11 && t > BOOM + 0.1);
    if (s.place === "escape") {
      const { small, patrol } = this.escape;
      small.position.set(smallX(t), -0.6 + 0.15 * Math.sin(t * 1.2), SMALL_Z); small.rotation.set(0.02 * Math.sin(t), 0.06, 0.015 * Math.sin(t * 0.8));
      patrol.position.set(patrolX(t), -0.9 + 0.12 * Math.sin(t), PATROL_Z); patrol.rotation.set(0.012 * Math.sin(t * 0.7), Math.PI + 0.1, 0.01 * Math.sin(t));
    }
    for (const fl of this.wav) {
      const p = fl.m.geometry.attributes.position as THREE.BufferAttribute;
      const nx = (p.count / 2) - 1;
      for (let i = 0; i < p.count; i++) {
        const k = i % (nx + 1), u = k / nx, y = i <= nx ? 0.5 : -0.5;
        p.setXYZ(i, u * fl.w, y * fl.w * 0.62 + 0.04 * u * fl.w * Math.sin(t * 4 - u * 3), 0.15 * u * fl.w * Math.sin(t * 5.2 - u * 5 + fl.ph));
      }
      p.needsUpdate = true;
    }
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right });
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
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      const glow = p.key.startsWith("glow") ? 2.4 : 1;
      e.mat.color.setScalar(glow); e.soft.color.setScalar(glow);
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
uniform float wOff;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(wOff, 0.0);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;
