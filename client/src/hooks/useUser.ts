import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';
import { getUserSummaryDetails } from '@/services/userService';

export const userKeys = {
  summary: (userId: string) => ['user', 'summary', userId] as const,
};

export function useUserSummary() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: userKeys.summary(userId),
    queryFn: () => getUserSummaryDetails(userId),
    enabled: !!userId,
  });
}