// The places of the ghost story: the Polytechnic theatre (an open-topped hall: plank stage with a painted study set,
// red proscenium and curtains, footlights, the orchestra pit in front of the stage behind its low screen, benches
// rising to the back wall); Regent Street (cobbles, pavements, terraces, the Polytechnic front with its columns and a
// ghost poster); Dircks's office (open-topped, panelled, a table, a model theatre on it); the kitchen of the analogy
// (open-topped room with a big window in its garden wall, the garden outside at dusk). The ground is laid round the
// rooms (abutting, never stacked). The glass, lamps and cast live in world.ts / cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, cobble, planks, grassHD, beam } from "../../src/engine/paint";
import {
  D0, HW, STAGE_Z0, STAGE_Z1, HALL_Z1, SY, PIT_W, PIT_Z1, PY, SCREEN_Y, ROWS, SEAT_Y, ST, POLY_Z, CART, OFF, KIT,
} from "./story";

/** the stage set's back wall: a scholar's study, dark green paper, a fireplace, a tall window, a portrait */
const setWall = () => ctex("setWall020", 512, 512, (g, r) => {
  g.fillStyle = "#3f5a4c"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#4a6857"; for (let x = 0; x < 512; x += 32) g.fillRect(x, 0, 12, 400);
  g.fillStyle = "#5a3a28"; g.fillRect(0, 400, 512, 112); g.fillStyle = "#c9a047"; g.fillRect(0, 394, 512, 8);
  g.fillStyle = "#2c3650"; g.fillRect(330, 90, 110, 220); g.fillStyle = "#e9dcb4"; g.fillRect(330, 196, 110, 8); g.fillRect(381, 90, 8, 220);
  g.lineWidth = 10; g.strokeStyle = "#6a4a30"; g.strokeRect(330, 90, 110, 220);
  g.fillStyle = "#8a7a66"; g.fillRect(60, 300, 170, 100); g.fillStyle = "#1e1a1e"; g.fillRect(95, 330, 100, 70);
  g.fillStyle = "#e08a3a"; g.beginPath(); g.ellipse(145, 385, 30, 12, 0, 0, 7); g.fill();
  g.fillStyle = "#6a4a30"; g.fillRect(40, 290, 210, 14);
  g.fillStyle = "#c9a047"; g.fillRect(100, 120, 90, 120); g.fillStyle = "#7a4a3a"; g.fillRect(110, 130, 70, 100);
  g.fillStyle = "#e2c9a6"; g.beginPath(); g.ellipse(145, 170, 18, 22, 0, 0, 7); g.fill();
  void r;
});
/** the hall walls: deep red below a gilt rail, cream above with pilasters */
const hallWall = () => ctex("hallWall020", 512, 512, (g) => {
  g.fillStyle = "#e6d6b4"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#d8c49c"; for (let x = 40; x < 512; x += 128) g.fillRect(x, 0, 40, 330);
  g.fillStyle = "#7e2a2a"; g.fillRect(0, 330, 512, 182);
  g.fillStyle = "#5e1e20"; for (let x = 0; x < 512; x += 128) g.fillRect(x, 330, 6, 182);
  g.fillStyle = "#c9a047"; g.fillRect(0, 320, 512, 14);
});
/** red velvet with vertical folds */
const velvet = () => ctex("velvet020", 256, 256, (g) => {
  for (let x = 0; x < 256; x++) { const k = 0.75 + 0.25 * Math.sin(x / 8); g.fillStyle = `rgb(${Math.round(170 * k)},${Math.round(38 * k)},${Math.round(44 * k)})`; g.fillRect(x, 0, 1, 256); }
});
/** the office panelling: warm wood panels under cream plaster */
const officeWall = () => ctex("officeWall020", 512, 512, (g) => {
  g.fillStyle = "#e9ddc2"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#7a5634"; g.fillRect(0, 300, 512, 212);
  g.fillStyle = "#8f6a44"; for (let x = 16; x < 512; x += 128) g.fillRect(x, 320, 96, 170);
  g.fillStyle = "#5a3e26"; g.fillRect(0, 292, 512, 10);
});
/** the kitchen: pale yellow plaster, a blue-and-white tile band */
const kitchenWall = () => ctex("kitWall020", 512, 512, (g) => {
  g.fillStyle = "#efdca8"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 32) for (let y = 330; y < 420; y += 32) { g.fillStyle = (x + y) % 64 ? "#f4f1ea" : "#5a86b8"; g.fillRect(x + 1, y + 1, 30, 30); }
});
/** the Polytechnic front: pale stone with joints */
const polyStone = () => ctex("polyStone020", 512, 512, (g) => {
  g.fillStyle = "#ddd3c0"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#c9bda6"; for (let y = 0; y < 512; y += 48) g.fillRect(0, y, 512, 3);
  for (let y = 0; y < 512; y += 48) for (let x = (y / 48) % 2 ? 0 : 64; x < 512; x += 128) g.fillRect(x, y, 3, 48);
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
  const b = new Batch(), nb = new Batch(), r = rng(1862);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const grass = lam("grassHD", () => ({ map: grassHD() }));
  const boards = lam("boards020", () => ({ map: planks() }));
  const post = lam("post020", () => ({ map: beam() }));
  const gilt = lam("gilt020", () => ({ color: "#c9a047" }));
  const red = lam("velvet020", () => ({ map: velvet() }));
  const hall = lam("hallWall020", () => ({ map: hallWall() }));
  const dark = lam("pitDark020", () => ({ color: "#3a3036" }));
  const bench = lam("bench020", () => ({ color: "#7a5236" }));

  setSightLines([]);
  // ---- ground round the rooms: four abutting quads round the hall, the rest open ----
  const HX0 = -HW - 0.4, HX1 = HW + 0.4, HZ0 = STAGE_Z0 - 0.4, HZ1 = HALL_Z1 + 0.4;
  b.add(flat(-700, 700, -700, HZ0, D0, 4, 50, 40), grass);
  b.add(flat(-700, 700, HZ1, 700, D0, 4, 50, 40), grass);
  b.add(flat(-700, HX0, HZ0, HZ1, D0, 4, 30, 4), grass);
  b.add(flat(HX1, 700, HZ0, HZ1, D0, 4, 30, 4), grass);

  // ---- the theatre hall ----
  // the floor of the seats (from the pit screen to the back wall), the stage, the pit
  b.add(boxGeo(V(-HW, D0 - 0.3, PIT_Z1), V(HW, D0, HALL_Z1), 2), boards);
  b.add(boxGeo(V(-HW, D0 - 0.3, STAGE_Z0), V(HW, SY, STAGE_Z1), 2), boards); // the stage block (top = SY)
  b.add(boxGeo(V(-HW, PY - 0.3, STAGE_Z1), V(-PIT_W, D0, PIT_Z1), 2), boards); // floor beside the pit (left)
  b.add(boxGeo(V(PIT_W, PY - 0.3, STAGE_Z1), V(HW, D0, PIT_Z1), 2), boards); // (right)
  b.add(boxGeo(V(-PIT_W, PY - 0.3, STAGE_Z1), V(PIT_W, PY, PIT_Z1), 2), dark); // the pit floor
  b.add(boxGeo(V(-PIT_W, PY, PIT_Z1), V(PIT_W, SCREEN_Y, PIT_Z1 + 0.2), 1), lam("screen020", () => ({ color: "#5a2226" }))); // the pit screen
  b.add(boxGeo(V(-PIT_W, SCREEN_Y, PIT_Z1 - 0.05), V(PIT_W, SCREEN_Y + 0.08, PIT_Z1 + 0.25), 1), gilt);
  // the stage set: back wall and two side flats
  b.add(boxGeo(V(-6.5, SY, STAGE_Z0 + 0.4), V(6.5, SY + 6.2, STAGE_Z0 + 0.6), 6.5), lam("setWall020", () => ({ map: setWall() })));
  b.add(boxGeo(V(-6.7, SY, STAGE_Z0 + 0.4), V(-6.5, SY + 6.2, STAGE_Z1 - 1.6), 3), lam("setSide020", () => ({ color: "#3f5a4c" })));
  b.add(boxGeo(V(6.5, SY, STAGE_Z0 + 0.4), V(6.7, SY + 6.2, STAGE_Z1 - 1.6), 3), lam("setSide020", () => ({ color: "#3f5a4c" })));
  // a study table and a chair on the set
  b.add(boxGeo(V(-3.6, SY + 0.75, -6.6), V(-1.8, SY + 0.85, -5.7), 1), post);
  for (const [x, z] of [[-3.5, -6.5], [-1.9, -6.5], [-3.5, -5.8], [-1.9, -5.8]]) b.add(boxGeo(V(x - 0.05, SY, z - 0.05), V(x + 0.05, SY + 0.75, z + 0.05), 1), post);
  b.add(boxGeo(V(-3.0, SY + 0.85, -6.3), V(-2.6, SY + 1.15, -6.0), 1), lam("book020", () => ({ color: "#8a2e2a" })));
  // the proscenium: two red-and-gilt columns and the top beam (the hall itself is open to the sky)
  for (const s of [-1, 1]) {
    b.add(boxGeo(V(s * 6.0 - 0.6, D0, STAGE_Z1 - 0.5), V(s * 6.0 + 0.6, SY + 6.4, STAGE_Z1 + 0.1), 2), red);
    b.add(boxGeo(V(s * 6.0 - 0.7, SY + 6.4, STAGE_Z1 - 0.6), V(s * 6.0 + 0.7, SY + 6.7, STAGE_Z1 + 0.2), 1), gilt);
    b.add(boxGeo(V(s * 6.6 - (s > 0 ? 0 : 2.4), SY, STAGE_Z1 - 1.0), V(s * 6.6 + (s > 0 ? 2.4 : 0), SY + 6.4, STAGE_Z1 - 0.6), 2), red); // wings
    // a gathered curtain each side of the opening
    b.add(boxGeo(V(s * 5.0 - 0.45, SY, STAGE_Z1 - 0.9), V(s * 5.0 + 0.45, SY + 6.0, STAGE_Z1 - 0.6), 1), red);
  }
  b.add(boxGeo(V(-6.6, SY + 6.4, STAGE_Z1 - 0.6), V(6.6, SY + 7.3, STAGE_Z1 + 0.2), 2), red);
  b.add(boxGeo(V(-6.6, SY + 6.3, STAGE_Z1 - 0.62), V(6.6, SY + 6.42, STAGE_Z1 + 0.22), 1), gilt);
  // the benches: a seat and a back per row, an aisle in the middle
  for (const z of ROWS) for (const [x0, x1] of [[-7.6, -0.8], [0.8, 7.6]] as const) {
    b.add(boxGeo(V(x0, SEAT_Y - 0.08, z - 0.2), V(x1, SEAT_Y, z + 0.25), 1), bench);
    b.add(boxGeo(V(x0, D0, z - 0.12), V(x0 + 0.12, SEAT_Y - 0.08, z + 0.15), 1), bench);
    b.add(boxGeo(V(x1 - 0.12, D0, z - 0.12), V(x1, SEAT_Y - 0.08, z + 0.15), 1), bench);
    b.add(boxGeo(V(x0, SEAT_Y, z + 0.3), V(x1, SEAT_Y + 0.5, z + 0.38), 1), bench);
  }
  // the hall walls (no shadows: the room is open to the sky and the sun must reach in)
  nb.add(boxGeo(V(-HW - 0.3, D0 - 0.3, STAGE_Z0), V(-HW, SY + 7.5, HALL_Z1 + 0.3), 4), hall);
  nb.add(boxGeo(V(HW, D0 - 0.3, STAGE_Z0), V(HW + 0.3, SY + 7.5, HALL_Z1 + 0.3), 4), hall);
  nb.add(boxGeo(V(-HW, D0 - 0.3, HALL_Z1), V(HW, SY + 7.5, HALL_Z1 + 0.3), 4), hall);
  nb.add(boxGeo(V(-HW, D0 - 0.3, STAGE_Z0 - 0.3), V(HW, SY + 7.5, STAGE_Z0), 4), hall);
  // the pit's side walls and its stage-side face (the stage front)
  nb.add(boxGeo(V(-PIT_W - 0.1, PY, STAGE_Z1), V(-PIT_W, D0, PIT_Z1), 1), dark);
  nb.add(boxGeo(V(PIT_W, PY, STAGE_Z1), V(PIT_W + 0.1, D0, PIT_Z1), 1), dark);
  // the stagehands' ladder at the right of the stage
  for (const dx of [0, 0.5]) b.add(boxGeo(V(7.6 + dx, SY, -3.2), V(7.66 + dx, SY + 3.2, -3.14), 1), post);
  for (let k = 0; k < 7; k++) b.add(boxGeo(V(7.6, SY + 0.35 + k * 0.42, -3.2), V(8.16, SY + 0.4 + k * 0.42, -3.14), 1), post);

  // ---- Regent Street ----
  const road = lam("cobRoad", () => ({ map: cobble() })), walk = lam("walk020", () => ({ color: "#b9ae9c" })), curb = lam("curb020", () => ({ color: "#a29a8c" }));
  const [sx, , sz] = ST, LEN = 200;
  b.add(boxGeo(V(sx - LEN / 2, D0 - 0.2, sz - 4.5), V(sx + LEN / 2, D0 + 0.08, sz + 4.5), 2), road);
  for (const s of [-1, 1]) {
    b.add(boxGeo(V(sx - LEN / 2, D0 - 0.2, s < 0 ? sz - 8.4 : sz + 4.5), V(sx + LEN / 2, D0 + 0.18, s < 0 ? sz - 4.5 : sz + 8.4), 2), walk);
    b.add(boxGeo(V(sx - LEN / 2, D0 + 0.18, s < 0 ? sz - 4.6 : sz + 4.4), V(sx + LEN / 2, D0 + 0.22, s < 0 ? sz - 4.4 : sz + 4.6), 2), curb);
  }
  // the Polytechnic front (built before the sight lines: the camera looks at it)
  const stoneM = lam("polyStone020", () => ({ map: polyStone() })), stoneT = lam("polyTrim020", () => ({ color: "#cfc4ae" }));
  b.add(boxGeo(V(sx - 10, D0 + 0.18, POLY_Z - 4), V(sx + 10, D0 + 13, POLY_Z + 3.8), 4), stoneM);
  b.add(boxGeo(V(sx - 10.4, D0 + 13, POLY_Z - 4.2), V(sx + 10.4, D0 + 13.8, POLY_Z + 4.2), 1), stoneT);
  for (let i = 0; i < 4; i++) { const c = new THREE.CylinderGeometry(0.42, 0.48, 7.5, 12); c.translate(sx - 4.5 + i * 3, D0 + 4.0, POLY_Z + 4.6); b.add(c, stoneT); }
  b.add(boxGeo(V(sx - 6.4, D0 + 7.75, POLY_Z + 3.8), V(sx + 6.4, D0 + 8.6, POLY_Z + 5.4), 1), stoneT);
  b.add(boxGeo(V(sx - 1.4, D0 + 0.18, POLY_Z + 3.82), V(sx + 1.4, D0 + 3.6, POLY_Z + 3.9), 1), lam("polyDoor020", () => ({ color: "#4a2e22" })));
  for (const dx of [-6.8, -3.4, 3.4, 6.8]) for (const wy of [4.6, 9.4]) if (Math.abs(dx) > 4 || wy > 8)
    b.add(boxGeo(V(sx + dx - 0.7, D0 + wy, POLY_Z + 3.82), V(sx + dx + 0.7, D0 + wy + 2.2, POLY_Z + 3.9), 1), lam("polyWin020", () => ({ color: "#3d4a66" })));
  setSightLines(rays);
  for (const s of [-1, 1]) {
    let x = sx - LEN / 2 + 2;
    while (x < sx + LEN / 2 - 4) {
      const w = pick([6, 7, 8]);
      if (!(s < 0 && Math.abs(x + w / 2 - sx) < 14.5)) house(b, x + w / 2, sz + s * 12.4, s < 0 ? 0 : Math.PI, w, 8, pick([9.8, 8.4, 9.8]), pick([1, 2, 4, 5]), D0 + 0.12);
      x += w + 0.15;
    }
    for (let lx = sx - LEN / 2 + 6; lx < sx + LEN / 2; lx += 14) prop(b, kit, "lantern", lx, D0 + 0.18, sz + s * 5.0, 3.0);
  }
  prop(b, kit, "cart", CART[0] + 0.8, D0 + 0.18, CART[2] - 0.4, 1.6, 0.3);

  // ---- Dircks's office (open-topped) ----
  setSightLines([]);
  const [ox, , oz] = OFF;
  const ow = lam("officeWall020", () => ({ map: officeWall() }));
  b.add(boxGeo(V(ox - 7, D0 - 0.2, oz - 5), V(ox + 7, D0 + 0.05, oz + 7), 2), boards);
  b.add(boxGeo(V(ox - 7, D0, oz - 5.3), V(ox + 7, D0 + 4.6, oz - 5), 3), ow);
  b.add(boxGeo(V(ox - 7.3, D0, oz - 5.3), V(ox - 7, D0 + 4.6, oz + 7), 3), ow);
  nb.add(boxGeo(V(ox + 7, D0, oz - 5.3), V(ox + 7.3, D0 + 4.6, oz + 7), 3), ow);
  // the table (its top at D0 + 0.85) and a bookcase
  b.add(boxGeo(V(ox - 1.6, D0 + 0.78, oz - 1.9), V(ox + 1.8, D0 + 0.88, oz - 0.5), 1), post);
  for (const [x, z] of [[-1.5, -1.8], [1.7, -1.8], [-1.5, -0.6], [1.7, -0.6]]) b.add(boxGeo(V(ox + x - 0.06, D0, oz + z - 0.06), V(ox + x + 0.06, D0 + 0.78, oz + z + 0.06), 1), post);
  b.add(boxGeo(V(ox - 5.5, D0, oz - 5.0), V(ox - 3.0, D0 + 3.2, oz - 4.4), 1), post);
  const spines = [lam("sp1", () => ({ color: "#8a2e2a" })), lam("sp2", () => ({ color: "#2f4a6a" })), lam("sp3", () => ({ color: "#5d7a3a" }))];
  for (let k = 0; k < 3; k++) for (let i = 0; i < 10; i++) b.add(boxGeo(V(ox - 5.4 + i * 0.24, D0 + 0.6 + k * 0.95, oz - 4.42), V(ox - 5.2 + i * 0.24, D0 + 1.2 + k * 0.95, oz - 4.36), 1), spines[(i + k) % 3]);
  // the model theatre on the table: a box with a dark opening, a red frame and a tiny glass
  b.add(boxGeo(V(ox - 1.4, D0 + 0.88, oz - 1.6), V(ox - 0.4, D0 + 1.5, oz - 1.0), 1), lam("model020", () => ({ color: "#5a3a28" })));
  b.add(boxGeo(V(ox - 1.3, D0 + 0.98, oz - 0.99), V(ox - 0.5, D0 + 1.4, oz - 0.97), 1), lam("modelHole020", () => ({ color: "#1e1a24" })));
  b.add(boxGeo(V(ox - 1.42, D0 + 1.4, oz - 1.0), V(ox - 0.38, D0 + 1.5, oz - 0.95), 1), red);

  // ---- the kitchen and its garden (the window wall faces +z at KZ) ----
  const [kx, , kz] = KIT;
  const kw = lam("kitWall020", () => ({ map: kitchenWall() }));
  b.add(boxGeo(V(kx - 4, D0 - 0.2, kz - 5), V(kx + 4, D0 + 0.05, kz), 2), lam("kitFloor020", () => ({ color: "#b8865a" })));
  const WX = 1.3, WY0 = D0 + 0.95, WY1 = D0 + 2.65;
  nb.add(boxGeo(V(kx - 4, D0, kz - 0.25), V(kx - WX, D0 + 3.6, kz), 2), kw);
  nb.add(boxGeo(V(kx + WX, D0, kz - 0.25), V(kx + 4, D0 + 3.6, kz), 2), kw);
  nb.add(boxGeo(V(kx - WX, D0, kz - 0.25), V(kx + WX, WY0, kz), 2), kw);
  nb.add(boxGeo(V(kx - WX, WY1, kz - 0.25), V(kx + WX, D0 + 3.6, kz), 2), kw);
  nb.add(boxGeo(V(kx - 4.3, D0, kz - 5), V(kx - 4, D0 + 3.6, kz), 2), kw);
  nb.add(boxGeo(V(kx + 4, D0, kz - 5), V(kx + 4.3, D0 + 3.6, kz), 2), kw);
  const frame = lam("frame020", () => ({ color: "#f2ede0" }));
  b.add(boxGeo(V(kx - WX - 0.08, WY0 - 0.1, kz - 0.4), V(kx + WX + 0.08, WY0, kz + 0.05), 1), frame); // the sill
  b.add(boxGeo(V(kx - 0.04, WY0, kz - 0.14), V(kx + 0.04, WY1, kz - 0.1), 1), frame); // glazing bars
  b.add(boxGeo(V(kx - WX, (WY0 + WY1) / 2 - 0.04, kz - 0.14), V(kx + WX, (WY0 + WY1) / 2 + 0.04, kz - 0.1), 1), frame);
  // a dresser with plates and a table inside
  b.add(boxGeo(V(kx + 2.4, D0, kz - 4.9), V(kx + 3.9, D0 + 1.9, kz - 4.4), 1), lam("dresser020", () => ({ color: "#5a86b8" })));
  b.add(boxGeo(V(kx - 3.2, D0 + 0.8, kz - 3.4), V(kx - 1.6, D0 + 0.9, kz - 2.2), 1), post);
  for (const [x, z] of [[-3.1, -3.3], [-1.7, -3.3], [-3.1, -2.3], [-1.7, -2.3]]) b.add(boxGeo(V(kx + x - 0.05, D0, kz + z - 0.05), V(kx + x + 0.05, D0 + 0.8, kz + z + 0.05), 1), post);
  // the garden: hedges, a path, trees in the dusk
  setSightLines(rays);
  for (let i = 0; i < 10; i++) prop(b, kit, "hedge", kx - 9 + i * 2, D0, kz + 9, 1.2, 0);
  for (let i = 0; i < 14; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), kx - 26 + r() * 52, D0, kz + 14 + r() * 20, 6 + r() * 5, r() * 6);
  for (let i = 0; i < 8; i++) prop(b, kit, "plant_bush", kx - 6 + r() * 12, D0, kz + 2.5 + r() * 5, 0.6 + r() * 0.5, r() * 6);

  // low hills far off, trees round the places
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" }))];
  ([[-300, -620, 240, 40, 120], [260, -660, 260, 46, 140], [500, 600, 200, 40, 160], [-200, 640, 220, 44, 140]] as const)
    .forEach(([x, zz, a, h, c], i) => b.add(hill, hm[i % 2], new THREE.Matrix4().compose(V(x, D0 - 2, zz), new THREE.Quaternion(), V(a, h, c))));
  b.build(root);
  nb.build(root, false);
  setSightLines([]);
  return {};
};
