// The places of the zinc-ball story: the Seine at Paris (stone quay walls on both banks inside the river strip, the
// paved quay and two rows of houses on the north bank, lanterns, the net-keeper's shed on the south bank), the Seine
// far upstream (earth banks, the little plank jetty, fields and trees), the square of Moulins (cobbles, houses all
// round, the post office with its envelope sign, the packing table, the grandmother's door) and the riverbed far off
// at x ~ -1200 (sand, stones, weed). The ground is laid in abutting pieces, never stacked. The water, the net, the
// balls, the ice, the boat and the cast live in world.ts / cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, cobbleHD, grassHD, stoneHD, planksHD, bed } from "../../src/engine/paint";
import { D0, WY, RW, NET_X, UP, JETTY, MOU, POST, TABLE, DOOR, UNDER, UY } from "./story";

/** the post office sign: a cream envelope on Prussian-blue-free deep green (no lettering) */
const signTex = () => ctex("postSign021", 256, 128, (g) => {
  g.fillStyle = "#2f5a48"; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = "#c9a047"; g.lineWidth = 8; g.strokeRect(6, 6, 244, 116);
  g.fillStyle = "#f2e8cf"; g.fillRect(78, 30, 100, 68);
  g.strokeStyle = "#5a3e26"; g.lineWidth = 5; g.strokeRect(78, 30, 100, 68);
  g.beginPath(); g.moveTo(78, 30); g.lineTo(128, 70); g.lineTo(178, 30); g.stroke();
});
/** riverbed silt: green-brown sand with pebbles */
const siltTex = () => ctex("silt021", 512, 512, (g, r) => {
  g.fillStyle = "#6e6c5c"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = ["#63614f", "#7a7864", "#686656", "#827e6a", "#5c5b4c"][Math.floor(r() * 5) % 5];
    g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 6, 1 + r() * 4, r() * 3, 0, 7); g.fill();
  }
});

/** horizontal quad at y over x0..x1, z0..z1, split into cells (big quads lose fog on single frames) */
const flat = (x0: number, x1: number, z0: number, z1: number, y: number, tile: number, nx = 20, nz = 20) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
  g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * (x1 - x0)) / tile, (uv.getY(i) * (z1 - z0)) / tile);
  return g;
};

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1021);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const grass = lam("grassHD", () => ({ map: grassHD() }));
  const cob = lam("cobbleHD", () => ({ map: cobbleHD() }));
  const quay = lam("quay021", () => ({ map: stoneHD("quay021", ["#cfc3ad", "#c2b59d", "#d8ccb6", "#bbae96"], "#8f8270") }));
  const earth = lam("bank021", () => ({ color: "#7a6a4e" }));
  const wood = lam("planks021", () => ({ map: planksHD() }));
  const post = lam("post021", () => ({ color: "#5a4030" }));
  const shed = lam("shed021", () => ({ color: "#8a6a44" }));
  const sign = new THREE.MeshBasicMaterial({ map: signTex() });
  const silt = lam("silt021", () => ({ map: siltTex() }));
  const rock = lam("rock021", () => ({ color: "#6c6e62" }));
  const rock2 = lam("rock021b", () => ({ color: "#5a5c54" }));
  const cloth = lam("cloth021", () => ({ color: "#5a3a2a" }));
  const paper = lam("paper021", () => ({ color: "#efe6cf" }));
  void bed;

  setSightLines([]);
  // ---- ground (abutting, never stacked): north fields + Paris quay paving, south fields, the square of Moulins ----
  const [MX, , MZ] = MOU;
  b.add(flat(-900, 900, -900, -RW - 8, D0, 4, 60, 30), grass);
  b.add(flat(-900, -80, -RW - 8, -RW, D0, 4, 40, 2), grass);
  b.add(flat(-80, 80, -RW - 8, -RW, D0, 2.5, 40, 4), cob);
  b.add(flat(80, 900, -RW - 8, -RW, D0, 4, 40, 2), grass);
  b.add(flat(-900, 900, RW, MZ - 40, D0, 4, 60, 30), grass);
  b.add(flat(-900, MX - 50, MZ - 40, MZ + 40, D0, 4, 30, 8), grass);
  b.add(flat(MX - 50, MX + 50, MZ - 40, MZ + 40, D0, 2.5, 40, 30), cob);
  b.add(flat(MX + 50, 900, MZ - 40, MZ + 40, D0, 4, 30, 8), grass);
  b.add(flat(-900, 900, MZ + 40, 900, D0, 4, 60, 20), grass);
  // ---- the river walls inside the river strip: stone at Paris, earth banks elsewhere ----
  for (const s of [-1, 1]) {
    const z0 = s < 0 ? -RW : RW - 0.5, z1 = s < 0 ? -RW + 0.5 : RW;
    b.add(boxGeo(V(-80, WY - 2.5, z0), V(80, D0, z1), 2), quay);
    b.add(boxGeo(V(-220, WY - 2.5, z0), V(-80, D0, z1), 2), earth);
    b.add(boxGeo(V(80, WY - 2.5, z0), V(520, D0, z1), 2), earth);
  }
  // the net-keeper's shed
  b.add(boxGeo(V(NET_X + 34, D0, RW + 4), V(NET_X + 37, D0 + 2.4, RW + 6.5), 1), shed);
  b.add(boxGeo(V(NET_X + 33.8, D0 + 2.4, RW + 3.8), V(NET_X + 37.2, D0 + 2.6, RW + 6.7), 1), post);
  // ---- upstream: the plank jetty on its posts ----
  const [JX, JY, JZ] = JETTY;
  b.add(boxGeo(V(JX - 1.1, JY - 0.15, JZ - 0.6), V(JX + 1.1, JY, RW + 0.6), 1), wood);
  for (const x of [JX - 0.95, JX + 0.95]) for (const z of [JZ - 0.45, JZ + 1.2]) b.add(boxGeo(V(x - 0.1, WY - 1.5, z - 0.1), V(x + 0.1, JY + 0.6, z + 0.1), 1), post);
  // ---- Moulins: the packing table with its stack of letters and a sack; the parade-rope square stays open ----
  const [TX, , TZ] = TABLE;
  b.add(boxGeo(V(TX - 0.9, D0 + 0.82, TZ - 0.5), V(TX + 0.9, D0 + 0.9, TZ + 0.5), 1), wood);
  for (const [x, z] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]] as const) b.add(boxGeo(V(TX + x - 0.05, D0, TZ + z - 0.05), V(TX + x + 0.05, D0 + 0.82, TZ + z + 0.05), 1), post);
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(TX - 0.75 + 0.02 * (k % 2), D0 + 0.9 + k * 0.035, TZ - 0.15), V(TX - 0.45, D0 + 0.93 + k * 0.035, TZ + 0.08)), paper);
  b.add(new THREE.SphereGeometry(0.28, 12, 10), cloth, new THREE.Matrix4().makeScale(1, 1.25, 1).setPosition(TX + 1.35, D0 + 0.34, TZ - 0.2));
  // the post office sign over its window (unlit face so the side sun never greys it)
  b.add(new THREE.PlaneGeometry(2.2, 1.1), sign, new THREE.Matrix4().makeTranslation(POST[0], D0 + 3.3, POST[2] - 3.05));
  // ---- the riverbed: silt, stones, weed ----
  const [UX, , UZ] = UNDER;
  b.add(flat(UX - 40, UX + 40, UZ - 40, UZ + 40, UY, 3, 40, 40), silt);
  for (let i = 0; i < 70; i++) {
    const x = UX - 14 + r() * 28, z = UZ - 10 + r() * 20, s = 0.08 + r() * 0.3;
    if (Math.abs(z - UZ) < 1.2 && Math.abs(x - UX) < 4) continue; // the balls' lane stays clear
    const g = new THREE.DodecahedronGeometry(1, 0); g.scale(s * (1 + r()), s * 0.6, s);
    b.add(g, r() < 0.5 ? rock : rock2, new THREE.Matrix4().makeRotationY(r() * 6).setPosition(x, UY + s * 0.2, z));
  }

  setSightLines(rays);
  // Paris: two rows of houses on the north bank, lanterns along the quay, trees along the south bank
  for (let x = -66; x <= 66; x += 9.5) house(b, x, -RW - 8 - 4.6, 0, 8.6, 9, pick([8.4, 9.8, 9.8]), Math.floor(r() * 6), D0);
  for (let x = -62; x <= 62; x += 10) house(b, x, -RW - 8 - 16, 0, 9, 9, pick([9.8, 11.2]), Math.floor(r() * 6), D0);
  for (let x = -60; x <= 60; x += 12) prop(b, kit, "lantern", x, D0, -RW - 1.2, 2.8, 0);
  for (let x = -70; x <= 70; x += 7 + r() * 3) if (Math.abs(x - NET_X - 35) > 5) prop(b, kit, pick(["tree_cone", "tree_default"]), x, D0, RW + 9 + r() * 6, 7 + r() * 3, r() * 6);
  // upstream: fields and trees on both banks, a few cottages
  const [PX] = UP;
  for (let i = 0; i < 60; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat", "tree_cone"]), PX - 120 + r() * 240, D0, -RW - 12 - r() * 60, 8 + r() * 5, r() * 6);
  for (let i = 0; i < 40; i++) { const x = PX - 120 + r() * 240; if (Math.abs(x - PX) < 14) continue; prop(b, kit, pick(["tree_oak", "tree_default", "tree_cone"]), x, D0, RW + 8 + r() * 40, 8 + r() * 5, r() * 6); }
  for (let i = 0; i < 16; i++) prop(b, kit, "hedge", PX - 40 + i * 5, D0, -RW - 6, 1.3, 0);
  for (const x of [PX - 26, PX + 22]) house(b, x, -RW - 16, 0, 7, 7, 7, Math.floor(r() * 6), D0);
  // Moulins: houses round the square (north row facing south, south row facing north, sides facing in)
  for (let x = MX - 40; x <= MX + 40; x += 9.5) house(b, x, MZ - 12 - 4.5, 0, 8.6, 9, pick([8.4, 9.8]), Math.floor(r() * 6), D0);
  for (let x = MX - 40; x <= MX + 40; x += 9.5) house(b, x, MZ + 24 + 4.5, Math.PI, 8.6, 9, pick([8.4, 9.8]), Math.floor(r() * 6), D0);
  for (let z = MZ - 6; z <= MZ + 20; z += 9.5) { house(b, MX - 34, z, Math.PI / 2, 8.6, 9, pick([8.4, 9.8]), Math.floor(r() * 6), D0); house(b, MX + 34, z, -Math.PI / 2, 8.6, 9, pick([8.4, 9.8]), Math.floor(r() * 6), D0); }
  for (const x of [MX - 20, MX + 22]) prop(b, kit, "lantern", x, D0, MZ + 6, 2.8, 0);
  // weed on the riverbed
  for (let i = 0; i < 50; i++) { const x = UX - 14 + r() * 28, z = UZ - 10 + r() * 20; if (Math.abs(z - UZ) < 1.5 && Math.abs(x - UX) < 4.5) continue; prop(b, kit, "grass_large", x, UY, z, 0.3 + r() * 0.5, r() * 6); }
  b.build(root);
  setSightLines([]);
  void DOOR;
  return {};
};
