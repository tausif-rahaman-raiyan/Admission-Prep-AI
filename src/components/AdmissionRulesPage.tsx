import React, { useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, Layers, ArrowRight, Sparkles, School } from 'lucide-react';
import { admissionComparisonTable, universityAdmissionRules, UniversityAdmissionRule } from '../data/admissionLogic';

interface AdmissionRulesPageProps {
  onNavigateHome: () => void;
  initialUniversityId?: string;
}

export const AdmissionRulesPage: React.FC<AdmissionRulesPageProps> = ({
  onNavigateHome,
  initialUniversityId = 'DU'
}) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'details'>('comparison');
  const [selectedUnivId, setSelectedUnivId] = useState<string>(
    initialUniversityId && universityAdmissionRules[initialUniversityId] ? initialUniversityId : 'DU'
  );

  const currentRule: UniversityAdmissionRule = universityAdmissionRules[selectedUnivId] || universityAdmissionRules.DU;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-indigo-950 pb-6">
        <button
          onClick={onNavigateHome}
          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0F172A] hover:bg-slate-200 dark:hover:bg-[#16223B] text-slate-700 dark:text-slate-200 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home / Question Bank</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
            ২০২৫-২৬ শিক্ষাবর্ষের আনুষ্ঠানিক ভর্তি নীতিমালা
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-100/90 via-sky-50/60 to-white dark:from-[#0B152F] dark:via-[#091124] dark:to-[#060B18] p-6 sm:p-10 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-black text-indigo-700 dark:text-sky-300 uppercase tracking-wider">
              Admission Guidelines & Subject Choices
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              বিশ্ববিদ্যালয় ভর্তি পরীক্ষার বিষয় ও মানবণ্টন নির্দেশিকা
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-4xl leading-relaxed">
          বাংলাদেশের প্রধান পাবলিক বিশ্ববিদ্যালয় ও ভর্তি গুচ্ছসমূহের বিজ্ঞান অনুষদের বিষয়ভিত্তিক মানবণ্টন, আবশ্যিক বনাম ঐচ্ছিক বিষয়ের নীতিমালা এবং ইঞ্জিনিয়ারিং ও জীববিজ্ঞান অনুষদের ভর্তি যোগ্যতার সম্পূর্ণ বিশ্লেষণ।
        </p>

        {/* View Switcher Segmented Control */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-[#070D1D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-indigo-900/60 hover:bg-slate-50'
            }`}
          >
            সারসংক্ষেপ তুলনামূলক টেবিল (Summary Comparison)
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-[#070D1D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-indigo-900/60 hover:bg-slate-50'
            }`}
          >
            বিশ্ববিদ্যালয়ভিত্তিক পূর্ণাঙ্গ বিশ্লেষণ (University Breakdown)
          </button>
        </div>
      </div>

      {/* CONTENT TAB 1: SUMMARY COMPARISON TABLE */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/80 dark:bg-[#0D1836] border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="p-1 rounded-lg bg-indigo-600 text-white font-bold text-xs shrink-0 mt-0.5">নোট</span>
            <div>
              <span className="font-extrabold text-indigo-700 dark:text-sky-300">সার্বজনীন নীতি: </span>
              বাংলাদেশের বিজ্ঞান ইউনিটের সকল ভর্তি পরীক্ষায় পদার্থবিজ্ঞান ও রসায়ন প্রায় সার্বজনীনভাবে আবশ্যিক। উচ্চতর গণিত এবং জীববিজ্ঞান মূলত ঐচ্ছিক বা পছন্দভিত্তিক বিষয় হিসেবে থাকে, যার মাধ্যমে শিক্ষার্থী পরবর্তীতে ইঞ্জিনিয়ারিং (সিএসই, ইইই) নাকি জীববিজ্ঞান (ফার্মেসি, বায়োটেক) অনুষদে ভর্তি হতে পারবে তা নিশ্চিত হয়।
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-indigo-950 shadow-sm bg-white dark:bg-[#070D1C]">
            <table className="w-full text-left text-xs sm:text-sm divide-y divide-slate-200 dark:divide-indigo-950">
              <thead className="bg-slate-100 dark:bg-[#0A1224] text-slate-900 dark:text-slate-200 font-black">
                <tr>
                  <th className="py-4 px-5">University / Cluster</th>
                  <th className="py-4 px-4">Science Unit(s)</th>
                  <th className="py-4 px-4">Exam Format</th>
                  <th className="py-4 px-5">Compulsory Subjects</th>
                  <th className="py-4 px-5">Optional / Choice Subjects</th>
                  <th className="py-4 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-indigo-950 text-slate-700 dark:text-slate-300">
                {admissionComparisonTable.map((row, idx) => {
                  const univKey = row.university.includes('DU') ? 'DU'
                    : row.university.includes('RU') ? 'RU'
                    : row.university.includes('JU') ? 'JU'
                    : row.university.includes('CU') ? 'CU'
                    : row.university.includes('GST Cluster') ? 'GST'
                    : row.university.includes('CoU') ? 'CoU'
                    : row.university.includes('JnU') ? 'JnU'
                    : row.university.includes('Khulna') ? 'KhU'
                    : 'AGRI';

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#0E1A38] transition-colors">
                      <td className="py-4 px-5 font-black text-slate-900 dark:text-slate-100">
                        <div className="text-sm sm:text-base">{row.university}</div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {row.unit}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {row.examFormat}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-semibold text-emerald-700 dark:text-emerald-400">
                        <div className="whitespace-pre-line leading-relaxed font-bold">{row.compulsory}</div>
                      </td>
                      <td className="py-4 px-5 font-semibold text-purple-700 dark:text-purple-300">
                        <div className="whitespace-pre-line leading-relaxed">{row.optional}</div>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedUnivId(univKey);
                            setActiveTab('details');
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/70 text-indigo-700 dark:text-sky-300 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors border border-indigo-200 dark:border-indigo-800"
                        >
                          <span>বিস্তারিত</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT TAB 2: DETAILED UNIVERSITY-BY-UNIVERSITY BREAKDOWN */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* University Selector Grid */}
          <div className="space-y-2">
            <div className="text-xs font-black uppercase text-slate-500 tracking-wider">
              বিশ্ববিদ্যালয় নির্বাচন করুন (Select University):
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.keys(universityAdmissionRules).map(k => {
                const u = universityAdmissionRules[k];
                const isSelected = selectedUnivId === k;
                return (
                  <button
                    key={k}
                    onClick={() => setSelectedUnivId(k)}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                        : 'bg-white dark:bg-[#0B1428] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-indigo-950 hover:border-indigo-400'
                    }`}
                  >
                    <span>{u.code}</span>
                    <span className="font-semibold opacity-75 text-xs">({u.nameBn})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current University Overview Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#091226] border-2 border-indigo-200 dark:border-indigo-900/80 shadow-xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-indigo-950 pb-6">
              <div>
                <div className="text-xs font-black text-indigo-600 dark:text-sky-400 uppercase tracking-wider">
                  {currentRule.code} • {currentRule.unit}
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {currentRule.nameBn} <span className="text-slate-500 font-semibold text-lg sm:text-xl">({currentRule.nameEn})</span>
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0E1A38] border border-slate-200 dark:border-indigo-900 font-extrabold text-xs text-slate-800 dark:text-slate-200">
                  পরীক্ষার ফরম্যাট: {currentRule.examFormat}
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/70 font-black text-xs text-rose-600 dark:text-rose-400">
                  নেগেটিভ মার্কিং: –{currentRule.negativeMarking}
                </div>
              </div>
            </div>

            {/* Compulsory vs Optional Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Compulsory Column */}
              <div className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-[#07251B] border-2 border-emerald-300 dark:border-emerald-800/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-black text-sm sm:text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>আবশ্যিক বিষয়সমূহ (Compulsory)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase">
                    Mandatory
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentRule.compulsorySubjects.map((sub, sIdx) => (
                    <div key={sIdx} className="p-3.5 rounded-2xl bg-white dark:bg-[#061612] border border-emerald-200 dark:border-emerald-900/70 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {sub.nameBn} ({sub.name})
                        </div>
                        {sub.desc && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{sub.desc}</div>
                        )}
                      </div>
                      <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        {sub.marks} Marks {sub.questions ? `(${sub.questions} Qs)` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Column */}
              <div className="p-5 rounded-3xl bg-purple-50/70 dark:bg-[#1E0E35] border-2 border-purple-300 dark:border-purple-800/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-black text-sm sm:text-base">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                    <span>ঐচ্ছিক ও পছন্দভিত্তিক বিষয় (Optional Choices)</span>
                  </div>
                  {currentRule.hasOptionalChoice && (
                    <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white text-[10px] font-black uppercase">
                      Elective
                    </span>
                  )}
                </div>

                {currentRule.hasOptionalChoice && currentRule.optionalRule ? (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-purple-800 dark:text-purple-300">
                      {currentRule.optionalRule.instructionBn}
                    </div>
                    {currentRule.optionalRule.options.map((opt, oIdx) => (
                      <div key={oIdx} className="p-3.5 rounded-2xl bg-white dark:bg-[#130A24] border border-purple-200 dark:border-purple-900/70 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {opt.labelBn}
                          </span>
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 font-mono">
                            {opt.marks} Marks {opt.questions ? `(${opt.questions} Qs)` : ''}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                          {opt.eligibilityEffectBn}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white dark:bg-[#130A24] border border-purple-200 dark:border-purple-900/70 text-xs sm:text-sm font-semibold text-purple-800 dark:text-purple-300 leading-relaxed">
                    এই ইউনিটের সকল বিষয় বাধ্যতামূলক। কোনো ঐচ্ছিক বিষয় বাদ দেওয়া বা অন্য কোনো বিষয় দ্বারা প্রতিস্থাপন করার সুযোগ নেই।
                  </div>
                )}
              </div>
            </div>

            {/* Departmental Eligibility Rules */}
            <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/70 dark:bg-[#251705] border-2 border-amber-300 dark:border-amber-800/70 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-sm sm:text-base">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>অনুষদ ও বিষয়ভিত্তিক ভর্তি যোগ্যতা নির্দেশিকা (Eligibility Rules)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#170E03] border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                  <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>⚙️ ইঞ্জিনিয়ারিং ও প্রযুক্তি অনুষদ:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentRule.departmentEligibility.engineeringRuleBn}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#170E03] border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                  <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>🧬 জীববিজ্ঞান, ফার্মেসি ও কৃষি অনুষদ:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentRule.departmentEligibility.biologyRuleBn}
                  </p>
                </div>
              </div>
            </div>

            {/* University Details List */}
            <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="font-black text-slate-900 dark:text-slate-100">গুরুত্বপূর্ণ নির্দেশনাবলী:</div>
              <ul className="list-disc pl-5 space-y-1.5">
                {currentRule.detailsBn.map((d, dIdx) => (
                  <li key={dIdx}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
