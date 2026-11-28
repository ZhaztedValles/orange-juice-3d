// The whole place as one three.js scene: sky, the places of the story (town.ts), the Cycloped (a wooden wagon whose
// floor is a treadmill: the slats run under the horse, a gear on the near side turns with them), the four steam
// engines, the Rocket's tender, two carriages for the line to Manchester, the analogy car, clouds and the cast.
// update(id, f, camera) poses everything for shot `id` at frame f (pure function).
import * as THREE from "three";
import { Batch, boxGeo, V, lam, Kit, Ray, kitClone, setSightLines } from "../../src/engine/build";
import { loadKenney } from "../../src/engine/kit";
import { ctex, cloudHD, planks } from "../../src/engine/paint";
import { LIGHTS, LOOK, LightPreset } from "../../src/engine/lights";
import { TONE, CHAR, untone } from "../../src/engine/shade";
import { NOINK } from "../../src/engine/ink";
import { Pool, Actor, Fx } from "../../src/engine/cards";
import { buildTown, greenTex } from "./town";
import { stage } from "./cast";
import {
  FPS, D0, SHOTS, camAt, FOREGROUND, ShotDef, TZ0, TZ1, RT, GA, KRT, CYC_FLOOR, CYC_L, CYC_W, CYC_SIDE, SX,
  cycX, engX, autoX, trainX, train17X, walking,
} from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_fat", "tree_detailed", "hedge", "lantern", "stall-red", "stall-green", "banner-red", "banner-green"];
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

const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 6: { az: 35 }, 17: { az: 30 } };
/** the treadmill slats: dark wood boards with gaps, scrolled along u as the horse walks */
const beltTex = () => ctex("belt031", 256, 64, (g) => {
  g.fillStyle = "#3a2a20"; g.fillRect(0, 0, 256, 64);
  for (let x = 0; x < 256; x += 32) { g.fillStyle = x % 64 ? "#9a7046" : "#8a6440"; g.fillRect(x + 3, 0, 26, 64); }
});
type Veh = { g: THREE.Group; wheels: { o: THREE.Object3D; r: number }[] };


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
  private cyc!: Veh; private cycNear!: THREE.Group; private cycFar!: THREE.Group; private gear!: THREE.Object3D; private belt!: THREE.Texture;
  private engs: Veh[] = []; private tender!: Veh; private carriages: Veh[] = []; private auto!: Veh;
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
    const grass = lam("green031", () => ({ map: greenTex() }));
    const gg = new THREE.PlaneGeometry(1800, 1800, 60, 60);
    gg.rotateX(-Math.PI / 2); gg.translate(0, D0, 150);
    const uv = gg.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 300, uv.getY(i) * 300);
    b.add(gg, grass);
    b.build(R);
    buildTown(R, kit, sightLines());
    this.buildVehicles(R);

    for (const fg of FOREGROUND) {
      const o = kitClone(kit, fg.kit, fg.s ?? 1);
      if (!o) continue;
      o.position.set(...fg.pos); o.rotation.y = fg.yaw ?? 0; o.visible = false;
      this.fgs.push({ o, a: fg.a, b: fg.b }); R.add(o);
    }
    setSightLines([]);
  }


  /** vehicles in their own frames: heading +x, rail top (or road) at y = 0 */
  private buildVehicles(R: THREE.Object3D) {
    const MC = (k: string, c: string) => lam(k, () => ({ color: c }));
    const blk = MC("iron031", "#2f2d33"), wood = lam("vwood031", () => ({ map: planks() })), dark = MC("vdark031", "#5a3e2a");
    const add = (g: THREE.Object3D, a: number[], c: number[], m: THREE.Material) => { const o = new THREE.Mesh(boxGeo(V(a[0], a[1], a[2]), V(c[0], c[1], c[2]), 2), m); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    const cyl = (g: THREE.Object3D, r: number, len: number, m: THREE.Material, p: number[], axis: "x" | "y" = "y", seg = 24) => {
      const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m);
      if (axis === "x") o.rotation.z = Math.PI / 2;
      o.position.set(p[0], p[1], p[2]); o.castShadow = true; o.receiveShadow = true; g.add(o); return o;
    };
    const wheel = (rad: number, hub: THREE.Material, spokes = 8) => {
      const w = new THREE.Group();
      w.add(new THREE.Mesh(new THREE.TorusGeometry(rad - 0.04, 0.04, 6, 28), blk));
      w.add(new THREE.Mesh(new THREE.TorusGeometry(rad - 0.09, 0.025, 5, 28), hub));
      for (let i = 0; i < spokes; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.035, 2 * (rad - 0.09), 0.035), hub); s.rotation.z = (i / spokes) * Math.PI; w.add(s); }
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 10), hub); c.rotation.x = Math.PI / 2; w.add(c);
      for (const m of w.children) m.castShadow = true;
      return w;
    };
    const wheels = (v: Veh, list: [number, number][], hub: THREE.Material, half = GA) => {
      for (const [wx, rr] of list) for (const sz of [-half, half]) { const w = wheel(rr, hub); w.position.set(wx, rr, sz); v.g.add(w); v.wheels.push({ o: w, r: rr }); }
    };
    // ---- the Cycloped ----
    const cyc: Veh = { g: new THREE.Group(), wheels: [] };
    const red = MC("cycRed031", "#a8432f");
    wheels(cyc, [[-1.1, 0.42], [1.1, 0.42]], red);
    add(cyc.g, [-CYC_L, 0.62, -CYC_W], [CYC_L, 0.8, CYC_W], dark);
    this.belt = beltTex();
    const bg = new THREE.PlaneGeometry(2 * CYC_L - 0.2, 2 * CYC_W - 0.25); bg.rotateX(-Math.PI / 2);
    const uv = bg.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i));
    const beltM = new THREE.Mesh(bg, lam("belt031", () => ({ map: this.belt })));
    beltM.position.set(0, CYC_FLOOR, 0); beltM.receiveShadow = true; cyc.g.add(beltM);
    add(cyc.g, [-CYC_L, 0.8, -CYC_W], [CYC_L, CYC_FLOOR - 0.02, CYC_W], wood);
    const side = (g: THREE.Group, z: number) => {
      for (const x of [-CYC_L, CYC_L]) add(g, [x - 0.06, 0.8, z - 0.06], [x + 0.06, CYC_FLOOR + CYC_SIDE, z + 0.06], dark);
      for (const y of [0.4, CYC_SIDE - 0.1]) add(g, [-CYC_L - 0.05, CYC_FLOOR + y, z - 0.04], [CYC_L + 0.05, CYC_FLOOR + y + 0.1, z + 0.04], wood);
    };
    const far = new THREE.Group(); side(far, -CYC_W); cyc.g.add(far); this.cycFar = far;
    this.cycNear = new THREE.Group(); side(this.cycNear, CYC_W); cyc.g.add(this.cycNear);
    for (const x of [-CYC_L, CYC_L]) add(cyc.g, [x - 0.05, CYC_FLOOR, -CYC_W], [x + 0.05, CYC_FLOOR + 0.55, CYC_W], wood); // end boards
    this.gear = wheel(0.5, MC("gear031", "#c9a24a"), 10);
    this.gear.position.set(0.25, 0.75, CYC_W + 0.14); cyc.g.add(this.gear);
    add(cyc.g, [-1.25, 0.38, CYC_W + 0.1], [1.25, 0.46, CYC_W + 0.16], blk); // the drive rod from the gear to the wheels
    this.cyc = cyc; R.add(cyc.g);
    // ---- the steam engines ----
    type Look = { body: string; boiler: string; chim: string; hub: string };
    const LOOKS: Look[] = [
      { body: "#2f4a7a", boiler: "#b87333", chim: "#2f2d33", hub: "#2f4a7a" }, // Novelty: blue, copper boiler
      { body: "#e0b440", boiler: "#e0b440", chim: "#f2efe6", hub: "#e0b440" }, // Rocket: yellow, white chimney
      { body: "#3f6b4a", boiler: "#3f6b4a", chim: "#2f2d33", hub: "#c0362c" }, // Sans Pareil: green
      { body: "#7a3a2a", boiler: "#8a5a3a", chim: "#2f2d33", hub: "#2f2d33" }, // Perseverance: brown
    ];
    LOOKS.forEach((L, k) => {
      const v: Veh = { g: new THREE.Group(), wheels: [] }, body = MC(`eb${k}`, L.body), boil = MC(`ebo${k}`, L.boiler), chim = MC(`ec${k}`, L.chim), hub = MC(`eh${k}`, L.hub);
      if (k === 0) {
        wheels(v, [[-0.8, 0.4], [0.8, 0.4]], hub);
        add(v.g, [-1.5, 0.5, -0.7], [1.4, 0.78, 0.7], body);
        cyl(v.g, 0.42, 1.6, boil, [-0.95, 1.6, 0]); cyl(v.g, 0.13, 0.9, chim, [-0.95, 2.85, 0]);
        add(v.g, [0.1, 0.78, -0.55], [1.3, 1.5, 0.55], body); // the water box
        cyl(v.g, 0.18, 1.7, boil, [0.6, 1.05, -0.62], "x");
      } else if (k === 1) {
        wheels(v, [[0.7, 0.72], [-0.95, 0.4]], hub, GA);
        add(v.g, [-1.5, 0.45, -0.5], [1.3, 0.62, 0.5], dark);
        cyl(v.g, 0.5, 2.1, boil, [0.1, 1.3, 0], "x");
        add(v.g, [-1.55, 0.6, -0.55], [-0.85, 1.9, 0.55], MC("rocketFb031", "#c9a24a")); // the firebox
        cyl(v.g, 0.16, 2.8, chim, [1.05, 3.1, 0]);
        for (const sz of [-0.62, 0.62]) { const c = cyl(v.g, 0.11, 1.2, MC("rcyl031", "#d8dce4"), [-0.5, 1.45, sz]); c.rotation.z = -0.65; }
      } else {
        wheels(v, [[-0.75, 0.55], [0.75, 0.55]], hub);
        add(v.g, [-1.5, 0.55, -0.6], [1.4, 0.8, 0.6], dark);
        cyl(v.g, 0.55, 2.4, boil, [0, 1.4, 0], "x");
        cyl(v.g, 0.15, k === 2 ? 2.6 : 2.0, chim, [1.0, k === 2 ? 3.0 : 2.9, 0]);
        add(v.g, [-1.55, 0.8, -0.5], [-1.15, 2.1, 0.5], body);
        cyl(v.g, 0.2, 0.3, MC("dome031", "#c9a24a"), [-0.2, 2.05, 0]);
      }
      this.engs.push(v); R.add(v.g);
    });
    // ---- the Rocket's tender: a wagon with a water barrel and the coal ----
    const td: Veh = { g: new THREE.Group(), wheels: [] };
    wheels(td, [[-0.55, 0.4], [0.55, 0.4]], MC("tdh031", "#e0b440"));
    add(td.g, [-0.95, 0.5, -0.7], [0.95, 0.7, 0.7], dark);
    cyl(td.g, 0.5, 1.2, MC("barrel031", "#8a6440"), [-0.25, 1.25, 0], "x");
    add(td.g, [0.45, 0.7, -0.6], [0.95, 1.05, 0.6], dark);
    const coal = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), MC("coal031", "#2a2628"));
    coal.scale.set(0.7, 0.6, 1.2); coal.position.set(0.7, 1.05, 0); td.g.add(coal);
    this.tender = td; R.add(td.g);
    // ---- two open carriages ----
    for (let k = 0; k < 2; k++) {
      const v: Veh = { g: new THREE.Group(), wheels: [] }, c = MC(`car${k}031`, k ? "#7a2f3a" : "#e0b440");
      wheels(v, [[-1.0, 0.42], [1.0, 0.42]], blk);
      add(v.g, [-1.7, 0.6, -0.9], [1.7, 0.8, 0.9], dark);
      for (const x of [-1.7, -0.6, 0.55, 1.6]) add(v.g, [x, 0.8, -0.9], [x + 0.1, 1.55, 0.9], c);
      for (const sz of [-1, 1]) add(v.g, [-1.7, 0.8, sz * 0.9 - 0.05], [1.7, 1.25, sz * 0.9 + 0.05], c);
      this.carriages.push(v); R.add(v.g);
    }
    // ---- the analogy car: a red body, a bonnet, four wheels, an open back for the bike ----
    const au: Veh = { g: new THREE.Group(), wheels: [] }, ar = MC("auto031", "#c0392b");
    wheels(au, [[-1.2, 0.38], [1.25, 0.38]], MC("autoHub031", "#e8e2d4"), 0.85);
    add(au.g, [-1.9, 0.45, -0.8], [1.9, 0.95, 0.8], ar);
    add(au.g, [0.6, 0.95, -0.75], [1.9, 1.3, 0.75], ar);
    add(au.g, [0.5, 0.95, -0.75], [0.6, 1.7, 0.75], MC("autoGl031", "#9fb4cc"));
    add(au.g, [-1.9, 0.95, -0.8], [-1.75, 1.25, 0.8], ar);
    for (const sz of [-1, 1]) add(au.g, [-1.9, 0.95, sz * 0.8 - 0.05], [0.15, 1.25, sz * 0.8 + 0.05], ar);
    this.auto = au; R.add(au.g);
  }
  private place(v: Veh, x: number, y: number, z: number, show = true) {
    v.g.visible = show;
    if (!show) return;
    v.g.position.set(x, y, z);
    for (const w of v.wheels) w.o.rotation.z = -x / w.r;
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
    // ---- vehicles ----
    const course = s.scene === "course", rt = D0 + RT;
    this.place(this.cyc, cycX(id, t), rt, TZ0, course);
    this.cycNear.visible = id !== 6 && id < 10;
    this.cycFar.visible = id !== 17;
    const run = walking(id, t), ph = run ? t * 0.9 : 0.35;
    this.belt.offset.x = -ph * 1.5;
    this.gear.rotation.z = -ph * 4;
    this.engs.forEach((v, k) => {
      if (id === 16) { if (k === 1) this.place(v, trainX(t), D0 + KRT, 0); else v.g.visible = false; return; }
      if (id === 17) { if (k === 1) this.place(v, train17X(t), rt, TZ1); else this.place(v, engX(k, id, t), rt, TZ1, k !== 0); return; }
      const x = engX(k, id, t);
      this.place(v, x, rt, TZ1, course && Math.abs(x) < 60);
    });
    const rx = id === 16 ? trainX(t) : id === 17 ? train17X(t) : engX(1, id, t);
    this.place(this.tender, rx - 2.6, id === 16 ? D0 + KRT : rt, id === 16 ? 0 : TZ1, course || id === 16);
    this.carriages.forEach((v, k) => this.place(v, rx - 6.4 - 3.8 * k, id === 16 ? D0 + KRT : rt, id === 16 ? 0 : TZ1, id === 16 || id === 17));
    this.place(this.auto, id === 12 ? autoX(t) : SX, D0, 0, id === 12);

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
