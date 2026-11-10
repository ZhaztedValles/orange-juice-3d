// Scarp: crofter cottages along the bluff, rows of houses and trees inland, hills at the back. The rocket, its rail and the
// letters live in world.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray } from "../../src/engine/build";
import { rng } from "../../src/engine/paint";
import { D0, SNOW } from "./story";

const inCorridor = (x: number, z: number) => Math.abs(x) < 46 && z < -26 && z > -150;
const inSnow = (x: number, z: number) => Math.hypot(x - SNOW[0], z - SNOW[2]) < 34;

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(23);
  setSightLines(rays);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  // cottages along the bluff, both sides of the beach
  for (const sx of [-1, 1]) {
    let x = 30;
    while (x < 190) {
      const w = pick([7, 9]), h = pick([7, 8.4]);
      house(b, sx * (x + w / 2), -42 - r() * 3, 0, w, 8, h, Math.floor(r() * 8));
      x += w + 1 + r() * 3;
    }
    // inland rows (outside the track corridor and the snow patch)
    for (const zf of [-66, -84, -104, -126, -152]) {
      let x2 = 49 + r() * 6;
      while (x2 < 210) {
        const w = pick([7, 9]), h = pick([7, 8.4, 9.8]), cx = sx * (x2 + w / 2), cz = zf - r() * 4;
        if (r() > 0.15 && !inSnow(cx, cz)) house(b, cx, cz, 0, w, 8, h, Math.floor(r() * 8));
        x2 += w + 1.5 + r() * 5;
      }
    }
  }
  // a row at the very back, behind the track corridor
  for (let x = -60; x < 60; x += 10 + r() * 3) house(b, x, -172 - r() * 6, 0, 9, 8, pick([8.4, 9.8]), Math.floor(r() * 8));
  // hills behind
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" })), lam("hillC", () => ({ color: "#8bbf63" }))];
  ([[-380, -420, 220, 46, 120], [60, -520, 260, 58, 140], [420, -380, 200, 48, 130], [-560, -200, 190, 40, 150], [620, -120, 170, 38, 120]] as const)
    .forEach(([x, z, sx, sy, sz], i) => b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(x, D0 - 2, z), new THREE.Quaternion(), V(sx, sy, sz))));
  // trees
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
  for (let i = 0; i < 150; i++) {
    const x = (r() - 0.5) * 440, z = -(60 + r() * 260);
    if (inCorridor(x, z) || inSnow(x, z)) continue;
    prop(b, kit, pick(trees), x, D0, z, 7 + r() * 4, r() * 6);
  }
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI, d = 300 + r() * 160;
    prop(b, kit, pick(["tree_cone", "tree_default", "tree_oak"]), Math.cos(a) * d * 1.3, D0, -Math.sin(a) * d, 12 + r() * 6, r() * 6);
  }
  // the snow patch is ringed with cone trees
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, d = 24 + r() * 6;
    prop(b, kit, "tree_cone", SNOW[0] + Math.cos(a) * d, D0, SNOW[2] + Math.sin(a) * d, 9 + r() * 4, r() * 6);
  }
  for (let i = 0; i < 18; i++) {
    const f = pick(["flower_redA", "flower_yellowA", "flower_purpleA"]);
    prop(b, kit, f, 24 + r() * 26, D0, -32 - r() * 2, 0.5);
    prop(b, kit, f, -24 - r() * 26, D0, -32 - r() * 2, 0.5);
  }
  prop(b, kit, "canoe", 40, 0.02, 8, 0.7, 1.5); prop(b, kit, "canoe", -46, 0.02, 20, 0.7, -1.4);
  b.build(root);
  setSightLines([]);
};
