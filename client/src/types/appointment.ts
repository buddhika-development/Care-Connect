import { AppointmentStatus, ConsultationType } from './common';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientImage: string | null;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorImage: string | null;
  date: string;
  startTime: string;
  endTime: string;
  consultationType: ConsultationType;
  status: AppointmentStatus;
  fee: number;
  paymentId: string;
  countdownExpiry?: string; // For gateway crash simulation
  sessionNotes?: string;
}

export interface BookingRequest {
  doctorId: string;
  date: string;
  slotId: string;
  consultationType: ConsultationType;
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
