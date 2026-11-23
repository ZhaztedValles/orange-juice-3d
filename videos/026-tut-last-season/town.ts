// The places of the last-season story: the Valley of the Kings (sand floor, cliffs to the north with an old royal tomb
// door, spoil heaps, the rubble terrace with its hut ruins and the staircase cut down to the sealed door), the lord's
// English lawn and house, a London street of terraces, and the treasure room (gold couches, chariot wheels, shrines,
// caskets, two guardian statues). The stair fill and the standing what-if huts are separate meshes (world.ts shows
// them per shot). Cast: cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, planks } from "../../src/engine/paint";
import { D0, TY, TER_H, PIT, STEPS, ES, SX, CH, WALK_Y, MASK } from "./story";

/** warm limestone rubble: ochre-beige with darker chips */
const rubbleTex = () => ctex("rubble026", 512, 512, (g, r) => {
  g.fillStyle = "#cfae7e"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? "#b8956a" : "#dcc093"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 6 + r() * 22, 4 + r() * 12, r() * 3, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#8f7250"; for (let i = 0; i < 70; i++) g.fillRect(r() * 512, r() * 512, 4 + r() * 6, 3 + r() * 4);
});
/** cliff rock: banded pale limestone with horizontal strata */
const cliffTex = () => ctex("cliff026", 512, 512, (g, r) => {
  g.fillStyle = "#e2bf8a"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 40 + Math.floor(r() * 40)) { g.fillStyle = r() < 0.5 ? "#d4ab74" : "#ecd09e"; g.fillRect(0, y, 512, 14 + r() * 18); }
  g.fillStyle = "#a88358"; for (let i = 0; i < 40; i++) g.fillRect(r() * 512, r() * 512, 2 + r() * 4, 20 + r() * 50);
});
/** mud-brick and stone hut wall */
const hutTex = () => ctex("hut026", 256, 256, (g, r) => {
  g.fillStyle = "#b99a72"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? -24 : 0; x < 256; x += 48) { g.fillStyle = r() < 0.5 ? "#a78760" : "#c7aa80"; g.fillRect(x + 2, y + 2, 44, 28); }
});
/** the sealed doorway: pale plaster with rows of oval seal impressions */
const plasterTex = () => ctex("plaster026", 256, 320, (g, r) => {
  g.fillStyle = "#e3d6b8"; g.fillRect(0, 0, 256, 320);
  for (let i = 0; i < 30; i++) { g.fillStyle = r() < 0.5 ? "#d4c4a0" : "#ece2c8"; g.beginPath(); g.ellipse(r() * 256, r() * 320, 20 + r() * 30, 10 + r() * 16, 0, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "#8a7552"; g.lineWidth = 4;
  for (let y = 40; y < 300; y += 52) for (let x = 36; x < 230; x += 56) { g.beginPath(); g.ellipse(x + ((y / 52) % 2) * 20, y, 14, 20, 0, 0, Math.PI * 2); g.stroke(); }
});
/** a lawn: soft green with lighter mown stripes */
const lawnTex = () => ctex("lawn026", 512, 512, (g, r) => {
  g.fillStyle = "#7ea65a"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 128) { g.fillStyle = "#8bb266"; g.fillRect(x, 0, 64, 512); }
  for (let i = 0; i < 300; i++) { g.fillStyle = r() < 0.5 ? "#6f9a4e" : "#98bd72"; g.fillRect(r() * 512, r() * 512, 3, 8); }
});
/** cobbles for the London road */
const cobbleTex = () => ctex("cobble026", 256, 256, (g, r) => {
  g.fillStyle = "#8d8780"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 20) for (let x = (y / 20) % 2 ? -12 : 0; x < 256; x += 24) { g.fillStyle = r() < 0.5 ? "#a39c92" : "#958e86"; g.beginPath(); g.ellipse(x + 12, y + 10, 10, 8, 0, 0, Math.PI * 2); g.fill(); }
});
/** the room's painted wall: ochre plaster with a frieze band (no writing) */
const roomWallTex = () => ctex("roomwall026", 512, 256, (g, r) => {
  g.fillStyle = "#c9a26a"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "#bf9760" : "#d3ae78"; g.fillRect(r() * 512, r() * 256, 30 + r() * 40, 10 + r() * 20); }
  g.fillStyle = "#4a7f8a"; g.fillRect(0, 30, 512, 14); g.fillStyle = "#b8402f"; g.fillRect(0, 44, 512, 6);
});

export type TownParts = { fill: THREE.Object3D; fillTop: THREE.Object3D; hutsUp: THREE.Object3D };

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []): TownParts => {
  const b = new Batch(), r = rng(1922);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const rubble = lam("rubble026", () => ({ map: rubbleTex() }));
  const cliff = new THREE.MeshBasicMaterial({ map: cliffTex(), color: new THREE.Color(0.78, 0.74, 0.7) }); // unlit: a sunlit far cliff, never lavender
  const hut = lam("hut026", () => ({ map: hutTex() }));
  const plaster = lam("plaster026", () => ({ map: plasterTex() }));
  const dark = lam("dark026", () => ({ color: "#3a2a24" }));
  const wood = lam("wood026", () => ({ map: planks() }));
  const lawn = lam("lawn026", () => ({ map: lawnTex() }));
  const cobble = lam("cobble026", () => ({ map: cobbleTex() }));
  const walk = lam("walk026", () => ({ color: "#b5aca0" }));
  const curb = lam("curb026", () => ({ color: "#8c857c" }));
  const path = lam("path026", () => ({ color: "#d6c7a4" }));
  const gold = lam("gold026", () => ({ color: "#e0aa3a" }));
  const goldD = lam("goldD026", () => ({ color: "#b8862a" }));
  const ebony = lam("ebony026", () => ({ color: "#2e2622" }));
  const whiteB = lam("whiteB026", () => ({ color: "#efe6d2" }));
  const blue = lam("blue026", () => ({ color: "#3f6fa0" }));
  const wall = lam("roomwall026", () => ({ map: roomWallTex() }));
  const box = (a: [number, number, number], c: [number, number, number], m: THREE.Material, t = 2) => b.add(boxGeo(V(...a), V(...c), t), m);

  setSightLines(rays);
  // ---- the valley: cliffs (north and both sides), the old tomb door, spoil heaps ----
  box([-160, D0 - 0.2, -110], [160, D0 + 24, -75], cliff, 6);
  for (const [x0, x1] of [[-160, -80], [80, 160]]) box([x0, D0 - 0.2, -75], [x1, D0 + 20 + (x0 < 0 ? 4 : 0), 80], cliff, 6);
  for (let i = 0; i < 7; i++) box([-70 + i * 22, D0 + 24, -110], [-54 + i * 22, D0 + 27 + (i % 3) * 3, -80], cliff, 6); // a ragged skyline
  box([-11.5, D0 - 0.2, -75.4], [-6.5, D0 + 5.0, -74.9], dark); // the old royal tomb door in the cliff foot
  box([-12.2, D0 + 5.0, -75.5], [-5.8, D0 + 5.6, -74.8], rubble);
  // ---- the rubble terrace, built round the stair pit (left open) ----
  const tz0 = -22, tz1 = -6, tx0 = -14, tx1 = 14;
  box([tx0, D0 - 0.2, tz0], [PIT.x0, TY, tz1], rubble, 3);
  box([PIT.x1, D0 - 0.2, tz0], [tx1, TY, tz1], rubble, 3);
  box([PIT.x0, D0 - 0.2, tz0], [PIT.x1, TY, PIT.zDoor], rubble, 3);
  box([PIT.x0, D0 - 0.2, PIT.zTop], [PIT.x1, TY, tz1], rubble, 3);
  // a slope of loose rubble down the front of the terrace (steps of sand)
  for (let i = 0; i < 4; i++) box([tx0 - 1 - i * 0.8, D0 - 0.2, tz1], [tx1 + 1 + i * 0.8, D0 + TER_H * (0.75 - i * 0.22), tz1 + 0.9 + i * 0.9], rubble, 3);
  // the stairs: STEPS treads down to the ground, then the landing before the door
  const run = (PIT.zTop - PIT.zBot) / STEPS;
  for (let i = 0; i < STEPS; i++) {
    const zt = PIT.zTop - i * run, h = TER_H * (1 - (i + 1) / STEPS);
    if (h > 0.01) box([PIT.x0, D0 - 0.2, zt - run], [PIT.x1, D0 + h, zt], rubble, 2);
  }
  // the sealed doorway: plaster in a timber frame at the foot of the stairs
  const dx = (PIT.x0 + PIT.x1) / 2;
  b.add(new THREE.PlaneGeometry(1.5, 2.1), plaster, new THREE.Matrix4().makeTranslation(dx, D0 + 1.05, PIT.zDoor + 0.02));
  box([dx - 0.85, D0, PIT.zDoor], [dx - 0.75, D0 + 2.25, PIT.zDoor + 0.08], wood);
  box([dx + 0.75, D0, PIT.zDoor], [dx + 0.85, D0 + 2.25, PIT.zDoor + 0.08], wood);
  box([dx - 0.85, D0 + 2.15, PIT.zDoor], [dx + 0.85, D0 + 2.3, PIT.zDoor + 0.08], wood);
  // ---- the hut ruins on the terrace (low broken walls) ----
  const ruin = (x0: number, z0: number, w: number, d: number, h: number, m = hut) => {
    const t = 0.3;
    box([x0, TY, z0], [x0 + w, TY + h, z0 + t], m);
    box([x0, TY, z0 + d - t], [x0 + w * 0.6, TY + h * 0.7, z0 + d], m);
    box([x0, TY, z0], [x0 + t, TY + h * 0.85, z0 + d], m);
    box([x0 + w - t, TY, z0], [x0 + w, TY + h * 0.5, z0 + d * 0.7], m);
  };
  ruin(-5.5, -13.5, 3.0, 3.0, 0.9); ruin(4.4, -14.0, 3.0, 3.2, 0.8); ruin(-2.2, -19.5, 3.4, 3.0, 1.0);
  ruin(5.0, -20.0, 2.8, 2.8, 0.7); ruin(-9.0, -18.0, 2.6, 3.0, 0.8);
  // baskets of finds and tools by the ruins, a few stones
  for (let i = 0; i < 14; i++) { const x = -12 + r() * 24, z = -21 + r() * 14; if (x > PIT.x0 - 0.6 && x < PIT.x1 + 0.6 && z > -17 && z < -9) continue; const s = 0.2 + r() * 0.35; box([x, TY, z], [x + s, TY + s * 0.6, z + s], rubble); }
  // spoil heaps (cones of dumped sand) on the valley floor
  const sand = lam("sand026", () => ({ color: "#d9bd8f" }));
  for (const [x, z, rr, h] of [[-22, -4, 6, 3.5], [20, -3, 7, 4.2], [-30, 8, 8, 5], [28, 12, 7, 4], [-16, 20, 6, 3], [34, -14, 9, 5.5], [-36, -16, 8, 5]] as const) {
    const g = new THREE.ConeGeometry(rr, h, 14, 1); g.translate(x, D0 + h / 2 - 0.05, z); b.add(g, sand);
  }
  // ---- the parts world.ts switches per shot ----
  const fb = new Batch(), fill = new THREE.Group(), fillTop = new THREE.Group(), hutsUp = new THREE.Group();
  fb.add(boxGeo(V(PIT.x0 - 0.005, D0, PIT.zDoor), V(PIT.x1 + 0.005, TY + 0.002, PIT.zTop), 3), rubble);
  fb.build(fill);
  const tb = new Batch();
  tb.add(boxGeo(V(PIT.x0 - 0.005, D0, PIT.zDoor), V(PIT.x1 + 0.005, TY + 0.002, PIT.zTop - run), 3), rubble);
  tb.build(fillTop);
  // what if: a whole hut stands over the staircase (walls up, a flat palm-thatch roof)
  const hb = new Batch(), thatch = lam("thatch026", () => ({ color: "#9a7a4a" }));
  const hx0 = PIT.x0 - 0.6, hx1 = PIT.x1 + 0.6, hz0 = PIT.zTop - 3.4, hz1 = PIT.zTop + 0.4;
  hb.add(boxGeo(V(hx0, TY, hz0), V(hx1, TY + 2.0, hz0 + 0.3), 2), hut);
  hb.add(boxGeo(V(hx0, TY, hz0), V(hx0 + 0.3, TY + 2.0, hz1), 2), hut);
  hb.add(boxGeo(V(hx1 - 0.3, TY, hz0), V(hx1, TY + 2.0, hz1), 2), hut);
  hb.add(boxGeo(V(hx0, TY, hz1 - 0.3), V(hx0 + 1.0, TY + 2.0, hz1), 2), hut);
  hb.add(boxGeo(V(hx1 - 1.0, TY, hz1 - 0.3), V(hx1, TY + 2.0, hz1), 2), hut);
  hb.add(boxGeo(V(hx0 - 0.2, TY + 2.0, hz0 - 0.2), V(hx1 + 0.2, TY + 2.15, hz1 + 0.2), 2), thatch);
  hb.build(hutsUp);
  for (const o of [fill, fillTop, hutsUp]) { o.traverse((m) => { m.castShadow = true; m.receiveShadow = true; }); root.add(o); }

  // ---- the English lawn: grass, a gravel path, the big house behind, oaks and hedges ----
  box([ES - 200, D0 - 0.2, -200], [ES + 200, D0 + 0.08, 200], lawn, 6);
  box([ES - 1.6, D0 - 0.2, -40], [ES + 1.6, D0 + 0.1, 30], path, 3);
  for (let i = 0; i < 7; i++) house(b, ES - 27 + i * 9, -38, 0, 9, 10, i === 3 ? 12 : 9.8, i === 3 ? 4 : 2, D0 + 0.08);
  for (let i = 0; i < 26; i++) {
    const x = ES - 80 + r() * 160, z = -30 + r() * 110;
    if (Math.abs(x - ES) < 12 && z > -30 && z < 14) continue;
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x, D0 + 0.08, z, 8 + r() * 5, r() * 6);
  }
  for (let x = ES - 30; x <= ES + 30; x += 3) if (Math.abs(x - ES) > 3) prop(b, kit, "hedge", x, D0 + 0.08, -24, 1.4);

  // ---- the London street (along x at z = 0) ----
  box([SX - 90, D0 - 0.2, -4.5], [SX + 90, D0 + 0.08, 4.5], cobble, 4);
  for (const sz of [-1, 1]) {
    box([SX - 90, D0 - 0.2, sz < 0 ? -8.4 : 4.6], [SX + 90, D0 + WALK_Y, sz < 0 ? -4.6 : 8.4], walk, 3);
    box([SX - 90, D0 - 0.2, sz < 0 ? -4.6 : 4.5], [SX + 90, D0 + WALK_Y + 0.02, sz < 0 ? -4.5 : 4.6], curb, 2);
    let x = SX - 88;
    while (x < SX + 86) {
      const w = pick([6, 7, 8]);
      house(b, x + w / 2, sz * 12.4, sz < 0 ? 0 : Math.PI, w, 8, pick([9.8, 9.8, 8.4]), pick([1, 2, 4, 5, 7]), D0 + WALK_Y);
      x += w + 0.15;
    }
    for (let lx = SX - 84; lx < SX + 88; lx += 14) prop(b, kit, "lantern", lx, D0 + WALK_Y, sz * 5.0, 3.0);
  }

  // ---- the treasure room: floor, three painted walls (open top and front), the treasures ----
  const [cx, cy, cz] = CH;
  box([cx - 5, cy - 0.2, cz - 4], [cx + 5, cy + 0.08, cz + 5], rubble, 3);
  box([cx - 5, cy, cz - 4.3], [cx + 5, cy + 3.6, cz - 4], wall, 4);
  for (const sx of [-1, 1]) box([cx + sx * 5 - 0.15, cy, cz - 4.3], [cx + sx * 5 + 0.15, cy + 3.6, cz + 1.0], wall, 4);
  const y0 = cy + 0.08;
  // two long gilded couches along the back wall, with animal heads at the ends
  for (const [x0, w] of [[-4.4, 3.6], [0.6, 3.6]] as const) {
    box([cx + x0, y0 + 0.5, cz - 3.9], [cx + x0 + w, y0 + 0.72, cz - 3.0], gold);
    for (const lx of [0.1, w - 0.25]) box([cx + x0 + lx, y0, cz - 3.85], [cx + x0 + lx + 0.15, y0 + 0.5, cz - 3.05], goldD);
    for (const hx of [0, w - 0.4]) box([cx + x0 + hx, y0 + 0.72, cz - 3.75], [cx + x0 + hx + 0.4, y0 + 1.55, cz - 3.15], gold);
  }
  // stacked caskets and shrines on and in front of the couches
  for (const [x, z, w, h, m] of [[-3.6, -3.6, 0.7, 0.5, whiteB], [-2.6, -3.6, 0.8, 0.6, gold], [1.2, -3.6, 0.7, 0.45, ebony], [2.4, -3.6, 0.9, 0.7, gold],
    [-1.4, -2.4, 1.0, 1.2, gold], [3.1, -2.0, 0.8, 0.6, whiteB], [-3.8, -1.8, 0.9, 0.5, ebony]] as const) {
    const base = z < -3 ? y0 + 0.72 : y0;
    box([cx + x, base, cz + z], [cx + x + w, base + h, cz + z + w * 0.7], m);
    box([cx + x - 0.03, base + h, cz + z - 0.03], [cx + x + w + 0.03, base + h + 0.06, cz + z + w * 0.7 + 0.03], goldD);
  }
  // chariot wheels leaning on the side wall
  for (let i = 0; i < 3; i++) {
    const w = new THREE.TorusGeometry(0.48, 0.05, 6, 20); w.rotateY(Math.PI / 2 - 0.25); w.translate(cx - 4.6, y0 + 0.5, cz - 2.6 + i * 0.6); b.add(w, gold);
  }
  // two guardian statues (black with gold kilts) either side of a sealed wall
  for (const sx of [-1, 1]) {
    const x = cx + sx * 1.0;
    box([x - 0.25, y0, cz - 0.95], [x + 0.25, y0 + 0.9, cz - 0.55], ebony);
    box([x - 0.28, y0 + 0.75, cz - 0.98], [x + 0.28, y0 + 1.1, cz - 0.52], gold);
    box([x - 0.24, y0 + 1.1, cz - 0.92], [x + 0.24, y0 + 1.75, cz - 0.58], ebony);
    box([x - 0.18, y0 + 1.75, cz - 0.86], [x + 0.18, y0 + 2.1, cz - 0.62], ebony);
  }
  // the mask's plinth (the mask itself is a lit drawing in cast.ts)
  box([MASK[0] - 0.35, y0, MASK[2] - 0.3], [MASK[0] + 0.35, MASK[1] - 0.32, MASK[2] + 0.3], blue);
  box([MASK[0] - 0.4, MASK[1] - 0.36, MASK[2] - 0.34], [MASK[0] + 0.4, MASK[1] - 0.32, MASK[2] + 0.34], goldD);
  b.build(root);
  setSightLines([]);
  return { fill, fillTop, hutsUp };
};
