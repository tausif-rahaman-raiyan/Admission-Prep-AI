"""Shared helpers for the ingestion tools. Python 3.9+, standard library only."""
import json, re, hashlib, sys
from pathlib import Path

ROOT = Path.cwd()                       # run every tool from the repo root
DATA = ROOT / "public" / "data"
TOOLS = Path(__file__).resolve().parent

def sha256_bytes(b): return hashlib.sha256(b).hexdigest()
def sha256_file(p): return sha256_bytes(Path(p).read_bytes())

def load_sessions():
    """Returns {session_id: {...}} from src/data/sessions.json or by reading src/data/sessions.ts."""
    js = ROOT / "src" / "data" / "sessions.json"
    if js.exists():
        return {s["id"]: s for s in json.loads(js.read_text(encoding="utf8"))}
    ts = ROOT / "src" / "data" / "sessions.ts"
    if not ts.exists():
        sys.exit("ERROR: src/data/sessions.ts not found. Run from the repo root.")
    txt = ts.read_text(encoding="utf8")
    start = txt.index("= [", txt.index("export const sessions")) + 2
    end = txt.rindex("];") + 1
    return {s["id"]: s for s in json.loads(txt[start:end])}   # sessions.ts is JSON-compatible

def session_dir(inst, sid): return DATA / inst / sid
def read_json(p): return json.loads(Path(p).read_text(encoding="utf8"))
def write_json(p, obj):
    Path(p).parent.mkdir(parents=True, exist_ok=True)
    Path(p).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf8")


import unicodedata
def _clean_label(s): return re.sub(r"\s+", " ", unicodedata.normalize("NFC", re.sub(r"\(\s*[\d০-৯]+\s*\)", "", s))).strip()

def resolve_subject(label, smap):
    """Map messy labels ('রসায়ন(15)', 'গণিত (Mathematics) (15)', 'Physics(15)') to a site subject id. None if unknown.
    Tries the whole label, then the text outside (...) and the text inside (...), case-insensitively."""
    lab = _clean_label(label)
    table = {unicodedata.normalize("NFC", k).lower(): v for k, v in smap.items()}
    tries = [lab, re.sub(r"\(.*?\)", "", lab).strip()] + re.findall(r"\((.*?)\)", lab)
    for t in tries:
        t = unicodedata.normalize("NFC", t).strip().lower()
        if t in table: return table[t]
    return None
