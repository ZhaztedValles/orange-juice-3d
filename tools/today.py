"""Tonight's plan for the nightly writer: how many videos to make, which to fix or drop, and the next video number.

Usage: python tools/today.py [--json]
Prints a short summary (or JSON with --json). Run from the repo root; it reads config.yml, the `queue` release asset
names (like tools/status.py), state/render, state/posted, videos/ and stories/.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "autopilot"))
import ledger  # noqa: E402
import render_state  # noqa: E402
import status  # noqa: E402
import video_check  # noqa: E402

FIX_ATTEMPTS = 2          # a held video with this many failed attempts is dropped, not fixed again
NUMBER_RE = re.compile(r"(\d{3})-")


def _numbers(ids):
    return [int(m.group(1)) for i in ids if isinstance(i, str) and (m := NUMBER_RE.match(i))]


def plan(paused, queue_ids, render_state: dict, posted: set, video_ids: list, entries, templates=()) -> dict:
    """tonight's plan. Pure: no I/O.
    render_state = {id: state}; templates = ids of template folders (meta.yml `template: true`; `000-bridge` always
    is one): they are never listed as held and never counted as queued. next_id is one above the highest number among the video folders and the ledger's
    '<NNN>-<slug>' ids (so a dropped story's number is not reused), at least 001."""
    skip = set(templates) | {ledger.TEMPLATE}
    queue_ids = [v for v in queue_ids if v not in skip]
    held = []
    for vid, st in sorted(render_state.items()):
        if st.get("status") != "held" or vid in skip:
            continue
        attempts = int(st.get("attempts", 0))
        held.append({"id": vid, "reasons": list(st.get("reasons", [])), "attempts": attempts,
                     "action": "fix" if attempts < FIX_ATTEMPTS else "drop"})
    ledger_ids = [e.get("id") for e in entries if isinstance(e, dict)]
    top = max(_numbers(list(video_ids) + ledger_ids), default=0)
    return {"paused": bool(paused), "queue_count": len(queue_ids), "held": held,
            "next_id": f"{top + 1:03d}", "posted_count": len(posted), "make": 0 if paused else 1}


def summary(p):
    lines = [f"paused: {'yes' if p['paused'] else 'no'}",
             f"queued: {p['queue_count']}   posted: {p['posted_count']}",
             f"make tonight: {p['make']} (next id starts with {p['next_id']}-)"]
    if p["held"]:
        lines.append("held:")
        for h in p["held"]:
            lines.append(f"  {h['id']}: {h['action']} ({h['attempts']} attempt(s))")
            lines += [f"    - {r}" for r in h["reasons"]]
    else:
        lines.append("held: none")
    return "\n".join(lines)


def main(argv):
    ap = argparse.ArgumentParser(description="tonight's plan for the writer")
    ap.add_argument("--json", action="store_true", help="print JSON instead of a summary")
    a = ap.parse_args(argv)
    import common
    from store import get_store
    cfg = common.load_config()
    entries, _ = ledger.load(ROOT)
    videos = ROOT / "videos"
    video_ids = sorted(d.name for d in videos.iterdir() if d.is_dir()) if videos.is_dir() else []
    templates = [v for v in video_ids if video_check.is_template(videos / v)]
    p = plan(bool(cfg.get("paused")), status.queued_ids(get_store().names()), render_state.load(ROOT / "state"),
             set(common.load_posted()), video_ids, entries, templates)
    print(json.dumps(p, indent=1) if a.json else summary(p))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
