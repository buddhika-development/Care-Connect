import { Notification, UserRole } from "@/types/common";
import { AuthUser } from "@/services/authService";
import { getRecentActivity } from "@/services/patientService";
import {
  getRawAppointments,
  getAdminAppointments,
} from "@/services/appointmentService";
import { getPayments } from "@/services/paymentService";
import {
  getDoctorDaySchedules,
  getAllDoctorsAdmin,
} from "@/services/doctorService";
import { getAdminUsers } from "@/services/adminUsersService";

const MAX_NOTIFICATIONS = 20;

type ReadState = {
  readIds: string[];
  markAllAt: string | null;
};

type ActivityLike = {
  id: string;
  title: string;
  message: string;
  type: Notification["type"];
  createdAt: string;
};

function getStorageKey(userId: string) {
  return `cc_notifications_read_${userId}`;
}

function getDefaultReadState(): ReadState {
  return { readIds: [], markAllAt: null };
}

function readReadState(userId: string): ReadState {
  if (typeof window === "undefined") return getDefaultReadState();

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return getDefaultReadState();

    const parsed = JSON.parse(raw) as Partial<ReadState>;
    return {
      readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [],
      markAllAt: parsed.markAllAt ?? null,
    };
  } catch {
    return getDefaultReadState();
  }
}

function writeReadState(userId: string, state: ReadState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
}

function withReadState(items: ActivityLike[], userId: string): Notification[] {
  const state = readReadState(userId);
  const markAllTimestamp = state.markAllAt
    ? new Date(state.markAllAt).getTime()
    : Number.NaN;

  return items
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, MAX_NOTIFICATIONS)
    .map((item) => {
      const createdAtTime = new Date(item.createdAt).getTime();
      const readByMarkAll =
        !Number.isNaN(markAllTimestamp) && createdAtTime <= markAllTimestamp;

      return {
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        createdAt: item.createdAt,
        read: readByMarkAll || state.readIds.includes(item.id),
      };
    });
}

function safeIso(value?: string | null): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function mapPatientNotifications(userId: string) {
  return getRecentActivity(userId).then((activities) =>
    activities.map(
      (item) =>
        ({
          id: `patient-${item.id}`,
          title: item.title,
          message: item.description,
          createdAt: safeIso(item.timestamp),
          type:
            item.type === "payment"
              ? "success"
              : item.type === "appointment"
                ? "info"
                : "warning",
        }) satisfies ActivityLike,
    ),
  );
}

async function mapDoctorNotifications(userId: string): Promise<ActivityLike[]> {
  const [appointmentsResult, schedulesResult] = await Promise.allSettled([
    getRawAppointments(),
    getDoctorDaySchedules(userId),
  ]);

  const appointmentItems: ActivityLike[] =
    appointmentsResult.status === "fulfilled"
      ? appointmentsResult.value.map((apt) => ({
          id: `doctor-apt-${apt.id}`,
          title: "Appointment Update",
          message: `Appointment ${apt.appointment_status.toUpperCase()} on ${new Date(apt.scheduled_at).toLocaleString()}`,
          createdAt: safeIso(
            apt.updated_at || apt.created_at || apt.scheduled_at,
          ),
          type:
            apt.appointment_status === "completed"
              ? "success"
              : apt.appointment_status === "cancelled"
                ? "warning"
                : "info",
        }))
      : [];

  const scheduleItems: ActivityLike[] =
    schedulesResult.status === "fulfilled"
      ? schedulesResult.value.map((schedule) => ({
          id: `doctor-schedule-${schedule.availabilityId}`,
          title: "Schedule Summary",
          message: `${schedule.date} • ${schedule.consultationType} • ${schedule.totalPatients} booked patient(s)`,
          createdAt: safeIso(schedule.date),
          type: schedule.totalPatients > 0 ? "info" : "warning",
        }))
      : [];

  return [...appointmentItems, ...scheduleItems];
}

async function mapAdminNotifications(): Promise<ActivityLike[]> {
  const [appointmentsResult, paymentsResult, doctorsResult, usersResult] =
    await Promise.allSettled([
      getAdminAppointments(),
      getPayments(),
      getAllDoctorsAdmin(),
      getAdminUsers({}),
    ]);

  const appointmentItems: ActivityLike[] =
    appointmentsResult.status === "fulfilled"
      ? appointmentsResult.value.map((apt) => ({
          id: `admin-apt-${apt.id}`,
          title: "Appointment Activity",
          message: `${apt.patientName} • ${apt.doctorName} • ${apt.status.toUpperCase()}`,
          createdAt: safeIso(apt.scheduledAt),
          type:
            apt.status === "completed"
              ? "success"
              : apt.status === "cancelled"
                ? "warning"
                : "info",
        }))
      : [];

  const paymentItems: ActivityLike[] =
    paymentsResult.status === "fulfilled"
      ? paymentsResult.value.map((payment) => ({
          id: `admin-pay-${payment.id}`,
          title: "Payment Activity",
          message: `${payment.patientName} • ${payment.currency} ${Number(payment.amount).toFixed(2)} • ${payment.status.toUpperCase()}`,
          createdAt: safeIso(payment.updatedAt || payment.createdAt),
          type:
            payment.status === "completed"
              ? "success"
              : payment.status === "pending"
                ? "info"
                : "warning",
        }))
      : [];

  const doctorItems: ActivityLike[] =
    doctorsResult.status === "fulfilled"
      ? doctorsResult.value
          .filter((doc) => !doc.isVerified)
          .map((doc) => ({
            id: `admin-doc-${doc.userId}`,
            title: "Doctor Verification Pending",
            message: `Dr. ${doc.firstName} ${doc.lastName} (${doc.specialization}) is pending verification`,
            createdAt: new Date().toISOString(),
            type: "warning",
          }))
      : [];

  const userItems: ActivityLike[] =
    usersResult.status === "fulfilled"
      ? usersResult.value
          .filter((u) => !u.isActive)
          .slice(0, 5)
          .map((u) => ({
            id: `admin-user-${u.id}`,
            title: "Inactive User",
            message: `${u.firstName} ${u.lastName} (${u.role}) is currently inactive`,
            createdAt: safeIso(u.updatedAt || u.createdAt),
            type: "warning",
          }))
      : [];

  return [...appointmentItems, ...paymentItems, ...doctorItems, ...userItems];
}

async function buildRoleNotifications(
  userId: string,
  role: UserRole,
): Promise<ActivityLike[]> {
  if (role === "patient") {
    return mapPatientNotifications(userId);
  }

  if (role === "doctor") {
    return mapDoctorNotifications(userId);
  }

  return mapAdminNotifications();
}

export async function getNotifications(
  user: AuthUser,
): Promise<Notification[]> {
  const activities = await buildRoleNotifications(user.id, user.role);
  return withReadState(activities, user.id);
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  const state = readReadState(userId);
  if (state.readIds.includes(notificationId)) return;

  writeReadState(userId, {
    ...state,
    readIds: [...state.readIds, notificationId],
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const state = readReadState(userId);
  writeReadState(userId, {
    ...state,
    readIds: [],
    markAllAt: new Date().toISOString(),
  });
}
