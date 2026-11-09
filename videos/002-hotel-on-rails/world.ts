// The whole place as one three.js scene: sky, sea, the bluff, the Brighton Beach Hotel (moved on rails), twenty-four
// tracks, flatcars, six locomotives with ropes, jacks, the snow patch, smoke, clouds and the cast. update(id, f, camera)
// poses everything for shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit, Ray, kitClone, house, setSightLines } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { beam, bed, ctex, planksHD, stoneHD, grassHD, waterNear, waterFar, cloudHD } from "../../src/engine/paint";
import { Pen } from "../../src/engine/toon";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, LFB, twoTone, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown, flagTex } from "./town";
import { stage } from "./cast";
import { FPS, D0, SHOTS, camAt, FOREGROUND, ShotDef, V3, HZ0, NT, trackX, LOCO_TRACKS, SNOW, shift, clock, lift, carOff, CARS_T, TRACK_T, LOCOS_T, ROPE_T, hotelZ, locoZ } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "flower_redA", "flower_yellowA", "flower_purpleA", "grass_large", "grass", "lantern", "cart", "stall-red",
  "stall-green", "stall-bench", "banner-red", "banner-green", "windmill", "canoe"];
export const loadKit = () => loadKenney(KENNEY);

/** sun disc (solid, soft rim) and the flat golden halo (lighting.md 6 / depth.md 6.4: r50 13-26 % of the frame width) */
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
const smokeTex = () => ctex("smoke", 256, 256, (g) => {
  const p = new Pen(g);
  for (const [x, y, r, c] of [[90, 150, 60, "#8f8d96"], [150, 120, 70, "#a3a1aa"], [170, 165, 55, "#8f8d96"], [120, 100, 50, "#b4b2ba"]] as const) p.ell(x, y, r, r * 0.85, c, 0);
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
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 15: { az: 120, el: 18 }, 16: { az: 120, el: 18 } };


type Mats = Record<string, THREE.Material>;
const SHIPZ = -13; // the schooner's own z in its geometry
const wheelMesh = (r: number, w: number, mat: THREE.Material, spokes: THREE.Material) => {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14), mat); c.rotation.z = Math.PI / 2;
  const s = new THREE.Mesh(new THREE.BoxGeometry(w * 1.3, r * 1.5, r * 0.2), spokes);
  g.add(c, s);
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
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
  private smoke: { m: THREE.Mesh; mat: THREE.MeshLambertMaterial; loco: number; k: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private ship = new THREE.Group();
  private sails: THREE.Mesh[] = [];
  private hotel = new THREE.Group();
  private flag: THREE.Mesh;
  private cars = new THREE.Group();
  private tracks: THREE.Group[] = [];
  private jacks: THREE.Mesh[] = [];
  private locos: { g: THREE.Group; wheels: THREE.Group[] }[] = [];
  private ropes: THREE.Mesh[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
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

    // ---- ground, bluff, sea bed, piles (static batch) ----
    const b = new Batch();
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.cope = lam("copeHD", () => ({ map: stoneHD("copeHD", ["#e6dccd", "#ddd3c3", "#ece4d6", "#d6cbba"], "#aea293") }));
    M.iron = twoTone(new THREE.MeshPhongMaterial({ color: "#3d414c", specular: "#8a8a8a", shininess: 60 }), 0.15);
    M.wood = lam("wood", () => ({ map: beam() }));
    M.planks = lam("deckPlanks", () => ({ map: planksHD() }));
    M.bed = lam("bed", () => ({ map: bed() }));
    M.sand = lam("sand", () => ({ color: "#e2c992" }));
    M.bluff = lam("bluffSand", () => ({ color: "#cfae78" }));
    M.snow = lam("snowPatch", () => ({ color: "#eef3f9" }));
    b.add(quadUp(-900, 900, -900, -30, 450, 217.5), M.grass);
    b.add(quadUp(-900, 900, -58, -30, 1, 1, 0.012), M.sand);
    b.add(wallQuad(-900, 900, -30, 1), M.bluff);
    b.add(quadUp(-900, 900, -30, 900, 225, 450, -0.6 - D0), M.bed);
    b.add(quadUp(SNOW[0] - 30, SNOW[0] + 30, SNOW[2] - 30, SNOW[2] + 30, 1, 1, 0.05), M.snow);
    // the piles that held the porch over the water (they stay when the hotel goes)
    for (let x = -17.5; x <= 17.6; x += 3.5) for (const z of [-27.4, -29.1]) b.add(boxGeo(V(x - 0.2, 0, z - 0.2), V(x + 0.2, D0 + 0.2, z + 0.2), 2), M.wood);
    b.build(R);
    buildTown(R, kit, sightLines());

    // ---- tracks: 24 of them side by side, each its own group so they can be laid one by one ----
    for (let i = 0; i < NT; i++) {
      const tb = new Batch(), x = trackX(i), g = new THREE.Group();
      for (const sx of [-0.45, 0.45]) tb.add(boxGeo(V(x + sx - 0.06, D0, -140), V(x + sx + 0.06, D0 + 0.16, -32), 2), M.iron);
      for (let z = -33; z > -140; z -= 0.95) tb.add(boxGeo(V(x - 0.7, D0, z - 0.1), V(x + 0.7, D0 + 0.1, z + 0.1), 2), M.wood);
      tb.build(g); g.visible = false; this.tracks.push(g); R.add(g);
    }

    // ---- flatcars: 5 per track under the 13 m main block ----
    const carM = lam("flatcar", () => ({ color: "#8a4a38" })), carTop = lam("flatcarTop", () => ({ color: "#5b4a3a" })), wheelM = lam("carWheel", () => ({ color: "#2b2d35" }));
    const cb = new Batch();
    const wg = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 10); wg.rotateZ(Math.PI / 2);
    for (let i = 0; i < NT; i++) for (let j = 0; j < 5; j++) {
      const x = trackX(i), z = HZ0 + (j - 2) * 2.6;
      cb.add(boxGeo(V(x - 0.62, D0 + 0.34, z - 1.2), V(x + 0.62, D0 + 0.62, z + 1.2), 2), carM);
      cb.add(boxGeo(V(x - 0.62, D0 + 0.62, z - 1.2), V(x + 0.62, D0 + 0.7, z + 1.2), 2), carTop);
      for (const sx of [-0.45, 0.45]) for (const sz of [-0.8, 0.8]) cb.add(wg, wheelM, new THREE.Matrix4().makeTranslation(x + sx, D0 + 0.3, z + sz));
    }
    cb.build(this.cars); this.cars.visible = false; R.add(this.cars);

    // ---- the hotel (local origin: centre of the main block at floor level) ----
    const hb = new Batch();
    setSightLines([]);
    house(hb, 0, 0, 0, 20, 13, 12.6, 1, 0);
    for (const sx of [-1, 1]) house(hb, sx * 14.5, 0, 0, 9, 11, 9.8, sx < 0 ? 3 : 4, 0);
    hb.add(boxGeo(V(-19.4, -0.35, -6.7), V(19.4, 0.4, 6.7), 2), M.cope);
    hb.add(boxGeo(V(-19, 0.0, 6.5), V(19, 0.35, 11.6), 2), M.planks);
    for (let x = -18.2; x <= 18.3; x += 4.55) hb.add(boxGeo(V(x - 0.17, 0.35, 11.0), V(x + 0.17, 3.5, 11.4), 2), M.wood);
    hb.add(boxGeo(V(-19.4, 3.5, 6.5), V(19.4, 3.75, 12.0), 2), M.wood);
    hb.add(boxGeo(V(-19, 0.35, 11.4), V(19, 0.5, 11.6), 2), M.wood);
    hb.add(boxGeo(V(-19, 1.1, 11.4), V(19, 1.22, 11.6), 2), M.wood);
    hb.add(boxGeo(V(-0.07, 17.6, -0.07), V(0.07, 25.5, 0.07), 2), M.iron);
    hb.build(this.hotel);
    const flagM = new THREE.MeshBasicMaterial({ map: flagTex(), side: THREE.DoubleSide, toneMapped: false });
    this.flag = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2), flagM);
    this.flag.position.set(1.65, 24.4, 0); this.flag.layers.set(NOINK);
    this.hotel.add(this.flag);
    this.hotel.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    R.add(this.hotel);

    // ---- screw jacks under the front of the hotel ----
    const jackM = lam("jackIron", () => ({ color: "#3d414c" }));
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1, 0.22), jackM);
      m.castShadow = true; m.visible = false; this.jacks.push(m); R.add(m);
    }

    // ---- the locomotive template, cloned six times ----
    const green = lam("locoGreen", () => ({ color: "#2f6b4a" })), blk = lam("locoBlack", () => ({ color: "#34313c" })), brass = lam("locoBrass", () => ({ color: "#c9a24a" })), red = lam("locoRed", () => ({ color: "#9b2d2d" }));
    const lb = new Batch();
    const boiler = new THREE.CylinderGeometry(0.62, 0.62, 3.2, 16); boiler.rotateX(Math.PI / 2);
    lb.add(boiler, green, new THREE.Matrix4().makeTranslation(0, 1.45, -0.5));
    const sbox = new THREE.CylinderGeometry(0.66, 0.66, 0.5, 16); sbox.rotateX(Math.PI / 2);
    lb.add(sbox, blk, new THREE.Matrix4().makeTranslation(0, 1.45, -2.35));
    lb.add(new THREE.CylinderGeometry(0.2, 0.3, 1.0, 10), blk, new THREE.Matrix4().makeTranslation(0, 2.45, -2.3));
    lb.add(new THREE.CylinderGeometry(0.42, 0.24, 0.3, 10), blk, new THREE.Matrix4().makeTranslation(0, 3.05, -2.3));
    lb.add(new THREE.SphereGeometry(0.3, 10, 8), brass, new THREE.Matrix4().makeTranslation(0, 2.1, -0.7));
    lb.add(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 8), brass, new THREE.Matrix4().makeTranslation(0, 2.2, 0.4));
    lb.add(boxGeo(V(-0.78, 0.7, 0.9), V(0.78, 2.9, 2.6), 2), green);
    lb.add(boxGeo(V(-0.9, 2.9, 0.75), V(0.9, 3.08, 2.8), 2), blk);
    lb.add(boxGeo(V(-0.72, 0.5, -2.6), V(0.72, 0.8, 2.8), 2), blk);
    for (const sx of [-0.8, 0.8]) lb.add(boxGeo(V(sx - 0.02, 1.5, 1.0), V(sx + 0.02, 2.4, 2.4), 2), brass); // cab windows
    const cow = new THREE.ConeGeometry(0.85, 1.0, 4); cow.rotateX(-Math.PI / 2); cow.rotateZ(Math.PI / 4);
    lb.add(cow, blk, new THREE.Matrix4().makeTranslation(0, 0.7, -3.0));
    lb.add(new THREE.SphereGeometry(0.2, 8, 6), brass, new THREE.Matrix4().makeTranslation(0, 1.55, -2.65));
    const template = new THREE.Group();
    lb.build(template);
    const wz = [-1.5, -0.35, 0.8];
    const protoWheels = wz.map((z) => { const w = wheelMesh(0.52, 0.14, red, blk); return { w, z }; });
    LOCO_TRACKS.forEach((ti) => {
      const g = template.clone(true), wheels: THREE.Group[] = [];
      for (const sx of [-0.5, 0.5]) for (const p of protoWheels) { const w = p.w.clone(true); w.position.set(sx, 0.52, p.z); g.add(w); wheels.push(w); }
      g.position.x = trackX(ti); g.visible = false;
      this.locos.push({ g, wheels }); R.add(g);
      const rope = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1), lam("rope", () => ({ color: "#b59a6a" })));
      rope.castShadow = true; rope.visible = false; this.ropes.push(rope); R.add(rope);
    });

    // ---- the schooner, far out at sea ----
    const hullM = lam("hullM", () => ({ color: "#5b3a29" })), trimM = lam("trimM", () => ({ color: "#c9a24a" })), deckM2 = M.planks;
    const sailM = lam("sailM", () => ({ color: "#f1e8d2", side: THREE.DoubleSide })), mastM = M.wood;
    const sb = new Batch(), z0 = SHIPZ, DECK_Y = 3.0;
    sb.add(boxGeo(V(-6, -0.4, z0 - 2.1), V(5.2, DECK_Y, z0 + 2.1), 2), hullM);
    sb.add(boxGeo(V(-6, DECK_Y, z0 - 2.1), V(5.2, DECK_Y + 0.08, z0 + 2.1), 2), deckM2);
    for (const sz of [-1, 1]) sb.add(boxGeo(V(-6, DECK_Y, z0 + sz * 2.1 - 0.06), V(5.2, DECK_Y + 0.9, z0 + sz * 2.1 + 0.06), 2), hullM);
    sb.add(boxGeo(V(-6, DECK_Y + 0.85, z0 - 2.15), V(5.2, DECK_Y + 0.95, z0 + 2.15), 2), trimM);
    sb.add(boxGeo(V(-5.9, DECK_Y + 0.08, z0 - 1.5), V(-3.9, DECK_Y + 1.9, z0 + 1.5), 2), M.wood);
    const bow = new THREE.ConeGeometry(2.6, 5.5, 4); bow.rotateY(Math.PI / 4); bow.rotateZ(-Math.PI / 2); bow.scale(1, 1, 0.85);
    sb.add(bow, hullM, new THREE.Matrix4().makeTranslation(7.9, (DECK_Y - 0.4) / 2 + 0.15, z0));
    for (const mx of [-2.2, 2.4]) sb.add(new THREE.CylinderGeometry(0.1, 0.16, mx < 0 ? 11 : 10, 8), mastM, new THREE.Matrix4().makeTranslation(mx, DECK_Y + (mx < 0 ? 5.5 : 5), z0));
    sb.build(this.ship);
    const tri = (w: number, h: number, hook: number) => {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(w, 0); sh.lineTo(w * hook, h); sh.closePath();
      return new THREE.ShapeGeometry(sh);
    };
    const sailDefs: [number, number, number, number, number][] = [[-2.2, 3.4, 4.9, 6.6, 0.1], [2.4, 3.4, 4.2, 5.9, 0.1], [-2.0, 4.3, 3.0, 4.6, 0.55], [2.6, 4.2, 2.6, 4.2, 0.55]];
    for (const [mx, y0, w, h, hook] of sailDefs) {
      const m = new THREE.Mesh(tri(w, h, hook), sailM);
      m.position.set(mx + (hook < 0.3 ? -0.15 : 0.1), DECK_Y + y0, z0 + 0.12); m.castShadow = true; m.frustumCulled = false;
      if (hook < 0.3) m.scale.x = -1;
      this.sails.push(m); this.ship.add(m);
    }
    this.ship.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    R.add(this.ship);

    // water: its own mesh so the ripples can drift
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
    waterM.customProgramCacheKey = () => "sea1";
    const wm = new THREE.Mesh(quadUp(-900, 900, -30, 900, 1, 1, -D0), waterM);
    wm.receiveShadow = true;
    R.add(wm);

    // locomotive smoke: 6 puffs each
    const smokeT = smokeTex();
    for (let li = 0; li < 6; li++) for (let k = 0; k < 6; k++) {
      const mat = new THREE.MeshLambertMaterial({ map: smokeT, transparent: true, depthWrite: false });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      m.layers.set(NOINK);
      this.smoke.push({ m, mat, loco: li, k: k / 6 }); R.add(m);
    }
    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
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
    const ss = s as ShotDef & { sunAz?: number; sunEl?: number };
    const az = THREE.MathUtils.degToRad(ss.sunAz ?? SUN_SHOT[id]?.az ?? L.az), el = THREE.MathUtils.degToRad(ss.sunEl ?? SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az); // screen right = (-fz, fx)
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK); // sky, clouds, smoke and sun sprites live on the no-ink layer but are still rendered
    // ---- light rig: camera-relative sun frozen per shot, two-tone uniforms, shadow fit ----
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
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- sea colours ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;

    // ---- the journey: jacks, cars, tracks, locomotives, ropes, the hotel ----
    const ts = clock(id, t), sh = shift(id, t), hz = hotelZ(id, t), lf = lift(ts);
    this.hotel.position.set(0, D0 + lf, hz);
    this.flag.rotation.y = 0.25 * Math.sin(t * 3.1); this.flag.scale.y = 1 + 0.04 * Math.sin(t * 5.3);
    this.cars.visible = ts >= CARS_T - 0.02;
    this.cars.position.set(0, D0 + lf - 0.0, -sh + carOff(ts));
    this.cars.position.y = 0;
    this.tracks.forEach((g, i) => { g.visible = ts >= TRACK_T + i * 0.06; });
    const jacking = ts > 21.8 && ts < 24.6;
    this.jacks.forEach((m, i) => {
      m.visible = jacking;
      const h = lf + 0.4;
      m.scale.y = Math.max(0.1, h); m.position.set(-16 + i * 4, D0 + h / 2, HZ0 - 6.9);
    });
    this.locos.forEach((lo, i) => {
      lo.g.visible = i === 0 || ts >= LOCOS_T;
      const z = locoZ(id, t);
      lo.g.position.z = z;
      lo.wheels.forEach((w) => { w.rotation.x = -sh / 0.52; });
      lo.g.position.y = D0;
      const rp = this.ropes[i];
      rp.visible = ts >= ROPE_T;
      if (rp.visible) {
        const x = trackX(LOCO_TRACKS[i]), za = z + 2.8, zb = hz - 6.7, tug = ts > 32 && ts < 40.5 ? 0.012 * Math.sin(t * 40 + i) : 0;
        rp.position.set(x, D0 + 0.95 + lf * 0.3, (za + zb) / 2); rp.scale.set(1 + tug * 20, 1 + tug * 20, Math.abs(zb - za));
        rp.rotation.set(Math.atan2(lf * 0.4, Math.abs(zb - za)) * -1, 0, 0);
      }
    });
    for (const sm of this.smoke) {
      const lo = this.locos[sm.loco], u = (t * 0.45 + sm.k + sm.loco * 0.17) % 1, sz = 0.7 + u * 2.4;
      sm.m.visible = lo.g.visible;
      sm.m.position.set(trackX(LOCO_TRACKS[sm.loco]) - u * 7, D0 + 3.4 + u * 5 + u * u * 2, lo.g.position.z - 2.3 + u * 1.0);
      sm.m.scale.set(sz, sz, 1); sm.m.quaternion.copy(cam.quaternion);
      sm.mat.opacity = 0.7 * (1 - u) ** 1.3;
    }
    this.ship.position.set(-70 + 0.6 * t, 0.05 * Math.sin(t * 1.4), 150 - SHIPZ); this.ship.scale.setScalar(1.8);
    this.ship.rotation.z = 0.012 * Math.sin(t * 1.1);
    this.sails.forEach((m, i) => { m.rotation.y = 0.05 * Math.sin(t * 1.7 + i); });

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
  vec2 wp = vWP.xz + vec2(0.35 * wTime, 0.0);           // slow river along +x
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

/** horizontal quad facing up at height D0 + dy covering x0..x1, z0..z1 (z0 < z1) */
function quadUp(x0: number, x1: number, z0: number, z1: number, u: number, v: number, dy = 0) {
  const y = D0 + dy, g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
/** embankment wall from the river bed to the bank top at z, facing +z (dir 1) or -z (dir -1) */
function wallQuad(x0: number, x1: number, z: number, dir: number) {
  const g = new THREE.BufferGeometry(), y0 = -0.6, y1 = D0;
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 0, dir]).flat(), 3));
  const u = Math.abs(x1 - x0) / 4, v = (y1 - y0) / 4;
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
}
