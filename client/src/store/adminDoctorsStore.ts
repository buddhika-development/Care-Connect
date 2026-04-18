import { create } from "zustand";

export type AdminDoctorFilter = "all" | "verified" | "pending";

interface AdminDoctorsUIState {
  search: string;
  filter: AdminDoctorFilter;
  selectedDoctorUserId: string | null;
  setSearch: (value: string) => void;
  setFilter: (value: AdminDoctorFilter) => void;
  openDoctorProfile: (doctorUserId: string) => void;
  closeDoctorProfile: () => void;
  resetFilters: () => void;
}

export const useAdminDoctorsUIStore = create<AdminDoctorsUIState>((set) => ({
  search: "",
  filter: "all",
  selectedDoctorUserId: null,
  setSearch: (value) => set({ search: value }),
  setFilter: (value) => set({ filter: value }),
  openDoctorProfile: (doctorUserId) =>
    set({ selectedDoctorUserId: doctorUserId }),
  closeDoctorProfile: () => set({ selectedDoctorUserId: null }),
  resetFilters: () => set({ search: "", filter: "all" }),
}));
