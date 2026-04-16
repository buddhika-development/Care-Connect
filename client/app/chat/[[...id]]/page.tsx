'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sun, Moon, Menu } from 'lucide-react';
import ChatInput from '@/components/chat/ChatInput';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatSidebar from '@/components/chat/ChatSidebar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const params = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check initial dark mode preference
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    // If we land on a URL with an ID, we could set the session ID.
    // Realistically you'd want to fetch existing chat history here.
    // For this demonstration, we'll just set it.
    if (params?.id && Array.isArray(params.id)) {
      setSession(params.id[0]);
    }
  }, [params]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    const userId = "00000000-0000-0000-0000-000000000001";
    
    // Add user message to UI immediately
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    
    // Add placeholder assistant message
    const botMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: botMessageId, role: 'assistant', content: '' }
    ]);
    
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          user_id: userId,
          ...(session ? { session_id: session } : {})
        }),
      });

      if (!response.body) throw new Error('No readable stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          
          try {
            const dataStr = trimmed.slice(5).trim();
            const payload = JSON.parse(dataStr);
            
            if (payload.type === 'session_id') {
              const newSessionId = payload.data;
              setSession(newSessionId);
              // Update URL without a page reload so we don't break the stream
              window.history.replaceState(null, '', `/chat/${newSessionId}`);
            } else if (payload.type === 'chunk') {
              setMessages((prev) => 
                prev.map(msg => 
                  msg.id === botMessageId 
                    ? { ...msg, content: msg.content + payload.data } 
                    : msg
                )
              );
            } else if (payload.type === 'done') {
              setIsLoading(false);
            }
          } catch (e) {
            console.error("Failed to parse chunk:", trimmed, e);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: '**Error**: Failed to connect to the server.' }
      ]);
      setIsLoading(false);
    }
  };

  const isNewSession = messages.length === 0;

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
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto w-full no-scrollbar">
        {isNewSession ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-4 tracking-tight">
              How can I help you today?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg">
              Ask about symptoms, medications, or seek general medical guidance.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full">
              {[
                "I have a headache and mild fever, what should I do?",
                "Can I take paracetamol for a sore throat?",
                "What are the symptoms of seasonal flu?",
                "How long should I wait before seeing a doctor for a cough?"
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
          <div className="pb-32 pt-4">
            {messages.map((m) => (
              <ChatMessage key={m.id} role={m.role} content={m.content} />
            ))}
            {isLoading && (
              <div className="flex w-full py-6">
                <div className="max-w-4xl mx-auto w-full flex gap-4 px-4 items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 animate-pulse">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                  </div>
                  <div className="text-slate-400 text-sm animate-pulse">CareConnect is typing...</div>
                </div>
              </div>
            )}
            <div ref={bottomRef} className="h-px" />
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 pt-8 mt-auto absolute bottom-0 left-0 right-0 z-10">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>

    </div>
    </div>
  );
}
