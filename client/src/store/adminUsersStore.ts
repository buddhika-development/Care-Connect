import { create } from "zustand";
import { UserRole } from "@/types/common";

export type AdminUserRoleFilter = "all" | UserRole;
export type AdminUserStatusFilter = "all" | "active" | "inactive";

interface AdminUsersUIState {
  search: string;
  roleFilter: AdminUserRoleFilter;
  statusFilter: AdminUserStatusFilter;
  setSearch: (search: string) => void;
  setRoleFilter: (role: AdminUserRoleFilter) => void;
  setStatusFilter: (status: AdminUserStatusFilter) => void;
  resetFilters: () => void;
}

const defaultState = {
  search: "",
  roleFilter: "all" as AdminUserRoleFilter,
  statusFilter: "all" as AdminUserStatusFilter,
};

export const useAdminUsersUIStore = create<AdminUsersUIState>((set) => ({
  ...defaultState,
  setSearch: (search) => set({ search }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  resetFilters: () => set(defaultState),
}));
