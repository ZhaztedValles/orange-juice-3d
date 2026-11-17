// Chapter 6 places, each a group the world shows only in its own shots:
//   study:   Napoleon's study (desk, piles of paper, candles, bookcase, map, globes, the Code), night and day windows
//   press:   a Paris print shop with a wooden hand press (moving platen) and a newspaper that gets censored
//   senate:  the Senate chamber: tiers of benches, columns, crimson drapes
//   studio:  a London cartoonist's studio: the caricature on a big easel (it tears in two), drawing table, prints
//   paris:   a Paris street: the bank (portico), the lycee, the government palace with its steps and the tricolour,
//            a shop, a cafe corner, the ballot table
//   school:  the military school courtyard (flash-back), as chapter 1
//   field:   green rolling field: the battle, Waterloo ridge, the camp with tents and a campfire
//   snow:    the Russian plain in deep snow with dark pines
//   helena:  Saint Helena: a rock in the ocean with a small house on its green top
//   corsica: chapter 1's Ajaccio harbour (copied: land, quay, town rows, mountains, tower, boats)
import * as THREE from "three";
import { Batch, V, lam, quad, tri, boxGeo, prop, house, roofMat, setSightLines, Kit, Ray } from "../../../src/engine/build";
import { ctex, rep, stoneHD, cobbleHD, planksHD } from "../../../src/engine/paint";
import { NOINK } from "../../../src/engine/ink";
import { Pen, bodyFront, INK } from "../../../src/engine/toon";
import { flagTex, cannon } from "../shared/props";
import { NAP_ICON } from "../shared/cast";
import { G, CASA, TOWER, STUDY, PRESS, SENATE, STUDIO, PARIS, EXT, SCH, FIELD, SNOW, HEL, HEL_R, helY, V3 } from "./story";

const M4 = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const rnd = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s % 100000) / 100000; }; };
const basic = (c: THREE.Color | string, extra: THREE.MeshBasicMaterialParameters = {}) => new THREE.MeshBasicMaterial({ color: c, fog: false, ...extra });

// ---------------- painted textures (no readable text anywhere: scribbles only) ----------------
const wallTex = (key: string, wall: string, wains: string, rail: string) => ctex("c6wall" + key, 512, 512, (g, r) => {
  g.fillStyle = wall; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,250,235" : "150,120,90"},0.07)`; g.beginPath(); g.ellipse(r() * 512, r() * 380, 20 + r() * 50, 10 + r() * 30, 0, 0, 7); g.fill(); }
  g.fillStyle = wains; g.fillRect(0, 400, 512, 112);
  g.fillStyle = rail; g.fillRect(0, 392, 512, 14);
  g.strokeStyle = "rgba(40,25,15,0.55)"; g.lineWidth = 3; for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 406); g.lineTo(x, 512); g.stroke(); }
});
export const scribble = (g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, step: number, col = "rgba(60,50,70,0.75)", lw = 3) => {
  g.strokeStyle = col; g.lineWidth = lw;
  for (let y = y0; y < y1; y += step) { g.beginPath(); g.moveTo(x0, y); for (let x = x0; x < x1; x += 8) g.lineTo(x, y + ((x / 8) % 2 ? -2 : 2)); g.stroke(); }
};
const paperTex = () => ctex("c6paper", 128, 160, (g) => { g.fillStyle = "#f4ecd8"; g.fillRect(0, 0, 128, 160); scribble(g, 14, 22, 112, 140, 14); });
const pileTex = () => ctex("c6pile", 128, 128, (g, r) => {
  g.fillStyle = "#efe5cc"; g.fillRect(0, 0, 128, 128);
  for (let y = 2; y < 128; y += 5) { g.fillStyle = r() < 0.5 ? "#e2d6b8" : "#f6eedb"; g.fillRect(0, y, 128, 2); }
});
export const newsTex = () => ctex("c6news", 256, 340, (g) => {
  g.fillStyle = "#f1e8d2"; g.fillRect(0, 0, 256, 340);
  g.fillStyle = "#3a3340"; for (let x = 24; x < 232; x += 26) g.fillRect(x, 20, 18, 30); // masthead blocks (no letters)
  g.fillRect(16, 60, 224, 4);
  for (let c = 0; c < 3; c++) scribble(g, 18 + c * 76, 78, 18 + c * 76 + 66, 320, 11, "rgba(50,45,60,0.8)", 2.5);
});
export const barsTex = () => ctex("c6bars", 256, 340, (g) => {
  g.clearRect(0, 0, 256, 340);
  g.fillStyle = "#141018";
  for (const [x, y, w, h] of [[14, 74, 228, 40], [14, 128, 150, 34], [90, 176, 152, 46], [14, 236, 228, 38], [14, 288, 120, 30]]) g.fillRect(x, y, w, h);
});
const mapTex = () => ctex("c6map", 384, 300, (g) => {
  g.fillStyle = "#6b4a2e"; g.fillRect(0, 0, 384, 300);
  g.fillStyle = "#efe2c2"; g.fillRect(16, 16, 352, 268);
  g.fillStyle = "#cfe0b0"; g.strokeStyle = "#5a4a3a"; g.lineWidth = 4;
  g.beginPath(); // a hexagon-ish country shape, no names
  [[150, 40], [250, 52], [300, 110], [282, 200], [230, 252], [140, 250], [86, 196], [70, 120], [110, 70]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = "rgba(90,70,60,0.55)"; g.lineWidth = 2;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(186, 150); g.lineTo(186 + Math.cos(i * 0.7) * 100, 150 + Math.sin(i * 0.7) * 80); g.stroke(); }
  g.fillStyle = "#c23a3a"; g.beginPath(); g.arc(186, 150, 8, 0, 7); g.fill();
});
const globeTex = () => ctex("c6globe", 512, 256, (g, r) => {
  g.fillStyle = "#6f9fc4"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#d9c38a"; g.strokeStyle = "#6a5a3a"; g.lineWidth = 2;
  for (const [cx, cy, rx, ry] of [[90, 90, 50, 40], [120, 170, 26, 50], [250, 80, 46, 30], [270, 150, 40, 56], [380, 90, 70, 40], [420, 185, 34, 22], [180, 230, 120, 12]]) {
    g.beginPath();
    for (let k = 0; k <= 20; k++) { const a = (k / 20) * Math.PI * 2, w = 1 + 0.25 * Math.sin(a * 3 + cx); g.lineTo(cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w); }
    g.closePath(); g.fill(); g.stroke();
  }
  g.strokeStyle = "rgba(240,230,200,0.35)"; g.lineWidth = 1.5;
  for (let x = 0; x < 512; x += 43) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  for (let y = 32; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
});
const coverTex = () => ctex("c6cover", 256, 256, (g) => {
  g.fillStyle = "#7a1f2a"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#e8b53e"; g.lineWidth = 7; g.strokeRect(16, 16, 224, 224);
  g.lineWidth = 3; g.strokeRect(30, 30, 196, 196);
  g.fillStyle = "#e8b53e"; g.beginPath(); g.ellipse(128, 118, 26, 30, 0, 0, 7); g.fill(); // a gold medallion (a bee-ish oval), no letters
  g.fillStyle = "#7a1f2a"; g.fillRect(104, 112, 48, 5); g.fillRect(104, 124, 48, 5);
  for (const y of [178, 196]) { g.fillStyle = "#e8b53e"; g.fillRect(70, y, 116, 6); }
});
const pagesTex = () => ctex("c6pages", 128, 64, (g) => {
  g.fillStyle = "#f3ead2"; g.fillRect(0, 0, 128, 64);
  for (let y = 2; y < 64; y += 4) { g.fillStyle = "#ddd0b0"; g.fillRect(0, y, 128, 1.5); }
});
const spinesTex = () => ctex("c6spines", 512, 128, (g, r) => {
  g.fillStyle = "#3a2618"; g.fillRect(0, 0, 512, 128);
  let x = 0;
  while (x < 512) {
    const w = 10 + r() * 14, h = 80 + r() * 44;
    g.fillStyle = ["#7a2a2a", "#2f4a6a", "#3f5a2f", "#6a4a2a", "#5a2f4a", "#8a6a3a"][Math.floor(r() * 6)];
    g.fillRect(x, 128 - h, w - 1, h);
    g.fillStyle = "rgba(232,181,62,0.7)"; g.fillRect(x + 2, 128 - h + 10, w - 5, 3); g.fillRect(x + 2, 118, w - 5, 3);
    x += w;
  }
});
const plankWall = () => ctex("c6plankwall", 512, 512, (g, r) => {
  g.fillStyle = "#cdb48c"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 42) { g.fillStyle = r() < 0.5 ? "#c2a77d" : "#d6bf98"; g.fillRect(x, 0, 40, 512); g.fillStyle = "rgba(60,40,25,0.45)"; g.fillRect(x + 40, 0, 2, 512); }
});
const drapeTex = () => ctex("c6drape", 256, 512, (g) => {
  for (let x = 0; x < 256; x++) { const k = 0.75 + 0.25 * Math.cos((x / 256) * Math.PI * 10); g.fillStyle = `rgb(${Math.round(160 * k)},${Math.round(30 * k)},${Math.round(48 * k)})`; g.fillRect(x, 0, 1, 512); }
  g.fillStyle = "#e8b53e"; g.fillRect(0, 488, 256, 24);
});
/** the London caricature: a tiny, furious Napoleon under a huge hat, stamping (drawn with the engine's own pen) */
export const drawCaricature = (g: CanvasRenderingContext2D) => {
  g.fillStyle = "#f3ead3"; g.fillRect(0, 0, 800, 1200);
  g.strokeStyle = "#3a2f36"; g.lineWidth = 10; g.strokeRect(26, 26, 748, 1148);
  scribble(g, 90, 80, 710, 150, 26, "rgba(58,47,54,0.8)", 5); // a scribbled caption block (not readable)
  g.fillStyle = "rgba(120,100,80,0.25)"; g.fillRect(60, 1118, 680, 10);
  g.save(); g.translate(400 - 300 * 0.62, 1124 - 975 * 0.38); g.scale(0.62, 0.38);
  const p = new Pen(g);
  bodyFront(p, { ...NAP_ICON.o, hat: "hair", hair: "#2b1f1c" }, { mode: "stand", expr: "pained", prop: null, wave: 1, tilt: -6, seed: 3 });
  g.restore();
  // the enormous bicorne
  const pen = new Pen(g);
  pen.poly([[160, 820], [250, 690], [400, 640], [550, 690], [640, 820], [520, 790], [400, 780], [280, 790]], "#1d1b22", 9);
  pen.ell(400, 712, 34, 34, "#2f52b0", 6); pen.ell(400, 712, 22, 22, "#f5f2ea", 0); pen.ell(400, 712, 11, 11, "#d23a3f", 0);
  // steam puffs and stamp lines
  for (const [x, y, s] of [[230, 610, 34], [190, 560, 26], [575, 615, 34], [615, 560, 26]] as const) pen.ell(x, y, s, s * 0.8, "#e9e2d4", 6);
  for (const [x0, y0, x1, y1] of [[300, 1150, 260, 1176], [500, 1150, 540, 1176], [400, 1156, 400, 1184]] as const) pen.line([[x0, y0], [x1, y1]], "#3a2f36", 7, false);
};
/** a jagged tear down the middle of the sheet (shared by both halves so they meet) */
const TEAR_PTS: [number, number][] = (() => { const r = rnd(11), out: [number, number][] = []; for (let y = -10; y <= 1210; y += 60) out.push([400 + (r() - 0.5) * 70, y]); return out; })();
const halfTex = (side: -1 | 1) => ctex("c6carHalf" + side, 800, 1200, (g) => {
  g.save(); g.beginPath();
  if (side < 0) { g.moveTo(-10, -10); TEAR_PTS.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(-10, 1210); }
  else { g.moveTo(810, -10); TEAR_PTS.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(810, 1210); }
  g.closePath(); g.clip(); drawCaricature(g); g.restore();
});
const printTex = (k: number) => ctex("c6print" + k, 200, 260, (g) => {
  g.fillStyle = "#5a3a22"; g.fillRect(0, 0, 200, 260);
  g.save(); g.translate(14, 14); g.scale(172 / 800, 232 / 1200); drawCaricature(g); g.restore();
  if (k) { g.fillStyle = "rgba(200,120,90,0.18)"; g.fillRect(14, 14, 172, 232); }
});
const fieldTex = (key: string, base: string, dabs: string[]) => ctex("c6ground" + key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.fillStyle = dabs[i % dabs.length]; g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 40, 6 + r() * 20, r() * 3, 0, 7); g.fill(); }
});
const rockTex = () => ctex("c6rock", 256, 256, (g, r) => {
  g.fillStyle = "#9a8f7c"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) { g.fillStyle = r() < 0.5 ? "rgba(110,100,85,0.45)" : "rgba(190,182,165,0.35)"; g.beginPath(); g.ellipse(r() * 256, r() * 256, 8 + r() * 30, 4 + r() * 12, r() * 3, 0, 7); g.fill(); }
});
const ajGroundTex = () => ctex("c6ajGround", 512, 512, (g, r) => {
  g.fillStyle = "#d4bc8f"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 140; i++) { g.fillStyle = r() < 0.5 ? "rgba(185,155,110,0.35)" : "rgba(236,220,186,0.35)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 40, 6 + r() * 20, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 26; i++) { g.fillStyle = r() < 0.5 ? "rgba(132,158,82,0.55)" : "rgba(112,140,70,0.5)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 14 + r() * 36, 8 + r() * 18, r() * 3, 0, 7); g.fill(); }
});

// ---------------- a closed room (walls face inward, no shadow from the shell so the sun lights the floor) ----------------
type RoomOpts = { w: number; d: number; h: number; wall: THREE.Material; floor: THREE.Material; ceil: string; beams?: boolean };
const room = (o: V3, r: RoomOpts, shell: Batch, solid: Batch) => {
  const P = (x: number, y: number, z: number) => V(o[0] + x, y, o[2] + z), hw = r.w / 2, hd = r.d / 2, h = r.h;
  shell.add(quad(P(-hw, 0, hd), P(hw, 0, hd), P(hw, 0, -hd), P(-hw, 0, -hd), r.w / 3, r.d / 3), r.floor);
  shell.add(quad(P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, h, -hd), P(-hw, h, -hd), r.w / 4, h / 4), r.wall);
  shell.add(quad(P(hw, 0, hd), P(-hw, 0, hd), P(-hw, h, hd), P(hw, h, hd), r.w / 4, h / 4), r.wall);
  shell.add(quad(P(-hw, 0, hd), P(-hw, 0, -hd), P(-hw, h, -hd), P(-hw, h, hd), r.d / 4, h / 4), r.wall);
  shell.add(quad(P(hw, 0, -hd), P(hw, 0, hd), P(hw, h, hd), P(hw, h, -hd), r.d / 4, h / 4), r.wall);
  shell.add(quad(P(-hw, h, -hd), P(hw, h, -hd), P(hw, h, hd), P(-hw, h, hd)), lam("c6ceil" + r.ceil, () => ({ color: r.ceil, side: THREE.DoubleSide })));
  if (r.beams) { const bm = lam("c6beam", () => ({ color: "#6b4a2e" })); for (let x = -hw + 0.8; x <= hw - 0.6; x += 1.4) shell.add(boxGeo(P(x - 0.1, h - 0.22, -hd), P(x + 0.1, h, hd)), bm); }
};
/** a window in a back wall at z: frame boxes + a glowing pane (returned so the world can switch day / night) */
const windowAt = (g: THREE.Group, solid: Batch, P: (x: number, y: number, z: number) => THREE.Vector3, x: number, z: number, w: number, y0: number, y1: number, frame: THREE.Material) => {
  solid.add(boxGeo(P(x - w / 2 - 0.08, y0 - 0.1, z), P(x + w / 2 + 0.08, y0, z + 0.16)), frame);
  solid.add(boxGeo(P(x - w / 2 - 0.08, y1, z), P(x + w / 2 + 0.08, y1 + 0.1, z + 0.12)), frame);
  for (const s of [-1, 1]) solid.add(boxGeo(P(x + s * w / 2 - 0.06, y0, z), P(x + s * w / 2 + 0.06, y1, z + 0.12)), frame);
  solid.add(boxGeo(P(x - 0.03, y0, z + 0.01), P(x + 0.03, y1, z + 0.08)), frame);
  solid.add(boxGeo(P(x - w / 2, (y0 + y1) / 2 - 0.03, z + 0.01), P(x + w / 2, (y0 + y1) / 2 + 0.03, z + 0.08)), frame);
  const mk = (c: THREE.Color) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, y1 - y0), basic(c)); const p = P(x, (y0 + y1) / 2, z + 0.005); m.position.copy(p); g.add(m); return m; };
  return { day: mk(new THREE.Color(0.95, 1.15, 1.35)), night: mk(new THREE.Color(0.1, 0.16, 0.36)) };
};

// ---------------- the study ----------------
export type Study = { group: THREE.Group; day: THREE.Mesh; night: THREE.Object3D[]; book: THREE.Group; globe: THREE.Mesh; candles: THREE.Object3D[] };
export const buildStudy = (): Study => {
  const g = new THREE.Group(), shell = new Batch(), solid = new Batch(), o = STUDY;
  const P = (x: number, y: number, z: number) => V(o[0] + x, y, o[2] + z);
  room(o, { w: 10, d: 9, h: 4.2, wall: lam("c6studyWall", () => ({ map: wallTex("study", "#d9b77f", "#6e4a2e", "#8a5f3a") })), floor: lam("c6floor", () => ({ map: rep(planksHD(), 1, 1) })), ceil: "#d9c39a", beams: true }, shell, solid);
  const wood = lam("c6desk", () => ({ color: "#6e4428" })), dark = lam("c6darkwood", () => ({ color: "#4a2e1c" })), green = lam("c6baize", () => ({ color: "#2f5a3a" }));
  // desk with a green baize top
  solid.add(boxGeo(P(-1.1, 0.74, -2.3), P(1.1, 0.8, -1.1)), wood);
  shell.add(quad(P(-1.02, 0.802, -1.18), P(1.02, 0.802, -1.18), P(1.02, 0.802, -2.22), P(-1.02, 0.802, -2.22)), green);
  solid.add(boxGeo(P(-1.08, 0.1, -1.18), P(-0.55, 0.74, -1.12)), dark); solid.add(boxGeo(P(0.55, 0.1, -1.18), P(1.08, 0.74, -1.12)), dark); // drawer fronts
  for (const [x, z] of [[-1.04, -2.26], [1.04, -2.26], [-1.04, -1.14], [1.04, -1.14]]) solid.add(boxGeo(P(x - 0.05, 0, z - 0.05), P(x + 0.05, 0.74, z + 0.05)), wood);
  solid.add(boxGeo(P(-1.08, 0.08, -2.28), P(1.08, 0.74, -2.2)), dark);
  // piles of papers on the desk (the left one tall), loose sheets, inkwell and quill
  const pile = lam("c6pileM", () => ({ map: pileTex() }));
  for (const [x, z, hgt] of [[-0.86, -1.45, 0.42], [-0.62, -2.0, 0.3], [0.52, -2.05, 0.2], [-0.88, -1.95, 0.16]] as const) solid.add(boxGeo(P(x - 0.16, 0.8, z - 0.12), P(x + 0.16, 0.8 + hgt, z + 0.12)), pile);
  const paper = lam("c6paperM", () => ({ map: paperTex() }));
  for (const [x, z, a] of [[0.05, -1.55, 0.2], [0.32, -1.45, -0.3], [-0.2, -1.42, 0.5]] as const) { const pg = new THREE.PlaneGeometry(0.24, 0.3); pg.rotateX(-Math.PI / 2); pg.rotateY(a); shell.add(pg, paper, M4(o[0] + x, 0.806, o[2] + z)); }
  solid.add(new THREE.CylinderGeometry(0.04, 0.05, 0.07, 10), lam("c6ink", () => ({ color: "#22202a" })), M4(o[0] + 0.62, 0.84, o[2] - 1.42));
  // a chair behind the desk, a bookcase on the left wall, a map on the back wall, a sideboard with a floor globe
  solid.add(boxGeo(P(-0.3, 0.45, -3.05), P(0.3, 0.52, -2.55)), wood); solid.add(boxGeo(P(-0.3, 0.52, -3.08), P(0.3, 1.25, -3.02)), lam("c6chairBack", () => ({ color: "#8c2f2f" })));
  solid.add(boxGeo(P(-4.98, 0, -3.6), P(-4.55, 3.0, 1.2)), dark);
  const spines = lam("c6spinesM", () => ({ map: spinesTex() }));
  for (let k = 0; k < 4; k++) shell.add(quad(P(-4.54, 0.25 + k * 0.7, 1.15), P(-4.54, 0.25 + k * 0.7, -3.55), P(-4.54, 0.85 + k * 0.7, -3.55), P(-4.54, 0.85 + k * 0.7, 1.15), 3, 1), spines);
  for (let k = 0; k <= 4; k++) solid.add(boxGeo(P(-4.98, 0.2 + k * 0.7, -3.6), P(-4.5, 0.25 + k * 0.7, 1.2)), wood);
  shell.add(quad(P(-3.4, 1.5, -4.48), P(-1.4, 1.5, -4.48), P(-1.4, 3.06, -4.48), P(-3.4, 3.06, -4.48)), lam("c6mapM", () => ({ map: mapTex() })));
  const glow = windowAt(g, solid, P, 2.6, -4.5, 1.6, 1.1, 3.3, wood);
  // the moon in the night window
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), basic(new THREE.Color(1.3, 1.25, 1.0)));
  moon.position.copy(P(2.95, 2.75, -4.48)); g.add(moon);
  // candles on the desk (flames glow at night)
  const candles: THREE.Object3D[] = [];
  const brass = lam("c6brass", () => ({ color: "#c9a24a" })), wax = lam("c6wax", () => ({ color: "#f3ead6" }));
  for (const [x, z] of [[-0.25, -2.05], [0.85, -1.4]] as const) {
    solid.add(new THREE.CylinderGeometry(0.08, 0.11, 0.05, 12), brass, M4(o[0] + x, 0.825, o[2] + z));
    solid.add(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), wax, M4(o[0] + x, 0.96, o[2] + z));
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), basic(new THREE.Color(3.2, 2.1, 0.8)));
    fl.scale.set(1, 1.8, 1); fl.position.copy(P(x, 1.11, z)); fl.layers.set(NOINK); g.add(fl); candles.push(fl);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: ctex("c6halo", 128, 128, (gg) => { const gr = gg.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,200,120,0.55)"); gr.addColorStop(1, "rgba(255,200,120,0)"); gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    halo.position.copy(P(x, 1.11, z)); halo.layers.set(NOINK); halo.renderOrder = 4; g.add(halo); candles.push(halo);
  }
  // desk globe on a brass stand (spins in shot 29)
  solid.add(new THREE.CylinderGeometry(0.1, 0.13, 0.04, 16), brass, M4(o[0] + 0.72, 0.82, o[2] - 1.75));
  solid.add(new THREE.CylinderGeometry(0.02, 0.02, 0.26, 8), brass, M4(o[0] + 0.72, 0.95, o[2] - 1.75));
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 20), lam("c6globeM", () => ({ map: globeTex() })));
  globe.position.copy(P(0.72, 1.24, -1.75)); globe.rotation.z = 0.41; globe.castShadow = true; g.add(globe);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.012, 6, 40), brass); ring.position.copy(globe.position); ring.rotation.set(0, Math.PI / 2, 0.41); g.add(ring);
  // a big floor globe by the window
  solid.add(new THREE.CylinderGeometry(0.06, 0.2, 0.8, 12), wood, M4(o[0] + 2.4, 0.4, o[2] - 3.3));
  const fg = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 20), lam("c6globeM", () => ({ map: globeTex() })));
  fg.position.copy(P(2.4, 1.22, -3.3)); fg.rotation.set(0.2, 1.4, 0.41); g.add(fg);
  // the Civil Code: a giant leather book (lands in shot 6, then stays on the desk)
  const book = new THREE.Group();
  const cover = lam("c6coverM", () => ({ map: coverTex() })), pages = lam("c6pagesM", () => ({ map: pagesTex() })), leather = lam("c6leather", () => ({ color: "#6a1a24" }));
  const bw = 0.78, bd = 0.56, bh = 0.2;
  book.add(new THREE.Mesh(new THREE.BoxGeometry(bw, 0.03, bd), leather).translateY(0.015));
  book.add(new THREE.Mesh(new THREE.BoxGeometry(bw - 0.03, bh - 0.06, bd - 0.04), pages).translateY(bh / 2).translateZ(0.01));
  const top = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.03, bd), leather); top.position.y = bh - 0.015; book.add(top);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.02, bd - 0.02), cover); face.rotation.x = -Math.PI / 2; face.position.y = bh + 0.001; book.add(face);
  book.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, bh, bd), leather).translateX(-bw / 2));
  book.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) { mm.castShadow = true; mm.receiveShadow = true; } });
  book.rotation.y = 0.12; g.add(book);
  shell.build(g, false); solid.build(g, true);
  return { group: g, day: glow.day, night: [glow.night, moon], book, globe, candles };
};

// ---------------- the print shop ----------------
export type Press = { group: THREE.Group; platen: THREE.Group; bars: THREE.Mesh };
export const buildPress = (): Press => {
  const g = new THREE.Group(), shell = new Batch(), solid = new Batch(), o = PRESS;
  const P = (x: number, y: number, z: number) => V(o[0] + x, y, o[2] + z);
  room(o, { w: 12, d: 9, h: 4.5, wall: lam("c6pressWall", () => ({ map: rep(plankWall(), 1, 1) })), floor: lam("c6floor", () => ({ map: rep(planksHD(), 1, 1) })), ceil: "#c9b08a", beams: true }, shell, solid);
  const oak = lam("c6oak", () => ({ color: "#7a5030" })), iron = lam("c6iron", () => ({ color: "#3d414c" }));
  // the press: two posts, head, bed (table) with the forme, a screw and the bar
  for (const s of [-1, 1]) solid.add(boxGeo(P(s * 0.75 - 0.12, 0, -1.95), P(s * 0.75 + 0.12, 2.5, -1.7)), oak);
  solid.add(boxGeo(P(-0.95, 2.2, -2.0), P(0.95, 2.55, -1.65)), oak);
  solid.add(boxGeo(P(-0.95, 0.82, -2.2), P(0.95, 0.95, -0.85)), oak);
  for (const [x, z] of [[-0.88, -2.12], [0.88, -2.12], [-0.88, -0.92], [0.88, -0.92]]) solid.add(boxGeo(P(x - 0.05, 0, z - 0.05), P(x + 0.05, 0.82, z + 0.05)), oak);
  const news = lam("c6newsM", () => ({ map: newsTex() }));
  const ng = new THREE.PlaneGeometry(0.62, 0.82); ng.rotateX(-Math.PI / 2); ng.rotateY(0.04); shell.add(ng, news, M4(o[0] + 0.25, 0.952, o[2] - 1.38));
  const bars = new THREE.Mesh(ng.clone(), new THREE.MeshBasicMaterial({ map: barsTex(), transparent: true, opacity: 0, depthWrite: false, color: 0x888888 }));
  bars.position.copy(P(0.25, 0.956, -1.38)); bars.layers.set(NOINK); g.add(bars);
  const platen = new THREE.Group();
  platen.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.62), iron));
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 10), iron); screw.position.y = 0.55; platen.add(screw);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), iron); bar.rotation.z = Math.PI / 2; bar.position.set(0.45, 0.7, 0); platen.add(bar);
  platen.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) mm.castShadow = true; });
  platen.position.copy(P(0, 1.4, -1.82)); g.add(platen);
  // type cases along the left wall, stacks of paper, sheets drying on lines across the back
  for (let k = 0; k < 3; k++) solid.add(boxGeo(P(-5.9, 0, -3.8 + k * 1.3), P(-5.2, 1.1 + 0.15 * k, -2.7 + k * 1.3)), oak);
  const pile = lam("c6pileM", () => ({ map: pileTex() }));
  for (const [x, z, h] of [[-2.0, -1.0, 0.7], [-2.4, -1.5, 0.5], [2.0, -2.4, 0.9], [2.5, -1.7, 0.55]] as const) solid.add(boxGeo(P(x - 0.3, 0, z - 0.22), P(x + 0.3, h, z + 0.22)), pile);
  const sheet = lam("c6newsHang", () => ({ map: newsTex(), side: THREE.DoubleSide }));
  for (let k = 0; k < 9; k++) shell.add(quad(P(-4 + k * 0.95, 2.45, -3.6), P(-3.45 + k * 0.95, 2.45, -3.6), P(-3.45 + k * 0.95, 3.15, -3.6), P(-4 + k * 0.95, 3.15, -3.6)), sheet);
  solid.add(new THREE.CylinderGeometry(0.008, 0.008, 9.6, 4).rotateZ(Math.PI / 2), iron, M4(o[0], 3.17, o[2] - 3.6));
  // the door on the right wall (the policeman's way in) and a window
  solid.add(boxGeo(P(5.9, 0, 0.2), P(5.99, 2.4, 1.4)), lam("c6door", () => ({ color: "#5b3a24" })));
  windowAt(g, solid, P, -1.6, -4.5, 1.3, 1.2, 2.3, oak).night.visible = false;
  shell.build(g, false); solid.build(g, true);
  return { group: g, platen, bars };
};

// ---------------- the Senate ----------------
export const SEN_ROW = (r: number) => ({ z: -1.6 - 1.5 * r, y: 0.45 * r });
export const buildSenate = () => {
  const g = new THREE.Group(), shell = new Batch(), solid = new Batch(), o = SENATE;
  const P = (x: number, y: number, z: number) => V(o[0] + x, y, o[2] + z);
  room(o, { w: 26, d: 21, h: 10, wall: lam("c6senWall", () => ({ map: wallTex("sen", "#e6d4ae", "#7a5236", "#a8784a") })), floor: lam("c6senFloor", () => ({ map: rep(stoneHD("c6senFloorHD", ["#d9cdb6", "#cfc1a8", "#e2d7c2", "#c6b79c"], "#a39584"), 1, 1) })), ceil: "#e8dcc0" }, shell, solid);
  const tier = lam("c6tier", () => ({ color: "#8a5a3a" })), rail = lam("c6rail", () => ({ color: "#5a3a24" })), velvet = lam("c6velvet", () => ({ color: "#2f4a8a" }));
  for (let r = 1; r < 5; r++) { const { z } = SEN_ROW(r); solid.add(boxGeo(P(-10, 0, z - 0.75), P(10, 0.45 * r, z + 0.75)), tier); }
  for (let r = 0; r < 5; r++) { const { z, y } = SEN_ROW(r); solid.add(boxGeo(P(-10, y, z + 0.55), P(10, y + 0.62, z + 0.68)), rail); solid.add(boxGeo(P(-10, y + 0.62, z + 0.5), P(10, y + 0.7, z + 0.75)), velvet); }
  // the president's desk at the front
  solid.add(boxGeo(P(-1.6, 0, 2.6), P(1.6, 1.05, 3.4)), lam("c6presDesk", () => ({ color: "#6e4428" })));
  shell.add(quad(P(-1.55, 0.1, 3.42), P(1.55, 0.1, 3.42), P(1.55, 0.95, 3.42), P(-1.55, 0.95, 3.42)), lam("c6presCloth", () => ({ color: "#2f4a8a" })));
  // columns along the back wall with crimson drapes between them
  const col = lam("c6col", () => ({ map: rep(stoneHD("c6colHD", ["#efe5cf", "#e6dac0", "#f2ead8", "#ddd0b4"], "#c9bba0"), 1, 1) }));
  const drape = lam("c6drapeM", () => ({ map: drapeTex() }));
  for (let k = -3; k <= 3; k++) {
    const x = k * 3.4;
    solid.add(new THREE.CylinderGeometry(0.42, 0.48, 9.0, 20), col, M4(o[0] + x, 4.5, o[2] - 9.9));
    if (k < 3) shell.add(quad(P(x + 0.5, 2.0, -10.45), P(x + 2.9, 2.0, -10.45), P(x + 2.9, 8.6, -10.45), P(x + 0.5, 8.6, -10.45)), drape);
  }
  solid.add(boxGeo(P(-13, 9.0, -10.5), P(13, 9.6, -9.3)), col);
  shell.build(g, false); solid.build(g, true);
  return g;
};

// ---------------- the London studio ----------------
export type Studio = { group: THREE.Group; halves: THREE.Group[]; sheetW: number; sheetH: number };
export const buildStudio = (): Studio => {
  const g = new THREE.Group(), shell = new Batch(), solid = new Batch(), o = STUDIO;
  const P = (x: number, y: number, z: number) => V(o[0] + x, y, o[2] + z);
  room(o, { w: 10, d: 8, h: 4.0, wall: lam("c6studioWall", () => ({ map: wallTex("studio", "#c9b48a", "#4f5a3a", "#6a7448") })), floor: lam("c6floor", () => ({ map: rep(planksHD(), 1, 1) })), ceil: "#d4c4a0", beams: true }, shell, solid);
  const wood = lam("c6easel", () => ({ color: "#8a5a36" }));
  // the big easel: two raked legs and a back leg, a ledge; the sheet (two halves that tear apart) stands on it
  const W2 = 1.5, H2 = 2.25;
  for (const s of [-1, 1]) solid.add(boxGeo(P(s * 0.7 - 0.05, 0, -0.93), P(s * 0.7 + 0.05, 2.5, -0.85)), wood);
  solid.add(boxGeo(P(-0.05, 0, -1.9), P(0.05, 2.3, -1.82)), wood);
  solid.add(boxGeo(P(-0.85, 0.1, -0.9), P(0.85, 0.16, -0.72)), wood);
  const halves: THREE.Group[] = [];
  for (const side of [-1, 1] as const) {
    const pg = new THREE.Group(); pg.position.copy(P(0, 0.16, -0.8)); g.add(pg);
    const geo = new THREE.PlaneGeometry(W2, H2); geo.translate(0, H2 / 2, 0);
    const m = new THREE.Mesh(geo, lam("c6carHalfM" + side, () => ({ map: halfTex(side), alphaTest: 0.5, side: THREE.DoubleSide })));
    m.castShadow = true; m.receiveShadow = true; pg.add(m);
    halves.push(pg);
  }
  // drawing table with a sheet, a stool; framed prints on the left wall; a window
  solid.add(boxGeo(P(-3.8, 0.85, -3.1), P(-2.4, 0.92, -2.2)), wood);
  for (const [x, z] of [[-3.75, -3.05], [-2.45, -3.05], [-3.75, -2.25], [-2.45, -2.25]]) solid.add(boxGeo(P(x - 0.04, 0, z - 0.04), P(x + 0.04, 0.85, z + 0.04)), wood);
  const sg = new THREE.PlaneGeometry(0.42, 0.6); sg.rotateX(-Math.PI / 2); shell.add(sg, lam("c6carSmall", () => ({ map: printTex(0) })), M4(o[0] - 3.1, 0.925, o[2] - 2.65));
  for (let k = 0; k < 4; k++) shell.add(quad(P(-4.97, 1.4, -0.6 + k * 0.9), P(-4.97, 1.4, -1.2 + k * 0.9), P(-4.97, 2.2, -1.2 + k * 0.9), P(-4.97, 2.2, -0.6 + k * 0.9)), lam("c6printM" + (k % 2), () => ({ map: printTex(k % 2) })));
  windowAt(g, solid, P, 2.6, -4.0, 1.4, 1.2, 3.0, wood).night.visible = false;
  shell.build(g, false); solid.build(g, true);
  return { group: g, halves, sheetW: W2, sheetH: H2 };
};

// ---------------- Paris ----------------
const stoneM = () => lam("c6parisStone", () => ({ map: rep(stoneHD("c6parisStoneHD", ["#e9dfc9", "#dfd3ba", "#efe6d3", "#d6c9ad"], "#b9ab90"), 1, 1) }));
/** a classical stone building: body, windows on two floors, a portico of columns with a pediment, a slate mansard */
const classical = (b: Batch, P: (x: number, y: number, z: number) => THREE.Vector3, cx: number, zf: number, w: number, h: number, d: number, ncol: number, podium: number, pedi: boolean) => {
  const st = stoneM(), glass = lam("c6glass", () => ({ color: "#3c4a63" })), trim = lam("c6trim", () => ({ color: "#f2ead8" }));
  b.add(boxGeo(P(cx - w / 2, 0, zf - d), P(cx + w / 2, h, zf), 4), st);
  for (let fl = 0; fl < 2; fl++) for (let x = cx - w / 2 + 1.4; x < cx + w / 2 - 1; x += 2.4) {
    if (Math.abs(x - cx) < 1.6 && fl === 0) continue;
    const y0 = podium + 1.2 + fl * 3.6;
    b.add(boxGeo(P(x - 0.55, y0, zf), P(x + 0.55, y0 + 2.2, zf + 0.04)), glass);
    b.add(boxGeo(P(x - 0.7, y0 - 0.15, zf), P(x + 0.7, y0, zf + 0.18)), trim);
    b.add(boxGeo(P(x - 0.7, y0 + 2.2, zf), P(x + 0.7, y0 + 2.4, zf + 0.14)), trim);
  }
  b.add(boxGeo(P(cx - 1.0, podium, zf - 0.1), P(cx + 1.0, podium + 3.4, zf + 0.03)), lam("c6doorDark", () => ({ color: "#4a3426" })));
  b.add(boxGeo(P(cx - w / 2 - 0.2, h - 0.6, zf - 0.2), P(cx + w / 2 + 0.2, h, zf + 0.3)), trim);
  const man = new THREE.CylinderGeometry(Math.SQRT1_2 * 0.82, Math.SQRT1_2, 1, 4, 1); man.rotateY(Math.PI / 4);
  b.add(man, roofMat("#8f97a8"), new THREE.Matrix4().compose(P(cx, h + 1.4, zf - d / 2), new THREE.Quaternion(), V(w, 2.8, d)));
  if (ncol > 0) {
    const pw = Math.min(w - 2, ncol * 2.2), pz = zf + 2.6, ch = h * 0.72;
    b.add(boxGeo(P(cx - pw / 2 - 0.5, 0, zf), P(cx + pw / 2 + 0.5, podium, pz + 0.6)), st);
    for (let k = 0; k < podium / 0.25; k++) b.add(boxGeo(P(cx - pw / 2 - 0.5, 0, pz + 0.6), P(cx + pw / 2 + 0.5, podium - 0.25 * k, pz + 0.6 + 0.4 * (k + 1))), st);
    for (let k = 0; k < ncol; k++) {
      const x = cx - pw / 2 + (k + 0.5) * (pw / ncol);
      b.add(new THREE.CylinderGeometry(0.36, 0.42, ch, 18), trim, M4(P(x, 0, 0).x, podium + ch / 2, P(0, 0, pz).z));
      b.add(boxGeo(P(x - 0.5, podium + ch, pz - 0.5), P(x + 0.5, podium + ch + 0.25, pz + 0.5)), trim);
    }
    const ey = podium + ch + 0.25;
    b.add(boxGeo(P(cx - pw / 2 - 0.5, ey, zf), P(cx + pw / 2 + 0.5, ey + 1.1, pz + 0.55)), st);
    if (pedi) {
      const L = cx - pw / 2 - 0.5, R = cx + pw / 2 + 0.5, top = ey + 1.1 + pw * 0.16;
      b.add(tri(P(L, ey + 1.1, pz + 0.55), P(R, ey + 1.1, pz + 0.55), P(cx, top, pz + 0.55)), st);
      b.add(quad(P(R, ey + 1.1, pz + 0.55), P(R, ey + 1.1, zf), P(cx, top, zf), P(cx, top, pz + 0.55)), roofMat("#8f97a8"));
      b.add(quad(P(L, ey + 1.1, zf), P(L, ey + 1.1, pz + 0.55), P(cx, top, pz + 0.55), P(cx, top, zf)), roofMat("#8f97a8"));
    }
  }
};
export type Paris = { group: THREE.Group; flag: THREE.Mesh };
export const buildParis = (kit: Kit, rays: Ray[]): Paris => {
  const g = new THREE.Group(), b = new Batch(), r = rnd(5), o = PARIS;
  const P = (x: number, y: number, z: number) => V(o[0] + x, y, o[2] + z);
  setSightLines(rays);
  // north side: bank (x -50), lycee (x -10), palace (x 45); fillers between (house() takes world coordinates)
  b.add(quad(P(-140, 0, 60), P(140, 0, 60), P(140, 0, -40), P(-140, 0, -40), 70, 25), lam("pxCobble", () => ({ map: rep(cobbleHD(), 1, 1) })));
  classical(b, P, -50, -10, 22, 11, 14, 6, 0.75, true);
  setSightLines([]); house(b, o[0] - 10, o[2] - 15, 0, 26, 10, 9.8, 7, 0); setSightLines(rays);
  // the lycee gate: two stone piers and a lintel in front of its door
  const st = stoneM();
  for (const s of [-1, 1]) b.add(boxGeo(P(-10 + s * 1.6 - 0.35, 0, -9.9), P(-10 + s * 1.6 + 0.35, 4.2, -9.2)), st);
  b.add(boxGeo(P(-12.0, 4.2, -9.95), P(-8.0, 4.9, -9.15)), st);
  // the palace (Tuileries): long two-storey body, central pavilion with a tall slate roof, six steps (see story.stepY)
  classical(b, P, 45, -10, 60, 12, 16, 0, 0, false);
  b.add(boxGeo(P(37, 0, -10.6), P(53, 15, -9.6)), st);
  const man = new THREE.CylinderGeometry(Math.SQRT1_2 * 0.55, Math.SQRT1_2, 1, 4, 1); man.rotateY(Math.PI / 4);
  b.add(man, roofMat("#8f97a8"), new THREE.Matrix4().compose(P(45, 18.5, -14), new THREE.Quaternion(), V(16, 7, 10)));
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) b.add(boxGeo(P(45 + s * (2.2 + k * 2.4) - 0.3, 0, -9.65), P(45 + s * (2.2 + k * 2.4) + 0.3, 14.4, -9.25)), lam("c6trim", () => ({ color: "#f2ead8" })));
  for (let i = 0; i < 6; i++) b.add(boxGeo(P(37, 0, -10), P(53, 0.2 * (i + 1), -7.3 - 0.45 * i)), st);
  b.add(new THREE.CylinderGeometry(0.07, 0.07, 6, 8), lam("c6pole", () => ({ color: "#5a4636" })), M4(o[0] + 45, 18.5 + 3.5 + 3, o[2] - 14));
  // fillers on the north side and the whole south side (shops, the cafe corner)
  for (const [x0, x1] of [[-125, -63], [-37, -25], [5, 13], [77, 125]] as const) {
    let x = x0;
    while (x < x1) { const w = [8, 9, 10][Math.floor(r() * 3)]; house(b, o[0] + x + w / 2, o[2] - 15, 0, w, 10, [9.8, 11.2, 12.6][Math.floor(r() * 3)], [0, 2, 6, 4, 7][Math.floor(r() * 5)], 0); x += w + 0.2; }
  }
  { let x = -125; while (x < 125) { const w = [8, 9, 10][Math.floor(r() * 3)]; house(b, o[0] + x + w / 2, o[2] + 19, Math.PI, w, 10, [9.8, 11.2, 12.6][Math.floor(r() * 3)], [0, 1, 6, 4, 2][Math.floor(r() * 5)], 0); x += w + 0.2; } }
  // the cafe corner (x -80): round tables, a column the spy hides behind
  const iron = lam("c6ironP", () => ({ color: "#3d414c" }));
  for (const [x, z] of [[-81.2, -1.6], [-77.4, -2.2]] as const) { b.add(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16), lam("c6marble", () => ({ color: "#ece4d4" })), M4(o[0] + x, 0.75, o[2] + z)); b.add(new THREE.CylinderGeometry(0.04, 0.06, 0.75, 8), iron, M4(o[0] + x, 0.375, o[2] + z)); }
  b.add(new THREE.CylinderGeometry(0.34, 0.38, 4.2, 16), stoneM(), M4(o[0] - 76.3, 2.1, o[2] - 0.6));
  // the ballot table (x -30): a table with a blue cloth and a wooden box
  b.add(boxGeo(P(-31.0, 0.72, 0.9), P(-29.2, 0.8, 1.9)), lam("c6desk", () => ({ color: "#6e4428" })));
  b.add(boxGeo(P(-31.05, 0.15, 1.85), P(-29.15, 0.78, 1.95)), lam("c6blueCloth", () => ({ color: "#2f4a8a" })));
  b.add(boxGeo(P(-30.4, 0.8, 1.15), P(-29.8, 1.22, 1.65)), lam("c6box", () => ({ color: "#8a5a36" })));
  b.add(boxGeo(P(-30.25, 1.22, 1.35), P(-29.95, 1.235, 1.45)), lam("c6slot", () => ({ color: "#1f1a18" })));
  // lanterns and a few trees along the street
  for (let x = -120; x <= 120; x += 16) if (Math.abs(x - 45) > 12 && Math.abs(x + 50) > 14) prop(b, kit, "lantern", o[0] + x, 0, o[2] + 4.5, 3.4);
  for (const x of [-95, -66, 20, 70, 100]) prop(b, kit, "tree_default", o[0] + x, 0, o[2] + 14, 7);
  b.build(g);
  setSightLines([]);
  // the tricolour over the palace (waves per frame)
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7, 12, 1), new THREE.MeshBasicMaterial({ map: flagTex("fr"), side: THREE.DoubleSide, color: 0xe6e6e6 }));
  flag.position.copy(P(45.05, 27.2, -14)); flag.frustumCulled = false; g.add(flag);
  return { group: g, flag };
};

// ---------------- Paris: the parvis of Notre-Dame (as chapter 1) ----------------
export const buildParvis = (kit: Kit, rays: Ray[]) => {
  const g = new THREE.Group(), b = new Batch(), r = rnd(3);
  setSightLines(rays);
  const [ox, , oz] = EXT;
  b.add(quad(V(ox - 90, 0, oz + 160), V(ox + 90, 0, oz + 160), V(ox + 90, 0, oz - 130), V(ox - 90, 0, oz - 130), 45, 72.5), lam("pxCobble", () => ({ map: rep(cobbleHD(), 1, 1) })));
  for (const s of [-1, 1]) {
    let z = 6;
    while (z < 150) {
      const w = [10, 12][Math.floor(r() * 2)], h = [12.6, 14][Math.floor(r() * 2)];
      house(b, ox + s * 52, oz + z + w / 2, s < 0 ? Math.PI / 2 : -Math.PI / 2, w, 10, h, [2, 7, 0, 3][Math.floor(r() * 4)], 0);
      z += w + 0.3;
    }
    for (let z = 10; z < 140; z += 14) prop(b, kit, "lantern", ox + s * 40, 0, oz + z, 3.4);
  }
  b.build(g);
  setSightLines([]);
  return g;
};

// ---------------- the school courtyard (as chapter 1) ----------------
export const buildSchool = (kit: Kit, rays: Ray[]) => {
  const g = new THREE.Group(), b = new Batch();
  setSightLines(rays);
  const [ox, , oz] = SCH;
  b.add(quad(V(ox - 40, 0, oz + 40), V(ox + 40, 0, oz + 40), V(ox + 40, 0, oz - 40), V(ox - 40, 0, oz - 40), 20, 20), lam("pxCobble", () => ({ map: rep(cobbleHD(), 1, 1) })));
  house(b, ox, oz - 18, 0, 34, 12, 12.6, 7, 0);
  house(b, ox - 24, oz - 2, Math.PI / 2, 22, 10, 11.2, 2, 0);
  house(b, ox + 24, oz - 2, -Math.PI / 2, 22, 10, 11.2, 2, 0);
  for (const x of [-6, 6]) prop(b, kit, "lantern", ox + x, 0, oz - 10.5, 3);
  b.build(g);
  setSightLines([]);
  return g;
};

// ---------------- the field (battle, Waterloo, camp) ----------------
export type Field = { group: THREE.Group; guns: THREE.Group[]; fire: THREE.Mesh[] };
export const buildField = (kit: Kit, rays: Ray[]): Field => {
  const g = new THREE.Group(), b = new Batch(), r = rnd(9), o = FIELD;
  const P = (x: number, y: number, z: number) => V(o[0] + x, y, o[2] + z);
  setSightLines(rays);
  b.add(quad(P(-400, 0, 400), P(400, 0, 400), P(400, 0, -400), P(-400, 0, -400), 60, 60), lam("c6grassM", () => ({ map: rep(fieldTex("grass", "#86a65c", ["rgba(110,140,70,0.45)", "rgba(160,180,100,0.4)", "rgba(96,124,62,0.35)", "rgba(190,180,120,0.25)"]), 1, 1) })));
  // rolling hills: low caps on the horizon, the Waterloo ridge behind x 150
  const hill = new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("c6hillA", () => ({ color: "#7fa055" })), lam("c6hillB", () => ({ color: "#8fae62" })), lam("c6hillC", () => ({ color: "#749a50" }))];
  ([[0, -120, 140, 14, 40], [-160, -140, 120, 12, 50], [150, -60, 120, 9, 26], [260, -150, 160, 18, 60], [-300, -60, 120, 16, 60], [60, 220, 150, 12, 50], [-200, 200, 150, 12, 60], [300, 120, 130, 14, 60]] as const)
    .forEach(([x, z, sx, sy, sz], i) => b.add(hill, hm[i % 3], new THREE.Matrix4().compose(P(x, -0.4, z), new THREE.Quaternion(), V(sx, sy, sz))));
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 700, z = -60 - r() * 280;
    prop(b, kit, r() < 0.5 ? "tree_default" : "tree_fat", o[0] + x, 0, o[2] + z, 6 + r() * 4, r() * 6);
  }
  for (let i = 0; i < 40; i++) { const x = (r() - 0.5) * 700, z = 60 + r() * 250; prop(b, kit, "tree_default", o[0] + x, 0, o[2] + z, 6 + r() * 3, r() * 6); }
  // the camp (x -150): white tents, a stack of muskets, the campfire ring
  const canvas = lam("c6tent", () => ({ color: "#efe8d6", side: THREE.DoubleSide }));
  for (const [x, z, a] of [[-158, -7, 0.2], [-151, -9, -0.1], [-143, -7.5, 0.3], [-162, 12, 1.2], [-139, 13, -1.0], [-156, 28, 0.4], [-144, 29, -0.3]] as const) {
    const tg = new THREE.ConeGeometry(2.0, 2.8, 4, 1); tg.rotateY(Math.PI / 4 + a);
    b.add(tg, canvas, M4(o[0] + x, 1.4, o[2] + z));
  }
  const stones = lam("c6fireStone", () => ({ color: "#8a8378" }));
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; b.add(new THREE.DodecahedronGeometry(0.16, 0), stones, M4(o[0] - 150 + Math.cos(a) * 0.55, 0.1, o[2] + 19.4 + Math.sin(a) * 0.55)); }
  const logs = lam("c6log", () => ({ color: "#5a3a24" }));
  for (let k = 0; k < 3; k++) { const lg = new THREE.CylinderGeometry(0.07, 0.07, 0.8, 8); lg.rotateZ(Math.PI / 2); lg.rotateY(k * 1.05); b.add(lg, logs, M4(o[0] - 150, 0.1, o[2] + 19.4)); }
  b.build(g);
  setSightLines([]);
  // cannons (battle and Waterloo smoke)
  const guns: THREE.Group[] = [];
  for (const [x, z, yaw] of [[-7, -4, 0], [-3.5, -7, 0], [143, -14, 0.2]] as const) { const c = cannon({ elev: 4 }); c.position.copy(P(x, 0, z)); c.rotation.y = yaw; g.add(c); guns.push(c); }
  // the campfire flames (unlit, glowing; animated per frame)
  const fire: THREE.Mesh[] = [];
  for (let k = 0; k < 3; k++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.22 - k * 0.05, 0.7 - k * 0.12, 8), basic(k ? new THREE.Color(3.0, 2.3, 0.8) : new THREE.Color(2.6, 1.0, 0.3)));
    m.position.copy(P(-150 + (k - 1) * 0.12, 0.35, 19.4)); m.layers.set(NOINK); g.add(m); fire.push(m);
  }
  return { group: g, guns, fire };
};

// ---------------- the Russian snow ----------------
export const buildSnow = (rays: Ray[]) => {
  const g = new THREE.Group(), b = new Batch(), r = rnd(13), o = SNOW;
  const P = (x: number, y: number, z: number) => V(o[0] + x, y, o[2] + z);
  setSightLines(rays);
  const snow = lam("c6snowGround", () => ({ map: rep(fieldTex("snow", "#eef1f6", ["rgba(210,218,232,0.5)", "rgba(255,255,255,0.6)", "rgba(196,206,224,0.35)"]), 1, 1) }));
  b.add(quad(P(-400, 0, 400), P(400, 0, 400), P(400, 0, -400), P(-400, 0, -400), 40, 40), snow);
  const hill = new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), hs = lam("c6snowHill", () => ({ color: "#e4e9f1" }));
  for (const [x, z, sx, sy, sz] of [[-60, -160, 180, 18, 60], [140, -200, 200, 24, 70], [-260, -120, 160, 16, 60], [300, -80, 160, 14, 60]] as const) b.add(hill, hs, new THREE.Matrix4().compose(P(x, -0.4, z), new THREE.Quaternion(), V(sx, sy, sz)));
  // dark pines with snowy shoulders
  const pine = lam("c6pine", () => ({ color: "#2f4a3f" })), cap = lam("c6pineSnow", () => ({ color: "#f2f5f9" })), trunk = lam("c6trunk", () => ({ color: "#4a3426" }));
  for (let i = 0; i < 120; i++) {
    const x = (r() - 0.5) * 400, z = -14 - r() * 200, h = 5 + r() * 6;
    if (Math.abs(x) < 9 && z > -30) continue;
    b.add(new THREE.CylinderGeometry(0.15, 0.2, h * 0.3, 6), trunk, M4(o[0] + x, h * 0.15, o[2] + z));
    for (let k = 0; k < 3; k++) {
      const rr = (0.42 - k * 0.1) * h * 0.55, cy = h * (0.3 + k * 0.22);
      b.add(new THREE.ConeGeometry(rr, h * 0.36, 9), pine, M4(o[0] + x, cy + h * 0.18, o[2] + z));
      b.add(new THREE.ConeGeometry(rr * 0.6, h * 0.16, 9), cap, M4(o[0] + x, cy + h * 0.3, o[2] + z));
    }
  }
  b.build(g);
  setSightLines([]);
  return g;
};

// ---------------- Saint Helena ----------------
export const buildHelena = (kit: Kit) => {
  const g = new THREE.Group(), b = new Batch(), r = rnd(17), o = HEL;
  const [rx, ry, rz] = HEL_R;
  const rock = lam("c6helRock", () => ({ map: rep(rockTex(), 6, 3) }));
  const sph = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  b.add(sph, rock, new THREE.Matrix4().compose(V(o[0], -6, o[2]), new THREE.Quaternion(), V(rx, ry, rz)));
  b.add(sph, lam("c6helGreen", () => ({ color: "#7d9a58" })), new THREE.Matrix4().compose(V(o[0], -6, o[2]), new THREE.Quaternion(), V(rx * 0.8, ry * 1.04, rz * 0.78)));
  for (let i = 0; i < 14; i++) { const a = r() * Math.PI * 2, s = 6 + r() * 10; b.add(new THREE.DodecahedronGeometry(s, 0), rock, M4(o[0] + Math.cos(a) * rx * 0.98, s * 0.2 - 2, o[2] + Math.sin(a) * rz * 0.98)); }
  // Longwood: a small long white house with a grey roof, a few trees
  house(b, o[0] + 4, o[2] - 4, 0.3, 14, 7, 4.2, 0, helY(4, -4) - 0.3);
  for (const [x, z] of [[-14, -18], [20, 10], [-8, 22], [26, -16], [-30, 2]] as const) prop(b, kit, "tree_fat", o[0] + x, helY(x, z) - 0.2, o[2] + z, 5.5);
  b.build(g);
  return g;
};

// ---------------- Corsica (chapter 1's harbour, copied) ----------------
const boatProto = (() => {
  const cache = new Map<string, THREE.Group>();
  return (hull: string, sail: boolean) => {
    const k = hull + sail;
    let gp = cache.get(k);
    if (!gp) {
      gp = new THREE.Group();
      const hg = new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); hg.scale(2.6, 0.95, 0.95);
      const h = new THREE.Mesh(hg, lam("boat" + hull, () => ({ color: hull, side: THREE.DoubleSide }))); h.position.y = 0.55; gp.add(h);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 28), lam("boatRim", () => ({ color: "#f2ead8" }))); rim.rotation.x = Math.PI / 2; rim.scale.set(2.6, 0.95, 1); rim.position.y = 0.55; gp.add(rim);
      const dg = new THREE.CircleGeometry(1, 24); dg.rotateX(-Math.PI / 2); dg.scale(2.35, 1, 0.8);
      const deck = new THREE.Mesh(dg, lam("boatDeck", () => ({ color: "#a8784a" }))); deck.position.y = 0.3; gp.add(deck);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), lam("boatMast", () => ({ color: "#6b4a2e" }))); mast.position.set(0.6, 2.5, 0); gp.add(mast);
      if (sail) {
        const sg = new THREE.BufferGeometry();
        sg.setAttribute("position", new THREE.Float32BufferAttribute([2.4, 1.0, 0, -1.8, 4.9, 0, 0.6, 0.9, 0], 3));
        sg.setAttribute("uv", new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0], 2)); sg.computeVertexNormals();
        const s = new THREE.Mesh(sg, lam("boatSail", () => ({ color: "#f3e7c9", side: THREE.DoubleSide }))); s.position.z = 0.1; gp.add(s);
        const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.6, 6), lam("boatMast", () => ({ color: "#6b4a2e" })));
        yard.position.set(0.3, 2.95, 0.12); yard.rotation.z = Math.atan2(4.9 - 1.0, -1.8 - 2.4) + Math.PI / 2; gp.add(yard);
      }
      gp.traverse((x) => { const m = x as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      cache.set(k, gp);
    }
    return gp.clone();
  };
})();
export type Corsica = { group: THREE.Group; boats: { o: THREE.Object3D; ph: number; yaw: number }[] };
const ELL = { cz: 380, rx: 650, rz: 380 };
const outline = (): [number, number][] => {
  const pts: [number, number][] = [[-220, 0], [220, 0]];
  for (let d = 25; d <= 335; d += 5) { const a = (d * Math.PI) / 180; pts.push([ELL.rx * Math.sin(a), ELL.cz - ELL.rz * Math.cos(a)]); }
  return pts;
};
export const buildCorsica = (kit: Kit, rays: Ray[]): Corsica => {
  const group = new THREE.Group(), b = new Batch(), r = rnd(7);
  setSightLines(rays);
  const shape = new THREE.Shape(outline().map(([x, z]) => new THREE.Vector2(x, -z)));
  const lg = new THREE.ShapeGeometry(shape, 4); lg.rotateX(-Math.PI / 2); lg.translate(0, G, 0);
  b.add(lg, lam("c6ajGroundM", () => ({ map: rep(ajGroundTex(), 1 / 14, 1 / 14), side: THREE.DoubleSide })));
  const quayM = lam("ajQuay", () => ({ map: rep(stoneHD("ajQuayHD", ["#d9c9a8", "#cdbb98", "#e0d2b4", "#c4b28e"], "#9e8d70"), 1, 1) }));
  const rockM = lam("c6ajRockM", () => ({ map: rep(rockTex(), 1, 1) }));
  const ol = outline();
  for (let i = 0; i < ol.length; i++) {
    const [x0, z0] = ol[i], [x1, z1] = ol[(i + 1) % ol.length], L = Math.hypot(x1 - x0, z1 - z0);
    b.add(quad(V(x1, -3, z1), V(x0, -3, z0), V(x0, G, z0), V(x1, G, z1), L / 4, (G + 3) / 4), i === 0 ? quayM : rockM);
  }
  const wood = lam("ajWood", () => ({ color: "#8a5a36" })), iron = lam("ajIron", () => ({ color: "#3d414c" }));
  for (let x = -200; x <= 200; x += 16) b.add(new THREE.CylinderGeometry(0.22, 0.26, 0.7, 10), iron, M4(x, G + 0.35, 0.8));
  for (const [x, z, s] of [[-48, 4, 0.9], [-46.8, 4.4, 0.7], [12, 5, 0.8], [96, 4, 0.9], [-120, 5, 0.8]] as const) b.add(boxGeo(V(x - s / 2, G, z - s / 2), V(x + s / 2, G + s, z + s / 2)), wood);
  for (const [x, z] of [[-45, 6], [14, 6.3], [-118, 6.2], [98, 6]]) b.add(new THREE.CylinderGeometry(0.38, 0.38, 0.95, 12), lam("ajBarrel", () => ({ color: "#9a6438" })), M4(x, G + 0.48, z));
  const STY = [0, 1, 4, 6, 0, 1];
  const row = (zc: number, skip: (x0: number, x1: number) => boolean, x0 = -205, x1 = 205, gapP = 0.2) => {
    let x = x0;
    while (x < x1) {
      const w = [8, 9, 10][Math.floor(r() * 3)], h = [9.8, 11.2, 12.6][Math.floor(r() * 3)];
      if (!skip(x, x + w)) house(b, x + w / 2, zc + (r() - 0.5) * 1.2, Math.PI, w, 8, h, STY[Math.floor(r() * STY.length)], G);
      x += w + (r() < gapP ? 3.5 : 0.2);
    }
  };
  const inSq = (a: number, c: number) => c > 20 && a < 100;
  const inCasa = (a: number, c: number) => c > CASA[0] - 7.5 && a < CASA[0] + 7.5;
  row(14, inSq);
  row(30, (a, c) => inSq(a, c) || inCasa(a, c));
  row(46, (a, c) => c > 44 && a < 77, -190, 190, 0.3);
  row(62, (a, c) => c > 44 && a < 77, -170, 170, 0.35);
  row(78, () => false, -140, 140, 0.45);
  house(b, CASA[0], CASA[2] + 4, Math.PI, 13, 8, 12.6, 1, G);
  house(b, 60, 46, Math.PI, 26, 16, 12.6, 0, G);
  b.add(new THREE.SphereGeometry(1, 24, 14), rockM, new THREE.Matrix4().compose(V(TOWER[0], -3, TOWER[2]), new THREE.Quaternion(), V(26, 12, 20)));
  b.add(new THREE.SphereGeometry(1, 24, 14), rockM, new THREE.Matrix4().compose(V(TOWER[0] + 2, -4, TOWER[2] + 34), new THREE.Quaternion(), V(19, 9.5, 34)));
  const tStone = lam("ajTower", () => ({ map: rep(stoneHD("ajTowerHD", ["#d1c19f", "#c6b490", "#d8caab", "#bca988"], "#988664"), 1, 1) }));
  b.add(new THREE.CylinderGeometry(4.1, 4.9, 15, 28), tStone, M4(TOWER[0], TOWER[1] + 7.5, TOWER[2]));
  b.add(new THREE.CylinderGeometry(4.6, 4.1, 1.4, 28), tStone, M4(TOWER[0], TOWER[1] + 15.7, TOWER[2]));
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, m = new THREE.BoxGeometry(1.1, 1.2, 0.6); m.rotateY(-a);
    b.add(m, tStone, M4(TOWER[0] + Math.cos(a) * 4.3, TOWER[1] + 17.0, TOWER[2] + Math.sin(a) * 4.3));
  }
  const hills = new Batch();
  const hill = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("ajHillA", () => ({ color: "#6f8f4a" })), lam("ajHillB", () => ({ color: "#7f9a55" })), lam("ajHillC", () => ({ color: "#8f9a72" })), lam("ajHillD", () => ({ color: "#9a9480" }))];
  ([[-350, 330, 240, 210, 190], [-80, 430, 290, 320, 220], [220, 390, 250, 260, 200], [450, 300, 200, 160, 160], [60, 610, 330, 430, 200],
    [-420, 560, 250, 340, 190], [380, 600, 250, 370, 200], [-160, 160, 120, 55, 70], [120, 175, 140, 62, 72], [310, 190, 100, 48, 62], [-300, 190, 110, 60, 80]] as const)
    .forEach(([x, z, sx, sy, sz], i) => hills.add(hill, hm[i % 4], new THREE.Matrix4().compose(V(x, G - 2, z), new THREE.Quaternion(), V(sx, sy, sz))));
  for (let i = 0; i < 170; i++) {
    const x = (r() - 0.5) * 760, z = 90 + r() * 240;
    if (Math.abs(x) < 160 && z < 95) continue;
    prop(b, kit, r() < 0.55 ? "plant_bushLarge" : r() < 0.5 ? "tree_fat" : "tree_default", x, G, z, r() < 0.55 ? 2 + r() * 1.5 : 6 + r() * 3, r() * 6);
  }
  b.build(group);
  hills.build(group, false);
  setSightLines([]);
  const boats: Corsica["boats"] = [];
  const hulls = ["#3f6fb5", "#c8473a", "#2f7a5a", "#e8dcc0", "#d9a441", "#3f6fb5", "#c8473a"];
  ([[-72, -15, 0.3], [-45, -24, -0.4], [-6, -17, 0.15], [24, -26, 2.8], [52, -14, 3.0], [88, -24, -0.2], [118, -15, 0.4], [-98, -30, 2.9]] as const).forEach(([x, z, yaw], i) => {
    const ob = boatProto(hulls[i % hulls.length], i % 3 !== 1); ob.position.set(x, 0, z); ob.rotation.y = yaw; group.add(ob);
    boats.push({ o: ob, ph: i * 1.7, yaw });
  });
  return { group, boats };
};
export { INK };
