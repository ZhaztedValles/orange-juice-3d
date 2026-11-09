"""Original score from mood sections: every note is generated here (seeded), played on instruments.py voices.

render(sections, key, bpm, dur, seed) -> (n, 2) float array at 48 kHz.
Each section starts on its own downbeat, is levelled to its mood's loudness, rings 0.25 s past its end with a
fade-out (the crossfade into the next section), and the whole score goes through a small room (rt60 0.6 s).
"""
import numpy as np

from . import instruments as I
from .dsp import ns, rng, pan, place, integrated, dbg, ramp, make_ir, convolve_st

MOODS = ("hook", "playful", "march", "warm", "tension", "mystery", "sad", "none")
KEYS = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
        "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
MINOR = ("tension", "mystery", "sad")
XFADE = 0.25
RT60, WET = 0.6, 0.22
LEVEL = {"hook": -18.0, "playful": -20.0, "march": -19.0, "warm": -21.0, "tension": -20.0, "mystery": -23.0,
         "sad": -22.0}                                   # per-mood integrated loudness before the room

MAJ_SCALE = (0, 2, 4, 5, 7, 9, 11)
MIN_SCALE = (0, 2, 3, 5, 7, 8, 10)
# chords as (root offset from the tonic, triad intervals)
MAJ, MIN_ = (0, 4, 7), (0, 3, 7)
POP = [(0, MAJ), (7, MAJ), (9, MIN_), (5, MAJ)]                       # I-V-vi-IV
MARCH = [(0, MAJ), (0, MAJ), (7, MAJ), (7, MAJ), (0, MAJ), (5, MAJ), (7, MAJ), (0, MAJ)]
WARM = [(0, MAJ), (9, MIN_), (5, MAJ), (7, MAJ)]                      # I-vi-IV-V
SAD = [(0, MIN_), (8, MAJ), (5, MIN_), (7, MAJ)]                      # i-VI-iv-V (minor key)

# one-bar rhythms in beats: (onset, length)
R_PLAYFUL = [[(0, 1), (1, 0.5), (1.5, 0.5), (2, 1), (3, 1)],
             [(0, 0.5), (0.5, 0.5), (1, 1), (2, 0.5), (2.5, 0.5), (3, 1)],
             [(0, 1.5), (1.5, 0.5), (2, 2)],
             [(0, 1), (1, 1), (2, 0.5), (2.5, 0.5), (3, 0.5), (3.5, 0.5)]]
R_MARCH = [[(0, 1), (1, 1), (2, 1.5), (3.5, 0.5)],
           [(0, 0.75), (0.75, 0.25), (1, 1), (2, 0.75), (2.75, 0.25), (3, 1)],
           [(0, 0.5), (0.5, 0.5), (1, 0.5), (1.5, 0.5), (2, 2)],
           [(0, 1.5), (1.5, 0.5), (2, 1), (3, 1)]]
R_SAD = [[(0, 2), (2, 2)], [(0, 1), (1, 1), (2, 2)], [(0, 3), (3, 1)], [(0, 1.5), (1.5, 0.5), (2, 2)]]
CADENCE = [(0, 1), (1, 1), (2, 2)]


def key_pc(key):
    return KEYS[key]


def at_or_above(pc, lo):
    """lowest midi note >= lo with pitch class pc"""
    return lo + (pc - lo) % 12


def melody(r, tonic_pc, scale, chords, rhythms, lo, hi, bars=8):
    """seeded 8-bar tune [(beat, beats, midi)]: chord tones on the beats, scale steps between, bars 5-7 answer 1-3,
    bar 8 cadences on the tonic"""
    pcs = sorted({(tonic_pc + s) % 12 for s in scale})
    pool = [m for m in range(lo, hi + 1) if m % 12 in pcs]
    prev = at_or_above(tonic_pc, lo + 5)
    picks = [r.integers(len(rhythms)) for _ in range(4)]
    notes, first = [], []
    for bar in range(bars):
        root, tri = chords[bar % len(chords)]
        ct = {(tonic_pc + root + i) % 12 for i in tri}
        if 4 <= bar <= 6:                                 # answer phrase: repeat bars 1-3, last note varied
            for b, ln, m in first[bar - 4]:
                notes.append((bar * 4 + b, ln, m))
            if bar == 6:
                b, ln, m = notes[-1]
                cand = [c for c in pool if c % 12 in ct and c != m and abs(c - m) <= 5] or [m]
                notes[-1] = (b, ln, int(r.choice(cand)))
            prev = notes[-1][2]
            continue
        rh = CADENCE if bar == bars - 1 else rhythms[picks[bar % 4]]
        this = []
        for k, (b, ln) in enumerate(rh):
            last = bar == bars - 1 and k == len(rh) - 1
            if last:
                cand = [c for c in pool if c % 12 == tonic_pc]
            elif b == int(b):                             # on the beat: a chord tone
                cand = [c for c in pool if c % 12 in ct]
            else:                                         # off the beat: a scale step
                cand = [c for c in pool if 0 < abs(c - prev) <= 2]
            cand = cand or pool
            w = np.array([np.exp(-abs(c - prev) / 2.5) * (0.4 if c == prev else 1.0) for c in cand])
            m = int(cand[r.choice(len(cand), p=w / w.sum())])
            this.append((b, ln, m))
            prev = m
        if bar < 4:
            first.append(this)
        notes += [(bar * 4 + b, ln, m) for b, ln, m in this]
    return notes


class _Sec:
    """one section's buffer, bar grid and helpers"""

    def __init__(self, span, bpm, seed):
        self.span, self.beat = span, 60.0 / bpm
        self.n = ns(span + XFADE)
        self.buf = np.zeros((2, self.n))
        self.r = rng(seed)
        self.bars = int(np.ceil(span / (4 * self.beat) - 1e-9))

    def t(self, beats):
        return beats * self.beat

    def live(self, beats):
        return self.t(beats) < self.span - 0.02

    def put(self, x, beats, p=0.0, gain=1.0):
        if not self.live(beats):
            return
        x = pan(x, p) if x.ndim == 1 else x
        place(self.buf, x, self.t(beats) + self.r.normal(0, 0.002) * (beats > 0), gain)

    def vel(self, v):
        return float(np.clip(v * self.r.uniform(0.92, 1.06), 0.05, 1.0))


def _tune(s, inst, notes, p, v, **kw):
    for b, ln, m in notes:
        if inst is I.glock or inst is I.musicbox or inst is I.vibes:
            x = inst(I.m2f(m), s.vel(v), s.r, **kw)
        else:
            x = inst(I.m2f(m), ln * s.beat * 0.92, s.vel(v), s.r, **kw)
        s.put(x, b, p)


def _loop(notes, bars, period=8):
    return [(b + 4 * period * k, ln, m) for k in range(int(np.ceil(bars / period))) for b, ln, m in notes]


def _hook(s, pc):
    lo = at_or_above(pc, 79)
    shape = [(0, 0.5, 0), (0.5, 0.5, 4), (1, 0.5, 7), (1.5, 0.5, 12), (2, 1, s.r.choice([9, 11, 14])),
             (3, 1, 7), (4, 0.5, 12), (4.5, 0.5, s.r.choice([11, 14])), (5, 1, 16), (6, 2, 12)]
    for k in range(max(1, int(np.ceil(s.bars / 2)))):
        _tune(s, I.glock, [(b + 8 * k, ln, lo + iv) for b, ln, iv in shape], 0.2, 0.85)
        s.put(I.pluck(I.m2f(at_or_above(pc, 36)), 0.8, s.r, dur=1.4), 8 * k, 0.0)
        s.put(I.pluck(I.m2f(at_or_above(pc, 36) + 7), 0.7, s.r, dur=1.4), 8 * k + 4, 0.0)
    end = np.floor(s.span / s.beat + 1e-6)               # snare pickup into each 2-bar repeat and the next section
    for e in sorted({*range(8, int(end), 8), end}):
        for b, v in ((-1, 0.45), (-0.5, 0.55), (-0.25, 0.7)):
            if e + b >= 0:
                s.put(I.snare(s.vel(v), s.r), e + b, 0.1)


def _playful(s, pc):
    mel = melody(s.r, pc, MAJ_SCALE, POP, R_PLAYFUL, at_or_above(pc, 76), at_or_above(pc, 76) + 17)
    _tune(s, I.glock, _loop(mel, s.bars), 0.25, 0.7)
    for bar in range(s.bars):
        root, _ = POP[bar % 4]
        f = I.m2f(at_or_above((pc + root) % 12, 36))
        s.put(I.pluck(f, 0.85, s.r, dur=0.9), 4 * bar, -0.05)
        s.put(I.pluck(f * (1.5 if bar % 2 else 1.0), 0.7, s.r, dur=0.9), 4 * bar + 2, -0.05)


def _march(s, pc):
    mel = melody(s.r, pc, MAJ_SCALE, MARCH, R_MARCH, at_or_above(pc, 72), at_or_above(pc, 72) + 16)
    _tune(s, I.fife, _loop(mel, s.bars), -0.2, 0.55)
    for bar in range(s.bars):
        root, tri = MARCH[bar % 8]
        rp = (pc + root) % 12
        tuba = at_or_above(rp, 34)
        for b, f in ((0, tuba), (2, tuba + 7 if bar % 2 else tuba)):
            s.put(I.brass(I.m2f(f), s.beat * 0.55, s.vel(0.8), s.r, kind="tuba"), 4 * bar + b, 0.0)
        for b in (1, 3):                                  # pah: short horn chord on the after-beats
            for iv in tri:
                m = at_or_above((rp + iv) % 12, 55)
                s.put(I.brass(I.m2f(m), s.beat * 0.3, s.vel(0.45), s.r, kind="horn"), 4 * bar + b, 0.3, 0.5)
        for b, v in ((0, 0.7), (1, 0.45), (1.5, 0.3), (2, 0.6), (3, 0.45), (3.5, 0.3), (3.75, 0.35)):
            s.put(I.snare(s.vel(v), s.r), 4 * bar + b, 0.1)


def _warm(s, pc):
    for bar in range(s.bars):
        root, tri = WARM[bar % 4]
        rp = (pc + root) % 12
        chord = [I.m2f(at_or_above((rp + iv) % 12, 52)) for iv in tri]
        if s.live(4 * bar):
            place(s.buf, I.pad(chord, 4 * s.beat, 0.5, s.r, att=0.5, rel=0.8), s.t(4 * bar))
        arp = [at_or_above((rp + iv) % 12, 67) for iv in tri]
        arp = arp + [arp[0] + 12] + [arp[2], arp[1] + 12 if bar % 2 else arp[1], arp[0] + 12, arp[2]]
        for k, m in enumerate(arp):
            s.put(I.vibes(I.m2f(m), s.vel(0.55), s.r, dur=1.6), 4 * bar + 0.5 * k, 0.3 if k % 2 else -0.3)


def _tension(s, pc):
    mp = (pc + 9) % 12                                   # relative minor
    chord = [I.m2f(at_or_above((mp + iv) % 12, 48)) for iv in (0, 3, 7)]
    place(s.buf, I.pad(chord, s.span, 0.55, s.r, att=0.4, rel=0.25, warm=700), 0.0)
    f = I.m2f(at_or_above(mp, 41))
    for b in range(int(np.ceil(s.span / s.beat))):
        s.put(I.timpani(f, s.vel(0.75), s.r, dur=1.2), b, 0.0)
    u = np.clip(np.arange(s.n) / max(1, ns(s.span)), 0, 1)
    s.buf *= 0.3 + 0.7 * u ** 1.5                         # crescendo over the section


def _mystery(s, pc):
    mp = (pc + 9) % 12
    pal = [0, 3, 7, 8, 11, 12, 14, 15]                   # natural minor with the leading tone
    place(s.buf, I.pad([I.m2f(at_or_above(mp, 40)), I.m2f(at_or_above(mp, 40) + 7)], s.span, 0.5, s.r, att=1.0,
                       rel=0.25, warm=500), 0.0)
    base = at_or_above(mp, 64)
    for b in np.arange(0, s.span / s.beat, 2.0):
        if b == 0 or s.r.uniform() < 0.6:
            m = base + int(s.r.choice(pal)) if b else base
            s.put(I.vibes(I.m2f(m), s.vel(0.5), s.r, dur=2.5, trem=4.2, trem_depth=0.55), b + 0.5 * (s.r.uniform() < 0.3),
                  float(s.r.uniform(-0.4, 0.4)))


def _sad(s, pc):
    mp = (pc + 9) % 12
    mel = melody(s.r, mp, MIN_SCALE, SAD, R_SAD, at_or_above(mp, 72), at_or_above(mp, 72) + 14)
    _tune(s, I.musicbox, _loop(mel, s.bars), 0.15, 0.6, dur=2.2)
    for bar in range(s.bars):
        root, tri = SAD[bar % 4]
        rp = (mp + root) % 12
        if s.live(4 * bar):
            chord = [I.m2f(at_or_above((rp + iv) % 12, 50)) for iv in tri]
            place(s.buf, I.pad(chord, 4 * s.beat, 0.45, s.r, att=0.8, rel=0.9, warm=650), s.t(4 * bar))


_MOOD_FN = {"hook": _hook, "playful": _playful, "march": _march, "warm": _warm, "tension": _tension,
            "mystery": _mystery, "sad": _sad}


def render_section(mood, span, key, bpm, seed):
    """(2, n) dry audio for one section: span seconds plus the XFADE tail, levelled, faded out past span"""
    s = _Sec(span, bpm, seed)
    if mood == "none":
        return s.buf
    _MOOD_FN[mood](s, key_pc(key))
    lv = integrated(s.buf[:, : ns(span)])
    if np.isfinite(lv):
        s.buf *= dbg(LEVEL[mood] - lv)
    k = ns(span)
    s.buf[:, k:] *= ramp(s.n - k)[::-1]
    s.buf[:, : ns(0.004)] *= ramp(ns(0.004))
    return s.buf


def render(sections, key, bpm, dur, seed):
    n = ns(dur)
    out = np.zeros((2, n))
    for i, sec in enumerate(sorted(sections, key=lambda s: s["from"])):
        a, b = float(sec["from"]), float(sec["to"])
        y = render_section(sec["mood"], b - a, key, bpm, seed * 1000 + i)
        place(out, y, a)
    out = out + WET * convolve_st(out, make_ir(RT60, seed))
    if n > ns(XFADE):                                    # the score ends with the video
        out[:, n - ns(XFADE):] *= ramp(ns(XFADE))[::-1]
    return out.T.copy()
