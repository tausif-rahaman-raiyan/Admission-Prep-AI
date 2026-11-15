# AI MEMORY - read this first, update it last

Purpose: any AI (or human) joining this repo must understand, in 3 minutes, how question papers are ingested here. Keep it true. Newest log entries at the bottom of section 6.

## 1. What this repo is
Static exam website (React/Vite, GitHub Pages): question bank + strict timed exam + AI Tutor. Content is data-driven:
- `src/data/institutions.ts`, `src/data/sessions.ts` (262 papers, ids like `du-24-25-mcq`)
- `public/data/<INSTITUTION>/<session-id>/questions.json` (+ `images/`, `source/`, `work/`, `README.md`, `review.md`)
- `public/data/manifest.json` (which papers have questions)  |  `docs/PROGRESS.md` (generated table)

## 2. Ingestion pipeline (one paper at a time)
Two input formats, auto-detected: **A** chorcha .txt (no explanations -> AI writes them) and **B** Explained JSON (explanations included -> AI only verifies). See `docs/SOURCE_FORMAT.md`.
```
python tools/ingest/build_session.py --file <upload.txt> --session-id <id>     # parse + download images -> questions.json, work/pending.json
(AI) read work/pending.json, solve independently, write work/explanations.json
python tools/ingest/merge_explanations.py --session-id <id>
python tools/ingest/validate.py --session-id <id> --final
python tools/ingest/make_readme.py --session-id <id> --model "<model name>"
python tools/ingest/update_manifest.py
git add -A && git commit -m "data(<INST>): add <id> (<n> questions, <k> images)"
```
Full rules: `PROMPT.md` (Part B, sections B0-B10). Source format: `docs/SOURCE_FORMAT.md`.

## 3. Decisions that must not be undone silently
1. `work/pending.json` contains NO answers, so the AI solves first, then it is compared with the source answer.
2. Disagreement never overwrites the source answer. It sets `answerVerified:false` and goes to `review.md`.
3. Images are always saved locally; JSON holds root-relative paths `data/<INST>/<id>/images/<file>`; the site prefixes `import.meta.env.BASE_URL`.
4. The original upload is kept untouched in `source/`.
5. Text repairs are logged in each question's `cleanup[]`.
5b. Source explanations (Format B) are KEPT. The AI replaces one only when it is wrong, the old text goes to `cleanup[]`, and `explanationSource` becomes `ai-rewritten`.
6. `number` = paper-wide number, `subjectNumber` = number inside the subject.

## 4. Gotchas
- Bengali letters: normalise with NFC before comparing (য় has two encodings).
- `\rightarrow` starts with `\right`: never count `\right` without `(?![a-zA-Z])`.
- Some image hosts block bots or the sandbox has no network: build still succeeds, remote URLs are kept and flagged; run `retry_images.py` where network works. `validate.py --final` refuses remote images.
- A file that starts with `[` is usually Format A (`[বাংলা (15)] 1. 1.`), not JSON. Detection = `{` or `[` followed by `{`/`]`.
- Subject labels vary between files (`গণিত (Mathematics) (15)`); extend `subjects.map.json`, never guess.
- Format B questions are bilingual `বাংলা (English)`; numbers are cross-checked between the two halves (found a real `12` vs `120 kPa` error).
- Re-running `build_session.py` resets explanations (keep `work/explanations.json`, re-merge).
- sessions.ts `totalQuestions` can differ from the real file; report it, do not edit sessions.ts silently.

## 5. Subject ids used by the site
Bangla, English, Physics, Chemistry, Mathematics (incl. উচ্চতর গণিত), Biology, ICT. Map file: `tools/ingest/subjects.map.json`.

## 6. Log (append one entry per finished paper)
| Date | Session id | Questions | Images | Disagree / Unchecked | Lessons / oddities |
|---|---|---|---|---|---|
