// The places of the first-flight story: the garden of the Chateau de la Muette (the chateau and its wings, clipped
// trees and the lawn), Paris from the air (paved blocks of houses on both banks of the Seine, two bridges) and the
// landing field with its two windmills (built here; their sails are posed in world.ts). The balloon, the clouds and
// the cast live in world.ts / cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, cobble, planks, beam } from "../../src/engine/paint";
import { D0, GROUND_GAL, GARDEN, PARIS, RIVER_Z, RIVER_W, FIELD, MILLS } from "./story";

/** the windmill sail hubs (world position, facing +z): world.ts hangs the turning sails on them */
export const HUBS: [number, number, number][] = MILLS.map(([x, , z]) => [x, D0 + 10.3, z + 2.7]);

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(57);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const paving = lam("parisPaving", () => ({ map: cobble() }));
  const water = lam("seineWater", () => ({ color: "#4f86b8" }));
  const quay = lam("quayStone", () => ({ color: "#a89f8e" }));
  const post = lam("fencePost", () => ({ map: beam() }));
  const wood = lam("benchWood", () => ({ map: planks() }));
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round"];

  // ---- the garden of La Muette: the chateau and two wings behind the lawn, rows of trees, a low fence ----
  const [GX, , GZ] = GARDEN;
  setSightLines(rays);
  house(b, GX - 4, GZ - 36, 0, 30, 12, 11.2, 0, D0);
  house(b, GX - 26, GZ - 30, Math.PI / 2, 14, 10, 9.8, 2, D0);
  house(b, GX + 18, GZ - 30, -Math.PI / 2, 14, 10, 9.8, 2, D0);
  for (let i = 0; i < 9; i++) { // two rows of clipped trees framing the lawn
    prop(b, kit, "tree-high-round", GX - 24, D0, GZ - 18 + 7 * i, 8.5, 0.3 * i);
    prop(b, kit, "tree-high-round", GX + 26, D0, GZ - 18 + 7 * i, 8.5, 0.3 * i + 1);
  }
  for (let i = 0; i < 22; i++) { // the fence that keeps the crowd off the launch lawn
    const a = Math.PI * (0.06 + 0.88 * (i / 21)), x = GX + Math.cos(a) * 7.5, z = GZ + Math.sin(a) * 7.5;
    b.add(boxGeo(V(x - 0.06, D0, z - 0.06), V(x + 0.06, D0 + 0.9, z + 0.06), 2), post);
  }
  // the launch trestles under the gallery
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2, x = GX + Math.cos(a) * 2.1, z = GZ + Math.sin(a) * 2.1;
    b.add(boxGeo(V(x - 0.1, D0, z - 0.1), V(x + 0.1, D0 + GROUND_GAL - 0.12, z + 0.1), 2), post);
  }
  // the stage of straw bales by the balloon (the brothers' fuel)
  const straw = lam("strawBale", () => ({ color: "#d9b45a" }));
  for (const [dx, dz] of [[3.6, -2.0], [4.4, -0.8], [3.9, -3.2]]) b.add(boxGeo(V(GX + dx - 0.5, D0, GZ + dz - 0.35), V(GX + dx + 0.5, D0 + 0.6, GZ + dz + 0.35), 2), straw);
  void wood;
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = 60 + r() * 140;
    prop(b, kit, pick(trees), GX + Math.cos(a) * d, D0, GZ + Math.sin(a) * d, 7 + r() * 5, r() * 6);
  }

  // ---- Paris: paved banks (raised 35 cm, abutting the river box: never stacked planes) with blocks of houses ----
  const [PX, , PZ] = PARIS, N = RIVER_Z - RIVER_W / 2, S = RIVER_Z + RIVER_W / 2;
  b.add(boxGeo(V(PX - 330, D0 - 0.3, PZ - 260), V(PX + 330, D0 + 0.35, N), 2), paving);
  b.add(boxGeo(V(PX - 330, D0 - 0.3, S), V(PX + 330, D0 + 0.35, PZ + 240), 2), paving);
  b.add(boxGeo(V(PX - 330, D0 - 0.3, N), V(PX + 330, D0 + 0.12, S), 0), water);
  for (const bx of [PX - 70, PX + 95]) { // two stone bridges
    b.add(boxGeo(V(bx - 5, D0 + 0.12, N - 1), V(bx + 5, D0 + 1.4, S + 1), 2), quay);
    for (let k = 0; k < 4; k++) { const z = N + 3 + (k * (RIVER_W - 6)) / 3; b.add(boxGeo(V(bx - 3, D0 - 0.2, z - 1.2), V(bx + 3, D0 + 1.4, z + 1.2), 2), quay); }
  }
  for (let ix = -16; ix <= 16; ix++) for (const side of [-1, 1]) for (let row = 0; row < 7; row++) {
    if (r() < 0.12) continue; // a few gaps: squares and gardens
    const x = PX + ix * 18 + (row % 2) * 5, z = side < 0 ? N - 9 - row * 22 : S + 9 + row * 22;
    const w = 11 + r() * 4, d = 8 + r() * 2, h = pick([7, 8.4, 9.8, 11.2]);
    house(b, x, z, side < 0 ? 0 : Math.PI, w, d, h, Math.floor(r() * 5), D0 + 0.35);
  }
  for (let i = 0; i < 36; i++) { // trees along the quays
    const x = PX - 300 + i * 17, side = i % 2 ? N - 3 : S + 3;
    prop(b, kit, "tree_default", x, D0 + 0.35, side, 6 + r() * 2, r() * 6);
  }

  // ---- the landing field: two windmills, hedges and trees round the edge ----
  const [FX, , FZ] = FIELD;
  setSightLines([]);
  const stone = lam("millStone", () => ({ color: "#e3d6bc" })), cap = lam("millCap", () => ({ color: "#7a5434" }));
  for (const [mx, , mz] of MILLS) {
    const tower = new THREE.CylinderGeometry(2.0, 2.8, 9, 18); tower.translate(mx, D0 + 4.5, mz); b.add(tower, stone);
    const roof = new THREE.ConeGeometry(2.5, 2.6, 18); roof.translate(mx, D0 + 10.3, mz); b.add(roof, cap);
    b.add(boxGeo(V(mx - 0.6, D0, mz + 2.3), V(mx + 0.6, D0 + 1.9, mz + 2.85), 2), cap); // the door
  }
  setSightLines(rays);
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, d = 46 + r() * 120, x = FX + Math.cos(a) * d, z = FZ + Math.sin(a) * d;
    prop(b, kit, pick(trees), x, D0, z, 7 + r() * 5, r() * 6);
  }
  for (let i = 0; i < 4; i++) house(b, FX - 90 + 60 * i, FZ - 120 - 20 * (i % 2), 0, 9, 7, 7, pick([0, 1, 3]), D0);
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" }))];
  ([[FX + 200, FZ - 420, 260, 40, 140], [FX - 260, FZ - 460, 240, 44, 130], [GX - 300, GZ - 420, 260, 40, 140]] as const)
    .forEach(([x, zz, sx, sy, sz], i) => b.add(hill, hm[i % 2], new THREE.Matrix4().compose(V(x, D0 - 2, zz), new THREE.Quaternion(), V(sx, sy, sz))));
  b.build(root);
  setSightLines([]);
};
