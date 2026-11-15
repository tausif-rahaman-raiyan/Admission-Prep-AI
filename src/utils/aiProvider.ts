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
  const userKey = (localKey ?? storage.getApiKey()).trim();
  if (userKey.length > 10) return true;
  if (!canUseServerTutorEndpoint()) return false;
  if (serverTutorAvailable === false || serverHasKey === false) return false;
  return true;
}

export function warmAiConnection(force = false): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (!force && now - lastWarmupAt < 45_000) return;
  lastWarmupAt = now;

  const apiBase = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
  const warmupUrl = apiBase ? `${apiBase}/api/ai/warmup` : canUseServerTutorEndpoint() && serverTutorAvailable !== false ? '/api/ai/warmup' : null;
  if (warmupUrl) {
    fetch(warmupUrl, { method: 'GET', keepalive: true })
      .then(async res => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || !ct.includes('application/json')) {
          serverTutorAvailable = false;
          serverHasKey = false;
          return;
        }
        const data = await res.json().catch(() => null);
        if (data?.ok) {
          serverTutorAvailable = true;
          serverHasKey = typeof data.hasServerKey === 'boolean' ? data.hasServerKey : true;
        } else {
          serverTutorAvailable = false;
          serverHasKey = false;
        }
      })
      .catch(() => {
        serverTutorAvailable = false;
        serverHasKey = false;
      });
  }
  // Pre-warm DNS/TCP/TLS socket to Gemini REST host without sending any API key or using quota.
  fetch('https://generativelanguage.googleapis.com/generate_204', { mode: 'no-cors', keepalive: true }).catch(() => {});
}

async function expressStream(url: string, prompt: string, apiKey: string, signal: AbortSignal, cb: Callbacks) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, userApiKey: apiKey }), signal });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 400 && body?.code === 'MISSING_API_KEY') {
      serverHasKey = false;
      throw makeMissingKeyError(body.error);
    }
    const err = new Error(body.error || `AI server returned ${response.status}`) as AiProviderError;
    if (body?.code) err.code = body.code;
    throw err;
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    serverTutorAvailable = false;
    serverHasKey = false;
    if (apiKey.trim().length <= 10) {
      throw makeMissingKeyError();
    }
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

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
  const apiBase = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
  if (apiBase) {
    return expressStream(`${apiBase}/api/ai/tutor`, prompt, apiKey, signal, cb);
  }
  if (canUseServerTutorEndpoint() && serverTutorAvailable !== false) {
    try {
      const result = await expressStream('/api/ai/tutor', prompt, apiKey, signal, cb);
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
      if (apiKey.trim().length <= 10) {
        throw makeMissingKeyError(msg);
      }
    }
  }
  if (apiKey.trim().length <= 10) {
    throw makeMissingKeyError();
  }
  return directGemini(prompt, apiKey, signal, cb);
}
