'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Bot, User, Send, Stethoscope, Calendar, ChevronRight,
  Mic, MicOff, Copy, Check, Play, Pause, Loader2, Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';
import AIChatSidebar from '@/components/patient/AIChatSidebar';

const API_BASE = process.env.NEXT_PUBLIC_AI_ENDPOINT || 'http://localhost:8000/api/v1';

interface Doctor {
  name: string;
  specialization: string;
  slot: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bookingCards?: Doctor[];
}

const STARTER_PROMPTS = [
  'Which doctor for back pain?',
  'Book a cardiology appointment',
  'What are symptoms of diabetes?',
  'I have a headache and mild fever',
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "I'm CareBot, your AI health assistant 🌿\n\nI can help you find the right doctor, suggest specializations based on your symptoms, and guide you through booking. How can I help you today?",
};

function extractBookingCards(content: string): Doctor[] | undefined {
  const lower = content.toLowerCase();
  const mentionsBooking =
    lower.includes('doctor') ||
    lower.includes('physician') ||
    lower.includes('specialist') ||
    lower.includes('appointment') ||
    lower.includes('consult') ||
    lower.includes('book');

  if (!mentionsBooking) return undefined;

  if (lower.includes('cardio') || lower.includes('heart')) {
    return [
      { name: 'Dr. Chaminda Rajapaksa', specialization: 'Cardiologist', slot: 'Wed, Apr 23 · 11:00 AM' },
    ];
  }
  if (lower.includes('back') || lower.includes('spine') || lower.includes('orthop')) {
    return [
      { name: 'Dr. Pradeep Gunawardena', specialization: 'Orthopedic Surgeon', slot: 'Mon, Apr 21 · 9:00 AM' },
      { name: 'Dr. Suresh Fernando', specialization: 'General Physician', slot: 'Tue, Apr 22 · 10:30 AM' },
    ];
  }
  if (lower.includes('neuro') || lower.includes('headache') || lower.includes('migraine')) {
    return [
      { name: 'Dr. Kavindi Perera', specialization: 'Neurologist', slot: 'Thu, Apr 24 · 2:00 PM' },
    ];
  }
  return [
    { name: 'Dr. Suresh Fernando', specialization: 'General Physician', slot: 'Tue, Apr 22 · 10:30 AM' },
  ];
}

// ── Copy + voice per message ──────────────────────────────────────────────────
function MessageActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const plain = content.replace(/[#_*~`>]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex items-center gap-1 mt-1.5 ml-1">
      <button
        onClick={handleVoice}
        title={isPlaying ? 'Stop' : 'Read aloud'}
        className="p-1.5 rounded-full text-text-muted hover:text-primary hover:bg-primary-50 transition-all"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={handleCopy}
        title="Copy"
        className="p-1.5 rounded-full text-text-muted hover:text-primary hover:bg-primary-50 transition-all"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AIAssistantPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();

  const sessionIdFromUrl: string | null = Array.isArray(params?.id)
    ? (params.id[0] ?? null)
    : null;

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [session, setSession] = useState<string | null>(sessionIdFromUrl);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const loadedSessionRef = useRef<string | null>(null);

  // ── Load session history when URL changes ──────────────────────────────────
  useEffect(() => {
    if (sessionIdFromUrl === loadedSessionRef.current) return;

    setMessages([WELCOME_MESSAGE]);
    setSession(sessionIdFromUrl);
    loadedSessionRef.current = sessionIdFromUrl;

    if (!sessionIdFromUrl) return;

    setIsLoadingHistory(true);
    fetch(`${API_BASE}/chat/sessions/${sessionIdFromUrl}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Array<{ id: string; role: string; content: string }>>;
      })
      .then((data) => {
        setMessages(
          data.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
        );
      })
      .catch((err) => console.error('Failed to load chat history:', err))
      .finally(() => setIsLoadingHistory(false));
  }, [sessionIdFromUrl]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // ── Speech recognition ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput((prev) => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + transcript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;

    return () => recognitionRef.current?.stop();
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        /* already started */
      }
    }
  };

  // ── Send message + stream ──────────────────────────────────────────────────
  const handleSendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming || isLoadingHistory) return;

      setInput('');
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }

      const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed };
      const botId = crypto.randomUUID();

      setMessages((prev) => [...prev, userMsg, { id: botId, role: 'assistant', content: '' }]);
      setIsStreaming(true);

      try {
        const res = await fetch(`${API_BASE}/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            user_id: user?.id,
            ...(session ? { session_id: session } : {}),
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error('No readable stream');

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let finalContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith('data: ')) continue;

            try {
              const payload = JSON.parse(trimmedLine.slice(6));

              if (payload.type === 'session_id') {
                const newId: string = payload.data;
                setSession(newId);
                loadedSessionRef.current = newId;
                router.replace(`/patient/ai-assistant/${newId}`);
              } else if (payload.type === 'chunk') {
                finalContent += payload.data;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botId ? { ...m, content: m.content + payload.data } : m
                  )
                );
              } else if (payload.type === 'done') {
                const cards = extractBookingCards(finalContent);
                if (cards) {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === botId ? { ...m, bookingCards: cards } : m))
                  );
                }
                setIsStreaming(false);
              } else if (payload.type === 'error') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botId ? { ...m, content: `**Error**: ${payload.data}` } : m
                  )
                );
                setIsStreaming(false);
              }
            } catch {
              /* malformed SSE frame */
            }
          }
        }
      } catch (err) {
        console.error('Stream error:', err);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== botId),
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '**Error**: Failed to connect. Please try again.',
          },
        ]);
        setIsStreaming(false);
      }
    },
    [isStreaming, isLoadingHistory, isListening, session, user?.id, router]
  );

  const showStarters = messages.length <= 1 && !isStreaming && !isLoadingHistory;
  const lastBotId = messages[messages.length - 1]?.id;

  return (
    // KEY FIX: use h-full instead of hard-coded calc heights so this
    // component fills whatever space the parent layout gives it.
    <div className="flex w-full h-full min-h-0 overflow-hidden">

      {/* ── Session sidebar ── */}
      <AIChatSidebar
        activeSessionId={session}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        newSessionPending={!session && messages.length > 1}
      />

      {/* ── Chat panel — flex-1 so it fills ALL remaining width ── */}
      <div className="flex h-full flex-col flex-1 min-w-0 overflow-hidden">

        {/* Sub-header inside the chat panel */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          {/* Hamburger — visible on mobile to open session drawer */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-secondary"
            aria-label="Open chat history"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-text leading-tight">CareBot</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-success rounded-full inline-block animate-pulse" />
              <span className="text-xs text-text-muted">AI Health Assistant · Always available</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
          {isLoadingHistory ? (
            <div className="space-y-5 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-secondary animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-secondary rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      msg.role === 'user' ? 'bg-primary-50' : 'bg-primary'
                    )}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-primary" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Bubble + extras */}
                  <div
                    className={cn(
                      'max-w-[80%] flex flex-col',
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-tr-sm'
                          : 'bg-card border border-border shadow-card rounded-tl-sm text-text'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : msg.content ? (
                        <div className="prose prose-sm max-w-none break-words [&_strong]:text-text [&_p]:text-text [&_li]:text-text [&_h1]:text-text [&_h2]:text-text [&_h3]:text-text [&_a]:text-primary">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        /* Typing dots while first chunk hasn't arrived yet */
                        <div className="flex gap-1 items-center py-0.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions — only after streaming for this message is done */}
                    {msg.role === 'assistant' &&
                      msg.content &&
                      !(isStreaming && msg.id === lastBotId) && (
                        <MessageActions content={msg.content} />
                      )}

                    {/* Doctor booking cards — only after streaming ends */}
                    {msg.bookingCards && msg.bookingCards.length > 0 && (
                      <div className="mt-2 space-y-2 w-full">
                        {msg.bookingCards.map((doc, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3 p-3 bg-card border border-primary-100 rounded-xl shadow-card"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                                <Stethoscope className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-text">{doc.name}</p>
                                <p className="text-xs text-text-secondary">{doc.specialization}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-2.5 h-2.5 text-text-muted" />
                                  <span className="text-xs text-text-muted">{doc.slot}</span>
                                </div>
                              </div>
                            </div>
                            <Link
                              href="/patient/find-doctor"
                              className="flex items-center gap-1 text-xs text-white bg-primary px-2.5 py-1.5 rounded-lg hover:bg-primary-dark transition-all font-medium flex-shrink-0"
                            >
                              Book <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Starter prompts */}
        {showStarters && (
          <div className="flex-shrink-0 flex flex-wrap gap-2 px-4 pb-3">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1.5 text-xs bg-card border border-border rounded-full text-text-secondary hover:border-primary hover:text-primary hover:bg-primary-50 transition-all font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="flex-shrink-0 px-4 pb-4 pt-1">
          <div className="flex items-end gap-2 bg-card border border-border rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent shadow-card transition-all">
            <button
              type="button"
              onClick={toggleListening}
              disabled={isStreaming}
              title={isListening ? 'Stop listening' : 'Speak'}
              className={cn(
                'p-2 rounded-xl flex-shrink-0 transition-all',
                isListening
                  ? 'text-error bg-error-light animate-pulse'
                  : 'text-text-muted hover:text-primary hover:bg-primary-50',
                isStreaming && 'opacity-40 cursor-not-allowed'
              )}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(input);
                }
              }}
              placeholder="Describe your symptoms or ask a health question…"
              rows={1}
              disabled={isStreaming || isLoadingHistory}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-text placeholder:text-text-muted py-1.5 px-2 max-h-24 disabled:opacity-50"
              style={{ minHeight: '40px' }}
            />

            <button
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isStreaming || isLoadingHistory}
              className="w-9 h-9 rounded-xl bg-primary hover:bg-primary-dark text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-center text-xs text-text-muted mt-2">
            CareBot is an AI assistant. Always consult a qualified doctor for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}