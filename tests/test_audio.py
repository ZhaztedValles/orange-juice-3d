import json
import shutil
from pathlib import Path

import numpy as np
import soundfile as sf

from audio import build_mix, dsp, spec

ROOT = Path(__file__).resolve().parents[1]


def make_video(tmp_path, frames=600, audio=None):
    v = tmp_path / "001-test"
    v.mkdir()
    (v / "Video.tsx").write_text(f"export const FRAMES = {frames};\nexport default () => null;\n")
    sr, dur = 24000, frames / 30
    t = np.arange(int(sr * dur)) / sr
    speech = 0.2 * np.sin(2 * np.pi * 180 * t) * ((t % 1.0) < 0.6)  # a 0.6 s "word" every second
    sf.write(v / "voice.wav", speech.astype(np.float32), sr, subtype="PCM_16")
    words = [{"w": f"w{i}", "s": float(i), "e": i + 0.6} for i in range(int(dur))]
    (v / "words.json").write_text(json.dumps(words))
    (v / "audio.json").write_text(json.dumps(audio or {
        "music": [{"from": 0, "to": 10, "mood": "playful"}, {"from": 10, "to": 20, "mood": "tension"}],
        "key": "C", "bpm": 120,
        "sfx": [{"t": 2.0, "kind": "whoosh", "dur": 0.6, "gain_db": 0}, {"t": 5.0, "kind": "bolt_snap"}]}))
    return v


def test_valid_spec_has_no_problems(tmp_path):
    assert spec.validate(make_video(tmp_path)) == []


def test_spec_problems(tmp_path):
    bad = {"music": [{"from": 0, "to": 9, "mood": "playful"}, {"from": 10, "to": 20, "mood": "jazzy"}],
           "key": "C", "bpm": 120,
           "sfx": [{"t": 25, "kind": "bolt_snap"}, {"t": 1, "kind": "os_system"}, {"t": 1, "kind": "whoosh"}]}
    probs = " | ".join(spec.validate(make_video(tmp_path, audio=bad)))
    for needle in ("gap", "jazzy", "25", "os_system", "dur"):
        assert needle in probs


def test_mix_is_exact_length_and_loudness(tmp_path):
    v = make_video(tmp_path)
    out = tmp_path / "out"
    rep = build_mix.build(v, out)
    x, sr = sf.read(out / "mix.wav", always_2d=True)
    assert sr == 48000 and x.shape == (int(round(600 / 30 * 48000)), 2)
    assert abs(rep["lufs"] - (-14.0)) <= 0.5
    assert rep["true_peak_db"] <= -1.0
    assert abs(dsp.integrated(x.T) - rep["lufs"]) < 0.2  # dsp takes (channels, samples)


def test_every_mood_renders(tmp_path):
    from audio import score
    for mood in score.MOODS:
        y = score.render([{"from": 0, "to": 4, "mood": mood}], key="D", bpm=100, dur=4.0, seed=1)
        assert y.shape == (4 * 48000, 2)
        if mood != "none":
            assert np.abs(y).max() > 1e-3
