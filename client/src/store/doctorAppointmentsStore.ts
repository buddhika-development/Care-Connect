'use client';

import { create } from 'zustand';

interface DoctorAppointmentsUIState {
  selectedDate: string | null;
  dayActionAvailabilityId: string | null;
  setSelectedDate: (date: string | null) => void;
  setDayActionAvailabilityId: (availabilityId: string | null) => void;
  clearDoctorAppointmentsUI: () => void;
}

export const useDoctorAppointmentsUIStore = create<DoctorAppointmentsUIState>((set) => ({
  selectedDate: null,
  dayActionAvailabilityId: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
  setDayActionAvailabilityId: (availabilityId) => set({ dayActionAvailabilityId: availabilityId }),
  clearDoctorAppointmentsUI: () => set({ selectedDate: null, dayActionAvailabilityId: null }),
}));