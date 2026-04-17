'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MessageSquare, Plus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_AI_ENDPOINT || 'http://localhost:8000/api/v1';
const POLL_INTERVAL = 3000;

interface ChatSession {
  id: string;
  chat_title: string | null;
  user_id: string;
  created_datetime: string;
  updated_datetime: string;
}

interface AIChatSidebarProps {
  activeSessionId: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  newSessionPending?: boolean;
}

interface SidebarContentProps {
  sessions: ChatSession[];
  loading: boolean;
  activeSessionId: string | null;
  newSessionPending?: boolean;
  onNavigate: () => void;
  onClose: () => void;
  isMobile?: boolean;
}

function groupSessions(sessions: ChatSession[]) {
  const now = new Date();
  const today: ChatSession[] = [];
  const week: ChatSession[] = [];
  const older: ChatSession[] = [];

  for (const s of sessions) {
    const diff = (now.getTime() - new Date(s.created_datetime).getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) today.push(s);
    else if (diff <= 7) week.push(s);
    else older.push(s);
  }
  return { today, week, older };
}

function SessionGroup({
  title,
  items,
  activeId,
  onNavigate,
}: {
  title: string;
  items: ChatSession[];
  activeId: string | null;
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5">
      {title && (
        <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          {title}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const label = item.chat_title?.trim() || 'New Chat…';
          return (
            <li key={item.id}>
              <Link
                href={`/patient/ai-assistant/${item.id}`}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-secondary hover:text-text'
                )}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                <span className="truncate min-w-0">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SidebarContent({
  sessions,
  loading,
  activeSessionId,
  newSessionPending,
  onNavigate,
  onClose,
  isMobile,
}: SidebarContentProps) {
  const { today, week, older } = groupSessions(sessions);

  return (
    <div className="flex flex-col h-full">
      {/* Mobile-only header row */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <span className="font-semibold text-text text-sm">Chat History</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* New chat */}
      <div className="p-3 flex-shrink-0">
        <Link
          href="/patient/ai-assistant"
          onClick={onNavigate}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-border bg-card hover:bg-primary-50 hover:border-primary text-text-secondary hover:text-primary text-sm font-medium transition-all shadow-card"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          New chat
        </Link>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 no-scrollbar min-h-0">
        {loading ? (
          <div className="flex flex-col gap-2 px-1 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {newSessionPending && (
              <div className="mb-5">
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Today
                </p>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary-50 border border-primary-100">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
                  <div className="h-3.5 bg-primary-100 rounded animate-pulse flex-1" />
                </div>
              </div>
            )}

            <SessionGroup
              title={newSessionPending ? '' : 'Today'}
              items={today}
              activeId={activeSessionId}
              onNavigate={onNavigate}
            />
            <SessionGroup
              title="Previous 7 Days"
              items={week}
              activeId={activeSessionId}
              onNavigate={onNavigate}
            />
            <SessionGroup
              title="History"
              items={older}
              activeId={activeSessionId}
              onNavigate={onNavigate}
            />

            {sessions.length === 0 && !newSessionPending && (
              <p className="text-center text-xs text-text-muted mt-8 px-4">
                No past conversations yet. Start chatting!
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AIChatSidebar({
  activeSessionId,
  isOpen,
  setIsOpen,
  newSessionPending,
}: AIChatSidebarProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/chat/sessions?user_id=${user.id}`);
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error('Failed to fetch AI chat sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const activeSess = sessions.find((s) => s.id === activeSessionId);
    const needsPoll =
      newSessionPending ||
      (activeSessionId && (!activeSess || !activeSess.chat_title?.trim()));

    if (!needsPoll) return;
    const id = setInterval(fetchSessions, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [activeSessionId, sessions, newSessionPending, fetchSessions]);

  const sharedProps = {
    sessions,
    loading,
    activeSessionId,
    newSessionPending,
    onNavigate: () => setIsOpen(false),
    onClose: () => setIsOpen(false),
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop inline panel — fixed width, never shrinks */}
      <aside
        className="hidden md:flex h-full flex-col flex-shrink-0 border-r border-border bg-background"
        style={{ width: '250px', minWidth: '250px' }}
      >
        <SidebarContent {...sharedProps} />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border md:hidden transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ width: '260px' }}
      >
        <SidebarContent {...sharedProps} isMobile />
      </aside>
    </>
  );
}