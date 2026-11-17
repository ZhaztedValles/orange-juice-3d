import { describe, expect, it } from "vitest";
import type { Word } from "./captions";
import { phraseAt, phrases } from "./subtitles";
import sample from "../../long/000-sample/ch1/words.json";

/** words spoken back to back, 0.3 s each, starting at t0 (gaps are added by the caller via `gapBefore`) */
function speak(text: string, gapBefore: Record<number, number> = {}): Word[] {
  let t = 0;
  return text.split(" ").map((w, i) => {
    t += gapBefore[i] ?? 0;
    const word = { w, s: t, e: t + 0.3 };
    t += 0.3;
    return word;
  });
}

describe("phrases", () => {
  it("breaks at sentence ends", () => {
    const ps = phrases(speak("One two three. Four five."));
    expect(ps.map((p) => p.lines)).toEqual([["One two three."], ["Four five."]]);
  });

  it("breaks at a pause", () => {
    const words = speak("alpha beta gamma delta epsilon zeta.", { 3: 0.5 });
    const ps = phrases(words);
    expect(ps).toHaveLength(2);
    expect(ps[0].e).toBe(words[2].e);
    expect(ps[1].s).toBe(words[3].s);
  });

  it("caps the phrase size", () => {
    const text = Array.from({ length: 25 }, (_, i) => `word${i}`).join(" ");
    const ps = phrases(speak(text));
    expect(ps.length).toBeGreaterThan(1);
    for (const p of ps) {
      expect(p.lines.length).toBeLessThanOrEqual(2);
      expect(p.lines.join(" ").split(" ").length).toBeLessThanOrEqual(10);
      for (const l of p.lines) expect(l.length).toBeLessThanOrEqual(42);
    }
  });

  it("ends early rather than needing a third line", () => {
    const text = Array.from({ length: 12 }, () => "extraordinarily").join(" ");
    const ps = phrases(speak(text), { maxWords: 12 });
    for (const p of ps) {
      expect(p.lines.length).toBeLessThanOrEqual(2);
      for (const l of p.lines) expect(l.length).toBeLessThanOrEqual(42);
    }
  });

  it("ends at a comma once the phrase has 6 words", () => {
    const short = phrases(speak("a b c, d e f g h."));
    expect(short).toHaveLength(1);
    const long = phrases(speak("a b c d e f, g h i."));
    expect(long.map((p) => p.lines.join(" "))).toEqual(["a b c d e f,", "g h i."]);
  });

  it("keeps text as spoken", () => {
    const words = speak("Hello, world! This is a long sentence; it has, in fact, many many words and no end", { 4: 0.6 });
    const joined = phrases(words)
      .flatMap((p) => p.lines)
      .join(" ");
    expect(joined).toBe(words.map((w) => w.w).join(" "));
  });

  it("never leaves a one-word phrase", () => {
    // 11 words with no break: the 10-word cap would leave "swing." alone
    const ps = phrases(speak("men stepping together were pushing that bridge like a big swing."));
    expect(ps.map((p) => p.lines.join(" "))).toEqual(["men stepping together were pushing that bridge like a", "big swing."]);
    // a lone word after a pause joins the next phrase
    const q = phrases(speak("Unluckily, the river was deep.", { 1: 0.6 }));
    expect(q.map((p) => p.lines.join(" "))).toEqual(["Unluckily, the river was deep."]);
  });

  it("has no one-word phrase in the sample chapter", () => {
    for (const p of phrases(sample as Word[])) expect(p.lines.join(" ").split(" ").length).toBeGreaterThan(1);
  });

  it("returns nothing for no words", () => {
    expect(phrases([])).toEqual([]);
  });
});

describe("phraseAt", () => {
  const ps = [
    { lines: ["a"], s: 1, e: 2 },
    { lines: ["b"], s: 2.2, e: 3 }, // gap 0.2: previous stays until this starts
    { lines: ["c"], s: 4, e: 5 }, // gap 1.0: previous goes at e + 0.15
  ];
  it("is -1 before the first start", () => {
    expect(phraseAt(ps, 0.5)).toBe(-1);
  });
  it("is the phrase index inside a phrase", () => {
    expect(phraseAt(ps, 1.5)).toBe(0);
    expect(phraseAt(ps, 2.5)).toBe(1);
  });
  it("keeps the previous phrase over a short gap", () => {
    expect(phraseAt(ps, 2.1)).toBe(0);
  });
  it("is -1 in a long gap after the hold", () => {
    expect(phraseAt(ps, 3.2)).toBe(-1);
    expect(phraseAt(ps, 3.1)).toBe(1);
  });
  it("holds the last phrase for 0.3 s", () => {
    expect(phraseAt(ps, 5.2)).toBe(2);
    expect(phraseAt(ps, 5.4)).toBe(-1);
  });
  it("is -1 for no phrases", () => {
    expect(phraseAt([], 1)).toBe(-1);
  });
});
