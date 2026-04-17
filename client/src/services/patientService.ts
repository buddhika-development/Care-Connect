import { apiClient } from '@/lib/axios';
import { PatientProfile, Prescription, MedicalDocument, ActivityItem } from '@/types/patient';

type PatientProfileRaw = {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  contact_no: string;
  address: string;
  birthday: string;
  age: number;
  gender: string;
  blood_type: string | null;
  emergency_contact_name: string | null;
  emergency_contact_no: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  current_medications: string[] | null;
  profile_img_url: string | null;
  medical_report_urls: Array<string | { path?: string | null; signedUrl?: string | null }> | null;
};

type PatientPrescriptionRaw = {
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
  doctor_name?: string;
  doctor_specialization?: string;
};

function getFileNameFromPathOrUrl(value: string, fallback: string): string {
  try {
    const source = value.includes('?') ? value.split('?')[0] : value;
    const parts = source.split('/');
    const name = parts[parts.length - 1];
    return decodeURIComponent(name || fallback);
  } catch {
    return fallback;
  }
}

export interface PatientProfilePayload {
  email: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  address: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
}

export interface SavePatientProfileRequest {
  mode: 'create' | 'update';
  payload: PatientProfilePayload;
  profileImageFile?: File | null;
  medicalDocumentFiles?: File[];
  removedDocumentPaths?: string[];
}

function mapPatientRawToProfile(raw: PatientProfileRaw): PatientProfile {
  const documentEntries = raw.medical_report_urls ?? [];
  const medicalDocuments: MedicalDocument[] = documentEntries
    .map((entry, index) => {
      const fallback = `document-${index + 1}`;

      if (typeof entry === 'string') {
        const storagePath = entry.startsWith('http') ? undefined : entry;
        return {
          id: storagePath ?? `doc-${index + 1}`,
          fileName: getFileNameFromPathOrUrl(entry, `${fallback}.pdf`),
          uploadDate: new Date().toISOString().slice(0, 10),
          fileUrl: storagePath ? '#' : entry,
          fileSize: 'Unknown',
          storagePath,
        };
      }

      const url = entry?.signedUrl ?? '';
      if (!url) return null;

      const path = entry?.path ?? '';
      return {
        id: path || `doc-${index + 1}`,
        fileName: getFileNameFromPathOrUrl(path || url, `${fallback}.pdf`),
        uploadDate: new Date().toISOString().slice(0, 10),
        fileUrl: url,
        fileSize: 'Unknown',
        storagePath: path || undefined,
      };
    })
    .filter((doc): doc is MedicalDocument => Boolean(doc));

  return {
    id: raw.id,
    userId: raw.user_id,
    email: raw.email,
    firstName: raw.first_name,
    lastName: raw.last_name,
    phone: raw.contact_no,
    address: raw.address,
    dateOfBirth: raw.birthday,
    age: raw.age,
    gender: raw.gender,
    bloodType: raw.blood_type ?? '',
    emergencyContactName: raw.emergency_contact_name ?? '',
    emergencyContactNumber: raw.emergency_contact_no ?? '',
    allergies: raw.allergies ?? [],
    chronicConditions: raw.chronic_conditions ?? [],
    currentMedications: raw.current_medications ?? [],
    profileImage: raw.profile_img_url,
    medicalDocuments,
    isCompleted: true,
  };
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: 'act-001', type: 'appointment', title: 'Appointment Confirmed', description: 'With Dr. Suresh Fernando on 20 Apr 2025', timestamp: '2025-04-15T09:30:00Z' },
  { id: 'act-002', type: 'prescription', title: 'New Prescription Added', description: '2 medicines by Dr. Nirmala Jayawardena', timestamp: '2025-04-10T14:00:00Z' },
  { id: 'act-003', type: 'payment', title: 'Payment Successful', description: 'LKR 2,000 for cardiology consultation', timestamp: '2025-04-08T11:15:00Z' },
  { id: 'act-004', type: 'document', title: 'Document Uploaded', description: 'blood-test-results.pdf', timestamp: '2025-04-01T08:00:00Z' },
];

export async function getPatientProfile(userId: string): Promise<PatientProfile | null> {
  const { data } = await apiClient.get(`/api/patients/profile/${userId}`);
  if (!data?.data) return null;
  return mapPatientRawToProfile(data.data as PatientProfileRaw);
}

export async function savePatientProfile({
  mode,
  payload,
  profileImageFile,
  medicalDocumentFiles,
  removedDocumentPaths,
}: SavePatientProfileRequest): Promise<PatientProfile> {
  const endpoint = '/api/patients/profile';
  const formData = new FormData();

  formData.append('email', payload.email);
  formData.append('firstName', payload.firstName);
  formData.append('lastName', payload.lastName);
  formData.append('contactNumber', payload.contactNumber);
  formData.append('address', payload.address);
  formData.append('dateOfBirth', payload.dateOfBirth);
  formData.append('age', payload.age);
  formData.append('gender', payload.gender);
  formData.append('bloodType', payload.bloodType ?? '');
  formData.append('emergencyContactName', payload.emergencyContactName ?? '');
  formData.append('emergencyContactNumber', payload.emergencyContactNumber ?? '');
  formData.append('allergies', JSON.stringify(payload.allergies ?? []));
  formData.append('chronicConditions', JSON.stringify(payload.chronicConditions ?? []));
  formData.append('currentMedications', JSON.stringify(payload.currentMedications ?? []));

  if (profileImageFile) {
    formData.append('profileImage', profileImageFile);
  }

  for (const file of medicalDocumentFiles ?? []) {
    formData.append('medicalDocuments', file);
  }

  if ((removedDocumentPaths ?? []).length > 0) {
    formData.append('removedDocumentPaths', JSON.stringify(removedDocumentPaths));
  }

  const { data } = mode === 'create'
    ? await apiClient.post(endpoint, formData)
    : await apiClient.patch(endpoint, formData);
  return mapPatientRawToProfile(data.data as PatientProfileRaw);
}

function mapPatientPrescriptionRawToPrescription(raw: PatientPrescriptionRaw): Prescription {
  const instructionLabelByType: Record<string, string> = {
    before_meal: 'Before meal',
    after_meal: 'After meal',
    with_meal: 'With meal',
    before_sleep: 'Before sleep',
  };

  const getFrequencyLabel = (frequency: PatientPrescriptionRaw['medications'][number]['frequency']): string => {
    if (!frequency) return '';
    if (typeof frequency === 'string') return frequency;
    if (Array.isArray(frequency)) return frequency.join(', ');

    const parts: string[] = [];
    if (frequency.morning) parts.push('Morning');
    if (frequency.day) parts.push('Day');
    if (frequency.night) parts.push('Night');
    if (frequency.custom && frequency.custom.trim()) parts.push(frequency.custom.trim());
    return parts.join(', ');
  };

  const getInstructionLabel = (medicine: PatientPrescriptionRaw['medications'][number]): string => {
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

  const getDosageLabel = (medicine: PatientPrescriptionRaw['medications'][number]): string => {
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
    doctorName: raw.doctor_name || 'Doctor',
    doctorSpecialization: raw.doctor_specialization || '',
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

export async function getPrescriptions(patientId: string): Promise<Prescription[]> {
  void patientId;
  const { data } = await apiClient.get('/api/doctors/prescriptions/patient/my');
  const rows: PatientPrescriptionRaw[] = data.data ?? [];
  return rows.map(mapPatientPrescriptionRawToPrescription);
}

export async function getMedicalDocuments(patientId: string): Promise<MedicalDocument[]> {
  const profile = await getPatientProfile(patientId);
  return profile?.medicalDocuments ?? [];
}

export async function uploadMedicalDocument(file: File): Promise<MedicalDocument> {
  const tempName = `temp-${Date.now()}-${file.name}`;
  return {
    id: tempName,
    fileName: file.name,
    uploadDate: new Date().toISOString().split('T')[0],
    fileUrl: '#',
    fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
  };
}

// TODO: Replace with real API endpoint
export async function getRecentActivity(patientId: string): Promise<ActivityItem[]> {
  await new Promise((r) => setTimeout(r, 400));
  void patientId;
  return MOCK_ACTIVITY;
}
