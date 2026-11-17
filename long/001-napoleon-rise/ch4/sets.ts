// The static scenery of chapter 4, one THREE.Group per set (only the shot's own set is visible): the Tuileries square,
// a Paris street closed by the church of Saint-Roch, a prison cell, a garret, a salon, the countryside with the army
// camp, and the river Adda with the long wooden bridge of Lodi. Painted textures carry no readable text.
import * as THREE from "three";
import { Batch, V, lam, quad, tri, boxGeo, prop, house, roofMat, setSightLines, Kit, Ray } from "../../../src/engine/build";
import { rng, ctex, rep, stoneHD, cobbleHD, grassHD, planksHD, beamHD, beam, brick } from "../../../src/engine/paint";
import { CHURCH_Z, STEPS_Z, DECK, BR_HALF, RIVER, WATER_Y, CAMP, PARK } from "./story";

// ---------------- helpers ----------------
/** horizontal quad facing up at height y covering x0..x1, z0..z1 (texture repeats u x v) */
export const quadUp = (x0: number, x1: number, z0: number, z1: number, u: number, v: number, y = 0) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
};
/** vertical wall quad from (x0, z0) to (x1, z1), y0..y1, facing the left of the walking direction; texture tile m */
const wallQ = (x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, tile = 0) => {
  const len = Math.hypot(x1 - x0, z1 - z0), u = tile ? len / tile : 1, v = tile ? (y1 - y0) / tile : 1;
  return quad(V(x0, y0, z0), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z0), u, v);
};
const cyl = (b: Batch, m: THREE.Material, x: number, y0: number, y1: number, z: number, r: number, r2 = r, seg = 12) =>
  b.add(new THREE.CylinderGeometry(r2, r, y1 - y0, seg).translate(0, (y0 + y1) / 2, 0), m, new THREE.Matrix4().makeTranslation(x, 0, z));
const box = (b: Batch, m: THREE.Material, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 0) =>
  b.add(boxGeo(V(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)), V(Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)), tile), m);
const beamBetween = (b: Batch, m: THREE.Material, a: THREE.Vector3, c: THREE.Vector3, th: number) => {
  const g = new THREE.BoxGeometry(th, a.distanceTo(c), th);
  b.add(g, m, new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
};
const unlit = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) =>
  new THREE.MeshBasicMaterial({ map: ctex(key, w, h, draw), color: 0xe9e9e9 });

// ---------------- painted textures ----------------
/** one palace bay (4 m x 15 m): rusticated ground floor with an arched opening, tall piano-nobile window with a pediment,
 *  attic window, pilasters at both edges, string courses */
const palaceBay = () => ctex("ch4palaceBay", 256, 960, (g, r) => {
  g.fillStyle = "#e8dcc4"; g.fillRect(0, 0, 256, 960);
  g.fillStyle = "rgba(120,100,80,0.08)"; for (let y = 0; y < 960; y += 24) g.fillRect(0, y, 256, 2);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,250,240" : "150,130,110"},0.06)`; g.fillRect(r() * 256, r() * 960, 8 + r() * 20, 3 + r() * 6); }
  // rustication on the ground floor
  g.fillStyle = "rgba(110,90,70,0.22)"; for (let y = 700; y < 960; y += 32) g.fillRect(0, y, 256, 4);
  // pilasters
  g.fillStyle = "#efe5d1"; g.fillRect(0, 0, 22, 700); g.fillRect(234, 0, 22, 700);
  g.fillStyle = "rgba(110,90,70,0.25)"; g.fillRect(22, 0, 3, 700); g.fillRect(231, 0, 3, 700);
  // string courses
  g.fillStyle = "#f3ead8"; g.fillRect(0, 690, 256, 16); g.fillRect(0, 300, 256, 12);
  g.fillStyle = "rgba(90,70,60,0.35)"; g.fillRect(0, 706, 256, 4); g.fillRect(0, 312, 256, 3);
  const win = (x0: number, y0: number, w: number, h: number, arch: boolean) => {
    g.fillStyle = "#3a4a6a"; g.beginPath();
    if (arch) { g.moveTo(x0, y0 + h); g.lineTo(x0, y0 + w / 2); g.arc(x0 + w / 2, y0 + w / 2, w / 2, Math.PI, 0); g.lineTo(x0 + w, y0 + h); }
    else g.rect(x0, y0, w, h);
    g.closePath(); g.fill();
    g.strokeStyle = "#f4ecdc"; g.lineWidth = 10; g.stroke();
    g.strokeStyle = "rgba(240,235,220,0.75)"; g.lineWidth = 5; g.beginPath(); g.moveTo(x0 + w / 2, y0 + 8); g.lineTo(x0 + w / 2, y0 + h);
    for (let k = 1; k < 4; k++) { g.moveTo(x0, y0 + (h * k) / 4); g.lineTo(x0 + w, y0 + (h * k) / 4); } g.stroke();
    g.fillStyle = "rgba(170,200,235,0.35)"; g.fillRect(x0 + 6, y0 + 10, w * 0.3, h - 16);
  };
  win(78, 760, 100, 200, true);
  win(86, 380, 84, 250, false);
  g.fillStyle = "#f3ead8"; g.beginPath(); g.moveTo(70, 372); g.lineTo(128, 330); g.lineTo(186, 372); g.closePath(); g.fill();
  g.strokeStyle = "rgba(90,70,60,0.45)"; g.lineWidth = 3; g.stroke();
  win(92, 120, 72, 130, false);
});
/** Paris garret: rooftops and chimneys under a soft sky, seen through the dormer */
const roofsView = () => ctex("ch4roofs", 512, 384, (g) => {
  const sky = g.createLinearGradient(0, 0, 0, 384); sky.addColorStop(0, "#7fb0e6"); sky.addColorStop(1, "#d6e6f4");
  g.fillStyle = sky; g.fillRect(0, 0, 512, 384);
  g.fillStyle = "#f6f2ea"; g.beginPath(); g.ellipse(120, 80, 70, 22, 0, 0, 7); g.ellipse(170, 70, 50, 20, 0, 0, 7); g.fill();
  const roofs: [number, number, number, string][] = [[0, 230, 140, "#8f97a8"], [120, 250, 160, "#7d8597"], [270, 220, 130, "#9aa1b0"], [390, 245, 140, "#868ea0"]];
  for (const [x, y, w, c] of roofs) {
    g.fillStyle = "#e6d6b8"; g.fillRect(x, y + 30, w, 384);
    g.fillStyle = c; g.beginPath(); g.moveTo(x - 6, y + 34); g.lineTo(x + 18, y); g.lineTo(x + w - 18, y); g.lineTo(x + w + 6, y + 34); g.closePath(); g.fill();
    g.strokeStyle = "#1c1820"; g.lineWidth = 4; g.stroke();
    g.fillStyle = "#b8684a"; g.fillRect(x + w * 0.3, y - 34, 18, 36); g.fillRect(x + w * 0.7, y - 26, 14, 28);
    g.strokeRect(x + w * 0.3, y - 34, 18, 36); g.strokeRect(x + w * 0.7, y - 26, 14, 28);
    g.fillStyle = "#3a4a6a"; for (let k = 0; k < 4; k++) g.fillRect(x + 14 + k * (w / 4), y + 60, 14, 22);
  }
});
/** prison window: pale sky and a sliver of a wall */
const skyView = () => ctex("ch4skyView", 256, 256, (g) => {
  const s = g.createLinearGradient(0, 0, 0, 256); s.addColorStop(0, "#9cc4ee"); s.addColorStop(1, "#e3eef8");
  g.fillStyle = s; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#f8f5ee"; g.beginPath(); g.ellipse(90, 90, 60, 20, 0, 0, 7); g.fill();
});
/** plaster wall with stains and cracks */
const plaster = (key: string, base: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(110,90,70,${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 60, 14 + r() * 40, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(70,55,45,0.35)"; g.lineWidth = 2;
  for (let i = 0; i < 5; i++) { let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 40; y += 10 + r() * 20; g.lineTo(x, y); } g.stroke(); }
});
/** salon wall panel: pale sea-green boiserie with cream mouldings and a gilt line (2 m wide x 4.5 m tall) */
const panelTex = () => ctex("ch4panel", 256, 576, (g) => {
  g.fillStyle = "#b9d1c2"; g.fillRect(0, 0, 256, 576);
  g.fillStyle = "#e9e1cc"; g.fillRect(0, 440, 256, 136); g.fillRect(0, 0, 256, 30);
  g.strokeStyle = "#f2ead6"; g.lineWidth = 10; g.strokeRect(34, 60, 188, 350); g.strokeRect(34, 464, 188, 90);
  g.strokeStyle = "#c9a24e"; g.lineWidth = 3; g.strokeRect(44, 70, 168, 330);
  g.strokeStyle = "rgba(60,70,60,0.3)"; g.lineWidth = 2; g.strokeRect(28, 54, 200, 362);
  g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(50, 76, 40, 318);
});
/** parquet floor */
const parquet = () => ctex("ch4parquet", 512, 512, (g, r) => {
  g.fillStyle = "#a8724a"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = 0; x < 512; x += 128) {
    const off = (y / 32) % 2 ? 64 : 0, c = 150 + r() * 30;
    g.fillStyle = `rgb(${c},${c * 0.68},${c * 0.45})`; g.fillRect((x + off) % 512, y, 126, 30);
  }
  g.fillStyle = "rgba(40,20,10,0.5)"; for (let y = 0; y < 512; y += 32) g.fillRect(0, y + 30, 512, 2);
});
/** dirt road */
const dirt = () => ctex("ch4dirt", 512, 512, (g, r) => {
  g.fillStyle = "#c9a874"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "rgba(120,90,55,0.18)" : "rgba(240,220,180,0.2)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 7, 1 + r() * 4, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(110,80,50,0.25)"; g.lineWidth = 6; for (const y of [150, 360]) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + 20, 340, y - 20, 512, y); g.stroke(); }
});
const straw = () => ctex("ch4straw", 256, 256, (g, r) => {
  g.fillStyle = "#a8905a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) { g.strokeStyle = r() < 0.5 ? "rgba(206,184,120,0.7)" : "rgba(110,86,44,0.6)"; g.lineWidth = 2; const x = r() * 256, y = r() * 256, a = r() * 6.28; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 18 * Math.cos(a), y + 18 * Math.sin(a)); g.stroke(); }
});
const tentTex = () => ctex("ch4tent", 256, 256, (g, r) => {
  g.fillStyle = "#e6dcc2"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(140,120,90,${0.05 + r() * 0.08})`; g.fillRect(r() * 256, r() * 256, 30 + r() * 60, 20 + r() * 40); }
  g.fillStyle = "rgba(120,100,70,0.3)"; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 3, 256);
});

// ---------------- the sets ----------------
export type Sets = Record<string, THREE.Group>;
type Rays = Record<string, Ray[]>;

const ground = (b: Batch, mat: THREE.Material, x0: number, x1: number, z0: number, z1: number, tile: number, y = 0) =>
  b.add(quadUp(x0, x1, z0, z1, (x1 - x0) / tile, (z1 - z0) / tile, y), mat);
const hills = (b: Batch, list: [number, number, number, number, number][]) => {
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("ch4hillA", () => ({ color: "#78b257" })), lam("ch4hillB", () => ({ color: "#6aa24e" })), lam("ch4hillC", () => ({ color: "#8bbf63" }))];
  list.forEach(([x, z, sx, sy, sz], i) => b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(x, -2, z), new THREE.Quaternion(), V(sx, sy, sz))));
};
const M = {
  cobble: () => lam("cobbleHD", () => ({ map: cobbleHD() })),
  grass: () => lam("ch4grass", () => ({ map: grassHD(), color: "#b3bd98" })),
  stone: () => lam("ch4stone", () => ({ map: stoneHD("ch4stoneHD", ["#e6dcc8", "#ddd2bd", "#ebe2cf", "#d6cab4"], "#b0a28c") })),
  trim: () => lam("ch4trim", () => ({ color: "#f1e8d6" })),
  wood: () => lam("wood", () => ({ map: beam() })),
  dark: () => lam("ch4dark", () => ({ color: "#3a3040" })),
  iron: () => lam("ch4iron", () => ({ color: "#3d414c" })),
};

/** the Tuileries palace across the north of a cobbled square (facade z = -30), trees and lamps, Paris houses aside */
const buildPalace = (root: THREE.Group, kit: Kit) => {
  const b = new Batch(), r = rng(41), stone = M.stone(), trim = M.trim();
  ground(b, M.cobble(), -400, 400, -400, 400, 4);
  const bay = lam("ch4palaceBay", () => ({ map: rep(palaceBay(), 1, 1) }));
  // wings: facade x -84..-11 and 11..84 at z = -30, 15 m, depth 14; mansard roofs
  for (const s of [-1, 1]) {
    const xa = s * 11, xb = s * 84, x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
    b.add(quad(V(x0, 0, -30), V(x1, 0, -30), V(x1, 15, -30), V(x0, 15, -30), (x1 - x0) / 4, 1), bay);
    box(b, stone, x0, 0, -44, x1, 15, -30.3, 3);
    box(b, trim, x0 - 0.2, 14.4, -30.4, x1 + 0.2, 15.1, -29.7);
    const rm = roofMat("#8f97a8");
    b.add(quad(V(x0, 15, -29.7), V(x1, 15, -29.7), V(x1, 20, -33.5), V(x0, 20, -33.5), (x1 - x0) / 4, 2), rm);
    b.add(quad(V(x0, 20, -33.5), V(x1, 20, -33.5), V(x1, 20, -40.5), V(x0, 20, -40.5), (x1 - x0) / 4, 2), rm);
    b.add(quad(V(x1, 15, -44.3), V(x0, 15, -44.3), V(x0, 20, -40.5), V(x1, 20, -40.5), (x1 - x0) / 4, 2), rm);
    for (let x = x0 + 4; x < x1 - 2; x += 8) { // dormers + chimneys on the mansard
      box(b, trim, x - 0.7, 15.6, -31.6, x + 0.7, 17.6, -30.6);
      b.add(quad(V(x - 0.5, 15.9, -30.58), V(x + 0.5, 15.9, -30.58), V(x + 0.5, 17.2, -30.58), V(x - 0.5, 17.2, -30.58)), M.dark());
    }
    for (let x = x0 + 8; x < x1; x += 16) box(b, lam("chim", () => ({ map: rep(brick(), 1, 1) })), x - 0.6, 19, -38, x + 0.6, 22.5, -36.5);
    // end pavilions
    const xe = s * 84;
    box(b, stone, Math.min(xe, xe - s * 12), 0, -46, Math.max(xe, xe - s * 12), 18, -28.8, 3);
    b.add(quad(V(Math.min(xe, xe - s * 12), 0, -28.48), V(Math.max(xe, xe - s * 12), 0, -28.48), V(Math.max(xe, xe - s * 12), 15, -28.48), V(Math.min(xe, xe - s * 12), 15, -28.48), 3, 1), bay);
    const cap = new THREE.ConeGeometry(9, 6, 4, 1); cap.rotateY(Math.PI / 4);
    b.add(cap, rm, new THREE.Matrix4().compose(V(xe - s * 6, 21, -37.25), new THREE.Quaternion(), V(0.75, 1, 1.15)));
  }
  // central pavilion (Pavillon de l'Horloge): projecting, columns, pediment, square dome
  box(b, stone, -11, 0, -44, 11, 20, -27.3, 3);
  b.add(quad(V(-11, 0, -26.98), V(11, 0, -26.98), V(11, 15, -26.98), V(-11, 15, -26.98), 5.5, 1), bay);
  for (const x of [-9, -5, 5, 9]) cyl(b, trim, x, 0.6, 14.4, -26.4, 0.55, 0.48, 16);
  box(b, trim, -11.4, 14.4, -27.6, 11.4, 15.6, -25.8);
  b.add(tri(V(-11.4, 15.6, -25.8), V(11.4, 15.6, -25.8), V(0, 19.5, -25.8)), trim);
  b.add(quad(V(-11.4, 15.6, -25.8), V(0, 19.5, -25.8), V(0, 19.5, -27.6), V(-11.4, 15.6, -27.6)), roofMat("#8f97a8"));
  b.add(quad(V(0, 19.5, -25.8), V(11.4, 15.6, -25.8), V(11.4, 15.6, -27.6), V(0, 19.5, -27.6)), roofMat("#8f97a8"));
  box(b, stone, -8, 20, -40, 8, 23, -30, 3);
  const prof: [number, number][] = [[11.3, 0], [11.1, 1.2], [10.2, 3.2], [8.4, 5.4], [5.6, 7.2], [2.6, 8.3], [0, 8.6]];
  const dome = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 4); dome.rotateY(Math.PI / 4);
  b.add(dome, roofMat("#8f97a8"), new THREE.Matrix4().compose(V(0, 23, -35), new THREE.Quaternion(), V(0.75, 1, 0.75)));
  box(b, trim, -1, 31.4, -36, 1, 33, -34);
  // steps in front of the pavilion
  for (let k = 0; k < 4; k++) box(b, stone, -12 + k * 0.3, 0, -27, 12 - k * 0.3, 0.18 * (k + 1), -24.6 + k * 0.6, 1);
  // trees (Tuileries garden edge) and lamp posts along the square, Paris houses on the sides
  for (const s of [-1, 1]) {
    for (let z = -12; z <= 50; z += 9) prop(b, kit, r() < 0.5 ? "tree_oak" : "tree_default", s * (34 + r() * 3), 0, z, 8 + r() * 2, r() * 6);
    for (let z = -8; z <= 44; z += 13) prop(b, kit, "lantern", s * 22, 0, z, 3.2);
    for (let z = 10; z < 140; z += 9) house(b, s * 64, z, s < 0 ? Math.PI / 2 : -Math.PI / 2, 9, 10, [12.6, 14, 11.2][Math.floor(r() * 3)], Math.floor(r() * 8), 0);
  }
  for (let x = -60; x <= 60; x += 9.5) house(b, x, 120, Math.PI, 9, 10, [12.6, 14, 11.2][Math.floor(r() * 3)], Math.floor(r() * 8), 0);
  for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = 200 + r() * 120; prop(b, kit, "tree_default", Math.cos(a) * d, 0, Math.sin(a) * d * 0.7 - 60, 12 + r() * 4, r() * 6); }
  // flag poles in the square
  for (const x of [-16, 16]) { cyl(b, lam("ch4pole", () => ({ color: "#5a4030" })), x, 0, 10, -20, 0.09, 0.06, 8); box(b, stone, x - 0.6, 0, -20.6, x + 0.6, 0.5, -19.4); }
  cyl(b, lam("ch4pole", () => ({ color: "#5a4030" })), 0, 33, 37, -35, 0.08, 0.05, 8);
  b.build(root);
};

/** a Paris street (fronts at x = +-9) closed at the south end by the church of Saint-Roch (facade z = CHURCH_Z) */
export const stepY = (z: number) => (z >= STEPS_Z ? 0 : Math.min(1.2, 0.2 * Math.ceil((STEPS_Z - z) / 1.0 - 1e-6)));
const buildStreet = (root: THREE.Group, kit: Kit) => {
  const b = new Batch(), r = rng(7), stone = M.stone(), trim = M.trim();
  ground(b, M.cobble(), -300, 300, -300, 400, 4);
  // houses along both sides, 4-5 floors
  for (const s of [-1, 1]) {
    let z = -31;
    while (z < 200) {
      const w = [8, 9, 10][Math.floor(r() * 3)], h = [11.2, 12.6, 14][Math.floor(r() * 3)];
      house(b, s * 14, z + w / 2, s < 0 ? Math.PI / 2 : -Math.PI / 2, w, 10, h, Math.floor(r() * 8), 0);
      z += w + 0.15;
    }
    // houses flanking the church, fronts facing the street end
    house(b, s * 16, CHURCH_Z - 5, 0, 12, 10, 14, s < 0 ? 0 : 4, 0);
    for (let x = 24; x < 120; x += 10) house(b, s * x, -36, 0, 9.6, 10, 12.6, Math.floor(r() * 8), 0);
  }
  for (let x = -40; x <= 40; x += 10) house(b, x, 215, Math.PI, 9.6, 10, 12.6, Math.floor(r() * 8), 0);
  // Saint-Roch: two-storey baroque facade
  const zf = CHURCH_Z;
  box(b, stone, -10, 0, zf - 40, 10, 18, zf, 3);                       // nave behind
  const rm = roofMat("#8f97a8");
  b.add(quad(V(-10.4, 18, zf - 40), V(-10.4, 18, zf), V(0, 24, zf), V(0, 24, zf - 40), 10, 3), rm);
  b.add(quad(V(10.4, 18, zf), V(10.4, 18, zf - 40), V(0, 24, zf - 40), V(0, 24, zf), 10, 3), rm);
  box(b, stone, -10.5, 1.2, zf + 0.01, 10.5, 10.5, zf + 0.6, 3);       // lower storey wall plane
  for (const x of [-9.2, -6.6, -2.4, 2.4, 6.6, 9.2]) { cyl(b, trim, x, 1.2, 9.3, zf + 1.3, 0.42, 0.38, 16); box(b, trim, x - 0.55, 1.2, zf + 0.75, x + 0.55, 1.6, zf + 1.85); box(b, trim, x - 0.55, 9.2, zf + 0.75, x + 0.55, 9.6, zf + 1.85); }
  box(b, trim, -10.8, 9.6, zf + 0.6, 10.8, 10.8, zf + 2.0);           // entablature
  box(b, M.dark(), -1.6, 1.2, zf + 0.5, 1.6, 6.4, zf + 0.68);          // great door
  b.add(new THREE.CylinderGeometry(1.6, 1.6, 0.08, 20, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), M.dark(), new THREE.Matrix4().makeTranslation(0, 6.4, zf + 0.64));
  for (const x of [-4.5, 4.5]) { box(b, M.dark(), x - 0.7, 3.2, zf + 0.5, x + 0.7, 6.2, zf + 0.68); b.add(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 16, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), M.dark(), new THREE.Matrix4().makeTranslation(x, 6.2, zf + 0.64)); }
  box(b, stone, -6.2, 10.8, zf + 0.01, 6.2, 17.4, zf + 0.9, 3);        // upper storey
  for (const x of [-5.4, -2.2, 2.2, 5.4]) cyl(b, trim, x, 10.8, 16.6, zf + 1.4, 0.34, 0.3, 16);
  box(b, trim, -6.5, 16.6, zf + 0.9, 6.5, 17.5, zf + 1.9);
  b.add(tri(V(-6.6, 17.5, zf + 1.9), V(6.6, 17.5, zf + 1.9), V(0, 20.4, zf + 1.9)), trim);
  b.add(quad(V(-6.6, 17.5, zf + 1.9), V(0, 20.4, zf + 1.9), V(0, 20.4, zf + 0.5), V(-6.6, 17.5, zf + 0.5)), rm);
  b.add(quad(V(0, 20.4, zf + 1.9), V(6.6, 17.5, zf + 1.9), V(6.6, 17.5, zf + 0.5), V(0, 20.4, zf + 0.5)), rm);
  box(b, M.dark(), -1.2, 11.6, zf + 0.8, 1.2, 15.2, zf + 1.0);         // upper window
  b.add(tri(V(6.2, 10.8, zf + 0.7), V(9.4, 10.8, zf + 0.7), V(6.2, 14.4, zf + 0.7)), stone); b.add(tri(V(-9.4, 10.8, zf + 0.7), V(-6.2, 10.8, zf + 0.7), V(-6.2, 14.4, zf + 0.7)), stone); // scroll wings
  cyl(b, M.iron(), 0, 20.4, 22.2, zf + 1.2, 0.07, 0.07, 6); box(b, M.iron(), -0.5, 21.6, zf + 1.15, 0.5, 21.75, zf + 1.25); // cross
  // steps (6 x 0.2 m), lower step at STEPS_Z
  for (let k = 0; k < 6; k++) box(b, stone, -11, 0.2 * k, zf, 11, 0.2 * (k + 1), STEPS_Z - k * 1.0, 1);
  // lamp posts
  for (let z = -20; z < 160; z += 16) for (const s of [-1, 1]) prop(b, kit, "lantern", s * 7.6, 0, z, 3.4);
  prop(b, kit, "cart", 6.2, 0, 70, 2.2, 0.4);
  prop(b, kit, "stall-green", -6.4, 0, 100, 3.2, Math.PI / 2);
  b.build(root);
};

/** small stone cell: 5 x 4 m, barred window high in the back wall, straw, a bench and an iron-banded door */
const buildCell = (root: THREE.Group) => {
  const b = new Batch();
  const wall = lam("ch4cellWall", () => ({ map: stoneHD("ch4cellHD", ["#8c877f", "#837e76", "#96918a", "#7b766f"], "#57524c") }));
  ground(b, lam("ch4cellFloor", () => ({ map: stoneHD("ch4cellFloorHD", ["#9a948b", "#8f897f", "#a49e94", "#88827a"], "#5f5a52") })), -2.6, 2.6, -2.1, 4.5, 1.6);
  b.add(wallQ(-2.6, -2.1, 2.6, -2.1, 0, 3.6, 1.6), wall);   // back
  b.add(wallQ(-2.6, 4.5, -2.6, -2.1, 0, 3.6, 1.6), wall);   // left
  b.add(wallQ(2.6, -2.1, 2.6, 4.5, 0, 3.6, 1.6), wall);     // right
  b.add(quad(V(-2.6, 3.6, -2.1), V(2.6, 3.6, -2.1), V(2.6, 3.6, 4.5), V(-2.6, 3.6, 4.5)), wall); // ceiling (faces down)
  // window opening with a sky view and 4 iron bars
  const wx = 0.9, wy0 = 2.2, wy1 = 3.05;
  b.add(quad(V(wx - 0.45, wy0, -2.09), V(wx + 0.45, wy0, -2.09), V(wx + 0.45, wy1, -2.09), V(wx - 0.45, wy1, -2.09)), new THREE.MeshBasicMaterial({ map: skyView(), color: 0xf2f2f2 }));
  box(b, lam("ch4sill", () => ({ color: "#8a847a" })), wx - 0.55, wy0 - 0.12, -2.1, wx + 0.55, wy0, -1.9);
  for (let k = 0; k < 4; k++) box(b, M.iron(), wx - 0.33 + k * 0.22 - 0.025, wy0, -2.05, wx - 0.33 + k * 0.22 + 0.025, wy1, -2.0);
  box(b, M.iron(), wx - 0.45, 2.6, -2.05, wx + 0.45, 2.65, -2.0);
  // straw on the floor (a thin raised mat, not coplanar), bench, door, bucket
  box(b, lam("ch4straw", () => ({ map: straw() })), -2.3, 0, -2.05, 0.3, 0.06, -0.5);
  box(b, M.wood(), 1.2, 0.42, -2.05, 2.5, 0.5, -1.5); for (const x of [1.3, 2.4]) box(b, M.wood(), x - 0.05, 0, -1.95, x + 0.05, 0.42, -1.6);
  box(b, lam("ch4door", () => ({ map: beam() })), 2.55, 0, 0.6, 2.6, 2.1, 1.7);
  for (const y of [0.4, 1.0, 1.6]) box(b, M.iron(), 2.5, y, 0.6, 2.55, y + 0.08, 1.7);
  cyl(b, M.wood(), -1.9, 0, 0.35, 1.0, 0.18, 0.21, 12);
  b.build(root, false);
};

/** the garret: sloping ceiling, a dormer window over the roofs, bed, table with a candle and a few coins */
const buildAttic = (root: THREE.Group) => {
  const b = new Batch(), wall = lam("ch4atticWall", () => ({ map: plaster("ch4plaster", "#d9c6a2") }));
  ground(b, lam("planksHD", () => ({ map: planksHD() })), -3.2, 3.2, -1.6, 5, 2.5);
  b.add(wallQ(-3.2, -1.6, 3.2, -1.6, 0, 2.4, 2), wall);                       // knee wall at the back
  b.add(quad(V(-3.2, 2.4, -1.6), V(3.2, 2.4, -1.6), V(3.2, 3.6, 0.6), V(-3.2, 3.6, 0.6), 3, 1.2), wall); // slope (faces the room)
  b.add(quad(V(-3.2, 3.6, 0.6), V(3.2, 3.6, 0.6), V(3.2, 3.6, 5), V(-3.2, 3.6, 5), 3, 2), wall);
  b.add(wallQ(-3.2, 5, -3.2, -1.6, 0, 3.6, 2), wall);
  b.add(wallQ(3.2, -1.6, 3.2, 5, 0, 3.6, 2), wall);
  for (let x = -2.8; x <= 2.8; x += 1.4) beamBetween(b, M.wood(), V(x, 2.42, -1.55), V(x, 3.58, 0.55), 0.16); // rafters
  // small window in the knee wall, the roofs of Paris outside
  const wx = 1.4;
  b.add(quad(V(wx - 0.55, 1.0, -1.59), V(wx + 0.55, 1.0, -1.59), V(wx + 0.55, 2.1, -1.59), V(wx - 0.55, 2.1, -1.59)), new THREE.MeshBasicMaterial({ map: roofsView(), color: 0xeeeeee }));
  box(b, M.wood(), wx - 0.66, 0.9, -1.6, wx + 0.66, 1.0, -1.42);
  box(b, M.wood(), wx - 0.66, 2.1, -1.6, wx + 0.66, 2.2, -1.5);
  for (const s of [-1, 1]) box(b, M.wood(), wx + s * 0.6 - 0.06, 1.0, -1.6, wx + s * 0.6 + 0.06, 2.1, -1.5);
  box(b, M.wood(), wx - 0.03, 1.0, -1.58, wx + 0.03, 2.1, -1.55); box(b, M.wood(), wx - 0.55, 1.53, -1.58, wx + 0.55, 1.58, -1.55);
  // table + stool, bed with a blanket, trunk
  const tw = lam("ch4table", () => ({ color: "#8a5a3c" }));
  box(b, tw, -1.1, 0.74, -0.9, 0.5, 0.8, -0.2); for (const [x, z] of [[-1.0, -0.82], [0.4, -0.82], [-1.0, -0.28], [0.4, -0.28]]) box(b, tw, x - 0.04, 0, z - 0.04, x + 0.04, 0.74, z + 0.04);
  box(b, lam("ch4bed", () => ({ color: "#7a5236" })), -3.1, 0, -1.5, -1.9, 0.45, 0.6);
  box(b, lam("ch4blanket", () => ({ color: "#6f7fa6" })), -3.08, 0.45, -1.0, -1.92, 0.55, 0.62);
  box(b, lam("ch4pillow", () => ({ color: "#efe8d8" })), -3.0, 0.45, -1.45, -2.0, 0.6, -1.05);
  box(b, lam("ch4trunk", () => ({ color: "#5a4a3a" })), 2.0, 0, 0.6, 3.0, 0.55, 1.3);
  // stack of books, the candle holder, coins (gold discs)
  box(b, lam("ch4book1", () => ({ color: "#8c3b3a" })), -0.9, 0.8, -0.75, -0.55, 0.87, -0.5);
  box(b, lam("ch4book2", () => ({ color: "#3b5a8c" })), -0.88, 0.87, -0.73, -0.58, 0.93, -0.52);
  cyl(b, lam("ch4brass", () => ({ color: "#c9a24e" })), 0.2, 0.8, 0.83, -0.55, 0.09, 0.09, 14);
  cyl(b, lam("ch4wax", () => ({ color: "#f3ead2" })), 0.2, 0.83, 1.0, -0.55, 0.03, 0.03, 10);
  for (const [x, z] of [[-0.25, -0.4], [-0.12, -0.45]]) cyl(b, lam("ch4coin", () => ({ color: "#e8b53e" })), x, 0.8, 0.815, z, 0.035, 0.035, 12);
  b.build(root, false);
};

/** Josephine's salon: panelled walls, parquet, fireplace with a mirror, sofa, side table for the wedding, chandelier */
const buildSalon = (root: THREE.Group) => {
  const b = new Batch(), pan = lam("ch4panel", () => ({ map: panelTex() }));
  ground(b, lam("ch4parquet", () => ({ map: parquet() })), -7, 7, -5, 7, 2);
  const wq = (x0: number, z0: number, x1: number, z1: number, n: number) => quad(V(x0, 0, z0), V(x1, 0, z1), V(x1, 4.5, z1), V(x0, 4.5, z0), n, 1);
  b.add(wq(-7, -5, 7, -5, 7), pan); b.add(wq(-7, 7, -7, -5, 6), pan); b.add(wq(7, -5, 7, 7, 6), pan);
  b.add(quad(V(-7, 4.5, -5), V(7, 4.5, -5), V(7, 4.5, 7), V(-7, 4.5, 7)), lam("ch4ceil", () => ({ color: "#f1e9d8" })));
  const gilt = lam("ch4gilt", () => ({ color: "#d4ac55" })), marble = lam("ch4marble", () => ({ color: "#efe7dc" }));
  box(b, gilt, -7, 4.3, -4.98, 7, 4.42, -4.9);
  // fireplace + mirror (centre back)
  box(b, marble, -1.2, 0, -5, 1.2, 1.2, -4.55); box(b, M.dark(), -0.65, 0, -4.6, 0.65, 0.85, -4.54); box(b, marble, -1.35, 1.2, -5, 1.35, 1.3, -4.45);
  box(b, gilt, -1.0, 1.35, -5, 1.0, 3.6, -4.92);
  b.add(quad(V(-0.88, 1.47, -4.91), V(0.88, 1.47, -4.91), V(0.88, 3.48, -4.91), V(-0.88, 3.48, -4.91)), new THREE.MeshBasicMaterial({ color: 0xbcd3e2 }));
  // tall windows with curtains on the right wall
  for (const z of [-2.5, 1.5]) {
    b.add(quad(V(6.98, 0.6, z - 0.8), V(6.98, 0.6, z + 0.8), V(6.98, 3.9, z + 0.8), V(6.98, 3.9, z - 0.8)), new THREE.MeshBasicMaterial({ map: skyView(), color: 0xf0d8b8 }));
    for (const s of [-1, 1]) box(b, lam("ch4curtain", () => ({ color: "#a8364a" })), 6.82, 0.05, z + s * 0.8 - 0.28, 6.96, 4.2, z + s * 0.8 + 0.28);
  }
  // sofa on the left, small round tables, the wedding table with a cloth (left back corner)
  const silk = lam("ch4silk", () => ({ color: "#d9b25a" })), legs = lam("ch4legs", () => ({ color: "#6a4228" }));
  box(b, silk, -6.2, 0.35, -2.0, -5.3, 0.55, 1.4); box(b, silk, -6.6, 0.35, -2.0, -6.2, 1.15, 1.4); box(b, legs, -6.6, 0, -2.0, -5.3, 0.35, 1.4);
  const cloth = lam("ch4cloth", () => ({ color: "#f3ecdc" }));
  box(b, cloth, -4.3, 0.0, -4.0, -2.3, 0.82, -3.0);
  box(b, legs, -4.4, 0.82, -4.1, -2.2, 0.86, -2.9);
  cyl(b, legs, 3.6, 0, 0.72, -3.4, 0.05, 0.05, 8); cyl(b, marble, 3.6, 0.72, 0.76, -3.4, 0.4, 0.4, 20);
  // chandelier (high, out of the faces)
  cyl(b, gilt, 0, 3.6, 4.5, 0, 0.02, 0.02, 6); cyl(b, gilt, 0, 3.55, 3.65, 0, 0.6, 0.6, 20);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; cyl(b, lam("ch4wax", () => ({ color: "#f3ead2" })), 0.6 * Math.cos(a), 3.65, 3.8, 0.6 * Math.sin(a), 0.025, 0.025, 6); }
  b.build(root, false);
};

/** wide country: a dirt road along x, the camp (tents), the Sablons gun park, hills, poplars, farmhouses, distant mountains */
const buildCountry = (root: THREE.Group, kit: Kit) => {
  const b = new Batch(), r = rng(23);
  const g = M.grass();
  ground(b, g, -500, 500, -500, -2.5, 6); ground(b, g, -500, 500, 2.5, 500, 6);
  ground(b, lam("ch4dirt", () => ({ map: dirt() })), -500, 500, -2.5, 2.5, 5);
  hills(b, [[-200, -260, 160, 40, 90], [60, -300, 200, 55, 100], [280, -240, 150, 35, 90], [-320, 180, 170, 40, 120], [200, 260, 200, 50, 110], [420, 40, 140, 30, 140], [-420, -60, 150, 34, 140]]);
  const mtn = lam("ch4mtn", () => ({ color: "#8ea0bf" })), snow = lam("ch4snow", () => ({ color: "#f4f6fa" }));
  for (const [x, z, h, rr] of [[-150, -470, 150, 120], [40, -500, 190, 140], [230, -460, 140, 110], [380, -430, 120, 100]] as const) {
    b.add(new THREE.ConeGeometry(rr, h, 7, 1), mtn, new THREE.Matrix4().makeTranslation(x, h / 2 - 5, z));
    b.add(new THREE.ConeGeometry(rr * 0.33, h * 0.33, 7, 1), snow, new THREE.Matrix4().makeTranslation(x, h - 5 - (h * 0.33) / 2 + 0.6, z));
  }
  // poplars along the road, olive-ish round trees in the fields
  for (let x = -300; x <= 300; x += 14) for (const s of [-1, 1]) if (r() < 0.75 && Math.abs(x - CAMP[0]) > 14 && Math.abs(x - PARK[0]) > 18) prop(b, kit, "tree-high-round", x + r() * 3, 0, s * (5.5 + r() * 1.5), 9 + r() * 3, r() * 6);
  for (let i = 0; i < 110; i++) { const x = (r() - 0.5) * 700, z = (r() < 0.5 ? -1 : 1) * (40 + r() * 260); prop(b, kit, r() < 0.5 ? "tree_fat" : "tree_oak", x, 0, z, 5 + r() * 3, r() * 6); }
  for (const [x, z, yaw] of [[-20, -60, 0.2], [90, -70, -0.3], [150, 40, Math.PI], [-110, 50, Math.PI + 0.3], [10, -110, 0]] as const) house(b, x, z, yaw, 9, 8, 7, Math.floor(r() * 8), 0);
  // the camp: A-frame tents around CAMP, a stack of muskets, a cart
  const tent = lam("ch4tent", () => ({ map: tentTex(), side: THREE.DoubleSide }));
  for (const [dx, dz, yaw] of [[-6, -6, 0.3], [-1, -9, -0.1], [5, -7, 0.25], [9, -2, 1.2], [-9, 0, -1.1], [13, -10, 0.1], [-14, -10, 0.4]] as const) {
    const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(CAMP[0] + dx, 0, CAMP[2] + dz);
    b.add(quad(V(-1.4, 0, -1.6), V(-1.4, 0, 1.6), V(0, 1.9, 1.6), V(0, 1.9, -1.6), 1, 1), tent, m);
    b.add(quad(V(1.4, 0, 1.6), V(1.4, 0, -1.6), V(0, 1.9, -1.6), V(0, 1.9, 1.6), 1, 1), tent, m);
    b.add(tri(V(-1.4, 0, -1.6), V(0, 1.9, -1.6), V(1.4, 0, -1.6)), tent, m);
    b.add(tri(V(1.4, 0, 1.6), V(0, 1.9, 1.6), V(-0.3, 0.9, 1.75)), tent, m);
  }
  prop(b, kit, "cart", CAMP[0] - 11, 0, CAMP[2] + 3, 2.2, 0.8);
  // the fire ring (stones) at the camp centre
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; b.add(new THREE.SphereGeometry(0.17, 10, 8), lam("ch4rock", () => ({ color: "#9a948a" })), new THREE.Matrix4().compose(V(CAMP[0] + 0.55 * Math.cos(a), 0.06, CAMP[2] + 0.55 * Math.sin(a)), new THREE.Quaternion(), V(1, 0.6, 1))); }
  for (const a of [0.3, 1.4, 2.6]) beamBetween(b, M.wood(), V(CAMP[0] + 0.45 * Math.cos(a), 0.05, CAMP[2] + 0.45 * Math.sin(a)), V(CAMP[0] - 0.45 * Math.cos(a), 0.12, CAMP[2] - 0.45 * Math.sin(a)), 0.1);
  b.build(root);
};

/** the Adda at Lodi: a wide river, a long wooden bridge on pile bents, the town with its campanile on the far bank */
const buildLodi = (root: THREE.Group, kit: Kit) => {
  const b = new Batch(), r = rng(31), g = M.grass();
  ground(b, g, -500, 500, -500, -RIVER, 6); ground(b, g, -500, 500, RIVER, 500, 6);
  const bank = lam("ch4bank", () => ({ map: stoneHD("ch4bankHD", ["#9c8c74", "#a8987e", "#928269", "#b0a085"], "#6d604f") }));
  b.add(wallQ(-500, -RIVER, 500, -RIVER, WATER_Y - 1.5, 0, 2), bank);
  b.add(wallQ(500, RIVER, -500, RIVER, WATER_Y - 1.5, 0, 2), bank);
  // the bridge: deck planks, stringers, pile bents every 6 m, rails; ramps at both ends
  const wood = M.wood(), deck = lam("planksHD", () => ({ map: planksHD() })), side = lam("deckSide", () => ({ map: beamHD() }));
  b.add(quadUp(-2.8, 2.8, -BR_HALF, BR_HALF, 2.2, (2 * BR_HALF) / 2.5, DECK), deck);
  for (const s of [-1, 1]) b.add(wallQ(s * 2.8, s < 0 ? -BR_HALF : BR_HALF, s * 2.8, s < 0 ? BR_HALF : -BR_HALF, DECK - 0.5, DECK, 1), side);
  for (const s of [-1, 1]) { // ramps down to the banks
    const z0 = s * BR_HALF, z1 = s * (BR_HALF + 6);
    const p = (x: number, z: number, y: number) => V(x, y, z);
    if (s > 0) b.add(quad(p(2.8, z0, DECK), p(-2.8, z0, DECK), p(-2.8, z1, 0.01), p(2.8, z1, 0.01), 2.2, 2.4), deck);
    else b.add(quad(p(-2.8, z0, DECK), p(2.8, z0, DECK), p(2.8, z1, 0.01), p(-2.8, z1, 0.01), 2.2, 2.4), deck);
  }
  for (let z = -BR_HALF + 2; z <= BR_HALF - 2; z += 6) {
    const bottom = Math.abs(z) < RIVER ? WATER_Y - 1.0 : 0;
    for (const x of [-2.4, -0.8, 0.8, 2.4]) cyl(b, wood, x, bottom, DECK - 0.45, z, 0.16, 0.15, 8);
    box(b, wood, -3.1, DECK - 0.75, z - 0.18, 3.1, DECK - 0.45, z + 0.18);
    beamBetween(b, wood, V(-2.4, bottom + 0.6, z), V(2.4, DECK - 0.8, z), 0.12);
    // ice breaker in front of each bent in the river
    if (Math.abs(z) < RIVER) beamBetween(b, wood, V(-4.4, WATER_Y - 0.4, z), V(-2.4, DECK - 0.6, z), 0.16);
  }
  for (const s of [-1, 1]) {
    for (let z = -BR_HALF; z <= BR_HALF + 0.01; z += 2) box(b, wood, s * 2.7 - 0.07, DECK, z - 0.07, s * 2.7 + 0.07, DECK + 1.05, z + 0.07);
    box(b, wood, s * 2.7 - 0.08, DECK + 1.0, -BR_HALF, s * 2.7 + 0.08, DECK + 1.12, BR_HALF);
    box(b, wood, s * 2.7 - 0.05, DECK + 0.5, -BR_HALF, s * 2.7 + 0.05, DECK + 0.58, BR_HALF);
  }
  // the town of Lodi on the far bank: a row of houses facing the river, a brick campanile and a church
  for (let x = -120; x < 120; x += 0) {
    const w = [8, 9, 7][Math.floor(r() * 3)];
    if (Math.abs(x + w / 2) > 8) house(b, x + w / 2, RIVER + 16, Math.PI, w, 9, [8.4, 9.8, 11.2][Math.floor(r() * 3)], Math.floor(r() * 8), 0);
    x += w + 0.3;
  }
  for (let x = -100; x < 100; x += 11) if (Math.abs(x) > 14) house(b, x + r() * 3, RIVER + 32 + r() * 4, Math.PI, 9, 9, 9.8, Math.floor(r() * 8), 0);
  const brk = lam("ch4brick", () => ({ map: rep(brick(), 2, 8) }));
  box(b, brk, 14, 0, RIVER + 26, 19, 30, RIVER + 31, 0);
  box(b, M.trim(), 13.8, 24, RIVER + 25.8, 19.2, 24.6, RIVER + 31.2);
  const spire = new THREE.ConeGeometry(3.6, 6, 4, 1); spire.rotateY(Math.PI / 4);
  b.add(spire, roofMat("#b8644f"), new THREE.Matrix4().makeTranslation(16.5, 33, RIVER + 28.5));
  for (const [x, z] of [[14, RIVER + 28.5], [19, RIVER + 28.5]]) box(b, M.dark(), x - 0.04, 25.5, z - 0.8, x + 0.04, 28.5, z + 0.8);
  box(b, M.dark(), 15.7, 25.5, RIVER + 25.96, 17.3, 28.5, RIVER + 26.0);
  // trees on both banks, the near-bank road to the bridge, hills
  for (let x = -200; x <= 200; x += 13) if (Math.abs(x) > 9) { prop(b, kit, "tree-high-round", x + r() * 4, 0, -RIVER - 6 - r() * 4, 9 + r() * 3, r() * 6); if (r() < 0.5) prop(b, kit, "tree_oak", x + r() * 4, 0, RIVER + 4 + r() * 3, 7 + r() * 2, r() * 6); }
  hills(b, [[-260, 260, 200, 40, 100], [220, 300, 220, 50, 110], [-280, -260, 200, 35, 100], [260, -300, 200, 44, 110]]);
  b.build(root);
};

/** build every set (each with its own sight lines) and return them by name */
export const buildSets = (kit: Kit, rays: Rays): Sets => {
  const out: Sets = {};
  const mk = (name: string, fn: (g: THREE.Group) => void) => { const g = new THREE.Group(); setSightLines(rays[name] ?? []); fn(g); setSightLines([]); out[name] = g; };
  mk("palace", (g) => buildPalace(g, kit));
  mk("street", (g) => buildStreet(g, kit));
  mk("cell", (g) => buildCell(g));
  mk("attic", (g) => buildAttic(g));
  mk("salon", (g) => buildSalon(g));
  mk("country", (g) => buildCountry(g, kit));
  mk("lodi", (g) => buildLodi(g, kit));
  return out;
};
