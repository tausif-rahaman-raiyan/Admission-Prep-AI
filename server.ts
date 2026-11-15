import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // API endpoint for AI Tutor streaming coach
  app.post('/api/ai/tutor', async (req, res) => {
    let clientClosed = false;
    req.on('close', () => { clientClosed = true; });
    res.on('close', () => { clientClosed = true; });

    try {
      const { prompt, userApiKey } = req.body;
      const apiKey = (userApiKey && userApiKey.trim().length > 10) ? userApiKey.trim() : process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: 'Gemini API key not configured. Please add your API key in Settings.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const modelsToTry: Array<{ model: string; thinkingLevel: ThinkingLevel }> = [
        { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
        { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
      ];
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();
      res.write(': stream-open\n\n');

      const failures: string[] = [];
      for (const { model, thinkingLevel } of modelsToTry) {
        if (clientClosed || res.destroyed || res.writableEnded) return;
        try {
          const streamResult = await ai.models.generateContentStream({
            model,
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel },
              systemInstruction: 'You are a fast, accurate admission coach. Independently solve every question and verify the correct option. Reply in clear Bengali mixed with standard English scientific terms. Put mathematical expressions and fractions in LaTeX enclosed by $...$ or $$...$$. Start an initial solution with ✅ **সঠিক উত্তর:** and then concise numbered sections.',
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
