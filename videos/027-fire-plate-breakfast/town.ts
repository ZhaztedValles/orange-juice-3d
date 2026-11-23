// The places of the fire-plate story: Putney Heath (rough grass, oaks and gorse-like hedges, a sandy track), David
// Hartley's brick house with its removable front wall (world.ts hides it in the cutaway shots), the fire room below
// and the breakfast room above, the layered floor between them (ceiling boards, joists, boards, the thin iron plate,
// boards), the obelisk beside the house, a London street of terraces, a kitchen with a hearth, and the Paris room.
// Cast: cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo, roofMat } from "../../src/engine/build";
import { rng, ctex, planks, facadeHD, stone } from "../../src/engine/paint";
import { D0, HW, HD, F1, UF, EAVE, LAYER, TAB, TABLE_Y, FIRE, OB, SX, KX, PR, WALK_Y, COOK } from "./story";

/** heath grass: olive-green with straw tufts */
export const heathTex = () => ctex("heath027", 512, 512, (g, r) => {
  g.fillStyle = "#86a35c"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? "#789652" : "#97b26a"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 18 + r() * 50, 8 + r() * 16, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.6 ? "#b5a466" : "#6c8a48"; g.fillRect(r() * 512, r() * 512, 3, 8 + r() * 6); }
});
/** inside plaster: warm cream with a dado band */
const plasterTex = () => ctex("plaster027", 512, 256, (g, r) => {
  g.fillStyle = "#f2c27a"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "#ebb86c" : "#f6cc8a"; g.fillRect(r() * 512, r() * 256, 30 + r() * 50, 10 + r() * 20); }
  g.fillStyle = "#8a5a34"; g.fillRect(0, 168, 512, 8); g.fillStyle = "#3f7a6a"; g.fillRect(0, 176, 512, 80);
});
/** a sash window seen from inside (light sky in the panes) */
const winTex = () => ctex("win027", 128, 192, (g) => {
  g.fillStyle = "#f3eee2"; g.fillRect(0, 0, 128, 192);
  g.fillStyle = "#bcd4ec"; for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) g.fillRect(12 + x * 54, 12 + y * 58, 50, 54);
});
/** cobbles for the London road */
const cobbleTex = () => ctex("cobble027", 256, 256, (g, r) => {
  g.fillStyle = "#8d8780"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 20) for (let x = (y / 20) % 2 ? -12 : 0; x < 256; x += 24) { g.fillStyle = r() < 0.5 ? "#a39c92" : "#958e86"; g.beginPath(); g.ellipse(x + 12, y + 10, 10, 8, 0, 0, Math.PI * 2); g.fill(); }
});
/** flagstones for the kitchen floor */
const flagTex = () => stone("flag027", ["#b9ad98", "#a99d88", "#c4b8a2", "#b0a48e"]);
/** Paris room panelling: pale blue-grey with moulded panels */
const panelTex = () => ctex("panel027", 512, 256, (g) => {
  g.fillStyle = "#c9d0cc"; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = "#a9b2ad"; g.lineWidth = 6;
  for (let x = 16; x < 512; x += 128) { g.strokeRect(x, 20, 96, 120); g.strokeRect(x, 160, 96, 80); }
});

export type TownParts = { front: THREE.Object3D; obelisk: THREE.Object3D; ceil: THREE.Mesh; ceilMat: THREE.MeshBasicMaterial };

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []): TownParts => {
  const b = new Batch(), hb = new Batch(), r = rng(1776);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
    const track = lam("track027", () => ({ color: "#c9b48a" }));
  const plaster = lam("plaster027", () => ({ map: plasterTex() }));
  const wood = lam("wood027", () => ({ map: planks() }));
  const joist = lam("joist027", () => ({ color: "#9a6e40" }));
  const gap = lam("gap027", () => ({ color: "#5a4030" }));
  const iron = lam("iron027", () => ({ color: "#6b7380" }));
  const board = lam("board027", () => ({ color: "#c49a5e" }));
  const brickIn = lam("brickIn027", () => ({ color: "#a8644a" }));
  const cloth = lam("cloth027", () => ({ color: "#f4efe2" }));
  const dark = lam("dark027", () => ({ color: "#3a2a24" }));
  const stoneM = lam("stone027", () => ({ map: stone("obel027", ["#cfc6b4", "#c2b9a6", "#d8cfbd", "#bdb4a0"]) }));
  const win = new THREE.MeshBasicMaterial({ map: winTex(), color: new THREE.Color(0.86, 0.86, 0.86) });
  const cobble = lam("cobble027", () => ({ map: cobbleTex() }));
  const walk = lam("walk027", () => ({ color: "#b5aca0" }));
  const curb = lam("curb027", () => ({ color: "#8c857c" }));
  const flags = lam("flag027", () => ({ map: flagTex() }));
  const panel = lam("panel027", () => ({ map: panelTex() }));
  const parquet = lam("parquet027", () => ({ color: "#a8784a" }));
  const green = lam("green027", () => ({ color: "#3f6a4a" }));
  const box = (bb: Batch, a: [number, number, number], c: [number, number, number], m: THREE.Material, t = 2) => bb.add(boxGeo(V(...a), V(...c), t), m);

  setSightLines(rays);
  // ---- the heath: rough grass, a sandy track to the door, trees and bushes all round ----
  box(b, [-0.9, D0 - 0.2, HD], [0.9, D0 + 0.03, 60], track, 3);
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, d = 18 + r() * 70, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > 2 && Math.abs(x - 6) < 16 && z < 34) continue; // keep the view from the front clear
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x, D0, z, 7 + r() * 6, r() * 6);
  }
  for (let i = 0; i < 26; i++) { const x = -40 + r() * 80, z = -30 + r() * 26; if (Math.abs(x) < 8 && z > -8) continue; prop(b, kit, "hedge", x, D0, z, 1.0 + r() * 0.6, r() * 3); }

  // ---- the house: brick shell; the front wall is its own group (hidden in the cutaway shots) ----
  const wallT = 0.3, H = EAVE - D0;
  const sideFac = lam("hsideFac027", () => ({ map: facadeHD("side027", 2 * HD, H, { wall: "#a8644a", shutter: "#3f5a4a", brick: true }) }));
  box(hb, [-HW, D0, -HD], [HW, EAVE, -HD + wallT], brickIn, 3); // back wall
  for (const sx of [-1, 1]) box(hb, [sx < 0 ? -HW : HW - wallT, D0, -HD], [sx < 0 ? -HW + wallT : HW, EAVE, HD], sideFac, 3);
  // inside faces: cream plaster on back and sides (thin layers in front of the brick), windows on the back wall
  box(hb, [-HW + wallT, D0, -HD + wallT], [HW - wallT, EAVE, -HD + wallT + 0.02], plaster, 4);
  for (const sx of [-1, 1]) box(hb, [sx < 0 ? -HW + wallT : HW - wallT - 0.02, D0, -HD + wallT], [sx < 0 ? -HW + wallT + 0.02 : HW - wallT, EAVE, HD], plaster, 4);
  for (const wx of [-3.0, 1.4]) for (const wy of [D0 + 0.9, UF + 0.9]) {
    hb.add(new THREE.PlaneGeometry(1.0, 1.5), win, new THREE.Matrix4().makeTranslation(wx, wy + 0.75, -HD + wallT + 0.03));
  }
  // the ground floor: flagstones
  box(hb, [-HW + wallT, D0 - 0.1, -HD + wallT], [HW - wallT, D0 + 0.05, HD], flags, 2);
  // the floor between the rooms, in layers: its cut edge faces the open front
  const x0 = -HW + wallT, x1 = HW - wallT, z0 = -HD + wallT, z1 = HD;
  let y = F1;
  box(hb, [x0, y, z0], [x1, y + LAYER.ceil, z1], board, 2); y += LAYER.ceil;
  for (let jx = x0; jx < x1 - 0.1; jx += 0.55) { box(hb, [jx, y, z0], [jx + 0.18, y + LAYER.joist, z1], joist, 1); box(hb, [jx + 0.18, y, z0], [Math.min(x1, jx + 0.55), y + LAYER.joist, z1 - 0.06], gap, 1); }
  y += LAYER.joist;
  box(hb, [x0, y, z0], [x1, y + LAYER.low, z1], board, 2); y += LAYER.low;
  box(hb, [x0, y, z0], [x1, y + LAYER.iron, z1 + 0.03], iron, 2); y += LAYER.iron;
  box(hb, [x0, y, z0], [x1, UF, z1], wood, 2);
  // the upper room's ceiling: a downward-facing plane, unlit cream (a box has no bottom face)
  const uc = new THREE.PlaneGeometry(x1 - x0, z1 - z0); uc.rotateX(Math.PI / 2); uc.translate((x0 + x1) / 2, EAVE - 0.02, (z0 + z1) / 2);
  root.add(new THREE.Mesh(uc, new THREE.MeshBasicMaterial({ color: "#cdbb98", side: THREE.DoubleSide })));
  // the roof: a hipped slate roof on a cornice
  const slate = roofMat("#8f97a8");
  box(hb, [-HW - 0.25, EAVE, -HD - 0.25], [HW + 0.25, EAVE + 0.25, HD + 0.25], stoneM, 2);
  const rg = new THREE.ConeGeometry(1, 1, 4, 1); rg.rotateY(Math.PI / 4); rg.scale((HW + 0.3) * 1.414, 2.6, (HD + 0.3) * 1.414); rg.translate(0, EAVE + 0.25 + 1.3, 0);
  hb.add(rg, slate);
  for (const cx of [-HW + 0.8, HW - 0.8]) box(hb, [cx - 0.4, EAVE, -0.4], [cx + 0.4, EAVE + 3.6, 0.4], brickIn, 2); // chimneys
  // the breakfast table: a white cloth to the floor, two chairs' backs behind it
  box(hb, [TAB[0] - 1.3, UF, TAB[2] - 0.35], [TAB[0] + 1.3, TABLE_Y, TAB[2] + 0.35], cloth, 2);
  box(hb, [TAB[0] - 1.36, TABLE_Y - 0.06, TAB[2] - 0.4], [TAB[0] + 1.36, TABLE_Y, TAB[2] + 0.4], cloth, 2);
  for (const sx of [-0.7, 0.65]) box(hb, [TAB[0] + sx - 0.3, UF, TAB[2] - 1.05], [TAB[0] + sx + 0.3, UF + 1.3, TAB[2] - 0.98], dark, 1);
  // the fire room: a heap of kindling on the flagstones under the table, a bucket by the wall
  box(hb, [FIRE[0] - 0.6, D0 + 0.02, FIRE[2] - 0.45], [FIRE[0] + 0.6, D0 + 0.22, FIRE[2] + 0.45], dark, 1);
  for (let i = 0; i < 6; i++) box(hb, [FIRE[0] - 0.55 + i * 0.2, D0 + 0.22, FIRE[2] - 0.4], [FIRE[0] - 0.45 + i * 0.2, D0 + 0.3, FIRE[2] + 0.4], wood, 1);
  hb.build(root, false); // the shell casts no shadow, so the open rooms stay sunlit in the cutaway shots

  // the front wall (exterior facade with door and sash windows) + its inner plaster: a separate group
  const front = new THREE.Group(), fb = new Batch();
  const facM = lam("hfront027", () => ({ map: facadeHD("front027", 2 * HW, H, { wall: "#a8644a", shutter: "#3f5a4a", door: true, brick: true }) }));
  fb.add(boxGeo(V(-HW, D0, HD - wallT), V(HW, EAVE, HD), 3), facM);
  box(fb, [-0.7, D0, HD], [0.7, D0 + 0.18, HD + 0.6], stoneM, 2); // the door step
  fb.build(front);
  front.traverse((m) => { m.castShadow = false; m.receiveShadow = true; });
  root.add(front);

  // ---- the obelisk: a plinth and a tapering stone shaft (its own group: it is built later in the story) ----
  const ob = new Batch(), obelisk = new THREE.Group();
  box(ob, [OB[0] - 1.0, D0, OB[2] - 1.0], [OB[0] + 1.0, D0 + 0.6, OB[2] + 1.0], stoneM, 2);
  box(ob, [OB[0] - 0.75, D0 + 0.6, OB[2] - 0.75], [OB[0] + 0.75, D0 + 1.8, OB[2] + 0.75], stoneM, 2);
  const sh = new THREE.CylinderGeometry(0.3, 0.6, 4.5, 4, 1); sh.rotateY(Math.PI / 4); sh.translate(OB[0], D0 + 1.8 + 2.25, OB[2]); ob.add(sh, stoneM);
  const tip = new THREE.ConeGeometry(0.3, 0.6, 4, 1); tip.rotateY(Math.PI / 4); tip.translate(OB[0], D0 + 1.8 + 4.5 + 0.3, OB[2]); ob.add(tip, stoneM);
  ob.build(obelisk); root.add(obelisk);

  // ---- the London street (along x at z = 0) ----
  box(b, [SX - 90, D0 - 0.2, -4.5], [SX + 90, D0 + 0.08, 4.5], cobble, 4);
  for (const sz of [-1, 1]) {
    box(b, [SX - 90, D0 - 0.2, sz < 0 ? -8.4 : 4.6], [SX + 90, D0 + WALK_Y, sz < 0 ? -4.6 : 8.4], walk, 3);
    box(b, [SX - 90, D0 - 0.2, sz < 0 ? -4.6 : 4.5], [SX + 90, D0 + WALK_Y + 0.02, sz < 0 ? -4.5 : 4.6], curb, 2);
    let x = SX - 88;
    while (x < SX + 86) {
      const w = pick([6, 7, 8]);
      house(b, x + w / 2, sz * 12.4, sz < 0 ? 0 : Math.PI, w, 8, pick([9.8, 9.8, 8.4]), pick([1, 2, 4, 5, 7]), D0 + WALK_Y);
      x += w + 0.15;
    }
    for (let lx = SX - 84; lx < SX + 88; lx += 14) prop(b, kit, "lantern", lx, D0 + WALK_Y, sz * 5.0, 3.0);
  }

  // ---- a room (floor, back and side walls, open top and front) ----
  const room = (cx: number, cz: number, floor: THREE.Material, wall: THREE.Material) => {
    box(b, [cx - 5, D0 - 0.2, cz - 4], [cx + 5, D0 + 0.04, cz + 5], floor, 3);
    box(b, [cx - 5, D0, cz - 4.3], [cx + 5, D0 + 3.6, cz - 4], wall, 4);
    for (const sx of [-1, 1]) box(b, [cx + sx * 5 - 0.15, D0, cz - 4.3], [cx + sx * 5 + 0.15, D0 + 3.6, cz + 1.0], wall, 4);
  };
  // the kitchen: flagstones, plaster, a brick hearth with a range, a work table
  room(KX, 0, flags, plaster);
  box(b, [KX - 1.6, D0, -4.0], [KX + 1.6, D0 + 2.2, -3.2], brickIn, 2);
  box(b, [KX - 1.1, D0, -3.25], [KX + 1.1, D0 + 1.2, -3.15], dark, 1);
  box(b, [COOK[0] - 1.1, D0, COOK[2] - 1.15], [COOK[0] + 0.9, D0 + 0.95, COOK[2] - 0.55], wood, 2); // the stove top / work bench
  box(b, [COOK[0] - 1.15, D0 + 0.95, COOK[2] - 1.2], [COOK[0] + 0.95, D0 + 1.0, COOK[2] - 0.5], dark, 1);
  // the Paris room: parquet, panelled walls, a tall window, a table with a green cloth
  room(PR[0], PR[2], parquet, panel);
  b.add(new THREE.PlaneGeometry(1.3, 2.2), win, new THREE.Matrix4().makeTranslation(PR[0] + 2.6, D0 + 1.9, PR[2] - 3.97));
  box(b, [PR[0] - 1.2, D0, PR[2] - 1.5], [PR[0] + 1.2, D0 + 0.8, PR[2] - 0.8], green, 2);
  box(b, [PR[0] - 1.26, D0 + 0.8, PR[2] - 1.56], [PR[0] + 1.26, D0 + 0.85, PR[2] - 0.74], green, 2);
  b.build(root);
  setSightLines([]);

  // the ceiling underside of the fire room: its own material, charred black per shot by world.ts
  const ceilMat = new THREE.MeshBasicMaterial({ color: "#b08a58" }); // unlit: it faces down, away from the sun
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), ceilMat);
  ceil.rotation.x = Math.PI / 2; ceil.position.set((x0 + x1) / 2, F1 - 0.012, (z0 + z1) / 2);
  ceil.receiveShadow = true;
  root.add(ceil);
  void FIRE;
  return { front, obelisk, ceil, ceilMat };
};
