import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Sparkles, Check, HelpCircle, BookOpen, Key, AlertCircle } from 'lucide-react';
import { SessionItem } from '../data/sessions';
import { getSubjectTheme } from '../data/subjects';
import { MathText } from './MarkdownMath';
import { AiTutorPanel } from './AiTutorPanel';
import { storage, UiSettings } from '../utils/storage';

import { getAdmissionRule } from '../data/admissionLogic';
import { normalizeQuestionData } from '../utils/questionData';
import { QuestionImage } from './QuestionImage';

interface QuestionBankProps {
  session: SessionItem;
  onBack: () => void;
  onStartExam: () => void;
  uiSettings: UiSettings;
  onOpenApiKeyModal: () => void;
  onOpenRulesModal?: (univId?: string) => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  session,
  onBack,
  onStartExam,
  uiSettings,
  onOpenApiKeyModal,
  onOpenRulesModal
}) => {
  const admissionRule = getAdmissionRule(session.institution, session.unit);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [bilingualLang, setBilingualLang] = useState<'bn' | 'en'>('bn');
  const [openAiTutorId, setOpenAiTutorId] = useState<string | null>(null);
  const [apiKeyToast, setApiKeyToast] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const url = `${import.meta.env.BASE_URL}data/${session.institution}/${session.id}/questions.json`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Questions file not found (404). This session may be coming soon.`);
        }
        const payload = await res.json();
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.questions) ? payload.questions : [];
        const tagged = rows.map((question: any, index: number) => ({
          ...normalizeQuestionData(question, index),
          uniId: session.institution === 'KhU' ? 'KU' : session.institution,
          unit: question.unit ?? session.unit,
          year: question.year ?? session.session,
          type: question.type ?? question.questionType ?? session.questionType
        }));
        setQuestions(tagged);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Failed to load question bank');
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [session]);

  // Unique subjects present in questions
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => { if (q.subject) set.add(q.subject); });
    return Array.from(set);
  }, [questions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (selectedSubject !== 'ALL' && q.subject !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const matchQ = (q.question || '').toLowerCase().includes(term);
        const matchExp = (q.explanation || '').toLowerCase().includes(term);
        const matchSubj = (q.subject || '').toLowerCase().includes(term);
        const matchOpt = (q.options || []).some((o: string) => o.toLowerCase().includes(term));
        if (!matchQ && !matchExp && !matchSubj && !matchOpt) return false;
      }
      return true;
    });
  }, [questions, selectedSubject, searchQuery]);

  const handleToggleAiTutor = (qId: string) => {
    const key = storage.getApiKey();
    if (!key || key.trim().length <= 10) {
      setApiKeyToast(true);
      setTimeout(() => setApiKeyToast(false), 6000);
      return;
    }
    setOpenAiTutorId(prev => prev === qId ? null : qId);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-indigo-950 pb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-[#16223B] text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sessions</span>
        </button>

        <div className="flex items-center gap-3">
          {session.bilingual && (
            <div className="flex p-1 bg-slate-100 dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-indigo-950">
              <button
                onClick={() => setBilingualLang('bn')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  bilingualLang === 'bn' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                বাংলা (BN)
              </button>
              <button
                onClick={() => setBilingualLang('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  bilingualLang === 'en' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                English (EN)
              </button>
            </div>
          )}

          <button
            onClick={onStartExam}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span>Start Strict Exam</span>
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-sky-400 uppercase tracking-wider">
          <span>{session.institution}</span>
          <span>•</span>
          <span>Session {session.session}</span>
          <span>•</span>
          <span>Question Bank & Solutions</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {session.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          Total {session.totalQuestions} questions • correct answers & explanations • direct AI Tutor
        </p>

        {/* Admission Rule Context Pill */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-[#0E172E] border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>{admissionRule.code} ভর্তি বিষয় বিন্যাস:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">আবশ্যিক: {admissionRule.compulsorySubjects.map(s => s.nameBn).join(', ')}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {admissionRule.hasOptionalChoice && admissionRule.optionalRule
                ? `ঐচ্ছিক: ${admissionRule.optionalRule.instructionBn}`
                : 'সকল বিষয় আবশ্যক (Fixed per unit)'}
            </div>
          </div>
          {onOpenRulesModal && (
            <button
              onClick={() => onOpenRulesModal(session.institution)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#15223E] border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-sky-300 font-bold text-[11px] hover:bg-indigo-50 cursor-pointer self-start sm:self-auto shrink-0 transition-colors"
            >
              ভর্তি নির্দেশিকা দেখুন
            </button>
          )}
        </div>

        {/* Search & Subject Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search question, explanation, subject or options..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#070D1D] border border-slate-300 dark:border-indigo-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Subject Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              selectedSubject === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Subjects ({questions.length})
          </button>
          {subjectsList.map(subj => {
            const theme = getSubjectTheme(subj);
            const isActive = selectedSubject === subj;
            const count = questions.filter(q => q.subject === subj).length;
            return (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                  isActive ? theme.filterActive : theme.filterInactive
                }`}
              >
                {subj} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* API Key Toast Warning */}
      {apiKeyToast && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs sm:text-sm font-bold">
              To use AI Tutor, first add your Gemini API Key from Settings.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenApiKeyModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
            >
              Add API Key
            </button>
            <button
              onClick={() => setApiKeyToast(false)}
              className="p-1.5 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="text-center py-20 space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">Loading question bank & solutions...</p>
        </div>
      )}

      {errorMsg && !loading && (
        <div className="p-8 text-center space-y-4 bg-slate-50 dark:bg-[#070D1D] rounded-3xl border border-slate-200 dark:border-indigo-950">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Questions coming soon</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{errorMsg}</p>
          <div className="pt-2">
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      )}

      {/* Question Cards List */}
      {!loading && !errorMsg && (
        <div className="space-y-6">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Showing {filteredQuestions.length} of {questions.length} questions</div>
          {filteredQuestions.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center dark:border-slate-800 dark:bg-[#080E1E]">
              <BookOpen className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">কোনো প্রশ্ন পাওয়া যায়নি</p>
              <p className="mt-1 text-xs text-slate-500">Search text বা subject filter পরিবর্তন করে আবার চেষ্টা করুন।</p>
              <button onClick={() => { setSearchQuery(''); setSelectedSubject('ALL'); }} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Clear filters</button>
            </div>
          )}
          {filteredQuestions.map((q, idx) => {
            const theme = getSubjectTheme(q.subject);
            const isAiOpen = openAiTutorId === q.id;
            const labels = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];

            return (
              <div
                key={q.id || idx}
                className={`question-card p-5 sm:p-6 rounded-3xl ${theme.border} ${theme.bgClass} shadow-sm space-y-5 transition-colors`}
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-black px-3 py-1 rounded-xl ${theme.numBadge} shadow-xs`}>
                      Question {q.number}
                    </span>
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-xl ${theme.badgeBg}`}>
                      {q.subject}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${q.type === 'Written' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'}`}>{q.type || 'MCQ'}</span>
                  </div>

                  {q.answerVerified === false || q.correctAnswer < 0 ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                      Unverified
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Verified Answer</span>
                    </span>
                  )}
                </div>

                {/* Question Stem */}
                <div className="text-slate-900 dark:text-slate-100 font-medium">
                  <MathText content={q.question} fontSize={uiSettings.questionFontPx} />
                </div>

                {/* Question Images if any */}
                {q.questionImageUrls && q.questionImageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {q.questionImageUrls.map((url: string, i: number) => (
                      <QuestionImage key={i} src={url} alt="Question diagram" className="max-h-60" />
                    ))}
                  </div>
                )}

                {/* Options List */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {q.options.map((opt: string, optIdx: number) => {
                      const isCorrect = q.correctAnswer === optIdx;
                      const label = labels[optIdx] || String.fromCharCode(65 + optIdx);
                      const optImgs: string[] = q.optionImageUrls?.[optIdx] || [];

                      return (
                        <div
                          key={optIdx}
                          className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                            isCorrect
                              ? 'border-emerald-500/70 bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-500/30'
                              : 'border-slate-200 dark:border-indigo-900/60 bg-white dark:bg-[#070D1D]'
                          }`}
                          style={{ fontSize: `${uiSettings.optionFontPx}px` }}
                        >
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {label}
                          </span>
                          <div className="flex-1 text-slate-800 dark:text-slate-200 space-y-2">
                            {opt.trim() ? <MathText content={opt} /> : optImgs.length > 0 ? <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">চিত্রভিত্তিক বিকল্প</span> : <span className="text-xs text-amber-700 dark:text-amber-300">বিকল্পের তথ্য পাওয়া যায়নি</span>}
                            {optImgs.length > 0 && (
                              <div className="flex flex-wrap items-start gap-3">
                                {optImgs.map((imgUrl: string, imgI: number) => (
                                  <QuestionImage key={imgI} src={imgUrl} alt={`Option ${label}`} className="max-h-52 sm:max-h-64" />
                                ))}
                              </div>
                            )}
                          </div>
                          {isCorrect && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation & Solution Block */}
                {q.explanation && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#070D1D]/90 border border-slate-200 dark:border-indigo-900 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-sky-400 uppercase tracking-wider">
                      <BookOpen className="w-4 h-4" />
                      <span>Explanation & Solution</span>
                    </div>
                    <MathText content={q.explanation} fontSize={uiSettings.explanationFontPx} />
                  </div>
                )}

                {/* AI Tutor Toggle Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleToggleAiTutor(q.id)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAiOpen ? 'Close AI Tutor' : 'Ask AI Tutor Coach'}</span>
                  </button>
                </div>

                {/* AI Tutor Panel */}
                {isAiOpen && (
                  <AiTutorPanel
                    question={q}
                    onClose={() => setOpenAiTutorId(null)}
                    onOpenApiKeyModal={onOpenApiKeyModal}
                    explanationFontSize={uiSettings.explanationFontPx}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
