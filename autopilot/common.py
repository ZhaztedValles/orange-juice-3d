"""Shared helpers for posting: config, queue naming, posted/approved state, time, run summary.
(Adapted from FactPop's autopilot/common.py: no playlists, no Instagram, ids instead of <playlist>-<n>-<slug>.)"""
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config.yml"
STATE = ROOT / "state"
# Queue files are <id>.mp4 + <id>.yml; the id is the video folder name (same pattern as tools/video_check.py)
ID_RE = re.compile(r"\d{3}-[a-z0-9-]{3,50}")
NAME_RE = re.compile(r"^(\d{3}-[a-z0-9-]{3,50})\.(mp4|yml)$")


def load_config():
    cfg = yaml.safe_load(CONFIG.read_text(encoding="utf-8"))
    if not isinstance(cfg, dict):
        raise RuntimeError("config.yml must be a mapping")
    return cfg


def now():
    return datetime.now(timezone.utc)


def iso(dt=None):
    return (dt or now()).isoformat(timespec="seconds")


class Item:
    """One video in the queue: <id>.mp4 + <id>.yml"""

    def __init__(self, vid):
        self.id = vid
        self.mp4, self.yml = f"{vid}.mp4", f"{vid}.yml"
        self.meta = None

    def __repr__(self):
        return self.id


def group_assets(names):
    """Turn the queue's file names into Items (sorted by id), plus a list of problems."""
    seen, problems = {}, []
    for n in names:
        m = NAME_RE.match(n)
        if not m:
            problems.append(f"'{n}' doesn't follow the naming pattern <id>.mp4 / <id>.yml (id like 001-some-title)")
            continue
        seen.setdefault(m.group(1), set()).add(m.group(2))
    items = []
    for vid, exts in seen.items():
        if exts != {"mp4", "yml"}:
            problems.append(f"{vid} is missing its .{({'mp4', 'yml'} - exts).pop()} file")
            continue
        items.append(Item(vid))
    items.sort(key=lambda i: i.id)
    return items, problems


# ---------------------------------------------------------------- state/posted and state/approved.yml
def posted_dir():
    return STATE / "posted"


def load_posted():
    """{id: record} from state/posted/*.json"""
    d = posted_dir()
    return {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted(d.glob("*.json"))} if d.is_dir() else {}


def write_posted(vid, record):
    posted_dir().mkdir(parents=True, exist_ok=True)
    (posted_dir() / f"{vid}.json").write_text(json.dumps(record, indent=1) + "\n", encoding="utf-8")


def load_approved():
    """the ids listed in state/approved.yml (`approved: [ids]`); a missing file or an empty list means none.
    A malformed file raises (fail closed: nothing posts on a file we cannot read)."""
    p = STATE / "approved.yml"
    if not p.exists():
        return []
    data = yaml.safe_load(p.read_text(encoding="utf-8"))
    ids = (data or {}).get("approved") if isinstance(data, dict) or data is None else None
    if ids is None:
        ids = []
    if not isinstance(ids, list) or not all(isinstance(i, str) for i in ids):
        raise RuntimeError("state/approved.yml must look like:  approved: [001-some-id, 002-other-id]")
    return ids


def load_render_states():
    d = STATE / "render"
    return {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted(d.glob("*.json"))} if d.is_dir() else {}


# ---------------------------------------------------------------- metadata
def youtube_description(meta, cfg):
    footer = cfg["youtube"].get("description_footer", "").strip()
    return meta["description"].strip() + ("\n\n" + footer if footer else "") + "\n"


def validate_meta(meta, cfg):
    errs = []
    if not isinstance(meta, dict):
        return ["the .yml file is empty or not valid"]
    for field in ("title", "description"):
        if not meta.get(field):
            errs.append(f"needs a '{field}'")
    if errs:
        return errs
    t = str(meta["title"]).strip()
    if len(t) > 100:
        errs.append(f"title is {len(t)} characters (YouTube max 100)")
    if "<" in t or ">" in t:
        errs.append("title can't contain < or >")
    if len(youtube_description(meta, cfg)) > 5000:
        errs.append("description + footer is over 5,000 characters")
    if len(",".join(str(x) for x in (meta.get("tags") or []))) > 450:
        errs.append("tags are over YouTube's ~500 character limit")
    return errs


def summary(text):
    print(text)
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write(text + "\n")
