// The places of the balloon story: the royal garden of La Muette (a lawn with gravel paths, the cream chateau behind,
// hedges and trees all round), Paris (a grid of plaster and stone houses in blocks, the Seine between stone quays)
// and the landing field between two windmills. The ground is laid in abutting pieces, never stacked; the river lies
// below the quays. The balloon and the cast live in world.ts and cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, grassHD, stoneHD, water, rep } from "../../src/engine/paint";
import { D0, PAR, RIV0, RIV1, FIELD, PLAT } from "./story";

/** horizontal quad at y over x0..x1, z0..z1, split into cells (big quads lose fog on single frames) */
const flat = (x0: number, x1: number, z0: number, z1: number, y: number, tile: number, nx = 20, nz = 20) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
  g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * (x1 - x0)) / tile, (uv.getY(i) * (z1 - z0)) / tile);
  return g;
};

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1024);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const grass = lam("grassHD", () => ({ map: grassHD() }));
  const gravel = lam("gravel024", () => ({ map: stoneHD("gravel024", ["#d8ccb2", "#cfc2a6", "#e0d5bc", "#c8bba0"], "#b0a284") }));
  const quay = lam("quay024", () => ({ map: stoneHD("quay024", ["#b9ae9a", "#aea38f", "#c2b7a3", "#a59a86"], "#7f766a") }));
  const street = lam("street024", () => ({ map: stoneHD("street024", ["#a8a091", "#9e9688", "#b0a899"], "#7a7468") }));
  const riverM = lam("seine024", () => ({ map: rep(water(), 6, 6), color: "#c4d6e8" }));
  const [PX, , PZ] = PAR, [FX, , FZ] = FIELD;
  const PX0 = PX - 150, PX1 = PX + 150, PZ0 = PZ - 170;

  setSightLines([]);
  // ---- ground (abutting pieces): grass everywhere outside Paris and the river; Paris paved; the river below the quays ----
  b.add(flat(-900, 900, -900, PZ0, D0, 4, 60, 30), grass);
  b.add(flat(-900, PX0, PZ0, RIV0 - 6, D0, 4, 40, 10), grass);
  b.add(flat(PX1, 900, PZ0, RIV0 - 6, D0, 4, 20, 10), grass);
  b.add(flat(PX0, PX1, PZ0, RIV0 - 6, D0, 3, 40, 20), street);
  b.add(flat(-900, 900, RIV1 + 6, 900, D0, 4, 60, 30), grass);
  b.add(boxGeo(V(-900, D0 - 3, RIV0 - 6), V(900, D0, RIV0), 2), quay);
  b.add(boxGeo(V(-900, D0 - 3, RIV1), V(900, D0, RIV1 + 6), 2), quay);
  b.add(flat(-900, 900, RIV0, RIV1, D0 - 1.6, 8, 60, 3), riverM);
  // the garden: a gravel walk from the chateau to the launch spot, and the round gravel launch floor
  const disc = new THREE.CylinderGeometry(9, 9.3, PLAT + 0.2, 40); disc.translate(0, D0 + PLAT / 2 - 0.1, 0);
  b.add(disc, gravel);
  b.add(boxGeo(V(-3, D0 - 0.2, -52), V(3, D0 + 0.08, -9.2), 2), gravel);
  b.add(boxGeo(V(-3, D0 - 0.2, 9.2), V(3, D0 + 0.08, 40), 2), gravel);

  setSightLines(rays);
  // ---- the chateau of La Muette: a long cream front of tall houses, two wings ----
  for (let x = -30; x <= 30; x += 10) house(b, x, -62, 0, 10, 12, 11.2, x === 0 ? 3 : 0, D0);
  for (const s of [-1, 1]) for (let z = -52; z <= -40; z += 10) house(b, s * 38, z, -s * Math.PI / 2, 10, 12, 9.8, 0, D0);
  // hedges round the launch floor (a gap toward the camera side), trees round the lawn
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    if (Math.abs(Math.sin(a / 2)) < 0.25 || (a > 0.2 && a < 1.0)) continue;
    prop(b, kit, "hedge", 26 * Math.sin(a), D0, 26 * Math.cos(a) - 4, 1.3, -a);
  }
  for (let i = 0; i < 34; i++) {
    const a = r() * Math.PI * 2, d = 34 + r() * 30;
    const x = d * Math.sin(a), z = d * Math.cos(a) - 6;
    if (z > 8 && Math.abs(x) < 22) continue;
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat", "tree-high-round"]), x, D0, z, 9 + r() * 5, r() * 6);
  }
  // ---- Paris: blocks of houses along streets, the river and its quays left open ----
  for (let z = PZ0 + 8; z < RIV0 - 14; z += 19) {
    for (let x = PX0 + 6; x <= PX1 - 6; x += 9) {
      if ((Math.round((x - PX0) / 9) % 8) === 7) continue; // a cross street every eight houses
      house(b, x, z, 0, 8.8, 8, pick([9.8, 11.2, 11.2, 12.6]), pick([0, 3, 4, 6, 0, 7]), D0);
      house(b, x, z + 8.6, Math.PI, 8.8, 8, pick([9.8, 11.2, 12.6]), pick([0, 3, 4, 6, 1]), D0);
    }
  }
  for (let z = RIV1 + 16; z < RIV1 + 170; z += 19) {
    for (let x = PX0 + 6; x <= PX1 - 6; x += 9) {
      if ((Math.round((x - PX0) / 9) % 8) === 7) continue;
      house(b, x, z, 0, 8.8, 8, pick([9.8, 11.2, 12.6]), pick([0, 3, 4, 6, 0]), D0);
      house(b, x, z + 8.6, Math.PI, 8.8, 8, pick([9.8, 11.2]), pick([0, 3, 4, 6]), D0);
    }
  }
  for (let x = PX0 - 60; x <= PX1 + 60; x += 14) for (const z of [RIV0 - 9, RIV1 + 9]) prop(b, kit, pick(["tree_default", "tree_fat"]), x + r() * 3, D0, z, 7 + r() * 2, r() * 6);
  // ---- the landing field: two windmills behind, hedgerows, a few trees ----
  prop(b, kit, "windmill", FX - 17, D0, FZ - 14, 15, 0.4);
  prop(b, kit, "windmill", FX + 18, D0, FZ - 18, 15, -0.3);
  for (let i = 0; i < 14; i++) prop(b, kit, "hedge", FX - 46 + i * 7, D0, FZ - 36, 1.4, 0);
  for (let i = 0; i < 10; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), FX - 70 + r() * 140, D0, FZ - 48 - r() * 30, 8 + r() * 4, r() * 6);
  b.build(root);
  setSightLines([]);
  return {};
};
