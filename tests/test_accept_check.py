import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import accept_check  # noqa: E402

MAIN = {"000-bridge", "001-old-one", "004-queued-one", "005-held-one"}
HELD = {"005-held-one"}


def probs(*changed, held=HELD, main=MAIN):
    return accept_check.path_problems(list(changed), held, main)


def test_new_folder_accepted():
    assert probs(("A", "videos/006-new-story/Video.tsx"), ("A", "videos/006-new-story/meta.yml"),
                 ("A", "videos/006-new-story/voice.wav"), ("A", "videos/006-new-story/cast.ts")) == []


def test_change_to_queued_folder_rejected():
    assert probs(("M", "videos/004-queued-one/Video.tsx"))


def test_change_to_held_folder_accepted():
    assert probs(("M", "videos/005-held-one/Video.tsx"), ("A", "videos/005-held-one/extra.ts")) == []


def test_template_rejected():
    assert probs(("M", "videos/000-bridge/Video.tsx"))
    assert probs(("M", "videos/000-bridge/Video.tsx"), held=HELD | {"000-bridge"})     # even if it were held


@pytest.mark.parametrize("path", ["src/engine/ink.ts", ".github/workflows/x.yml", "tests/test_x.py", "config.yml",
                                  "videos/006-new-story/sub/dir.ts", "videos/006-new-story/evil.sh",
                                  "tools/accept_check.py", "scripts/gen-registry.mjs", "conftest.py", "package.json",
                                  "stories/other.yml", "state/render/005-held-one.json", "videos/README.md",
                                  '"videos/006-new-story/odd\\tname.ts"', "videos/006-new-story/Vidéo.tsx",
                                  "videos/6-x/Video.tsx", "videos/006-New/Video.tsx"])
def test_paths_outside_the_allowed_shapes_rejected(path):
    assert probs(("A", path))
    assert probs(("M", path))


def test_engine_file_rejected():
    assert any("src/engine/ink.ts" in p for p in probs(("M", "src/engine/ink.ts")))


def test_workflow_rejected():
    assert probs(("M", ".github/workflows/x.yml"))


def test_tests_rejected():
    assert probs(("A", "tests/test_x.py"))


def test_config_rejected():
    assert probs(("M", "config.yml"))


def test_subfolder_rejected():
    assert probs(("A", "videos/001-ok/sub/dir.ts"), main={"000-bridge"})


def test_shell_script_rejected():
    assert probs(("A", "videos/001-ok/evil.sh"), main={"000-bridge"})


def test_new_id_lower_than_mains_highest_rejected():
    assert any("003-late-one" in p for p in probs(("A", "videos/003-late-one/Video.tsx")))
    assert probs(("A", "videos/005-other-slug/Video.tsx"))          # same number as an existing folder
    assert probs(("A", "videos/009-gap-is-fine/Video.tsx")) == []


def test_new_id_must_beat_templates_too():
    assert probs(("A", "videos/000-another/Video.tsx"), main={"000-bridge"})


def test_stories_accepted():
    assert probs(("M", "stories/ledger.yml"), ("A", "stories/banned.yml")) == []


def test_stories_delete_rejected():
    assert probs(("D", "stories/ledger.yml"))


def test_posted_folder_rejected():
    held = accept_check.held_ids({"005-held-one": {"status": "held"}, "004-queued-one": {"status": "queued"}},
                                 posted={"005-held-one"})
    assert held == set()
    assert probs(("M", "videos/005-held-one/Video.tsx"), held=held)


def test_held_ids_only_status_held():
    assert accept_check.held_ids({"005-held-one": {"status": "held"}, "004-queued-one": {"status": "queued"},
                                  "001-old-one": {}}, posted=set()) == {"005-held-one"}


def test_delete_inside_new_folder_allowed():
    assert probs(("A", "videos/006-new-story/Video.tsx"), ("D", "videos/006-new-story/old.ts")) == []


def test_delete_inside_held_folder_allowed():
    assert probs(("D", "videos/005-held-one/cast.ts")) == []


def test_delete_inside_queued_folder_rejected():
    assert probs(("D", "videos/004-queued-one/cast.ts"))


def test_unknown_status_rejected():
    assert probs(("C", "videos/006-new-story/Video.tsx"))
    assert probs(("T", "videos/006-new-story/Video.tsx"))


def test_touched_videos():
    assert accept_check.touched_videos([("A", "videos/006-new-story/Video.tsx"), ("M", "videos/005-held-one/a.ts"),
                                        ("M", "stories/ledger.yml")]) == ["005-held-one", "006-new-story"]


@pytest.mark.parametrize("ref,ok", [("claude/oj-2026-11-09", True), ("claude/oj-test-accept", True),
                                    ("claude/oj-", False), ("claude/routine-x", False), ("main", False),
                                    ("claude/oj-a b", False), ("claude/oj-$(id)", False), ("claude/oj-x;rm", False),
                                    ("claude/oj-x/y", False), ("claude/oj-x\n", False)])
def test_branch_name(ref, ok):
    assert accept_check.branch_ok(ref) is ok


def test_cli_branch_name_exit_codes():
    cmd = [sys.executable, str(ROOT / "tools" / "accept_check.py"), "--branch"]
    assert subprocess.run(cmd + ["claude/oj-2026-11-09"], capture_output=True).returncode == 0
    assert subprocess.run(cmd + ["claude/oj-$(id)"], capture_output=True).returncode == 1


def _git(cwd, *args):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout


def test_cli_on_a_repo(tmp_path):
    """end to end on a scratch repo: main has the template, a queued and a held video; the branch adds a new folder
    (copied from the template, so it passes video_check), edits the held one's SCRIPT.md and the queued one"""
    import shutil
    repo = tmp_path / "r"
    repo.mkdir()
    _git(repo, "init", "-q", "-b", "main")
    _git(repo, "config", "user.email", "t@example.com")
    _git(repo, "config", "user.name", "t")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "000-bridge")
    for vid in ("001-queued-one", "002-held-one"):
        shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / vid)
    (repo / "state" / "render").mkdir(parents=True)
    (repo / "state" / "render" / "001-queued-one.json").write_text('{"status": "queued"}')
    (repo / "state" / "render" / "002-held-one.json").write_text('{"status": "held"}')
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "main")
    _git(repo, "checkout", "-q", "-b", "claude/oj-x")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "003-new-one")
    with open(repo / "videos" / "002-held-one" / "SCRIPT.md", "a", encoding="utf-8") as f:
        f.write("\n")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "good")
    cli = [sys.executable, str(ROOT / "tools" / "accept_check.py")]
    r = subprocess.run(cli + ["main", "HEAD", "--videos-out", str(tmp_path / "v.txt")], cwd=repo, capture_output=True,
                       text=True)
    assert r.returncode == 0, r.stdout + r.stderr
    assert r.stdout.startswith("accepted")
    assert (tmp_path / "v.txt").read_text().split() == ["002-held-one", "2025", "003-new-one", "2025"]
    with open(repo / "videos" / "001-queued-one" / "SCRIPT.md", "a", encoding="utf-8") as f:
        f.write("\n")
    (repo / "videos" / "003-new-one" / "evil.sh").write_text("echo")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "bad")
    r = subprocess.run(cli + ["main", "HEAD"], cwd=repo, capture_output=True, text=True)
    assert r.returncode == 1
    assert "001-queued-one" in r.stdout and "evil.sh" in r.stdout
    r = subprocess.run(cli + ["--paths-only", "main", "HEAD"], cwd=repo, capture_output=True, text=True)
    assert r.returncode == 1 and "001-queued-one" in r.stdout


# --- scheduled Accept: branch discovery, workflow tripwire, failure records, -z parsing ---

def test_parse_name_status_z():
    assert accept_check.parse_name_status_z("M\0a b.ts\0A\0x\ty\0D\0videos/001-x/é.ts\0") == \
        [("M", "a b.ts"), ("A", "x\ty"), ("D", "videos/001-x/é.ts")]
    assert accept_check.parse_name_status_z("") == []
    with pytest.raises(ValueError):
        accept_check.parse_name_status_z("M\0a\0A\0")


def test_parsed_odd_names_still_rejected():
    changed = accept_check.parse_name_status_z("A\0videos/006-new-story/x\ty.ts\0A\0videos/006-new-story/é.ts\0")
    assert len(probs(*changed)) == 2


def test_workflow_paths():
    changed = [("A", ".github/workflows/x.yml"), ("M", "videos/006-new-story/Video.tsx"), ("D", ".github/CODEOWNERS"),
               ("A", ".GitHub/workflows/y.yml"), ("A", ".github"), ("M", "stories/ledger.yml"), ("A", "x/.github/z")]
    assert accept_check.workflow_paths(changed) == [".github/workflows/x.yml", ".github/CODEOWNERS",
                                                    ".GitHub/workflows/y.yml", ".github"]
    assert accept_check.workflow_paths([("A", "videos/006-new-story/Video.tsx")]) == []


B = [{"name": "claude/oj-2026-11-11", "sha": "c" * 40, "date": 300},
     {"name": "claude/oj-2026-11-09", "sha": "a" * 40, "date": 100},
     {"name": "claude/oj-2026-11-10", "sha": "b" * 40, "date": 200}]


def test_pick_oldest_first():
    assert accept_check.pick_branch(B, failed={}, tripped=set())["name"] == "claude/oj-2026-11-09"
    assert accept_check.pick_branch([], failed={}, tripped=set()) is None


def test_pick_skips_tripped_and_failed_at_same_sha():
    assert accept_check.pick_branch(B, failed={}, tripped={"claude/oj-2026-11-09"})["name"] == "claude/oj-2026-11-10"
    failed = {"oj-2026-11-09": "a" * 40, "oj-2026-11-10": "0" * 40}       # 11-10 was pushed again since its failure
    assert accept_check.pick_branch(B, failed=failed, tripped=set())["name"] == "claude/oj-2026-11-10"


def test_pick_only_retries_a_failed_branch_but_never_a_tripped_one():
    failed = {"oj-2026-11-09": "a" * 40}
    assert accept_check.pick_branch(B, failed, set(), only="claude/oj-2026-11-09")["name"] == "claude/oj-2026-11-09"
    assert accept_check.pick_branch(B, failed, {"claude/oj-2026-11-09"}, only="claude/oj-2026-11-09") is None
    assert accept_check.pick_branch(B, failed, set(), only="claude/oj-nope") is None


def test_pick_ignores_bad_names():
    assert accept_check.pick_branch([{"name": "claude/oj-$(id)", "sha": "d" * 40, "date": 1}], {}, set()) is None


def test_tripwire_body_names_branches_and_paths():
    body = accept_check.tripwire_body([{"branch": "claude/oj-x", "sha": "a" * 40, "paths": [".github/workflows/e.yml"]}])
    assert "claude/oj-x" in body and '".github/workflows/e.yml"' in body and "a" * 40 in body


def _outside_fences(body):
    out, fenced = [], False
    for ln in body.split("\n"):
        if ln.startswith("```"):
            fenced = not fenced
        elif not fenced:
            out.append(ln)
    assert not fenced, "unbalanced fence"
    return "\n".join(out)


def test_tripwire_body_escapes_hostile_paths():
    evil = ".github/x\n```\n@someone `hi` <b>"
    body = accept_check.tripwire_body([{"branch": "claude/oj-x", "sha": "a" * 40, "paths": [evil]}])
    assert "@someone" not in _outside_fences(body)
    assert body.count("```") % 2 == 0 and "`hi`" not in body
    assert "\\n" in body                   # the newline is a JSON escape, not a line break
    assert len([ln for ln in body.split("\n") if "@someone" in ln]) == 1


def test_rejected_body_lists_records_in_a_fence():
    body = accept_check.rejected_body([{"branch": "claude/oj-x", "sha": "a" * 40, "reason": "pytest @x"}])
    assert "claude/oj-x" in body and "a" * 40 in body
    assert "@x" not in _outside_fences(body)
    assert accept_check.rejected_body([]) == ""


def test_log_paths_z():
    assert accept_check.log_paths_z("\n.github/workflows/e.yml\0\0\n.github/workflows/e.yml\0a b\0") == \
        [".github/workflows/e.yml", "a b"]
    assert accept_check.log_paths_z("") == []


def test_stale_records():
    assert accept_check.stale_records({"oj-a": "1", "oj-b": "2"}, {"claude/oj-a", "claude/oj-c"}) == ["oj-b"]


def test_record_failure_roundtrip(tmp_path):
    accept_check.record_failure(tmp_path, "claude/oj-2026-11-09", "a" * 40, "pytest")
    assert accept_check.load_failures(tmp_path) == {"oj-2026-11-09": "a" * 40}
    assert accept_check.load_records(tmp_path) == [{"branch": "claude/oj-2026-11-09", "sha": "a" * 40, "reason": "pytest"}]
    with pytest.raises(ValueError):
        accept_check.record_failure(tmp_path, "claude/../x", "a" * 40)


def test_cli_find(tmp_path):
    """a bare origin with main and three writer branches: one touches .github (tripwire), one failed at its current sha"""
    origin, ws = tmp_path / "origin.git", tmp_path / "ws"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(origin)], check=True)
    subprocess.run(["git", "clone", "-q", str(origin), str(ws)], check=True, capture_output=True)
    _git(ws, "config", "user.email", "t@example.com")
    _git(ws, "config", "user.name", "t")
    _git(ws, "checkout", "-q", "-b", "main")
    (ws / "README.md").write_text("x")
    _git(ws, "add", "-A")
    _git(ws, "commit", "-q", "-m", "main")
    _git(ws, "push", "-q", "origin", "main")

    def branch(name, path, when):
        _git(ws, "checkout", "-q", "-b", name, "main")
        p = ws / path
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text("x")
        _git(ws, "add", "-A")
        subprocess.run(["git", "commit", "-q", "-m", name], cwd=ws, check=True,
                       env={**__import__("os").environ, "GIT_COMMITTER_DATE": f"{1700000000 + when} +0000",
                            "GIT_AUTHOR_DATE": f"{1700000000 + when} +0000"})
        _git(ws, "push", "-q", "origin", name)
        _git(ws, "checkout", "-q", "main")
        return _git(ws, "rev-parse", name).strip()

    evil = branch("claude/oj-evil", ".github/workflows/e.yml", 1000)
    # add-then-remove: the branch's diff vs main is clean, but one of its commits touched .github/
    branch("claude/oj-sneaky", ".github/workflows/s.yml", 1500)
    _git(ws, "checkout", "-q", "claude/oj-sneaky")
    _git(ws, "rm", "-q", ".github/workflows/s.yml")
    (ws / "stories").mkdir(exist_ok=True)
    (ws / "stories" / "ledger.yml").write_text("y")
    _git(ws, "add", "-A")
    _git(ws, "commit", "-q", "-m", "hide")
    _git(ws, "push", "-q", "origin", "claude/oj-sneaky")
    sneaky = _git(ws, "rev-parse", "HEAD").strip()
    _git(ws, "checkout", "-q", "main")
    # evil merge: the merge commit itself adds a workflow (in neither parent), a later commit removes it
    _git(ws, "checkout", "-q", "-b", "side", "main")
    (ws / "stories").mkdir(exist_ok=True)
    (ws / "stories" / "ledger.yml").write_text("side")
    _git(ws, "add", "-A")
    _git(ws, "commit", "-q", "-m", "side")
    _git(ws, "checkout", "-q", "-b", "claude/oj-merge", "main")
    (ws / "stories").mkdir(exist_ok=True)
    (ws / "stories" / "banned.yml").write_text("m")
    _git(ws, "add", "-A")
    _git(ws, "commit", "-q", "-m", "m")
    _git(ws, "merge", "-q", "--no-commit", "--no-ff", "side")
    (ws / ".github" / "workflows").mkdir(parents=True, exist_ok=True)
    (ws / ".github" / "workflows" / "m.yml").write_text("x")
    _git(ws, "add", "-A")
    _git(ws, "commit", "-q", "-m", "evil merge")
    _git(ws, "rm", "-q", ".github/workflows/m.yml")
    _git(ws, "commit", "-q", "-m", "hide")
    _git(ws, "push", "-q", "origin", "claude/oj-merge")
    merged = _git(ws, "rev-parse", "HEAD").strip()
    # no common history with main
    _git(ws, "checkout", "-q", "--orphan", "claude/oj-orphan")
    _git(ws, "rm", "-rq", "--cached", ".")
    (ws / "stories" / "ledger.yml").write_text("o")
    _git(ws, "add", "stories/ledger.yml")
    _git(ws, "commit", "-q", "-m", "orphan")
    _git(ws, "push", "-q", "origin", "claude/oj-orphan")
    orphan = _git(ws, "rev-parse", "HEAD").strip()
    _git(ws, "checkout", "-q", "-f", "main")
    _git(ws, "clean", "-qfd")
    failed = branch("claude/oj-failed", "stories/ledger.yml", 2000)
    branch("claude/oj-good", "stories/banned.yml", 3000)
    branch("feature/other", "stories/banned.yml", 500)
    (ws / "state" / "accept").mkdir(parents=True)
    accept_check.record_failure(ws / "state", "claude/oj-failed", failed)
    cli = [sys.executable, str(ROOT / "tools" / "accept_check.py"), "--find"]
    r = subprocess.run(cli + ["--tripwire-out", str(tmp_path / "trip.md")], cwd=ws, capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert "claude/oj-evil" in (tmp_path / "trip.md").read_text(encoding="utf-8")
    import json
    out = json.loads(r.stdout)
    assert out["branch"] == "claude/oj-good" and len(out["sha"]) == 40 and out["slug"] == "oj-good"
    assert out["tripped"] == [{"branch": "claude/oj-evil", "sha": evil, "paths": [".github/workflows/e.yml"]},
                              {"branch": "claude/oj-merge", "sha": merged, "paths": [".github/workflows/m.yml"]},
                              {"branch": "claude/oj-orphan", "sha": orphan, "paths": ["no common history with main"]},
                              {"branch": "claude/oj-sneaky", "sha": sneaky, "paths": [".github/workflows/s.yml"]}]
    r = subprocess.run(cli + ["--only", "claude/oj-failed"], cwd=ws, capture_output=True, text=True)
    assert json.loads(r.stdout)["branch"] == "claude/oj-failed"
    r = subprocess.run(cli + ["--only", "claude/oj-evil"], cwd=ws, capture_output=True, text=True)
    assert json.loads(r.stdout)["branch"] == ""
    # the CLI records a failure in the repo's state/: the good branch is then skipped too, until it changes
    rec = [sys.executable, str(ROOT / "tools" / "accept_check.py"), "--record-failure", "claude/oj-good", out["sha"], "tsc"]
    assert subprocess.run(rec, cwd=ws, capture_output=True).returncode == 0
    assert json.loads(subprocess.run(cli, cwd=ws, capture_output=True, text=True).stdout)["branch"] == ""


def test_cli_prune_and_rejected_body(tmp_path):
    origin, ws = tmp_path / "origin.git", tmp_path / "ws"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(origin)], check=True)
    subprocess.run(["git", "clone", "-q", str(origin), str(ws)], check=True, capture_output=True)
    _git(ws, "config", "user.email", "t@example.com")
    _git(ws, "config", "user.name", "t")
    _git(ws, "checkout", "-q", "-b", "main")
    (ws / "README.md").write_text("x")
    _git(ws, "add", "-A")
    _git(ws, "commit", "-q", "-m", "main")
    _git(ws, "push", "-q", "origin", "main", "main:refs/heads/claude/oj-live")
    accept_check.record_failure(ws / "state", "claude/oj-live", "a" * 40, "pytest")
    accept_check.record_failure(ws / "state", "claude/oj-gone", "b" * 40, "tsc")
    cli = [sys.executable, str(ROOT / "tools" / "accept_check.py")]
    r = subprocess.run(cli + ["--prune-failures", "--rejected-out", str(tmp_path / "rej.md")], cwd=ws,
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert sorted(p.name for p in (ws / "state" / "accept").iterdir()) == ["oj-live.json"]
    body = (tmp_path / "rej.md").read_text(encoding="utf-8")
    assert "claude/oj-live" in body and "claude/oj-gone" not in body
