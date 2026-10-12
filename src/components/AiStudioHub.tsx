import React, { useState, useRef, useEffect } from 'react';
import {
  Wand2,
  Film,
  MessageSquare,
  Globe,
  MapPin,
  Upload,
  Download,
  RefreshCw,
  Send,
  ExternalLink,
  Compass,
  Trash2,
  ArrowUpRight,
  AlertCircle,
  Play,
} from 'lucide-react';
import campusHeroImg from '../assets/images/madarsa_campus_hero_1791698178755.jpg';

type AiSubTab = 'chat' | 'image' | 'video' | 'search' | 'maps';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  model: string;
  timestamp: string;
}

interface VideoJob {
  id: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  status: 'rendering' | 'completed' | 'failed';
  operationName?: string;
  videoBlobUrl?: string;
  error?: string;
  createdAt: string;
  model: string;
}

export function AiStudioHub() {
  const [subTab, setSubTab] = useState<AiSubTab>('chat');

  // 1. Multi-Turn Gemini Chatbot (gemini-3.8-flash, gemini-3.1-flash-lite, gemini-3.1-pro-preview)
  const [chatModel, setChatModel] = useState<string>('gemini-3.8-flash');
  const [chatRole, setChatRole] = useState<string>(
    'You are the AI Academic & Administrative Assistant for Gausiya Madarsa Portal. Help teachers, students, parents, and administrators with lesson plans, Urdu/Arabic/English notices, exam papers, and school administration.'
  );
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      text: 'Assalamu Alaikum! Main Gausiya Madarsa Portal ka AI Assistant hoon. Aap mujhse Notice draft karwa sakte hain, Exam question paper banwa sakte hain, ya kisi bhi subject par madad le sakte hain.',
      model: 'gemini-3.5-flash',
      timestamp: 'Ready',
    },
  ]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // 2. Image Creation & Editing (gemini-nano-banana-2.1)
  const [imagePrompt, setImagePrompt] = useState<string>(
    'Elegant Islamic geometric calligraphy certificate banner for Gausiya Madarsa Annual Jalsa and Dastarbandi ceremony, emerald green and gold theme'
  );
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('16:9');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [sourceImage, setSourceImage] = useState<{
    previewUrl: string;
    base64: string;
    mimeType: string;
    label: string;
  } | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>(campusHeroImg);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imgFileRef = useRef<HTMLInputElement | null>(null);

  // 3. Veo 3 Video Generation (veo-3.1-fast-generate-preview)
  const [videoPrompt, setVideoPrompt] = useState<string>(
    'Peaceful aerial morning view of a traditional white and emerald green Islamic academy courtyard with fountains and gardens in golden sunlight'
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  const [isStartingVideo, setIsStartingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // 4. Google Search Grounding (gemini-3.5-flash + googleSearch)
  const [searchQuery, setSearchQuery] = useState<string>(
    'National scholarship schemes for minority and madarsa students in India 2026'
  );
  const [searchAnswer, setSearchAnswer] = useState<string>('');
  const [searchSources, setSearchSources] = useState<Array<{ uri: string; title: string }>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 5. Google Maps Grounding (gemini-3.5-flash + googleMaps)
  const [mapsQuery, setMapsQuery] = useState<string>(
    'Famous Islamic libraries, educational academies, and bookstores in Mumbai and Nagpur'
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 21.1458,
    lng: 79.0882,
  });
  const [mapsAnswer, setMapsAnswer] = useState<string>('');
  const [mapsPlaces, setMapsPlaces] = useState<
    Array<{ uri: string; title: string; reviewSnippets: string[] }>
  >([]);
  const [isSearchingMaps, setIsSearchingMaps] = useState<boolean>(false);
  const [mapsError, setMapsError] = useState<string | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // Poll Veo 3 jobs
  useEffect(() => {
    const active = videoJobs.filter((j) => j.status === 'rendering' && j.operationName);
    if (active.length === 0) return;

    const timer = setInterval(async () => {
      for (const job of active) {
        try {
          const res = await fetch('/api/video/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName: job.operationName }),
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            setVideoJobs((prev) =>
              prev.map((j) =>
                j.id === job.id
                  ? { ...j, status: 'failed', error: data.error || 'Video render failed' }
                  : j
              )
            );
            continue;
          }
          if (data.done) {
            const dl = await fetch('/api/video/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName: job.operationName }),
            });
            if (dl.ok) {
              const blob = await dl.blob();
              const url = URL.createObjectURL(blob);
              setVideoJobs((prev) =>
                prev.map((j) =>
                  j.id === job.id ? { ...j, status: 'completed', videoBlobUrl: url } : j
                )
              );
            }
          }
        } catch {
          // continue polling
        }
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [videoJobs]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const text = chatInput.trim();
    setChatInput('');
    setChatError(null);

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      text,
      model: chatModel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          model: chatModel,
          systemInstruction: chatRole,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Chat failed');
      setMessages((prev) => [
        ...prev,
        {
          id: `r-${Date.now()}`,
          role: 'model',
          text: data.text,
          model: data.modelUsed || chatModel,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : 'Chat error');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleUploadEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      setSourceImage({
        previewUrl: dataUrl,
        base64: dataUrl.replace(/^data:[^;]+;base64,/, ''),
        mimeType: file.type || 'image/png',
        label: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          aspectRatio: imageAspectRatio,
          imageSize,
          sourceImageBase64: sourceImage?.base64,
          sourceImageMimeType: sourceImage?.mimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Image generation failed');
      setGeneratedImageUrl(data.imageUrl);
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : 'Image error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoPrompt.trim() || isStartingVideo) return;
    setIsStartingVideo(true);
    setVideoError(null);
    try {
      const res = await fetch('/api/video/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          aspectRatio: videoAspectRatio,
          resolution: '720p',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Video start failed');
      setVideoJobs((prev) => [
        {
          id: `v-${Date.now()}`,
          prompt: videoPrompt.trim(),
          aspectRatio: videoAspectRatio,
          resolution: '720p',
          status: 'rendering',
          operationName: data.operationName,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: data.modelUsed || 'veo-3.1-fast-generate-preview',
        },
        ...prev,
      ]);
    } catch (err: unknown) {
      setVideoError(err instanceof Error ? err.message : 'Video error');
    } finally {
      setIsStartingVideo(false);
    }
  };

  const handleSearchGrounding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Search failed');
      setSearchAnswer(data.text || '');
      setSearchSources(data.sources || []);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : 'Search error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapsGrounding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapsQuery.trim() || isSearchingMaps) return;
    setIsSearchingMaps(true);
    setMapsError(null);
    try {
      const res = await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mapsQuery.trim(),
          latitude: coords.lat,
          longitude: coords.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Maps search failed');
      setMapsAnswer(data.text || '');
      setMapsPlaces(data.places || []);
    } catch (err: unknown) {
      setMapsError(err instanceof Error ? err.message : 'Maps error');
    } finally {
      setIsSearchingMaps(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Madarsa AI Smart Tools (Gemini + Veo + Grounding)
          </h2>
          <p className="text-sm text-slate-500">
            AI Assistant Chatbot, Poster/Image Designer, Veo 3 Video Generator, Google Search & Maps
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSubTab('chat')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'chat'
                ? 'bg-[#d9ae54] text-slate-950'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Chatbot</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('image')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'image'
                ? 'bg-[#d9ae54] text-slate-950'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Image & Poster Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('video')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'video'
                ? 'bg-[#d9ae54] text-slate-950'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Veo 3 Video</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('search')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'search'
                ? 'bg-[#d9ae54] text-slate-950'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Search</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('maps')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              subTab === 'maps'
                ? 'bg-[#d9ae54] text-slate-950'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Google Maps</span>
          </button>
        </div>
      </div>

      {/* 1. AI CHATBOT */}
      {subTab === 'chat' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Model:</span>
              {[
                { id: 'gemini-3.8-flash', label: 'Flash 3.8 (Recommended)' },
                { id: 'gemini-3.1-flash-lite', label: 'Flash Lite (Instant)' },
                { id: 'gemini-flash-latest', label: 'Gemini Flash (Latest)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setChatModel(m.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    chatModel === m.id
                      ? 'bg-[#0d261c] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <select
              value={chatRole}
              onChange={(e) => setChatRole(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
            >
              <option value="You are the AI Academic & Administrative Assistant for Gausiya Madarsa Portal. Help teachers, students, parents, and administrators with lesson plans, Urdu/Arabic/English notices, exam papers, and school administration.">
                Role: Madarsa Academic & Notice Assistant
              </option>
              <option value="You are a senior Islamic Studies, Arabic, Urdu, Mathematics, and Science tutor at Gausiya Madarsa. Explain concepts clearly for students.">
                Role: Student Subject Tutor
              </option>
              <option value="You are the Principal & Committee Advisor for Gausiya Madarsa. Help draft formal reports, circulars, and event schedules.">
                Role: Committee & Principal Advisor
              </option>
            </select>
          </div>

          <div className="h-96 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-xs text-slate-400 mb-1">
                  {m.role === 'user' ? 'You' : `AI Assistant · ${m.model}`} · {m.timestamp}
                </span>
                <div
                  className={`max-w-2xl rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#0d261c] text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0d261c]" />
                <span>Generating reply with {chatModel}...</span>
              </div>
            )}
            {chatError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {chatError}
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI to write a parent notice, exam paper, or homework..."
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#0d261c]"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="px-5 py-2.5 rounded-lg bg-[#d9ae54] hover:bg-[#c89d43] text-slate-950 font-semibold text-sm flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* 2. IMAGE & POSTER STUDIO (gemini-nano-banana-2.1) */}
      {subTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-xl border border-slate-200 p-6">
          <form onSubmit={handleGenerateImage} className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Create & Edit Posters / Certificates (gemini-nano-banana-2.1)
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Poster or Image Prompt
              </label>
              <textarea
                rows={4}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  Optional Image to Edit
                </span>
                <button
                  type="button"
                  onClick={() => imgFileRef.current?.click()}
                  className="text-xs font-semibold text-[#0d261c] hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
                <input
                  ref={imgFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadEditImage}
                  className="hidden"
                />
              </div>
              {sourceImage && (
                <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-xs text-slate-700 truncate">{sourceImage.label}</span>
                  <button
                    type="button"
                    onClick={() => setSourceImage(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Aspect Ratio
                </label>
                <select
                  value={imageAspectRatio}
                  onChange={(e) => setImageAspectRatio(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="4:3">4:3 Standard</option>
                  <option value="3:4">3:4 Poster</option>
                  <option value="9:16">9:16 Story</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Resolution</label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
            </div>

            {imageError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGeneratingImage}
              className="w-full py-2.5 px-4 rounded-lg bg-[#d9ae54] hover:bg-[#c89d43] text-slate-950 font-semibold text-sm flex items-center justify-center gap-2"
            >
              {isGeneratingImage ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Image...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>{sourceImage ? 'Edit Image' : 'Generate Image'}</span>
                </>
              )}
            </button>
          </form>

          <div className="lg:col-span-7 flex flex-col justify-between border border-slate-200 rounded-xl p-4 bg-slate-50">
            <img
              src={generatedImageUrl}
              alt="Generated Madarsa Visual"
              referrerPolicy="no-referrer"
              className="w-full max-h-[380px] object-contain rounded-lg"
            />
            <div className="flex justify-end pt-3">
              <a
                href={generatedImageUrl}
                download="madarsa_poster.png"
                className="px-3.5 py-1.5 rounded-lg bg-[#0d261c] text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Image</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3. VEO 3 VIDEO GENERATOR (veo-3.1-fast-generate-preview) */}
      {subTab === 'video' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-base font-bold text-slate-900">
            Veo 3 Educational & Event Video Generator (veo-3.1-fast-generate-preview)
          </h3>
          <form onSubmit={handleGenerateVideo} className="space-y-4">
            <textarea
              rows={3}
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900"
              placeholder="Describe the educational or event video scene..."
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setVideoAspectRatio('16:9')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border ${
                  videoAspectRatio === '16:9'
                    ? 'bg-[#0d261c] text-white border-[#0d261c]'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                16:9 Landscape
              </button>
              <button
                type="button"
                onClick={() => setVideoAspectRatio('9:16')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border ${
                  videoAspectRatio === '9:16'
                    ? 'bg-[#0d261c] text-white border-[#0d261c]'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                9:16 Portrait
              </button>
              <button
                type="submit"
                disabled={isStartingVideo}
                className="px-5 py-2 rounded-lg bg-[#d9ae54] hover:bg-[#c89d43] text-slate-950 font-semibold text-xs flex items-center gap-2"
              >
                {isStartingVideo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Starting Veo 3...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Generate Video</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {videoError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {videoError}
            </div>
          )}

          <div className="space-y-4">
            {videoJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {job.model} · {job.aspectRatio} · {job.createdAt}
                  </span>
                  <span className="font-semibold text-[#0d261c]">{job.status}</span>
                </div>
                <p className="text-sm text-slate-800">{job.prompt}</p>
                {job.status === 'rendering' && (
                  <p className="text-xs text-amber-700 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Veo 3 is rendering your video (takes ~1-2 minutes)...</span>
                  </p>
                )}
                {job.status === 'failed' && (
                  <p className="text-xs text-red-600">{job.error}</p>
                )}
                {job.status === 'completed' && job.videoBlobUrl && (
                  <video
                    src={job.videoBlobUrl}
                    controls
                    className="w-full max-h-80 rounded-lg bg-black"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. GOOGLE SEARCH GROUNDING (gemini-3.5-flash + googleSearch) */}
      {subTab === 'search' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-base font-bold text-slate-900">
            Google Search Grounded Research (gemini-3.5-flash)
          </h3>
          <form onSubmit={handleSearchGrounding} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900"
              placeholder="Search live educational news, scholarships, syllabus updates..."
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 rounded-lg bg-[#d9ae54] hover:bg-[#c89d43] text-slate-950 font-semibold text-sm flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              <span>Search Google</span>
            </button>
          </form>

          {searchError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {searchError}
            </div>
          )}

          {searchAnswer && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {searchAnswer}
              </div>
              {searchSources.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Google Search Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {searchSources.map((s, i) => (
                      <a
                        key={i}
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[#0d261c] hover:underline inline-flex items-center gap-1.5"
                      >
                        <span className="truncate max-w-xs">{s.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. GOOGLE MAPS GROUNDING (gemini-3.5-flash + googleMaps) */}
      {subTab === 'maps' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Google Maps Grounded Place Finder (gemini-3.5-flash)
            </h3>
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setCoords({
                      lat: Number(pos.coords.latitude.toFixed(4)),
                      lng: Number(pos.coords.longitude.toFixed(4)),
                    });
                  });
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-[#0d261c]" />
              <span>
                Use My GPS ({coords.lat}, {coords.lng})
              </span>
            </button>
          </div>

          <form onSubmit={handleMapsGrounding} className="flex gap-2">
            <input
              type="text"
              value={mapsQuery}
              onChange={(e) => setMapsQuery(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900"
              placeholder="Find nearby madarsas, bookstores, exam centers, or mosques..."
            />
            <button
              type="submit"
              disabled={isSearchingMaps}
              className="px-5 py-2.5 rounded-lg bg-[#d9ae54] hover:bg-[#c89d43] text-slate-950 font-semibold text-sm flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              {isSearchingMaps ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              <span>Search Maps</span>
            </button>
          </form>

          {mapsError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {mapsError}
            </div>
          )}

          {mapsAnswer && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {mapsAnswer}
              </div>
              {mapsPlaces.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-slate-500">
                    Verified Google Maps Places:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mapsPlaces.map((pl, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5"
                      >
                        <a
                          href={pl.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#0d261c] hover:underline flex items-center justify-between"
                        >
                          <span>{pl.title}</span>
                          <ArrowUpRight className="w-4 h-4 shrink-0" />
                        </a>
                        {pl.reviewSnippets.map((s, sIdx) => (
                          <p key={sIdx} className="text-xs text-slate-500 italic">
                            "{s}"
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
