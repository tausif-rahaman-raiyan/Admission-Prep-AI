# MASTER PROMPT — Exam Question-Bank Website + Strict Exam + AI Tutor + Question-File Ingestion (ALL IN ONE)

> One prompt for everything. Give it to an AI coding agent that can read/write files, run Python and use git (Claude Code, Codex, Cursor, Gemini CLI, Antigravity...).
> **PART A** = build the website (React/Vite, GitHub Pages). **PART B** = the ingestion agent that turns my uploaded question files into website data, one exam at a time, and documents everything for the next AI.
> Anything written as `[[LIKE_THIS]]` is MY data that I will send later. Do NOT invent subjects, universities, sessions, texts or questions.

## HOW TO USE (for me)
1. Unzip `exam-platform-starter.zip` at the repo root. It contains this prompt as `PROMPT.md`, `src/data/sessions.ts`, `src/data/institutions.ts`, `tools/ingest/*` and `docs/*`.
2. Start the AI agent in that folder and paste this whole prompt (or say: "Read PROMPT.md and follow it").
3. The agent first builds the site (Phase 1), then waits for my question files (Phase 2). I upload them one by one.

## WORKFLOW (for the AI)
- **Phase 1 — Build the site.** Read PART A completely. Confirm in ~10 lines what you will build, list which `[[...]]` items are still missing, ask me for them, then generate the full project. Do this only if the repo does not already contain the finished site.
- **Phase 2 — Ingest papers.** Read `docs/AI_MEMORY.md` and `docs/SOURCE_FORMAT.md`, then follow PART B for every file I upload, strictly one paper at a time.
- If something in PART A and PART B seems to disagree, PART A decides what the site looks like and PART B decides how data is produced.
- Section references: `§n` = Part A, `§Bn` = Part B.

---

# PART A — THE WEBSITE

## 0. YOUR TASK

Build a complete, production-ready, **static** website (no server needed, deployable to GitHub Pages) that is a **question bank + strict timed exam simulator + AI Tutor**, in exactly the style and behavior described below. All content (site name, subjects, institutions, sessions, questions, colors per subject, texts) must come from **one editable data layer** so I can change everything myself.

The two data files `src/data/sessions.ts` and `src/data/institutions.ts` already exist (see §16). Subjects, texts and questions come later: ask me for what is still missing (§16 list), never invent it. Questions are NOT written by hand: they are produced by the ingestion workflow in **PART B** and land in the folder layout below.

## 1. TECH STACK

- React 19 + Vite + TypeScript, single page app, **no router** (view state: `home | questionBank | exam | analytics`).
- Tailwind CSS v4 with class-based dark mode: `@custom-variant dark (&:where(.dark, .dark *));`
- `lucide-react` icons, `katex@0.16.11` (load katex css) with markdown + LaTeX rendering (`react-markdown`, `remark-math`, `rehype-katex`, `remark-gfm`). Inline `$...$`, block `$$...$$`.
- `@google/genai` SDK for the AI Tutor, called **directly from the browser** with the user's own API key.
- Google Fonts: `Atma (500,600,700)`, `Caveat (500,600,700)`, `Noto Serif Bengali (500,600,700)`, `Patrick Hand`.
- Vite `base` must be configurable for GitHub Pages (`/[[REPO_NAME]]/`). Provide a GitHub Actions deploy workflow.

## 2. EDITABLE DATA LAYER (most important)

Create these files so I can edit everything without touching components:

```
src/data/siteConfig.ts     // site name, tagline, hero text, footer, badges, social links, logo path
src/data/institutions.ts   // list shown as cards on home
src/data/sessions.ts       // list of exam papers
src/data/subjects.ts       // subject -> color theme, icon, bn/en names
src/data/translations.ts   // optional bn<->en label maps
public/data/manifest.json          // which papers already have questions (written by Part B tools)
public/data/<INSTITUTION>/<session-id>/questions.json   // one folder per university, then per session
public/data/<INSTITUTION>/<session-id>/images/          // every question image, saved locally (never remote links)
public/logo.png
```

### 2.1 `siteConfig.ts` fields
`siteName`, `siteSubtitle` (small text under logo, e.g. "[[A • B • C]]"), `pageTitle`, `metaDescription`, `heroBadge`, `heroTitleLine1`, `heroTitleGradientLine2`, `heroParagraph` (with 2 highlighted phrases), `searchPlaceholder`, `heroStats` (4 items: value + label), `footer` (brand, description, developer name, instagram url, github url, bottom tags), `defaultTheme: "light"`.

### 2.2 `institutions.ts` item
`{ id, code, nameBn, nameEn, desc, colorKey, parent?, units? }` — plus one special item `{ id: "ALL", code: "ALL", ... "All Combined" }` that shows every session.
- `parent`: an institution with `parent: "AGRI"` does NOT get its own big card; when the user selects the group card "AGRI", show a second row of small chips (All / GST-AGRI / GAU / BAU / SAU / CVASU / SYLAU) to filter inside the group. Selecting the group alone shows all children.
- `units`: if an institution has 2+ units (e.g. RU: C/H/F/G, JU: A/D, CoU: A/B/C, KhU: A/B) show a small unit chip row (All + each unit) under the institution grid; it filters sessions by `session.unit`. Hide the row when the institution has only one unit.
- Because there are now ~9 top-level cards + ALL, use the institution grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (wraps to 2 rows), card colors from `colorKey` using the §4.3 template for ANY Tailwind color (blue, amber, purple, cyan, fuchsia, emerald, rose, teal, lime, indigo).

### 2.3 `sessions.ts` item
```ts
{
  id: "x-25-26",           // unique, also JSON file name
  title: "X 25-26 MCQ",
  institution: "X",         // matches institutions.id
  unit: "A" | "C" | ... | null,   // admission unit/group; used for the optional unit chips on home
  session: "25-26",
  questionType: "MCQ" | "Written",
  durationMinutes: 45,
  totalQuestions: 90,
  totalMarks: 60,
  description: "short text shown on card",
  negativeMarking: 0.25,    // fraction of one mark per wrong answer (e.g. 0.25 or 0.2)
  subjectPickMode?: true,   // optional: enables the "choose subjects before exam" modal (see §8)
  bilingual?: true          // optional: enables BN/EN question language toggle
}
```

### 2.4 Question JSON schema (`public/data/<INSTITUTION>/<session-id>/questions.json` = array)
The full record, including the extra audit fields written by Part B (§B4), is defined in Part B. The site only needs the fields below and must ignore unknown fields.
```ts
{
  id: string,
  number: number,
  subject: string,                 // must match subjects.ts id
  question: string,                // markdown + LaTeX. Optional bilingual separator: "Bangla text ||EN|| English text"
  options: string[],               // MCQ options (empty array for Written)
  correctAnswer: number,           // index into options; -1 or answerVerified:false => "unverified"
  answerVerified?: boolean,
  explanation?: string,            // markdown + LaTeX; also supports "||EN||"
  questionType: "MCQ" | "Written",
  institution: string, session: string,
  questionImageUrls?: string[],
  optionImageUrls?: string[][],    // images per option
  explanationImageUrls?: string[],
  optionLabels?: string[]          // default labels (see §5)
}
```
Loader: `fetch(`${import.meta.env.BASE_URL}data/${session.institution}/${session.id}/questions.json`)`, cache in a `Map`, de-duplicate in-flight requests, and **pre-load images** (question and option images first, explanation images later, `decoding=sync`, `referrerPolicy="no-referrer"`). Any image path that does not start with `http` is **root-relative** (`data/DU/du-25-26-mcq/images/q028_optA.png`) and must be prefixed with `import.meta.env.BASE_URL`. Render `<img loading="lazy">`.
Also load `${BASE_URL}data/manifest.json` once at start: `{ "papers": { "<session-id>": { "institution", "path", "questions", "withExplanation", "unverified", "images", "updated" } } }`. A paper "has questions" only if it is listed there. A missing manifest or a 404 must never crash the site (treat as "no papers yet").

## 3. GLOBAL LOOK, THEME & FONTS

- **Default theme = LIGHT.** Saved choice wins afterwards. On change: toggle `html.dark` and `html.light-mode` classes (exactly one active).
- Body: dark → text `#f1f5f9`, bg `#060913`; light → text `#0f172a`, bg `#ffffff`. `html{scroll-behavior:smooth; overflow-x:clip}`, antialiased, `-webkit-tap-highlight-color: transparent`, 0.2s color/background transition. Include a `.no-scrollbar` utility.
- KaTeX: force bold (700). Light mode: `.katex` color `#0f172a`, size 1.08em, thicker fraction lines. Dark mode: light-sky colored math, size 1.05em.
- Font styles available (user-selectable): `sans` (system stack), `serif` (Georgia, Cambria, Times, Noto Serif Bengali), `mono`, `bryndan` = handwriting stack `Bryndan Write, Patrick Hand, Caveat, Atma, Segoe Print, Bradley Hand, Comic Sans MS, cursive, sans-serif` with letter-spacing .01em (applies to p/span/div/button/h1-h4 but NOT inside `.katex`). Label in UI: "Bryndan Write ✍️".
- Cards are large rounded (`rounded-2xl`/`rounded-3xl`), `border-2`, soft shadows. Dark surfaces use deep navy hexes like `#070C18`, `#0B1325`, `#0E1628`.
- Bengali digits helper: convert 0-9 to ০-৯ when UI language is Bangla.

## 4. COLOR / GRADIENT SYSTEM (exact Tailwind classes)

### 4.1 Hero (home)
Container: `relative overflow-hidden bg-gradient-to-br from-indigo-100/80 via-white to-sky-100/70 dark:from-[#0B132B] dark:via-[#080D1A] dark:to-[#040711] py-8 sm:py-12 px-4 sm:px-8 rounded-3xl shadow-xl border border-indigo-200 dark:border-indigo-900/40`
Title: `text-2xl sm:text-5xl font-black tracking-tight leading-tight`; 2nd line gradient text: `bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-sky-400 dark:via-indigo-300 dark:to-sky-200 bg-clip-text text-transparent`.
Top badge pill: `rounded-full bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-sky-300 text-[11px] sm:text-xs font-bold uppercase tracking-wide` with sparkles icon.
Paragraph: `text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto`; highlight 1 `text-indigo-700 dark:text-sky-300 font-bold`, highlight 2 `text-amber-600 dark:text-amber-300 font-bold`.
Primary button: `bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20`. Secondary: `bg-slate-100 dark:bg-[#0E172A] border border-slate-300 dark:border-indigo-900/60 text-indigo-700 dark:text-sky-300 rounded-xl font-bold`.

### 4.2 Hero stat boxes (4, in this color order)
1. blue: `bg-blue-50/90 dark:bg-[#0C1933] border-blue-200 dark:border-blue-800/60`, value `text-blue-600 dark:text-sky-400`
2. amber: `bg-amber-50/90 dark:bg-[#231608] border-amber-200 dark:border-amber-800/60`, value `text-amber-600 dark:text-amber-400`
3. purple: `bg-purple-50/90 dark:bg-[#1B0F2E] border-purple-200 dark:border-purple-800/60`, value `text-purple-600 dark:text-purple-400`
4. indigo: `bg-indigo-50/90 dark:bg-[#121638] border-indigo-200 dark:border-indigo-800/60`, value `text-indigo-600 dark:text-indigo-400`
Each: `p-3 rounded-xl border`, value `text-base sm:text-xl font-black`, label `text-[10px] sm:text-[11px]`.

### 4.3 Institution cards (colorKey → classes; the template works for any Tailwind color name, not just those listed)
Selected card (all): `bg-indigo-100/90 dark:bg-gradient-to-br dark:from-indigo-900/90 dark:via-[#112046] dark:to-[#0A1329] border-indigo-600 dark:border-sky-400 shadow-lg scale-[1.01]`; code chip becomes `bg-indigo-600 text-white dark:bg-sky-400 dark:text-slate-950`.
Unselected, per color:
- blue `border-blue-400 dark:border-blue-500/50 bg-blue-50/80 dark:bg-[#0D1A33]`
- amber `border-amber-400 dark:border-amber-500/50 bg-amber-50/80 dark:bg-[#241608]`
- purple `border-purple-400 dark:border-purple-500/50 bg-purple-50/80 dark:bg-[#1B0E30]`
- cyan `border-cyan-400 dark:border-cyan-500/50 bg-cyan-50/80 dark:bg-[#08202E]`
- fuchsia `border-fuchsia-400 dark:border-fuchsia-500/50 bg-fuchsia-50/80 dark:bg-[#250C2A]`
- indigo (ALL) `border-indigo-400 dark:border-indigo-500/50 bg-indigo-50/80 dark:bg-[#121538]`
For colors not listed above (emerald, rose, teal, lime) generate the same pattern: light `border-C-400 bg-C-50/80`, dark `dark:border-C-500/50` plus a very dark navy-tinted hex of that hue for `dark:bg-[#...]`.
Card layout: `p-3.5 sm:p-4 rounded-2xl border-2 min-h-[112px] sm:min-h-[126px] flex flex-col justify-between`; code chip `text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider`; name `text-sm sm:text-base lg:text-lg font-extrabold`; desc `text-[11px] sm:text-xs font-semibold`.

### 4.4 Session (paper) cards — a palette that CYCLES by index (`palette[i % 6]`)
Each palette entry has: `cardBg`, `border`, `badge`, `metricBox`, `accentText`, `startBtn`, `seeBtn`.
Pattern for color C in [blue, purple, amber, fuchsia, cyan, emerald(6th)]:
- cardBg: `bg-gradient-to-br from-C-100/90 via-C-50/60 to-white dark:from-[#dark1] dark:via-[#dark2] dark:to-[#dark3]`
  - blue `#0C1E3E → #09152B → #060D1B`
  - purple `#21103B → #160B28 → #0B0616`
  - amber `#2C1B08 → #1D1206 → #0F0A04`
  - fuchsia `#2D0E33 → #1E0A22 → #100514`
  - cyan `#082635 → #061A24 → #040E15`
  - emerald: pick matching dark hexes in the same pattern
- border: `border-2 border-C-300 dark:border-C-500/50 hover:border-C-500 dark:hover:border-C-400 shadow-md shadow-C-500/10`
- badge: `bg-C-600 text-white shadow-xs`
- metricBox: `bg-C-50/90 dark:bg-C-950/40 border border-C-200 dark:border-C-800/50`
- accentText: `text-C-700 dark:text-C-300` (amber/cyan use `-800` in light)
- startBtn: `bg-C-600 hover:bg-C-500 text-white shadow-C-600/20`
- seeBtn: `bg-white hover:bg-C-50 dark:bg-[#dark] text-C-700 dark:text-C-300 border border-C-300 dark:border-C-700/60`

### 4.5 Subject color themes (by subject id) — used for question card borders, badges, filter chips, number badges
Return an object `{borderClass, bgClass, badgeBg, badgeText, accentBar, numBadge, filterActive, filterInactive}` per subject. Template for color C:
- borderClass `border-2 border-C-200/90 dark:border-C-800/70 hover:border-C-400 dark:hover:border-C-600 shadow-xs`
- bgClass `bg-C-50/45 dark:bg-[#hex]`
- badgeBg `bg-C-100 text-C-800 border border-C-300 dark:bg-C-950/90 dark:text-C-200 dark:border-C-700/80`
- badgeText `text-C-700 dark:text-C-300`
- accentBar `bg-C-600`, numBadge `bg-C-600 text-white border-C-500`
- filterActive `bg-C-600 text-white border-C-500 shadow-sm ring-2 ring-C-500/30`
- filterInactive `bg-C-50/80 text-C-700 border-C-200 hover:bg-C-100 hover:border-C-400 dark:bg-C-950/45 dark:text-C-300 dark:border-C-800/70 dark:hover:bg-C-900/60`

Default mapping (I may override in `subjects.ts`): Physics→blue (`#0A1428`), Chemistry→purple (`#140E29`), Mathematics→indigo (`#0D122B`), Biology→amber (`#1C1409`), Bangla→fuchsia (`#1E0D24`), English→cyan (`#081A24`), anything else→sky (`#0B1526`). Matching is case-insensitive "includes" on English or Bangla names. **My subjects: [[SUBJECT_LIST with colors]].**

## 5. HOME PAGE (view = `home`)

Order of sections, top to bottom:
1. **Hero** (§4.1) centered, `max-w-4xl`: badge → H1 (2 lines) → paragraph → row with **search input** (rounded-xl, search icon inside, left padding) + **"Start Strict Exam" primary button** (starts the first session of the currently selected institution that has a questions file; disabled if none has one yet) + **"AI Key" secondary button** (opens API key modal) → 4 stat boxes (`grid-cols-2 sm:grid-cols-4`).
2. **Institution selector**: H2 with icon + subtitle; grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5` (9 top-level cards + ALL = 2 rows on desktop; child institutions with a `parent` get no card). Selecting one filters sessions. Default selected = the first card in `institutions.ts` (DU). Under the grid show, when relevant, the **group chips** (for AGRI) and the **unit chips** (for RU/JU/CoU/KhU) described in §2.2. Selecting a group card shows the sessions of all its children.
3. **Filter bar** (in a rounded `bg-slate-50/90 dark:bg-[#091020]` panel): segmented control `All | MCQ | Written` (`grid-cols-3 sm:inline-flex`; active colors: All indigo-600, MCQ blue-600, Written amber-600) and a counter text "Total sessions: **N** found" + a hint line.
4. **Session grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5`. A session is shown only if: institution matches (or ALL) AND search text matches title/session/description AND type filter matches.
   Card content: institution•session chip, optional "subject-pick" chip, type chip (Written = `bg-amber-500 text-white`, MCQ = white/dark slate with sky text), H3 title, description, 3 metric boxes (Time min / Questions / Marks), and 2 buttons: **"See question"** (opens question bank) and **"Start Exam"** (opens exam). If the paper is not in `manifest.json`: show a small "Coming soon" badge, disable **Start Exam**, and make **See question** show the friendly empty state ("Questions for this paper are coming soon"). If `subjectPickMode`, "Start Exam" first opens the subject modal (§8).
5. Footer (§12).

Scroll memory: when leaving `home`, store `window.scrollY`; when returning, restore it instantly. Any other view change scrolls to top instantly.

## 6. NAVBAR

- `sticky top-0 z-50 bg-white/95 dark:bg-[#070B14]/95 backdrop-blur-md border-b border-slate-200 dark:border-indigo-950/80`, inner `max-w-7xl h-16 px-3 sm:px-6 lg:px-8`.
- Left: logo (`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-indigo-300 dark:border-indigo-500/40`) + site name (`text-sm sm:text-lg font-extrabold`) + subtitle (`text-[10px] sm:text-[11px] text-indigo-600 dark:text-sky-400`). Click → home. Logo is also used as favicon + apple-touch-icon.
- **Desktop (≥ md)**: centered pill nav (absolutely centered) with 2 tabs: "Question Bank" (active for home + questionBank) and "Analytics". Active tab: `bg-indigo-600 text-white`. Right side: Settings dropdown (§9).
- **Mobile (< md)**: nav tabs hidden; a **"Menu"** button opens a dropdown containing the two tabs and the settings controls; closes on outside click.
- Navbar is **hidden during the exam view**.

## 7. QUESTION BANK PAGE (view = `questionBank`)

Top area: "back to all sessions" button; (if `bilingual`) language toggle `বাংলা (BN) | English (EN)` (active BN `bg-emerald-600`, EN `bg-sky-600`); **"Start Strict Exam"** button.
Header: chips (institution, "Session X", "Question Bank & Solution"), H1 = session title, paragraph "Total N questions • correct answers & explanations • direct AI Tutor", **search input** (searches question, explanation, subject, options), **subject filter chips** (ALL + each subject present) using §4.5 filterActive/filterInactive.
Each question card (subject-themed §4.5): number badge "Question N", subject badge, "Written" or "Unverified" badge when relevant; question text at user font size; images; options list with labels (default Bangla ক খ গ ঘ ঙ for BN, A B C D E for EN; or custom `optionLabels`); **correct option highlighted green** (`border-emerald-500/70 bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-500/30`, label chip `bg-emerald-600 text-white`, check icon); no highlight if unverified. Below: "Explanation & Solution" block, then **AI Tutor** button (toggle; text changes to "Close AI Tutor"). Empty state if no match.
If user clicks AI Tutor without an API key → show a bottom toast "API Key required" with **Add API Key** + close buttons, auto-hide after 6 s, and do not open the tutor.

## 8. STRICT EXAM (view = `exam`) — "All questions on one page + auto-lock"

### 8.1 Optional subject-pick modal (`subjectPickMode`)
Title "[session] Exam", subtitle "Choose subjects · 4 subjects required (MCQ/Written)". Sections: (a) language toggle BN/EN (violet-600 active) if bilingual; (b) **Mandatory subjects** (2, shown pre-ticked, non-removable: [[MANDATORY_SUBJECTS]]); (c) **Pick exactly 2 more** from [[OPTIONAL_SUBJECTS]] (2-column cards with icon, EN name, BN name, tick circle; once 2 chosen the others are disabled/dimmed); (d) **Exam Summary** with 3 tiles (Questions / Total Marks / Subjects x/4) and selected-subject chips. Footer: Cancel + "Start Examination →" (violet-600, disabled until exactly 2 picked; label shows "Select N More Subjects"). Question count: MCQ = 60; Written = computed from picked subjects ([[WRITTEN_COUNT_RULE]]). Selected subjects and language are saved to localStorage and pre-filled next time.

### 8.2 Behavior
- Load session questions; if `subjectPickMode` keep only chosen subjects. Show loading spinner text while loading.
- **Timer** counts down from `durationMinutes*60`, starts after load, format `mm:ss` (or `h:mm:ss`). Reaching 0 → **auto-submit**. When time is low the timer chip turns `bg-rose-50 text-rose-600 border-rose-300 animate-pulse` (dark: `bg-rose-950/60 text-rose-400 border-rose-700`).
- **Sticky exam header**: back button, session title, answered counter `answered/total`, timer chip, **Submit** button (becomes **Retake** after submit), Settings dropdown (compact: label hidden below `sm`).
- **Subject filter chips** (ALL + subjects with counts; Bangla digits in BN mode) to jump between subjects.
- **Auto-lock rule**: the first click on an option **locks that question permanently** (cannot change). Locked question shows a "Locked" badge; the chosen option gets indigo highlight (`border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-500/40`), other options dim (`opacity-60`, `cursor-not-allowed`). After submit nothing is clickable.
- Written questions: no options, show a note "Written question — solve on paper, then compare with the solution and AI Tutor after the exam."
- **Submit** (button or timeout): stop timer, scroll to top, show result report, reveal correct/wrong colors and explanations. Per-question badge: Correct (+marks), Wrong (−marks), Skipped, Written, Unverified. Option colors after submit: correct → emerald; chosen wrong → rose (`border-rose-500/70 bg-rose-50 dark:bg-rose-950/50 ring-1 ring-rose-500/30`, label `bg-rose-600 text-white`); others dim. Unverified questions: chosen option amber.
- Under every explanation: **AI Tutor** toggle button (same panel as §10; same missing-key toast).
- **Retake** resets answers, locks, timer, AI panels, scrolls to top.

### 8.3 Scoring
```
mcqCount      = number of MCQ questions with options
perMark       = totalMarks / mcqCount            (if subjectPickMode: totalMarks = mcqCount => perMark = 1)
negative      = session.negativeMarking          (e.g. 0.25 or 0.2)
score         = max(0, correct*perMark - wrong*negative*perMark)   // round to 2 decimals
accuracy      = correct / (correct + wrong) * 100                  // round to 1 decimal
unverified    = questions with answerVerified === false or correctAnswer < 0   (never counted right/wrong)
skipped       = MCQ not answered
```
Result report card (top of page): title "Final Result & Analysis (Evaluation Report)", negative-marking notice, 5–6 stat tiles: Score / Total, Correct, Wrong, Skipped, Accuracy %, Unverified. For all-written sessions show only a note instead of tiles.
On submit, **save the attempt once** to localStorage history (§11).

## 9. SETTINGS DROPDOWN

Button: gear icon + "Settings" + chevron (rotates when open), `rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-indigo-900/60 text-xs sm:text-sm font-bold`. Panel: `absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#0B1325] border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl p-4 z-50 space-y-4`, closes on outside `mousedown`. Header "Settings & Options" with a **Reset** link (resets ONLY font settings).
Contents, in order:
1. **AI Tutor Gemini Key** row-button → closes panel and opens API-key modal; right side shows status dot + text: green ring "Custom Key" if a key is saved, amber "Default" if not.
2. **1. Theme Color**: 2-button segmented control: "White / Light" (active `bg-amber-500 text-white`) and "Dark" (active `bg-indigo-600 text-white`).
3. **2. Question Font Size**: `−  [N px]  +` stepper (indigo accent).
4. **3. Option Box Font Size**: stepper (purple accent).
5. **4. Explanation Font Size**: stepper (emerald accent).
6. **5. Font Style**: 2×2 grid: "Sans (Default)", "Serif (Book)", "Mono (Code)", "Bryndan Write ✍️"; active `bg-cyan-600 text-white`; each label rendered in its own font.
Rules: sizes clamp to **12–26 px** (step 1); defaults **question 16, option 14, explanation 14, fontStyle "sans"**. Disable − at 12 and + at 26. Settings apply live everywhere (question text, options, explanation text, AI panel text, font family class on the app root).

## 10. AI TUTOR (per question, inline panel)

### 10.1 Access & key
- Needs the user's own **Gemini API key** (valid if length > 10). Without a key: panel shows an amber warning "To use AI Tutor, first add your Gemini API Key from Settings" + **Add API Key** button.
- **API key modal**: title "Gemini API Key Setup", explanation, `type=password` input (placeholder `AIzaSy...`), a small 3-step guide (open Google AI Studio → login with Google → Create API Key and paste), link `https://aistudio.google.com/app/apikey` ("Get Free Gemini API Key from Google AI Studio"), buttons **Remove Key** (only if one exists), **Cancel**, **Save API Key**. Saving an empty value removes the key. Stored in localStorage only (§11).

### 10.2 Panel UI
Rounded-2xl panel `bg-indigo-50/50 dark:bg-gradient-to-b dark:from-[#091124] dark:to-[#060B18] border border-indigo-200 dark:border-indigo-500/40`.
Header strip (`bg-indigo-100/80 dark:bg-[#0B152F]`): gradient icon tile `bg-gradient-to-tr from-sky-500 to-indigo-600` with sparkles, title **"AI Tutor Admission Coach"**, badge "⚡ Fast AI", purple badge "Vision (N)" when images are attached; right side: copy-solution button (check icon for 2 s after copy) and a **Close** button (label "[[CLOSE_LABEL e.g. বন্ধ করুন]]").
Body: text at the explanation font size.
- Top highlight card when an answer is extracted: pill `bg-gradient-to-r from-indigo-600 to-sky-500 text-white` "AI determined answer" + the answer text (rendered with LaTeX).
- "AI is thinking" row (pulsing dots) until first text arrives.
- The streamed response is **split into section cards** (white / `dark:bg-[#070D1D]`, rounded-xl, border) — see §10.5. While streaming: blinking cursor after the last card and a pulsing progress card: after card 1 → "2. Solution & explanation being prepared…", after card 2 → "3. Admission shortcut & tricks being prepared…", else "Loading next part…", with a "loading more" mono tag.
- Chat thread below: user bubbles (indigo tint, label "Your question:"), AI bubbles (label "AI Coach answer:" + green badge "⚡ Best Model: <model name>").
- Follow-up form at the bottom: text input (placeholder "Any other shortcut or question about this problem?") + **Ask** button with send icon. Disabled while loading.

### 10.3 What is sent (build the user prompt exactly like this)
```
Admission Test Question Analysis:
- Target Institution: {institution} ({session})
- Subject: {subject}
- Question Type: {MCQ | Written}
- Question Stem: {question}
- Options: {JSON array like ["[ক] ...","[খ] ..."]}        (MCQ only)
- Reference Context (verify independently): {explanation.slice(0,900)}   (if any)
- Attached Images: Inspect all attached question/option images carefully.   (if any)
{svg texts if any}

{if follow-up:}
Student's follow-up question:
"{userQuestion}"
Give a direct, compact, and super helpful answer in [[AI_LANGUAGE]] mixed with English technical terms using LaTeX ($...$).

{else if MCQ:}
Solve this MCQ independently step-by-step and write a compact, high-yield admission response in [[AI_LANGUAGE]] following this EXACT structure:

✅ **Correct answer:** [exact option label + option text YOU determined to be correct]

1. 🎯 **Core formula & reasoning:** 1–2 concise lines with the exact law/formula in LaTeX $...$ and why this option is correct.

2. 📐 **Solution & explanation:** direct compact calculation or key elimination steps using LaTeX ($...$ and \frac{a}{b}). Tight and scannable.

3. ⚡ **Admission shortcut & tricks:** the fastest 10-second calculator-free exam-hall trick (ratio, unit check, mental math or memory cue) and 1 common trap to avoid.

{else Written:}
Solve this Written question independently and write a compact step-by-step solution in [[AI_LANGUAGE]] with this EXACT structure:
✅ **Correct answer:** [final result in 1 line]
1. 🎯 **Core formula & principle:** (LaTeX)
2. 📐 **Solution & explanation:** clean exam-standard step-by-step derivation ($...$ and $$...$$)
3. ⚡ **Exam tips & warnings:** key marking points + 1 common mistake in the written script.
```
The labels are in my language in the original (Bangla: `✅ **সঠিক উত্তর:**`, `১. 🎯 **মূল সূত্র ও যুক্তি:**`, `২. 📐 **সমাধান ও ব্যাখ্যা:**`, `৩. ⚡ **এডমিশন শর্টকাট ও ট্রিকস:**`; written: `মূল সূত্র ও নীতি`, `পরীক্ষার টিপস ও সতর্কতা`). Keep the emoji markers 🎯 📐 ⚡ because the splitter uses them. **My language/labels: [[AI_LANGUAGE_AND_LABELS]].**

### 10.4 System instruction (send as `systemInstruction`)
```
You are an elite, fast, and accurate [[COUNTRY/EXAM]] admission coach (AI Tutor Admission Coach). Independently solve every question and verify which option is right—never blindly trust a pre-selected answer. Write concisely in clear [[AI_LANGUAGE]] mixed with standard English scientific terms. Always format mathematical formulas, fractions (\frac{a}{b}), and variables in LaTeX enclosed in dollar signs ($...$ for inline and $$...$$ for standalone equations). Always begin your initial solution with the exact first line: ✅ **[[CORRECT_ANSWER_LABEL]]:** followed by the AI-determined answer, then the 3 numbered sections (1. 🎯, 2. 📐, 3. ⚡).
```
Note the point: the AI must **solve independently** and not trust the stored `correctAnswer`; the stored explanation is only "reference context".

### 10.5 Client-side call, models, streaming
- `new GoogleGenAI({ apiKey })` → `ai.models.generateContentStream({ model, contents, config })`; stream chunks and append `chunk.text`, update UI on every chunk; support abort (AbortController) when the panel closes or the question changes.
- **Image support**: for each question image and option image URL, `fetch` it → if SVG, send the first 10,000 chars as a fenced `xml` text block labelled "[Attached SVG Diagram for …]"; otherwise convert to base64 `inlineData {data, mimeType}` and send as a user message `parts: [...imageParts, {text: prompt}]`. Failures are silently skipped.
- **Model fallback chain** (try in order, first that starts streaming wins; keep these in ONE editable constant file `aiModels.ts`):
  - Use one fallback chain for all tutor requests: `["gemini-3.8-flash","gemini-3.1-flash-lite","gemini-2.5-flash"]`.
  - Try each model in order; continue to the next only if the current model fails. Show the model that produced the final answer in the model badge.
  - (These model IDs are copied from the original site; if any is not available in the API at build time, replace with currently available Gemini Flash/Pro model IDs.)
- Errors: no key → message (§10.1); all models fail → "Could not generate an answer. Please check your API Key in Settings."
- Auto-run the first explanation when the panel opens (once per question + key), and re-run if the key changes.

### 10.6 Response parsing
- `splitSections(text)`: split before lines starting with optional markdown hashes/bold, optional `1.`/`১.` numbering, then one of `🎯 📐 ⚡ ⚠️ 💡 🔍 📌 👉` (or any numbered line `1. 2. 3. 4.`); if nothing splits, split on blank lines; else one card.
- `extractAnswer(text)`: match the first line `✅ **Correct answer:** …` (also accept "Answer:", "উত্তর", "সঠিক উত্তর") → return `{answer, sections}`; remove that line from the body and show it in the top highlight card.
- Every card is rendered with the same Markdown + KaTeX renderer used for questions.

## 11. LOCAL STORAGE (all persistence is browser-only)

| Key | Content | Notes |
|---|---|---|
| `[[PREFIX]]_theme_v2` | `"dark"` or `"light"` | default light if missing/invalid |
| `[[PREFIX]]_ui_settings_v2` | `{questionFontPx, optionFontPx, explanationFontPx, fontStyle}` | clamp 12–26, fontStyle ∈ sans/serif/mono/bryndan, fall back to defaults 16/14/14/sans |
| `[[PREFIX]]_gemini_api_key` | raw API key string | removed when user clicks Remove or saves empty |
| `[[PREFIX]]_exam_history_v1` | array of attempts, newest first, **max 100** | see below |
| `[[PREFIX]]_selected_subjects_v1` | array of exactly 4 subject ids | default = the 4 default subjects |
| `[[PREFIX]]_exam_language_v1` | `"bn"` or `"en"` | default `"bn"` |

Attempt object: `{ id: "attempt-<timestamp>-<rand5>", timestamp: ISO string, sessionId, title, institution, session, questionType, score, totalMarks, totalQuestions, correctCount, incorrectCount, unattemptedCount, timeTakenSeconds }` where `timeTakenSeconds = duration*60 − remainingSeconds`.
Every read/write is wrapped in try/catch (private-mode safe), JSON is validated (arrays/types) before use. Add a tiny "Privacy-first local storage" mention in the footer.

## 12. ANALYTICS PAGE (view = `analytics`)

- Title "Your Exam Performance & Analytics" + note that data is saved in the browser's localStorage. **Delete History** button (only if data exists) → confirmation modal ("This action cannot be undone", shows number of attempts, buttons "No, Cancel" / "Yes, Delete"; clicking the backdrop closes it).
- Empty state: icon, "No exams taken yet", explanation, button "Browse question bank & exam sessions" → home.
- Otherwise 4 stat cards: **Total exams**, **Average score %** (mean of score/totalMarks×100), **Overall accuracy %** (Σcorrect / (Σcorrect+Σwrong)), **Correct / Wrong** totals.
- "Recent results (N)" list: each row = institution+session chip, title, date (localized, `bn-BD` style `day month year hour:minute`), time taken `Xm Ys`, score `a / b`, ✔ correct count, ✘ wrong count, and a **"Retake"** button that opens the same exam again (opens the subject modal if required).

## 13. FOOTER

Dark/light footer: logo + "[[SITE_NAME]]" + subtitle + description paragraph; "Quick Navigation" list (Home & All Sessions, Question Bank & Solutions, Performance Analytics, Configure AI Tutor Key — buttons that change view / open key modal, scroll to top smooth); "Crafted & Maintained for Admission Aspirants — Developed by **[[DEVELOPER_NAME]]**" with Instagram and GitHub link buttons (inline SVG icons, `target=_blank rel="noopener noreferrer"`); bottom bar "© {current year} [[SITE_NAME]]. All rights reserved." plus 3 tags separated by "·": "[[TAG1]]", "Privacy-First Local Storage", "Educational Fair Use".

## 14. RESPONSIVE BEHAVIOR (must match)

- Main container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8`; in the exam view it is full-width with `pt-0`.
- Breakpoints are Tailwind defaults (sm 640, md 768, lg 1024). Typography scales: hero title `text-2xl → sm:text-5xl`; section H2 `text-lg → sm:text-2xl → lg:text-3xl`; body `text-xs → sm:text-base`; tiny labels 10–11px.
- Hero search row: stacked on phone (`flex-col`), row on `sm+`; primary buttons `flex-1` on phone.
- Institution grid: 2 columns (phone) → 3 (sm) → 5 (lg). Session grid: 1 → 2 (md) → 3 (lg). Hero stats: 2 → 4 columns.
- Filter segmented control: 3 equal columns on phone, inline-flex on `sm+`. Info row: stacked → row on `sm+`.
- Navbar: desktop pill tabs + settings; mobile "Menu" dropdown. Settings panel `w-72` (phone) / `w-80` (sm+).
- Exam header buttons shrink: labels like "Settings" hide below `sm`; padding `px-3 sm:px-3.5`.
- Wide math/images never overflow: images `max-w-full`, horizontal overflow hidden or scrollable inside the card; `html{overflow-x:clip}`.
- Toasts (API key required) float at the bottom, full-width on phone, compact on desktop.
- Touch-friendly: all clickable areas ≥ 36 px tall, `cursor-pointer` on desktop.

## 15. QUALITY RULES

1. No hard-coded content inside components — everything from `src/data/*` and JSON.
2. TypeScript types for Session, Question, Attempt, UiSettings.
3. Accessible: `aria-label` on icon buttons, `aria-expanded` on menus, keyboard focus rings.
4. Never crash on bad localStorage or missing images/JSON; show friendly messages.
5. Performance: memoize filtered lists, lazy-load images, cache fetched JSON.
6. Provide: full file tree, all source files, `README.md` explaining how to (a) add a session, (b) add questions, (c) change colors/subjects/texts, (d) deploy to GitHub Pages.

## 16. MY DATA (already filled — use exactly this)

Attached files, copy as-is into `src/data/` (do not rename ids; question folders are named after them):
- `institutions.ts` — 9 top-level cards + 6 agriculture sub-institutions + ALL.
- `sessions.ts` — **262 sessions** (RU 45, JU 80, DU 33, CU 16, JnU 12, KhU 12, CoU 10, BAU 9, SAU 9, CVASU 9, SYLAU 8, GST-Agri 7, GST 6, GAU 6).

Notes about the data:
1. Sessions have **no questions yet**. They arrive one paper at a time through Part B. Until a paper is in `manifest.json` the site shows "Coming soon" and disables Start Exam (§5). Never crash on a missing/404 file.
2. Question count shown on cards = `totalQuestions` from `sessions.ts`. Once a paper is loaded, the real loaded count is used inside the question bank/exam.
3. Marks can be decimals (62.5, 149.5, 50.5). Show them as-is. Score = `perMark = totalMarks / mcqCount` as in §8.3, rounded to 2 decimals.
4. Negative marking defaults: 0.25 for MCQ, 0.2 for JU, 0 for Written. I may edit per session.
5. `subjectPickMode` is on for DU 19-20 … 25-26 (4 of 6 subjects). Everything else is a normal fixed-paper exam. `bilingual` (BN/EN toggle) is OFF for all sessions for now; Part B asks me once whether to turn it on.
6. Time on cards is shown in Bangla like "১ ঘন্টা ৩০ মিনিট" (already inside `description`); the exam timer uses `durationMinutes`.
7. UI language: Bangla labels with English technical terms. Bengali digits for counts when Bangla mode is on.
8. The explanation text inside a question is markdown with up to three labelled sections (🎯 এক লাইনে হিসাব, 📐 ধাপে ধাপে সমাধান, ⚡ শর্টকাট টিপস). Render it as markdown + KaTeX in the "Explanation & Solution" block. Ignore the audit fields (`sourceAnswer`, `aiAnswer`, `verification`, `cleanup`, `explanationParts`, `reviewNote`...). `answerVerified === false` keeps the existing "Unverified" behaviour (no green highlight, not scored).

Still to come from me (do NOT invent them; use placeholders until I send):
```
[[SITE_NAME / SUBTITLE / HERO TEXTS]]:
[[SUBJECTS with BN/EN names, icons, colors]]:   (site subject ids already in use: Bangla, English, Physics, Chemistry, Mathematics, Biology, ICT)
[[SUBJECT PICK RULES for DU 4-of-6 mode]]:
[[AI language, labels, exam/country name]]:
[[STORAGE PREFIX, REPO_NAME, DEVELOPER_NAME, social links, footer tags]]:
```

---

# PART B — THE INGESTION AGENT

Repo files PART B needs: `src/data/sessions.ts`, `src/data/institutions.ts`, `tools/ingest/*`, `docs/SOURCE_FORMAT.md`, `docs/AI_MEMORY.md` (all inside `exam-platform-starter.zip`).

## B0. WHO YOU ARE AND THE RULES YOU NEVER BREAK

You are the ingestion engineer of a Bangladeshi university-admission question-bank website. I give you one exam file at a time. You convert it into clean website data, save every image locally, verify every answer yourself, document the work, commit it to git, and leave notes so that a different AI next month can continue without asking me anything.

Never-break rules:
1. **Never invent.** No made-up questions, options, answers, facts, image contents or "verified" claims. If you cannot see an image or are unsure, say so and flag it.
2. **Never silently change my data.** Every text repair is logged in the question's `cleanup[]`. An answer disagreement is never "fixed" by overwriting the source answer; it is flagged for me.
3. **One exam at a time.** Finish the whole checklist (§B10) for the current file before touching the next one.
4. **Read before you act.** First read `docs/AI_MEMORY.md` and `docs/SOURCE_FORMAT.md`. They are the memory of earlier sessions.
5. **Use the tools in `tools/ingest/`.** Do not rewrite them. If you find a bug, fix the tool, test on the real file, and write the fix into `docs/AI_MEMORY.md`.
6. **Report honestly.** What the scripts printed and what you checked is what you report. "Done" is only allowed after `validate.py --final` returns 0 errors.
7. Do not push to a remote unless I say so. Commit locally and give me the push command.

## B1. PRE-FLIGHT (run once per session, report in 5 lines)

```
git status --short                 # must be clean or only my new upload
python3 --version                  # 3.9+
ls src/data/sessions.ts src/data/institutions.ts tools/ingest docs/AI_MEMORY.md
curl -sI -m 10 https://assets.chorcha.net | head -1             # image host reachable? any HTTP status line = yes; empty output = no network
```
- If `tools/ingest` or the docs are missing → STOP and tell me to unzip `ingest-kit.zip` at the repo root.
- If the image host is not reachable, continue with `--skip-images`, and tell me clearly that images still point to the remote URL and which command to run later on a machine with internet (`retry_images.py`). `validate.py --final` will refuse to pass until they are local.
- **If you are in a plain chat without file/shell access:** do the same work by hand and output (a) `questions.json`, (b) `README.md`, (c) `review.md`, (d) the exact `mkdir`/`git` commands; images cannot be downloaded in chat, so also output `python tools/ingest/retry_images.py --session-id <id>` for me to run.

## B2. FOLDER LAYOUT — University first, then session

```
public/data/
  manifest.json                         <- which papers have questions (auto)
  <INSTITUTION>/                        <- e.g. DU, RU, JU, CU, GST, CoU, JnU, KhU, GAU, BAU ...  (= session.institution in sessions.ts)
    <session-id>/                       <- e.g. du-25-26-mcq  (= id in sessions.ts, never rename)
      questions.json                    <- what the website loads
      images/                           <- every image saved locally: q031_optA.png, q010_q1.png ...
      source/<original upload>          <- untouched copy of my file
      work/pending.json                 <- what you saw while solving (NO answers, NO explanations)
      work/explanations.json            <- what you wrote
      work/ingest-report.json           <- machine report (parse stats, image URL -> local file map)
      README.md                         <- how THIS paper was processed (auto-generated from real data)
      review.md                         <- things a human must decide
docs/AI_MEMORY.md   docs/SOURCE_FORMAT.md   docs/PROGRESS.md (auto)
tools/ingest/*.py
```
Image paths inside JSON are **root-relative**: `data/DU/du-25-26-mcq/images/q028_optA.png`. The site prepends `import.meta.env.BASE_URL` (so it also works on GitHub Pages under `/repo-name/`).

## B3. THE TWO INPUT "LANGUAGES" I WILL SEND (auto-detected)

Full grammar, real examples and known OCR errors are in `docs/SOURCE_FORMAT.md`. Summary:

**Format A — chorcha `.txt`, no explanations** (example `DU_24-25_MCQ.txt`)
```
[বাংলা (15)] 5. 5. question text ($LaTeX$ allowed, may continue on next lines)
A: opt | B: opt | C: opt | D: opt           (one line, separated by " | ")
CORRECT ANSWER: C
```
Number appears twice (paper-wide, then inside subject). Images look like `[IMAGE: EXTERNAL_IMAGE_URL: https://...png]`. → **you write the explanations.**

**Format B — "Explained JSON", has explanations** (example `DU_25-26_MCQ_Explained.txt`; extension is .txt but content is JSON)
`{season, total_questions, questions:[{id, subject, subject_question_no, question, question_image, options:{A..D}, correct_answer, explanation:{one_line_calculation, step_by_step_solution, shortcut_tip}}]}`.
Questions/options are often bilingual `বাংলা (English)`. An option can be only an image URL. → **you keep the explanations and only verify.**

**Image detection (both formats, also in any new JSON/TXT):** `[IMAGE: EXTERNAL_IMAGE_URL: url]`, markdown `![alt](https://..)`, `<img src="https://..">`, a field like `question_image`, or an option whose whole value is a URL. Every one of them must end up as a local file; no remote image URL may remain.

**A third, unknown layout?** Write `tools/ingest/parse_<name>.py` returning the same item dicts as `parse_txt.parse_text`, reuse `pull_images`, register it in `detect_format()` in `build_session.py`, document it in `docs/SOURCE_FORMAT.md`, test it on the real file, then continue.

Subject labels are messy (`রসায়ন(15)`, `গণিত (Mathematics) (15)`, `Physics(15)`). They are mapped by `tools/ingest/subjects.map.json`. **If a label is unknown the build stops: ask me which site subject it is. Never guess.** Site subject ids: Bangla, English, Physics, Chemistry, Mathematics, Biology, ICT.

## B4. OUTPUT RECORD (extends Part A §2.4; the site ignores the extra fields)

```jsonc
{ "id": "du-25-26-mcq-q028", "number": 28, "subjectNumber": 13, "subject": "Chemistry",
  "question": "text (markdown + $LaTeX$)", "options": ["", "", "", ""],          // "" when the option is an image
  "correctAnswer": 2,                       // index of the SOURCE answer (A=0)
  "sourceAnswer": "C", "aiAnswer": "C", "confidence": "high|medium|low",
  "verification": "agree | disagree | unchecked | pending",
  "answerVerified": false,                  // present ONLY when verification = disagree (site then excludes it from scoring)
  "explanation": "🎯 **এক লাইনে হিসাব:** ...\n\n📐 **ধাপে ধাপে সমাধান:** ...\n\n⚡ **শর্টকাট টিপস:** ...",
  "explanationSource": "source | ai | ai-rewritten | none", "explanationParts": { /* Format B original */ },
  "explanationNeedsReview": true, "reviewNote": "short human-readable remark",
  "questionImageUrls": ["data/DU/du-25-26-mcq/images/q010_q1.png"],
  "optionImageUrls": [["data/.../q028_optA.png"], [...], [...], [...]],
  "cleanup": [ { "field": "question", "from": "...", "to": "...", "why": "..." } ],
  "questionType": "MCQ", "institution": "DU", "session": "25-26" }
```

## B5. THE PIPELINE — run in this order, from the repo root

**Step 0 — identify the paper.** I will upload e.g. `DU_25-26_MCQ_Explained.txt`. Find its id in `sessions.ts` (here `du-25-26-mcq`). If two ids fit or none fits, ask me one short question. Compare: the file's question count and `season` with the sessions.ts entry; report any difference (do not edit sessions.ts).

**Step 1 — build.**
```
python3 tools/ingest/build_session.py --file <upload> --session-id <id>          # add --skip-images if offline
```
It detects the format, parses, maps subjects, downloads every image, copies the source into `source/`, writes `questions.json`, `work/pending.json` and `work/ingest-report.json`. Read what it prints. Every `PROBLEM:` and `CHECK:` line must be handled or reported in the README. (`CHECK:` = Bangla and English parts of one text disagree on numbers, e.g. "12 kPa" vs "120 kPa": look at it and fix the wrong side with a logged `fixes` entry if the correct value is unambiguous, otherwise flag it.)
Optional: `--split-bilingual` turns `বাংলা (English)` into `বাংলা ||EN|| English` for the site's BN/EN toggle. Ask me once, record my answer in `docs/AI_MEMORY.md` §3, and use it for all later papers.

**Step 2 — look at the images.** For every image in `images/` open it (you need vision). Confirm it is the right figure and actually readable. If you cannot view images, put every image question in `review.md` as "AI could not view image" and set `aiAnswer: null` for it.

**Step 3 — solve independently (this is the real work).** Read `work/pending.json` ONLY. It deliberately contains no answers and no explanations. Do not open `questions.json` while solving. Work in batches of one subject (15 questions). For every question decide your own answer; for calculations compute with Python (math/sympy), do not do long arithmetic in your head. Write `work/explanations.json`:
```json
{ "<question id>": {
    "aiAnswer": "B",                         // null if you cannot solve it (image unreadable, ambiguous)
    "confidence": "high|medium|low",
    "explanation": "...",                    // Format A: REQUIRED.  Format B: omit (keeps the source one) unless it is wrong
    "explanationOk": true,                   // Format B: false if the source explanation contradicts the answer or contains an error
    "fixes": [ {"field": "question" | "option:B", "to": "repaired text", "why": "reason"} ],
    "note": "one short sentence for the human reviewer" } }
```
Explanation rules (Format A, or when replacing a wrong Format B explanation):
- Bangla, in exactly 3 labelled parts: `🎯 **এক লাইনে হিসাব:**` (the answer + key formula/rule in one line), `📐 **ধাপে ধাপে সমাধান:**` (short steps, no padding), `⚡ **শর্টকাট টিপস:**` (a fast method or the common trap). Math in `$...$`.
- Grammar/vocabulary/literature/biology-fact questions: give the rule or fact that decides the answer; do **not** fabricate sources, page numbers or textbook quotes. If it is only your recollection, set `confidence: "low"` and add a `note`.
- For image options say what each relevant figure shows, based on what you really saw.
- Format B: do not "improve" good explanations. Do not mass-convert their plain-unicode math to LaTeX.
Repairs (`fixes`): only things that stop rendering or are unambiguous typos (`Fe^{3 *}` → `Fe^{3+}`, `Bt Maif` → `Bt Maize`). Never change a number, a sign, or the meaning of an option. If a repair could change which option is right, do not repair it; flag it.

**Step 4 — merge.**
```
python3 tools/ingest/merge_explanations.py --session-id <id>
```
Rule it applies: your answer = source answer → `agree`; different → `disagree` (the source `correctAnswer` is kept, `answerVerified:false`, listed in review.md); `null` → `unchecked`.
If anything is `disagree`: re-solve those questions once more, carefully and with code. Only if you are still sure, keep the disagreement for me to decide. Never switch `correctAnswer` yourself.

**Step 5 — validate (hard gate).**
```
python3 tools/ingest/validate.py --session-id <id> --final
```
Must print `errors 0`. It checks ids, answer index range, no leftover `[IMAGE:` token, every image file exists locally (no remote URLs), balanced `$`/`{}`/`\left\right`, non-empty explanations, no `pending`. Fix the cause (not the validator) until it passes. The only allowed exception is "image host unreachable": then say exactly that and stop at this step for the images.

**Step 6 — write the paper's README and review list.**
```
python3 tools/ingest/make_readme.py --session-id <id> --model "<your exact model name>" [--notes work/notes.md]
```
Put in `work/notes.md` (a few honest lines) anything unusual: odd data, decisions, tool bugs, things you were unsure about. The README is generated from real numbers; it records the whole path from file to JSON: format, parser, subject mapping, image URL → local file map, how explanations were obtained (source vs AI), verification result, cleanup log, how to re-run.

**Step 7 — manifest and progress.**
```
python3 tools/ingest/update_manifest.py
```

**Step 8 — update the memory.** Append one row to the table in `docs/AI_MEMORY.md` §6 (date, session id, questions, images, disagree/unchecked, lessons). If you learned a new quirk, add it to §4 (Gotchas) of that file and `docs/SOURCE_FORMAT.md`.

**Step 9 — commit.**
```
git add public/data docs tools src/data
git commit -m "data(<INST>): add <session-id> (<n> questions, <k> images, <d> to review)"
```
One commit per paper. Do not push; show me `git push` to run.

## B6. WEBSITE CONTRACT (already built into Part A — only verify)

The site must (a) load `data/<INSTITUTION>/<session-id>/questions.json` under `import.meta.env.BASE_URL`, (b) prefix every non-`http` image path with `BASE_URL`, (c) read `data/manifest.json` to enable/disable Start Exam, (d) render `explanation` as markdown. After your first paper is committed, open the site (or reason through the code) and confirm all four. If I answered "yes" to `--split-bilingual`, set `bilingual: true` for those sessions in `sessions.ts`. Fix the site code if any point is missing and note it in `docs/AI_MEMORY.md`.

## B7. WHEN I UPLOAD THE NEXT FILE

Do not restart. Re-read `docs/AI_MEMORY.md` (it may have changed), then repeat §B5 for the new file. If I upload several files at once, process them strictly one by one, each with its own commit.

## B8. REPORT FORMAT (after each paper, max 12 lines, no fluff)

```
Paper: <id>  | Format A/B | Questions n/90 | Subjects 15/15/15/15/15/15
Images: x refs → y saved locally (z failed)
Explanations: source s / AI-written a / replaced r
Answers: agree N, disagree D (Q..), unchecked U (Q..)
Source warnings: (e.g. Q2 option C: 12 vs 120 kPa — fixed/flagged)
validate --final: 0 errors | Commit: <hash> | Files: README.md, review.md written
Needs me: <the exact decisions I must make, or "nothing">
Next: send the next file.
```

## B9. TROUBLESHOOTING TABLE

| Symptom | Cause | Action |
|---|---|---|
| `unknown subject labels [...]` | new label spelling | ask me; add to `subjects.map.json` |
| Parsed count ≠ sessions.ts `totalQuestions` | file incomplete or sessions.ts wrong | report both numbers; do not edit sessions.ts |
| `file season ... wrong session id?` | I gave the wrong paper | confirm the id with me |
| File starts with `[` but is not JSON | Format A | detection handles it; if not, check `detect_format()` |
| Images failed | no network / hotlink block | `--skip-images`, later `retry_images.py`; list URLs in README |
| `\left/\right mismatch` | real LaTeX break (`\rightarrow` is fine) | repair with a logged fix |
| Re-running build wiped explanations | build resets them | re-run `merge_explanations.py` with the saved `work/explanations.json` |
| Same URL used twice | de-duplicated automatically | nothing |

## B10. DEFINITION OF DONE (all must be true)

- [ ] `questions.json` has every question; ids unique; per-subject counts match the labels
- [ ] No remote image URL and no `[IMAGE:` token anywhere; every image file exists in `images/`
- [ ] Every question has an explanation; every question has an independent AI answer or an explicit `unchecked` reason
- [ ] `validate.py --final` → 0 errors
- [ ] `README.md` and `review.md` exist in the paper folder; `source/` holds my untouched file
- [ ] `manifest.json`, `docs/PROGRESS.md`, `docs/AI_MEMORY.md` updated
- [ ] One git commit made; push command given
- [ ] Report sent in the §B8 format

---

# START (first reply of the AI)

Reply with exactly these four things, then wait:
1. Is the website already built in this repo? (yes/no, from looking at the files)
2. If no: your ~10-line summary of PART A and the list of still-missing `[[...]]` data. If yes: skip.
3. The Part B pre-flight result (5 lines, §B1).
4. One sentence confirming you read `docs/AI_MEMORY.md`, and "Send the first file." (or "Answer the questions above first.").
