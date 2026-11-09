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


# --- the story rules a branch's change must keep (append-only ledger, banned list only grows, no repeats) ---

IDEA = {**GOOD, "id": "idea-old", "claim": "A baker in Lisbon invented a clock", "topics": ["lisbon", "clock"],
        "status": "idea", "video": ""}
OTHER = {**GOOD, "id": "002-other", "claim": "A sailor in Oslo painted a whale", "topics": ["oslo", "whale"],
         "video": "002-other"}


def test_unchanged_files_have_no_change_problems():
    assert ledger.change_problems([GOOD, IDEA], BANNED, [GOOD, IDEA], BANNED) == []
    assert ledger.change_problems([], [], [], []) == []


def test_deleted_entry_is_a_problem():
    p = ledger.change_problems([GOOD, IDEA], BANNED, [GOOD], BANNED)
    assert len(p) == 1 and "'idea-old'" in p[0] and "deleted" in p[0]


def test_edited_claim_is_a_problem():
    p = ledger.change_problems([GOOD], BANNED, [{**GOOD, "claim": "Something else entirely"}], BANNED)
    assert len(p) == 1 and "edited" in p[0] and "'claim'" in p[0]
    assert ledger.change_problems([IDEA], BANNED, [{**IDEA, "topics": ["x"]}], BANNED)       # any field
    assert ledger.change_problems([GOOD], BANNED, [{**GOOD, "reason": "x"}], BANNED)


def test_trimmed_or_edited_banned_is_a_problem():
    more = BANNED + [{"claim": "A cat painted a ship", "keywords": ["cat", "ship"]}]
    p = ledger.change_problems([], more, [], BANNED)
    assert len(p) == 1 and "A cat painted a ship" in p[0] and "gain" in p[0]
    assert ledger.change_problems([], BANNED, [], [{**BANNED[0], "keywords": ["x"]}])
    assert ledger.change_problems([], BANNED, [], [])
    assert ledger.change_problems([], BANNED, [], more) == []                                # gaining is fine


def test_allowed_transitions():
    assert ledger.change_problems([IDEA], BANNED, [{**IDEA, "status": "coded", "video": "003-clock"}], BANNED) == []
    assert ledger.change_problems([IDEA], BANNED, [{**IDEA, "status": "dropped", "reason": "dull"}], BANNED) == []
    assert ledger.change_problems([GOOD], BANNED,
                                  [{**GOOD, "status": "dropped", "reason": "wrong", "video": ""}], BANNED) == []


def test_disallowed_transitions():
    coded_to_idea = {**GOOD, "status": "idea", "video": ""}
    p = ledger.change_problems([GOOD], BANNED, [coded_to_idea], BANNED)
    assert len(p) == 1 and "'coded' -> 'idea'" in p[0]
    dropped = {**IDEA, "status": "dropped", "reason": "dull"}
    assert ledger.change_problems([dropped], BANNED, [{**dropped, "status": "coded", "video": "003-x"}], BANNED)
    assert ledger.change_problems([dropped], BANNED, [{**dropped, "status": "idea", "reason": ""}], BANNED)
    # a drop must give a reason and clear the video
    assert ledger.change_problems([GOOD], BANNED, [{**GOOD, "status": "dropped", "reason": ""}], BANNED)
    assert ledger.change_problems([GOOD], BANNED, [{**GOOD, "status": "dropped", "reason": "x"}], BANNED)
    # coding an idea may not also rewrite the claim
    assert ledger.change_problems([IDEA], BANNED, [{**IDEA, "status": "coded", "video": "003-x",
                                                    "claim": "A new claim"}], BANNED)


def test_new_entry_repeating_a_banned_claim_is_a_problem():
    new = {**OTHER, "id": "003-atomic", "claim": "He survived both atomic bombs", "topics": ["japan"]}
    p = ledger.change_problems([GOOD], BANNED, [GOOD, new], BANNED)
    assert len(p) == 1 and p[0].startswith("ledger entry '003-atomic': banned:")
    # a banned entry added in the same change blocks it too
    added = [{"claim": "A sailor painted a whale", "keywords": ["sailor", "whale"]}]
    assert ledger.change_problems([GOOD], BANNED, [GOOD, OTHER], BANNED + added)
    assert ledger.change_problems([GOOD], BANNED, [GOOD, OTHER], BANNED) == []


def test_new_entry_repeating_a_past_entry_is_a_problem():
    same_claim = {**OTHER, "claim": "Soldiers marching in step brought down the iron Broughton bridge"}
    p = ledger.change_problems([GOOD], BANNED, [GOOD, same_claim], BANNED)
    assert len(p) == 1 and "same story as '001-dancing-bridge'" in p[0]
    same_topics = {**OTHER, "topics": ["broughton", "bridge", "soldiers"]}
    assert "shares 3 topics" in " ".join(ledger.change_problems([GOOD], BANNED, [GOOD, same_topics], BANNED))
    dropped = {**GOOD, "status": "dropped", "video": "", "reason": "dull", "id": "idea-b"}
    assert ledger.change_problems([dropped], BANNED, [dropped, same_claim], BANNED)           # dropped ideas count too


def test_two_new_entries_repeating_each_other_are_a_problem():
    a = {**OTHER, "id": "002-a", "video": "002-a"}
    b = {**OTHER, "id": "003-b", "video": "003-b", "claim": "A sailor in Oslo painted one whale"}
    p = ledger.change_problems([GOOD], BANNED, [GOOD, a, b], BANNED)
    assert p and any("'003-b'" in x and "'002-a'" in x for x in p)
    assert ledger.change_problems([GOOD], BANNED, [GOOD, a], BANNED) == []


def test_idea_becoming_coded_is_checked_against_everything_else():
    clash = {**GOOD, "id": "002-clash", "claim": "Soldiers marching in step brought down the iron Broughton bridge",
             "topics": ["x"], "status": "idea", "video": ""}
    coded = {**clash, "status": "coded", "video": "002-clash"}
    assert ledger.change_problems([GOOD, clash], BANNED, [GOOD, coded], BANNED)
    # but an old entry that stays an idea is not re-checked (main may hold older near-duplicates)
    assert ledger.change_problems([GOOD, clash], BANNED, [GOOD, clash], BANNED) == []


def test_problem_text_cannot_inject_lines():
    nasty = {**OTHER, "id": "003-x",
             "claim": "Soldiers marching in step brought down the iron Broughton bridge\n::error::boom"}
    out = ledger.change_problems([GOOD], BANNED, [GOOD, nasty], BANNED)
    assert out and all("\n" not in x for x in out)
    bad = {**GOOD, "id": "evil\n::error::x"}
    assert all("\n" not in x for x in ledger.problems([bad], BANNED))
    assert all("\n" not in x for x in ledger.change_problems([bad], BANNED, [], BANNED))
    hostile = ledger.check("blue whales sing", ["a"], [{**GOOD, "id": "a\nb", "claim": "blue whales sing"}],
                           [{"claim": "blue\nwhales sing", "keywords": ["whales"]}])
    assert hostile and all("\n" not in x for x in hostile)


# --- sources: parsing and domains ---

def test_unparseable_url_is_a_problem_not_a_crash():
    bad = {**GOOD, "sources": ["https://a.org/x", "http://[bad"]}
    assert any("http(s) URLs" in x for x in ledger.problems([bad], BANNED))
    assert ledger._domain("http://[bad") == ""


def test_registrable_domain():
    rd = ledger.registrable_domain
    assert rd("en.wikipedia.org") == rd("de.wikipedia.org") == rd("wikipedia.org") == "wikipedia.org"
    assert rd("www.bbc.co.uk") == rd("news.bbc.co.uk") == "bbc.co.uk"
    assert rd("www.abc.net.au") == "abc.net.au" and rd("history.ac.uk") == "history.ac.uk"
    assert rd("example.com") == "example.com" and rd("localhost") == "localhost"
    assert rd("foo.co.com") == "co.com" and rd("a.b.example.org") == "example.org"
    assert rd("127.0.0.1") == "127.0.0.1"
    assert ledger._domain("https://WWW.Example.COM:8080/x") == "example.com"
    assert ledger._domain("ftp://example.com") == "" and ledger._domain("https:///x") == ""


def test_subdomains_of_one_site_are_not_different_domains():
    wiki = {**GOOD, "sources": ["https://en.wikipedia.org/wiki/A", "https://de.wikipedia.org/wiki/A"]}
    assert any("different domains" in x for x in ledger.problems([wiki], BANNED))
    bbc = {**GOOD, "sources": ["https://www.bbc.co.uk/a", "https://news.bbc.co.uk/b"]}
    assert any("different domains" in x for x in ledger.problems([bbc], BANNED))
    ok = {**GOOD, "sources": ["https://www.bbc.co.uk/a", "https://www.itv.co.uk/b"]}
    assert ledger.problems([ok], BANNED) == []
