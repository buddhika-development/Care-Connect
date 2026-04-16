import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';

export const notificationKeys = {
  list: (userId: string) => ['notifications', userId] as const,
};

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: notificationKeys.list(userId),
    queryFn: () => getNotifications(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list(userId) });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list(userId) });
    },
  });
}
