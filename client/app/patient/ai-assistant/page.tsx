'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Stethoscope, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'doctor-recommendation';
  doctors?: { name: string; specialization: string; slot: string }[];
}

const STARTER_PROMPTS = [
  'Which doctor for back pain?',
  'Book a cardiology appointment',
  'What are symptoms of diabetes?',
  'I have a headache and mild fever',
];

const BOT_RESPONSES: Record<string, Message> = {
  default: { id: '', role: 'assistant', content: "I'm CareBot, your AI health assistant 🌿\n\nI can help you find the right doctor, suggest specializations based on your symptoms, and guide you through booking. How can I help you today?" },
  back: {
    id: '', role: 'assistant', content: "For **back pain**, I recommend seeing an **Orthopedic Surgeon** or a **General Physician** first.\n\nHere are some available doctors:",
    type: 'doctor-recommendation',
    doctors: [
      { name: 'Dr. Pradeep Gunawardena', specialization: 'Orthopedic Surgeon', slot: 'Mon, Apr 21 · 9:00 AM' },
      { name: 'Dr. Suresh Fernando', specialization: 'General Physician', slot: 'Tue, Apr 22 · 10:30 AM' },
    ],
  },
  cardiology: {
    id: '', role: 'assistant', content: "I found a **Cardiologist** for you! Here are available appointments:",
    type: 'doctor-recommendation',
    doctors: [
      { name: 'Dr. Chaminda Rajapaksa', specialization: 'Cardiologist', slot: 'Wed, Apr 23 · 11:00 AM' },
    ],
  },
  diabetes: { id: '', role: 'assistant', content: "**Common symptoms of diabetes include:**\n\n• Increased thirst and frequent urination\n• Blurred vision\n• Slow-healing wounds\n• Unexplained weight loss\n• Fatigue\n\nIf you're experiencing these symptoms, I recommend seeing a **General Physician** for a blood glucose test. Shall I find an available doctor for you?" },
  fever: {
    id: '', role: 'assistant', content: "For **headache and mild fever**, here's what I suggest:\n\n1. 💧 Stay hydrated — drink plenty of fluids\n2. 💊 Paracetamol (500mg) can help with both symptoms\n3. 😴 Rest in a cool, quiet room\n4. 🌡️ Monitor your temperature — if it exceeds 38.5°C, seek medical help\n\nShall I book an appointment with a **General Physician** for you?",
  },
};

function getResponse(message: string): Message {
  const lower = message.toLowerCase();
  if (lower.includes('back') || lower.includes('spine') || lower.includes('orthop')) return BOT_RESPONSES.back;
  if (lower.includes('cardiolog') || lower.includes('heart')) return BOT_RESPONSES.cardiology;
  if (lower.includes('diabetes') || lower.includes('blood sugar')) return BOT_RESPONSES.diabetes;
  if (lower.includes('headache') || lower.includes('fever') || lower.includes('flu')) return BOT_RESPONSES.fever;
  return {
    id: '', role: 'assistant',
    content: "Thank you for sharing that. Based on your symptoms, I'd recommend consulting a **General Physician** first for a proper assessment.\n\nWould you like me to:\n• Find available doctors\n• Explain more about your symptoms\n• Book an appointment directly"
  };
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { ...BOT_RESPONSES.default, id: 'welcome' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));

    const response = getResponse(text);
    setMessages(prev => [...prev, { ...response, id: `a-${Date.now()}` }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">CareBot</h1>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 bg-success rounded-full pulse-dot inline-block" />
              AI Health Assistant · Always available
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              msg.role === 'user' ? 'bg-primary-50' : 'bg-primary'
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={cn('max-w-[80%] space-y-3', msg.role === 'user' ? 'items-end' : 'items-start')}>
              <div className={cn(
                'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm'
                  : 'bg-card border border-border shadow-card rounded-tl-sm text-text whitespace-pre-wrap'
              )}>
                {msg.content}
              </div>
              {msg.type === 'doctor-recommendation' && msg.doctors && (
                <div className="space-y-2">
                  {msg.doctors.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 bg-card border border-primary-100 rounded-xl shadow-card">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
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
                      <Link href="/patient/find-doctor" className="flex items-center gap-1 text-xs text-white bg-primary px-2.5 py-1.5 rounded-lg hover:bg-primary-dark transition-all font-medium flex-shrink-0">
                        Book <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border border-border shadow-card rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Prompt chips */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {STARTER_PROMPTS.map(prompt => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="px-3 py-1.5 text-xs bg-card border border-border rounded-full text-text-secondary hover:border-primary hover:text-primary hover:bg-primary-50 transition-all font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0">
        <div className="flex items-end gap-2 bg-card border border-border rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent shadow-card">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Describe your symptoms or ask a health question..."
            rows={1}
            disabled={isTyping}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-text placeholder:text-text-muted py-1.5 px-2 max-h-24 disabled:opacity-50"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-xl bg-primary hover:bg-primary-dark text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-text-muted mt-2">CareBot is an AI assistant. Always consult a qualified doctor for medical advice.</p>
      </div>
    </div>
  );
}
