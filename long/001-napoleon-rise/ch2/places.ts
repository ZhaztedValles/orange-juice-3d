// The static sets of chapter 2: Brienne (stone school, bare trees, gravel yard), Paris (the Ecole Militaire with its
// dome, the Champ de Mars with a battery and a target) and three interior sets (two classrooms, Napoleone's room).
// Everything here is built once; world.ts toggles the per-shot pieces (snow, fortress, windows, candle, cannon recoil).
import * as THREE from "three";
import { Batch, V, lam, quad, tri, boxGeo, prop, roofMat, setSightLines, Kit, Ray } from "../../../src/engine/build";
import { ctex, rep, facadeHD, stoneHD, planksHD, cobbleHD, grassHD, rng, beam } from "../../../src/engine/paint";
import { cannon, cannonballs } from "../shared/props";
import { P, PlaceId } from "./story";

const M4 = (x: number, y: number, z: number, yaw = 0) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
/** horizontal quad facing up over x0..x1, z0..z1 at height y (uv tiles of `tile` metres) */
export const ground = (x0: number, x1: number, z0: number, z1: number, y: number, tile: number) =>
  quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile);
/** cylinder between two points */
const rod = (a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, seg = 6) => {
  const g = new THREE.CylinderGeometry(r1, r0, a.distanceTo(b), seg, 1, true);
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()), V(1, 1, 1));
  return g.applyMatrix4(m);
};

// ---------------- painted textures ----------------
/** chalkboard: slate-green board with chalk scribbles (rows of squiggles, a triangle, a circle with radii): no digits */
const boardTex = (key: string, seed: number) => ctex("board" + key, 1024, 512, (g) => {
  const r = rng(seed);
  g.fillStyle = "#2f4a3e"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`; g.beginPath(); g.ellipse(r() * 1024, r() * 512, 40 + r() * 90, 20 + r() * 40, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(240,240,232,0.9)"; g.lineCap = "round"; g.lineJoin = "round";
  // rows of "sums": squiggle groups, a bar, a result squiggle
  for (let row = 0; row < 4; row++) {
    const y = 80 + row * 100;
    let x = 60;
    g.lineWidth = 6;
    for (let k = 0; k < 3; k++) {
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 6; s++) g.lineTo(x + s * 12 + 6, y + (s % 2 ? -22 : 10) * (0.6 + r() * 0.5));
      g.stroke(); x += 95;
      if (k < 2) { g.beginPath(); g.moveTo(x - 22, y - 6); g.lineTo(x - 6, y - 6); g.moveTo(x - 14, y - 14); g.lineTo(x - 14, y + 2); g.stroke(); }
    }
    g.beginPath(); g.moveTo(x - 10, y - 10); g.lineTo(x + 10, y - 10); g.moveTo(x - 10, y); g.lineTo(x + 10, y); g.stroke();
    g.beginPath(); g.moveTo(x + 30, y);
    for (let s = 0; s < 5; s++) g.lineTo(x + 30 + s * 12 + 6, y + (s % 2 ? -20 : 8));
    g.stroke();
  }
  g.lineWidth = 7;
  g.beginPath(); g.moveTo(640, 400); g.lineTo(900, 400); g.lineTo(700, 140); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(700, 140); g.lineTo(700, 400); g.stroke();
  g.beginPath(); g.arc(860, 170, 80, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(860, 170); g.lineTo(930, 130); g.moveTo(860, 170); g.lineTo(860, 250); g.stroke();
});
/** window glass: a pale winter sky with a bare branch (day) or a deep blue night with stars (night) */
const windowTex = (night: boolean) => ctex(night ? "winNight" : "winDay", 256, 384, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 384);
  if (night) { gr.addColorStop(0, "#26325f"); gr.addColorStop(1, "#3c4b80"); } else { gr.addColorStop(0, "#b9c6d6"); gr.addColorStop(1, "#dfe5ec"); }
  g.fillStyle = gr; g.fillRect(0, 0, 256, 384);
  if (night) {
    const r = rng(5);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,248,220,${0.5 + r() * 0.5})`; g.beginPath(); g.arc(r() * 256, r() * 300, 1.5 + r() * 2.5, 0, 7); g.fill(); }
    g.fillStyle = "#f6efd2"; g.beginPath(); g.arc(180, 80, 26, 0, 7); g.fill();
  } else {
    g.strokeStyle = "#5d5560"; g.lineCap = "round";
    g.lineWidth = 9; g.beginPath(); g.moveTo(256, 120); g.quadraticCurveTo(160, 140, 60, 90); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(150, 132); g.lineTo(110, 60); g.moveTo(100, 108); g.lineTo(60, 150); g.stroke();
  }
  // glazing bars
  g.fillStyle = "#f2ece0"; g.fillRect(122, 0, 12, 384); g.fillRect(0, 124, 256, 10); g.fillRect(0, 254, 256, 10);
});
/** a round target board: red and cream rings */
const targetTex = () => ctex("target", 256, 256, (g) => {
  g.fillStyle = "#c9a46a"; g.fillRect(0, 0, 256, 256);
  for (const [r, c] of [[118, "#f2ead6"], [92, "#c23a3a"], [66, "#f2ead6"], [40, "#c23a3a"], [16, "#f2ead6"]] as const) { g.fillStyle = c; g.beginPath(); g.arc(128, 128, r, 0, 7); g.fill(); }
});
/** a small slate on an easel: scribbled sums */
const slateTex = () => ctex("slateBoard", 512, 384, (g) => {
  g.fillStyle = "#3a3f46"; g.fillRect(0, 0, 512, 384);
  g.strokeStyle = "#8a6440"; g.lineWidth = 26; g.strokeRect(13, 13, 486, 358);
  g.strokeStyle = "rgba(240,240,232,0.92)"; g.lineWidth = 7; g.lineCap = "round";
  g.beginPath(); g.moveTo(80, 300); g.quadraticCurveTo(250, 40, 430, 300); g.stroke(); // a cannonball's arc
  g.beginPath(); g.arc(430, 300, 10, 0, 7); g.stroke();
  for (let row = 0; row < 2; row++) { const y = 90 + row * 60; g.beginPath(); g.moveTo(70, y); for (let s = 0; s < 8; s++) g.lineTo(80 + s * 14, y + (s % 2 ? -18 : 6)); g.stroke(); }
  g.beginPath(); g.moveTo(80, 300); g.lineTo(190, 300); g.moveTo(80, 300); g.lineTo(150, 220); g.stroke();
});

// ---------------- building block ----------------
/** a stone block: facade with windows on its front (local +z), sides, gable ends, slate roof, cornice and plinth */
const block = (b: Batch, m: THREE.Matrix4, w: number, d: number, h: number, key: string, wall: string, shutter: string, roofCol: string, door = true) => {
  const front = lam("bf" + key, () => ({ map: facadeHD("bf" + key, w, h, { wall, shutter, door }) }));
  const side = lam("bs" + key, () => ({ map: facadeHD("bs" + key, d, h, { wall, shutter }) }));
  const back = lam("bb" + key, () => ({ map: facadeHD("bb" + key, w, h, { wall, shutter }) }));
  const gab = lam("bg" + wall, () => ({ color: wall }));
  const hw = w / 2, hd = d / 2, rh = d * 0.38, o = 0.4;
  b.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), front, m);
  b.add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, h, -hd), V(hw, h, -hd)), back, m);
  b.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), side, m);
  b.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), side, m);
  b.add(tri(V(-hw, h, -hd), V(-hw, h, hd), V(-hw, h + rh, 0)), gab, m);
  b.add(tri(V(hw, h, hd), V(hw, h, -hd), V(hw, h + rh, 0)), gab, m);
  const rm = roofMat(roofCol), ru = (w + 2 * o) / 4, rv = Math.hypot(hd + o, rh) / 4;
  b.add(quad(V(-hw - o, h - 0.25, hd + o), V(hw + o, h - 0.25, hd + o), V(hw + o, h + rh, 0), V(-hw - o, h + rh, 0), ru, rv), rm, m);
  b.add(quad(V(hw + o, h - 0.25, -hd - o), V(-hw - o, h - 0.25, -hd - o), V(-hw - o, h + rh, 0), V(hw + o, h + rh, 0), ru, rv), rm, m);
  const trim = lam("trimStone", () => ({ color: "#efe3c8" })), plinth = lam("plinthHD", () => ({ map: stoneHD("copeHD") }));
  b.add(boxGeo(V(-hw - 0.15, h - 0.6, -hd - 0.15), V(hw + 0.15, h - 0.25, hd + 0.15), 2), trim, m);
  b.add(boxGeo(V(-hw - 0.08, -0.05, -hd - 0.08), V(hw + 0.08, 0.6, hd + 0.08), 2), plinth, m);
  // dormers' worth of chimneys along the ridge
  const chim = lam("chimStone", () => ({ color: "#b9ad98" }));
  for (let x = -hw + 6; x < hw - 3; x += 12) b.add(boxGeo(V(x - 0.5, h + rh * 0.4, -0.5), V(x + 0.5, h + rh + 1.3, 0.5), 2), chim, m);
  return { roofTop: h + rh, rh };
};
/** the same roof slopes again, 6 cm higher and white: snow lying on the roof (winter shots only) */
const snowRoof = (b: Batch, m: THREE.Matrix4, w: number, d: number, h: number, mat: THREE.Material) => {
  const hw = w / 2, hd = d / 2, rh = d * 0.38, o = 0.42, e = 0.08;
  b.add(quad(V(-hw - o, h - 0.25 + e, hd + o), V(hw + o, h - 0.25 + e, hd + o), V(hw + o, h + rh + e, 0), V(-hw - o, h + rh + e, 0)), mat, m);
  b.add(quad(V(hw + o, h - 0.25 + e, -hd - o), V(-hw - o, h - 0.25 + e, -hd - o), V(-hw - o, h + rh + e, 0), V(hw + o, h + rh + e, 0)), mat, m);
};

/** a bare winter tree: trunk + three orders of branches as tapered rods (inked by the world ink pass) */
const bareTree = (b: Batch, mat: THREE.Material, x: number, y: number, z: number, h: number, seed: number) => {
  const r = rng(seed), base = V(x, y, z), top = V(x + (r() - 0.5) * 0.4, y + 0.42 * h, z + (r() - 0.5) * 0.4), rt = 0.026 * h;
  b.add(rod(base, top, rt, rt * 0.7, 7), mat);
  const grow = (from: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, depth: number) => {
    const end = from.clone().addScaledVector(dir, len);
    b.add(rod(from, end, rad, rad * 0.62, 5), mat);
    if (depth === 0) return;
    const n = depth === 2 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, tilt = 0.35 + r() * 0.4;
      const d = dir.clone().multiplyScalar(1.2).add(V(Math.cos(a) * tilt, 0.25 + r() * 0.3, Math.sin(a) * tilt)).normalize();
      grow(end, d, len * (0.6 + r() * 0.15), rad * 0.6, depth - 1);
    }
  };
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + r(), d = V(Math.cos(a) * 0.55, 1, Math.sin(a) * 0.55).normalize();
    grow(top, d, 0.28 * h, rt * 0.62, 2);
  }
};

// ---------------- per-shot dynamic pieces, built here and posed by world.ts ----------------
export type Sets = {
  groundBrienne: THREE.Mesh[]; snowPieces: THREE.Object3D[]; fortress: THREE.Group;
  winDay: THREE.Object3D[]; winNight: THREE.Object3D[]; candle: THREE.Vector3;
  guns: THREE.Group[]; target: THREE.Vector3;
};

export const buildSets = (root: THREE.Object3D, kit: Kit, rays: Ray[]): Sets => {
  const b = new Batch(), r = rng(21);
  setSightLines(rays);
  const sets: Sets = { groundBrienne: [], snowPieces: [], fortress: new THREE.Group(), winDay: [], winNight: [], candle: V(0, 0, 0), guns: [], target: V(0, 0, 0) };
  const snowM = lam("snowGround", () => ({ color: "#dfe5ee" }));
  const snowB = new Batch();

  // ================= BRIENNE =================
  const gravel = lam("gravelHD", () => ({ map: cobbleHD(), color: "#c9bfae" }));
  const field = lam("dullGrass", () => ({ map: grassHD(), color: "#b9b48f" }));
  const bx = (x: number) => x, bz = (z: number) => z;
  for (const [x0, x1, z0, z1, m, tile] of [
    [-60, 60, -45, 45, gravel, 2.6], [-900, -60, -900, 900, field, 8], [60, 900, -900, 900, field, 8],
    [-60, 60, -900, -45, field, 8], [-60, 60, 45, 900, field, 8],
  ] as const) {
    const mesh = new THREE.Mesh(ground(bx(x0), bx(x1), bz(z0), bz(z1), 0, tile), m);
    mesh.receiveShadow = true; mesh.userData.base = m;
    sets.groundBrienne.push(mesh); root.add(mesh);
  }
  // the school: a long three-storey stone range (front z = 30) and two wings framing the yard
  const STONE = "#d8ccb2", SHUT = "#4d5d72", SLATE = "#8f97a8";
  block(b, M4(0, 0, 37, Math.PI), 84, 14, 11.2, "brMain", STONE, SHUT, SLATE);
  snowRoof(snowB, M4(0, 0, 37, Math.PI), 84, 14, 11.2, snowM);
  // centre pavilion with a pediment and a small belfry
  block(b, M4(0, 0, 35.5, Math.PI), 14, 12, 13.4, "brPav", "#e1d6be", SHUT, SLATE);
  snowRoof(snowB, M4(0, 0, 35.5, Math.PI), 14, 12, 13.4, snowM);
  const peM = lam("pediment", () => ({ color: "#e9dfc9" }));
  b.add(tri(V(7.3, 13.4, 29.4), V(-7.3, 13.4, 29.4), V(0, 16.2, 29.4)), peM);
  b.add(boxGeo(V(-1.1, 16.8, 34.4), V(1.1, 19.6, 36.6), 2), lam("belfry", () => ({ color: "#d9cdb4" })));
  const cone = new THREE.ConeGeometry(1.7, 2.6, 4); cone.rotateY(Math.PI / 4);
  b.add(cone, roofMat(SLATE), M4(0, 19.6 + 1.3, 35.5));
  for (const s of [-1, 1]) {
    block(b, M4(s * 49, 0, 12, s < 0 ? Math.PI / 2 : -Math.PI / 2), 34, 12, 8.4, "brWing", STONE, SHUT, SLATE, false);
    snowRoof(snowB, M4(s * 49, 0, 12, s < 0 ? Math.PI / 2 : -Math.PI / 2), 34, 12, 8.4, snowM);
  }
  // yard wall with gate piers at the front (z = -45)
  const wallM = lam("yardWall", () => ({ map: stoneHD("yardWallHD", ["#cbbfa6", "#c2b59b", "#d2c6ad", "#b9ad94"]) }));
  for (const [x0, x1] of [[-60, -5], [5, 60]]) b.add(boxGeo(V(x0, 0, -45.4), V(x1, 2.2, -44.8), 2), wallM);
  for (const s of [-1, 1]) {
    b.add(boxGeo(V(s * 5 - 0.6, 0, -45.7), V(s * 5 + 0.6, 3.4, -44.5), 2), wallM);
    b.add(new THREE.SphereGeometry(0.55, 12, 8), lam("pierBall", () => ({ color: "#d9cdb4" })), M4(s * 5, 3.95, -45.1));
  }
  // bare trees: two rows down the yard, a row behind the wall, scattered fields beyond
  const barkM = lam("bark", () => ({ color: "#8a6a4e" }));
  for (let z = -38; z <= 22; z += 7.5) for (const x of [-30, 30]) bareTree(b, barkM, x + (r() - 0.5), 0, z + (r() - 0.5), 8.5 + r() * 2.5, Math.floor(r() * 1e6));
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, d = 75 + r() * 160, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > 20 && Math.abs(x) < 70) continue;
    bareTree(b, barkM, x, 0, z, 9 + r() * 5, Math.floor(r() * 1e6));
  }
  bareTree(b, barkM, -24.0, 0, 7.0, 9.5, 4242); // Napoleone's reading tree (shot 6)
  // low grey hills on the horizon
  const hill = new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const hillM = lam("hillWinter", () => ({ color: "#8f9a78" }));
  for (const [x, z, sx, sy, sz] of [[-320, 380, 260, 40, 120], [240, 420, 300, 46, 130], [520, 60, 160, 34, 200], [-520, -120, 200, 36, 200], [80, -480, 300, 40, 120]] as const)
    b.add(hill, hillM, new THREE.Matrix4().compose(V(x, -2, z), new THREE.Quaternion(), V(sx, sy, sz)));
  // snow fortress in the yard (winter shots; world.ts raises it on "built a fortress of snow")
  {
    const g = sets.fortress, fm = lam("snowBlock", () => ({ color: "#f3f5f9" }));
    const add = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
      const m = new THREE.Mesh(boxGeo(V(x0, y0, z0), V(x1, y1, z1)), fm); m.castShadow = true; m.receiveShadow = true; g.add(m);
    };
    add(-4.2, 0, -5.3, 4.2, 1.05, -4.7);   // front wall (toward the gate)
    add(-4.2, 0, 1.7, 4.2, 1.05, 2.3);     // back wall
    for (const s of [-1, 1]) add(s * 4.2 - 0.3, 0, -5.3, s * 4.2 + 0.3, 1.05, 2.3);
    for (let x = -3.9; x <= 3.95; x += 1.3) add(x - 0.28, 1.05, -5.3, x + 0.28, 1.4, -4.7); // crenels
    for (const s of [-1, 1]) add(s * 4.2 - 0.45, 0, -5.45, s * 4.2 + 0.45, 1.75, -4.55);   // corner towers
    add(-1.2, 0, -3.4, 1.2, 0.55, -2.2);   // the commander's step
    const balls = new THREE.SphereGeometry(0.11, 8, 6);
    for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(balls, fm); m.position.set(-2.6 + (i % 7) * 0.22 + (i > 6 ? 0.11 : 0), 0.1 + (i > 6 ? 0.17 : 0), -3.9); g.add(m); }
    g.position.set(0, 0, 0); g.visible = false;
    root.add(g);
  }

  // ================= PARIS =================
  const pa = (x: number, z: number) => [x + 2000, z] as const;
  const grass = lam("parisGrass", () => ({ map: grassHD(), color: "#c8cba2" }));
  const sand = lam("parade", () => ({ map: cobbleHD(), color: "#e7d6b0" }));
  for (const [x0, x1, z0, z1, m, tile] of [
    [-900, 900, -900, -10, grass, 8], [-900, -14, -10, 40, grass, 8], [14, 900, -10, 40, grass, 8], [-14, 14, -10, 40, sand, 6],
    [-900, -60, 40, 900, grass, 8], [60, 900, 40, 900, grass, 8], [-60, 60, 40, 76, sand, 6], [-60, 60, 76, 900, grass, 8],
  ] as const) {
    const [ax0] = pa(x0, 0), [ax1] = pa(x1, 0);
    b.add(ground(ax0, ax1, z0, z1, 0, tile), m);
  }
  // the Ecole Militaire: two long wings, a centre pavilion with columns, pediment and the square-based dome
  const ECRU = "#eae0c8", ESH = "#5f7088", EROOF = "#8f97a8";
  for (const s of [-1, 1]) block(b, M4(2000 + s * 27, 0, 67, Math.PI), 38, 14, 12.6, "ecWing", ECRU, ESH, EROOF);
  block(b, M4(2000, 0, 66, Math.PI), 16, 16, 16, "ecPav", "#efe6d0", ESH, EROOF, true);
  const colM = lam("column", () => ({ color: "#f3ead6" }));
  b.add(boxGeo(V(1991, 0, 56.4), V(2009, 1.0, 58.4), 2), lam("plinthHD", () => ({ map: stoneHD("copeHD") })));
  for (let i = 0; i < 8; i++) {
    const x = 1992.2 + (i * 15.6) / 7;
    b.add(new THREE.CylinderGeometry(0.42, 0.48, 11.6, 14), colM, M4(x, 1.0 + 5.8, 57.3));
    b.add(boxGeo(V(x - 0.62, 12.6, 56.7), V(x + 0.62, 13.0, 57.9)), colM);
  }
  b.add(boxGeo(V(1991.3, 13.0, 56.6), V(2008.7, 14.4, 58.1), 2), lam("entabl", () => ({ color: "#efe5cf" })));
  b.add(tri(V(2008.7, 14.4, 56.8), V(1991.3, 14.4, 56.8), V(2000, 17.6, 56.8)), peM);
  b.add(quad(V(2000, 17.65, 56.6), V(1991.0, 14.4, 56.6), V(1991.0, 14.4, 59), V(2000, 17.65, 59)), roofMat(EROOF));
  b.add(quad(V(2009.0, 14.4, 56.6), V(2000, 17.65, 56.6), V(2000, 17.65, 59), V(2009.0, 14.4, 59)), roofMat(EROOF));
  b.add(boxGeo(V(1994.5, 16, 61), V(2005.5, 20.5, 72), 2), lam("drum", () => ({ color: "#e9dfc7" })));
  const dome = new THREE.SphereGeometry(1, 4, 10, Math.PI / 4, Math.PI * 2, 0, Math.PI / 2);
  b.add(dome, roofMat(EROOF), new THREE.Matrix4().compose(V(2000, 20.5, 66.5), new THREE.Quaternion(), V(7.6, 7.2, 7.6)));
  b.add(new THREE.CylinderGeometry(0.9, 1.1, 2.4, 10), lam("lantern", () => ({ color: "#e9dfc7" })), M4(2000, 28.6, 66.5));
  b.add(new THREE.SphereGeometry(0.55, 12, 8), lam("goldBall", () => ({ color: "#d9a93a" })), M4(2000, 30.3, 66.5));
  // tree avenues along the field
  const leafy = ["tree_default", "tree-high-round", "tree_oak"];
  for (let z = -90; z <= 30; z += 9) for (const x of [-34, -26, 26, 34]) prop(b, kit, leafy[Math.floor(r() * 3)], 2000 + x + (r() - 0.5), 0, z, 8 + r() * 2, r() * 6);
  for (let i = 0; i < 50; i++) {
    const x = (r() - 0.5) * 700, z = -120 - r() * 300;
    prop(b, kit, leafy[Math.floor(r() * 3)], 2000 + x, 0, z, 9 + r() * 4, r() * 6);
  }
  // distant Paris roofs behind the avenues
  for (let i = 0; i < 26; i++) {
    const s = i % 2 ? 1 : -1, x = 2000 + s * (60 + r() * 120), z = -60 + r() * 140;
    block(b, M4(x, 0, z, s > 0 ? -Math.PI / 2 : Math.PI / 2), 14 + Math.floor(r() * 3) * 4, 10, 9.8 + Math.floor(r() * 3) * 2.8, `pr${i % 4}`,
      ["#e3d6bb", "#d9c6a4", "#e8dcc4", "#d2bfa0"][i % 4], "#5f7088", "#8f97a8", false);
  }
  // the battery: three guns facing down-range (-z), shot piles, the target, the easel with the slate
  for (const [x, i] of [[-6, 0], [0, 1], [6, 2]] as const) {
    const gun = cannon({ elev: 4 }); gun.rotation.y = Math.PI / 2; gun.position.set(2000 + x, 0, 0);
    gun.userData.home = gun.position.clone(); gun.userData.i = i;
    sets.guns.push(gun); root.add(gun);
    const pile = cannonballs(3); pile.position.set(2000 + x - 1.6, 0, 1.6); root.add(pile);
  }
  const wood = lam("woodBeam", () => ({ map: beam() }));
  const tgt = V(2000, 1.7, -45);
  b.add(quad(V(tgt.x - 1.5, tgt.y - 1.5, tgt.z), V(tgt.x + 1.5, tgt.y - 1.5, tgt.z), V(tgt.x + 1.5, tgt.y + 1.5, tgt.z), V(tgt.x - 1.5, tgt.y + 1.5, tgt.z)),
    lam("target", () => ({ map: targetTex(), side: THREE.DoubleSide })));
  for (const s of [-1, 1]) b.add(boxGeo(V(tgt.x + s * 1.3 - 0.1, 0, tgt.z + 0.02), V(tgt.x + s * 1.3 + 0.1, 3.1, tgt.z + 0.22)), wood);
  sets.target = tgt;
  // easel + slate beside the middle gun
  const ez = 2.2, ex = 2000 + 3.0;
  b.add(quad(V(ex + 0.55, 1.0, ez), V(ex - 0.55, 1.0, ez), V(ex - 0.55, 1.82, ez), V(ex + 0.55, 1.82, ez)), lam("slate", () => ({ map: slateTex() })));
  for (const s of [-1, 1]) b.add(rod(V(ex + s * 0.45, 0, ez + 0.25), V(ex + s * 0.38, 1.95, ez - 0.05), 0.035, 0.03), wood);
  b.add(rod(V(ex, 0, ez + 0.75), V(ex, 1.8, ez + 0.05), 0.03, 0.03), wood);
  b.add(boxGeo(V(ex - 0.6, 0.94, ez - 0.12), V(ex + 0.6, 1.0, ez + 0.06)), wood);

  // ================= INTERIORS (no shadow casting: the sun lights the open-topped sets) =================
  const ib = new Batch();
  const floorM = lam("floorHD", () => ({ map: rep(planksHD(), 1, 1) }));
  const woodM = lam("furniture", () => ({ color: "#8a5a36" }));
  const darkWood = lam("furnDark", () => ({ color: "#5e3d28" }));
  /** an open-fronted room (the camera side, z < -d/2, has no wall): floor, three walls, wainscot, window(s) */
  const room = (pl: PlaceId, w: number, d: number, h: number, wall: string, wins: [number, number][]) => {
    const o = P(pl, 0, 0, 0), hw = w / 2, hd = d / 2, ox = o[0], oz = o[2];
    const wallM = lam("wall" + pl, () => ({ color: wall }));
    const wain = lam("wain" + pl, () => ({ color: "#7a5236" }));
    ib.add(ground(ox - hw - 0.3, ox + hw + 0.3, oz - hd - 4, oz + hd, 0, 2.5), floorM);
    ib.add(quad(V(ox - hw, 0, oz + hd), V(ox + hw, 0, oz + hd), V(ox + hw, h, oz + hd), V(ox - hw, h, oz + hd)).rotateY(0), wallM); // back wall faces -z? (quad winding below)
    ib.add(quad(V(ox + hw, 0, oz + hd), V(ox - hw, 0, oz + hd), V(ox - hw, h, oz + hd), V(ox + hw, h, oz + hd)), wallM);
    ib.add(quad(V(ox - hw, 0, oz - hd - 4), V(ox - hw, 0, oz + hd), V(ox - hw, h, oz + hd), V(ox - hw, h, oz - hd - 4)).rotateY(0), wallM);
    ib.add(quad(V(ox - hw, 0, oz + hd), V(ox - hw, 0, oz - hd - 4), V(ox - hw, h, oz - hd - 4), V(ox - hw, h, oz + hd)), wallM);
    ib.add(quad(V(ox + hw, 0, oz + hd), V(ox + hw, 0, oz - hd - 4), V(ox + hw, h, oz - hd - 4), V(ox + hw, h, oz + hd)), wallM);
    ib.add(quad(V(ox + hw, 0, oz - hd - 4), V(ox + hw, 0, oz + hd), V(ox + hw, h, oz + hd), V(ox + hw, h, oz - hd - 4)), wallM);
    // ceiling beams over the top (keeps the sky out of upward views)
    ib.add(quad(V(ox - hw, h, oz + hd), V(ox + hw, h, oz + hd), V(ox + hw, h, oz - hd - 4), V(ox - hw, h, oz - hd - 4)), lam("ceil" + pl, () => ({ color: "#d9cbb0" })));
    ib.add(quad(V(ox - hw, h, oz - hd - 4), V(ox + hw, h, oz - hd - 4), V(ox + hw, h, oz + hd), V(ox - hw, h, oz + hd)), lam("ceil" + pl, () => ({ color: "#d9cbb0" })));
    for (let z = oz - hd - 3.5; z < oz + hd; z += 1.4) ib.add(boxGeo(V(ox - hw, h - 0.28, z - 0.12), V(ox + hw, h, z + 0.12)), darkWood);
    // wainscot 0.95 m
    ib.add(boxGeo(V(ox - hw, 0, oz + hd - 0.06), V(ox + hw, 0.95, oz + hd)), wain);
    ib.add(boxGeo(V(ox - hw, 0, oz - hd - 4), V(ox - hw + 0.06, 0.95, oz + hd)), wain);
    ib.add(boxGeo(V(ox + hw - 0.06, 0, oz - hd - 4), V(ox + hw, 0.95, oz + hd)), wain);
    // windows on the back wall: painted glass (unlit) in a deep frame
    for (const [wx, ww] of wins) {
      const x = ox + wx, y0 = 1.15, y1 = 1.15 + ww * 1.5, z = oz + hd - 0.07;
      for (const night of [false, true]) {
        const g = new THREE.Mesh(quad(V(x + ww / 2, y0, z), V(x - ww / 2, y0, z), V(x - ww / 2, y1, z), V(x + ww / 2, y1, z)),
          new THREE.MeshBasicMaterial({ map: windowTex(night), fog: false }));
        g.visible = false; root.add(g);
        (night ? sets.winNight : sets.winDay).push(g);
      }
      const fr = lam("winFrame", () => ({ color: "#ece4d2" }));
      ib.add(boxGeo(V(x - ww / 2 - 0.12, y0 - 0.14, z - 0.16), V(x + ww / 2 + 0.12, y0, z + 0.05)), fr);
      ib.add(boxGeo(V(x - ww / 2 - 0.12, y1, z - 0.12), V(x + ww / 2 + 0.12, y1 + 0.12, z + 0.05)), fr);
      for (const s of [-1, 1]) ib.add(boxGeo(V(x + s * (ww / 2 + 0.06) - 0.06, y0, z - 0.12), V(x + s * (ww / 2 + 0.06) + 0.06, y1, z + 0.05)), fr);
    }
  };
  const desk = (x: number, z: number, w: number, d: number, hgt: number, m = woodM) => {
    ib.add(boxGeo(V(x - w / 2, hgt - 0.06, z - d / 2), V(x + w / 2, hgt, z + d / 2)), m);
    ib.add(boxGeo(V(x - w / 2, 0.12, z - d / 2 + 0.03), V(x + w / 2, hgt - 0.06, z - d / 2 + 0.08)), m); // modesty panel toward -z
    for (const sx of [-1, 1]) ib.add(boxGeo(V(x + sx * (w / 2 - 0.05) - 0.04, 0, z - d / 2 + 0.02), V(x + sx * (w / 2 - 0.05) + 0.04, hgt - 0.06, z + d / 2 - 0.02)), m);
  };
  const bench = (x: number, z: number, w: number) => {
    ib.add(boxGeo(V(x - w / 2, 0.38, z - 0.17), V(x + w / 2, 0.44, z + 0.17)), darkWood);
    for (const sx of [-1, 1]) ib.add(boxGeo(V(x + sx * (w / 2 - 0.1) - 0.04, 0, z - 0.14), V(x + sx * (w / 2 - 0.1) + 0.04, 0.38, z + 0.14)), darkWood);
  };
  const board = (pl: PlaceId, x: number, w: number, d: number, key: string, seed: number) => {
    const o = P(pl, x, 0, d / 2 - 0.05);
    ib.add(quad(V(o[0] + w / 2, 0.95, o[2]), V(o[0] - w / 2, 0.95, o[2]), V(o[0] - w / 2, 0.95 + w / 2, o[2]), V(o[0] + w / 2, 0.95 + w / 2, o[2])), lam("board" + key, () => ({ map: boardTex(key, seed) })));
    ib.add(boxGeo(V(o[0] - w / 2 - 0.1, 0.85, o[2] - 0.1), V(o[0] + w / 2 + 0.1, 0.95, o[2] + 0.02)), darkWood);
    ib.add(boxGeo(V(o[0] - w / 2 - 0.1, 0.95 + w / 2, o[2] - 0.06), V(o[0] + w / 2 + 0.1, 1.05 + w / 2, o[2] + 0.02)), darkWood);
  };
  // Autun: cream walls, board on the back wall, two rows of desks with benches behind them
  room("classA", 12, 9, 4.4, "#e6d7b6", [[-4.3, 1.1], [4.3, 1.1]]);
  board("classA", 0, 3.6, 9, "A", 3);
  { const o = P("classA", 0, 0, 0); for (const z of [0.4, -1.4]) for (const x of [-2.6, 0, 2.6]) { desk(o[0] + x, o[2] + z - 0.45, 2.2, 0.5, 0.74); bench(o[0] + x, o[2] + z + 0.1, 2.1); }
    desk(o[0] + 3.4, o[2] + 2.9, 1.5, 0.75, 0.82, darkWood); }
  // Brienne classroom: pale grey-green walls, bigger board
  room("classB", 12, 9, 4.6, "#cdd3c2", [[-4.4, 1.2], [4.6, 1.2]]);
  board("classB", 0.6, 4.2, 9, "B", 8);
  { const o = P("classB", 0, 0, 0); for (const [x, z] of [[-4.2, 0.6], [3.9, 0.6], [-4.2, -1.3], [3.9, -1.3]] as const) { desk(o[0] + x, o[2] + z - 0.45, 2.0, 0.5, 0.74); bench(o[0] + x, o[2] + z + 0.1, 1.9); } }
  // Napoleone's room: plain plaster, one window, bed, desk + chair, shelf of books, candle
  room("room", 6.4, 5, 4.0, "#dccaa6", [[1.4, 1.0]]);
  {
    const o = P("room", 0, 0, 0), ox = o[0], oz = o[2];
    // bed along the left wall
    ib.add(boxGeo(V(ox - 3.15, 0, oz - 0.5), V(ox - 2.15, 0.42, oz + 1.6)), darkWood);
    ib.add(boxGeo(V(ox - 3.12, 0.42, oz - 0.47), V(ox - 2.18, 0.56, oz + 1.57)), lam("blanket", () => ({ color: "#8c4a3c" })));
    ib.add(boxGeo(V(ox - 3.05, 0.56, oz + 1.12), V(ox - 2.25, 0.7, oz + 1.5)), lam("pillow", () => ({ color: "#efe8d8" })));
    ib.add(boxGeo(V(ox - 3.15, 0, oz + 1.55), V(ox - 2.15, 0.95, oz + 1.65)), darkWood);
    // desk against the back wall, a stool behind it (the sitter faces the room)
    desk(ox - 1.15, oz + 1.45, 1.4, 0.62, 0.78);
    ib.add(boxGeo(V(ox - 1.4, 0.4, oz + 1.9), V(ox - 0.9, 0.46, oz + 2.3)), darkWood);
    // papers, books on the desk, a shelf of books on the wall
    ib.add(boxGeo(V(ox - 1.45, 0.78, oz + 1.25), V(ox - 1.05, 0.79, oz + 1.55)), lam("paper", () => ({ color: "#f4efe2" })));
    const bookCols = ["#8c3b3b", "#2f5a6a", "#6a5a2a", "#4a3a6a", "#7a4a2a", "#2f5f3f"];
    for (let i = 0; i < 4; i++) ib.add(boxGeo(V(ox - 1.8, 0.78 + i * 0.07, oz + 1.3 - 0.02 * i), V(ox - 1.5 + 0.02 * i, 0.85 + i * 0.07, oz + 1.62)), lam("book" + i, () => ({ color: bookCols[i] })));
    ib.add(boxGeo(V(ox - 2.1, 1.9, oz + 2.25), V(ox - 0.2, 1.95, oz + 2.5)), darkWood);
    for (let i = 0; i < 12; i++) { const x = ox - 2.05 + i * 0.15, hgt = 0.26 + ((i * 7) % 4) * 0.03; ib.add(boxGeo(V(x, 1.95, oz + 2.28), V(x + 0.12, 1.95 + hgt, oz + 2.48)), lam("book" + (i % 6), () => ({ color: bookCols[i % 6] }))); }
    // candle in a brass holder on the desk (flame + glow in world.ts)
    ib.add(new THREE.CylinderGeometry(0.07, 0.09, 0.03, 12), lam("brass", () => ({ color: "#c9a14a" })), M4(ox - 0.7, 0.795, oz + 1.4));
    ib.add(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 10), lam("wax", () => ({ color: "#f3ecd8" })), M4(ox - 0.7, 0.91, oz + 1.4));
    sets.candle.set(ox - 0.7, 1.05, oz + 1.4);
  }

  ib.build(root, false);
  b.build(root);
  snowB.build(root);
  // the snow layer is its own group of meshes so world.ts can show it in winter shots only
  for (let i = root.children.length - 1; i >= 0; i--) {
    const c = root.children[i] as THREE.Mesh;
    if (c.isMesh && c.material === snowM && !sets.groundBrienne.includes(c)) { sets.snowPieces.push(c); c.visible = false; }
  }
  setSightLines([]);
  return sets;
};

