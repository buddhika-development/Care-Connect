export type UserRole = 'patient' | 'doctor' | 'admin';

export type ConsultationType = 'physical' | 'online';

export type AppointmentStatus =
  | 'confirmed'
  | 'pending'
  | 'rescheduled'
  | 'cancelled'
  | 'completed'
  | 'ongoing';

export type PaymentStatus = 'success' | 'failed' | 'refunded' | 'pending';

export type VerificationStatus = 'verified' | 'pending';

export type UserStatus = 'active' | 'inactive';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}
