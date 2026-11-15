#!/usr/bin/env python3
"""STEP 5. Write <session>/README.md + review.md from the real data (never from memory).
usage: python tools/ingest/make_readme.py --session-id X --model "model name used for explanations" [--notes notes.md]"""
import argparse, datetime
from common import *

ap = argparse.ArgumentParser(); ap.add_argument("--session-id", required=True); ap.add_argument("--model", required=True); ap.add_argument("--notes")
a = ap.parse_args(); S = load_sessions()[a.session_id]; d = session_dir(S["institution"], a.session_id)
qs = read_json(d / "questions.json"); rep = read_json(d / "work" / "ingest-report.json")
cnt = lambda k: sum(1 for q in qs if q.get("verification") == k)
dis = [q for q in qs if q.get("verification") == "disagree"]; unc = [q for q in qs if q.get("verification") == "unchecked"]
low = [q for q in qs if q.get("confidence") == "low" and q.get("verification") != "disagree"]
cl = [(q["id"], c) for q in qs for c in q.get("cleanup", [])]
imgs = [(u, m) for u, m in rep["imageMap"].items()]
src_cnt = lambda k: sum(1 for q in qs if q.get("explanationSource") == k)
expl_review = [q for q in qs if q.get("explanationNeedsReview")]
notes = Path(a.notes).read_text(encoding="utf8") if a.notes else "_none_"
R = f"""# {S['title']}  ({a.session_id})

Generated {datetime.datetime.now().astimezone().isoformat(timespec='seconds')} by `tools/ingest/make_readme.py`. Written so a future AI can repeat or audit this work.

## 1. Result
- Institution: **{S['institution']}**  | unit: {S.get('unit')} | session: {S['session']} | type: {S['questionType']}
- Paper facts (from `src/data/sessions.ts`): {S['durationMinutes']} min, {S['totalQuestions']} questions, {S['totalMarks']} marks, negative marking {S['negativeMarking']}
- Questions in `questions.json`: **{len(qs)}**  | per subject: {rep['perSubject']}
- Source format: **{rep.get('sourceFormat','A')}**  ({'Explained JSON' if rep.get('sourceFormat')=='B' else 'chorcha .txt'})
- Explanations: **{sum(1 for q in qs if q.get('explanation'))}/{len(qs)}**  (from the source file: {src_cnt('source')}, written by AI: {src_cnt('ai')}, source explanation replaced by AI: {src_cnt('ai-rewritten')})
- Answer check (AI solved independently, then compared with the source answer): agree **{cnt('agree')}**, disagree **{cnt('disagree')}**, unchecked **{cnt('unchecked')}**
- Images: {rep['imageJobs']} references, {rep['uniqueImageUrls']} unique, saved locally **{sum(1 for _, m in imgs if m['status']=='ok')}**, failed **{sum(1 for _, m in imgs if m['status']!='ok')}**

## 2. Folder
```
public/data/{S['institution']}/{a.session_id}/
  questions.json        <- the file the website loads
  images/               <- every image saved locally (no remote links remain)
  source/{rep['sourceFile']}   <- untouched original upload (sha256 {rep['sourceSha256'][:16]}...)
  work/                 <- pending.json (what the AI saw), explanations.json (what the AI wrote), ingest-report.json
  README.md  review.md
```

## 3. How it was built (pipeline)
1. **Parse** `{rep['sourceFile']}` with `tools/ingest/parse_txt.py` (format: `docs/SOURCE_FORMAT.md`). Each question = header line `[Subject (n)] <global no>. <subject no>. text`, one options line `A: .. | B: .. | C: .. | D: ..`, then `CORRECT ANSWER: X`. Subject labels were mapped with `tools/ingest/subjects.map.json`.
2. **Images**: every `[IMAGE: EXTERNAL_IMAGE_URL: <url>]` token was removed from the text and the file downloaded into `images/` as `q<global>_q<n>` (question) or `q<global>_opt<A-D>` (option). `questions.json` stores root-relative paths (`data/...`); the site prepends its base URL. Full URL->file map: `work/ingest-report.json` -> `imageMap`.
3. **Explanations**: {('the source file already contained explanations (one_line_calculation / step_by_step_solution / shortcut_tip). They were kept as written and shown as three labelled sections (🎯 📐 ⚡); the original parts are preserved in `explanationParts`. The AI model `' + a.model + '` did NOT write them; it only re-solved every question from `work/pending.json` (no answers, no explanations inside) and judged whether each source explanation agrees with the correct answer.') if rep.get('sourceFormat')=='B' else ('the source file had **no explanations**. They were written by the AI model `' + a.model + '` from `work/pending.json`, which deliberately contained **no answers**, so each question was solved independently first. Style: Bangla + LaTeX, answer line, key rule/formula, short steps, one trap/trick.')}
4. **Verification**: `merge_explanations.py` compared the AI answer with the source `CORRECT ANSWER`. Disagreements were NOT overwritten: they keep the source `correctAnswer`, get `answerVerified:false` (the exam page then excludes them from scoring) and are listed in `review.md` for a human decision.
5. **Cleanup**: only OCR/LaTeX repairs that stop rendering. Each one is stored in the question's `cleanup` array (field, from, to, why). Total repairs: **{len(cl)}**.
6. **Validation**: `validate.py --final` (ids, answer range, images exist locally, no leftover `[IMAGE:` token, balanced `$`/braces) and `update_manifest.py`.

## 4. Things a human should look at
- Answer disagreements: **{len(dis)}**  | answers the AI could not check: **{len(unc)}**  | low-confidence: **{len(low)}**  -> see `review.md`
- Source explanations flagged by the AI as doubtful: **{len(expl_review)}**
- Parser problems: {rep['problems'] or 'none'}
- Bangla-vs-English number mismatches found in the source: {rep.get('sourceWarnings') or 'none'}
- Failed images: {list(rep['imagesFailed']) or 'none'}

## 5. Cleanup log
""" + ("\n".join(f"- `{i}` {c['field']}: `{c['from'][:80]}` -> `{c['to'][:80]}` ({c['why']})" for i, c in cl) or "_no repairs_") + f"""

## 6. Session notes from the AI
{notes}

## 7. Re-run
```
python tools/ingest/build_session.py --file public/data/{S['institution']}/{a.session_id}/source/{rep['sourceFile']} --session-id {a.session_id}
```
(Warning: re-running resets explanations. Keep `work/explanations.json` and re-run `merge_explanations.py` afterwards.)
"""
(d / "README.md").write_text(R, encoding="utf8")
RV = [f"# Review list - {a.session_id}", ""]
RV += ["## A. AI answer differs from source answer (decide, then set `answerVerified` and `correctAnswer` in questions.json)", ""]
RV += [f"- Q{q['number']} ({q['subject']}) source={q['sourceAnswer']} ai={q.get('aiAnswer')} - {q.get('reviewNote','')}" for q in dis] or ["_none_"]
RV += ["", "## B. AI could not check", ""] + ([f"- Q{q['number']} ({q['subject']}) - {q.get('reviewNote','')}" for q in unc] or ["_none_"])
RV += ["", "## C. Low confidence", ""] + ([f"- Q{q['number']} ({q['subject']}) - {q.get('reviewNote','')}" for q in low] or ["_none_"])
RV += ["", "## D. Source explanation doubtful (AI says it contradicts the answer or is wrong)", ""] + ([f"- Q{q['number']} ({q['subject']}) - {q.get('reviewNote','')}" for q in expl_review] or ["_none_"])
RV += ["", "## E. Source text warnings (Bangla vs English numbers differ - fix the wrong side in questions.json)", ""] + ([f"- {w}" for w in rep.get("sourceWarnings", [])] or ["_none_"])
(d / "review.md").write_text("\n".join(RV) + "\n", encoding="utf8")
print("wrote", d / "README.md", "and review.md")
