// Static scenery of chapter 3, built once into merged batches: Toulon (height-field land, quay wall, town, hills,
// trees, the British fort, the French camp with tents and the map table, the battery's gabions), the Paris square
// (houses, the grand portico on its steps) and the palace room (marble floor, walls, curtain, throne dais, war table).
import * as THREE from "three";
import { Batch, V, lam, quad, tri, boxGeo, prop, house, setSightLines, Kit, Ray } from "../../../src/engine/build";
import { rng, ctex, rep, stoneHD, cobbleHD, grassHD, beamHD, planksHD } from "../../../src/engine/paint";
import { ground, LAND, QUAY_Z, FORT_C, FORT_Y, CAMP_C, CAMP_Y, PARIS, STEPS_Z, STEP_N, STEP_H, STEP_D, ROOM, THRONE, WAR_TABLE } from "./terrain";
import { TABLE, BAT, OFFICER_SPOT, WALL_TOP, LOOKOUT } from "./story";

type P2 = [number, number];

// ---------------- painted textures ----------------
/** parchment map of Europe on the war table: land blobs, France blue, the coalition in muted colours, no text */
export const europeMap = () => ctex("ojl3_europe", 1024, 704, (g, r) => {
  g.fillStyle = "#9cc7c9"; g.fillRect(0, 0, 1024, 704);
  g.strokeStyle = "rgba(60,90,100,.25)"; g.lineWidth = 2;
  for (let y = 30; y < 704; y += 46) { g.beginPath(); for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y + 6 * Math.sin(x * 0.03 + y)); g.stroke(); }
  const blob = (pts: P2[], col: string) => {
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
    g.fillStyle = col; g.fill(); g.lineWidth = 6; g.strokeStyle = "#4a3a2c"; g.stroke();
  };
  // continent
  blob([[250, 704], [210, 560], [300, 470], [330, 380], [400, 330], [470, 270], [560, 220], [700, 160], [860, 120], [1024, 110], [1024, 704]], "#e9d9b0");
  blob([[290, 130], [345, 100], [370, 170], [350, 250], [380, 290], [320, 300], [300, 240], [270, 200]], "#d9a7a0"); // Britain
  blob([[180, 600], [210, 520], [300, 500], [390, 540], [380, 640], [250, 680], [190, 660]], "#e0c27a"); // Spain
  blob([[330, 380], [400, 330], [470, 300], [520, 360], [500, 460], [440, 520], [380, 510], [320, 470]], "#6f93d6"); // France
  blob([[470, 300], [520, 250], [560, 280], [520, 330]], "#d6b48a"); // the Low Countries
  blob([[520, 360], [560, 280], [700, 240], [760, 300], [720, 400], [600, 420]], "#b9c58a"); // German states + Austria
  blob([[700, 160], [860, 120], [900, 220], [760, 300], [700, 240]], "#a9b0c9"); // Prussia
  blob([[560, 470], [610, 440], [650, 500], [700, 600], [680, 640], [640, 560], [590, 520]], "#e2b07e"); // Italy
  blob([[600, 420], [720, 400], [760, 470], [700, 520], [650, 480]], "#c9a4c0"); // Piedmont + the Alps
  // rivers + mountains marks
  g.strokeStyle = "rgba(70,110,150,.8)"; g.lineWidth = 4;
  for (const pts of [[[420, 340], [440, 420], [470, 460]], [[560, 300], [600, 360], [660, 380]]] as P2[][]) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
  g.fillStyle = "rgba(110,90,70,.55)";
  for (let i = 0; i < 26; i++) { const x = 560 + r() * 140, y = 420 + r() * 50; g.beginPath(); g.moveTo(x - 9, y + 7); g.lineTo(x, y - 9); g.lineTo(x + 9, y + 7); g.fill(); }
  g.strokeStyle = "rgba(60,40,30,.9)"; g.lineWidth = 14; g.strokeRect(7, 7, 1010, 690);
});
/** Toulon on the camp map table: the harbour, the town, the heights with the fort (a star), no text */
export const toulonMap = () => ctex("ojl3_toulonmap", 1024, 704, (g, r) => {
  g.fillStyle = "#ead9b0"; g.fillRect(0, 0, 1024, 704);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(120,90,50,${0.05 + 0.05 * r()})`; g.fillRect(r() * 1024, r() * 704, 3, 3); }
  // water: the harbour opening to the right
  g.beginPath(); g.moveTo(1024, 160); g.lineTo(560, 170); g.bezierCurveTo(330, 180, 300, 330, 380, 470); g.bezierCurveTo(470, 560, 760, 540, 1024, 560); g.closePath();
  g.fillStyle = "#8fb9cf"; g.fill(); g.lineWidth = 7; g.strokeStyle = "#3e5a6a"; g.stroke();
  // the town above the harbour: little blocks
  g.fillStyle = "#b9654a"; g.strokeStyle = "#3a2a20"; g.lineWidth = 3;
  for (let i = 0; i < 26; i++) { const x = 520 + (i % 7) * 34 + r() * 8, y = 60 + Math.floor(i / 7) * 26; g.fillRect(x, y, 26, 18); g.strokeRect(x, y, 26, 18); }
  // the heights with contour rings and the fort star (lower left)
  for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(250, 500, 170 - k * 30, 120 - k * 21, 0.2, 0, Math.PI * 2); g.strokeStyle = `rgba(110,80,50,${0.35 + k * 0.1})`; g.lineWidth = 4; g.stroke(); }
  g.beginPath();
  for (let k = 0; k < 10; k++) { const a = (k * Math.PI) / 5 - Math.PI / 2, rr = k % 2 ? 22 : 48; g.lineTo(250 + rr * Math.cos(a), 500 + rr * Math.sin(a)); }
  g.closePath(); g.fillStyle = "#c8372f"; g.fill(); g.lineWidth = 6; g.strokeStyle = "#2a1a14"; g.stroke();
  // little ships in the harbour
  for (const [x, y] of [[620, 300], [700, 400], [820, 280], [880, 430], [540, 420]] as P2[]) { g.beginPath(); g.ellipse(x, y, 22, 8, 0, 0, Math.PI * 2); g.fillStyle = "#3a2e2a"; g.fill(); }
  // French lines (blue dashes) around the land side
  g.strokeStyle = "#2c4790"; g.lineWidth = 9; g.setLineDash([22, 14]);
  g.beginPath(); g.moveTo(60, 380); g.bezierCurveTo(90, 200, 300, 60, 470, 40); g.stroke(); g.setLineDash([]);
  g.strokeStyle = "rgba(60,40,30,.9)"; g.lineWidth = 14; g.strokeRect(7, 7, 1010, 690);
});
const marbleTex = () => ctex("ojl3_marble", 512, 512, (g, r) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    g.fillStyle = (x + y) % 2 ? "#e8e0d2" : "#7a5a4e"; g.fillRect(x * 128, y * 128, 128, 128);
  }
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 2;
  for (let i = 0; i < 30; i++) { g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.bezierCurveTo(x + 40, y + 10, x + 60, y + 60, x + 100, y + 40); g.stroke(); }
  g.strokeStyle = "rgba(40,30,30,.35)"; g.lineWidth = 3;
  for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, 512); g.moveTo(0, k * 128); g.lineTo(512, k * 128); g.stroke(); }
});
const palaceWall = () => ctex("ojl3_palacewall", 512, 512, (g) => {
  g.fillStyle = "#d9cdb4"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#c29a4a"; g.lineWidth = 10;
  g.strokeRect(60, 70, 392, 330); g.lineWidth = 4; g.strokeRect(84, 94, 344, 282);
  g.fillStyle = "#cfc0a2"; g.fillRect(0, 440, 512, 72);
  g.strokeStyle = "#a88a54"; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 440); g.lineTo(512, 440); g.stroke();
});
const curtainTex = () => ctex("ojl3_curtain", 256, 512, (g) => {
  for (let x = 0; x < 256; x++) { const k = 0.75 + 0.25 * Math.sin(x * 0.12); g.fillStyle = `rgb(${Math.round(150 * k)},${Math.round(30 * k)},${Math.round(44 * k)})`; g.fillRect(x, 0, 1, 512); }
  g.fillStyle = "#d4a845"; g.fillRect(0, 470, 256, 18);
});
const canvasTex = () => ctex("ojl3_canvas", 256, 256, (g, r) => {
  g.fillStyle = "#ece2c8"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(150,130,100,.35)"; g.lineWidth = 2;
  for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  for (let i = 0; i < 80; i++) { g.fillStyle = "rgba(140,120,90,.12)"; g.fillRect(r() * 256, r() * 256, 6, 2); }
});
const wickerTex = () => ctex("ojl3_wicker", 256, 256, (g) => {
  g.fillStyle = "#b08a58"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 32) {
    g.fillStyle = (y / 16) % 2 ? "#c9a46a" : "#9c7a4c"; g.fillRect(x + ((y / 16) % 2) * 16, y, 18, 14);
  }
  g.fillStyle = "#6a4c30"; for (let x = 8; x < 256; x += 32) g.fillRect(x, 0, 5, 256);
});
const scrubTex = () => { const t = ctex("ojl3_scrub", 1024, 1024, (g, r) => {
  // Provencal hillside: dry olive-green grass with darker scrub patches and pale stony bits
  g.fillStyle = "#a9b56a"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 900; i++) { const x = r() * 1024, y = r() * 1024, s = 6 + r() * 20; g.fillStyle = r() < 0.5 ? "rgba(110,140,70,.35)" : "rgba(200,190,130,.3)"; g.beginPath(); g.ellipse(x, y, s, s * 0.6, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 160; i++) { const x = r() * 1024, y = r() * 1024; g.fillStyle = "rgba(225,215,190,.55)"; g.fillRect(x, y, 4 + r() * 6, 3 + r() * 4); }
}); return rep(t, 1, 1); };

// ---------------- helpers ----------------
/** wall slab from a to b (plan points), y0..y1, thickness th, stone tiled every 3 m */
const slab = (b: Batch, m: THREE.Material, a: P2, c: P2, y0: number, y1: number, th: number) => {
  const dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz), nx = -dz / L, nz = dx / L, h = th / 2;
  const p = (s: P2, k: number, y: number) => V(s[0] + nx * h * k, y, s[1] + nz * h * k);
  const u = L / 3, v = (y1 - y0) / 3;
  b.add(quad(p(a, 1, y0), p(c, 1, y0), p(c, 1, y1), p(a, 1, y1), u, v), m);
  b.add(quad(p(c, -1, y0), p(a, -1, y0), p(a, -1, y1), p(c, -1, y1), u, v), m);
  b.add(quad(p(a, 1, y1), p(c, 1, y1), p(c, -1, y1), p(a, -1, y1), u, th / 3), m);
  b.add(quad(p(a, -1, y0), p(a, 1, y0), p(a, 1, y1), p(a, -1, y1), th / 3, v), m);
  b.add(quad(p(c, 1, y0), p(c, -1, y0), p(c, -1, y1), p(c, 1, y1), th / 3, v), m);
};
/** the fort outline: a ten-point star (bastion tips at 21 m, re-entrants at 14 m) */
export const FORT_PTS: P2[] = Array.from({ length: 10 }, (_, k) => {
  const a = (k * Math.PI) / 5 + Math.PI / 10, r = k % 2 ? 14.5 : 21;
  return [FORT_C[0] + r * Math.cos(a), FORT_C[1] + r * Math.sin(a)];
});
/** gabion and tent spots (exported so the cast keeps clear of them) */
export const TENTS: [number, number, number][] = [[-300, -96, 0.3], [-292, -84, -0.2], [-298, -140, 0.9], [-276, -86, 0.1], [-312, -128, 1.2], [-262, -88, -0.4]];
export const GUNS_BAT: P2[] = [[BAT[0], BAT[2] - 4.2], [BAT[0], BAT[2]], [BAT[0], BAT[2] + 4.2]];

export const buildSets = (root: THREE.Object3D, kit: Kit, rays: Ray[]) => {
  const b = new Batch(), r = rng(31);
  setSightLines(rays);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const M = {
    scrub: lam("ojl3_scrub", () => ({ map: scrubTex() })),
    quay: lam("ojl3_quay", () => ({ map: stoneHD("ojl3_quayHD", ["#d9c9a8", "#cdbd9b", "#e3d4b4", "#c4b392"], "#9c8b6e") })),
    fort: lam("ojl3_fort", () => ({ map: stoneHD("ojl3_fortHD", ["#d4c4a4", "#c8b796", "#ddd0b2", "#bfae8c"], "#8e7f66") })),
    cobble: lam("cobbleHD", () => ({ map: cobbleHD() })),
    paris: lam("ojl3_parisStone", () => ({ map: stoneHD("ojl3_parisHD", ["#e6dcc6", "#ddd2ba", "#ece3cf", "#d6caae"], "#aa9c80") })),
    wood: lam("ojl3_wood", () => ({ map: beamHD() })),
    planks: lam("ojl3_planks", () => ({ map: planksHD() })),
    canvas: lam("ojl3_canvas", () => ({ map: canvasTex(), side: THREE.DoubleSide })),
    wicker: lam("ojl3_wicker", () => ({ map: rep(wickerTex(), 1, 1) })),
    marble: lam("ojl3_marble", () => ({ map: rep(marbleTex(), 1, 1) })),
    pwall: lam("ojl3_pwall", () => ({ map: palaceWall() })),
    curtain: lam("ojl3_curtain", () => ({ map: curtainTex() })),
    gold: lam("ojl3_gold", () => ({ color: "#d9a93c" })),
    velvet: lam("ojl3_velvet", () => ({ color: "#a3243a" })),
    dark: lam("ojl3_darkwood", () => ({ color: "#5a3a28" })),
    emap: lam("ojl3_emap", () => ({ map: europeMap() })),
    tmap: lam("ojl3_tmap", () => ({ map: toulonMap() })),
    roofT: lam("ojl3_roofT", () => ({ color: "#c46a4a" })),
  };

  // ======== TOULON ========
  // height field (4 m cells), world-scale uvs (one scrub tile per 14 m)
  const X0 = -540, X1 = 540, Z0 = -440, Z1 = 440, S = 4, nx = (X1 - X0) / S, nz = (Z1 - Z0) / S;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = X0 + i * S, z = Z0 + j * S;
    pos.push(x, ground(x, z), z); uv.push(x / 14, -z / 14);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, c = a + nx + 1;
    idx.push(a, c, a + 1, a + 1, c, c + 1);
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); tg.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); tg.setIndex(idx);
  tg.computeVertexNormals();
  const terr = new THREE.Mesh(tg, M.scrub); terr.receiveShadow = true; terr.castShadow = false; root.add(terr);

  // quay wall along the town front (z = QUAY_Z), with a coping
  b.add(quad(V(125, -5, QUAY_Z), V(-75, -5, QUAY_Z), V(-75, LAND, QUAY_Z), V(125, LAND, QUAY_Z), 200 / 3, 7.5 / 3), M.quay);
  b.add(boxGeo(V(-75, LAND - 0.05, QUAY_Z - 0.3), V(125, LAND + 0.25, QUAY_Z + 0.6), 2), M.quay);
  b.add(quad(V(-75, LAND, 230), V(125, LAND, 230), V(125, LAND, QUAY_Z), V(-75, LAND, QUAY_Z), 200 / 4, (230 - QUAY_Z) / 4), M.cobble);
  // town flat: paving under the houses (quad on the flat land, a hair above it: the land itself is flat at LAND there)
  // town: rows of Provencal houses facing the harbour (fronts toward -z), a church tower
  const PROV = [0, 1, 4, 5];
  for (const [zf, step] of [[QUAY_Z + 8.5, 0.6], [QUAY_Z + 24, 1.5], [QUAY_Z + 39, 2.5], [QUAY_Z + 55, 3], [QUAY_Z + 72, 3]] as const) {
    let x = -70 + r() * 3;
    while (x < 118) {
      const w = pick([7, 8, 9]), h = pick([8.4, 9.8, 11.2]), cx = x + w / 2;
      if (!(zf > QUAY_Z + 30 && Math.abs(cx - 30) < 7)) house(b, cx, zf + 4, Math.PI, w, 8, h, pick(PROV), LAND);
      x += w + step + (r() < 0.2 ? 4 : 0);
    }
  }
  // church tower in the town
  b.add(boxGeo(V(26, LAND, QUAY_Z + 36), V(33, LAND + 24, QUAY_Z + 43), 3), M.quay);
  const spire = new THREE.ConeGeometry(4.8, 7, 4, 1); spire.rotateY(Math.PI / 4);
  b.add(spire, M.roofT, new THREE.Matrix4().makeTranslation(29.5, LAND + 27.5, QUAY_Z + 39.5));
  // quay furniture: bollards, crates, a cart, lanterns
  for (let x = -66; x < 120; x += 9) { const bo = new THREE.CylinderGeometry(0.22, 0.28, 0.7, 10); b.add(bo, M.dark, new THREE.Matrix4().makeTranslation(x, LAND + 0.35, QUAY_Z + 1.2)); }
  for (const [x, z] of [[12, 75], [44, 74], [-30, 76], [70, 75.5]] as P2[]) b.add(boxGeo(V(x, LAND, z), V(x + 1.1, LAND + 0.9, z + 1.1), 1), M.planks);
  prop(b, kit, "cart", 51, LAND, 77, 2.2, 0.4);
  for (let x = -60; x < 120; x += 24) prop(b, kit, "lantern", x, LAND, QUAY_Z + 3, 2.8);

  // the fort: star walls (outer parapet), a magazine, barracks, sandbag-ish rim, guns are dynamic (world.ts)
  for (let k = 0; k < FORT_PTS.length; k++) {
    const a = FORT_PTS[k], c = FORT_PTS[(k + 1) % FORT_PTS.length];
    slab(b, M.fort, a, c, FORT_Y - 4, WALL_TOP, 2.6);
    // parapet on the outer edge
    const mx = (a[0] + c[0]) / 2 - FORT_C[0], mz = (a[1] + c[1]) / 2 - FORT_C[1], ml = Math.hypot(mx, mz), ox = (mx / ml) * 1.0, oz = (mz / ml) * 1.0;
    slab(b, M.fort, [a[0] + ox, a[1] + oz], [c[0] + ox, c[1] + oz], WALL_TOP, WALL_TOP + 1.1, 0.7);
  }
  // inner yard floor: the summit is flat at FORT_Y already; a ramp-less wall walk is implied
  house(b, FORT_C[0] - 2, FORT_C[1] + 3, -Math.PI / 2, 9, 7, 5.6, 2, FORT_Y);
  b.add(boxGeo(V(FORT_C[0] + 4, FORT_Y, FORT_C[1] - 7), V(FORT_C[0] + 10, FORT_Y + 3.2, FORT_C[1] - 2), 3), M.fort);

  // the French camp: ridge tents, the map table, an officer's crate, shot pyramids
  for (const [x, z, yaw] of TENTS) {
    const y = ground(x, z), w = 2.6, L = 3.6, H = 2.3, m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
    const g1 = quad(V(-w / 2, 0, -L / 2), V(-w / 2, 0, L / 2), V(0, H, L / 2), V(0, H, -L / 2), 2, 1);
    const g2 = quad(V(w / 2, 0, L / 2), V(w / 2, 0, -L / 2), V(0, H, -L / 2), V(0, H, L / 2), 2, 1);
    b.add(g1, M.canvas, m); b.add(g2, M.canvas, m);
    b.add(tri(V(-w / 2, 0, L / 2), V(w / 2, 0, L / 2), V(0, H, L / 2)), M.canvas, m);
    b.add(tri(V(w / 2, 0, -L / 2), V(-w / 2, 0, -L / 2), V(0, H, -L / 2)), M.canvas, m);
    b.add(boxGeo(V(-0.05, 0, L / 2 + 0.05), V(0.05, H + 0.5, L / 2 + 0.15)), M.wood, m);
  }
  // map table: top with the Toulon map, four legs
  const TY = 0.95;
  b.add(boxGeo(V(TABLE[0] - 1.1, TABLE[1] + TY - 0.08, TABLE[2] - 0.7), V(TABLE[0] + 1.1, TABLE[1] + TY, TABLE[2] + 0.7)), M.dark);
  b.add(quad(V(TABLE[0] - 1.02, TABLE[1] + TY + 0.004, TABLE[2] + 0.66), V(TABLE[0] + 1.02, TABLE[1] + TY + 0.004, TABLE[2] + 0.66),
    V(TABLE[0] + 1.02, TABLE[1] + TY + 0.004, TABLE[2] - 0.66), V(TABLE[0] - 1.02, TABLE[1] + TY + 0.004, TABLE[2] - 0.66)), M.tmap);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(boxGeo(V(TABLE[0] + sx * 1.0 - 0.05, TABLE[1], TABLE[2] + sz * 0.6 - 0.05), V(TABLE[0] + sx * 1.0 + 0.05, TABLE[1] + TY - 0.08, TABLE[2] + sz * 0.6 + 0.05)), M.dark);
  b.add(boxGeo(V(OFFICER_SPOT[0] - 0.45, OFFICER_SPOT[1], OFFICER_SPOT[2] - 0.75), V(OFFICER_SPOT[0] + 0.45, OFFICER_SPOT[1] + 0.5, OFFICER_SPOT[2] - 0.15), 1), M.planks);
  // gabions in front of the battery (gaps at the embrasures)
  for (let z = BAT[2] - 6.6; z <= BAT[2] + 6.6; z += 0.95) {
    if (GUNS_BAT.some(([, gz]) => Math.abs(z - gz) < 0.7)) continue;
    const x = BAT[0] + 3.2, y = ground(x, z);
    b.add(new THREE.CylinderGeometry(0.45, 0.45, 1.25, 14, 1, true), M.wicker, new THREE.Matrix4().makeTranslation(x, y + 0.6, z));
    b.add(new THREE.CircleGeometry(0.45, 14).rotateX(-Math.PI / 2), M.scrub, new THREE.Matrix4().makeTranslation(x, y + 1.22, z));
  }
  // vegetation: cypresses + olive-ish round trees + scrub; none on the fort summit, the camp spots, the battery
  const clear = (x: number, z: number) =>
    Math.hypot(x - FORT_C[0], z - FORT_C[1]) < 34 || Math.hypot(x - CAMP_C[0], z - CAMP_C[1]) < 40 || Math.hypot(x - BAT[0], z - BAT[2]) < 16 ||
    Math.hypot(x - LOOKOUT[0], z - LOOKOUT[2]) < 10 || (x > -80 && x < 130 && z > QUAY_Z - 2 && z < 240) || ground(x, z) < 1.2 || (z > -140 && z < -115 && x > -250 && x < -150);
  for (let i = 0; i < 420; i++) {
    const x = (r() - 0.5) * 900, z = (r() - 0.5) * 760;
    if (clear(x, z)) continue;
    const y = ground(x, z);
    const n = pick(["tree_cone", "tree_fat", "tree_default", "plant_bushLarge", "tree_cone"]);
    prop(b, kit, n, x, y - 0.2, z, n === "plant_bushLarge" ? 1.6 : n === "tree_cone" ? 8 + r() * 4 : 5 + r() * 2.5, r() * 6);
  }
  // sea beyond the height field to the east (water plane in world.ts covers it)

  // ======== PARIS ========
  const [px, , pz] = PARIS;
  b.add(quad(V(px - 120, 0, pz + 120), V(px + 160, 0, pz + 120), V(px + 160, 0, pz - 120), V(px - 120, 0, pz - 120), 280 / 4, 240 / 4), M.cobble);
  // square: west row, south row, east row with a street gap (nobles' street at z = 2000 going +x)
  for (let z = pz - 34; z < pz + 30; z += 8.6) house(b, px - 38, z + 4, Math.PI / 2, 8, 8, pick([11.2, 12.6]), pick([0, 1, 3, 4, 5]), 0);
  for (let x = px - 34; x < px + 34; x += 8.6) house(b, x + 4, pz - 38, 0, 8, 8, pick([11.2, 12.6]), pick([0, 1, 3, 4, 5]), 0);
  for (const zs of [-34, 8]) for (let z = pz + zs; z < pz + zs + 26 && z < pz + 30; z += 8.6) house(b, px + 38, z + 4, -Math.PI / 2, 8, 8, pick([11.2, 12.6]), pick([0, 1, 3, 4, 5]), 0);
  for (let x = px + 44; x < px + 110; x += 8.6) {
    house(b, x + 4, pz - 10, 0, 8, 8, pick([11.2, 12.6]), pick([0, 1, 4, 5]), 0);
    house(b, x + 4, pz + 10, Math.PI, 8, 8, pick([11.2, 12.6]), pick([0, 1, 4, 5]), 0);
  }
  // the grand portico on its steps (north side)
  for (let i = 0; i < STEP_N; i++) b.add(boxGeo(V(px - 9, 0, STEPS_Z + i * STEP_D), V(px + 9, (i + 1) * STEP_H, STEPS_Z + STEP_N * STEP_D), 1.5), M.paris);
  const top = STEP_N * STEP_H, zp = STEPS_Z + STEP_N * STEP_D;
  b.add(boxGeo(V(px - 16, 0, zp), V(px + 16, top, zp + 16), 2), M.paris);
  b.add(boxGeo(V(px - 16, top, zp + 3.5), V(px + 16, top + 12, zp + 16), 2.5), M.paris);
  for (let k = 0; k < 8; k++) {
    const cx = px - 10.5 + k * 3;
    b.add(new THREE.CylinderGeometry(0.55, 0.62, 9.6, 16), M.paris, new THREE.Matrix4().makeTranslation(cx, top + 4.8 + 0.3, zp + 1.4));
    b.add(boxGeo(V(cx - 0.75, top, zp + 0.65), V(cx + 0.75, top + 0.4, zp + 2.15)), M.paris);
  }
  b.add(boxGeo(V(px - 12.5, top + 10, zp + 0.4), V(px + 12.5, top + 11.4, zp + 3.6)), M.paris);
  b.add(tri(V(px + 12.5, top + 11.4, zp + 0.4), V(px - 12.5, top + 11.4, zp + 0.4), V(px, top + 15, zp + 0.4)), M.paris);
  b.add(quad(V(px - 12.5, top + 11.4, zp + 0.4), V(px - 12.5, top + 11.4, zp + 3.6), V(px, top + 15, zp + 3.6), V(px, top + 15, zp + 0.4), 3, 1), M.roofT);
  b.add(quad(V(px + 12.5, top + 11.4, zp + 3.6), V(px + 12.5, top + 11.4, zp + 0.4), V(px, top + 15, zp + 0.4), V(px, top + 15, zp + 3.6), 3, 1), M.roofT);
  // a tall door in the facade
  b.add(quad(V(px + 1.6, top, zp + 3.49), V(px - 1.6, top, zp + 3.49), V(px - 1.6, top + 5.5, zp + 3.49), V(px + 1.6, top + 5.5, zp + 3.49)), M.dark);
  for (let x = px - 30; x <= px + 30; x += 20) prop(b, kit, "lantern", x, 0, pz - 28, 3);
  prop(b, kit, "tree_oak", px - 26, 0, pz + 22, 8);
  prop(b, kit, "tree_oak", px + 26, 0, pz + 22, 8);

  // ======== PALACE ROOM ========
  const [rx, , rz] = ROOM;
  b.add(quad(V(rx - 8, 0, rz + 14), V(rx + 8, 0, rz + 14), V(rx + 8, 0, rz - 14), V(rx - 8, 0, rz - 14), 16 / 2.5, 28 / 2.5), M.marble);
  b.add(quad(V(rx - 8, 0, rz + 14), V(rx - 8, 0, rz - 14), V(rx - 8, 10, rz - 14), V(rx - 8, 10, rz + 14), 28 / 5, 2), M.pwall);
  b.add(quad(V(rx + 8, 0, rz - 14), V(rx + 8, 0, rz + 14), V(rx + 8, 10, rz + 14), V(rx + 8, 10, rz - 14), 28 / 5, 2), M.pwall);
  b.add(quad(V(rx + 8, 0, rz + 14), V(rx - 8, 0, rz + 14), V(rx - 8, 10, rz + 14), V(rx + 8, 10, rz + 14), 16 / 5, 2), M.pwall);
  b.add(quad(V(rx + 3.2, 0.7, rz + 13.9), V(rx - 3.2, 0.7, rz + 13.9), V(rx - 3.2, 8.5, rz + 13.9), V(rx + 3.2, 8.5, rz + 13.9), 3, 1), M.curtain);
  b.add(boxGeo(V(rx - 3.6, 8.5, rz + 13.4), V(rx + 3.6, 9.1, rz + 14)), M.gold);
  // dais (two steps, velvet top) and the throne
  b.add(boxGeo(V(THRONE[0] - 2.8, 0, THRONE[2] - 2.8), V(THRONE[0] + 2.8, 0.35, rz + 14)), M.paris);
  b.add(boxGeo(V(THRONE[0] - 1.8, 0.35, THRONE[2] - 1.6), V(THRONE[0] + 1.8, 0.7, rz + 14)), M.velvet);
  const ty = 0.7;
  b.add(boxGeo(V(THRONE[0] - 0.62, ty, THRONE[2] - 0.35), V(THRONE[0] + 0.62, ty + 0.48, THRONE[2] + 0.4)), M.gold);
  b.add(boxGeo(V(THRONE[0] - 0.52, ty + 0.48, THRONE[2] - 0.3), V(THRONE[0] + 0.52, ty + 0.6, THRONE[2] + 0.35)), M.velvet);
  b.add(boxGeo(V(THRONE[0] - 0.62, ty, THRONE[2] + 0.4), V(THRONE[0] + 0.62, ty + 2.2, THRONE[2] + 0.6)), M.gold);
  b.add(boxGeo(V(THRONE[0] - 0.48, ty + 0.65, THRONE[2] + 0.36), V(THRONE[0] + 0.48, ty + 2.0, THRONE[2] + 0.41)), M.velvet);
  const knob = new THREE.SphereGeometry(0.13, 12, 8);
  for (const sx of [-1, 1]) {
    b.add(knob, M.gold, new THREE.Matrix4().makeTranslation(THRONE[0] + sx * 0.62, ty + 2.3, THRONE[2] + 0.5));
    b.add(boxGeo(V(THRONE[0] + sx * 0.62 - 0.08, ty + 0.48, THRONE[2] - 0.35), V(THRONE[0] + sx * 0.62 + 0.08, ty + 0.9, THRONE[2] + 0.4)), M.gold);
  }
  // war table with the Europe map
  const [wx, , wz] = WAR_TABLE;
  b.add(boxGeo(V(wx - 1.7, 0.86, wz - 1.2), V(wx + 1.7, 0.95, wz + 1.2)), M.dark);
  b.add(quad(V(wx - 1.6, 0.954, wz + 1.1), V(wx + 1.6, 0.954, wz + 1.1), V(wx + 1.6, 0.954, wz - 1.1), V(wx - 1.6, 0.954, wz - 1.1)), M.emap);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(boxGeo(V(wx + sx * 1.55 - 0.07, 0, wz + sz * 1.05 - 0.07), V(wx + sx * 1.55 + 0.07, 0.86, wz + sz * 1.05 + 0.07)), M.gold);
  b.build(root);
  setSightLines([]);
};
/** map texture coordinates (u 0..1 left to right, v 0..1 top to bottom) to a point on the Toulon map table / war table */
export const onToulonMap = (u: number, v: number): [number, number, number] => [TABLE[0] - 1.02 + 2.04 * u, TABLE[1] + 0.954, TABLE[2] - 0.66 + 1.32 * v];
export const onEurope = (u: number, v: number): [number, number, number] => [WAR_TABLE[0] - 1.6 + 3.2 * u, 0.958, WAR_TABLE[2] - 1.1 + 2.2 * v];
export { THRONE, CAMP_Y };
