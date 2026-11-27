// The places of the Voyager story: the big white dish on its concrete pedestal in a dry green field near Canberra
// (low hills of trees, the operators' building), the 1977 launch pad in Florida (concrete apron, a lattice tower, the
// rocket as its own group so world.ts can lift it), the mission control room (rows of desks with glowing screens, the
// data computer cabinet, a wall calendar), a living room with a side table for the phone, the celebration hall
// (stage, a painted probe banner, rows of seats) and, high above everything, the probe itself: a ten-sided bus, a
// white high-gain dish, the power boom with its three generators, the science boom and the long magnetometer boom.
// Cast: cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex } from "../../src/engine/paint";
import { D0, DISH, DISH_R, DISH_H, HUT, PX, LX, HZ, PROBE, ROCKET, DESK, COMP, CAL, PHONE, SOFA, STAGE } from "./story";

/** dry field grass near Canberra: olive and straw */
export const fieldTex = () => ctex("field028", 512, 512, (g, r) => {
  g.fillStyle = "#8fa65a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? "#819a50" : "#a3b66a"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 18 + r() * 50, 8 + r() * 16, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.6 ? "#c2b070" : "#748f46"; g.fillRect(r() * 512, r() * 512, 3, 8 + r() * 6); }
});
/** Florida sand and scrub */
const sandTex = () => ctex("sand028", 256, 256, (g, r) => {
  g.fillStyle = "#d8c89a"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 120; i++) { g.fillStyle = r() < 0.5 ? "#cdbb8a" : "#a9b06a"; g.beginPath(); g.ellipse(r() * 256, r() * 256, 6 + r() * 20, 4 + r() * 8, r() * 3, 0, Math.PI * 2); g.fill(); }
});
/** concrete: warm grey slabs */
const concreteTex = () => ctex("concrete028", 256, 256, (g, r) => {
  g.fillStyle = "#b9b4aa"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "#b0aba1" : "#c2bdb3"; g.fillRect(r() * 256, r() * 256, 10 + r() * 30, 6 + r() * 16); }
  g.fillStyle = "#9c978d"; for (let x = 0; x < 256; x += 128) { g.fillRect(x, 0, 3, 256); g.fillRect(0, x, 256, 3); }
});
/** office wall: pale cream with a blue-grey skirting band */
const officeTex = () => ctex("office028", 512, 256, (g, r) => {
  g.fillStyle = "#e8dcc2"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 30; i++) { g.fillStyle = r() < 0.5 ? "#e2d5ba" : "#eee3cc"; g.fillRect(r() * 512, r() * 256, 30 + r() * 50, 10 + r() * 20); }
  g.fillStyle = "#6a7a8e"; g.fillRect(0, 216, 512, 40);
});
/** carpet: muted blue-grey tiles */
const carpetTex = () => ctex("carpet028", 256, 256, (g, r) => {
  g.fillStyle = "#6f7b8c"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) { g.fillStyle = r() < 0.5 ? "#68748a" : "#76829a"; g.fillRect(x + 2, y + 2, 60, 60); }
});
/** a screen (unlit): dark green-blue with a glowing trace and rows of figures as dashes */
const screenTex = (k: number) => ctex("screen028_" + k, 256, 160, (g, r) => {
  g.fillStyle = "#12302e"; g.fillRect(0, 0, 256, 160);
  g.strokeStyle = "#7af0b8"; g.lineWidth = 5; g.beginPath();
  for (let x = 10; x < 246; x += 6) { const y = 70 + (k % 2 ? 30 * Math.sin(x / 18 + k) : 18 * Math.sin(x / 9 + k) * Math.cos(x / 31)); x === 10 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke();
  g.fillStyle = "#4fc59a"; for (let i = 0; i < 6; i++) g.fillRect(14 + (i % 3) * 78, 120 + Math.floor(i / 3) * 16, 30 + r() * 30, 7);
});
/** the computer cabinet front: panels, switches and two tape reels */
const cabinetTex = () => ctex("cabinet028", 256, 384, (g) => {
  g.fillStyle = "#c9cdd2"; g.fillRect(0, 0, 256, 384);
  g.fillStyle = "#3a3f48"; g.fillRect(16, 16, 224, 150);
  for (const cx of [76, 180]) { g.fillStyle = "#e9ecef"; g.beginPath(); g.arc(cx, 91, 46, 0, Math.PI * 2); g.fill(); g.fillStyle = "#3a3f48"; g.beginPath(); g.arc(cx, 91, 12, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 18; i++) { g.fillStyle = i % 3 ? "#e0a030" : "#d04a3a"; g.beginPath(); g.arc(30 + (i % 6) * 38, 200 + Math.floor(i / 6) * 30, 8, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#9aa0a8"; g.fillRect(16, 296, 224, 70);
});
/** living-room wallpaper: soft green with pale stripes */
const paperTex = () => ctex("paper028", 512, 256, (g) => {
  g.fillStyle = "#a9c49a"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#bcd3ae"; for (let x = 0; x < 512; x += 32) g.fillRect(x, 0, 10, 256);
  g.fillStyle = "#7a5a3e"; g.fillRect(0, 222, 512, 34);
});
/** a window seen from inside: a frame, curtains, blue sky with a cloud and a tree */
const windowTex = () => ctex("window028", 256, 220, (g) => {
  g.fillStyle = "#f3eee2"; g.fillRect(0, 0, 256, 220);
  g.fillStyle = "#9ec6ea"; g.fillRect(20, 18, 216, 184);
  g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(80, 60, 40, 16, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#6aa050"; g.beginPath(); g.ellipse(180, 150, 46, 40, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#8ab060"; g.fillRect(20, 176, 216, 26);
  g.fillStyle = "#f3eee2"; g.fillRect(124, 18, 8, 184); g.fillRect(20, 106, 216, 8);
  g.fillStyle = "#d86a6a"; g.fillRect(0, 0, 36, 220); g.fillRect(220, 0, 36, 220);
});
/** a framed picture of a rocket lifting off */
const pictureTex = () => ctex("picture028", 180, 140, (g) => {
  g.fillStyle = "#7a5a3e"; g.fillRect(0, 0, 180, 140); g.fillStyle = "#cfe3f4"; g.fillRect(12, 12, 156, 116);
  g.fillStyle = "#f6f2ea"; g.fillRect(82, 34, 16, 60); g.beginPath(); g.moveTo(82, 34); g.lineTo(90, 18); g.lineTo(98, 34); g.fill();
  g.fillStyle = "#f07a2a"; g.beginPath(); g.moveTo(82, 94); g.lineTo(98, 94); g.lineTo(90, 118); g.fill();
});
/** a round woven rug */
const rugTex = () => ctex("rug028", 256, 256, (g) => {
  g.fillStyle = "#a8784a"; g.fillRect(0, 0, 256, 256);
  const cols = ["#c0392b", "#e0b84a", "#3f6fa0", "#5a9a6a", "#d86a8a"];
  for (let i = 0; i < 6; i++) { g.fillStyle = cols[i % 5]; g.beginPath(); g.ellipse(128, 128, 124 - i * 20, 124 - i * 20, 0, 0, Math.PI * 2); g.fill(); }
});
/** the hall's painted banner: the probe over a dark sky with stars (no text) */
const bannerTex = () => ctex("banner028", 512, 256, (g, r) => {
  g.fillStyle = "#1b2547"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#f3efe2"; for (let i = 0; i < 60; i++) g.fillRect(r() * 512, r() * 256, 3, 3);
  g.fillStyle = "#f6f2ea"; g.beginPath(); g.ellipse(256, 120, 70, 70, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#c9a24a"; g.fillRect(226, 180, 60, 30);
  g.strokeStyle = "#e8e4dc"; g.lineWidth = 6; g.beginPath(); g.moveTo(286, 190); g.lineTo(470, 230); g.moveTo(226, 195); g.lineTo(120, 215); g.stroke();
  g.fillStyle = "#e8b84a"; g.beginPath(); g.arc(70, 60, 22, 0, Math.PI * 2); g.fill();
});
/** the wall clock face is a card (cast.ts); the calendar board behind it */
const corkTex = () => ctex("cork028", 128, 128, (g, r) => {
  g.fillStyle = "#b8895a"; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 80; i++) { g.fillStyle = r() < 0.5 ? "#a87a4c" : "#c89a6a"; g.fillRect(r() * 128, r() * 128, 3, 3); }
});
/** the starfield (equirectangular, tiled 4 x 2 on the sky sphere) */
export const starTex = () => {
  const t = ctex("stars028", 1024, 512, (g, r) => {
    g.fillStyle = "#000000"; g.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 420; i++) {
      const s = r() < 0.08 ? 3 : r() < 0.4 ? 2 : 1.2, c = r();
      g.fillStyle = c < 0.15 ? "#ffe2b0" : c < 0.3 ? "#cfe0ff" : "#ffffff";
      g.globalAlpha = 0.5 + 0.5 * r(); g.beginPath(); g.arc(r() * 1024, r() * 512, s, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2);
  return t;
};

export type TownParts = { ground: THREE.Object3D[]; pivot: THREE.Group; yawDish: THREE.Group; rocket: THREE.Group; probe: THREE.Group };

const tube = (a: THREE.Vector3, b: THREE.Vector3, r: number, n = 6) => {
  const d = b.clone().sub(a), L = d.length();
  const g = new THREE.CylinderGeometry(r, r, L, n, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
};
/** a paraboloid bowl, axis +z, vertex at z = 0, rim radius R at depth dz */
const bowlGeo = (R: number, dz: number, inner = 0) => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) { const r = inner + ((R - inner) * i) / 14; pts.push(new THREE.Vector2(r, (dz * r * r) / (R * R))); }
  const g = new THREE.LatheGeometry(pts, 40);
  g.rotateX(Math.PI / 2);
  return g;
};

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []): TownParts => {
  const b = new Batch(), r = rng(1977);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const concrete = lam("concrete028", () => ({ map: concreteTex() }));
  const white = lam("white028", () => ({ color: "#ece9e2", side: THREE.DoubleSide }));
  const whiteS = lam("whiteS028", () => ({ color: "#dcd8cf" }));
  const steel = lam("steel028", () => ({ color: "#8d939c" }));
  const rust = lam("rust028", () => ({ color: "#b0583c" }));
  const dark = lam("dark028", () => ({ color: "#3a3d44" }));
  const sand = lam("sand028", () => ({ map: sandTex() }));
  const office = lam("office028", () => ({ map: officeTex() }));
  const carpet = lam("carpet028", () => ({ map: carpetTex() }));
  const desk = lam("desk028", () => ({ color: "#b08a5e" }));
  const deskTop = lam("deskTop028", () => ({ color: "#d9cdb4" }));
  const monitor = lam("monitor028", () => ({ color: "#d2cdc2" }));
  const paper = lam("paper028", () => ({ map: paperTex() }));
  const parquet = lam("parquet028", () => ({ color: "#a8784a" }));
  const wood = lam("wood028", () => ({ color: "#8a5a3a" }));
  const red = lam("red028", () => ({ color: "#9a3a3a" }));
  const seat = lam("seat028", () => ({ color: "#7a3a4a" }));
  const cork = lam("cork028", () => ({ map: corkTex() }));
  const gold = lam("gold028", () => ({ color: "#c9a24a" }));
  const foil = lam("foil028", () => ({ color: "#d8b86a" }));
  const black = lam("black028", () => ({ color: "#2a2b30" }));
  const cab = new THREE.MeshBasicMaterial({ map: cabinetTex(), color: new THREE.Color(0.9, 0.9, 0.9) });
  const scr = [0, 1, 2, 3].map((k) => new THREE.MeshBasicMaterial({ map: screenTex(k), color: new THREE.Color(1.15, 1.15, 1.15) }));
  const win = new THREE.MeshBasicMaterial({ map: windowTex(), color: new THREE.Color(0.95, 0.95, 0.95) });
  const frame = new THREE.MeshBasicMaterial({ map: pictureTex(), color: new THREE.Color(0.92, 0.92, 0.92) });
  const rugM = lam("rug028", () => ({ map: rugTex() }));
  const lampM = lam("lamp028", () => ({ color: "#f0d9a0" }));
  const banner = new THREE.MeshBasicMaterial({ map: bannerTex(), color: new THREE.Color(0.95, 0.95, 0.95) });
  const box = (bb: Batch, a: [number, number, number], c: [number, number, number], m: THREE.Material, t = 2) => bb.add(boxGeo(V(...a), V(...c), t), m);
  const ground: THREE.Object3D[] = [];

  setSightLines(rays);
  // ---- the dish site: a gravel apron, the operators' building, trees on low hills all round ----
  box(b, [DISH[0] - 14, D0 - 0.2, DISH[2] - 14], [DISH[0] + 14, D0 + 0.03, DISH[2] + 14], concrete, 4);
  box(b, [DISH[0] + 14, D0 - 0.2, DISH[2] + 6], [DISH[0] + 40, D0 + 0.03, DISH[2] + 9], concrete, 4); // the road to the building
  house(b, HUT[0] + 3, HUT[2] - 4, -Math.PI / 2, 10, 7, 7, 5, D0);
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = 45 + r() * 90, x = Math.cos(a) * d, z = Math.sin(a) * d;
    prop(b, kit, pick(["tree_default", "tree-high-round", "tree_fat"]), x, D0, z, 8 + r() * 6, r() * 6);
  }
  for (let i = 0; i < 30; i++) { const x = -40 + r() * 80, z = 18 + r() * 30; if (Math.abs(x - 10) < 14) continue; prop(b, kit, "plant_bush", x, D0, z, 0.8 + r() * 0.5, r() * 3); }
  // the pedestal: a concrete drum, then the turning head (yaw group) and the elevation pivot carrying the bowl
  b.add(new THREE.CylinderGeometry(4.2, 5.0, DISH_H - 3.0, 16, 1).translate(DISH[0], D0 + (DISH_H - 3.0) / 2, DISH[2]), concrete);
  const yawDish = new THREE.Group(), yb = new Batch();
  yawDish.position.set(DISH[0], D0, DISH[2]);
  box(yb, [-4.6, DISH_H - 3.0, -3.4], [4.6, DISH_H - 1.2, 3.4], whiteS, 2);
  for (const sx of [-1, 1]) box(yb, [sx * 3.6 - 0.5, DISH_H - 1.2, -1.2], [sx * 3.6 + 0.5, DISH_H + 0.6, 1.2], whiteS, 2); // yoke arms
  yb.build(yawDish);
  const pivot = new THREE.Group(), pb = new Batch();
  pivot.position.set(0, DISH_H, 0);
  pb.add(bowlGeo(DISH_R, 2.6, 1.4).translate(0, 0, 0.2), white);
  pb.add(new THREE.CylinderGeometry(2.4, 2.8, 2.2, 16, 1).rotateX(Math.PI / 2).translate(0, 0, -0.6), whiteS); // the hub behind the bowl
  const F = 7.4; // the subreflector on four legs
  pb.add(new THREE.CylinderGeometry(1.3, 0.5, 0.7, 16, 1).rotateX(-Math.PI / 2).translate(0, 0, F), whiteS);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4, rim = V(Math.cos(a) * DISH_R * 0.72, Math.sin(a) * DISH_R * 0.72, 2.6 * 0.52 + 0.2);
    pb.add(tube(rim, V(Math.cos(a) * 0.9, Math.sin(a) * 0.9, F - 0.3), 0.16), whiteS);
  }
  pb.add(new THREE.CylinderGeometry(0.9, 1.4, 2.8, 12, 1).rotateX(Math.PI / 2).translate(0, 0, 1.6), whiteS); // the feed cone at the centre
  pb.build(pivot);
  yawDish.add(pivot); root.add(yawDish);

  // ---- the launch pad (Florida, 1977): sand, a concrete apron, the red service tower, a fence, the far ocean ----
  const sandG = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 20, 20).rotateX(-Math.PI / 2).translate(PX, D0 + 0.01, 0), sand);
  const uvS = sandG.geometry.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < uvS.count; i++) uvS.setXY(i, uvS.getX(i) * 80, uvS.getY(i) * 80);
  sandG.receiveShadow = true; root.add(sandG); ground.push(sandG);
  box(b, [PX - 18, D0 - 0.2, -14], [PX + 18, D0 + 0.4, 14], concrete, 4);
  box(b, [PX - 4, D0 + 0.4, -4], [PX + 4, D0 + 3.0, 4], concrete, 3); // the launch stand
  const TX = PX - 9; // the service tower: four red legs with cross braces
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) box(b, [TX + dx - 0.3, D0, dz - 0.3], [TX + dx + 0.3, D0 + 48, dz + 0.3], rust, 2);
  for (let y = 4; y < 48; y += 4) {
    box(b, [TX - 2, D0 + y, -2.2], [TX + 2, D0 + y + 0.3, -1.8], rust, 2); box(b, [TX - 2, D0 + y, 1.8], [TX + 2, D0 + y + 0.3, 2.2], rust, 2);
    box(b, [TX - 2.2, D0 + y, -2], [TX - 1.8, D0 + y + 0.3, 2], rust, 2); box(b, [TX + 1.8, D0 + y, -2], [TX + 2.2, D0 + y + 0.3, 2], rust, 2);
    if (y % 8 === 0 && y < 44) box(b, [TX + 2, D0 + y, -0.6], [PX - 2.4, D0 + y + 0.4, 0.6], rust, 2); // swing arms toward the rocket
  }
  for (let x = PX - 30; x < PX + 40; x += 3) box(b, [x, D0, 34], [x + 0.12, D0 + 1.3, 34.12], steel, 1); // the fence posts
  box(b, [PX - 30, D0 + 1.1, 34], [PX + 40, D0 + 1.18, 34.1], steel, 1);
  for (let i = 0; i < 26; i++) { const x = PX - 60 + r() * 120, z = 40 + r() * 40; if (Math.abs(x - PX - 10) < 8) continue; prop(b, kit, pick(["plant_bushLarge", "plant_bush", "tree_cone"]), x, D0, z, 1.2 + r() * 2.5, r() * 3); }
  for (let i = 0; i < 14; i++) { const x = PX - 90 + r() * 180, z = -40 - r() * 50; prop(b, kit, pick(["plant_bushLarge", "tree_cone"]), x, D0, z, 2 + r() * 3, r() * 3); }
  // the rocket: two white boosters either side of a core, a slim upper stage and a nose fairing (its own group)
  const rocket = new THREE.Group(), rb = new Batch();
  rocket.position.set(...ROCKET);
  rb.add(new THREE.CylinderGeometry(1.55, 1.55, 30, 16, 1).translate(0, 3 + 15, 0), whiteS);
  for (const sx of [-1, 1]) {
    rb.add(new THREE.CylinderGeometry(1.5, 1.5, 26, 16, 1).translate(sx * 3.1, 3 + 13, 0), white);
    rb.add(new THREE.ConeGeometry(1.5, 3.2, 16, 1).translate(sx * 3.1, 3 + 26 + 1.6, 0), white);
    rb.add(new THREE.CylinderGeometry(1.5, 1.5, 1.2, 16, 1).translate(sx * 3.1, 3 + 8, 0), black);
  }
  rb.add(new THREE.CylinderGeometry(1.4, 1.55, 8, 16, 1).translate(0, 3 + 34, 0), steel);
  rb.add(new THREE.CylinderGeometry(1.8, 1.4, 6, 16, 1).translate(0, 3 + 41, 0), whiteS);
  rb.add(new THREE.ConeGeometry(1.8, 4.5, 16, 1).translate(0, 3 + 46.25, 0), whiteS);
  rb.build(rocket); root.add(rocket);

  // ---- a room (floor, back and side walls, open top and front) ----
  const room = (cx: number, cz: number, floor: THREE.Material, wall: THREE.Material, w = 5, h = 3.4) => {
    box(b, [cx - w, D0 - 0.2, cz - 4], [cx + w, D0 + 0.04, cz + 5], floor, 3);
    box(b, [cx - w, D0, cz - 4.3], [cx + w, D0 + h, cz - 4], wall, 4);
    for (const sx of [-1, 1]) box(b, [cx + sx * w - 0.15, D0, cz - 4.3], [cx + sx * w + 0.15, D0 + h, cz + 1.0], wall, 4);
  };
  // the control room: carpet, cream walls, two rows of desks with screens, the computer cabinet, the calendar board
  room(LX, 0, carpet, office, 6);
  for (const [row, z] of [[0, DESK[2]], [1, DESK[2] - 1.9]] as [number, number][]) for (let i = 0; i < 4; i++) {
    const x = LX - 3.6 + i * 2.2 + row * 0.6;
    box(b, [x - 0.9, D0, z - 0.4], [x + 0.9, D0 + 0.72, z + 0.4], desk, 1);
    box(b, [x - 0.95, D0 + 0.72, z - 0.45], [x + 0.95, D0 + 0.76, z + 0.45], deskTop, 1);
    box(b, [x - 0.36, D0 + 0.76, z - 0.3], [x + 0.36, D0 + 1.3, z + 0.05], monitor, 1);
    b.add(new THREE.PlaneGeometry(0.6, 0.42), scr[(i + row) % 4], new THREE.Matrix4().makeTranslation(x, D0 + 1.04, z + 0.06));
  }
  box(b, [COMP[0] - 1.6, D0, COMP[2] - 0.6], [COMP[0] + 1.6, D0 + 2.3, COMP[2] + 0.4], monitor, 1);
  for (let i = 0; i < 2; i++) b.add(new THREE.PlaneGeometry(1.4, 2.1), cab, new THREE.Matrix4().makeTranslation(COMP[0] - 0.75 + i * 1.5, D0 + 1.15, COMP[2] + 0.41));
  box(b, [CAL[0] - 1.1, CAL[1] - 0.8, CAL[2] - 0.05], [CAL[0] + 1.1, CAL[1] + 0.8, CAL[2] + 0.02], cork, 1);
  b.add(new THREE.PlaneGeometry(3.6, 1.4), scr[1], new THREE.Matrix4().makeTranslation(LX + 1.6, D0 + 2.3, -3.97)); // the big wall screen

  // the living room: wallpaper, parquet, an armchair, a side table for the phone, a lamp
  room(0, HZ, parquet, paper, 4);
  box(b, [SOFA[0] - 0.55, D0, SOFA[2] - 0.5], [SOFA[0] + 0.55, D0 + 0.45, SOFA[2] + 0.4], red, 1);
  box(b, [SOFA[0] - 0.55, D0 + 0.45, SOFA[2] - 0.55], [SOFA[0] + 0.55, D0 + 1.25, SOFA[2] - 0.35], red, 1);
  for (const sx of [-1, 1]) box(b, [SOFA[0] + sx * 0.55 - 0.12, D0 + 0.45, SOFA[2] - 0.5], [SOFA[0] + sx * 0.55 + 0.12, D0 + 0.75, SOFA[2] + 0.4], red, 1);
  box(b, [PHONE[0] - 0.3, D0, PHONE[2] - 0.3], [PHONE[0] + 0.3, PHONE[1] - 0.02, PHONE[2] + 0.3], wood, 1);
  box(b, [PHONE[0] - 0.34, PHONE[1] - 0.04, PHONE[2] - 0.34], [PHONE[0] + 0.34, PHONE[1], PHONE[2] + 0.34], wood, 1);
  box(b, [-2.6, D0, HZ - 3.9], [-1.0, D0 + 1.9, HZ - 3.5], wood, 1); // a bookcase
  b.add(new THREE.PlaneGeometry(1.4, 1.2), win, new THREE.Matrix4().makeTranslation(1.3, D0 + 1.75, HZ - 3.97)); // a window
  b.add(new THREE.PlaneGeometry(0.9, 0.7), frame, new THREE.Matrix4().makeTranslation(-0.6, D0 + 1.85, HZ - 3.97)); // a picture of a rocket
  const rug = new THREE.PlaneGeometry(2.6, 1.8); rug.rotateX(-Math.PI / 2); rug.translate(SOFA[0] + 0.4, D0 + 0.05, SOFA[2] + 1.4); b.add(rug, rugM);
  box(b, [-1.6, D0, HZ - 2.2], [-1.4, D0 + 1.5, HZ - 2.0], dark, 1); box(b, [-1.8, D0 + 1.5, HZ - 2.4], [-1.2, D0 + 1.85, HZ - 1.8], lampM, 1); // a floor lamp
  for (let i = 0; i < 3; i++) box(b, [-2.5, D0 + 0.5 + i * 0.55, HZ - 3.85], [-1.1, D0 + 0.52 + i * 0.55, HZ - 3.45], dark, 1);

  // the hall: parquet, a stage, the painted banner, rows of seats behind the crowd
  room(0, -HZ, parquet, office, 7, 4.2);
  box(b, [STAGE[0] - 5, D0, STAGE[2] - 1.5], [STAGE[0] + 5, D0 + 0.5, STAGE[2] + 1.0], wood, 2);
  b.add(new THREE.PlaneGeometry(6.4, 3.2), banner, new THREE.Matrix4().makeTranslation(STAGE[0], D0 + 2.6, -HZ - 3.97));
  for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
    const x = -6 + i * 1.5, z = -HZ + 3.6 + row * 1.1;
    box(b, [x - 0.4, D0, z], [x + 0.4, D0 + 0.45, z + 0.45], seat, 1);
    box(b, [x - 0.4, D0 + 0.45, z + 0.38], [x + 0.4, D0 + 0.95, z + 0.5], seat, 1);
  }
  b.build(root);
  setSightLines([]);

  // ---- the probe (deep space): bus, high-gain dish facing +z (Earth), booms ----
  const probe = new THREE.Group(), qb = new Batch();
  probe.position.set(...PROBE);
  qb.add(bowlGeo(1.85, 0.5).translate(0, 0, 0.35), white); // the high-gain dish, 3.7 m across
  qb.add(new THREE.CylinderGeometry(0.22, 0.15, 0.3, 10, 1).rotateX(Math.PI / 2).translate(0, 0, 1.45), whiteS);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; qb.add(tube(V(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0.7), V(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 1.35), 0.025, 4), whiteS); }
  qb.add(new THREE.CylinderGeometry(0.9, 0.9, 0.45, 10, 1).rotateX(Math.PI / 2).translate(0, 0, -0.05), foil); // the ten-sided bus
  qb.add(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 20, 1).rotateZ(Math.PI / 2).translate(0.92, -0.05, -0.05), gold); // the golden record
  qb.add(new THREE.CylinderGeometry(0.4, 0.55, 0.5, 10, 1).rotateX(Math.PI / 2).translate(0, 0, -0.5), dark); // the propellant tank cover
  // the power boom (down-left) with three generators, the science boom (down-right) with its platform
  qb.add(tube(V(-0.8, -0.1, -0.2), V(-2.9, -0.5, -0.4), 0.05, 6), steel);
  for (let i = 0; i < 3; i++) qb.add(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 10, 1).rotateZ(Math.PI / 2 - 0.18).translate(-1.5 - i * 0.6, -0.2 - i * 0.11, -0.3), dark);
  qb.add(tube(V(0.8, -0.1, -0.2), V(2.6, -0.4, -0.3), 0.05, 6), steel);
  qb.add(boxGeo(V(2.4, -0.75, -0.6), V(3.0, -0.2, -0.05), 0), whiteS);
  qb.add(boxGeo(V(2.55, -0.25, -0.5), V(2.85, 0.05, -0.15), 0), dark);
  qb.add(tube(V(0.3, 0.3, -0.2), V(6.5, 4.0, -0.9), 0.03, 4), steel); // the long magnetometer boom
  qb.build(probe); root.add(probe);
  probe.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
  void HUT;
  return { ground, pivot, yawDish, rocket, probe };
};
