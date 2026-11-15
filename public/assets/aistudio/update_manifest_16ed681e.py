#!/usr/bin/env python3
"""STEP 6. Rebuild public/data/manifest.json (which papers have questions) and docs/PROGRESS.md."""
import datetime
from common import *

man = {}
for f in sorted(DATA.glob("*/*/questions.json")):
    qs = read_json(f); inst, sid = f.parent.parent.name, f.parent.name
    imgs = sum(len(q.get("questionImageUrls", [])) + sum(len(x) for x in q.get("optionImageUrls", [])) for q in qs)
    man[sid] = {"institution": inst, "path": f"data/{inst}/{sid}/questions.json", "questions": len(qs),
                "withExplanation": sum(1 for q in qs if q.get("explanation")), "unverified": sum(1 for q in qs if q.get("answerVerified") is False),
                "images": imgs, "updated": datetime.date.today().isoformat()}
write_json(DATA / "manifest.json", {"papers": man})
S = load_sessions(); lines = ["# Progress", "", f"{len(man)} of {len(S)} papers have questions.", "", "| Session | Inst | Questions | Explained | Unverified | Images |", "|---|---|---|---|---|---|"]
for sid, m in man.items(): lines.append(f"| {sid} | {m['institution']} | {m['questions']} | {m['withExplanation']} | {m['unverified']} | {m['images']} |")
(ROOT / "docs").mkdir(exist_ok=True); (ROOT / "docs" / "PROGRESS.md").write_text("\n".join(lines) + "\n", encoding="utf8")
print("manifest:", len(man), "papers")
