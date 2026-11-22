// The whole place as one three.js scene: sky, the places of the zinc-ball story (town.ts), clouds, the Seine (one
// painted-ripple water strip), the riverbed's water surface seen from below with its green gloom, the zinc balls
// (a pool of ribbed spheres posed per shot), the net across the river with its two posts and floats, the ice floes,
// the fisherman's boat, the parade rope of the analogy, and the cast (cast.ts). update(id, f, camera) poses
// everything for shot `id` at frame f (pure function of id + f).
import * as THREE from "three";
import { V, lam, Kit, Ray, kitClone, setSightLines, Batch, boxGeo } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { ctex, cloudHD, waterNear, waterFar, rng } from "../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, LFB, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown } from "./town";
import { stage } from "./cast";
import {
  FPS, SHOTS, camAt, FOREGROUND, ShotDef, V3, WY, RW, NET_X, UNDER, UY, UD, BALL_R, TABLE, JETTY, ROPE, BOAT, D0,
  rollAt, netAt, haulAt, iceAt, ropeTipAt, ropeLeanAt, smooth, HOOK_BALL, SANK_BALL, STUCK, LAST_BALL,
  T_HUNDREDS, T_SEALED, T_SPIN, T_SLIPPED, T_KEPT, F_SLOW, F_SO,
} from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_fat", "tree_cone", "plant_bush", "grass_large", "lantern", "cart", "hedge"];
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

// ---------------- models ----------------
const shadowAll = (o: THREE.Object3D) => o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });
/** a zinc ball (rolling axis along local z): a sphere with twelve meridian vanes round the axis and a welded band */
const makeBall = (key: string, col: string) => {
  const g = new THREE.Group(), b = new Batch();
  const zinc = lam("zinc" + key, () => ({ color: col }));
  const vane = lam("vane" + key, () => ({ color: col, side: THREE.DoubleSide }));
  b.add(new THREE.SphereGeometry(BALL_R * 0.86, 18, 14), zinc);
  for (let i = 0; i < 12; i++) {
    const v = new THREE.CircleGeometry(BALL_R, 14, -Math.PI / 2, Math.PI); // half disc in the xy plane, flat edge on y
    v.rotateX(Math.PI / 2); v.rotateY(0); // lie it in the xz plane: the axis (z) along its flat edge
    b.add(v, vane, new THREE.Matrix4().makeRotationZ((i / 12) * Math.PI * 2));
  }
  b.add(new THREE.TorusGeometry(BALL_R * 0.88, BALL_R * 0.07, 6, 24), zinc);
  b.build(g);
  shadowAll(g);
  return g;
};
/** a rowing boat (local: along +x, floor at y = 0) */
const makeBoat = () => {
  const g = new THREE.Group(), b = new Batch();
  const outer = new THREE.Shape();
  outer.moveTo(-1.9, -0.62); outer.lineTo(1.0, -0.62); outer.quadraticCurveTo(2.0, -0.5, 2.5, 0); outer.quadraticCurveTo(2.0, 0.5, 1.0, 0.62); outer.lineTo(-1.9, 0.62); outer.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-1.8, -0.53); hole.lineTo(1.0, -0.53); hole.quadraticCurveTo(1.9, -0.42, 2.3, 0); hole.quadraticCurveTo(1.9, 0.42, 1.0, 0.53); hole.lineTo(-1.8, 0.53); hole.closePath();
  const wallS = outer.clone(); wallS.holes = [hole];
  const walls = new THREE.ExtrudeGeometry(wallS, { depth: 0.55, bevelEnabled: false }); walls.rotateX(-Math.PI / 2); walls.translate(0, -0.2, 0);
  const floor = new THREE.ExtrudeGeometry(outer, { depth: 0.25, bevelEnabled: false }); floor.rotateX(-Math.PI / 2); floor.translate(0, -0.45, 0);
  b.add(walls, lam("boatHull021", () => ({ color: "#b07a4a" })));
  b.add(floor, lam("boatFloor021", () => ({ color: "#4a3a2e" })));
  b.add(boxGeo(V(-0.4, -0.2, -0.53), V(-0.1, 0.05, 0.53), 0), lam("boatSeat021", () => ({ color: "#8a6a44" })));
  b.build(g);
  shadowAll(g);
  return g;
};
/** the net's mesh: a brown knotted grid on a transparent ground */
const netTex = () => ctex("net021", 256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  g.strokeStyle = "#3a2c22"; g.lineWidth = 5;
  for (let k = 0; k <= 256; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
});
/** an ice floe: an irregular flat slab */
const floeGeo = (seed: number) => {
  const r = rng(seed), s = new THREE.Shape(), n = 7 + Math.floor(r() * 4), R = 1.0 + r() * 1.6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rr = R * (0.7 + 0.45 * r());
    if (i) s.lineTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr); else s.moveTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
  return g;
};
const NF = 46;

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
  private WU: Record<string, THREE.IUniform>;
  private ceil: THREE.Mesh; private ceilM: THREE.MeshBasicMaterial;
  private balls: THREE.Object3D[] = []; private mud: THREE.Object3D[] = [];
  private net = new THREE.Group(); private posts: THREE.Object3D[] = [];
  private floes: THREE.Mesh[] = [];
  private boat: THREE.Group;
  private rope = new THREE.Group(); private ropePosts: THREE.Object3D[] = []; private ropeLine: THREE.Mesh;
  private underCol = new THREE.Color();
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

    // ---- the land, the quays, the square, the riverbed (town.ts) ----
    buildTown(R, kit, sightLines());
    // ---- the Seine: one painted-ripple strip ----
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.WU = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
    };
    const waterM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    waterM.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.WU);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    waterM.customProgramCacheKey = () => "seine021";
    const rg = new THREE.PlaneGeometry(740, 2 * RW, 74, 4); rg.rotateX(-Math.PI / 2); rg.translate(150, WY, 0);
    const river = new THREE.Mesh(rg, waterM); river.receiveShadow = true; R.add(river);
    // ---- the riverbed's water surface seen from below (no shadow, fogged into the green) ----
    this.ceilM = new THREE.MeshBasicMaterial({ color: new THREE.Color(), side: THREE.DoubleSide });
    const cg = new THREE.PlaneGeometry(90, 90, 18, 18); cg.rotateX(Math.PI / 2); cg.translate(UNDER[0], UY + UD, UNDER[2]);
    this.ceil = new THREE.Mesh(cg, this.ceilM); this.ceil.layers.set(NOINK); R.add(this.ceil);
    // ---- the balls: clean zinc ones and muddy ones ----
    for (let i = 0; i < 4; i++) { const b = makeBall("021", "#a3abb0"); b.visible = false; this.balls.push(b); R.add(b); }
    for (let i = 0; i < STUCK.length + 1; i++) { const b = makeBall("mud021", "#8c918a"); b.visible = false; this.mud.push(b); R.add(b); }
    // ---- the net: posts on both banks, the grid between them, floats on the top rope (pivot: the riverbed line) ----
    const span = 2 * RW - 1.6, nt = netTex();
    nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.repeat.set(span / 0.5, 2.8 / 0.5);
    const nm = new THREE.MeshLambertMaterial({ map: nt, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
    const np = new THREE.Mesh(new THREE.PlaneGeometry(span, 2.8), nm); np.rotation.y = Math.PI / 2; np.position.y = 1.4; np.layers.set(NOINK);
    this.net.add(np);
    const nb = new Batch();
    nb.add(boxGeo(V(-0.03, 2.75, -span / 2), V(0.03, 2.82, span / 2), 0), lam("netRope021", () => ({ color: "#5a4030" })));
    for (let z = -span / 2 + 0.6; z < span / 2; z += 1.4) nb.add(new THREE.SphereGeometry(0.12, 10, 8), lam("float021", () => ({ color: "#d8a040" })), new THREE.Matrix4().makeTranslation(0, 2.8, z));
    nb.build(this.net);
    this.net.position.set(NET_X, WY - 2.3, 0); R.add(this.net);
    for (const s of [-1, 1]) {
      const p = new THREE.Group(), pb = new Batch();
      pb.add(new THREE.CylinderGeometry(0.16, 0.2, 4.6, 10), lam("netPost021", () => ({ color: "#5a4030" })), new THREE.Matrix4().makeTranslation(0, 2.3, 0));
      pb.build(p); p.position.set(NET_X, WY - 2.6, s * (RW - 0.8)); this.posts.push(p); R.add(p);
    }
    // ---- the ice floes ----
    const iceM = lam("ice021", () => ({ color: "#e4eef2" }));
    for (let i = 0; i < NF; i++) { const m = new THREE.Mesh(floeGeo(100 + i), iceM); m.castShadow = true; m.receiveShadow = true; m.visible = false; this.floes.push(m); R.add(m); }
    // ---- the fisherman's boat ----
    this.boat = makeBoat(); this.boat.position.set(BOAT[0], WY + 0.28, BOAT[2]); this.boat.rotation.y = 0.5; R.add(this.boat);
    // ---- the parade rope of the analogy: two posts with a rope between them ----
    for (const s of [-1, 1]) {
      const p = new THREE.Group(), pb = new Batch();
      pb.add(new THREE.CylinderGeometry(0.06, 0.07, 1.0, 10), lam("ropePost021", () => ({ color: "#c9a047" })), new THREE.Matrix4().makeTranslation(0, 0.5, 0));
      pb.add(new THREE.CylinderGeometry(0.22, 0.24, 0.08, 14), lam("ropeFoot021", () => ({ color: "#3a3640" })), new THREE.Matrix4().makeTranslation(0, 0.04, 0));
      pb.build(p); p.position.set(ROPE[0] + s * 2.4, D0, ROPE[2]); this.ropePosts.push(p); this.rope.add(p);
    }
    this.ropeLine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), lam("rope021", () => ({ color: "#b02a2a" })));
    this.ropeLine.castShadow = true; this.rope.add(this.ropeLine); R.add(this.rope);

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

  /** pose a ball: centre p, rolled by `spin` about the z axis (rolling toward -x turns it +z), sunk by `sink` */
  private ball(o: THREE.Object3D, p: V3, spin = 0, yaw = 0) {
    o.visible = true; o.position.set(...p); o.rotation.set(0, yaw, spin, "YXZ");
  }
  private poseProps(id: number, t: number, f: number, scene: string) {
    for (const b of [...this.balls, ...this.mud]) b.visible = false;
    const [UX, , UZ] = UNDER;
    if (id === 1) { const r = rollAt(HOOK_BALL.x0, UY, HOOK_BALL.z, HOOK_BALL.t0, HOOK_BALL.v, t); this.ball(this.balls[0], r.pos, r.spin); }
    if (id === 3) this.ball(this.balls[0], [TABLE[0] + 0.15, D0 + 0.9 + BALL_R, TABLE[2] + 0.05], 0.4, 0.3);
    if (id === 5) { // the letters go in, then it is sealed and spins on its fins
      const sp = smooth((t - T_SPIN + 0.1) / 0.4) * (t - T_SPIN + 0.1) * 9;
      this.ball(this.balls[0], [TABLE[0] + 0.05, D0 + 0.9 + BALL_R, TABLE[2]], Math.max(0, sp), 0.5);
      void T_HUNDREDS; void T_SEALED;
    }
    if (id === 6) { // in Robert's hand, then dropped into the Seine
      const u = Math.max(0, t - T_SLIPPED + 0.07);
      const p: V3 = [JETTY[0] - 0.55, D0 + 0.5 - 4.9 * u * u, JETTY[2] - 0.85 - 0.6 * Math.min(u, 0.3)];
      if (p[1] > WY - 0.2) this.ball(this.balls[0], p, u * 6);
    }
    if (id === 7 && f < F_SO) { const r = rollAt(SANK_BALL.x0, UY, SANK_BALL.z, SANK_BALL.t0, SANK_BALL.v, t);
      const drop = Math.max(0, 1 - (t - (SANK_BALL.t0 - 0.9)) / 0.9); // sinks onto the bed in the first part of the shot
      this.ball(this.balls[0], [r.pos[0], r.pos[1] + (UD - 0.2) * drop * drop, r.pos[2]], r.spin); }
    if (scene === "under" && (id === 13 || id === 17)) { // the stuck balls, half sunk in the mud
      STUCK.forEach(([dx, dz, s], i) => this.ball(this.mud[i], [UX + dx, UY + BALL_R * (1 - 2 * s), UZ + dz], i * 0.9, i * 0.7));
      if (id === 17) { const r = rollAt(LAST_BALL.x0, UY, LAST_BALL.z, LAST_BALL.t0, LAST_BALL.v, t); this.ball(this.mud[STUCK.length], [r.pos[0], r.pos[1] - 0.25 * BALL_R, r.pos[2]], r.spin); }
    }
    if (id === 15) { const lift = smooth((t - T_KEPT + 0.1) / 1.0); this.ball(this.mud[0], [BOAT[0] + 0.45, WY + 0.1 + 1.2 * lift, BOAT[2] + 0.45], 0.3, 0.2); }
    // the net
    const n = netAt(id, t), h = haulAt(id, t), vis = scene === "paris" && id >= 8;
    this.net.visible = vis; for (const p of this.posts) p.visible = vis;
    this.net.position.y = WY - 2.3 + 1.7 * h;
    this.net.rotation.set(0, 0, (1 - n) * 1.25);
    this.posts.forEach((p, i) => p.rotation.set(i ? 0.25 * (1 - n) : 0, 0, (1 - n) * (i ? 1.1 : 0.9)));
    // the ice: floes drifting downstream (-x) over the Paris reach; more of them as the river fills
    const k = iceAt(id, t), nf = Math.round(NF * k), ice = scene === "paris";
    for (let i = 0; i < NF; i++) {
      const m = this.floes[i];
      m.visible = ice && i < nf;
      if (!m.visible) continue;
      const z = -RW + 2.2 + ((i * 0.618) % 1) * (2 * RW - 4.4), x0 = -36 + ((i * 0.377) % 1) * 90;
      let x = x0 - 0.35 * t;
      if (n > 0.9 && x < NET_X + 1.8 && x0 > NET_X) x = NET_X + 1.8 + (i % 3) * 0.6; // held against the standing net
      m.position.set(x, WY - 0.04, z); m.rotation.y = i * 1.3;
    }
    this.boat.visible = scene === "up" && id === 15;
    this.rope.visible = id === 12;
    if (id === 12) {
      const tip = ropeTipAt(t), lean = ropeLeanAt(t);
      this.ropePosts.forEach((p) => p.rotation.set(-1.35 * tip, 0, 0));
      const top = (s: number) => V(ROPE[0] + s * 2.4, D0 + 0.95 * Math.cos(1.35 * tip), ROPE[2] - 0.95 * Math.sin(1.35 * tip));
      const a = top(-1), b = top(1), mid = a.clone().add(b).multiplyScalar(0.5);
      mid.z -= 0.35 * lean * (1 - tip); mid.y -= 0.12 + 0.1 * lean;
      // two straight halves would need two meshes: one sagging segment from post to post is enough at this size
      const d = b.clone().sub(a);
      this.ropeLine.position.copy(a.clone().add(b).multiplyScalar(0.5)); this.ropeLine.position.y = mid.y; this.ropeLine.position.z = mid.z;
      this.ropeLine.scale.set(1, d.length(), 1);
      this.ropeLine.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    }
    void F_SLOW;
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK); // sky, clouds and sun sprites live on the no-ink layer but are still rendered
    // which place is the lens in? (shot 13 cuts from the river to the riverbed)
    const under = (s.scene === "under" && !(id === 7 && f >= F_SO)) || (id === 13 && f >= F_SLOW);
    const place = under ? "under" : id === 7 ? "up" : s.scene;
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
    // ---- sky, fog, sun disc + halo, clouds (underwater: green gloom, no sky) ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    if (under) {
      untone("#4e7f78", this.underCol); this.fog.color.copy(this.underCol); this.fog.near = 0.6; this.fog.far = 11;
      scene.background = this.underCol; untone("#9fd0c4", this.ceilM.color);
    } else {
      untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.background = null;
    }
    scene.fog = this.fog;
    this.sky.visible = !under; this.ceil.visible = under;
    const showSun = s.light === "golden" && !under;
    this.sunDisc.visible = this.sunHalo.visible = showSun;
    if (showSun) {
      this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900);
      this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7)));
      this.sunHalo.position.copy(this.sunDisc.position); this.sunHalo.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(24)));
      (this.sunHalo.material as THREE.SpriteMaterial).color.set(L.sunDisc).multiplyScalar(1.3);
    }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i], mat = m.material as THREE.MeshBasicMaterial;
      m.visible = !under;
      m.position.x = cam.position.x + Math.cos((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.position.z = cam.position.z + Math.sin((i / 9) * Math.PI * 2 + 0.3) * (620 + (i % 3) * 60);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      mat.map = this.cloudMaps[s.light][i % 4];
    }
    // ---- water colours: a grey-green winter Seine ----
    const W = this.WU, wc = WATER[s.light];
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
    for (const g of this.fgs) g.o.visible = f >= g.a && f < g.b && g.a < s.b && g.b > s.a;
    this.poseProps(id, t, f, place);

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

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
/** the winter Seine: grey-green by day, slate and peach at the golden hour */
const WATER = {
  day: { near: "#557f80", mid: "#4a7386", far: "#6a88a0", crest: "#b4ccd0", trough: "#355a66", glint: "#ffffff", shade: [0.5, 0.56, 0.72] as [number, number, number] },
  golden: { near: "#3c5470", mid: "#58739a", far: "#d4a48e", crest: "#d9a088", trough: "#23324f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] as [number, number, number] },
};
const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));       // depression angle of the view ray
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);         // 1 at the horizon .. 0 at 24 deg down
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + vec2(-0.45 * wTime, 0.0);          // the current runs toward -x
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;
