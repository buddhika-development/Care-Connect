import { AppointmentStatus, ConsultationType } from './common';

// ─── Raw shape from appointment service DB ────────────────────────────────────
export interface AppointmentRaw {
  id: string;
  patient_id: string;
  doctor_id: string;
  slot_id: string;
  channelling_mode: ConsultationType;
  consultation_fee: number;
  scheduled_at: string;         // ISO datetime e.g. "2026-04-26T10:00:00"
  reason: string | null;
  appointment_status: AppointmentStatus;
  payment_status: string;
  cancel_reason: string | null;
  telemedicine_session_id: string | null;
  prescription_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Frontend-friendly appointment ───────────────────────────────────────────
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientImage: string | null;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorImage: string | null;
  date: string;        // "YYYY-MM-DD"
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  consultationType: ConsultationType;
  status: AppointmentStatus;
  fee: number;
  paymentId: string;
  countdownExpiry?: string;
  sessionNotes?: string;
}

export interface BookingRequest {
  doctorId: string;
  slotId: string;
  reason?: string;
}

export interface SessionPatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  bloodType: string;
  profileImage: string | null;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  medicalDocuments: { id: string; fileName: string; fileUrl: string }[];
  previousAppointments: {
    id: string;
    date: string;
    doctorName: string;
    status: string;
    notes?: string;
  }[];
}
