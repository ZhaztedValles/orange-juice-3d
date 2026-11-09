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


def _story(vid, claim, topics):
    """one coded ledger entry (YAML text) for videos/<vid>"""
    lines = [f"- id: {vid}", f'  claim: "{claim}"', f"  topics: [{topics}]",
             "  sources: [https://example.org/a, https://example.com/b]",
             "  scores: {strange: 4, obscurity: 4, people: 3, visual: 4, provable: 4}",
             "  status: coded", '  reason: ""', f"  video: {vid}", '  date: "2026-11-10"']
    return "\n".join(lines) + "\n"


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
    meta = ('title: "A story"\ndescription: "A story."\ntags: []\n'
            'sources: [https://example.org/a, https://example.com/b]\n')      # a real video: no `template: true`
    for vid in ("001-queued-one", "002-held-one"):
        shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / vid)
        (repo / "videos" / vid / "meta.yml").write_text(meta, encoding="utf-8")
    (repo / "state" / "render").mkdir(parents=True)
    (repo / "state" / "render" / "001-queued-one.json").write_text('{"status": "queued"}')
    (repo / "state" / "render" / "002-held-one.json").write_text('{"status": "held"}')
    (repo / "stories").mkdir()
    (repo / "stories" / "ledger.yml").write_text(_story("002-held-one", "A sailor in Oslo painted a whale",
                                                         "oslo, whale"), encoding="utf-8")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "main")
    _git(repo, "checkout", "-q", "-b", "claude/oj-x")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "003-new-one")
    (repo / "videos" / "003-new-one" / "meta.yml").write_text(meta, encoding="utf-8")
    (repo / "stories" / "ledger.yml").write_text(
        _story("002-held-one", "A sailor in Oslo painted a whale", "oslo, whale")
        + _story("003-new-one", "A baker in Lisbon invented a clock", "lisbon, clock"), encoding="utf-8")
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
    assert accept_check.load_records(tmp_path) == [{"branch": "claude/oj-2026-11-09", "sha": "a" * 40, "attempts": 1,
                                                   "parked": True, "reason": "pytest"}]
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


# --- per-sha attempt counting: infrastructure failures count up, park after 5; content parks at once ---

def test_infra_failures_count_per_sha_and_park_after_five(tmp_path):
    b, a, c = "claude/oj-x", "a" * 40, "c" * 40
    recs = [accept_check.record_infra_failure(tmp_path, b, a) for _ in range(5)]
    assert [r["attempts"] for r in recs] == [1, 2, 3, 4, 5] and not any(r["parked"] for r in recs)
    assert accept_check.load_parked(tmp_path) == {}
    assert accept_check.next_attempt(tmp_path, b, a) == 6
    r = accept_check.record_infra_failure(tmp_path, b, a)
    assert r["attempts"] == 6 and r["parked"] and r["reason"] == "repeated infrastructure failures (check logs)"
    assert accept_check.load_parked(tmp_path) == {"oj-x": a}
    # a new push (new sha) starts again at 1, unparked
    r = accept_check.record_infra_failure(tmp_path, b, c)
    assert r["attempts"] == 1 and not r["parked"]
    assert accept_check.next_attempt(tmp_path, b, c) == 2
    assert accept_check.next_attempt(tmp_path, b, a) == 1
    assert accept_check.next_attempt(tmp_path, "claude/oj-new", a) == 1


def test_content_rejection_parks_at_once_and_keeps_the_count(tmp_path):
    b, a = "claude/oj-x", "a" * 40
    accept_check.record_infra_failure(tmp_path, b, a)
    r = accept_check.record_failure(tmp_path, b, a, "pytest")
    assert r["parked"] and r["attempts"] == 2 and r["reason"] == "pytest"
    assert accept_check.load_parked(tmp_path) == {"oj-x": a}


def test_unparked_record_does_not_block_find_pick(tmp_path):
    b = [{"name": "claude/oj-x", "sha": "a" * 40, "date": 1}]
    accept_check.record_infra_failure(tmp_path, "claude/oj-x", "a" * 40)
    assert accept_check.pick_branch(b, accept_check.load_parked(tmp_path), set())["name"] == "claude/oj-x"


def test_rejected_body_only_parked(tmp_path):
    accept_check.record_infra_failure(tmp_path, "claude/oj-infra", "a" * 40)
    accept_check.record_failure(tmp_path, "claude/oj-bad", "b" * 40, "tsc")
    body = accept_check.rejected_body(accept_check.parked_records(tmp_path))
    assert "claude/oj-bad" in body and "claude/oj-infra" not in body


def test_cli_record_infra_prints_the_record(tmp_path):
    subprocess.run(["git", "init", "-q", str(tmp_path)], check=True)
    cli = [sys.executable, str(ROOT / "tools" / "accept_check.py"), "--record-infra", "claude/oj-x", "a" * 40]
    import json
    r = subprocess.run(cli, cwd=tmp_path, capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert json.loads(r.stdout)["attempts"] == 1


# --- the story ledger is enforced: every non-template video needs a coded ledger entry; the story files must be valid ---

LEDGER_ENTRY = """- id: 001-new-one
  claim: "A baker in Lisbon invented a clock"
  topics: [lisbon, clock]
  sources: [https://example.org/a, https://example.com/b]
  scores: {strange: 4, obscurity: 4, people: 3, visual: 4, provable: 4}
  status: coded
  reason: ""
  video: 001-new-one
  date: "2026-11-10"
"""


def _ledger_repo(tmp_path, ledger_text=None, template=False):
    """a scratch repo: main has the template; the branch adds videos/001-new-one (copied from the template, made a real
    video unless template=True) and, when ledger_text is given, stories/ledger.yml. Returns (repo, cli)."""
    import shutil
    repo = tmp_path / "r"
    repo.mkdir(parents=True)
    _git(repo, "init", "-q", "-b", "main")
    _git(repo, "config", "user.email", "t@example.com")
    _git(repo, "config", "user.name", "t")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "000-bridge")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "main")
    _git(repo, "checkout", "-q", "-b", "claude/oj-x")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "001-new-one")
    if not template:
        (repo / "videos" / "001-new-one" / "meta.yml").write_text(
            'title: "Lisbon clock"\ndescription: "A story."\ntags: []\n'
            'sources: [https://example.org/a, https://example.com/b]\n', encoding="utf-8")
    if ledger_text is not None:
        (repo / "stories").mkdir()
        (repo / "stories" / "ledger.yml").write_text(ledger_text, encoding="utf-8")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "branch")
    return repo, [sys.executable, str(ROOT / "tools" / "accept_check.py"), "main", "HEAD"]


def test_new_video_without_a_ledger_entry_is_rejected(tmp_path):
    repo, cli = _ledger_repo(tmp_path)
    r = subprocess.run(cli, cwd=repo, capture_output=True, text=True)
    assert r.returncode == 1, r.stdout + r.stderr
    assert "001-new-one" in r.stdout and "ledger" in r.stdout


def test_new_video_with_its_ledger_entry_is_accepted(tmp_path):
    repo, cli = _ledger_repo(tmp_path, LEDGER_ENTRY)
    r = subprocess.run(cli, cwd=repo, capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr
    assert r.stdout.startswith("accepted")



def test_malformed_ledger_is_rejected(tmp_path):
    for text in ("- [unclosed", "just: a mapping", LEDGER_ENTRY.replace("sources: [https://example.org/a, "
                                                                        "https://example.com/b]", "sources: []")):
        repo, cli = _ledger_repo(tmp_path / str(abs(hash(text))), text)
        r = subprocess.run(cli, cwd=repo, capture_output=True, text=True)
        assert r.returncode == 1 and "stories:" in r.stdout, r.stdout + r.stderr


def test_ledger_entry_for_another_video_does_not_count(tmp_path):
    repo, cli = _ledger_repo(tmp_path, LEDGER_ENTRY.replace("video: 001-new-one", "video: 002-other"))
    r = subprocess.run(cli, cwd=repo, capture_output=True, text=True)
    assert r.returncode == 1 and "001-new-one" in r.stdout


# --- the story rules are enforced against main's copies, not just the schema ---

OLD_ENTRY = """- id: idea-old
  claim: "A sailor in Oslo painted a whale"
  topics: [oslo, whale]
  sources: [https://example.org/a, https://example.com/b]
  scores: {strange: 4, obscurity: 4, people: 3, visual: 4, provable: 4}
  status: idea
  reason: ""
  video: ""
  date: "2026-11-01"
"""
OLD_BANNED = '- {claim: "A cat painted a ship", keywords: [cat, ship]}\n'


def _story_repo(tmp_path, base_ledger, base_banned, branch_ledger, branch_banned=None):
    """a scratch repo whose main has the template plus the given story files and whose branch adds the real video
    videos/001-new-one and replaces the story files. Returns (repo, cli)."""
    import shutil
    repo = tmp_path / "r"
    repo.mkdir(parents=True)
    _git(repo, "init", "-q", "-b", "main")
    _git(repo, "config", "user.email", "t@example.com")
    _git(repo, "config", "user.name", "t")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "000-bridge")
    (repo / "stories").mkdir()
    (repo / "stories" / "ledger.yml").write_text(base_ledger, encoding="utf-8")
    (repo / "stories" / "banned.yml").write_text(base_banned, encoding="utf-8")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "main")
    _git(repo, "checkout", "-q", "-b", "claude/oj-x")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "001-new-one")
    (repo / "videos" / "001-new-one" / "meta.yml").write_text(
        'title: "Lisbon clock"\ndescription: "A story."\ntags: []\n'
        'sources: [https://example.org/a, https://example.com/b]\n', encoding="utf-8")
    (repo / "stories" / "ledger.yml").write_text(branch_ledger, encoding="utf-8")
    if branch_banned is not None:
        (repo / "stories" / "banned.yml").write_text(branch_banned, encoding="utf-8")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "branch")
    return repo, [sys.executable, str(ROOT / "tools" / "accept_check.py"), "main", "HEAD"]


def _run(repo, cli):
    return subprocess.run(cli, cwd=repo, capture_output=True, text=True)


def test_appending_to_the_ledger_is_accepted(tmp_path):
    repo, cli = _story_repo(tmp_path, OLD_ENTRY, OLD_BANNED, OLD_ENTRY + LEDGER_ENTRY)
    r = _run(repo, cli)
    assert r.returncode == 0, r.stdout + r.stderr


def test_editing_or_deleting_an_old_ledger_entry_is_rejected(tmp_path):
    repo, cli = _story_repo(tmp_path / "a", OLD_ENTRY, OLD_BANNED,
                            OLD_ENTRY.replace("painted a whale", "painted a dolphin") + LEDGER_ENTRY)
    r = _run(repo, cli)
    assert r.returncode == 1 and "stories:" in r.stdout and "idea-old" in r.stdout and "edited" in r.stdout, r.stdout
    repo, cli = _story_repo(tmp_path / "b", OLD_ENTRY, OLD_BANNED, LEDGER_ENTRY)
    r = _run(repo, cli)
    assert r.returncode == 1 and "deleted" in r.stdout, r.stdout


def test_trimming_the_banned_list_is_rejected(tmp_path):
    repo, cli = _story_repo(tmp_path, OLD_ENTRY, OLD_BANNED, OLD_ENTRY + LEDGER_ENTRY, branch_banned="[]\n")
    r = _run(repo, cli)
    assert r.returncode == 1 and "stories:" in r.stdout and "A cat painted a ship" in r.stdout, r.stdout


def test_new_entry_repeating_main_or_banned_is_rejected(tmp_path):
    repeat = LEDGER_ENTRY.replace("A baker in Lisbon invented a clock", "A sailor in Oslo painted a whale")
    repo, cli = _story_repo(tmp_path / "a", OLD_ENTRY, OLD_BANNED, OLD_ENTRY + repeat)
    r = _run(repo, cli)
    assert r.returncode == 1 and "same story as 'idea-old'" in r.stdout, r.stdout
    banned = LEDGER_ENTRY.replace("A baker in Lisbon invented a clock", "A cat painted a ship")
    repo, cli = _story_repo(tmp_path / "b", OLD_ENTRY, OLD_BANNED, OLD_ENTRY + banned)
    r = _run(repo, cli)
    assert r.returncode == 1 and "banned:" in r.stdout, r.stdout


def test_idea_becoming_coded_is_accepted_and_checked(tmp_path):
    coded = OLD_ENTRY.replace("status: idea", "status: coded").replace('video: ""', "video: 001-new-one")
    repo, cli = _story_repo(tmp_path / "a", OLD_ENTRY, OLD_BANNED, coded)
    r = _run(repo, cli)
    assert r.returncode == 0, r.stdout + r.stderr
    # coded back to idea is not a transition the writer may make
    repo, cli = _story_repo(tmp_path / "b", coded, OLD_BANNED, OLD_ENTRY)
    r = _run(repo, cli)
    assert r.returncode == 1 and "'coded' -> 'idea'" in r.stdout, r.stdout


def test_unparseable_source_url_is_a_rejection_not_a_traceback(tmp_path):
    bad = LEDGER_ENTRY.replace("https://example.com/b", '"http://[bad"')
    repo, cli = _story_repo(tmp_path, OLD_ENTRY, OLD_BANNED, OLD_ENTRY + bad)
    r = _run(repo, cli)
    assert r.returncode == 1 and "http(s) URLs" in r.stdout and "Traceback" not in r.stderr, r.stdout + r.stderr


def test_unexpected_failure_in_the_story_check_is_a_rejection(tmp_path):
    class Boom:
        @staticmethod
        def load(repo):
            raise RuntimeError("boom\n::error::x")
    out = accept_check.story_problems("main", tmp_path, [("M", "stories/ledger.yml")], [], Boom)
    assert len(out) == 1 and out[0].startswith("stories: cannot check the story files (") and "\n" not in out[0]


def test_unreadable_base_story_file_is_a_rejection(tmp_path):
    repo, cli = _story_repo(tmp_path, "- [unclosed\n", OLD_BANNED, OLD_ENTRY + LEDGER_ENTRY)
    r = _run(repo, cli)
    assert r.returncode == 1 and "stories:" in r.stdout and "Traceback" not in r.stderr, r.stdout + r.stderr


def test_only_the_bridge_is_exempt_from_the_ledger_not_any_template(tmp_path):
    """a writer's own folder marked `template: true` still needs its ledger entry"""
    repo, cli = _ledger_repo(tmp_path, template=True)
    # _ledger_repo(template=True) copies the template, so videos/001-new-one has `template: true` and no entry
    r = _run(repo, cli)
    assert r.returncode == 1 and "001-new-one" in r.stdout and "ledger" in r.stdout, r.stdout + r.stderr
    # while the real template id stays exempt
    assert accept_check.TEMPLATE == "000-bridge"


# --- a night that drops a held video: the folder is deleted, its entry becomes dropped, a new video is added ---

REAL_META = ('title: "A story"\ndescription: "A story."\ntags: []\n'
             'sources: [https://example.org/a, https://example.com/b]\n')


def _drop_repo(tmp_path, delete="001-held-one", drop=True, delete_files_only=False):
    """main: the template, a held 001-held-one and a queued 002-queued-one (each with a coded entry, state/render).
    The branch deletes videos/<delete>, marks that entry dropped when `drop`, and adds the coded 003-new-one."""
    import shutil
    repo = tmp_path / "r"
    repo.mkdir(parents=True)
    _git(repo, "init", "-q", "-b", "main")
    _git(repo, "config", "user.email", "t@example.com")
    _git(repo, "config", "user.name", "t")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "000-bridge")
    for vid in ("001-held-one", "002-queued-one"):
        shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / vid)
        (repo / "videos" / vid / "meta.yml").write_text(REAL_META, encoding="utf-8")
    (repo / "state" / "render").mkdir(parents=True)
    (repo / "state" / "render" / "001-held-one.json").write_text('{"status": "held", "attempts": 2}')
    (repo / "state" / "render" / "002-queued-one.json").write_text('{"status": "queued"}')
    held = _story("001-held-one", "A sailor in Oslo painted a whale", "oslo, whale")
    queued = _story("002-queued-one", "A monk in Kyoto tuned a bell", "kyoto, bell")
    (repo / "stories").mkdir()
    (repo / "stories" / "ledger.yml").write_text(held + queued, encoding="utf-8")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "main")
    _git(repo, "checkout", "-q", "-b", "claude/oj-x")
    _git(repo, "rm", "-r", "-q", f"videos/{delete}")
    shutil.copytree(ROOT / "videos" / "000-bridge", repo / "videos" / "003-new-one")
    (repo / "videos" / "003-new-one" / "meta.yml").write_text(REAL_META, encoding="utf-8")
    dropped = lambda e: e.replace("status: coded", "status: dropped").replace(
        '  reason: ""', '  reason: "failed the render twice"').replace(
        f"  video: {delete}", '  video: ""')
    if drop:
        held, queued = (dropped(held), queued) if delete == "001-held-one" else (held, dropped(queued))
    (repo / "stories" / "ledger.yml").write_text(held + queued + _story(
        "003-new-one", "A baker in Lisbon invented a clock", "lisbon, clock"), encoding="utf-8")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "branch")
    return repo, [sys.executable, str(ROOT / "tools" / "accept_check.py"), "main", "HEAD"]


def test_dropping_a_held_video_is_accepted(tmp_path):
    repo, cli = _drop_repo(tmp_path)
    out = tmp_path / "v.txt"
    r = _run(repo, cli + ["--videos-out", str(out)])
    assert r.returncode == 0, r.stdout + r.stderr
    assert r.stdout.startswith("accepted") and "001-held-one" in r.stdout and "003-new-one" in r.stdout
    assert out.read_text().split() == ["003-new-one", "2025"]       # nothing to render for the dropped folder
    assert _run(repo, cli[:-2] + ["--paths-only", "main", "HEAD"]).returncode == 0


def test_deleting_a_held_video_without_dropping_its_entry_is_rejected(tmp_path):
    repo, cli = _drop_repo(tmp_path, drop=False)
    r = _run(repo, cli)
    assert r.returncode == 1 and "videos/001-held-one: only a held video whose ledger entry is dropped may be deleted" \
        in r.stdout, r.stdout + r.stderr


def test_deleting_a_video_that_is_not_held_is_rejected(tmp_path):
    for drop in (True, False):
        repo, cli = _drop_repo(tmp_path / str(drop), delete="002-queued-one", drop=drop)
        r = _run(repo, cli)
        assert r.returncode == 1 and "videos/002-queued-one: only a held video" in r.stdout, r.stdout + r.stderr


def test_deleting_the_template_is_rejected(tmp_path):
    repo, cli = _drop_repo(tmp_path)
    _git(repo, "rm", "-r", "-q", "videos/000-bridge")
    _git(repo, "commit", "-q", "-m", "more")
    r = _run(repo, cli)
    assert r.returncode == 1 and "000-bridge" in r.stdout


def test_held_ids_ignores_ids_whose_folder_is_gone():
    states = {"001-gone": {"status": "held"}, "002-here": {"status": "held"}}
    assert accept_check.held_ids(states, posted=set(), existing={"000-bridge", "002-here"}) == {"002-here"}
    assert accept_check.held_ids(states, posted=set()) == {"001-gone", "002-here"}


# --- `template: true` belongs to 000-bridge alone ---

def test_copy_that_keeps_template_true_is_rejected(tmp_path):
    repo, cli = _ledger_repo(tmp_path, LEDGER_ENTRY)
    meta = repo / "videos" / "001-new-one" / "meta.yml"
    meta.write_text(meta.read_text(encoding="utf-8") + "template: true\n", encoding="utf-8")
    _git(repo, "commit", "-qam", "keep the flag")
    r = _run(repo, cli)
    assert r.returncode == 1, r.stdout + r.stderr
    assert "videos/001-new-one" in r.stdout and "template" in r.stdout and "sources" in r.stdout


def test_straight_copy_of_the_bridge_is_rejected(tmp_path):
    """the review's repro: a verbatim copy (template: true kept) with a valid ledger entry"""
    repo, cli = _ledger_repo(tmp_path, LEDGER_ENTRY, template=True)
    r = _run(repo, cli)
    assert r.returncode == 1 and "template: true" in r.stdout, r.stdout + r.stderr
