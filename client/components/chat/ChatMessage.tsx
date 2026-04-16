'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Play, Pause, Copy, Check, User, Bot } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  // A basic function to strip markdown for TTS
  const stripMarkdown = (text: string) => {
    return text
      .replace(/[#_*~`>]/g, '') // Remove formatting chars
      .replace(/\\\[([^\]]+)\\\]\\\([^)]+\\\)/g, '$1') // Extract text from links
      .trim();
  };

  const handlePlayVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // If currently speaking this message, cancel it
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Cancel any other speaking tasks
    window.speechSynthesis.cancel();

    const textToSpeak = stripMarkdown(content);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === 'user';

  return (
    <div className="flex w-full py-4 px-4 justify-center">
      <div className={`flex gap-4 max-w-4xl w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
            isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
          }`}
        >
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Content & Actions */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full overflow-hidden`}>
          {/* Bubble wrapper */}
          <div
            className={`max-w-[85%] sm:max-w-[75%] ${
              isUser
                ? 'px-4 py-3 sm:px-5 sm:py-4 bg-indigo-600 text-white rounded-2xl rounded-tr-sm text-sm sm:text-base'
                : 'bg-transparent text-slate-800 dark:text-slate-200 pt-1'
            }`}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap break-words">{content}</div>
            ) : (
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none break-words">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Assistant Actions below message */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-2 ml-1">
              <button
                onClick={handlePlayVoice}
                title={isPlaying ? "Pause Voice" : "Play Voice"}
                className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={handleCopy}
                title="Copy Text"
                className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
