// The places of the pearl story: the London street (cobbled road with stone gutters, raised pavements, terraced
// houses both sides, lanterns, the post counter, the gang's table, the café table, the station building and the
// reward poster), Mayer's office (an open set: plank floor, panelled back wall with a window, the desk), the Paris
// street (cream houses round a small paved square) and the home garden (a cottage, a table on the grass). The ground
// is laid in abutting pieces, never stacked; the raised floors are boxes standing on the grass. The cast and the drawn
// props (parcel, sugar, pearls, matchbox) live in cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, cobbleHD, grassHD, stoneHD, planksHD } from "../../src/engine/paint";
import { D0, RW, PW, PY, COUNTER, DEN, CAFE, STATION, POSTER, OFF, DESK_Y, PAR, HOME } from "./story";

/** the reward poster: a cream sheet with a drawn string of pearls and a pile of gold coins (no lettering) */
const posterTex = () => ctex("poster022", 256, 360, (g) => {
  g.fillStyle = "#efe2c0"; g.fillRect(0, 0, 256, 360);
  g.strokeStyle = "#3a2a20"; g.lineWidth = 8; g.strokeRect(8, 8, 240, 344);
  g.fillStyle = "#b8322c"; g.fillRect(30, 30, 196, 26);
  for (let i = 0; i < 15; i++) {
    const a = Math.PI * (0.08 + 0.84 * (i / 14)), x = 128 - 80 * Math.cos(a), y = 90 + 90 * Math.sin(a);
    g.fillStyle = "#f6dcd6"; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.lineWidth = 3; g.stroke();
  }
  for (let i = 0; i < 6; i++) {
    g.fillStyle = "#e0b040"; g.beginPath(); g.ellipse(80 + (i % 3) * 48, 300 - Math.floor(i / 3) * 22, 22, 9, 0, 0, 7); g.fill(); g.lineWidth = 3; g.stroke();
  }
  g.fillStyle = "#3a2a20"; g.fillRect(40, 236, 176, 6);
});
/** office wall: dark wood panelling below, deep green paper above, a picture rail */
const wallTex = () => ctex("offWall022", 512, 256, (g) => {
  g.fillStyle = "#3f5a46"; g.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = "#466350"; g.fillRect(x, 0, 14, 150); }
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

/** the street runs x in [-SX, SX] */
export const SX = 170;
export const PARY = D0 + 0.12;

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1022);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const grass = lam("grassHD", () => ({ map: grassHD() }));
  const cob = lam("cobbleHD", () => ({ map: cobbleHD() }));
  const flag = lam("flag022", () => ({ map: stoneHD("flag022", ["#c9bfae", "#bdb3a2", "#d2c8b6", "#b5ab9a"], "#8a8070") }));
  const gutter = lam("gutter022", () => ({ map: stoneHD("gutter022", ["#7d776e", "#736d65", "#857f75"], "#4a4640") }));
  const wood = lam("planks022", () => ({ map: planksHD() }));
  const dark = lam("deskWood022", () => ({ color: "#5a3826" }));
  const leg = lam("leg022", () => ({ color: "#4a3022" }));
  const cloth = lam("cloth022", () => ({ color: "#2f5a48" }));
  const wallM = lam("offWall022", () => ({ map: wallTex() }));
  const frame = lam("frame022", () => ({ color: "#4a2e1e" }));
  const glass = new THREE.MeshBasicMaterial({ color: "#cfe2f2" });
  const poster = new THREE.MeshBasicMaterial({ map: posterTex() });
  const red = lam("station022", () => ({ color: "#9a3a30" }));
  const cream = lam("stationBand022", () => ({ color: "#e8dcc0" }));
  const hole = lam("stationDoor022", () => ({ color: "#2a2228" }));
  const counter = lam("counter022", () => ({ color: "#6a4630" }));

  setSightLines([]);
  // ---- ground (abutting, never stacked): the road with its two gutters, the pavements (boxes), grass all round ----
  b.add(flat(-SX, SX, -RW + 0.35, RW - 0.35, D0, 2.5, 80, 6), cob);
  b.add(flat(-SX, SX, -RW, -RW + 0.35, D0, 1.2, 80, 1), gutter);
  b.add(flat(-SX, SX, RW - 0.35, RW, D0, 1.2, 80, 1), gutter);
  b.add(boxGeo(V(-SX, D0 - 0.4, -PW), V(SX, PY, -RW), 1.6), flag);
  b.add(boxGeo(V(-SX, D0 - 0.4, RW), V(SX, PY, PW), 1.6), flag);
  b.add(flat(-900, 900, -900, -PW, D0, 4, 60, 40), grass);
  b.add(flat(-900, 900, PW, 900, D0, 4, 60, 40), grass);
  b.add(flat(-900, -SX, -PW, PW, D0, 4, 30, 2), grass);
  b.add(flat(SX, 900, -PW, PW, D0, 4, 30, 2), grass);
  // ---- the post counter (north pavement) ----
  b.add(boxGeo(V(COUNTER[0] - 1.3, PY, COUNTER[2] - 0.35), V(COUNTER[0] + 1.3, PY + 1.05, COUNTER[2] + 0.25), 1), counter);
  b.add(boxGeo(V(COUNTER[0] - 1.4, PY + 1.05, COUNTER[2] - 0.4), V(COUNTER[0] + 1.4, PY + 1.12, COUNTER[2] + 0.32), 1), wood);
  // ---- the gang's table at their doorway, the café table ----
  table(b, wood, leg, DEN[0] + 0.1, PY, DEN[2] - 0.75, 1.3, 0.7);
  table(b, wood, leg, CAFE[0] + 0.4, PY, CAFE[2] - 0.3, 1.1, 0.8, 0.8);
  // ---- the station: a red-tiled hall with a cream band and a dark entrance ----
  const [SXs, , SZ] = STATION;
  b.add(boxGeo(V(SXs - 6, PY, -PW - 9), V(SXs - 1.6, PY + 6, -PW), 2), red);
  b.add(boxGeo(V(SXs + 1.6, PY, -PW - 9), V(SXs + 6, PY + 6, -PW), 2), red);
  b.add(boxGeo(V(SXs - 1.6, PY + 3.4, -PW - 9), V(SXs + 1.6, PY + 6, -PW), 2), red);
  b.add(boxGeo(V(SXs - 1.6, PY, -PW - 9), V(SXs + 1.6, PY + 3.4, -PW - 0.6), 1), hole);
  b.add(boxGeo(V(SXs - 6.1, PY + 3.6, -PW - 0.05), V(SXs + 6.1, PY + 4.2, -PW + 0.12), 1), cream);
  b.add(boxGeo(V(SXs - 6.2, PY + 6, -PW - 9.1), V(SXs + 6.2, PY + 6.35, -PW + 0.15), 1), cream);
  void SZ;
  // the reward poster on the wall (unlit, so a side sun never greys it)
  b.add(new THREE.PlaneGeometry(1.0, 1.4), poster, new THREE.Matrix4().makeTranslation(POSTER[0], PY + 1.75, -PW + 0.1));
  // ---- Mayer's office: plank floor, panelled back wall with a window, the desk ----
  const [OX, , OZ] = OFF;
  b.add(boxGeo(V(OX - 4.5, D0 - 0.3, OZ - 2.6), V(OX + 4.5, D0 + 0.12, OZ + 4.5), 1.2), wood);
  b.add(boxGeo(V(OX - 4.5, D0 + 0.12, OZ - 2.8), V(OX + 4.5, D0 + 3.4, OZ - 2.6), 3.2), wallM);
  b.add(boxGeo(V(OX - 4.7, D0 + 0.12, OZ - 2.8), V(OX - 4.5, D0 + 3.4, OZ + 0.5), 3.2), wallM);
  b.add(boxGeo(V(OX + 1.2, D0 + 1.3, OZ - 2.62), V(OX + 2.8, D0 + 2.9, OZ - 2.55), 1), frame);
  b.add(boxGeo(V(OX + 1.3, D0 + 1.4, OZ - 2.55), V(OX + 2.7, D0 + 2.8, OZ - 2.5), 1), glass);
  b.add(boxGeo(V(OX + 1.96, D0 + 1.4, OZ - 2.5), V(OX + 2.04, D0 + 2.8, OZ - 2.46), 1), frame);
  b.add(boxGeo(V(OX - 2.6, D0 + 1.6, OZ - 2.6), V(OX - 1.4, D0 + 2.5, OZ - 2.52), 1), frame);
  b.add(boxGeo(V(OX - 2.5, D0 + 1.7, OZ - 2.52), V(OX - 1.5, D0 + 2.4, OZ - 2.48), 1), cloth);
  b.add(boxGeo(V(OX - 1.0, DESK_Y - 0.08, OZ - 0.5), V(OX + 1.0, DESK_Y, OZ + 0.5), 1), dark);
  b.add(boxGeo(V(OX - 0.95, D0 + 0.12, OZ + 0.32), V(OX + 0.95, DESK_Y - 0.08, OZ + 0.42), 1), dark);
  for (const s of [-1, 1]) b.add(boxGeo(V(OX + s * 0.95 - 0.08, D0 + 0.12, OZ - 0.45), V(OX + s * 0.95 + 0.08, DESK_Y - 0.08, OZ + 0.42), 1), dark);
  b.add(boxGeo(V(OX - 0.85, DESK_Y, OZ - 0.35), V(OX - 0.35, DESK_Y + 0.015, OZ + 0.2), 1), cloth);
  // ---- the Paris square: paving on a low box, cream houses on three sides ----
  const [AX, , AZ] = PAR;
  b.add(boxGeo(V(AX - 30, D0 - 0.3, AZ - 6), V(AX + 30, PARY, AZ + 14), 1.6), flag);
  // ---- the home garden: the table on the grass ----
  const [HX, , HZ] = HOME;
  table(b, wood, leg, HX, D0, HZ - 0.4, 1.4, 0.8, 0.78);

  setSightLines(rays);
  // the London street: terraces on both sides (brick and ochre plaster), a gap for the station
  const LONDON = [7, 2, 5, 7, 1, 2, 7, 0];
  for (let x = -SX + 4; x <= SX - 4; x += 6.6) {
    house(b, x, PW + 4.5, Math.PI, 6.5, 9, pick([8.4, 9.8, 9.8]), pick(LONDON), PY);
    if (Math.abs(x - SXs) > 9) house(b, x, -PW - 4.5, 0, 6.5, 9, pick([8.4, 9.8, 9.8]), pick(LONDON), PY);
  }
  for (let x = -SX + 10; x <= SX - 10; x += 14) for (const s of [-1, 1]) {
    if (Math.abs(x - SXs) < 7 && s < 0) continue;
    prop(b, kit, "lantern", x + (s > 0 ? 7 : 0), PY, s * (RW + 0.45), 3.0, 0);
  }
  // Paris: cream houses round the square
  for (let x = AX - 26; x <= AX + 26; x += 8.8) house(b, x, AZ - 6 - 4.5, 0, 8.6, 9, pick([9.8, 11.2]), pick([0, 3, 6, 4]), PARY);
  for (const s of [-1, 1]) for (let z = AZ - 2; z <= AZ + 12; z += 8.8) house(b, AX + s * 34.5, z, -s * Math.PI / 2, 8.6, 9, 9.8, pick([0, 6, 4]), D0);
  for (const x of [AX - 12, AX + 12]) prop(b, kit, "lantern", x, PARY, AZ + 1, 3.0, 0);
  // home: a cottage behind the table, hedges and trees
  house(b, HX, HZ - 9.5, 0, 9, 8, 7, 0, D0);
  for (let i = 0; i < 6; i++) prop(b, kit, "hedge", HX - 9 + i * 3.6, D0, HZ - 4.2, 1.2, 0);
  for (let i = 0; i < 14; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), HX - 40 + r() * 80, D0, HZ - 18 - r() * 30, 8 + r() * 4, r() * 6);
  b.build(root);
  setSightLines([]);
  return {};
};
