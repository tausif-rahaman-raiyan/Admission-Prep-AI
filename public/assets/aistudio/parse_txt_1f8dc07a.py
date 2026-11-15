"""Parser for the 'chorcha-style' question .txt export.  See docs/SOURCE_FORMAT.md.

Block layout (blocks may be separated by blank lines, but a block really starts at a header line):
  [Subject (15)] <global_no>. <subject_no>. <question text ... (may continue on next lines)>
  A: <opt> | B: <opt> | C: <opt> | D: <opt>          (A..E, one line, separated by ' | ')
  CORRECT ANSWER: <letter>
"""
import re

HEADER = re.compile(r"^\[(?P<subject>[^\]]+?)\]\s*(?P<g>\d+)\.\s*(?P<l>\d+)\.\s*(?P<rest>.*)$")
OPT_START = re.compile(r"^\s*A:\s?")
ANSWER = re.compile(r"^\s*CORRECT\s+ANSWER\s*:\s*(?P<a>.*?)\s*$", re.I)
IMG = re.compile(r"\[IMAGE:\s*EXTERNAL_IMAGE_URL:\s*(?P<url>\S+?)\s*\]")
SUBJ = re.compile(r"^(?P<name>.*?)\s*\(\s*(?P<count>\d+)\s*\)\s*$")

def split_options(s):
    """Sequential split: after option A, look for ' | B: ', then ' | C: ' ... so '|' inside math is safe."""
    m = re.match(r"\s*A:\s*", s)
    if not m: return []
    out, i, cur = [], m.end(), "A"
    while True:
        nxt = chr(ord(cur) + 1)
        mm = re.search(r"\s\|\s*" + nxt + r":\s", s[i:])
        if not mm:
            out.append(s[i:].strip()); break
        out.append(s[i:i + mm.start()].strip())
        i += mm.end(); cur = nxt
    return out

def parse_text(text):
    text = text.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n")
    blocks, cur = [], None
    for no, line in enumerate(text.split("\n"), 1):
        if HEADER.match(line):
            cur = {"line": no, "lines": [line]}; blocks.append(cur)
        elif cur is not None:
            cur["lines"].append(line)
    items, problems = [], []
    for b in blocks:
        h = HEADER.match(b["lines"][0])
        subj_raw = h["subject"].strip()
        sm = SUBJ.match(subj_raw)
        q_lines, opt_lines, ans_line, state = [h["rest"]], [], None, "q"
        for ln in b["lines"][1:]:
            if state == "q" and OPT_START.match(ln): state = "o"
            if ANSWER.match(ln): ans_line, state = ln, "done"; continue
            if state == "q": q_lines.append(ln)
            elif state == "o": opt_lines.append(ln)
        question = "\n".join(q_lines).strip()
        options = split_options(" ".join(x.strip() for x in opt_lines if x.strip()))
        ans = ANSWER.match(ans_line)["a"].strip().upper() if ans_line else ""
        it = {"line": b["line"], "global": int(h["g"]), "subjectNo": int(h["l"]),
              "subjectRaw": subj_raw, "subjectName": (sm["name"] if sm else subj_raw).strip(),
              "subjectCount": int(sm["count"]) if sm else None,
              "question": question, "options": options, "answerLetter": ans}
        if len(options) < 2: problems.append(f"line {b['line']}: Q{h['g']} has {len(options)} options")
        if not re.fullmatch(r"[A-E]", ans): problems.append(f"line {b['line']}: Q{h['g']} bad/missing answer '{ans}'")
        elif options and ord(ans) - 65 >= len(options): problems.append(f"line {b['line']}: Q{h['g']} answer {ans} outside options")
        items.append(it)
    return items, problems

MD_IMG = re.compile(r"!\[[^\]]*\]\((?P<url>https?://[^)\s]+)[^)]*\)")
HTML_IMG = re.compile(r"<img\b[^>]*?\bsrc\s*=\s*[\"'](?P<url>https?://[^\"']+)[\"'][^>]*>", re.I)

def pull_images(s):
    """Return (text_without_image_markup, [urls]).  Understands:
       [IMAGE: EXTERNAL_IMAGE_URL: url]   ![alt](https://url)   <img src="https://url">   (remote http/https only)"""
    urls = []
    if re.fullmatch(r"\s*https?://\S+\s*", s or ""): return "", [s.strip()]     # option/field that is only an image URL
    for rx in (IMG, MD_IMG, HTML_IMG):
        urls += [m["url"] for m in rx.finditer(s)]
        s = rx.sub("", s)
    return re.sub(r"[ \t]+\n", "\n", s).strip(), urls
