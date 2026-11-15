import React, { useState, useEffect, useLayoutEffect } from 'react';
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
import { MathTestPage } from './components/MathTestPage';
import { SessionItem, sessions } from './data/sessions';
import { storage, UiSettings } from './utils/storage';
import { Github, Instagram } from 'lucide-react';

const validViews = ['home', 'questionBank', 'exam', 'analytics', 'admissionRules'] as const;
type AppView = typeof validViews[number];

const BASE_PREFIX = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

function getRouteFromLocation(): { view: AppView; isMathTest: boolean; hadHashOrRoot: boolean } {
  const hashRoute = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  if (hashRoute) {
    if (hashRoute === 'math-test') return { view: 'home', isMathTest: true, hadHashOrRoot: true };
    if (validViews.includes(hashRoute as AppView)) {
      return { view: hashRoute as AppView, isMathTest: false, hadHashOrRoot: true };
    }
  }

  let pathname = window.location.pathname;
  if (BASE_PREFIX && pathname.startsWith(BASE_PREFIX)) {
    pathname = pathname.slice(BASE_PREFIX.length);
  }
  const cleanSegment = pathname.replace(/^\/+|\/+$/g, '');
  if (cleanSegment === 'math-test') {
    return { view: 'home', isMathTest: true, hadHashOrRoot: false };
  }
  if (validViews.includes(cleanSegment as AppView)) {
    return { view: cleanSegment as AppView, isMathTest: false, hadHashOrRoot: false };
  }
  return { view: 'home', isMathTest: false, hadHashOrRoot: cleanSegment === '' };
}

function buildPathForRoute(route: string): string {
  const clean = route.replace(/^\/+/, '');
  return `${BASE_PREFIX}/${clean}` || `/${clean}`;
}

export default function App() {
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(() => {
    try { const id = localStorage.getItem('admission_app_selected_session'); return sessions.find(session => session.id === id) || null; }
    catch { return null; }
  });
  const initialRoute = getRouteFromLocation();
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if ((initialRoute.view === 'exam' || initialRoute.view === 'questionBank') && !selectedSession) {
      return 'home';
    }
    if (initialRoute.view === 'exam' && selectedSession) {
      try {
        const raw = localStorage.getItem('admission_app_exam_' + selectedSession.id);
        const saved = raw ? JSON.parse(raw) : null;
        if (saved?.paused) return 'home';
      } catch {}
    }
    return initialRoute.view;
  });
  const [isMathTest, setIsMathTest] = useState(() => initialRoute.isMathTest);
  const [examPromptResume, setExamPromptResume] = useState(false);
  const [examLaunchKey, setExamLaunchKey] = useState(0);

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
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setCurrentView('admissionRules');
  };

  // Filter states
  const [manifestPapers, setManifestPapers] = useState<Record<string, any>>({});
  const [selectedInstitution, setSelectedInstitution] = useState<string>(() => {
    try { return localStorage.getItem('admission_app_selected_university') || 'DU'; } catch { return 'DU'; }
  });
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { try { localStorage.setItem('admission_app_selected_university', selectedInstitution); } catch {} }, [selectedInstitution]);
  useEffect(() => {
    const targetPath = buildPathForRoute(isMathTest ? 'math-test' : currentView);
    const currentFull = window.location.pathname + window.location.hash;
    if (currentFull !== targetPath) {
      window.history.replaceState(null, '', targetPath);
    }
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      const next = getRouteFromLocation();
      setIsMathTest(next.isMathTest);
      setExamPromptResume(false);
      if (!next.isMathTest) {
        if ((next.view === 'exam' || next.view === 'questionBank') && !selectedSession) {
          setCurrentView('home');
        } else {
          setCurrentView(next.view);
        }
      }
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [selectedSession]);

  useEffect(() => {
    if (isMathTest) return;
    const targetPath = buildPathForRoute(currentView);
    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState(null, '', targetPath);
    }
  }, [currentView, isMathTest]);

  useEffect(() => { try { if (selectedSession) localStorage.setItem('admission_app_selected_session', selectedSession.id); else localStorage.removeItem('admission_app_selected_session'); } catch {} }, [selectedSession]);

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

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [currentView, selectedSession?.id]);

  const handleNavigate = (view: 'home' | 'questionBank' | 'exam' | 'analytics' | 'admissionRules') => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setCurrentView(view);
  };

  const handleStartExam = (session: SessionItem) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setExamPromptResume(true);
    setExamLaunchKey(k => k + 1);
    setSelectedSession(session);
    setCurrentView('exam');
  };

  const handleOpenQuestionBank = (session: SessionItem) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setSelectedSession(session);
    setCurrentView('questionBank');
  };

  if (isMathTest) return <MathTestPage />;

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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
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
            key={`${selectedSession.id}-${examLaunchKey}`}
            session={selectedSession}
            onBack={() => {
              setExamPromptResume(false);
              setCurrentView('home');
            }}
            uiSettings={uiSettings}
            onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
            promptResumeOnStart={examPromptResume}
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
                <div className="w-12 h-10 rounded-xl overflow-hidden border border-indigo-300 dark:border-indigo-500/40 bg-slate-900 flex items-center justify-center shrink-0">
                  <img
                    src={`${import.meta.env.BASE_URL}assets/aistudio/image_d4f71793.png`}
                    alt="Admission Prep AI icon"
                    className="w-full h-full object-cover object-center"
                  />
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
