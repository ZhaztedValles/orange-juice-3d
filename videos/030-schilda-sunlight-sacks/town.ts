// The places of the Schilda legend: the market square (timbered houses round it, trees, stalls, a sandy path, the hills
// behind) with the new town hall at the back: three plastered, timber-framed walls in a triangle and a pyramid roof,
// with a door and no windows (its walls and roof are their own groups: they rise, lift off and come back per shot);
// the council room, the prince's court (throne and red carpet), the roofless hall seen from inside (tall plain walls,
// the council table), the dark hall (a closed box of deep navy, unlit) and a far-away town (cobbles, houses).
// Cast and hand-drawn props: cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo, roofMat, tri } from "../../src/engine/build";
import { rng, ctex, stone } from "../../src/engine/paint";
import { D0, HWX, HZ, HBZ, HH, HR, DOORW, DOORH, SX, KX, CT, OH, DK, TABLE, THRONE, OTABLE } from "./story";

/** square grass: fresh green with darker tufts and a few daisies */
export const greenTex = () => ctex("green030", 512, 512, (g, r) => {
  g.fillStyle = "#7fa85a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? "#739c50" : "#8db566"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 18 + r() * 50, 8 + r() * 16, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.7 ? "#668f46" : "#a9c47a"; g.fillRect(r() * 512, r() * 512, 3, 8 + r() * 6); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "#f4f0e0"; g.beginPath(); g.arc(r() * 512, r() * 512, 2.5, 0, Math.PI * 2); g.fill(); }
});
/** the hills: field strips and hedges */
const hillTex = () => ctex("hill030", 512, 512, (g, r) => {
  g.fillStyle = "#86a85c"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 128) {
    g.fillStyle = ["#7c9f55", "#93b266", "#a3b86a", "#82a45a"][Math.floor(r() * 4)]; g.fillRect(x + 2, y + 2, 124, 60);
  }
  g.strokeStyle = "#6f8a4a"; g.lineWidth = 3;
  for (let y = 0; y <= 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
});
/** the hall's wall: warm cream plaster in a dark timber frame (posts, rails, braces), no window anywhere. One tile
 *  spans 3.1 m x HH; the plinth band at the bottom */
const hallTex = () => ctex("hall030", 512, 1024, (g, r) => {
  g.fillStyle = "#ecd3a2"; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "#e4c896" : "#f2dcb0"; g.fillRect(r() * 512, r() * 1024, 30 + r() * 60, 12 + r() * 30); }
  g.fillStyle = "#5a3a26";
  g.fillRect(0, 0, 26, 1024); g.fillRect(0, 0, 512, 22); g.fillRect(0, 470, 512, 22); g.fillRect(0, 900, 512, 20);
  g.lineWidth = 22; g.strokeStyle = "#5a3a26";
  for (const [x0, y0, x1, y1] of [[26, 470, 256, 22], [256, 22, 512, 470], [26, 900, 256, 492], [256, 492, 512, 900]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.fillStyle = "#9a8e7a"; g.fillRect(0, 920, 512, 104);
  g.fillStyle = "#857a68"; for (let x = 0; x < 512; x += 64) g.fillRect(x, 920, 4, 104);
});
/** inside plaster: warm cream with a dado band */
const plasterTex = () => ctex("plaster030", 512, 256, (g, r) => {
  g.fillStyle = "#f0cf98"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "#e8c58a" : "#f5d8a8"; g.fillRect(r() * 512, r() * 256, 30 + r() * 50, 10 + r() * 20); }
  g.fillStyle = "#7a5034"; g.fillRect(0, 168, 512, 8); g.fillStyle = "#7a4a3a"; g.fillRect(0, 176, 512, 80);
});
/** a leaded window seen from inside */
const winTex = () => ctex("win030", 128, 192, (g) => {
  g.fillStyle = "#6a4a32"; g.fillRect(0, 0, 128, 192);
  g.fillStyle = "#bcd4ec"; for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) g.fillRect(12 + x * 54, 12 + y * 58, 50, 54);
});
/** the dark: deep navy-violet with faint mottling (never pure black: QA counts mean luma < .04 as a black frame) */
const darkTex = () => ctex("dark030", 512, 512, (g, r) => {
  g.fillStyle = "#2b2950"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? "rgba(52,48,92,0.5)" : "rgba(34,32,66,0.5)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 30 + r() * 70, 20 + r() * 50, r() * 3, 0, Math.PI * 2); g.fill(); }
});
/** cobbles for the far town */
const cobbleTex = () => ctex("cobble030", 256, 256, (g, r) => {
  g.fillStyle = "#8f8778"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 20) for (let x = (y / 20) % 2 ? -12 : 0; x < 256; x += 24) { g.fillStyle = r() < 0.5 ? "#a59c8a" : "#978f80"; g.beginPath(); g.ellipse(x + 12, y + 10, 10, 8, 0, 0, Math.PI * 2); g.fill(); }
});
/** a red carpet with a gold border */
const carpetTex = () => ctex("carpet030", 128, 512, (g) => {
  g.fillStyle = "#d9a441"; g.fillRect(0, 0, 128, 512); g.fillStyle = "#a8323a"; g.fillRect(12, 0, 104, 512);
});
const flagTex = () => stone("flag030", ["#b9ad98", "#a99d88", "#c4b8a2", "#b0a48e"]);

export type TownParts = { walls: THREE.Group; roof: THREE.Group };

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []): TownParts => {
  const b = new Batch(), r = rng(1597);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const box = (bb: Batch, a: [number, number, number], c: [number, number, number], m: THREE.Material, t = 2) => bb.add(boxGeo(V(...a), V(...c), t), m);
  const darkWood = lam("dwood030", () => ({ color: "#6a4a32" }));
  const gold = lam("gold030", () => ({ color: "#d9a441" }));
  const velvet = lam("velvet030", () => ({ color: "#8c2f3a" }));
  const plaster = lam("plaster030", () => ({ map: plasterTex() }));
  const plain = lam("plain030", () => ({ color: "#ecd3a2" }));
  const flags = lam("flag030", () => ({ map: flagTex() }));
  const cobble = lam("cobble030", () => ({ map: cobbleTex() }));
  const pathM = lam("path030", () => ({ color: "#c9b48a" }));
  const hillM = lam("hill030", () => ({ map: hillTex() }));
  const carpet = lam("carpet030", () => ({ map: carpetTex() }));
  const win = new THREE.MeshBasicMaterial({ map: winTex(), color: new THREE.Color(0.86, 0.86, 0.86) });

  setSightLines(rays);
  // ---- the square: a sandy path across, houses all round (open toward the cameras), trees, stalls ----
  box(b, [-30, D0 - 0.2, 5.6], [30, D0 + 0.04, 7.2], pathM, 3);
  const row = (x0: number, x1: number, z: number, yaw: number) => {
    let x = x0;
    while (x < x1) { const w = pick([6, 7, 8]); house(b, x + w / 2, z, yaw, w, 7, pick([7, 8.4, 9.8]), pick([1, 0, 4, 6, 1]), D0); x += w + 0.4; }
  };
  row(-26, 26, -17, 0);
  for (let z = -11; z < 8; z += 8.4) { house(b, -19, z, Math.PI / 2, 7.5, 7, pick([7, 8.4]), pick([1, 4, 0]), D0); house(b, 19, z, -Math.PI / 2, 7.5, 7, pick([7, 8.4]), pick([6, 1, 0]), D0); }
  for (let i = 0; i < 50; i++) {
    const a = r() * Math.PI * 2, d = 34 + r() * 60, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > 0 && Math.abs(x) < 30) continue; // keep the views from the front clear
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x, D0, z, 7 + r() * 6, r() * 6);
  }
  prop(b, kit, "stall-green", -9.5, D0, -2.5, 2.6, 0.3);
  prop(b, kit, "stall-red", 9.8, D0, -3.0, 2.6, -0.3);
  prop(b, kit, "banner-red", -6.4, D0, 1.2, 3.2, 0);
  prop(b, kit, "banner-green", 6.4, D0, 1.2, 3.2, 0);
  for (const [hx, hz, hr, hh] of [[-120, -230, 150, 55], [90, -260, 170, 70], [260, -120, 150, 50], [-260, -90, 160, 60], [10, -330, 200, 85]]) {
    const g = new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    g.scale(hr, hh, hr * 0.7); g.translate(hx, D0 - 2, hz);
    const uv = g.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 12, uv.getY(i) * 3);
    b.add(g, hillM);
  }

  // ---- the far-away town: cobbles and houses round a little square ----
  box(b, [SX - 12, D0 - 0.2, -9], [SX + 12, D0 + 0.06, 10], cobble, 4);
  house(b, SX - 1, -12.5, 0, 9, 7, 8.4, 6, D0);
  house(b, SX + 10, -9, -Math.PI / 2, 7, 7, 8.4, 4, D0);
  house(b, SX - 10, -8, Math.PI / 2, 7, 7, 7, 1, D0);
  for (let i = 0; i < 5; i++) prop(b, kit, "hedge", SX - 10 + i * 4.5, D0, 9.5, 1.2, r() * 3);
  for (let i = 0; i < 16; i++) prop(b, kit, pick(["tree_oak", "tree_default"]), SX - 40 + r() * 80, D0, -22 - r() * 20, 7 + r() * 5, r() * 6);

  // ---- a room: floor, back and side walls (open top and front) ----
  const room = (cx: number, cz: number, h = 3.6, window = true, wm: THREE.Material = plaster) => {
    box(b, [cx - 5, D0 - 0.2, cz - 4], [cx + 5, D0 + 0.04, cz + 5], flags, 3);
    box(b, [cx - 5, D0, cz - 4.3], [cx + 5, D0 + h, cz - 4], wm, 4);
    for (const sx of [-1, 1]) box(b, [cx + sx * 5 - 0.15, D0, cz - 4.3], [cx + sx * 5 + 0.15, D0 + h, cz + 1.0], wm, 4);
    if (window) b.add(new THREE.PlaneGeometry(1.2, 1.9), win, new THREE.Matrix4().makeTranslation(cx - 2.4, D0 + 2.0, cz - 3.97));
  };
  room(KX, 0);
  box(b, [TABLE[0] - 1.3, D0, TABLE[2] - 0.6], [TABLE[0] + 1.3, D0 + 0.78, TABLE[2] + 0.6], darkWood, 2);
  box(b, [TABLE[0] - 1.36, D0 + 0.78, TABLE[2] - 0.66], [TABLE[0] + 1.36, D0 + 0.84, TABLE[2] + 0.66], lam("wtop030", () => ({ color: "#9a6a42" })), 2);
  // the court: a taller room, the throne on a step, a red carpet
  room(CT[0], CT[2], 4.4);
  box(b, [THRONE[0] - 1.4, D0, THRONE[2] - 1.0], [THRONE[0] + 1.4, D0 + 0.25, THRONE[2] + 0.9], gold, 2);
  box(b, [THRONE[0] - 0.55, D0 + 0.25, THRONE[2] - 0.55], [THRONE[0] + 0.55, D0 + 0.75, THRONE[2] + 0.35], velvet, 2);
  box(b, [THRONE[0] - 0.6, D0 + 0.25, THRONE[2] - 0.75], [THRONE[0] + 0.6, D0 + 2.6, THRONE[2] - 0.55], velvet, 2);
  box(b, [THRONE[0] - 0.66, D0 + 2.6, THRONE[2] - 0.78], [THRONE[0] + 0.66, D0 + 2.8, THRONE[2] - 0.52], gold, 2);
  for (const sx of [-1, 1]) box(b, [THRONE[0] + sx * 0.62 - 0.08, D0 + 0.25, THRONE[2] - 0.6], [THRONE[0] + sx * 0.62 + 0.08, D0 + 1.15, THRONE[2] + 0.35], gold, 1);
  box(b, [CT[0] - 0.7, D0 + 0.04, CT[2] - 1.6], [CT[0] + 1.5, D0 + 0.07, CT[2] + 5], carpet, 0);
  // the roofless hall from inside: tall plain walls, no window, the council table
  room(OH[0], OH[2], HH, false, plain);
  box(b, [OTABLE[0] - 1.6, D0, OTABLE[2] - 0.6], [OTABLE[0] + 1.6, D0 + 0.78, OTABLE[2] + 0.6], darkWood, 2);
  box(b, [OTABLE[0] - 1.66, D0 + 0.78, OTABLE[2] - 0.66], [OTABLE[0] + 1.66, D0 + 0.84, OTABLE[2] + 0.66], lam("wtop030", () => ({ color: "#9a6a42" })), 2);
  b.build(root);
  setSightLines([]);

  // ---- the dark hall: a closed unlit box (no fog, no shadows), seen from inside ----
  const dark = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 14), new THREE.MeshBasicMaterial({ map: darkTex(), side: THREE.BackSide, fog: false }));
  dark.position.set(DK[0], D0 + 3.06, DK[2]);
  root.add(dark);

  // ---- the town hall on the square: walls (a group that rises from the ground) and the roof (a group that lifts) ----
  const walls = new THREE.Group(), roof = new THREE.Group();
  walls.position.set(0, D0, 0);
  const wb = new Batch();
  const hallM = lam("hall030", () => ({ map: hallTex() }));
  const T = 0.3;
  // front wall along x at z = HZ with the door gap; UVs: one texture tile per 3.1 m across and HH up
  const wall = (x0: number, x1: number, y0: number, y1: number) => {
    const g = boxGeo(V(x0, y0, HZ - T), V(x1, y1, HZ), 0);
    const uv = g.getAttribute("uv") as THREE.BufferAttribute, pos = g.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + pos.getZ(i)) / 3.1, pos.getY(i) / HH);
    wb.add(g, hallM);
  };
  wall(-HWX, -DOORW, 0, HH); wall(DOORW, HWX, 0, HH); wall(-DOORW, DOORW, DOORH, HH);
  // the two side walls to the back corner
  for (const sx of [-1, 1]) {
    const ax = sx * HWX, dx = -ax, dz = HBZ - HZ, L = Math.hypot(dx, dz), th = Math.atan2(-dz / L, dx / L);
    const g = boxGeo(V(-L / 2, 0, -T / 2), V(L / 2, HH, T / 2), 0);
    const uv = g.getAttribute("uv") as THREE.BufferAttribute, pos = g.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 3.1, pos.getY(i) / HH);
    const m = new THREE.Matrix4().makeRotationY(th).setPosition(ax + dx / 2, 0, HZ + dz / 2);
    wb.add(g, hallM, m);
  }
  // the door frame, a step, and the dark doorway just inside (people walking in pass behind it)
  for (const sx of [-1, 1]) wb.add(boxGeo(V(sx * DOORW - 0.12, 0, HZ - 0.02), V(sx * DOORW + 0.12, DOORH + 0.1, HZ + 0.06), 0), darkWood);
  wb.add(boxGeo(V(-DOORW - 0.12, DOORH, HZ - 0.02), V(DOORW + 0.12, DOORH + 0.24, HZ + 0.06), 0), darkWood);
  wb.add(boxGeo(V(-DOORW - 0.3, 0, HZ), V(DOORW + 0.3, 0.14, HZ + 0.5), 0), lam("step030", () => ({ color: "#a89c86" })));
  wb.build(walls);
  const doorway = new THREE.Mesh(new THREE.PlaneGeometry(2 * DOORW + 0.1, DOORH + 0.1), new THREE.MeshBasicMaterial({ color: "#221d30" }));
  doorway.position.set(0, (DOORH + 0.1) / 2, HZ - T - 0.05);
  walls.add(doorway);
  walls.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
  root.add(walls);
  // the roof: a pyramid of three tiled faces over the triangle, with eaves, and a little flag on the top
  const rb = new Batch();
  const cz = (HZ + HZ + HBZ) / 3, apex = V(0, HH + HR, cz);
  const out = (x: number, z: number) => { const dx = x, dz = z - cz, n = Math.hypot(dx, dz); return V(x + (dx / n) * 0.6, HH - 0.25, z + (dz / n) * 0.6); };
  const A = out(-HWX, HZ), B = out(HWX, HZ), C = out(0, HBZ);
  const rm = roofMat("#a5523a");
  for (const [p, q2] of [[A, B], [B, C], [C, A]] as [THREE.Vector3, THREE.Vector3][]) rb.add(tri(p, q2, apex), rm);
  rb.add(tri(A, C, B), lam("soffit030", () => ({ color: "#5a3a26", side: THREE.DoubleSide })));
  rb.add(boxGeo(V(-0.05, HH + HR - 0.2, cz - 0.05), V(0.05, HH + HR + 1.6, cz + 0.05), 0), darkWood);
  rb.add(boxGeo(V(0.05, HH + HR + 1.0, cz - 0.02), V(0.9, HH + HR + 1.55, cz + 0.02), 0), lam("pennant030", () => ({ color: "#c0392b" })));
  rb.build(roof);
  roof.position.set(0, D0, 0);
  roof.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
  root.add(roof);
  void HBZ;
  return { walls, roof };
};
