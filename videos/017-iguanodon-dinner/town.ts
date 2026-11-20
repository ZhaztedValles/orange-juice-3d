// The places of the Iguanodon dinner: Hawkins's workshop yard (an open timber shed with a slate roof round the clay
// mould of the Iguanodon, a wooden platform round it, a long table in its open back, a drawing desk and a trestle of
// bones; the glass hall of the Crystal Palace far behind), the park (a lake round an island with the finished
// Iguanodon on it, paths, trees) and the Belgian coal-mine gallery (coal walls, timber props, the dug-out bed). The nose
// spike of the mould is its own mesh (world.ts slides it in). The cast and drawn props live in cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, planks, beam, stoneHD, roofHD, water } from "../../src/engine/paint";
import { D0, IG, BODY_Y, BODY_R, TABLE_Y, DECK_Y, PARK, ISLE, MINE, DESK, BENCH } from "./story";

/** the building-site ground: trodden sandy gravel */
const siteTex = () => ctex("site017", 512, 512, (g, r) => {
  g.fillStyle = "#b9a27e"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 420; i++) { g.fillStyle = r() < 0.5 ? "#a8916e" : "#c6b08c"; g.fillRect(r() * 512, r() * 512, 4 + r() * 14, 2 + r() * 6); }
});
/** clay: warm grey-brown with tool marks */
const clayTex = () => ctex("clay017", 512, 512, (g, r) => {
  g.fillStyle = "#9c8770"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#87735e"; g.lineWidth = 5;
  for (let i = 0; i < 70; i++) { const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y + 10 * (r() - 0.5), x + 40 + r() * 30, y + 6 * (r() - 0.5)); g.stroke(); }
});
/** the finished model: painted green-grey hide with darker scales */
const hideTex = () => ctex("hide017", 512, 512, (g, r) => {
  g.fillStyle = "#7f8a62"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 28) for (let x = (y / 28) % 2 ? 0 : 16; x < 512; x += 32) {
    g.fillStyle = r() < 0.5 ? "#727d57" : "#8a946b"; g.beginPath(); g.ellipse(x, y, 13, 10, 0, 0, Math.PI * 2); g.fill();
  }
});
/** the glass hall: pale blue panes in white iron ribs */
const glassTex = () => ctex("glass017", 512, 256, (g) => {
  g.fillStyle = "#eef2f4"; g.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 32) for (let y = 0; y < 256; y += 32) { g.fillStyle = (x + y) % 64 ? "#9fc0dc" : "#b3cfe6"; g.fillRect(x + 4, y + 4, 24, 24); }
});
/** coal: near-black seams in dark grey rock */
const coalTex = () => ctex("coal017", 512, 512, (g, r) => {
  g.fillStyle = "#4a4650"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "#2c2a32" : "#5a5560"; g.fillRect(0, r() * 512, 512, 4 + r() * 14); }
  for (let i = 0; i < 200; i++) { g.fillStyle = "#38353e"; g.fillRect(r() * 512, r() * 512, 6 + r() * 20, 4 + r() * 8); }
});

/** an Iguanodon as the 1850s built it: a bulky four-legged body, thick legs, a long dragging tail, a heavy head on a
 *  short neck; `hollow` = the clay mould with its back open (a bowl the diners sit in) */
export const iguanodon = (b: Batch, x: number, y: number, z: number, mat: THREE.Material, hollow: boolean) => {
  const [rx, ry, rz] = BODY_R, cy = y + BODY_Y;
  const sph = hollow ? new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0.42 * Math.PI, 0.58 * Math.PI) : new THREE.SphereGeometry(1, 40, 20);
  b.add(sph, mat, new THREE.Matrix4().compose(V(x, cy, z), new THREE.Quaternion(), V(rx, ry, rz)));
  if (hollow) { // the inside floor of the bowl (a flat oval just under the diners' feet)
    const fl = new THREE.CircleGeometry(1, 32); fl.rotateX(-Math.PI / 2);
    b.add(fl, lam("mouldIn017", () => ({ color: "#6e5e4e" })), new THREE.Matrix4().compose(V(x, cy - 0.55, z), new THREE.Quaternion(), V(rx * 0.86, 1, rz * 0.8)));
  }
  // legs: thick pillars, the front pair a little shorter
  for (const [lx, lz] of [[2.5, 0.85], [2.5, -0.85], [-2.4, 0.9], [-2.4, -0.9]] as const) {
    const leg = new THREE.CylinderGeometry(0.42, 0.5, cy - y - 0.3, 14); leg.translate(x + lx, y + (cy - y - 0.3) / 2, z + lz); b.add(leg, mat);
    const foot = new THREE.CylinderGeometry(0.6, 0.62, 0.25, 14); foot.translate(x + lx + 0.12, y + 0.12, z + lz); b.add(foot, mat);
  }
  // neck and head
  const neck = new THREE.SphereGeometry(1, 24, 12);
  b.add(neck, mat, new THREE.Matrix4().compose(V(x + rx + 0.3, cy + 0.6, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.5)), V(1.3, 0.9, 0.85)));
  const head = new THREE.SphereGeometry(1, 24, 12);
  b.add(head, mat, new THREE.Matrix4().compose(V(x + rx + 1.7, cy + 1.05, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.15)), V(1.15, 0.62, 0.62)));
  // eye ridges and a jaw line
  for (const s of [-1, 1]) { const e = new THREE.SphereGeometry(0.13, 10, 8); e.translate(x + rx + 1.95, cy + 1.42, z + s * 0.46); b.add(e, lam("eye017", () => ({ color: "#2a2228" }))); }
  // the tail: a long tapering cone dragging back to the ground
  const tail = new THREE.ConeGeometry(1.05, 6.6, 18); tail.rotateZ(Math.PI / 2 - 0.32); tail.translate(x - rx - 2.4, cy - 1.0, z); b.add(tail, mat);
  // spines along the back of the finished model
  if (!hollow) for (let k = 0; k < 7; k++) {
    const sp = new THREE.ConeGeometry(0.16, 0.42, 6); sp.translate(x - 2.4 + k * 0.8, cy + ry * Math.sqrt(Math.max(0, 1 - ((-2.4 + k * 0.8) / rx) ** 2)) + 0.12, z); b.add(sp, mat);
  }
};
/** the nose spike (a cone pointing up and forward), as its own mesh */
export const spikeMesh = (mat: THREE.Material) => {
  const g = new THREE.ConeGeometry(0.2, 0.75, 12); g.rotateZ(-0.5); g.translate(0.1, 0.32, 0);
  return new THREE.Mesh(g, mat);
};
/** where the spike sits on the snout of a model whose body centre is at (x, y, z) */
export const spikeAt = (x: number, y: number, z: number): [number, number, number] => [x + BODY_R[0] + 2.55, y + BODY_Y + 1.38, z];

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1853);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const site = lam("site017", () => ({ map: siteTex() }));
  const clay = lam("clay017", () => ({ map: clayTex(), side: THREE.DoubleSide }));
  const hide = lam("hide017", () => ({ map: hideTex() }));
  const wood = lam("wood017", () => ({ map: planks() }));
  const post = lam("post017", () => ({ map: beam() }));
  const slate = lam("roof017", () => ({ map: roofHD("#8f97a8", true), side: THREE.DoubleSide }));
  const cloth = lam("cloth017", () => ({ color: "#efe7d4" }));
  const glass = lam("glass017", () => ({ map: glassTex() }));
  const stone = lam("stone017", () => ({ map: stoneHD("stone017", ["#c9bda6", "#bcae96", "#d3c6ae", "#b4a68e"], "#8f8270") }));
  const grass = lam("grass017", () => ({ color: "#6a9450" }));
  const path = lam("path017", () => ({ color: "#c8b48e" }));
  const lake = lam("lake017", () => ({ map: water() }));
  const coal = lam("coal017", () => ({ map: coalTex() }));
  const [ix, iy, iz] = IG;

  // ================= the workshop yard (built before the sight lines: the cameras look AT it) =================
  setSightLines([]);
  b.add(boxGeo(V(ix - 60, D0 - 0.2, iz - 60), V(ix + 60, D0 + 0.04, iz + 40), 4), site);
  iguanodon(b, ix, iy, iz, clay, true);
  // the platform round the mould (a deck on posts, open in the middle where the body sits), steps up at the front
  for (const [x0, x1, z0, z1] of [[-6, 6.8, 1.7, 3.4], [-6, 6.8, -3.4, -1.7], [-6, -4.3, -1.7, 1.7]] as const) {
    b.add(boxGeo(V(ix + x0, DECK_Y - 0.12, iz + z0), V(ix + x1, DECK_Y, iz + z1), 1), wood);
    for (const px of [x0 + 0.2, (x0 + x1) / 2, x1 - 0.2]) for (const pz of [z0 + 0.2, z1 - 0.2]) b.add(boxGeo(V(ix + px - 0.08, D0, iz + pz - 0.08), V(ix + px + 0.08, DECK_Y - 0.12, iz + pz + 0.08)), post);
  }
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(ix - 1.2, D0, iz + 3.4 + k * 0.32), V(ix + 1.2, DECK_Y - 0.4 * (k + 1), iz + 3.72 + k * 0.32)), wood);
  // a rail along the back edge of the deck
  b.add(boxGeo(V(ix - 6, DECK_Y + 0.9, iz - 3.4), V(ix + 6.8, DECK_Y + 0.98, iz - 3.3)), post);
  // the long table in the open back, a white cloth on it, benches either side
  b.add(boxGeo(V(ix - 3.2, TABLE_Y - 0.06, iz - 0.42), V(ix + 2.9, TABLE_Y, iz + 0.42), 1), cloth);
  b.add(boxGeo(V(ix - 3.2, TABLE_Y - 0.26, iz - 0.44), V(ix + 2.9, TABLE_Y - 0.06, iz + 0.44), 1), cloth);
  // the shed: timber posts, tie beams, a slate roof high over everything (open on all sides)
  const SH = D0 + 9.5;
  for (const px of [-13, -6.5, 0, 6.5, 13]) for (const pz of [-8, 8]) b.add(boxGeo(V(ix + px - 0.18, D0, iz + pz - 0.18), V(ix + px + 0.18, SH, iz + pz + 0.18)), post);
  for (const px of [-13, -6.5, 0, 6.5, 13]) b.add(boxGeo(V(ix + px - 0.15, SH - 0.3, iz - 8), V(ix + px + 0.15, SH, iz + 8)), post);
  for (const s of [-1, 1]) {
    const g = new THREE.PlaneGeometry(27.4, 9.2); g.rotateX(-Math.PI / 2); g.rotateX(s * 0.42); g.translate(ix, SH + 1.9, iz + s * 4.2);
    b.add(g, slate);
  }
  // the drawing desk and stool (shot 5), the trestle of bones (shot 11)
  const [dx, , dz] = DESK;
  b.add(boxGeo(V(dx - 0.8, D0, dz - 0.75), V(dx + 0.8, D0 + 1.0, dz - 0.35), 1), wood);
  b.add(boxGeo(V(dx - 0.85, D0 + 1.0, dz - 0.8), V(dx + 0.85, D0 + 1.08, dz - 0.25), 1), wood);
  const [bx, , bz] = BENCH;
  b.add(boxGeo(V(bx - 1.3, D0 + 0.95, bz - 0.5), V(bx + 1.3, D0 + 1.03, bz + 0.5), 1), wood);
  for (const sx of [-1.1, 1.1]) b.add(boxGeo(V(bx + sx - 0.07, D0, bz - 0.4), V(bx + sx + 0.07, D0 + 0.95, bz + 0.4)), post);
  // a small clay model and blocks of clay in the yard
  for (const [x, z, w] of [[10.5, 4.5, 1.2], [11.8, 3.0, 0.9], [-11, 5.5, 1.1]] as const) b.add(boxGeo(V(ix + x - w / 2, D0, iz + z - w / 2), V(ix + x + w / 2, D0 + w * 0.8, iz + z + w / 2), 1), clay);
  // the Crystal Palace far behind: a long glass hall with an arched transept
  const hz = iz - 150;
  b.add(boxGeo(V(-120, D0, hz - 20), V(120, D0 + 24, hz + 20), 6), glass);
  const vault = new THREE.CylinderGeometry(20, 20, 240, 32, 1, true, -Math.PI / 2, Math.PI); vault.rotateZ(Math.PI / 2); vault.translate(0, D0 + 24, hz);
  b.add(vault, glass);
  const tr = new THREE.CylinderGeometry(24, 24, 48, 32, 1, true, -Math.PI / 2, Math.PI); tr.rotateX(Math.PI / 2); tr.rotateY(Math.PI / 2); tr.translate(0, D0 + 34, hz + 2);
  b.add(tr, glass);
  b.add(boxGeo(V(-24, D0, hz - 24), V(24, D0 + 34, hz + 24), 6), glass);
  setSightLines(rays);
  for (let i = 0; i < 40; i++) {
    const x = (r() < 0.5 ? -1 : 1) * (20 + r() * 70), z = iz - 30 - r() * 90;
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x, D0, z, 8 + r() * 6, r() * 6);
  }
  for (const [x, z] of [[16, 6], [-16, -5], [18, -10]] as const) prop(b, kit, "cart", ix + x, D0, iz + z, 1.6, r() * 6);

  // ================= the park =================
  setSightLines([]);
  const [px, , pz] = PARK, [sx, , sz] = ISLE;
  b.add(boxGeo(V(px - 160, D0 - 0.2, pz - 120), V(px + 160, D0 + 0.04, pz - 40), 4), grass);
  b.add(boxGeo(V(px - 160, D0 - 0.2, pz + 6), V(px + 160, D0 + 0.04, pz + 80), 4), grass);
  b.add(boxGeo(V(px - 160, D0 - 0.2, pz - 40), V(px - 40, D0 + 0.04, pz + 6), 4), grass);
  b.add(boxGeo(V(px + 40, D0 - 0.2, pz - 40), V(px + 160, D0 + 0.04, pz + 6), 4), grass);
  const lw = new THREE.PlaneGeometry(80, 46); lw.rotateX(-Math.PI / 2); lw.translate(px, D0 - 0.25, pz - 17);
  const luv = lw.getAttribute("uv") as THREE.BufferAttribute; for (let i = 0; i < luv.count; i++) luv.setXY(i, luv.getX(i) * 10, luv.getY(i) * 6);
  b.add(lw, lake);
  b.add(boxGeo(V(px - 40, D0 - 1.2, pz - 40), V(px + 40, D0 - 0.9, pz + 6), 4), lam("lakebed017", () => ({ color: "#5d6b5a" })));
  // the island (a low grassy mound with a stone edge) and the finished model on it
  const isle = new THREE.CylinderGeometry(13, 14, 1.0, 40); isle.scale(1.4, 1, 0.75); isle.translate(sx, D0 - 0.45, sz); b.add(isle, grass);
  const edge = new THREE.CylinderGeometry(14.05, 14.2, 0.6, 40, 1, true); edge.scale(1.4, 1, 0.75); edge.translate(sx, D0 - 0.5, sz); b.add(edge, stone);
  iguanodon(b, sx, D0, sz, hide, false);
  // the shore path where the visitors stand
  b.add(boxGeo(V(px - 60, D0 - 0.2, pz + 6), V(px + 60, D0 + 0.08, pz + 10), 3), path);
  setSightLines(rays);
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = 50 + r() * 70;
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat", "tree_cone"]), px + Math.cos(a) * d, D0, pz - 17 + Math.sin(a) * d * 0.8, 9 + r() * 6, r() * 6);
  }
  for (let i = 0; i < 8; i++) prop(b, kit, "plant_bush", sx - 14 + i * 4 + r(), D0 + 0.05, sz - 6 + r() * 2, 1.3, r() * 6);
  for (let i = 0; i < 6; i++) house(b, px - 90 + i * 34, pz + 60, Math.PI, 8, 8, pick([8.4, 9.8]), pick([0, 3, 4]), D0);

  // ================= the coal-mine gallery (open-topped) =================
  setSightLines([]);
  const [mx, , mz] = MINE;
  b.add(boxGeo(V(mx - 30, D0 - 0.2, mz - 30), V(mx + 30, D0 + 0.06, mz + 30), 2), lam("mineFloor017", () => ({ color: "#3e3a42" })));
  b.add(boxGeo(V(mx - 7, D0, mz - 3.4), V(mx + 7, D0 + 4.8, mz - 3), 3), coal);
  for (const s of [-1, 1]) b.add(boxGeo(V(mx + s * 7 - 0.3, D0, mz - 3.4), V(mx + s * 7 + 0.3, D0 + 4.8, mz + 9), 3), coal);
  // timber props: posts and cap beams in frames along the gallery
  for (const fz of [-2.6, 1.4, 5.4]) {
    for (const s of [-1, 1]) b.add(boxGeo(V(mx + s * 3.4 - 0.16, D0, mz + fz - 0.16), V(mx + s * 3.4 + 0.16, D0 + 3.6, mz + fz + 0.16)), post);
    b.add(boxGeo(V(mx - 3.7, D0 + 3.6, mz + fz - 0.18), V(mx + 3.7, D0 + 3.95, mz + fz + 0.18)), post);
  }
  // a heap of dug coal and a mine cart
  const heap = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); heap.scale(1.6, 0.8, 1.2); heap.translate(mx - 4.4, D0, mz + 1.8); b.add(heap, coal);
  b.add(boxGeo(V(mx + 4.0, D0 + 0.35, mz + 1.2), V(mx + 5.6, D0 + 1.2, mz + 2.4), 1), lam("cartIron017", () => ({ color: "#5a5258" })));
  b.add(boxGeo(V(mx - 7, D0 + 0.06, mz + 2.0), V(mx + 7, D0 + 0.1, mz + 2.12)), post);
  b.add(boxGeo(V(mx - 7, D0 + 0.06, mz + 3.0), V(mx + 7, D0 + 0.1, mz + 3.12)), post);

  b.build(root);
  setSightLines([]);
  // lanterns: glowing bulbs hung under the shed's tie beams (HDR, they bloom) and the miners' lamps on the gallery posts
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.8, 2.0, 1.0), fog: false });
  const lamps: THREE.Mesh[] = [];
  for (const [lx, lz] of [[-6.5, 0], [0, -4.2], [0, 4.2], [6.5, 0], [-3.2, 4.2], [3.2, -4.2]] as const) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), glow); m.position.set(ix + lx, D0 + 7.4, iz + lz); root.add(m); lamps.push(m);
    const cord = new THREE.Mesh(boxGeo(V(-0.02, 0, -0.02), V(0.02, 1.8, 0.02)), lam("cord017", () => ({ color: "#2a2228" }))); cord.position.set(ix + lx, D0 + 7.5, iz + lz); root.add(cord);
  }
  for (const [lx, lz] of [[-3.15, -2.6], [3.15, 1.4]] as const) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), glow); m.position.set(mx + lx, D0 + 2.6, mz + lz); root.add(m);
  }
  const spikeMat = lam("clay017", () => ({ map: clayTex(), side: THREE.DoubleSide }));
  const spike = spikeMesh(spikeMat);
  root.add(spike);
  const ps = spikeMesh(hide); ps.position.set(...spikeAt(sx, D0, sz)); root.add(ps);
  void wood;
  return { spike, lamps, spikeHome: spikeAt(ix, iy, iz) };
};
