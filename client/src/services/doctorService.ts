import { apiClient } from '@/lib/axios';
import {
  DoctorCard,
  DoctorProfile,
  DoctorAvailability,
  DoctorDaySchedule,
  DoctorProfileFull,
  transformDoctorFull,
} from '@/types/doctor';
import { SessionPatientInfo } from '@/types/appointment';

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

const MOCK_DOCTOR_PROFILE: DoctorProfile = {
  id: 'doc-001',
  userId: 'doctor-001',
  firstName: 'Suresh',
  lastName: 'Fernando',
  email: 'suresh.fernando@colombogeneral.lk',
  phone: '+94 77 234 5678',
  dateOfBirth: '1978-07-20',
  gender: 'Male',
  specialization: 'General Physician',
  medicalLicenseNumber: 'SLMC-4521',
  currentHospital: 'Colombo General Hospital',
  yearsOfExperience: 18,
  consultationFee: 2000,
  bio: 'Experienced general physician with over 18 years of practice at Colombo General Hospital.',
  profileImage: null,
  isCompleted: true,
  isVerified: true,
};

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

// TODO: Replace with real API endpoint
export async function getDoctorProfile(userId: string): Promise<DoctorProfile> {
  await new Promise((r) => setTimeout(r, 500));
  void userId;
  return MOCK_DOCTOR_PROFILE;
}

// TODO: Replace with real API endpoint
export async function updateDoctorProfile(data: Partial<DoctorProfile>): Promise<DoctorProfile> {
  await new Promise((r) => setTimeout(r, 800));
  return { ...MOCK_DOCTOR_PROFILE, ...data };
}

// TODO: Replace with real API endpoint
export async function getDoctorAvailability(doctorId: string): Promise<DoctorAvailability[]> {
  await new Promise((r) => setTimeout(r, 500));
  void doctorId;
  return [];
}

// TODO: Replace with real API endpoint
export async function createAvailability(data: Omit<DoctorAvailability, 'id' | 'slots'>): Promise<DoctorAvailability> {
  await new Promise((r) => setTimeout(r, 800));
  return { ...data, id: `avail-${Date.now()}`, slots: [] };
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
