#!/usr/bin/env python3
"""STEP 4. Hard checks. Exit code 1 if anything blocking is found.  usage: python tools/ingest/validate.py --session-id X [--final]"""
import argparse, re, sys
from common import *

def math_problems(s):
    out = []
    if s.count("$") % 2: out.append("odd number of $")
    for m in re.finditer(r"\$\$?(.+?)\$\$?", s, re.S):
        body = m.group(1); depth = 0
        for ch in re.sub(r"\\[{}]", "", body):
            depth += (ch == "{") - (ch == "}")
            if depth < 0: break
        if depth != 0: out.append("unbalanced { } in: " + body[:40])
        if len(re.findall(r"\\left(?![a-zA-Z])", body)) != len(re.findall(r"\\right(?![a-zA-Z])", body)): out.append(r"\left/\right mismatch in: " + body[:40])
    return out

ap = argparse.ArgumentParser(); ap.add_argument("--session-id", required=True); ap.add_argument("--final", action="store_true"); a = ap.parse_args()
S = load_sessions()[a.session_id]; d = session_dir(S["institution"], a.session_id)
qs = read_json(d / "questions.json"); errs, warns = [], []
if S["questionType"] == "MCQ" and len(qs) != S["totalQuestions"]: warns.append(f"count {len(qs)} != sessions.ts {S['totalQuestions']}")
ids = [q["id"] for q in qs]
if len(ids) != len(set(ids)): errs.append("duplicate ids")
for q in qs:
    t = q["id"]
    if not (0 <= q["correctAnswer"] < len(q["options"])): errs.append(f"{t}: correctAnswer out of range")
    if a.final and not q.get("explanation"): errs.append(f"{t}: empty explanation")
    if a.final and q.get("verification") == "pending": errs.append(f"{t}: not verified yet")
    for fld, txt in [("question", q["question"]), ("explanation", q.get("explanation", ""))] + [(f"option{chr(65+i)}", o) for i, o in enumerate(q["options"])]:
        if "[IMAGE:" in txt: errs.append(f"{t}.{fld}: leftover [IMAGE:] token")
        for p in math_problems(txt): errs.append(f"{t}.{fld}: {p}")
    urls = q.get("questionImageUrls", []) + [u for us in q.get("optionImageUrls", []) for u in us]
    for u in urls:
        if u.startswith("http"): (errs if a.final else warns).append(f"{t}: image still remote {u}")
        elif not (DATA.parent / u).exists(): errs.append(f"{t}: image file missing {u}")
    for i, o in enumerate(q["options"]):
        if not o and not (q.get("optionImageUrls") and q["optionImageUrls"][i]): errs.append(f"{t}: option {chr(65+i)} empty and has no image")
print(f"checked {len(qs)} questions | errors {len(errs)} | warnings {len(warns)}")
for e in errs[:60]: print("  ERROR", e)
for w in warns[:30]: print("  warn ", w)
sys.exit(1 if errs else 0)
