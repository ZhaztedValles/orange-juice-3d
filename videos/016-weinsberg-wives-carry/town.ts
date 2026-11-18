// The places of the Weinsberg legend: the walled town on its raised shelf (stone walls with merlons, two gate towers,
// a ramp down from the gate to the road, houses behind the wall), the castle on the snowy hill above it, the king's
// camp of striped pavilions and banners on the snow below; a street inside the town; the monk's writing room (an
// open-topped stone room with an arched window, a desk and a candle); and the castle ruin today on its vine-covered
// hill above a little square. The gate leaf is its own mesh (world.ts raises it). The cast and drawn props live in cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo, quad, tri } from "../../src/engine/build";
import { rng, ctex, cobble, planks, beam, stoneHD, roofHD } from "../../src/engine/paint";
import { D0, WALL_Z, SHELF, RAMP_Z, CAMP, STR, SCR, RUIN } from "./story";

/** snow: near white with faint blue drifts */
const snowTex = () => ctex("snow016", 512, 512, (g, r) => {
  g.fillStyle = "#eef1f6"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? "#dfe5f0" : "#f8f9fc"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 60, 6 + r() * 14, 0, 0, Math.PI * 2); g.fill(); }
});
/** the trodden road: brown mud with ruts and a few patches of snow */
const mudTex = () => ctex("mud016", 512, 512, (g, r) => {
  g.fillStyle = "#7a5a3e"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#5e4430"; for (let i = 0; i < 240; i++) g.fillRect(r() * 512, r() * 512, 6 + r() * 26, 2 + r() * 5);
  g.fillStyle = "#4e3826"; for (const x of [150, 360]) g.fillRect(x + r() * 6, 0, 9, 512);
  g.fillStyle = "#e4e8f0"; for (let i = 0; i < 18; i++) { g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 20, 4 + r() * 6, 0, 0, Math.PI * 2); g.fill(); }
});
/** pavilion canvas: broad vertical stripes */
const stripes = (key: string, a: string, b: string) => ctex(key, 256, 128, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 32, 0, 32, 128); }
});
/** the writing room's back wall: stone with an arched window full of pale sky */
const roomWall = () => ctex("roomWall016", 512, 512, (g, r) => {
  g.fillStyle = "#cbbca2"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#a9997e"; g.lineWidth = 4;
  for (let y = 0; y < 512; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); for (let x = (y / 48) % 2 ? 0 : 40; x < 512; x += 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 48); g.stroke(); } }
  g.fillStyle = "#5a5048"; g.beginPath(); g.moveTo(196, 400); g.lineTo(196, 170); g.arc(256, 170, 60, Math.PI, 0); g.lineTo(316, 400); g.closePath(); g.fill();
  g.fillStyle = "#b9d3ee"; g.beginPath(); g.moveTo(208, 392); g.lineTo(208, 172); g.arc(256, 172, 48, Math.PI, 0); g.lineTo(304, 392); g.closePath(); g.fill();
  g.fillStyle = "#5a5048"; g.fillRect(253, 120, 6, 272); g.fillRect(208, 280, 96, 6);
  g.fillStyle = "#8a7a62"; g.fillRect(186, 400, 140, 14);
  void r;
});

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1140);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const snow = lam("snow016", () => ({ map: snowTex() }));
  const mud = lam("mud016", () => ({ map: mudTex() }));
  const wallM = lam("wall016", () => ({ map: stoneHD("wall016", ["#c9bda6", "#bcae96", "#d3c6ae", "#b4a68e"], "#8f8270") }));
  const earth = lam("earth016", () => ({ map: stoneHD("earth016", ["#a99a82", "#9c8d76", "#b2a48c", "#958670"], "#7a6c58") }));
  const dark = lam("passage016", () => ({ color: "#3a3238" }));
  const wood = lam("wood016", () => ({ map: planks() }));
  const post = lam("post016", () => ({ map: beam() }));
  const road = lam("cobRoad", () => ({ map: cobble() }));
  const walk = lam("walk", () => ({ color: "#b9ae9c" }));
  const curb = lam("curb", () => ({ color: "#a29a8c" }));
  const roofR = lam("roof016r", () => ({ map: roofHD("#b8644f"), side: THREE.DoubleSide }));
  const roofS = lam("roof016s", () => ({ map: roofHD("#8f97a8", true), side: THREE.DoubleSide }));
  const grass = lam("grass016", () => ({ color: "#6a9450" }));
  const hill = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const sy = D0 + SHELF, gy = D0 + 0.07 + SHELF; // shelf top, gate floor

  // ================= Weinsberg (built before the sight lines: the cameras look AT it) =================
  setSightLines([]);
  // the shelf the town stands on, snow on top, and the trodden street up to the gate
  b.add(boxGeo(V(-90, D0 - 0.2, -75), V(90, sy, WALL_Z), 3), earth);
  b.add(boxGeo(V(-90, sy, -75), V(-2, sy + 0.12, WALL_Z - 2), 6), snow);
  b.add(boxGeo(V(2, sy, -75), V(90, sy + 0.12, WALL_Z - 2), 6), snow);
  b.add(boxGeo(V(-2, sy, -75), V(2, gy, WALL_Z), 5), mud);
  // the walls: 2 m thick, 7 m tall, merlons along the top; the gate between two towers
  const W0 = WALL_Z - 2, WT = sy + 7;
  b.add(boxGeo(V(-46, sy, W0), V(-6, WT, WALL_Z), 3), wallM);
  b.add(boxGeo(V(6, sy, W0), V(46, WT, WALL_Z), 3), wallM);
  for (let x = -45.5; x < 46; x += 2) if (Math.abs(x) > 6.5) b.add(boxGeo(V(x - 0.5, WT, WALL_Z - 0.5), V(x + 0.5, WT + 1.2, WALL_Z)), wallM);
  for (const s of [-1, 1]) {
    b.add(boxGeo(V(Math.min(2 * s, 6 * s), D0 - 0.2, WALL_Z - 3), V(Math.max(2 * s, 6 * s), sy + 10, WALL_Z + 1), 3), wallM); // tower
    for (const [ax, az] of [[2.5, WALL_Z + 0.5], [5.5, WALL_Z + 0.5], [4, WALL_Z + 0.5], [5.5, WALL_Z - 1], [5.5, WALL_Z - 2.5]] as const)
      b.add(boxGeo(V(s * ax - 0.45, sy + 10, az - 0.45), V(s * ax + 0.45, sy + 11.2, az + 0.45)), wallM);
    b.add(boxGeo(V(Math.min(46 * s, 50 * s), D0 - 0.2, WALL_Z - 6), V(Math.max(46 * s, 50 * s), WT + 2, WALL_Z + 1), 3), wallM); // corner towers
  }
  b.add(boxGeo(V(-2, gy + 4.6, WALL_Z - 3), V(2, sy + 10, WALL_Z + 1), 3), wallM); // over the gate
  b.add(boxGeo(V(-2, sy, WALL_Z - 3.02), V(2, gy + 4.6, WALL_Z - 3)), dark); // the dark passage end (far side: the street beyond is hidden)
  // the ramp from the gate down to the road, its earth sides
  const ry = D0 + 0.07;
  b.add(quad(V(-2, gy, WALL_Z + 1), V(-2, ry, RAMP_Z), V(2, ry, RAMP_Z), V(2, gy, WALL_Z + 1), 6, 1), mud);
  b.add(boxGeo(V(-2, D0 - 0.2, WALL_Z), V(2, gy, WALL_Z + 1), 4), mud);
  for (const s of [-1, 1]) {
    const g = s < 0 ? tri(V(-2, D0, WALL_Z + 1), V(-2, D0, RAMP_Z), V(-2, gy, WALL_Z + 1)) : tri(V(2, D0, WALL_Z + 1), V(2, gy, WALL_Z + 1), V(2, D0, RAMP_Z));
    b.add(g, earth);
  }
  // snow fields round the ramp and the road down to the camp (the road strip is left bare)
  b.add(boxGeo(V(-160, D0 - 0.2, WALL_Z), V(-2.02, D0 + 0.12, 170), 6), snow);
  b.add(boxGeo(V(2.02, D0 - 0.2, WALL_Z), V(160, D0 + 0.12, 170), 6), snow);
  b.add(boxGeo(V(-2, D0 - 0.2, RAMP_Z), V(2, D0 + 0.07, 170), 5), mud);
  // the castle on the hill behind the town
  b.add(hill, snow, new THREE.Matrix4().compose(V(0, D0 - 1, -112), new THREE.Quaternion(), V(80, 33, 46)));
  const cy = D0 + 30.5, cz = -112;
  b.add(boxGeo(V(-16, cy - 2, cz - 8), V(16, cy + 4, cz + 8), 3), wallM); // the curtain wall
  for (let x = -15.5; x < 16; x += 2) b.add(boxGeo(V(x - 0.5, cy + 4, cz + 7.5), V(x + 0.5, cy + 5, cz + 8)), wallM);
  b.add(boxGeo(V(-5, cy, cz - 5), V(5, cy + 13, cz + 4), 3), wallM); // the keep
  const keepRoof = new THREE.ConeGeometry(7.6, 5, 4); keepRoof.rotateY(Math.PI / 4); keepRoof.translate(0, cy + 15.5, cz - 0.5); b.add(keepRoof, roofS);
  for (const tx of [-16, 16]) {
    const tw = new THREE.CylinderGeometry(3, 3.2, 12, 20); tw.translate(tx, cy + 3, cz + 6); b.add(tw, wallM);
    const tr = new THREE.ConeGeometry(3.6, 5, 20); tr.translate(tx, cy + 11.5, cz + 6); b.add(tr, roofR);
  }
  // the camp: striped pavilions, the king's one bigger, banners, carts
  const pav = (x: number, z: number, rad: number, a: string, c: string, roofCol: string) => {
    const m = lam(`pav${a}${c}`, () => ({ map: stripes(`pav${a}${c}`, a, c) }));
    const body = new THREE.CylinderGeometry(rad, rad, rad * 0.95, 16, 1, true); body.translate(x, D0 + 0.12 + rad * 0.475, z);
    const uv = body.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 2);
    b.add(body, m);
    const top = new THREE.ConeGeometry(rad * 1.12, rad * 0.95, 16); top.translate(x, D0 + 0.12 + rad * 0.95 + rad * 0.47, z); b.add(top, lam(`pavTop${roofCol}`, () => ({ color: roofCol })));
    b.add(boxGeo(V(x - 0.05, D0 + 0.12 + rad * 1.9, z - 0.05), V(x + 0.05, D0 + 0.12 + rad * 1.9 + 1.0, z + 0.05)), post);
  };
  const [, , kz] = CAMP;
  pav(8.2, kz - 1.0, 3.0, "#a33a34", "#e8dcc0", "#a33a34"); // the king's pavilion
  for (const [x, z, rd, k] of [[-9, kz - 5, 2.2, 0], [-15, kz + 3, 2.4, 1], [-7, kz + 9, 2.0, 2], [16, kz + 4, 2.3, 1], [13, kz + 12, 2.1, 0], [-20, kz - 9, 2.0, 2], [22, kz - 6, 2.2, 2], [2, kz + 16, 2.4, 0]] as const) {
    const cols: [string, string, string][] = [["#3e5d8c", "#e8dcc0", "#3e5d8c"], ["#2f6a43", "#e8dcc0", "#2f6a43"], ["#b5873a", "#e8dcc0", "#8c5a2a"]];
    pav(x, z, rd, ...cols[k]);
  }
  const bannerM = [lam("bannerR", () => ({ color: "#a33a34" })), lam("bannerG", () => ({ color: "#d4a640" }))];
  for (const [x, z] of [[4.2, kz - 4.6], [12.4, kz - 4.4], [-4, kz - 8], [-12, kz - 1]] as const) {
    b.add(boxGeo(V(x - 0.06, D0 + 0.12, z - 0.06), V(x + 0.06, D0 + 4.6, z + 0.06)), post);
    b.add(boxGeo(V(x + 0.06, D0 + 3.1, z - 0.02), V(x + 1.2, D0 + 4.5, z + 0.02)), bannerM[0]);
    b.add(boxGeo(V(x + 0.06, D0 + 3.6, z - 0.03), V(x + 1.2, D0 + 3.9, z + 0.03)), bannerM[1]);
  }
  setSightLines(rays);
  // houses on the shelf behind the wall, one street running in from the gate
  for (let row = 0; row < 3; row++) for (let x = -42; x < 42; x += 8.6) {
    if (Math.abs(x + 4.3) < 7 && row === 0) continue;
    house(b, x + 4.3, WALL_Z - 10 - row * 13, 0, 7.6, 8, pick([7, 8.4, 9.8]), pick([0, 3, 4, 6]), sy + 0.12);
  }
  for (const [x, z] of [[-30, 60], [-24, 76], [26, 66], [34, 80]] as const) prop(b, kit, "cart", x, D0 + 0.12, z, 1.6, r() * 6);
  prop(b, kit, "cart", 13.5, D0 + 0.12, kz - 6.5, 1.6, 2.4);
  for (let i = 0; i < 70; i++) {
    const x = (r() < 0.5 ? -1 : 1) * (40 + r() * 110), z = WALL_Z + 8 + r() * 150;
    prop(b, kit, r() < 0.75 ? "tree_cone" : "tree_default", x, D0 + 0.12, z, 7 + r() * 6, r() * 6);
  }

  // ================= the street inside the town =================
  const [stx, , stz] = STR;
  b.add(boxGeo(V(stx - 75, D0 - 0.2, stz - 4.5), V(stx + 75, D0 + 0.08, stz + 4.5), 2), road);
  for (const s of [-1, 1]) {
    b.add(boxGeo(V(stx - 75, D0 - 0.2, s < 0 ? stz - 8.4 : stz + 4.5), V(stx + 75, D0 + 0.18, s < 0 ? stz - 4.5 : stz + 8.4), 2), walk);
    b.add(boxGeo(V(stx - 75, D0 - 0.2, s < 0 ? stz - 4.6 : stz + 4.4), V(stx + 75, D0 + 0.22, s < 0 ? stz - 4.4 : stz + 4.6), 2), curb);
    let x = stx - 73;
    while (x < stx + 70) {
      const w = pick([6, 7, 8]);
      house(b, x + w / 2, stz + s * 12.4, s < 0 ? 0 : Math.PI, w, 8, pick([8.4, 9.8, 8.4]), pick([3, 0, 4, 6]), D0 + 0.12);
      x += w + 0.15;
    }
  }
  // a well in the middle of the street
  const well = new THREE.CylinderGeometry(0.9, 0.95, 0.9, 18); well.translate(stx - 4.2, D0 + 0.53, stz - 2.6); b.add(well, wallM);

  // ================= the monk's writing room (open-topped) =================
  setSightLines([]);
  const [mx, , mz] = SCR;
  b.add(boxGeo(V(mx - 6, D0 - 0.2, mz - 3), V(mx + 6, D0 + 0.1, mz + 8), 2), lam("roomFloor", () => ({ map: stoneHD("roomFloor016", ["#b8aa92", "#ad9f88", "#c2b49b", "#a69880"], "#8a7c66") })));
  b.add(boxGeo(V(mx - 6, D0, mz - 3.3), V(mx + 6, D0 + 4.6, mz - 3), 0), lam("roomWall016", () => ({ map: roomWall() })));
  b.add(boxGeo(V(mx - 6.3, D0, mz - 3.3), V(mx - 6, D0 + 4.6, mz + 8), 3), wallM);
  b.add(boxGeo(V(mx + 6, D0, mz - 3.3), V(mx + 6.3, D0 + 4.6, mz + 8), 3), wallM);
  // the desk with a sloping top, a shelf of books, a stool
  b.add(boxGeo(V(mx - 1.0, D0 + 0.1, mz - 0.95), V(mx + 1.0, D0 + 0.95, mz - 0.55), 1), wood);
  const slope = quad(V(mx - 1.05, D0 + 0.95, mz - 0.5), V(mx + 1.05, D0 + 0.95, mz - 0.5), V(mx + 1.05, D0 + 1.12, mz - 1.0), V(mx - 1.05, D0 + 1.12, mz - 1.0));
  b.add(slope, wood);
  b.add(boxGeo(V(mx + 2.8, D0 + 0.1, mz - 2.95), V(mx + 5.2, D0 + 2.6, mz - 2.5), 1), wood);
  const bookCols = ["#8c3b4a", "#2f5f6a", "#5d7a3a", "#b5653f", "#3f4a6a"];
  for (const shelfY of [0.55, 1.35, 2.15]) for (let i = 0; i < 9; i++)
    b.add(boxGeo(V(mx + 2.9 + i * 0.25, D0 + shelfY, mz - 2.5), V(mx + 3.1 + i * 0.25, D0 + shelfY + 0.5 - (i % 3) * 0.06, mz - 2.45)), lam("book" + (i % 5), () => ({ color: bookCols[i % 5] })));
  const candle = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10); candle.translate(mx + 0.78, D0 + 1.27, mz - 0.62); b.add(candle, lam("candle", () => ({ color: "#efe6cc" })));

  // ================= the ruin today =================
  const [ux, , uz] = RUIN;
  b.add(hill, grass, new THREE.Matrix4().compose(V(ux, D0 - 1, uz - 62), new THREE.Quaternion(), V(70, 26, 40)));
  const ry2 = D0 + 23.5, rz2 = uz - 62;
  for (const [x0, x1, z0, z1, h] of [[-14, -4, -6, -4, 6], [-14, -12, -6, 6, 4.2], [4, 14, -6, -4, 3.2], [12, 14, -6, 4, 5.4], [-14, -6, 4, 6, 2.6], [2, 14, 4, 6, 4.4]] as const)
    b.add(boxGeo(V(ux + x0, ry2 - 3, rz2 + z0), V(ux + x1, ry2 + h, rz2 + z1), 3), wallM);
  const stump = new THREE.CylinderGeometry(4.4, 4.8, 15, 24); stump.translate(ux - 2, ry2 + 4.5, rz2 - 1); b.add(stump, wallM);
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; b.add(boxGeo(V(ux - 2 + Math.cos(a) * 4.0 - 0.5, ry2 + 12, rz2 - 1 + Math.sin(a) * 4.0 - 0.5), V(ux - 2 + Math.cos(a) * 4.0 + 0.5, ry2 + 13, rz2 - 1 + Math.sin(a) * 4.0 + 0.5)), wallM); }
  setSightLines(rays);
  // the square below: paving, a few houses, vines on the hill
  b.add(boxGeo(V(ux - 30, D0 - 0.2, uz - 14), V(ux + 30, D0 + 0.1, uz + 30), 2), road);
  for (const [x, z, yaw] of [[-24, 6, Math.PI / 2], [-24, 16, Math.PI / 2], [24, 6, -Math.PI / 2], [24, 16, -Math.PI / 2]] as const)
    house(b, ux + x, uz + z, yaw, 8, 8, pick([8.4, 9.8]), pick([3, 0, 4]), D0 + 0.1);
  for (let row = 0; row < 7; row++) for (let i = 0; i < 16; i++) {
    const x = ux - 52 + i * 7 + (row % 2) * 3, z = uz - 26 - row * 4.2;
    const dx = (x - ux) / 70, dz = (z - (uz - 62)) / 40, h2 = 1 - dx * dx - dz * dz;
    if (h2 > 0.05) prop(b, kit, "plant_bush", x, D0 - 1 + 26 * Math.sqrt(h2) - 0.2, z, 1.3, r() * 6);
  }
  for (let i = 0; i < 26; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), ux - 120 + r() * 240, D0, uz + 40 + r() * 60, 9 + r() * 5, r() * 6);

  b.build(root);
  setSightLines([]);
  // the gate leaf (world.ts raises it into the masonry above the gateway) and the candle flame (HDR, it blooms)
  const gate = new THREE.Mesh(boxGeo(V(-2, 0, -0.15), V(2, 4.6, 0.15), 1), lam("gate016", () => ({ map: planks() })));
  gate.position.set(0, gy, WALL_Z - 1.6); root.add(gate);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.9, 0.9), fog: false }));
  flame.position.set(mx + 0.78, D0 + 1.48, mz - 0.62); flame.scale.set(1, 1.6, 1); root.add(flame);
  void wood;
  return { gate, gateY: gy };
};
