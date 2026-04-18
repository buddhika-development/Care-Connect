import { create } from "zustand";
import { AppointmentStatus } from "@/types/common";

export type AdminAppointmentStatusFilter = AppointmentStatus | "all";

interface AdminAppointmentsUIState {
  search: string;
  statusFilter: AdminAppointmentStatusFilter;
  setSearch: (value: string) => void;
  setStatusFilter: (value: AdminAppointmentStatusFilter) => void;
  resetFilters: () => void;
}

const defaultState = {
  search: "",
  statusFilter: "all" as AdminAppointmentStatusFilter,
};

export const useAdminAppointmentsUIStore = create<AdminAppointmentsUIState>(
  (set) => ({
    ...defaultState,
    setSearch: (search) => set({ search }),
    setStatusFilter: (statusFilter) => set({ statusFilter }),
    resetFilters: () => set(defaultState),
  }),
);
