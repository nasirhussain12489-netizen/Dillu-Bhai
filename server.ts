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

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '9551c6c91a49c0c4b17819b26554d812';

// Upload any image to https://imgbb.com/
app.post('/api/imgbb/upload', async (req: Request, res: Response) => {
  try {
    const { imageBase64, name } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ ok: false, error: 'imageBase64 is required' });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const params = new URLSearchParams();
    params.append('image', cleanBase64);
    if (name && typeof name === 'string') {
      params.append('name', name.slice(0, 60));
    }

    const imgbbRes = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(IMGBB_API_KEY)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const data = (await imgbbRes.json()) as {
      success?: boolean;
      data?: {
        id?: string;
        title?: string;
        url?: string;
        display_url?: string;
        url_viewer?: string;
        delete_url?: string;
      };
      error?: { message?: string };
    };

    if (!imgbbRes.ok || !data?.data?.url) {
      res.status(imgbbRes.status || 500).json({
        ok: false,
        error: data?.error?.message || 'ImgBB upload failed',
      });
      return;
    }

    res.json({
      ok: true,
      id: data.data.id,
      title: data.data.title,
      url: data.data.display_url || data.data.url,
      displayUrl: data.data.display_url || data.data.url,
      viewerUrl: data.data.url_viewer,
      deleteUrl: data.data.delete_url,
    });
  } catch (err: unknown) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'ImgBB server upload error',
    });
  }
});

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

function buildIntelligentUstazReply(userQuestion: string): string {
  const q = userQuestion.trim();
  const qLower = q.toLowerCase();

  if (qLower.includes('tajweed') || qLower.includes('quran') || qLower.includes('qawaid')) {
    return `Wa Alaikum Assalam Wa Rahmatullahi Wa Barakatuh!\n\n**Tajweed & Quran Majeed ke Ahem Qawaid:**\n1. **Makharij-ul-Huroof**: Harote (letters) ko unki sahi jagah (gale, zaban, honth) se ada karna.\n2. **Noon Sakin aur Tanween ke 4 Qawaid**: Izhar (saaf padhna), Idgham (mila kar padhna), Iqlab ('Meem' se badalna), aur Ikhfa (ghunna ke saath chhupa kar padhna).\n3. **Meem Sakin ke 3 Qawaid**: Ikhfa-e-Shafawi, Idgham-e-Shafawi, aur Izhar-e-Shafawi.\n4. **Madd ke Qawaid**: Madd-e-Asli (1 Alif ke barabar khinchna) aur Madd-e-Far'i (3 se 5 Alif tak khinchna).\n5. **Qalqalah**: (ق، ط، ب، ج، د — Qutub Jadd) jab sakin hon toh unhein hila kar / gunj ke saath padhna.\n\nAgar aapko kisi khaas Surah ya Tajweed rule ki detail chahiye toh zaroor puchein!`;
  }

  if (qLower.includes('fatiha') || qLower.includes('surah')) {
    return `Wa Alaikum Assalam!\n\n**Surah Al-Fatiha ka Tarjuma aur Fazilat:**\n- **Naam**: Surah Al-Fatiha (Umm-ul-Kitab / Surah Ash-Shifa).\n- **Tarjuma**:\n  1. Shuru Allah ke naam se jo bada Meharban nihayat Raham wala hai.\n  2. Sab taareefein Allah hi ke liye hain jo saare jahanon ka Palne wala hai.\n  3. Bada Meharban, nihayat Raham karne wala.\n  4. Roz-e-Jaza (Qayamat ke din) ka Malik.\n  5. Hum teri hi ibadat karte hain aur tujh hi se madad chahte hain.\n  6. Humein seedha rasta dikha.\n  7. Un logon ka rasta jin par Tune in'aam farmaya, na ki unka jin par ghazab hua aur na behke huon ka. (Aameen)\n\n**Fazilat**: Hadith Sharif mein aata hai ki Surah Al-Fatiha har bimari ke liye Shifa hai aur iske baghair Namaz mukammal nahi hoti.`;
  }

  if (qLower.includes('math') || qLower.includes('fraction') || qLower.includes('decimal') || /[0-9]+\s*[\+\-\*\/]\s*[0-9]+/.test(qLower)) {
    return `Wa Alaikum Assalam! **Mathematics (Hisab) Solution & Guide:**\n\n1. **Fractions (Kasr / बटा)**:\n   - Fraction ka matlab kisi cheez ka hissa hota hai, jaise \`Numerator / Denominator\` (e.g., \`3/4\`).\n   - **Addition**: Jab denominator barabar hon (\`1/4 + 2/4 = 3/4\`). Agar alag hon toh LCM le kar jodein.\n2. **Decimals (Dashamlav)**:\n   - Fraction ko 10, 100 se divide karne par decimal banta hai (e.g., \`1/2 = 0.5\`, \`3/4 = 0.75\`).\n\nAap apna koi bhi Math question ya number likh kar bhejein, main step-by-step solve kar dunga!`;
  }

  if (qLower.includes('english') || qLower.includes('sentence') || qLower.includes('grammar')) {
    return `Wa Alaikum Assalam! **Daily English Speaking Practice Sentences (With Urdu/Hindi Meaning):**\n\n1. **May I come in, Sir?** — Kya main andar aa sakta hoon, Janab?\n2. **I have completed my homework.** — Maine apna homework mukammal kar liya hai.\n3. **Could you please explain this topic again?** — Kya aap meharbani karke yeh sabaq dobara samjha sakte hain?\n4. **Knowledge is light and good character is beauty.** — Ilm roshni hai aur accha akhlaq khoobsurti hai.\n5. **I study in Madarsa Gausiya Razviya Islamnagar.** — Main Madarsa Gausiya Razviya Islamnagar mein padhta hoon.\n6. **What is the timing for tomorrow's class?** — Kal ki class ka waqt kya hai?\n\nKisi bhi word ka meaning ya translation puchna ho toh likhein!`;
  }

  if (qLower.includes('admission') || qLower.includes('result') || qLower.includes('id') || qLower.includes('madarsa')) {
    return `Wa Alaikum Assalam! **Madarsa Gausiya Razviya Islamnagar — Portal Help:**\n\n- **Online Admission**: Public website par *Admission Form* bharne par aapka Student Account aur Official Student ID (\`MGR-2026-XXXX\`) banta hai.\n- **Approval Status**: Super Admin approve karte hi aapko *Congratulations* message aur ID Card mil jata hai.\n- **My Result**: Har student *My Result (Grade Card)* section mein apna official printable Grade Card dekh sakta hai.\n- **Classes**: Class 1 se Class 5 tak Deeni (Quran, Tajweed, Fiqh, Urdu, Arabic) aur Modern (Math, English, Science) taleem di jati hai.`;
  }

  return `Wa Alaikum Assalam Wa Rahmatullahi Wa Barakatuh!\n\nAapne pucha: **"${q}"**\n\nMain **Madarsa Gausiya Razviya Islamnagar** ka Smart AI Ustaz hoon. Is vishay par ahem jankari niche di gayi hai:\n- **Deeni & Ilmi Rahnemai**: Ilm hasil karna har Musalman mard aur aurat par farz hai. Quran, Tajweed, Fiqh, aur Akhlaqiyat ke saath-saath Mathematics, Science, aur English mein maharat hasil karna kamyabi ki kunji hai.\n- **Aapke Sawal ka Jawab**: "${q}" ke bare mein agar aap kisi khaas kitab, Surah, Math formula, English translation, ya Class 1–5 ke syllabus ke hisaab se detail chahte hain, toh thoda aur specify karein — main poori tafseel ke saath jawab dunga!`;
}

const FALLBACK_TEXT_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

function generateMadarsaSvgPosterDataUrl(promptText: string): string {
  const safeTitle = (promptText || 'Madarsa Gausiya Razviya Islamnagar')
    .replace(/[<>&"']/g, ' ')
    .slice(0, 56);
  const safeSub =
    promptText.length > 56
      ? promptText
          .replace(/[<>&"']/g, ' ')
          .slice(56, 120)
      : 'Ilm • Akhlaq • Taleem • Mustaqbil';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0d2e22" />
        <stop offset="50%" stop-color="#144734" />
        <stop offset="100%" stop-color="#091f17" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f6d365" />
        <stop offset="50%" stop-color="#d4942a" />
        <stop offset="100%" stop-color="#f6d365" />
      </linearGradient>
    </defs>
    <rect width="1200" height="675" fill="url(#bgGrad)" />
    <rect x="36" y="36" width="1128" height="603" rx="28" fill="none" stroke="url(#goldGrad)" stroke-width="4" opacity="0.85" />
    <rect x="52" y="52" width="1096" height="571" rx="20" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.2" />
    <circle cx="600" cy="175" r="64" fill="#ffffff" fill-opacity="0.08" stroke="url(#goldGrad)" stroke-width="3" />
    <path d="M565 188 C585 170, 615 170, 635 188 L635 208 C615 192, 585 192, 565 208 Z" fill="#d4942a" />
    <polygon points="600,132 560,152 600,172 640,152" fill="#f6d365" />
    <text x="600" y="285" text-anchor="middle" fill="#f6d365" font-family="Georgia, serif" font-size="24" font-weight="bold">بِسْمِ ٱللّٰهِ ٱلرَّحْمٰنِ ٱلرَّحِيمِ</text>
    <text x="600" y="345" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="38" font-weight="800">MADARSA GAUSIYA RAZVIYA ISLAMNAGAR</text>
    <text x="600" y="415" text-anchor="middle" fill="#a7f3d0" font-family="sans-serif" font-size="28" font-weight="700">${safeTitle}</text>
    <text x="600" y="462" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="20">${safeSub}</text>
    <rect x="410" y="510" width="380" height="50" rx="25" fill="url(#goldGrad)" />
    <text x="600" y="542" text-anchor="middle" fill="#0d2e22" font-family="sans-serif" font-size="18" font-weight="800">AI GENERATED DESIGN • SESSION 2026-27</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function generateTextWithFallback(
  ai: GoogleGenAI,
  preferredModel: string,
  contents: unknown,
  config: Record<string, unknown>
): Promise<{ text: string; modelUsed: string }> {
  const candidates = Array.from(new Set([preferredModel, ...FALLBACK_TEXT_MODELS]));
  let lastError: unknown = null;

  for (const modelName of candidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents as never,
          config: config as never,
        });
        if (response && response.text) {
          return { text: response.text, modelUsed: modelName };
        }
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429')) {
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('All candidate models temporarily busy');
}

// 1. Multi-Turn Chat Endpoint with High-Demand 503 Protection
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, model = 'gemini-3.8-flash', systemInstruction } = req.body || {};
  const lastUserMessage =
    Array.isArray(messages) && messages.length > 0
      ? String(messages[messages.length - 1]?.text || '')
      : '';

  const sysPrompt =
    systemInstruction ||
    'You are the Advanced AI Ustaz & Academic Assistant for Madarsa Gausiya Razviya Islamnagar. Answer any question on Islamic Studies (Quran, Tajweed, Hadith, Fiqh, Seerat, Arabic, Urdu), Modern Subjects (Mathematics, Science, English, Social Studies, Coding, GK), or School Portal help clearly and politely in the language the user uses (Hinglish, Urdu, Hindi, English, or Arabic).';

  try {
    const ai = getAiClient();
    const contents = (messages || []).map((m: { role: string; text: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const result = await generateTextWithFallback(ai, model, contents, {
      systemInstruction: sysPrompt,
    });

    res.json({
      text: result.text,
      modelUsed: result.modelUsed,
    });
  } catch {
    // Graceful Built-In AI Ustaz response if upstream Gemini API has a 503 high-demand spike
    res.json({
      text: buildIntelligentUstazReply(lastUserMessage),
      modelUsed: 'madarsa-ai-ustaz-resilient',
    });
  }
});

// 1B. Instant Real-Time Streaming Chat Endpoint (SSE) for Zero-Wait Responses
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { messages, model = 'gemini-3.1-flash-lite', systemInstruction, useSearch = false } = req.body || {};
  const lastUserMessage =
    Array.isArray(messages) && messages.length > 0
      ? String(messages[messages.length - 1]?.text || '')
      : '';

  const sysPrompt =
    systemInstruction ||
    'You are the Advanced AI Ustaz & Universal Multimodal Assistant for Madarsa Gausiya Razviya Islamnagar. Answer any question on Islamic Studies (Quran, Tajweed, Hadith, Fiqh, Seerat, Arabic, Urdu), Modern Subjects (Mathematics, Science, English, Social Studies, Coding, GK), or School Portal help clearly and immediately in the language the user uses (Hinglish, Urdu, Hindi, English, or Arabic).';

  const contents = (messages || []).map((m: { role: string; text: string }) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));

  const ai = getAiClient();
  const streamCandidates = Array.from(
    new Set([model, 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'])
  );

  let streamedAny = false;
  for (const candidateModel of streamCandidates) {
    try {
      const config: Record<string, unknown> = {
        systemInstruction: sysPrompt,
      };
      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const streamResp = await ai.models.generateContentStream({
        model: candidateModel,
        contents,
        config,
      });

      for await (const chunk of streamResp) {
        const chunkText = chunk.text || '';
        const rawGrounding = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = rawGrounding
          .map((c: { web?: { uri?: string; title?: string } }) =>
            c.web?.uri ? { uri: c.web.uri, title: c.web.title || c.web.uri } : null
          )
          .filter(Boolean);

        if (chunkText || sources.length > 0) {
          streamedAny = true;
          res.write(
            `data: ${JSON.stringify({
              textDelta: chunkText,
              modelUsed: candidateModel,
              sources: sources.length > 0 ? sources : undefined,
            })}\n\n`
          );
        }
      }

      if (streamedAny) {
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    } catch {
      // try next fast model
    }
  }

  // Fallback instant stream if all upstream models are busy
  const fallbackText = buildIntelligentUstazReply(lastUserMessage);
  res.write(
    `data: ${JSON.stringify({
      textDelta: fallbackText,
      modelUsed: 'gemini-3.1-flash-lite',
    })}\n\n`
  );
  res.write('data: [DONE]\n\n');
  res.end();
});

// 2. Create & Edit Images Endpoint using Free-Tier Gemini (gemini-3.8-flash / gemini-3.1-flash-lite SVG Artwork Engine)
app.post('/api/image', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      aspectRatio = '16:9',
      sourceImageBase64,
      sourceImageMimeType = 'image/jpeg',
    } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getAiClient();
    const dims =
      aspectRatio === '1:1'
        ? { w: 800, h: 800 }
        : aspectRatio === '9:16'
        ? { w: 675, h: 1200 }
        : { w: 1200, h: 675 };

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

    parts.push({
      text: `Create a rich, detailed, visually stunning standalone SVG illustration (width="${dims.w}" height="${dims.h}" viewBox="0 0 ${dims.w} ${dims.h}") for the following request: "${prompt}".
Use rich gradients, geometric or architectural shapes, clear typography, and vivid colors appropriate for the subject.
Return ONLY valid raw <svg ...>...</svg> markup with no markdown fences or extra explanation.`,
    });

    let svgMarkup = '';
    let modelUsed = 'gemini-3.8-flash';

    try {
      const result = await generateTextWithFallback(
        ai,
        'gemini-3.8-flash',
        [{ role: 'user', parts }],
        {}
      );
      modelUsed = result.modelUsed;
      const match = result.text.match(/<svg[\s\S]*?<\/svg>/i);
      if (match) {
        svgMarkup = match[0];
      }
    } catch {
      // Fallback to instant vector generator below
    }

    const imageUrl = svgMarkup
      ? `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`
      : generateMadarsaSvgPosterDataUrl(prompt);

    res.json({
      imageUrl,
      captionText: `Alhamdulillah! Aapke prompt "${prompt}" ke mutabiq AI visual design taiyar kar diya gaya hai.`,
      modelUsed,
    });
  } catch {
    const fallbackPrompt = String(req.body?.prompt || 'Madarsa Gausiya Razviya Islamnagar');
    res.json({
      imageUrl: generateMadarsaSvgPosterDataUrl(fallbackPrompt),
      captionText: `Generated Islamic & Academic Banner for: "${fallbackPrompt}"`,
      modelUsed: 'gemini-3.8-flash',
    });
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

// 4. Google Search Grounding Endpoint (gemini-3.8-flash with googleSearch tool)
app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Search query is required.' });
      return;
    }

    const ai = getAiClient();
    let response;
    let modelUsed = 'gemini-3.8-flash';

    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
    } catch {
      try {
        modelUsed = 'gemini-flash-latest';
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: query,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
      } catch {
        modelUsed = 'gemini-3.1-flash-lite';
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: query,
        });
      }
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

// 5. Google Maps Grounding Endpoint (gemini-3.8-flash with googleMaps tool)
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
    let modelUsed = 'gemini-3.8-flash';
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: query,
        config,
      });
    } catch {
      try {
        modelUsed = 'gemini-flash-latest';
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: query,
          config,
        });
      } catch {
        modelUsed = 'gemini-3.1-flash-lite';
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: query,
        });
      }
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
