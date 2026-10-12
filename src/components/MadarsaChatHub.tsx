import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  Users,
  School,
  User,
  Plus,
  Send,
  Search,
  Trash2,
  X,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  Globe,
  MapPin,
  Download,
  ExternalLink,
} from 'lucide-react';
import {
  ChatMessageItem,
  ChatRoom,
  INITIAL_PORTAL_STATE,
  PortalState,
  StudentItem,
  UserAccount,
} from '../types/portal';
import { MadarsaLogo } from './MadarsaLogo';

interface MadarsaChatHubProps {
  state: PortalState;
  currentUser: UserAccount;
  effectiveStudentId: string;
  onUpdateState: (
    updater: (prev: PortalState) => PortalState,
    logAction?: string,
    logTarget?: string
  ) => void;
}

type SidebarFilter = 'all' | 'ai' | 'class' | 'groups' | 'direct';
type AiPowerMode = 'chat' | 'image' | 'search' | 'maps';

export const MadarsaChatHub: React.FC<MadarsaChatHubProps> = ({
  state,
  currentUser,
  effectiveStudentId,
  onUpdateState,
}) => {
  const isSuperOrAdmin =
    currentUser.role === 'Super Admin' || currentUser.role === 'Admin';

  const chatRooms: ChatRoom[] = useMemo(() => {
    const base =
      state.chatRooms && state.chatRooms.length > 0
        ? state.chatRooms
        : INITIAL_PORTAL_STATE.chatRooms || [];
    return base;
  }, [state.chatRooms]);

  const chatMessages: ChatMessageItem[] = useMemo(() => {
    return state.chatMessages && state.chatMessages.length > 0
      ? state.chatMessages
      : INITIAL_PORTAL_STATE.chatMessages || [];
  }, [state.chatMessages]);

  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-ai-ustaz');
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messageInput, setMessageInput] = useState<string>('');
  const [askAiInGroup, setAskAiInGroup] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // Advanced Gemini Multimodal Mode & Model Selector
  const [aiPowerMode, setAiPowerMode] = useState<AiPowerMode>('chat');
  const [selectedGeminiModel, setSelectedGeminiModel] = useState<string>('gemini-3.1-flash-lite');
  const [streamingAiText, setStreamingAiText] = useState<string>('');
  const [uploadedSourceImage, setUploadedSourceImage] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);

  // Create Group / Class Group Modal State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [newGroupType, setNewGroupType] = useState<'custom-group' | 'class'>('custom-group');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupClass, setNewGroupClass] = useState<string>('Class 4');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(['ALL']);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const myUserKey = (
    currentUser.studentId ||
    effectiveStudentId ||
    currentUser.email ||
    currentUser.id
  ).toLowerCase();

  // Build Combined List of Students & Users for 1-on-1 Direct Messaging
  const directoryContacts = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        name: string;
        role: string;
        className?: string;
        studentId?: string;
        email?: string;
      }
    >();

    (state.students || []).forEach((stu: StudentItem) => {
      const k = stu.studentId.toLowerCase();
      if (k !== myUserKey && stu.name.toLowerCase() !== currentUser.name.toLowerCase()) {
        map.set(k, {
          key: stu.studentId,
          name: stu.name,
          role: 'Student',
          className: stu.className,
          studentId: stu.studentId,
          email: stu.email,
        });
      }
    });

    (state.admissions || []).forEach((adm) => {
      const k = adm.studentId.toLowerCase();
      if (
        !map.has(k) &&
        k !== myUserKey &&
        adm.studentName.toLowerCase() !== currentUser.name.toLowerCase()
      ) {
        map.set(k, {
          key: adm.studentId,
          name: adm.studentName,
          role: 'Student',
          className: adm.classApplied,
          studentId: adm.studentId,
          email: adm.email,
        });
      }
    });

    (state.allUsers || []).forEach((u) => {
      const k = (u.studentId || u.email).toLowerCase();
      if (
        !map.has(k) &&
        k !== myUserKey &&
        u.email.toLowerCase() !== currentUser.email.toLowerCase()
      ) {
        map.set(k, {
          key: u.studentId || u.email,
          name: u.name,
          role: u.role,
          studentId: u.studentId,
          email: u.email,
        });
      }
    });

    return Array.from(map.values());
  }, [state.students, state.admissions, state.allUsers, myUserKey, currentUser]);

  // Open or create a 1-on-1 Direct Chat Room with any student/user
  const handleStartDirectChat = (contact: {
    key: string;
    name: string;
    role: string;
    className?: string;
  }) => {
    const pair = [myUserKey, contact.key.toLowerCase()].sort();
    const dmRoomId = `dm-${pair[0]}__${pair[1]}`;

    const existing = chatRooms.find((r) => r.id === dmRoomId);
    if (existing) {
      setSelectedRoomId(existing.id);
      return;
    }

    const newDmRoom: ChatRoom = {
      id: dmRoomId,
      name: `${contact.name}${contact.className ? ` (${contact.className})` : ''}`,
      type: 'direct',
      description: `Direct 1-on-1 Chat between ${currentUser.name} and ${contact.name} (${contact.key})`,
      participantIds: [myUserKey, contact.key.toLowerCase(), currentUser.name, contact.name],
      createdBy: currentUser.name,
      createdAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };

    onUpdateState((prev) => ({
      ...prev,
      chatRooms: [...(prev.chatRooms || chatRooms), newDmRoom],
    }));
    setSelectedRoomId(dmRoomId);
  };

  const activeRoom: ChatRoom = useMemo(() => {
    return (
      chatRooms.find((r) => r.id === selectedRoomId) ||
      chatRooms[0] || {
        id: 'room-ai-ustaz',
        name: 'Madarsa AI Ustaz (24/7 Smart AI)',
        type: 'ai',
        participantIds: ['ALL'],
        createdBy: 'System',
        createdAt: 'Today',
      }
    );
  }, [chatRooms, selectedRoomId]);

  const activeRoomMessages = useMemo(() => {
    return chatMessages.filter((m) => m.roomId === activeRoom.id);
  }, [chatMessages, activeRoom.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoomMessages.length, selectedRoomId, isAiThinking, streamingAiText]);

  // Detect if user's natural language message is asking to generate/edit an image, search Google, or find places on Maps
  const detectIntentMode = (text: string): AiPowerMode => {
    if (aiPowerMode !== 'chat') return aiPowerMode;
    const lower = text.toLowerCase();
    if (
      uploadedSourceImage ||
      /\b(image|photo|tasveer|pic|poster|banner|logo|draw|painting)\b/.test(lower) &&
        /\b(banao|bana|create|generate|make|edit|design|dikhao)\b/.test(lower)
    ) {
      return 'image';
    }
    if (/\b(map|maps|location|nearby|address|kahan hai|directions|distance)\b/.test(lower)) {
      return 'maps';
    }
    if (/\b(google search|latest news|current|live news|scholarship 2026|taza khabar)\b/.test(lower)) {
      return 'search';
    }
    return 'chat';
  };

  // Trigger Instant Streaming / Multimodal Gemini AI Reply
  const triggerAiReply = async (
    room: ChatRoom,
    userQuestion: string,
    recentHistory: ChatMessageItem[]
  ) => {
    setIsAiThinking(true);
    setStreamingAiText('');

    const effectiveMode = detectIntentMode(userQuestion);
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      // MODE 1: IMAGE CREATION & EDITING (gemini-nano-banana-2.1 / fallback)
      if (effectiveMode === 'image') {
        const imgRes = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userQuestion,
            aspectRatio: '16:9',
            imageSize: '1K',
            sourceImageBase64: uploadedSourceImage?.base64,
            sourceImageMimeType: uploadedSourceImage?.mimeType,
          }),
        });
        const imgData = await imgRes.json();
        setUploadedSourceImage(null);
        if (aiPowerMode === 'image') setAiPowerMode('chat');

        const aiMsg: ChatMessageItem = {
          id: `msg-ai-img-${Date.now()}`,
          roomId: room.id,
          senderId: 'AI-USTAZ',
          senderName: `Madarsa AI Studio (${imgData?.modelUsed || 'gemini-nano-banana-2.1'})`,
          senderRole: 'AI Image Creator',
          text:
            imgData?.captionText ||
            `Alhamdulillah! Aapke prompt "${userQuestion}" ke mutabiq image taiyar kar di gayi hai:`,
          imageUrl: imgData?.imageUrl,
          timestamp: nowTime,
          isAiResponse: true,
        };

        onUpdateState((prev) => ({
          ...prev,
          chatMessages: [...(prev.chatMessages || chatMessages), aiMsg],
        }));
        return;
      }

      // MODE 2: GOOGLE MAPS GROUNDING (gemini-3.5-flash + googleMaps)
      if (effectiveMode === 'maps') {
        const mapsRes = await fetch('/api/maps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userQuestion,
          }),
        });
        const mapsData = await mapsRes.json();
        if (aiPowerMode === 'maps') setAiPowerMode('chat');

        const aiMsg: ChatMessageItem = {
          id: `msg-ai-maps-${Date.now()}`,
          roomId: room.id,
          senderId: 'AI-USTAZ',
          senderName: `Madarsa AI Maps (${mapsData?.modelUsed || 'gemini-3.5-flash'})`,
          senderRole: 'Google Maps Grounding',
          text:
            mapsData?.text ||
            `Google Maps par "${userQuestion}" ki jankari niche di gayi hai:`,
          places: mapsData?.places || [],
          timestamp: nowTime,
          isAiResponse: true,
        };

        onUpdateState((prev) => ({
          ...prev,
          chatMessages: [...(prev.chatMessages || chatMessages), aiMsg],
        }));
        return;
      }

      // MODE 3: GOOGLE SEARCH GROUNDING (gemini-3.5-flash + googleSearch)
      if (effectiveMode === 'search') {
        const searchRes = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userQuestion,
          }),
        });
        const searchData = await searchRes.json();
        if (aiPowerMode === 'search') setAiPowerMode('chat');

        const aiMsg: ChatMessageItem = {
          id: `msg-ai-search-${Date.now()}`,
          roomId: room.id,
          senderId: 'AI-USTAZ',
          senderName: `Madarsa AI Search (${searchData?.modelUsed || 'gemini-3.5-flash'})`,
          senderRole: 'Google Search Grounding',
          text:
            searchData?.text ||
            `Google Search se "${userQuestion}" ka taza jawab:`,
          sources: searchData?.sources || [],
          timestamp: nowTime,
          isAiResponse: true,
        };

        onUpdateState((prev) => ({
          ...prev,
          chatMessages: [...(prev.chatMessages || chatMessages), aiMsg],
        }));
        return;
      }

      // MODE 4: INSTANT STREAMING MULTI-TURN GEMINI CHAT (/api/chat/stream)
      const historyForApi = recentHistory.slice(-10).map((m) => ({
        role: m.isAiResponse ? 'model' : 'user',
        text: `${m.senderName}: ${m.text}`,
      }));
      historyForApi.push({
        role: 'user',
        text: userQuestion,
      });

      const systemInstruction = `You are the Advanced AI Ustaz & Universal Smart Assistant of ${state.madarsaSettings.madarsaName} (${state.madarsaSettings.address}).
Current user talking to you: ${currentUser.name} (${currentUser.role}, ID: ${effectiveStudentId}).
Chat Room: ${room.name} (${room.description || room.type}).
You can talk about ANYTHING and answer ANY question immediately:
1. Islamic / Deeni Education: Quran Majeed, Tajweed rules, Hadith, Fiqh, Aqaid, Seerat-un-Nabi, Islamic History, Arabic grammar (Nahw & Sarf), Urdu Adab.
2. Modern / Academic Subjects: Mathematics (step-by-step solutions), Science, English Grammar & Spoken English, Social Studies, Computer & Coding, General Knowledge.
3. Madarsa Portal Help: Online Admissions, Class 1 to Class 5 schedules, Examinations, Homework, and Results.
Always reply warmly, accurately, and clearly in the same language style the user writes in (Hinglish, Urdu, Hindi, English, or Arabic).`;

      const streamRes = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedGeminiModel,
          messages: historyForApi,
          systemInstruction,
        }),
      });

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedText = '';
        let finalModel = selectedGeminiModel;
        let finalSources: Array<{ uri: string; title: string }> | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith('data:')) continue;
            const payload = trimmedLine.slice(5).trim();
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.textDelta) {
                accumulatedText += parsed.textDelta;
                setStreamingAiText(accumulatedText);
              }
              if (parsed.modelUsed) {
                finalModel = parsed.modelUsed;
              }
              if (parsed.sources) {
                finalSources = parsed.sources;
              }
            } catch {
              // ignore partial line
            }
          }
        }

        if (accumulatedText.trim()) {
          const aiMsg: ChatMessageItem = {
            id: `msg-ai-${Date.now()}`,
            roomId: room.id,
            senderId: 'AI-USTAZ',
            senderName: `Madarsa AI Ustaz (${finalModel})`,
            senderRole: 'AI Assistant',
            text: accumulatedText.trim(),
            sources: finalSources,
            timestamp: nowTime,
            isAiResponse: true,
          };

          setStreamingAiText('');
          onUpdateState((prev) => ({
            ...prev,
            chatMessages: [...(prev.chatMessages || chatMessages), aiMsg],
          }));
          return;
        }
      }

      // Fallback to standard /api/chat if stream was empty
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedGeminiModel,
          messages: historyForApi,
          systemInstruction,
        }),
      });
      const data = await res.json();
      const aiMsg: ChatMessageItem = {
        id: `msg-ai-${Date.now()}`,
        roomId: room.id,
        senderId: 'AI-USTAZ',
        senderName: `Madarsa AI Ustaz (${data?.modelUsed || selectedGeminiModel})`,
        senderRole: 'AI Assistant',
        text:
          data?.text ||
          `Wa Alaikum Assalam ${currentUser.name}! Main aapke sawal "${userQuestion}" ka jawab dene ke liye haazir hoon.`,
        timestamp: nowTime,
        isAiResponse: true,
      };
      onUpdateState((prev) => ({
        ...prev,
        chatMessages: [...(prev.chatMessages || chatMessages), aiMsg],
      }));
    } catch {
      const fallbackMsg: ChatMessageItem = {
        id: `msg-ai-${Date.now()}`,
        roomId: room.id,
        senderId: 'AI-USTAZ',
        senderName: 'Madarsa AI Ustaz',
        senderRole: 'AI Assistant',
        text: `Wa Alaikum Assalam ${currentUser.name}! Main aapki madad ke liye taiyar hoon. Aap Quran, Tajweed, Fiqh, Math, English, Science, Image creation, ya Google Search/Maps ke bare mein kuch bhi puch sakte hain.`,
        timestamp: nowTime,
        isAiResponse: true,
      };
      onUpdateState((prev) => ({
        ...prev,
        chatMessages: [...(prev.chatMessages || chatMessages), fallbackMsg],
      }));
    } finally {
      setStreamingAiText('');
      setIsAiThinking(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed) return;

    const userMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      roomId: activeRoom.id,
      senderId: currentUser.studentId || effectiveStudentId || currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: trimmed,
      imageUrl: uploadedSourceImage?.base64,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updatedHistory = [...activeRoomMessages, userMsg];
    setMessageInput('');

    onUpdateState((prev) => ({
      ...prev,
      chatRooms:
        prev.chatRooms && prev.chatRooms.length > 0
          ? prev.chatRooms
          : chatRooms,
      chatMessages: [...(prev.chatMessages || chatMessages), userMsg],
    }));

    const shouldInvokeAi =
      activeRoom.type === 'ai' ||
      askAiInGroup ||
      aiPowerMode !== 'chat' ||
      trimmed.toLowerCase().startsWith('@ai') ||
      trimmed.toLowerCase().includes('ai ustaz');

    if (shouldInvokeAi) {
      await triggerAiReply(activeRoom, trimmed, updatedHistory);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedSourceImage({
          base64: reader.result,
          mimeType: file.type || 'image/jpeg',
        });
        setAiPowerMode('image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNewGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const createdRoom: ChatRoom = {
      id: `room-grp-${Date.now()}`,
      name:
        newGroupType === 'class'
          ? `${newGroupClass} — ${newGroupName.trim()}`
          : newGroupName.trim(),
      type: newGroupType === 'class' ? 'class' : 'custom-group',
      className: newGroupType === 'class' ? newGroupClass : undefined,
      description:
        newGroupDesc.trim() ||
        (newGroupType === 'class'
          ? `Class ${newGroupClass} study & discussion group`
          : `Group created by ${currentUser.name}`),
      participantIds: selectedMemberIds.length > 0 ? selectedMemberIds : ['ALL'],
      createdBy: currentUser.name,
      createdAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };

    const welcomeMsg: ChatMessageItem = {
      id: `msg-init-${Date.now()}`,
      roomId: createdRoom.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: `Assalamu Alaikum! "${createdRoom.name}" group banaya gaya hai. Yahan aap sabhi members aur AI Ustaz ke saath baat-cheet kar sakte hain.`,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    onUpdateState(
      (prev) => ({
        ...prev,
        chatRooms: [...(prev.chatRooms || chatRooms), createdRoom],
        chatMessages: [...(prev.chatMessages || chatMessages), welcomeMsg],
      }),
      'Created Chat Group',
      createdRoom.name
    );

    setNewGroupName('');
    setNewGroupDesc('');
    setSelectedMemberIds(['ALL']);
    setShowCreateGroupModal(false);
    setSelectedRoomId(createdRoom.id);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (roomId === 'room-ai-ustaz' || roomId === 'room-all-students') return;
    onUpdateState((prev) => ({
      ...prev,
      chatRooms: (prev.chatRooms || chatRooms).filter((r) => r.id !== roomId),
      chatMessages: (prev.chatMessages || chatMessages).filter((m) => m.roomId !== roomId),
    }));
    setSelectedRoomId('room-ai-ustaz');
  };

  const toggleMemberSelection = (id: string) => {
    if (id === 'ALL') {
      setSelectedMemberIds(['ALL']);
      return;
    }
    setSelectedMemberIds((prev) => {
      const withoutAll = prev.filter((x) => x !== 'ALL');
      if (withoutAll.includes(id)) {
        const next = withoutAll.filter((x) => x !== id);
        return next.length === 0 ? ['ALL'] : next;
      }
      return [...withoutAll, id];
    });
  };

  const visibleRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return chatRooms.filter((r) => {
      if (sidebarFilter === 'ai' && r.type !== 'ai') return false;
      if (sidebarFilter === 'class' && r.type !== 'class') return false;
      if (
        sidebarFilter === 'groups' &&
        r.type !== 'custom-group' &&
        r.type !== 'all-students'
      )
        return false;
      if (sidebarFilter === 'direct' && r.type !== 'direct') return false;

      if (q) {
        return (
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.className && r.className.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [chatRooms, sidebarFilter, searchQuery]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return directoryContacts;
    return directoryContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.key.toLowerCase().includes(q) ||
        (c.className && c.className.toLowerCase().includes(q))
    );
  }, [directoryContacts, searchQuery]);

  const quickAiActions = [
    {
      mode: 'chat' as AiPowerMode,
      label: 'Tajweed Qawaid Samjhao',
      prompt: 'Tajweed ke 5 ahem qawaid आसान Urdu/Hinglish mein samjhao',
    },
    {
      mode: 'image' as AiPowerMode,
      label: '🎨 Image Banao: Madarsa Banner',
      prompt:
        'Create an Islamic calligraphy and emerald green golden banner for Madarsa Gausiya Razviya Islamnagar Annual Prize Ceremony',
    },
    {
      mode: 'search' as AiPowerMode,
      label: '🌐 Google Search: Scholarship 2026',
      prompt: 'Latest minority and madarsa student scholarships in India 2026',
    },
    {
      mode: 'maps' as AiPowerMode,
      label: '📍 Google Maps: Islamic Libraries',
      prompt: 'Famous Islamic educational academies and libraries in India',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dee6e1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MadarsaLogo
            customLogoUrl={state.madarsaSettings.logoUrl}
            className="w-11 h-11 flex-shrink-0"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#11261d] flex items-center gap-2">
              Advanced Gemini AI Ustaz, Image Studio & Student Chat Hub
            </h1>
            <p className="text-xs text-[#61786e]">
              Instant Streaming Gemini Chat · Create & Edit Images · Live Google Search · Google Maps · All Students & Class Groups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedRoomId('room-ai-ustaz')}
            className="px-3.5 py-2 rounded-xl bg-[#144734] hover:bg-[#0f3627] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-amber-300" />
            AI Ustaz (Instant)
          </button>

          <button
            type="button"
            onClick={() => {
              setNewGroupType('class');
              setShowCreateGroupModal(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-[#144734] text-[#144734] hover:bg-emerald-50 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <School className="w-4 h-4" />
            + Class Group
          </button>

          <button
            type="button"
            onClick={() => {
              setNewGroupType('custom-group');
              setShowCreateGroupModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Group
          </button>
        </div>
      </div>

      {/* Main Split Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[76vh] min-h-[580px]">
        {/* Left Sidebar: Rooms, Class Groups & Individual Students */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#dee6e1] flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-[#dee6e1] space-y-2.5 bg-[#f9fbfa]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#61786e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups, classes, or students..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#dee6e1] text-xs focus:outline-none focus:border-[#144734]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#61786e] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1 p-1 bg-[#edf2ee] rounded-xl text-[11px] font-bold">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'ai', label: 'AI' },
                  { id: 'class', label: 'Classes' },
                  { id: 'groups', label: 'Groups' },
                  { id: 'direct', label: 'Students' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSidebarFilter(tab.id)}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                    sidebarFilter === tab.id
                      ? 'bg-[#144734] text-white shadow-xs'
                      : 'text-[#52685e] hover:text-[#11261d]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#edf2ee]">
            {visibleRooms.length > 0 && (
              <div className="py-1">
                <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#61786e]">
                  AI, Class Rooms & Groups ({visibleRooms.length})
                </div>
                {visibleRooms.map((room) => {
                  const isSelected = room.id === activeRoom.id;
                  const roomMsgs = chatMessages.filter((m) => m.roomId === room.id);
                  const lastMsg = roomMsgs[roomMsgs.length - 1];

                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`px-3.5 py-2.5 flex items-start gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#144734]/10 border-l-4 border-[#144734]'
                          : 'hover:bg-[#f4f7f5]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                          room.type === 'ai'
                            ? 'bg-gradient-to-br from-[#144734] to-[#0d2e22]'
                            : room.type === 'class'
                            ? 'bg-emerald-700'
                            : room.type === 'direct'
                            ? 'bg-teal-700'
                            : 'bg-[#d4942a]'
                        }`}
                      >
                        {room.type === 'ai' ? (
                          <Bot className="w-5 h-5 text-amber-300" />
                        ) : room.type === 'class' ? (
                          <School className="w-4 h-4" />
                        ) : room.type === 'direct' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-extrabold text-[#11261d] truncate">
                            {room.name}
                          </h4>
                          {lastMsg && (
                            <span className="text-[10px] text-[#7c9086] flex-shrink-0">
                              {lastMsg.timestamp}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#61786e] truncate mt-0.5">
                          {lastMsg
                            ? `${lastMsg.senderName}: ${lastMsg.text}`
                            : room.description || 'Start conversation'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(sidebarFilter === 'all' || sidebarFilter === 'direct') && (
              <div className="py-2">
                <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#61786e]">
                  All Students & Members — Click for 1-on-1 Chat ({filteredContacts.length})
                </div>
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.key}
                    type="button"
                    onClick={() => handleStartDirectChat(contact)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-[#f4f7f5] text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#144734] font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#11261d] truncate">
                          {contact.name}
                        </div>
                        <div className="text-[10px] text-[#61786e] truncate">
                          {contact.role}
                          {contact.className ? ` · ${contact.className}` : ''} · {contact.key}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold text-[#144734] flex-shrink-0">
                      Chat →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Conversation Panel */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#dee6e1] flex flex-col overflow-hidden">
          {/* Active Room Header */}
          <div className="p-3.5 sm:p-4 border-b border-[#dee6e1] bg-gradient-to-r from-[#123f2e] to-[#19533d] text-white flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                {activeRoom.type === 'ai' ? (
                  <Bot className="w-5 h-5 text-amber-300" />
                ) : activeRoom.type === 'class' ? (
                  <School className="w-5 h-5 text-amber-300" />
                ) : activeRoom.type === 'direct' ? (
                  <User className="w-5 h-5 text-amber-300" />
                ) : (
                  <Users className="w-5 h-5 text-amber-300" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold truncate">{activeRoom.name}</h3>
                <p className="text-[11px] text-emerald-100/80 truncate">
                  {activeRoom.description ||
                    (activeRoom.className
                      ? `Official Class Group for ${activeRoom.className}`
                      : 'Madarsa Live Chat Room')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Gemini Model Selector */}
              <select
                value={selectedGeminiModel}
                onChange={(e) => setSelectedGeminiModel(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white/15 text-white text-[11px] font-bold border border-white/20 focus:outline-none cursor-pointer"
                title="Select Gemini Model"
              >
                <option value="gemini-3.1-flash-lite" className="text-black">
                  ⚡ Flash Lite (Instant)
                </option>
                <option value="gemini-3.8-flash" className="text-black">
                  ✨ Flash 3.8 (Smart)
                </option>
                <option value="gemini-flash-latest" className="text-black">
                  🚀 Gemini Flash (Latest)
                </option>
              </select>

              {activeRoom.type !== 'ai' && (
                <button
                  type="button"
                  onClick={() => setAskAiInGroup((prev) => !prev)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    askAiInGroup
                      ? 'bg-amber-400 text-[#11261d]'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  {askAiInGroup ? 'AI Reply: ON' : 'Ask AI'}
                </button>
              )}

              {isSuperOrAdmin &&
                activeRoom.id !== 'room-ai-ustaz' &&
                activeRoom.id !== 'room-all-students' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRoom(activeRoom.id)}
                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-200 cursor-pointer"
                    title="Delete Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
            </div>
          </div>

          {/* Multimodal Power Toolbar: Chat | Create/Edit Image | Google Search | Google Maps */}
          <div className="px-3.5 py-2 bg-[#f4f7f5] border-b border-[#dee6e1] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setAiPowerMode('chat')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                  aiPowerMode === 'chat'
                    ? 'bg-[#144734] text-white'
                    : 'bg-white text-[#2d4239] border border-[#dee6e1]'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Instant AI Chat
              </button>

              <button
                type="button"
                onClick={() => setAiPowerMode('image')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                  aiPowerMode === 'image'
                    ? 'bg-[#d4942a] text-white'
                    : 'bg-white text-[#2d4239] border border-[#dee6e1]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Create / Edit Image
              </button>

              <button
                type="button"
                onClick={() => setAiPowerMode('search')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                  aiPowerMode === 'search'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-[#2d4239] border border-[#dee6e1]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Google Search
              </button>

              <button
                type="button"
                onClick={() => setAiPowerMode('maps')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                  aiPowerMode === 'maps'
                    ? 'bg-teal-700 text-white'
                    : 'bg-white text-[#2d4239] border border-[#dee6e1]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Google Maps
              </button>
            </div>

            {/* Quick Starter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {quickAiActions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiPowerMode(item.mode);
                    setMessageInput(item.prompt);
                  }}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#dee6e1] hover:border-[#144734] text-[10px] font-bold text-[#144734] whitespace-nowrap cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#f6f9f7]">
            {activeRoomMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#61786e]">
                <MessageSquare className="w-10 h-10 text-[#144734]/40 mb-2" />
                <p className="text-sm font-bold text-[#11261d]">No messages in {activeRoom.name} yet</p>
                <p className="text-xs mt-1 max-w-md">
                  Send a message below to chat, create an image, search Google, or talk with students!
                </p>
              </div>
            ) : (
              activeRoomMessages.map((msg) => {
                const isMine =
                  !msg.isAiResponse &&
                  (msg.senderName.toLowerCase() === currentUser.name.toLowerCase() ||
                    msg.senderId.toLowerCase() === myUserKey);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#61786e]">
                      <span className="font-extrabold text-[#11261d]">{msg.senderName}</span>
                      <span>·</span>
                      <span>{msg.senderRole}</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-2xs space-y-2.5 ${
                        msg.isAiResponse
                          ? 'bg-gradient-to-br from-[#144734] to-[#0f3627] text-white border border-amber-400/40'
                          : isMine
                          ? 'bg-[#d4942a] text-white font-medium'
                          : 'bg-white text-[#11261d] border border-[#dee6e1]'
                      }`}
                    >
                      <div>{msg.text}</div>

                      {/* Attached or AI Generated Image */}
                      {msg.imageUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-white/20 bg-black/20">
                          <img
                            src={msg.imageUrl}
                            alt="Generated or uploaded visual"
                            className="w-full max-h-72 object-contain"
                          />
                          <div className="p-2 flex justify-end bg-black/40">
                            <a
                              href={msg.imageUrl}
                              download={`madarsa-ai-image-${msg.id}.png`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-[#11261d] text-[11px] font-extrabold"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download Image
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Google Search Grounding Citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 border-t border-white/15 space-y-1">
                          <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                            Verified Google Search Sources:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, i) => (
                              <a
                                key={i}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-emerald-100 underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span className="truncate max-w-[200px]">{src.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Google Maps Grounding Places */}
                      {msg.places && msg.places.length > 0 && (
                        <div className="pt-2 border-t border-white/15 space-y-1.5">
                          <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                            Google Maps Locations:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.places.map((pl, i) => (
                              <a
                                key={i}
                                href={pl.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-left block"
                              >
                                <div className="text-xs font-extrabold text-amber-300 flex items-center justify-between">
                                  <span>{pl.title}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Instant Real-Time Streaming Bubble */}
            {streamingAiText && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#144734] font-extrabold">
                  <span>Madarsa AI Ustaz</span>
                  <span>·</span>
                  <span>Streaming live...</span>
                </div>
                <div className="max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-gradient-to-br from-[#144734] to-[#0f3627] text-white border border-amber-400/40">
                  {streamingAiText}
                </div>
              </div>
            )}

            {isAiThinking && !streamingAiText && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#144734] bg-white px-4 py-2.5 rounded-2xl border border-[#dee6e1] w-fit">
                <RefreshCw className="w-4 h-4 animate-spin text-[#d4942a]" />
                {aiPowerMode === 'image'
                  ? 'Creating / editing your image...'
                  : aiPowerMode === 'search'
                  ? 'Searching live Google data...'
                  : aiPowerMode === 'maps'
                  ? 'Searching Google Maps locations...'
                  : 'Connecting to Gemini AI...'}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Optional Uploaded Image Preview for Image Editing */}
          {uploadedSourceImage && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <img
                  src={uploadedSourceImage.base64}
                  alt="Upload preview"
                  className="w-9 h-9 rounded-lg object-cover border border-amber-400"
                />
                <span className="font-bold text-amber-900">
                  Photo attached for AI Image Editing — describe what to change or add!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUploadedSourceImage(null)}
                className="text-red-600 font-bold cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-[#dee6e1] flex items-center gap-2"
          >
            <label
              className="p-2.5 rounded-xl bg-[#f4f7f5] hover:bg-emerald-50 border border-[#dee6e1] text-[#144734] cursor-pointer flex-shrink-0"
              title="Upload image to edit with AI"
            >
              <ImageIcon className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="hidden"
              />
            </label>

            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={
                aiPowerMode === 'image'
                  ? 'Describe the image or poster you want AI to create or edit...'
                  : aiPowerMode === 'search'
                  ? 'Ask anything to search live on Google...'
                  : aiPowerMode === 'maps'
                  ? 'Enter a place, city, madarsa, or library to find on Google Maps...'
                  : activeRoom.type === 'ai'
                  ? 'Ask anything or say "ek image banao..." — Instant Gemini reply!'
                  : `Write a message in ${activeRoom.name} (or type @ai for AI)...`
              }
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#f4f7f5] border border-[#dee6e1] text-xs sm:text-sm text-[#11261d] focus:outline-none focus:bg-white focus:border-[#144734]"
            />

            <button
              type="submit"
              disabled={isAiThinking}
              className="px-5 py-2.5 rounded-xl bg-[#144734] hover:bg-[#0f3627] text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* CREATE NEW GROUP / CLASS GROUP MODAL */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#dee6e1] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
              <h3 className="text-lg font-extrabold text-[#11261d]">
                {newGroupType === 'class'
                  ? 'Create Class-Wise Chat Group'
                  : 'Create New Student / Study Group'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewGroup} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#f4f7f5] rounded-xl">
                <button
                  type="button"
                  onClick={() => setNewGroupType('custom-group')}
                  className={`py-2 rounded-lg font-extrabold cursor-pointer ${
                    newGroupType === 'custom-group'
                      ? 'bg-[#144734] text-white'
                      : 'text-[#52685e]'
                  }`}
                >
                  Custom Student Group
                </button>
                <button
                  type="button"
                  onClick={() => setNewGroupType('class')}
                  className={`py-2 rounded-lg font-extrabold cursor-pointer ${
                    newGroupType === 'class' ? 'bg-[#144734] text-white' : 'text-[#52685e]'
                  }`}
                >
                  Class-Wise Group
                </button>
              </div>

              {newGroupType === 'class' && (
                <div>
                  <label className="block font-bold text-[#2d4239] mb-1">Select Class *</label>
                  <select
                    value={newGroupClass}
                    onChange={(e) => setNewGroupClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#d6e0da] bg-white font-bold text-sm"
                  >
                    <option value="Class 1">Class 1</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 5">Class 5</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#2d4239] mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={
                    newGroupType === 'class'
                      ? 'e.g. Exam Preparation / Homework Group'
                      : 'e.g. Quran Tajweed Circle / Science Quiz Team'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6e0da] text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d4239] mb-1">
                  Group Description / Purpose
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Short description of this group..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d6e0da]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2d4239] mb-1.5">
                  Select Students / Members for Group
                </label>
                <div className="max-h-40 overflow-y-auto border border-[#d6e0da] rounded-xl p-2 space-y-1 bg-[#f9fbfa]">
                  <button
                    type="button"
                    onClick={() => toggleMemberSelection('ALL')}
                    className={`w-full px-3 py-1.5 rounded-lg text-left flex items-center justify-between font-bold cursor-pointer ${
                      selectedMemberIds.includes('ALL')
                        ? 'bg-[#144734] text-white'
                        : 'hover:bg-white text-[#11261d]'
                    }`}
                  >
                    <span>All Students & Teachers</span>
                    {selectedMemberIds.includes('ALL') && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  {directoryContacts.map((c) => {
                    const isChecked = selectedMemberIds.includes(c.key);
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => toggleMemberSelection(c.key)}
                        className={`w-full px-3 py-1.5 rounded-lg text-left flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-100 text-[#144734] font-bold'
                            : 'hover:bg-white text-[#2d4239]'
                        }`}
                      >
                        <span>
                          {c.name} ({c.className || c.role}) — {c.key}
                        </span>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-[#144734]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#dee6e1] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#144734] text-white font-extrabold cursor-pointer"
                >
                  Create Group Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
