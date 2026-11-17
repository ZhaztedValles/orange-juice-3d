// The places of the Weston walk: a Boston street of brick terraces with the State House at its head (red brick body,
// white arcade and columns, a gold dome and lantern); a muddy country road between snowy fields (rail fences, pines,
// milestones, a farmhouse); a village street; a sand beach running down to the sea (the analogy); Washington's avenue
// up to the Capitol (white wings, the portico, the drum with its dome still unfinished under a crane, the empty
// inaugural stand with its bunting); and the ballroom (an open-topped room with panelled walls, wall lamps, bunting).
// The cast, the snow, the mud splashes and the drawn props live in cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, cobble, planks, beam, stone } from "../../src/engine/paint";
import { D0, SH, BOS, VIL, ROAD, BEACH, CAP, BALL } from "./story";

/** the road's mud: brown with darker ruts and a few shining puddles */
const mudTex = () => ctex("mud013", 512, 512, (g, r) => {
  g.fillStyle = "#7a5a3e"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#5e4430"; for (let i = 0; i < 260; i++) g.fillRect(r() * 512, r() * 512, 6 + r() * 26, 2 + r() * 5);
  g.fillStyle = "#4e3826"; for (const y of [150, 190, 330, 370]) g.fillRect(0, y + r() * 6, 512, 9);
  for (let i = 0; i < 2; i++) {
    const x = r() * 512, y = r() * 512, w = 16 + r() * 18;
    g.fillStyle = "#6e6a6c"; g.beginPath(); g.ellipse(x, y, w, w * 0.35, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#8e8c92"; g.beginPath(); g.ellipse(x - w * 0.2, y - 2, w * 0.4, w * 0.1, 0, 0, Math.PI * 2); g.fill();
  }
});
/** snow: near white with faint blue drifts */
const snowTex = () => ctex("snow013", 512, 512, (g, r) => {
  g.fillStyle = "#eef1f6"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? "#dfe5f0" : "#f8f9fc"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 60, 6 + r() * 14, 0, 0, Math.PI * 2); g.fill(); }
});
/** sand: warm beige with ripples */
const sandTex = () => ctex("sand013", 512, 512, (g, r) => {
  g.fillStyle = "#e3cc9a"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#cdb27e"; g.lineWidth = 4;
  for (let y = 10; y < 512; y += 26) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + 6 * Math.sin(x / 40 + y)); g.stroke(); }
  g.fillStyle = "#f0dcb0"; for (let i = 0; i < 120; i++) g.fillRect(r() * 512, r() * 512, 3, 3);
});
/** the ballroom wall: cream above, a rich red dado below a gilt rail */
const ballWall = () => ctex("ballWall013", 512, 512, (g) => {
  g.fillStyle = "#efe2c4"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#e2d2ae"; for (let x = 32; x < 512; x += 128) g.fillRect(x, 40, 64, 220);
  g.fillStyle = "#8a2e2a"; g.fillRect(0, 320, 512, 192);
  g.fillStyle = "#6a2220"; for (let x = 0; x < 512; x += 128) g.fillRect(x, 320, 6, 192);
  g.fillStyle = "#c9a047"; g.fillRect(0, 310, 512, 14);
});

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), nb = new Batch(), r = rng(1361);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const curb = lam("curb", () => ({ color: "#a29a8c" }));
  const road = lam("cobRoad", () => ({ map: cobble() }));
  const walk = lam("walk", () => ({ color: "#b9ae9c" }));
  const wood = lam("wood013", () => ({ map: planks() }));
  const post = lam("post013", () => ({ map: beam() }));
  const white = lam("whiteStone", () => ({ color: "#ece6d8" }));
  const whiteSh = lam("whiteTrim", () => ({ color: "#d9d1c0" }));
  const redB = lam("shBrick", () => ({ color: "#b85a3e" }));
  const gold = lam("domeGold", () => ({ color: "#e0b04a" }));
  const iron = lam("iron013", () => ({ color: "#3a3640" }));

  /** a street along x through z0: cobbled road, pavements and curbs, houses both sides (skip leaves gaps) */
  const street = (x0: number, z0: number, len: number, styles: number[], skip: (x: number, side: number) => boolean, mat = road) => {
    b.add(boxGeo(V(x0 - len / 2, D0 - 0.2, z0 - 4.5), V(x0 + len / 2, D0 + 0.08, z0 + 4.5), 2), mat);
    for (const sz of [-1, 1]) {
      b.add(boxGeo(V(x0 - len / 2, D0 - 0.2, sz < 0 ? z0 - 8.4 : z0 + 4.5), V(x0 + len / 2, D0 + 0.18, sz < 0 ? z0 - 4.5 : z0 + 8.4), 2), walk);
      b.add(boxGeo(V(x0 - len / 2, D0 - 0.2, sz < 0 ? z0 - 4.6 : z0 + 4.4), V(x0 + len / 2, D0 + 0.22, sz < 0 ? z0 - 4.4 : z0 + 4.6), 2), curb);
      let x = x0 - len / 2 + 2;
      while (x < x0 + len / 2 - 4) {
        const w = pick([6, 7, 8]);
        if (!skip(x + w / 2, sz)) house(b, x + w / 2, z0 + sz * 12.4, sz < 0 ? 0 : Math.PI, w, 8, pick([9.8, 8.4, 8.4]), pick(styles), D0 + 0.12);
        x += w + 0.15;
      }
      for (let lx = x0 - len / 2 + 6; lx < x0 + len / 2; lx += 14) prop(b, kit, "lantern", lx, D0 + 0.18, z0 + sz * 5.0, 3.0);
    }
  };

  // ---- Boston: the State House (built before the sight lines: the cameras look AT it) ----
  setSightLines([]);
  const [sx, , sz0] = SH;
  b.add(boxGeo(V(sx - 17, D0, sz0 - 8), V(sx + 17, D0 + 11, sz0 + 6), 3), redB); // the brick body
  b.add(boxGeo(V(sx - 17.4, D0 + 11, sz0 - 8.4), V(sx + 17.4, D0 + 11.6, sz0 + 6.4), 1), whiteSh); // the cornice
  for (let i = -3; i <= 3; i++) for (const wy of [2.2, 6.4]) if (Math.abs(i) > 1) // windows in the wings
    b.add(boxGeo(V(sx + i * 4.4 - 0.8, D0 + wy, sz0 + 6.0), V(sx + i * 4.4 + 0.8, D0 + wy + 2.4, sz0 + 6.08), 1), lam("shWin", () => ({ color: "#3d4a66" })));
  b.add(boxGeo(V(sx - 9, D0, sz0 + 6), V(sx + 9, D0 + 4.6, sz0 + 10), 2), white); // the arcade
  for (let i = 0; i < 5; i++) b.add(boxGeo(V(sx - 7.6 + i * 3.4, D0, sz0 + 9.98), V(sx - 6.0 + i * 3.4, D0 + 3.4, sz0 + 10.06), 1), lam("arch", () => ({ color: "#5a5048" })));
  b.add(boxGeo(V(sx - 9, D0 + 4.6, sz0 + 6), V(sx + 9, D0 + 5.0, sz0 + 10), 1), whiteSh);
  for (let i = 0; i < 6; i++) { const c = new THREE.CylinderGeometry(0.42, 0.48, 6, 12); c.translate(sx - 7.5 + i * 3, D0 + 8.0, sz0 + 9.2); b.add(c, white); }
  b.add(boxGeo(V(sx - 9.2, D0 + 11, sz0 + 6), V(sx + 9.2, D0 + 11.8, sz0 + 10.2), 1), whiteSh);
  const ped = new THREE.BufferGeometry().setFromPoints([V(sx - 9.2, D0 + 11.8, sz0 + 10.2), V(sx + 9.2, D0 + 11.8, sz0 + 10.2), V(sx, D0 + 15.0, sz0 + 10.2)]);
  ped.computeVertexNormals(); b.add(ped, white);
  b.add(boxGeo(V(sx - 9.2, D0 + 11.8, sz0 + 4), V(sx + 9.2, D0 + 13.6, sz0 + 10.2), 1), white); // the pediment's roof block
  const drum = new THREE.CylinderGeometry(6.2, 6.6, 3, 24); drum.translate(sx, D0 + 13, sz0 - 1); b.add(drum, white);
  const dome = new THREE.SphereGeometry(6.2, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2); dome.translate(sx, D0 + 14.5, sz0 - 1); b.add(dome, gold);
  const lan = new THREE.CylinderGeometry(1.0, 1.1, 2.2, 12); lan.translate(sx, D0 + 21.6, sz0 - 1); b.add(lan, white);
  const cone = new THREE.ConeGeometry(1.2, 1.8, 12); cone.translate(sx, D0 + 23.6, sz0 - 1); b.add(cone, gold);
  for (let k = 0; k < 4; k++) b.add(boxGeo(V(sx - 8 + k * 0.1, D0 + k * 0.18, sz0 + 10 + k * 0.5), V(sx + 8 - k * 0.1, D0 + 0.18 + k * 0.18, sz0 + 10.5 + k * 0.5), 1), whiteSh); // steps
  // the plaza in front (abuts the north pavement at z = -8.4)
  b.add(boxGeo(V(sx - 22, D0 - 0.2, sz0 + 6), V(sx + 22, D0 + 0.18, -8.4), 2), walk);
  for (let i = -5; i <= 5; i++) if (Math.abs(i) > 1) b.add(boxGeo(V(sx + i * 4 - 0.1, D0 + 0.18, -9.0), V(sx + i * 4 + 0.1, D0 + 1.3, -8.8), 1), iron); // railing posts
  b.add(boxGeo(V(sx - 20, D0 + 1.1, -9.0), V(sx - 6, D0 + 1.2, -8.8), 1), iron); b.add(boxGeo(V(sx + 6, D0 + 1.1, -9.0), V(sx + 20, D0 + 1.2, -8.8), 1), iron);
  setSightLines(rays);
  street(BOS[0] + 30, BOS[2], 180, [1, 2, 4, 5], (x, side) => side < 0 && Math.abs(x - sx) < 23);
  // trees of the Common behind the State House
  for (let i = 0; i < 22; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), sx - 60 + r() * 120, D0, sz0 - 20 - r() * 40, 9 + r() * 5, r() * 6);

  // ---- the village street ----
  street(VIL[0], VIL[2], 150, [0, 3, 6, 1], () => false);
  for (let i = 0; i < 30; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_cone"]), VIL[0] - 90 + r() * 180, D0, VIL[2] - 26 - r() * 40, 9 + r() * 5, r() * 6);
  for (let i = 0; i < 30; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_cone"]), VIL[0] - 90 + r() * 180, D0, VIL[2] + 26 + r() * 40, 9 + r() * 5, r() * 6);

  // ---- the country road: mud between snowy fields, rail fences, pines, milestones, a farmhouse ----
  const [, , rz] = ROAD, X0 = -140, X1 = 340;
  const mud = lam("mud013", () => ({ map: mudTex() })), snow = lam("snow013", () => ({ map: snowTex() }));
  b.add(boxGeo(V(X0, D0 - 0.2, rz - 2.6), V(X1, D0 + 0.07, rz + 2.6), 5), mud);
  b.add(boxGeo(V(X0, D0 - 0.2, rz + 2.6), V(X1, D0 + 0.12, rz + 90), 6), snow);
  b.add(boxGeo(V(X0, D0 - 0.2, rz - 90), V(X1, D0 + 0.12, rz - 2.6), 6), snow);
  for (const fz of [rz - 4.4, rz + 4.4]) {
    for (let x = X0 + 2; x < X1; x += 3.2) b.add(boxGeo(V(x - 0.07, D0 + 0.12, fz - 0.07), V(x + 0.07, D0 + 1.15, fz + 0.07), 1), post);
    for (const y of [0.55, 1.0]) b.add(boxGeo(V(X0 + 2, D0 + y, fz - 0.04), V(X1 - 2, D0 + y + 0.08, fz + 0.04), 3), post);
  }
  for (let x = X0 + 20; x < X1; x += 60) b.add(boxGeo(V(x - 0.25, D0 + 0.12, rz - 3.4), V(x + 0.25, D0 + 0.9, rz - 3.0), 1), lam("mile", () => ({ color: "#bdb5a6" })));
  for (let i = 0; i < 110; i++) {
    const x = X0 + r() * (X1 - X0), zz = rz + (r() < 0.5 ? -1 : 1) * (12 + r() * 70);
    prop(b, kit, r() < 0.7 ? "tree_cone" : "tree_default", x, D0 + 0.12, zz, 7 + r() * 6, r() * 6);
  }
  house(b, 70, rz - 24, 0, 9, 8, 7, 0, D0 + 0.12);
  house(b, 210, rz + 26, Math.PI, 8, 8, 7, 3, D0 + 0.12);
  house(b, -40, rz + 30, Math.PI, 9, 8, 7, 6, D0 + 0.12);
  // snow on far hills
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  ([[-300, rz - 260, 260, 46, 120], [300, rz - 280, 240, 40, 120], [100, rz + 300, 300, 50, 140]] as const)
    .forEach(([x, zz, a, h, c]) => b.add(hill, snow, new THREE.Matrix4().compose(V(x, D0 - 2, zz), new THREE.Quaternion(), V(a, h, c))));

  // ---- the beach: sand down to the sea, a beached rowing boat, dune grass ----
  const [bx, , bz] = BEACH;
  b.add(boxGeo(V(bx - 60, D0 - 0.2, bz - 50), V(bx + 60, D0 + 0.35, bz + 14), 6), lam("sand013", () => ({ map: sandTex() })));
  const sea = lam("sea013", () => ({ color: "#4f8fc0" }));
  b.add(boxGeo(V(bx - 500, D0 - 0.2, bz + 14), V(bx + 500, D0 + 0.22, bz + 700), 20), sea);
  b.add(boxGeo(V(bx - 60, D0 + 0.22, bz + 14), V(bx + 60, D0 + 0.26, bz + 15.2), 4), lam("foam", () => ({ color: "#f4f6f8" })));
  const boatM = lam("boat013", () => ({ color: "#3f6b8a" }));
  b.add(boxGeo(V(bx + 7, D0 + 0.35, bz + 3), V(bx + 10.4, D0 + 0.95, bz + 4.4), 1), boatM);
  b.add(boxGeo(V(bx + 7.2, D0 + 0.95, bz + 3.1), V(bx + 10.2, D0 + 1.05, bz + 4.3), 1), wood);
  for (let i = 0; i < 24; i++) prop(b, kit, pick(["grass_large", "plant_bush"]), bx - 50 + r() * 100, D0 + 0.35, bz - 46 + r() * 20, 0.7 + r() * 0.5, r() * 6);

  // ---- Washington: the avenue, sparse houses and trees, the Capitol ----
  setSightLines([]);
  const [cx, , cz] = CAP;
  b.add(boxGeo(V(cx - 26, D0, cz - 34), V(cx + 8, D0 + 13, cz + 34), 3), white); // the long front (wings along z)
  b.add(boxGeo(V(cx - 26.4, D0 + 13, cz - 34.4), V(cx + 8.4, D0 + 13.8, cz + 34.4), 1), whiteSh);
  for (let i = -7; i <= 7; i++) if (Math.abs(i) > 2) for (const wy of [2.4, 7.4]) b.add(boxGeo(V(cx - 26.08, D0 + wy, cz + i * 4.2 - 0.8), V(cx - 26.0, D0 + wy + 2.6, cz + i * 4.2 + 0.8), 1), lam("capWin", () => ({ color: "#4a5068" })));
  b.add(boxGeo(V(cx - 34, D0, cz - 10), V(cx - 26, D0 + 2.4, cz + 10), 2), whiteSh); // the base of the portico
  for (let k = 0; k < 6; k++) b.add(boxGeo(V(cx - 40 + k, D0, cz - 7), V(cx - 34, D0 + 0.4 * (k + 1), cz + 7), 1), whiteSh); // steps up
  for (let i = 0; i < 8; i++) { const c = new THREE.CylinderGeometry(0.55, 0.62, 10, 12); c.translate(cx - 32.5, D0 + 7.4, cz - 8.4 + i * 2.4); b.add(c, white); }
  b.add(boxGeo(V(cx - 34, D0 + 12.4, cz - 10), V(cx - 26, D0 + 13.6, cz + 10), 1), whiteSh);
  const cped = new THREE.BufferGeometry().setFromPoints([V(cx - 34, D0 + 13.6, cz + 10), V(cx - 34, D0 + 13.6, cz - 10), V(cx - 34, D0 + 17.4, cz)]);
  cped.computeVertexNormals(); b.add(cped, white);
  b.add(boxGeo(V(cx - 34, D0 + 13.6, cz - 10), V(cx - 26, D0 + 15.2, cz + 10), 1), white);
  // the drum, then the unfinished dome: a ring of iron ribs with no skin yet, scaffold, the crane on top
  const cdrum = new THREE.CylinderGeometry(10, 10.5, 9, 28); cdrum.translate(cx - 9, D0 + 18, cz); b.add(cdrum, white);
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; const c = new THREE.CylinderGeometry(0.4, 0.4, 5, 8); c.translate(cx - 9 + Math.cos(a) * 9.6, D0 + 25, cz + Math.sin(a) * 9.6); b.add(c, white); }
  const ring = new THREE.CylinderGeometry(9.2, 9.2, 0.8, 28, 1, true); ring.translate(cx - 9, D0 + 27.8, cz); b.add(ring, whiteSh);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, g = new THREE.BoxGeometry(0.3, 7, 0.3);
    b.add(g, iron, new THREE.Matrix4().compose(V(cx - 9 + Math.cos(a) * 6.8, D0 + 31.0, cz + Math.sin(a) * 6.8), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45)), V(1, 1, 1)));
  }
  b.add(boxGeo(V(cx - 9.3, D0 + 28, cz - 0.3), V(cx - 8.7, D0 + 46, cz + 0.3), 1), post); // the crane mast
  b.add(new THREE.BoxGeometry(0.3, 0.3, 20), post, new THREE.Matrix4().compose(V(cx - 9, D0 + 44, cz + 7), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, 0, 0)), V(1, 1, 1)));
  // the inaugural stand: a plank platform on the steps, empty now, its rail hung with bunting
  b.add(boxGeo(V(cx - 46, D0, cz - 9), V(cx - 40, D0 + 2.2, cz + 9), 2), wood);
  const bunt = [lam("buntR", () => ({ color: "#c0353a" })), lam("buntW", () => ({ color: "#f2ede0" })), lam("buntB", () => ({ color: "#2f4a8a" }))];
  for (let i = 0; i < 18; i++) b.add(boxGeo(V(cx - 46.08, D0 + 1.0, cz - 9 + i), V(cx - 46.0, D0 + 2.0, cz - 8 + i), 1), bunt[i % 3]);
  setSightLines(rays);
  street(cx - 120, cz, 160, [1, 2, 4], (x) => r() < 0.45 || x > cx - 70, lam("dirtRoad", () => ({ map: mudTex() })));
  for (let i = 0; i < 40; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), cx - 200 + r() * 260, D0, cz + (r() < 0.5 ? -1 : 1) * (24 + r() * 50), 9 + r() * 5, r() * 6);

  // ---- the ballroom (open-topped): floor, panelled walls, lamps, bunting ----
  setSightLines([]);
  const [lx, , lz] = BALL;
  const wm = lam("ballWall013", () => ({ map: ballWall() }));
  b.add(boxGeo(V(lx - 9, D0 - 0.2, lz - 5), V(lx + 9, D0 + 0.08, lz + 9), 2), lam("ballFloor", () => ({ map: planks() })));
  b.add(boxGeo(V(lx - 9, D0, lz - 5.3), V(lx + 9, D0 + 5, lz - 5), 2), wm);
  b.add(boxGeo(V(lx - 9.3, D0, lz - 5.3), V(lx - 9, D0 + 5, lz + 9), 2), wm);
  nb.add(boxGeo(V(lx + 9, D0, lz - 5.3), V(lx + 9.3, D0 + 5, lz + 9), 2), wm);
  b.add(boxGeo(V(lx - 9.3, D0 + 5, lz - 5.4), V(lx + 9.3, D0 + 5.3, lz - 4.9), 1), lam("gilt", () => ({ color: "#c9a047" })));
  for (let i = 0; i < 18; i++) b.add(boxGeo(V(lx - 9 + i, D0 + 4.2, lz - 4.98), V(lx - 8 + i, D0 + 4.8, lz - 4.9), 1), bunt[i % 3]);
  b.add(boxGeo(V(lx - 3, D0 + 0.08, lz - 4.9), V(lx + 3, D0 + 0.34, lz - 3.6), 1), lam("dais", () => ({ map: stone("dais", ["#8a2e2a", "#7a2826"]) })));

  // low hills far off
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" }))];
  ([[-300, -620, 240, 40, 120], [260, -660, 260, 46, 140], [800, 200, 200, 40, 160], [700, -300, 220, 44, 140]] as const)
    .forEach(([x, zz, a, h, c], i) => b.add(hill, hm[i % 2], new THREE.Matrix4().compose(V(x, D0 - 2, zz), new THREE.Quaternion(), V(a, h, c))));
  b.build(root);
  nb.build(root, false); // the ballroom's sun-side wall casts no shadow into it
  setSightLines([]);
  // the ballroom's wall lamps: bright globes (HDR, they bloom)
  const lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.9, 1.1), fog: false });
  const lamps: THREE.Mesh[] = [];
  for (const x of [-6.5, -2.2, 2.2, 6.5]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), lampM);
    m.position.set(lx + x, D0 + 3.1, lz - 4.85); root.add(m); lamps.push(m);
  }
  return { lamps };
};
