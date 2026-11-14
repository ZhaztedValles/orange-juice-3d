// The whole place as one three.js scene: sky, the arsenal yard and the Munich street (town.ts), the boring machine
// (horse gin with its two sweeps, the tumbling shafts, the brass casting turning on its trestles, the fixed blunt
// drill on its weighted sledge), the wooden box of water round the casting's end, clouds and the cast.
// update(id, f, camera) poses everything for shot `id` at frame f (pure function).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit, Ray, kitClone, setSightLines } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { ctex, grassHD, cloudHD, planks } from "../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown } from "./town";
import { stage } from "./cast";
import { FPS, D0, SHOTS, camAt, FOREGROUND, ShotDef, AX, BOX, WATER_Y, GIN, GIN_R, ginAngle, boxOn } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "plant_bushDetailed", "lantern"];
export const loadKit = () => loadKenney(KENNEY);
/** sun disc (solid, soft rim) and the flat golden halo (lighting.md 6 / depth.md 6.4: r50 13-26 % of the frame width) */
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const haloTex = () => ctex("sunHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});

/** every lens position of the film looking at its subject: centre, sides and top of frame (houses there are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a - 8; f < s.b + 8; f += 2) {
    const c = camAt(s.id, Math.max(0, f)), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length();
    fw.normalize();
    const rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
    const ty = Math.tan((c.fov * Math.PI) / 360), tx = ty * (9 / 16);
    for (const [sx, sy] of [[0, 0], [-0.6, 0], [0.6, 0], [0, 0.6], [0, -0.4], [0, -0.85], [-0.6, -0.85], [0.6, -0.85], [0, -1], [-0.7, -1], [0.7, -1], [-1, -0.5], [1, -0.5], [-1, 0], [1, 0]])
      out.push({ o, d: fw.clone().addScaledVector(rt, sx * tx).addScaledVector(up, sy * ty), len, core: sx === 0 && sy === 0 });
  }
  return out;
};

const SUN_SHOT: Record<number, { az?: number; el?: number }> = {};
type Mats = Record<string, THREE.Material>;


export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight; private fill: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite; private sunHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private fgs: { o: THREE.Object3D; a: number; b: number }[] = [];
  private clouds: THREE.Mesh[] = [];
  private sweep = new THREE.Group(); private casting = new THREE.Group(); private box = new THREE.Group();
  private shafts: THREE.Object3D[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky + light ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1, 1, 1), fog: false, depthWrite: false, depthTest: true,
      transparent: true, blending: THREE.AdditiveBlending }));
    this.sunDisc.renderOrder = -0.5; this.sunHalo.renderOrder = 5;
    for (const m of [this.sunDisc, this.sunHalo]) { m.frustumCulled = false; m.layers.set(NOINK); R.add(m); }
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }


    // ---- ground (60 x 60 cells: one huge two-triangle quad lost its texture and fog on single frames in 006) ----
    const b = new Batch();
    const grass = lam("grassHD", () => ({ map: grassHD() }));
    const gg = new THREE.PlaneGeometry(1800, 1800, 60, 60);
    gg.rotateX(-Math.PI / 2); gg.translate(200, D0, 200);
    const uv = gg.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 450, uv.getY(i) * 450);
    b.add(gg, grass);
    b.build(R);
    buildTown(R, kit, sightLines());

    // ---- the boring machine ----
    const MC = (k: string, c: string) => lam(k, () => ({ color: c }));
    const oak = MC("mOak", "#8a5a34"), dark = MC("mDark", "#5e3b26"), steel = MC("mSteel", "#8d939c"), blk = MC("mIron", "#3a383e");
    const brass = MC("mBrass", "#c49a48"), boards = lam("boxPlanks", () => ({ map: planks() })), stoneW = MC("mStone", "#9a9288");
    const water = MC("mWater", "#5f9bc4");
    const add = (g: THREE.Object3D, a: number[], c: number[], m: THREE.Material) => { const o = new THREE.Mesh(boxGeo(V(a[0], a[1], a[2]), V(c[0], c[1], c[2]), 2), m); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    const cyl = (g: THREE.Object3D, r0: number, r1: number, h: number, m: THREE.Material, n = 18) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, n), m); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    const G0 = D0 + 0.08;
    // the gin: upright post, crown wheel, two sweeps (the horses are cards, hitched at the sweep ends)
    const ginPost = cyl(R, 0.2, 0.24, 3.4, oak); ginPost.position.set(GIN[0], G0 + 1.7, GIN[2]);
    const crown = cyl(R, 1.0, 1.0, 0.18, dark, 28); crown.position.set(GIN[0], G0 + 0.55, GIN[2]);
    this.sweep.position.set(GIN[0], G0 + 1.55, GIN[2]);
    add(this.sweep, [-GIN_R - 0.2, -0.09, -0.09], [GIN_R + 0.2, 0.09, 0.09], oak);
    add(this.sweep, [-0.3, -0.5, -0.3], [0.3, 0.12, 0.3], dark);
    R.add(this.sweep);
    // the tumbling shafts: along z from the gin to a gear box, then along x to the casting's breech
    const sh1 = cyl(R, 0.08, 0.08, -GIN[2] - 0.5, oak, 10); sh1.rotation.x = Math.PI / 2; sh1.position.set(GIN[0], G0 + 0.45, (GIN[2] - 0.5) / 2);
    add(R, [GIN[0] - 0.55, G0, -0.6], [GIN[0] + 0.55, G0 + 1.5, 0.6], dark);
    const sh2 = cyl(R, 0.09, 0.09, -3.6 - GIN[0] - 0.55, oak, 10); sh2.rotation.z = Math.PI / 2; sh2.position.set((GIN[0] + 0.55 - 3.6) / 2, AX, 0);
    sh2.rotation.order = "ZYX";
    this.shafts.push(sh1, sh2);
    // trestles with bearing blocks at x = -3.0 and -0.9
    for (const tx of [-3.0, -0.9]) {
      for (const sz of [-0.55, 0.55]) add(R, [tx - 0.12, G0, sz - 0.12], [tx + 0.12, AX - 0.2, sz + 0.12], oak);
      add(R, [tx - 0.16, AX - 0.32, -0.7], [tx + 0.16, AX - 0.18, 0.7], dark);
      add(R, [tx - 0.18, AX - 0.18, -0.36], [tx + 0.18, AX - 0.06, 0.36], blk);
    }
    // the casting: a solid brass gun blank, breech knob at -3.6, trunnions, its turned end (x -0.3..0.55) in the box
    this.casting.position.set(0, AX, 0);
    const body = cyl(this.casting, 0.24, 0.32, 3.3, brass, 22); body.rotation.z = Math.PI / 2; body.position.x = -1.95;
    const endC = cyl(this.casting, 0.25, 0.25, 0.9, brass, 22); endC.rotation.z = Math.PI / 2; endC.position.x = 0.15;
    for (const bx of [-3.3, -0.4]) { const r = cyl(this.casting, 0.35, 0.35, 0.12, brass, 22); r.rotation.z = Math.PI / 2; r.position.x = bx; }
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), brass); knob.position.x = -3.75; this.casting.add(knob);
    const tr = cyl(this.casting, 0.09, 0.09, 0.95, brass, 12); tr.rotation.x = Math.PI / 2; tr.position.x = -2.2;
    add(this.casting, [-1.75, 0.22, -0.05], [-1.35, 0.36, 0.05], blk); // a clamp lug: shows the turning
    R.add(this.casting);
    // the blunt drill: a steel bar on a weighted sledge, pressed into the casting's end
    const bar = cyl(R, 0.06, 0.06, 3.1, steel, 12); bar.rotation.z = Math.PI / 2; bar.position.set(0.55 + 1.55, AX, 0);
    const tip = cyl(R, 0.11, 0.11, 0.16, steel, 14); tip.rotation.z = Math.PI / 2; tip.position.set(0.63, AX, 0);
    add(R, [3.2, G0, -0.5], [4.3, AX - 0.08, 0.5], oak); // the sledge
    add(R, [3.3, AX + 0.08, -0.45], [4.2, AX + 0.62, 0.45], stoneW); // the stone weights
    add(R, [3.25, AX - 0.1, -0.14], [3.35, AX + 0.12, 0.14], blk);
    add(R, [4.2, G0, -0.07], [5.6, G0 + 0.12, 0.07], dark); // the lever beam to the ground stake
    // the wooden box of water round the casting's end (the bar and casting pass through its end walls)
    const wt = 0.07;
    add(this.box, [BOX.x0, BOX.y0, BOX.z0], [BOX.x1, BOX.y0 + wt, BOX.z1], boards);
    add(this.box, [BOX.x0, BOX.y0, BOX.z0], [BOX.x1, BOX.y1, BOX.z0 + wt], boards);
    add(this.box, [BOX.x0, BOX.y0, BOX.z1 - wt], [BOX.x1, BOX.y1, BOX.z1], boards);
    add(this.box, [BOX.x1 - wt, BOX.y0, BOX.z0], [BOX.x1, BOX.y1, BOX.z1], boards); // the drill end: the bar passes through
    for (const ex of [BOX.x0]) {
      add(this.box, [ex, BOX.y0, BOX.z0], [ex + wt, AX - 0.34, BOX.z1], boards);
      add(this.box, [ex, AX + 0.34, BOX.z0], [ex + wt, BOX.y1, BOX.z1], boards);
      add(this.box, [ex, AX - 0.34, BOX.z0], [ex + wt, AX + 0.34, -0.3], boards);
      add(this.box, [ex, AX - 0.34, 0.3], [ex + wt, AX + 0.34, BOX.z1], boards);
    }
    for (const [lx, lz] of [[BOX.x0 + 0.1, BOX.z0 + 0.1], [BOX.x1 - 0.1, BOX.z0 + 0.1], [BOX.x0 + 0.1, BOX.z1 - 0.1], [BOX.x1 - 0.1, BOX.z1 - 0.1]]) add(this.box, [lx - 0.07, G0, lz - 0.07], [lx + 0.07, BOX.y0, lz + 0.07], dark);
    for (const by of [BOX.y0 + 0.3, BOX.y1 - 0.25]) for (const bz of [BOX.z0 - 0.02, BOX.z1 - 0.01]) add(this.box, [BOX.x0 - 0.02, by, bz], [BOX.x1 + 0.02, by + 0.06, bz + 0.03], blk);
    const wq = new THREE.Mesh(new THREE.PlaneGeometry(BOX.x1 - BOX.x0 - 2 * wt, BOX.z1 - BOX.z0 - 2 * wt), water);
    wq.rotation.x = -Math.PI / 2; wq.position.set((BOX.x0 + BOX.x1) / 2, WATER_Y, 0); wq.receiveShadow = true;
    this.box.add(wq);
    R.add(this.box);

    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
    setSightLines([]);
  }

  /** camera-relative sun, frozen per shot: the shot's mean view direction turned by az toward screen right, lifted by el */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(SUN_SHOT[id]?.az ?? L.az), el = THREE.MathUtils.degToRad(SUN_SHOT[id]?.el ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az); // screen right = (-fz, fx)
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.1; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK); // sky, clouds and sun sprites live on the no-ink layer but are still rendered
    // ---- light rig: camera-relative sun frozen per shot, two-tone uniforms, shadow fit ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 7, 12, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    this.fill.intensity = 0;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...LOOK[s.light].bounce); TONE.uSat.value = LOOK[s.light].sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc + halo, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const showSun = s.light === "golden";
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.position.x = cam.position.x + Math.cos((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.position.z = cam.position.z + Math.sin((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    // ---- the machine: the gin turns, the shafts and the casting spin (geared up), the box comes in for the experiment ----
    const th = ginAngle(t);
    this.sweep.rotation.y = -th;
    this.casting.rotation.x = th * 8;
    for (const sft of this.shafts) sft.rotation.y = th * 8;
    this.box.visible = boxOn(id);

    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const tint = s.light === "golden" ? "#ffcf9e" : "#ffffff";
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      if (a.mat.emissiveMap) a.mat.emissive.set(tint);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}
