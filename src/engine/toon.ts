// Our own flat 2D cartoon cast (riflemen, officer, townsfolk, kid, parent) + 2D effects, drawn on a canvas.
// Construction v2 (characters.md, our own cast): superellipse heads (pointed crown 1.75 / full jaw 2.3, chin taper,
// seeded side bulge + tilt), bean torsos, single-stroke limbs with ink-dot hands, a thick-thin plum outline weighted
// away from the light, soft painted crescents, deadpan lidded eyes, no blush, no catchlights.
// Design space 600 x 1000 units (soles at y = 975); the canvas transform scales it.
export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
type C3 = [number, number, number];
const SH_SKIN: C3 = [0.96, 0.86, 0.84]; // measured shadow/lit ratio on skin heads
const SH_CLOTH: C3 = [0.64, 0.66, 0.74]; // torsos: lit side -> far side ~0.65
const SH_FELT: C3 = [0.62, 0.62, 0.7];

export type Build = "adult" | "stout" | "kid" | "teen";
export type Outfit = {
  jacket: string; pants: string; boots: string; hat?: string | null; belt?: string | null; buttons?: string; rifle?: boolean;
  sash?: string; sword?: boolean; moustache?: string; skin?: string; head?: number; cap?: string; hair?: string; dress?: string;
  build?: Build;
  // ---- long-video additions: all optional, absent = the Shorts' look ----
  // extra hats: "bicorne" (worn sideways, Napoleon), "bicorne_fa" (fore-and-aft), "tricorne", "crown", "laurel",
  // "mitre", "turban"
  /** hat body colour (bicorne / tricorne / mitre / turban wrap), hat trim colour (lace edge, mitre bands, turban cap) */
  hatCol?: string; hatTrim?: string;
  /** feather plume on top of a bicorne / tricorne / turban */
  plume?: string;
  /** cockade on a bicorne / tricorne: undefined = French tricolour, a colour = plain cockade, null = none */
  cockade?: string | null;
  /** hair colour drawn under any hat (hairline + sides); lockLen 0 short .. 1 hanging to the collar; forelock = a curl on the brow */
  locks?: string; lockLen?: number; forelock?: boolean;
  /** full beard colour (lower face) and brow thickness multiplier (default 1) */
  beard?: string; brow?: number;
  /** coat facings: lapel plastron, collar band, gold epaulettes */
  lapels?: string; collar?: string; epaulettes?: string;
  /** long robe (chest to ankles, legs hidden); mantle hanging from the shoulders behind the body; mantle trim ("ermine" = white with black tails) */
  robe?: string; cloak?: string; trim?: string;
};
type P2 = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const mul = (c: string, m: C3) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255, m[0])}${ch((n >> 8) & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c: string, k: number) => mul(c, [k, k, k]);
export const mix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
/** deterministic per-character random in [0, 1) */
const rnd = (seed: number, k: number) => { const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] =>
  pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
const rotAbout = (q: P2, a: number, c: P2): P2 => rotPts([q], a, c[0], c[1])[0];
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** smooth curve from a through (near) k to b, as a polyline */
const curve = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};

export const RIFLEMAN: Outfit = { jacket: "#357650", pants: "#3d4440", boots: INK, hat: "shako", belt: "#f1efe6", buttons: "#d9dde0", rifle: true };
export const OFFICER: Outfit = { ...RIFLEMAN, hat: "shako_tall", buttons: "#e8c45a", sash: "#c0353a", sword: true, moustache: "#4a3020", rifle: false, belt: null, build: "stout" };
export const KID: Outfit = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid" };
export const PARENT: Outfit = { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#5a3b2a" };
export const SKINS = [SKIN, "#f5c9a0", "#ecd0b6", "#c99067"];

export const soldier = (v = 0, extra: Partial<Outfit> = {}): Outfit => {
  const o: Outfit = { ...RIFLEMAN, skin: SKINS[v % 4] };
  if (v % 4 === 1) o.moustache = "#4a3426";
  if (v % 4 === 3) o.moustache = "#2a201a";
  return { ...o, ...extra };
};

export const townsfolk = (v = 0): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9"];
  const o: Outfit = { jacket: coats[v % 6], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4] };
  return v % 2 ? { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3] } : { ...o, hat: "tophat" };
};

export class Pen {
  g: CanvasRenderingContext2D;
  ol = 12;
  /** [angle, cx, cy] rotation about (cx, cy), optional post-translation [.., dx, dy] */
  rot: number[] | null = null;
  constructor(g: CanvasRenderingContext2D) { this.g = g; }
  P(x: number, y: number): P2 {
    if (!this.rot) return [x, y];
    const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
  }
  path(pts: P2[], close: boolean) {
    const g = this.g;
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = this.P(p[0], p[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    if (close) g.closePath();
  }
  /** filled shape with an ink outline; fill=null draws the outline only */
  poly(pts: P2[], fill: string | null, ol?: number) {
    const g = this.g, w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (w) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = "round"; g.stroke(); }
  }
  ell(cx: number, cy: number, rx: number, ry: number, fill: string | null, ol?: number, a0 = 0, a1 = 360, rot = 0) {
    this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
  }
  /** thick round-capped limb with an ink rim (effects, rope) */
  line(pts: P2[], fill: string, w: number, ink = true) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    if (ink) { this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * this.ol * 0.9; g.stroke(); }
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  stroke(pts: P2[], w: number, fill = INK) {
    const g = this.g;
    g.lineCap = "round"; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  }
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, fill = INK) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) pts.push([cx + rx * Math.cos(rad(a0 + ((a1 - a0) * i) / 24)), cy + ry * Math.sin(rad(a0 + ((a1 - a0) * i) / 24))]);
    this.stroke(pts, w, fill);
  }
  dot(cx: number, cy: number, r: number, fill = INK) {
    const [x, y] = this.P(cx, cy);
    this.g.beginPath(); this.g.arc(x, y, r, 0, Math.PI * 2); this.g.fillStyle = fill; this.g.fill();
  }
  /** draw with a closed shape as clip */
  clip(pts: P2[], fn: () => void) { const g = this.g; g.save(); this.path(pts, true); g.clip(); fn(); g.restore(); }
  /** flat fill + soft crescent on the side away from the light (light = canvas angle the light comes FROM).
   *  Radial ramp centred `shift` R toward the light: flat out to ~0.6 R on the far side, full shadow by ~0.8 R. */
  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.45, r0 = 1.05, r1 = 1.25) {
    const g = this.g, n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
    gr.addColorStop(0, base); gr.addColorStop(r0 / r1, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** broad gradient across a shape along the light: lit edge = base, far edge = shadow (torsos, coats) */
  gradFill(pts: P2[], base: string, shadow: string, light: number, flat = 0.22) {
    const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
    let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; const d = x * dx + y * dy; lo = Math.min(lo, d); hi = Math.max(hi, d); }
    const dc = cx * dx + cy * dy;
    const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, base); gr.addColorStop(flat, base); gr.addColorStop(1, shadow);
    this.path(pts, true); g.fillStyle = gr; g.fill();
  }
  /** thick-thin ink ring: w(θ) = w0 (1 + k cos(θ − thick)), θ from the contour centroid (canvas angles) */
  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = INK) {
    const n = pts.length;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x / n; cy += y / n; }
    const out: P2[] = [], inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0]; // outward normal for clockwise-on-screen contours
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]); inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => { r.forEach(([x0, y0], i) => { const [x, y] = this.P(x0, y0); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); };
    g.beginPath(); trace(out); trace(inn.reverse());
    g.fillStyle = col; g.fill("evenodd");
  }
  /** flat strap with a thin ink rim (cross belts, sash, rifle, handles) */
  band(pts: P2[], fill: string, w: number, rim: number, cap: CanvasLineCap = "butt") {
    const g = this.g; g.lineCap = cap; g.lineJoin = "round";
    this.path(pts, false); g.strokeStyle = INK; g.lineWidth = w + 2 * rim; g.stroke();
    this.path(pts, false); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
    g.lineCap = "round";
  }
}

const ellPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, rot = 0, n = 48): P2[] => {
  const r = rad(rot), pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};

const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + (90 * i) / n)), cy + r * Math.sin(rad(a + (90 * i) / n))]);
  return pts;
};

/** tapered stroke, thick end at a: brows, moustache halves */
const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
    [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col); p.dot(b[0], b[1], wb / 2, col);
};

// ---------------- contours ----------------
export type Blob = { a: number; b: number; nTop: number; nBot: number; egg: number; asym: number; rot: number; noise: number; seed: number };

/** superellipse "bean": separate crown / jaw exponents, egg taper (neg = narrower chin), one-side bulge, soft noise.
 *  Points run right -> down -> left -> up (clockwise on screen). */
export const blobPts = (cx: number, cy: number, B: Blob, n = 72): P2[] => {
  const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map((v) => v * Math.PI * 2);
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
    const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
    const x = B.a * X * r, y = B.b * Y * r;
    pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
  }
  return pts;
};

/** measured head: H/W 0.94, slightly pointed crown (1.75), fuller jaw (2.3), chin taper -0.12, 8 % bulge to the facing side */
export const headBlob = (seed: number, a = 118, facing = 0): Blob => ({
  a, b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
  nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5), nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
  egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
  asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
  rot: rad(8 * (rnd(seed, 7) - 0.5)), noise: 0.008, seed,
});

/** thickest outline direction: away from the light, pulled toward the ground (64 deg measured for upper-left light) */
export const thickAngle = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);

// ---------------- faces ----------------
export type Expr = "neutral" | "stern" | "grin" | "laugh" | "whistle" | "nervous" | "shock" | "relief" | "relief_open" | "dazed"
  | "pained" | "smile" | "smile_closed" | "lick";
type EyeK = "dot" | "small" | "lid" | "slit" | "happy" | "dash" | "squeeze" | "shock" | "shockHalf" | "spiral";
type MouthK = "dash" | "frown" | "smirk" | "smile" | "smileWide" | "grin" | "laugh" | "o" | "O" | "wave" | "teeth" | "lick";
/** eyes [back, front], brows [inner, outer] offsets in u (+ = down), mouth kind */
const FACE: Record<Expr, { eye: [EyeK, EyeK]; brow: [number, number]; mouth: MouthK }> = {
  neutral: { eye: ["lid", "lid"], brow: [0, -1], mouth: "dash" },
  stern: { eye: ["lid", "lid"], brow: [3, -2], mouth: "frown" },
  grin: { eye: ["happy", "happy"], brow: [-3, -3], mouth: "grin" },
  laugh: { eye: ["squeeze", "squeeze"], brow: [-4, -4], mouth: "laugh" },
  whistle: { eye: ["dash", "dash"], brow: [-2, -4], mouth: "o" },
  nervous: { eye: ["small", "small"], brow: [-3, 2], mouth: "wave" },
  shock: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "O" },
  relief: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "smileWide" },
  relief_open: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "grin" },
  dazed: { eye: ["spiral", "spiral"], brow: [-3, 2], mouth: "wave" },
  pained: { eye: ["squeeze", "lid"], brow: [-3, 2], mouth: "teeth" },
  smile: { eye: ["dot", "dot"], brow: [0, -1], mouth: "smirk" },
  smile_closed: { eye: ["happy", "happy"], brow: [0, -1], mouth: "smile" },
  lick: { eye: ["dot", "dot"], brow: [0, -1], mouth: "lick" },
};
const halfLid = (k: EyeK): EyeK => (k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k);
const eyeKind = (k: EyeK, lid: number): EyeK =>
  lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
const lidOf = (b: boolean | number | undefined) => (b === true ? 1 : Number(b) || 0);

const eye = (p: Pen, kind: EyeK, x: number, ey: number, u: number, side: number, look: number, skin: string) => {
  const lx = x + look * 3 * u, lw = 3.8 * u;
  switch (kind) {
    case "dot": p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0); break;
    case "small": p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0); break;
    case "lid": p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw); break;
    case "slit": p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180); p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw); break;
    case "happy": p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw); break;
    case "dash": p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw); break;
    case "squeeze": p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw); break;
    case "shock": case "shockHalf":
      p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u); p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
      if (kind === "shockHalf") { p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360); p.stroke([[x - 11 * u, ey], [x + 11 * u, ey]], 2.6 * u); }
      break;
    default: {
      const s: P2[] = [];
      for (let t = 1; t < 15; t++) s.push([x + Math.cos(t * 0.9) * t * 0.55 * u, ey + Math.sin(t * 0.9) * t * 0.55 * u]);
      p.stroke(s, 2.4 * u);
    }
  }
};

/** open "D" mouth with a white teeth band (+ tongue) */
const dmouth = (p: Pen, mx: number, y: number, rx: number, ry: number, u: number, tongue = false) => {
  p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
  p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
  if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
  p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};

const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {
  const mw = 4 * u;
  switch (kind) {
    case "dash": p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw); break;
    case "frown": p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw); break;
    case "smirk": p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw); break;
    case "smile": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); break;
    case "smileWide": p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw); break;
    case "grin": dmouth(p, mx, my - u, 12 * u * k, 8 * u, u); break;
    case "laugh": dmouth(p, mx, my, 16 * u * k, 11 * u, u, true); break;
    case "o": p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u); break;
    case "O": p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u); break;
    case "wave": { const s: P2[] = []; for (let i = 0; i <= 12; i++) s.push([mx - 9 * u * k + i * 1.5 * u * k, my + 1.5 * u * Math.sin(i * 1.3)]); p.stroke(s, 3 * u); break; }
    case "teeth":
      p.poly([[mx - 12 * u * k, my - 4 * u], [mx + 12 * u * k, my - 4 * u], [mx + 11 * u * k, my + 4 * u], [mx - 11 * u * k, my + 4 * u]], WHITE, 3 * u);
      for (const j of [-1, 0, 1]) p.stroke([[mx + j * 6 * u * k, my - 4 * u], [mx + j * 6 * u * k, my + 4 * u]], 1.5 * u);
      break;
    case "lick": p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw); p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u); break;
  }
};

/** face v2 (front / 3-4). u = 1 % of the head path width W. Eyes 26u apart on the centre line, brows 20u up, mouth 20u
 *  down, everything slid toward the facing side. No blush, no catchlights. */
const faceFront = (p: Pen, cx: number, cy: number, W: number, expr: Expr, facing: number, look: number, lid: number, brim: boolean,
  skin: string, moustache?: string, stout = false, bw = 1) => {
  const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing;
  const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
  for (const side of [-1, 1]) {
    const x = fx + side * ex;
    const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
    eye(p, kind, x, ey, u, side, look, skin);
    const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
    if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u * bw, 2.5 * u * bw);
  }
  const mx = cx + 8 * u * facing, my = cy + 20 * u;
  mouth(p, F.mouth, mx, my, u);
  if (moustache) for (const s of [-1, 1])
    taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * (stout ? 19 : 15) * u, cy + (stout ? 10.5 : 15) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

/** profile face (facing screen-right): one eye, brow, nose tick, mouth near the front edge; no skin bump nose, no ear */
const faceSide = (p: Pen, hx: number, hy: number, W: number, expr: Expr, lid: number, brim: boolean, skin: string, moustache?: string, stout = false, bw = 1) => {
  const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
  const kind = eyeKind(F.eye[1], lid);
  eye(p, kind, ex, ey, u, 1, 0.6, skin);
  const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
  if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
  else taper(p, [ex + 8 * u, by + dI * u], [ex - 7 * u, by - u + dO * u], 5 * u * bw, 2.5 * u * bw);
  p.stroke([[hx + 44 * u, hy + 4 * u], [hx + 47.5 * u, hy + 9 * u], [hx + 43 * u, hy + 10 * u]], 3 * u);
  mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
  if (moustache) taper(p, [hx + 41 * u, hy + 13.5 * u], [hx + 25 * u, hy + (stout ? 11.5 : 16) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
  if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
};

// ---------------- long-video hats, hair under hats, beards (all keyed by optional Outfit fields) ----------------
const GOLD = "#e8b53e", TRI = ["#2f52b0", "#f5f2ea", "#d23a3f"]; // French cockade: blue centre, white, red rim

/** long hair hanging behind the head (Outfit.locks with lockLen > 0): visible beside the face, down to the collar */
const locksBehind = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, ow: number, side: boolean) => {
  const L = o.lockLen ?? 0;
  if (!o.locks || L <= 0) return;
  const a = H.a, b = H.b, u = a / 50, y1 = hc + (0.25 + 0.75 * L) * b;
  const pts = side ? rrect(cx - 1.07 * a, hc - 0.85 * b, cx + 0.1 * a, y1, 0.42 * a) : rrect(cx - 1.08 * a, hc - 0.8 * b, cx + 1.08 * a, y1, 0.48 * a);
  p.shadedFill(pts, o.locks, mul(o.locks, SH_FELT), light, a, 0.35);
  p.poly(pts, null, ow * 0.85);
  for (const s of side ? [-0.9, -0.6] : [-0.94, 0.94]) p.stroke([[cx + s * a, hc + 0.15 * b], [cx + s * a * 1.01, y1 - 0.15 * b]], 1.4 * u);
};

/** hair under a hat (Outfit.locks): the head above a hairline (high on the forehead, down the temples; in profile down
 *  behind the ear to the nape) in the hair colour, plus an optional forelock curl */
const hairUnder = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, facing: number, side: boolean) => {
  const a = H.a, b = H.b, W = 2 * a, HH = 2 * b, u = W / 100, ow = 0.85 * 5 * u, crown = hc - b, col = o.locks!;
  const line: P2[] = side
    ? [[cx + 1.3 * a, crown + 0.3 * HH], ...curve([cx + 0.8 * a, crown + 0.27 * HH], [cx + 0.3 * a, crown + 0.33 * HH], [cx - 0.05 * a, hc + 0.05 * b], 8),
      ...curve([cx - 0.05 * a, hc + 0.05 * b], [cx - 0.35 * a, hc + 0.42 * b], [cx - 0.7 * a, hc + 0.55 * b], 6).slice(1), [cx - 1.3 * a, hc + 0.55 * b]]
    : [[cx + 1.3 * a, hc + 0.12 * b], ...curve([cx + 0.95 * a, hc + 0.1 * b], [cx + 0.68 * a, crown + 0.33 * HH], [cx, crown + 0.25 * HH], 8),
      ...curve([cx, crown + 0.25 * HH], [cx - 0.68 * a, crown + 0.33 * HH], [cx - 0.95 * a, hc + 0.1 * b], 8).slice(1), [cx - 1.3 * a, hc + 0.12 * b]];
  const region: P2[] = [...line, [cx - 1.3 * a, crown - 0.4 * HH], [cx + 1.3 * a, crown - 0.4 * HH]];
  const head = hp.map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
  p.clip(head, () => { p.shadedFill(region, col, mul(col, SH_FELT), light, a, 0.35); p.stroke(line, 0.55 * ow); });
  p.clip(region, () => p.poly(head, null, ow));
  if (o.forelock) {
    const fx = side ? cx + 30 * u : cx + 6 * u * (facing || -1), y0 = crown + 0.25 * HH - 3 * u, d = side ? 1 : -(facing || -1);
    const lock: P2[] = [...curve([fx - 7 * u, y0], [fx + d * 4 * u, y0 + 10 * u], [fx - d * 2 * u, y0 + 22 * u], 8),
      ...curve([fx - d * 2 * u, y0 + 22 * u], [fx + d * 10 * u, y0 + 9 * u], [fx + 7 * u, y0], 8).slice(1)];
    p.poly(lock, col, 2 * u);
  }
};

/** full beard over the lower face (Outfit.beard); the mouth is drawn over it */
const beardOn = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, side: boolean) => {
  const u = H.a / 50, top = hc + 0.3 * H.b, col = o.beard!;
  const keep = (x: number, y: number) => y > top && (!side || x > cx - 0.25 * H.a);
  const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
  const arc = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([x, y]) => keep(x, y)).map(([x, y]) => [cx + (x - cx) * 1.05, hc + (y - hc) * 1.07] as P2);
  if (arc.length < 3) return;
  p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
  p.poly(arc, null, 3.2 * u);
};

/** the long-video hats (Outfit.hat): bicorne (sideways: wide crescent from the front), bicorne_fa (fore-and-aft), tricorne,
 *  crown, laurel, mitre, turban. a = the head tilt; side = profile card facing right. Unknown names draw nothing. */
const hatLong = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, a: number, side: boolean) => {
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u, yb = crown + 0.25 * HH, t = o.hat;
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const at = (x: number, y: number) => R([[x, y]])[0];
  const fill = (pts: P2[], col: string, r: number) => p.shadedFill(pts, col, mul(col, SH_FELT), light, r, 0.4);
  const cockade = (x: number, y: number, r: number) => {
    if (o.cockade === null) return;
    const [qx, qy] = at(x, y);
    if (o.cockade) { p.ell(qx, qy, r, r, o.cockade, 1.8 * u); return; }
    p.ell(qx, qy, r, r, TRI[2], 1.8 * u); p.ell(qx, qy, r * 0.66, r * 0.66, TRI[1], 0); p.ell(qx, qy, r * 0.34, r * 0.34, TRI[0], 0);
  };
  const plume = (x: number, y: number, lean: number) => {
    if (!o.plume) return;
    const tip: P2 = [x + lean * 18 * u, y - 48 * u];
    p.poly(R([...curve([x - 7 * u, y + 2 * u], [x - 10 * u + lean * 8 * u, y - 26 * u], tip, 8), ...curve(tip, [x + 10 * u + lean * 8 * u, y - 24 * u], [x + 7 * u, y + 2 * u], 8).slice(1)]), o.plume, 2.2 * u);
  };
  const edge = (body: P2[], col?: string) => { if (col) p.clip(body, () => p.stroke([...body, body[0]], 9 * u, col)); };
  if (t === "bicorne" || t === "bicorne_fa") {
    const col = o.hatCol ?? "#26232c";
    if ((t === "bicorne") !== side) {
      // the wide view: convex top, concave bottom sitting on the head, points turned up at both ends
      const half = (side ? 0.74 : 0.8) * W, ox = side ? -0.04 * W : 0, L: P2 = [cx + ox - half, yb - 0.2 * HH], Rt: P2 = [cx + ox + half, yb - 0.2 * HH];
      const body = R([...curve(L, [cx + ox, yb - 0.52 * HH], Rt, 20), ...curve(Rt, [cx + ox, yb + 0.03 * HH], L, 20).slice(1, -1)]);
      fill(body, col, half); edge(body, o.hatTrim); p.poly(body, null, ow);
      plume(cx + ox, yb - 0.5 * HH, 0.3);
      cockade(cx + ox + (side ? 0.18 : 0.3) * W, yb - 0.28 * HH, 9.5 * u);
    } else {
      // end-on view: the same crescent, narrower and taller (a pointed arch read as a helmet or a mitre)
      const half = 0.5 * W, ox = side ? -0.03 * W : 0, L: P2 = [cx + ox - half, yb - 0.14 * HH], Rt: P2 = [cx + ox + half, yb - 0.14 * HH];
      const body = R([...curve(L, [cx + ox, yb - 0.6 * HH], Rt, 20), ...curve(Rt, [cx + ox, yb + 0.03 * HH], L, 20).slice(1, -1)]);
      fill(body, col, half); edge(body, o.hatTrim); p.poly(body, null, ow);
      plume(cx + ox, yb - 0.58 * HH, 0.2);
      cockade(cx + ox + 0.2 * W, yb - 0.28 * HH, 8.5 * u);
    }
  } else if (t === "tricorne") {
    const col = o.hatCol ?? "#2b2530";
    if (!side) {
      const dome = R(ellPts(cx, yb - 0.04 * HH, 0.4 * W, 0.42 * HH, 180, 360, 0, 24));
      fill(dome, col, 0.4 * W); p.poly(dome, null, ow);
      const Lc: P2 = [cx - 0.74 * W, yb - 0.4 * HH], Rc: P2 = [cx + 0.74 * W, yb - 0.4 * HH], F: P2 = [cx, yb + 0.09 * HH], M: P2 = [cx, yb - 0.12 * HH];
      const upper = [...curve(Rc, [cx + 0.34 * W, yb - 0.2 * HH], M, 10), ...curve(M, [cx - 0.34 * W, yb - 0.2 * HH], Lc, 10).slice(1)];
      const brim = R([...curve(Lc, [cx - 0.38 * W, yb - 0.01 * HH], F, 10), ...curve(F, [cx + 0.38 * W, yb - 0.01 * HH], Rc, 10).slice(1, -1), ...upper]);
      fill(brim, col, 0.74 * W);
      if (o.hatTrim) p.clip(brim, () => p.stroke(R(upper), 9 * u, o.hatTrim!));
      p.poly(brim, null, ow);
      cockade(cx - 0.34 * W, yb - 0.23 * HH, 8 * u);
      plume(cx + 0.1 * W, yb - 0.38 * HH, 0.3);
    } else {
      const dome = R(ellPts(cx - 0.04 * W, yb - 0.06 * HH, 0.32 * W, 0.36 * HH, 180, 360, 0, 24));
      fill(dome, col, 0.32 * W); p.poly(dome, null, ow);
      const Fp: P2 = [cx + 0.6 * W, yb - 0.06 * HH], Bp: P2 = [cx - 0.56 * W, yb - 0.36 * HH], Pk: P2 = [cx - 0.02 * W, yb - 0.42 * HH];
      const upper = [...curve(Fp, [cx + 0.28 * W, yb - 0.2 * HH], Pk, 10), ...curve(Pk, [cx - 0.3 * W, yb - 0.24 * HH], Bp, 10).slice(1)];
      const brim = R([...curve(Bp, [cx - 0.2 * W, yb + 0.07 * HH], Fp, 12), ...upper.slice(1, -1)]);
      fill(brim, col, 0.6 * W);
      if (o.hatTrim) p.clip(brim, () => p.stroke(R(upper), 9 * u, o.hatTrim!));
      p.poly(brim, null, ow);
      cockade(cx + 0.24 * W, yb - 0.17 * HH, 7 * u);
      plume(cx - 0.04 * W, yb - 0.4 * HH, -0.2);
    }
  } else if (t === "crown") {
    const half = (side ? 0.32 : 0.38) * W, ccx = cx - (side ? 0.04 * W : 0), top = yb - 0.5 * HH, bandTop = yb - 0.14 * HH, by = yb + 0.03 * HH;
    const cap = R(ellPts(ccx, bandTop, half * 0.86, 0.3 * HH, 180, 360, 0, 24));
    p.shadedFill(cap, "#b3263a", mul("#b3263a", SH_FELT), light, half); p.poly(cap, null, ow * 0.7);
    const n = 5, tips: P2[] = [], pts: P2[] = [[ccx - half, by]];
    for (let i = 0; i < n; i++) {
      const x = ccx - half + (i * 2 * half) / (n - 1), tip: P2 = [x, top + [0.08, 0.02, -0.05, 0.02, 0.08][i] * HH];
      tips.push(tip); pts.push(tip);
      if (i < n - 1) pts.push([x + half / (n - 1), bandTop - 0.03 * HH]);
    }
    pts.push([ccx + half, by], ...curve([ccx + half, by], [ccx, by + 0.035 * HH], [ccx - half, by], 10).slice(1, -1));
    const body = R(pts);
    p.shadedFill(body, GOLD, "#a8741e", light, half, 0.4);
    p.clip(body, () => p.stroke(R([[ccx - half - 4 * u, bandTop], [ccx + half + 4 * u, bandTop]]), 2 * u));
    p.poly(body, null, ow);
    for (const [k, c] of [[-0.55, "#c0353a"], [0, "#2f52b0"], [0.55, "#c0353a"]] as const) { const [gx, gy] = at(ccx + k * half, (bandTop + by) / 2); p.ell(gx, gy, 5.5 * u, 6.5 * u, c, 1.6 * u); }
    for (const tp of R(tips)) p.ell(tp[0], tp[1] - 3 * u, 5.5 * u, 5.5 * u, "#fff4dc", 1.6 * u);
  } else if (t === "laurel") {
    const leaf = (q: P2, ang: number) => p.ell(q[0], q[1], 9 * u, 4.2 * u, GOLD, 1.5 * u, 0, 360, (ang * 180) / Math.PI);
    const branch = (pts: P2[]) => {
      const P = R(pts);
      p.stroke(P, 2.4 * u, "#a8741e");
      for (let i = 1; i < P.length; i++) {
        const [x0, y0] = P[i - 1], [x1, y1] = P[i], ang = Math.atan2(y1 - y0, x1 - x0);
        for (const s of [-1, 1]) leaf([x1 + s * Math.cos(ang + Math.PI / 2) * 6 * u, y1 + s * Math.sin(ang + Math.PI / 2) * 6 * u], ang + s * 0.5);
      }
    };
    if (!side) for (const s of [-1, 1]) branch(curve([cx + s * 1.0 * H.a, hc - 0.02 * HH], [cx + s * 0.62 * H.a, crown + 0.14 * HH], [cx + s * 0.08 * W, crown + 0.12 * HH], 7));
    else branch(curve([cx - 0.9 * H.a, hc - 0.12 * HH], [cx + 0.1 * H.a, crown + 0.08 * HH], [cx + 0.9 * H.a, crown + 0.2 * HH], 8));
  } else if (t === "mitre") {
    const col = o.hatCol ?? "#f6f1e4", tr = o.hatTrim ?? GOLD, half = (side ? 0.27 : 0.36) * W, base = crown + 0.22 * HH;
    let pts: P2[];
    if (!side) {
      const apex: P2 = [cx, base - 1.0 * HH];
      pts = [[cx - half, base], [cx - 1.08 * half, base - 0.42 * HH], ...curve([cx - 1.08 * half, base - 0.42 * HH], [cx - 0.72 * half, base - 0.8 * HH], apex, 10).slice(1),
        ...curve(apex, [cx + 0.72 * half, base - 0.8 * HH], [cx + 1.08 * half, base - 0.42 * HH], 10).slice(1), [cx + half, base]];
    } else {
      const fp: P2 = [cx + 0.5 * half, base - 0.98 * HH], bp: P2 = [cx - 0.55 * half, base - 0.92 * HH], notch: P2 = [cx - 0.02 * half, base - 0.6 * HH];
      pts = [[cx - half, base], ...curve([cx - half, base], [cx - 1.05 * half, base - 0.6 * HH], bp, 8).slice(1), notch,
        ...curve(fp, [cx + 1.05 * half, base - 0.6 * HH], [cx + half, base], 8)];
    }
    const body = R(pts);
    fill(body, col, half);
    p.clip(body, () => {
      p.band(R([[cx - 1.3 * half, base - 0.07 * HH], [cx + 1.3 * half, base - 0.07 * HH]]), tr, 0.12 * HH, 1.4 * u);
      if (!side) p.band(R([[cx, base], [cx, base - 1.05 * HH]]), tr, 0.12 * W, 1.4 * u);
    });
    p.poly(body, null, ow);
    if (!side) { const [jx, jy] = at(cx, base - 0.5 * HH); p.ell(jx, jy, 5.5 * u, 6.5 * u, "#c0353a", 1.6 * u); }
  } else if (t === "turban") {
    const col = o.hatCol ?? "#f2ead8", capc = o.hatTrim ?? "#c0353a", ox = side ? -0.04 * W : 0, wy = yb - 0.2 * HH;
    const cap = R(ellPts(cx + ox, wy - 0.12 * HH, 0.25 * W, 0.36 * HH, 180, 360, 0, 24));
    p.shadedFill(cap, capc, mul(capc, SH_FELT), light, 0.25 * W, 0.4); p.poly(cap, null, ow);
    const wrap = R(ellPts(cx + ox, wy, (side ? 0.56 : 0.6) * W, 0.25 * HH, 0, 360, 0, 40));
    fill(wrap, col, 0.6 * W);
    p.clip(wrap, () => { for (let k = -3; k <= 3; k++) p.stroke(R([[cx + ox + k * 0.2 * W - 0.12 * W, wy + 0.3 * HH], [cx + ox + k * 0.2 * W + 0.12 * W, wy - 0.3 * HH]]), 3 * u, shade(col, 0.74)); });
    p.poly(wrap, null, ow);
    const [jx, jy] = at(cx + ox + (side ? 0.46 * W : 0), wy - 0.02 * HH);
    plume(cx + ox + (side ? 0.46 * W : 0), wy - 0.06 * HH, side ? 0.4 : 0.15);
    p.ell(jx, jy, 7 * u, 9 * u, GOLD, 1.8 * u); p.dot(jx, jy, 3.2 * u, "#c0353a");
  }
};

// ---------------- hats ----------------
const BONNET = "#e9cf8f", BONNET_BRIM = "#d6b46a";
/** parts of a hat that sit behind the head (bonnet) */
const hatBehind = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, side: boolean) => {
  if (o.locks) locksBehind(p, o, H, cx, hc, light, ow, side);
  if (o.hat !== "bonnet") return;
  const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, { ...H, a: H.a * 1.17, b: H.b * 1.13, asym: 0, egg: 0.04, seed: H.seed + 3 });
  p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
  p.inkRing(bb, ow * 0.85, thick);
};

const hatOn = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, seed: number, facing: number, side: boolean) => {
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5)); // tilt with the head, +-2 deg extra
  if (o.beard) beardOn(p, o, hp, H, cx, hc, light, side);
  if (o.locks && o.hat !== "hair" && o.hat !== "cap") hairUnder(p, o, hp, H, cx, hc, light, facing, side);
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const sag = (yb: number, wb: number): P2[] => {
    const base: P2[] = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; base.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]); }
    return base;
  };
  if (o.hat === "shako" || o.hat === "shako_tall") {
    const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
    if (tall) p.clip(body, () => p.band(R([[cx - wt - 5 * u, yb - ht + 0.07 * HH], [cx + wt + 5 * u, yb - ht + 0.07 * HH]]), "#e8c45a", 0.06 * HH, 1.5 * u));
    p.poly(body, null, ow);
    const deg = (a * 180) / Math.PI;
    if (side) {
      p.poly(R([[cx + 36 * u, yb - 1 * u], [cx + 60 * u, yb + 8 * u], [cx + 34 * u, yb + 6 * u]]), "#16171b", 2.5 * u);
      const [tx, ty] = R([[cx + 24 * u, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
    } else {
      const [px, py] = R([[cx + 3 * u * facing, yb + 3 * u]])[0];
      p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg); // peak
      const [bx, by] = R([[cx, yb - 0.45 * ht]])[0];
      p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg); // badge plate
      p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
      const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u); // green tuft
    }
  } else if (o.hat === "cap" || o.hat === "hair") {
    const cut = crown + (o.hat === "cap" ? 0.3 : 0.42) * HH;
    const keep = (x: number, y: number) => y < cut || (side && o.hat === "hair" && x < cx - 6 * u && y < hc + 0.42 * H.b);
    // start the arc at the first kept point after a dropped one, so the kept run is contiguous and the cut closes it
    const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
    const arc = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([x, y]) => keep(x, y))
      .map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length < 3) return;
    if (o.hat === "hair") { // scalloped lower edge
      const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
      for (let i = 1; i < 6; i++) arc.push([x0 + ((x1 - x0) * i) / 6, y0 + ((y1 - y0) * i) / 6 + (i % 2 ? 4 * u : 0)]);
    }
    const col = o.hat === "cap" ? o.cap! : o.hair!;
    p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.poly(arc, null, ow);
    if (o.hat === "hair") {
      const s = side ? -1 : facing || 1;
      p.stroke([[cx + s * 10 * u, cut - 30 * u], [cx + s * 2 * u, cut - 12 * u]], 1.2 * u);
    }
    if (o.hat === "cap") {
      const deg = (a * 180) / Math.PI;
      if (side) p.poly(R([[cx + 40 * u, cut - 2 * u], [cx + 74 * u, cut + 4 * u], [cx + 40 * u, cut + 6 * u]]), shade(col, 0.8), ow);
      else {
        const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([[cx + s * 4 * u, cut + 1.5 * u]])[0];
        p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
      }
    }
  } else if (o.hat === "tophat") {
    const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => p.band(R([[cx - wt - 4 * u, yb - 0.13 * HH], [cx + wt + 4 * u, yb - 0.13 * HH]]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
    p.poly(body, null, ow);
    const [bx, by] = R([[cx, yb + 1 * u]])[0];
    p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, (a * 180) / Math.PI);
  } else if (o.hat === "bonnet") {
    const [bx, by] = R([[cx + (side ? 6 * u : 0), crown + 0.16 * HH]])[0];
    p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
    p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
    const cy = hc + H.b * 0.98;
    p.stroke([[cx - 14 * u, cy - 4 * u], [cx, cy + 2 * u], [cx + 14 * u, cy - 4 * u]], 2 * u, BONNET_BRIM);
  } else if (o.hat) hatLong(p, o, H, cx, hc, light, a, side);
};

// ---------------- long-video garments ----------------
/** a sash band; "tricolour" = blue / white / red stripes */
const sashBand = (p: Pen, pts: P2[], col: string, w: number, rim: number) => {
  if (col !== "tricolour") { p.band(pts, col, w, rim); return; }
  p.band(pts, TRI[1], w, rim);
  const [a, b] = [pts[0], pts[pts.length - 1]], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l;
  for (const [k, c] of [[-1, TRI[0]], [1, TRI[2]]] as const) p.band(pts.map(([x, y]) => [x + nx * k * w / 3, y + ny * k * w / 3] as P2), c, w / 3, 0);
};
/** ermine: white fur with small black tails, inside a clip */
const ermine = (p: Pen, x0: number, y0: number, x1: number, y1: number, u: number) => {
  for (let y = y0 + 8 * u, r = 0; y < y1; y += 22 * u, r++) for (let x = x0 + (r % 2 ? 18 : 6) * u; x < x1; x += 26 * u) taper(p, [x, y], [x, y + 9 * u], 3.4 * u, 1 * u);
};
/** mantle hanging from the shoulders behind a front-view body (Outfit.cloak, trimmed with Outfit.trim) */
const cloakFront = (p: Pen, o: Outfit, tcx: number, Ta: number, chin: number, sole: number, HH: number, u: number, light: number, thick: number, ow: number) => {
  const top = chin + 0.04 * HH, bot = sole - 3 * u, mid = (top + bot) / 2, col = o.cloak!;
  const pts: P2[] = [[tcx - 0.9 * Ta, top], [tcx + 0.9 * Ta, top], ...curve([tcx + 0.9 * Ta, top], [tcx + 1.5 * Ta, mid], [tcx + 2.05 * Ta, bot], 10).slice(1),
    ...curve([tcx + 2.05 * Ta, bot], [tcx, bot + 4 * u], [tcx - 2.05 * Ta, bot], 10).slice(1), ...curve([tcx - 2.05 * Ta, bot], [tcx - 1.5 * Ta, mid], [tcx - 0.9 * Ta, top], 10).slice(1, -1)];
  p.gradFill(pts, col, mul(col, SH_CLOTH), light);
  p.clip(pts, () => {
    if (o.trim === "ermine") for (let y = top + 30 * u, r = 0; y < bot; y += 34 * u, r++) for (let x = tcx - 1.8 * Ta + (r % 2 ? 17 : 0) * u; x < tcx + 1.8 * Ta; x += 34 * u) p.dot(x, y, 2.6 * u, GOLD);
    if (o.trim) for (const sd of [-1, 1]) {
      const band: P2[] = [[tcx + sd * 0.8 * Ta, top], [tcx + sd * 1.12 * Ta, top], [tcx + sd * 1.5 * Ta, bot + 6 * u], [tcx + sd * 1.12 * Ta, bot + 6 * u]];
      p.poly(band, o.trim === "ermine" ? "#f7f4ec" : o.trim, 1.6 * u);
      if (o.trim === "ermine") p.clip(band, () => ermine(p, tcx + sd * 1.3 * Ta - 30 * u, top, tcx + sd * 1.3 * Ta + 30 * u, bot, u));
    }
  });
  p.inkRing(pts, ow, thick);
};
/** the mantle's two front panels over the body sides, open in front (inner edges in the trim) */
const cloakPanels = (p: Pen, o: Outfit, tcx: number, Ta: number, chin: number, sole: number, HH: number, u: number, light: number, thick: number, ow: number) => {
  const top = chin + 0.05 * HH, bot = sole - 3 * u, col = o.cloak!;
  for (const sd of [-1, 1]) {
    const it: P2 = [tcx + sd * 0.42 * Ta, top + 0.03 * HH], ot: P2 = [tcx + sd * 1.08 * Ta, top], ob: P2 = [tcx + sd * 1.95 * Ta, bot], ib: P2 = [tcx + sd * 0.62 * Ta, bot];
    let pts: P2[] = [it, ot, ...curve(ot, [tcx + sd * 1.45 * Ta, (top + bot) / 2], ob, 10).slice(1), ...curve(ob, [tcx + sd * 1.3 * Ta, bot + 4 * u], ib, 6).slice(1)];
    if (sd < 0) pts = pts.reverse();
    p.gradFill(pts, col, mul(col, SH_CLOTH), light);
    p.clip(pts, () => {
      if (o.trim === "ermine") for (let y = top + 30 * u, r = 0; y < bot; y += 34 * u, r++) for (let x = tcx - 2 * Ta + (r % 2 ? 17 : 0) * u; x < tcx + 2 * Ta; x += 34 * u) p.dot(x, y, 2.6 * u, GOLD);
      if (o.trim) {
        const band: P2[] = [it, [it[0] + sd * 0.34 * Ta, it[1]], [ib[0] + sd * 0.4 * Ta, ib[1] + 8 * u], [ib[0], ib[1] + 8 * u]];
        p.poly(band, o.trim === "ermine" ? "#f7f4ec" : o.trim, 1.6 * u);
        if (o.trim === "ermine") p.clip(band, () => ermine(p, Math.min(it[0], ib[0]) - 0.5 * Ta, top, Math.max(it[0], ib[0]) + 0.5 * Ta, bot, u));
      }
    });
    p.inkRing(pts, ow, thick);
  }
};
/** short shoulder cape over the torso (the mantle's ermine collar, a bishop's cape) */
const shoulderCape = (p: Pen, col: string, tcx: number, Ta: number, chin: number, HH: number, u: number, light: number, thick: number, ow: number, seed: number) => {
  const cp = blobPts(tcx, chin + 0.12 * HH, { a: 1.18 * Ta, b: 0.22 * HH, nTop: 2.0, nBot: 2.2, egg: 0.08, asym: 0, rot: 0, noise: 0.006, seed: seed + 11 });
  p.gradFill(cp, col, mul(col, SH_CLOTH), light);
  if (col === "#f7f4ec") p.clip(cp, () => ermine(p, tcx - 1.3 * Ta, chin - 0.1 * HH, tcx + 1.3 * Ta, chin + 0.34 * HH, u));
  p.inkRing(cp, ow * 0.9, thick);
};
const epaulette = (p: Pen, col: string, x: number, y: number, u: number, k = 1) => {
  for (let i = -2; i <= 2; i++) { const a: P2 = [x + i * 3.2 * u * k, y + 3 * u], b: P2 = [x + i * 3.8 * u * k, y + 15 * u]; p.stroke([a, b], 4.4 * u, INK); p.stroke([a, b], 2.4 * u, col); }
  p.ell(x, y, 15 * u * k, 6.5 * u, col, 1.8 * u);
};
/** a sabre from the hand along canvas angle ang (guard at the hand) */
const sabre = (p: Pen, hx: number, hy: number, ang: number, len: number, u: number) => {
  const tip: P2 = [hx + Math.cos(ang) * len, hy + Math.sin(ang) * len], n: P2 = [-Math.sin(ang), Math.cos(ang)];
  p.band([[hx, hy], tip], "#dfe3e8", 4.2 * u, 1.4 * u, "round");
  p.band([[hx + n[0] * 9 * u, hy + n[1] * 9 * u], [hx - n[0] * 9 * u, hy - n[1] * 9 * u]], GOLD, 3.4 * u, 1.3 * u, "round");
  p.dot(hx, hy, 5.5 * u);
};
/** open book held in front of the chest (front view) */
const openBook = (p: Pen, cx: number, cy: number, u: number) => {
  p.poly([[cx - 46 * u, cy - 26 * u], [cx, cy - 20 * u], [cx + 46 * u, cy - 26 * u], [cx + 46 * u, cy + 18 * u], [cx, cy + 24 * u], [cx - 46 * u, cy + 18 * u]], "#8a3b2c", 2.4 * u);
  for (const s of [-1, 1]) p.poly([[cx, cy - 18 * u], [cx + s * 42 * u, cy - 23 * u], [cx + s * 42 * u, cy + 14 * u], [cx, cy + 19 * u]], "#f6efdc", 2 * u);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.stroke([[cx + s * 10 * u, cy - 10 * u + k * 9 * u], [cx + s * 34 * u, cy - 13 * u + k * 9 * u]], 1.4 * u, "#9a8f7c");
};

// ---------------- bodies ----------------
export type Arms = [P2[], P2[]];
/** held prop; for the hammer the number is the strike 0 (raised) .. 1 (struck) */
export type Prop = null | "icecream" | "shako" | ["hammer", number]
  /** long-video props: hand tucked in the coat; open book held in both hands; a crown lifted in both hands (0 chest .. 1 above
   *  the head); a sabre in the right hand (0 lowered .. 1 raised high) */
  | "tuck" | "book" | ["crown", number] | ["sword", number];

const BUILD: Record<Build, { a: number; torso: number; legs: number; tw: number }> = {
  adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 },
  stout: { a: 118, torso: 1.15, legs: 1.32, tw: 0.92 },
  kid: { a: 112, torso: 0.85, legs: 1.0, tw: 0.72 },
  teen: { a: 115, torso: 1.0, legs: 1.26, tw: 0.74 },
};

export type FrontOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stroll" | "stand" | "sit" | "fall"; look?: number; blink?: boolean | number; lift?: number;
  prop?: Prop; tilt?: number; headTilt?: number; wave?: number;
  /** canvas angle the key light comes FROM (painted crescent + thick outline side) */
  light?: number; facing?: -1 | 0 | 1; seed?: number;
};

const footStroke = (p: Pen, a: P2, b: P2, w: number, col: string) => {
  if (col !== INK) p.stroke([a, b], w + 3, INK);
  p.stroke([a, b], w, col);
};

export const bodyFront = (p: Pen, o: Outfit, opts: FrontOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", look = 0, blink = false, lift = 60, prop = null, tilt = 0, headTilt = 0, wave,
    light = DEF_LIGHT, facing = 0, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H = headBlob(seed, Bd.a, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
  // body bob 5 % (march) / 3 % (stroll) of the height, lowest at contact (phase 0 and 0.5)
  const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
  const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
  const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u;
  const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
  const legW = 5.8 * u, footW = 7.5 * u;
  // ---- legs + feet (not rotated) ----
  p.rot = null;
  if (o.cloak && mode !== "sit" && mode !== "fall") cloakFront(p, o, 300 + 3 * u * facing, ((Bd.tw / 2) * W) / 1.06, chin, sole, HH, u, light, thick, ow);
  if (mode === "sit") {
    for (const side of [-1, 1]) {
      const h: P2 = [300 + side * 15 * u, hipY], k: P2 = [300 + side * 36 * u, hipY + 0.2 * HH], f: P2 = [300 + side * 44 * u, sole - 8 * u];
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, [f[0] - side * 2 * u, f[1]], [f[0] + side * 12 * u, f[1] - 5 * u], footW, footCol);
    }
  } else if (mode === "fall") {
    const legs: [P2, P2, P2][] = [
      [[300 - 15 * u, hipY], [300 - 46 * u, hipY + 0.5 * HH], [300 - 70 * u, hipY + 0.72 * HH]],
      [[300 + 15 * u, hipY], [300 + 50 * u, hipY + 0.45 * HH], [300 + 76 * u, hipY + 0.22 * HH]],
    ];
    legs.forEach(([h, k, f], i) => {
      p.stroke(curve(h, k, f), legW, legCol);
      footStroke(p, f, [f[0] + (i ? 14 : -14) * u, f[1] + (i ? -6 : 4) * u], footW, footCol);
    });
  } else if (o.dress || o.robe) {
    for (const side of [-1, 1]) {
      const fx = 300 + side * 12 * u, fy = sole - 4 * u;
      p.stroke([[fx, sole - 0.4 * HH], [fx + side * u, fy]], legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 12 * u, fy + u], footW, footCol);
    }
  } else {
    const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
    for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
      const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
      const hx = 300 + side * 15 * u, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
      const k: P2 = [(hx + fx) / 2 + side * (1.5 * u + up * 0.16), (hipY + fy) / 2 - up * 0.08];
      p.stroke(curve([hx, hipY], k, [fx, fy]), legW, legCol);
      footStroke(p, [fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u], footW, footCol);
    }
  }
  // ---- upper body: rotates about the hips (tilt + a small weight-shift sway on every step) ----
  const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
  const A = tilt + sway;
  p.rot = A ? [rad(A), 300, hipY] : null;
  const dress = !!o.dress && mode !== "sit" && mode !== "fall", robe = !!o.robe && !o.dress && mode !== "sit" && mode !== "fall";
  const T: Blob = { a: ((Bd.tw / 2) * W) / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: o.build === "stout" ? 0.17 : 0.12,
    asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const hang = (side: number, fwd: number): [P2, P2, P2] => {
    const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
    const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
    return [S, [ex, S[1] + 0.48 * HH], [hx, chin + 1.04 * HH - Math.abs(fwd) * 9 * u]];
  };
  const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
  // rifle at the order: butt by the right hip, held by the hanging right hand, muzzle past the crown
  const R0: P2 = [300 + 47 * u, torsoBot + 0.12 * HH], R1: P2 = [300 + 64 * u, crown - 0.32 * HH];
  const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
  type Arm = { pts: [P2, P2, P2]; front: boolean };
  const arms: Arm[] = [];
  if (mode === "sit") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
  else if (mode === "fall") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]], front: false });
  else {
    arms.push({ pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw), front: false });
    if (rifle) {
      const G = lerp2(R0, R1, 0.1);
      arms.push({ pts: [sh(1), [tcx + 1.12 * T.a + 5 * u, sh(1)[1] + 0.45 * HH], G], front: false });
    } else if (wave !== undefined) {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.1 * T.a + 10 * u + 3 * u * wave, S[1] - 0.22 * HH], [tcx + 1.18 * T.a + 16 * u + 12 * u * wave, S[1] - 0.6 * HH]], front: false });
    } else if (prop === "icecream") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.5 * T.a, S[1] + 0.4 * HH]], front: true });
    } else if (prop === "tuck") {
      const S = sh(1);
      arms.push({ pts: [S, [tcx + 1.05 * T.a + 6 * u, S[1] + 0.4 * HH], [tcx + 0.18 * T.a, chin + 0.36 * HH]], front: true });
    } else if (prop === "book" || (Array.isArray(prop) && prop[0] === "crown")) {
      const k = Array.isArray(prop) ? clamp(prop[1], 0, 1) : -1;
      arms.length = 0; // both hands on the prop
      for (const sd of [-1, 1]) {
        const S = sh(sd);
        const E: P2 = k < 0 ? [tcx + sd * (1.1 * T.a + 4 * u), S[1] + 0.42 * HH] : lerp2([tcx + sd * (1.1 * T.a + 4 * u), S[1] + 0.4 * HH], [tcx + sd * (1.15 * T.a + 18 * u), S[1] - 0.32 * HH], k);
        const Hd: P2 = k < 0 ? [tcx + sd * 0.44 * T.a, chin + 0.52 * HH] : lerp2([tcx + sd * 0.34 * T.a, chin + 0.42 * HH], [tcx + sd * 0.46 * T.a, crown - 0.3 * HH], k);
        arms.push({ pts: [S, E, Hd], front: true });
      }
    } else if (Array.isArray(prop) && prop[0] === "sword") {
      const S = sh(1), k = clamp(prop[1], 0, 1);
      const E = lerp2([tcx + 1.12 * T.a + 6 * u, S[1] + 0.45 * HH], [tcx + 1.15 * T.a + 14 * u, S[1] - 0.25 * HH], k);
      const Hd = lerp2([tcx + 1.25 * T.a + 8 * u, chin + 0.95 * HH], [tcx + 1.25 * T.a + 22 * u, S[1] - 0.62 * HH], k);
      arms.push({ pts: [S, E, Hd], front: true });
    } else if (Array.isArray(prop)) {
      const S = sh(1), k = clamp(prop[1], 0, 1);
      const E = lerp2([tcx + 1.1 * T.a + 10 * u, S[1] - 0.15 * HH], [tcx + 1.2 * T.a + 10 * u, S[1] + 0.3 * HH], k);
      const Hd = lerp2([tcx + 1.15 * T.a + 14 * u, S[1] - 0.55 * HH], [tcx + 1.45 * T.a + 22 * u, S[1] + 0.35 * HH], k);
      arms.push({ pts: [S, E, Hd], front: true });
    } else arms.push({ pts: hang(1, sw), front: false });
  }
  const drawArm = (a: Arm) => { p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol); p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u); };
  // behind the body: rifle, sword, arms
  if (rifle) {
    p.band([R0, R1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(R0, R1, 0.6), R1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  if (o.sword && mode !== "sit") {
    const s0: P2 = [tcx - 0.75 * T.a, torsoBot - 0.2 * HH];
    p.band([s0, [s0[0] - Math.sin(rad(25)) * 0.8 * HH, s0[1] + Math.cos(rad(25)) * 0.8 * HH]], "#c9ccd2", 3 * u, 1.2 * u, "round");
  }
  for (const a of arms) if (!a.front) drawArm(a);
  // torso / dress: shaded fill -> clothing clipped to it -> thick-thin ink ring
  if (robe) {
    const top = chin - 0.12 * HH, bot = sole - 0.05 * HH;
    const Rb: Blob = { a: 1.12 * T.a, b: 0.5 * (bot - top), nTop: 2.2, nBot: 3.4, egg: 0.16, asym: 0.03 * facing, rot: 0, noise: 0.006, seed: seed + 9 };
    const rp = blobPts(tcx, bot - Rb.b, Rb);
    p.gradFill(rp, o.robe!, mul(o.robe!, SH_CLOTH), light);
    p.clip(rp, () => {
      if (o.lapels) p.band([[tcx + 2 * u * facing, top], [tcx + 2 * u * facing, bot + 10 * u]], o.lapels, 0.3 * T.a, 1.6 * u);
      if (o.sash) sashBand(p, [[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.11 * HH, 1.8 * u);
      if (o.belt) p.band([[tcx - 1.3 * T.a, torsoBot - 0.1 * HH], [tcx + 1.3 * T.a, torsoBot - 0.1 * HH]], o.belt, 0.07 * HH, 1.6 * u);
    });
    p.inkRing(rp, ow, thick);
    if (o.jacket !== o.robe && !o.cloak) shoulderCape(p, o.jacket, tcx, T.a, chin, HH, u, light, thick, ow, seed);
  } else if (dress) {
    const D: Blob = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0.03 * facing, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, o.dress!, mul(o.dress!, SH_CLOTH), light);
    p.inkRing(dp, ow, thick);
    const Sw: Blob = { a: 0.37 * W, b: 0.3 * HH, nTop: 2.2, nBot: 2.4, egg: 0.1, asym: 0, rot: 0, noise: 0.006, seed: seed + 8 };
    const sp = blobPts(300, chin + 0.12 * HH, Sw);
    p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.inkRing(sp, ow * 0.9, thick);
  } else {
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, () => {
      if (o.lapels) p.poly([[tcx - 0.46 * T.a, chin - 0.1 * HH], [tcx + 0.46 * T.a, chin - 0.1 * HH], [tcx + 0.3 * T.a, chin + 0.62 * HH], [tcx - 0.3 * T.a, chin + 0.62 * HH]], o.lapels, 1.8 * u);
      if (o.collar) p.band([[tcx - 1.3 * T.a, chin + 0.02 * HH], [tcx + 1.3 * T.a, chin + 0.02 * HH]], o.collar, 0.11 * HH, 1.6 * u);
      if (o.belt) {
        for (const s of [-1, 1]) p.band([[tcx - s * 0.75 * T.a, chin - 0.05 * HH], [tcx + s * 0.8 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
        const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
        p.poly([[xc - 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc + 3.5 * u], [xc - 3.5 * u, yc + 3.5 * u]], "#d9dde0", 1.5 * u);
      }
      if (o.sash) sashBand(p, [[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
      for (let i = 0; i < 4; i++) {
        const y = chin + 0.12 * HH + i * 0.2 * HH;
        if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
        p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK); p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
      }
    });
    if (o.sash) { const s = facing || 1; p.poly([[tcx + s * 0.55 * T.a, torsoBot - 0.3 * HH], [tcx + s * 0.75 * T.a, torsoBot + 0.05 * HH], [tcx + s * 0.45 * T.a, torsoBot + 0.02 * HH]], o.sash === "tricolour" ? TRI[2] : o.sash, 1.6 * u); }
    p.inkRing(tp, ow, thick);
    if (o.epaulettes) for (const sd of [-1, 1]) epaulette(p, o.epaulettes, tcx + sd * 0.86 * T.a, chin + 0.07 * HH, u);
  }
  if (o.cloak && mode !== "sit" && mode !== "fall") cloakPanels(p, o, tcx, T.a, chin, sole, HH, u, light, thick, ow);
  if (o.cloak && o.trim && mode !== "sit" && mode !== "fall") shoulderCape(p, o.trim === "ermine" ? "#f7f4ec" : o.trim, tcx, T.a, chin, HH, u, light, thick, ow, seed);
  // in front of the body: hands holding props
  for (const a of arms) if (a.front) {
    drawArm(a);
    const [hx, hy] = a.pts[2];
    if (prop === "icecream") {
      p.poly([[hx - 8 * u, hy - 12 * u], [hx + 8 * u, hy - 12 * u], [hx, hy + 7 * u]], "#e0a35a", 1.8 * u);
      p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    } else if (prop === "tuck") { // the hand inside the coat: a waistcoat flap over it
      p.poly([[hx - 9 * u, hy - 11 * u], [hx + 8 * u, hy - 9 * u], [hx + 10 * u, hy + 10 * u], [hx - 7 * u, hy + 9 * u]], shade(o.jacket, 0.96), 1.8 * u);
    } else if (Array.isArray(prop) && prop[0] === "sword") {
      sabre(p, hx, hy, rad(70 - 140 * clamp(prop[1], 0, 1)), 0.95 * HH, u);
    } else if (Array.isArray(prop) && prop[0] === "hammer") {
      const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
      const Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
      p.band(Rh([[hx, hy + 12 * u], [hx, hy - 44 * u]]), "#8a5a34", 5 * u, 1.5 * u, "round");
      p.poly(Rh([[hx - 12 * u, hy - 58 * u], [hx + 20 * u, hy - 58 * u], [hx + 20 * u, hy - 42 * u], [hx - 12 * u, hy - 42 * u]]), "#7d848c", 2.2 * u);
      p.dot(hx, hy, 5.5 * u);
    }
  }
  if (prop === "book") {
    const [ax, ay] = arms[0].pts[2], [bx, by] = arms[1].pts[2];
    openBook(p, (ax + bx) / 2, (ay + by) / 2 - 6 * u, u);
    p.dot(ax, ay, 5.5 * u); p.dot(bx, by, 5.5 * u);
  }
  if (prop === "shako") { // carried by the left hand
    const [hx, hy] = arms[0].pts[2];
    p.poly([[hx - 14 * u, hy + 3 * u], [hx + 14 * u, hy + 3 * u], [hx + 16 * u, hy + 30 * u], [hx - 16 * u, hy + 30 * u]], "#3a3d47", 2.2 * u);
    p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
    p.dot(hx, hy, 5.5 * u);
  }
  // ---- head: rotates with the body, plus its own tilt about the chin ----
  const Ah = A + headTilt, [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
  p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
  hatBehind(p, o, H, 300, hc, light, thick, ow, false);
  const hp = blobPts(300, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
  faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout", o.brow ?? 1);
  if (Array.isArray(prop) && prop[0] === "crown") { // the lifted crown, between the hands, over the head
    const [ax, ay] = arms[0].pts[2], [bx, by] = arms[1].pts[2];
    p.rot = A ? [rad(A), 300, hipY] : null;
    hatLong(p, { ...o, hat: "crown" }, H, (ax + bx) / 2, (ay + by) / 2 + 0.5 * H.b - 0.04 * HH, light, 0, false);
    p.dot(ax, ay, 5.5 * u); p.dot(bx, by, 5.5 * u);
  }
  p.rot = null;
};

export type SideOpts = {
  phase?: number; expr?: Expr; mode?: "march" | "stand" | "swing" | "push" | "ride"; blink?: boolean | number; stomp?: number; pose?: number;
  /** long-video props in profile: "tuck", "book", ["sword", k] (others are ignored) */
  prop?: Prop;
  /** step length as a multiple of 0.8 m (370 units): matches 1.6 m/s at 2 steps/s; scale by the view's foreshortening */
  stride?: number; light?: number; seed?: number;
  /** push mode: where the hands land at pose 1, in final canvas units (e.g. the swing kid's back) */
  hand?: [number, number];
};

/** two-bone leg, knee bending forward (+x) */
const ik = (hip: P2, ank: P2, l1: number, l2: number): P2 => {
  const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
  return [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
};

/** hip height of the seated kid in `swing` mode (design units); swingKid seats the torso bottom on the plank */
const SWING_HIP = 733;
/** hip height of a seated rider in `ride` mode (design units): the horse card seats it on the saddle */
export const RIDE_HIP = 700;

/** side view facing screen-right; march footfalls land at phase 0 (near foot) and 0.5 (far foot), like the front view.
 *  The stance foot is planted: it slides back at exactly the walking speed while the hip rises and falls over it. */
export const bodySide = (p: Pen, o: Outfit, opts: SideOpts) => {
  const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
  const Bd = BUILD[o.build ?? "adult"], skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
  const H: Blob = { ...headBlob(seed, Bd.a, 1), asym: 0.12, rot: rad(3 + 3 * (rnd(seed, 7) - 0.5)) };
  const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
  const thick = thickAngle(light), ow = 5 * u;
  const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
  const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
  type LegS = { ank: P2; pitch: number; near: boolean };
  const legs: LegS[] = [];
  let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
  if (mode === "march") {
    const S = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
    const st = (ph: number) => {
      const c = (((phase + ph) % 1) + 1) % 1;
      if (c < 0.5) { const s = c / 0.5; return { x: S / 2 - S * s, h: 0, stance: true, s }; }
      const s = (c - 0.5) / 0.5; // swing: cycloid in world space, so the foot leaves and lands at zero ground speed
      return { x: -S / 2 + S * s - (S / Math.PI) * Math.sin(2 * Math.PI * s), h: liftH * Math.sin(Math.PI * s), stance: false, s };
    };
    const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
    const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
    hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
    for (const [L, near] of [[fL, false], [nL, true]] as const)
      legs.push({ ank: [300 + L.x, ankY - L.h], pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)), near });
    lean = 4 + 3 * Math.cos(2 * two * phase); // 7 deg at contact, 1 deg at passing
    nearFwd = nL.x / (S / 2);
  } else if (mode === "push") {
    hipY = ankY - 0.87 * legLen;
    legs.push({ ank: [300 - 0.5 * legLen, ankY], pitch: rad(-8), near: false }, { ank: [300 + 0.32 * legLen, ankY], pitch: 0, near: true });
    lean = 14 * pose;
  } else if (mode === "swing") {
    hipY = SWING_HIP;
    const a = rad(60 * pose);
    for (const [dx, near] of [[-6, false], [0, true]] as const) {
      const knee: P2 = [300 + l1 * 0.98 + dx * u, hipY + 6 * u];
      legs.push({ ank: [knee[0] + l2 * Math.sin(a), knee[1] + l2 * Math.cos(a)], pitch: -a * 0.5, near });
    }
  } else if (mode === "ride") {
    hipY = RIDE_HIP;
    for (const [dx, near] of [[-7, false], [0, true]] as const) legs.push({ ank: [300 + 0.24 * legLen + dx * u, hipY + 0.74 * legLen], pitch: rad(-8), near });
    lean = 3 + 5 * pose;
  } else {
    legs.push({ ank: [300 - 4 * u, ankY], pitch: 0, near: false }, { ank: [300 + 4 * u, ankY], pitch: 0, near: true });
  }
  const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip: P2 = [300, hipY];
  p.rot = null;
  if (o.cloak && mode !== "swing" && mode !== "ride") { // the mantle hangs behind the back, flaring to the ground
    const Ta = (o.build === "stout" ? 0.36 : 0.31) * W, x0 = 300 + 2 * u, top = chin + 0.06 * HH, bot = sole - 3 * u;
    const cp: P2[] = [[x0 - 0.6 * Ta, top], [x0 + 0.4 * Ta, top], [x0 + 0.3 * Ta, bot], ...curve([x0 + 0.3 * Ta, bot], [x0 - 0.7 * Ta, bot + 3 * u], [x0 - 1.7 * Ta, bot], 8).slice(1),
      ...curve([x0 - 1.7 * Ta, bot], [x0 - 1.2 * Ta, (top + bot) / 2], [x0 - 0.6 * Ta, top], 10).slice(1, -1)];
    p.gradFill(cp, o.cloak, mul(o.cloak, SH_CLOTH), light);
    if (o.trim) p.clip(cp, () => {
      const hem: P2[] = [[x0 - 2 * Ta, bot - 0.12 * HH], [x0 + Ta, bot - 0.12 * HH], [x0 + Ta, bot + 8 * u], [x0 - 2 * Ta, bot + 8 * u]];
      p.poly(hem, o.trim === "ermine" ? "#f7f4ec" : o.trim!, 1.6 * u);
      if (o.trim === "ermine") ermine(p, x0 - 2 * Ta, bot - 0.12 * HH, x0 + Ta, bot, u);
    });
    p.inkRing(cp, ow, thick);
  }
  for (const L of legs) {
    const knee = mode === "swing" ? ([300 + l1 * 0.98 + (L.near ? 0 : -6 * u), hipY + 6 * u] as P2) : ik(hip, L.ank, l1, l2);
    const hp0: P2 = [300 + (L.near ? 0 : -5 * u), hipY];
    p.stroke([hp0, knee, L.ank], 5.8 * u, L.near ? nearCol : farCol);
    const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
    footStroke(p, [L.ank[0] - 3 * u * c, L.ank[1] - 3 * u * s], [L.ank[0] + 13 * u * c, L.ank[1] + 13 * u * s + 0.5 * u],
      7.5 * u, L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82));
  }
  // ---- upper body leans about the hip ----
  p.rot = lean ? [rad(lean), 300, hipY] : null;
  const T: Blob = { a: (o.build === "stout" ? 0.36 : 0.31) * W, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.5, egg: 0.1, asym: 0.06,
    rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
  const S: P2 = [tcx + 0.05 * T.a, chin + 0.14 * HH], aLen = 0.95 * HH;
  const swingArm = (ang: number): [P2, P2, P2] => {
    const e: P2 = [S[0] + Math.sin(ang) * aLen * 0.5, S[1] + Math.cos(ang) * aLen * 0.5], a2 = ang + rad(16) * Math.sign(ang || 1);
    return [S, e, [e[0] + Math.sin(a2) * aLen * 0.5, e[1] + Math.cos(a2) * aLen * 0.5]];
  };
  const rifle = !!o.rifle && (mode === "march" || mode === "stand");
  const sprop = opts.prop ?? null, swd = Array.isArray(sprop) && sprop[0] === "sword" ? clamp(sprop[1], 0, 1) : -1;
  const reins = (dx: number): [P2, P2, P2] => [S, [S[0] + 0.12 * HH + dx, S[1] + 0.36 * HH], [S[0] + 0.44 * HH + dx, chin + 0.5 * HH]];
  const B0: P2 = [tcx + 0.72 * T.a, chin + 0.58 * HH], B1: P2 = [tcx - 0.95 * T.a - 22 * u, crown - 0.4 * HH];
  let near: [P2, P2, P2], far: [P2, P2, P2] | null;
  if (mode === "swing") { near = [S, [S[0] + 12 * u, S[1] - 0.16 * HH], [300 + 6 * u, chin - 0.3 * HH]]; far = [S, [S[0] + 8 * u, S[1] - 0.18 * HH], [300 + 2 * u, chin - 0.36 * HH]]; }
  else if (mode === "push") {
    const reach = 0.55 * HH + 0.45 * HH * pose;
    let hN: P2 = [S[0] + reach, S[1] + 0.06 * HH];
    if (opts.hand) {
      // target is in final canvas units; the arm is drawn inside the lean rotation, so undo it
      const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
      const tg: P2 = [300 + dx * Math.cos(th) - dy * Math.sin(th), hipY + dx * Math.sin(th) + dy * Math.cos(th)];
      hN = [hN[0] + (tg[0] - hN[0]) * pose, hN[1] + (tg[1] - hN[1]) * pose];
    }
    near = [S, [(S[0] + hN[0]) / 2, (S[1] + hN[1]) / 2 + 0.06 * HH], hN];
    far = [S, [(S[0] + hN[0]) / 2 - 4 * u, (S[1] + hN[1]) / 2 - 0.02 * HH], [hN[0] - 6 * u, hN[1] - 0.08 * HH]];
  } else if (swd >= 0) {
    near = [S, lerp2([S[0] + 0.2 * HH, S[1] + 0.38 * HH], [S[0] + 0.3 * HH, S[1] - 0.25 * HH], swd), lerp2([S[0] + 0.38 * HH, S[1] + 0.7 * HH], [S[0] + 0.5 * HH, S[1] - 0.6 * HH], swd)];
    far = mode === "ride" ? reins(-4 * u) : null;
  } else if (sprop === "tuck") {
    near = [S, [S[0] + 0.08 * HH, S[1] + 0.42 * HH], [tcx + 0.82 * T.a, chin + 0.36 * HH]]; far = mode === "ride" ? reins(-4 * u) : null;
  } else if (sprop === "book") {
    near = [S, [S[0] + 0.06 * HH, S[1] + 0.42 * HH], [tcx + 1.3 * T.a, chin + 0.52 * HH]]; far = [S, [S[0] + 0.02 * HH, S[1] + 0.4 * HH], [tcx + 1.25 * T.a, chin + 0.48 * HH]];
  } else if (mode === "ride") { near = reins(0); far = reins(-4 * u); }
  else if (rifle) { near = [S, [S[0] - 4 * u, S[1] + 0.42 * HH], B0]; far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0); }
  else { near = swingArm(rad(-30) * nearFwd); far = mode === "march" ? swingArm(rad(30) * nearFwd) : null; }
  if (far) { p.stroke(curve(far[0], far[1], far[2]), 5.2 * u, farArm); p.dot(far[2][0], far[2][1], 5.5 * u); }
  if (o.robe && mode !== "swing" && mode !== "ride") {
    const top = chin - 0.1 * HH, bot = sole - 0.05 * HH;
    const rb = blobPts(tcx, (top + bot) / 2, { a: 1.18 * T.a, b: 0.5 * (bot - top), nTop: 2.2, nBot: 3.4, egg: 0.2, asym: 0.04, rot: 0, noise: 0.006, seed: seed + 9 });
    p.gradFill(rb, o.robe, mul(o.robe, SH_CLOTH), light);
    if (o.lapels) p.clip(rb, () => p.band([[tcx + 0.95 * T.a, top], [tcx + 1.1 * T.a, bot + 10 * u]], o.lapels!, 0.22 * T.a, 1.4 * u));
    p.inkRing(rb, ow, thick);
  }
  p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
  p.clip(tp, () => {
    if (o.lapels) p.poly([[tcx + 0.45 * T.a, chin - 0.1 * HH], [tcx + 1.2 * T.a, chin - 0.1 * HH], [tcx + 1.2 * T.a, chin + 0.6 * HH], [tcx + 0.62 * T.a, chin + 0.6 * HH]], o.lapels, 1.8 * u);
    if (o.collar) p.band([[tcx - 1.3 * T.a, chin + 0.02 * HH], [tcx + 1.3 * T.a, chin + 0.02 * HH]], o.collar, 0.11 * HH, 1.6 * u);
    if (o.belt) p.band([[tcx - 0.65 * T.a, chin - 0.05 * HH], [tcx + 0.75 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
    if (o.sash) sashBand(p, [[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
    if (!o.dress) for (let i = 0; i < 3; i++) { const y = chin + 0.16 * HH + i * 0.24 * HH; p.dot(tcx + 0.8 * T.a, y, 3 * u, INK); p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7)); }
  });
  p.inkRing(tp, ow, thick);
  if (rifle) {
    p.band([B0, B1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(B0, B1, 0.6), B1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  if (o.epaulettes) epaulette(p, o.epaulettes, S[0], S[1] - 3 * u, u, 0.8);
  if (o.cloak && o.trim && mode !== "swing") shoulderCape(p, o.trim === "ermine" ? "#f7f4ec" : o.trim, tcx, T.a, chin, HH, u, light, thick, ow, seed);
  p.stroke(curve(near[0], near[1], near[2]), 5.2 * u, armCol); p.dot(near[2][0], near[2][1], 5.5 * u);
  if (swd >= 0) sabre(p, near[2][0], near[2][1], rad(60 - 125 * swd), 0.95 * HH, u);
  if (sprop === "tuck") p.poly([[near[2][0] - 9 * u, near[2][1] - 11 * u], [near[2][0] + 8 * u, near[2][1] - 9 * u], [near[2][0] + 10 * u, near[2][1] + 10 * u], [near[2][0] - 7 * u, near[2][1] + 9 * u]], shade(o.jacket, 0.96), 1.8 * u);
  if (sprop === "book") {
    const [bx, by] = near[2];
    p.poly([[bx - 4 * u, by + 2 * u], [bx + 26 * u, by - 30 * u], [bx + 34 * u, by - 26 * u], [bx + 6 * u, by + 6 * u]], "#f6efdc", 2 * u);
    p.poly([[bx - 2 * u, by + 4 * u], [bx - 14 * u, by - 34 * u], [bx - 6 * u, by - 38 * u], [bx + 6 * u, by + 2 * u]], "#8a3b2c", 2 * u);
    p.dot(bx, by, 5.5 * u);
  }
  // ---- head ----
  const hx = 300 + 4 * u;
  hatBehind(p, o, H, hx, hc, light, thick, ow, true);
  const hp = blobPts(hx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
  faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout", o.brow ?? 1);
  p.rot = null;
};

/** rope + seat + seated kid on a 700 x 2300 canvas; the pivot is design (350, 20); kid drawn at 0.92 scale */
export const swingKid = (p: Pen, o: Outfit, kick: number, expr: Expr, light = DEF_LIGHT, blink: number = 0) => {
  const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
  // two ropes from the pivot to the ends of a wide plank, the kid framed between them: a single rope behind the kid
  // ended at the cap and read as a hanging. Far rope behind the kid, near rope drawn over (clear of the face).
  const seat = rope + 18, x0 = 150, x1 = 550;
  p.line([[350, 20], [x0 + 16, seat + 4]], "#a07a4c", 10);
  p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
  const g = p.g;
  g.save();
  g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
  g.scale(k, k);
  bodySide(new Pen(g), o, { expr, mode: "swing", pose: kick, light, seed: 5, blink });
  g.restore();
  p.line([[350, 20], [x1 - 16, seat + 4]], "#a07a4c", 10);
};

// ---------------- effects ----------------
export const fxNote = (p: Pen, kind: number, col = "#1f2a44") => {
  p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
  p.stroke([[110, 190], [110, 40]], 14);
  if (kind === 0) p.poly([[110, 40], [170, 70], [170, 110], [110, 82]], col, 8);
  else {
    p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
    p.stroke([[186, 160], [186, 20]], 14);
    p.poly([[110, 40], [186, 20], [186, 50], [110, 70]], col, 8);
  }
};

/** spark / impact star on a 500 x 500 canvas; t in 0..1 */
export const fxBurst = (p: Pen, t: number, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230) => {
  const c = 250, e = 1 - (1 - t) ** 3;
  for (let i = 0; i < rays; i++) {
    const a = rad((i * 360) / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
    p.poly([[c + r0 * 0.5 * Math.cos(a + 0.18), c + r0 * 0.5 * Math.sin(a + 0.18)], [c + ra * Math.cos(a), c + ra * Math.sin(a)],
      [c + r0 * 0.5 * Math.cos(a - 0.18), c + r0 * 0.5 * Math.sin(a - 0.18)]], col, Math.max(3, 8 * (1 - t)));
  }
  if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};

/** water splash crown on an 800 x 800 canvas; t in 0..1 */
export const fxSplash = (p: Pen, t: number) => {
  const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
  const blue = "#bfe8ff", deep = "#6cc0f0";
  if (rise > 0.02) {
    const pts: P2[] = [];
    for (let i = 0; i < 19; i++) {
      const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
      pts.push([c - 330 + (660 * i) / 18, size - 120 - h]);
    }
    p.poly([...pts, [c + 330, size - 90], [c - 330, size - 90]], blue, 10);
    p.ell(c, size - 100, 360, 46, deep, 10);
  }
  for (let i = 0; i < 8; i++) {
    const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
    if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
  }
};

/** dust puff on a 300 x 300 canvas; t in 0..1 */
export const fxPuff = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
    p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
  }
};

/** circling stars on a 420 x 210 canvas */
export const fxStars = (p: Pen, t: number) => {
  for (let i = 0; i < 4; i++) {
    const a = t * Math.PI * 2 + (i * Math.PI) / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts: P2[] = [];
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90); pts.push([x + r * Math.cos(b), y + r * Math.sin(b)]); }
    p.poly(pts, "#ffd84a", 6);
  }
};

/** three jittering strain ticks on a 300 x 300 canvas */
export const fxCreak = (p: Pen, t: number) => {
  const j = 6 * Math.sin(t * 40);
  for (const a of [-30, 0, 30]) {
    const b = rad(a - 90);
    p.stroke([[150 + 70 * Math.cos(b) + j, 230 + 70 * Math.sin(b)], [150 + 100 * Math.cos(b) + 10 + j, 230 + 100 * Math.sin(b)],
      [150 + 130 * Math.cos(b) + j, 230 + 130 * Math.sin(b)]], 10);
  }
};

/** flat water ring (drawn top-down) on a 600 x 600 canvas; t in 0..1 */
export const fxRing = (p: Pen, t: number) => {
  // thin light water rings (white crest, pale blue trailing rings), thinning as they spread
  const g = p.g;
  for (let k = 0; k < 3; k++) {
    const u = t - k * 0.22;
    if (u <= 0 || u >= 1) continue;
    g.beginPath(); g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
    g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa"; g.lineWidth = 9 * (1 - u) + 3; g.stroke();
  }
};

/** text-free sign on a 700 x 520 canvas: "no marching in step on the bridge". A bridge (deck + arch + piers), four
 *  identical pairs of marching legs in the same stride (in step), a bold red X over all of it. */
export const fxSign = (p: Pen) => {
  const g = p.g, RED = "#d42f2f";
  p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
  p.poly(rrect(14, 14, 686, 506, 40), null, 14);
  // bridge: deck, stone arch underneath, two piers
  p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
  g.beginPath(); g.moveTo(112, 470); g.quadraticCurveTo(350, 300, 588, 470);
  g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = "round"; g.stroke();
  for (const x of [88, 612]) p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
  // four identical soldiers' legs mid-stride: same leg forward on every one = in step
  for (const x of [150, 278, 406, 534]) {
    p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);                  // coat hem
    p.stroke([[x - 8, 210], [x + 34, 262], [x + 46, 338]], 15, INK);           // front leg
    p.stroke([[x + 6, 210], [x - 12, 274], [x - 36, 336]], 15, INK);           // back leg
    p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);                          // boots point forward
    p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
  }
  // big red X
  for (const [a, b] of [[[96, 70], [604, 452]], [[604, 70], [96, 452]]] as [[number, number], [number, number]][]) {
    p.stroke([a, b], 58, "#ffffff");
    p.stroke([a, b], 42, RED);
  }
};

/** soft cartoon cloud on a 600 x 300 canvas */
export const fxCloud = (p: Pen, seed: number) => {
  const blobs: [number, number, number][] = [[150, 190, 80], [250, 150, 105], [360, 160, 95], [450, 195, 70], [300, 210, 90]];
  for (const [x, y, r] of blobs) p.ell(x + ((seed * 37) % 20) - 10, y, r, r * 0.8, "#ffffff", 0);
  p.ell(300, 235, 230, 40, "#ffffff", 0);
};

/** cast shadow on a 128 x 256 canvas: dark soft contact pool at the feet (y 205) and a softer tail that runs up the
 *  canvas = away from the sun, fading with distance; multiply colour (sRGB-encoded linear ratio), white = no change */
export const fxShadow = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 256);
  g.save(); g.filter = "blur(9px)";
  const lg = g.createLinearGradient(0, 205, 0, 22);
  lg.addColorStop(0, mix(col, WHITE, 0.08)); lg.addColorStop(0.55, mix(col, WHITE, 0.3)); lg.addColorStop(1, mix(col, WHITE, 0.85));
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(40, 205); g.bezierCurveTo(36, 120, 46, 50, 64, 30); g.bezierCurveTo(82, 50, 92, 120, 88, 205); g.closePath(); g.fill();
  g.fillStyle = col; g.beginPath(); g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2); g.fill();
  g.restore();
};

/** tight contact shadow right under the feet on a 128 x 128 canvas: dark core, short fall-off (multiply colour) */
export const fxContact = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.32, 0.02], [0.5, 0.22], [0.66, 0.58], [0.82, 0.88], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};

/** floating wooden plank, side-on, on a 320 x 110 canvas */
export const fxPlank = (p: Pen) => {
  p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
  p.line([[40, 46], [150, 44], [270, 50]], "#7d5234", 4);
  p.line([[60, 62], [200, 64], [284, 60]], "#7d5234", 4);
  p.dot(36, 54, 5, INK); p.dot(284, 54, 5, INK);
};

/** floating marching drum (no text) on a 260 x 240 canvas: white shell, red hoops, ink zig-zag cord */
export const fxDrum = (p: Pen) => {
  p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
  p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
  p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
  p.line([[52, 88], [82, 172], [112, 88], [142, 172], [172, 88], [202, 172]], INK, 6);
  p.ell(130, 58, 98, 18, "#f7f3ea", 8);
};

/** soft ground contact blob on a 128 x 128 canvas, multiply colour (sRGB-encoded linear ratio) in the centre */
export const fxBlob = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE; g.fillRect(0, 0, 128, 128);
  // soft contact shadow: flat core, then a long smooth (roughly gaussian) fall-off to white = no change
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.5, 0.04], [0.64, 0.18], [0.76, 0.42], [0.87, 0.72], [0.95, 0.92], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
};
