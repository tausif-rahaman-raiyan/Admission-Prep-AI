export const GEMINI_MODEL_FALLBACKS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'] as const;

type Callbacks = {
  onModel: (model: string, reset: boolean) => void;
  onText: (text: string) => void;
};

function parseData(block: string): string | null {
  const data = block.split(/\r?\n/).find(line => line.startsWith('data:'))?.slice(5).trim();
  return !data || data === '[DONE]' ? null : data;
}

async function expressStream(url: string, prompt: string, apiKey: string, signal: AbortSignal, cb: Callbacks) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, userApiKey: apiKey }), signal });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `AI server returned ${response.status}`);
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
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    for (const block of blocks) {
      const raw = parseData(block);
      if (!raw) continue;
      const event = JSON.parse(raw);
      if (event.model) cb.onModel(event.model, Boolean(event.reset));
      if (event.text) { full += event.text; cb.onText(event.text); }
      if (event.error) throw new Error(event.error);
    }
  }
  return full;
}

async function directGemini(prompt: string, apiKey: string, signal: AbortSignal, cb: Callbacks) {
  const errors: string[] = [];
  for (const model of GEMINI_MODEL_FALLBACKS) {
    if (signal.aborted) throw new DOMException('Stopped', 'AbortError');
    cb.onModel(model, true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.25 } }),
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
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || '';
        for (const block of blocks) {
          const raw = parseData(block);
          if (!raw) continue;
          const event = JSON.parse(raw);
          const text = (event.candidates || []).flatMap((candidate: any) => candidate.content?.parts || []).map((part: any) => part.text || '').join('');
          if (text) { full += text; cb.onText(text); }
          if (event.error) throw new Error(event.error.message || `${model} stream failed`);
        }
      }
      if (!full.trim()) throw new Error(`${model} returned an empty response`);
      return full;
    } catch (error) {
      if (signal.aborted) throw error;
      errors.push(`${model}: ${error instanceof Error ? error.message : 'failed'}`);
    }
  }
  throw new Error(`সব Gemini মডেল ব্যর্থ হয়েছে। ${errors.join(' | ')}`);
}

export async function streamTutorResponse(prompt: string, apiKey: string, signal: AbortSignal, cb: Callbacks) {
  const apiBase = import.meta.env.VITE_API_URL?.trim().replace(/\\/$/, '');
  if (apiBase) {
    cb.onModel('Express API', true);
    return expressStream(`${apiBase}/api/ai/tutor`, prompt, apiKey, signal, cb);
  }
  return directGemini(prompt, apiKey, signal, cb);
}
