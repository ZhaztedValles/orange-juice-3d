// The whole place as one three.js scene: sky, the meadow with the ring of two hundred monks and the iron wire that
// joins their hands (a camera-facing ribbon rebuilt every frame, glowing when the shock runs through it), the
// monastery, its garden with the wall, tap and hose, a Paris street, Versailles, clouds and the cast.
// update(id, f, camera) poses everything for shot `id` at frame f (pure function).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit, Ray, kitClone, setSightLines } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { beam, ctex, grassHD, cloudHD, stoneHD } from "../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown } from "./town";
import { stage, wireEnds } from "./cast";
import { FPS, D0, SHOTS, camAt, FOREGROUND, ShotDef, JS, STAND_Y, PTAB, GAR, VER, DIRV, glowAt, tapAt, T_TAP } from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "flower_redA", "flower_yellowA", "flower_purpleA", "grass_large", "grass", "lantern"];
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
const MAXW = 260; // wire spans drawn per frame
const SEG = 6; // ribbon pieces per span (the sag)


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
  private wire: THREE.Mesh; private wireMat: THREE.MeshBasicMaterial; private wirePos: Float32Array;
  private hose: THREE.Mesh; private handle: THREE.Mesh;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root, M: Mats = {};
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

    // ---- ground, the jar stands, the garden wall and tap (static batch) ----
    const b = new Batch();
    M.grass = lam("grassHD", () => ({ map: grassHD() }));
    M.wood = lam("wood", () => ({ map: beam() }));
    M.cloth = lam("tableTop", () => ({ color: "#efe6d2" }));
    M.wall = lam("gardenWall", () => ({ map: stoneHD("gardenWallHD") }));
    M.brass = lam("brass", () => ({ color: "#c9a047" }));
    const gg = new THREE.PlaneGeometry(1800, 1800, 1, 1);
    gg.rotateX(-Math.PI / 2); gg.translate(0, D0, 0);
    const uv = gg.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 450, uv.getY(i) * 450);
    b.add(gg, M.grass);
    // small tables: the jar stand in the ring's gap, Nollet's table in Paris, the stand at Versailles
    const table = (x: number, z: number, w: number, d: number, top: number) => {
      b.add(boxGeo(V(x - w / 2, top - 0.06, z - d / 2), V(x + w / 2, top, z + d / 2), 2), M.cloth);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(boxGeo(V(x + sx * (w / 2 - 0.08) - 0.035, D0, z + sz * (d / 2 - 0.08) - 0.035), V(x + sx * (w / 2 - 0.08) + 0.035, top - 0.06, z + sz * (d / 2 - 0.08) + 0.035), 2), M.wood);
    };
    table(JS[0], JS[2], 0.7, 0.55, STAND_Y);
    table(PTAB[0], PTAB[2], 1.3, 0.7, STAND_Y);
    table(VER[0] - DIRV[0] * 1.3, VER[2] - DIRV[2] * 1.3, 0.7, 0.55, STAND_Y);
    // the garden wall behind the tap, and the tap's pipe and spout
    b.add(boxGeo(V(GAR[0] - 6, D0, GAR[2] - 6.6), V(GAR[0] + 8, D0 + 2.1, GAR[2] - 6.1), 2), M.wall);
    b.add(boxGeo(V(GAR[0] - 6.1, D0 + 2.1, GAR[2] - 6.7), V(GAR[0] + 8.1, D0 + 2.25, GAR[2] - 6.0), 2), M.wall);
    b.add(boxGeo(V(GAR[0] - 0.05, D0 + 0.55, GAR[2] - 6.1), V(GAR[0] + 0.05, D0 + 1.0, GAR[2] - 5.95), 2), M.brass);
    b.add(boxGeo(V(GAR[0] - 0.045, D0 + 0.5, GAR[2] - 6.0), V(GAR[0] + 0.045, D0 + 0.6, GAR[2] - 5.82), 2), M.brass);
    b.build(R);
    buildTown(R, kit, sightLines());
    // the tap's handle (turns when it opens)
    this.handle = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.04), M.brass);
    this.handle.position.set(GAR[0], D0 + 1.02, GAR[2] - 5.98); R.add(this.handle);
    // the hose: a green tube from the spout across the grass to the nozzle in the far monk's hand
    const hc = new THREE.CatmullRomCurve3([V(GAR[0], D0 + 0.5, GAR[2] - 5.86), V(GAR[0] + 0.05, D0 + 0.05, GAR[2] - 5.5), V(GAR[0] + 1.1, D0 + 0.05, GAR[2] - 4.0),
      V(GAR[0] - 0.2, D0 + 0.05, GAR[2] - 2.3), V(GAR[0] + 0.7, D0 + 0.05, GAR[2] - 0.6), V(GAR[0] + 1.2, D0 + 0.35, GAR[2] + 0.4), V(GAR[0] + 1.35, D0 + 0.92, GAR[2] + 0.8)]);
    this.hose = new THREE.Mesh(new THREE.TubeGeometry(hc, 120, 0.035, 8, false), lam("hose", () => ({ color: "#3f7a3a" })));
    this.hose.castShadow = true; R.add(this.hose);
    // the iron wire: camera-facing ribbon spans with a little sag, rebuilt per frame (unlit, near-black; HDR glow on shocks)
    this.wirePos = new Float32Array(MAXW * SEG * 6 * 3);
    const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.BufferAttribute(this.wirePos, 3));
    this.wireMat = new THREE.MeshBasicMaterial({ color: "#2b2a2e", side: THREE.DoubleSide, fog: true });
    this.wire = new THREE.Mesh(wg, this.wireMat); this.wire.frustumCulled = false; this.wire.layers.set(NOINK);
    R.add(this.wire);

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
    // ---- the tap and the hose: the handle turns, the whole hose gives one push ----
    const tp = tapAt(t);
    this.handle.rotation.z = (Math.PI / 2) * tp;
    const push = s.scene === "garden" ? Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (t - T_TAP) / 0.3)))) : 0;
    this.hose.scale.set(1, 1 + 0.5 * push, 1); this.hose.position.y = -D0 * 0.5 * push;
    this.hose.visible = s.scene === "garden";

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
    // ---- the wire between the monks' hands ----
    const ends = wireEnds(id, t, { pos: cam.position, right });
    const P = this.wirePos, fwd = V(0, 0, 0), a0 = V(0, 0, 0), a1 = V(0, 0, 0), n = V(0, 0, 0);
    let w = 0;
    cam.getWorldDirection(fwd);
    for (const [A, B] of ends) {
      if (w >= MAXW) break;
      const d = Math.hypot(A[0] - B[0], A[2] - B[2]), sag = 0.05 + 0.03 * d;
      const ctr = this.v.set((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2);
      if (!this.frustum.intersectsSphere(this.sph.set(ctr, d / 2 + 0.5))) continue;
      const half = 0.011 * Math.max(1, cam.position.distanceTo(ctr) / 9); // never thinner than about 2 px
      for (let k = 0; k < SEG; k++) {
        const u0 = k / SEG, u1 = (k + 1) / SEG;
        a0.set(A[0] + (B[0] - A[0]) * u0, A[1] + (B[1] - A[1]) * u0 - sag * 4 * u0 * (1 - u0), A[2] + (B[2] - A[2]) * u0);
        a1.set(A[0] + (B[0] - A[0]) * u1, A[1] + (B[1] - A[1]) * u1 - sag * 4 * u1 * (1 - u1), A[2] + (B[2] - A[2]) * u1);
        n.copy(a1).sub(a0).cross(fwd).normalize().multiplyScalar(half);
        const o = (w * SEG + k) * 18;
        const q4 = [a0.x - n.x, a0.y - n.y, a0.z - n.z, a1.x - n.x, a1.y - n.y, a1.z - n.z, a1.x + n.x, a1.y + n.y, a1.z + n.z,
          a0.x - n.x, a0.y - n.y, a0.z - n.z, a1.x + n.x, a1.y + n.y, a1.z + n.z, a0.x + n.x, a0.y + n.y, a0.z + n.z];
        for (let j = 0; j < 18; j++) P[o + j] = q4[j];
      }
      w++;
    }
    this.wire.geometry.setDrawRange(0, w * SEG * 6);
    (this.wire.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    const gl = glowAt(id, t);
    if (gl > 0) this.wireMat.color.setRGB(0.03 + 5.0 * gl, 0.03 + 4.2 * gl, 0.035 + 1.6 * gl); else this.wireMat.color.set("#2b2a2e");
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}
