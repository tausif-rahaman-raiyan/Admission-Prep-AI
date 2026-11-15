#!/usr/bin/env python3
"""STEP 3. Merge work/explanations.json (written by the AI) into questions.json.

explanations.json = { "<question id>": {
    "aiAnswer": "B" | null,            # AI's own independent answer (null = could not solve, e.g. image unreadable)
    "explanation": "markdown + LaTeX (Bangla)  <- REQUIRED when the source had none; OPTIONAL otherwise (only to replace a wrong/contradicting source explanation)",
    "explanationOk": true | false,     # when the source explanation exists: does it agree with the correct answer and is it sound?
    "confidence": "high" | "medium" | "low",
    "fixes": [ {"field": "question" | "option:A", "to": "corrected text", "why": "reason"} ],   # OCR/LaTeX repairs only
    "note": "optional short remark for the human reviewer" } }

Verification rule:  aiAnswer == sourceAnswer -> 'agree';  differs -> 'disagree' (answerVerified=false, correctAnswer kept as source);  null -> 'unchecked'.
usage: python tools/ingest/merge_explanations.py --session-id du-24-25-mcq"""
import argparse
from common import *

ap = argparse.ArgumentParser(); ap.add_argument("--session-id", required=True); a = ap.parse_args()
S = load_sessions()[a.session_id]; d = session_dir(S["institution"], a.session_id)
qs = read_json(d / "questions.json"); ex = read_json(d / "work" / "explanations.json")
byid = {q["id"]: q for q in qs}
missing = [i for i in byid if i not in ex]; extra = [i for i in ex if i not in byid]
for qid, e in ex.items():
    q = byid.get(qid)
    if not q: continue
    new = (e.get("explanation") or "").strip()
    if new:
        if q.get("explanation"): q.setdefault("cleanup", []).append({"field": "explanation", "from": q["explanation"], "to": new, "why": e.get("note", "AI replaced source explanation")})
        q["explanation"] = new; q["explanationSource"] = "ai-rewritten" if q.get("explanationSource") == "source" else "ai"
    if e.get("explanationOk") is False: q["explanationNeedsReview"] = True
    q["aiAnswer"] = e.get("aiAnswer"); q["confidence"] = e.get("confidence", "medium")
    if e.get("note"): q["reviewNote"] = e["note"]
    for f in e.get("fixes", []):
        fld = f["field"]; log = q.setdefault("cleanup", [])
        if fld == "question": log.append({"field": fld, "from": q["question"], "to": f["to"], "why": f.get("why", "")}); q["question"] = f["to"]
        elif fld.startswith("option:"):
            i = ord(fld.split(":")[1]) - 65; log.append({"field": fld, "from": q["options"][i], "to": f["to"], "why": f.get("why", "")}); q["options"][i] = f["to"]
    ai = (e.get("aiAnswer") or "").upper()
    q["verification"] = "unchecked" if not ai else ("agree" if ai == q["sourceAnswer"] else "disagree")
    if q["verification"] == "disagree": q["answerVerified"] = False
    else: q.pop("answerVerified", None)
write_json(d / "questions.json", qs)
c = {k: sum(1 for q in qs if q["verification"] == k) for k in ("agree", "disagree", "unchecked", "pending")}
print("merged", len(ex), "explanations;", c, "| missing:", len(missing), "extra:", len(extra))
if missing: print("  missing ids (first 10):", missing[:10])
