// The whole place as one three.js scene: sky, the town of Kiel with its stone quay, the harbour water (a wind-ripple
// shader), the Danish blockade ships at the harbour mouth, the harbour bed sixteen metres down (sand, rocks, weed), the
// iron submarine, and a cut-open copy of its hull (a studio set) where the three men are trapped. update(id, f, camera)
// poses everything for shot `id` at frame f (pure function). Underwater and inside shots swap the sky and fog for a
// green-blue sea.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit, Ray, kitClone, setSightLines, prop } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { beam, ctex, planksHD, waterNear, waterFar, cloudHD, bed, stoneHD } from "../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, LFB, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown, danishFlagTex } from "./town";
import { boatAt } from "./cast";
import { stage } from "./cast";
import { FPS, D0, SHOTS, camAt, FOREGROUND, ShotDef, SEA_Y, BED_Y, DANES, CUT, CUT_R, FLOOR_Y, HATCH_X, PLINTH, subAt, cutAt, sceneAt, Scene, DIVE } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "grass_large", "grass", "lantern", "cart", "stall-red", "stall-green", "stall-bench", "banner-red", "canoe"];
export const loadKit = () => loadKenney(KENNEY);

/** sun disc (solid, soft rim) and the flat golden halo */
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
/** riveted iron plates for the hull */
const ironTex = (key: string, base: string, seam: string) => ctex(key, 256, 256, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${(0.03 + 0.05 * r()).toFixed(3)})`; g.fillRect(r() * 256, r() * 256, 30 + r() * 60, 20 + r() * 40); }
  g.fillStyle = seam; g.fillRect(0, 0, 256, 5); g.fillRect(0, 0, 5, 256);
  for (let k = 12; k < 256; k += 24) { g.beginPath(); g.arc(k, 14, 3.2, 0, 7); g.arc(14, k, 3.2, 0, 7); g.fill(); }
});

/** every lens position of the film looking at its subject (houses there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const ff = Math.max(0, f), sc = sceneAt(s.id, Math.min(Math.max(ff, s.a), s.b - 1));
    if (sc !== "quay") continue;
    const c = camAt(s.id, ff), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4], [0, -0.85], [-0.6, -0.85], [0.6, -0.85], [0, -1], [-0.7, -1], [0.7, -1], [-1, -0.5], [1, -0.5], [-1, 0], [1, 0]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 4: { az: 120, el: 16 }, 16: { az: 120, el: 16 } };
/** the sea seen from inside it: sky stops (bottom to top), fog colour and range */
const SEA_SKY = ["#1d4c58", "#24606b", "#2f7a82", "#4d9ea2", "#7cc2bf"];
const SEA_FOG = "#2a6670";

type Mats = Record<string, THREE.Material>;
const SHIP_S = 1.8, SHIPZ = -13;

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
  private ships: { g: THREE.Group; sails: THREE.Mesh[] }[] = [];
  private sub: THREE.Group; private subPitch: THREE.Group; private subLid: THREE.Group; private prop: THREE.Group;
  private cut: THREE.Group; private cutLid: THREE.Group; private ballast: THREE.Mesh; private cutWater: THREE.Mesh;
  private ceiling: THREE.Mesh; private seaTop: THREE.Mesh;
  private boats: THREE.Object3D[] = [];
  private plinth: THREE.Mesh;
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

    // ---- the harbour bed, the quay wall, rocks and weed (static batch) ----
    const b = new Batch();
    M.sand = lam("seabedSand", () => ({ map: bed() }));
    M.rock = lam("seaRock", () => ({ color: "#6d6a5e" }));
    M.quayWall = lam("quayWallHD", () => ({ map: stoneHD("quayStone", ["#b8ab92", "#a99c84", "#c2b59b", "#9f937c"]) }));
    M.wood = lam("wood", () => ({ map: beam() }));
    M.planks = lam("deckPlanks", () => ({ map: planksHD() }));
    b.add(boxGeo(V(-1, BED_Y - 1, -700), V(1400, BED_Y, 700), 6), M.sand);
    b.add(boxGeo(V(-1.2, BED_Y - 1, -400), V(0, D0, 400), 3), M.quayWall);
    const rr = (s: number) => { const x = Math.sin(s * 91.7) * 43758.5; return x - Math.floor(x); };
    for (let i = 0; i < 70; i++) {
      const near = i < 40, cx = near ? DIVE[0] : CUT[0], cz = near ? DIVE[2] : CUT[2];
      const a = rr(i) * Math.PI * 2, d = (near ? 5 : 7) + rr(i + 50) * 26;
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (!near && Math.abs(z - CUT[2]) < 9 && z > CUT[2] - 3) continue; // keep the cut-open hull's front clear
      if (near && z > DIVE[2] + 3.5) continue; // and the lenses' side of the wreck
      const s = 0.3 + rr(i + 9) * 0.9;
      const g = new THREE.DodecahedronGeometry(1, 0); g.scale(s * 1.3, s * 0.7, s);
      b.add(g, M.rock, new THREE.Matrix4().makeTranslation(x, BED_Y + 0.15 * s, z));
    }
    b.build(R);
    // weed tufts: Kenney grass stands in for sea grass
    const wb = new Batch();
    for (let i = 0; i < 90; i++) {
      const near = i < 60, cx = near ? DIVE[0] : CUT[0], cz = near ? DIVE[2] : CUT[2];
      const a = rr(i + 300) * Math.PI * 2, d = 4.5 + rr(i + 400) * 22;
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (!near && z > CUT[2] - 3 && Math.abs(x - CUT[0]) < 9) continue;
      if (near && z > DIVE[2] + 3.5) continue;
      prop(wb, kit, rr(i) > 0.5 ? "grass_large" : "grass", x, BED_Y, z, 0.8 + rr(i + 7) * 1.0, rr(i + 8) * 6);
    }
    wb.build(R);
    buildTown(R, kit, sightLines());

    // ---- the Danish blockade: three schooners with the Dannebrog ----
    const hullM = lam("hullDK", () => ({ color: "#4a3328" })), trimM = lam("trimDK", () => ({ color: "#d9cfb8" }));
    const sailM = lam("sailM", () => ({ color: "#f1e8d2", side: THREE.DoubleSide }));
    const flagM = new THREE.MeshBasicMaterial({ map: danishFlagTex(), side: THREE.DoubleSide, toneMapped: false });
    const tri = (w: number, h: number, hook: number) => {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(w, 0); sh.lineTo(w * hook, h); sh.closePath();
      return new THREE.ShapeGeometry(sh);
    };
    const sailDefs: [number, number, number, number, number][] = [[-2.2, 3.4, 4.9, 6.6, 0.1], [2.4, 3.4, 4.2, 5.9, 0.1], [-2.0, 4.3, 3.0, 4.6, 0.55], [2.6, 4.2, 2.6, 4.2, 0.55]];
    for (let k = 0; k < 3; k++) {
      const g = new THREE.Group(), sails: THREE.Mesh[] = [];
      const sb = new Batch(), z0 = SHIPZ, DECK_Y = 3.0;
      sb.add(boxGeo(V(-6, -0.4, z0 - 2.1), V(5.2, DECK_Y, z0 + 2.1), 2), hullM);
      sb.add(boxGeo(V(-6, DECK_Y, z0 - 2.1), V(5.2, DECK_Y + 0.08, z0 + 2.1), 2), M.planks);
      for (const sz of [-1, 1]) sb.add(boxGeo(V(-6, DECK_Y, z0 + sz * 2.1 - 0.06), V(5.2, DECK_Y + 0.5, z0 + sz * 2.1 + 0.06), 2), hullM);
      for (const sz of [-1, 1]) sb.add(boxGeo(V(-6, 1.4, z0 + sz * 2.1 - 0.1), V(5.2, 1.75, z0 + sz * 2.1 + 0.1), 2), trimM); // the gun stripe
      const bow = new THREE.ConeGeometry(2.6, 5.5, 4); bow.rotateY(Math.PI / 4); bow.rotateZ(-Math.PI / 2); bow.scale(1, 1, 0.85);
      sb.add(bow, hullM, new THREE.Matrix4().makeTranslation(7.9, (DECK_Y - 0.4) / 2 + 0.15, z0));
      for (const mx of [-2.2, 2.4]) sb.add(new THREE.CylinderGeometry(0.1, 0.16, mx < 0 ? 11 : 10, 8), M.wood, new THREE.Matrix4().makeTranslation(mx, DECK_Y + (mx < 0 ? 5.5 : 5), z0));
      sb.build(g);
      for (const [mx, y0, w, h, hook] of sailDefs) {
        const m = new THREE.Mesh(tri(w, h, hook), sailM);
        m.position.set(mx + (hook < 0.3 ? -0.15 : 0.1), DECK_Y + y0, z0 + 0.12); m.castShadow = true; m.frustumCulled = false;
        if (hook < 0.3) m.scale.x = -1;
        sails.push(m); g.add(m);
      }
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), flagM); fl.layers.set(NOINK);
      fl.position.set(-2.2 + 1.35, DECK_Y + 10.2, z0); g.add(fl);
      g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      g.scale.setScalar(SHIP_S);
      this.ships.push({ g, sails }); R.add(g);
    }

    // ---- the submarine: an iron hull 8 m long with a hatch tower near the bow and a propeller at the stern ----
    const ironM = lam("subIron", () => ({ map: ironTex("subIronTex", "#6b6a62", "#45443e") }));
    const darkM = lam("subDark", () => ({ color: "#3d3b37" }));
    const glassM = lam("subGlass", () => ({ color: "#2b4a55" }));
    this.sub = new THREE.Group(); this.subPitch = new THREE.Group(); this.sub.add(this.subPitch);
    const hull = new THREE.CapsuleGeometry(1, 6, 8, 24); hull.rotateZ(-Math.PI / 2); hull.scale(1, 1.25, 1.02);
    const hb = new Batch();
    hb.add(hull, ironM);
    for (const x of [-2.4, -0.8, 0.8, 2.4]) { const ring = new THREE.TorusGeometry(1.03, 0.045, 6, 32); ring.rotateY(Math.PI / 2); ring.scale(1, 1.25, 1.02); hb.add(ring, darkM, new THREE.Matrix4().makeTranslation(x, 0, 0)); }
    hb.add(new THREE.CylinderGeometry(0.42, 0.48, 0.75, 20), ironM, new THREE.Matrix4().makeTranslation(HATCH_X, 1.45, 0));
    for (const sz of [-1, 1]) for (const x of [-1.6, 0.0]) { const w = new THREE.CircleGeometry(0.16, 16); if (sz < 0) w.rotateY(Math.PI); hb.add(w, glassM, new THREE.Matrix4().makeTranslation(x, 0.55, sz * 0.96)); }
    hb.add(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 10).rotateZ(Math.PI / 2), darkM, new THREE.Matrix4().makeTranslation(-4.15, 0, 0));
    hb.build(this.subPitch);
    this.subLid = new THREE.Group(); this.subLid.position.set(HATCH_X - 0.46, 1.83, 0);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.08, 20), darkM); lid.position.set(0.46, 0, 0);
    this.subLid.add(lid); this.subPitch.add(this.subLid);
    this.prop = new THREE.Group(); this.prop.position.set(-4.45, 0, 0);
    for (let k = 0; k < 3; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.22), darkM); bl.position.y = 0.3; const pv = new THREE.Group(); pv.rotation.x = (k * 2 * Math.PI) / 3; bl.rotation.y = 0.5; pv.add(bl); this.prop.add(pv); }
    this.subPitch.add(this.prop);
    this.sub.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    R.add(this.sub);

    // ---- the cut-open hull (back half), studio set on the bed ----
    const inM = lam("cutIron", () => ({ map: ironTex("cutIronTex", "#9a8a6c", "#5e5240"), side: THREE.DoubleSide }));
    const ribM = lam("cutRib", () => ({ color: "#4a463f" }));
    this.cut = new THREE.Group(); this.cut.position.set(...CUT);
    const cb = new Batch(), L2 = 4;
    const shell = new THREE.CylinderGeometry(CUT_R, CUT_R, 2 * L2, 40, 1, true, Math.PI / 2, Math.PI); shell.rotateZ(-Math.PI / 2);
    cb.add(shell, inM);
    for (const sx of [-1, 1]) { const cap = new THREE.CircleGeometry(CUT_R, 24, -Math.PI / 2, Math.PI); cap.rotateY(Math.PI / 2); cb.add(cap, inM, new THREE.Matrix4().makeTranslation(sx * L2, 0, 0)); }
    for (let x = -3.2; x <= 3.21; x += 1.6) { const rib = new THREE.TorusGeometry(CUT_R - 0.03, 0.06, 6, 24, Math.PI); rib.rotateZ(-Math.PI / 2); rib.rotateY(Math.PI / 2); cb.add(rib, ribM, new THREE.Matrix4().makeTranslation(x, 0, 0)); }
    const fy = FLOOR_Y - CUT[1], fw = Math.sqrt(CUT_R * CUT_R - fy * fy);
    cb.add(boxGeo(V(-L2 + 0.05, fy - 0.06, -fw), V(L2 - 0.05, fy, 0.02), 1.5), M.planks);
    // the hatch tower over the bow end (back half), and four small round windows in the back wall
    const tower = new THREE.CylinderGeometry(0.46, 0.46, 0.75, 20, 1, true, Math.PI / 2, Math.PI);
    cb.add(tower, inM, new THREE.Matrix4().makeTranslation(HATCH_X, CUT_R + 0.3, 0));
    for (const x of [-2.6, -1.4, 0.2, 2.6]) { const w = new THREE.CircleGeometry(0.17, 18); cb.add(w, glassM, new THREE.Matrix4().makeTranslation(x, 0.35, -Math.sqrt(CUT_R * CUT_R - 0.35 * 0.35) + 0.07)); }
    // the pump: a cylinder with a rod by the stern end
    cb.add(new THREE.CylinderGeometry(0.11, 0.13, 0.85, 12), ribM, new THREE.Matrix4().makeTranslation(-3.2, fy + 0.42, -0.75));
    cb.build(this.cut);
    this.cutLid = new THREE.Group(); this.cutLid.position.set(HATCH_X - 0.46, CUT_R + 0.68, 0);
    const clid = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.08, 20, 1, false, Math.PI / 2, Math.PI), darkM); clid.position.set(0.46, 0, 0);
    this.cutLid.add(clid); this.cut.add(this.cutLid);
    this.ballast = new THREE.Mesh(boxGeo(V(-0.32, 0, -0.28), V(0.32, 0.34, 0.28), 1), darkM);
    this.ballast.position.set(0.4, fy, -0.75); this.cut.add(this.ballast);
    this.cut.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.receiveShadow = true; o.castShadow = false; } });
    R.add(this.cut);
    // the water inside: a level, see-through green box (world-aligned so it stays level when the hull tilts)
    this.cutWater = new THREE.Mesh(boxGeo(V(-3.85, 0, -1.4), V(3.85, 1, 0.01), 1),
      new THREE.MeshLambertMaterial({ color: "#3f8f96", transparent: true, opacity: 0.62, depthWrite: false }));
    this.cutWater.renderOrder = 3; this.cutWater.layers.set(NOINK);
    R.add(this.cutWater);

    // ---- the surface seen from below, and the display plinth ----
    const top = new THREE.PlaneGeometry(2400, 2400); top.rotateX(Math.PI / 2);
    this.ceiling = new THREE.Mesh(top, new THREE.MeshBasicMaterial({ color: new THREE.Color("#8fd3cf"), fog: true }));
    this.ceiling.position.set(1200, SEA_Y - 0.03, 0); this.ceiling.layers.set(NOINK);
    R.add(this.ceiling);
    this.plinth = new THREE.Mesh(boxGeo(V(-4.6, 0, -1.6), V(4.6, 0.7, 1.6), 2), M.quayWall);
    this.plinth.position.set(...PLINTH); this.plinth.receiveShadow = true; this.plinth.castShadow = true;
    R.add(this.plinth);
    for (let k = 0; k < 2; k++) { const o = kitClone(kit, "canoe", 0.9); if (o) { o.visible = false; this.boats.push(o); R.add(o); } }

    // ---- water: the harbour (wind ripples) ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
      wFoam: { value: new THREE.Vector4(0, 0, 0, 0) },
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
    waterM.customProgramCacheKey = () => "harbour1";
    const seaG = new THREE.PlaneGeometry(2400, 2400); seaG.rotateX(-Math.PI / 2);
    this.seaTop = new THREE.Mesh(seaG, waterM); this.seaTop.position.set(1200, SEA_Y, 0); this.seaTop.receiveShadow = true;
    R.add(this.seaTop);

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

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light], where: Scene = sceneAt(id, f), wet = where !== "quay";
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L), ct = cutAt(id, t);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.fill.intensity = 0;
    // under the sea the light is greener and dimmer; the lamp-less hours inside dimmer still
    const lk = wet ? (where === "inside" ? ct.dim : 0.85) : 1, lt: [number, number, number] = wet ? [0.9, 0.98, 1.0] : [1, 1, 1];
    TONE.uLitCol.value.set(L.lit[0] * lk * lt[0], L.lit[1] * lk * lt[1], L.lit[2] * lk * lt[2]);
    TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc + halo, clouds ----
    const su = this.skyMat.uniforms;
    if (wet) SEA_SKY.forEach((h, i) => untone(h, su["c" + i].value));
    else K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    if (wet) { untone(SEA_FOG, this.fog.color); this.fog.near = where === "inside" ? 9 : 3; this.fog.far = where === "inside" ? 40 : 38; }
    else { untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; }
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden" && !wet;
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.visible = !wet;
      m.position.x = cam.position.x + Math.cos((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.position.z = cam.position.z + Math.sin((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    this.ceiling.visible = wet; this.seaTop.visible = !wet;
    // ---- water colours, foam ring where the boat went under / the men came up ----
    const W = this.WU, wc = K.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    const foam = id === 1 && f < 60 ? 2.5 + 1.2 * t : id === 4 ? 3.2 * Math.max(0, Math.min(1, (t - 17.4) / 1.0)) : id === 14 ? 4.5 : 0;
    (W.wFoam.value as THREE.Vector4).set(DIVE[0], DIVE[2], foam, 0);
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;

    // ---- ships, submarine, cut-open hull, boats ----
    this.ships.forEach((sh, k) => {
      const [x, z] = DANES[k];
      sh.g.visible = !wet;
      const yaw = Math.PI / 2 + 0.3 * (k - 1); // broadside to the town; the hull centre lands on DANES[k]
      sh.g.position.set(x - SHIPZ * SHIP_S * Math.sin(yaw), SEA_Y + 0.05 * Math.sin(t * 1.4 + k), z - SHIPZ * SHIP_S * Math.cos(yaw));
      sh.g.rotation.y = yaw;
      sh.g.rotation.z = 0.012 * Math.sin(t * 1.1 + k);
      sh.sails.forEach((m, i) => { m.rotation.y = 0.05 * Math.sin(t * 1.7 + i + k); });
    });
    const sp = subAt(id, t);
    this.sub.visible = sp.vis && where !== "inside";
    this.sub.position.set(...sp.p); this.sub.rotation.y = sp.yaw; this.subPitch.rotation.z = sp.pitch;
    this.subLid.rotation.z = 1.9 * sp.open;
    this.prop.rotation.x = id === 2 || id === 3 || id === 4 || id === 5 ? t * 3.2 : 0;
    this.plinth.visible = id === 16;
    this.cut.visible = where === "inside";
    this.cut.rotation.z = ct.tilt;
    this.ballast.position.x = ct.ballast;
    this.cutLid.rotation.z = 1.9 * ct.open;
    this.cutWater.visible = where === "inside" && ct.water > FLOOR_Y - 0.1;
    const wb = CUT[1] - 1.45;
    this.cutWater.position.set(CUT[0], wb, CUT[2]); this.cutWater.scale.set(1, Math.max(0.01, ct.water - wb), 1);
    this.boats.forEach((o, k) => {
      o.visible = id === 14 && where === "quay";
      const u = Math.min(1, Math.max(0, (t - 57.6) / 1.6));
      const [bx, bz] = boatAt(k, u);
      o.position.set(bx, SEA_Y - 0.05, bz);
      o.rotation.y = k ? 0.3 : Math.PI / 2 + 0.4;
    });

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right }, where);
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
uniform float wTime;
uniform vec4 wFoam;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(0.5 * wTime, 0.2 * wTime);
  vec4 mk = mix(texture2D(wNearTex, wp / 2.6), texture2D(wFarTex, wp / 26.0 + 0.37), smoothstep(25.0, 90.0, wd));
  float rp = sin(wp.x * 2.0 + 1.6 * sin(vWP.z * 0.7)) * sin(vWP.z * 1.05 + wp.x * 0.45 + 0.8 * sin(wp.x * 0.3));
  float near = 1.0 - smoothstep(18.0, 60.0, wd);
  float crest = max(mk.r * 0.8, smoothstep(0.45, 0.65, rp) * 0.6 * near);
  float trough = max(mk.g * 0.6, smoothstep(-0.4, -0.75, rp) * 0.4 * near);
  vec3 wr = mix(wc, wTrough, trough);
  wr = mix(wr, wCrest, crest);
  wr = mix(wr, wGlint, mk.b * (0.3 + 0.5 * wf));
  // a ring of white foam and bubbles where the boat went under
  if (wFoam.z > 0.0) {
    float d = length(vWP.xz - wFoam.xy);
    float ring = (1.0 - smoothstep(wFoam.z * 0.75, wFoam.z, d)) * (0.55 + 0.45 * sin(d * 7.0 - wTime * 5.0) * sin(atan(vWP.z - wFoam.y, vWP.x - wFoam.x) * 9.0));
    wr = mix(wr, wCrest, clamp(ring, 0.0, 1.0) * 0.8);
  }
  diffuseColor.rgb = wr;`;
