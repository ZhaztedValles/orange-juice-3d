// Kiel in 1851: a cobbled quay along the harbour, a row of tall gabled merchants' houses behind it, lanterns, bollards,
// barrels and a cart; trees and hills behind the town. The water, the bed, the ships and the submarine live in world.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, cobbleHD, beam } from "../../src/engine/paint";
import { D0 } from "./story";

/** the Dannebrog: a white Nordic cross on red (the Danish flag of 1851) */
export const danishFlagTex = () => ctex("flagDannebrog", 256, 176, (g) => {
  g.fillStyle = "#c8202f"; g.fillRect(0, 0, 256, 176);
  g.fillStyle = "#f4f0e6"; g.fillRect(70, 0, 34, 176); g.fillRect(0, 71, 256, 34);
});

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(51);
  setSightLines(rays);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  // the quay and the streets: one cobbled ground slab, ending at the quay wall (x = -1.2)
  const cob = lam("kielCobble", () => ({ map: cobbleHD() }));
  b.add(boxGeo(V(-700, D0 - 1, -700), V(-1.2, D0, 700), 3), cob);
  // the quay edge: a dark coping stone
  b.add(boxGeo(V(-1.6, D0, -400), V(-1.2, D0 + 0.12, 400), 1), lam("coping", () => ({ color: "#8e8576" })));
  // bollards and barrels along the edge
  const iron = lam("bollard", () => ({ color: "#3a3d42" })), wood = lam("barrelWood", () => ({ map: beam() }));
  for (let z = -60; z <= 60; z += 9) b.add(new THREE.CylinderGeometry(0.17, 0.22, 0.65, 10).translate(-2.1, D0 + 0.32, z + 0.5), iron);
  for (const [x, z] of [[-11, 9], [-11.6, 10], [-10.8, 10.8], [-12, -12], [-11.3, -13], [-12.6, 16]] as const)
    b.add(new THREE.CylinderGeometry(0.33, 0.3, 0.85, 12).translate(x, D0 + 0.43, z), wood);
  // the merchants' houses: a terrace facing the harbour, a second row behind
  for (const [row, x0] of [[0, -18], [1, -34]] as const) {
    let z = -90;
    while (z < 90) {
      const w = pick([7, 8, 9]);
      house(b, x0, z + w / 2, -Math.PI / 2, w, 9, pick([8.4, 9.8, 9.8]) + row * 1.4, Math.floor(r() * 8), D0);
      z += w + 0.2;
    }
  }
  for (let z = -50; z < 50; z += 12) prop(b, kit, "lantern", -12.5, D0, z + 3, 2.8);
  prop(b, kit, "cart", -9, D0, -20, 1.6, 0.6);
  prop(b, kit, "stall-red", -13, D0, 22, 2.6, -Math.PI / 2);
  prop(b, kit, "stall-green", -13, D0, -28, 2.6, -Math.PI / 2);
  // trees and hills behind the town
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
  for (let i = 0; i < 90; i++) prop(b, kit, pick(trees), -50 - r() * 160, D0, -200 + r() * 400, 8 + r() * 6, r() * 6);
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" })), lam("hillC", () => ({ color: "#8bbf63" }))];
  ([[-420, -380, 220, 40, 160], [-520, 120, 260, 48, 180], [-380, 460, 200, 42, 150], [380, -560, 260, 30, 120], [420, 560, 260, 34, 120]] as const)
    .forEach(([x, z, sx, sy, sz], i) => b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(x, D0 - 3, z), new THREE.Quaternion(), V(sx, sy, sz))));
  b.build(root);
  setSightLines([]);
};
