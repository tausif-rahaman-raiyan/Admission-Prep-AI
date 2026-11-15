import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, AlertTriangle, Send, RefreshCcw, Award, Check, X, ShieldAlert, Sparkles, Key, HelpCircle, Info, ShieldCheck, ChevronRight } from 'lucide-react';
import { SessionItem } from '../data/sessions';
import { getSubjectTheme } from '../data/subjects';
import { MathText } from './MarkdownMath';
import { AiTutorPanel } from './AiTutorPanel';
import { storage, UiSettings, ExamAttempt } from '../utils/storage';
import { getAdmissionRule, UniversityAdmissionRule } from '../data/admissionLogic';
import { AdmissionLogicModal } from './AdmissionLogicModal';

interface ExamViewProps {
  session: SessionItem;
  onBack: () => void;
  uiSettings: UiSettings;
  onOpenApiKeyModal: () => void;
}

function readSavedExam(sessionId: string): { answers?: Record<string, number>; endTimestamp?: number; started?: boolean } | null {
  try { const raw = localStorage.getItem('admission_app_exam_' + sessionId); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export const ExamView: React.FC<ExamViewProps> = ({
  session,
  onBack,
  uiSettings,
  onOpenApiKeyModal
}) => {
  const admissionRule: UniversityAdmissionRule = useMemo(() => {
    return getAdmissionRule(session.institution, session.unit);
  }, [session.institution, session.unit]);

  // Modal for full admission rules
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  // Initial subjects setup based on admission rule
  const compulsoryNames = useMemo(() => {
    return admissionRule.compulsorySubjects.map(s => s.name);
  }, [admissionRule]);

  // Selected subjects state: ONLY compulsory subjects are pre-selected!
  // Optional subjects start UNSELECTED as requested: "ঐচ্ছিক বিষয় নির্বাচন - age theke select kore dio na"
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() => {
    return admissionRule.compulsorySubjects.map(s => s.name);
  });

  // Selected RU option if mode === 'ru_c_groups': null by default (unselected)
  const [ruOptionChoice, setRuOptionChoice] = useState<'RU_COMBINED' | 'RU_MATH' | 'RU_BIO' | null>(null);

  const [examStarted, setExamStarted] = useState(() => readSavedExam(session.id)?.started ?? !session.subjectPickMode);
  const [resumedFromSave, setResumedFromSave] = useState(() => Boolean(readSavedExam(session.id)?.started));

  // Questions and Exam State
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>(() => readSavedExam(session.id)?.answers || {}); // qId -> optionIndex
  const [lockedQuestions, setLockedQuestions] = useState<Record<string, boolean>>({}); // qId -> true once answered
  const [submitted, setSubmitted] = useState(false);
  const [endTimestamp, setEndTimestamp] = useState(() => readSavedExam(session.id)?.endTimestamp || Date.now() + session.durationMinutes * 60_000);
  const [timeRemaining, setTimeRemaining] = useState(() => Math.max(0, Math.ceil(((readSavedExam(session.id)?.endTimestamp || Date.now() + session.durationMinutes * 60_000) - Date.now()) / 1000)));
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>('ALL');
  const [openAiTutorId, setOpenAiTutorId] = useState<string | null>(null);
  const [apiKeyToast, setApiKeyToast] = useState(false);

  // Load questions
  useEffect(() => {
    async function loadExamQuestions() {
      setLoading(true);
      setLoadError(null);
      try {
        const url = `${import.meta.env.BASE_URL}data/${session.institution}/${session.id}/questions.json`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Questions file not found. No sample questions will be substituted.');
        }
        let data = await res.json();
        data = Array.isArray(data) ? data.map((question: any) => ({ ...question, uniId: session.institution === 'KhU' ? 'KU' : session.institution, unit: question.unit ?? session.unit, year: question.year ?? session.session, type: question.type ?? question.questionType ?? session.questionType })) : [];

        // If subjectPickMode, filter by picked subjects
        if (session.subjectPickMode && selectedSubjects.length > 0) {
          data = data.filter((q: any) => selectedSubjects.includes(q.subject));
        }
        setQuestions(data);
      } catch (err: any) {
        console.warn(err);
        setQuestions([]);
        setLoadError(err?.message || 'এই সেশনের প্রশ্ন পাওয়া যায়নি।');
      } finally {
        setLoading(false);
      }
    }
    loadExamQuestions();
  }, [session, selectedSubjects, examStarted]);

  // Absolute end timestamp keeps the timer accurate when the tab sleeps.
  useEffect(() => {
    if (!examStarted || submitted || loading) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) handleSubmitExam();
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [examStarted, submitted, loading, endTimestamp]);

  useEffect(() => {
    if (submitted) return;
    try { localStorage.setItem('admission_app_exam_' + session.id, JSON.stringify({ answers, endTimestamp, started: examStarted })); } catch {}
  }, [answers, endTimestamp, examStarted, submitted, session.id]);

  useEffect(() => {
    if (!examStarted || submitted || loading) return;
    const warnBeforeExit = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warnBeforeExit);
    return () => window.removeEventListener('beforeunload', warnBeforeExit);
  }, [examStarted, submitted, loading]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h}:${remM < 10 ? '0' : ''}${remM}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (qId: string, optIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setLockedQuestions(prev => ({ ...prev, [qId]: true }));
  };

  const getExamScoring = (mcqCount: number) => {
    if (admissionRule.id === 'RU') {
      const perMark = 1.25;
      return { perMark, totalPossible: mcqCount > 0 ? Number((mcqCount * perMark).toFixed(2)) : session.totalMarks };
    }
    if (session.institution === 'DU' && session.questionType === 'MCQ') {
      if (session.totalMarks === session.totalQuestions) {
        return { perMark: 1, totalPossible: mcqCount > 0 ? mcqCount : session.totalMarks };
      }
      if (mcqCount === 60 && (session.totalMarks === 60 || session.totalMarks === 61)) {
        return { perMark: 1, totalPossible: 60 };
      }
    }
    const perMark = mcqCount > 0 ? session.totalMarks / mcqCount : 1;
    return { perMark, totalPossible: session.totalMarks };
  };

  const handleSubmitExam = () => {
    if (submitted) return;
    setSubmitted(true);
    try { localStorage.removeItem('admission_app_exam_' + session.id); } catch {}
    setResumedFromSave(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Compute score based on university format
    const mcqQuestions = questions.filter(q => q.options && q.options.length > 0 && q.correctAnswer >= 0);
    const mcqCount = mcqQuestions.length;

    const { perMark, totalPossible } = getExamScoring(mcqCount);
    const negative = session.negativeMarking || admissionRule.negativeMarking || 0.25;

    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    mcqQuestions.forEach(q => {
      const chosen = answers[q.id];
      if (chosen === undefined) {
        skipped++;
      } else if (chosen === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const rawScore = (correct * perMark) - (wrong * negative * perMark);
    const finalScore = Number(rawScore.toFixed(2));

    // Save attempt to history
    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      sessionId: session.id,
      title: session.title,
      institution: session.institution,
      session: session.session,
      questionType: session.questionType,
      score: finalScore,
      totalMarks: totalPossible,
      totalQuestions: questions.length,
      correctCount: correct,
      incorrectCount: wrong,
      unattemptedCount: skipped,
      timeTakenSeconds: (session.durationMinutes * 60) - timeRemaining
    };
    storage.saveExamAttempt(attempt);
  };

  const handleRetake = () => {
    setAnswers({});
    setLockedQuestions({});
    setSubmitted(false);
    setEndTimestamp(Date.now() + session.durationMinutes * 60_000);
    setTimeRemaining(session.durationMinutes * 60);
    setResumedFromSave(false);
    try { localStorage.removeItem('admission_app_exam_' + session.id); } catch {}
    setOpenAiTutorId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Subjects present in current exam questions
  const examSubjects = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => { if (q.subject) set.add(q.subject); });
    return Array.from(set);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (activeSubjectTab === 'ALL') return questions;
    return questions.filter(q => q.subject === activeSubjectTab);
  }, [questions, activeSubjectTab]);

  const answeredCount = Object.keys(answers).length;

  // Eligibility evaluation based on selected subjects
  const eligibilityStatus = useMemo(() => {
    const hasMath = selectedSubjects.includes('Mathematics');
    const hasBio = selectedSubjects.includes('Biology');
    const hasPhy = selectedSubjects.includes('Physics');
    const hasChem = selectedSubjects.includes('Chemistry');

    return {
      engineering: hasMath && hasPhy,
      biology: hasBio && hasChem,
      mathDropped: !hasMath,
      bioDropped: !hasBio
    };
  }, [selectedSubjects]);

  // Subject Pick Handlers for Different University Modes
  const handleToggleOptionalSubject = (subjName: string) => {
    // If it's a compulsory subject, cannot deselect
    if (compulsoryNames.includes(subjName)) return;

    if (selectedSubjects.includes(subjName)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subjName));
    } else {
      // Determine max allowed subjects
      let maxOptional = 2;
      if (admissionRule.mode === 'cu_pick_three') maxOptional = 3;
      if (admissionRule.mode === 'jnu_pick_one') maxOptional = 1;

      const currentOptionalCount = selectedSubjects.filter(s => !compulsoryNames.includes(s)).length;
      if (currentOptionalCount < maxOptional) {
        setSelectedSubjects([...selectedSubjects, subjName]);
      }
    }
  };

  const handleRuOptionSelect = (choice: 'RU_COMBINED' | 'RU_MATH' | 'RU_BIO') => {
    setRuOptionChoice(choice);
    const base = ['Physics', 'Chemistry', 'ICT'];
    if (choice === 'RU_MATH') {
      setSelectedSubjects([...base, 'Mathematics']);
    } else if (choice === 'RU_BIO') {
      setSelectedSubjects([...base, 'Biology']);
    } else {
      setSelectedSubjects([...base, 'Biology', 'Mathematics']);
    }
  };

  // Check if selection is valid to start exam
  const isSelectionValid = useMemo(() => {
    if (!session.subjectPickMode) return true;

    if (admissionRule.mode === 'ru_c_groups') {
      return ruOptionChoice !== null && selectedSubjects.length >= 4;
    }
    if (admissionRule.mode === 'cu_pick_three') {
      // 1 compulsory (English) + 3 optional = 4 subjects
      return selectedSubjects.includes('English') && selectedSubjects.length === 4;
    }
    if (admissionRule.mode === 'jnu_pick_one') {
      // 2 compulsory (Phy, Chem) + 1 optional = 3 subjects
      return selectedSubjects.includes('Physics') && selectedSubjects.includes('Chemistry') && selectedSubjects.length === 3;
    }
    // DU, GST, CoU: 2 compulsory + 2 optional = 4 subjects
    return selectedSubjects.length === 4;
  }, [session.subjectPickMode, admissionRule.mode, selectedSubjects, ruOptionChoice]);

  const getStartButtonLabel = () => {
    if (!session.subjectPickMode) return 'Start Examination';
    if (admissionRule.mode === 'ru_c_groups') {
      if (!ruOptionChoice) return 'গ্রুপ-বি এর ১টি বিকল্প বাছুন';
      return 'Start Examination';
    }
    const currentOptionalCount = selectedSubjects.filter(s => !compulsoryNames.includes(s)).length;
    let requiredOptional = 2;
    if (admissionRule.mode === 'cu_pick_three') requiredOptional = 3;
    if (admissionRule.mode === 'jnu_pick_one') requiredOptional = 1;

    const remaining = requiredOptional - currentOptionalCount;
    if (remaining > 0) {
      return `আরো ${remaining}টি বিষয় নির্বাচন করুন`;
    }
    return 'Start Examination';
  };

  // ==========================================
  // SUBJECT PICK MODAL SCREEN (§8.1)
  // ==========================================
  if (session.subjectPickMode && !examStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-indigo-950 pb-4">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-[#16223B] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sessions</span>
          </button>

          <button
            onClick={() => setRulesModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-sky-300 font-black text-xs flex items-center gap-2 cursor-pointer transition-colors border border-indigo-200 dark:border-indigo-800"
          >
            <Info className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
            <span>২০২৫-২৬ বিষয় বণ্টন ও যোগ্যতা নিয়মাবলী</span>
          </button>
        </div>

        {/* Title and Intro */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider">
              {admissionRule.code} • {admissionRule.unit}
            </span>
            <span className="text-xs font-bold text-slate-500">
              Exam Format: {admissionRule.examFormat}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {session.title} — বিষয় নির্বাচন ও মানবণ্টন
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            সরকারি ভর্তি পরীক্ষার নিয়মানুযায়ী আপনার আবশ্যিক ও ঐচ্ছিক বিষয়সমূহ নিশ্চিত করুন। আপনার পছন্দের ওপর ভিত্তি করে ইঞ্জিনিয়ারিং ও জীববিজ্ঞান অনুষদের যোগ্যতা স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
          </p>
        </div>

        {/* SECTION A: MANDATORY / COMPULSORY SUBJECTS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>আবশ্যিক বিষয়সমূহ (Compulsory — Must Answer)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Pre-ticked & Locked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {admissionRule.compulsorySubjects.map(sub => (
              <div
                key={sub.id}
                className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#07241A] border-2 border-emerald-300 dark:border-emerald-700/80 flex items-center justify-between shadow-xs"
              >
                <div>
                  <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {sub.nameBn} ({sub.name})
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">
                    {sub.marks} Marks {sub.questions ? `• ${sub.questions} Qs` : ''}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Mandatory
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION B: OPTIONAL SUBJECT CHOICES */}
        {admissionRule.hasOptionalChoice && admissionRule.optionalRule && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>ঐচ্ছিক বিষয় নির্বাচন (Optional / Choice Selection)</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {admissionRule.optionalRule.instructionBn}
              </p>
            </div>

            {/* If RU C Unit: Show 3 distinct radio group options */}
            {admissionRule.mode === 'ru_c_groups' ? (
              <div className="grid grid-cols-1 gap-3">
                {admissionRule.optionalRule.options.map(opt => {
                  const isSelected = ruOptionChoice === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleRuOptionSelect(opt.id as any)}
                      className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-100/90 dark:bg-purple-950/70 border-purple-600 dark:border-purple-400 shadow-md ring-2 ring-purple-400/30'
                          : 'bg-white dark:bg-[#0B1325] border-slate-200 dark:border-indigo-950 hover:border-purple-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-400'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {opt.labelBn}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                          {opt.eligibilityEffectBn}
                        </p>
                      </div>

                      <div className="text-right shrink-0 pl-6 sm:pl-0">
                        <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 font-mono">
                          {opt.marks} Marks
                        </span>
                        <div className="text-[10px] text-slate-400">{opt.questions} Questions</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* DU, CU, GST, CoU, JnU: Checkbox / Tag Selection */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {admissionRule.optionalRule.options.map(opt => {
                  const isSelected = selectedSubjects.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleToggleOptionalSubject(opt.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-purple-100/90 dark:bg-purple-950/70 border-purple-600 dark:border-purple-400 shadow-md ring-2 ring-purple-400/30'
                          : 'bg-white dark:bg-[#0B1325] border-slate-200 dark:border-indigo-950 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {opt.labelBn} ({opt.label})
                          </div>
                          <div className="text-[10px] text-purple-700 dark:text-purple-300 font-bold mt-0.5">
                            {opt.marks} Marks {opt.questions ? `• ${opt.questions} Qs` : ''}
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'}`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {opt.eligibilityEffectBn}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION C: REAL-TIME DEPARTMENTAL ELIGIBILITY PREVIEW WIDGET */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-[#1E1405] border border-amber-200 dark:border-amber-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>অনুষদ ও বিভাগীয় ভর্তি যোগ্যতা পূর্বাভাস (Departmental Eligibility Preview)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              Updates live with your subject choices
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Engineering Status */}
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              eligibilityStatus.engineering
                ? 'bg-emerald-50 dark:bg-[#07241A] border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-[#2B0E14] border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200'
            }`}>
              {eligibilityStatus.engineering ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-black text-xs">
                  ইঞ্জিনিয়ারিং ও প্রযুক্তি অনুষদ (Engineering, CSE, EEE): {eligibilityStatus.engineering ? '✅ উপযুক্ত (Eligible)' : '❌ অনুপযুক্ত (Not Eligible)'}
                </div>
                <div className="text-[11px] mt-0.5 opacity-90 leading-tight">
                  {eligibilityStatus.engineering
                    ? 'উচ্চতর গণিত ও পদার্থবিজ্ঞান উত্তর করায় সকল প্রকৌশল অনুষদে আবেদনের জন্য বিবেচনা করা হবে।'
                    : 'উচ্চতর গণিত উত্তর না করায় সিএসই, ইইই বা প্রকৌশল অনুষদে ভর্তির সুযোগ থাকবে না।'}
                </div>
              </div>
            </div>

            {/* Life Science Status */}
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              eligibilityStatus.biology
                ? 'bg-emerald-50 dark:bg-[#07241A] border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-[#241706] border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              {eligibilityStatus.biology ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-black text-xs">
                  জীববিজ্ঞান ও ফার্মেসি অনুষদ (Pharmacy, Biology): {eligibilityStatus.biology ? '✅ উপযুক্ত (Eligible)' : '⚠️ সীমিত/অনুপযুক্ত (Restricted)'}
                </div>
                <div className="text-[11px] mt-0.5 opacity-90 leading-tight">
                  {eligibilityStatus.biology
                    ? 'জীববিজ্ঞান ও রসায়ন উত্তর করায় ফার্মেসি, অণুজীববিজ্ঞান ও কৃষি অনুষদে বিবেচিত হবেন।'
                    : 'জীববিজ্ঞান উত্তর না করায় ফার্মেসি বা জীবন বিজ্ঞান অনুষদ পাওয়া যাবে না।'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION D: SUMMARY & START EXAMINATION BUTTON */}
        <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-[#070D1D] border border-slate-200 dark:border-indigo-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
              নির্বাচিত বিষয়সমূহ: <span className="text-indigo-600 dark:text-sky-400 font-black">{selectedSubjects.join(' • ')}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              মোট বিষয়: {selectedSubjects.length}টি • মোট মার্কস: {session.totalMarks} • সময়: {session.durationMinutes} মিনিট
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setSelectedSubjects(admissionRule.compulsorySubjects.map(s => s.name));
                setRuOptionChoice(null);
              }}
              className="px-4 py-3 rounded-xl border border-slate-300 dark:border-indigo-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              Reset
            </button>
            <button
              disabled={!isSelectionValid}
              onClick={() => {
                try {
                  localStorage.setItem(`admission_app_selected_subjects_${session.institution}_v2`, JSON.stringify(selectedSubjects));
                } catch {}
                setEndTimestamp(Date.now() + session.durationMinutes * 60_000);
                setTimeRemaining(session.durationMinutes * 60);
                setExamStarted(true);
              }}
              className="flex-1 sm:flex-initial px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>{getStartButtonLabel()}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admission Logic Modal */}
        <AdmissionLogicModal
          isOpen={rulesModalOpen}
          onClose={() => setRulesModalOpen(false)}
          initialUniversityId={session.institution}
        />
      </div>
    );
  }

  // ==========================================
  // RUNNING EXAM & RESULT REPORT SCREEN (§8.2)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050811] pb-24">
      {/* Sticky Exam Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#070B14]/95 backdrop-blur-md border-b border-slate-200 dark:border-indigo-950 shadow-xs">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-1">{session.title}</h2>
              <div className="text-[10px] text-indigo-600 dark:text-sky-400 font-bold">
                Answered: {answeredCount} / {questions.length} • Format: {admissionRule.markPerQuestion} Mark/Q
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Rules Button */}
            <button
              onClick={() => setRulesModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0F172A] dark:hover:bg-[#16223B] border border-slate-200 dark:border-indigo-900 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-400" />
              <span>Rules</span>
            </button>

            {/* Timer Chip */}
            <div className={`px-3.5 py-1.5 rounded-xl border font-mono font-extrabold text-xs sm:text-sm flex items-center gap-2 ${
              timeRemaining < 120
                ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-700 animate-pulse'
                : timeRemaining < 600 ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700' : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-[#121933] dark:text-sky-300 dark:border-indigo-800'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTimer(timeRemaining)}</span>
            </div>

            {!submitted ? (
              <button
                onClick={handleSubmitExam}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-colors"
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={handleRetake}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {resumedFromSave && !submitted && <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">আগের পরীক্ষাটি পুনরায় চালু হয়েছে — উত্তর ও বাকি সময় পুনরুদ্ধার করা হয়েছে। <button onClick={() => setResumedFromSave(false)} className="ml-3 underline">ঠিক আছে</button></div>}
        {loadError && !loading && !submitted && <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"><h3 className="font-bold">প্রশ্ন লোড করা যায়নি</h3><p className="mt-2 text-sm">{loadError}</p><button onClick={onBack} className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">ফিরে যান</button></div>}

        {/* SUBMITTED RESULT REPORT CARD (§8.3) */}
        {submitted && (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#080E1E] border-2 border-indigo-200 dark:border-indigo-900/80 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-indigo-950 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-300 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-sky-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                    Final Result & Evaluation Report
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calculated under strict {admissionRule.code} examination criteria (–{admissionRule.negativeMarking} negative marking).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRulesModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0F172A] text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  View Admission Criteria
                </button>
                <button
                  onClick={handleRetake}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
              </div>
            </div>

            {/* Score Metric Tiles */}
            {(() => {
              const mcqQuestions = questions.filter(q => q.options && q.options.length > 0 && q.correctAnswer >= 0);
              const mcqCount = mcqQuestions.length;
              const { perMark, totalPossible } = getExamScoring(mcqCount);
              const negative = session.negativeMarking || admissionRule.negativeMarking || 0.25;

              let correct = 0;
              let wrong = 0;
              let skipped = 0;

              mcqQuestions.forEach(q => {
                const chosen = answers[q.id];
                if (chosen === undefined) skipped++;
                else if (chosen === q.correctAnswer) correct++;
                else wrong++;
              });

              const rawScore = (correct * perMark) - (wrong * negative * perMark);
              const score = Math.max(0, Number(rawScore.toFixed(2)));
              const accuracy = (correct + wrong) > 0 ? Number(((correct / (correct + wrong)) * 100).toFixed(1)) : 0;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-[#121B33] border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
                    <div className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-sky-300 font-mono">
                      {score} <span className="text-xs text-slate-400">/ {totalPossible}</span>
                    </div>
                    <div className="text-[10px] font-black uppercase text-indigo-600 dark:text-sky-400">Final Score</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-[#07241A] border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                    <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                      {correct}
                    </div>
                    <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Correct</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-[#2B0E14] border border-rose-200 dark:border-rose-800 text-center space-y-1">
                    <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
                      {wrong}
                    </div>
                    <div className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">Wrong (–{(wrong * negative * perMark).toFixed(2)})</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#0E172A] border border-slate-200 dark:border-indigo-950 text-center space-y-1">
                    <div className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">
                      {skipped}
                    </div>
                    <div className="text-[10px] font-black uppercase text-slate-500">Skipped</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50 dark:bg-[#1F0F33] border border-purple-200 dark:border-purple-800 text-center space-y-1 col-span-2 sm:col-span-1">
                    <div className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
                      {accuracy}%
                    </div>
                    <div className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Accuracy</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Subject Filter Tabs */}
        {examSubjects.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-[#080E1E] rounded-2xl border border-slate-200 dark:border-indigo-950">
            <button
              onClick={() => setActiveSubjectTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeSubjectTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ALL ({questions.length})
            </button>
            {examSubjects.map(subj => {
              const count = questions.filter(q => q.subject === subj).length;
              const isSelected = activeSubjectTab === subj;
              return (
                <button
                  key={subj}
                  onClick={() => setActiveSubjectTab(subj)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {subj} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Question Cards List */}
        <div className="space-y-6">
          {filteredQuestions.map((q, qIndex) => {
            const chosenOpt = answers[q.id];
            const isAnswered = chosenOpt !== undefined;
            const isLocked = lockedQuestions[q.id];
            const hasOptions = q.options && q.options.length > 0;
            const isCorrect = isAnswered && chosenOpt === q.correctAnswer;
            const theme = getSubjectTheme(q.subject);

            return (
              <div
                key={q.id || qIndex}
                className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#080E1E] border-2 transition-all space-y-4 ${
                  submitted
                    ? isCorrect
                      ? 'border-emerald-400 dark:border-emerald-600/80 shadow-md shadow-emerald-500/5'
                      : isAnswered
                        ? 'border-rose-400 dark:border-rose-600/80 shadow-md shadow-rose-500/5'
                        : 'border-slate-200 dark:border-indigo-950'
                    : isLocked
                      ? 'border-indigo-400 dark:border-indigo-600/80 shadow-md shadow-indigo-500/5'
                      : 'border-slate-200 dark:border-indigo-950'
                }`}
              >
                {/* Header row: Question #, Subject badge, status */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-indigo-950 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-center">
                      #{q.number || qIndex + 1}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider ${theme.badgeBg}`}>
                      {q.subject || 'General'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!submitted && isLocked && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-sky-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase">
                        Locked
                      </span>
                    )}

                    {submitted && (() => {
                      const mcqCount = questions.filter(qq => qq.options && qq.options.length > 0 && qq.correctAnswer >= 0).length;
                      const { perMark } = getExamScoring(mcqCount);
                      const negative = session.negativeMarking || admissionRule.negativeMarking || 0.25;
                      const penalty = Number((negative * perMark).toFixed(2));
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isAnswered
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {isCorrect ? `+${Number(perMark.toFixed(2))} Correct` : isAnswered ? `–${penalty} Wrong` : 'Skipped'}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Question Body */}
                <div style={{ fontSize: `${uiSettings.questionFontPx}px` }} className="text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                  <MathText content={q.question || ''} />
                </div>

                {/* Question Images if any */}
                {q.questionImageUrls && q.questionImageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {q.questionImageUrls.map((url: string, i: number) => (
                      <img
                        key={i}
                        src={url.startsWith('http') ? url : `${import.meta.env.BASE_URL}${url}`}
                        alt="Question diagram"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="max-h-60 rounded-xl border border-slate-200 dark:border-indigo-900 bg-white p-1 shadow-sm object-contain"
                      />
                    ))}
                  </div>
                )}

                {/* MCQ Options */}
                {hasOptions ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {q.options.map((opt: string, optIdx: number) => {
                      const isChosen = chosenOpt === optIdx;
                      const isRightOption = optIdx === q.correctAnswer;
                      const optImgs: string[] = q.optionImageUrls?.[optIdx] || [];

                      let optClass = 'bg-slate-50/70 dark:bg-[#070D1C] border-slate-200 dark:border-indigo-950 text-slate-800 dark:text-slate-200 hover:border-indigo-400';
                      let labelClass = 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

                      if (submitted) {
                        if (isRightOption) {
                          optClass = 'bg-emerald-50 dark:bg-[#07241A] border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500';
                          labelClass = 'bg-emerald-600 text-white';
                        } else if (isChosen && !isRightOption) {
                          optClass = 'bg-rose-50 dark:bg-[#2B0E14] border-rose-500 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500';
                          labelClass = 'bg-rose-600 text-white';
                        } else {
                          optClass = 'opacity-50 bg-slate-50 dark:bg-[#070D1C] border-slate-200 dark:border-indigo-950';
                        }
                      } else if (isChosen) {
                        optClass = 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-sky-200 font-bold ring-1 ring-indigo-500';
                        labelClass = 'bg-indigo-600 text-white';
                      } else if (isLocked) {
                        optClass = 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-[#070D1C] border-slate-200 dark:border-indigo-950';
                      }

                      const optionLabel = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          style={{ fontSize: `${uiSettings.optionFontPx}px` }}
                          className={`p-3 rounded-2xl border-2 flex items-start gap-3 transition-all cursor-pointer ${optClass}`}
                        >
                          <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${labelClass}`}>
                            {optionLabel}
                          </span>
                          <div className="flex-1 leading-snug space-y-2">
                            {opt && <MarkdownMath content={opt} />}
                            {optImgs.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {optImgs.map((imgUrl: string, imgI: number) => (
                                  <img
                                    key={imgI}
                                    src={imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.BASE_URL}${imgUrl}`}
                                    alt={`Option ${optionLabel}`}
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    className="max-h-36 rounded-lg border border-slate-200 dark:border-indigo-900 bg-white p-1 object-contain"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300">
                    ✍️ Written Question — Solve step-by-step on paper, then inspect the official verified solution below after submitting.
                  </div>
                )}

                {/* Solution & Explanation (Shown after submit) */}
                {submitted && q.explanation && (
                  <div className="pt-3 border-t border-slate-100 dark:border-indigo-950 space-y-3">
                    <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#061814] border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                      <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Official Solution & Explanation</span>
                      </div>
                      <div style={{ fontSize: `${uiSettings.explanationFontPx}px` }} className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        <MarkdownMath content={q.explanation} />
                      </div>
                    </div>

                    {/* AI Tutor Toggle Button */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          const key = storage.getApiKey();
                          if (!key || key.trim().length <= 10) {
                            setApiKeyToast(true);
                            setTimeout(() => setApiKeyToast(false), 6000);
                            return;
                          }
                          setOpenAiTutorId(prev => prev === q.id ? null : q.id);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{openAiTutorId === q.id ? 'Close AI Tutor' : 'Ask AI Tutor'}</span>
                      </button>

                      {openAiTutorId === q.id && (
                        <div className="mt-3">
                          <AiTutorPanel
                            question={q}
                            onClose={() => setOpenAiTutorId(null)}
                            onOpenApiKeyModal={onOpenApiKeyModal}
                            explanationFontSize={uiSettings.explanationFontPx}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* API Key Missing Toast */}
      {apiKeyToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 border border-indigo-500 animate-in slide-in-from-bottom duration-200">
          <Key className="w-5 h-5 text-indigo-400" />
          <div className="text-xs">
            <span className="font-bold">API Key Required:</span> Configure Gemini key for AI coaching.
          </div>
          <button
            onClick={() => { setApiKeyToast(false); onOpenApiKeyModal(); }}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
          >
            Add Key
          </button>
          <button onClick={() => setApiKeyToast(false)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rules Modal */}
      <AdmissionLogicModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        initialUniversityId={session.institution}
      />
    </div>
  );
};
