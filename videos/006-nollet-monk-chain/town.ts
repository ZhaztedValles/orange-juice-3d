// The places of the monk story: the monastery (a church-like hall and rows of cells round the far side of the meadow),
// trees and hedges round the ring, the monastery garden with its wall, a Paris street of tall terraced houses, and the
// long cream front of Versailles with its hedges. The ring, the wire, the hose and the tap live in world.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray } from "../../src/engine/build";
import { rng } from "../../src/engine/paint";
import { D0, RC, RR, PAR, GAR, VER, NG, guardP } from "./story";

const inRing = (x: number, z: number, m: number) => Math.hypot(x - RC[0], z - RC[2]) < RR + m;
const nearGar = (x: number, z: number) => Math.abs(x - GAR[0]) < 16 && Math.abs(z - GAR[2]) < 14;
const nearPar = (x: number, z: number) => Math.abs(x - PAR[0]) < 120 && Math.abs(z - PAR[2]) < 60;
const nearVer = (x: number, z: number) => Math.abs(x - VER[0]) < 120 && Math.abs(z - VER[2]) < 70;
/** the open meadow in front of the high cameras (aerials over the ring) stays free of tree crowns */
const CAM_CLEAR: [number, number][] = [[30, 2], [-34, -6], [24, -29], [14, -49], [32, -20]];
const nearCam = (x: number, z: number) => CAM_CLEAR.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 22);

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(46);
  setSightLines(rays);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  // the monastery: rows of monks' cells on the far (north) side of the meadow, facing the ring, and a tall hall
  for (let i = 0; i < 15; i++) {
    const a = -Math.PI / 2 + (i - 7) * 0.13, d = RR + 34 + (i % 2) * 3;
    const x = RC[0] + Math.cos(a) * d, z = RC[2] + Math.sin(a) * d;
    house(b, x, z, -a - Math.PI / 2, 8, 8, i === 7 ? 9.8 : 7, i === 7 ? 0 : [0, 3, 6][i % 3], D0);
  }
  house(b, RC[0] - 4, RC[2] - RR - 52, 0, 14, 10, 9.8, 6, D0);
  house(b, RC[0] + 14, RC[2] - RR - 50, 0, 9, 9, 8.4, 0, D0);
  // trees round the meadow (never inside the ring)
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
  for (let i = 0; i < 150; i++) {
    const a = r() * Math.PI * 2, d = RR + 16 + r() * 150;
    const x = RC[0] + Math.cos(a) * d, z = RC[2] + Math.sin(a) * d;
    if (inRing(x, z, 14) || nearGar(x, z) || nearPar(x, z) || nearVer(x, z) || nearCam(x, z)) continue;
    if (Math.sin(a) < -0.5 && d < RR + 45) continue; // the monastery's own ground
    prop(b, kit, pick(trees), x, D0, z, 7 + r() * 5, r() * 6);
  }
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, d = 280 + r() * 200;
    prop(b, kit, pick(["tree_cone", "tree_default", "tree_oak"]), RC[0] + Math.cos(a) * d, D0, RC[2] + Math.sin(a) * d, 12 + r() * 6, r() * 6);
  }
  // flowers and grass tufts on the meadow, outside the ring
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = RR + 3 + r() * 26;
    prop(b, kit, pick(["grass_large", "grass", "flower_yellowA", "flower_redA", "flower_purpleA"]), RC[0] + Math.cos(a) * d, D0, RC[2] + Math.sin(a) * d, 0.4 + r() * 0.4, r() * 6);
  }
  // the garden: cells behind the wall, a hedge and bushes
  for (let i = 0; i < 3; i++) house(b, GAR[0] - 6 + i * 9, GAR[2] - 13, 0, 8, 8, 7, [3, 0, 6][i], D0);
  for (let i = 0; i < 4; i++) prop(b, kit, "plant_bushLarge", GAR[0] - 5 + i * 2.6, D0, GAR[2] - 7.2, 1.1);
  prop(b, kit, "tree_oak", GAR[0] - 7, D0, GAR[2] - 3, 8);
  prop(b, kit, "tree_default", GAR[0] + 11, D0, GAR[2] - 9, 9);
  // the Paris street: two tall terraces facing each other across a cobbled road
  const cob = lam("parRoad", () => ({ color: "#8c8578" }));
  b.add(new THREE.BoxGeometry(110, 0.04, 9).translate(PAR[0], D0 + 0.02, PAR[2]), cob);
  for (const sz of [-1, 1]) {
    let x = PAR[0] - 50;
    while (x < PAR[0] + 50) {
      const w = pick([6, 7, 8]);
      house(b, x + w / 2, PAR[2] + sz * 9.5, sz < 0 ? 0 : Math.PI, w, 8, pick([9.8, 9.8, 8.4]), Math.floor(r() * 8), D0);
      x += w + 0.2;
    }
  }
  for (let x = PAR[0] - 40; x < PAR[0] + 40; x += 9) for (const sz of [-1, 1]) prop(b, kit, "lantern", x, D0, PAR[2] + sz * 4.2, 2.8);
  // Versailles: a long cream front behind the guards, hedges along the walk
  for (let i = 0; i < 9; i++) house(b, VER[0] - 44 + i * 11.2, VER[2] - 22, 0, 11, 10, 9.8, 0, D0);
  for (let i = 0; i < 7; i++) house(b, VER[0] - 33 + i * 11.2, VER[2] - 11, 0, 11, 6, 9.8, 0, D0);
  const back = guardP(NG + 2);
  for (let i = -6; i < 10; i++) prop(b, kit, "hedge", back[0] - 6 + i * 2.2, D0, back[2] - 2.2, 1.3);
  for (let i = 0; i < 6; i++) prop(b, kit, "tree_cone", VER[0] + 9 + i * 4, D0, VER[2] - 7, 5.5);
  // low hills far behind
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" })), lam("hillC", () => ({ color: "#8bbf63" }))];
  ([[-380, -520, 220, 40, 120], [60, -620, 260, 48, 140], [420, -480, 200, 42, 130], [-560, 200, 190, 36, 150], [-200, 560, 170, 34, 120]] as const)
    .forEach(([x, z, sx, sy, sz], i) => b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(x, D0 - 2, z), new THREE.Quaternion(), V(sx, sy, sz))));
  b.build(root);
  setSightLines([]);
};
