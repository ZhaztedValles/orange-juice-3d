"""The writer's self-check, run before pushing a video folder.

Usage: python tools/writer_check.py videos/<id>
Prints `ready <id>` (exit 0), or the problems, one per line (exit 1). Checks, in order: video_check.problems, the story
ledger (every video except the template 000-bridge needs one coded entry), the narration pace, and the required "You see," pivot (case-sensitive, comma included).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import ledger  # noqa: E402
import script_md  # noqa: E402
import video_check  # noqa: E402

MIN_WPS, MAX_WPS, AIM_WPS = 3.3, 4.1, 3.7
PIVOT = "You see,"


def words_per_second(words) -> float:
    """number of words / (last word's end - first word's start); 0.0 when there is no time span"""
    if not words:
        return 0.0
    span = words[-1]["e"] - words[0]["s"]
    return len(words) / span if span > 0 else 0.0


def check(folder, root=None):
    """every problem the writer must fix before pushing `folder` (empty list when it is ready).
    The story files are read from `root`: by default the repository that holds the folder (videos/<id> -> two levels
    up) when it has a stories/ directory, else this repository."""
    folder = Path(folder).resolve()
    if root is None:
        root = folder.parent.parent if (folder.parent.parent / "stories").is_dir() else ROOT
    vid = folder.name
    out = list(video_check.problems(folder))
    if vid != ledger.TEMPLATE:
        try:
            entries, _ = ledger.load(root)
            out += ledger.video_problems(vid, entries)
        except ValueError as e:
            out.append(f"stories: {e}")
    try:
        words = json.loads((folder / "words.json").read_text(encoding="utf-8"))
        wps = words_per_second(words)
        if not (MIN_WPS <= wps <= MAX_WPS):
            out.append(f"narration pace {wps:.2f} w/s, aim for about {AIM_WPS}")
    except (OSError, ValueError, TypeError, KeyError, IndexError):
        pass    # a missing or malformed words.json is already reported by video_check
    try:
        if PIVOT not in script_md.narration(folder / "SCRIPT.md"):
            out.append(f'narration needs the "{PIVOT}" pivot before the everyday analogy')
    except (OSError, ValueError):
        pass    # a missing or malformed SCRIPT.md is already reported by video_check
    return out


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
