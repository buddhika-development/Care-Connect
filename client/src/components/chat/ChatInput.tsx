/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null); // For SpeechRecognition

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      // Max height approx 5 lines (120px)
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [text]);

  // Handle Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setText((prev) => {
            // Append transcribed text
            const newText = prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + currentTranscript;
            return newText;
          });
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setText(''); // Option to clear text on new listen, or keep it. Let's keep it in the real logic, but maybe add a space.
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      onSendMessage(text.trim());
      setText('');
      if (isListening) {
        toggleListening(); // Stop listening if message is sent
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      <div className="relative flex items-end w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
        {/* Voice Input Button */}
        <button
          onClick={toggleListening}
          type="button"
          disabled={isLoading}
          className={`p-3 self-end flex-shrink-0 transition-colors ${
            isListening
              ? 'text-red-500 animate-pulse'
              : 'text-slate-400 hover:text-indigo-600'
          }`}
          title={isListening ? 'Stop listening' : 'Start speaking'}
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Text Input area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={isLoading}
          rows={1}
          className="w-full py-3 px-1 resize-none bg-transparent outline-none border-none text-slate-800 dark:text-slate-200 disabled:opacity-50 min-h-[48px]"
          style={{ maxHeight: '120px' }}
        />

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="p-3 self-end flex-shrink-0 text-slate-400 hover:text-indigo-600 disabled:hover:text-slate-400 disabled:opacity-50 transition-colors"
          title="Send message"
        >
          {isLoading ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} />}
        </button>
      </div>
      <div className="text-center mt-2 text-xs text-slate-500">
        AI can make mistakes. Consider verifying important information.
      </div>
    </div>
  );
}
