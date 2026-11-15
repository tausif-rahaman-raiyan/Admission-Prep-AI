import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { QuestionBank } from './components/QuestionBank';
import { ExamView } from './components/ExamView';
import { Analytics } from './components/Analytics';
import { SettingsModal } from './components/SettingsModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AdmissionLogicModal } from './components/AdmissionLogicModal';
import { AdmissionRulesPage } from './components/AdmissionRulesPage';
import { siteConfig } from './data/siteConfig';
import { SessionItem } from './data/sessions';
import { storage, UiSettings } from './utils/storage';
import { GraduationCap, Heart, Github, Instagram, Shield, FileText } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'questionBank' | 'exam' | 'analytics' | 'admissionRules'>('home');
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storage.getTheme());
  const [uiSettings, setUiSettings] = useState<UiSettings>(() => storage.getUiSettings());

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [rulesModalUniv, setRulesModalUniv] = useState<string>('DU');

  const handleOpenRulesModal = (univId?: string) => {
    if (univId && univId !== 'ALL') {
      setRulesModalUniv(univId);
    }
    setCurrentView('admissionRules');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter states
  const [manifestPapers, setManifestPapers] = useState<Record<string, any>>({});
  const [selectedInstitution, setSelectedInstitution] = useState<string>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedGroupChild, setSelectedGroupChild] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'MCQ' | 'Written'>('All');

  // Load manifest.json at startup
  useEffect(() => {
    async function loadManifest() {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/manifest.json`);
        if (res.ok) {
          const data = await res.json();
          setManifestPapers(data.papers || {});
        }
      } catch (e) {
        console.warn('Manifest could not be loaded, treating as empty:', e);
      }
    }
    loadManifest();
  }, []);

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    storage.setTheme(theme);
  }, [theme]);

  // Apply font style class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-sans-mode', 'font-serif-mode', 'font-mono-mode', 'font-bryndan-mode');
    root.classList.add(`font-${uiSettings.fontStyle}-mode`);
    storage.setUiSettings(uiSettings);
  }, [uiSettings]);

  const handleNavigate = (view: 'home' | 'questionBank' | 'exam' | 'analytics' | 'admissionRules') => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(view);
  };

  const handleStartExam = (session: SessionItem) => {
    setSelectedSession(session);
    setCurrentView('exam');
  };

  const handleOpenQuestionBank = (session: SessionItem) => {
    setSelectedSession(session);
    setCurrentView('questionBank');
  };

  return (
    <div className={`min-h-screen bg-white dark:bg-[#060913] text-slate-900 dark:text-[#f1f5f9] font-${uiSettings.fontStyle} transition-colors duration-200 flex flex-col justify-between selection:bg-indigo-600 selection:text-white`}>
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
        onOpenRulesModal={() => handleOpenRulesModal()}
      />

      {/* Main Views */}
      <div className="flex-1">
        {currentView === 'home' && (
          <Home
            manifestPapers={manifestPapers}
            selectedInstitution={selectedInstitution}
            onSelectInstitution={setSelectedInstitution}
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            selectedGroupChild={selectedGroupChild}
            onSelectGroupChild={setSelectedGroupChild}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            onStartExam={handleStartExam}
            onOpenQuestionBank={handleOpenQuestionBank}
            onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
            onOpenRulesModal={handleOpenRulesModal}
          />
        )}

        {currentView === 'questionBank' && selectedSession && (
          <QuestionBank
            session={selectedSession}
            onBack={() => setCurrentView('home')}
            onStartExam={() => handleStartExam(selectedSession)}
            uiSettings={uiSettings}
            onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
            onOpenRulesModal={handleOpenRulesModal}
          />
        )}

        {currentView === 'exam' && selectedSession && (
          <ExamView
            session={selectedSession}
            onBack={() => setCurrentView('home')}
            uiSettings={uiSettings}
            onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
          />
        )}

        {currentView === 'analytics' && (
          <Analytics
            onNavigateHome={() => setCurrentView('home')}
            onStartExam={handleStartExam}
          />
        )}

        {currentView === 'admissionRules' && (
          <AdmissionRulesPage
            onNavigateHome={() => handleNavigate('home')}
            initialUniversityId={rulesModalUniv}
          />
        )}
      </div>

      {/* Footer (§13) */}
      {currentView !== 'exam' && (
        <footer className="border-t border-slate-200 dark:border-indigo-950 bg-slate-50 dark:bg-[#040710] py-12 px-4 sm:px-6 lg:px-8 mt-16 space-y-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-300 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-sky-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">{siteConfig.footer.brand}</div>
                  <div className="text-xs text-indigo-600 dark:text-sky-400 font-bold">{siteConfig.siteSubtitle}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                {siteConfig.footer.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 md:justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
              <button onClick={() => setCurrentView('home')} className="hover:text-indigo-600 dark:hover:text-sky-400 text-left cursor-pointer">
                Home & All Sessions
              </button>
              <button onClick={() => setCurrentView('analytics')} className="hover:text-indigo-600 dark:hover:text-sky-400 text-left cursor-pointer">
                Performance Analytics
              </button>
              <button onClick={() => setApiKeyModalOpen(true)} className="hover:text-indigo-600 dark:hover:text-sky-400 text-left cursor-pointer">
                Configure AI Tutor Key
              </button>
            </div>

            <div className="flex flex-col items-start md:items-end space-y-3">
              <div className="flex items-center gap-3">
                <a
                  href={siteConfig.footer.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white dark:bg-[#0B1325] border border-slate-200 dark:border-indigo-900 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-xs transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={siteConfig.footer.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white dark:bg-[#0B1325] border border-slate-200 dark:border-indigo-900 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-xs transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Developed by <span className="font-bold text-slate-900 dark:text-slate-200">{siteConfig.footer.developerName}</span>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 dark:border-indigo-950 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} {siteConfig.footer.brand}. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              {siteConfig.footer.tags.map((t, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span>·</span>}
                  <span>{t}</span>
                </React.Fragment>
              ))}
              <span>·</span>
              <span>Privacy-First Local Storage</span>
              <span>·</span>
              <span>Educational Fair Use</span>
            </div>
          </div>
        </footer>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        uiSettings={uiSettings}
        onUiSettingsChange={setUiSettings}
        onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onKeyUpdated={() => {}}
      />

      {/* Admission Rules & Subject Logic Modal */}
      <AdmissionLogicModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        initialUniversityId={rulesModalUniv}
      />
    </div>
  );
}
