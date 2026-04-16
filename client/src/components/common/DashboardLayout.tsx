'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, HeartPulse } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/context/AuthContext';
import { useAuthUIStore } from '@/store/authStore';
import Sidebar from '@/components/common/Sidebar';
import ProfileCompletionModal from '@/components/common/ProfileCompletionModal';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const openModal = useUIStore((s) => s.openModal);
  const { user, isLoading, isAuthenticated } = useAuth();
  const skipped = useAuthUIStore((s) => s.skippedProfileCompletion);
  const router = useRouter();

  // Redirect if not authenticated after loading completes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show profile completion modal on first render if profile is incomplete
  useEffect(() => {
    if (user && !user.completeProfile && !skipped && user.role !== 'admin') {
      openModal('profileCompletion');
    }
  }, [user, skipped, openModal]);

  // Show loading skeleton while session is being restored
  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-text-muted">Restoring your session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-text-secondary hover:bg-secondary"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-text text-sm">CareConnect</span>
            </div>
          </div>
          {title && <h1 className="text-sm font-semibold text-text truncate max-w-[140px]">{title}</h1>}
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Scrollable content */}
        <main className={cn('flex-1 overflow-y-auto')}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Profile completion modal — rendered in layout so it shows on all dashboard pages */}
      <ProfileCompletionModal />
    </div>
  );
}
