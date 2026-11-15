export interface UiSettings {
  questionFontPx: number;
  optionFontPx: number;
  explanationFontPx: number;
  fontStyle: 'sans' | 'serif' | 'mono' | 'bryndan';
}

export interface ExamAttempt {
  id: string;
  timestamp: string;
  sessionId: string;
  title: string;
  institution: string;
  session: string;
  questionType: 'MCQ' | 'Written';
  score: number;
  totalMarks: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  timeTakenSeconds: number;
}

const PREFIX = 'admission_app';

export const storage = {
  getTheme(): 'dark' | 'light' {
    try {
      const v = localStorage.getItem(`${PREFIX}_theme_v2`);
      return v === 'dark' || v === 'light' ? v : 'light';
    } catch {
      return 'light';
    }
  },
  setTheme(theme: 'dark' | 'light') {
    try {
      localStorage.setItem(`${PREFIX}_theme_v2`, theme);
    } catch {}
  },

  getUiSettings(): UiSettings {
    try {
      const v = localStorage.getItem(`${PREFIX}_ui_settings_v2`);
      if (v) {
        const parsed = JSON.parse(v);
        return {
          questionFontPx: Number(parsed.questionFontPx) || 17,
          optionFontPx: Number(parsed.optionFontPx) || 16,
          explanationFontPx: Number(parsed.explanationFontPx) || 16,
          fontStyle: ['sans', 'serif', 'mono', 'bryndan'].includes(parsed.fontStyle) ? parsed.fontStyle : 'sans'
        };
      }
    } catch {}
    return { questionFontPx: 17, optionFontPx: 16, explanationFontPx: 16, fontStyle: 'sans' };
  },
  setUiSettings(settings: UiSettings) {
    try {
      localStorage.setItem(`${PREFIX}_ui_settings_v2`, JSON.stringify(settings));
    } catch {}
  },

  getApiKey(): string {
    try {
      return localStorage.getItem(`${PREFIX}_gemini_api_key`) || '';
    } catch {
      return '';
    }
  },
  setApiKey(key: string) {
    try {
      if (key.trim()) {
        localStorage.setItem(`${PREFIX}_gemini_api_key`, key.trim());
      } else {
        localStorage.removeItem(`${PREFIX}_gemini_api_key`);
      }
    } catch {}
  },

  getAiProviderMode(): 'personal' | 'proxy' {
    try {
      const mode = localStorage.getItem(`${PREFIX}_ai_provider_mode`);
      if (mode === 'personal' || mode === 'proxy') return mode;
      // Default: if user has key stored, use personal, otherwise proxy if server URL exists
      return storage.getApiKey() ? 'personal' : 'proxy';
    } catch {
      return 'proxy';
    }
  },
  setAiProviderMode(mode: 'personal' | 'proxy') {
    try {
      localStorage.setItem(`${PREFIX}_ai_provider_mode`, mode);
    } catch {}
  },

  getExamHistory(): ExamAttempt[] {
    try {
      const v = localStorage.getItem(`${PREFIX}_exam_history_v1`);
      if (v) {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },
  saveExamAttempt(attempt: ExamAttempt) {
    try {
      const history = storage.getExamHistory();
      history.unshift(attempt);
      if (history.length > 100) history.pop();
      localStorage.setItem(`${PREFIX}_exam_history_v1`, JSON.stringify(history));
    } catch {}
  },
  clearExamHistory() {
    try {
      localStorage.removeItem(`${PREFIX}_exam_history_v1`);
    } catch {}
  }
};
