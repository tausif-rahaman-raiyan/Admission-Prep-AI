#!/usr/bin/env python3
"""Re-try images that failed/skipped in build_session.py, then rewrite URLs inside questions.json.
usage: python tools/ingest/retry_images.py --session-id du-24-25-mcq"""
import argparse, re
from common import *
from download_images import download_all

ap = argparse.ArgumentParser(); ap.add_argument("--session-id", required=True); a = ap.parse_args()
S = load_sessions()[a.session_id]; d = session_dir(S["institution"], a.session_id)
qs = read_json(d / "questions.json"); rep = read_json(d / "work" / "ingest-report.json")
rel = f"data/{S['institution']}/{a.session_id}/images"
jobs = []
for q in qs:
    for n, u in enumerate(q.get("questionImageUrls", []), 1):
        if u.startswith("http"): jobs.append((u, f"q{q['number']:03d}_q{n}"))
    for i, us in enumerate(q.get("optionImageUrls", [])):
        for n, u in enumerate(us, 1):
            if u.startswith("http"): jobs.append((u, f"q{q['number']:03d}_opt{chr(65+i)}" + (f"_{n}" if n > 1 else "")))
res = download_all(jobs, d / "images", rel)
swap = lambda u: res[u]["local"] if u in res and res[u]["status"] == "ok" else u
for q in qs:
    if "questionImageUrls" in q: q["questionImageUrls"] = [swap(u) for u in q["questionImageUrls"]]
    if "optionImageUrls" in q: q["optionImageUrls"] = [[swap(u) for u in us] for us in q["optionImageUrls"]]
write_json(d / "questions.json", qs)
rep["imageMap"].update(res); rep["imagesFailed"] = {u: m for u, m in rep["imageMap"].items() if m["status"] != "ok"}
rep["imagesDownloaded"] = sum(1 for m in rep["imageMap"].values() if m["status"] == "ok"); rep["imagesSkipped"] = []
write_json(d / "work" / "ingest-report.json", rep)
print("downloaded:", sum(1 for m in res.values() if m["status"] == "ok"), "failed:", sum(1 for m in res.values() if m["status"] != "ok"))
