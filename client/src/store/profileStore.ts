"use client";

import { create } from "zustand";

interface ProfileUIState {
  profileImagePreview: string | null;
  setProfileImagePreview: (url: string | null) => void;
  clearProfileUI: () => void;
}

export const useProfileUIStore = create<ProfileUIState>((set) => ({
  profileImagePreview: null,
  setProfileImagePreview: (url) => set({ profileImagePreview: url }),
  clearProfileUI: () => set({ profileImagePreview: null }),
}));
