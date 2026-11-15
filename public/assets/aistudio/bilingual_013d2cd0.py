"""Helpers for 'Bangla text (English text)' strings. Used for cross-checking numbers and (optionally) splitting."""
import re
BN = "০১২৩৪৫৬৭৮৯"; _TR = str.maketrans(BN, "0123456789")
SPLIT = re.compile(r"^(?P<bn>.*?)\s*\((?P<en>(?:[^()]|\([^()]*\))*)\)\s*$", re.S)

def _latin_ratio(s):
    L = [c for c in s if c.isalpha()]
    return (sum(c.isascii() for c in L) / len(L)) if L else 0

def split_bi(s):
    """'বাংলা (English)' -> ('বাংলা', 'English') or None when the trailing (...) is not an English translation."""
    m = SPLIT.match(s.strip())
    if m and len(m["en"]) >= 8 and _latin_ratio(m["en"]) > 0.85 and re.search(r"[\u0980-\u09FF]", m["bn"]):
        return m["bn"].strip(), m["en"].strip()
    return None

def numbers(s): return sorted(re.findall(r"\d+(?:\.\d+)?", s.translate(_TR)))

def mismatch(s):
    """Return (bn_numbers, en_numbers) if the Bangla and English halves disagree on numbers, else None."""
    b = split_bi(s)
    if not b: return None
    nb, ne = numbers(b[0]), numbers(b[1])
    return (nb, ne) if nb != ne else None

def to_marker(s):
    """'বাংলা (English)' -> 'বাংলা ||EN|| English' (the site's bilingual separator); unchanged if not bilingual."""
    b = split_bi(s)
    return f"{b[0]} ||EN|| {b[1]}" if b else s
