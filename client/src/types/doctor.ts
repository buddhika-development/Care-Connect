import { ConsultationType } from './common';

// ─── Raw API shapes from doctor_profiles_full_view ───────────────────────────

export interface SlotFull {
  slot_id: string;
  slot_date: string;
  slot_start_time: string; // "HH:MM:SS"
  slot_end_time: string;   // "HH:MM:SS"
  is_booked: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorAvailabilityFull {
  availability_id: string;
  available_date: string;       // "YYYY-MM-DD"
  start_time: string;           // "HH:MM:SS"
  end_time: string;             // "HH:MM:SS"
  slot_duration_minutes: number;
  channeling_mode: ConsultationType; // "physical" | "online"
  consultation_fee: number;
  status: string;
  created_at: string;
  updated_at: string;
  slots: SlotFull[];
}

export interface DoctorProfileFull {
  doctor_profile_id: string;
  user_id: string;
  full_name: string;
  specialization: string;
  license_number: string | null;
  experience_years: number;
  bio: string | null;
  room_number: string;
  profile_created_at: string;
  profile_updated_at: string;
  availabilities: DoctorAvailabilityFull[];
}

// ─── Frontend-friendly shapes ─────────────────────────────────────────────────

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  experienceYears: number;
  roomNumber: string;
  bio: string;
}

export interface DoctorCard {
  id: string;        // doctor_profile_id
  userId: string;    // auth user_id — matches appointment.doctor_id
  firstName: string;
  lastName: string;
  specialization: string;
  roomNumber: string;
  experienceYears: number;
  bio: string | null;
  consultationFee: number;
  profileImage: string | null;
  availableConsultationTypes: ConsultationType[];
  availabilities: DoctorAvailabilityFull[];
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  date: string;
  status: 'scheduled' | 'ongoing' | 'completed';
  consultationType: ConsultationType;
  startTime: string;
  endTime: string;
  slotDuration: number;
  consultationFee: number;
  slots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  patientId?: string;
  patientName?: string;
}

export interface DoctorDaySchedule {
  date: string;
  consultationType: ConsultationType;
  totalPatients: number;
  status: 'scheduled' | 'ongoing' | 'completed';
  availabilityId: string;
}

// ─── Helper: strip seconds from HH:MM:SS → HH:MM ─────────────────────────────
export function stripSeconds(time: string): string {
  return time?.length >= 5 ? time.slice(0, 5) : time;
}

// ─── Transform raw API doctor → DoctorCard ────────────────────────────────────
export function transformDoctorFull(raw: DoctorProfileFull): DoctorCard {
  const nameParts = raw.full_name.trim().split(' ');
  const lastName = nameParts.length > 1 ? nameParts.pop()! : '';
  const firstName = nameParts.join(' ');

  const availableConsultationTypes = [
    ...new Set(raw.availabilities.map((a) => a.channeling_mode)),
  ] as ConsultationType[];

  // Use the first upcoming availability's fee, or the lowest fee overall
  const fees = raw.availabilities.map((a) => a.consultation_fee).filter(Boolean);
  const consultationFee = fees.length > 0 ? Math.min(...fees) : 0;

  return {
    id: raw.doctor_profile_id,
    userId: raw.user_id,           // ← auth user_id; matches appointment.doctor_id
    firstName,
    lastName,
    specialization: raw.specialization,
    roomNumber: raw.room_number,
    experienceYears: raw.experience_years,
    bio: raw.bio,
    consultationFee,
    profileImage: null,
    availableConsultationTypes,
    availabilities: raw.availabilities,
  };
}

// ─── Transform DoctorAvailabilityFull → DoctorAvailability ───────────────────
export function transformAvailability(
  raw: DoctorAvailabilityFull,
  doctorId: string
): DoctorAvailability {
  return {
    id: raw.availability_id,
    doctorId,
    date: raw.available_date,
    status: (raw.status === 'ongoing' || raw.status === 'completed') ? raw.status : 'scheduled',
    consultationType: raw.channeling_mode,
    startTime: stripSeconds(raw.start_time),
    endTime: stripSeconds(raw.end_time),
    slotDuration: raw.slot_duration_minutes,
    consultationFee: raw.consultation_fee,
    slots: raw.slots.map((s) => ({
      id: s.slot_id,
      startTime: stripSeconds(s.slot_start_time),
      endTime: stripSeconds(s.slot_end_time),
      isBooked: s.is_booked,
    })),
  };
}
