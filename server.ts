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

      const modelsToTry = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-2.5-flash'];
      let streamResult = null;
      let usedModel = '';

      for (const model of modelsToTry) {
        try {
          const config: any = {
            systemInstruction: 'You are an elite, fast, and accurate admission coach (AI Tutor Admission Coach). Independently solve every question and verify which option is right—never blindly trust a pre-selected answer. Write concisely in clear Bengali mixed with standard English scientific terms. Always format mathematical formulas, fractions (\\frac{a}{b}), and variables in LaTeX enclosed in dollar signs ($...$ for inline and $$...$$ for standalone equations). Always begin your initial solution with the exact first line: ✅ **সঠিক উত্তর:** followed by the AI-determined answer, then the 3 numbered sections (1. 🎯, 2. 📐, 3. ⚡).'
          };

          if (model === 'gemini-4-argon') {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.MEDIUM };
          } else if (model === 'gemini-3.8-flash') {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          }

          streamResult = await ai.models.generateContentStream({
            model,
            contents: prompt,
            config,
          });
          usedModel = model;
          break;
        } catch (e: any) {
          console.warn(`Model ${model} failed, trying next:`, e?.message);
        }
      }

      if (!streamResult) {
        return res.status(500).json({ error: 'Failed to generate AI Tutor response from all available models.' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send metadata first
      res.write(`data: ${JSON.stringify({ model: usedModel })}\n\n`);

      for await (const chunk of streamResult) {
        const text = chunk.text || '';
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      console.error('AI Tutor API error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Internal server error' });
      } else {
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
