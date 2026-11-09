"""Plans a render run: which video is next, how many frames, the chunk matrix; also checks the rendered pieces and writes
the queue yml.

Usage:
  python tools/render_plan.py [--video ID]
      prints {"video": id|null, "frames": n, "template": bool, "source": sha|null, "matrix": {"include": [...]}}.
      Without --video it picks the lowest eligible id (see next_video); with --video it skips eligibility (templates,
      re-renders) but the folder must still pass tools/video_check.py (exit 1 with the problems otherwise).
      `source` is the last commit touching videos/<id>; the render state records it (tools/render_state.py).
  python tools/render_plan.py --check-pieces DIR --frames N
      checks DIR/piece_<idx>.mp4 against chunks(N) (mp4, one h264 video stream, 1080x1920, the chunk's frame count,
      no missing or extra pieces); prints an ffmpeg concat list on success, the problems on stderr and exit 1 otherwise.
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

import render_state  # noqa: E402
import video_check  # noqa: E402
from audio import spec  # noqa: E402

CHUNKS = 16
WIDTH, HEIGHT = 1080, 1920
VIDEOS = ROOT / "videos"
STATE = ROOT / "state"


def chunks(frames, n=CHUNKS):
    """frame ranges for n parallel renders, cut at round(i * frames / n) like the split-render spike; empty ranges dropped"""
    cuts = [round(i * frames / n) for i in range(n + 1)]
    return [{"idx": f"{i:03d}", "from": cuts[i], "to": cuts[i + 1] - 1} for i in range(n) if cuts[i + 1] > cuts[i]]


def folder_sha(folder):
    """sha of the last commit touching `folder` (needs full history: checkout with fetch-depth 0), or None"""
    r = subprocess.run(["git", "log", "-1", "--format=%H", "--", str(folder)], cwd=ROOT, capture_output=True, text=True)
    s = r.stdout.strip()
    return s if r.returncode == 0 and s else None


def _held(state, folder, sha_of):
    """held, and the folder's content has not changed since: same last-commit sha as the held render's `source`.
    A legacy hold without `source` is eligible; an unknown current sha keeps the hold (fail closed, no render loop)."""
    if not state or state.get("status") != "held":
        return False
    source = state.get("source")
    if not source:
        return False
    current = sha_of(folder)
    return current is None or current == source


def next_video(videos_dir, queue_names, states, state_dir=None, folder_sha=None):
    """the lowest id that is not a template, not in the queue release, not posted, not held on unchanged content,
    and passes video_check; None when nothing is left"""
    sha_of = folder_sha or globals()["folder_sha"]
    videos_dir = Path(videos_dir)
    state_dir = Path(state_dir) if state_dir else videos_dir.parent / "state"
    queued = {Path(n).stem for n in queue_names}
    for folder in sorted((p for p in videos_dir.iterdir() if p.is_dir()), key=lambda p: p.name):
        vid = folder.name
        if vid in queued or (state_dir / "posted" / f"{vid}.json").exists():
            continue
        if _held(states.get(vid), folder, sha_of) or video_check.is_template(folder):
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


def plan(video=None):
    if video is None:
        video = next_video(VIDEOS, queue_names(), render_state.load(STATE), state_dir=STATE)
    else:
        probs = video_check.problems(VIDEOS / video)
        if probs:
            raise ValueError(f"{video} fails video_check:\n" + "\n".join(probs))
    if video is None:
        return {"video": None, "frames": 0, "template": False, "source": None, "matrix": {"include": []}}
    folder = VIDEOS / video
    frames = spec.frames(folder)
    return {"video": video, "frames": frames, "template": video_check.is_template(folder), "source": folder_sha(folder),
            "matrix": {"include": chunks(frames)}}


def probe_piece(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-show_entries",
                        "format=format_name:stream=codec_type,codec_name,width,height,nb_read_frames", "-of", "json",
                        str(path)], capture_output=True, text=True)
    if r.returncode != 0:
        return {"error": r.stderr.strip() or f"ffprobe exit {r.returncode}"}
    return json.loads(r.stdout)


def piece_problems(probe, want_frames):
    """what is wrong with one rendered piece, from ffprobe's JSON"""
    if "error" in probe:
        return [f"unreadable: {probe['error']}"]
    out = []
    fmt = probe.get("format", {}).get("format_name", "")
    if "mp4" not in fmt.split(","):
        out.append(f"container {fmt!r} is not mp4")
    streams = probe.get("streams", [])
    if len(streams) != 1 or streams[0].get("codec_type") != "video":
        out.append(f"want exactly one video stream, got {[s.get('codec_type') for s in streams]}")
    v = next((s for s in streams if s.get("codec_type") == "video"), None)
    if v:
        if v.get("codec_name") != "h264":
            out.append(f"codec {v.get('codec_name')} (want h264)")
        if (v.get("width"), v.get("height")) != (WIDTH, HEIGHT):
            out.append(f"size {v.get('width')}x{v.get('height')} (want {WIDTH}x{HEIGHT})")
        got = v.get("nb_read_frames")
        if str(got) != str(want_frames):
            out.append(f"{got} frames (want {want_frames})")
    return out


def check_pieces(pieces_dir, chunk_list):
    """problems with the downloaded pieces against the chunk plan (empty = all present and well-formed)"""
    pieces_dir = Path(pieces_dir)
    want = {f"piece_{c['idx']}.mp4": c["to"] - c["from"] + 1 for c in chunk_list}
    out = [f"{p.name}: unexpected file" for p in sorted(pieces_dir.iterdir()) if p.name not in want]
    for name, n in want.items():
        p = pieces_dir / name
        if not p.is_file():
            out.append(f"{name} missing")
        else:
            out += [f"{name}: {x}" for x in piece_problems(probe_piece(p), n)]
    return out


def queue_yml(video, out):
    folder = VIDEOS / video
    meta = yaml.safe_load((folder / "meta.yml").read_text(encoding="utf-8")) or {}
    meta["frames"] = spec.frames(folder)
    meta["rendered_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    Path(out).write_text(yaml.safe_dump(meta, sort_keys=False, allow_unicode=True), encoding="utf-8")
    return meta


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--video", default="", help="render this id (skips eligibility, still needs video_check)")
    ap.add_argument("--queue-yml", metavar="OUT")
    ap.add_argument("--check-pieces", metavar="DIR")
    ap.add_argument("--frames", type=int)
    a = ap.parse_args(argv)
    video = a.video.strip() or None
    if video and not video_check.NAME_RE.fullmatch(video):
        ap.error(f"--video {video!r} is not a video id")
    if a.check_pieces:
        if not a.frames:
            ap.error("--check-pieces needs --frames")
        cs = chunks(a.frames)
        probs = check_pieces(a.check_pieces, cs)
        if probs:
            print("\n".join(probs), file=sys.stderr)
            return 1
        d = Path(a.check_pieces).resolve().as_posix()
        print("\n".join(f"file '{d}/piece_{c['idx']}.mp4'" for c in cs))
        return 0
    if a.queue_yml:
        if not video:
            ap.error("--queue-yml needs --video")
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
