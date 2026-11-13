// The places of the horse-flu story: a New York street of brick and brownstone terraces with its horse-car track and a
// firehouse; the long stable (a row of stalls with half-doors under one lean-to roof); a white country schoolhouse in
// a meadow; a Boston street, the house where the fire starts, and the burnt blocks (charred walls, chimney stubs).
// The cars, the fire engine, the ropes, the smoke and the cast live in world.ts / cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, planks, beam, cobble } from "../../src/engine/paint";
import { D0, NY, FH, STB, NSTALL, STALL_W, stallX, SCH, BOS, BURN, RUIN } from "./story";

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(72);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const stone = lam("curb", () => ({ color: "#a29a8c" }));
  const road = lam("nyRoad", () => ({ map: cobble() }));
  const walk = lam("walk", () => ({ color: "#b9ae9c" }));
  const iron = lam("rail", () => ({ color: "#4a4850" }));
  const wood = lam("stableWood", () => ({ map: planks() }));
  const post = lam("stablePost", () => ({ map: beam() }));
  const roofM = lam("stableRoof", () => ({ color: "#7a5a46" }));
  const char = lam("charred", () => ({ color: "#3a3034" }));
  const ash = lam("ash", () => ({ color: "#8a8079" }));

  /** a street along x through z0: cobbled road (abutting the grass, never stacked on it), pavements, terraces both sides */
  const street = (x0: number, z0: number, len: number, rail: boolean, styles: number[], skip: (x: number, side: number) => boolean) => {
    b.add(boxGeo(V(x0 - len / 2, D0 - 0.2, z0 - 4.5), V(x0 + len / 2, D0 + 0.08, z0 + 4.5), 2), road);
    for (const sz of [-1, 1]) {
      b.add(boxGeo(V(x0 - len / 2, D0 - 0.2, sz < 0 ? z0 - 8.4 : z0 + 4.5), V(x0 + len / 2, D0 + 0.18, sz < 0 ? z0 - 4.5 : z0 + 8.4), 2), walk);
      b.add(boxGeo(V(x0 - len / 2, D0 - 0.2, sz < 0 ? z0 - 4.6 : z0 + 4.4), V(x0 + len / 2, D0 + 0.22, sz < 0 ? z0 - 4.4 : z0 + 4.6), 2), stone);
      let x = x0 - len / 2 + 2;
      while (x < x0 + len / 2 - 4) {
        const w = pick([6, 7, 8]);
        if (!skip(x + w / 2, sz)) house(b, x + w / 2, z0 + sz * 12.4, sz < 0 ? 0 : Math.PI, w, 8, pick([9.8, 9.8, 8.4]), pick(styles), D0 + 0.12);
        x += w + 0.15;
      }
      for (let lx = x0 - len / 2 + 6; lx < x0 + len / 2; lx += 14) prop(b, kit, "lantern", lx, D0 + 0.12, z0 + sz * 5.0, 3.0);
    }
    if (rail) for (const dz of [-0.72, 0.72]) b.add(boxGeo(V(x0 - len / 2, D0 + 0.06, z0 + dz - 0.04), V(x0 + len / 2, D0 + 0.13, z0 + dz + 0.04), 2), iron);
  };

  // the firehouse and the Boston street are built before the sight lines: those cameras look AT them
  setSightLines([]);
  // the firehouse: brick front with two tall red doors, the company's lamp
  house(b, FH[0], FH[2], 0, 10, 8, 9.8, 2, D0 + 0.12);
  const red = lam("fireDoor", () => ({ color: "#a8322c" }));
  for (const dx of [-2.3, 2.3]) b.add(boxGeo(V(FH[0] + dx - 1.6, D0 + 0.12, FH[2] + 4.0), V(FH[0] + dx + 1.6, D0 + 3.9, FH[2] + 4.12), 2), red);

  street(BOS[0], BOS[2], 150, false, [1, 2, 4, 5], (x, sz) => x > RUIN[0] - 34 && sz < 0);
  setSightLines(rays);
  // ---- New York: the horse-car street ----
  street(NY[0], NY[2], 240, true, [1, 2, 4, 5, 7], (x, sz) => sz < 0 && Math.abs(x - FH[0]) < 7.5);
  // ---- the stable: back wall, stall partitions, half-doors, posts and one long lean-to roof ----
  const L = NSTALL * STALL_W, x0 = STB[0] - L / 2, z = STB[2];
  b.add(boxGeo(V(x0 - 0.3, D0, z - 4.2), V(x0 + L + 0.3, D0 + 3.6, z - 3.9), 2), wood);
  for (let k = 0; k <= NSTALL; k++) {
    const x = x0 + k * STALL_W;
    b.add(boxGeo(V(x - 0.08, D0, z - 3.9), V(x + 0.08, D0 + 1.9, z), 2), wood);
    b.add(boxGeo(V(x - 0.14, D0, z - 0.14), V(x + 0.14, D0 + 3.3, z + 0.14), 2), post);
  }
  for (let k = 0; k < NSTALL; k++) b.add(boxGeo(V(stallX(k) - STALL_W / 2 + 0.16, D0, z - 0.05), V(stallX(k) + STALL_W / 2 - 0.16, D0 + 1.25, z + 0.05), 2), wood);
  b.add(boxGeo(V(x0 - 0.6, D0 + 3.3, z - 4.4), V(x0 + L + 0.6, D0 + 3.45, z + 0.9), 2), roofM);
  b.add(boxGeo(V(x0 - 0.3, D0 + 3.45, z - 4.4), V(x0 + L + 0.3, D0 + 4.2, z - 3.9), 2), roofM);
  // a straw floor in front, hay bales, the farm behind
  const straw = lam("straw", () => ({ color: "#d8b765" }));
  b.add(boxGeo(V(x0 - 1, D0 - 0.2, z - 3.9), V(x0 + L + 1, D0 + 0.08, z + 2.2), 2), straw);
  for (const [hx, hz] of [[x0 - 2.4, z + 1.2], [x0 + L + 2.0, z + 0.8], [x0 + L + 2.0, z + 2.0]]) b.add(boxGeo(V(hx - 0.6, D0, hz - 0.4), V(hx + 0.6, D0 + 0.7, hz + 0.4), 2), straw);
  house(b, STB[0] - 34, z - 14, 0, 10, 9, 8.4, 0, D0);
  house(b, STB[0] + 32, z - 16, 0, 12, 9, 8.4, 3, D0);

  // ---- the schoolhouse in its meadow, a fence and trees ----
  house(b, SCH[0], SCH[2] - 9.5, 0, 9, 8, 7, 0, D0);
  for (let i = -6; i <= 6; i++) b.add(boxGeo(V(SCH[0] + i * 2 - 0.05, D0, SCH[2] + 9.5), V(SCH[0] + i * 2 + 0.05, D0 + 1.0, SCH[2] + 9.6), 2), post);
  b.add(boxGeo(V(SCH[0] - 12, D0 + 0.75, SCH[2] + 9.5), V(SCH[0] + 12, D0 + 0.85, SCH[2] + 9.62), 2), post);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = 18 + r() * 60;
    const x = SCH[0] + Math.cos(a) * d, zz = SCH[2] + Math.sin(a) * d;
    if (zz > SCH[2] + 6 && Math.abs(x - SCH[0] - 6) < 18) continue; // the open ground in front of the lens
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_detailed", "tree_fat"]), x, D0, zz, 7 + r() * 5, r() * 6);
  }

  // ---- Boston: the street, the house where it starts, and the burnt blocks to the east ----
  const brick = lam("ruinBrick", () => ({ color: "#6a3a2e" })), rubble = lam("rubble", () => ({ color: "#4a4043" }));
  for (let i = 0; i < 46; i++) { // charred walls (L-shaped corners), brick chimney stubs, heaps of rubble on the ash
    const x = RUIN[0] - 28 + (i % 8) * 8 + r() * 2, zz = RUIN[2] - 22 + Math.floor(i / 8) * 8 + r() * 2;
    if (zz > BOS[2] - 9) continue;
    const h = 1.5 + r() * 4.5, w = 2.5 + r() * 3.5;
    b.add(boxGeo(V(x, D0, zz), V(x + w, D0 + h, zz + 0.7), 2), char);
    b.add(boxGeo(V(x, D0, zz - 2.5), V(x + 0.7, D0 + h * 0.7, zz), 2), char);
    if (r() < 0.6) b.add(boxGeo(V(x + w * 0.5, D0, zz - 2.2), V(x + w * 0.5 + 1.0, D0 + h + 2.5, zz - 1.2), 2), brick);
    b.add(boxGeo(V(x + 1, D0, zz - 3.2), V(x + 1 + 2.4 * r() + 1, D0 + 0.5 + 0.6 * r(), zz - 1.0), 2), rubble);
  }
  b.add(boxGeo(V(RUIN[0] - 32, D0 - 0.2, RUIN[2] - 30), V(RUIN[0] + 40, D0 + 0.08, BOS[2] - 8.4), 2), ash);
  void BURN;

  // trees and low hills far off
  const trees = ["tree_oak", "tree_default", "tree_cone", "tree-high-round"];
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, d = 120 + r() * 200;
    for (const [cx, cz] of [[NY[0], NY[2] - 50], [STB[0], STB[2] - 40]] as const) prop(b, kit, pick(trees), cx + Math.cos(a) * d, D0, cz - Math.abs(Math.sin(a)) * d, 10 + r() * 6, r() * 6);
  }
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" }))];
  ([[-300, -520, 240, 40, 120], [260, -560, 260, 46, 140], [700, 200, 200, 40, 160], [200, 900, 260, 44, 140]] as const)
    .forEach(([x, zz, sx, sy, sz], i) => b.add(hill, hm[i % 2], new THREE.Matrix4().compose(V(x, D0 - 2, zz), new THREE.Quaternion(), V(sx, sy, sz))));
  b.build(root);
  setSightLines([]);
};
