'use client';

/**
 * authStore — UI STATE ONLY
 *
 * Authentication state (user, tokens, session) lives in AuthContext (src/context/AuthContext.tsx).
 * This store only tracks UI preferences that relate to the auth flow.
 *
 * "skippedProfileCompletion" — user dismissed the profile completion modal.
 * We persist this per-session so that reopening the same tab doesn't re-show the modal.
 * It resets to false on logout (handled in AuthContext which calls clearProfileSkip()).
 */

import { create } from 'zustand';

interface AuthUIState {
  skippedProfileCompletion: boolean;
  skipProfileCompletion: () => void;
  clearProfileSkip: () => void;
}

export const useAuthUIStore = create<AuthUIState>((set) => ({
  skippedProfileCompletion: false,
  skipProfileCompletion: () => set({ skippedProfileCompletion: true }),
  clearProfileSkip: () => set({ skippedProfileCompletion: false }),
}));
