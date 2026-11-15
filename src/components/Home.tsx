import React, { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { Search, Sparkles, Key, BookOpen, ArrowRight, Layers, FileText, Info, X } from 'lucide-react';
import { siteConfig } from '../data/siteConfig';
import { institutions } from '../data/institutions';
import { sessions, SessionItem } from '../data/sessions';
import { getUniversity } from '../data/universities';

interface HomeProps {
  manifestPapers: Record<string, any>;
  selectedInstitution: string;
  onSelectInstitution: (id: string) => void;
  selectedUnit: string | null;
  onSelectUnit: (unit: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onStartExam: (session: SessionItem) => void;
  onOpenQuestionBank: (session: SessionItem) => void;
  onOpenApiKeyModal: () => void;
  onOpenRulesModal: (univId?: string) => void;
}

const MAIN_UNIVERSITIES = ['DU', 'RU', 'JU', 'CU', 'GST', 'CoU', 'JnU', 'KU'];

const PALETTES = [
  {
    cardBg: "bg-gradient-to-br from-blue-100/90 via-blue-50/60 to-white dark:from-[#0C1E3E] dark:via-[#09152B] dark:to-[#060D1B]",
    border: "border-2 border-blue-300 dark:border-blue-500/50 hover:border-blue-500 dark:hover:border-blue-400 shadow-md shadow-blue-500/10",
    badge: "bg-blue-600 text-white",
    metricBox: "bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50",
    accentText: "text-blue-700 dark:text-blue-300",
    startBtn: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20",
    seeBtn: "bg-white hover:bg-blue-50 dark:bg-[#0C1E3E] text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60"
  },
  {
    cardBg: "bg-gradient-to-br from-purple-100/90 via-purple-50/60 to-white dark:from-[#21103B] dark:via-[#160B28] dark:to-[#0B0616]",
    border: "border-2 border-purple-300 dark:border-purple-500/50 hover:border-purple-500 dark:hover:border-purple-400 shadow-md shadow-purple-500/10",
    badge: "bg-purple-600 text-white",
    metricBox: "bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50",
    accentText: "text-purple-700 dark:text-purple-300",
    startBtn: "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20",
    seeBtn: "bg-white hover:bg-purple-50 dark:bg-[#21103B] text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60"
  },
  {
    cardBg: "bg-gradient-to-br from-amber-100/90 via-amber-50/60 to-white dark:from-[#2C1B08] dark:via-[#1D1206] dark:to-[#0F0A04]",
    border: "border-2 border-amber-300 dark:border-amber-500/50 hover:border-amber-500 dark:hover:border-amber-400 shadow-md shadow-amber-500/10",
    badge: "bg-amber-600 text-white",
    metricBox: "bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50",
    accentText: "text-amber-800 dark:text-amber-300",
    startBtn: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20",
    seeBtn: "bg-white hover:bg-amber-50 dark:bg-[#2C1B08] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60"
  },
  {
    cardBg: "bg-gradient-to-br from-fuchsia-100/90 via-fuchsia-50/60 to-white dark:from-[#2D0E33] dark:via-[#1E0A22] dark:to-[#100514]",
    border: "border-2 border-fuchsia-300 dark:border-fuchsia-500/50 hover:border-fuchsia-500 dark:hover:border-fuchsia-400 shadow-md shadow-fuchsia-500/10",
    badge: "bg-fuchsia-600 text-white",
    metricBox: "bg-fuchsia-50/90 dark:bg-fuchsia-950/40 border border-fuchsia-200 dark:border-fuchsia-800/50",
    accentText: "text-fuchsia-700 dark:text-fuchsia-300",
    startBtn: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-fuchsia-600/20",
    seeBtn: "bg-white hover:bg-fuchsia-50 dark:bg-[#2D0E33] text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-300 dark:border-fuchsia-700/60"
  },
  {
    cardBg: "bg-gradient-to-br from-cyan-100/90 via-cyan-50/60 to-white dark:from-[#082635] dark:via-[#061A24] dark:to-[#040E15]",
    border: "border-2 border-cyan-300 dark:border-cyan-500/50 hover:border-cyan-500 dark:hover:border-cyan-400 shadow-md shadow-cyan-500/10",
    badge: "bg-cyan-600 text-white",
    metricBox: "bg-cyan-50/90 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50",
    accentText: "text-cyan-800 dark:text-cyan-300",
    startBtn: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20",
    seeBtn: "bg-white hover:bg-cyan-50 dark:bg-[#082635] text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700/60"
  },
  {
    cardBg: "bg-gradient-to-br from-emerald-100/90 via-emerald-50/60 to-white dark:from-[#07261C] dark:via-[#051A13] dark:to-[#030E0A]",
    border: "border-2 border-emerald-300 dark:border-emerald-500/50 hover:border-emerald-500 dark:hover:border-emerald-400 shadow-md shadow-emerald-500/10",
    badge: "bg-emerald-600 text-white",
    metricBox: "bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50",
    accentText: "text-emerald-700 dark:text-emerald-300",
    startBtn: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20",
    seeBtn: "bg-white hover:bg-emerald-50 dark:bg-[#07261C] text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60"
  }
];

export const Home: React.FC<HomeProps> = ({
  manifestPapers,
  selectedInstitution,
  onSelectInstitution,
  selectedUnit,
  onSelectUnit,
  searchQuery,
  onSearchChange,
  onStartExam,
  onOpenQuestionBank,
  onOpenApiKeyModal,
  onOpenRulesModal
}) => {
  const [showUniversitySheet, setShowUniversitySheet] = useState(false);
  const [universitySearch, setUniversitySearch] = useState('');
  const sessionSectionRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const universityFuse = useMemo(() => new Fuse(institutions, {
    keys: [{ name: 'nameBn', weight: 2 }, { name: 'nameEn', weight: 1 }, { name: 'code', weight: 1.5 }],
    threshold: 0.34,
    ignoreLocation: true,
  }), []);
  const otherUniversities = useMemo(() => institutions.filter(uni => !MAIN_UNIVERSITIES.includes(uni.id)), []);
  const searchableUniversities = universitySearch.trim()
    ? universityFuse.search(universitySearch).map(result => result.item).filter(item => !MAIN_UNIVERSITIES.includes(item.id))
    : otherUniversities;


  const currentUniversity = getUniversity(selectedInstitution);
  const availableUnits = useMemo(() => {
    const rules = currentUniversity?.units.filter(rule => rule.unit !== 'যাচাই করা হয়নি').map(rule => rule.unit) || [];
    const papers = sessions.filter(session => (currentUniversity?.dataIds || [selectedInstitution]).includes(session.institution))
      .map(session => session.unit).filter((unit): unit is string => Boolean(unit));
    return Array.from(new Set([...rules, ...papers]));
  }, [currentUniversity, selectedInstitution]);

  const filteredSessions = useMemo(() => {
    if (!currentUniversity?.hasQuestions) return [];
    return sessions.filter(session => {
      if (!(currentUniversity.dataIds || [currentUniversity.id]).includes(session.institution)) return false;
      if (selectedUnit && session.unit !== selectedUnit) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (![session.title, session.session, session.description, session.institution].some(value => value.toLowerCase().includes(query))) return false;
      }
      return true;
    });
  }, [currentUniversity, selectedUnit, searchQuery]);

  const firstAvailableSession = useMemo(() => {
    return filteredSessions.find(s => manifestPapers[s.id]);
  }, [filteredSessions, manifestPapers]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    requestAnimationFrame(() => {
      const section = sessionSectionRef.current;
      if (!section) return;
      const targetTop = section.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.32;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    });
  }, [selectedInstitution]);

  const selectUniversity = (id: string) => {
    onSelectInstitution(id);
    onSelectUnit(null);
    setShowUniversitySheet(false);
    setUniversitySearch('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Section (§4.1) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-100/80 via-white to-sky-100/70 dark:from-[#0B132B] dark:via-[#080D1A] dark:to-[#040711] py-8 sm:py-12 px-4 sm:px-8 rounded-3xl shadow-xl border border-indigo-200 dark:border-indigo-900/40 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-sky-300 text-[11px] sm:text-xs font-bold uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{siteConfig.heroBadge}</span>
        </div>

        <div className="space-y-2 max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-slate-100">
            {siteConfig.heroTitleLine1} <br />
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-sky-400 dark:via-indigo-300 dark:to-sky-200 bg-clip-text text-transparent">
              {siteConfig.heroTitleGradientLine2}
            </span>
          </h1>
          <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {siteConfig.heroParagraph}
          </p>
        </div>

        {/* Search & Action Row */}
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={siteConfig.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#070D1D] border border-slate-300 dark:border-indigo-950 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          {firstAvailableSession && (
            <button
              onClick={() => onStartExam(firstAvailableSession)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <span>Start Strict Exam</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onOpenRulesModal(selectedInstitution)}
            className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-sky-300 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shrink-0"
          >
            <Info className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
            <span>ভর্তি মানবণ্টন</span>
          </button>
          <button
            onClick={onOpenApiKeyModal}
            className="px-4 py-3 bg-slate-100 dark:bg-[#0E172A] border border-slate-300 dark:border-indigo-900/60 text-indigo-700 dark:text-sky-300 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-[#16223B] transition-colors cursor-pointer shrink-0"
          >
            <Key className="w-4 h-4" />
            <span>AI Key</span>
          </button>
        </div>

        {/* Hero Stat Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-3xl mx-auto">
          {siteConfig.heroStats.map((st, idx) => {
            const themes = [
              "bg-blue-50/90 dark:bg-[#0C1933] border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-sky-400",
              "bg-amber-50/90 dark:bg-[#231608] border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400",
              "bg-purple-50/90 dark:bg-[#1B0F2E] border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400",
              "bg-indigo-50/90 dark:bg-[#121638] border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400"
            ];
            const cls = themes[idx % themes.length];
            return (
              <div key={idx} className={`p-3 rounded-xl border ${cls} shadow-xs`}>
                <div className="text-base sm:text-xl font-black">{st.value}</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">{st.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Compact university selector */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-600 dark:text-sky-400" /><span>বিশ্ববিদ্যালয় নির্বাচন করুন</span></h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">বিশ্ববিদ্যালয় নির্বাচন করে ভর্তি পরীক্ষার প্রশ্ন দেখুন</p>
          </div>
          <button onClick={() => setShowUniversitySheet(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-sky-300"><Layers className="h-4 w-4" /> Other Uni</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {institutions.filter(inst => MAIN_UNIVERSITIES.includes(inst.id)).map(inst => {
            const uni = getUniversity(inst.id);
            const active = selectedInstitution === inst.id;
            return <button key={inst.id} type="button" onClick={() => selectUniversity(inst.id)} aria-pressed={active} className={"min-h-[82px] rounded-2xl border-2 p-3 text-left transition-all " + (active ? "border-indigo-500 bg-indigo-50 shadow-md dark:border-sky-400 dark:bg-indigo-950/60" : "border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-[#0B1325] dark:hover:border-indigo-700")}>
              <div className="flex items-center justify-between gap-2"><span className="rounded-lg px-2.5 py-1 text-xs font-black text-white" style={{ background: "linear-gradient(135deg, " + (uni?.brand[0] || "#475569") + ", " + (uni?.brand[1] || "#94a3b8") + ")" }}>{inst.code}</span><span className={"text-[9px] font-bold " + (inst.hasQuestions ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")}>{inst.hasQuestions ? "প্রশ্ন আছে" : ""}</span></div>
              <div className="mt-2 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">{inst.nameBn}</div>
            </button>;
          })}
        </div>

        {availableUnits.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-1" aria-label="University unit selector">
            <span className="text-xs font-bold text-slate-500">ইউনিট</span>
            {availableUnits.map(unit => <button key={unit} onClick={() => onSelectUnit(selectedUnit === unit ? null : unit)} aria-pressed={selectedUnit === unit} className={"min-h-10 px-4 py-2 rounded-xl text-xs font-bold " + (selectedUnit === unit ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700")}>{unit} Unit</button>)}
          </div>
        )}

        {currentUniversity?.hasQuestions && currentUniversity.units.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-sky-50/60 to-white dark:from-[#0B152C] dark:via-[#091122] dark:to-[#070D1A] border border-indigo-200 dark:border-indigo-900/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] sm:text-xs font-black">{currentUniversity.short} • {currentUniversity.units.find(unit => unit.unit === (selectedUnit || currentUniversity.units[0].unit))?.label}</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">বিষয় বণ্টন ও অনুষদ যোগ্যতা ({currentUniversity.units[0].year})</span>
              </div>
              {(() => {
                const rule = currentUniversity.units.find(unit => unit.unit === (selectedUnit || currentUniversity.units[0].unit));
                if (!rule?.verified) return <p className="text-xs text-amber-700 dark:text-amber-300">এই ইউনিটের বিষয় ও নম্বর বণ্টন যাচাই করা হয়নি।</p>;
                return <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"><b className="text-emerald-700 dark:text-emerald-400">আবশ্যিক: </b>{rule.compulsory.map(subject => subject.subject + " (" + subject.marks + ")").join(", ")} <b className="ml-2 text-purple-700 dark:text-purple-400">ঐচ্ছিক: </b>{rule.optionalPick?.note || "প্রযোজ্য নয়"}</div>;
              })()}
            </div>
            <button onClick={() => onOpenRulesModal(selectedInstitution)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer"><Info className="w-3.5 h-3.5" />সম্পূর্ণ মানবণ্টন নির্দেশিকা দেখুন</button>
          </div>
        )}
      </section>

      {/* University session list */}
      <section ref={sessionSectionRef} className="scroll-mt-24 space-y-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">{currentUniversity?.nameBn || 'ভর্তি পরীক্ষার প্রশ্ন'}</h2>{selectedUnit && <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-sky-300">{selectedUnit} Unit</span>}</div>

        {/* Session Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredSessions.map((session, index) => {
            const palette = PALETTES[index % PALETTES.length];
            const hasQuestions = Boolean(manifestPapers[session.id]);

            return (
              <div
                key={session.id}
                className={`p-5 rounded-3xl ${palette.cardBg} ${palette.border} flex flex-col justify-between space-y-4 transition-all hover:scale-[1.01]`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${palette.badge}`}>
                        {session.institution} • {session.session} {session.unit ? `• Unit ${session.unit}` : ''}
                      </span>
                    </div>
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                      session.questionType === 'Written' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950'
                    }`}>
                      {session.questionType}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {session.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {session.description}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    disabled={!hasQuestions}
                    onClick={() => onOpenQuestionBank(session)}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${palette.seeBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>See question</span>
                  </button>

                  <button
                    disabled={!hasQuestions}
                    onClick={() => onStartExam(session)}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm ${palette.startBtn} disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <span>Start Exam</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSessions.length === 0 && (
          <div className="text-center py-16 space-y-3 bg-slate-50 dark:bg-[#070D1D] rounded-3xl border border-slate-200 dark:border-indigo-950">
            <FileText className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{currentUniversity?.hasQuestions ? 'No matching sessions found' : 'এই বিশ্ববিদ্যালয়ের প্রশ্ন শীঘ্রই যুক্ত হবে'}</h3>
            <p className="text-xs text-slate-500">{currentUniversity?.hasQuestions ? 'Try changing your search keywords.' : 'প্রশ্নপত্র যুক্ত হলে এখানে দেখা যাবে।'}</p>
          </div>
        )}
      </section>

      {showUniversitySheet && (
        <div className="fixed inset-0 z-[100]">
          <button aria-label="Close university list" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowUniversitySheet(false)} />
          <section role="dialog" aria-modal="true" aria-label="Other universities" className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0A1224] pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div><h2 className="text-lg font-black">Other Universities</h2><p className="text-xs text-slate-500">বাংলা বা ইংরেজি নামে খুঁজুন</p></div>
              <button onClick={() => setShowUniversitySheet(false)} className="min-h-11 min-w-11 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">✕</button>
            </header>
            <div className="p-4">
              <input value={universitySearch} onChange={event => setUniversitySearch(event.target.value)} placeholder="বিশ্ববিদ্যালয়ের নাম লিখুন..." className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {searchableUniversities.map(uni => (
                  <button key={uni.id} onClick={() => selectUniversity(uni.id)} className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left ${selectedInstitution === uni.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 dark:border-slate-800'}`}>
                    <span className="grid h-10 w-12 shrink-0 place-items-center rounded-xl text-[10px] font-black text-white" style={{ background: 'linear-gradient(135deg, ' + (getUniversity(uni.id)?.brand[0] || '#475569') + ', ' + (getUniversity(uni.id)?.brand[1] || '#94a3b8') + ')' }}>{uni.code}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{uni.nameBn}</span><span className="block truncate text-[11px] text-slate-500">{uni.nameEn}</span></span>
                    <span className={`shrink-0 text-[10px] font-bold ${uni.hasQuestions ? 'text-emerald-600' : 'text-slate-400'}`}>{uni.hasQuestions ? 'প্রশ্ন আছে' : 'Soon'}</span>
                  </button>
                ))}
                {searchableUniversities.length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-500">কোনো বিশ্ববিদ্যালয় পাওয়া যায়নি।</p>}
              </div>
            </div>
          </section>
        </div>
      )}

    </div>
  );
};
