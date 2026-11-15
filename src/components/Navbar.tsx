import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, BarChart3, Settings as SettingsIcon, Menu, X, School } from 'lucide-react';
import { siteConfig } from '../data/siteConfig';

interface NavbarProps {
  currentView: 'home' | 'questionBank' | 'exam' | 'analytics' | 'admissionRules';
  onNavigate: (view: 'home' | 'questionBank' | 'exam' | 'analytics' | 'admissionRules') => void;
  onOpenSettings: () => void;
  onOpenApiKeyModal: () => void;
  onOpenRulesModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  onOpenApiKeyModal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (currentView === 'exam') return null; // Navbar hidden during exam

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#070B14]/95 backdrop-blur-md border-b border-slate-200 dark:border-indigo-950/80 shadow-xs">
      <div className="max-w-7xl mx-auto h-16 px-3 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Zone 1: Logo & Title */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-12 h-10 sm:w-14 sm:h-11 rounded-xl overflow-hidden border border-indigo-300 dark:border-indigo-500/40 bg-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}assets/aistudio/image_d4f71793.png`}
              alt="Admission Prep AI icon"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Admission Prep AI
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-sky-400">
              {siteConfig.siteSubtitle}
            </div>
          </div>
        </div>

        {/* Desktop Nav Tabs (Zone 2) */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#0E172A] rounded-xl border border-slate-200 dark:border-indigo-900/60">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentView === 'home' || currentView === 'questionBank'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Question Bank</span>
          </button>

          <button
            onClick={() => onNavigate('admissionRules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentView === 'admissionRules'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>ভর্তি মানবণ্টন</span>
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentView === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Zone 3: Settings & Mobile Menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0F172A] dark:hover:bg-[#16223B] border border-slate-300 dark:border-indigo-900/60 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Mobile Menu Toggle */}
          <div className="relative md:hidden" ref={menuRef}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-300 dark:border-indigo-900 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0B1325] border-2 border-indigo-200 dark:border-indigo-800 shadow-xl p-2 z-50 space-y-1">
                <button
                  onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                    currentView === 'home' || currentView === 'questionBank'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Question Bank</span>
                </button>
                <button
                  onClick={() => { onNavigate('admissionRules'); setMobileMenuOpen(false); }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                    currentView === 'admissionRules'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <School className="w-4 h-4" />
                  <span>ভর্তি মানবণ্টন</span>
                </button>
                <button
                  onClick={() => { onNavigate('analytics'); setMobileMenuOpen(false); }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                    currentView === 'analytics'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
