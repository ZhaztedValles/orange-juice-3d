// Millbrook, an invented river town: a cobbled main street along x, Mrs Plum's bakery on the north side (a green
// shopfront with an open window, a sill for the three prize bakes, a striped awning and a painted loaf sign), houses on
// both sides, the church tower with its clock at the west end, and the river with a stone bridge and racing boats at
// the east end. The cast and drawn props live in cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo, quad } from "../../src/engine/build";
import { rng, ctex, cobbleHD, stoneHD, water, beam } from "../../src/engine/paint";
import { D0, CLOCK, RIVER_X0, RIVER_X1, DECK_Y, SILL_Y } from "./story";

/** the awning: cream and red stripes */
const awningTex = () => ctex("awning018", 256, 128, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#efe4c8" : "#b8463c"; g.fillRect(i * 32, 0, 32, 128); }
  g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(0, 112, 256, 16);
});
/** the shop sign: a cream board with a painted loaf and a wheat sheaf (no text) */
const signTex = () => ctex("sign018", 512, 128, (g) => {
  g.fillStyle = "#2f5a44"; g.fillRect(0, 0, 512, 128);
  g.fillStyle = "#efe2bf"; g.fillRect(10, 10, 492, 108);
  g.fillStyle = "#c98a3e"; g.strokeStyle = "#241726"; g.lineWidth = 7;
  g.beginPath(); g.ellipse(256, 66, 92, 38, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.strokeStyle = "#8a5a26"; g.lineWidth = 6;
  for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(256 + k * 30 - 10, 44); g.lineTo(256 + k * 30 + 10, 88); g.stroke(); }
  for (const x of [90, 422]) {
    g.strokeStyle = "#b8892e"; g.lineWidth = 6;
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x, 110); g.lineTo(x + k * 12, 30); g.stroke(); }
  }
});
/** the clock face: cream dial, 12 ticks, hands at two o'clock */
const clockTex = () => ctex("clock018", 256, 256, (g) => {
  g.fillStyle = "#2a2430"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.fillStyle = "#f2ead6"; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.fill();
  g.strokeStyle = "#2a2430";
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.lineWidth = k % 3 ? 5 : 10; g.beginPath(); g.moveTo(128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92); g.lineTo(128 + Math.sin(a) * 104, 128 - Math.cos(a) * 104); g.stroke(); }
  g.lineCap = "round";
  g.lineWidth = 12; const ah = (2 / 12) * Math.PI * 2; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(ah) * 58, 128 - Math.cos(ah) * 58); g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 40); g.stroke();
  g.fillStyle = "#2a2430"; g.beginPath(); g.arc(128, 128, 10, 0, 7); g.fill();
});
/** the shop's interior seen through the open window: warm dark shelves with loaves */
const shopInTex = () => ctex("shopin018", 256, 128, (g, r) => {
  g.fillStyle = "#4a3428"; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#5e4434"; for (const y of [34, 76]) g.fillRect(0, y, 256, 8);
  for (let i = 0; i < 14; i++) { g.fillStyle = r() < 0.5 ? "#a8743a" : "#c08a48"; g.beginPath(); g.ellipse(12 + i * 18 + r() * 4, i % 2 ? 28 : 70, 9, 6, 0, 0, 7); g.fill(); }
});

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1018);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const cob = lam("cobble018", () => ({ map: cobbleHD() }));
  const grass = lam("grass018", () => ({ color: "#6f9a52" }));
  const stone = lam("stone018", () => ({ map: stoneHD("stone018", ["#c9bda6", "#bcae96", "#d3c6ae", "#b4a68e"], "#8f8270") }));
  const shopPaint = lam("shop018", () => ({ color: "#3f6e55" }));
  const frame = lam("frame018", () => ({ color: "#efe6cf" }));
  const wood = lam("wood018", () => ({ map: beam() }));
  const door = lam("door018", () => ({ color: "#5a3a2a" }));
  const river = lam("river018", () => ({ map: water() }));
  const unlit = (_key: string, map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, fog: true });

  // ================= the street and the bakery (the cameras look at them: built before the sight lines) =================
  setSightLines([]);
  b.add(boxGeo(V(-60, D0 - 1.5, -60), V(RIVER_X0, D0 + 0.04, 60), 3), cob);
  b.add(boxGeo(V(RIVER_X1, D0 - 1.5, -200), V(260, D0 + 0.04, 200), 4), grass);
  b.add(boxGeo(V(RIVER_X0, D0 - 1.5, -200), V(RIVER_X1, D0 - 1.2, 200), 4), lam("bed018", () => ({ color: "#5d6b5a" })));
  const rw = new THREE.PlaneGeometry(RIVER_X1 - RIVER_X0, 400); rw.rotateX(-Math.PI / 2); rw.translate((RIVER_X0 + RIVER_X1) / 2, D0 - 0.7, 0);
  const ruv = rw.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < ruv.count; i++) ruv.setXY(i, ruv.getX(i) * 4, ruv.getY(i) * 80);
  b.add(rw, river);
  // the bakery: a house with a shopfront on its ground floor
  house(b, 0, -8.5, 0, 8, 9, 8.4, 2, D0);
  b.add(boxGeo(V(-3.7, D0, -4.0), V(3.7, D0 + 3.4, -3.62), 1), shopPaint);
  // the window: interior picture, cream frame, the sill, two open casements folded back
  b.add(quad(V(-3.05, D0 + 1.05, -3.6), V(0.95, D0 + 1.05, -3.6), V(0.95, D0 + 2.9, -3.6), V(-3.05, D0 + 2.9, -3.6)), unlit("shopin", shopInTex()));
  for (const [x0, x1, y0, y1] of [[-3.25, -3.05, D0 + 1.05, D0 + 3.05], [0.95, 1.15, D0 + 1.05, D0 + 3.05], [-3.25, 1.15, D0 + 2.9, D0 + 3.1]] as const)
    b.add(boxGeo(V(x0, y0, -3.62), V(x1, y1, -3.45), 1), frame);
  b.add(boxGeo(V(-3.3, SILL_Y - 0.1, -3.62), V(1.2, SILL_Y, -3.22), 1), frame);
  for (const [x, s] of [[-3.25, -1], [1.15, 1]] as const) { // casements swung out flat against the wall
    b.add(boxGeo(V(s < 0 ? x - 1.0 : x, D0 + 1.1, -3.6), V(s < 0 ? x : x + 1.0, D0 + 2.9, -3.5), 1), frame);
    b.add(quad(V(s < 0 ? x - 0.9 : x + 0.1, D0 + 1.2, -3.49), V(s < 0 ? x - 0.1 : x + 0.9, D0 + 1.2, -3.49), V(s < 0 ? x - 0.1 : x + 0.9, D0 + 2.8, -3.49), V(s < 0 ? x - 0.9 : x + 0.1, D0 + 2.8, -3.49)),
      lam("pane018", () => ({ color: "#9fbcd2" })));
  }
  // the door, its step
  b.add(quad(V(1.75, D0, -3.6), V(3.05, D0, -3.6), V(3.05, D0 + 2.6, -3.6), V(1.75, D0 + 2.6, -3.6)), door);
  b.add(boxGeo(V(1.6, D0, -3.62), V(3.2, D0 + 0.16, -3.2), 1), stone);
  // the awning and the sign
  b.add(quad(V(-3.7, D0 + 3.3, -3.6), V(3.7, D0 + 3.3, -3.6), V(3.7, D0 + 2.95, -2.5), V(-3.7, D0 + 2.95, -2.5)), lam("awning018", () => ({ map: awningTex(), side: THREE.DoubleSide })));
  b.add(quad(V(-3.0, D0 + 3.5, -3.6), V(3.0, D0 + 3.5, -3.6), V(3.0, D0 + 4.25, -3.6), V(-3.0, D0 + 4.25, -3.6)), unlit("sign", signTex()));
  // the church tower closing the west end of the street, its clock facing east
  const [cx, cy, cz] = CLOCK;
  b.add(boxGeo(V(cx - 6, D0, cz - 3), V(cx, D0 + 22, cz + 3), 3), stone);
  const sp = new THREE.ConeGeometry(4.3, 9, 4); sp.rotateY(Math.PI / 4); sp.translate(cx - 3, D0 + 26.5, cz); b.add(sp, lam("spire018", () => ({ color: "#6f7890" })));
  b.add(quad(V(cx + 0.02, cy - 1.6, cz + 1.6), V(cx + 0.02, cy - 1.6, cz - 1.6), V(cx + 0.02, cy + 1.6, cz - 1.6), V(cx + 0.02, cy + 1.6, cz + 1.6)), unlit("clock", clockTex()));
  // the bridge: a stone deck on two piers, parapets
  b.add(boxGeo(V(RIVER_X0 - 2, DECK_Y - 0.5, -2.6), V(RIVER_X1 + 2, DECK_Y, 2.6), 2), stone);
  for (const s of [-1, 1]) b.add(boxGeo(V(RIVER_X0 - 2, DECK_Y, s * 2.6 - 0.25), V(RIVER_X1 + 2, DECK_Y + 0.9, s * 2.6 + 0.25), 2), stone);
  for (const px of [RIVER_X0 + 6, RIVER_X1 - 6]) b.add(boxGeo(V(px - 0.8, D0 - 1.3, -2.6), V(px + 0.8, DECK_Y - 0.5, 2.6), 2), stone);
  // racing boats on the river (simple hulls)
  const hull = lam("hull018", () => ({ color: "#8a5a36" }));
  for (const [x, z, c] of [[40, -9, "#b8463c"], [45, -13, "#3f6fb5"], [49, -6, "#e0b04a"]] as const) {
    b.add(boxGeo(V(x - 0.5, D0 - 0.85, z - 2.2), V(x + 0.5, D0 - 0.45, z + 2.2), 1), hull);
    b.add(boxGeo(V(x - 0.52, D0 - 0.5, z - 2.2), V(x + 0.52, D0 - 0.4, z + 2.2), 1), lam("trim" + c, () => ({ color: c })));
  }
  void wood;

  setSightLines(rays);
  // houses: north side (fronts face +z), south side (fronts face -z)
  for (const x of [-27, -18, -9, 9, 18, 27]) house(b, x, -8.5, 0, 8, 9, pick([7, 8.4, 9.8]), Math.floor(r() * 6), D0);
  for (const x of [-26, -17, -8, 19, 28]) house(b, x, 10.5, Math.PI, 8, 9, pick([7, 8.4, 9.8]), Math.floor(r() * 6), D0);
  // trees on the far bank and beyond the houses
  for (let i = 0; i < 40; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), RIVER_X1 + 6 + r() * 80, D0, -120 + r() * 240, 8 + r() * 6, r() * 6);
  for (let i = 0; i < 30; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_cone"]), -60 + r() * 95, D0, (r() < 0.5 ? -1 : 1) * (22 + r() * 30), 9 + r() * 6, r() * 6);
  for (const [x, z] of [[-4.6, -3.0], [4.4, -3.2], [12.5, 5.0]] as const) prop(b, kit, "plant_bush", x, D0, z, 0.9, r() * 6);
  prop(b, kit, "cart", -12, D0, 4.2, 1.6, 0.4);
  b.build(root);
  setSightLines([]);
  return {};
};
