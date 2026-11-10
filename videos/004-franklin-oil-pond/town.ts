// Clapham Common: villas and a church round the edge, trees, hedges and flowers on the grass, benches by the pond;
// and a London street of tall terraced houses for the city shot. The pond, the table and the ships live in world.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray } from "../../src/engine/build";
import { rng, ctex } from "../../src/engine/paint";
import { D0, POND, PRX, PRZ, LON, TAB, inPond } from "./story";

/** the 1707 Union flag (St George's cross over St Andrew's saltire) for the ship Franklin sails on */
export const flagTex = () => ctex("flagUnion1707", 256, 160, (g) => {
  g.fillStyle = "#24407a"; g.fillRect(0, 0, 256, 160);
  g.strokeStyle = "#f4f0e6"; g.lineWidth = 30; g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 160); g.moveTo(256, 0); g.lineTo(0, 160); g.stroke();
  g.fillStyle = "#f4f0e6"; g.fillRect(103, 0, 50, 160); g.fillRect(0, 55, 256, 50);
  g.fillStyle = "#c0353a"; g.fillRect(113, 0, 30, 160); g.fillRect(0, 65, 256, 30);
});

const nearTable = (x: number, z: number) => Math.hypot(x - TAB[0], z - TAB[2]) < 9;
/** ground points under high cameras (aerials) where a tree crown would fill the bottom of the frame */
const CAM_CLEAR: [number, number][] = [[52, -62], [46, -66], [-4, -74], [40, -70], [20, -80]];
const nearCam = (x: number, z: number) => CAM_CLEAR.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 26);
const nearLon = (x: number, z: number) => Math.abs(x - LON[0]) < 120 && Math.abs(z - LON[2]) < 60;

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(41);
  setSightLines(rays);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  // villas round the common, facing the pond
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + r() * 0.1, d = 92 + r() * 22;
    const x = POND[0] + Math.cos(a) * d * 1.25, z = POND[2] + Math.sin(a) * d;
    if (nearTable(x, z) || nearLon(x, z)) continue;
    house(b, x, z, -a - Math.PI / 2, pick([9, 11]), 9, pick([8.4, 9.8]), Math.floor(r() * 8), D0);
  }
  // the London street: two tall terraces facing each other across a cobbled road
  const cob = lam("lonRoad", () => ({ color: "#8c8578" }));
  b.add(new THREE.BoxGeometry(110, 0.04, 9).translate(LON[0], D0 + 0.02, LON[2]), cob);
  for (const sz of [-1, 1]) {
    let x = LON[0] - 50;
    while (x < LON[0] + 50) {
      const w = pick([6, 7, 8]);
      house(b, x + w / 2, LON[2] + sz * 9.5, sz < 0 ? 0 : Math.PI, w, 8, pick([9.8, 9.8, 8.4]), Math.floor(r() * 8), D0);
      x += w + 0.2;
    }
  }
  for (let x = LON[0] - 40; x < LON[0] + 40; x += 9) for (const sz of [-1, 1]) prop(b, kit, "lantern", x, D0, LON[2] + sz * 4.2, 2.8);
  // trees on the common (not in the pond, not on the table)
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
  for (let i = 0; i < 170; i++) {
    const a = r() * Math.PI * 2, d = 38 + r() * 160;
    const x = POND[0] + Math.cos(a) * d * 1.2, z = POND[2] + Math.sin(a) * d;
    if (inPond(x, z, 10) || nearTable(x, z) || nearLon(x, z) || nearCam(x, z)) continue;
    prop(b, kit, pick(trees), x, D0, z, 7 + r() * 5, r() * 6);
  }
  for (let i = 0; i < 50; i++) {
    const a = r() * Math.PI * 2, d = 260 + r() * 200;
    prop(b, kit, pick(["tree_cone", "tree_default", "tree_oak"]), POND[0] + Math.cos(a) * d, D0, POND[2] + Math.sin(a) * d, 12 + r() * 6, r() * 6);
  }
  // reeds, bushes and flowers on the bank; benches
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, k = 1.06 + r() * 0.12;
    const x = POND[0] + Math.cos(a) * PRX * k, z = POND[2] + Math.sin(a) * PRZ * k;
    if (Math.abs(Math.sin(a)) < 0.35) continue; // keep the east and west banks clear for Franklin
    prop(b, kit, pick(["grass_large", "grass", "flower_yellowA", "flower_redA"]), x, D0, z, 0.5 + r() * 0.5, r() * 6);
  }
  prop(b, kit, "stall-bench", 0, D0, POND[2] - PRZ - 4, 1.0); prop(b, kit, "stall-bench", -14, D0, POND[2] + PRZ + 4.5, 1.0, Math.PI);
  for (let i = 0; i < 8; i++) prop(b, kit, "hedge", TAB[0] - 14 + i * 2.2, D0, TAB[2] - 8, 1.3);
  // low hills far behind
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" })), lam("hillC", () => ({ color: "#8bbf63" }))];
  ([[-380, -520, 220, 40, 120], [60, -620, 260, 48, 140], [420, -480, 200, 42, 130], [-560, 200, 190, 36, 150], [-200, 520, 170, 34, 120]] as const)
    .forEach(([x, z, sx, sy, sz], i) => b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(x, D0 - 2, z), new THREE.Quaternion(), V(sx, sy, sz))));
  b.build(root);
  setSightLines([]);
};
