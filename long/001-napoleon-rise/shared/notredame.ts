// The Rise of Napoleon: Notre-Dame de Paris as it stood on 2 December 1804 (the coronation), for chapters 1 and 6.
// Two independent builders (place each one wherever your world wants it; they never need to see each other):
//   notreDameExterior()  the west front (two flat-topped towers, three portals, the empty gallery of kings, the rose,
//                        the open arcade), the nave and aisles behind with flying buttresses and a slate roof.
//                        No spire: the medieval spire came down in 1786 and the new one only went up in 1860.
//   notreDameInterior()  the nave dressed for the coronation: columns, pointed arcades, triforium, glowing
//                        stained-glass clerestory, aisle windows and rose windows, a red carpet, crimson banners with
//                        golden bees, benches for the guests, the raised choir with the altar, candles, the Pope's
//                        throne and the imperial throne. `spots` gives you where people go.
// Both return groups in their own local frame, ground at y = 0 (see the doc comments). Text-free (scribbles only).
import * as THREE from "three";
import { Batch, V, lam, quad, boxGeo, roofMat } from "../../../src/engine/build";
import { ctex, rep, stoneHD } from "../../../src/engine/paint";
import { NOINK } from "../../../src/engine/ink";

type V3 = [number, number, number];
const M4 = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);

// ---------------- painted textures ----------------
const STONE = "#d3c7b1", JOINT = "rgba(120,104,84,0.35)", DARK = "#3a3142", DOOR = "#4a3426";
/** pointed (Gothic) arch path in canvas units: from (x0, yb) up to the spring line ys, apex at ya (canvas y grows down) */
const arch = (g: CanvasRenderingContext2D, x0: number, x1: number, yb: number, ys: number, ya: number) => {
  const w = x1 - x0, cx = (x0 + x1) / 2, rise = ys - ya;
  g.beginPath(); g.moveTo(x0, yb); g.lineTo(x0, ys);
  g.quadraticCurveTo(x0 + w * 0.02, ys - rise * 0.75, cx, ya);
  g.quadraticCurveTo(x1 - w * 0.02, ys - rise * 0.75, x1, ys);
  g.lineTo(x1, yb); g.closePath();
};
const blocks = (g: CanvasRenderingContext2D, W: number, H: number, ph: number, pw: number, r: () => number) => {
  g.fillStyle = STONE; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,250,240" : "150,135,115"},${0.04 + r() * 0.05})`; g.fillRect(r() * W, r() * H, 6 + r() * 40, 30 + r() * 140); }
  g.strokeStyle = JOINT; g.lineWidth = 2;
  for (let y = ph, k = 0; y < H; y += ph, k++) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    for (let x = (k % 2) * pw * 0.5; x < W; x += pw) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + ph); g.stroke(); }
  }
};
/** west front, 40 m x 45 m at 40 px / m (canvas y = (45 - y) * 40) */
const FW = 1600, FH = 1800;
const fx = (x: number) => (x + 20) * 40, fy = (y: number) => (45 - y) * 40;
const facadeTex = () => ctex("ndFacade", FW, FH, (g, r) => {
  blocks(g, FW, FH, 28, 64, r);
  const ink = (w: number) => { g.strokeStyle = "rgba(40,30,40,0.85)"; g.lineWidth = w; g.stroke(); };
  // three portals: nested archivolts, tympanum, lintel, doors
  for (const [cx, hw, ys, ya] of [[0, 4.6, 7.5, 13.2], [-12.2, 3.2, 6.2, 11], [12.2, 3.2, 6.2, 11]] as const) {
    for (let k = 0; k < 4; k++) {
      const d = k * 0.55;
      arch(g, fx(cx - hw + d), fx(cx + hw - d), fy(0), fy(ys - d * 0.2), fy(ya - d * 1.1));
      g.fillStyle = ["#c2b59d", "#b5a88f", "#a99b82", "#9d8f77"][k]; g.fill(); ink(3);
      // little statues in the archivolts: beads
      if (k < 3) for (let j = 0; j < 9; j++) {
        const t = j / 8, a = Math.PI * (0.05 + 0.9 * t), rx = (hw - d - 0.27) * 40, ry = (ya - ys - d * 0.9) * 40;
        g.fillStyle = "#e1d6c1"; g.beginPath(); g.ellipse(fx(cx) - Math.cos(a) * rx, fy(ys) - Math.sin(a) * ry, 7, 11, 0, 0, 7); g.fill();
      }
    }
    // tympanum with three scribbled registers of figures, lintel, doors
    const ix0 = fx(cx - hw + 2.2), ix1 = fx(cx + hw - 2.2);
    g.fillStyle = "#cdbfa5"; g.fillRect(ix0, fy(ys - 0.4), ix1 - ix0, fy(4.6) - fy(ys - 0.4));
    for (let row = 0; row < 2; row++) for (let x = ix0 + 14; x < ix1 - 10; x += 22) {
      g.fillStyle = "#b9aa8e"; g.beginPath(); g.ellipse(x, fy(5.3 + row * 1.0), 7, 15, 0, 0, 7); g.fill();
      g.beginPath(); g.arc(x, fy(5.3 + row * 1.0) - 20, 6, 0, 7); g.fill();
    }
    g.fillStyle = "#b8aa90"; g.fillRect(ix0, fy(4.6), ix1 - ix0, 22);
    g.fillStyle = DOOR; g.fillRect(ix0, fy(4.05), ix1 - ix0, fy(0) - fy(4.05));
    g.strokeStyle = "#2a1d16"; g.lineWidth = 4;
    for (let x = ix0; x < ix1; x += 26) { g.beginPath(); g.moveTo(x, fy(4.05)); g.lineTo(x, fy(0)); g.stroke(); }
    g.strokeStyle = "#1c1a20"; g.lineWidth = 6;
    for (const y of [1, 2.2, 3.4]) { g.beginPath(); g.moveTo(ix0 + 6, fy(y)); g.bezierCurveTo(ix0 + 50, fy(y) - 18, ix1 - 50, fy(y) + 18, ix1 - 6, fy(y)); g.stroke(); }
    g.fillStyle = "#b7a98f"; g.fillRect(fx(cx) - 14, fy(4.05), 28, fy(0) - fy(4.05)); // trumeau
  }
  // gallery of kings (14-17.6 m): 28 niches, EMPTY in 1804 (the statues were pulled down in 1793)
  for (let k = 0; k < 28; k++) {
    const x0 = fx(-19.6 + k * 1.4), x1 = x0 + 44;
    arch(g, x0, x1, fy(14.2), fy(16.6), fy(17.4)); g.fillStyle = "#8d826f"; g.fill(); ink(2.5);
  }
  g.fillStyle = "#bfb39b"; g.fillRect(0, fy(14.2), FW, 10);
  // rose window (centre 0, 26 m, r 6.2 m) between the towers, twin lancets on the tower fronts
  const rx = fx(0), ry = fy(26), R = 6.2 * 40;
  g.fillStyle = "#c0b399"; g.beginPath(); g.arc(rx, ry, R + 26, 0, 7); g.fill(); ink(4);
  g.fillStyle = "#2c3b72"; g.beginPath(); g.arc(rx, ry, R, 0, 7); g.fill();
  for (let i = 0; i < 90; i++) { const a = r() * 7, d = r() * R; g.fillStyle = ["#a8323e", "#d9a43a", "#3d5fae", "#5a3a7a"][i % 4]; g.fillRect(rx + Math.cos(a) * d - 6, ry + Math.sin(a) * d - 6, 12, 12); }
  g.strokeStyle = "#d9cdb6"; g.lineWidth = 7;
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.beginPath(); g.moveTo(rx + Math.cos(a) * R * 0.22, ry + Math.sin(a) * R * 0.22); g.lineTo(rx + Math.cos(a) * R, ry + Math.sin(a) * R); g.stroke(); }
  for (const k of [0.22, 0.55, 0.98]) { g.beginPath(); g.arc(rx, ry, R * k, 0, 7); g.stroke(); }
  for (const cx of [-13.2, 13.2]) {
    arch(g, fx(cx - 3.4), fx(cx + 3.4), fy(20.5), fy(27.5), fy(31.2)); g.fillStyle = "#b3a68c"; g.fill(); ink(3);
    for (const dx of [-1.6, 1.6]) { arch(g, fx(cx + dx - 1.15), fx(cx + dx + 1.15), fy(21), fy(27), fy(29.2)); g.fillStyle = DARK; g.fill(); ink(3); }
    g.fillStyle = DARK; g.beginPath(); g.arc(fx(cx), fy(29.6), 26, 0, 7); g.fill(); ink(3);
  }
  // string courses
  g.fillStyle = "#e3d8c3"; for (const y of [18.4, 33.1]) g.fillRect(0, fy(y), FW, 18);
  // the open arcade (34 - 43.5 m): tall thin lancets, colonnettes, balustrade on top
  for (let x = -19.5; x < 19.4; x += 1.5) { arch(g, fx(x + 0.18), fx(x + 1.32), fy(34.2), fy(41.6), fy(43.2)); g.fillStyle = "#463d50"; g.fill(); ink(2.5); }
  g.fillStyle = "#c9bda6"; g.fillRect(0, fy(45), FW, fy(43.9) - fy(45));
  for (let x = 6; x < FW; x += 26) { g.fillStyle = "#9e917a"; g.beginPath(); g.arc(x, fy(44.45), 8, 0, 7); g.fill(); }
});
/** tower fronts and sides above the arcade: 13.5 m x 24 m, two tall louvred lancets */
const towerTex = () => ctex("ndTower", 540, 960, (g, r) => {
  blocks(g, 540, 960, 28, 64, r);
  const ink = () => { g.strokeStyle = "rgba(40,30,40,0.85)"; g.lineWidth = 3; g.stroke(); };
  for (const cx of [150, 390]) {
    arch(g, cx - 82, cx + 82, 900, 230, 110); g.fillStyle = "#b3a68c"; g.fill(); ink();
    arch(g, cx - 58, cx + 58, 880, 240, 150); g.fillStyle = "#2f2a38"; g.fill(); ink();
    g.strokeStyle = "#6e6476"; g.lineWidth = 5; for (let y = 280; y < 870; y += 34) { g.beginPath(); g.moveTo(cx - 54, y); g.lineTo(cx + 54, y + 8); g.stroke(); }
  }
  g.fillStyle = "#e3d8c3"; g.fillRect(0, 0, 540, 40); g.fillRect(0, 930, 540, 30);
  for (let x = 10; x < 540; x += 30) { g.fillStyle = "#9e917a"; g.fillRect(x, 8, 14, 26); }
});
/** clerestory / nave wall seen from outside: 8 m bays with one pointed window */
const naveWallTex = () => ctex("ndNaveOut", 320, 1320, (g, r) => {
  blocks(g, 320, 1320, 28, 64, r);
  arch(g, 90, 230, 1180, 560, 430); g.fillStyle = "#3b4466"; g.fill(); g.strokeStyle = "rgba(40,30,40,0.85)"; g.lineWidth = 3; g.stroke();
  arch(g, 110, 210, 640, 360, 290); g.fillStyle = "#3b4466"; g.fill(); g.stroke();
});

// ---------------- exterior ----------------
/** Notre-Dame from outside. Local frame: origin on the ground at the centre of the west front, the front faces +z, the
 *  church runs toward -z (towers 69 m, front 40 m wide, nave + aisles 34 m wide, 110 m long). Ground not included:
 *  lay your parvis from z = 0 toward +z. Casts shadows; everything inked. */
export const notreDameExterior = () => {
  const g = new THREE.Group(), b = new Batch();
  const stone = lam("ndStoneOut", () => ({ map: rep(stoneHD("ndStoneHD", ["#d6cab4", "#cdc0a8", "#dcd1bc", "#c6b9a0"], "#a3967f"), 1, 1) }));
  const ledge = lam("ndLedge", () => ({ color: "#e5dac6" }));
  // body of the front (its face is the painted quad 5 cm in front)
  b.add(boxGeo(V(-20, 0, -12), V(20, 45, -0.05), 4), stone);
  b.add(quad(V(-20, 0, 0), V(20, 0, 0), V(20, 45, 0), V(-20, 45, 0)), lam("ndFacadeM", () => ({ map: facadeTex() })));
  // towers
  const tw = lam("ndTowerM", () => ({ map: towerTex() }));
  for (const [x0, x1] of [[-20, -6.5], [6.5, 20]]) {
    b.add(boxGeo(V(x0, 45, -12.5), V(x1, 69, -0.05), 4), stone);
    b.add(quad(V(x0, 45, 0), V(x1, 45, 0), V(x1, 69, 0), V(x0, 69, 0)), tw);
    const xs = x0 < 0 ? x0 : x1, s = x0 < 0 ? -1 : 1;
    b.add(s < 0 ? quad(V(xs - 0.05, 45, -12.5), V(xs - 0.05, 45, 0), V(xs - 0.05, 69, 0), V(xs - 0.05, 69, -12.5), 1, 1) : quad(V(xs + 0.05, 45, 0), V(xs + 0.05, 45, -12.5), V(xs + 0.05, 69, -12.5), V(xs + 0.05, 69, 0)), tw);
    b.add(boxGeo(V(x0 - 0.3, 69, -12.8), V(x1 + 0.3, 69.9, 0.3), 2), ledge); // flat roof edge
  }
  // gable wall between the towers (set back) and the cornices / ledges across the front
  b.add(boxGeo(V(-6.5, 45, -4), V(6.5, 48, -2.5), 4), stone);
  for (const [y0, y1, d] of [[17.7, 18.5, 0.6], [32.6, 33.3, 0.6], [44.9, 45.6, 0.8]] as const) b.add(boxGeo(V(-20.4, y0, -0.1), V(20.4, y1, d), 2), ledge);
  // buttresses: stepped, wider at the bottom
  for (const x of [-19.2, -7.3, 7.3, 19.2]) {
    b.add(boxGeo(V(x - 1.1, 0, -0.1), V(x + 1.1, 14, 1.8), 4), stone);
    b.add(boxGeo(V(x - 0.95, 14, -0.1), V(x + 0.95, 33, 1.2), 4), stone);
    b.add(boxGeo(V(x - 0.8, 33, -0.1), V(x + 0.8, 45, 0.7), 4), stone);
    b.add(boxGeo(V(x - 0.85, 69, -12.6), V(x + 0.85, 70.6, -11.0), 2), ledge);
  }
  // nave (clerestory walls painted with windows), aisles, slate roofs, flying buttresses
  const nw = lam("ndNaveOutM", () => ({ map: naveWallTex() }));
  const roof = roofMat("#8f97a8");
  b.add(boxGeo(V(-7, 20, -110), V(7, 33, -12.4), 4), stone);
  for (const s of [-1, 1]) {
    const x = s * 7.02;
    for (let z = -12.5; z > -110; z -= 8) {
      const z1 = Math.max(-110, z - 8);
      b.add(s < 0 ? quad(V(x, 20, z1), V(x, 20, z), V(x, 33, z), V(x, 33, z1)) : quad(V(x, 20, z), V(x, 20, z1), V(x, 33, z1), V(x, 33, z)), nw);
    }
    b.add(boxGeo(V(s < 0 ? -17 : 7, 0, -110), V(s < 0 ? -7 : 17, 20, -12.4), 4), stone);
    // aisle lean-to roof
    const a = V(s * 17.4, 19.8, -12.4), c = V(s * 7, 24.5, -12.4), d = V(s * 7, 24.5, -110), e = V(s * 17.4, 19.8, -110);
    b.add(s < 0 ? quad(e, a, c, d, 24, 3) : quad(a, e, d, c, 24, 3), roof);
    for (let z = -22; z > -105; z -= 10) {
      b.add(boxGeo(V(s * 17 - 1, 0, z - 0.9), V(s * 17 + 1, 27, z + 0.9), 4), stone);
      const pin = new THREE.ConeGeometry(0.95, 4, 4); pin.rotateY(Math.PI / 4);
      b.add(pin, stone, M4(s * 17, 29, z));
      const fl = new THREE.BoxGeometry(0.7, 10.6, 0.9); fl.rotateZ(s * 1.18); // flyer from the pier top to the nave wall
      b.add(fl, stone, M4(s * 12.1, 28.6, z));
    }
  }
  // nave roof: steep slate prism (ridge 44 m) with its gable against the towers
  for (const s of [-1, 1]) {
    const a = V(s * 7.6, 32.6, -3), c = V(0, 44, -3), d = V(0, 44, -110), e = V(s * 7.6, 32.6, -110);
    b.add(s < 0 ? quad(e, a, c, d, 28, 4) : quad(a, e, d, c, 28, 4), roof);
  }
  b.build(g);
  return g;
};

// ---------------- interior textures ----------------
/** one 6 m bay of the nave elevation from 9 m (arcade spring) to 28 m (vault spring), arch opening cut out (alpha) */
const bayTex = () => ctex("ndBay", 384, 1216, (g, r) => {
  const W = 384, H = 1216, py = (y: number) => (28 - y) * 64; // 64 px / m
  g.fillStyle = "#cfc2aa"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,248,235" : "140,125,105"},0.05)`; g.fillRect(r() * W, r() * H, 10 + r() * 30, 40 + r() * 120); }
  g.strokeStyle = "rgba(120,104,84,0.3)"; g.lineWidth = 2;
  for (let y = 0; y < H; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // clerestory window frame (the glass is its own glowing quad), triforium openings, string courses
  arch(g, 96, 288, py(19), py(25.5), py(27.4)); g.fillStyle = "#4a4258"; g.fill(); g.strokeStyle = "rgba(40,30,40,0.8)"; g.lineWidth = 4; g.stroke();
  g.fillStyle = "#e6dbc6"; g.fillRect(0, py(18.6), W, 16); g.fillRect(0, py(13.9), W, 16);
  for (let k = 0; k < 4; k++) { arch(g, 40 + k * 80, 100 + k * 80, py(14.4), py(17), py(17.9)); g.fillStyle = "#3e3648"; g.fill(); g.stroke(); }
  // colonnette shafts between bays
  g.fillStyle = "#e1d5bf"; g.fillRect(0, 0, 14, H); g.fillRect(W - 14, 0, 14, H);
  // the arcade opening: cut out (transparent), with a moulded rim
  arch(g, 52, 332, H + 4, py(10.2), py(13.4));
  g.strokeStyle = "#a99b82"; g.lineWidth = 26; g.stroke();
  g.globalCompositeOperation = "destination-out"; g.fill(); g.globalCompositeOperation = "source-over";
});
/** a pointed lancet of stained glass (alpha outside), 1 x 3 aspect */
const glassTex = (key: string, seed: number) => ctex("ndGlass" + key, 192, 576, (g, r) => {
  for (let i = 0; i < seed; i++) r();
  g.save(); arch(g, 4, 188, 572, 120, 4); g.clip();
  const pal = ["#2f4ea8", "#24387e", "#b0283a", "#d9a43a", "#3c8a5a", "#6a3c8c", "#3a5fc0"];
  for (let y = 0; y < 576; y += 24) for (let x = 0; x < 192; x += 24) { g.fillStyle = pal[Math.floor(r() * (y < 200 ? 4 : 7)) % 7]; g.fillRect(x, y, 24, 24); }
  // medallions
  for (const cy of [190, 330, 470]) { g.fillStyle = r() < 0.5 ? "#b0283a" : "#d9a43a"; g.beginPath(); g.arc(96, cy, 46, 0, 7); g.fill(); g.fillStyle = "#2f4ea8"; g.beginPath(); g.arc(96, cy, 26, 0, 7); g.fill(); }
  g.strokeStyle = "#1d1822"; g.lineWidth = 5;
  for (let y = 24; y < 576; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(192, y); g.stroke(); }
  for (let x = 24; x < 192; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 576); g.stroke(); }
  g.restore();
  arch(g, 4, 188, 572, 120, 4); g.strokeStyle = "#1d1822"; g.lineWidth = 9; g.stroke();
});
const roseTex = () => ctex("ndRoseIn", 512, 512, (g, r) => {
  g.save(); g.beginPath(); g.arc(256, 256, 250, 0, 7); g.clip();
  g.fillStyle = "#2b3f8f"; g.fillRect(0, 0, 512, 512);
  for (let ring = 0; ring < 5; ring++) for (let i = 0; i < 24; i++) {
    const a = ((i + ring * 0.5) / 24) * Math.PI * 2, d = 40 + ring * 46;
    g.fillStyle = ["#b0283a", "#d9a43a", "#3a5fc0", "#6a3c8c", "#3c8a5a"][(i + ring) % 5];
    g.beginPath(); g.arc(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, 13 + ring * 2, 0, 7); g.fill();
  }
  g.strokeStyle = "#1d1822"; g.lineWidth = 6;
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.beginPath(); g.moveTo(256 + Math.cos(a) * 30, 256 + Math.sin(a) * 30); g.lineTo(256 + Math.cos(a) * 250, 256 + Math.sin(a) * 250); g.stroke(); }
  for (const k of [30, 110, 190, 248]) { g.beginPath(); g.arc(256, 256, k, 0, 7); g.stroke(); }
  g.fillStyle = "#d9a43a"; g.beginPath(); g.arc(256, 256, 26, 0, 7); g.fill();
  g.restore();
});
/** crimson velvet banner with golden bees and a gold fringe, swallow-tailed (alpha) */
const bannerTex = () => ctex("ndBanner", 256, 512, (g, r) => {
  g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 0); g.lineTo(256, 470); g.lineTo(128, 410); g.lineTo(0, 470); g.closePath();
  g.fillStyle = "#9c1f33"; g.fill(); g.save(); g.clip();
  g.fillStyle = "rgba(0,0,0,0.12)"; for (let x = 20; x < 256; x += 46) g.fillRect(x, 0, 14, 512);
  for (let y = 70; y < 400; y += 80) for (let x = 48 + ((y / 80) % 2) * 40; x < 230; x += 80) bee(g, x, y);
  g.restore();
  g.strokeStyle = "#e8b53e"; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 470); g.lineTo(128, 410); g.lineTo(256, 470); g.stroke();
  g.fillStyle = "#e8b53e"; g.fillRect(0, 0, 256, 24);
});
const bee = (g: CanvasRenderingContext2D, x: number, y: number) => {
  g.fillStyle = "#e8b53e";
  g.beginPath(); g.ellipse(x, y + 6, 8, 14, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(x, y - 12, 6, 0, 7); g.fill();
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * 13, y - 4, 11, 6, s * 0.5, 0, 7); g.fill(); }
};
const floorTex = () => ctex("ndFloor", 512, 512, (g, r) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    g.fillStyle = (x + y) % 2 ? "#b9ad99" : "#e6dbc7"; g.fillRect(x * 128, y * 128, 128, 128);
    g.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "90,80,70"},0.06)`; g.fillRect(x * 128 + r() * 60, y * 128 + r() * 60, 40, 40);
  }
  g.strokeStyle = "rgba(90,78,64,0.5)"; g.lineWidth = 3; for (let k = 0; k <= 512; k += 128) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); }
});
const carpetTex = () => ctex("ndCarpet", 256, 256, (g) => {
  g.fillStyle = "#a3203a"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#e8b53e"; g.fillRect(0, 0, 18, 256); g.fillRect(238, 0, 18, 256);
  bee(g, 128, 128);
});
const goldClothTex = () => ctex("ndAltarCloth", 256, 128, (g) => {
  g.fillStyle = "#f2ead8"; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#e0b44a"; g.fillRect(0, 0, 256, 22); g.fillRect(0, 112, 256, 16);
  g.fillStyle = "#c69a34"; g.fillRect(118, 40, 20, 62); g.fillRect(100, 58, 56, 18);
});
/** soft vertical light shaft, transparent at the edges and fading toward the floor */
const shaftTex = () => ctex("ndShaft", 64, 256, (g) => {
  const im = g.createImageData(64, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 64; x++) {
    const u = Math.abs(x - 31.5) / 32, a = (1 - u * u) * (1 - y / 256) ** 0.6 * (0.35 + 0.65 * Math.min(1, y / 20));
    const i = (y * 64 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.max(0, a));
  }
  g.putImageData(im, 0, 0);
});

// ---------------- interior ----------------
/** where people go inside (local frame of notreDameInterior; y = floor or platform height) */
export const ND_SPOTS = {
  /** the choir platform height (three steps from z = -38 to -39.2) */
  platformY: 0.9,
  /** Napoleon in front of the altar, facing the nave (+z) */
  napoleon: [0, 0.9, -45.2] as V3,
  /** the altar table (front face at z = -48) */
  altar: [0, 0.9, -48.8] as V3,
  /** the Pope's throne (left of the altar seen from the nave), seat top 0.55 m over the platform */
  popeThrone: [-5.4, 0.9, -46.6] as V3,
  /** the imperial throne (right of the altar) */
  imperialThrone: [5.4, 0.9, -46.6] as V3,
  /** Josephine, kneeling / standing beside Napoleon */
  josephine: [2.6, 0.9, -44.2] as V3,
  /** nave guests: rows on both sides of the carpet (x, z), floor y = 0, 3 per side per row, rows z = -10 .. -34 */
  guests: (() => {
    const out: [number, number][] = [];
    for (let row = 0; row < 9; row++) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) out.push([s * (2.9 + k * 1.15) + (row % 2 ? 0.3 : 0), -10 - row * 3]);
    return out;
  })(),
  /** honour guard along the carpet (x, z) */
  guards: (() => { const out: [number, number][] = []; for (let z = -6; z > -37; z -= 6) for (const s of [-1, 1]) out.push([s * 1.8, z]); return out; })(),
  /** the columns (x, z): radius 0.7 m, 9 m tall */
  columns: (() => { const out: [number, number][] = []; for (let z = -4; z >= -46; z -= 6) for (const s of [-1, 1]) out.push([s * 7, z]); return out; })(),
};

/** Notre-Dame inside, dressed for the coronation. Local frame: origin on the floor at the west door, nave centre line
 *  along -z, west wall (rose window) at z = +1, east (apse) wall with three lancets at z = -56; nave x -7..7 (vault apex
 *  34 m), aisles to x = +-13. The shell does not cast shadows (so the directional sun still lights the floor);
 *  windows glow (unlit, slightly over 1 so the bloom catches them); light shafts sit on the NOINK layer.
 *  Returns { group, spots } (spots = ND_SPOTS). */
export const notreDameInterior = () => {
  const g = new THREE.Group(), shell = new Batch(), solid = new Batch();
  const stone = lam("ndStoneIn", () => ({ map: rep(stoneHD("ndStoneInHD", ["#d2c6af", "#c8bba2", "#d9cdb7", "#c0b399"], "#9d907a"), 1, 1) }));
  const vault = lam("ndVault", () => ({ color: "#d9cfbd", side: THREE.DoubleSide }));
  const floor = lam("ndFloorM", () => ({ map: rep(floorTex(), 1, 1) }));
  const wood = lam("ndWood", () => ({ color: "#7a4e30" }));
  const gold = lam("ndGold", () => ({ color: "#e0b040" }));
  const crimson = lam("ndCrimson", () => ({ color: "#9c1f33" }));
  // floor (world-scale UVs: 4 m per texture = 1 m tiles), carpet 2 cm above it only where the floor is not (abutting strips)
  const fl = (x0: number, x1: number, z0: number, z1: number, m: THREE.Material, y = 0, tile = 4) =>
    shell.add(quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile), m);
  fl(-13, -1.6, -56, 1, floor); fl(1.6, 13, -56, 1, floor);
  fl(-1.6, 1.6, -38, 1, lam("ndCarpetM", () => ({ map: rep(carpetTex(), 1, 1) })), 0, 3.2);
  fl(-1.6, 1.6, -56, -38, floor);
  // choir platform: three steps (each a little narrower so their side faces never coincide)
  for (const [k, z0, w] of [[1, -38, 7], [2, -38.6, 6.9], [3, -39.2, 6.8]] as const) solid.add(boxGeo(V(-w, 0, -56), V(w, 0.3 * k, z0), 2), stone);
  shell.add(quad(V(-1.6, 0.92, -39.2), V(1.6, 0.92, -39.2), V(1.6, 0.92, -46.5), V(-1.6, 0.92, -46.5), 1, 2.3), lam("ndCarpetM", () => ({ map: carpetTex() })));
  // columns with bases and capitals
  for (const [x, z] of ND_SPOTS.columns) {
    solid.add(new THREE.CylinderGeometry(0.7, 0.7, 9, 20), stone, M4(x, 4.5, z));
    solid.add(boxGeo(V(x - 0.95, 0, z - 0.95), V(x + 0.95, 0.55, z + 0.95), 2), stone);
    solid.add(new THREE.CylinderGeometry(1.05, 0.72, 0.8, 20), stone, M4(x, 8.6, z));
  }
  // arcade walls (x = +-7) from 9 to 28 m: 7 bays between the columns (z -4 .. -46) + solid ends
  const bayM = lam("ndBayM", () => ({ map: bayTex(), alphaTest: 0.5, side: THREE.DoubleSide }));
  for (const s of [-1, 1]) {
    const x = s * 7;
    for (let k = 0; k < 7; k++) {
      const za = -4 - k * 6, zb = za - 6;
      shell.add(s < 0 ? quad(V(x, 9, za), V(x, 9, zb), V(x, 28, zb), V(x, 28, za)) : quad(V(x, 9, zb), V(x, 9, za), V(x, 28, za), V(x, 28, zb)), bayM);
    }
    for (const [za, zb] of [[1, -4], [-46, -56]]) shell.add(s < 0 ? quad(V(x, 9, za), V(x, 9, zb), V(x, 28, zb), V(x, 28, za)) : quad(V(x, 9, zb), V(x, 9, za), V(x, 28, za), V(x, 28, zb)), stone);
    for (const [za, zb] of [[1, -3.3], [-46.7, -56]]) shell.add(s < 0 ? quad(V(x, 0, za), V(x, 0, zb), V(x, 9, zb), V(x, 9, za)) : quad(V(x, 0, zb), V(x, 0, za), V(x, 9, za), V(x, 9, zb)), stone);
    // aisle outer wall, aisle ceiling
    const xo = s * 13;
    shell.add(s > 0 ? quad(V(xo, 0, -56), V(xo, 0, 1), V(xo, 13, 1), V(xo, 13, -56), 14, 3) : quad(V(xo, 0, 1), V(xo, 0, -56), V(xo, 13, -56), V(xo, 13, 1), 14, 3), stone);
    shell.add(quad(V(s < 0 ? -13 : 7, 13, 1), V(s < 0 ? -7 : 13, 13, 1), V(s < 0 ? -7 : 13, 13, -56), V(s < 0 ? -13 : 7, 13, -56)), vault);
    // vault: one slope per side from the spring (28 m) to the ridge (34 m)
    shell.add(s < 0 ? quad(V(-7, 28, -56), V(-7, 28, 1), V(0, 34, 1), V(0, 34, -56), 1, 1) : quad(V(7, 28, 1), V(7, 28, -56), V(0, 34, -56), V(0, 34, 1), 1, 1), vault);
  }
  // transverse ribs over every column pair (inked), the vault's ridge rib
  for (let z = -4; z >= -46; z -= 6) for (const s of [-1, 1]) {
    const rib = new THREE.BoxGeometry(0.45, 9.2, 0.5); rib.rotateZ(s * 0.86);
    solid.add(rib, stone, M4(s * 3.5, 31, z));
  }
  solid.add(boxGeo(V(-0.25, 33.6, -56), V(0.25, 34.1, 1)), stone);
  // west and east walls
  shell.add(quad(V(13, 0, 1), V(-13, 0, 1), V(-13, 34, 1), V(13, 34, 1), 6, 8), stone);
  shell.add(quad(V(-13, 0, -56), V(13, 0, -56), V(13, 34, -56), V(-13, 34, -56), 6, 8), stone);
  shell.add(quad(V(1.6, 0, 0.98), V(-1.6, 0, 0.98), V(-1.6, 5, 0.98), V(1.6, 5, 0.98)), lam("ndDoorIn", () => ({ color: "#4a3426" })));
  // banners on the nave face of every column, a gold rail along the arcade
  const ban = lam("ndBannerM", () => ({ map: bannerTex(), alphaTest: 0.5, side: THREE.DoubleSide }));
  for (const [x, z] of ND_SPOTS.columns) {
    const xf = x - Math.sign(x) * 0.74;
    shell.add(quad(V(xf, 3.6, z + 0.6 * Math.sign(x)), V(xf, 3.6, z - 0.6 * Math.sign(x)), V(xf, 8.2, z - 0.6 * Math.sign(x)), V(xf, 8.2, z + 0.6 * Math.sign(x))), ban);
  }
  // benches for the guests
  for (let row = 0; row < 9; row++) for (const s of [-1, 1]) {
    const z = -10.6 - row * 3;
    solid.add(boxGeo(V(s < 0 ? -6.4 : 2.3, 0.4, z - 0.45), V(s < 0 ? -2.3 : 6.4, 0.5, z + 0.05)), wood);
    for (const x of [s * 2.5, s * 6.2]) solid.add(boxGeo(V(x - 0.06, 0, z - 0.4), V(x + 0.06, 0.4, z)), wood);
  }
  // altar: table with a gold-trimmed cloth, gold cross, six candles
  const P = ND_SPOTS.platformY;
  solid.add(boxGeo(V(-2.2, P, -49.6), V(2.2, P + 1.1, -48.1)), lam("ndAltarStone", () => ({ color: "#e8e0cf" })));
  shell.add(quad(V(-2.15, P + 0.1, -48.05), V(2.15, P + 0.1, -48.05), V(2.15, P + 1.05, -48.05), V(-2.15, P + 1.05, -48.05)), lam("ndAltarClothM", () => ({ map: goldClothTex() })));
  solid.add(boxGeo(V(-0.09, P + 1.1, -49.0), V(0.09, P + 2.9, -48.8)), gold);
  solid.add(boxGeo(V(-0.5, P + 2.25, -49.0), V(0.5, P + 2.43, -48.8)), gold);
  const flames: [number, number, number][] = [];
  for (const x of [-1.8, -1.2, -0.6, 0.6, 1.2, 1.8]) {
    const h = 0.75 - Math.abs(x) * 0.12;
    solid.add(new THREE.CylinderGeometry(0.06, 0.1, 0.25, 10), gold, M4(x, P + 1.22, -48.9));
    solid.add(new THREE.CylinderGeometry(0.04, 0.04, h, 8), lam("ndCandle", () => ({ color: "#f6f0e2" })), M4(x, P + 1.35 + h / 2, -48.9));
    flames.push([x, P + 1.35 + h + 0.06, -48.9]);
  }
  // thrones: the Pope's (crimson and white) and the imperial one (gold and crimson, round back, canopy)
  for (const [[x, , z], imp] of [[ND_SPOTS.popeThrone, false], [ND_SPOTS.imperialThrone, true]] as const) {
    const frame = imp ? gold : lam("ndWhiteGold", () => ({ color: "#f1e9d6" }));
    solid.add(boxGeo(V(x - 0.9, P, z - 0.6), V(x + 0.9, P + 0.25, z + 0.9)), crimson);              // footstool dais
    solid.add(boxGeo(V(x - 0.6, P + 0.25, z - 0.45), V(x + 0.6, P + 0.55, z + 0.35)), frame);       // seat
    solid.add(boxGeo(V(x - 0.62, P + 0.25, z - 0.6), V(x + 0.62, P + 2.3, z - 0.45)), frame);       // back
    solid.add(boxGeo(V(x - 0.48, P + 0.6, z - 0.47), V(x + 0.48, P + 2.1, z - 0.42)), crimson);     // back cushion
    for (const sx of [-1, 1]) solid.add(boxGeo(V(x + sx * 0.6 - 0.07, P + 0.55, z - 0.45), V(x + sx * 0.6 + 0.07, P + 0.95, z + 0.3)), frame); // arms
    if (imp) solid.add(new THREE.CylinderGeometry(0.62, 0.62, 0.15, 24, 1, false, -Math.PI / 2, Math.PI), gold, new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(x, P + 2.3, z - 0.52));
    // canopy: four posts and a crimson roof with a gold edge
    for (const [px, pz] of [[-1, -0.7], [1, -0.7], [-1, 0.9], [1, 0.9]]) solid.add(boxGeo(V(x + px * 1.05 - 0.06, P + 0.25, z + pz - 0.06), V(x + px * 1.05 + 0.06, P + 3.4, z + pz + 0.06)), gold);
    solid.add(boxGeo(V(x - 1.25, P + 3.4, z - 0.9), V(x + 1.25, P + 3.75, z + 1.1)), crimson);
    solid.add(boxGeo(V(x - 1.3, P + 3.3, z - 0.95), V(x + 1.3, P + 3.42, z + 1.15)), gold);
  }
  shell.build(g, false);
  solid.build(g, true);
  // glowing glass: clerestory lancets in every bay, aisle windows, the two roses, three apse lancets
  const glowMat = (key: string, tex: THREE.Texture, k = 1.25) => {
    const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(k, k, k), fog: false });
    m.name = key; return m;
  };
  const glass = [0, 1, 2].map((i) => glowMat("g" + i, glassTex(String(i), i * 7)));
  const pane = (m: THREE.Material, x: number, y0: number, z: number, w: number, h: number, ry: number) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y0 + h / 2, z); p.rotation.y = ry; g.add(p);
  };
  for (let k = 0; k < 7; k++) for (const s of [-1, 1]) {
    const zc = -7 - k * 6;
    pane(glass[(k + (s > 0 ? 1 : 0)) % 3], s * 6.96, 19.1, zc, 2.9, 8.3, -s * Math.PI / 2);
    pane(glass[(k + 2) % 3], s * 12.96, 3.2, zc, 2.0, 6.0, -s * Math.PI / 2);
  }
  for (const x of [-3.2, 0, 3.2]) pane(glass[(x + 3.2) / 3.2], x, 11, -55.96, 2.4, 13.5, 0);
  const rose = glowMat("rose", roseTex(), 1.3);
  const r1 = new THREE.Mesh(new THREE.CircleGeometry(5.2, 48), rose); r1.position.set(0, 21, 0.96); r1.rotation.y = Math.PI; g.add(r1);
  const r2 = new THREE.Mesh(new THREE.CircleGeometry(3.4, 48), rose); r2.position.set(0, 28.2, -55.96); g.add(r2);
  // candle flames (bright, bloom) and light shafts from the clerestory (additive, no ink)
  const flameM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 0.9), fog: false });
  for (const [x, y, z] of flames) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), flameM); f.scale.set(1, 1.8, 1); f.position.set(x, y, z); f.layers.set(NOINK); g.add(f); }
  const shaftT = shaftTex();
  const tints = ["#ffe2a8", "#bcd0ff", "#ffc0c8"];
  for (let k = 0; k < 6; k++) {
    const m = new THREE.MeshBasicMaterial({ map: shaftT, color: tints[k % 3], transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 30), m);
    const s = k % 2 ? 1 : -1, zc = -10 - k * 6.5;
    // from the window at (s*7, 23) down toward the far side of the nave floor
    sh.position.set(s * 2.2, 12.5, zc); sh.rotation.set(0, 0, s * -0.42); sh.rotation.y = 0.0;
    sh.layers.set(NOINK); sh.renderOrder = 4; g.add(sh);
  }
  return { group: g, spots: ND_SPOTS };
};
