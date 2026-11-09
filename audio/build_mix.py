"""Final soundtrack of one video: voice + generated score + SFX events, mixed to -14 LUFS / <= -1 dBTP.

    python audio/build_mix.py videos/<id> out/<id>

writes mix.wav (48 kHz stereo 24-bit, exactly round(FRAMES / 30 * 48000) samples), stem_voice.wav, stem_music.wav,
stem_sfx.wav (32-bit float, each with the master gain, before the limiter) and mix_report.json {lufs, true_peak_db, samples}.
"""
import inspect
import json
import re
import sys
from math import gcd
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import ndimage, signal

if __package__ in (None, ""):                            # run as a script: make `audio` importable
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    __package__ = "audio"

from . import score, sfx_gen, spec  # noqa: E402
from .dsp import SR, ns, dbg, rng, pan, place, st, integrated, true_peak, write_wav  # noqa: E402

TARGET_LUFS = -14.0
CEIL_DBTP = -1.2
# Levels below the voice's integrated loudness, before the master gain: the bridge's balance
# (its stems at a -15 LUFS master: voice -15.4, music -25.8, sfx -29.1 LUFS integrated).
MUSIC_BELOW_VOICE_DB = 10.4                              # -15.4 - (-25.8)
SFX_BELOW_VOICE_DB = 13.7                                # -15.4 - (-29.1), the sum of all events
DUCK_DB = -3.0


def duck_db(spans, n, depth=DUCK_DB, pre=0.08, post=0.12, att=0.07, rel=0.45):
    """per-sample gain in dB: depth while words are spoken (spans in s), smoothed attack / release"""
    ctrl = 1000
    nc = int(n / SR * ctrl) + 2
    va = np.zeros(nc)
    for s, e in spans:
        va[max(0, int((s - pre) * ctrl)): max(0, int((e + post) * ctrl))] = 1.0
    ka, kr = 1 - np.exp(-1 / (att * ctrl)), 1 - np.exp(-1 / (rel * ctrl))
    env = np.zeros(nc)
    e = 0.0
    for i in range(nc):
        tgt = va[i]
        e += (tgt - e) * (ka if tgt > e else kr)
        env[i] = e
    return np.interp(np.arange(n) / SR, np.arange(nc) / ctrl, depth * env)


def limiter(x, ceil_db=CEIL_DBTP, look=0.003, rel=0.08):
    """4x-oversampled peak detection, look-ahead min filter, release one-pole, centred smoothing -> gain curve"""
    c = dbg(ceil_db)
    n = x.shape[1]
    up = np.abs(signal.resample_poly(x, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    La = max(1, ns(look))
    g1 = ndimage.minimum_filter1d(gr, 2 * La + 1, mode="nearest")
    g2 = g1.copy()
    idx = np.flatnonzero(g1 < 1.0)
    if len(idx):
        # one-pole release, run only over clusters of reduced samples (elsewhere the gain is 1)
        kr = 1 - np.exp(-1 / (rel * SR))
        gap = ns(rel * 8)
        brk = np.flatnonzero(np.diff(idx) > gap)
        starts = np.concatenate([[idx[0]], idx[brk + 1]])
        ends = np.concatenate([idx[brk], [idx[-1]]])
        for a, b_ in zip(starts, ends):
            e = min(n, b_ + gap)
            seg = g1[a:e]
            out = np.empty(len(seg))
            g = 1.0
            for k in range(len(seg)):
                g = min(seg[k], g + (1 - g) * kr)
                out[k] = g
            g2[a:e] = out
    g3 = ndimage.uniform_filter1d(g2, 2 * La + 1, mode="nearest")
    g3 = np.minimum(g3, 1.0)
    return x * g3[None, :], g3


def load_voice(path, n):
    """voice.wav -> (2, n) at 48 kHz: mono, resampled, padded with silence or trimmed"""
    x, sr = sf.read(str(path), always_2d=True, dtype="float64")
    x = x.mean(axis=1)
    if sr != SR:
        g = gcd(SR, sr)
        x = signal.resample_poly(x, SR // g, sr // g)
    x = np.pad(x, (0, max(0, n - len(x))))[:n]
    return st(x)


def video_seed(folder):
    m = re.match(r"(\d+)", Path(folder).name)
    return int(m.group(1)) if m else 0


def sfx_event(i, e):
    """one event -> (start time, stereo audio)"""
    fn = getattr(sfx_gen, e["kind"])
    kw = {"r": rng(i)}
    if "dur" in inspect.signature(fn).parameters:
        kw["dur"] = float(e["dur"])
    y = fn(**kw)
    t = float(e["t"])
    if isinstance(y, tuple):                             # (audio, pre-roll): the hit lands `pre` s into the audio
        y, pre = y
        t -= pre
    p = float(e.get("pan", 0.0))
    if np.ndim(y) == 1:
        y = pan(y, p)
    else:                                                # stereo source: same constant-power law as a balance
        th = (np.clip(p, -1, 1) + 1) * np.pi / 4
        y = y * (np.sqrt(2) * np.array([np.cos(th), np.sin(th)]))[:, None]
    return t, y * dbg(float(e.get("gain_db", 0.0)))


def _gain_to(x, target):
    lv = integrated(x)
    return x * dbg(target - lv) if np.isfinite(lv) else x


def build(folder, outdir):
    folder, outdir = Path(folder), Path(outdir)
    n = int(round(spec.frames(folder) / spec.FPS * SR))
    a = spec.load(folder)
    words = json.loads((folder / "words.json").read_text(encoding="utf-8"))

    voice = load_voice(folder / "voice.wav", n)
    lv = integrated(voice)
    if not np.isfinite(lv):
        raise ValueError(f"{folder}/voice.wav is silent")

    music = score.render(a["music"], a["key"], a["bpm"], n / SR, video_seed(folder)).T
    music = _gain_to(music, lv - MUSIC_BELOW_VOICE_DB)
    music = music * dbg(duck_db([(w["s"], w["e"]) for w in words], n))[None, :]

    sfx = np.zeros((2, n))
    for i, e in enumerate(a.get("sfx", [])):
        t, y = sfx_event(i, e)
        place(sfx, y, t)
    sfx = _gain_to(sfx, lv - SFX_BELOW_VOICE_DB)

    pre = voice + music + sfx
    g = dbg(TARGET_LUFS - integrated(pre))
    for k in range(4):                                   # the limiter costs a little loudness: make it up
        mix, _gr = limiter(pre * g)
        lufs = integrated(mix)
        if abs(lufs - TARGET_LUFS) < 0.05 or k == 3:
            break
        g *= dbg(TARGET_LUFS - lufs)

    outdir.mkdir(parents=True, exist_ok=True)
    write_wav(str(outdir / "mix.wav"), mix)
    for name, x in (("voice", voice), ("music", music), ("sfx", sfx)):   # float: before the limiter they may pass 0 dBFS
        sf.write(str(outdir / f"stem_{name}.wav"), (x * g).T.astype(np.float32), SR, subtype="FLOAT")
    rep = {"lufs": round(float(lufs), 2), "true_peak_db": round(float(true_peak(mix)), 2), "samples": int(mix.shape[1])}
    (outdir / "mix_report.json").write_text(json.dumps(rep, indent=2) + "\n", encoding="utf-8")
    return rep


def main(argv):
    if len(argv) != 2:
        print("usage: python audio/build_mix.py videos/<id> out/<id>", file=sys.stderr)
        return 2
    probs = spec.validate(argv[0])
    if probs:
        print(f"{argv[0]}/audio.json has problems:", file=sys.stderr)
        for p in probs:
            print(f"  - {p}", file=sys.stderr)
        return 1
    print(json.dumps(build(argv[0], argv[1])))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
