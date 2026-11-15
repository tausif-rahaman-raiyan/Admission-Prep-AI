import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const aiClientCache = new Map<string, GoogleGenAI>();
const MODELS_TO_TRY: Array<{ model: string; thinkingLevel: ThinkingLevel }> = [
  { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
  { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
];
let preferredModelIndex = 0;

function getAiClient(apiKey: string): GoogleGenAI {
  let client = aiClientCache.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    if (aiClientCache.size > 16) aiClientCache.clear();
    aiClientCache.set(apiKey, client);
  }
  return client;
}

async function warmUpstreamSocket() {
  try {
    await fetch('https://generativelanguage.googleapis.com/generate_204', { method: 'HEAD' });
  } catch {
    // Ignore connectivity probe failures
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // CORS middleware for production Cloud Run + GitHub Pages + local dev
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://tausif-rahaman-raiyan.github.io',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.github.io') || origin.endsWith('.run.app') || origin.endsWith('.aistudio.google.com'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  const PORT = process.env.PORT || 8080;
  const isProd = process.env.NODE_ENV === 'production' || process.env.PORT !== undefined;

  // Health check endpoint for Cloud Run and keep-alive pings
  app.get('/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ status: 'healthy', service: 'admission-prep-ai', timestamp: Date.now() });
  });

  // Zero-quota connection warm-up endpoint (no Gemini API call / no token usage)
  app.get('/api/ai/warmup', async (_req, res) => {
    await warmUpstreamSocket();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, hasServerKey: Boolean(process.env.GEMINI_API_KEY?.trim()) });
  });

  // API endpoint for AI Tutor streaming coach
  app.post('/api/ai/tutor', async (req, res) => {
    let clientClosed = false;
    res.on('close', () => {
      if (!res.writableEnded) clientClosed = true;
    });

    try {
      const { prompt, userApiKey } = req.body;
      const apiKey = (userApiKey && userApiKey.trim().length > 10) ? userApiKey.trim() : process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({
          code: 'MISSING_API_KEY',
          error: 'Gemini API key not configured. Please add your API key in Settings.',
        });
      }

      const ai = getAiClient(apiKey);
      const orderedIndices = [
        preferredModelIndex,
        ...MODELS_TO_TRY.map((_, idx) => idx).filter(idx => idx !== preferredModelIndex),
      ];

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      res.write(': stream-open\n\n');

      const failures: string[] = [];
      for (const idx of orderedIndices) {
        if (clientClosed || res.destroyed || res.writableEnded) return;
        const { model, thinkingLevel } = MODELS_TO_TRY[idx];
        try {
          const streamResult = await ai.models.generateContentStream({
            model,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel },
              systemInstruction: 'You are a fast, accurate Bangladesh university admission coach. Explain concisely in clear Bengali, keeping English subject grammar rules, technical terms, proper names, and LaTeX formulas ($...$) in English.',
            },
          });
          res.write(`data: ${JSON.stringify({ model, reset: true })}\n\n`);
          let emittedText = false;
          for await (const chunk of streamResult) {
            if (clientClosed || res.destroyed || res.writableEnded) return;
            const text = chunk.text || '';
            if (text) {
              emittedText = true;
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          }
          if (!emittedText) throw new Error('Model returned an empty response');
          preferredModelIndex = idx;
          res.write('data: [DONE]\n\n');
          return res.end();
        } catch (error: any) {
          if (clientClosed) return;
          failures.push(`${model}: ${error?.message || 'request failed'}`);
          console.warn(`Gemini model ${model} failed; moving to the next configured model.`, error?.message);
        }
      }
      if (!clientClosed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: `সব Gemini মডেল ব্যর্থ হয়েছে। ${failures.join(' | ')}` })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }

    } catch (error: any) {
      console.error('AI Tutor API error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Internal server error' });
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  });

  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
