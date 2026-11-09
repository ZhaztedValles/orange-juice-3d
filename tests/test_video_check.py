import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf
import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import video_check  # noqa: E402

NARR = "In eighteen fifty soldiers marched across a bridge"
FILES = ("SCRIPT.md", "meta.yml", "Video.tsx", "voice.wav", "words.json", "audio.json", "shots.json")


def good(tmp_path, name="001-bridge-song", frames=1800, template=False):
    v = tmp_path / name
    v.mkdir()
    secs = frames / 30
    (v / "SCRIPT.md").write_text(f"# Facts\n<!-- narration -->\n{NARR}\n<!-- /narration -->\n", encoding="utf-8")
    meta = {"title": "A bridge", "description": "d", "tags": ["history"],
            "sources": ["https://a.example/x", "https://b.example/y"]}
    if template:
        meta["template"] = True
    (v / "meta.yml").write_text(yaml.safe_dump(meta), encoding="utf-8")
    (v / "Video.tsx").write_text(
        'import React from "react";\nimport { clamp01 } from "../../src/engine/math";\n'
        f"export const FRAMES = {frames};\nexport default () => null;\n", encoding="utf-8")
    sf.write(v / "voice.wav", np.zeros(int(24000 * (secs - 1)), np.float32), 24000, subtype="PCM_16")
    (v / "words.json").write_text(json.dumps([{"w": w, "s": 1 + i, "e": 1.5 + i} for i, w in enumerate(NARR.split())]))
    half = frames // 2
    (v / "shots.json").write_text(json.dumps({"shots": [{"id": 1, "a": 0, "b": half}, {"id": 2, "a": half, "b": frames}]}))
    (v / "audio.json").write_text(json.dumps({"music": [{"from": 0, "to": secs, "mood": "playful"}], "key": "C", "bpm": 120, "sfx": []}))
    return v


def probs(v):
    return video_check.problems(v)


def has(v, *needles):
    return any(all(n in p for n in needles) for p in probs(v))


def rejected(v, file, spec):
    """the import of `spec` in `file` is reported with the exact `not allowed` message"""
    return any(p.startswith(f"{file}: import {spec!r} not allowed") for p in probs(v))


def set_meta(v, **kw):
    m = yaml.safe_load((v / "meta.yml").read_text(encoding="utf-8"))
    m.update(kw)
    (v / "meta.yml").write_text(yaml.safe_dump(m), encoding="utf-8")


def set_frames(v, n):
    (v / "Video.tsx").write_text(
        f"export const FRAMES = {n};\nexport default () => null;\n", encoding="utf-8")


def set_words(v, f):
    w = json.loads((v / "words.json").read_text())
    f(w)
    (v / "words.json").write_text(json.dumps(w))


def set_shots(v, shots):
    (v / "shots.json").write_text(json.dumps({"shots": shots}))


# --- baseline -----------------------------------------------------------------------------------

def test_good_folder_passes(tmp_path):
    assert probs(good(tmp_path)) == []


def test_is_template(tmp_path):
    assert video_check.is_template(good(tmp_path)) is False
    assert video_check.is_template(good(tmp_path, "002-other-one", template=True)) is True
    (tmp_path / "003-broken-one").mkdir()
    assert video_check.is_template(tmp_path / "003-broken-one") is False


# --- required files / folder name ---------------------------------------------------------------

@pytest.mark.parametrize("name", FILES)
def test_required_file_missing(tmp_path, name):
    v = good(tmp_path)
    (v / name).unlink()
    assert has(v, name, "missing")


def test_missing_voice_reported_once(tmp_path):
    v = good(tmp_path)
    (v / "voice.wav").unlink()
    (v / "words.json").unlink()
    ps = probs(v)
    assert sum("voice.wav" in p for p in ps) == 1 and sum("words.json" in p for p in ps) == 1


def test_missing_folder(tmp_path):
    assert has(tmp_path / "001-nothing-here", "not found")


@pytest.mark.parametrize("name", ["1-bridge-song", "0001-bridge-song", "001_bridge_song", "001-Bridge", "001-ab",
                                  "001-" + "a" * 51, "001-bridge song", "bridge-song"])
def test_bad_folder_name(tmp_path, name):
    assert has(good(tmp_path, name), "folder name")


@pytest.mark.parametrize("name", ["001-abc", "123-" + "a" * 50, "042-x-y-z"])
def test_good_folder_names(tmp_path, name):
    assert not has(good(tmp_path, name), "folder name")


# --- meta.yml -----------------------------------------------------------------------------------

@pytest.mark.parametrize("title", ["", 5, None, "x" * 101])
def test_meta_title(tmp_path, title):
    v = good(tmp_path)
    set_meta(v, title=title)
    assert has(v, "title")


def test_meta_title_limits_ok(tmp_path):
    v = good(tmp_path)
    set_meta(v, title="x" * 100, description="y" * 4500)
    assert probs(v) == []


@pytest.mark.parametrize("desc", ["", 5, None, "y" * 4501])
def test_meta_description(tmp_path, desc):
    v = good(tmp_path)
    set_meta(v, description=desc)
    assert has(v, "description")


@pytest.mark.parametrize("tags", ["history", [1, 2], ["a", None], None, ["x" * 250, "y" * 251]])
def test_meta_tags(tmp_path, tags):
    v = good(tmp_path)
    set_meta(v, tags=tags)
    assert has(v, "tags")


def test_meta_tags_500_ok(tmp_path):
    v = good(tmp_path)
    set_meta(v, tags=["x" * 250, "y" * 250])
    assert probs(v) == []


@pytest.mark.parametrize("sources", [[], ["https://a.example/x"], "https://a.example/x", None,
                                     ["https://a.example/x", "ftp://b.example/y"], ["https://a.example/x", "b.example"],
                                     ["https://a.example/x", 5], ["https://a.example/x", "https://"]])
def test_meta_sources(tmp_path, sources):
    v = good(tmp_path)
    set_meta(v, sources=sources)
    assert has(v, "sources")


def test_meta_sources_duplicates_count_once(tmp_path):
    v = good(tmp_path)
    set_meta(v, sources=["https://a.example/x", "https://a.example/x"])
    assert has(v, "sources", "distinct")
    set_meta(v, sources=["https://a.example/x", "https://a.example/x/"])
    assert has(v, "sources", "distinct")
    set_meta(v, sources=["https://a.example/x", "https://a.example/y"])
    assert probs(v) == []


def test_meta_sources_http_ok(tmp_path):
    v = good(tmp_path)
    set_meta(v, sources=["http://a.example/x", "https://b.example/y", "https://c.example"])
    assert probs(v) == []


def test_template_needs_no_sources(tmp_path):
    v = good(tmp_path, template=True)
    m = yaml.safe_load((v / "meta.yml").read_text())
    del m["sources"]
    (v / "meta.yml").write_text(yaml.safe_dump(m))
    assert probs(v) == []


@pytest.mark.parametrize("t", ["yes", "true", 1, None])
def test_meta_template_must_be_bool(tmp_path, t):
    v = good(tmp_path)
    set_meta(v, template=t)
    assert has(v, "template")


def test_meta_template_false_still_needs_sources(tmp_path):
    v = good(tmp_path)
    set_meta(v, template=False, sources=[])
    assert has(v, "sources")


def test_meta_not_a_mapping_or_bad_yaml(tmp_path):
    v = good(tmp_path)
    (v / "meta.yml").write_text("- a\n- b\n")
    assert has(v, "meta.yml")
    (v / "meta.yml").write_text("title: [unclosed\n")
    assert has(v, "meta.yml")


# --- FRAMES -------------------------------------------------------------------------------------

@pytest.mark.parametrize("n", [1649, 100, 2101, 5000])
def test_frames_out_of_range(tmp_path, n):
    v = good(tmp_path)
    set_frames(v, n)
    assert has(v, "FRAMES", "1650")


@pytest.mark.parametrize("n", [1650, 2100])
def test_frames_limits_ok(tmp_path, n):
    assert probs(good(tmp_path, frames=n)) == []


def test_template_exempt_from_minimum(tmp_path):
    assert probs(good(tmp_path, frames=1200, template=True)) == []


def test_template_not_exempt_from_maximum(tmp_path):
    v = good(tmp_path, template=True)
    set_frames(v, 2101)
    assert has(v, "FRAMES", "2100")


def test_frames_must_be_declared_once(tmp_path):
    v = good(tmp_path)
    (v / "Video.tsx").write_text("// export const FRAMES = 1800;\nexport const FRAMES = 3000;\n")
    assert has(v, "FRAMES", "once")


def test_frames_must_be_literal(tmp_path):
    v = good(tmp_path)
    (v / "Video.tsx").write_text("export const FRAMES = 30 * 60;\n")
    assert has(v, "FRAMES")


# --- words.json ---------------------------------------------------------------------------------

def test_words_not_a_list(tmp_path):
    v = good(tmp_path)
    (v / "words.json").write_text(json.dumps({"w": "x"}))
    assert has(v, "words.json")


@pytest.mark.parametrize("bad", [{"w": "x", "s": 1}, {"w": "", "s": 1, "e": 2}, {"w": "x", "s": "1", "e": 2},
                                 {"w": "x", "s": True, "e": 2}, "word"])
def test_words_bad_entry(tmp_path, bad):
    v = good(tmp_path)
    set_words(v, lambda w: w.__setitem__(3, bad))
    assert has(v, "words.json")


def test_words_s_before_e(tmp_path):
    v = good(tmp_path)
    set_words(v, lambda w: w[2].update(e=w[2]["s"]))
    assert has(v, "words.json", "s < e")


def test_words_non_decreasing(tmp_path):
    v = good(tmp_path)
    set_words(v, lambda w: w[3].update(s=1.0, e=1.2))
    assert has(v, "words.json", "non-decreasing")


def test_words_equal_starts_are_fine(tmp_path):
    v = good(tmp_path)
    set_words(v, lambda w: w[3].update(s=w[2]["s"], e=w[2]["s"] + 0.1))
    assert not has(v, "non-decreasing")


def test_words_past_video_end(tmp_path):
    v = good(tmp_path)
    set_words(v, lambda w: w[-1].update(e=60.5))
    assert has(v, "words.json", "FRAMES/30")


def test_words_must_match_narration(tmp_path):
    v = good(tmp_path)
    set_words(v, lambda w: w[2].update(w="fifteen"))
    assert has(v, "narration")


def test_words_extra_or_missing_word(tmp_path):
    v = good(tmp_path)
    set_words(v, lambda w: w.append({"w": "extra", "s": 20, "e": 21}))
    assert has(v, "narration")
    set_words(v, lambda w: w.__delitem__(slice(-2, None)))
    assert has(v, "narration")


def test_words_match_ignores_case_and_punctuation(tmp_path):
    v = good(tmp_path)
    (v / "SCRIPT.md").write_text(
        '<!-- narration -->\nIt\'s "eighteen thirty-one," isn\'t it? Wait... go!\n<!-- /narration -->\n', encoding="utf-8")
    ws = ["IT'S", "eighteen", "Thirty-One", "isn't", "it?", "wait", "go"]
    (v / "words.json").write_text(json.dumps([{"w": w, "s": 1 + i, "e": 1.5 + i} for i, w in enumerate(ws)]))
    assert probs(v) == []


def test_words_hyphen_and_apostrophe_are_significant(tmp_path):
    v = good(tmp_path)
    (v / "SCRIPT.md").write_text("<!-- narration -->\nthirty-one isn't\n<!-- /narration -->\n", encoding="utf-8")
    (v / "words.json").write_text(json.dumps([{"w": "thirtyone", "s": 1, "e": 2}, {"w": "isnt", "s": 2, "e": 3}]))
    assert has(v, "narration")


def test_words_structure_still_checked_without_script(tmp_path):
    v = good(tmp_path)
    (v / "SCRIPT.md").unlink()
    set_words(v, lambda w: w[2].update(e=w[2]["s"]))
    ps = probs(v)
    assert any("SCRIPT.md missing" in p for p in ps) and any("s < e" in p for p in ps)
    assert not any("differ from the narration" in p for p in ps)


def test_narration_problem_is_reported(tmp_path):
    v = good(tmp_path)
    (v / "SCRIPT.md").write_text("no markers here\n")
    assert has(v, "SCRIPT.md")
    (v / "SCRIPT.md").write_text("<!-- narration -->\nIn 1850 soldiers\n<!-- /narration -->\n")
    assert has(v, "digit")


# --- voice.wav ----------------------------------------------------------------------------------

def test_voice_sample_rate(tmp_path):
    v = good(tmp_path)
    sf.write(v / "voice.wav", np.zeros(16000 * 50, np.float32), 16000, subtype="PCM_16")
    assert has(v, "voice.wav", "24")


def test_voice_48k_ok(tmp_path):
    v = good(tmp_path)
    sf.write(v / "voice.wav", np.zeros(48000 * 50, np.float32), 48000, subtype="PCM_16")
    assert probs(v) == []


def test_voice_longer_than_video(tmp_path):
    v = good(tmp_path)
    sf.write(v / "voice.wav", np.zeros(24000 * 61, np.float32), 24000, subtype="PCM_16")
    assert has(v, "voice.wav", "longer")


def test_voice_exactly_video_length_ok(tmp_path):
    v = good(tmp_path)
    sf.write(v / "voice.wav", np.zeros(24000 * 60, np.float32), 24000, subtype="PCM_16")
    assert probs(v) == []


def test_voice_not_a_wav(tmp_path):
    v = good(tmp_path)
    (v / "voice.wav").write_bytes(b"not audio at all")
    assert has(v, "voice.wav")


# --- shots.json ---------------------------------------------------------------------------------

def test_shots_gap(tmp_path):
    v = good(tmp_path)
    set_shots(v, [{"id": 1, "a": 0, "b": 900}, {"id": 2, "a": 910, "b": 1800}])
    assert has(v, "shots", "contiguous")


def test_shots_overlap(tmp_path):
    v = good(tmp_path)
    set_shots(v, [{"id": 1, "a": 0, "b": 900}, {"id": 2, "a": 890, "b": 1800}])
    assert has(v, "shots", "contiguous")


def test_shots_must_start_at_zero(tmp_path):
    v = good(tmp_path)
    set_shots(v, [{"id": 1, "a": 5, "b": 900}, {"id": 2, "a": 900, "b": 1800}])
    assert has(v, "shots", "start at 0")


def test_shots_must_end_at_frames(tmp_path):
    v = good(tmp_path)
    set_shots(v, [{"id": 1, "a": 0, "b": 900}, {"id": 2, "a": 900, "b": 1790}])
    assert has(v, "shots", "FRAMES")


def test_shot_shorter_than_30_frames(tmp_path):
    v = good(tmp_path)
    set_shots(v, [{"id": 1, "a": 0, "b": 900}, {"id": 2, "a": 900, "b": 1780}, {"id": 3, "a": 1780, "b": 1800}])
    assert has(v, "shot 3", "30 frames")


def test_shot_of_30_frames_ok(tmp_path):
    v = good(tmp_path)
    set_shots(v, [{"id": 1, "a": 0, "b": 900}, {"id": 2, "a": 900, "b": 1770}, {"id": 3, "a": 1770, "b": 1800}])
    assert probs(v) == []


def test_shots_duplicate_id(tmp_path):
    v = good(tmp_path)
    set_shots(v, [{"id": 1, "a": 0, "b": 900}, {"id": 1, "a": 900, "b": 1800}])
    assert has(v, "shots", "duplicate")


def test_shots_unsorted_input_is_sorted(tmp_path):
    v = good(tmp_path)
    set_shots(v, [{"id": 2, "a": 900, "b": 1800}, {"id": 1, "a": 0, "b": 900}])
    assert probs(v) == []


@pytest.mark.parametrize("shots", [[], "x", [{"id": 1, "a": 0}], [{"id": "1", "a": 0, "b": 1800}],
                                   [{"id": 1, "a": 0.5, "b": 1800}], [{"id": 1, "a": True, "b": 1800}], [5]])
def test_shots_malformed(tmp_path, shots):
    v = good(tmp_path)
    set_shots(v, shots)
    assert has(v, "shots")


def test_shots_file_shape(tmp_path):
    v = good(tmp_path)
    (v / "shots.json").write_text(json.dumps([{"id": 1, "a": 0, "b": 1800}]))
    assert has(v, "shots.json")
    (v / "shots.json").write_text("{nope")
    assert has(v, "shots.json")


def test_shots_optional_lists_checked(tmp_path):
    v = good(tmp_path)
    s = {"shots": [{"id": 1, "a": 0, "b": 1800}], "xfade": [[10, 16]], "planned": [[100, 100]], "flash": [30, 34]}
    (v / "shots.json").write_text(json.dumps(s))
    assert probs(v) == []
    s["xfade"] = [[10, 16, 3]]
    (v / "shots.json").write_text(json.dumps(s))
    assert has(v, "xfade")
    s["xfade"], s["planned"] = [], "x"
    (v / "shots.json").write_text(json.dumps(s))
    assert has(v, "planned")


# --- audio.json ---------------------------------------------------------------------------------

def test_audio_json_validated_by_spec(tmp_path):
    v = good(tmp_path)
    a = json.loads((v / "audio.json").read_text())
    a["key"] = "H"
    (v / "audio.json").write_text(json.dumps(a))
    assert has(v, "key")


def test_audio_json_sections_must_cover_video(tmp_path):
    v = good(tmp_path)
    a = json.loads((v / "audio.json").read_text())
    a["music"][0]["to"] = 50
    (v / "audio.json").write_text(json.dumps(a))
    assert has(v, "music")


# --- import sandbox -----------------------------------------------------------------------------

def add_ts(v, text, name="extra.ts"):
    (v / name).write_text(text, encoding="utf-8")


def test_forbidden_import(tmp_path):
    v = good(tmp_path)
    add_ts(v, 'import { x } from "../../tools/thing";\n')
    assert rejected(v, "extra.ts", "../../tools/thing")


@pytest.mark.parametrize("spec", ["lodash", "three/addons/loaders/GLTFLoader.js", "three/src/core/Object3D", "threejs",
                                  "@remotion/media-utils", "react/jsx-runtime", "../other/Video", "../../src/Root",
                                  "../../src/engine/nope", "../../src/engine/math/../../../tools/x",
                                  "../../src/engine/captions.test", "../../src/engine/", "./sub/file", "./missing",
                                  "../../../x", "/etc/passwd", "https://evil.example/x.js", "node:path", "path",
                                  "three/examples/jsm/../../src/x", "three/examples/jsm/", "./../words",
                                  "../../../etc/a'b", "three/examples/jsm/x!=!/etc/passwd", "three/examples/jsm/x.js?raw",
                                  "three/examples/jsm/x#frag", "three/examples/jsm/a b"])
def test_import_rejected(tmp_path, spec):
    v = good(tmp_path)
    add_ts(v, f'import x from "{spec}";\n')
    assert rejected(v, "extra.ts", spec), probs(v)


def test_single_quoted_specifier_containing_a_double_quote_is_checked(tmp_path):
    v = good(tmp_path)
    add_ts(v, "import x from '../../../etc/a\"b';\n")
    assert rejected(v, "extra.ts", '../../../etc/a"b'), probs(v)


@pytest.mark.parametrize("code", ['import x from "abc\nconst y = 1;\n', "import x from `lodash`;\n", "import x from 'abc\n",
                                  'export * from\n"abc', 'import "abc\n', 'import x from "a\\"b";\n'])
def test_unparseable_specifier_fails_closed(tmp_path, code):
    v = good(tmp_path)
    add_ts(v, code)
    assert has(v, "extra.ts", "import", "cannot be parsed") or any(
        p.startswith("extra.ts: import") and "not allowed" in p for p in probs(v)), probs(v)


@pytest.mark.parametrize("spec", ["react", "three", "remotion", "@remotion/three", "@react-three/fiber",
                                  "@react-three/postprocessing", "postprocessing", "three/examples/jsm/loaders/GLTFLoader.js",
                                  "three/examples/jsm/utils/BufferGeometryUtils", "../../src/engine/math",
                                  "../../src/engine/captions", "../../src/engine/build", "./Video", "./words.json", "./helper",
                                  "./helper.ts"])
def test_import_allowed(tmp_path, spec):
    v = good(tmp_path)
    add_ts(v, "export const k = 1;\n", "helper.ts")
    add_ts(v, f'import x from "{spec}";\nexport default x;\n', "user.tsx")
    assert not has(v, "not allowed", "cannot be parsed"), probs(v)
    assert probs(v) == [], probs(v)


def test_import_forms_are_all_checked(tmp_path):
    v = good(tmp_path)
    cases = {
        "a.ts": 'import "evil-side-effect";\n',
        "b.ts": 'import {\n  a,\n  b,\n} from "evil-multiline";\n',
        "c.ts": 'export * from "evil-reexport";\n',
        "d.ts": "export { y } from 'evil-single';\n",
        "e.ts": 'import type { T } from "evil-type";\n',
        "f.ts": 'import * as NS from "evil-ns";\n',
        "g.ts": 'import   z   from"evil-nospace";\n',
    }
    for n, t in cases.items():
        add_ts(v, t, n)
    ps = probs(v)
    for n, spec in (("a.ts", "evil-side-effect"), ("b.ts", "evil-multiline"), ("c.ts", "evil-reexport"), ("d.ts", "evil-single"),
                    ("e.ts", "evil-type"), ("f.ts", "evil-ns"), ("g.ts", "evil-nospace")):
        assert rejected(v, n, spec), spec


def test_import_problem_names_the_file(tmp_path):
    v = good(tmp_path)
    add_ts(v, 'import x from "lodash";\n', "evil.ts")
    assert rejected(v, "evil.ts", "lodash")


def test_engine_module_names_come_from_the_engine_dir():
    names = video_check.engine_modules()
    assert {"math", "captions", "build", "ink", "toon"} <= names
    assert "captions.test" not in names


# --- forbidden tokens ---------------------------------------------------------------------------

@pytest.mark.parametrize("token,code", [
    ("fetch", 'const r = fetch("https://x");'),
    ("fetch", "const r = window.fetch ('https://x');"),
    ("XMLHttpRequest", "const r = new XMLHttpRequest();"),
    ("eval", 'eval("1+1");'),
    ("eval", 'const e = eval ("1");'),
    ("Function", 'const f = new Function("return 1");'),
    ("Function", "const f = new  Function('a');"),
    ("require", 'const x = require("y");'),
    ("process.", "const e = process.env.X;"),
    ("import(", 'const m = import("./y");'),
    ("import(", 'const m = import ("./y");'),
    ("import(", 'const m = import /*c*/ ("./y");'),
    ("import(", 'const m = import // c\n("./y");'),
    ("fetch", 'const r = fetch?.("x");'),
    ("fetch", "const f = window.fetch;"),
    ("fetch", 'const f = self["fetch"];'),
    ("require", 'const r = require; r("x");'),
    ("Function", 'const x = Function("return 1")();'),
    ("Function", "const F: Function = null as any;"),
    ("globalThis", 'globalThis["fe"+"tch"]("x");'),
    ("WebSocket", 'const w = new WebSocket("wss://x");'),
    ("EventSource", 'const e = new EventSource("https://x");'),
    ("sendBeacon", 'navigator.sendBeacon("https://x", "d");'),
    ("importScripts", 'importScripts("https://x/y.js");'),
    ("eval", "const e = (0, eval);"),
    ("child_process", 'const c = "child_process";'),
    ("fs", 'import fs from "fs";'),
    ("fs", 'import fs from "node:fs";'),
    ("fs", 'import { readFile } from "fs/promises";'),
    ("fs", "import fs from 'node:fs/promises';"),
])
def test_forbidden_token(tmp_path, token, code):
    v = good(tmp_path)
    add_ts(v, code + "\n")
    assert has(v, "forbidden", token), probs(v)


def test_forbidden_token_in_comment_and_string_still_counts(tmp_path):
    v = good(tmp_path)
    add_ts(v, '// we never call eval(x) here\nexport const s = "XMLHttpRequest";\n')
    ps = probs(v)
    assert any("`eval`" in p for p in ps) and any("XMLHttpRequest" in p for p in ps)


def test_forbidden_token_in_tsx_and_message_names_file(tmp_path):
    v = good(tmp_path)
    add_ts(v, "export default () => { fetch('x'); return null; };\n", "Page.tsx")
    assert has(v, "Page.tsx", "`fetch`")


def test_forbidden_token_checked_in_main_video_file(tmp_path):
    v = good(tmp_path)
    with open(v / "Video.tsx", "a", encoding="utf-8") as f:
        f.write("const e = process.env;\n")
    assert has(v, "Video.tsx", "process.")


@pytest.mark.parametrize("code", [
    "const offset = 3; const fsize = 2; const prefetch = 1; const refetch = () => 0;",
    "const x = { fs: 1 }; const buffs = [1]; const myfs = 2;",
    "const proc = processFrame(); const subprocess = 1; const preprocess = (a: number) => a;",
    "const important = 1; const reimport = 2; const importance = 3;",
    "const prefetch2 = 1; const livefetch = 2; const evaluate = (n: number) => n; const retrieval = 1;",
    "const a = 'xfs'; const b = \"fsck\";",
    "const functional = 1; const Functions = 2; const MyFunction = 3; const FunctionKind = 4; const reFunction = 5;",
    "const globalThisValue = 1; const fetched = 2; const fetcher = 3; const requirement = 4; const required = 5;",
    "const evaluated = 1; const webSocketLike = 2; const MyEventSourceX = 3;",
])
def test_similar_words_do_not_trip_the_token_scan(tmp_path, code):
    v = good(tmp_path)
    add_ts(v, code + "\nexport {};\n")
    assert probs(v) == [], probs(v)


def test_token_scan_ignores_non_code_files(tmp_path):
    v = good(tmp_path)
    (v / "notes.md").write_text("we use fetch( and eval( in prose\n")
    assert probs(v) == []


# --- file sizes / extensions / subfolders -------------------------------------------------------

def test_voice_over_12mb(tmp_path):
    v = good(tmp_path)
    sf.write(v / "voice.wav", np.zeros((48000 * 59, 2), np.float32), 48000, subtype="PCM_24")
    assert has(v, "voice.wav", "12 MB")


def test_other_file_over_400kb(tmp_path):
    v = good(tmp_path)
    (v / "big.json").write_bytes(b" " * (400 * 1024 + 1))
    assert has(v, "big.json", "400 KB")
    (v / "big.json").write_bytes(b" " * (400 * 1024))
    assert not has(v, "400 KB")


def test_folder_over_15mb(tmp_path):
    v = good(tmp_path)
    sf.write(v / "voice.wav", np.zeros((48000 * 59, 2), np.float32), 48000, subtype="PCM_16")  # ~11.3 MB, under its own cap
    for i in range(13):
        (v / f"pad{i}.json").write_bytes(b" " * 399_000)
    ps = probs(v)
    assert any("15 MB" in p for p in ps)
    assert not any("12 MB" in p or "400 KB" in p for p in ps)


@pytest.mark.parametrize("name", ["cover.png", "clip.mp4", "notes.txt", "README", "run.py", "x.js", "style.css", "a.TSX.bak"])
def test_extension_not_allowed(tmp_path, name):
    v = good(tmp_path)
    (v / name).write_bytes(b"x")
    assert has(v, name, "extension")


@pytest.mark.parametrize("name", ["extra.ts", "extra.tsx", "extra.json", "NOTES.md", "extra.yml", "extra.wav", "UP.TS"])
def test_extension_allowed(tmp_path, name):
    v = good(tmp_path)
    (v / name).write_text("// ok\n" if name.lower().endswith(("ts", "tsx")) else "{}\n")
    assert not has(v, "extension"), probs(v)


def test_subdirectory_not_allowed(tmp_path):
    v = good(tmp_path)
    (v / "assets").mkdir()
    (v / "assets" / "a.ts").write_text("export {};\n")
    assert has(v, "assets", "subdirector")


# --- CLI ----------------------------------------------------------------------------------------

def run_cli(*args):
    return subprocess.run([sys.executable, str(ROOT / "tools" / "video_check.py"), *map(str, args)],
                          capture_output=True, text=True, cwd=ROOT)


def test_cli_ok(tmp_path):
    v = good(tmp_path)
    r = run_cli(v)
    assert r.returncode == 0 and r.stdout.strip() == "ok 001-bridge-song"


def test_cli_reports_problems_and_exits_1(tmp_path):
    bad = good(tmp_path)
    (bad / "shots.json").unlink()
    ok = good(tmp_path, "002-other-one")
    r = run_cli(bad, ok)
    assert r.returncode == 1
    assert "shots.json" in r.stdout and "ok 002-other-one" in r.stdout and "ok 001-bridge-song" not in r.stdout


def test_cli_needs_arguments():
    r = run_cli()
    assert r.returncode == 2 and "usage" in (r.stdout + r.stderr).lower()


def test_cli_checks_the_bridge_template():
    r = run_cli("videos/000-bridge")
    assert r.returncode == 0 and r.stdout.strip() == "ok 000-bridge", r.stdout


def test_symlink_not_allowed(tmp_path):
    v = good(tmp_path)
    try:
        (v / "link.json").symlink_to(v / "meta.yml")
    except (OSError, NotImplementedError):
        pytest.skip("symlinks unavailable")
    assert has(v, "link.json", "symbolic")
