import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, Layers } from 'lucide-react';
import { universityAdmissionRules, UniversityAdmissionRule } from '../data/admissionLogic';

interface AdmissionLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUniversityId?: string;
}

export const AdmissionLogicModal: React.FC<AdmissionLogicModalProps> = ({
  isOpen,
  onClose,
  initialUniversityId = 'DU'
}) => {
  const selectedUnivId = initialUniversityId && universityAdmissionRules[initialUniversityId] ? initialUniversityId : 'DU';

  if (!isOpen) return null;

  const currentRule: UniversityAdmissionRule = universityAdmissionRules[selectedUnivId] || universityAdmissionRules.DU;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-5xl rounded-3xl bg-white dark:bg-[#080E1E] border-2 border-indigo-200 dark:border-indigo-800/80 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-indigo-950/80 flex items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/60 dark:from-[#0E172E] dark:via-[#0A1224] dark:to-[#080E1C] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-300 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-sky-400 shrink-0">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  Admission Guide
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold hidden sm:inline">
                  Subject Choice & Mark Distribution Logic
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                বিশ্ববিদ্যালয় ভর্তি পরীক্ষার বিষয় ও মানবণ্টন নির্দেশিকা
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 2: UNIVERSITY-BY-UNIVERSITY BREAKDOWN */}
          <div className="space-y-6">
              {/* Current University Overview Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-[#091226] border-2 border-indigo-200 dark:border-indigo-900/80 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-indigo-950 pb-4">
                  <div>
                    <div className="text-xs font-black text-indigo-600 dark:text-sky-400 uppercase tracking-wider">
                      {currentRule.code} • {currentRule.unit}
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                      {currentRule.nameBn} ({currentRule.nameEn})
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-white dark:bg-[#0E1A38] border border-slate-200 dark:border-indigo-900 font-extrabold text-xs text-slate-800 dark:text-slate-200">
                      Format: {currentRule.examFormat}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 font-extrabold text-xs text-rose-600 dark:text-rose-400">
                      Negative: -{currentRule.negativeMarking}
                    </span>
                  </div>
                </div>

                {/* Grid: Compulsory vs Optional */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Compulsory Column */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#082017] border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>বাধ্যতামূলক বিষয়সমূহ (Compulsory Subjects)</span>
                    </div>

                    <div className="space-y-2">
                      {currentRule.compulsorySubjects.map((sub, sIdx) => (
                        <div key={sIdx} className="p-2.5 rounded-xl bg-white dark:bg-[#061410] border border-emerald-200 dark:border-emerald-900/70 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                              {sub.nameBn} ({sub.name})
                            </div>
                            {sub.desc && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{sub.desc}</div>
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
                  <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-[#1E0F33] border border-purple-200 dark:border-purple-800/60 space-y-3">
                    <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-black text-sm">
                      <HelpCircle className="w-4 h-4 text-purple-600" />
                      <span>ঐচ্ছিক ও পছন্দভিত্তিক বিষয় (Optional / Choice Subjects)</span>
                    </div>

                    {currentRule.hasOptionalChoice && currentRule.optionalRule ? (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-purple-800 dark:text-purple-300">
                          {currentRule.optionalRule.instructionBn}
                        </div>
                        {currentRule.optionalRule.options.map((opt, oIdx) => (
                          <div key={oIdx} className="p-2.5 rounded-xl bg-white dark:bg-[#130A21] border border-purple-200 dark:border-purple-900/70 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                {opt.labelBn}
                              </span>
                              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 font-mono">
                                {opt.marks} Marks {opt.questions ? `(${opt.questions} Qs)` : ''}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                              {opt.eligibilityEffectBn}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white dark:bg-[#130A21] border border-purple-200 dark:border-purple-900/70 text-xs font-semibold text-purple-800 dark:text-purple-300">
                        এই ইউনিটের সকল বিষয় বাধ্যতামূলক। কোনো ঐচ্ছিক বিষয় বাদ দেওয়া বা প্রতিস্থাপন করার সুযোগ নেই।
                      </div>
                    )}
                  </div>
                </div>

                {/* Departmental Eligibility Rules */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-[#251705] border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-xs sm:text-sm">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>অনুষদ ও বিষয়ভিত্তিক ভর্তি যোগ্যতা নির্দেশিকা (Eligibility Rules)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#170E03] border border-amber-200 dark:border-amber-900/60 space-y-1">
                      <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <span>⚙️ ইঞ্জিনিয়ারিং ও প্রযুক্তি অনুষদ:</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {currentRule.departmentEligibility.engineeringRuleBn}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#170E03] border border-amber-200 dark:border-amber-900/60 space-y-1">
                      <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <span>🧬 জীববিজ্ঞান, ফার্মেসি ও কৃষি অনুষদ:</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {currentRule.departmentEligibility.biologyRuleBn}
                      </p>
                    </div>
                  </div>
                </div>

                {currentRule.eligibilityDetailsBn && (
                  <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-[#0A1B2D] border border-sky-200 dark:border-sky-900/70 space-y-2">
                    <div className="font-black text-sky-900 dark:text-sky-300 text-sm">আবেদন যোগ্যতা, মানবণ্টন ও পাশের শর্ত</div>
                    <ul className="list-disc pl-5 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentRule.eligibilityDetailsBn.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {/* Key Bullet Points */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="font-black text-slate-900 dark:text-slate-100">গুরুত্বপূর্ণ নির্দেশনাবলী:</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {currentRule.detailsBn.map((d, dIdx) => (
                      <li key={dIdx}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-indigo-950 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-[#060B16] shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {currentRule.nameBn} • {currentRule.unit} — ভর্তি পরীক্ষার মানবণ্টন ও যোগ্যতার নিয়মাবলী
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors shadow-xs"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
