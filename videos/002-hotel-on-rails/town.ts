// The Brighton Beach seafront: cottages and stalls along the bluff, rows of houses and trees inland, hills at the back,
// promenade lanterns and a small pier. The hotel itself, the tracks and the locomotives live in world.ts.
import * as THREE from "three";
import { Batch, V, lam, boxGeo, prop, house, setSightLines, Kit, Ray } from "../../src/engine/build";
import { rng, ctex } from "../../src/engine/paint";
import { D0, SNOW } from "./story";

/** American flag (stripes + a blue canton with star dots) for the hotel's mast */
export const flagTex = () => ctex("flagStripes", 256, 160, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4f0e6" : "#c0353a"; g.fillRect(0, (i * 160) / 13, 256, 160 / 13 + 1); }
  g.fillStyle = "#2f4a8a"; g.fillRect(0, 0, 104, 86);
  g.fillStyle = "#f4f0e6";
  for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) { g.beginPath(); g.arc(14 + x * 19, 14 + y * 19, 3.4, 0, 7); g.fill(); }
});

const inCorridor = (x: number, z: number) => Math.abs(x) < 46 && z < -26 && z > -150;
const inSnow = (x: number, z: number) => Math.hypot(x - SNOW[0], z - SNOW[2]) < 34;

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(23);
  setSightLines(rays);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  // beach cottages along the bluff, both sides of the hotel's lot
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
  // promenade along the bluff: lanterns, stalls, carts, banners (outside the hotel's lot)
  for (const sx of [-1, 1]) {
    for (let x = 26; x <= 150; x += 12) prop(b, kit, "lantern", sx * x, D0, -32.5, 2.8);
    prop(b, kit, "banner-red", sx * 27, D0, -33, 3.6);
  }
  prop(b, kit, "stall-red", -30, D0, -34.5, 3.2); prop(b, kit, "stall-green", 31.5, D0, -34.8, 3.2, 0.1);
  prop(b, kit, "stall-bench", 28, D0, -31.6, 1.0); prop(b, kit, "cart", -33.5, D0, -33.0, 2.2, 0.8); prop(b, kit, "stall-bench", -27, D0, -31.5, 1.0);
  prop(b, kit, "windmill", 120, D0, -110, 16, -0.6);
  for (let i = 0; i < 18; i++) {
    const f = pick(["flower_redA", "flower_yellowA", "flower_purpleA"]);
    prop(b, kit, f, 24 + r() * 26, D0, -32 - r() * 2, 0.5);
    prop(b, kit, f, -24 - r() * 26, D0, -32 - r() * 2, 0.5);
  }
  // a pier into the sea
  const pw = lam("pierWood", () => ({ color: "#8a6a47" }));
  b.add(boxGeo(V(62, D0 + 0.3, -30), V(65, D0 + 0.5, 40), 2), pw);
  for (let z = -28; z < 40; z += 5) for (const sx of [62.2, 64.7]) b.add(boxGeo(V(sx - 0.15, 0, z - 0.15), V(sx + 0.15, D0 + 0.3, z + 0.15), 2), pw);
  prop(b, kit, "canoe", 40, 0.02, 8, 0.7, 1.5); prop(b, kit, "canoe", -46, 0.02, 20, 0.7, -1.4);
  b.build(root);
  setSightLines([]);
};
