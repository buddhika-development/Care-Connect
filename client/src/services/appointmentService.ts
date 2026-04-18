import { apiClient } from "@/lib/axios";
import {
  Appointment,
  AppointmentRaw,
  BookingRequest,
} from "@/types/appointment";
import { AppointmentStatus } from "@/types/common";
import { DoctorCard } from "@/types/doctor";

interface AdminAppointmentRaw extends AppointmentRaw {
  patient_name?: string | null;
  doctor_name?: string | null;
  doctor_specialization?: string | null;
  slot_date?: string | null;
  slot_start_time?: string | null;
  slot_end_time?: string | null;
}

// ─── Transform raw appointment DB record → frontend Appointment ───────────────
export function transformAppointment(
  raw: AppointmentRaw,
  doctorsMap: Map<string, DoctorCard>,
): Appointment {
  // Parse scheduled_at into date + startTime
  const scheduledDate = new Date(raw.scheduled_at);
  const date = raw.scheduled_at.slice(0, 10); // "YYYY-MM-DD"
  const startTime = raw.scheduled_at.slice(11, 16); // "HH:MM"

  // Derive endTime by adding slot duration (30 min default)
  const endDate = new Date(scheduledDate.getTime() + 30 * 60 * 1000);
  const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

  // Enrich with doctor info from the cached doctors list
  const doctor = doctorsMap.get(raw.doctor_id);
  const doctorName = doctor
    ? `Dr. ${doctor.firstName} ${doctor.lastName}`
    : "Unknown Doctor";
  const doctorSpecialization = doctor?.specialization ?? "";

  return {
    id: raw.id,
    telemedicineSessionId: raw.telemedicine_session_id,
    slotId: raw.slot_id,
    patientId: raw.patient_id,
    patientName: "",
    patientImage: null,
    doctorId: raw.doctor_id,
    doctorName,
    doctorSpecialization,
    doctorImage: null,
    date,
    startTime,
    endTime,
    consultationType: raw.channeling_mode, // DB: channeling_mode (single 'l')
    status: raw.appointment_status,
    fee: raw.consultation_fee,
    scheduledAt: raw.scheduled_at,
    paymentId: raw.payment_id ?? "",
  };
}

// ─── Real API: Get my raw appointments (no enrichment) ──────────────────────────
export async function getRawAppointments(): Promise<AppointmentRaw[]> {
  const { data } = await apiClient.get("/api/appointments");
  return data.data ?? [];
}

// ─── Legacy: Get my appointments (enriched) ──────────────────────────────
export async function getAppointments(
  _userId: string,
  _role: "patient" | "doctor",
  doctorsMap: Map<string, DoctorCard> = new Map(),
): Promise<Appointment[]> {
  const raw = await getRawAppointments();
  return raw.map((r) => transformAppointment(r, doctorsMap));
}

// ─── Real API: Create appointment ──────────────────────────────────────────
export async function createAppointment(
  req: BookingRequest,
): Promise<AppointmentRaw> {
  const { data } = await apiClient.post("/api/appointments", {
    doctorId: req.doctorId,
    slotId: req.slotId,
    scheduledAt: req.scheduledAt,
    channelingMode: req.channelingMode,
    consultationFee: req.consultationFee,
  });
  return data.data as AppointmentRaw;
}

// ─── Real API: Cancel appointment ──────────────────────────────────────────
// Backend no longer accepts a body for cancel
export async function cancelAppointment(appointmentId: string): Promise<void> {
  await apiClient.patch(`/api/appointments/${appointmentId}/cancel`);
}

// ─── Real API: Reschedule appointment ─────────────────────────────────────────
export async function rescheduleAppointment(
  appointmentId: string,
  newSlotId: string,
): Promise<AppointmentRaw> {
  const { data } = await apiClient.patch(
    `/api/appointments/${appointmentId}/reschedule`,
    {
      newSlotId,
    },
  );
  return data.data as AppointmentRaw;
}

// ─── Real API: Get appointment by ID ──────────────────────────────────────────
export async function getAppointmentById(
  appointmentId: string,
): Promise<AppointmentRaw | null> {
  try {
    const { data } = await apiClient.get(`/api/appointments/${appointmentId}`);
    return data.data as AppointmentRaw;
  } catch {
    return null;
  }
}

// ─── Mocked: Doctor-side session actions ──────────────────────────────────────
// TODO: wire up when doctor dashboard integration starts

export async function startSession(appointmentId: string): Promise<void> {
  await apiClient.patch(`/api/appointments/${appointmentId}/start`);
}

export async function completeSession(
  appointmentId: string,
  prescription: { medicines: unknown[]; notes: string },
): Promise<void> {
  await apiClient.patch(`/api/appointments/${appointmentId}/complete`, {
    prescription,
  });
}

export async function getDoctorDayAppointments(
  doctorId: string,
  date: string,
): Promise<Appointment[]> {
  void doctorId;
  const { data } = await apiClient.get(`/api/appointments/doctor/day/${date}`);
  const rows: AppointmentRaw[] = data.data ?? [];
  return rows.map((row) => transformAppointment(row, new Map()));
}

export async function getAdminAppointments(): Promise<Appointment[]> {
  const { data } = await apiClient.get("/api/appointments/admin/all");
  const rows: AdminAppointmentRaw[] = data.data ?? [];

  return rows.map((row) => {
    const fallbackScheduled = new Date(row.scheduled_at);
    const date = row.slot_date || row.scheduled_at.slice(0, 10);
    const startTime = row.slot_start_time || row.scheduled_at.slice(11, 16);
    const endTime =
      row.slot_end_time ||
      new Date(fallbackScheduled.getTime() + 30 * 60 * 1000)
        .toISOString()
        .slice(11, 16);

    return {
      id: row.id,
      telemedicineSessionId: row.telemedicine_session_id,
      slotId: row.slot_id,
      patientId: row.patient_id,
      patientName: row.patient_name || "Unknown Patient",
      patientImage: null,
      doctorId: row.doctor_id,
      doctorName: row.doctor_name || "Unknown Doctor",
      doctorSpecialization: row.doctor_specialization || "",
      doctorImage: null,
      date,
      startTime,
      endTime,
      consultationType: row.channeling_mode,
      status: row.appointment_status,
      fee: row.consultation_fee,
      scheduledAt: row.scheduled_at,
      paymentId: row.payment_id ?? "",
    };
  });
}
