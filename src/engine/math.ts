// Small easing helpers shared by the engine and the videos.
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/**
 * Output px per reference px. Engine pixel sizes (ink widths, blur radii, grain cells) are given at the 1080 short
 * side; this scales them by min(width, height) / 1080. For 9:16 portrait output it equals the old height / 1920.
 */
export const pxScale = (width: number, height: number) => Math.min(width, height) / 1080;
