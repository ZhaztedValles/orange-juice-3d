// The bridge template's town on both banks: riverfront, main-street and back rows of gabled houses, church with
// tower, spire and clock, mill + chimneys, hills, trees, quay furniture and the park around the swing.
import * as THREE from "three";
import { Batch, V, lam, quad, tri, boxGeo, prop, house, roofMat, setSightLines, Kit, Ray } from "../../src/engine/build";
import { brick, rng, ctex, rep, facadeHD, stoneHD } from "../../src/engine/paint";
import { D0 } from "./story";

// ---------------- painted extras ----------------
const chapelTex = () => ctex("chapel", 512, 512, (g) => {
  g.fillStyle = "#e9e0cc"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(0,0,0,.06)"; for (let y = 0; y < 512; y += 32) g.fillRect(0, y, 512, 2);
  for (const cx of [128, 384]) {
    g.fillStyle = "#33406b"; g.strokeStyle = "rgba(40,30,40,.85)"; g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx - 40, 430); g.lineTo(cx - 40, 190); g.arc(cx, 190, 40, Math.PI, 0); g.lineTo(cx + 40, 430); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "rgba(160,200,255,.35)"; g.fillRect(cx - 30, 200, 16, 220);
    g.strokeStyle = "#d9c9a0"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, 160); g.lineTo(cx, 430); g.moveTo(cx - 40, 300); g.lineTo(cx + 40, 300); g.stroke();
  }
});
const clockTex = () => ctex("clock", 256, 256, (g) => {
  g.fillStyle = "#f7f1e1"; g.strokeStyle = "#221f2e"; g.lineWidth = 12;
  g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill(); g.stroke();
  g.lineCap = "round";
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.lineWidth = 8; g.beginPath(); g.moveTo(128 + 80 * Math.cos(a), 128 + 80 * Math.sin(a)); g.lineTo(128 + 96 * Math.cos(a), 128 + 96 * Math.sin(a)); g.stroke(); }
  g.lineWidth = 12; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 62); g.stroke();
  g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(178, 150); g.stroke();
});
/** round 4: St George's cross (England, 1831): white field, red cross (the old red + yellow diamond read as Vietnam's flag) */
export const flagTex = () => ctex("flagStGeorge", 256, 160, (g) => {
  g.fillStyle = "#f4f0e6"; g.fillRect(0, 0, 256, 160);
  g.fillStyle = "#c8323a"; g.fillRect(0, 62, 256, 36); g.fillRect(110, 0, 36, 160);
  g.fillStyle = "rgba(120,100,90,0.10)"; g.fillRect(0, 150, 256, 10); // soft hem shade
});

// ---------------- town ----------------
const inPark = (x: number, z: number) => z < 0 && x > 46 && x < 96 && z > -100 && z < -49;
const inMill = (x: number, z: number) => z < 0 && x > -66 && x < -14 && z > -90 && z < -54;
const inChurch = (x: number, z: number) => (z > 0 && x > 10 && x < 38 && z > 46 && z < 84) || (z > 0 && x > 86 && x < 110 && z > 60 && z < 84);

export const buildTown = (root: THREE.Object3D, kit: Kit, rays: Ray[] = []) => {
  const b = new Batch(), r = rng(11);
  setSightLines(rays);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  for (const bank of [-1, 1]) {
    const away = bank > 0 ? Math.PI : 0; // fronts face the river
    // riverfront rows, fronts on the quay at |z| = 36.5
    for (const sx of [-1, 1]) {
      let x = 8.5;
      while (x < 134) {
        const w = pick([7, 9]), h = pick([7, 8.4, 9.8]), cx = sx * (x + w / 2), cz = bank * 40.5;
        house(b, cx, cz, away, w, 8, h, Math.floor(r() * 8));
        x += w + (r() < 0.25 ? 2.5 : 0.25);
      }
    }
    // main street, fronts on |x| = 6
    for (const sx of [-1, 1]) {
      let z = 46;
      while (z < 150) {
        const w = pick([7, 9]), h = pick([7, 8.4, 9.8]);
        if (!inChurch(sx * 10, bank * (z + w / 2))) house(b, sx * 10, bank * (z + w / 2), sx < 0 ? Math.PI / 2 : -Math.PI / 2, w, 8, h, Math.floor(r() * 8));
        z += w + (r() < 0.2 ? 3 : 0.3);
      }
    }
    // back rows
    for (const zf of [52, 66, 80, 96]) for (const sx of [-1, 1]) {
      let x = 17 + r() * 4;
      while (x < 124) {
        const w = pick([7, 9]), h = pick([7, 8.4, 9.8]), cx = sx * (x + w / 2), cz = bank * (zf + 4 + r() * 2);
        if (r() > 0.22 && !inPark(cx, cz) && !inMill(cx, cz) && !inChurch(cx, cz)) house(b, cx, cz, away, w, 8, h, Math.floor(r() * 8));
        x += w + 1 + r() * 4;
      }
    }
  }
  // church on the far bank: nave, tower, spire, clock
  const ch = lam("chapel", () => ({ map: chapelTex() })), st = lam("towerstone", () => ({ map: stoneHD("tstoneHD") })); // 2048 canvas at its own repeat 0.5 (paint.ts)
  b.add(boxGeo(V(18.5, D0, 57), V(29.5, D0 + 9, 80), 6), ch);
  const sl = roofMat("#8f97a8");
  b.add(quad(V(18.1, D0 + 8.8, 57), V(18.1, D0 + 8.8, 80.4), V(24, D0 + 13.5, 80.4), V(24, D0 + 13.5, 57), 6, 2), sl);
  b.add(quad(V(29.9, D0 + 8.8, 80.4), V(29.9, D0 + 8.8, 57), V(24, D0 + 13.5, 57), V(24, D0 + 13.5, 80.4), 6, 2), sl);
  b.add(tri(V(18.5, D0 + 9, 80), V(29.5, D0 + 9, 80), V(24, D0 + 13.5, 80)), st);
  b.add(boxGeo(V(21.4, D0, 51.6), V(26.6, D0 + 19, 57), 4), st);
  b.add(boxGeo(V(21.1, D0 + 18.6, 51.3), V(26.9, D0 + 19.4, 57.3), 4), st);
  const spire = new THREE.ConeGeometry(4.0, 13, 4, 1);
  spire.rotateY(Math.PI / 4);
  b.add(spire, sl, new THREE.Matrix4().makeTranslation(24, D0 + 19.4 + 6.5, 54.3));
  b.add(tri(V(29.5, D0 + 9, 57), V(18.5, D0 + 9, 57), V(24, D0 + 13.5, 57)), st);
  b.add(quad(V(25.1, D0 + 12.4, 51.55), V(22.9, D0 + 12.4, 51.55), V(22.9, D0 + 14.6, 51.55), V(25.1, D0 + 14.6, 51.55)), lam("clock", () => ({ map: clockTex(), alphaTest: 0.5 })));
  // mill (near bank) + chimneys with smoke handled in the world
  const mill = lam("mill", () => ({ map: facadeHD("mill", 30, 13, { wall: "#b5543c", shutter: "#3b3f52", brick: true }) }));
  const millS = lam("mills", () => ({ map: facadeHD("mills", 12, 13, { wall: "#b5543c", shutter: "#3b3f52", brick: true }) }));
  b.add(quad(V(-58, D0, -70), V(-28, D0, -70), V(-28, D0 + 13, -70), V(-58, D0 + 13, -70)), mill);
  b.add(quad(V(-28, D0, -82), V(-58, D0, -82), V(-58, D0 + 13, -82), V(-28, D0 + 13, -82)), mill);
  b.add(quad(V(-58, D0, -82), V(-58, D0, -70), V(-58, D0 + 13, -70), V(-58, D0 + 13, -82)), millS);
  b.add(quad(V(-28, D0, -70), V(-28, D0, -82), V(-28, D0 + 13, -82), V(-28, D0 + 13, -70)), millS);
  b.add(quad(V(-58.4, D0 + 12.8, -69.6), V(-27.6, D0 + 12.8, -69.6), V(-27.6, D0 + 16.5, -76), V(-58.4, D0 + 16.5, -76), 8, 2), sl);
  b.add(quad(V(-27.6, D0 + 12.8, -82.4), V(-58.4, D0 + 12.8, -82.4), V(-58.4, D0 + 16.5, -76), V(-27.6, D0 + 16.5, -76), 8, 2), sl);
  b.add(tri(V(-58, D0 + 13, -82), V(-58, D0 + 13, -70), V(-58, D0 + 16.5, -76)), millS);
  b.add(tri(V(-28, D0 + 13, -70), V(-28, D0 + 13, -82), V(-28, D0 + 16.5, -76)), millS);
  const chim = lam("chimney", () => ({ map: rep(brick(), 2, 8) })), soot = lam("soot", () => ({ color: "#4a3442" }));
  for (const [x, z, hh] of [[-22, -77, 30], [-80, 93, 24]] as const) {
    b.add(new THREE.CylinderGeometry(0.95, 1.35, hh, 14, 1, true), chim, new THREE.Matrix4().makeTranslation(x, D0 + hh / 2, z));
    b.add(new THREE.CylinderGeometry(1.15, 1.1, 1.3, 14), soot, new THREE.Matrix4().makeTranslation(x, D0 + hh + 0.3, z));
  }
  house(b, -80, 100, Math.PI, 16, 10, 9.8, 7);
  // hills around the valley
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" })), lam("hillC", () => ({ color: "#8bbf63" }))];
  ([[-360, 250, 190, 52, 120], [140, 380, 240, 64, 140], [430, 150, 170, 48, 130], [-440, -130, 190, 44, 150], [-90, -390, 250, 58, 140],
    [320, -330, 210, 54, 130], [520, -60, 160, 40, 120], [-560, 60, 200, 46, 140]] as const).forEach(([x, z, sx, sy, sz], i) =>
    b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(x, D0 - 2, z), new THREE.Quaternion(), V(sx, sy, sz))));
  // trees: quays, gardens, valley, hilltops
  const trees = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree"];
  for (const bank of [-1, 1]) for (let x = -130; x <= 130; x += 22) if (Math.abs(x) > 12) prop(b, kit, pick(trees), x + r() * 4, D0, bank * 33.6, 7 + r() * 2.5, r() * 6);
  for (let i = 0; i < 140; i++) {
    const x = (r() - 0.5) * 520, z = (r() < 0.5 ? -1 : 1) * (48 + r() * 220);
    if (inPark(x, z) || inMill(x, z) || inChurch(x, z) || Math.abs(x) < 16) continue;
    prop(b, kit, pick(trees), x, D0, z, 7 + r() * 4, r() * 6);
  }
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, d = 230 + r() * 160;
    prop(b, kit, pick(["tree_cone", "tree_default", "tree_oak"]), Math.cos(a) * d * 1.3, D0, Math.sin(a) * d, 12 + r() * 6, r() * 6);
  }
  // quay furniture
  for (const bank of [-1, 1]) {
    for (let x = -126; x <= 126; x += 12) if (Math.abs(x) > 5) prop(b, kit, "lantern", x, D0, bank * 31.0, 2.8);
    prop(b, kit, "banner-red", 5.4, D0, bank * 31.6, 3.6, bank > 0 ? Math.PI : 0);
  }
  prop(b, kit, "stall-red", -14, D0, -34, 3.2);
  prop(b, kit, "stall-green", -21.5, D0, -34.4, 3.2, 0.1);
  // round 4: this cart sat blurred in shot 11's bottom-left corner (lens at 14, 10.5, -47) as a grey "mushroom"
  // (bed + handle + wheel); moved 3.5 m along the quay, out of that frame, still dressing the market
  prop(b, kit, "cart", 17.0, D0, -34.0, 2.2, 1.2);
  prop(b, kit, "stall-bench", 20, D0, -32.2, 1.0);
  prop(b, kit, "stall-green", 16, D0, 34, 3.2, Math.PI);
  prop(b, kit, "stall-red", 23.5, D0, 34.3, 3.2, Math.PI);
  prop(b, kit, "cart", -15, D0, 33.6, 2.2, 2.4);
  prop(b, kit, "windmill", 98, D0, 72, 16, -0.6);
  prop(b, kit, "canoe", -19, 0.02, 27.6, 0.7, 1.5);
  prop(b, kit, "canoe", 31, 0.02, -28.2, 0.7, -1.4);
  for (let i = 0; i < 14; i++) prop(b, kit, "lily_large", (r() - 0.5) * 120, 0.03, (r() < 0.5 ? -1 : 1) * (27.2 + r() * 2.2), 0.08, r() * 6);
  // park around the swing (near bank, x 50..92, z -96..-56)
  for (const [n, x, z, h] of [["tree_oak", 58, -66, 9.5], ["tree_fat", 84, -64, 8], ["tree_detailed", 54, -84, 9], ["tree_default", 88, -86, 9],
    ["tree_oak", 79, -95, 10], ["tree-high-round", 61, -94, 9], ["tree_default", 92, -73, 8.5]] as const) prop(b, kit, n, x, D0, z, h, x);
  for (let x = 50; x < 92; x += 3.2) prop(b, kit, "hedge", x, D0, -57, 1.5);
  for (const [x, z] of [[62, -76], [77, -71], [66, -82], [75, -80], [57, -73]]) prop(b, kit, pick(["plant_bushLarge", "plant_bushDetailed", "plant_bush"]), x, D0, z, 1.3);
  // flowers only (inked grass tufts read as green boxes), and none inside the swing's 4 m circle
  for (let i = 0; i < 26; i++) {
    const f = pick(["flower_redA", "flower_yellowA", "flower_purpleA"]), x = 56 + r() * 30, z = -60 - r() * 32;
    if (Math.hypot(x - 70, z + 75) > 4) prop(b, kit, f, x, D0, z, 0.5);
  }
  prop(b, kit, "stall-bench", 76.5, D0, -79.5, 1.0, Math.PI);
  prop(b, kit, "lantern", 64.5, D0, -71, 2.8);
  b.build(root);
  setSightLines([]);
};
