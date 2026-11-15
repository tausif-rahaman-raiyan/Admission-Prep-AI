import React, { useState, useEffect } from 'react';
import { Key, X, ExternalLink, Trash2, Shield, Server, CheckCircle2 } from 'lucide-react';
import { storage } from '../utils/storage';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [keyValue, setKeyValue] = useState(storage.getApiKey());
  const [providerMode, setProviderMode] = useState<'personal' | 'proxy'>(storage.getAiProviderMode());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeyValue(storage.getApiKey());
      setProviderMode(storage.getAiProviderMode());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const notifyKeyChange = () => {
    window.dispatchEvent(new Event('admission-api-key-updated'));
    onKeyUpdated();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.setApiKey(keyValue);
    storage.setAiProviderMode(providerMode);
    setSavedSuccess(true);
    notifyKeyChange();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleRemove = () => {
    setKeyValue('');
    storage.setApiKey('');
    storage.setAiProviderMode('proxy');
    notifyKeyChange();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0B1325] border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-sky-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">AI Provider & API Key Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose between Personal API Key or Hosted Backend Proxy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Select AI Connection Mode:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setProviderMode('proxy')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col gap-1 ${
                providerMode === 'proxy'
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1D] text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
                  Hosted Backend Proxy
                </span>
                {providerMode === 'proxy' && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-sky-400" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Uses Cloud Run backend server key. Never exposes keys to browser.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setProviderMode('personal')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col gap-1 ${
                providerMode === 'personal'
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1D] text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Personal Gemini Key
                </span>
                {providerMode === 'personal' && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-sky-400" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Uses your own Gemini key stored securely in browser localStorage.
              </p>
            </button>
          </div>
        </div>

        {providerMode === 'personal' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-[#121B33] border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-sky-200 space-y-2">
              <p className="font-bold">Quick 3-step guide:</p>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <li>Open Google AI Studio and login with your Google account.</li>
                <li>Create a new API key securely in seconds.</li>
                <li>Paste your API key below and save.</li>
              </ol>
              <div className="pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-sky-400 hover:underline"
                >
                  <span>Get Free Gemini API Key from Google AI Studio</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Personal Gemini API Key (AIzaSy...)
              </label>
              <input
                type="password"
                value={keyValue}
                onChange={e => setKeyValue(e.target.value)}
                placeholder="Paste your personal API key here..."
                className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-[#070D1D] border border-slate-300 dark:border-indigo-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        )}

        {providerMode === 'proxy' && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Hosted Backend Proxy Active</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Your app is configured to route AI requests through the secure Cloud Run backend proxy. No personal API key is needed.
            </p>
          </div>
        )}

        {savedSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center">
            Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center justify-between pt-2">
            {keyValue && providerMode === 'personal' ? (
              <button
                type="button"
                onClick={handleRemove}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Key</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm shadow-indigo-600/20 cursor-pointer transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
