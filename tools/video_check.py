"""Gate for a video folder: is videos/<NNN>-<slug>/ well-formed and safe to merge and render?

Usage: python tools/video_check.py videos/<id> [videos/<id> ...]
Prints `ok <id>` per clean folder, or `<id>: <problem>` lines, and exits 1 if any folder has a problem.
The rules are documented in docs/video-format.md ("Folder contract").
"""
import json
import math
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import soundfile as sf  # noqa: E402
import yaml  # noqa: E402

from audio import spec  # noqa: E402
from script_md import narration  # noqa: E402

FPS = 30
REQUIRED = ("SCRIPT.md", "meta.yml", "Video.tsx", "voice.wav", "words.json", "audio.json", "shots.json")
NAME_RE = re.compile(r"\d{3}-[a-z0-9-]{3,50}")
MIN_FRAMES, MAX_FRAMES = 55 * FPS, 70 * FPS
MIN_SHOT = 30
SAMPLE_RATES = (24000, 48000)
EXTENSIONS = (".ts", ".tsx", ".json", ".md", ".yml", ".wav")
CODE = (".ts", ".tsx")
VOICE_MAX = 12 * 1024 * 1024
FILE_MAX = 400 * 1024
FOLDER_MAX = 15 * 1024 * 1024

# Import allow-list (exact specifiers; `three/examples/jsm/<path>`, `../../src/engine/<module>` and `./<file>` are patterns).
PACKAGES = frozenset(("react", "three", "remotion", "@remotion/three", "@react-three/fiber",
                      "@react-three/postprocessing", "postprocessing"))
JSM = "three/examples/jsm/"
ENGINE_RE = re.compile(r"\.\./\.\./src/engine/([A-Za-z0-9_-]+)")
SIBLING_RE = re.compile(r"\./([A-Za-z0-9_][A-Za-z0-9_.-]*)")
JSM_RE = re.compile(r"[A-Za-z0-9_./-]+")
FRAMES_DECL_RE = re.compile(r"\b(?:const|let|var)\s+FRAMES\b")      # any declaration, type annotation or not, comments included
KEYWORD_COMMENT_RE = re.compile(r"\b(?:from|import|export)\s*/[*/]")  # a comment right after the keyword could hide the specifier
SPEC_START_RE = re.compile(r"""\b(?:from|import)\s*(?=["'`])""")   # `from "x"` (import / export ... from) and `import "x"`
SPEC_RE = re.compile(r"""(?:"([^"\n]*)"|'([^'\n]*)')""")            # one single-line string, either quote

# Forbidden anywhere in .ts/.tsx (comments and string literals included: conservative on purpose).
FORBIDDEN = (
    ("fetch", re.compile(r"\bfetch\b")),
    ("XMLHttpRequest", re.compile(r"XMLHttpRequest")),
    ("eval", re.compile(r"\beval\b")),
    ("Function", re.compile(r"\bFunction\b")),                      # also `new Function`
    ("require", re.compile(r"\brequire\b")),
    ("process.", re.compile(r"\bprocess\s*(?:\?\.|\.|\[)|=\s*process\b")),   # process.x, process?.x, process["x"], p = process
    ("import(", re.compile(r"\bimport\s*(?:\(|/[*/])")),             # import(...), also import /*c*/ (...)
    ("child_process", re.compile(r"child_process")),
    ("globalThis", re.compile(r"\bglobalThis\b")),
    ("WebSocket", re.compile(r"\bWebSocket\b")),
    ("EventSource", re.compile(r"\bEventSource\b")),
    ("sendBeacon", re.compile(r"sendBeacon")),
    ("importScripts", re.compile(r"importScripts")),
    ("fs", re.compile(r"""["'](?:node:)?fs(?:/[^"'\n]*)?["']""")),    # the module, never a substring like "offset"
)


def engine_modules():
    """names of the modules in src/engine that a video may import (no extension, no tests)"""
    d = ROOT / "src" / "engine"
    return frozenset(p.stem for p in d.iterdir() if p.suffix in CODE and not p.stem.endswith(".test"))


def _read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except (OSError, ValueError) as e:
        return None, f"{path.name}: {e}"


def _load_meta(folder):
    """(meta dict or None, problem or None)"""
    try:
        meta = yaml.safe_load((folder / "meta.yml").read_text(encoding="utf-8"))
    except (OSError, ValueError, yaml.YAMLError) as e:
        return None, f"meta.yml: cannot read ({str(e).splitlines()[0] if str(e) else type(e).__name__})"
    if not isinstance(meta, dict):
        return None, "meta.yml: must be a mapping (title, description, tags, sources)"
    return meta, None


def is_template(folder):
    """True when meta.yml says `template: true` (never queued or posted; exempt from the 55 s minimum and from sources)"""
    meta, err = _load_meta(Path(folder))
    return err is None and meta.get("template") is True


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def _int(x):
    return isinstance(x, int) and not isinstance(x, bool)


def _url_ok(u):
    if not isinstance(u, str) or re.search(r"\s", u):
        return False
    p = urlparse(u)
    return p.scheme in ("http", "https") and bool(p.netloc)


def _url_key(u):
    """same source = same host (case-insensitive), path (minus a trailing slash) and query; http and https count as one"""
    p = urlparse(u.strip())
    return (p.netloc.lower(), p.path.rstrip("/"), p.query)


def _check_meta(meta, tpl):
    out = []
    t = meta.get("title")
    if not isinstance(t, str) or not t.strip() or len(t) > 100:
        out.append("meta.yml: title must be a string of 1-100 characters")
    d = meta.get("description")
    if not isinstance(d, str) or not d.strip() or len(d) > 4500:
        out.append("meta.yml: description must be a string of 1-4500 characters")
    tags = meta.get("tags")
    if not isinstance(tags, list) or not all(isinstance(x, str) for x in tags):
        out.append("meta.yml: tags must be a list of strings")
    elif sum(len(x) for x in tags) > 500:
        out.append(f"meta.yml: tags total {sum(len(x) for x in tags)} characters, 500 at most")
    if "template" in meta and not isinstance(meta["template"], bool):
        out.append("meta.yml: template must be true or false")
    src = meta.get("sources")
    if tpl and src in (None, []):
        pass
    elif not isinstance(src, list):
        out.append("meta.yml: sources must be a list of at least 2 http(s) URLs")
    else:
        bad = [u for u in src if not _url_ok(u)]
        if bad:
            out.append(f"meta.yml: sources must be http(s) URLs, not {bad[0]!r}")
        elif len({_url_key(u) for u in src}) < 2 and not tpl:
            out.append("meta.yml: sources needs at least 2 distinct http(s) URLs")
    return out


def _norm(token):
    """lower-case; keep letters, digits, apostrophes and hyphens; trim apostrophes / hyphens at the edges"""
    t = token.lower().replace("’", "'")
    t = re.sub(r"[^\w'-]|_", "", t)
    return t.strip("'-")


def _norm_list(tokens):
    return [n for n in (_norm(t) for t in tokens) if n]


def _check_words(folder, frames):
    words, err = _read_json(folder / "words.json")
    if err:
        return [err]
    if not isinstance(words, list) or not words:
        return ["words.json: must be a non-empty list of {w, s, e}"]
    out = []
    ok = True
    for i, w in enumerate(words):
        if not (isinstance(w, dict) and isinstance(w.get("w"), str) and w["w"].strip()
                and _num(w.get("s")) and _num(w.get("e")) and w["s"] >= 0):
            out.append(f"words.json: entry {i} must be {{w: text, s: seconds >= 0, e: seconds}}")
            ok = False
            continue
        if not w["s"] < w["e"]:
            out.append(f"words.json: entry {i} ({w['w']!r}) needs s < e ({w['s']} .. {w['e']})")
    if ok:
        for i in range(1, len(words)):
            if words[i]["s"] < words[i - 1]["s"]:
                out.append(f"words.json: entry {i} starts at {words[i]['s']} before entry {i - 1} ({words[i - 1]['s']}); s must be non-decreasing")
        if frames is not None and words[-1]["e"] > frames / FPS + 1e-6:
            out.append(f"words.json: last word ends at {words[-1]['e']} s, after the video end (FRAMES/30 = {frames / FPS:g} s)")
    if not (folder / "SCRIPT.md").is_file():               # reported as missing; only the comparison cannot run
        return out
    try:
        text = narration(folder / "SCRIPT.md")
    except (OSError, ValueError) as e:
        out.append(f"SCRIPT.md: {e}")
        return out
    if ok:
        spoken, said = _norm_list(text.split()), _norm_list(w["w"] for w in words)
        if spoken != said:
            n = next((i for i, (a, b) in enumerate(zip(spoken, said)) if a != b), min(len(spoken), len(said)))
            a = spoken[n] if n < len(spoken) else "(end)"
            b = said[n] if n < len(said) else "(end)"
            out.append(f"words.json: words differ from the narration in SCRIPT.md at word {n + 1}: narration has {a!r}, "
                       f"words.json has {b!r} (narration {len(spoken)} words, words.json {len(said)})")
    return out


def _check_voice(folder, frames):
    try:
        info = sf.info(str(folder / "voice.wav"))
    except Exception as e:  # soundfile raises LibsndfileError / RuntimeError
        return [f"voice.wav: not a readable wav ({str(e).splitlines()[0] if str(e) else type(e).__name__})"]
    out = []
    if info.samplerate not in SAMPLE_RATES:
        out.append(f"voice.wav: sample rate {info.samplerate} Hz, must be 24000 or 48000 (24 / 48 kHz)")
    secs = info.frames / info.samplerate if info.samplerate else 0
    if frames is not None and secs > frames / FPS + 1e-6:
        out.append(f"voice.wav: {secs:.2f} s is longer than the video ({frames / FPS:g} s = FRAMES/30)")
    return out


def _pairs(v):
    return isinstance(v, list) and all(isinstance(p, list) and len(p) == 2 and all(_int(x) for x in p) and p[0] <= p[1] for p in v)


def _check_shots(folder, frames):
    data, err = _read_json(folder / "shots.json")
    if err:
        return [err]
    if not isinstance(data, dict) or not isinstance(data.get("shots"), list) or not data["shots"]:
        return ['shots.json: must be {"shots": [{"id", "a", "b"}, ...], "xfade": [...], "planned": [...]} with at least one shot']
    out = []
    for key in ("xfade", "planned"):
        if key in data and not _pairs(data[key]):
            out.append(f"shots.json: {key} must be a list of [from, to] frame pairs")
    if "flash" in data and not _pairs([data["flash"]]):
        out.append("shots.json: flash must be a [from, to] frame pair")
    shots = data["shots"]
    bad = [i for i, s in enumerate(shots) if not (isinstance(s, dict) and all(_int(s.get(k)) for k in ("id", "a", "b")))]
    if bad:
        return out + [f"shots.json: shots[{bad[0]}] must be {{id, a, b}} with integers"]
    ids = [s["id"] for s in shots]
    for i in sorted({i for i in ids if ids.count(i) > 1}):
        out.append(f"shots.json: duplicate shot id {i}")
    shots = sorted(shots, key=lambda s: s["a"])
    if shots[0]["a"] != 0:
        out.append(f"shots.json: shots must start at 0 (the first starts at {shots[0]['a']})")
    for p, n in zip(shots, shots[1:]):
        if p["b"] != n["a"]:
            out.append(f"shots.json: shots are not contiguous: shot {p['id']} ends at {p['b']}, shot {n['id']} starts at {n['a']}")
    if frames is not None and shots[-1]["b"] != frames:
        out.append(f"shots.json: last shot ends at {shots[-1]['b']}, but FRAMES is {frames}")
    for s in shots:
        if s["b"] - s["a"] < MIN_SHOT:
            out.append(f"shots.json: shot {s['id']} is {s['b'] - s['a']} frames long, at least {MIN_SHOT} frames needed")
    return out


def _spec_ok(spec_, folder, files, engine):
    if spec_ in PACKAGES:
        return True
    if spec_.startswith(JSM):
        rest = spec_[len(JSM):]
        return bool(JSM_RE.fullmatch(rest)) and all(p not in ("", ".", "..") for p in rest.split("/"))
    m = ENGINE_RE.fullmatch(spec_)
    if m:
        return m.group(1) in engine
    m = SIBLING_RE.fullmatch(spec_)
    if m:
        n = m.group(1)
        return n == "words.json" or n in files and n.endswith((".ts", ".tsx", ".json")) or n + ".ts" in files or n + ".tsx" in files
    return False


def _check_code(folder, files, engine):
    out = []
    for name in sorted(files):
        if not name.lower().endswith(CODE):
            continue
        try:
            text = (folder / name).read_text(encoding="utf-8")
        except (OSError, ValueError) as e:
            out.append(f"{name}: cannot read as utf-8 ({e})")
            continue
        seen = set()
        if KEYWORD_COMMENT_RE.search(text):
            out.append(f"{name}: comment between import keyword and specifier not allowed (no comment right after from / import / export)")
        for m in SPEC_START_RE.finditer(text):
            q = SPEC_RE.match(text, m.end())
            if q is None:                                   # unterminated, template literal, ...: fail closed
                if "<unparsed>" not in seen:
                    seen.add("<unparsed>")
                    out.append(f"{name}: import specifier cannot be parsed (use a plain single-line quoted string)")
                continue
            s = q.group(1) if q.group(1) is not None else q.group(2)
            if s not in seen and not _spec_ok(s, folder, files, engine):
                seen.add(s)
                out.append(f"{name}: import {s!r} not allowed (only react, three, three/examples/jsm/*, remotion, @remotion/three, "
                           f"@react-three/fiber, @react-three/postprocessing, postprocessing, ../../src/engine/<module>, ./<file> in the folder)")
        for tok, rx in FORBIDDEN:
            if rx.search(text):
                out.append(f"{name}: forbidden token `{tok}`")
    return out


def problems(folder):
    """every problem with a video folder (empty list when it passes)"""
    folder = Path(folder).resolve()
    if not folder.is_dir():
        return [f"folder not found: {folder}"]
    out = []
    if not NAME_RE.fullmatch(folder.name):
        out.append(f"folder name {folder.name!r} must match ^\\d{{3}}-[a-z0-9-]{{3,50}}$")

    entries = sorted(folder.iterdir(), key=lambda p: p.name)
    files = {}
    total = 0
    for p in entries:
        if p.is_symlink():
            out.append(f"{p.name}: symbolic links are not allowed")
        elif p.is_dir():
            out.append(f"{p.name}: subdirectories are not allowed")
            total += sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(p) for f in fs)
        elif p.is_file():
            size = p.stat().st_size
            files[p.name] = size
            total += size
            if p.suffix.lower() not in EXTENSIONS:
                out.append(f"{p.name}: extension {p.suffix or '(none)'!r} not allowed (only {' '.join(EXTENSIONS)})")
            elif p.name == "voice.wav":
                if size > VOICE_MAX:
                    out.append(f"voice.wav: {size / 1048576:.1f} MB is over the 12 MB limit")
            elif size > FILE_MAX:
                out.append(f"{p.name}: {size / 1024:.0f} KB is over the 400 KB limit")
    if total > FOLDER_MAX:
        out.append(f"folder: {total / 1048576:.1f} MB in total is over the 15 MB limit")

    for f in REQUIRED:
        if f not in files:
            out.append(f"{f} missing")

    meta, err = (None, None) if "meta.yml" not in files else _load_meta(folder)
    tpl = bool(meta) and meta.get("template") is True
    if err:
        out.append(err)
    elif meta is not None:
        out += _check_meta(meta, tpl)

    frames = None
    if "Video.tsx" in files:
        try:
            frames = spec.frames(folder)
        except (OSError, ValueError) as e:
            out.append(str(e))
        if frames is not None:
            decls = len(FRAMES_DECL_RE.findall((folder / "Video.tsx").read_text(encoding="utf-8")))
            if decls != 1:      # spec.frames matched one `export const FRAMES = <int>;`; any other declaration (even in a comment) could differ
                out.append(f"Video.tsx: FRAMES is declared {decls} times; declare it exactly once as 'export const FRAMES = <integer>;' "
                           f"(it is read textually, so no other const / let / var FRAMES, not even in a comment)")
            lo = 1 if tpl else MIN_FRAMES
            if not lo <= frames <= MAX_FRAMES:
                out.append(f"Video.tsx: FRAMES {frames} outside {lo}-{MAX_FRAMES}"
                           + (" (template: 70 s at most)" if tpl else " (55-70 s at 30 fps)"))

    if "words.json" in files:
        out += _check_words(folder, frames)
    elif "SCRIPT.md" in files:
        try:
            narration(folder / "SCRIPT.md")
        except (OSError, ValueError) as e:
            out.append(f"SCRIPT.md: {e}")
    if "voice.wav" in files:
        out += _check_voice(folder, frames)
    if "shots.json" in files:
        out += _check_shots(folder, frames)
    if "audio.json" in files and frames is not None:
        out += [p if p.startswith("audio.json") else f"audio.json: {p}"
                for p in spec.validate(folder) if not p.endswith("missing (needed for the mix)")]
    out += _check_code(folder, files, engine_modules())
    return out


def main(argv):
    if not argv:
        print("usage: python tools/video_check.py videos/<id> [videos/<id> ...]", file=sys.stderr)
        return 2
    bad = False
    for arg in argv:
        name = Path(arg).resolve().name
        ps = problems(arg)
        if ps:
            bad = True
            for p in ps:
                print(f"{name}: {p}")
        else:
            print(f"ok {name}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
