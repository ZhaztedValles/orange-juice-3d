import json

import numpy as np
import pytest
import soundfile as sf

from audio import build_mix, dsp, spec


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


def test_tame_voice_peaks_only_touches_the_spikes():
    sr = dsp.SR
    t = np.arange(3 * sr) / sr
    v = 0.1 * np.sin(2 * np.pi * 180 * t) * ((t % 0.5) < 0.35)
    spikes = (0.7, 1.52, 2.31)
    for s in spikes:  # Kokoro-like onset spike: one 10-sample half-cycle
        k = int(s * sr)
        v[k:k + 10] += 0.8 * np.sin(np.pi * np.arange(10) / 10)
    x = dsp.st(v)
    y, g = build_mix.tame_voice_peaks(x, -12.0)
    assert dsp.true_peak(y) <= -12.0 + 0.1
    outside = np.ones(len(v), bool)
    for s in spikes:
        outside[int((s - 0.02) * sr): int((s + 0.02) * sr)] = False
    res = ((y - x)[:, outside] ** 2).sum() / (x[:, outside] ** 2).sum()
    assert 10 * np.log10(res + 1e-30) < -60


def probs_for(tmp_path, audio, frames=600):
    return " | ".join(spec.validate(make_video(tmp_path, frames=frames, audio=audio)))


def test_section_end_matches_within_half_a_frame(tmp_path):
    def a(to):
        return {"music": [{"from": 0, "to": to, "mood": "warm"}], "key": "C", "bpm": 100, "sfx": []}
    (tmp_path / "ok").mkdir()
    (tmp_path / "bad").mkdir()
    assert probs_for(tmp_path / "ok", a(66.667), frames=2000) == ""          # DUR = 66.666...
    assert "end" in probs_for(tmp_path / "bad", a(66.7), frames=2000)


@pytest.mark.parametrize("event, needle", [
    ({"t": 1, "kind": "whoosh", "dur": float("nan")}, "dur"),
    ({"t": float("inf"), "kind": "bolt_snap"}, "t inf"),
    ({"t": 1, "kind": "whoosh", "dur": 1e9}, "past the end"),
    ({"t": 1, "kind": "bolt_snap", "gain_db": float("nan")}, "gain_db"),
    ({"t": 1, "kind": ["bolt_snap"]}, "kind"),
    ({"t": 1, "kind": 7}, "kind"),
])
def test_bad_sfx_numbers_and_kinds(tmp_path, event, needle):
    audio = {"music": [{"from": 0, "to": 20, "mood": "warm"}], "key": "C", "bpm": 100, "sfx": [event]}
    assert needle in probs_for(tmp_path, audio)


def test_non_finite_section_and_bpm(tmp_path):
    audio = {"music": [{"from": 0, "to": float("inf"), "mood": "warm"}], "key": "C", "bpm": float("nan"), "sfx": []}
    p = probs_for(tmp_path, audio)
    assert "music[0]" in p and "bpm" in p


@pytest.mark.parametrize("decl", ["export const FRAMES = 20 * 30;", "export const FRAMES = 2025.5;"])
def test_frames_must_be_an_integer_literal(tmp_path, decl):
    v = make_video(tmp_path)
    (v / "Video.tsx").write_text(decl + "\nexport default () => null;\n")
    assert "FRAMES" in " | ".join(spec.validate(v))


def test_missing_voice_files_are_problems(tmp_path):
    v = make_video(tmp_path)
    (v / "voice.wav").unlink()
    (v / "words.json").unlink()
    p = " | ".join(spec.validate(v))
    assert "voice.wav" in p and "words.json" in p
    with pytest.raises(ValueError):
        build_mix.build(v, tmp_path / "out")


def test_mix_law_and_determinism(tmp_path):
    v = make_video(tmp_path)
    build_mix.build(v, tmp_path / "a")
    build_mix.build(v, tmp_path / "b")
    stem = {k: dsp.integrated(sf.read(tmp_path / "a" / f"stem_{k}.wav", always_2d=True)[0].T)
            for k in ("voice", "music", "sfx")}
    assert abs(stem["music"] - (stem["voice"] - 10.4)) <= 0.7
    assert abs(stem["sfx"] - (stem["voice"] - 13.7)) <= 1.0
    assert (tmp_path / "a" / "mix.wav").read_bytes() == (tmp_path / "b" / "mix.wav").read_bytes()


def test_sfx_past_the_end_is_cut_off(tmp_path):
    audio = {"music": [{"from": 0, "to": 20, "mood": "march"}], "key": "F", "bpm": 120,
             "sfx": [{"t": 19.9, "kind": "splash_big"}, {"t": 19.5, "kind": "whoosh", "dur": 0.5}]}
    v = make_video(tmp_path, audio=audio)
    assert spec.validate(v) == []
    rep = build_mix.build(v, tmp_path / "out")
    assert rep["samples"] == 960000
    assert sf.info(str(tmp_path / "out" / "mix.wav")).frames == 960000
