'use client';

import { create } from 'zustand';
import { ConsultationType } from '@/types/common';

export interface PreviewSlot {
  start: string;
  end: string;
}

export interface ScheduleFormDraft {
  date: string;
  consultationType: ConsultationType;
  startTime: string;
  endTime: string;
  slotDuration: number;
  consultationFee: number;
}

export const initialScheduleFormDraft: ScheduleFormDraft = {
  date: '',
  consultationType: 'physical',
  startTime: '09:00',
  endTime: '12:00',
  slotDuration: 30,
  consultationFee: 1000,
};

interface DoctorScheduleUIState {
  formDraft: ScheduleFormDraft;
  previewSlots: PreviewSlot[];
  editingAvailabilityId: string | null;
  pendingCancelAvailabilityId: string | null;
  setFormDraft: (partial: Partial<ScheduleFormDraft>) => void;
  setPreviewSlots: (slots: PreviewSlot[]) => void;
  clearPreviewSlots: () => void;
  resetFormDraft: () => void;
  startEditingAvailability: (availabilityId: string, draft: ScheduleFormDraft) => void;
  stopEditingAvailability: () => void;
  openCancelAvailability: (availabilityId: string) => void;
  closeCancelAvailability: () => void;
}

export const useDoctorScheduleUIStore = create<DoctorScheduleUIState>((set) => ({
  formDraft: initialScheduleFormDraft,
  previewSlots: [],
  editingAvailabilityId: null,
  pendingCancelAvailabilityId: null,
  setFormDraft: (partial) =>
    set((state) => ({
      formDraft: {
        ...state.formDraft,
        ...partial,
      },
    })),
  setPreviewSlots: (slots) => set({ previewSlots: slots }),
  clearPreviewSlots: () => set({ previewSlots: [] }),
  resetFormDraft: () => set({ formDraft: initialScheduleFormDraft }),
  startEditingAvailability: (availabilityId, draft) =>
    set({
      editingAvailabilityId: availabilityId,
      formDraft: draft,
      previewSlots: [],
    }),
  stopEditingAvailability: () =>
    set({
      editingAvailabilityId: null,
      formDraft: initialScheduleFormDraft,
      previewSlots: [],
    }),
  openCancelAvailability: (availabilityId) => set({ pendingCancelAvailabilityId: availabilityId }),
  closeCancelAvailability: () => set({ pendingCancelAvailabilityId: null }),
}));