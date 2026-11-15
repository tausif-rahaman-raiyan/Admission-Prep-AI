import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Sparkles, X, Copy, Check, Send, Bot, User, AlertCircle, Key, BookOpen, Calculator, Zap } from 'lucide-react';
import { MathText } from './MarkdownMath';
import { storage } from '../utils/storage';
import { streamTutorResponse, GEMINI_MODEL_FALLBACKS, hasAvailableAiKey, isMissingApiKeyError } from '../utils/aiProvider';

interface AiTutorPanelProps {
  question: any;
  onClose: () => void;
  onOpenApiKeyModal: () => void;
  onMissingApiKey?: () => void;
  explanationFontSize: number;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

interface ParsedTutorSections {
  formulasLogic: string;
  solutionExplanation: string;
  admissionHacks: string;
  isError: boolean;
  errorText: string;
}

const BOX_TITLES = {
  sec1: 'Fundamental Formulas and Logic:-',
  sec2: 'Solution and Explanation:-',
  sec3: 'Admission Hacks(Option Elimination,Shortcuts and Tricks):-',
} as const;

function stripTrailingIncompleteTag(text: string): string {
  return text.replace(/\[(?:\[(?:S(?:E(?:C(?:_(?:[123](?:\])?)?)?)?)?)?)?$/i, '');
}

function cleanSectionBody(body: string, headingRegex: RegExp): string {
  return body
    .replace(headingRegex, '')
    .replace(/^\s*[:\-–—]+\s*/, '')
    .trim();
}

function parseThreeTutorSections(raw: string, isStreaming: boolean): ParsedTutorSections {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { formulasLogic: '', solutionExplanation: '', admissionHacks: '', isError: false, errorText: '' };
  }
  if (trimmed.startsWith('❌')) {
    return { formulasLogic: '', solutionExplanation: '', admissionHacks: '', isError: true, errorText: trimmed };
  }

  const sanitized = isStreaming ? stripTrailingIncompleteTag(raw) : raw;

  const markerRegex = /\[\[SEC_([123])\]\]|(?:^|\n)\s*(?:#{1,4}\s*|\*{1,2})?(1\.?\s*Fundamental Formulas and Logic|2\.?\s*Solution and Explanation|3\.?\s*Admission Hacks\s*\([^)]*\))\s*:?-?\s*\*{0,2}/gi;
  const matches: Array<{ sec: 1 | 2 | 3; start: number; end: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = markerRegex.exec(sanitized)) !== null) {
    let sec: 1 | 2 | 3 = 1;
    if (match[1]) {
      sec = Number(match[1]) as 1 | 2 | 3;
    } else if (match[2]) {
      const label = match[2].toLowerCase();
      if (label.includes('solution')) sec = 2;
      else if (label.includes('admission hacks')) sec = 3;
      else sec = 1;
    }
    matches.push({ sec, start: match.index, end: match.index + match[0].length });
  }

  if (matches.length === 0) {
    return {
      formulasLogic: '',
      solutionExplanation: sanitized.trim(),
      admissionHacks: '',
      isError: false,
      errorText: '',
    };
  }

  let formulasLogic = '';
  let solutionExplanation = '';
  let admissionHacks = '';

  const leadingText = sanitized.slice(0, matches[0].start).trim();

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const nextStart = i + 1 < matches.length ? matches[i + 1].start : sanitized.length;
    const chunk = sanitized.slice(cur.end, nextStart);
    if (cur.sec === 1) {
      formulasLogic = cleanSectionBody(
        chunk,
        /^\s*(?:#{1,4}\s*|\*{1,2})?(?:Fundamental Formulas and Logic)\s*:?-?\s*\*{0,2}\s*/i
      );
    } else if (cur.sec === 2) {
      solutionExplanation = cleanSectionBody(
        chunk,
        /^\s*(?:#{1,4}\s*|\*{1,2})?(?:Solution and Explanation)\s*:?-?\s*\*{0,2}\s*/i
      );
    } else {
      admissionHacks = cleanSectionBody(
        chunk,
        /^\s*(?:#{1,4}\s*|\*{1,2})?(?:Admission Hacks\s*\([^)]*\))\s*:?-?\s*\*{0,2}\s*/i
      );
    }
  }

  if (leadingText && !solutionExplanation) {
    solutionExplanation = leadingText;
  }

  return {
    formulasLogic,
    solutionExplanation,
    admissionHacks,
    isError: false,
    errorText: '',
  };
}

function formatThreeSectionsForCopy(raw: string, fullDerivationText: string, derivationMode: 'concise' | 'full'): string {
  const parsed = parseThreeTutorSections(raw, false);
  if (parsed.isError) return parsed.errorText;
  const parts: string[] = [];
  if (parsed.formulasLogic) parts.push(`${BOX_TITLES.sec1}\n${parsed.formulasLogic}`);
  const activeSolution = derivationMode === 'full' && fullDerivationText.trim() ? fullDerivationText : parsed.solutionExplanation;
  if (activeSolution) parts.push(`${BOX_TITLES.sec2}\n${activeSolution}`);
  if (parsed.admissionHacks) parts.push(`${BOX_TITLES.sec3}\n${parsed.admissionHacks}`);
  return parts.length > 0 ? parts.join('\n\n') : raw;
}

export const AiTutorPanel: React.FC<AiTutorPanelProps> = ({
  question,
  onClose,
  onOpenApiKeyModal,
  onMissingApiKey,
  explanationFontSize
}) => {
  const [apiKey, setApiKey] = useState(storage.getApiKey());
  const [missingKeyError, setMissingKeyError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDerivation, setLoadingDerivation] = useState(false);
  const [derivationMode, setDerivationMode] = useState<'concise' | 'full'>('concise');
  const [fullDerivationText, setFullDerivationText] = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [streamingFollowUpText, setStreamingFollowUpText] = useState('');
  const [modelName, setModelName] = useState<string>(GEMINI_MODEL_FALLBACKS[0]);
  const abortController = useRef<AbortController | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [copied, setCopied] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = storage.getApiKey();
    setApiKey(key);
    setDerivationMode('concise');
    setFullDerivationText('');
    setChatMessages([]);
    if (hasAvailableAiKey(key)) {
      setMissingKeyError(false);
      fetchAiExplanation(key, 'initial');
    } else {
      setMissingKeyError(true);
      onMissingApiKey?.();
    }
  }, [question.id]);

  useEffect(() => {
    const handleKeyUpdated = () => {
      const updated = storage.getApiKey();
      setApiKey(updated);
      if (hasAvailableAiKey(updated)) {
        setMissingKeyError(false);
        if (!streamedText && !loading) {
          fetchAiExplanation(updated, 'initial');
        }
      }
    };
    window.addEventListener('admission-api-key-updated', handleKeyUpdated);
    return () => window.removeEventListener('admission-api-key-updated', handleKeyUpdated);
  }, [question.id, streamedText, loading]);

  useEffect(() => () => abortController.current?.abort(), []);

  useEffect(() => {
    if (streamingFollowUpText) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
  }, [streamingFollowUpText]);

  const fetchAiExplanation = async (
    keyToUse: string,
    mode: 'initial' | 'derivation' | 'followup',
    followUpQuestion?: string
  ) => {
    if (mode === 'derivation') {
      setLoadingDerivation(true);
      setDerivationMode('full');
      setFullDerivationText('');
    } else if (mode === 'followup') {
      setLoading(true);
      setStreamingFollowUpText('');
    } else {
      setLoading(true);
      setStreamedText('');
      setDerivationMode('concise');
      setFullDerivationText('');
    }

    let fullResponseText = '';
    try {
      const hasOptions = Array.isArray(question.options) && question.options.length > 0;
      const optionList = hasOptions
        ? question.options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}) ${opt}`).join(' | ')
        : '';

      let prompt = '';
      if (mode === 'followup') {
        prompt = `Question (${question.subject}): ${question.question}${optionList ? `\nOptions: ${optionList}` : ''}
Previous solution context: ${(fullDerivationText || streamedText || question.explanation || '').slice(0, 600)}
Student follow-up: "${followUpQuestion}"
Reply directly, accurately, and compactly in clear academic Bengali; keep English subject rules, terms, and LaTeX math in English.`;
      } else if (mode === 'derivation') {
        prompt = `Subject: ${question.subject} (${question.questionType || 'MCQ'})
Question: ${question.question}${optionList ? `\nOptions: ${optionList}` : ''}

Provide a complete, rigorous academic mathematical derivation and calculation for this problem.
Follow this EXACT structure:

### A. Given Information (প্রদত্ত)
List all given parameters with their exact numerical values and units from the question. (STRICT: Never alter or assume different values, e.g. 12 kPa remains 12 kPa).

### B. Required (নির্ণয় করতে হবে)
State exactly what needs to be calculated or found.

### C. Relevant Formula (প্রয়োজনীয় সূত্র)
State the original governing equation(s) in LaTeX display math (\\[ ... \\]).

### D. Mathematical Derivation (সূত্রের রূপান্তর)
Show each algebraic manipulation step to isolate the required variable.

### E. Substitution (মান বসিয়ে)
Substitute the actual given values with units into the formula for each case/option.

### F. Calculation (গণনা)
Show intermediate arithmetic and calculate the exact numerical result with units (e.g. using R = 8.314 kPa·L·mol⁻¹·K⁻¹ to compute exact temperatures in Kelvin).

### G. Final Answer (চূড়ান্ত উত্তর)
State the result with correct units, appropriate precision, and indicate the matching option.

### H. Verification & Typo Analysis (যাচাই ও টাইপো নোট)
Verify the result logically and dimensionally. If any value in the question appears to be a textbook typo (e.g., 12 kPa instead of standard 120 kPa), calculate both: state the literal calculated result first, then explicitly show what the result would be if the standard textbook value was intended.

Write explanations in natural academic Bengali, and standard terms/LaTeX in English. Avoid redundant filler.`;
      } else {
        prompt = `Subject: ${question.subject} (${question.questionType || 'MCQ'})
Question: ${question.question}${optionList ? `\nOptions: ${optionList}` : ''}

Respond ONLY with these exact 3 section markers in order (no extra text before [[SEC_1]]).
Write explanations in natural, clear academic Bengali. Keep English grammar rules, standard scientific/math terms (Given, Required, Formula, Substitution, Calculation, Final Answer), and LaTeX math (\\( ... \\) for inline, \\[ ... \\] for display) in English.

MANDATORY RULES:
- NEVER ALTER OR ROUND QUESTION DATA: Use exact numbers, units, and conditions from the question. Never silently modify values (e.g., if 12 kPa is given, use 12 kPa strictly; never change it to 120 kPa). If a value appears to be a textbook typo, calculate with the exact given value first, then explicitly note the likely typo.
- NO REPETITION: Do not duplicate identical formulas or identical calculations across sections.

[[SEC_1]]
Core formula(s), scientific laws, or grammar principles needed to solve this. Write formulas in LaTeX.

[[SEC_2]]
${hasOptions
  ? `Calculate or compare the numerical values for all options first (A, B, C, D) with units and exact values (e.g. \\(T = \\frac{PV}{nR}\\); compute values for each container). Then state **সঠিক উত্তর:** [Correct Option Letter and Text]. If a question value has a likely typo (e.g. 12 kPa), calculate with the exact given value first and note the likely typo.`
  : `Clear step-by-step Written calculation or logical explanation with exact units and values.`}

[[SEC_3]]
${hasOptions
  ? `Admission exam hacks: Fastest proportional shortcut (e.g. if constants allow direct ratio comparison like \\(T \\propto PV\\)), option elimination tactics, and common exam traps.`
  : `Written exam speed tricks, dimensional/boundary sanity checks, and common traps to avoid.`}`;
      }

      abortController.current?.abort();
      const controller = new AbortController();
      abortController.current = controller;
      await streamTutorResponse(prompt, keyToUse, controller.signal, {
        onModel: (model, reset) => {
          flushSync(() => {
            setModelName(model);
            if (reset) {
              fullResponseText = '';
              if (mode === 'initial') setStreamedText('');
              else if (mode === 'derivation') setFullDerivationText('');
              else setStreamingFollowUpText('');
            }
          });
        },
        onText: chunk => {
          fullResponseText += chunk;
          flushSync(() => {
            if (mode === 'initial') setStreamedText(fullResponseText);
            else if (mode === 'derivation') setFullDerivationText(fullResponseText);
            else setStreamingFollowUpText(fullResponseText);
          });
        },
      });

      if (mode === 'followup' && fullResponseText.trim()) {
        setChatMessages(prev => [...prev, { role: 'ai', text: fullResponseText }]);
        setStreamingFollowUpText('');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        if (mode === 'followup' && fullResponseText.trim()) {
          setChatMessages(prev => [...prev, { role: 'ai', text: fullResponseText }]);
          setStreamingFollowUpText('');
        }
        return;
      }
      if (isMissingApiKeyError(err)) {
        setMissingKeyError(true);
        onMissingApiKey?.();
        return;
      }
      console.error(err);
      if (mode === 'initial') {
        setStreamedText(`❌ **Error:** ${err.message || 'Could not generate AI explanation. Please verify your Gemini API key in Settings.'}`);
      } else if (mode === 'derivation') {
        setFullDerivationText(`❌ **Error:** ${err.message || 'Could not generate full derivation.'}`);
      } else {
        setStreamingFollowUpText('');
        setChatMessages(prev => [...prev, { role: 'ai', text: `❌ Error: ${err.message}` }]);
      }
    } finally {
      setLoading(false);
      setLoadingDerivation(false);
      abortController.current = null;
    }
  };

  const handleSendFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim() || loading || loadingDerivation) return;
    const userQ = followUpInput.trim();
    setFollowUpInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userQ }]);
    fetchAiExplanation(apiKey, 'followup', userQ);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatThreeSectionsForCopy(streamedText, fullDerivationText, derivationMode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedSections = parseThreeTutorSections(streamedText, loading);
  const hasVisibleInitialContent = Boolean(
    parsedSections.isError ||
    parsedSections.formulasLogic ||
    parsedSections.solutionExplanation ||
    parsedSections.admissionHacks
  );

  if (missingKeyError || !hasAvailableAiKey(apiKey)) {
    return (
      <div className="mt-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 font-bold text-base">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Gemini API Key Required</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-900/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
          AI Tutor ব্যবহার করতে আপনার Gemini API Key সেট করুন। নিচের বাটনে ক্লিক করলেই সহজে API Key সেট করতে পারবেন।
        </p>
        <button
          onClick={onOpenApiKeyModal}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Key className="w-4 h-4" />
          <span>Set Gemini API Key</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl bg-indigo-50/50 dark:bg-gradient-to-b dark:from-[#091124] dark:to-[#060B18] border-2 border-indigo-200 dark:border-indigo-500/40 shadow-lg overflow-hidden transition-all">
      {/* Header Strip */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-100/80 dark:bg-[#0B152F] border-b border-indigo-200 dark:border-indigo-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-indigo-950 dark:text-sky-200 flex items-center gap-2 flex-wrap">
              <span>AI Tutor Admission Coach</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600/10 dark:bg-sky-500/10 text-indigo-700 dark:text-sky-300 border border-indigo-500/30">
                ⚡ Fast AI ({modelName})
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading || loadingDerivation ? (
            <button
              onClick={() => abortController.current?.abort()}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-sm cursor-pointer transition-colors"
              type="button"
            >
              Stop
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3.5 sm:p-4 space-y-3">
        {loading && !hasVisibleInitialContent && !streamingFollowUpText && (
          <div className="flex items-center gap-3 py-4 justify-center text-indigo-600 dark:text-sky-400 font-semibold text-sm">
            <div className="w-5 h-5 border-2 border-indigo-600 dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span>Streaming answer in real time...</span>
          </div>
        )}

        {/* Structured 3-Box Initial Response */}
        {parsedSections.isError ? (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/70 text-rose-900 dark:text-rose-200 shadow-xs">
            <MathText content={parsedSections.errorText} fontSize={explanationFontSize} />
          </div>
        ) : hasVisibleInitialContent ? (
          <div className="space-y-3">
            {parsedSections.formulasLogic && (
              <div className="rounded-2xl bg-white dark:bg-[#0C152B] border border-sky-200 dark:border-sky-800/70 overflow-hidden shadow-xs">
                <div className="px-3.5 py-2 bg-sky-50/80 dark:bg-sky-950/40 border-b border-sky-200/80 dark:border-sky-800/60 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <h5 className="text-xs sm:text-[13px] font-black text-sky-900 dark:text-sky-200">
                    {BOX_TITLES.sec1}
                  </h5>
                </div>
                <div className="p-3.5 sm:p-4 text-slate-800 dark:text-slate-200">
                  <MathText
                    content={parsedSections.formulasLogic}
                    fontSize={explanationFontSize}
                    className="[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ol]:my-1 [&_ul]:my-1 [&_li]:my-0.5"
                  />
                </div>
              </div>
            )}

            {/* Box 2: Solution and Explanation (Concise or Full Derivation) */}
            {(parsedSections.solutionExplanation || (derivationMode === 'full' && (fullDerivationText || loadingDerivation))) && (
              <div className="rounded-2xl bg-white dark:bg-[#0C152B] border border-indigo-200 dark:border-indigo-800/70 overflow-hidden shadow-xs">
                <div className="px-3.5 py-2 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <h5 className="text-xs sm:text-[13px] font-black text-indigo-900 dark:text-indigo-200">
                      {BOX_TITLES.sec2}
                    </h5>
                  </div>
                  {derivationMode === 'full' ? (
                    <button
                      type="button"
                      onClick={() => setDerivationMode('concise')}
                      className="text-[11px] font-bold text-indigo-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Switch to Concise</span>
                    </button>
                  ) : fullDerivationText ? (
                    <button
                      type="button"
                      onClick={() => setDerivationMode('full')}
                      className="text-[11px] font-bold text-indigo-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Switch to Full Derivation</span>
                    </button>
                  ) : null}
                </div>
                <div className="p-3.5 sm:p-4 text-slate-800 dark:text-slate-200">
                  {derivationMode === 'full' ? (
                    loadingDerivation && !fullDerivationText ? (
                      <div className="flex items-center gap-2.5 py-4 text-indigo-600 dark:text-sky-400 text-xs font-bold justify-center">
                        <div className="w-4 h-4 border-2 border-indigo-600 dark:border-sky-400 border-t-transparent rounded-full animate-spin" />
                        <span>Generating full mathematical derivation (A–H)...</span>
                      </div>
                    ) : (
                      <MathText
                        content={fullDerivationText}
                        fontSize={explanationFontSize}
                        className="[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ol]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5 [&_h3]:text-xs [&_h3]:font-black [&_h3]:text-indigo-900 dark:[&_h3]:text-sky-300 [&_h3]:mt-3 [&_h3]:mb-1 [&_h3:first-child]:mt-0"
                      />
                    )
                  ) : (
                    <MathText
                      content={parsedSections.solutionExplanation}
                      fontSize={explanationFontSize}
                      className="[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ol]:my-1 [&_ul]:my-1 [&_li]:my-0.5"
                    />
                  )}
                </div>
              </div>
            )}

            {parsedSections.admissionHacks && (
              <div className="rounded-2xl bg-white dark:bg-[#0C152B] border border-amber-200 dark:border-amber-800/70 overflow-hidden shadow-xs">
                <div className="px-3.5 py-2 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/60 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <h5 className="text-xs sm:text-[13px] font-black text-amber-900 dark:text-amber-200">
                    {BOX_TITLES.sec3}
                  </h5>
                </div>
                <div className="p-3.5 sm:p-4 text-slate-800 dark:text-slate-200">
                  <MathText
                    content={parsedSections.admissionHacks}
                    fontSize={explanationFontSize}
                    className="[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ol]:my-1 [&_ul]:my-1 [&_li]:my-0.5"
                  />
                </div>
              </div>
            )}

            {/* Show Full Steps Action Button */}
            {!loading && !loadingDerivation && (
              <div className="flex justify-end pt-1">
                {derivationMode === 'concise' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (fullDerivationText.trim()) {
                        setDerivationMode('full');
                      } else {
                        fetchAiExplanation(apiKey, 'derivation');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-sky-300 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-400" />
                    <span>Show Full Steps & Derivation (A–H)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDerivationMode('concise')}
                    className="px-4 py-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Show Concise Solution</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Chat Thread for Follow-ups */}
        {(chatMessages.length > 0 || streamingFollowUpText) && (
          <div className="space-y-2.5 pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 text-xs sm:text-sm ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[88%] ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-[#0C152B] border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                  }`}
                >
                  <MathText
                    content={msg.text}
                    fontSize={explanationFontSize}
                    className="[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ol]:my-1 [&_ul]:my-1 [&_li]:my-0.5"
                  />
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {streamingFollowUpText && (
              <div className="flex gap-2.5 text-xs sm:text-sm justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl max-w-[88%] bg-white dark:bg-[#0C152B] border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-200 rounded-bl-xs">
                  <MathText
                    content={streamingFollowUpText}
                    fontSize={explanationFontSize}
                    className="[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ol]:my-1 [&_ul]:my-1 [&_li]:my-0.5"
                  />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}

        {(loading || loadingDerivation) && (hasVisibleInitialContent || streamingFollowUpText || fullDerivationText) && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-sky-400 font-bold">
            <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-sky-400 animate-ping" />
            <span>Streaming {loadingDerivation ? 'full mathematical derivation' : 'live'}...</span>
          </div>
        )}

        {/* Follow-up Form (hidden while streaming so only Stop is shown) */}
        {!loading && !loadingDerivation && (
          <form onSubmit={handleSendFollowUp} className="flex gap-2 pt-1">
            <input
              type="text"
              value={followUpInput}
              onChange={e => setFollowUpInput(e.target.value)}
              placeholder="Any other shortcut or question about this problem?"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#070D1D] border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!followUpInput.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
