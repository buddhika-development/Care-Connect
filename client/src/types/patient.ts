export interface PatientProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  bloodType: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  profileImage: string | null;
  medicalDocuments: MedicalDocument[];
  isCompleted: boolean;
}

export interface MedicalDocument {
  id: string;
  fileName: string;
  uploadDate: string;
  fileUrl: string;
  fileSize: string;
  storagePath?: string;
}

export interface MedicalDocumentSummary {
  id: string;
  userId: string;
  documentId: string;
  documentSummary: string;
  createdDatetime: string;
  updatedDatetime: string;
}

export interface Prescription {
  id: string;
  patientId?: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  diagnosis?: string;
  medicines: PrescriptionMedicine[];
  notes: string;
  appointmentId: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface ActivityItem {
  id: string;
  type: 'appointment' | 'prescription' | 'document' | 'payment';
  title: string;
  description: string;
  timestamp: string;
}
