'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAuthUIStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { HeartPulse, X } from 'lucide-react';
import { UserRole } from '@/types/common';

const PROFILE_ROUTES: Record<UserRole, string> = {
  patient: '/patient/profile',
  doctor: '/doctor/profile',
  admin: '/admin/dashboard',
};

/**
 * ProfileCompletionModal
 *
 * Shows on first login if user.completeProfile === false.
 * User can skip, but the skip state is tracked in Zustand so it doesn't
 * re-appear in the same session. Booking an appointment will re-enforce this.
 */
export default function ProfileCompletionModal() {
  const router = useRouter();
  const { user } = useAuth();
  const skipped = useAuthUIStore((s) => s.skippedProfileCompletion);
  const skipProfileCompletion = useAuthUIStore((s) => s.skipProfileCompletion);
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);

  // Show only when:
  // 1. Modal is explicitly opened, OR profile is incomplete
  // 2. User exists, is not admin
  // 3. Not already skipped this session
  const shouldShow =
    user &&
    user.role !== 'admin' &&
    !user.completeProfile &&
    !skipped &&
    activeModal === 'profileCompletion';

  if (!shouldShow) return null;

  const handleCompleteProfile = () => {
    closeModal();
    router.push(PROFILE_ROUTES[user!.role]);
  };

  const handleSkip = () => {
    skipProfileCompletion();
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop — not clickable to force a decision */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-card rounded-2xl shadow-modal border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Accent top bar */}
        <div className="h-1.5 bg-primary w-full" />

        <div className="p-8">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <HeartPulse className="w-8 h-8 text-primary" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text mb-2">
              Welcome, {user!.firstName}! 👋
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Your profile is incomplete. A complete profile unlocks appointment booking
              and helps {user!.role === 'doctor' ? 'patients trust you as a provider' : 'doctors give you better care'}.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCompleteProfile}
              id="complete-profile-btn"
              className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-sm"
            >
              Complete Profile Now
            </button>
            <button
              onClick={handleSkip}
              id="skip-profile-btn"
              className="w-full py-3 px-4 bg-secondary hover:bg-border text-text-secondary font-medium rounded-xl transition-all text-sm"
            >
              Skip for Now
            </button>
          </div>

          <p className="text-center text-xs text-text-muted mt-4">
            You can always complete your profile from{' '}
            <span className="font-medium">Profile Settings</span> in the sidebar.
          </p>
        </div>
      </div>
    </div>
  );
}
