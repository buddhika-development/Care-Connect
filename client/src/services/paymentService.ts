import { Payment, PaymentSummary } from '@/types/payment';

const MOCK_PAYMENTS: Payment[] = [
  { id: 'pay-001', patientName: 'Kavindi Perera', doctorName: 'Dr. Suresh Fernando', amount: 2000, status: 'success', date: '2025-04-15', appointmentId: 'apt-001' },
  { id: 'pay-002', patientName: 'Kavindi Perera', doctorName: 'Dr. Nirmala Jayawardena', amount: 3500, status: 'success', date: '2025-04-18', appointmentId: 'apt-002' },
  { id: 'pay-003', patientName: 'Nuwan Karunarathne', doctorName: 'Dr. Chaminda Rajapaksa', amount: 4500, status: 'success', date: '2025-03-10', appointmentId: 'apt-003' },
  { id: 'pay-004', patientName: 'Sachini Bandara', doctorName: 'Dr. Dilani Wickramasinghe', amount: 3000, status: 'refunded', date: '2025-02-15', appointmentId: 'apt-004' },
  { id: 'pay-005', patientName: 'Harini Jayasena', doctorName: 'Dr. Suresh Fernando', amount: 2000, status: 'failed', date: '2025-04-10', appointmentId: 'apt-005' },
  { id: 'pay-006', patientName: 'Amara Silva', doctorName: 'Dr. Sandya Mendis', amount: 2500, status: 'success', date: '2025-04-12', appointmentId: 'apt-006' },
  { id: 'pay-007', patientName: 'Lasith Malinga', doctorName: 'Dr. Pradeep Gunawardena', amount: 5000, status: 'success', date: '2025-04-08', appointmentId: 'apt-007' },
];

const MOCK_SUMMARY: PaymentSummary = {
  totalRevenue: 19500,
  successfulPayments: 5,
  failedPayments: 1,
  refundedPayments: 1,
};

// TODO: Replace with real API endpoint
export async function getPayments(): Promise<Payment[]> {
  await new Promise((r) => setTimeout(r, 600));
  return MOCK_PAYMENTS;
}

// TODO: Replace with real API endpoint
export async function getPaymentSummary(): Promise<PaymentSummary> {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_SUMMARY;
}

// TODO: Replace with real API endpoint
export async function processPayment(
  appointmentId: string,
  amount: number,
  outcome: 'success' | 'failed' | 'crashed'
): Promise<{ status: 'success' | 'failed' | 'crashed'; paymentId?: string }> {
  await new Promise((r) => setTimeout(r, 1500));
  void appointmentId; void amount;
  if (outcome === 'success') return { status: 'success', paymentId: `pay-${Date.now()}` };
  if (outcome === 'failed') return { status: 'failed' };
  return { status: 'crashed' };
}
