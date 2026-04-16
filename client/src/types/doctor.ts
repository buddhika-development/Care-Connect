import { ConsultationType } from './common';

export interface DoctorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  specialization: string;
  medicalLicenseNumber: string;
  currentHospital: string;
  yearsOfExperience: number;
  consultationFee: number;
  bio: string;
  profileImage: string | null;
  isCompleted: boolean;
  isVerified: boolean;
}

export interface DoctorCard {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  currentHospital: string;
  consultationFee: number;
  profileImage: string | null;
  availableConsultationTypes: ConsultationType[];
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  date: string;
  consultationType: ConsultationType;
  startTime: string;
  endTime: string;
  slotDuration: number;
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
