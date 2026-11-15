# tools/ingest
Standard-library Python 3.9+. Run everything from the repository root.
| Script | Step | What it does |
|---|---|---|
| `build_session.py` | 1 | parse .txt, map subjects, download images, write questions.json + work/pending.json + ingest-report.json |
| `retry_images.py` | 1b | retry failed/skipped images and rewrite URLs |
| `merge_explanations.py` | 3 | merge AI explanations, compare AI answer with source answer |
| `validate.py` | 4 | blocking checks (`--final` = strict) |
| `make_readme.py` | 5 | write session README.md + review.md from real data |
| `update_manifest.py` | 6 | public/data/manifest.json + docs/PROGRESS.md |
| `parse_explained_json.py`, `bilingual.py` | library | Format B parser, bilingual split/number check |
| `parse_txt.py`, `download_images.py`, `common.py`, `subjects.map.json` | library | parser, downloader, helpers, subject label map |
