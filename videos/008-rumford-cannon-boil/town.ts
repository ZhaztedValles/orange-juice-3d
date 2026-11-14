// The places of the Rumford story: the cobbled yard of the Munich arsenal, ringed by its workshops and storehouses
// (painted terraces with a long shed roof), the row of finished brass guns on their carriages; a Munich street of
// plaster and brick houses for the cold-morning analogy. The boring machine, the box, the steam and the cast live in
// world.ts / cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, cobble, beam } from "../../src/engine/paint";
import { D0, ROW, NGUN, MOR } from "./story";

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1798);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const stone = lam("curb", () => ({ color: "#a29a8c" }));
  const road = lam("yardCobble", () => ({ map: cobble() }));
  const yard = lam("yardEarth", () => ({ color: "#a8977a" }));
  const walk = lam("walk", () => ({ color: "#b9ae9c" }));
  const wood = lam("carriageWood", () => ({ color: "#8a5a34" }));
  const iron = lam("gunIron", () => ({ color: "#3a383e" }));
  const brass = lam("gunBrass", () => ({ color: "#c49a48" }));
  const post = lam("shedPost", () => ({ map: beam() }));
  const roofM = lam("shedRoof", () => ({ color: "#8a5a46" }));

  // ---- the arsenal yard: one cobbled square (it abuts the grass, never stacked on it) ----
  b.add(boxGeo(V(-34, D0 - 0.2, -30), V(36, D0 + 0.08, 22), 2), yard);
  // the row of finished guns on the north side, with the shed roof over them (built first: shot 2 looks at them)
  setSightLines([]);
  for (let i = 0; i < NGUN; i++) {
    const x = ROW[0] + (i - (NGUN - 1) / 2) * 3.0, z = ROW[2];
    // carriage cheeks, axle, two spoked wheels, the trail on the ground
    for (const sx of [-0.32, 0.32]) b.add(boxGeo(V(x + sx - 0.07, D0 + 0.35, z - 1.4), V(x + sx + 0.07, D0 + 1.0, z + 0.5), 2), wood);
    b.add(boxGeo(V(x - 0.1, D0 + 0.02, z - 2.6), V(x + 0.1, D0 + 0.4, z - 1.2), 2), wood);
    b.add(boxGeo(V(x - 0.7, D0 + 0.5, z - 0.05), V(x + 0.7, D0 + 0.6, z + 0.05), 2), iron);
    for (const sx of [-0.62, 0.62]) {
      const w = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 20); w.rotateZ(Math.PI / 2); w.translate(x + sx, D0 + 0.6, z);
      b.add(w, wood);
      const hub = new THREE.CylinderGeometry(0.14, 0.14, 0.16, 10); hub.rotateZ(Math.PI / 2); hub.translate(x + sx * 1.04, D0 + 0.6, z);
      b.add(hub, iron);
    }
    // the brass barrel: tapered tube, muzzle ring and breech knob
    const g = new THREE.CylinderGeometry(0.17, 0.25, 2.4, 18); g.rotateX(Math.PI / 2); g.translate(x, D0 + 1.12, z - 0.1);
    b.add(g, brass);
    const ring = new THREE.CylinderGeometry(0.21, 0.21, 0.14, 18); ring.rotateX(Math.PI / 2); ring.translate(x, D0 + 1.12, z + 1.08);
    b.add(ring, brass);
    const knob = new THREE.SphereGeometry(0.12, 12, 8); knob.translate(x, D0 + 1.12, z - 1.4);
    b.add(knob, brass);
  }
  // the long open shed behind the guns: posts and a lean-to roof
  for (let i = 0; i <= 6; i++) { const x = ROW[0] - 9.5 + i * (19 / 6); b.add(boxGeo(V(x - 0.14, D0, ROW[2] - 4.6), V(x + 0.14, D0 + 4.2, ROW[2] - 4.32), 2), post); }
  b.add(boxGeo(V(ROW[0] - 10, D0 + 4.2, ROW[2] - 9), V(ROW[0] + 10, D0 + 4.4, ROW[2] - 4.1), 2), roofM);
  setSightLines(rays);
  // ---- the arsenal buildings round the yard ----
  const ring = (cx: number, cz: number, half: number, styles: number[]) => {
    for (const [nx, nz, yaw] of [[0, -1, 0], [0, 1, Math.PI], [-1, 0, Math.PI / 2], [1, 0, -Math.PI / 2]] as const) {
      let s = -half + 3;
      while (s < half - 3) {
        const w = pick([7, 8, 9]);
        const along = s + w / 2;
        const x = nx ? cx + nx * (half + 4) : cx + along, z = nz ? cz + nz * (half + 4) : cz + along;
        house(b, x, z, yaw, w, 8, pick([9.8, 9.8, 8.4]), pick(styles), D0 + 0.08);
        s += w + 0.15;
      }
    }
  };
  ring(1, -4, 27, [1, 2, 4, 5]);
  // a few hand carts and timber stacks along the yard walls
  for (const [x, z] of [[-22, 12], [24, 10], [-24, -18]]) for (let k = 0; k < 4; k++) b.add(boxGeo(V(x - 1.6, D0 + k * 0.24, z - 0.5 + (k % 2) * 0.1), V(x + 1.6, D0 + 0.22 + k * 0.24, z + 0.5), 2), wood);

  // ---- the Munich street of the analogy (along x through MOR) ----
  const x0 = MOR[0], z0 = MOR[2], len = 140;
  b.add(boxGeo(V(x0 - len / 2, D0 - 0.2, z0 - 4.5), V(x0 + len / 2, D0 + 0.08, z0 + 4.5), 2), road);
  for (const sz of [-1, 1]) {
    b.add(boxGeo(V(x0 - len / 2, D0 - 0.2, sz < 0 ? z0 - 8.4 : z0 + 4.5), V(x0 + len / 2, D0 + 0.18, sz < 0 ? z0 - 4.5 : z0 + 8.4), 2), walk);
    b.add(boxGeo(V(x0 - len / 2, D0 - 0.2, sz < 0 ? z0 - 4.6 : z0 + 4.4), V(x0 + len / 2, D0 + 0.22, sz < 0 ? z0 - 4.4 : z0 + 4.6), 2), stone);
    let x = x0 - len / 2 + 2;
    while (x < x0 + len / 2 - 4) {
      const w = pick([6, 7, 8]);
      house(b, x + w / 2, z0 + sz * 12.4, sz < 0 ? 0 : Math.PI, w, 8, pick([9.8, 9.8, 8.4]), pick([0, 1, 2, 3, 5]), D0 + 0.12);
      x += w + 0.15;
    }
    for (let lx = x0 - len / 2 + 6; lx < x0 + len / 2; lx += 14) prop(b, kit, "lantern", lx, D0 + 0.12, z0 + sz * 5.0, 3.0);
  }

  // trees and low hills far off
  const trees = ["tree_oak", "tree_default", "tree_cone", "tree-high-round"];
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = 70 + r() * 200;
    for (const [cx, cz] of [[0, 0], [MOR[0], MOR[2] - 30]] as const) {
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (cx === MOR[0] && Math.abs(z - cz) < 30) continue;
      prop(b, kit, pick(trees), x, D0, z, 10 + r() * 6, r() * 6);
    }
  }
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" }))];
  ([[-300, -520, 240, 40, 120], [260, -560, 260, 46, 140], [700, 200, 200, 40, 160], [200, 600, 260, 44, 140], [-500, 200, 220, 40, 150]] as const)
    .forEach(([x, zz, sx, sy, sz], i) => b.add(hill, hm[i % 2], new THREE.Matrix4().compose(V(x, D0 - 2, zz), new THREE.Quaternion(), V(sx, sy, sz))));
  b.build(root);
  setSightLines([]);
};
