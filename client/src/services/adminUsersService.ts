import { apiClient } from "@/lib/axios";
import { UserRole } from "@/types/common";

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isVerified: boolean;
  completeProfile: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersFilters {
  search?: string;
  role?: UserRole;
  status?: "all" | "active" | "inactive";
}

export async function getAdminUsers(
  filters: AdminUsersFilters = {},
): Promise<AdminUser[]> {
  const params: Record<string, string> = {};

  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.role) params.role = filters.role;
  if (filters.status && filters.status !== "all")
    params.status = filters.status;

  const { data } = await apiClient.get("/api/auth/admin/users", { params });
  return data.data ?? [];
}

export async function updateAdminUserActiveStatus(
  userId: string,
  isActive: boolean,
): Promise<{ id: string; isActive: boolean }> {
  const { data } = await apiClient.patch(
    `/api/auth/admin/users/${userId}/active`,
    {
      isActive,
    },
  );
  return data.data;
}
