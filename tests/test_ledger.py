import subprocess
import sys

from tools import ledger

GOOD = {"id": "001-dancing-bridge", "claim": "Seventy-four soldiers marching in step brought down an iron bridge",
        "topics": ["broughton", "bridge", "soldiers"],
        "sources": ["https://en.wikipedia.org/wiki/Broughton_Suspension_Bridge", "https://www.bbc.co.uk/news/x"],
        "scores": {"strange": 5, "obscurity": 4, "people": 5, "visual": 5, "provable": 5},
        "status": "coded", "reason": "", "video": "001-dancing-bridge", "date": "2026-11-10"}
BANNED = [{"claim": "A man survived both atomic bombs", "keywords": ["survived", "atomic"]}]


def test_valid_entry_has_no_problems():
    assert ledger.problems([GOOD], BANNED) == []


def test_missing_key_and_bad_scores():
    bad = dict(GOOD); del bad["topics"]; bad["scores"] = {**GOOD["scores"], "strange": 9}
    p = " ".join(ledger.problems([bad], BANNED))
    assert "topics" in p and "strange" in p


def test_sources_need_two_domains():
    bad = {**GOOD, "sources": ["https://a.org/x", "https://a.org/y"]}
    assert any("domain" in x for x in ledger.problems([bad], BANNED))


def test_dropped_needs_reason_and_coded_needs_video():
    assert ledger.problems([{**GOOD, "status": "dropped", "video": "", "reason": ""}], BANNED)
    assert ledger.problems([{**GOOD, "video": ""}], BANNED)


def test_duplicate_ids_rejected():
    assert any("duplicate" in x for x in ledger.problems([GOOD, GOOD], BANNED))


def test_check_blocks_banned_and_repeats_and_low_scores():
    assert ledger.check("Tsutomu Yamaguchi survived both atomic bombings", ["yamaguchi"], [], BANNED)
    assert ledger.check("Soldiers marching in step brought down the iron Broughton bridge", ["bridge"], [GOOD], [])
    assert ledger.check("Something new", ["broughton", "bridge", "soldiers"], [GOOD], [])  # 3 shared topics
    assert ledger.check("A baker in Lisbon invented a clock", ["lisbon", "clock"], [GOOD], BANNED) == []


def test_video_problems_requires_coded_entry():
    assert ledger.video_problems("001-dancing-bridge", [GOOD]) == []
    assert ledger.video_problems("002-other", [GOOD])


def test_repo_files_are_valid():
    entries, banned = ledger.load(ledger.ROOT)
    assert ledger.problems(entries, banned) == []
    assert len(banned) >= 40


# --- beyond the brief's cases ---

def test_coded_story_needs_minimum_scores():
    low = {**GOOD, "scores": {**GOOD["scores"], "obscurity": 3, "people": 2}}
    p = " ".join(ledger.problems([low], BANNED))
    assert "obscurity" in p and "people" in p
    # a dropped idea may score low: that is why it was dropped
    dropped = {**GOOD, "status": "dropped", "video": "", "reason": "too well known", "scores": low["scores"]}
    assert ledger.problems([dropped], BANNED) == []


def test_bad_values_rejected():
    for field, value in (("id", "dancing-bridge"), ("claim", " "), ("topics", ["Bridge"]), ("topics", []),
                         ("topics", ["a"] * 9), ("sources", ["https://a.org/x", "ftp://b.org/y"]),
                         ("sources", ["https://a.org/x", "https://a.org/x"]), ("date", "10/11/2026"),
                         ("date", "2026-13-40"), ("status", "posted"), ("video", "../x")):
        assert ledger.problems([{**GOOD, field: value}], BANNED), (field, value)
    assert ledger.problems([{**GOOD, "scores": {**GOOD["scores"], "visual": True}}], BANNED)
    assert ledger.problems([{**GOOD, "extra": 1}], BANNED)
    assert ledger.problems(["not a mapping"], BANNED)


def test_idea_must_have_no_video_and_one_coded_entry_per_video():
    assert ledger.problems([{**GOOD, "id": "idea-x", "status": "idea"}], BANNED)      # video set on an idea
    assert any("video" in x for x in ledger.problems([GOOD, {**GOOD, "id": "002-other"}], BANNED))
    assert ledger.video_problems("001-dancing-bridge", [GOOD, {**GOOD, "id": "002-other"}])


def test_yaml_date_object_is_accepted():
    import datetime
    assert ledger.problems([{**GOOD, "date": datetime.date(2026, 11, 10)}], BANNED) == []


def test_bad_banned_entries_rejected():
    for b in ({"claim": "x", "keywords": []}, {"claim": "x"}, {"keywords": ["a"]}, {"claim": "x", "keywords": ["of"]},
              {"claim": "x", "keywords": "a"}, "text"):
        assert ledger.problems([], [b]), b


def test_banned_needs_all_keywords_or_a_very_similar_claim():
    assert ledger.banned_hit("He survived an atomic blast", BANNED) == "A man survived both atomic bombs"
    assert ledger.banned_hit("He survived a shipwreck", BANNED) is None
    assert ledger.banned_hit("A man survived both atomic bombs", [{"claim": "A man survived both atomic bombs",
                                                                   "keywords": ["zzzz", "qqqq"]}])


def test_load_missing_and_empty_files_are_empty(tmp_path):
    assert ledger.load(tmp_path) == ([], [])
    (tmp_path / "stories").mkdir()
    (tmp_path / "stories" / "ledger.yml").write_text("", encoding="utf-8")
    assert ledger.load(tmp_path) == ([], [])


def test_load_rejects_bad_yaml_and_non_lists(tmp_path):
    import pytest
    (tmp_path / "stories").mkdir()
    (tmp_path / "stories" / "ledger.yml").write_text("- [unclosed", encoding="utf-8")
    with pytest.raises(ValueError):
        ledger.load(tmp_path)
    (tmp_path / "stories" / "ledger.yml").write_text("a: 1", encoding="utf-8")
    with pytest.raises(ValueError):
        ledger.load(tmp_path)


def test_seeded_entry_blocks_the_template_story():
    entries, banned = ledger.load(ledger.ROOT)
    assert ledger.check("Soldiers marching in step collapsed Broughton bridge", ["broughton"], entries, banned)


def test_banned_list_blocks_its_own_stories():
    entries, banned = ledger.load(ledger.ROOT)
    for b in banned:
        assert ledger.banned_hit(b["claim"], banned), b["claim"]


def test_cli():
    cli = [sys.executable, str(ledger.ROOT / "tools" / "ledger.py")]
    r = subprocess.run(cli + ["validate"], capture_output=True, text=True)
    assert (r.returncode, r.stdout.strip()) == (0, "ok"), r.stdout + r.stderr
    r = subprocess.run(cli + ["check", "A baker in Lisbon invented a clock", "--topics", "lisbon,clock"],
                       capture_output=True, text=True)
    assert (r.returncode, r.stdout.strip()) == (0, "ok")
    r = subprocess.run(cli + ["check", "The Great Molasses Flood hit Boston", "--topics", "molasses"],
                       capture_output=True, text=True)
    assert r.returncode == 1 and r.stdout.startswith("banned:")
