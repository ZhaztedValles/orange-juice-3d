"""Read the spoken narration out of a video's SCRIPT.md."""
import re
from pathlib import Path

START = "<!-- narration -->"
END = "<!-- /narration -->"


def narration(path) -> str:
    """Text between the narration markers, whitespace collapsed.

    Raises ValueError if the markers are missing or the text contains a digit
    (numbers must be written as words so the voice reads them predictably).
    """
    text = Path(path).read_text(encoding="utf-8")
    a = text.find(START)
    b = text.find(END)
    if a < 0 or b < 0 or b < a:
        raise ValueError(f"{path}: missing {START} ... {END} narration markers")
    body = re.sub(r"\s+", " ", text[a + len(START):b]).strip()
    if not body:
        raise ValueError(f"{path}: narration is empty")
    m = re.search(r"\d", body)
    if m:
        raise ValueError(f"{path}: narration contains a digit ({body[max(0, m.start() - 15):m.end() + 15]!r}); write numbers as words")
    return body
