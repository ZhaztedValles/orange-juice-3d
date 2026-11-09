import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

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
});
