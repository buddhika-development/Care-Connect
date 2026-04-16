'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Plus, Menu, X, Loader2 } from 'lucide-react';

export interface ChatSession {
  id: string;
  chat_title: string | null;
  user_id: string;
  created_datetime: string;
  updated_datetime: string;
}

interface ChatSidebarProps {
  activeSessionId: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  newSessionPending?: boolean; // True when a new stream first started but ID title isn't loaded
}

export default function ChatSidebar({ activeSessionId, isOpen, setIsOpen, newSessionPending }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll configuration
  const POLL_INTERVAL = 3000;
  
  const fetchSessions = async () => {
    try {
      const res = await fetch(
        'http://localhost:8000/api/v1/chat/sessions?user_id=00000000-0000-0000-0000-000000000001'
      );
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to fetch chat sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Polling effect: if active session has an empty/null title or is pending
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Check if the current active session in the list has a placeholder title or is missing
    const activeSessData = sessions.find(s => s.id === activeSessionId);
    
    // Condition to poll: we are on a session, BUT either it's perfectly missing from list (was just created),
    // OR it sits in the list but title is null/empty.
    const isMissingOrUntitled = 
      activeSessionId && (!activeSessData || !activeSessData.chat_title || activeSessData.chat_title.trim() === '');
      
    if (isMissingOrUntitled || newSessionPending) {
      interval = setInterval(() => {
        fetchSessions();
      }, POLL_INTERVAL);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSessionId, sessions, newSessionPending]);

  // Grouping logic
  const now = new Date();
  const today: ChatSession[] = [];
  const previous7Days: ChatSession[] = [];
  const older: ChatSession[] = [];

  sessions.forEach((s) => {
    const created = new Date(s.created_datetime);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      today.push(s);
    } else if (diffDays <= 7) {
      previous7Days.push(s);
    } else {
      older.push(s);
    }
  });

  const GroupList = ({ title, items }: { title: string; items: ChatSession[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {title}
        </h3>
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = item.id === activeSessionId;
            const hasTitle = item.chat_title && item.chat_title.trim() !== '';
            
            return (
              <li key={item.id}>
                <Link
                  href={`/chat/${item.id}`}
                  onClick={() => setIsOpen(false)} // Close mobile menu when clicked
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors overflow-hidden ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' 
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare size={16} className="flex-shrink-0 opacity-70" />
                  <span className="truncate text-sm font-medium">
                    {hasTitle ? item.chat_title : 'New Chat...'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
            <span className="font-semibold text-slate-800 dark:text-white">CareConnect</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-shrink-0">
          <Link
            href="/chat"
            className="flex items-center justify-between w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 hover:border-indigo-200 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 transition-colors shadow-sm font-medium"
            onClick={() => setIsOpen(false)}
          >
            <span className="flex items-center gap-2">
              <Plus size={18} />
              New chat
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 no-scrollbar">
          {loading ? (
            <div className="flex flex-col gap-3 px-2 mt-4">
               {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-full"></div>
               ))}
            </div>
          ) : (
            <>
              {/* Dynamic Skeleton for a new pending session perfectly on top */}
              {newSessionPending && (
                <div className="mb-4">
                  <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Today
                  </h3>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/40">
                    <Loader2 size={16} className="text-indigo-600 animate-spin" />
                    <div className="h-4 bg-indigo-200 dark:bg-indigo-800 rounded animate-pulse w-24"></div>
                  </div>
                </div>
              )}
              
              <GroupList title={newSessionPending ? "" : "Today"} items={today} />
              <GroupList title="Previous 7 Days" items={previous7Days} />
              <GroupList title="History" items={older} />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
