"""Render state: state/render/<id>.json = {"status": "queued"|"held", "reasons": [...], "attempts": n, "updated": iso,
"source": sha}. `source` is the last commit touching videos/<id> when the render was planned; a held video becomes
eligible again once that folder's last commit differs (tools/render_plan.py).

Standard library only, so the render-failure job can run it without installing anything.

Usage: python tools/render_state.py [--state-dir state] set ID queued|held [--source SHA] [--reason TEXT ...] [--reasons-file F]
A hold adds 1 to attempts; reasons are the --reason values first (use --reason=TEXT when TEXT starts with "-"),
then the file's non-empty lines.
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATUSES = ("queued", "held")
ID_RE = re.compile(r"\d{3}-[a-z0-9-]{3,50}")      # same as video_check.NAME_RE (kept dependency-free here)


def load(state_dir):
    """{id: state} from state_dir/render/*.json"""
    d = Path(state_dir) / "render"
    return {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted(d.glob("*.json"))} if d.is_dir() else {}


def set_state(state_dir, vid, status, reasons, source=None, now=None):
    """write state_dir/render/<vid>.json; a hold counts one more attempt"""
    if status not in STATUSES:
        raise ValueError(f"status must be one of {STATUSES}, not {status!r}")
    if not ID_RE.fullmatch(vid):
        raise ValueError(f"{vid!r} is not a video id")
    prev = load(state_dir).get(vid, {})
    attempts = int(prev.get("attempts", 0)) + (1 if status == "held" else 0)
    now = now or datetime.now(timezone.utc)
    st = {"status": status, "reasons": list(reasons), "attempts": attempts, "updated": now.isoformat(timespec="seconds"),
          "source": source or None}
    p = Path(state_dir) / "render" / f"{vid}.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(st, indent=1) + "\n", encoding="utf-8")
    return st


def main(argv):
    ap = argparse.ArgumentParser(description="write state/render/<id>.json")
    ap.add_argument("--state-dir", default=str(ROOT / "state"))
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("set")
    s.add_argument("id")
    s.add_argument("status", choices=STATUSES)
    s.add_argument("--reason", action="append", default=[])
    s.add_argument("--source", default="")
    s.add_argument("--reasons-file")
    a = ap.parse_args(argv)
    reasons = list(a.reason)
    if a.reasons_file:
        reasons += [l.strip() for l in Path(a.reasons_file).read_text(encoding="utf-8").splitlines() if l.strip()]
    try:
        print(json.dumps(set_state(a.state_dir, a.id, a.status, reasons, source=a.source)))
    except ValueError as e:
        print(e, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
