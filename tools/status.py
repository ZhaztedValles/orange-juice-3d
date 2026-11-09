"""Daily queue health report: raises (or closes) one GitHub issue per alert.

Alerts (fixed issue titles; the open issue is updated, a new one is created when there is none, and it is closed with
a short comment when the condition clears):
  "Orange Juice: queue low"      queued videos < 2 x number of slots in config.yml
  "Orange Juice: writer silent"  no commit "Accept claude/oj-..." on main in the last 36 h (never before the first one)
  "Orange Juice: videos held"    a video is held with attempts >= 2 (ids and reasons are listed)

Usage: python tools/status.py [--alert]
Without --alert it only prints what it found. With --alert it also opens, updates and closes the issues (needs gh and
GH_TOKEN with issues: write). Run from the repo root, with the full git history of main checked out.
"""
import argparse
import json
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT / "autopilot"))
import render_state  # noqa: E402

T_LOW = "Orange Juice: queue low"
T_SILENT = "Orange Juice: writer silent"
T_HELD = "Orange Juice: videos held"
TITLES = (T_LOW, T_SILENT, T_HELD)
SILENT_AFTER = timedelta(hours=36)
HELD_ATTEMPTS = 2
ACCEPT_PREFIX = "Accept claude/oj-"


def alerts(queue_count, slots, last_accept, held, now, folders=None):
    """[(title, body)] for every alert that applies. Pure: no I/O.
    held = {id: render state}; last_accept = datetime of the newest accept commit, or None when there never was one.
    folders = the ids of the video folders on main: a held id with no folder was dropped, so it is not an alert (None
    skips that filter)."""
    out = []
    need = 2 * len(slots)
    if queue_count < need:
        out.append((T_LOW, f"Only {queue_count} video(s) are queued; at least {need} are wanted "
                           f"(2 days of videos at {len(slots)} post(s) a day).\n\n"
                           "The nightly writer needs to add videos, or check the render workflow."))
    if last_accept is not None and now - last_accept > SILENT_AFTER:
        hours = int((now - last_accept).total_seconds() // 3600)
        out.append((T_SILENT, f"No `{ACCEPT_PREFIX}...` branch has been accepted into main for {hours} hours "
                              f"(last one: {last_accept.isoformat(timespec='minutes')}).\n\n"
                              "The nightly writer may have stopped, or its branches are being rejected "
                              "(see the \"writer branch rejected\" issue)."))
    stuck = {v: s for v, s in sorted(held.items())
             if s.get("status") == "held" and s.get("attempts", 0) >= HELD_ATTEMPTS
             and (folders is None or v in folders)}
    if stuck:
        lines = ["These videos failed the render checks and are on hold (a hold ends when the video folder is "
                 "committed again):", ""]
        for v, s in stuck.items():
            lines.append(f"- **{v}** ({s.get('attempts')} attempts)")
            lines += [f"  - {r}" for r in s.get("reasons", [])]
        out.append((T_HELD, "\n".join(lines)))
    return out


def queued_ids(names):
    """ids of the queued videos: one per .mp4 asset (its .yml rides along; cleanup deletes both after posting)"""
    return [n[:-len(".mp4")] for n in names if n.endswith(".mp4")]


def queued_count(names):
    return len(queued_ids(names))


def newest_accept(log):
    """newest commit time from `git log --format=%cI<TAB>%s` text, for subjects starting with 'Accept claude/oj-'"""
    times = []
    for line in log.splitlines():
        when, _, subject = line.partition("\t")
        if subject.startswith(ACCEPT_PREFIX):
            times.append(datetime.fromisoformat(when))
    return max(times) if times else None


def git_newest_accept(ref="HEAD"):
    r = subprocess.run(["git", "log", ref, "--format=%cI%x09%s", "--grep", f"^{ACCEPT_PREFIX}"],
                       cwd=ROOT, capture_output=True, text=True, check=True)
    return newest_accept(r.stdout)


def gh(*args):
    r = subprocess.run(["gh", *args], capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(f"gh {' '.join(args[:3])} failed: {r.stderr.strip()[:300]}")
    return r.stdout


def open_issue(title):
    """number of the open issue with exactly this title, or None"""
    found = json.loads(gh("issue", "list", "--state", "open", "--search", f'"{title}" in:title',
                          "--json", "number,title"))
    nums = [i["number"] for i in found if i["title"] == title]
    return nums[0] if nums else None


def sync_issues(raised):
    """raise (create or update) every alert in `raised`, close the open issue of every other title"""
    bodies = dict(raised)
    for title in TITLES:
        if title in bodies:
            with tempfile.TemporaryDirectory() as d:
                f = Path(d) / "body.md"
                f.write_text(bodies[title], encoding="utf-8")
                subprocess.run(["bash", str(ROOT / "tools" / "upsert_issue.sh"), title, str(f)], check=True)
        else:
            num = open_issue(title)
            if num:
                gh("issue", "close", str(num), "--comment", "The condition has cleared, closing.")
                print(f"closed #{num}: {title}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--alert", action="store_true", help="open, update and close GitHub issues (default: print only)")
    a = ap.parse_args()
    import common
    from store import get_store
    cfg = common.load_config()
    count = queued_count(get_store().names())
    videos = ROOT / "videos"
    folders = {d.name for d in videos.iterdir() if d.is_dir()} if videos.is_dir() else set()
    raised = alerts(count, cfg["slots"], git_newest_accept(), render_state.load(ROOT / "state"),
                    datetime.now(timezone.utc), folders)
    common.summary(f"Queue status\nqueued: {count}\nalerts: {', '.join(t for t, _ in raised) or 'none'}")
    if a.alert:
        sync_issues(raised)
    return 0


if __name__ == "__main__":
    sys.exit(main())
