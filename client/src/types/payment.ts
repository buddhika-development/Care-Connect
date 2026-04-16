import { PaymentStatus } from './common';

export interface Payment {
  id: string;
  patientName: string;
  doctorName: string;
  amount: number;
  status: PaymentStatus;
  date: string;
  appointmentId: string;
}

export interface PaymentSummary {
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
}
