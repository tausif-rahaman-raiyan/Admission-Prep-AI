import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, RefreshCcw, Award, Check, X, ShieldAlert, Sparkles, Key, HelpCircle, Info } from 'lucide-react';
import { SessionItem } from '../data/sessions';
import { getSubjectTheme } from '../data/subjects';
import { MathText } from './MarkdownMath';
import { AiTutorPanel } from './AiTutorPanel';
import { storage, UiSettings, ExamAttempt } from '../utils/storage';
import { getAdmissionRule, UniversityAdmissionRule } from '../data/admissionLogic';
import { AdmissionLogicModal } from './AdmissionLogicModal';
import { normalizeQuestionData } from '../utils/questionData';
import { QuestionImage } from './QuestionImage';

interface ExamViewProps {
  session: SessionItem;
  onBack: () => void;
  uiSettings: UiSettings;
  onOpenApiKeyModal: () => void;
  promptResumeOnStart?: boolean;
}

type WrittenSelfCheck = 'correct' | 'partial' | 'review';

interface SavedExamState {
  answers?: Record<string, number>;
  writtenSolved?: Record<string, boolean>;
  writtenSelfChecks?: Record<string, WrittenSelfCheck>;
  lockedQuestions?: Record<string, boolean>;
  flaggedQuestions?: Record<string, boolean>;
  remainingSeconds?: number;
  endTimestamp?: number;
  started?: boolean;
  paused?: boolean;
  selectedSubjects?: string[];
  ruOptionChoice?: 'RU_COMBINED' | 'RU_MATH' | 'RU_BIO' | null;
  savedAt?: string;
}

function readSavedExam(sessionId: string): SavedExamState | null {
  try {
    const raw = localStorage.getItem('admission_app_exam_' + sessionId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getSavedRemainingSeconds(saved: SavedExamState | null, defaultMinutes: number): number {
  if (!saved) return defaultMinutes * 60;
  if (typeof saved.remainingSeconds === 'number') {
    return Math.max(0, Math.ceil(saved.remainingSeconds));
  }
  if (typeof saved.endTimestamp === 'number') {
    return Math.max(0, Math.ceil((saved.endTimestamp - Date.now()) / 1000));
  }
  return defaultMinutes * 60;
}

export const ExamView: React.FC<ExamViewProps> = ({
  session,
  onBack,
  uiSettings,
  onOpenApiKeyModal,
  promptResumeOnStart = false
}) => {
  const admissionRule: UniversityAdmissionRule = useMemo(() => {
    return getAdmissionRule(session.institution, session.unit);
  }, [session.institution, session.unit]);

  const initialSavedExam = useMemo(() => readSavedExam(session.id), [session.id]);
  const hasResumableExam = Boolean(
    initialSavedExam &&
    initialSavedExam.started &&
    getSavedRemainingSeconds(initialSavedExam, session.durationMinutes) > 0
  );
  const shouldShowResumePrompt = Boolean(promptResumeOnStart && hasResumableExam);
  const shouldRestoreActiveExam = Boolean(!promptResumeOnStart && hasResumableExam && initialSavedExam);
  const initialRemainingSeconds = shouldRestoreActiveExam && initialSavedExam
    ? Math.max(1, getSavedRemainingSeconds(initialSavedExam, session.durationMinutes))
    : session.durationMinutes * 60;

  // Modal for full admission rules & exit/resume prompts
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const [resumePromptOpen, setResumePromptOpen] = useState<boolean>(shouldShowResumePrompt);

  // Initial subjects setup based on admission rule
  const compulsoryNames = useMemo(() => {
    return admissionRule.compulsorySubjects.map(s => s.name);
  }, [admissionRule]);

  // Selected subjects state: ONLY compulsory subjects are pre-selected!
  // Optional subjects start UNSELECTED as requested: "ঐচ্ছিক বিষয় নির্বাচন - age theke select kore dio na"
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(() => {
    if (shouldRestoreActiveExam && Array.isArray(initialSavedExam?.selectedSubjects) && initialSavedExam.selectedSubjects.length > 0) {
      return initialSavedExam.selectedSubjects;
    }
    return admissionRule.compulsorySubjects.map(s => s.name);
  });

  // Selected RU option if mode === 'ru_c_groups': null by default (unselected)
  const [ruOptionChoice, setRuOptionChoice] = useState<'RU_COMBINED' | 'RU_MATH' | 'RU_BIO' | null>(() => {
    return shouldRestoreActiveExam ? (initialSavedExam?.ruOptionChoice ?? null) : null;
  });

  const [examStarted, setExamStarted] = useState(() => {
    if (shouldRestoreActiveExam) return true;
    return !shouldShowResumePrompt && !session.subjectPickMode;
  });

  // Questions and Exam State
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    return shouldRestoreActiveExam ? (initialSavedExam?.answers || {}) : {};
  }); // qId -> optionIndex
  const [writtenSolved, setWrittenSolved] = useState<Record<string, boolean>>(() => {
    return shouldRestoreActiveExam ? (initialSavedExam?.writtenSolved || {}) : {};
  }); // qId -> solved on paper
  const [writtenSelfChecks, setWrittenSelfChecks] = useState<Record<string, WrittenSelfCheck>>(() => {
    return shouldRestoreActiveExam ? (initialSavedExam?.writtenSelfChecks || {}) : {};
  });
  const [lockedQuestions, setLockedQuestions] = useState<Record<string, boolean>>(() => {
    if (!shouldRestoreActiveExam) return {};
    const restoredLocked: Record<string, boolean> = { ...(initialSavedExam?.lockedQuestions || {}) };
    Object.keys(initialSavedExam?.answers || {}).forEach(qId => {
      restoredLocked[qId] = true;
    });
    return restoredLocked;
  }); // qId -> true once answered
  const [submitted, setSubmitted] = useState(false);
  const [endTimestamp, setEndTimestamp] = useState(() => Date.now() + initialRemainingSeconds * 1000);
  const [timeRemaining, setTimeRemaining] = useState(() => initialRemainingSeconds);
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>('ALL');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>(() => {
    return shouldRestoreActiveExam ? (initialSavedExam?.flaggedQuestions || {}) : {};
  });
  const [openAiTutorId, setOpenAiTutorId] = useState<string | null>(null);
  const [apiKeyToast, setApiKeyToast] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [examStarted, resumePromptOpen]);

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
        const payload = await res.json();
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.questions) ? payload.questions : [];
        let data = rows.map((question: any, index: number) => ({
          ...normalizeQuestionData(question, index),
          uniId: session.institution === 'KhU' ? 'KU' : session.institution,
          unit: question.unit ?? session.unit,
          year: question.year ?? session.session,
          type: question.type ?? question.questionType ?? session.questionType
        }));

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
    if (resumePromptOpen || !examStarted || submitted || loading || exitPromptOpen) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) handleSubmitExam();
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [resumePromptOpen, examStarted, submitted, loading, endTimestamp, exitPromptOpen]);

  useEffect(() => {
    if (resumePromptOpen || submitted || !examStarted) return;
    const remaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
    try {
      localStorage.setItem('admission_app_exam_' + session.id, JSON.stringify({
        answers,
        writtenSolved,
        writtenSelfChecks,
        lockedQuestions,
        flaggedQuestions,
        remainingSeconds: remaining,
        started: true,
        paused: false,
        selectedSubjects,
        ruOptionChoice,
        savedAt: new Date().toISOString()
      }));
    } catch {}
  }, [resumePromptOpen, answers, writtenSolved, writtenSelfChecks, lockedQuestions, flaggedQuestions, endTimestamp, examStarted, submitted, selectedSubjects, ruOptionChoice, session.id]);

  useEffect(() => {
    if (resumePromptOpen || !examStarted || submitted || loading) return;
    const saveCurrentExamProgress = () => {
      const remaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
      try {
        localStorage.setItem('admission_app_exam_' + session.id, JSON.stringify({
          answers,
          writtenSolved,
          writtenSelfChecks,
          lockedQuestions,
          flaggedQuestions,
          remainingSeconds: remaining,
          started: true,
          paused: false,
          selectedSubjects,
          ruOptionChoice,
          savedAt: new Date().toISOString()
        }));
      } catch {}
    };
    window.addEventListener('beforeunload', saveCurrentExamProgress);
    window.addEventListener('pagehide', saveCurrentExamProgress);
    window.addEventListener('focus', saveCurrentExamProgress);
    return () => {
      window.removeEventListener('beforeunload', saveCurrentExamProgress);
      window.removeEventListener('pagehide', saveCurrentExamProgress);
      window.removeEventListener('focus', saveCurrentExamProgress);
    };
  }, [resumePromptOpen, examStarted, submitted, loading, answers, writtenSolved, writtenSelfChecks, lockedQuestions, flaggedQuestions, endTimestamp, selectedSubjects, ruOptionChoice, session.id]);

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
    if (submitted || answers[qId] !== undefined || lockedQuestions[qId]) return;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setLockedQuestions(prev => ({ ...prev, [qId]: true }));
  };

  const getPassRequirement = (totalPossible: number) => {
    const unitKey = (session.unit || (session.institution === 'AGRI' ? 'AGRI' : 'A')).toUpperCase().replace(' UNIT', '');
    const criteria = admissionRule.passCriteriaByUnit?.[unitKey]
      || admissionRule.passCriteriaByUnit?.[admissionRule.id]
      || admissionRule.passCriteriaByUnit?.A;
    if (!criteria) return null;
    let required = criteria.overallPassMark;
    if (admissionRule.id === 'DU') {
      if (session.questionType === 'MCQ' && totalPossible <= 60) required = criteria.mcqPassMark || 24;
      else if (session.questionType === 'Written' && totalPossible <= 40) required = criteria.writtenPassMark || 12;
    }
    return {
      required: Number((required * (totalPossible / criteria.totalMarks)).toFixed(2)),
      label: admissionRule.id === 'DU' && session.questionType === 'MCQ' && totalPossible <= 60
        ? 'MCQ pass mark (24/60)'
        : admissionRule.id === 'DU' && session.questionType === 'Written' && totalPossible <= 40
          ? 'Written pass mark (12/40)'
          : `Overall pass mark (${criteria.overallPassMark}/${criteria.totalMarks})`
    };
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
    setExitPromptOpen(false);
    setSubmitted(true);
    try { localStorage.removeItem('admission_app_exam_' + session.id); } catch {}
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

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
    setWrittenSolved({});
    setWrittenSelfChecks({});
    setLockedQuestions({});
    setSubmitted(false);
    setEndTimestamp(Date.now() + session.durationMinutes * 60_000);
    setTimeRemaining(session.durationMinutes * 60);
    try { localStorage.removeItem('admission_app_exam_' + session.id); } catch {}
    setOpenAiTutorId(null);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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

  useEffect(() => { setActiveQuestionIndex(0); }, [activeSubjectTab]);

  useEffect(() => {
    if (resumePromptOpen || !examStarted || exitPromptOpen || submitted || loading) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      if (event.key === 'ArrowRight') setActiveQuestionIndex(index => Math.min(filteredQuestions.length - 1, index + 1));
      if (event.key === 'ArrowLeft') setActiveQuestionIndex(index => Math.max(0, index - 1));
      const current = filteredQuestions[activeQuestionIndex];
      if (!current) return;
      if (event.key.toLowerCase() === 'f') setFlaggedQuestions(previous => ({ ...previous, [current.id]: !previous[current.id] }));
      if (/^[1-4]$/.test(event.key)) handleSelectOption(current.id, Number(event.key) - 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [resumePromptOpen, examStarted, exitPromptOpen, filteredQuestions, activeQuestionIndex, submitted, loading]);


  const answeredCount = Object.keys(answers).length + Object.values(writtenSolved).filter(Boolean).length;

  const requestExit = () => {
    if (submitted) { onBack(); return; }
    const remaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
    setTimeRemaining(remaining);
    setEndTimestamp(Date.now() + remaining * 1000);
    setExitPromptOpen(true);
  };

  const continueExam = () => {
    setEndTimestamp(Date.now() + timeRemaining * 1000);
    setExitPromptOpen(false);
  };

  const saveAndExit = () => {
    const finalRemaining = Math.max(0, timeRemaining);
    try {
      localStorage.setItem('admission_app_exam_' + session.id, JSON.stringify({
        answers,
        writtenSolved,
        writtenSelfChecks,
        lockedQuestions,
        flaggedQuestions,
        remainingSeconds: finalRemaining,
        started: true,
        paused: true,
        selectedSubjects,
        ruOptionChoice,
        savedAt: new Date().toISOString()
      }));
    } catch {}
    setExitPromptOpen(false);
    onBack();
  };

  const handleResumeSavedExam = () => {
    const saved = readSavedExam(session.id);
    if (!saved) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      setResumePromptOpen(false);
      setExamStarted(!session.subjectPickMode);
      return;
    }
    const savedAnswers = saved.answers || {};
    const restoredLocked: Record<string, boolean> = { ...(saved.lockedQuestions || {}) };
    Object.keys(savedAnswers).forEach(qId => {
      restoredLocked[qId] = true;
    });
    const remainingSecs = Math.max(1, getSavedRemainingSeconds(saved, session.durationMinutes));
    const restoredSubjects = Array.isArray(saved.selectedSubjects) && saved.selectedSubjects.length > 0
      ? saved.selectedSubjects
      : admissionRule.compulsorySubjects.map(s => s.name);

    setAnswers(savedAnswers);
    setWrittenSolved(saved.writtenSolved || {});
    setWrittenSelfChecks(saved.writtenSelfChecks || {});
    setLockedQuestions(restoredLocked);
    setFlaggedQuestions(saved.flaggedQuestions || {});
    setSelectedSubjects(restoredSubjects);
    setRuOptionChoice(saved.ruOptionChoice ?? null);
    setTimeRemaining(remainingSecs);
    setEndTimestamp(Date.now() + remainingSecs * 1000);
    setActiveSubjectTab('ALL');
    setActiveQuestionIndex(0);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setResumePromptOpen(false);
    setExamStarted(true);
  };

  const handleStartFreshExam = () => {
    try {
      localStorage.removeItem('admission_app_exam_' + session.id);
    } catch {}
    setAnswers({});
    setWrittenSolved({});
    setWrittenSelfChecks({});
    setLockedQuestions({});
    setFlaggedQuestions({});
    setSelectedSubjects(admissionRule.compulsorySubjects.map(s => s.name));
    setRuOptionChoice(null);
    setActiveSubjectTab('ALL');
    setActiveQuestionIndex(0);
    setTimeRemaining(session.durationMinutes * 60);
    setEndTimestamp(Date.now() + session.durationMinutes * 60_000);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setResumePromptOpen(false);
    setExamStarted(!session.subjectPickMode);
  };

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
  // RESUME OR START NEW PROMPT SCREEN
  // ==========================================
  if (resumePromptOpen && initialSavedExam) {
    const savedAnsCount =
      Object.keys(initialSavedExam.answers || {}).length +
      Object.values(initialSavedExam.writtenSolved || {}).filter(Boolean).length;
    const savedRemSecs = getSavedRemainingSeconds(initialSavedExam, session.durationMinutes);
    const savedSubjs = Array.isArray(initialSavedExam.selectedSubjects) ? initialSavedExam.selectedSubjects : [];

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#050811] px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-indigo-900/70 dark:bg-[#0A1224] space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-indigo-950 pb-4">
            <button
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-[#16223B] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sessions</span>
            </button>
            <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
              Paused Exam Found
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-sky-300">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Resume Previous Exam?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You exited <span className="font-bold text-slate-900 dark:text-white">{session.title}</span> before submitting. Would you like to continue where you left off or start a new attempt?
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm font-bold text-slate-800 dark:text-slate-200">
              <span>Saved Answers</span>
              <span className="font-mono text-indigo-600 dark:text-sky-400">{savedAnsCount} answered</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Time Remaining</span>
              <span className="font-mono font-bold">{formatTimer(savedRemSecs)}</span>
            </div>
            {savedSubjs.length > 0 && (
              <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Subjects: <span className="font-bold text-slate-700 dark:text-slate-200">{savedSubjs.join(' · ')}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleResumeSavedExam}
              className="w-full min-h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm font-black text-white shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Resume from Where I Left Off</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleStartFreshExam}
              className="w-full min-h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-[#16223B] px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Start New Exam{session.subjectPickMode ? ' (Choose Subjects)' : ''}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                  const selectedOptionalCount = selectedSubjects.filter(subject => !compulsoryNames.includes(subject)).length;
                  const optionalLimit = admissionRule.mode === 'cu_pick_three' ? 3 : admissionRule.mode === 'jnu_pick_one' ? 1 : 2;
                  const isDisabled = !isSelected && selectedOptionalCount >= optionalLimit;
                  return (
                    <div
                      key={opt.id}
                      aria-disabled={isDisabled}
                      onClick={() => { if (!isDisabled) handleToggleOptionalSubject(opt.id); }}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-2 ${isDisabled ? 'cursor-not-allowed opacity-40 grayscale bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'cursor-pointer'} ${
                        isSelected
                          ? 'bg-purple-100/90 dark:bg-purple-950/70 border-purple-600 dark:border-purple-400 shadow-md ring-2 ring-purple-400/30'
                          : !isDisabled ? 'bg-white dark:bg-[#0B1325] border-slate-200 dark:border-indigo-950 hover:border-purple-400' : ''
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

        {/* Compact eligibility summary */}
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          <span className={`rounded-xl border px-3 py-2 ${eligibilityStatus.engineering ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200' : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900'}`}>Engineering: {eligibilityStatus.engineering ? 'Eligible' : 'Not selected'}</span>
          <span className={`rounded-xl border px-3 py-2 ${eligibilityStatus.biology ? 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-200' : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900'}`}>Biology / Pharmacy: {eligibilityStatus.biology ? 'Eligible' : 'Not selected'}</span>
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
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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
          initialUniversityId={admissionRule.id}
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
              onClick={submitted ? onBack : requestExit}
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
              const score = Number(rawScore.toFixed(2));
              const passRequirement = getPassRequirement(totalPossible);
              let subjectMinimumsPassed = true;
              const unitKey = (session.unit || '').toUpperCase().replace(' UNIT', '');
              const subjectMinimums = admissionRule.passCriteriaByUnit?.[unitKey]?.subjectMinimums || {};
              Object.entries(subjectMinimums).forEach(([subjectName, minimum]) => {
                const subjectQuestions = mcqQuestions.filter(q => String(q.subject || '').toLowerCase() === subjectName.toLowerCase());
                if (subjectQuestions.length) {
                  const subjectCorrect = subjectQuestions.filter(q => answers[q.id] === q.correctAnswer).length;
                  const subjectWrong = subjectQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== q.correctAnswer).length;
                  const subjectScore = subjectCorrect * perMark - subjectWrong * negative * perMark;
                  if (subjectScore < minimum) subjectMinimumsPassed = false;
                }
              });
              const passed = passRequirement && mcqCount > 0 ? score >= passRequirement.required && subjectMinimumsPassed : null;
              const accuracy = (correct + wrong) > 0 ? Number(((correct / (correct + wrong)) * 100).toFixed(1)) : 0;

              const writtenCorrectCount = questions.filter(q => !(q.options && q.options.length > 0 && q.correctAnswer >= 0) && writtenSelfChecks[q.id] === 'correct').length;
              const writtenPartialCount = questions.filter(q => !(q.options && q.options.length > 0 && q.correctAnswer >= 0) && writtenSelfChecks[q.id] === 'partial').length;
              const writtenReviewCount = questions.filter(q => !(q.options && q.options.length > 0 && q.correctAnswer >= 0) && writtenSelfChecks[q.id] === 'review').length;
              const writtenPaperSolvedCount = questions.filter(q => !(q.options && q.options.length > 0 && q.correctAnswer >= 0) && writtenSolved[q.id]).length;

              return (
                <div className="space-y-3">
                {passRequirement && mcqCount > 0 && (
                  <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${passed ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30'}`}>
                    <div>
                      <div className={`text-sm font-black ${passed ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>{passed ? 'PASS — পাশ করেছেন' : 'NOT PASSED — পাশের শর্ত পূরণ হয়নি'}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">{passRequirement.label} • প্রয়োজন {passRequirement.required} / {totalPossible}</div>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-lg ${passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>{passed ? 'QUALIFIED' : 'BELOW PASS MARK'}</span>
                  </div>
                )}
                {mcqCount === 0 ? (
                  <>
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 dark:border-indigo-800/70 dark:bg-indigo-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-black text-indigo-900 dark:text-sky-300">
                          Written Paper Practice — Self-Check Solutions Unlocked
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          নিচে প্রতিটি প্রশ্নের ধাপে ধাপে হাতে-কলমে সমাধান মিলিয়ে আপনার খাতার উত্তর Self-Check করুন। {passRequirement ? `Pass requirement: ${passRequirement.required} / ${totalPossible}.` : ''}
                        </div>
                      </div>
                      <span className="text-xs font-black px-3 py-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
                        {writtenCorrectCount + writtenPartialCount + writtenReviewCount} / {questions.length} Checked
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-[#121B33] border border-indigo-200 dark:border-indigo-800 text-center space-y-1">
                        <div className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-sky-300 font-mono">
                          {writtenPaperSolvedCount} <span className="text-xs text-slate-400">/ {questions.length}</span>
                        </div>
                        <div className="text-[10px] font-black uppercase text-indigo-600 dark:text-sky-400">Solved on Paper</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-[#07241A] border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                        <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                          {writtenCorrectCount}
                        </div>
                        <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Self-Check Correct</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center space-y-1">
                        <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                          {writtenPartialCount}
                        </div>
                        <div className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Partial Credit</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-[#2B0E14] border border-rose-200 dark:border-rose-800 text-center space-y-1">
                        <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
                          {writtenReviewCount}
                        </div>
                        <div className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">Needs Review</div>
                      </div>
                    </div>
                  </>
                ) : (
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
                )}
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
                  onClick={() => { setActiveSubjectTab(subj); setActiveQuestionIndex(0); }}
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

        {/* All filtered questions remain visible on both mobile and desktop. */}
        {/* Question Cards List */}
        <div className="space-y-6">
          {filteredQuestions.map((q, qIndex) => {
            const chosenOpt = answers[q.id];
            const isAnswered = chosenOpt !== undefined;
            const isLocked = lockedQuestions[q.id] || isAnswered;
            const hasOptions = q.options && q.options.length > 0;
            const isCorrect = isAnswered && chosenOpt === q.correctAnswer;
            const isPaperSolved = Boolean(writtenSolved[q.id]);
            const selfCheck = writtenSelfChecks[q.id];
            const theme = getSubjectTheme(q.subject);

            return (
              <div
                key={q.id || qIndex}
                className={`question-card p-5 sm:p-6 rounded-3xl border-2 transition-all space-y-4 ${
                  submitted
                    ? !hasOptions
                      ? selfCheck === 'correct'
                        ? 'bg-emerald-50 dark:bg-[#07241A] border-emerald-400 dark:border-emerald-600/80 shadow-md shadow-emerald-500/5'
                        : selfCheck === 'partial'
                          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600/80 shadow-md shadow-amber-500/5'
                          : selfCheck === 'review'
                            ? 'bg-rose-50 dark:bg-[#2B0E14] border-rose-400 dark:border-rose-600/80 shadow-md shadow-rose-500/5'
                            : 'bg-white dark:bg-[#080E1E] border-slate-200 dark:border-indigo-950'
                      : isCorrect
                        ? 'bg-emerald-50 dark:bg-[#07241A] border-emerald-400 dark:border-emerald-600/80 shadow-md shadow-emerald-500/5'
                        : isAnswered
                          ? 'bg-rose-50 dark:bg-[#2B0E14] border-rose-400 dark:border-rose-600/80 shadow-md shadow-rose-500/5'
                          : 'bg-white dark:bg-[#080E1E] border-slate-200 dark:border-indigo-950'
                    : `${theme.bgClass} ${theme.border} ${(isLocked || isPaperSolved) ? 'ring-1 ring-indigo-500/20' : ''}`
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
                    <span className={`rounded-md px-2 py-1 text-[10px] font-black ${q.type === 'Written' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'}`}>{q.type || 'MCQ'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!submitted && <button onClick={() => setFlaggedQuestions(previous => ({ ...previous, [q.id]: !previous[q.id] }))} className={`min-h-9 rounded-lg px-2.5 text-[10px] font-black whitespace-nowrap ${flaggedQuestions[q.id] ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{flaggedQuestions[q.id] ? 'Flagged' : 'Flag for review'}</button>}
                    {!submitted && isLocked && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-sky-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase">
                        Locked
                      </span>
                    )}

                    {submitted && !hasOptions && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        selfCheck === 'correct'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : selfCheck === 'partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : selfCheck === 'review'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isPaperSolved
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-sky-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {selfCheck === 'correct'
                          ? 'Self-Check: Correct'
                          : selfCheck === 'partial'
                            ? 'Self-Check: Partial'
                            : selfCheck === 'review'
                              ? 'Needs Review'
                              : isPaperSolved
                                ? 'Solved on Paper'
                                : 'Pending Self-Check'}
                      </span>
                    )}

                    {submitted && hasOptions && (() => {
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
                      <QuestionImage key={i} src={url} alt="Question diagram" className="max-h-60" />
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
                            {opt.trim() ? <MathText content={opt} /> : optImgs.length > 0 ? <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">চিত্রভিত্তিক বিকল্প</span> : <span className="text-xs text-amber-700 dark:text-amber-300">বিকল্পের তথ্য পাওয়া যায়নি</span>}
                            {optImgs.length > 0 && (
                              <div className="flex flex-wrap items-start gap-3">
                                {optImgs.map((imgUrl: string, imgI: number) => (
                                  <QuestionImage key={imgI} src={imgUrl} alt={`Option ${optionLabel}`} className="max-h-52 sm:max-h-64" />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : !submitted ? (
                  <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">
                      খাতায় ধাপে ধাপে সমাধান করুন। Submit করার পর প্রতিটি প্রশ্নের হাতের হিসাবসহ সমাধান খুলে যাবে।
                    </div>
                    <button
                      type="button"
                      onClick={() => setWrittenSolved(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className={`min-h-10 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 ${
                        isPaperSolved
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                          : 'bg-white dark:bg-[#0B1325] hover:bg-slate-100 dark:hover:bg-[#15223E] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-indigo-800'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isPaperSolved ? 'Solved on Paper' : 'Mark Solved on Paper'}</span>
                    </button>
                  </div>
                ) : null}

                {/* Solution & Explanation (Shown after submit) */}
                {submitted && q.explanation && (
                  <div className="pt-3 border-t border-slate-100 dark:border-indigo-950 space-y-3">
                    <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#061814] border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                      <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Official Step-by-Step Solution</span>
                      </div>
                      <div style={{ fontSize: `${uiSettings.explanationFontPx}px` }} className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        <MathText content={q.explanation} />
                      </div>
                    </div>

                    {!hasOptions && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B1325] border border-slate-200 dark:border-indigo-900/70">
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                          খাতার উত্তরের সাথে মিলিয়ে Self-Check করুন:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setWrittenSelfChecks(prev => ({ ...prev, [q.id]: 'correct' }))}
                            className={`min-h-9 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-colors cursor-pointer ${
                              selfCheck === 'correct'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-[#0F172A] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                            }`}
                          >
                            Correct
                          </button>
                          <button
                            type="button"
                            onClick={() => setWrittenSelfChecks(prev => ({ ...prev, [q.id]: 'partial' }))}
                            className={`min-h-9 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-colors cursor-pointer ${
                              selfCheck === 'partial'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-white dark:bg-[#0F172A] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-amber-500'
                            }`}
                          >
                            Partial
                          </button>
                          <button
                            type="button"
                            onClick={() => setWrittenSelfChecks(prev => ({ ...prev, [q.id]: 'review' }))}
                            className={`min-h-9 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-colors cursor-pointer ${
                              selfCheck === 'review'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white dark:bg-[#0F172A] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-rose-500'
                            }`}
                          >
                            Needs Review
                          </button>
                        </div>
                      </div>
                    )}

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

      {exitPromptOpen && !submitted && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-exam-title"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700/80 dark:bg-[#0A1224]"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-[#0F172A]/70">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="exit-exam-title" className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    Exit Exam?
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Your progress will be saved safely.
                  </p>
                </div>
              </div>
              <button
                onClick={continueExam}
                aria-label="Close exit dialog"
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="text-xs font-bold text-indigo-600 dark:text-sky-400 truncate">
                {session.title}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Answered</span>
                  </div>
                  <div className="mt-1 text-lg font-black font-mono text-slate-900 dark:text-white">
                    {answeredCount} <span className="text-xs font-bold text-slate-400">/ {questions.length}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-sky-400" />
                    <span>Time Left</span>
                  </div>
                  <div className="mt-1 text-lg font-black font-mono text-slate-900 dark:text-white">
                    {formatTimer(timeRemaining)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-xs sm:text-sm leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                Exiting pauses the timer and keeps your answers saved. When you return later, you can resume from here or start a new exam.
              </div>

              {/* Action Buttons: Yes Exit in red box first, No Continue at the last */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={saveAndExit}
                  className="min-h-12 w-full rounded-xl border-2 border-rose-600 bg-rose-600 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 hover:border-rose-500 transition-colors cursor-pointer"
                >
                  Yes, Exit Exam
                </button>
                <button
                  onClick={continueExam}
                  className="min-h-12 w-full rounded-xl border-2 border-indigo-600 bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 hover:border-indigo-500 transition-colors cursor-pointer"
                >
                  No, Continue Exam
                </button>
              </div>
            </div>
          </div>
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
