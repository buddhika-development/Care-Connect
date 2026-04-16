import { useQuery } from '@tanstack/react-query';
import { getPayments, getPaymentSummary, AdminPayment, PaymentSummary } from '@/services/paymentService';

export const paymentKeys = {
  list: () => ['payments', 'list'] as const,
  summary: () => ['payments', 'summary'] as const,
};

export function usePayments() {
  return useQuery<AdminPayment[]>({
    queryKey: paymentKeys.list(),
    queryFn: getPayments,
  });
}

export function usePaymentSummary() {
  return useQuery<PaymentSummary>({
    queryKey: paymentKeys.summary(),
    queryFn: getPaymentSummary,
  });
}
