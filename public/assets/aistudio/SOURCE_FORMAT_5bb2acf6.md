# Source formats

Two formats are supported. `build_session.py` auto-detects: file starts with `{` (or `[` + `{`) = **Format B**, anything else = **Format A**.

# FORMAT A - "chorcha-style" question .txt (no explanations)

Seen in `DU_24-25_MCQ.txt` (90 questions, 6 subjects x 15, 8 image options, NO explanations). Parser: `tools/ingest/parse_txt.py`.

## Grammar
```
[<Subject label> (<n in this subject>)] <global no>. <subject no>. <question text, may contain $LaTeX$, may continue on following lines>
A: <option> | B: <option> | C: <option> | D: <option>          <- ONE line, options separated by " | " (A..E allowed)
CORRECT ANSWER: <letter>
<blank line>
```
- File starts with a UTF-8 BOM. Strip it (`utf-8-sig`).
- The number appears TWICE: `31. 1.` = paper-wide number 31, 1st question of that subject. `number` = global, `subjectNumber` = second.
- Subject labels are Bangla and inconsistent in spacing: `[রসায়ন(15)]` (no space) vs `[বাংলা (15)]`. Strip the `(n)`, apply Unicode NFC (the letter য় can be stored as 1 or 2 code points - this really broke a lookup once), then map with `tools/ingest/subjects.map.json`.
- Options are split SEQUENTIALLY (look for ` | B: `, then ` | C: ` ...) so a `|` inside math (`|x|`, `\|`) never breaks an option.
- An image appears as `[IMAGE: EXTERNAL_IMAGE_URL: https://assets.chorcha.net/xxxx.png]`, in this file only inside options (the option text is then empty). Other files may also put it in the question. The parser also understands `![alt](https://...)` and `<img src="https://...">`.
- `CORRECT ANSWER:` is the SOURCE's claim. It is not guaranteed to be right.
- There is no explanation anywhere. Explanations are produced by the AI (see AI_MEMORY.md).

## Examples (real lines)
Plain:
```
[বাংলা (15)] 5. 5. 'এক থেকে শুরু করে ক্রমাগত' বাক্যের সংক্ষিপ্ত রূপ কী?
A: একাধিক্রমে | B: একাহারে | C: একাদিক্রমে | D: একের পর এক
CORRECT ANSWER: C
```
Image options:
```
[পদার্থবিজ্ঞান (15)] 31. 1. নিচের কোনটি a থেকে e বিন্দু পর্যন্ত ... চিত্রায়িত করে?
A:  [IMAGE: EXTERNAL_IMAGE_URL: https://assets.chorcha.net/oFet1452ruogC60mwcC-_.png] | B:  [IMAGE: ...] | C: ... | D: ...
CORRECT ANSWER: C
```
LaTeX:
```
[উচ্চতর গণিত (15)] 74. 14. $f(x) = \sqrt{1-\sqrt{x}}$ হলে, $\frac{df}{dx} = ?$
A: $\frac{1}{4\sqrt{x}\sqrt{1-\sqrt{x}}}$ | B: ... | D: $-\frac{1}{4\sqrt{x}\sqrt{1-\sqrt{x}}}$
CORRECT ANSWER: D
```

## Known OCR damage in this kind of file (examples from DU 24-25 MCQ)
| Where | Seen | Probably meant |
|---|---|---|
| Chemistry Q46 option A | `\mathrm{CH}, \mathrm{CH}=\mathrm{CH}_{2}` | CH3-CH=CH2 |
| Chemistry Q60 | `Fe^{3 *}`, `Zn^{2 *}` | Fe^{3+}, Zn^{2+} |
| Physics Q44 | `M_{g}`, `R_{g}` where `M_E`, `R_E` is used elsewhere | M_E, R_E |
| Biology Q86 / Q89 | `Bt Maif`, `Switonia` | Bt Maize, Swietenia (check) |
| Mixed styles | `Q₁` (unicode subscript), `1 × 10^-6 m²` (plain text math) | fine for display, optionally convert |
Rule: repair only what stops rendering or is an unambiguous typo; log it; if a repair could change the answer, do NOT repair - flag in review.md.

## Other input types
JSON or other layouts: write a new adapter `tools/ingest/parse_<name>.py` that returns the same list of dicts as `parse_txt.parse_text` (keys: line, global, subjectNo, subjectRaw, subjectName, subjectCount, question, options, answerLetter), reuse `pull_images`, and document the new format in this file.


---

# FORMAT B - "Explained JSON" (has explanations)  - file `DU_25-26_MCQ_Explained.txt` (extension .txt, content is JSON)
Parser: `tools/ingest/parse_explained_json.py`.

```json
{ "season": "DU 25-26", "total_questions": 90,
  "questions": [ {
    "id": 31, "subject": "গণিত (Mathematics) (15)", "subject_question_no": 1,
    "question": "$5y^2 + \\sin y = x^2$ হলে, $\\frac{dy}{dx} = ?$ (If $5y^2 + \\sin y = x^2$, then $\\frac{dy}{dx} = ?$)",
    "question_image": null,
    "options": { "A": "$\\frac{x}{5y+\\cos y}$", "B": "...", "C": "...", "D": "$\\frac{2x}{10y+\\cos y}$" },
    "correct_answer": "D",
    "explanation": { "one_line_calculation": "...", "step_by_step_solution": "...", "shortcut_tip": "..." } } ] }
```
Facts about the real file (90 questions, 6 subjects x 15):
- `id` = paper-wide number (1..90) -> `number`; `subject_question_no` = number inside the subject -> `subjectNumber`.
- Subject labels are messy: `Physics(15)`, `রসায়ন(15)`, `গণিত (Mathematics) (15)`, `জীববিজ্ঞান (Biology)(15)`, `বাংলা(15)`, `ইংরেজি (15)`. `common.resolve_subject()` removes `(n)`, applies NFC, tries the whole label, the text outside and inside `(...)`, case-insensitive, against `subjects.map.json`.
- `question` and options are often BILINGUAL: `বাংলা ... (English ...)` (28 of 90 questions, 53 segments). Kept as-is by default. `--split-bilingual` rewrites them to `বাংলা ||EN|| English` for the site's BN/EN toggle (then set `bilingual:true` for that session in sessions.ts).
- Math: only some items use `$...$` LaTeX; many use plain unicode (`E/2`, `√`, `⇒`, `x²`). Do NOT mass-convert; only repair what breaks rendering.
- Images: `question_image` is `null` or a URL string; an option may be ONLY a URL (Q28: all four options are images) -> option text becomes `""` and the URL goes to `optionImageUrls`.
- `explanation` is an object. It is stored as 3 labelled markdown sections `🎯 এক লাইনে হিসাব` / `📐 ধাপে ধাপে সমাধান` / `⚡ শর্টকাট টিপস` in `explanation`, and the original object is kept in `explanationParts`. `explanationSource = "source"`.
- Variants tolerated: root is a list; `options` is a list; keys `correctAnswer` / `answer`; `questionImage` / `image`.

## Real data errors found in this file (why verification matters)
| Q | Problem | Found by |
|---|---|---|
| 2, option C | Bangla `12 kPa` but English `120 kPa` | Bangla-vs-English number check (`sourceWarnings`) |
| 2, option D | stray apostrophe `250'kPa` | reading |
| 8 | Bangla part has `l`/`A`, English part mentions `1`: check wording | number check (probably harmless) |
Rule: the bilingual check only finds number differences. It cannot prove an answer right. The independent solve (AI) is still required.
