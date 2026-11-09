"""audio.json: loading and validation (see docs/video-format.md, "audio.json")."""
import inspect
import json
import re
from pathlib import Path

from . import sfx_gen
from .score import KEYS, MOODS

FPS = 30
BPM_RANGE = (60, 180)
GAIN_RANGE = (-30.0, 6.0)
EPS = 1e-6


def _callable_kinds():
    """public functions defined in sfx_gen whose parameters other than r / dur all have defaults"""
    kinds = {}
    for name, fn in inspect.getmembers(sfx_gen, inspect.isfunction):
        if name.startswith("_") or fn.__module__ != sfx_gen.__name__:
            continue
        ps = inspect.signature(fn).parameters
        if "r" not in ps:
            continue
        if all(p.default is not p.empty for k, p in ps.items() if k not in ("r", "dur")):
            kinds[name] = "dur" in ps
    return kinds


_KINDS = _callable_kinds()
SFX_KINDS = tuple(sorted(_KINDS))                      # every kind a writer may use
SFX_NEEDS_DUR = frozenset(k for k, d in _KINDS.items() if d)


def frames(folder):
    src = (Path(folder) / "Video.tsx").read_text(encoding="utf-8")
    m = re.search(r"export const FRAMES\s*=\s*(\d+)", src)
    if not m:
        raise ValueError(f"{folder}/Video.tsx: no 'export const FRAMES = <n>'")
    return int(m.group(1))


def duration(folder):
    return frames(folder) / FPS


def load(folder):
    return json.loads((Path(folder) / "audio.json").read_text(encoding="utf-8"))


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def validate(folder):
    """problems with videos/<id>/audio.json (empty list when valid)"""
    folder = Path(folder)
    try:
        dur = duration(folder)
    except (OSError, ValueError) as e:
        return [str(e)]
    try:
        a = load(folder)
    except (OSError, ValueError) as e:
        return [f"audio.json: {e}"]
    if not isinstance(a, dict):
        return ["audio.json: not an object"]
    probs = []

    if a.get("key") not in KEYS:
        probs.append(f"key {a.get('key')!r} unknown (one of {', '.join(KEYS)})")
    bpm = a.get("bpm")
    if not _num(bpm) or not BPM_RANGE[0] <= bpm <= BPM_RANGE[1]:
        probs.append(f"bpm {bpm!r} not in [{BPM_RANGE[0]}, {BPM_RANGE[1]}]")

    music = a.get("music")
    if not isinstance(music, list) or not music:
        probs.append("music: needs a non-empty list of sections")
        music = []
    secs = []
    for i, s in enumerate(music):
        if not isinstance(s, dict) or not _num(s.get("from")) or not _num(s.get("to")):
            probs.append(f"music[{i}]: needs numeric from / to")
            continue
        if s.get("mood") not in MOODS:
            probs.append(f"music[{i}]: mood {s.get('mood')!r} unknown (one of {', '.join(MOODS)})")
        if s["to"] <= s["from"]:
            probs.append(f"music[{i}]: to {s['to']} must be after from {s['from']}")
        secs.append((s["from"], s["to"]))
    secs.sort()
    edge = 0.0
    for a0, b0 in secs:
        if a0 > edge + EPS:
            probs.append(f"music: gap between {edge:g} and {a0:g}")
        elif a0 < edge - EPS:
            probs.append(f"music: overlap between {a0:g} and {edge:g}")
        edge = max(edge, b0)
    if secs and abs(edge - dur) > EPS:
        probs.append(f"music: sections end at {edge:g}, video lasts {dur:g} (gap or overlap at the end)")

    sfx = a.get("sfx", [])
    if not isinstance(sfx, list):
        probs.append("sfx: must be a list")
        sfx = []
    for i, e in enumerate(sfx):
        if not isinstance(e, dict):
            probs.append(f"sfx[{i}]: not an object")
            continue
        kind, t = e.get("kind"), e.get("t")
        if not _num(t) or not 0 <= t < dur:
            probs.append(f"sfx[{i}]: t {t!r} outside [0, {dur:g})")
        if kind not in _KINDS:
            probs.append(f"sfx[{i}]: kind {kind!r} unknown (see SFX_KINDS)")
        elif kind in SFX_NEEDS_DUR:
            d = e.get("dur")
            if d is None:
                probs.append(f"sfx[{i}]: {kind} needs dur")
            elif not _num(d) or d <= 0:
                probs.append(f"sfx[{i}]: dur {d!r} must be > 0")
        elif "dur" in e:
            probs.append(f"sfx[{i}]: {kind} takes no dur")
        g = e.get("gain_db", 0)
        if not _num(g) or not GAIN_RANGE[0] <= g <= GAIN_RANGE[1]:
            probs.append(f"sfx[{i}]: gain_db {g!r} not in [{GAIN_RANGE[0]:g}, {GAIN_RANGE[1]:g}]")
        p = e.get("pan", 0.0)
        if not _num(p) or not -1 <= p <= 1:
            probs.append(f"sfx[{i}]: pan {p!r} not in [-1, 1]")
        extra = set(e) - {"t", "kind", "dur", "gain_db", "pan"}
        if extra:
            probs.append(f"sfx[{i}]: unknown fields {sorted(extra)}")
    return probs
