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

const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-001',
    doctorName: 'Dr. Suresh Fernando',
    doctorSpecialization: 'General Physician',
    date: '2025-03-10',
    medicines: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: '7 days', instructions: 'Take with food' },
      { name: 'Paracetamol', dosage: '500mg', frequency: 'As needed (max 4 times/day)', duration: '5 days', instructions: 'Do not exceed 2g/day' },
    ],
    notes: 'Patient presented with upper respiratory tract infection. Adequate rest and hydration advised.',
    appointmentId: 'apt-001',
  },
  {
    id: 'rx-002',
    doctorName: 'Dr. Nirmala Jayawardena',
    doctorSpecialization: 'Pulmonologist',
    date: '2025-01-18',
    medicines: [
      { name: 'Salbutamol', dosage: '100mcg', frequency: 'As needed', duration: 'Ongoing', instructions: 'Use inhaler as directed' },
      { name: 'Budesonide', dosage: '200mcg', frequency: 'Twice daily', duration: '30 days', instructions: 'Rinse mouth after use' },
    ],
    notes: 'Asthma management plan updated. Peak flow monitoring recommended.',
    appointmentId: 'apt-002',
  },
];

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

// TODO: Replace with real API endpoint
export async function getPrescriptions(patientId: string): Promise<Prescription[]> {
  await new Promise((r) => setTimeout(r, 500));
  void patientId;
  return MOCK_PRESCRIPTIONS;
}

// TODO: Replace with real API endpoint
export async function getMedicalDocuments(patientId: string): Promise<MedicalDocument[]> {
  const profile = await getPatientProfile(patientId);
  return profile?.medicalDocuments ?? [];
}

// TODO: Replace with real API endpoint
export async function uploadMedicalDocument(file: File): Promise<MedicalDocument> {
  await new Promise((r) => setTimeout(r, 1200));
  return {
    id: `doc-${Date.now()}`,
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
