'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Sun, Moon, Menu } from 'lucide-react';
import ChatInput from '@/components/chat/ChatInput';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatSidebar from '@/components/chat/ChatSidebar';
// Note: These components are now in src/components/chat/

const API_BASE = 'http://localhost:8000/api/v1';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const params = useParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  // Tracks which session's history we have already loaded to avoid
  // redundant fetches when only unrelated state changes trigger re-renders.
  const loadedSessionRef = useRef<string | null>(null);

  // ── Dark mode ────────────────────────────────────────────────────────────
  useEffect(() => {
    const prefersDark =
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    document.documentElement.classList.toggle('dark');
  };

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Session / history loading ────────────────────────────────────────────
  // Re-runs only when the URL session ID actually changes.
  const sessionIdFromUrl: string | null = Array.isArray(params?.id)
    ? (params.id[0] ?? null)
    : null;

  useEffect(() => {
    // Nothing changed — skip.
    if (sessionIdFromUrl === loadedSessionRef.current) return;

    // Reset chat state for the new (or cleared) session.
    setMessages([]);
    setSession(sessionIdFromUrl);
    loadedSessionRef.current = sessionIdFromUrl;

    if (!sessionIdFromUrl) return;

    // Fetch conversation history for an existing session.
    setIsLoadingHistory(true);
    fetch(`${API_BASE}/chat/sessions/${sessionIdFromUrl}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<
          Array<{ id: string; role: string; content: string }>
        >;
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
      .catch((err) => {
        console.error('Failed to load chat history:', err);
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [sessionIdFromUrl]);

  // ── Send message + stream response ──────────────────────────────────────
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (isStreaming || isLoadingHistory) return;

      // Optimistically add the user turn.
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
      };
      // Add a placeholder for the assistant reply.
      const botMessageId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: botMessageId, role: 'assistant', content: '' },
      ]);
      setIsStreaming(true);

      try {
        const res = await fetch(`${API_BASE}/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            user_id: DEMO_USER_ID,
            ...(session ? { session_id: session } : {}),
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error('No readable stream on response');

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by double newlines; process complete frames.
          const lines = buffer.split('\n');
          // The last element may be an incomplete line — keep it in the buffer.
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const payload = JSON.parse(trimmed.slice(6));

              if (payload.type === 'session_id') {
                const newId: string = payload.data;
                setSession(newId);
                loadedSessionRef.current = newId;
                window.history.replaceState(null, '', `/chat/${newId}`);
              } else if (payload.type === 'chunk') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId
                      ? { ...msg, content: msg.content + payload.data }
                      : msg
                  )
                );
              } else if (payload.type === 'done') {
                setIsStreaming(false);
              } else if (payload.type === 'error') {
                console.error('Stream error from server:', payload.data);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId
                      ? {
                          ...msg,
                          content: `**Error**: ${payload.data}`,
                        }
                      : msg
                  )
                );
                setIsStreaming(false);
              }
            } catch (parseErr) {
              console.error('Failed to parse SSE line:', trimmed, parseErr);
            }
          }
        }
      } catch (err) {
        console.error('Stream connection error:', err);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== botMessageId),
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '**Error**: Failed to connect to the server. Please try again.',
          },
        ]);
        setIsStreaming(false);
      }
    },
    [isStreaming, isLoadingHistory, session]
  );

  // ── Derived state ────────────────────────────────────────────────────────
  const showWelcome = messages.length === 0 && !isLoadingHistory;

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden w-full">
      <ChatSidebar
        activeSessionId={session}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        newSessionPending={!session && messages.length > 0}
      />

      <div className="flex flex-col flex-1 w-full relative overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              CareConnect AI
            </h1>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 overflow-y-auto w-full no-scrollbar">
          {isLoadingHistory ? (
            /* History skeleton while fetching past messages */
            <div className="max-w-4xl mx-auto w-full px-4 pt-8 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : showWelcome ? (
            /* Welcome / suggestion cards for new chats */
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4 tracking-tight">
                How can I help you today?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg">
                Ask about symptoms, medications, or seek general medical guidance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
                {[
                  'I have a headache and mild fever, what should I do?',
                  'Can I take paracetamol for a sore throat?',
                  'What are the symptoms of seasonal flu?',
                  'How long should I wait before seeing a doctor for a cough?',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-slate-800 dark:hover:border-slate-600 transition-all font-medium text-slate-700 dark:text-slate-300 shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Conversation */
            <div className="pb-32 pt-4">
              {messages.map((m) => (
                <ChatMessage key={m.id} role={m.role} content={m.content} />
              ))}

              {/* Typing indicator — only while the assistant placeholder is still empty */}
              {isStreaming && (
                <div className="flex w-full py-6">
                  <div className="max-w-4xl mx-auto w-full flex gap-4 px-4 items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 animate-pulse">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full" />
                    </div>
                    <div className="text-slate-400 text-sm animate-pulse">
                      CareConnect is typing…
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} className="h-px" />
            </div>
          )}
        </main>

        {/* Input Area */}
        <div className="flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 pt-8 mt-auto absolute bottom-0 left-0 right-0 z-10">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isStreaming || isLoadingHistory}
          />
        </div>
      </div>
    </div>
  );
}
