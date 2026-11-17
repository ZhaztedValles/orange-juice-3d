// Chapter 3 as one three.js scene: sky + light rig (day, golden and a rainy night preset built from the day one), the
// harbour water, the static sets (sets.ts) and everything that moves per frame: ships (anchored, sailing in, sailing
// away), flags (the white flag on the quay, the fort's ensign, the tricolour going up, the Paris crowd's flags),
// guns (camp gun, hauled guns, battery recoil), the crown rolling off the throne, the toy armies on the war table, the
// sabre over the camp map, the cast cards and effect cards. update(id, f, camera) is a pure function of id + f.
import * as THREE from "three";
import { V, lam, Kit, Ray } from "../../../src/engine/build";
import { loadKenney } from "../../../src/engine/kit";
import { ctex, waterNear, waterFar, cloudHD } from "../../../src/engine/paint";
import { Pen } from "../../../src/engine/toon";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "../../../src/engine/lights";
import { TONE, CHAR, LFB, twoTone, untone } from "../../../src/engine/shade";
import { NOINK } from "../../../src/engine/ink";
import { Pool, Actor, Fx } from "../../../src/engine/cards";
import { cannon, warship, flagTex, cannonballs } from "../shared/props";
import { buildSets, onEurope, onToulonMap, GUNS_BAT } from "./sets";
import { stage, CROWD, noblePos, CAMP_GUN, recoil, batFires, NAP_CAPTAIN } from "./cast";
import {
  FPS, SHOTS, camAt, V3, ShotDef, Light, smooth, clamp01, CROWN_T, ARMY_T0, FLAG_UP, SIEGE_SHOT, POINT_T, FALL_T, haulX, HAUL_Z,
  THRONE, WAR_TABLE, FORT_C, FLAGPOLE, WALL_TOP, BAT, glide,
} from "./story";
import { ground, LAND, QUAY_Z, PARIS } from "./terrain";

const KENNEY = ["tree_oak", "tree_default", "tree_fat", "tree_cone", "plant_bushLarge", "plant_bush", "lantern", "cart"];
export const loadKit = () => loadKenney(KENNEY);
void NAP_CAPTAIN;

// ---------------- night preset (rain, 17 December 1793): the day preset cooled and dimmed, faces kept readable ----------------
const NIGHT: LightPreset = {
  ...LIGHTS.day,
  az: 120, el: 38,
  lit: [0.62, 0.7, 0.98], shade: [0.2, 0.22, 0.36], lift: [0.06, 0.07, 0.13], term: 0.25,
  charTint: [0.8, 0.86, 1.05], charShade: 0.84,
  top: "#1d2740", hor: "#4d5a78", fog: "#4a5672", fogNear: 12, fogFar: 170,
  sunCol: "#a8bce8", sunI: 1.6, sky: "#7d8fb8", ground: "#3a3a4a", hemiI: 0.45,
};
const NIGHT_LOOK: WorldLook = {
  sky: { c: ["#4d5a78", "#3f4b68", "#323d58", "#283249", "#1d2740"], e: [0, 3, 8, 16, 40] },
  water: { near: "#1d3048", mid: "#22385a", far: "#3a4866", crest: "#6d82a8", trough: "#0f1a2c", glint: "#b8c8ea", shade: [0.6, 0.62, 0.75] },
  cloud: { lit: "#6a7590", mid: "#56607a", shade: "#424b63" },
  bounce: [0, 0, 0], sat: 0.85,
};
const preset = (l: Light) => (l === "night" ? NIGHT : LIGHTS[l]);
const lookOf = (l: Light) => (l === "night" ? NIGHT_LOOK : LOOK[l]);

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

/** sight lines of every lens toward its subject (houses / trees there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(s.a - 6, Math.min(s.b - 1, f))), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (16 / 9);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4], [-0.85, 0.3], [0.85, 0.3]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len: Math.min(len, 60), core: sx === 0 && sy === 0 });
  }
  return out;
};

/** a waving flag on its own mesh (hoist at the local origin, flying toward +x), double-sided, unlit-ish */
class Flag {
  mesh: THREE.Mesh; w: number;
  constructor(kind: "fr" | "uk" | "white", w: number, parent: THREE.Object3D) {
    this.w = w;
    const geo = new THREE.PlaneGeometry(w, w * 0.625, 12, 1); geo.translate(w / 2, 0, 0);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: flagTex(kind), side: THREE.DoubleSide, color: 0xe6e6e6 }));
    this.mesh.castShadow = true; this.mesh.frustumCulled = false;
    parent.add(this.mesh);
  }
  wave(t: number, seed = 0, amp = 1) {
    const p = this.mesh.geometry.attributes.position as THREE.BufferAttribute, w = this.w;
    for (let i = 0; i < p.count; i++) {
      const u = (i % 13) / 12, y = i < 13 ? 0.3125 * w : -0.3125 * w;
      p.setXYZ(i, u * w * (1 - 0.04 * amp), y - 0.06 * w * u * amp + 0.03 * w * u * Math.sin(t * 4 - u * 3 + seed), 0.16 * w * u * amp * Math.sin(t * 6 - u * 6 + seed));
    }
    p.needsUpdate = true;
  }
}
const pole = (h: number, m: THREE.Material) => { const x = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, h, 8).translate(0, h / 2, 0), m); x.castShadow = true; return x; };

/** the crown: a gold band with points and pearls, red cap; origin at the centre of its base ring */
const crownMesh = () => {
  const g = new THREE.Group(), gold = twoTone(new THREE.MeshPhongMaterial({ color: "#e0b23e", specular: "#fff0b0", shininess: 50 }), 0.15);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.12, 24, 1, true), gold); band.position.y = 0.06; g.add(band);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), lam("ojl3_crowncap", () => ({ color: "#b0263a" }))); cap.position.y = 0.1; cap.scale.y = 0.8; g.add(cap);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4, pt = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 6), gold);
    pt.position.set(0.165 * Math.cos(a), 0.17, 0.165 * Math.sin(a)); g.add(pt);
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), lam(k % 2 ? "ojl3_gemB" : "ojl3_gemR", () => ({ color: k % 2 ? "#3f6fd8" : "#d83a4a" })));
    gem.position.set(0.172 * Math.cos(a + 0.39), 0.06, 0.172 * Math.sin(a + 0.39)); g.add(gem);
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), gold); ball.position.y = 0.24; g.add(ball);
  g.traverse((o) => { o.castShadow = true; });
  return g;
};
/** the sabre pointer over the camp map (blade along +x, hilt at the origin) */
const sabreMesh = () => {
  const g = new THREE.Group();
  const steel = twoTone(new THREE.MeshPhongMaterial({ color: "#c9ced8", specular: "#ffffff", shininess: 70 }), 0.15);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.012, 0.035).translate(0.42, 0, 0), steel); g.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 4).rotateZ(-Math.PI / 2).translate(0.855, 0, 0), steel); g.add(tip);
  const gold = lam("ojl3_gold", () => ({ color: "#d9a93c" }));
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.14), gold); g.add(guard);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.13, 8).rotateZ(Math.PI / 2).translate(-0.07, 0, 0), lam("ojl3_grip", () => ({ color: "#2a1f1c" }))); g.add(grip);
  g.traverse((o) => { o.castShadow = true; });
  return g;
};

type ShipRec = { g: THREE.Group; rock: number };

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
  private cloudMaps: Record<Light, THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private anchored: ShipRec[] = []; private sailing: ShipRec[] = []; private french: ShipRec[] = [];
  private flagWhite: Flag; private flagWhitePole: THREE.Object3D;
  private fortUK: Flag; private fortFR: Flag;
  private batFlag: Flag; private crowdFlags: { f: Flag; p: THREE.Object3D }[] = [];
  private campGun: THREE.Group; private batGuns: THREE.Group[] = []; private haulGuns: THREE.Group[] = []; private fortGuns: THREE.Group[] = [];
  private crown: THREE.Group; private sabre: THREE.Group;
  private toys: { m: THREE.Mesh; from: V3; to: V3; d: number }[] = [];
  private trunks: THREE.Mesh[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky + light ----
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
      night: [0, 1, 2, 3].map((k) => cloudHD(k, NIGHT_LOOK.cloud)) };
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- static sets ----
    buildSets(R, kit, sightLines());

    // ---- harbour water (one plane at y = 0, the land covers it where it rises) ----
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
    waterM.customProgramCacheKey = () => "ojl3sea";
    const wg = new THREE.PlaneGeometry(2400, 1800); wg.rotateX(-Math.PI / 2); wg.translate(300, 0, -100);
    const wm = new THREE.Mesh(wg, waterM); wm.receiveShadow = true; R.add(wm);

    // ---- ships ----
    const anchorAt: [number, number, number][] = [[-35, -62, 0.4], [18, -18, -0.2], [62, -78, 0.15], [104, -26, -0.35], [-62, -18, 0.6], [140, -72, 0.1]];
    for (const [x, z, yaw] of anchorAt) {
      const g = warship({ flag: "uk", sails: "furled", length: 38 }); g.position.set(x, -0.9, z); g.rotation.y = yaw; R.add(g);
      this.anchored.push({ g, rock: x * 0.1 });
    }
    for (let k = 0; k < 5; k++) { const g = warship({ flag: "uk", sails: "set", length: 38, brace: 40 }); g.visible = false; R.add(g); this.sailing.push({ g, rock: k * 1.7 }); }
    for (const x of [-52, -8]) {
      const g = warship({ flag: "fr", sails: "furled", length: 40 }); g.position.set(x, -0.9, QUAY_Z - 12.5); g.rotation.y = 0; R.add(g);
      this.french.push({ g, rock: x });
    }
    // ---- flags ----
    const poleM = lam("ojl3_pole", () => ({ color: "#6a4a32" }));
    this.flagWhitePole = pole(11, poleM); this.flagWhitePole.position.set(29, LAND, 76.5); R.add(this.flagWhitePole);
    this.flagWhite = new Flag("white", 3.2, R);
    const fp = pole(12, poleM); fp.position.set(FLAGPOLE[0], FLAGPOLE[1], FLAGPOLE[2]); R.add(fp);
    this.fortUK = new Flag("uk", 3.0, R); this.fortFR = new Flag("fr", 3.0, R);
    const bp = pole(5.5, poleM); bp.position.set(BAT[0] + 2.2, ground(BAT[0] + 2.2, BAT[2] - 6.2), BAT[2] - 6.2); R.add(bp);
    this.batFlag = new Flag("fr", 1.6, R);
    this.batFlag.mesh.position.set(bp.position.x, bp.position.y + 4.5, bp.position.z);
    for (let k = 0; k < CROWD.filter((c) => c.flag).length; k++) {
      const p = pole(3.4, poleM); R.add(p);
      this.crowdFlags.push({ f: new Flag("fr", 1.6, R), p });
    }
    // ---- guns ----
    this.campGun = cannon({ elev: 6 }); this.campGun.position.set(...CAMP_GUN); R.add(this.campGun);
    for (const [x, z] of GUNS_BAT) { const g = cannon({ elev: 7 }); g.position.set(x, ground(x, z), z); R.add(g); this.batGuns.push(g); }
    for (let k = 0; k < 2; k++) { const g = cannon({ elev: 2 }); R.add(g); this.haulGuns.push(g); }
    for (const a of [0.95, 1.15, 1.35]) {
      const g = cannon({ paint: "#5d6670", barrel: "#3d414c", elev: -6 });
      g.position.set(FORT_C[0] + 17.5 * Math.cos(Math.PI * a), WALL_TOP, FORT_C[1] + 17.5 * Math.sin(Math.PI * a));
      g.rotation.y = -Math.PI * a; R.add(g); this.fortGuns.push(g);
    }
    for (const [x, z] of [[BAT[0] - 2.4, BAT[2] - 5.6], [BAT[0] - 2.8, BAT[2] + 5.4], [CAMP_GUN[0] - 1.8, CAMP_GUN[2] + 1.5]] as [number, number][]) {
      const b = cannonballs(3); b.position.set(x, ground(x, z), z); R.add(b);
    }
    // ---- crown, sabre, toy armies, trunks ----
    this.crown = crownMesh(); R.add(this.crown);
    this.sabre = sabreMesh(); R.add(this.sabre);
    const toyCols = ["#c8372f", "#f2efe6", "#e0c27a", "#3d3a4a", "#8aa04a", "#d9a7a0"];
    // [from u,v] -> [to u,v] around France (map 1024 x 704: France ~ 330..520, 300..520)
    const TOY: [number, number, number, number, number][] = [
      [0.30, 0.10, 0.36, 0.44, 0], [0.33, 0.06, 0.40, 0.46, 0], [0.15, 0.93, 0.33, 0.73, 2], [0.22, 0.97, 0.38, 0.74, 2],
      [0.78, 0.48, 0.52, 0.56, 4], [0.82, 0.55, 0.53, 0.62, 4], [0.86, 0.30, 0.50, 0.47, 3], [0.90, 0.36, 0.52, 0.52, 3],
      [0.70, 0.95, 0.50, 0.72, 5], [0.62, 0.98, 0.48, 0.70, 5], [0.55, 0.20, 0.47, 0.42, 1], [0.96, 0.22, 0.51, 0.44, 3],
    ];
    const toyGeo = new THREE.BoxGeometry(0.12, 0.07, 0.07);
    TOY.forEach(([u0, v0, u1, v1, c], i) => {
      const m = new THREE.Mesh(toyGeo, lam(`ojl3_toy${c}`, () => ({ color: toyCols[c] }))); m.castShadow = true; R.add(m);
      const a = onEurope(u0, v0), b = onEurope(u1, v1);
      this.toys.push({ m, from: [a[0], a[1] + 0.035, a[2]], to: [b[0], b[1] + 0.035, b[2]], d: (i % 4) * 0.12 });
    });
    for (let k = 0; k < 4; k++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.36), lam("ojl3_trunk", () => ({ color: "#7a4a2c" }))); m.castShadow = true; R.add(m);
      this.trunks.push(m);
    }
    // the French blocks (blue) already in place on the map
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(toyGeo, lam("ojl3_toyFR", () => ({ color: "#3a5fc0" }))); m.castShadow = true;
      const p = onEurope(0.38 + (i % 3) * 0.05, 0.52 + Math.floor(i / 3) * 0.08); m.position.set(p[0], p[1] + 0.035, p[2]); m.rotation.y = i * 0.5; R.add(m);
    }
  }

  /** camera-relative sun, frozen per shot */
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
    const t = f / FPS, s = SHOTS[id - 1], L = preset(s.light), K = lookOf(s.light);
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 110);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 260); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 560; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = s.light === "night" ? L.fogFar : Math.max(L.fogFar, s.fogFar ?? L.fogFar);
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60, w = 130 + (i % 4) * 30;
      m.position.set(cam.position.x + Math.cos(a) * d, 120 + (i % 4) * 38 + (s.light === "night" ? -50 : 0), cam.position.z + Math.sin(a) * d);
      m.scale.set(s.light === "night" ? w * 1.6 : w, (s.light === "night" ? w * 1.6 : w) / 2, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- water colours ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    // ---- moving things ----
    this.poseProps(id, t, f);
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right });
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
      e2.mesh.scale.set(p.w, p.h, 1);
      e2.mesh.renderOrder = p.soft ? 10 : 0;
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e3 of fused) { e3.bind(); if (e3.mesh.material === e3.soft) e3.mesh.renderOrder = 10; }
    return focus;
  }

  private poseProps(id: number, t: number, f: number) {
    // ships: anchored British fleet from shot 8 to 16; the French ships always at the quay
    const brit = id >= 8 && id <= 16;
    for (const sh of this.anchored) { sh.g.visible = brit; sh.g.rotation.z = 0.012 * Math.sin(t * 0.9 + sh.rock); sh.g.position.y = -0.9 + 0.1 * Math.sin(t * 1.1 + sh.rock); }
    for (const sh of this.french) { sh.g.rotation.z = 0.01 * Math.sin(t * 0.8 + sh.rock); }
    this.sailing.forEach((sh, k) => {
      let vis = false;
      if (id === 7) { // three ships sail in from the east, heading west
        vis = k < 3;
        const x = 262 + k * 46 - 9 * (t - 26.8), z = -24 - k * 24;
        sh.g.position.set(x, -0.9, z); sh.g.rotation.y = Math.PI + 0.12;
      } else if (id === 17) { // the whole fleet sails away east
        vis = true;
        const x = -10 + k * 38 + 6.5 * (t - 85.2), z = -50 - (k % 3) * 24 + k * 4;
        sh.g.position.set(x, -0.9, z); sh.g.rotation.y = -0.08;
      }
      sh.g.visible = vis;
      sh.g.rotation.z = 0.02 * Math.sin(t * 1.0 + sh.rock); sh.g.rotation.x = 0.012 * Math.sin(t * 0.7 + sh.rock);
    });
    // the white flag on the quay: hoisted on "rebelled" (shot 6), flying after (6-7)
    const up = smooth((t - FLAG_UP[0]) / (FLAG_UP[1] - FLAG_UP[0]));
    const showWhite = id === 6 || id === 7;
    this.flagWhite.mesh.visible = showWhite && (id === 7 || f >= 722);
    this.flagWhite.mesh.position.set(29.05, LAND + (id === 6 ? 1.8 + 7.6 * up : 9.4), 76.5);
    this.flagWhite.mesh.rotation.y = -0.6;
    this.flagWhite.wave(t, 0.3);
    // the fort's ensign: British until it falls (shot 16), tricolour after
    const fallen = id >= 17 || (id === 16 && t >= FALL_T);
    this.fortUK.mesh.visible = !fallen && id >= 11; this.fortFR.mesh.visible = id >= 16 && (id > 16 || true);
    const rise = id === 16 ? smooth((t - (FALL_T - 0.9)) / 1.1) : 1;
    this.fortUK.mesh.position.set(FLAGPOLE[0] + 0.04, FLAGPOLE[1] + 10.9, FLAGPOLE[2]);
    this.fortFR.mesh.position.set(FLAGPOLE[0] + 0.04, FLAGPOLE[1] + 2.2 + 8.7 * rise, FLAGPOLE[2]);
    if (id === 16) this.fortUK.mesh.visible = false;
    for (const fl of [this.fortUK, this.fortFR]) { fl.mesh.rotation.y = 0.5; fl.wave(t, 1.1, id === 15 || id === 16 ? 1.4 : 1); }
    this.batFlag.mesh.visible = id === 13 || id === 14;
    this.batFlag.mesh.rotation.y = 2.4; this.batFlag.wave(t, 2.0);
    // Paris crowd flags (shot 1): held at the shoulder of each flag bearer, on the side away from the camera's left
    let k = 0;
    for (const c of CROWD) {
      if (!c.flag) continue;
      const cf = this.crowdFlags[k++];
      const vis = id === 1;
      cf.p.visible = cf.f.mesh.visible = vis;
      if (!vis) continue;
      const sway = 0.12 * Math.sin(t * 2.2 + k);
      cf.p.position.set(c.x + 0.38, 0.55, c.z + 0.05); cf.p.rotation.set(0, 0, -sway);
      cf.f.mesh.position.set(c.x + 0.38 - 3.4 * Math.sin(sway) * 0.9, 0.55 + 3.4 * Math.cos(sway) - 0.42, c.z + 0.05);
      cf.f.mesh.rotation.set(0, 0.35 + 0.2 * Math.sin(t + k), -sway);
      cf.f.wave(t, k * 0.9, 1.1);
    }
    // nobles' trunks (shot 4)
    this.trunks.forEach((m, kk) => {
      m.visible = id === 4;
      if (!m.visible) return;
      const [x, z] = noblePos(kk, t);
      m.position.set(x + 0.42, 0.62 + 0.03 * Math.sin(t * 12 + kk), z - 0.22); m.rotation.y = 0.1;
    });
    // camp gun (shot 8) recoil
    this.campGun.position.set(CAMP_GUN[0] - recoil(t, SIEGE_SHOT), CAMP_GUN[1], CAMP_GUN[2]);
    // battery guns recoil
    this.batGuns.forEach((g, kk) => {
      let r = 0;
      if (id === 13) for (const t0 of batFires(kk)) r = Math.max(r, recoil(t, t0));
      if (id === 14 && kk === 0) for (const t0 of [73.0, 74.4]) r = Math.max(r, recoil(t, t0));
      const [x, z] = GUNS_BAT[kk]; g.position.set(x - r, ground(x, z), z);
    });
    // hauled guns (shot 13): roll along +x, wheels turn
    this.haulGuns.forEach((g, kk) => {
      g.visible = id === 13 && f < 2005;
      const x = haulX(t) - kk * 7.5, z = HAUL_Z - kk * 2.2, y = ground(x, z);
      g.position.set(x, y, z);
      const ahead = ground(x + 1.5, z) - ground(x - 1.5, z); g.rotation.z = Math.atan2(ahead, 3);
      for (const w of [g.children[0], g.children[1]]) w.rotation.z = -(x + 300) / 0.7;
    });
    // fort guns: visible from the outside shots only (they sit on the wall walk)
    for (const g of this.fortGuns) g.visible = id >= 11 && id <= 16;
    // the crown (shot 2): on the seat, tips at CROWN_T, drops off the dais and rolls toward the lens, settles
    this.crown.visible = id === 2;
    if (id === 2) this.poseCrown(t);
    // toy armies (shot 3)
    for (const ty of this.toys) {
      const u = glide((t - ARMY_T0 - ty.d) / 1.6);
      ty.m.position.set(ty.from[0] + (ty.to[0] - ty.from[0]) * u, ty.from[1] + 0.02 * Math.sin(u * Math.PI) * 0, ty.from[2] + (ty.to[2] - ty.from[2]) * u);
      ty.m.rotation.y = Math.atan2(-(ty.to[2] - ty.from[2]), ty.to[0] - ty.from[0]);
      ty.m.visible = true;
    }
    // the sabre over the camp map (shot 10c): from the town to the heights
    this.sabre.visible = id === 10 && f >= 1468;
    if (this.sabre.visible) {
      const u = glide((t - POINT_T[0]) / (POINT_T[1] - POINT_T[0]));
      const a = onToulonMap(0.6, 0.15), b = onToulonMap(0.245, 0.71);
      const tip: V3 = [a[0] + (b[0] - a[0]) * u, a[1] + 0.07 + 0.05 * Math.sin(u * Math.PI), a[2] + (b[2] - a[2]) * u];
      // hilt toward Napoleon (-z side of the table), raised
      const hilt: V3 = [tip[0] + 0.15, tip[1] + 0.32, tip[2] - 0.82];
      const d = new THREE.Vector3(tip[0] - hilt[0], tip[1] - hilt[1], tip[2] - hilt[2]).normalize();
      this.sabre.position.set(...hilt);
      this.sabre.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d);
    }
  }

  private poseCrown(t: number) {
    const c = this.crown, seat: V3 = [THRONE[0], 0.7 + 0.6, THRONE[2]];
    const u = t - CROWN_T;
    if (u < 0) { c.position.set(...seat); c.rotation.set(0, 0.3, 0); return; }
    // fall: off the seat front edge to the floor in 0.45 s with a bounce off the dais step
    const fallT = 0.45, rollT = 2.6;
    if (u < fallT) {
      const k = u / fallT;
      c.position.set(seat[0] + 0.1 * k, seat[1] + 0.25 * Math.sin(k * Math.PI) * (1 - k) - (seat[1] - 0.17) * k * k, seat[2] - 1.9 * k);
      c.rotation.set(-Math.PI / 2 * smooth(k * 1.4), 0.3, 0);
      return;
    }
    // roll on its rim toward the lens (-z, drifting +x), slowing, then wobble and lie down
    const w = clamp01((u - fallT) / rollT), d = 4.6 * (1 - (1 - w) ** 2);
    const z0 = THRONE[2] - 1.9, dir = new THREE.Vector3(0.18, 0, -1).normalize();
    if (w < 1) {
      c.position.set(seat[0] + 0.1 + dir.x * d, 0.17, z0 + dir.z * d);
      c.rotation.set(-Math.PI / 2 - d / 0.17, Math.atan2(dir.x, -dir.z), 0, "YXZ");
      return;
    }
    const v = u - fallT - rollT, wob = Math.exp(-v * 3.2), lie = smooth(v / 0.9);
    c.position.set(seat[0] + 0.1 + dir.x * 4.6, 0.17 - 0.06 * lie, z0 + dir.z * 4.6);
    c.rotation.set(-Math.PI / 2 - 4.6 / 0.17 - lie * 0.35, Math.atan2(dir.x, -dir.z) + 0.25 * wob * Math.sin(v * 14), 0.5 * lie, "YXZ");
  }
}

/** per-shot sun override (degrees, camera-relative): side-light the wide vistas */
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 6: { az: 110, el: 40 }, 2: { az: 140, el: 55 }, 3: { az: 140, el: 60 } };

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
  vec2 wp = vWP.xz + vec2(0.25 * wTime, 0.1 * wTime);
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;
export { PARIS, WAR_TABLE, Pen };
