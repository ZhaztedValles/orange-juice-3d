// The places of the Cycloped story: the Rainhill course (a double track of iron rails on stone sleepers along x, a
// gravel bed, a white fence, the crowd's bank and a roofed grandstand behind it, tents, flags, the judges' table, trees
// and the low hills of Lancashire), the analogy road (a lane between hedges and two cottages) and the country line to
// Manchester (a track on a low bank across fields, the far chimneys of the town). Cast: cast.ts.
import * as THREE from "three";
import { Batch, V, lam, prop, house, setSightLines, Kit, Ray, boxGeo } from "../../src/engine/build";
import { rng, ctex, planks, stone } from "../../src/engine/paint";
import { D0, TZ0, TZ1, RT, GA, FENCE_Z, SX, KX, JUDGES } from "./story";

/** meadow grass: fresh green with darker tufts */
export const greenTex = () => ctex("green031", 512, 512, (g, r) => {
  g.fillStyle = "#86ab5c"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? "#79a052" : "#93b868"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 18 + r() * 50, 8 + r() * 16, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 220; i++) { g.fillStyle = r() < 0.7 ? "#6c9448" : "#adc77c"; g.fillRect(r() * 512, r() * 512, 3, 8 + r() * 6); }
});
/** field strips for the hills */
const hillTex = () => ctex("hill031", 512, 512, (g, r) => {
  g.fillStyle = "#8aa95e"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 128) {
    g.fillStyle = ["#7f9f56", "#97b468", "#b2b86c", "#86a65a"][Math.floor(r() * 4)]; g.fillRect(x + 2, y + 2, 124, 60);
  }
  g.strokeStyle = "#7d8a5a"; g.lineWidth = 3;
  for (let y = 0; y <= 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
});
/** the gravel bed of the track */
const gravelTex = () => ctex("gravel031", 256, 256, (g, r) => {
  g.fillStyle = "#a59a86"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) { g.fillStyle = ["#948a77", "#b5ab96", "#8a806f", "#c2b8a2"][Math.floor(r() * 4)]; g.beginPath(); g.ellipse(r() * 256, r() * 256, 3 + r() * 4, 2 + r() * 3, r() * 3, 0, Math.PI * 2); g.fill(); }
});
/** a striped tent canvas */
const tentTex = (key: string, c: string) => ctex(key, 256, 128, (g) => {
  g.fillStyle = "#f4ecd8"; g.fillRect(0, 0, 256, 128);
  g.fillStyle = c; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 32, 128);
});
/** the lane of the analogy road */
const laneTex = () => ctex("lane031", 256, 256, (g, r) => {
  g.fillStyle = "#c4ae84"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 120; i++) { g.fillStyle = r() < 0.5 ? "#b7a078" : "#d0bc94"; g.beginPath(); g.ellipse(r() * 256, r() * 256, 6 + r() * 14, 3 + r() * 6, 0, 0, Math.PI * 2); g.fill(); }
});

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(1829);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  const box = (bb: Batch, a: [number, number, number], c: [number, number, number], m: THREE.Material, t = 2) => bb.add(boxGeo(V(...a), V(...c), t), m);
  const wood = lam("wood031", () => ({ map: planks() }));
  const darkWood = lam("dwood031", () => ({ color: "#6a4a32" }));
  const white = lam("fence031", () => ({ color: "#ece6d6" }));
  const iron = lam("rail031", () => ({ color: "#5a5652" }));
  const sleeperM = lam("sleeper031", () => ({ map: stone("sleep031", ["#a39a88", "#958c7a", "#aea592"]) }));
  const gravel = lam("gravel031", () => ({ map: gravelTex() }));
  const hillM = lam("hill031", () => ({ map: hillTex() }));
  const lane = lam("lane031", () => ({ map: laneTex() }));
  const cloth = lam("cloth031", () => ({ color: "#2f5f6a" }));
  const brick = lam("brick031", () => ({ color: "#9a5a44" }));

  setSightLines(rays);
  // ---- a track: gravel bed, stone sleepers (block sleepers, as on the early line) and two iron rails ----
  const track = (x0: number, x1: number, z: number) => {
    box(b, [x0, D0 - 0.1, z - 1.25], [x1, D0 + 0.05, z + 1.25], gravel, 3);
    for (let x = x0 + 0.4; x < x1; x += 0.9) box(b, [x - 0.2, D0 + 0.05, z - GA - 0.28], [x + 0.2, D0 + 0.1, z + GA + 0.28], sleeperM, 1);
    for (const s of [-1, 1]) {
      box(b, [x0, D0 + 0.1, z + s * GA - 0.045], [x1, D0 + RT - 0.03, z + s * GA + 0.045], iron, 1);
      box(b, [x0, D0 + RT - 0.03, z + s * GA - 0.06], [x1, D0 + RT, z + s * GA + 0.06], iron, 1);
    }
  };
  track(-70, 70, TZ0);
  track(-70, 70, TZ1);
  // ---- the white fence between the far track and the crowd ----
  for (let x = -40; x <= 40; x += 2.5) box(b, [x - 0.06, D0, FENCE_Z - 0.06], [x + 0.06, D0 + 1.1, FENCE_Z + 0.06], white, 1);
  for (const y of [0.55, 1.0]) box(b, [-40, D0 + y - 0.05, FENCE_Z - 0.03], [40, D0 + y + 0.05, FENCE_Z + 0.03], white, 1);
  // ---- the grandstand: four wooden steps under a roof on posts ----
  for (let k = 0; k < 4; k++) box(b, [-9, D0, -12.5 - k * 1.1], [9, D0 + 0.5 + 0.5 * k, -11.4 - k * 1.1], k % 2 ? wood : darkWood, 2);
  for (let x = -9; x <= 9; x += 4.5) box(b, [x - 0.1, D0, -16.9], [x + 0.1, D0 + 5.0, -16.7], darkWood, 1);
  for (let x = -9; x <= 9; x += 4.5) box(b, [x - 0.1, D0, -11.5], [x + 0.1, D0 + 4.4, -11.3], darkWood, 1);
  const roofG = new THREE.BufferGeometry().setFromPoints([V(-9.6, D0 + 4.4, -11.0), V(9.6, D0 + 4.4, -11.0), V(9.6, D0 + 5.2, -17.2), V(-9.6, D0 + 5.2, -17.2)]);
  roofG.setIndex([0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2]); roofG.computeVertexNormals();
  b.add(roofG, lam("standRoof031", () => ({ map: tentTex("roofT031", "#b8402f"), side: THREE.DoubleSide })));
  // ---- tents along the course, flags on poles ----
  const tent = (x: number, z: number, c: string) => {
    const m = lam("tent" + c, () => ({ map: tentTex("tentT" + c, c), side: THREE.DoubleSide }));
    box(b, [x - 1.6, D0, z - 1.4], [x + 1.6, D0 + 1.8, z + 1.4], m, 3);
    const g = new THREE.ConeGeometry(2.3, 1.6, 4, 1); g.rotateY(Math.PI / 4); g.translate(x, D0 + 2.6, z);
    b.add(g, m);
  };
  tent(-18, -10, "#2f5f9a"); tent(16, -10.5, "#c0392b"); tent(24, -9.5, "#3f7a4a"); tent(-26, -9, "#d9a441");
  for (const x of [-12, 12, -30, 30]) {
    box(b, [x - 0.06, D0, -8.4], [x + 0.06, D0 + 6.0, -8.3], darkWood, 1);
    const fl = new THREE.PlaneGeometry(1.4, 0.8); fl.translate(x + 0.75, D0 + 5.5, -8.35);
    b.add(fl, lam("flag031", () => ({ color: "#c0392b", side: THREE.DoubleSide })));
    const cr = new THREE.PlaneGeometry(1.4, 0.16); cr.translate(x + 0.75, D0 + 5.5, -8.33);
    b.add(cr, lam("flagW031", () => ({ color: "#f2f0e6", side: THREE.DoubleSide })));
    const cv = new THREE.PlaneGeometry(0.16, 0.8); cv.translate(x + 0.75, D0 + 5.5, -8.32);
    b.add(cv, lam("flagW031", () => ({ color: "#f2f0e6", side: THREE.DoubleSide })));
  }
  // ---- the judges' table by the near track, with a cloth ----
  box(b, [JUDGES[0] - 1.3, D0, JUDGES[2] - 1.0], [JUDGES[0] + 1.3, D0 + 0.78, JUDGES[2] - 0.2], darkWood, 2);
  box(b, [JUDGES[0] - 1.36, D0 + 0.78, JUDGES[2] - 1.06], [JUDGES[0] + 1.36, D0 + 0.84, JUDGES[2] - 0.14], cloth, 2);
  box(b, [JUDGES[0] - 1.36, D0 + 0.3, JUDGES[2] - 0.17], [JUDGES[0] + 1.36, D0 + 0.84, JUDGES[2] - 0.14], cloth, 2);
  // ---- trees and the low hills ----
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = 30 + r() * 70, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z > -14 && Math.abs(x) < 45) continue; // keep the course and the views from the front clear
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x, D0, z, 7 + r() * 6, r() * 6);
  }
  const hills = (cx: number, list: number[][]) => {
    for (const [hx, hz, hr, hh] of list) {
      const g = new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      g.scale(hr, hh, hr * 0.7); g.translate(cx + hx, D0 - 2, hz);
      const uv = g.getAttribute("uv") as THREE.BufferAttribute;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 12, uv.getY(k) * 3);
      b.add(g, hillM);
    }
  };
  hills(0, [[-120, -230, 150, 40], [90, -260, 170, 55], [260, -120, 150, 40], [-260, -90, 160, 45], [10, -330, 200, 60]]);

  // ---- the analogy road: a lane between hedges, two cottages behind ----
  box(b, [SX - 30, D0 - 0.1, -1.8], [SX + 30, D0 + 0.04, 1.8], lane, 3);
  house(b, SX - 6, -9, 0, 7, 6, 7, 6, D0);
  house(b, SX + 4, -9.5, 0, 8, 6, 8.4, 1, D0);
  for (let i = 0; i < 10; i++) prop(b, kit, "hedge", SX - 20 + i * 4.4, D0, -3.2, 1.2, r() * 3);
  for (let i = 0; i < 20; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), SX - 40 + r() * 80, D0, -16 - r() * 30, 7 + r() * 5, r() * 6);

  // ---- the country line: a track on a low bank, fields, Manchester's far chimneys ----
  box(b, [KX - 90, D0 - 0.2, -2.2], [KX + 90, D0 + 0.35, 2.2], lam("bank031", () => ({ color: "#7e9a52" })), 3);
  const bt = new Batch();
  bt.add(boxGeo(V(KX - 90, D0 + 0.35, -1.25), V(KX + 90, D0 + 0.45, 1.25), 3), gravel);
  for (let x = KX - 89.6; x < KX + 90; x += 0.9) bt.add(boxGeo(V(x - 0.2, D0 + 0.45, -GA - 0.28), V(x + 0.2, D0 + 0.5, GA + 0.28), 1), sleeperM);
  for (const s of [-1, 1]) bt.add(boxGeo(V(KX - 90, D0 + 0.5, s * GA - 0.05), V(KX + 90, D0 + 0.5 + 0.13, s * GA + 0.05), 1), iron);
  bt.build(root);
  for (let i = 0; i < 24; i++) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), KX - 60 + r() * 120, D0, -14 - r() * 40, 7 + r() * 5, r() * 6);
  for (let i = 0; i < 9; i++) {
    const x = KX - 70 + i * 16 + r() * 6, z = -150 - r() * 30, h = 14 + r() * 10;
    box(b, [x - 1.2, D0, z - 1.2], [x + 1.2, D0 + h, z + 1.2], brick, 3);
    box(b, [x - 6, D0, z + 3], [x + 6, D0 + 6 + r() * 3, z + 9], brick, 3);
  }
  hills(KX, [[-100, -260, 160, 40], [120, -280, 170, 48]]);
  b.build(root);
  setSightLines([]);
};
