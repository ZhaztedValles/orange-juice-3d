"""The writer's self-check, run before pushing a video folder.

Usage: python tools/writer_check.py videos/<id>
Prints `ready <id>` (exit 0), or the problems, one per line (exit 1). Checks, in order: video_check.problems, the story
ledger (every video except the template 000-bridge needs one coded entry, and that entry must not repeat another entry or
a banned story), no `template: true` outside 000-bridge, the narration pace, and the required "You see," pivot
(case-sensitive, comma included).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import ledger  # noqa: E402
import script_md  # noqa: E402
import video_check  # noqa: E402

MIN_WPS, MAX_WPS, AIM_WPS = 3.3, 4.1, 3.4     # the fixed voice (SPEED 1.2) reads about 3.4 w/s
PIVOT = "You see,"


def words_per_second(words) -> float:
    """number of words / (last word's end - first word's start); 0.0 when there is no time span"""
    if not words:
        return 0.0
    span = words[-1]["e"] - words[0]["s"]
    return len(words) / span if span > 0 else 0.0


def repeat_problems(vid, entries, banned):
    """the video's own coded ledger entry checked against every other entry and the banned list (what Accept does)"""
    own = [i for i, e in enumerate(entries)
           if isinstance(e, dict) and e.get("video") == vid and e.get("status") == "coded"]
    if len(own) != 1 or not isinstance(entries[own[0]].get("claim"), str):
        return []       # ledger.video_problems reports a missing or duplicate entry
    e = entries[own[0]]
    topics = e.get("topics") if isinstance(e.get("topics"), list) else []
    others = [o for i, o in enumerate(entries) if i != own[0]]
    return [f"ledger entry {e.get('id')!r}: {r}" for r in ledger.check(e["claim"], topics, others, banned)]


def check(folder, root=None):
    """every problem the writer must fix before pushing `folder` (empty list when it is ready).
    The story files are read from `root`: by default the repository that holds the folder (videos/<id> -> two levels
    up) when it has a stories/ directory, else this repository."""
    folder = Path(folder).resolve()
    if root is None:
        root = folder.parent.parent if (folder.parent.parent / "stories").is_dir() else ROOT
    vid = folder.name
    out = list(video_check.problems(folder)) + video_check.template_problems(folder)
    if vid != ledger.TEMPLATE:
        try:
            entries, banned = ledger.load(root)
            out += ledger.video_problems(vid, entries)
            out += repeat_problems(vid, entries, banned)
        except ValueError as e:
            out.append(f"stories: {e}")
    try:
        words = json.loads((folder / "words.json").read_text(encoding="utf-8"))
        wps = words_per_second(words)
        if not (MIN_WPS <= wps <= MAX_WPS):
            out.append(f"narration pace {wps:.2f} w/s, aim for about {AIM_WPS}; the fixed voice reads 205-230 words in 55-68 s")
    except (OSError, ValueError, TypeError, KeyError, IndexError):
        pass    # a missing or malformed words.json is already reported by video_check
    try:
        if PIVOT not in script_md.narration(folder / "SCRIPT.md"):
            out.append(f'narration needs the "{PIVOT}" pivot before the everyday analogy')
    except (OSError, ValueError):
        pass    # a missing or malformed SCRIPT.md is already reported by video_check
    out += cut_problems(folder)
    return out


CUT_RE = re.compile(r"\{\s*f:\s*(\d+)\s*,\s*cut:\s*true")


def cut_problems(folder):
    """Every hard camera cut inside a shot (`{ f: N, cut: true, ... }` in a .ts file) is a deliberate jump; the render's
    QA counts any unlisted jump as a "pop" and holds the video. Each cut frame must be covered by shots.json `planned`."""
    folder = Path(folder)
    try:
        planned = json.loads((folder / "shots.json").read_text(encoding="utf-8")).get("planned", [])
        covered = {f for a, b in planned for f in range(int(a), int(b) + 1)}
    except (OSError, ValueError, TypeError, AttributeError):
        return []   # video_check reports a malformed shots.json
    cuts = sorted({int(m) for ts in folder.glob("*.ts*") for m in CUT_RE.findall(ts.read_text(encoding="utf-8"))})
    missing = [f for f in cuts if f not in covered]
    if not missing:
        return []
    return [f"shots.json: camera cut frames {missing} are not in \"planned\"; add [N, N] for each "
            f"(the render QA holds the video for unplanned pops)"]


def main(argv):
    if len(argv) != 1:
        print("usage: python tools/writer_check.py videos/<id>")
        return 2
    errs = check(argv[0])
    vid = Path(argv[0]).resolve().name
    print("\n".join(errs) if errs else f"ready {vid}")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
