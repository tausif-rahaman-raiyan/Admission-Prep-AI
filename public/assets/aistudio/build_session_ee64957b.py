#!/usr/bin/env python3
"""STEP 1 of the pipeline. Parse a source file (auto-detects the format), download images, write questions.json.

Formats:  A = chorcha .txt (no explanations)        -> parse_txt.py
          B = 'Explained JSON' (has explanations)   -> parse_explained_json.py
usage (from repo root):
  python tools/ingest/build_session.py --file uploads/DU_25-26_MCQ_Explained.txt --session-id du-25-26-mcq [--skip-images] [--split-bilingual]
"""
import argparse, re, shutil, sys, datetime
from pathlib import Path
from common import *
from parse_txt import parse_text, pull_images
from parse_explained_json import parse_json_text, explanation_markdown
from download_images import download_all
from bilingual import mismatch, to_marker

def detect_format(text):
    s = text.lstrip("\ufeff").lstrip()
    # JSON starts with { or with [ followed by { or ]  (format A starts with "[Subject (15)] 1. 1." which is NOT json)
    return "B" if s.startswith("{") or re.match(r"\[\s*[\{\]]", s) else "A"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True); ap.add_argument("--session-id", required=True)
    ap.add_argument("--skip-images", action="store_true", help="do not download (offline); run retry_images.py later")
    ap.add_argument("--split-bilingual", action="store_true", help="turn 'বাংলা (English)' into 'বাংলা ||EN|| English' (needs bilingual:true in sessions.ts)")
    a = ap.parse_args()

    sessions = load_sessions()
    if a.session_id not in sessions:
        close = [k for k in sessions if a.session_id.split('-')[0] in k][:15]
        sys.exit(f"ERROR: session id '{a.session_id}' not in sessions.ts. Similar ids: {close}")
    S = sessions[a.session_id]; inst = S["institution"]
    src = Path(a.file); raw = src.read_bytes(); text = raw.decode("utf-8-sig")
    fmt = detect_format(text)
    if fmt == "B":
        try: items, problems, meta = parse_json_text(text)
        except ValueError as e: sys.exit(f"ERROR: file looks like JSON but is invalid: {e}  (fix the JSON, e.g. stray comma/quote)")
    else: items, problems = parse_text(text); meta = {}

    smap = read_json(TOOLS / "subjects.map.json")
    subj = {i["subjectRaw"]: resolve_subject(i["subjectRaw"], smap) for i in items}
    unknown = sorted(k for k, v in subj.items() if v is None)
    if unknown: sys.exit(f"ERROR: unknown subject labels {unknown}. Add them to tools/ingest/subjects.map.json (ask the user which subject id).")

    nums = [i["global"] for i in items]
    if nums != list(range(1, len(nums) + 1)): problems.append(f"global numbering not 1..N: {nums[:5]}...")
    if len(items) != S["totalQuestions"] and S["questionType"] == "MCQ":
        problems.append(f"question count {len(items)} != sessions.ts totalQuestions {S['totalQuestions']} (check which is right)")
    if meta.get("season") and not (S["institution"].lower() in meta["season"].lower() and S["session"] in meta["season"]):
        problems.append(f"file season '{meta['season']}' does not look like {S['institution']} {S['session']} (wrong session id?)")
    for lab in sorted({i["subjectRaw"] for i in items}):
        grp = [i for i in items if i["subjectRaw"] == lab]
        if grp[0]["subjectCount"] and grp[0]["subjectCount"] != len(grp): problems.append(f"subject '{lab}' says {grp[0]['subjectCount']} but has {len(grp)}")

    out_dir = session_dir(inst, a.session_id)
    (out_dir / "source").mkdir(parents=True, exist_ok=True); (out_dir / "work").mkdir(exist_ok=True)
    shutil.copyfile(src, out_dir / "source" / src.name)
    rel_prefix = f"data/{inst}/{a.session_id}/images"

    jobs, parsed, warnings = [], [], []
    for it in items:
        g = it["global"]
        q, qurls = pull_images(it["question"])
        if it.get("questionImageRaw"):
            extra = it["questionImageRaw"] if isinstance(it["questionImageRaw"], list) else [it["questionImageRaw"]]
            qurls += [u for u in extra if isinstance(u, str) and u.startswith("http")]
        opts, ourls = [], []
        for o in it["options"]:
            t, u = pull_images(o); opts.append(t); ourls.append(u)
        for n, u in enumerate(qurls, 1): jobs.append((u, f"q{g:03d}_q{n}"))
        for idx, us in enumerate(ourls):
            for n, u in enumerate(us, 1): jobs.append((u, f"q{g:03d}_opt{chr(65+idx)}" + (f"_{n}" if n > 1 else "")))
        mm = mismatch(q)
        if mm: warnings.append(f"Q{g} question: numbers differ Bangla{mm[0]} vs English{mm[1]}")
        for idx, o in enumerate(opts):
            mm = mismatch(o)
            if mm: warnings.append(f"Q{g} option {chr(65+idx)}: numbers differ Bangla{mm[0]} vs English{mm[1]}  [{o[:70]}]")
        if a.split_bilingual: q, opts = to_marker(q), [to_marker(o) for o in opts]
        parsed.append((it, q, qurls, opts, ourls))

    imgmap = {} if a.skip_images or not jobs else download_all(jobs, out_dir / "images", rel_prefix)
    def local(u):
        m = imgmap.get(u)
        return m["local"] if m and m["status"] == "ok" else u       # failed/skipped -> keep remote URL (flagged in report)

    questions = []
    for it, q, qurls, opts, ourls in parsed:
        rec = {"id": f"{a.session_id}-q{it['global']:03d}", "number": it["global"], "subjectNumber": it["subjectNo"],
               "subject": subj[it["subjectRaw"]], "question": q, "options": opts,
               "correctAnswer": ord(it["answerLetter"]) - 65 if re.fullmatch(r"[A-E]", it["answerLetter"]) else -1,
               "sourceAnswer": it["answerLetter"], "verification": "pending",
               "explanation": "", "explanationSource": "none",
               "questionType": "MCQ", "institution": inst, "session": S["session"]}
        md = explanation_markdown(it.get("explanation"))
        if md:
            rec["explanation"] = md; rec["explanationSource"] = "source"
            if isinstance(it["explanation"], dict): rec["explanationParts"] = it["explanation"]
        if qurls: rec["questionImageUrls"] = [local(u) for u in qurls]
        if any(ourls): rec["optionImageUrls"] = [[local(u) for u in us] for us in ourls]
        questions.append(rec)

    write_json(out_dir / "questions.json", questions)
    # What the AI gets to see: NO answers and NO explanations, so it must solve independently.
    pending = []
    for r in questions:
        p = {k: r[k] for k in ("id", "number", "subject", "question", "options") if k in r}
        for k in ("questionImageUrls", "optionImageUrls"):
            if k in r: p[k] = r[k]
        pending.append(p)
    write_json(out_dir / "work" / "pending.json", pending)
    failed = {u: m for u, m in imgmap.items() if m["status"] != "ok"}
    skipped = [u for u, _ in jobs if u not in imgmap] if a.skip_images else []
    write_json(out_dir / "work" / "ingest-report.json", {
        "sessionId": a.session_id, "institution": inst, "sourceFile": src.name, "sourceFormat": fmt, "sourceSha256": sha256_bytes(raw),
        "sourceMeta": meta, "explanationsInSource": sum(1 for q in questions if q["explanationSource"] == "source"),
        "bilingualSplit": bool(a.split_bilingual),
        "parsedQuestions": len(questions), "sessionsTsTotalQuestions": S["totalQuestions"],
        "perSubject": {s: sum(1 for q in questions if q["subject"] == s) for s in sorted({q["subject"] for q in questions})},
        "problems": problems, "sourceWarnings": warnings, "imageJobs": len(jobs), "uniqueImageUrls": len({u for u, _ in jobs}),
        "imagesDownloaded": sum(1 for m in imgmap.values() if m["status"] == "ok"), "imagesFailed": failed, "imagesSkipped": skipped,
        "imageMap": imgmap, "builtAt": datetime.datetime.now().astimezone().isoformat(timespec="seconds"), "tool": "build_session.py v2"})
    print(f"OK  format {fmt} | {len(questions)} questions | explanations in source: {sum(1 for q in questions if q['explanationSource']=='source')} -> {out_dir}/questions.json")
    print(f"    images: {len(jobs)} refs, {len({u for u,_ in jobs})} unique, {sum(1 for m in imgmap.values() if m['status']=='ok')} saved, {len(failed)} failed, {len(skipped)} skipped")
    for p in problems: print("    PROBLEM:", p)
    for w in warnings: print("    CHECK  :", w)

if __name__ == "__main__": main()
