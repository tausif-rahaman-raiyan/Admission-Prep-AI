import React, { useState } from 'react';
import { Settings, X, Key, Moon, Sun, Plus, Minus } from 'lucide-react';
import { storage, UiSettings } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  uiSettings: UiSettings;
  onUiSettingsChange: (settings: UiSettings) => void;
  onOpenApiKeyModal: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  uiSettings,
  onUiSettingsChange,
  onOpenApiKeyModal
}) => {
  if (!isOpen) return null;

  const apiKey = storage.getApiKey();
  const hasKey = apiKey.trim().length > 10;

  const handleReset = () => {
    onUiSettingsChange({
      questionFontPx: 17,
      optionFontPx: 16,
      explanationFontPx: 16,
      fontStyle: 'sans'
    });
  };

  const updateSetting = <K extends keyof UiSettings>(key: K, value: UiSettings[K]) => {
    onUiSettingsChange({ ...uiSettings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0B1325] border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-indigo-900/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-sky-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Settings & Options</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Customize typography, theme, and AI key</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs font-bold text-indigo-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* AI Tutor Gemini Key row */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-[#121B33] border border-indigo-200 dark:border-indigo-800/80">
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">AI Tutor Gemini Key</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-amber-500 ring-2 ring-amber-500/30'}`} />
                  <span>{hasKey ? 'Custom Key Saved' : 'Default Mode'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { onClose(); onOpenApiKeyModal(); }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-colors"
            >
              {hasKey ? 'Change Key' : 'Add Key'}
            </button>
          </div>

          {/* Theme Color */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>1. Theme Color</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onThemeChange('light')}
                className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                    : 'bg-slate-100 dark:bg-[#070D1D] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-indigo-900'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>White / Light</span>
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-100 dark:bg-[#070D1D] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-indigo-900'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Font Sizes Steppers */}
          <div className="space-y-3">
            {/* Question Font Size */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">2. Question Font Size</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={uiSettings.questionFontPx <= 12}
                  onClick={() => updateSetting('questionFontPx', Math.max(12, uiSettings.questionFontPx - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-xs font-extrabold text-indigo-600 dark:text-sky-400 font-mono">
                  {uiSettings.questionFontPx}px
                </span>
                <button
                  disabled={uiSettings.questionFontPx >= 26}
                  onClick={() => updateSetting('questionFontPx', Math.min(26, uiSettings.questionFontPx + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Option Box Font Size */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">3. Option Box Font Size</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={uiSettings.optionFontPx <= 12}
                  onClick={() => updateSetting('optionFontPx', Math.max(12, uiSettings.optionFontPx - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-xs font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                  {uiSettings.optionFontPx}px
                </span>
                <button
                  disabled={uiSettings.optionFontPx >= 26}
                  onClick={() => updateSetting('optionFontPx', Math.min(26, uiSettings.optionFontPx + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Explanation Font Size */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">4. Explanation Font Size</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={uiSettings.explanationFontPx <= 12}
                  onClick={() => updateSetting('explanationFontPx', Math.max(12, uiSettings.explanationFontPx - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {uiSettings.explanationFontPx}px
                </span>
                <button
                  disabled={uiSettings.explanationFontPx >= 26}
                  onClick={() => updateSetting('explanationFontPx', Math.min(26, uiSettings.explanationFontPx + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Font Style */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              5. Font Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'sans', label: 'Sans (Default)' },
                { id: 'serif', label: 'Serif (Book)' },
                { id: 'mono', label: 'Mono (Code)' },
                { id: 'bryndan', label: 'Bryndan Write ✍️' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => updateSetting('fontStyle', f.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    uiSettings.fontStyle === f.id
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-[#070D1D] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-indigo-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
