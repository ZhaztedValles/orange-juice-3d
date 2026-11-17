import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

type LongScan = { id: string; n: number; title: string };
// the script has no type declarations, so import it through a string-typed specifier
const GEN: string = "../scripts/gen-registry.mjs";
const loadGen = async () => (await import(GEN)) as { scanLong: (dir?: string) => LongScan[] };

describe("video registry", () => {
  it("is up to date with videos/", () => {
    const before = readFileSync("src/videos.generated.ts", "utf8");
    execFileSync("node", ["scripts/gen-registry.mjs", "--check"]); // exits 1 if it would change the file
    expect(readFileSync("src/videos.generated.ts", "utf8")).toBe(before);
  });
  it("lists the bridge template with its frame count", async () => {
    const { VIDEOS } = await import("./videos.generated");
    const b = VIDEOS.find((v) => v.id === "000-bridge");
    expect(b?.frames).toBe(2025);
  });
  it("lists no long chapters as Shorts", async () => {
    const { VIDEOS, LONG_CHAPTERS } = await import("./videos.generated");
    const { scanLong } = await loadGen();
    const longIds = [...LONG_CHAPTERS.map((c) => c.id), ...scanLong().map((c) => c.id)];
    for (const v of VIDEOS) for (const l of longIds) expect(v.id.startsWith(l)).toBe(false);
    for (const v of VIDEOS) expect(v.id).not.toMatch(/-ch\d+$/);
  });
  it("scan skips a long folder without chapter.json", async () => {
    const { scanLong } = await loadGen();
    const tmp = mkdtempSync(path.join(tmpdir(), "oj-long-"));
    try {
      const ch = path.join(tmp, "long", "001-x", "ch1");
      mkdirSync(ch, { recursive: true });
      writeFileSync(path.join(ch, "Video.tsx"), "export const FRAMES = 30;\n");
      expect(scanLong(path.join(tmp, "long"))).toEqual([]);
      writeFileSync(path.join(ch, "chapter.json"), JSON.stringify({ n: 1, title: "One" }));
      const got = scanLong(path.join(tmp, "long"));
      expect(got).toHaveLength(1);
      expect(got[0]).toMatchObject({ id: "001-x-ch1", n: 1, title: "One" });
      expect(scanLong(path.join(tmp, "missing", "long"))).toEqual([]);
      // sorted by the long folder id, then n numerically: ch2 before ch10
      for (const [video, ch, n] of [["002-y", "ch10", 10], ["002-y", "ch2", 2], ["000-a", "ch1", 1]] as const) {
        const d = path.join(tmp, "long", video, ch);
        mkdirSync(d, { recursive: true });
        writeFileSync(path.join(d, "Video.tsx"), "export const FRAMES = 30;\n");
        writeFileSync(path.join(d, "chapter.json"), JSON.stringify({ n, title: `T${n}` }));
      }
      expect(scanLong(path.join(tmp, "long")).map((c) => c.id)).toEqual(["000-a-ch1", "001-x-ch1", "002-y-ch2", "002-y-ch10"]);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
