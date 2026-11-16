// The places of the diamond hoax: the high desert (sage bushes, a few low rocks, the anthills by the salted field, the
// easel and the signpost, and striped flat-topped mesas all round on the horizon), the banker's office far off to the
// east (an open-topped room: plank floor, panelled back and side walls with a window, the desk, a safe, a lamp table),
// the San Francisco street far off to the west (a row of houses, the bank with its columns and steps) and the green
// patch of the fruit analogy far to the south. The dug patches, the gems, the cards and the cast live in cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, planks, beam, stone, ctex, cobble } from "../../src/engine/paint";
import { D0, OFFICE, DESK, BANK, BUSH, ANTS, SIGN } from "./story";

/** the mesas' rock: horizontal strata of terracotta, ochre and buff */
const strata = (key: string, cols: string[]) => ctex(key, 256, 512, (g, r) => {
  let y = 0, i = 0;
  while (y < 512) { const h = 18 + r() * 46; g.fillStyle = cols[i++ % cols.length]; g.fillRect(0, y, 256, h + 1); y += h; }
  g.fillStyle = "rgba(60,30,20,0.18)";
  for (let k = 0; k < 40; k++) g.fillRect(r() * 256, r() * 512, 2 + r() * 3, 20 + r() * 60); // vertical cracks
});
/** the panelled wall of the office: dark green below a wainscot rail, warm cream above */
const panel = () => ctex("officePanel", 512, 512, (g) => {
  g.fillStyle = "#e8d9b8"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#3f5a46"; g.fillRect(0, 300, 512, 212);
  g.fillStyle = "#2c3f32"; for (let x = 0; x < 512; x += 128) g.fillRect(x, 300, 6, 212);
  g.fillStyle = "#6a4a30"; g.fillRect(0, 292, 512, 12);
});

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(73);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const wood = lam("deskWood", () => ({ map: planks() }));
  const post = lam("postWood", () => ({ map: beam() }));
  const dark = lam("darkIron", () => ({ color: "#3a3640" }));
  const rock = lam("rockBuff", () => ({ color: "#b89a74" }));
  const ant = lam("antDirt", () => ({ color: "#a8744a" }));
  const mesaA = lam("mesaA", () => ({ map: strata("strataA", ["#b8674a", "#c98f55", "#d8b07a", "#a85a40", "#cfa06a"]) }));
  const mesaB = lam("mesaB", () => ({ map: strata("strataB", ["#c27a52", "#d6a46e", "#b06446", "#e0bd88"]) }));

  // ---- the high desert: the mesas on the horizon (tapered prisms, flat tops), rocks and sage ----
  const mesa = (x: number, z: number, rt: number, rb: number, h: number, sz: number, m: THREE.Material, n = 7) => {
    const g = new THREE.CylinderGeometry(rt, rb, h, n, 1);
    const uv = g.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6, uv.getY(i) * (h / 40));
    b.add(g, m, new THREE.Matrix4().compose(V(x, D0 + h / 2 - 1, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 3, 0)), V(1, 1, sz)));
  };
  mesa(-50, -140, 40, 52, 36, 0.5, mesaA);
  mesa(90, -170, 46, 58, 44, 0.45, mesaB);
  mesa(-150, -110, 26, 36, 28, 0.7, mesaB);
  mesa(160, -100, 24, 32, 26, 0.8, mesaA);
  mesa(-110, 150, 34, 46, 30, 0.6, mesaA);
  mesa(140, 160, 30, 40, 28, 0.6, mesaB);
  setSightLines(rays);
  for (let i = 0; i < 70; i++) { // low rocks
    const a = r() * Math.PI * 2, d = 9 + r() * 70, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.25 + r() * 0.7;
    const g = new THREE.DodecahedronGeometry(s, 0);
    b.add(g, rock, new THREE.Matrix4().compose(V(x, D0 + s * 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * 3, r())), V(1.3, 0.7, 1)));
  }
  for (let i = 0; i < 90; i++) { // sage
    const a = r() * Math.PI * 2, d = 6 + r() * 90;
    prop(b, kit, pick(["plant_bush", "plant_bushDetailed"]), Math.cos(a) * d, D0, Math.sin(a) * d, 0.5 + r() * 0.5, r() * 6);
  }
  // ---- the anthills by the salted field: low cones of red-brown dirt ----
  for (const [dx, dz, s] of [[0, 0, 1], [1.4, -0.9, 0.8], [-1.1, -1.6, 0.9]] as const) {
    const g = new THREE.ConeGeometry(0.42 * s, 0.32 * s, 14, 1);
    g.translate(ANTS[0] + dx, D0 + 0.16 * s, ANTS[2] + dz);
    b.add(g, ant);
  }
  // ---- the signpost of the payoff and King's easel ----
  b.add(boxGeo(V(SIGN[0] - 0.07, D0, SIGN[2] - 0.07), V(SIGN[0] + 0.07, D0 + 1.9, SIGN[2] + 0.07), 1), post);
  for (const [dx, dz] of [[-0.55, 0.15], [0.55, 0.15], [0, -0.35]]) {
    const g = new THREE.BoxGeometry(0.06, 2.1, 0.06);
    b.add(g, post, new THREE.Matrix4().compose(V(2.6 + dx * 0.8, D0 + 1.0, -1.7 + dz * 0.8), new THREE.Quaternion().setFromEuler(new THREE.Euler(-dz * 0.3, 0, dx * 0.25)), V(1, 1, 1)));
  }
  b.add(boxGeo(V(2.6 - 0.62, D0 + 0.62, -1.62), V(2.6 + 0.62, D0 + 0.68, -1.5), 1), post); // the easel's ledge

  // ---- the office: plank floor, panelled back + left walls with a window, the desk, the safe ----
  setSightLines([]);
  const [ox, , oz] = OFFICE, nb = new Batch();
  const pm = lam("officePanel", () => ({ map: panel() }));
  b.add(boxGeo(V(ox - 6, D0 - 0.2, oz - 4.2), V(ox + 6, D0 + 0.08, oz + 7), 2), lam("officeFloor", () => ({ map: planks() })));
  b.add(boxGeo(V(ox - 6, D0, oz - 4.2), V(ox - 1.2, D0 + 4.2, oz - 3.9), 2), pm);
  b.add(boxGeo(V(ox + 1.2, D0, oz - 4.2), V(ox + 6, D0 + 4.2, oz - 3.9), 2), pm);
  b.add(boxGeo(V(ox - 1.2, D0, oz - 4.2), V(ox + 1.2, D0 + 1.3, oz - 3.9), 2), pm);
  b.add(boxGeo(V(ox - 1.2, D0 + 3.1, oz - 4.2), V(ox + 1.2, D0 + 4.2, oz - 3.9), 2), pm);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshBasicMaterial({ color: "#a9c6e0" }));
  glass.position.set(ox, D0 + 2.2, oz - 4.1); root.add(glass);
  b.add(boxGeo(V(ox - 0.04, D0 + 1.3, oz - 3.95), V(ox + 0.04, D0 + 3.1, oz - 3.88), 1), post); // the window's mullion
  b.add(boxGeo(V(ox - 1.2, D0 + 2.16, oz - 3.95), V(ox + 1.2, D0 + 2.24, oz - 3.88), 1), post);
  b.add(boxGeo(V(ox - 6, D0, oz - 3.9), V(ox - 5.7, D0 + 4.2, oz + 7), 2), pm);
  nb.add(boxGeo(V(ox + 5.7, D0, oz - 3.9), V(ox + 6, D0 + 4.2, oz + 7), 2), pm);
  const [dx0, , dz0] = DESK;
  b.add(boxGeo(V(dx0 - 1.0, D0 + 0.74, dz0 - 0.45), V(dx0 + 1.0, D0 + 0.82, dz0 + 0.45), 1), wood);
  b.add(boxGeo(V(dx0 - 0.95, D0 + 0.08, dz0 - 0.4), V(dx0 - 0.45, D0 + 0.74, dz0 + 0.4), 1), wood);
  b.add(boxGeo(V(dx0 + 0.45, D0 + 0.08, dz0 - 0.4), V(dx0 + 0.95, D0 + 0.74, dz0 + 0.4), 1), wood);
  b.add(boxGeo(V(ox + 3.6, D0 + 0.08, oz - 3.8), V(ox + 4.8, D0 + 1.5, oz - 2.8), 1), dark); // the safe
  // Tiffany's table (shot 4): a small table at the left wall
  b.add(boxGeo(V(ox - 3.0, D0 + 0.74, oz - 1.6), V(ox - 1.8, D0 + 0.8, oz - 0.6), 1), wood);
  for (const [lx, lz] of [[-2.95, -1.55], [-1.9, -1.55], [-2.95, -0.7], [-1.9, -0.7]]) b.add(boxGeo(V(ox + lx, D0 + 0.08, oz + lz), V(ox + lx + 0.07, D0 + 0.74, oz + lz + 0.07), 1), post);

  // ---- the street: cobbles, the bank (stone front, columns, steps), houses either side ----
  const [bx, , bz] = BANK;
  b.add(boxGeo(V(bx - 40, D0 - 0.2, bz - 16), V(bx + 40, D0 + 0.08, bz + 24), 2), lam("streetCobble", () => ({ map: cobble() })));
  const bankStone = lam("bankStone", () => ({ map: stone("bankStone", ["#d8ccb4", "#cfc2a8", "#e0d4bc", "#c8bb9f"]) }));
  b.add(boxGeo(V(bx - 6, D0 + 0.08, bz - 10), V(bx + 6, D0 + 9.8, bz - 4), 2), bankStone);
  b.add(boxGeo(V(bx - 6.4, D0 + 9.8, bz - 10.2), V(bx + 6.4, D0 + 10.5, bz - 3.6), 2), bankStone); // the cornice
  for (let k = 0; k < 3; k++) b.add(boxGeo(V(bx - 4.5 + k * 0.1, D0 + 0.08 + k * 0.18, bz - 4 + 1.2 - k * 0.4), V(bx + 4.5 - k * 0.1, D0 + 0.26 + k * 0.18, bz - 4), 1), bankStone);
  for (const cx of [-4, -2.2, 2.2, 4]) {
    const c = new THREE.CylinderGeometry(0.3, 0.34, 6.6, 14);
    c.translate(bx + cx, D0 + 0.62 + 3.3, bz - 3.5);
    b.add(c, bankStone);
  }
  b.add(boxGeo(V(bx - 4.6, D0 + 7.2, bz - 3.9), V(bx + 4.6, D0 + 7.8, bz - 3.1), 1), bankStone); // the lintel on the columns
  b.add(boxGeo(V(bx - 1.0, D0 + 0.62, bz - 4.04), V(bx + 1.0, D0 + 3.2, bz - 3.98), 1), lam("bankDoor", () => ({ color: "#4a3022" })));
  house(b, bx - 13, bz - 7, 0, 12, 8, 9.8, 1, D0 + 0.08);
  house(b, bx + 13, bz - 7, 0, 12, 8, 8.4, 2, D0 + 0.08);
  house(b, bx - 26, bz - 7, 0, 12, 8, 8.4, 3, D0 + 0.08);
  house(b, bx + 26, bz - 7, 0, 12, 8, 9.8, 0, D0 + 0.08);

  // ---- the green patch of the analogy: grass, one small bush, trees behind ----
  const [ux, , uz] = BUSH;
  b.add(boxGeo(V(ux - 30, D0 - 0.2, uz - 30), V(ux + 30, D0 + 0.04, uz + 20), 2), lam("patchGrass", () => ({ color: "#86b45e" })));
  prop(b, kit, "plant_bushLarge", ux + 0.1, D0 + 0.04, uz - 0.8, 0.6, 0.4);
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = 12 + r() * 16, x = ux + Math.cos(a) * d, z = uz + Math.sin(a) * d;
    if (z > uz + 2) continue;
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x, D0 + 0.04, z, 6 + r() * 4, r() * 6);
  }
  b.build(root);
  nb.build(root, false); // the office's sun-side wall casts no shadow into the room
  setSightLines([]);
};
