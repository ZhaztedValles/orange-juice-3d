// The places of the airship story: a Paris street of cream and sandstone houses with grey slate roofs, plane trees and
// lanterns, a pavement cafe under a striped awning; the airship shed at Neuilly (a tall plank shed, open at the front)
// on the grass, with a gravel road beside the park; the polo field at Bagatelle (white boards, two pairs of striped goal
// posts, a striped stand, trees round it, the little chateau far off); the parlour (an open-topped room: papered walls,
// a fireplace, a sofa, a table) and the dining room thirty years on (green panelled walls, a long table with a white
// cloth and candles). The airship, the cast and the drawn props live in world.ts and cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, cobble, planks, beam, stone } from "../../src/engine/paint";
import { D0, PAR, CAFE, FLD, POLO, PARL, DIN } from "./story";

/** the cafe awning: red and cream stripes */
const awningTex = () => ctex("awning015", 256, 128, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f1e6cc" : "#b8423a"; g.fillRect(i * 32, 0, 32, 128); }
  g.fillStyle = "#8a2e28"; g.fillRect(0, 112, 256, 16);
});
/** the stand's canvas: blue and white stripes */
const standTex = () => ctex("stand015", 256, 128, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f2efe6" : "#3f6fb5"; g.fillRect(i * 32, 0, 32, 128); }
});
/** gravel: warm grey-beige with small stones */
const gravelTex = () => ctex("gravel015", 512, 512, (g, r) => {
  g.fillStyle = "#c9b994"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "#b3a27c" : "#dacba6"; g.fillRect(r() * 512, r() * 512, 3 + r() * 5, 3 + r() * 4); }
});
/** the parlour wall: rose paper with a cream stripe above a brown dado */
const parlourWall = () => ctex("parWall015", 512, 512, (g) => {
  g.fillStyle = "#e2b6a4"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#ecc8b6"; for (let x = 16; x < 512; x += 64) g.fillRect(x, 0, 22, 330);
  g.fillStyle = "#6a4630"; g.fillRect(0, 330, 512, 182);
  g.fillStyle = "#58392a"; for (let x = 0; x < 512; x += 128) g.fillRect(x, 330, 6, 182);
  g.fillStyle = "#c9a047"; g.fillRect(0, 320, 512, 12);
});
/** the dining room wall: deep green panels, a gilt rail */
const dinWall = () => ctex("dinWall015", 512, 512, (g) => {
  g.fillStyle = "#3f6a52"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#4a7a5e"; for (let x = 24; x < 512; x += 128) { g.fillRect(x, 40, 80, 230); g.fillRect(x, 350, 80, 130); }
  g.fillStyle = "#c9a047"; g.fillRect(0, 300, 512, 12);
});

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), nb = new Batch(), r = rng(1903);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const curb = lam("curb", () => ({ color: "#a29a8c" }));
  const road = lam("cobRoad", () => ({ map: cobble() }));
  const walk = lam("walk", () => ({ color: "#bdb3a2" }));
  const wood = lam("wood015", () => ({ map: planks() }));
  const post = lam("post015", () => ({ map: beam() }));
  const white = lam("white015", () => ({ color: "#efebe2" }));
  const red = lam("red015", () => ({ color: "#b8423a" }));
  const iron = lam("iron015", () => ({ color: "#3a3640" }));
  const cloth = lam("cloth015", () => ({ color: "#f4f1ea" }));
  const darkWood = lam("dark015", () => ({ color: "#5a3a28" }));

  // ---- Paris: a street along x through z = 0, houses both sides, plane trees and lanterns, the cafe ----
  setSightLines(rays);
  const [px, , pz] = PAR, len = 200;
  b.add(boxGeo(V(px - len / 2, D0 - 0.2, pz - 4.5), V(px + len / 2, D0 + 0.08, pz + 4.5), 2), road);
  for (const sz of [-1, 1]) {
    b.add(boxGeo(V(px - len / 2, D0 - 0.2, sz < 0 ? pz - 8.4 : pz + 4.5), V(px + len / 2, D0 + 0.18, sz < 0 ? pz - 4.5 : pz + 8.4), 2), walk);
    b.add(boxGeo(V(px - len / 2, D0 - 0.2, sz < 0 ? pz - 4.6 : pz + 4.4), V(px + len / 2, D0 + 0.22, sz < 0 ? pz - 4.4 : pz + 4.6), 2), curb);
    let x = px - len / 2 + 2;
    while (x < px + len / 2 - 4) {
      const w = pick([7, 8, 9]);
      const behindCafe = sz > 0 && Math.abs(x + w / 2 - CAFE[0]) < 26; // the cafe shots look up at these fronts: never skip them
      if (behindCafe) setSightLines([]);
      house(b, x + w / 2, pz + sz * 12.4, sz < 0 ? 0 : Math.PI, w, 8, pick([9.8, 9.8, 8.4]), pick([0, 6, 7]), D0 + 0.12);
      if (behindCafe) setSightLines(rays);
      x += w + 0.1;
    }
    for (let lx = px - len / 2 + 6; lx < px + len / 2; lx += 16) prop(b, kit, "lantern", lx, D0 + 0.18, pz + sz * 5.0, 3.2);
    for (let lx = px - len / 2 + 14; lx < px + len / 2; lx += 16) if (Math.abs(lx - CAFE[0]) > 6) prop(b, kit, "tree_default", lx, D0 + 0.18, pz + sz * 5.6, 7.5, r() * 6);
  }
  // the cafe: an awning over the pavement, three round tables (the cast sits at them)
  const [cx, , cz] = CAFE;
  b.add(boxGeo(V(cx - 5, D0 + 2.9, cz - 1.4), V(cx + 5, D0 + 3.05, cz + 1.8), 1), lam("awning015", () => ({ map: awningTex() })));
  b.add(boxGeo(V(cx - 5, D0 + 2.55, cz - 1.45), V(cx + 5, D0 + 2.95, cz - 1.35), 1), red);
  for (const tx of [-3, 0.6, 3.4]) {
    const top = new THREE.CylinderGeometry(0.42, 0.42, 0.05, 16); top.translate(cx + tx, D0 + 0.95, cz + 0.6); b.add(top, white);
    const leg = new THREE.CylinderGeometry(0.04, 0.06, 0.78, 8); leg.translate(cx + tx, D0 + 0.57, cz + 0.6); b.add(leg, iron);
  }

  // ---- Neuilly: the airship shed on the grass, the gravel road beside the park ----
  setSightLines([]);
  const [fx, , fz] = FLD, sz0 = fz - 8;
  b.add(boxGeo(V(fx - 11, D0, sz0 - 12), V(fx - 10.4, D0 + 9, sz0), 2), wood); // side walls
  b.add(boxGeo(V(fx + 10.4, D0, sz0 - 12), V(fx + 11, D0 + 9, sz0), 2), wood);
  b.add(boxGeo(V(fx - 11, D0, sz0 - 12.6), V(fx + 11, D0 + 9, sz0 - 12), 2), wood); // back wall
  b.add(boxGeo(V(fx - 10.4, D0 + 0.02, sz0 - 12), V(fx + 10.4, D0 + 0.06, sz0), 2), lam("shedFloor", () => ({ color: "#4a3e34" })));
  for (const s of [-1, 1]) { // the pitched roof
    const g = new THREE.BoxGeometry(12.2, 0.3, 13.4);
    b.add(g, lam("shedRoof", () => ({ color: "#6f7480" })), new THREE.Matrix4().compose(V(fx + s * 5.6, D0 + 10.6, sz0 - 6.3), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -s * 0.32)), V(1, 1, 1)));
  }
  b.add(boxGeo(V(fx - 11, D0 + 9, sz0 - 0.4), V(fx + 11, D0 + 9.6, sz0 + 0.1), 1), post); // the lintel over the opening
  const gl = 260;
  b.add(boxGeo(V(fx - gl / 2, D0 - 0.2, fz + 19.5), V(fx + gl / 2, D0 + 0.06, fz + 24.5), 6), lam("gravel015", () => ({ map: gravelTex() })));
  for (let x = fx - gl / 2 + 4; x < fx + gl / 2; x += 3.0) b.add(boxGeo(V(x - 0.06, D0, fz + 18.9), V(x + 0.06, D0 + 1.0, fz + 19.1), 1), iron); // park railing
  b.add(boxGeo(V(fx - gl / 2, D0 + 0.9, fz + 18.94), V(fx + gl / 2, D0 + 0.98, fz + 19.06), 3), iron);
  for (let i = 0; i < 40; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), fx - 120 + r() * 240, D0, fz + 30 + r() * 40, 9 + r() * 5, r() * 6);
  for (let i = 0; i < 26; i++) { const x = fx - 120 + r() * 240; if (Math.abs(x - fx) > 16) prop(b, kit, pick(["tree_oak", "tree_default"]), x, D0, fz - 8 - r() * 30, 9 + r() * 5, r() * 6); }

  // ---- Bagatelle: the polo field ----
  const [ox, , oz] = POLO;
  for (const s of [-1, 1]) { // white boards along the long sides
    b.add(boxGeo(V(ox - 60, D0, oz + s * 18 - 0.06), V(ox + 60, D0 + 0.32, oz + s * 18 + 0.06), 6), white);
    for (const gz of [-3.6, 3.6]) { // goal posts at each end, red and white
      for (let k = 0; k < 4; k++) b.add(boxGeo(V(ox + s * 55 - 0.12, D0 + k * 0.8, oz + gz - 0.12), V(ox + s * 55 + 0.12, D0 + (k + 1) * 0.8, oz + gz + 0.12), 1), k % 2 ? white : red);
    }
  }
  // the stand: a low plank platform under a striped canvas roof (the crowd stands on it)
  const [stx, stz] = [ox - 2, oz - 24];
  b.add(boxGeo(V(stx - 10, D0, stz - 2.5), V(stx + 10, D0 + 0.5, stz + 2.5), 2), wood);
  for (const x of [-10, -5, 0, 5, 10]) for (const z of [-2.5, 2.5]) b.add(boxGeo(V(stx + x - 0.1, D0 + 0.5, stz + z - 0.1), V(stx + x + 0.1, D0 + 3.6, stz + z + 0.1), 1), white);
  b.add(boxGeo(V(stx - 10.4, D0 + 3.6, stz - 2.9), V(stx + 10.4, D0 + 3.8, stz + 2.9), 2), lam("stand015", () => ({ map: standTex() })));
  // trees all round, the chateau far off
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = 72 + r() * 30;
    const x = ox + Math.cos(a) * d * 1.1, z = oz + Math.sin(a) * d * 0.75;
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x, D0, z, 11 + r() * 5, r() * 6);
  }
  for (let i = 0; i < 18; i++) prop(b, kit, pick(["tree_oak", "tree_fat"]), ox - 48 - r() * 10, D0, oz - 30 + r() * 50, 12 + r() * 4, r() * 6); // the treetops she floats over
  house(b, ox + 20, oz - 70, 0, 14, 10, 9.8, 0, D0);

  // ---- the parlour (open-topped) ----
  setSightLines([]);
  const [lx, , lz] = PARL;
  const pw = lam("parWall015", () => ({ map: parlourWall() }));
  b.add(boxGeo(V(lx - 6, D0 - 0.2, lz - 3), V(lx + 6, D0 + 0.08, lz + 6), 2), lam("parFloor", () => ({ map: planks() })));
  b.add(boxGeo(V(lx - 6, D0, lz - 3.3), V(lx + 6, D0 + 4.4, lz - 3), 2), pw);
  b.add(boxGeo(V(lx - 6.3, D0, lz - 3.3), V(lx - 6, D0 + 4.4, lz + 6), 2), pw);
  nb.add(boxGeo(V(lx + 6, D0, lz - 3.3), V(lx + 6.3, D0 + 4.4, lz + 6), 2), pw);
  b.add(boxGeo(V(lx + 1.6, D0, lz - 3.0), V(lx + 3.4, D0 + 1.3, lz - 2.6), 1), lam("hearth", () => ({ map: stone("hearth015", ["#d8cdb8", "#cbbfa6"]) }))); // fireplace
  b.add(boxGeo(V(lx + 2.05, D0, lz - 2.62), V(lx + 2.95, D0 + 0.8, lz - 2.58), 1), lam("fireHole", () => ({ color: "#2a2024" })));
  b.add(boxGeo(V(lx + 1.45, D0 + 1.3, lz - 3.0), V(lx + 3.55, D0 + 1.42, lz - 2.5), 1), darkWood); // mantel
  b.add(boxGeo(V(lx - 3.6, D0, lz - 2.95), V(lx - 1.4, D0 + 0.5, lz - 2.2), 1), lam("sofa015", () => ({ color: "#7a3a4a" }))); // sofa
  b.add(boxGeo(V(lx - 3.6, D0 + 0.5, lz - 2.95), V(lx - 1.4, D0 + 1.05, lz - 2.7), 1), lam("sofa015", () => ({ color: "#7a3a4a" })));
  const ptop = new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16); ptop.translate(lx + 1.6, D0 + 0.72, lz + 0.4); b.add(ptop, darkWood); // side table
  const pleg = new THREE.CylinderGeometry(0.05, 0.08, 0.7, 8); pleg.translate(lx + 1.6, D0 + 0.35, lz + 0.4); b.add(pleg, darkWood);

  // ---- the dining room (open-topped): long table, white cloth, candles ----
  const [dx, , dz] = DIN;
  const dw = lam("dinWall015", () => ({ map: dinWall() }));
  b.add(boxGeo(V(dx - 6, D0 - 0.2, dz - 3), V(dx + 6, D0 + 0.08, dz + 6), 2), lam("dinFloor", () => ({ map: planks() })));
  b.add(boxGeo(V(dx - 6, D0, dz - 3.3), V(dx + 6, D0 + 4.4, dz - 3), 2), dw);
  b.add(boxGeo(V(dx - 6.3, D0, dz - 3.3), V(dx - 6, D0 + 4.4, dz + 6), 2), dw);
  nb.add(boxGeo(V(dx + 6, D0, dz - 3.3), V(dx + 6.3, D0 + 4.4, dz + 6), 2), dw);
  b.add(boxGeo(V(dx - 2.6, D0 + 0.72, dz - 0.55), V(dx + 2.6, D0 + 0.8, dz + 0.45), 2), cloth); // table top
  b.add(boxGeo(V(dx - 2.6, D0 + 0.3, dz + 0.43), V(dx + 2.6, D0 + 0.72, dz + 0.47), 2), cloth); // the cloth hanging down the front
  for (const x of [-2.4, 2.4]) b.add(boxGeo(V(dx + x - 0.06, D0, dz - 0.4), V(dx + x + 0.06, D0 + 0.3, dz + 0.3), 1), darkWood);
  for (const x of [-1.7, -0.5, 0.7, 1.9]) { // plates
    const pl = new THREE.CylinderGeometry(0.15, 0.13, 0.02, 16); pl.translate(dx + x, D0 + 0.81, dz + 0.15); b.add(pl, white);
  }
  const candles: [number, number, number][] = [];
  for (const x of [-1.1, 0.1, 1.3]) {
    const c = new THREE.CylinderGeometry(0.025, 0.03, 0.3, 8); c.translate(dx + x, D0 + 0.95, dz - 0.15); b.add(c, cloth);
    const s = new THREE.CylinderGeometry(0.07, 0.06, 0.04, 10); s.translate(dx + x, D0 + 0.82, dz - 0.15); b.add(s, lam("silver015", () => ({ color: "#c8c8cc" })));
    candles.push([dx + x, D0 + 1.14, dz - 0.15]);
  }

  // low hills far off
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" }))];
  ([[-300, -660, 260, 40, 120], [300, -700, 260, 46, 140], [820, 260, 200, 40, 160], [-700, 300, 220, 44, 140], [300, 760, 300, 46, 140]] as const)
    .forEach(([x, zz, a, h, c], i) => b.add(hill, hm[i % 2], new THREE.Matrix4().compose(V(x, D0 - 2, zz), new THREE.Quaternion(), V(a, h, c))));
  b.build(root);
  nb.build(root, false); // the rooms' sun-side walls cast no shadow into them
  setSightLines([]);
  // candle flames: small bright drops (HDR, they bloom)
  const flameM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.8, 0.8), fog: false });
  const lamps: THREE.Mesh[] = [];
  for (const [x, y, z] of candles) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), flameM);
    m.scale.set(1, 1.7, 1); m.position.set(x, y, z); root.add(m); lamps.push(m);
  }
  return { lamps };
};
