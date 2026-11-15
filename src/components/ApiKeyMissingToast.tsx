import React from 'react';
import { Key, X, ArrowRight } from 'lucide-react';

interface ApiKeyMissingToastProps {
  visible: boolean;
  onSetApiKey: () => void;
  onDismiss: () => void;
}

export const ApiKeyMissingToast: React.FC<ApiKeyMissingToastProps> = ({
  visible,
  onSetApiKey,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="assertive"
      aria-labelledby="corner-api-key-title"
      className="fixed bottom-5 right-4 sm:right-6 z-[110] w-[calc(100vw-2rem)] sm:w-[360px] overflow-hidden rounded-3xl border-2 border-amber-300 dark:border-indigo-500/70 bg-white dark:bg-[#0A1224] text-slate-900 dark:text-slate-100 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Corner Modal Header */}
      <div className="flex items-center justify-between gap-3 border-b border-amber-200/80 dark:border-indigo-900/70 bg-amber-50/90 dark:bg-[#0F172A]/90 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 id="corner-api-key-title" className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
              Gemini API Key Required
            </h3>
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
              AI Tutor Coach
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close API key prompt"
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-amber-100/80 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Corner Modal Body */}
      <div className="p-4 space-y-3.5">
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          To use AI Tutor, first add your Gemini API Key. Click below to set it up now.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-10 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0F172A] hover:bg-slate-100 dark:hover:bg-[#16223B] text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => {
              onDismiss();
              onSetApiKey();
            }}
            className="min-h-10 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>Set API Key</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
