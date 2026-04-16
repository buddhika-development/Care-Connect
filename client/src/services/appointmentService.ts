import { Appointment, BookingRequest } from '@/types/appointment';
import { AppointmentStatus } from '@/types/common';

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    patientId: 'patient-001',
    patientName: 'Kavindi Perera',
    patientImage: null,
    doctorId: 'doc-001',
    doctorName: 'Dr. Suresh Fernando',
    doctorSpecialization: 'General Physician',
    doctorImage: null,
    date: '2025-04-20',
    startTime: '10:00',
    endTime: '10:30',
    consultationType: 'physical',
    status: 'confirmed',
    fee: 2000,
    paymentId: 'pay-001',
  },
  {
    id: 'apt-002',
    patientId: 'patient-001',
    patientName: 'Kavindi Perera',
    patientImage: null,
    doctorId: 'doc-002',
    doctorName: 'Dr. Nirmala Jayawardena',
    doctorSpecialization: 'Pulmonologist',
    doctorImage: null,
    date: '2025-04-22',
    startTime: '14:30',
    endTime: '15:00',
    consultationType: 'online',
    status: 'confirmed',
    fee: 3500,
    paymentId: 'pay-002',
  },
  {
    id: 'apt-003',
    patientId: 'patient-001',
    patientName: 'Kavindi Perera',
    patientImage: null,
    doctorId: 'doc-003',
    doctorName: 'Dr. Chaminda Rajapaksa',
    doctorSpecialization: 'Cardiologist',
    doctorImage: null,
    date: '2025-03-10',
    startTime: '09:00',
    endTime: '09:30',
    consultationType: 'physical',
    status: 'completed',
    fee: 4500,
    paymentId: 'pay-003',
  },
  {
    id: 'apt-004',
    patientId: 'patient-001',
    patientName: 'Kavindi Perera',
    patientImage: null,
    doctorId: 'doc-004',
    doctorName: 'Dr. Dilani Wickramasinghe',
    doctorSpecialization: 'Dermatologist',
    doctorImage: null,
    date: '2025-02-15',
    startTime: '11:00',
    endTime: '11:30',
    consultationType: 'online',
    status: 'cancelled',
    fee: 3000,
    paymentId: 'pay-004',
  },
  {
    id: 'apt-005',
    patientId: 'patient-001',
    patientName: 'Kavindi Perera',
    patientImage: null,
    doctorId: 'doc-001',
    doctorName: 'Dr. Suresh Fernando',
    doctorSpecialization: 'General Physician',
    doctorImage: null,
    date: '2025-04-16',
    startTime: '09:30',
    endTime: '10:00',
    consultationType: 'online',
    status: 'ongoing',
    fee: 2000,
    paymentId: 'pay-005',
  },
];

// Doctor-view appointments by date
const MOCK_DOCTOR_DAY_APPOINTMENTS: Record<string, Appointment[]> = {
  '2025-04-21': [
    {
      id: 'apt-d-001',
      patientId: 'pat-001',
      patientName: 'Kavindi Perera',
      patientImage: null,
      doctorId: 'doc-001',
      doctorName: 'Dr. Suresh Fernando',
      doctorSpecialization: 'General Physician',
      doctorImage: null,
      date: '2025-04-21',
      startTime: '09:00',
      endTime: '09:30',
      consultationType: 'physical',
      status: 'confirmed',
      fee: 2000,
      paymentId: 'pay-d-001',
    },
    {
      id: 'apt-d-002',
      patientId: 'pat-002',
      patientName: 'Nuwan Karunarathne',
      patientImage: null,
      doctorId: 'doc-001',
      doctorName: 'Dr. Suresh Fernando',
      doctorSpecialization: 'General Physician',
      doctorImage: null,
      date: '2025-04-21',
      startTime: '10:00',
      endTime: '10:30',
      consultationType: 'physical',
      status: 'confirmed',
      fee: 2000,
      paymentId: 'pay-d-002',
    },
    {
      id: 'apt-d-003',
      patientId: 'pat-003',
      patientName: 'Sachini Bandara',
      patientImage: null,
      doctorId: 'doc-001',
      doctorName: 'Dr. Suresh Fernando',
      doctorSpecialization: 'General Physician',
      doctorImage: null,
      date: '2025-04-21',
      startTime: '11:30',
      endTime: '12:00',
      consultationType: 'physical',
      status: 'confirmed',
      fee: 2000,
      paymentId: 'pay-d-003',
    },
  ],
};

// TODO: Replace with real API endpoint
export async function getAppointments(userId: string, role: 'patient' | 'doctor'): Promise<Appointment[]> {
  await new Promise((r) => setTimeout(r, 600));
  void userId; void role;
  return MOCK_APPOINTMENTS;
}

// TODO: Replace with real API endpoint
export async function getAppointmentById(appointmentId: string): Promise<Appointment | null> {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_APPOINTMENTS.find(a => a.id === appointmentId)
    ?? MOCK_DOCTOR_DAY_APPOINTMENTS['2025-04-21']?.find(a => a.id === appointmentId)
    ?? null;
}

// TODO: Replace with real API endpoint
export async function createAppointment(data: BookingRequest): Promise<Appointment> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    id: `apt-${Date.now()}`,
    patientId: 'patient-001',
    patientName: 'Kavindi Perera',
    patientImage: null,
    doctorId: data.doctorId,
    doctorName: 'Dr. Suresh Fernando',
    doctorSpecialization: 'General Physician',
    doctorImage: null,
    date: data.date,
    startTime: '09:00',
    endTime: '09:30',
    consultationType: data.consultationType,
    status: 'pending',
    fee: 2000,
    paymentId: '',
  };
}

// TODO: Replace with real API endpoint
export async function cancelAppointment(appointmentId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 600));
  void appointmentId;
}

// TODO: Replace with real API endpoint
export async function rescheduleAppointment(appointmentId: string, newSlotId: string, newDate: string): Promise<Appointment> {
  await new Promise((r) => setTimeout(r, 700));
  void newSlotId;
  const apt = MOCK_APPOINTMENTS.find(a => a.id === appointmentId)!;
  return { ...apt, date: newDate, status: 'confirmed' };
}

// TODO: Replace with real API endpoint
export async function startSession(appointmentId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 500));
  void appointmentId;
}

// TODO: Replace with real API endpoint
export async function completeSession(
  appointmentId: string,
  prescription: { medicines: unknown[]; notes: string }
): Promise<void> {
  await new Promise((r) => setTimeout(r, 700));
  void appointmentId; void prescription;
}

// TODO: Replace with real API endpoint
export async function getDoctorDayAppointments(doctorId: string, date: string): Promise<Appointment[]> {
  await new Promise((r) => setTimeout(r, 500));
  void doctorId;
  return MOCK_DOCTOR_DAY_APPOINTMENTS[date] ?? [];
}

// TODO: Replace with real API endpoint
export async function getAdminAppointments(): Promise<Appointment[]> {
  await new Promise((r) => setTimeout(r, 600));
  return [
    ...MOCK_APPOINTMENTS,
    ...(MOCK_DOCTOR_DAY_APPOINTMENTS['2025-04-21'] ?? []),
  ];
}
