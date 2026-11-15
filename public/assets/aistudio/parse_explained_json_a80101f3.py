"""Parser for the 'Explained JSON' export (Format B).  See docs/SOURCE_FORMAT.md.

{ "season": "DU 25-26", "total_questions": 90,
  "questions": [ { "id": 1, "subject": "Physics(15)", "subject_question_no": 1,
                   "question": "বাংলা ... (English ...)", "question_image": null | "https://...png",
                   "options": {"A": "..", "B": "..", "C": "..", "D": ".."},      # an option may be just an image URL
                   "correct_answer": "B",
                   "explanation": {"one_line_calculation": "..", "step_by_step_solution": "..", "shortcut_tip": ".."} } ] }
Returns the same item dicts as parse_txt.parse_text plus: explanation (dict|str|None), questionImageRaw, and meta."""
import json, re
from parse_txt import SUBJ

def _first(d, *keys):
    for k in keys:
        if k in d and d[k] not in (None, ""): return d[k]
    return None

def parse_json_text(text):
    data = json.loads(text.lstrip("\ufeff"))
    meta = {"season": None, "total_questions": None}
    if isinstance(data, list): qs = data
    else:
        qs = _first(data, "questions", "items", "data") or []
        meta = {"season": data.get("season"), "total_questions": data.get("total_questions")}
    items, problems = [], []
    for n, q in enumerate(qs, 1):
        opts = q.get("options") or {}
        if isinstance(opts, dict): letters, options = sorted(opts.keys()), [str(opts[k]) for k in sorted(opts.keys())]
        else: letters, options = [chr(65 + i) for i in range(len(opts))], [str(o) for o in opts]
        raw = str(_first(q, "subject", "subject_name") or "")
        sm = SUBJ.match(raw.strip())
        ans = str(_first(q, "correct_answer", "correctAnswer", "answer") or "").strip().upper()
        gid = _first(q, "id", "number") or n
        it = {"line": n, "global": int(gid), "subjectNo": int(_first(q, "subject_question_no", "subjectNo") or 0),
              "subjectRaw": raw, "subjectName": (sm["name"] if sm else raw).strip(),
              "subjectCount": int(sm["count"]) if sm else None,
              "question": str(q.get("question", "")).strip(), "options": options, "answerLetter": ans,
              "explanation": q.get("explanation"), "questionImageRaw": _first(q, "question_image", "questionImage", "image")}
        if letters and letters != [chr(65 + i) for i in range(len(letters))]: problems.append(f"Q{gid}: odd option keys {letters}")
        if len(options) < 2: problems.append(f"Q{gid}: only {len(options)} options")
        if not re.fullmatch(r"[A-E]", ans): problems.append(f"Q{gid}: bad/missing answer '{ans}'")
        elif ord(ans) - 65 >= len(options): problems.append(f"Q{gid}: answer {ans} outside options")
        items.append(it)
    if meta["total_questions"] and meta["total_questions"] != len(items):
        problems.append(f"file says total_questions={meta['total_questions']} but contains {len(items)}")
    return items, problems, meta

EXPL_LABELS = {"one_line_calculation": "🎯 **এক লাইনে হিসাব:**", "step_by_step_solution": "📐 **ধাপে ধাপে সমাধান:**", "shortcut_tip": "⚡ **শর্টকাট টিপস:**"}

def explanation_markdown(exp):
    """dict of known parts -> markdown with 3 labelled sections; str -> unchanged; unknown dict keys -> '**key:** value'."""
    if not exp: return ""
    if isinstance(exp, str): return exp.strip()
    out = []
    for k, v in exp.items():
        if v: out.append(f"{EXPL_LABELS.get(k, '**' + k + ':**')} {str(v).strip()}")
    return "\n\n".join(out)
