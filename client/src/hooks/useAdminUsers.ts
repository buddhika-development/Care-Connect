import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminUsersFilters,
  AdminUser,
  getAdminUsers,
  updateAdminUserActiveStatus,
} from "@/services/adminUsersService";

export const adminUsersKeys = {
  all: () => ["admin", "users"] as const,
  list: (filters: AdminUsersFilters) =>
    [
      "admin",
      "users",
      "list",
      filters.search ?? "",
      filters.role ?? "all",
      filters.status ?? "all",
    ] as const,
};

export function useAdminUsers(filters: AdminUsersFilters) {
  return useQuery<AdminUser[]>({
    queryKey: adminUsersKeys.list(filters),
    queryFn: () => getAdminUsers(filters),
    staleTime: 1000 * 30,
  });
}

export function useUpdateAdminUserActiveStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updateAdminUserActiveStatus(userId, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminUsersKeys.all() });
    },
  });
}
