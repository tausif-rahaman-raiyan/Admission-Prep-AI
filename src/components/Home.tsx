import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Key, BookOpen, Clock, Award, CheckCircle, ArrowRight, Layers, FileText, Info, X } from 'lucide-react';
import { siteConfig } from '../data/siteConfig';
import { institutions, Institution } from '../data/institutions';
import { sessions, SessionItem } from '../data/sessions';
import { getAdmissionRule } from '../data/admissionLogic';

interface HomeProps {
  manifestPapers: Record<string, any>;
  selectedInstitution: string;
  onSelectInstitution: (id: string) => void;
  selectedUnit: string | null;
  onSelectUnit: (unit: string | null) => void;
  selectedGroupChild: string | null;
  onSelectGroupChild: (childId: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  typeFilter: 'All' | 'MCQ' | 'Written';
  onTypeFilterChange: (f: 'All' | 'MCQ' | 'Written') => void;
  onStartExam: (session: SessionItem) => void;
  onOpenQuestionBank: (session: SessionItem) => void;
  onOpenApiKeyModal: () => void;
  onOpenRulesModal: (univId?: string) => void;
}

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
  selectedGroupChild,
  onSelectGroupChild,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onStartExam,
  onOpenQuestionBank,
  onOpenApiKeyModal,
  onOpenRulesModal
}) => {
  const [khuDetailsModal, setKhuDetailsModal] = useState<string | null>(null);

  // Top-level institutions (no parent)
  const topLevelInstitutions = useMemo(() => {
    return institutions.filter(i => !i.parent);
  }, []);

  const currentInstitutionObj = institutions.find(i => i.id === selectedInstitution);

  // Child institutions for AGRI group
  const groupChildren = useMemo(() => {
    if (selectedInstitution === 'AGRI') {
      return institutions.filter(i => i.parent === 'AGRI');
    }
    return [];
  }, [selectedInstitution]);

  // Unit chips for institutions with units
  const availableUnits = useMemo(() => {
    if (currentInstitutionObj && currentInstitutionObj.units && currentInstitutionObj.units.length > 0) {
      return currentInstitutionObj.units;
    }
    return [];
  }, [currentInstitutionObj]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      let instMatch = false;
      if (selectedInstitution === 'ALL') {
        instMatch = true;
      } else if (selectedInstitution === 'AGRI') {
        if (selectedGroupChild) {
          instMatch = s.institution === selectedGroupChild || 
            (selectedGroupChild === 'GSTAGRI' && (s.institution === 'GSTAGRI' || s.institution === 'GST-AGRI')) ||
            (selectedGroupChild === 'GST-AGRI' && (s.institution === 'GSTAGRI' || s.institution === 'GST-AGRI'));
        } else {
          instMatch = s.institution === 'AGRI' || institutions.some(i => (i.id === s.institution || i.code === s.institution) && i.parent === 'AGRI');
        }
      } else {
        instMatch = s.institution === selectedInstitution;
      }

      if (!instMatch) return false;

      if (selectedUnit && s.unit !== selectedUnit) {
        return false;
      }

      if (typeFilter !== 'All' && s.questionType !== typeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchSession = s.session.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        const matchInst = s.institution.toLowerCase().includes(q);
        if (!matchTitle && !matchSession && !matchDesc && !matchInst) return false;
      }

      return true;
    });
  }, [selectedInstitution, selectedGroupChild, selectedUnit, typeFilter, searchQuery]);

  const firstAvailableSession = useMemo(() => {
    return filteredSessions.find(s => manifestPapers[s.id]) || filteredSessions[0];
  }, [filteredSessions, manifestPapers]);

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
            onClick={() => onOpenRulesModal(selectedInstitution === 'ALL' ? 'DU' : selectedInstitution)}
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

      {/* Institution Selector Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-sky-400" />
            <span>বিশ্ববিদ্যালয় ও ইউনিট নির্বাচন করুন</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Select an institution card below to filter admission papers & question banks
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {topLevelInstitutions.map(inst => {
            const isSelected = selectedInstitution === inst.id;
            return (
              <div
                key={inst.id}
                onClick={() => {
                  onSelectInstitution(inst.id);
                  onSelectGroupChild(null);
                  onSelectUnit(null);
                }}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 min-h-[112px] sm:min-h-[126px] flex flex-col justify-between cursor-pointer transition-all relative ${
                  isSelected
                    ? 'bg-indigo-100/90 dark:bg-gradient-to-br dark:from-indigo-900/90 dark:via-[#112046] dark:to-[#0A1329] border-indigo-600 dark:border-sky-400 shadow-lg scale-[1.01]'
                    : 'border-slate-200 dark:border-indigo-950 bg-white dark:bg-[#0B1325] hover:border-indigo-400 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                    isSelected ? 'bg-indigo-600 text-white dark:bg-sky-400 dark:text-slate-950' : 'bg-slate-100 dark:bg-[#15223A] text-slate-700 dark:text-slate-300'
                  }`}>
                    {inst.code}
                  </span>
                  {inst.badgeText && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                      {inst.badgeText}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {inst.nameBn}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 font-medium">
                    {inst.desc}
                  </p>
                </div>

                {inst.id === 'KhU' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setKhuDetailsModal('B'); }}
                    className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                  >
                    Details
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Agri Cluster Sub-filters */}
        {selectedInstitution === 'AGRI' && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="text-xs font-black text-emerald-900 dark:text-emerald-200">কৃষি বিশ্ববিদ্যালয় সাব-ফিল্টার (Agri Cluster Filter):</div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onSelectGroupChild(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGroupChild === null
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-[#070D1D] text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                }`}
              >
                All (সকল)
              </button>
              {groupChildren.map(ag => (
                <button
                  key={ag.id}
                  onClick={() => onSelectGroupChild(ag.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedGroupChild === ag.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-[#070D1D] text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                  }`}
                >
                  {ag.code} — {ag.nameBn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unit Chips */}
        {availableUnits.length > 0 && selectedInstitution !== 'AGRI' && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-bold text-slate-500 mr-2">Filter Admission Unit:</span>
            <button
              onClick={() => onSelectUnit(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedUnit === null
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All Units
            </button>
            {availableUnits.map(unit => (
              <button
                key={unit}
                onClick={() => onSelectUnit(unit)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedUnit === unit
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Unit {unit}
              </button>
            ))}
          </div>
        )}

        {/* Contextual University Admission Rules & Subject Breakdown Card */}
        {(() => {
          const rule = getAdmissionRule(selectedInstitution === 'ALL' ? 'DU' : selectedInstitution);
          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-sky-50/60 to-white dark:from-[#0B152C] dark:via-[#091122] dark:to-[#070D1A] border-2 border-indigo-200 dark:border-indigo-900/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider">
                    {selectedInstitution === 'ALL' ? 'সার্বজনীন বিজ্ঞান ভর্তি নিয়ম' : `${rule.code} • ${rule.unit}`}
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    বিষয় বণ্টন ও অনুষদ যোগ্যতা (২০২৫-২৬)
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">আবশ্যিক: </span>
                  {rule.compulsorySubjects.map(s => `${s.nameBn} (${s.marks})`).join(', ')}
                  <span className="mx-2 text-slate-400">|</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">ঐচ্ছিক: </span>
                  {rule.hasOptionalChoice && rule.optionalRule
                    ? rule.optionalRule.instructionBn
                    : 'সকল বিষয় বাধ্যতামূলক (No optional choices)'}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => onOpenRulesModal(selectedInstitution === 'ALL' ? 'DU' : selectedInstitution)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>সম্পূর্ণ মানবণ্টন নির্দেশিকা দেখুন</span>
                </button>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Filter Bar & Session List */}
      <section className="space-y-6">
        <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-[#091020] border border-slate-200 dark:border-indigo-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-3 w-full sm:w-auto p-1 bg-white dark:bg-[#070D1D] rounded-xl border border-slate-200 dark:border-indigo-900/60 gap-1">
            {(['All', 'MCQ', 'Written'] as const).map(f => (
              <button
                key={f}
                onClick={() => onTypeFilterChange(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  typeFilter === f
                    ? f === 'MCQ' ? 'bg-blue-600 text-white shadow-sm' : f === 'Written' ? 'bg-amber-600 text-white shadow-sm' : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
            Total sessions: <span className="text-indigo-600 dark:text-sky-400 font-black">{filteredSessions.length}</span> found
          </div>
        </div>

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
                    onClick={() => onOpenQuestionBank(session)}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${palette.seeBtn}`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>See question</span>
                  </button>

                  <button
                    onClick={() => onStartExam(session)}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm ${palette.startBtn}`}
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
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching sessions found</h3>
            <p className="text-xs text-slate-500">Try changing your search keywords or institution filter.</p>
          </div>
        )}
      </section>

      {/* KhU Details Modal */}
      {khuDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0B1325] border-2 border-teal-300 dark:border-teal-800 shadow-2xl p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-indigo-900 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Khulna University B Unit Details</h3>
              <button onClick={() => setKhuDetailsModal(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <p className="font-bold">B Unit: School of Biological Science</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Total Marks: 100 (MCQ 60 + Written 40)</li>
                <li>Per Question Mark: 1 mark</li>
                <li>Negative Marking: –0.25 / wrong answer</li>
              </ul>
              <div className="font-bold pt-2">Mark Distribution (MCQ — 60 Marks Total):</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Biology: 15 marks</div>
                <div>Chemistry: 12 marks</div>
                <div>Math: 12 marks</div>
                <div>Physics: 12 marks</div>
                <div>English: 9 marks</div>
              </div>
              <div className="font-bold pt-2">Mark Distribution (Written — 40 Marks Total):</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Biology: 10 (5×2)</div>
                <div>Chemistry: 8 (4×2)</div>
                <div>Math: 8 (4×2)</div>
                <div>Physics: 8 (4×2)</div>
                <div>English: 6 marks</div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setKhuDetailsModal(null)}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
