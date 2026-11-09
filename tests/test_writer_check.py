import json
import shutil
import sys
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import writer_check  # noqa: E402

VID = "001-test-story"
SOURCES = ["https://a.example/x", "https://b.example/y"]


def words(n, per_word):
    return [{"w": f"w{i}", "s": round(i * per_word, 4), "e": round((i + 1) * per_word, 4)} for i in range(n)]


def entry(vid):
    return {"id": vid, "claim": "A strange true thing happened.", "topics": ["strange"],
            "sources": SOURCES, "scores": {"strange": 5, "obscurity": 5, "people": 5, "visual": 5, "provable": 5},
            "status": "coded", "reason": "", "video": vid, "date": "2026-11-09"}


@pytest.fixture
def folder(tmp_path):
    """tmp_path is a repo: videos/001-test-story (a copy of the template, made real) and stories/ with its entry"""
    v = tmp_path / "videos" / VID
    shutil.copytree(ROOT / "videos" / "000-bridge", v)
    meta = yaml.safe_load((v / "meta.yml").read_text(encoding="utf-8"))
    meta.update(template=False, sources=SOURCES)
    (v / "meta.yml").write_text(yaml.safe_dump(meta), encoding="utf-8")
    (tmp_path / "stories").mkdir()
    (tmp_path / "stories" / "ledger.yml").write_text(yaml.safe_dump([entry(VID)]), encoding="utf-8")
    return v


def test_words_per_second():
    assert writer_check.words_per_second(words(37, 0.25)) == pytest.approx(4.0)
    assert writer_check.words_per_second([{"w": "a", "s": 1.0, "e": 1.5}, {"w": "b", "s": 1.5, "e": 3.0}]) == pytest.approx(1.0)
    assert writer_check.words_per_second([]) == 0.0


def test_clean_folder_is_ready(folder, capsys):
    assert writer_check.check(folder) == []
    assert writer_check.main([str(folder)]) == 0
    assert capsys.readouterr().out.strip() == f"ready {VID}"


def retime(folder, factor):
    """stretch every word's times by `factor` (the pace changes; the words do not)"""
    w = json.loads((folder / "words.json").read_text())
    for x in w:
        x["s"], x["e"] = round(x["s"] * factor, 4), round(x["e"] * factor, 4)
    (folder / "words.json").write_text(json.dumps(w))


def pace_problems(folder):
    return [p for p in writer_check.check(folder) if "narration pace" in p]


def test_pace_too_slow(folder):
    retime(folder, 1.1)      # the template runs at 3.41 w/s; slowed it is about 3.1
    (p,) = pace_problems(folder)
    assert "w/s, aim for about 3.4" in p and "3.1" in p


def test_pace_too_fast(folder):
    retime(folder, 0.8)      # about 4.26 w/s
    (p,) = pace_problems(folder)
    assert "4.2" in p


def test_pace_in_range_passes(folder):
    retime(folder, 0.95)     # about 3.59 w/s
    assert pace_problems(folder) == []


def test_clean_folder_has_the_pivot(folder):
    assert "You see," in (folder / "SCRIPT.md").read_text(encoding="utf-8")
    assert not any("pivot" in p for p in writer_check.check(folder))


def test_missing_you_see_pivot(folder):
    s = folder / "SCRIPT.md"
    s.write_text(s.read_text(encoding="utf-8").replace("You see,", "You see"), encoding="utf-8")
    assert any('"You see,"' in p and "pivot" in p for p in writer_check.check(folder))


def test_lowercase_you_see_is_not_the_pivot(folder):
    s = folder / "SCRIPT.md"
    s.write_text(s.read_text(encoding="utf-8").replace("You see,", "you see,"), encoding="utf-8")
    assert any('"You see,"' in p for p in writer_check.check(folder))


def test_missing_ledger_entry(folder, tmp_path):
    (tmp_path / "stories" / "ledger.yml").write_text("[]\n", encoding="utf-8")
    assert any("no coded entry" in p and VID in p for p in writer_check.check(folder))


def test_template_is_exempt_from_the_ledger(tmp_path):
    v = tmp_path / "videos" / "000-bridge"
    shutil.copytree(ROOT / "videos" / "000-bridge", v)
    (tmp_path / "stories").mkdir()
    (tmp_path / "stories" / "ledger.yml").write_text("[]\n", encoding="utf-8")
    assert not any("ledger" in p for p in writer_check.check(v))


def test_video_check_problems_pass_through(folder, capsys):
    (folder / "shots.json").unlink()
    ps = writer_check.check(folder)
    assert any("shots.json" in p and "missing" in p for p in ps)
    assert writer_check.main([str(folder)]) == 1
    assert "shots.json" in capsys.readouterr().out


def test_unreadable_ledger_is_a_problem(folder, tmp_path):
    (tmp_path / "stories" / "ledger.yml").write_text("a: b\n", encoding="utf-8")
    assert any(p.startswith("stories:") for p in writer_check.check(folder))


def test_template_true_outside_the_bridge_is_rejected(folder):
    meta = yaml.safe_load((folder / "meta.yml").read_text(encoding="utf-8"))
    meta["template"] = True
    (folder / "meta.yml").write_text(yaml.safe_dump(meta), encoding="utf-8")
    (p,) = [p for p in writer_check.check(folder) if "template" in p]
    assert "000-bridge" in p and "remove the `template` key" in p and "sources" in p


def test_the_bridge_itself_may_keep_template_true(tmp_path):
    v = tmp_path / "videos" / "000-bridge"
    shutil.copytree(ROOT / "videos" / "000-bridge", v)
    (tmp_path / "stories").mkdir()
    (tmp_path / "stories" / "ledger.yml").write_text("[]\n", encoding="utf-8")
    assert not any("template" in p for p in writer_check.check(v))


def _other(vid, claim, topics):
    return {**entry(vid), "claim": claim, "topics": topics}


def test_entry_repeating_another_entry_is_reported(folder, tmp_path):
    other = _other("002-other", "A strange true thing happened.", ["strange"])
    (tmp_path / "stories" / "ledger.yml").write_text(yaml.safe_dump([other, entry(VID)]), encoding="utf-8")
    (p,) = [p for p in writer_check.check(folder) if "same story" in p]
    assert VID in p and "002-other" in p


def test_entry_matching_the_banned_list_is_reported(folder, tmp_path):
    (tmp_path / "stories" / "banned.yml").write_text(
        yaml.safe_dump([{"claim": "A strange true thing happened.", "keywords": ["strange"]}]), encoding="utf-8")
    assert any(p.startswith(f"ledger entry '{VID}': banned:") for p in writer_check.check(folder))


def test_unrelated_entries_and_banned_are_fine(folder, tmp_path):
    other = _other("002-other", "A sailor in Oslo painted a whale", ["oslo", "whale"])
    (tmp_path / "stories" / "ledger.yml").write_text(yaml.safe_dump([other, entry(VID)]), encoding="utf-8")
    (tmp_path / "stories" / "banned.yml").write_text(
        yaml.safe_dump([{"claim": "A cat painted a ship", "keywords": ["cat", "ship"]}]), encoding="utf-8")
    assert writer_check.check(folder) == []


def test_camera_cuts_must_be_planned(tmp_path):
    import json
    from tools import writer_check
    d = tmp_path / "v"
    d.mkdir()
    (d / "story.ts").write_text("const CAMS = { 2: [{ f: 164, s: A }, { f: 228, cut: true, s: B }], 3: [{f:383,cut:true,s:C}] };",
                                encoding="utf-8")
    (d / "shots.json").write_text(json.dumps({"shots": [{"id": 1, "a": 0, "b": 400}], "planned": [[228, 228]]}), encoding="utf-8")
    p = writer_check.cut_problems(d)
    assert len(p) == 1 and "[383]" in p[0]
    (d / "shots.json").write_text(json.dumps({"shots": [{"id": 1, "a": 0, "b": 400}], "planned": [[228, 228], [380, 390]]}),
                                  encoding="utf-8")
    assert writer_check.cut_problems(d) == []
