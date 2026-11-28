// The places of the buried-pie story: the village green of Denby Dale (stone cottages round it, market stalls, a
// timber stage with bunting, the giant pie in its iron dish, the green hills of the dale behind), the bakehouse yard
// (cobbles, the bakehouse and its brick oven, the open dish on trestles), the planning room, the stew-pot kitchen and
// the pit in a field by the woods. Cast: cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo, roofMat } from "../../src/engine/build";
import { rng, ctex, planks, stone } from "../../src/engine/paint";
import { D0, STW, STD, ST, DR, DD, CH, SX, YD, KX, PR, PT, PIT_R, POT, TABLE } from "./story";

/** village grass: fresh green with darker tufts and a few daisies */
export const greenTex = () => ctex("green029", 512, 512, (g, r) => {
  g.fillStyle = "#7fa85a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? "#739c50" : "#8db566"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 18 + r() * 50, 8 + r() * 16, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.7 ? "#668f46" : "#a9c47a"; g.fillRect(r() * 512, r() * 512, 3, 8 + r() * 6); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "#f4f0e0"; g.beginPath(); g.arc(r() * 512, r() * 512, 2.5, 0, Math.PI * 2); g.fill(); }
});
/** the hills of the dale: field strips and walls */
const hillTex = () => ctex("hill029", 512, 512, (g, r) => {
  g.fillStyle = "#86a85c"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 128) {
    g.fillStyle = ["#7c9f55", "#93b266", "#a3b86a", "#82a45a"][Math.floor(r() * 4)]; g.fillRect(x + 2, y + 2, 124, 60);
  }
  g.strokeStyle = "#8f8a76"; g.lineWidth = 3;
  for (let y = 0; y <= 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
});
/** pie crust: golden brown with fork marks and darker blisters */
const crustTex = (key: string, base: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,88,36,0.35)" : "rgba(255,226,160,0.35)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 26, 6 + r() * 14, r() * 3, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(120,70,30,0.6)"; g.lineWidth = 4;
  for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 512; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + k * 8, y); g.lineTo(x + k * 8, y + 22); g.stroke(); } }
});
/** inside plaster: warm cream with a dado band */
const plasterTex = () => ctex("plaster029", 512, 256, (g, r) => {
  g.fillStyle = "#f0cf98"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "#e8c58a" : "#f5d8a8"; g.fillRect(r() * 512, r() * 256, 30 + r() * 50, 10 + r() * 20); }
  g.fillStyle = "#7a5034"; g.fillRect(0, 168, 512, 8); g.fillStyle = "#7a4a3a"; g.fillRect(0, 176, 512, 80);
});
/** a sash window seen from inside */
const winTex = () => ctex("win029", 128, 192, (g) => {
  g.fillStyle = "#f3eee2"; g.fillRect(0, 0, 128, 192);
  g.fillStyle = "#bcd4ec"; for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) g.fillRect(12 + x * 54, 12 + y * 58, 50, 54);
});
/** cobbles for the bakehouse yard */
const cobbleTex = () => ctex("cobble029", 256, 256, (g, r) => {
  g.fillStyle = "#8f8778"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 20) for (let x = (y / 20) % 2 ? -12 : 0; x < 256; x += 24) { g.fillStyle = r() < 0.5 ? "#a59c8a" : "#978f80"; g.beginPath(); g.ellipse(x + 12, y + 10, 10, 8, 0, 0, Math.PI * 2); g.fill(); }
});
const flagTex = () => stone("flag029", ["#b9ad98", "#a99d88", "#c4b8a2", "#b0a48e"]);

export type TownParts = {
  pie: THREE.Group; crust: THREE.Group;
  fill: THREE.Mesh; yardCrust: THREE.Mesh;
};

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []): TownParts => {
  const b = new Batch(), r = rng(1887);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const box = (bb: Batch, a: [number, number, number], c: [number, number, number], m: THREE.Material, t = 2) => bb.add(boxGeo(V(...a), V(...c), t), m);
  const wood = lam("wood029", () => ({ map: planks() }));
  const darkWood = lam("dwood029", () => ({ color: "#6a4a32" }));
  const plaster = lam("plaster029", () => ({ map: plasterTex() }));
  const flags = lam("flag029", () => ({ map: flagTex() }));
  const cobble = lam("cobble029", () => ({ map: cobbleTex() }));
  const brick = lam("brick029", () => ({ color: "#a8644a" }));
  const iron = lam("iron029", () => ({ color: "#5e554c" }));
  const ironIn = lam("ironIn029", () => ({ color: "#3d3a38" }));
  const cloth = lam("cloth029", () => ({ color: "#efe6d0" }));
  const earth = lam("earth029", () => ({ color: "#5e4a3a" }));
  const pathM = lam("path029", () => ({ color: "#c9b48a" }));
  const hillM = lam("hill029", () => ({ map: hillTex() }));
  const stoneM = lam("stone029", () => ({ map: stone("wall029", ["#b8ad94", "#a99e86", "#c4b99f", "#9f957e"]) }));
  const win = new THREE.MeshBasicMaterial({ map: winTex(), color: new THREE.Color(0.86, 0.86, 0.86) });

  setSightLines(rays);
  // ---- the green: a sandy path across, cottages all round (open toward the cameras), trees, stalls ----
  box(b, [-30, D0 - 0.2, 5.2], [30, D0 + 0.04, 6.8], pathM, 3);
  const row = (x0: number, x1: number, z: number, yaw: number) => {
    let x = x0;
    while (x < x1) { const w = pick([6, 7, 8]); house(b, x + w / 2, z, yaw, w, 7, pick([7, 8.4]), pick([6, 0, 4, 6, 1]), D0); x += w + 0.4; }
  };
  row(-26, 26, -15, 0);
  for (let z = -10; z < 8; z += 8.4) { house(b, -19, z, Math.PI / 2, 7.5, 7, pick([7, 8.4]), pick([6, 4, 0]), D0); house(b, 19, z, -Math.PI / 2, 7.5, 7, pick([7, 8.4]), pick([6, 1, 0]), D0); }
  for (let i = 0; i < 50; i++) {
    const a = r() * Math.PI * 2, d = 32 + r() * 60, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > 0 && Math.abs(x) < 30) continue; // keep the views from the front clear
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x, D0, z, 7 + r() * 6, r() * 6);
  }
  prop(b, kit, "stall-green", -7.5, D0, -4.5, 2.6, 0.3);
  prop(b, kit, "stall-red", 7.8, D0, -5.0, 2.6, -0.3);
  prop(b, kit, "banner-red", -5.2, D0, -1.0, 3.2, 0);
  prop(b, kit, "banner-green", 5.2, D0, -1.0, 3.2, 0);
  // the hills of the dale, far behind and to the sides
  for (const [hx, hz, hr, hh] of [[-120, -230, 150, 55], [90, -260, 170, 70], [260, -120, 150, 50], [-260, -90, 160, 60], [10, -330, 200, 85]]) {
    const g = new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    g.scale(hr, hh, hr * 0.7); g.translate(hx, D0 - 2, hz);
    const uv = g.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 12, uv.getY(i) * 3);
    b.add(g, hillM);
  }

  // ---- the stage: planks on a timber frame, a cloth skirt, poles with bunting ----
  box(b, [-STW, D0, -STD], [STW, ST, STD], darkWood, 2);
  box(b, [-STW - 0.05, ST - 0.12, -STD - 0.05], [STW + 0.05, ST, STD + 0.05], wood, 2);
  box(b, [-STW - 0.02, D0 + 0.15, STD], [STW + 0.02, ST - 0.12, STD + 0.03], cloth, 2);
  for (const sx of [-1, 1]) box(b, [sx * (STW + 0.6) - 0.08, D0, -STD - 0.4], [sx * (STW + 0.6) + 0.08, D0 + 4.2, -STD - 0.24], darkWood, 1);
  const cols = ["#c0392b", "#f2f0e6", "#2f5f9a"];
  for (let i = 0; i < 14; i++) {
    const u0 = i / 14, u1 = (i + 0.7) / 14, x0 = -(STW + 0.6) + u0 * 2 * (STW + 0.6), x1 = -(STW + 0.6) + u1 * 2 * (STW + 0.6);
    const sag = (u: number) => D0 + 4.05 - 0.7 * Math.sin(u * Math.PI);
    const g = new THREE.BufferGeometry().setFromPoints([V(x0, sag(u0), -STD - 0.32), V((x0 + x1) / 2, sag((u0 + u1) / 2) - 0.42, -STD - 0.32), V(x1, sag(u1), -STD - 0.32)]);
    g.setIndex([0, 1, 2, 0, 2, 1]); g.computeVertexNormals();
    b.add(g, lam("bunt" + cols[i % 3], () => ({ color: cols[i % 3], side: THREE.DoubleSide })));
  }

  // ---- the bakehouse yard ----
  box(b, [SX - 12, D0 - 0.2, -9], [SX + 12, D0 + 0.06, 10], cobble, 4);
  house(b, SX - 1, -12.5, 0, 9, 7, 7, 6, D0);
  house(b, SX + 10, -9, -Math.PI / 2, 7, 7, 8.4, 4, D0);
  box(b, [SX - 7.5, D0, -8.2], [SX - 3.5, D0 + 2.6, -6.0], brick, 2); // the oven
  box(b, [SX - 6.4, D0 + 0.6, -6.04], [SX - 4.6, D0 + 1.8, -5.98], ironIn, 1); // its mouth
  box(b, [SX - 5.9, D0 + 2.6, -7.6], [SX - 5.1, D0 + 5.6, -6.8], brick, 2); // its chimney
  for (const sx of [-0.9, 0.9]) {
    box(b, [YD[0] + sx - 0.08, D0, YD[2] - 1.1], [YD[0] + sx + 0.08, YD[1], YD[2] + 1.1], darkWood, 1);
    box(b, [YD[0] + sx - 0.16, YD[1] - 0.08, YD[2] - 1.2], [YD[0] + sx + 0.16, YD[1], YD[2] + 1.2], wood, 1);
  }
  for (let i = 0; i < 5; i++) prop(b, kit, "hedge", SX - 10 + i * 4.5, D0, 9.5, 1.2, r() * 3);
  // the open dish: an iron wall and a dark floor, the meat level is a disc world.ts raises
  const dishOpen = new THREE.CylinderGeometry(DR, DR * 0.96, DD, 40, 1, true); dishOpen.translate(YD[0], YD[1] + DD / 2, YD[2]);
  b.add(dishOpen, lam("ironDS029", () => ({ color: "#56534f", side: THREE.DoubleSide })));
  const rim = new THREE.TorusGeometry(DR, 0.045, 6, 40); rim.rotateX(Math.PI / 2); rim.translate(YD[0], YD[1] + DD, YD[2]); b.add(rim, iron);
  const fl = new THREE.CircleGeometry(DR * 0.96, 40); fl.rotateX(-Math.PI / 2); fl.translate(YD[0], YD[1] + 0.02, YD[2]); b.add(fl, ironIn);

  // ---- a room: floor, back and side walls (open top and front) ----
  const room = (cx: number, cz: number) => {
    box(b, [cx - 5, D0 - 0.2, cz - 4], [cx + 5, D0 + 0.04, cz + 5], flags, 3);
    box(b, [cx - 5, D0, cz - 4.3], [cx + 5, D0 + 3.6, cz - 4], plaster, 4);
    for (const sx of [-1, 1]) box(b, [cx + sx * 5 - 0.15, D0, cz - 4.3], [cx + sx * 5 + 0.15, D0 + 3.6, cz + 1.0], plaster, 4);
    b.add(new THREE.PlaneGeometry(1.2, 1.9), win, new THREE.Matrix4().makeTranslation(cx - 2.4, D0 + 2.0, cz - 3.97));
  };
  room(KX, 0);
  box(b, [TABLE[0] - 1.3, D0, TABLE[2] - 0.6], [TABLE[0] + 1.3, D0 + 0.78, TABLE[2] + 0.6], darkWood, 2);
  box(b, [TABLE[0] - 1.36, D0 + 0.78, TABLE[2] - 0.66], [TABLE[0] + 1.36, D0 + 0.84, TABLE[2] + 0.66], wood, 2);
  room(PR[0], PR[2]);
  box(b, [PR[0] - 1.6, D0, PR[2] - 4.0], [PR[0] + 1.6, D0 + 2.2, PR[2] - 3.2], brick, 2); // the hearth
  box(b, [PR[0] - 1.1, D0, PR[2] - 3.25], [PR[0] + 1.1, D0 + 1.2, PR[2] - 3.15], ironIn, 1);
  box(b, [POT[0] - 1.2, D0, POT[2] - 0.6], [POT[0] + 1.2, POT[1], POT[2] + 0.6], wood, 2); // the kitchen table
  const pot = new THREE.CylinderGeometry(0.55, 0.5, 0.75, 32, 1, true); pot.translate(POT[0], POT[1] + 0.375, POT[2]);
  b.add(pot, lam("potDS029", () => ({ color: "#4e4b48", side: THREE.DoubleSide })));
  const prim = new THREE.TorusGeometry(0.55, 0.04, 6, 32); prim.rotateX(Math.PI / 2); prim.translate(POT[0], POT[1] + 0.75, POT[2]); b.add(prim, iron);
  const stew = new THREE.CircleGeometry(0.53, 32); stew.rotateX(-Math.PI / 2); stew.translate(POT[0], POT[1] + 0.62, POT[2]);
  b.add(stew, lam("stew029", () => ({ color: "#9a5a30" })));

  // ---- the pit in the field: a dark hole, a ring of dug earth, the spoil heap, the wood behind ----
  const hole = new THREE.CircleGeometry(PIT_R, 40); hole.rotateX(-Math.PI / 2); hole.translate(PT[0], D0 + 0.03, PT[2]);
  root.add(new THREE.Mesh(hole, new THREE.MeshBasicMaterial({ color: "#2a1d16" })));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, g = new THREE.SphereGeometry(0.55, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    g.scale(0.9, 0.36, 0.7); g.rotateY(-a); g.translate(PT[0] + Math.cos(a) * (PIT_R + 0.35), D0, PT[2] + Math.sin(a) * (PIT_R + 0.35));
    b.add(g, earth);
  }
  const heap = new THREE.SphereGeometry(1.4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); heap.scale(1.3, 0.8, 1); heap.translate(PT[0] - 3.6, D0, PT[2] - 1.6); b.add(heap, earth);
  for (let i = 0; i < 40; i++) {
    const x = PT[0] - 40 + r() * 80, z = PT[2] - 8 - r() * 30;
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat", "tree_detailed"]), x, D0, z, 7 + r() * 5, r() * 6);
  }
  for (let i = 0; i < 6; i++) prop(b, kit, "hedge", PT[0] - 14 + i * 5.5, D0, PT[2] - 6.5, 1.1, r() * 3);
  // the stone wall of the field
  box(b, [PT[0] - 20, D0, PT[2] - 6.0], [PT[0] + 20, D0 + 0.9, PT[2] - 5.6], stoneM, 3);
  b.build(root);
  setSightLines([]);

  // ---- the giant pie on the stage: the iron dish and the crust dome (its own group: it lifts at the end) ----
  const pie = new THREE.Group(), crust = new THREE.Group();
  const dish = new THREE.CylinderGeometry(DR, DR * 0.96, DD, 48, 1);
  const pd = new THREE.Mesh(dish, iron); pd.position.set(0, ST + DD / 2, 0);
  const rimP = new THREE.Mesh(new THREE.TorusGeometry(DR, 0.05, 6, 48), iron); rimP.rotation.x = Math.PI / 2; rimP.position.set(0, ST + DD, 0);
  pie.add(pd, rimP);
  const crustMat = lam("crust029", () => ({ map: crustTex("crust029", "#d9a15a") }));
  const dome = new THREE.SphereGeometry(1, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(DR + 0.06, CH, DR + 0.06);
  const dm = new THREE.Mesh(dome, crustMat); dm.position.set(0, ST + DD, 0);
  const crimp = new THREE.Mesh(new THREE.TorusGeometry(DR + 0.04, 0.09, 8, 48), crustMat); crimp.rotation.x = Math.PI / 2; crimp.position.set(0, ST + DD + 0.03, 0);
  const under = new THREE.Mesh(new THREE.CircleGeometry(DR + 0.06, 48), lam("crustU029", () => ({ color: "#e8c088", side: THREE.DoubleSide })));
  under.rotation.x = Math.PI / 2; under.position.set(0, ST + DD + 0.005, 0);
  crust.add(dm, crimp, under);
  pie.add(crust);
  pie.traverse((m) => { m.castShadow = true; m.receiveShadow = true; });
  root.add(pie);

  // the yard: the meat level in the open dish, and the closed crust of the waiting pie
  const fill = new THREE.Mesh(new THREE.CircleGeometry(DR * 0.97, 40), lam("meat029", () => ({ color: "#8a5a40" })));
  fill.rotation.x = -Math.PI / 2; fill.position.set(YD[0], YD[1] + 0.05, YD[2]); fill.receiveShadow = true;
  root.add(fill);
  const yc = new THREE.SphereGeometry(1, 48, 12, 0, Math.PI * 2, 0, Math.PI / 2); yc.scale(DR + 0.06, CH, DR + 0.06);
  const yardCrust = new THREE.Mesh(yc, crustMat); yardCrust.position.set(YD[0], YD[1] + DD, YD[2]); yardCrust.castShadow = true;
  root.add(yardCrust);
  void roofMat;
  return { pie, crust, fill, yardCrust };
};
