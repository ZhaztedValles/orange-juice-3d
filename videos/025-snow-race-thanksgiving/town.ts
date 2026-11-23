// The places of the snow-race story: a snowy Chicago street of brick terraces with its horse-tram rails, a blacksmith's
// open-air forge (a glowing hearth and chimney, the anvil) and the sign-up desk on the north pavement; the start and finish line in Jackson Park (a
// striped banner on two poles, rope fences, pines); the road to Evanston between snow fields and rail fences; a warm
// dining room (a papered wall, a window onto the snow, a laid table). Carriages, the tram and the cast: world.ts / cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, beam, planks } from "../../src/engine/paint";
import { D0, PX, RX, ROOM, SMITH, RAIL_Z, WALK_Y, DESK } from "./story";

/** snow: near white with faint blue drifts */
const snowTex = () => ctex("snow025", 512, 512, (g, r) => {
  g.fillStyle = "#e9edf3"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? "#d9e0ec" : "#f5f7fb"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 60, 6 + r() * 14, 0, 0, Math.PI * 2); g.fill(); }
});
/** a snowy road: packed snow with grey-brown wheel ruts and hoof prints along u */
const rutTex = () => ctex("ruts025", 512, 512, (g, r) => {
  g.fillStyle = "#dfe2e8"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "#d0d5de" : "#eceff4"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 30 + r() * 50, 5 + r() * 10, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#a99c8e";
  for (const y of [120, 170, 330, 380]) for (let x = 0; x < 512; x += 4) g.fillRect(x, y + 3 * Math.sin(x / 37 + y), 5, 9 + 3 * r());
  g.fillStyle = "#b9ada0";
  for (let i = 0; i < 40; i++) g.fillRect(r() * 512, 235 + r() * 40, 8, 6);
});
/** the banner cloth: red and cream stripes with a gold edge (text-free) */
const bannerTex = () => ctex("banner025", 512, 128, (g) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#efe2c2" : "#b8402f"; g.fillRect(i * 64, 0, 64, 128); }
  g.fillStyle = "#d9b45a"; g.fillRect(0, 0, 512, 10); g.fillRect(0, 118, 512, 10);
});
/** the dining-room wallpaper: warm ochre with cream sprigs and a dark dado */
const paperTex = () => ctex("paper025", 512, 512, (g) => {
  g.fillStyle = "#c99a5a"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#e6c98e";
  for (let y = 24; y < 360; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 512; x += 64) { g.beginPath(); g.ellipse(x + 16, y, 7, 11, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#6a3a2a"; g.fillRect(0, 360, 512, 152);
  g.fillStyle = "#4a2a20"; g.fillRect(0, 356, 512, 10);
});
/** the window: a white frame of 6 panes showing snow falling on a blue evening */
const windowTex = () => ctex("window025", 256, 320, (g, r) => {
  g.fillStyle = "#f2ece0"; g.fillRect(0, 0, 256, 320);
  g.fillStyle = "#5d7fb8"; g.fillRect(16, 16, 224, 288);
  g.fillStyle = "#e9edf3"; g.fillRect(16, 240, 224, 64);
  g.fillStyle = "#ffffff"; for (let i = 0; i < 50; i++) { g.beginPath(); g.arc(16 + r() * 224, 16 + r() * 230, 2 + r() * 3, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#f2ece0"; g.fillRect(122, 16, 12, 288); g.fillRect(16, 106, 224, 10); g.fillRect(16, 200, 224, 10);
});

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1895);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const snow = lam("snow025", () => ({ map: snowTex() }));
  const ruts = lam("ruts025", () => ({ map: rutTex() }));
  const walk = lam("walk025", () => ({ map: snowTex() }));
  const curb = lam("curb025", () => ({ color: "#9c958c" }));
  const iron = lam("rail025", () => ({ color: "#4a4850" }));
  const post = lam("post025", () => ({ map: beam() }));
  const wood = lam("wood025", () => ({ map: planks() }));
  const brickM = lam("forge025", () => ({ color: "#8a4a36" }));
  const anvil = lam("anvil025", () => ({ color: "#3e3c44" }));
    const cloth = lam("cloth025", () => ({ color: "#f1ece1" }));
  const deskM = lam("desk025", () => ({ color: "#7a4e30" }));

  /** a road along x through z0 (snow ruts, the ground's snow abutting), optional pavements and terraces */
  const road = (x0: number, len: number, z0: number, half: number) => b.add(boxGeo(V(x0 - len / 2, D0 - 0.2, z0 - half), V(x0 + len / 2, D0 + 0.08, z0 + half), 4), ruts);

  setSightLines(rays);
  // ---- the Chicago street ----
  road(0, 180, 0, 4.5);
  for (const sz of [-1, 1]) {
    b.add(boxGeo(V(-90, D0 - 0.2, sz < 0 ? -8.4 : 4.6), V(90, D0 + WALK_Y, sz < 0 ? -4.6 : 8.4), 3), walk);
    b.add(boxGeo(V(-90, D0 - 0.2, sz < 0 ? -4.6 : 4.5), V(90, D0 + WALK_Y + 0.02, sz < 0 ? -4.5 : 4.6), 2), curb);
    let x = -88;
    while (x < 86) {
      const w = pick([6, 7, 8]);
      house(b, x + w / 2, sz * 12.4, sz < 0 ? 0 : Math.PI, w, 8, pick([9.8, 9.8, 8.4]), pick([1, 2, 4, 5, 7]), D0 + WALK_Y);
      x += w + 0.15;
    }
    for (let lx = -84; lx < 88; lx += 14) prop(b, kit, "lantern", lx, D0 + WALK_Y, sz * 5.0, 3.0);
  }
  for (const dz of [-0.72, 0.72]) b.add(boxGeo(V(-90, D0 + 0.06, RAIL_Z + dz - 0.04), V(90, D0 + 0.13, RAIL_Z + dz + 0.04), 2), iron);
  // the smithy: the forge, its chimney and the anvil on its block
  const [sx, sy, sz] = SMITH;
  b.add(boxGeo(V(sx - 2.1, sy, sz - 1.4), V(sx - 0.7, sy + 0.95, sz - 0.2), 2), brickM);
  b.add(boxGeo(V(sx - 1.75, sy + 0.95, sz - 1.25), V(sx - 1.15, sy + 2.9, sz - 0.75), 2), brickM);
  b.add(boxGeo(V(sx + 0.2, sy, sz - 0.05), V(sx + 0.5, sy + 0.55, sz + 0.25), 2), wood);
  b.add(boxGeo(V(sx - 0.05, sy + 0.55, sz - 0.12), V(sx + 0.75, sy + 0.8, sz + 0.32), 2), anvil);
  b.add(boxGeo(V(sx + 0.75, sy + 0.62, sz - 0.02), V(sx + 1.0, sy + 0.76, sz + 0.18), 2), anvil);
  // the sign-up desk on the pavement
  const [dx0, dy0, dz0] = DESK;
  b.add(boxGeo(V(dx0 - 0.8, dy0 + 0.72, dz0 - 0.45), V(dx0 + 0.8, dy0 + 0.8, dz0 + 0.45), 2), deskM);
  for (const [ax, az] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) b.add(boxGeo(V(dx0 + ax - 0.04, dy0, dz0 + az - 0.04), V(dx0 + ax + 0.04, dy0 + 0.72, dz0 + az + 0.04), 2), deskM);
  b.add(boxGeo(V(dx0 - 0.5, dy0 + 0.8, dz0 - 0.2), V(dx0 + 0.1, dy0 + 0.83, dz0 + 0.25), 2), cloth); // the ledger

  // ---- Jackson Park: the road, the banner, rope fences, pines ----
  road(PX, 200, 0, 3.6);
  for (const pz of [-5.4, 5.4]) b.add(boxGeo(V(PX - 0.12, D0, pz - 0.12), V(PX + 0.12, D0 + 5.4, pz + 0.12), 2), post);
  b.add(boxGeo(V(PX - 0.06, D0 + 4.1, -5.3), V(PX + 0.06, D0 + 5.1, 5.3), 2), lam("banner025", () => ({ map: bannerTex() })));
  for (const fz of [-6.8, 6.8]) {
    for (let x = PX - 40; x <= PX + 40; x += 4) b.add(boxGeo(V(x - 0.06, D0, fz - 0.06), V(x + 0.06, D0 + 1.0, fz + 0.06), 2), post);
    b.add(boxGeo(V(PX - 40, D0 + 0.86, fz - 0.025), V(PX + 40, D0 + 0.92, fz + 0.025), 2), lam("rope025", () => ({ color: "#8a6a44" })));
  }
  for (let i = 0; i < 70; i++) {
    const x = PX - 120 + r() * 240, zz = (r() < 0.5 ? -1 : 1) * (16 + r() * 80);
    prop(b, kit, "tree_cone", x, D0, zz, 6 + r() * 5, r() * 6);
  }
  for (let i = 0; i < 6; i++) house(b, PX - 60 + i * 24, -70 - r() * 10, 0, 9, 8, 8.4, pick([1, 2, 4]), D0);

  // ---- the Evanston road: snow fields, rail fences, pines, a farmhouse ----
  road(RX, 260, 0, 3.4);
  for (const fz of [-5.2, 5.2]) {
    for (let x = RX - 120; x <= RX + 130; x += 3) b.add(boxGeo(V(x - 0.07, D0, fz - 0.07), V(x + 0.07, D0 + 1.1, fz + 0.07), 2), post);
    for (const h of [0.55, 0.95]) b.add(boxGeo(V(RX - 120, D0 + h - 0.05, fz - 0.04), V(RX + 130, D0 + h + 0.05, fz + 0.04), 2), post);
  }
  for (let i = 0; i < 80; i++) {
    const x = RX - 140 + r() * 300, zz = (r() < 0.5 ? -1 : 1) * (14 + r() * 90);
    prop(b, kit, "tree_cone", x, D0, zz, 6 + r() * 6, r() * 6);
  }
  house(b, RX + 30, -28, 0, 10, 9, 8.4, 0, D0);
  house(b, RX - 50, 34, Math.PI, 9, 8, 7.0, 3, D0);

  // ---- the dining room: floor, one papered back wall (open sides, no ceiling: the sun gets in), a window, the table ----
  const [rx, ry, rz] = ROOM;
  const paper = lam("paper025", () => ({ map: paperTex() }));
  b.add(boxGeo(V(rx - 4.2, ry - 0.2, rz - 3.2), V(rx + 4.2, ry + 0.1, rz + 3.4), 2), wood);
  b.add(boxGeo(V(rx - 4.2, ry + 0.1, rz - 3.2), V(rx + 4.2, ry + 3.6, rz - 3.0), 2), paper);
  const win = new THREE.MeshBasicMaterial({ map: windowTex(), fog: false });
  b.add(new THREE.PlaneGeometry(1.4, 1.75), win, new THREE.Matrix4().makeTranslation(rx + 1.6, ry + 1.95, rz - 2.98));
  b.add(boxGeo(V(rx - 1.2, ry + 0.78, rz - 1.05), V(rx + 1.2, ry + 0.86, rz - 0.15), 2), cloth);
  for (const [ax, az] of [[-1.1, -0.95], [1.1, -0.95], [-1.1, -0.25], [1.1, -0.25]]) b.add(boxGeo(V(rx + ax - 0.05, ry + 0.1, rz + az - 0.05), V(rx + ax + 0.05, ry + 0.78, rz + az + 0.05), 2), deskM);
  void sx; void sy; void sz; void snow;
  b.build(root);
  setSightLines([]);
};
