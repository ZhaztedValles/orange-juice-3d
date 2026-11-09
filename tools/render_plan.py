"""Plans a render run: which video is next, how many frames, and the chunk matrix. Also writes render state and queue yml.

Usage:
  python tools/render_plan.py [--video ID]
      prints {"video": id|null, "frames": n, "template": bool, "matrix": {"include": [{"idx","from","to"}, ...]}}.
      Without --video it picks the lowest eligible id (see next_video); with --video it skips eligibility (templates,
      re-renders) but the folder must still pass tools/video_check.py.
  python tools/render_plan.py --video ID --set-state queued|held [--reasons FILE]
      writes state/render/<ID>.json ({"status", "reasons", "attempts", "updated"}); a hold adds 1 to attempts.
  python tools/render_plan.py --video ID --queue-yml OUT
      writes the queue's <ID>.yml: the video's meta.yml plus `frames` and `rendered_at`.
"""
import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import yaml  # noqa: E402

import video_check  # noqa: E402
from audio import spec  # noqa: E402

CHUNKS = 16
STATUSES = ("queued", "held")


def chunks(frames, n=CHUNKS):
    """frame ranges for n parallel renders, cut at round(i * frames / n) like the split-render spike; empty ranges dropped"""
    cuts = [round(i * frames / n) for i in range(n + 1)]
    return [{"idx": f"{i:03d}", "from": cuts[i], "to": cuts[i + 1] - 1} for i in range(n) if cuts[i + 1] > cuts[i]]


def last_commit_time(folder):
    """committer time of the last commit touching `folder` (needs full history: checkout with fetch-depth 0), or None"""
    r = subprocess.run(["git", "log", "-1", "--format=%cI", "--", str(folder)], cwd=ROOT, capture_output=True, text=True)
    s = r.stdout.strip()
    return datetime.fromisoformat(s) if r.returncode == 0 and s else None


def _time(s):
    try:
        t = datetime.fromisoformat(s)
    except (TypeError, ValueError):
        return None
    return t if t.tzinfo else t.replace(tzinfo=timezone.utc)


def load_states(state_dir):
    """{id: state} from state_dir/render/*.json"""
    d = Path(state_dir) / "render"
    return {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted(d.glob("*.json"))} if d.is_dir() else {}


def set_state(state_dir, vid, status, reasons, now=None):
    """write state_dir/render/<vid>.json; a hold counts one more attempt"""
    if status not in STATUSES:
        raise ValueError(f"status must be one of {STATUSES}, not {status!r}")
    prev = load_states(state_dir).get(vid, {})
    attempts = int(prev.get("attempts", 0)) + (1 if status == "held" else 0)
    now = now or datetime.now(timezone.utc)
    st = {"status": status, "reasons": list(reasons), "attempts": attempts, "updated": now.isoformat(timespec="seconds")}
    p = Path(state_dir) / "render" / f"{vid}.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(st, indent=1) + "\n", encoding="utf-8")
    return st


def _held(state, folder, last_commit):
    """held, and the folder has not been committed since the hold"""
    if not state or state.get("status") != "held":
        return False
    updated = _time(state.get("updated"))
    if updated is None:
        return False
    committed = last_commit(folder)
    return committed is None or committed <= updated


def next_video(videos_dir, queue_names, states, state_dir=None, last_commit=last_commit_time):
    """the lowest id that is not a template, not in the queue release, not posted, not held since its last commit,
    and passes video_check; None when nothing is left"""
    videos_dir = Path(videos_dir)
    state_dir = Path(state_dir) if state_dir else videos_dir.parent / "state"
    queued = {Path(n).stem for n in queue_names}
    for folder in sorted((p for p in videos_dir.iterdir() if p.is_dir()), key=lambda p: p.name):
        vid = folder.name
        if vid in queued or (state_dir / "posted" / f"{vid}.json").exists():
            continue
        if _held(states.get(vid), folder, last_commit) or video_check.is_template(folder):
            continue
        if not video_check.problems(folder):
            return vid
    return None


def queue_names(release="queue"):
    """asset names of the queue release; [] only when the release does not exist (any other gh failure raises, so a
    flaky API can never make queued videos look unqueued)"""
    r = subprocess.run(["gh", "release", "view", release, "--json", "assets"], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        if "not found" in (r.stderr + r.stdout).lower():
            return []
        raise RuntimeError(f"gh release view {release} failed: {r.stderr.strip()}")
    return [a["name"] for a in json.loads(r.stdout).get("assets", [])]


def plan(video=None, videos_dir=ROOT / "videos", state_dir=ROOT / "state"):
    if video is None:
        video = next_video(videos_dir, queue_names(), load_states(state_dir), state_dir=state_dir)
    else:
        probs = video_check.problems(Path(videos_dir) / video)
        if probs:
            raise ValueError(f"{video} fails video_check:\n" + "\n".join(probs))
    if video is None:
        return {"video": None, "frames": 0, "template": False, "matrix": {"include": []}}
    folder = Path(videos_dir) / video
    frames = spec.frames(folder)
    return {"video": video, "frames": frames, "template": video_check.is_template(folder), "matrix": {"include": chunks(frames)}}


def queue_yml(video, out, videos_dir=ROOT / "videos"):
    folder = Path(videos_dir) / video
    meta = yaml.safe_load((folder / "meta.yml").read_text(encoding="utf-8")) or {}
    meta["frames"] = spec.frames(folder)
    meta["rendered_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    Path(out).write_text(yaml.safe_dump(meta, sort_keys=False, allow_unicode=True), encoding="utf-8")
    return meta


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--video", default="", help="render this id (skips eligibility, still needs video_check)")
    ap.add_argument("--set-state", choices=STATUSES)
    ap.add_argument("--reasons", help="file with one fail reason per line (for --set-state held)")
    ap.add_argument("--queue-yml", metavar="OUT")
    a = ap.parse_args(argv)
    video = a.video.strip() or None
    if (a.set_state or a.queue_yml) and not video:
        ap.error("--set-state and --queue-yml need --video")
    if video and not video_check.NAME_RE.fullmatch(video):
        ap.error(f"--video {video!r} is not a video id")
    if a.set_state:
        reasons = []
        if a.reasons:
            reasons = [l.strip() for l in Path(a.reasons).read_text(encoding="utf-8").splitlines() if l.strip()]
        print(json.dumps(set_state(ROOT / "state", video, a.set_state, reasons)))
        return 0
    if a.queue_yml:
        queue_yml(video, a.queue_yml)
        return 0
    try:
        print(json.dumps(plan(video)))
    except ValueError as e:
        print(e, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
