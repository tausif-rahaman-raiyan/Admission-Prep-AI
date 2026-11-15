import { storage } from './storage';

export const GEMINI_MODEL_FALLBACKS = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen', 'gemini-2.5-flash-lite'] as const;

type Callbacks = {
  onModel: (model: string, reset: boolean) => void;
  onText: (text: string) => void;
};

export type AiProviderError = Error & { code?: string };

let preferredDirectModel: string | null = null;
let serverTutorAvailable: boolean | null = null;
let serverHasKey: boolean | null = null;
let lastWarmupAt = 0;

function makeMissingKeyError(message = 'Gemini API key not configured. Please add your API key.'): AiProviderError {
  const err = new Error(message) as AiProviderError;
  err.code = 'MISSING_API_KEY';
  return err;
}

export function isMissingApiKeyError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  if (e.code === 'MISSING_API_KEY') return true;
  const msg = (e.message || '').toLowerCase();
  return msg.includes('api key not configured') || msg.includes('api key required');
}

function parseSseDataLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const data = trimmed.slice(5).trim();
  return !data || data === '[DONE]' ? null : data;
}

export function canUseServerTutorEndpoint(): boolean {
  if (import.meta.env.VITE_API_URL?.trim()) return true;
  if (typeof window === 'undefined') return false;
  return !window.location.hostname.endsWith('github.io');
}

export function hasAvailableAiKey(localKey?: string): boolean {
  const mode = storage.getAiProviderMode();
  if (mode === 'personal') {
    const userKey = (localKey ?? storage.getApiKey()).trim();
    return userKey.length > 10;
  }
  // Mode B: Proxy
  if (!canUseServerTutorEndpoint()) return false;
  return serverTutorAvailable !== false;
}

export function warmAiConnection(force = false): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (!force && now - lastWarmupAt < 45_000) return;
  lastWarmupAt = now;

  const mode = storage.getAiProviderMode();
  if (mode === 'personal') return; // No backend warm-up needed for direct client Gemini API calls

  const apiBase = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
  const warmupUrl = apiBase ? `${apiBase}/api/ai/warmup` : canUseServerTutorEndpoint() && serverTutorAvailable !== false ? '/api/ai/warmup' : null;
  if (warmupUrl) {
    fetch(warmupUrl, { method: 'GET', keepalive: true })
      .then(async res => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || !ct.includes('application/json')) {
          serverTutorAvailable = false;
          return;
        }
        const data = await res.json().catch(() => null);
        if (data?.ok) {
          serverTutorAvailable = true;
        } else {
          serverTutorAvailable = false;
        }
      })
      .catch(() => {
        serverTutorAvailable = false;
      });
  }
  // Pre-warm DNS/TCP/TLS socket to Gemini REST host without sending any API key or using quota.
  fetch('https://generativelanguage.googleapis.com/generate_204', { mode: 'no-cors', keepalive: true }).catch(() => {});
}

async function expressStream(url: string, prompt: string, signal: AbortSignal, cb: Callbacks) {
  // Send ONLY prompt to hosted proxy backend (never send personal API key to backend)
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.error || `AI server returned ${response.status}`) as AiProviderError;
    if (body?.code) err.code = body.code;
    throw err;
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    serverTutorAvailable = false;
    throw new Error('AI server endpoint is not streaming SSE');
  }
  if (!response.body) throw new Error('AI server returned an empty stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      const raw = parseSseDataLine(line);
      if (!raw) continue;
      const event = JSON.parse(raw);
      if (event.model) cb.onModel(event.model, Boolean(event.reset));
      if (event.text) { full += event.text; cb.onText(event.text); }
      if (event.error) throw new Error(event.error);
    }
  }
  if (buffer.trim()) {
    const raw = parseSseDataLine(buffer);
    if (raw) {
      const event = JSON.parse(raw);
      if (event.model) cb.onModel(event.model, Boolean(event.reset));
      if (event.text) { full += event.text; cb.onText(event.text); }
      if (event.error) throw new Error(event.error);
    }
  }
  return full;
}

async function directGemini(prompt: string, apiKey: string, signal: AbortSignal, cb: Callbacks) {
  const orderedModels = preferredDirectModel
    ? [preferredDirectModel, ...GEMINI_MODEL_FALLBACKS.filter(m => m !== preferredDirectModel)]
    : [...GEMINI_MODEL_FALLBACKS];
  const errors: string[] = [];
  for (const model of orderedModels) {
    if (signal.aborted) throw new DOMException('Stopped', 'AbortError');
    cb.onModel(model, true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
      const generationConfig = model === 'gemini-3.1-flash-lite'
        ? { thinkingConfig: { thinkingLevel: 'MINIMAL' } }
        : model === 'gemini-4-hydrogen'
          ? { thinkingConfig: { thinkingLevel: 'LOW' } }
          : { thinkingConfig: { thinkingBudget: 0 } };

      const systemInstruction = {
        parts: [{
          text: `You are an elite, highly accurate Bangladesh university & medical admission coach (covering Physics, Chemistry, Mathematics, Biology, English).

MANDATORY RULES:
1. NEVER ALTER QUESTION DATA: Use exact numerical values, units, conditions, and options from the question. Never silently modify, round, or assume different values (e.g., if 12 kPa is stated, use 12 kPa strictly; never change it to 120 kPa). If a value appears to be a textbook typo, calculate with the exact given value first, then explicitly note the likely intended value under verification.
2. GENUINE CALCULATIONS: Perform actual numerical calculations with exact arithmetic, correct units, dimensional analysis, and appropriate precision (e.g. T = PV / (nR)).
3. LANGUAGE & TERMINOLOGY: Explain in natural academic Bengali. Keep English grammar rules, standard scientific/math terms (Given, Required, Formula, Substitution, Calculation, Final Answer), and LaTeX math in English.
4. LATEX FORMATTING: Use \\( ... \\) for inline math and \\[ ... \\] for display math. Never output broken formulas.
5. NO REPETITION: Do not repeat the same formula or calculations across multiple sections.`
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
        }),
        signal,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error?.message || `${model} returned ${response.status}`);
      }
      if (!response.body) throw new Error(`${model} returned no stream`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        for (const line of lines) {
          const raw = parseSseDataLine(line);
          if (!raw) continue;
          const event = JSON.parse(raw);
          const text = (event.candidates || []).flatMap((candidate: any) => candidate.content?.parts || []).map((part: any) => part.text || '').join('');
          if (text) { full += text; cb.onText(text); }
          if (event.error) throw new Error(event.error.message || `${model} stream failed`);
        }
      }
      if (buffer.trim()) {
        const raw = parseSseDataLine(buffer);
        if (raw) {
          const event = JSON.parse(raw);
          const text = (event.candidates || []).flatMap((candidate: any) => candidate.content?.parts || []).map((part: any) => part.text || '').join('');
          if (text) { full += text; cb.onText(text); }
          if (event.error) throw new Error(event.error.message || `${model} stream failed`);
        }
      }
      if (!full.trim()) throw new Error(`${model} returned an empty response`);
      preferredDirectModel = model;
      return full;
    } catch (error) {
      if (signal.aborted) throw error;
      errors.push(`${model}: ${error instanceof Error ? error.message : 'failed'}`);
    }
  }
  throw new Error(`সব Gemini মডেল ব্যর্থ হয়েছে। ${errors.join(' | ')}`);
}

export async function streamTutorResponse(prompt: string, apiKey: string, signal: AbortSignal, cb: Callbacks) {
  const mode = storage.getAiProviderMode();

  // Mode A: Personal Gemini API Key -> call Gemini directly from browser without sending key to backend
  if (mode === 'personal') {
    if (!apiKey || apiKey.trim().length <= 10) {
      throw makeMissingKeyError('Personal Gemini API key is required. Please set your key in Settings.');
    }
    return directGemini(prompt, apiKey.trim(), signal, cb);
  }

  // Mode B: Hosted Backend Proxy -> call backend proxy using server-side API key
  const apiBase = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
  const proxyUrl = apiBase ? `${apiBase}/api/ai/tutor` : canUseServerTutorEndpoint() && serverTutorAvailable !== false ? '/api/ai/tutor' : null;

  if (proxyUrl) {
    try {
      // Do not send personal key when using hosted backend proxy mode
      const result = await expressStream(proxyUrl, prompt, signal, cb);
      serverTutorAvailable = true;
      return result;
    } catch (error) {
      if (signal.aborted) throw error;
      if (isMissingApiKeyError(error)) throw error;
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('404') || msg.includes('not streaming SSE')) {
        serverTutorAvailable = false;
        serverHasKey = false;
      }
      throw error;
    }
  }

  // Fallback to direct Gemini if proxy is unavailable and personal key exists
  if (apiKey && apiKey.trim().length > 10) {
    return directGemini(prompt, apiKey.trim(), signal, cb);
  }

  throw makeMissingKeyError('Hosted backend proxy is unavailable and no personal Gemini API key is configured.');
}
