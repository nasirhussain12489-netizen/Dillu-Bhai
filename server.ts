import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, 'madarsa_portal_db.json');

const app = express();
app.use(express.json({ limit: '25mb' }));

function readPortalDbFromDisk(): Record<string, unknown> | null {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading portal DB:', err);
  }
  return null;
}

function writePortalDbToDisk(state: Record<string, unknown>) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing portal DB:', err);
  }
}

let portalServerState: Record<string, unknown> | null = readPortalDbFromDisk();

app.get('/api/portal/state', (_req: Request, res: Response) => {
  if (!portalServerState) {
    portalServerState = readPortalDbFromDisk();
  }
  res.json({ state: portalServerState });
});

app.post('/api/portal/state', (req: Request, res: Response) => {
  if (req.body && typeof req.body.state === 'object' && req.body.state !== null) {
    portalServerState = req.body.state;
    writePortalDbToDisk(req.body.state);
  }
  res.json({ ok: true, state: portalServerState });
});

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatApiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID')) {
    return 'API key permission denied or invalid. Please check or select a billing-enabled API key in the Settings > Secrets panel.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Quota exceeded for this model. Selecting a billing-enabled API key in Settings > Secrets increases quota for Pro, Nano Banana 2.1, and Veo 3 models.';
  }
  return raw;
}

// 1. Multi-Turn Chat Endpoint (gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, model = 'gemini-3.5-flash', systemInstruction } = req.body;
    const ai = getAiClient();

    const contents = (messages || []).map((m: { role: string; text: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction:
            systemInstruction ||
            'You are Vortex Studio AI, a senior creative technologist and systems architect. Provide clear, direct, actionable responses.',
        },
      });
    } catch (innerErr: unknown) {
      const msg = innerErr instanceof Error ? innerErr.message : String(innerErr);
      if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('429') || msg.includes('403')) {
        const fallbackModel = model === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';
        response = await ai.models.generateContent({
          model: fallbackModel,
          contents,
          config: {
            systemInstruction:
              systemInstruction ||
              'You are Vortex Studio AI, a senior creative technologist and systems architect. Provide clear, direct, actionable responses.',
          },
        });
      } else {
        throw innerErr;
      }
    }

    res.json({
      text: response.text || '',
      modelUsed: model,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: formatApiError(err) });
  }
});

// 2. Create & Edit Images Endpoint (gemini-nano-banana-2.1)
app.post('/api/image', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      aspectRatio = '16:9',
      imageSize = '1K',
      useSearchGrounding = false,
      sourceImageBase64,
      sourceImageMimeType = 'image/jpeg',
    } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getAiClient();
    const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];

    if (sourceImageBase64) {
      const cleanBase64 = sourceImageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: sourceImageMimeType,
        },
      });
    }
    parts.push({ text: prompt });

    let response;
    let modelUsed = 'gemini-nano-banana-2.1';

    try {
      const config: Record<string, unknown> = {
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      };
      if (useSearchGrounding) {
        config.tools = [
          {
            googleSearch: {
              searchTypes: {
                webSearch: {},
                imageSearch: {},
              },
            },
          },
        ];
      }

      response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config,
      });
    } catch (innerErr: unknown) {
      // Fallback to gemini-3.1-flash-lite-image if nano-banana-2.1 fails due to tier/availability
      modelUsed = 'gemini-3.1-flash-lite-image';
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio)
              ? aspectRatio
              : '1:1',
          },
        },
      });
    }

    let imageUrl: string | null = null;
    let captionText = '';

    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of candidateParts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        captionText += part.text;
      }
    }

    if (!imageUrl) {
      res.status(500).json({
        error:
          captionText ||
          'No image was returned by the model. Try adjusting your prompt or checking your API key in Settings > Secrets.',
      });
      return;
    }

    res.json({
      imageUrl,
      captionText,
      modelUsed,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: formatApiError(err) });
  }
});

// 3. Veo 3 Video Generation Endpoints (veo-3.1-fast-generate-preview)
app.post('/api/video/start', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      aspectRatio = '16:9',
      resolution = '720p',
      sourceImageBase64,
      sourceImageMimeType = 'image/jpeg',
    } = req.body;

    if (!prompt && !sourceImageBase64) {
      res.status(400).json({ error: 'A text prompt or starting frame is required.' });
      return;
    }

    const ai = getAiClient();
    const validAspect = aspectRatio === '9:16' ? '9:16' : '16:9';
    const validRes = resolution === '1080p' ? '1080p' : '720p';

    const imageParam = sourceImageBase64
      ? {
          imageBytes: sourceImageBase64.replace(/^data:[^;]+;base64,/, ''),
          mimeType: sourceImageMimeType,
        }
      : undefined;

    let operation;
    let modelUsed = 'veo-3.1-fast-generate-preview';
    try {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Cinematic motion sequence with subtle atmospheric lighting',
        ...(imageParam ? { image: imageParam } : {}),
        config: {
          numberOfVideos: 1,
          resolution: validRes,
          aspectRatio: validAspect,
        },
      });
    } catch (innerErr: unknown) {
      const msg = innerErr instanceof Error ? innerErr.message : String(innerErr);
      if (msg.includes('404') || msg.includes('NOT_FOUND')) {
        modelUsed = 'veo-3.1-lite-generate-preview';
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: prompt || 'Cinematic motion sequence with subtle atmospheric lighting',
          ...(imageParam ? { image: imageParam } : {}),
          config: {
            numberOfVideos: 1,
            resolution: validRes,
            aspectRatio: validAspect,
          },
        });
      } else {
        throw innerErr;
      }
    }

    res.json({
      operationName: operation.name,
      modelUsed,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: formatApiError(err) });
  }
});

app.post('/api/video/status', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      res.status(400).json({ error: 'operationName is required' });
      return;
    }

    const ai = getAiClient();
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: Boolean(updated.done),
      error: updated.error ? String(updated.error.message || 'Video generation failed') : null,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: formatApiError(err) });
  }
});

app.post('/api/video/download', async (req: Request, res: Response) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      res.status(400).json({ error: 'operationName is required' });
      return;
    }

    const ai = getAiClient();
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      res.status(404).json({ error: 'Generated video URI not available yet.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!videoRes.ok || !videoRes.body) {
      res.status(502).json({ error: `Failed to fetch video stream (${videoRes.status})` });
      return;
    }

    res.setHeader('Content-Type', 'video/mp4');
    const reader = videoRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err: unknown) {
    res.status(500).json({ error: formatApiError(err) });
  }
});

// 4. Google Search Grounding Endpoint (gemini-3.5-flash with googleSearch tool)
app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Search query is required.' });
      return;
    }

    const ai = getAiClient();
    let response;
    let modelUsed = 'gemini-3.5-flash';

    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (innerErr: unknown) {
      modelUsed = 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
    }

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = rawChunks
      .map((c: { web?: { uri?: string; title?: string } }) =>
        c.web?.uri
          ? {
              uri: c.web.uri,
              title: c.web.title || c.web.uri,
            }
          : null
      )
      .filter(Boolean);

    res.json({
      text: response.text || '',
      sources,
      modelUsed,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: formatApiError(err) });
  }
});

// 5. Google Maps Grounding Endpoint (gemini-3.5-flash with googleMaps tool)
app.post('/api/maps', async (req: Request, res: Response) => {
  try {
    const { query, latitude, longitude } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Place or spatial query is required.' });
      return;
    }

    const ai = getAiClient();
    const config: Record<string, unknown> = {
      tools: [{ googleMaps: {} }],
    };

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude,
            longitude,
          },
        },
      };
    }

    let response;
    let modelUsed = 'gemini-3.5-flash';
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: query,
        config,
      });
    } catch (innerErr: unknown) {
      modelUsed = 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: query,
        config,
      });
    }

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const places: Array<{
      uri: string;
      title: string;
      reviewSnippets: string[];
    }> = [];

    for (const chunk of rawChunks as Array<{
      maps?: {
        uri?: string;
        title?: string;
        placeAnswerSources?: {
          reviewSnippets?: Array<{ content?: string; text?: string } | string>;
        };
      };
    }>) {
      if (chunk.maps?.uri) {
        const rawSnippets = chunk.maps.placeAnswerSources?.reviewSnippets || [];
        const reviewSnippets = rawSnippets
          .map((s) => (typeof s === 'string' ? s : s.content || s.text || ''))
          .filter(Boolean);
        places.push({
          uri: chunk.maps.uri,
          title: chunk.maps.title || 'View Location on Google Maps',
          reviewSnippets,
        });
      }
    }

    res.json({
      text: response.text || '',
      places,
      modelUsed,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: formatApiError(err) });
  }
});

async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vortex Multimodal Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
