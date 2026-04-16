import { Notification } from '@/types/common';

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'notif-001', title: 'Appointment Confirmed', message: 'Your appointment with Dr. Suresh Fernando on Apr 20 at 10:00 AM is confirmed.', type: 'success', read: false, createdAt: '2025-04-15T09:30:00Z' },
  { id: 'notif-002', title: 'Session Starting Soon', message: 'Your online session with Dr. Nirmala Jayawardena starts in 30 minutes.', type: 'warning', read: false, createdAt: '2025-04-16T14:00:00Z' },
  { id: 'notif-003', title: 'Prescription Added', message: 'Dr. Suresh Fernando has added a new prescription for you.', type: 'info', read: true, createdAt: '2025-04-10T11:00:00Z' },
  { id: 'notif-004', title: 'Payment Successful', message: 'Payment of LKR 2,000 received for your appointment.', type: 'success', read: true, createdAt: '2025-04-08T15:20:00Z' },
];

// TODO: Replace with real API endpoint
export async function getNotifications(userId: string): Promise<Notification[]> {
  await new Promise((r) => setTimeout(r, 400));
  void userId;
  return MOCK_NOTIFICATIONS;
}

// TODO: Replace with real API endpoint
export async function markNotificationRead(notificationId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  void notificationId;
}

// TODO: Replace with real API endpoint
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  void userId;
}
