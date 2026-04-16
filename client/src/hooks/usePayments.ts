import { useQuery } from '@tanstack/react-query';
import { getPayments, getPaymentSummary } from '@/services/paymentService';

export const paymentKeys = {
  list: () => ['payments', 'list'] as const,
  summary: () => ['payments', 'summary'] as const,
};

export function usePayments() {
  return useQuery({
    queryKey: paymentKeys.list(),
    queryFn: getPayments,
  });
}

export function usePaymentSummary() {
  return useQuery({
    queryKey: paymentKeys.summary(),
    queryFn: getPaymentSummary,
  });
}
