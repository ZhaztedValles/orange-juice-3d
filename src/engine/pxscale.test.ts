import { describe, expect, it } from "vitest";
import { pxScale } from "./math";

describe("pxScale", () => {
  it("is 1 at the 1080x1920 Shorts size", () => {
    expect(pxScale(1080, 1920)).toBe(1);
  });
  it("halves at 540x960", () => {
    expect(pxScale(540, 960)).toBe(0.5);
  });
  it("keeps the old height / 1920 value at 1440x2560", () => {
    expect(pxScale(1440, 2560)).toBe(2560 / 1920);
  });
  it("equals height / 1920 for every 9:16 portrait size", () => {
    for (const w of [540, 720, 1080, 1440]) {
      const h = (w * 16) / 9;
      expect(w).toBe((h * 9) / 16);
      expect(pxScale(w, h)).toBe(h / 1920);
    }
  });
  it("is 1 at 1920x1080 widescreen", () => {
    expect(pxScale(1920, 1080)).toBe(1);
  });
});
