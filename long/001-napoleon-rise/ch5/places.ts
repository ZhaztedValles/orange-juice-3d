// Chapter 5 scenery, one builder per place: the flagship deck and the fleet at sea, Aboukir Bay (anchored French
// line, beach, British ships, the wrecks next morning, the escape at night), Egypt (sand dunes, the Nile with palms,
// the pyramids, the battlefield ridge, the Rosetta dig and Fort Julien, Napoleon's camp, the walls of Acre) and France
// (a Paris street, the plotters' room, the Orangerie of Saint-Cloud). Every place is a THREE.Group the world shows only
// in its own shots; moving parts (ships, flags) are returned so world.ts can animate them.
import * as THREE from "three";
import { Batch, V, lam, quad, tri, boxGeo, prop, house, setSightLines, Kit, Ray } from "../../../src/engine/build";
import { ctex, rep, rng, stoneHD, planksHD, beam } from "../../../src/engine/paint";
import { cannon, warship, flagTex } from "../shared/props";
import { FL, SHORE_Z, BEACH, VANGUARD, sandY, DIG, STONE2, CAMP, ACRE, ROOM, HALL, TRIB, MAP_T, SCOPE, EASEL } from "./story";

export type Bobber = { o: THREE.Object3D; x: number; y: number; z: number; yaw: number; ph: number; amp: number; vx?: number; vz?: number };
export type Waver = { m: THREE.Mesh; w: number; ph: number };

// ---------------- materials + textures ----------------
const M = {
  planks: () => lam("c5planks", () => ({ map: rep(planksHD(), 1, 1) })),
  wood: () => lam("c5wood", () => ({ map: beam() })),
  darkWood: () => lam("c5darkwood", () => ({ color: "#6b4a2e" })),
  rail: () => lam("c5rail", () => ({ color: "#8a5a36" })),
  sand: () => lam("c5sand", () => ({ map: rep(sandTex(), 1, 1) })),
  sandStone: () => lam("c5sandstone", () => ({ map: stoneHD("c5sandstoneHD", ["#e2c48e", "#d8b880", "#e8cc98", "#d2b07a"], "#b8955f") })),
  pyramid: () => lam("c5pyr", () => ({ map: rep(pyrTex(), 1, 1) })),
  whiteWall: () => lam("c5whitewall", () => ({ color: "#efe3c8" })),
  ochreWall: () => lam("c5ochrewall", () => ({ color: "#e0bd85" })),
  palmTrunk: () => lam("c5palmtrunk", () => ({ map: rep(trunkTex(), 1, 1) })),
  palmLeaf: () => lam("c5palmleaf", () => ({ color: "#5a9e42", side: THREE.DoubleSide })),
  palmLeaf2: () => lam("c5palmleaf2", () => ({ color: "#6fb04c", side: THREE.DoubleSide })),
  dirt: () => lam("c5dirt", () => ({ color: "#b48a5a" })),
  tent: () => lam("c5tent", () => ({ map: tentTex(), side: THREE.DoubleSide })),
  tentDark: () => lam("c5tentdark", () => ({ color: "#4a3a3a", side: THREE.DoubleSide })),
  stone: () => lam("c5rosetta", () => ({ map: rosettaTex() })),
  stoneSide: () => lam("c5rosettaside", () => ({ color: "#3b3a44" })),
  cobble: () => lam("c5cobble", () => ({ map: rep(cobbleTex(), 1, 1) })),
  hallWall: () => lam("c5hallwall", () => ({ map: hallWallTex() })),
  hallFloor: () => lam("c5hallfloor", () => ({ map: rep(tileTex(), 1, 1) })),
  bench: () => lam("c5bench", () => ({ color: "#7a4a32" })),
  green: () => lam("c5baize", () => ({ color: "#2f6a4a" })),
  red: () => lam("c5red", () => ({ color: "#a8303a" })),
  panel: () => lam("c5panel", () => ({ map: panelTex() })),
  brass: () => lam("c5brass", () => ({ color: "#c79a3e" })),
  globe: () => lam("c5globe", () => ({ map: globeTex() })),
  canvas: () => lam("c5canvas", () => ({ map: sketchTex() })),
  hull: () => lam("c5wreck", () => ({ color: "#3a3036" })),
};
const sandTex = () => ctex("c5sand", 1024, 1024, (g, r) => {
  g.fillStyle = "#e6c88e"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 70; i++) { // soft ripples
    const y = r() * 1024, x = r() * 1024, w = 120 + r() * 260;
    g.strokeStyle = r() > 0.5 ? "rgba(200,160,100,0.35)" : "rgba(255,240,205,0.4)"; g.lineWidth = 3 + r() * 4;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 10 - r() * 10, x + w, y); g.stroke();
  }
  for (let i = 0; i < 1600; i++) { g.fillStyle = r() > 0.5 ? "rgba(170,130,80,0.25)" : "rgba(255,245,220,0.3)"; g.fillRect(r() * 1024, r() * 1024, 2, 2); }
});
const pyrTex = () => ctex("c5pyr", 512, 512, (g, r) => {
  g.fillStyle = "#dcbc83"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 16) { // courses of blocks
    g.fillStyle = "rgba(150,115,70,0.55)"; g.fillRect(0, y, 512, 3);
    for (let x = (y / 16) % 2 ? 0 : 20; x < 512; x += 40) { g.fillStyle = "rgba(150,115,70,0.4)"; g.fillRect(x, y, 2, 16); }
    for (let k = 0; k < 6; k++) { g.fillStyle = r() > 0.5 ? "rgba(255,240,210,0.25)" : "rgba(170,130,80,0.2)"; g.fillRect(r() * 512, y + 3, 30 + r() * 30, 12); }
  }
});
const trunkTex = () => ctex("c5trunk", 128, 256, (g) => {
  g.fillStyle = "#a07a50"; g.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 256; y += 22) { g.fillStyle = "#7c5a38"; g.fillRect(0, y, 128, 6); g.fillStyle = "#b8916a"; g.fillRect(0, y + 6, 128, 4); }
});
const tentTex = () => ctex("c5tentT", 512, 512, (g) => {
  g.fillStyle = "#efe6d0"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#3f5f9a"; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 26, 512);
  g.strokeStyle = "rgba(60,45,40,0.6)"; g.lineWidth = 4; g.strokeRect(2, 2, 508, 508);
});
const cobbleTex = () => ctex("c5cobble", 1024, 1024, (g, r) => {
  g.fillStyle = "#8f8578"; g.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 1024; y += 40) for (let x = (y / 40) % 2 ? 0 : 24; x < 1024; x += 48) {
    const c = ["#b7aa98", "#c2b6a3", "#ab9e8c", "#bfb19c"][Math.floor(r() * 4)];
    g.fillStyle = c; g.beginPath(); g.ellipse(x + 24, y + 20, 21, 17, 0, 0, 7); g.fill();
  }
});
const tileTex = () => ctex("c5tile", 512, 512, (g) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? "#d9cdb4" : "#b9a88c"; g.fillRect(x * 128, y * 128, 128, 128); }
  g.strokeStyle = "rgba(90,70,60,0.5)"; g.lineWidth = 3; for (let k = 0; k <= 512; k += 128) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); }
});
/** the Orangerie wall bay (4 m wide x 10 m): cream wall, pilasters, a tall arched window */
const hallWallTex = () => ctex("c5hallwall", 512, 1280, (g) => {
  g.fillStyle = "#eadfc4"; g.fillRect(0, 0, 512, 1280);
  g.fillStyle = "#d9c9a6"; g.fillRect(0, 0, 44, 1280); g.fillRect(468, 0, 44, 1280); // pilasters
  g.fillStyle = "#cdbb96"; g.fillRect(0, 1180, 512, 100); g.fillRect(0, 0, 512, 60);
  const x0 = 136, x1 = 376, top = 300, bot = 1060;
  g.fillStyle = "#a9c4dc"; g.strokeStyle = "#7a6248"; g.lineWidth = 14;
  g.beginPath(); g.moveTo(x0, bot); g.lineTo(x0, top); g.arc(256, top, 120, Math.PI, 0); g.lineTo(x1, bot); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = "#f4ecd8"; g.lineWidth = 8; g.beginPath(); g.moveTo(256, 190); g.lineTo(256, bot);
  for (let y = 360; y < bot; y += 140) { g.moveTo(x0, y); g.lineTo(x1, y); } g.stroke();
  g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x0 + 18, top, 30, bot - top);
});
/** wood panelling for the plotters' room */
const panelTex = () => ctex("c5panelT", 512, 512, (g) => {
  g.fillStyle = "#7a4e34"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#5a3826"; g.lineWidth = 10;
  for (const [x, y, w, h] of [[30, 40, 200, 260], [282, 40, 200, 260], [30, 340, 200, 140], [282, 340, 200, 140]]) g.strokeRect(x, y, w, h);
  g.strokeStyle = "rgba(255,220,170,0.25)"; g.lineWidth = 4;
  for (const [x, y, w, h] of [[38, 48, 184, 244], [290, 48, 184, 244]]) g.strokeRect(x, y, w, h);
});
const globeTex = () => ctex("c5globe", 512, 256, (g, r) => {
  g.fillStyle = "#6ea6c9"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#d9c08a";
  for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(r() * 512, 50 + r() * 160, 30 + r() * 50, 20 + r() * 40, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(40,40,60,0.4)"; g.lineWidth = 2; for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
});
/** the artist's sketch: a heron by the water and a palm, scribbled (no text) */
const sketchTex = () => ctex("c5sketch", 256, 320, (g) => {
  g.fillStyle = "#f3ead6"; g.fillRect(0, 0, 256, 320);
  g.strokeStyle = "#4a3a30"; g.lineWidth = 4; g.lineCap = "round";
  g.beginPath(); g.moveTo(40, 250); g.quadraticCurveTo(128, 236, 220, 252); g.stroke();
  g.beginPath(); g.moveTo(110, 240); g.lineTo(118, 180); g.moveTo(126, 240); g.lineTo(122, 180); g.stroke();
  g.beginPath(); g.ellipse(124, 160, 34, 22, -0.3, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(148, 146); g.quadraticCurveTo(160, 100, 150, 80); g.lineTo(186, 86); g.stroke();
  g.beginPath(); g.moveTo(200, 240); g.quadraticCurveTo(196, 150, 206, 90); g.stroke();
  for (const a of [-2.6, -2.0, -1.2, -0.6, 0]) { g.beginPath(); g.moveTo(206, 90); g.quadraticCurveTo(206 + 30 * Math.cos(a), 80 + 30 * Math.sin(a), 206 + 50 * Math.cos(a + 0.3), 100 + 40 * Math.sin(a + 0.3)); g.stroke(); }
  g.strokeStyle = "#7a6a5a"; g.lineWidth = 2; for (let y = 270; y < 300; y += 8) { g.beginPath(); g.moveTo(50, y); g.lineTo(200, y + 2); g.stroke(); }
});
/** the Rosetta Stone face: dark grey granodiorite, three bands of scribbles (picture-like signs, a running hand, small
 *  block signs). Nothing in it is a real script. */
export const rosettaTex = () => ctex("c5rosettaT", 768, 1024, (g, r) => {
  g.fillStyle = "#43424d"; g.fillRect(0, 0, 768, 1024);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)"; g.fillRect(r() * 768, r() * 1024, 3, 3); }
  // broken top edge
  g.fillStyle = "#2a2932"; g.beginPath(); g.moveTo(0, 0); g.lineTo(768, 0); g.lineTo(768, 60); g.lineTo(560, 120); g.lineTo(380, 40); g.lineTo(150, 150); g.lineTo(0, 90); g.closePath(); g.fill();
  const ink = "#cfc8b8";
  g.strokeStyle = ink; g.fillStyle = ink; g.lineCap = "round";
  // band 1: little picture signs
  for (let y = 190; y < 400; y += 52) for (let x = 60 + (y % 2) * 10; x < 720; x += 44) {
    const k = Math.floor(r() * 6); g.lineWidth = 4; g.beginPath();
    if (k === 0) g.ellipse(x, y, 12, 8, 0, 0, 7);
    else if (k === 1) { g.moveTo(x - 12, y + 8); g.lineTo(x, y - 10); g.lineTo(x + 12, y + 8); }
    else if (k === 2) { g.moveTo(x - 14, y); for (let i = 0; i < 5; i++) g.lineTo(x - 14 + i * 7, y + (i % 2 ? -6 : 6)); }
    else if (k === 3) { g.moveTo(x - 10, y + 10); g.quadraticCurveTo(x, y - 18, x + 10, y + 10); g.moveTo(x - 4, y - 2); g.lineTo(x + 8, y - 8); }
    else if (k === 4) { g.moveTo(x, y - 12); g.lineTo(x, y + 12); g.moveTo(x - 8, y - 4); g.lineTo(x + 8, y - 4); }
    else g.rect(x - 9, y - 9, 18, 18);
    g.stroke();
  }
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(40, 420, 688, 6); g.fillRect(40, 690, 688, 6);
  // band 2: a running hand
  g.lineWidth = 3;
  for (let y = 460; y < 670; y += 30) {
    g.beginPath(); let x = 50; g.moveTo(x, y);
    while (x < 718) { const w = 8 + r() * 12; g.quadraticCurveTo(x + w / 2, y - 10 - r() * 6, x + w, y + (r() - 0.5) * 6); x += w; if (r() < 0.12) { x += 14; g.moveTo(x, y); } }
    g.stroke();
  }
  // band 3: small block signs in tidy rows
  g.lineWidth = 3;
  for (let y = 730; y < 990; y += 26) for (let x = 50; x < 718; x += 15) {
    if (r() < 0.15) continue;
    const k = Math.floor(r() * 4); g.beginPath();
    if (k === 0) { g.moveTo(x, y - 8); g.lineTo(x, y + 8); }
    else if (k === 1) { g.moveTo(x - 5, y + 8); g.lineTo(x, y - 8); g.lineTo(x + 5, y + 8); }
    else if (k === 2) g.ellipse(x, y, 5, 7, 0, 0, 7);
    else { g.moveTo(x - 5, y - 8); g.lineTo(x + 5, y - 8); g.moveTo(x, y - 8); g.lineTo(x, y + 8); }
    g.stroke();
  }
});

/** the map on the deck table: parchment, the Mediterranean coasts, a dotted route; k = route drawn 0..1, india = the
 *  arrow onward to the east (no text) */
export const drawMap = (g: CanvasRenderingContext2D, k: number, india: number) => {
  g.fillStyle = "#ecdcb4"; g.fillRect(0, 0, 800, 520);
  g.strokeStyle = "#8a6a44"; g.lineWidth = 10; g.strokeRect(5, 5, 790, 510);
  const land = "#cdb98a", coast = "#6a5338";
  g.fillStyle = land; g.strokeStyle = coast; g.lineWidth = 4;
  const blob = (pts: [number, number][]) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); g.stroke(); };
  blob([[0, 0], [330, 0], [320, 70], [270, 110], [230, 120], [180, 170], [120, 150], [60, 170], [0, 160]]);                // Europe / France
  blob([[330, 0], [520, 0], [500, 60], [440, 90], [380, 160], [345, 120], [360, 70]]);                                         // Italy / Balkans
  blob([[0, 330], [120, 300], [260, 330], [380, 360], [470, 380], [520, 360], [560, 400], [560, 520], [0, 520]]);             // North Africa / Egypt
  blob([[520, 0], [800, 0], [800, 300], [700, 330], [640, 300], [580, 360], [560, 280], [600, 200], [560, 120]]);            // Levant / Asia
  g.strokeStyle = "#5a7fb0"; g.lineWidth = 6; g.beginPath(); g.moveTo(540, 520); g.quadraticCurveTo(530, 440, 520, 372); g.stroke(); // the Nile
  // the route: Toulon -> Malta -> Alexandria
  const pts: [number, number][] = [[190, 168], [300, 230], [420, 260], [500, 330], [512, 366]];
  const len = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  let tot = 0; for (let i = 1; i < pts.length; i++) tot += len(pts[i - 1], pts[i]);
  g.strokeStyle = "#b8282e"; g.lineWidth = 9; g.setLineDash([18, 14]); g.lineCap = "round"; g.beginPath(); g.moveTo(...pts[0]);
  let left = k * tot;
  for (let i = 1; i < pts.length && left > 0; i++) {
    const L = len(pts[i - 1], pts[i]), u = Math.min(1, left / L);
    g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u); left -= L;
  }
  g.stroke(); g.setLineDash([]);
  if (india > 0) { // a fat arrow onward to the east, off the map edge
    const x0 = 560, y0 = 350, x1 = 560 + 210 * india, y1 = 350 - 90 * india;
    g.strokeStyle = "#b8282e"; g.lineWidth = 16; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + 10, x1, y1); g.stroke();
    if (india > 0.6) { g.fillStyle = "#b8282e"; g.beginPath(); g.moveTo(x1 + 30, y1 - 14); g.lineTo(x1 - 14, y1 - 26); g.lineTo(x1 - 2, y1 + 18); g.closePath(); g.fill(); }
  }
  // a little ship on the route
  const s = Math.min(1, k) * 0.999, seg = Math.min(pts.length - 2, Math.floor(s * (pts.length - 1)));
  const u = s * (pts.length - 1) - seg, sx = pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * u, sy = pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * u;
  g.fillStyle = "#3a2a20"; g.beginPath(); g.moveTo(sx - 22, sy - 4); g.lineTo(sx + 22, sy - 4); g.lineTo(sx + 14, sy + 8); g.lineTo(sx - 14, sy + 8); g.closePath(); g.fill();
  g.fillStyle = "#f7f1e1"; g.strokeStyle = "#3a2a20"; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, sy - 6); g.lineTo(sx, sy - 34); g.lineTo(sx + 16, sy - 10); g.closePath(); g.fill(); g.stroke();
};

// ---------------- small builders ----------------
const box = (b: Batch, m: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, tile = 0) =>
  b.add(boxGeo(V(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)), V(Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)), tile), m);
/** horizontal quad facing up */
const up = (x0: number, x1: number, z0: number, z1: number, y: number, u = 1, v = 1) => quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), u, v);
const flat = (g: THREE.BufferGeometry) => { const n = g.toNonIndexed(); n.computeVertexNormals(); return n; };

/** a date palm: a leaning ringed trunk and a crown of drooping fronds, base at (x, y, z), height h */
export const palm = (b: Batch, x: number, y: number, z: number, h: number, seed: number) => {
  const r = rng(seed), lean = 0.08 + r() * 0.12, dir = r() * Math.PI * 2, n = 7;
  const P = (u: number) => V(x + Math.cos(dir) * lean * h * u * u, y + h * u, z + Math.sin(dir) * lean * h * u * u);
  for (let i = 0; i < n; i++) {
    const a = P(i / n), c = P((i + 1) / n), len = a.distanceTo(c), rad = 0.24 - 0.08 * (i / n);
    const g = new THREE.CylinderGeometry(rad * 0.92, rad, len * 1.04, 9, 1, true);
    const m = new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1));
    b.add(g, M.palmTrunk(), m);
  }
  const top = P(1);
  const nf = 9;
  for (let k = 0; k < nf; k++) {
    const a = (k / nf) * Math.PI * 2 + r() * 0.4, L = h * (0.36 + r() * 0.1), W = L * 0.2, droop = 0.55 + r() * 0.35;
    const geo = new THREE.PlaneGeometry(1, 1, 8, 2), p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + 0.5, v = p.getY(i); // u along the frond, v across
      const w = W * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (1 - 0.3 * u);
      const along = L * u, fall = -droop * L * u * u + 0.25 * L * u;
      p.setXYZ(i, along, fall - Math.abs(v) * w * 0.4, v * w * 2);
    }
    geo.computeVertexNormals();
    b.add(geo, k % 2 ? M.palmLeaf() : M.palmLeaf2(), new THREE.Matrix4().compose(top, new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a), V(1, 1, 1)));
  }
  b.add(new THREE.SphereGeometry(0.42, 10, 8), M.darkWood(), new THREE.Matrix4().makeTranslation(top.x, top.y - 0.2, top.z));
};

/** the flagship / Vanguard: the shared warship plus a walkable deck at hull-top - 1.15 m (inner bulwarks, rail,
 *  forecastle and quarterdeck fronts), deck guns. Local frame: origin at the waterline amidships, bow +x. */
export const deckShip = (L: number, flag: "fr" | "uk", guns: [number, number][]) => {
  const g = warship({ length: L, flag, sails: "set", brace: 28 });
  const yF = 0.125 * L - 1.15, hw = 0.1 * L, x0 = -0.22 * L, x1 = 0.24 * L;
  const b = new Batch();
  box(b, M.planks(), x0, x1, yF - 0.25, yF, -hw, hw, 4);
  for (const s of [-1, 1]) {
    box(b, M.rail(), x0, x1, yF, yF + 1.12, s * hw, s * (hw + 0.16));
    box(b, M.darkWood(), x0 - 0.2, x1 + 0.2, yF + 1.12, yF + 1.24, s * (hw - 0.06), s * (hw + 0.26));
  }
  box(b, M.rail(), x1, x1 + 0.06 * L, 1, yF + 1.25, -hw * 0.9, hw * 0.9);      // forecastle front
  box(b, M.darkWood(), x1 - 0.1, x1 + 0.06 * L, yF + 1.25, yF + 1.37, -hw * 0.9, hw * 0.9);
  box(b, M.planks(), x0 - 0.08 * L, x0, 1, yF + 1.6, -hw, hw, 4);                 // quarterdeck front
  box(b, M.darkWood(), x0 - 0.08 * L, x0 + 0.1, yF + 1.6, yF + 1.72, -hw, hw);
  for (const [gx, gz] of [[x0 + 2, -hw + 0.7], [x0 + 2, hw - 0.7]]) box(b, M.darkWood(), gx - 0.6, gx + 0.6, yF, yF + 0.9, gz - 0.5, gz + 0.5); // capstan-ish lockers
  b.build(g);
  for (const [gx, side] of guns) {
    const c = cannon({ elev: 2 }); c.position.set(gx, yF, side * (hw - 1.3)); c.rotation.y = -side * Math.PI / 2; g.add(c);
  }
  return g;
};

// ---------------- the sea places ----------------
/** voyage: the flagship (static, its deck is a set) and the convoy around it (bobbing, sailing +x) */
export const buildVoyage = (root: THREE.Object3D, bob: Bobber[]) => {
  const flag = deckShip(50, "fr", [[-8.5, 1], [-3.5, 1], [1.5, 1], [-8.5, -1], [-3.5, -1], [2.2, -1]]);
  flag.position.set(0, -1, 0); root.add(flag);
  const props = new Batch();
  // the map table (stern) and stools
  box(props, M.wood(), MAP_T[0] - 0.9, MAP_T[0] + 0.9, FL + 0.82, FL + 0.9, MAP_T[2] - 0.6, MAP_T[2] + 0.6);
  for (const [sx, sz] of [[-0.75, -0.5], [0.75, -0.5], [-0.75, 0.5], [0.75, 0.5]]) box(props, M.darkWood(), MAP_T[0] + sx - 0.05, MAP_T[0] + sx + 0.05, FL, FL + 0.82, MAP_T[2] + sz - 0.05, MAP_T[2] + sz + 0.05);
  // the telescope on its tripod, pointing out over the -z rail and up
  const eye = V(SCOPE[0] + 0.26, FL + 1.6, SCOPE[2] - 0.05), dir = V(0.62, 0.16, -0.77).normalize(), objEnd = eye.clone().addScaledVector(dir, 1.35);
  const tube = new THREE.CylinderGeometry(0.085, 0.05, 1.35, 12);
  props.add(tube, M.brass(), new THREE.Matrix4().compose(eye.clone().add(objEnd).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir), V(1, 1, 1)));
  const mid = eye.clone().addScaledVector(dir, 0.6);
  for (const a of [0.4, 2.5, 4.6]) {
    const foot = V(mid.x + 0.5 * Math.cos(a), FL, mid.z + 0.5 * Math.sin(a)), c = mid.clone().add(V(0, -0.08, 0));
    props.add(new THREE.CylinderGeometry(0.025, 0.025, c.distanceTo(foot), 6), M.darkWood(), new THREE.Matrix4().compose(c.clone().add(foot).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(foot).normalize()), V(1, 1, 1)));
  }
  // a globe on a stand, a crate of instruments and books
  const gx = 5.0 - 0.9, gz = -2.2 - 0.3;
  props.add(new THREE.CylinderGeometry(0.06, 0.2, 0.75, 10), M.darkWood(), new THREE.Matrix4().makeTranslation(gx, FL + 0.37, gz));
  props.add(new THREE.SphereGeometry(0.3, 20, 14), M.globe(), new THREE.Matrix4().makeTranslation(gx, FL + 1.05, gz));
  props.add(new THREE.TorusGeometry(0.34, 0.025, 6, 24), M.brass(), new THREE.Matrix4().makeTranslation(gx, FL + 1.05, gz));
  box(props, M.wood(), 9.3, 10.3, FL, FL + 0.6, -4.4, -3.6);
  box(props, M.red(), 9.4, 9.9, FL + 0.6, FL + 0.72, -4.3, -3.9); box(props, M.green(), 9.5, 10.1, FL + 0.72, FL + 0.82, -4.25, -3.85);
  // the artist's easel and canvas, facing the camera of the artist close-up
  const ex = EASEL[0], ez = EASEL[2];
  for (const [dx, dz] of [[-0.35, 0.15], [0.35, 0.15], [0, -0.4]]) {
    const top = V(ex, FL + 1.75, ez), foot = V(ex + dx, FL, ez + dz);
    props.add(new THREE.CylinderGeometry(0.025, 0.03, top.distanceTo(foot), 6), M.darkWood(), new THREE.Matrix4().compose(top.clone().add(foot).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), top.clone().sub(foot).normalize()), V(1, 1, 1)));
  }
  const cv = quad(V(ex - 0.42, FL + 0.95, ez + 0.2), V(ex + 0.42, FL + 0.95, ez + 0.2), V(ex + 0.42, FL + 1.98, ez + 0.06), V(ex - 0.42, FL + 1.98, ez + 0.06));
  const yaw = new THREE.Matrix4().makeTranslation(ex, 0, ez).multiply(new THREE.Matrix4().makeRotationY(-0.98)).multiply(new THREE.Matrix4().makeTranslation(-ex, 0, -ez));
  props.add(cv, M.canvas(), yaw);
  props.add(boxGeo(V(ex - 0.45, FL + 0.9, ez + 0.1), V(ex + 0.45, FL + 0.95, ez + 0.3)), M.darkWood(), yaw);
  props.build(root);
  // the convoy (bobbing; the water flows -x under them)
  const R = rng(5);
  const spots: [number, number, number][] = [[-120, -95, 40], [65, -150, 40], [-10, 205, 40], [150, 85, 40], [-230, 55, 40], [230, -55, 34], [-185, -205, 34],
    [110, 250, 40], [300, 170, 34], [-310, -70, 40], [380, -160, 34], [-90, 300, 34], [20, -300, 40]];
  const proto: Record<number, THREE.Group> = { 40: warship({ length: 40, flag: "fr" }), 34: warship({ length: 34, flag: "fr", brace: 40 }) };
  for (const [x, z, L] of spots) {
    const s = proto[L].clone(); root.add(s);
    bob.push({ o: s, x, y: -0.8, z, yaw: (R() - 0.5) * 0.12, ph: R() * 6, amp: 1 });
  }
};

/** Aboukir Bay: the beach (sand above SHORE_Z, a slope into the water), low dunes and a few palms */
export const buildShore = (root: THREE.Object3D) => {
  const b = new Batch();
  b.add(up(-3000, 3000, -3000, SHORE_Z - 12, BEACH, 300, 150), M.sand());
  b.add(quad(V(-3000, -0.9, SHORE_Z + 12), V(3000, -0.9, SHORE_Z + 12), V(3000, BEACH, SHORE_Z - 12), V(-3000, BEACH, SHORE_Z - 12), 300, 3), M.sand());
  const hill = new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  for (const [x, z, sx, sy, sz] of [[-80, -190, 40, 6, 20], [40, -210, 55, 8, 22], [160, -185, 40, 5, 18], [-200, -200, 60, 7, 25], [280, -220, 60, 9, 30]] as const)
    b.add(hill, M.sand(), new THREE.Matrix4().compose(V(x, BEACH - 0.5, z), new THREE.Quaternion(), V(sx, sy, sz)));
  for (const [x, z, h] of [[-30, -160, 9], [-24, -166, 7.5], [60, -168, 10], [70, -160, 8], [120, -170, 9], [-120, -165, 8.5], [-128, -172, 10]] as const) palm(b, x, BEACH, z, h, x * 7 + z);
  // a small fort on the point (Aboukir castle), far left
  box(b, M.sandStone(), -340, -300, BEACH, 10, -150, -125, 4);
  for (let x = -340; x < -300; x += 4) box(b, M.sandStone(), x, x + 2, 10, 11.4, -125.6, -124.6);
  b.build(root);
};

/** the anchored French line (heading -x, sails furled), L'Orient in the middle */
export const buildFrenchLine = (root: THREE.Object3D, bob: Bobber[]) => {
  const p40 = warship({ length: 40, flag: "fr", sails: "furled" }), p50 = warship({ length: 50, flag: "fr", sails: "furled" });
  for (let k = 0; k < 13; k++) {
    const x = -300 + 50 * k, s = (x === 0 ? p50 : p40).clone(); root.add(s);
    bob.push({ o: s, x, y: -0.8, z: (k % 2) * 6, yaw: Math.PI + (k % 3 - 1) * 0.04, ph: k * 1.3, amp: 0.5 });
  }
};
/** British ships: under sail closing in (shot 10, they move with brZ) or anchored alongside the French (shot 11) */
export const buildBritish = (root: THREE.Object3D, bob: Bobber[], battle: boolean, vanguard = true) => {
  const p = warship({ length: 44, flag: "uk", sails: "set", brace: 35, band: "#d8b45a" });
  const spots: [number, number, number][] = battle
    ? [[-275, 48, Math.PI], [-225, 48, Math.PI], [-175, -46, Math.PI], [-125, 50, Math.PI], [-75, -48, Math.PI], [-25, 52, Math.PI], [25, 50, Math.PI], [75, -46, Math.PI]]
    : [[-70, 245, Math.PI / 2 + 0.25], [110, 265, Math.PI / 2 + 0.1], [175, 310, Math.PI / 2 + 0.15], [-140, 300, Math.PI / 2 + 0.3], [-10, 330, Math.PI / 2 + 0.2]];
  for (const [x, z, yaw] of spots) { const s = p.clone(); root.add(s); bob.push({ o: s, x, y: -0.8, z, yaw, ph: x * 0.07, amp: 0.7, vz: battle ? 0 : 1 }); }
  if (vanguard) {
    const v = deckShip(46, "uk", [[-6, 1], [-1, 1], [-6, -1], [-1, -1]]);
    v.position.set(VANGUARD[0], VANGUARD[1], VANGUARD[2]); v.rotation.y = Math.PI / 2; root.add(v);
    bob.push({ o: v, x: VANGUARD[0], y: VANGUARD[1], z: VANGUARD[2], yaw: Math.PI / 2, ph: 0, amp: 0 });
  }
};
/** the morning after: broken masts and blackened hulks in the water, smoke, two ships escaping far out */
export const buildWrecks = (root: THREE.Object3D, bob: Bobber[]) => {
  const b = new Batch(), R = rng(9);
  for (let k = 0; k < 13; k++) {
    const x = -300 + 50 * k + (R() - 0.5) * 10, z = (k % 2) * 6;
    if (k === 6) { // L'Orient: only flotsam
      for (let i = 0; i < 8; i++) box(b, M.hull(), x + (R() - 0.5) * 30, x + (R() - 0.5) * 30 + 3, -0.2, 0.25, z + (R() - 0.5) * 20, z + (R() - 0.5) * 20 + 0.8);
      continue;
    }
    const hull = new THREE.BoxGeometry(30, 3, 9); hull.translate(0, 0.6, 0);
    b.add(hull, M.hull(), new THREE.Matrix4().compose(V(x, -0.6 - R() * 0.8, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 0.25, R() * 0.6, (R() - 0.5) * 0.2)), V(1, 1, 1)));
    const nm = 1 + Math.floor(R() * 2);
    for (let i = 0; i < nm; i++) {
      const mx = x + (i - 0.5) * 12, h = 8 + R() * 14, tilt = (R() - 0.5) * 0.7;
      b.add(new THREE.CylinderGeometry(0.35, 0.5, h, 8), M.darkWood(), new THREE.Matrix4().compose(V(mx + Math.sin(tilt) * h / 2, h / 2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -tilt)), V(1, 1, 1)));
      if (R() > 0.4) b.add(new THREE.CylinderGeometry(0.15, 0.15, 9, 6), M.darkWood(), new THREE.Matrix4().compose(V(mx + Math.sin(tilt) * h * 0.8, h * 0.8, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0.3, 0)), V(1, 1, 1)));
    }
  }
  b.build(root);
  const p = warship({ length: 40, flag: "fr", sails: "set" });
  for (const [x, z] of [[180, 330], [240, 360]]) { const s = p.clone(); root.add(s); bob.push({ o: s, x, y: -0.8, z, yaw: 0.5, ph: x, amp: 0.6 }); }
};
/** the escape: the small ship (bow +x) and the British patrol (bow -x) */
export const buildEscape = (root: THREE.Object3D) => {
  const small = warship({ length: 26, flag: "fr", sails: "set", brace: 25 }); root.add(small);
  const patrol = warship({ length: 46, flag: "uk", sails: "set", brace: 20 }); root.add(patrol);
  return { small, patrol };
};

// ---------------- Egypt ----------------
export const buildDesert = (root: THREE.Object3D, kit: Kit, rays: Ray[]) => {
  const b = new Batch();
  // the heightfield (x -600..300, z -800..800, 5 m cells), flat quads around it, the Nile at x 300..380
  const X0 = -600, X1 = 300, Z0 = -800, Z1 = 800, S = 5, nx = (X1 - X0) / S, nz = (Z1 - Z0) / S;
  const hg = new THREE.PlaneGeometry(X1 - X0, Z1 - Z0, nx, nz); hg.rotateX(-Math.PI / 2); hg.translate((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
  const hp = hg.attributes.position as THREE.BufferAttribute, uv = hg.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < hp.count; i++) { const x = hp.getX(i), z = hp.getZ(i); hp.setY(i, sandY(x, z)); uv.setXY(i, x / 24, z / 24); }
  hg.computeVertexNormals();
  b.add(hg, M.sand());
  b.add(up(-3000, X0, -3000, 3000, 0, 100, 250), M.sand());
  b.add(up(X0, X1, -3000, Z0, 0, 38, 92), M.sand());
  b.add(up(X0, X1, Z1, 3000, 0, 38, 92), M.sand());
  b.add(up(380, 3000, -3000, 3000, 0, 110, 250), M.sand());
  b.add(quad(V(300, -1.2, 3000), V(300, -1.2, -3000), V(300, 0, -3000), V(300, 0, 3000), 250, 0.1), M.dirt());
  b.add(quad(V(380, -1.2, -3000), V(380, -1.2, 3000), V(380, 0, 3000), V(380, 0, -3000), 250, 0.1), M.dirt());
  // pyramids (Giza on the horizon): flat-faced four-sided cones
  for (const [x, z, base, h] of [[-70, -560, 150, 96], [95, -610, 140, 90], [205, -650, 70, 46]] as const) {
    const c = new THREE.ConeGeometry(base / Math.SQRT2, h, 4, 1); c.rotateY(Math.PI / 4); c.translate(x, h / 2 - 0.5, z);
    const fl = flat(c), u = fl.attributes.uv as THREE.BufferAttribute, pp = fl.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pp.count; i++) u.setXY(i, (pp.getX(i) + pp.getZ(i)) / 40, pp.getY(i) / 40);
    b.add(fl, M.pyramid());
  }
  // palms: the Nile banks, the camp oasis, the dig
  const R = rng(21);
  for (let z = -700; z < 700; z += 14 + R() * 18) {
    palm(b, 286 + R() * 10, 0, z, 8 + R() * 4, Math.floor(z * 3 + 1000));
    if (R() > 0.3) palm(b, 386 + R() * 12, 0, z + R() * 8, 8 + R() * 4, Math.floor(z * 5 + 2000));
  }
  for (const [x, z, h] of [[-168, 188, 10], [-160, 182, 8.5], [-132, 186, 9.5], [-174, 210, 9], [-126, 214, 11], [-142, 176, 8]] as const) palm(b, x, sandY(x, z), z, h, x * 11 + z);
  for (const [x, z, h] of [[262, 112, 9], [266, 94, 10.5], [244, 120, 8], [272, 104, 8]] as const) palm(b, x, 0, z, h, x * 13 + z);
  // the Rosetta dig: a dirt pit rim, spoil heaps, Fort Julien's broken wall behind
  for (let a = 0; a < 12; a++) {
    const t = (a / 12) * Math.PI * 2, rx = DIG[0] + 2.1 * Math.cos(t), rz = DIG[2] + 1.6 * Math.sin(t);
    b.add(new THREE.SphereGeometry(0.75, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.dirt(), new THREE.Matrix4().compose(V(rx, -0.05, rz), new THREE.Quaternion(), V(1, 0.45, 1)));
  }
  b.add(up(DIG[0] - 1.8, DIG[0] + 1.8, DIG[2] - 1.3, DIG[2] + 1.3, 0.015, 1, 1), M.dirt());
  for (const [x, z, s] of [[DIG[0] + 3.2, DIG[2] - 2.6, 1.3], [DIG[0] - 3.5, DIG[2] - 1.0, 1.1]] as const)
    b.add(new THREE.SphereGeometry(s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.dirt(), new THREE.Matrix4().compose(V(x, 0, z), new THREE.Quaternion(), V(1.2, 0.7, 1)));
  const fx0 = DIG[0] - 18, fz = DIG[2] - 16;
  box(b, M.sandStone(), fx0, fx0 + 30, 0, 5.5, fz - 1.2, fz, 3);
  for (let x = fx0; x < fx0 + 30; x += 2.2) if ((x - fx0) % 6.6 > 1) box(b, M.sandStone(), x, x + 1.2, 5.5, 6.5, fz - 1.2, fz);
  box(b, M.sandStone(), fx0 - 3, fx0 + 3, 0, 8, fz - 3.5, fz + 1.5, 3); // corner tower
  box(b, M.sandStone(), fx0 + 30, fx0 + 31.2, 0, 3.2, fz - 1.2, fz + 8, 3); // the broken side wall
  for (const [x, z, s] of [[fx0 + 33, fz + 3, 0.8], [fx0 + 32, fz + 6, 0.6], [DIG[0] - 7, DIG[2] - 4, 0.5]] as const) box(b, M.sandStone(), x - s, x + s, 0, s * 1.2, z - s, z + s);
  // the stone's crate (shot 15)
  box(b, M.wood(), STONE2[0] - 0.6, STONE2[0] + 0.6, 0, 0.55, STONE2[2] - 0.45, STONE2[2] + 0.45);
  // the camp: Napoleon's marquee + two ridge tents, a flag pole, a camp table
  const [cx, , cz] = CAMP, tm = M.tent();
  const ty = sandY(cx, cz);
  b.add(boxGeo(V(cx - 2.6, ty, cz - 2.0), V(cx + 2.6, ty + 2.3, cz + 2.0)), tm);
  const ap = V(cx, ty + 4.2, cz);
  for (const [a, c] of [[V(cx - 2.8, ty + 2.3, cz + 2.2), V(cx + 2.8, ty + 2.3, cz + 2.2)], [V(cx + 2.8, ty + 2.3, cz + 2.2), V(cx + 2.8, ty + 2.3, cz - 2.2)],
    [V(cx + 2.8, ty + 2.3, cz - 2.2), V(cx - 2.8, ty + 2.3, cz - 2.2)], [V(cx - 2.8, ty + 2.3, cz - 2.2), V(cx - 2.8, ty + 2.3, cz + 2.2)]] as const) b.add(tri(a, c, ap), tm);
  b.add(quad(V(cx - 0.8, ty, cz + 2.02), V(cx + 0.8, ty, cz + 2.02), V(cx + 0.8, ty + 2.0, cz + 2.02), V(cx - 0.8, ty + 2.0, cz + 2.02)), M.tentDark());
  for (const [x, z] of [[cx + 9, cz - 6], [cx - 10, cz - 4], [cx + 15, cz + 1]] as const) {
    const y = sandY(x, z);
    b.add(tri(V(x - 1.6, y, z + 2), V(x + 1.6, y, z + 2), V(x, y + 2.4, z + 2)), tm);
    b.add(quad(V(x + 1.6, y, z + 2), V(x + 1.6, y, z - 2), V(x, y + 2.4, z - 2), V(x, y + 2.4, z + 2)), tm);
    b.add(quad(V(x, y + 2.4, z + 2), V(x, y + 2.4, z - 2), V(x - 1.6, y, z - 2), V(x - 1.6, y, z + 2)), tm);
  }
  box(b, M.darkWood(), cx + 3.2, cx + 3.3, ty, ty + 7, cz + 1.5, cz + 1.6);
  box(b, M.wood(), cx - 3.6, cx - 2.4, ty + 0.75, ty + 0.82, cz + 2.4, cz + 3.2);
  for (const [dx, dz] of [[-3.5, 2.5], [-2.5, 2.5], [-3.5, 3.1], [-2.5, 3.1]]) box(b, M.darkWood(), cx + dx - 0.04, cx + dx + 0.04, ty, ty + 0.75, cz + dz - 0.04, cz + dz + 0.04);
  // Acre: walls on the hill, round towers, white houses, a dome and a minaret inside
  const az = ACRE[2];
  for (let x = -70; x < 70; x += 4) {
    const y = Math.min(sandY(x, az), sandY(x + 4, az)) - 1.5;
    box(b, M.sandStone(), x, x + 4.05, y, y + 11.5, az - 1.6, az + 1.6, 4);
    box(b, M.sandStone(), x, x + 1.8, y + 11.5, y + 12.7, az - 1.6, az - 0.6);
  }
  for (const x of [-72, -36, 0, 36, 70]) {
    const y = sandY(x, az) - 1.5, tw = new THREE.CylinderGeometry(4, 4.4, 15, 16); tw.translate(x, y + 7.5, az - 0.5);
    b.add(tw, M.sandStone());
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; box(b, M.sandStone(), x + 3.6 * Math.cos(a) - 0.6, x + 3.6 * Math.cos(a) + 0.6, y + 15, y + 16.2, az - 0.5 + 3.6 * Math.sin(a) - 0.6, az - 0.5 + 3.6 * Math.sin(a) + 0.6); }
  }
  for (let i = 0; i < 16; i++) {
    const x = -55 + (i % 8) * 15 + R() * 5, z = az + 8 + Math.floor(i / 8) * 12 + R() * 4, y = sandY(x, z) - 1, w = 6 + R() * 3, h = 5 + R() * 6;
    box(b, i % 3 ? M.whiteWall() : M.ochreWall(), x, x + w, y, y + h + 10, z, z + w);
  }
  const dome = new THREE.SphereGeometry(7, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); dome.translate(-10, sandY(-10, az + 22) + 18, az + 22);
  b.add(dome, M.whiteWall());
  box(b, M.whiteWall(), -17, -3, sandY(-10, az + 22) + 4, sandY(-10, az + 22) + 18, az + 15, az + 29);
  const min = new THREE.CylinderGeometry(1.4, 1.7, 30, 12); min.translate(14, sandY(14, az + 18) + 15, az + 18); b.add(min, M.whiteWall());
  const cap = new THREE.ConeGeometry(1.9, 5, 12); cap.translate(14, sandY(14, az + 18) + 32.5, az + 18); b.add(cap, M.ochreWall());
  // the French siege battery before Acre (3D guns aimed at the walls)
  b.build(root);
  for (const x of [-16, -8, 0]) { const c = cannon({ elev: 10 }); c.position.set(x, sandY(x, 478), 478); c.rotation.y = -Math.PI / 2; root.add(c); }
  void kit; void rays;
};

/** the Rosetta Stone: a dark slab (1.14 x 0.72 x 0.28 m), the painted face toward local +z */
export const rosettaStone = () => {
  const g = new THREE.Group(), w = 0.72, h = 1.14, d = 0.28;
  const side = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.stoneSide()); side.castShadow = true; side.receiveShadow = true; g.add(side);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.99, h * 0.99), M.stone()); face.position.z = d / 2 + 0.002; face.receiveShadow = true; g.add(face);
  return g;
};

// ---------------- France ----------------
/** the Paris street (houses facing +z along z = -9), the plotters' room, the Orangerie hall */
export const buildFrance = (root: THREE.Object3D, kit: Kit, rays: Ray[], wav: Waver[]) => {
  const b = new Batch(), hall = new Batch();
  setSightLines(rays);
  b.add(up(-200, 200, -60, 60, 0, 50, 15), M.cobble());
  let x = -70, si = 0;
  while (x < 70) { const w = [8, 9, 10][si % 3], h = [11.2, 12.6, 9.8][(si * 2) % 3]; house(b, x + w / 2, -13, 0, w, 8, h, (si * 3 + 1) % 8, 0); x += w + 0.2; si++; }
  x = -70; si = 0;
  while (x < 70) { const w = [9, 8, 10][si % 3]; house(b, x + w / 2, -30, 0, w, 8, 15, (si * 5 + 2) % 8, 0); x += w + 0.3; si++; }
  for (const lx of [-16, -4, 8, 20]) prop(b, kit, "lantern", lx, 0, -8.2, 3.2);
  setSightLines([]);
  // tricolour flags hanging from first-floor windows (waving)
  const fm = new THREE.MeshBasicMaterial({ map: flagTex("fr"), side: THREE.DoubleSide, color: 0xe8e8e8 });
  for (const fx of [-14, -6.5, 3, 10.5, 17]) {
    const geo = new THREE.PlaneGeometry(1.6, 1.0, 10, 1); geo.translate(0.8, 0, 0);
    const m = new THREE.Mesh(geo, fm); m.position.set(fx, 4.4, -8.6); m.rotation.y = -Math.PI / 2 + 0.25; m.rotation.z = -0.5; root.add(m);
    wav.push({ m, w: 1.6, ph: fx });
    box(b, M.darkWood(), fx - 0.03, fx + 0.03, 3.6, 4.6, -8.95, -8.6);
  }
  b.build(root);
  // the plotters' room (panelled, a table with a cloth and a candle); no shadows from the walls
  const [rx, , rz] = ROOM;
  box(hall, M.planks(), rx - 5, rx + 5, -0.1, 0, rz - 5, rz + 4, 3);
  hall.add(quad(V(rx - 5, 0, rz - 3.4), V(rx + 5, 0, rz - 3.4), V(rx + 5, 4.5, rz - 3.4), V(rx - 5, 4.5, rz - 3.4), 2.5, 1), M.panel());
  hall.add(quad(V(rx - 4, 0, rz + 4), V(rx - 4, 0, rz - 3.4), V(rx - 4, 4.5, rz - 3.4), V(rx - 4, 4.5, rz + 4), 2, 1), M.panel());
  hall.add(quad(V(rx + 4, 0, rz - 3.4), V(rx + 4, 0, rz + 4), V(rx + 4, 4.5, rz + 4), V(rx + 4, 4.5, rz - 3.4), 2, 1), M.panel());
  box(hall, M.darkWood(), rx - 5, rx + 5, 4.5, 4.7, rz - 5, rz + 5);
  box(hall, M.green(), rx - 1.3, rx + 1.3, 0.78, 0.86, rz + 0.1 - 0.7, rz + 0.1 + 0.7);
  box(hall, M.green(), rx - 1.3, rx + 1.3, 0.3, 0.86, rz + 0.78, rz + 0.8);
  // the Orangerie of Saint-Cloud: long hall, arched windows, benches, the tribune at the west end
  const [hx, , hz] = HALL, X0 = hx - 26, X1 = hx + 30, Z0 = hz - 10, Z1 = hz + 15, H = 10;
  box(hall, M.hallFloor(), X0, X1, -0.1, 0, Z0, Z1, 4);
  hall.add(quad(V(X0, 0, Z0), V(X1, 0, Z0), V(X1, H, Z0), V(X0, H, Z0), (X1 - X0) / 4, 1), M.hallWall());
  hall.add(quad(V(X1, 0, Z1), V(X0, 0, Z1), V(X0, H, Z1), V(X1, H, Z1), (X1 - X0) / 4, 1), M.hallWall());
  hall.add(quad(V(X0, 0, Z1), V(X0, 0, Z0), V(X0, H, Z0), V(X0, H, Z1), (Z1 - Z0) / 4, 1), M.hallWall());
  hall.add(quad(V(X1, 0, Z0), V(X1, 0, Z1), V(X1, H, Z1), V(X1, H, Z0), (Z1 - Z0) / 4, 1), M.hallWall());
  box(hall, lam("c5ceiling", () => ({ color: "#e6dcc4" })), X0, X1, H, H + 0.3, Z0, Z1);
  box(hall, M.wood(), hx - 24, hx - 16.5, 0, TRIB, hz - 7, hz + 7, 2);             // the tribune platform
  box(hall, M.wood(), hx - 16.5, hx - 16, 0, TRIB / 2, hz - 7, hz + 7, 2);          // its step
  box(hall, M.red(), hx - 18.2, hx - 17.4, TRIB, TRIB + 1.1, hz - 0.6, hz + 0.6);   // the lectern
  hall.add(quad(V(X0 + 0.05, 2, hz + 5), V(X0 + 0.05, 2, hz - 5), V(X0 + 0.05, H - 0.5, hz - 5), V(X0 + 0.05, H - 0.5, hz + 5)), lam("c5drape", () => ({ map: flagTex("fr") })));
  for (let r = 0; r < 5; r++) for (const [z0, z1] of [[hz - 8.5, hz - 1.2], [hz + 1.2, hz + 12]] as const) {
    const bx = hx - 12 + r * 4.5;
    box(hall, M.bench(), bx, bx + 0.6, 0, 0.45, z0, z1); box(hall, M.bench(), bx + 0.55, bx + 0.7, 0, 1.0, z0, z1);
  }
  for (const s of [-1, 1]) { // flag poles beside the tribune
    box(hall, M.darkWood(), hx - 23.05, hx - 22.95, TRIB, TRIB + 4.2, hz + s * 2.6 - 0.05, hz + s * 2.6 + 0.05);
    const geo = new THREE.PlaneGeometry(1.8, 1.15, 10, 1); geo.translate(0.9, 0, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: flagTex("fr"), side: THREE.DoubleSide, color: 0xe0e0e0 }));
    m.position.set(hx - 23, TRIB + 3.6, hz + s * 2.6); m.rotation.y = -0.15 * s; root.add(m); wav.push({ m, w: 1.8, ph: s * 2 });
  }
  const g = new THREE.Group(); hall.build(g, false); root.add(g);
};
