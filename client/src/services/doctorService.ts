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
import { Prescription } from '@/types/patient';

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

type DoctorPatientMedicalRecordRaw = {
  appointment_id: string;
  patient_user_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  current_medications: string[] | null;
  medical_report_urls: Array<string | { path?: string | null; signedUrl?: string | null }> | null;
};

type DoctorPrescriptionRaw = {
  id: string;
  patient_id: string;
  appointment_id: string;
  diagnosis: string;
  medications: Array<{
    medicine_name?: string;
    name?: string;
    dosage?: string;
    dosage_mg?: number | string;
    dosage_unit?: string;
    frequency?:
      | string
      | string[]
      | {
          morning?: boolean;
          day?: boolean;
          night?: boolean;
          custom?: string;
        };
    duration?: string;
    instruction_type?: 'before_meal' | 'after_meal' | 'with_meal' | 'before_sleep' | 'custom' | string;
    instruction_text?: string;
    instruction?: string;
    instructions?: string;
  }>;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
};

export interface PrescriptionFrequencySelection {
  morning: boolean;
  day: boolean;
  night: boolean;
  custom?: string;
}

export type PrescriptionInstructionType =
  | 'before_meal'
  | 'after_meal'
  | 'with_meal'
  | 'before_sleep'
  | 'custom';

export interface CreatePrescriptionMedicineRequest {
  name: string;
  dosageMg: number;
  frequency: PrescriptionFrequencySelection;
  duration: string;
  instructionType: PrescriptionInstructionType;
  customInstruction?: string;
}

export interface CreateAppointmentPrescriptionRequest {
  appointmentId: string;
  diagnosis: string;
  medications: CreatePrescriptionMedicineRequest[];
  notes?: string;
}

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
    status: raw.status,
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

function mapPatientMedicalRecordToSessionPatient(
  raw: DoctorPatientMedicalRecordRaw,
): SessionPatientInfo {
  const fullName = `${raw.first_name ?? ''} ${raw.last_name ?? ''}`.trim();
  const [firstName, ...rest] = fullName.length > 0 ? fullName.split(' ') : ['Patient'];
  const lastName = rest.join(' ');

  const medicalDocuments = (raw.medical_report_urls ?? [])
    .map((entry, index) => {
      if (typeof entry === 'string') {
        return {
          id: `med-doc-${index + 1}`,
          fileName: decodeURIComponent((entry.split('?')[0].split('/').pop() || `report-${index + 1}`)),
          fileUrl: entry,
        };
      }

      const url = entry?.signedUrl ?? '';
      if (!url) return null;

      const sourceForName = entry?.path ?? url;
      return {
        id: `med-doc-${index + 1}`,
        fileName: decodeURIComponent((sourceForName.split('?')[0].split('/').pop() || `report-${index + 1}`)),
        fileUrl: url,
      };
    })
    .filter((doc): doc is { id: string; fileName: string; fileUrl: string } => Boolean(doc));

  return {
    id: raw.patient_user_id,
    firstName,
    lastName,
    age: raw.age ?? 0,
    gender: raw.gender ?? 'Unknown',
    bloodType: raw.blood_type ?? 'Unknown',
    profileImage: null,
    allergies: raw.allergies ?? [],
    chronicConditions: raw.chronic_conditions ?? [],
    currentMedications: raw.current_medications ?? [],
    medicalDocuments,
    previousAppointments: [],
  };
}

function mapPrescriptionRawToPrescription(
  raw: DoctorPrescriptionRaw,
  doctorName: string,
  doctorSpecialization: string,
): Prescription {
  const instructionLabelByType: Record<string, string> = {
    before_meal: 'Before meal',
    after_meal: 'After meal',
    with_meal: 'With meal',
    before_sleep: 'Before sleep',
  };

  const getFrequencyLabel = (frequency: DoctorPrescriptionRaw['medications'][number]['frequency']): string => {
    if (!frequency) return '';

    if (typeof frequency === 'string') return frequency;

    if (Array.isArray(frequency)) {
      return frequency.join(', ');
    }

    const parts: string[] = [];
    if (frequency.morning) parts.push('Morning');
    if (frequency.day) parts.push('Day');
    if (frequency.night) parts.push('Night');
    if (frequency.custom && frequency.custom.trim()) parts.push(frequency.custom.trim());
    return parts.join(', ');
  };

  const getInstructionLabel = (medicine: DoctorPrescriptionRaw['medications'][number]): string => {
    if (medicine.instructions && medicine.instructions.trim()) return medicine.instructions.trim();
    if (medicine.instruction && medicine.instruction.trim()) return medicine.instruction.trim();

    if (medicine.instruction_type === 'custom') {
      return medicine.instruction_text?.trim() || '';
    }

    if (medicine.instruction_text && medicine.instruction_text.trim()) {
      return medicine.instruction_text.trim();
    }

    if (medicine.instruction_type && instructionLabelByType[medicine.instruction_type]) {
      return instructionLabelByType[medicine.instruction_type];
    }

    return '';
  };

  const getDosageLabel = (medicine: DoctorPrescriptionRaw['medications'][number]): string => {
    if (medicine.dosage_mg !== undefined && medicine.dosage_mg !== null && medicine.dosage_mg !== '') {
      const dosageValue = typeof medicine.dosage_mg === 'string' ? Number(medicine.dosage_mg) : medicine.dosage_mg;
      const unit = medicine.dosage_unit || 'mg';
      if (!Number.isNaN(dosageValue)) {
        return `${dosageValue} ${unit}/day`;
      }
    }

    return medicine.dosage ?? '';
  };

  return {
    id: raw.id,
    patientId: raw.patient_id,
    doctorName,
    doctorSpecialization,
    date: raw.created_at.slice(0, 10),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    diagnosis: raw.diagnosis,
    medicines: (raw.medications ?? []).map((medicine) => ({
      name: medicine.medicine_name ?? medicine.name ?? 'Medicine',
      dosage: getDosageLabel(medicine),
      frequency: getFrequencyLabel(medicine.frequency),
      duration: medicine.duration ?? '',
      instructions: getInstructionLabel(medicine),
    })),
    notes: raw.notes ?? '',
    appointmentId: raw.appointment_id,
    status: raw.status,
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

export async function markAvailabilityAsOngoing(
  availabilityId: string,
): Promise<DoctorAvailability> {
  const { data } = await apiClient.patch(
    `/api/doctors/availability/${availabilityId}/ongoing`,
  );
  return mapDoctorAvailability(data.data as DoctorAvailabilityRaw);
}

export async function markAvailabilityAsCompleted(
  availabilityId: string,
): Promise<DoctorAvailability> {
  const { data } = await apiClient.patch(
    `/api/doctors/availability/${availabilityId}/completed`,
  );
  return mapDoctorAvailability(data.data as DoctorAvailabilityRaw);
}

export async function getDoctorDaySchedules(doctorId: string): Promise<DoctorDaySchedule[]> {
  const availabilities = await getDoctorAvailability(doctorId);
  return availabilities.map((availability) => ({
    date: availability.date,
    consultationType: availability.consultationType,
    totalPatients: availability.slots.filter((slot) => slot.isBooked).length,
    status: availability.status,
    availabilityId: availability.id,
  }));
}

export async function getSessionPatientInfo(
  appointmentId: string,
): Promise<SessionPatientInfo | null> {
  try {
    const { data } = await apiClient.get(
      `/api/doctors/appointments/${appointmentId}/medical-records`,
    );
    if (!data?.data) return null;
    return mapPatientMedicalRecordToSessionPatient(
      data.data as DoctorPatientMedicalRecordRaw,
    );
  } catch {
    return null;
  }
}

export async function getAppointmentPrescriptions(
  appointmentId: string,
  doctorName: string,
  doctorSpecialization: string,
): Promise<Prescription[]> {
  const { data } = await apiClient.get(`/api/doctors/prescriptions/appointment/${appointmentId}`);
  const rows: DoctorPrescriptionRaw[] = data.data ?? [];
  return rows.map((row) => mapPrescriptionRawToPrescription(row, doctorName, doctorSpecialization));
}

export async function getDoctorPrescriptions(
  doctorName: string,
  doctorSpecialization: string,
): Promise<Prescription[]> {
  const { data } = await apiClient.get('/api/doctors/prescriptions');
  const rows: DoctorPrescriptionRaw[] = data.data ?? [];
  return rows.map((row) => mapPrescriptionRawToPrescription(row, doctorName, doctorSpecialization));
}

export async function createAppointmentPrescription(
  request: CreateAppointmentPrescriptionRequest,
  doctorName: string,
  doctorSpecialization: string,
): Promise<Prescription> {
  const instructionLabelByType: Record<string, string> = {
    before_meal: 'Before meal',
    after_meal: 'After meal',
    with_meal: 'With meal',
    before_sleep: 'Before sleep',
  };

  const payload = {
    diagnosis: request.diagnosis,
    medications: request.medications.map((medicine) => ({
      medicine_name: medicine.name,
      dosage_mg: medicine.dosageMg,
      dosage_unit: 'mg',
      dosage: `${medicine.dosageMg} mg/day`,
      frequency: {
        morning: medicine.frequency.morning,
        day: medicine.frequency.day,
        night: medicine.frequency.night,
        custom: medicine.frequency.custom?.trim() || undefined,
      },
      frequency_text: [
        medicine.frequency.morning ? 'Morning' : '',
        medicine.frequency.day ? 'Day' : '',
        medicine.frequency.night ? 'Night' : '',
        medicine.frequency.custom?.trim() || '',
      ].filter(Boolean).join(', '),
      duration: medicine.duration,
      instruction_type: medicine.instructionType,
      instruction_text:
        medicine.instructionType === 'custom'
          ? medicine.customInstruction?.trim() || ''
          : instructionLabelByType[medicine.instructionType] || '',
      instructions:
        medicine.instructionType === 'custom'
          ? medicine.customInstruction?.trim() || ''
          : instructionLabelByType[medicine.instructionType] || '',
    })),
    notes: request.notes ?? '',
  };

  const { data } = await apiClient.post(
    `/api/doctors/prescriptions/appointment/${request.appointmentId}`,
    payload,
  );

  return mapPrescriptionRawToPrescription(
    data.data as DoctorPrescriptionRaw,
    doctorName,
    doctorSpecialization,
  );
}

export async function cancelPrescription(
  prescriptionId: string,
  doctorName: string,
  doctorSpecialization: string,
): Promise<Prescription> {
  const { data } = await apiClient.patch(`/api/doctors/prescriptions/${prescriptionId}/cancel`);
  return mapPrescriptionRawToPrescription(
    data.data as DoctorPrescriptionRaw,
    doctorName,
    doctorSpecialization,
  );
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
