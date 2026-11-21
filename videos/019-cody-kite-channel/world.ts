// The whole place as one three.js scene: sky, the sea (drifting painted ripples), Dover beach and its chalk cliffs,
// the Calais quay, the Goodwin Sands, the inland river and flying field (town.ts builds the land and houses), the
// boat, the kites and their lines, the navy ship, the mail steamer, the aeroplane, the beach flag, clouds and the cast.
// update(id, f, camera) poses everything for shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { Batch, boxGeo, tri, V, lam, Kit, Ray, kitClone, setSightLines } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { ctex, waterNear, waterFar, cloudHD, beam } from "../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, LFB, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown } from "./town";
import { stage } from "./cast";
import {
  FPS, D0, SHOTS, camAt, FOREGROUND, ShotDef, V3, smooth, boatAt, kiteAt, shipAt, planeAt, FLAG, T_TURNED,
  NAVY_DECK, STEAM_DECK, LIFT_BASE, LIFT_TOP, SANDS, liftP, basketAt,
} from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_fat", "tree_cone", "plant_bush", "grass_large", "lantern", "cart", "hedge"];
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
/** kite cloth: cream calico with a darker seam band */
const clothTex = () => ctex("kiteCloth019", 128, 128, (g) => {
  g.fillStyle = "#efe3c6"; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#d9c8a2"; g.fillRect(0, 56, 128, 16);
});

/** every lens position of the film looking at its subject: centre, sides and top of frame (houses there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4], [0, -0.85], [-0.6, -0.85], [0.6, -0.85], [-1, -0.5], [1, -0.5], [-1, 0], [1, 0]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

const SUN_SHOT: Record<number, { az?: number; el?: number }> = {};

// ---------------- models ----------------
const shadowAll = (o: THREE.Object3D) => o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
/** a Cody kite (local: span along x, its axis along z pointing at the line, up y): two box cells, side wings, spars */
const makeKite = () => {
  const g = new THREE.Group(), b = new Batch();
  const cloth = lam("kiteCloth019", () => ({ map: clothTex(), side: THREE.DoubleSide }));
  const red = lam("kiteRed019", () => ({ color: "#b8463c", side: THREE.DoubleSide }));
  const spar = lam("kiteSpar019", () => ({ color: "#6b4a2e" }));
  const W = 0.62, H = 0.56, L = 0.48, T = 0.03;
  for (const cz of [0.95, -0.95]) {
    const c = cz > 0 ? cloth : red;
    b.add(boxGeo(V(-W, H - T, cz - L), V(W, H, cz + L), 0), c);
    b.add(boxGeo(V(-W, -H, cz - L), V(W, -H + T, cz + L), 0), c);
    b.add(boxGeo(V(-W, -H, cz - L), V(-W + T, H, cz + L), 0), c);
    b.add(boxGeo(V(W - T, -H, cz - L), V(W, H, cz + L), 0), c);
  }
  for (const [x, y] of [[-W, -H], [W, -H], [-W, H], [W, H]] as const) b.add(boxGeo(V(x - 0.03, y - 0.03, -1.5), V(x + 0.03, y + 0.03, 1.5), 0), spar);
  b.add(boxGeo(V(-0.03, -0.03, -1.5), V(0.03, 0.03, 1.5), 0), spar);
  for (const s of [-1, 1]) { // the wings on the front cell
    b.add(tri(V(s * W, H, 0.95 + L), V(s * W, -H, 0.95 + L), V(s * 2.3, 0, 0.95)), cloth);
    b.add(tri(V(s * W, -H, 0.95 + L), V(s * W, H, 0.95 + L), V(s * 2.3, 0, 0.95)), cloth);
    b.add(boxGeo(V(Math.min(s * W, s * 2.3), -0.02, 0.93), V(Math.max(s * W, s * 2.3), 0.02, 0.97), 0), spar);
  }
  b.build(g);
  g.scale.setScalar(1.35);
  g.rotation.order = "YXZ";
  shadowAll(g);
  return g;
};
/** a sagging line from a to b: n thin segments along a dropped curve */
class Line {
  segs: THREE.Mesh[] = [];
  constructor(root: THREE.Object3D, n = 10, r = 0.035) {
    const geo = new THREE.CylinderGeometry(r, r, 1, 5); geo.translate(0, 0.5, 0);
    const mat = lam("line019", () => ({ color: "#3a2e2a" }));
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); m.visible = false; this.segs.push(m); root.add(m); }
  }
  hide() { for (const m of this.segs) m.visible = false; }
  set(a: V3, b: V3, sag: number) {
    const n = this.segs.length, L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const pt = (u: number) => V(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 0.12 * L * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u);
    const up = V(0, 1, 0);
    for (let i = 0; i < n; i++) {
      const p0 = pt(i / n), p1 = pt((i + 1) / n), d = p1.clone().sub(p0), len = d.length();
      const m = this.segs[i];
      m.visible = true; m.position.copy(p0); m.scale.set(1, len, 1);
      m.quaternion.setFromUnitVectors(up, d.normalize());
    }
  }
}
/** the Berthon boat (local: along +x, floor at y = 0): pointed hull walls, floor, mast; the lifelines with wooden balls */
const makeBoat = () => {
  const g = new THREE.Group(), b = new Batch();
  const outer = new THREE.Shape();
  outer.moveTo(-1.9, -0.62); outer.lineTo(1.0, -0.62); outer.quadraticCurveTo(2.0, -0.5, 2.5, 0); outer.quadraticCurveTo(2.0, 0.5, 1.0, 0.62); outer.lineTo(-1.9, 0.62); outer.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-1.8, -0.53); hole.lineTo(1.0, -0.53); hole.quadraticCurveTo(1.9, -0.42, 2.3, 0); hole.quadraticCurveTo(1.9, 0.42, 1.0, 0.53); hole.lineTo(-1.8, 0.53); hole.closePath();
  const wallS = outer.clone(); wallS.holes = [hole];
  const walls = new THREE.ExtrudeGeometry(wallS, { depth: 0.55, bevelEnabled: false }); walls.rotateX(-Math.PI / 2); walls.translate(0, -0.2, 0);
  const floor = new THREE.ExtrudeGeometry(outer, { depth: 0.25, bevelEnabled: false }); floor.rotateX(-Math.PI / 2); floor.translate(0, -0.45, 0);
  b.add(walls, lam("boatHull019", () => ({ color: "#5f7f9a" })));
  b.add(floor, lam("boatFloor019", () => ({ color: "#4a3a2e" })));
  b.add(new THREE.CylinderGeometry(0.045, 0.06, 2.3, 8), lam("kiteSpar019", () => ({ color: "#6b4a2e" })), new THREE.Matrix4().makeTranslation(0.6, 1.15, 0));
  b.add(boxGeo(V(-0.4, -0.2, -0.53), V(-0.1, 0.05, 0.53), 0), lam("boatTrim019", () => ({ map: beam() }))); // the seat
  b.build(g);
  const life = new THREE.Group(); life.name = "life";
  const lb = new Batch(), rope = lam("line019", () => ({ color: "#3a2e2a" })), ball = lam("ball019", () => ({ color: "#c08a48" }));
  for (const s of [-1, 1]) {
    lb.add(boxGeo(V(-1.6, 0.3, s * 0.68 - 0.02), V(1.2, 0.34, s * 0.68 + 0.02), 0), rope);
    for (const x of [-1.3, -0.5, 0.3, 1.0]) {
      lb.add(boxGeo(V(x - 0.015, 0.0, s * 0.7 - 0.015), V(x + 0.015, 0.32, s * 0.7 + 0.015), 0), rope);
      lb.add(new THREE.SphereGeometry(0.11, 10, 8), ball, new THREE.Matrix4().makeTranslation(x, -0.02, s * 0.74));
    }
  }
  lb.build(life); g.add(life);
  shadowAll(g);
  return g;
};
/** a ship (local: along +x, waterline y = 0) */
const makeShip = (kind: "navy" | "steam") => {
  const g = new THREE.Group(), b = new Batch();
  const navy = kind === "navy", deck = navy ? NAVY_DECK : STEAM_DECK;
  const hullC = navy ? "#7d8596" : "#2f2b33", L0 = navy ? -22 : -18, L1 = navy ? 18 : 14, Wd = navy ? 3.6 : 3.2;
  const hull = lam("hull" + kind, () => ({ color: hullC }));
  b.add(boxGeo(V(L0, -1.2, -Wd), V(L1, deck, Wd), 2), hull);
  b.add(boxGeo(V(L0, -1.2, -Wd - 0.02), V(L1, 0.35, Wd + 0.02), 2), lam("boot" + kind, () => ({ color: navy ? "#6a3a34" : "#8a3a30" })));
  const bow = new THREE.Shape(); bow.moveTo(L1, -Wd); bow.lineTo(L1 + 6, 0); bow.lineTo(L1, Wd); bow.closePath();
  const bg = new THREE.ExtrudeGeometry(bow, { depth: deck + 1.2, bevelEnabled: false }); bg.rotateX(-Math.PI / 2); bg.translate(0, -1.2, 0);
  b.add(bg, hull);
  b.add(boxGeo(V(L0, deck, -Wd), V(L1, deck + 0.06, Wd), 2), lam("deck019", () => ({ color: "#b08a5e" })));
  for (const s of [-1, 1]) b.add(boxGeo(V(L0, deck, s * Wd - 0.08), V(L1, deck + 0.8, s * Wd + 0.08), 2), hull);
  const sup = lam("sup" + kind, () => ({ color: navy ? "#9aa1ae" : "#ece6d6" }));
  if (navy) b.add(boxGeo(V(4, deck, -2.2), V(10, deck + 3.2, 2.2), 2), sup);
  else b.add(boxGeo(V(-3, deck, -2.2), V(6, deck + 2.0, 2.2), 2), sup);
  const fun = lam("fun" + kind, () => ({ color: navy ? "#8d93a0" : "#c99a52" })), funTop = lam("funTop019", () => ({ color: "#26232a" }));
  for (const x of navy ? [-4, 0] : [0, 3.5]) {
    const y0 = deck + (navy ? 0 : 2.0);
    b.add(new THREE.CylinderGeometry(0.9, 0.9, 4.2, 14), fun, new THREE.Matrix4().makeTranslation(x, y0 + 2.1, 0));
    b.add(new THREE.CylinderGeometry(0.92, 0.92, 0.7, 14), funTop, new THREE.Matrix4().makeTranslation(x, y0 + 3.9, 0));
  }
  const mastM = lam("kiteSpar019", () => ({ color: "#6b4a2e" }));
  for (const x of navy ? [-12, 13] : [-12, 9]) b.add(new THREE.CylinderGeometry(0.14, 0.2, 14, 8), mastM, new THREE.Matrix4().makeTranslation(x, deck + 7, 0));
  b.build(g);
  shadowAll(g);
  return g;
};
/** the aeroplane (local: nose along +x, wheels at y = 0): two wings, struts, fuselage, tail, wheels, propeller */
const makePlane = () => {
  const g = new THREE.Group(), b = new Batch();
  const wing = lam("wing019", () => ({ map: clothTex() })), wood = lam("kiteSpar019", () => ({ color: "#6b4a2e" }));
  for (const y of [1.2, 2.7]) b.add(boxGeo(V(-0.5, y, -5.6), V(0.9, y + 0.08, 5.6), 0), wing);
  for (const z of [-5.2, -2.6, 2.6, 5.2]) for (const x of [-0.35, 0.75]) b.add(boxGeo(V(x - 0.03, 1.25, z - 0.03), V(x + 0.03, 2.7, z + 0.03), 0), wood);
  b.add(boxGeo(V(-6.0, 1.35, -0.3), V(1.3, 1.75, 0.3), 0), wood);
  b.add(boxGeo(V(-6.4, 1.4, -1.6), V(-5.2, 1.46, 1.6), 0), wing);
  b.add(boxGeo(V(-6.3, 1.46, -0.04), V(-5.5, 2.6, 0.04), 0), wing);
  const wheel = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16); wheel.rotateX(Math.PI / 2);
  for (const z of [-0.9, 0.9]) b.add(wheel, lam("tyre019", () => ({ color: "#2a2628" })), new THREE.Matrix4().makeTranslation(0.3, 0.42, z));
  for (const z of [-0.9, 0.9]) b.add(boxGeo(V(0.27, 0.42, z - 0.03), V(0.33, 1.25, z + 0.03), 0), wood);
  b.add(boxGeo(V(0.9, 1.45, -0.4), V(1.3, 1.85, 0.4), 0), lam("engine019", () => ({ color: "#3d414c" })));
  b.build(g);
  const blades = new Batch();
  blades.add(boxGeo(V(-0.03, -1.1, -0.08), V(0.03, 1.1, 0.08), 0), wood);
  const prop = new THREE.Group(); prop.name = "prop"; blades.build(prop); prop.position.set(1.36, 1.65, 0);
  g.add(prop);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), new THREE.MeshBasicMaterial({ color: "#d8d2c4", transparent: true, opacity: 0.28, depthWrite: false }));
  disc.rotation.y = Math.PI / 2; disc.position.set(1.4, 1.65, 0); disc.name = "disc"; disc.layers.set(NOINK);
  g.add(disc);
  shadowAll(g);
  return g;
};

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private WU: Record<string, THREE.IUniform>;
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private boat: THREE.Group; private life: THREE.Object3D;
  private kite: THREE.Group; private navyKite: THREE.Group; private lift: THREE.Group[] = []; private basket: THREE.Group;
  private line: Line; private navyLine: Line; private liftLine: Line;
  private navy: THREE.Group; private steam: THREE.Group; private plane: THREE.Group;
  private pennant = new THREE.Group();
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
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    // ---- land, cliffs, quay, houses (town.ts) ----
    buildTown(R, kit, sightLines());

    // ---- the sea and the river: one painted-ripple material ----
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
    waterM.customProgramCacheKey = () => "sea019";
    // the sea in 40 x 40 cells (one huge quad lost its fog on single frames in 006)
    const sg = new THREE.PlaneGeometry(1800, 900, 40, 20); sg.rotateX(-Math.PI / 2); sg.translate(0, 0, 450);
    const sea = new THREE.Mesh(sg, waterM); sea.receiveShadow = true; R.add(sea);
    const rg = new THREE.PlaneGeometry(260, 14, 26, 2); rg.rotateX(-Math.PI / 2); rg.translate(-600, D0 + 0.25, -300);
    const river = new THREE.Mesh(rg, waterM); river.receiveShadow = true; R.add(river);
    // the Goodwin Sands: a low flat bank just above the water
    const sb = new Batch();
    const sand = new THREE.CylinderGeometry(1, 1, 0.3, 40); sand.scale(34, 1, 13); sand.translate(SANDS[0], 0.0, SANDS[2]);
    sb.add(sand, lam("sandWet019", () => ({ color: "#d6bf8c" })));
    sb.build(R);

    // ---- the boat, the kites and lines, the ships, the aeroplane, the beach flag ----
    this.boat = makeBoat(); this.life = this.boat.getObjectByName("life") as THREE.Object3D; R.add(this.boat);
    this.kite = makeKite(); R.add(this.kite);
    this.navyKite = makeKite(); R.add(this.navyKite);
    for (let i = 0; i < 3; i++) { const k = makeKite(); this.lift.push(k); R.add(k); }
    this.basket = new THREE.Group();
    { const bb = new Batch(), wk = lam("wicker019", () => ({ color: "#a8783e" }));
      bb.add(boxGeo(V(-0.5, 0, -0.45), V(0.5, 0.75, 0.45), 0), wk);
      for (const [x, z] of [[-0.45, -0.4], [0.45, -0.4], [-0.45, 0.4], [0.45, 0.4]] as const) bb.add(boxGeo(V(x - 0.015, 0.75, z - 0.015), V(x * 0.1 + 0.015, 2.0, z * 0.1 + 0.015), 0), lam("line019", () => ({ color: "#3a2e2a" })));
      bb.build(this.basket); shadowAll(this.basket); R.add(this.basket); }
    this.line = new Line(R, 12); this.navyLine = new Line(R, 12); this.liftLine = new Line(R, 14, 0.045);
    this.navy = makeShip("navy"); R.add(this.navy);
    this.steam = makeShip("steam"); R.add(this.steam);
    this.plane = makePlane(); R.add(this.plane);
    { const fb = new Batch();
      fb.add(new THREE.CylinderGeometry(0.06, 0.08, 5.0, 8), lam("pole019", () => ({ color: "#efe8da" })), new THREE.Matrix4().makeTranslation(FLAG[0], FLAG[1] + 2.5, FLAG[2]));
      fb.build(R);
      const pb = new Batch();
      pb.add(tri(V(0, 0.45, 0), V(0, -0.45, 0), V(2.2, 0, 0)), lam("pennant019", () => ({ color: "#c0392f", side: THREE.DoubleSide })));
      pb.build(this.pennant); shadowAll(this.pennant);
      this.pennant.position.set(FLAG[0], FLAG[1] + 4.5, FLAG[2]); R.add(this.pennant); }

    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
    setSightLines([]);
  }

  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
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
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az); // screen right = (-fz, fx)
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  /** pose the props of shot id at time t */
  private poseProps(id: number, t: number) {
    // the boat
    const b = boatAt(id, t);
    this.boat.visible = !!b;
    if (b) { this.boat.position.set(...b.p); this.boat.rotation.set(b.roll, b.yaw, 0, "YXZ"); }
    this.life.visible = id === 2 || id === 4 || id === 5;
    // the main kite: flying on its line, or lying on the shingle / the steamer's deck
    const k = kiteAt(id, t);
    this.line.hide();
    if (k) {
      const dx = k.anchor[0] - k.p[0], dz = k.anchor[2] - k.p[2];
      this.kite.visible = true; this.kite.position.set(...k.p);
      this.kite.rotation.set(-k.tilt, Math.atan2(dx, dz), 0.05 * Math.sin(t * 1.7));
      this.line.set(k.anchor, k.p, k.sag);
    } else if (id === 2 || id === 4 || id === 5) {
      this.kite.visible = true; this.kite.position.set(-6.8, D0 + 1.35, -12.0); this.kite.rotation.set(0.15, 0.5, 0.0);
    } else if (id === 6) {
      const s = shipAt("steam", t);
      this.kite.visible = true; this.kite.position.set(s[0] - 11.5, STEAM_DECK + 1.0, s[2] + 0.6); this.kite.rotation.set(Math.PI / 2 - 0.2, Math.PI / 2, 0);
    } else this.kite.visible = false;
    // the navy ship and its kite
    this.navy.visible = this.navyKite.visible = id === 3;
    this.navyLine.hide();
    if (id === 3) {
      const s = shipAt("navy", t);
      this.navy.position.set(...s);
      const kp: V3 = [s[0] - 21 + 0.5 * Math.sin(t * 0.8), 19 + 0.6 * Math.sin(t * 1.2), s[2] - 3], an: V3 = [s[0] - 12, NAVY_DECK + 14, s[2]];
      this.navyKite.position.set(...kp); this.navyKite.rotation.set(-0.25, Math.atan2(an[0] - kp[0], an[2] - kp[2]), 0);
      this.navyLine.set(an, kp, 0.5);
    }
    this.steam.visible = id === 6;
    if (id === 6) this.steam.position.set(...shipAt("steam", t));
    // the man-lifting kites over the beach (shot 2)
    const liftOn = id === 2;
    for (const m of this.lift) m.visible = liftOn;
    this.basket.visible = liftOn;
    this.liftLine.hide();
    if (liftOn) {
      const P = liftP;
      this.liftLine.set(LIFT_BASE, LIFT_TOP, 1.35 / (0.12 * Math.hypot(LIFT_TOP[0] - LIFT_BASE[0], LIFT_TOP[1] - LIFT_BASE[1], LIFT_TOP[2] - LIFT_BASE[2])));
      [0.62, 0.81, 1.0].forEach((u, i) => {
        const p = P(u), m = this.lift[i];
        m.position.set(p[0] + 0.3 * Math.sin(t * 0.9 + i), p[1] + 1.4 + 0.3 * Math.sin(t * 1.3 + i), p[2]);
        m.rotation.set(-0.3, Math.atan2(LIFT_BASE[0] - p[0], LIFT_BASE[2] - p[2]), 0.04 * Math.sin(t + i));
      });
      this.basket.position.set(...basketAt(t)); this.basket.rotation.set(0, 0.4, 0.03 * Math.sin(t * 1.4));
    }
    // the aeroplane
    const pl = planeAt(id, t);
    this.plane.visible = !!pl;
    if (pl) {
      this.plane.position.set(...pl.p); this.plane.rotation.set(0, 0, pl.pitch, "YXZ");
      const prop = this.plane.getObjectByName("prop") as THREE.Object3D, disc = this.plane.getObjectByName("disc") as THREE.Object3D;
      prop.visible = id === 13; disc.visible = id === 12; prop.rotation.x = 0.6;
    }
    // the beach flag: points one way, then the wind turns it round (shot 5)
    const turn = id === 5 ? smooth((t - T_TURNED + 0.1) / 0.8) : id === 11 ? 1 : 0;
    this.pennant.rotation.set(0.06 * Math.sin(t * 6.1), Math.PI * turn + 0.15 * Math.sin(t * 2.3), 0.05 * Math.sin(t * 4.7));
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
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
    this.fill.intensity = 0;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc + halo, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
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
      m.position.x = cam.position.x + Math.cos((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.position.z = cam.position.z + Math.sin((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- water colours ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    this.poseProps(id, t);

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
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));       // depression angle of the view ray
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);         // 1 at the horizon .. 0 at 24 deg down
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.12 * wTime);  // slow drift with the tide
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;
