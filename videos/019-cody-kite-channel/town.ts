// The land: fields (grass), the shingle beach and its slope into the sea, the white chalk cliffs of Dover with the town
// in the gap between them, the stone quay of Calais with its houses and lamps, the inland river banks, trees and hedges.
// The water itself, the boat, kites, ships and the cast live in world.ts / cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, grassHD, stoneHD } from "../../src/engine/paint";
import { D0, SHORE_Z0, SHORE_Z1, CALAIS, QUAY_Z, QUAY_Y, RIVER_X, RIVER_Z, FIELD } from "./story";

/** shingle: warm grey pebbles */
const shingleTex = () => ctex("shingle019", 256, 256, (g, r) => {
  g.fillStyle = "#bdb09a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 520; i++) {
    const c = ["#a99c86", "#cfc3ad", "#b3a690", "#c6b8a0", "#9e927e"][Math.floor(r() * 5) % 5];
    g.fillStyle = c; g.beginPath(); g.ellipse(r() * 256, r() * 256, 3 + r() * 5, 2 + r() * 4, r() * 3, 0, 7); g.fill();
  }
});
/** chalk: white with faint horizontal flint bands */
const chalkTex = () => ctex("chalk019", 256, 256, (g, r) => {
  g.fillStyle = "#ece8dc"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9; i++) { g.fillStyle = r() < 0.5 ? "#d9d3c4" : "#e3ddcf"; g.fillRect(0, 10 + i * 28 + r() * 6, 256, 2 + r() * 3); }
  for (let i = 0; i < 40; i++) { g.fillStyle = "#cfc8b8"; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 8 + r() * 30); }
});

/** horizontal quad at y over x0..x1, z0..z1, split into cells (big quads lose fog on single frames) */
const flat = (x0: number, x1: number, z0: number, z1: number, y: number, tile: number, nx = 30, nz = 30) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
  g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * (x1 - x0)) / tile, (uv.getY(i) * (z1 - z0)) / tile);
  return g;
};
/** the shingle slope from z0 (y0) down to z1 (y1) */
const slope = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, tile: number) => {
  const g = flat(x0, x1, z0, z1, 0, tile, 60, 4), p = g.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setY(i, y0 + ((y1 - y0) * (z - z0)) / (z1 - z0)); }
  g.computeVertexNormals();
  return g;
};

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1019);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const grass = lam("grassHD", () => ({ map: grassHD() }));
  const shingle = lam("shingle019", () => ({ map: shingleTex() }));
  const chalk = lam("chalk019", () => ({ map: chalkTex() }));
  const turf = lam("turf019", () => ({ color: "#6f9a52" }));
  const quayStone = lam("quay019", () => ({ map: stoneHD("quay019", ["#c9bda6", "#bcae96", "#d3c6ae", "#b4a68e"], "#8f8270") }));
  const earth = lam("bank019", () => ({ color: "#7b8f55" }));
  const dark = lam("bollard019", () => ({ color: "#2f2b33" }));

  setSightLines([]);
  // ---- ground: fields, shingle, the slope into the sea (abutting, never stacked) ----
  b.add(flat(-900, 900, -900, -40, D0, 4, 60, 30), grass);
  b.add(flat(-900, 900, -40, SHORE_Z0, D0, 3, 120, 4), shingle);
  b.add(slope(-900, 900, SHORE_Z0, SHORE_Z1, D0, D0 - 2.2, 3), shingle);
  // ---- Dover: two chalk cliffs with turf on top, the town in the gap ----
  for (const [x0, x1] of [[-300, -30], [62, 320]] as const) {
    b.add(boxGeo(V(x0, D0 - 0.2, -82), V(x1, D0 + 32, -46), 6), chalk);
    b.add(boxGeo(V(x0, D0 + 32, -82), V(x1, D0 + 32.7, -46), 6), turf);
  }
  // ---- Calais: the stone quay and its bollards ----
  b.add(boxGeo(V(CALAIS - 50, -2.0, -32), V(CALAIS + 50, QUAY_Y, QUAY_Z), 2), quayStone);
  for (const x of [-8, -2, 4, 10]) b.add(new THREE.CylinderGeometry(0.2, 0.25, 0.7, 10), dark, new THREE.Matrix4().makeTranslation(CALAIS + x, QUAY_Y + 0.35, QUAY_Z - 0.5));
  // ---- the river banks inland ----
  for (const s of [-1, 1]) b.add(boxGeo(V(RIVER_X - 130, D0, RIVER_Z + s * 7 - (s < 0 ? 2 : 0)), V(RIVER_X + 130, D0 + 0.45, RIVER_Z + s * 7 + (s > 0 ? 2 : 0)), 2), earth);

  setSightLines(rays);
  // Dover houses in the gap between the cliffs, fronts to the sea
  for (const x of [-22, -13, -4, 5, 14, 23, 32, 41, 50]) house(b, x, -34, 0, 8, 9, pick([7, 8.4, 9.8]), Math.floor(r() * 6), D0);
  for (const x of [-18, -6, 8, 20, 36]) house(b, x, -46, 0, 8, 9, pick([8.4, 9.8]), Math.floor(r() * 6), D0);
  // Calais houses behind the quay
  for (const x of [-36, -27, -18, -9, 0, 9, 18, 27, 36]) house(b, CALAIS + x, -24, 0, 8, 9, pick([7, 8.4, 9.8]), Math.floor(r() * 6), QUAY_Y);
  for (const x of [-3, 6]) prop(b, kit, "lantern", CALAIS + x, QUAY_Y, QUAY_Z - 1.4, 2.6, 0);
  // bushes on the cliff tops, trees inland, along the river and round the flying field
  for (let i = 0; i < 40; i++) prop(b, kit, pick(["plant_bush", "hedge"]), (r() < 0.5 ? -290 + r() * 250 : 70 + r() * 240), D0 + 32.7, -80 + r() * 30, 1.2 + r() * 1.2, r() * 6);
  for (let i = 0; i < 70; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat", "tree_cone"]), RIVER_X - 120 + r() * 240, D0, RIVER_Z - 14 - r() * 60, 8 + r() * 6, r() * 6);
  for (let i = 0; i < 30; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), RIVER_X - 120 + r() * 240, D0, RIVER_Z + 14 + r() * 30, 8 + r() * 6, r() * 6);
  for (let i = 0; i < 60; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat", "tree_cone"]), FIELD[0] - 140 + r() * 280, D0, FIELD[2] - 60 - r() * 80, 9 + r() * 6, r() * 6);
  for (let i = 0; i < 24; i++) prop(b, kit, "hedge", FIELD[0] - 60 + i * 5, D0, FIELD[2] - 50, 1.4, 0);
  b.build(root);
  setSightLines([]);
  return {};
};
