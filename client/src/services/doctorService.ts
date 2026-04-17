import { apiClient } from '@/lib/axios';
import {
  DoctorCard,
  DoctorProfile,
  DoctorAvailability,
  DoctorDaySchedule,
  DoctorProfileFull,
  stripSeconds,
  transformDoctorFull,
} from '@/types/doctor';
import { SessionPatientInfo } from '@/types/appointment';

type DoctorProfileRaw = {
  id: string;
  user_id: string;
  full_name: string;
  specialization: string;
  license_number: string | null;
  experience_years: number;
  room_number: string;
  bio: string | null;
};

type DoctorAvailabilityRaw = {
  id: string;
  doctor_profile_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  channeling_mode: 'physical' | 'online';
  consultation_fee: number;
  status: 'scheduled' | 'ongoing' | 'completed';
  doctor_availability_slots: Array<{
    id: string;
    slot_date: string;
    slot_start_time: string;
    slot_end_time: string;
    is_booked: boolean;
  }>;
};

type CreateAvailabilityResponse = {
  availability: Omit<DoctorAvailabilityRaw, 'doctor_availability_slots'>;
  slots: DoctorAvailabilityRaw['doctor_availability_slots'];
};

export interface CreateDoctorAvailabilityRequest {
  date: string;
  consultationType: 'physical' | 'online';
  startTime: string;
  endTime: string;
  slotDuration: number;
  consultationFee: number;
  status?: 'scheduled' | 'ongoing' | 'completed';
}

export interface UpdateDoctorAvailabilityRequest extends CreateDoctorAvailabilityRequest {
  availabilityId: string;
}

export interface DoctorProfilePayload {
  full_name: string;
  specialization: string;
  license_number?: string;
  experience_years: number;
  room_number: string;
  bio?: string;
}

export interface SaveDoctorProfileRequest {
  mode: 'create' | 'update';
  payload: DoctorProfilePayload;
}

function mapDoctorProfile(raw: DoctorProfileRaw): DoctorProfile {
  return {
    id: raw.id,
    userId: raw.user_id,
    fullName: raw.full_name,
    specialization: raw.specialization,
    licenseNumber: raw.license_number ?? '',
    experienceYears: raw.experience_years ?? 0,
    roomNumber: raw.room_number ?? '',
    bio: raw.bio ?? '',
  };
}

function mapDoctorAvailability(raw: DoctorAvailabilityRaw): DoctorAvailability {
  return {
    id: raw.id,
    doctorId: raw.doctor_profile_id,
    date: raw.available_date,
    consultationType: raw.channeling_mode,
    startTime: stripSeconds(raw.start_time),
    endTime: stripSeconds(raw.end_time),
    slotDuration: raw.slot_duration_minutes,
    consultationFee: raw.consultation_fee,
    slots: (raw.doctor_availability_slots ?? []).map((slot) => ({
      id: slot.id,
      startTime: stripSeconds(slot.slot_start_time),
      endTime: stripSeconds(slot.slot_end_time),
      isBooked: slot.is_booked,
    })),
  };
}

// ─── Real API ─────────────────────────────────────────────────────────────────

/**
 * Fetch all doctors with nested availabilities and slots.
 * Optionally filter by specialization (backend-filtered).
 * Name search is done client-side in the UI.
 */
export async function getDoctors(specialization?: string): Promise<DoctorCard[]> {
  const params: Record<string, string> = {};
  if (specialization) params.specialization = specialization;

  const { data } = await apiClient.get('/api/doctors/profile/all', { params });
  const raw: DoctorProfileFull[] = data.data ?? [];
  return raw.map(transformDoctorFull);
}

// ─── Doctor self-profile (doctor role only) ───────────────────────────────────

const MOCK_DAY_SCHEDULES: DoctorDaySchedule[] = [
  { date: '2025-04-21', consultationType: 'physical', totalPatients: 3, status: 'scheduled', availabilityId: 'avail-001' },
  { date: '2025-04-22', consultationType: 'online', totalPatients: 2, status: 'scheduled', availabilityId: 'avail-002' },
  { date: '2025-04-18', consultationType: 'physical', totalPatients: 5, status: 'completed', availabilityId: 'avail-003' },
  { date: '2025-04-17', consultationType: 'online', totalPatients: 4, status: 'completed', availabilityId: 'avail-004' },
];

const MOCK_SESSION_PATIENT: SessionPatientInfo = {
  id: 'pat-001',
  firstName: 'Kavindi',
  lastName: 'Perera',
  age: 29,
  gender: 'Female',
  bloodType: 'B+',
  profileImage: null,
  allergies: ['Penicillin', 'Dust'],
  chronicConditions: ['Mild Asthma'],
  currentMedications: ['Salbutamol Inhaler'],
  medicalDocuments: [
    { id: 'doc-001', fileName: 'chest-xray-2024.pdf', fileUrl: '#' },
    { id: 'doc-002', fileName: 'blood-test-results.pdf', fileUrl: '#' },
  ],
  previousAppointments: [
    { id: 'apt-prev-001', date: '2025-01-18', doctorName: 'Dr. Nirmala Jayawardena', status: 'completed', notes: 'Asthma follow-up' },
    { id: 'apt-prev-002', date: '2024-11-05', doctorName: 'Dr. Suresh Fernando', status: 'completed', notes: 'Routine check-up' },
  ],
};

export const MOCK_ALL_DOCTORS_ADMIN = [
  { id: 'doc-001', firstName: 'Suresh', lastName: 'Fernando', email: 'suresh.fernando@colombogeneral.lk', specialization: 'General Physician', currentHospital: 'Colombo General Hospital', isVerified: true },
  { id: 'doc-002', firstName: 'Nirmala', lastName: 'Jayawardena', email: 'nirmala.j@lankahospitals.lk', specialization: 'Pulmonologist', currentHospital: 'Lanka Hospitals', isVerified: true },
];

export async function getDoctorProfile(userId: string): Promise<DoctorProfile | null> {
  void userId;
  try {
    const { data } = await apiClient.get('/api/doctors/profile');
    if (!data?.data) return null;
    return mapDoctorProfile(data.data as DoctorProfileRaw);
  } catch {
    return null;
  }
}

export async function saveDoctorProfile({
  mode,
  payload,
}: SaveDoctorProfileRequest): Promise<DoctorProfile> {
  const endpoint = '/api/doctors/profile';
  const { data } = mode === 'create'
    ? await apiClient.post(endpoint, payload)
    : await apiClient.put(endpoint, payload);
  return mapDoctorProfile(data.data as DoctorProfileRaw);
}

export async function getDoctorAvailability(doctorId: string): Promise<DoctorAvailability[]> {
  void doctorId;
  const { data } = await apiClient.get('/api/doctors/availability');
  const rows: DoctorAvailabilityRaw[] = data.data ?? [];
  return rows.map(mapDoctorAvailability);
}

export async function createAvailability(
  data: CreateDoctorAvailabilityRequest,
): Promise<DoctorAvailability> {
  const payload = {
    available_date: data.date,
    start_time: `${data.startTime}:00`,
    end_time: `${data.endTime}:00`,
    slot_duration_minutes: data.slotDuration,
    channeling_mode: data.consultationType,
    consultation_fee: data.consultationFee,
    status: data.status ?? 'scheduled',
  };

  const { data: response } = await apiClient.post('/api/doctors/availability', payload);
  const result = response.data as CreateAvailabilityResponse;

  return mapDoctorAvailability({
    ...result.availability,
    doctor_availability_slots: result.slots,
  });
}

export async function updateAvailability(
  data: UpdateDoctorAvailabilityRequest,
): Promise<DoctorAvailability> {
  const payload = {
    available_date: data.date,
    start_time: `${data.startTime}:00`,
    end_time: `${data.endTime}:00`,
    slot_duration_minutes: data.slotDuration,
    channeling_mode: data.consultationType,
    consultation_fee: data.consultationFee,
    status: data.status ?? 'scheduled',
  };

  const { data: response } = await apiClient.put(
    `/api/doctors/availability/${data.availabilityId}`,
    payload,
  );
  const result = response.data as CreateAvailabilityResponse;

  return mapDoctorAvailability({
    ...result.availability,
    doctor_availability_slots: result.slots,
  });
}

export async function cancelAvailability(availabilityId: string): Promise<void> {
  await apiClient.delete(`/api/doctors/availability/${availabilityId}`);
}

// TODO: Replace with real API endpoint
export async function getDoctorDaySchedules(doctorId: string): Promise<DoctorDaySchedule[]> {
  await new Promise((r) => setTimeout(r, 500));
  void doctorId;
  return MOCK_DAY_SCHEDULES;
}

// TODO: Replace with real API endpoint
export async function getSessionPatientInfo(patientId: string): Promise<SessionPatientInfo> {
  await new Promise((r) => setTimeout(r, 600));
  void patientId;
  return MOCK_SESSION_PATIENT;
}

// TODO: Replace with real API endpoint
export async function getAllDoctorsAdmin(): Promise<typeof MOCK_ALL_DOCTORS_ADMIN> {
  await new Promise((r) => setTimeout(r, 500));
  return MOCK_ALL_DOCTORS_ADMIN;
}

// TODO: Replace with real API endpoint
export async function verifyDoctor(doctorId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 600));
  void doctorId;
}
