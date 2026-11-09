// Word-timed captions. Task 1 holds only the word type; the caption logic lands with the captions overlay.
/** one spoken word: text and its start / end time in seconds (from videos/<id>/words.json) */
export type Word = { w: string; s: number; e: number };
