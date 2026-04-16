import { DoctorProfile, DoctorCard, DoctorAvailability, DoctorDaySchedule } from '@/types/doctor';
import { SessionPatientInfo } from '@/types/appointment';

const MOCK_DOCTORS: DoctorCard[] = [
  { id: 'doc-001', firstName: 'Suresh', lastName: 'Fernando', specialization: 'General Physician', currentHospital: 'Colombo General Hospital', consultationFee: 2000, profileImage: null, availableConsultationTypes: ['physical', 'online'] },
  { id: 'doc-002', firstName: 'Nirmala', lastName: 'Jayawardena', specialization: 'Pulmonologist', currentHospital: 'Lanka Hospitals', consultationFee: 3500, profileImage: null, availableConsultationTypes: ['physical', 'online'] },
  { id: 'doc-003', firstName: 'Chaminda', lastName: 'Rajapaksa', specialization: 'Cardiologist', currentHospital: 'Nawaloka Hospital', consultationFee: 4500, profileImage: null, availableConsultationTypes: ['physical'] },
  { id: 'doc-004', firstName: 'Dilani', lastName: 'Wickramasinghe', specialization: 'Dermatologist', currentHospital: 'Asiri Medical Hospital', consultationFee: 3000, profileImage: null, availableConsultationTypes: ['physical', 'online'] },
  { id: 'doc-005', firstName: 'Pradeep', lastName: 'Gunawardena', specialization: 'Orthopedic Surgeon', currentHospital: 'Durdans Hospital', consultationFee: 5000, profileImage: null, availableConsultationTypes: ['physical'] },
  { id: 'doc-006', firstName: 'Sandya', lastName: 'Mendis', specialization: 'Pediatrician', currentHospital: 'Lady Ridgeway Hospital', consultationFee: 2500, profileImage: null, availableConsultationTypes: ['physical', 'online'] },
  { id: 'doc-007', firstName: 'Ruwan', lastName: 'Samarasinghe', specialization: 'Neurologist', currentHospital: 'National Hospital of Sri Lanka', consultationFee: 4000, profileImage: null, availableConsultationTypes: ['online'] },
];

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
  bio: 'Experienced general physician with over 18 years of practice at Colombo General Hospital. Special interest in preventive medicine and chronic disease management.',
  profileImage: null,
  isCompleted: true,
  isVerified: true,
};

const MOCK_AVAILABILITY: DoctorAvailability[] = [
  {
    id: 'avail-001',
    doctorId: 'doc-001',
    date: '2025-04-21',
    consultationType: 'physical',
    startTime: '09:00',
    endTime: '12:00',
    slotDuration: 30,
    slots: [
      { id: 'slot-001', startTime: '09:00', endTime: '09:30', isBooked: true, patientName: 'Amara Silva' },
      { id: 'slot-002', startTime: '09:30', endTime: '10:00', isBooked: false },
      { id: 'slot-003', startTime: '10:00', endTime: '10:30', isBooked: true, patientName: 'Nuwan Karunarathne' },
      { id: 'slot-004', startTime: '10:30', endTime: '11:00', isBooked: false },
      { id: 'slot-005', startTime: '11:00', endTime: '11:30', isBooked: false },
      { id: 'slot-006', startTime: '11:30', endTime: '12:00', isBooked: true, patientName: 'Sachini Bandara' },
    ],
  },
  {
    id: 'avail-002',
    doctorId: 'doc-001',
    date: '2025-04-22',
    consultationType: 'online',
    startTime: '14:00',
    endTime: '17:00',
    slotDuration: 30,
    slots: [
      { id: 'slot-007', startTime: '14:00', endTime: '14:30', isBooked: false },
      { id: 'slot-008', startTime: '14:30', endTime: '15:00', isBooked: true, patientName: 'Harini Jayasena' },
      { id: 'slot-009', startTime: '15:00', endTime: '15:30', isBooked: false },
      { id: 'slot-010', startTime: '15:30', endTime: '16:00', isBooked: false },
      { id: 'slot-011', startTime: '16:00', endTime: '16:30', isBooked: false },
      { id: 'slot-012', startTime: '16:30', endTime: '17:00', isBooked: true, patientName: 'Lasith Malinga' },
    ],
  },
];

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
  { id: 'doc-003', firstName: 'Chaminda', lastName: 'Rajapaksa', email: 'chaminda.r@nawaloka.lk', specialization: 'Cardiologist', currentHospital: 'Nawaloka Hospital', isVerified: false },
  { id: 'doc-004', firstName: 'Dilani', lastName: 'Wickramasinghe', email: 'dilani.w@asiri.lk', specialization: 'Dermatologist', currentHospital: 'Asiri Medical Hospital', isVerified: false },
  { id: 'doc-005', firstName: 'Pradeep', lastName: 'Gunawardena', email: 'pradeep.g@durdans.lk', specialization: 'Orthopedic Surgeon', currentHospital: 'Durdans Hospital', isVerified: true },
  { id: 'doc-006', firstName: 'Sandya', lastName: 'Mendis', email: 'sandya.m@lrh.gov.lk', specialization: 'Pediatrician', currentHospital: 'Lady Ridgeway Hospital', isVerified: true },
];

// TODO: Replace with real API endpoint
export async function getDoctors(query?: string, specialization?: string): Promise<DoctorCard[]> {
  await new Promise((r) => setTimeout(r, 600));
  let results = MOCK_DOCTORS;
  if (query) results = results.filter(d => `${d.firstName} ${d.lastName}`.toLowerCase().includes(query.toLowerCase()));
  if (specialization) results = results.filter(d => d.specialization === specialization);
  return results;
}

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
  return MOCK_AVAILABILITY;
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
