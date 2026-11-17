// Toulon 1793 as one height field: the inner harbour (water at y = 0, open to the east), the town on the north quay,
// the Caire heights in the south-west with the British fort ("Little Gibraltar") on a flat summit, and the hill of the
// French camp to the west of it, a shallow saddle between them. Paris (square + steps) and the palace room are flat
// sets far to the north (z ~ 2000), out of every Toulon view.
export type V3 = [number, number, number];

/** sea level 0; land 2.5 m at the shore */
export const LAND = 2.5;
export const QUAY_Z = 68; // the town quay front (water for z < QUAY_Z inside the harbour)
export const FORT_C: [number, number] = [-130, -150];
export const FORT_Y = 45;
export const FORT_R = 70; // hill radius (flat summit inside 0.3 R)
export const CAMP_C: [number, number] = [-285, -110];
export const CAMP_Y = 32;
/** the battery terrace (shot 13-14): a flat platform cut into the slope below the fort's west wall */
export const BAT_C: [number, number] = [-176, -142];
export const BAT_Y = 23;
export const CAMP_R = 95;

const smooth = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
/** flat-topped hill: full height inside 0.3 R, smooth flank to 0 at R */
const mesa = (x: number, z: number, c: [number, number], H: number, R: number) => H * smooth((R - Math.hypot(x - c[0], z - c[1])) / (0.7 * R));
/** harbour measure: < 1 inside the water (superellipse basin, open to the east) */
export const basin = (x: number, z: number) => {
  const dz = Math.abs(z + 40) / 110;
  if (x > 20) return dz ** 4;
  return (Math.abs(x - 20) / 150) ** 4 + dz ** 4;
};
const wob = (x: number, z: number) => 0.9 * Math.sin(x * 0.031 + 1.3) * Math.sin(z * 0.027 + 0.4) + 0.5 * Math.sin(x * 0.07 + z * 0.05);

/** ground height at (x, z) (Toulon); the Paris sets use their own flat floors */
export const ground = (x: number, z: number) => {
  // the town: dead flat behind a hard quay wall
  if (x > -75 && x < 125 && z >= QUAY_Z && z < 230) return LAND - 0.3; // paving (sets.ts) lies 0.3 m above
  if (Math.hypot(x - FORT_C[0], z - FORT_C[1]) < 0.3 * FORT_R) return FORT_Y;
  if (Math.hypot(x - CAMP_C[0], z - CAMP_C[1]) < 0.3 * CAMP_R) return CAMP_Y;
  let land = LAND + Math.max(0, wob(x, z)) * 1.2;
  land = Math.max(land, LAND + mesa(x, z, FORT_C, FORT_Y - LAND, FORT_R), LAND + mesa(x, z, CAMP_C, CAMP_Y - LAND, CAMP_R));
  // low ridge joining the two hills (the saddle the batteries sit on)
  land = Math.max(land, LAND + 14 * Math.exp(-(((z + 135) / 40) ** 2)) * smooth((x + 300) / 60) * smooth((-110 - x) / 50));
  // the hills behind the town (north) rise toward Mont Faron
  land += Math.max(0, z - 240) * 0.18 + 30 * smooth((z - 300) / 120);
  const db = Math.hypot(x - BAT_C[0], z - BAT_C[1]);
  if (db < 16) land += (BAT_Y - land) * smooth((16 - db) / 6);
  const e = basin(x, z);
  const k = smooth((e - 0.82) / 0.3); // 0 water .. 1 land
  return -6 + (land + 6) * k;
};

// ---------------- Paris + palace sets (flat, y = 0) ----------------
export const PARIS: V3 = [0, 0, 2000];      // centre of the square
export const STEPS_Z = 2024;                 // foot of the grand steps (north side of the square), rising toward +z
export const STEP_N = 12, STEP_H = 0.25, STEP_D = 0.55;
export const stepTop = (z: number) => Math.max(0, Math.min(STEP_N, Math.floor((z - STEPS_Z) / STEP_D) + 1)) * STEP_H * (z >= STEPS_Z ? 1 : 0);
export const ROOM: V3 = [400, 0, 2000];     // the palace room (throne at +z end, war table in the middle)
export const THRONE: V3 = [400, 0, 2010.5];
export const WAR_TABLE: V3 = [400, 0, 1998];
