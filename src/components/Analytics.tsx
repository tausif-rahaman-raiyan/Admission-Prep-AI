import React, { useState, useEffect } from 'react';
import { BarChart3, Award, Trash2, BookOpen, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { storage, ExamAttempt } from '../utils/storage';
import { SessionItem, sessions } from '../data/sessions';

interface AnalyticsProps {
  onNavigateHome: () => void;
  onStartExam: (session: SessionItem) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigateHome, onStartExam }) => {
  const [history, setHistory] = useState<ExamAttempt[]>([]);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  useEffect(() => {
    setHistory(storage.getExamHistory());
  }, []);

  const handleDeleteHistory = () => {
    storage.clearExamHistory();
    setHistory([]);
    setConfirmDeleteModal(false);
  };

  const totalExams = history.length;
  const avgScorePct = totalExams > 0
    ? (history.reduce((acc, cur) => acc + (cur.totalMarks > 0 ? (cur.score / cur.totalMarks) * 100 : 0), 0) / totalExams).toFixed(1)
    : '0.0';

  const totalCorrect = history.reduce((acc, cur) => acc + cur.correctCount, 0);
  const totalIncorrect = history.reduce((acc, cur) => acc + cur.incorrectCount, 0);
  const totalAnswered = totalCorrect + totalIncorrect;
  const overallAccuracy = totalAnswered > 0 ? ((totalCorrect / totalAnswered) * 100).toFixed(1) : '0.0';

  if (totalExams === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-sky-400 mx-auto">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">No exams taken yet</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Take your first strict timed exam to track your scores, accuracy, and improvement over time.
          </p>
        </div>
        <div>
          <button
            onClick={onNavigateHome}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md cursor-pointer transition-colors inline-flex items-center gap-2"
          >
            <span>Browse question bank & exam sessions</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-indigo-950 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Your Exam Performance & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Performance history securely saved in your browser's local storage
          </p>
        </div>

        <button
          onClick={() => setConfirmDeleteModal(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete History</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-blue-50/90 dark:bg-[#0C1933] border border-blue-200 dark:border-blue-800/60 space-y-1 shadow-xs">
          <div className="text-xs font-extrabold text-blue-600 dark:text-sky-400">Total Exams</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-slate-100">{totalExams}</div>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50/90 dark:bg-[#231608] border border-amber-200 dark:border-amber-800/60 space-y-1 shadow-xs">
          <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">Average Score %</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-slate-100">{avgScorePct}%</div>
        </div>

        <div className="p-5 rounded-3xl bg-purple-50/90 dark:bg-[#1B0F2E] border border-purple-200 dark:border-purple-800/60 space-y-1 shadow-xs">
          <div className="text-xs font-extrabold text-purple-600 dark:text-purple-400">Overall Accuracy</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-slate-100">{overallAccuracy}%</div>
        </div>

        <div className="p-5 rounded-3xl bg-indigo-50/90 dark:bg-[#121638] border border-indigo-200 dark:border-indigo-800/60 space-y-1 shadow-xs">
          <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">Correct / Wrong</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-slate-100">{totalCorrect} / {totalIncorrect}</div>
        </div>
      </div>

      {/* Recent Results List */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          Recent Results ({history.length})
        </h3>

        <div className="space-y-3">
          {history.map(att => {
            const dateStr = new Date(att.timestamp).toLocaleString('bn-BD', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const mins = Math.floor(att.timeTakenSeconds / 60);
            const secs = att.timeTakenSeconds % 60;
            const sessionObj = sessions.find(s => s.id === att.sessionId);

            return (
              <div
                key={att.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#0B1325] border border-slate-200 dark:border-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-sky-300">
                      {att.institution} • {att.session}
                    </span>
                    <span className="text-xs text-slate-400">• {dateStr}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">{att.title}</h4>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{mins}m {secs}s</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{att.correctCount} correct</span>
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{att.incorrectCount} wrong</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-lg font-black text-indigo-600 dark:text-sky-400 font-mono">
                      {att.score} / {att.totalMarks}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      {((att.score / att.totalMarks) * 100).toFixed(1)}% Score
                    </div>
                  </div>

                  {sessionObj && (
                    <button
                      onClick={() => onStartExam(sessionObj)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-colors"
                    >
                      Retake
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0B1325] border-2 border-rose-200 dark:border-rose-900 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Delete Exam History?</h3>
            <p className="text-xs text-slate-500">
              This action cannot be undone. All {history.length} saved exam attempts will be permanently deleted from your browser storage.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteModal(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                onClick={handleDeleteHistory}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
