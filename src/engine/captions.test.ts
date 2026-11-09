import { describe, expect, it } from "vitest";
import { cleanWord, wordAt, type Word } from "./captions";

const W: Word[] = [
  { w: "In", s: 0.25, e: 0.4 },
  { w: "1850,", s: 0.42, e: 0.9 },
  { w: "soldiers", s: 1.6, e: 2.1 }, // gap 0.70 s before this word
];
describe("wordAt", () => {
  it("shows nothing before the first word", () => expect(wordAt(W, 0.1)).toBe(-1));
  it("holds a word until the next one starts", () => expect(wordAt(W, 0.41)).toBe(0));
  it("swaps hard on the next start", () => expect(wordAt(W, 0.42)).toBe(1));
  it("hides during a long pause", () => {
    expect(wordAt(W, 1.0)).toBe(1); // e + 0.10
    expect(wordAt(W, 1.1)).toBe(-1); // past e + 0.15
  });
  it("holds the last word briefly", () => {
    expect(wordAt(W, 2.35)).toBe(2);
    expect(wordAt(W, 2.45)).toBe(-1);
  });
  it("handles an empty list", () => expect(wordAt([], 1)).toBe(-1));
});

describe("cleanWord", () => {
  it("strips outer punctuation, keeps case, apostrophes and hyphens", () => {
    expect(cleanWord("1850,")).toBe("1850");
    expect(cleanWord("\"Soldiers!\"")).toBe("Soldiers");
    expect(cleanWord("don't")).toBe("don't");
    expect(cleanWord("-well-known.")).toBe("-well-known");
    expect(cleanWord("...")).toBe("");
  });
});
