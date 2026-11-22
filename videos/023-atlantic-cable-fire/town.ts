// The land of the cable story: one raised block of grass (its edge is a low quay wall into the sea), City Hall Park
// (the marble hall: two wings, the centre block with its columns and steps, the clock stage and the cupola, a gravel
// forecourt, trees and lamps), the telegraph office (an open set: plank floor, panelled back wall with a window, the
// desk with its instrument, Whitehouse's battery bench) and the garden of the analogy (a cottage, hedges, the tap
// post). The cupola is built twice, whole and burnt, as separate groups the world switches per shot. The sea and the
// ships live in world.ts; the cast and the drawn props live in cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, grassHD, stoneHD, planksHD } from "../../src/engine/paint";
import { D0, HALL, OFF, DESK_Y, HOME, BATT } from "./story";

/** one storey of the marble facade (4 m x 4 m per tile): pale stone, a tall arched window with a light frame, a ledge */
const facadeTex = () => ctex("hallFacade023", 256, 256, (g) => {
  g.fillStyle = "#e6dcc6"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#d8ccb2"; g.fillRect(0, 0, 18, 256); g.fillRect(238, 0, 18, 256);
  g.fillStyle = "#cfc2a6"; g.fillRect(0, 226, 256, 30);
  g.fillStyle = "#f2ead8"; g.fillRect(84, 54, 88, 150); g.beginPath(); g.arc(128, 58, 44, Math.PI, 0); g.fill();
  g.fillStyle = "#46506a"; g.fillRect(94, 64, 68, 132); g.beginPath(); g.arc(128, 66, 34, Math.PI, 0); g.fill();
  g.fillStyle = "#e6dcc6"; g.fillRect(125, 40, 6, 156); g.fillRect(94, 128, 68, 5);
  g.fillStyle = "#3a2e34"; g.fillRect(84, 204, 88, 6);
});
/** the clock stage: stone with a round white clock face (no numbers) */
const clockTex = () => ctex("hallClock023", 256, 256, (g) => {
  g.fillStyle = "#e6dcc6"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#cfc2a6"; g.fillRect(0, 0, 256, 20); g.fillRect(0, 236, 256, 20);
  g.fillStyle = "#3a2e34"; g.beginPath(); g.arc(128, 128, 74, 0, 7); g.fill();
  g.fillStyle = "#f8f4ea"; g.beginPath(); g.arc(128, 128, 66, 0, 7); g.fill();
  g.strokeStyle = "#2a2228"; g.lineWidth = 8; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 80); g.moveTo(128, 128); g.lineTo(160, 140); g.stroke();
});
/** the cupola drum: stone with tall round-topped openings */
const drumTex = () => ctex("hallDrum023", 256, 128, (g) => {
  g.fillStyle = "#e9e0cc"; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 4; i++) { g.fillStyle = "#4a5068"; g.fillRect(20 + i * 64, 30, 24, 80); g.beginPath(); g.arc(32 + i * 64, 32, 12, Math.PI, 0); g.fill(); }
  g.fillStyle = "#cfc2a6"; g.fillRect(0, 112, 256, 16);
});
/** charred timber: near-black with dull ember-brown streaks */
const charTex = () => ctex("charred023", 128, 128, (g, r) => {
  g.fillStyle = "#2a2426"; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "#3a302c" : "#4a3428"; g.fillRect(r() * 128, r() * 128, 4 + r() * 10, 20 + r() * 40); }
});
/** office wall: dark wood panelling below, deep blue-green paper above, a picture rail */
const wallTex = () => ctex("offWall023", 512, 256, (g) => {
  g.fillStyle = "#3e5560"; g.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = "#45606a"; g.fillRect(x, 0, 14, 150); }
  g.fillStyle = "#6a4630"; g.fillRect(0, 150, 512, 106);
  g.strokeStyle = "#3e2618"; g.lineWidth = 5;
  for (let x = 8; x < 512; x += 64) g.strokeRect(x, 166, 52, 76);
  g.fillStyle = "#c9a047"; g.fillRect(0, 146, 512, 6);
});

/** horizontal quad at y over x0..x1, z0..z1, split into cells (big quads lose fog on single frames) */
const flat = (x0: number, x1: number, z0: number, z1: number, y: number, tile: number, nx = 20, nz = 20) => {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
  g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * (x1 - x0)) / tile, (uv.getY(i) * (z1 - z0)) / tile);
  return g;
};
/** a plain table: top at y + h, legs */
const table = (b: Batch, top: THREE.Material, leg: THREE.Material, x: number, y: number, z: number, w: number, d: number, h = 0.9) => {
  b.add(boxGeo(V(x - w / 2, y + h - 0.07, z - d / 2), V(x + w / 2, y + h, z + d / 2), 1), top);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const)
    b.add(boxGeo(V(x + sx * (w / 2 - 0.08) - 0.04, y, z + sz * (d / 2 - 0.08) - 0.04), V(x + sx * (w / 2 - 0.08) + 0.04, y + h - 0.07, z + sz * (d / 2 - 0.08) + 0.04), 1), leg);
};

/** the land block: x in [-LX, LX], z in [-900, LZ1]; beyond it the sea */
export const LX = 420, LZ1 = -300;

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1023);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const grass = lam("grassHD", () => ({ map: grassHD() }));
  const quay = lam("quay023", () => ({ map: stoneHD("quay023", ["#a59c8c", "#978e7f", "#b0a796"], "#6a6458") }));
  const gravel = lam("gravel023", () => ({ map: stoneHD("gravel023", ["#d2c6ac", "#c9bda3", "#dacfb6", "#c2b69c"], "#a89c84") }));
  const marble = lam("hallFacade023", () => ({ map: facadeTex() }));
  const plain = lam("hallStone023", () => ({ color: "#e2d8c2" }));
  const trim = lam("hallTrim023", () => ({ color: "#cdbfa2" }));
  const clockM = lam("hallClock023", () => ({ map: clockTex() }));
  const drumM = lam("hallDrum023", () => ({ map: drumTex() }));
  const roofM = lam("hallRoof023", () => ({ color: "#8a8f98" }));
  const wood = lam("planks023", () => ({ map: planksHD() }));
  const dark = lam("deskWood023", () => ({ color: "#5a3826" }));
  const leg = lam("leg023", () => ({ color: "#4a3022" }));
  const brass = lam("brass023", () => ({ color: "#b8913e" }));
  const jar = lam("jar023", () => ({ color: "#4f6b6a" }));
  const wallM = lam("offWall023", () => ({ map: wallTex() }));
  const frame = lam("frame023", () => ({ color: "#4a2e1e" }));
  const glass = new THREE.MeshBasicMaterial({ color: "#cfe2f2" });
  const post = lam("tapPost023", () => ({ color: "#6b4a2e" }));

  setSightLines([]);
  // ---- the land: a grass block whose top is the ground; its sides are a stone quay wall into the sea ----
  b.add(flat(-LX, LX, -900, LZ1, D0, 4, 84, 60), grass);
  b.add(boxGeo(V(-LX, -1.5, -900), V(LX, D0 - 0.002, LZ1), 2), quay);
  // ---- City Hall Park: the gravel forecourt (a low box on the grass) ----
  const [HX, , HZ] = HALL;
  b.add(boxGeo(V(HX - 26, D0 - 0.3, HZ), V(HX + 26, D0 + 0.05, HZ + 40), 2.5), gravel);
  // the two wings and the centre block (front walls at z = HZ), flat roofs with a balustrade band
  const Y0 = D0 + 0.05;
  b.add(boxGeo(V(HX - 24, Y0, HZ - 16), V(HX - 7, Y0 + 8, HZ), 4), marble);
  b.add(boxGeo(V(HX + 7, Y0, HZ - 16), V(HX + 24, Y0 + 8, HZ), 4), marble);
  b.add(boxGeo(V(HX - 7, Y0, HZ - 16), V(HX + 7, Y0 + 9.6, HZ + 1.8), 4), marble);
  for (const [x0, x1, z1, y] of [[-24.2, -7, 0.2, 8], [7, 24.2, 0.2, 8], [-7.2, 7.2, 2.0, 9.6]] as const) {
    b.add(boxGeo(V(HX + x0, Y0 + y, HZ - 16.2), V(HX + x1, Y0 + y + 0.45, HZ + z1), 1), trim);
    b.add(boxGeo(V(HX + x0 + 0.3, Y0 + y + 0.45, HZ - 15.9), V(HX + x1 - 0.3, Y0 + y + 1.1, HZ + z1 - 0.3), 1), plain);
  }
  // the portico: six columns and the steps in front of the centre block
  for (let i = 0; i < 6; i++) b.add(new THREE.CylinderGeometry(0.32, 0.36, 7.2, 12), plain, new THREE.Matrix4().makeTranslation(HX - 5 + i * 2, Y0 + 1.0 + 3.6, HZ + 3.2));
  b.add(boxGeo(V(HX - 6, Y0 + 8.2, HZ + 1.8), V(HX + 6, Y0 + 9.0, HZ + 3.8), 1), trim);
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(HX - 6.4, Y0, HZ + 1.8), V(HX + 6.4, Y0 + 0.25 * (k + 1), HZ + 6 - k * 0.8), 1), plain);
  // the clock stage on the centre roof
  const [DX, , DZ] = [HX, 0, HZ - 4.5];
  b.add(boxGeo(V(DX - 3.2, Y0 + 10.7, DZ - 3.2), V(DX + 3.2, Y0 + 13.6, DZ + 3.2), 3.2), clockM);
  b.add(boxGeo(V(DX - 3.45, Y0 + 13.6, DZ - 3.45), V(DX + 3.45, Y0 + 14.0, DZ + 3.45), 1), trim);
  // ---- trees and lamps round the lawn ----
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) prop(b, kit, pick(["tree_oak", "tree_fat", "tree_default"]), HX + s * (31 + (k % 2) * 4), D0, HZ + 4 + k * 10, 9 + r() * 3, r() * 6);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) prop(b, kit, "lantern", HX + s * 9, D0 + 0.05, HZ + 12 + k * 10, 3.0, 0);
  // ---- the telegraph office: plank floor, panelled back wall with a window, the desk and the instrument ----
  const [OX, , OZ] = OFF;
  b.add(boxGeo(V(OX - 4.5, D0 - 0.3, OZ - 2.6), V(OX + 4.8, D0 + 0.12, OZ + 4.5), 1.2), wood);
  b.add(boxGeo(V(OX - 4.5, D0 + 0.12, OZ - 2.8), V(OX + 4.8, D0 + 3.4, OZ - 2.6), 3.2), wallM);
  b.add(boxGeo(V(OX - 4.7, D0 + 0.12, OZ - 2.8), V(OX - 4.5, D0 + 3.4, OZ + 0.5), 3.2), wallM);
  b.add(boxGeo(V(OX - 2.8, D0 + 1.3, OZ - 2.62), V(OX - 1.2, D0 + 2.9, OZ - 2.55), 1), frame);
  b.add(boxGeo(V(OX - 2.7, D0 + 1.4, OZ - 2.55), V(OX - 1.3, D0 + 2.8, OZ - 2.5), 1), glass);
  b.add(boxGeo(V(OX - 2.04, D0 + 1.4, OZ - 2.5), V(OX - 1.96, D0 + 2.8, OZ - 2.46), 1), frame);
  b.add(boxGeo(V(OX - 1.0, DESK_Y - 0.08, OZ - 0.5), V(OX + 1.0, DESK_Y, OZ + 0.5), 1), dark);
  b.add(boxGeo(V(OX - 0.95, D0 + 0.12, OZ + 0.32), V(OX + 0.95, DESK_Y - 0.08, OZ + 0.42), 1), dark);
  for (const s of [-1, 1]) b.add(boxGeo(V(OX + s * 0.95 - 0.08, D0 + 0.12, OZ - 0.45), V(OX + s * 0.95 + 0.08, DESK_Y - 0.08, OZ + 0.42), 1), dark);
  // the instrument: a wooden base, two brass coils and a key
  b.add(boxGeo(V(OX - 0.55, DESK_Y, OZ - 0.3), V(OX + 0.15, DESK_Y + 0.08, OZ + 0.1), 1), frame);
  for (const x of [-0.38, -0.12]) b.add(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12), brass, new THREE.Matrix4().makeTranslation(OX + x, DESK_Y + 0.18, OZ - 0.12));
  b.add(boxGeo(V(OX + 0.25, DESK_Y, OZ - 0.05), V(OX + 0.55, DESK_Y + 0.05, OZ + 0.08), 1), brass);
  // Whitehouse's battery bench: a long table with rows of dark jars and a big induction coil
  const [BX, , BZ] = BATT;
  table(b, dark, leg, BX, D0 + 0.12, BZ - 0.5, 2.0, 0.7, 0.85);
  for (let i = 0; i < 8; i++) b.add(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 10), jar, new THREE.Matrix4().makeTranslation(BX - 0.85 + i * 0.24, D0 + 0.12 + 0.85 + 0.15, BZ - 0.7));
  b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16).rotateZ(Math.PI / 2), brass, new THREE.Matrix4().makeTranslation(BX + 0.2, D0 + 0.12 + 0.85 + 0.2, BZ - 0.35));
  // ---- the garden: the tap post ----
  const [GX, , GZ] = HOME;
  b.add(boxGeo(V(GX - 1.8, D0, GZ - 0.65), V(GX - 1.6, D0 + 1.0, GZ - 0.45), 1), post);
  b.add(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8).rotateX(Math.PI / 2), brass, new THREE.Matrix4().makeTranslation(GX - 1.7, D0 + 0.75, GZ - 0.36));

  setSightLines(rays);
  // the garden: a cottage behind, hedges and trees
  house(b, GX, GZ - 9.5, 0, 9, 8, 7, 0, D0);
  for (let i = 0; i < 6; i++) prop(b, kit, "hedge", GX - 9 + i * 3.6, D0, GZ - 4.2, 1.2, 0);
  for (let i = 0; i < 14; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), GX - 40 + r() * 80, D0, GZ - 18 - r() * 30, 8 + r() * 4, r() * 6);
  // behind City Hall: a row of town houses; behind the office: trees
  for (let x = HX - 60; x <= HX + 60; x += 8.8) if (Math.abs(x - HX) > 28) house(b, x, HZ - 6, 0, 8.6, 9, pick([9.8, 11.2]), pick([0, 2, 5, 7]), D0);
  for (let x = HX - 50; x <= HX + 50; x += 8.8) house(b, x, HZ - 30, 0, 8.6, 9, pick([9.8, 11.2]), pick([0, 2, 5, 7]), D0);
  for (let i = 0; i < 12; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), OX - 30 + r() * 60, D0, OZ - 14 - r() * 30, 8 + r() * 4, r() * 6);
  b.build(root);
  setSightLines([]);

  // ---- the cupola, whole and burnt (separate groups, switched per shot) ----
  const whole = new THREE.Group(), burnt = new THREE.Group();
  const wb = new Batch();
  wb.add(new THREE.CylinderGeometry(2.4, 2.4, 2.6, 24), drumM, new THREE.Matrix4().makeTranslation(DX, Y0 + 14.0 + 1.3, DZ));
  wb.add(new THREE.CylinderGeometry(2.65, 2.65, 0.3, 24), plain, new THREE.Matrix4().makeTranslation(DX, Y0 + 16.75, DZ));
  wb.add(new THREE.SphereGeometry(2.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), roofM, new THREE.Matrix4().makeTranslation(DX, Y0 + 16.9, DZ));
  wb.add(new THREE.CylinderGeometry(0.5, 0.6, 0.8, 12), plain, new THREE.Matrix4().makeTranslation(DX, Y0 + 19.6, DZ));
  wb.add(boxGeo(V(DX - 0.22, Y0 + 20.0, DZ - 0.22), V(DX + 0.22, Y0 + 21.4, DZ + 0.22), 1), lam("statue023", () => ({ color: "#c8b47a" })));
  wb.build(whole);
  const bb = new Batch(), ch = lam("charred023", () => ({ map: charTex() }));
  bb.add(new THREE.CylinderGeometry(2.3, 2.4, 1.2, 24, 1, true), ch, new THREE.Matrix4().makeTranslation(DX, Y0 + 14.6, DZ));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, h = 0.8 + 1.4 * ((i * 37) % 10) / 10;
    bb.add(boxGeo(V(-0.14, 0, -0.14), V(0.14, h, 0.14), 1), ch, new THREE.Matrix4().makeTranslation(DX + 2.25 * Math.cos(a), Y0 + 15.2, DZ + 2.25 * Math.sin(a)));
  }
  bb.build(burnt);
  root.add(whole, burnt);
  return { whole, burnt };
};
