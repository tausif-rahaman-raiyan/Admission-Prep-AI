import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Copy, Check, Send, Bot, User, AlertCircle, Key } from 'lucide-react';
import { MarkdownMath } from './MarkdownMath';
import { storage } from '../utils/storage';

interface AiTutorPanelProps {
  question: any;
  onClose: () => void;
  onOpenApiKeyModal: () => void;
  explanationFontSize: number;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export const AiTutorPanel: React.FC<AiTutorPanelProps> = ({
  question,
  onClose,
  onOpenApiKeyModal,
  explanationFontSize
}) => {
  const [apiKey, setApiKey] = useState(storage.getApiKey());
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [modelName, setModelName] = useState('gemini-4-argon');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [copied, setCopied] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = storage.getApiKey();
    setApiKey(key);
    if (key.trim().length > 10) {
      fetchAiExplanation(key);
    }
  }, [question.id]);

  const fetchAiExplanation = async (keyToUse: string, followUp?: string) => {
    setLoading(true);
    if (!followUp) {
      setStreamedText('');
    }

    try {
      const prompt = `Admission Test Question Analysis:
- Question Number: ${question.number}
- Subject: ${question.subject}
- Question Type: ${question.questionType}
- Question Stem: ${question.question}
- Options: ${JSON.stringify(question.options)}
- Reference Context: ${(question.explanation || '').slice(0, 900)}

${followUp ? `Student's follow-up question: "${followUp}"\nGive a direct, compact, and super helpful answer in Bengali mixed with English technical terms using LaTeX ($...$).` : `Solve this MCQ independently step-by-step and write a compact, high-yield admission response in Bengali following this EXACT structure:

✅ **সঠিক উত্তর:** [exact option label + option text YOU determined to be correct]

1. 🎯 **মূল সূত্র ও যুক্তি:** 1–2 concise lines with the exact law/formula in LaTeX $...$ and why this option is correct.

2. 📐 **সমাধান ও ব্যাখ্যা:** direct compact calculation or key elimination steps using LaTeX ($...$ and \\frac{a}{b}). Tight and scannable.

3. ⚡ **এডমিশন শর্টকাট ও ট্রিকস:** the fastest 10-second calculator-free exam-hall trick (ratio, unit check, mental math or memory cue) and 1 common trap to avoid.`}`;

      const response = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userApiKey: keyToUse })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to connect to AI server');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body reader not available');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.model) {
                setModelName(parsed.model);
              }
              if (parsed.text) {
                fullResponseText += parsed.text;
                setStreamedText(fullResponseText);
              }
            } catch {}
          }
        }
      }

      if (followUp) {
        setChatMessages(prev => [...prev, { role: 'ai', text: fullResponseText }]);
      }
    } catch (err: any) {
      console.error(err);
      if (!followUp) {
        setStreamedText(`❌ **Error:** ${err.message || 'Could not generate AI explanation. Please verify your Gemini API key in Settings.'}`);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: `❌ Error: ${err.message}` }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim() || loading) return;
    const userQ = followUpInput.trim();
    setFollowUpInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userQ }]);
    fetchAiExplanation(apiKey, userQ);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(streamedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to parse answer and sections
  const parseAiOutput = (text: string) => {
    let answerLine = '';
    let bodyText = text;

    const firstLineMatch = text.match(/✅\s*\*\*[^:]+:\*\*\s*(.*)/);
    if (firstLineMatch) {
      answerLine = firstLineMatch[0];
      bodyText = text.replace(firstLineMatch[0], '');
    }

    // Split body into sections on emojis 🎯 📐 ⚡ or numbered steps
    const rawSections = bodyText.split(/(?=[1-3]\.\s*[🎯📐⚡]|[🎯📐⚡])/g).filter(s => s.trim().length > 0);
    return { answerLine, sections: rawSections.length > 0 ? rawSections : [bodyText] };
  };

  if (!apiKey || apiKey.trim().length <= 10) {
    return (
      <div className="mt-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 space-y-3">
        <div className="flex items-center gap-2.5 font-bold text-base">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Gemini API Key Required</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
          To use the AI Tutor Admission Coach, please add your Gemini API Key in Settings.
        </p>
        <button
          onClick={onOpenApiKeyModal}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Key className="w-4 h-4" />
          <span>Add Gemini API Key</span>
        </button>
      </div>
    );
  }

  const { answerLine, sections } = parseAiOutput(streamedText);

  return (
    <div className="mt-4 rounded-2xl bg-indigo-50/50 dark:bg-gradient-to-b dark:from-[#091124] dark:to-[#060B18] border-2 border-indigo-200 dark:border-indigo-500/40 shadow-lg overflow-hidden transition-all">
      {/* Header Strip */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-100/80 dark:bg-[#0B152F] border-b border-indigo-200 dark:border-indigo-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-indigo-950 dark:text-sky-200 flex items-center gap-2">
              <span>AI Tutor Admission Coach</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600/10 dark:bg-sky-500/10 text-indigo-700 dark:text-sky-300 border border-indigo-500/30">
                ⚡ Fast AI ({modelName})
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {streamedText && (
            <button
              onClick={copyToClipboard}
              title="Copy Solution"
              className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800 text-indigo-700 dark:text-sky-300 hover:bg-white dark:hover:bg-slate-700 border border-indigo-200 dark:border-indigo-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">বন্ধ করুন</span>
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {loading && !streamedText && (
          <div className="flex items-center gap-3 py-6 justify-center text-indigo-600 dark:text-sky-400 font-semibold text-sm">
            <div className="w-5 h-5 border-2 border-indigo-600 dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span>AI Coach is solving the problem independently...</span>
          </div>
        )}

        {/* Answer Highlight Pill */}
        {answerLine && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2">
            <MarkdownMath content={answerLine} />
          </div>
        )}

        {/* Sections */}
        <div className="space-y-3">
          {sections.map((sec, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#070D1D] border border-indigo-100 dark:border-indigo-900/60 shadow-xs"
            >
              <MarkdownMath content={sec} fontSize={explanationFontSize} />
            </div>
          ))}
        </div>

        {loading && streamedText && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-sky-400 font-bold animate-pulse">
            <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-sky-400 animate-ping" />
            <span>Generating next part...</span>
          </div>
        )}

        {/* Chat Thread for Follow-ups */}
        {chatMessages.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs sm:text-sm ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-[#0C152B] border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                  }`}
                >
                  <MarkdownMath content={msg.text} fontSize={explanationFontSize} />
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* Follow-up Form */}
        <form onSubmit={handleSendFollowUp} className="flex gap-2 pt-2">
          <input
            type="text"
            value={followUpInput}
            onChange={e => setFollowUpInput(e.target.value)}
            placeholder="Any other shortcut or question about this problem?"
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070D1D] border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !followUpInput.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
