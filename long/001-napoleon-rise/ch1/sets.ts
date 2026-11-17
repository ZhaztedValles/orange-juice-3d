// Chapter 1 places, each a group the world shows only in its own shots:
//   corsica: Ajaccio in the 1760s-70s: a sunny harbour town (pastel houses, terracotta roofs) on a straight quay, an
//            island of maquis-green mountains, fishing boats with lateen sails, a Genoese watchtower on a rocky headland,
//            the governor's palace on the square (portico, opening door, Bourbon white flag), the standoff field.
//   parvis:  the square in front of Notre-Dame (Paris houses with slate roofs), the cathedral itself from shared/.
//   school:  the military school courtyard (flash-forward to the teenage cadet).
//   home:    one room of the Buonaparte house (bed, desk with books and papers, window, painting).
import * as THREE from "three";
import { Batch, V, lam, quad, tri, boxGeo, prop, house, setSightLines, Kit, Ray } from "../../../src/engine/build";
import { ctex, rep, stoneHD, cobbleHD, planksHD } from "../../../src/engine/paint";
import { NOINK } from "../../../src/engine/ink";
import { flagTex } from "../shared/props";
import { G, PALACE_DOOR, CASA, TOWER, EXT, SCH, HOME, V3 } from "./story";

const M4 = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const rnd = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s % 100000) / 100000; }; };

// ---------------- painted textures ----------------
const groundTex = () => ctex("ajGround", 512, 512, (g, r) => {
  g.fillStyle = "#d4bc8f"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) { g.fillStyle = r() < 0.5 ? "rgba(185,155,110,0.35)" : "rgba(236,220,186,0.35)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 40, 6 + r() * 20, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 26; i++) { g.fillStyle = r() < 0.5 ? "rgba(132,158,82,0.55)" : "rgba(112,140,70,0.5)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 14 + r() * 36, 8 + r() * 18, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(150,135,110,0.5)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 4, 0, 7); g.fill(); }
});
const rockTex = () => ctex("ajRock", 256, 256, (g, r) => {
  g.fillStyle = "#a89e8a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,110,95,0.4)" : "rgba(200,192,175,0.35)"; g.beginPath(); g.ellipse(r() * 256, r() * 256, 8 + r() * 30, 4 + r() * 12, r() * 3, 0, 7); g.fill(); }
});
const wallTex = () => ctex("homeWall", 512, 512, (g, r) => {
  g.fillStyle = "#ead8b4"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,250,235" : "180,150,110"},0.08)`; g.beginPath(); g.ellipse(r() * 512, r() * 380, 20 + r() * 50, 10 + r() * 30, 0, 0, 7); g.fill(); }
  g.fillStyle = "#8f5f3c"; g.fillRect(0, 400, 512, 112);           // wainscot (lower ~0.9 m)
  g.fillStyle = "#a8734c"; g.fillRect(0, 392, 512, 14);
  g.strokeStyle = "rgba(60,35,20,0.6)"; g.lineWidth = 3; for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 406); g.lineTo(x, 512); g.stroke(); }
});
const paperTex = () => ctex("ajPaper", 128, 160, (g) => {
  g.fillStyle = "#f4ecd8"; g.fillRect(0, 0, 128, 160);
  g.strokeStyle = "rgba(60,50,70,0.75)"; g.lineWidth = 3;
  for (let y = 22; y < 140; y += 14) { g.beginPath(); g.moveTo(14, y); for (let x = 14; x < 112; x += 8) g.lineTo(x, y + (x % 16 ? -2 : 2)); g.stroke(); }
});
const paintingTex = () => ctex("ajPainting", 256, 192, (g) => {
  g.fillStyle = "#8a6a2c"; g.fillRect(0, 0, 256, 192);
  g.fillStyle = "#9cc3e0"; g.fillRect(16, 16, 224, 160);
  g.fillStyle = "#6f8f4a"; g.beginPath(); g.moveTo(16, 140); g.lineTo(90, 70); g.lineTo(150, 120); g.lineTo(200, 80); g.lineTo(240, 120); g.lineTo(240, 176); g.lineTo(16, 176); g.fill();
  g.fillStyle = "#3a6ea8"; g.fillRect(16, 150, 224, 26);
});

// ---------------- small builders ----------------
/** a fishing boat: rounded hull (length 5.2 m), plank deck, mast and a lateen sail; bow toward +x, origin at the waterline */
const boatProto = (() => {
  const cache = new Map<string, THREE.Group>();
  return (hull: string, sail: boolean) => {
    const k = hull + sail;
    let g = cache.get(k);
    if (!g) {
      g = new THREE.Group();
      const hg = new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); hg.scale(2.6, 0.95, 0.95);
      const h = new THREE.Mesh(hg, lam("boat" + hull, () => ({ color: hull, side: THREE.DoubleSide }))); h.position.y = 0.55; g.add(h);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 28), lam("boatRim", () => ({ color: "#f2ead8" }))); rim.rotation.x = Math.PI / 2; rim.scale.set(2.6, 0.95, 1); rim.position.y = 0.55; g.add(rim);
      const dg = new THREE.CircleGeometry(1, 24); dg.rotateX(-Math.PI / 2); dg.scale(2.35, 1, 0.8);
      const deck = new THREE.Mesh(dg, lam("boatDeck", () => ({ color: "#a8784a" }))); deck.position.y = 0.3; g.add(deck);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), lam("boatMast", () => ({ color: "#6b4a2e" }))); mast.position.set(0.6, 2.5, 0); g.add(mast);
      if (sail) {
        const sg = new THREE.BufferGeometry();
        sg.setAttribute("position", new THREE.Float32BufferAttribute([2.4, 1.0, 0, -1.8, 4.9, 0, 0.6, 0.9, 0], 3));
        sg.setAttribute("uv", new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0], 2)); sg.computeVertexNormals();
        const s = new THREE.Mesh(sg, lam("boatSail", () => ({ color: "#f3e7c9", side: THREE.DoubleSide }))); s.position.z = 0.1; g.add(s);
        const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.6, 6), lam("boatMast", () => ({ color: "#6b4a2e" })));
        yard.position.set(0.3, 2.95, 0.12); yard.rotation.z = Math.atan2(4.9 - 1.0, -1.8 - 2.4) + Math.PI / 2; g.add(yard);
      }
      g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      cache.set(k, g);
    }
    return g.clone();
  };
})();

/** an animated hinged door leaf (pivot at the hinge) */
export type Door = { left: THREE.Group; right: THREE.Group; glow: THREE.Mesh; spill: THREE.Mesh[] };

// ---------------- Corsica ----------------
export type Corsica = { group: THREE.Group; boats: { o: THREE.Object3D; x: number; z: number; ph: number; yaw: number }[]; door: Door; flag: THREE.Mesh };
const ELL = { cx: 0, cz: 380, rx: 650, rz: 380 };
/** the island outline (x, z), counter-clockwise from the west end of the quay */
const outline = (): [number, number][] => {
  const pts: [number, number][] = [[-220, 0], [220, 0]];
  for (let d = 25; d <= 335; d += 5) { const a = (d * Math.PI) / 180; pts.push([ELL.rx * Math.sin(a), ELL.cz - ELL.rz * Math.cos(a)]); }
  return pts;
};
export const buildCorsica = (kit: Kit, rays: Ray[]): Corsica => {
  const group = new THREE.Group(), b = new Batch(), r = rnd(7);
  setSightLines(rays);
  // land: one flat shape at G (no stacked ground planes), skirt walls down into the sea (quay stone / rock)
  const shape = new THREE.Shape(outline().map(([x, z]) => new THREE.Vector2(x, -z)));
  const lg = new THREE.ShapeGeometry(shape, 4); lg.rotateX(-Math.PI / 2); lg.translate(0, G, 0);
  const gm = lam("ajGroundM", () => ({ map: rep(groundTex(), 1 / 14, 1 / 14), side: THREE.DoubleSide }));
  b.add(lg, gm);
  const quayM = lam("ajQuay", () => ({ map: rep(stoneHD("ajQuayHD", ["#d9c9a8", "#cdbb98", "#e0d2b4", "#c4b28e"], "#9e8d70"), 1, 1) }));
  const rockM = lam("ajRockM", () => ({ map: rep(rockTex(), 1, 1) }));
  const ol = outline();
  for (let i = 0; i < ol.length; i++) {
    const [x0, z0] = ol[i], [x1, z1] = ol[(i + 1) % ol.length], L = Math.hypot(x1 - x0, z1 - z0);
    b.add(quad(V(x1, -3, z1), V(x0, -3, z0), V(x0, G, z0), V(x1, G, z1), L / 4, (G + 3) / 4), i === 0 ? quayM : rockM);
  }
  // quay furniture: bollards, a few crates and barrels
  const wood = lam("ajWood", () => ({ color: "#8a5a36" })), iron = lam("ajIron", () => ({ color: "#3d414c" }));
  for (let x = -200; x <= 200; x += 16) b.add(new THREE.CylinderGeometry(0.22, 0.26, 0.7, 10), iron, M4(x, G + 0.35, 0.8));
  for (const [x, z, s] of [[-48, 4, 0.9], [-46.8, 4.4, 0.7], [12, 5, 0.8], [96, 4, 0.9], [-120, 5, 0.8]] as const) b.add(boxGeo(V(x - s / 2, G, z - s / 2), V(x + s / 2, G + s, z + s / 2)), wood);
  for (const [x, z] of [[-45, 6], [14, 6.3], [-118, 6.2], [98, 6]]) b.add(new THREE.CylinderGeometry(0.38, 0.38, 0.95, 12), lam("ajBarrel", () => ({ color: "#9a6438" })), M4(x, G + 0.48, z));
  // town: rows of tall pastel houses with terracotta roofs facing the sea; the square + palace at x 22..98
  const STY = [0, 1, 4, 6, 0, 1];
  const row = (zc: number, skip: (x0: number, x1: number) => boolean, x0 = -205, x1 = 205, gapP = 0.2) => {
    let x = x0;
    while (x < x1) {
      const w = [8, 9, 10][Math.floor(r() * 3)], h = [9.8, 11.2, 12.6][Math.floor(r() * 3)];
      if (!skip(x, x + w)) house(b, x + w / 2, zc + (r() - 0.5) * 1.2, Math.PI, w, 8, h, STY[Math.floor(r() * STY.length)], G);
      x += w + (r() < gapP ? 3.5 : 0.2);
    }
  };
  const inSq = (a: number, c: number) => c > 20 && a < 100;
  const inCasa = (a: number, c: number) => c > CASA[0] - 7.5 && a < CASA[0] + 7.5;
  row(14, inSq);
  row(30, (a, c) => inSq(a, c) || inCasa(a, c));
  row(46, (a, c) => c > 44 && a < 77, -190, 190, 0.3);
  row(62, (a, c) => c > 44 && a < 77, -170, 170, 0.35);
  row(78, () => false, -140, 140, 0.45);
  house(b, CASA[0], CASA[2] + 4, Math.PI, 13, 8, 12.6, 1, G); // Casa Buonaparte (ochre, four storeys)
  // the governor's palace on the square, with a portico, an opening door and a flagpole
  house(b, 60, 46, Math.PI, 26, 16, 12.6, 0, G);
  const [dx, , dz] = PALACE_DOOR, stone = lam("ajPortico", () => ({ map: rep(stoneHD("ajPorticoHD", ["#ece2cc", "#e2d6bd", "#f0e8d6", "#d9ccb2"], "#b3a68c"), 1, 1) }));
  for (const sx of [-1, 1]) b.add(boxGeo(V(dx + sx * 1.15 - 0.45, G, dz), V(dx + sx * 1.15 + 0.45, G + 4.3, 38)), stone);
  for (const sx of [-1, 1]) b.add(boxGeo(V(dx + sx * 2.3 - 0.35, G, dz - 0.2), V(dx + sx * 2.3 + 0.35, G + 4.6, 38)), stone);
  b.add(boxGeo(V(dx - 2.9, G + 4.3, dz - 0.3), V(dx + 2.9, G + 5.0, 38)), stone);
  b.add(tri(V(dx + 2.9, G + 5.0, dz - 0.3), V(dx - 2.9, G + 5.0, dz - 0.3), V(dx, G + 6.4, dz - 0.3)), stone);
  b.add(quad(V(dx - 3.0, G + 4.95, 38), V(dx, G + 6.45, 38), V(dx, G + 6.45, dz - 0.32), V(dx - 3.0, G + 4.95, dz - 0.32)), stone);
  b.add(quad(V(dx, G + 6.45, 38), V(dx + 3.0, G + 4.95, 38), V(dx + 3.0, G + 4.95, dz - 0.32), V(dx, G + 6.45, dz - 0.32)), stone);
  b.add(boxGeo(V(dx - 0.7, G, dz - 1.2), V(dx + 0.7, G + 0.18, dz)), stone); // door step
  b.add(boxGeo(V(dx - 0.72, G, 37.9), V(dx + 0.72, G + 4.3, 38.0)), lam("ajRecess", () => ({ color: "#5a4636" })));
  b.add(new THREE.CylinderGeometry(0.06, 0.06, 5, 8), wood, M4(dx, G + 6.4 + 2.5, dz + 0.4));
  // headland with the Genoese watchtower (round, battered base, corbelled crenellated top)
  b.add(new THREE.SphereGeometry(1, 24, 14), rockM, new THREE.Matrix4().compose(V(TOWER[0], -3, TOWER[2]), new THREE.Quaternion(), V(26, 12, 20)));
  b.add(new THREE.SphereGeometry(1, 24, 14), rockM, new THREE.Matrix4().compose(V(TOWER[0] + 2, -4, TOWER[2] + 34), new THREE.Quaternion(), V(19, 9.5, 34)));
  for (const [x, z, s] of [[-238, -40, 5], [-282, -10, 6], [-250, -50, 3.5], [-275, -45, 4]] as const) b.add(new THREE.DodecahedronGeometry(s, 0), rockM, M4(x, s * 0.2, z));
  const tStone = lam("ajTower", () => ({ map: rep(stoneHD("ajTowerHD", ["#d1c19f", "#c6b490", "#d8caab", "#bca988"], "#988664"), 1, 1) }));
  b.add(new THREE.CylinderGeometry(4.1, 4.9, 15, 28), tStone, M4(TOWER[0], TOWER[1] + 7.5, TOWER[2]));
  b.add(new THREE.CylinderGeometry(4.6, 4.1, 1.4, 28), tStone, M4(TOWER[0], TOWER[1] + 15.7, TOWER[2]));
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, m = new THREE.BoxGeometry(1.1, 1.2, 0.6); m.rotateY(-a);
    b.add(m, tStone, M4(TOWER[0] + Math.cos(a) * 4.3, TOWER[1] + 17.0, TOWER[2] + Math.sin(a) * 4.3));
  }
  b.add(boxGeo(V(TOWER[0] - 0.7, TOWER[1] + 6, TOWER[2] - 4.95), V(TOWER[0] + 0.7, TOWER[1] + 8.2, TOWER[2] - 4.3)), lam("ajTowerDoor", () => ({ color: "#4a3426" })));
  // mountains: maquis green with grey rock tops, hills behind the town (no cast: they shadowed each other dark teal)
  const hills = new Batch();
  const hill = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("ajHillA", () => ({ color: "#6f8f4a" })), lam("ajHillB", () => ({ color: "#7f9a55" })), lam("ajHillC", () => ({ color: "#8f9a72" })), lam("ajHillD", () => ({ color: "#9a9480" }))];
  ([[-350, 330, 240, 210, 190], [-80, 430, 290, 320, 220], [220, 390, 250, 260, 200], [450, 300, 200, 160, 160], [60, 610, 330, 430, 200],
    [-420, 560, 250, 340, 190], [380, 600, 250, 370, 200], [-160, 160, 120, 55, 70], [120, 175, 140, 62, 72], [310, 190, 100, 48, 62], [-300, 190, 110, 60, 80]] as const)
    .forEach(([x, z, sx, sy, sz], i) => hills.add(hill, hm[i % 4], new THREE.Matrix4().compose(V(x, G - 2, z), new THREE.Quaternion(), V(sx, sy, sz))));
  // trees and maquis bushes (umbrella pines / olives read as round trees), the standoff field kept clear
  const clearField = (x: number, z: number) => x > 214 && x < 262 && z > 84 && z < 112;
  for (let i = 0; i < 170; i++) {
    const x = (r() - 0.5) * 760, z = 90 + r() * 240;
    if (Math.abs(x) < 160 && z < 95) continue;
    if (clearField(x, z)) continue;
    prop(b, kit, r() < 0.55 ? "plant_bushLarge" : r() < 0.5 ? "tree_fat" : "tree_default", x, G, z, r() < 0.55 ? 2 + r() * 1.5 : 6 + r() * 3, r() * 6);
  }
  for (let i = 0; i < 40; i++) { const x = 200 + r() * 90, z = 80 + r() * 60; if (!clearField(x, z)) prop(b, kit, "plant_bushDetailed", x, G, z, 1.2 + r() * 1.2, r() * 6); }
  for (const [x, z, s] of [[216, 112, 1.4], [262, 108, 1.1], [205, 95, 1.8], [270, 90, 1.3]] as const) b.add(new THREE.DodecahedronGeometry(s, 0), rockM, M4(x, G + s * 0.3, z));
  // a low dry-stone wall behind the Corsicans
  b.add(boxGeo(V(208, G, 116), V(268, G + 0.9, 116.8), 2), lam("ajDryWall", () => ({ map: rep(stoneHD("ajDryHD", ["#b9ad96", "#a99c84", "#c4b8a2", "#9e927c"], "#7d725f"), 1, 1) })));
  b.build(group);
  hills.build(group, false);
  setSightLines([]);
  // door leaves (hinged), the warm hall behind them, light spilling onto the square when it opens
  const leafM = lam("ajDoorLeaf", () => ({ color: "#5b3a24" }));
  const mk = (sx: number) => {
    const piv = new THREE.Group(); piv.position.set(dx + sx * -0.72, G, dz + 0.15);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.72, 3.9, 0.1), leafM); leaf.position.set(sx * 0.36, 1.95, 0); leaf.castShadow = true;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.04), lam("ajDoorPanel", () => ({ color: "#734a2e" }))); panel.position.set(sx * 0.36, 2.6, -0.06);
    const panel2 = panel.clone(); panel2.position.y = 1.05;
    piv.add(leaf, panel, panel2); group.add(piv); return piv;
  };
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 4.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.75, 0.95), fog: false }));
  glow.position.set(dx, G + 2.15, 37.85); glow.rotation.y = Math.PI; glow.layers.set(NOINK); group.add(glow);
  const spillM = new THREE.MeshBasicMaterial({ color: "#ffd9a0", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.Float32BufferAttribute([dx - 0.7, G + 0.03, dz, dx + 0.7, G + 0.03, dz, dx + 2.6, G + 0.03, dz - 7, dx - 0.7, G + 0.03, dz, dx + 2.6, G + 0.03, dz - 7, dx - 2.6, G + 0.03, dz - 7], 3));
  const spill = new THREE.Mesh(sg, spillM); spill.layers.set(NOINK); spill.renderOrder = 3; group.add(spill);
  // the Bourbon white flag over the portico
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5, 12, 1), new THREE.MeshBasicMaterial({ map: flagTex("white"), side: THREE.DoubleSide, color: 0xe6e6e6 }));
  flag.position.set(dx, G + 10.1, dz + 0.4); flag.frustumCulled = false; group.add(flag);
  // fishing boats in the harbour (rocking per frame)
  const boats: Corsica["boats"] = [];
  const hulls = ["#3f6fb5", "#c8473a", "#2f7a5a", "#e8dcc0", "#d9a441", "#3f6fb5", "#c8473a"];
  ([[-72, -15, 0.3], [-45, -24, -0.4], [-6, -17, 0.15], [24, -26, 2.8], [52, -14, 3.0], [88, -24, -0.2], [118, -15, 0.4], [-98, -30, 2.9]] as const).forEach(([x, z, yaw], i) => {
    const o = boatProto(hulls[i % hulls.length], i % 3 !== 1); o.position.set(x, 0, z); o.rotation.y = yaw; group.add(o);
    boats.push({ o, x, z, ph: i * 1.7, yaw });
  });
  return { group, boats, door: { left: mk(-1), right: mk(1), glow, spill: [spill] }, flag };
};

// ---------------- Paris: the parvis ----------------
export const buildParvis = (kit: Kit, rays: Ray[]) => {
  const g = new THREE.Group(), b = new Batch(), r = rnd(3);
  setSightLines(rays);
  const [ox, , oz] = EXT;
  const cob = lam("pxCobble", () => ({ map: rep(cobbleHD(), 1, 1) }));
  b.add(quad(V(ox - 90, 0, oz + 160), V(ox + 90, 0, oz + 160), V(ox + 90, 0, oz - 130), V(ox - 90, 0, oz - 130), 45, 72.5), cob);
  for (const s of [-1, 1]) {
    let z = 6;
    while (z < 150) {
      const w = [10, 12][Math.floor(r() * 2)], h = [12.6, 14][Math.floor(r() * 2)];
      house(b, ox + s * 52, oz + z + w / 2, s < 0 ? Math.PI / 2 : -Math.PI / 2, w, 10, h, [2, 7, 0, 3][Math.floor(r() * 4)], 0);
      z += w + 0.3;
    }
    for (let z = 10; z < 140; z += 14) prop(b, kit, "lantern", ox + s * 40, 0, oz + z, 3.4);
  }
  b.build(g);
  setSightLines([]);
  return g;
};

// ---------------- the school courtyard ----------------
export const buildSchool = (kit: Kit, rays: Ray[]) => {
  const g = new THREE.Group(), b = new Batch();
  setSightLines(rays);
  const [ox, , oz] = SCH;
  b.add(quad(V(ox - 40, 0, oz + 40), V(ox + 40, 0, oz + 40), V(ox + 40, 0, oz - 40), V(ox - 40, 0, oz - 40), 20, 20), lam("pxCobble", () => ({ map: rep(cobbleHD(), 1, 1) })));
  house(b, ox, oz - 18, 0, 34, 12, 12.6, 7, 0);
  house(b, ox - 24, oz - 2, Math.PI / 2, 22, 10, 11.2, 2, 0);
  house(b, ox + 24, oz - 2, -Math.PI / 2, 22, 10, 11.2, 2, 0);
  for (const x of [-6, 6]) prop(b, kit, "lantern", ox + x, 0, oz - 10.5, 3);
  b.build(g);
  setSightLines([]);
  return g;
};

// ---------------- the Buonaparte home: one room ----------------
export const buildHome = () => {
  const g = new THREE.Group(), shell = new Batch(), solid = new Batch();
  const [ox, , oz] = HOME;
  const P = (x: number, y: number, z: number) => V(ox + x, y, oz + z);
  const floor = lam("homeFloor", () => ({ map: rep(planksHD(), 1, 1) }));
  shell.add(quad(P(-4.4, 0, 4.4), P(4.4, 0, 4.4), P(4.4, 0, -3), P(-4.4, 0, -3), 3, 2.5), floor);
  const wall = lam("homeWallM", () => ({ map: wallTex() }));
  shell.add(quad(P(-4.4, 0, -3), P(4.4, 0, -3), P(4.4, 3.6, -3), P(-4.4, 3.6, -3), 2, 1), wall);
  shell.add(quad(P(-4.4, 0, 4.4), P(-4.4, 0, -3), P(-4.4, 3.6, -3), P(-4.4, 3.6, 4.4), 2, 1), wall);
  shell.add(quad(P(4.4, 0, -3), P(4.4, 0, 4.4), P(4.4, 3.6, 4.4), P(4.4, 3.6, -3), 2, 1), wall);
  shell.add(quad(P(-4.4, 3.6, -3), P(4.4, 3.6, -3), P(4.4, 3.6, 4.4), P(-4.4, 3.6, 4.4), 1, 1), lam("homeCeil", () => ({ color: "#d9c39a", side: THREE.DoubleSide })));
  // ceiling beams
  const beam = lam("homeBeam", () => ({ color: "#6b4a2e" }));
  for (let x = -3.6; x <= 3.6; x += 1.2) solid.add(boxGeo(P(x - 0.1, 3.38, -3), P(x + 0.1, 3.6, 4.4)), beam);
  // window over the desk (glass glows), shutters open
  const wx = 2.75;
  solid.add(boxGeo(P(wx - 0.75, 1.15, -3.02), P(wx + 0.75, 1.25, -2.85)), beam);
  solid.add(boxGeo(P(wx - 0.75, 2.6, -3.02), P(wx + 0.75, 2.7, -2.9)), beam);
  for (const sx of [-1, 1]) solid.add(boxGeo(P(wx + sx * 0.7 - 0.05, 1.2, -3.02), P(wx + sx * 0.7 + 0.05, 2.65, -2.9)), beam);
  solid.add(boxGeo(P(wx - 0.03, 1.2, -3.0), P(wx + 0.03, 2.65, -2.93)), beam);
  for (const sx of [-1, 1]) solid.add(boxGeo(P(wx + sx * 1.15 - 0.36, 1.2, -2.98), P(wx + sx * 1.15 + 0.36, 2.65, -2.93)), lam("homeShutter", () => ({ color: "#3f6b4a" })));
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.95, 1.15, 1.35), fog: false }));
  pane.position.set(ox + wx, 1.92, oz - 2.99); g.add(pane);
  // desk with books, papers and an inkwell; a chair
  const desk = lam("homeDesk", () => ({ color: "#7a4e30" }));
  solid.add(boxGeo(P(2.0, 0.76, -2.75), P(3.5, 0.84, -1.95)), desk);
  for (const [x, z] of [[2.06, -2.69], [3.44, -2.69], [2.06, -2.01], [3.44, -2.01]]) solid.add(boxGeo(P(x - 0.04, 0, z - 0.04), P(x + 0.04, 0.76, z + 0.04)), desk);
  ([[2.2, -2.55, 0.42, 0.3, 0.08, "#8c2f2f"], [2.22, -2.53, 0.38, 0.28, 0.07, "#2f5a3a"], [2.2, -2.55, 0.4, 0.3, 0.06, "#6a4a2a"], [3.2, -2.6, 0.32, 0.24, 0.07, "#3a4a7a"]] as const)
    .reduce((y, [x, z, w, d, h, c], i) => { const yy = i === 3 ? 0.84 : y; solid.add(boxGeo(P(x, yy, z), P(x + w, yy + h, z + d)), lam("book" + c, () => ({ color: c }))); return i === 3 ? y : y + h; }, 0.84);
  const paper = lam("homePaper", () => ({ map: paperTex() }));
  for (const [x, z, a] of [[2.75, -2.3, 0.2], [3.05, -2.15, -0.25]] as const) {
    const pg = new THREE.PlaneGeometry(0.3, 0.38); pg.rotateX(-Math.PI / 2); pg.rotateY(a);
    shell.add(pg, paper, M4(ox + x, 0.845, oz + z));
  }
  solid.add(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 10), lam("homeInk", () => ({ color: "#22202a" })), M4(ox + 3.3, 0.88, oz + -2.35));
  solid.add(boxGeo(P(2.5, 0.45, -1.75), P(2.95, 0.5, -1.3)), desk);
  solid.add(boxGeo(P(2.5, 0.5, -1.35), P(2.95, 1.1, -1.3)), desk);
  // bed in the back-left corner, a framed painting, a small crucifix shape, a chest
  solid.add(boxGeo(P(-4.4, 0, -3), P(-2.7, 0.45, -0.9)), desk);
  solid.add(boxGeo(P(-4.35, 0.45, -2.95), P(-2.75, 0.62, -0.95)), lam("homeSheet", () => ({ color: "#f1ead8" })));
  solid.add(boxGeo(P(-4.2, 0.62, -2.9), P(-2.9, 0.78, -2.45)), lam("homePillow", () => ({ color: "#fbf6ea" })));
  solid.add(boxGeo(P(-4.4, 0, -3), P(-2.7, 1.35, -2.9)), desk);
  solid.add(boxGeo(P(-4.2, 0.62, -2.2), P(-2.9, 0.68, -1.0)), lam("homeQuilt", () => ({ color: "#b8483c" })));
  shell.add(quad(P(-1.6, 1.6, -2.98), P(-0.4, 1.6, -2.98), P(-0.4, 2.5, -2.98), P(-1.6, 2.5, -2.98)), lam("homePaint", () => ({ map: paintingTex() })));
  solid.add(boxGeo(P(0.55, 2.0, -2.99), P(0.62, 2.55, -2.95)), beam);
  solid.add(boxGeo(P(0.4, 2.33, -2.99), P(0.77, 2.4, -2.95)), beam);
  solid.add(boxGeo(P(-4.35, 0, 0.6), P(-3.75, 0.6, 1.9)), lam("homeChest", () => ({ color: "#8a5a36" })));
  shell.build(g, false);
  solid.build(g, true);
  return g;
};
export type { V3 };
