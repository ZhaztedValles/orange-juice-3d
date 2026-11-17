// The places of the shipwreck lock: the Welsh beach (the sand slope into the sea, low dunes with marram grass behind,
// a few cottages and green hills far inland), the lab (an open-topped room: pale walls, a grey floor, the scanner
// cabinet with its dark window and green lamp, the desk with its monitor) and the museum room (open-topped: dark
// green panelled walls, a plank floor, the work table, the display case on its plinth, framed pictures).
import * as THREE from "three";
import { Batch, V, lam, prop, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, planks, beam, stone, ctex } from "../../src/engine/paint";
import { D0, SEA_Y, LAB, DESK, SCAN, MUS, TABLE, CASE } from "./story";

/** a panelled wall: base colour below a rail, upper colour above */
const panel = (key: string, up: string, low: string, seam: string, rail: string) => ctex(key, 512, 512, (g) => {
  g.fillStyle = up; g.fillRect(0, 0, 512, 512);
  g.fillStyle = low; g.fillRect(0, 300, 512, 212);
  g.fillStyle = seam; for (let x = 0; x < 512; x += 128) g.fillRect(x, 300, 6, 212);
  g.fillStyle = rail; g.fillRect(0, 292, 512, 12);
});
/** the lab floor: pale grey tiles */
const tiles = () => ctex("labTiles", 256, 256, (g) => {
  g.fillStyle = "#c9ccd0"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#a9adb4"; for (let k = 0; k < 256; k += 64) { g.fillRect(k, 0, 3, 256); g.fillRect(0, k, 256, 3); }
});
/** wet sand near the water: darker, smoother, with a few shell flecks */
const wetSand = () => ctex("wetSand", 512, 512, (g, r) => {
  g.fillStyle = "#b39466"; g.fillRect(0, 0, 512, 512);
  const cols = ["#a88a5c", "#bd9f70", "#9f8257"];
  for (let i = 0; i < 900; i++) { g.fillStyle = cols[i % 3]; const x = r() * 512, y = r() * 512, s = 4 + r() * 12; g.beginPath(); g.ellipse(x, y, s * 1.8, s * 0.5, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#efe6d6"; for (let i = 0; i < 60; i++) g.fillRect(r() * 512, r() * 512, 3, 2);
});

export type Town = { lamp: THREE.Mesh };

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []): Town => {
  const b = new Batch(), r = rng(141);
  const wood = lam("deskWood", () => ({ map: planks() }));
  const post = lam("postWood", () => ({ map: beam() }));
  const dark = lam("doorDark", () => ({ color: "#3a2a26" }));

  // ---- the beach: the slope from z = -6 (D0) down past the water line, in 1 m strips that abut ----
  const wet = lam("wetSandM", () => ({ map: wetSand() }));
  for (let k = 0; k < 4; k++) {
    const z0 = -6 - k * 6, z1 = z0 - 6, y0 = D0 - (k * 6) / 9, y1 = D0 - ((k + 1) * 6) / 9;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([-150, y0, z0, 150, y0, z0, 150, y1, z1, -150, y1, z1], 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0.99, 0.11, 0, 0.99, 0.11, 0, 0.99, 0.11, 0, 0.99, 0.11], 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 75, 0, 75, 3, 0, 3], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    b.add(g, wet);
  }
  setSightLines(rays);
  // low dunes behind the beach, tufts of marram grass on them
  const duneM = lam("dune", () => ({ color: "#d9c08e" }));
  for (let k = 0; k < 16; k++) {
    const x = -90 + k * 12 + r() * 6, z = 22 + r() * 10, s = 5 + r() * 4;
    const d = new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    b.add(d, duneM, new THREE.Matrix4().compose(V(x, D0 - 0.05, z), new THREE.Quaternion(), V(s * 1.6, 1.4 + r() * 1.2, s)));
  }
  for (let i = 0; i < 70; i++) {
    const x = -70 + r() * 140, z = 12 + r() * 22;
    prop(b, kit, i % 3 ? "grass_large" : "grass", x, D0, z, 0.6 + r() * 0.5, r() * 6);
  }
  // cottages far inland and the green hills behind them
  const wall = lam("cotWall", () => ({ map: stone("cotWall", ["#efe8da", "#e6ddcc", "#f2ecdf", "#ddd2be"]) }));
  const slate = lam("cotRoof", () => ({ color: "#5c6170" }));
  for (let k = 0; k < 7; k++) {
    const hx = -60 + k * 19 + r() * 6, hz = 70 + r() * 10, w = 7 + r() * 3, h = 4 + r() * 1.5;
    b.add(boxGeo(V(hx - w / 2, D0, hz), V(hx + w / 2, D0 + h, hz + 5), 2), wall);
    const roof = new THREE.CylinderGeometry(0.01, 3.2, w, 3, 1);
    roof.rotateZ(Math.PI / 2); roof.scale(1, 0.7, 1);
    b.add(roof, slate, new THREE.Matrix4().makeTranslation(hx, D0 + h + 1.0, hz + 2.5));
    b.add(boxGeo(V(hx - 0.5, D0, hz - 0.05), V(hx + 0.5, D0 + 1.9, hz), 1), dark);
  }
  const hillM = lam("hill", () => ({ color: "#7e9a5a" }));
  for (let k = 0; k < 7; k++) {
    const x = -160 + k * 55, s = 40 + (k % 3) * 14;
    b.add(new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), hillM, new THREE.Matrix4().compose(V(x, D0 - 0.2, 150 + (k % 2) * 25), new THREE.Quaternion(), V(s, 14 + (k % 3) * 6, s * 0.6)));
  }
  setSightLines([]);

  // ---- a room: floor, back and side walls, the cornice; the sun-side wall casts no shadow into it ----
  const nb = new Batch();
  const room = (ox: number, oz: number, wallM: THREE.Material, floorM: THREE.Material) => {
    b.add(boxGeo(V(ox - 6, D0 - 0.2, oz - 4.2), V(ox + 6, D0 + 0.08, oz + 7), 2), floorM);
    b.add(boxGeo(V(ox - 6, D0, oz - 4.2), V(ox + 6, D0 + 4.2, oz - 3.9), 2), wallM);
    b.add(boxGeo(V(ox - 6, D0, oz - 3.9), V(ox - 5.7, D0 + 4.2, oz + 7), 2), wallM);
    nb.add(boxGeo(V(ox + 5.7, D0, oz - 3.9), V(ox + 6, D0 + 4.2, oz + 7), 2), wallM);
    b.add(boxGeo(V(ox - 6, D0 + 4.2, oz - 4.3), V(ox + 6, D0 + 4.4, oz - 3.8), 1), post);
  };

  // ---- the lab ----
  const [lx, , lz] = LAB;
  room(lx, lz, lam("labWall", () => ({ map: panel("labPanel", "#e9ecef", "#9fb3c2", "#7f93a2", "#5d6f7e") })), lam("labFloor", () => ({ map: tiles() })));
  const steel = lam("steel", () => ({ color: "#aeb4bc" })), steelD = lam("steelD", () => ({ color: "#5b6270" })), glassD = lam("glassD", () => ({ color: "#23303a" }));
  const yellow = lam("hazard", () => ({ color: "#e0b43a" }));
  const [sx, , sz] = SCAN;
  b.add(boxGeo(V(sx - 0.75, D0 + 0.08, sz - 0.65), V(sx + 0.75, D0 + 1.95, sz + 0.65), 1), steel); // the cabinet
  b.add(boxGeo(V(sx - 0.55, D0 + 0.85, sz + 0.65), V(sx + 0.55, D0 + 1.7, sz + 0.69), 1), steelD); // the door
  b.add(boxGeo(V(sx - 0.42, D0 + 0.98, sz + 0.69), V(sx + 0.42, D0 + 1.57, sz + 0.71), 1), glassD); // its window
  b.add(boxGeo(V(sx - 0.75, D0 + 0.08, sz + 0.65), V(sx + 0.75, D0 + 0.22, sz + 0.69), 1), yellow); // the kick strip
  b.add(boxGeo(V(sx + 0.6, D0 + 0.95, sz + 0.69), V(sx + 0.66, D0 + 1.6, sz + 0.75), 1), steelD); // the handle
  const [dx, , dz] = DESK;
  b.add(boxGeo(V(dx - 0.9, D0 + 0.74, dz - 0.45), V(dx + 0.9, D0 + 0.8, dz + 0.45), 1), lam("labDesk", () => ({ color: "#e4e2dc" })));
  for (const ex of [-0.85, 0.8]) for (const ez of [-0.4, 0.35]) b.add(boxGeo(V(dx + ex, D0 + 0.08, dz + ez), V(dx + ex + 0.05, D0 + 0.74, dz + ez + 0.05), 1), steelD);
  b.add(boxGeo(V(dx - 0.45, D0 + 0.95, dz - 0.25), V(dx + 0.45, D0 + 1.47, dz - 0.19), 1), steelD); // the monitor
  b.add(boxGeo(V(dx - 0.05, D0 + 0.8, dz - 0.27), V(dx + 0.05, D0 + 0.95, dz - 0.2), 1), steelD); // its stand
  b.add(boxGeo(V(dx - 0.3, D0 + 0.8, dz + 0.05), V(dx + 0.25, D0 + 0.82, dz + 0.22), 1), steelD); // the keyboard
  // shelves with boxes on the back wall
  for (const y of [1.6, 2.3]) {
    b.add(boxGeo(V(lx - 4.6, D0 + y, lz - 3.9), V(lx - 2.2, D0 + y + 0.05, lz - 3.55), 1), wood);
    for (let k = 0; k < 4; k++) b.add(boxGeo(V(lx - 4.5 + k * 0.6, D0 + y + 0.05, lz - 3.85), V(lx - 4.1 + k * 0.6, D0 + y + 0.32, lz - 3.6), 1), lam(`box${k % 3}`, () => ({ color: ["#c9a06a", "#7f93a2", "#d8d2c4"][k % 3] })));
  }

  // ---- the museum room ----
  const [mx, , mz] = MUS;
  room(mx, mz, lam("musWall", () => ({ map: panel("musPanel", "#e8d9b8", "#3f5a46", "#2c3f32", "#6a4a30") })), lam("musFloor", () => ({ map: planks() })));
  const [tx, , tz] = TABLE;
  b.add(boxGeo(V(tx - 0.9, D0 + 0.76, tz - 0.5), V(tx + 0.9, D0 + 0.84, tz + 0.5), 1), wood);
  for (const ex of [-0.85, 0.8]) for (const ez of [-0.45, 0.4]) b.add(boxGeo(V(tx + ex, D0 + 0.08, tz + ez), V(tx + ex + 0.06, D0 + 0.76, tz + ez + 0.06), 1), post);
  b.add(boxGeo(V(tx - 0.35, D0 + 0.84, tz - 0.3), V(tx + 0.35, D0 + 0.86, tz + 0.1), 1), lam("feltMat", () => ({ color: "#2f4a6a" }))); // the felt mat
  const [cx, , cz] = CASE;
  const plinth = lam("plinth", () => ({ color: "#efe6d2" })), frame = lam("caseFrame", () => ({ color: "#3a3640" }));
  b.add(boxGeo(V(cx - 0.45, D0 + 0.08, cz - 0.45), V(cx + 0.45, D0 + 1.0, cz + 0.45), 1), plinth);
  b.add(boxGeo(V(cx - 0.42, D0 + 1.0, cz - 0.42), V(cx + 0.42, D0 + 1.03, cz + 0.42), 1), lam("caseFelt", () => ({ color: "#6a2e3a" })));
  for (const ex of [-0.42, 0.39]) for (const ez of [-0.42, 0.39]) b.add(boxGeo(V(cx + ex, D0 + 1.0, cz + ez), V(cx + ex + 0.03, D0 + 1.62, cz + ez + 0.03), 1), frame);
  b.add(boxGeo(V(cx - 0.45, D0 + 1.62, cz - 0.45), V(cx + 0.45, D0 + 1.66, cz + 0.45), 1), frame);
  // framed pictures on the back wall: a ship and a coin
  const pic = (key: string, draw: (g: CanvasRenderingContext2D) => void) => lam(key, () => ({ map: ctex(key + "T", 256, 192, (g) => { g.fillStyle = "#f6ecd2"; g.fillRect(0, 0, 256, 192); draw(g); g.strokeStyle = "#5a3b2a"; g.lineWidth = 16; g.strokeRect(0, 0, 256, 192); }) }));
  b.add(boxGeo(V(mx - 4.6, D0 + 1.9, mz - 3.9), V(mx - 2.8, D0 + 3.25, mz - 3.84), 1), pic("picShip", (g) => {
    g.fillStyle = "#6a9ac2"; g.fillRect(16, 120, 224, 56);
    g.fillStyle = "#5b3a29"; g.beginPath(); g.moveTo(60, 120); g.lineTo(196, 120); g.lineTo(176, 146); g.lineTo(78, 146); g.fill();
    g.fillStyle = "#f1e8d2"; g.beginPath(); g.moveTo(126, 40); g.lineTo(126, 114); g.lineTo(80, 114); g.fill(); g.beginPath(); g.moveTo(132, 52); g.lineTo(132, 114); g.lineTo(178, 114); g.fill();
  }));
  b.add(boxGeo(V(mx + 0.4, D0 + 2.0, mz - 3.9), V(mx + 1.8, D0 + 3.05, mz - 3.84), 1), pic("picCoin", (g) => {
    g.fillStyle = "#d9b45a"; g.beginPath(); g.arc(128, 96, 56, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#8a6a2a"; g.lineWidth = 8; g.beginPath(); g.arc(128, 96, 42, 0, Math.PI * 2); g.stroke();
  }));
  void r;

  b.build(root);
  nb.build(root, false);
  setSightLines([]);
  // the scanner's lamp: a small HDR emissive for the bloom
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 2.6, 0.9), fog: false }));
  lamp.position.set(sx + 0.45, D0 + 1.8, sz + 0.68);
  root.add(lamp);
  void SEA_Y;
  return { lamp };
};
