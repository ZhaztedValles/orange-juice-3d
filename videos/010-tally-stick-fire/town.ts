// The places of the tally-stick fire: the river with its stone embankments and the bridge, the old palace on the west
// bank (a row of gabled halls and two square towers, built twice: whole, and as a blackened ruin of open walls), the
// great medieval hall behind it, the cobbled yard with the chequered treasury table, two carts heaped with sticks and
// the pub, and the four open-topped rooms far off on the east bank: the cellar (two brick furnaces with their flues,
// heaps of sticks), the Lords chamber (oak panelling, red benches, the tapestry of ships), the corridor at the Lords'
// door, and the garden table of the toaster analogy. The cast, flames and smoke live in cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo, roofMat } from "../../src/engine/build";
import { rng, cobble, planks, beam, stone, brick, water, ctex } from "../../src/engine/paint";
import {
  D0, RIVER_X0, RIVER_X1, WATER_Y, BR_Z0, BR_Z1, BR_Y, PAL_X, PAL2_X, PAL_Z, PAL2_Z, HALL, TABLE, CART1, CART2, PUB,
  CELLAR, FURN_X, CHAMBER, CORRIDOR, GARDEN,
} from "./story";

/** the chequered cloth of the treasury table */
const chequer = () => ctex("chequer", 256, 256, (g) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? "#2f5a3c" : "#203a2a"; g.fillRect(x * 32, y * 32, 32, 32); }
});
/** the tapestry: ships with full sails on a blue-green sea, in a red border */
const tapestry = () => ctex("tapestry", 512, 256, (g) => {
  g.fillStyle = "#8a3a34"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#c9b98c"; g.fillRect(14, 14, 484, 228);
  const sea = g.createLinearGradient(0, 120, 0, 242); sea.addColorStop(0, "#4f7d86"); sea.addColorStop(1, "#365a64");
  g.fillStyle = sea; g.fillRect(14, 140, 484, 102);
  g.strokeStyle = "#e8dcc0"; g.lineWidth = 3;
  for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(40 + k * 55, 170 + (k % 3) * 22, 14, Math.PI, 0); g.stroke(); }
  for (const [x, s] of [[110, 1], [260, 1.25], [410, 0.9]] as const) {
    g.fillStyle = "#6a4a2c"; g.beginPath(); g.moveTo(x - 50 * s, 150); g.lineTo(x + 50 * s, 150); g.lineTo(x + 36 * s, 172); g.lineTo(x - 36 * s, 172); g.closePath(); g.fill();
    g.fillStyle = "#f4ead2";
    for (const dx of [-24, 6]) { g.beginPath(); g.moveTo(x + dx * s, 146); g.quadraticCurveTo(x + (dx + 22) * s, 110, x + dx * s, 66); g.lineTo(x + dx * s, 146); g.fill(); }
    g.strokeStyle = "#3a2a1c"; g.beginPath(); g.moveTo(x - 24 * s, 150); g.lineTo(x - 24 * s, 60); g.moveTo(x + 6 * s, 150); g.lineTo(x + 6 * s, 56); g.stroke();
  }
});

const rot = (geo: THREE.BufferGeometry, x: number, y: number, z: number, ry: number, rz: number) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz)), V(1, 1, 1));

/** a heap of sticks around (x, z), n sticks, radius r, height h over base y */
const heap = (b: Batch, mat: THREE.Material, seed: number, x: number, y: number, z: number, n: number, r: number, h: number) => {
  const rr = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * r, yy = y + h * (1 - d / r) * rr() + 0.03;
    const L = 0.6 + 0.5 * rr(), g = new THREE.BoxGeometry(L, 0.05, 0.05);
    b.add(g, mat, rot(g, x + Math.cos(a) * d, yy, z + Math.sin(a) * d, rr() * Math.PI, (rr() - 0.5) * 0.5));
  }
};
/** a two-wheeled cart heaped with sticks, its bed along x */
const cart = (b: Batch, p: [number, number, number], seed: number, wood: THREE.Material, dark: THREE.Material, sticks: THREE.Material) => {
  const [x, y, z] = p;
  b.add(boxGeo(V(x - 1.3, y + 0.75, z - 0.75), V(x + 1.3, y + 0.88, z + 0.75), 1), wood);
  for (const s of [-1, 1]) b.add(boxGeo(V(x - 1.3, y + 0.88, z + s * 0.75 - 0.04), V(x + 1.3, y + 1.25, z + s * 0.75 + 0.04), 1), wood);
  b.add(boxGeo(V(x + 1.3, y + 0.7, z - 0.5), V(x + 3.0, y + 0.8, z - 0.42), 1), dark); // the shafts
  b.add(boxGeo(V(x + 1.3, y + 0.7, z + 0.42), V(x + 3.0, y + 0.8, z + 0.5), 1), dark);
  const wh = new THREE.CylinderGeometry(0.62, 0.62, 0.1, 18);
  for (const s of [-1, 1]) b.add(wh, dark, new THREE.Matrix4().compose(V(x, y + 0.62, z + s * 0.86), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V(1, 1, 1)));
  heap(b, sticks, seed, x, y + 0.88, z, 90, 1.15, 0.75);
};
/** a gothic square tower with a pyramid cap */
const tower = (b: Batch, x: number, z: number, w: number, h: number, wall: THREE.Material, cap: THREE.Material) => {
  b.add(boxGeo(V(x - w / 2, D0, z - w / 2), V(x + w / 2, D0 + h, z + w / 2), 2), wall);
  b.add(boxGeo(V(x - w / 2 - 0.3, D0 + h, z - w / 2 - 0.3), V(x + w / 2 + 0.3, D0 + h + 0.6, z + w / 2 + 0.3), 2), wall);
  const py = new THREE.ConeGeometry(w * 0.72, w * 1.3, 4); py.rotateY(Math.PI / 4);
  b.add(py, cap, new THREE.Matrix4().makeTranslation(x, D0 + h + 0.6 + w * 0.65, z));
};
/** a burnt-out shell: four thin walls with ragged tops, open to the sky */
const shell = (b: Batch, r: () => number, x: number, z: number, wx: number, wz: number, h: number, mat: THREE.Material) => {
  const t = 0.5;
  const seg = (x0: number, z0: number, x1: number, z1: number) => {
    const n = 5;
    for (let i = 0; i < n; i++) {
      const hh = h * (0.35 + 0.65 * r());
      const a0 = i / n, a1 = (i + 1) / n;
      const ax = x0 + (x1 - x0) * a0, az = z0 + (z1 - z0) * a0, bx = x0 + (x1 - x0) * a1, bz = z0 + (z1 - z0) * a1;
      b.add(boxGeo(V(Math.min(ax, bx) - t / 2, D0, Math.min(az, bz) - t / 2), V(Math.max(ax, bx) + t / 2, D0 + hh, Math.max(az, bz) + t / 2), 2), mat);
    }
  };
  seg(x - wx / 2, z - wz / 2, x + wx / 2, z - wz / 2); seg(x - wx / 2, z + wz / 2, x + wx / 2, z + wz / 2);
  seg(x - wx / 2, z - wz / 2, x - wx / 2, z + wz / 2); seg(x + wx / 2, z - wz / 2, x + wx / 2, z + wz / 2);
};

export type TownParts = { intact: THREE.Group; ruin: THREE.Group };

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []): TownParts => {
  const b = new Batch(), r = rng(1834);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const grass = lam("grassTop", () => ({ color: "#7fb35a" }));
  const yardM = lam("yardCobble", () => ({ map: cobble() }));
  const stoneM = lam("bankStone", () => ({ map: stone() }));
  const stoneW = lam("palStone", () => ({ map: stone("palStone", ["#cdbf9f", "#c2b493", "#d6c9aa", "#b9ab8b"]) }));
  const stoneDk = lam("palStoneDk", () => ({ color: "#a89878" }));
  const slate = roofMat("#8f97a8");
  const wood = lam("cartWood", () => ({ map: planks() }));
  const dark = lam("darkWood", () => ({ color: "#4a3326" }));
  const sticks = lam("tallyWood", () => ({ color: "#c9a46a" }));
  const brickM = lam("cellarBrick", () => ({ map: brick() }));
  const soot = lam("sootBrick", () => ({ color: "#3c3234" }));
  const post = lam("fencePost", () => ({ map: beam() }));
  const oak = lam("oakPanel", () => ({ map: planks(), color: "#9a6a44" }));
  const carpet = lam("lordsCarpet", () => ({ color: "#7c2e34" }));
  const bench = lam("lordsBench", () => ({ color: "#b0343c" }));
  const cloth = lam("chequer", () => ({ map: chequer() }));

  // ---- ground: the two banks (grass tops), the stone embankments and the river between (abutting, never stacked) ----
  setSightLines([]);
  b.add(boxGeo(V(-900, D0 - 3, -900), V(RIVER_X0 - 4, D0, 900), 4), grass);
  b.add(boxGeo(V(RIVER_X0 - 4, D0 - 3, -900), V(RIVER_X0, D0, 900), 2), stoneM);
  b.add(boxGeo(V(RIVER_X1, D0 - 3, -900), V(RIVER_X1 + 4, D0, 900), 2), stoneM);
  b.add(boxGeo(V(RIVER_X1 + 4, D0 - 3, -900), V(900, D0, 900), 4), grass);
  const wq = new THREE.PlaneGeometry(RIVER_X1 - RIVER_X0, 1800, 4, 60); wq.rotateX(-Math.PI / 2);
  const wuv = wq.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < wuv.count; i++) wuv.setXY(i, wuv.getX(i) * 12, wuv.getY(i) * 180);
  b.add(wq, lam("river", () => ({ map: water() })), new THREE.Matrix4().makeTranslation((RIVER_X0 + RIVER_X1) / 2, WATER_Y, 0));
  // ---- the bridge: deck on piers, stone parapets ----
  b.add(boxGeo(V(RIVER_X0 - 8, BR_Y - 0.9, BR_Z0), V(RIVER_X1 + 8, BR_Y, BR_Z1), 2), stoneM);
  for (const s of [BR_Z0, BR_Z1 - 0.5]) b.add(boxGeo(V(RIVER_X0 - 8, BR_Y, s), V(RIVER_X1 + 8, BR_Y + 1.0, s + 0.5), 2), stoneDk);
  for (let i = 0; i < 6; i++) { const x = RIVER_X0 + 8 + i * 17; b.add(boxGeo(V(x - 2, WATER_Y - 2, BR_Z0 + 0.5), V(x + 2, BR_Y - 0.9, BR_Z1 - 0.5), 2), stoneM); }
  // ---- the yard: cobbles raised 8 cm on the grass ----
  b.add(boxGeo(V(-40, D0, -58), V(-1, D0 + 0.08, 40), 2), yardM);
  // ---- the great medieval hall (always standing) with its two north towers ----
  const [hx0, hx1, hz0, hz1] = HALL, hw = hz1 - hz0;
  b.add(boxGeo(V(hx0, D0, hz0), V(hx1, D0 + 13, hz1), 2), stoneW);
  const roofG = new THREE.BufferGeometry();
  const rh = 9, L0 = hx0 - 0.4, L1 = hx1 + 0.4, zc = (hz0 + hz1) / 2;
  const pts = [[L0, 13, hz0 - 0.5], [L1, 13, hz0 - 0.5], [L1, 13 + rh, zc], [L0, 13 + rh, zc], [L0, 13, hz1 + 0.5], [L1, 13, hz1 + 0.5]];
  const tri = (a: number, c: number, d: number) => [a, c, d].flatMap((k) => [pts[k][0], D0 + pts[k][1], pts[k][2]]);
  roofG.setAttribute("position", new THREE.Float32BufferAttribute([...tri(0, 3, 2), ...tri(0, 2, 1), ...tri(4, 5, 2), ...tri(4, 2, 3)], 3));
  roofG.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 0, 3, 8, 3, 0, 0, 8, 3, 8, 0, 0, 0, 8, 0, 8, 3, 0, 0, 8, 3, 0, 3], 2));
  roofG.computeVertexNormals();
  b.add(roofG, slate);
  b.add(boxGeo(V(hx0, D0 + 13, hz0), V(hx0 + 0.6, D0 + 13 + rh, hz1), 2), stoneW); b.add(boxGeo(V(hx1 - 0.6, D0 + 13, hz0), V(hx1, D0 + 13 + rh, hz1), 2), stoneW);
  void hw;
  tower(b, hx0 + 3, hz1 + 1, 6, 20, stoneW, slate);
  tower(b, hx1 - 3, hz1 + 1, 6, 20, stoneW, slate);
  b.build(root);

  // ---- the palace, whole: the riverside row and the second row (houses face the river), two towers ----
  const intact = new THREE.Group(), ruin = new THREE.Group();
  setSightLines([]);
  PAL_Z.forEach((z, i) => house(b, PAL_X, z, Math.PI / 2, 13, 10, [9.8, 12, 11, 12, 9.8, 11][i], [2, 0, 2, 3, 0, 2][i], D0));
  PAL2_Z.forEach((z, i) => house(b, PAL2_X, z, -Math.PI / 2, 13, 10, [12, 13, 12, 13, 12][i], [0, 3, 0, 1, 3][i], D0));
  tower(b, 22, -60, 6, 22, stoneW, slate);
  tower(b, 22, 32, 6, 24, stoneW, slate);
  b.build(intact);
  // ---- the palace, burnt: open shells of blackened walls on the same footprints, the towers as stumps ----
  const charM = lam("charred", () => ({ color: "#5a5052" })), ashM = lam("ash", () => ({ color: "#5d5552" }));
  PAL_Z.forEach((z) => shell(b, r, PAL_X, z, 10, 13, 7.5, charM));
  PAL2_Z.forEach((z) => shell(b, r, PAL2_X, z, 10, 13, 8.5, charM));
  b.add(boxGeo(V(19, D0, -63), V(25, D0 + 9, -57), 2), charM);
  b.add(boxGeo(V(19, D0, 29), V(25, D0 + 6, 35), 2), charM);
  heap(b, ashM, 7, PAL_X, D0, -15, 120, 18, 1.2);
  b.build(ruin);
  root.add(intact, ruin);

  // ---- the yard: the treasury table (chequered cloth), the two carts of sticks, the pub across the yard ----
  const [tx, ty, tz] = TABLE;
  b.add(boxGeo(V(tx - 1.3, ty + 0.78, tz - 1.2), V(tx + 1.3, ty + 0.86, tz - 0.1), 1), cloth);
  for (const [dx, dz] of [[-1.2, -1.1], [1.1, -1.1], [-1.2, -0.25], [1.1, -0.25]]) b.add(boxGeo(V(tx + dx, ty, tz + dz), V(tx + dx + 0.1, ty + 0.78, tz + dz + 0.1), 1), dark);
  cart(b, CART1, 11, wood, dark, sticks);
  cart(b, CART2, 12, wood, dark, sticks);
  house(b, PUB[0], PUB[2], Math.PI / 2, 10, 8, 8.4, 0, D0);
  house(b, PUB[0], PUB[2] - 13, Math.PI / 2, 12, 8, 9.8, 3, D0);
  house(b, PUB[0], PUB[2] + 12, Math.PI / 2, 10, 8, 8.4, 3, D0);
  b.add(boxGeo(V(PUB[0] + 4, D0 + 3.4, PUB[2] + 1.9), V(PUB[0] + 5.6, D0 + 3.48, PUB[2] + 1.98), 1), dark); // the sign's iron bracket
  setSightLines(rays);
  for (let i = 0; i < 6; i++) house(b, -60 - 12 * i, -40 + 18 * (i % 4), Math.PI / 2, 10, 8, pick([8.4, 9.8, 7]), pick([0, 1, 2, 3]), D0);

  // ---- east bank: trees and houses along the far shore ----
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round"];
  for (let i = 0; i < 26; i++) house(b, RIVER_X1 + 16 + (i % 2) * 12, -160 + i * 14, -Math.PI / 2, 10, 8, pick([8.4, 9.8, 7]), pick([0, 1, 2, 3]), D0);
  for (let i = 0; i < 60; i++) { const x = RIVER_X1 + 40 + r() * 200, z = -300 + r() * 600; prop(b, kit, pick(trees), x, D0, z, 7 + r() * 5, r() * 6); }
  for (let i = 0; i < 50; i++) { const x = -60 - r() * 260, z = -300 + r() * 600; prop(b, kit, pick(trees), x, D0, z, 7 + r() * 5, r() * 6); }
  for (let i = 0; i < 5; i++) prop(b, kit, "canoe", RIVER_X0 + 14 + r() * 70, WATER_Y, -40 + r() * 90, 0.9, r() * 0.6);
  setSightLines([]);

  // ---- the cellar: stone floor, brick back and side walls, two furnaces with flues, heaps of sticks ----
  const [cx, , cz] = CELLAR, nb = new Batch();
  b.add(boxGeo(V(cx - 6.5, D0, cz - 5.4), V(cx + 6.5, D0 + 0.08, cz + 6), 2), lam("cellarFloor", () => ({ map: stone("cellarFloor", ["#9c9384", "#8e8576", "#a59c8c", "#958c7c"]) })));
  b.add(boxGeo(V(cx - 6.5, D0, cz - 5.4), V(cx + 6.5, D0 + 7, cz - 5.0), 2), brickM);
  b.add(boxGeo(V(cx - 6.5, D0, cz - 5.0), V(cx - 6.1, D0 + 7, cz + 6), 2), brickM);
  nb.add(boxGeo(V(cx + 6.1, D0, cz - 5.0), V(cx + 6.5, D0 + 7, cz + 6), 2), brickM);
  for (const fx of FURN_X) {
    b.add(boxGeo(V(cx + fx - 1.0, D0 + 0.08, cz - 5.0), V(cx + fx + 1.0, D0 + 2.0, cz - 3.6), 1), brickM);
    b.add(boxGeo(V(cx + fx - 0.55, D0 + 0.08, cz - 3.62), V(cx + fx + 0.55, D0 + 1.25, cz - 3.58), 1), soot); // the mouth
    b.add(boxGeo(V(cx + fx - 0.45, D0 + 2.0, cz - 5.0), V(cx + fx + 0.45, D0 + 7, cz - 4.4), 1), brickM); // the flue
  }
  heap(b, sticks, 21, cx - 4.6, D0 + 0.08, cz - 1.6, 160, 1.3, 0.9);
  heap(b, sticks, 22, cx + 4.4, D0 + 0.08, cz - 2.2, 140, 1.2, 0.8);
  // ---- the Lords chamber: carpet, oak panelling, red benches, the tapestry ----
  const [hx, , hz] = CHAMBER;
  b.add(boxGeo(V(hx - 7.5, D0, hz - 6.4), V(hx + 7.5, D0 + 0.08, hz + 7), 2), carpet);
  b.add(boxGeo(V(hx - 7.5, D0, hz - 6.4), V(hx + 7.5, D0 + 7, hz - 6.0), 2), oak);
  b.add(boxGeo(V(hx - 7.5, D0, hz - 6.0), V(hx - 7.1, D0 + 7, hz + 7), 2), oak);
  nb.add(boxGeo(V(hx + 7.1, D0, hz - 6.0), V(hx + 7.5, D0 + 7, hz + 7), 2), oak);
  for (const s of [-1, 1]) {
    b.add(boxGeo(V(hx + s * 5.2 - 0.8, D0 + 0.08, hz - 4), V(hx + s * 5.2 + 0.8, D0 + 0.55, hz + 5), 1), bench);
    b.add(boxGeo(V(hx + s * 6.2 - 0.25, D0 + 0.08, hz - 4), V(hx + s * 6.2 + 0.25, D0 + 1.2, hz + 5), 1), bench);
  }
  b.add(boxGeo(V(hx + 2.2, D0 + 0.08, hz - 2.6), V(hx + 2.9, D0 + 1.1, hz - 2.0), 1), dark); // Black Rod's box
  const tap = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), new THREE.MeshBasicMaterial({ map: tapestry() }));
  tap.position.set(hx - 0.5, D0 + 3.9, hz - 5.97); root.add(tap);
  // ---- the corridor: stone floor and wall, the tall double door of the Lords ----
  const [kx, , kz] = CORRIDOR;
  b.add(boxGeo(V(kx - 5, D0, kz - 3.4), V(kx + 5, D0 + 0.08, kz + 5), 2), lam("corrFloor", () => ({ map: stone("corrFloor", ["#b7ab90", "#ab9f85", "#c1b59a", "#a59a80"]) })));
  b.add(boxGeo(V(kx - 5, D0, kz - 3.4), V(kx - 1.35, D0 + 5.5, kz - 3.0), 2), stoneW);
  b.add(boxGeo(V(kx + 1.35, D0, kz - 3.4), V(kx + 5, D0 + 5.5, kz - 3.0), 2), stoneW);
  b.add(boxGeo(V(kx - 1.35, D0 + 3.3, kz - 3.4), V(kx + 1.35, D0 + 5.5, kz - 3.0), 2), stoneW);
  b.add(boxGeo(V(kx - 1.2, D0 + 0.2, kz - 3.3), V(kx - 0.02, D0 + 3.3, kz - 3.15), 1), oak);
  b.add(boxGeo(V(kx + 0.02, D0 + 0.2, kz - 3.3), V(kx + 1.2, D0 + 3.3, kz - 3.15), 1), oak);
  b.add(boxGeo(V(kx - 1.2, D0 + 0.08, kz - 3.4), V(kx + 1.2, D0 + 0.2, kz - 3.32), 1), lam("doorGap", () => ({ color: "#1c1416" })));
  b.add(boxGeo(V(kx - 1.35, D0 + 0.08, kz - 3.1), V(kx - 1.2, D0 + 3.4, kz - 2.95), 1), dark);
  b.add(boxGeo(V(kx + 1.2, D0 + 0.08, kz - 3.1), V(kx + 1.35, D0 + 3.4, kz - 2.95), 1), dark);
  b.add(boxGeo(V(kx - 1.35, D0 + 3.3, kz - 3.1), V(kx + 1.35, D0 + 3.45, kz - 2.95), 1), dark);
  b.add(boxGeo(V(kx - 5, D0, kz - 3.0), V(kx - 4.6, D0 + 5.5, kz + 5), 2), stoneW);
  // ---- the garden: a table before a cottage ----
  const [gx, , gz] = GARDEN;
  house(b, gx - 1, gz - 9, 0, 9, 7, 7, 0, D0);
  b.add(boxGeo(V(gx - 0.9, D0 + 0.74, gz - 0.55), V(gx + 0.9, D0 + 0.8, gz + 0.5), 1), wood);
  for (const [dx, dz] of [[-0.82, -0.48], [0.74, -0.48], [-0.82, 0.38], [0.74, 0.38]]) b.add(boxGeo(V(gx + dx, D0, gz + dz), V(gx + dx + 0.08, D0 + 0.74, gz + dz + 0.08), 1), post);
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = 14 + r() * 30, x = gx + Math.cos(a) * d, z = gz + Math.sin(a) * d;
    if (z > gz + 3) continue;
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x, D0, z, 6 + r() * 4, r() * 6);
  }
  b.build(root);
  nb.build(root, false); // the rooms' sun-side walls cast no shadow into the rooms
  setSightLines([]);
  return { intact, ruin };
};
