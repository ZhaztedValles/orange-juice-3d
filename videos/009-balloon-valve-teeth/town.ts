// The places of the balloon story: the Wolverhampton gasworks yard (cobbles, brick works houses, the round iron
// gasholder in its frame of columns, a fence for the crowd), farm fields with hedges and trees all around, and the
// cottage garden at sunset with its bench (the pillows are a drawing in cast.ts). The balloon, its ropes, the clouds
// and the cast live in world.ts / cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, cobble, planks, beam } from "../../src/engine/paint";
import { D0, YARD, GASHOLDER, PIL } from "./story";

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(91);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const yard = lam("yardCobble", () => ({ map: cobble() }));
  const iron = lam("gasIron", () => ({ color: "#4f5560" }));
  const ironDk = lam("gasIronDk", () => ({ color: "#3a3e48" }));
  const wood = lam("fenceWood", () => ({ map: planks() }));
  const post = lam("fencePost", () => ({ map: beam() }));

  // ---- the gasworks yard: a cobbled square abutting the grass (raised 8 cm, never a stacked ground plane) ----
  b.add(boxGeo(V(YARD[0] - 40, D0 - 0.2, YARD[2] - 44), V(YARD[0] + 40, D0 + 0.08, YARD[2] + 30), 2), yard);
  // the gasholder: a squat iron drum in a ring of columns with a girder at the top (built before the sight lines: shot 3 looks at it)
  setSightLines([]);
  const drum = new THREE.CylinderGeometry(12, 12, 9, 40, 1, true);
  drum.translate(GASHOLDER[0], D0 + 4.5, GASHOLDER[2]);
  b.add(drum, iron);
  const lid = new THREE.CylinderGeometry(11.6, 12, 0.6, 40);
  lid.translate(GASHOLDER[0], D0 + 9.2, GASHOLDER[2]);
  b.add(lid, ironDk);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, x = GASHOLDER[0] + Math.cos(a) * 13, z = GASHOLDER[2] + Math.sin(a) * 13;
    b.add(boxGeo(V(x - 0.3, D0, z - 0.3), V(x + 0.3, D0 + 13, z + 0.3), 2), ironDk);
  }
  for (let i = 0; i < 12; i++) { // the top girder ring, as straight pieces between the columns
    const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2;
    const g = new THREE.BoxGeometry(2 * 13 * Math.sin(Math.PI / 12), 0.5, 0.4);
    g.rotateY(-(a0 + a1) / 2 + Math.PI / 2);
    g.translate(GASHOLDER[0] + Math.cos((a0 + a1) / 2) * 13 * Math.cos(Math.PI / 12), D0 + 12.8, GASHOLDER[2] + Math.sin((a0 + a1) / 2) * 13 * Math.cos(Math.PI / 12));
    b.add(g, ironDk);
  }
  // the works houses round the yard (the far sides; the near side stays open for the lens)
  house(b, YARD[0] + 12, YARD[2] - 30, 0, 14, 9, 9.8, 2, D0 + 0.08);
  house(b, YARD[0] + 28, YARD[2] - 26, 0, 10, 8, 8.4, 1, D0 + 0.08);
  house(b, YARD[0] - 36, YARD[2] - 6, Math.PI / 2, 12, 8, 9.8, 2, D0 + 0.08);
  house(b, YARD[0] + 34, YARD[2] - 8, -Math.PI / 2, 9, 8, 8.4, 4, D0 + 0.08);
  // a tall brick chimney stack of the works
  const brick = lam("stackBrick", () => ({ color: "#8a4a38" }));
  b.add(boxGeo(V(YARD[0] + 22, D0, YARD[2] - 40), V(YARD[0] + 24.4, D0 + 26, YARD[2] - 37.6), 2), brick);
  setSightLines(rays);
  // the rope fence that keeps the crowd back
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (0.05 + 0.9 * (i / 15)), x = YARD[0] + Math.cos(a) * 9, z = YARD[2] + Math.sin(a) * 9 - 1;
    b.add(boxGeo(V(x - 0.06, D0 + 0.08, z - 0.06), V(x + 0.06, D0 + 1.0, z + 0.06), 2), post);
  }
  void wood;

  // ---- the cottage garden at sunset: a cottage behind, a garden bench, a low hedge ----
  setSightLines([]);
  house(b, PIL[0] - 1.5, PIL[2] - 9, 0, 9, 7, 7, 0, D0);
  b.add(boxGeo(V(PIL[0] - 1.1, D0 + 0.42, PIL[2] - 0.45), V(PIL[0] + 0.7, D0 + 0.52, PIL[2] + 0.35), 2), wood); // the bench seat
  for (const [dx, dz] of [[-1.0, -0.38], [0.6, -0.38], [-1.0, 0.28], [0.6, 0.28]]) b.add(boxGeo(V(PIL[0] + dx - 0.05, D0, PIL[2] + dz - 0.04), V(PIL[0] + dx + 0.05, D0 + 0.42, PIL[2] + dz + 0.04), 2), post);
  setSightLines(rays);
  for (let i = 0; i < 18; i++) {
    const a = r() * Math.PI * 2, d = 14 + r() * 40, x = PIL[0] + Math.cos(a) * d, z = PIL[2] + Math.sin(a) * d;
    if (z > PIL[2] + 3) continue;
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x, D0, z, 6 + r() * 4, r() * 6);
  }

  // ---- fields all round: hedgerows of bushes and trees, cottages far off (seen from the balloon at sunset) ----
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round"];
  for (let i = 0; i < 140; i++) {
    const a = r() * Math.PI * 2, d = 45 + r() * 260;
    prop(b, kit, pick(trees), Math.cos(a) * d, D0, Math.sin(a) * d, 7 + r() * 6, r() * 6);
  }
  for (let i = 0; i < 10; i++) {
    const a = r() * Math.PI * 2, d = 70 + r() * 160;
    house(b, Math.cos(a) * d, Math.sin(a) * d, r() * Math.PI, 8, 7, 7, pick([0, 1, 3]), D0);
  }
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" }))];
  ([[-300, -520, 240, 40, 120], [260, -560, 260, 46, 140], [700, 200, 200, 40, 160], [200, 900, 260, 44, 140]] as const)
    .forEach(([x, zz, sx, sy, sz], i) => b.add(hill, hm[i % 2], new THREE.Matrix4().compose(V(x, D0 - 2, zz), new THREE.Quaternion(), V(sx, sy, sz))));
  b.build(root);
  setSightLines([]);
};
