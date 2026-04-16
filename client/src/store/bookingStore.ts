'use client';

import { create } from 'zustand';
import { ConsultationType } from '@/types/common';
import { DoctorCard, TimeSlot } from '@/types/doctor';

type PaymentStatus = 'idle' | 'success' | 'failed' | 'crashed';

interface BookingState {
  // Multi-step flow state
  currentStep: 1 | 2 | 3 | 4;
  selectedDoctor: DoctorCard | null;
  selectedDate: string | null;
  consultationType: ConsultationType;
  selectedSlot: TimeSlot | null;
  paymentStatus: PaymentStatus;

  // Actions
  setDoctor: (doctor: DoctorCard) => void;
  setDate: (date: string) => void;
  setConsultationType: (type: ConsultationType) => void;
  setSlot: (slot: TimeSlot) => void;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  resetBooking: () => void;
}

const initialState = {
  currentStep: 1 as const,
  selectedDoctor: null,
  selectedDate: null,
  consultationType: 'physical' as ConsultationType,
  selectedSlot: null,
  paymentStatus: 'idle' as PaymentStatus,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setDoctor: (doctor) => set({ selectedDoctor: doctor, currentStep: 1 }),
  setDate: (date) => set({ selectedDate: date }),
  setConsultationType: (type) => set({ consultationType: type, selectedDate: null, selectedSlot: null }),
  setSlot: (slot) => set({ selectedSlot: slot }),
  setStep: (step) => set({ currentStep: step }),
  setPaymentStatus: (status) => set({ paymentStatus: status }),
  resetBooking: () => set(initialState),
}));
